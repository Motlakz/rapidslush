'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CHAPTERS, SCHEDULE, SPIN_CHAPTERS, SPIN_SCHEDULE, type Mode } from '@/engine';
import { goHome } from '@/game/controller';
import { show } from '@/game/ui-store';
import { Sound } from '@/services/feedback';
import { maxFor, spinUnlocked, trackOf } from '@/services/server';
import { LockIcon, StarIcon } from '../icons';
import { B, Btn, BtnText, Col, H2, Row, Small, Tag } from '../kit';
import { C, F } from '../theme';
import { Panel, Screen, useSave } from './common';

export function Levels({ m: want }: { m: Mode }) {
  useSave();
  const m: Mode = want === 'spin' && spinUnlocked() ? 'spin' : 'belt';
  const P = trackOf(m), maxL = maxFor(m), sched = m === 'spin' ? SPIN_SCHEDULE : SCHEDULE;
  const chNames = m === 'spin' ? SPIN_CHAPTERS : CHAPTERS;
  const newAt: Record<number, string> = {};
  sched.forEach(t => (newAt[t.n] = t.isNew));
  const total = Object.values(P.stars).reduce((a, b) => a + b, 0);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const curCh = Math.ceil(Math.min(P.highest, maxL) / 10) - 1;

  return (
    <Screen>
      <Panel width={920} style={{ maxHeight: 680 }} onClose={goHome}>
        <Row>
          <H2>Beach Shack</H2>
          <Tag>{`${total} / ${maxL * 3} stars`}</Tag>
          <Row style={{ gap: 8, marginLeft: 8 }}>
            <Btn size="sm" flat tone={m === 'belt' ? 'ink' : 'default'} onPress={() => show({ name: 'levels', m: 'belt' })}><BtnText size="sm" tone={m === 'belt' ? 'ink' : 'default'}>Slush Line</BtnText></Btn>
            <Btn size="sm" flat tone={m === 'spin' ? 'ink' : 'default'} disabled={!spinUnlocked()} onPress={() => show({ name: 'levels', m: 'spin' })}>
              {!spinUnlocked() && <LockIcon s={14} />}<BtnText size="sm" tone={m === 'spin' ? 'ink' : 'default'}>Spin Bar</BtnText>
            </Btn>
          </Row>
        </Row>
        <ScrollView ref={scroll} style={{ maxHeight: 500 }} contentContainerStyle={{ gap: 18, paddingVertical: 8, paddingHorizontal: 6 }}
          onContentSizeChange={() => scroll.current?.scrollTo({ y: Math.max(0, curCh * 128 - 8), animated: false })}>
          {chNames.map((name, c) => {
            const from = c * 10 + 1;
            const stars = Array.from({ length: 10 }, (_, k) => P.stars[from + k] || 0).reduce((a, b) => a + b, 0);
            const news = sched.filter(t => t.n >= from && t.n < from + 10).map(t => t.isNew);
            return (
              <Col key={name} style={{ gap: 8 }}>
                <Row style={{ gap: 8 }}>
                  <B>{`Chapter ${c + 1} · ${name}`}</B>
                  <Small>{`${stars}/30 ★`}</Small>
                  <Small style={{ flex: 1, textAlign: 'right' }} >{news.join(' · ')}</Small>
                </Row>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {Array.from({ length: 10 }, (_, k) => {
                    const n = from + k, locked = n > P.highest, cur = n === P.highest, st = P.stars[n] || 0;
                    return (
                      <Pressable key={n} disabled={locked} accessibilityRole="button" accessibilityLabel={locked ? `Level ${n}, locked` : `Level ${n}, ${st} stars`}
                        onPress={() => { Sound.sfx('tap'); show({ name: 'intro', n, m }); }}
                        style={[sl.lvl, locked && sl.locked, cur && sl.cur]}>
                        {newAt[n] && <View style={sl.nw}><Text style={sl.nwText}>NEW</Text></View>}
                        {locked ? <LockIcon /> : <Text style={sl.n}>{n}</Text>}
                        {!locked && <View style={{ flexDirection: 'row', gap: 1 }}>{[1, 2, 3].map(s => <StarIcon key={s} on={s <= st} s={14} />)}</View>}
                      </Pressable>
                    );
                  })}
                </View>
              </Col>
            );
          })}
        </ScrollView>
        <Small>One new idea every few levels, with practice levels in between. Every 10th level has a bigger crowd, and each chapter opens with a calmer breather. Ski Lodge and Neon Arcade are planned as new locations.</Small>
      </Panel>
    </Screen>
  );
}

const sl = StyleSheet.create({
  lvl: {
    flex: 1, aspectRatio: 1, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: '#E2D8C6', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 2,
  },
  locked: { backgroundColor: '#ECE5D8', shadowOpacity: 0, elevation: 0 },
  cur: { backgroundColor: C.mango, shadowColor: C.mangoD },
  n: { fontFamily: F.num, fontSize: 26, color: C.ink },
  nw: { position: 'absolute', top: -8, right: -6, backgroundColor: C.berry, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, zIndex: 1 },
  nwText: { fontFamily: F.head, fontSize: 12, color: '#fff', letterSpacing: 0.4 },
});
