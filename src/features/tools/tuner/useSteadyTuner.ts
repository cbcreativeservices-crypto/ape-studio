/**
 * useSteadyTuner — the averaged reading + held IN TUNE state for the VU tuner
 * (inline in the Frequency Counter and its full-screen overlay), so both show
 * the same steadied number and agree on IN TUNE.
 *
 * Tester feedback 2026-09-28: "too fast and accurate — it never wants to say a
 * note is in tune; it shimmers in and out." Both surfaces used the raw
 * per-frame cents and lit IN TUNE only while |cents| < 1 on every frame. Now:
 * averaged cents (averageCents), and the CenterLock state machine — ±2 ¢ held
 * CONFIRM_MS to enter, released only after a drift past ±RELEASE_CENTS lasting
 * RELEASE_MS (see centerLock.ts).
 *
 * Pass `null` whenever there is no LIVE reading (held/stale values must never
 * light IN TUNE); the filter, the window and the lock reset.
 *
 * Tuner phase 1 (owner 2026-10-23, tuner research report): the same separate
 * controls as the Advanced Tuner — the needle reads ONE fast filter
 * (PITCH_TAU_MS), IN TUNE is judged on the last CONFIRM_WINDOW_MS (mean in
 * the zone AND spread ≤ SPREAD_MAX_CENTS, so vibrato is never called in tune),
 * and `digits` is the printed number, refreshed every DIGITS_EVERY_MS.
 */
import { useEffect, useRef, useState } from 'react';
import {
  confirmStats,
  filterCents,
  INITIAL_LOCK,
  pushConfirm,
  SPREAD_MAX_CENTS,
  stepDigits,
  stepLock,
  type ConfirmSample,
  type DigitsState,
  type LockState,
} from './centerLock';

type Steady = { cents: number | null; inTune: boolean; digits: number | null };

export function useSteadyTuner(liveCents: number | null): Steady {
  const avgRef = useRef<number | null>(null);
  const winRef = useRef<ConfirmSample[]>([]);
  const digitsRef = useRef<DigitsState>({ value: null, at: 0 });
  const lockRef = useRef<LockState>(INITIAL_LOCK);
  const atRef = useRef(0);
  const [steady, setSteady] = useState<Steady>({ cents: null, inTune: false, digits: null });
  useEffect(() => {
    const now = Date.now();
    const dt = atRef.current ? now - atRef.current : 16.7;
    atRef.current = now;
    const avg = filterCents(avgRef.current, liveCents, dt);
    avgRef.current = avg;
    winRef.current = pushConfirm(winRef.current, liveCents, now);
    const st = confirmStats(winRef.current);
    const l = stepLock(lockRef.current, st ? st.mean : null, now, st != null && st.spread <= SPREAD_MAX_CENTS);
    lockRef.current = { inZoneSince: l.inZoneSince, confirmed: l.confirmed, outSince: l.outSince };
    digitsRef.current = stepDigits(digitsRef.current, avg, now);
    const digits = digitsRef.current.value;
    setSteady((prev) =>
      prev.cents === avg && prev.inTune === l.confirmed && prev.digits === digits ? prev : { cents: avg, inTune: l.confirmed, digits },
    );
  }, [liveCents]);
  return steady;
}
