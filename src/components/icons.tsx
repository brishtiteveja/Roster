import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps { color: string; size?: number }

/** Card deck — "This week". */
export function DeckIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="4" width="12" height="16" rx="3" stroke={color} strokeWidth={1.8} />
      <Path d="M4.5 6.5 3.2 16.9a2.4 2.4 0 0 0 2 2.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Heart — "Connections". */
export function HeartIcon({ color, size = 24, filled }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 20s-7.2-4.6-9.2-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.2 11c-2 4.4-9.2 9-9.2 9Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Pulse line — "Observatory". */
export function PulseIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 13h4l2.4-6 4 10 2.2-4H21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Person — "Profile". */
export function PersonIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.6" stroke={color} strokeWidth={1.8} />
      <Path d="M5 20a7 7 0 0 1 14 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Sparkle — used on the match overlay. */
export function SparkIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2.2 7.1L22 12l-7.8 2.9L12 22l-2.2-7.1L2 12l7.8-2.9L12 2Z" />
    </Svg>
  );
}
