// SpillSystem (plan §3): waste accrues per tap into one spill event, finalized once the pour goes quiet,
// then graded minor / moderate / major. Puddles are decals; with `persist` they stay until swiped.
import { CFG, COUNTER_Y } from './constants';
import type { Puddle, Round, Severity, WasteKind } from './types';
import { emit } from './util';

export function wasteAt(r: Round, i: number, amt: number, x: number, kind: WasteKind) {
  const tray = kind === 'tray';
  if (!tray) r.waste += amt; // tray drips only count once they add up to a real spill
  const color = r.L.flavours[i];
  let e = r.spillEvt[i];
  if (!e) e = r.spillEvt[i] = { kind, amt: 0, x, color, quiet: 0 };
  e.amt += amt; e.quiet = 0; e.x = x;
  if (kind === 'overflow') e.kind = 'overflow';
  if (!tray) addPuddle(r, x, amt, color);
}

export function addPuddle(r: Round, x: number, amt: number, color: number) {
  let p = r.puddles.find(q => Math.abs(q.x - x) < 46 && q.color === color);
  if (!p) {
    if (r.puddles.length >= 14) r.puddles.shift();
    const spin = r.mode === 'spin';
    p = {
      id: ++r.pid, x: x + (r.rng() - 0.5) * (spin ? 60 : 16), y: (spin ? 596 : COUNTER_Y) + (r.rng() - 0.5) * 14,
      vol: 0, a: 1, color, seed: r.rng() * 1000,
    };
    r.puddles.push(p);
  }
  p.vol += amt; p.a = 1;
}

export const puddleR = (p: Puddle) => Math.min(62, 12 + Math.sqrt(p.vol) * 6);

export function finalizeSpill(r: Round, i: number) {
  const e = r.spillEvt[i];
  r.spillEvt[i] = null;
  if (!e || e.amt < (e.kind === 'tray' ? CFG.spill.trayGrace : CFG.spill.grace)) return; // grace: never punish a one-frame drip
  if (e.kind === 'tray') { r.waste += e.amt; addPuddle(r, e.x, e.amt, e.color); }
  const S = CFG.scoring;
  const sev: Severity = e.amt < CFG.spill.minor ? 'minor' : e.amt < CFG.spill.moderate ? 'moderate' : 'major';
  r.spills[sev]++;
  r.score = Math.max(0, r.score + S[sev]);
  if (sev !== 'minor') r.combo = 0;
  if (sev === 'major') r.time = Math.max(0, r.time - S.majorTime);
  emit(r, { type: 'spill', sev, pen: S[sev], x: e.x, kind: e.kind, amt: e.amt, color: e.color, timePen: sev === 'major' ? S.majorTime : 0 });
}

export function stepSpills(r: Round, dt: number) {
  for (let i = 0; i < 5; i++) {
    const e = r.spillEvt[i];
    if (e && (e.quiet += dt) > 0.3) finalizeSpill(r, i);
  }
}

export function stepPuddles(r: Round, dt: number) {
  if (r.L.persist) return;
  for (const p of r.puddles) p.a -= dt * 0.22;
  r.puddles = r.puddles.filter(p => p.a > 0.02);
}

/** Cleanup (plan §3.7): a swipe of `dist` logical px at (x, y) wipes any puddle it passes over. */
export function clean(r: Round, x: number, y: number, dist: number) {
  if (r.phase !== 'playing' && r.phase !== 'ending') return;
  for (const p of r.puddles) {
    const rx = puddleR(p) * 1.25, ry = rx * 0.5, dx = (x - p.x) / rx, dy = (y - p.y) / ry;
    if (dx * dx + dy * dy < 1.6) {
      p.a -= dist / (puddleR(p) * 3);
      if (p.a <= 0) { r.cleaned++; emit(r, { type: 'clean', x: p.x, y: p.y }); }
    }
  }
  r.puddles = r.puddles.filter(p => p.a > 0);
}
