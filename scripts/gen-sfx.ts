// Renders Rapid Slush's sound effects to WAV (run: bun scripts/gen-sfx.ts → assets/sfx/*.wav).
// The design prototype synthesised these live with WebAudio; React Native has no WebAudio, so the same recipes are
// rendered offline here, a little richer (harmonics, a small room reverb, combo chimes that climb with the streak).
// Deterministic: the same script always produces the same files.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SR = 44100;
const OUT = join(import.meta.dir, '..', 'assets', 'sfx');

// ---------- tiny DSP kit ----------
let seed = 1;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const buf = (secs: number) => new Float32Array(Math.ceil(secs * SR));
type Wave = 'sine' | 'triangle' | 'square' | 'saw';
const wave = (w: Wave, ph: number) => {
  const x = ph - Math.floor(ph);
  if (w === 'sine') return Math.sin(2 * Math.PI * x);
  if (w === 'triangle') return 1 - 4 * Math.abs(x - 0.5);
  if (w === 'square') return x < 0.5 ? 0.8 : -0.8; // a touch softer than full scale
  return 2 * x - 1;
};

/** A tone with an exponential pitch glide and a click-free attack/decay. Harmonics add body to plain waves. */
function tone(out: Float32Array, f: number, dur: number, w: Wave, vol: number, delay = 0, to?: number, harm: number[] = []) {
  const s0 = Math.floor(delay * SR), n = Math.floor(dur * SR);
  let ph = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / n, fr = to ? f * Math.pow(to / f, t) : f;
    ph += fr / SR;
    const env = Math.min(1, i / (SR * 0.004)) * Math.pow(1 - t, 2.2);
    let v = wave(w, ph);
    harm.forEach((a, k) => { v += a * Math.sin(2 * Math.PI * ph * (k + 2)); });
    out[s0 + i] += v * env * vol;
  }
}

/**
 * Filtered noise whose low-pass cutoff sweeps down: splashes, whooshes, swishes. The attack is a soft swell
 * (default 25 ms): a hard noise onset reads as a snare or a gunshot, not liquid.
 */
function burst(out: Float32Array, dur: number, f0: number, vol: number, delay = 0, f1 = f0 / 5, band = false, attack = 0.025) {
  const s0 = Math.floor(delay * SR), n = Math.floor(dur * SR);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / n, fc = f0 * Math.pow(f1 / f0, t), a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    const x = rand() * 2 - 1;
    lp += a * (x - lp); lp2 += a * (lp - lp2);
    const v = band ? lp - lp2 : lp2; // band = crude band-pass for airy whooshes
    const at = Math.min(1, i / (SR * attack)), env = at * at * (3 - 2 * at) * Math.pow(1 - t, 1.6);
    out[s0 + i] += v * env * vol * (band ? 3 : 1.6);
  }
}

/** Bell: sine partials at inharmonic ratios, the classic arcade "ding". */
function bell(out: Float32Array, f: number, dur: number, vol: number, delay = 0) {
  [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(([r, a]) => tone(out, f * r, dur / Math.sqrt(r), 'sine', vol * a, delay));
}

/** Small Schroeder room: a sense of space so chimes ring instead of stopping dead. */
function reverb(x: Float32Array, wet: number, tail = 0.5): Float32Array {
  const out = new Float32Array(x.length + Math.floor(tail * SR));
  out.set(x);
  const combs = [1557, 1617, 1491, 1422].map(d => ({ d: Math.floor((d * SR) / 44100), b: new Float32Array(Math.floor((d * SR) / 44100)), i: 0 }));
  const aps = [225, 556].map(d => ({ b: new Float32Array(d), i: 0 }));
  for (let n = 0; n < out.length; n++) {
    const inp = n < x.length ? x[n] : 0;
    let s = 0;
    for (const c of combs) { const y = c.b[c.i]; c.b[c.i] = inp + y * 0.78; c.i = (c.i + 1) % c.d; s += y; }
    s /= 4;
    for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * 0.5; a.i = (a.i + 1) % a.b.length; s = y - s * 0.5; }
    out[n] += s * wet;
  }
  return out;
}

