import { Pick, ClearingResult } from './types';
import { RNG } from './rng';
import { edgeKey } from './board';

export interface ClearingContext {
  week: number;
  seed: string;
  /** remaining openings this week — 1, or 0 if the participant is at K_ACTIVE. */
  capacity: Record<string, number>;
  /** current count of active connections (drives the zero-connection priority). */
  activeCount: Record<string, number>;
  /** consecutive declared-but-uncleared weeks (fairness counter, §3.2). */
  weeksUncleared: Record<string, number>;
}

const ZERO_CONNECTION_BONUS = 1_000_000; // dominates weeks-served in the ordering

/** Fairness weight w(v): zero-connection participants first, then longest-waiting. */
function weight(id: string, ctx: ClearingContext): number {
  const zero = (ctx.activeCount[id] ?? 0) === 0 ? ZERO_CONNECTION_BONUS : 0;
  return zero + (ctx.weeksUncleared[id] ?? 0);
}

/**
 * Quota-respecting reciprocal clearing (§3). With one opening/week all
 * capacities are 1, so this is ordinary maximum matching on the mutual-pick
 * graph P — but resolved under the lexicographic hierarchy:
 *   (1) maximise |M|  (2) then matched-with-zero-connection  (3) then weeks served
 *   (4) then seed order.
 *
 * Executed exactly as the §3.3 auditable procedure: weighted greedy, then a
 * 1-for-2 augment pass that lets cardinality override fairness (ε is tie-break
 * only), iterated to a fixpoint.
 */
export function clear(picks: Pick[], ctx: ClearingContext): ClearingResult {
  const rng = new RNG('clear::' + ctx.seed);

  // Build the mutual-pick graph P: edges where both endpoints picked each other.
  const directed = new Set(picks.map((p) => `${p.by}>${p.target}`));
  const mutual: Array<{ a: string; b: string; key: string }> = [];
  const seen = new Set<string>();
  for (const p of picks) {
    if (directed.has(`${p.target}>${p.by}`)) {
      const k = edgeKey(p.by, p.target);
      if (!seen.has(k)) {
        seen.add(k);
        const [a, b] = k.split('|');
        mutual.push({ a, b, key: k });
      }
    }
  }

  const cap = { ...ctx.capacity };
  // seeded jitter for deterministic tie-breaking (step 2).
  const jitter = new Map(mutual.map((e) => [e.key, rng.next()]));

  const sorted = mutual.slice().sort((p, q) => {
    const wp = weight(p.a, ctx) + weight(p.b, ctx);
    const wq = weight(q.a, ctx) + weight(q.b, ctx);
    if (wp !== wq) return wq - wp;
    return jitter.get(p.key)! - jitter.get(q.key)!;
  });

  // With unit capacities each participant matches at most one partner.
  const partnerOf = new Map<string, string>();
  const matched = new Set<string>(); // edge keys in M
  const isFree = (id: string) => !partnerOf.has(id) && (cap[id] ?? 0) > 0;

  function addEdge(a: string, b: string) {
    matched.add(edgeKey(a, b));
    partnerOf.set(a, b);
    partnerOf.set(b, a);
  }
  function removeEdge(a: string, b: string) {
    matched.delete(edgeKey(a, b));
    partnerOf.delete(a);
    partnerOf.delete(b);
  }

  // Step 3 — greedy add respecting capacity (fairness order).
  for (const e of sorted) {
    if (isFree(e.a) && isFree(e.b)) addEdge(e.a, e.b);
  }

  // Adjacency over the mutual-pick graph, fairness-ordered neighbours.
  const adj = new Map<string, string[]>();
  for (const e of mutual) {
    (adj.get(e.a) ?? adj.set(e.a, []).get(e.a)!).push(e.b);
    (adj.get(e.b) ?? adj.set(e.b, []).get(e.b)!).push(e.a);
  }
  for (const [, ns] of adj) ns.sort((x, y) => weight(y, ctx) - weight(x, ctx));

  // Step 4 — augment along length-3 alternating paths (§3.3 step 4): for a
  // matched edge (v1,v2), if v1 has a free neighbour f1 and v2 a different free
  // neighbour f2, swapping in (v1,f1)+(v2,f2) for (v1,v2) raises cardinality by
  // one. Cardinality overrides fairness; capacity can never be exceeded because
  // f1,f2 are free by construction. Sparse unit-capacity graph → few passes.
  let improved = true;
  while (improved) {
    improved = false;
    for (const key of [...matched]) {
      if (!matched.has(key)) continue;
      const [v1, v2] = key.split('|');
      const f1s = (adj.get(v1) ?? []).filter((n) => n !== v2 && isFree(n));
      const f2s = (adj.get(v2) ?? []).filter((n) => n !== v1 && isFree(n));
      let done = false;
      for (const f1 of f1s) {
        for (const f2 of f2s) {
          if (f1 === f2) continue;
          removeEdge(v1, v2);
          addEdge(v1, f1);
          addEdge(v2, f2);
          improved = true;
          done = true;
          break;
        }
      }
      if (done) break;
    }
  }

  const introductions = [...matched].map((k) => {
    const [a, b] = k.split('|');
    return { a, b };
  });
  const unclearedMutual = mutual
    .filter((e) => !matched.has(e.key))
    .map((e) => ({ a: e.a, b: e.b }));

  return { week: ctx.week, seed: ctx.seed, introductions, unclearedMutual };
}
