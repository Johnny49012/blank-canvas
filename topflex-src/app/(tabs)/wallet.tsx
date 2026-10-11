import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { formatGhs, formatTransactionTime, loadHomeData } from '@/lib/topflex';
import { WALLET_SANDBOX_CURRENCIES, type WalletFundingMethod } from '@/lib/wallet-sandbox';
import { AddMoneyMethodSheet } from '@/components/wallet/AddMoneyMethodSheet';

const formatWalletBalance = (amount: number, currency: string) => {
  if (currency === 'GHS') return formatGhs(amount);
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openAddMoney } = useLocalSearchParams<{ openAddMoney?: string }>();
  const [addMoneySheetOpen, setAddMoneySheetOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const currencyScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (openAddMoney === '1') {
      setAddMoneySheetOpen(true);
      router.setParams({ openAddMoney: '0' });
    }
  }, [openAddMoney, router]);

  const openFundingFlow = (method: WalletFundingMethod) => {
    setAddMoneySheetOpen(false);
    router.push({ pathname: '/services/[service]', params: { service: 'add-money', method } });
  };
  const query = useQuery({
    queryKey: ['topflex-home'],
    queryFn: loadHomeData,
    retry: 1,
  });
  const wallet = query.data?.wallet ?? null;
  const walletId = wallet?.walletId ?? null;
  const transactions = query.data?.transactions ?? [];

  const copyWalletId = async () => {
    if (!walletId) return;
    await Clipboard.setStringAsync(walletId);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.light.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: (insets.top || 0) + 12 },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TOPFLEX ACCOUNT</Text>
            <Text style={styles.heading}>Wallet</Text>
            <Text style={styles.subtitle}>Your money, all in one place.</Text>
          </View>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.light.primary} />
          </View>
        </View>

        {wallet?.demoMode ? (
          <View style={styles.sandboxBanner}>
            <Ionicons name="flask-outline" size={14} color={colors.light.primary} />
            <Text style={styles.sandboxBannerText}>TEST MODE · SIMULATED FUNDS ONLY</Text>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>TopFlex Wallet</Text>
              <Text style={styles.currencyLabel}>{wallet?.currency ?? 'GHS'} · Ghana</Text>
            </View>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet-outline" size={22} color={colors.light.white} />
            </View>
          </View>

          <View style={styles.balanceLine}>
            <Text style={styles.balance}>
              {wallet
                ? hidden
                  ? 'GH₵ •••••'
                  : formatWalletBalance(wallet.balance, wallet.currency)
                : query.isLoading
                  ? 'Loading balance…'
                  : 'Balance unavailable'}
            </Text>
            {wallet ? (
              <Pressable
                testID="wallet-toggle-balance"
                accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
                onPress={() => setHidden((value) => !value)}
                hitSlop={10}
              >
                <Ionicons
                  name={hidden ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color={colors.light.white}
                />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.walletIdRow}>
            <Text style={styles.walletId} numberOfLines={1}>
              Wallet ID: {walletId ?? (query.isLoading ? 'Loading…' : 'Unavailable')}
            </Text>
            <Pressable
              testID="wallet-copy-id"
              accessibilityRole="button"
              accessibilityLabel="Copy wallet ID"
              disabled={!walletId}
              onPress={() => void copyWalletId()}
              hitSlop={10}
              style={({ pressed }) => [pressed && styles.pressed, !walletId && styles.disabled]}
            >
              <Ionicons name="copy-outline" size={16} color={colors.light.white} />
            </Pressable>
          </View>

          <View style={styles.primaryActions}>
            <Pressable
              testID="wallet-add-money"
              accessibilityRole="button"
              accessibilityHint="Opens the same Add Money screen as the Home wallet card."
              onPress={() => setAddMoneySheetOpen(true)}
              style={({ pressed }) => [styles.actionButton, styles.lightAction, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={17} color={colors.light.primary} />
              <Text style={styles.lightActionText}>Add Money</Text>
            </Pressable>
            <Pressable
              testID="wallet-transfer-cash"
              accessibilityRole="button"
              accessibilityHint="Opens the same Send Money screen as the Home wallet card."
              onPress={() => router.push('/services/send-money')}
              style={({ pressed }) => [styles.actionButton, styles.darkAction, pressed && styles.pressed]}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.light.white} />
              <Text style={styles.darkActionText}>Transfer Cash</Text>
            </Pressable>
          </View>
          <Text style={styles.unavailableNote}>
            Opens the same service screens as the Home wallet card.
          </Text>
        </View>

        <View style={styles.internationalSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>International Accounts</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all international accounts"
              onPress={() => currencyScrollRef.current?.scrollToEnd({ animated: true })}
              hitSlop={8}
            >
              <Text style={styles.viewAll}>See all ›</Text>
            </Pressable>
          </View>
          <ScrollView
            ref={currencyScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.currencyRow}
          >
            {WALLET_SANDBOX_CURRENCIES.map((currency) => (
              <View
                key={currency.code}
                accessibilityLabel={`${currency.code} account, ${currency.name}, ${wallet?.demoMode ? currency.formattedBalance : 'balance unavailable'}`}
                style={styles.currencyCard}
              >
                <View style={styles.currencyTopRow}>
                  <Text style={styles.currencyFlag}>{currency.flag}</Text>
                  <Text style={styles.currencyAccountTitle}>{currency.code} Account</Text>
                </View>
                <Text style={[styles.currencyBalance, !wallet?.demoMode && styles.currencyBalanceUnavailable]}>
                  {wallet?.demoMode ? currency.formattedBalance : '— —'}
                </Text>
                <Text style={styles.currencyCode}>{currency.code}</Text>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.currencyNote}>
            {wallet?.demoMode
              ? 'Sandbox balances only · No real international accounts are connected.'
              : 'Account balances will appear after an international account provider is connected.'}
          </Text>
        </View>

        <Pressable
          testID="wallet-transactions-toggle"
          accessibilityRole="button"
          accessibilityState={{ expanded: transactionsOpen }}
          onPress={() => setTransactionsOpen((value) => !value)}
          style={({ pressed }) => [styles.transactionsPill, pressed && styles.pressed]}
        >
          <Ionicons name="receipt-outline" size={16} color={colors.light.white} />
          <Text style={styles.transactionsPillText}>Transactions</Text>
          <Ionicons
            name={transactionsOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.light.white}
          />
        </Pressable>

        {transactionsOpen ? (
          <View style={styles.transactionsCard}>
            <Text style={styles.activityTitle}>Recent activity</Text>
            {query.isLoading ? (
              <View style={styles.state}>
                <ActivityIndicator color={colors.light.primary} />
                <Text style={styles.stateText}>Loading transactions…</Text>
              </View>
            ) : query.isError ? (
              <View style={styles.state}>
                <Ionicons name="cloud-offline-outline" size={22} color={colors.light.mutedForeground} />
                <Text style={styles.stateText}>Your transactions couldn’t be loaded.</Text>
                <Pressable
                  testID="wallet-retry-transactions"
                  onPress={() => void query.refetch()}
                  style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : transactions.length ? (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionRow}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="receipt-outline" size={18} color={colors.light.primary} />
                  </View>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.transactionTitle}>{transaction.title}</Text>
                    <Text style={styles.transactionDetail}>{transaction.detail}</Text>
                    <Text style={styles.transactionTime}>
                      {formatTransactionTime(transaction.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.amountText}>
                      {transaction.amount > 0 ? '− ' : '+ '}
                      {formatGhs(transaction.amount)}
                    </Text>
                    <Text style={styles.statusText}>{transaction.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.state}>
                <Ionicons name="file-tray-outline" size={22} color={colors.light.mutedForeground} />
                <Text style={styles.stateText}>No transactions yet.</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={17} color={colors.light.primary} />
          <Text style={styles.securityText}>
            Preview data is local to this app and resets when the app reloads. No real funds move.
          </Text>
        </View>
      </ScrollView>
      <AddMoneyMethodSheet
        visible={addMoneySheetOpen}
        onClose={() => setAddMoneySheetOpen(false)}
        onSelect={openFundingFlow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background },
  content: { paddingHorizontal: 17, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  eyebrow: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.8 },
  heading: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 3 },
  subtitle: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  secureIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  sandboxBanner: { minHeight: 32, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 12 },
  sandboxBannerText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.3 },
  hero: { backgroundColor: colors.light.walletGlass, borderRadius: 20, padding: 17, shadowColor: colors.light.foreground, shadowOpacity: 0.14, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  currencyLabel: { color: colors.light.muted, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 4 },
  walletIcon: { width: 37, height: 37, borderRadius: 11, backgroundColor: colors.light.walletGlassLight, alignItems: 'center', justifyContent: 'center' },
  balanceLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
  balance: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.5 },
  walletIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  walletId: { flex: 1, color: colors.light.muted, fontFamily: 'Inter_400Regular', fontSize: 9 },
  primaryActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flex: 1, height: 38, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  lightAction: { backgroundColor: colors.light.white },
  lightActionText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  darkAction: { backgroundColor: colors.light.walletGlassLight, borderWidth: 1, borderColor: colors.light.softMint },
  darkActionText: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  unavailableNote: { color: colors.light.muted, fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'center', marginTop: 10 },
  internationalSection: { marginTop: 21 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 },
  viewAll: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  currencyRow: { paddingRight: 17, gap: 9 },
  currencyCard: { width: 124, minHeight: 93, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.light.primary, backgroundColor: colors.light.white },
  currencyTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  currencyFlag: { fontSize: 13 },
  currencyAccountTitle: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 8 },
  currencyBalance: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 12 },
  currencyBalanceUnavailable: { color: colors.light.mutedForeground },
  currencyCode: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 2 },
  currencyNote: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, marginTop: 8 },
  transactionsPill: { minHeight: 42, borderRadius: 22, backgroundColor: colors.light.primary, marginTop: 17, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  transactionsPillText: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 11, flex: 1 },
  transactionsCard: { backgroundColor: colors.light.white, borderRadius: 16, borderWidth: 1, borderColor: colors.light.border, marginTop: 12, padding: 13 },
  activityTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 7 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  transactionIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  transactionCopy: { flex: 1, marginLeft: 10 },
  transactionTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  transactionDetail: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 3 },
  transactionTime: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 2 },
  transactionAmount: { alignItems: 'flex-end', marginLeft: 8 },
  amountText: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  statusText: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 4 },
  state: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  stateText: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center' },
  retryButton: { minHeight: 34, borderRadius: 10, backgroundColor: colors.light.softMint, paddingHorizontal: 15, justifyContent: 'center' },
  retryText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  securityNote: { marginTop: 18, padding: 13, borderRadius: 14, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  securityText: { flex: 1, color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
});