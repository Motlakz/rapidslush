/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';

import { CAP, CFG, STATION_X } from '../constants';
import { BLEND, blendConfig, levelConfig, MAX_LEVEL, mulberry32, SPIN, spinConfig } from '../levels';
import { BLADE, POUR, scoop, stationCup } from '../blend';
import { pourInto } from '../liquid';
import { bot, clean, createRound, send, step, topping } from '../index';
import { judge } from '../scoring';
import { finalizeSpill, wasteAt } from '../spills';
import type { Cup, Round } from '../types';

const DT = 1 / 120;
const run = (r: Round, secs: number, each?: (r: Round) => void) => {
  for (let t = 0; t < secs; t += DT) { each?.(r); step(r, DT); }
};
const toPlaying = (r: Round) => { while (r.phase === 'countdown') step(r, DT); };
const settle = (r: Round) => { while (r.belt.phase === 'slide') step(r, DT); };
const firstCup = (r: Round) => r.cups.find(c => !c.judged)!;
const setOrder = (c: Cup, tap: number, amt: number, topping: number | null = null) => {
  c.order = { type: 'single', layers: [{ tap, amt }], total: amt, topping, multi: false, frozen: false };
};

describe('liquid model', () => {
  test('pours accumulate in volume and layer sequence', () => {
    const r = createRound(1, { seed: 1 });
    const c = firstCup(r);
    pourInto(r, c, 0, 30); pourInto(r, c, 0, 10); pourInto(r, c, 1, 5);
    expect(c.total).toBe(45);
    expect(c.vol.slice(0, 2)).toEqual([40, 5]);
    expect(c.seq).toEqual([{ tap: 0, amt: 40 }, { tap: 1, amt: 5 }]);
  });

  test('overfill caps at capacity and turns the excess into overflow waste', () => {
    const r = createRound(1, { seed: 1 });
    const c = firstCup(r);
    pourInto(r, c, 0, CAP + 12);
    expect(c.total).toBe(CAP);
    expect(c.overflowed).toBe(true);
    expect(r.waste).toBeCloseTo(12);
    expect(r.spillEvt[0]?.kind).toBe('overflow');
  });

  test('flow ramps while held and keeps dripping after release', () => {
    const r = createRound(1, { seed: 2 });
    toPlaying(r); settle(r);
    r.hold[0] = true; run(r, 0.6);
    const held = r.flow[0];
    expect(held).toBeGreaterThan(CFG.flow.base);
    r.hold[0] = false; step(r, DT);
    expect(r.flow[0]).toBeGreaterThan(0);
    expect(r.flow[0]).toBeLessThan(held);
    run(r, 1.5);
    expect(r.flow[0]).toBe(0);
  });
});

describe('spills', () => {
  test('pouring with no cup under the nozzle is external waste', () => {
    const r = createRound(1, { seed: 3 });
    toPlaying(r);
    r.cups = [];
    r.hold[0] = true; run(r, 0.5); r.hold[0] = false;
    expect(r.waste).toBeGreaterThan(0);
    expect(r.puddles.length).toBe(1);
  });

  test('severity boundaries: grace, minor, moderate, major', () => {
    const sev = (amt: number) => {
      const r = createRound(1, { seed: 4 });
      r.time = 50; r.score = 500;
      wasteAt(r, 0, amt, STATION_X[0], 'outside');
      finalizeSpill(r, 0);
      return r;
    };
    expect(sev(CFG.spill.grace - 0.1).events.filter(e => e.type === 'spill')).toHaveLength(0);
    expect(sev(CFG.spill.minor - 0.1).spills.minor).toBe(1);
    expect(sev(CFG.spill.moderate - 0.1).spills.moderate).toBe(1);
    const major = sev(CFG.spill.moderate + 1);
    expect(major.spills.major).toBe(1);
    expect(major.time).toBe(50 - CFG.scoring.majorTime);
    expect(major.score).toBe(500 + CFG.scoring.major);
  });

  test('a moderate spill breaks the combo, a minor one does not', () => {
    const r = createRound(1, { seed: 5 });
    r.combo = 4;
    wasteAt(r, 0, 3, 400, 'outside'); finalizeSpill(r, 0);
    expect(r.combo).toBe(4);
    wasteAt(r, 0, 10, 400, 'outside'); finalizeSpill(r, 0);
    expect(r.combo).toBe(0);
  });

  test('a swipe across a persistent puddle wipes it', () => {
    const r = createRound(8, { seed: 6 });
    expect(r.L.persist).toBe(true);
    toPlaying(r);
    wasteAt(r, 0, 10, 400, 'outside');
    const p = r.puddles[0];
    for (let k = 0; k < 40 && r.puddles.length; k++) clean(r, p.x, p.y, 20);
    expect(r.puddles).toHaveLength(0);
    expect(r.cleaned).toBe(1);
  });
});

