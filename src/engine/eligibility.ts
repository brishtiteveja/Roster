import { Participant, InterestId, WindowId } from './types';
import { PARAMS } from './params';

/**
 * Symmetric hard eligibility E (§2.1): mutual orientation compatibility
 * ∧ mutual hard preferences. Encoded abstractly via `is`/`seeks` sets so the
 * engine never hard-codes dating semantics. E is symmetric by construction.
 */
export function eligible(u: Participant, v: Participant): boolean {
  if (u.id === v.id) return false;
  const uSeeksV = u.seeks.some((s) => v.is.includes(s));
  const vSeeksU = v.seeks.some((s) => u.is.includes(s));
  return uSeeksV && vSeeksU;
}

function intersectionSize<T>(a: readonly T[], b: readonly T[]): number {
  const set = new Set(a);
  let n = 0;
  for (const x of b) if (set.has(x)) n++;
  return n;
}

/**
 * Affinity a(u,v) = |windows_u ∩ windows_v| + α·|interests_u ∩ interests_v|
 * (§2.1). Published constants only; nothing downstream of behaviour enters.
 */
export function affinity(u: Participant, v: Participant): number {
  const win = intersectionSize<WindowId>(u.windows, v.windows);
  const shared = intersectionSize<InterestId>(u.interests, v.interests);
  return win + PARAMS.AFFINITY_ALPHA * shared;
}

/** The full symmetric eligibility graph over a set of declarers. */
export function eligibilityGraph(
  declarers: Participant[]
): Map<string, Set<string>> {
  const g = new Map<string, Set<string>>();
  for (const u of declarers) g.set(u.id, new Set());
  for (let i = 0; i < declarers.length; i++) {
    for (let j = i + 1; j < declarers.length; j++) {
      if (eligible(declarers[i], declarers[j])) {
        g.get(declarers[i].id)!.add(declarers[j].id);
        g.get(declarers[j].id)!.add(declarers[i].id);
      }
    }
  }
  return g;
}
