// Blend Station: the blender (flavour tubs, the jar whose fruit breaks down as it smooths, the blade, the smoothness
// gauge), its pour stream, and the scene that puts the queue of cups under it.
import { BELT_Y, BLEND, FLAVOURS as FL, NOZZLE_Y, POUR, W, stationCup, type Round } from '@/engine';
import { clamp } from '@/engine/util';
import { drawCup, drawTicket } from './cup';
import { FX, spawnParts } from '@/game/fx';
import { roundGlass, surfaceY } from './glass';
import { flavourIcon } from './icons';
import { drawBelt, drawExitCurtain, drawPuddles, drawShaker } from './machine';
import type { Painter } from './painter';
import { mixFlavours } from './mix';
import { INK, drawSnowflake } from './shapes';
import { viewOf, type RenderCtx } from './view';

const JAR = { x: 640, top: 98, bot: 226, wt: 66, wb: 50 };
const jarHW = (y: number) => JAR.wb + ((JAR.wt - JAR.wb) * (JAR.bot - y)) / (JAR.bot - JAR.top);
function jarPath(g: Painter, inset = 0) {
  g.beginPath();
  g.moveTo(JAR.x - JAR.wt + inset, JAR.top); g.lineTo(JAR.x + JAR.wt - inset, JAR.top);
  g.lineTo(JAR.x + JAR.wb - inset, JAR.bot - 8);
  g.quadraticCurveTo(JAR.x + JAR.wb - inset, JAR.bot, JAR.x + JAR.wb - 8 - inset, JAR.bot);
  g.lineTo(JAR.x - JAR.wb + 8 + inset, JAR.bot);
  g.quadraticCurveTo(JAR.x - JAR.wb + inset, JAR.bot, JAR.x - JAR.wb + inset, JAR.bot - 8);
  g.closePath();
}

