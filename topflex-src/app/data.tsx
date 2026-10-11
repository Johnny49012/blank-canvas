import { useMemo, useState } from 'react';
import {
  Modal,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import colors from '@/constants/colors';
import { loadHomeData } from '@/lib/topflex';

type Network = 'MTN' | 'AirtelTigo' | 'Telecel';
type Plan = { id: string; network: Network; size: string; type: string; price: number; delivery: string };
type Sheet = 'beneficiary' | 'confirmation' | 'unavailable' | null;
type PhoneStatus = { kind: 'neutral' | 'error' | 'valid'; message: string };

const networks: Network[] = ['MTN', 'AirtelTigo', 'Telecel'];
const plans: Plan[] = [
  ...[['1GB', 4.6], ['2GB', 9], ['3GB', 13.2], ['4GB', 17.5], ['5GB', 21.8], ['6GB', 26], ['7GB', 30.2], ['8GB', 34.5], ['9GB', 38.6], ['10GB', 42.8], ['15GB', 63.5], ['20GB', 84.5], ['25GB', 105], ['30GB', 126], ['40GB', 166], ['50GB', 206], ['75GB', 306], ['100GB', 406]].map(([size, price], index) => ({ id: `mtn-regu-${index}`, network: 'MTN' as Network, size: String(size), type: 'Regu', price: Number(price), delivery: 'Instant – under 24 hours' })),
  ...[['1GB', 6], ['2GB', 10.5], ['3GB', 14.8], ['4GB', 19.2], ['5GB', 23.8], ['6GB', 28.2], ['7GB', 32.6], ['8GB', 37], ['9GB', 41.3], ['10GB', 45.8], ['15GB', 67.8], ['20GB', 89.5], ['25GB', 111], ['30GB', 133], ['40GB', 174], ['50GB', 216], ['75GB', 319], ['100GB', 421]].map(([size, price], index) => ({ id: `mtn-prime-${index}`, network: 'MTN' as Network, size: String(size), type: 'Prime', price: Number(price), delivery: 'Instant – under 5 minutes' })),
  ...[['1GB', 4.9], ['2GB', 9.8], ['5GB', 24], ['10GB', 46], ['20GB', 90], ['30GB', 135], ['50GB', 220]].map(([size, price], index) => ({ id: `airteltigo-regu-${index}`, network: 'AirtelTigo' as Network, size: String(size), type: 'Regu', price: Number(price), delivery: 'Instant – under 24 hours' })),
  ...[['10GB', 42], ['15GB', 60], ['20GB', 80], ['30GB', 120], ['40GB', 160], ['50GB', 195]].map(([size, price], index) => ({ id: `telecel-standard-${index}`, network: 'Telecel' as Network, size: String(size), type: 'Standard', price: Number(price), delivery: 'Standard delivery' })),
];

const prefixes: Record<Network, string[]> = {
  MTN: ['024', '025', '053', '054', '055', '059'],
  AirtelTigo: ['026', '027', '056', '057'],
  Telecel: ['020', '050'],
};

const benefits = [
  { icon: 'shield-checkmark' as const, first: 'Secure', second: 'Payments' },
  { icon: 'flash' as const, first: 'Instant', second: 'Activation' },
  { icon: 'pricetag' as const, first: 'Best', second: 'Rates' },
  { icon: 'headset' as const, first: '24/7', second: 'Support' },
];

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('233')) digits = `0${digits.slice(3)}`;
  return digits;
}

function validatePhone(value: string, selectedNetwork: Network): PhoneStatus {
  const normalized = normalizePhone(value);
  if (!normalized) return { kind: 'neutral', message: 'Enter a Ghana mobile number to continue.' };
  if (!/^0\d{9}$/.test(normalized)) {
    return { kind: 'error', message: 'Enter a valid 10-digit Ghana number, such as 024 123 4567.' };
  }
  const detected = networks.find((name) => prefixes[name].includes(normalized.slice(0, 3)));
  if (!detected) return { kind: 'error', message: 'We could not match this prefix to a supported network.' };
  if (detected !== selectedNetwork) {
    return { kind: 'error', message: `${detected} prefix detected. Choose ${detected} or enter a ${selectedNetwork} number.` };
  }
  return { kind: 'valid', message: `${detected} prefix detected` };
}

