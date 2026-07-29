import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, type as t } from '../theme';
import { Avatar } from './Avatar';

/** A gradient banner used at the top of screens for a consistent, rich header. */
export function Hero({
  eyebrow, title, subtitle, avatarSeed, avatarName, tone = 'lamp',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  avatarSeed?: string;
  avatarName?: string;
  tone?: 'lamp' | 'verdigris';
}) {
  const glow = tone === 'verdigris' ? 'rgba(134,184,161,0.18)' : 'rgba(233,180,76,0.18)';
  const accent = tone === 'verdigris' ? colors.verdigris : colors.lamp;
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={[glow, 'rgba(30,36,64,0.0)']}
        style={StyleSheet.absoluteFill as any}
      />
      <View style={styles.row}>
        {avatarSeed ? <Avatar seed={avatarSeed} name={avatarName ?? ''} size={56} ring={tone} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow.toUpperCase()}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    padding: space(2.25),
    gap: space(1.25),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(30,36,64,0.4)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(1.75) },
  eyebrow: { ...t.eyebrow },
  title: { ...t.h1, color: colors.bone },
  subtitle: { ...t.small, color: colors.muted, lineHeight: 20 },
});
