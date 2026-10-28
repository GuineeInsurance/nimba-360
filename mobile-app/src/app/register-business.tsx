import { BusinessDashboard } from '@/components/business-dashboard';
import type { CloudRecord } from '@/services/backend-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LoginPanel } from '@/components/login-panel';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { editBusinessSubmission, submitBusiness } from '@/services/backend';
import { cities, emptyDraft, fieldLabels, limits, required, stepFields, taxonomy, validateStep, type Field, type RegistrationDraft } from '@/services/registration';

const titles = ['Identité', 'Coordonnées', 'Présentation', 'Vérification'];
const link = (page: string) => void Linking.openURL(`https://guinee-directory-mvp.web.app/${page}`).catch(() => {});

export default function RegisterBusinessScreen() {
  const { user, loading } = useAuth();
  if (loading) return <ActivityIndicator style={{ margin: 40 }} color={Colors.red} />;
  if (!user) return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Inscrire mon entreprise</Text><Text style={styles.help}>Connectez-vous pour enregistrer votre fiche et l’envoyer à notre équipe de vérification.</Text><LoginPanel /></ScrollView>;
  return <BusinessDashboard key={user.uid} uid={user.uid} renderForm={(record, close) => <RegistrationForm key={record?.id || "new"} uid={user.uid} record={record} close={close} />} />;
}

