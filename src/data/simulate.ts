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

// ---- simulated conversation ------------------------------------------------

const ICEBREAKERS = [
  'We both kept {win} open. That felt like a sign worth spending my opening on.',
  'Hi! I saw {int} on your card and picked before I could overthink it.',
  'One opening a week and I spent it here. No pressure, but also — some pressure.',
  'So the market says we both made room. What are we doing with it?',
  'I picked you on the broadening edge, which is the algorithm’s way of saying "be brave."',
  'Okay, sealed pick, mutual clearing — the ceremony is done. Now we just… talk?',
];

const EARLY_REPLIES = [
  'Ha! I was hoping you’d say something first. How’s your week looking?',
  'Honestly relieved it was mutual. The quiet weeks make you wonder.',
  'That made me smile. So — {int}: how did that start for you?',
  'Good opening. I’m giving it an 8. What’s your {win} usually like?',
  'I read your card three times before sealing. Zero regrets so far.',
];

const MID_REPLIES = [
  'Same. Also I appreciate that neither of us is juggling ten of these.',
  'You’re easy to talk to. The two-connection cap suddenly makes sense.',
  'I keep thinking about what you said. Also: strong chip taste.',
  'Careful, I’m starting to look forward to these messages.',
  'This is the least exhausting this has ever felt, for the record.',
];

const PLAN_REPLIES = [
  'Let’s actually do it — {win}? There’s a place I’ve been meaning to try.',
  'Proposal: {win}, in person, phones away. The checkpoint can find us there.',
  'Yes. {win}. If it goes well we tell the checkpoint KEEP together.',
  'I’m free {win}. Let’s give the market something to write home about.',
];

function fill(line: string, p: Persona, sharedWin: string, sharedInt: string): string {
  return line.replace('{win}', sharedWin).replace('{int}', sharedInt);
}

/** Partner's opening message, sent at the clearing. Deterministic. */
export function icebreaker(
  p: Persona, sharedWin: string, sharedInt: string, connId: string, seed: string
): string {
  const rng = new RNG(`ice::${seed}::${connId}`);
  return fill(rng.pick(ICEBREAKERS), p, sharedWin, sharedInt);
}

/** Partner's reply #`count` in a thread. Deterministic given seed+conn+count. */
export function simReply(
  p: Persona, sharedWin: string, sharedInt: string, connId: string, count: number, seed: string
): string {
  const rng = new RNG(`chat::${seed}::${connId}::${count}`);
  const pool = count <= 1 ? EARLY_REPLIES : count <= 3 ? MID_REPLIES : PLAN_REPLIES;
  return fill(rng.pick(pool), p, sharedWin, sharedInt);
}
