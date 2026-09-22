/**
 * Study sync engine — record_study_progress batching per the RPC contract:
 *
 * - Client sends raw EVENTS, never derived state (contract §0 principle).
 * - Batches: client-generated UUID per batch; replay = idempotent no-op.
 * - 30-second sync loop + flush on exit/background (Code brief §6).
 * - ACTIVE seconds only: accrual pauses after ~10s without interaction and
 *   while the app is backgrounded (contract §1).
 * - Offline: failed batches queue in SQLite and replay on the next successful
 *   loop; queued batches are COALESCED per (achievement, method) before
 *   replay so the server's wall-clock time clamp isn't starved (contract §8).
 * - ≤500 events per batch (contract §2) — oversized merges are chunked.
 *
 * LED/gate state is rendered from the returned server snapshot only.
 */
import * as Crypto from 'expo-crypto';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../../lib/supabase';
import type { StudySnapshot } from './api';
import { sendCoalescedChunk } from './replayChunk';
import {
  deleteQueuedBatches,
  getQueuedBatches,
  insertQueuedBatch,
  type StudyQueueRow,
} from './studyQueueStorage';

export type StudyEvent =
  | { item: string; kind: 'view' }
  | { item: string; kind: 'known'; value: boolean }
  | { item: string; kind: 'answer'; correct: boolean };

const MAX_EVENTS_PER_BATCH = 500;
const SYNC_INTERVAL_MS = 30_000;
const IDLE_CUTOFF_MS = 10_000;

/** One replay chunk: the queued rows it covers, each with its parsed events.
 *  Per-row events are kept apart (not pre-flattened) so a chunk can be re-sent
 *  minus a row that turns out to be already committed — see the send loop. */
type Chunk = { items: { row: StudyQueueRow; ev: StudyEvent[] }[] };

function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /network|fetch failed|failed to fetch|fetch|timeout|timed out|abort|socket|econn|offline/i.test(msg);
}

/**
 * A failure the server will never accept, however many times we send it.
 *
 * Only these drop a queued batch. Anything else — an expired JWT, a 500, a
 * rejected enrolment that a re-sync will fix, an error shape nobody anticipated
 * — is KEPT and retried on the next loop.
 *
 * This inverts the old rule, which dropped anything that was not recognisably a
 * network error. That made an ordinary recoverable server error indistinguishable
 * from a poisoned batch, and it deleted the learner's study time either way.
 * Keeping a bad row costs one retry a minute; deleting a good one costs work the
 * person actually did and cannot get back.
 */
function isPermanentRejection(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /invalid_event|invalid_method|invalid_achievement|unknown_method|not_enrolled_permanently|malformed|constraint/i.test(msg);
}

// ---- Study-progress bus (Booth 2026-07-15) ----
// A study write lands on the server asynchronously (flush on stop() + the 30s
// loop), but the Dashboard reloads the instant it regains focus — so it used to
// read the PRE-write rows and leave the LED/START→CONTINUE state stale. Anything
// that commits progress fires this bus; the Dashboard re-fetches when it does,
// so the meters and button catch up the moment the write actually lands.
const progressListeners = new Set<() => void>();
export function onStudyProgress(cb: () => void): () => void {
  progressListeners.add(cb);
  return () => progressListeners.delete(cb);
}
export function emitStudyProgress() {
  progressListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* a listener throwing must not wedge the sync loop */
    }
  });
}

async function callRpc(
  achievementId: string,
  methodKey: string,
  batchId: string,
  activeSeconds: number,
  events: StudyEvent[],
): Promise<StudySnapshot> {
  const { data, error } = await supabase.rpc('record_study_progress', {
    p_achievement_id: achievementId,
    p_method_key: methodKey,
    p_batch_id: batchId,
    p_active_seconds: activeSeconds,
    p_events: events,
  });
  if (error) throw new Error(error.message);
  return data as StudySnapshot;
}

/** Remove a durable row by its batch id (used by the write-ahead in flushOnce). */
function dequeueByBatchId(batchId: string): void {
  try {
    const ids = getQueuedBatches()
      .filter((r) => r.batch_id === batchId)
      .map((r) => r.id);
    if (ids.length) deleteQueuedBatches(ids);
  } catch (e) {
    // Leaving the row is harmless — the server dedupes it by batch_id on
    // replay. Losing the send because the delete threw would not be.
    console.warn('[study-sync] could not clear a sent batch:', (e as Error).message);
  }
}

