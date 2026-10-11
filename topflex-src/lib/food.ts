import { supabase } from '@/lib/supabase';

export type FoodItem = {
  itemId: string;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  restaurantLogoUrl: string | null;
  restaurantCuisine: string;
  restaurantAddress: string | null;
  itemName: string;
  itemDescription: string | null;
  itemPrice: number;
  itemImageUrl: string | null;
  itemRating: number;
  itemReviewsCount: number;
  prepMinutes: number | null;
  salesCount: number;
  isSponsored: boolean;
  deliveryMinutes: number;
  deliveryFee: number | null;
  distanceKm: number | null;
  isOpen: boolean;
};

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  logoUrl: string | null;
  city: string | null;
  rating: number;
  reviewsCount: number;
  deliveryMinutes: number;
};

type Row = Record<string, unknown>;

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stringValue = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

const nullableString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : null;

export const formatFoodPrice = (value: number) =>
  'GH₵' + value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function loadFoodItems(search = '', location?: { latitude: number; longitude: number } | null): Promise<FoodItem[]> {
  const { data, error } = await supabase.rpc('food_marketplace', {
    _latitude: location?.latitude,
    _longitude: location?.longitude,
    _search: search.trim() || undefined,
    _category: undefined,
  });
  if (error) throw error;

  return ((data ?? []) as Row[]).map((row) => ({
    itemId: stringValue(row['item_id']),
    restaurantId: stringValue(row['restaurant_id']),
    restaurantSlug: stringValue(row['restaurant_slug']),
    restaurantName: stringValue(row['restaurant_name'], 'TopFlex restaurant'),
    restaurantLogoUrl: nullableString(row['restaurant_logo_url']),
    restaurantCuisine: stringValue(row['restaurant_cuisine'], 'Food & drinks'),
    restaurantAddress: nullableString(row['restaurant_address']),
    itemName: stringValue(row['item_name'], 'Menu item'),
    itemDescription: nullableString(row['item_description']),
    itemPrice: numberValue(row['item_price']),
    itemImageUrl: nullableString(row['item_image_url']),
    itemRating: numberValue(row['item_rating']),
    itemReviewsCount: numberValue(row['item_reviews_count']),
    prepMinutes: row['prep_minutes'] == null ? null : numberValue(row['prep_minutes']),
    salesCount: numberValue(row['sales_count']),
    isSponsored: row['is_sponsored'] === true,
    deliveryMinutes: numberValue(row['delivery_minutes']),
    deliveryFee: row['delivery_fee'] == null ? null : numberValue(row['delivery_fee']),
    distanceKm: row['distance_km'] == null ? null : numberValue(row['distance_km']),
    isOpen: row['is_open'] !== false,
  }));
}

export async function loadRestaurants(search = ''): Promise<RestaurantSummary[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, cuisine, logo_url, city, rating, reviews_count, delivery_minutes')
    .order('rating', { ascending: false });
  if (error) throw error;

  const term = search.trim().toLowerCase();
  return ((data ?? []) as Row[])
    .map((row) => ({
      id: stringValue(row['id']),
      name: stringValue(row['name'], 'TopFlex restaurant'),
      slug: stringValue(row['slug']),
      cuisine: stringValue(row['cuisine'], 'Food & drinks'),
      logoUrl: nullableString(row['logo_url']),
      city: nullableString(row['city']),
      rating: numberValue(row['rating']),
      reviewsCount: numberValue(row['reviews_count']),
      deliveryMinutes: numberValue(row['delivery_minutes']),
    }))
    .filter((restaurant) =>
      !term || [restaurant.name, restaurant.cuisine, restaurant.city ?? ''].join(' ').toLowerCase().includes(term),
    );
}