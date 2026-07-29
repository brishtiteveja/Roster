import {
  Participant, Pick, Connection, WeekBoard, ClearingResult,
  PARAMS, generateBoard, feasibility, edgeKey, clear,
  makeConnection, activate, openCheckpoint, resolveCheckpoint, earlyClose,
  safetyClose, graduate, isOpen, castVote, CheckpointVote,
} from '../engine';
import { RNG } from '../engine/rng';
import { Persona, buildCohort, makePlayer } from '../data/cohort';
import { declaresIn, simulatedPicks, simCheckpointVote } from '../data/simulate';

export type Phase = 'ONBOARDING' | 'DECLARE' | 'PICK' | 'RESULTS' | 'SEASON_END';

export interface WeekMetric {
  week: number;
  declarers: number;
  introductions: number;
  playerCleared: boolean;
  zeroConnection: number; // participants with no active connection
}

export interface GameState {
  seed: string;
  week: number;
  phase: Phase;
  player: Persona;
  cohort: Persona[]; // simulated participants only
  byId: Map<string, Persona>;

  declaration: 'in' | 'paused';
  board: WeekBoard | null; // this week's full board graph
  playerCandidates: string[]; // player's board this week
  playerPicks: string[]; // sealed selections (target ids)
  submitted: boolean;
  lastClearing: ClearingResult | null;
  playerIntrosThisWeek: string[]; // partner ids newly introduced to player

  connections: Connection[]; // ALL connections (player + simulated)
  activeCount: Record<string, number>;
  weeksUncleared: Record<string, number>;
  weeksWithoutIntro: Record<string, number>;
  coAppear: Record<string, number>; // consecutive co-appearances per pair

  approvedEvidence: string[];
  log: string[];
  metrics: WeekMetric[];
}

const openStates = (c: Connection) => isOpen(c.state);

function recomputeActive(state: GameState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of state.connections) {
    if (openStates(c)) {
      counts[c.a] = (counts[c.a] ?? 0) + 1;
      counts[c.b] = (counts[c.b] ?? 0) + 1;
    }
  }
  return counts;
}

export function initSeason(seed: string): GameState {
  const player = makePlayer();
  const cohort = buildCohort(seed);
  const byId = new Map<string, Persona>([[player.id, player], ...cohort.map((p) => [p.id, p] as const)]);
  const ids = [player.id, ...cohort.map((c) => c.id)];
  const zero = Object.fromEntries(ids.map((id) => [id, 0]));
  return {
    seed,
    week: 1,
    phase: 'ONBOARDING',
    player,
    cohort,
    byId,
    declaration: 'in',
    board: null,
    playerCandidates: [],
    playerPicks: [],
    submitted: false,
    lastClearing: null,
    playerIntrosThisWeek: [],
    connections: [],
    activeCount: { ...zero },
    weeksUncleared: { ...zero },
    weeksWithoutIntro: { ...zero },
    coAppear: {},
    approvedEvidence: [],
    log: ['Season 0 · six weeks · one city. Everyone here declared an opening.'],
    metrics: [],
  };
}

/** Who is eligible to appear on boards this week: declared In and below K_ACTIVE. */
function declarersFor(state: GameState): Persona[] {
  const active = state.activeCount;
  const out: Persona[] = [];
  // simulated participants
  for (const p of state.cohort) {
    const atCap = (active[p.id] ?? 0) >= PARAMS.K_ACTIVE;
    if (declaresIn(p, atCap, state.weeksWithoutIntro[p.id] ?? 0, state.week, state.seed)) {
      out.push(p);
    }
  }
  // player
  const playerAtCap = (active[state.player.id] ?? 0) >= PARAMS.K_ACTIVE;
  if (state.declaration === 'in' && !playerAtCap) out.push(state.player);
  return out;
}

function cooldownPairs(state: GameState): Set<string> {
  const s = new Set<string>();
  for (const [k, n] of Object.entries(state.coAppear)) {
    if (n >= 2) s.add(k);
  }
  return s;
}

/** Build this week's board once the player's declaration is set. */
export function buildBoard(state: GameState): GameState {
  const declarers = declarersFor(state);
  const seedW = `${state.seed}::w${state.week}`;
  const feas = feasibility(declarers);
  const board = generateBoard(declarers, state.week, seedW, {
    cooldownPairs: cooldownPairs(state),
  });

  // Update consecutive-co-appearance counters (for next week's cooldown).
  const coAppear: Record<string, number> = {};
  const appeared = new Set(board.edges.map((e) => edgeKey(e.a, e.b)));
  for (const k of appeared) coAppear[k] = (state.coAppear[k] ?? 0) + 1;
  // pairs excluded this week reset to 0 (handled by absence from `appeared`).

  const playerCandidates = board.boards[state.player.id] ?? [];
  const log = [...state.log];
  if (!feas.feasible) {
    log.push(
      `Week ${state.week}: ${feas.infeasible.length} participant(s) could not receive a viable board — rolled over, never filled with filler.`
    );
  }
  const phase: Phase = state.declaration === 'in' && playerCandidates.length > 0 ? 'PICK' : 'RESULTS';

  return {
    ...state,
    board,
    playerCandidates,
    playerPicks: [],
    submitted: false,
    coAppear,
    phase,
    log,
  };
}

