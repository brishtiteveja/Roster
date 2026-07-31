// Deterministic, seedable RNG. The whole engine is a pure function of a seed,
// so every board and every clearing is reproducible from `seed_w` (§2.2 commit–reveal).
// No Date.now(), no Math.random() — reproduction is a first-class property.

/** Hash an arbitrary string to a 32-bit unsigned integer (xmur3). */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** A published commitment to a seed, without revealing it (§2.2 step 1). */
export function commit(seed: string): string {
  // A short hex digest stands in for a real cryptographic hash in this demo.
  return hashSeed('commit::' + seed).toString(16).padStart(8, '0');
}

/** mulberry32 — small, fast, good enough for a deterministic market twin. */
export class RNG {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Fisher–Yates shuffle, returning a new array (does not mutate input). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Pick one uniformly. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }
}
