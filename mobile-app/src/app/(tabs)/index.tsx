import { useRouter } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, AppIconName } from '@/components/app-icon';
import { BrandLockup } from '@/components/brand-lockup';
import { BusinessCard } from '@/components/business-card';
import { Colors } from '@/constants/colors';
import { categoryOptions } from '@/data/businesses';
import { DataNotice } from '@/components/data-notice';
import { useBusinesses } from '@/context/business-context';

const categoryIcons: Record<string, AppIconName> = {
  Restaurants: 'restaurant',
  Santé: 'health',
  Garages: 'car',
  Hôtels: 'hotel',
  Services: 'services',
};

const categoryColors: Record<string, string> = {
  Restaurants: Colors.red,
  Santé: Colors.green,
  Garages: Colors.navy,
  Hôtels: Colors.yellow,
  Services: Colors.slate,
};

export default function HomeScreen() {
  const { businesses } = useBusinesses();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mobileCanvas}>
        <DataNotice />
        <View style={styles.header}>
          <BrandLockup />
          <View style={styles.location}>
            <AppIcon accent={Colors.red} color={Colors.navy} name="location" size={15} />
            <Text style={styles.locationText}>Conakry</Text>
            <Text style={styles.chevron}>⌄</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heading}>Qu’est-ce qu’on cherche aujourd’hui ?</Text>
          <Text style={styles.heroSubtitle}>Trouvez les meilleures adresses en Guinée</Text>
          <Pressable onPress={() => router.navigate('/search')} style={styles.searchBox}>
            <AppIcon accent={Colors.red} color={Colors.navy} name="search" size={22} />
            <TextInput
              editable={false}
              pointerEvents="none"
              placeholder="Restaurant, garage, hôtel…"
              placeholderTextColor="#7B858A"
              style={styles.searchInput}
            />
            <View style={styles.filterIcon}>
              <AppIcon accent={Colors.red} color={Colors.navy} name="filter" size={20} />
            </View>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.categories}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {categoryOptions.slice(1).map((category) => (
            <Pressable
              key={category}
              onPress={() => router.navigate({ pathname: '/search', params: { category } })}
              style={styles.category}>
              <View style={[styles.categoryIcon, { backgroundColor: categoryColors[category] }]}>
                <AppIcon
                  accent={Colors.white}
                  color={category === 'Hôtels' ? Colors.navy : Colors.white}
                  name={categoryIcons[category]}
                  size={25}
                />
              </View>
              <Text style={styles.categoryLabel}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Près de vous</Text>
            <Text style={styles.sectionSubtitle}>Les bonnes adresses autour de Conakry</Text>
          </View>
          <Pressable onPress={() => router.navigate('/search')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </Pressable>
        </View>

        <View style={styles.featured}>
          {businesses.slice(0, 3).map((business) => (
            <BusinessCard business={business} horizontal key={business.id} />
          ))}
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustMark}>
            <Text style={styles.trustMarkText}>✓</Text>
          </View>
          <View style={styles.trustText}>
            <Text style={styles.trustTitle}>Choisissez en confiance</Text>
            <Text style={styles.trustDescription}>
              Les fiches vérifiées confirment les coordonnées essentielles.
            </Text>
          </View>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.cream },
  content: { alignItems: 'center', paddingBottom: 28 },
  mobileCanvas: { maxWidth: 520, width: '100%' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  location: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  locationText: { color: Colors.navy, fontSize: 12, fontWeight: '800' },
  chevron: { color: Colors.muted, fontSize: 14 },
  hero: { paddingHorizontal: 18, paddingTop: 23 },
  heading: {
    color: Colors.navy,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -1.15,
    lineHeight: 31,
    maxWidth: 360,
  },
  heroSubtitle: { color: Colors.muted, fontSize: 13, marginBottom: 16, marginTop: 5 },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 14,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  searchInput: { color: Colors.navy, flex: 1, fontSize: 14, paddingHorizontal: 10 },
  filterIcon: {
    alignItems: 'center',
    backgroundColor: Colors.softRed,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  categories: { flexGrow: 1, gap: 10, justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 20 },
  category: { alignItems: 'center', gap: 7, width: 62 },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    width: 54,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 9,
    elevation: 3,
  },
  categoryLabel: { color: Colors.navy, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  sectionTitle: { color: Colors.navy, fontSize: 23, fontWeight: '900', letterSpacing: -0.65 },
  sectionSubtitle: { color: Colors.muted, fontSize: 12, marginTop: 3 },
  seeAll: { color: Colors.red, fontSize: 13, fontWeight: '800' },
  featured: { gap: 13, paddingHorizontal: 18, paddingVertical: 14 },
  trustCard: {
    alignItems: 'center',
    backgroundColor: Colors.softGreen,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 14,
    marginHorizontal: 18,
    marginTop: 5,
    padding: 18,
  },
  trustMark: {
    alignItems: 'center',
    backgroundColor: Colors.green,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  trustMarkText: { color: Colors.white, fontSize: 20, fontWeight: '900' },
  trustText: { flex: 1 },
  trustTitle: { color: Colors.navy, fontSize: 15, fontWeight: '900' },
  trustDescription: { color: Colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
});
