import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, space, radius } from '../theme';
import { useStore } from '../state/store';
import { Card, Eyebrow, Muted, Stat, StatRow, ScreenScroll } from '../components/ui';
import { Hero } from '../components/Hero';
import { PARAMS } from '../engine';

export function ObservatoryScreen() {
  const { state } = useStore();
  const metrics = state.metrics;
  const maxIntro = Math.max(1, ...metrics.map((m) => m.introductions));
  const cohortSize = state.cohort.length + 1;
  const totalIntros = metrics.reduce((s, m) => s + m.introductions, 0);
  const avgZero = metrics.length ? Math.round((metrics.reduce((s, m) => s + m.zeroConnection, 0) / metrics.length / cohortSize) * 100) : 0;

  return (
    <ScreenScroll>
      <Hero
        eyebrow="The observatory"
        title="Every rule, watched."
        subtitle="The same deterministic engine that runs this app runs the twin. Here is your season, clearing by clearing."
      />

      <Card>
        <Eyebrow>This season, so far</Eyebrow>
        <StatRow>
          <Stat n={totalIntros} label="introductions cleared" />
          <Stat n={`${avgZero}%`} label="avg zero-connection" tone={avgZero >= 15 ? 'bone' : 'verdigris'} />
          <Stat n={`${metrics.length}/${PARAMS.SEASON_WEEKS}`} label="weeks run" tone="bone" />
        </StatRow>
      </Card>

      <Card>
        <Eyebrow>Introductions cleared per week</Eyebrow>
        {metrics.length === 0 ? (
          <Muted>No clearings yet — seal a board to see the market move.</Muted>
        ) : (
          metrics.map((m) => (
            <View key={m.week} style={styles.barRow}>
              <Muted style={styles.wk}>w{m.week}</Muted>
              <View style={styles.track}>
                <LinearGradient
                  colors={m.playerCleared ? ['#E9B44C', '#C67B3D'] : ['#5b6488', '#3a4066']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.bar, { width: `${(m.introductions / maxIntro) * 100}%` }]}
                />
              </View>
              <Text style={styles.val}>{m.introductions}</Text>
            </View>
          ))
        )}
        {metrics.some((m) => m.playerCleared) && <Muted>Gold weeks are weeks you cleared an introduction.</Muted>}
      </Card>

      <Card>
        <Eyebrow>Zero-connection participants · starvation guardrail</Eyebrow>
        {metrics.map((m) => {
          const pct = Math.round((m.zeroConnection / cohortSize) * 100);
          const amber = pct >= 15;
          return (
            <View key={m.week} style={styles.barRow}>
              <Muted style={styles.wk}>w{m.week}</Muted>
              <View style={styles.track}>
                <LinearGradient
                  colors={amber ? ['#D98A7B', '#a8566b'] : ['#86B8A1', '#4e7e7a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.bar, { width: `${Math.max(pct, 2)}%` }]}
                />
              </View>
              <Text style={[styles.val, amber && { color: colors.danger }]}>{pct}%</Text>
            </View>
          );
        })}
        <Muted>Cohort of {cohortSize}. K_ACTIVE frozen at {PARAMS.K_ACTIVE}; the pre-registered veto trips at ≥15%.</Muted>
      </Card>

      <Card>
        <Eyebrow>Event log</Eyebrow>
        <View style={styles.log}>
          {state.log.slice().reverse().map((l, i) => (
            <View key={i} style={styles.logRow}>
              <View style={[styles.dot, { backgroundColor: i === 0 ? colors.lamp : colors.muted }]} />
              <Text style={[styles.logText, { color: i === 0 ? colors.bone : colors.muted }]}>{l}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  wk: { width: 28 },
  track: { flex: 1, height: 16, backgroundColor: colors.ground, borderRadius: 8, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 8, minWidth: 6 },
  val: { width: 40, textAlign: 'right', color: colors.bone, fontSize: 13, fontWeight: '600' },
  log: { gap: space(1) },
  logRow: { flexDirection: 'row', gap: space(1), alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  logText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
