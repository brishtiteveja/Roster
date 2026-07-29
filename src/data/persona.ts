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
}

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
    claim: 'Into live music — a lot of small-venue jazz and indie',
    basis: '148 saved tracks across 9 live-session albums',
    interest: 'live music',
  },
  {
    id: 'e2',
    source: 'photo',
    claim: 'Spends weekends outdoors — trails and coast',
    basis: 'EXIF locations cluster on hiking trailheads',
    interest: 'hiking',
  },
  {
    id: 'e3',
    source: 'listening',
    claim: 'Long film-score playlists — likely a film person',
    basis: '3 soundtrack playlists, 40+ hours',
    interest: 'film',
  },
  {
    id: 'e4',
    source: 'inference',
    claim: 'Probably an early riser and a morning-workout type',
    basis: 'Model inference — no direct evidence in your media',
    interest: 'running',
  },
  {
    id: 'e5',
    source: 'inference',
    claim: 'Likely earns above the city median',
    basis: 'Model inference from neighbourhood in photo metadata',
  },
];
