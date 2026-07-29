import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { useStore } from '../state/store';
import { playerConnections } from '../state/orchestration';
import { Body, Button, Card, Eyebrow, H1, H2, Muted, ScreenScroll } from '../components/ui';
import { ConnectionCard } from '../components/ConnectionCard';

export function SeasonEndScreen() {
  const { state, reset } = useStore();
  const conns = playerConnections(state);
  const graduated = conns.filter((c) => c.state === 'GRADUATED');
  const kept = conns.filter((c) => c.state === 'ACTIVE' || c.state === 'CHECKPOINT_OPEN');
  const totalIntros = conns.length;
  const cohortIntros = state.metrics.reduce((s, m) => s + m.introductions, 0);

  return (
    <ScreenScroll>
      <View>
        <Eyebrow tone="lamp">Season 0 · six weeks · complete</Eyebrow>
        <H1>{graduated.length ? 'You graduated.' : 'Season closed.'}</H1>
        <Muted style={{ marginTop: space(1) }}>
          The mission metric is graduations — couples who leave together. It's reported, never optimised. They
          profit when you stay; Roster celebrates when you leave.
        </Muted>
      </View>

      <Card good={graduated.length > 0}>
        <View style={styles.stats}>
          <Stat n={totalIntros} label="introductions you made" />
          <Stat n={graduated.length} label="graduations" tone="verdigris" />
          <Stat n={kept.length} label="carried into next season" />
        </View>
        <Muted>Across the cohort: {cohortIntros} introductions cleared over the season.</Muted>
      </Card>

      {graduated.map((c) => (
        <ConnectionCard key={c.id} conn={c} />
      ))}

      <Card>
        <H2>What the twin was for</H2>
        <Body>
          Most apps A/B test on people. This one tested every rule on a twin first — the same deterministic
          engine you just played — then runs one season by hand. Nothing in the demo left this box.
        </Body>
      </Card>

      <Button label="Run another season (new seed)" onPress={() => reset('roster-season-0::' + state.week + Date.now())} />
    </ScreenScroll>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone?: 'verdigris' }) {
  return (
    <View style={styles.stat}>
      <Body style={{ color: tone === 'verdigris' ? colors.verdigris : colors.lamp, fontSize: 28, fontWeight: '700' }}>{n}</Body>
      <Muted style={{ textAlign: 'center' }}>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: space(1) },
  stat: { alignItems: 'center', flex: 1, gap: 2 },
});
