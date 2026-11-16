// Local player save. Loaded once at boot, then read/written synchronously in memory and flushed to storage.
// In the backend phase (plan §9) wallet, ledger, sessions and progress move server-side; this file keeps
// only settings, cached state and local session-recovery data.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

import { ECON } from '@/game/content';
import type { Mode } from '@/engine';

export const SAVE_KEY = 'rapidslush.save.v1';
export const uid = () => randomUUID();

export type Currency = 'FREE_TOKEN' | 'PURCHASED_TOKEN' | 'COIN';
export interface LedgerRow { id: string; currency: Currency; amount: number; type: string; ref: string; at: number }
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED' | 'REFUNDED' | 'ABANDONED';
export interface Session {
  id: string; level: number; mode: Mode; status: SessionStatus; cost: number; fromFree: number; fromPaid: number;
  startedAt: number; endedAt?: number; elapsed: number; settlement?: { rewards: Rewards; plausible: boolean };
}
export interface Rewards {
  xp: number; coins: number; tokens: number; levelUp: boolean; unlocked: number | null;
  challenge: string | null; firstClear: boolean; spinUnlocked: boolean;
}
export interface Track { highest: number; stars: Record<number, number>; best: Record<number, number> }
export interface Settings {
  sound: boolean; haptics: boolean; reduced: boolean; sfxVol: number; pourVol: number; uiVol: number;
}
export interface Tune { accel: number; tol: number; dwell: number; cost: number; daily: number; infinite: boolean }

export interface Save {
  v: 1;
  playerId: string;
  createdAt: number;
  wallet: { free: number; purchased: number; coins: number };
  ledger: LedgerRow[];
  idem: Record<string, 1>;
  daily: { last: string | null };
  sessions: Record<string, Session>;
  progress: Track & { xp: number; rounds: number; perfect: number; spilled: number; spin?: Track };
  inv: { cups: string[]; skins: string[]; cup: string; skin: string };
  purchases: { txn: string; packId: string; tokens: number; bonus: number; at: number; status: 'VERIFIED' }[];
  settings: Settings;
  challenge: { day: string; id: string; progress: number; done: boolean } | null;
  flags: { firstPurchase: boolean; costNote: boolean; exhaustedOnce: boolean; coach: boolean; spinSeen?: boolean; glass?: number };
  stats: { fails: number; wins: number };
  lastOffer: number;
  machine?: Mode;
  tune: Tune;
}

export function freshSave(): Save {
  return {
    v: 1, playerId: uid(), createdAt: Date.now(), wallet: { free: 0, purchased: 0, coins: 0 }, ledger: [], idem: {},
    daily: { last: null }, sessions: {}, progress: { xp: 0, highest: 1, stars: {}, best: {}, rounds: 0, perfect: 0, spilled: 0 },
    inv: { cups: ['classic'], skins: ['copper'], cup: 'classic', skin: 'copper' }, purchases: [],
    settings: { sound: true, haptics: true, reduced: false, sfxVol: 0.8, pourVol: 0.6, uiVol: 0.5 }, challenge: null,
    flags: { firstPurchase: false, costNote: false, exhaustedOnce: false, coach: false }, stats: { fails: 0, wins: 0 }, lastOffer: 0,
    tune: { accel: 1, tol: 1, dwell: 1, cost: ECON.roundCost, daily: ECON.dailyFree, infinite: false },
  };
}

let SAVE: Save = freshSave();
let firstLaunch = true;
const listeners = new Set<() => void>();
let rev = 0;

export const save = () => SAVE;
export const isFirstLaunch = () => firstLaunch;
export const saveRev = () => rev;
export function subscribeSave(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export async function loadSave() {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Save) : null;
    if (parsed && parsed.v === 1) {
      const base = freshSave();
      SAVE = { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings }, flags: { ...base.flags, ...parsed.flags }, tune: { ...base.tune, ...parsed.tune } };
      firstLaunch = false;
    }
  } catch {
    // unreadable save: start fresh rather than crash at boot
  }
}

let flushT: ReturnType<typeof setTimeout> | null = null;
/** Mark the save changed: notify the UI now, write to storage shortly after (coalesced). */
export function persist() {
  rev++;
  listeners.forEach(fn => fn());
  if (flushT) return;
  flushT = setTimeout(flush, 250);
}
/** Write immediately (app backgrounding, round start: the session record must survive a kill). */
export function flush() {
  if (flushT) { clearTimeout(flushT); flushT = null; }
  AsyncStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)).catch(() => {});
}

// ---------- small mutations the UI is allowed to make (screens never write the save directly) ----------
export function updateSettings(p: Partial<Settings>) { Object.assign(SAVE.settings, p); persist(); }
export function updateTune(p: Partial<Tune>) { Object.assign(SAVE.tune, p); persist(); }
export function setFlag<K extends keyof Save['flags']>(k: K, v: Save['flags'][K]) { SAVE.flags[k] = v; persist(); }
export function setMachine(m: Mode) { SAVE.machine = m; persist(); }

export async function wipeSave() {
  await AsyncStorage.removeItem(SAVE_KEY);
  SAVE = freshSave();
  firstLaunch = true;
  persist();
}
