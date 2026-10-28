import { normalizeRegistration, type RegistrationDraft } from './registration';
import { getAuth, GoogleAuthProvider, OAuthProvider, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup, signOut } from 'firebase/auth';
import { setDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';

import { app, db, isFirebaseConfigured } from '@/lib/firebase';
import type { Account, CloudRecord, Failure, PhoneConfirmation } from './backend-types';

export const backendEnabled = isFirebaseConfigured;
function auth() { if (!app) throw new Error('Connexion indisponible.'); return getAuth(app); }
function database() { if (!db) throw new Error('Connexion indisponible.'); return db; }
export function watchAccount(next: (user: Account | null) => void) {
  if (!backendEnabled) { next(null); return () => {}; }
  return onAuthStateChanged(auth(), next);
}
export async function loginGoogle() { await signInWithPopup(auth(), new GoogleAuthProvider()); }
export async function loginApple() { await signInWithPopup(auth(), new OAuthProvider('apple.com')); }
export async function sendPhoneCode(phone: string): Promise<PhoneConfirmation> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const verifier = new RecaptchaVerifier(auth(), container, { size: 'invisible' });
  try { return await signInWithPhoneNumber(auth(), phone, verifier); }
  finally { verifier.clear(); container.remove(); }
}
export async function logout() { await signOut(auth()); }
export async function ensureProfile(user: Account) {
  const ref = doc(database(), 'users', user.uid);
  await runTransaction(database(), async transaction => {
    const existing = await transaction.get(ref);
    if (!existing.exists()) transaction.set(ref, { displayName: user.displayName ?? '', email: user.email ?? '', photoUrl: user.photoURL ?? '', preferredCityId: 'conakry', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    else if (user.displayName && !existing.data()?.displayName) transaction.update(ref, { displayName: user.displayName, updatedAt: serverTimestamp() });
  });
}
export async function loadBusinesses(): Promise<CloudRecord[]> {
  const result = await getDocs(query(collection(database(), 'businesses'), where('status', '==', 'approved')));
  return result.docs.map(item => ({ id: item.id, data: item.data() }));
}
export async function loadBusiness(id: string): Promise<CloudRecord | null> {
  const result = await getDoc(doc(database(), 'businesses', id));
  return result.exists() ? { id: result.id, data: result.data() } : null;
}
export function watchFavorites(uid: string, next: (ids: string[]) => void, fail: Failure) {
  return onSnapshot(collection(database(), 'users', uid, 'favorites'), result => next(result.docs.map(item => item.id)), fail);
}
export async function saveFavorite(uid: string, id: string, saved: boolean) {
  const ref = doc(database(), 'users', uid, 'favorites', id);
  if (saved) await runTransaction(database(), async transaction => {
    if (!(await transaction.get(ref)).exists()) transaction.set(ref, { businessId: id, createdAt: serverTimestamp() });
  });
  else await deleteDoc(ref);
}

// A stable ID makes retrying after a lost response safe.
export async function submitBusiness(uid: string, id: string, draft: RegistrationDraft, photo: string) {
  if (!backendEnabled || auth().currentUser?.uid !== uid) throw new Error('Reconnectez-vous avant de soumettre votre fiche.');
  const fields = normalizeRegistration(draft);
  if (photo && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 300000)) throw new Error('Cette photo est trop volumineuse.');
  const ref = doc(database(), 'submissions', id);
  // Owners can read existing submissions, but cannot read nonexistent records under the rules.
  try {
    await setDoc(ref, { ...fields, photo, imagePaths: [], submitterId: uid, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } catch (error) {
    const existing = await getDoc(ref).catch(() => null);
    if (!existing?.exists() || existing.data()?.submitterId !== uid) throw error;
  }
  return id;
}
