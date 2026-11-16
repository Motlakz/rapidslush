// The Beach Shack backdrop. Static, so it is recorded once per time-of-day into an SkPicture and replayed each frame.
// The shack's day moves with progress: day (1–30) → golden hour (31–60) → sunset (61–90) → night with string lights (91+).
import { FilterMode, Skia, TileMode, type SkPicture, type SkShader } from '@shopify/react-native-skia';

import { BELT_Y, ENTRY_X, FLAVOURS, H, W, mulberry32, type Round } from '@/engine';
import type { StageLayout } from '@/game/layout';
import { glassGeom, glassPath, roundGlass } from './glass';
import { Painter, hexA } from './painter';
import { CREAM, INK } from './shapes';

interface Sky {
  sky: [string, string, string]; sea: [string, string];
  sun: { x: number; y: number; r: number; c: string; glow: string; moon?: boolean };
  sand: string; wall: string; wallLine: string; tint: string | null; cloud: string; foliage: string; trunk: string; island: string;
}
const SKIES: Sky[] = [
  { sky: ['#2FB1F0', '#86D9FB', '#FFF0CC'], sea: ['#0B93CC', '#48CDE6'], sun: { x: 1090, y: 132, r: 50, c: '#FFE36E', glow: 'rgba(255,228,120,.38)' }, sand: '#F9D9A0', wall: '#F6BC7C', wallLine: 'rgba(160,90,40,.28)', tint: null, cloud: 'rgba(255,255,255,.92)', foliage: '#2E9E55', trunk: '#8A5A3B', island: '#3C8E62' },
  { sky: ['#3D9BE0', '#FFC27A', '#FFE3A6'], sea: ['#2A86BE', '#F2BE7E'], sun: { x: 1092, y: 192, r: 56, c: '#FFB347', glow: 'rgba(255,170,70,.42)' }, sand: '#F6CB8A', wall: '#F4B06C', wallLine: 'rgba(150,80,30,.3)', tint: 'rgba(255,160,60,.08)', cloud: 'rgba(255,236,210,.9)', foliage: '#3C8A47', trunk: '#7A4B2E', island: '#4A7A52' },
  { sky: ['#5B3F9A', '#F05E8A', '#FFAF64'], sea: ['#4A3C8E', '#E9747A'], sun: { x: 1092, y: 232, r: 62, c: '#FF7A45', glow: 'rgba(255,110,80,.45)' }, sand: '#E9B07E', wall: '#E89E6C', wallLine: 'rgba(120,50,40,.3)', tint: 'rgba(190,70,120,.12)', cloud: 'rgba(255,190,200,.85)', foliage: '#2F5E46', trunk: '#5E3A2A', island: '#3A3F6A' },
  { sky: ['#0E1433', '#232A66', '#4E3F86'], sea: ['#0C1636', '#283A7A'], sun: { x: 1090, y: 118, r: 40, c: '#F3EFCF', glow: 'rgba(240,235,200,.22)', moon: true }, sand: '#6E5A7E', wall: '#D29A7E', wallLine: 'rgba(40,20,40,.32)', tint: 'rgba(22,24,72,.2)', cloud: 'rgba(120,130,190,.55)', foliage: '#1C3A3A', trunk: '#3A2A2E', island: '#141C3E' },
];
export const phaseFor = (n: number) => (n <= 30 ? 0 : n <= 60 ? 1 : n <= 90 ? 2 : 3);

const pictures: (SkPicture | null)[] = [null, null, null, null];
/** Fonts arrived after a backdrop was recorded: re-record so its signs use them. */
export function invalidateBackgrounds() {
  for (let i = 0; i < pictures.length; i++) { pictures[i]?.dispose(); pictures[i] = null; sideShaders[i]?.dispose(); sideShaders[i] = null; }
}
export function background(phase: number): SkPicture {
  const hit = pictures[phase];
  if (hit) return hit;
  const rec = Skia.PictureRecorder();
  const g = new Painter();
  g.begin(rec.beginRecording({ x: 0, y: 0, width: W, height: H }));
  paintBackground(g, phase);
  const pic = rec.finishRecordingAsPicture();
  g.end();
  rec.dispose();
  return (pictures[phase] = pic);
}

