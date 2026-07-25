/**
 * paceStore — device-local settings for the study "pace timer" practice aid,
 * one record per study method (Fill-in-Blank, Matching, Scenarios).
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

/** The three study methods that carry a pace timer. */
export type PaceMethodKey = 'fill_in_blank' | 'matching' | 'scenarios';

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
 *   expected = K × secPerQ ; offset = expected − T (+ = ahead, − = behind).
 * Status: ahead if offset > +5s, behind if offset < −5s, else on-pace; but if
 * T has passed the total budget we surface a friendly OVERTIME state instead
 * (never a hard stop). Marker = clamp(offset / (secPerQ×2), −1, +1).
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
  const offsetSeconds = expected - elapsed;
  const markerPos = Math.max(-1, Math.min(1, offsetSeconds / (secPerQ * 2)));

  let status: PaceStatus;
  if (elapsed > totalBudget && totalBudget > 0) status = 'overtime';
  else if (offsetSeconds > 5) status = 'ahead';
  else if (offsetSeconds < -5) status = 'behind';
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
