'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { TOPPINGS, type Mode } from '@/engine';
import { cfgFor, goHome, keyHintsOn, startLevel } from '@/game/controller';
import { glassFor } from '@/game/content';
import { setFlag } from '@/services/save';
import { Server, trackOf } from '@/services/server';
import { HeartIcon, Stars } from '../icons';
import { BtnText, Btn, Card, Col, CostChip, H2, Num, P, Row, Small, Spacer, Tag, B } from '../kit';
import { C } from '../theme';
import { Hearts, Panel, Screen, useSave } from './common';

export function Intro({ n, m }: { n: number; m: Mode }) {
  const S = useSave();
  const spin = m === 'spin', L = cfgFor(n, m), T = trackOf(m), stars = T.stars[n] || 0, best = T.best[n], risk = Server.atRisk(n, m);
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
          <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: C.razz, backgroundColor: '#F2FBFF', paddingVertical: 12, paddingHorizontal: 14 }}>
            <Col style={{ gap: 0, flex: 1 }}><B>{upgrade.name}</B><Small>{upgrade.blurb}</Small></Col>
            <Tag tone="razz">Shack upgrade!</Tag>
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
        {(!S.flags.livesNote || !risk) && (
          <Small style={{ backgroundColor: C.cream2, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, overflow: 'hidden' }}>
            {risk
              ? 'A new level puts one life on the line. Meet the quota and you keep it. Quitting partway counts as a miss.'
              : "You've beaten this level, so replaying it is free."}
          </Small>
        )}
        <Row>
          <Btn tone="berry" size="big" label="Start" onPress={() => { if (risk) setFlag('livesNote', true); startLevel(n, m); }}>
            <BtnText tone="berry" size="big">Start</BtnText>
            <CostChip cost={risk ? 1 : 0}>{risk ? <HeartIcon s={20} /> : null}</CostChip>
          </Btn>
          <Spacer />
          <Hearts s={26} />
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
