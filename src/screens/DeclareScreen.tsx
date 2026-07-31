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
        title="Got room for someone?"
        subtitle={`${open} of ${PARAMS.K_ACTIVE} spots full. Say you're in, get six.`}
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
        <Muted>Shared free time is half of why you match.</Muted>
      </Card>

      {atCap ? (
        <Card lit>
          <Eyebrow tone="lamp">Hands full — enviably</Eyebrow>
          <Body>
            Two is the whole roster, and yours is full. You won't appear on boards until a spot opens —
            which is exactly what makes being on yours mean something.
          </Body>
          <ChoiceCard
            title="Tend what you have"
            subtitle="Skip the board, keep the sparks"
            tone="lamp"
            onPress={() => declare('paused')}
          />
        </Card>
      ) : (
        <View style={{ gap: space(1.5) }}>
          <ChoiceCard
            title="I'm in"
            subtitle="Six people. All said yes."
            tone="lamp"
            big
            onPress={() => declare('in')}
          />
          <ChoiceCard
            title="Sitting this week out"
            subtitle="Nobody's told. Nothing counts against you."
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
