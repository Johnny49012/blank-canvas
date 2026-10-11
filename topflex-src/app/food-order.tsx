import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, FoodHeader, SummaryRows, c, s } from '@/components/food/FoodUI';
import { ORDER_STEPS, advanceOrder, formatGHS, getRestaurant, useFoodStore } from '@/lib/food-store';

const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

export default function OrderScreen() {
  const router = useRouter();
  const { ids = '' } = useLocalSearchParams<{ ids: string }>();
  const { orders } = useFoodStore();
  const mine = orders.filter((o) => ids.split(',').includes(o.id));
  const [tracking, setTracking] = useState(false);

  if (!mine.length) return <View style={s.screen}><FoodHeader title="Order" showCart={false} /><View style={s.empty}><Text style={s.emptyTitle}>Order not found</Text><Btn label="Back to Food & Drinks" onPress={() => router.replace('/food')} /></View></View>;

  return (
    <ScrollView style={s.screen}>
      <FoodHeader title={tracking ? 'Order Tracking' : 'Order Confirmed!'} subtitle={tracking ? undefined : 'Your order has been placed successfully.'} showCart={false} />
      <View style={s.body}>
        {mine.map((o) => {
          const r = getRestaurant(o.restaurantId);
          const idx = ORDER_STEPS.findIndex((st) => st.key === o.status);
          return (
            <View key={o.id} style={{ gap: 12 }}>
              <View style={[s.card, { alignItems: 'center' }]}>
                {!tracking && <Ionicons name="checkmark-circle" size={52} color={c.primary} />}
                <Text style={s.bold}>Order #{o.id}</Text>
                <Text style={s.rowDesc}>{r?.name}{o.etaMinutes ? ` · est. ${o.etaMinutes} min` : ''}</Text>
                <Text style={s.rowMeta}>Payment: {o.paymentStatus === 'paid' ? `Paid with ${o.paymentMethod} (test)` : 'Pending'}</Text>
              </View>
              {tracking ? (
                <View style={s.card}>
                  {ORDER_STEPS.map((st, i) => {
                    const done = i <= idx;
                    return (
                      <View key={st.key} style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? c.primary : c.navMuted} />
                          {i < ORDER_STEPS.length - 1 && <View style={{ width: 2, height: 26, backgroundColor: i < idx ? c.primary : c.border }} />}
                        </View>
                        <View><Text style={[s.sumV, !done && { color: c.mutedForeground }]}>{st.label}</Text><Text style={s.rowMeta}>{time(o.timeline[st.key])}</Text></View>
                      </View>
                    );
                  })}
                  {o.status !== 'delivered' && <Btn variant="ghost" label="Simulate next status (test)" onPress={() => advanceOrder(o.id)} />}
                </View>
              ) : (
                <View style={s.card}>
                  {o.lines.map((l, i) => (
                    <View key={i} style={s.sumRow}>
                      <Text style={[s.sumK, { flex: 1 }]}>{l.qty} × {l.name}{l.detail ? ` (${l.detail})` : ''}</Text>
                      <Text style={s.sumV}>{formatGHS(l.unit * l.qty)}</Text>
                    </View>
                  ))}
                  <Text style={s.rowMeta}>Deliver to: {o.address}</Text>
                </View>
              )}
              <SummaryRows rows={[['Item Total', o.itemTotal], ['Delivery Fee', o.deliveryFee], ['Service Fee', o.serviceFee], ['Total Paid', o.total, true]]} />
            </View>
          );
        })}
        {!tracking ? <Btn label="Track Order" onPress={() => setTracking(true)} /> : <Btn variant="ghost" label="View order details" onPress={() => setTracking(false)} />}
        <Btn variant="ghost" label="Back to Food & Drinks" onPress={() => router.replace('/food')} />
      </View>
    </ScrollView>
  );
}
