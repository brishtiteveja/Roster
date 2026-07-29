import { Participant, Pick, CheckpointVote } from '../engine';
import { affinity } from '../engine/eligibility';
import { RNG } from '../engine/rng';
import { Persona } from './cohort';

/**
 * Whether a simulated participant declares "In" this week. Declaration is
 * gated by capacity (only those below K_ACTIVE may appear on boards, §2.1) and
 * otherwise driven by appeal/engagement with seeded noise. Disengaged agents
 * (sustained futility) drift toward Paused.
 */
export function declaresIn(
  p: Persona,
  atCapacity: boolean,
  weeksWithoutIntro: number,
  week: number,
  seed: string
): boolean {
  if (atCapacity) return false;
  const rng = new RNG(`decl::${seed}::${p.id}::${week}`);
  const fatigue = Math.min(0.5, weeksWithoutIntro * 0.12); // futility → withdrawal
  const base = 0.6 + p.appeal * 0.3 - fatigue;
  return rng.next() < base;
}

/**
 * Simulated sealed picks (≤3, unranked). A participant scores each board
 * candidate by affinity plus the candidate's appeal, with seeded idiosyncratic
 * fit, and picks the top few above a personal bar. Deterministic given seed.
 */
export function simulatedPicks(
  p: Persona,
  candidates: string[],
  byId: Map<string, Participant>,
  week: number,
  seed: string,
  maxPicks = 3
): Pick[] {
  const rng = new RNG(`pick::${seed}::${p.id}::${week}`);
  const scored = candidates
    .map((cid) => {
      const c = byId.get(cid) as Persona | undefined;
      const aff = c ? affinity(p, c) : 0;
      const appeal = c?.appeal ?? 0.5;
      const idiosyncratic = rng.next(); // (1−w) fit term
      const w = 0.6;
      return { cid, score: w * (aff / 6 + appeal) + (1 - w) * idiosyncratic };
    })
    .sort((a, b) => b.score - a.score);

  // Selectivity: more appealing agents pick fewer (a yes should cost something).
  const bar = 0.45 + p.appeal * 0.25;
  const take = scored.filter((s) => s.score >= bar).slice(0, maxPicks);
  const chosen = (take.length ? take : scored.slice(0, 1)).map((s) => s.cid);
  return chosen.map((target) => ({ by: p.id, target }));
}

/**
 * A simulated partner's private checkpoint vote. Mostly KEEP (people who cleared
 * a mutual, capacity-limited pick tend to want to continue), tempered by the
 * pair's affinity and whether a date was confirmed, with a small CLOSE tail so
 * connections genuinely end. Deterministic given seed + week.
 */
export function simCheckpointVote(
  sim: Persona,
  partner: Participant,
  dateConfirmed: boolean,
  week: number,
  connId: string,
  seed: string
): CheckpointVote {
  const rng = new RNG(`cpvote::${seed}::${connId}::${week}`);
  const aff = affinity(sim, partner); // 0..~10
  let keep = 0.55 + Math.min(0.3, aff * 0.04) + (dateConfirmed ? 0.15 : 0);
  keep = Math.min(0.9, keep);
  const r = rng.next();
  if (r < keep) return 'KEEP';
  if (r < keep + 0.08) return 'MORE_TIME';
  return 'CLOSE';
}
