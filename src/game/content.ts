// Content & economy data (plan §5, §6). Tunable data, not logic. Remote config replaces ECON in the backend phase.
export const ECON = {
  roundCost: 2, dailyFree: 10, freeCap: 20, firstPurchaseBonus: 10, milestoneTokens: 5,
  packs: [
    { id: 'mini', name: 'Mini refill', tokens: 10, price: '$0.49', tag: 'Top up' },
    { id: 'pocket', name: 'Pocket pack', tokens: 30, price: '$0.99', tag: 'Popular' },
    { id: 'party', name: 'Party pack', tokens: 100, price: '$2.99', tag: 'Great value' },
    { id: 'mega', name: 'Mega pack', tokens: 250, price: '$5.99', tag: 'Best value' },
  ],
} as const;
export type PackId = (typeof ECON.packs)[number]['id'];

export type CupPattern = 'stripes' | 'dots' | 'waves' | 'checker' | null;
export interface CupDesign { id: string; name: string; price: number; rim: string; foot: string; pattern: CupPattern; alt: string }
export const CUPS: CupDesign[] = [
  { id: 'classic', name: 'Classic Clear', price: 0, rim: '#FFFFFF', foot: '#DCD6EA', pattern: null, alt: '#fff' },
  { id: 'sunset', name: 'Sunset Stripe', price: 120, rim: '#FFC857', foot: '#FF8A5B', pattern: 'stripes', alt: '#FFC857' },
  { id: 'polka', name: 'Polka Pop', price: 150, rim: '#A78BFA', foot: '#A78BFA', pattern: 'dots', alt: '#FFF9F1' },
  { id: 'wave', name: 'Wave Rider', price: 200, rim: '#45C6F2', foot: '#2E9FD0', pattern: 'waves', alt: '#FFFFFF' },
  { id: 'palm', name: 'Palm Leaf', price: 250, rim: '#A7D95B', foot: '#4E8C3A', pattern: 'stripes', alt: '#A7D95B' },
  { id: 'checker', name: 'Checkerboard', price: 300, rim: '#25233A', foot: '#25233A', pattern: 'checker', alt: '#FFF9F1' },
  { id: 'galaxy', name: 'Galaxy', price: 400, rim: '#7356D8', foot: '#2B2357', pattern: 'dots', alt: '#FFC857' },
  { id: 'gold', name: 'Gold Rush', price: 600, rim: '#F2B53A', foot: '#D99A1E', pattern: 'stripes', alt: '#FFE9A8' },
];

export interface Skin { id: string; name: string; price: number; body: string; deep: string; trim: string; metal: string }
export const SKINS: Skin[] = [
  { id: 'copper', name: 'Copper Classic', price: 0, body: '#EE8F5F', deep: '#B85A33', trim: '#FFF9F1', metal: '#DCD6CE' },
  { id: 'seafoam', name: 'Seafoam', price: 300, body: '#5FC9B8', deep: '#2C8C7E', trim: '#FFF9F1', metal: '#D7E5E2' },
  { id: 'midnight', name: 'Midnight Neon', price: 500, body: '#433D78', deep: '#26224F', trim: '#FF6B8A', metal: '#BDB8DC' },
];

export type ChallengeKey = 'perfect' | 'served' | 'layered' | 'cleanWin' | 'fastWin';
export const CHALLENGES: { id: string; text: string; goal: number; key: ChallengeKey; minLevel?: number }[] = [
  { id: 'perfect8', text: 'Make 8 perfect drinks', goal: 8, key: 'perfect' },
  { id: 'serve20', text: 'Serve 20 drinks', goal: 20, key: 'served' },
  { id: 'layers3', text: 'Complete 3 layered orders', goal: 3, key: 'layered', minLevel: 21 },
  { id: 'clean1', text: 'Win a round with no spills', goal: 1, key: 'cleanWin' },
  { id: 'fast1', text: 'Win a round with 15s left', goal: 1, key: 'fastWin' },
];

export const MACHINES = [
  { id: 'belt', name: 'Slush Line', blurb: 'Conveyor belt, up to three taps' },
  { id: 'spin', name: 'Spin Bar', blurb: 'The turntable, one nozzle, up to five flavours' },
  { id: 'blend', name: 'Blend Station', soon: true },
  { id: 'swirl', name: 'Swirl Tower', soon: true },
  { id: 'shave', name: 'Ice Shaver', soon: true },
] as const;

export const LOCATIONS = [
  { name: 'Beach Shack', open: true },
  { name: 'Ski Lodge', open: false },
  { name: 'Neon Arcade', open: false },
];

// Glassware tiers: a visual progression only. Never changes volumes, targets or hitboxes (plan §3.8).
export interface Glass { from: number; id: 'plastic' | 'clear' | 'soda' | 'shake'; name: string; tier: 0 | 1 | 2 | 3; blurb: string }
export const GLASS: Glass[] = [
  { from: 1, id: 'plastic', name: 'Plastic cups', tier: 0, blurb: 'Basic cups to get the shack started.' },
  { from: 11, id: 'clear', name: 'Clear cups', tier: 1, blurb: 'Crystal-clear cups. Now you can see every fleck of ice.' },
  { from: 31, id: 'soda', name: 'Frosted soda glasses', tier: 2, blurb: 'Tall, heavy-bottomed soda glasses that frost over as you pour.' },
  { from: 61, id: 'shake', name: 'Milkshake glasses', tier: 3, blurb: 'Proper soda-fountain milkshake glasses. Wafers included.' },
];
export const glassFor = (n: number) => GLASS.filter(g => g.from <= n).pop() ?? GLASS[0];

export function playerLevel(xp: number) {
  let lv = 1, need = 100, x = xp;
  while (x >= need) { x -= need; lv++; need = 100 + (lv - 1) * 40; }
  return { level: lv, into: x, need };
}
