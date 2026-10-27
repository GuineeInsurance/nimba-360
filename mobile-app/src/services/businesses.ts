import { businesses as localBusinesses } from '@/data/businesses';
import { backendEnabled, loadBusinesses } from '@/services/backend';
import type { Business } from '@/types/business';

import { mapBusiness } from './map-business';
export { mapBusiness } from './map-business';
export async function getApprovedBusinesses(): Promise<Business[]> {
  return backendEnabled ? (await loadBusinesses()).map(mapBusiness) : localBusinesses;
}
