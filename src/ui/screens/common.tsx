'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LIVES } from '@/game/content';
import { show, toast } from '@/game/ui-store';
import { Sound } from '@/services/feedback';
import { save, saveRev, subscribeSave } from '@/services/save';
import { Server } from '@/services/server';
import { CloseIcon, CoinIcon, HeartIcon } from '../icons';
import { Btn, BtnText, Card, Col, Num, Pill, Row, Small } from '../kit';
import { C } from '../theme';
import { useUi } from '../scale';

/** Re-render when the save changes (wallet, progress, settings). */
export const useSave = () => {
  useSyncExternalStore(subscribeSave, saveRev, saveRev);
  return save();
};

/**
 * A dimmed layer with a centred card. It fills the whole overlay container, which spans the window (notches
 * included), so the backdrop always reaches every edge of the screen.
 */
export function Screen({ children, clear }: { children: ReactNode; clear?: boolean }) {
  return <View style={[StyleSheet.absoluteFill, clear ? st.clear : st.scrim]}>{children}</View>;
}

/**
 * A menu card at its designed width, clamped to the safe area, never taller than the screen. Content scrolls when
 * it runs tall (phones at the 16pt text floor). Panels that manage their own scrolling (level grid, wallet ledger)
 * pass scroll={false}. `footer` holds the card's main action: it sits under the scrolling content and never scrolls
 * away, so Start / Next level stay on screen on short phones.
 */
export function Panel({ children, width, style, onClose, closeLabel = 'Close', scroll = true, footer }: {
  children: ReactNode; width: number; style?: StyleProp<ViewStyle>; onClose?: () => void; closeLabel?: string; scroll?: boolean; footer?: ReactNode;
}) {
  const { availW, availH } = useUi();
  return (
    <Card style={[{ width: Math.min(width, availW - 16), maxHeight: availH - 16, gap: 14 }, style]}>
      {scroll ? <ScrollView style={st.scroll} contentContainerStyle={st.content}>{children}</ScrollView> : children}
      {footer}
      {onClose && (
        <View style={st.x}>
          <Btn icon size="sm" onPress={onClose} label={closeLabel}><CloseIcon /></Btn>
        </View>
      )}
    </Card>
  );
}

/** Re-render every second while a countdown is showing. */
export function useNow(active = true) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** m:ss (or h:mm:ss) until `at`. */
export function clock(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, sec = t % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

/** Lives right now, ticking: the save only stores a snapshot, refills are counted as time passes. */
export function useLives() {
  useSave();
  const first = Server.lives();
  const now = useNow(first.n < first.max && !first.unlimited);
  const L = Server.lives();
  return { ...L, nextIn: L.nextAt ? L.nextAt - now : 0 };
}

/** Top-bar pill: hearts left and the countdown to the next one. Opens the lives panel. */
export function LivesPill() {
  const L = useLives();
  const label = L.unlimited ? 'Unlimited' : L.n >= L.max ? 'Full' : clock(L.nextIn);
  return (
    <Pill onPress={() => show({ name: 'lives' })} label={L.unlimited ? 'Unlimited lives' : `${L.n} of ${L.max} lives, ${L.n >= L.max ? 'full' : 'next in ' + label}`}>
      <HeartIcon s={26} on={L.n > 0 || L.unlimited} />
      <Num style={{ fontSize: 19 }}>{L.unlimited ? '∞' : L.n}</Num>
      <Small>{label}</Small>
    </Pill>
  );
}

/** Row of hearts, filled for each life left. */
export function Hearts({ s = 34 }: { s?: number }) {
  const L = useLives();
  return <Row style={{ gap: 4 }}>{Array.from({ length: L.max }, (_, k) => <HeartIcon key={k} s={s} on={L.unlimited || k < L.n} />)}</Row>;
}

/** The lives card: hearts, the countdown, the rules in one line, and a coin refill when it would help. */
export function LivesCard({ compact }: { compact?: boolean }) {
  const L = useLives(), coins = save().wallet.coins, full = L.n >= L.max || L.unlimited, afford = coins >= LIVES.refillCoins;
  const refill = () => {
    const r = Server.refillLives();
    if (r.ok) { Sound.sfx('coin'); toast('Lives refilled'); }
  };
  return (
    <Col style={{ gap: 10 }}>
      <Hearts s={compact ? 30 : 36} />
      <Small>
        {L.unlimited ? 'Unlimited lives are on.' : full ? 'All lives full.' : <>Next life in <Num style={{ fontSize: 17 }}>{clock(L.nextIn)}</Num>. One back every {LIVES.refillMs / 60000} minutes.</>}
      </Small>
      {!compact && <Small>Winning never costs a life, and levels you have beaten are always free to replay.</Small>}
      {!full && (
        <Btn tone="mango" disabled={!afford} onPress={refill} label={`Refill all lives for ${LIVES.refillCoins} coins`} style={{ alignSelf: 'flex-start' }}>
          <BtnText tone="mango">Refill all</BtnText>
          <Row style={{ gap: 4 }}><CoinIcon s={22} /><Num style={{ fontSize: 20 }}>{LIVES.refillCoins}</Num></Row>
        </Btn>
      )}
      {!full && !afford && <Small>{`You have ${coins} coins. Every round you play earns more.`}</Small>}
    </Col>
  );
}

const st = StyleSheet.create({
  scrim: { backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center' },
  clear: { backgroundColor: 'rgba(23,21,42,0.30)' },
  x: { position: 'absolute', right: 18, top: 18 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: 14, paddingRight: 2 },
});
