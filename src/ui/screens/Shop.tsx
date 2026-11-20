'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
// Coin wallet and the Collection (cosmetics bought with coins earned in play; plan §7.4).
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { goHome } from '@/game/controller';
import { CUPS, SKINS, type CupDesign, type Skin } from '@/game/content';
import { show, toast, useUI } from '@/game/ui-store';
import { Sound } from '@/services/feedback';
import { Server } from '@/services/server';
import { CoinIcon } from '../icons';
import { B, Btn, BtnText, Card, H2, Num, Pill, Row, Small, Spacer, Tag } from '../kit';
import { C } from '../theme';
import { Panel, Screen, useSave } from './common';

const LEDGER_NAMES: Record<string, string> = {
  MILESTONE: 'Milestone', CHALLENGE: 'Daily challenge', ROUND_REWARD: 'Round reward', ITEM_UNLOCK: 'Unlock', LIFE_REFILL: 'Lives refilled',
  DEV_GRANT: 'Dev grant',
};

export function Wallet() {
  const S = useSave(), w = S.wallet;
  const rows = S.ledger.slice(-30).reverse();
  return (
    <Screen>
      <Panel width={640} scroll={false} onClose={goHome}>
        <H2>Wallet</H2>
        <Row style={{ gap: 10 }}>
          <Card flat style={{ flex: 1, gap: 2 }}><Small>Coins</Small><Num style={{ fontSize: 32 }}>{w.coins}</Num><Small>Earned by playing</Small></Card>
        </Row>
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
          {rows.length ? rows.map(l => (
            <Row key={l.id + l.at} style={{ paddingVertical: 8, borderBottomWidth: 1.5, borderBottomColor: C.line }}>
              <B style={{ flex: 1 }}>{LEDGER_NAMES[l.type] || l.type}</B>
              <Small style={{ width: 120 }}>coins</Small>
              <Num style={{ width: 60, textAlign: 'right', fontSize: 18, color: l.amount < 0 ? C.berryD : C.limeD }}>{`${l.amount > 0 ? '+' : ''}${l.amount}`}</Num>
            </Row>
          )) : <Small>No activity yet.</Small>}
        </ScrollView>
        <Row>
          <Btn tone="mango" onPress={() => show({ name: 'collection' })}>Collection</Btn>
          <Spacer />
          <Small>{`Player ${S.playerId.slice(0, 8)}`}</Small>
        </Row>
      </Panel>
    </Screen>
  );
}

function CupPreview({ d }: { d: CupDesign }) {
  const rim = d.rim === '#FFFFFF' ? '#C9C2B4' : d.rim;
  return (
    <Svg width={64} height={82} viewBox="0 0 64 82">
      <Path d="M6 8h52l-8 66a6 6 0 01-6 5H20a6 6 0 01-6-5z" fill="rgba(69,198,242,.18)" stroke={rim} strokeWidth={3} />
      <Path d="M12 34h40l-4.6 40a5 5 0 01-5 4.4H21.6a5 5 0 01-5-4.4z" fill={C.berry} />
      <Rect x={13} y={68} width={38} height={11} fill={d.foot} />
      {d.pattern === 'dots' && [18, 26, 34, 42].map(x => <Circle key={x} cx={x + 2} cy={73.5} r={2} fill={d.alt} />)}
      {d.pattern === 'stripes' && [14, 24, 34, 44].map(x => <Path key={x} d={`M${x} 79l4 0 6-11-4 0z`} fill={d.alt} />)}
      {d.pattern === 'checker' && [14, 26, 38].map(x => (
        <Path key={x} d={`M${x} 68h6v5.5h-6zM${x + 6} 73.5h6V79h-6z`} fill={d.alt} />
      ))}
      {d.pattern === 'waves' && <Path d="M14 74q4-4 8 0t8 0 8 0 8 0" stroke={d.alt} strokeWidth={2} fill="none" />}
      <Ellipse cx={32} cy={8} rx={26} ry={4} fill="none" stroke={rim} strokeWidth={3} />
    </Svg>
  );
}

