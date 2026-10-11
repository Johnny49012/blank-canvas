import { useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
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
type Sheet = 'beneficiary' | 'confirmation' | 'unavailable' | 'invalid' | 'mismatch' | 'unknown' | 'insufficient' | 'balance' | null;
type Validation = { kind: 'empty' | 'invalid' | 'unknown' | 'mismatch' | 'valid'; detected?: Network };

const networks: Network[] = ['MTN', 'AirtelTigo', 'Telecel'];
const amounts = [5, 10, 20, 50, 100, 200];
const prefixes: Record<Network, string[]> = {
  MTN: ['024', '025', '053', '054', '055', '059'],
  AirtelTigo: ['026', '027', '056', '057'],
  Telecel: ['020', '050'],
};

function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('233')) digits = `0${digits.slice(3)}`;
  return digits;
}

function formatPhone(value: string) {
  const normalized = normalizePhone(value);
  return normalized.length === 10
    ? `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`
    : normalized;
}

function validatePhone(value: string, network: Network): Validation {
  const normalized = normalizePhone(value);
  if (!normalized) return { kind: 'empty' };
  if (!/^0\d{9}$/.test(normalized)) return { kind: 'invalid' };
  const detected = networks.find((item) => prefixes[item].includes(normalized.slice(0, 3)));
  if (!detected) return { kind: 'unknown' };
  return detected === network ? { kind: 'valid', detected } : { kind: 'mismatch', detected };
}

function CarrierLogo({ network }: { network: Network }) {
  if (network === 'MTN') {
    return <View style={styles.carrierLogo}><View style={styles.mtnLogo}><Text style={styles.mtnLogoText}>MTN</Text></View></View>;
  }
  if (network === 'AirtelTigo') {
    return <View style={styles.carrierLogo}><Text style={styles.airtelLogo}>a</Text></View>;
  }
  return <View style={styles.carrierLogo}><View style={styles.telecelLogo}><Text style={styles.telecelLogoText}>t</Text></View></View>;
}

