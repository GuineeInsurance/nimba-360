import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { useFavorites } from '@/context/favorites-context';
import { Business } from '@/types/business';
import { AppIcon } from './app-icon';
import { Rating } from './rating';

type BusinessCardProps = { business: Business; horizontal?: boolean };

export function BusinessCard({ business, horizontal = false }: BusinessCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <Link href={{ pathname: '/business/[id]', params: { id: business.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.card, horizontal && styles.horizontalCard])}>
        <Image
          source={{ uri: business.imageUrl }}
          contentFit="cover"
          transition={250}
          style={[styles.image, horizontal && styles.horizontalImage]}
        />
        <View style={styles.distanceBadge}>
          <AppIcon color={Colors.white} name="location" size={12} />
          <Text style={styles.distanceText}>À {business.distanceKm.toFixed(1)} km</Text>
        </View>
        <Pressable
          accessibilityLabel={isFavorite(business.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation();
            toggleFavorite(business.id);
          }}
          style={styles.favorite}>
          <AppIcon
            accent={Colors.red}
            filled={isFavorite(business.id)}
            name="heart"
            size={21}
          />
        </Pressable>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.title}>
              {business.name}
            </Text>
            {business.verified && (
              <View style={styles.verified}>
                <AppIcon color={Colors.green} name="verified" size={12} />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            )}
          </View>
          <Rating rating={business.rating} reviewCount={business.reviewCount} compact={horizontal} />
          {horizontal && (
            <Text numberOfLines={1} style={styles.description}>
              {business.description}
            </Text>
          )}
          <Text style={styles.meta}>
            {business.category} · {business.neighborhood} · {business.distanceKm.toFixed(1)} km
          </Text>
          <Text style={[styles.open, !business.isOpen && styles.closed]}>
            {business.isOpen ? '● Ouvert maintenant' : '● Fermé'}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  horizontalCard: { width: '100%' },
  image: { width: '100%', height: 175, backgroundColor: Colors.surface },
  horizontalImage: { height: 132 },
  distanceBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 36, 48, 0.82)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    left: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute',
    top: 11,
  },
  distanceText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  favorite: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 38,
  },
  body: { gap: 5, padding: 13 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: Colors.navy, flex: 1, fontSize: 18, fontWeight: '900', letterSpacing: -0.35 },
  verified: {
    alignItems: 'center',
    backgroundColor: Colors.softGreen,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { color: Colors.green, fontSize: 10, fontWeight: '800' },
  description: { color: Colors.muted, fontSize: 11, lineHeight: 15 },
  meta: { color: Colors.muted, fontSize: 12 },
  open: { color: Colors.green, fontSize: 12, fontWeight: '700' },
  closed: { color: Colors.red },
});