function normalize(x: Float32Array, peak = 0.89) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] = Math.tanh((x[i] / m) * 1.1) * peak; // gentle soft-clip
  // trim trailing silence
  let end = x.length;
  while (end > 1 && Math.abs(x[end - 1]) < 1e-4) end--;
  return x.subarray(0, end);
}

function wav(name: string, x: Float32Array) {
  const n = x.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  writeFileSync(join(OUT, name + '.wav'), b);
  return b.length;
}

// ---------- the sounds ----------
const SFX: Record<string, () => Float32Array> = {
  serve: () => { const o = buf(0.45); tone(o, 784, 0.14, 'triangle', 0.5, 0, undefined, [0.2]); tone(o, 1175, 0.24, 'triangle', 0.5, 0.08, undefined, [0.2]); return reverb(o, 0.18, 0.3); },
  perfect: () => {
    const o = buf(0.8);
    [784, 988, 1175, 1568].forEach((f, i) => tone(o, f, 0.2, 'triangle', 0.4, i * 0.055, undefined, [0.15]));
    bell(o, 2093, 0.45, 0.18, 0.22);
    return reverb(o, 0.25, 0.5);
  },
  lap: () => { const o = buf(0.2); tone(o, 520, 0.14, 'sine', 0.5, 0, 760); return o; },
  fail: () => { const o = buf(0.5); tone(o, 330, 0.18, 'triangle', 0.5, 0, 310); tone(o, 247, 0.3, 'triangle', 0.5, 0.12, 220); return reverb(o, 0.12, 0.25); },
  miss: () => { const o = buf(0.32); tone(o, 220, 0.28, 'triangle', 0.5, 0, 140); return o; },
  // spills: a wet slosh (soft-onset, low-passed) and a falling "bloop", never a crack
  spill_minor: () => { const o = buf(0.4); burst(o, 0.3, 1600, 0.45, 0, 500, false, 0.03); tone(o, 480, 0.16, 'sine', 0.3, 0.02, 240); return o; },
  spill_moderate: () => { const o = buf(0.7); burst(o, 0.55, 1400, 0.6, 0, 300, false, 0.04); tone(o, 420, 0.3, 'sine', 0.35, 0.02, 160); return reverb(o, 0.1, 0.3); },
  spill_major: () => {
    const o = buf(1.1);
    burst(o, 0.85, 1200, 0.8, 0, 220, false, 0.05); burst(o, 0.4, 2200, 0.2, 0.15, 600, false, 0.05);
    tone(o, 300, 0.45, 'sine', 0.45, 0.03, 90); // big falling bloop
    tone(o, 120, 0.35, 'sine', 0.35, 0.0, 60); // low body, swelling in
    return reverb(o, 0.12, 0.4);
  },
  slide: () => { const o = buf(0.45); burst(o, 0.4, 500, 0.3, 0, 250, true, 0.12); return o; },
  send: () => { const o = buf(0.45); tone(o, 600, 0.1, 'sine', 0.3, 0, 900); burst(o, 0.35, 1100, 0.4, 0.02, 400, true, 0.08); return o; },
  topping: () => {
    const o = buf(0.55);
    for (let k = 0; k < 3; k++) burst(o, 0.09, 6000, 0.18, k * 0.08, 3500, true, 0.03);
    [1320, 1568, 1760].forEach((f, i) => tone(o, f, 0.1, 'sine', 0.22, 0.1 + i * 0.045));
    return reverb(o, 0.15, 0.25);
  },
  clean: () => { const o = buf(0.5); burst(o, 0.3, 3000, 0.3, 0, 1500, true, 0.06); tone(o, 1400, 0.16, 'sine', 0.22, 0.14, 2100); return reverb(o, 0.15, 0.25); },
  tick: () => { const o = buf(0.08); tone(o, 1200, 0.06, 'triangle', 0.4); return o; },
  count: () => { const o = buf(0.3); tone(o, 660, 0.18, 'triangle', 0.4, 0, undefined, [0.2]); return reverb(o, 0.12, 0.2); },
  go: () => { const o = buf(0.8); [784, 988, 1175].forEach((f, i) => tone(o, f, 0.45, 'triangle', 0.22, i * 0.02, undefined, [0.15])); return reverb(o, 0.22, 0.4); },
  coin: () => { const o = buf(0.45); [988, 1319, 1976].forEach((f, i) => tone(o, f, 0.14, 'triangle', 0.3, i * 0.07, undefined, [0.3])); return reverb(o, 0.15, 0.3); },
  win: () => {
    const o = buf(1.6);
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(o, f, i === 5 ? 0.6 : 0.2, 'triangle', 0.4, i * 0.1, undefined, [0.15]));
    [523, 659, 784].forEach(f => tone(o, f, 0.7, 'triangle', 0.12, 0.55));
    for (let k = 0; k < 6; k++) tone(o, 2093 + (k % 3) * 260, 0.08, 'sine', 0.07, 0.6 + k * 0.06);
    return reverb(o, 0.28, 0.8);
  },
  lose: () => { const o = buf(1.1); [392, 330, 262, 196].forEach((f, i) => tone(o, f, 0.3, 'triangle', 0.3, i * 0.16, f * 0.97)); return reverb(o, 0.12, 0.4); },
  tap: () => { const o = buf(0.06); tone(o, 880, 0.05, 'triangle', 0.4); return o; },
};
// combo chimes: one step up a pentatonic scale per streak level, so a long combo literally sounds like it's climbing
const PENTA = [0, 2, 4, 7, 9, 12, 14];
for (let k = 1; k <= 6; k++) {
  SFX['combo' + k] = () => {
    const o = buf(0.6), f = 1047 * Math.pow(2, PENTA[k - 1] / 12);
    bell(o, f, 0.45, 0.4); bell(o, f * 1.5, 0.3, 0.18, 0.05);
    return reverb(o, 0.25, 0.4);
  };
}

