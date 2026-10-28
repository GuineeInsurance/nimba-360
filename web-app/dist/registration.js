(() => {
  const config = window.g360Registration;
  const text = value => typeof value === 'string' ? value.trim() : '';
  const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  config.fields = ['name', 'category', 'subcategory', 'city', 'district', 'quartier', 'postalCode', 'streetAddress', 'phone', 'email', 'website', 'whatsapp', 'description'];
  config.normalize = values => {
    const result = Object.fromEntries(config.fields.map(key => [key, text(values[key])]));
    if (result.name.length < 2 || result.name.length > 100 || !result.district || !result.phone || !result.description) throw new Error('Complétez les champs obligatoires.');
    if (!Object.hasOwn(config.taxonomy, result.category) || !config.taxonomy[result.category].includes(result.subcategory)) throw new Error('Sélectionnez une catégorie et une sous-catégorie correspondante.');
    if (!config.cities.includes(result.city)) throw new Error('Sélectionnez une ville ou préfecture.');
    for (const [field, maximum] of Object.entries({ district: 100, quartier: 100, postalCode: 20, streetAddress: 180, phone: 30, email: 150, whatsapp: 30, description: 800 })) {
      if (result[field].length > maximum) throw new Error('Un des champs dépasse la longueur autorisée.');
    }
    if (result.website) { const url = new URL(result.website); if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Le site web doit commencer par https:// ou http://.'); }
    return { ...result, categoryId: slugify(result.category), subcategoryId: slugify(result.subcategory), cityId: slugify(result.city), communeId: slugify(result.district), address: result.streetAddress, latitude: null, longitude: null };
  };
  config.validatePhoto = file => {
    if (!file?.size) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choisissez une photo JPG, PNG ou WebP de 5 Mo maximum.');
  };
  const form = document.querySelector('#business-form');
  if (!form) return;
  const fill = (field, values, selected = '') => {
    field.replaceChildren(new Option('Sélectionner', ''), ...values.map(value => new Option(value, value)));
    field.value = values.includes(selected) ? selected : '';
  };
  config.fillSubcategories = selected => {
    const options = config.taxonomy[form.elements.category.value] || [];
    fill(form.elements.subcategory, [...options].sort((a,b) => a.localeCompare(b, 'fr')), selected);
    form.elements.subcategory.disabled = !options.length;
  };
  fill(form.elements.category, Object.keys(config.taxonomy).sort((a,b) => a.localeCompare(b, 'fr')));
  fill(form.elements.city, config.cities);
  config.fillSubcategories();
  form.elements.category.addEventListener('change', () => config.fillSubcategories());
})();
