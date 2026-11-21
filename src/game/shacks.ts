// Shack themes: the backdrop's colours. The Beach Shack's four times of day are the base; a theme swaps the shack's
// own colours (walls, sand, palms, awning, frame, counter, bunting, string lights) and, if it wants, the daytime sky.
// The time-of-day tint still lies over every theme, so golden hour, sunset and night work everywhere.
// Data only (no Skia): the renderer (render/background.ts) and the Collection both read it.

export interface Sky {
  sky: [string, string, string]; sea: [string, string];
  sun: { x: number; y: number; r: number; c: string; glow: string; moon?: boolean };
  sand: string; wall: string; wallLine: string; tint: string | null; cloud: string; foliage: string; trunk: string; island: string;
}

export interface ShackTheme {
  id: string;
  name: string;
  /** coins to unlock (0: the starter) */
  price: number;
  skies: Sky[];
  awning: [string, string];
  /** window frame and posts, then the shelf and trim under the window */
  frame: [string, string];
  counter: [string, string];
  bunting: string[];
  lights: string[];
  /** snowflakes across the sky (Festive Shack) */
  snow?: boolean;
}

/** The Beach Shack, from noon to night. */
export const BEACH_SKIES: Sky[] = [
  { sky: ['#2FB1F0', '#86D9FB', '#FFF0CC'], sea: ['#0B93CC', '#48CDE6'], sun: { x: 1090, y: 132, r: 50, c: '#FFE36E', glow: 'rgba(255,228,120,.38)' }, sand: '#F9D9A0', wall: '#F6BC7C', wallLine: 'rgba(160,90,40,.28)', tint: null, cloud: 'rgba(255,255,255,.92)', foliage: '#2E9E55', trunk: '#8A5A3B', island: '#3C8E62' },
  { sky: ['#3D9BE0', '#FFC27A', '#FFE3A6'], sea: ['#2A86BE', '#F2BE7E'], sun: { x: 1092, y: 192, r: 56, c: '#FFB347', glow: 'rgba(255,170,70,.42)' }, sand: '#F6CB8A', wall: '#F4B06C', wallLine: 'rgba(150,80,30,.3)', tint: 'rgba(255,160,60,.08)', cloud: 'rgba(255,236,210,.9)', foliage: '#3C8A47', trunk: '#7A4B2E', island: '#4A7A52' },
  { sky: ['#5B3F9A', '#F05E8A', '#FFAF64'], sea: ['#4A3C8E', '#E9747A'], sun: { x: 1092, y: 232, r: 62, c: '#FF7A45', glow: 'rgba(255,110,80,.45)' }, sand: '#E9B07E', wall: '#E89E6C', wallLine: 'rgba(120,50,40,.3)', tint: 'rgba(190,70,120,.12)', cloud: 'rgba(255,190,200,.85)', foliage: '#2F5E46', trunk: '#5E3A2A', island: '#3A3F6A' },
  { sky: ['#0E1433', '#232A66', '#4E3F86'], sea: ['#0C1636', '#283A7A'], sun: { x: 1090, y: 118, r: 40, c: '#F3EFCF', glow: 'rgba(240,235,200,.22)', moon: true }, sand: '#6E5A7E', wall: '#D29A7E', wallLine: 'rgba(40,20,40,.32)', tint: 'rgba(22,24,72,.2)', cloud: 'rgba(120,130,190,.55)', foliage: '#1C3A3A', trunk: '#3A2A2E', island: '#141C3E' },
];

/**
 * A theme from the Beach Shack's day: `all` recolours every time of day; `day` (optional) also swaps the noon sky.
 * The later times of day keep their own skies and darken the theme's colours, so a night always reads as night.
 */
function themed(all: Partial<Sky>, day: Partial<Sky> = {}, dim: [number, number, number] = [0.94, 0.84, 0.62]): Sky[] {
  return BEACH_SKIES.map((s, i) => {
    const k = i === 0 ? 1 : dim[i - 1];
    const shade = (c?: string) => (c && k < 1 ? darken(c, k) : c);
    const own: Partial<Sky> = {};
    for (const key of ['sand', 'wall', 'foliage', 'trunk'] as const) if (all[key]) own[key] = shade(all[key]);
    if (all.wallLine) own.wallLine = all.wallLine;
    return { ...s, ...own, ...(i === 0 ? day : {}) };
  });
}
function darken(hex: string, k: number) {
  const n = [1, 3, 5].map(j => Math.round(parseInt(hex.slice(j, j + 2), 16) * k));
  return '#' + n.map(v => v.toString(16).padStart(2, '0')).join('');
}

