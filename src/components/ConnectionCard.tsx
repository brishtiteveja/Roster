import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { Connection, PARAMS } from '../engine';
import { offersMoreTime } from '../engine/checkpoint';
import { useStore } from '../state/store';
import { partnerName, partnerId } from '../state/orchestration';
import { Body, Button, Card, Eyebrow, Muted, Pill } from './ui';

const stateTone: Record<string, 'lamp' | 'verdigris' | 'muted' | 'danger'> = {
  INTRODUCED: 'lamp',
  ACTIVE: 'lamp',
  CHECKPOINT_OPEN: 'lamp',
  CLOSED: 'muted',
  SAFETY_CLOSED: 'danger',
  GRADUATED: 'verdigris',
};

export function ConnectionCard({ conn }: { conn: Connection }) {
  const { state, vote, markMet, close, report, graduate } = useStore();
  const name = partnerName(state, conn);
  const me = state.player.id;
  const myVote = conn.votes[me];
  const open = conn.state === 'CHECKPOINT_OPEN';
  const closed = conn.state === 'CLOSED' || conn.state === 'SAFETY_CLOSED';
  const graduated = conn.state === 'GRADUATED';

  return (
    <Card lit={open} good={graduated} style={closed ? { opacity: 0.6 } : undefined}>
      <View style={styles.head}>
        <Eyebrow tone={stateTone[conn.state]}>{conn.state.replace('_', ' ')}</Eyebrow>
        <Muted>wk {conn.weekIntroduced}</Muted>
      </View>
      <Body>
        {name} · <Muted>“{state.byId.get(partnerId(state, conn))?.voice}”</Muted>
      </Body>

      {conn.dateAcknowledged && !closed && !graduated && <Pill tone="verdigris">date confirmed · faster checkpoint</Pill>}

      {open ? (
        <View style={{ gap: space(1) }}>
          <Muted>
            Checkpoint. Both of you answer privately within {PARAMS.CHECK_DEADLINE_HOURS}h. Votes are never
            revealed; the closer is never named.
          </Muted>
          <View style={styles.row}>
            <Button label={myVote === 'KEEP' ? '✓ Keep' : 'Keep'} kind={myVote === 'KEEP' ? 'good' : 'ghost'} onPress={() => vote(conn.id, 'KEEP')} style={{ flex: 1 }} />
            {offersMoreTime(conn) && (
              <Button label={myVote === 'MORE_TIME' ? '✓ More time' : 'More time'} kind={myVote === 'MORE_TIME' ? 'primary' : 'ghost'} onPress={() => vote(conn.id, 'MORE_TIME')} style={{ flex: 1 }} />
            )}
            <Button label={myVote === 'CLOSE' ? '✓ Close' : 'Close'} kind={myVote === 'CLOSE' ? 'danger' : 'ghost'} onPress={() => vote(conn.id, 'CLOSE')} style={{ flex: 1 }} />
          </View>
          {!offersMoreTime(conn) && <Muted>Third checkpoint running — keep or close only.</Muted>}
          {myVote && <Muted>Sealed. Resolves at the next results hour.</Muted>}
        </View>
      ) : closed ? (
        <Muted>
          {conn.state === 'SAFETY_CLOSED'
            ? 'Closed for safety — immediately, its own handling.'
            : 'This connection has closed. That room is open again.'}
        </Muted>
      ) : graduated ? (
        <Muted>You both left the market together. 🎉</Muted>
      ) : (
        <View style={{ gap: space(1) }}>
          {!conn.dateAcknowledged && (
            <Button label="We met — confirm the date" kind="ghost" onPress={() => markMet(conn.id)} />
          )}
          <View style={styles.row}>
            <Button label="Graduate" kind="good" onPress={() => graduate(conn.id)} style={{ flex: 1 }} />
            <Button label="Close" kind="ghost" onPress={() => close(conn.id)} style={{ flex: 1 }} />
          </View>
          <Button label="Report a safety concern" kind="danger" onPress={() => report(conn.id)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: space(1) },
});