function CarrierLogo({ network }: { network: Network }) {
  if (network === 'MTN') {
    return <View style={styles.carrierLogo}><View style={styles.mtnLogo}><Text style={styles.mtnLogoText}>MTN</Text></View></View>;
  }
  if (network === 'AirtelTigo') {
    return <View style={styles.carrierLogo}><Text style={styles.airtelLogo}>a</Text></View>;
  }
  return (
    <View style={styles.carrierLogo}>
      <View style={styles.telecelLogo}><Text style={styles.telecelLogoText}>t</Text></View>
    </View>
  );
}

function BenefitItem({ icon, first, second }: { icon: (typeof benefits)[number]['icon']; first: string; second: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}><Ionicons name={icon} size={19} color={colors.light.primary} /></View>
      <Text style={styles.benefitLabel}>{first}{'\n'}{second}</Text>
    </View>
  );
}

export default function DataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const account = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData });
  const profile = account.data?.profile;
  const displayName = profile?.fullName ?? 'TopFlex user';
  const unreadCount = account.data?.unreadNotifications ?? 0;
  const [step, setStep] = useState<'network' | 'bundles'>('network');
  const [network, setNetwork] = useState<Network>('MTN');
  const [networkTouched, setNetworkTouched] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [phone, setPhone] = useState('');
  const [showAllBundles, setShowAllBundles] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const selected = plans.find((plan) => plan.id === selectedId) ?? null;
  const networkPlans = useMemo(() => plans.filter((plan) => plan.network === network), [network]);
  const popularPlans = useMemo(() => {
    const common = networkPlans.filter((plan) => Number.parseFloat(plan.size) <= 6);
    return common.length ? common : networkPlans.slice(0, 6);
  }, [networkPlans]);
  const visiblePlans = showAllBundles ? networkPlans : popularPlans;
  const phoneStatus = validatePhone(phone, network);

  const chooseNetwork = (next: Network) => {
    setNetwork(next);
    setSelectedId('');
    setPhone('');
    setNetworkTouched(true);
  };

  const closeSheet = () => {
    if (sheet === 'confirmation') {
      setSheet('beneficiary');
      return;
    }
    setSheet(null);
  };

  const goBack = () => {
    if (sheet) {
      closeSheet();
      return;
    }
    if (step === 'bundles') {
      setStep('network');
      setSelectedId('');
      return;
    }
    router.back();
  };

  const choosePlan = (plan: Plan) => {
    setSelectedId(plan.id);
    setSheet('beneficiary');
  };

  return (
    <View style={styles.page}>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.hero, { paddingTop: insets.top }]}>
            <LinearGradient
              colors={[colors.light.headerStart, colors.light.headerEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroOrb, styles.heroOrbOne]} />
            <View style={[styles.heroOrb, styles.heroOrbTwo]} />
            <View style={styles.topbar}>
              <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" testID="data-back">
                <Ionicons name="arrow-back" size={22} color={colors.light.white} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/notifications')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                style={styles.notificationButton}
                testID="data-notifications"
              >
                <Ionicons name="notifications-outline" size={22} color={colors.light.white} />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </Pressable>
              <Pressable
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                testID="data-profile"
                style={styles.avatar}
              >
                {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>}
              </Pressable>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>Buy Data</Text>
              <Text style={styles.subtitle}>Stay connected. Choose your network and bundle.</Text>
            </View>
          </View>

          <View style={styles.panel}>
            {step === 'network' ? (
              <>
                <Text style={styles.sectionTitle}>Select Network</Text>
                <View style={styles.networkGrid}>
                  {networks.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => chooseNetwork(item)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: network === item }}
                      testID={`network-${item}`}
                      style={({ pressed }) => [
                        styles.networkCard,
                        network === item && styles.networkCardSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <CarrierLogo network={item} />
                      <Text style={[styles.networkLabel, network === item && styles.networkLabelSelected]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.infoCard} accessibilityLiveRegion="polite" testID="network-information">
                  <View style={styles.infoIcon}><Ionicons name="wifi" size={21} color={colors.light.primary} /></View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoHeading}>Fast. Reliable. Always on.</Text>
                    <Text style={styles.infoText}>Data for your {network} number. Delivery timing varies by bundle.</Text>
                  </View>
                </View>

                {networkTouched && (
                  <Pressable
                    onPress={() => setStep('bundles')}
                    accessibilityRole="button"
                    testID="continue-to-bundles"
                    style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.primaryButtonText}>Continue to bundles</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.light.white} />
                  </Pressable>
                )}

                <View style={styles.whySection}>
                  <Text style={styles.sectionTitle}>Why choose TopFlex?</Text>
                  <View style={styles.benefitGrid}>
                    {benefits.map((benefit) => <BenefitItem key={benefit.first} {...benefit} />)}
                  </View>
                </View>

                <View style={styles.brandFooter}>
                  <Svg width="100%" height={37} viewBox="0 0 400 40" preserveAspectRatio="none" style={styles.footerWave}>
                    <Path d="M0 20 C58 7 114 22 171 19 C244 15 280 30 342 15 C366 9 383 3 400 0 L400 0 L0 0 Z" fill={colors.light.white} />
                  </Svg>
                  <Text style={styles.footerMessage}>More value. More connection.</Text>
                </View>
              </>
            ) : (
              <View style={styles.bundleStep}>
                <View style={styles.selectedNetwork}>
                  <CarrierLogo network={network} />
                  <Text style={styles.selectedNetworkText}>{network} data bundles</Text>
                  <Pressable onPress={() => setStep('network')} accessibilityRole="button" accessibilityLabel="Change network" testID="change-network">
                    <Ionicons name="create-outline" size={19} color={colors.light.primary} />
                  </Pressable>
                </View>
                <View style={styles.bundleHeading}>
                  <Text style={styles.sectionTitle}>Data Bundles</Text>
                  <Text style={styles.bundleCount}>{networkPlans.length} available</Text>
                </View>
                <View style={styles.bundleFilters}>
                  <Pressable
                    onPress={() => setShowAllBundles(false)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !showAllBundles }}
                    testID="bundle-filter-popular"
                    style={[styles.filterButton, !showAllBundles && styles.filterButtonActive]}
                  >
                    <Text style={[styles.filterText, !showAllBundles && styles.filterTextActive]}>Popular</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowAllBundles(true)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: showAllBundles }}
                    testID="bundle-filter-all"
                    style={[styles.filterButton, showAllBundles && styles.filterButtonActive]}
                  >
                    <Text style={[styles.filterText, showAllBundles && styles.filterTextActive]}>All</Text>
                  </Pressable>
                </View>
                <View style={styles.bundleGrid}>
                  {visiblePlans.map((plan) => (
                    <Pressable
                      key={plan.id}
                      onPress={() => choosePlan(plan)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${plan.size} ${plan.type} bundle, GHS ${plan.price.toFixed(2)}`}
                      testID={`bundle-${plan.id}`}
                      style={({ pressed }) => [styles.bundleCard, pressed && styles.pressed]}
                    >
                      <View style={styles.bundleCardTop}>
                        <Text style={styles.bundleSize}>{plan.size}</Text>
                        <Text style={styles.bundleType}>{plan.type}</Text>
                      </View>
                      <Text style={styles.bundlePrice}>GHS {plan.price.toFixed(2)}</Text>
                      <Text style={styles.bundleDelivery}>{plan.delivery}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.catalogNote}>Delivery timing is listed with each bundle.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSheet}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={closeSheet} accessibilityLabel="Close purchase sheet" />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeadingCopy}>
                <Text style={styles.sheetTitle}>
                  {sheet === 'beneficiary' ? 'Enter Beneficiary Number' : sheet === 'confirmation' ? 'Confirm Purchase' : 'Purchase unavailable'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {sheet === 'beneficiary'
                    ? 'Enter the number you want to receive this data bundle.'
                    : sheet === 'confirmation'
                      ? 'Review the details before continuing.'
                      : 'The purchase service is not connected to this web app yet.'}
                </Text>
              </View>
              <Pressable onPress={closeSheet} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" testID="close-purchase-sheet">
                <Ionicons name="close-circle" size={26} color={colors.light.mutedForeground} />
              </Pressable>
            </View>

            {sheet === 'beneficiary' && selected && (
              <>
                <Text style={styles.fieldLabel}>Ghana mobile number</Text>
                <View style={styles.phoneField}>
                  <Ionicons name="phone-portrait-outline" size={19} color={colors.light.primary} />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="024 123 4567"
                    placeholderTextColor={colors.light.mutedForeground}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    style={styles.phoneInput}
                    accessibilityLabel="Beneficiary phone number"
                    testID="beneficiary-phone"
                  />
                </View>
                <View style={styles.validationRow} accessibilityLiveRegion="polite" testID="phone-validation">
                  <Ionicons
                    name={phoneStatus.kind === 'valid' ? 'checkmark-circle' : phoneStatus.kind === 'error' ? 'close-circle' : 'information-circle'}
                    size={17}
                    color={phoneStatus.kind === 'valid' ? colors.light.primary : phoneStatus.kind === 'error' ? colors.light.destructive : colors.light.mutedForeground}
                  />
                  <Text style={[styles.validationText, phoneStatus.kind === 'error' && styles.validationError]}>{phoneStatus.message}</Text>
                </View>
                <Text style={styles.phoneHint}>Network recognition uses the number prefix. Ported numbers may use another network.</Text>
                <Pressable
                  disabled={phoneStatus.kind !== 'valid'}
                  onPress={() => setSheet('confirmation')}
                  accessibilityRole="button"
                  testID="continue-to-confirmation"
                  style={({ pressed }) => [styles.sheetPrimaryButton, phoneStatus.kind !== 'valid' && styles.buttonDisabled, pressed && phoneStatus.kind === 'valid' && styles.buttonPressed]}
                >
                  <Text style={[styles.primaryButtonText, phoneStatus.kind !== 'valid' && styles.disabledButtonText]}>Continue</Text>
                </Pressable>
              </>
            )}

            {sheet === 'confirmation' && selected && (
              <>
                <View style={styles.receipt}>
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Network</Text><Text style={styles.receiptValue}>{network}</Text></View>
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Data Bundle</Text><Text style={styles.receiptValue}>{selected.size} · {selected.type}</Text></View>
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Beneficiary</Text><Text style={styles.receiptValue}>{normalizePhone(phone)}</Text></View>
                  <View style={[styles.receiptRow, styles.receiptTotal]}><Text style={styles.receiptTotalLabel}>Amount</Text><Text style={styles.receiptAmount}>GHS {selected.price.toFixed(2)}</Text></View>
                </View>
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={19} color="#865e20" />
                  <Text style={styles.noticeText}>No payment is taken here. The purchase service is not connected.</Text>
                </View>
                <Pressable onPress={() => setSheet('unavailable')} accessibilityRole="button" testID="confirm-purchase" style={({ pressed }) => [styles.sheetPrimaryButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.primaryButtonText}>Buy Now</Text>
                </Pressable>
                <Pressable onPress={() => setSheet(null)} accessibilityRole="button" testID="cancel-purchase" style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}

            {sheet === 'unavailable' && (
              <View style={styles.unavailableBlock}>
                <View style={styles.unavailableIcon}><Ionicons name="close-circle" size={27} color={colors.light.destructive} /></View>
                <Text style={styles.unavailableTitle} testID="purchase-status">Purchase service not connected</Text>
                <Text style={styles.unavailableText}>TopFlex cannot submit this purchase right now. No payment was made, and no transaction was created.</Text>
                <Pressable onPress={() => setSheet(null)} accessibilityRole="button" testID="return-to-bundles" style={styles.sheetPrimaryButton}>
                  <Text style={styles.primaryButtonText}>Back to bundles</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', backgroundColor: colors.light.background },
  screen: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: colors.light.background },
  scrollContent: { flexGrow: 1 },
  hero: { position: 'relative', overflow: 'hidden', paddingHorizontal: 21, paddingBottom: 42, backgroundColor: colors.light.headerStart },
  heroOrb: { position: 'absolute', borderRadius: 999, pointerEvents: 'none' },
  heroOrbOne: { width: 300, height: 210, right: -108, top: 62, backgroundColor: 'rgba(31, 166, 138, 0.17)', transform: [{ rotate: '-23deg' }] },
  heroOrbTwo: { width: 265, height: 100, right: -45, bottom: 2, backgroundColor: 'rgba(0, 84, 70, 0.28)', transform: [{ rotate: '-8deg' }] },
  topbar: { zIndex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 13 },
  notificationButton: { marginLeft: 'auto', position: 'relative', width: 25, height: 33, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 1, right: 0, width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.light.headerStart, backgroundColor: '#9ff0d4' },
  avatar: { width: 32, height: 32, overflow: 'hidden', borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5faf4', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: colors.light.primary, fontSize: 12, fontFamily: 'Inter_700Bold' },
  heroCopy: { zIndex: 1, marginTop: 24 },
  title: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: '#d3f0e9', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  panel: { zIndex: 2, flexGrow: 1, marginTop: -22, paddingHorizontal: 21, paddingTop: 25, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: colors.light.white },
  sectionTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: -0.3 },
  networkGrid: { flexDirection: 'row', gap: 10, marginTop: 13 },
  networkCard: { flex: 1, minWidth: 0, minHeight: 84, paddingHorizontal: 4, paddingVertical: 7, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: colors.light.border, borderRadius: 15, backgroundColor: colors.light.white },
  networkCardSelected: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  networkLabel: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'center' },
  networkLabelSelected: { color: colors.light.white },
  carrierLogo: { width: 46, height: 37, alignItems: 'center', justifyContent: 'center' },
  mtnLogo: { width: 44, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#10231f', borderRadius: 18, backgroundColor: '#f5df00', transform: [{ rotate: '-5deg' }] },
  mtnLogoText: { color: '#10231f', fontFamily: 'Inter_700Bold', fontSize: 12, fontStyle: 'italic' },
  airtelLogo: { color: '#e50032', fontFamily: 'Inter_700Bold', fontSize: 43, lineHeight: 45, fontStyle: 'italic', marginTop: -7 },
  telecelLogo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#d90032' },
  telecelLogoText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 23, lineHeight: 28 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  infoCard: { minHeight: 68, marginTop: 25, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 15, backgroundColor: '#e9f8f4' },
  infoIcon: { width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.light.softMint },
  infoCopy: { flex: 1, minWidth: 0 },
  infoHeading: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 12 },
  infoText: { marginTop: 3, color: '#52716b', fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  primaryButton: { minHeight: 49, marginTop: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, backgroundColor: colors.light.primary },
  primaryButtonText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 13 },
  buttonPressed: { opacity: 0.85 },
  whySection: { paddingTop: 31, paddingBottom: 8 },
  benefitGrid: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  benefit: { flex: 1, minWidth: 0, alignItems: 'center' },
  benefitIcon: { width: 41, height: 41, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.light.softMint },
  benefitLabel: { marginTop: 7, color: '#244842', fontFamily: 'Inter_600SemiBold', fontSize: 9, lineHeight: 12, textAlign: 'center' },
  brandFooter: { position: 'relative', minHeight: 112, marginTop: 'auto', marginHorizontal: -21, paddingTop: 34, paddingBottom: 17, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: '#006957' },
  footerWave: { position: 'absolute', top: 0, left: 0 },
  footerMessage: { color: '#def5ee', fontFamily: 'Inter_400Regular', fontSize: 13 },
  bundleStep: { minHeight: 600, paddingBottom: 20 },
  selectedNetwork: { minHeight: 49, marginBottom: 21, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, backgroundColor: colors.light.secondary },
  selectedNetworkText: { flex: 1, color: '#31534e', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  bundleHeading: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bundleCount: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
  bundleFilters: { marginBottom: 13, flexDirection: 'row', gap: 8 },
  filterButton: { minHeight: 32, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.light.border, borderRadius: 18, backgroundColor: colors.light.white },
  filterButtonActive: { borderColor: colors.light.primary, backgroundColor: colors.light.primary },
  filterText: { color: colors.light.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  filterTextActive: { color: colors.light.white },
  bundleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 12 },
  bundleCard: { flexBasis: '48%', flexGrow: 1, minHeight: 109, padding: 12, borderWidth: 1, borderColor: colors.light.border, borderRadius: 15, backgroundColor: colors.light.white },
  bundleCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  bundleSize: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 },
  bundleType: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.light.softMint, color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 8 },
  bundlePrice: { marginTop: 8, color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
  bundleDelivery: { marginTop: 6, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 12 },
  catalogNote: { marginTop: 8, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center' },
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 38, 33, 0.48)' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '90%', paddingHorizontal: 22, paddingTop: 12, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: colors.light.white, overflow: 'hidden' },
  sheetHandle: { width: 38, height: 4, alignSelf: 'center', marginBottom: 17, borderRadius: 3, backgroundColor: '#d5e4df' },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 13 },
  sheetHeadingCopy: { flex: 1 },
  sheetTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4 },
  sheetSubtitle: { marginTop: 5, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  fieldLabel: { marginTop: 23, marginBottom: 8, color: '#31534d', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  phoneField: { minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, backgroundColor: '#fbfdfc' },
  phoneInput: { flex: 1, paddingVertical: 12, color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  validationRow: { minHeight: 30, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 7 },
  validationText: { flex: 1, color: colors.light.primary, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  validationError: { color: colors.light.destructive },
  phoneHint: { marginTop: 1, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 13 },
  sheetPrimaryButton: { minHeight: 50, marginTop: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.light.primary },
  buttonDisabled: { backgroundColor: '#e5ede9' },
  disabledButtonText: { color: '#849791' },
  receipt: { marginTop: 21, borderTopWidth: 1, borderTopColor: '#e7efeb' },
  receiptRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15, borderBottomWidth: 1, borderBottomColor: '#e7efeb' },
  receiptLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12 },
  receiptValue: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 12, textAlign: 'right' },
  receiptTotal: { minHeight: 52 },
  receiptTotalLabel: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 13 },
  receiptAmount: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 16 },
  notice: { marginTop: 17, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 13, backgroundColor: '#fff5e6' },
  noticeText: { flex: 1, color: '#78511a', fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  cancelButton: { minHeight: 46, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.light.border, borderRadius: 13, backgroundColor: colors.light.white },
  cancelText: { color: '#376058', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  unavailableBlock: { alignItems: 'flex-start' },
  unavailableIcon: { width: 45, height: 45, marginTop: 21, marginBottom: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: '#ffebe5' },
  unavailableTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 },
  unavailableText: { marginTop: 8, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});
