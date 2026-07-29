import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { useStore } from '../state/store';
import { openCheckpointsForPlayer, openPlayerConnections } from '../state/orchestration';
import { PARAMS } from '../engine';
import { Body, Button, Card, Eyebrow, H1, Muted, Seat, ScreenScroll } from '../components/ui';
import { ConnectionCard } from '../components/ConnectionCard';

export function ResultsScreen() {
  const { state, advance } = useStore();
  const intros = state.playerIntrosThisWeek;
  const clearing = state.lastClearing;
  const checkpoints = openCheckpointsForPlayer(state);
  const open = openPlayerConnections(state);
  const lastWeek = state.week >= PARAMS.SEASON_WEEKS;

  return (
    <ScreenScroll>
      <View>
        <Eyebrow tone="lamp">Week {state.week} · Monday, six · recoupling</Eyebrow>
        <H1>{intros.length ? 'The clearing.' : 'A quiet week.'}</H1>
      </View>

      {intros.length > 0 ? (
        <Card lit>
          <Eyebrow tone="lamp">Introduced — mutual, cleared against real capacity</Eyebrow>
          <View style={styles.introRow}>
            {intros.map((id) => (
              <Seat key={id} name={state.byId.get(id)!.name} cleared subtitle="new" />
            ))}
          </View>
          <Body>
            Every introduction is mutual — you both reserved room for it. From here on, you always know where
            you stand.
          </Body>
        </Card>
      ) : (
        <Card>
          <Body>
            No new introduction for you this week. Picked-without-room and unpicked are indistinguishable by
            design — a quiet week is never a verdict.
          </Body>
        </Card>
      )}

      {clearing && (
        <Card>
          <Eyebrow>Across the cohort this week</Eyebrow>
          <View style={styles.stats}>
            <Stat n={clearing.introductions.length} label="introductions cleared" />
            <Stat n={clearing.unclearedMutual.length} label="mutual, no room yet" />
            <Stat n={state.metrics.at(-1)?.declarers ?? 0} label="declared in" />
          </View>
          <Muted>
            Mutual picks without capacity get no notice and no state — they simply stay eligible. Not clearing
            is never a verdict.
          </Muted>
        </Card>
      )}

      {checkpoints.length > 0 && (
        <View style={{ gap: space(1.5) }}>
          <Eyebrow tone="lamp">Checkpoints open — answer before the week turns</Eyebrow>
          {checkpoints.map((c) => (
            <ConnectionCard key={c.id} conn={c} />
          ))}
        </View>
      )}

      <Button
        label={lastWeek ? 'Close the season →' : 'Advance to next week →'}
        onPress={advance}
      />
      <Muted style={{ textAlign: 'center' }}>
        Advancing resolves open checkpoints at the results hour and opens the next Monday.
      </Muted>

      {open.length > 0 && checkpoints.length === 0 && (
        <View style={{ gap: space(1.5) }}>
          <Eyebrow>Your connections</Eyebrow>
          {open.map((c) => (
            <ConnectionCard key={c.id} conn={c} />
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Body style={{ color: colors.lamp, fontSize: 26, fontWeight: '700' }}>{n}</Body>
      <Muted style={{ textAlign: 'center' }}>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  introRow: { flexDirection: 'row', gap: space(2), flexWrap: 'wrap' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: space(1) },
  stat: { alignItems: 'center', flex: 1, gap: 2 },
});
