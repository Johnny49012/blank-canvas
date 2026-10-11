import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { signIn, signUp } from '@/lib/topflex';
import colors from '@/constants/colors';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/(tabs)');
    });
  }, [router]);

  const submit = async () => {
    if (busy) return;
    setMessage('');
    if (!email.trim() || password.length < 6 || (mode === 'sign-up' && fullName.trim().length < 2)) {
      setMessage(mode === 'sign-up' ? 'Enter your name, email, and a password with at least 6 characters.' : 'Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const request = mode === 'sign-in' ? signIn(email, password) : signUp(email, password, fullName);
      const result = await Promise.race([
        request,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('TopFlex could not reach the sign-in service. Check your connection and try again.')), 15000);
        }),
      ]);
      if (result.error) { setMessage(result.error.message); return; }
      if (mode === 'sign-up' && !result.data.session) { setMessage('Check your email to confirm your TopFlex account, then sign in.'); setMode('sign-in'); return; }
      void queryClient.invalidateQueries({ queryKey: ['topflex-home'] }).catch(() => undefined);
      router.replace('/(tabs)');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in right now. Please try again.');
    } finally {
      if (timeout) clearTimeout(timeout);
      setBusy(false);
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}><LinearGradient colors={[colors.light.headerStart, colors.light.headerEnd]} style={[styles.hero, { paddingTop: insets.top + 20 }]}><View style={styles.mark}><Text style={styles.markText}>T</Text></View><Text style={styles.brand}>Top<Text style={styles.brandAccent}>Flex</Text></Text><Text style={styles.heroTitle}>Your everyday money, made simple.</Text><Text style={styles.heroText}>Wallet, payments, and useful services in one calm place.</Text></LinearGradient><View style={styles.form}><Text style={styles.formTitle}>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</Text><Text style={styles.formSubtitle}>{mode === 'sign-in' ? 'Sign in to view your wallet and activity.' : 'Start using TopFlex with your existing account.'}</Text>{mode === 'sign-up' && <TextInput value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.light.mutedForeground} style={styles.input} autoCapitalize="words" /> }<TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.light.mutedForeground} style={styles.input} autoCapitalize="none" keyboardType="email-address" /><TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.light.mutedForeground} style={styles.input} secureTextEntry />{message ? <Text style={styles.message}>{message}</Text> : null}<Pressable testID="auth-submit" onPress={submit} disabled={busy} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.8 }, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color={colors.light.white} /> : <Text style={styles.submitText}>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>}</Pressable><Pressable onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(''); }} style={styles.switch}><Text style={styles.switchText}>{mode === 'sign-in' ? 'New to TopFlex? Create an account' : 'Already have an account? Sign in'}</Text></Pressable></View></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.light.background }, hero: { minHeight: 310, paddingHorizontal: 23, justifyContent: 'flex-end', paddingBottom: 34 }, mark: { width: 43, height: 43, borderRadius: 13, backgroundColor: '#9af0d5', alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-10deg' }] }, markText: { color: colors.light.headerStart, fontFamily: 'Inter_700Bold', fontSize: 25, transform: [{ skewX: '10deg' }] }, brand: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 13 }, brandAccent: { color: '#91efd1' }, heroTitle: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, marginTop: 38, maxWidth: 300 }, heroText: { color: '#c4e8dc', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 9, maxWidth: 290 }, form: { flex: 1, backgroundColor: colors.light.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, padding: 22 }, formTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 22 }, formSubtitle: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6, marginBottom: 18 }, input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.background, paddingHorizontal: 15, color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 11 }, message: { color: colors.light.destructive, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginBottom: 12 }, submit: { minHeight: 52, borderRadius: 14, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 3 }, submitText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 13 }, switch: { alignItems: 'center', paddingVertical: 18 }, switchText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 11 } });
