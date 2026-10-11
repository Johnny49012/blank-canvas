import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FoodHeader, ItemGridCard, ItemRow, Pager, RestaurantRow, SectionHead, ViewToggle, c, notify, s, type FoodView } from '@/components/food/FoodUI';
import { FOOD_CATEGORIES, FOOD_IMAGES, RESTAURANTS, addToCart, formatGHS, getRestaurant, searchMenu, useFoodStore, type FoodCategory, type MenuItem } from '@/lib/food-store';

type Sort = 'popular' | 'low' | 'high';

export default function FoodScreen() {
  const router = useRouter();
  const { confirmedAddress, addresses } = useFoodStore();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<'All' | FoodCategory>('All');
  const [sort, setSort] = useState<Sort>('popular');
  const [view, setView] = useState<FoodView>('list');
  const searching = query.trim().length > 0;

  const items = useMemo(() => {
    const list = searchMenu(query, cat);
    return [...list].sort((a, b) => (sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : b.popularity - a.popularity));
  }, [query, cat, sort]);
  const q = query.trim().toLowerCase();
  const restaurants = RESTAURANTS.filter((r) => !q || `${r.name} ${r.cuisine}`.toLowerCase().includes(q));

  const add = (item: MenuItem) => {
    if (item.portions?.length || item.extras?.length) return router.push({ pathname: '/food-item', params: { id: item.id } });
    try { addToCart(item.id); notify('Added to cart', `${item.name} was added.`); } catch (e) { notify('Unavailable', (e as Error).message); }
  };

  const popular = items.slice(0, 8);
  const worth = items.slice(8);
  const renderItem = (i: MenuItem, w: number) => view === 'grid' ? <ItemGridCard key={i.id} item={i} width={w} onAdd={() => add(i)} /> : <ItemRow key={i.id} item={i} onAdd={() => add(i)} />;

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <FoodHeader title="Food & Drinks" subtitle="Discover delicious meals and refreshing drinks." />
      <View style={s.body}>
        <View style={[s.input, { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -36 }]}>
          <Ionicons name="search-outline" size={18} color={c.mutedForeground} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search for food, drinks or restaurants..." placeholderTextColor={c.mutedForeground}
            style={[{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: c.foreground }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
          {searching && <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={c.mutedForeground} /></Pressable>}
        </View>

        <Pressable accessibilityLabel="Change delivery location" onPress={() => router.push('/food-location')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Ionicons name="location-outline" size={20} color={c.primary} />
          <View style={{ flex: 1 }}><Text style={s.rowMeta}>Deliver to</Text><Text style={s.sumV} numberOfLines={2}>{confirmedAddress ?? addresses[0] ?? 'Choose delivery location'}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={c.primary} />
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FOOD_CATEGORIES.map((k) => (
            <Pressable key={k.key} onPress={() => setCat(k.key)} style={[s.chip, cat === k.key && s.chipOn]}>
              <Ionicons name={k.icon as never} size={15} color={cat === k.key ? c.white : c.primary} />
              <Text style={[s.chipText, cat === k.key && { color: c.white }]}>{k.key}</Text>
            </Pressable>
          ))}
        </ScrollView>


        {searching ? (
          <>
            <Text style={s.section}>Results for “{query.trim()}”</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['popular', 'Popularity'], ['low', 'Price: Low to High'], ['high', 'Price: High to Low']] as [Sort, string][]).map(([k, l]) => (
                <Pressable key={k} onPress={() => setSort(k)} style={[s.chip, sort === k && s.chipOn]}><Text style={[s.chipText, { fontSize: 11 }, sort === k && { color: c.white }]}>{l}</Text></Pressable>
              ))}
            </View>
            <ViewToggle view={view} onChange={setView} />
            {restaurants.map((r) => <RestaurantRow key={r.id} id={r.id} />)}

            {view === 'grid' ? <View style={s.gridWrap}>{items.map((i) => <ItemGridCard key={i.id} item={i} onAdd={() => add(i)} />)}</View> : items.map((i) => <ItemRow key={i.id} item={i} onAdd={() => add(i)} />)}
            {!items.length && !restaurants.length && <Empty />}
          </>
        ) : (
          <>
            <SectionHead title="Featured Restaurants" seeAllLabel="See all restaurants" onSeeAll={() => router.push('/food-restaurants')} />
            <Pager key="feat" data={RESTAURANTS} perPage={2} label="Featured restaurants" render={(r) => <RestaurantRow key={r.id} id={r.id} />} />
            <ViewToggle view={view} onChange={setView} />

            <SectionHead title="Popular Food & Drinks" seeAllLabel="See all popular food and drinks" onSeeAll={() => router.push({ pathname: '/food-menu', params: { section: 'popular' } })} />
            <Pager key={`pop-${view}`} data={popular} perPage={view === 'grid' ? 4 : 2} grid={view === 'grid'} label="Popular food and drinks" render={renderItem} />
            {worth.length > 0 && <>
              <SectionHead title="Worth Checking Out" seeAllLabel="See all worth checking out" onSeeAll={() => router.push({ pathname: '/food-menu', params: { section: 'worth' } })} />
              <Pager key={`worth-${view}`} data={worth} perPage={view === 'grid' ? 4 : 2} grid={view === 'grid'} label="Worth checking out" render={renderItem} />
            </>}
            {!items.length && <Empty />}
          </>
        )}
        <Text style={[s.emptyText, { marginTop: 6 }]}>Test mode · sample restaurants and menus</Text>
      </View>
    </ScrollView>
  );
}

function Empty() {
  return <View style={s.empty}><Ionicons name="fast-food-outline" size={30} color={c.mutedForeground} /><Text style={s.emptyTitle}>No results found</Text><Text style={s.emptyText}>Try another search or category.</Text></View>;
}

