// HapticsManager + AudioManager (plan §3.6, §12.2).
// Sound effects are pre-rendered WAVs (scripts/gen-sfx.ts) played through expo-audio, fully loaded behind the
// loading screen (ui/Loading.tsx) before the game starts. Each effect has a small pool of players so rapid repeats
// overlap instead of cutting each other off; the pour is one looping player whose volume follows the flow.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { AppState, Platform } from 'react-native';

import { save } from './save';

export type Sfx =
  | 'serve' | 'perfect' | 'lap' | 'fail' | 'miss' | 'spill' | 'slide' | 'send' | 'topping' | 'clean'
  | 'tick' | 'count' | 'go' | 'coin' | 'win' | 'lose' | 'tap' | 'combo';

const FILES = {
  serve: require('../../assets/sfx/serve.wav'), perfect: require('../../assets/sfx/perfect.wav'),
  lap: require('../../assets/sfx/lap.wav'), fail: require('../../assets/sfx/fail.wav'), miss: require('../../assets/sfx/miss.wav'),
  spill_minor: require('../../assets/sfx/spill_minor.wav'), spill_moderate: require('../../assets/sfx/spill_moderate.wav'),
  spill_major: require('../../assets/sfx/spill_major.wav'), slide: require('../../assets/sfx/slide.wav'),
  send: require('../../assets/sfx/send.wav'), topping: require('../../assets/sfx/topping.wav'), clean: require('../../assets/sfx/clean.wav'),
  tick: require('../../assets/sfx/tick.wav'), count: require('../../assets/sfx/count.wav'), go: require('../../assets/sfx/go.wav'),
  coin: require('../../assets/sfx/coin.wav'), win: require('../../assets/sfx/win.wav'), lose: require('../../assets/sfx/lose.wav'),
  tap: require('../../assets/sfx/tap.wav'),
  combo1: require('../../assets/sfx/combo1.wav'), combo2: require('../../assets/sfx/combo2.wav'), combo3: require('../../assets/sfx/combo3.wav'),
  combo4: require('../../assets/sfx/combo4.wav'), combo5: require('../../assets/sfx/combo5.wav'), combo6: require('../../assets/sfx/combo6.wav'),
} as const;
const POUR = require('../../assets/sfx/pour_loop.wav');
type File = keyof typeof FILES;

/** Mix: relative level per file (the renders are peak-normalised; short clicks would otherwise dominate). */
const MIX: Partial<Record<File, number>> = {
  tick: 0.4, tap: 0.3, count: 0.55, go: 0.75, slide: 0.3, send: 0.45, lap: 0.55, miss: 0.55, topping: 0.6, clean: 0.6,
  spill_minor: 0.55, spill_moderate: 0.7, spill_major: 0.85, coin: 0.6, lose: 0.65, serve: 0.75, perfect: 0.8,
  combo1: 0.7, combo2: 0.7, combo3: 0.72, combo4: 0.74, combo5: 0.76, combo6: 0.78,
};
/** How many overlapping copies an effect may have. Kept small: every copy is a native player, and Android runs out of
 *  audio resources well before it runs out of memory. */
const VOICES: Partial<Record<File, number>> = { serve: 2, spill_minor: 2, slide: 2, tap: 2 };

const pools = new Map<File, { players: AudioPlayer[]; next: number }>();
let pour: AudioPlayer | null = null;
let pourVol = -1;
let loading: Promise<void> | null = null;
let lifecycle = false;

// Android plays game audio on the media stream whatever the ringer says (vibrate mode would otherwise mute every
// effect, so sound came and went with the phone's ringer). iOS keeps the convention: the silent switch silences it.
// Either way we mix with the player's own music instead of interrupting it.
const MODE = { playsInSilentMode: Platform.OS === 'android', interruptionMode: 'mixWithOthers' } as const;

/** Resolves once the player has decoded its file, or after `ms` so a bad file can never hold up the game. */
function whenLoaded(p: AudioPlayer, ms = 6000) {
  return new Promise<void>(resolve => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub.remove();
      resolve();
    };
    const sub = p.addListener('playbackStatusUpdate', st => { if (st.isLoaded) done(); });
    const timer = setTimeout(done, ms);
    if (p.isLoaded) done(); // already loaded before the listener attached
  });
}

