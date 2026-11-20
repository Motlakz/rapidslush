// Skia drawing for the flavour icon set (path data in ./iconData, shared with the loading screen).
import { Skia, type SkPath } from '@shopify/react-native-skia';

import { FLAVOUR_ICONS, LEAF } from './iconData';
import type { Painter } from './painter';
import { INK } from './shapes';

interface Parsed { body: SkPath; leaf: SkPath | null; stems: SkPath | null; detail: SkPath | null }
const cache = new Map<string, Parsed>();
const parse = (d?: string) => (d ? Skia.Path.MakeFromSVGString(d) : null);

function iconPaths(id: string): Parsed {
  let p = cache.get(id);
  if (!p) {
    const s = FLAVOUR_ICONS[id] ?? FLAVOUR_ICONS.berry;
    p = { body: parse(s.body)!, leaf: parse(s.leaf), stems: parse(s.stems), detail: parse(s.detail) };
    cache.set(id, p);
  }
  return p;
}

/** Draw a flavour's icon centred on (x, y), `size` units square, two-tone with an ink outline. */
export function flavourIcon(g: Painter, F: { id: string; color: string; light: string }, x: number, y: number, size: number) {
  const P = iconPaths(F.id), s = size / 24;
  g.save(); g.translate(x - 12 * s, y - 12 * s); g.scale(s, s);
  const cap = g.lineCap, join = g.lineJoin, lw = g.lineWidth;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillPath(P.body, F.color);
  if (P.detail) { g.lineWidth = 1.2; g.strokePath(P.detail, F.light); }
  g.lineWidth = 1.8; g.strokePath(P.body, INK);
  if (P.stems) g.strokePath(P.stems, INK);
  if (P.leaf) { g.fillPath(P.leaf, LEAF); g.strokePath(P.leaf, INK); }
  g.lineCap = cap; g.lineJoin = join; g.lineWidth = lw;
  g.restore();
}

/** A white badge with a flavour-coloured ring and the icon inside: on glasses, tickets and labels. */
export function flavourBadge(g: Painter, F: { id: string; color: string; light: string }, x: number, y: number, r: number) {
  g.fillCircle(x, y + r * 0.12, r + 1, 'rgba(37,35,58,.22)');
  g.fillCircle(x, y, r, '#fff');
  const lw = g.lineWidth;
  g.lineWidth = Math.max(2, r * 0.18); g.circle(x, y, r - g.lineWidth / 2); g.stroke(F.color);
  g.lineWidth = lw;
  flavourIcon(g, F, x, y, r * 1.3);
}
