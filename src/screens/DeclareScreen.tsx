import React from 'react';
import { View, StyleSheet } from 'react-native';
import { space } from '../theme';
import { WINDOWS } from '../data/cohort';
import { useStore } from '../state/store';
import { openPlayerConnections } from '../state/orchestration';
import { PARAMS } from '../engine';
import { Body, Button, Card, Eyebrow, H1, Muted, Pill, ScreenScroll } from '../components/ui';
import { Heartbeat } from '../components/Heartbeat';

export function DeclareScreen() {
  const { state, declare } = useStore();
  const open = openPlayerConnections(state).length;
  const atCap = open >= PARAMS.K_ACTIVE;

  return (
    <ScreenScroll>
      <View>
        <Eyebrow tone="lamp">Week {state.week} · Monday, noon</Eyebrow>
        <H1>Do you have room this week?</H1>
      </View>

      <Card>
        <Heartbeat active="declare" />
      </Card>

      <Card>
        <Body>
          Declaring <Muted>In</Muted> puts you on this week's boards — and puts others on yours. Only people
          who raised their hand appear anywhere. You currently hold{' '}
          <Muted>{open} of {PARAMS.K_ACTIVE}</Muted> connections.
        </Body>
        <View style={styles.windows}>
          {state.player.windows.map((w) => (
            <Pill key={w} tone="muted">{WINDOWS[w]}</Pill>
          ))}
        </View>
        <Muted>Your declared windows — overlap is half of your affinity to anyone else.</Muted>
      </Card>

      {atCap ? (
        <Card lit>
          <Eyebrow tone="lamp">At capacity</Eyebrow>
          <Body>
            Two connections is the whole capacity, so a pick means something. You won't appear on boards until
            one closes. You can still tend the two you have.
          </Body>
          <Button label="Continue the week" onPress={() => declare('paused')} />
        </Card>
      ) : (
        <View style={styles.actions}>
          <Button label="I'm In — build my board" onPress={() => declare('in')} />
          <Button label="Paused this week" kind="ghost" onPress={() => declare('paused')} />
        </View>
      )}

      <Muted>
        Pausing is silent and costless — no one is told, and it never counts against you.
      </Muted>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  windows: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1), marginVertical: space(0.5) },
  actions: { gap: space(1.25) },
});
