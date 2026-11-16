// A Canvas2D-shaped facade over an SkCanvas. The design prototype (design/rapidslush.html) was written as
// "Skia primitives through Canvas2D"; this keeps the port line-for-line while every call lands on Skia.
// Paints and the path builder are reused; per-frame Skia objects are disposed at frame end (web has no GC for WASM memory).
import {
  ClipOp, FilterMode, PaintStyle, Skia, StrokeCap, StrokeJoin, TileMode,
  type SkCanvas, type SkColor, type SkFont, type SkPaint, type SkPath, type SkPathEffect, type SkPicture, type SkShader, type SkTypeface,
} from '@shopify/react-native-skia';

export type Fill = string | SkShader;
/** head = Caprasimo (display), body = Quicksand (small reading text), num = Lexend Deca. */
export type FontFace = 'head' | 'body' | 'num';

const colorCache = new Map<string, SkColor>();
export const col = (c: string) => {
  let v = colorCache.get(c);
  if (!v) { v = Skia.Color(c); colorCache.set(c, v); }
  return v;
};

export function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---------- fonts ----------
const typefaces: Partial<Record<FontFace, SkTypeface>> = {};
const fontCache = new Map<string, SkFont>();
export function setTypefaces(head: SkTypeface | null, body: SkTypeface | null, num: SkTypeface | null) {
  if (head) typefaces.head = head;
  if (body) typefaces.body = body;
  if (num) typefaces.num = num;
  fontCache.clear();
  metricCache.clear();
}
function fontFor(face: FontFace, size: number) {
  const key = face + size;
  let f = fontCache.get(key);
  if (!f) {
    const tf = typefaces[face] ?? typefaces.head;
    f = tf ? Skia.Font(tf, size) : Skia.Font(undefined, size);
    fontCache.set(key, f);
  }
  return f;
}

export interface TextOpts {
  size?: number;
  c?: string;
  f?: FontFace;
  align?: 'center' | 'left' | 'right';
}

/** Display face for labels, Quicksand below 15px where the display face gets hard to read. */
const faceFor = (size: number): FontFace => (size < 15 ? 'body' : 'head');

const dashCache = new Map<string, SkPathEffect>();
const RAD2DEG = 180 / Math.PI;
const TAU = Math.PI * 2;

export class Painter {
  canvas!: SkCanvas;
  private pb = Skia.PathBuilder.Make();
  private built: SkPath | null = null;
  private paint: SkPaint;
  private stack: number[] = [];
  private frameJunk: { dispose(): void }[] = [];
  alpha = 1;
  fillStyle: Fill = '#000';
  strokeStyle: Fill = '#000';
  lineWidth = 1;
  lineCap: 'butt' | 'round' = 'butt';
  lineJoin: 'miter' | 'round' = 'miter';
  private dash: SkPathEffect | null = null;

  constructor() {
    this.paint = Skia.Paint();
    this.paint.setAntiAlias(true);
  }

  begin(canvas: SkCanvas) {
    this.canvas = canvas;
    this.alpha = 1; this.stack.length = 0; this.dash = null;
    this.lineCap = 'butt'; this.lineJoin = 'miter'; this.lineWidth = 1;
  }

  /** Dispose everything created for this frame. Call after the picture is finished. */
  end() {
    this.resetPath();
    for (const j of this.frameJunk) j.dispose();
    this.frameJunk.length = 0;
  }

  // ---------- state ----------
  save() { this.canvas.save(); this.stack.push(this.alpha); }
  restore() { this.canvas.restore(); this.alpha = this.stack.pop() ?? 1; }
  translate(x: number, y: number) { this.canvas.translate(x, y); }
  scale(x: number, y: number) { this.canvas.scale(x, y); }
  rotate(rad: number) { this.canvas.rotate(rad * RAD2DEG, 0, 0); }
  setLineDash(seg: number[]) {
    if (!seg.length) { this.dash = null; return; }
    const k = seg.join(',');
    let e = dashCache.get(k);
    if (!e) { e = Skia.PathEffect.MakeDash(seg, 0); dashCache.set(k, e); }
    this.dash = e;
  }

  // ---------- shaders ----------
  linear(x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): SkShader {
    const s = Skia.Shader.MakeLinearGradient({ x: x0, y: y0 }, { x: x1, y: y1 }, stops.map(st => col(st[1])), stops.map(st => st[0]), TileMode.Clamp);
    this.frameJunk.push(s);
    return s;
  }

  radial(x: number, y: number, r: number, stops: [number, string][]): SkShader {
    const s = Skia.Shader.MakeRadialGradient({ x, y }, r, stops.map(st => col(st[1])), stops.map(st => st[0]), TileMode.Clamp);
    this.frameJunk.push(s);
    return s;
  }

