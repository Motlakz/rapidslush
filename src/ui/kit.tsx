// UI kit matching the prototype's CSS components (.btn, .card, .tag, .pill, .bar). Sizes are stage units, scaled for
// small screens by the menu type scale (scale.ts useTypeK): text keeps per-kind floors (body 16, small 14), padding shrinks.
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Sound } from '@/services/feedback';
import { fz, useTypeK } from './scale';
import { C, F, R, shadow } from './theme';

type Tone = 'default' | 'berry' | 'razz' | 'lime' | 'mango' | 'grape' | 'ink';
const TONES: Record<Tone, { c: string; s: string; t: string }> = {
  default: { c: '#fff', s: '#D8CFC0', t: C.ink },
  berry: { c: C.berry, s: C.berryD, t: '#fff' },
  razz: { c: C.razz, s: C.razzD, t: '#fff' },
  lime: { c: C.lime, s: C.limeD, t: C.ink },
  mango: { c: C.mango, s: C.mangoD, t: C.ink },
  grape: { c: C.grape, s: C.grapeD, t: '#fff' },
  ink: { c: C.ink, s: '#0F0E1E', t: '#fff' },
};

interface BtnProps {
  tone?: Tone;
  size?: 'big' | 'md' | 'sm';
  icon?: boolean;
  flat?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  label?: string;
  autoFocus?: boolean;
}

/** A chunky arcade button: coloured face over a darker base that it presses down into. */
export function Btn({ tone = 'default', size = 'md', icon, flat, disabled, onPress, children, style, label }: BtnProps) {
  const k = useTypeK(), T = TONES[tone], depth = flat ? 0 : size === 'sm' ? 6 : 8;
  const [pv, ph] = size === 'big' ? [26, 40] : size === 'sm' ? [14, 22] : [20, 32];
  // never shorter than a 44pt tap target
  // padding shrinks faster than text (k²), so buttons stop being chunky on phones while labels stay readable
  const pad = { paddingVertical: Math.max(size === 'sm' ? 12 : 13, Math.round(pv * k * k)), paddingHorizontal: Math.round(ph * k * k) };
  const font = btnFont(size, k), iconSide = Math.max(48, Math.round((size === 'sm' ? 68 : 72) * k));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => { Sound.sfx('tap'); onPress?.(); }}
      style={[{ paddingBottom: depth, opacity: disabled ? 0.45 : 1 }, style]}
    >
      {({ pressed }) => (
        <>
          {depth > 0 && <View style={[StyleSheet.absoluteFill, { top: depth, borderRadius: 999, backgroundColor: T.s }]} />}
          <View
            style={[
              s.btnFace, { backgroundColor: T.c, transform: [{ translateY: pressed && !disabled ? depth - 2 : 0 }] },
              icon ? { width: iconSide, height: iconSide, padding: 0 } : pad,
            ]}
          >
            {typeof children === 'string' ? <Text style={[s.btnText, { color: T.t, fontSize: font }]}>{children}</Text> : children}
          </View>
        </>
      )}
    </Pressable>
  );
}

const btnFont = (size: 'big' | 'md' | 'sm', k: number) => (size === 'big' ? fz(28, k, 20) : size === 'sm' ? fz(18, k, 16) : fz(22, k, 17));
export function BtnText({ children, tone = 'default', size = 'md' }: { children: ReactNode; tone?: Tone; size?: 'big' | 'md' | 'sm' }) {
  const k = useTypeK();
  return <Text style={[s.btnText, { color: TONES[tone].t, fontSize: btnFont(size, k) }]}>{children}</Text>;
}

/** The token-cost chip inside a Play/Start button. */
export function CostChip({ cost, children, tone = 'berry' }: { cost: number; children?: ReactNode; tone?: Tone }) {
  const light = TONES[tone].t !== '#fff'; // light button: ink text on a faint ink chip
  return (
    <View style={[s.cost, light && { backgroundColor: 'rgba(37,35,58,0.08)' }]}>
      {children}
      <Text style={[s.num, { fontSize: fz(22, useTypeK(), 17), color: TONES[tone].t }]}>{cost ? cost : 'Free'}</Text>
    </View>
  );
}

export function Card({ children, style, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  const k = useTypeK();
  return <View style={[flat ? s.cardFlat : s.card, k < 1 && { padding: Math.round((flat ? 20 : 32) * k) }, style, k < 1 && shrinkPad(style, k)]}>{children}</View>;
}
/** Scale a style's own padding by k (cards and panels pass generous padding inline). */
function shrinkPad(style: StyleProp<ViewStyle>, k: number): ViewStyle | null {
  const f = StyleSheet.flatten(style);
  if (!f) return null;
  const out: Record<string, number> = {};
  for (const key of ['padding', 'paddingVertical', 'paddingHorizontal', 'paddingTop', 'paddingBottom', 'gap'] as const) {
    const v = f[key];
    if (typeof v === 'number') out[key] = Math.round(v * k);
  }
  return out as ViewStyle;
}

type TagTone = 'default' | 'berry' | 'lime' | 'mango' | 'grape' | 'razz';
const TAGS: Record<TagTone, [string, string]> = {
  default: [C.cream2, C.ink2], berry: ['#FFE0E7', '#B42A50'], lime: ['#E8F5D2', '#4A6E17'],
  mango: ['#FFF0CC', '#8A5A00'], grape: ['#ECE5FF', '#5636B8'], razz: ['#DDF4FD', '#0F6A91'],
};
/** A label chip. It hugs the start of its row by default; pass `style={{ alignSelf: 'center' }}` inside a centred card. */
export function Tag({ tone = 'default', children, icon, style }: { tone?: TagTone; children: ReactNode; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [bg, fg] = TAGS[tone], k = useTypeK();
  return (
    <View style={[s.tag, { backgroundColor: bg, paddingVertical: Math.round(7 * k), paddingHorizontal: Math.round(15 * k) }, style]}>
      {icon}
      <Text style={[s.tagText, { color: fg, fontSize: fz(16, k, 14) }]}>{children}</Text>
    </View>
  );
}

export function Pill({ children, onPress, label }: { children: ReactNode; onPress?: () => void; label?: string }) {
  const k = useTypeK();
  const body = <View style={[s.pill, k < 1 && { paddingVertical: Math.round(11 * k), paddingLeft: Math.round(13 * k), paddingRight: Math.round(18 * k) }]}>{children}</View>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { Sound.sfx('tap'); onPress(); }}>{body}</Pressable> : body;
}

export function Bar({ frac, color = C.lime, style }: { frac: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.bar, style]}>
      <View style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: color }} />
    </View>
  );
}

