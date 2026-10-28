import { GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

export function setupAuth(auth) {
  const modal = document.querySelector('[data-auth-modal]');
  if (!modal) return { openModal() {} };
  modal.innerHTML = `<section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <button class="drawer-close" type="button" data-auth-close aria-label="Fermer">×</button>
    <h2 id="auth-title">Bienvenue sur NIMBA 360</h2>
    <div data-auth-choice><p>Est-ce votre première visite ?</p>
      <button type="button" class="button button-primary" data-account-mode="new">Je suis nouveau · Créer mon compte</button>
      <button type="button" class="button button-secondary" data-account-mode="returning">J’ai déjà un compte · Me connecter</button>
    </div>
    <div data-auth-methods hidden><p data-auth-explanation></p>
      <button type="button" class="button button-secondary" data-google>Continuer avec Google</button>
      <button type="button" class="button button-primary" data-phone>Utiliser mon numéro de téléphone</button>
      <p class="auth-legal">Pas de mot de passe à créer. Si vous avez déjà un compte avec ce Google ou ce numéro, vous le retrouverez automatiquement.</p>
    </div>
    <form data-phone-form hidden><p>Nous vous envoyons un code par SMS pour vérifier que ce numéro vous appartient.</p>
      <label for="login-phone">Votre numéro de téléphone</label><input id="login-phone" type="tel" autocomplete="tel" value="+224" required placeholder="+224 6XX XX XX XX">
      <p class="auth-legal">Google traite votre numéro pour prévenir les abus. En demandant le code, vous acceptez le SMS de vérification. Des frais opérateur peuvent s’appliquer.</p>
      <div id="login-recaptcha"></div><button class="button button-primary" type="submit" data-send-code>Recevoir mon code par SMS</button>
    </form>
    <form data-code-form hidden><p data-code-sent></p><label for="login-code">Le code reçu par SMS</label><input id="login-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="6 chiffres" required>
      <button type="submit" class="button button-primary">Valider mon code et continuer</button><button type="button" class="auth-mode" data-change-phone>Changer le numéro ou renvoyer le code</button>
    </form>
    <button type="button" class="auth-mode" data-auth-back hidden>← Choisir une autre méthode</button>
    <p class="form-feedback" data-auth-feedback role="status" aria-live="polite"></p>
    <p class="auth-legal">En continuant, vous acceptez nos <a href="terms">conditions</a> et notre <a href="privacy">politique de confidentialité</a>.</p>
  </section>`;
  const find = selector => modal.querySelector(selector);
  let mode = 'returning', confirmation = null, verifier = null, busy = false, retryAt = 0, trigger = null;
  const feedback = find('[data-auth-feedback]');
  const sections = ['choice', 'methods', 'phone-form', 'code-form'];
  function show(which) {
    sections.forEach(name => { find(`[data-${name === 'choice' || name === 'methods' ? 'auth-' : ''}${name}]`).hidden = name !== which; });
    find('[data-auth-back]').hidden = which === 'choice';
    feedback.textContent = '';
  }
  function selectMode(value) {
    mode = value;
    find('#auth-title').textContent = mode === 'new' ? 'Créer mon compte' : 'Me connecter';
    find('[data-auth-explanation]').textContent = mode === 'new' ? 'Choisissez une méthode. Votre compte sera créé après vérification.' : 'Choisissez le même compte Google ou le même numéro que lors de votre première visite.';
    show('methods');
  }
  function openModal(event) {
    trigger = event?.currentTarget || document.activeElement;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    if (!confirmation) { show('choice'); find('#auth-title').textContent = 'Bienvenue sur NIMBA 360'; }
    find('[data-auth-close]').focus();
  }
  function close() { if (busy) return; modal.hidden = true; document.body.style.overflow = ''; trigger?.focus?.(); }
  const errors = { 'auth/popup-closed-by-user': 'La fenêtre Google a été fermée. Vous pouvez réessayer.', 'auth/popup-blocked': 'Autorisez la fenêtre Google dans votre navigateur, puis réessayez.', 'auth/invalid-phone-number': 'Vérifiez le numéro et son indicatif (+224 pour la Guinée).', 'auth/invalid-verification-code': 'Ce code est incorrect. Vérifiez les 6 chiffres du SMS.', 'auth/code-expired': 'Ce code a expiré. Demandez un nouveau SMS.', 'auth/too-many-requests': 'Trop de tentatives. Patientez avant de réessayer.', 'auth/network-request-failed': 'Vérifiez votre connexion Internet.', 'auth/captcha-check-failed': 'La vérification de sécurité a échoué. Réessayez.', 'auth/account-exists-with-different-credential': 'Ce compte utilise une autre méthode. Utilisez votre méthode habituelle ou contactez l’assistance.' };
  async function perform(action) {
    if (busy) return;
    busy = true; feedback.textContent = 'Un instant…';
    modal.querySelectorAll('button, input').forEach(element => { element.disabled = true; });
    try { await action(); }
    catch (error) { feedback.textContent = errors[error.code] || error.message || 'Impossible de continuer. Réessayez.'; }
    finally { busy = false; modal.querySelectorAll('button, input').forEach(element => { element.disabled = false; }); }
  }
  document.querySelectorAll('[data-auth-open]').forEach(button => button.addEventListener('click', openModal));
  document.addEventListener('g360:login', event => { openModal(); if (event.detail) selectMode(event.detail); });
  find('[data-auth-close]').addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const items = [...modal.querySelectorAll('button, input, a')].filter(element => !element.disabled && element.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  modal.querySelectorAll('[data-account-mode]').forEach(button => button.addEventListener('click', () => selectMode(button.dataset.accountMode)));
  find('[data-auth-back]').addEventListener('click', () => { confirmation = null; selectMode(mode); });
  find('[data-google]').addEventListener('click', () => void perform(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider()); busy = false; confirmation = null; close();
  }));
  find('[data-phone]').addEventListener('click', () => { show('phone-form'); find('#login-phone').focus(); });
  find('[data-change-phone]').addEventListener('click', () => { confirmation = null; show('phone-form'); });
  find('[data-phone-form]').addEventListener('submit', event => {
    event.preventDefault();
    const phone = find('#login-phone').value.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) { feedback.textContent = 'Saisissez le numéro complet avec son indicatif (+224 pour la Guinée).'; return; }
    if (Date.now() < retryAt) { feedback.textContent = `Attendez ${Math.ceil((retryAt - Date.now()) / 1000)} secondes avant un nouveau SMS.`; return; }
    void perform(async () => {
      verifier?.clear(); verifier = new RecaptchaVerifier(auth, 'login-recaptcha', { size: 'normal' });
      try { confirmation = await signInWithPhoneNumber(auth, phone, verifier); }
      finally { verifier?.clear(); verifier = null; }
      retryAt = Date.now() + 60000; show('code-form'); find('[data-code-sent]').textContent = `Un SMS a été envoyé au ${phone}. Recopiez son code ci-dessous.`;
    });
  });
  find('[data-code-form]').addEventListener('submit', event => {
    event.preventDefault(); if (!confirmation) return;
    void perform(async () => { await confirmation.confirm(find('#login-code').value.trim()); confirmation = null; busy = false; close(); });
  });
  return { openModal };
}
