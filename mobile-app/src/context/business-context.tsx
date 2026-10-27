import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { businesses as demoBusinesses } from '@/data/businesses';
import { backendEnabled, loadBusinesses } from '@/services/backend';
import { mapBusiness } from '@/services/businesses';
import type { Business } from '@/types/business';

const BusinessContext = createContext<{ businesses: Business[]; loading: boolean; error: string | null; reload: () => void }>({ businesses: [], loading: true, error: null, reload: () => {} });
export function BusinessProvider({ children }: PropsWithChildren) {
  const [businesses, setBusinesses] = useState<Business[]>(backendEnabled ? [] : demoBusinesses);
  const [loading, setLoading] = useState(backendEnabled);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => { setLoading(true); setError(null); setRevision(value => value + 1); }, []);
  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    void loadBusinesses().then(records => { if (active) setBusinesses(records.map(mapBusiness)); })
      .catch(() => { if (active) setError('Impossible de charger les adresses. Vérifiez votre connexion.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  return <BusinessContext.Provider value={{ businesses, loading, error, reload }}>{children}</BusinessContext.Provider>;
}
export const useBusinesses = () => useContext(BusinessContext);
