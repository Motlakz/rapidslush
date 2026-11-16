// EffectsPool state: short-lived particles and floating labels, capped so low-end devices never drown (plan §3.6).
// No Skia here: the controller spawns effects, render/fx.ts draws them.
const INK = '#25233A';

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; r: number }
interface Float { x: number; y: number; s: string; color: string; bg: string; age: number; size: number }

export const FX = { parts: [] as Part[], floats: [] as Float[], shake: 0, reduced: false };

export function resetFx() { FX.parts = []; FX.floats = []; FX.shake = 0; }

export function spawnParts(x: number, y: number, color: string, n: number, spread: number, up?: number) {
  if (FX.reduced) n = Math.ceil(n / 4);
  for (let k = 0; k < n && FX.parts.length < 120; k++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * spread, sp = (up || 120) * (0.4 + Math.random());
    FX.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.35 + Math.random() * 0.35, color, r: 2 + Math.random() * 3 });
  }
}

export function addFloat(x: number, y: number, s: string, color = INK, bg = '#fff', size = 22) {
  FX.floats.push({ x, y, s, color, bg, age: 0, size });
  if (FX.floats.length > 10) FX.floats.shift();
}
