// Local game service: an immutable coin ledger, idempotency keys on every mutation, lives taken at round start and
// handed back on a win, settlement with plausibility checks. Runs on-device against the save; the same contract can
// move behind an API later.
import { CHALLENGES, CUPS, LIVES, SKINS, playerLevel } from '@/game/content';
import { BLEND, MAX_LEVEL, SPIN, type Mode, type RoundResult } from '@/engine';
import { MACHINE, MACHINE_ORDER } from '@/game/machines';
import { SHACKS } from '@/game/shacks';
import { track } from './analytics';
import { flush, persist, save, uid, type Currency, type Lives, type Rewards, type Session, type Track } from './save';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Each machine keeps its own level track; the Slush Line's is the progress record itself. */
export const trackOf = (m: Mode): Track => {
  const P = save().progress;
  if (m === 'belt') return P;
  return P[m] ?? (P[m] = { highest: 1, stars: {}, best: {} });
};
export const maxFor = (m: Mode) => MACHINE[m].max;
/** Machines open as the Slush Line is beaten: the Spin Bar after level 15, the Blend Station after level 30. */
export const machineOpen = (m: Mode) => save().progress.highest > MACHINE[m].unlockAt;
export const spinUnlocked = () => machineOpen('spin');
/** The machine to show on Home: the last one played, if it is open. */
export const currentMachine = (): Mode => {
  const m = save().machine;
  return m && machineOpen(m) ? m : 'belt';
};
/** Dev tuning panel only. */
export function unlockAll() {
  save().progress.highest = MAX_LEVEL; trackOf('spin').highest = SPIN.MAX_LEVEL; trackOf('blend').highest = BLEND.MAX_LEVEL; persist();
}

/**
 * Lives right now from the stored snapshot, without writing anything (safe to call while rendering). A clock wound
 * back restarts the refill wait; winding it forward only cheats the cheater's own single-player game.
 */
export function livesAt(L: Lives, now = Date.now()) {
  const stamp = now < L.lastSeen - LIVES.rewindSlackMs ? now : L.stamp;
  if (L.n >= LIVES.max) return { n: L.n, stamp: now, nextAt: 0 };
  const gained = Math.max(0, Math.floor((now - stamp) / LIVES.refillMs));
  const n = Math.min(LIVES.max, L.n + gained);
  const next = n >= LIVES.max ? now : stamp + gained * LIVES.refillMs;
  return { n, stamp: next, nextAt: n >= LIVES.max ? 0 : next + LIVES.refillMs };
}

/** Fold refills earned so far into the save, then apply `delta` (-1 spend, +1 refund). */
function settleLives(delta = 0) {
  const S = save(), now = Date.now(), cur = livesAt(S.lives, now);
  const wasFull = cur.n >= LIVES.max;
  const n = Math.max(0, Math.min(LIVES.max, cur.n + delta));
  // a full bar has no countdown: the wait for the next life starts when the first one is spent
  S.lives = { n, stamp: wasFull || n >= LIVES.max ? now : cur.stamp, lastSeen: Math.max(now, Math.min(S.lives.lastSeen, now + LIVES.rewindSlackMs)) };
}

