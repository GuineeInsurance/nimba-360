import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useBusinesses } from '@/context/business-context';
import { Colors } from '@/constants/colors';

export function DataNotice({ empty }: { empty?: ReactNode }) {
  const { businesses, loading, error, reload } = useBusinesses();
  if (loading) return <View style={{ padding: 20 }}><ActivityIndicator color={Colors.red} /><Text style={{ textAlign: 'center', color: Colors.muted }}>Chargement des adresses…</Text></View>;
  if (error) return <View style={{ padding: 20, gap: 12 }}><Text accessibilityRole="alert" style={{ color: Colors.red }}>{error}</Text><Pressable accessibilityRole="button" onPress={reload}><Text style={{ color: Colors.navy, fontWeight: '700' }}>Réessayer</Text></Pressable></View>;
  if (!businesses.length && !empty) return <Text style={{ padding: 20, color: Colors.muted }}>Les premières adresses vérifiées seront bientôt disponibles.</Text>;
  return empty ?? null;
}
