// One source for every fact the site states. Values mirror the game (src/game/content.ts ECON, src/engine/levels.ts):
// change them there and here together.

export const site = {
  name: 'Rapid Slush',
  /** Who publishes it. Confirm this matches the Play Console developer name before the policies go live. */
  operator: 'Sello Software Solutions',
  /** The game's Google Play page (package com.rapidslush, app.json). */
  playUrl: 'https://play.google.com/store/apps/details?id=com.rapidslush',
  /** Policies' effective date. */
  updated: '16 November 2026',
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

export const economy = {
  roundCost: 2,
  dailyFree: 10,
  freeCap: 20,
  firstPurchaseBonus: 10,
  milestoneTokens: 5,
  /** Test prices from plan §5.3; the stores show the player's local price. */
  packs: [
    { name: 'Mini refill', tokens: 10, price: '$0.49' },
    { name: 'Pocket pack', tokens: 30, price: '$0.99' },
    { name: 'Party pack', tokens: 100, price: '$2.99' },
    { name: 'Mega pack', tokens: 250, price: '$5.99' },
  ],
} as const;

export const policies = [
  { href: '/privacy/', label: 'Privacy' },
  { href: '/terms/', label: 'Terms' },
  { href: '/purchases/', label: 'Purchases and refunds' },
  { href: '/delete-data/', label: 'Delete your data' },
] as const;
