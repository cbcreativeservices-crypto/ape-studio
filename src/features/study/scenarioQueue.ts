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
 *
 * ⛔ ...WITH ONE ESCAPE HATCH, AND IT IS LOAD-BEARING. Stopping forever is only
 * correct while the failure is transient. A call the server will NEVER accept
 * turns "preserve order" into "freeze scenarios permanently" — see MAX_TRIES
 * below for the live example that did exactly that. After MAX_TRIES the head is
 * discarded, loudly, and the drain continues.
 */
import { createLocalStore } from '../storage/localStore';

const KEY = 'ape:scenarioQueue';
/**
 * Above this the queue sheds work — a runaway queue is worse than losing some.
 *
 * ⛔ IT SHEDS THE NEWEST, NOT THE OLDEST. This was `slice(-MAX_PENDING)`, which
 *    discards from the FRONT — precisely the rows the drain depends on. This
 *    file's own header calls front-to-back ordering non-negotiable because a
 *    `complete` for a round must not land before the answers it completes, and
 *    dropping the front does exactly that: the round is then permanently short
 *    of its answer count, the scenarios LED never fills, and scenarios is a
 *    hard term of the quiz gate. Shedding the newest loses the same amount of
 *    work while leaving what remains replayable.
 */
const MAX_PENDING = 500;

/**
 * How many times the head of the queue may fail before it is treated as POISON
 * and dropped so the rest can move.
 *
 * ⛔ WHY THIS EXISTS: stop-at-first-failure is right for a transient failure
 * and catastrophic for a permanent one. Observed on a device 2026-09-20 —
 * `complete_scenario_round` writes `auth.uid()` into a column keyed on
 * `public.users.id`, so it raises a foreign-key violation for EVERY account,
 * every time. That `complete` could never succeed, and because
 * `recordScenarioAnswer` and `completeScenarioRound` both refuse to send while
 * anything is pending, one permanently-failing item silently froze every
 * scenario answer on every topic — and survived a force-quit, because the
 * queue is durable. The learner kept answering into a void.
 *
 * 6 attempts is comfortably more than a flaky connection needs and still
 * bounded, so a genuinely dead call clears within one session instead of never.
 */
const MAX_TRIES = 6;

export type ScenarioPending = (
  | { kind: 'answer'; achievementId: string; questionId: string; round: number; correct: boolean; at: number }
  | { kind: 'complete'; achievementId: string; round: number; at: number }
) & {
  /** Failed sends so far. Absent = 0; only ever set by the drain. */
  tries?: number;
};

/**
 * ⛔ ON THE SHARED SAFE STORE (wave 2, 2026-10-02 — pattern catalog P1/P2/P3).
 *
 * The hand-rolled `read()` answered `[]` for a read that THREW, the same as an
 * empty queue — so the next enqueue wrote `[thatOneCall]` over every call
 * still waiting, and the drain's write-back wrote `[]` over all of them:
 * graded work the learner was told "will be sent" was deleted from the
 * device. On createLocalStore a failed read leaves the queue UNREADABLE:
 * nothing is written, new calls are held in memory and appended to the stored
 * queue once a read succeeds, and the drain sends nothing (a stored call may
 * have to go first). A DAMAGED queue (not JSON, not an array) is set aside
 * under `ape:scenarioQueue:damaged` and the queue starts empty, as before.
 *
 * The store's one write chain replaces the old `serial()` lost-update guard:
 * every change is a mutation of the in-memory queue, applied in order, and
 * written after it. Its generation is the account-wipe fence: a drain that
 * started under the departing user stops sending and writes nothing back.
 */
const store = createLocalStore<ScenarioPending[]>({
  key: KEY,
  empty: () => [],
  parse: (parsed) => {
    if (!Array.isArray(parsed)) throw new Error('not a scenario queue');
    return parsed as ScenarioPending[];
  },
  // An empty queue is "nothing saved": the key is removed, as the clear did.
  serialize: (items) => (items.length > 0 ? JSON.stringify(items.slice(0, MAX_PENDING)) : null),
});

/**
 * How many calls are waiting, for the drain's answer and the "not saved yet"
 * copy. While the stored queue cannot be read the true count is unknown, so
 * it is never reported as 0 — "nothing pending" would let a new call jump
 * ahead of a stored one, and tell the learner their work was sent.
 */
function pendingNow(): number {
  const n = store.get().length;
  return store.isUnreadable() ? Math.max(1, n) : n;
}

/** Park a call that did not reach the server. Never throws. Resolves true only
 *  when the queue (with this call) is on the device. */
/** The queue's identity generation (the account wipe bumps it). A caller
 *  whose network call is still out when the wipe lands captures this before
 *  the call and queues nothing when it has moved — the answer belonged to
 *  the departing account (pattern hunt wave 3, 2026-10-02). */
