import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { BusinessCard } from '@/components/business-card';
import { EmptyState } from '@/components/empty-state';
import { Colors } from '@/constants/colors';
import { categoryOptions } from '@/data/businesses';
import { DataNotice } from '@/components/data-notice';
import { useBusinesses } from '@/context/business-context';

const filters = ['Ouvert', 'Mieux notés', 'À proximité'];

export default function SearchScreen() {
  const { businesses } = useBusinesses();
  const params = useLocalSearchParams<{ category?: string }>();
  const searchInputRef = useRef<TextInputInstance>(null);
  const [queryText, setQueryText] = useState('');
  const [category, setCategory] = useState(params.category ?? 'Tout');
  const [activeFilter, setActiveFilter] = useState('À proximité');

  useFocusEffect(
    useCallback(() => {
      const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }, []),
  );

  const results = useMemo(() => {
    const query = queryText.trim().toLocaleLowerCase('fr');
    return businesses
      .filter((business) => category === 'Tout' || business.category === category)
      .filter((business) =>
        [business.name, business.category, business.neighborhood, ...business.services]
          .join(' ')
          .toLocaleLowerCase('fr')
          .includes(query),
      )
      .filter((business) => activeFilter !== 'Ouvert' || business.isOpen)
      .sort((a, b) => {
        if (activeFilter === 'Mieux notés') return b.rating - a.rating;
        return (Number.isFinite(a.distanceKm) ? a.distanceKm : Infinity) - (Number.isFinite(b.distanceKm) ? b.distanceKm : Infinity);
      });
  }, [activeFilter, category, queryText, businesses]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <DataNotice empty={<EmptyState
            title="Aucun résultat"
            description="Essayez une autre catégorie ou un terme plus général."
          />} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Explorer</Text>
            <View style={styles.searchBox}>
              <AppIcon accent={Colors.red} color={Colors.navy} name="search" size={22} />
              <TextInput
                autoCapitalize="none"
                onChangeText={setQueryText}
                placeholder="Nom, service ou quartier"
                placeholderTextColor="#7B858A"
                ref={searchInputRef}
                returnKeyType="search"
                style={styles.input}
                value={queryText}
              />
            </View>
            <FlatList
              contentContainerStyle={styles.chipRow}
              data={categoryOptions}
              horizontal
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
                  <Text
                    style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
            />
            <View style={styles.filterRow}>
              {filters.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}>
                  <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.resultHeader}>
              <Text style={styles.resultCount}>{results.length} adresse{results.length !== 1 ? 's' : ''}</Text>
              <Text style={styles.resultCity}>Conakry</Text>
            </View>
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
  heading: { color: Colors.navy, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 15 },
  searchBox: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 18,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  input: { color: Colors.navy, flex: 1, fontSize: 15, paddingHorizontal: 10 },
  chipRow: { gap: 9, paddingVertical: 16 },
  categoryChip: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  categoryChipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  categoryChipText: { color: Colors.navy, fontSize: 12, fontWeight: '700' },
  categoryChipTextActive: { color: Colors.white },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipActive: { backgroundColor: Colors.softRed },
  filterText: { color: Colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: Colors.red },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 13,
    paddingTop: 24,
  },
  resultCount: { color: Colors.navy, fontSize: 17, fontWeight: '900' },
  resultCity: { color: Colors.muted, fontSize: 12 },
  separator: { height: 14 },
});