/**
 * Native players outlive the JS runtime on Android: when the app is closed with Back the process survives and
 * expo-audio only stops them, so the next launch stacked a second full set on top and ran out of audio tracks:
 * sound worked on every other launch. We let go of every player whenever the app leaves the foreground (which
 * always comes before teardown) and load them again on return.
 */
function watchLifecycle() {
  if (lifecycle || Platform.OS === 'web') return;
  lifecycle = true;
  AppState.addEventListener('change', s => {
    if (s === 'background') Sound.release();
    else if (s === 'active') void Sound.load();
  });
}

function play(f: File) {
  const S = save().settings;
  if (!S.sound) return;
  const p = pools.get(f);
  if (!p) { void Sound.load(); return; } // released in the background and not back yet: skip, don't stall
  const pl = p.players[p.next];
  p.next = (p.next + 1) % p.players.length;
  pl.volume = Math.max(0, Math.min(1, S.sfxVol * (MIX[f] ?? 1)));
  pl.seekTo(0).catch(() => {});
  pl.play();
}

export const Sound = {
  /**
   * Create every player and wait until each one has decoded its file, so the first tap, countdown and Perfect are
   * on time. The loading screen awaits this; `onProgress` reports 0–1. Safe to call again: it shares the load in
   * flight, and after a release it loads afresh.
   */
  load(onProgress?: (f: number) => void): Promise<void> {
    watchLifecycle();
    if (loading) return loading;
    loading = (async () => {
      await setAudioModeAsync(MODE).catch(() => {});
      const all: AudioPlayer[] = [];
      for (const f of Object.keys(FILES) as File[]) {
        const players = Array.from({ length: VOICES[f] ?? 1 }, () => createAudioPlayer(FILES[f]));
        pools.set(f, { players, next: 0 });
        all.push(...players);
      }
      pour = createAudioPlayer(POUR);
      pour.loop = true;
      pour.volume = 0;
      all.push(pour);
      let n = 0;
      onProgress?.(0);
      await Promise.all(all.map(p => whenLoaded(p).then(() => onProgress?.(++n / all.length))));
    })();
    return loading;
  },
  /** Free every native player (app backgrounded). The next `load` builds them again. */
  release() {
    pools.forEach(p => p.players.forEach(pl => { try { pl.remove(); } catch {} }));
    pools.clear();
    if (pour) { try { pour.remove(); } catch {} }
    pour = null;
    pourVol = -1;
    loading = null;
  },
  sfx(name: Sfx, arg?: string) {
    if (name === 'spill') return play(arg === 'major' ? 'spill_major' : arg === 'moderate' ? 'spill_moderate' : 'spill_minor');
    if (name === 'combo') return play(`combo${Math.max(1, Math.min(6, Number(arg) || 1))}` as File);
    play(name);
  },
  /**
   * Pour fizz follows the total flow (0–~170 units/s across taps). The loop is never restarted mid-game: its volume
   * glides toward the target each frame and it only pauses after fading out, so there are no pops or clicks.
   */
  pour(total: number, _level: number) {
    const S = save().settings;
    const target = S.sound && total > 0 ? Math.min(0.38, total / 200) * S.pourVol : 0;
    const p = pour;
    if (!p) { if (target > 0) void Sound.load(); return; }
    pourVol = pourVol < 0 ? 0 : pourVol + (target - pourVol) * (target > pourVol ? 0.35 : 0.15); // quick in, gentle out
    if (pourVol < 0.003 && target === 0) {
      if (p.playing) { p.volume = 0; p.pause(); }
      pourVol = 0;
      return;
    }
    p.volume = pourVol;
    if (!p.playing) p.play(); // resumes where it paused (no seek), starting from near-silent
  },
};

export type Buzz = 'light' | 'medium' | 'heavy';
export function buzz(kind: Buzz) {
  if (!save().settings.haptics || Platform.OS === 'web') return;
  const style = kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(style).catch(() => {});
}
