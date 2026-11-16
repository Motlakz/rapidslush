// Gameplay HUD (plan §7.5): top = level/quota, timer, score/combo/waste; bottom deck = flavour controls.
import { CUP_RT, FLAVOURS as FL, HATCH_X, STATION_X, TOPPINGS, comboMult, type Round } from '@/engine';
import { clamp, easeBack } from '@/engine/util';
import { CTRL, spinBtn, type Box } from '@/game/layout';
import { glassGeom, roundGlass, uy } from './glass';
import type { Painter } from './painter';
import { CREAM, INK, drawLock, drawToppingIcon, glyph } from './shapes';
import { viewOf, type RenderCtx } from './view';

/**
 * HUD in HUD space (caller translates to the stage's HUD row). On wider stages the level panel stays left, the timer
 * centres and the score panel + pause move right with the stage edge.
 */
export function drawHUD(g: Painter, r: Round, t: number, SW: number, safeL = 0, safeR = 0) {
  const L = r.L, right = SW - 1280 - safeR;
  g.save(); g.translate(safeL, 0);
  // level + quota
  g.rr(40, 48, 300, 74, 22); g.fill('rgba(37,35,58,.2)');
  g.rr(40, 44, 300, 74, 22); g.fill(CREAM);
  const bw = L.badge ? 80 : 58;
  g.rr(54, 56, bw, 26, 13); g.fill(L.badge ? '#45C6F2' : '#FF6B8A');
  g.text((L.badge || 'LV') + ' ' + L.n, 54 + bw / 2, 70, { size: 14, f: 'num', c: '#fff' });
  g.text(L.name, 64 + bw, 70, { size: 17, align: 'left' });
  g.text(`${r.served}/${L.quota}`, 326, 70, { size: 20, f: 'num', align: 'right' });
  const segW = (272 - (L.quota - 1) * 3) / L.quota;
  for (let k = 0; k < L.quota; k++) { g.rr(54 + k * (segW + 3), 94, segW, 12, 6); g.fill(k < r.served ? '#6E9F2B' : '#E7DECF'); }
  g.restore();
  // timer
  const T = Math.max(0, r.time), frac = T / L.dur, low = T <= 10 && r.phase === 'playing', pulse = low ? 1 + Math.sin(t * 10) * 0.04 : 1;
  g.save(); g.translate((safeL + SW - safeR) / 2, 56); g.scale(pulse, pulse);
  g.fillCircle(0, 0, 44, 'rgba(37,35,58,.25)');
  g.fillCircle(0, -2, 44, CREAM);
  g.lineWidth = 8; g.lineCap = 'round';
  g.circle(0, -2, 34); g.stroke('#E7DECF');
  if (frac > 0.001) { g.beginPath(); g.arc(0, -2, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(0.9999, frac)); g.stroke(low ? '#D93D63' : '#45C6F2'); }
  g.lineCap = 'butt';
  g.text(String(Math.ceil(T)), 0, -2, { size: 28, f: 'num', c: low ? '#D93D63' : INK });
  g.restore();
  // score / combo / waste
  g.save(); g.translate(right, 0);
  g.rr(880, 48, 316, 74, 22); g.fill('rgba(37,35,58,.2)');
  g.rr(880, 44, 316, 74, 22); g.fill(CREAM);
  g.text('SCORE', 896, 62, { size: 12, align: 'left', c: '#8A87A6' });
  g.text(r.score.toLocaleString('en-US'), 896, 90, { size: 26, f: 'num', align: 'left' });
  if (r.combo >= 2) {
    g.rr(1000, 54, 70, 24, 12); g.fill('#FFC857');
    g.text('×' + comboMult(r.combo).toFixed(2).replace(/\.?0+$/, ''), 1035, 67, { size: 14, f: 'num' });
  }
  // waste meter: colour + word + glyph (never colour alone, plan §3.5)
  const wp = clamp(r.waste / L.wasteBudget, 0, 1), wc = wp < 0.5 ? '#6E9F2B' : wp < 0.8 ? '#E09A1E' : '#D93D63';
  const wl = wp < 0.5 ? 'OK' : wp < 0.8 ? 'Careful' : L.wasteEnds ? 'Critical!' : 'Messy';
  // stacked so the status word never collides with the label: WASTE / meter / status
  glyph(g, 'drop', 1092, 60, 7, wc);
  g.text('WASTE', 1104, 60, { size: 12, align: 'left', c: '#8A87A6' });
  g.rr(1086, 72, 98, 12, 6); g.fill('#E7DECF');
  if (wp > 0) { g.rr(1086, 72, Math.max(12, 98 * wp), 12, 6); g.fill(wc); }
  if (L.wasteEnds) { g.lineWidth = 2; g.beginPath(); g.moveTo(1183, 68); g.lineTo(1183, 88); g.stroke('#D93D63'); }
  g.text(wl, 1086, 100, { size: 13, align: 'left', c: wc });
  // pause
  const P = CTRL.pause;
  g.fillCircle(P.x + 25, P.y + 28, 25, 'rgba(37,35,58,.25)');
  g.fillCircle(P.x + 25, P.y + 25, 25, CREAM);
  g.rr(P.x + 17, P.y + 15, 6, 20, 3); g.fill(INK); g.rr(P.x + 28, P.y + 15, 6, 20, 3); g.fill(INK);
  g.restore();
}

