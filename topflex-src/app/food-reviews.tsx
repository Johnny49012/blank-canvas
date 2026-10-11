import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { Btn, FoodHeader, c, s } from '@/components/food/FoodUI';
import { ReviewCard, ReviewsEmpty, ReviewStars } from '@/components/food/RestaurantReviews';
import { FOOD_IMAGES, getRestaurant } from '@/lib/food-store';
import { filterReviews, getRestaurantReviews, reviewSummary, type ReviewSort } from '@/lib/restaurant-reviews';

const SORTS: { key: ReviewSort; label: string }[] = [{ key: 'recent', label: 'Most Recent' }, { key: 'high', label: 'Highest Rated' }, { key: 'low', label: 'Lowest Rated' }];

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurant = getRestaurant(id);
  const [query, setQuery] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [sort, setSort] = useState<ReviewSort>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [limit, setLimit] = useState(10);
  const reviews = getRestaurantReviews(restaurant?.id ?? '');
  const summary = reviewSummary(reviews);
  const shown = filterReviews(reviews, query, rating, sort);
  const clear = () => { setQuery(''); setRating(null); setLimit(10); };
  return <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
    <Head><title>{restaurant ? `${restaurant.name} Ratings & Reviews — TopFlex` : 'Restaurant Reviews — TopFlex'}</title><meta name="description" content={`Customer ratings and reviews for ${restaurant?.name ?? 'restaurants'} on TopFlex.`} /><meta property="og:title" content={`${restaurant?.name ?? 'Restaurant'} Ratings & Reviews — TopFlex`} /><meta property="og:description" content="Read customer feedback and restaurant ratings on TopFlex." /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary" /></Head>
    <FoodHeader title="Ratings & Reviews" subtitle="Read what customers say about this restaurant." />
    {!restaurant ? <View style={s.empty}><Text style={s.emptyTitle}>Restaurant not found</Text></View> : <View style={s.body}>
      <View style={rs.identity}><View style={rs.logo}><Ionicons name="restaurant-outline" size={22} color={c.foreground} /><Text style={rs.logoName} numberOfLines={2}>{restaurant.name}</Text></View><View style={rs.name}><Text style={s.section}>{restaurant.name}</Text><Text style={s.rowDesc}>{restaurant.cuisine}</Text></View></View>
      <View style={s.card}>
        <View style={rs.summary}><View style={rs.score}><Text style={rs.average}>{summary.average?.toFixed(1) ?? '—'}</Text><ReviewStars rating={summary.average ?? 0} /><Text style={s.emptyText}>{summary.total} {summary.total === 1 ? 'review' : 'reviews'}</Text></View>
          <View style={rs.distribution}>{summary.counts.map((row) => <Pressable key={row.rating} accessibilityRole="button" accessibilityLabel={`Filter ${row.rating} star reviews, ${row.count} reviews`} accessibilityState={{ selected: rating === row.rating }} onPress={() => { setRating(rating === row.rating ? null : row.rating); setLimit(10); }} style={[rs.ratingRow, rating === row.rating && rs.selected]}>
            <Text style={rs.ratingLabel}>{row.rating}</Text><Ionicons name="star" size={12} color={c.primary} /><View style={rs.track}><View style={[rs.fill, { width: `${summary.total ? row.count / summary.total * 100 : 0}%` }]} /></View><Text style={rs.count}>{row.count}</Text>
          </Pressable>)}</View>
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: rating === null }} onPress={() => { setRating(null); setLimit(10); }} style={rs.all}><Text style={rs.link}>All Reviews</Text></Pressable>
      </View>
      <View style={rs.search}><Ionicons name="search-outline" size={18} color={c.mutedForeground} /><TextInput accessibilityLabel="Search reviews" value={query} onChangeText={(value) => { setQuery(value); setLimit(10); }} placeholder="Search reviews..." placeholderTextColor={c.mutedForeground} style={rs.searchText} />{query.length > 0 && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color={c.mutedForeground} /></Pressable>}</View>
      <View style={rs.sortHead}><Text style={[s.sumV, rs.name]}>{shown.length} {shown.length === 1 ? 'review' : 'reviews'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Sort reviews" accessibilityState={{ expanded: sortOpen }} onPress={() => setSortOpen(!sortOpen)} style={s.chip}><Text style={s.chipText}>{SORTS.find((option) => option.key === sort)?.label}</Text><Ionicons name={sortOpen ? 'chevron-up' : 'chevron-down'} size={14} color={c.primary} /></Pressable></View>
      {sortOpen && <View style={s.card}>{SORTS.map((option) => <Pressable key={option.key} accessibilityRole="button" accessibilityState={{ selected: sort === option.key }} style={rs.sortOption} onPress={() => { setSort(option.key); setSortOpen(false); setLimit(10); }}><Text style={s.sumV}>{option.label}</Text>{sort === option.key && <Ionicons name="checkmark" size={18} color={c.primary} />}</Pressable>)}</View>}
      {(rating !== null || query.length > 0) && <Btn label="Clear filters" variant="ghost" onPress={clear} />}
      {!reviews.length ? <ReviewsEmpty /> : !shown.length ? <View style={s.empty}><Text style={s.emptyTitle}>No matching reviews</Text><Text style={s.emptyText}>Try another search or rating.</Text><Btn label="All Reviews" variant="ghost" onPress={clear} /></View> : shown.slice(0, limit).map((review) => <ReviewCard key={review.id} review={review} />)}
      {shown.length > limit && <Btn label="Load more reviews" variant="ghost" onPress={() => setLimit(limit + 10)} />}
      <Text style={s.emptyText}>Review submission is not available in test mode.</Text>
    </View>}
  </ScrollView>;
}

const rs = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 64, height: 64, borderRadius: 12, flexShrink: 0 },
  name: { flex: 1, minWidth: 0 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  score: { alignItems: 'center', gap: 7, width: 88, flexShrink: 0 },
  average: { fontFamily: 'Inter_700Bold', fontSize: 34, color: c.foreground },
  distribution: { flex: 1, minWidth: 0, gap: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 34, paddingHorizontal: 5, borderRadius: 8 },
  selected: { backgroundColor: c.secondary },
  ratingLabel: { fontFamily: 'Inter_600SemiBold', color: c.foreground, fontSize: 12 },
  track: { flex: 1, height: 6, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: c.primary },
  count: { minWidth: 18, textAlign: 'right', fontSize: 11, color: c.mutedForeground },
  all: { alignSelf: 'flex-end', paddingVertical: 8 },
  link: { fontSize: 12, color: c.primary, fontFamily: 'Inter_600SemiBold' },
  search: { ...s.input, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchText: { flex: 1, minWidth: 0, color: c.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, paddingVertical: 12 },
  sortHead: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
});