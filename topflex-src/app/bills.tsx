import React from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import colors from '@/constants/colors';
import { loadHomeData } from '@/lib/topflex';

type CategoryKey = 'electricity' | 'water' | 'tv' | 'internet';
type Category = {
  key: CategoryKey; title: string; subtitle: string; heading: string; prompt: string;
  icon: React.ReactNode; bg: string;
  providers: Array<{ name: string; detail: string; color: string }>;
};

const categories: Category[] = [
  { key: 'electricity', title: 'Electricity', subtitle: 'Prepaid & Postpaid', heading: 'Electricity', prompt: 'Choose your electricity provider.', bg: '#fdebd8',
    icon: <Ionicons name="flash" size={26} color="#f07a1a" />,
    providers: [
      { name: 'ECG', detail: 'Electricity Company of Ghana', color: '#1f4fa3' },
      { name: 'NEDCo', detail: 'Northern Electricity Distribution Company', color: '#2e8b57' },
    ] },
  { key: 'water', title: 'Water', subtitle: 'Prepaid & Postpaid', heading: 'Water', prompt: 'Choose your water provider.', bg: '#e0ecfc',
    icon: <Ionicons name="water" size={26} color="#2f7fe8" />,
    providers: [
      { name: 'GWCL', detail: 'Ghana Water Company Limited', color: '#2f7fe8' },
      { name: 'Prepaid Water Meter', detail: 'Direct Top-Up', color: '#0e7490' },
    ] },
  { key: 'tv', title: 'TV Subscription', subtitle: 'DSTV, GOtv, Startimes', heading: 'TV Subscription', prompt: 'Choose your TV provider.', bg: '#fde2e2',
    icon: <Ionicons name="tv-outline" size={26} color="#e53935" />,
    providers: [
      { name: 'DSTV', detail: 'MultiChoice Ghana', color: '#0369a1' },
      { name: 'GOtv', detail: 'MultiChoice Ghana', color: '#65a30d' },
      { name: 'Startimes', detail: 'StarTimes Ghana', color: '#ea580c' },
    ] },
  { key: 'internet', title: 'Internet', subtitle: 'MTN, AirtelTigo, Telecel', heading: 'Internet', prompt: 'Choose your internet service provider.', bg: '#d9f5e8',
    icon: <MaterialCommunityIcons name="wifi" size={28} color="#12925f" />,
    providers: [
      { name: 'MTN', detail: 'MTN Broadband', color: '#eab308' },
      { name: 'AirtelTigo', detail: 'AirtelTigo Internet', color: '#dc2626' },
      { name: 'Telecel', detail: 'Telecel Fibre & Broadband', color: '#b91c1c' },
    ] },
];

function WaveFooter() {
  return (
    <View style={styles.footer}>
      <Svg width="100%" height="100%" viewBox="0 0 400 70" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Path d="M0 30 C 90 0, 180 10, 260 22 S 370 30, 400 8 L400 70 L0 70 Z" fill="#0a6b52" opacity={0.55} />
        <Path d="M0 42 C 100 18, 200 20, 280 34 S 370 40, 400 22 L400 70 L0 70 Z" fill={colors.light.headerStart} />
      </Svg>
      <View style={styles.footerBody}>
        <Text style={styles.tagline}>More value. More connection.</Text>
      </View>
    </View>
  );
}

export default function BillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { data } = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData });
  const topInset = Platform.OS === 'web' ? 16 : insets.top;
  const active = categories.find((c) => c.key === category);
  const name = data?.profile?.fullName ?? 'TopFlex';

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.light.headerStart, '#08604c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: topInset + 12 }]}>
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
          <Text style={styles.title}>{active ? active.heading : 'Pay Bills'}</Text>
          <Text style={styles.subtitle}>{active ? active.prompt : 'Choose a bill category to get started.'}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {!active
            ? categories.map((c) => (
                <Pressable key={c.key} testID={`bill-${c.key}`} accessibilityRole="button" onPress={() => router.push({ pathname: '/bills', params: { category: c.key } })} style={({ pressed, hovered }: any) => [styles.card, (pressed || hovered) && styles.cardPressed]}>
                  <View style={[styles.iconCircle, { backgroundColor: c.bg }]}>{c.icon}</View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    <Text style={styles.cardSub}>{c.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9fb3ad" />
                </Pressable>
              ))
            : (
              <>
                {active.providers.map((p) => (
                  <Pressable key={p.name} accessibilityRole="button" onPress={() => p.name === 'ECG' ? router.push('/ecg') : p.name === 'NEDCo' ? router.push('/nedco') : p.name === 'DSTV' ? router.push('/dstv') : p.name === 'GOtv' ? router.push('/gotv') : Alert.alert(p.name, 'Bill payment for this provider is not connected yet. No payment will be made.')} style={({ pressed, hovered }: any) => [styles.card, (pressed || hovered) && styles.cardPressed]}>
                    <View style={[styles.iconCircle, styles.providerCircle, { backgroundColor: p.color }]}>
                      <Text style={styles.providerInitial}>{p.name.slice(0, 1)}</Text>
                    </View>
                    <View style={styles.cardCopy}>
                      <Text style={styles.cardTitle}>{p.name}</Text>
                      <Text style={styles.cardSub}>{p.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#9fb3ad" />
                  </Pressable>
                ))}
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={17} color={colors.light.primary} />
                  <Text style={styles.noticeText}>Provider payments aren't connected yet in this preview. No bill will be charged.</Text>
                </View>
              </>
            )}
        </View>
        <WaveFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3fbf8' },
  scroll: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 44 },
  headerBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backBtn: { marginRight: 14 },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40 },
  avatarText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  title: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 30 },
  subtitle: { color: '#e3f6ef', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 8 },
  body: { flex: 1, marginTop: -24, backgroundColor: '#f3fbf8', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 28, gap: 14 },
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 84, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, backgroundColor: colors.light.white, borderWidth: 1, borderColor: '#e6f2ee', shadowColor: '#0b3d33', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardPressed: { backgroundColor: '#f0faf6', transform: [{ scale: 0.99 }] },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  providerCircle: { width: 48, height: 48, borderRadius: 24, marginHorizontal: 4 },
  providerInitial: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 18 },
  cardCopy: { flex: 1, marginLeft: 18 },
  cardTitle: { color: '#16384a', fontFamily: 'Inter_700Bold', fontSize: 17 },
  cardSub: { color: '#8a9ea6', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 5 },
  notice: { padding: 13, borderRadius: 14, backgroundColor: colors.light.softMint, flexDirection: 'row', gap: 8 },
  noticeText: { flex: 1, color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  footer: { height: 150, justifyContent: 'flex-end' },
  footerBody: { backgroundColor: colors.light.headerStart, height: 95, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 8 },
  tagline: { color: colors.light.white, fontFamily: 'Inter_500Medium', fontSize: 13 },
});