describe('scoring', () => {
  const judged = (fill: number, opts: { tap?: number; target?: number } = {}) => {
    const r = createRound(1, { seed: 7 });
    const c = firstCup(r);
    setOrder(c, 0, opts.target ?? 70);
    pourInto(r, c, opts.tap ?? 0, fill);
    judge(r, c);
    return { r, v: c.verdict! };
  };

  test('perfect fill scores flavour + fill + perfect', () => {
    const { v } = judged(70);
    expect(v.ok && v.perfect).toBe(true);
    expect(v.pts).toBe(CFG.scoring.flavour + CFG.scoring.fill + CFG.scoring.perfect);
  });
  test('inside the band but off-centre is served, not perfect', () => {
    const tol = levelConfig(1).tol;
    const { v } = judged(70 + tol * 0.8);
    expect(v.ok).toBe(true);
    expect(v.perfect).toBe(false);
  });
  test('outside the band fails with a readable label', () => {
    expect(judged(40).v.label).toBe('Too little');
  });
  test('wrong flavour fails', () => {
    const { v } = judged(70, { tap: 1 });
    expect(v.ok).toBe(false);
    expect(v.label).toBe('Wrong flavour');
  });
  test('an empty cup is a miss, not a spill', () => {
    const { r, v } = judged(0);
    expect(v.label).toBe('Missed');
    expect(r.orders.missed).toBe(1);
    expect(r.spills.minor + r.spills.moderate + r.spills.major).toBe(0);
  });
  test('layers off is partial credit: served without the layer bonus', () => {
    const r = createRound(20, { seed: 8 });
    const c = firstCup(r);
    c.order = { type: 'duo', layers: [{ tap: 0, amt: 35 }, { tap: 1, amt: 35 }], total: 70, topping: null, multi: true, frozen: false };
    pourInto(r, c, 0, 55); pourInto(r, c, 1, 15);
    judge(r, c);
    expect(c.verdict!.ok).toBe(true);
    expect(c.verdict!.label).toBe('Layers off');
    expect(r.combo).toBe(0);
  });
  test('combo multiplier grows on consecutive serves and is capped', () => {
    const r = createRound(1, { seed: 9 });
    const mults: number[] = [];
    for (let k = 0; k < 14; k++) {
      const c = firstCup(r);
      setOrder(c, 0, 70); pourInto(r, c, 0, 70); judge(r, c);
      mults.push(c.verdict!.mult);
      r.cups = r.cups.filter(x => x !== c);
      r.cups.push({ ...c, id: 100 + k, judged: false, verdict: null, total: 0, vol: [0, 0, 0, 0, 0], seq: [], overflowed: false });
      r.phase = 'playing';
    }
    expect(mults[0]).toBe(1);
    expect(mults[1]).toBeGreaterThan(1);
    expect(Math.max(...mults)).toBe(CFG.scoring.comboMax);
  });
});

describe('conveyor', () => {
  test('cups index tap → hatch and are judged at the hatch', () => {
    const r = createRound(1, { seed: 10 });
    toPlaying(r); settle(r);
    const c = firstCup(r);
    expect(Math.abs(c.x - STATION_X[0])).toBeLessThan(1);
    expect(send(r)).toBe(true);
    settle(r);
    expect(c.judged).toBe(true);
  });
  test('send is refused while the belt is sliding', () => {
    const r = createRound(1, { seed: 11 });
    toPlaying(r); settle(r);
    send(r);
    expect(send(r)).toBe(false);
  });
  test('an unserved order times out when the belt moves on by itself', () => {
    const r = createRound(1, { seed: 12 });
    toPlaying(r);
    run(r, r.L.dwell * 2 + 2);
    expect(r.orders.missed).toBeGreaterThan(0);
  });
  test('topping lands on the cup under the last tap only during a dwell', () => {
    const r = createRound(11, { seed: 13 });
    toPlaying(r); settle(r);
    expect(topping(r)).toBe(false); // the first cup is still at tap 1
    for (let k = 0; k < r.L.taps - 1; k++) { send(r); settle(r); }
    expect(topping(r)).toBe(true);
    expect(topping(r)).toBe(false); // already topped
  });
});

