import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
const HERO = require('../src/assets/dstv-hero.png');
import { formatGhs, loadHomeData } from '@/lib/topflex';
import { DstvHelp, dstvColors as B } from '@/components/DstvHelp';

// Ghana decoder package prices published on dstv.com/en-gh (checked Oct 2026).
// Replace with the provider API price list once a DStv/MultiChoice integration is connected.
const PRICE_SOURCE = 'Prices from dstv.com/en-gh, Oct 2026';
type Category = 'all' | 'sports' | 'movies' | 'entertainment';
const PACKAGES = [
  { id: 'padi', name: 'DStv Padi', price: 58, desc: 'Local content on Akwaaba Magic Abusua, drama series, soaps and international news.', tags: ['entertainment'] },
  { id: 'access', name: 'DStv Access', price: 98, desc: 'Africa Magic Epic and M-Net Movies, selected Premier League matches, kids channels.', tags: ['movies', 'sports', 'entertainment'] },
  { id: 'family', name: 'DStv Family', price: 188, desc: 'Entertainment for the whole family, lifestyle, music and selected Premier League matches.', tags: ['entertainment', 'sports'] },
  { id: 'compact', name: 'DStv Compact', price: 375, desc: 'Premier League, FA Cup, Carabao Cup, international movies and series, all kids channels.', tags: ['sports', 'movies', 'entertainment'] },
  { id: 'compact-plus', name: 'DStv Compact Plus', price: 563, desc: 'Champions League football, UFC & NBA, documentaries, international series and movies.', tags: ['sports', 'movies', 'entertainment'] },
  { id: 'premium', name: 'DStv Premium', price: 854, desc: 'Latest blockbuster movies, award-winning series and the complete SuperSport offering.', tags: ['sports', 'movies', 'entertainment'] },
];
type Step = 'home' | 'manage' | 'verify' | 'packages' | 'confirm' | 'result' | 'help';

function Logo({ size = 26 }: { size?: number }) {
  return <Text style={{ color: B.white, fontFamily: 'Inter_700Bold', fontSize: size, fontStyle: 'italic', letterSpacing: -1 }}>DStv</Text>;
}

