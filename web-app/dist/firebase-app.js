import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { setupAuth } from './auth-ui.js';
import { setupBusinessPortal } from './business-portal.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
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
  const adminShell = document.querySelector('[data-admin-shell]');
  const adminGateMessage = document.querySelector('[data-admin-gate-message]');
  const adminSignOutButton = document.querySelector('[data-admin-signout]');


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

  setupAuth(auth);
  adminSignOutButton?.addEventListener('click', () => signOut(auth));

  async function preparePhoto(file) {
    window.g360Registration.validatePhoto(file);
    if (!file?.size) return '';
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Impossible de lire cette photo.')); image.src = url; });
      const ratio = Math.min(1, 900 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio)); canvas.height = Math.max(1, Math.round(image.height * ratio));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.72, 0.55, 0.4, 0.25]) {
        const photo = canvas.toDataURL('image/jpeg', quality);
        if (photo.length <= 300000) return photo;
      }
      throw new Error('Choisissez une photo moins détaillée ou plus petite.');
    } finally { URL.revokeObjectURL(url); }
  }

  async function submitBusiness(values) {
    if (!activeUser) throw new Error('Connectez-vous avant d’envoyer votre fiche.');
    const userId = activeUser.uid;
    const fields = window.g360Registration.normalize(values);
    const portal = window.g360BusinessPortal;
    const editing = portal?.editRecord;
    const photo = values.businessPhoto?.size ? await preparePhoto(values.businessPhoto) : (values.retainedPhoto || '');
    if (activeUser?.uid !== userId) throw new Error('Votre session a changé. Reconnectez-vous avant de réessayer.');
    if (editing) {
      fields.latitude = editing.latitude ?? null; fields.longitude = editing.longitude ?? null;
      const ref = doc(db, 'submissions', editing.id);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref); const record = snapshot.data();
        if (!record || record.submitterId !== userId) throw new Error('Cette fiche ne vous appartient pas.');
        if (record.editRequestId === portal.requestId) return;
        if (!['approved', 'correction_required', 'rejected'].includes(record.status)) throw new Error('Cette fiche est déjà en cours de vérification.');
        transaction.update(ref, { ...fields, photo, status: 'pending', editRequestId: portal.requestId, verificationChecks: { identity: false, contact: false, location: false, duplicate: false }, updatedAt: serverTimestamp() });
      });
      return editing.id;
    }
    const reference = doc(db, 'submissions', portal?.requestId || crypto.randomUUID());
    try { await setDoc(reference, {
      ...fields,
      submitterId: userId,
      photo,
      imagePaths: [],
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }); } catch (error) {
      const existing = await getDoc(reference).catch(() => null);
      if (!existing?.exists() || existing.data().submitterId !== userId) throw error;
    }
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
    in_progress: 'En cours',
    duplicate: 'Doublon',
    rejected: 'Refusée',
    correction_required: 'Correction requise',
    approved: 'Publiée',
  }[status] || status);
  const statusClass = (status) => status === 'approved' ? 'approved' : status === 'duplicate' ? 'duplicate' : status === 'rejected' ? 'rejected' : 'pending';

  function updateMetrics() {
    const sourceRecords = adminRecords.filter((record) => record.recordType === 'source');
    const pending = adminRecords.filter((record) => ['review_required', 'pending', 'in_progress', 'correction_required'].includes(recordStatus(record))).length;
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
      subcategory: record.subcategory || record.subcategoryId || '',
      city: record.city || record.cityId || '',
      district: record.district || record.communeId || '',
      quartier: record.quartier || record.neighborhood || '',
      postalCode: record.postalCode || '',
      description: record.description || '',
      streetAddress: record.streetAddress || record.address || '',
      phone: record.phone || '',
      whatsapp: record.whatsapp || '',
      email: record.email || '',
      website: record.website || '',
      latitude: record.latitude == null ? NaN : Number(record.latitude),
      longitude: record.longitude == null ? NaN : Number(record.longitude),
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
    const photoGallery = document.querySelector('#review-photos');
    const submittedPhotos = [record.photo, ...(Array.isArray(record.imagePaths) ? record.imagePaths : [])]
      .filter(value => typeof value === 'string' && value.startsWith('data:image/')).slice(0, 5);
    photoGallery.replaceChildren(...submittedPhotos.map((source, index) => {
      const image = document.createElement('img'); image.src = source; image.alt = `Photo ${index + 1} de l’entreprise`; image.className = 'submission-photo'; return image;
    }));
    photoGallery.hidden = !submittedPhotos.length;
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
      quartier: values.quartier.trim(),
      postalCode: values.postalCode.trim(),
      description: values.description.trim(),
      streetAddress: values.streetAddress.trim(),
      phone: values.phone.trim(),
      whatsapp: values.whatsapp.trim(),
      email: values.email.trim(),
      website: values.website.trim(),
      latitude: values.latitude.trim() ? Number(values.latitude) : null,
      longitude: values.longitude.trim() ? Number(values.longitude) : null,
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
      if (!values.name || !values.category || !values.city) throw new Error('Le nom, la catégorie et la ville sont obligatoires.');
      if (action === 'approved' && (!Number.isFinite(values.latitude) || !Number.isFinite(values.longitude) || values.latitude < 7 || values.latitude > 13 || values.longitude < -16 || values.longitude > -7)) throw new Error('Vérifiez les coordonnées en Guinée avant publication.');
      if (action === 'approved' && (!values.verificationChecks.identity || !values.verificationChecks.location)) {
        throw new Error('Confirmez au minimum l’identité et la localisation avant publication.');
      }
      if (action === 'approved' && activeRecord.duplicateAlert && !values.verificationChecks.duplicate) {
        throw new Error('Examinez et confirmez le signal de doublon avant publication.');
      }

      buttons.forEach((button) => { button.disabled = true; });
      notice.textContent = 'Enregistrement en cours…';
      const nextStatus = action === 'save' ? (recordStatus(activeRecord) === 'approved' ? 'approved' : 'in_progress') : action;
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
        const publishedSnapshot = await getDoc(doc(db, 'businesses', businessId));
        const submittedPhotos = [activeRecord.photo, ...(Array.isArray(activeRecord.imagePaths) ? activeRecord.imagePaths : [])]
          .filter(value => typeof value === 'string' && value.startsWith('data:image/')).slice(0, 5);
        batch.set(doc(db, 'businesses', businessId), {
          name: values.name,
          normalizedName: slugify(values.name),
          categoryId: slugify(values.category),
          categoryLabel: values.category,
          subcategoryId: slugify(values.subcategory),
          subcategory: values.subcategory,
          communeId: slugify(values.district),
          commune: values.district,
          neighborhood: values.quartier,
          postalCode: values.postalCode,
          streetAddress: values.streetAddress,
          email: values.email,
          website: values.website,
          whatsapp: values.whatsapp,
          cityId: slugify(cleanCity(values.city)),
          city: cleanCity(values.city),
          address: [values.streetAddress, values.quartier, values.district].filter(Boolean).join(', '),
          phone: values.phone,
          latitude: values.latitude,
          longitude: values.longitude,
          ...(!publishedSnapshot.exists() ? { rating: 0, reviewCount: 0, services: [], createdAt: activeRecord.publishedAt || serverTimestamp() } : {}),
          verified: true,
          imageUrl: submittedPhotos[0] || activeRecord.imageUrl || '',
          imageUrls: submittedPhotos.length ? submittedPhotos : (activeRecord.imageUrls || []),
          description: values.description,
          status: 'approved',
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
      chip.textContent = user ? `${user.displayName || user.email || user.phoneNumber || 'Mon compte'} · Déconnexion` : '';
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
  setupBusinessPortal(auth, db);
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
  const dashboard = document.querySelector('#business-dashboard');
  if (dashboard) dashboard.textContent = 'Impossible de charger votre espace. Vérifiez votre connexion et rechargez cette page.';
  console.error('Firebase initialization failed:', error);
}

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
}
