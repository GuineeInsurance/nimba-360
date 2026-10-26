import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

const statusElements = document.querySelectorAll('[data-connection-status]');

try {
  const response = await fetch('firebase-config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuration Firebase indisponible.');
  const config = await response.json();
  const firebaseApp = initializeApp(config);
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  let activeUser = null;
  let adminRecords = [];
  let activeRecord = null;
  let selectedFilter = 'all';
  let selectedView = 'all';

  const slugify = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cleanCity = (value = '') => value.replace(/\s*\(à vérifier\)\s*/i, '').trim();
  const authMessage = (error) => {
    const messages = {
      'auth/email-already-in-use': 'Un compte utilise déjà cette adresse e-mail.',
      'auth/invalid-credential': 'Adresse e-mail ou mot de passe incorrect.',
      'auth/invalid-email': 'Saisissez une adresse e-mail valide.',
      'auth/weak-password': 'Choisissez un mot de passe d’au moins 8 caractères.',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez un peu plus tard.',
    };
    return messages[error.code] || 'La connexion a échoué. Réessayez.';
  };

  const modal = document.querySelector('[data-auth-modal]');
  const authForm = document.querySelector('[data-auth-form]');
  const authFeedback = document.querySelector('[data-auth-feedback]');
  const modeButton = document.querySelector('[data-auth-mode]');
  const adminShell = document.querySelector('[data-admin-shell]');
  const adminGateMessage = document.querySelector('[data-admin-gate-message]');
  const adminSignOutButton = document.querySelector('[data-admin-signout]');
  let createMode = false;

  const setAdminGate = (state, message = '') => {
    if (!adminShell) return;
    const allowed = state === 'allowed';
    document.body.classList.toggle('admin-locked', !allowed);
    adminShell.setAttribute('aria-hidden', String(!allowed));
    if (adminGateMessage && message) adminGateMessage.textContent = message;
    document.querySelectorAll('[data-admin-gate] [data-auth-open]').forEach((button) => {
      button.hidden = state !== 'signed-out';
    });
    if (adminSignOutButton) adminSignOutButton.hidden = state !== 'denied';
  };

  const openModal = () => {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => authForm?.elements.email?.focus(), 20);
  };
  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  };
  document.querySelectorAll('[data-auth-open]').forEach((button) => button.addEventListener('click', openModal));
  adminSignOutButton?.addEventListener('click', () => signOut(auth));
  document.querySelector('[data-auth-close]')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => event.target === modal && closeModal());
  modeButton?.addEventListener('click', () => {
    createMode = !createMode;
    const nameField = authForm?.elements.displayName?.closest('.field');
    if (nameField) nameField.hidden = !createMode;
    modal.querySelector('h2').textContent = createMode ? 'Créez votre compte' : 'Connectez-vous';
    modal.querySelector('.auth-submit').textContent = createMode ? 'Créer mon compte' : 'Se connecter';
    modeButton.textContent = createMode ? 'J’ai déjà un compte — me connecter' : 'Pas encore de compte ? Créer un compte';
  });

  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    authFeedback.textContent = '';
    const values = Object.fromEntries(new FormData(authForm));
    const forceSignIn = values.mode === 'signin';
    try {
      if (createMode && !forceSignIn) {
        const credential = await createUserWithEmailAndPassword(auth, values.email.trim(), values.password);
        const displayName = values.displayName?.trim() || '';
        if (displayName) await updateProfile(credential.user, { displayName });
        await setDoc(doc(db, 'users', credential.user.uid), {
          displayName,
          email: credential.user.email || '',
          photoUrl: '',
          preferredCityId: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, values.email.trim(), values.password);
      }
      authForm.reset();
      closeModal();
    } catch (error) {
      authFeedback.textContent = authMessage(error);
      authFeedback.style.color = '#b90e24';
    }
  });

  async function submitBusiness(values) {
    if (!activeUser) throw new Error('Connectez-vous avant d’envoyer votre fiche.');
    const reference = await addDoc(collection(db, 'submissions'), {
      submitterId: activeUser.uid,
      name: values.name.trim(),
      categoryId: slugify(values.category),
      cityId: slugify(values.city),
      communeId: slugify(values.commune),
      address: values.address.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || activeUser.email || '',
      website: values.website?.trim() || '',
      whatsapp: values.whatsapp?.trim() || '',
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      description: values.description?.trim() || '',
      imagePaths: [],
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return reference.id;
  }

  async function requestDeletion(reason) {
    if (!activeUser) throw new Error('Connectez-vous au compte concerné.');
    await setDoc(doc(db, 'deletionRequests', activeUser.uid), {
      userId: activeUser.uid,
      email: activeUser.email || '',
      reason: reason?.trim() || '',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const recordStatus = (record) => record.reviewStatus || (record.status === 'pending' ? 'review_required' : record.status) || 'review_required';
  const statusLabel = (status) => ({
    review_required: 'À vérifier',
    pending: 'À vérifier',
    in_review: 'En cours',
    duplicate: 'Doublon',
    rejected: 'Refusée',
    correction_required: 'Correction requise',
    approved: 'Publiée',
  }[status] || status);
  const statusClass = (status) => status === 'approved' ? 'approved' : status === 'duplicate' ? 'duplicate' : status === 'rejected' ? 'rejected' : 'pending';

  function updateMetrics() {
    const sourceRecords = adminRecords.filter((record) => record.recordType === 'source');
    const pending = adminRecords.filter((record) => ['review_required', 'pending', 'in_review', 'correction_required'].includes(recordStatus(record))).length;
    document.querySelector('#metric-total').textContent = sourceRecords.length.toLocaleString('fr-FR');
    document.querySelector('#metric-duplicates').textContent = sourceRecords.filter((record) => record.duplicateAlert && recordStatus(record) !== 'approved').length.toLocaleString('fr-FR');
    document.querySelector('#metric-pending').textContent = pending.toLocaleString('fr-FR');
    document.querySelector('#metric-approved').textContent = adminRecords.filter((record) => recordStatus(record) === 'approved').length.toLocaleString('fr-FR');
  }

  function viewMatches(record) {
    const status = recordStatus(record);
    if (selectedView === 'duplicate') return status === 'duplicate' || (record.duplicateAlert && status !== 'approved');
    if (selectedView === 'approved') return status === 'approved';
    if (selectedView === 'rejected') return status === 'rejected';
    if (selectedView === 'source') return record.recordType === 'source';
    if (selectedView === 'submissions') return record.recordType === 'submission';
    return true;
  }

  function renderAdminRows() {
    const tbody = document.querySelector('#review-rows');
    if (!tbody) return;
    const search = document.querySelector('#review-search')?.value.trim().toLocaleLowerCase('fr') || '';
    const visible = adminRecords.filter((record) => {
      const status = recordStatus(record);
      const filterMatches = selectedFilter === 'all'
        || status === selectedFilter
        || (selectedFilter === 'duplicate' && record.duplicateAlert && status !== 'approved');
      const searchable = [record.name, record.category, record.categoryLabel, record.city, record.district, record.communeId, record.phone, record.email].join(' ').toLocaleLowerCase('fr');
      return viewMatches(record) && filterMatches && (!search || searchable.includes(search));
    });

    tbody.innerHTML = '';
    visible.forEach((record) => {
      const status = recordStatus(record);
      const row = document.createElement('tr');
      const initials = (record.name || '?').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
      row.dataset.recordId = record.id;
      row.dataset.collection = record.collectionName;
      row.innerHTML = `<td><div class="business-cell"><span class="business-initial">${escapeHtml(initials)}</span><span><b>${escapeHtml(record.name || 'Sans nom')}</b><small>${escapeHtml(record.category || record.categoryLabel || record.categoryId || 'Non classé')}</small></span></div></td><td>${escapeHtml(record.district || record.communeId || '')}${record.district || record.communeId ? ', ' : ''}${escapeHtml(cleanCity(record.city || record.cityId || ''))}</td><td><span class="source-pill">${record.recordType === 'source' ? 'OpenStreetMap' : 'Soumission web'}</span></td><td><span class="status ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span></td><td>${record.duplicateAlert ? '<span class="duplicate-signal">À comparer</span>' : '<span class="no-signal">—</span>'}</td><td class="action-link">Examiner →</td>`;
      row.addEventListener('click', () => openReview(record));
      tbody.appendChild(row);
    });

    const empty = document.querySelector('#admin-empty');
    empty.hidden = visible.length > 0;
    document.querySelector('#records-shown').textContent = `${visible.length.toLocaleString('fr-FR')} fiche${visible.length > 1 ? 's' : ''}`;
  }

  async function loadAdminData(user) {
    if (!document.querySelector('#review-rows')) return;
    const token = await user.getIdTokenResult(true);
    if (token.claims.admin !== true) {
      setStatus('Compte connecté sans rôle administrateur', 'warning');
      return;
    }
    setStatus('Chargement des données privées…');
    const [sourceSnapshot, submissionSnapshot] = await Promise.all([
      getDocs(collection(db, 'businessRecords')),
      getDocs(query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(200))),
    ]);
    adminRecords = [
      ...sourceSnapshot.docs.map((record) => ({ id: record.id, collectionName: 'businessRecords', recordType: 'source', ...record.data() })),
      ...submissionSnapshot.docs.map((record) => ({ id: record.id, collectionName: 'submissions', recordType: 'submission', ...record.data() })),
    ];
    adminRecords.sort((a, b) => {
      const aRank = recordStatus(a) === 'approved' ? 2 : a.duplicateAlert ? 0 : 1;
      const bRank = recordStatus(b) === 'approved' ? 2 : b.duplicateAlert ? 0 : 1;
      return aRank - bRank || String(a.name || '').localeCompare(String(b.name || ''), 'fr');
    });
    updateMetrics();
    renderAdminRows();
    setStatus(`Firestore connecté — ${adminRecords.length.toLocaleString('fr-FR')} fiches`, 'success');
  }

  function normalizedRecord(record) {
    return {
      name: record.name || '',
      category: record.category || record.categoryLabel || record.categoryId || '',
      subcategory: record.subcategory || '',
      city: record.city || record.cityId || '',
      district: record.district || record.communeId || '',
      streetAddress: record.streetAddress || record.address || '',
      phone: record.phone || '',
      whatsapp: record.whatsapp || '',
      email: record.email || '',
      website: record.website || '',
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      apipVerification: record.apipVerification || 'not_checked',
      rccm: record.rccm || '',
      verificationSource: record.verificationSource || '',
      comments: record.comments || '',
    };
  }

  function openReview(record) {
    activeRecord = record;
    const drawer = document.querySelector('#review-drawer');
    const form = document.querySelector('#review-form');
    const values = normalizedRecord(record);
    Object.entries(values).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field) field.value = Number.isNaN(value) ? '' : value;
    });
    const checks = record.verificationChecks || {};
    form.elements.checkIdentity.checked = Boolean(checks.identity);
    form.elements.checkContact.checked = Boolean(checks.contact);
    form.elements.checkLocation.checked = Boolean(checks.location);
    form.elements.checkDuplicate.checked = Boolean(checks.duplicate);
    document.querySelector('#drawer-name').textContent = record.name || 'Sans nom';
    document.querySelector('#drawer-record-type').textContent = record.recordType === 'source' ? 'Fiche source importée' : 'Soumission d’entreprise';
    const status = recordStatus(record);
    const statusElement = document.querySelector('#drawer-status');
    statusElement.textContent = statusLabel(status);
    statusElement.className = `status ${statusClass(status)}`;
    const sourceLink = document.querySelector('#drawer-source-link');
    sourceLink.hidden = !record.sourceUrl;
    sourceLink.href = record.sourceUrl || '#';
    document.querySelector('#drawer-source-meta').innerHTML = record.recordType === 'source'
      ? `<b>Provenance</b><span>OpenStreetMap · ${escapeHtml(record.sourceId || '')}</span><span>${escapeHtml(record.duplicateReason || 'Aucun signal automatique de doublon')}</span>`
      : `<b>Provenance</b><span>Formulaire entreprise · ${escapeHtml(record.submitterId || '')}</span>`;
    const notice = document.querySelector('[data-review-notice]');
    notice.textContent = 'Les modifications sont enregistrées dans la fiche privée avant publication.';
    notice.removeAttribute('data-state');
    drawer.classList.add('open');
    document.querySelector('#drawer-overlay').classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeReview() {
    const drawer = document.querySelector('#review-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    document.querySelector('#drawer-overlay').classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    activeRecord = null;
  }

  function reviewValues() {
    const form = document.querySelector('#review-form');
    const values = Object.fromEntries(new FormData(form));
    return {
      name: values.name.trim(),
      category: values.category.trim(),
      subcategory: values.subcategory.trim(),
      city: values.city.trim(),
      district: values.district.trim(),
      streetAddress: values.streetAddress.trim(),
      phone: values.phone.trim(),
      whatsapp: values.whatsapp.trim(),
      email: values.email.trim(),
      website: values.website.trim(),
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      apipVerification: values.apipVerification,
      rccm: values.rccm.trim(),
      verificationSource: values.verificationSource.trim(),
      comments: values.comments.trim(),
      verificationChecks: {
        identity: form.elements.checkIdentity.checked,
        contact: form.elements.checkContact.checked,
        location: form.elements.checkLocation.checked,
        duplicate: form.elements.checkDuplicate.checked,
      },
    };
  }

  async function reviewRecord(action) {
    if (!activeUser || !activeRecord) return;
    const token = await activeUser.getIdTokenResult();
    if (token.claims.admin !== true) throw new Error('Rôle administrateur requis.');
    const notice = document.querySelector('[data-review-notice]');
    const buttons = [...document.querySelectorAll('[data-review-action]')];
    try {
      const values = reviewValues();
      if (!values.name || !values.category || !values.city || !Number.isFinite(values.latitude) || !Number.isFinite(values.longitude)) {
        throw new Error('Le nom, la catégorie, la ville et les coordonnées sont obligatoires.');
      }
      if (action === 'approved' && (!values.verificationChecks.identity || !values.verificationChecks.location)) {
        throw new Error('Confirmez au minimum l’identité et la localisation avant publication.');
      }
      if (action === 'approved' && activeRecord.duplicateAlert && !values.verificationChecks.duplicate) {
        throw new Error('Examinez et confirmez le signal de doublon avant publication.');
      }

      buttons.forEach((button) => { button.disabled = true; });
      notice.textContent = 'Enregistrement en cours…';
      const nextStatus = action === 'save' ? (recordStatus(activeRecord) === 'approved' ? 'approved' : 'in_review') : action;
      const batch = writeBatch(db);
      const recordRef = doc(db, activeRecord.collectionName, activeRecord.id);
      const recordUpdate = {
        ...values,
        reviewerId: activeUser.uid,
        reviewerEmail: activeUser.email || '',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (activeRecord.collectionName === 'businessRecords') recordUpdate.reviewStatus = nextStatus;
      else recordUpdate.status = nextStatus === 'review_required' ? 'pending' : nextStatus;

      if (action === 'approved') {
        const businessId = activeRecord.businessId || activeRecord.id;
        batch.set(doc(db, 'businesses', businessId), {
          name: values.name,
          normalizedName: slugify(values.name),
          categoryId: slugify(values.category),
          categoryLabel: values.category,
          cityId: slugify(cleanCity(values.city)),
          city: cleanCity(values.city),
          address: [values.streetAddress, values.district].filter(Boolean).join(', '),
          phone: values.phone,
          latitude: values.latitude,
          longitude: values.longitude,
          rating: 0,
          reviewCount: 0,
          verified: true,
          services: [],
          imageUrl: '',
          description: activeRecord.description || '',
          status: 'approved',
          createdAt: activeRecord.publishedAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        recordUpdate.businessId = businessId;
        recordUpdate.publishedAt = serverTimestamp();
      }

      batch.update(recordRef, recordUpdate);
      const auditRef = doc(collection(db, 'adminAudit'));
      batch.set(auditRef, {
        recordId: activeRecord.id,
        recordCollection: activeRecord.collectionName,
        businessId: recordUpdate.businessId || activeRecord.businessId || '',
        action,
        previousStatus: recordStatus(activeRecord),
        nextStatus,
        reviewerId: activeUser.uid,
        reviewerEmail: activeUser.email || '',
        notes: values.comments,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      notice.textContent = action === 'approved' ? 'Fiche approuvée et publiée dans NIMBA 360.' : 'Décision enregistrée.';
      notice.dataset.state = 'success';
      await loadAdminData(activeUser);
      if (action !== 'save') setTimeout(closeReview, 500);
    } catch (error) {
      notice.textContent = error.message || 'La mise à jour a échoué.';
      notice.dataset.state = 'error';
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  function setupAdminControls() {
    if (!document.querySelector('#review-rows')) return;
    document.querySelector('#review-search')?.addEventListener('input', renderAdminRows);
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      selectedFilter = button.dataset.filter;
      renderAdminRows();
    }));
    document.querySelectorAll('[data-admin-view]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-admin-view]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      selectedView = button.dataset.adminView;
      selectedFilter = 'all';
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item.dataset.filter === 'all'));
      renderAdminRows();
    }));
    document.querySelector('#review-drawer .drawer-close')?.addEventListener('click', closeReview);
    document.querySelector('#drawer-overlay')?.addEventListener('click', closeReview);
    document.querySelectorAll('[data-review-action]').forEach((button) => button.addEventListener('click', () => reviewRecord(button.dataset.reviewAction)));
  }

  function setStatus(message, kind = '') {
    statusElements.forEach((element) => {
      element.textContent = message;
      element.dataset.state = kind;
    });
  }

  function updateUserUi(user) {
    document.querySelectorAll('[data-auth-open]').forEach((button) => { button.hidden = Boolean(user); });
    document.querySelectorAll('[data-user-chip]').forEach((chip) => {
      chip.hidden = !user;
      chip.textContent = user ? `${user.displayName || user.email} · Déconnexion` : '';
      chip.onclick = user ? () => signOut(auth) : null;
    });
    const deletionForm = document.querySelector('[data-deletion-form]');
    const signedOut = document.querySelector('[data-deletion-signed-out]');
    if (deletionForm) deletionForm.hidden = !user;
    if (signedOut) signedOut.hidden = Boolean(user);
  }

  document.querySelector('[data-deletion-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.querySelector('[data-deletion-feedback]');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      await requestDeletion(values.reason);
      feedback.textContent = 'Votre demande a été enregistrée. Notre équipe vous contactera après vérification.';
      feedback.style.color = '#08704f';
      event.currentTarget.reset();
    } catch (error) {
      feedback.textContent = error.message || 'Impossible d’enregistrer la demande.';
      feedback.style.color = '#b90e24';
    }
  });

  setupAdminControls();
  window.g360Firebase = { currentUser: () => activeUser, submitBusiness, reviewRecord, requestDeletion };
  onAuthStateChanged(auth, async (user) => {
    activeUser = user;
    updateUserUi(user);
    if (!user) {
      setAdminGate('signed-out', 'Connectez-vous avec un compte disposant du rôle administrateur.');
      setStatus('Firebase connecté — identification requise');
      return;
    }
    try {
      if (adminShell) {
        setAdminGate('checking', 'Vérification de vos autorisations…');
        const token = await user.getIdTokenResult(true);
        if (token.claims.admin !== true) {
          setAdminGate('denied', 'Ce compte ne dispose pas du rôle administrateur.');
          setStatus('Accès administrateur refusé', 'warning');
          return;
        }
        setAdminGate('allowed');
      }
      setStatus('Connecté à Firebase', 'success');
      await loadAdminData(user);
    } catch (error) {
      console.error('Admin data load failed:', error);
      setAdminGate('denied', 'Impossible de vérifier les autorisations de ce compte.');
      setStatus('Accès Firestore refusé ou indisponible', 'warning');
    }
  });
} catch (error) {
  statusElements.forEach((element) => { element.textContent = 'Configuration Firebase indisponible'; });
  console.error('Firebase initialization failed:', error);
}

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}
