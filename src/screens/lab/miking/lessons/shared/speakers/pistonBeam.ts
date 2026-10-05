/**
 * HOW A SPEAKER SPREADS ITS SOUND — the textbook RIGID PISTON IN A WALL
 * (a circular piston in an infinite baffle), far field. Pure; tested.
 *
 *   relative level at angle θ off the axis:  D(θ) = | 2·J₁(x) / x |,
 *   x = k·a·sin θ,  k = 2πf / c,  a = the piston's radius.
 *
 * The Bessel function is the Cymatics Lab's (features/cymatics/plateModes,
 * the same one the HOW IT SOUNDS membrane shapes use); c is the calculator's
 * speed of sound (calcUnits, charter §4). The near-field limit is the
 * calculator's own (speakersAdv.pistonNearField: inside the larger of the
 * cone radius and the Rayleigh distance Sd ÷ λ the far-field picture does
 * not hold) — called, never copied.
 *
 * SIMPLIFICATIONS (said once on screen: "a simplified picture"): a rigid
 * disc the size of the cone opening (a = 141.5 mm, the 12-in reference's
 * cut-out radius), in an endless wall, far away. A real cone flexes at higher
 * pitches (its middle does more of the work), a cabinet is not an endless
 * wall, and a close mic sits in the near field where this beam picture does
 * not apply. Reference: the baffled-piston directivity of any acoustics text
 * (e.g. Kinsler et al., Fundamentals of Acoustics; Beranek & Mellow,
 * Acoustics ch. 13 — the calculator's own reference for the piston).
 */
import { besselJ } from '../../../../../../features/cymatics/plateModes';
import { speedOfSoundAir } from '../../../../calc/calcUnits';
import { pistonNearField } from '../../../../calc/workspaces/speakersAdv';
import { SPEAKER_12 } from './speakerModel.ts';

/** The drawn piston's radius: the 12-in reference's cut-out radius (mm). */
export const PISTON_A_MM = SPEAKER_12.rCone.mm;
/** 20 °C, from the calculator. */
export const C_AIR = speedOfSoundAir(20);
/** The pitch range the fader offers: the reference speaker's published
 *  "Frequency range 70-5000Hz" (CEL-V30). */
export const BEAM_F_MIN = 70;
export const BEAM_F_MAX = 5000;

export function kaOf(fHz: number, aMm: number = PISTON_A_MM, c: number = C_AIR): number {
  return (2 * Math.PI * fHz * (aMm / 1000)) / c;
}

/** D(θ), 0..1, for ka and θ in degrees (0 = on the axis). */
export function pistonD(ka: number, thetaDeg: number): number {
  const x = ka * Math.sin((Math.abs(thetaDeg) * Math.PI) / 180);
  if (x < 1e-6) return 1;
  return Math.abs((2 * besselJ(1, x)) / x);
}

/** D in dB, floored at −40 dB for display. */
export function pistonDb(ka: number, thetaDeg: number): number {
  const d = pistonD(ka, thetaDeg);
  return d < 0.01 ? -40 : Math.max(-40, 20 * Math.log10(d));
}

/** The angle off the axis where the level is 6 dB down (half the pressure),
 *  or null when it never falls that far within 90° (the sound spreads wide). */
export function halfAngle(ka: number, downDb = 6): number | null {
  const target = Math.pow(10, -downDb / 20);
  if (pistonD(ka, 90) > target) return null;
  let lo = 0;
  let hi = 90;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (pistonD(ka, mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Is a mic `distMm` from the cone inside its near field at `fHz`? (The
 *  calculator decides: pistonNearField returns its refusal text there.) */
export function inNearField(distMm: number, fHz: number, aMm: number = PISTON_A_MM): boolean {
  const sd = Math.PI * (aMm / 1000) * (aMm / 1000);
  return pistonNearField(sd, fHz, distMm / 1000, C_AIR) !== null;
}

/** The far-field distance at fHz: the larger of the radius and Sd ÷ λ (mm),
 *  for the words ("from about 1.4 m out"). Same rule the calculator applies. */
export function farFieldFromMm(fHz: number, aMm: number = PISTON_A_MM): number {
  // Bisect the calculator's own decision rather than restating its formula.
  let lo = 0;
  let hi = 100000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (inNearField(mid, fHz, aMm)) lo = mid;
    else hi = mid;
  }
  return hi;
}
