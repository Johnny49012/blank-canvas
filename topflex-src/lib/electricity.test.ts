import { describe, expect, test } from 'bun:test';
import { maskMeter, validateElectricityForm } from './electricity';

describe('electricity form', () => {
  test('empty meter number is rejected', () => {
    expect(validateElectricityForm('', '20').meter).toBeDefined();
  });
  test('zero or negative amount is rejected', () => {
    expect(validateElectricityForm('0123456789', '0').amount).toBeDefined();
    expect(validateElectricityForm('0123456789', '-5').amount).toBeDefined();
  });
  test('valid meter and positive amount pass', () => {
    expect(validateElectricityForm('0123456789', '25.50')).toEqual({});
  });
  test('meter is masked except last 4', () => {
    expect(maskMeter('0123456789')).toBe('••••••6789');
  });
});
