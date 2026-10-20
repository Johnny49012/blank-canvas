import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, ImageSourcePropType, ImageStyle, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { formatGhs, loadHomeData } from '@/lib/topflex';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { TvTheme } from '@/constants/tv-themes';
import { AnimatedPrice, Marquee, PopCheck, PressScale, Reveal, ShineSweep, SignalRings, USE_NATIVE } from './motion';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type TvCategory = 'sports' | 'movies' | 'entertainment';
export type TvPackage = { id: string; name: string; price: number; desc: string; tags: TvCategory[] };
type Filter = 'all' | TvCategory;
type Step = 'home' | 'manage' | 'verify' | 'packages' | 'confirm' | 'result' | 'help';

export type TvConfig = {
  theme: TvTheme;
  /** Optional official logo file. Falls back to the text wordmark until an approved asset is added. */
  logo?: ImageSourcePropType;
  wordmark: string;
  /** Index where the accent colour starts in the wordmark (GOtv: 2 -> "GO" accent, "tv" white). */
  wordmarkSplit?: number;
  wordmarkSpacing: number;
  hero: ImageSourcePropType;
  heroAlt: string;
  heroFit: 'cover' | 'contain';
  heroImageStyle: StyleProp<ImageStyle>;
  heroTitle: string;
  heroText: string;
  ticker: readonly string[];
  idLabel: string;
  idPlaceholder: string;
  idMaxLength: number;
  idMinDigits: number;
  idMaxDigits: number;
  idError: string;
  idInfo: string;
  manageSub: string;
  verifySub: string;
  renewSub: string;
  helpSub: string;
  manageActions: ReadonlyArray<{ icon: IconName; label: string; sub: string }>;
  /** 0 = unavailable result is shown immediately; >0 = spinner for that many ms first. */
  verifyDelayMs: number;
  packages: TvPackage[];
  priceSource: string;
  priceNote: string;
  /** 'confirm' goes package -> confirm & pay; 'verify' goes package -> verify account. */
  packagesFlow: 'confirm' | 'verify';
  packagesCtaLabel: (name: string) => string;
  feesValue: string;
  Help: React.ComponentType;
};

const EXPLORE: ReadonlyArray<{ id: TvCategory; label: string; icon: IconName }> = [
  { id: 'sports', label: 'Sports', icon: 'football-outline' },
  { id: 'movies', label: 'Movies', icon: 'film-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'tv-outline' },
];
const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All Packages' }, { id: 'sports', label: 'Sports' }, { id: 'movies', label: 'Movies' }, { id: 'entertainment', label: 'Entertainment' },
];
const TAG_ICON: Record<TvCategory, IconName> = { sports: 'football-outline', movies: 'film-outline', entertainment: 'tv-outline' };

