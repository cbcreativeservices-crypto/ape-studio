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

function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /network|fetch failed|Failed to fetch|timeout|abort/i.test(msg);
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
 * Replay the offline queue, coalescing per (achievement, method): events are
 * concatenated in insertion order, seconds summed, and sent under fresh batch
 * ids (chunked at 500 events; the seconds ride on the first chunk).
 * Stops silently on a network error — rows stay queued for the next pass.
 */
export async function replayQueue(): Promise<void> {
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
    let events: StudyEvent[];
    try {
      events = g.flatMap((r) => JSON.parse(r.events_json) as StudyEvent[]);
    } catch (e) {
      // Corrupt events_json: parsing used to run OUTSIDE the try below, so a
      // poisoned row threw before the drop logic and wedged the queue AND
      // aborted the live flush every cycle. Drop the bad group and continue.
      console.warn('[study-sync] dropping unparseable queued batch:', (e as Error).message);
      deleteQueuedBatches(g.map((r) => r.id));
      continue;
    }
    const seconds = g.reduce((s, r) => s + r.active_seconds, 0);
    const { achievement_id, method_key } = g[0];

    const chunks: StudyEvent[][] = [];
    for (let i = 0; i < Math.max(1, Math.ceil(events.length / MAX_EVENTS_PER_BATCH)); i++) {
      chunks.push(events.slice(i * MAX_EVENTS_PER_BATCH, (i + 1) * MAX_EVENTS_PER_BATCH));
    }

    try {
      for (let i = 0; i < chunks.length; i++) {
        await callRpc(achievement_id, method_key, Crypto.randomUUID(), i === 0 ? seconds : 0, chunks[i]);
      }
      deleteQueuedBatches(g.map((r) => r.id));
      emitStudyProgress(); // queued progress landed — refresh any dashboards
    } catch (e) {
      if (isNetworkError(e)) return; // still offline — try next loop
      // Poisoned batch (e.g. invalid_event): drop it rather than wedging the queue.
      console.warn('[study-sync] dropping rejected queued batch:', (e as Error).message);
      deleteQueuedBatches(g.map((r) => r.id));
    }
  }
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
    // Drain the offline queue first so coalesced history lands in order.
    await replayQueue();

    if (this.events.length === 0 && this.seconds === 0) return;
    const events = this.events.splice(0);
    const seconds = this.seconds;
    this.seconds = 0;
    const batchId = Crypto.randomUUID();

    try {
      const snap = await callRpc(this.achievementId, this.methodKey, batchId, seconds, events);
      this.onSnapshot(snap);
      emitStudyProgress(); // progress committed — refresh any live dashboard
    } catch (e) {
      // NEVER drop the events here. The buffer was already spliced out above,
      // so a bare `console.warn` would silently lose a study session on any
      // non-network rejection (a transient RLS/token gap, or an RPC that
      // hasn't been deployed yet). Persist to the durable queue instead: it
      // survives an app restart and replays on the next flush. replayQueue()
      // remains the SINGLE arbiter that eventually drops a genuinely poisoned
      // batch (it drops on a non-network failure during replay), so this
      // cannot wedge the queue — it only buys the events one durable retry.
      enqueue(this.achievementId, this.methodKey, batchId, seconds, events);
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
