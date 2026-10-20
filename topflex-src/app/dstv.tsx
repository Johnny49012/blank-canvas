import React from 'react';
import { TvServiceScreen, TvConfig, TvPackage } from '@/components/tv/TvServiceScreen';
import { DstvHelp } from '@/components/DstvHelp';
import { dstvTheme } from '@/constants/tv-themes';

const HERO = require('../src/assets/dstv-hero.png');

// Ghana decoder package prices published on dstv.com/en-gh (checked Oct 2026).
// Replace with the provider API price list once a DStv/MultiChoice integration is connected.
const PACKAGES: TvPackage[] = [
  { id: 'padi', name: 'DStv Padi', price: 58, desc: 'Local content on Akwaaba Magic Abusua, drama series, soaps and international news.', tags: ['entertainment'] },
  { id: 'access', name: 'DStv Access', price: 98, desc: 'Africa Magic Epic and M-Net Movies, selected Premier League matches, kids channels.', tags: ['movies', 'sports', 'entertainment'] },
  { id: 'family', name: 'DStv Family', price: 188, desc: 'Entertainment for the whole family, lifestyle, music and selected Premier League matches.', tags: ['entertainment', 'sports'] },
  { id: 'compact', name: 'DStv Compact', price: 375, desc: 'Premier League, FA Cup, Carabao Cup, international movies and series, all kids channels.', tags: ['sports', 'movies', 'entertainment'] },
  { id: 'compact-plus', name: 'DStv Compact Plus', price: 563, desc: 'Champions League football, UFC & NBA, documentaries, international series and movies.', tags: ['sports', 'movies', 'entertainment'] },
  { id: 'premium', name: 'DStv Premium', price: 854, desc: 'Latest blockbuster movies, award-winning series and the complete SuperSport offering.', tags: ['sports', 'movies', 'entertainment'] },
];

const config: TvConfig = {
  theme: dstvTheme,
  // logo: require('../src/assets/dstv-logo.png'), // add an approved official logo file here when you have one
  wordmark: 'DStv',
  wordmarkSpacing: -1,
  hero: HERO,
  heroAlt: 'DStv sports, movies and family shows',
  heroFit: 'contain',
  heroImageStyle: { position: 'absolute', right: -20, bottom: 0, width: '78%', height: '100%' },
  heroTitle: 'DStv Subscriptions',
  heroText: 'Manage your account and enjoy uninterrupted entertainment.',
  ticker: ['Sports', 'Movies', 'Series', 'Kids', 'News', 'Music'],
  idLabel: 'Smartcard Number',
  idPlaceholder: 'e.g. 1234 5678 9012',
  idMaxLength: 15,
  idMinDigits: 10,
  idMaxDigits: 12,
  idError: 'Enter a valid 10–12 digit smartcard number.',
  idInfo: 'Find your smartcard number on the back of your decoder card, on your DStv account, or press the Info button on your remote.',
  manageSub: 'Enter your smartcard number, then choose what you need.',
  verifySub: 'Enter your smartcard number to get started.',
  renewSub: 'Verify your smartcard to renew.',
  helpSub: 'DStv guides, FAQs and TopFlex support.',
  manageActions: [
    { icon: 'person-circle-outline', label: 'Account Status', sub: 'See your package and due date.' },
    { icon: 'flash-outline', label: 'Clear Error E16', sub: 'Channels scrambled after renewing.' },
    { icon: 'card-outline', label: 'Clear Error E32', sub: 'Smartcard or decoder not activated.' },
    { icon: 'radio-outline', label: 'Refresh Signal', sub: 'Reconnect your decoder to DStv.' },
  ],
  verifyDelayMs: 900,
  packages: PACKAGES,
  priceSource: 'Prices from dstv.com/en-gh, Oct 2026',
  priceNote: 'Final price is confirmed by DStv at payment.',
  packagesFlow: 'confirm',
  packagesCtaLabel: (name) => `Continue with ${name}`,
  feesValue: 'Not confirmed',
  Help: DstvHelp,
};

export default function DstvScreen() {
  return <TvServiceScreen cfg={config} />;
}
