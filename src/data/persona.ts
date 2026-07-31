// The propose–approve persona slice (handoff §3.6, persona-graph slide).
// A local model *proposes* profile evidence from the player's media; the person
// approves, edits, or deletes each item. Agency is the product, not extraction.
// Every item is labelled by source; nothing is auto-accepted.

export type EvidenceSource = 'photo' | 'listening' | 'inference';

export interface ProposedEvidence {
  id: string;
  source: EvidenceSource;
  /** what the model drafted. */
  claim: string;
  /** the model's stated basis — always shown, so the person can judge it. */
  basis: string;
  /** interest tag this maps to, if approved (feeds affinity a(u,v)). */
  interest?: string;
  /** card art. Unsplash (free to use); loaded remotely, so this screen wants a network. */
  image: string;
}

const img = (id: string) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

/**
 * Simulated on-device proposal. In the real app this is the local vLLM output;
 * here it is a fixed draft so the approve/reject/delete gesture is demoable
 * without a model call. Note the deliberately over-reaching `inference` items —
 * the point of the demo is that the person deletes them.
 */
export const PROPOSED: ProposedEvidence[] = [
  {
    id: 'e1',
    source: 'listening',
    claim: 'Live music person',
    basis: '148 saved live tracks',
    interest: 'live music',
    image: img('photo-1415201364774-f6f0bb35f28f'),
  },
  {
    id: 'e2',
    source: 'photo',
    claim: 'Weekends on the trail',
    basis: 'Most photos shot at trailheads',
    interest: 'hiking',
    image: img('photo-1501554728187-ce583db33af7'),
  },
  {
    id: 'e3',
    source: 'listening',
    claim: 'A film person',
    basis: '3 soundtrack playlists, 40+ hours',
    interest: 'film',
    image: img('photo-1489599849927-2ee91cede3ba'),
  },
  {
    id: 'e4',
    source: 'inference',
    claim: 'Early riser. Morning workouts.',
    basis: 'We guessed. No proof of this.',
    interest: 'running',
    image: img('photo-1502224562085-639556652f33'),
  },
  {
    id: 'e5',
    source: 'inference',
    claim: 'Earns well above average',
    basis: 'We guessed. From photo locations.',
    image: img('photo-1477959858617-67f85cf4f1df'),
  },
];
