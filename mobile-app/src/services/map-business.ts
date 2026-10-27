import type { CloudRecord } from './backend-types';
import type { Business } from '../types/business';

export function mapBusiness({ id, data }: CloudRecord): Business {
  const text = (key: string, fallback = '') => typeof data[key] === 'string' ? data[key] as string : fallback;
  const number = (key: string, fallback = 0) => typeof data[key] === 'number' && Number.isFinite(data[key]) ? data[key] as number : fallback;
  return { id, name: text('name'), category: text('categoryLabel', text('category')), neighborhood: text('neighborhood', text('commune')), city: text('city'), rating: number('rating'), reviewCount: number('reviewCount'), distanceKm: number('distanceKm', Number.NaN), isOpen: data.isOpen === true, verified: data.verified === true, price: text('priceLevel'), phone: text('phone'), whatsapp: text('whatsapp'), address: text('address'), description: text('description'), services: Array.isArray(data.services) ? data.services.filter((value): value is string => typeof value === 'string') : [], imageUrl: text('imageUrl'), latitude: number('latitude'), longitude: number('longitude') };
}
