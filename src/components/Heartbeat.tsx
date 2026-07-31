import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space } from '../theme';

const STEPS = [
  { t: 'MON 12:00', d: 'declare', key: 'declare' },
  { t: 'MON 18:00', d: 'matches · new six', key: 'clear' },
  { t: 'ALL WEEK', d: 'six · pick ≤3 sealed', key: 'board' },
  { t: 'SUN 18:00', d: 'picks close', key: 'close' },
] as const;

/** The weekly rhythm: matches land every Monday at six. */
export function Heartbeat({ active }: { active?: 'declare' | 'clear' | 'board' | 'close' }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rail} />
      <View style={styles.row}>
        {STEPS.map((s) => {
          const lit = s.key === active;
          return (
            <View key={s.key} style={styles.step}>
              <View style={[styles.dot, lit && styles.dotLit]} />
              <Text style={[styles.time, lit && { color: colors.lamp }]}>{s.t}</Text>
              <Text style={styles.desc} numberOfLines={2}>{s.d}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: space(1) },
  rail: { position: 'absolute', top: space(1) + 6, left: '12%', right: '12%', height: 1, backgroundColor: colors.muted, opacity: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { alignItems: 'center', flex: 1, gap: 3 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: colors.muted, backgroundColor: colors.ground },
  dotLit: { borderColor: colors.lamp, borderWidth: 2.4, width: 15, height: 15, borderRadius: 8 },
  time: { color: colors.bone, fontSize: 10.5, letterSpacing: 0.8, marginTop: 3, fontWeight: '600' },
  desc: { color: colors.muted, fontSize: 10, textAlign: 'center' },
});
