import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { signOut } from '@/lib/topflex';

const items = [
  { label: 'Profile', detail: 'View your TopFlex account and wallet shortcuts', icon: 'person-circle-outline' as const, route: '/profile' },
  { label: 'Notifications', detail: 'Check account alerts and unread updates', icon: 'notifications-outline' as const, route: '/notifications' },
  { label: 'Buy Airtime', detail: 'Top up a Ghana mobile number', icon: 'phone-portrait-outline' as const, route: '/airtime' },
  { label: 'All services', detail: 'Data, airtime, bills, gift cards and more', icon: 'grid-outline' as const, route: '/services/services' },
  { label: 'Settings', detail: 'Account and notification preferences', icon: 'settings-outline' as const, route: '/services/settings' },
  { label: 'Support', detail: 'Get help with your TopFlex account', icon: 'help-circle-outline' as const, route: '/services/support' },
];
export default function MoreScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return <View style={styles.screen}><View style={styles.top}><Text style={styles.heading}>More</Text><Ionicons name="ellipsis-horizontal" size={21} color={colors.light.primary} /></View><View style={styles.content}>{items.map((item) => <Pressable key={item.label} onPress={() => router.push(item.route as never)} style={styles.item}><View style={styles.icon}><Ionicons name={item.icon} size={20} color={colors.light.primary} /></View><View style={styles.copy}><Text style={styles.label}>{item.label}</Text><Text style={styles.detail}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.light.mutedForeground} /></Pressable>)}<Pressable style={styles.signOut} onPress={() => Alert.alert('Sign out', 'Sign out of this TopFlex account?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); queryClient.clear(); router.replace('/sign-in'); } }])}><Ionicons name="log-out-outline" size={19} color={colors.light.destructive} /><Text style={styles.signOutText}>Sign out</Text></Pressable></View></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.light.background }, top: { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 18, backgroundColor: colors.light.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.light.border }, heading: { fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.light.foreground }, content: { padding: 18 }, item: { backgroundColor: colors.light.white, borderRadius: 16, borderWidth: 1, borderColor: colors.light.border, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 11 }, label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.light.foreground }, detail: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.light.mutedForeground, marginTop: 4 }, signOut: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#f0dada', backgroundColor: '#fffafa', gap: 7 }, signOutText: { color: colors.light.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 12 } });
