import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { faceUrl } from '../data/faces';
import { colors } from '../theme';

/** A person's photo, deterministic per person. */
export function Avatar({
  seed, name, size = 58, ring,
}: {
  seed: string; name: string; size?: number; ring?: 'lamp' | 'verdigris' | 'bone' | 'muted';
}) {
  const border =
    ring === 'lamp' ? colors.lamp : ring === 'verdigris' ? colors.verdigris : ring === 'bone' ? colors.bone : colors.line;
  const width = ring === 'lamp' || ring === 'verdigris' ? 2.4 : 1.4;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, borderColor: border, borderWidth: width },
      ]}
    >
      <Image
        source={{ uri: faceUrl(seed, name, Math.max(160, Math.round(size * 3))) }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.panelHi, alignItems: 'center', justifyContent: 'center' },
});
