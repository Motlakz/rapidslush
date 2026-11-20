import { BELT_Y, CUP_H, CUP_RT, FLAVOURS as FL, mulberry32, type Cup, type Round } from '@/engine';
import { clamp, easeBack, lerp } from '@/engine/util';
import { glassGeom, glassPath, roundGlass, uy, type GlassGeom } from './glass';
import type { Painter } from './painter';
import { flavourBadge } from './icons';
import { INK, drawToppingIcon, drawWhip } from './shapes';
import { fillSlush, sparkle } from './textures';
import type { RenderCtx } from './view';

// per-cup random decoration (ice specks inside, condensation beads outside), stable for the cup's life
const specks = new WeakMap<Cup, number[][]>();
const drops = new WeakMap<Cup, number[][]>();
function cupSpecks(c: Cup) {
  let v = specks.get(c);
  if (!v) { const rnd = mulberry32(c.seed); v = Array.from({ length: 16 }, () => [rnd(), rnd() * 2 - 1, 1 + rnd() * 2.2]); specks.set(c, v); }
  return v;
}
function cupDrops(c: Cup) {
  let v = drops.get(c);
  if (!v) { const rnd = mulberry32(c.seed + 99); v = Array.from({ length: 13 }, () => [rnd(), rnd() * 2 - 1, 1.2 + rnd() * 2.2]); drops.set(c, v); }
  return v;
}

/** Lumpy, domed slush top (tier 2+). */
function slushTop(g: Painter, x: number, sy: number, hw: number, fi: number, seed: number, t: number, wob: number, dome: number) {
  const F = FL[fi];
  g.beginPath(); g.moveTo(x - hw, sy + 5);
  const N = 12;
  for (let k = 0; k <= N; k++) {
    const px = x - hw + (2 * hw * k) / N, bump = (Math.sin(seed + k * 1.9) * 0.5 + 0.5) * 3.6 + (Math.sin(seed * 2 + k * 3.1) * 0.5 + 0.5) * 1.6;
    g.lineTo(px, sy - Math.sin((Math.PI * k) / N) * dome - bump + wob * Math.sin(k + t * 12) * 0.35);
  }
  g.lineTo(x + hw, sy + 5); g.closePath();
  g.fill(g.linear(0, sy - dome - 6, 0, sy + 6, [[0, F.light], [1, F.color]]));
  g.save(); g.clip(); fillSlush(g, fi, x - hw, sy - dome - 10, hw * 2, dome + 18, x); g.restore();
}

