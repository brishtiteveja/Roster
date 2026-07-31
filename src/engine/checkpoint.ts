import { Connection, CheckpointVote, ConnectionState } from './types';
import { PARAMS } from './params';

export function makeConnection(
  id: string,
  a: string,
  b: string,
  week: number
): Connection {
  return {
    id,
    a,
    b,
    state: 'INTRODUCED',
    weekIntroduced: week,
    moreTimeStreak: 0,
    missStreak: { [a]: 0, [b]: 0 },
    activeConversation: false,
    votes: {},
    dateAcknowledged: false,
  };
}

/** INTRODUCED → ACTIVE once both parties engage. */
export function activate(conn: Connection): Connection {
  if (conn.state !== 'INTRODUCED') return conn;
  return { ...conn, state: 'ACTIVE' };
}

/** The third consecutive checkpoint offers KEEP / CLOSE only (§4). */
export function offersMoreTime(conn: Connection): boolean {
  return conn.moreTimeStreak < PARAMS.MORE_TIME_MAX_CONSECUTIVE;
}

/** Days until the next checkpoint given whether a date was acknowledged (§1). */
export function nextInterval(conn: Connection): number {
  return conn.dateAcknowledged
    ? Math.min(PARAMS.CHECK_INTERVAL_AFTER_DATE_DAYS, PARAMS.CHECK_INTERVAL_DAYS)
    : PARAMS.CHECK_INTERVAL_DAYS;
}

/** ACTIVE → CHECKPOINT_OPEN. Clears prior votes. */
export function openCheckpoint(conn: Connection): Connection {
  if (conn.state !== 'ACTIVE') return conn;
  return { ...conn, state: 'CHECKPOINT_OPEN', votes: {} };
}

export function castVote(
  conn: Connection,
  party: string,
  vote: CheckpointVote
): Connection {
  if (conn.state !== 'CHECKPOINT_OPEN') return conn;
  if (vote === 'MORE_TIME' && !offersMoreTime(conn)) return conn; // not on offer
  return { ...conn, votes: { ...conn.votes, [party]: vote } };
}

export interface Resolution {
  conn: Connection;
  outcome: 'CLOSED' | 'CONTINUED';
  /** the identical, reasonless notice both parties receive on close (§4). */
  notice?: string;
  nextIntervalDays?: number;
}

const NEUTRAL_CLOSE_NOTICE =
  'This connection has closed. You both reserved room; that room is open again.';

/**
 * Resolve an open checkpoint at the results hour (§4). Votes are never
 * revealed; the closer is never named. Non-response rules:
 *  - first miss is graced;
 *  - a second consecutive miss with NO conversation activity closes (anti-ghost);
 *  - a second miss WITH active conversation resolves to KEEP (paperwork never
 *    closes a living connection).
 */
export function resolveCheckpoint(conn: Connection): Resolution {
  if (conn.state !== 'CHECKPOINT_OPEN') return { conn, outcome: 'CONTINUED' };

  const parties = [conn.a, conn.b];
  const missStreak = { ...conn.missStreak };
  let effectiveClose = false;
  let explicitMoreTime = false;

  for (const p of parties) {
    const v = conn.votes[p];
    if (v === undefined) {
      const streak = (missStreak[p] ?? 0) + 1;
      missStreak[p] = streak;
      // Second consecutive miss: closes only in the absence of a live conversation.
      if (streak >= 2 && !conn.activeConversation) effectiveClose = true;
    } else {
      missStreak[p] = 0;
      if (v === 'CLOSE') effectiveClose = true;
      if (v === 'MORE_TIME') explicitMoreTime = true;
    }
  }

  if (effectiveClose) {
    return {
      conn: { ...conn, state: 'CLOSED', missStreak, votes: {} },
      outcome: 'CLOSED',
      notice: NEUTRAL_CLOSE_NOTICE,
    };
  }

  if (explicitMoreTime) {
    return {
      conn: {
        ...conn,
        state: 'ACTIVE',
        missStreak,
        votes: {},
        moreTimeStreak: conn.moreTimeStreak + 1,
        activeConversation: false,
      },
      outcome: 'CONTINUED',
      nextIntervalDays: PARAMS.MORE_TIME_INTERVAL_DAYS,
    };
  }

  // else: both KEEP, KEEP + first miss, or both first-miss → continue.
  const cont: Connection = {
    ...conn,
    state: 'ACTIVE',
    missStreak,
    votes: {},
    moreTimeStreak: 0,
    activeConversation: false,
  };
  return { conn: cont, outcome: 'CONTINUED', nextIntervalDays: nextInterval(cont) };
}

/** Early close, any time — resolves to the same neutral notice (§4). */
export function earlyClose(conn: Connection): Resolution {
  if (conn.state === 'CLOSED' || conn.state === 'GRADUATED') {
    return { conn, outcome: 'CONTINUED' };
  }
  return {
    conn: { ...conn, state: 'CLOSED', votes: {} },
    outcome: 'CLOSED',
    notice: NEUTRAL_CLOSE_NOTICE,
  };
}

/** Safety close (§4): immediate, bypasses the ceremonial clock; own copy. */
export function safetyClose(conn: Connection): Connection {
  return { ...conn, state: 'SAFETY_CLOSED', votes: {} };
}

/**
 * Graduation (atomic, §4): both confirm; the graduating pair exits the market.
 * Returns the graduated connection plus the ids whose OTHER active connections
 * must now be scheduled to close through the normal neutral process.
 */
export function graduate(conn: Connection): { conn: Connection; graduates: string[] } {
  return {
    conn: { ...conn, state: 'GRADUATED', votes: {} },
    graduates: [conn.a, conn.b],
  };
}

export function isOpen(state: ConnectionState): boolean {
  return state === 'INTRODUCED' || state === 'ACTIVE' || state === 'CHECKPOINT_OPEN';
}
