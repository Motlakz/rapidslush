// Spin Bar: the carousel machine. Same liquid/spill/scoring systems; only the transport differs.
import { CFG } from './constants';
import { SPIN } from './levels';
import { pourInto, stepFlow } from './liquid';
import { newCup } from './orders';
import { judge } from './scoring';
import { wasteAt } from './spills';
import type { Cup, Round, SpinPos } from './types';
import { emit } from './util';

const normDeg = (a: number) => {
  a = ((a % 360) + 360) % 360;
  return a > 180 ? a - 360 : a;
};

export function spinPos(r: Round, c: Cup): SpinPos {
  const deg = normDeg(r.angle + (c.slot * 360) / r.L.slots), th = (deg * Math.PI) / 180;
  return { x: SPIN.CX + SPIN.RX * Math.sin(th), y: SPIN.CY + SPIN.RY * Math.cos(th), s: 0.62 + (0.38 * (Math.cos(th) + 1)) / 2, deg, th };
}

export function stepSpin(r: Round, dt: number, live: boolean) {
  const L = r.L;
  if (live) r.angle += L.dir * L.speed * dt;
  let win: Cup | null = null, best = 999;
  for (let k = 0; k < r.cups.length; k++) {
    const c = r.cups[k];
    const p = spinPos(r, c), inW = Math.abs(p.deg) < L.win;
    c.x = p.x; c.p = p;
    if (c.inWin && !inW && live) leaveWindow(r, c);
    c.inWin = inW;
    if (inW && Math.abs(p.deg) < best && !c.judged) { best = Math.abs(p.deg); win = c; }
    // served cups are swapped for a fresh order once they rotate round to the back
    if (c.judged && Math.cos(p.th) < -0.6 && r.clock - c.judgedAt > 0.4 && (r.phase === 'playing' || r.phase === 'countdown')) {
      const nc = newCup(r);
      nc.slot = c.slot; nc.x = p.x; nc.p = p;
      r.cups[k] = nc;
    }
  }
  r.winCup = win;
}

function leaveWindow(r: Round, c: Cup) {
  c.laps += 1;
  if (c.judged) return;
  const L = r.L, o = c.order;
  let wrong = 0;
  for (let i = 0; i < c.vol.length; i++) if (!o.layers.some(l => l.tap === i)) wrong += c.vol[i];
  if (c.total < 3) { if (c.laps >= L.maxLaps) judge(r, c); return; }
  const short = o.layers.some(l => c.vol[l.tap] < l.amt - L.tol) || (o.topping !== null && c.topping === null);
  if (short && !c.overflowed && wrong <= 3 && c.laps < L.maxLaps) { emit(r, { type: 'lap', cup: c }); return; } // second chance
  judge(r, c);
}

export function stepSpinPours(r: Round, dt: number) {
  const L = r.L;
  for (let i = 0; i < L.taps; i++) {
    stepFlow(r, i, dt, r.hold[i] && r.phase === 'playing');
    if (r.flow[i] <= 0) continue;
    const amt = r.flow[i] * dt;
    r.used[i] += amt;
    // a drip tray under the nozzle catches most of the overrun between cups; long pours into nothing still count
    if (r.winCup && !r.winCup.judged) pourInto(r, r.winCup, i, amt);
    else wasteAt(r, i, amt * 0.25, SPIN.CX, 'tray');
  }
}

export function spinBot(r: Round, skill: number, rng: () => number, topping: (r: Round) => boolean) {
  r.hold = [false, false, false, false, false];
  const c = r.winCup;
  if (!c || c.judged || r.phase !== 'playing' || !c.p) return;
  if (c.botErr === undefined) c.botErr = (rng() - 0.5) * 22 * (1 - skill);
  const err = c.botErr;
  const layer = c.order.layers.find(l => c.vol[l.tap] + r.flow[l.tap] / CFG.flow.decay < l.amt + err - 0.6);
  if (layer && Math.abs(c.p.deg) < r.L.win - 1.5) r.hold[layer.tap] = true;
  if (c.order.topping !== null && c.topping === null && rng() < 0.08) topping(r);
}
