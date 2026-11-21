// The loading screen between the native splash and the game: the app icon, come to life.
//  1. It opens on the splash's icon tile (same spot, same sky), which fades as the shack fills the screen and an
//     empty cup grows into a hero-sized drink standing on the counter.
//  2. A dispenser drops in under the awning and pours: the stream and its window change flavour layer by layer.
//  3. When the save and every sound have loaded (game/boot.ts), the slush dome and cherry pop on with a sparkle burst.
// The sky never sits still: the sun's rays turn, the cloud drifts, flavour badges float up, sparkles twinkle.
// The pour never runs ahead of the real loads, and audio is ready before the game starts.
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue,
  useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { FLAVOURS, type Flavour } from '@/engine';
import { FLAVOUR_ICONS, LEAF } from '@/game/render/iconData';
import { BRAND as B, MARK as M, SPLASH_DP, SPLASH_MARK_SCALE, splashTransform } from './brand';
import { C, F } from './theme';

const ARect = Animated.createAnimatedComponent(Rect);

const TIPS = ['Chilling the slush…', 'Tuning the fizz…', 'Stacking the cups…', 'Polishing the taps…'];
/** mark units → dp inside the splash square (the splash draws the mark centred on screen, SPLASH_DP square) */
const U = (SPLASH_MARK_SCALE * SPLASH_DP) / 512;
const sqX = (mx: number) => SPLASH_DP / 2 + (mx - M.center.x) * U;
const sqY = (my: number) => SPLASH_DP / 2 + (my - M.center.y) * U;
/** the cup's base: the pivot it grows from, and the point that lands on the counter */
const BASE = { x: sqX(256), y: sqY(M.fillBottom + 12) };
const RIM_Y = 172;
/** the stream falls left of the straw */
const STREAM_X = 222;
const STRIPE = 56;
/** the first-layer colours, bottom to top, matching MARK.layers (razz bottom, grape middle, berry top) */
const POUR = [{ until: 0.343, c: '#45C6F2' }, { until: 0.664, c: '#A78BFA' }, { until: 2, c: '#FF6B8A' }];

/**
 * Timeline (ms after the first frame is on screen): the tile hands over and the cup grows 0–650, the dispenser
 * drops 500–920, the pour runs 900–2200 (never ahead of the real loads), then the topping lands in 420.
 */
const INTRO_MS = 650;
const DROP_AT = 500;
const POUR_AT = 900;
const POUR_MS = 1300;
const TIP_MS = 1100;

/** Words under the counter: title, bar, tip. Short screens get a smaller title so all three always fit. */
const wordsLayout = (h: number) => {
  const size = h < 400 ? 26 : 32, line = size + 6, gap = 8;
  return { size, line, gap, height: line + gap + 18 + gap + 20 };
};

/**
 * `onReady` fires once the first frame (with the splash's icon tile) is on screen: hide the native splash then,
 * so the handover never flashes. `onDone` fires once the topping has landed: the game waits for it.
 */