export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.row, style]}>{children}</View>;
export const Col = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.col, style]}>{children}</View>;
export const Spacer = () => <View style={{ flex: 1 }} />;

/**
 * A text component at the menu type scale: its size (the kit's or an inline fontSize) shrinks with k on small screens
 * but never under `floor`; the line height keeps its ratio.
 */
function scaledText(kind: 'h1' | 'h2' | 'h3' | 'p' | 'small' | 'num' | 'b', floor: number, display = false) {
  return function ScaledText({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
    const base: TextStyle = s[kind]; // looked up at render: the stylesheet is defined below
    // display headings shrink faster (k²): on a phone the room is better spent on the content and the actions
    const tk = useTypeK(), k = display ? tk * tk : tk;
    const f: TextStyle = StyleSheet.flatten([base, style]) ?? {}, size = f.fontSize ?? 20, next = fz(size, k, floor);
    const fit: TextStyle = f.lineHeight ? { fontSize: next, lineHeight: Math.round((f.lineHeight * next) / size) } : { fontSize: next };
    return <Text style={[base, style, fit]}>{children}</Text>;
  };
}
export const H1 = scaledText('h1', 32, true);
export const H2 = scaledText('h2', 26, true);
export const H3 = scaledText('h3', 20);
export const P = scaledText('p', 16);
export const Small = scaledText('small', 14);
export const Num = scaledText('num', 16);
export const B = scaledText('b', 16);

/** A labelled stat box (Quota / Time / Score…). */
export function Stat({ k, v, grow }: { k: string; v: ReactNode; grow?: boolean }) {
  return (
    <Card flat style={[{ paddingVertical: 16, paddingHorizontal: 18, gap: 3 }, grow && { flex: 1, minWidth: 170 }]}>
      <Small>{k}</Small>
      <Num style={{ fontSize: 30 }}>{v}</Num>
    </Card>
  );
}

/** On/off switch row used in Settings and Pause. */
export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <View style={s.toggleRow}>
      <B style={{ flex: 1 }}>{label}</B>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={() => { Sound.sfx('tap'); onChange(); }} style={[s.sw, on && { backgroundColor: C.limeD }]}>
        <View style={[s.knob, { left: on ? 32 : 4 }]} />
      </Pressable>
    </View>
  );
}

/** Numeric stepper (stands in for the prototype's range sliders). */
export function Stepper({ label, value, fmt, onChange, min, max, step }: {
  label: string; value: number; fmt?: (v: number) => string; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  const set = (v: number) => onChange(Math.round(Math.max(min, Math.min(max, v)) / step) * step);
  return (
    <View style={s.toggleRow}>
      <B style={{ flex: 1 }}>{label}</B>
      <Btn size="sm" icon flat onPress={() => set(value - step)} disabled={value <= min} label={`Decrease ${label}`}><BtnText>−</BtnText></Btn>
      <Num style={{ width: 84, textAlign: 'center', fontSize: 20 }}>{fmt ? fmt(value) : String(+value.toFixed(2))}</Num>
      <Btn size="sm" icon flat onPress={() => set(value + step)} disabled={value >= max} label={`Increase ${label}`}><BtnText>+</BtnText></Btn>
    </View>
  );
}

export const s = StyleSheet.create({
  btnFace: { borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { fontFamily: F.display, color: C.ink },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.28)', paddingVertical: 5, paddingLeft: 6, paddingRight: 10, borderRadius: 999 },
  card: { backgroundColor: C.cream, borderRadius: R.lg, padding: 32, ...shadow },
  cardFlat: { backgroundColor: '#fff', borderRadius: R.lg, borderWidth: 1.5, borderColor: C.line, padding: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 15, borderRadius: 999, alignSelf: 'flex-start' },
  tagText: { fontFamily: F.head, fontSize: 16, letterSpacing: 0.7, textTransform: 'uppercase' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 11, paddingLeft: 13, paddingRight: 18,
    shadowColor: '#141228', shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  bar: { height: 14, borderRadius: 999, backgroundColor: C.cream2, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  col: { flexDirection: 'column', gap: 12 },
  h1: { fontFamily: F.display, fontSize: 72, lineHeight: 76, color: C.ink },
  h2: { fontFamily: F.display, fontSize: 44, lineHeight: 50, color: C.ink },
  h3: { fontFamily: F.display, fontSize: 26, lineHeight: 32, color: C.ink },
  p: { fontFamily: F.headSemi, fontSize: 20, lineHeight: 28, color: C.ink2 },
  small: { fontFamily: F.headSemi, fontSize: 16, lineHeight: 22, color: C.ink3 },
  num: { fontFamily: F.num, color: C.ink },
  b: { fontFamily: F.head, fontSize: 20, color: C.ink },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: C.line },
  sw: { width: 68, height: 40, borderRadius: 999, backgroundColor: '#DCD3C4' },
  knob: { position: 'absolute', top: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff' },
});
