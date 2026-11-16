import { CFG } from './constants';
import type { LevelConfig, Mix, Tune } from './types';

export interface ScheduleEntry {
  n: number;
  key: string;
  name: string;
  isNew: string;
  intro: string;
  topping?: number;
  flavour?: number;
}

// Slush Line progression (plan §4.2, stretched to 100 levels): one new idea at a time, practice levels in between.
// Single flavour carries the first chapters; layers arrive at 20, three layers at 34. Add rows to extend.
export const SCHEDULE: ScheduleEntry[] = [
  { n: 1, key: 'pour', name: 'First Pour', isNew: 'Hold to pour', intro: 'Hold the tap to pour. The flow speeds up the longer you hold, and a little keeps dripping after you let go. Let go so the slush settles inside the band.' },
  { n: 2, key: 'perfect', name: 'Steady Hand', isNew: 'Perfect pours', intro: 'Land close to the middle line for a Perfect. Perfects in a row build your combo.' },
  { n: 3, key: 'send', name: 'Speedy Service', isNew: 'Send early', intro: 'Tap SEND as soon as the cup is done. The faster the belt moves, the bigger your speed bonus.' },
  { n: 4, key: 'tap2', name: 'Second Tap', isNew: 'Read the ticket', intro: 'Blue Razz is on tap. Every cup rides past every tap, so read the ticket and only pour the flavour it asks for.' },
  { n: 6, key: 'tap3', name: 'Full Bar', isNew: 'Third tap', intro: 'Lime joins the bar. Three taps, three cups at once. Keep an eye on every ticket.' },
  { n: 8, key: 'cleanup', name: 'Mop Duty', isNew: 'Cleanup', intro: 'Spills stay on the counter now. Swipe across a puddle to wipe it; any left when the round ends cost points.' },
  { n: 11, key: 'topping', topping: 0, name: 'Top It Off', isNew: 'Toppings', intro: 'Some tickets want whipped cream. Press TOPPING while that cup sits under the last tap. A topping on the wrong cup ruins the order.' },
  { n: 14, key: 'flavour', flavour: 3, name: 'Mango Tango', isNew: 'New flavour: Mango', intro: 'Mango is on the bar. Same rules, one more flavour to tell apart.' },
  { n: 16, key: 'creep', name: 'Drifting Belt', isNew: 'Moving belt', intro: 'The belt never quite stops now, so cups drift under the taps. Pour while the cup is lined up, or it lands on the counter.' },
  { n: 20, key: 'duo', name: 'Swirl', isNew: 'Layered orders', intro: 'Some orders want two flavours. Pour the first to the first mark, then top up with the second at the next tap.' },
  { n: 24, key: 'topping', topping: 1, name: 'Sprinkle Party', isNew: 'New topping: Sprinkles', intro: 'Sprinkles are in the shaker today. Watch the tickets for them.' },
  { n: 27, key: 'uneven', name: 'Off-Balance', isNew: 'Uneven splits', intro: 'Layered orders are no longer half and half. Check where each mark sits before you pour.' },
  { n: 30, key: 'flavour', flavour: 4, name: 'Grape Escape', isNew: 'New flavour: Grape', intro: 'Grape joins the line-up.' },
  { n: 34, key: 'trio', name: 'Triple Decker', isNew: 'Three layers', intro: 'Some orders use all three taps. Three marks, three layers.' },
  { n: 38, key: 'topping', topping: 2, name: 'Boba Bay', isNew: 'New topping: Boba', intro: 'Boba pearls are in the shaker.' },
  { n: 42, key: 'strict', name: 'No Mess', isNew: 'Waste limit', intro: 'From here on, a full waste meter ends the round. Release a touch earlier.' },
  { n: 46, key: 'flavour', flavour: 5, name: 'Cola Cove', isNew: 'New flavour: Cola', intro: 'Cola is on tap. Six flavours, three taps: they rotate every level.' },
  { n: 50, key: 'topping', topping: 3, name: 'Cherry on Top', isNew: 'New topping: Cherry', intro: 'The last topping. Everything is unlocked; from here it only gets quicker.' },
];
export const CHAPTERS = ['Opening Shift', 'Topping Time', 'Swirl Season', 'Split Decisions', 'Triple Stack', 'No Mess', 'Rush Hour', 'Heatwave', 'Golden Hour', 'Beach Party'];
const NAMES = ['Sandbar', 'Tide Pool', 'Boardwalk', 'Sunburn', 'Lifeguard', 'Riptide', 'Coral Reef', 'Bonfire', 'Low Tide', 'Pier Rush', 'Surf Check',
  'Sea Breeze', 'Lighthouse', 'Palm Grove', 'Shell Shock', 'Big Wave', 'Sand Castle', 'Flip Flop', 'Beach Ball', 'Sun Lounger', 'Hammock', 'Tiki Torch',
  'Kite Day', 'Snorkel', 'Driftwood', 'Seagull', 'Starfish', 'Sunset Shift', 'High Tide', 'Ice Run', 'Brain Freeze', 'Last Call', 'Wave Pool', 'Lagoon'];
