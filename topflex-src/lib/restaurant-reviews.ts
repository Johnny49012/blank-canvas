/** Public review fields only. No sample reviews: the app has no review service yet. */
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

// Kept separate from the catalogue's illustrative rating totals.
export const RESTAURANT_REVIEWS: readonly RestaurantReview[] = [];
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