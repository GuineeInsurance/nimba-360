import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppIconName } from '@/components/app-icon';
import { EmptyState } from '@/components/empty-state';
import { Rating } from '@/components/rating';
import { Colors } from '@/constants/colors';
import { useFavorites } from '@/context/favorites-context';
import { useBusinesses } from '@/context/business-context';

export default function BusinessDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { businesses, loading, error } = useBusinesses();
  const business = businesses.find(item => item.id === id);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (loading) return <EmptyState title="Chargement…" description="Nous recherchons cette adresse." />;
  if (error) return <EmptyState title="Connexion indisponible" description={error} />;
  if (!business) {
    return <EmptyState title="Adresse introuvable" description="Cette fiche n’existe plus ou a été déplacée." />;
  }

  const call = () => Linking.openURL(`tel:${business.phone.replace(/\s/g, '')}`);
  const whatsapp = () => business.whatsapp && Linking.openURL(`https://wa.me/${business.whatsapp}`);
  const directions = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`,
    );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.heroWrap}>
        <Image contentFit="cover" source={{ uri: business.imageUrl }} style={styles.hero} />
        <Pressable onPress={() => toggleFavorite(business.id)} style={styles.favorite}>
          <AppIcon
            accent={Colors.red}
            filled={isFavorite(business.id)}
            name="heart"
            size={25}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{business.name}</Text>
          {business.verified && (
            <View style={styles.verified}>
              <AppIcon color={Colors.green} name="verified" size={14} />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>
        <Rating rating={business.rating} reviewCount={business.reviewCount} />
        <Text style={styles.meta}>
          {business.category} · {business.neighborhood}{Number.isFinite(business.distanceKm) ? ` · ${business.distanceKm.toFixed(1)} km` : ''}
        </Text>
        <Text style={styles.open}>{business.isOpen ? '● Ouvert maintenant' : '● Fermé'}</Text>

        <View style={styles.actions}>
          <Action label="Appeler" icon="phone" onPress={call} />
          <Action label="WhatsApp" icon="whatsapp" onPress={whatsapp} disabled={!business.whatsapp} />
          <Action label="Itinéraire" icon="route" onPress={directions} />
          <Action label="Partager" icon="share" onPress={() => undefined} />
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>À propos</Text>
        <Text style={styles.description}>{business.description}</Text>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.services}>
          {business.services.map((service) => (
            <Text key={service} style={styles.service}>
              {service}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Adresse</Text>
        <Pressable onPress={directions} style={styles.addressCard}>
          <View style={styles.mapPin}>
            <AppIcon accent={Colors.red} color={Colors.navy} name="location" size={23} />
          </View>
          <View style={styles.addressText}>
            <Text style={styles.address}>{business.address}</Text>
            <Text style={styles.directions}>Ouvrir l’itinéraire →</Text>
          </View>
        </Pressable>

        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Avis récents</Text>
          <Text style={styles.reviewLink}>Voir tout</Text>
        </View>
        <View style={styles.reviewCard}>
          <View style={styles.reviewPerson}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>MD</Text>
            </View>
            <View>
              <Text style={styles.reviewName}>Mamadou D.</Text>
              <View style={styles.reviewStars}>
                {[0, 1, 2, 3, 4].map((star) => (
                  <AppIcon accent={Colors.yellow} filled key={star} name="star" size={11} />
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.reviewText}>
            Très bon accueil et service attentif. Les informations de la fiche étaient exactes.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Action({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: AppIconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.action, disabled && styles.disabled]}>
      <View style={styles.actionIcon}>
        <AppIcon accent={Colors.green} color={Colors.navy} name={icon} size={22} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.cream },
  content: { paddingBottom: 36 },
  heroWrap: { position: 'relative' },
  hero: { backgroundColor: Colors.surface, height: 270, width: '100%' },
  favorite: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    top: 18,
    width: 44,
  },
  body: { padding: 20 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  title: { color: Colors.navy, flex: 1, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  verified: {
    alignItems: 'center',
    backgroundColor: Colors.softGreen,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedText: { color: Colors.green, fontSize: 11, fontWeight: '900' },
  meta: { color: Colors.muted, fontSize: 13, marginTop: 8 },
  open: { color: Colors.green, fontSize: 13, fontWeight: '800', marginTop: 6 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  action: { alignItems: 'center', gap: 7, width: '24%' },
  disabled: { opacity: 0.35 },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: Colors.softGreen,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  actionLabel: { color: Colors.navy, fontSize: 11, fontWeight: '700' },
  divider: { backgroundColor: Colors.border, height: 1, marginVertical: 26 },
  sectionTitle: { color: Colors.navy, fontSize: 19, fontWeight: '900', marginBottom: 10, marginTop: 18 },
  description: { color: Colors.muted, fontSize: 14, lineHeight: 22 },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  service: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: Colors.navy,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addressCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 15,
  },
  mapPin: {
    alignItems: 'center',
    backgroundColor: Colors.softRed,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  addressText: { flex: 1, paddingLeft: 12 },
  address: { color: Colors.navy, fontSize: 13, fontWeight: '800' },
  directions: { color: Colors.red, fontSize: 12, fontWeight: '700', marginTop: 4 },
  reviewHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  reviewLink: { color: Colors.red, fontSize: 12, fontWeight: '800' },
  reviewCard: { backgroundColor: Colors.white, borderColor: Colors.border, borderRadius: 17, borderWidth: 1, padding: 16 },
  reviewPerson: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  reviewAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.navy,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  reviewAvatarText: { color: Colors.white, fontSize: 11, fontWeight: '900' },
  reviewName: { color: Colors.navy, fontSize: 13, fontWeight: '900' },
  reviewStars: { flexDirection: 'row', gap: 1, marginTop: 3 },
  reviewText: { color: Colors.muted, fontSize: 13, lineHeight: 20, marginTop: 12 },
});