export const MAX_LEVEL = 100;
const FLAVOUR_AT = [1, 4, 6, 14, 30, 46];
const TOPPING_AT = [11, 24, 38, 50];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix01 = (a: number, b: number, t: number) => a + (b - a) * t;

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function levelConfig(n: number, tune: Tune = {}): LevelConfig {
  const past = SCHEDULE.filter(s => s.n <= n);
  const intro = SCHEDULE.find(s => s.n === n);
  const since = (k: string) => {
    const s = past.filter(e => e.key === k).pop();
    return s ? n - s.n : -1;
  };
  const ramp = (k: string, len: number) => (since(k) < 0 ? 0 : Math.min(1, 0.3 + since(k) / len));
  const last = past[past.length - 1];
  const fresh = last ? Math.max(0, 3 - (n - last.n)) / 3 : 0; // ease off right after a new idea
  const boss = n % 10 === 0 && !intro;
  const breather = n % 10 === 1 && n > 1 && !intro;
  const d = clamp01(1 - Math.exp(-(n - 1) / 45) - 0.08 * fresh - (breather ? 0.06 : 0) + (boss ? 0.04 : 0));
  const taps = n >= 6 ? 3 : n >= 4 ? 2 : 1;

  // flavours on tap: fixed early, rotating once more than three exist; a just-introduced flavour is always on
  const pool = FLAVOUR_AT.map((at, i) => (at <= n ? i : -1)).filter(i => i >= 0);
  let flavours = pool.slice(0, taps);
  if (pool.length > 3) {
    const rnd = mulberry32(n * 7919);
    const order = pool.map(f => [rnd(), f] as const).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    flavours = intro?.key === 'flavour' && intro.flavour !== undefined ? [intro.flavour] : [];
    for (const f of order) if (flavours.length < taps && !flavours.includes(f)) flavours.push(f);
    flavours.sort((a, b) => a - b);
  }

  const mix: Mix = { single: since('duo') >= 0 ? mix01(1, 0.6, d) : 1 };
  if (since('duo') >= 0) mix.duo = ramp('duo', 10);
  if (since('uneven') >= 0) mix.uneven = ramp('uneven', 10) * 0.8;
  if (since('trio') >= 0) mix.trio = ramp('trio', 12) * 0.7;

  const tops = TOPPING_AT.map((at, i) => (at <= n ? i : -1)).filter(i => i >= 0);
  let topping: number | null = null;
  if (intro?.key === 'topping' && intro.topping !== undefined) topping = intro.topping;
  else if (tops.length && n % 4 !== 3) topping = tops[n % tops.length];
  const creep = since('creep') >= 0 && (n % 3 !== 1 || since('creep') === 0) ? 5 + 11 * Math.min(1, since('creep') / 60) : 0;

  const L: LevelConfig = {
    mode: 'belt', badge: null, n,
    name: intro ? intro.name : NAMES[(n * 7) % NAMES.length],
    chapter: Math.ceil(n / 10), chapterName: CHAPTERS[Math.min(9, Math.ceil(n / 10) - 1)],
    isNew: intro ? intro.isNew : null, intro: intro ? intro.intro : null, boss, breather,
    taps, flavours, mix, topping,
    toppingChance: topping === null ? 0 : 0.3 + 0.15 * Math.min(1, Math.max(0, since('topping')) / 10),
    creep,
    quota: n === 1 ? 4 : Math.round(mix01(4, 18, d)) + (boss ? 2 : 0),
    dwell: mix01(6.5, 3.8, d) * (tune.dwell ?? 1),
    tol: (5.5 + 6.5 * Math.exp(-(n - 1) / 14)) * (tune.tol ?? 1),
    base: CFG.flow.base,
    accel: mix01(32, 62, d) * (tune.accel ?? 1),
    flowMax: mix01(45, 85, d),
    persist: since('cleanup') >= 0, wasteEnds: since('strict') >= 0, wasteBudget: Math.round(mix01(90, 55, d)),
    slide: 0.55, dur: 0,
    slots: 0, dir: 1, speed: 0, win: 0, maxLaps: 0,
  };
  const slack = mix01(1.6, 1.1, d) * (since('duo') >= 0 ? 1.05 : 1);
  L.dur = Math.round((L.quota + L.taps) * (L.dwell + L.slide) * slack);
  return L;
}

