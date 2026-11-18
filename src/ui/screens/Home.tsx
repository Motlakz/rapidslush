'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { ScrollView } from 'react-native';

import { SPIN } from '@/engine';
import { newAttract } from '@/game/controller';
import { CHALLENGES, ECON, LOCATIONS, MACHINES, playerLevel } from '@/game/content';
import { show, toast } from '@/game/ui-store';
import { Sound } from '@/services/feedback';
import { setMachine } from '@/services/save';
import { Server, maxFor, spinUnlocked, trackOf } from '@/services/server';
import { CoinIcon, GearIcon, LockIcon, TokenIcon } from '../icons';
import { Bar, Btn, BtnText, Card, Col, CostChip, H1, H3, Num, P, Pill, Row, Small, Spacer, Tag } from '../kit';
import { C } from '../theme';
import { useUi } from '../scale';
import { Screen, resetIn, useSave } from './common';

export function Home() {
  const S = useSave();
  const { safe, availH } = useUi();
  const m = S.machine === 'spin' && spinUnlocked() ? 'spin' : 'belt', T = trackOf(m), n = Math.min(T.highest, maxFor(m));
  const ds = Server.dailyStatus(), pl = playerLevel(S.progress.xp), mach = MACHINES.find(x => x.id === m)!;
  const ch = S.challenge, def = ch && CHALLENGES.find(c => c.id === ch.id), cost = Server.cost();

  const claim = () => {
    const r = Server.claimDaily();
    if (r.ok) { Sound.sfx('coin'); toast(r.amount ? `+${r.amount} free tokens` : 'Claimed. Free balance already full'); }
  };

  return (
    <Screen clear>
      {/* zIndex keeps the top bar above its neighbours, so the pills and the gear stay tappable everywhere */}
      <Row style={{ position: 'absolute', left: 24 + safe.left, right: 24 + safe.right, top: 20 + safe.top, gap: 10, zIndex: 30 }}>
        <Pill onPress={() => show({ name: 'wallet' })} label="Wallet">
          <TokenIcon /><Num style={{ fontSize: 19 }}>{Server.tokens()}</Num><Small>tokens</Small>
        </Pill>
        <Pill onPress={() => show({ name: 'collection' })} label="Collection">
          <CoinIcon /><Num style={{ fontSize: 19 }}>{S.wallet.coins}</Num>
        </Pill>
        <Pill>
          <Tag tone="grape">{`Lv ${pl.level}`}</Tag>
          <Bar frac={pl.into / pl.need} color={C.grape} style={{ width: 110 }} />
        </Pill>
        <Spacer />
        <Btn icon size="sm" onPress={() => show({ name: 'settings' })} label="Settings"><GearIcon /></Btn>
      </Row>

      {/* Side-by-side columns that scroll vertically when the screen is shorter than the cards (phones at the 16pt
          floor). flexGrow keeps the row at full height when everything fits, so the right column still sits bottom. */}
      <ScrollView pointerEvents="box-none" style={{ flex: 1 }}
        contentContainerStyle={{ flexDirection: 'row', flexGrow: 1, gap: 22, paddingTop: 104 + safe.top, paddingBottom: 34 + safe.bottom, paddingLeft: 40 + safe.left, paddingRight: 40 + safe.right }}>
        <Card style={{ flex: 1, maxWidth: 500, gap: 16, padding: 28, alignSelf: 'flex-start' }}>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}><Tag tone="mango">Beach Shack</Tag><Tag>{`${mach.name} · Level ${n} of ${maxFor(m)}`}</Tag></Row>
          <H1 style={{ fontSize: 58, lineHeight: 62 }}>{'Rapid\nSlush'}</H1>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            {MACHINES.map(x => {
              if ('soon' in x) return <Tag key={x.id} icon={<LockIcon s={17} />}>{x.name}</Tag>;
              const locked = x.id === 'spin' && !spinUnlocked();
              return (
                <Btn key={x.id} size="sm" flat tone={x.id === m ? 'ink' : 'default'} disabled={locked}
                  onPress={() => { setMachine(x.id); newAttract(); }}>
                  {locked ? <><LockIcon s={18} /><BtnText size="sm">{`${x.name} · Lv ${SPIN.UNLOCK}`}</BtnText></> : <BtnText size="sm" tone={x.id === m ? 'ink' : 'default'}>{x.name}</BtnText>}
                </Btn>
              );
            })}
          </Row>
          <Btn tone="berry" size="big" onPress={() => show({ name: 'intro', n, m })} label={`Play level ${n}`}>
            <BtnText tone="berry" size="big">{`Play ${m === 'spin' ? 'Spin' : 'Level'} ${n}`}</BtnText>
            <CostChip cost={cost}>{cost ? <TokenIcon s={20} /> : null}</CostChip>
          </Btn>
          <Row style={{ gap: 10 }}>
            <Btn size="sm" onPress={() => show({ name: 'levels', m })}>Levels</Btn>
            <Btn size="sm" tone="mango" onPress={() => show({ name: 'shop' })}>Shop</Btn>
            <Btn size="sm" onPress={() => show({ name: 'collection' })}>Collection</Btn>
          </Row>
          <Small>{`Each round costs ${S.tune.cost} tokens. You get ${S.tune.daily} free tokens a day, holding up to ${ECON.freeCap}. Tokens you buy never expire.`}</Small>
        </Card>

        {/* bottom-anchored on tall screens; on short ones bottom-anchoring would push the cards off-screen, so top-align */}
        <Col style={{ flex: 1, maxWidth: 360, gap: 14, marginTop: availH < 640 ? 0 : 'auto', marginLeft: 'auto' }}>
          <Card style={{ gap: 10, padding: 24 }}>
            <Row><H3>Daily refill</H3><Spacer /><TokenIcon s={34} /></Row>
            {ds.claimable ? (
              <>
                <P style={{ fontSize: 18 }}>{ds.amount > 0 ? `+${ds.amount} free tokens are waiting.` : `Your free balance is full (${ECON.freeCap}). Claim to keep your streak.`}</P>
                <Btn tone="lime" onPress={claim}>{`Claim${ds.amount ? ' +' + ds.amount : ''}`}</Btn>
              </>
            ) : (
              <P style={{ fontSize: 18 }}>Claimed. Next refill in <Num style={{ fontSize: 18 }}>{resetIn()}</Num>.</P>
            )}
          </Card>
          {def && ch && (
            <Card style={{ gap: 10, padding: 24 }}>
              <Row><Tag tone="razz">Daily challenge</Tag><Spacer /><Small>+2 tokens · +40 coins</Small></Row>
              <H3>{def.text}</H3>
              <Row>
                <Bar frac={ch.progress / def.goal} color={C.razz} style={{ flex: 1 }} />
                <Num style={{ fontSize: 18 }}>{ch.done ? 'Done!' : `${ch.progress}/${def.goal}`}</Num>
              </Row>
            </Card>
          )}
          <Card style={{ flexDirection: 'row', gap: 8, paddingVertical: 18, paddingHorizontal: 20, flexWrap: 'wrap' }}>
            {LOCATIONS.map(l => (
              <Tag key={l.name} tone={l.open ? 'lime' : 'default'} icon={l.open ? undefined : <LockIcon s={17} />}>{l.open ? l.name : `${l.name} · soon`}</Tag>
            ))}
          </Card>
        </Col>
      </ScrollView>
    </Screen>
  );
}