export function TvServiceScreen({ cfg }: { cfg: TvConfig }) {
  const T = cfg.theme;
  const s = useMemo(() => makeStyles(T), [T]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const reduce = useReducedMotion();

  const [step, setStep] = useState<Step>('home');
  const [card, setCard] = useState('');
  const [verify, setVerify] = useState<'idle' | 'loading' | 'invalid' | 'unavailable'>('idle');
  const [cat, setCat] = useState<Filter>('all');
  const [pkg, setPkg] = useState<string | null>(null);
  const [method, setMethod] = useState<'wallet' | 'momo'>('wallet');
  const [paying, setPaying] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const { data } = useQuery({ queryKey: ['home'], queryFn: loadHomeData });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [step]);

  const selected = cfg.packages.find((p) => p.id === pkg);
  const list = cfg.packages.filter((p) => cat === 'all' || p.tags.includes(cat));
  const lowest = list.length > 1 ? Math.min(...list.map((p) => p.price)) : -1;
  const back = () => (step === 'home' ? router.back() : setStep(step === 'confirm' ? 'packages' : step === 'result' ? 'confirm' : 'home'));

  const validId = () => { const n = card.replace(/\D/g, '').length; return n >= cfg.idMinDigits && n <= cfg.idMaxDigits; };
  const onId = (t: string) => { setCard(t.replace(/[^\d ]/g, '')); setVerify('idle'); setAction(null); };
  const runVerify = () => {
    if (!validId()) { setVerify('invalid'); return; }
    // No authorized provider verification service is connected, so no account can be confirmed.
    if (cfg.verifyDelayMs === 0) { setVerify('unavailable'); return; }
    setVerify('loading');
    later(() => setVerify('unavailable'), cfg.verifyDelayMs);
  };
  const runAction = (name: string) => {
    if (!validId()) { setVerify('invalid'); return; }
    setActionBusy(true); setAction(null);
    // No authorized provider service is connected, so no account request can actually be sent.
    later(() => { setActionBusy(false); setAction(name); }, 900);
  };
  const pay = () => {
    if (paying) return;
    setPaying(true);
    later(() => { setPaying(false); setStep('result'); }, 900);
  };

  const Help = cfg.Help;
  const topPad = Math.max(insets.top, 16) + 10;
  const bottomPad = Math.max(insets.bottom, 12) + 12;

  const header = (
    <View>
      <LinearGradient colors={[T.navy, T.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.header, { paddingTop: topPad }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} hitSlop={14} style={s.iconBtn}><Ionicons name="arrow-back" size={22} color={T.white} /></Pressable>
        <Logo cfg={cfg} size={26} />
        <Pressable accessibilityRole="button" accessibilityLabel="Get help" onPress={() => setStep('help')} hitSlop={14} style={s.iconBtn}><Ionicons name="headset-outline" size={22} color={T.white} /></Pressable>
      </LinearGradient>
      <View style={s.headerLine} />
    </View>
  );

  const home = (
    <View style={s.stack}>
      <View style={[s.hero, wide && s.heroWide]}>
        <LinearGradient colors={[T.navy, T.deep, T.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <HeroImage cfg={cfg} scrollY={scrollY} reduce={reduce} />
        <LinearGradient colors={[T.deep, T.heroTint, T.transparent]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.38)']} style={StyleSheet.absoluteFill} />
        <SignalRings color={T.glow} size={wide ? 360 : 250} style={{ position: 'absolute', right: -80, top: -80 }} />
        <Reveal><Logo cfg={cfg} size={40} /></Reveal>
        <Reveal delay={110}><Text style={[s.heroTitle, wide && { fontSize: 34 }]}>{cfg.heroTitle}</Text></Reveal>
        <Reveal delay={200}><Text style={[s.heroText, wide && { maxWidth: 460 }]}>{cfg.heroText}</Text></Reveal>
        <Reveal delay={290}>
          <View style={s.pill}><Ionicons name="information-circle-outline" size={14} color={T.white} /><Text style={s.pillText}>Renewals and account tools aren't available yet</Text></View>
        </Reveal>
        <Reveal delay={380} style={s.heroActions}>
          <TvButton T={T} tone="accent" label="Explore packages" icon="albums-outline" grow onPress={() => setStep('packages')} />
          <TvButton T={T} tone="ghost" label="Renew" icon="refresh-outline" grow onPress={() => setStep('verify')} />
        </Reveal>
      </View>

      <Reveal delay={150}><Marquee items={cfg.ticker} bg={T.deep} color={T.white} dot={T.line} radius={T.radius.chip} /></Reveal>

      <Reveal delay={220}><Text style={s.sectionTitle}>Explore by what you love</Text></Reveal>
      <Reveal delay={260} style={s.tiles}>
        {EXPLORE.map((c) => (
          <PressScale key={c.id} accessibilityRole="button" accessibilityLabel={`Browse ${c.label} packages`} containerStyle={{ flex: 1 }} style={s.tile} onPress={() => { setCat(c.id); setStep('packages'); }}>
            <LinearGradient colors={[T.primary, T.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={s.tileIcon}><Ionicons name={c.icon} size={22} color={T.white} /></View>
            <Text style={s.tileLabel} numberOfLines={1}>{c.label}</Text>
            <Text style={s.tileHint}>Browse</Text>
          </PressScale>
        ))}
      </Reveal>

      <Reveal delay={330}>
        <PressScale accessibilityRole="button" accessibilityLabel="Manage My Account. Check your account and fix decoder errors." style={s.manage} onPress={() => { setAction(null); setStep('manage'); }}>
          <LinearGradient colors={[T.primary, T.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Ionicons name="tv-outline" size={26} color={T.white} />
          <View style={{ flex: 1 }}><Text style={s.manageTitle}>Manage My Account</Text><Text style={s.manageText}>Check your account and fix decoder errors.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={T.white} />
        </PressScale>
      </Reveal>
      <View style={s.quickList}>
        {([['refresh-outline', 'Renew Subscription', cfg.renewSub, () => setStep('verify')], ['albums-outline', 'View Packages', 'Compare channels and monthly prices.', () => setStep('packages')], ['help-buoy-outline', 'Get Help', cfg.helpSub, () => setStep('help')]] as const).map(([icon, label, sub, fn], i) => (
          <Reveal key={label} delay={400 + i * 80}><QuickRow s={s} T={T} icon={icon} label={label} sub={sub} onPress={fn} /></Reveal>
        ))}
      </View>
    </View>
  );

  const body = (() => {
    switch (step) {
      case 'help': return <Help />;
      case 'manage': return (
        <>
          <Text style={s.h1}>Manage My Account</Text>
          <Text style={s.sub}>{cfg.manageSub}</Text>
          <View style={s.card}>
            <Text style={s.label} nativeID="msmart">{cfg.idLabel}</Text>
            <IdField s={s} T={T} cfg={cfg} nativeID="msmart" value={card} onChange={onId} invalid={verify === 'invalid'} />
            {verify === 'invalid' && <Text style={s.err} accessibilityLiveRegion="polite">{cfg.idError}</Text>}
          </View>
          <View style={s.quickList}>
            {cfg.manageActions.map((a) => <QuickRow key={a.label} s={s} T={T} icon={a.icon} label={a.label} sub={a.sub} disabled={actionBusy} onPress={() => runAction(a.label)} />)}
          </View>
          {actionBusy && <ActivityIndicator color={T.primary} />}
          {action && <Notice s={s} T={T} text={`${action} isn't available yet — TopFlex isn't connected to a ${T.name} account service. Nothing was sent to your decoder.`} />}
          <Pressable accessibilityRole="link" onPress={() => setStep('verify')} style={s.linkBtn}><Text style={s.link}>Renew subscription instead</Text></Pressable>
        </>
      );
      case 'verify': return (
        <>
          <Text style={s.h1}>Renew Your Subscription</Text>
          <Text style={s.sub}>{cfg.verifySub}</Text>
          <View style={s.card}>
            <Text style={s.label} nativeID="verifyId">{cfg.idLabel}</Text>
            <IdField s={s} T={T} cfg={cfg} nativeID="verifyId" value={card} onChange={onId} invalid={verify === 'invalid'} />
            {verify === 'invalid' && <Text style={s.err} accessibilityLiveRegion="polite">{cfg.idError}</Text>}
            <TvButton T={T} tone="solid" label="Verify Account" busy={verify === 'loading'} onPress={runVerify} />
            {verify === 'unavailable' && <Notice s={s} T={T} text={`Account verification isn't available yet — TopFlex isn't connected to a ${T.name} account service. Your account was not checked.`} />}
            <View style={s.info}><Ionicons name="information-circle" size={18} color={T.primary} /><Text style={s.infoText}>{cfg.idInfo}</Text></View>
          </View>
          <Pressable accessibilityRole="link" onPress={() => setStep('packages')} style={s.linkBtn}><Text style={s.link}>Browse {T.name} packages</Text></Pressable>
        </>
      );
      case 'packages': return (
        <>
          <View style={s.banner}>
            <LinearGradient colors={[T.deep, T.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <SignalRings color={T.glow} size={200} style={{ position: 'absolute', right: -50, top: -60 }} />
            <Logo cfg={cfg} size={28} />
            <Text style={s.bannerText}>More Channels. More Entertainment.</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
            {FILTERS.map((f) => (
              <PressScale key={f.id} accessibilityRole="tab" accessibilityState={{ selected: cat === f.id }} onPress={() => setCat(f.id)} style={[s.tab, cat === f.id && s.tabOn]}>
                <Text style={[s.tabText, cat === f.id && { color: T.white }]}>{f.label}</Text>
              </PressScale>
            ))}
          </ScrollView>
          <View style={s.grid} accessibilityRole="radiogroup">
            {list.map((p, i) => {
              const on = pkg === p.id;
              return (
                <Reveal key={p.id} delay={Math.min(i, 5) * 70} style={wide ? s.gridItemWide : s.gridItem}>
                  <PressScale accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${p.name}, ${p.price} cedis per month. ${p.desc}`} onPress={() => setPkg(p.id)} style={[s.pkg, on && s.pkgOn]}>
                    <View style={s.pkgHead}>
                      <View style={s.pkgLogo}><Text style={s.pkgLogoText}>{T.name}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.pkgName}>{p.name}</Text>
                        <View style={s.chips}>{p.tags.map((t) => <View key={t} style={s.chip}><Ionicons name={TAG_ICON[t]} size={11} color={T.primary} /><Text style={s.chipText}>{t[0].toUpperCase() + t.slice(1)}</Text></View>)}</View>
                      </View>
                      <PopCheck on={on} color={T.primary} border={T.border} />
                    </View>
                    <Text style={s.pkgDesc}>{p.desc}</Text>
                    <View style={s.priceRow}>
                      <AnimatedPrice value={p.price} style={s.price}><Text style={s.per}> / month</Text></AnimatedPrice>
                      {p.price === lowest && <View style={s.lowest}><Text style={s.lowestText}>Lowest price</Text></View>}
                    </View>
                  </PressScale>
                </Reveal>
              );
            })}
          </View>
          <Text style={s.source}>{cfg.priceSource}. {cfg.priceNote}</Text>
        </>
      );
      case 'confirm': return selected ? (
        <>
          <Text style={s.h1}>Confirm & Pay</Text>
          <Text style={s.sub}>Review your details before you make payment.</Text>
          <View style={s.card}>
            <Row s={s} T={T} k="Package" v={selected.name} />
            <Row s={s} T={T} k="Subscription" v={`GH₵ ${selected.price.toFixed(2)} / month`} />
            <Row s={s} T={T} k={cfg.idLabel} v={card.trim() || 'Not verified'} />
            <Row s={s} T={T} k="Fees" v={cfg.feesValue} />
            <View style={s.divider} />
            <Row s={s} T={T} k="Total" v={`GH₵ ${selected.price.toFixed(2)}`} bold />
          </View>
          <Text style={s.section}>Select Payment Method</Text>
          {([['wallet', 'wallet-outline', 'TopFlex Wallet', data?.wallet ? `Available: ${formatGhs(data.wallet.balance)}` : 'Your TopFlex balance'], ['momo', 'phone-portrait-outline', 'Mobile Money', 'MTN, Telecel, AirtelTigo']] as const).map(([id, icon, t, d]) => (
            <PressScale key={id} accessibilityRole="radio" accessibilityState={{ checked: method === id }} onPress={() => setMethod(id)} style={[s.pkg, method === id && s.pkgOn, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <Ionicons name={icon} size={22} color={T.primary} />
              <View style={{ flex: 1 }}><Text style={s.pkgName}>{t}</Text><Text style={s.pkgDesc}>{d}</Text></View>
              <PopCheck on={method === id} color={T.primary} border={T.border} />
            </PressScale>
          ))}
        </>
      ) : null;
      case 'result': return selected ? (
        <>
          <View style={s.resultTop}>
            <View style={s.resultIcon}><Ionicons name="time-outline" size={40} color={T.white} /></View>
            <Text style={s.h1}>Renewal not available yet</Text>
            <Text style={[s.sub, { textAlign: 'center' }]}>No payment was taken and your subscription was not changed. {T.name} renewals will open once TopFlex connects to an authorized {T.name} service.</Text>
          </View>
          <View style={s.card}>
            <Row s={s} T={T} k="Package" v={selected.name} />
            <Row s={s} T={T} k="Amount" v={`GH₵ ${selected.price.toFixed(2)}`} />
            <Row s={s} T={T} k={cfg.idLabel} v={card.trim() || 'Not verified'} />
            <Row s={s} T={T} k="Status" v="Not processed" />
          </View>
          <TvButton T={T} tone="solid" label={`Back to ${T.name}`} onPress={() => setStep('home')} />
          <TvButton T={T} tone="outline" label="View Transactions" onPress={() => router.push('/(tabs)/transactions')} />
        </>
      ) : null;
      default: return null;
    }
  })();

  return (
    <View style={s.screen}>
      {header}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: USE_NATIVE })}
        scrollEventThrottle={16}
        contentContainerStyle={s.content}
      >
        {step === 'home' ? home : <Reveal key={step} style={s.stack}>{body}</Reveal>}
      </Animated.ScrollView>

      {step === 'packages' && (
        <View style={[s.sticky, { paddingBottom: bottomPad }]}>
          <TvButton
            T={T} tone="solid" disabled={!selected}
            label={selected ? cfg.packagesCtaLabel(selected.name) : 'Select a package'}
            onPress={() => { if (cfg.packagesFlow === 'confirm') setStep('confirm'); else { setVerify('idle'); setStep('verify'); } }}
          />
        </View>
      )}
      {step === 'confirm' && selected && (
        <View style={[s.sticky, { paddingBottom: bottomPad }]}>
          <TvButton T={T} tone="solid" busy={paying} label={`Confirm and Pay GH₵ ${selected.price.toFixed(2)}`} onPress={pay} />
          <Text style={s.secure}><Ionicons name="lock-closed" size={11} /> Payments are not available yet</Text>
        </View>
      )}
    </View>
  );
}

function Logo({ cfg, size }: { cfg: TvConfig; size: number }) {
  const T = cfg.theme;
  if (cfg.logo) return <Image source={cfg.logo} resizeMode="contain" accessibilityLabel={T.name} style={{ height: size * 1.1, width: size * 3.2 }} />;
  const base = { fontFamily: 'Inter_700Bold', fontSize: size, fontStyle: 'italic' as const, letterSpacing: cfg.wordmarkSpacing };
  const k = cfg.wordmarkSplit;
  return (
    <Text accessibilityLabel={T.name} style={[base, { color: T.white }]}>
      {k ? <Text style={{ color: T.accent }}>{cfg.wordmark.slice(0, k)}</Text> : null}
      {k ? cfg.wordmark.slice(k) : cfg.wordmark}
    </Text>
  );
}

/** Slow zoom (Ken Burns) plus a gentle scroll parallax on the hero image. */
function HeroImage({ cfg, scrollY, reduce }: { cfg: TvConfig; scrollY: Animated.Value; reduce: boolean }) {
  const kb = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { kb.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(kb, { toValue: 1, duration: 16000, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE }),
      Animated.timing(kb, { toValue: 0, duration: 16000, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduce, kb]);
  const scale = kb.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1.18] });
  const ty = scrollY.interpolate({ inputRange: [0, 400], outputRange: [0, 12], extrapolate: 'clamp' });
  return <Animated.Image source={cfg.hero} resizeMode={cfg.heroFit} accessibilityLabel={cfg.heroAlt} style={[cfg.heroImageStyle, { transform: [{ translateY: ty }, { scale }] }]} />;
}

type Styles = ReturnType<typeof makeStyles>;

function TvButton({ T, label, onPress, tone = 'solid', disabled, busy, icon, grow }: { T: TvTheme; label: string; onPress: () => void; tone?: 'solid' | 'accent' | 'ghost' | 'outline'; disabled?: boolean; busy?: boolean; icon?: IconName; grow?: boolean }) {
  const [w, setW] = useState(0);
  const p = tone === 'accent' ? { bg: T.accent, fg: T.accentText, bd: T.accent }
    : tone === 'ghost' ? { bg: 'rgba(255,255,255,0.14)', fg: T.white, bd: 'rgba(255,255,255,0.6)' }
    : tone === 'outline' ? { bg: 'transparent', fg: T.primary, bd: T.primary }
    : { bg: T.primary, fg: T.white, bd: T.primary };
  const off = !!disabled || !!busy;
  return (
    <PressScale
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: off, busy: !!busy }}
      disabled={off} onPress={onPress} containerStyle={grow ? { flex: 1 } : undefined}
      style={{ backgroundColor: p.bg, borderColor: p.bd, borderWidth: 1.5, borderRadius: T.radius.button, minHeight: 50, overflow: 'hidden', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, minHeight: 47 }}>
        {busy ? <ActivityIndicator color={p.fg} /> : (<>{icon && <Ionicons name={icon} size={18} color={p.fg} />}<Text style={{ color: p.fg, fontFamily: 'Inter_700Bold', fontSize: 14 }}>{label}</Text></>)}
      </View>
      {tone !== 'outline' && !off && <ShineSweep width={w} />}
    </PressScale>
  );
}

function QuickRow({ s, T, icon, label, sub, onPress, disabled }: { s: Styles; T: TvTheme; icon: IconName; label: string; sub: string; onPress: () => void; disabled?: boolean }) {
  return (
    <PressScale accessibilityRole="button" accessibilityLabel={`${label}. ${sub}`} disabled={disabled} onPress={onPress} style={s.quickRow}>
      <LinearGradient colors={[T.primary, T.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={s.quickIcon}><Ionicons name={icon} size={22} color={T.white} /></View>
      <View style={{ flex: 1 }}><Text style={s.quickTitle}>{label}</Text><Text style={s.quickSub}>{sub}</Text></View>
      <Ionicons name="chevron-forward" size={19} color={T.white} />
    </PressScale>
  );
}

function IdField({ s, T, cfg, nativeID, value, onChange, invalid }: { s: Styles; T: TvTheme; cfg: TvConfig; nativeID: string; value: string; onChange: (t: string) => void; invalid: boolean }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      accessibilityLabelledBy={nativeID} value={value} onChangeText={onChange} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      keyboardType="number-pad" maxLength={cfg.idMaxLength} placeholder={cfg.idPlaceholder} placeholderTextColor={T.muted}
      style={[s.input, focus && { borderColor: T.primary, borderWidth: 2 }, invalid && { borderColor: T.red }]}
    />
  );
}

function Notice({ s, T, text }: { s: Styles; T: TvTheme; text: string }) {
  return <View style={s.alert} accessibilityLiveRegion="polite"><Ionicons name="cloud-offline-outline" size={18} color={T.red} /><Text style={s.alertText}>{text}</Text></View>;
}

function Row({ s, T, k, v, bold }: { s: Styles; T: TvTheme; k: string; v: string; bold?: boolean }) {
  return <View style={s.row}><Text style={s.rowK}>{k}</Text><Text style={[s.rowV, bold && { fontSize: 16, color: T.primary }]}>{v}</Text></View>;
}

const makeStyles = (T: TvTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  header: { paddingBottom: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLine: { height: 3, backgroundColor: T.line },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 150, maxWidth: 960, width: '100%', alignSelf: 'center' },
  stack: { gap: 14 },
  hero: { borderRadius: T.radius.hero, padding: 22, minHeight: 300, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: T.deep },
  heroWide: { minHeight: 380, padding: 36 },
  heroTitle: { color: T.white, fontFamily: 'Inter_700Bold', fontSize: 26, marginTop: 10 },
  heroText: { color: T.subtitle, fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 6, lineHeight: 20, maxWidth: '78%' },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 12 },
  pillText: { color: T.white, fontFamily: 'Inter_500Medium', fontSize: 11 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 14, maxWidth: 460 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: T.text, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { borderRadius: T.radius.card, padding: 14, minHeight: 112, justifyContent: 'flex-end', overflow: 'hidden', gap: 2 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  tileLabel: { color: T.white, fontFamily: 'Inter_700Bold', fontSize: 13 },
  tileHint: { color: T.subtitle, fontFamily: 'Inter_400Regular', fontSize: 11 },
  manage: { borderRadius: T.radius.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  manageTitle: { color: T.white, fontFamily: 'Inter_700Bold', fontSize: 16 },
  manageText: { color: T.subtitle, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  quickList: { gap: 10 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: T.radius.card, padding: 16, minHeight: 72, overflow: 'hidden' },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: T.white },
  quickSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.subtitle, marginTop: 3 },
  card: { backgroundColor: T.white, borderRadius: T.radius.card, padding: 18, borderWidth: 1, borderColor: T.border, gap: 12 },
  h1: { fontFamily: 'Inter_700Bold', fontSize: 22, color: T.text },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: T.muted, lineHeight: 19 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: T.text },
  input: { borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, height: 52, fontSize: 16, fontFamily: 'Inter_400Regular', color: T.text, backgroundColor: T.white },
  err: { color: T.red, fontFamily: 'Inter_400Regular', fontSize: 12 },
  alert: { flexDirection: 'row', gap: 8, backgroundColor: T.redBg, borderRadius: 12, padding: 12 },
  alertText: { flex: 1, color: T.red, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  info: { flexDirection: 'row', gap: 8, backgroundColor: T.light, borderRadius: 12, padding: 12 },
  infoText: { flex: 1, color: T.text, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  linkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: T.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' },
  banner: { borderRadius: T.radius.card, padding: 18, gap: 4, overflow: 'hidden' },
  bannerText: { color: T.white, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  tabs: { gap: 8 },
  tab: { paddingHorizontal: 16, minHeight: 40, justifyContent: 'center', borderRadius: T.radius.chip, backgroundColor: T.white, borderWidth: 1, borderColor: T.border },
  tabOn: { backgroundColor: T.primary, borderColor: T.primary },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: T.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '100%' },
  gridItemWide: { width: '48.8%' },
  pkg: { gap: 10, backgroundColor: T.white, borderRadius: T.radius.card, padding: 16, borderWidth: 1.5, borderColor: T.border },
  pkgOn: { borderColor: T.primary, backgroundColor: T.selected },
  pkgHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pkgLogo: { width: 46, height: 46, borderRadius: 12, backgroundColor: T.deep, alignItems: 'center', justifyContent: 'center' },
  pkgLogoText: { color: T.white, fontFamily: 'Inter_700Bold', fontStyle: 'italic', fontSize: 12 },
  pkgName: { fontFamily: 'Inter_700Bold', fontSize: 15, color: T.text },
  pkgDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.light, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: T.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  price: { fontFamily: 'Inter_700Bold', fontSize: 19, color: T.primary },
  per: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted },
  lowest: { backgroundColor: T.accent === '#ffffff' ? T.light : T.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  lowestText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: T.accent === '#ffffff' ? T.primary : T.accentText },
  source: { fontFamily: 'Inter_400Regular', fontSize: 11, color: T.muted, textAlign: 'center' },
  section: { fontFamily: 'Inter_700Bold', fontSize: 15, color: T.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowK: { fontFamily: 'Inter_400Regular', fontSize: 13, color: T.muted },
  rowV: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: T.text, flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: T.border },
  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.border, gap: 8 },
  secure: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11, color: T.muted },
  resultTop: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  resultIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
});
