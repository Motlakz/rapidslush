// The arcade controller: owns the live round and the attract-mode round, runs the fixed-step loop, routes input,
// turns engine events into feedback, and talks to the (mock) server at round start and end.
// No Skia imports: the stage component renders whatever this module exposes.
import {
  BELT_Y, CUP_H, FLAVOURS as FL, MAX_LEVEL, SPIN, STATION_X, bot, clean, createRound, levelConfig, send, spinConfig, step, topping,
  type Cup, type Mode, type Round,
} from '@/engine';
import { CUPS, SKINS, glassFor } from '@/game/content';
import { FX, addFloat, resetFx, spawnParts } from '@/game/fx';
import { CTRL, inBox, layoutStage, spinBtn, type StageLayout } from '@/game/layout';
import { Platform } from 'react-native';
import { setRoundGlass } from '@/game/render/glass';
import { viewOf, type Banner, type Coach, type RenderCtx } from '@/game/render/view';
import { show, toast } from '@/game/ui-store';
import { track } from '@/services/analytics';
import { Sound, buzz } from '@/services/feedback';
import { persist, save, uid, type Session } from '@/services/save';
import { Server, spinUnlocked, trackOf } from '@/services/server';

const STEP = 1 / 120;

export const App = {
  mode: 'menu' as 'menu' | 'round',
  round: null as Round | null,
  attract: null as Round | null,
  session: null as Session | null,
  paused: false,
  settled: false,
  coach: null as Coach | null,
  banner: null as Banner | null,
  lastCd: 9,
  lastTick: 99,
  hbT: 0,
  acc: 0,
  clock: 0,
  touch: Platform.OS !== 'web',
};

export const cfgFor = (n: number, m: Mode) => (m === 'spin' ? spinConfig(n, save().tune) : levelConfig(n, save().tune));
const cupTopY = (c: Cup) => (c.p ? c.p.y - CUP_H * c.p.s : BELT_Y - CUP_H);

// ---------- showcase (dev, web) ----------
/**
 * Marketing captures of the real game for the website: `?showcase=belt|spin&level=N[&shack=N][&ui=shop]` plays attract
 * mode at that level with no menus (or one named panel). Development web builds only; a release build never reads it.
 */
export const SHOWCASE: { mode: Mode; level: number; shack: number; ui: string | null } | null = (() => {
  if (!__DEV__ || Platform.OS !== 'web' || typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search), m = q.get('showcase');
  if (m !== 'belt' && m !== 'spin') return null;
  const level = Math.max(1, Number(q.get('level')) || 1);
  return { mode: m, level, shack: Math.max(1, Number(q.get('shack')) || level), ui: q.get('ui') };
})();

// ---------- attract mode ----------
export function newAttract() {
  const S = save(), X = SHOWCASE, spin = X ? X.mode === 'spin' : S.machine === 'spin' && spinUnlocked();
  const lv = X ? Math.min(X.level, spin ? SPIN.MAX_LEVEL : MAX_LEVEL)
    : spin ? Math.min(trackOf('spin').highest, SPIN.MAX_LEVEL) : Math.max(1, Math.min(S.progress.highest, MAX_LEVEL));
  const r = createRound(lv, { countdown: 0.01, seed: Math.floor(Math.random() * 1e9), mode: spin ? 'spin' : 'belt' });
  if (spin) setRoundGlass(r, glassFor(X ? X.shack : S.progress.highest));
  r.time = 9999;
  App.attract = r;
}

// ---------- round lifecycle ----------
export function startLevel(n: number, m: Mode = 'belt') {
  const S = save(), cost = Server.cost();
  const res = Server.startSession(n, m, uid());
  if (!res.ok) {
    track('token_balance_depleted', { level: n, machine: m, short: res.short });
    return showOffer(res.short, n, m);
  }
  Object.assign(App, { session: res.session, mode: 'round', paused: false, settled: false, lastCd: 9, lastTick: 99, hbT: 0, acc: 0 });
  const r = createRound(n, { tune: S.tune, mode: m });
  App.round = r;
  if (m === 'spin') setRoundGlass(r, glassFor(S.progress.highest)); // the shack's current glassware, shared by every machine
  else {
    const gt = glassFor(n).tier;
    if (gt > (S.flags.glass || 0)) { S.flags.glass = gt; track('glass_upgrade_seen', { tier: gt, level: n }); }
  }
  S.machine = m;
  persist();
  App.coach = m === 'belt' && n === 1 && !S.flags.coach ? { stage: 0 } : null;
  App.banner = r.L.isNew ? { s: 'New: ' + r.L.isNew, t: 0 } : null;
  resetFx(); releaseAll();
  if (cost) toast(`−${cost} tokens · ${Server.tokens()} left`);
  show({ name: 'none' });
}

