import { Participant } from '../engine';
import { RNG } from '../engine/rng';

/** The shared weekly availability grid (windows are indices into this). */
export const WINDOWS = [
  'Mon evening',
  'Tue evening',
  'Wed evening',
  'Thu evening',
  'Fri evening',
  'Sat afternoon',
  'Sat evening',
  'Sun afternoon',
] as const;

export const INTERESTS = [
  'live music', 'climbing', 'film', 'cooking', 'poetry', 'running',
  'board games', 'ceramics', 'jazz', 'hiking', 'photography', 'cycling',
  'dogs', 'coffee', 'theatre', 'gardening', 'chess', 'surfing',
] as const;

const NAMES = [
  'Maya', 'Theo', 'Priya', 'Sam', 'Lena', 'Noah', 'Ava', 'Diego',
  'Imani', 'Ravi', 'Chloe', 'Marcus', 'Yuki', 'Omar', 'Freya', 'Ben',
  'Nadia', 'Leo', 'Sofia', 'Kai', 'Rosa', 'Ezra', 'Mina', 'Jonah',
  'Talia', 'Arjun', 'Elise', 'Cole', 'Amara', 'Finn', 'Iris', 'Dev',
  'Nora', 'Luca', 'Zara', 'Isaac', 'June', 'Milo', 'Alba', 'Reza',
];

export interface Persona extends Participant {
  name: string;
  /** a one-line inner voice used by the (mocked) spotlight narrator. */
  voice: string;
  /** simple attractiveness/selectivity weight driving simulated picks (0..1). */
  appeal: number;
}

const VOICES = [
  'six people, one opening — I want it to matter',
  'I keep my picks small; a yes should cost something',
  'still learning what I actually want on a Tuesday',
  'here for the one conversation that keeps going',
  'I noticed we both had Saturday open',
  'trying to be braver about the broadening pick',
  'not rushing — two is plenty to hold well',
  'I liked that nobody gets told they were passed over',
];

/**
 * Deterministically build a Season-0-sized cohort (30–40) from a seed. The
 * human player is inserted separately; everyone here is a simulated participant
 * whose picks the engine will clear against the player's.
 */
export function buildCohort(seed: string, size = 34): Persona[] {
  const rng = new RNG('cohort::' + seed);
  const people: Persona[] = [];
  for (let i = 0; i < size; i++) {
    // Abstract orientation: gender in {a,b}, seeks a subset — mixed so the
    // eligibility graph is rich and everyone can be given a viable board.
    const gender = rng.next() < 0.5 ? 'a' : 'b';
    const r = rng.next();
    const seeks = r < 0.42 ? ['a'] : r < 0.84 ? ['b'] : ['a', 'b'];

    const nWindows = 3 + rng.int(3); // 3–5 windows open
    const windows = rng
      .shuffle([...WINDOWS.keys()])
      .slice(0, nWindows)
      .sort((x, y) => x - y);

    const nInterests = 3 + rng.int(3);
    const interests = rng
      .shuffle([...INTERESTS])
      .slice(0, nInterests);

    people.push({
      id: `sim_${i}`,
      name: NAMES[i % NAMES.length],
      windows,
      interests,
      is: [gender],
      seeks,
      voice: VOICES[i % VOICES.length],
      appeal: 0.35 + rng.next() * 0.6,
    });
  }
  return people;
}

/** The human player's starting participant (their declarations edited in-app). */
export function makePlayer(): Persona {
  return {
    id: 'you',
    name: 'You',
    windows: [0, 4, 6], // Mon eve, Fri eve, Sat eve
    interests: ['live music', 'film', 'coffee', 'hiking'],
    is: ['a'],
    seeks: ['b'],
    voice: 'my one opening — spending it where there is room',
    appeal: 0.6,
  };
}