function RegistrationForm({ uid, record, close }: { uid: string; record?: CloudRecord; close: () => void }) {
  const [draft, setDraft] = useState<RegistrationDraft>({ ...emptyDraft });
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(typeof record?.data.photo === 'string' ? record.data.photo : '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [done, setDone] = useState(false);
  const [selection, setSelection] = useState<Field | null>(null);
  const [search, setSearch] = useState('');
  const id = useRef(Crypto.randomUUID());
  const scroll = useRef<ScrollView>(null);
  const mounted = useRef(true);
  const submitting = useRef(false);
  const writes = useRef(Promise.resolve());
  const storageKey = `g360_registration_v1_${uid}${record ? `_${record.id}` : ''}`;
  useEffect(() => {
    mounted.current = true;
    if (record) setDraft(Object.fromEntries(Object.keys(emptyDraft).map(key => [key, record.data[key] == null ? '' : String(record.data[key])])) as RegistrationDraft);
    void AsyncStorage.getItem(storageKey).then(raw => {
      if (!mounted.current) return;
      if (raw) {
        const saved = JSON.parse(raw);
        const fields = Object.fromEntries(Object.keys(emptyDraft).map(key => [key, typeof saved.fields?.[key] === 'string' ? saved.fields[key] : ''])) as RegistrationDraft;
        setDraft(fields);
        if (typeof saved.id === 'string' && /^[a-f0-9-]{36}$/i.test(saved.id)) id.current = saved.id;
      }
    }).catch(() => { if (mounted.current) setMessage('Le brouillon précédent n’a pas pu être chargé.'); }).finally(() => { if (mounted.current) setReady(true); });
    return () => { mounted.current = false; };
  }, [storageKey, record]);
  useEffect(() => {
    if (!ready || done) return;
    const value = JSON.stringify({ fields: draft, id: id.current });
    writes.current = writes.current.then(() => AsyncStorage.setItem(storageKey, value)).catch(() => {
      if (mounted.current) setMessage('Brouillon non enregistré sur cet appareil. Gardez cette page ouverte.');
    });
  }, [draft, ready, done, storageKey]);

  const change = (field: Field, value: string) => setDraft(previous => ({ ...previous, [field]: value, ...(field === 'category' ? { subcategory: '' } : {}) }));
  const go = (next: number) => { setStep(next); setMessage(''); scroll.current?.scrollTo({ y: 0, animated: true }); };

  async function locate() {
    if (locating) return;
    setLocating(true); setLocationNote('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationNote('Localisation refusée. Vous pouvez ouvrir les réglages, saisir les coordonnées ou continuer sans GPS.'); return;
      }
      if (!await Location.hasServicesEnabledAsync()) throw new Error('Activez la localisation de votre téléphone, puis réessayez.');
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Le GPS met trop de temps. Réessayez dehors ou saisissez les coordonnées.')), 20000); }),
      ]);
      if (!mounted.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (latitude < 7 || latitude > 13 || longitude < -16 || longitude > -7) throw new Error('Cette position est hors de la zone attendue en Guinée. Utilisez le GPS sur place, ou renseignez l’adresse pour vérification.');
      setDraft(previous => ({ ...previous, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
      setLocationNote(`Position obtenue${accuracy == null ? '' : ` (précision estimée : ${Math.round(accuracy)} m)`}. Vérifiez qu’elle correspond à votre entreprise.${accuracy != null && accuracy > 100 ? ' La précision est faible : réessayez dehors.' : ''}`);
    } catch (error) { if (mounted.current) setLocationNote(error instanceof Error ? error.message : 'GPS indisponible. Saisissez les coordonnées ou continuez sans GPS.'); }
    finally { if (timer) clearTimeout(timer); if (mounted.current) setLocating(false); }
  }

  async function choosePhoto() {
    setPhotoBusy(true); setMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('Choisissez une photo de 5 Mo maximum.');
      const context = ImageManipulator.manipulate(asset.uri);
      try {
        const scale = Math.min(1, 900 / Math.max(asset.width, asset.height));
        context.resize({ width: Math.max(1, Math.round(asset.width * scale)), height: Math.max(1, Math.round(asset.height * scale)) });
        const image = await context.renderAsync();
        try {
          for (const compress of [0.72, 0.55, 0.4, 0.25]) {
            const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
            if (!saved.base64) throw new Error('Impossible de préparer cette photo.');
            const data = `data:image/jpeg;base64,${saved.base64}`;
            if (data.length <= 300000) { if (mounted.current) setPhoto(data); return; }
          }
          throw new Error('Choisissez une photo plus petite ou moins détaillée.');
        } finally { image.release(); }
      } finally { context.release(); }
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Impossible de lire cette photo.'); }
    finally { if (mounted.current) setPhotoBusy(false); }
  }

  async function next() {
    if (submitting.current || photoBusy || locating) return;
    const error = validateStep(draft, step);
    if (error) { setMessage(error); return; }
    if (step < 3) { go(step + 1); return; }
    for (let i = 0; i < 3; i++) { const issue = validateStep(draft, i); if (issue) { go(i); setMessage(issue); return; } }
    if (!consent) { setMessage('Confirmez votre autorisation et acceptez les conditions avant l’envoi.'); return; }
    submitting.current = true; setBusy(true); setMessage('');
    try {
      if (record) await editBusinessSubmission(uid, record.id, id.current, draft, photo);
      else await submitBusiness(uid, id.current, draft, photo);
      if (mounted.current) setDone(true);
      writes.current = writes.current.then(() => AsyncStorage.removeItem(storageKey)).catch(() => {});
      await writes.current;
      if (mounted.current) close();
    } catch { if (mounted.current) setMessage('Envoi non confirmé. Vérifiez votre connexion et réessayez. Votre brouillon est conservé.'); }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }

  if (!ready) return <ActivityIndicator style={{ margin: 40 }} color={Colors.red} />;
  if (done) return <View style={styles.content}><Text style={styles.title}>Fiche envoyée</Text><Text style={styles.help}>Votre entreprise est en attente de vérification. Elle sera visible après approbation par notre équipe.</Text><Text selectable style={styles.help}>Référence : {id.current}</Text></View>;
  const options = selection === 'category' ? Object.keys(taxonomy).sort((a, b) => a.localeCompare(b, 'fr')) : selection === 'subcategory' ? [...(taxonomy[draft.category] || [])].sort((a, b) => a.localeCompare(b, 'fr')) : cities;
  const disabled = busy || photoBusy || locating;
  return <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>Étape {step + 1} sur 4 · {titles[step]}</Text>
      <Pressable disabled={disabled} onPress={close}><Text style={styles.link}>← Mes entreprises</Text></Pressable>
      <Text style={styles.title}>{record ? 'Modifier mon entreprise' : 'Inscrire mon entreprise'}</Text>
      {record && <Text style={styles.help}>Vos modifications seront vérifiées avant publication. Votre fiche publique reste visible pendant ce temps.</Text>}
      <Text style={styles.help}>Votre brouillon est enregistré sur cet appareil. Les champs * sont obligatoires.</Text>
      {step < 3 && stepFields[step].filter(field => !['latitude', 'longitude'].includes(field)).map(field => <View key={field} style={styles.field}>
        <Text style={styles.label}>{fieldLabels[field]}{required.includes(field) ? ' *' : ' (facultatif)'}</Text>
        {['category', 'subcategory', 'city'].includes(field) ? <Pressable accessibilityRole="button" accessibilityLabel={fieldLabels[field]} disabled={disabled || (field === 'subcategory' && !draft.category)} style={styles.input} onPress={() => { setSearch(''); setSelection(field); }}><Text style={styles.value}>{draft[field] || 'Sélectionner…'} ▾</Text></Pressable> : <TextInput accessibilityLabel={fieldLabels[field]} editable={!disabled} style={[styles.input, field === 'description' && styles.multiline]} value={draft[field]} onChangeText={value => change(field, value)} maxLength={limits[field]} multiline={field === 'description'} keyboardType={['phone', 'whatsapp'].includes(field) ? 'phone-pad' : field === 'email' ? 'email-address' : field === 'website' ? 'url' : 'default'} autoCapitalize={['email', 'website'].includes(field) ? 'none' : 'sentences'} placeholder={field === 'website' ? 'https://exemple.com' : field === 'phone' ? '+224 …' : undefined} />}
      </View>)}
      {step === 1 && <View style={styles.card}>
        <Text style={styles.label}>Localiser l’entreprise</Text>
        <Text style={styles.help}>Appuyez lorsque vous êtes sur place. Seule votre position actuelle sera utilisée pour la fiche ; aucun suivi en arrière-plan.</Text>
        <Pressable accessibilityRole="button" disabled={disabled} style={styles.button} onPress={() => void locate()}><Text style={styles.buttonText}>{locating ? 'Recherche GPS…' : 'Utiliser ma position GPS'}</Text></Pressable>
        {!!locationNote && <Text accessibilityLiveRegion="polite" style={styles.help}>{locationNote}</Text>}
        <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings().catch(() => setLocationNote('Ouvrez les réglages du téléphone pour autoriser la localisation.'))}><Text style={styles.link}>Réglages de localisation</Text></Pressable>
        {(['latitude', 'longitude'] as Field[]).map(field => <View key={field} style={styles.field}><Text style={styles.label}>{fieldLabels[field]} (facultatif)</Text><TextInput accessibilityLabel={fieldLabels[field]} editable={!disabled} style={styles.input} value={draft[field]} onChangeText={value => change(field, value)} keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'} placeholder={field === 'latitude' ? '9.5092' : '-13.7122'} /></View>)}
        <Pressable accessibilityRole="button" disabled={disabled} onPress={() => { setDraft(previous => ({ ...previous, latitude: '', longitude: '' })); setLocationNote('Les coordonnées seront complétées lors de la vérification.'); }}><Text style={styles.link}>Effacer les coordonnées</Text></Pressable>
      </View>}
      {step === 2 && <View style={styles.card}><Text style={styles.label}>Photo de l’entreprise (facultatif)</Text><Text style={styles.help}>Une photo, 5 Mo maximum. Resélectionnez-la si vous quittez cette page.</Text><Pressable accessibilityRole="button" disabled={disabled} style={styles.button} onPress={() => void choosePhoto()}><Text style={styles.buttonText}>{photoBusy ? 'Préparation…' : 'Choisir une photo'}</Text></Pressable>{!!photo && <><Image source={{ uri: photo }} style={styles.photo} accessibilityLabel="Photo de l’entreprise" /><Pressable disabled={disabled} onPress={() => setPhoto('')}><Text style={styles.link}>Supprimer la photo</Text></Pressable></>}</View>}
      {step === 3 && <>
        {stepFields.map((fields, index) => <View key={index} style={styles.card}><Pressable disabled={disabled} onPress={() => go(index)}><Text style={styles.link}>{titles[index]} · Modifier</Text></Pressable>{fields.map(field => <View key={field} style={styles.summaryRow}><Text style={styles.label}>{fieldLabels[field]}</Text><Text selectable style={styles.value}>{draft[field] || 'Non renseigné'}</Text></View>)}</View>)}
        {!!photo && <Image source={{ uri: photo }} style={styles.photo} accessibilityLabel="Photo de l’entreprise" />}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} disabled={disabled} style={styles.card} onPress={() => setConsent(!consent)}><Text style={styles.value}>{consent ? '☑' : '☐'} Je confirme être autorisé à représenter cette entreprise et l’exactitude des informations, y compris sa localisation. J’accepte les conditions d’utilisation et reconnais la politique de confidentialité.</Text></Pressable>
        <Pressable onPress={() => link('terms')}><Text style={styles.link}>Conditions d’utilisation</Text></Pressable><Pressable onPress={() => link('privacy')}><Text style={styles.link}>Politique de confidentialité</Text></Pressable>
      </>}
      {!!message && <Text accessibilityRole="alert" style={styles.error}>{message}</Text>}
      <View style={styles.navigation}>{step > 0 && <Pressable disabled={disabled} style={styles.secondary} onPress={() => go(step - 1)}><Text style={styles.value}>Précédent</Text></Pressable>}<Pressable accessibilityRole="button" disabled={disabled} style={[styles.button, disabled && { opacity: 0.5 }]} onPress={() => void next()}><Text style={styles.buttonText}>{busy ? 'Envoi…' : step === 3 ? (record ? 'Envoyer les modifications' : 'Envoyer la fiche') : 'Continuer →'}</Text></Pressable></View>
    </ScrollView>
    <Modal visible={selection !== null} animationType="slide" onRequestClose={() => setSelection(null)}><View style={styles.modal}><Pressable onPress={() => setSelection(null)}><Text style={styles.link}>Fermer</Text></Pressable><Text style={styles.title}>{selection ? fieldLabels[selection] : ''}</Text><TextInput accessibilityLabel="Rechercher une option" placeholder="Rechercher…" style={styles.input} value={search} onChangeText={setSearch} /><ScrollView keyboardShouldPersistTaps="handled">{options.filter(option => option.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))).map(option => <Pressable accessibilityRole="button" key={option} style={styles.option} onPress={() => { if (selection) change(selection, option); setSelection(null); }}><Text style={styles.value}>{option}</Text></Pressable>)}</ScrollView></View></Modal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream }, content: { padding: 20, paddingBottom: 50, gap: 14 },
  kicker: { color: Colors.green, fontWeight: '700' }, title: { color: Colors.navy, fontSize: 26, fontWeight: '800' },
  help: { color: Colors.muted, fontSize: 14, lineHeight: 21 }, field: { gap: 7 }, label: { color: Colors.navy, fontSize: 14, fontWeight: '700' },
  input: { borderColor: Colors.border, borderWidth: 1, borderRadius: 12, backgroundColor: Colors.white, padding: 14, color: Colors.navy, fontSize: 16, minHeight: 50 },
  multiline: { minHeight: 140, textAlignVertical: 'top' }, value: { color: Colors.navy, fontSize: 15, lineHeight: 22 },
  card: { padding: 16, gap: 12, borderRadius: 16, backgroundColor: Colors.white, borderColor: Colors.border, borderWidth: 1 },
  button: { backgroundColor: Colors.red, padding: 15, borderRadius: 12, alignItems: 'center' }, buttonText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  secondary: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }, navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  link: { color: Colors.green, fontWeight: '700', paddingVertical: 10 }, error: { color: Colors.red, lineHeight: 21 }, photo: { width: '100%', height: 190, borderRadius: 12, resizeMode: 'contain' },
  summaryRow: { gap: 3 }, modal: { flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30, gap: 12 }, option: { paddingVertical: 17, borderBottomWidth: 1, borderColor: Colors.border },
});
