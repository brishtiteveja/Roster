import React, { useRef, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, Animated, PanResponder, Pressable, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, space } from '../theme';
import { faceUrl } from '../data/faces';

export interface DeckPerson {
  id: string;
  name: string;
  age: number;
  bio: string;
  chips: string[]; // interest / overlap tags
  overlap: string; // short "shared" line
  photos: string[]; // photo roll — tap left/right to page through
  prompts: { q: string; a: string }[]; // the Hinge-style bit you scroll to
  free?: string; // when they're around
}

const SWIPE_THRESHOLD = 110;

/** A Tinder-style swipe deck. Right = pick (seal), left = pass. */
export function Deck({
  people, picks, canPick, onPick, onSkip, onEmpty, footer,
}: {
  people: DeckPerson[];
  picks: string[];
  canPick: boolean;
  onPick: (id: string) => void;
  onSkip: (id: string) => void;
  onEmpty?: React.ReactNode;
  /** rendered directly under the pass/pick buttons, in the same column */
  footer?: React.ReactNode;
}) {
  const [footerH, setFooterH] = useState(0);
  // Tinder-style: the card fills this screen area; every control floats on top of it.
  // Measured rather than taken from the window, so overlay offsets share one bottom edge.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const cardW = box.w;
  const cardH = box.h;

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
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
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
    return (
      <View style={styles.fill}>
        <View style={[styles.fill, styles.emptyCenter]}>{onEmpty}</View>
        <View style={styles.controlsCol} pointerEvents="box-none">
          {footer}
        </View>
      </View>
    );
  }

  const picked = picks.includes(current.id);
  const next = people[index + 1];

  return (
    <View
      style={styles.fill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
      }}
    >
      {cardW > 0 && next && (
        <View style={[styles.cardWrap, { width: cardW, height: cardH, transform: [{ scale: 0.96 }, { translateY: 10 }] }]}>
          <CardFace person={next} w={cardW} h={cardH} picked={picks.includes(next.id)} dimmed bottomInset={space(10.5) + footerH + space(0.75)} />
        </View>
      )}
      {cardW > 0 && <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardWrap,
          { width: cardW, height: cardH, transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
        ]}
      >
        <CardFace person={current} w={cardW} h={cardH} picked={picked} bottomInset={space(10.5) + footerH + space(0.75)} />
        <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
          <Text style={[styles.stampText, { color: colors.verdigris, borderColor: colors.verdigris }]}>WANT</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
          <Text style={[styles.stampText, { color: colors.danger, borderColor: colors.danger }]}>PASS</Text>
        </Animated.View>
      </Animated.View>}

      <View
        style={styles.controlsCol}
        pointerEvents="box-none"
        onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
      >
        <View style={styles.controls} pointerEvents="box-none">
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
        {footer}
      </View>
    </View>
  );
}

/** One photo with Tinder-style tap zones: left half back, right half forward. */
function PhotoPager({ photos, w, h, i, onStep }: {
  photos: string[]; w: number; h: number; i: number; onStep: (d: -1 | 1) => void;
}) {
  return (
    <View style={{ width: w, height: h }}>
      <Image source={{ uri: photos[i] }} style={{ width: w, height: h * 1.12, marginTop: -h * 0.12 }} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(12,15,27,0.45)', 'transparent', 'rgba(12,15,27,0.15)', 'rgba(12,15,27,0.92)']}
        locations={[0, 0.2, 0.55, 1]}
        style={StyleSheet.absoluteFill as any}
      />
      {photos.length > 1 && (
        <View style={styles.segments}>
          {photos.map((_, k) => (
            <View key={k} style={[styles.segment, k === i && styles.segmentOn]} />
          ))}
        </View>
      )}
      <Pressable
        onPress={() => onStep(-1)}
        accessibilityLabel="previous photo"
        style={[styles.tapZone, { left: 0, width: w / 2, height: h }]}
      />
      <Pressable
        onPress={() => onStep(1)}
        accessibilityLabel="next photo"
        style={[styles.tapZone, { right: 0, width: w / 2, height: h }]}
      />
    </View>
  );
}

