import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space } from '../theme';
import { useStore } from '../state/store';
import { Avatar } from './Avatar';
import { SparkIcon } from './icons';
import { Button, Muted } from './ui';

const serif = Platform.select({ ios: 'Palatino', android: 'serif', default: "Palatino, 'Palatino Linotype', Georgia, serif" });

/** Graduation flow: an honest confirmation, then the celebrated exit (§4). */
export function GraduationOverlay() {
  const { state, requestGraduate, confirmGraduate, dismissCelebrate } = useStore();
  const confirmId = state.graduatePrompt;
  const celebrateId = state.celebrate;
  const connId = celebrateId ?? confirmId;

  const scale = useRef(new Animated.Value(0.75)).current;
  useEffect(() => {
    scale.setValue(0.75);
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
  }, [connId, celebrateId, scale]);

  if (!connId) return null;
  const conn = state.connections.find((c) => c.id === connId);
  if (!conn) return null;
  const pid = conn.a === state.player.id ? conn.b : conn.a;
  const name = state.byId.get(pid)?.name ?? pid;
  const celebrating = !!celebrateId;

  return (
    <View style={styles.backdrop}>
      <LinearGradient colors={[colors.night, '#12241C']} style={StyleSheet.absoluteFill as any} />
      <View style={styles.glowWrap} pointerEvents="none">
        <Svg width={420} height={420}>
          <Defs>
            <RadialGradient id="gglow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.verdigris} stopOpacity={0.24} />
              <Stop offset="60%" stopColor={colors.verdigris} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={colors.verdigris} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={210} cy={210} r={210} fill="url(#gglow)" />
        </Svg>
      </View>

      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        {celebrating ? (
          <>
            <View style={styles.sparks}>
              <View style={{ transform: [{ rotate: '-14deg' }] }}><SparkIcon color={colors.verdigris} size={22} /></View>
              <View style={{ marginTop: 16 }}><SparkIcon color={colors.lamp} size={14} /></View>
              <View style={{ transform: [{ rotate: '18deg' }] }}><SparkIcon color={colors.verdigris} size={17} /></View>
            </View>
            <Text style={styles.kicker}>THE ONLY WAY TO WIN</Text>
            <Text style={styles.headline}>Off the market.</Text>
            <View style={styles.portraits}>
              <View style={{ transform: [{ rotate: '-6deg' }, { translateX: 14 }] }}>
                <Avatar seed="you" name="You" size={124} ring="verdigris" />
              </View>
              <View style={{ transform: [{ rotate: '6deg' }, { translateX: -14 }], zIndex: 2 }}>
                <Avatar seed={pid} name={name} size={124} ring="verdigris" />
              </View>
            </View>
            <Text style={styles.names}>You & {name}, gone together.</Text>
            <Text style={styles.sub}>
              They profit when you stay. We celebrate when you leave — preferably holding hands. Anyone else
              you were seeing gets the same kind notice as ever; no one is told they lost to a love story.
            </Text>
            <View style={styles.actions}>
              <Button label="Take a bow" kind="good" onPress={dismissCelebrate} style={{ alignSelf: 'stretch' }} />
              <Muted style={{ textAlign: 'center' }}>Tell everyone. Or tell no one. Yours either way.</Muted>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.kicker}>GOING EXCLUSIVE · READ BEFORE YOU LEAP</Text>
            <Text style={styles.headline}>Just the two of you?</Text>
            <View style={styles.portraits}>
              <View style={{ transform: [{ rotate: '-6deg' }, { translateX: 14 }] }}>
                <Avatar seed="you" name="You" size={104} ring="verdigris" />
              </View>
              <View style={{ transform: [{ rotate: '6deg' }, { translateX: -14 }], zIndex: 2 }}>
                <Avatar seed={pid} name={name} size={104} ring="verdigris" />
              </View>
            </View>
            <Text style={styles.sub}>
              Going exclusive with {name} takes you both off the market — boards, picks, all of it. Anyone
              else you're seeing gets the usual kind notice, nothing more. This is the ending the whole
              system is built to want, and it only happens when you both say so.
            </Text>
            <View style={styles.actions}>
              <Button
                label="Take me off the market"
                kind="good"
                onPress={() => confirmGraduate(connId)}
                style={{ alignSelf: 'stretch' }}
              />
              <Pressable onPress={() => requestGraduate(null)} hitSlop={10}>
                <Text style={styles.dismiss}>Not yet — still savoring this</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 60, alignItems: 'center', justifyContent: 'center',
  },
  glowWrap: { position: 'absolute', top: '14%', alignSelf: 'center' },
  content: { alignItems: 'center', paddingHorizontal: space(4), gap: space(1.25), maxWidth: 480 },
  sparks: { flexDirection: 'row', gap: space(2), alignItems: 'flex-start', marginBottom: -4 },
  kicker: { color: colors.muted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  headline: {
    color: colors.verdigris, fontSize: 44, fontStyle: 'italic', fontFamily: serif as any,
    letterSpacing: -0.5, marginVertical: 2,
  },
  portraits: { flexDirection: 'row', alignItems: 'center', marginVertical: space(1.5) },
  names: { color: colors.bone, fontSize: 20, fontWeight: '700', letterSpacing: -0.2, textAlign: 'center' },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 330 },
  actions: { gap: space(1.5), marginTop: space(1.5), alignSelf: 'stretch', alignItems: 'center' },
  dismiss: { color: colors.muted, fontSize: 14, letterSpacing: 0.5, textDecorationLine: 'underline' },
});
