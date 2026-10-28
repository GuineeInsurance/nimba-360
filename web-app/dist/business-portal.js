import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { collection, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

export function setupBusinessPortal(auth, db) {
  const dashboard = document.querySelector('#business-dashboard');
  if (!dashboard) return;
  const workspace = document.querySelector('.workspace');
  const back = document.querySelector('#back-to-businesses');
  let records = [], stop = () => {}, editing = false, loading = true, failure = false, account = null;
  const portal = window.g360BusinessPortal = { editRecord: null, requestId: crypto.randomUUID() };
  const labels = { name: 'Entreprise', category: 'Catégorie', subcategory: 'Sous-catégorie', city: 'Ville / Préfecture', district: 'Commune', quartier: 'Quartier', postalCode: 'Code postal', streetAddress: 'Adresse', phone: 'Téléphone', email: 'E-mail de contact', website: 'Site web', whatsapp: 'WhatsApp', description: 'Description', latitude: 'Latitude', longitude: 'Longitude' };
  const statuses = {
    pending: ['En cours de vérification', 'Votre fiche a bien été reçue. Notre équipe vérifie vos informations. Vous n’avez rien à renvoyer.'],
    in_progress: ['En cours de vérification', 'Notre équipe examine votre fiche. Son statut sera actualisé ici.'],
    in_review: ['En cours de vérification', 'Notre équipe examine votre fiche.'],
    approved: ['Entreprise publiée', 'Votre entreprise a été acceptée. Vous pouvez consulter et modifier vos informations.'],
    correction_required: ['Informations à corriger', 'Corrigez votre fiche, puis envoyez-la de nouveau à notre équipe.'],
    rejected: ['Fiche non acceptée', 'Vous pouvez corriger les informations et les renvoyer pour une nouvelle vérification.'],
    duplicate: ['Entreprise déjà présente', 'Cette entreprise semble déjà figurer dans l’annuaire. Contactez notre assistance si nécessaire.'],
  };
  function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
  function button(text, action, secondary = false) { const node = element('button', text, `button button-${secondary ? 'secondary' : 'primary'}`); node.type = 'button'; node.addEventListener('click', action); return node; }
  function start(record = null) {
    if (!account || loading || failure) return;
    portal.editRecord = record; portal.requestId = crypto.randomUUID(); editing = true;
    dashboard.hidden = true; workspace.hidden = false; back.hidden = false;
    document.dispatchEvent(new CustomEvent('g360:edit-business', { detail: record }));
    workspace.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function render() {
    if (editing) return;
    dashboard.hidden = false; workspace.hidden = true; back.hidden = true; dashboard.replaceChildren();
    dashboard.append(element('h2', 'Mes entreprises'));
    if (!account) {
      dashboard.append(element('p', 'Créez votre compte pour inscrire votre entreprise, ou connectez-vous pour retrouver vos fiches et suivre leur vérification.'));
      dashboard.append(button('Je suis nouveau · Créer mon compte', () => document.dispatchEvent(new CustomEvent('g360:login', { detail: 'new' }))));
      dashboard.append(button('J’ai déjà un compte · Me connecter', () => document.dispatchEvent(new CustomEvent('g360:login', { detail: 'returning' })), true)); return;
    }
    if (loading) { dashboard.append(element('p', 'Chargement de vos entreprises…')); return; }
    if (failure) { dashboard.append(element('p', 'Impossible de récupérer vos fiches. Vérifiez votre connexion avant de créer une nouvelle fiche.')); dashboard.append(button('Réessayer', () => subscribe(account))); return; }
    if (!records.length) dashboard.append(element('p', 'Présentez votre activité. Notre équipe vérifiera vos informations avant publication.'));
    for (const record of records) {
      const card = element('article', '', 'business-status-card');
      const [title, description] = statuses[record.status] || ['Fiche reçue', 'Votre fiche est enregistrée. Contactez notre assistance pour en savoir plus.'];
      card.append(element('p', title, 'business-status-badge'), element('h3', record.name || 'Mon entreprise'), element('p', description));
      if (record.businessId && record.status !== 'approved') card.append(element('p', 'Si votre fiche était déjà publiée, sa version publique reste inchangée pendant l’examen des modifications.'));
      const details = element('details'); details.open = record.status === 'approved';
      details.append(element('summary', 'Voir les informations envoyées'));
      const list = element('dl', '', 'business-details');
      for (const [key, label] of Object.entries(labels)) { const row = element('div'); row.append(element('dt', label), element('dd', record[key] == null || record[key] === '' ? 'Non renseigné' : String(record[key]))); list.append(row); }
      details.append(list);
      if (typeof record.photo === 'string' && record.photo.startsWith('data:image/jpeg;base64,')) { const photo = element('img', '', 'summary-photo'); photo.src = record.photo; photo.alt = 'Photo de l’entreprise'; details.append(photo); }
      card.append(details);
      if (['approved', 'correction_required', 'rejected'].includes(record.status)) card.append(button(record.status === 'approved' ? 'Modifier les informations' : 'Corriger et renvoyer', () => start(record)));
      dashboard.append(card);
    }
    dashboard.append(button(records.length ? 'Ajouter une autre entreprise' : 'Inscrire mon entreprise', () => start(), records.length > 0));
    const support = element('a', 'Besoin d’aide ? Contactez-nous', 'text-link'); support.href = 'support'; dashboard.append(support);
  }
  function subscribe(user) {
    stop(); account = user; records = []; editing = false; loading = !!user; failure = false;
    portal.editRecord = null;
    document.dispatchEvent(new CustomEvent('g360:clear-business'));
    render();
    if (!user) return;
    stop = onSnapshot(query(collection(db, 'submissions'), where('submitterId', '==', user.uid)), snapshot => {
      if (account?.uid !== user.uid) return;
      records = snapshot.docs.map(item => ({ ...item.data(), id: item.id })); loading = false; failure = false; render();
    }, () => { if (account?.uid === user.uid) { loading = false; failure = true; render(); } });
  }
  back.addEventListener('click', () => { editing = false; render(); });
  document.addEventListener('g360:business-sent', () => { editing = false; portal.editRecord = null; render(); dashboard.scrollIntoView({ behavior: 'smooth' }); });
  onAuthStateChanged(auth, subscribe);
}
