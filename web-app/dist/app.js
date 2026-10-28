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
      try { localStorage.setItem('g360_business_draft', JSON.stringify(values)); } catch (_) { feedback.textContent = 'Votre navigateur ne peut pas enregistrer le brouillon. Vous pouvez continuer sans fermer cette page.'; }
    };

    const restoreDraft = () => {
      try {
        const values = JSON.parse(localStorage.getItem('g360_business_draft') || '{}');
        // Migrate older website drafts without confusing commune and neighborhood.
        if (values.commune) { values.quartier = values.quartier || values.district || ''; values.district = values.commune; }
        values.streetAddress = values.streetAddress || values.address || '';
        const aliases = { Restaurant: 'Restaurants', 'Hôtel et hébergement': 'Hôtels', Commerce: 'Commerces', 'Tourisme et loisirs': 'Tourisme', Autre: 'Autres' };
        values.category = aliases[values.category] || values.category;
        businessForm.elements.category.value = values.category || '';
        window.g360Registration.fillSubcategories(values.subcategory);
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
      const block = (title, step, fields) => '<article class="summary-block"><header><strong>' + title + '</strong><button type="button" data-edit-step="' + step + '">Modifier</button></header><dl>' + fields.map(([label, name]) => '<div><dt>' + label + '</dt><dd>' + escapeHtml(fieldValue(name)) + '</dd></div>').join('') + '</dl></article>';
      document.querySelector('#form-summary').innerHTML = [
        block('Identité', 0, [['Entreprise', 'name'], ['Catégorie', 'category'], ['Sous-catégorie', 'subcategory']]),
        block('Localisation et contact', 1, [['Ville / Préfecture', 'city'], ['Commune', 'district'], ['Quartier', 'quartier'], ['Code postal', 'postalCode'], ['Adresse / repère', 'streetAddress'], ['Téléphone', 'phone'], ['E-mail', 'email'], ['Site web', 'website'], ['WhatsApp', 'whatsapp']]),
        block('Présentation', 2, [['Description des services', 'description']])
      ].join('');
      if (photoUrl) { const photo = document.createElement('img'); photo.src = photoUrl; photo.alt = 'Photo de l’entreprise'; photo.className = 'summary-photo'; document.querySelector('#form-summary').append(photo); }
      document.querySelectorAll('[data-edit-step]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.editStep))));
    };

    const validateStep = () => {
      const required = [...steps[current].querySelectorAll('input, select, textarea')];
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

    let photoUrl = '';
    const photoField = businessForm.elements.businessPhoto;
    const preview = document.querySelector('#photo-preview');
    const removePhoto = document.querySelector('#remove-photo');
    const photoFeedback = document.querySelector('#photo-feedback');
    function clearPhoto() {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = ''; photoField.value = ''; photoField.setCustomValidity(''); preview.removeAttribute('src'); preview.hidden = true; removePhoto.hidden = true;
    }
    photoField.addEventListener('change', () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = ''; preview.hidden = true; removePhoto.hidden = true; photoFeedback.textContent = ''; photoField.setCustomValidity('');
      const file = photoField.files[0]; if (!file) return;
      try { window.g360Registration.validatePhoto(file); photoUrl = URL.createObjectURL(file); preview.src = photoUrl; preview.hidden = false; removePhoto.hidden = false; photoFeedback.textContent = file.name + ' — resélectionnez la photo si vous rechargez cette page.'; }
      catch (error) { photoField.value = ''; photoFeedback.textContent = error.message; }
    });
    preview.addEventListener('error', () => { clearPhoto(); photoFeedback.textContent = 'Cette image ne peut pas être lue. Choisissez une autre photo.'; });
    removePhoto.addEventListener('click', () => { clearPhoto(); photoFeedback.textContent = ''; });
    restoreDraft();
    businessForm.addEventListener('input', saveDraft);
    businessForm.addEventListener('change', saveDraft);
    businessForm.addEventListener('submit', event => { event.preventDefault(); next.click(); });
    previous.addEventListener('click', () => showStep(current - 1));
    next.addEventListener('click', async () => {
      feedback.textContent = '';
      if (!validateStep()) return;
      saveDraft();
      if (current < steps.length - 1) showStep(current + 1);
      else {
        const invalidStep = steps.findIndex(step => [...step.querySelectorAll('input, select, textarea')].some(field => !field.checkValidity()));
        if (invalidStep >= 0) { showStep(invalidStep); validateStep(); return; }
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
          try { localStorage.removeItem('g360_business_draft'); } catch (_) {}
          previous.disabled = true;
          businessForm.querySelectorAll('input, select, textarea, [data-edit-step]').forEach(field => { field.disabled = true; });
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
