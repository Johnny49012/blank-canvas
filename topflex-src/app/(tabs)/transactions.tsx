import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { formatGhs, formatTransactionTime, loadTransactions } from '@/lib/topflex';

export default function TransactionsScreen() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['topflex-transactions'], queryFn: loadTransactions });
  return (
    <View style={styles.screen}>
      <View style={styles.top}><Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}><Ionicons name="arrow-back" size={21} color={colors.light.foreground} /></Pressable><Text style={styles.heading}>Transactions</Text><View style={{ width: 21 }} /></View>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.light.primary} />} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR MONEY</Text><Text style={styles.title}>Recent activity</Text>
        {query.isLoading ? <ActivityIndicator color={colors.light.primary} style={{ marginTop: 35 }} /> : query.data?.length ? query.data.map((item) => <View key={item.id} style={styles.row}><View style={styles.icon}><Ionicons name="receipt-outline" size={18} color={colors.light.primary} /></View><View style={styles.copy}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowDetail}>{item.detail}</Text><Text style={styles.time}>{formatTransactionTime(item.createdAt)}</Text></View><Text style={styles.amount}>{item.amount > 0 ? '- ' : ''}{formatGhs(item.amount)}</Text></View>) : <View style={styles.empty}><Ionicons name="file-tray-outline" size={27} color={colors.light.mutedForeground} /><Text style={styles.emptyTitle}>No transactions yet</Text><Text style={styles.emptyText}>Your activity will show up here after your first TopFlex service.</Text></View>}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.light.background }, top: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.light.white, borderBottomWidth: 1, borderBottomColor: colors.light.border }, heading: { fontFamily: 'Inter_700Bold', fontSize: 17, color: colors.light.foreground }, content: { padding: 18 }, eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.light.mutedForeground, letterSpacing: 1.2 }, title: { fontFamily: 'Inter_700Bold', fontSize: 25, color: colors.light.foreground, marginTop: 6, marginBottom: 18 }, row: { backgroundColor: colors.light.white, borderRadius: 16, borderWidth: 1, borderColor: colors.light.border, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 11 }, rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.light.foreground }, rowDetail: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.light.mutedForeground, marginTop: 4 }, time: { fontFamily: 'Inter_400Regular', fontSize: 9, color: colors.light.mutedForeground, marginTop: 3 }, amount: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.light.foreground }, empty: { alignItems: 'center', paddingVertical: 90, paddingHorizontal: 24 }, emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.light.foreground, marginTop: 12 }, emptyText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.light.mutedForeground, textAlign: 'center', marginTop: 6, lineHeight: 17 } });
