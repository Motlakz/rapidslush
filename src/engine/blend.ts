// Blend Station: scoop the ticket's flavours into the jar, hold BLEND to the smooth band, hold POUR to the line, SERVE.
// The cup at the station waits for you (no belt timer); the queue moves on SERVE. The pour reuses the tap flow model
// (ramp-up while held, drip-off after), and the blade mirrors it: it spins up while BLEND is held and coasts after.
import { CAP, CFG, CUP_CATCH, ENTRY_X } from './constants';
import { BLEND } from './levels';
import { stepFlow } from './liquid';
import { newCup } from './orders';
import { judge } from './scoring';
import { wasteAt } from './spills';
import type { Cup, Jar, Round } from './types';
import { easeOut, emit, lerp } from './util';

/** hold channels on Round.hold / flow: the blade and the jar's pour */
export const BLADE = 0, POUR = 1;

export const emptyJar = (): Jar => ({ has: [false, false, false, false, false], meter: 0, speed: 0, left: 0, wait: 0 });
const inJar = (r: Round) => r.jar.has.flatMap((h, i) => (h ? [i] : []));

/** The unjudged cup at the station, once it has arrived there. */
export function stationCup(r: Round): Cup | null {
  for (const c of r.cups) if (!c.judged && !c.leaving && c.slot === 0 && Math.abs(c.x - BLEND.CX) < CUP_CATCH) return c;
  return null;
}

export function setupBlend(r: Round) {
  for (let k = 0; k < 3; k++) {
    const c = newCup(r);
    c.slot = k; c.x = c.fromX = c.toX = BLEND.QX[k];
    r.cups.push(c);
  }
}

/** Drop a flavour into the jar. Scooping into a half-blended jar knocks the smoothness back. */
export function scoop(r: Round, i: number): boolean {
  if (r.phase !== 'playing' || i >= r.L.taps) return false;
  const c = stationCup(r);
  if (c && c.total > 0.3) return false; // the jar is already being poured: serve first
  const J = r.jar;
  if (J.has[i]) return false;
  J.has[i] = true;
  J.left = BLEND.JAR;
  J.meter *= 0.5;
  emit(r, { type: 'scoop', flavour: r.L.flavours[i] });
  return true;
}

/** SERVE: judge the cup at the station, send it out, and move the queue up. */
export function serve(r: Round): boolean {
  if (r.phase !== 'playing' || r.belt.phase !== 'dwell') return false;
  const c = stationCup(r);
  if (!c) return false;
  const J = r.jar;
  c.visits = 1;
  c.spare = Math.max(0, Math.min(1, 1 - J.wait / r.L.dwell));
  if (c.smooth < 0) c.smooth = J.meter;
  judge(r, c);
  c.leaving = true; c.vx = 0;
  for (const q of r.cups) {
    if (q.leaving) continue;
    q.fromX = q.x; q.slot -= 1; q.toX = BLEND.QX[q.slot];
  }
  if (r.phase === 'playing') {
    const nc = newCup(r);
    nc.slot = 2; nc.x = nc.fromX = ENTRY_X - 220; nc.toX = BLEND.QX[2];
    r.cups.push(nc);
  }
  r.jar = emptyJar();
  r.flow[POUR] = 0; r.holdT[POUR] = 0;
  r.belt.phase = 'slide'; r.belt.t = 0; r.indexes++;
  emit(r, { type: 'slide', manual: true });
  return true;
}

