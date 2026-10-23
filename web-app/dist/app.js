(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  navToggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in-view'));
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  const notifyForm = document.querySelector('[data-notify-form]');
  notifyForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = notifyForm.querySelector('input').value.trim();
    localStorage.setItem('g360_launch_email', email);
    notifyForm.reset();
    notifyForm.nextElementSibling.textContent = 'Merci — votre intérêt a été enregistré sur cet appareil.';
  });

  const businessForm = document.querySelector('#business-form');
  if (businessForm) {
    const steps = [...document.querySelectorAll('.form-step')];
    const labels = [...document.querySelectorAll('[data-step-label]')];
    const previous = document.querySelector('#prev-step');
    const next = document.querySelector('#next-step');
    const feedback = document.querySelector('#business-feedback');
    let current = 0;

    const saveDraft = () => {
      const values = {};
      new FormData(businessForm).forEach((value, key) => {
        if (typeof value === 'string') values[key] = value;
      });
      localStorage.setItem('g360_business_draft', JSON.stringify(values));
    };

    const restoreDraft = () => {
      try {
        const values = JSON.parse(localStorage.getItem('g360_business_draft') || '{}');
        Object.entries(values).forEach(([name, value]) => {
          const field = businessForm.elements.namedItem(name);
          if (field && field.type !== 'file') field.value = value;
        });
      } catch (_) { /* Ignore a malformed local draft. */ }
    };

    const fieldValue = (name, fallback = 'Non renseigné') => {
      const field = businessForm.elements.namedItem(name);
      return field?.value?.trim() || fallback;
    };

    const buildSummary = () => {
      document.querySelector('#form-summary').innerHTML = `
        <article class="summary-block"><header><strong>Identité</strong><button type="button" data-edit-step="0">Modifier</button></header><dl><div><dt>Entreprise</dt><dd>${escapeHtml(fieldValue('name'))}</dd></div><div><dt>Catégorie</dt><dd>${escapeHtml(fieldValue('category'))}</dd></div><div><dt>RCCM</dt><dd>${escapeHtml(fieldValue('rccm'))}</dd></div><div><dt>Raison sociale</dt><dd>${escapeHtml(fieldValue('legalName'))}</dd></div></dl></article>
        <article class="summary-block"><header><strong>Localisation et contact</strong><button type="button" data-edit-step="1">Modifier</button></header><dl><div><dt>Localisation</dt><dd>${escapeHtml(fieldValue('commune'))}, ${escapeHtml(fieldValue('city'))}</dd></div><div><dt>Adresse</dt><dd>${escapeHtml(fieldValue('address'))}</dd></div><div><dt>Téléphone</dt><dd>${escapeHtml(fieldValue('phone'))}</dd></div><div><dt>E-mail</dt><dd>${escapeHtml(fieldValue('email'))}</dd></div></dl></article>
        <article class="summary-block"><header><strong>Présentation</strong><button type="button" data-edit-step="2">Modifier</button></header><dl><div><dt>Description</dt><dd>${escapeHtml(fieldValue('description'))}</dd></div><div><dt>Services</dt><dd>${escapeHtml(fieldValue('services'))}</dd></div></dl></article>`;
      document.querySelectorAll('[data-edit-step]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.editStep))));
    };

    const validateStep = () => {
      const required = [...steps[current].querySelectorAll('[required]')];
      const invalid = required.find((field) => !field.checkValidity());
      if (invalid) {
        invalid.reportValidity();
        return false;
      }
      return true;
    };

    const showStep = (index) => {
      current = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach((step, i) => step.classList.toggle('active', i === current));
      labels.forEach((label, i) => {
        label.classList.toggle('active', i === current);
        label.classList.toggle('done', i < current);
        label.querySelector('i').textContent = i < current ? '✓' : String(i + 1);
      });
      previous.disabled = current === 0;
      next.textContent = current === steps.length - 1 ? 'Envoyer en vérification →' : 'Continuer →';
      if (current === steps.length - 1) buildSummary();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    restoreDraft();
    businessForm.addEventListener('input', saveDraft);
    previous.addEventListener('click', () => showStep(current - 1));
    next.addEventListener('click', async () => {
      feedback.textContent = '';
      if (!validateStep()) return;
      saveDraft();
      if (current < steps.length - 1) showStep(current + 1);
      else {
        if (!window.g360Firebase?.currentUser()) {
          feedback.textContent = 'Connectez-vous pour envoyer cette fiche à la vérification.';
          feedback.style.color = '#b90e24';
          document.querySelector('[data-auth-open]')?.click();
          return;
        }
        next.disabled = true;
        next.textContent = 'Envoi en cours…';
        try {
          const values = Object.fromEntries(new FormData(businessForm));
          const submissionId = await window.g360Firebase.submitBusiness(values);
          localStorage.removeItem('g360_business_draft');
          feedback.textContent = `Fiche envoyée avec succès. Référence : ${submissionId}`;
          feedback.style.color = '#07865e';
          document.querySelector('[data-submit-notice]').textContent = 'Votre fiche est maintenant en attente de vérification. Vous pourrez suivre son statut depuis votre espace entreprise.';
          next.textContent = 'Fiche envoyée ✓';
        } catch (error) {
          feedback.textContent = error.message || 'Impossible d’envoyer la fiche pour le moment.';
          feedback.style.color = '#b90e24';
          next.disabled = false;
          next.textContent = 'Réessayer →';
        }
      }
    });
  }

  function escapeHtml(value) {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }
})();
