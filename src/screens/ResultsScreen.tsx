import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { useStore } from '../state/store';
import { openCheckpointsForPlayer, openPlayerConnections } from '../state/orchestration';
import { PARAMS } from '../engine';
import { Body, Button, Card, Eyebrow, H1, Muted, Seat, Stat, StatRow, ScreenScroll } from '../components/ui';
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
        <Eyebrow tone="lamp">Week {state.week} · Monday, six · the reveal</Eyebrow>
        <H1>{intros.length ? 'Someone said you back.' : 'A quiet week.'}</H1>
      </View>

      {intros.length > 0 ? (
        <Card lit>
          <Eyebrow tone="lamp">Mutual — you both spent your opening here</Eyebrow>
          <View style={styles.introRow}>
            {intros.map((id) => (
              <Seat key={id} name={state.byId.get(id)!.name} seed={id} cleared subtitle="new" />
            ))}
          </View>
          <Body>
            They picked you while you were picking them. From here on, you always know where you stand.
          </Body>
        </Card>
      ) : (
        <Card>
          <Body>
            Nothing new this Monday — and that's all it means. Picked-quietly and not-picked look identical
            by design, so a quiet week is never a verdict. Someone may already be waiting on next week's board.
          </Body>
        </Card>
      )}

      {clearing && (
        <Card>
          <Eyebrow>Across the cohort this week</Eyebrow>
          <StatRow>
            <Stat n={clearing.introductions.length} label="matches made" />
            <Stat n={clearing.unclearedMutual.length} label="liked back, no space" />
            <Stat n={state.metrics.at(-1)?.declarers ?? 0} label="declared in" />
          </StatRow>
          <Muted>
            Mutual sparks without room this week simply stay possible — no notice, no state, no verdict.
            Some things are worth a week's wait.
          </Muted>
        </Card>
      )}

      {checkpoints.length > 0 && (
        <View style={{ gap: space(1.5) }}>
          <Eyebrow tone="lamp">Check-ins open — answer before the week turns</Eyebrow>
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

const styles = StyleSheet.create({
  introRow: { flexDirection: 'row', gap: space(2), flexWrap: 'wrap' },
});
