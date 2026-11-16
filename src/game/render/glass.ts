// Glassware geometry per tier: render-only. Liquid volumes map to the glass interior; hitboxes never change.
import { BELT_Y, CUP_H, CUP_RB, CUP_RT, LIQ_BOTTOM, LIQ_TOP, type Cup, type Round } from '@/engine';
import { glassFor, type Glass } from '@/game/content';
import { clamp, lerp } from '@/engine/util';
import type { Painter } from './painter';

export interface GlassGeom {
  yb: number; yt: number; liqB: number; liqT: number;
  /** a short pedestal foot under the bowl (milkshake glass) */
  stem?: boolean;
  /** solid glass below the liquid (heavy-bottomed soda glass), drawn as a frosted slab */
  base?: boolean;
  hw: (y: number) => number;
}

const GEOM: Partial<Record<Glass['id'], GlassGeom>> = {};
export function glassGeom(id: Glass['id']): GlassGeom {
  const hit = GEOM[id];
  if (hit) return hit;
  let G: GlassGeom;
  // Later glassware stays tall and widest where targets sit (60–85% full), so the fill line is easy to read.
  // Tops stop ~12 units under the nozzles (NOZZLE_Y 298) so the pour stream still shows.
  if (id === 'shake') {
    // Milkshake glass: short pedestal foot, then a tall bowl that tapers at the bottom and flares wide above.
    const yb = BELT_Y - 20, yt = BELT_Y - 166;
    G = {
      yb, yt, liqB: yb - 6, liqT: yt + 14, stem: true,
      hw: y => { const u = clamp((yb - y) / (yb - yt), 0, 1); return 16 + 32 * (1 - Math.pow(1 - u, 1.7)); },
    };
  } else if (id === 'soda') {
    // Soda-fountain glass: tall, gently flared tumbler on a heavy glass base.
    const yb = BELT_Y, yt = BELT_Y - 158;
    G = {
      yb, yt, liqB: yb - 16, liqT: yt + 12, base: true,
      hw: y => { const u = clamp((yb - y) / (yb - yt), 0, 1); return 26 + 20 * Math.pow(u, 0.85); },
    };
  } else {
    G = { yb: BELT_Y, yt: BELT_Y - CUP_H, liqB: LIQ_BOTTOM, liqT: LIQ_TOP, hw: y => CUP_RB + ((CUP_RT - CUP_RB) * (BELT_Y - y)) / CUP_H };
  }
  return (GEOM[id] = G);
}

// The glassware a round shows. Spin Bar follows the shack's overall progress, the belt follows the level.
const roundGlassMap = new WeakMap<Round, Glass>();
export const setRoundGlass = (r: Round, g: Glass) => { roundGlassMap.set(r, g); };
export const roundGlass = (r: Round) => {
  let g = roundGlassMap.get(r);
  if (!g) { g = glassFor(r.n); roundGlassMap.set(r, g); }
  return g;
};

/** Volume units (0–100) to a y inside the glass. */
export const uy = (G: GlassGeom, u: number) => G.liqB - ((G.liqB - G.liqT) * u) / 100;
export const surfaceY = (r: Round, c: Cup) => uy(glassGeom(roundGlass(r).id), c.total);

export function glassPath(g: Painter, G: GlassGeom, x: number, inset = 0, open = false, keep = false) {
  const i = inset, N = 18, yb = G.yb - i, yt = G.yt + i, hb = G.hw(G.yb) - i, rad = Math.min(9, hb * 0.6), hr = G.hw(G.yb - rad) - i;
  if (!keep) g.beginPath();
  g.moveTo(x - (G.hw(G.yt) - i), yt);
  for (let k = 1; k <= N; k++) { const y = lerp(yt, yb - rad, k / N); g.lineTo(x - (G.hw(y) - i), y); }
  g.quadraticCurveTo(x - hb, yb, x - Math.min(hb, hr) + rad, yb);
  g.lineTo(x + Math.min(hb, hr) - rad, yb);
  g.quadraticCurveTo(x + hb, yb, x + hr, yb - rad);
  for (let k = N - 1; k >= 0; k--) { const y = lerp(yt, yb - rad, k / N); g.lineTo(x + (G.hw(y) - i), y); }
  if (!open) g.closePath(); // strokes use the open form: the rim ellipse is the top edge
}