function paintBackground(g: Painter, phase: number) {
  const S = SKIES[phase];
  g.fillRect(0, 0, W, 320, g.linear(0, 0, 0, 300, [[0, S.sky[0]], [0.62, S.sky[1]], [1, S.sky[2]]]));
  if (phase === 3) {
    const rnd = mulberry32(7);
    for (let k = 0; k < 90; k++) { const a = 0.4 + rnd() * 0.6; g.fillCircle(rnd() * W, rnd() * 220, 0.6 + rnd() * 1.6, `rgba(255,255,240,${a})`); }
  }
  // sun / moon: one soft radial glow that fades to nothing (no stacked rings), plus a faint ray shimmer by day
  // scale the alpha of an rgba() string
  const fade = (rgba: string, f: number) => rgba.replace(/([\d.]+)\)$/, (_, a) => `${(parseFloat(a) * f).toFixed(3)})`);
  const sn = S.sun, R = sn.r * 2.6, clear = fade(sn.glow, 0);
  g.fillCircle(sn.x, sn.y, R, g.radial(sn.x, sn.y, R, [[0, sn.glow], [sn.r / R, sn.glow], [0.7, fade(sn.glow, 0.35)], [1, clear]]));
  if (!sn.moon) {
    g.save(); g.translate(sn.x, sn.y); g.alpha = 0.35;
    for (let k = 0; k < 12; k++) {
      g.rotate(Math.PI / 6);
      g.beginPath(); g.moveTo(-4, sn.r + 6); g.lineTo(4, sn.r + 6); g.lineTo(0, sn.r + 26); g.closePath();
      g.fill(g.linear(0, sn.r + 6, 0, sn.r + 26, [[0, sn.glow], [1, clear]]));
    }
    g.restore();
  }
  g.fillCircle(sn.x, sn.y, sn.r, sn.c);
  if (sn.moon) { g.fillCircle(sn.x - 12, sn.y - 8, 7, 'rgba(200,195,170,.5)'); g.fillCircle(sn.x + 10, sn.y + 10, 5, 'rgba(200,195,170,.5)'); }
  // clouds
  const cloud = (x: number, y: number, s: number) => {
    for (const [dx, dy, r] of [[0, 0, 34], [30, -10, 28], [58, 0, 30], [28, 8, 30]]) {
      g.beginPath(); g.ellipse(x + dx * s, y + dy * s, r * s, r * 0.6 * s, 0, 0, 7); g.fill(S.cloud);
    }
  };
  cloud(120, 104, 1); cloud(1010, 70, 0.75); cloud(220, 160, 0.6);
  // sea, distant island, sailboat, foam
  g.fillRect(0, 226, W, 74, g.linear(0, 226, 0, 300, [[0, S.sea[0]], [1, S.sea[1]]]));
  g.beginPath(); g.moveTo(40, 228); g.quadraticCurveTo(110, 196, 190, 228); g.closePath(); g.fill(S.island);
  g.lineWidth = 3; g.beginPath(); g.moveTo(112, 212); g.quadraticCurveTo(116, 196, 124, 188); g.stroke(S.island);
  for (let k = 0; k < 4; k++) {
    g.save(); g.translate(124, 188); g.rotate(-1.2 + k * 0.8);
    g.beginPath(); g.ellipse(10, 0, 12, 3, 0, 0, 7); g.fill(S.island); g.restore();
  }
  g.beginPath(); g.moveTo(1150, 236); g.lineTo(1150, 200); g.lineTo(1176, 234); g.closePath(); g.fill(phase === 3 ? '#C9C4E8' : '#FFFFFF');
  g.beginPath(); g.moveTo(1138, 238); g.lineTo(1186, 238); g.lineTo(1178, 246); g.lineTo(1146, 246); g.closePath(); g.fill(phase === 3 ? '#3A3060' : '#E8564F');
  if (sn.moon || phase >= 1) for (let k = 0; k < 6; k++) g.fillRect(sn.x - 30 + (k % 2) * 14, 236 + k * 9, 60 - k * 6, 3, sn.glow);
  g.lineWidth = 2.5; g.lineCap = 'round';
  for (let k = 0; k < 18; k++) {
    const x = ((k * 97) % 1260) + 10, y = 240 + ((k * 37) % 50);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 5, x + 28, y); g.stroke(phase === 3 ? 'rgba(200,210,255,.35)' : 'rgba(255,255,255,.65)');
  }
  g.fillRect(0, 292, W, 30, S.sand);
  for (let x = 0; x < W; x += 36) { g.beginPath(); g.ellipse(x + 18, 293, 18, 3, 0, 0, Math.PI); g.fill('rgba(255,255,255,.55)'); }
  // palms
  const palm = (x: number, lean: number) => {
    g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, 312); g.quadraticCurveTo(x + lean * 0.4, 220, x + lean, 140); g.stroke(S.trunk);
    g.lineWidth = 2;
    for (let k = 0; k < 7; k++) {
      const y = 300 - k * 22, xx = x + lean * (1 - (y - 140) / 172) * 0.9;
      g.beginPath(); g.moveTo(xx - 6, y); g.lineTo(xx + 6, y - 4); g.stroke('rgba(0,0,0,.15)');
    }
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI + (k * Math.PI) / 6 + 0.05;
      g.save(); g.translate(x + lean, 140); g.rotate(a);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(44, -26, 92, 12); g.quadraticCurveTo(44, -4, 0, 0); g.fill(S.foliage);
      g.restore();
    }
    g.fillCircle(x + lean - 6, 146, 7, '#6B4226'); g.fillCircle(x + lean + 6, 148, 7, '#6B4226');
  };
  palm(150, -26); palm(1188, 30);
  // bunting across the window
  const flags = ['#FF6B8A', '#45C6F2', '#FFC857', '#A7D95B', '#A78BFA'];
  for (let k = 0; k < 32; k++) {
    const x = 30 + k * 38, y = 54 + Math.sin((k / 31) * Math.PI) * 14;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y + 1); g.lineTo(x + 13, y + 24); g.closePath(); g.fill(flags[k % 5]);
  }
  // back wall: warm planks
  g.fillRect(0, 318, W, 176, S.wall);
  for (let y = 318, row = 0; y < 494; y += 26, row++) g.fillRect(0, y, W, 26, row % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)');
  g.lineWidth = 2; g.lineCap = 'butt';
  for (let y = 344; y < 494; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(S.wallLine); }
  for (let k = 0; k < 34; k++) { const y = 318 + (k % 7) * 26, x = (k * 173) % W; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 26); g.stroke(S.wallLine); }
  // chalkboard menu
  g.rr(168, 336, 150, 110, 10); g.fill('#7A4B2E'); g.rr(175, 343, 136, 96, 6); g.fill('#2E3B36');
  g.text('MENU', 243, 360, { size: 15, c: '#F4F1E6' });
  FLAVOURS.slice(0, 4).forEach((F, k) => {
    g.fillCircle(190, 380 + k * 15, 4.5, F.color);
    g.text(F.name, 202, 381 + k * 15, { size: 11, c: 'rgba(244,241,230,.85)', align: 'left' });
  });
  // window frame, shelf, posts
  g.fillRect(0, 312, W, 10, '#B9733F'); g.fillRect(0, 0, 26, 494, '#B9733F'); g.fillRect(W - 26, 0, 26, 494, '#B9733F');
  g.fillRect(4, 0, 4, 494, 'rgba(255,255,255,.15)'); g.fillRect(W - 22, 0, 4, 494, 'rgba(255,255,255,.15)');
  g.rr(262, 296, 756, 16, 6); g.fill('#9A5A32');
  // awning
  for (let k = 0; k < 17; k++) {
    const c = k % 2 ? CREAM : '#FF5A7E';
    g.fillRect(k * 80, 0, 80, 30, c);
    g.beginPath(); g.arc(k * 80 + 40, 30, 40, 0, Math.PI); g.fill(c);
    g.beginPath(); g.arc(k * 80 + 40, 30, 40, 0.15, Math.PI - 0.15); g.lineTo(k * 80 + 40, 36); g.fill('rgba(0,0,0,.08)');
  }
  g.fillRect(0, 0, W, 4, 'rgba(37,35,58,.14)');
  // pick-up sign
  g.lineWidth = 3; g.beginPath(); g.moveTo(1070, 244); g.lineTo(1070, 266); g.moveTo(1180, 244); g.lineTo(1180, 266); g.stroke('#9A5A32');
  g.rr(1040, 262, 170, 42, 21); g.fill('#FFC857'); g.stroke('#E09A1E');
  g.text('PICK UP', 1125, 284, { size: 20, c: INK });
  // counter top with plank seams + rope trim
  g.fillRect(0, 494, W, 106, g.linear(0, 494, 0, 600, [[0, '#F6BE7E'], [1, '#DE9A5C']]));
  g.lineWidth = 2;
  for (let k = 0; k < 9; k++) {
    const y = 520 + k * 9 + (k % 3) * 2;
    g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y - 3, 900, y + 4, W, y); g.stroke('rgba(140,75,30,.2)');
  }
  for (let x = 140; x < W; x += 260) { g.beginPath(); g.moveTo(x, 498); g.lineTo(x - 6, 598); g.stroke('rgba(120,60,25,.35)'); }
  g.fillRect(0, 596, W, 12, '#A9653A');
  g.lineWidth = 3;
  for (let x = 0; x < W; x += 14) { g.beginPath(); g.moveTo(x, 599); g.lineTo(x + 10, 605); g.stroke('#E8C48E'); }
  if (S.tint) { g.fillRect(0, 300, W, 308, S.tint); g.fillRect(0, 0, W, 72, S.tint); }
  // control deck
  g.fillRect(0, 608, W, H - 608, g.linear(0, 608, 0, H, [[0, '#34304F'], [1, '#221F38']]));
  g.fillRect(0, 608, W, 2, 'rgba(255,255,255,.06)');
}

