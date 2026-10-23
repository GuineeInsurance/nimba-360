import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { AppIcon } from './app-icon';

type RatingProps = { rating: number; reviewCount: number; compact?: boolean };

export function Rating({ rating, reviewCount, compact = false }: RatingProps) {
  return (
    <View style={styles.row}>
      <AppIcon accent={Colors.yellow} filled name="star" size={compact ? 13 : 16} />
      <Text style={[styles.rating, compact && styles.compact]}>{rating.toFixed(1)}</Text>
      <Text style={[styles.count, compact && styles.compact]}>({reviewCount} avis)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { color: Colors.navy, fontSize: 14, fontWeight: '800' },
  count: { color: Colors.muted, fontSize: 13 },
  compact: { fontSize: 12 },
});
