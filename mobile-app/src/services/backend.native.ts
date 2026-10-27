import { getApp } from '@react-native-firebase/app';
import { AppleAuthProvider, GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithCredential, signInWithPhoneNumber, signOut, updateProfile } from '@react-native-firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, runTransaction, serverTimestamp, where } from '@react-native-firebase/firestore';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import * as Apple from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import type { Account, CloudRecord, Failure, PhoneConfirmation } from './backend-types';

export const backendEnabled = process.env.EXPO_PUBLIC_FIREBASE_ENABLED === 'true';
const auth = () => getAuth(getApp());
const db = () => getFirestore(getApp());
export function watchAccount(next: (user: Account | null) => void) {
  if (!backendEnabled) { next(null); return () => {}; }
  return onAuthStateChanged(auth(), next);
}
export async function loginGoogle() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) throw new Error('La connexion Google sera bientôt disponible.');
  GoogleSignin.configure({ webClientId, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) return;
  if (!result.data.idToken) throw new Error('Google n’a pas fourni de jeton de connexion.');
  await signInWithCredential(auth(), GoogleAuthProvider.credential(result.data.idToken));
}
export async function loginApple() {
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  const result = await Apple.signInAsync({ nonce: hashedNonce, requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL] });
  if (!result.identityToken) throw new Error('Apple n’a pas fourni de jeton de connexion.');
  const credential = await signInWithCredential(auth(), AppleAuthProvider.credential(result.identityToken, nonce));
  const displayName = [result.fullName?.givenName, result.fullName?.familyName].filter(Boolean).join(' ');
  if (displayName) {
    await updateProfile(credential.user, { displayName });
    await ensureProfile(credential.user);
  }
}
export async function sendPhoneCode(phone: string): Promise<PhoneConfirmation> {
  return signInWithPhoneNumber(auth(), phone);
}
export async function logout() {
  await signOut(auth());
  if (GoogleSignin.hasPreviousSignIn()) await GoogleSignin.signOut().catch(() => {});
}
export async function ensureProfile(user: Account) {
  const ref = doc(db(), 'users', user.uid);
  await runTransaction(db(), async transaction => {
    const existing = await transaction.get(ref);
    if (!existing.exists()) transaction.set(ref, { displayName: user.displayName ?? '', email: user.email ?? '', photoUrl: user.photoURL ?? '', preferredCityId: 'conakry', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    else if (user.displayName && !existing.data()?.displayName) transaction.update(ref, { displayName: user.displayName, updatedAt: serverTimestamp() });
  });
}
export async function loadBusinesses(): Promise<CloudRecord[]> {
  const result = await getDocs(query(collection(db(), 'businesses'), where('status', '==', 'approved')));
  return result.docs.map(item => ({ id: item.id, data: item.data() }));
}
export async function loadBusiness(id: string): Promise<CloudRecord | null> {
  const result = await getDoc(doc(db(), 'businesses', id));
  return result.exists() ? { id: result.id, data: result.data()! } : null;
}
export function watchFavorites(uid: string, next: (ids: string[]) => void, fail: Failure) {
  return onSnapshot(collection(db(), 'users', uid, 'favorites'), result => next(result.docs.map(item => item.id)), fail);
}
export async function saveFavorite(uid: string, id: string, saved: boolean) {
  const ref = doc(db(), 'users', uid, 'favorites', id);
  if (saved) await runTransaction(db(), async transaction => {
    if (!(await transaction.get(ref)).exists()) transaction.set(ref, { businessId: id, createdAt: serverTimestamp() });
  });
  else await deleteDoc(ref);
}
