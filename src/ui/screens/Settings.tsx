'use no memo'; // reads mutable game state (save, controller); compiler memoisation would show stale values
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { goHome, newAttract } from '@/game/controller';
import { show, toast } from '@/game/ui-store';
import { recentEvents } from '@/services/analytics';
import { updateSettings, updateTune, wipeSave, type Settings as S } from '@/services/save';
import { Server, unlockAll } from '@/services/server';
import { Btn, Col, H2, H3, Row, Small, Stepper, Tag, Toggle } from '../kit';
import { C } from '../theme';
import { Panel, Screen, useSave } from './common';

type BoolKey = { [K in keyof S]: S[K] extends boolean ? K : never }[keyof S];

export function SettingsToggles({ compact }: { compact?: boolean }) {
  const st = useSave().settings;
  const flip = (k: BoolKey) => updateSettings({ [k]: !st[k] });
  return (
    <View>
      <Toggle label="Sound" on={st.sound} onChange={() => flip('sound')} />
      {!compact && <Stepper label="Effects volume" value={st.sfxVol} min={0} max={1} step={0.1} fmt={v => `${Math.round(v * 100)}%`} onChange={v => updateSettings({ sfxVol: v })} />}
      {!compact && <Stepper label="Pour sound" value={st.pourVol} min={0} max={1} step={0.1} fmt={v => `${Math.round(v * 100)}%`} onChange={v => updateSettings({ pourVol: v })} />}
      <Toggle label="Vibration" on={st.haptics} onChange={() => flip('haptics')} />
      <Toggle label="Reduced effects" on={st.reduced} onChange={() => flip('reduced')} />
    </View>
  );
}

export function Settings() {
  const Sv = useSave(), T = Sv.tune;
  const [armed, setArmed] = useState(false);
  const tune = (k: 'accel' | 'tol' | 'dwell' | 'cost' | 'daily', v: number) => updateTune({ [k]: v });
  return (
    <Screen>
      <Panel width={920} style={{ maxHeight: 680, flexDirection: 'row', gap: 28 }} onClose={goHome}>
        <Col style={{ flex: 1, gap: 8 }}>
          <H2>Settings</H2>
          <SettingsToggles />
          <Row style={{ marginTop: 14, gap: 10 }}>
            <Btn size="sm" onPress={() => show({ name: 'wallet' })}>Wallet history</Btn>
            <Btn size="sm" tone={armed ? 'berry' : 'default'} onPress={async () => {
              if (!armed) return setArmed(true);
              await wipeSave(); Server.bootstrap(); newAttract(); goHome(); toast('Progress reset');
            }}>{armed ? 'Tap again to wipe' : 'Reset progress'}</Btn>
          </Row>
          <Small style={{ marginTop: 8 }}>{`Prototype build · ${Sv.ledger.length} ledger rows`}</Small>
        </Col>
        <Col style={{ flex: 1, gap: 4 }}>
          <Row style={{ paddingRight: 60 }}><H3>Tuning</H3><Tag tone="mango">prototype only</Tag></Row>
          <Stepper label="Flow ramp ×" value={T.accel} min={0.5} max={2} step={0.1} onChange={v => tune('accel', v)} />
          <Stepper label="Band width ×" value={T.tol} min={0.5} max={2} step={0.1} onChange={v => tune('tol', v)} />
          <Stepper label="Belt pause ×" value={T.dwell} min={0.5} max={2} step={0.1} onChange={v => tune('dwell', v)} />
          <Stepper label="Round cost" value={T.cost} min={0} max={5} step={1} onChange={v => tune('cost', v)} />
          <Stepper label="Daily free tokens" value={T.daily} min={0} max={20} step={1} onChange={v => tune('daily', v)} />
          <Toggle label="Unlimited tokens" on={T.infinite} onChange={() => updateTune({ infinite: !T.infinite })} />
          <Row style={{ gap: 8, marginVertical: 8 }}>
            <Btn size="sm" onPress={() => { unlockAll(); toast('All levels and machines unlocked'); }}>Unlock all levels</Btn>
            <Btn size="sm" onPress={() => Server.devCoins(500)}>+500 coins</Btn>
          </Row>
          <ScrollView style={{ maxHeight: 150, backgroundColor: C.ink, borderRadius: 14, padding: 12 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 16, color: '#CFCBE0' }}>
              {recentEvents().map(e => `${e.t} ${e.name} ${JSON.stringify(e.props)}`).join('\n') || 'analytics events appear here'}
            </Text>
          </ScrollView>
        </Col>
      </Panel>
    </Screen>
  );
}
