import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { Connection, PARAMS } from '../engine';
import { offersMoreTime } from '../engine/checkpoint';
import { useStore } from '../state/store';
import { partnerName, partnerId } from '../state/orchestration';
import { Body, Button, Card, Eyebrow, Muted, Pill } from './ui';
import { Avatar } from './Avatar';
import { ChatIcon, CheckIcon, HeartIcon, XIcon, FlagIcon } from './icons';

/** A small round icon action with a caption — replaces the old full-width buttons. */
function ActionBtn({
  icon: Icon, label, color, filled, badge, onPress,
}: {
  icon: (p: { color: string; size?: number; filled?: boolean }) => React.JSX.Element;
  label: string;
  color: string;
  filled?: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.actionCircle, { borderColor: color }, filled && { backgroundColor: color, borderColor: color }]}>
        <Icon color={filled ? '#FFFFFF' : color} size={21} />
        {badge ? (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.actionLabel, { color }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

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
        <View style={styles.actionsRow}>
          <ActionBtn
            icon={ChatIcon}
            label="Message"
            color={colors.lamp}
            filled
            badge={msgCount || undefined}
            onPress={() => openChat(conn.id)}
          />
          {!conn.dateAcknowledged && (
            <ActionBtn icon={CheckIcon} label="We met" color={colors.bone} onPress={() => markMet(conn.id)} />
          )}
          <ActionBtn icon={HeartIcon} label="Exclusive" color={colors.verdigris} onPress={() => requestGraduate(conn.id)} />
          <ActionBtn icon={XIcon} label="Let go" color={colors.muted} onPress={() => close(conn.id)} />
          <ActionBtn icon={FlagIcon} label="Report" color={colors.danger} onPress={() => report(conn.id)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  person: { flexDirection: 'row', gap: space(1.5), alignItems: 'center' },
  row: { flexDirection: 'row', gap: space(1) },
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: space(0.5), paddingTop: space(0.5),
  },
  action: { alignItems: 'center', gap: 5, minWidth: 56 },
  actionCircle: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel,
  },
  actionBadge: {
    position: 'absolute', top: -4, right: -6, minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: colors.bone, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  actionBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  actionLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
});
