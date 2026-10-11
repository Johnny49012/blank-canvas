import type { Transaction } from '@/lib/topflex';

export const WALLET_SANDBOX_EMAIL = 'jedimark040@gmail.com';
export const WALLET_SANDBOX_INITIAL_BALANCE = 599_048;
export const WALLET_SANDBOX_TRANSFER_FEE_RATE = 0.015;

export const WALLET_SANDBOX_RECIPIENT = {
  walletId: 'TF12345678',
  fullName: 'John Frimpong',
  phone: '024 123 4567',
};

export const WALLET_SANDBOX_SENDER = {
  walletId: 'TF87654321',
  fullName: 'Ama Owusu',
};

export type WalletFundingMethod = 'mobile-money' | 'bank-transfer' | 'card' | 'topflex';

export const WALLET_SANDBOX_NETWORKS = ['MTN', 'Telecel', 'AirtelTigo'] as const;

export const WALLET_SANDBOX_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', balance: 125.4, formattedBalance: '$125.40' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', balance: 82.15, formattedBalance: '€82.15' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', balance: 45.6, formattedBalance: '£45.60' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', balance: 76.35, formattedBalance: 'CA$76.35' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', balance: 91.2, formattedBalance: 'A$91.20' },
] as const;

type SandboxMovement = {
  kind: 'funding' | 'transfer';
  amount: number;
  fee?: number;
  detail: string;
};

let sandboxBalance: number | null = null;
let sandboxTransactions: Transaction[] = [];
let movementCount = 0;

export function getWalletSandboxState() {
  return {
    balance: sandboxBalance ?? WALLET_SANDBOX_INITIAL_BALANCE,
    transactions: [...sandboxTransactions],
  };
}

export function recordWalletSandboxMovement({ kind, amount, fee = 0, detail }: SandboxMovement) {
  const currentBalance = getWalletSandboxState().balance;
  const total = kind === 'transfer' ? amount + fee : amount;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter a valid amount.');
  }
  if (kind === 'transfer' && total > currentBalance) {
    throw new Error('Insufficient balance.');
  }

  sandboxBalance = kind === 'funding'
    ? currentBalance + amount
    : currentBalance - total;
  movementCount += 1;

  const transaction: Transaction = {
    id: `sandbox-${Date.now()}-${movementCount}`,
    type: kind === 'funding' ? 'wallet_funding' : 'transfer',
    amount: kind === 'funding' ? -amount : total,
    status: 'TEST • Success',
    createdAt: new Date().toISOString(),
    title: kind === 'funding' ? 'Wallet Funding' : 'Cash Transfer',
    detail: `${detail} · TEST`,
  };

  sandboxTransactions = [transaction, ...sandboxTransactions].slice(0, 4);
  return { balance: sandboxBalance, transaction };
}