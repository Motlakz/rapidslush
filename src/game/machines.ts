// The machines in the shack: one place for what each is called, when it opens, its level list and how it plays.
// Screens and the controller read this instead of branching on the machine, so a new machine is one entry here
// plus its engine module and renderer.
import {
  BLEND, BLEND_CHAPTERS, BLEND_SCHEDULE, CHAPTERS, MAX_LEVEL, SCHEDULE, SPIN, SPIN_CHAPTERS, SPIN_SCHEDULE, type Mode,
} from '@/engine';

export interface MachineInfo {
  id: Mode;
  name: string;
  /** "Level 12", "Spin 12", "Blend 12" */
  short: string;
  tone: 'berry' | 'razz' | 'lime';
  /** opens once this Slush Line level is beaten (0: open from the start) */
  unlockAt: number;
  max: number;
  schedule: readonly { n: number; isNew: string }[];
  chapters: readonly string[];
  /** one line under the intro card */
  howTo: string;
  /** keyboard line (desktop web) */
  keys: string;
  /** results screen, when the quota was missed */
  failHint: string;
}

export const MACHINE: Record<Mode, MachineInfo> = {
  belt: {
    id: 'belt', name: 'Slush Line', short: 'Level', tone: 'berry', unlockAt: 0, max: MAX_LEVEL,
    schedule: SCHEDULE, chapters: CHAPTERS,
    howTo: 'Hold the tap buttons to pour and swipe the counter to clean.',
    keys: 'Keys: A S D pour · Space sends · F topping · Esc pauses.',
    failHint: 'Tap SEND as soon as the cups are full to keep the belt moving.',
  },
  spin: {
    id: 'spin', name: 'Spin Bar', short: 'Spin', tone: 'razz', unlockAt: SPIN.UNLOCK, max: SPIN.MAX_LEVEL,
    schedule: SPIN_SCHEDULE, chapters: SPIN_CHAPTERS,
    howTo: 'Hold a flavour button while the cup is in the lit window.',
    keys: 'Keys: A S D F G pour · Space topping · Esc pauses.',
    failHint: 'Pick the flavour before the cup reaches the window, so every pass counts.',
  },
  blend: {
    id: 'blend', name: 'Blend Station', short: 'Blend', tone: 'lime', unlockAt: BLEND.UNLOCK, max: BLEND.MAX_LEVEL,
    schedule: BLEND_SCHEDULE, chapters: BLEND_CHAPTERS,
    howTo: 'Tap flavours into the jar, hold BLEND to the smooth band, hold POUR to the line, then SERVE.',
    keys: 'Keys: A S D F flavours · J blend · K pour · Space serves · T topping · Esc pauses.',
    failHint: 'Let go of BLEND a little before the band: the blade keeps turning for a moment.',
  },
};

/** The order machines appear in on Home and the level list. */
export const MACHINE_ORDER: Mode[] = ['belt', 'spin', 'blend'];