/**
 * The stage beyond the 1280×720 world, shaped to the screen (Apple's iPhone Duo HIG: change the aspect ratio rather
 * than letterbox). Above the window: the shack's front with its sign. Beside it: the shack wall and counter, continued
 * from the backdrop's own edges. Below: more control deck. Drawn in stage coordinates.
 */
const sideShaders: (SkShader | null)[] = [null, null, null, null];
export function drawStageBackdrop(g: Painter, phase: number, L: StageLayout, t: number) {
  const { SW, SH, ox, oy } = L;
  if (ox > 0.5) {
    let sh = sideShaders[phase];
    if (!sh) sh = sideShaders[phase] = background(phase).makeShader(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear);
    g.save(); g.translate(ox, oy);
    g.fillRect(-ox - 1, 0, ox + 1, H, sh); g.fillRect(W, 0, ox + 1, H, sh);
    // board seams so the continued posts read as the shack's wall
    for (let x = -60; x > -ox; x -= 60) g.fillRect(x, 30, 2, 464, 'rgba(0,0,0,.10)');
    for (let x = W + 60; x < W + ox; x += 60) g.fillRect(x, 30, 2, 464, 'rgba(0,0,0,.10)');
    g.restore();
  }
  if (oy > 0.5) drawShackFront(g, phase, SW, oy, L.hudY, t);
  const below = SH - oy - H;
  if (below > 0.5) {
    g.fillRect(0, oy + H - 1, SW, below + 1, '#221F38');
    for (let y = oy + H + 40; y < SH; y += 40) g.fillRect(0, y, SW, 1, 'rgba(255,255,255,.035)');
  }
}

