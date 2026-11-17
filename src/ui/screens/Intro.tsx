'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { TOPPINGS, type Mode } from '@/engine';
import { View } from 'react-native';
import { cfgFor, goHome, keyHintsOn, startLevel } from '@/game/controller';
import { glassFor } from '@/game/content';
import { setFlag } from '@/services/save';
import { Server, trackOf } from '@/services/server';
import { Stars, TokenIcon } from '../icons';
import { BtnText, Btn, Card, Col, CostChip, H2, Num, P, Row, Small, Spacer, Tag, B } from '../kit';
import { C } from '../theme';
import { Panel, Screen, TokenCount, useSave } from './common';

export function Intro({ n, m }: { n: number; m: Mode }) {
  const S = useSave();
  const spin = m === 'spin', L = cfgFor(n, m), T = trackOf(m), stars = T.stars[n] || 0, best = T.best[n], cost = Server.cost();
  const feats = (spin
    ? [L.taps + ' flavours', L.slots + ' cups', 'Up to ' + L.maxLaps + ' laps', L.mix.duo || L.mix.uneven ? '2 layers' : null,
      L.topping !== null ? TOPPINGS[L.topping].name : null, L.dir < 0 ? 'Reverse spin' : null, L.persist ? 'Cleanup' : null]
    : [L.taps + (L.taps > 1 ? ' taps' : ' tap'), L.mix.trio ? '3 layers' : L.mix.duo || L.mix.uneven ? '2 layers' : null,
      L.topping !== null ? TOPPINGS[L.topping].name : null, L.creep ? 'Moving belt' : null, L.persist ? 'Cleanup' : null]
  ).filter((f): f is string => !!f);
  const upgrade = !spin && glassFor(n).tier > (S.flags.glass || 0) ? glassFor(n) : null;
  const body = L.intro || (L.boss
    ? 'End of the chapter and the line is out the door. A bigger quota to close it out.'
    : L.breather ? 'A calmer shift to start the new chapter. Rack up some Perfects.' : 'More practice with everything so far. Keep your combo alive.');

  return (
    <Screen>
      <Panel width={620} style={{ gap: 16 }} onClose={goHome} closeLabel="Back">
        <Row style={{ paddingRight: 60 }}>
          <Tag tone={spin ? 'razz' : 'berry'}>{`${spin ? 'Spin Bar' : 'Level'} ${n}`}</Tag>
          {L.isNew ? <Tag tone="mango">{`New: ${L.isNew}`}</Tag> : L.boss ? <Tag tone="razz">Big crowd</Tag> : L.breather ? <Tag tone="lime">Breather</Tag> : <Tag>{`Ch ${L.chapter} · ${L.chapterName}`}</Tag>}
          <Row style={{ gap: 2 }}><Stars n={stars} s={26} /></Row>
        </Row>
        <H2>{L.name}</H2>
        {upgrade && (
          <Card flat style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: C.razz, backgroundColor: '#F2FBFF', paddingVertical: 12, paddingHorizontal: 14 }}>
            <View style={{ position: 'absolute', top: -12, left: 12, zIndex: 1 }}><Tag tone="razz">Shack upgrade!</Tag></View>
            <Col style={{ gap: 0, flex: 1 }}><B>{upgrade.name}</B><Small>{upgrade.blurb}</Small></Col>
          </Card>
        )}
        <P>{body}</P>
        <Row style={{ gap: 10, flexWrap: 'wrap' }}>
          <Card flat style={{ paddingVertical: 16, gap: 2 }}><Small>Quota</Small><Num style={{ fontSize: 28 }}>{L.quota}</Num></Card>
          <Card flat style={{ paddingVertical: 16, gap: 2 }}><Small>Time</Small><Num style={{ fontSize: 28 }}>{L.dur}s</Num></Card>
          <Card flat style={{ paddingVertical: 16, gap: 2 }}><Small>Band</Small><Num style={{ fontSize: 28 }}>±{Math.round(L.tol)}</Num></Card>
          {!!best && <Card flat style={{ paddingVertical: 16, gap: 2 }}><Small>Best</Small><Num style={{ fontSize: 28 }}>{best.toLocaleString('en-US')}</Num></Card>}
        </Row>
        <Row style={{ gap: 6, flexWrap: 'wrap' }}>{feats.map(f => <Tag key={f}>{f}</Tag>)}</Row>
        {!S.flags.costNote && (
          <Small style={{ backgroundColor: C.cream2, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, overflow: 'hidden' }}>
            Tokens are spent when the round starts. Leaving a round partway still uses them, but if the app crashes before the round really begins, you get them back.
          </Small>
        )}
        <Row>
          <Btn tone="berry" size="big" label="Start" onPress={() => { setFlag('costNote', true); startLevel(n, m); }}>
            <BtnText tone="berry" size="big">Start</BtnText>
            <CostChip cost={cost}>{cost ? <TokenIcon s={18} /> : null}</CostChip>
          </Btn>
          <Spacer />
          <TokenCount />
        </Row>
        <Small>
          {spin ? 'Hold a flavour button while the cup is in the lit window.' : 'Hold the tap buttons to pour and swipe the counter to clean.'}
          {/* keyboard shortcuts belong to desktop web only, never to phones and tablets */}
          {keyHintsOn() && (spin ? ' Keys: A S D F G pour · Space topping · Esc pauses.' : ' Keys: A S D pour · Space sends · F topping · Esc pauses.')}
        </Small>
      </Panel>
    </Screen>
  );
}
