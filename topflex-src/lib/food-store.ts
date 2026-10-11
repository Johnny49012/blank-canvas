import { useSyncExternalStore } from 'react';
import { getWalletSandboxState, recordWalletSandboxMovement } from '@/lib/wallet-sandbox';

/* ---------- Catalogue (frontend-only sample data) ---------- */

export const FOOD_IMAGES = {
  jollof: require('../src/assets/food/jollof.jpg'),
  burger: require('../src/assets/food/burger.jpg'),
  local: require('../src/assets/food/local.jpg'),
  drinks: require('../src/assets/food/drinks.jpg'),
};
export type FoodImageKey = keyof typeof FOOD_IMAGES;

export type FoodCategory = 'Local Dishes' | 'Fast Food' | 'Rice Dishes' | 'Pizza' | 'Burgers' | 'Chicken' | 'Snacks' | 'Drinks' | 'Desserts';
export const FOOD_CATEGORIES: { key: 'All' | FoodCategory; icon: string }[] = [
  { key: 'All', icon: 'apps-outline' },
  { key: 'Local Dishes', icon: 'restaurant-outline' },
  { key: 'Fast Food', icon: 'fast-food-outline' },
  { key: 'Rice Dishes', icon: 'nutrition-outline' },
  { key: 'Pizza', icon: 'pizza-outline' },
  { key: 'Burgers', icon: 'fast-food-outline' },
  { key: 'Chicken', icon: 'flame-outline' },
  { key: 'Snacks', icon: 'cafe-outline' },
  { key: 'Drinks', icon: 'beer-outline' },
  { key: 'Desserts', icon: 'ice-cream-outline' },
];

export type Restaurant = {
  id: string; name: string; cuisine: string; image: FoodImageKey; isOpen: boolean;
  deliveryMinutes: number | null; deliveryFee: number | null; rating: number | null; reviews: number | null;
  description: string; area: string; hours: string;
};
export type OptionChoice = { id: string; label: string; price: number };
export type MenuItem = {
  id: string; restaurantId: string; name: string; description: string; price: number; image: FoodImageKey;
  categories: FoodCategory[]; available: boolean; popularity: number; rating: number | null; reviews: number | null;
  portions?: OptionChoice[]; extras?: OptionChoice[];
};

export const RESTAURANTS: Restaurant[] = [
  { id: 'nanas-kitchen', name: "Nana's Kitchen", cuisine: 'Ghanaian · Rice Dishes', image: 'jollof', isOpen: true, deliveryMinutes: 30, deliveryFee: 8, rating: 4.5, reviews: 245, description: 'Authentic Ghanaian dishes made with fresh, local ingredients.', area: 'Osu, Accra', hours: 'Daily 9:00 AM – 10:00 PM' },
  { id: 'burger-hub', name: 'Burger Hub', cuisine: 'Burgers · Fast Food', image: 'burger', isOpen: true, deliveryMinutes: 25, deliveryFee: 10, rating: 4.3, reviews: 189, description: 'Flame-grilled burgers, crispy fries and chicken.', area: 'East Legon, Accra', hours: 'Daily 11:00 AM – 11:00 PM' },
  { id: 'chop-bar', name: 'Auntie Akos Chop Bar', cuisine: 'Local Dishes', image: 'local', isOpen: false, deliveryMinutes: 40, deliveryFee: 7, rating: 4.6, reviews: 312, description: 'Banku, waakye and soups cooked the traditional way.', area: 'Madina, Accra', hours: 'Mon – Sat 7:00 AM – 6:00 PM' },
  { id: 'juice-more', name: 'Juice & More', cuisine: 'Drinks · Snacks', image: 'drinks', isOpen: true, deliveryMinutes: 20, deliveryFee: 6, rating: 4.2, reviews: 96, description: 'Freshly squeezed juices, smoothies and chilled drinks.', area: 'Airport Residential, Accra', hours: 'Daily 8:00 AM – 9:00 PM' },
];

