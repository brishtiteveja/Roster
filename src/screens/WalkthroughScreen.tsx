// The first-run walkthrough: how Porch works, and why it isn't a swipe app.
// A paged carousel of small animated scenes plus a scrollable week timeline.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Animated, StyleSheet, useWindowDimensions, Easing,
} from 'react-native';
import { colors, radius, shadow, space } from '../theme';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui';
import { HeartIcon, CheckIcon, XIcon } from '../components/icons';

const DEMO_SEEDS = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'];
const DEMO_NAMES = ['Maya', 'Theo', 'Priya', 'Sam', 'Lena', 'Noah'];

/** Runs a staggered entrance when `active` flips true; resets when it flips false. */
function useEntrance(active: boolean, count: number, delay = 140) {
  const vals = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (!active) {
      vals.forEach((v) => v.setValue(0));
      return;
    }
    Animated.stagger(
      delay,
      vals.map((v) =>
        Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 })
      )
    ).start();
  }, [active]);
  return vals;
}

function Enter({ v, children, from = 24 }: { v: Animated.Value; children: React.ReactNode; from?: number }) {
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/* ---------------------------------- slides ---------------------------------- */

function SlideLight({ active }: { active: boolean }) {
  const [head, sub, note] = useEntrance(active, 3);
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <View style={styles.slideBody}>
      <View style={styles.lampWrap}>
        <Animated.View
          style={[
            styles.lampHalo,
            {
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
            },
          ]}
        />
        <View style={styles.lampCore} />
      </View>
      <Enter v={head}><Text style={styles.h1}>This is Porch.</Text></Enter>
      <Enter v={sub}>
        <Text style={styles.lead}>
          Six people, once a week.{'\n'}No feed. No swiping at 1am.
        </Text>
      </Enter>
      <Enter v={note}>
        <Text style={styles.note}>
          Your porch light says it all — on means you have room{'\n'}to meet someone this week. Off means you don't.
        </Text>
      </Enter>
    </View>
  );
}

function SlideSix({ active }: { active: boolean }) {
  const vals = useEntrance(active, 8, 90);
  return (
    <View style={styles.slideBody}>
      <Enter v={vals[0]}><Text style={styles.kicker}>MONDAY · 6:00 PM</Text></Enter>
      <Enter v={vals[1]}><Text style={styles.h1}>Your six arrive.</Text></Enter>
      <View style={styles.sixGrid}>
        {DEMO_SEEDS.map((s, i) => (
          <Enter key={s} v={vals[i + 2]} from={36}>
            <View style={styles.sixCell}>
              <Avatar seed={s} name={DEMO_NAMES[i]} size={72} ring={i === 0 ? 'lamp' : 'muted'} />
              <Text style={styles.sixName}>{DEMO_NAMES[i]}</Text>
            </View>
          </Enter>
        ))}
      </View>
      <Text style={styles.note}>
        Every one of them said yes to being met this week.{'\n'}No dead profiles. This is the whole week — no feed behind it.
      </Text>
    </View>
  );
}

