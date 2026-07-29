import { hashSeed } from '../engine/rng';

// Deterministic, generative avatar "photos" — original SVG built from a seed, so
// they are copyright-free by construction and render fully offline (nothing
// leaves the box). Each is a soft portrait: a gradient sky, a horizon, a head-
// and-shoulders silhouette, and a low sun — distinctive per person, never a real
// face on a synthetic profile.

const SKIES: Array<[string, string]> = [
  ['#2A2140', '#E9B44C'], // dusk gold
  ['#16302B', '#86B8A1'], // verdigris evening
  ['#1B2340', '#8A9BE0'], // blue hour
  ['#331F26', '#D98A7B'], // rose dusk
  ['#241B33', '#C9A8E0'], // lilac
  ['#12242B', '#7BC5D9'], // teal
  ['#2E2A18', '#E0C98A'], // sand
  ['#16261A', '#9BD98A'], // moss
];

const SILHOUETTES = ['#0D1018', '#141826', '#101423'];

function rand(seedNum: number) {
  let s = seedNum >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An SVG portrait string for a seed. Square, viewBox 0 0 100 100. */
export function avatarSvg(seed: string): string {
  const h = hashSeed('avatar::' + seed);
  const r = rand(h);
  const [top, bottom] = SKIES[h % SKIES.length];
  const silhouette = SILHOUETTES[(h >> 5) % SILHOUETTES.length];
  const sunX = 24 + Math.floor(r() * 52);
  const sunY = 30 + Math.floor(r() * 20);
  const sunR = 8 + Math.floor(r() * 6);
  const horizon = 60 + Math.floor(r() * 8);
  const headR = 15 + Math.floor(r() * 3);
  const headCx = 50;
  const headCy = horizon - 2;
  const shoulderW = 26 + Math.floor(r() * 8);
  const id = (h % 9973).toString(36);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="sun${id}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FDF3D8" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${bottom}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="clip${id}"><rect width="100" height="100" rx="0"/></clipPath>
  </defs>
  <g clip-path="url(#clip${id})">
    <rect width="100" height="100" fill="url(#sky${id})"/>
    <circle cx="${sunX}" cy="${sunY}" r="${sunR + 14}" fill="url(#sun${id})"/>
    <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="#FDF3D8" opacity="0.9"/>
    <rect x="0" y="${horizon + 6}" width="100" height="${100 - horizon}" fill="${bottom}" opacity="0.14"/>
    <g fill="${silhouette}">
      <circle cx="${headCx}" cy="${headCy}" r="${headR}"/>
      <path d="M${headCx - shoulderW} 100 Q${headCx} ${headCy + headR + 4} ${headCx + shoulderW} 100 Z"/>
    </g>
  </g>
</svg>`;
}

/** Encode an SVG string as a data URI usable by <Image>/SvgXml consumers. */
export function avatarDataUri(seed: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(avatarSvg(seed));
}