function pillButton(g: Painter, b: Box, color: string, shade: string, pressed: boolean, alpha = 1) {
  g.save(); g.alpha *= alpha;
  const dy = pressed ? 6 : 0;
  g.rr(b.x, b.y + 8, b.w, b.h, b.h / 2); g.fill(shade);
  g.rr(b.x, b.y + dy, b.w, b.h, b.h / 2); g.fill(color);
  g.rr(b.x + 16, b.y + dy + 7, b.w - 32, 10, 5); g.fill('rgba(255,255,255,.22)');
  g.restore();
  return dy;
}
function keyChip(g: Painter, k: string, x: number, y: number) {
  const size = k.length > 1 ? 11 : 13, w = Math.max(26, g.measure(k, size, 'num') + 14);
  g.rr(x + 13 - w, y - 13, w, 26, 8); g.fill('rgba(255,255,255,.88)'); // right-aligned to the button edge
  g.text(k, x + 13 - w / 2, y + 1, { size, f: 'num', c: INK });
}

/**
 * A button label centred between the icon's right edge and the key chip (or the button's end), shrunk until it fits:
 * long names like "Sprinkles" or "Blue Razz" must never run into the chip.
 */
function fitLabel(g: Painter, s: string, left: number, right: number, y: number, size: number, c: string) {
  const room = right - left;
  while (size > 12 && g.measure(s, size) > room) size--;
  g.text(s, (left + right) / 2, y, { size, c });
}

function drawToppingButton(g: Painter, r: Round, B: Box, live: boolean, keyHint: string | null) {
  const V = viewOf(r), pressed = r.clock - V.topPress < 0.12 && r.clock >= V.topPress;
  const dy = pillButton(g, B, '#A78BFA', '#7356D8', pressed, live ? 1 : 0.6);
  g.fillCircle(B.x + 40, B.y + 41 + dy, 20, INK);
  drawToppingIcon(g, r.L.topping ?? 0, B.x + 40, B.y + 42 + dy, 0.95);
  fitLabel(g, TOPPINGS[r.L.topping ?? 0].name, B.x + 66, B.x + B.w - (keyHint ? 46 : 18), B.y + 42 + dy, 20, '#fff');
  if (keyHint) keyChip(g, keyHint, B.x + B.w - 26, B.y + 41 + dy);
}

export function drawControls(g: Painter, r: Round, ctx: RenderCtx) {
  const L = r.L, live = r.phase === 'playing', kb = ctx.keyHints;
  if (r.mode === 'spin') {
    for (let i = 0; i < L.taps; i++) {
      const b = spinBtn(i, L.taps), F = FL[L.flavours[i]], dark = F.id === 'lime' || F.id === 'mango';
      const dy = pillButton(g, b, F.color, F.deep, r.hold[i] && live, live ? 1 : 0.7);
      g.fillCircle(b.x + 38, b.y + 41 + dy, 19, 'rgba(255,255,255,.92)');
      glyph(g, F.glyph, b.x + 38, b.y + 41 + dy, 10.5, F.deep);
      fitLabel(g, F.name, b.x + 62, b.x + b.w - (kb ? 44 : 16), b.y + 42 + dy, 20, dark ? INK : '#fff');
      if (kb) keyChip(g, 'ASDFG'[i], b.x + b.w - 24, b.y + 41 + dy);
    }
    if (L.topping !== null) drawToppingButton(g, r, CTRL.top2, live, kb ? 'Space' : null);
    return;
  }
  for (let i = 0; i < 3; i++) {
    const b = CTRL.tap(i);
    if (i >= L.taps) {
      g.rr(b.x, b.y + 8, b.w, b.h, b.h / 2); g.fill('rgba(255,255,255,.06)');
      g.setLineDash([8, 7]); g.lineWidth = 2; g.stroke('rgba(255,255,255,.18)'); g.setLineDash([]);
      drawLock(g, b.x + 56, b.y + 50, 0.6, 'rgba(255,255,255,.4)');
      g.text('Locked', b.x + 120, b.y + 50, { size: 18, c: 'rgba(255,255,255,.4)' });
      continue;
    }
    const F = FL[L.flavours[i]], dark = F.id === 'lime' || F.id === 'mango';
    const dy = pillButton(g, b, F.color, F.deep, r.hold[i] && live, live ? 1 : 0.7);
    g.fillCircle(b.x + 40, b.y + 41 + dy, 20, 'rgba(255,255,255,.92)');
    glyph(g, F.glyph, b.x + 40, b.y + 41 + dy, 11, F.deep);
    fitLabel(g, F.name, b.x + 66, b.x + b.w - (kb ? 46 : 18), b.y + 42 + dy, 21, dark ? INK : '#fff');
    if (kb) keyChip(g, 'ASD'[i], b.x + b.w - 26, b.y + 41 + dy);
  }
  // send
  const S = CTRL.send, canSend = live && r.belt.phase === 'dwell';
  const dy = pillButton(g, S, CREAM, '#CFC4B0', false, canSend ? 1 : 0.55);
  if (canSend) { // the remaining dwell drains out of the button: send early for a speed bonus
    const p = clamp(r.belt.dwellLeft / L.dwell, 0, 1);
    g.save(); g.rr(S.x, S.y + dy, S.w, S.h, S.h / 2); g.clip(); g.fillRect(S.x, S.y, S.w * p, S.h, 'rgba(69,198,242,.28)'); g.restore();
  }
  g.text('SEND', S.x + (kb ? 68 : 84), S.y + 42 + dy, { size: 22 });
  const ax = kb ? 106 : 124;
  g.beginPath(); g.moveTo(S.x + ax, S.y + 31 + dy); g.lineTo(S.x + ax + 15, S.y + 41 + dy); g.lineTo(S.x + ax, S.y + 51 + dy); g.closePath(); g.fill(INK);
  if (kb) { g.rr(S.x + S.w - 58, S.y + 29 + dy, 44, 24, 8); g.fill('rgba(37,35,58,.1)'); g.text('Space', S.x + S.w - 36, S.y + 42 + dy, { size: 11, f: 'num', c: INK }); }
  if (L.topping !== null) drawToppingButton(g, r, CTRL.top, live, kb ? 'F' : null);
}

