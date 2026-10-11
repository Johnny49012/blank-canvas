import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, FoodHeader, ItemRow, c, notify, s } from '@/components/food/FoodUI';
import { MENU, addToCart, formatGHS, getRestaurant, type FoodCategory, type MenuItem } from '@/lib/food-store';
import restaurantInterior from '@/src/assets/food/restaurant-interior.jpg';

export default function RestaurantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = getRestaurant(id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cat, setCat] = useState<FoodCategory | 'All'>('All');
  if (!r) return <View style={s.screen}><FoodHeader title="Restaurant" /><View style={s.empty}><Text style={s.emptyTitle}>Restaurant not found</Text></View></View>;
  const menu = MENU.filter((m) => m.restaurantId === r.id);
  const cats = ['All', ...Array.from(new Set(menu.flatMap((m) => m.categories)))] as (FoodCategory | 'All')[];
  const shown = menu.filter((m) => cat === 'All' || m.categories.includes(cat));
  const add = (item: MenuItem) => {
    if (item.portions?.length || item.extras?.length) return router.push({ pathname: '/food-item', params: { id: item.id } });
    try { addToCart(item.id); notify('Added to cart', `${item.name} was added.`); } catch (e) { notify('Unavailable', (e as Error).message); }
  };
  if (menuOpen) return (
    <ScrollView style={s.screen}>
      <FoodHeader title={r.name} subtitle={r.cuisine} />
      <View style={s.body}>
        <Btn variant="ghost" label="Restaurant details" onPress={() => setMenuOpen(false)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {cats.map((k) => <Pressable key={k} onPress={() => setCat(k)} style={[s.chip, cat === k && s.chipOn]}><Text style={[s.chipText, cat === k && { color: c.white }]}>{k}</Text></Pressable>)}
        </ScrollView>
        {shown.map((i) => <ItemRow key={i.id} item={i} onAdd={() => add(i)} />)}
      </View>
    </ScrollView>
  );
  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rs.scroll}>
        <View style={rs.cover}>
          <Image source={restaurantInterior} style={rs.coverImage} accessibilityLabel="Sample restaurant interior" />
          <Pressable accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/food')} style={rs.back}><Ionicons name="arrow-back" size={23} color={c.white} /></Pressable>
        </View>
        <View style={rs.identity}>
          <View style={rs.logo}><Ionicons name="restaurant-outline" size={30} color={c.foreground} /><Text style={rs.logoName} numberOfLines={2}>{r.name}</Text></View>
          <Text style={rs.name}>{r.name}</Text>
          <View style={rs.rating}><Ionicons name="star" size={16} color={c.primary} /><Text style={rs.ratingText}>{r.rating ?? '—'} <Text style={rs.reviewText}>({r.reviews ?? 0} reviews)</Text></Text></View>
          <View style={rs.badges}>
            <View style={rs.badge}><Ionicons name="bicycle-outline" size={14} color={c.primary} /><Text style={rs.badgeText}>Delivery</Text></View>
            <View style={rs.badge}><Ionicons name="time-outline" size={14} color={r.isOpen ? c.primary : c.destructive} /><Text style={[rs.badgeText, !r.isOpen && { color: c.destructive }]}>{r.isOpen ? 'Open Now' : 'Closed'}</Text></View>
          </View>
        </View>
        <View style={rs.content}>
          <View style={rs.facts}>
            <Fact icon="shield-checkmark-outline" text={`Delivery Fee: ${r.deliveryFee == null ? 'Unavailable' : formatGHS(r.deliveryFee)}`} />
            <Fact icon="time-outline" text={`Delivery Time: ${r.deliveryMinutes == null ? 'Unavailable' : `approx. ${r.deliveryMinutes} mins`}`} />
            <Fact icon="calendar-outline" text={r.hours} />
          </View>
          <Text style={s.section}>About</Text>
          <Text style={rs.description}>{r.description}</Text>
          <Btn variant="ghost" label="View Menu" onPress={() => setMenuOpen(true)} />
          <View style={rs.location}>
            <View style={rs.locationInfo}><Text style={s.section}>Location</Text><Fact icon="location-outline" text={r.area} /></View>
            <Pressable accessibilityLabel="Confirm delivery location" onPress={() => router.push('/food-location')} style={rs.locationButton}><Ionicons name="location" size={28} color={c.primary} /><Ionicons name="chevron-forward" size={14} color={c.primary} /></Pressable>
          </View>
          <Text style={s.emptyText}>Test mode · sample restaurant and interior photo</Text>
        </View>
      </ScrollView>
      <View style={rs.bottom}><Btn label="View Menu" onPress={() => setMenuOpen(true)} /></View>
    </View>
  );
}
function Fact({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return <View style={rs.fact}><Ionicons name={icon} size={15} color={c.mutedForeground} /><Text style={rs.factText}>{text}</Text></View>;
}
const rs = StyleSheet.create({
  scroll: { paddingBottom: 20 },
  cover: { height: 180 },
  coverImage: { width: '100%', height: '100%' },
  back: { position: 'absolute', top: 18, left: 18, width: 38, height: 38, borderRadius: 19, backgroundColor: c.headerStart, alignItems: 'center', justifyContent: 'center' },
  identity: { alignItems: 'center', gap: 9, paddingHorizontal: 20 },
  logo: { marginTop: -48, width: 100, height: 100, borderRadius: 50, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 4 },
  logoName: { fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'center', color: c.foreground },
  name: { fontFamily: 'Inter_700Bold', fontSize: 22, color: c.foreground, textAlign: 'center' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  reviewText: { color: c.mutedForeground, fontFamily: 'Inter_400Regular' },
  badges: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.secondary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: c.primary, fontFamily: 'Inter_500Medium', fontSize: 11 },
  content: { padding: 20, gap: 17 },
  facts: { gap: 10, marginBottom: 8 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  factText: { flex: 1, color: c.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 19 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 23, color: c.mutedForeground },
  location: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  locationInfo: { flex: 1, gap: 12 },
  locationButton: { width: 70, height: 62, borderRadius: 8, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  bottom: { padding: 18, backgroundColor: c.white, borderTopWidth: 1, borderColor: c.border },
});
