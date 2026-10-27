import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { saveFavorite, watchFavorites } from '@/services/backend';

type FavoritesContextValue = { favorites: string[]; loading: boolean; error: string | null; toggleFavorite: (id: string) => void; isFavorite: (id: string) => boolean };
const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const guestKey = 'nimba360:guest-favorites';
export function FavoritesProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{ owner: string | null; ids: string[]; loading: boolean; error: string | null }>({ owner: null, ids: [], loading: true, error: null });
  const pending = useRef(new Set<string>());
  const guestWrites = useRef(Promise.resolve());
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (uid) {
      const unsubscribe = watchFavorites(uid, ids => { if (active) setState({ owner: uid, ids, loading: false, error: null }); }, () => { if (active) setState({ owner: uid, ids: [], loading: false, error: 'Les favoris ne peuvent pas être synchronisés. Reconnectez-vous pour réessayer.' }); });
      return () => { active = false; unsubscribe(); };
    }
    void guestWrites.current.then(() => AsyncStorage.getItem(guestKey)).then(value => {
      const parsed: unknown = value ? JSON.parse(value) : [];
      if (active) setState({ owner: null, ids: Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [], loading: false, error: null });
    }).catch(() => { if (active) setState({ owner: null, ids: [], loading: false, error: 'Impossible de lire vos favoris sur cet appareil.' }); });
    return () => { active = false; };
  }, [uid, authLoading]);
  const favorites = state.owner === uid ? state.ids : [];
  const loading = authLoading || state.owner !== uid || state.loading;
  function toggleFavorite(id: string) {
    const key = `${uid ?? 'guest'}:${id}`;
    if (loading || pending.current.has(key)) return;
    if (state.error) { Alert.alert('Favoris', state.error); return; }
    const saved = !favorites.includes(id);
    if (uid) {
      pending.current.add(key);
      void saveFavorite(uid, id, saved).catch(() => Alert.alert('Favoris', 'La modification n’a pas été enregistrée. Vérifiez votre connexion.')).finally(() => pending.current.delete(key));
    } else {
      const ids = saved ? [...favorites, id] : favorites.filter(item => item !== id);
      setState({ owner: null, ids, loading: false, error: null });
      guestWrites.current = guestWrites.current.then(() => AsyncStorage.setItem(guestKey, JSON.stringify(ids))).catch(() => Alert.alert('Favoris', 'Impossible d’enregistrer vos favoris sur cet appareil.'));
    }
  }
  return <FavoritesContext.Provider value={{ favorites, loading, error: state.error, toggleFavorite, isFavorite: id => favorites.includes(id) }}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() { const value = useContext(FavoritesContext); if (!value) throw new Error('FavoritesProvider missing'); return value; }
