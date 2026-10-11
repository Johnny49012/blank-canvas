import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { formatGhs, loadHomeData } from '@/lib/topflex';

function ProfileLink({ icon, title, detail, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
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

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const account = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData });
  const profile = account.data?.profile;
  const displayName = profile?.fullName ?? 'TopFlex user';
  const wallet = account.data?.wallet;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.light.headerStart, colors.light.headerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" testID="profile-back">
            <Ionicons name="arrow-back" size={22} color={colors.light.white} />
          </Pressable>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open notifications" testID="profile-notifications">
            <Ionicons name="notifications-outline" size={22} color={colors.light.white} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {account.isLoading ? (
          <View style={styles.state}><ActivityIndicator color={colors.light.primary} /><Text style={styles.stateText}>Loading your profile…</Text></View>
        ) : account.error ? (
          <View style={styles.state}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.light.destructive} />
            <Text style={styles.stateTitle}>Profile unavailable</Text>
            <Text style={styles.stateText}>TopFlex could not load this account right now.</Text>
            <Pressable onPress={() => void account.refetch()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : account.data?.signedOut || !profile ? (
          <View style={styles.state}>
            <View style={styles.largeIcon}><Ionicons name="person-outline" size={25} color={colors.light.primary} /></View>
            <Text style={styles.stateTitle}>Sign in to view your profile</Text>
            <Text style={styles.stateText}>Your profile, wallet and account activity will appear here after you sign in.</Text>
            <Pressable onPress={() => router.push('/sign-in')} style={styles.primaryButton} testID="profile-sign-in">
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text></View>
              )}
              <Text style={styles.displayName}>{displayName}</Text>
              {!!profile.email && !wallet?.demoMode && <Text style={styles.email}>{profile.email}</Text>}
              {wallet?.demoMode && (
                <View style={styles.previewBadge}><Ionicons name="flask-outline" size={12} color={colors.light.primary} /><Text style={styles.previewBadgeText}>TEST MODE · SAMPLE ACCOUNT</Text></View>
              )}
            </View>

            <Pressable onPress={() => router.push('/wallet')} accessibilityRole="button" testID="profile-wallet" style={({ pressed }) => [styles.walletCard, pressed && styles.pressed]}>
              <View style={styles.walletIcon}><Ionicons name="wallet-outline" size={20} color={colors.light.primary} /></View>
              <View style={styles.walletCopy}>
                <Text style={styles.walletLabel}>TopFlex Wallet</Text>
                <Text style={styles.walletAmount}>{wallet ? formatGhs(wallet.balance) : 'Balance unavailable'}</Text>
                <Text style={styles.walletId}>Wallet ID: {wallet?.walletId ?? 'Not available'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.light.mutedForeground} />
            </Pressable>

            <Text style={styles.sectionTitle}>Your TopFlex</Text>
            <ProfileLink icon="receipt-outline" title="Transactions" detail="Review your recent account activity" onPress={() => router.push('/transactions')} />
            <ProfileLink icon="notifications-outline" title="Notifications" detail={`${account.data?.unreadNotifications ?? 0} unread updates`} onPress={() => router.push('/notifications')} />
            <ProfileLink icon="settings-outline" title="Account settings" detail="Preferences and account help" onPress={() => router.push('/services/settings')} />
            <ProfileLink icon="grid-outline" title="More services" detail="Browse all TopFlex services" onPress={() => router.push('/more')} />
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
  profileCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.light.border, borderRadius: 19, backgroundColor: colors.light.white },
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: colors.light.softMint },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 28 },
  displayName: { marginTop: 12, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 19, textAlign: 'center' },
  email: { marginTop: 5, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  previewBadge: { marginTop: 12, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, backgroundColor: colors.light.softMint },
  previewBadgeText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.3 },
  walletCard: { marginTop: 13, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, backgroundColor: colors.light.white, borderWidth: 1, borderColor: colors.light.border },
  walletIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.light.softMint },
  walletCopy: { flex: 1, minWidth: 0 },
  walletLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
  walletAmount: { marginTop: 3, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 },
  walletId: { marginTop: 5, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9 },
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
