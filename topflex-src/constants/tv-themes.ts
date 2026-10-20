import { gotvColors } from '@/constants/gotv-colors';
import { dstvColors } from '@/components/DstvHelp';

/**
 * Design tokens for the DStv and GOtv screens. Colours extend the palettes the help screens already use
 * (dstvColors / gotvColors) so the whole flow stays visually consistent.
 * Contrast notes (WCAG AA): white on primary and on deep >= 4.5:1 for both brands; GOtv accent (lime) is only
 * ever paired with the dark `accentText`; DStv accent (white) is paired with the DStv blue.
 */
export type TvTheme = {
  name: string;
  primary: string; deep: string; navy: string;
  accent: string; accentText: string; glow: string; line: string;
  light: string; bg: string; text: string; muted: string; border: string; white: string;
  red: string; redBg: string;
  subtitle: string; selected: string; heroTint: string; transparent: string;
  radius: { hero: number; card: number; button: number; chip: number };
};

export const dstvTheme: TvTheme = {
  name: 'DStv',
  primary: dstvColors.blue, deep: dstvColors.deep, navy: dstvColors.navy,
  accent: '#ffffff', accentText: dstvColors.blue, glow: '#5aa2ff', line: '#4da3ff',
  light: dstvColors.light, bg: dstvColors.bg, text: dstvColors.text, muted: dstvColors.muted,
  border: dstvColors.border, white: dstvColors.white, red: dstvColors.red, redBg: dstvColors.redBg,
  subtitle: '#d6e4ff', selected: '#f5f9ff', heroTint: 'rgba(0,30,90,0.6)', transparent: 'rgba(0,30,90,0)',
  radius: { hero: 22, card: 18, button: 14, chip: 20 },
};

export const gotvTheme: TvTheme = {
  name: 'GOtv',
  primary: gotvColors.blue, deep: gotvColors.deep, navy: gotvColors.navy,
  accent: gotvColors.lime, accentText: gotvColors.navy, glow: '#a8e063', line: gotvColors.lime,
  light: gotvColors.light, bg: gotvColors.bg, text: gotvColors.text, muted: gotvColors.muted,
  border: gotvColors.border, white: gotvColors.white, red: gotvColors.red, redBg: gotvColors.redBg,
  subtitle: gotvColors.subtitle, selected: gotvColors.selected, heroTint: gotvColors.heroTint, transparent: gotvColors.transparent,
  radius: { hero: 10, card: 10, button: 8, chip: 20 },
};
