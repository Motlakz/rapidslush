'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { StyleSheet, Text, View } from 'react-native';

import { useUI } from '@/game/ui-store';
import { Home } from './screens/Home';
import { Intro } from './screens/Intro';
import { Levels } from './screens/Levels';
import { LivesPanel, Pause, Results } from './screens/Round';
import { Settings } from './screens/Settings';
import { Collection, Wallet } from './screens/Shop';
import { useUi } from './scale';
import { C, F, shadow } from './theme';

export function Overlays() {
  const o = useUI(s => s.overlay);
  switch (o.name) {
    case 'home': return <Home />;
    case 'intro': return <Intro key={`${o.m}${o.n}`} n={o.n} m={o.m} />;
    case 'levels': return <Levels m={o.m} />;
    case 'pause': return <Pause />;
    case 'results': return <Results res={o.res} rw={o.rw} />;
    case 'lives': return <LivesPanel n={o.n} m={o.m} />;
    case 'wallet': return <Wallet />;
    case 'collection': return <Collection />;
    case 'settings': return <Settings />;
    default: return null;
  }
}

export function Toast() {
  const t = useUI(s => s.toast);
  const { safe } = useUi();
  if (!t) return null;
  return (
    <View pointerEvents="none" style={[st.wrap, { paddingTop: 22 + safe.top }]}>
      <View style={st.toast}><Text style={st.text}>{t.s}</Text></View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  toast: { backgroundColor: C.ink, paddingVertical: 15, paddingHorizontal: 24, borderRadius: 999, ...shadow },
  text: { fontFamily: F.head, fontSize: 18, color: '#fff' },
});
