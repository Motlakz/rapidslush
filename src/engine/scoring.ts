// ScoringEngine + round end (plan §4.1). Pure functions of the cup and level config.
import { CFG } from './constants';
import { finalizeSpill } from './spills';
import type { Cup, Round } from './types';
import { emit } from './util';

export function judge(r: Round, c: Cup) {
  const o = c.order, L = r.L, tol = L.tol, S = CFG.scoring;
  c.judged = true; c.judgedAt = r.clock; r.orders.total++;
  if (c.total < 3) {
    c.verdict = { ok: false, perfect: false, label: 'Missed', pts: 0, mult: 1, speed: 0, err: -o.total };
    r.orders.missed++; r.combo = 0;
    emit(r, { type: 'judge', cup: c });
    return;
  }
  const need = [0, 0, 0, 0, 0];
  o.layers.forEach(l => (need[l.tap] += l.amt));
  let wrong = 0;
  for (let i = 0; i < c.vol.length; i++) if (!need[i]) wrong += c.vol[i];
  const flavourOk = wrong <= 3 && o.layers.every(l => c.vol[l.tap] >= 3);
  const err = c.total - o.total, fillOk = Math.abs(err) <= tol && !c.overflowed;
  const layerErr = o.multi ? Math.max(...o.layers.map(l => Math.abs(c.vol[l.tap] - l.amt))) : 0;
  const layersOk = !o.multi || layerErr <= tol;
  const toppingOk = o.topping === c.topping;
  const perfect = flavourOk && fillOk && layersOk && toppingOk && Math.abs(err) <= tol * 0.35 && (!o.multi || layerErr <= tol * 0.5);
  const served = flavourOk && fillOk && toppingOk; // layers off = partial credit, still counts (plan §3.3)

  let label: string;
  if (!flavourOk) label = wrong > 3 ? 'Wrong flavour' : 'Missing flavour';
  else if (c.overflowed) label = 'Spilled';
  else if (!fillOk) label = err < 0 ? 'Too little' : 'Too much';
  else if (!toppingOk) label = o.topping !== null ? 'No topping' : 'Extra topping';
  else if (!layersOk) label = 'Layers off';
  else label = perfect ? 'Perfect!' : 'Nice';

  let pts = 0, speed = 0, mult = 1;
  if (served) {
    pts += S.flavour + S.fill;
    if (o.multi && layersOk) pts += S.layers;
    if (o.topping !== null) pts += S.topping;
    if (perfect) pts += S.perfect;
    speed = c.visits ? Math.round((S.speedMax * c.spare) / c.visits) : 0;
    pts += speed;
    if (layersOk) r.combo++; else r.combo = 0;
    mult = comboMult(r.combo);
    pts = Math.round(pts * mult);
    r.served++;
    if (perfect) r.orders.perfect++;
    if (o.multi && layersOk) r.orders.layered++;
  } else {
    r.combo = 0; r.orders.failed++;
  }
  r.score += pts;
  r.bestCombo = Math.max(r.bestCombo, r.combo);
  c.verdict = { ok: served, perfect, label, pts, mult, speed, err };
  emit(r, { type: 'judge', cup: c });
  if (r.served >= L.quota) beginEnd(r, true, 'quota');
}

export const comboMult = (combo: number) =>
  1 + Math.min(CFG.scoring.comboMax - 1, Math.max(0, combo - 1) * CFG.scoring.comboStep);

export function beginEnd(r: Round, win: boolean, reason: string) {
  if (r.phase !== 'playing') return;
  r.phase = 'ending'; r.endT = 1.2; r.win = win; r.reason = reason;
  r.hold = [false, false, false, false, false];
  emit(r, win ? { type: 'win', reason } : { type: 'lose', reason });
}

export function finish(r: Round) {
  for (let i = 0; i < 5; i++) finalizeSpill(r, i);
  const L = r.L, S = CFG.scoring;
  const timeBonus = r.win ? Math.round(Math.max(0, r.time)) * S.timeBonus : 0;
  const puddlePen = L.persist ? r.puddles.length * S.puddle : 0;
  r.score = Math.max(0, r.score + timeBonus + puddlePen);
  const wastePct = r.waste / L.wasteBudget;
  const s2 = r.win && r.spills.major === 0 && wastePct < 0.5;
  const s3 = s2 && r.orders.perfect >= Math.ceil(r.served * 0.5);
  r.result = {
    level: r.n, mode: r.mode, win: r.win, reason: r.reason, score: r.score, served: r.served, quota: L.quota,
    perfect: r.orders.perfect, orders: { ...r.orders }, spills: { ...r.spills },
    spillCount: r.spills.minor + r.spills.moderate + r.spills.major,
    waste: Math.round(r.waste), wastePct: Math.min(1, wastePct), bestCombo: r.bestCombo,
    timeLeft: Math.max(0, r.time), elapsed: r.elapsed, timeBonus, puddlePen,
    puddlesLeft: L.persist ? r.puddles.length : 0, cleaned: r.cleaned,
    accuracy: r.orders.total ? r.served / r.orders.total : 0,
    stars: r.win ? 1 + (s2 ? 1 : 0) + (s3 ? 1 : 0) : 0,
  };
  r.phase = 'done';
  emit(r, { type: 'done' });
}
