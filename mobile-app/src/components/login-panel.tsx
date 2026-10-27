import * as Apple from 'expo-apple-authentication';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { backendEnabled, loginApple, loginGoogle, sendPhoneCode } from '@/services/backend';
import { authError } from '@/services/auth-errors';
import type { PhoneConfirmation } from '@/services/backend-types';

export function LoginPanel() {
  const [phone, setPhone] = useState('+224');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<PhoneConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [appleAvailable, setAppleAvailable] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'ios') void Apple.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function perform(action: () => Promise<unknown>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(null);
    try { await action(); } catch (failure) { setError(authError(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  async function send() {
    const normalized = phone.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) { setError('Saisissez un numéro complet avec son indicatif (+224 pour la Guinée).'); return; }
    await perform(async () => {
      setConfirmation(await sendPhoneCode(normalized)); setCode(''); setRetryAt(Date.now() + 60000);
    });
  }
  const disabled = busy || !backendEnabled;
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return <View style={styles.panel}>
    <Text style={styles.title}>Votre compte NIMBA 360</Text>
    <Text style={styles.description}>Retrouvez vos favoris sur tous vos appareils.</Text>
    {!backendEnabled && <Text style={styles.description}>La connexion sera bientôt disponible.</Text>}
    <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void perform(loginGoogle)} style={[styles.social, disabled && styles.disabled]}><Text style={styles.socialText}>Continuer avec Google</Text></Pressable>
    {appleAvailable && <View pointerEvents={disabled ? 'none' : 'auto'} style={disabled && styles.disabled}><Apple.AppleAuthenticationButton buttonType={Apple.AppleAuthenticationButtonType.CONTINUE} buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK} cornerRadius={12} style={styles.apple} onPress={() => void perform(loginApple)} /></View>}
    <Text style={styles.divider}>ou avec votre numéro de téléphone</Text>
    <Text style={styles.label}>Numéro de téléphone</Text>
    <TextInput accessibilityLabel="Numéro de téléphone avec indicatif" autoComplete="tel" keyboardType="phone-pad" value={phone} onChangeText={value => { setPhone(value); setConfirmation(null); setCode(''); }} editable={!disabled} style={styles.input} />
    {confirmation && <>
      <Text style={styles.description}>Un code a été envoyé au {phone}.</Text>
      <TextInput accessibilityLabel="Code reçu par SMS" autoComplete="sms-otp" textContentType="oneTimeCode" keyboardType="number-pad" maxLength={6} value={code} onChangeText={value => setCode(value.replace(/\D/g, ''))} editable={!disabled} placeholder="Code à 6 chiffres" style={styles.input} />
      <Pressable disabled={disabled || code.length !== 6} style={[styles.primary, (disabled || code.length !== 6) && styles.disabled]} onPress={() => void perform(() => confirmation.confirm(code))}><Text style={styles.primaryText}>Vérifier le code</Text></Pressable>
    </>}
    <Pressable disabled={disabled || remaining > 0} onPress={() => void send()} style={[styles.social, (disabled || remaining > 0) && styles.disabled]}><Text style={styles.socialText}>{remaining ? `Renvoyer dans ${remaining} s` : confirmation ? 'Renvoyer le code' : 'Recevoir un code par SMS'}</Text></Pressable>
    <Text style={styles.consent}>En demandant un code, vous acceptez de recevoir un SMS de vérification. Google traite votre numéro pour prévenir les abus. Des frais opérateur peuvent s’appliquer.</Text>
    {busy && <ActivityIndicator accessibilityLabel="Connexion en cours" color={Colors.red} />}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { gap: 12, width: '100%', marginTop: 20 }, title: { color: Colors.navy, fontSize: 21, fontWeight: '800' },
  description: { color: Colors.muted, lineHeight: 21 }, label: { color: Colors.navy, fontWeight: '700' },
  social: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, padding: 15, borderRadius: 12, alignItems: 'center' },
  socialText: { color: Colors.navy, fontWeight: '700' }, apple: { height: 48, width: '100%' },
  divider: { color: Colors.muted, textAlign: 'center', marginVertical: 8 },
  input: { backgroundColor: Colors.white, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, padding: 14, color: Colors.navy, fontSize: 17 },
  primary: { backgroundColor: Colors.red, borderRadius: 12, padding: 15, alignItems: 'center' }, primaryText: { color: Colors.white, fontWeight: '800' },
  consent: { color: Colors.muted, fontSize: 11, lineHeight: 17 }, error: { color: Colors.red, lineHeight: 20 }, disabled: { opacity: 0.45 },
});