const ricePortions: OptionChoice[] = [{ id: 'regular', label: 'Regular', price: 0 }, { id: 'large', label: 'Large', price: 10 }];
export const MENU: MenuItem[] = [
  { id: 'jollof-chicken', restaurantId: 'nanas-kitchen', name: 'Jollof Rice with Chicken', description: 'Spiced tomato jollof with grilled chicken and salad.', price: 45, image: 'jollof', categories: ['Rice Dishes', 'Local Dishes', 'Chicken'], available: true, popularity: 98, rating: 4.6, reviews: 128, portions: ricePortions, extras: [{ id: 'extra-chicken', label: 'Extra Chicken', price: 15 }, { id: 'plantain', label: 'Plantain', price: 5 }] },
  { id: 'jollof-beef', restaurantId: 'nanas-kitchen', name: 'Jollof Rice with Beef', description: 'Smoky jollof rice served with tender stewed beef.', price: 48, image: 'jollof', categories: ['Rice Dishes', 'Local Dishes'], available: true, popularity: 80, rating: 4.4, reviews: 76, portions: ricePortions, extras: [{ id: 'plantain', label: 'Plantain', price: 5 }] },
  { id: 'fried-rice', restaurantId: 'nanas-kitchen', name: 'Fried Rice', description: 'Vegetable fried rice with egg and shito on the side.', price: 40, image: 'jollof', categories: ['Rice Dishes'], available: true, popularity: 70, rating: 4.3, reviews: 54, portions: ricePortions },
  { id: 'waakye', restaurantId: 'chop-bar', name: 'Waakye', description: 'Rice and beans with gari, spaghetti, egg and shito.', price: 35, image: 'local', categories: ['Local Dishes', 'Rice Dishes'], available: true, popularity: 90, rating: 4.7, reviews: 201, extras: [{ id: 'egg', label: 'Extra Egg', price: 3 }, { id: 'fish', label: 'Fried Fish', price: 12 }] },
  { id: 'banku-tilapia', restaurantId: 'chop-bar', name: 'Banku and Tilapia', description: 'Grilled tilapia with banku and fresh pepper.', price: 75, image: 'local', categories: ['Local Dishes'], available: true, popularity: 85, rating: 4.8, reviews: 167 },
  { id: 'beef-burger', restaurantId: 'burger-hub', name: 'Beef Burger', description: 'Grilled beef patty, cheddar, lettuce and tomato.', price: 35, image: 'burger', categories: ['Burgers', 'Fast Food'], available: true, popularity: 88, rating: 4.4, reviews: 87, extras: [{ id: 'cheese', label: 'Extra Cheese', price: 5 }, { id: 'bacon', label: 'Beef Bacon', price: 8 }] },
  { id: 'chicken-burger', restaurantId: 'burger-hub', name: 'Chicken Burger', description: 'Crispy fried chicken fillet with spicy mayo.', price: 38, image: 'burger', categories: ['Burgers', 'Fast Food', 'Chicken'], available: false, popularity: 75, rating: 4.2, reviews: 61 },
  { id: 'fries', restaurantId: 'burger-hub', name: 'French Fries', description: 'Golden, crispy and lightly salted.', price: 15, image: 'burger', categories: ['Snacks', 'Fast Food'], available: true, popularity: 82, rating: 4.1, reviews: 40, portions: [{ id: 'regular', label: 'Regular', price: 0 }, { id: 'large', label: 'Large', price: 6 }] },
  { id: 'fruit-juice', restaurantId: 'juice-more', name: 'Fresh Fruit Juice', description: 'Freshly squeezed orange or pineapple juice.', price: 15, image: 'drinks', categories: ['Drinks'], available: true, popularity: 78, rating: 4.7, reviews: 64 },
  { id: 'water', restaurantId: 'juice-more', name: 'Bottled Water', description: 'Chilled 750ml bottled water.', price: 5, image: 'drinks', categories: ['Drinks'], available: true, popularity: 60, rating: null, reviews: null },
];

export const getRestaurant = (id?: string) => RESTAURANTS.find((r) => r.id === id);
export const getMenuItem = (id?: string) => MENU.find((m) => m.id === id);
export const formatGHS = (v: number) => 'GH₵' + v.toFixed(2);
export const SERVICE_FEE_RATE = 0.02;