function SlideSeal({ active }: { active: boolean }) {
  const [head, sub] = useEntrance(active, 2);
  const stamps = useEntrance(active, 3, 350);
  return (
    <View style={styles.slideBody}>
      <Enter v={head}><Text style={styles.kicker}>ALL WEEK</Text></Enter>
      <Enter v={sub}><Text style={styles.h1}>Pick up to three.{'\n'}Sealed.</Text></Enter>
      <View style={styles.stampRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.miniCard}>
            <Avatar seed={DEMO_SEEDS[i]} name={DEMO_NAMES[i]} size={56} ring="muted" />
            <Animated.View
              style={[
                styles.stamp,
                {
                  opacity: stamps[i],
                  transform: [
                    { rotate: '-14deg' },
                    { scale: stamps[i].interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
                  ],
                },
              ]}
            >
              <Text style={styles.stampText}>SEALED</Text>
            </Animated.View>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        Take the whole week — there's no countdown.{'\n'}
        Nobody ever sees a pass. A pick stays secret unless it's mutual.
      </Text>
    </View>
  );
}

function SlideLock({ active }: { active: boolean }) {
  const [head, sub, lock, note] = useEntrance(active, 4, 200);
  return (
    <View style={styles.slideBody}>
      <Enter v={head}><Text style={styles.kicker}>SUNDAY · 6:00 PM</Text></Enter>
      <Enter v={sub}><Text style={styles.h1}>Picks lock.</Text></Enter>
      <Enter v={lock} from={40}>
        <Text style={styles.bigGlyph}>🤫</Text>
      </Enter>
      <Enter v={note}>
        <Text style={styles.note}>
          Overnight, the matching runs in secret.{'\n'}
          You meet only when you picked each other — and both have room.{'\n'}
          Not matching is never a verdict. Nobody is told anything.
        </Text>
      </Enter>
    </View>
  );
}

function SlideReveal({ active }: { active: boolean }) {
  const [head, sub, duo, note] = useEntrance(active, 4, 220);
  const heart = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { heart.setValue(0); return; }
    Animated.sequence([
      Animated.delay(900),
      Animated.spring(heart, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }, [active]);

  return (
    <View style={styles.slideBody}>
      <Enter v={head}><Text style={styles.kicker}>NEXT MONDAY · 6:00 PM</Text></Enter>
      <Enter v={sub}><Text style={styles.h1}>Two things at once.</Text></Enter>
      <Enter v={duo} from={30}>
        <View style={styles.duoRow}>
          <View style={{ transform: [{ rotate: '-5deg' }, { translateX: 10 }] }}>
            <Avatar seed="you" name="You" size={88} ring="lamp" />
          </View>
          <Animated.View style={[styles.duoHeart, { opacity: heart, transform: [{ scale: heart }] }]}>
            <HeartIcon color={colors.lamp} size={30} filled />
          </Animated.View>
          <View style={{ transform: [{ rotate: '5deg' }, { translateX: -10 }] }}>
            <Avatar seed={DEMO_SEEDS[0]} name={DEMO_NAMES[0]} size={88} ring="lamp" />
          </View>
        </View>
      </Enter>
      <Enter v={note}>
        <Text style={styles.note}>
          1 · If someone picked you back, you meet them now — chat unlocks.{'\n'}
          2 · A fresh six lands for the new week.{'\n'}
          Matched or not, Monday always brings something.
        </Text>
      </Enter>
    </View>
  );
}

function SlideRules({ active }: { active: boolean }) {
  const vals = useEntrance(active, 9, 110);
  const can = ['Keep talking to your two', 'Check in weekly', 'Close one early, kindly', 'Go exclusive together'];
  const cant = ['Browse new people', 'Submit picks', 'Appear on anyone’s board'];
  return (
    <View style={styles.slideBody}>
      <Enter v={vals[0]}><Text style={styles.kicker}>THE ONLY LIMIT</Text></Enter>
      <Enter v={vals[1]}><Text style={styles.h1}>Two at a time.</Text></Enter>
      <View style={styles.rules}>
        {can.map((c, i) => (
          <Enter key={c} v={vals[i + 2]} from={16}>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleDot, { backgroundColor: colors.verdigrisSoft }]}>
                <CheckIcon color={colors.verdigris} size={15} />
              </View>
              <Text style={styles.ruleText}>{c}</Text>
            </View>
          </Enter>
        ))}
        <Enter v={vals[6]} from={16}>
          <Text style={styles.rulesDivider}>At two connections, your light turns off —</Text>
        </Enter>
        {cant.map((c, i) => (
          <Enter key={c} v={vals[i + 7] ?? vals[8]} from={16}>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleDot, { backgroundColor: 'rgba(242,84,91,0.12)' }]}>
                <XIcon color={colors.danger} size={15} />
              </View>
              <Text style={[styles.ruleText, { color: colors.muted }]}>{c}</Text>
            </View>
          </Enter>
        ))}
      </View>
      <Text style={styles.note}>A spot opens the moment a connection closes.{'\n'}Then your light can come back on.</Text>
    </View>
  );
}

/* one week, as a strip you can actually scroll */
const TIMELINE = [
  { t: 'MON 6PM', title: 'Your six arrive', body: 'All week to look.\nNo rush, no timer.', glyph: '💡' },
  { t: 'ALL WEEK', title: 'Consider', body: 'Revisit as often as\nyou like. Pick up to 3.', glyph: '👀' },
  { t: 'SUN 6PM', title: 'Picks lock', body: 'Sealed for everyone\nat the same moment.', glyph: '🤐' },
  { t: 'OVERNIGHT', title: 'Matching, in secret', body: 'Mutual picks + room\non both sides.', glyph: '🌙' },
  { t: 'MON 6PM', title: 'The reveal', body: 'Meet who picked you\nback — chat unlocks.', glyph: '💬' },
  { t: 'SAME MOMENT', title: 'A fresh six', body: 'The week begins\nagain.', glyph: '🔁' },
];