describe('round lifecycle', () => {
  test('timer expiry without quota ends the round as a loss', () => {
    const r = createRound(1, { seed: 14 });
    run(r, r.L.dur + 10);
    expect(r.phase).toBe('done');
    expect(r.result!.win).toBe(false);
    expect(r.result!.stars).toBe(0);
  });

  test('the waste limit ends strict rounds as flooded', () => {
    const r = createRound(42, { seed: 15 });
    expect(r.L.wasteEnds).toBe(true);
    toPlaying(r);
    r.cups = [];
    r.hold[0] = true; run(r, 6);
    expect(r.reason).toBe('flooded');
  });

  test('a skilled bot clears the opening levels with stars', () => {
    for (const n of [1, 2, 3, 6]) {
      const r = createRound(n, { seed: 100 + n });
      const rng = mulberry32(n);
      run(r, r.L.dur + 10, x => bot(x, 1, rng));
      expect(r.result?.win).toBe(true);
      expect(r.result!.stars).toBeGreaterThanOrEqual(2);
    }
  });

  test('every level is winnable by a good player (balance sanity)', () => {
    const fails: number[] = [];
    for (let n = 1; n <= MAX_LEVEL; n++) {
      let wins = 0;
      for (let s = 0; s < 3; s++) {
        const r = createRound(n, { seed: n * 31 + s });
        const rng = mulberry32(n * 7 + s);
        run(r, r.L.dur + 10, x => bot(x, 0.95, rng));
        if (r.result?.win) wins++;
      }
      if (wins === 0) fails.push(n);
    }
    expect(fails).toEqual([]);
  });

  test('every Spin Bar level is winnable by a good player', () => {
    const fails: number[] = [];
    for (let n = 1; n <= SPIN.MAX_LEVEL; n++) {
      let wins = 0;
      for (let s = 0; s < 3; s++) {
        const r = createRound(n, { seed: n * 13 + s, mode: 'spin' });
        const rng = mulberry32(n * 5 + s);
        run(r, r.L.dur + 10, x => bot(x, 0.95, rng));
        if (r.result?.win) wins++;
      }
      if (wins === 0) fails.push(n);
    }
    expect(fails).toEqual([]);
  });

  test('every Blend Station level is winnable by a good player', () => {
    const fails: number[] = [];
    for (let n = 1; n <= BLEND.MAX_LEVEL; n++) {
      let wins = 0;
      for (let s = 0; s < 3; s++) {
        const r = createRound(n, { seed: n * 17 + s, mode: 'blend' });
        const rng = mulberry32(n * 7 + s);
        run(r, r.L.dur + 10, x => bot(x, 0.95, rng));
        if (r.result?.win) wins++;
      }
      if (wins === 0) fails.push(n);
    }
    expect(fails).toEqual([]);
  });

  test('rounds are deterministic for a seed', () => {
    const play = () => {
      const r = createRound(25, { seed: 999 });
      const rng = mulberry32(5);
      run(r, r.L.dur + 10, x => bot(x, 0.8, rng));
      return r.result!.score;
    };
    expect(play()).toBe(play());
  });
});

describe('level configs', () => {
  test('one new idea at a time: taps never shrink and difficulty rises overall', () => {
    let taps = 0;
    for (let n = 1; n <= MAX_LEVEL; n++) {
      const L = levelConfig(n);
      expect(L.taps).toBeGreaterThanOrEqual(taps);
      taps = L.taps;
      expect(L.flavours).toHaveLength(L.taps);
      expect(new Set(L.flavours).size).toBe(L.taps);
    }
    expect(levelConfig(90).tol).toBeLessThan(levelConfig(1).tol);
    expect(levelConfig(90).quota).toBeGreaterThan(levelConfig(1).quota);
  });
  test('spin configs use 2–5 flavour buttons', () => {
    for (let n = 1; n <= SPIN.MAX_LEVEL; n++) {
      const L = spinConfig(n);
      expect(L.taps).toBeGreaterThanOrEqual(2);
      expect(L.taps).toBeLessThanOrEqual(5);
    }
  });
});

