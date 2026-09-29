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
 * light IN TUNE); the average and the lock reset.
 */
import { useEffect, useRef, useState } from 'react';
import { averageCents, INITIAL_LOCK, stepLock, type LockState } from './centerLock';

export function useSteadyTuner(liveCents: number | null): { cents: number | null; inTune: boolean } {
  const avgRef = useRef<number | null>(null);
  const lockRef = useRef<LockState>(INITIAL_LOCK);
  const atRef = useRef(0);
  const [steady, setSteady] = useState<{ cents: number | null; inTune: boolean }>({ cents: null, inTune: false });
  useEffect(() => {
    const now = Date.now();
    const dt = atRef.current ? now - atRef.current : 16.7;
    atRef.current = now;
    const avg = averageCents(avgRef.current, liveCents, dt);
    avgRef.current = avg;
    const l = stepLock(lockRef.current, avg, now);
    lockRef.current = { inZoneSince: l.inZoneSince, confirmed: l.confirmed, outSince: l.outSince };
    setSteady((prev) => (prev.cents === avg && prev.inTune === l.confirmed ? prev : { cents: avg, inTune: l.confirmed }));
  }, [liveCents]);
  return steady;
}
