'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
// In-round panels: Pause, Results, and the Lives panel (also opened from the top bar).
import { type Mode, type RoundResult } from '@/engine';
import { App, cfgFor, goHome, nextLevel, quitRound, restartRound, resumeRound, startLevel } from '@/game/controller';
import { MACHINE } from '@/game/machines';
import { glassFor } from '@/game/content';
import { show } from '@/game/ui-store';
import { C } from '../theme';
import { track } from '@/services/analytics';
import { MAX_LEVEL } from '@/engine';
import { type Rewards } from '@/services/save';
import { Server, maxFor, trackOf } from '@/services/server';
import { HeartIcon, Stars } from '../icons';
import { B, Btn, BtnText, Card, Col, CostChip, H2, Num, P, Row, Small, Spacer, Stat, Tag } from '../kit';
import { LivesCard, Panel, Screen, useLives, useSave } from './common';
import { SettingsToggles } from './Settings';

/** Play button with what it puts at stake: a heart on a new level, Free on a beaten one. */
function PlayBtn({ title, onPress, n, m, big = true }: { title: string; onPress: () => void; n: number; m: Mode; big?: boolean }) {
  const risk = Server.atRisk(n, m);
  return (
    <Btn tone="berry" size={big ? 'big' : 'md'} onPress={onPress} label={title}>
      <BtnText tone="berry" size={big ? 'big' : 'md'}>{title}</BtnText>
      <CostChip cost={risk ? 1 : 0}>{risk ? <HeartIcon s={20} /> : null}</CostChip>
    </Btn>
  );
}

export function Pause() {
  useSave();
  const r = App.round, risk = !!App.session?.life, again = !!r && Server.atRisk(r.n, r.mode);
  return (
    <Screen>
      <Panel width={600}>
        <H2>Paused</H2>
        <Btn tone="lime" size="big" onPress={resumeRound}>Resume</Btn>
        <Btn onPress={restartRound} label="Restart">
          <BtnText>Restart</BtnText>
          <CostChip cost={again ? 1 : 0} tone="default">{again ? <HeartIcon s={20} /> : null}</CostChip>
        </Btn>
        <Btn onPress={quitRound}>Quit to menu</Btn>
        <Small>{risk ? 'Quitting or restarting counts as a miss: the life this round put on the line stays spent.' : 'This level is beaten, so leaving costs nothing.'}</Small>
        <SettingsToggles compact />
      </Panel>
    </Screen>
  );
}

