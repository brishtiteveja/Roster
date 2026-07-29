import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ViewStyle, TextStyle, ScrollView,
} from 'react-native';
import { colors, radius, space, type as t } from '../theme';

export function Eyebrow({ children, tone }: { children: React.ReactNode; tone?: 'lamp' | 'verdigris' | 'muted' | 'danger' }) {
  const color =
    tone === 'lamp' ? colors.lamp : tone === 'verdigris' ? colors.verdigris : tone === 'danger' ? colors.danger : colors.muted;
  return <Text style={[styles.eyebrow, { color }]}>{String(children).toUpperCase()}</Text>;
}

export function Card({ children, style, lit, good }: { children: React.ReactNode; style?: ViewStyle; lit?: boolean; good?: boolean }) {
  return (
    <View
      style={[
        styles.card,
        lit && { borderColor: colors.lamp, backgroundColor: colors.lampSoft },
        good && { borderColor: colors.verdigris, backgroundColor: colors.verdigrisSoft },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label, onPress, kind = 'primary', disabled, style,
}: {
  label: string; onPress?: () => void; kind?: 'primary' | 'ghost' | 'good' | 'danger'; disabled?: boolean; style?: ViewStyle;
}) {
  const map = {
    primary: { bg: colors.lamp, fg: colors.night, border: colors.lamp },
    good: { bg: colors.verdigris, fg: colors.night, border: colors.verdigris },
    ghost: { bg: 'transparent', fg: colors.bone, border: colors.lineStrong },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  }[kind];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: map.bg, borderColor: map.border, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnLabel, { color: map.fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: 'lamp' | 'verdigris' | 'muted' | 'danger' }) {
  const color =
    tone === 'lamp' ? colors.lamp : tone === 'verdigris' ? colors.verdigris : tone === 'danger' ? colors.danger : colors.muted;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{String(children)}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}
export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}
export function H3({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h3}>{children}</Text>;
}

/** A person "seat" node echoing the slide's board-of-six glyph. */
export function Seat({
  name, picked, cleared, onPress, size = 58, subtitle,
}: {
  name: string; picked?: boolean; cleared?: boolean; onPress?: () => void; size?: number; subtitle?: string;
}) {
  const border = cleared ? colors.lamp : picked ? colors.bone : colors.muted;
  const initials = name.slice(0, 2);
  return (
    <Pressable onPress={onPress} style={styles.seatWrap}>
      <View
        style={[
          styles.seat,
          { width: size, height: size, borderRadius: size / 2, borderColor: border, borderWidth: cleared ? 2.6 : picked ? 2.2 : 1.4 },
          cleared && { backgroundColor: colors.lampSoft },
        ]}
      >
        <Text style={[styles.seatInitials, { color: cleared ? colors.lamp : colors.bone }]}>{initials}</Text>
        {picked && !cleared && <View style={styles.seal} />}
      </View>
      <Text style={styles.seatName} numberOfLines={1}>{name}</Text>
      {subtitle ? <Text style={styles.seatSub} numberOfLines={1}>{subtitle}</Text> : null}
    </Pressable>
  );
}

export function ScreenScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ground }}
      contentContainerStyle={{ padding: space(2.5), paddingBottom: space(6), gap: space(2) }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...t.eyebrow, marginBottom: space(1) },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space(2),
    gap: space(1.25),
  },
  btn: {
    borderWidth: 1.4,
    borderRadius: radius.pill,
    paddingVertical: space(1.5),
    paddingHorizontal: space(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  pill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space(0.5) },
  body: { ...t.body, color: colors.bone },
  muted: { ...t.small, color: colors.muted },
  h1: { ...t.h1, color: colors.bone },
  h2: { ...t.h2, color: colors.bone },
  h3: { ...t.h3, color: colors.bone },
  seatWrap: { alignItems: 'center', width: 82, gap: 4 },
  seat: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground },
  seatInitials: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  seal: {
    position: 'absolute', bottom: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.bone,
  },
  seatName: { color: colors.bone, fontSize: 13, fontWeight: '600' },
  seatSub: { color: colors.muted, fontSize: 10.5, letterSpacing: 0.5 },
});
