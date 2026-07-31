import React from 'react';
import { useStore } from '../state/store';
import { playerConnections } from '../state/orchestration';
import { Body, Button, Card, H2, Muted, Stat, StatRow, ScreenScroll } from '../components/ui';
import { Hero } from '../components/Hero';
import { ConnectionCard } from '../components/ConnectionCard';

export function SeasonEndScreen() {
  const { state, reset } = useStore();
  const conns = playerConnections(state);
  const graduated = conns.filter((c) => c.state === 'GRADUATED');
  const kept = conns.filter((c) => c.state === 'ACTIVE' || c.state === 'CHECKPOINT_OPEN');
  const totalIntros = conns.length;
  const cohortIntros = state.metrics.reduce((s, m) => s + m.introductions, 0);

  return (
    <ScreenScroll>
      <Hero
        eyebrow="Season 0 · six weeks · complete"
        title={graduated.length ? 'You found someone.' : 'Season closed.'}
        subtitle="We count the people who leave. Others count the ones who stay."
        tone={graduated.length ? 'verdigris' : 'lamp'}
        avatarSeed="you"
        avatarName="You"
      />

      <Card good={graduated.length > 0}>
        <StatRow>
          <Stat n={totalIntros} label="matches you made" />
          <Stat n={graduated.length} label="left together" tone="verdigris" />
          <Stat n={kept.length} label="still sparking next season" tone="bone" />
        </StatRow>
        <Muted>{cohortIntros} matches made this season.</Muted>
      </Card>

      {graduated.map((c) => (
        <ConnectionCard key={c.id} conn={c} />
      ))}

      <Card>
        <H2>What the twin was for</H2>
        <Body>
          Most apps A/B test on people. This one tested every rule on a twin first — the same deterministic
          engine you just played — then runs one season by hand. Nothing in the demo left this box.
        </Body>
      </Card>

      <Button label="Run another season (new seed)" onPress={() => reset('roster-season-0::' + state.week + Date.now())} />
    </ScreenScroll>
  );
}