describe('blend station', () => {
  const ready = (n = 1) => { const r = createRound(n, { seed: 3, mode: 'blend' }); toPlaying(r); return r; };
  const blendTo = (r: Round, meter: number) => { r.jar.meter = meter; r.jar.speed = 0; };
  const pourTo = (r: Round, amt: number) => {
    r.hold[POUR] = true;
    while (stationCup(r)!.total + r.flow[POUR] / CFG.flow.decay < amt) step(r, DT);
    r.hold[POUR] = false;
    run(r, 0.6);
  };

  test('a smooth, well-poured blend is served; the queue moves up on SERVE', () => {
    const r = ready(), c = stationCup(r)!;
    for (const l of c.order.layers) scoop(r, l.tap);
    blendTo(r, BLEND.CENTER);
    pourTo(r, c.order.total);
    expect(send(r)).toBe(true);
    expect(c.verdict!.ok).toBe(true);
    expect(c.leaving).toBe(true);
    settle(r);
    expect(stationCup(r)).not.toBe(c);
    expect(r.jar.has.some(Boolean)).toBe(false);
  });

  test('outside the smooth band is chunky or watery, and fails', () => {
    for (const [meter, label] of [[0.2, 'Too chunky'], [1.2, 'Too watery']] as const) {
      const r = ready(), c = stationCup(r)!;
      for (const l of c.order.layers) scoop(r, l.tap);
      blendTo(r, meter);
      pourTo(r, c.order.total);
      send(r);
      expect(c.verdict!.ok).toBe(false);
      expect(c.verdict!.label).toBe(label);
    }
  });

  test('the blade coasts after BLEND is released, and frozen fruit blends slower', () => {
    const climb = (frozen: boolean) => {
      const r = ready(9), c = stationCup(r)!;
      c.order.frozen = frozen;
      scoop(r, c.order.layers[0].tap);
      r.hold[BLADE] = true; run(r, 0.6); r.hold[BLADE] = false;
      const atRelease = r.jar.meter;
      run(r, 1);
      return { atRelease, after: r.jar.meter };
    };
    const warm = climb(false), cold = climb(true);
    expect(warm.after).toBeGreaterThan(warm.atRelease);
    expect(cold.atRelease).toBeLessThan(warm.atRelease);
  });

  test('a missing flavour fails the order; scooping is locked once the pour starts', () => {
    const r = ready(3), c = stationCup(r)!;
    c.order = { type: 'duo', layers: [{ tap: 0, amt: 35 }, { tap: 1, amt: 35 }], total: 70, topping: null, multi: false, frozen: false };
    scoop(r, 0);
    blendTo(r, BLEND.CENTER);
    pourTo(r, 70);
    expect(scoop(r, 1)).toBe(false);
    send(r);
    expect(c.verdict!.label).toBe('Missing flavour');
  });

  test('pouring with no cup at the station is waste', () => {
    const r = ready(), c = stationCup(r)!;
    scoop(r, c.order.layers[0].tap);
    send(r); // serve the empty cup: missed, and the queue starts sliding
    scoop(r, 0); // nothing at the station mid-slide, but the jar can still be loaded
    r.jar.has[0] = true; r.jar.left = BLEND.JAR;
    r.hold[POUR] = true; run(r, 0.3); r.hold[POUR] = false;
    expect(r.waste).toBeGreaterThan(0);
  });

  test('blend configs use 2–4 flavour bins and the band narrows', () => {
    for (let n = 1; n <= BLEND.MAX_LEVEL; n++) {
      const L = blendConfig(n);
      expect(L.taps).toBeGreaterThanOrEqual(2);
      expect(L.taps).toBeLessThanOrEqual(4);
      expect(new Set(L.flavours).size).toBe(L.taps);
    }
    expect(blendConfig(30).zone).toBeLessThan(blendConfig(1).zone);
  });
});
