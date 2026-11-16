// OrderManager: what each customer wants, and the cups that carry those orders.
import { ENTRY_X } from './constants';
import type { Cup, Layer, Order, OrderType, Round } from './types';

const fits = (t: string, taps: number) => t === 'single' || (t === 'trio' ? taps >= 3 : taps >= 2);

export function makeOrder(r: Round): Order {
  const L = r.L, rng = r.rng;
  const types = (Object.entries(L.mix) as [OrderType, number | undefined][]).filter(([t, w]) => w !== undefined && fits(t, L.taps)) as [OrderType, number][];
  let pick = rng() * types.reduce((a, [, w]) => a + w, 0);
  let type: OrderType = 'single';
  for (const [t, w] of types) { if ((pick -= w) < 0) { type = t; break; } }

  let total = 5 * Math.round((60 + rng() * 25) / 5);
  let layers: Layer[];
  const taps = [...Array(L.taps).keys()];
  if (type === 'single') {
    layers = [{ tap: taps[Math.floor(rng() * taps.length)], amt: total }];
  } else if (type === 'trio') {
    const a = 15 + Math.floor(rng() * ((total - 45) / 5 + 1)) * 5, rest = total - a;
    const b = 15 + Math.floor(rng() * ((rest - 30) / 5 + 1)) * 5;
    layers = [{ tap: 0, amt: a }, { tap: 1, amt: b }, { tap: 2, amt: total - a - b }];
  } else {
    const pair = taps.slice().sort(() => rng() - 0.5).slice(0, 2).sort((x, y) => x - y);
    if (type === 'duo') {
      total = 10 * Math.round(total / 10);
      layers = [{ tap: pair[0], amt: total / 2 }, { tap: pair[1], amt: total / 2 }];
    } else {
      const ratios = [0.3, 0.35, 0.4, 0.6, 0.65, 0.7];
      const a = Math.max(15, Math.min(total - 15, 5 * Math.round((total * ratios[Math.floor(rng() * ratios.length)]) / 5)));
      layers = [{ tap: pair[0], amt: a }, { tap: pair[1], amt: total - a }];
    }
  }
  const topping = L.topping !== null && rng() < L.toppingChance ? L.topping : null;
  return { type, layers, total, topping, multi: layers.length > 1 };
}

export function newCup(r: Round): Cup {
  return {
    id: ++r.cid, order: makeOrder(r), slot: 0, x: ENTRY_X, fromX: ENTRY_X, toX: ENTRY_X,
    vol: [0, 0, 0, 0, 0], seq: [], total: 0, overflowed: false, ovAt: 0, topping: null, topAt: 0,
    spare: 0, visits: 0, judged: false, verdict: null, judgedAt: 0, wob: 0, seed: Math.floor(r.rng() * 1e9),
    leaving: false, vx: 0, laps: 0, inWin: false, p: null,
  };
}
