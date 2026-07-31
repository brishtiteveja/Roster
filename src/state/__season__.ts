// Headless full-season playthrough — exercises the whole orchestration loop.
// Run: npx tsx src/state/__season__.ts
import {
  initSeason, buildBoard, togglePick, runClearing, advanceWeek,
  openCheckpointsForPlayer, playerConnections,
} from './orchestration';
import { GameState } from './orchestration';

let s: GameState = initSeason('test-season');
s = { ...s, phase: 'DECLARE' }; // skip onboarding

for (let w = 1; w <= 6; w++) {
  s = buildBoard({ ...s, declaration: 'in' });
  if (s.phase === 'PICK') {
    // pick the first two board candidates
    for (const id of s.playerCandidates.slice(0, 2)) s = togglePick(s, id);
    s = runClearing(s);
  }
  // answer any open checkpoints with KEEP
  for (const c of openCheckpointsForPlayer(s)) {
    s = { ...s, connections: s.connections.map((x) => (x.id === c.id ? { ...x, votes: { ...x.votes, you: 'KEEP' } } : x)) };
  }
  const intros = s.playerIntrosThisWeek;
  const active = playerConnections(s).filter((c) => c.state === 'ACTIVE' || c.state === 'CHECKPOINT_OPEN').length;
  console.log(`week ${w}: intros=${intros.length} playerOpen=${active} phase→advance`);
  s = advanceWeek(s);
}

console.log('final phase:', s.phase);
console.log('metrics:', JSON.stringify(s.metrics, null, 0));
console.log('player connections:', playerConnections(s).map((c) => `${c.id}:${c.state}`).join(', '));
console.log('total log lines:', s.log.length);
console.log('\nFULL SEASON RAN WITHOUT ERROR');
