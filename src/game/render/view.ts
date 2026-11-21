// Render-only state. The engine's Round stays pure; anything a renderer animates on its own lives here.
import type { Round } from '@/engine';
import type { CupDesign, Skin } from '@/game/content';

export interface RoundView {
  lev: number[];        // tap lever angles, eased toward held/released
  shakeT: number;       // topping shaker wiggle start (round clock)
  topPress: number;     // topping button press time (round clock)
  blendA: number;       // Blend Station: how far the jar's contents have swirled (drives the blade and the chunks)
}
const views = new WeakMap<Round, RoundView>();
export function viewOf(r: Round): RoundView {
  let v = views.get(r);
  if (!v) { v = { lev: [-0.35, -0.35, -0.35], shakeT: -9, topPress: -9, blendA: 0 }; views.set(r, v); }
  return v;
}

export interface Coach { stage: 0 | 1 | 2 | 3 }
export interface Banner { s: string; t: number }

/** Everything outside the round a frame needs. Built by the controller each frame. */
export interface RenderCtx {
  live: boolean;          // a real round (HUD + controls) vs attract mode behind the menus
  paused: boolean;
  reduced: boolean;       // reduced effects (plan §3.8)
  skin: Skin;
  /** shack theme id (src/game/shacks.ts) */
  shack: string;
  cup: CupDesign;
  highest: number;        // belt progress, sets the time of day for Spin Bar
  coach: Coach | null;
  banner: Banner | null;
  keyHints: boolean;      // show keyboard shortcuts: only on web with a mouse/trackpad, never on mobile
}