/**
 * The pour: a soft, steady fizz of slush running into a cup. No rhythm, no hard edges: low-passed noise with a slow,
 * gentle drift and a few quiet bubbles. 3 s, crossfaded so it loops without a seam.
 */
function pourLoop() {
  const len = 3, fadeS = 0.4, o = buf(len + fadeS);
  let lp = 0, lp2 = 0, hp = 0, drift = 0;
  for (let i = 0; i < o.length; i++) {
    const x = rand() * 2 - 1, a = 1 - Math.exp((-2 * Math.PI * 900) / SR);
    lp += a * (x - lp); lp2 += a * (lp - lp2); hp += 0.004 * (lp2 - hp); // ~900 Hz low-pass, rumble removed
    drift += ((rand() - 0.5) * 0.002 - drift * 0.0005); // very slow wander, not a pulse
    o[i] = (lp2 - hp) * 2.2 * (0.92 + Math.max(-0.08, Math.min(0.08, drift * 6)));
  }
  for (let k = 0; k < 14; k++) { // a few soft bubbles
    const at = rand() * len, f = 300 + rand() * 300;
    tone(o, f, 0.08 + rand() * 0.06, 'sine', 0.035 + rand() * 0.03, at, f * 1.6);
  }
  const n = Math.floor(len * SR), fade = Math.floor(fadeS * SR), loop = new Float32Array(n);
  for (let i = 0; i < n; i++) loop[i] = o[i];
  for (let i = 0; i < fade; i++) { const t = i / fade; loop[i] = loop[i] * t + o[n + i] * (1 - t); }
  let m = 0;
  for (const v of loop) m = Math.max(m, Math.abs(v));
  for (let i = 0; i < n; i++) loop[i] = (loop[i] / m) * 0.55;
  return loop;
}

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, make] of Object.entries(SFX)) { seed = 1 + name.length * 977; total += wav(name, normalize(make())); }
seed = 4242;
total += wav('pour_loop', pourLoop());
console.log(`wrote ${Object.keys(SFX).length + 1} sounds to assets/sfx (${(total / 1024).toFixed(0)} KB)`);
