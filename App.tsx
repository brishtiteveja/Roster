import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, shadow, space, type as t } from './src/theme';
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
import { ChatOverlay } from './src/components/ChatOverlay';
import { GraduationOverlay } from './src/components/GraduationOverlay';
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
  const { state, openChat } = useStore();
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
  const matchConn = matchPartner
    ? state.connections.find(
        (c) =>
          c.weekIntroduced === state.week &&
          ((c.a === state.player.id && c.b === matchPartner) || (c.b === state.player.id && c.a === matchPartner))
      )
    : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.wordmark}>PORCH</Text>
        <Text style={styles.tag} numberOfLines={1}>{phaseTag(state.phase, state.week)}</Text>
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

      {state.chatOpen && <ChatOverlay connId={state.chatOpen} />}

      {showMatch && (
        <MatchOverlay
          partnerName={state.byId.get(matchPartner)?.name ?? matchPartner}
          partnerSeed={matchPartner}
          week={state.week}
          onHello={() => {
            setMatchSeenWeek(state.week);
            setTab('connections');
            if (matchConn) openChat(matchConn.id);
          }}
          onDismiss={() => setMatchSeenWeek(state.week)}
        />
      )}

      {(state.graduatePrompt || state.celebrate) && <GraduationOverlay />}
    </SafeAreaView>
  );
}

function TabButton({
  label, icon: Icon, active, onPress, badge,
}: {
  label: string;
  icon: (p: { color: string; size?: number; filled?: boolean }) => React.JSX.Element;
  active: boolean;
  onPress: () => void;
  badge?: number;
  sub?: string;
}) {
  const color = active ? colors.night : colors.muted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tab, active && styles.tabOn, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View>
        <Icon color={color} size={22} filled={active} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {active ? <Text style={styles.tabLabel}>{label}</Text> : null}
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
    paddingHorizontal: space(2.5), paddingVertical: space(1.5),
    backgroundColor: colors.night, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: space(1.5), flexShrink: 1 },
  wordmark: { color: colors.bone, ...t.wordmark },
  headerItalic: { color: colors.lamp, fontStyle: 'italic', fontSize: 14 },
  tag: { color: colors.muted, ...t.tiny, fontWeight: '600' },
  body: { flex: 1, backgroundColor: colors.ground },
  tabbar: {
    position: 'absolute',
    left: space(2), right: space(2),
    bottom: Platform.OS === 'ios' ? space(1) : space(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    ...shadow.lift,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 11, paddingHorizontal: 14, borderRadius: 999, flexShrink: 1,
  },
  tabOn: { backgroundColor: colors.lamp },
  tabLabel: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1, color: colors.night },
  badge: {
    position: 'absolute', top: -5, right: -10,
    backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: colors.night, fontSize: 10, fontWeight: '800' },
});
