// Slush texture: granules, ice shards and sparkles in a seamless 128px tile, recorded once per flavour as an
// SkPicture and used as a repeating shader (the prototype's createPattern).
import { Skia, type SkShader } from '@shopify/react-native-skia';

import { FLAVOURS, mulberry32 } from '@/engine';
import { Painter, hexA, patternShader } from './painter';

const cache = new Map<number, SkShader>();
let tilePainter: Painter | null = null;

export function slushShader(fi: number): SkShader {
  const hit = cache.get(fi);
  if (hit) return hit;
  const F = FLAVOURS[fi], S = 128, rnd = mulberry32(fi * 977 + 13);
  const rec = Skia.PictureRecorder();
  const q = (tilePainter ??= new Painter());
  q.begin(rec.beginRecording({ x: 0, y: 0, width: S, height: S }));
  const tile = (fn: () => void) => {
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { q.save(); q.translate(dx, dy); fn(); q.restore(); }
  };
  for (let k = 0; k < 150; k++) {
    const x = rnd() * S, y = rnd() * S, rad = 1.5 + rnd() * 3.8, a = 0.16 + rnd() * 0.16;
    tile(() => q.fillCircle(x, y, rad, hexA(F.deep, a)));
  }
  for (let k = 0; k < 120; k++) {
    const x = rnd() * S, y = rnd() * S, s = 2.2 + rnd() * 4.5, rot = rnd() * Math.PI, a = 0.35 + rnd() * 0.4;
    tile(() => {
      q.save(); q.translate(x, y); q.rotate(rot);
      q.beginPath(); q.moveTo(0, -s); q.lineTo(s * 0.42, 0); q.lineTo(0, s * 0.6); q.lineTo(-s * 0.38, 0); q.closePath();
      q.fill(`rgba(255,255,255,${a})`);
      q.restore();
    });
  }
  for (let k = 0; k < 18; k++) {
    const x = rnd() * S, y = rnd() * S, s = 1.6 + rnd() * 1.6;
    tile(() => {
      q.beginPath();
      q.moveTo(x, y - s * 2); q.lineTo(x + s * 0.4, y); q.lineTo(x, y + s * 2); q.lineTo(x - s * 0.4, y); q.closePath();
      q.moveTo(x - s * 2, y); q.lineTo(x, y + s * 0.4); q.lineTo(x + s * 2, y); q.lineTo(x, y - s * 0.4); q.closePath();
      q.fill('rgba(255,255,255,.95)');
    });
  }
  const pic = rec.finishRecordingAsPicture();
  q.end();
  rec.dispose();
  const sh = patternShader(pic, 0.5);
  cache.set(fi, sh);
  return sh;
}

/** Texture overlay anchored to the object (ox) so it rides along with it. */
export function fillSlush(g: Painter, fi: number, x: number, y0: number, w: number, h: number, ox: number) {
  g.save(); g.translate(ox, 0); g.fillRect(x - ox, y0, w, h, slushShader(fi)); g.restore();
}

export function sparkle(g: Painter, x: number, y: number, s: number, a: number) {
  g.save(); g.alpha *= a;
  g.beginPath();
  g.moveTo(x, y - s * 2); g.lineTo(x + s * 0.35, y); g.lineTo(x, y + s * 2); g.lineTo(x - s * 0.35, y); g.closePath();
  g.moveTo(x - s * 2, y); g.lineTo(x, y + s * 0.35); g.lineTo(x + s * 2, y); g.lineTo(x, y - s * 0.35); g.closePath();
  g.fill('#fff'); g.restore();
}
