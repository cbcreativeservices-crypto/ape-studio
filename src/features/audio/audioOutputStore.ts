/**
 * audioOutputStore — the GLOBAL audio-output mute + gate (owner request
 * 2026-07-25). By DEFAULT the app is TOTALLY SILENT: nothing may leave the
 * output path (playback / tone generator / text-to-speech) until the user
 * explicitly enables audio output via a deliberate 5-second hold. It re-mutes
 * automatically — on relaunch, on login, and after 10 minutes idle.
 *
 * SESSION-ONLY by design (no persistence): the store is a plain module var +
 * listeners + the useSyncExternalStore pattern, exactly like paceStore.ts's
 * `running` store. Because nothing is persisted, `enabled` starts false on
 * EVERY JS launch — that is the app-relaunch re-mute (trigger 1), for free.
 *
 * Framework-agnostic: this file wires NO React-Native AppState / auth. Those
 * live in the app-root init (features/audio/AudioOutputGate.tsx) so the store
 * stays a pure state cell that guards can read synchronously.
 */
import { useSyncExternalStore } from 'react';

/** Idle auto-mute window — 10 minutes with no audio activity. */
export const IDLE_MS = 600000;

let enabled = false;
let lastActivity = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

// ── Mic-feedback interlock (owner request 2026-07-26) ──────────────────────
// To avoid user-caused feedback (built-in mic hearing the built-in speaker),
// the SPEAKER output is auto-muted whenever the MIC is capturing — UNLESS the
// user has physically flipped the override in the one place the app needs both
// (the Harmonic Lab LIVE mode). `feedbackAllowed` is session-only, default
// false, and callers reset it when leaving that context.
let micActive = false;
let feedbackAllowed = false;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function clearIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

/** (Re)arm the 10-minute idle auto-mute. */
function armIdleTimer(): void {
  clearIdleTimer();
  idleTimer = setTimeout(() => {
    disableAudioOutput();
  }, IDLE_MS);
}

/** Non-hook read for imperative guards (the gate, output triggers). */
export function isAudioOutputEnabled(): boolean {
  return enabled;
}

/** Timestamp (ms) of the last audio activity — read by the AppState re-mute. */
export function getLastAudioActivity(): number {
  return lastActivity;
}

/**
 * Enable audio output. `now` defaults to Date.now() — fine here because this is
 * app RUNTIME (not a deterministic workflow); a caller may still pass a
 * timestamp. Records activity and arms the idle timer.
 */
export function enableAudioOutput(now: number = Date.now()): void {
  lastActivity = now;
  armIdleTimer();
  if (!enabled) {
    enabled = true;
    emit();
  }
}

/** Mute audio output and disarm the idle timer. */
export function disableAudioOutput(): void {
  clearIdleTimer();
  if (enabled) {
    enabled = false;
    emit();
  }
}

/**
 * Note that audio is actively being produced — refreshes lastActivity and
 * re-arms the idle timer. Call at every real output start (and periodically for
 * long/looping output). No-op while muted (nothing should be sounding then).
 */
export function noteAudioActivity(now: number = Date.now()): void {
  if (!enabled) return;
  lastActivity = now;
  armIdleTimer();
}

/** Subscribe to the enabled flag. Default false; resets false on every launch. */
export function useAudioOutputEnabled(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => enabled,
    () => enabled,
  );
}

// ── Mic-feedback interlock API ─────────────────────────────────────────────

/** Report whether the mic is capturing (set by the capture lifecycle). */
export function setMicActive(active: boolean): void {
  if (micActive !== active) {
    micActive = active;
    emit();
  }
}
export function isMicActive(): boolean {
  return micActive;
}

/** The physical override — allow the speaker to sound WHILE the mic is on
 *  (accepts feedback risk). Session-only; default false. */
export function setFeedbackAllowed(allowed: boolean): void {
  if (feedbackAllowed !== allowed) {
    feedbackAllowed = allowed;
    emit();
  }
}
export function isFeedbackAllowed(): boolean {
  return feedbackAllowed;
}

/** The interlock verdict: is the speaker currently muted for feedback safety?
 *  True ⇒ mic is capturing and the user has NOT overridden — no sound may leave
 *  the speaker. */
export function isSpeakerFeedbackMuted(): boolean {
  return micActive && !feedbackAllowed;
}

/** Subscribe to the interlock verdict (mic active && !override). */
export function useSpeakerFeedbackMuted(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    isSpeakerFeedbackMuted,
    isSpeakerFeedbackMuted,
  );
}

/** Subscribe to the override flag. */
export function useFeedbackAllowed(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => feedbackAllowed,
    () => feedbackAllowed,
  );
}