// ---------- coach (first-time teaching, plan §2: no long tutorial) ----------
function coachArrow(g: Painter, x: number, y: number, label: string, t: number, dir: 'down' | 'left') {
  const b = Math.sin(t * 6) * 6;
  g.save(); g.translate(x + (dir === 'left' ? b : 0), y + (dir === 'down' ? b : 0));
  g.beginPath();
  if (dir === 'down') { g.moveTo(-14, -20); g.lineTo(14, -20); g.lineTo(0, 0); } else { g.moveTo(20, -14); g.lineTo(20, 14); g.lineTo(0, 0); }
  g.closePath(); g.fill('#FFC857'); g.lineWidth = 3; g.stroke(INK);
  const w = g.measure(label, 17) + 28, lx = dir === 'down' ? -w / 2 : 26, ly = dir === 'down' ? -60 : -18;
  g.rr(lx, ly, w, 36, 18); g.fill(INK);
  g.text(label, lx + w / 2, ly + 19, { size: 17, c: '#fff' });
  g.restore();
}

/** Coach arrows: 'controls' ones point at buttons (control space), the 'world' one at the cup (world space). */
export function drawCoach(g: Painter, r: Round, t: number, ctx: RenderCtx, space: 'controls' | 'world') {
  const C = ctx.coach;
  if (!C || r.phase !== 'playing') return;
  if (space === 'controls') {
    if (C.stage === 0) coachArrow(g, STATION_X[0], 612, ctx.keyHints ? 'Hold A to pour' : 'Hold to pour', t, 'down');
    else if (C.stage === 2) coachArrow(g, HATCH_X, 612, 'Send it (or wait)', t, 'down');
    return;
  }
  const c0 = r.cups.find(c => !c.judged && c.slot === 0 && Math.abs(c.x - STATION_X[0]) < 40);
  if (C.stage === 1 && c0) {
    const y = uy(glassGeom(roundGlass(r).id), c0.order.total);
    coachArrow(g, c0.x + CUP_RT + 30, y, 'Let go before the band. It keeps dripping!', t, 'left');
  }
}

export function drawBanner(g: Painter, s: string, alpha: number, cx: number) {
  g.save(); g.alpha = alpha;
  const w = g.measure(s, 19) + 44;
  g.rr(cx - w / 2, 112, w, 42, 21); g.fill(INK);
  g.text(s, cx, 134, { size: 19, c: '#fff' });
  g.restore();
}

export function drawCountdown(g: Painter, r: Round) {
  const n = Math.ceil(r.cd - 0.4), s = n > 0 ? String(n) : 'Pour!';
  const p = easeBack(clamp((1 - ((((r.cd - 0.4) % 1) + 1) % 1)) * 3, 0, 1));
  g.save(); g.translate(640, 380); g.scale(Math.max(0.001, p), Math.max(0.001, p));
  g.fillCircle(0, 6, 96, 'rgba(37,35,58,.3)');
  g.fillCircle(0, 0, 96, n > 0 ? '#45C6F2' : '#FF6B8A');
  g.text(s, 0, 4, { size: n > 0 ? 92 : 46, f: n > 0 ? 'num' : 'head', c: '#fff' });
  g.restore();
}
