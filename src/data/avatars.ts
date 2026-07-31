import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { hashSeed } from '../engine/rng';

// Profile imagery — generated offline with DiceBear (MIT), so the app ships its
// own faces: free, no attribution, no network, no real person on a synthetic
// profile. Each avatar is deterministic per seed and sits on a per-person
// gradient so cards read rich and photo-like.

const GRADIENTS: Array<[string, string]> = [
  ['e9b44c', 'c67b3d'], ['86b8a1', '4e7e7a'], ['8a9be0', '5563a8'],
  ['d98a7b', 'a8566b'], ['c9a8e0', '7e5aa8'], ['7bc5d9', '3d7e8f'],
  ['e0c98a', 'a8925a'], ['9bd98a', '5a8f4e'], ['e4a0b7', 'b05a7e'],
  ['f2b56b', 'd07a3d'],
];

/** A full DiceBear SVG portrait for a seed, on a deterministic gradient. */
export function avatarSvg(seed: string): string {
  const h = hashSeed('roster-face::' + seed);
  const g = GRADIENTS[h % GRADIENTS.length];
  return createAvatar(lorelei, {
    seed,
    size: 256,
    radius: 0,
    backgroundColor: g,
    backgroundType: ['gradientLinear'],
    backgroundRotation: [(h >> 3) % 360],
    // Editorial line-art style, warm expressions only — a dating-app crowd.
    mouth: Array.from({ length: 18 }, (_, i) => 'happy' + String(i + 1).padStart(2, '0')) as any,
  }).toString();
}

/** The two gradient stops used for a seed (hex, no #) — for matching scrims. */
export function avatarGradient(seed: string): [string, string] {
  const h = hashSeed('roster-face::' + seed);
  return GRADIENTS[h % GRADIENTS.length];
}

export function avatarDataUri(seed: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(avatarSvg(seed));
}
