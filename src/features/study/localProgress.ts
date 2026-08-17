/**
 * Local (device) mirror of per-method study progress (Booth 2026-07-15).
 *
 * The Dashboard's LED + START→CONTINUE state derive from `item_states`, which
 * normally round-trip through the server (record_study_progress). When that
 * write is slow, unavailable, or the user is in commercial mode without a
 * server row yet, the Dashboard would read 0 and never react to the work the
 * user just did. So each study screen ALSO writes its live `item_states` here,
 * and the Dashboard MERGES this local mirror over the server rows for DISPLAY
 * only — gates (completion/time/accuracy) still read server truth.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemStates } from './api';

const PREFIX = 'ape:localMethod:'; // + `${achievementId}:${methodKey}`
const keyFor = (achievementId: string, methodKey: string) => `${PREFIX}${achievementId}:${methodKey}`;

export async function saveLocalMethodStates(
  achievementId: string,
  methodKey: string,
  states: ItemStates,
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(achievementId, methodKey), JSON.stringify(states));
  } catch {
    /* device write failure is non-fatal — the server mirror still applies */
  }
}

/** Wipe every locally-mirrored method row. Called when the signed-in user
 *  changes (sign-out, or sign-in as a different user) so progress never leaks
 *  across accounts — e.g. a fresh free/no-account login starts clear
 *  (owner 2026-08-11). Server rows remain the source of truth for real users. */
export async function clearAllLocalMethodStates(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {
    /* non-fatal */
  }
}

/** One mirrored method row (for a study screen's own resume merge). */
export async function loadLocalMethodStates(
  achievementId: string,
  methodKey: string,
): Promise<ItemStates | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(achievementId, methodKey));
    return raw ? (JSON.parse(raw) as ItemStates) : null;
  } catch {
    return null;
  }
}

export type LocalMethodRow = { achievement_id: string; method_key: string; item_states: ItemStates };

/** Every locally-mirrored method row (for the Dashboard merge). */
export async function loadAllLocalMethodStates(): Promise<LocalMethodRow[]> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(keys);
    const rows: LocalMethodRow[] = [];
    for (const [k, v] of pairs) {
      if (!v) continue;
      const rest = k.slice(PREFIX.length);
      const sep = rest.lastIndexOf(':'); // achievement UUID + methodKey both have no ':'
      if (sep < 0) continue;
      try {
        rows.push({
          achievement_id: rest.slice(0, sep),
          method_key: rest.slice(sep + 1),
          item_states: JSON.parse(v) as ItemStates,
        });
      } catch {
        /* skip a corrupt entry */
      }
    }
    return rows;
  } catch {
    return [];
  }
}

/** Merge two item-state maps, taking the MORE-ADVANCED value per field (never
 *  regresses a known card or a view/attempt count). */
export function mergeItemStates(
  a: ItemStates | null | undefined,
  b: ItemStates | null | undefined,
): ItemStates {
  const out: ItemStates = {};
  for (const id of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const x = a?.[id] ?? {};
    const y = b?.[id] ?? {};
    out[id] = {
      views: Math.max(x.views ?? 0, y.views ?? 0) || undefined,
      known: x.known || y.known || undefined,
      attempts: Math.max(x.attempts ?? 0, y.attempts ?? 0) || undefined,
      correct: Math.max(x.correct ?? 0, y.correct ?? 0) || undefined,
    };
  }
  return out;
}
