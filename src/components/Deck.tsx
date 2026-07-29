import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, Pressable, useWindowDimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, space } from '../theme';
import { avatarSvg } from '../data/avatars';

export interface DeckPerson {
  id: string;
  name: string;
  age: number;
  bio: string;
  chips: string[]; // interest / overlap tags
  overlap: string; // short "shared" line
}

const SWIPE_THRESHOLD = 110;

/** A Tinder-style swipe deck. Right = pick (seal), left = pass. */
export function Deck({
  people, picks, canPick, onPick, onSkip, onEmpty,
}: {
  people: DeckPerson[];
  picks: string[];
  canPick: boolean;
  onPick: (id: string) => void;
  onSkip: (id: string) => void;
  onEmpty?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - space(5), 380);
  const cardH = Math.min(cardW * 1.34, 520);

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-cardW, 0, cardW],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const current = people[index];

  function advance() {
    position.setValue({ x: 0, y: 0 });
    setIndex((i) => i + 1);
  }

  const canPickRef = useRef(canPick);
  canPickRef.current = canPick;

  function fling(dir: 1 | -1, person: DeckPerson) {
    // A right-swipe when you're already at the pick cap resolves to a pass.
    const pick = dir === 1 && (canPickRef.current || picks.includes(person.id));
    Animated.timing(position, {
      toValue: { x: dir * (cardW + 120), y: 0 },
      duration: 240,
      useNativeDriver: false,
    }).start(() => {
      if (pick) onPick(person.id);
      else onSkip(person.id);
      advance();
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: (_e, g) => position.setValue({ x: g.dx, y: g.dy * 0.25 }),
      onPanResponderRelease: (_e, g) => {
        const p = people[indexRef.current];
        if (!p) return;
        if (g.dx > SWIPE_THRESHOLD) fling(1, p);
        else if (g.dx < -SWIPE_THRESHOLD) fling(-1, p);
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }).start();
      },
    })
  ).current;

  // keep a ref to index for the pan handler closure
  const indexRef = useRef(index);
  indexRef.current = index;

  if (!current) {
    return <View style={[styles.deckArea, { height: cardH }]}>{onEmpty}</View>;
  }

  const picked = picks.includes(current.id);
  const next = people[index + 1];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.deckArea, { width: cardW, height: cardH }]}>
        {next && (
          <View style={[styles.cardWrap, { width: cardW, height: cardH, transform: [{ scale: 0.94 }, { translateY: 14 }] }]}>
            <CardFace person={next} w={cardW} h={cardH} picked={picks.includes(next.id)} dimmed />
          </View>
        )}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.cardWrap,
            { width: cardW, height: cardH, transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
          ]}
        >
          <CardFace person={current} w={cardW} h={cardH} picked={picked} />
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.verdigris, borderColor: colors.verdigris }]}>PICK</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.danger, borderColor: colors.danger }]}>PASS</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <RoundBtn label="✕" tone="pass" onPress={() => fling(-1, current)} />
        <View style={styles.progress}>
          <Text style={styles.progressText}>{index + 1} / {people.length}</Text>
        </View>
        <RoundBtn
          label="♥"
          tone="pick"
          disabled={!canPick && !picked}
          onPress={() => (canPick ? fling(1, current) : undefined)}
        />
      </View>
    </View>
  );
}

function CardFace({ person, w, h, picked, dimmed }: { person: DeckPerson; w: number; h: number; picked?: boolean; dimmed?: boolean }) {
  return (
    <View style={[styles.card, { width: w, height: h }, dimmed && { opacity: 0.6 }]}>
      <SvgXml xml={avatarSvg(person.id)} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      <LinearGradient
        colors={['transparent', 'rgba(12,15,27,0.15)', 'rgba(12,15,27,0.92)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill as any}
      />
      {picked && (
        <View style={styles.sealedBadge}>
          <Text style={styles.sealedText}>✓ SEALED</Text>
        </View>
      )}
      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.age}>{person.age}</Text>
        </View>
        <Text style={styles.bio} numberOfLines={2}>{person.bio}</Text>
        <View style={styles.chips}>
          {person.overlap ? <Chip text={person.overlap} tone="lamp" /> : null}
          {person.chips.slice(0, 3).map((c) => <Chip key={c} text={c} />)}
        </View>
      </View>
    </View>
  );
}

function Chip({ text, tone }: { text: string; tone?: 'lamp' }) {
  return (
    <View style={[styles.chip, tone === 'lamp' && { borderColor: colors.lamp, backgroundColor: 'rgba(233,180,76,0.16)' }]}>
      <Text style={[styles.chipText, tone === 'lamp' && { color: colors.lamp }]}>{text}</Text>
    </View>
  );
}

function RoundBtn({ label, tone, onPress, disabled }: { label: string; tone: 'pick' | 'pass'; onPress?: () => void; disabled?: boolean }) {
  const color = tone === 'pick' ? colors.verdigris : colors.danger;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.round,
        { borderColor: color, opacity: disabled ? 0.3 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.roundLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deckArea: { alignItems: 'center', justifyContent: 'center' },
  cardWrap: { position: 'absolute', borderRadius: radius.xl, ...shadow.lift },
  card: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.lineStrong },
  meta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space(2.25), gap: space(0.75) },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space(1.25) },
  name: { color: colors.bone, fontSize: 30, fontWeight: '700', letterSpacing: -0.4 },
  age: { color: colors.bone, fontSize: 24, fontWeight: '300', opacity: 0.9 },
  bio: { color: 'rgba(236,231,221,0.9)', fontSize: 14.5, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: 'rgba(236,231,221,0.4)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(12,15,27,0.35)' },
  chipText: { color: colors.bone, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.3 },
  sealedBadge: { position: 'absolute', top: space(2), right: space(2), backgroundColor: colors.lamp, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  sealedText: { color: colors.night, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  stamp: { position: 'absolute', top: 28, padding: 6 },
  stampLike: { left: 22, transform: [{ rotate: '-16deg' }] },
  stampNope: { right: 22, transform: [{ rotate: '16deg' }] },
  stampText: { fontSize: 30, fontWeight: '900', letterSpacing: 2, borderWidth: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(3), marginTop: space(2.5) },
  round: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, ...shadow.card },
  roundLabel: { fontSize: 26, fontWeight: '700', marginTop: -2 },
  progress: { minWidth: 54, alignItems: 'center' },
  progressText: { color: colors.muted, fontSize: 13, letterSpacing: 1, fontWeight: '600' },
});
