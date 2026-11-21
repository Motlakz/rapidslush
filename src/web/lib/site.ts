// One source for every fact the site states. Values mirror the game (src/game/content.ts ECON, src/engine/levels.ts):
// change them there and here together.

export const site = {
  name: 'Rapid Slush',
  /** Who publishes it. Confirm this matches the Play Console developer name before the policies go live. */
  operator: 'Sello Software Solutions',
  /** The game's Google Play page (package com.rapidslush, app.json). */
  playUrl: 'https://play.google.com/store/apps/details?id=com.rapidslush',
  /** Policies' effective date. */
  updated: '20 November 2026',
} as const;

export const game = {
  beltLevels: 100,
  spinLevels: 30,
  spinUnlock: 15,
  flavours: ['Berry', 'Blue Razz', 'Lime', 'Mango', 'Grape', 'Cola'],
  toppings: ['Whip', 'Sprinkles', 'Boba', 'Cherry'],
  cups: 8,
  skins: 3,
} as const;

/** Lives and coins (src/game/content.ts LIVES, since 2026-11-20). Nothing in the game is sold. */
export const lives = {
  max: 5,
  refillMinutes: 20,
  refillCoins: 150,
  /** first clear of every 5th level */
  milestoneCoins: 25,
  /** the daily challenge pays coins plus one life */
  challengeCoins: 40,
} as const;

/** Anonymous analytics in the app (src/services/posthog.ts): who runs it and where. */
export const analytics = {
  provider: 'PostHog',
  region: 'the United States',
  privacyUrl: 'https://posthog.com/privacy',
} as const;

export const policies = [
  { href: '/privacy/', label: 'Privacy' },
  { href: '/terms/', label: 'Terms' },
  { href: '/purchases/', label: 'Purchases' },
  { href: '/delete-data/', label: 'Delete your data' },
] as const;
