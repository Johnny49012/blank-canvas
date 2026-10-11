import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && key);

const requestTimeoutMs = 15_000;
const fetchWithTimeout: typeof fetch = (input, init) => {
  if (!isSupabaseConfigured) {
    return Promise.reject(new Error('Supabase is not connected. This TopFlex web build is running in frontend preview mode.'));
  }
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const forwardAbort = () => controller.abort();

  if (upstreamSignal?.aborted) {
    controller.abort();
  } else {
    upstreamSignal?.addEventListener('abort', forwardAbort, { once: true });
  }

  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener('abort', forwardAbort);
  });
};

export const supabase = createClient(url || 'https://topflex-preview.invalid', key || 'frontend-preview-disabled-key', {
  global: { fetch: fetchWithTimeout },
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
