import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { WINDOWS } from '../data/cohort';
import { useStore } from '../state/store';
import { PARAMS } from '../engine';
import { affinity } from '../engine/eligibility';
import { Body, Button, Card, Eyebrow, H1, Muted, Seat, ScreenScroll } from '../components/ui';
import { Avatar } from '../components/Avatar';

export function BoardScreen() {
  const { state, togglePick, submit } = useStore();
  const player = state.player;
  const candidates = state.playerCandidates;

  function sharedNote(id: string): string {
    const c = state.byId.get(id)!;
    const win = player.windows.filter((w) => c.windows.includes(w)).map((w) => WINDOWS[w].split(' ')[0]);
    const ints = player.interests.filter((i) => c.interests.includes(i));
    const bits: string[] = [];
    if (win.length) bits.push(win.length + 'd overlap');
    if (ints.length) bits.push(ints[0]);
    return bits.join(' · ') || 'a broadening pick';
  }

  const picks = state.playerPicks;

  return (
    <ScreenScroll>
      <View>
        <Eyebrow tone="lamp">Week {state.week} · your board</Eyebrow>
        <H1>Six people, with room.</H1>
        <Muted style={{ marginTop: space(1) }}>
          Everyone here made room this week. Pick up to three — sealed. At Monday's clearing your picks meet
          real capacity: at most one new connection. Unpicked and picked-without-room look identical, so no one
          learns they were passed over.
        </Muted>
      </View>

      <Card>
        <View style={styles.grid}>
          {candidates.map((id) => {
            const c = state.byId.get(id)!;
            const picked = picks.includes(id);
            return (
              <Seat
                key={id}
                name={c.name}
                seed={c.id}
                picked={picked}
                subtitle={sharedNote(id)}
                onPress={() => togglePick(id)}
              />
            );
          })}
        </View>
        <View style={styles.counter}>
          <Muted>
            {picks.length} / {PARAMS.PICKS_MAX} sealed
          </Muted>
          <Muted>affinity = shared windows + shared interests</Muted>
        </View>
      </Card>

      {picks.length > 0 && (
        <Card lit>
          <Eyebrow tone="lamp">Sealed picks</Eyebrow>
          {picks.map((id) => {
            const c = state.byId.get(id)!;
            return (
              <View key={id} style={styles.pickRow}>
                <Avatar seed={c.id} name={c.name} size={46} ring="lamp" />
                <View style={{ flex: 1 }}>
                  <Body>
                    {c.name} · <Muted>affinity {affinity(player, c)}</Muted>
                  </Body>
                  <Muted>{c.bio}</Muted>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      <Button
        label={picks.length ? `Seal ${picks.length} pick${picks.length > 1 ? 's' : ''} → clearing` : 'Seal an empty week'}
        onPress={submit}
      />
      <Muted style={{ textAlign: 'center' }}>
        Before clearing: everyone you see has made room to meet someone this week.
      </Muted>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5), justifyContent: 'space-between' },
  counter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(1), borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space(1) },
  pickRow: { flexDirection: 'row', gap: space(1.5), alignItems: 'center' },
});
