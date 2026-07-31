import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '../theme';
import { PROPOSED, EvidenceSource } from '../data/persona';
import { useStore } from '../state/store';
import { Body, Button, Card, Muted, ScreenScroll } from '../components/ui';
import { Hero } from '../components/Hero';
import { SwipeDeck, DeckCard } from '../components/SwipeDeck';
import { WalkthroughScreen } from './WalkthroughScreen';

const tag: Record<EvidenceSource, { label: string; tone: 'lamp' | 'verdigris' | 'muted' }> = {
  photo: { label: 'from your photos', tone: 'muted' },
  listening: { label: 'from your music', tone: 'muted' },
  inference: { label: 'a guess', tone: 'lamp' },
};

const CARDS: DeckCard[] = PROPOSED.map((e) => ({
  id: e.id,
  image: e.image,
  tag: tag[e.source].label,
  tagTone: tag[e.source].tone,
  title: e.claim,
  note: e.basis,
}));

export function OnboardingScreen() {
  const { onboardApprove } = useStore();
  const [kept, setKept] = useState<string[]>([]);
  const [dropped, setDropped] = useState<string[]>([]);
  const [toured, setToured] = useState(false);

  if (!toured) return <WalkthroughScreen onDone={() => setToured(true)} />;

  const done = kept.length + dropped.length >= CARDS.length;

  return (
    <ScreenScroll>
      <Hero
        eyebrow="Your profile"
        title="We drafted you. You decide."
        subtitle="Swipe right if it's you. Left if it isn't. Two of these are guesses."
        avatarSeed="you"
        avatarName="You"
      />

      <SwipeDeck
        cards={CARDS}
        onDecide={(c, keep) =>
          keep ? setKept((p) => [...p, c.id]) : setDropped((p) => [...p, c.id])
        }
        onEmpty={
          <Card good={kept.length > 0}>
            <Body style={{ fontSize: 17, fontWeight: '700' }}>
              {kept.length} kept · {dropped.length} dropped
            </Body>
            <Muted>Only what you kept becomes your profile.</Muted>
          </Card>
        }
      />

      {done ? (
        <Button label="Deal me in" onPress={() => onboardApprove(kept)} disabled={kept.length === 0} />
      ) : (
        <View style={styles.tally}>
          <Muted>
            {kept.length} kept · {dropped.length} dropped
          </Muted>
        </View>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  tally: { alignItems: 'center' },
});
