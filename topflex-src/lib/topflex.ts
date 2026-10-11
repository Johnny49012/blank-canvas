import { supabase } from '@/lib/supabase';
import { getWalletSandboxState, WALLET_SANDBOX_EMAIL } from '@/lib/wallet-sandbox';

export type Profile = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export type WalletSummary = {
  balance: number;
  currency: string;
  walletId: string | null;
  frozen: boolean;
  demoMode: boolean;
};

export type Transaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  title: string;
  detail: string;
};

export type HomeData = {
  signedOut: boolean;
  userId: string | null;
  profile: Profile | null;
  wallet: WalletSummary | null;
  transactions: Transaction[];
  unreadNotifications: number;
};

type Row = Record<string, unknown> | null;

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stringValue = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

const titleForType = (type: string) => {
  const value = type.toLowerCase();
  if (value.includes('data')) return 'Data Purchase';
  if (value.includes('airtime')) return 'Airtime Purchase';
  if (value.includes('bill')) return 'Bill Payment';
  if (value.includes('transfer')) return 'Cash Transfer';
  if (value.includes('fund')) return 'Wallet Funding';
  return type || 'TopFlex Transaction';
};

const detailForRow = (row: Row) => {
  const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
  return stringValue(
    metadata['bundle'] ?? metadata['product'] ?? metadata['network'] ?? metadata['description'],
    'TopFlex service',
  );
};

const toTransaction = (row: Record<string, unknown>): Transaction => {
  const type = stringValue(row['type'], 'Transaction');
  const createdAt = stringValue(row['created_at'], new Date().toISOString());
  return {
    id: stringValue(row['id'], createdAt),
    type,
    amount: numberValue(row['amount']),
    status: stringValue(row['status'], 'Pending'),
    createdAt,
    title: titleForType(type),
    detail: detailForRow(row),
  };
};

export const formatGhs = (amount: number, withSign = false) => {
  const prefix = withSign && amount > 0 ? '- ' : '';
  const formattedAmount = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return prefix + 'GH₵ ' + formattedAmount;
};

export const formatTransactionTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const time = date.toLocaleTimeString('en-GH', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return 'Today, ' + time;
  return date.toLocaleDateString('en-GH', { day: '2-digit', month: 'short' }) + ', ' + time;
};

export const firstName = (name: string) => name.trim().split(/\\s+/)[0] || 'there';

// Keep the mobile UI fully local while the wallet screens are being prototyped.
// Set to false when intentionally reconnecting the app to authenticated Supabase data.
const FRONTEND_ONLY_PREVIEW: boolean = true;

const getPreviewTransactions = (): Transaction[] => [
  {
    id: 'preview-transfer-001',
    type: 'transfer',
    amount: 125,
    status: 'TEST • Success',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    title: 'Cash Transfer',
    detail: 'Ama Owusu · TEST',
  },
  {
    id: 'preview-funding-001',
    type: 'wallet_funding',
    amount: -250,
    status: 'TEST • Success',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    title: 'Wallet Funding',
    detail: 'MTN Mobile Money · TEST',
  },
  {
    id: 'preview-data-001',
    type: 'data',
    amount: 35,
    status: 'TEST • Success',
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    title: 'Data Purchase',
    detail: 'MTN data bundle · TEST',
  },
];

const loadFrontendOnlyHomeData = async (): Promise<HomeData> => {
  const sandboxState = getWalletSandboxState();
  return {
    signedOut: false,
    userId: 'frontend-preview-user',
    profile: {
      fullName: 'TopFlex Test User',
      email: WALLET_SANDBOX_EMAIL,
      avatarUrl: null,
    },
    wallet: {
      balance: sandboxState.balance,
      currency: 'GHS',
      walletId: 'TF-TEST-0001',
      frozen: false,
      demoMode: true,
    },
    transactions: [...sandboxState.transactions, ...getPreviewTransactions()].slice(0, 4),
    unreadNotifications: 2,
  };
};

export async function loadHomeData(): Promise<HomeData> {
  if (FRONTEND_ONLY_PREVIEW) return loadFrontendOnlyHomeData();
  return loadConnectedHomeData();
}

async function loadConnectedHomeData(): Promise<HomeData> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return { signedOut: true, userId: null, profile: null, wallet: null, transactions: [], unreadNotifications: 0 };
  }

  const [profileResult, walletResult, transactionResult, notificationResult] = await Promise.all([
    supabase.from('profiles').select('full_name, email, avatar_url').eq('id', user.id).maybeSingle(),
    supabase.rpc('ensure_wallet'),
    supabase
      .from('transactions')
      .select('id, type, amount, status, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('notifications').select('id, read').eq('user_id', user.id).eq('read', false).eq('archived', false),
  ]);

  const profileRow = (profileResult.data ?? null) as Row;
  const walletRow = (walletResult.data ?? null) as Row;
  const demoMode = false;
  const profile: Profile = {
    fullName: stringValue(profileRow?.['full_name'], stringValue(user.user_metadata?.['full_name'], user.email?.split('@')[0] ?? 'TopFlex user')),
    email: stringValue(profileRow?.['email'], user.email ?? ''),
    avatarUrl: (profileRow?.['avatar_url'] as string | null) ?? null,
  };
  const wallet: WalletSummary | null = walletRow?.['ok'] === true
    ? {
        balance: numberValue(walletRow['balance']),
        currency: stringValue(walletRow['currency'], 'GHS'),
        walletId: (walletRow['walletId'] as string | null) ?? null,
        frozen: walletRow['frozen'] === true,
        demoMode,
      }
    : null;

  return {
    signedOut: false,
    userId: user.id,
    profile,
    wallet,
    transactions: ((transactionResult.data ?? []) as Record<string, unknown>[]).map(toTransaction),
    unreadNotifications: notificationResult.data?.length ?? 0,
  };
}

export async function loadTransactions() {
  const home = await loadHomeData();
  return home.transactions;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUp(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
