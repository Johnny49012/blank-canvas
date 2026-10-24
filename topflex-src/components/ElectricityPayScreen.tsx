import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { ELECTRICITY_FEE, ELECTRICITY_PROVIDERS, maskMeter, MeterType, validateElectricityForm } from '@/lib/electricity';

const C = colors.light;
const TEXT = '#16384a';
const MUTED = '#6b8189';

export default function ElectricityPayScreen({ provider: key }: { provider: 'ecg' | 'nedco' }) {
  const p = ELECTRICITY_PROVIDERS[key];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [type, setType] = useState<MeterType>('prepaid');
  const [meter, setMeter] = useState('');
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const errors = validateElectricityForm(meter, amount);
  const topInset = Platform.OS === 'web' ? 16 : insets.top;

  const goBack = () => {
    if (step === 'review') { setStep('form'); setDemoNote(false); return; }
    router.canGoBack() ? router.back() : router.replace({ pathname: '/bills', params: { category: 'electricity' } });
  };
  const onContinue = () => {
    setTouched(true);
    if (!errors.meter && !errors.amount) setStep('review');
  };
  const amt = Number(amount || 0);
  const total = amt + (ELECTRICITY_FEE ?? 0);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[C.headerStart, '#08604c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.header, { paddingTop: topInset + 12 }]}>
          <Pressable accessibilityLabel="Go back" onPress={goBack} hitSlop={12} style={{ marginBottom: 22 }}>
            <Ionicons name="arrow-back" size={24} color={C.white} />
          </Pressable>
          <Text style={s.title}>{step === 'form' ? `${p.name} Electricity` : 'Review payment'}</Text>
          <Text style={s.subtitle}>{step === 'form' ? `Pay your ${p.name} electricity bill` : 'Check the details before continuing.'}</Text>
        </LinearGradient>

        <View style={s.body}>
          <View style={s.card}>
            <View style={s.row}>
              <View style={[s.badge, { backgroundColor: p.color }]}><Text style={s.badgeText}>{p.name.slice(0, 1)}</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.cardTitle}>{p.name}</Text>
                <Text style={s.muted}>{p.fullName}</Text>
              </View>
              <Ionicons name="flash" size={22} color="#f07a1a" />
            </View>
          </View>

          {step === 'form' ? (
            <View style={s.card}>
              <Text style={s.label}>Meter type</Text>
              <View style={s.seg}>
                {(['prepaid', 'postpaid'] as MeterType[]).map((t) => (
                  <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: type === t }} onPress={() => setType(t)} style={[s.segBtn, type === t && s.segOn]}>
                    <Text style={[s.segText, type === t && { color: C.white }]}>{t === 'prepaid' ? 'Prepaid' : 'Postpaid'}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.helper}>
                {type === 'prepaid'
                  ? `Buy electricity credit for your ${p.name} prepaid meter. Your token is issued only after a successful payment.`
                  : `Pay towards your ${p.name} postpaid electricity bill.`}
              </Text>

              <Text style={s.label}>{type === 'prepaid' ? 'Prepaid meter number' : 'Meter / account number'}</Text>
              <TextInput value={meter} onChangeText={setMeter} placeholder="e.g. 0123456789" placeholderTextColor="#a3b4b9" autoCapitalize="characters" maxLength={20} style={[s.input, touched && errors.meter && s.inputErr]} />
              {touched && errors.meter ? <Text style={s.err}>{errors.meter}</Text> : null}

              <Text style={s.label}>Amount (GH₵)</Text>
              <View style={[s.input, s.row, touched && errors.amount && s.inputErr]}>
                <Text style={s.cedi}>GH₵</Text>
                <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#a3b4b9" style={s.amountInput} />
              </View>
              {touched && errors.amount ? <Text style={s.err}>{errors.amount}</Text> : null}

              <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}>
                <Text style={s.ctaText}>Continue</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.card}>
              {[
                ['Provider', `${p.name} — ${p.fullName}`],
                ['Meter type', type === 'prepaid' ? 'Prepaid (electricity credit)' : 'Postpaid (bill payment)'],
                ['Meter number', maskMeter(meter)],
                ['Amount', `GH₵${amt.toFixed(2)}`],
                ...(ELECTRICITY_FEE != null ? [['Fee', `GH₵${ELECTRICITY_FEE.toFixed(2)}`]] : []),
                ['Total', `GH₵${total.toFixed(2)}`],
              ].map(([k, v]) => (
                <View key={k} style={s.reviewRow}><Text style={s.muted}>{k}</Text><Text style={s.reviewVal}>{v}</Text></View>
              ))}
              <Pressable accessibilityRole="button" onPress={() => setDemoNote(true)} style={s.cta}>
                <Text style={s.ctaText}>Pay (preview only)</Text>
              </Pressable>
              {demoNote ? (
                <View style={[s.notice, { backgroundColor: '#fdecec' }]}>
                  <Ionicons name="cloud-offline-outline" size={17} color="#c62828" />
                  <Text style={s.noticeText}>This is a preview. {p.name} payments aren't connected, so no money was charged and no token was issued.</Text>
                </View>
              ) : null}
              <Pressable accessibilityRole="button" onPress={goBack} style={s.secondary}>
                <Text style={s.secondaryText}>Back / Edit details</Text>
              </Pressable>
            </View>
          )}

          <View style={s.notice}>
            <Ionicons name="information-circle-outline" size={17} color={C.primary} />
            <Text style={s.noticeText}>Provider payments aren't connected yet in this preview. No bill will be charged.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3fbf8' },
  scroll: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingBottom: 44 },
  title: { color: C.white, fontFamily: 'Inter_700Bold', fontSize: 28 },
  subtitle: { color: '#e3f6ef', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 8 },
  body: { marginTop: -24, backgroundColor: '#f3fbf8', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 20, gap: 14 },
  card: { padding: 16, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: '#e6f2ee' },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: C.white, fontFamily: 'Inter_700Bold', fontSize: 18 },
  cardTitle: { color: TEXT, fontFamily: 'Inter_700Bold', fontSize: 17 },
  muted: { color: MUTED, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 3 },
  label: { color: TEXT, fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 14, marginBottom: 8 },
  seg: { flexDirection: 'row', backgroundColor: C.muted, borderRadius: 14, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: C.primary },
  segText: { color: TEXT, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  helper: { color: MUTED, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 8 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 50, color: TEXT, fontFamily: 'Inter_500Medium', fontSize: 15, backgroundColor: '#fbfefd' },
  inputErr: { borderColor: '#c55c5c' },
  err: { color: '#c55c5c', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
  cedi: { color: MUTED, fontFamily: 'Inter_600SemiBold', fontSize: 15, marginRight: 8 },
  amountInput: { flex: 1, minHeight: 48, color: TEXT, fontFamily: 'Inter_500Medium', fontSize: 15 },
  cta: { marginTop: 20, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: C.white, fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondary: { marginTop: 10, borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  secondaryText: { color: C.primary, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eef5f2', gap: 12 },
  reviewVal: { flexShrink: 1, textAlign: 'right', color: TEXT, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  notice: { marginTop: 12, padding: 13, borderRadius: 14, backgroundColor: C.softMint, flexDirection: 'row', gap: 8 },
  noticeText: { flex: 1, color: C.foreground, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
});