function settleRound() {
  App.settled = true;
  const r = App.round!, res = r.result!, st = App.session ? Server.completeSession(App.session.id, res) : { ok: false };
  track(res.win ? 'round_completed' : 'round_failed', {
    machine: res.mode, level: res.level, score: res.score, served: res.served, quota: res.quota, stars: res.stars,
    wastePct: +res.wastePct.toFixed(2), reason: res.reason,
  });
  if (res.win) track('quota_reached', { level: res.level });
  setTimeout(() => {
    if (App.round === r) { show({ name: 'results', res, rw: ('rewards' in st && st.rewards) || {} }); if (st.ok) Sound.sfx('coin'); }
  }, 350);
}

export function pauseRound() {
  if (!App.round || App.mode !== 'round' || App.round.phase === 'done' || App.paused) return;
  App.paused = true; releaseAll(); show({ name: 'pause' });
}
export function resumeRound() { App.paused = false; show({ name: 'none' }); }
export function quitRound() {
  if (App.session) Server.abandon(App.session.id);
  track('round_abandoned', { level: App.round?.n });
  goHome();
}
export function restartRound() {
  const r = App.round;
  if (!r) return;
  if (App.session) Server.abandon(App.session.id);
  App.mode = 'menu'; App.round = null;
  startLevel(r.n, r.mode);
}
export function goHome() {
  App.mode = 'menu'; App.round = null; App.paused = false; App.session = null;
  releaseAll();
  show({ name: 'home' });
}
/** Continue from the results screen: a level that introduces something new gets its intro card first. */
export function nextLevel(n: number, m: Mode) {
  if (cfgFor(n, m).isNew) show({ name: 'intro', n, m });
  else startLevel(n, m);
}
export function showOffer(short: number, n: number, m: Mode) {
  const S = save();
  track('offer_shown', { trigger: short === 1 ? 'one_short' : S.flags.exhaustedOnce ? 'exhausted' : 'first_exhausted' });
  show({ name: 'offer', short, n, m });
  S.flags.exhaustedOnce = true; S.lastOffer = Date.now();
  persist();
}

// ---------- stage layout (set by the arcade view whenever the window changes) ----------
let LAYOUT: StageLayout = layoutStage(1280, 720);
export const setStageLayout = (L: StageLayout) => { LAYOUT = L; };
export const stageLayout = () => LAYOUT;

/** Keyboard shortcuts are a desktop-web affordance: never on native, and only on web with a mouse or trackpad. */
const finePointer = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia?.('(any-pointer: fine)').matches;
export const keyHintsOn = () => finePointer() && !App.touch;

// ---------- input ----------
type Control = { k: 'tap'; i: number } | { k: 'send' } | { k: 'top' } | { k: 'pause' } | null;
interface Ptr { c: Control; last: { x: number; y: number } }
const ptrs = new Map<string, Ptr>();
const held = [new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>()];

/** `s` is a stage point; controls live in control space, pause in the HUD's right group. */
function controlAt(s: { x: number; y: number }, r: Round): Control {
  const L = LAYOUT;
  if (inBox({ x: s.x - (L.SW - 1280 - L.safe.right), y: s.y - L.hudY }, CTRL.pause)) return { k: 'pause' };
  const p = { x: s.x - L.ox, y: s.y - L.ctrlY };
  if (r.mode === 'spin') {
    for (let i = 0; i < r.L.taps; i++) if (inBox(p, spinBtn(i, r.L.taps))) return { k: 'tap', i };
    if (r.L.topping !== null && inBox(p, CTRL.top2)) return { k: 'top' };
    return null;
  }
  for (let i = 0; i < r.L.taps; i++) if (inBox(p, CTRL.tap(i))) return { k: 'tap', i };
  if (inBox(p, CTRL.send)) return { k: 'send' };
  if (r.L.topping !== null && inBox(p, CTRL.top)) return { k: 'top' };
  return null;
}
function syncHold(r: Round) { for (let i = 0; i < 5; i++) r.hold[i] = held[i].size > 0; }
function setHold(i: number, src: string, on: boolean) {
  const r = App.round;
  if (!r || App.mode !== 'round') return;
  if (on) held[i].add(src); else held[i].delete(src);
  syncHold(r);
  if (on && r.phase === 'playing' && App.coach?.stage === 0) App.coach.stage = 1;
}
export function releaseAll() {
  held.forEach(s => s.clear()); ptrs.clear();
  if (App.round) syncHold(App.round);
}
function doSend() {
  const r = App.round;
  if (r && send(r) && App.coach?.stage === 2) App.coach.stage = 3;
}
function doTop() {
  const r = App.round;
  if (!r) return;
  viewOf(r).topPress = r.clock;
  topping(r);
}

