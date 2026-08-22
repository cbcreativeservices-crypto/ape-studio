/**
 * timeTrial — the official "TIME TRIAL" challenge mode layered on top of the
 * device-local pace system (see paceStore.ts / PaceReadout.tsx).
 *
 * A time trial is a deliberate, opt-in 15:00 countdown challenge available in
 * every study method. The learner starts it from the pace-timer settings popup;
 * the countdown then runs — never a hard stop — to 0:00, at which point a
 * PASS/FAIL result is decided by the AVERAGE pace over the full 15 minutes.
 *
 * PACE METRIC = CORRECT answers per minute. ONLY correct answers advance the
 * pace (a wrong answer earns no credit, so speed-tapping can't clear a trial).
 *
 * TARGET = quiz pace, derived from the "1×/quiz" pace preset (never hardcoded):
 *   targetPace = 60 / SEC_PER_Q.quiz  Q/min  (≈3.0/min → ~45 correct in 15 min).
 *
 * PASS RULE (checked once, at 0:00): PASS if averagePace over the full 15 min
 *   (correctCount / 15) ≥ targetPace. Mid-run dips are allowed as long as the
 *   average recovers by the end — so the live HUD shows the current average vs
 *   target and a projection, and NEVER fails the run on a momentary dip.
 *
 * On PASS: credit ONE study-method completion via recordTimeTrialPass() — a
 * SAFE NO-OP placeholder (see bottom of file). On FAIL: a friendly result and a
 * restart offer, no penalty. Nothing here ever blocks study.
 *
 * External-store pattern (module map + listeners + useSyncExternalStore), the
 * same shape as paceStore.ts. Snapshots are cached per method so getSnapshot
 * stays referentially stable between ticks (required by useSyncExternalStore).
 */
import { useSyncExternalStore } from 'react';
import { supabase } from '../../lib/supabase';
import { SEC_PER_Q, type PaceMethodKey, type PaceStatus } from './paceStore';
import { emitStudyProgress } from './sync';

/** The full trial duration, in seconds (15:00). */
export const TIME_TRIAL_SECONDS = 15 * 60;

/** Target pace = the quiz / "1×" preset, in questions per minute. Derived from
 *  PACE_PRESETS' quiz secPerQ — NOT hardcoded 20/3 (per product decision). */
const QUIZ_SEC_PER_Q = SEC_PER_Q.quiz ?? 20;
export const TIME_TRIAL_TARGET_QPM = 60 / QUIZ_SEC_PER_Q;

/** Correct answers needed to pass = target × 15 min (≈45 at 3.0/min). */
export const TIME_TRIAL_NEEDED = Math.ceil(TIME_TRIAL_TARGET_QPM * (TIME_TRIAL_SECONDS / 60));

/** Terminal result, decided once at 0:00. */
export type TimeTrialResult = {
  passed: boolean;
  correctCount: number;
  /** seconds the trial ran (always TIME_TRIAL_SECONDS at a natural finish). */
  seconds: number;
};

/** The live snapshot the HUD renders from. */
export type TimeTrialSnapshot = {
  /** True while the countdown is running. */
  active: boolean;
  /** 900 → 0. */
  remainingSeconds: number;
  /** Correct answers registered so far. */
  correctCount: number;
  /** Q/min target (quiz pace). */
  targetPace: number;
  /** Current AVERAGE pace = correct / elapsed-minutes, in Q/min. */
  averagePace: number;
  /** Correct answers still needed to reach the pass threshold. */
  needed: number;
  /** Projected final correct count if the current average holds for 15 min. */
  projectedFinal: number;
  /** True if the current average pace would clear the trial (projection). */
  projectedPass: boolean;
  /** True if the current average pace is at/above target right now. */
  onPaceNow: boolean;
  /** −1 (well behind) .. +1 (well ahead) vs target, for the marker scale. */
  markerPos: number;
  /** Reuses the pace-readout status vocabulary (ahead / onpace / behind). */
  status: PaceStatus;
  /** Set once at 0:00; drives the result panel. Null while running/idle. */
  result: TimeTrialResult | null;
};

/** Internal mutable state per method. */
type TrialState = {
  active: boolean;
  topicId: string | null;
  correctCount: number;
  /** ms epoch when the trial started (null = idle). */
  startedAt: number | null;
  /** ms epoch when the countdown ends (startedAt + duration). */
  endsAt: number | null;
  result: TimeTrialResult | null;
};

