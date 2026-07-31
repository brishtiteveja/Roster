// Real portraits for the cohort. Unsplash (free to use, no attribution required),
// hot-linked and face-cropped by their CDN, picked deterministically per person so
// the same name always wears the same face.

import { hashSeed } from '../engine/rng';

const face = (id: string, size: number) =>
  `https://images.unsplash.com/${id}?w=${size}&h=${size}&fit=crop&crop=faces&q=70&auto=format`;

const WOMEN = [
  'photo-1594756154841-ac5d160dbf46',
  'photo-1567516364473-233c4b6fcfbe',
  'photo-1526080652727-5b77f74eacd2',
  'photo-1580489944761-15a19d654956',
  'photo-1564564295391-7f24f26f568b',
  'photo-1562337404-3044c84ac061',
  'photo-1489278353717-f64c6ee8a4d2',
  'photo-1506863530036-1efeddceb993',
];

const MEN = [
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1568602471122-7832951cc4c5',
  'photo-1528892952291-009c663ce843',
  'photo-1600603406200-5b2a104684ac',
  'photo-1492562080023-ab3db95bfbce',
  'photo-1522529599102-193c0d76b5b6',
  'photo-1592234789031-94bf65f630ed',
  'photo-1607378119679-1b10e82b3704',
];

/** Names the cohort uses, split the way the generator alternates them. */
const WOMEN_NAMES = new Set([
  'Maya', 'Priya', 'Lena', 'Ava', 'Imani', 'Chloe', 'Yuki', 'Freya',
  'Nadia', 'Sofia', 'Rosa', 'Mina', 'Talia', 'Elise', 'Amara', 'Iris',
  'Nora', 'Zara', 'June', 'Alba', 'You',
]);

const poolFor = (name: string) => (WOMEN_NAMES.has(name) ? WOMEN : MEN);
const startFor = (seed: string, name: string) =>
  hashSeed(`face::${seed}::${name}`) % poolFor(name).length;

/** Deterministic portrait for a person. */
export function faceUrl(seed: string, name: string, size = 200): string {
  return face(poolFor(name)[startFor(seed, name)], size);
}

/** A person's photo roll. The first one is always their avatar. */
export function facePhotos(seed: string, name: string, n = 3, size = 900): string[] {
  const pool = poolFor(name);
  const start = startFor(seed, name);
  return Array.from({ length: Math.min(n, pool.length) }, (_, k) => face(pool[(start + k) % pool.length], size));
}
