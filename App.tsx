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
import { ProfileScreen } from './src/screens/ProfileScreen';
import { MatchOverlay } from './src/components/MatchOverlay';
import { DeckIcon, HeartIcon, PulseIcon, PersonIcon } from './src/components/icons';

type Tab = 'flow' | 'connections' | 'observatory' | 'profile';

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
  const [matchSeenWeek, setMatchSeenWeek] = useState(0);
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

  const matchPartner = state.playerIntrosThisWeek[0];
  const showMatch =
    state.phase === 'RESULTS' && !!matchPartner && matchSeenWeek !== state.week;

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
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {!onboarding && (
        <View style={styles.tabbar}>
          <TabButton label="This week" icon={DeckIcon} active={activeTab === 'flow'} onPress={() => setTab('flow')} />
          <TabButton
            label="Connections"
            icon={HeartIcon}
            active={activeTab === 'connections'}
            badge={pending || undefined}
            sub={`${openCount}/2`}
            onPress={() => setTab('connections')}
          />
          <TabButton label="Observatory" icon={PulseIcon} active={activeTab === 'observatory'} onPress={() => setTab('observatory')} />
          <TabButton label="Profile" icon={PersonIcon} active={activeTab === 'profile'} onPress={() => setTab('profile')} />
        </View>
      )}

      {showMatch && (
        <MatchOverlay
          partnerName={state.byId.get(matchPartner)?.name ?? matchPartner}
          partnerSeed={matchPartner}
          week={state.week}
          onHello={() => { setMatchSeenWeek(state.week); setTab('connections'); }}
          onDismiss={() => setMatchSeenWeek(state.week)}
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({
  label, icon: Icon, active, onPress, badge, sub,
}: {
  label: string;
  icon: (p: { color: string; size?: number }) => React.JSX.Element;
  active: boolean;
  onPress: () => void;
  badge?: number;
  sub?: string;
}) {
  const color = active ? colors.lamp : colors.muted;
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <View style={{ alignItems: 'center', gap: 3 }}>
        <View>
          <Icon color={color} size={23} />
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
        {sub ? <Text style={styles.tabSub}>{sub}</Text> : null}
      </View>
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
  tab: { flex: 1, alignItems: 'center', paddingVertical: space(1.25), justifyContent: 'center' },
  tabLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  tabSub: { color: colors.muted, fontSize: 9.5, textAlign: 'center', opacity: 0.7 },
  tabUnderline: { position: 'absolute', top: 0, height: 2, width: 36, backgroundColor: colors.lamp, borderRadius: 2 },
  badge: {
    position: 'absolute', top: -5, right: -10,
    backgroundColor: colors.lamp, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: colors.night, fontSize: 10, fontWeight: '800' },
});