/** Pointer input in stage coordinates. `id` is unique per finger / mouse. */
export function pointerDown(id: string, x: number, y: number, touch: boolean) {
  if (touch) App.touch = true;
  const r = App.round;
  if (App.mode !== 'round' || App.paused || !r) return;
  const c = controlAt({ x, y }, r);
  ptrs.set(id, { c, last: { x, y } });
  if (!c) return;
  if (c.k === 'tap') setHold(c.i, 'p' + id, true);
  else if (c.k === 'send') doSend();
  else if (c.k === 'top') doTop();
  else if (c.k === 'pause') pauseRound();
}
export function pointerMove(id: string, x: number, y: number) {
  const st = ptrs.get(id), r = App.round;
  if (!st || !r || App.mode !== 'round') return;
  // swiping the counter wipes puddles (plan §3.7). A finger that started on a tap keeps pouring instead.
  const wx = x - LAYOUT.ox, wy = y - LAYOUT.oy; // world point
  if ((!st.c || st.c.k !== 'tap') && wy > BELT_Y + 20 && wy < 612) clean(r, wx, wy, Math.hypot(x - st.last.x, y - st.last.y));
  st.last = { x, y };
}
export function pointerUp(id: string) {
  const st = ptrs.get(id);
  if (st?.c?.k === 'tap') setHold(st.c.i, 'p' + id, false);
  ptrs.delete(id);
}