export function scenarioQueueGeneration(): number {
  return store.generation();
}

export async function queueScenarioCall(item: ScenarioPending): Promise<boolean> {
  // The Scenarios report says a refusal ("this device could not keep them").
  const ok = await store.mutate(
    (items) =>
      // Above the cap the queue sheds the NEWEST (see MAX_PENDING).
      items.length >= MAX_PENDING ? items : [...items, item],
    { reportFailure: false },
  );
  if (!ok && store.isUnreadable()) {
    console.warn('[scenario-queue] stored queue unreadable — call held in memory until it can be read');
  } else if (!ok) {
    console.warn('[scenario-queue] could not persist');
  }
  return ok;
}

/** How many scenario calls are still unsent — drives the "not saved yet" copy. */
export async function pendingScenarioCount(): Promise<number> {
  await store.hydrate();
  return pendingNow();
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
  send: (item: ScenarioPending) => Promise<boolean | 'offline'>,
): Promise<number> {
  if (draining) return draining;
  const run = (async () => {
    const gen = store.generation();
    await store.hydrate();
    if (gen !== store.generation()) return 0;
    // Unreadable: send NOTHING. A call stored before this session may have to
    // land first, and it cannot be seen.
    if (!store.isHydrated()) return pendingNow();
    const items = store.get();
    if (items.length === 0) return 0;
    /** Entries consumed from the head — sent successfully, or given up on. */
    let consumed = 0;
    /** True when we stopped on a failure that is still worth retrying. */
    let stalled = false;
    /**
     * True when that failure never reached the server (evening hunt 3,
     * 2026-10-02). It costs the head NO try: the drain runs before every new
     * answer, so an offline round burned one try per answer and, six answers
     * in, discarded the oldest queued answer as "permanently failing" — then
     * the next — work the screen had told the learner was kept. MAX_TRIES is
     * for a call the SERVER refuses; offline is no evidence of that.
     */
    let offline = false;
    for (const item of items) {
      // The account wipe moved on: these rows are the departing user's and
      // must not be sent under the next session (they carry no user id).
      if (gen !== store.generation()) return pendingNow();
      let ok: boolean | 'offline' = false;
      try {
        ok = await send(item);
      } catch {
        ok = false;
      }
      if (ok === true) {
        consumed++;
        continue;
      }
      if (ok === 'offline') {
        stalled = true;
        offline = true;
        break;
      }
      // ⛔ Ordering still wins for a TRANSIENT failure: stop, do not skip,
      //    because later calls depend on this one landing first.
      if ((item.tries ?? 0) + 1 < MAX_TRIES) {
        stalled = true;
        break;
      }
      /**
       * Poison. It has failed MAX_TRIES times, so it is not coming back, and
       * holding the line for it costs every later call indefinitely. Drop it
       * and keep going — some work lost beats all work lost.
       *
       * This is logged loudly on purpose: a discarded `complete` means a round
       * the server will never count, and that is a real defect somewhere else,
       * not routine housekeeping.
       */
      console.warn(
        `[scenario-queue] discarding a permanently-failing '${item.kind}' for ` +
          `achievement ${item.achievementId} round ${item.round} after ${MAX_TRIES} attempts`,
      );
      consumed++;
    }
    if (gen !== store.generation()) return pendingNow();
    /**
     * ⛔ DROP FROM THE QUEUE AS IT IS NOW, NOT THE STALE COPY. Anything queued
     *    during the loop of network calls is in the store but not in `items`;
     *    dropping the first `consumed` entries of the CURRENT queue is correct
     *    because the queue is only ever appended to at the tail and drained
     *    from the head.
     */
    await store.mutate((current) => {
      const left = current.slice(consumed);
      /**
       * Persist the failed attempt on the new head, or `tries` never climbs and
       * a permanently-dead call is retried forever — which is the bug this
       * whole branch exists to end.
       */
      if (stalled && !offline && left.length > 0) {
        left[0] = { ...left[0], tries: (left[0].tries ?? 0) + 1 };
      }
      return left;
    }, { reportFailure: false }); // bookkeeping: a sent call left on disk is sent again
    return pendingNow();
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
 *
 * The reset drops the departing user's queue from memory (held calls
 * included) and fences any drain in flight; the empty queue is then written,
 * which removes the key once a read succeeds.
 */
export async function clearScenarioQueue(): Promise<void> {
  draining = null;
  store.reset();
  await store.set([], { reportFailure: false }); // the account wipe, not the user's change
}

/** The account wipe (also reached through the store's own registration). */
export function resetLocal(): void {
  store.reset();
}