export function Loading({ progress, onReady, onDone }: { progress: number; onReady: () => void; onDone: () => void }) {
  const { width: w, height: h } = useWindowDimensions();

  // ---- layout: the counter sits as low as the words under it allow; the cup is scaled so its rim and the
  //      dispenser fit under the awning ----
  const awningH = Math.round(Math.min(56, h * 0.11));
  const words = wordsLayout(h);
  const counterTop = Math.round(Math.min(h * 0.7, h - words.height - 30));
  const K = Math.max(1, Math.min(2.4, (counterTop - awningH - 100) / ((M.fillBottom + 12 - RIM_Y) * U)));
  const left0 = w / 2 - SPLASH_DP / 2, top0 = h / 2 - SPLASH_DP / 2;
  const dy = counterTop - (top0 + BASE.y);
  const X = (mx: number) => left0 + BASE.x + (sqX(mx) - BASE.x) * K;
  const Y = (my: number) => counterTop + (sqY(my) - BASE.y) * K;
  const rimY = Y(RIM_Y), headBottom = rimY - 36, streamX = X(STREAM_X), streamW = 20 * U * K;

  // ---- timeline ----
  const p = useSharedValue(0);       // real progress, smoothed
  const intro = useSharedValue(0);   // cup grows from the splash spot onto the counter
  const drop = useSharedValue(0);    // dispenser drops in
  const pourT = useSharedValue(0);   // the pour's own pace
  const pop = useSharedValue(0);     // dome + cherry land
  const fill = useDerivedValue(() => Math.min(p.value, pourT.value));

  // Nothing moves until the first frame, icon tile included, is actually on screen.
  const [laidOut, setLaidOut] = useState(false);
  const [tileLoaded, setTileLoaded] = useState(false);
  const ready = laidOut && tileLoaded;
  useEffect(() => { const t = setTimeout(() => setTileLoaded(true), 600); return () => clearTimeout(t); }, []); // never wait on the image forever
  useEffect(() => {
    if (!ready) return;
    onReady();
    intro.value = withTiming(1, { duration: INTRO_MS, easing: Easing.out(Easing.cubic) });
    drop.value = withDelay(DROP_AT, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    pourT.value = withDelay(POUR_AT, withTiming(1, { duration: POUR_MS, easing: Easing.inOut(Easing.quad) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the first frame is ready
  }, [ready]);
  useEffect(() => { p.value = withTiming(progress, { duration: 380 }); }, [progress, p]);

  // tips change on a steady beat, never faster than they can be read; "Order up!" waits for the topping
  const [tipN, setTipN] = useState(0);
  const [served, setServed] = useState(false);
  useEffect(() => {
    if (!ready || served) return;
    const id = setInterval(() => setTipN(n => n + 1), TIP_MS);
    return () => clearInterval(id);
  }, [ready, served]);
  useAnimatedReaction(() => fill.value >= 0.999, (done, was) => {
    if (done && !was) {
      scheduleOnRN(setServed, true);
      pop.value = withDelay(120, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }, fin => { if (fin) scheduleOnRN(onDone); }));
    }
  });

  // ---- animated styles ----
  const level = (v: number) => { 'worklet'; return M.fillBottom - v * (M.fillBottom - M.fillTop); };
  const flavourAt = (v: number) => { 'worklet'; return (POUR.find(s => v < s.until) ?? POUR[2]).c; };
  const glass = useAnimatedProps(() => ({ height: Math.max(0, level(fill.value) - 180) }));
  const surface = useAnimatedProps(() => ({ y: level(fill.value) - 4, opacity: fill.value > 0.02 && fill.value < 0.98 ? 0.7 : 0 }));
  const hero = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0.1, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: dy * intro.value }, { scale: 1 + (K - 1) * intro.value }],
  }));
  // the splash's icon tile, handing over to the scene
  const tile = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: 1 - 0.12 * intro.value }],
  }));
  const topping = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: (1 - pop.value) * -14 }, { scale: 0.85 + 0.15 * pop.value }],
  }));
  const head = useAnimatedStyle(() => ({
    transform: [{ translateY: (drop.value - 1) * (headBottom + 30) + interpolate(pop.value, [0, 1], [0, -(headBottom + 30)], Extrapolation.CLAMP) }],
  }));
  const windowDot = useAnimatedStyle(() => ({ backgroundColor: flavourAt(fill.value) }));
  const wob = useSharedValue(0);
  useEffect(() => { wob.value = withRepeat(withTiming(1, { duration: 360, easing: Easing.linear }), -1, false); }, [wob]);
  const stream = useAnimatedStyle(() => {
    const surf = rimY + (level(fill.value) - RIM_Y) * U * K;
    const pouring = drop.value > 0.9 && fill.value < 0.995 && pourT.value > 0;
    return {
      opacity: pouring ? 1 : 0,
      height: Math.max(0, surf - headBottom),
      backgroundColor: flavourAt(fill.value),
      transform: [{ scaleX: 1 + 0.05 * Math.sin(wob.value * Math.PI * 2) }],
    };
  });
  const bar = useAnimatedStyle(() => ({ width: `${Math.max(6, Math.round(fill.value * 100))}%` }));
  // the shack and the words come in with the cup, not on their own clock
  const scene = useAnimatedStyle(() => ({ opacity: interpolate(intro.value, [0, 0.6], [0, 1], Extrapolation.CLAMP) }));
  const wordsIn = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0.3, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: (1 - intro.value) * 8 }],
  }));

  const tip = served ? 'Order up!' : TIPS[tipN % TIPS.length];
  const sparkles = [
    { x: X(96), y: Y(150), s: 22, d: 0 }, { x: X(430), y: Y(236), s: 16, d: 350 }, { x: X(112), y: Y(372), s: 14, d: 700 },
    { x: X(420), y: Y(400), s: 20, d: 200 }, { x: X(70), y: Y(266), s: 12, d: 520 },
  ];

  return (
    <View style={st.root} onLayout={() => setLaidOut(true)}
      accessibilityRole="progressbar" accessibilityLabel="Loading Rapid Slush" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <Animated.View style={[StyleSheet.absoluteFill, scene]}>
        <Sky w={w} awningH={awningH} />
        <Counter w={w} h={h} top={counterTop} />
        <Props w={w} top={counterTop} room={counterTop - awningH} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, scene]}>
        <Floaters w={w} top={awningH + 24} bottom={counterTop - 16} />
      </Animated.View>

      <Animated.View style={[st.mark, { left: left0, top: top0, transformOrigin: `${BASE.x}px ${BASE.y}px` }, hero]}>
        <Svg width={SPLASH_DP} height={SPLASH_DP} viewBox="0 0 512 512">
          <Defs><ClipPath id="ldCup"><Path d={M.cup} /></ClipPath></Defs>
          <G transform={splashTransform}>
            <Path d={M.strawFull} stroke={B.ink} strokeWidth={50} strokeLinecap="round" />
            <Path d={M.strawFull} stroke={B.berry} strokeWidth={34} strokeLinecap="round" />
            <Path d={M.strawFullStripes} stroke={B.cream} strokeWidth={34} />
            <Path d={M.cup} fill={B.ink} stroke={B.ink} strokeWidth={24} strokeLinejoin="round" />
            <G clipPath="url(#ldCup)">
              {M.layers.map(l => <Path key={l.fill} d={l.d} fill={l.fill} />)}
              {M.seams.map(s => <Path key={s.stroke} d={s.d} stroke={s.stroke} strokeWidth={7} fill="none" />)}
              <ARect x={140} y={180} width={240} fill={B.glass} animatedProps={glass} />
              <ARect x={140} width={240} height={8} fill="#fff" animatedProps={surface} />
              <Path d={M.shine} fill="#fff" opacity={0.45} />
              <Circle cx={M.shineDot.cx} cy={M.shineDot.cy} r={M.shineDot.r} fill="#fff" opacity={0.45} />
            </G>
            <Rim />
          </G>
        </Svg>
        {/* dome + cherry pop on as one piece; the rim is drawn again on top so the dome sits inside it */}
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${sqX(256)}px ${sqY(196)}px` }, topping]}>
          <Svg width={SPLASH_DP} height={SPLASH_DP} viewBox="0 0 512 512">
            <G transform={splashTransform}>
              <Path d={M.dome} fill={B.ink} stroke={B.ink} strokeWidth={20} strokeLinejoin="round" />
              <Path d={M.dome} fill={B.mango} />
              <Path d={M.domeInner} fill={B.berry} />
              {M.domeShine.map((d, i) => <Path key={d} d={d} stroke="#FFEBBE" strokeWidth={i ? 10 : 12} strokeLinecap="round" fill="none" />)}
              <Rim />
              <Path d={M.stem} stroke={B.ink} strokeWidth={16} strokeLinecap="round" fill="none" />
              <Path d={M.stem} stroke={B.stem} strokeWidth={7} strokeLinecap="round" fill="none" />
              <Circle cx={M.cherry.cx} cy={M.cherry.cy} r={M.cherry.r} fill={B.cherry} stroke={B.ink} strokeWidth={10} />
              <Circle cx={M.cherryShine.cx} cy={M.cherryShine.cy} r={M.cherryShine.r} fill="#FFC2CF" />
            </G>
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* in front of the glass, so the stream reads as pouring into it. Dispenser: a chrome pipe down from the awning, a head with a flavour window, a spout */}
      <Animated.View style={[st.dispenser, { left: streamX - 40, height: headBottom }, head]}>
        <View style={[st.pipe, { bottom: 44 }]} />
        <View style={st.head}><Animated.View style={[st.window, windowDot]} /></View>
        <View style={st.spout} />
      </Animated.View>
      <Animated.View style={[st.stream, { left: streamX - streamW / 2, top: headBottom - 2, width: streamW, borderRadius: streamW / 2 }, stream]} />

      <Animated.View pointerEvents="none" style={[st.mark, { left: left0, top: top0 }, tile]}>
        <Image source={require('../../assets/images/splash-icon.png')} style={{ width: SPLASH_DP, height: SPLASH_DP }}
          onLoad={() => setTileLoaded(true)} onError={() => setTileLoaded(true)} />
      </Animated.View>
      {sparkles.map((s, k) => <Sparkle key={k} {...s} intro={intro} pop={pop} />)}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, scene]}><Awning w={w} h={awningH} /></Animated.View>

      <Animated.View style={[st.words, { top: counterTop + 16, gap: words.gap }, wordsIn]}>
        <Text style={[st.title, { fontSize: words.size, lineHeight: words.line }]}>Rapid Slush</Text>
        <View style={st.track}>
          <Animated.View style={[st.fill, bar]}><CandyStripes /></Animated.View>
        </View>
        <Text style={st.tip}>{tip}</Text>
      </Animated.View>
    </View>
  );
}

function Rim() {
  return <Rect x={M.rim.x} y={M.rim.y} width={M.rim.w} height={M.rim.h} rx={M.rim.r} fill={B.cream} stroke={B.ink} strokeWidth={12} />;
}

/** Sun with slowly turning rays and a drifting cloud. */
function Sky({ w, awningH }: { w: number; awningH: number }) {
  const spin = useSharedValue(0), drift = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1, false);
    drift.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [spin, drift]);
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const cloud = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * 46 }] }));
  const sx = w - 100, sy = awningH + 74, R = 120;
  return (
    <>
      <Animated.View style={[st.abs, { left: sx - R, top: sy - R, width: R * 2, height: R * 2 }, rays]}>
        <Svg width={R * 2} height={R * 2}>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2, d = Math.PI / 24;
            return <Path key={k} d={`M${R} ${R} L${R + Math.cos(a - d) * R} ${R + Math.sin(a - d) * R} L${R + Math.cos(a + d) * R} ${R + Math.sin(a + d) * R} Z`} fill="#fff" opacity={0.45} />;
          })}
        </Svg>
      </Animated.View>
      <Svg style={st.abs} width={w} height={sy + 80}>
        <Circle cx={sx} cy={sy} r={58} fill={B.halo} />
        <Circle cx={sx} cy={sy} r={38} fill={B.sun} stroke={B.ink} strokeWidth={5} />
      </Svg>
      <Animated.View style={[st.abs, { left: Math.max(12, w * 0.08), top: awningH + 18 }, cloud]}>
        <Svg width={120} height={60} viewBox="50 160 130 70">
          <Path d="M60 196 a24 24 0 0 1 40 -18 a30 30 0 0 1 54 6 a20 20 0 0 1 14 34 H70 a20 20 0 0 1 -10 -22 Z" fill={B.cloud} stroke={B.ink} strokeWidth={6} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </>
  );
}

function Counter({ w, h, top }: { w: number; h: number; top: number }) {
  return (
    <Svg style={st.abs} width={w} height={h}>
      <Rect x={-4} y={top} width={w + 8} height={h - top + 4} fill={B.wood} stroke={B.ink} strokeWidth={4} />
      <Rect x={0} y={top + 2} width={w} height={9} fill={B.woodLip} />
      <Path d={`M0 ${top + 11} H${w}`} stroke={B.ink} strokeWidth={3} />
      {/* plank seams kept to the edges, clear of the title */}
      <Path d={`M${w * 0.08} ${top + 11} V${h} M${w * 0.92} ${top + 11} V${h}`} stroke={B.woodLine} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Shack props standing on the counter, from the game's own scene: a stack of cups and the MENU chalkboard. */
function Props({ w, top, room }: { w: number; top: number; room: number }) {
  if (w < 560 || room < 170) return null; // narrow or short screens: keep the counter clear
  const s = Math.max(0.75, Math.min(1.35, room / 280));
  const cw = 62 * s, ch = 78 * s;
  return (
    <>
      <View style={[st.abs, { left: w * 0.2 - cw / 2, top: top - ch * 1.5 + 4 }]}>
        <Svg width={cw} height={ch * 1.5} viewBox="0 0 62 117">
          {[0, 1, 2].map(k => (
            <G key={k} transform={`translate(0 ${k * 19.5})`}>
              <Path d="M6 8 L14 76 Q15 80 19 80 H43 Q47 80 48 76 L56 8 Z" fill={B.glass} stroke={B.ink} strokeWidth={3} strokeLinejoin="round" />
              <Rect x={3} y={4} width={56} height={9} rx={4.5} fill={B.cream} stroke={B.ink} strokeWidth={3} />
              <Path d="M14 18 L19 64" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
            </G>
          ))}
        </Svg>
      </View>
      <View style={[st.board, { left: w * 0.8 - 66 * s, top: top - 104 * s, width: 132 * s, height: 104 * s, padding: 6 * s }]}>
        <View style={st.boardInner}>
          <Text style={st.boardTitle}>MENU</Text>
          <View style={st.boardRow}>{FLAVOURS.slice(0, 4).map(f => <Badge key={f.id} f={f} size={Math.round(24 * s)} />)}</View>
        </View>
      </View>
    </>
  );
}

/** The striped, scalloped awning, in front of the dispenser pipe. */
function Awning({ w, h }: { w: number; h: number }) {
  const n = Math.ceil(w / STRIPE) + 1, sr = STRIPE / 2;
  return (
    <Svg style={st.abs} width={w} height={h + sr}>
      {Array.from({ length: n }, (_, i) => (
        <Path key={i} d={`M${i * STRIPE} -4 H${(i + 1) * STRIPE} V${h} A${sr} ${sr - 6} 0 0 1 ${i * STRIPE} ${h} Z`}
          fill={i % 2 ? B.cream : B.awning} stroke={B.ink} strokeWidth={4} strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

/** A four-point glint that twinkles on its own beat, and flares when the topping lands. */
function Sparkle({ x, y, s, d, intro, pop }: { x: number; y: number; s: number; d: number; intro: SharedValue<number>; pop: SharedValue<number> }) {
  const tw = useSharedValue(0);
  useEffect(() => {
    tw.value = withDelay(d, withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.sin) })), -1, false));
  }, [tw, d]);
  const style = useAnimatedStyle(() => {
    const burst = interpolate(pop.value, [0, 0.5, 1], [0, 0.35, 0.15], Extrapolation.CLAMP);
    return {
      opacity: intro.value * Math.min(1, 0.25 + tw.value * 0.75 + burst),
      transform: [{ scale: 0.8 + tw.value * 0.2 + burst }],
    };
  });
  return (
    <Animated.View style={[st.abs, { left: x - s / 2, top: y - s / 2, width: s, height: s }, style]}>
      <Svg width={s} height={s} viewBox="-11 -11 22 22">
        <Path d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z" fill="#fff" stroke={B.ink} strokeWidth={1.6} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

/** Flavour badges drifting up through the sky behind the cup, each on its own slow loop. */
function Floaters({ w, top, bottom }: { w: number; top: number; bottom: number }) {
  // sized to the sky they drift through, and fewer on narrow screens, so small phones never look crowded
  const scale = Math.max(0.62, Math.min(1, (bottom - top) / 380));
  const xs = w < 700 ? [0.07, 0.22, 0.78, 0.93] : [0.06, 0.17, 0.28, 0.38, 0.62, 0.72, 0.83, 0.94];
  const items = useMemo(() => xs.map((fx, k) => ({
    x: fx * w, size: Math.round((40 + (k % 3) * 8) * scale), f: FLAVOURS[k % 5], dur: 4600 + (k % 4) * 900, phase: (k * 0.29) % 1,
  })), [w, scale, xs.length]); // eslint-disable-line react-hooks/exhaustive-deps -- xs is derived from w
  if (bottom - top < 60) return null; // a very short screen: no room for them to drift
  return <>{items.map((it, k) => <Floater key={k} {...it} top={top} bottom={bottom} />)}</>;
}

function Floater({ x, size, f, dur, phase, top, bottom }: { x: number; size: number; f: Flavour; dur: number; phase: number; top: number; bottom: number }) {
  const t = useSharedValue(phase);
  useEffect(() => {
    // finish the first lap from its staggered start, then loop from the bottom
    t.value = withTiming(1, { duration: dur * (1 - phase), easing: Easing.linear }, () => {
      t.value = 0;
      t.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1, false);
    });
  }, [t, dur, phase]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.12, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: x - size / 2 + Math.sin(t.value * Math.PI * 2) * 6 },
      { translateY: bottom - t.value * (bottom - top) - size / 2 },
      { rotate: `${Math.sin(t.value * Math.PI * 2) * 5}deg` },
    ],
  }));
  return (
    <Animated.View style={[st.floater, { width: size, height: size }, style]}>
      <Badge f={f} size={size} />
    </Animated.View>
  );
}

/** The in-game flavour badge (game/render/icons.ts flavourBadge), drawn with react-native-svg. */
function Badge({ f, size }: { f: Flavour; size: number }) {
  const I = FLAVOUR_ICONS[f.id];
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={17.2} r={14.5} fill="rgba(37,35,58,.22)" />
      <Circle cx={16} cy={16} r={14.5} fill="#fff" stroke={f.color} strokeWidth={2.6} />
      <G transform="translate(4 4)" strokeLinecap="round" strokeLinejoin="round">
        <Path d={I.body} fill={f.color} />
        {I.detail && <Path d={I.detail} stroke={f.light} strokeWidth={1.2} fill="none" />}
        <Path d={I.body} stroke={C.ink} strokeWidth={1.8} fill="none" />
        {I.stems && <Path d={I.stems} stroke={C.ink} strokeWidth={1.8} fill="none" />}
        {I.leaf && <Path d={I.leaf} fill={LEAF} stroke={C.ink} strokeWidth={1.8} />}
      </G>
    </Svg>
  );
}

/** Cream diagonal stripes sliding along the bar's berry fill. */
function CandyStripes() {
  const slide = useSharedValue(0);
  useEffect(() => { slide.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.linear }), -1, false); }, [slide]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -24 + slide.value * 24 }] }));
  return (
    <Animated.View style={[st.stripes, style]}>
      <Svg width={300} height={18}>
        {Array.from({ length: 13 }, (_, k) => <Path key={k} d={`M${k * 24} 18 L${k * 24 + 10} 18 L${k * 24 + 22} 0 L${k * 24 + 12} 0 Z`} fill={C.cream} opacity={0.4} />)}
      </Svg>
    </Animated.View>
  );
}

const CHROME = '#D7DEE6';
const st = StyleSheet.create({
  root: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: B.sky, overflow: 'hidden' },
  abs: { position: 'absolute', left: 0, top: 0 },
  mark: { position: 'absolute', width: SPLASH_DP, height: SPLASH_DP }, // starts exactly where the native splash drew it
  floater: { position: 'absolute', left: 0, top: 0 },
  dispenser: { position: 'absolute', top: 0, width: 80 },
  pipe: { position: 'absolute', top: -10, left: 33, width: 14, backgroundColor: CHROME, borderColor: C.ink, borderLeftWidth: 3, borderRightWidth: 3 },
  head: {
    position: 'absolute', bottom: 10, left: 0, width: 80, height: 38, borderRadius: 14, backgroundColor: C.cream,
    borderWidth: 3, borderColor: C.ink, alignItems: 'center', justifyContent: 'center',
  },
  window: { width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: C.ink },
  spout: { position: 'absolute', bottom: 0, left: 30, width: 20, height: 14, borderRadius: 4, backgroundColor: '#9AA6B6', borderWidth: 3, borderColor: C.ink },
  stream: { position: 'absolute', borderWidth: 2.5, borderColor: C.ink },
  board: { position: 'absolute', backgroundColor: '#9A5A32', borderRadius: 10, borderWidth: 3, borderColor: C.ink },
  boardInner: { flex: 1, backgroundColor: '#2E3B36', borderRadius: 6, alignItems: 'center', justifyContent: 'center', gap: 6 },
  boardTitle: { fontFamily: F.display, fontSize: 18, lineHeight: 22, color: '#F4F1E6' },
  boardRow: { flexDirection: 'row', gap: 3 },
  words: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontFamily: F.display, color: C.ink },
  track: { width: 240, height: 18, borderRadius: 9, borderWidth: 3, borderColor: C.ink, backgroundColor: C.cream, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.berry, overflow: 'hidden' },
  stripes: { position: 'absolute', left: 0, top: 0, width: 300, height: 18 },
  tip: { fontFamily: F.headSemi, fontSize: 16, lineHeight: 20, color: C.ink2 },
});
