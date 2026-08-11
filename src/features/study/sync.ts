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
    const events: StudyEvent[] = g.flatMap((r) => JSON.parse(r.events_json) as StudyEvent[]);
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
  private flushing = false;

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

  /** Send accumulated state. Safe to call repeatedly; serialized internally. */
  async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    try {
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
        if (isNetworkError(e)) {
          enqueue(this.achievementId, this.methodKey, batchId, seconds, events);
        } else {
          console.warn('[study-sync] batch rejected:', (e as Error).message);
          this.onRejected?.((e as Error).message);
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  /** Final flush + teardown (call on unmount). */
  async stop(): Promise<void> {
    if (this.accrualTimer) clearInterval(this.accrualTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.appStateSub?.remove();
    this.accrualTimer = this.syncTimer = null;
    this.appStateSub = null;
    await this.flush();
  }
}