function SkinPreview({ s }: { s: Skin }) {
  return (
    <Svg width={96} height={70} viewBox="0 0 96 70">
      <Rect x={4} y={6} width={88} height={54} rx={14} fill={s.body} />
      <Rect x={4} y={46} width={88} height={14} rx={7} fill={s.deep} />
      {[18, 48, 78].map((x, i) => (
        <Path key={x} d={`M${x - 11} 12h22v26h-22z`} fill="rgba(255,255,255,.6)" />
      ))}
      {[18, 48, 78].map((x, i) => (
        <Rect key={'f' + x} x={x - 11} y={24 - i * 2} width={22} height={14 + i * 2} rx={5} fill={['#FF6B8A', '#45C6F2', '#A7D95B'][i]} />
      ))}
    </Svg>
  );
}

let collTab: 'cups' | 'skins' = 'cups';
export function Collection() {
  const S = useSave();
  useUI(st => st.overlay); // re-render on tab switch (show() with the same overlay name)
  const owned = S.inv[collTab], eq = collTab === 'cups' ? S.inv.cup : S.inv.skin;
  const list: (CupDesign | Skin)[] = collTab === 'cups' ? CUPS : SKINS;
  const setTab = (t: 'cups' | 'skins') => { collTab = t; show({ name: 'collection' }); };
  return (
    <Screen>
      <Panel width={920} style={{ gap: 16 }} onClose={goHome}>
        <Row>
          <H2>Collection</H2>
          <Row style={{ gap: 8, marginLeft: 12 }}>
            <Btn size="sm" flat tone={collTab === 'cups' ? 'ink' : 'default'} onPress={() => setTab('cups')}><BtnText size="sm" tone={collTab === 'cups' ? 'ink' : 'default'}>Cups</BtnText></Btn>
            <Btn size="sm" flat tone={collTab === 'skins' ? 'ink' : 'default'} onPress={() => setTab('skins')}><BtnText size="sm" tone={collTab === 'skins' ? 'ink' : 'default'}>Machines</BtnText></Btn>
          </Row>
          <Spacer />
          <View style={{ marginRight: 56 }}><Pill><CoinIcon /><Num style={{ fontSize: 19 }}>{S.wallet.coins}</Num></Pill></View>
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {list.map(it => {
            const has = owned.includes(it.id), on = eq === it.id;
            return (
              <View key={it.id} style={[ss.item, { width: collTab === 'cups' ? 199 : 270 }, on && ss.itemEq]}>
                {collTab === 'cups' ? <CupPreview d={it as CupDesign} /> : <SkinPreview s={it as Skin} />}
                <B>{it.name}</B>
                {on ? <Tag tone="lime">Equipped</Tag>
                  : has ? <Btn size="sm" onPress={() => { Server.equip(collTab, it.id); Sound.sfx('tap'); }}>Equip</Btn>
                    : (
                      <Btn size="sm" tone="mango" disabled={S.wallet.coins < it.price} label={`Unlock ${it.name} for ${it.price} coins`}
                        onPress={() => { const r = Server.buyItem(collTab, it.id); if (r.ok) { Server.equip(collTab, it.id); Sound.sfx('coin'); toast('Unlocked!'); } }}>
                        <CoinIcon s={16} /><BtnText size="sm" tone="mango">{String(it.price)}</BtnText>
                      </Btn>
                    )}
              </View>
            );
          })}
        </View>
        <Small>Looks only. Cups and machines never change how fast you pour or how wide the band is.</Small>
      </Panel>
    </Screen>
  );
}

const ss = StyleSheet.create({
  pack: { flex: 1, gap: 8, alignItems: 'flex-start', padding: 20, borderRadius: 24, backgroundColor: '#fff', borderWidth: 2, borderColor: C.line },
  packHl: { borderColor: C.berry },
  item: { alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 22, backgroundColor: '#fff', borderWidth: 2, borderColor: C.line },
  itemEq: { borderColor: C.limeD },
});
