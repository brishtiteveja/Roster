// Core engine vocabulary. Deliberately abstract (§3 handoff: "zero dating nouns"):
// the engine speaks of participants, windows, interests, boards, picks, clearing.

/** A time window a participant declared open (index into a shared weekly grid). */
export type WindowId = number;

/** An interest tag id. */
export type InterestId = string;

export type Declaration = 'in' | 'paused';

export interface Participant {
  id: string;
  /** Availability windows declared for the week. */
  windows: WindowId[];
  /** Interest tags — used only for affinity a(u,v) (§2.1). */
  interests: InterestId[];
  /**
   * Symmetric hard-eligibility key set. Two participants are eligible iff each
   * appears in the other's `seeks` and each satisfies the other's `is`.
   * Kept abstract so the engine never encodes orientation semantics directly.
   */
  is: string[];
  seeks: string[];
}

/** One undirected edge of the weekly board graph G (§2.2). */
export interface BoardEdge {
  a: string;
  b: string;
  /** affinity a(u,v) recorded for audit/verification (§2.4). */
  affinity: number;
  /** true if added as the one broadening (below-median) edge (§2.2.2d). */
  broadening: boolean;
}

/** A participant's view of the week: who is on their board. */
export interface BoardView {
  participant: string;
  candidates: string[];
}

export interface WeekBoard {
  week: number;
  seedCommit: string;
  edges: BoardEdge[];
  /** adjacency for convenience: id -> candidate ids on that board. */
  boards: Record<string, string[]>;
  /** participants who met the floor m. */
  metFloor: string[];
}

/** A sealed pick: `by` selected `target`. Never revealed unless mutual & cleared. */
export interface Pick {
  by: string;
  target: string;
}

/** Result of the weekly quota-respecting clearing (§3). */
export interface ClearingResult {
  week: number;
  seed: string;
  /** matched edges (undirected) that became introductions. */
  introductions: Array<{ a: string; b: string }>;
  /** mutual picks that did not clear (no notice is ever sent for these). */
  unclearedMutual: Array<{ a: string; b: string }>;
}

export type ConnectionState =
  | 'INTRODUCED'
  | 'ACTIVE'
  | 'CHECKPOINT_OPEN'
  | 'CLOSED'
  | 'SAFETY_CLOSED'
  | 'GRADUATED';

export type CheckpointVote = 'KEEP' | 'MORE_TIME' | 'CLOSE';

export interface Connection {
  id: string;
  a: string;
  b: string;
  state: ConnectionState;
  weekIntroduced: number;
  /** consecutive MORE_TIME resolutions (capped at 2, §4). */
  moreTimeStreak: number;
  /** consecutive missed checkpoints per party (anti-ghost floor, §4). */
  missStreak: Record<string, number>;
  /** whether there was conversation activity in the current interval. */
  activeConversation: boolean;
  /** open checkpoint votes, keyed by participant id. */
  votes: Partial<Record<string, CheckpointVote>>;
  /** whether a date was mutually acknowledged (accelerates the checkpoint). */
  dateAcknowledged: boolean;
}