/** Toggle a sealed pick (≤3). */
export function togglePick(state: GameState, targetId: string): GameState {
  if (state.submitted) return state;
  const has = state.playerPicks.includes(targetId);
  let picks = has ? state.playerPicks.filter((x) => x !== targetId) : [...state.playerPicks, targetId];
  if (picks.length > PARAMS.PICKS_MAX) picks = picks.slice(0, PARAMS.PICKS_MAX);
  return { ...state, playerPicks: picks };
}

/** Submit sealed picks → run the weekly quota-respecting clearing. */
export function runClearing(state: GameState): GameState {
  const board = state.board!;
  const declarerIds = new Set(Object.keys(board.boards));
  const picks: Pick[] = [];

  // player picks
  for (const t of state.playerPicks) picks.push({ by: state.player.id, target: t });

  // simulated picks over each sim's board
  for (const p of state.cohort) {
    if (!declarerIds.has(p.id)) continue;
    const cands = board.boards[p.id] ?? [];
    picks.push(...simulatedPicks(p, cands, state.byId, state.week, state.seed));
  }

  const capacity: Record<string, number> = {};
  for (const id of declarerIds) {
    capacity[id] = (state.activeCount[id] ?? 0) >= PARAMS.K_ACTIVE ? 0 : PARAMS.OPENINGS_PER_WEEK;
  }

  const clearing = clear(picks, {
    week: state.week,
    seed: `${state.seed}::w${state.week}`,
    capacity,
    activeCount: state.activeCount,
    weeksUncleared: state.weeksUncleared,
  });

  // Create connections for every introduction across the cohort.
  const connections = [...state.connections];
  const clearedIds = new Set<string>();
  const playerIntros: string[] = [];
  let counter = state.connections.length;
  for (const m of clearing.introductions) {
    clearedIds.add(m.a);
    clearedIds.add(m.b);
    const conn = activate(makeConnection(`c${counter++}_w${state.week}`, m.a, m.b, state.week));
    connections.push(conn);
    if (m.a === state.player.id) playerIntros.push(m.b);
    if (m.b === state.player.id) playerIntros.push(m.a);
  }

  // Fairness + engagement counters.
  const weeksUncleared = { ...state.weeksUncleared };
  const weeksWithoutIntro = { ...state.weeksWithoutIntro };
  for (const id of declarerIds) {
    const belowCap = capacity[id] > 0;
    if (clearedIds.has(id)) {
      weeksUncleared[id] = 0;
      weeksWithoutIntro[id] = 0;
    } else if (belowCap) {
      weeksUncleared[id] = (weeksUncleared[id] ?? 0) + 1;
      weeksWithoutIntro[id] = (weeksWithoutIntro[id] ?? 0) + 1;
    }
  }

  const next: GameState = {
    ...state,
    submitted: true,
    lastClearing: clearing,
    playerIntrosThisWeek: playerIntros,
    connections,
    weeksUncleared,
    weeksWithoutIntro,
    phase: 'RESULTS',
  };
  next.activeCount = recomputeActive(next);

  const zeroConn = countZeroConnection(next);
  next.metrics = [
    ...state.metrics,
    {
      week: state.week,
      declarers: declarerIds.size,
      introductions: clearing.introductions.length,
      playerCleared: playerIntros.length > 0,
      zeroConnection: zeroConn,
    },
  ];
  next.log = [
    ...state.log,
    playerIntros.length > 0
      ? `Week ${state.week} cleared: you were introduced to ${playerIntros
          .map((id) => state.byId.get(id)?.name)
          .join(' & ')}.`
      : `Week ${state.week} cleared: no new introduction for you. A quiet week is never a verdict.`,
  ];
  return next;
}

function countZeroConnection(state: GameState): number {
  const active = recomputeActive(state);
  const ids = [state.player.id, ...state.cohort.map((c) => c.id)];
  return ids.filter((id) => (active[id] ?? 0) === 0).length;
}

// ---- connection management (player-facing) --------------------------------

export function vote(state: GameState, connId: string, party: string, v: CheckpointVote): GameState {
  return {
    ...state,
    connections: state.connections.map((c) => (c.id === connId ? castVote(c, party, v) : c)),
  };
}

export function markMet(state: GameState, connId: string): GameState {
  return {
    ...state,
    connections: state.connections.map((c) =>
      c.id === connId ? { ...c, dateAcknowledged: true, activeConversation: true } : c
    ),
  };
}

export function closeNow(state: GameState, connId: string): GameState {
  const connections = state.connections.map((c) => (c.id === connId ? earlyClose(c).conn : c));
  const next = { ...state, connections };
  next.activeCount = recomputeActive(next);
  const other = otherParty(state, connId);
  next.log = [...state.log, `You closed your connection with ${name(state, other)} — same kind notice, both of you.`];
  return next;
}

export function reportSafety(state: GameState, connId: string): GameState {
  const connections = state.connections.map((c) => (c.id === connId ? safetyClose(c) : c));
  const next = { ...state, connections };
  next.activeCount = recomputeActive(next);
  next.log = [...state.log, `Connection with ${name(state, otherParty(state, connId))} was closed for safety — immediately, no checkpoint.`];
  return next;
}