export function searchMenu(query: string, category: 'All' | FoodCategory = 'All') {
  const q = query.trim().toLowerCase();
  return MENU.filter((m) => {
    const r = getRestaurant(m.restaurantId);
    const matchQ = !q || `${m.name} ${m.description} ${r?.name ?? ''}`.toLowerCase().includes(q);
    return matchQ && (category === 'All' || m.categories.includes(category));
  });
}

/* ---------- Cart & orders (local session store) ---------- */

export type CartLine = { key: string; itemId: string; portionId?: string; extraIds: string[]; qty: number; note?: string };
export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'out' | 'delivered';
export type OrderLine = { name: string; detail: string; qty: number; unit: number };
export type Order = {
  id: string; restaurantId: string; lines: OrderLine[]; itemTotal: number; deliveryFee: number; serviceFee: number; total: number;
  address: string; instructions?: string; paymentMethod: string; paymentStatus: 'paid' | 'pending'; status: OrderStatus;
  timeline: Partial<Record<OrderStatus, string>>; createdAt: string; etaMinutes: number | null;
};

type State = { cart: CartLine[]; orders: Order[]; addresses: string[]; confirmedAddress: string | null };
let state: State = { cart: [], orders: [], addresses: ['Home · 123 Liberation Road, Airport, Accra'], confirmedAddress: null };
const listeners = new Set<() => void>();
const KEY = 'topflex-food';
try { if (typeof localStorage !== 'undefined') { const s = localStorage.getItem(KEY); if (s) state = { ...state, ...JSON.parse(s) }; } } catch { /* ignore */ }
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
};
export const useFoodStore = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => state);

export function unitPrice(item: MenuItem, portionId?: string, extraIds: string[] = []) {
  const portion = item.portions?.find((p) => p.id === portionId)?.price ?? 0;
  const extras = (item.extras ?? []).filter((e) => extraIds.includes(e.id)).reduce((s, e) => s + e.price, 0);
  return item.price + portion + extras;
}
export function lineDetail(line: Pick<CartLine, 'itemId' | 'portionId' | 'extraIds'>) {
  const item = getMenuItem(line.itemId);
  const parts = [item?.portions?.find((p) => p.id === line.portionId)?.label, ...(item?.extras ?? []).filter((e) => line.extraIds.includes(e.id)).map((e) => e.label)];
  return parts.filter(Boolean).join(', ');
}

export function addToCart(itemId: string, opts: { portionId?: string; extraIds?: string[]; qty?: number; note?: string } = {}) {
  const item = getMenuItem(itemId);
  const restaurant = getRestaurant(item?.restaurantId);
  if (!item || !item.available) throw new Error('This item is currently unavailable.');
  if (!restaurant?.isOpen) throw new Error(`${restaurant?.name ?? 'This restaurant'} is closed right now.`);
  const portionId = opts.portionId ?? item.portions?.[0]?.id;
  const extraIds = [...(opts.extraIds ?? [])].sort();
  const key = `${itemId}|${portionId ?? ''}|${extraIds.join(',')}|${opts.note ?? ''}`;
  const existing = state.cart.find((l) => l.key === key);
  const qty = Math.max(1, opts.qty ?? 1);
  set({ cart: existing ? state.cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) : [...state.cart, { key, itemId, portionId, extraIds, qty, note: opts.note }] });
}
export const setQty = (key: string, qty: number) => set({ cart: qty <= 0 ? state.cart.filter((l) => l.key !== key) : state.cart.map((l) => (l.key === key ? { ...l, qty } : l)) });
export const clearCart = () => set({ cart: [] });
export const addAddress = (a: string) => set({ addresses: [a, ...state.addresses.filter((x) => x !== a)] });
export function confirmFoodAddress(address: string) {
  const value = address.trim();
  if (value.length < 8) throw new Error('Please enter a valid delivery address.');
  set({ confirmedAddress: value, addresses: [value, ...state.addresses.filter((a) => a !== value)] });
  return value;
}

