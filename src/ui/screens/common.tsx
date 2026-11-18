'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { useSyncExternalStore, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ECON } from '@/game/content';
import { show } from '@/game/ui-store';
import { save, saveRev, subscribeSave } from '@/services/save';
import { Server } from '@/services/server';
import { CloseIcon, TokenIcon } from '../icons';
import { B, Btn, Card, Col, Row, Small } from '../kit';
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
 * pass scroll={false}.
 */
export function Panel({ children, width, style, onClose, closeLabel = 'Close', scroll = true }: {
  children: ReactNode; width: number; style?: StyleProp<ViewStyle>; onClose?: () => void; closeLabel?: string; scroll?: boolean;
}) {
  const { availW, availH } = useUi();
  return (
    <Card style={[{ width: Math.min(width, availW - 16), maxHeight: availH - 16, gap: 14 }, style]}>
      {scroll ? <ScrollView style={st.scroll} contentContainerStyle={st.content}>{children}</ScrollView> : children}
      {onClose && (
        <View style={st.x}>
          <Btn icon size="sm" onPress={onClose} label={closeLabel}><CloseIcon /></Btn>
        </View>
      )}
    </Card>
  );
}

export function resetIn() {
  const n = new Date(), m = new Date(n);
  m.setHours(24, 0, 0, 0);
  const d = +m - +n;
  return `${Math.floor(d / 3.6e6)}h ${Math.floor(d / 6e4) % 60}m`;
}

/** Contextual top-up offer (plan §5.5): smallest pack the first time or when one token short. */
export function OfferCard({ short, onBuy }: { short: number; onBuy?: () => void }) {
  const S = save(), first = !S.flags.exhaustedOnce;
  const pk = ECON.packs.find(p => p.id === (short <= 1 || first ? 'mini' : 'pocket'))!;
  const ds = Server.dailyStatus();
  return (
    <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: C.berry }}>
      <Col style={{ gap: 4, flex: 1 }}>
        <B>{short === 1 ? 'One token short' : 'Out of tokens'}</B>
        <Small>{ds.claimable ? 'Your free refill is ready on the home screen.' : `Free refill of ${S.tune.daily} in ${resetIn()}.`} Or top up now. Tokens you buy never expire.</Small>
      </Col>
      <Btn tone="mango" onPress={() => { onBuy?.(); show({ name: 'shop', confirm: pk.id }); }}>{`${pk.tokens} tokens · ${pk.price}`}</Btn>
    </Card>
  );
}

export function TokenCount({ size = 18 }: { size?: number }) {
  return (
    <Row style={{ gap: 6 }}>
      <TokenIcon s={size} />
      <Small>{Server.tokens()} tokens</Small>
    </Row>
  );
}

const st = StyleSheet.create({
  scrim: { backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center' },
  clear: { backgroundColor: 'rgba(23,21,42,0.30)' },
  x: { position: 'absolute', right: 18, top: 18 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: 14, paddingRight: 2 },
});