/** Above the awning: planked shack front, roof trim and a bulb-lit sign (only when there's room above the HUD). */
function drawShackFront(g: Painter, phase: number, SW: number, oy: number, hudY: number, t: number) {
  const S = SKIES[phase], night = phase === 3;
  g.fillRect(0, 0, SW, oy, g.linear(0, 0, 0, oy, [[0, '#8E5530'], [1, '#B9733F']]));
  for (let y = oy - 26, row = 0; y > -26; y -= 26, row++) {
    g.fillRect(0, y, SW, 2, 'rgba(0,0,0,.12)');
    for (let x = (row % 2) * 90; x < SW; x += 180) g.fillRect(x, y, 2, 26, 'rgba(0,0,0,.08)');
  }
  g.fillRect(0, oy - 12, SW, 12, '#9A5A32');
  g.fillRect(0, oy - 12, SW, 3, 'rgba(255,255,255,.18)');
  if (S.tint) g.fillRect(0, 0, SW, oy, S.tint);

  const room = hudY + 14; // the sign sits above the HUD row
  if (room < 90) return;
  const sh = Math.min(170, room * 0.7), sw = Math.min(SW * 0.72, sh * 4.4), cx = SW / 2, cy = room / 2;
  // hanging chains
  g.lineWidth = 3; g.lineCap = 'round';
  for (const side of [-1, 1]) { g.beginPath(); g.moveTo(cx + side * sw * 0.32, 0); g.lineTo(cx + side * sw * 0.32, cy - sh / 2); g.stroke('#5E3A2A'); }
  g.lineCap = 'butt';
  g.rr(cx - sw / 2, cy - sh / 2 + 6, sw, sh, 24); g.fill('rgba(37,35,58,.3)');
  g.rr(cx - sw / 2, cy - sh / 2, sw, sh, 24); g.fill('#FFF9F1'); g.lineWidth = 6; g.stroke('#E09A1E');
  // marquee bulbs chase around the board
  const per = Math.max(8, Math.round((sw + sh) / 34)), lit = (k: number) => (Math.floor(t * 6) + k) % 3 !== 0;
  const bulbs: [number, number][] = [];
  for (let k = 0; k < per; k++) { const x = cx - sw / 2 + 18 + ((sw - 36) * k) / (per - 1); bulbs.push([x, cy - sh / 2 + 14], [x, cy + sh / 2 - 14]); }
  bulbs.forEach(([x, y], k) => {
    const on = lit(k);
    if (on && phase >= 1) g.fillCircle(x, y, 9, hexA('#FFC857', night ? 0.45 : 0.3));
    g.fillCircle(x, y, 4.5, on ? '#FFE08A' : '#D8CFC0');
  });
  const fs = Math.round(sh * 0.42);
  g.text('Rapid Slush', cx + 3, cy + 4, { size: fs, f: 'head', c: '#25233A' });
  g.text('Rapid Slush', cx, cy, { size: fs, f: 'head', c: '#FF6B8A' });
}

