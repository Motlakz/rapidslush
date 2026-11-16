// Slush Line machine, belt, puddles, exit curtain; Spin Bar machine and turntable.
import { BELT_Y, FLAVOURS as FL, SPIN, STATION_X, W, cupUnder, puddleR, type Round } from '@/engine';
import { clamp } from '@/engine/util';
import { roundGlass } from './glass';
import type { Painter } from './painter';
import { CREAM, INK, drawLock, drawToppingIcon, glyph } from './shapes';
import { fillSlush } from './textures';
import { viewOf, type RenderCtx } from './view';

export function drawMachine(g: Painter, r: Round, t: number, ctx: RenderCtx) {
  const sk = ctx.skin, L = r.L, tier = roundGlass(r).tier, V = viewOf(r);
  g.rr(282, 100, 716, 208, 34); g.fill('rgba(37,35,58,.18)');
  g.rr(286, 86, 708, 214, 34); g.fill(g.linear(0, 88, 0, 300, [[0, sk.body], [1, sk.deep]]));
  g.rr(296, 94, 688, 10, 5); g.fill('rgba(255,255,255,.28)');
  for (let i = 0; i < 3; i++) {
    const x = STATION_X[i], on = i < L.taps;
    g.rr(x - 78, 104, 156, 136, 28); g.fill('rgba(20,18,40,.25)');
    if (on) {
      const F = FL[L.flavours[i]], lvl = 0.8 - ((r.used[i] % 400) / 400) * 0.25;
      g.rr(x - 72, 110, 144, 124, 24); g.fill('rgba(255,255,255,.55)');
      g.save(); g.rr(x - 72, 110, 144, 124, 24); g.clip();
      const top = 234 - 124 * lvl;
      g.beginPath(); g.moveTo(x - 80, 240);
      for (let k = 0; k <= 8; k++) g.lineTo(x - 72 + k * 18, top + Math.sin(t * 2.4 + k + i) * 2.5 - (tier >= 2 ? (Math.sin(k * 2.1 + i) * 0.5 + 0.5) * 4 : 0));
      g.lineTo(x + 80, 240); g.closePath();
      g.fill(tier === 0 ? F.color : g.linear(0, top, 0, 234, [[0, F.color], [1, F.deep]]));
      if (tier >= 2) {
        g.save(); g.clip(); fillSlush(g, L.flavours[i], x - 76, top - 10, 152, 250 - top, x); g.restore();
        g.fillRect(x - 72, 110, 144, 124, g.linear(x - 72, 0, x + 72, 0, [[0, 'rgba(255,255,255,.5)'], [0.2, 'rgba(255,255,255,0)'], [0.8, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.5)']]));
      } else if (tier === 1) {
        for (let k = 0; k < 18; k++) {
          const px = x - 62 + ((k * 37 + i * 13) % 124), py = top + 8 + ((k * 23) % 100);
          if (py < 232) g.fillCircle(px, py, 1.6 + (k % 3), 'rgba(255,255,255,.35)');
        }
      }
      const a = t * (2 + r.flow[i] / 25);
      g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x - Math.cos(a) * 46, 196 + Math.sin(a) * 6); g.lineTo(x + Math.cos(a) * 46, 196 - Math.sin(a) * 6); g.stroke('rgba(255,255,255,.5)');
      g.restore();
      g.rr(x - 64, 116, 12, 108, 6); g.fill('rgba(255,255,255,.55)');
      g.rr(x - 52, 118, 104, 28, 14); g.fill(CREAM);
      glyph(g, F.glyph, x - 36, 132, 9, F.deep);
      g.text(F.name, x - 22, 133, { size: F.name.length > 6 ? 14 : 15, c: INK, align: 'left' });
    } else {
      g.rr(x - 72, 110, 144, 124, 24); g.fill(sk.deep);
      g.lineWidth = 2; g.setLineDash([8, 8]); g.stroke('rgba(255,255,255,.15)'); g.setLineDash([]);
      drawLock(g, x, 158, 1.1, 'rgba(255,255,255,.75)');
      g.text('Opens at Lv ' + (i === 1 ? 4 : 6), x, 202, { size: 14, c: 'rgba(255,255,255,.8)' });
    }
    // nozzle head + lever
    g.rr(x - 32, 236, 64, 42, 14); g.fill(sk.metal);
    g.rr(x - 32, 236, 64, 10, 5); g.fill('rgba(255,255,255,.5)');
    g.rr(x - 13, 272, 26, 26, 9); g.fill('#4A4766');
    if (on) {
      const cup = cupUnder(r, x), lit = r.phase === 'playing' && cup && r.belt.phase === 'dwell';
      g.fillCircle(x, 257, 6, lit ? '#7DFF8A' : r.flow[i] > 0 ? '#FFC857' : '#8A87A6');
      const ang = r.hold[i] && r.phase === 'playing' ? 0.75 : -0.35;
      if (!ctx.paused) V.lev[i] += (ang - V.lev[i]) * 0.3;
      g.save(); g.translate(x + 40, 254); g.rotate(V.lev[i]);
      g.rr(-5, -58, 10, 58, 5); g.fill(sk.metal);
      g.fillCircle(0, -60, 11, FL[L.flavours[i]].color); g.fillCircle(-3, -63, 4, 'rgba(255,255,255,.6)');
      g.restore();
    }
  }
  if (L.topping !== null) {
    const x = STATION_X[L.taps - 1] + 92;
    g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 16, 270); g.lineTo(x, 270); g.lineTo(x, 300); g.stroke(sk.metal);
    drawShaker(g, r, x, 316);
  }
}

function drawShaker(g: Painter, r: Round, x: number, y: number) {
  const V = viewOf(r), dt = r.clock - V.shakeT, shake = dt >= 0 && dt < 0.3 ? Math.sin(dt * 60) * 4 : 0;
  g.save(); g.translate(x + shake, y);
  g.rr(-16, -14, 32, 40, 10); g.fill(CREAM); g.lineWidth = 2; g.stroke(INK);
  g.rr(-12, -22, 24, 10, 4); g.fill('#8A87A6');
  drawToppingIcon(g, r.L.topping ?? 0, 0, 8, 0.8);
  g.restore();
}

/** The belt runs the stage's full width (x0..x1 in world units) on wide screens. */
export function drawBelt(g: Painter, r: Round, x0 = 0, x1 = W) {
  const BW = x1 - x0;
  g.fillRect(x0, BELT_Y + 18, BW, 8, 'rgba(37,35,58,.25)');
  g.fillRect(x0, BELT_Y, BW, 20, '#3B3757');
  g.save(); g.beginPath(); g.rect(x0, BELT_Y + 3, BW, 14); g.clip();
  const off = r.beltPos % 40;
  for (let x = Math.floor(x0 / 40) * 40 - 40 + off; x < x1 + 40; x += 40) g.fillRect(x, BELT_Y + 3, 14, 14, '#4C476B');
  g.restore();
  g.fillRect(x0, BELT_Y - 2, BW, 4, '#CFCBE0'); g.fillRect(x0, BELT_Y + 18, BW, 3, '#8A87A6');
  const co = (r.beltPos * 1.5) % 80;
  for (let x = Math.floor(x0 / 80) * 80 - 80 + co; x < x1 + 80; x += 80) {
    g.beginPath(); g.moveTo(x, BELT_Y + 4); g.lineTo(x + 8, BELT_Y + 10); g.lineTo(x, BELT_Y + 16); g.lineTo(x + 4, BELT_Y + 10); g.closePath();
    g.fill('rgba(255,255,255,.28)');
  }
}

export function drawPuddles(g: Painter, r: Round) {
  const tier = roundGlass(r).tier;
  for (const p of r.puddles) {
    const F = FL[p.color], rad = puddleR(p);
    g.save(); g.alpha = clamp(p.a, 0, 1) * 0.92; g.translate(p.x, p.y);
    g.beginPath();
    for (let k = 0; k <= 14; k++) {
      const a = (k / 14) * Math.PI * 2, wob = 1 + 0.16 * Math.sin(a * 3 + p.seed) + 0.08 * Math.sin(a * 5 + p.seed * 2);
      const px = Math.cos(a) * rad * wob, py = Math.sin(a) * rad * 0.42 * wob;
      if (k) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fill(F.color);
    if (tier >= 2) { g.save(); g.clip(); g.alpha *= 0.7; fillSlush(g, p.color, -rad * 1.3, -rad, rad * 2.6, rad * 2, 0); g.restore(); }
    g.beginPath(); g.ellipse(-rad * 0.25, -rad * 0.1, rad * 0.35, rad * 0.1, 0, 0, 7); g.fill('rgba(255,255,255,.45)');
    g.restore();
  }
}

/** Conveyor direction: cups exit through a strip curtain on the far right. */
export function drawExitCurtain(g: Painter, t: number) {
  g.fillRect(W - 50, 372, 50, 10, '#4A4766');
  g.lineWidth = 1;
  for (let k = 0; k < 5; k++) {
    const x = W - 46 + k * 9, sway = Math.sin(t * 2 + k) * 1.5;
    g.beginPath(); g.moveTo(x, 382); g.lineTo(x + 7, 382); g.lineTo(x + 7 + sway, BELT_Y); g.lineTo(x + sway, BELT_Y); g.closePath();
    g.fill('rgba(205,232,255,.62)'); g.stroke('rgba(255,255,255,.8)');
  }
  g.rr(W - 96, 316, 82, 28, 14); g.fill(INK);
  g.text('OUT', W - 66, 331, { size: 14, c: '#fff' });
  g.beginPath(); g.moveTo(W - 42, 323); g.lineTo(W - 32, 330); g.lineTo(W - 42, 337); g.closePath(); g.fill('#FFC857');
}

// ---------- Spin Bar ----------
export function drawSpinMachine(g: Painter, r: Round, t: number, ctx: RenderCtx) {
  const sk = ctx.skin, L = r.L, tier = roundGlass(r).tier, k = L.taps;
  g.rr(386, 100, 516, 196, 34); g.fill('rgba(37,35,58,.18)');
  g.rr(390, 86, 500, 200, 34); g.fill(g.linear(0, 88, 0, 290, [[0, sk.body], [1, sk.deep]]));
  g.rr(400, 94, 480, 10, 5); g.fill('rgba(255,255,255,.28)');
  const tw = Math.min(84, (440 - (k - 1) * 10) / k);
  for (let i = 0; i < k; i++) {
    const x = 640 + (i - (k - 1) / 2) * (tw + 10), F = FL[L.flavours[i]], lvl = 0.78 - ((r.used[i] % 300) / 300) * 0.2, top = 214 - 100 * lvl;
    g.rr(x - tw / 2, 110, tw, 104, 18); g.fill('rgba(255,255,255,.55)');
    g.save(); g.rr(x - tw / 2, 110, tw, 104, 18); g.clip();
    g.beginPath(); g.moveTo(x - tw, 220);
    for (let q = 0; q <= 6; q++) g.lineTo(x - tw / 2 + (q * tw) / 6, top + Math.sin(t * 2.4 + q + i) * 2);
    g.lineTo(x + tw, 220); g.closePath();
    g.fill(tier === 0 ? F.color : g.linear(0, top, 0, 214, [[0, F.color], [1, F.deep]]));
    if (tier >= 2) { g.clip(); fillSlush(g, L.flavours[i], x - tw / 2, top - 6, tw, 220 - top, x); }
    g.restore();
    g.fillCircle(x, 128, 12, CREAM); glyph(g, F.glyph, x, 128, 7.5, F.deep);
    // feed pipe to the single nozzle
    g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, 214); g.quadraticCurveTo(x, 246, 640, 252); g.stroke(r.flow[i] > 0 ? F.color : sk.metal);
  }
  g.rr(606, 236, 68, 44, 14); g.fill(sk.metal);
  g.rr(606, 236, 68, 10, 5); g.fill('rgba(255,255,255,.5)');
  g.rr(628, 276, 24, SPIN.NOZ_Y - 276, 8); g.fill(sk.metal);
  g.rr(624, SPIN.NOZ_Y - 14, 32, 16, 6); g.fill('#4A4766');
  const lit = r.phase === 'playing' && r.winCup;
  g.fillCircle(640, 258, 6, lit ? '#7DFF8A' : r.flow.some(f => f > 0) ? '#FFC857' : '#8A87A6');
  if (L.topping !== null) {
    g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(674, 262); g.lineTo(712, 262); g.lineTo(712, 300); g.stroke(sk.metal);
    drawShaker(g, r, 712, 318);
  }
}

export function drawTray(g: Painter, r: Round, t: number, ctx: RenderCtx) {
  const sk = ctx.skin, cx = SPIN.CX, cy = SPIN.CY, rx = SPIN.RX + 72, ry = SPIN.RY + 30;
  g.beginPath(); g.ellipse(cx, cy + 34, rx + 10, ry + 12, 0, 0, 7); g.fill('rgba(37,35,58,.22)');
  g.beginPath(); g.ellipse(cx, cy + 16, rx, ry, 0, 0, 7); g.fill(sk.deep);
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill(g.linear(0, cy - ry, 0, cy + ry, [[0, '#F4EEE4'], [1, '#D9D0C2']]));
  g.lineWidth = 2; g.lineCap = 'butt';
  for (let k = 0; k < r.L.slots; k++) { // spokes turn with the table
    const a = ((r.angle + (k * 360) / r.L.slots + 180 / r.L.slots) * Math.PI) / 180;
    g.beginPath(); g.moveTo(cx + Math.sin(a) * 60, cy + Math.cos(a) * 18); g.lineTo(cx + Math.sin(a) * (rx - 8), cy + Math.cos(a) * (ry - 3));
    g.stroke('rgba(37,35,58,.12)');
  }
  g.beginPath(); g.ellipse(cx, cy, rx - 8, ry - 3, 0, 0, 7); g.stroke('rgba(37,35,58,.12)');
  g.beginPath(); g.ellipse(cx, cy, 58, 17, 0, 0, 7); g.fill(sk.body);
  // the window: a lit wedge at the front, with chevrons showing spin direction
  const dir = r.L.dir, fy = cy + ry - 6;
  g.save(); g.alpha = 0.5 + 0.25 * Math.sin(t * 4);
  g.beginPath(); g.ellipse(cx, fy - 2, 46, 9, 0, 0, 7); g.fill('#FFC857'); g.restore();
  for (const side of [-1, 1]) for (let q = 0; q < 2; q++) {
    const x = cx + side * (120 + q * 34) + ((t * 30 * dir) % 34);
    g.beginPath(); g.moveTo(x - 6 * dir, fy - 8); g.lineTo(x + 6 * dir, fy); g.lineTo(x - 6 * dir, fy + 8); g.lineTo(x - 2 * dir, fy); g.closePath();
    g.fill('rgba(37,35,58,.35)');
  }
}