// ═══ Spin Bar — the carousel machine. Same liquid/spill/scoring systems; only the transport differs. ═══
export const SPIN = { CX: 640, CY: 452, RX: 300, RY: 92, NOZ_Y: 360, UNLOCK: 15, MAX_LEVEL: 30 } as const;
export const SPIN_SCHEDULE: Omit<ScheduleEntry, 'key'>[] = [
  { n: 1, name: 'Spin Bar', isNew: 'The carousel', intro: 'Cups ride the turntable under one nozzle. Hold the flavour the ticket asks for while the cup passes the window. Short of the line? It comes back around for another pass, up to three laps.' },
  { n: 3, name: 'Triple Choice', isNew: 'Third flavour', intro: 'Three flavour buttons now, still one nozzle. Pick the right one before the cup arrives.' },
  { n: 6, name: 'Full Table', isNew: 'Six cups', intro: 'Six cups on the tray and a fourth flavour. The table turns a little quicker.' },
  { n: 10, name: 'Five Alive', isNew: 'Five flavours', intro: 'Every flavour button is lit. Read fast.' },
  { n: 12, name: 'Spin Swirl', isNew: 'Layered spins', intro: 'Two-flavour orders: switch buttons mid-pour, or finish the second layer on the next lap.' },
  { n: 16, name: 'Spin & Top', isNew: 'Toppings', intro: 'Some tickets want a topping. Press TOPPING while that cup is in the window.' },
  { n: 20, name: 'Cola Carousel', isNew: 'Cola + no mess', intro: 'Cola joins the line-up, and from here a full waste meter ends the round.' },
  { n: 24, name: 'Backspin', isNew: 'Reverse spin', intro: 'Some shifts the tray turns the other way. Cups arrive from the right.' },
  { n: 28, name: 'Off-Kilter', isNew: 'Uneven layers', intro: 'Layered spins stop splitting evenly.' },
];
export const SPIN_CHAPTERS = ['Turntable', 'Round & Round', 'Head Spin'];
const SPIN_NAMES = ['Lazy Susan', 'Merry-Go-Round', 'Whirlpool', 'Spin Cycle', 'Tilt-a-Whirl', 'Round Trip', 'Dizzy', 'Full Circle', 'Twister', 'Loop-de-Loop'];

export function spinConfig(n: number, tune: Tune = {}): LevelConfig {
  const intro = SPIN_SCHEDULE.find(s => s.n === n);
  const last = SPIN_SCHEDULE.filter(s => s.n <= n).pop()!;
  const fresh = Math.max(0, 3 - (n - last.n)) / 3;
  const boss = n % 10 === 0 && !intro;
  const d = clamp01(1 - Math.exp(-(n - 1) / 22) - 0.08 * fresh + (boss ? 0.04 : 0));
  const k = n < 3 ? 2 : n < 6 ? 3 : n < 10 ? 4 : 5;
  const flavours = n < 20 ? [0, 1, 2, 3, 4].slice(0, k) : [1, 2, 3, 4, 5].slice(5 - k);
  const mix: Mix = { single: 1 };
  if (n >= 12) mix.duo = Math.min(1, 0.3 + (n - 12) / 10);
  if (n >= 28) mix.uneven = Math.min(0.8, 0.3 + (n - 28) / 8);
  const topping = n >= 16 && (n === 16 || n % 3 !== 1) ? n % 4 : null;
  const speed = (24 + 16 * d) / (tune.dwell ?? 1);
  const slots = n < 6 ? 5 : 6;
  const quota = n === 1 ? 4 : Math.round(4 + 6 * d) + (boss ? 1 : 0);
  const lap = 360 / speed; // seconds per revolution; each cup passes the nozzle once per lap
  return {
    mode: 'spin', badge: 'SPIN', n,
    name: intro ? intro.name : SPIN_NAMES[(n * 3) % SPIN_NAMES.length],
    chapter: Math.ceil(n / 10), chapterName: SPIN_CHAPTERS[Math.min(2, Math.ceil(n / 10) - 1)],
    isNew: intro ? intro.isNew : null, intro: intro ? intro.intro : null, boss, breather: false,
    taps: k, flavours, mix, topping, toppingChance: topping === null ? 0 : 0.35, creep: 0,
    quota, dwell: lap / slots,
    tol: (6 + 6 * Math.exp(-(n - 1) / 10)) * (tune.tol ?? 1),
    base: 30, accel: (70 + 30 * d) * (tune.accel ?? 1), flowMax: 60 + 20 * d,
    persist: n >= 4, wasteEnds: n >= 20, wasteBudget: Math.round(mix01(90, 60, d)), slide: 0.55,
    dur: Math.round(quota * (lap / slots) * 2.6 * mix01(1.5, 1.3, d) + 8),
    slots, dir: n >= 24 && n % 2 === 0 ? -1 : 1, speed, win: 16 - 3 * d, maxLaps: 3,
  };
}
