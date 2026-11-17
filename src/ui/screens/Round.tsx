'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
// In-round panels: Pause, Results, Offer.
import { type Mode, type RoundResult } from '@/engine';
import { cfgFor, goHome, nextLevel, quitRound, restartRound, resumeRound, startLevel } from '@/game/controller';
import { glassFor } from '@/game/content';
import { show } from '@/game/ui-store';
import { track } from '@/services/analytics';
import { Sound } from '@/services/feedback';
import { MAX_LEVEL } from '@/engine';
import { save, type Rewards } from '@/services/save';
import { Server, maxFor } from '@/services/server';
import { Stars, TokenIcon } from '../icons';
import { B, Btn, BtnText, Card, Col, CostChip, H2, Num, P, Row, Small, Spacer, Stat, Tag } from '../kit';
import { OfferCard, Panel, Screen, resetIn, useSave } from './common';
import { SettingsToggles } from './Settings';

function PlayBtn({ title, onPress, big = true }: { title: string; onPress: () => void; big?: boolean }) {
  const cost = Server.cost();
  return (
    <Btn tone="berry" size={big ? 'big' : 'md'} onPress={onPress} label={title}>
      <BtnText tone="berry" size={big ? 'big' : 'md'}>{title}</BtnText>
      <CostChip cost={cost}>{cost ? <TokenIcon s={18} /> : null}</CostChip>
    </Btn>
  );
}

export function Pause() {
  useSave();
  return (
    <Screen>
      <Panel width={440}>
        <H2>Paused</H2>
        <Btn tone="lime" size="big" onPress={resumeRound}>Resume</Btn>
        <Btn onPress={restartRound} label="Restart">
          <BtnText>Restart</BtnText>
          <CostChip cost={Server.cost()} tone="default">{Server.cost() ? <TokenIcon s={18} /> : null}</CostChip>
        </Btn>
        <Btn onPress={quitRound}>Quit to menu</Btn>
        <Small>Quitting ends the round. The tokens it cost stay spent.</Small>
        <SettingsToggles compact />
      </Panel>
    </Screen>
  );
}

