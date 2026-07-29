import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      <SvgXml xml={avatarSvg(seed)} width={size} height={size} />
      {name ? (
        <View style={styles.tagWrap} pointerEvents="none">
          <Text style={styles.tag}>{name.slice(0, 2)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' },
  tagWrap: { position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(12,15,27,0.55)', borderRadius: 6, paddingHorizontal: 3 },
  tag: { color: colors.bone, fontSize: 8.5, fontWeight: '700', letterSpacing: 0.5 },
});
