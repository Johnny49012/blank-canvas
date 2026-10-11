import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { loadHomeData } from '@/lib/topflex';

function NotificationLink({ icon, title, detail, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <View style={styles.linkIcon}><Ionicons name={icon} size={19} color={colors.light.primary} /></View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.light.mutedForeground} />
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const account = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData });
  const unreadCount = account.data?.unreadNotifications ?? 0;
  const isPreview = account.data?.wallet?.demoMode ?? false;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.light.headerStart, colors.light.headerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" testID="notifications-back">
            <Ionicons name="arrow-back" size={22} color={colors.light.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Pressable onPress={() => router.push('/profile')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open profile" testID="notifications-profile">
            <Ionicons name="person-circle-outline" size={24} color={colors.light.white} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {account.isLoading ? (
          <View style={styles.state}><ActivityIndicator color={colors.light.primary} /><Text style={styles.stateText}>Checking your notifications…</Text></View>
        ) : account.error ? (
          <View style={styles.state}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.light.destructive} />
            <Text style={styles.stateTitle}>Notifications unavailable</Text>
            <Text style={styles.stateText}>TopFlex could not load your unread count right now.</Text>
            <Pressable onPress={() => void account.refetch()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : account.data?.signedOut ? (
          <View style={styles.state}>
            <View style={styles.largeIcon}><Ionicons name="notifications-outline" size={24} color={colors.light.primary} /></View>
            <Text style={styles.stateTitle}>Sign in to check notifications</Text>
            <Text style={styles.stateText}>Your TopFlex account will show notification updates here.</Text>
            <Pressable onPress={() => router.push('/sign-in')} style={styles.primaryButton} testID="notifications-sign-in">
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name={unreadCount > 0 ? 'notifications' : 'checkmark-done'} size={23} color={colors.light.primary} />
              </View>
              <Text style={styles.summaryTitle}>{unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'You’re all caught up'}</Text>
              {isPreview && <View style={styles.previewBadge}><Ionicons name="flask-outline" size={12} color={colors.light.primary} /><Text style={styles.previewBadgeText}>TEST MODE</Text></View>}
              <Text style={styles.summaryText}>
                {isPreview
                  ? 'This preview includes an unread count only. It has no individual notification messages.'
                  : unreadCount > 0
                    ? 'TopFlex reports unread notifications, but this account response does not include their message details.'
                    : 'There are no unread notifications for this account.'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Continue in TopFlex</Text>
            <NotificationLink icon="receipt-outline" title="Transaction activity" detail="Review wallet and service activity" onPress={() => router.push('/transactions')} />
            <NotificationLink icon="person-circle-outline" title="My profile" detail="View your account and wallet summary" onPress={() => router.push('/profile')} />
            <NotificationLink icon="settings-outline" title="Notification settings" detail="Open account preferences" onPress={() => router.push('/services/settings')} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  headerRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 18 },
  content: { flexGrow: 1, padding: 18, paddingBottom: 30 },
  summaryCard: { alignItems: 'center', paddingVertical: 25, paddingHorizontal: 20, borderWidth: 1, borderColor: colors.light.border, borderRadius: 19, backgroundColor: colors.light.white },
  summaryIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: colors.light.softMint },
  summaryTitle: { marginTop: 12, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  summaryText: { marginTop: 9, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  previewBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, backgroundColor: colors.light.softMint },
  previewBadgeText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.3 },
  sectionTitle: { marginTop: 23, marginBottom: 10, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 14 },
  link: { minHeight: 65, marginBottom: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white },
  linkIcon: { width: 37, height: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.light.softMint },
  linkCopy: { flex: 1, minWidth: 0 },
  linkTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  linkDetail: { marginTop: 4, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
  state: { flex: 1, minHeight: 310, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  stateTitle: { marginTop: 12, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' },
  stateText: { marginTop: 7, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  largeIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 27, backgroundColor: colors.light.softMint },
  primaryButton: { minHeight: 48, minWidth: 160, marginTop: 18, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.light.primary },
  primaryButtonText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 12 },
  retryButton: { marginTop: 15, paddingHorizontal: 17, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.light.primary },
  retryText: { color: colors.light.white, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  pressed: { opacity: 0.85 },
});
