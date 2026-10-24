export type MeterType = 'prepaid' | 'postpaid';
export type ElectricityProvider = { key: 'ecg' | 'nedco'; name: string; fullName: string; color: string };

export const ELECTRICITY_PROVIDERS: Record<'ecg' | 'nedco', ElectricityProvider> = {
  ecg: { key: 'ecg', name: 'ECG', fullName: 'Electricity Company of Ghana', color: '#1f4fa3' },
  nedco: { key: 'nedco', name: 'NEDCo', fullName: 'Northern Electricity Distribution Company', color: '#2e8b57' },
};

/** No service fee is configured in this preview; review shows a fee only when this is non-null. */
export const ELECTRICITY_FEE: number | null = null;

export function validateElectricityForm(meter: string, amount: string) {
  const errors: { meter?: string; amount?: string } = {};
  const m = meter.replace(/\s/g, '');
  if (!m) errors.meter = 'Enter your meter number.';
  else if (!/^[A-Za-z0-9-]{6,20}$/.test(m)) errors.meter = 'Meter number should be 6–20 letters or digits.';
  const a = amount.trim();
  const n = Number(a);
  if (!a) errors.amount = 'Enter an amount.';
  else if (!/^\d+(\.\d{1,2})?$/.test(a) || !(n > 0)) errors.amount = 'Enter a valid amount greater than GH₵0.';
  return errors;
}

export function maskMeter(meter: string) {
  const m = meter.replace(/\s/g, '');
  return m.length <= 4 ? m : `${'•'.repeat(m.length - 4)}${m.slice(-4)}`;
}
