import choices from '@/data/registration.json';

export const taxonomy: Record<string, string[]> = choices.taxonomy;
export const cities = choices.cities;
export const fieldLabels = {
  name: 'Nom de l’entreprise', category: 'Catégorie', subcategory: 'Sous-catégorie',
  city: 'Ville / Préfecture', district: 'Commune', quartier: 'Quartier', postalCode: 'Code postal',
  streetAddress: 'Adresse / repère précis', phone: 'Téléphone', email: 'E-mail', website: 'Site web',
  whatsapp: 'WhatsApp', description: 'Description des services', latitude: 'Latitude', longitude: 'Longitude',
};
export type Field = keyof typeof fieldLabels;
export type RegistrationDraft = Record<Field, string>;
export const emptyDraft = Object.fromEntries(Object.keys(fieldLabels).map(key => [key, ''])) as RegistrationDraft;
export const stepFields: Field[][] = [
  ['name', 'category', 'subcategory'],
  ['city', 'district', 'quartier', 'postalCode', 'streetAddress', 'phone', 'email', 'website', 'whatsapp', 'latitude', 'longitude'],
  ['description'],
];
export const required: Field[] = ['name', 'category', 'subcategory', 'city', 'district', 'phone', 'description'];
export const limits: Partial<Record<Field, number>> = { name: 100, district: 100, quartier: 100, postalCode: 20, streetAddress: 180, phone: 30, email: 150, whatsapp: 30, description: 800 };
const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export function validateStep(draft: RegistrationDraft, step: number) {
  for (const field of stepFields[step] || []) {
    const value = draft[field].trim();
    if (required.includes(field) && !value) return `${fieldLabels[field]} : champ obligatoire.`;
    if (limits[field] && value.length > limits[field]!) return `${fieldLabels[field]} : ${limits[field]} caractères maximum.`;
  }
  if (step === 0) {
    if (draft.name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.';
    if (!Object.hasOwn(taxonomy, draft.category) || !taxonomy[draft.category].includes(draft.subcategory)) return 'Choisissez une catégorie et sa sous-catégorie.';
  }
  if (step === 1) {
    if (!cities.includes(draft.city)) return 'Choisissez une ville / préfecture.';
    if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) return 'Saisissez une adresse e-mail valide.';
    if (draft.website.trim()) {
      try { if (!['http:', 'https:'].includes(new URL(draft.website.trim()).protocol)) return 'Utilisez une adresse web https:// ou http://.'; }
      catch { return 'Saisissez une adresse web valide (https://…).'; }
    }
    if (draft.latitude.trim() || draft.longitude.trim()) {
      const lat = Number(draft.latitude.replace(',', '.')), lon = Number(draft.longitude.replace(',', '.'));
      if (!draft.latitude.trim() || !draft.longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < 7 || lat > 13 || lon < -16 || lon > -7) return 'Renseignez les deux coordonnées en Guinée (latitude 7 à 13, longitude −16 à −7), ou laissez-les vides pour vérification.';
    }
  }
  return '';
}
export function normalizeRegistration(draft: RegistrationDraft) {
  for (let step = 0; step < 3; step++) { const error = validateStep(draft, step); if (error) throw new Error(error); }
  const fields = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as RegistrationDraft;
  return { ...fields, categoryId: slug(fields.category), subcategoryId: slug(fields.subcategory), cityId: slug(fields.city), communeId: slug(fields.district), address: fields.streetAddress,
    latitude: fields.latitude ? Number(fields.latitude.replace(',', '.')) : null, longitude: fields.longitude ? Number(fields.longitude.replace(',', '.')) : null };
}
