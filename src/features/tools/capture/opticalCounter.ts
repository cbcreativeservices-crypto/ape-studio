/**
 * useOpticalCounter — drives the ape-optical native module and estimates a
 * flicker frequency from the mean-frame-luma series by autocorrelation
 * (owner 2026-07-29). The frequency math lives HERE (not native) so the
 * frame-rate ceiling and honesty framing sit next to the UI.
 *
 * Physics: the camera samples at its frame rate, so the highest resolvable
 * flicker is fps/2. We report `nyquistHz` and flag readings near it as
 * approximate; results above it alias and are refused. Suitable for slow
 * flashing indicators / strobes / marked rotating machinery — never audio-rate.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Optical from '../../../../modules/ape-optical';

const WINDOW_S = 3.5; // rolling analysis window
const POLL_MS = 100; // pull cadence (native buffers frames; we dedupe by seq)

export type OpticalState =
  | 'absent' // native module not in this build → needs the new dev build
  | 'idle'
  | 'starting'
  | 'running'
  | 'denied'
  | 'error';

export type OpticalReading = {
  /** Estimated flicker frequency (Hz), or null when no stable period found. */
  freq: number | null;
  /** 0..1 confidence from the autocorrelation peak height. */
  confidence: number;
  /** Measured camera frame rate. */
  fps: number;
  /** fps/2 — the highest frequency this camera can resolve. */
  nyquistHz: number;
  /** true when freq is close enough to Nyquist that it's only approximate. */
  nearLimit: boolean;
  /** Modulation depth 0..1 (how much the brightness actually varies). */
  depth: number;
};

/** Autocorrelation-based period estimate on a uniformly-timed luma series. */
function estimate(ts: number[], luma: number[]): { freq: number | null; conf: number; depth: number } {
  const n = luma.length;
  if (n < 16) return { freq: null, conf: 0, depth: 0 };
  const meanDt = (ts[n - 1] - ts[0]) / (n - 1);
  if (meanDt <= 0) return { freq: null, conf: 0, depth: 0 };
  const fps = 1000 / meanDt;
  // Remove DC + measure modulation depth.
  let mean = 0;
  for (let i = 0; i < n; i++) mean += luma[i];
  mean /= n;
  let mn = 1;
  let mx = 0;
  const x = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    x[i] = luma[i] - mean;
    if (luma[i] < mn) mn = luma[i];
    if (luma[i] > mx) mx = luma[i];
  }
  const depth = mx - mn;
  if (depth < 0.01) return { freq: null, conf: 0, depth }; // basically steady
  let energy = 0;
  for (let i = 0; i < n; i++) energy += x[i] * x[i];
  if (energy <= 0) return { freq: null, conf: 0, depth };
  // Search lags from ~2 frames up to half the window; find the strongest peak.
  const minLag = 2;
  const maxLag = Math.floor(n / 2);
  let bestLag = -1;
  let bestVal = 0;
  let prev = 0;
  let rising = false;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) s += x[i] * x[i + lag];
    const norm = s / energy;
    // Track the first prominent local maximum (skip the DC shoulder near lag 0).
    if (norm > prev) rising = true;
    if (rising && norm < prev && prev > bestVal && prev > 0.3) {
      bestVal = prev;
      bestLag = lag - 1;
    }
    prev = norm;
  }
  if (bestLag < minLag) return { freq: null, conf: 0, depth };
  const periodMs = bestLag * meanDt;
  const freq = 1000 / periodMs;
  // Never report above Nyquist (aliased).
  if (freq > fps / 2) return { freq: null, conf: 0, depth };
  return { freq, conf: Math.max(0, Math.min(1, bestVal)), depth };
}

export function useOpticalCounter(active: boolean): { state: OpticalState; reading: OpticalReading | null; lastError: string } {
  const [state, setState] = useState<OpticalState>(() => (Optical.isAvailable() ? 'idle' : 'absent'));
  const [reading, setReading] = useState<OpticalReading | null>(null);
  const [lastError, setLastError] = useState('');
  const seqRef = useRef(0);
  const tsRef = useRef<number[]>([]);
  const lumaRef = useRef<number[]>([]);

  const reset = useCallback(() => {
    seqRef.current = 0;
    tsRef.current = [];
    lumaRef.current = [];
    setReading(null);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (!Optical.isAvailable()) {
      setState('absent');
      return;
    }
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    reset();
    setState('starting');
    Optical.start()
      .then(() => {
        if (cancelled) return;
        setState('running');
        poll = setInterval(() => {
          const batch = Optical.getSamples(seqRef.current);
          if (!batch) return;
          if (batch.lastError) setLastError(batch.lastError);
          if (batch.seq > seqRef.current && batch.ts.length) {
            seqRef.current = batch.seq;
            tsRef.current.push(...batch.ts);
            lumaRef.current.push(...batch.luma);
            // Trim to the rolling window.
            const cutoff = tsRef.current[tsRef.current.length - 1] - WINDOW_S * 1000;
            let drop = 0;
            while (drop < tsRef.current.length && tsRef.current[drop] < cutoff) drop++;
            if (drop > 0) {
              tsRef.current.splice(0, drop);
              lumaRef.current.splice(0, drop);
            }
          }
          const est = estimate(tsRef.current, lumaRef.current);
          const fps = batch.fps || 30;
          const nyq = fps / 2;
          setReading({
            freq: est.freq,
            confidence: est.conf,
            fps,
            nyquistHz: nyq,
            nearLimit: est.freq != null && est.freq > nyq * 0.8,
            depth: est.depth,
          });
        }, POLL_MS);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setLastError(msg);
        setState(/denied|permission/i.test(msg) ? 'denied' : 'error');
      });
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      void Optical.stop();
    };
  }, [active, reset]);

  return { state, reading, lastError };
}
