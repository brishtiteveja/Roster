import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, space, radius } from '../theme';
import { PROPOSED, EvidenceSource } from '../data/persona';
import { useStore } from '../state/store';
import { Body, Button, Card, Eyebrow, Muted, Pill, ScreenScroll } from '../components/ui';
import { Hero } from '../components/Hero';

const sourceLabel: Record<EvidenceSource, string> = {
  photo: 'from your photo',
  listening: 'from your listening',
  inference: 'model inference',
};

export function OnboardingScreen() {
  const { onboardApprove } = useStore();
  const [status, setStatus] = useState<Record<string, 'proposed' | 'approved' | 'deleted'>>(
    Object.fromEntries(PROPOSED.map((e) => [e.id, 'proposed']))
  );

  const approvedIds = Object.entries(status).filter(([, s]) => s === 'approved').map(([id]) => id);
  const deleted = Object.values(status).filter((s) => s === 'deleted').length;

  return (
    <ScreenScroll>
      <Hero
        eyebrow="The persona graph"
        title="The model proposes. You decide."
        subtitle="A local model read a photo and a listening export on this box — nothing left it. Approve what's true, delete what isn't. The two inferences are here on purpose."
        avatarSeed="you"
        avatarName="You"
      />

      {PROPOSED.map((e) => {
        const s = status[e.id];
        if (s === 'deleted') {
          return (
            <Card key={e.id} style={{ opacity: 0.55 }}>
              <View style={styles.deletedRow}>
                <Text style={styles.deleted}>“{e.claim}”</Text>
                <Pressable onPress={() => setStatus((p) => ({ ...p, [e.id]: 'proposed' }))} hitSlop={8}>
                  <Text style={styles.undo}>Undo</Text>
                </Pressable>
              </View>
            </Card>
          );
        }
        const approved = s === 'approved';
        const isInference = e.source === 'inference';
        return (
          <Card key={e.id} good={approved} lit={!approved && isInference}>
            <View style={styles.cardTop}>
              <Pill tone={isInference ? 'lamp' : approved ? 'verdigris' : 'muted'}>{sourceLabel[e.source]}</Pill>
              {approved ? <Text style={styles.approvedTick}>✓ approved</Text> : null}
            </View>
            <Body style={{ fontSize: 16, fontWeight: '600' }}>{e.claim}</Body>
            <Muted>{e.basis}</Muted>
            <View style={styles.row}>
              <Button
                label={approved ? 'Approved' : 'Approve'}
                kind={approved ? 'good' : 'primary'}
                onPress={() => setStatus((p) => ({ ...p, [e.id]: approved ? 'proposed' : 'approved' }))}
                style={{ flex: 1 }}
              />
              <Button label="Delete" kind="danger" onPress={() => setStatus((p) => ({ ...p, [e.id]: 'deleted' }))} style={{ flex: 1 }} />
            </View>
          </Card>
        );
      })}

      <View style={styles.summary}>
        <Muted>
          {approvedIds.length} approved · {deleted} deleted. Only approved items become your graph — and only
          when you choose to export it.
        </Muted>
      </View>

      <Button
        label="That's me — deal me in"
        onPress={() => onboardApprove(approvedIds)}
        disabled={approvedIds.length === 0}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  approvedTick: { color: colors.verdigris, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: space(1.25), marginTop: space(0.5) },
  deletedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleted: { color: colors.muted, fontSize: 14, textDecorationLine: 'line-through', flex: 1 },
  undo: { color: colors.lamp, fontSize: 13, letterSpacing: 1, fontWeight: '600' },
  summary: { paddingHorizontal: space(0.5) },
});