function enqueue(achievementId: string, methodKey: string, batchId: string, seconds: number, events: StudyEvent[]) {
  insertQueuedBatch(
    {
      achievement_id: achievementId,
      method_key: methodKey,
      batch_id: batchId,
      active_seconds: seconds,
      events_json: JSON.stringify(events),
    },
    Date.now(),
  );
}

/**
 * Replay the offline queue, coalescing per (achievement, method) so the
 * server's wall-clock clamp is not starved (contract §8). Chunked at 500
 * events, and EACH CHUNK CARRIES ITS OWN ROWS' SECONDS (see below — putting
 * them all on chunk 0 was its own double-count).
 *
 * ⛔ EVERY CHUNK GOES UNDER A STORED batch_id, NEVER A FRESH ONE.
 *
 * `p_batch_id` exists so a re-send is an idempotent no-op server-side. This
 * used to mint `Crypto.randomUUID()` per chunk per pass, throwing that away,
 * and two ordinary sequences then DOUBLE-COUNTED a learner's work:
 *
 *   · the response to a committed batch is lost (tunnel, wifi hand-off) →
 *     the catch enqueues it, correctly — and the replay re-sends it as new;
 *   · chunk 0 lands carrying ALL the coalesced seconds, chunk 1 fails on the
 *     network → we return WITHOUT deleting, so the next pass re-sends chunk 0
 *     and its seconds again. Guaranteed, not a race, on any queue over 500
 *     events that loses connectivity mid-replay.
 *
 * The stored batch_id closed the first. It did NOT close the second, and the
 * delete-as-it-lands that went with it made that half worse rather than
 * better: chunk 0's rows are now gone the moment they land, so a later
 * chunk's failure leaves rows alive that still carry seconds already sent
 * inside chunk 0's total (bug pass 1, 2026-09-20). Seconds are therefore
 * split per chunk, so no second is ever attached to a row it did not come
 * from.
 *
 * Over-credit in exactly the fields the gates and the accuracy readout are
 * computed from — a gate could open on work done once.
 *
 * So chunks are cut on ROW boundaries rather than on the flattened event
 * list, and each chunk is sent under its first row's own stored batch_id:
 * stable across passes, distinct between chunks, already a valid uuid. Each
 * chunk's rows are deleted as it lands, so a later chunk failing can never
 * cause an earlier one to be replayed as new work.
 *
 * ⛔ AND A DUPLICATE REPLY DELETES ONLY THE ROW THAT CAUSED IT (2026-09-21).
 * Borrowing the first row's id has a third failure the two above did not
 * cover: if that row was already committed, the server discards the whole
 * coalesced payload and answers successfully, so every other row in the
 * chunk was deleted having never been recorded. The send loop now reads
 * `duplicate_batch` off the snapshot and re-sends the remainder. Full
 * reasoning is in replayChunk.ts.
 *
 * ⚠️ This is also what makes the write-ahead in `flushOnce` safe: a row that
 * is sent twice is now deduplicated by the server instead of counted twice.
 *
 * Stops silently on a network error — rows stay queued for the next pass.
 */
export async function replayQueue(): Promise<void> {
  // ⛔ ONE REPLAY AT A TIME. There are two callers now (a live session's
  // flush, and the app-foreground drain), and concurrent passes over the same
  // rows would send them twice and race on the deletes.
  if (REPLAYING) return REPLAYING;
  const run = replayQueueOnce().finally(() => {
    REPLAYING = null;
  });
  REPLAYING = run;
  return run;
}
let REPLAYING: Promise<void> | null = null;

