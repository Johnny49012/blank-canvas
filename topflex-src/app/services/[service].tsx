import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { WalletMoneyFlow } from '@/components/wallet/WalletMoneyFlow';
import { WalletAddMoneyFlow } from '@/components/wallet/WalletAddMoneyFlow';
import type { WalletFundingMethod } from '@/lib/wallet-sandbox';
import { AllServicesScreen } from '@/components/AllServicesScreen';

const serviceCopy: Record<string, { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; action: string }> = {
  data: { title: 'Buy Data', subtitle: 'Choose a network and data bundle from the existing TopFlex airtime and data service.', icon: 'wifi-outline', action: 'Open data bundles' },
  airtime: { title: 'Buy Airtime', subtitle: 'Top up any supported Ghana network from your TopFlex account.', icon: 'phone-portrait-outline', action: 'Open airtime' },
  'send-money': { title: 'Send Money', subtitle: 'Send money from your TopFlex wallet. Transfer setup is not connected yet.', icon: 'swap-horizontal-outline', action: 'Open transfer' },
  bills: { title: 'Pay Bills', subtitle: 'Pay supported bills and keep your everyday services in one place.', icon: 'receipt-outline', action: 'Open bills' },
  services: { title: 'All Services', subtitle: 'Explore data, airtime, bills, gift cards, TV subscriptions, and exam PINs.', icon: 'grid-outline', action: 'Explore services' },
  'add-money': { title: 'Add Money', subtitle: 'Add funds to your TopFlex wallet. Funding setup is not connected yet.', icon: 'add-circle-outline', action: 'Open wallet funding' },
  settings: { title: 'Settings', subtitle: 'Manage the account preferences already associated with your TopFlex profile.', icon: 'settings-outline', action: 'Open settings' },
  support: { title: 'Support', subtitle: 'Get help with your account, wallet, and TopFlex services.', icon: 'help-circle-outline', action: 'Contact support' },
};

export default function ServiceScreen() {
  const router = useRouter();
  const { service, method } = useLocalSearchParams<{ service: string; method?: WalletFundingMethod }>();
  if (service === 'add-money') return <WalletAddMoneyFlow method={method ?? 'mobile-money'} />;
  if (service === 'send-money') return <WalletMoneyFlow kind="send-money" />;
  if (service === 'services') return <AllServicesScreen />;
  const copy = serviceCopy[service ?? 'services'] ?? serviceCopy.services;
  const isMoneyAction = service === 'add-money' || service === 'send-money';
  const statusCopy = service === 'add-money'
    ? 'No deposit can be started until a payment provider and secure funding service are connected.'
    : 'No transfer can be started until a secure TopFlex transfer service is connected.';
  return <View style={styles.screen}><View style={styles.top}><Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="arrow-back" size={21} color={colors.light.foreground} /></Pressable><Text style={styles.heading}>{copy.title}</Text><View style={{ width: 21 }} /></View><ScrollView contentContainerStyle={styles.content}><View style={styles.hero}><View style={styles.icon}><Ionicons name={copy.icon} size={29} color={colors.light.primary} /></View><Text style={styles.title}>{copy.title}</Text><Text style={styles.subtitle}>{copy.subtitle}</Text></View><View style={styles.card}><Text style={styles.cardTitle}>{isMoneyAction ? 'Service status' : 'Existing TopFlex service'}</Text><Text style={styles.cardText}>{isMoneyAction ? statusCopy : 'This mobile entry point is connected to your authenticated TopFlex account. The service flow can use the same wallet, verification, and transaction rules as the original app.'}</Text><Pressable onPress={() => service === 'airtime' ? router.push('/airtime') : router.replace('/(tabs)')} style={styles.action}><Text style={styles.actionText}>{service === 'airtime' ? copy.action : 'Return to Home'}</Text><Ionicons name="arrow-forward" size={17} color={colors.light.white} /></Pressable></View></ScrollView></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.light.background }, top: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 18, backgroundColor: colors.light.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.light.border }, heading: { fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.light.foreground }, content: { padding: 18 }, hero: { backgroundColor: colors.light.headerEnd, borderRadius: 22, padding: 22, minHeight: 220, justifyContent: 'flex-end' }, icon: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center', marginBottom: 45 }, title: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 27 }, subtitle: { color: '#c5f4e2', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 9 }, card: { marginTop: 14, backgroundColor: colors.light.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.light.border }, cardTitle: { fontFamily: 'Inter_700Bold', color: colors.light.foreground, fontSize: 13 }, cardText: { fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 8 }, action: { marginTop: 18, minHeight: 48, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, actionText: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 12 } });
