import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FoodHeader, c, s } from '@/components/food/FoodUI';
import { confirmFoodAddress, useFoodStore } from '@/lib/food-store';

export default function LocationScreen() {
  const router = useRouter();
  const { addresses, confirmedAddress } = useFoodStore();
  const [address, setAddress] = useState(confirmedAddress ?? addresses[0] ?? '');
  const [error, setError] = useState('');
  const confirm = () => {
    try {
      confirmFoodAddress(address);
      if (router.canGoBack()) router.back(); else router.replace('/food');
    } catch (e) { setError((e as Error).message); }
  };
  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={ls.page}>
      <FoodHeader title="Confirm Location" subtitle="Delivery address" showCart={false} />
      <View style={ls.mapUnavailable}>
        <View style={ls.pin}><Ionicons name="location" size={38} color={c.primary} /></View>
        <Text style={s.section}>Map unavailable in test mode</Text>
        <Text style={s.emptyText}>No live location selected</Text>
      </View>
      <View style={s.body}>
        <Text style={s.section}>Deliver to</Text>
        <TextInput accessibilityLabel="Delivery address" value={address} onChangeText={(value) => { setAddress(value); setError(''); }} multiline placeholder="House no., street, area, city" placeholderTextColor={c.mutedForeground} style={[s.input, ls.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
        <Text style={s.section}>Saved addresses</Text>
        {addresses.map((a) => <Pressable key={a} accessibilityLabel={`Select ${a}`} onPress={() => { setAddress(a); setError(''); }} style={ls.addressRow}><Ionicons name={address === a ? 'radio-button-on' : 'radio-button-off'} size={22} color={c.primary} /><Text style={[s.sumV, ls.addressText]}>{a}</Text></Pressable>)}
        {!!error && <Text accessibilityRole="alert" style={ls.error}>{error}</Text>}
        <Btn label="Confirm Location" onPress={confirm} />
        <Text style={s.emptyText}>Test mode · address saved on this device only</Text>
      </View>
    </ScrollView>
  );
}
const ls = StyleSheet.create({
  page: { flexGrow: 1 },
  mapUnavailable: { minHeight: 260, backgroundColor: c.muted, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  pin: { width: 76, height: 76, borderRadius: 38, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center' },
  input: { paddingVertical: 14, minHeight: 70 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: c.border },
  addressText: { flex: 1, lineHeight: 21 },
  error: { color: c.destructive, fontFamily: 'Inter_600SemiBold' },
});