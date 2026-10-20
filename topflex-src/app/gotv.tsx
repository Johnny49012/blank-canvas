import React from 'react';
import { TvServiceScreen, TvConfig, TvPackage } from '@/components/tv/TvServiceScreen';
import { GotvHelp } from '@/components/GotvHelp';
import { gotvTheme } from '@/constants/tv-themes';
import HERO from '../src/assets/gotv-hero.jpg';

// Official GOtv Ghana compare-package prices checked 12 October 2026.
const PACKAGES: TvPackage[] = [
  { id: 'lite', name: 'GOtv Lite', price: 29, desc: '20+ channels · local entertainment and news.', tags: ['entertainment'] },
  { id: 'value', name: 'GOtv Value', price: 48, desc: '30+ channels · local favourites and family viewing.', tags: ['entertainment'] },
  { id: 'plus', name: 'GOtv Plus', price: 98, desc: '45+ channels · movies, entertainment and selected sport.', tags: ['entertainment', 'movies', 'sports'] },
  { id: 'max', name: 'GOtv Max', price: 173, desc: '55+ channels · more entertainment, movies and sport.', tags: ['entertainment', 'movies', 'sports'] },
  { id: 'supa', name: 'GOtv Supa', price: 227, desc: '70+ channels · a wider choice of family entertainment.', tags: ['entertainment', 'movies', 'sports'] },
  { id: 'supa-plus', name: 'GOtv Supa+', price: 295, desc: '75+ channels · the largest GOtv Ghana channel selection.', tags: ['entertainment', 'movies', 'sports'] },
];

const config: TvConfig = {
  theme: gotvTheme,
  // logo: require('../src/assets/gotv-logo.png'), // add an approved official logo file here when you have one
  wordmark: 'GOtv',
  wordmarkSplit: 2,
  wordmarkSpacing: 0,
  hero: typeof HERO === 'string' ? { uri: HERO } : HERO,
  heroAlt: 'Family enjoying television together',
  heroFit: 'cover',
  heroImageStyle: { position: 'absolute', right: 0, bottom: 0, width: '100%', height: '100%' },
  heroTitle: 'GOtv Subscriptions',
  heroText: 'Your favourite shows. Your family. Your GOtv.',
  ticker: ['Entertainment', 'News', 'Family viewing', 'Movies', 'Sport'],
  idLabel: 'IUC Number',
  idPlaceholder: 'e.g. 1234 5678 90',
  idMaxLength: 12,
  idMinDigits: 10,
  idMaxDigits: 10,
  idError: 'Enter a valid 10-digit IUC number.',
  idInfo: 'Find your IUC number on the label underneath your GOtv decoder. Enter all 10 digits without spaces.',
  manageSub: 'Enter your IUC number, then choose what you need.',
  verifySub: 'Enter your IUC number to get started.',
  renewSub: 'Verify your IUC to renew.',
  helpSub: 'GOtv guides, FAQs and TopFlex support.',
  manageActions: [
    { icon: 'person-circle-outline', label: 'Account Status', sub: 'See your package and due date.' },
    { icon: 'flash-outline', label: 'Clear Error E16', sub: 'Channels scrambled after renewing.' },
    { icon: 'card-outline', label: 'Clear Error E30', sub: 'Checking subscription status.' },
    { icon: 'radio-outline', label: 'Refresh Signal', sub: 'Reconnect your decoder to GOtv.' },
  ],
  verifyDelayMs: 0,
  packages: PACKAGES,
  priceSource: 'GOtv Ghana published prices · checked 12 Oct 2026',
  priceNote: 'Channel availability and final prices require confirmation before a live renewal.',
  packagesFlow: 'verify',
  packagesCtaLabel: (name) => `Verify IUC for ${name}`,
  feesValue: 'Not confirmed',
  Help: GotvHelp,
};

export default function GotvScreen() {
  return <TvServiceScreen cfg={config} />;
}