export const Server = {
  /** Lives now: count, when the next one arrives (0 when full), and whether lives are switched off (dev). */
  lives() {
    const S = save(), cur = livesAt(S.lives);
    return { n: cur.n, max: LIVES.max, nextAt: cur.nextAt, unlimited: S.tune.infinite };
  },
  /** A round on a level not beaten yet risks a life; replaying a beaten level is always free. */
  atRisk(level: number, mode: Mode) { return !save().tune.infinite && !(trackOf(mode).stars[level] > 0); },
  /** Fill every heart with coins earned in play. */
  refillLives() {
    const S = save(), cur = livesAt(S.lives);
    if (cur.n >= LIVES.max) return { ok: false as const, error: 'FULL' as const };
    if (S.wallet.coins < LIVES.refillCoins) return { ok: false as const, error: 'COINS' as const };
    this.ledger('COIN', -LIVES.refillCoins, 'LIFE_REFILL', 'lives', 'refill:' + uid());
    settleLives(LIVES.max);
    persist();
    track('lives_refilled', { from: cur.n, coins: LIVES.refillCoins });
    return { ok: true as const };
  },
  /** Dev tuning panel only. */
  devRefill() { settleLives(LIVES.max); persist(); },

  ledger(currency: Currency, amount: number, type: string, ref: string, key: string) {
    const S = save();
    if (S.idem[key]) return false;
    S.idem[key] = 1;
    S.ledger.push({ id: uid().slice(0, 8), currency, amount, type, ref, at: Date.now() });
    if (S.ledger.length > 300) S.ledger.splice(0, S.ledger.length - 300);
    S.wallet.coins += amount;
    return true;
  },

  /**
   * Session recovery: an ACTIVE session found at boot was interrupted. If it barely began (a crash, not a dodge),
   * its life comes back; otherwise it counts as a loss, like quitting.
   */
  bootstrap() {
    const S = save();
    let refunded = 0;
    for (const s of Object.values(S.sessions)) {
      if (s.status !== 'ACTIVE') continue;
      if ((s.elapsed || 0) < 5) {
        s.status = 'REFUNDED';
        if (s.life) { settleLives(1); refunded++; }
      } else s.status = 'INTERRUPTED';
    }
    const d = today();
    if (!S.challenge || S.challenge.day !== d) {
      const pool = CHALLENGES.filter(c => !c.minLevel || S.progress.highest >= c.minLevel);
      const h = [...d].reduce((a, ch) => ((a * 31 + ch.charCodeAt(0)) >>> 0), 7);
      S.challenge = { day: d, id: pool[h % pool.length].id, progress: 0, done: false };
    }
    persist();
    return { refunded };
  },

  startSession(level: number, mode: Mode, idemKey: string):
    | { ok: true; session: Session }
    | { ok: false; error: 'NO_LIVES'; nextAt: number } {
    const S = save();
    if (S.sessions[idemKey]) return { ok: true, session: S.sessions[idemKey] };
    const life = this.atRisk(level, mode);
    if (life) {
      const cur = this.lives();
      if (cur.n <= 0) return { ok: false, error: 'NO_LIVES', nextAt: cur.nextAt };
      settleLives(-1);
      track('life_spent', { level, machine: mode, left: S.lives.n });
    }
    const s: Session = { id: idemKey, level, mode, status: 'ACTIVE', life, startedAt: Date.now(), elapsed: 0 };
    S.sessions[idemKey] = s;
    const ids = Object.keys(S.sessions);
    if (ids.length > 25) delete S.sessions[ids[0]];
    persist(); flush(); // the reservation must survive a crash
    return { ok: true, session: s };
  },

  heartbeat(id: string, elapsed: number) {
    const s = save().sessions[id];
    if (s && s.status === 'ACTIVE') { s.elapsed = elapsed; persist(); }
  },

  abandon(id: string) {
    const s = save().sessions[id];
    if (s && s.status === 'ACTIVE') { s.status = 'ABANDONED'; persist(); }
  },

  completeSession(id: string, res: RoundResult): { ok: boolean; rewards?: Rewards; plausible?: boolean; replay?: boolean; error?: string } {
    const S = save(), s = S.sessions[id];
    if (!s) return { ok: false, error: 'UNKNOWN_SESSION' };
    if (s.status !== 'ACTIVE') return s.settlement ? { ok: true, ...s.settlement, replay: true } : { ok: false, error: 'NOT_ACTIVE' };
    // plausibility checks (plan §11.2)
    const plausible = res.score <= res.served * 1500 + 2000 && res.elapsed >= res.served * 0.5;
    const P = S.progress, T = trackOf(res.mode), maxL = maxFor(res.mode), mk = res.mode === 'belt' ? '' : res.mode + ':';
    const rewards: Rewards = { xp: 0, coins: 0, lives: 0, lifeBack: false, levelUp: false, unlocked: null, challenge: null, firstClear: false, opened: null };
    // a win hands back the life the round took
    if (res.win && s.life) { settleLives(1); rewards.lifeBack = true; track('life_refunded', { level: res.level, machine: res.mode }); }
    if (plausible) {
      rewards.xp = res.win ? 20 + (res.stars === 3 ? 15 : 0) : 5;
      const roundCoins = res.served * 3 + res.stars * 10;
      rewards.coins += roundCoins;
      const prevStars = T.stars[res.level] || 0;
      if (res.win && !prevStars) {
        rewards.firstClear = true;
        if (res.level % 5 === 0 && this.ledger('COIN', LIVES.milestoneCoins, 'MILESTONE', mk + 'L' + res.level, 'milestone:' + mk + res.level)) {
          rewards.coins += LIVES.milestoneCoins;
        }
      }
      T.stars[res.level] = Math.max(prevStars, res.stars);
      T.best[res.level] = Math.max(T.best[res.level] || 0, res.score);
      if (res.win && res.level + 1 > T.highest && res.level < maxL) { T.highest = res.level + 1; rewards.unlocked = res.level + 1; }
      for (const m of MACHINE_ORDER) { // a machine this win opened, announced once
        const seen = m === 'spin' ? 'spinSeen' : m === 'blend' ? 'blendSeen' : null;
        if (seen && machineOpen(m) && !S.flags[seen]) { S.flags[seen] = true; rewards.opened = m; }
      }
      P.rounds++; P.perfect += res.perfect; P.spilled += res.waste;
      const lvBefore = playerLevel(P.xp).level;
      P.xp += rewards.xp;
      rewards.levelUp = playerLevel(P.xp).level > lvBefore;
      this.ledger('COIN', roundCoins, 'ROUND_REWARD', s.id, 'coins:' + s.id);
      // daily challenge
      const ch = S.challenge, def = ch && CHALLENGES.find(c => c.id === ch.id);
      if (ch && def && !ch.done) {
        const inc = {
          perfect: res.perfect, served: res.served, layered: res.orders.layered,
          cleanWin: res.win && res.spillCount === 0 ? 1 : 0, fastWin: res.win && res.timeLeft >= 15 ? 1 : 0,
        }[def.key] || 0;
        ch.progress = Math.min(def.goal, ch.progress + inc);
        if (ch.progress >= def.goal) {
          ch.done = true; rewards.challenge = def.text;
          this.ledger('COIN', LIVES.challengeCoins, 'CHALLENGE', ch.day, 'challenge-coins:' + ch.day);
          settleLives(1);
          P.xp += 50; rewards.lives += 1; rewards.coins += LIVES.challengeCoins; rewards.xp += 50;
        }
      }
    }
    if (res.win) { S.stats.wins++; S.stats.fails = 0; } else S.stats.fails++;
    s.status = res.win ? 'COMPLETED' : 'FAILED'; s.endedAt = Date.now();
    s.settlement = { rewards, plausible };
    persist(); flush();
    return { ok: true, rewards, plausible };
  },

  buyItem(kind: 'cups' | 'skins' | 'shacks', id: string) {
    const S = save(), list: { id: string; price: number }[] = kind === 'cups' ? CUPS : kind === 'skins' ? SKINS : SHACKS;
    const it = list.find(x => x.id === id);
    if (!it || S.inv[kind].includes(id)) return { ok: false };
    if (S.wallet.coins < it.price) return { ok: false, error: 'COINS' };
    this.ledger('COIN', -it.price, 'ITEM_UNLOCK', id, 'item:' + kind + ':' + id);
    S.inv[kind].push(id);
    persist();
    track('item_unlocked', { kind, id });
    return { ok: true };
  },

  /** Dev tuning panel only. */
  devCoins(n: number) { this.ledger('COIN', n, 'DEV_GRANT', 'dev', 'dev:' + uid()); persist(); },

  equip(kind: 'cups' | 'skins' | 'shacks', id: string) {
    const S = save();
    if (!S.inv[kind].includes(id)) return;
    if (kind === 'cups') S.inv.cup = id; else if (kind === 'skins') S.inv.skin = id; else S.inv.shack = id;
    persist();
  },
};
