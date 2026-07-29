import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, space, radius } from '../theme';
import { PROPOSED, EvidenceSource } from '../data/persona';
import { useStore } from '../state/store';
import { Body, Button, Card, Eyebrow, H1, Muted, ScreenScroll } from '../components/ui';
import { Avatar } from '../components/Avatar';

const sourceLabel: Record<EvidenceSource, string> = {
  photo: 'FROM YOUR PHOTO',
  listening: 'FROM YOUR LISTENING',
  inference: 'MODEL INFERENCE',
};

export function OnboardingScreen() {
  const { onboardApprove } = useStore();
  // Each item starts "proposed"; the person approves or deletes.
  const [status, setStatus] = useState<Record<string, 'proposed' | 'approved' | 'deleted'>>(
    Object.fromEntries(PROPOSED.map((e) => [e.id, 'proposed']))
  );

  const approvedIds = Object.entries(status).filter(([, s]) => s === 'approved').map(([id]) => id);

  return (
    <ScreenScroll>
      <View style={styles.hero}>
        <Avatar seed="you" name="You" size={64} ring="lamp" />
        <Eyebrow tone="lamp">The persona graph · receipts, chosen by you</Eyebrow>
      </View>
      <View>
        <H1>The model proposes. You decide.</H1>
        <Muted style={{ marginTop: space(1) }}>
          A local model read a photo and a listening export on this box — nothing left it. It drafted
          the evidence below. Approve what's true, delete what isn't. The two model inferences are here
          on purpose.
        </Muted>
      </View>

      {PROPOSED.map((e) => {
        const s = status[e.id];
        if (s === 'deleted') {
          return (
            <Card key={e.id} style={{ opacity: 0.5 }}>
              <Text style={styles.deleted}>Deleted — “{e.claim}”</Text>
              <Pressable onPress={() => setStatus((p) => ({ ...p, [e.id]: 'proposed' }))}>
                <Text style={styles.undo}>Undo</Text>
              </Pressable>
            </Card>
          );
        }
        const approved = s === 'approved';
        return (
          <Card key={e.id} good={approved} lit={!approved && e.source === 'inference'}>
            <Eyebrow tone={e.source === 'inference' ? 'lamp' : approved ? 'verdigris' : 'muted'}>
              {sourceLabel[e.source]}
            </Eyebrow>
            <Body>{e.claim}</Body>
            <Muted>{e.basis}</Muted>
            <View style={styles.row}>
              <Button
                label={approved ? '✓ Approved' : 'Approve'}
                kind={approved ? 'good' : 'ghost'}
                onPress={() => setStatus((p) => ({ ...p, [e.id]: approved ? 'proposed' : 'approved' }))}
                style={{ flex: 1 }}
              />
              <Button
                label="Delete"
                kind="danger"
                onPress={() => setStatus((p) => ({ ...p, [e.id]: 'deleted' }))}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        );
      })}

      <Card>
        <Muted>
          {approvedIds.length} approved · {Object.values(status).filter((s) => s === 'deleted').length} deleted.
          Approved interests seed your affinity — and only these leave as your graph, when you choose to export it.
        </Muted>
      </Card>

      <Button
        label="This is my profile — enter Season 0"
        onPress={() => onboardApprove(approvedIds)}
        disabled={approvedIds.length === 0}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  row: { flexDirection: 'row', gap: space(1.25), marginTop: space(0.5) },
  deleted: { color: colors.muted, fontSize: 14, textDecorationLine: 'line-through' },
  undo: { color: colors.lamp, fontSize: 13, marginTop: 6, letterSpacing: 1 },
});
