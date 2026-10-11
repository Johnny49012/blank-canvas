import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FoodHeader, SummaryRows, c, s } from '@/components/food/FoodUI';
import { PAYMENT_METHODS, addAddress, cartSummary, formatGHS, placeOrder, useFoodStore } from '@/lib/food-store';
import { getWalletSandboxState } from '@/lib/wallet-sandbox';

const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, addresses, confirmedAddress } = useFoodStore();
  const [address, setAddress] = useState(confirmedAddress ?? addresses[0] ?? '');
  useEffect(() => { if (confirmedAddress) setAddress(confirmedAddress); }, [confirmedAddress]);
  const [newAddr, setNewAddr] = useState('');
  const [adding, setAdding] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [method, setMethod] = useState('wallet');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sum = cartSummary(cart);
  const balance = getWalletSandboxState().balance;

  const submit = () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const orders = placeOrder(address, instructions.trim(), method);
      router.replace({ pathname: '/food-order', params: { ids: orders.map((o) => o.id).join(',') } });
    } catch (e) { setError((e as Error).message); setBusy(false); }
  };

  if (!cart.length) return <View style={s.screen}><FoodHeader title="Checkout" showCart={false} /><View style={s.empty}><Text style={s.emptyTitle}>Your cart is empty</Text><Btn label="Browse Food & Drinks" onPress={() => router.replace('/food')} /></View></View>;

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <FoodHeader title="Checkout" showCart={false} />
      <View style={s.body}>
        <View style={s.card}>
          <Text style={s.section}>Delivery address</Text>
          <Btn variant="ghost" label="Confirm Location" onPress={() => router.push('/food-location')} />
          {addresses.map((a) => (
            <Pressable key={a} onPress={() => setAddress(a)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 }}>
              <Ionicons name={address === a ? 'radio-button-on' : 'radio-button-off'} size={20} color={c.primary} />
              <Text style={[s.sumV, { flex: 1 }]}>{a}</Text>
            </Pressable>
          ))}
          {adding ? (
            <>
              <TextInput value={newAddr} onChangeText={setNewAddr} placeholder="House no., street, area, city" placeholderTextColor={c.mutedForeground} style={[s.input, noOutline]} />
              <Btn variant="ghost" label="Save address" onPress={() => { if (newAddr.trim().length < 8) return setError('Please enter a valid delivery address.'); addAddress(newAddr.trim()); setAddress(newAddr.trim()); setNewAddr(''); setAdding(false); setError(''); }} />
            </>
          ) : <Pressable onPress={() => setAdding(true)}><Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold' }}>+ Add new address</Text></Pressable>}
          <TextInput value={instructions} onChangeText={setInstructions} placeholder="Delivery instructions (optional)" placeholderTextColor={c.mutedForeground} style={[s.input, noOutline]} />
        </View>

        <View style={s.card}>
          <Text style={s.section}>Payment method</Text>
          {PAYMENT_METHODS.map((m) => (
            <Pressable key={m.id} disabled={!m.supported} onPress={() => setMethod(m.id)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4, opacity: m.supported ? 1 : 0.5 }}>
              <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={c.primary} />
              <Text style={[s.sumV, { flex: 1 }]}>{m.label}</Text>
              <Text style={s.sumK}>{m.id === 'wallet' ? `Balance ${formatGHS(balance)}` : 'Not available yet'}</Text>
            </Pressable>
          ))}
        </View>

        <SummaryRows rows={[['Item Total', sum.itemTotal], ['Delivery Fee', sum.deliveryFee], ['Service Fee', sum.serviceFee], ['Total Amount', sum.total, true]]} />
        {!!error && <Text style={{ color: c.destructive, fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>{error}</Text>}
        <Btn label={busy ? 'Placing order…' : `Place Order · ${formatGHS(sum.total)}`} onPress={submit} disabled={busy} />
        <Text style={s.emptyText}>Test mode · paid from the simulated TopFlex Wallet</Text>
      </View>
    </ScrollView>
  );
}
