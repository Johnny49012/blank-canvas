import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Btn, FoodHeader, SummaryRows, c, s } from '@/components/food/FoodUI';
import { FOOD_IMAGES, cartSummary, clearCart, formatGHS, getMenuItem, lineDetail, setQty, unitPrice, useFoodStore } from '@/lib/food-store';

export default function CartScreen() {
  const router = useRouter();
  const { cart } = useFoodStore();
  const sum = cartSummary(cart);

  return (
    <ScrollView style={s.screen}>
      <FoodHeader title="Your Cart" showCart={false} />
      <View style={s.body}>
        {!cart.length ? (
          <View style={s.empty}>
            <Ionicons name="bag-handle-outline" size={34} color={c.mutedForeground} />
            <Text style={s.emptyTitle}>Your cart is empty</Text>
            <Btn label="Browse Food & Drinks" onPress={() => router.replace('/food')} />
          </View>
        ) : (
          <>
            {sum.groups.map((g) => (
              <View key={g.restaurant.id} style={{ gap: 10 }}>
                <Text style={s.section}>{g.restaurant.name}</Text>
                {g.lines.map((l) => {
                  const it = getMenuItem(l.itemId)!;
                  const unit = unitPrice(it, l.portionId, l.extraIds);
                  return (
                    <View key={l.key} style={s.row}>
                      <Image source={FOOD_IMAGES[it.image]} style={[s.rowImg, { width: 64, height: 64 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowTitle}>{it.name}</Text>
                        {!!lineDetail(l) && <Text style={s.rowDesc}>{lineDetail(l)}</Text>}
                        {!!l.note && <Text style={s.rowMeta}>“{l.note}”</Text>}
                        <Text style={s.rowMeta}>{formatGHS(unit)} each</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
                          <Pressable accessibilityLabel="Decrease" onPress={() => setQty(l.key, l.qty - 1)}><Ionicons name="remove-circle-outline" size={22} color={c.primary} /></Pressable>
                          <Text style={s.sumV}>{l.qty}</Text>
                          <Pressable accessibilityLabel="Increase" onPress={() => setQty(l.key, l.qty + 1)}><Ionicons name="add-circle-outline" size={22} color={c.primary} /></Pressable>
                          <Text style={[s.price, { marginLeft: 'auto', marginTop: 0 }]}>{formatGHS(unit * l.qty)}</Text>
                        </View>
                      </View>
                      <Pressable accessibilityLabel="Remove item" onPress={() => setQty(l.key, 0)}><Ionicons name="trash-outline" size={19} color={c.destructive} /></Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
            {sum.groups.length > 1 && <Text style={s.emptyText}>Items from different restaurants are delivered separately, each with its own delivery fee.</Text>}
            <SummaryRows rows={[['Item Total', sum.itemTotal], ['Delivery Fee', sum.deliveryFee], ['Service Fee', sum.serviceFee], ['Total Amount', sum.total, true]]} />
            <Btn label="Proceed to Checkout" onPress={() => router.push('/food-checkout')} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Btn variant="ghost" label="Continue Shopping" onPress={() => router.replace('/food')} /></View>
              <View style={{ flex: 1 }}><Btn variant="ghost" label="Clear All" onPress={clearCart} /></View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