/** Queue slide, the blade, and the speed-bonus clock. */
export function stepBlend(r: Round, dt: number, live: boolean) {
  const b = r.belt, J = r.jar, L = r.L;
  if (b.phase === 'slide') {
    b.t += dt;
    const p = easeOut(Math.min(1, b.t / L.slide));
    for (const c of r.cups) if (!c.leaving) c.x = lerp(c.fromX, c.toX, p);
    r.beltPos = b.basePos + p * 120;
    if (b.t >= L.slide) { b.phase = 'dwell'; b.basePos += 120; }
  } else if (live) {
    J.wait += dt;
  }
  // the blade: spins up while BLEND is held, coasts down after; only a jar with fruit in it gets smoother
  const c = stationCup(r);
  const loaded = J.has.some(Boolean) && J.left > 0 && !(c && c.total > 0.3);
  const holding = live && r.hold[BLADE] && loaded && r.phase === 'playing';
  const frozen = c?.order.frozen ? BLEND.FROZEN : 1;
  if (holding) J.speed += (L.speed * frozen - J.speed) * Math.min(1, dt * CFG.blend.ramp);
  else { J.speed *= Math.exp(-dt * CFG.blend.decay); if (J.speed < 0.004) J.speed = 0; }
  if (loaded) J.meter = Math.min(BLEND.METER_MAX, J.meter + J.speed * dt);
}

/** The jar's spout: pours the blend into the cup at the station, or onto the counter when no cup is there. */
export function stepBlendPours(r: Round, dt: number) {
  const J = r.jar, ch = inJar(r);
  stepFlow(r, POUR, dt, r.hold[POUR] && r.phase === 'playing' && J.left > 0 && ch.length > 0);
  if (r.flow[POUR] <= 0 || !ch.length) return;
  const amt = Math.min(r.flow[POUR] * dt, J.left);
  J.left -= amt;
  r.used[POUR] += amt;
  if (J.left <= 0) { J.left = 0; r.flow[POUR] = 0; }
  const c = stationCup(r);
  if (c) pourMix(r, c, ch, amt);
  else wasteAt(r, ch[0], amt, BLEND.CX, 'outside');
}

/** A blend goes in as one layer, split evenly across the jar's flavours (so flavour checks still work). */
function pourMix(r: Round, c: Cup, ch: number[], amt: number) {
  if (c.smooth < 0) c.smooth = r.jar.meter;
  for (const i of ch) c.vol[i] += amt / ch.length;
  c.total += amt;
  c.seq = [{ tap: ch[0], amt: c.total }];
  c.wob = Math.min(1, c.wob + amt * 0.06);
  if (c.total > CAP) {
    const ov = c.total - CAP;
    c.total = CAP; c.seq[0].amt = CAP;
    for (const i of ch) c.vol[i] -= ov / ch.length;
    if (!c.overflowed) c.ovAt = r.clock;
    c.overflowed = true;
    wasteAt(r, ch[0], ov, c.x, 'overflow');
  }
}

/** Autopilot: scoop what the ticket says, blend to a target near the band's middle, pour to the line, serve. */
export function blendBot(r: Round, skill: number, rng: () => number, topping: (r: Round) => boolean) {
  r.hold = [false, false, false, false, false];
  if (r.phase !== 'playing' || r.belt.phase !== 'dwell') return;
  const c = stationCup(r), J = r.jar;
  if (!c) return;
  if (c.botErr === undefined) c.botErr = (rng() - 0.5) * 22 * (1 - skill);
  const need = c.order.layers.map(l => l.tap).find(i => !J.has[i]);
  if (need !== undefined) { if (rng() < 0.12) scoop(r, need); return; }
  if (c.total < 0.3) {
    const target = BLEND.CENTER + (c.botErr / 22) * r.L.zone * 2.2;
    if (J.meter + J.speed / CFG.blend.decay < target) { r.hold[BLADE] = true; return; }
    if (J.speed > 0.01) return; // let the blade settle before pouring
  }
  const pred = c.total + r.flow[POUR] / CFG.flow.decay;
  if (pred < c.order.total + c.botErr - 0.6 && J.left > 0) { r.hold[POUR] = true; return; }
  if (r.flow[POUR] > 0) return;
  if (c.order.topping !== null && c.topping === null) { if (rng() < 0.08) topping(r); return; }
  if (rng() < 0.05 + skill * 0.08) serve(r);
}