const RAINBOW = ['#FF6B8A', '#45C6F2', '#FFC857', '#A7D95B', '#A78BFA'];
const BULBS = ['#FFE08A', '#FF8FB0', '#8FE3FF', '#C7F08A'];

export const SHACKS: ShackTheme[] = [
  {
    id: 'beach', name: 'Beach Shack', price: 0, skies: BEACH_SKIES,
    awning: ['#FF5A7E', '#FFF9F1'], frame: ['#B9733F', '#9A5A32'], counter: ['#F6BE7E', '#DE9A5C'], bunting: RAINBOW, lights: BULBS,
  },
  {
    id: 'festive', name: 'Festive Shack', price: 400, snow: true,
    skies: themed({ sand: '#FFF6EC', wall: '#F2D6B0', wallLine: 'rgba(150,90,40,.25)', foliage: '#1F7A45', trunk: '#7A4B2E' },
      { sky: ['#4FA8E8', '#BFE4FA', '#FFF3DA'], cloud: 'rgba(255,255,255,.95)' }),
    awning: ['#D93D63', '#FFF9F1'], frame: ['#8E4E2A', '#6E3A1E'], counter: ['#F3C98E', '#D9A262'],
    bunting: ['#D93D63', '#2E9E55', '#FFC857', '#FFF9F1'], lights: ['#FFD36E', '#FF6B6B', '#7BE08A', '#FFF4C2'],
  },
  {
    id: 'candy', name: 'Candy Pier', price: 400,
    skies: themed({ sand: '#FFE3EE', wall: '#BDF0DA', wallLine: 'rgba(60,140,110,.22)', foliage: '#4FC28E', trunk: '#C98AA8' },
      { sky: ['#8FD3FF', '#FFC9E3', '#FFF0F6'], sea: ['#78D0E6', '#B9EEF2'], cloud: 'rgba(255,240,250,.95)' }),
    awning: ['#FF8FC7', '#FFF9F1'], frame: ['#F59CC2', '#D9739F'], counter: ['#FFD9EA', '#F4A9C9'],
    bunting: ['#FF8FC7', '#8FE3FF', '#FFE08A', '#B8F0A8', '#FFC2E0'], lights: ['#FFC2E0', '#8FE3FF', '#FFF4C2', '#C7F0D8'],
  },
  {
    id: 'tiki', name: 'Tiki Night', price: 500,
    skies: themed({ sand: '#EED5A0', wall: '#C9A66B', wallLine: 'rgba(90,60,20,.32)', foliage: '#17734A', trunk: '#6B4423' },
      { sky: ['#1597AE', '#76D3CC', '#F6E5B0'], sea: ['#0C7884', '#36B5A6'] }),
    awning: ['#E2683C', '#F4E2B8'], frame: ['#7A5228', '#5E3E1C'], counter: ['#E2C07E', '#B88A44'],
    bunting: ['#E2683C', '#F6B93B', '#17734A', '#F4E2B8'], lights: ['#FFB347', '#FF7A45', '#FFE08A', '#FFCF8A'],
  },
  {
    id: 'neon', name: 'Neon Boardwalk', price: 600,
    skies: themed({ sand: '#F5D7E6', wall: '#3A3566', wallLine: 'rgba(255,255,255,.08)', foliage: '#1FA88A', trunk: '#4A3A5E' },
      { sky: ['#38B0F0', '#9EE6FF', '#FFE6F4'] }, [0.95, 0.9, 0.8]),
    awning: ['#FF3FA4', '#23D5F5'], frame: ['#2A2650', '#1C1938'], counter: ['#4A4580', '#2E2A57'],
    bunting: ['#FF3FA4', '#23D5F5', '#FFE14D', '#7CFF8A'], lights: ['#FF3FA4', '#23D5F5', '#FFE14D', '#7CFF8A'],
  },
];

export const shackById = (id: string | undefined) => SHACKS.find(s => s.id === id) ?? SHACKS[0];
