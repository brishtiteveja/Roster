import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { Connection, PARAMS } from '../engine';
import { offersMoreTime } from '../engine/checkpoint';
import { useStore } from '../state/store';
import { partnerName, partnerId } from '../state/orchestration';
import { Body, Button, Card, Eyebrow, Muted, Pill } from './ui';
import { Avatar } from './Avatar';

const stateTone: Record<string, 'lamp' | 'verdigris' | 'muted' | 'danger'> = {
  INTRODUCED: 'lamp',
  ACTIVE: 'lamp',
  CHECKPOINT_OPEN: 'lamp',
  CLOSED: 'muted',
  SAFETY_CLOSED: 'danger',
  GRADUATED: 'verdigris',
};

// User-facing names for engine states — dating words, not paperwork words.
const stateLabel: Record<string, string> = {
  INTRODUCED: 'just matched',
  ACTIVE: 'seeing each other',
  CHECKPOINT_OPEN: 'check-in open',
  CLOSED: 'closed',
  SAFETY_CLOSED: 'safety closed',
  GRADUATED: 'exclusive',
};

export function ConnectionCard({ conn }: { conn: Connection }) {
  const { state, vote, markMet, close, report, openChat, requestGraduate } = useStore();
  const msgCount = (state.messages[conn.id] ?? []).length;
  const name = partnerName(state, conn);
  const me = state.player.id;
  const myVote = conn.votes[me];
  const open = conn.state === 'CHECKPOINT_OPEN';
  const closed = conn.state === 'CLOSED' || conn.state === 'SAFETY_CLOSED';
  const graduated = conn.state === 'GRADUATED';

  const pid = partnerId(state, conn);
  return (
    <Card lit={open} good={graduated} style={closed ? { opacity: 0.6 } : undefined}>
      <View style={styles.head}>
        <Eyebrow tone={stateTone[conn.state]}>{stateLabel[conn.state] ?? conn.state}</Eyebrow>
        <Muted>wk {conn.weekIntroduced}</Muted>
      </View>
      <View style={styles.person}>
        <Avatar seed={pid} name={name} size={48} ring={graduated ? 'verdigris' : open ? 'lamp' : 'muted'} />
        <View style={{ flex: 1 }}>
          <Body>{name}</Body>
          <Muted>{state.byId.get(pid)?.bio}</Muted>
        </View>
      </View>

      {conn.dateAcknowledged && !closed && !graduated && <Pill tone="verdigris">date confirmed · sooner check-in</Pill>}

      {open ? (
        <View style={{ gap: space(1) }}>
          <Muted>
            The weekly "still into it?" — you each answer in private, within {PARAMS.CHECK_DEADLINE_HOURS}h.
            No one's answer is shown; no one is named.
          </Muted>
          <View style={styles.row}>
            <Button label={myVote === 'KEEP' ? '✓ Still in' : 'Still in'} kind={myVote === 'KEEP' ? 'good' : 'ghost'} onPress={() => vote(conn.id, 'KEEP')} style={{ flex: 1 }} />
            {offersMoreTime(conn) && (
              <Button label={myVote === 'MORE_TIME' ? '✓ More time' : 'More time'} kind={myVote === 'MORE_TIME' ? 'primary' : 'ghost'} onPress={() => vote(conn.id, 'MORE_TIME')} style={{ flex: 1 }} />
            )}
            <Button label={myVote === 'CLOSE' ? '✓ Let it go' : 'Let it go'} kind={myVote === 'CLOSE' ? 'danger' : 'ghost'} onPress={() => vote(conn.id, 'CLOSE')} style={{ flex: 1 }} />
          </View>
          {!offersMoreTime(conn) && <Muted>Third check-in in a row — this one's yes or goodbye.</Muted>}
          {myVote && <Muted>Sealed. Monday keeps your secret until the results hour.</Muted>}
          <Button
            label={msgCount ? `Message · ${msgCount}` : 'Message'}
            kind="ghost"
            onPress={() => openChat(conn.id)}
          />
        </View>
      ) : closed ? (
        <Muted>
          {conn.state === 'SAFETY_CLOSED'
            ? 'Closed for safety — immediately, its own handling.'
            : 'Closed. That spot is free again.'}
        </Muted>
      ) : graduated ? (
        <Muted>You two left together — the best ending this app has. 🎉</Muted>
      ) : (
        <View style={{ gap: space(1) }}>
          <Button
            label={msgCount ? `Message · ${msgCount}` : 'Message'}
            onPress={() => openChat(conn.id)}
          />
          {!conn.dateAcknowledged && (
            <Button label="We met — and it happened" kind="ghost" onPress={() => markMet(conn.id)} />
          )}
          <View style={styles.row}>
            <Button label="Go exclusive" kind="good" onPress={() => requestGraduate(conn.id)} style={{ flex: 1 }} />
            <Button label="Let it go" kind="ghost" onPress={() => close(conn.id)} style={{ flex: 1 }} />
          </View>
          <Button label="Report a safety concern" kind="danger" onPress={() => report(conn.id)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  person: { flexDirection: 'row', gap: space(1.5), alignItems: 'center' },
  row: { flexDirection: 'row', gap: space(1) },
});
