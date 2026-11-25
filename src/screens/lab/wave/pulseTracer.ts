/**
 * Wave Physics Lab — the PRESSURE pulse tracer's maths, pure so node tests can
 * import it (vizWave.tsx imports Skia, which node cannot load). Moved here
 * unchanged from vizWave.tsx on 2026-11-25, plus one new term: the SOURCE
 * DELAY (owner 2026-11-25, Delay Alignment: "changing the delay time does not
 * change the visual circles representing the timing of the waveform arriving
 * at the listener").
 *
 * How the pulse moves: every PULSE_MS one shared wavefront clock `t` runs 0→1,
 * and the front has travelled `pulseFront(t, paceLen)` canvas px. Every source
 * radiates at the same on-screen speed, so a source that waits `delayMs`
 * before it fires is simply `pulseDelayPx` behind that front: its ball leaves
 * the source, and its ring starts growing, only once the front has covered the
 * distance sound travels in `delayMs`. With every delay 0 the new term is
 * exactly 0 and every position is the old one, bit for bit.
 *
 * Worklet-safe: every function a frame calls takes plain numbers/arrays.
 */

// 3 s between pulses — more time to watch the decay — then stretched so every
// ball travels 13 % SLOWER (owner 2026-09-26: "the balls travel too fast").
// Speed ∝ 1 / PULSE_MS; the fade points are fractions of the cycle, so the
// whole choreography stretches together (≈3.45 s).
export const PULSE_MS = Math.round(3000 / 0.87);
export const PULSE_ARRIVE = 0.9; // the pacing span is covered by 90% of the cycle
/** Room diagonals the wavefront covers per pulse cycle. The pulse speed is
 *  keyed to ROOM GEOMETRY, never to the surviving ray set, so the surface
 *  material can't change how fast the pressure rays travel (owner 2026-08-07).
 *  Sized to let the usual multi-bounce diffuse paths land inside the cycle. */
export const PACE_SPAN = 3.5;
// Everything fades to nothing by this fraction of the cycle (2.98 s of 3 s),
// leaving a clean beat before the next pulse — catches even long free-bounce
// nodes that would otherwise still be travelling at the reset.
export const PULSE_FADE_END = 2.98 / 3;
export const PULSE_FADE_START = 0.9;

/** `segGain` = amplitude gain while travelling segment i (1.0 leaving the
 *  source, × √(1−α) after each bounce) — the MATERIAL loss. `free` traces are
 *  the extra diffuse reflections (multi-bounce paths that reach the listener);
 *  the rest are the line-traced image-source reflections. Every trace ENDS at
 *  the listener. */
export type TraceRay = {
  pts: number[];
  cum: number[];
  len: number;
  order: number;
  segGain: number[];
  /** How far (canvas px) this ray's SOURCE fires behind the shared wavefront:
   *  its delay × the speed of sound × px per metre (`pulseDelayPx`). 0 = fires
   *  at t = 0, as every source did before 2026-11-25. */
  delayPx: number;
  free?: boolean;
  /** A fragment of a pulse split by a diffuser: it rides one ray of the
   *  scatter fan and VANISHES at the ray's end (it does not reach the
   *  listener, so it must not park anywhere). */
  split?: boolean;
};

// A node's loudness has TWO parts (owner 2026-08-02):
//  1. DISTANCE — spherical spreading (1/r) referenced to the DIRECT path
//     length: a node is red/full at the direct distance and cools smoothly
//     red→orange→yellow→green→blue the farther it travels. So the shortest
//     path (the DIRECT sound) arrives red, and every LONGER reflection arrives
//     cooler, passing through all the in-between colours. DIST_POW < 1 softens
//     the 1/r curve so the mid colours get more of the room (lower = gentler,
//     slower red→blue transition).
//  2. MATERIAL — the accumulated reflection gain √(1−α) (segGain) STEPS the
//     loudness down at each bounce: glass (α≈0) barely, fiberglass (α≈0.98) a
//     lot, so an absorptive bounce drops the colour cooler right at the wall.
// The two multiply: distance gives the gradient, material gives the per-bounce
// step. Only the direct (shortest, unbounced) reaches the listener red.
export const DIST_POW = 0.58;
// Stretch the distance/time colour decay so nodes hold their warmer colours
// ~37% longer before cooling (owner 2026-08-02) — scales the 1/r reference
// length, so any given colour is reached at 37% more travel (= time).
export const NODE_TIME_STRETCH = 1.37;

export type NodeState = { x: number; y: number; amp: number; r: number };

