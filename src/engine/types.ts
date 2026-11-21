export type Mode = 'belt' | 'spin' | 'blend';
export type OrderType = 'single' | 'duo' | 'uneven' | 'trio';
export type Phase = 'countdown' | 'playing' | 'ending' | 'done';
export type WasteKind = 'outside' | 'overflow' | 'tray';
export type Severity = 'minor' | 'moderate' | 'major';

export interface Mix {
  single: number;
  duo?: number;
  uneven?: number;
  trio?: number;
}

export interface Tune {
  accel?: number;
  tol?: number;
  dwell?: number;
}

export interface LevelConfig {
  mode: Mode;
  badge: string | null;
  n: number;
  name: string;
  chapter: number;
  chapterName: string;
  isNew: string | null;
  intro: string | null;
  boss: boolean;
  breather: boolean;
  /** flavour channels: taps on the belt, flavour buttons on the carousel */
  taps: number;
  flavours: number[];
  mix: Mix;
  topping: number | null;
  toppingChance: number;
  creep: number;
  quota: number;
  dwell: number;
  tol: number;
  base: number;
  accel: number;
  flowMax: number;
  persist: boolean;
  wasteEnds: boolean;
  wasteBudget: number;
  slide: number;
  dur: number;
  // carousel only (zero on the belt)
  slots: number;
  dir: 1 | -1;
  /** carousel: degrees per second. Blend Station: how fast the smoothness meter climbs at full blade speed */
  speed: number;
  win: number;
  maxLaps: number;
  // Blend Station only (zero elsewhere)
  /** half-width of the smooth band on the 0–1.25 smoothness meter */
  zone: number;
  /** share of orders that use frozen fruit (blends at 60% speed) */
  frozen: number;
}

export interface Layer {
  tap: number;
  amt: number;
}

export interface Order {
  type: OrderType;
  layers: Layer[];
  total: number;
  topping: number | null;
  multi: boolean;
  /** Blend Station: frozen fruit, which blends slower */
  frozen: boolean;
}

export interface Verdict {
  ok: boolean;
  perfect: boolean;
  label: string;
  pts: number;
  mult: number;
  speed: number;
  err: number;
}

export interface SpinPos {
  x: number;
  y: number;
  s: number;
  deg: number;
  th: number;
}

export interface Cup {
  id: number;
  order: Order;
  slot: number;
  x: number;
  fromX: number;
  toX: number;
  vol: number[];
  seq: Layer[];
  total: number;
  overflowed: boolean;
  ovAt: number;
  topping: number | null;
  topAt: number;
  spare: number;
  visits: number;
  judged: boolean;
  verdict: Verdict | null;
  judgedAt: number;
  wob: number;
  seed: number;
  leaving: boolean;
  vx: number;
  laps: number;
  inWin: boolean;
  p: SpinPos | null;
  botErr?: number;
  /** Blend Station: the jar's smoothness when this cup was first poured (-1 until then) */
  smooth: number;
}

/** Blend Station's jar: which flavours are in, how smooth it is, how much is left to pour. */
export interface Jar {
  has: boolean[];
  meter: number;
  /** blade speed now: meter units per second */
  speed: number;
  /** volume left to pour (0 when empty) */
  left: number;
  /** seconds the cup at the station has waited (drives the speed bonus) */
  wait: number;
}

export interface Puddle {
  id: number;
  x: number;
  y: number;
  vol: number;
  a: number;
  color: number;
  seed: number;
}

export interface SpillEvent {
  kind: WasteKind;
  amt: number;
  x: number;
  color: number;
  quiet: number;
}

export type GameEvent =
  | { type: 'judge'; cup: Cup }
  | { type: 'spill'; sev: Severity; pen: number; x: number; kind: WasteKind; amt: number; color: number; timePen: number }
  | { type: 'slide'; manual: boolean }
  | { type: 'topping'; cup: Cup }
  | { type: 'toppingMiss' }
  | { type: 'lap'; cup: Cup }
  | { type: 'scoop'; flavour: number }
  | { type: 'clean'; x: number; y: number }
  | { type: 'go' }
  | { type: 'win'; reason: string }
  | { type: 'lose'; reason: string }
  | { type: 'done' };

export interface RoundResult {
  level: number;
  mode: Mode;
  win: boolean;
  reason: string;
  score: number;
  served: number;
  quota: number;
  perfect: number;
  orders: Round['orders'];
  spills: Round['spills'];
  spillCount: number;
  waste: number;
  wastePct: number;
  bestCombo: number;
  timeLeft: number;
  elapsed: number;
  timeBonus: number;
  puddlePen: number;
  puddlesLeft: number;
  cleaned: number;
  accuracy: number;
  stars: number;
}

export interface Round {
  L: LevelConfig;
  n: number;
  mode: Mode;
  angle: number;
  winCup: Cup | null;
  rng: () => number;
  phase: Phase;
  cd: number;
  time: number;
  elapsed: number;
  clock: number;
  served: number;
  score: number;
  combo: number;
  bestCombo: number;
  waste: number;
  spills: Record<Severity, number>;
  orders: { total: number; perfect: number; failed: number; missed: number; layered: number };
  cups: Cup[];
  belt: { phase: 'dwell' | 'slide'; t: number; dwellT: number; dwellLeft: number; basePos: number };
  beltPos: number;
  jar: Jar;
  flow: number[];
  holdT: number[];
  hold: boolean[];
  spillEvt: (SpillEvent | null)[];
  puddles: Puddle[];
  pid: number;
  cid: number;
  cleaned: number;
  events: GameEvent[];
  used: number[];
  indexes: number;
  result: RoundResult | null;
  endT: number;
  win: boolean;
  reason: string;
}