const IDLE_STATE: TrialState = {
  active: false,
  topicId: null,
  correctCount: 0,
  startedAt: null,
  endsAt: null,
  result: null,
};

/** Shared idle snapshot — stable reference so idle screens never re-render. */
const IDLE_SNAPSHOT: TimeTrialSnapshot = {
  active: false,
  remainingSeconds: TIME_TRIAL_SECONDS,
  correctCount: 0,
  targetPace: TIME_TRIAL_TARGET_QPM,
  averagePace: 0,
  needed: TIME_TRIAL_NEEDED,
  projectedFinal: 0,
  projectedPass: false,
  onPaceNow: false,
  markerPos: 0,
  status: 'onpace',
  result: null,
};

const states = new Map<PaceMethodKey, TrialState>();
const snapshots = new Map<PaceMethodKey, TimeTrialSnapshot>();
const listeners = new Map<PaceMethodKey, Set<() => void>>();
const timers = new Map<PaceMethodKey, ReturnType<typeof setInterval>>();

function getState(m: PaceMethodKey): TrialState {
  return states.get(m) ?? IDLE_STATE;
}

function emit(m: PaceMethodKey): void {
  listeners.get(m)?.forEach((l) => l());
}

/** Recompute (and cache) the snapshot for a method from its current state. */
function recompute(m: PaceMethodKey): void {
  const st = getState(m);
  if (!st.active && !st.result) {
    snapshots.set(m, IDLE_SNAPSHOT);
    return;
  }

  const now = Date.now();
  const remainingSeconds = st.endsAt != null ? Math.max(0, (st.endsAt - now) / 1000) : 0;
  const elapsedSeconds = TIME_TRIAL_SECONDS - remainingSeconds;
  const elapsedMinutes = elapsedSeconds / 60;
  const targetPace = TIME_TRIAL_TARGET_QPM;

  const averagePace = elapsedMinutes > 0 ? st.correctCount / elapsedMinutes : 0;
  const projectedFinal = Math.round(averagePace * (TIME_TRIAL_SECONDS / 60));
  const onPaceNow = averagePace >= targetPace;
  const projectedPass = projectedFinal >= TIME_TRIAL_NEEDED;
  const needed = Math.max(0, TIME_TRIAL_NEEDED - st.correctCount);

  // Marker: 0 = exactly on target, +1 = at/above 2× target, −1 = at 0.
  const ratio = targetPace > 0 ? averagePace / targetPace : 0;
  const markerPos = Math.max(-1, Math.min(1, ratio - 1));

  // Status vocabulary reused from the pace readout. During the first question's
  // worth of time nobody can be "behind" yet — grace, so the HUD reads ON TRACK.
  let status: PaceStatus;
  if (elapsedSeconds < QUIZ_SEC_PER_Q) status = 'onpace';
  else if (ratio >= 1.05) status = 'ahead';
  else if (ratio < 0.95) status = 'behind';
  else status = 'onpace';

  snapshots.set(m, {
    active: st.active,
    remainingSeconds,
    correctCount: st.correctCount,
    targetPace,
    averagePace,
    needed,
    projectedFinal,
    projectedPass,
    onPaceNow,
    markerPos,
    status,
    result: st.result,
  });
}

function getSnapshot(m: PaceMethodKey): TimeTrialSnapshot {
  return snapshots.get(m) ?? IDLE_SNAPSHOT;
}

/** Stop the ticking interval for a method, if any. */
function clearTimer(m: PaceMethodKey): void {
  const t = timers.get(m);
  if (t != null) {
    clearInterval(t);
    timers.delete(m);
  }
}

/** Finalize a trial at 0:00: decide PASS/FAIL, credit on pass, publish result. */
function finalize(m: PaceMethodKey): void {
  const st = getState(m);
  if (!st.active) return;
  clearTimer(m);

  // PASS if the AVERAGE over the full 15 min ≥ target (correctCount / 15 ≥ tgt).
  // Equivalent to correctCount ≥ target × 15, with a tiny epsilon for float slop.
  const passed = st.correctCount + 1e-9 >= TIME_TRIAL_TARGET_QPM * (TIME_TRIAL_SECONDS / 60);
  const result: TimeTrialResult = {
    passed,
    correctCount: st.correctCount,
    seconds: TIME_TRIAL_SECONDS,
  };

  states.set(m, { ...st, active: false, result });
  recompute(m);
  emit(m);

  if (passed) {
    // Fire-and-forget, error-swallowing (paceRecords.ts style). SAFE NO-OP for
    // now — see recordTimeTrialPass below; the parent wires real crediting.
    void recordTimeTrialPass({
      topicId: st.topicId ?? '',
      method: m,
      correctCount: st.correctCount,
      seconds: TIME_TRIAL_SECONDS,
    }).catch(() => {});
  }
}

