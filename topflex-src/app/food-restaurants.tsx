import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodHeader, RestaurantRow, RestaurantGridCard, ViewToggle, type FoodView, c, s } from '@/components/food/FoodUI';
import { RESTAURANTS } from '@/lib/food-store';

export default function AllRestaurantsScreen() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<FoodView>('list');
  const q = query.trim().toLowerCase();
  const list = RESTAURANTS.filter((r) => !q || `${r.name} ${r.cuisine}`.toLowerCase().includes(q));
  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <FoodHeader title="All Restaurants" subtitle={`${RESTAURANTS.length} restaurants near you`} />
      <View style={s.body}>
        <View style={[s.input, { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -36 }]}>
          <Ionicons name="search-outline" size={18} color={c.mutedForeground} />
          <TextInput accessibilityLabel="Search restaurants" value={query} onChangeText={setQuery} placeholder="Search restaurants..." placeholderTextColor={c.mutedForeground}
            style={[{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: c.foreground }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
          {!!q && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={c.mutedForeground} /></Pressable>}
        </View>
        <ViewToggle view={view} onChange={setView} />
        {view === 'grid'
          ? <View style={s.gridWrap}>{list.map((r) => <RestaurantGridCard key={r.id} id={r.id} />)}</View>
          : list.map((r) => <RestaurantRow key={r.id} id={r.id} />)}
        {!list.length && <View style={s.empty}><Text style={s.emptyTitle}>No restaurants found</Text></View>}
      </View>
    </ScrollView>
  );
}
