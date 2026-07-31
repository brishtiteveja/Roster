import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { colors, radius, space } from '../theme';
import { useStore } from '../state/store';
import { partnerName, partnerId } from '../state/orchestration';
import { PARAMS, isOpen } from '../engine';
import { offersMoreTime } from '../engine/checkpoint';
import { Avatar } from './Avatar';
import { Button } from './ui';

/** Full-screen message thread for one connection. */
export function ChatOverlay({ connId }: { connId: string }) {
  const { state, openChat, send, requestGraduate, vote } = useStore();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const conn = state.connections.find((c) => c.id === connId);
  const msgs = state.messages[connId] ?? [];

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [msgs.length]);

  if (!conn) return null;
  const pid = partnerId(state, conn);
  const name = partnerName(state, conn);
  const open = isOpen(conn.state);

  function submit() {
    if (!draft.trim()) return;
    send(connId, draft);
    setDraft('');
  }

  return (
    <SafeAreaView style={styles.backdrop}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => openChat(null)} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Avatar seed={pid} name={name} size={40} ring={open ? 'lamp' : 'muted'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.sub}>
              {open
                ? conn.activeConversation
                  ? 'alive right now'
                  : `check in every ${PARAMS.CHECK_INTERVAL_DAYS} days`
                : conn.state === 'GRADUATED' ? 'exclusive 🎉' : 'closed'}
            </Text>
          </View>
          {open && (
            <Pressable onPress={() => requestGraduate(connId)} hitSlop={8}>
              <Text style={styles.gradLink}>Go exclusive</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.thread}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.systemLine}>
            Matched week {conn.weekIntroduced}. You both picked each other.
          </Text>
          {msgs.map((m, i) => {
            if (m.from === 'system') {
              return (
                <Text key={i} style={styles.systemMsg}>
                  ◆ {m.text}
                </Text>
              );
            }
            const mine = m.from === state.player.id;
            return (
              <View key={i} style={[styles.row, mine && { justifyContent: 'flex-end' }]}>
                {!mine && <Avatar seed={pid} name={name} size={26} ring="muted" />}
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.msgText, mine && { color: colors.night }]}>{m.text}</Text>
                </View>
              </View>
            );
          })}
          {msgs.length > 0 && msgs[msgs.length - 1].from === state.player.id && (
            <Text style={styles.typing}>…</Text>
          )}

          {conn.state === 'CHECKPOINT_OPEN' && (
            <View style={styles.checkpointCard}>
              <Text style={styles.checkpointTitle}>STILL INTO IT?</Text>
              <Text style={styles.checkpointBody}>
                Private. Nobody sees your answer. If you two are talking, it stays open anyway.
              </Text>
              {conn.votes[state.player.id] ? (
                <Text style={styles.sealedNote}>✓ Sealed until Monday.</Text>
              ) : (
                <View style={styles.voteRow}>
                  <Button label="Still in" kind="good" onPress={() => vote(connId, 'KEEP')} style={{ flex: 1 }} />
                  {offersMoreTime(conn) && (
                    <Button label="More time" kind="ghost" onPress={() => vote(connId, 'MORE_TIME')} style={{ flex: 1 }} />
                  )}
                  <Button label="Let it go" kind="danger" onPress={() => vote(connId, 'CLOSE')} style={{ flex: 1 }} />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {open ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={submit}
              placeholder={`Message ${name}…`}
              placeholderTextColor={colors.muted}
              returnKeyType="send"
            />
            <Pressable onPress={submit} style={[styles.sendBtn, !draft.trim() && { opacity: 0.35 }]}>
              <Text style={styles.sendLabel}>↑</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <Text style={styles.closedNote}>Closed. That spot is free again.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 40, backgroundColor: colors.ground,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: space(1.5),
    paddingHorizontal: space(2), paddingVertical: space(1.5),
    backgroundColor: colors.night, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  back: { color: colors.bone, fontSize: 32, marginTop: -4, paddingHorizontal: 4 },
  name: { color: colors.bone, fontSize: 17, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 11.5 },
  gradLink: { color: colors.verdigris, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  thread: { padding: space(2), gap: space(1.25), paddingBottom: space(3) },
  systemLine: {
    color: colors.muted, fontSize: 11.5, textAlign: 'center',
    marginBottom: space(1), lineHeight: 16, paddingHorizontal: space(2),
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: {
    maxWidth: '76%', paddingHorizontal: space(1.75), paddingVertical: space(1.1),
    borderRadius: 18,
  },
  mine: { backgroundColor: colors.lamp, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.panel, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.line },
  msgText: { color: colors.bone, fontSize: 15, lineHeight: 21 },
  typing: { color: colors.muted, fontSize: 22, marginLeft: 40, marginTop: -4 },
  systemMsg: {
    color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center',
    paddingHorizontal: space(3), marginVertical: space(0.5),
  },
  checkpointCard: {
    borderWidth: 1.4, borderColor: colors.lamp, backgroundColor: colors.lampSoft,
    borderRadius: radius.lg, padding: space(2), gap: space(1), marginTop: space(1),
  },
  checkpointTitle: { color: colors.lamp, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  checkpointBody: { color: colors.bone, fontSize: 13.5, lineHeight: 19 },
  sealedNote: { color: colors.verdigris, fontSize: 13, fontWeight: '600' },
  voteRow: { flexDirection: 'row', gap: space(1) },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: space(1.25),
    padding: space(1.5), backgroundColor: colors.night,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  input: {
    flex: 1, color: colors.bone, fontSize: 15,
    backgroundColor: colors.panel, borderRadius: radius.pill,
    paddingHorizontal: space(2), paddingVertical: space(1.4),
    borderWidth: 1, borderColor: colors.line,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lamp,
    alignItems: 'center', justifyContent: 'center',
  },
  sendLabel: { color: colors.night, fontSize: 22, fontWeight: '800', marginTop: -2 },
  closedNote: { color: colors.muted, fontSize: 13, textAlign: 'center', flex: 1 },
});
