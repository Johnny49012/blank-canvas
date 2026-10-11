import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FoodHeader, ItemGridCard, ItemRow, ViewToggle, c, notify, s, type FoodView } from '@/components/food/FoodUI';
import { FOOD_CATEGORIES, addToCart, searchMenu, type FoodCategory, type MenuItem } from '@/lib/food-store';

export default function FoodMenuScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const worth = section === 'worth';
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<'All' | FoodCategory>('All');
  const [view, setView] = useState<FoodView>('list');

  const items = useMemo(() => {
    // Same split as the Food & Drinks page: top 8 by popularity are "Popular", the rest "Worth Checking Out".
    const all = [...searchMenu('', 'All')].sort((a, b) => b.popularity - a.popularity);
    const ids = new Set((worth ? all.slice(8) : all.slice(0, 8)).map((i) => i.id));
    return searchMenu(query, cat).filter((i) => ids.has(i.id)).sort((a, b) => b.popularity - a.popularity);
  }, [query, cat, worth]);

  const add = (item: MenuItem) => {
    if (item.portions?.length || item.extras?.length) return router.push({ pathname: '/food-item', params: { id: item.id } });
    try { addToCart(item.id); notify('Added to cart', `${item.name} was added.`); } catch (e) { notify('Unavailable', (e as Error).message); }
  };

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <FoodHeader title={worth ? 'Worth Checking Out' : 'Popular Food & Drinks'} subtitle={`${items.length} items`} />
      <View style={s.body}>
        <View style={[s.input, { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -36 }]}>
          <Ionicons name="search-outline" size={18} color={c.mutedForeground} />
          <TextInput accessibilityLabel="Search food and drinks" value={query} onChangeText={setQuery} placeholder="Search food and drinks..." placeholderTextColor={c.mutedForeground}
            style={[{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: c.foreground }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
          {!!query && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={c.mutedForeground} /></Pressable>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FOOD_CATEGORIES.map((k) => (
            <Pressable key={k.key} onPress={() => setCat(k.key)} accessibilityRole="button" accessibilityState={{ selected: cat === k.key }} style={[s.chip, cat === k.key && s.chipOn]}>
              <Ionicons name={k.icon as never} size={15} color={cat === k.key ? c.white : c.primary} />
              <Text style={[s.chipText, cat === k.key && { color: c.white }]}>{k.key}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ViewToggle view={view} onChange={setView} />
        {view === 'grid'
          ? <View style={s.gridWrap}>{items.map((i) => <ItemGridCard key={i.id} item={i} onAdd={() => add(i)} />)}</View>
          : items.map((i) => <ItemRow key={i.id} item={i} onAdd={() => add(i)} />)}
        {!items.length && <View style={s.empty}><Ionicons name="fast-food-outline" size={30} color={c.mutedForeground} /><Text style={s.emptyTitle}>No items found</Text><Text style={s.emptyText}>Try another search or category.</Text></View>}
      </View>
    </ScrollView>
  );
}
