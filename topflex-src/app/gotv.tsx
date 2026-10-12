import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import HERO from '../src/assets/gotv-hero.jpg';
import { formatGhs, loadHomeData } from '@/lib/topflex';
import { GotvHelp } from '@/components/GotvHelp';
import { gotvColors as B } from '@/constants/gotv-colors';

// Official GOtv Ghana compare-package prices checked 12 October 2026.
const PRICE_SOURCE = 'GOtv Ghana published prices · checked 12 Oct 2026';
type Category = 'all' | 'sports' | 'movies' | 'entertainment';
const PACKAGES = [
  { id: 'lite', name: 'GOtv Lite', price: 29, desc: '20+ channels · local entertainment and news.', tags: ['entertainment'] },
  { id: 'value', name: 'GOtv Value', price: 48, desc: '30+ channels · local favourites and family viewing.', tags: ['entertainment'] },
  { id: 'plus', name: 'GOtv Plus', price: 98, desc: '45+ channels · movies, entertainment and selected sport.', tags: ['entertainment', 'movies', 'sports'] },
  { id: 'max', name: 'GOtv Max', price: 173, desc: '55+ channels · more entertainment, movies and sport.', tags: ['entertainment', 'movies', 'sports'] },
  { id: 'supa', name: 'GOtv Supa', price: 227, desc: '70+ channels · a wider choice of family entertainment.', tags: ['entertainment', 'movies', 'sports'] },
  { id: 'supa-plus', name: 'GOtv Supa+', price: 295, desc: '75+ channels · the largest GOtv Ghana channel selection.', tags: ['entertainment', 'movies', 'sports'] },
];
type Step = 'home' | 'manage' | 'verify' | 'packages' | 'confirm' | 'result' | 'help';

function Logo({ size = 26 }: { size?: number }) {
  return <Text style={{ color: B.white, fontFamily: 'Inter_700Bold', fontSize: size, fontStyle: 'italic', letterSpacing: 0 }}>GOtv</Text>;
}