  // ---------- path building ----------
  private dirty() {
    if (this.built) { this.built.dispose(); this.built = null; }
  }
  private empty = true;
  private resetPath() { this.dirty(); this.pb.reset(); this.empty = true; }
  beginPath() { this.resetPath(); }
  moveTo(x: number, y: number) { this.dirty(); this.pb.moveTo(x, y); this.empty = false; }
  /** Like Canvas2D, a lineTo on an empty path starts the path there. */
  lineTo(x: number, y: number) {
    if (this.empty) return this.moveTo(x, y);
    this.dirty(); this.pb.lineTo(x, y);
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) { this.dirty(); this.pb.quadTo(cx, cy, x, y); }
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) { this.dirty(); this.pb.cubicTo(c1x, c1y, c2x, c2y, x, y); }
  closePath() { this.dirty(); this.pb.close(); }
  rect(x: number, y: number, w: number, h: number) { this.dirty(); this.pb.addRect({ x, y, width: w, height: h }); this.empty = false; }
  addCircle(x: number, y: number, r: number) { this.dirty(); this.pb.addCircle(x, y, r); this.empty = false; }
  circle(x: number, y: number, r: number) { this.beginPath(); this.addCircle(x, y, r); }
  /** Canvas2D arc semantics (angles in radians, clockwise unless ccw). */
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw = false) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
  ellipse(x: number, y: number, rx: number, ry: number, _rot: number, a0: number, a1: number, ccw = false) {
    this.dirty();
    const oval = { x: x - rx, y: y - ry, width: rx * 2, height: ry * 2 };
    let sweep = a1 - a0;
    const wasEmpty = this.empty;
    this.empty = false;
    if (!ccw && sweep >= TAU) { this.pb.addOval(oval); return; }
    if (ccw && sweep <= -TAU) { this.pb.addOval(oval, true); return; }
    if (!ccw && sweep < 0) sweep = (sweep % TAU) + TAU;
    if (ccw && sweep > 0) sweep = (sweep % TAU) - TAU;
    this.pb.arcToOval(oval, a0 * RAD2DEG, sweep * RAD2DEG, wasEmpty);
  }
  /** Rounded rect path (the prototype's rr()). */
  rr(x: number, y: number, w: number, h: number, r: number) {
    this.beginPath();
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    this.pb.addRRect({ rect: { x, y, width: w, height: h }, rx: r, ry: r });
    this.empty = false;
  }
  private path() {
    if (!this.built) this.built = this.pb.build();
    return this.built;
  }

  // ---------- drawing ----------
  private prep(style: Fill, stroke: boolean) {
    const p = this.paint;
    if (typeof style === 'string') { p.setShader(null); p.setColor(col(style)); }
    else { p.setColor(col('#000')); p.setShader(style); }
    p.setAlphaf(this.alpha * (typeof style === 'string' ? alphaOf(style) : 1));
    p.setStyle(stroke ? PaintStyle.Stroke : PaintStyle.Fill);
    p.setPathEffect(stroke ? this.dash : null);
    if (stroke) {
      p.setStrokeWidth(this.lineWidth);
      p.setStrokeCap(this.lineCap === 'round' ? StrokeCap.Round : StrokeCap.Butt);
      p.setStrokeJoin(this.lineJoin === 'round' ? StrokeJoin.Round : StrokeJoin.Miter);
    }
    return p;
  }
  fill(style?: Fill) { this.canvas.drawPath(this.path(), this.prep(style ?? this.fillStyle, false)); }
  stroke(style?: Fill) { this.canvas.drawPath(this.path(), this.prep(style ?? this.strokeStyle, true)); }
  clip() { this.canvas.clipPath(this.path(), ClipOp.Intersect, true); }
  fillRect(x: number, y: number, w: number, h: number, style?: Fill) {
    this.canvas.drawRect({ x, y, width: w, height: h }, this.prep(style ?? this.fillStyle, false));
  }
  fillCircle(x: number, y: number, r: number, style?: Fill) {
    this.canvas.drawCircle(x, y, r, this.prep(style ?? this.fillStyle, false));
  }
  drawPicture(pic: SkPicture) { this.canvas.drawPicture(pic); }

  // ---------- text ----------
  measure(s: string, size: number, face?: FontFace) {
    return fontFor(face ?? faceFor(size), size).measureText(s).width;
  }
  text(s: string, x: number, y: number, o: TextOpts = {}) {
    const size = o.size ?? 18, face = o.f ?? faceFor(size), font = fontFor(face, size);
    const b = font.measureText(s);
    const m = metrics(font, face, size);
    const align = o.align ?? 'center';
    const dx = align === 'center' ? -(b.x + b.width / 2) : align === 'right' ? -(b.x + b.width) : -b.x;
    // baseline 'middle': centre the em box (ascent..descent) on y
    const by = y - (m.ascent + m.descent) / 2;
    this.canvas.drawText(s, x + dx, by, this.prep(o.c ?? '#25233A', false), font);
  }
}

const metricCache = new Map<string, { ascent: number; descent: number }>();
function metrics(font: SkFont, face: string, size: number) {
  const k = face + size;
  let m = metricCache.get(k);
  if (!m) {
    const fm = font.getMetrics();
    m = { ascent: fm.ascent, descent: fm.descent };
    metricCache.set(k, m);
  }
  return m;
}

// Skia.Color already carries rgba alpha, and setAlphaf overrides it, so fold the colour's own alpha back in.
const alphaCache = new Map<string, number>();
function alphaOf(c: string) {
  let a = alphaCache.get(c);
  if (a === undefined) { a = col(c)[3]; alphaCache.set(c, a); }
  return a;
}

/** A repeating image shader from a recorded tile picture (the prototype's createPattern). */
export function patternShader(tile: SkPicture, scale: number): SkShader {
  const m = Skia.Matrix();
  m.scale(scale, scale);
  return tile.makeShader(TileMode.Repeat, TileMode.Repeat, FilterMode.Linear, m);
}
