import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { avatarSvg } from '../data/avatars';
import { colors } from '../theme';

/** A generative portrait "photo" for a person, seeded deterministically. */
export function Avatar({
  seed, name, size = 58, ring,
}: {
  seed: string; name: string; size?: number; ring?: 'lamp' | 'verdigris' | 'bone' | 'muted';
}) {
  const border =
    ring === 'lamp' ? colors.lamp : ring === 'verdigris' ? colors.verdigris : ring === 'bone' ? colors.bone : colors.muted;
  const width = ring === 'lamp' || ring === 'verdigris' ? 2.4 : 1.4;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, borderColor: border, borderWidth: width },
      ]}
    >
      <SvgXml xml={avatarSvg(seed)} width={size} height={size} preserveAspectRatio="xMidYMid slice" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
});
