/**
 * paceStore — device-local settings for the study "pace timer" practice aid,
 * one record per study method (Fill-in-Blank, Matching, Scenarios, Flashcards,
 * Ear Training).
 *
 * The RECORDS (best/avg/sessions) live in the backend (see paceRecords.ts).
 * ONLY the per-method settings — is the timer on, which pace, which mode — are
 * device-local, persisted under `ape:pace:<method>` in AsyncStorage.
 *
 * External-store pattern (module map + listeners + useSyncExternalStore), the
 * same shape as lib/footnote.ts, plus lazy AsyncStorage hydration on first use.
 *
 * The timer NEVER blocks study: when disabled the store returns a shared
 * default object (zero overhead, no bar rendered).
 */
import { useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** The study methods that carry a pace timer. */
export type PaceMethodKey =
  | 'fill_in_blank'
  | 'matching'
  | 'scenarios'
  | 'flashcards'
  | 'ear_training';

/**
 * A pace preset. Pace = a MULTIPLE of quiz time-per-question (20s/q).
 * The "faster" presets shrink the budget; the plain multiples grow it.
 * STOPWATCH has no target — it counts up.
 */
export type PacePreset =
  | 'x2_faster' // 2× faster  → 10s/q
  | 'x1_5_faster' // 1.5× faster → ~13s/q (20 / 1.5)
  | 'quiz' // 1× quiz pace → 20s/q
  | 'x1_5' // 1.5× the time → 30s/q
  | 'x2' // 2× the time → 40s/q
  | 'x3' // 3× the time → 60s/q
  | 'x4' // 4× the time → 80s/q
  | 'stopwatch'; // no target, count up

/** Seconds-per-question for each preset (null = stopwatch, no target). */
export const SEC_PER_Q: Record<PacePreset, number | null> = {
  x2_faster: 10,
  x1_5_faster: 20 / 1.5, // ~13.3
  quiz: 20,
  x1_5: 30,
  x2: 40,
  x3: 60,
  x4: 80,
  stopwatch: null,
};

/** Ordered preset list for the settings radio (fastest → slowest → stopwatch). */
export const PACE_PRESETS: ReadonlyArray<{ key: PacePreset; label: string; hint: string }> = [
  { key: 'x2_faster', label: '2× faster', hint: '10s / question' },
  { key: 'x1_5_faster', label: '1.5× faster', hint: '~13s / question' },
  { key: 'quiz', label: '1× — quiz pace', hint: '20s / question' },
  { key: 'x1_5', label: '1.5× time', hint: '30s / question' },
  { key: 'x2', label: '2× time', hint: '40s / question' },
  { key: 'x3', label: '3× time', hint: '60s / question' },
  { key: 'x4', label: '4× time', hint: '80s / question' },
  { key: 'stopwatch', label: 'Stopwatch', hint: 'no target — count up, track your best' },
];

export type PaceSettings = { enabled: boolean; preset: PacePreset };

/** Shared default — stable reference so getSnapshot stays referentially quiet. */
const DEFAULTS: PaceSettings = { enabled: false, preset: 'quiz' };

const cache = new Map<PaceMethodKey, PaceSettings>();
const listeners = new Map<PaceMethodKey, Set<() => void>>();
const hydrated = new Set<PaceMethodKey>();

const storageKey = (m: PaceMethodKey) => `ape:pace:${m}`;

function getSettings(m: PaceMethodKey): PaceSettings {
  return cache.get(m) ?? DEFAULTS;
}

function emit(m: PaceMethodKey): void {
  listeners.get(m)?.forEach((l) => l());
}

function writeSettings(m: PaceMethodKey, next: PaceSettings): void {
  cache.set(m, next);
  emit(m);
  void AsyncStorage.setItem(storageKey(m), JSON.stringify(next)).catch(() => {});
}

/** Lazily load persisted settings the first time a method is observed. */
async function hydrate(m: PaceMethodKey): Promise<void> {
  if (hydrated.has(m)) return;
  hydrated.add(m);
  try {
    const raw = await AsyncStorage.getItem(storageKey(m));
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<PaceSettings>;
    const preset: PacePreset =
      typeof parsed.preset === 'string' && parsed.preset in SEC_PER_Q
        ? (parsed.preset as PacePreset)
        : DEFAULTS.preset;
    const next: PaceSettings = { enabled: !!parsed.enabled, preset };
    // Only publish if it actually differs from the default.
    if (next.enabled !== DEFAULTS.enabled || next.preset !== DEFAULTS.preset) {
      cache.set(m, next);
      emit(m);
    }
  } catch {
    /* corrupt value — fall back to defaults */
  }
}

/** Subscribe to a method's pace settings; returns settings + setters. */
export function usePaceSettings(method: PaceMethodKey): {
  settings: PaceSettings;
  setEnabled: (enabled: boolean) => void;
  setPreset: (preset: PacePreset) => void;
} {
  const settings = useSyncExternalStore(
    (cb) => {
      let set = listeners.get(method);
      if (!set) {
        set = new Set();
        listeners.set(method, set);
      }
      set.add(cb);
      void hydrate(method);
      return () => {
        set?.delete(cb);
      };
    },
    () => getSettings(method),
    () => getSettings(method),
  );

  const setEnabled = useCallback(
    (enabled: boolean) => writeSettings(method, { ...getSettings(method), enabled }),
    [method],
  );
  const setPreset = useCallback(
    (preset: PacePreset) => writeSettings(method, { ...getSettings(method), preset }),
    [method],
  );

  return { settings, setEnabled, setPreset };
}

/**
 * RUNNING state — is the timer actively COUNTING right now.
 *
 * This is intentionally separate from `enabled` (above):
 *   • `enabled`  = the timer is ADDED/present (the readout is shown at all).
 *   • `running`  = the readout is visible AND the clock is ticking.
 *
 * A timer can be enabled-but-paused: the readout stays on screen while the clock
 * holds. Running is a session-only concern (no persistence), so it uses the same
 * module-var + listeners + hook shape as the settings store above, minus the
 * AsyncStorage hydration. Default = true (a freshly-added timer starts running).
 */
const runningCache = new Map<PaceMethodKey, boolean>();
const runningListeners = new Map<PaceMethodKey, Set<() => void>>();

function getRunning(m: PaceMethodKey): boolean {
  return runningCache.get(m) ?? true;
}

/** Imperatively set a method's running state (also drives useRunning subscribers). */
export function setRunning(m: PaceMethodKey, running: boolean): void {
  runningCache.set(m, running);
  runningListeners.get(m)?.forEach((l) => l());
}

/** Subscribe to a method's running (ticking) state. Default true. */
export function useRunning(method: PaceMethodKey): boolean {
  return useSyncExternalStore(
    (cb) => {
      let set = runningListeners.get(method);
      if (!set) {
        set = new Set();
        runningListeners.set(method, set);
      }
      set.add(cb);
      return () => {
        set?.delete(cb);
      };
    },
    () => getRunning(method),
    () => getRunning(method),
  );
}

/**
 * BRAIN OUTPUTS — a per-method session tally of INDIVIDUAL correct-answer
 * presses (user request 2026-07-25). Each correct press counts as one "brain
 * output"; in Matching each correct PAIR match increments once (not the whole
 * board). Drives the readout's BrainoutputsPM metric (outputs per minute).
 *
 * Session-only (no persistence), same module-var + listeners + hook shape as
 * the running store above. Default = 0.
 */
const brainCache = new Map<PaceMethodKey, number>();
const brainListeners = new Map<PaceMethodKey, Set<() => void>>();

function getBrainOutputs(m: PaceMethodKey): number {
  return brainCache.get(m) ?? 0;
}

function emitBrain(m: PaceMethodKey): void {
  brainListeners.get(m)?.forEach((l) => l());
}

/** Increment a method's correct-press tally by one (per correct answer / pair). */
export function incBrainOutput(m: PaceMethodKey): void {
  brainCache.set(m, getBrainOutputs(m) + 1);
  emitBrain(m);
}

/** Zero a method's tally — call wherever the pace session's elapsed is reset. */
export function resetBrainOutput(m: PaceMethodKey): void {
  brainCache.set(m, 0);
  emitBrain(m);
}

/** Subscribe to a method's correct-press tally. Default 0. */
export function useBrainOutputs(method: PaceMethodKey): number {
  return useSyncExternalStore(
    (cb) => {
      let set = brainListeners.get(method);
      if (!set) {
        set = new Set();
        brainListeners.set(method, set);
      }
      set.add(cb);
      return () => {
        set?.delete(cb);
      };
    },
    () => getBrainOutputs(method),
    () => getBrainOutputs(method),
  );
}

/**
 * AUTO TRACK — a per-method SILENT background-tracking mode (owner request
 * 2026-07-25). When on, the readout collapses to a minimal "AUTO ●" chip: no
 * countdown, no ahead/behind, no pace pressure. The elapsed clock + brain-output
 * counter keep running underneath; turning it OFF logs the session to records.
 *
 * Session-only (no persistence), same module-var + listeners + hook shape as the
 * running store above. Default = false.
 */
const autoTrackCache = new Map<PaceMethodKey, boolean>();
const autoTrackListeners = new Map<PaceMethodKey, Set<() => void>>();

function getAutoTrack(m: PaceMethodKey): boolean {
  return autoTrackCache.get(m) ?? false;
}

/** Imperatively set a method's auto-track state (drives useAutoTrack subscribers). */
export function setAutoTrack(m: PaceMethodKey, on: boolean): void {
  autoTrackCache.set(m, on);
  autoTrackListeners.get(m)?.forEach((l) => l());
}

/** Subscribe to a method's auto-track (silent background) state. Default false. */
export function useAutoTrack(method: PaceMethodKey): boolean {
  return useSyncExternalStore(
    (cb) => {
      let set = autoTrackListeners.get(method);
      if (!set) {
        set = new Set();
        autoTrackListeners.set(method, set);
      }
      set.add(cb);
      return () => {
        set?.delete(cb);
      };
    },
    () => getAutoTrack(method),
    () => getAutoTrack(method),
  );
}

/**
 * Reset ALL in-memory pace caches (account wipe / user switch —
 * clearLocalAccountData). Clears the persisted per-method SETTINGS cache +
 * hydrated flags (so the next read re-hydrates from the cleared storage) and the
 * session-only running / brain-output / auto-track caches, emitting to each
 * affected method so live hooks re-render at their defaults. Safe with no
 * subscribers.
 */
export function resetLocal(): void {
  const methods = new Set<PaceMethodKey>([
    ...cache.keys(),
    ...runningCache.keys(),
    ...brainCache.keys(),
    ...autoTrackCache.keys(),
  ]);
  cache.clear();
  hydrated.clear();
  runningCache.clear();
  brainCache.clear();
  autoTrackCache.clear();
  for (const m of methods) {
    emit(m); // settings subscribers
    runningListeners.get(m)?.forEach((l) => l());
    emitBrain(m);
    autoTrackListeners.get(m)?.forEach((l) => l());
  }
}

/**
 * Quantize an offset (in seconds) to the nearest whole STEP (default 5s), so the
 * readout's signed offset — and the marker driven from it — moves in discrete
 * 5-second steps (up as the learner gets ahead, down as they fall behind)
 * instead of sliding continuously. Sign is preserved by the round.
 */
export function quantizeOffset(seconds: number, step = 5): number {
  return Math.round(seconds / step) * step;
}

export type PaceStatus = 'ahead' | 'onpace' | 'behind' | 'overtime';

export type PaceMathResult = {
  status: PaceStatus;
  /** expected − elapsed, in seconds. POSITIVE = ahead/faster, NEGATIVE = behind. */
  offsetSeconds: number;
  /** −1 (fully behind) .. +1 (fully ahead), clamped, for the mini scale marker. */
  markerPos: number;
  /** total × secPerQ — the full time budget for the session, in seconds. */
  totalBudget: number;
};

/**
 * Countdown/paced math. At answered K of M with elapsed T seconds and a target
 * of secPerQ seconds/question:
 *   offsetSeconds = K × secPerQ − T  (banked time: + = genuinely ahead).
 *
 * GRACE (user 2026-07-25): the question currently in progress gets its FULL lap
 * before it can count against you — the timer does not begin "falling behind"
 * until the first (and each) user-set pace interval expires. So the deadline for
 * the question being worked on is (K + 1) × secPerQ, and BEHIND only triggers
 * once the elapsed time blows past that deadline.
 *
 * Status: AHEAD if you've banked > 5s, BEHIND only once the current lap's
 * deadline is passed by > 5s, else ON PACE; if T passes the total budget we
 * surface a friendly OVERTIME state (never a hard stop).
 *
 * Marker: centered through the current lap (on-time), moves RIGHT once time is
 * banked (answered early), moves LEFT only after the lap deadline is blown.
 */
export function paceMath({
  secPerQ,
  answered,
  total,
  elapsed,
}: {
  secPerQ: number;
  answered: number;
  total: number;
  elapsed: number;
}): PaceMathResult {
  const totalBudget = total * secPerQ;
  const expected = answered * secPerQ;
  const offsetSeconds = expected - elapsed; // banked time: + = genuinely ahead
  // Deadline of the question in progress — its lap is grace, not a penalty.
  const graceRemaining = (answered + 1) * secPerQ - elapsed;

  // Marker: right when time is banked, left only after the lap deadline blows,
  // centered (0) while still inside the current lap.
  let markerOffset: number;
  if (offsetSeconds > 0) markerOffset = offsetSeconds; // answered early → right
  else if (graceRemaining < 0) markerOffset = graceRemaining; // lap blown → left
  else markerOffset = 0; // still inside the current lap → center
  const markerPos = Math.max(-1, Math.min(1, markerOffset / (secPerQ * 2)));

  let status: PaceStatus;
  if (elapsed > totalBudget && totalBudget > 0) status = 'overtime';
  else if (offsetSeconds > 5) status = 'ahead';
  else if (graceRemaining < -5) status = 'behind';
  else status = 'onpace';

  return { status, offsetSeconds, markerPos, totalBudget };
}

/** m:ss for a non-negative duration. */
export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

/** Signed m:ss (uses a real minus glyph so it reads cleanly). */
export function fmtSigned(seconds: number): string {
  const sign = seconds >= 0 ? '+' : '−';
  return `${sign}${fmtClock(Math.abs(seconds))}`;
}