export function Results({ res, rw }: { res: RoundResult; rw: Partial<Rewards> }) {
  const S = useSave();
  const m = res.mode, M = MACHINE[m], L = cfgFor(res.level, m), maxL = maxFor(m);
  const title = res.win ? (res.stars === 3 ? 'Flawless!' : 'Quota met!') : res.reason === 'flooded' ? 'Flooded!' : "Time's up";
  const body = res.win
    ? rw.unlocked ? `Level ${rw.unlocked} is open.` : 'Nice shift.'
    : res.reason === 'flooded' ? 'The waste meter filled up. Release a bit earlier: the tap keeps dripping.'
      : `You served ${res.served} of ${res.quota}. ${M.failHint}`;
  const lives = Server.lives(), nextN = Math.min(res.level + 1, maxL);
  const glassNext = m === 'belt' && res.win && res.level < MAX_LEVEL && glassFor(res.level + 1).tier > glassFor(res.level).tier ? glassFor(res.level + 1) : null;

  // Out of lives for a retry: say when the next one comes and how to keep playing. After 3 fails suggest an easier level.
  // The suggestion is anchored to their top level (the wall), not to whichever level they just replayed: it stays one
  // or two below the wall instead of drifting further down with every warm-up round. Label and target share one
  // variable, so the button always starts exactly the level it names.
  const wall = Math.min(trackOf(m).highest, maxL);
  const warm = Math.max(1, Math.max(wall - 2, Math.min(res.level, wall) - 1));
  let offer = null;
  if (!res.win && lives.n <= 0 && Server.atRisk(res.level, m)) {
    offer = (
      <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 16, borderColor: C.berry }}>
        <Col style={{ gap: 4, flex: 1 }}><B>Out of lives</B><LivesCard compact /></Col>
        <Btn size="sm" onPress={() => show({ name: 'levels', m })}>Replay a beaten level</Btn>
      </Card>
    );
  }
  else if (!res.win && S.stats.fails >= 3 && warm < res.level) {
    offer = (
      <Card flat style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Col style={{ gap: 2, flex: 1 }}><B>Tough one?</B><Small>{`Warm up on Level ${warm}, then come back.`}</Small></Col>
        <Btn size="sm" onPress={() => show({ name: 'intro', n: warm, m })}>{`Play Level ${warm}`}</Btn>
      </Card>
    );
  }

  return (
    <Screen>
      <Panel width={960} footer={(
        <Row style={{ marginTop: 4 }}>
          {res.win && res.level < maxL ? (
            <>
              <PlayBtn title="Next level" n={nextN} m={m} onPress={() => nextLevel(nextN, m)} />
              <Btn onPress={() => startLevel(res.level, m)}>Replay</Btn>
            </>
          ) : (
            <PlayBtn title="Try again" n={res.level} m={m} onPress={() => startLevel(res.level, m)} />
          )}
          <Spacer />
          <Btn onPress={goHome}>Menu</Btn>
        </Row>
      )}>
        <Row>
          <Tag tone={res.win ? 'lime' : 'berry'}>{`${m === 'belt' ? 'Level' : M.name} ${res.level} · ${L.name}`}</Tag>
          <Spacer />
          <Row style={{ gap: 6 }}><Stars n={res.stars} /></Row>
        </Row>
        <Row style={{ alignItems: 'flex-end' }}>
          <H2 style={{ fontSize: 54, lineHeight: 58 }}>{title}</H2>
          <Spacer />
          <Col style={{ gap: 0, alignItems: 'flex-end' }}><Small>Score</Small><Num style={{ fontSize: 48, lineHeight: 50 }}>{res.score.toLocaleString('en-US')}</Num></Col>
        </Row>
        <P>{body}</P>
        <Row style={{ gap: 10, flexWrap: 'wrap' }}>
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
          {rw.lifeBack && <Tag tone="berry">Life kept</Tag>}
          {!!rw.lives && <Tag tone="berry">{`+${rw.lives} life`}</Tag>}
          {rw.opened && <Tag tone="razz">{`New machine: ${MACHINE[rw.opened].name} is open!`}</Tag>}
          {glassNext && <Tag tone="razz">{`Next level: the shack gets ${glassNext.name.toLowerCase()}!`}</Tag>}
          {rw.challenge && <Tag tone="razz">{`Challenge done: ${rw.challenge}`}</Tag>}
        </Row>
        {offer}
      </Panel>
    </Screen>
  );
}

/**
 * Lives: the hearts, the countdown, a coin refill. Opened from the top bar, or with a level when a start was
 * blocked by an empty heart bar, in which case it offers to start that level the moment a life comes back.
 */
export function LivesPanel({ n, m }: { n?: number; m?: Mode }) {
  const L = useLives(), blocked = n !== undefined && m !== undefined;
  return (
    <Screen>
      <Panel width={560} onClose={() => { if (blocked) track('out_of_lives_dismissed'); goHome(); }}>
        <H2>{blocked && L.n <= 0 ? 'Out of lives' : 'Lives'}</H2>
        {blocked && <P>{L.n > 0 ? 'A life is back. Ready when you are.' : `Level ${n} is new, so it needs a life.`}</P>}
        <LivesCard />
        <Row style={{ gap: 10, flexWrap: 'wrap' }}>
          {blocked && L.n > 0 && <PlayBtn title={`Play level ${n}`} n={n!} m={m!} onPress={() => startLevel(n!, m!)} />}
          <Btn onPress={() => show({ name: 'levels', m: m ?? 'belt' })}>Replay a beaten level</Btn>
        </Row>
      </Panel>
    </Screen>
  );
}
