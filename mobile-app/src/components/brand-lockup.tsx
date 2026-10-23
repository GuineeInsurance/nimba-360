import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export function BrandLockup() {
  return (
    <View accessibilityLabel="NIMBA 360" style={styles.row}>
      <Text style={styles.name}>NIMBA</Text>
      <View style={styles.mark}>
        <Text style={styles.markText}>360</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { color: Colors.navy, fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  mark: {
    backgroundColor: Colors.green,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderTopWidth: 3,
    borderTopColor: Colors.red,
    transform: [{ rotate: '-4deg' }],
  },
  markText: { color: Colors.white, fontSize: 11, fontWeight: '900' },
});
