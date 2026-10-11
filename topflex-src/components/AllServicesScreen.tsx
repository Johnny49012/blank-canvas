import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import colors from '@/constants/colors';
import { loadHomeData } from '@/lib/topflex';

type Service = { key: string; title: string; description: string; bg: string; icon: React.ReactNode; route?: '/airtime' | '/data' | '/bills' | '/food' };

const services: Service[] = [
  { key: 'airtime', title: 'Buy Airtime', description: 'Top up any supported mobile network.', bg: '#d6f5e7', route: '/airtime', icon: <Ionicons name="phone-portrait" size={26} color="#0d7a4f" /> },
  { key: 'data', title: 'Buy Data', description: 'Purchase data bundles for your mobile network.', bg: '#dce9fb', route: '/data', icon: <MaterialCommunityIcons name="database" size={28} color="#2563eb" /> },
  { key: 'bills', title: 'Pay Bills', description: 'Pay your utility bills and subscriptions.', bg: '#fde6cf', route: '/bills', icon: <Ionicons name="flash" size={26} color="#f08a1a" /> },
  { key: 'nhis', title: 'NHIS Services', description: 'Access available NHIS services.', bg: '#ece0fb', icon: <MaterialCommunityIcons name="shield-plus-outline" size={28} color="#6d28d9" /> },
  { key: 'insurance', title: 'Insurance', description: 'Explore available insurance services.', bg: '#d6f5e7', icon: <MaterialCommunityIcons name="shield-half-full" size={28} color="#0d7a4f" /> },
  { key: 'gift-cards', title: 'Gift Cards', description: 'Explore available gift card services.', bg: '#fdf3c7', icon: <Ionicons name="gift-outline" size={27} color="#b7791f" /> },
  { key: 'payment-cards', title: 'Payment Cards', description: 'Access available payment card services.', bg: '#ece0fb', icon: <Ionicons name="card-outline" size={27} color="#6d28d9" /> },
  { key: 'marketplace', title: 'Marketplace', description: 'Shop more. Live better — deals, gadgets, and everyday essentials.', bg: '#ffe4ef', icon: <MaterialCommunityIcons name="storefront-outline" size={28} color="#db2777" /> },
  { key: 'food-drink', route: '/food', title: 'Food & Drink', description: 'Order from your favourite restaurants — hot meals, drinks and snacks.', bg: '#ffe3d6', icon: <MaterialCommunityIcons name="silverware-fork-knife" size={27} color="#e2543a" /> },
];

export function AllServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData });
  const [query, setQuery] = useState('');
  const filtered = services.filter((s) => `${s.title} ${s.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const topInset = Platform.OS === 'web' ? 16 : insets.top;
  const name = data?.profile?.fullName ?? 'TopFlex';
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const open = (s: Service) => {
    if (s.route) return router.push(s.route);
    const msg = `${s.title} isn't available yet. We'll let you know when it's ready.`;
    if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Coming soon', msg);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={[colors.light.headerStart, '#08604c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.toolbar, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerBar}>
          <Pressable accessibilityLabel="Go back" onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.light.white} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} hitSlop={8}>
              <Ionicons name="notifications-outline" size={23} color={colors.light.white} />
            </Pressable>
            <Pressable accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={styles.avatar}>
              {data?.profile?.avatarUrl ? <Image source={{ uri: data.profile.avatarUrl }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>}
            </Pressable>
          </View>
        </View>
      </LinearGradient>
      <View testID="services-sticky-header">
        <LinearGradient colors={[colors.light.headerStart, '#08604c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.title}>All Services</Text>
          <Text style={styles.subtitle}>Everything you need, all in one place.</Text>
        </LinearGradient>

      <View style={styles.body}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#7d929a" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search services"
            placeholderTextColor="#9fb3ad"
            accessibilityLabel="Search services"
            testID="services-search"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9fb3ad" />
            </Pressable>
          )}
        </View>
      </View>
      </View>
        <View style={[styles.list, styles.listContent]}>
          {filtered.map((s) => (
            <Pressable key={s.key} testID={`service-${s.key}`} accessibilityRole="button" onPress={() => open(s)} style={({ pressed, hovered }: any) => [styles.card, (pressed || hovered) && styles.cardPressed]}>
              <View style={[styles.iconCircle, { backgroundColor: s.bg }]}>{s.icon}</View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardSub}>{s.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#9fb3ad" />
            </Pressable>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={26} color="#9fb3ad" />
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptyText}>Try a different name, like "airtime" or "bills".</Text>
            </View>
          )}
          <View style={styles.footer}>
            <Svg width="100%" height="100%" viewBox="0 0 400 70" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
              <Path d="M0 30 C 90 0, 180 10, 260 22 S 370 30, 400 8 L400 70 L0 70 Z" fill="#0a6b52" opacity={0.55} />
              <Path d="M0 42 C 100 18, 200 20, 280 34 S 370 40, 400 22 L400 70 L0 70 Z" fill={colors.light.headerStart} />
            </Svg>
            <View style={styles.footerBody}>
              <Text style={styles.tagline}>More value. More connection.</Text>
            </View>
          </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3fbf8' },
  screenContent: { flexGrow: 1 },
  toolbar: { paddingHorizontal: 20, paddingBottom: 22 },
  header: { paddingHorizontal: 20, paddingBottom: 44 },
  headerBar: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 14 },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40 },
  avatarText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 46, borderRadius: 23, backgroundColor: colors.light.white, borderWidth: 1, borderColor: '#e6f2ee', shadowColor: '#0b3d33', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  searchInput: { flex: 1, color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 14, padding: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}) },
  list: { width: '100%', maxWidth: 592, alignSelf: 'center' },
  listContent: { gap: 12, paddingHorizontal: 16, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 34, gap: 8 },
  emptyTitle: { color: '#16384a', fontFamily: 'Inter_700Bold', fontSize: 15 },
  emptyText: { color: '#7d929a', fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
  title: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 30 },
  subtitle: { color: '#e3f6ef', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 8 },
  body: { marginTop: -24, backgroundColor: '#f3fbf8', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 80, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 18, backgroundColor: colors.light.white, borderWidth: 1, borderColor: '#e6f2ee', shadowColor: '#0b3d33', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardPressed: { backgroundColor: '#f0faf6', transform: [{ scale: 0.99 }] },
  iconCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, marginLeft: 16, marginRight: 8 },
  cardTitle: { color: '#16384a', fontFamily: 'Inter_700Bold', fontSize: 16 },
  cardSub: { color: '#7d929a', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4, lineHeight: 18 },
  footer: { height: 150, justifyContent: 'flex-end' },
  footerBody: { backgroundColor: colors.light.headerStart, height: 95, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 8 },
  tagline: { color: colors.light.white, fontFamily: 'Inter_500Medium', fontSize: 13 },
});