async function replayQueueOnce(): Promise<void> {
  const rows = getQueuedBatches();
  if (rows.length === 0) return;

  const groups = new Map<string, StudyQueueRow[]>();
  for (const r of rows) {
    const k = `${r.achievement_id}|${r.method_key}`;
    const g = groups.get(k) ?? [];
    g.push(r);
    groups.set(k, g);
  }

  for (const g of groups.values()) {
    try {
      for (const r of g) JSON.parse(r.events_json);
    } catch (e) {
      // Corrupt events_json: parsing used to run OUTSIDE the try below, so a
      // poisoned row threw before the drop logic and wedged the queue AND
      // aborted the live flush every cycle. Drop the bad group and continue.
      console.warn('[study-sync] dropping unparseable queued batch:', (e as Error).message);
      deleteQueuedBatches(g.map((r) => r.id));
      continue;
    }
    const { achievement_id, method_key } = g[0];

    /**
     * Cut chunks on ROW boundaries so each one can carry a real stored
     * batch_id. A single row is already capped at MAX_EVENTS_PER_BATCH by
     * `addEvent`, so a chunk is at most one row over the limit in the worst
     * case — acceptable, and far better than an id we cannot reproduce.
     */
    const chunks: Chunk[] = [];
    let cur: Chunk | null = null;
    let curCount = 0;
    for (const r of g) {
      let ev: StudyEvent[];
      try {
        ev = JSON.parse(r.events_json) as StudyEvent[];
      } catch {
        ev = [];
      }
      if (!cur || curCount + ev.length > MAX_EVENTS_PER_BATCH) {
        cur = { items: [] };
        chunks.push(cur);
        curCount = 0;
      }
      cur.items.push({ row: r, ev });
      curCount += ev.length;
    }

    try {
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        /**
         * ⛔ EACH CHUNK CARRIES ITS OWN ROWS' SECONDS.
         *
         * This used to put the WHOLE group's coalesced seconds on chunk 0 and
         * zero on the rest — while rows are deleted per chunk, immediately
         * below. So if a later chunk failed, chunk 0's rows were already gone
         * while the failing chunk's rows survived still carrying seconds that
         * had ALREADY been sent inside chunk 0's total. The next pass
         * re-grouped them and credited those seconds a second time.
         *
         * Ten rows of 60 s split 5/5: 600 s sent, chunk 1 fails, next pass
         * adds another 300 s — 900 s credited for 600 s of work. Deterministic,
         * not a race. The per-chunk batch_id idempotency protects the EVENTS;
         * it could not protect the seconds, because they rode on a different
         * chunk's id from the rows they came from.
         */
        // The duplicate-reply handling lives in replayChunk.ts, with the
        // full reasoning — it is the step that decides what gets deleted.
        await sendCoalescedChunk(
          c.items,
          (batchId, seconds, evs) => callRpc(achievement_id, method_key, batchId, seconds, evs),
          deleteQueuedBatches,
          () =>
            console.warn(
              '[study-sync] batch already committed server-side — re-sending the rest under the next id',
            ),
        );
      }
      emitStudyProgress(); // queued progress landed — refresh any dashboards
    } catch (e) {
      if (isNetworkError(e)) return; // still offline — try next loop
      if (!isPermanentRejection(e)) {
        // Recoverable, or simply unrecognised. Keep it and move on to the next
        // group so one bad batch cannot wedge the queue either.
        console.warn('[study-sync] keeping queued batch after a retryable error:', (e as Error).message);
        continue;
      }
      // Poisoned batch (e.g. invalid_event): drop it rather than wedging the queue.
      console.warn('[study-sync] dropping permanently rejected queued batch:', (e as Error).message);
      deleteQueuedBatches(g.map((r) => r.id));
    }
  }
}

/**
 * Drain the offline queue from OUTSIDE a study session.
 *
 * ⛔ WITHOUT THIS, QUEUED WORK LOOKED LOST. `replayQueue` had exactly one
 * caller — `StudySession.flushOnce` — so nothing drained it at app start, on
 * regaining connectivity, or from the Dashboard. A learner who studied
 * offline, came home to wifi and opened the app saw their pre-offline
 * numbers: the queue only moved if they entered a study method again AND
 * stayed long enough for the 30s loop or the unmount flush. Someone whose
 * work appears to have vanished re-does it, which is how a double-count gets
 * created out of a display problem.
 *
 * Never rejects — a failed drain must not reach a launch path. `replayQueue`
 * is internally serialised, so this is safe to call alongside a live session.
 */
export function drainStudyQueue(): void {
  void replayQueue().catch((e) => {
    console.warn('[study-sync] background drain failed:', (e as Error).message);
  });
}

/**
 * One live study session (one screen visit, one method). Accumulates events
 * and active seconds, syncs every 30s and on stop(); pushes each server
 * snapshot to the screen via onSnapshot.
 */
export class StudySession {
  private events: StudyEvent[] = [];
  private seconds = 0;
  private lastActivity = Date.now();
  private accrualTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private appStateSub: { remove: () => void } | null = null;
  /** The flush pass currently in flight, if any — see flush(). */
  private inflight: Promise<void> | null = null;

  constructor(
    private achievementId: string,
    private methodKey: string,
    private onSnapshot: (s: StudySnapshot) => void,
    private onRejected?: (message: string) => void,
  ) {}

  start() {
    this.accrualTimer = setInterval(() => {
      if (AppState.currentState === 'active' && Date.now() - this.lastActivity < IDLE_CUTOFF_MS) {
        this.seconds += 1;
      }
    }, 1000);
    this.syncTimer = setInterval(() => void this.flush(), SYNC_INTERVAL_MS);
    this.appStateSub = AppState.addEventListener('change', (st: AppStateStatus) => {
      if (st !== 'active') void this.flush(); // background → flush what we have
    });
  }

