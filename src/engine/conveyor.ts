// ConveyorSystem: the Slush Line belt. Cups index from tap to tap, dwell, then slide on.
import { CUP_CATCH, EXIT_X, HATCH_X, STATION_X } from './constants';
import { newCup } from './orders';
import { judge } from './scoring';
import type { Cup, Round } from './types';
import { easeOut, emit, lerp } from './util';

const slotX = (r: Round, s: number) => (s < r.L.taps ? STATION_X[s] : HATCH_X);

export function index(r: Round, manual: boolean): boolean {
  const b = r.belt, L = r.L;
  if (b.phase === 'slide') return false;
  const spare = manual ? Math.max(0, Math.min(1, b.dwellLeft / L.dwell)) : 0;
  const off = L.creep ? -L.creep * L.dwell * 0.5 : 0;
  for (const c of r.cups) {
    if (c.leaving) continue;
    if (c.judged) { c.leaving = true; c.vx = 0; continue; }
    c.fromX = c.x;
    if (c.slot < L.taps) { c.spare += spare; c.visits++; }
    c.slot++;
    c.toX = c.slot <= L.taps ? slotX(r, c.slot) + off : EXIT_X;
  }
  if (r.phase === 'countdown' || r.phase === 'playing') {
    const c = newCup(r);
    c.toX = slotX(r, 0) + off;
    r.cups.push(c);
  }
  b.phase = 'slide'; b.t = 0; r.indexes++;
  emit(r, { type: 'slide', manual });
  return true;
}

export function stepBelt(r: Round, dt: number, live: boolean) {
  const b = r.belt, L = r.L;
  if (b.phase === 'slide') {
    b.t += dt;
    const p = easeOut(Math.min(1, b.t / L.slide));
    for (const c of r.cups) if (!c.leaving) c.x = lerp(c.fromX, c.toX, p);
    r.beltPos = b.basePos + p * 120;
    if (b.t >= L.slide) {
      b.phase = 'dwell'; b.dwellT = 0; b.dwellLeft = L.dwell; b.basePos += 120;
      r.cups = r.cups.filter(c => c.leaving || c.slot <= L.taps);
      for (const c of r.cups) if (c.slot === L.taps && !c.judged && !c.leaving) judge(r, c);
    }
  } else {
    if (live) { b.dwellT += dt; b.dwellLeft -= dt; }
    const drift = L.creep ? L.creep * (b.dwellT - L.dwell * 0.5) : 0;
    for (const c of r.cups) if (!c.leaving) c.x = slotX(r, c.slot) + drift;
    r.beltPos = b.basePos + (L.creep ? L.creep * b.dwellT : 0);
    if (live && b.dwellLeft <= 0) index(r, false);
  }
}

export function stepLeaving(r: Round, dt: number) {
  for (const c of r.cups) {
    if (!c.leaving && c.judged && r.clock - c.judgedAt > 0.9) { c.leaving = true; c.vx = 0; }
    if (c.leaving) { c.vx = Math.min(1100, c.vx + 2600 * dt); c.x += c.vx * dt; }
  }
  r.cups = r.cups.filter(c => !(c.leaving && c.x > EXIT_X));
}

/** The unjudged cup closest to a nozzle, if it is within catching distance. */
export function cupUnder(r: Round, nx: number): Cup | null {
  let best: Cup | null = null, bd: number = CUP_CATCH;
  for (const c of r.cups) {
    if (c.judged) continue;
    const d = Math.abs(c.x - nx);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