function SlideTimeline({ active }: { active: boolean }) {
  const [head, sub, strip] = useEntrance(active, 3, 180);
  return (
    <View style={[styles.slideBody, { justifyContent: 'flex-start', paddingTop: space(6) }]}>
      <Enter v={head}><Text style={styles.kicker}>ONE WEEK ON PORCH</Text></Enter>
      <Enter v={sub}><Text style={styles.h1}>The rhythm.</Text></Enter>
      <Enter v={strip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeline}
          decelerationRate="fast"
          snapToInterval={196}
        >
          {TIMELINE.map((n, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineNode, i === 0 && { backgroundColor: colors.lamp, borderColor: colors.lamp }]} />
                {i < TIMELINE.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineCard}>
                <Text style={styles.timelineGlyph}>{n.glyph}</Text>
                <Text style={styles.timelineTime}>{n.t}</Text>
                <Text style={styles.timelineTitle}>{n.title}</Text>
                <Text style={styles.timelineBody}>{n.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Enter>
    </View>
  );
}

/* --------------------------------- shell --------------------------------- */

const SLIDES = [SlideLight, SlideSix, SlideSeal, SlideLock, SlideReveal, SlideRules, SlideTimeline];

export function WalkthroughScreen({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const ref = useRef<ScrollView>(null);
  const last = page === SLIDES.length - 1;

  const go = (p: number) => ref.current?.scrollTo({ x: p * width, animated: true });

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {SLIDES.map((S, i) => (
          <View key={i} style={{ width }}>
            <S active={page === i} />
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={onDone} hitSlop={12} style={styles.skip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
        <Button
          label={last ? "I'm ready — set up my profile" : 'Next'}
          onPress={() => (last ? onDone() : go(page + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.ground },
  slideBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space(3.5), paddingBottom: space(16), gap: space(1.5),
  },
  kicker: { color: colors.lamp, fontSize: 12, fontWeight: '800', letterSpacing: 2.4, textAlign: 'center' },
  h1: { color: colors.bone, fontSize: 32, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center', lineHeight: 38 },
  lead: { color: colors.bone, fontSize: 17, lineHeight: 25, textAlign: 'center', fontWeight: '500' },
  note: { color: colors.muted, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },

  lampWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: space(1) },
  lampHalo: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: colors.lamp },
  lampCore: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lamp, ...shadow.lift },

  sixGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: space(2), maxWidth: 320, marginVertical: space(1),
  },
  sixCell: { alignItems: 'center', gap: 4, width: 84 },
  sixName: { color: colors.bone, fontSize: 12.5, fontWeight: '600' },

  stampRow: { flexDirection: 'row', gap: space(1.5), marginVertical: space(1.5) },
  miniCard: {
    width: 92, height: 116, borderRadius: radius.lg, backgroundColor: colors.panel,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  stamp: {
    position: 'absolute', bottom: 10, borderWidth: 2.4, borderColor: colors.lamp,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: 'rgba(255,255,255,0.85)',
  },
  stampText: { color: colors.lamp, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },

  bigGlyph: { fontSize: 84, marginVertical: space(1) },

  duoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: space(1.5) },
  duoHeart: {
    zIndex: 2, backgroundColor: colors.panel, width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', ...shadow.lift,
  },

  rules: { gap: space(1.1), maxWidth: 330, alignSelf: 'center', marginVertical: space(0.5) },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: space(1.25) },
  ruleDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ruleText: { color: colors.bone, fontSize: 15, fontWeight: '600', flex: 1 },
  rulesDivider: { color: colors.muted, fontSize: 12.5, fontStyle: 'italic', marginVertical: 2 },

  timeline: { paddingHorizontal: space(3), paddingVertical: space(2) },
  timelineItem: { width: 196 },
  timelineTrack: { flexDirection: 'row', alignItems: 'center', height: 20, marginBottom: space(1) },
  timelineNode: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2.4,
    borderColor: colors.lineStrong, backgroundColor: colors.panel, zIndex: 1,
  },
  timelineLine: { flex: 1, height: 2, backgroundColor: colors.line, marginLeft: 2 },
  timelineCard: {
    marginRight: space(1.5), backgroundColor: colors.panel, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: space(2), gap: 4, minHeight: 150, ...shadow.card,
  },
  timelineGlyph: { fontSize: 26 },
  timelineTime: { color: colors.lamp, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  timelineTitle: { color: colors.bone, fontSize: 16, fontWeight: '700' },
  timelineBody: { color: colors.muted, fontSize: 12.5, lineHeight: 18 },

  skip: { position: 'absolute', top: space(2), right: space(2.5), padding: 6 },
  skipText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  footer: {
    position: 'absolute', left: space(2.5), right: space(2.5), bottom: space(3.5), gap: space(2),
  },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { backgroundColor: colors.lamp, width: 22 },
});