  /** Record a user interaction (keeps the active-time accrual alive). */
  touch() {
    this.lastActivity = Date.now();
  }

  addEvent(e: StudyEvent) {
    this.touch();
    this.events.push(e);
    if (this.events.length >= MAX_EVENTS_PER_BATCH) void this.flush();
  }

  /**
   * Send accumulated state. Safe to call repeatedly; serialized internally:
   * a call that lands while a pass is in flight WAITS for it and then runs
   * its own pass, so events/seconds recorded during a slow RPC still go out.
   * (It used to return early instead — fatal from stop(), whose flush is the
   * last one a session ever gets: everything recorded during an in-flight
   * loop flush was silently dropped, neither sent nor queued.)
   */
  async flush(): Promise<void> {
    while (this.inflight) await this.inflight;
    const run = this.flushOnce();
    this.inflight = run;
    try {
      await run;
    } finally {
      if (this.inflight === run) this.inflight = null;
    }
  }

  private async flushOnce(): Promise<void> {
    /**
     * Drain the offline queue first so coalesced history lands in order.
     *
     * ⛔ IN ITS OWN GUARD. `replayQueue` reaches synchronous SQLite; if one of
     * those throws, an unguarded await here rejects `flush()`, and every
     * caller is a bare `void this.flush()` — an unhandled rejection. Worse,
     * `while (this.inflight) await this.inflight` re-throws into WAITING
     * callers, so they skip their own pass entirely, including stop()'s final
     * flush. A failed replay must never cost the live buffer its send.
     */
    try {
      await replayQueue();
    } catch (e) {
      console.warn('[study-sync] replay pass failed, continuing with the live batch:', (e as Error).message);
    }

    if (this.events.length === 0 && this.seconds === 0) return;
    const events = this.events.splice(0);
    const seconds = this.seconds;
    this.seconds = 0;
    const batchId = Crypto.randomUUID();

    /**
     * ⛔ WRITE AHEAD — PERSIST BEFORE SENDING, delete after it lands.
     *
     * The buffer is spliced out before the await, so the catch below covers a
     * FAILED request but not a process that never reaches the catch. The
     * AppState listener fires this flush exactly when the app is being
     * backgrounded, which on iOS is exactly when the OS may suspend and later
     * terminate mid-await — and those events then existed nowhere on disk.
     *
     * ⚠️ Safe only because replay now reuses stored batch ids: if the row is
     * replayed before this send's response arrives, the server recognises the
     * same `batch_id` and no-ops. Under the old random-id replay this change
     * would have double-counted instead.
     */
    let persisted = true;
    try {
      enqueue(this.achievementId, this.methodKey, batchId, seconds, events);
    } catch (e) {
      persisted = false;
      console.warn('[study-sync] could not write-ahead this batch:', (e as Error).message);
    }

    try {
      const snap = await callRpc(this.achievementId, this.methodKey, batchId, seconds, events);
      dequeueByBatchId(batchId);
      this.onSnapshot(snap);
      emitStudyProgress(); // progress committed — refresh any live dashboard
    } catch (e) {
      // The row is already durable, so there is nothing to re-queue — unless
      // the write-ahead itself failed, in which case this is the last chance.
      // replayQueue() remains the SINGLE arbiter that eventually drops a
      // genuinely poisoned batch, so this cannot wedge the queue.
      if (!persisted) enqueue(this.achievementId, this.methodKey, batchId, seconds, events);
      if (!isNetworkError(e)) {
        console.warn('[study-sync] batch rejected, queued for retry:', (e as Error).message);
        this.onRejected?.((e as Error).message);
      }
    }
  }

  /** Final flush + teardown (call on unmount). */
  async stop(): Promise<void> {
    if (this.accrualTimer) clearInterval(this.accrualTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.appStateSub?.remove();
    this.accrualTimer = this.syncTimer = null;
    this.appStateSub = null;
    try {
      await this.flush();
    } finally {
      // Last chance: if the final pass could not run (it threw before the
      // buffer was spliced), persist whatever is left rather than losing it.
      if (this.events.length > 0 || this.seconds > 0) {
        const events = this.events.splice(0);
        const seconds = this.seconds;
        this.seconds = 0;
        try {
          enqueue(this.achievementId, this.methodKey, Crypto.randomUUID(), seconds, events);
        } catch (e) {
          console.warn('[study-sync] could not queue final batch:', (e as Error).message);
        }
      }
    }
  }
}
