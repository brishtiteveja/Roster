// A swipeable card deck: right = keep, left = drop.
// Plain Animated + PanResponder so it needs no extra native dependency.

import React, { useMemo, useRef, useState } from 'react';
import {
  Animated, Dimensions, Image, PanResponder, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, space } from '../theme';

const SCREEN = Dimensions.get('window').width;
const SWIPE_X = SCREEN * 0.26;
const CARD_H = 420;

export interface DeckCard {
  id: string;
  image: string;
  tag: string;
  tagTone: 'lamp' | 'verdigris' | 'muted';
  title: string;
  note: string;
}

export function SwipeDeck({
  cards, onDecide, onEmpty,
}: {
  cards: DeckCard[];
  onDecide: (card: DeckCard, keep: boolean) => void;
  onEmpty?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const pos = useRef(new Animated.ValueXY()).current;

  const top = cards[i];
  const next = cards[i + 1];

  const fling = (keep: boolean) => {
    const card = cards[i];
    if (!card) return;
    Animated.timing(pos, {
      toValue: { x: keep ? SCREEN * 1.4 : -SCREEN * 1.4, y: 40 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      pos.setValue({ x: 0, y: 0 });
      setI((n) => n + 1);
      onDecide(card, keep);
    });
  };

  const pan = useMemo(() => {
    const settle = (dx: number, vx: number) => {
      if (Math.abs(dx) > SWIPE_X || Math.abs(vx) > 0.5) fling(dx > 0);
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
    };
    const horizontal = (g: { dx: number; dy: number }) =>
      Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy);
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => horizontal(g),
      onMoveShouldSetPanResponderCapture: (_e, g) => horizontal(g),
      // Never hand the gesture back to the enclosing ScrollView mid-swipe — doing so
      // stranded the card off-centre with its stamp showing and ate the decision.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => pos.setValue({ x: g.dx, y: g.dy * 0.35 }),
      onPanResponderRelease: (_e, g) => settle(g.dx, g.vx),
      onPanResponderTerminate: (_e, g) => settle(g.dx, g.vx),
    });
  }, [i, cards]);

  if (!top) return <>{onEmpty}</>;

  const rotate = pos.x.interpolate({
    inputRange: [-SCREEN, 0, SCREEN],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const keepOpacity = pos.x.interpolate({ inputRange: [20, SWIPE_X], outputRange: [0, 1], extrapolate: 'clamp' });
  const dropOpacity = pos.x.interpolate({ inputRange: [-SWIPE_X, -20], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = pos.x.interpolate({
    inputRange: [-SWIPE_X, 0, SWIPE_X],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.stack}>
        {next ? (
          <Animated.View style={[styles.card, styles.behind, { transform: [{ scale: nextScale }] }]}>
            <Image source={{ uri: next.image }} style={styles.img} />
            <View style={styles.dim} />
          </Animated.View>
        ) : null}

        <Animated.View
          {...pan.panHandlers}
          style={[styles.card, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}
        >
          <Image source={{ uri: top.image }} style={styles.img} />
          <LinearGradient
            colors={['rgba(12,15,27,0.05)', 'rgba(12,15,27,0.72)', 'rgba(12,15,27,0.97)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View style={[styles.stamp, styles.stampKeep, { opacity: keepOpacity }]}>
            <Text style={[styles.stampText, { color: colors.verdigris }]}>THAT'S ME</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampDrop, { opacity: dropOpacity }]}>
            <Text style={[styles.stampText, { color: colors.danger }]}>NOT ME</Text>
          </Animated.View>

          <View style={styles.top}>
            <View style={[styles.tag, { borderColor: top.tagTone === 'lamp' ? colors.lamp : 'rgba(255,255,255,0.6)' }]}>
              <Text style={[styles.tagText, { color: top.tagTone === 'lamp' ? colors.lamp : '#FFFFFF' }]}>{top.tag}</Text>
            </View>
            <Text style={styles.count}>{i + 1} / {cards.length}</Text>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.title}>{top.title}</Text>
            <Text style={styles.note}>{top.note}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.hintRow}>
        <Pressable
          onPress={() => fling(false)}
          accessibilityRole="button"
          accessibilityLabel="not me"
          style={({ pressed }) => [styles.circle, { borderColor: colors.danger, opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.circleGlyph, { color: colors.danger }]}>✕</Text>
        </Pressable>
        <Text style={styles.hint}>swipe</Text>
        <Pressable
          onPress={() => fling(true)}
          accessibilityRole="button"
          accessibilityLabel="that's me"
          style={({ pressed }) => [styles.circle, { borderColor: colors.verdigris, opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.circleGlyph, { color: colors.verdigris }]}>♥</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(2) },
  stack: { height: CARD_H },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CARD_H,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.lift,
  },
  behind: { top: 0 },
  img: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,15,27,0.6)' },
  top: {
    position: 'absolute', top: space(2), left: space(2), right: space(2),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tag: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: 'rgba(12,15,27,0.5)' },
  tagText: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  count: { color: '#FFFFFF', fontSize: 12, letterSpacing: 1, opacity: 0.85 },
  bottom: { position: 'absolute', left: space(2.5), right: space(2.5), bottom: space(2.5), gap: 6 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '700', letterSpacing: -0.3, lineHeight: 29 },
  note: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20 },
  stamp: { position: 'absolute', top: space(6), borderWidth: 3, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  stampKeep: { left: space(2.5), transform: [{ rotate: '-12deg' }], borderColor: colors.verdigris },
  stampDrop: { right: space(2.5), transform: [{ rotate: '12deg' }], borderColor: colors.danger },
  stampText: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(3) },
  circle: {
    width: 58, height: 58, borderRadius: 29, borderWidth: 1.6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel,
  },
  circleGlyph: { fontSize: 22, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
});
