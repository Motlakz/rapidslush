'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
// Token shop, wallet and collection (plan §5.3, §7.4).
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { goHome } from '@/game/controller';
import { CUPS, ECON, SKINS, type CupDesign, type PackId, type Skin } from '@/game/content';
import { show, toast, useUI } from '@/game/ui-store';
import { track } from '@/services/analytics';
import { Sound } from '@/services/feedback';
import { Server } from '@/services/server';
import { CoinIcon, TokenIcon } from '../icons';
import { B, Btn, BtnText, Card, Col, H2, H3, Num, P, Pill, Row, Small, Spacer, Tag } from '../kit';
import { C } from '../theme';
import { Panel, Screen, useSave } from './common';

export function Shop({ confirm }: { confirm?: PackId }) {
  const S = useSave(), w = S.wallet, cpk = confirm && ECON.packs.find(p => p.id === confirm);
  const buy = (id: PackId) => {
    track('purchase_started', { pack: id });
    const r = Server.purchase(id);
    if (r.ok) {
      Sound.sfx('coin');
      toast(`+${r.tokens + r.bonus} tokens added${r.bonus ? ' (incl. first-purchase bonus)' : ''}`);
      track('purchase_completed', { pack: id, tokens: r.tokens, bonus: r.bonus });
    } else track('purchase_failed', { pack: id });
    show({ name: 'shop' });
  };
  return (
    <Screen>
      <Panel width={900} style={{ gap: 16 }} onClose={goHome}>
        <Row>
          <H2>Token shop</H2>
          {!S.flags.firstPurchase && <Tag tone="berry">{`First purchase: +${ECON.firstPurchaseBonus} bonus tokens`}</Tag>}
        </Row>
        <Row style={{ gap: 10 }}>
          <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
            <TokenIcon /><Col style={{ gap: 0 }}><Small>Free tokens</Small><Num style={{ fontSize: 16 }}>{w.free} <Small>{`/ ${ECON.freeCap} cap`}</Small></Num></Col>
          </Card>
          <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
            <TokenIcon /><Col style={{ gap: 0 }}><Small>Bought tokens</Small><Num style={{ fontSize: 16 }}>{w.purchased} <Small>never expire</Small></Num></Col>
          </Card>
          <Small style={{ flex: 1 }}>{`Rounds use free tokens first. The daily refill tops free tokens up to ${ECON.freeCap} and never touches what you bought.`}</Small>
        </Row>
        <Row style={{ gap: 14, alignItems: 'stretch' }}>
          {ECON.packs.map(p => (
            <View key={p.id} style={[ss.pack, p.id === 'pocket' && ss.packHl]}>
              <Tag tone={p.id === 'pocket' ? 'berry' : p.id === 'mega' ? 'lime' : 'default'}>{p.tag}</Tag>
              <Row style={{ gap: 8 }}><TokenIcon s={30} /><Num style={{ fontSize: 38, lineHeight: 40 }}>{p.tokens}</Num></Row>
              <B>{p.name}</B>
              <Small>{`${Math.floor(p.tokens / Math.max(1, S.tune.cost))} rounds${!S.flags.firstPurchase ? ` + ${ECON.firstPurchaseBonus} bonus` : ''}`}</Small>
              <Btn tone="mango" style={{ alignSelf: 'stretch', marginTop: 6 }} onPress={() => show({ name: 'shop', confirm: p.id })} label={`Buy ${p.name} for ${p.price}`}>{p.price}</Btn>
            </View>
          ))}
        </Row>
        <Small>Prototype checkout: nothing is charged. In the app this goes through Google Play Billing via RevenueCat, and tokens are only added after the server verifies the purchase.</Small>
      </Panel>
      {cpk && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center' }]}>
          <Card style={{ width: 420, gap: 12 }}>
            <H3>Confirm purchase</H3>
            <P>{`${cpk.name}: ${cpk.tokens} tokens${!S.flags.firstPurchase ? ` + ${ECON.firstPurchaseBonus} first-purchase bonus` : ''} for ${cpk.price}.`}</P>
            <Row>
              <Btn tone="berry" onPress={() => buy(cpk.id)}>{`Buy for ${cpk.price}`}</Btn>
              <Btn onPress={() => show({ name: 'shop' })}>Cancel</Btn>
            </Row>
          </Card>
        </View>
      )}
    </Screen>
  );
}

const LEDGER_NAMES: Record<string, string> = {
  DAILY_CLAIM: 'Daily refill', ROUND_ENTRY: 'Round entry', ROUND_REFUND: 'Refund', PURCHASE: 'Purchase', FIRST_PURCHASE_BONUS: 'First purchase bonus',
  MILESTONE: 'Milestone', CHALLENGE: 'Daily challenge', ROUND_REWARD: 'Round reward', ITEM_UNLOCK: 'Unlock', DEV_GRANT: 'Dev grant',
};

export function Wallet() {
  const S = useSave(), w = S.wallet;
  const rows = S.ledger.slice(-30).reverse();
  return (
    <Screen>
      <Panel width={640} style={{ maxHeight: 660 }} onClose={goHome}>
        <H2>Wallet</H2>
        <Row style={{ gap: 10 }}>
          <Card flat style={{ flex: 1, gap: 2 }}><Small>Free tokens</Small><Num style={{ fontSize: 28 }}>{w.free}</Num><Small>{`+${S.tune.daily} a day, up to ${ECON.freeCap}`}</Small></Card>
          <Card flat style={{ flex: 1, gap: 2 }}><Small>Bought tokens</Small><Num style={{ fontSize: 28 }}>{w.purchased}</Num><Small>Never expire</Small></Card>
          <Card flat style={{ flex: 1, gap: 2 }}><Small>Coins</Small><Num style={{ fontSize: 28 }}>{w.coins}</Num><Small>Earned by playing</Small></Card>
        </Row>
        <ScrollView style={{ maxHeight: 300 }}>
          {rows.length ? rows.map(l => (
            <Row key={l.id + l.at} style={{ paddingVertical: 8, borderBottomWidth: 1.5, borderBottomColor: C.line }}>
              <B style={{ flex: 1 }}>{LEDGER_NAMES[l.type] || l.type}</B>
              <Small style={{ width: 120 }}>{l.currency === 'COIN' ? 'coins' : l.currency === 'FREE_TOKEN' ? 'free tokens' : 'bought tokens'}</Small>
              <Num style={{ width: 60, textAlign: 'right', fontSize: 15, color: l.amount < 0 ? C.berryD : C.limeD }}>{`${l.amount > 0 ? '+' : ''}${l.amount}`}</Num>
            </Row>
          )) : <Small>No activity yet.</Small>}
        </ScrollView>
        <Row>
          <Btn tone="mango" onPress={() => show({ name: 'shop' })}>Get tokens</Btn>
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
          <View style={{ marginRight: 56 }}><Pill><CoinIcon /><Num style={{ fontSize: 15 }}>{S.wallet.coins}</Num></Pill></View>
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
