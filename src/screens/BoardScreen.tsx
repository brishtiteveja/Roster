import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, space, type as t } from '../theme';
import { WINDOWS } from '../data/cohort';
import { useStore } from '../state/store';
import { PARAMS } from '../engine';
import { Button, Eyebrow, Muted } from '../components/ui';
import { Deck, DeckPerson } from '../components/Deck';
import { facePhotos } from '../data/faces';

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
    const shared = player.interests.filter((i) => c.interests.includes(i));
    return {
      id,
      name: c.name,
      age: c.age,
      bio: c.bio,
      chips: c.interests.slice(0, 6),
      overlap: overlapText(id),
      photos: facePhotos(id, c.name, 3),
      prompts: [
        { q: 'In my own words', a: c.voice },
        { q: 'My weekends', a: c.bio },
      ],
      free: `${c.windows.map((w) => WINDOWS[w]).slice(0, 3).join(' · ')}${
        shared.length ? ` — you both like ${shared.slice(0, 2).join(' and ')}` : ''
      }`,
    };
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
      {/* the card is the screen; everything else floats on top of it */}
      <Deck
        people={people}
        picks={picks}
        canPick={picks.length < PARAMS.PICKS_MAX}
        onPick={onPick}
        onSkip={onSkip}
        onEmpty={done}
        footer={
          picks.length ? (
            <Button label={`Seal ${picks.length} pick${picks.length > 1 ? 's' : ''}`} onPress={submit} />
          ) : null
        }
      />

      <LinearGradient
        colors={['rgba(12,15,27,0.55)', 'transparent']}
        style={styles.topScrim}
        pointerEvents="none"
      />
      <View style={styles.topBar} pointerEvents="box-none">
        <View style={{ gap: 2 }} pointerEvents="none">
          <Text style={styles.topEyebrow}>WEEK {state.week}</Text>
          <Text style={styles.topTitle}>Six people</Text>
        </View>
        <View style={styles.pickMeter} pointerEvents="box-none">
          <View style={styles.dots} pointerEvents="none">
            {Array.from({ length: PARAMS.PICKS_MAX }).map((_, i) => (
              <View key={i} style={[styles.dot, i < picks.length && styles.dotOn]} />
            ))}
          </View>
          {!picks.length && (
            <Pressable onPress={submit} hitSlop={12}>
              <Text style={styles.skipText}>Skip week ›</Text>
            </Pressable>
          )}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.ground },
  topBar: {
    position: 'absolute', top: space(3), left: space(2.5), right: space(2.5),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: space(16) },
  topEyebrow: {
    color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6,
  },
  topTitle: {
    color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 8,
  },
  pickMeter: { alignItems: 'flex-end', gap: 8 },
  skipText: {
    color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  dotOn: { backgroundColor: colors.lamp, borderColor: colors.lamp },
  doneCard: { alignItems: 'center', gap: space(1.25), paddingHorizontal: space(3) },
  doneTitle: { ...t.h1, color: colors.bone, textAlign: 'center' },
});
