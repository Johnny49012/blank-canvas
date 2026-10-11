import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { formatGhs, formatTransactionTime, firstName, loadHomeData, type HomeData } from '@/lib/topflex';

const quickActions = [
  { label: 'Buy Data', icon: 'wifi-outline' as const, service: 'data' },
  { label: 'Buy Airtime', icon: 'phone-portrait-outline' as const, service: 'airtime' },
  { label: 'Foods & Drinks', icon: 'restaurant-outline' as const, service: 'food' },
  { label: 'Pay Bills', icon: 'receipt-outline' as const, service: 'bills' },
];

function BrandMark() {
  return (
    <View style={styles.brandWrap}>
      <LinearGradient colors={['#82efd0', '#75c5f1']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.brandMark}>
        <Text style={styles.brandMarkText}>T</Text>
      </LinearGradient>
      <Text style={styles.brandName}>Top<Text style={styles.brandNameAccent}>Flex</Text></Text>
    </View>
  );
}

function Header({ data, insets }: { data: HomeData; insets: { top: number } }) {
  const router = useRouter();
  const profile = data.profile;
  const displayName = profile?.fullName ?? 'TopFlex user';
  return (
    <LinearGradient colors={[colors.light.headerStart, colors.light.headerEnd]} start={{ x: 0.05, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerBar}>
        <BrandMark />
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" testID="notifications" onPress={() => router.push('/notifications')} style={styles.headerIconButton}>
            <Ionicons name="notifications-outline" size={21} color={colors.light.white} />
            {data.unreadNotifications > 0 && <View style={styles.notificationDot} />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" testID="profile" onPress={() => router.push('/profile')} style={styles.avatarButton}>
            {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>}
          </Pressable>
        </View>
      </View>
      <Text style={styles.greeting}>Good evening</Text>
      <View style={styles.nameLine}>
        <Text style={styles.greetingName}>{displayName}</Text>
        <Ionicons name="hand-left-outline" size={22} color="#a0edd4" style={styles.waveIcon} />
      </View>
      <WalletCard data={data} />
    </LinearGradient>
  );
}

function WalletCard({ data }: { data: HomeData }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const wallet = data.wallet;
  const walletId = wallet?.walletId ?? 'Wallet ID unavailable';
  const balance = wallet ? formatGhs(wallet.balance) : 'GH₵ 0.00';

  const copyWalletId = async () => {
    if (!wallet?.walletId) return;
    await Clipboard.setStringAsync(wallet.walletId);
    Alert.alert('Wallet ID copied', 'Your wallet ID is ready to paste.');
  };

  return (
    <View style={styles.walletCard}>
      <View style={styles.walletTopRow}>
        <View>
          <View style={styles.walletLabelRow}><Text style={styles.walletLabel}>Wallet balance</Text><Pressable testID="toggle-balance" onPress={() => setHidden((value) => !value)} hitSlop={10}><Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={17} color="#a8edda" /></Pressable></View>
          <Text style={styles.balance}>{hidden ? 'GH₵ •••••' : balance}</Text>
        </View>
        <View style={styles.walletGlyph}><Ionicons name="wallet-outline" size={21} color="#b0f1dc" /></View>
      </View>
      <View style={styles.walletIdRow}>
        <Text style={styles.walletId} numberOfLines={1}>Wallet ID: {walletId}</Text>
        <Pressable testID="copy-wallet-id" onPress={copyWalletId} hitSlop={10}><Feather name="copy" size={14} color="#a8edda" /></Pressable>
      </View>
      {wallet?.demoMode ? (
        <View style={styles.walletSandboxBadge}>
          <Ionicons name="flask-outline" size={11} color={colors.light.primary} />
          <Text style={styles.walletSandboxText}>TEST MODE · NO REAL FUNDS</Text>
        </View>
      ) : null}
      <View style={styles.walletActions}>
        <Pressable testID="add-money" onPress={() => router.push({ pathname: '/wallet', params: { openAddMoney: '1' } })} style={({ pressed }) => [styles.walletActionLight, pressed && styles.pressed]}><Ionicons name="add" size={16} color={colors.light.primary} /><Text style={styles.walletActionLightText}>Add Money</Text></Pressable>
        <Pressable testID="transfer-cash" onPress={() => router.push('/services/send-money')} style={({ pressed }) => [styles.walletActionDark, pressed && styles.pressed]}><Ionicons name="swap-horizontal" size={16} color={colors.light.white} /><Text style={styles.walletActionDarkText}>Transfer Cash</Text></Pressable>
      </View>
    </View>
  );
}

function QuickActions() {
  const router = useRouter();
  return (
    <View style={styles.quickRow}>
      {quickActions.map((action) => (
        <Pressable key={action.service} testID={'quick-' + action.service} onPress={() => action.service === 'food' ? router.push('/food') : action.service === 'data' ? router.push('/data') : action.service === 'airtime' ? router.push('/airtime') : action.service === 'bills' ? router.push('/bills') : router.push(('/services/' + action.service) as never)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
          <View style={styles.quickIcon}><Ionicons name={action.icon} size={21} color={colors.light.primary} /></View>
          <Text style={styles.quickLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PromoBanner() {
  const router = useRouter();
  return (
    <Pressable testID="services-banner" onPress={() => router.push('/services/services')} style={({ pressed }) => [styles.promoBanner, pressed && styles.pressed]}>
      <View style={styles.promoShapeOne} />
      <View style={styles.promoShapeTwo} />
      <View style={styles.promoCopy}><Text style={styles.promoTitle}>More than just payments</Text><Text style={styles.promoSubtitle}>Data, Airtime, Bills, Gift Cards, and more...</Text></View>
      <Ionicons name="arrow-forward" size={20} color={colors.light.white} />
    </Pressable>
  );
}

function RecentTransactions({ data }: { data: HomeData }) {
  const router = useRouter();
  return (
    <View style={styles.transactionsCard}>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Transactions</Text><Pressable testID="view-all-transactions" onPress={() => router.push('/transactions')}><Text style={styles.viewAll}>View all</Text></Pressable></View>
      {data.transactions.length === 0 ? (
        <View style={styles.emptyState}><View style={styles.emptyIcon}><Feather name="clock" size={17} color={colors.light.mutedForeground} /></View><Text style={styles.emptyTitle}>No transactions yet</Text><Text style={styles.emptyText}>Your recent TopFlex activity will appear here.</Text></View>
      ) : data.transactions.map((transaction) => (
        <Pressable key={transaction.id} onPress={() => router.push('/transactions')} style={({ pressed }) => [styles.transactionRow, pressed && styles.pressed]}>
          <View style={styles.transactionIcon}><Ionicons name="receipt-outline" size={19} color={colors.light.primary} /></View>
          <View style={styles.transactionCopy}><Text style={styles.transactionTitle}>{transaction.title}</Text><Text style={styles.transactionDetail}>{transaction.detail}</Text><Text style={styles.transactionTime}>{formatTransactionTime(transaction.createdAt)}</Text></View>
          <View style={styles.transactionAmount}><Text style={styles.amountText}>{transaction.amount > 0 ? '- ' : ''}{formatGhs(transaction.amount)}</Text><Ionicons name="chevron-forward" size={15} color={colors.light.mutedForeground} /></View>
        </Pressable>
      ))}
    </View>
  );
}

function LoadingView() {
  return <View style={styles.loading}><ActivityIndicator size="small" color={colors.light.primary} /><Text style={styles.loadingText}>Loading your TopFlex account...</Text></View>;
}

function LoadErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.loading}>
      <View style={styles.emptyIcon}><Ionicons name="cloud-offline-outline" size={18} color={colors.light.mutedForeground} /></View>
      <Text style={styles.errorTitle}>Couldn’t load your account</Text>
      <Text style={styles.loadingText}>Check your connection, then try again.</Text>
      <Pressable testID="retry-home" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData, retry: 1 });
  useEffect(() => {
    if (query.data?.signedOut) router.replace('/sign-in');
  }, [query.data?.signedOut, router]);

  if (query.isLoading || !query.data) {
    if (query.isError) return <LoadErrorView onRetry={() => { void query.refetch(); }} />;
    return <LoadingView />;
  }
  if (query.data.signedOut) return <LoadingView />;
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.light.primary} />} contentContainerStyle={styles.scrollContent}>
        <Header data={query.data} insets={insets} />
        <View style={styles.content}><QuickActions /><PromoBanner /><RecentTransactions data={query.data} /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background },
  scrollContent: { paddingBottom: 10 },
  header: { paddingHorizontal: 17, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 38 },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 30, height: 25, borderRadius: 7, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
  brandMarkText: { color: '#06483b', fontFamily: 'Inter_700Bold', fontSize: 18, transform: [{ skewX: '12deg' }] },
  brandName: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.5 },
  brandNameAccent: { color: '#8aefd1' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerIconButton: { width: 29, height: 29, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', width: 6, height: 6, borderRadius: 4, backgroundColor: '#b5f4de', right: 2, top: 3 },
  avatarButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8fff7', borderWidth: 1.5, borderColor: '#e6fff7', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 14 },
  greeting: { color: '#b7d7cd', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 22 },
  nameLine: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 18 },
  greetingName: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.6 },
  waveIcon: { marginLeft: 7 },
  walletCard: { backgroundColor: colors.light.walletGlass, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: 'rgba(173, 255, 221, 0.19)', shadowColor: '#002b23', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 6 },
  walletTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletLabel: { color: '#a4e4d0', fontFamily: 'Inter_500Medium', fontSize: 10 },
  balance: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.6, marginTop: 5 },
  walletGlyph: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(170, 244, 219, 0.12)', borderWidth: 1, borderColor: 'rgba(170, 244, 219, 0.26)', justifyContent: 'center', alignItems: 'center' },
  walletIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  walletId: { color: '#95d4c1', fontFamily: 'Inter_400Regular', fontSize: 9, flexShrink: 1 },
  walletSandboxBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: colors.light.softMint },
  walletSandboxText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 7, letterSpacing: 0.2 },
  walletActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  walletActionLight: { flex: 1, height: 34, borderRadius: 8, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  walletActionDark: { flex: 1, height: 34, borderRadius: 8, backgroundColor: 'rgba(6, 61, 49, 0.48)', borderWidth: 1, borderColor: 'rgba(164, 241, 215, 0.21)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  walletActionLightText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  walletActionDarkText: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  content: { paddingHorizontal: 16 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18 },
  quickAction: { width: '24%', alignItems: 'center' },
  quickIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  quickLabel: { color: colors.light.foreground, fontFamily: 'Inter_500Medium', fontSize: 9, textAlign: 'center', lineHeight: 12 },
  promoBanner: { minHeight: 86, borderRadius: 16, backgroundColor: colors.light.headerEnd, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  promoCopy: { flex: 1, zIndex: 2 },
  promoTitle: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 13 },
  promoSubtitle: { color: '#c5f4e2', fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 7 },
  promoShapeOne: { position: 'absolute', width: 150, height: 150, borderRadius: 100, backgroundColor: 'rgba(126, 234, 201, 0.12)', right: 28, top: -88 },
  promoShapeTwo: { position: 'absolute', width: 115, height: 115, borderRadius: 100, backgroundColor: 'rgba(0, 49, 40, 0.18)', right: -25, bottom: -55 },
  transactionsCard: { backgroundColor: colors.light.white, borderRadius: 16, borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden', shadowColor: '#1a705d', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  sectionHeader: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#edf7f3' },
  sectionTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 12 },
  viewAll: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 11, minHeight: 67, borderBottomWidth: 1, borderBottomColor: '#edf7f3' },
  transactionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  transactionCopy: { flex: 1, marginLeft: 10 },
  transactionTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  transactionDetail: { color: '#6e8780', fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 3 },
  transactionTime: { color: '#8aa098', fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 2 },
  transactionAmount: { alignItems: 'flex-end', gap: 4 },
  amountText: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  emptyState: { alignItems: 'center', paddingVertical: 25, paddingHorizontal: 20 },
  emptyIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.light.muted, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 8 },
  emptyText: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 4, textAlign: 'center' },
  errorTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 4 },
  retryButton: { minHeight: 42, paddingHorizontal: 22, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  retryText: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.background, gap: 12 },
  loadingText: { color: colors.light.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
