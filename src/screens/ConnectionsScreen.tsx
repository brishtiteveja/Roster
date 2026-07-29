import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { useStore } from '../state/store';
import { playerConnections } from '../state/orchestration';
import { PARAMS, isOpen } from '../engine';
import { Body, Card, Eyebrow, ScreenScroll } from '../components/ui';
import { Hero } from '../components/Hero';
import { Avatar } from '../components/Avatar';
import { ConnectionCard } from '../components/ConnectionCard';

export function ConnectionsScreen() {
  const { state } = useStore();
  const all = playerConnections(state);
  const open = all.filter((c) => isOpen(c.state));
  const past = all.filter((c) => !isOpen(c.state));

  return (
    <ScreenScroll>
      <Hero
        eyebrow={`Your connections · at most ${PARAMS.K_ACTIVE}`}
        title="Nothing trails off."
        subtitle="A pick means something. Either person can close, kindly, with no reason recorded. Miss two check-ins in silence and it closes — silence gets an ending instead of becoming one."
      />

      {open.length > 0 && (
        <View style={styles.strip}>
          {open.map((c) => {
            const pid = c.a === state.player.id ? c.b : c.a;
            const isNew = c.weekIntroduced === state.week;
            return (
              <View key={c.id} style={styles.stripItem}>
                <Avatar seed={pid} name={state.byId.get(pid)?.name ?? ''} size={68} ring={isNew ? 'lamp' : 'muted'} />
                <Text style={styles.stripName}>{state.byId.get(pid)?.name}</Text>
                {isNew && <Text style={styles.newTag}>NEW</Text>}
              </View>
            );
          })}
        </View>
      )}

      {open.length === 0 && (
        <Card>
          <Body>No open connections right now. Declare In to appear on boards again.</Body>
        </Card>
      )}

      {open.map((c) => (
        <ConnectionCard key={c.id} conn={c} />
      ))}

      {past.length > 0 && (
        <View style={{ gap: space(1.5), marginTop: space(1) }}>
          <Eyebrow>Closed & graduated</Eyebrow>
          {past.map((c) => (
            <ConnectionCard key={c.id} conn={c} />
          ))}
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: space(2.25), paddingVertical: space(0.5) },
  stripItem: { alignItems: 'center', gap: 4 },
  stripName: { color: colors.bone, fontSize: 12.5, fontWeight: '600' },
  newTag: {
    color: colors.night, backgroundColor: colors.lamp, fontSize: 9, fontWeight: '800',
    letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: 'hidden',
  },
});
