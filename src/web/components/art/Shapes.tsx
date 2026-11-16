// SVG versions of the game's canvas shapes (src/game/render/shapes.ts): flavour glyphs and topping icons.
import type { Glyph, Topping } from '@/lib/art';

/** A flavour glyph centred on (x, y), `s` = its half-size (the game's glyphs are drawn in a 20-unit box). */
export function GlyphMark({ kind, x = 0, y = 0, s = 10, fill }: { kind: Glyph; x?: number; y?: number; s?: number; fill: string }) {
  const k = s / 10;
  const t = `translate(${x} ${y}) scale(${k})`;
  if (kind === 'grape') {
    return <g transform={t} fill={fill}><circle cx={-4.5} cy={-3.5} r={5} /><circle cx={4.5} cy={-3.5} r={5} /><circle cx={0} cy={4.5} r={5} /></g>;
  }
  const d = {
    heart: 'M0 8C-13 -1 -7 -12 0 -4C7 -12 13 -1 0 8Z',
    drop: 'M0 -10C5 -3 8 0 8 3A8 8 0 0 1 -8 3C-8 0 -5 -3 0 -10Z',
    leaf: 'M0 -10Q11 0 0 10Q-11 0 0 -10Z',
    diamond: 'M0 -10L9 0L0 10L-9 0Z',
    star: Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4.4 : 10;
      return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
    }).join('') + 'Z',
  }[kind];
  return <path transform={t} d={d} fill={fill} />;
}

/** A dollop of whipped cream whose base sits on y = 0, `w` wide (lobes and a curled peak, no outlines). */
export function Whip({ w }: { w: number }) {
  const h = w * 0.78, r1 = w * 0.23, r2 = w * 0.19, crease = 'rgba(176,150,120,.3)', cream = '#FFFDF8';
  const lobe = (cx: number, cy: number, r: number, key: string) => (
    <g key={key}>
      <circle cx={cx} cy={cy + r * 0.12} r={r} fill={crease} />
      <circle cx={cx} cy={cy} r={r} fill={cream} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.35} fill="rgba(255,255,255,.9)" />
    </g>
  );
  return (
    <g>
      <ellipse cx={0} cy={-1} rx={w / 2} ry={w * 0.1} fill="rgba(176,150,120,.25)" />
      {[-0.29, 0.29, 0].map((dx, i) => lobe(dx * w, -r1 * 0.85, r1, `a${i}`))}
      {[-0.13, 0.13].map((dx, i) => lobe(dx * w, -r1 * 1.75, r2, `b${i}`))}
      <path d={`M${-w * 0.15} ${-h * 0.66}Q${-w * 0.12} ${-h * 0.98} ${w * 0.07} ${-h}Q${w * 0.02} ${-h * 0.86} ${w * 0.15} ${-h * 0.66}Z`} fill={cream} />
    </g>
  );
}

const SPRINKLE = ['#FF6B8A', '#45C6F2', '#FFC857', '#A7D95B', '#A78BFA'];

/** The topping icons the game shows on tickets and buttons, centred on (0, 0) at roughly 24 units. */
export function ToppingIcon({ kind }: { kind: Topping }) {
  if (kind === 'Whip') return <g transform="translate(0 9)"><Whip w={24} /></g>;
  if (kind === 'Sprinkles') {
    return <g>{Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={-4} y={-1.5} width={8} height={3} rx={1.5} fill={SPRINKLE[i % 5]} transform={`translate(${((i * 7) % 18) - 9} ${((i * 5) % 14) - 7}) rotate(${(i * 57.3) % 360})`} />
    ))}</g>;
  }
  if (kind === 'Boba') return <g fill="#3B2A26">{[[-6, 3], [5, 4], [0, -4], [-1, 8], [8, -3]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={4.2} />)}</g>;
  return (
    <g>
      <path d="M1 -4Q4 -12 9 -14" stroke="#5C8A2E" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={3} r={8} fill="#E8264A" />
      <circle cx={-3} cy={0} r={2.5} fill="rgba(255,255,255,.7)" />
    </g>
  );
}