export default function GotvScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('home');
  const [card, setCard] = useState('');
  const [verify, setVerify] = useState<'idle' | 'invalid' | 'unavailable'>('idle');
  const [cat, setCat] = useState<Category>('all');
  const [pkg, setPkg] = useState<string | null>(null);
  const [method, setMethod] = useState<'wallet' | 'momo'>('wallet');
  const [paying, setPaying] = useState(false);
  const { data } = useQuery({ queryKey: ['home'], queryFn: loadHomeData });
  const selected = PACKAGES.find((p) => p.id === pkg);
  const back = () => (step === 'home' ? router.back() : setStep(step === 'confirm' ? 'packages' : step === 'result' ? 'confirm' : 'home'));

  const runVerify = () => {
    const digits = card.replace(/\D/g, '');
    if (digits.length !== 10) return setVerify('invalid');
    // No authorized GOtv verification service is connected, so no account can be confirmed.
    setVerify('unavailable');
  };
  const [action, setAction] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const runAction = (name: string) => {
    const digits = card.replace(/\D/g, '');
    if (digits.length !== 10) { setVerify('invalid'); return; }
    setActionBusy(true); setAction(null);
    // No authorized GOtv service is connected, so no account request can actually be sent.
    setTimeout(() => { setActionBusy(false); setAction(name); }, 900);
  };
  const pay = () => {
    if (paying) return;
    setPaying(true);
    setTimeout(() => { setPaying(false); setStep('result'); }, 900);
  };

  const header = (
    <LinearGradient colors={[B.navy, B.blue]} style={styles.header}>
      <Pressable accessibilityLabel="Go back" onPress={back} hitSlop={12}><Ionicons name="arrow-back" size={22} color={B.white} /></Pressable>
      <Logo />
      <Pressable accessibilityLabel="Get help" onPress={() => setStep('help')} hitSlop={12}><Ionicons name="headset-outline" size={22} color={B.white} /></Pressable>
    </LinearGradient>
  );

  const list = PACKAGES.filter((p) => cat === 'all' || p.tags.includes(cat));

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'home' && (
          <>
            <LinearGradient colors={[B.deep, B.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <Image source={typeof HERO === 'string' ? { uri: HERO } : HERO} resizeMode="cover" style={styles.heroImg} accessibilityLabel="Family enjoying television together" />
              <LinearGradient colors={[B.deep, B.heroTint, B.transparent]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
              <Logo size={40} />
              <Text style={styles.heroTitle}>GOtv Subscriptions</Text>
              <Text style={styles.heroText}>Your favourite shows. Your family. Your GOtv.</Text>
            </LinearGradient>
            <Pressable onPress={() => { setAction(null); setStep('manage'); }} style={styles.manage}>
              <Ionicons name="tv-outline" size={26} color={B.white} />
              <View style={{ flex: 1 }}><Text style={styles.manageTitle}>Manage My Account</Text><Text style={styles.manageText}>Check your account and fix decoder errors.</Text></View>
              <Ionicons name="chevron-forward" size={20} color={B.white} />
            </Pressable>
            <View style={styles.quickList}>
              {([['refresh-outline', 'Renew Subscription', 'Verify your IUC to renew.', () => setStep('verify')], ['albums-outline', 'View Packages', 'Compare channels and monthly prices.', () => setStep('packages')], ['help-buoy-outline', 'Get Help', 'GOtv guides, FAQs and TopFlex support.', () => setStep('help')]] as const).map(([icon, label, sub, fn]) => (
                <Pressable key={label} accessibilityRole="button" onPress={fn} style={({ pressed }) => [styles.quickRow, pressed && styles.quickRowPressed]}>
                  <View style={styles.quickIcon}><Ionicons name={icon} size={22} color={B.white} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{label}</Text><Text style={styles.quickSub}>{sub}</Text></View>
                  <Ionicons name="chevron-forward" size={19} color={B.white} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 'help' && <GotvHelp />}

        {step === 'manage' && (
          <>
            <Text style={styles.h1}>Manage My Account</Text>
            <Text style={styles.sub}>Enter your IUC number, then choose what you need.</Text>
            <View style={styles.card}>
              <Text style={styles.label} nativeID="msmart">IUC Number</Text>
              <TextInput accessibilityLabelledBy="msmart" value={card} onChangeText={(t) => { setCard(t.replace(/[^\d ]/g, '')); setVerify('idle'); setAction(null); }} keyboardType="number-pad" maxLength={12} placeholder="e.g. 1234 5678 90" placeholderTextColor={B.muted} style={[styles.input, verify === 'invalid' && { borderColor: B.red }]} />
              {verify === 'invalid' && <Text style={styles.err}>Enter a valid 10-digit IUC number.</Text>}
            </View>
            <View style={styles.quickList}>
              {([['person-circle-outline', 'Account Status', 'See your package and due date.'], ['flash-outline', 'Clear Error E16', 'Channels scrambled after renewing.'], ['card-outline', 'Clear Error E30', 'Checking subscription status.'], ['radio-outline', 'Refresh Signal', 'Reconnect your decoder to GOtv.']] as const).map(([icon, label, sub]) => (
                <Pressable key={label} accessibilityRole="button" disabled={actionBusy} onPress={() => runAction(label)} style={({ pressed }) => [styles.quickRow, pressed && styles.quickRowPressed]}>
                  <View style={styles.quickIcon}><Ionicons name={icon} size={22} color={B.white} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{label}</Text><Text style={styles.quickSub}>{sub}</Text></View>
                  <Ionicons name="chevron-forward" size={19} color={B.white} />
                </Pressable>
              ))}
            </View>
            {actionBusy && <ActivityIndicator color={B.blue} />}
            {action && (
              <View style={styles.alert}><Ionicons name="cloud-offline-outline" size={18} color={B.red} /><Text style={styles.alertText}>{action} isn't available yet — TopFlex isn't connected to a GOtv account service. Nothing was sent to your decoder.</Text></View>
            )}
            <Pressable onPress={() => setStep('verify')}><Text style={styles.link}>Renew subscription instead</Text></Pressable>
          </>
        )}

        {step === 'verify' && (
          <>
            <Text style={styles.h1}>Renew Your Subscription</Text>
            <Text style={styles.sub}>Enter your IUC number to get started.</Text>
            <View style={styles.card}>
              <Text style={styles.label} nativeID="IUC">IUC Number</Text>
              <TextInput accessibilityLabelledBy="IUC" value={card} onChangeText={(t) => { setCard(t.replace(/[^\d ]/g, '')); setVerify('idle'); }} keyboardType="number-pad" maxLength={12} placeholder="e.g. 1234 5678 90" placeholderTextColor={B.muted} style={[styles.input, verify === 'invalid' && { borderColor: B.red }]} />
              {verify === 'invalid' && <Text style={styles.err}>Enter a valid 10-digit IUC number.</Text>}
              <Pressable onPress={runVerify} style={styles.btn}>
                <Text style={styles.btnText}>Verify Account</Text>
              </Pressable>
              {verify === 'unavailable' && (
                <View style={styles.alert}><Ionicons name="cloud-offline-outline" size={18} color={B.red} /><Text style={styles.alertText}>Account verification isn't available yet — TopFlex isn't connected to a GOtv account service. Your account was not checked.</Text></View>
              )}
              <View style={styles.info}><Ionicons name="information-circle" size={18} color={B.blue} /><Text style={styles.infoText}>Find your IUC number on the label underneath your GOtv decoder. Enter all 10 digits without spaces.</Text></View>
            </View>
            <Pressable onPress={() => setStep('packages')}><Text style={styles.link}>Browse GOtv packages</Text></Pressable>
          </>
        )}

        {step === 'packages' && (
          <>
            <LinearGradient colors={[B.deep, B.blue]} style={styles.banner}><Logo size={28} /><Text style={styles.bannerText}>More Channels. More Entertainment.</Text></LinearGradient>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {(['all', 'sports', 'movies', 'entertainment'] as Category[]).map((c) => (
                <Pressable key={c} onPress={() => setCat(c)} style={[styles.tab, cat === c && styles.tabOn]}><Text style={[styles.tabText, cat === c && { color: B.white }]}>{c === 'all' ? 'All Packages' : c[0].toUpperCase() + c.slice(1)}</Text></Pressable>
              ))}
            </ScrollView>
            {list.map((p) => {
              const on = pkg === p.id;
              return (
                <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setPkg(p.id)} style={[styles.pkg, on && styles.pkgOn]}>
                  <View style={styles.pkgLogo}><Text style={styles.pkgLogoText}>GOtv</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pkgName}>{p.name}</Text>
                    <Text style={styles.pkgDesc}>{p.desc}</Text>
                    <Text style={styles.price}>GH₵ {p.price}<Text style={styles.per}> / month</Text></Text>
                  </View>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? B.blue : B.border} />
                </Pressable>
              );
            })}
            <Text style={styles.source}>{PRICE_SOURCE}. Channel availability and final prices require confirmation before a live renewal.</Text>
          </>
        )}

        {step === 'confirm' && selected && (
          <>
            <Text style={styles.h1}>Confirm & Pay</Text>
            <Text style={styles.sub}>Review your details before you make payment.</Text>
            <View style={styles.card}>
              <Row k="Package" v={selected.name} />
              <Row k="Subscription" v={`GH₵ ${selected.price.toFixed(2)} / month`} />
              <Row k="IUC Number" v={card.trim() || 'Not verified'} />
              <Row k="Fees" v="Not confirmed" />
              <View style={styles.divider} />
              <Row k="Total" v={`GH₵ ${selected.price.toFixed(2)}`} bold />
            </View>
            <Text style={styles.section}>Select Payment Method</Text>
            {([['wallet', 'wallet-outline', 'TopFlex Wallet', data?.wallet ? `Available: ${formatGhs(data.wallet.balance)}` : 'Your TopFlex balance'], ['momo', 'phone-portrait-outline', 'Mobile Money', 'MTN, Telecel, AirtelTigo']] as const).map(([id, icon, t, d]) => (
              <Pressable key={id} onPress={() => setMethod(id)} style={[styles.pkg, method === id && styles.pkgOn, { alignItems: 'center' }]}>
                <Ionicons name={icon} size={22} color={B.blue} />
                <View style={{ flex: 1 }}><Text style={styles.pkgName}>{t}</Text><Text style={styles.pkgDesc}>{d}</Text></View>
                <Ionicons name={method === id ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === id ? B.blue : B.border} />
              </Pressable>
            ))}
          </>
        )}

        {step === 'result' && selected && (
          <>
            <View style={styles.resultTop}><View style={styles.resultIcon}><Ionicons name="time-outline" size={40} color={B.white} /></View>
              <Text style={styles.h1}>Renewal not available yet</Text>
              <Text style={[styles.sub, { textAlign: 'center' }]}>No payment was taken and your subscription was not changed. GOtv renewals will open once TopFlex connects to an authorized GOtv service.</Text></View>
            <View style={styles.card}><Row k="Package" v={selected.name} /><Row k="Amount" v={`GH₵ ${selected.price.toFixed(2)}`} /><Row k="IUC Number" v={card.trim() || 'Not verified'} /><Row k="Status" v="Not processed" /></View>
            <Pressable onPress={() => setStep('home')} style={styles.btn}><Text style={styles.btnText}>Back to GOtv</Text></Pressable>
            <Pressable onPress={() => router.push('/(tabs)/transactions')} style={styles.btnOutline}><Text style={[styles.btnText, { color: B.blue }]}>View Transactions</Text></Pressable>
          </>
        )}
      </ScrollView>

      {step === 'packages' && (
        <View style={styles.sticky}><Pressable disabled={!selected} onPress={() => { setVerify('idle'); setStep('verify'); }} style={[styles.btn, !selected && { opacity: 0.5 }]}><Text style={styles.btnText}>{selected ? `Verify IUC for ${selected.name}` : 'Select a package'}</Text></Pressable></View>
      )}
      {step === 'confirm' && selected && (
        <View style={styles.sticky}><Pressable disabled={paying} onPress={pay} style={[styles.btn, paying && { opacity: 0.7 }]}>{paying ? <ActivityIndicator color={B.white} /> : <Text style={styles.btnText}>Confirm and Pay GH₵ {selected.price.toFixed(2)}</Text>}</Pressable>
          <Text style={styles.secure}><Ionicons name="lock-closed" size={11} /> Payments are not available yet</Text></View>
      )}
    </View>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <View style={styles.row}><Text style={styles.rowK}>{k}</Text><Text style={[styles.rowV, bold && { fontSize: 16, color: B.blue }]}>{v}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: B.bg },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  content: { padding: 16, paddingBottom: 140, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' },
  hero: { borderRadius: 8, padding: 22, minHeight: 230, backgroundColor: B.deep, justifyContent: 'flex-end', overflow: 'hidden' },
  heroImg: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '100%' },
  heroTitle: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 24, marginTop: 10 },
  heroText: { color: B.subtitle, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6, lineHeight: 19, maxWidth: '62%' },
  manage: { backgroundColor: B.blue, borderRadius: 8, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: B.blue, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  manageTitle: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 16 },
  manageText: { color: B.subtitle, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  quickList: { gap: 10 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: B.blue, borderRadius: 8, padding: 16, shadowColor: B.blue, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  quickRowPressed: { backgroundColor: B.deep },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: B.badge, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: B.white },
  quickSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: B.subtitle, marginTop: 3 },
  card: { backgroundColor: B.white, borderRadius: 8, padding: 18, borderWidth: 1, borderColor: B.border, gap: 10 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: B.text },
  benefit: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  benefitText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: B.text },
  h1: { fontFamily: 'Inter_700Bold', fontSize: 22, color: B.text, textAlign: 'left' },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: B.muted, lineHeight: 19 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: B.text },
  input: { borderWidth: 1, borderColor: B.border, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16, fontFamily: 'Inter_400Regular', color: B.text },
  err: { color: B.red, fontFamily: 'Inter_400Regular', fontSize: 12 },
  btn: { backgroundColor: B.blue, minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnOutline: { borderWidth: 1.5, borderColor: B.blue, minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 14 },
  alert: { flexDirection: 'row', gap: 8, backgroundColor: B.redBg, borderRadius: 12, padding: 12 },
  alertText: { flex: 1, color: B.red, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  info: { flexDirection: 'row', gap: 8, backgroundColor: B.light, borderRadius: 12, padding: 12 },
  infoText: { flex: 1, color: B.text, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  link: { color: B.blue, fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' },
  banner: { borderRadius: 8, padding: 18, gap: 4 },
  bannerText: { color: B.white, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  tabs: { gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: B.white, borderWidth: 1, borderColor: B.border },
  tabOn: { backgroundColor: B.blue, borderColor: B.blue },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: B.text },
  pkg: { flexDirection: 'row', gap: 12, backgroundColor: B.white, borderRadius: 8, padding: 16, borderWidth: 1.5, borderColor: B.border },
  pkgOn: { borderColor: B.blue, backgroundColor: B.selected },
  pkgLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: B.deep, alignItems: 'center', justifyContent: 'center' },
  pkgLogoText: { color: B.white, fontFamily: 'Inter_700Bold', fontStyle: 'italic', fontSize: 12 },
  pkgName: { fontFamily: 'Inter_700Bold', fontSize: 15, color: B.text },
  pkgDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: B.muted, marginTop: 3, lineHeight: 17 },
  price: { fontFamily: 'Inter_700Bold', fontSize: 17, color: B.blue, marginTop: 8 },
  per: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  source: { fontFamily: 'Inter_400Regular', fontSize: 11, color: B.muted, textAlign: 'center' },
  section: { fontFamily: 'Inter_700Bold', fontSize: 15, color: B.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowK: { fontFamily: 'Inter_400Regular', fontSize: 13, color: B.muted },
  rowV: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: B.text, flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: B.border },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 26, backgroundColor: B.white, borderTopWidth: 1, borderTopColor: B.border, gap: 8 },
  secure: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11, color: B.muted },
  resultTop: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  resultIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: B.blue, alignItems: 'center', justifyContent: 'center' },
});