export function Results({ res, rw }: { res: RoundResult; rw: Partial<Rewards> }) {
  const S = useSave();
  const m = res.mode, spin = m === 'spin', L = cfgFor(res.level, m), maxL = maxFor(m);
  const title = res.win ? (res.stars === 3 ? 'Flawless!' : 'Quota met!') : res.reason === 'flooded' ? 'Flooded!' : "Time's up";
  const body = res.win
    ? rw.unlocked ? `Level ${rw.unlocked} is open.` : 'Nice shift.'
    : res.reason === 'flooded' ? 'The waste meter filled up. Release a bit earlier: the tap keeps dripping.'
      : spin ? `You served ${res.served} of ${res.quota}. Pick the flavour before the cup reaches the window, so every pass counts.`
        : `You served ${res.served} of ${res.quota}. Tap SEND as soon as the cups are full to keep the belt moving.`;
  const tokens = Server.tokens(), cost = Server.cost(), nextN = Math.min(res.level + 1, maxL);
  const glassNext = !spin && res.win && res.level < MAX_LEVEL && glassFor(res.level + 1).tier > glassFor(res.level).tier ? glassFor(res.level + 1) : null;

  // Plan §5.5: offer a top-up only when they can't afford a retry; after 3 fails suggest an easier level, never a purchase.
  let offer = null;
  if (tokens < cost) offer = <OfferCard short={cost - tokens} />;
  else if (!res.win && S.stats.fails >= 3 && res.level > 1) {
    offer = (
      <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Col style={{ gap: 2, flex: 1 }}><B>Tough one?</B><Small>{`Warm up on Level ${res.level - 1}, then come back.`}</Small></Col>
        <Btn size="sm" onPress={() => show({ name: 'intro', n: res.level - 1, m })}>{`Play Level ${res.level - 1}`}</Btn>
      </Card>
    );
  }

  return (
    <Screen>
      <Panel width={720}>
        <Row>
          <Tag tone={res.win ? 'lime' : 'berry'}>{`${spin ? 'Spin Bar' : 'Level'} ${res.level} · ${L.name}`}</Tag>
          <Spacer />
          <Row style={{ gap: 6 }}><Stars n={res.stars} /></Row>
        </Row>
        <Row style={{ alignItems: 'flex-end' }}>
          <H2 style={{ fontSize: 54, lineHeight: 58 }}>{title}</H2>
          <Spacer />
          <Col style={{ gap: 0, alignItems: 'flex-end' }}><Small>Score</Small><Num style={{ fontSize: 48, lineHeight: 50 }}>{res.score.toLocaleString('en-US')}</Num></Col>
        </Row>
        <P>{body}</P>
        <Row style={{ gap: 10 }}>
          <Stat grow k="Served" v={`${res.served}/${res.quota}`} />
          <Stat grow k="Perfect" v={res.perfect} />
          <Stat grow k="Accuracy" v={`${Math.round(res.accuracy * 100)}%`} />
          <Stat grow k="Waste" v={`${Math.round(res.wastePct * 100)}%`} />
          <Stat grow k="Best combo" v={res.bestCombo} />
        </Row>
        <Row style={{ gap: 14, flexWrap: 'wrap' }}>
          {!!res.timeBonus && <Small>{`Time bonus +${res.timeBonus}`}</Small>}
          {!!res.puddlePen && <Small>{`Puddles left ${res.puddlePen}`}</Small>}
          <Small>{res.spillCount ? `Spills: ${res.spills.minor} minor · ${res.spills.moderate} moderate · ${res.spills.major} major` : 'No spills'}</Small>
        </Row>
        <Row style={{ gap: 10, flexWrap: 'wrap' }}>
          <Tag tone="grape">{`+${rw.xp || 0} XP${rw.levelUp ? ' · Level up!' : ''}`}</Tag>
          <Tag tone="mango">{`+${rw.coins || 0} coins`}</Tag>
          {!!rw.tokens && <Tag tone="berry">{`+${rw.tokens} tokens`}</Tag>}
          {rw.spinUnlocked && <Tag tone="razz">New machine: Spin Bar is open!</Tag>}
          {glassNext && <Tag tone="razz">{`Next level: the shack gets ${glassNext.name.toLowerCase()}!`}</Tag>}
          {rw.challenge && <Tag tone="razz">{`Challenge done: ${rw.challenge}`}</Tag>}
        </Row>
        {offer}
        <Row style={{ marginTop: 4 }}>
          {res.win && res.level < maxL ? (
            <>
              <PlayBtn title="Next level" onPress={() => nextLevel(nextN, m)} />
              <Btn onPress={() => startLevel(res.level, m)}>Replay</Btn>
            </>
          ) : (
            <PlayBtn title="Try again" onPress={() => startLevel(res.level, m)} />
          )}
          <Spacer />
          <Btn onPress={goHome}>Menu</Btn>
        </Row>
      </Panel>
    </Screen>
  );
}

export function Offer({ short, n, m }: { short: number; n: number; m: Mode }) {
  useSave();
  const S = save(), ds = Server.dailyStatus();
  return (
    <Screen>
      <Panel width={560} onClose={() => { track('offer_dismissed'); goHome(); }}>
        <H2>{short === 1 ? 'One token short' : 'Out of tokens'}</H2>
        <P>{`Level ${n} costs ${Server.cost()} tokens and you have ${Server.tokens()}.`}</P>
        {ds.claimable ? (
          <Btn tone="lime" size="big" onPress={() => { const r = Server.claimDaily(); if (r.ok) Sound.sfx('coin'); show({ name: 'intro', n, m }); }}>{`Claim free refill +${ds.amount}`}</Btn>
        ) : (
          <Small>Free refill of {S.tune.daily} tokens in <Num style={{ fontSize: 17 }}>{resetIn()}</Num>.</Small>
        )}
        <OfferCard short={short} />
        <Btn size="sm" onPress={() => show({ name: 'shop' })} style={{ alignSelf: 'flex-start' }}>See all packs</Btn>
      </Panel>
    </Screen>
  );
}