export function drawCup(g: Painter, c: Cup, r: Round, t: number, ctx: RenderCtx) {
  const x = c.x, design = ctx.cup, tol = r.L.tol, reduced = ctx.reduced;
  const GL = roundGlass(r), tier = GL.tier, G = glassGeom(GL.id), rimW = G.hw(G.yt);
  const topFi = () => r.L.flavours[(c.seq.filter(s => s.amt > 0).pop() ?? { tap: 0 }).tap];
  // shadow, pedestal foot (milkshake glass)
  g.beginPath(); g.ellipse(x, BELT_Y + 1, (G.stem ? 34 : G.hw(G.yb)) + 8, 5, 0, 0, 7); g.fill('rgba(37,35,58,.22)');
  if (G.stem) {
    // a short, sturdy soda-fountain pedestal, not a wine stem
    g.beginPath(); g.ellipse(x, BELT_Y - 4, 34, 7, 0, 0, 7); g.fill('rgba(255,255,255,.78)'); g.lineWidth = 2.5; g.stroke(design.foot);
    g.beginPath(); g.moveTo(x - 9, BELT_Y - 7); g.quadraticCurveTo(x - 6, (BELT_Y + G.yb) / 2, x - 14, G.yb + 2); g.lineTo(x + 14, G.yb + 2);
    g.quadraticCurveTo(x + 6, (BELT_Y + G.yb) / 2, x + 9, BELT_Y - 7); g.closePath();
    g.fill('rgba(255,255,255,.72)'); g.lineWidth = 1; g.stroke('rgba(37,35,58,.18)');
  }
  glassPath(g, G, x); g.fill(tier === 0 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.24)');
  if (G.base) { // heavy-bottomed soda glass: solid frosted glass under the liquid
    g.save(); glassPath(g, G, x); g.clip();
    g.fillRect(x - G.hw(G.yb) - 2, G.liqB, G.hw(G.yb) * 2 + 4, G.yb - G.liqB, 'rgba(255,255,255,.42)');
    g.fillRect(x - G.hw(G.liqB) + 4, G.liqB, G.hw(G.liqB) * 2 - 8, 2, 'rgba(255,255,255,.7)');
    g.restore();
  }

  // liquid
  const sy = uy(G, c.total), wob = reduced ? 0 : c.wob * 3.2 * Math.sin(t * 14 + c.id);
  if (c.total > 0.3) {
    g.save(); glassPath(g, G, x, 3); g.clip();
    let u0 = 0;
    for (const s of c.seq) {
      if (s.amt <= 0) continue;
      const fi = r.L.flavours[s.tap], F = FL[fi], y1 = uy(G, u0 + s.amt), y0 = uy(G, u0);
      const fill = tier === 0 ? F.color : g.linear(x - rimW, 0, x + rimW, 0, [[0, F.deep], [0.38, F.color], [1, F.deep]]);
      g.fillRect(x - rimW - 4, y1 - 0.6, rimW * 2 + 8, y0 - y1 + 1.2, fill);
      if (tier >= 2) fillSlush(g, fi, x - rimW - 4, y1 - 0.6, rimW * 2 + 8, y0 - y1 + 1.2, x);
      u0 += s.amt;
    }
    const TF = FL[topFi()];
    if (tier === 1) {
      for (const [u, v, rad] of cupSpecks(c)) {
        const py = lerp(G.liqB - 4, G.liqT, u);
        if (py > sy + 4) g.fillCircle(x + v * (G.hw(py) - 8), py, rad, 'rgba(255,255,255,.38)');
      }
    }
    if (tier <= 1) { g.beginPath(); g.ellipse(x, sy + wob * 0.4, G.hw(sy) - 2, tier === 0 ? 4 : 5 + Math.abs(wob) * 0.6, 0, 0, 7); g.fill(TF.light); }
    if (tier >= 2) { // frost: the glass fogs where the cold slush touches it
      g.fillRect(x - rimW - 4, sy, rimW * 2 + 8, G.yb - sy, g.linear(x - rimW, 0, x + rimW, 0, [[0, 'rgba(255,255,255,.42)'], [0.22, 'rgba(255,255,255,.08)'], [0.78, 'rgba(255,255,255,.08)'], [1, 'rgba(255,255,255,.42)']]));
      g.fillRect(x - rimW - 4, Math.max(sy, G.yb - 30), rimW * 2 + 8, 30, g.linear(0, G.yb - 30, 0, G.yb, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.35)']]));
    }
    g.restore();
    if (tier >= 2) {
      const dome = 3 + 7 * clamp(c.total / 60, 0, 1);
      g.save(); glassPath(g, G, x, 3); g.rect(x - rimW - 10, G.yt - 30, rimW * 2 + 20, 33); g.clip();
      slushTop(g, x, sy, G.hw(sy) - 3, topFi(), c.seed % 100, t, wob, dome);
      g.restore();
      // condensation beads on the outside, only below the slush line
      for (const [u, v, rad] of cupDrops(c)) {
        const py = lerp(G.yb - 12, G.yt + 10, u);
        if (py < sy + 6) continue;
        const px = x + v * (G.hw(py) - 4);
        g.fillCircle(px, py, rad, 'rgba(255,255,255,.75)');
        g.fillCircle(px + rad * 0.3, py + rad * 0.35, rad * 0.45, 'rgba(37,35,58,.12)');
      }
      if (tier >= 3 && !reduced) {
        for (let k = 0; k < 4; k++) {
          const ph = t * 2.2 + (c.seed % 7) + k * 1.7, a = Math.max(0, Math.sin(ph));
          const py = lerp(G.liqB - 8, Math.max(sy + 8, G.liqT), (k * 0.31 + (c.seed % 13) / 13) % 1);
          if (a > 0.05 && py > sy) sparkle(g, x + Math.sin(k * 2.3 + c.seed) * (G.hw(py) - 10), py, 2.6, a);
        }
        if (c.total > 25) for (let k = 0; k < 2; k++) {
          const ph = (t * 0.35 + k * 0.5 + (c.seed % 5) / 5) % 1;
          g.beginPath(); g.ellipse(x + Math.sin(ph * 6 + k) * 10, G.yt - 6 - ph * 34, 16 + ph * 14, 6 + ph * 4, 0, 0, 7);
          g.fill(`rgba(255,255,255,${(0.22 * (1 - ph)).toFixed(3)})`);
        }
      }
    }
  }

  // targets: tolerance band + mark per layer (plan §3.8: target always visible, never colour-only)
  if (!c.judged) drawTargets(g, c, r, G, x, rimW, tol, tier);

  // brim line
  const by = uy(G, 100), bh = G.hw(by) - 3;
  g.lineWidth = 2; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(x - bh, by); g.lineTo(x + bh, by); g.stroke('rgba(178,98,45,.7)');

  // cosmetic foot band (cup designs from the Collection apply to every glass)
  if (!G.stem) {
    g.save(); glassPath(g, G, x); g.clip();
    g.fillRect(x - rimW, G.yb - 12, rimW * 2, 12, design.foot);
    if (design.pattern === 'stripes') for (let k = -6; k < 6; k++) {
      g.beginPath(); g.moveTo(x + k * 10, G.yb); g.lineTo(x + k * 10 + 5, G.yb); g.lineTo(x + k * 10 + 12, G.yb - 12); g.lineTo(x + k * 10 + 7, G.yb - 12); g.fill(design.alt);
    }
    if (design.pattern === 'dots') for (let k = -3; k <= 3; k++) g.fillCircle(x + k * 10, G.yb - 6, 2.4, design.alt);
    if (design.pattern === 'checker') for (let k = -4; k < 4; k++) for (let m = 0; m < 2; m++) if ((k + m) % 2 === 0) g.fillRect(x + k * 6, G.yb - 12 + m * 6, 6, 6, design.alt);
    if (design.pattern === 'waves') {
      g.lineWidth = 2; g.beginPath();
      for (let k = -36; k <= 36; k += 2) g.lineTo(x + k, G.yb - 6 + Math.sin(k * 0.4) * 2.5);
      g.stroke(design.alt);
    }
    g.restore();
  }

  // glass body
  g.lineCap = 'butt';
  glassPath(g, G, x, 0, true); g.lineWidth = tier === 0 ? 3.5 : 3; g.stroke('rgba(255,255,255,.95)');
  g.lineWidth = 1; g.stroke(tier === 0 ? 'rgba(37,35,58,.3)' : 'rgba(37,35,58,.22)');
  if (tier >= 1) {
    g.beginPath();
    const N = 10;
    for (let k = 0; k <= N; k++) { const y = lerp(G.yt + 10, G.yb - 18, k / N); g.lineTo(x - G.hw(y) + 9, y); }
    g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke('rgba(255,255,255,.5)');
    g.lineCap = 'butt'; g.lineJoin = 'miter';
  }
  if (tier >= 2) { g.save(); glassPath(g, G, x); g.clip(); g.fillRect(x - rimW - 2, G.yt, rimW * 2 + 4, 7, 'rgba(255,255,255,.45)'); g.restore(); }
  if (G.stem) { // fluted milkshake glass: faint ribs following the flare
    g.save(); glassPath(g, G, x); g.clip(); g.lineWidth = 2;
    for (const f of [-0.6, -0.22, 0.22, 0.6]) {
      g.beginPath();
      for (let k = 0; k <= 12; k++) { const y = lerp(G.yt + 8, G.yb - 4, k / 12); g.lineTo(x + f * G.hw(y), y); }
      g.stroke('rgba(255,255,255,.22)');
    }
    g.restore();
  }
  g.beginPath(); g.ellipse(x, G.yt, rimW, 6, 0, 0, 7); g.lineWidth = 3; g.stroke(design.rim === '#FFFFFF' ? 'rgba(255,255,255,.95)' : design.rim);

  // overflow
  if (c.overflowed) {
    const F = FL[topFi()], k = clamp((r.clock - c.ovAt) * 1.6, 0, 1);
    g.beginPath(); g.ellipse(x, G.yt - 2, rimW + 2, 11, 0, Math.PI, 0); g.fill(F.color);
    g.lineCap = 'round';
    for (const [side, len, w] of [[-1, 0.9, 9], [1, 0.6, 7], [0.35, 0.75, 6]]) {
      const sx = x + side * (rimW - 2);
      g.lineWidth = w; g.beginPath(); g.moveTo(sx, G.yt); g.lineTo(sx + side * -6 * k, G.yt + (BELT_Y - G.yt) * len * k); g.stroke(F.color);
    }
    g.lineCap = 'butt';
  }
  // topping: sits on the slush surface (or at the rim if overfilled), never floating above it
  if (c.topping !== null) {
    const p = clamp((r.clock - c.topAt) * 4, 0, 1);
    const dome = tier >= 2 ? (3 + 7 * clamp(c.total / 60, 0, 1)) * 0.8 : 0;
    const surf = Math.max(sy, G.yt + 6) - dome, hw = G.hw(Math.max(sy, G.yt + 6)) - 4;
    drawToppingOnCup(g, c, G, x, surf, hw, p);
  }
  // served: lid + straw (cups), straw (glassware), plus a wafer stick in a milkshake
  if (c.judged && c.verdict?.ok) {
    const p = easeBack(clamp((r.clock - c.judgedAt) * 3, 0, 1)), yt = G.yt;
    if (tier <= 1) {
      g.save(); g.translate(x, yt); g.scale(1, Math.max(0.001, p));
      g.beginPath(); g.ellipse(0, 0, rimW + 3, 22, 0, Math.PI, 0); g.fill('rgba(255,255,255,.55)'); g.lineWidth = 2.5; g.stroke('#fff');
      g.restore();
    }
    g.save(); g.translate(x + 10, yt - (tier <= 1 ? 18 : 2) * p); g.rotate(0.22);
    g.rr(-5, -56 * p, 10, 60 * p, 5); g.fill('#fff');
    g.save(); g.clip();
    for (let k = -60; k < 10; k += 14) { g.beginPath(); g.moveTo(-6, k); g.lineTo(6, k - 6); g.lineTo(6, k); g.lineTo(-6, k + 6); g.fill('#FF6B8A'); }
    g.restore(); g.restore();
    if (tier >= 3) { // rolled wafer stick
      g.save(); g.translate(x - 16, yt + 6); g.rotate(-0.38); g.scale(Math.max(0.001, p), Math.max(0.001, p));
      g.rr(-5, -52, 10, 54, 5); g.fill('#E9B872');
      g.save(); g.clip();
      for (let k = -60; k < 6; k += 7) { g.beginPath(); g.moveTo(-6, k); g.lineTo(6, k - 5); g.lineTo(6, k - 3); g.lineTo(-6, k + 2); g.fill('#C98E45'); }
      g.restore();
      g.beginPath(); g.ellipse(0, -52, 5, 2, 0, 0, 7); g.fill('#8A5A2B');
      g.restore();
    }
  }
  // verdict badge: tick or cross, never colour alone
  if (c.judged && c.verdict) {
    const p = easeBack(clamp((r.clock - c.judgedAt) * 4, 0, 1)), bx = x + CUP_RT - 2, by2 = BELT_Y - CUP_H + 34, ok = c.verdict.ok;
    g.save(); g.translate(bx, by2); g.scale(Math.max(0.001, p), Math.max(0.001, p));
    g.circle(0, 0, 18); g.fill(ok ? (c.verdict.perfect ? '#FFC857' : '#6E9F2B') : '#D93D63'); g.lineWidth = 3; g.stroke('#fff');
    g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    if (ok) { g.moveTo(-7, 0); g.lineTo(-2, 6); g.lineTo(8, -6); } else { g.moveTo(-6, -6); g.lineTo(6, 6); g.moveTo(6, -6); g.lineTo(-6, 6); }
    g.stroke(ok && c.verdict.perfect ? INK : '#fff');
    g.lineCap = 'butt'; g.lineJoin = 'miter';
    g.restore();
  }
}

/** Toppings as they'd really sit: cream on top, sprinkles across the surface, boba sunk to the bottom, a cherry perched. */
function drawToppingOnCup(g: Painter, c: Cup, G: GlassGeom, x: number, surf: number, hw: number, p: number) {
  const rnd = mulberry32(c.seed + 7), k = c.topping!;
  if (k === 0) { // whipped cream: grows as it's piped on
    const w = Math.min(hw * 1.5, 64) * (0.35 + 0.65 * p);
    g.save(); g.translate(x, surf + 2); drawWhip(g, w); g.restore();
  } else if (k === 1) { // sprinkles rain onto the surface
    const cs = ['#FF6B8A', '#45C6F2', '#FFC857', '#A7D95B', '#A78BFA', '#FFFFFF'];
    for (let i = 0; i < 16; i++) {
      const dx = (rnd() * 2 - 1) * hw * 0.85, dy = (rnd() * 2 - 1) * 3.5, fall = (1 - p) * (20 + rnd() * 30);
      g.save(); g.translate(x + dx, surf + dy - fall); g.rotate(rnd() * Math.PI);
      g.rr(-3.5, -1.2, 7, 2.4, 1.2); g.fill(cs[i % cs.length]); g.restore();
    }
  } else if (k === 2) { // boba: pearls sink to the bottom, a few still floating at the top
    g.save(); glassPath(g, G, x, 3); g.clip();
    const bottom = G.liqB - 5;
    for (let i = 0; i < 11; i++) {
      const settle = i < 8 ? p : 1, ty = i < 8 ? bottom - Math.floor(i / 4) * 7 - rnd() * 3 : surf + 4 + rnd() * 4;
      const py = surf + (ty - surf) * settle, px = x + (rnd() * 2 - 1) * (G.hw(py) - 9);
      g.fillCircle(px, py, 4.4, '#3B2A26'); g.fillCircle(px - 1.4, py - 1.4, 1.3, 'rgba(255,255,255,.35)');
    }
    g.restore();
  } else { // cherry perched on top
    g.save(); g.translate(x + 2, surf - 6 - (1 - p) * 30); g.scale(1.25, 1.25);
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(1, -4); g.quadraticCurveTo(4, -12, 9, -14); g.stroke('#5C8A2E');
    g.fillCircle(0, 3, 8, '#E8264A'); g.fillCircle(-3, 0, 2.5, 'rgba(255,255,255,.7)');
    g.restore();
  }
}

function drawTargets(g: Painter, c: Cup, r: Round, G: GlassGeom, x: number, rimW: number, tol: number, tier: number) {
  let cum = 0, prevY = -1e9, prevLeft = false;
  const o = c.order;
  o.layers.forEach((l, k) => {
    cum += l.amt;
    const last = k === o.layers.length - 1, y = uy(G, cum), yA = uy(G, cum + tol), yB = uy(G, cum - tol), F = FL[r.L.flavours[l.tap]];
    g.save(); glassPath(g, G, x, 3); g.clip();
    g.fillRect(x - rimW - 4, yA, rimW * 2 + 8, yB - yA, last ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.18)');
    g.restore();
    const hw = G.hw(y) - 3, ink = last ? INK : F.deep;
    g.lineWidth = last ? 3 : 2.5; g.setLineDash(last && tier > 0 ? [] : [6, 4]);
    g.beginPath(); g.moveTo(x - hw, y); g.lineTo(x + hw, y); g.stroke(ink); g.setLineDash([]);
    const hA = G.hw(yA) + 2, hB = G.hw(yB) + 2;
    g.lineWidth = 2.5; g.beginPath();
    g.moveTo(x + hA + 5, yA); g.lineTo(x + hA, yA); g.lineTo(x + hB, yB); g.lineTo(x + hB + 5, yB); g.stroke(ink);
    // flavour badge beside the mark; flips to the other side when two marks sit too close to share one
    const left = Math.abs(y - prevY) < 34 && !prevLeft;
    flavourBadge(g, F, left ? x - G.hw(y) - 20 : x + G.hw(y) + 26, y, 15);
    prevY = y; prevLeft = left;
  });
}

export function drawTicket(g: Painter, c: Cup, r: Round) {
  const o = c.order, n = o.layers.length + (o.topping !== null ? 1 : 0), w = Math.max(90, n * 50 + 16), x = c.x - w / 2, y = BELT_Y + 24;
  g.rr(x, y + 3, w, 44, 13); g.fill('rgba(37,35,58,.18)');
  g.rr(x, y, w, 44, 13); g.fill(c.judged ? (c.verdict?.ok ? '#E8F5D2' : '#FFE0E7') : '#FFFFFF');
  g.fillCircle(c.x, y + 1, 3, '#C9C2B4');
  let cx = x + 8 + 25;
  for (const l of o.layers) {
    const F = FL[r.L.flavours[l.tap]];
    flavourBadge(g, F, cx - 10, y + 22, 14);
    g.text(String(Math.round(l.amt)), cx + 14, y + 23, { size: 16, f: 'num', c: INK });
    cx += 50;
  }
  if (r.mode === 'spin' && !c.judged) {
    for (let k = 0; k < r.L.maxLaps; k++) g.fillCircle(c.x - 12 + k * 12, y + 54, 4, k < c.laps ? '#D93D63' : 'rgba(255,255,255,.85)');
  }
  if (o.topping !== null) {
    g.fillCircle(cx - 4, y + 22, 14, INK);
    drawToppingIcon(g, o.topping, cx - 4, y + 23, 0.75);
    if (c.topping !== null) { g.lineWidth = 3; g.circle(cx - 4, y + 22, 16); g.stroke('#6E9F2B'); }
  }
}
