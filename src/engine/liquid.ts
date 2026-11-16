// DispenserController + LiquidModel: hold-to-pour flow with ramp-up and drip-off, poured into abstract 0–100 volumes.
import { CAP, CFG, STATION_X } from './constants';
import { cupUnder } from './conveyor';
import { wasteAt } from './spills';
import type { Cup, Round } from './types';

/** Advances one tap's flow rate. Holding ramps towards flowMax; letting go decays exponentially (the drip). */
export function stepFlow(r: Round, i: number, dt: number, holding: boolean) {
  const L = r.L, F = CFG.flow;
  if (holding) {
    r.holdT[i] += dt;
    const tgt = Math.min(L.flowMax, L.base + r.holdT[i] * L.accel);
    r.flow[i] += (tgt - r.flow[i]) * Math.min(1, dt * F.ramp);
  } else {
    r.holdT[i] = 0;
    r.flow[i] *= Math.exp(-dt * F.decay);
    if (r.flow[i] < 0.5) r.flow[i] = 0;
  }
}

export function stepPours(r: Round, dt: number) {
  const L = r.L;
  for (let i = 0; i < 3; i++) {
    stepFlow(r, i, dt, i < L.taps && r.hold[i] && r.phase === 'playing');
    if (r.flow[i] <= 0) continue;
    const amt = r.flow[i] * dt, nx = STATION_X[i];
    r.used[i] += amt;
    const cup = cupUnder(r, nx);
    if (cup) pourInto(r, cup, i, amt);
    else wasteAt(r, i, amt, nx, 'outside');
  }
}

export function pourInto(r: Round, c: Cup, i: number, amt: number) {
  c.vol[i] += amt; c.total += amt;
  let last = c.seq[c.seq.length - 1];
  if (last && last.tap === i) last.amt += amt;
  else { last = { tap: i, amt }; c.seq.push(last); }
  c.wob = Math.min(1, c.wob + amt * 0.06);
  if (c.total > CAP) {
    const ov = c.total - CAP;
    c.total = CAP; c.vol[i] -= ov; last.amt -= ov;
    if (!c.overflowed) c.ovAt = r.clock;
    c.overflowed = true;
    wasteAt(r, i, ov, c.x, 'overflow');
  }
}
