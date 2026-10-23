import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { AppIcon } from './app-icon';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <AppIcon accent={Colors.red} color={Colors.navy} name="search" size={30} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  icon: {
    alignItems: 'center',
    backgroundColor: Colors.softRed,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    marginBottom: 15,
    width: 58,
  },
  title: { color: Colors.navy, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  description: { color: Colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
});
