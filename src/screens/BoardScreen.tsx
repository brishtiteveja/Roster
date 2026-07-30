import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space, type as t } from '../theme';
import { WINDOWS } from '../data/cohort';
import { useStore } from '../state/store';
import { PARAMS } from '../engine';
import { Button, Eyebrow, Muted } from '../components/ui';
import { Deck, DeckPerson } from '../components/Deck';
import { Avatar } from '../components/Avatar';

export function BoardScreen() {
  const { state, togglePick, submit } = useStore();
  const player = state.player;
  const candidates = state.playerCandidates;
  const picks = state.playerPicks;

  function overlapText(id: string): string {
    const c = state.byId.get(id)!;
    const win = player.windows.filter((w) => c.windows.includes(w)).map((w) => WINDOWS[w].split(' ')[0]);
    if (win.length) return `free when you are · ${win.slice(0, 2).join(' & ')}`;
    return 'the bold pick';
  }
  function chips(id: string): string[] {
    const c = state.byId.get(id)!;
    const shared = player.interests.filter((i) => c.interests.includes(i));
    return (shared.length ? shared : c.interests).slice(0, 3);
  }

  const people: DeckPerson[] = candidates.map((id) => {
    const c = state.byId.get(id)!;
    return { id, name: c.name, age: c.age, bio: c.bio, chips: chips(id), overlap: overlapText(id) };
  });

  function onPick(id: string) {
    if (!picks.includes(id) && picks.length < PARAMS.PICKS_MAX) togglePick(id);
  }
  function onSkip(_id: string) {}

  const done = (
    <View style={styles.doneCard}>
      <Eyebrow tone="lamp">That's everyone</Eyebrow>
      <Text style={styles.doneTitle}>{picks.length ? `${picks.length} sealed. 🤫` : 'Playing hard to get?'}</Text>
      <Muted style={{ textAlign: 'center' }}>
        Seal them and Monday does the telling — if it's mutual and you both have room, you'll know at six.
      </Muted>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Eyebrow tone="lamp">Week {state.week} · your board</Eyebrow>
        <Text style={styles.title}>Six who made room</Text>
        <Muted>Swipe right to want someone — quietly. Three picks, sealed lips till Monday. No one ever learns they were passed over.</Muted>
      </View>

      <View style={styles.deck}>
        <Deck
          people={people}
          picks={picks}
          canPick={picks.length < PARAMS.PICKS_MAX}
          onPick={onPick}
          onSkip={onSkip}
          onEmpty={done}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.sealedRow}>
          <View style={styles.dots}>
            {Array.from({ length: PARAMS.PICKS_MAX }).map((_, i) => (
              <View key={i} style={[styles.dot, i < picks.length && styles.dotOn]} />
            ))}
          </View>
          <View style={styles.avatars}>
            {picks.map((id) => (
              <View key={id} style={styles.avatarStack}>
                <Avatar seed={id} name={state.byId.get(id)!.name} size={34} ring="lamp" />
              </View>
            ))}
          </View>
          <Muted>{picks.length} / {PARAMS.PICKS_MAX} sealed</Muted>
        </View>
        <Button
          label={picks.length ? `Seal ${picks.length} pick${picks.length > 1 ? 's' : ''} — Monday tells` : 'Sit this week out'}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.ground, paddingHorizontal: space(2.5), paddingTop: space(1.5), paddingBottom: space(2) },
  header: { gap: 4, marginBottom: space(1) },
  title: { ...t.h1, color: colors.bone },
  deck: { flex: 1, justifyContent: 'center' },
  footer: { gap: space(1.5) },
  sealedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: colors.muted },
  dotOn: { backgroundColor: colors.lamp, borderColor: colors.lamp },
  avatars: { flexDirection: 'row' },
  avatarStack: { marginLeft: -8 },
  doneCard: { alignItems: 'center', gap: space(1.25), paddingHorizontal: space(3) },
  doneTitle: { ...t.h1, color: colors.bone, textAlign: 'center' },
});
