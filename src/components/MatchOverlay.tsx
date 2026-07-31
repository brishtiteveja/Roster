import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space } from '../theme';
import { Avatar } from './Avatar';
import { SparkIcon } from './icons';
import { Button } from './ui';

const serif = Platform.select({ ios: 'Palatino', android: 'serif', default: "Palatino, 'Palatino Linotype', Georgia, serif" });

/** Full-screen Recoupling reveal — the "it's mutual" moment. */
export function MatchOverlay({
  partnerName, partnerSeed, week, onHello, onDismiss,
}: {
  partnerName: string;
  partnerSeed: string;
  week: number;
  onHello: () => void;
  onDismiss: () => void;
}) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [scale, fade]);

  return (
    <Animated.View style={[styles.backdrop, { opacity: fade }]}>
      <LinearGradient
        colors={[colors.night, colors.ground]}
        style={StyleSheet.absoluteFill as any}
      />
      {/* ambient lamp glow — SVG radial so it feathers properly */}
      <View style={styles.glowWrap} pointerEvents="none">
        <Svg width={420} height={420}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.lamp} stopOpacity={0.22} />
              <Stop offset="60%" stopColor={colors.lamp} stopOpacity={0.07} />
              <Stop offset="100%" stopColor={colors.lamp} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={210} cy={210} r={210} fill="url(#glow)" />
        </Svg>
      </View>

      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        <View style={styles.sparks}>
          <View style={{ transform: [{ rotate: '-12deg' }] }}><SparkIcon color={colors.lamp} size={22} /></View>
          <View style={{ marginTop: 18 }}><SparkIcon color={colors.verdigris} size={13} /></View>
          <View style={{ transform: [{ rotate: '20deg' }], marginTop: 4 }}><SparkIcon color={colors.lamp} size={16} /></View>
        </View>

        <Text style={styles.kicker}>MONDAY 18:00 · WEEK {week} · THE REVEAL</Text>
        <Text style={styles.headline}>The feeling's mutual.</Text>

        <View style={styles.portraits}>
          <View style={[styles.portrait, { transform: [{ rotate: '-6deg' }, { translateX: 14 }] }]}>
            <Avatar seed="you" name="You" size={124} ring="lamp" />
          </View>
          <View style={[styles.portrait, { transform: [{ rotate: '6deg' }, { translateX: -14 }], zIndex: 2 }]}>
            <Avatar seed={partnerSeed} name={partnerName} size={124} ring="lamp" />
          </View>
        </View>

        <Text style={styles.names}>You & {partnerName}</Text>
        <Text style={styles.sub}>
          You picked each other before you'd even said hello.
        </Text>

        <View style={styles.actions}>
          <Button label="Make the first move" onPress={onHello} style={{ alignSelf: 'stretch' }} />
          <Pressable onPress={onDismiss} hitSlop={10}>
            <Text style={styles.dismiss}>Play it cool</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: { position: 'absolute', top: '14%', alignSelf: 'center' },
  content: { alignItems: 'center', paddingHorizontal: space(4), gap: space(1.25), maxWidth: 480 },
  sparks: { flexDirection: 'row', gap: space(2), alignItems: 'flex-start', marginBottom: -6 },
  kicker: { color: colors.muted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  headline: {
    color: colors.lamp, fontSize: 46, fontStyle: 'italic', fontFamily: serif as any,
    letterSpacing: -0.5, marginVertical: 2,
  },
  portraits: { flexDirection: 'row', alignItems: 'center', marginVertical: space(1.5) },
  portrait: { borderRadius: 70 },
  names: { color: colors.bone, fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  actions: { gap: space(1.5), marginTop: space(1.5), alignSelf: 'stretch', alignItems: 'center' },
  dismiss: { color: colors.muted, fontSize: 14, letterSpacing: 0.5, textDecorationLine: 'underline' },
});
