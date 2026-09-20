/**
 * A durable queue for scenario progress.
 *
 * ⛔ WHY THIS EXISTS: SCENARIOS WAS THE ONE METHOD THAT LOST WORK OUTRIGHT.
 *
 * Flashcards, Matching and Fill-in-Blank all route every event through
 * `StudySession` into the SQLite queue in `studyQueueStorage`. Scenarios did
 * not. `recordScenarioAnswer` and `completeScenarioRound` fired their RPCs,
 * swallowed any failure with a `console.warn`, and returned. No queue, no
 * retry, nothing re-sent on reconnect.
 *
 * The sequence that costs a learner a round: signal drops on a train, they
 * answer every question, the round report renders from the in-memory answers
 * so the app looks completely normal and CONGRATULATES them — and nothing was
 * persisted. They come back to round 1 with the LED unmoved.
 *
 * ── HOW THIS ONE WORKS ─────────────────────────────────────────────────────
 * Deliberately simpler than the study queue: scenario calls are small, rare
 * (one per answer, one per round) and idempotent server-side by
 * (achievement, question, round), so this needs no batching, no coalescing
 * and no idempotency key of its own — replaying a call is harmless.
 *
 * ⚠️ AsyncStorage, not SQLite. `studyQueueStorage` has a native/web split and
 * a schema whose own migration note warns against adding columns; scenario
 * rows are a different shape and would not fit it without one. AsyncStorage
 * is already a hard dependency, survives restarts, and a handful of pending
 * scenario calls is a few hundred bytes.
 *
 * ⛔ ORDER MATTERS AND IS PRESERVED. A `complete` for round 2 must not land
 * before the answers it completes, or the server counts a round with missing
 * answers. The queue is drained strictly front-to-back and STOPS at the first
 * failure rather than skipping past it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:scenarioQueue';
/** Above this, the oldest entries are dropped — a runaway queue is worse. */
const MAX_PENDING = 500;

export type ScenarioPending =
  | { kind: 'answer'; achievementId: string; questionId: string; round: number; correct: boolean; at: number }
  | { kind: 'complete'; achievementId: string; round: number; at: number };

async function read(): Promise<ScenarioPending[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScenarioPending[]) : [];
  } catch {
    // A corrupt queue must not wedge scenarios forever.
    return [];
  }
}

async function write(items: ScenarioPending[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_PENDING)));
  } catch (e) {
    console.warn('[scenario-queue] could not persist:', (e as Error).message);
  }
}

/** Park a call that did not reach the server. Never throws. */
export async function queueScenarioCall(item: ScenarioPending): Promise<void> {
  const items = await read();
  items.push(item);
  await write(items);
}

/** How many scenario calls are still unsent — drives the "not saved yet" copy. */
export async function pendingScenarioCount(): Promise<number> {
  return (await read()).length;
}

let draining: Promise<number> | null = null;

/**
 * Send everything queued, oldest first, stopping at the first failure so
 * ordering is never broken. Returns how many are still pending afterwards.
 *
 * Serialised: two concurrent drains would send the same rows twice and race
 * on the write-back.
 */
export function drainScenarioQueue(
  send: (item: ScenarioPending) => Promise<boolean>,
): Promise<number> {
  if (draining) return draining;
  const run = (async () => {
    const items = await read();
    if (items.length === 0) return 0;
    let sent = 0;
    for (const item of items) {
      let ok = false;
      try {
        ok = await send(item);
      } catch {
        ok = false;
      }
      if (!ok) break; // ⛔ stop, do not skip — later calls depend on this one
      sent++;
    }
    const left = items.slice(sent);
    await write(left);
    return left.length;
  })().finally(() => {
    draining = null;
  });
  draining = run;
  return run;
}

/**
 * Drop every pending scenario call — called on an account switch.
 *
 * ⛔ CROSS-ACCOUNT CONTAMINATION. Queued answers carry an achievement id but
 * no user: replayed after a sign-out they would land on the NEXT user's
 * account as their scenario progress. The account-wipe registry test caught
 * this file the moment it was added, which is exactly what that guard is for.
 */
export async function clearScenarioQueue(): Promise<void> {
  draining = null;
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.warn('[scenario-queue] could not clear:', (e as Error).message);
  }
}
