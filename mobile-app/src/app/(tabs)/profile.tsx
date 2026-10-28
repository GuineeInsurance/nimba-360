import { router } from 'expo-router';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { BrandLockup } from '@/components/brand-lockup';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { LoginPanel } from '@/components/login-panel';
import { logout } from '@/services/backend';

export default function ProfileScreen() {
  const { user, loading, profileError } = useAuth();
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandLockup />
        <View style={styles.header}>
          <View style={styles.avatar}>
            <AppIcon accent={Colors.yellow} color={Colors.white} name="profile" size={37} />
          </View>
          {loading ? <ActivityIndicator color={Colors.red} /> : user ? <>
            <Text style={styles.heading}>{user.displayName || 'Bienvenue'}</Text>
            <Text style={styles.description}>{user.email || user.phoneNumber}</Text>
            <Text style={styles.description}>Vos favoris sont liés à votre compte.</Text>
            {profileError && <Text accessibilityRole="alert" style={styles.description}>{profileError}</Text>}
            <Pressable style={styles.primaryButton} onPress={() => void logout().catch(() => Alert.alert('Déconnexion', 'Impossible de vous déconnecter. Réessayez.'))}>
              <Text style={styles.primaryButtonText}>Se déconnecter</Text>
            </Pressable>
          </> : <LoginPanel />}
        </View>

        <Pressable accessibilityRole="button" style={styles.card} onPress={() => router.push('/register-business')}>
          <Text style={styles.cardTitle}>Mes entreprises</Text>
          <Text style={styles.cardDescription}>Suivez la vérification de votre fiche et mettez à jour vos informations.</Text>
        </Pressable>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>NIMBA 360</Text>
          <Text style={styles.noteText}>
            Découvrez des entreprises et services fiables partout en Guinée.
          </Text>
        </View>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL('https://guinee-directory-mvp.web.app/privacy.html')}>
            <Text style={styles.legalLink}>Politique de confidentialité</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://guinee-directory-mvp.web.app/terms.html')}>
            <Text style={styles.legalLink}>Conditions d’utilisation</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://guinee-directory-mvp.web.app/support.html')}>
            <Text style={styles.legalLink}>Assistance</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://guinee-directory-mvp.web.app/delete-account.html')}>
            <Text style={[styles.legalLink, styles.deleteLink]}>Supprimer mon compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.cream, flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', paddingBottom: 28, paddingTop: 42 },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.navy,
    borderRadius: 999,
    height: 82,
    justifyContent: 'center',
    width: 82,
  },
  heading: { color: Colors.navy, fontSize: 28, fontWeight: '900', marginTop: 16 },
  description: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 320,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.red,
    borderRadius: 14,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  primaryButtonText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: Colors.white, borderColor: Colors.border, borderRadius: 18, borderWidth: 1, padding: 17 },
  cardRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: Colors.softGreen,
    borderRadius: 13,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  cardText: { flex: 1 },
  cardTitle: { color: Colors.navy, fontSize: 15, fontWeight: '900' },
  cardDescription: { color: Colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  status: { backgroundColor: Colors.softRed, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusConnected: { backgroundColor: Colors.softGreen },
  statusText: { color: Colors.red, fontSize: 10, fontWeight: '900' },
  statusTextConnected: { color: Colors.green },
  note: { borderTopColor: Colors.border, borderTopWidth: 1, marginTop: 26, paddingTop: 22 },
  noteTitle: { color: Colors.navy, fontSize: 15, fontWeight: '900' },
  noteText: { color: Colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  legalLinks: { gap: 14, marginTop: 24 },
  legalLink: { color: Colors.navy, fontSize: 13, fontWeight: '700' },
  deleteLink: { color: Colors.red },
});
