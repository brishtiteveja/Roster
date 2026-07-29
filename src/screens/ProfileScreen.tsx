import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space } from '../theme';
import { useStore } from '../state/store';
import { WINDOWS } from '../data/cohort';
import { PROPOSED } from '../data/persona';
import { PARAMS } from '../engine';
import { Body, Button, Card, Eyebrow, Muted, Pill, ScreenScroll } from '../components/ui';
import { Avatar } from '../components/Avatar';

/** The player's own profile — receipts, windows, and the market's terms. */
export function ProfileScreen() {
  const { state } = useStore();
  const [exported, setExported] = useState(false);
  const receipts = PROPOSED.filter((e) => state.approvedEvidence.includes(e.id));

  return (
    <ScreenScroll>
      <View style={styles.head}>
        <Avatar seed="you" name="You" size={128} ring="lamp" />
        <Text style={styles.name}>You, {state.player.age}</Text>
        <Muted style={{ textAlign: 'center', maxWidth: 300 }}>{state.player.bio}</Muted>
      </View>

      <Card>
        <Eyebrow tone="verdigris">Persona receipts · approved by you</Eyebrow>
        {receipts.length === 0 ? (
          <Muted>Nothing approved yet — your graph is empty until you say otherwise.</Muted>
        ) : (
          receipts.map((e) => (
            <View key={e.id} style={styles.receipt}>
              <Text style={styles.receiptGlyph}>{e.source === 'listening' ? '♫' : e.source === 'photo' ? '◐' : '∴'}</Text>
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600' }}>{e.claim}</Body>
                <Muted>{e.basis}</Muted>
              </View>
            </View>
          ))
        )}
        <Muted>Every item is labeled by source. Nothing here was auto-accepted.</Muted>
      </Card>

      <Card>
        <Eyebrow>My windows</Eyebrow>
        <View style={styles.chips}>
          {state.player.windows.map((w) => <Pill key={w} tone="muted">{WINDOWS[w]}</Pill>)}
        </View>
        <Eyebrow>My interests</Eyebrow>
        <View style={styles.chips}>
          {state.player.interests.map((i) => <Pill key={i} tone="lamp">{i}</Pill>)}
        </View>
      </Card>

      <Card>
        <Eyebrow>The market's terms — same for everyone</Eyebrow>
        <Row label="Openings" value="1 per week" />
        <Row label="Picks" value={`sealed · up to ${PARAMS.PICKS_MAX}`} />
        <Row label="Active connections" value={`at most ${PARAMS.K_ACTIVE}`} />
        <Row label="Boosts, ranks, scores" value="none, ever" good />
        <Row label="Pausing" value="silent & costless" good />
      </Card>

      <Button
        label={exported ? '✓ Exported — it’s yours' : 'Export my graph'}
        kind={exported ? 'good' : 'ghost'}
        onPress={() => setExported(true)}
      />
      <Muted style={{ textAlign: 'center' }}>
        One tap takes the whole graph with you. Nothing leaves this box until you choose.
      </Muted>
    </ScreenScroll>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <View style={styles.row}>
      <Body>{label}</Body>
      <Text style={[styles.value, good && { color: colors.verdigris }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: space(1), paddingVertical: space(1) },
  name: { color: colors.bone, fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  receipt: { flexDirection: 'row', gap: space(1.5), alignItems: 'flex-start' },
  receiptGlyph: { color: colors.verdigris, fontSize: 18, width: 24, textAlign: 'center', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1) },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: space(0.75), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line,
  },
  value: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