export function drawBlendMachine(g: Painter, r: Round, t: number, ctx: RenderCtx) {
  const sk = ctx.skin, L = r.L, J = r.jar, k = L.taps, V = viewOf(r);
  // body panel, built like the other machines
  g.rr(456, 100, 368, 210, 34); g.fill('rgba(37,35,58,.18)');
  g.rr(460, 86, 360, 214, 34); g.fill(g.linear(0, 88, 0, 300, [[0, sk.body], [1, sk.deep]]));
  g.rr(470, 94, 340, 10, 5); g.fill('rgba(255,255,255,.28)');

  // flavour tubs on the left; the ones already in the jar get a green ring
  for (let i = 0; i < k; i++) {
    const F = FL[L.flavours[i]], x = 504 + (i % 2) * 40, y = 132 + Math.floor(i / 2) * 62;
    g.rr(x - 17, y - 14, 34, 44, 9); g.fill('rgba(255,255,255,.55)');
    g.save(); g.rr(x - 17, y - 14, 34, 44, 9); g.clip(); g.fillRect(x - 17, y + 2, 34, 30, F.color); g.restore();
    flavourIcon(g, F, x, y + 16, 15);
    if (J.has[i]) { g.lineWidth = 3; g.rr(x - 19, y - 16, 38, 48, 10); g.stroke('#7DFF8A'); }
  }

  // the jar: the blend, whole fruit that breaks into crumbs as it smooths, a milky wash past the band, the blade
  const fis = J.has.flatMap((h, i) => (h ? [L.flavours[i]] : [])), M = mixFlavours(fis);
  const smooth = clamp(J.meter / BLEND.CENTER, 0, 1);
  const watery = clamp((J.meter - BLEND.CENTER) / (BLEND.METER_MAX - BLEND.CENTER), 0, 1);
  if (!ctx.paused) V.blendA += J.speed * 0.25;
  g.save(); jarPath(g, 3); g.clip();
  g.fillRect(JAR.x - JAR.wt, JAR.top, JAR.wt * 2, JAR.bot - JAR.top, 'rgba(255,255,255,.45)');
  if (J.left > 0 && fis.length) {
    const lvl = JAR.bot - 6 - (J.left / BLEND.JAR) * (JAR.bot - JAR.top - 22);
    const surf = lvl + (J.speed > 0.005 && !ctx.reduced ? Math.sin(t * 18) * 2 : 0);
    g.fillRect(JAR.x - JAR.wt, surf, JAR.wt * 2, JAR.bot - surf, g.linear(0, surf, 0, JAR.bot, [[0, M.light], [0.25, M.color], [1, M.deep]]));
    if (watery > 0) g.fillRect(JAR.x - JAR.wt, surf, JAR.wt * 2, JAR.bot - surf, `rgba(255,255,255,${(0.45 * watery).toFixed(3)})`);
    const chunks = Math.round(14 * (1 - smooth)), room = Math.max(10, JAR.bot - lvl - 18);
    for (let q = 0; q < chunks; q++) {
      const fi = fis[q % fis.length], a = q * 2.4 + V.blendA * (1 + (q % 3) * 0.4), rr = (q * 37) % 40;
      const cy = lvl + 10 + ((q * 53) % room), cx = JAR.x + Math.cos(a) * Math.min(rr, jarHW(cy) - 12);
      g.fillCircle(cx, cy, 4 + 5 * (1 - smooth), FL[fi].deep);
      g.fillCircle(cx - 1.5, cy - 1.5, 1.6 + 2 * (1 - smooth), 'rgba(255,255,255,.35)');
    }
  }
  g.save(); g.translate(JAR.x, JAR.bot - 14); g.scale(1, 0.35);
  for (let q = 0; q < 2; q++) { g.save(); g.rotate(V.blendA * 3 + (q * Math.PI) / 2); g.rr(-24, -3, 48, 6, 3); g.fill(sk.metal); g.restore(); }
  g.restore();
  g.fillCircle(JAR.x, JAR.bot - 14, 5, '#4A4766');
  g.restore();
  jarPath(g); g.lineWidth = 3.5; g.stroke('rgba(255,255,255,.95)'); g.lineWidth = 1; g.stroke('rgba(37,35,58,.3)');
  g.rr(JAR.x - JAR.wt - 4, JAR.top - 10, JAR.wt * 2 + 8, 14, 7); g.fill(sk.metal); // lid
  g.rr(JAR.x - 54, JAR.top + 10, 10, 96, 5); g.fill('rgba(255,255,255,.4)'); // glass shine
  g.lineWidth = 8; g.lineCap = 'round'; // handle
  g.beginPath(); g.moveTo(JAR.x + JAR.wt - 4, JAR.top + 20);
  g.quadraticCurveTo(JAR.x + JAR.wt + 28, JAR.top + 30, JAR.x + JAR.wb + 6, JAR.bot - 26); g.stroke('rgba(255,255,255,.85)');
  g.lineCap = 'butt';
  const c = stationCup(r);
  if (c?.order.frozen) drawSnowflake(g, JAR.x - 36, JAR.top + 22, 10, '#fff'); // frozen fruit in this order

  // motor base, spout and status light (green: ready to blend or pour; mango: blade turning)
  g.rr(JAR.x - 66, JAR.bot - 2, 132, 50, 14); g.fill(sk.metal);
  g.rr(JAR.x - 66, JAR.bot - 2, 132, 10, 5); g.fill('rgba(255,255,255,.5)');
  g.rr(JAR.x - 13, 272, 26, NOZZLE_Y - 272, 9); g.fill('#4A4766');
  g.fillCircle(JAR.x + 40, JAR.bot + 22, 6, J.speed > 0.01 ? '#FFC857' : J.left > 0 && fis.length ? '#7DFF8A' : '#8A87A6');

  // smoothness gauge: chunky at the bottom, the smooth band, watery at the top
  const gx = 752, gTop = 108, gBot = 262, Y = (m: number) => gBot - (m / BLEND.METER_MAX) * (gBot - gTop);
  g.rr(gx - 16, gTop - 8, 32, gBot - gTop + 16, 14); g.fill('rgba(20,18,40,.35)');
  g.rr(gx - 10, gTop, 20, gBot - gTop, 8); g.fill('rgba(255,255,255,.85)');
  const zTop = Y(BLEND.CENTER + L.zone), zBot = Y(BLEND.CENTER - L.zone);
  g.rr(gx - 10, zTop, 20, zBot - zTop, 4); g.fill('#A7D95B');
  g.fillRect(gx - 10, Y(BLEND.CENTER) - 1, 20, 2, '#4A6E17');
  const ny = Y(clamp(J.meter, 0, BLEND.METER_MAX));
  g.beginPath(); g.moveTo(gx - 24, ny - 8); g.lineTo(gx - 12, ny); g.lineTo(gx - 24, ny + 8); g.closePath(); g.fill(INK);
  g.rr(gx - 12, ny - 2, 24, 4, 2); g.fill(INK);
  g.text('Watery', gx + 2, gTop - 18, { size: 12, c: '#fff' });
  g.text('Chunky', gx + 2, gBot + 20, { size: 12, c: '#fff' });

  if (L.topping !== null) {
    g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(JAR.x - 66, 262); g.lineTo(JAR.x - 92, 262); g.lineTo(JAR.x - 92, 300); g.stroke(sk.metal);
    g.lineCap = 'butt';
    drawShaker(g, r, JAR.x - 92, 316);
  }
}

