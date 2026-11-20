'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CHAPTERS, SCHEDULE, SPIN_CHAPTERS, SPIN_SCHEDULE, type Mode } from '@/engine';
import { goHome } from '@/game/controller';
import { show } from '@/game/ui-store';
import { track } from '@/services/analytics';
import { Sound } from '@/services/feedback';
import { maxFor, spinUnlocked, trackOf } from '@/services/server';
import { LockIcon, StarIcon } from '../icons';
import { B, Btn, BtnText, Col, H2, Row, Small } from '../kit';
import { C, F } from '../theme';
import { useUi } from '../scale';
import { Panel, Screen, useSave } from './common';

export function Levels({ m: want }: { m: Mode }) {
  useSave();
  const m: Mode = want === 'spin' && spinUnlocked() ? 'spin' : 'belt';
  const P = trackOf(m), maxL = maxFor(m), sched = m === 'spin' ? SPIN_SCHEDULE : SCHEDULE;
  const chNames = m === 'spin' ? SPIN_CHAPTERS : CHAPTERS;
  // Short screens (landscape phones) keep the grid in view: a one-line header, a smaller title, no footer note.
  const { availH } = useUi(), compact = availH < 560;
  const newAt: Record<number, string> = {};
  sched.forEach(t => (newAt[t.n] = t.isNew));
  const total = Object.values(P.stars).reduce((a, b) => a + b, 0);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const curCh = Math.ceil(Math.min(P.highest, maxL) / 10) - 1;

  const machines = (
    <Row style={{ gap: 8, flexWrap: 'wrap' }}>
      <Btn size="sm" flat tone={m === 'belt' ? 'ink' : 'default'} onPress={() => { track('machine_selected', { machine: 'belt', source: 'level_select' }); show({ name: 'levels', m: 'belt' }); }}><BtnText size="sm" tone={m === 'belt' ? 'ink' : 'default'}>Slush Line</BtnText></Btn>
      <Btn size="sm" flat tone={m === 'spin' ? 'ink' : 'default'} disabled={!spinUnlocked()} onPress={() => { track('machine_selected', { machine: 'spin', source: 'level_select' }); show({ name: 'levels', m: 'spin' }); }}>
        {!spinUnlocked() && <LockIcon s={14} />}<BtnText size="sm" tone={m === 'spin' ? 'ink' : 'default'}>Spin Bar</BtnText>
      </Btn>
    </Row>
  );

  return (
    <Screen>
      <Panel width={920} scroll={false} onClose={goHome} style={compact ? { padding: 22, gap: 10 } : undefined}>
        {/* Header: title and star total centred on one line, clear of the close button; the machine switch sits under
            it, or on the same line on short screens. Wraps instead of squeezing on narrow ones. */}
        <View style={[sl.head, compact && { gap: 8 }]}>
          <View style={sl.titleRow}>
            <H2 style={[sl.title, compact && sl.titleSm]}>Beach Shack</H2>
            <View style={sl.total} accessible accessibilityLabel={`${total} of ${maxL * 3} stars`}>
              <StarIcon on s={22} /><Text style={sl.totalN}>{total}</Text><Small>{`/ ${maxL * 3}`}</Small>
            </View>
            {compact && machines}
          </View>
          {!compact && machines}
        </View>
        <ScrollView ref={scroll} style={sl.scroll} contentContainerStyle={[sl.list, compact && { gap: 18 }]}
          onContentSizeChange={(_, h) => scroll.current?.scrollTo({ y: Math.max(0, (h / chNames.length) * curCh - 8), animated: false })}>
          {chNames.map((name, c) => {
            const from = c * 10 + 1;
            const stars = Array.from({ length: 10 }, (_, k) => P.stars[from + k] || 0).reduce((a, b) => a + b, 0);
            const news = sched.filter(t => t.n >= from && t.n < from + 10).map(t => t.isNew);
            return (
              <Col key={name} style={sl.chapter}>
                {/* chapter label, then room for the NEW badges that hang above the tiles */}
                <View style={sl.chHead}>
                  <B>{`Chapter ${c + 1} · ${name}`}</B>
                  <Small>{`${stars}/30 ★`}</Small>
                  {!!news.length && <Small style={sl.news}>{news.join(' · ')}</Small>}
                </View>
                <View style={sl.grid}>
                  {Array.from({ length: 10 }, (_, k) => {
                    const n = from + k, locked = n > P.highest, cur = n === P.highest, st = P.stars[n] || 0;
                    return (
                      <Pressable key={n} disabled={locked} accessibilityRole="button" accessibilityLabel={locked ? `Level ${n}, locked` : `Level ${n}, ${st} stars`}
                        onPress={() => { Sound.sfx('tap'); track('level_selected', { machine: m, level: n }); show({ name: 'intro', n, m }); }}
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
        {!compact && <Small style={sl.foot}>One new idea every few levels, with practice levels in between. Every 10th level has a bigger crowd, and each chapter opens with a calmer breather. Ski Lodge and Neon Arcade are planned as new locations.</Small>}
      </Panel>
    </Screen>
  );
}

const sl = StyleSheet.create({
  head: { gap: 12, paddingRight: 64 }, // the close button sits top-right
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  title: { marginVertical: 0 },
  titleSm: { fontSize: 32, lineHeight: 38 },
  total: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.cream2, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  totalN: { fontFamily: F.num, fontSize: 18, color: C.ink },
  scroll: { flexGrow: 0, flexShrink: 1, marginHorizontal: -6 },
  list: { gap: 26, paddingTop: 6, paddingBottom: 12, paddingHorizontal: 12 },
  chapter: { gap: 18 },
  chHead: { flexDirection: 'row', alignItems: 'baseline', columnGap: 10, rowGap: 2, flexWrap: 'wrap' },
  news: { flexShrink: 1, marginLeft: 'auto', textAlign: 'right' },
  grid: { flexDirection: 'row', gap: 10 },
  foot: { paddingTop: 12, borderTopWidth: 1.5, borderTopColor: C.line },
  lvl: {
    flex: 1, aspectRatio: 1, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 2,
    shadowColor: '#E2D8C6', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 2,
  },
  locked: { backgroundColor: '#ECE5D8', shadowOpacity: 0, elevation: 0 },
  cur: { backgroundColor: C.mango, shadowColor: C.mangoD },
  n: { fontFamily: F.num, fontSize: 26, color: C.ink },
  nw: { position: 'absolute', top: -12, right: -10, backgroundColor: C.berry, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, zIndex: 1 },
  nwText: { fontFamily: F.head, fontSize: 16, color: '#fff', letterSpacing: 0.4 },
});
