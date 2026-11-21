// World is a fixed 1280×720 logical stage; the renderer scales it to any screen (phone, tablet, TV).
export const W = 1280;
export const H = 720;

export const STATION_X = [400, 640, 880] as const;
export const HATCH_X = 1125;
export const ENTRY_X = 96;
export const EXIT_X = 1440;
export const NOZZLE_Y = 298;
export const BELT_Y = 476;
export const CUP_H = 140;
export const CUP_RB = 30;
export const CUP_RT = 44;
export const CAP = 100;
export const CUP_CATCH = 32;
export const LIQ_BOTTOM = BELT_Y - 9;
export const LIQ_TOP = BELT_Y - CUP_H + 14;
export const COUNTER_Y = 566;
export const MAX_CHANNELS = 5; // up to five flavour buttons (Spin Bar)

export type Glyph = 'heart' | 'drop' | 'leaf' | 'diamond' | 'grape' | 'star';

export interface Flavour {
  id: string;
  name: string;
  color: string;
  deep: string;
  light: string;
  glyph: Glyph;
}

export const FLAVOURS: readonly Flavour[] = [
  { id: 'berry', name: 'Berry', color: '#FF6B8A', deep: '#D93D63', light: '#FFC2CF', glyph: 'heart' },
  { id: 'razz', name: 'Blue Razz', color: '#45C6F2', deep: '#1B8FC0', light: '#C4EDFC', glyph: 'drop' },
  { id: 'lime', name: 'Lime', color: '#A7D95B', deep: '#6E9F2B', light: '#DDF1BC', glyph: 'leaf' },
  { id: 'mango', name: 'Mango', color: '#FFC857', deep: '#E09A1E', light: '#FFEBBE', glyph: 'diamond' },
  { id: 'grape', name: 'Grape', color: '#A78BFA', deep: '#7356D8', light: '#DED4FE', glyph: 'grape' },
  { id: 'cola', name: 'Cola', color: '#B0714A', deep: '#7A4528', light: '#E8C4AA', glyph: 'star' },
];

export const TOPPINGS = [
  { id: 'whip', name: 'Whip' },
  { id: 'sprinkles', name: 'Sprinkles' },
  { id: 'boba', name: 'Boba' },
  { id: 'cherry', name: 'Cherry' },
] as const;

// Tunable data (plan §3.4, §4.1). Systems read these; never hard-code values inside systems.
export const CFG = {
  scoring: {
    flavour: 100, fill: 100, perfect: 50, layers: 100, topping: 50, speedMax: 100, comboStep: 0.25, comboMax: 3,
    minor: -25, moderate: -50, major: -100, majorTime: 2, puddle: -15, timeBonus: 10,
  },
  spill: { grace: 1.5, trayGrace: 4, minor: 6, moderate: 16 },
  flow: { base: 18, max: 85, decay: 9, ramp: 10 },
  /** Blend Station blade: spin-up rate while BLEND is held, coast-down rate after (so it drifts ~speed/decay further) */
  blend: { ramp: 6, decay: 4 },
} as const;
