import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, FoodHeader, c, notify, s } from '@/components/food/FoodUI';
import { FOOD_IMAGES, addToCart, formatGHS, getMenuItem, getRestaurant, unitPrice } from '@/lib/food-store';

export default function FoodItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = getMenuItem(id);
  const [portion, setPortion] = useState(item?.portions?.[0]?.id);
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  if (!item) return <View style={s.screen}><FoodHeader title="Item" /><View style={s.empty}><Text style={s.emptyTitle}>Item not found</Text></View></View>;
  const r = getRestaurant(item.restaurantId);
  const unit = unitPrice(item, portion, extras);
  const ok = item.available && r?.isOpen;

  const submit = () => {
    try {
      addToCart(item.id, { portionId: portion, extraIds: extras, qty, note: note.trim() || undefined });
      notify('Added to cart', `${qty} × ${item.name} was added.`);
      router.back();
    } catch (e) { notify('Unavailable', (e as Error).message); }
  };

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <FoodHeader title={item.name} subtitle={r?.name} />
      <View style={s.body}>
        <Image source={FOOD_IMAGES[item.image]} style={{ width: '100%', height: 220, borderRadius: 18, marginTop: -30 }} />
        <View style={s.card}>
          <Text style={[s.price, { fontSize: 20 }]}>{formatGHS(item.price)}</Text>
          {item.rating != null && <Text style={s.rowDesc}>★ {item.rating} ({item.reviews} reviews)</Text>}
          <Text style={[s.rowDesc, { fontSize: 13 }]}>{item.description}</Text>
          {!ok && <Text style={{ color: c.destructive, fontFamily: 'Inter_600SemiBold' }}>{!item.available ? 'This item is currently unavailable.' : `${r?.name} is closed right now.`}</Text>}
        </View>
        {!!item.portions?.length && (
          <View style={s.card}>
            <Text style={s.section}>Portion size</Text>
            {item.portions.map((p) => (
              <Pressable key={p.id} onPress={() => setPortion(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                <Ionicons name={portion === p.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={c.primary} />
                <Text style={[s.sumV, { flex: 1 }]}>{p.label}</Text><Text style={s.sumK}>{p.price ? `+${formatGHS(p.price)}` : 'Included'}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {!!item.extras?.length && (
          <View style={s.card}>
            <Text style={s.section}>Optional extras</Text>
            {item.extras.map((e) => {
              const on = extras.includes(e.id);
              return (
                <Pressable key={e.id} onPress={() => setExtras((x) => (on ? x.filter((i) => i !== e.id) : [...x, e.id]))} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={c.primary} />
                  <Text style={[s.sumV, { flex: 1 }]}>{e.label}</Text><Text style={s.sumK}>+{formatGHS(e.price)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <TextInput value={note} onChangeText={setNote} placeholder="Special instructions (optional)" placeholderTextColor={c.mutedForeground} style={[s.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.white, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 8 }}>
            <Pressable accessibilityLabel="Decrease" onPress={() => setQty((q) => Math.max(1, q - 1))}><Ionicons name="remove" size={20} color={c.primary} /></Pressable>
            <Text style={s.bold}>{qty}</Text>
            <Pressable accessibilityLabel="Increase" onPress={() => setQty((q) => q + 1)}><Ionicons name="add" size={20} color={c.primary} /></Pressable>
          </View>
          <View style={{ flex: 1 }}><Btn label={`Add to Cart · ${formatGHS(unit * qty)}`} onPress={submit} disabled={!ok} /></View>
        </View>
      </View>
    </ScrollView>
  );
}
