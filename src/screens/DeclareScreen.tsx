import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, space, radius, type as t } from '../theme';
import { WINDOWS } from '../data/cohort';
import { useStore } from '../state/store';
import { openPlayerConnections } from '../state/orchestration';
import { PARAMS } from '../engine';
import { Body, Card, Eyebrow, Muted, Pill, ScreenScroll } from '../components/ui';
import { Hero } from '../components/Hero';
import { Heartbeat } from '../components/Heartbeat';

export function DeclareScreen() {
  const { state, declare } = useStore();
  const open = openPlayerConnections(state).length;
  const atCap = open >= PARAMS.K_ACTIVE;

  return (
    <ScreenScroll>
      <Hero
        eyebrow={`Week ${state.week} · Monday, noon`}
        title="Do you have room this week?"
        subtitle={`You hold ${open} of ${PARAMS.K_ACTIVE} connections. Declaring In puts you on this week's boards — and puts others on yours.`}
        avatarSeed="you"
        avatarName="You"
      />

      <Card>
        <Heartbeat active="declare" />
      </Card>

      <Card>
        <Eyebrow>Your declared windows</Eyebrow>
        <View style={styles.windows}>
          {state.player.windows.map((w) => (
            <Pill key={w} tone="muted">{WINDOWS[w]}</Pill>
          ))}
        </View>
        <Muted>Overlap is half of your affinity to anyone else.</Muted>
      </Card>

      {atCap ? (
        <Card lit>
          <Eyebrow tone="lamp">At capacity</Eyebrow>
          <Body>
            Two connections is the whole capacity, so a pick means something. You won't appear on boards until
            one closes — but you can still tend the two you have.
          </Body>
          <ChoiceCard
            title="Continue the week"
            subtitle="Skip the board, keep your connections"
            tone="lamp"
            onPress={() => declare('paused')}
          />
        </Card>
      ) : (
        <View style={{ gap: space(1.5) }}>
          <ChoiceCard
            title="I'm In"
            subtitle="Build my board of six with room"
            tone="lamp"
            big
            onPress={() => declare('in')}
          />
          <ChoiceCard
            title="Paused this week"
            subtitle="Silent and costless — no one is told"
            tone="muted"
            onPress={() => declare('paused')}
          />
        </View>
      )}
    </ScreenScroll>
  );
}

function ChoiceCard({
  title, subtitle, tone, onPress, big,
}: {
  title: string; subtitle: string; tone: 'lamp' | 'muted'; onPress: () => void; big?: boolean;
}) {
  const accent = tone === 'lamp' ? colors.lamp : colors.muted;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        { borderColor: accent, opacity: pressed ? 0.85 : 1 },
        tone === 'lamp' && { backgroundColor: colors.lampSoft },
        big && { paddingVertical: space(2.75) },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.choiceTitle, { color: tone === 'lamp' ? colors.lamp : colors.bone }]}>{title}</Text>
        <Text style={styles.choiceSub}>{subtitle}</Text>
      </View>
      <Text style={[styles.arrow, { color: accent }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  windows: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1), marginVertical: space(0.5) },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: space(1.5),
    borderWidth: 1.4, borderRadius: radius.lg, paddingVertical: space(2), paddingHorizontal: space(2.25),
    backgroundColor: colors.panel,
  },
  choiceTitle: { ...t.h2, color: colors.bone },
  choiceSub: { color: colors.muted, fontSize: 13.5, marginTop: 2 },
  arrow: { fontSize: 24, fontWeight: '700' },
});
