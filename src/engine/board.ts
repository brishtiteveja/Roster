import { Participant, WeekBoard, BoardEdge } from './types';
import { PARAMS } from './params';
import { RNG, commit } from './rng';
import { affinity, eligibilityGraph } from './eligibility';

/** Canonical undirected edge key. */
export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export interface BoardOptions {
  targetDegree?: number;
  floor?: number;
  /** pairs excluded this week by the recurrence cooldown (§2.5a). */
  cooldownPairs?: Set<string>;
}

/**
 * Weekly reciprocal (undirected) board construction (§2.2, executed per the
 * §2.6 auditable procedure). Deterministic given `seedW`. Symmetric by
 * construction; every pick is therefore structurally reciprocable.
 *
 * Objectives (lexicographic): meet floor m for as many as possible → maximise
 * total affinity → hold near target degree d → include one broadening edge/node.
 */
export function generateBoard(
  declarers: Participant[],
  week: number,
  seedW: string,
  opts: BoardOptions = {}
): WeekBoard {
  const d = opts.targetDegree ?? PARAMS.BOARD_DEGREE_TARGET;
  const m = opts.floor ?? PARAMS.BOARD_DEGREE_FLOOR;
  const cooldown = opts.cooldownPairs ?? new Set<string>();
  const rng = new RNG(seedW);

  const byId = new Map(declarers.map((p) => [p.id, p]));
  const elig = eligibilityGraph(declarers);

  // Remove cooldown pairs from the eligibility used this week (pick-independent).
  for (const [id, set] of elig) {
    for (const other of [...set]) {
      if (cooldown.has(edgeKey(id, other))) set.delete(other);
    }
  }

  const degree = new Map<string, number>(declarers.map((p) => [p.id, 0]));
  const chosen = new Map<string, BoardEdge>();

  const aff = (a: string, b: string) => affinity(byId.get(a)!, byId.get(b)!);

  function add(a: string, b: string, broadening: boolean) {
    const k = edgeKey(a, b);
    if (chosen.has(k)) return;
    chosen.set(k, { a: a < b ? a : b, b: a < b ? b : a, affinity: aff(a, b), broadening });
    degree.set(a, degree.get(a)! + 1);
    degree.set(b, degree.get(b)! + 1);
  }

  // Step 1 — seeded node order.
  const order = rng.shuffle(declarers.map((p) => p.id));

  // Step 2 — one broadening (below-own-median affinity) edge per node, if the
  // partner has slack (< d). Broadens exposure beyond pure affinity sorting.
  for (const id of order) {
    const partners = [...elig.get(id)!].filter((o) => !chosen.has(edgeKey(id, o)));
    if (partners.length === 0) continue;
    const scores = partners.map((o) => aff(id, o)).sort((x, y) => x - y);
    const median = scores[Math.floor(scores.length / 2)];
    const below = partners.filter((o) => aff(id, o) <= median && degree.get(o)! < d);
    if (degree.get(id)! >= d || below.length === 0) continue;
    const partner = rng.pick(rng.shuffle(below));
    add(id, partner, true);
  }

  // Step 3 — fill: all remaining eligible pairs by affinity desc, seeded ties,
  // add while both endpoints are below target d.
  const remaining: Array<[string, string]> = [];
  for (const [id, set] of elig) {
    for (const o of set) {
      if (id < o && !chosen.has(edgeKey(id, o))) remaining.push([id, o]);
    }
  }
  const jitter = new Map(remaining.map(([a, b]) => [edgeKey(a, b), rng.next()]));
  remaining.sort((p, q) => {
    const da = aff(q[0], q[1]) - aff(p[0], p[1]);
    if (da !== 0) return da;
    return jitter.get(edgeKey(p[0], p[1]))! - jitter.get(edgeKey(q[0], q[1]))!;
  });
  for (const [a, b] of remaining) {
    if (degree.get(a)! < d && degree.get(b)! < d) add(a, b, false);
  }

  // Step 4 — floor: any node still under m adds its highest-affinity remaining
  // eligible edge, even if the partner reaches d+1 (§2.6). Not always reachable.
  for (const id of order) {
    while (degree.get(id)! < m) {
      const partners = [...elig.get(id)!]
        .filter((o) => !chosen.has(edgeKey(id, o)))
        .sort((x, y) => aff(id, y) - aff(id, x));
      if (partners.length === 0) break; // floor not feasible for this node
      add(id, partners[0], false);
    }
  }

  const edges = [...chosen.values()];
  const boards: Record<string, string[]> = {};
  for (const p of declarers) boards[p.id] = [];
  for (const e of edges) {
    boards[e.a].push(e.b);
    boards[e.b].push(e.a);
  }
  const metFloor = declarers
    .filter((p) => (boards[p.id]?.length ?? 0) >= Math.min(m, elig.get(p.id)!.size))
    .map((p) => p.id);

  return { week, seedCommit: commit(seedW), edges, boards, metFloor };
}

/**
 * Admission feasibility check (§2.2 / §5.2): can every participant receive a
 * viable board (floor reachable) on the eligibility graph? Infeasible cohorts
 * get rollover/refund/notice — never filler profiles.
 */
export function feasibility(declarers: Participant[], floor = PARAMS.BOARD_DEGREE_FLOOR) {
  const elig = eligibilityGraph(declarers);
  const infeasible = declarers
    .filter((p) => elig.get(p.id)!.size < Math.min(floor, declarers.length - 1))
    .map((p) => p.id);
  return { feasible: infeasible.length === 0, infeasible };
}
