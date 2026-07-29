import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, space, type as t } from './src/theme';
import { StoreProvider, useStore } from './src/state/store';
import { openCheckpointsForPlayer, openPlayerConnections } from './src/state/orchestration';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DeclareScreen } from './src/screens/DeclareScreen';
import { BoardScreen } from './src/screens/BoardScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { ConnectionsScreen } from './src/screens/ConnectionsScreen';
import { ObservatoryScreen } from './src/screens/ObservatoryScreen';
import { SeasonEndScreen } from './src/screens/SeasonEndScreen';

type Tab = 'flow' | 'connections' | 'observatory';

function phaseTag(phase: string, week: number): string {
  switch (phase) {
    case 'ONBOARDING': return 'PERSONA';
    case 'DECLARE': return `WK ${week} · MON 12:00`;
    case 'PICK': return `WK ${week} · YOUR BOARD`;
    case 'RESULTS': return `WK ${week} · MON 18:00`;
    case 'SEASON_END': return 'SEASON CLOSED';
    default: return '';
  }
}

function Shell() {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('flow');
  const onboarding = state.phase === 'ONBOARDING';
  const activeTab = onboarding ? 'flow' : tab;

  const flowScreen = () => {
    switch (state.phase) {
      case 'ONBOARDING': return <OnboardingScreen />;
      case 'DECLARE': return <DeclareScreen />;
      case 'PICK': return <BoardScreen />;
      case 'RESULTS': return <ResultsScreen />;
      case 'SEASON_END': return <SeasonEndScreen />;
      default: return <DeclareScreen />;
    }
  };

  const openCount = openPlayerConnections(state).length;
  const pending = openCheckpointsForPlayer(state).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.wordmark}>ROSTER</Text>
          <Text style={styles.headerItalic}>availability, cleared</Text>
        </View>
        <Text style={styles.tag}>{phaseTag(state.phase, state.week)}</Text>
      </View>

      <View style={styles.body}>
        {activeTab === 'flow' && flowScreen()}
        {activeTab === 'connections' && <ConnectionsScreen />}
        {activeTab === 'observatory' && <ObservatoryScreen />}
      </View>

      {!onboarding && (
        <View style={styles.tabbar}>
          <TabButton label="This week" active={activeTab === 'flow'} onPress={() => setTab('flow')} />
          <TabButton
            label="Connections"
            active={activeTab === 'connections'}
            badge={pending || undefined}
            sub={`${openCount}/2`}
            onPress={() => setTab('connections')}
          />
          <TabButton label="Observatory" active={activeTab === 'observatory'} onPress={() => setTab('observatory')} />
        </View>
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label, active, onPress, badge, sub,
}: {
  label: string; active: boolean; onPress: () => void; badge?: number; sub?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.tabLabel, active && { color: colors.lamp }]}>{label}</Text>
        {sub ? <Text style={styles.tabSub}>{sub}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {active && <View style={styles.tabUnderline} />}
    </Pressable>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.night, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space(2.5), paddingVertical: space(1.75),
    backgroundColor: colors.night, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: space(1.5) },
  wordmark: { color: colors.bone, ...t.wordmark },
  headerItalic: { color: colors.lamp, fontStyle: 'italic', fontSize: 14 },
  tag: { color: colors.muted, ...t.tiny, fontWeight: '600' },
  body: { flex: 1, backgroundColor: colors.ground },
  tabbar: {
    flexDirection: 'row', backgroundColor: colors.night,
    borderTopWidth: 1, borderTopColor: colors.line,
    paddingBottom: Platform.OS === 'ios' ? space(2) : space(1),
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: space(1.5), flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabLabel: { color: colors.muted, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  tabSub: { color: colors.muted, fontSize: 10, textAlign: 'center', opacity: 0.7 },
  tabUnderline: { position: 'absolute', top: 0, height: 2, width: 40, backgroundColor: colors.lamp, borderRadius: 2 },
  badge: { backgroundColor: colors.lamp, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: colors.night, fontSize: 11, fontWeight: '700' },
});
