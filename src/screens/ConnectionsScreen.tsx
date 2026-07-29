import React from 'react';
import { View, StyleSheet } from 'react-native';
import { space } from '../theme';
import { useStore } from '../state/store';
import { playerConnections } from '../state/orchestration';
import { PARAMS, isOpen } from '../engine';
import { Body, Card, Eyebrow, H1, Muted, ScreenScroll } from '../components/ui';
import { ConnectionCard } from '../components/ConnectionCard';

export function ConnectionsScreen() {
  const { state } = useStore();
  const all = playerConnections(state);
  const open = all.filter((c) => isOpen(c.state));
  const past = all.filter((c) => !isOpen(c.state));

  return (
    <ScreenScroll>
      <View>
        <Eyebrow tone="lamp">Your connections · at most {PARAMS.K_ACTIVE}</Eyebrow>
        <H1>Nothing trails off.</H1>
        <Muted style={{ marginTop: space(1) }}>
          Two connections is the whole capacity, so a pick means something. Either person can close, kindly,
          with no reason recorded. Miss two check-ins with nothing said and it closes for you — silence gets an
          ending instead of becoming one.
        </Muted>
      </View>

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

const styles = StyleSheet.create({});
