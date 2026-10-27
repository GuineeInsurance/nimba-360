import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { ensureProfile, watchAccount } from '@/services/backend';
import type { Account } from '@/services/backend-types';

const AuthContext = createContext<{ user: Account | null; loading: boolean; profileError: string | null }>({ user: null, loading: true, profileError: null });
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  useEffect(() => {
    let generation = 0;
    const unsubscribe = watchAccount(account => {
      const current = ++generation;
      setUser(account);
      setLoading(false);
      setProfileError(null);
      if (account) void ensureProfile(account).catch(() => {
        if (generation === current) setProfileError('Votre profil n’a pas pu être enregistré. Réessayez en vous reconnectant.');
      });
    });
    return () => { generation++; unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ user, loading, profileError }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