/** The jar's pour: one stream from the spout, in the blend's colour. */
export function drawBlendStream(g: Painter, r: Round, t: number, dt: number) {
  const f = r.flow[POUR];
  if (f <= 0.3) return;
  const fis = r.jar.has.flatMap((h, i) => (h ? [r.L.flavours[i]] : []));
  if (!fis.length) return;
  const M = mixFlavours(fis), c = stationCup(r), x = BLEND.CX, tier = roundGlass(r).tier;
  const y1 = c ? surfaceY(r, c) : BELT_Y - 1, w = (tier >= 2 ? 5 : 3.5) + (f / 85) * 9, wob = FX.reduced ? 0 : Math.sin(t * 40) * 1.1;
  g.beginPath(); g.moveTo(x - w / 2 - 1, NOZZLE_Y);
  g.quadraticCurveTo(x - w / 2 + wob, (NOZZLE_Y + y1) / 2, x - (w / 2) * 0.85, y1);
  g.lineTo(x + (w / 2) * 0.85, y1); g.quadraticCurveTo(x + w / 2 + wob, (NOZZLE_Y + y1) / 2, x + w / 2 + 1, NOZZLE_Y); g.closePath();
  g.fill(M.color);
  if (tier >= 1) g.fillRect(x - w / 2 + 1.5, NOZZLE_Y, Math.max(1.5, w * 0.22), y1 - NOZZLE_Y, 'rgba(255,255,255,.4)');
  if (Math.random() < dt * (c ? 14 : 40) * (f / 50)) spawnParts(x, y1, c ? M.light : M.color, c ? 1 : 3, c ? 1.6 : 2.4, c ? 70 : 160);
}

export function drawBlendScene(g: Painter, r: Round, t: number, dt: number, ctx: RenderCtx, x0: number, x1: number) {
  drawBlendMachine(g, r, t, ctx);
  drawPuddles(g, r);
  drawBelt(g, r, x0, x1);
  g.save(); g.rect(0, -200, W, 720 + 400); g.clip(); // served cups leave through the exit curtain
  const cups = r.cups.filter(c => c.x > -80 && c.x < W + 80).sort((a, b) => a.x - b.x);
  for (const c of cups) drawTicket(g, c, r);
  for (const c of cups) drawCup(g, c, r, t, ctx);
  drawBlendStream(g, r, t, dt);
  g.restore();
  drawExitCurtain(g, t);
}
