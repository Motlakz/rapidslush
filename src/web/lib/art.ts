// The game's own art and physics, copied from the app (src/engine/constants.ts, src/engine/levels.ts,
// src/game/render/background.ts) so the site's toys look and pour exactly like Rapid Slush. Keep in step with those.

export type Glyph = 'heart' | 'drop' | 'leaf' | 'diamond' | 'grape' | 'star';
export interface Flavour { id: string; name: string; color: string; deep: string; light: string; glyph: Glyph }

export const FLAVOURS: Flavour[] = [
  { id: 'berry', name: 'Berry', color: '#FF6B8A', deep: '#D93D63', light: '#FFC2CF', glyph: 'heart' },
  { id: 'razz', name: 'Blue Razz', color: '#45C6F2', deep: '#1B8FC0', light: '#C4EDFC', glyph: 'drop' },
  { id: 'lime', name: 'Lime', color: '#A7D95B', deep: '#6E9F2B', light: '#DDF1BC', glyph: 'leaf' },
  { id: 'mango', name: 'Mango', color: '#FFC857', deep: '#E09A1E', light: '#FFEBBE', glyph: 'diamond' },
  { id: 'grape', name: 'Grape', color: '#A78BFA', deep: '#7356D8', light: '#DED4FE', glyph: 'grape' },
  { id: 'cola', name: 'Cola', color: '#B0714A', deep: '#7A4528', light: '#E8C4AA', glyph: 'star' },
];

export const TOPPINGS = ['Whip', 'Sprinkles', 'Boba', 'Cherry'] as const;
export type Topping = (typeof TOPPINGS)[number];

/** Level 1's pour (levelConfig(1) + CFG.flow): units of a 100-unit cup per second. */
export const POUR = { base: 18, accel: 32, flowMax: 45, ramp: 10, decay: 9, tol: 12, cap: 100, perfectShare: 0.35 } as const;

/** The plastic cup (tier 0): local coordinates, base at y 0, rim at y -140. */
export const CUP = { h: 140, rb: 30, rt: 44, liqB: -9, liqT: -126 } as const;
export const cupHw = (y: number) => CUP.rb + ((CUP.rt - CUP.rb) * -y) / CUP.h;
export const cupY = (units: number) => CUP.liqB - ((CUP.liqB - CUP.liqT) * units) / 100;
/** The cup's outline as an SVG path, for a fill and a clip. */
export function cupPath(inset = 0) {
  const yb = -inset, yt = -CUP.h + inset, hb = cupHw(0) - inset, ht = cupHw(-CUP.h) - inset, r = 9;
  return `M${-ht} ${yt} L${-hb} ${yb - r} Q${-hb} ${yb} ${-hb + r} ${yb} L${hb - r} ${yb} Q${hb} ${yb} ${hb} ${yb - r} L${ht} ${yt} Z`;
}

/** The shack's day: day (levels 1–30), golden hour (31–60), sunset (61–90), night (91+). */
export const SKIES = [
  { name: 'Noon', from: 1, sky: ['#2FB1F0', '#86D9FB', '#FFF0CC'], sea: ['#0B93CC', '#48CDE6'], sun: '#FFE36E', glow: 'rgba(255,228,120,.38)', sand: '#F9D9A0', wall: '#F6BC7C', foliage: '#2E9E55', trunk: '#8A5A3B' },
  { name: 'Golden hour', from: 31, sky: ['#3D9BE0', '#FFC27A', '#FFE3A6'], sea: ['#2A86BE', '#F2BE7E'], sun: '#FFB347', glow: 'rgba(255,170,70,.42)', sand: '#F6CB8A', wall: '#F4B06C', foliage: '#3C8A47', trunk: '#7A4B2E' },
  { name: 'Sunset', from: 61, sky: ['#5B3F9A', '#F05E8A', '#FFAF64'], sea: ['#4A3C8E', '#E9747A'], sun: '#FF7A45', glow: 'rgba(255,110,80,.45)', sand: '#E9B07E', wall: '#E89E6C', foliage: '#2F5E46', trunk: '#5E3A2A' },
  { name: 'Night', from: 91, sky: ['#0E1433', '#232A66', '#4E3F86'], sea: ['#0C1636', '#283A7A'], sun: '#F3EFCF', glow: 'rgba(240,235,200,.22)', sand: '#6E5A7E', wall: '#D29A7E', foliage: '#1C3A3A', trunk: '#3A2A2E' },
] as const;
