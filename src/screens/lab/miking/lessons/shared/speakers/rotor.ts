/**
 * THE ROTARY CABINET'S MOTION — pure, worklet-safe, tested
 * (speaker_leslie/GEOMETRY_PROPOSAL.md B3).
 *
 * SOURCED (HAM-122H p.7, the rotor control panel's "values when each control
 * is in the center position" — the defaults of an adjustable cabinet):
 *   horn       slow 44 rpm, fast 402 rpm, rise 1.8 s, fall 2.4 s
 *   low rotor  slow 42 rpm, fast 372 rpm, rise 7 s,   fall 5.5 s
 *
 * SIMPLIFICATIONS (simplifications register, speaker_leslie/SOURCES.md):
 *   • the speed changes LINEARLY with time: Hammond gives only the times, so
 *     the drawing ramps at a constant rate — slow → fast takes exactly the
 *     rise time, fast → slow exactly the fall time; a change that starts
 *     part-way through a ramp continues at the same rate;
 *   • STOP ramps to 0 at the fall rate (a drawing default: the cabinet's
 *     stop takes a held foot switch; its ramp is not published);
 *   • the DIRECTION of rotation is not documented: the drawing turns both
 *     rotors counter-clockwise seen from above — a drawing default, never
 *     taught as a fact.
 *
 * ONE CLOCK (charter §5): a display runs one model-time value `t` (seconds);
 * a speed change starts a new RAMP from the current angle and speed, so the
 * angle is continuous — nothing snaps.
 */

export type RotorId = 'horn' | 'drum';
export type RotorMode = 'stop' | 'slow' | 'fast';
export type RotorSpec = { id: RotorId; label: string; slowRpm: number; fastRpm: number; riseS: number; fallS: number };

export const ROTORS: Record<RotorId, RotorSpec> = {
  horn: { id: 'horn', label: 'horn rotor', slowRpm: 44, fastRpm: 402, riseS: 1.8, fallS: 2.4 },
  drum: { id: 'drum', label: 'low rotor', slowRpm: 42, fastRpm: 372, riseS: 7, fallS: 5.5 },
};

/** Which way the drawing turns the rotors: +1 = counter-clockwise from above
 *  (a DRAWING DEFAULT — the direction is not documented). */
export const DRAW_DIRECTION = 1;

export function targetRpm(r: RotorSpec, mode: RotorMode): number {
  'worklet';
  return mode === 'fast' ? r.fastRpm : mode === 'slow' ? r.slowRpm : 0;
}

/** rpm per second while speeding up / slowing down (constant: linear ramps). */
export function accelRate(r: RotorSpec): number {
  'worklet';
  return (r.fastRpm - r.slowRpm) / r.riseS;
}
export function decelRate(r: RotorSpec): number {
  'worklet';
  return (r.fastRpm - r.slowRpm) / r.fallS;
}

/** One ramp: from `rpm0` at model time `t0` (rotor angle `a0`, degrees)
 *  toward `rpm1`, at `rate` rpm/s, reached after `dur` seconds. */
export type Ramp = { t0: number; a0: number; rpm0: number; rpm1: number; rate: number; dur: number };

export function makeRamp(r: RotorSpec, t0: number, a0: number, rpm0: number, mode: RotorMode): Ramp {
  'worklet';
  const rpm1 = targetRpm(r, mode);
  const rate = rpm1 >= rpm0 ? accelRate(r) : decelRate(r);
  const dur = rate > 0 ? Math.abs(rpm1 - rpm0) / rate : 0;
  return { t0, a0, rpm0, rpm1, rate, dur };
}

/** The rotor's speed at model time t (rpm). */
export function rpmAt(m: Ramp, t: number): number {
  'worklet';
  const tau = Math.max(0, t - m.t0);
  if (tau >= m.dur) return m.rpm1;
  const s = m.rpm1 >= m.rpm0 ? 1 : -1;
  return m.rpm0 + s * m.rate * tau;
}

/** The rotor's angle at model time t (degrees, unwrapped; DRAW_DIRECTION
 *  applied): the integral of the speed — 1 rpm = 6 degrees per second. */
export function angleAt(m: Ramp, t: number): number {
  'worklet';
  const tau = Math.max(0, t - m.t0);
  const s = m.rpm1 >= m.rpm0 ? 1 : -1;
  const ramp = Math.min(tau, m.dur);
  // ∫ rpm dt over the ramp, then at the steady speed (rev/min × s / 60 = rev).
  const revRamp = (m.rpm0 * ramp + 0.5 * s * m.rate * ramp * ramp) / 60;
  const revSteady = (m.rpm1 * Math.max(0, tau - m.dur)) / 60;
  return m.a0 + DRAW_DIRECTION * 360 * (revRamp + revSteady);
}

/** The speed change a learner asks for, from wherever the rotor is now. */
export function retarget(r: RotorSpec, m: Ramp, t: number, mode: RotorMode): Ramp {
  'worklet';
  return makeRamp(r, t, angleAt(m, t), rpmAt(m, t), mode);
}

/** A rotor at rest, angle `a0`. */
export function atRest(r: RotorSpec, a0 = 0): Ramp {
  'worklet';
  return makeRamp(r, 0, a0, 0, 'stop');
}

/** Has the ramp reached its target by model time t? */
export function settled(m: Ramp, t: number): boolean {
  'worklet';
  return t - m.t0 >= m.dur - 1e-9;
}

/** Wrap an angle to [0, 360). */
export function wrap360(deg: number): number {
  'worklet';
  const a = deg % 360;
  return a < 0 ? a + 360 : a;
}

/** Revolutions per second, for a readout ("6.7 turns a second"). */
export function revPerSec(rpm: number): number {
  'worklet';
  return rpm / 60;
}

/** The DISPLAY time bases the learner may pick: the true speeds are always
 *  printed; a slowed drawing says so ("SLOWED ×4", charter §5). */
export const TIME_BASES = [
  { id: 'x4', label: 'SLOWED ×4', scale: 0.25 },
  { id: 'x10', label: 'SLOWED ×10', scale: 0.1 },
  { id: 'x1', label: 'REAL SPEED', scale: 1 },
] as const;
export type TimeBaseId = (typeof TIME_BASES)[number]['id'];

/** How long (wall-clock seconds) one RUN lasts before the display pauses
 *  itself — a user-started lesson display, never an endless loop. */
export const RUN_WALL_S = 40;