export default function AirtimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const account = useQuery({ queryKey: ['topflex-home'], queryFn: loadHomeData });
  const profile = account.data?.profile;
  const displayName = profile?.fullName ?? 'TopFlex user';
  const unreadCount = account.data?.unreadNotifications ?? 0;
  const [step, setStep] = useState<'network' | 'amount'>('network');
  const [network, setNetwork] = useState<Network>('MTN');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const phoneValidation = validatePhone(phone, network);

  const goBack = () => {
    if (sheet) {
      if (sheet === 'confirmation') setSheet('beneficiary');
      else if (sheet === 'mismatch' || sheet === 'invalid' || sheet === 'unknown') setSheet('beneficiary');
      else setSheet(null);
      return;
    }
    if (step === 'amount') {
      setStep('network');
      setSelectedAmount(null);
      return;
    }
    router.back();
  };

  const chooseNetwork = (item: Network) => {
    setNetwork(item);
    setSelectedAmount(null);
    setPhone('');
    setStep('amount');
  };

  const selectAmount = (amount: number) => {
    Keyboard.dismiss();
    setSelectedAmount(amount);
    setSheet('beneficiary');
  };

  const continueFromBeneficiary = () => {
    Keyboard.dismiss();
    if (phoneValidation.kind === 'valid') setSheet('confirmation');
    else if (phoneValidation.kind === 'mismatch') setSheet('mismatch');
    else if (phoneValidation.kind === 'unknown') setSheet('unknown');
    else setSheet('invalid');
  };

  const confirmPurchasePreview = () => {
    const wallet = account.data?.wallet;
    if (!wallet) {
      setSheet('balance');
      return;
    }
    if (wallet.currency !== 'GHS') {
      setSheet('balance');
      return;
    }
    if (selectedAmount !== null && wallet.balance < selectedAmount) {
      setSheet('insufficient');
      return;
    }
    setSheet('unavailable');
  };

  const closeSheet = () => {
    if (sheet === 'confirmation') {
      setSheet('beneficiary');
      return;
    }
    if (sheet === 'mismatch' || sheet === 'invalid' || sheet === 'unknown') {
      setSheet('beneficiary');
      return;
    }
    setSheet(null);
  };

  const titleForSheet = () => {
    switch (sheet) {
      case 'beneficiary': return 'Enter Beneficiary Number';
      case 'confirmation': return 'Confirm Purchase';
      case 'unavailable': return 'Purchase unavailable';
      case 'invalid': return 'Invalid Phone Number';
      case 'mismatch': return 'Network Mismatch';
      case 'unknown': return 'Confirm Network';
      case 'insufficient': return 'Insufficient Balance';
      case 'balance': return 'Wallet Balance Unavailable';
      default: return '';
    }
  };

  const subtitleForSheet = () => {
    switch (sheet) {
      case 'beneficiary': return 'Enter the number you want to top up.';
      case 'confirmation': return 'Review your airtime details before continuing.';
      case 'unavailable': return 'Airtime purchases are not connected in TopFlex yet.';
      case 'invalid': return 'Please enter a valid Ghana mobile number.';
      case 'mismatch': return 'The number may use a different network. Check it or change the selected network.';
      case 'unknown': return 'We could not reliably identify the network from this number.';
      case 'insufficient': return 'Your available wallet balance is below the selected airtime value.';
      case 'balance': return 'Check your wallet balance before continuing. No funds have been charged.';
      default: return '';
    }
  };

  const showPhoneForm = () => setSheet('beneficiary');

  return (
    <View style={styles.page}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
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
              <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" testID="airtime-back">
                <Ionicons name="arrow-back" size={22} color={colors.light.white} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/notifications')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                style={styles.notificationButton}
                testID="airtime-notifications"
              >
                <Ionicons name="notifications-outline" size={22} color={colors.light.white} />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </Pressable>
              <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Open profile" testID="airtime-profile" style={styles.avatar}>
                {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>}
              </Pressable>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>Buy Airtime</Text>
              <Text style={styles.subtitle}>Stay connected. Choose your network and top up.</Text>
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
                      accessibilityLabel={`Select ${item}`}
                      accessibilityState={{ selected: network === item }}
                      testID={`airtime-network-${item}`}
                      style={({ pressed }) => [styles.networkCard, network === item && styles.networkCardSelected, pressed && styles.pressed]}
                    >
                      <CarrierLogo network={item} />
                      <Text style={[styles.networkLabel, network === item && styles.networkLabelSelected]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.infoCard} accessibilityLiveRegion="polite" testID="airtime-information">
                  <View style={styles.infoIcon}><Ionicons name="flash" size={20} color={colors.light.primary} /></View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoHeading}>Fast. Reliable. Always on.</Text>
                    <Text style={styles.infoText}>Top up airtime for your {network} number instantly.</Text>
                  </View>
                </View>
                <View style={styles.whySection}>
                  <Text style={styles.sectionTitle}>Why choose TopFlex?</Text>
                  <View style={styles.benefitGrid}>
                    {[
                      { icon: 'shield-checkmark' as const, first: 'Secure', second: 'Payments' },
                      { icon: 'flash' as const, first: 'Instant', second: 'Activation' },
                      { icon: 'pricetag' as const, first: 'Best', second: 'Rates' },
                      { icon: 'headset' as const, first: '24/7', second: 'Support' },
                    ].map((benefit) => (
                      <View style={styles.benefit} key={benefit.first}>
                        <View style={styles.benefitIcon}><Ionicons name={benefit.icon} size={19} color={colors.light.primary} /></View>
                        <Text style={styles.benefitLabel}>{benefit.first}{'\n'}{benefit.second}</Text>
                      </View>
                    ))}
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
              <View style={styles.amountStep}>
                <View style={styles.selectedNetwork}>
                  <CarrierLogo network={network} />
                  <View style={styles.selectedNetworkCopy}>
                    <Text style={styles.selectedNetworkText}>{network}</Text>
                    <Text style={styles.selectedNetworkCaption}>Selected Network</Text>
                  </View>
                  <Pressable onPress={() => { setStep('network'); setSelectedAmount(null); }} accessibilityRole="button" accessibilityLabel="Change network" testID="airtime-change-network" style={styles.changeButton}>
                    <Text style={styles.changeText}>Change</Text>
                  </Pressable>
                </View>
                <View style={styles.amountHeading}>
                  <Text style={styles.sectionTitle}>Select Airtime Amount</Text>
                  <Text style={styles.amountNote}>Choose a top-up value</Text>
                </View>
                <View style={styles.amountGrid}>
                  {amounts.map((amount) => (
                    <Pressable
                      key={amount}
                      onPress={() => selectAmount(amount)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select GH₵ ${amount} airtime`}
                      accessibilityState={{ selected: selectedAmount === amount }}
                      testID={`airtime-amount-${amount}`}
                      style={({ pressed }) => [styles.amountCard, selectedAmount === amount && styles.amountCardSelected, pressed && styles.pressed]}
                    >
                      <View style={styles.amountCardTop}>
                        <Text style={[styles.amountValue, selectedAmount === amount && styles.amountValueSelected]}>GH₵ {amount}</Text>
                        {selectedAmount === amount && <Ionicons name="checkmark-circle" size={19} color={colors.light.primary} />}
                      </View>
                      <Text style={[styles.amountCaption, selectedAmount === amount && styles.amountCaptionSelected]}>Airtime value GH₵ {amount}.00</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pricingNote}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.light.primary} />
                  <Text style={styles.pricingNoteText}>Service fee and total payable will be shown once pricing is configured.</Text>
                </View>
                <View style={styles.trustLine}>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.light.primary} />
                  <Text style={styles.trustText}>No payment is taken in this preview.</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal visible={sheet !== null} transparent animationType="slide" statusBarTranslucent onRequestClose={closeSheet}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={closeSheet} accessibilityRole="button" accessibilityLabel="Close airtime sheet" testID="airtime-sheet-scrim" />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeadingCopy}>
                <Text style={styles.sheetTitle}>{titleForSheet()}</Text>
                <Text style={styles.sheetSubtitle}>{subtitleForSheet()}</Text>
              </View>
              <Pressable onPress={closeSheet} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" testID="airtime-close-sheet">
                <Ionicons name="close-circle" size={26} color={colors.light.mutedForeground} />
              </Pressable>
            </View>

            {sheet === 'beneficiary' && selectedAmount !== null && (
              <>
                <View style={styles.beneficiaryAmount}>
                  <CarrierLogo network={network} />
                  <View style={styles.beneficiaryAmountCopy}>
                    <Text style={styles.beneficiaryNetwork}>{network} Airtime</Text>
                    <Text style={styles.beneficiaryDenomination}>GH₵ {selectedAmount}.00</Text>
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Ghana mobile number</Text>
                <View style={[styles.phoneField, phoneValidation.kind === 'valid' && styles.phoneFieldValid]}>
                  <Ionicons name="phone-portrait-outline" size={19} color={colors.light.primary} />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="024 123 4567"
                    placeholderTextColor={colors.light.mutedForeground}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    style={styles.phoneInput}
                    accessibilityLabel="Beneficiary phone number"
                    testID="airtime-beneficiary-phone"
                    returnKeyType="done"
                    onSubmitEditing={continueFromBeneficiary}
                  />
                </View>
                <View style={styles.validationRow} accessibilityLiveRegion="polite" testID="airtime-phone-validation">
                  <Ionicons
                    name={phoneValidation.kind === 'valid' ? 'checkmark-circle' : phoneValidation.kind === 'mismatch' || phoneValidation.kind === 'invalid' || phoneValidation.kind === 'unknown' ? 'alert-circle' : 'information-circle'}
                    size={17}
                    color={phoneValidation.kind === 'valid' ? colors.light.primary : phoneValidation.kind === 'mismatch' || phoneValidation.kind === 'invalid' || phoneValidation.kind === 'unknown' ? colors.light.destructive : colors.light.mutedForeground}
                  />
                  <Text style={[styles.validationText, (phoneValidation.kind === 'mismatch' || phoneValidation.kind === 'invalid' || phoneValidation.kind === 'unknown') && styles.validationError]}>
                    {phoneValidation.kind === 'valid'
                      ? `${phoneValidation.detected} prefix detected`
                      : phoneValidation.kind === 'empty'
                        ? 'Enter a Ghana mobile number to continue.'
                        : phoneValidation.kind === 'invalid'
                          ? 'Enter a valid 10-digit number, such as 024 123 4567.'
                        : phoneValidation.kind === 'unknown'
                            ? 'Network not identified. Confirm with the recipient before continuing.'
                            : `${phoneValidation.detected} prefix detected. Verify the number or change network.`}
                  </Text>
                </View>
                <Text style={styles.phoneHint}>Number portability means a prefix may not reflect the current carrier.</Text>
                {phoneValidation.kind === 'mismatch' && (
                  <View style={styles.mismatchActions}>
                    <Pressable onPress={() => setPhone('')} accessibilityRole="button" testID="airtime-mismatch-try-again" style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Try Again</Text>
                    </Pressable>
                    <Pressable onPress={() => { setSheet(null); setStep('network'); setSelectedAmount(null); setPhone(''); }} accessibilityRole="button" testID="airtime-mismatch-change-network" style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Change Network</Text>
                    </Pressable>
                  </View>
                )}
                <Pressable
                  disabled={phoneValidation.kind === 'empty'}
                  onPress={continueFromBeneficiary}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: phoneValidation.kind === 'empty' }}
                  testID="airtime-continue-confirmation"
                  style={({ pressed }) => [styles.sheetPrimaryButton, phoneValidation.kind === 'empty' && styles.buttonDisabled, pressed && phoneValidation.kind !== 'empty' && styles.buttonPressed]}
                >
                  <Text style={[styles.primaryButtonText, phoneValidation.kind === 'empty' && styles.disabledButtonText]}>Continue</Text>
                </Pressable>
              </>
            )}

            {sheet === 'confirmation' && selectedAmount !== null && (
              <>
                <View style={styles.receipt}>
                  <View style={styles.receiptNetwork}>
                    <CarrierLogo network={network} />
                    <View><Text style={styles.receiptNetworkName}>{network}</Text><Text style={styles.receiptNetworkCaption}>Mobile airtime</Text></View>
                  </View>
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Airtime Amount</Text><Text style={styles.receiptValue}>GH₵ {selectedAmount.toFixed(2)}</Text></View>
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Beneficiary Number</Text><Text style={styles.receiptValue}>{formatPhone(phone)}</Text></View>
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Service Fee</Text><Text style={styles.unconfiguredValue}>Not configured</Text></View>
                  <View style={[styles.receiptRow, styles.receiptTotal]}><Text style={styles.receiptTotalLabel}>Total Payable</Text><Text style={styles.unconfiguredValue}>Not configured</Text></View>
                </View>
                <View style={styles.notice}>
                  <Ionicons name="information-circle-outline" size={19} color="#865e20" />
                  <Text style={styles.noticeText}>Pricing and payment are not configured. No wallet funds will be charged.</Text>
                </View>
                <Pressable onPress={confirmPurchasePreview} accessibilityRole="button" testID="airtime-buy-now" style={({ pressed }) => [styles.sheetPrimaryButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.primaryButtonText}>Buy Now</Text>
                </Pressable>
                <Pressable onPress={() => setSheet('beneficiary')} accessibilityRole="button" testID="airtime-cancel-purchase" style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Edit number</Text>
                </Pressable>
              </>
            )}

            {(sheet === 'invalid' || sheet === 'mismatch' || sheet === 'unknown') && (
              <View style={styles.stateBlock}>
                <View style={[styles.stateIcon, sheet === 'unknown' ? styles.warningIcon : styles.errorIcon]}>
                  <Ionicons
                    name={sheet === 'mismatch' ? 'swap-horizontal' : sheet === 'unknown' ? 'help-circle-outline' : 'phone-portrait-outline'}
                    size={25}
                    color={sheet === 'unknown' ? colors.light.primary : colors.light.destructive}
                  />
                </View>
                <Text style={styles.stateMessage}>
                  {sheet === 'mismatch'
                    ? `This number has a ${phoneValidation.detected ?? 'different'} prefix, while ${network} is selected. Network will not be changed automatically.`
                    : sheet === 'unknown'
                      ? `We cannot reliably identify this carrier. Confirm with the recipient that this number uses ${network} before continuing.`
                      : 'Please enter a valid Ghana mobile number.'}
                </Text>
                <Pressable onPress={showPhoneForm} accessibilityRole="button" testID="airtime-error-try-again" style={styles.sheetPrimaryButton}>
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </Pressable>
                {sheet === 'mismatch' && (
                  <>
                    <Pressable onPress={() => { setSheet(null); setStep('network'); setSelectedAmount(null); setPhone(''); }} accessibilityRole="button" testID="airtime-error-change-network" style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Change Network</Text>
                    </Pressable>
                    <Pressable onPress={() => setSheet('confirmation')} accessibilityRole="button" testID="airtime-confirm-ported-number" style={styles.cancelButton}>
                      <Text style={styles.cancelText}>I verified this number is on {network}</Text>
                    </Pressable>
                  </>
                )}
                {sheet === 'unknown' && (
                  <Pressable onPress={() => setSheet('confirmation')} accessibilityRole="button" testID="airtime-confirm-unknown-network" style={styles.cancelButton}>
                    <Text style={styles.cancelText}>I confirmed {network}</Text>
                  </Pressable>
                )}
              </View>
            )}

            {sheet === 'unavailable' && (
              <View style={styles.stateBlock}>
                <View style={[styles.stateIcon, styles.errorIcon]}><Ionicons name="close-circle" size={27} color={colors.light.destructive} /></View>
                <Text style={styles.stateTitle} testID="airtime-purchase-status">Purchase service not connected</Text>
                <Text style={styles.stateMessage}>No purchase was made. No payment was taken, no transaction was created, and no wallet balance was changed.</Text>
                <Pressable onPress={() => setSheet(null)} accessibilityRole="button" testID="airtime-return-to-amounts" style={styles.sheetPrimaryButton}>
                  <Text style={styles.primaryButtonText}>Back to amounts</Text>
                </Pressable>
              </View>
            )}

            {sheet === 'insufficient' && (
              <View style={styles.stateBlock}>
                <View style={[styles.stateIcon, styles.warningIcon]}><Ionicons name="wallet-outline" size={25} color={colors.light.primary} /></View>
                <Text style={styles.stateMessage}>You don't have enough balance for this airtime value. Add money and return to continue. Your selected network and amount will be kept.</Text>
                <Pressable onPress={() => { setSheet(null); router.push('/wallet'); }} accessibilityRole="button" testID="airtime-insufficient-go-wallet" style={styles.sheetPrimaryButton}>
                  <Text style={styles.primaryButtonText}>Go to Wallet</Text>
                </Pressable>
                <Pressable onPress={() => setSheet('confirmation')} accessibilityRole="button" testID="airtime-insufficient-cancel" style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            )}

            {sheet === 'balance' && (
              <View style={styles.stateBlock}>
                <View style={[styles.stateIcon, styles.warningIcon]}><Ionicons name="wallet-outline" size={25} color={colors.light.primary} /></View>
                <Text style={styles.stateMessage}>Wallet balance is unavailable, so we cannot check whether this amount is affordable. No funds have been charged.</Text>
                <Pressable onPress={() => { setSheet(null); router.push('/wallet'); }} accessibilityRole="button" testID="airtime-balance-go-wallet" style={styles.sheetPrimaryButton}>
                  <Text style={styles.primaryButtonText}>Go to Wallet</Text>
                </Pressable>
                <Pressable onPress={() => setSheet('confirmation')} accessibilityRole="button" testID="airtime-balance-cancel" style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
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
  whySection: { paddingTop: 31, paddingBottom: 22 },
  benefitGrid: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  benefit: { flex: 1, minWidth: 0, alignItems: 'center' },
  benefitIcon: { width: 41, height: 41, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.light.softMint },
  benefitLabel: { marginTop: 7, color: '#244842', fontFamily: 'Inter_600SemiBold', fontSize: 9, lineHeight: 12, textAlign: 'center' },
  brandFooter: { position: 'relative', minHeight: 112, marginTop: 7, marginHorizontal: -21, paddingTop: 34, paddingBottom: 17, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: '#006957' },
  footerWave: { position: 'absolute', top: 0, left: 0 },
  footerMessage: { color: '#def5ee', fontFamily: 'Inter_400Regular', fontSize: 13 },
  amountStep: { minHeight: 575, paddingBottom: 24 },
  selectedNetwork: { minHeight: 58, marginBottom: 24, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, backgroundColor: colors.light.secondary },
  selectedNetworkCopy: { flex: 1 },
  selectedNetworkText: { color: '#31534e', fontFamily: 'Inter_700Bold', fontSize: 12 },
  selectedNetworkCaption: { marginTop: 2, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9 },
  changeButton: { paddingHorizontal: 8, paddingVertical: 8 },
  changeText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  amountHeading: { marginBottom: 12 },
  amountNote: { marginTop: 4, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountCard: { flexBasis: '47%', flexGrow: 1, minHeight: 80, padding: 12, borderWidth: 1, borderColor: colors.light.border, borderRadius: 14, backgroundColor: colors.light.white },
  amountCardSelected: { borderColor: colors.light.primary, backgroundColor: '#effaf5' },
  amountCardTop: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  amountValue: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 },
  amountValueSelected: { color: colors.light.primary },
  amountCaption: { marginTop: 7, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9 },
  amountCaptionSelected: { color: '#52716b' },
  pricingNote: { marginTop: 21, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 13, backgroundColor: '#e9f8f4' },
  pricingNoteText: { flex: 1, color: '#52716b', fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  trustLine: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  trustText: { color: colors.light.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 10 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 38, 33, 0.48)' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '92%', paddingHorizontal: 22, paddingTop: 12, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: colors.light.white, overflow: 'hidden' },
  sheetHandle: { width: 37, height: 4, alignSelf: 'center', marginBottom: 16, borderRadius: 3, backgroundColor: '#c7dcd4' },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 19 },
  sheetHeadingCopy: { flex: 1 },
  sheetTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.35 },
  sheetSubtitle: { marginTop: 4, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  beneficiaryAmount: { minHeight: 58, marginBottom: 19, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: '#effaf5' },
  beneficiaryAmountCopy: { flex: 1 },
  beneficiaryNetwork: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  beneficiaryDenomination: { marginTop: 3, color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 12 },
  fieldLabel: { marginBottom: 7, color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  phoneField: { minHeight: 49, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, backgroundColor: colors.light.white },
  phoneFieldValid: { borderColor: colors.light.primary },
  phoneInput: { flex: 1, minWidth: 0, paddingVertical: 11, color: colors.light.foreground, fontFamily: 'Inter_500Medium', fontSize: 13, outlineStyle: 'none' as never },
  validationRow: { minHeight: 30, marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  validationText: { flex: 1, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  validationError: { color: colors.light.destructive },
  phoneHint: { marginTop: 4, marginBottom: 14, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 13 },
  mismatchActions: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  secondaryButton: { flex: 1, minHeight: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, backgroundColor: colors.light.white },
  secondaryButtonText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  sheetPrimaryButton: { minHeight: 48, marginTop: 8, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.light.primary },
  primaryButtonText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 12 },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { backgroundColor: '#dce9e3' },
  disabledButtonText: { color: '#8da39b' },
  receipt: { paddingHorizontal: 13, paddingVertical: 4, borderRadius: 14, backgroundColor: '#effaf5' },
  receiptNetwork: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: '#dceee7' },
  receiptNetworkName: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  receiptNetworkCaption: { marginTop: 2, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9 },
  receiptRow: { minHeight: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderBottomColor: '#dceee7' },
  receiptLabel: { color: '#52716b', fontFamily: 'Inter_400Regular', fontSize: 10 },
  receiptValue: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'right' },
  unconfiguredValue: { color: '#865e20', fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'right' },
  receiptTotal: { minHeight: 47, borderBottomWidth: 0 },
  receiptTotalLabel: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  notice: { marginTop: 13, padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 11, backgroundColor: '#fff6e7' },
  noticeText: { flex: 1, color: '#735b2d', fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  cancelButton: { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.light.border, borderRadius: 13, backgroundColor: colors.light.white },
  cancelText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  stateBlock: { alignItems: 'center', paddingBottom: 4 },
  stateIcon: { width: 56, height: 56, marginTop: 3, marginBottom: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  errorIcon: { backgroundColor: '#fff0ee' },
  warningIcon: { backgroundColor: colors.light.softMint },
  stateTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center' },
  stateMessage: { marginTop: 6, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
