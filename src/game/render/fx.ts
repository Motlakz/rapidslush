// Effect drawing. Pool state lives in game/fx.ts so game logic can spawn effects without loading Skia.
import { BELT_Y, FLAVOURS as FL, NOZZLE_Y, SPIN, STATION_X, cupUnder, type Round } from '@/engine';
import { clamp, easeBack } from '@/engine/util';
import { FX, spawnParts } from '@/game/fx';
import { roundGlass, surfaceY } from './glass';
import type { Painter } from './painter';
import { slushShader } from './textures';

export { FX };

export function drawParts(g: Painter, dt: number) {
  for (const p of FX.parts) { p.life += dt; p.vy += 600 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  FX.parts = FX.parts.filter(p => p.life < p.max);
  for (const p of FX.parts) { g.save(); g.alpha = 1 - p.life / p.max; g.fillCircle(p.x, p.y, p.r, p.color); g.restore(); }
}

export function drawFloats(g: Painter, dt: number) {
  for (const f of FX.floats) f.age += dt;
  FX.floats = FX.floats.filter(f => f.age < 1.3);
  for (const f of FX.floats) {
    const p = easeBack(clamp(f.age * 5, 0, 1)), y = f.y - f.age * 40, a = clamp((1.3 - f.age) * 3, 0, 1);
    g.save(); g.alpha = a; g.translate(f.x, y); g.scale(Math.max(0.001, p), Math.max(0.001, p));
    const w = g.measure(f.s, f.size) + 26;
    g.rr(-w / 2, -f.size * 0.8, w, f.size * 1.6, f.size * 0.8); g.fill(f.bg);
    g.text(f.s, 0, 1, { size: f.size, c: f.color });
    g.restore();
  }
}

/** Belt pour streams, nozzle to liquid surface (or to the counter when nothing is under the tap). */
export function drawStreams(g: Painter, r: Round, t: number, dt: number) {
  const tier = roundGlass(r).tier;
  for (let i = 0; i < r.L.taps; i++) {
    const f = r.flow[i];
    if (f <= 0.3) continue;
    const F = FL[r.L.flavours[i]], x = STATION_X[i], cup = cupUnder(r, x);
    const y1 = cup ? surfaceY(r, cup) : BELT_Y - 1, w = (tier >= 2 ? 5 : 3.5) + (f / 85) * 9, wob = FX.reduced ? 0 : Math.sin(t * 40 + i) * 1.1;
    g.beginPath(); g.moveTo(x - w / 2 - 1, NOZZLE_Y);
    g.quadraticCurveTo(x - w / 2 + wob, (NOZZLE_Y + y1) / 2, x - (w / 2) * 0.85, y1);
    g.lineTo(x + (w / 2) * 0.85, y1); g.quadraticCurveTo(x + w / 2 + wob, (NOZZLE_Y + y1) / 2, x + w / 2 + 1, NOZZLE_Y); g.closePath();
    g.fill(F.color);
    if (tier >= 2) {
      g.save(); g.clip(); g.translate(x, (t * 160) % 64);
      g.fillRect(-20, NOZZLE_Y - 70, 40, y1 - NOZZLE_Y + 140, slushShader(r.L.flavours[i])); g.restore();
    }
    if (tier >= 1) g.fillRect(x - w / 2 + 1.5, NOZZLE_Y, Math.max(1.5, w * 0.22), y1 - NOZZLE_Y, 'rgba(255,255,255,.4)');
    if (Math.random() < dt * (cup ? 14 : 40) * (f / 50)) spawnParts(x, y1, cup ? F.light : F.color, cup ? 1 : 3, cup ? 1.6 : 2.4, cup ? 70 : 160);
  }
}

/** Spin Bar: one stream from the single nozzle, coloured by whichever flavour is flowing hardest. */
export function drawSpinStream(g: Painter, r: Round, t: number, dt: number) {
  let fi = -1, f = 0;
  for (let i = 0; i < r.L.taps; i++) if (r.flow[i] > f) { f = r.flow[i]; fi = i; }
  if (f <= 0.3) return;
  const tier = roundGlass(r).tier, F = FL[r.L.flavours[fi]], c = r.winCup;
  const y1 = c && c.p ? c.p.y + (surfaceY(r, c) - BELT_Y) * c.p.s : SPIN.CY + SPIN.RY - 4, w = (tier >= 2 ? 5 : 3.5) + (f / 85) * 9, x = 640;
  g.beginPath(); g.moveTo(x - w / 2 - 1, SPIN.NOZ_Y); g.lineTo(x - (w / 2) * 0.85, y1); g.lineTo(x + (w / 2) * 0.85, y1); g.lineTo(x + w / 2 + 1, SPIN.NOZ_Y); g.closePath();
  g.fill(F.color);
  if (tier >= 2) {
    g.save(); g.clip(); g.translate(x, (t * 160) % 64);
    g.fillRect(-20, SPIN.NOZ_Y - 70, 40, y1 - SPIN.NOZ_Y + 140, slushShader(r.L.flavours[fi])); g.restore();
  }
  if (Math.random() < dt * (c ? 14 : 30) * (f / 50)) spawnParts(x, y1, c ? F.light : F.color, c ? 1 : 2, 1.8, c ? 70 : 120);
}
