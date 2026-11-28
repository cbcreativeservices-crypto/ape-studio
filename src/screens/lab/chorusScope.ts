/**
 * chorusScope — the Chorus lab's display as a STANDING (triggered) scope.
 * Pure, worklet-safe TypeScript (no React Native, no Skia), so the node tests
 * reach the very functions the UI thread runs
 * (test/traceTimeBaseOthers_20261122.test.ts).
 *
 * Owner, 2026-11-22: "Once a wave form has happend, it should not become some
 * other waveform later in time...." — and on 2026-11-23, asked whether the
 * chorus display should become a standing oscilloscope picture instead of a
 * scrolling one: "Yes, standing scope".
 *
 * Why a standing scope. The glass shows a few TRUE cycles of the source tone
 * (3 cycles of 440 Hz = 6.8 ms of real signal). Across 6.8 ms the LFO (0.1–
 * 3 Hz) is effectively constant, so at any instant the copy is the dry tone
 * delayed by ONE delay τ(now). The old picture also drifted the whole wave
 * slowly sideways, so a stretch the eye followed was re-shaped as the LFO
 * moved. Now nothing scrolls: the dry tone is triggered on its own rising zero
 * crossing and stands still, the copy is the dry tone τ(now) later — drawn
 * BEHIND it, to the right on the scope's left-to-right time axis — and OUT is
 * their true mix at this instant, so it swells and thins in place at the LFO's
 * rate. There is no drawn history to change.
 *
 * Time on the glass: t(x) = (x − x0)·msPerPx ms after the trigger, where the
 * whole glass width is SCOPE_CYCLES cycles of the source (scopeWindowMs).
 */

const TAU = 2 * Math.PI;

/** Cycles of the source tone across the whole glass. */
export const SCOPE_CYCLES = 3;
/** The engine's chorus swing at DEPTH 1 (Effects.hpp ModEffect, chorus:
 *  τ = centerMs + depth·6 ms·sin(LFO)). */
export const CHORUS_SWING_MS = 6;
/** The drawn copy may slide at most this fast, in radians of the tone per
 *  second: faster, the slide strobes at the display's frame rate and can seem
 *  to run backwards. The glass then says LFO SLOWED; the sound keeps the full
 *  rate. */
export const CHORUS_SLIP_CAP = 45;
/** Graticule: one division per millisecond. */
export const SCOPE_DIV_MS = 1;

/** The real signal time the whole glass spans, ms. */
export function scopeWindowMs(srcHz: number): number {
  'worklet';
  return (1000 * SCOPE_CYCLES) / srcHz;
}

/** The copy's delay at an LFO phase (radians), ms — the engine's law. */
export function chorusDelayMs(centerMs: number, depth: number, lfoPhase: number): number {
  'worklet';
  return centerMs + CHORUS_SWING_MS * depth * Math.sin(lfoPhase);
}

/** Radians of the tone per second the copy slides, per hertz of LFO, at the
 *  LFO's steepest point: 2π·f·(depth·6 ms)·2π. */
export function chorusSlipPerHz(srcHz: number, depth: number): number {
  return TAU * srcHz * (CHORUS_SWING_MS / 1000) * Math.max(depth, 0.01) * TAU;
}

/** The LFO rate the picture draws: the true RATE, capped so the slide stays
 *  readable (CHORUS_SLIP_CAP). */
export function chorusLfoVisHz(rateHz: number, depth: number, srcHz: number): number {
  return Math.min(rateHz, CHORUS_SLIP_CAP / chorusSlipPerHz(srcHz, depth));
}

/** True when the drawn LFO runs slower than RATE (the glass says so). */
export function chorusLfoSlowed(rateHz: number, depth: number, srcHz: number): boolean {
  return chorusLfoVisHz(rateHz, depth, srcHz) < rateHz - 1e-6;
}

/** The copy's fastest slide on the glass, ms of delay per second of watching:
 *  the swing (depth·6 ms) times the drawn LFO's angular rate. */
export function chorusPeakSlideMsPerS(rateHz: number, depth: number, srcHz: number): number {
  return CHORUS_SWING_MS * depth * TAU * chorusLfoVisHz(rateHz, depth, srcHz);
}

/** The triggered dry tone at tMs after the trigger (rising zero crossing). */
export function scopeDry(tMs: number, srcHz: number): number {
  'worklet';
  return Math.sin((TAU * srcHz * tMs) / 1000);
}

/** The copy: the dry tone delayMs earlier — what the delay line plays now. */
export function scopeCopy(tMs: number, srcHz: number, delayMs: number): number {
  'worklet';
  return Math.sin((TAU * srcHz * (tMs - delayMs)) / 1000);
}

/** OUT: the engine's mix of dry and wet at this instant (wet = the copy, plus
 *  `fb` × the copy's own copy; the chorus lab fixes fb at 0), scaled so a
 *  feedback build-up stays on the glass. */
export function scopeOut(tMs: number, srcHz: number, delayMs: number, mix: number, fb: number): number {
  'worklet';
  const dry = Math.sin((TAU * srcHz * tMs) / 1000);
  const wet =
    Math.sin((TAU * srcHz * (tMs - delayMs)) / 1000) + fb * Math.sin((TAU * srcHz * (tMs - 2 * delayMs)) / 1000);
  return ((1 - mix) * dry + mix * wet) / (1 + Math.abs(fb) * mix);
}