/** The wavefront pacing length (px covered by PULSE_ARRIVE of the cycle). */
export function pulsePaceLen(wM: number, hM: number, pxPerM: number): number {
  return Math.max(1, PACE_SPAN * Math.hypot(wM * pxPerM, hM * pxPerM));
}

/** Distance (px) the shared wavefront has covered at clock `t` (0..1). */
export function pulseFront(t: number, paceLen: number): number {
  'worklet';
  return t * (paceLen / PULSE_ARRIVE);
}

/** How far behind the shared front a source fires, in canvas px: the distance
 *  sound covers in `delayMs` at `c` m/s, on this canvas. Exactly 0 for 0 ms. */
export function pulseDelayPx(delayMs: number, c: number, pxPerM: number): number {
  return (delayMs / 1000) * c * pxPerM;
}

/** Radius of a source's pulse ring at wavefront distance `front` (px): it
 *  starts growing only when that source fires. ≤ 0 = not fired yet. */
export function pulseRingRadius(front: number, delayPx: number): number {
  'worklet';
  return front - delayPx;
}

/** Clock value (0..1 of the cycle) at which a ball on a path of `lenPx` from a
 *  source delayed by `delayPx` lands at the path's end. */
export function pulseArrivalClock(lenPx: number, delayPx: number, paceLen: number): number {
  return ((lenPx + delayPx) * PULSE_ARRIVE) / paceLen;
}

/** Global loudness envelope: full until PULSE_FADE_START, then eased to 0 by
 *  PULSE_FADE_END so every node is full blue (lowest level) at 2.98 s. */
export function pulseTimeEnv(u: number): number {
  'worklet';
  if (u < PULSE_FADE_START) return 1;
  return Math.max(0, 1 - (u - PULSE_FADE_START) / (PULSE_FADE_END - PULSE_FADE_START));
}

/** Position + loudness (amp 0..1) + radius of a ray's node at wavefront
 *  distance `front` — travels source→listener, then holds at the listener.
 *  A ray whose source has not fired yet (front < delayPx) is not drawn
 *  (r 0, resting at the source). */
export function nodeState(ray: TraceRay, front: number, minLen: number, timeEnv: number): NodeState {
  'worklet';
  // The distance THIS ball has travelled: the shared front less its source's
  // delay. Colour and size follow it, so a late ball still leaves full red.
  const dist = front - ray.delayPx;
  if (dist < 0) return { x: ray.pts[0], y: ray.pts[1], amp: 0, r: 0 };
  if (ray.split && dist >= ray.len) return { x: 0, y: 0, amp: 0, r: 0 };
  const travelled = Math.min(dist, ray.len); // stop at the listener
  let i = 1;
  while (i < ray.cum.length - 1 && travelled > ray.cum[i]) i++;
  const d0 = ray.cum[i - 1];
  const seg = ray.cum[i] - d0 || 1;
  const f = (travelled - d0) / seg;
  const x = ray.pts[(i - 1) * 2] + (ray.pts[i * 2] - ray.pts[(i - 1) * 2]) * f;
  const y = ray.pts[(i - 1) * 2 + 1] + (ray.pts[i * 2 + 1] - ray.pts[(i - 1) * 2 + 1]) * f;
  // Every sound LEAVES THE SOURCE FULL RED in EVERY room — before any bounce
  // the gain is 1, so the colour at the source is identical regardless of wall
  // treatment. It then cools with DISTANCE travelled and STEPS cooler at each
  // bounce by that wall's √(1−α) (glass barely, fiberglass a lot). So the rooms
  // differ only AFTER the walls act: a close/reflective path arrives redder, a
  // far/absorptive one arrives bluer. `timeEnv` decays everything to blue by
  // the end of the pulse (all full blue at PULSE_FADE_END).
  const gain = ray.segGain[i - 1] ?? 1; // material left on the CURRENT segment
  const ref = minLen * NODE_TIME_STRETCH;
  const level = gain * Math.pow(ref / Math.max(ref, travelled), DIST_POW);
  const amp = Math.max(0, Math.min(1, level * timeEnv));
  // Diffuser fragments keep a visible floor: each carries 1/√N of the energy,
  // so by level alone they shrank to sub-pixel specks and the split could not
  // be seen (owner 2026-09-26: "there should be MANY balls"). Colour still
  // tells the truth about their level.
  const r = Math.max(ray.split ? 1.7 : 0, 2.5 * (0.34 + 0.66 * amp));
  return { x, y, amp, r };
}
