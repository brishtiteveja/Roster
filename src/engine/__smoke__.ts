// Standalone runtime sanity check for the engine. Run with: npx tsx src/engine/__smoke__.ts
import { Participant } from './types';
import { generateBoard, feasibility, edgeKey } from './board';
import { clear } from './clearing';
import {
  makeConnection, activate, openCheckpoint, castVote, resolveCheckpoint,
} from './checkpoint';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('  ok:', msg);
}

// Build a toy cohort: two "sides" A-side and B-side, mutually eligible.
const cohort: Participant[] = [];
for (let i = 0; i < 20; i++) {
  const side = i % 2 === 0 ? 'x' : 'y';
  const other = side === 'x' ? 'y' : 'x';
  cohort.push({
    id: `p${i}`,
    windows: [i % 5, (i + 2) % 5, (i + 3) % 5],
    interests: [`int${i % 4}`, `int${(i + 1) % 6}`],
    is: [side],
    seeks: [other],
  });
}

console.log('feasibility:');
const feas = feasibility(cohort);
assert(feas.feasible, 'every participant can receive a viable board');

console.log('board generation:');
const board = generateBoard(cohort, 1, 'seed-week-1');
// symmetry
for (const e of board.edges) {
  assert(board.boards[e.a].includes(e.b) && board.boards[e.b].includes(e.a), `edge ${e.a}-${e.b} symmetric`);
  break;
}
const degs = cohort.map((p) => board.boards[p.id].length);
console.log('  degrees:', degs.join(','));
assert(Math.max(...degs) <= 7, 'max degree ≤ d+1');
// determinism
const board2 = generateBoard(cohort, 1, 'seed-week-1');
assert(
  board.edges.map((e) => edgeKey(e.a, e.b)).sort().join() ===
    board2.edges.map((e) => edgeKey(e.a, e.b)).sort().join(),
  'board is deterministic given seed'
);

console.log('clearing:');
// Everyone picks their first two board candidates → many mutual picks.
const picks = [] as { by: string; target: string }[];
for (const p of cohort) {
  for (const c of board.boards[p.id].slice(0, 3)) picks.push({ by: p.id, target: c });
}
const capacity: Record<string, number> = {};
const activeCount: Record<string, number> = {};
const weeksUncleared: Record<string, number> = {};
for (const p of cohort) { capacity[p.id] = 1; activeCount[p.id] = 0; weeksUncleared[p.id] = 0; }
const result = clear(picks, { week: 1, seed: 'seed-week-1', capacity, activeCount, weeksUncleared });
console.log('  introductions:', result.introductions.length);
// no participant exceeds capacity 1
const used: Record<string, number> = {};
for (const m of result.introductions) { used[m.a] = (used[m.a] ?? 0) + 1; used[m.b] = (used[m.b] ?? 0) + 1; }
assert(Object.values(used).every((n) => n <= 1), 'capacity respected (≤1 intro/person)');
assert(result.introductions.length > 0, 'at least one introduction cleared');

console.log('checkpoint state machine:');
let conn = makeConnection('c1', 'p0', 'p1', 1);
conn = activate(conn);
assert(conn.state === 'ACTIVE', 'INTRODUCED → ACTIVE');
conn = openCheckpoint(conn);
conn = castVote(conn, 'p0', 'KEEP');
conn = castVote(conn, 'p1', 'KEEP');
let res = resolveCheckpoint(conn);
assert(res.outcome === 'CONTINUED' && res.conn.state === 'ACTIVE', 'both KEEP → continue');
// anti-ghost: two consecutive misses, no conversation → close
conn = openCheckpoint(res.conn);
res = resolveCheckpoint(conn); // p0,p1 both miss (streak 1, graced)
assert(res.outcome === 'CONTINUED', 'first miss graced');
conn = openCheckpoint(res.conn);
res = resolveCheckpoint(conn); // second consecutive miss, no conversation
assert(res.outcome === 'CLOSED', 'second consecutive silent miss closes (anti-ghost)');
// active conversation overrides
let conn2 = activate(makeConnection('c2', 'p2', 'p3', 1));
conn2 = openCheckpoint(conn2);
let r2 = resolveCheckpoint(conn2);
conn2 = openCheckpoint(r2.conn);
conn2 = { ...conn2, activeConversation: true };
r2 = resolveCheckpoint(conn2);
assert(r2.outcome === 'CONTINUED', 'active conversation outranks missed form (KEEP)');

console.log('\nALL ENGINE SMOKE CHECKS PASSED');
