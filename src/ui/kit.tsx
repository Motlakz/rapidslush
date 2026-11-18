// UI kit matching the prototype's CSS components (.btn, .card, .tag, .pill, .bar). Sizes are stage units.
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Sound } from '@/services/feedback';
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
  const T = TONES[tone], depth = flat ? 0 : size === 'sm' ? 6 : 8;
  const pad = size === 'big' ? { paddingVertical: 26, paddingHorizontal: 40 } : size === 'sm' ? { paddingVertical: 14, paddingHorizontal: 22 } : { paddingVertical: 20, paddingHorizontal: 32 };
  const font = size === 'big' ? 28 : size === 'sm' ? 18 : 22;
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
              icon ? { width: size === 'sm' ? 68 : 72, height: size === 'sm' ? 68 : 72, padding: 0 } : pad,
            ]}
          >
            {typeof children === 'string' ? <Text style={[s.btnText, { color: T.t, fontSize: font }]}>{children}</Text> : children}
          </View>
        </>
      )}
    </Pressable>
  );
}

export function BtnText({ children, tone = 'default', size = 'md' }: { children: ReactNode; tone?: Tone; size?: 'big' | 'md' | 'sm' }) {
  return <Text style={[s.btnText, { color: TONES[tone].t, fontSize: size === 'big' ? 28 : size === 'sm' ? 18 : 22 }]}>{children}</Text>;
}

/** The token-cost chip inside a Play/Start button. */
export function CostChip({ cost, children, tone = 'berry' }: { cost: number; children?: ReactNode; tone?: Tone }) {
  const light = TONES[tone].t !== '#fff'; // light button: ink text on a faint ink chip
  return (
    <View style={[s.cost, light && { backgroundColor: 'rgba(37,35,58,0.08)' }]}>
      {children}
      <Text style={[s.num, { fontSize: 22, color: TONES[tone].t }]}>{cost ? cost : 'Free'}</Text>
    </View>
  );
}

export function Card({ children, style, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  return <View style={[flat ? s.cardFlat : s.card, style]}>{children}</View>;
}

type TagTone = 'default' | 'berry' | 'lime' | 'mango' | 'grape' | 'razz';
const TAGS: Record<TagTone, [string, string]> = {
  default: [C.cream2, C.ink2], berry: ['#FFE0E7', '#B42A50'], lime: ['#E8F5D2', '#4A6E17'],
  mango: ['#FFF0CC', '#8A5A00'], grape: ['#ECE5FF', '#5636B8'], razz: ['#DDF4FD', '#0F6A91'],
};
export function Tag({ tone = 'default', children, icon }: { tone?: TagTone; children: ReactNode; icon?: ReactNode }) {
  const [bg, fg] = TAGS[tone];
  return (
    <View style={[s.tag, { backgroundColor: bg, paddingVertical: 7, paddingHorizontal: 15 }]}>
      {icon}
      <Text style={[s.tagText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function Pill({ children, onPress, label }: { children: ReactNode; onPress?: () => void; label?: string }) {
  const body = <View style={s.pill}>{children}</View>;
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

export const H1 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.h2, style]}>{children}</Text>;
export const H3 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.h3, style]}>{children}</Text>;
export const P = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.p, style]}>{children}</Text>;
export const Small = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.small, style]}>{children}</Text>;
export const Num = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.num, style]}>{children}</Text>;
export const B = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[s.b, style]}>{children}</Text>;

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
