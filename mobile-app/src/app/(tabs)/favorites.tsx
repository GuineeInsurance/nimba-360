import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { BusinessCard } from '@/components/business-card';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/colors';
import { useFavorites } from '@/context/favorites-context';
import { businesses } from '@/data/businesses';

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const saved = businesses.filter((business) => favorites.includes(business.id));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={saved}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            title="Aucun favori pour le moment"
            description="Touchez le cœur d’une adresse pour la retrouver rapidement ici."
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.heart}>
              <AppIcon accent={Colors.red} filled name="heart" size={25} />
            </View>
            <Text style={styles.heading}>Mes favoris</Text>
            <Text style={styles.subtitle}>Vos bonnes adresses, toujours à portée de main.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <BusinessCard business={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.cream, flex: 1 },
  content: { paddingBottom: 24, paddingHorizontal: 20 },
  header: { paddingBottom: 22, paddingTop: 14 },
  heart: {
    alignItems: 'center',
    backgroundColor: Colors.softRed,
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  heading: { color: Colors.navy, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  subtitle: { color: Colors.muted, fontSize: 14, marginTop: 5 },
  separator: { height: 14 },
});
