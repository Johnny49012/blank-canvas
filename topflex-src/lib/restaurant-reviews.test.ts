import { describe, expect, test } from 'bun:test';
import { filterReviews, getFoodItemReviews, getRestaurantReviews, reviewSummary, type RestaurantReview } from './restaurant-reviews';

const records: RestaurantReview[] = [
  { id: 'a', restaurantId: 'one', displayName: 'Customer A', rating: 5, text: 'Fresh food', foodItem: 'Rice', createdAt: '2026-10-01T12:00:00Z' },
  { id: 'b', restaurantId: 'one', displayName: 'Customer B', rating: 3, text: 'Good lunch', createdAt: '2026-10-02T12:00:00Z' },
  { id: 'c', restaurantId: 'two', displayName: 'Customer C', rating: 1, text: 'Cold food', createdAt: '2026-10-03T12:00:00Z' },
];
describe('restaurant review presentation', () => {
  test('returns only reviews for the requested restaurant', () => {
    expect(getRestaurantReviews('nanas-kitchen').every((r) => r.restaurantId === 'nanas-kitchen')).toBe(true);
    expect(getRestaurantReviews('nanas-kitchen').length).toBeGreaterThan(0);
    expect(getRestaurantReviews('missing')).toEqual([]);
    expect(reviewSummary([]).average).toBeNull();
  });
  test('calculates summary from the complete supplied records', () => {
    const summary = reviewSummary(records.slice(0, 2));
    expect(summary.total).toBe(2);
    expect(summary.average).toBe(4);
    expect(summary.counts.map((row) => row.count)).toEqual([1, 0, 1, 0, 0]);
  });
  test('combines text, reviewer, item search and rating filtering', () => {
    expect(filterReviews(records, 'rice', 5, 'recent').map((row) => row.id)).toEqual(['a']);
    expect(filterReviews(records, 'Customer B', null, 'recent').map((row) => row.id)).toEqual(['b']);
    expect(filterReviews(records, 'rice', 3, 'recent')).toEqual([]);
  });
  test('sorts newest, highest and lowest ratings', () => {
    expect(filterReviews(records, '', null, 'recent').map((row) => row.id)).toEqual(['c', 'b', 'a']);
    expect(filterReviews(records, '', null, 'high').map((row) => row.id)).toEqual(['a', 'b', 'c']);
    expect(filterReviews(records, '', null, 'low').map((row) => row.id)).toEqual(['c', 'b', 'a']);
  });
  test('returns only reviews for the requested restaurant and food item', () => {
    expect(getFoodItemReviews('burger-hub', 'Beef Burger').every((r) => r.restaurantId === 'burger-hub' && r.foodItem === 'Beef Burger')).toBe(true);
    expect(getFoodItemReviews('nanas-kitchen', 'fried rice').length).toBe(1);
    expect(getFoodItemReviews('nanas-kitchen', 'Waakye')).toEqual([]);
  });
});