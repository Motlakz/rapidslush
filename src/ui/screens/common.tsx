'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { useSyncExternalStore, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ECON } from '@/game/content';
import { show } from '@/game/ui-store';
import { save, saveRev, subscribeSave } from '@/services/save';
import { Server } from '@/services/server';
import { CloseIcon, TokenIcon } from '../icons';
import { B, Btn, Card, Col, Row, Small } from '../kit';
import { C } from '../theme';

/** Re-render when the save changes (wallet, progress, settings). */
export const useSave = () => {
  useSyncExternalStore(subscribeSave, saveRev, saveRev);
  return save();
};

/** A dimmed full-stage layer with a centred card. */
export function Screen({ children, clear }: { children: ReactNode; clear?: boolean }) {
  return <View style={[StyleSheet.absoluteFill, clear ? st.clear : st.scrim]}>{children}</View>;
}

export function Panel({ children, width, style, onClose, closeLabel = 'Close' }: {
  children: ReactNode; width: number; style?: StyleProp<ViewStyle>; onClose?: () => void; closeLabel?: string;
}) {
  return (
    <Card style={[{ width, gap: 14 }, style]}>
      {children}
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

export function TokenCount({ size = 14 }: { size?: number }) {
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
});
