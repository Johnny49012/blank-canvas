/** Public review fields only. Sample test-mode reviews below; replace with a real review service later. */
export type RestaurantReview = {
  id: string;
  restaurantId: string;
  displayName: string;
  rating: number;
  text: string;
  createdAt: string;
  foodItem?: string;
  response?: string;
};
export type ReviewSort = 'recent' | 'high' | 'low';

// Sample test-mode reviews, kept separate from the catalogue's illustrative rating totals.
export const RESTAURANT_REVIEWS: readonly RestaurantReview[] = [
  { id: 'nk-1', restaurantId: 'nanas-kitchen', displayName: 'Ama S.', rating: 5, text: 'The jollof was smoky and the chicken was grilled perfectly. Delivery arrived faster than expected.', foodItem: 'Jollof Rice with Chicken', createdAt: '2026-10-08T18:20:00Z', response: 'Thank you, Ama! We are glad you enjoyed it.' },
  { id: 'nk-2', restaurantId: 'nanas-kitchen', displayName: 'Kwame O.', rating: 4, text: 'Good portion sizes and the shito had a nice kick. Packaging could be sturdier though.', foodItem: 'Jollof Rice with Beef', createdAt: '2026-10-05T13:05:00Z' },
  { id: 'nk-3', restaurantId: 'nanas-kitchen', displayName: 'Efua M.', rating: 5, text: 'Best fried rice in Osu. Tasted fresh and the egg was not overcooked.', foodItem: 'Fried Rice', createdAt: '2026-09-28T12:40:00Z' },
  { id: 'nk-4', restaurantId: 'nanas-kitchen', displayName: 'Yaw D.', rating: 3, text: 'Food was tasty but my order took almost an hour on a Friday night.', createdAt: '2026-09-20T20:15:00Z', response: 'Sorry about the wait, Yaw. We are adding more riders on weekends.' },
  { id: 'bh-1', restaurantId: 'burger-hub', displayName: 'Kofi A.', rating: 5, text: 'The beef burger was juicy and the fries were still crispy when they arrived.', foodItem: 'Beef Burger', createdAt: '2026-10-07T19:45:00Z' },
  { id: 'bh-2', restaurantId: 'burger-hub', displayName: 'Abena T.', rating: 4, text: 'Solid burgers for the price. The extra cheese is worth it.', foodItem: 'Beef Burger', createdAt: '2026-10-02T14:30:00Z' },
  { id: 'bh-3', restaurantId: 'burger-hub', displayName: 'Nana K.', rating: 2, text: 'My fries were cold and the burger bun was soggy this time.', foodItem: 'French Fries', createdAt: '2026-09-25T21:10:00Z', response: 'We apologise, Nana. Please reach out so we can make it right.' },
  { id: 'bh-4', restaurantId: 'burger-hub', displayName: 'Esi B.', rating: 4, text: 'Quick delivery to East Legon and the burger was still hot.', createdAt: '2026-09-18T17:55:00Z' },
  { id: 'cb-1', restaurantId: 'chop-bar', displayName: 'Akosua F.', rating: 5, text: 'The waakye tastes just like home. Generous with the gari and shito.', foodItem: 'Waakye', createdAt: '2026-10-06T11:20:00Z' },
  { id: 'cb-2', restaurantId: 'chop-bar', displayName: 'Kwadwo H.', rating: 5, text: 'Banku and tilapia was excellent. The pepper was fresh and fiery.', foodItem: 'Banku and Tilapia', createdAt: '2026-09-30T13:50:00Z' },
  { id: 'cb-3', restaurantId: 'chop-bar', displayName: 'Adwoa P.', rating: 4, text: 'Authentic local dishes at fair prices. Wish they opened on Sundays.', createdAt: '2026-09-22T12:05:00Z' },
  { id: 'jm-1', restaurantId: 'juice-more', displayName: 'Selorm W.', rating: 5, text: 'The pineapple juice was so fresh. Perfect for the Accra heat.', foodItem: 'Fresh Fruit Juice', createdAt: '2026-10-04T15:30:00Z' },
  { id: 'jm-2', restaurantId: 'juice-more', displayName: 'Nii L.', rating: 4, text: 'Good smoothies and quick delivery. A bit pricey for the size.', createdAt: '2026-09-27T10:15:00Z' },
  { id: 'jm-3', restaurantId: 'juice-more', displayName: 'Afia R.', rating: 3, text: 'Juice was fine but arrived slightly warm. Would prefer it chilled.', foodItem: 'Fresh Fruit Juice', createdAt: '2026-09-15T16:40:00Z' },
];
export function getRestaurantReviews(restaurantId: string) {
  return RESTAURANT_REVIEWS.filter((review) => review.restaurantId === restaurantId);
}
export function reviewSummary(reviews: readonly RestaurantReview[]) {
  const counts = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: reviews.filter((review) => review.rating === rating).length }));
  return { total: reviews.length, average: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null, counts };
}
export function filterReviews(reviews: readonly RestaurantReview[], query: string, rating: number | null, sort: ReviewSort) {
  const term = query.trim().toLowerCase();
  return reviews.filter((review) => (rating === null || review.rating === rating) && `${review.text} ${review.displayName} ${review.foodItem ?? ''}`.toLowerCase().includes(term))
    .sort((a, b) => (sort === 'high' ? b.rating - a.rating : sort === 'low' ? a.rating - b.rating : 0) || Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
}