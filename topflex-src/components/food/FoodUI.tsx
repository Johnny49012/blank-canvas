import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { FOOD_IMAGES, formatGHS, getRestaurant, useFoodStore, type MenuItem } from '@/lib/food-store';

export const c = colors.light;

export function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`); else Alert.alert(title, msg);
}

export function FoodHeader({ title, subtitle, showCart = true }: { title: string; subtitle?: string; showCart?: boolean }) {
  const router = useRouter();
  const { cart } = useFoodStore();
  const count = cart.reduce((s, l) => s + l.qty, 0);
  return (
    <LinearGradient colors={[c.headerStart, '#08604c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
      <View style={s.bar}>
        <Pressable accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.white} />
        </Pressable>
        <View style={s.actions}>
          <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')}><Ionicons name="notifications-outline" size={22} color={c.white} /></Pressable>
          {showCart && (
            <Pressable accessibilityLabel="Open cart" onPress={() => router.push('/food-cart')}>
              <Ionicons name="bag-handle-outline" size={23} color={c.white} />
              {count > 0 && <View style={s.badge}><Text style={s.badgeText}>{count}</Text></View>}
            </Pressable>
          )}
        </View>
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

export function ItemRow({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  const router = useRouter();
  const r = getRestaurant(item.restaurantId);
  const ok = item.available && r?.isOpen;
  return (
    <Pressable onPress={() => router.push({ pathname: '/food-item', params: { id: item.id } })} style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}>
      <Image source={FOOD_IMAGES[item.image]} style={s.rowImg} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={s.rowDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={s.rowMeta} numberOfLines={1}>{r?.name}{!item.available ? ' · Unavailable' : !r?.isOpen ? ' · Closed' : ''}</Text>
        <Text style={s.price}>{formatGHS(item.price)}</Text>
      </View>
      <Pressable accessibilityLabel={`Add ${item.name}`} disabled={!ok} onPress={onAdd} style={[s.add, !ok && { backgroundColor: c.navMuted }]}>
        <Ionicons name="add" size={20} color={c.white} />
      </Pressable>
    </Pressable>
  );
}

export type FoodView = 'grid' | 'list';

export function ViewToggle({ view, onChange }: { view: FoodView; onChange: (v: FoodView) => void }) {
  return (
    <View style={s.toggleWrap} accessibilityRole="radiogroup" accessibilityLabel="Layout">
      {([['grid', 'grid-outline', 'Grid'], ['list', 'list-outline', 'List']] as const).map(([k, icon, l]) => {
        const on = view === k;
        return (
          <Pressable key={k} onPress={() => onChange(k)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${l} View`} accessibilityState={{ selected: on }}
            {...({ title: `${l} View` } as object)} style={[s.toggleBtn, on && s.toggleBtnOn]}>
            <Ionicons name={icon} size={15} color={on ? c.white : c.primary} />
            <Text style={[s.toggleText, on && { color: c.white }]}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ItemGridCard({ item, onAdd, width }: { item: MenuItem; onAdd: () => void; width?: number }) {
  const router = useRouter();
  const r = getRestaurant(item.restaurantId);
  const ok = item.available && r?.isOpen;
  return (
    <Pressable onPress={() => router.push({ pathname: '/food-item', params: { id: item.id } })} style={({ pressed }) => [s.gridCard, width ? { width, flexBasis: width } : null, pressed && { opacity: 0.85 }]}>
      <Image source={FOOD_IMAGES[item.image]} style={s.gridImg} />
      <View style={s.gridBody}>
        <Text style={s.rowTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={s.rowMeta} numberOfLines={1}>{r?.name}{!item.available ? ' · Unavailable' : !r?.isOpen ? ' · Closed' : ''}</Text>
        <View style={s.gridFoot}>
          <Text style={[s.price, { marginTop: 0 }]}>{formatGHS(item.price)}</Text>
          <Pressable accessibilityLabel={`Add ${item.name}`} disabled={!ok} onPress={onAdd} style={[s.add, { width: 30, height: 30 }, !ok && { backgroundColor: c.navMuted }]}>
            <Ionicons name="add" size={18} color={c.white} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function RestaurantRow({ id }: { id: string }) {
  const router = useRouter();
  const r = getRestaurant(id);
  if (!r) return null;
  return (
    <Pressable onPress={() => router.push({ pathname: '/food-restaurant', params: { id } })} style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}>
      <View style={s.rowLogo} accessibilityLabel={`${r.name} profile image`}>
        <Ionicons name="restaurant-outline" size={24} color={c.foreground} />
        <Text style={s.rowLogoName} numberOfLines={2}>{r.name}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{r.name}</Text>
        <Text style={s.rowDesc}>{r.cuisine}</Text>
        <Text style={[s.rowMeta, { color: r.isOpen ? c.primary : c.destructive }]}>{r.isOpen ? 'Open now' : 'Closed'}</Text>
        <Text style={s.rowMeta}>
          {r.rating != null ? `★ ${r.rating} (${r.reviews})` : ''}{r.deliveryMinutes ? ` · ${r.deliveryMinutes} min` : ''}{r.deliveryFee != null ? ` · ${formatGHS(r.deliveryFee)} delivery` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.navMuted} />
    </Pressable>
  );
}

export function RestaurantGridCard({ id }: { id: string }) {
  const router = useRouter();
  const r = getRestaurant(id);
  if (!r) return null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.cuisine}`} onPress={() => router.push({ pathname: '/food-restaurant', params: { id } })} style={({ pressed }) => [s.gridCard, pressed && { opacity: 0.85 }]}>
      <View>
        <Image source={FOOD_IMAGES[r.image]} style={s.gridImg} accessibilityLabel={`${r.name} background`} />
        <View style={s.gridLogo} accessibilityLabel={`${r.name} profile image`}>
          <Ionicons name="restaurant-outline" size={18} color={c.foreground} />
          <Text style={s.gridLogoName} numberOfLines={2}>{r.name}</Text>
        </View>
      </View>
      <View style={s.gridBody}>
        <Text style={s.rowTitle} numberOfLines={1}>{r.name}</Text>
        <Text style={s.rowDesc} numberOfLines={1}>{r.cuisine}</Text>
        <Text style={[s.rowMeta, { color: r.isOpen ? c.primary : c.destructive }]}>{r.isOpen ? 'Open now' : 'Closed'}</Text>
        <Text style={s.rowMeta} numberOfLines={1}>{r.rating != null ? `★ ${r.rating}` : ''}{r.deliveryMinutes ? ` · ${r.deliveryMinutes} min` : ''}</Text>
      </View>
    </Pressable>
  );
}

function chunk<T>(a: T[], n: number) { const o: T[][] = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }

/** Horizontal paged carousel; every page holds `perPage` entries, with page dots underneath. */
export function Pager<T>({ data, perPage, label, render, grid }: { data: T[]; perPage: number; label: string; render: (x: T, cardW: number) => React.ReactNode; grid?: boolean }) {
  const [w, setW] = useState(0);
  const [page, setPage] = useState(0);
  const pages = chunk(data, perPage);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => { if (w) setPage(Math.round(e.nativeEvent.contentOffset.x / w)); };
  const cardW = grid ? (w - 12) / 2 : w;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <ScrollView horizontal pagingEnabled snapToInterval={w} decelerationRate="fast" showsHorizontalScrollIndicator={false}
          onScroll={onScroll} scrollEventThrottle={16} accessibilityLabel={label}>
          {pages.map((pg, i) => (
            <View key={i} style={{ width: w }}>
              <View style={grid ? s.gridWrap : { gap: 12 }}>{pg.map((x) => render(x, cardW))}</View>
            </View>
          ))}
        </ScrollView>
      )}
      {pages.length > 1 && (
        <View style={s.dots} accessibilityRole="text" accessibilityLabel={`${label}: page ${page + 1} of ${pages.length}`}>
          {pages.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotOn]} />)}
        </View>
      )}
    </View>
  );
}

export function SectionHead({ title, onSeeAll, seeAllLabel }: { title: string; onSeeAll?: () => void; seeAllLabel?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={s.section}>{title}</Text>
      {onSeeAll && <Pressable onPress={onSeeAll} accessibilityRole="link" accessibilityLabel={seeAllLabel ?? `See all ${title}`} hitSlop={8}><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>See All</Text></Pressable>}
    </View>
  );
}

export function Btn({ label, onPress, variant = 'primary', disabled }: { label: string; onPress: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [s.btn, variant === 'ghost' && s.btnGhost, (pressed || disabled) && { opacity: 0.6 }]}>
      <Text style={[s.btnText, variant === 'ghost' && { color: c.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function SummaryRows({ rows }: { rows: [string, number, boolean?][] }) {
  return <View style={s.card}>{rows.map(([k, v, bold]) => <View key={k} style={s.sumRow}><Text style={[s.sumK, bold && s.bold]}>{k}</Text><Text style={[s.sumV, bold && s.bold]}>{formatGHS(v)}</Text></View>)}</View>;
}

export const s = StyleSheet.create({
  toggleWrap: { flexDirection: 'row', alignSelf: 'flex-end', backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 3, gap: 3 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 17 },
  toggleBtnOn: { backgroundColor: c.primary },
  toggleText: { color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { flexBasis: '47.5%', flexGrow: 0, backgroundColor: c.white, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  gridImg: { width: '100%', height: 110 },
  gridLogo: { position: 'absolute', bottom: -14, left: 10, width: 52, height: 52, borderRadius: 26, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', padding: 4, gap: 1 },
  gridLogoName: { fontFamily: 'Inter_700Bold', fontSize: 6, textAlign: 'center', color: c.foreground },
  gridBody: { padding: 10, paddingTop: 18, gap: 2 },
  gridFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.border },
  dotOn: { width: 18, backgroundColor: c.primary },
  screen: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 26, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: c.white, fontSize: 10, fontFamily: 'Inter_700Bold' },
  title: { color: c.white, fontFamily: 'Inter_700Bold', fontSize: 24, marginTop: 18 },
  subtitle: { color: '#cdeee2', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  body: { padding: 16, gap: 14 },
  section: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 },
  card: { backgroundColor: c.white, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.white, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 10 },
  rowImg: { width: 78, height: 78, borderRadius: 12 },
  rowLogo: { width: 78, height: 78, borderRadius: 39, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 2 },
  rowLogoName: { fontFamily: 'Inter_700Bold', fontSize: 9, textAlign: 'center', color: c.foreground },
  rowTitle: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 },
  rowDesc: { color: c.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  rowMeta: { color: c.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
  price: { color: c.primary, fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 4 },
  add: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  btn: { minHeight: 50, borderRadius: 14, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnGhost: { backgroundColor: c.softMint },
  btnText: { color: c.white, fontFamily: 'Inter_700Bold', fontSize: 14 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumK: { color: c.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 },
  sumV: { color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  bold: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 },
  empty: { alignItems: 'center', padding: 30, gap: 8 },
  emptyTitle: { color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 },
  emptyText: { color: c.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 13, color: c.foreground },
});