/** String lights along the awning: live so they twinkle; they only really glow at golden hour and after dark. */
export function drawLights(g: Painter, t: number, phase: number, x0 = 0, x1 = W) {
  const on = [0.25, 0.55, 0.8, 1][phase], cols = ['#FFE08A', '#FF8FB0', '#8FE3FF', '#C7F08A'];
  g.lineWidth = 1.5; g.lineCap = 'butt'; g.beginPath();
  for (let x = Math.floor(x0 / 20) * 20; x <= x1; x += 20) g.lineTo(x, 40 + Math.abs(Math.sin((x / W) * Math.PI * 4)) * 14);
  g.stroke('rgba(37,35,58,.5)');
  for (let k = Math.ceil((x0 - 20) / 38); k <= Math.floor((x1 - 20) / 38); k++) {
    const x = 20 + k * 38, y = 44 + Math.abs(Math.sin((x / W) * Math.PI * 4)) * 14, tw = 0.75 + 0.25 * Math.sin(t * 2.2 + k * 1.7), c = cols[((k % 4) + 4) % 4];
    if (on > 0.5) g.fillCircle(x, y + 4, 12, hexA(c, 0.22 * on * tw));
    g.fillCircle(x, y + 4, 4, on > 0.5 ? c : 'rgba(255,255,255,.75)');
  }
}

/** The cup stack at the belt entrance shows the shack's current glassware. */
export function drawTower(g: Painter, r: Round) {
  const GL = roundGlass(r), G = glassGeom(GL.id);
  g.rr(ENTRY_X - 48, 252, 96, 30, 15); g.fill(INK); g.text('CUPS', ENTRY_X, 268, { size: 15, c: '#fff' });
  if (G.stem) {
    for (const [dx, dy, s] of [[-26, 0, 0.6], [26, 0, 0.6], [0, -62, 0.6]]) {
      g.save(); g.translate(ENTRY_X + dx, BELT_Y + dy); g.scale(s, s); g.translate(0, -BELT_Y);
      glassPath(g, G, 0); g.fill('rgba(255,255,255,.3)');
      glassPath(g, G, 0, 0, true); g.lineWidth = 3.5; g.stroke('rgba(255,255,255,.95)');
      g.beginPath(); g.ellipse(0, G.yt, G.hw(G.yt), 6, 0, 0, 7); g.stroke('rgba(255,255,255,.95)');
      g.beginPath(); g.moveTo(-8, BELT_Y - 6); g.lineTo(-13, G.yb + 2); g.lineTo(13, G.yb + 2); g.lineTo(8, BELT_Y - 6); g.closePath(); g.fill('rgba(255,255,255,.6)');
      g.beginPath(); g.ellipse(0, BELT_Y - 4, 32, 7, 0, 0, 7); g.fill('rgba(255,255,255,.6)');
      g.restore();
    }
    return;
  }
  for (let k = 3; k >= 0; k--) {
    g.save(); g.translate(0, -k * 13);
    glassPath(g, G, ENTRY_X); g.fill(GL.tier === 0 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.22)');
    glassPath(g, G, ENTRY_X, 0, true); g.lineWidth = 2.5; g.stroke('rgba(255,255,255,.95)');
    g.beginPath(); g.ellipse(ENTRY_X, G.yt, G.hw(G.yt), 5, 0, 0, 7); g.stroke('rgba(255,255,255,.95)');
    g.restore();
  }
}
