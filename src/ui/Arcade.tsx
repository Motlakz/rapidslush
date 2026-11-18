'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
// The whole game screen: a fixed 1280×720 stage, letterboxed and scaled to fit any display (phone, tablet, TV, web).
// The Skia canvas draws the playfield; menus are React Native views laid out in the same stage units on top.
import { useEffect, useState } from 'react';
import { AppState, BackHandler, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { App, setStageLayout, goHome, keyDown, keyUp, onBackground, pauseRound, releaseAll, resumeRound } from '@/game/controller';
import GameCanvasHost from '@/game/GameCanvasHost';
import { layoutStage } from '@/game/layout';
import { show, useUI } from '@/game/ui-store';
import { flush } from '@/services/save';
import { Overlays, Toast } from './Overlays';
import { Btn } from './kit';
import { MIN_UI_SCALE } from './scale';
import { C, F } from './theme';


export function Arcade() {
  const { width, height } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  // Re-runs on every size change: rotation, iPad multitasking, a foldable opening or closing mid-round.
  const fit = layoutStage(width, height, ins), { portrait } = fit;
  useEffect(() => { setStageLayout(fit); });

  const tooSmall = !fit.playable;
  const reason = tooSmall ? (portrait ? 'portrait' : 'small') : null;
  const [dismissed, setDismissed] = useState<string | null>(null); // "Show anyway" applies to the shape it was pressed on
  useEffect(() => {
    if (tooSmall) onBackground(); // never let a round run on a screen too small to play it
  }, [tooSmall]);

  useKeyboard();
  useLifecycle();

  // Menus cover the whole window (so dimmed backdrops reach every edge, notches included) and scale by ui, never
  // by the stage fit — small text must stay at its designed point size on phones. See ui/scale.ts.
  const ui = Math.max(fit.scale, MIN_UI_SCALE);
  return (
    <View style={st.root}>
      <GameCanvasHost geo={{ ...fit, winW: width, winH: height }} />
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: width / ui, height: height / ui, overflow: 'hidden', transformOrigin: 'top left', transform: [{ scale: ui }] }}>
          <Overlays />
          <Toast />
        </View>
      </View>
      {reason && dismissed !== reason && <TooSmallNotice portrait={portrait} onDismiss={() => setDismissed(reason)} />}
    </View>
  );
}

/** Full-size (unscaled) notice for screens below the playable scale. "Show anyway" lets you look at the view. */
function TooSmallNotice({ portrait, onDismiss }: { portrait: boolean; onDismiss: () => void }) {
  const web = Platform.OS === 'web';
  return (
    <View style={st.notice}>
      <View style={st.noticeCard}>
        <Text style={st.noticeTitle}>{portrait ? 'Turn it sideways' : 'Need a bigger screen'}</Text>
        <Text style={st.noticeBody}>
          {portrait
            ? 'Rapid Slush plays across the width of the screen. Rotate your device to keep pouring.'
            : web ? 'This window is too small to play comfortably. Make it bigger to keep pouring.' : 'This window is too small to play comfortably. Give the app more of the screen to keep pouring.'}
        </Text>
        <Btn size="sm" onPress={onDismiss}>Show anyway</Btn>
      </View>
    </View>
  );
}

/** Keyboard play on web and on devices with hardware keys (A S D pour, Space send, F topping, Esc pause). */
function useKeyboard() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (keyDown(e.key, e.repeat)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keyUp(e.key);
    const blur = () => releaseAll();
    const vis = () => { if (document.hidden) onBackground(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
}

/** Backgrounding pauses the round and flushes the save; Android back walks out of panels and pauses play. */
function useLifecycle() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') { onBackground(); flush(); }
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      const o = useUI.getState().overlay;
      if (App.mode === 'round' && App.round && App.round.phase !== 'done') {
        if (App.paused) resumeRound(); else pauseRound();
        return true;
      }
      if (o.name === 'shop' && o.confirm) { show({ name: 'shop' }); return true; }
      if (o.name !== 'home') { goHome(); return true; }
      return false; // on Home, back leaves the app
    });
    return () => { sub.remove(); back.remove(); };
  }, []);
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.stageBg },
  notice: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23,21,42,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  noticeCard: { backgroundColor: C.cream, borderRadius: 24, padding: 24, gap: 12, maxWidth: 340, alignItems: 'flex-start' },
  noticeTitle: { fontFamily: F.display, fontSize: 30, lineHeight: 36, color: C.ink },
  noticeBody: { fontFamily: F.headSemi, fontSize: 18, lineHeight: 24, color: C.ink2 },
});
