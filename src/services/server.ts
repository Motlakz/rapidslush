// MOCK of the Next.js API (plan §10). Same contract the real routes will have: an immutable ledger, idempotency
// keys on every mutation, token reservation at round start, settlement with plausibility checks, daily claims.
// It runs locally against the save so the full loop is playable now; Phase 3 swaps this for HTTP calls.
import { CHALLENGES, CUPS, ECON, SKINS, playerLevel, type PackId } from '@/game/content';
import { MAX_LEVEL, SPIN, type Mode, type RoundResult } from '@/engine';
import { track } from './analytics';
import { flush, persist, save, uid, type Currency, type Rewards, type Session, type Track } from './save';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const trackOf = (m: Mode): Track => {
  const P = save().progress;
  if (m !== 'spin') return P;
  return P.spin ?? (P.spin = { highest: 1, stars: {}, best: {} });
};
export const maxFor = (m: Mode) => (m === 'spin' ? SPIN.MAX_LEVEL : MAX_LEVEL);
export const spinUnlocked = () => save().progress.highest > SPIN.UNLOCK;
/** Dev tuning panel only. */
export function unlockAll() { save().progress.highest = MAX_LEVEL; trackOf('spin').highest = SPIN.MAX_LEVEL; persist(); }

export const Server = {
  tokens() { const w = save().wallet; return w.free + w.purchased; },
  cost() { const t = save().tune; return t.infinite ? 0 : t.cost; },

  ledger(currency: Currency, amount: number, type: string, ref: string, key: string) {
    const S = save();
    if (S.idem[key]) return false;
    S.idem[key] = 1;
    S.ledger.push({ id: uid().slice(0, 8), currency, amount, type, ref, at: Date.now() });
    if (S.ledger.length > 300) S.ledger.splice(0, S.ledger.length - 300);
    if (currency === 'FREE_TOKEN') S.wallet.free += amount;
    else if (currency === 'PURCHASED_TOKEN') S.wallet.purchased += amount;
    else S.wallet.coins += amount;
    return true;
  },

  /** Session recovery (plan §5.4): an ACTIVE session found at boot was interrupted. Refund if it barely began. */
  bootstrap() {
    const S = save();
    let refunded = 0;
    for (const s of Object.values(S.sessions)) {
      if (s.status !== 'ACTIVE') continue;
      if ((s.elapsed || 0) < 5) { this.refund(s); refunded += s.cost; } else s.status = 'INTERRUPTED';
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

  refund(s: Session) {
    s.status = 'REFUNDED';
    if (s.fromFree) this.ledger('FREE_TOKEN', s.fromFree, 'ROUND_REFUND', s.id, 'refund-free:' + s.id);
    if (s.fromPaid) this.ledger('PURCHASED_TOKEN', s.fromPaid, 'ROUND_REFUND', s.id, 'refund-paid:' + s.id);
  },

  dailyStatus() {
    const S = save(), amt = Math.max(0, Math.min(S.tune.daily, ECON.freeCap - S.wallet.free));
    return { claimable: S.daily.last !== today(), amount: amt, capped: amt < S.tune.daily };
  },

  claimDaily() {
    const S = save(), st = this.dailyStatus(), d = today();
    if (!st.claimable) return { ok: false, amount: 0 };
    S.daily.last = d;
    if (st.amount > 0) this.ledger('FREE_TOKEN', st.amount, 'DAILY_CLAIM', d, 'daily:' + d);
    persist();
    track('daily_reward_claimed', { amount: st.amount });
    return { ok: true, amount: st.amount };
  },

  startSession(level: number, mode: Mode, idemKey: string):
    | { ok: true; session: Session }
    | { ok: false; error: 'INSUFFICIENT'; short: number } {
    const S = save();
    if (S.sessions[idemKey]) return { ok: true, session: S.sessions[idemKey] };
    const cost = this.cost(), have = this.tokens();
    if (have < cost) return { ok: false, error: 'INSUFFICIENT', short: cost - have };
    const fromFree = Math.min(S.wallet.free, cost), fromPaid = cost - fromFree;
    const s: Session = { id: idemKey, level, mode, status: 'ACTIVE', cost, fromFree, fromPaid, startedAt: Date.now(), elapsed: 0 };
    if (fromFree) this.ledger('FREE_TOKEN', -fromFree, 'ROUND_ENTRY', s.id, 'entry-free:' + s.id);
    if (fromPaid) this.ledger('PURCHASED_TOKEN', -fromPaid, 'ROUND_ENTRY', s.id, 'entry-paid:' + s.id);
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
    const P = S.progress, T = trackOf(res.mode), maxL = maxFor(res.mode), mk = res.mode === 'spin' ? 'spin:' : '';
    const rewards: Rewards = { xp: 0, coins: 0, tokens: 0, levelUp: false, unlocked: null, challenge: null, firstClear: false, spinUnlocked: false };
    if (plausible) {
      rewards.xp = res.win ? 20 + (res.stars === 3 ? 15 : 0) : 5;
      rewards.coins = res.served * 3 + res.stars * 10;
      const prevStars = T.stars[res.level] || 0;
      if (res.win && !prevStars) {
        rewards.firstClear = true;
        if (res.level % 5 === 0) {
          rewards.tokens = ECON.milestoneTokens;
          this.ledger('FREE_TOKEN', rewards.tokens, 'MILESTONE', mk + 'L' + res.level, 'milestone:' + mk + res.level);
        }
      }
      T.stars[res.level] = Math.max(prevStars, res.stars);
      T.best[res.level] = Math.max(T.best[res.level] || 0, res.score);
      if (res.win && res.level + 1 > T.highest && res.level < maxL) { T.highest = res.level + 1; rewards.unlocked = res.level + 1; }
      if (spinUnlocked() && !S.flags.spinSeen) { S.flags.spinSeen = true; rewards.spinUnlocked = true; }
      P.rounds++; P.perfect += res.perfect; P.spilled += res.waste;
      const lvBefore = playerLevel(P.xp).level;
      P.xp += rewards.xp;
      rewards.levelUp = playerLevel(P.xp).level > lvBefore;
      this.ledger('COIN', rewards.coins, 'ROUND_REWARD', s.id, 'coins:' + s.id);
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
          this.ledger('FREE_TOKEN', 2, 'CHALLENGE', ch.day, 'challenge:' + ch.day);
          this.ledger('COIN', 40, 'CHALLENGE', ch.day, 'challenge-coins:' + ch.day);
          P.xp += 50; rewards.tokens += 2; rewards.coins += 40; rewards.xp += 50;
        }
      }
    }
    if (res.win) { S.stats.wins++; S.stats.fails = 0; } else S.stats.fails++;
    s.status = res.win ? 'COMPLETED' : 'FAILED'; s.endedAt = Date.now();
    s.settlement = { rewards, plausible };
    persist(); flush();
    return { ok: true, rewards, plausible };
  },

  /** Prototype checkout. In the app this is RevenueCat + Google Play Billing, credited only after server verification. */
  purchase(packId: PackId) {
    const S = save(), pk = ECON.packs.find(p => p.id === packId);
    if (!pk) return { ok: false as const };
    const txn = 'GPA.' + uid().slice(0, 13);
    this.ledger('PURCHASED_TOKEN', pk.tokens, 'PURCHASE', txn, 'purchase:' + txn);
    let bonus = 0;
    if (!S.flags.firstPurchase) {
      S.flags.firstPurchase = true; bonus = ECON.firstPurchaseBonus;
      this.ledger('PURCHASED_TOKEN', bonus, 'FIRST_PURCHASE_BONUS', txn, 'fpb:' + S.playerId);
    }
    S.purchases.push({ txn, packId, tokens: pk.tokens, bonus, at: Date.now(), status: 'VERIFIED' });
    persist(); flush();
    return { ok: true as const, tokens: pk.tokens, bonus, txn };
  },

  buyItem(kind: 'cups' | 'skins', id: string) {
    const S = save(), list = kind === 'cups' ? CUPS : SKINS, it = list.find(x => x.id === id);
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

  equip(kind: 'cups' | 'skins', id: string) {
    const S = save();
    if (!S.inv[kind].includes(id)) return;
    if (kind === 'cups') S.inv.cup = id; else S.inv.skin = id;
    persist();
  },
};
