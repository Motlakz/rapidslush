// Which menu panel is over the stage. The arcade is one persistent canvas (attract mode plays behind the menus),
// so menus are panels on the stage rather than separate routes.
import { create } from 'zustand';

import type { Mode, RoundResult } from '@/engine';
import type { PackId } from '@/game/content';
import type { Rewards } from '@/services/save';

export type Overlay =
  | { name: 'none' }
  | { name: 'home' }
  | { name: 'intro'; n: number; m: Mode }
  | { name: 'levels'; m: Mode }
  | { name: 'pause' }
  | { name: 'results'; res: RoundResult; rw: Partial<Rewards> }
  | { name: 'offer'; short: number; n: number; m: Mode }
  | { name: 'shop'; confirm?: PackId; back?: Overlay }
  | { name: 'wallet' }
  | { name: 'collection' }
  | { name: 'settings' };

interface UIState {
  overlay: Overlay;
  toast: { s: string; id: number } | null;
  show: (o: Overlay) => void;
  toastMsg: (s: string) => void;
}

let toastId = 0;
export const useUI = create<UIState>(set => ({
  overlay: { name: 'none' },
  toast: null,
  show: overlay => set({ overlay }),
  toastMsg: s => {
    const id = ++toastId;
    set({ toast: { s, id } });
    setTimeout(() => { if (useUI.getState().toast?.id === id) set({ toast: null }); }, 2200);
  },
}));

export const show = (o: Overlay) => useUI.getState().show(o);
export const toast = (s: string) => useUI.getState().toastMsg(s);