function CardFace({
  person, w, h, picked, dimmed, bottomInset = 0,
}: {
  person: DeckPerson; w: number; h: number; picked?: boolean; dimmed?: boolean;
  bottomInset?: number;
  progress?: { i: number; n: number };
}) {
  const [photo, setPhoto] = useState(0);
  const photos = person.photos.length ? person.photos : [faceUrl(person.id, person.name, 900)];
  const heroH = h;

  const step = (d: -1 | 1) =>
    setPhoto((p) => (p + d + photos.length) % photos.length);

  return (
    <View style={[styles.card, { width: w, height: h }, dimmed && { opacity: 0.6 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: space(2) }}
      >
        <View>
          <PhotoPager photos={photos} w={w} h={heroH} i={photo} onStep={step} />
          {picked && (
            <View style={styles.sealedBadge}>
              <Text style={styles.sealedText}>✓ SEALED</Text>
            </View>
          )}
          <View style={[styles.meta, { bottom: bottomInset }]} pointerEvents="none">
            <View style={styles.nameRow}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.age}>{person.age}</Text>
            </View>
            <Text style={styles.bio} numberOfLines={2}>{person.bio}</Text>
            <View style={styles.chips}>
              {person.overlap ? <Chip text={person.overlap} tone="lamp" /> : null}
            </View>
            <Text style={styles.scrollHint}>scroll for more ↓</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.sectionLabel}>INTO</Text>
          <View style={styles.sheetChips}>
            {person.chips.map((c) => (
              <View key={c} style={styles.sheetChip}>
                <Text style={styles.sheetChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {person.prompts.map((p, k) => (
          <React.Fragment key={p.q}>
            <View style={styles.sheet}>
              <Text style={styles.sectionLabel}>{p.q.toUpperCase()}</Text>
              <Text style={styles.answer}>{p.a}</Text>
            </View>
            {photos[k + 1] ? (
              <Image source={{ uri: photos[k + 1] }} style={{ width: w, height: Math.round(h * 0.72) }} resizeMode="cover" />
            ) : null}
          </React.Fragment>
        ))}

        {person.free ? (
          <View style={styles.sheet}>
            <Text style={styles.sectionLabel}>FREE</Text>
            <Text style={styles.answer}>{person.free}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Chip({ text, tone }: { text: string; tone?: 'lamp' }) {
  return (
    <View style={[styles.chip, tone === 'lamp' && { borderColor: colors.lamp, backgroundColor: 'rgba(255,79,110,0.22)' }]}>
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
  fill: { flex: 1 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center' },
  cardWrap: { position: 'absolute', top: 0, left: 0 },
  card: { overflow: 'hidden', backgroundColor: colors.panel },
  meta: { position: 'absolute', left: 0, right: 0, paddingHorizontal: space(2.5), gap: space(0.75) },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space(1.25) },
  name: { color: '#FFFFFF', fontSize: 30, fontWeight: '700', letterSpacing: -0.4 },
  age: { color: '#FFFFFF', fontSize: 24, fontWeight: '300', opacity: 0.9 },
  bio: { color: 'rgba(255,255,255,0.92)', fontSize: 14.5, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(12,15,27,0.35)' },
  chipText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '600', letterSpacing: 0.3 },
  tapZone: { position: 'absolute', top: 0 },
  scrollHint: { color: 'rgba(255,255,255,0.75)', fontSize: 11, letterSpacing: 1.2, marginTop: 6, fontWeight: '600' },
  sheet: { paddingHorizontal: space(2.25), paddingVertical: space(2), gap: space(1), backgroundColor: colors.panel },
  sectionLabel: { color: colors.muted, fontSize: 10.5, letterSpacing: 1.6, fontWeight: '800' },
  answer: { color: colors.bone, fontSize: 17, lineHeight: 24, fontWeight: '500' },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelHi, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  sheetChipText: { color: colors.bone, fontSize: 13, fontWeight: '600' },
  segments: { position: 'absolute', top: 10, left: 12, right: 12, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 3.5, borderRadius: 2, backgroundColor: 'rgba(236,231,221,0.28)' },
  segmentOn: { backgroundColor: colors.bone },
  segmentDone: { backgroundColor: 'rgba(233,180,76,0.85)' },
  sealedBadge: { position: 'absolute', top: space(9), right: space(2.5), backgroundColor: colors.lamp, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  sealedText: { color: colors.night, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  stamp: { position: 'absolute', top: 28, padding: 6 },
  stampLike: { left: 22, transform: [{ rotate: '-16deg' }] },
  stampNope: { right: 22, transform: [{ rotate: '16deg' }] },
  stampText: { fontSize: 30, fontWeight: '900', letterSpacing: 2, borderWidth: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2 },
  controlsCol: {
    position: 'absolute', left: space(2.5), right: space(2.5), bottom: space(10.5),
    gap: space(1.25),
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(4) },
  round: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, ...shadow.card },
  roundLabel: { fontSize: 26, fontWeight: '700', marginTop: -2 },
  progress: { minWidth: 54, alignItems: 'center' },
  progressText: { color: '#FFFFFF', fontSize: 13, letterSpacing: 1, fontWeight: '700' },
});