/** Start (or restart) a 15:00 time trial for a method against a topic. */
export function startTimeTrial(method: PaceMethodKey, topicId: string): void {
  clearTimer(method);
  const now = Date.now();
  states.set(method, {
    active: true,
    topicId,
    correctCount: 0,
    startedAt: now,
    endsAt: now + TIME_TRIAL_SECONDS * 1000,
    result: null,
  });
  recompute(method);
  emit(method);

  const id = setInterval(() => {
    const st = getState(method);
    if (!st.active || st.endsAt == null) {
      clearTimer(method);
      return;
    }
    if (Date.now() >= st.endsAt) {
      finalize(method);
      return;
    }
    recompute(method); // tick the countdown / live average
    emit(method);
  }, 1000);
  timers.set(method, id);
}

/** Restart the last trial for a method (reuses the stored topic id). No-op if
 *  no topic was ever set. */
export function restartTimeTrial(method: PaceMethodKey): void {
  const topicId = getState(method).topicId;
  if (topicId == null) return;
  startTimeTrial(method, topicId);
}

/**
 * Register one graded answer against an active trial. ONLY correct answers
 * advance the pace; incorrect answers are counted as attempts elsewhere but
 * earn no pace credit here (so speed-tapping can't clear the trial). No-op when
 * no trial is active for the method.
 */
export function registerTrialAnswer(method: PaceMethodKey, correct: boolean): void {
  const st = getState(method);
  if (!st.active) return;
  if (!correct) return;
  states.set(method, { ...st, correctCount: st.correctCount + 1 });
  recompute(method);
  emit(method);
}

/** Clear a finished trial's result panel (exit back to the normal readout). */
export function dismissTimeTrial(method: PaceMethodKey): void {
  clearTimer(method);
  states.set(method, { ...IDLE_STATE });
  snapshots.set(method, IDLE_SNAPSHOT);
  emit(method);
}

/** Abort an in-progress trial with no result (e.g. an explicit cancel). */
export function cancelTimeTrial(method: PaceMethodKey): void {
  dismissTimeTrial(method);
}

/** True when a method has a trial running OR a result still on screen. */
export function isTimeTrialLive(method: PaceMethodKey): boolean {
  const st = getState(method);
  return st.active || st.result != null;
}

/** Subscribe to a method's live time-trial snapshot. */
export function useTimeTrial(method: PaceMethodKey): TimeTrialSnapshot {
  return useSyncExternalStore(
    (cb) => {
      let set = listeners.get(method);
      if (!set) {
        set = new Set();
        listeners.set(method, set);
      }
      set.add(cb);
      return () => {
        set?.delete(cb);
      };
    },
    () => getSnapshot(method),
    () => getSnapshot(method),
  );
}

/**
 * recordTimeTrialPass — credit ONE study-method completion toward a topic when
 * a time trial is cleared.
 *
 * Fire-and-forget, error-SWALLOWING (paceRecords.ts style): calls the
 * `credit_time_trial(p_achievement_id, p_method_key)` RPC, which sets the
 * server-side `trial_passed` flag so this method counts complete for the quiz
 * unlock. correctCount / seconds are not needed by the RPC (the pass decision
 * is client-side) and are ignored here. ANY error — network, auth, RPC guard —
 * is swallowed so the trial UX never breaks; this never throws.
 */
export async function recordTimeTrialPass(args: {
  topicId: string;
  method: PaceMethodKey;
  correctCount: number;
  seconds: number;
}): Promise<void> {
  try {
    // supabase-js RESOLVES with { error } rather than throwing, so the catch
    // below is dead code for RPC errors — check `error` explicitly. This credit
    // is what marks the method complete for the quiz unlock, so a silent loss
    // would leave the learner unable to reach the quiz with no signal at all.
    const { error } = await supabase.rpc('credit_time_trial', {
      p_achievement_id: args.topicId,
      p_method_key: args.method,
    });
    if (error) {
      console.warn('[time-trial] credit_time_trial failed:', error.message);
    } else {
      emitStudyProgress(); // credit landed — refresh any live Dashboard/quiz gate
    }
  } catch (e) {
    // Swallow the throw path: crediting is best-effort; never disrupts study.
    console.warn('[time-trial] credit_time_trial threw:', (e as Error).message);
  }
}