export default function DstvScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('home');
  const [card, setCard] = useState('');
  const [verify, setVerify] = useState<'idle' | 'loading' | 'invalid' | 'unavailable'>('idle');
  const [cat, setCat] = useState<Category>('all');
  const [pkg, setPkg] = useState<string | null>(null);
  const [method, setMethod] = useState<'wallet' | 'momo'>('wallet');
  const [paying, setPaying] = useState(false);
  const { data } = useQuery({ queryKey: ['home'], queryFn: loadHomeData });
  const selected = PACKAGES.find((p) => p.id === pkg);
  const back = () => (step === 'home' ? router.back() : setStep(step === 'confirm' ? 'packages' : step === 'result' ? 'confirm' : 'home'));

  const runVerify = () => {
    const digits = card.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 12) return setVerify('invalid');
    setVerify('loading');
    // No authorized DStv verification service is connected, so no account can be confirmed.
    setTimeout(() => setVerify('unavailable'), 900);
  };
  const [action, setAction] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const runAction = (name: string) => {
    const digits = card.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 12) { setVerify('invalid'); return; }
    setActionBusy(true); setAction(null);
    // No authorized DStv service is connected, so no account request can actually be sent.
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
              <Image source={HERO} resizeMode="contain" style={styles.heroImg} accessibilityLabel="DStv sports, movies and family shows" />
              <LinearGradient colors={[B.deep, 'rgba(0,30,90,0.6)', 'rgba(0,30,90,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
              <Logo size={40} />
              <Text style={styles.heroTitle}>DStv Subscriptions</Text>
              <Text style={styles.heroText}>Manage your account and enjoy uninterrupted entertainment.</Text>
            </LinearGradient>
            <Pressable onPress={() => { setAction(null); setStep('manage'); }} style={styles.manage}>
              <Ionicons name="tv-outline" size={26} color={B.white} />
              <View style={{ flex: 1 }}><Text style={styles.manageTitle}>Manage My Account</Text><Text style={styles.manageText}>Check your account and fix decoder errors.</Text></View>
              <Ionicons name="chevron-forward" size={20} color={B.white} />
            </Pressable>
            <View style={styles.quickList}>
              {([['refresh-outline', 'Renew Subscription', 'Verify your smartcard to renew.', () => setStep('verify')], ['albums-outline', 'View Packages', 'Compare channels and monthly prices.', () => setStep('packages')], ['help-buoy-outline', 'Get Help', 'DStv guides, FAQs and TopFlex support.', () => setStep('help')]] as const).map(([icon, label, sub, fn]) => (
                <Pressable key={label} accessibilityRole="button" onPress={fn} style={({ pressed }) => [styles.quickRow, pressed && styles.quickRowPressed]}>
                  <View style={styles.quickIcon}><Ionicons name={icon} size={22} color={B.white} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{label}</Text><Text style={styles.quickSub}>{sub}</Text></View>
                  <Ionicons name="chevron-forward" size={19} color={B.white} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 'help' && <DstvHelp />}

        {step === 'manage' && (
          <>
            <Text style={styles.h1}>Manage My Account</Text>
            <Text style={styles.sub}>Enter your smartcard number, then choose what you need.</Text>
            <View style={styles.card}>
              <Text style={styles.label} nativeID="msmart">Smartcard Number</Text>
              <TextInput accessibilityLabelledBy="msmart" value={card} onChangeText={(t) => { setCard(t.replace(/[^\d ]/g, '')); setVerify('idle'); setAction(null); }} keyboardType="number-pad" maxLength={15} placeholder="e.g. 1234 5678 9012" placeholderTextColor={B.muted} style={[styles.input, verify === 'invalid' && { borderColor: B.red }]} />
              {verify === 'invalid' && <Text style={styles.err}>Enter a valid 10–12 digit smartcard number.</Text>}
            </View>
            <View style={styles.quickList}>
              {([['person-circle-outline', 'Account Status', 'See your package and due date.'], ['flash-outline', 'Clear Error E16', 'Channels scrambled after renewing.'], ['card-outline', 'Clear Error E32', 'Smartcard or decoder not activated.'], ['radio-outline', 'Refresh Signal', 'Reconnect your decoder to DStv.']] as const).map(([icon, label, sub]) => (
                <Pressable key={label} accessibilityRole="button" disabled={actionBusy} onPress={() => runAction(label)} style={({ pressed }) => [styles.quickRow, pressed && styles.quickRowPressed]}>
                  <View style={styles.quickIcon}><Ionicons name={icon} size={22} color={B.white} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.quickTitle}>{label}</Text><Text style={styles.quickSub}>{sub}</Text></View>
                  <Ionicons name="chevron-forward" size={19} color={B.white} />
                </Pressable>
              ))}
            </View>
            {actionBusy && <ActivityIndicator color={B.blue} />}
            {action && (
              <View style={styles.alert}><Ionicons name="cloud-offline-outline" size={18} color={B.red} /><Text style={styles.alertText}>{action} isn't available yet — TopFlex isn't connected to a DStv account service. Nothing was sent to your decoder.</Text></View>
            )}
            <Pressable onPress={() => setStep('verify')}><Text style={styles.link}>Renew subscription instead</Text></Pressable>
          </>
        )}

        {step === 'verify' && (
          <>
            <Text style={styles.h1}>Renew Your Subscription</Text>
            <Text style={styles.sub}>Enter your smartcard number to get started.</Text>
            <View style={styles.card}>
              <Text style={styles.label} nativeID="smartcard">Smartcard Number</Text>
              <TextInput accessibilityLabelledBy="smartcard" value={card} onChangeText={(t) => { setCard(t.replace(/[^\d ]/g, '')); setVerify('idle'); }} keyboardType="number-pad" maxLength={15} placeholder="e.g. 1234 5678 9012" placeholderTextColor={B.muted} style={[styles.input, verify === 'invalid' && { borderColor: B.red }]} />
              {verify === 'invalid' && <Text style={styles.err}>Enter a valid 10–12 digit smartcard number.</Text>}
              <Pressable disabled={verify === 'loading'} onPress={runVerify} style={[styles.btn, verify === 'loading' && { opacity: 0.7 }]}>
                {verify === 'loading' ? <ActivityIndicator color={B.white} /> : <Text style={styles.btnText}>Verify Account</Text>}
              </Pressable>
              {verify === 'unavailable' && (
                <View style={styles.alert}><Ionicons name="cloud-offline-outline" size={18} color={B.red} /><Text style={styles.alertText}>Account verification isn't available yet — TopFlex isn't connected to a DStv account service. Your account was not checked.</Text></View>
              )}
              <View style={styles.info}><Ionicons name="information-circle" size={18} color={B.blue} /><Text style={styles.infoText}>Find your smartcard number on the back of your decoder card, on your DStv account, or press the Info button on your remote.</Text></View>
            </View>
            <Pressable onPress={() => setStep('packages')}><Text style={styles.link}>Browse DStv packages</Text></Pressable>
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
                  <View style={styles.pkgLogo}><Text style={styles.pkgLogoText}>DStv</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pkgName}>{p.name}</Text>
                    <Text style={styles.pkgDesc}>{p.desc}</Text>
                    <Text style={styles.price}>GH₵ {p.price}<Text style={styles.per}> / month</Text></Text>
                  </View>
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? B.blue : B.border} />
                </Pressable>
              );
            })}
            <Text style={styles.source}>{PRICE_SOURCE}. Final price is confirmed by DStv at payment.</Text>
          </>
        )}

        {step === 'confirm' && selected && (
          <>
            <Text style={styles.h1}>Confirm & Pay</Text>
            <Text style={styles.sub}>Review your details before you make payment.</Text>
            <View style={styles.card}>
              <Row k="Package" v={selected.name} />
              <Row k="Subscription" v={`GH₵ ${selected.price.toFixed(2)} / month`} />
              <Row k="Smartcard Number" v={card.trim() || 'Not verified'} />
              <Row k="Fees" v="GH₵ 0.00" />
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
              <Text style={[styles.sub, { textAlign: 'center' }]}>No payment was taken and your subscription was not changed. DStv renewals will open once TopFlex connects to an authorized DStv service.</Text></View>
            <View style={styles.card}><Row k="Package" v={selected.name} /><Row k="Amount" v={`GH₵ ${selected.price.toFixed(2)}`} /><Row k="Smartcard Number" v={card.trim() || 'Not verified'} /><Row k="Status" v="Not processed" /></View>
            <Pressable onPress={() => setStep('home')} style={styles.btn}><Text style={styles.btnText}>Back to DStv</Text></Pressable>
            <Pressable onPress={() => router.push('/(tabs)/transactions')} style={styles.btnOutline}><Text style={[styles.btnText, { color: B.blue }]}>View Transactions</Text></Pressable>
          </>
        )}
      </ScrollView>

      {step === 'packages' && (
        <View style={styles.sticky}><Pressable disabled={!selected} onPress={() => setStep('confirm')} style={[styles.btn, !selected && { opacity: 0.5 }]}><Text style={styles.btnText}>{selected ? `Continue with ${selected.name}` : 'Select a package'}</Text></Pressable></View>
      )}
      {step === 'confirm' && selected && (
        <View style={styles.sticky}><Pressable disabled={paying} onPress={pay} style={[styles.btn, paying && { opacity: 0.7 }]}>{paying ? <ActivityIndicator color={B.white} /> : <Text style={styles.btnText}>Confirm and Pay GH₵ {selected.price.toFixed(2)}</Text>}</Pressable>
          <Text style={styles.secure}><Ionicons name="lock-closed" size={11} /> Secure payment powered by TopFlex</Text></View>
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
  hero: { borderRadius: 22, padding: 22, minHeight: 210, backgroundColor: B.deep, justifyContent: 'flex-end', overflow: 'hidden' },
  heroImg: { position: 'absolute', right: -20, bottom: 0, width: '78%', height: '100%' },
  heroTitle: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 24, marginTop: 10 },
  heroText: { color: '#cfe0ff', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6, lineHeight: 19, maxWidth: '62%' },
  manage: { backgroundColor: B.blue, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: B.blue, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  manageTitle: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 16 },
  manageText: { color: '#d6e4ff', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  quickList: { gap: 10 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: B.blue, borderRadius: 18, padding: 16, shadowColor: B.blue, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  quickRowPressed: { backgroundColor: B.deep },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: B.white },
  quickSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#d6e4ff', marginTop: 3 },
  card: { backgroundColor: B.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: B.border, gap: 10 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: B.text },
  benefit: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  benefitText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: B.text },
  h1: { fontFamily: 'Inter_700Bold', fontSize: 22, color: B.text, textAlign: 'left' },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: B.muted, lineHeight: 19 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: B.text },
  input: { borderWidth: 1, borderColor: B.border, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 16, fontFamily: 'Inter_400Regular', color: B.text },
  err: { color: B.red, fontFamily: 'Inter_400Regular', fontSize: 12 },
  btn: { backgroundColor: B.blue, minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnOutline: { borderWidth: 1.5, borderColor: B.blue, minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 14 },
  alert: { flexDirection: 'row', gap: 8, backgroundColor: B.redBg, borderRadius: 12, padding: 12 },
  alertText: { flex: 1, color: B.red, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  info: { flexDirection: 'row', gap: 8, backgroundColor: B.light, borderRadius: 12, padding: 12 },
  infoText: { flex: 1, color: B.text, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  link: { color: B.blue, fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' },
  banner: { borderRadius: 18, padding: 18, gap: 4 },
  bannerText: { color: B.white, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  tabs: { gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: B.white, borderWidth: 1, borderColor: B.border },
  tabOn: { backgroundColor: B.blue, borderColor: B.blue },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: B.text },
  pkg: { flexDirection: 'row', gap: 12, backgroundColor: B.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: B.border },
  pkgOn: { borderColor: B.blue, backgroundColor: '#f5f9ff' },
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
