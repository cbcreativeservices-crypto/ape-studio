/**
 * SYSTEM MEASUREMENT physics (F14; Lab 6 group 5, branch lab6-g5). Pure;
 * tested. Built once for the loudspeaker and sound-system lesson and any
 * later lesson that reads a dual-channel trace.
 *
 *   arrivalMs        the acoustic arrival after the drive: path ÷ c (the
 *                    calculator's speed of sound, twoMic.deltaTms)
 *   referenceDelay   the delay to set for a REFERENCE TAP: a tap BEFORE the
 *                    processor puts the processor's latency in the measured
 *                    path, so it is part of the delay; a tap AFTER it leaves
 *                    the latency out (F14 L26–L27). The latency is a DRAWING
 *                    DEFAULT (no source gives one): EXAMPLE_DSP_MS.
 *   pickArrival      what an automatic delay finder does — it takes the
 *                    STRONGEST arrival — against what you check by eye: the
 *                    FIRST arrival of the intended source (F14 L27: a finder
 *                    "can choose a strong arrival that is not the intended
 *                    source")
 *   windowResolutionHz   a time window T resolves frequency steps of about
 *                    1/T: a short window keeps the room out and loses the
 *                    lows (F14 L30; physics, CONFIRMED)
 *
 * Nothing here plays a sound or reads a device.
 */
import { deltaTms } from '../../../engine/physics/twoMic.ts';

/** A processor's latency for the drawings, in ms — a made-up example (no
 *  source gives a figure; real processors state their own). */
export const EXAMPLE_DSP_MS = 2.0;

export type Tap = 'pre' | 'post';

/** The acoustic arrival (ms) for a path of `mm` from the loudspeaker. */
export function arrivalMs(mm: number): number {
  return deltaTms(mm);
}

/** The delay to set (ms) for a reference tap, a path and a processor latency. */
export function referenceDelay(tap: Tap, pathMm: number, dspMs = EXAMPLE_DSP_MS): number {
  return arrivalMs(pathMm) + (tap === 'pre' ? dspMs : 0);
}

/** One arrival on the trace: its time after the reference (ms), its height
 *  relative to the direct sound (dB), and whether it is the intended source's
 *  direct sound. */
export type Arrival = { id: string; label: string; ms: number; db: number; direct: boolean };

/** What a delay finder locks to (the strongest) and what the eye picks (the
 *  first arrival of the intended source). `trap` = they differ. */
export function pickArrival(arrivals: readonly Arrival[]): { finder: Arrival; first: Arrival; trap: boolean } {
  if (!arrivals.length) throw new Error('no arrivals');
  const finder = arrivals.reduce((a, b) => (b.db > a.db ? b : a));
  const direct = arrivals.filter((a) => a.direct);
  const first = (direct.length ? direct : arrivals).reduce((a, b) => (b.ms < a.ms ? b : a));
  return { finder, first, trap: finder.id !== first.id };
}

/** Is a set delay on an arrival (within `tolMs`)? */
export function delayOn(setMs: number, a: Arrival, tolMs = 0.1): boolean {
  return Math.abs(setMs - a.ms) <= tolMs;
}

/** The frequency step a time window of `ms` resolves (Hz): about 1 / T. */
export function windowResolutionHz(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return Number.NaN;
  return 1000 / ms;
}

/** Which arrivals fall inside a window that opens at the direct sound
 *  (`startMs`) and lasts `ms`. */
export function inWindow(arrivals: readonly Arrival[], startMs: number, ms: number): Arrival[] {
  return arrivals.filter((a) => a.ms >= startMs - 1e-9 && a.ms <= startMs + ms + 1e-9);
}
