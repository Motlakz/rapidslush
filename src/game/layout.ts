// On-canvas control rectangles in stage coordinates (1280×720). Shared by the renderer and input hit-testing.
import { HATCH_X, STATION_X } from '@/engine';

export interface Box { x: number; y: number; w: number; h: number }

export const CTRL = {
  tap: (i: number): Box => ({ x: STATION_X[i] - 100, y: 618, w: 200, h: 82 }),
  send: { x: HATCH_X - 100, y: 618, w: 200, h: 82 } as Box,
  top: { x: 48, y: 618, w: 200, h: 82 } as Box,
  top2: { x: 1040, y: 618, w: 200, h: 82 } as Box,
  pause: { x: 1212, y: 22, w: 50, h: 50 } as Box,
};

/** Spin Bar flavour buttons: k buttons share the deck, centred. */
export function spinBtn(i: number, k: number): Box {
  const w = Math.min(200, (960 - (k - 1) * 12) / k), tot = k * w + (k - 1) * 12;
  return { x: 40 + (960 - tot) / 2 + i * (w + 12), y: 618, w, h: 82 };
}

export type BlendKind = 'scoop' | 'blend' | 'pour' | 'top' | 'serve';
/**
 * Blend Station deck, left to right: the flavour scoops, then BLEND and POUR (held), TOPPING when the level has one, and
 * SERVE on the right edge where SEND sits on the Slush Line. Scoops are a little narrower than the action buttons.
 */
export function blendDeck(L: { taps: number; topping: number | null }): { kind: BlendKind; i: number; box: Box }[] {
  const acts: BlendKind[] = ['blend', 'pour', ...(L.topping !== null ? (['top'] as const) : []), 'serve'];
  const gap = 12, span = 1200, k = L.taps, a = acts.length;
  // actions get 1.25 shares, scoops 1 share each
  const unit = (span - (k + a - 1) * gap) / (k + a * 1.25), sw = Math.min(170, unit), aw = Math.min(200, unit * 1.25);
  const total = k * sw + a * aw + (k + a - 1) * gap;
  let x = 40 + (span - total) / 2;
  const out: { kind: BlendKind; i: number; box: Box }[] = [];
  for (let i = 0; i < k; i++) { out.push({ kind: 'scoop', i, box: { x, y: 618, w: sw, h: 82 } }); x += sw + gap; }
  for (const kind of acts) { out.push({ kind, i: 0, box: { x, y: 618, w: aw, h: 82 } }); x += aw + gap; }
  return out;
}

/** Generous hit test: a little slop below the button for thumbs. */
export const inBox = (p: { x: number; y: number }, b: Box) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y - 6 && p.y <= b.y + b.h + 12;

// ---------- fitting the stage to a screen ----------
/**
 * Smallest stage scale we call playable. The smallest stage text is 12px and the tap buttons are 82px tall, so at 0.5
 * text lands near 6pt and buttons near 41pt (the 44pt touch-target guideline). A screen shape below this gets a
 * notice instead of being claimed as supported. See layout.test.ts for the device table this is checked against.
 */
export const MIN_PLAYABLE_SCALE = 0.5;

export interface Insets { top: number; right: number; bottom: number; left: number }

/** The world (engine coordinates) is always 1280×720. The stage around it takes the screen's shape, within these caps. */
export const WORLD_W = 1280, WORLD_H = 720;
const MAX_STAGE_W = 1760; // ~2.44:1, wider than any phone; beyond this the rest is padding
const MAX_STAGE_H = 2400; // ~0.53:1, taller than any phone held upright
/** How far the HUD / controls may drift from the world toward the screen edges on tall stages. */
const HUD_DRIFT = 120, CTRL_DRIFT = 160;

export interface StageLayout {
  /** stage size in stage units (world units; the stage is the world plus extensions) */
  SW: number; SH: number;
  /** where the world's origin sits on the stage */
  ox: number; oy: number;
  /** stage y of the HUD's origin (its 0 in the original 1280×720 design) and of the control deck's (original 0) */
  hudY: number; ctrlY: number;
  /** safe-area insets in stage units: artwork runs edge to edge, interactive things stay inside these */
  safe: Insets;
  /** points per stage unit, and where the stage sits in the window (points) */
  scale: number; left: number; top: number; width: number; height: number;
  playable: boolean; portrait: boolean;
  /** share of the window the stage covers */
  fill: number;
  /**
   * Readability on small screens: the HUD row, the control deck and the order tickets scale up as groups so their
   * text stays legible when the stage itself is shrunk (a phone lands near 0.54). 1 on tablets and desktop.
   */
  hudK: number; deckK: number; ticketK: number;
  /** where control space (the deck's original 0..1280 × 0..720 design) sits on the stage, at deckK */
  deckX: number; deckY: number;
}

/** Stage scale below which the HUD, deck and tickets get the readability boost, and the effective scale they aim for. */
const BOOST_AIM = 0.8;

/**
 * Shape the stage to the screen (Apple's iPhone Duo HIG: prefer changing the aspect ratio over letterboxing).
 * Wider screens widen the stage; squarer and taller ones heighten it. Gameplay never changes: the world is fixed.
 * The stage covers the whole window, notch strips included; the HUD, controls and menus keep to the safe area.
 */
export function layoutStage(width: number, height: number, ins: Insets = { top: 0, right: 0, bottom: 0, left: 0 }): StageLayout {
  const winW = Math.max(1, width), winH = Math.max(1, height), aspect = winW / winH;
  const SW = Math.min(MAX_STAGE_W, Math.max(WORLD_W, WORLD_H * aspect));
  const SH = Math.min(MAX_STAGE_H, Math.max(WORLD_H, WORLD_W / aspect));
  const scale = Math.max(0.05, Math.min(winW / SW, winH / SH));
  const w = SW * scale, h = SH * scale;
  const safe = { top: ins.top / scale, right: ins.right / scale, bottom: ins.bottom / scale, left: ins.left / scale };
  const extra = SH - WORLD_H, oy = Math.round(extra * 0.6), below = extra - oy; // the shack front gets more room than the deck
  const usableW = (winW - ins.left - ins.right) / scale;
  const ctrlY = Math.min(oy + Math.min(below, CTRL_DRIFT), SH - safe.bottom - 712);
  const want = BOOST_AIM / scale;
  // the deck may only grow as far as the safe width allows (its buttons span 1200 units); its bottom edge stays put
  const deckK = Math.max(1, Math.min(want, 1.3, (usableW - 40) / 1200));
  const ox = (SW - WORLD_W) / 2;
  return {
    hudK: Math.max(1, Math.min(want, 1.3)), deckK, ticketK: Math.max(1, Math.min(want * 0.95, 1.35)),
    deckX: ox + 640 * (1 - deckK), deckY: ctrlY + 708 * (1 - deckK),
    SW, SH, ox: (SW - WORLD_W) / 2, oy,
    hudY: Math.max(oy - Math.min(oy, HUD_DRIFT), safe.top),
    // the deck drifts down on tall stages, but its buttons (618..708 + shadow) never reach the home indicator
    ctrlY,
    safe, scale, width: w, height: h, left: (winW - w) / 2, top: (winH - h) / 2,
    // playable needs the scale and enough safe width for the HUD's three groups
    playable: scale >= MIN_PLAYABLE_SCALE && usableW >= 1180,
    portrait: height > width, fill: (w * h) / (winW * winH),
  };
}

/** @deprecated kept for the stage-fit tests' original cases; same playability rule. */
export const fitStage = layoutStage;