export function graduateNow(state: GameState, connId: string): GameState {
  let connections = state.connections.slice();
  const idx = connections.findIndex((c) => c.id === connId);
  if (idx < 0) return state;
  const { conn, graduates } = graduate(connections[idx]);
  connections[idx] = conn;
  // Their OTHER active connections close through the normal neutral process.
  connections = connections.map((c) => {
    if (c.id === conn.id) return c;
    if ((graduates.includes(c.a) || graduates.includes(c.b)) && openStates(c)) {
      return earlyClose(c).conn;
    }
    return c;
  });
  const next = { ...state, connections };
  next.activeCount = recomputeActive(next);
  next.log = [...state.log, `You and ${name(state, otherParty(state, connId))} graduated — you both leave the market. 🎉`];
  return next;
}

function otherParty(state: GameState, connId: string): string {
  const c = state.connections.find((x) => x.id === connId);
  if (!c) return '';
  return c.a === state.player.id ? c.b : c.a;
}
function name(state: GameState, id: string): string {
  return state.byId.get(id)?.name ?? id;
}

// ---- week boundary ---------------------------------------------------------

/** Seeded resolution of off-stage (sim–sim) connections so the market breathes. */
function resolveSimConnections(state: GameState, connections: Connection[]): Connection[] {
  const rng = new RNG(`simresolve::${state.seed}::${state.week}`);
  return connections.map((c) => {
    if (c.a === state.player.id || c.b === state.player.id) return c;
    if (!openStates(c)) return c;
    const age = state.week - c.weekIntroduced;
    if (age < 1) return c;
    // ~35% of off-stage connections close each week after their first checkpoint;
    // a few graduate. Keeps capacity turning over realistically.
    const r = rng.next();
    if (r < 0.06) return { ...c, state: 'GRADUATED' };
    if (r < 0.4) return earlyClose(c).conn;
    return c;
  });
}

/**
 * Advance to the next week: resolve open player checkpoints, resolve off-stage
 * connections, then open due checkpoints for surviving player connections.
 */
export function advanceWeek(state: GameState): GameState {
  let connections = state.connections.slice();
  const log = [...state.log];

  // 1. Resolve any open player checkpoints (votes or non-response rules). The
  //    simulated partner casts its private vote here if it hasn't already.
  connections = connections.map((c) => {
    if (c.state !== 'CHECKPOINT_OPEN') return c;
    const other = c.a === state.player.id ? c.b : c.a;
    const involvesPlayer = c.a === state.player.id || c.b === state.player.id;
    if (involvesPlayer && c.votes[other] === undefined) {
      const sim = state.byId.get(other);
      if (sim) {
        const v = simCheckpointVote(sim, state.player, c.dateAcknowledged, state.week, c.id, state.seed);
        c = castVote(c, other, v);
      }
    }
    const res = resolveCheckpoint(c);
    if (res.outcome === 'CLOSED') {
      log.push(`Checkpoint with ${name(state, c.a === state.player.id ? c.b : c.a)} resolved: closed.`);
    }
    return res.conn;
  });

  // 2. Off-stage connections turn over.
  connections = resolveSimConnections(state, connections);

  const advancingToEnd = state.week >= PARAMS.SEASON_WEEKS;
  const nextWeek = state.week + 1;

  // 3. Open due checkpoints for surviving player connections (≥1 week old).
  connections = connections.map((c) => {
    const involvesPlayer = c.a === state.player.id || c.b === state.player.id;
    if (!involvesPlayer || c.state !== 'ACTIVE') return c;
    const age = nextWeek - c.weekIntroduced;
    if (age >= 1) return openCheckpoint(c);
    return c;
  });

  const base: GameState = {
    ...state,
    connections,
    week: nextWeek,
    declaration: 'in',
    board: null,
    playerCandidates: [],
    playerPicks: [],
    submitted: false,
    playerIntrosThisWeek: [],
    log,
  };
  base.activeCount = recomputeActive(base);

  if (advancingToEnd) {
    base.phase = 'SEASON_END';
    base.log = [...log, 'Season 0 complete. Forced final checkpoint — KEEP persists into next season.'];
  } else {
    base.phase = 'DECLARE';
  }
  return base;
}

// ---- selectors -------------------------------------------------------------

export function playerConnections(state: GameState): Connection[] {
  return state.connections.filter((c) => c.a === state.player.id || c.b === state.player.id);
}
export function openPlayerConnections(state: GameState): Connection[] {
  return playerConnections(state).filter((c) => openStates(c));
}
export function openCheckpointsForPlayer(state: GameState): Connection[] {
  return playerConnections(state).filter((c) => c.state === 'CHECKPOINT_OPEN');
}
export function partnerName(state: GameState, c: Connection): string {
  const other = c.a === state.player.id ? c.b : c.a;
  return state.byId.get(other)?.name ?? other;
}
export function partnerId(state: GameState, c: Connection): string {
  return c.a === state.player.id ? c.b : c.a;
}
