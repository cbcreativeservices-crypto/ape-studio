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
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';
import type { ItemStates } from './api';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';

const PREFIX = 'ape:localMethod:'; // + `${achievementId}:${methodKey}`
const keyFor = (achievementId: string, methodKey: string) => `${PREFIX}${achievementId}:${methodKey}`;

/**
 * WIPE FENCE (night bug pass 3, 2026-10-01). clearAllLocalMethodStates lists
 * the keys, THEN removes them; AsyncStorage runs calls in order, so a mirror
 * write issued between those two steps created a key the removal never saw —
 * the departing account's progress, merged into the next account's Dashboard.
 * Any write issued while a wipe is running is the departing account's (the
 * identity change is what started the wipe), so it is dropped. A write issued
 * BEFORE the wipe is queued ahead of the key listing and removed with the rest.
 */
let clearsInFlight = 0;
/**
 * Bumped by every wipe (and by the account wipe's registry): a save that
 * STARTED before the wipe and is still reading lands nowhere (wave 2,
 * 2026-10-02 — the read-merge below widened the window the count alone fenced).
 */
let wipeGeneration = 0;
registerLocalStoreReset(() => {
  wipeGeneration++;
});
/** One save at a time per key, so two merges cannot lose each other's update. */
const chains = new Map<string, Promise<boolean>>();

/**
 * Save a method's item states — MERGED with what is stored (wave 2,
 * 2026-10-02). It replaced the row whole, so a screen whose resume read had
 * FAILED (loadLocalMethodStates answered null, the screen started from the
 * server row) wrote that thinner copy over the mirror, and Scenarios — which
 * never reads the mirror at all — overwrote it with one session's answers
 * every time. The merge is `mergeItemStates`, the same never-regress rule the
 * Dashboard reads with, so a save can only add. A stored row that cannot be
 * READ is not overwritten: the save writes nothing (the server mirror still
 * applies, and the next save tries again). A damaged row (unparseable) is
 * replaced, as before. Resolves true only when the device accepted the write.
 */
export function saveLocalMethodStates(
  achievementId: string,
  methodKey: string,
  states: ItemStates,
): Promise<boolean> {
  if (clearsInFlight > 0) return Promise.resolve(false);
  const gen = wipeGeneration;
  const k = keyFor(achievementId, methodKey);
  const run = (chains.get(k) ?? Promise.resolve(true)).then(async (): Promise<boolean> => {
    if (gen !== wipeGeneration || clearsInFlight > 0) return false;
    let stored: ItemStates | null = null;
    try {
      const raw = await AsyncStorage.getItem(k);
      try {
        stored = raw ? (JSON.parse(raw) as ItemStates) : null;
      } catch {
        stored = null; // damaged: nothing usable to keep
      }
    } catch {
      return false; // read failed — never write over a row we could not see
    }
    if (gen !== wipeGeneration || clearsInFlight > 0) return false;
    try {
      await AsyncStorage.setItem(k, JSON.stringify(stored ? mergeItemStates(stored, states) : states));
      return true;
    } catch {
      // Non-fatal — the server mirror still applies for an account — but every
      // caller drops this answer, and for a guest this copy is the only one:
      // the learner is told (owner 2026-10-03), never across the wipe.
      if (gen === wipeGeneration && clearsInFlight === 0) reportUnhandledSaveFailure();
      return false;
    }
  });
  chains.set(k, run);
  void run.then(() => {
    if (chains.get(k) === run) chains.delete(k);
  });
  return run;
}

/** Wipe every locally-mirrored method row. Called when the signed-in user
 *  changes (sign-out, or sign-in as a different user) so progress never leaks
 *  across accounts — e.g. a fresh free/no-account login starts clear
 *  (owner 2026-08-11). Server rows remain the source of truth for real users. */
export async function clearAllLocalMethodStates(): Promise<void> {
  clearsInFlight++;
  wipeGeneration++;
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length > 0) await AsyncStorage.multiRemove(keys);
  } catch {
    /* non-fatal */
  } finally {
    clearsInFlight--;
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
