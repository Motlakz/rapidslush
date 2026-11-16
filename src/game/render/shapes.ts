import type { Glyph } from '@/engine';
import type { Painter } from './painter';

export const INK = '#25233A';
export const CREAM = '#FFF9F1';

/** Flavour glyphs: every flavour has a shape as well as a colour (plan §3.8, never colour alone). */
export function glyph(g: Painter, kind: Glyph, x: number, y: number, s: number, fill: string) {
  g.save(); g.translate(x, y); g.scale(s / 10, s / 10); g.beginPath();
  if (kind === 'heart') { g.moveTo(0, 8); g.bezierCurveTo(-13, -1, -7, -12, 0, -4); g.bezierCurveTo(7, -12, 13, -1, 0, 8); }
  else if (kind === 'drop') { g.moveTo(0, -10); g.bezierCurveTo(5, -3, 8, 0, 8, 3); g.arc(0, 3, 8, 0, Math.PI, false); g.bezierCurveTo(-8, 0, -5, -3, 0, -10); }
  else if (kind === 'leaf') { g.moveTo(0, -10); g.quadraticCurveTo(11, 0, 0, 10); g.quadraticCurveTo(-11, 0, 0, -10); }
  else if (kind === 'diamond') { g.moveTo(0, -10); g.lineTo(9, 0); g.lineTo(0, 10); g.lineTo(-9, 0); g.closePath(); }
  else if (kind === 'grape') { for (const [a, b] of [[-4.5, -3.5], [4.5, -3.5], [0, 4.5]]) g.addCircle(a, b, 5); }
  else {
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? 4.4 : 10; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    g.closePath();
  }
  g.fill(fill); g.restore();
}

export function drawLock(g: Painter, x: number, y: number, s: number, c: string) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineWidth = 5; g.beginPath(); g.arc(0, -6, 11, Math.PI, 0); g.stroke(c);
  g.rr(-17, -6, 34, 28, 7); g.fill(c);
  g.restore();
}

/**
 * A dollop of whipped cream whose base sits on y = 0, w wide: soft piped lobes rising to a curled peak.
 * Lobes are separated by faint cream shading rather than outlines, so it reads as cream, not candy.
 */
export function drawWhip(g: Painter, w: number) {
  const h = w * 0.78, r1 = w * 0.23, r2 = w * 0.19, crease = 'rgba(176,150,120,.28)';
  const lobe = (cx: number, cy: number, r: number) => {
    g.fillCircle(cx, cy + r * 0.12, r, crease);        // soft crease under the lobe
    g.fillCircle(cx, cy, r, '#FFFDF8');
    g.fillCircle(cx - r * 0.3, cy - r * 0.35, r * 0.35, 'rgba(255,255,255,.9)'); // sheen
  };
  g.beginPath(); g.ellipse(0, -1, w / 2, w * 0.1, 0, 0, 7); g.fill('rgba(176,150,120,.25)'); // contact shadow on the slush
  for (const dx of [-0.29, 0.29, 0]) lobe(dx * w, -r1 * 0.85, r1);  // piped ring
  for (const dx of [-0.13, 0.13]) lobe(dx * w, -r1 * 1.75, r2);      // second ring
  // curled peak
  g.beginPath();
  g.moveTo(-w * 0.15, -h * 0.66); g.quadraticCurveTo(-w * 0.12, -h * 0.98, w * 0.07, -h);
  g.quadraticCurveTo(w * 0.02, -h * 0.86, w * 0.15, -h * 0.66); g.closePath();
  g.fill(crease); g.save(); g.translate(0, -1.2); g.fill('#FFFDF8'); g.restore();
}

export function drawToppingIcon(g: Painter, k: number, x: number, y: number, s: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (k === 0) {
    g.translate(0, 9); drawWhip(g, 24);
  } else if (k === 1) {
    const cs = ['#FF6B8A', '#45C6F2', '#FFC857', '#A7D95B', '#A78BFA'];
    for (let i = 0; i < 9; i++) {
      g.save(); g.translate(((i * 7) % 18) - 9, ((i * 5) % 14) - 7); g.rotate(i);
      g.rr(-4, -1.5, 8, 3, 1.5); g.fill(cs[i % 5]); g.restore();
    }
  } else if (k === 2) {
    for (const [a, b] of [[-6, 3], [5, 4], [0, -4], [-1, 8], [8, -3]]) g.fillCircle(a, b, 4.2, '#3B2A26');
  } else {
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(1, -4); g.quadraticCurveTo(4, -12, 9, -14); g.stroke('#5C8A2E');
    g.fillCircle(0, 3, 8, '#E8264A'); g.fillCircle(-3, 0, 2.5, 'rgba(255,255,255,.7)');
  }
  g.restore();
}
