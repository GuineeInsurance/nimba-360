import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { watchSubmissions } from '@/services/backend';
import type { CloudRecord } from '@/services/backend-types';
import { fieldLabels, type Field } from '@/services/registration';

const statusCopy: Record<string, [string, string]> = {
  pending: ['En cours de vérification', 'Votre fiche a bien été reçue. Notre équipe vérifie les informations. Vous n’avez rien à renvoyer.'],
  in_progress: ['En cours de vérification', 'Notre équipe examine votre fiche. Revenez ici pour suivre son avancement.'],
  in_review: ['En cours de vérification', 'Notre équipe examine votre fiche.'],
  approved: ['Entreprise publiée', 'Votre fiche a été acceptée. Vous pouvez consulter ses informations ou proposer une modification.'],
  correction_required: ['Informations à corriger', 'Ouvrez votre fiche, corrigez les informations et envoyez-la à nouveau.'],
  rejected: ['Fiche non acceptée', 'Votre fiche n’a pas été acceptée. Vous pouvez corriger les informations et la renvoyer.'],
  duplicate: ['Fiche déjà présente', 'Cette entreprise semble déjà figurer dans l’annuaire. Contactez l’assistance si nécessaire.'],
};

export function BusinessDashboard({ uid, renderForm }: { uid: string; renderForm: (record: CloudRecord | undefined, close: () => void) => ReactNode }) {
  const [records, setRecords] = useState<CloudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<CloudRecord | 'new' | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    setError(false); setLoading(true);
    return watchSubmissions(uid, items => { setRecords(items); setLoading(false); }, () => { setError(true); setLoading(false); });
  }, [uid, retry]);
  // Keep an active form mounted until its write and local-draft cleanup finish.
  if (editor) return renderForm(editor === 'new' ? undefined : editor, () => setEditor(null));
  if (loading) return <ActivityIndicator style={{ margin: 40 }} color={Colors.red} />;
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Mes entreprises</Text>
    {error ? <View style={styles.card}><Text style={styles.text}>Impossible de récupérer vos fiches. Vérifiez votre connexion pour éviter de renvoyer une fiche déjà enregistrée.</Text><Pressable style={styles.button} onPress={() => setRetry(retry + 1)}><Text style={styles.buttonText}>Réessayer</Text></Pressable></View> : <>
      {!records.length && <View style={styles.card}><Text style={styles.title}>Présentez votre activité</Text><Text style={styles.text}>Ajoutez les informations de votre entreprise. Notre équipe les vérifiera avant publication.</Text></View>}
      {records.map(record => {
        const status = String(record.data.status || 'pending');
        const [title, description] = statusCopy[status] || ['Fiche reçue', 'Votre fiche est enregistrée. Contactez l’assistance pour en savoir plus.'];
        const editable = ['approved', 'correction_required', 'rejected'].includes(status);
        return <View key={record.id} style={styles.card}>
          <Text style={[styles.badge, status === 'approved' && { color: Colors.green }]}>{title}</Text>
          <Text style={styles.title}>{String(record.data.name || 'Mon entreprise')}</Text>
          <Text style={styles.text}>{description}</Text>
          {!!record.data.businessId && status !== 'approved' && <Text style={styles.text}>Si votre fiche était déjà publiée, sa version publique reste inchangée pendant l’examen des modifications.</Text>}
          <Pressable accessibilityRole="button" onPress={() => setExpanded(expanded === record.id ? null : record.id)}><Text style={styles.link}>{expanded === record.id ? 'Masquer les informations' : 'Voir les informations envoyées'}</Text></Pressable>
          {(expanded === record.id || status === 'approved') && <>
            {Object.entries(fieldLabels).map(([key, label]) => {
              const value = record.data[key as Field];
              return <View key={key}><Text style={styles.label}>{label}</Text><Text selectable style={styles.text}>{value === null || value === undefined || value === '' ? 'Non renseigné' : String(value)}</Text></View>;
            })}
            {typeof record.data.photo === 'string' && record.data.photo.startsWith('data:image/jpeg;base64,') && <Image source={{ uri: record.data.photo }} style={styles.photo} accessibilityLabel="Photo de l’entreprise" />}
          </>}
          {editable && <Pressable accessibilityRole="button" style={styles.button} onPress={() => setEditor(record)}><Text style={styles.buttonText}>{status === 'approved' ? 'Modifier les informations' : 'Corriger et renvoyer'}</Text></Pressable>}
        </View>;
      })}
      <Pressable accessibilityRole="button" style={records.length ? styles.secondary : styles.button} onPress={() => setEditor('new')}><Text style={records.length ? styles.link : styles.buttonText}>{records.length ? 'Ajouter une autre entreprise' : 'Inscrire mon entreprise'}</Text></Pressable>
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 50, gap: 18, backgroundColor: Colors.cream }, card: { backgroundColor: Colors.white, borderRadius: 16, padding: 18, gap: 14 },
  title: { color: Colors.navy, fontSize: 22, fontWeight: '800' }, text: { color: Colors.muted, lineHeight: 22, fontSize: 15 }, label: { color: Colors.navy, fontWeight: '700' },
  badge: { color: Colors.navy, fontWeight: '800', fontSize: 16 }, button: { backgroundColor: Colors.red, borderRadius: 12, padding: 16, alignItems: 'center' }, buttonText: { color: Colors.white, fontWeight: '800' },
  link: { color: Colors.green, fontWeight: '700', paddingVertical: 10 }, secondary: { alignItems: 'center', padding: 10 }, photo: { height: 180, width: '100%', resizeMode: 'contain' },
});
