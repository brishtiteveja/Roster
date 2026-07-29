import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { useStore } from '../state/store';
import { Body, Card, Eyebrow, H1, Muted, ScreenScroll } from '../components/ui';
import { PARAMS } from '../engine';

export function ObservatoryScreen() {
  const { state } = useStore();
  const metrics = state.metrics;
  const maxIntro = Math.max(1, ...metrics.map((m) => m.introductions));
  const cohortSize = state.cohort.length + 1;

  return (
    <ScreenScroll>
      <View>
        <Eyebrow tone="lamp">The observatory · the market, live</Eyebrow>
        <H1>Every rule, watched.</H1>
        <Muted style={{ marginTop: space(1) }}>
          The same deterministic engine that runs this app runs the twin. Here is your season clearing, week by
          week — introductions made, and how many people still hold zero connections (a guardrail: K=2 falls to
          3 if starvation crosses 15%).
        </Muted>
      </View>

      <Card>
        <Eyebrow>Introductions cleared per week</Eyebrow>
        {metrics.length === 0 ? (
          <Muted>No clearings yet — seal a board to see the market move.</Muted>
        ) : (
          metrics.map((m) => (
            <View key={m.week} style={styles.barRow}>
              <Muted style={styles.wk}>w{m.week}</Muted>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { width: `${(m.introductions / maxIntro) * 100}%`, backgroundColor: m.playerCleared ? colors.lamp : colors.muted },
                  ]}
                />
              </View>
              <Muted style={styles.val}>{m.introductions}</Muted>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Eyebrow>Zero-connection participants (starvation guardrail)</Eyebrow>
        {metrics.map((m) => {
          const pct = Math.round((m.zeroConnection / cohortSize) * 100);
          const amber = pct >= 15;
          return (
            <View key={m.week} style={styles.barRow}>
              <Muted style={styles.wk}>w{m.week}</Muted>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${pct}%`, backgroundColor: amber ? colors.danger : colors.verdigris }]} />
              </View>
              <Muted style={styles.val}>{pct}%</Muted>
            </View>
          );
        })}
        <Muted>Cohort of {cohortSize}. K_ACTIVE frozen at {PARAMS.K_ACTIVE}; the pre-registered veto trips at ≥15%.</Muted>
      </Card>

      <Card>
        <Eyebrow>Event log</Eyebrow>
        {state.log.slice().reverse().map((l, i) => (
          <Body key={i} style={{ fontSize: 13, color: i === 0 ? colors.bone : colors.muted }}>
            · {l}
          </Body>
        ))}
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  wk: { width: 28 },
  track: { flex: 1, height: 14, backgroundColor: colors.ground, borderRadius: 7, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 7 },
  val: { width: 36, textAlign: 'right' },
});
