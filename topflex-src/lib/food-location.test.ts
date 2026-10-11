import { describe, expect, mock, test } from 'bun:test';
mock.module('../src/assets/food/jollof.jpg', () => ({ default: 1 }));
mock.module('../src/assets/food/burger.jpg', () => ({ default: 2 }));
mock.module('../src/assets/food/local.jpg', () => ({ default: 3 }));
mock.module('../src/assets/food/drinks.jpg', () => ({ default: 4 }));
const { confirmFoodAddress } = await import('./food-store');

describe('delivery address confirmation', () => {
  test('confirms the entered address without substituting a location', () => {
    const saved = new Map<string, string>();
    const original = globalThis.localStorage;
    globalThis.localStorage = { setItem: (key: string, value: string) => saved.set(key, value) } as Storage;
    expect(confirmFoodAddress('  12 Oxford Street, Osu, Accra  ')).toBe('12 Oxford Street, Osu, Accra');
    const state = JSON.parse(saved.get('topflex-food') ?? '{}');
    expect(state.confirmedAddress).toBe('12 Oxford Street, Osu, Accra');
    expect(state.addresses[0]).toBe('12 Oxford Street, Osu, Accra');
    globalThis.localStorage = original;
  });
  test('rejects an incomplete address', () => {
    expect(() => confirmFoodAddress('Osu')).toThrow('Please enter a valid delivery address.');
  });
});