// RoundManager + GameLoop step: a round is a plain object advanced by a fixed timestep. No DOM, no rendering, no I/O,
// so it runs identically on device, on web, under tests and as the attract-mode bot.
import { blendBot, emptyJar, serve, setupBlend, stationCup, stepBlend, stepBlendPours } from './blend';
import { CFG, CUP_CATCH, STATION_X } from './constants';
import { cupUnder, index, stepBelt, stepLeaving } from './conveyor';
import { blendConfig, levelConfig, mulberry32, spinConfig } from './levels';
import { stepPours } from './liquid';
import { newCup } from './orders';
import { beginEnd, finish } from './scoring';
import { spinBot, stepSpin, stepSpinPours } from './spin';
import { stepPuddles, stepSpills } from './spills';
import type { Mode, Round, Tune } from './types';
import { emit } from './util';

export interface RoundOptions {
  mode?: Mode;
  tune?: Tune;
  seed?: number;
  countdown?: number;
}

export function createRound(n: number, opts: RoundOptions = {}): Round {
  const mode = opts.mode ?? 'belt', spin = mode === 'spin';
  const L = spin ? spinConfig(n, opts.tune) : mode === 'blend' ? blendConfig(n, opts.tune) : levelConfig(n, opts.tune);
  const r: Round = {
    L, n, mode, angle: spin ? -L.dir * (L.win + 8) : 0, winCup: null,
    rng: mulberry32(opts.seed ?? Math.floor(Math.random() * 1e9)), phase: 'countdown', cd: opts.countdown ?? 3.2,
    time: L.dur, elapsed: 0, clock: 0, served: 0, score: 0, combo: 0, bestCombo: 0, waste: 0,
    spills: { minor: 0, moderate: 0, major: 0 }, orders: { total: 0, perfect: 0, failed: 0, missed: 0, layered: 0 },
    cups: [], belt: { phase: 'dwell', t: 0, dwellT: 0, dwellLeft: L.dwell, basePos: 0 }, beltPos: 0, jar: emptyJar(),
    flow: [0, 0, 0, 0, 0], holdT: [0, 0, 0, 0, 0], hold: [false, false, false, false, false],
    spillEvt: [null, null, null, null, null], puddles: [], pid: 0, cid: 0, cleaned: 0, events: [],
    used: [0, 0, 0, 0, 0], indexes: 0, result: null, endT: 0, win: false, reason: '',
  };
  if (spin) {
    for (let i = 0; i < L.slots; i++) { const c = newCup(r); c.slot = i; r.cups.push(c); }
    stepSpin(r, 0, false);
  } else if (mode === 'blend') {
    setupBlend(r);
  } else {
    index(r, false);
  }
  return r;
}

export function step(r: Round, dt: number) {
  r.clock += dt;
  for (const c of r.cups) c.wob *= Math.exp(-dt * 3);
  const spin = r.mode === 'spin', blend = r.mode === 'blend';
  const transport = (live: boolean) => {
    if (spin) stepSpin(r, dt, live);
    else if (blend) { stepBlend(r, dt, live); stepLeaving(r, dt); }
    else { stepBelt(r, dt, live); stepLeaving(r, dt); }
  };
  const pours = () => (spin ? stepSpinPours(r, dt) : blend ? stepBlendPours(r, dt) : stepPours(r, dt));

  if (r.phase === 'countdown') {
    r.cd -= dt; transport(false);
    if (r.cd <= 0) { r.phase = 'playing'; emit(r, { type: 'go' }); }
    return;
  }
  if (r.phase === 'done') return;
  if (r.phase === 'ending') {
    transport(false); pours(); stepSpills(r, dt); stepPuddles(r, dt);
    if ((r.endT -= dt) <= 0) finish(r);
    return;
  }
  r.time -= dt; r.elapsed += dt;
  transport(true); pours(); stepSpills(r, dt); stepPuddles(r, dt);
  if (r.phase !== 'playing') return;
  if (r.L.wasteEnds && r.waste >= r.L.wasteBudget) beginEnd(r, false, 'flooded');
  else if (r.time <= 0) { r.time = 0; beginEnd(r, r.served >= r.L.quota, 'time'); }
}

/** SEND: index the belt early for a speed bonus. On the Blend Station it is SERVE. */
export function send(r: Round): boolean {
  if (r.mode === 'blend') return serve(r);
  if (r.mode === 'spin' || r.phase !== 'playing' || r.belt.phase !== 'dwell') return false;
  return index(r, true);
}

export function topping(r: Round): boolean {
  const L = r.L;
  if (L.topping === null || r.phase !== 'playing' || (r.mode !== 'spin' && r.belt.phase !== 'dwell')) return false;
  const c = r.mode === 'spin' ? r.winCup : r.mode === 'blend' ? stationCup(r) : cupUnder(r, STATION_X[L.taps - 1]);
  if (!c || c.topping !== null) { emit(r, { type: 'toppingMiss' }); return false; }
  c.topping = L.topping; c.topAt = r.clock;
  emit(r, { type: 'topping', cup: c });
  return true;
}

/** Autopilot for attract mode and headless balancing. skill 1 = near-perfect, lower = sloppier. */
export function bot(r: Round, skill: number, rng: () => number) {
  const L = r.L;
  if (r.mode === 'spin') return spinBot(r, skill, rng, topping);
  if (r.mode === 'blend') return blendBot(r, skill, rng, topping);
  if (r.phase !== 'playing') { r.hold = [false, false, false, false, false]; return; }
  let settled = r.belt.phase === 'dwell' && r.belt.dwellT > 0.3;
  for (let i = 0; i < L.taps; i++) {
    const nx = STATION_X[i], c = cupUnder(r, nx);
    let want = false;
    if (c && r.belt.phase === 'dwell') {
      const need = c.order.layers.find(l => l.tap === i);
      if (need) {
        if (c.botErr === undefined) c.botErr = (rng() - 0.5) * 22 * (1 - skill);
        const pred = c.vol[i] + r.flow[i] / CFG.flow.decay;
        const aligned = Math.abs(c.x - nx) < CUP_CATCH - 6 - (L.creep ? (r.flow[i] / CFG.flow.decay) * 0.5 : 0);
        want = aligned && pred < need.amt + c.botErr - 0.6;
        // on a creeping belt the cup starts each dwell short of the nozzle and drifts in: wait for it, don't send
        const coming = aligned || (L.creep > 0 && c.x < nx);
        if (want || r.flow[i] > 0 || (coming && pred < need.amt - L.tol)) settled = false;
      }
    }
    r.hold[i] = want;
  }
  if (L.topping !== null) {
    const c = cupUnder(r, STATION_X[L.taps - 1]);
    if (c && c.order.topping !== null && c.topping === null && r.belt.phase === 'dwell' && rng() < 0.08) topping(r);
    if (c && c.order.topping !== null && c.topping === null) settled = false;
  }
  if (settled && r.flow.every(f => f === 0) && rng() < 0.05 + skill * 0.1) send(r);
}
