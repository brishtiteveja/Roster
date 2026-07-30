import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from './orchestration';
import { Persona } from '../data/cohort';

// Season persistence. The whole game is plain data except `byId` (a Map derived
// from player + cohort), so we strip it on save and rebuild it on load.
// Storage stays on-device (localStorage on web, AsyncStorage native) — nothing
// leaves the box, same as everything else.

const KEY = 'roster:season';
const VERSION = 1;

export function serialize(state: GameState): string {
  const { byId, ...rest } = state;
  // UI-transient fields are not worth restoring mid-gesture.
  return JSON.stringify({
    v: VERSION,
    state: { ...rest, chatOpen: null, graduatePrompt: null, celebrate: null },
  });
}

export function deserialize(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || parsed.v !== VERSION || !parsed.state) return null;
    const s = parsed.state as Omit<GameState, 'byId'>;
    if (!s.player || !Array.isArray(s.cohort)) return null;
    const byId = new Map<string, Persona>([
      [s.player.id, s.player],
      ...s.cohort.map((p) => [p.id, p] as const),
    ]);
    return { ...s, byId };
  } catch {
    return null;
  }
}

export async function saveSeason(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, serialize(state));
  } catch {
    // Persistence is best-effort; the game continues in memory.
  }
}

export async function loadSeason(): Promise<GameState | null> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? deserialize(json) : null;
  } catch {
    return null;
  }
}

export async function clearSeason(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}