/** Groups cart by restaurant – each restaurant is delivered and charged its own delivery fee. */
export function cartSummary(cart: CartLine[]) {
  const groups = RESTAURANTS.map((r) => {
    const lines = cart.filter((l) => getMenuItem(l.itemId)?.restaurantId === r.id);
    const itemTotal = lines.reduce((s, l) => { const it = getMenuItem(l.itemId); return s + (it ? unitPrice(it, l.portionId, l.extraIds) * l.qty : 0); }, 0);
    return { restaurant: r, lines, itemTotal, deliveryFee: lines.length ? r.deliveryFee ?? 0 : 0 };
  }).filter((g) => g.lines.length);
  const itemTotal = groups.reduce((s, g) => s + g.itemTotal, 0);
  const deliveryFee = groups.reduce((s, g) => s + g.deliveryFee, 0);
  const serviceFee = Math.round(itemTotal * SERVICE_FEE_RATE * 100) / 100;
  return { groups, itemTotal, deliveryFee, serviceFee, total: itemTotal + deliveryFee + serviceFee };
}

export const PAYMENT_METHODS = [
  { id: 'wallet', label: 'TopFlex Wallet', supported: true },
  { id: 'momo', label: 'MTN Mobile Money', supported: false },
  { id: 'card', label: 'Card payment', supported: false },
] as const;

let placing = false;
/** Re-validates availability and recalculates totals from the catalogue before charging the wallet simulation. */
export function placeOrder(address: string, instructions: string, paymentMethod: string): Order[] {
  if (placing) throw new Error('Your order is already being placed.');
  if (address.trim().length < 8) throw new Error('Please enter a valid delivery address.');
  if (!state.cart.length) throw new Error('Your cart is empty.');
  const method = PAYMENT_METHODS.find((m) => m.id === paymentMethod);
  if (!method?.supported) throw new Error('That payment method is not available yet.');
  for (const l of state.cart) {
    const it = getMenuItem(l.itemId);
    if (!it?.available) throw new Error(`${it?.name ?? 'An item'} is no longer available. Remove it to continue.`);
    if (!getRestaurant(it.restaurantId)?.isOpen) throw new Error(`${getRestaurant(it.restaurantId)?.name} has closed. Remove its items to continue.`);
  }
  const summary = cartSummary(state.cart);
  if (summary.total > getWalletSandboxState().balance) throw new Error('Insufficient wallet balance.');
  placing = true;
  try {
    recordWalletSandboxMovement({ kind: 'transfer', amount: summary.total, detail: `Food order · ${summary.groups.map((g) => g.restaurant.name).join(', ')}` });
    const now = new Date().toISOString();
    const orders: Order[] = summary.groups.map((g, i) => {
      const serviceFee = Math.round(g.itemTotal * SERVICE_FEE_RATE * 100) / 100;
      return {
        id: `TFD${Date.now().toString().slice(-6)}${i}`, restaurantId: g.restaurant.id,
        lines: g.lines.map((l) => { const it = getMenuItem(l.itemId)!; return { name: it.name, detail: lineDetail(l), qty: l.qty, unit: unitPrice(it, l.portionId, l.extraIds) }; }),
        itemTotal: g.itemTotal, deliveryFee: g.deliveryFee, serviceFee, total: g.itemTotal + g.deliveryFee + serviceFee,
        address, instructions, paymentMethod: method.label, paymentStatus: 'paid', status: 'placed', timeline: { placed: now }, createdAt: now, etaMinutes: g.restaurant.deliveryMinutes,
      };
    });
    set({ orders: [...orders, ...state.orders], cart: [] });
    return orders;
  } finally { placing = false; }
}

export const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Order Placed' }, { key: 'accepted', label: 'Restaurant Accepted' }, { key: 'preparing', label: 'Preparing Order' },
  { key: 'ready', label: 'Ready for Pickup' }, { key: 'out', label: 'Out for Delivery' }, { key: 'delivered', label: 'Delivered' },
];
/** Test-mode helper: advance a simulated order to its next status. */
export function advanceOrder(id: string) {
  set({ orders: state.orders.map((o) => {
    if (o.id !== id) return o;
    const idx = ORDER_STEPS.findIndex((s) => s.key === o.status);
    const next = ORDER_STEPS[Math.min(idx + 1, ORDER_STEPS.length - 1)].key;
    return { ...o, status: next, timeline: { ...o.timeline, [next]: o.timeline[next] ?? new Date().toISOString() } };
  }) });
}
