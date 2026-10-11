import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pager, c, s } from './FoodUI';
import { getFoodItemReviews, getRestaurantReviews, type RestaurantReview } from '@/lib/restaurant-reviews';

export function ReviewStars({ rating }: { rating: number }) {
  return <View style={rs.stars} accessibilityLabel={`${rating.toFixed(1)} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => <Ionicons key={star} name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline'} size={15} color={c.primary} />)}
  </View>;
}

export function ReviewCard({ review, preview = false }: { review: RestaurantReview; preview?: boolean }) {
  return <View style={[s.card, preview && rs.preview]}>
    <View style={rs.identity}>
      <View style={rs.avatar}><Ionicons name="person-outline" size={20} color={c.primary} /></View>
      <View style={rs.customer}><Text style={s.rowTitle} numberOfLines={1}>{review.displayName}</Text><Text style={s.rowMeta}>{new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text></View>
    </View>
    <ReviewStars rating={review.rating} />
    <Text style={rs.text} numberOfLines={preview ? 3 : undefined}>{review.text}</Text>
    {review.foodItem && <Text style={s.rowMeta} numberOfLines={preview ? 1 : undefined}>{review.foodItem}</Text>}
    {!preview && review.response && <View style={rs.response}><Text style={s.sumV}>Restaurant Response</Text><Text style={rs.text}>{review.response}</Text></View>}
  </View>;
}

export function ReviewsEmpty() {
  return <View style={s.empty}><Ionicons name="chatbubbles-outline" size={30} color={c.mutedForeground} /><Text style={s.emptyTitle}>No Reviews Yet</Text><Text style={s.emptyText}>Be the first eligible customer to share your experience.</Text></View>;
}

export function RestaurantReviewsPreview({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const reviews = getRestaurantReviews(restaurantId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);
  return <View style={rs.section}>
    <View style={rs.heading}>
      <Text style={[s.section, rs.headingText]}>Ratings & Reviews</Text>
      <Pressable accessibilityRole="link" accessibilityLabel="See all restaurant ratings and reviews" hitSlop={8} onPress={() => router.push({ pathname: '/food-reviews', params: { id: restaurantId } })}><Text style={rs.link}>See All</Text></Pressable>
    </View>
    {reviews.length ? <Pager data={reviews} perPage={2} label="Customer review rows" render={(review) => <ReviewCard key={review.id} review={review} preview />} /> : <ReviewsEmpty />}
  </View>;
}

export function FoodItemReviewsPreview({ restaurantId, itemName }: { restaurantId: string; itemName: string }) {
  const router = useRouter();
  const reviews = getFoodItemReviews(restaurantId, itemName).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);
  return <View style={rs.section}>
    <View style={rs.heading}>
      <Text style={[s.section, rs.headingText]}>Ratings & Reviews</Text>
      <Pressable accessibilityRole="link" accessibilityLabel="See all ratings and reviews for this item" hitSlop={8} onPress={() => router.push({ pathname: '/food-reviews', params: { id: restaurantId, item: itemName } })}><Text style={rs.link}>See All</Text></Pressable>
    </View>
    {reviews.length ? <Pager data={reviews} perPage={2} label="Food item review rows" render={(review) => <ReviewCard key={review.id} review={review} preview />} /> : <ReviewsEmpty />}
  </View>;
}

const rs = StyleSheet.create({
  section: { gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingText: { flex: 1, minWidth: 0 },
  link: { color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 12, flexShrink: 0 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  customer: { flex: 1, minWidth: 0 },
  stars: { flexDirection: 'row', gap: 3 },
  text: { color: c.foreground, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21 },
  preview: { height: 184, overflow: 'hidden' },
  response: { borderTopWidth: 1, borderColor: c.border, paddingTop: 12, gap: 6 },
});