const KEYTAP: Record<string, number> = { a: 0, s: 1, d: 2, '1': 0, '2': 1, '3': 2, j: 0, k: 1, l: 2 };
const KEYSPIN: Record<string, number> = { a: 0, s: 1, d: 2, f: 3, g: 4, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
/** Keyboard (web, hardware keyboards). Returns true when the key was used. */
export function keyDown(key: string, repeat: boolean): boolean {
  const k = key.toLowerCase(), r = App.round;
  if (App.mode !== 'round' || !r) return false;
  App.touch = false; // a real keyboard is in use
  if (k === 'escape' || k === 'p') { if (App.paused) resumeRound(); else pauseRound(); return true; }
  if (App.paused || repeat) return false;
  if (r.mode === 'spin') {
    if (k in KEYSPIN && KEYSPIN[k] < r.L.taps) { setHold(KEYSPIN[k], 'k' + k, true); return true; }
    if (k === ' ' || k === 'enter') { doTop(); return true; }
    return false;
  }
  if (k in KEYTAP && KEYTAP[k] < r.L.taps) { setHold(KEYTAP[k], 'k' + k, true); return true; }
  if (k === ' ' || k === 'enter') { doSend(); return true; }
  if (k === 'f') { doTop(); return true; }
  return false;
}
export function keyUp(key: string) {
  const k = key.toLowerCase(), m = App.round?.mode === 'spin' ? KEYSPIN : KEYTAP;
  if (k in m) setHold(m[k], 'k' + k, false);
}

// ---------- engine events -> feedback ----------
function handleEvents(r: Round, live: boolean) {
  for (const e of r.events) {
    if (e.type === 'judge') {
      const c = e.cup, v = c.verdict!;
      if (v.ok) {
        addFloat(c.x, 300, v.label + '  +' + v.pts, v.perfect ? '#25233A' : '#4A6E17', v.perfect ? '#FFC857' : '#fff', v.perfect ? 24 : 21);
        if (v.speed > 40 && live) addFloat(c.x, 252, 'Speedy +' + v.speed, '#0F6A91', '#DDF4FD', 16);
        if (v.perfect) spawnParts(c.x, cupTopY(c), '#FFC857', 14, 2.2, 260);
        if (live) {
          // one sound per cup: during a streak the combo chime (climbing with the streak) replaces the serve sound
          if (r.combo >= 2) Sound.sfx('combo', String(r.combo - 1));
          else Sound.sfx(v.perfect ? 'perfect' : 'serve');
          if (v.perfect) buzz('light');
        }
      } else {
        addFloat(c.x, 300, v.label, '#fff', v.label === 'Missed' ? '#8A87A6' : '#D93D63', 21);
        if (live) Sound.sfx(v.label === 'Missed' ? 'miss' : 'fail');
      }
      if (live) track(v.ok ? 'order_served' : 'order_missed', { level: r.n, label: v.label, pts: v.pts, type: c.order.type });
      if (App.coach && live && App.coach.stage < 3) { App.coach = null; save().flags.coach = true; persist(); }
    } else if (e.type === 'spill') {
      const word = { minor: 'Drip', moderate: 'Spill', major: 'Big spill' }[e.sev];
      addFloat(e.x, 380, `${word} ${e.pen}${e.timePen ? '  −' + e.timePen + 's' : ''}`, '#fff', e.sev === 'minor' ? '#E09A1E' : '#D93D63', e.sev === 'major' ? 22 : 18);
      spawnParts(e.x, r.mode === 'spin' ? SPIN.CY + SPIN.RY : BELT_Y - 4, FL[e.color].color, e.sev === 'major' ? 22 : 10, 2.6, 220);
      if (live) {
        Sound.sfx('spill', e.sev);
        if (e.sev === 'major') { buzz('heavy'); FX.shake = 0.6; } else if (e.sev === 'moderate') { buzz('medium'); FX.shake = 0.25; }
        track('spill_occurred', { level: r.n, severity: e.sev, kind: e.kind, amount: Math.round(e.amt) });
      }
    } else if (e.type === 'slide') { if (live) Sound.sfx(e.manual ? 'send' : 'slide'); }
    else if (e.type === 'topping') {
      viewOf(r).shakeT = r.clock;
      if (live) Sound.sfx('topping');
      spawnParts(e.cup.x, cupTopY(e.cup), '#fff', 8, 1.2, 80);
    } else if (e.type === 'lap') { addFloat(e.cup.x, 330, 'Again next lap', '#0F6A91', '#DDF4FD', 15); if (live) Sound.sfx('lap'); }
    else if (e.type === 'toppingMiss') { if (live) { Sound.sfx('miss'); addFloat(r.mode === 'spin' ? 640 : STATION_X[r.L.taps - 1], 330, 'No cup to top', '#fff', '#8A87A6', 16); } }
    else if (e.type === 'clean') { if (live) { Sound.sfx('clean'); track('spill_cleaned', { level: r.n }); } addFloat(e.x, e.y - 20, 'Wiped!', '#4A6E17', '#E8F5D2', 16); }
    else if (e.type === 'go') { if (live) { Sound.sfx('go'); track('round_started', { level: r.n }); } }
    else if (e.type === 'win') { if (live) Sound.sfx('win'); }
    else if (e.type === 'lose') { if (live) Sound.sfx('lose'); }
  }
  r.events.length = 0;
}

// ---------- loop ----------
/** Advance the simulation by wall-clock dt (seconds). Returns what to draw this frame. */
export function tick(rawDt: number): { r: Round; dt: number; t: number; ctx: RenderCtx } | null {
  const dt = Math.min(0.05, rawDt);
  App.clock += dt;
  const live = App.mode === 'round' && !!App.round;
  if (!live && !App.attract) newAttract();
  const r = live ? App.round! : App.attract!;
  const frozen = live && App.paused;
  if (!frozen) {
    App.acc += dt;
    while (App.acc >= STEP) {
      if (!live) bot(r, 0.92, Math.random);
      step(r, STEP);
      App.acc -= STEP;
    }
    if (live) {
      if (r.phase === 'countdown') {
        const n = Math.ceil(r.cd - 0.4);
        if (n !== App.lastCd) { App.lastCd = n; if (n > 0) Sound.sfx('count'); }
      }
      if (r.phase === 'playing' && r.time <= 5) {
        const n = Math.ceil(r.time);
        if (n !== App.lastTick) { App.lastTick = n; Sound.sfx('tick'); }
      }
      const C = App.coach;
      if (C?.stage === 0 && r.phase === 'playing' && r.hold[0]) C.stage = 1;
      if (C?.stage === 1 && r.flow[0] === 0) {
        const c = r.cups.find(x => !x.judged && x.slot === 0 && x.total > 3);
        if (c && Math.abs(c.total - c.order.total) <= r.L.tol) C.stage = 2;
      }
      if (App.banner && r.phase === 'playing') App.banner.t += dt;
      if ((App.hbT += dt) > 3 && App.session) { App.hbT = 0; Server.heartbeat(App.session.id, r.elapsed); }
    }
    handleEvents(r, live);
    if (live && r.phase === 'done' && !App.settled) settleRound();
    if (!live && (r.phase === 'done' || r.elapsed > 70)) newAttract();
  }
  Sound.pour(live && !App.paused ? r.flow.reduce((a, b) => a + b, 0) : 0, 50);

  const S = save();
  return {
    r, dt: frozen ? 0 : dt, t: App.clock,
    ctx: {
      live, paused: frozen, reduced: S.settings.reduced,
      skin: SKINS.find(s => s.id === S.inv.skin) ?? SKINS[0],
      cup: CUPS.find(c => c.id === S.inv.cup) ?? CUPS[0],
      highest: SHOWCASE ? SHOWCASE.shack : S.progress.highest, coach: live ? App.coach : null, banner: live ? App.banner : null, keyHints: keyHintsOn(),
    },
  };
}

/** App went to the background mid-round: pause rather than let the timer run (plan §16 device tests). */
export function onBackground() {
  if (App.mode === 'round' && !App.paused && App.round && App.round.phase !== 'done') pauseRound();
  releaseAll();
}

// Dev-only inspection hook for browser testing (stripped from production bundles by the __DEV__ check).
if (__DEV__ && typeof window !== 'undefined') (window as unknown as { __slush: typeof App }).__slush = App;
