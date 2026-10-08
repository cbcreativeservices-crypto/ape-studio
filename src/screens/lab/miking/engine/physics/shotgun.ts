/**
 * THE SHORT SHOTGUN — a SIMPLIFIED picture of an interference-tube mic
 * (lab6 group 1, 2026-10-08; foley_footsteps/SOURCES.md §c). Pure; worklets.
 *
 * What the research says (SCH-SHOTGUN, DPA-TUBE, both High):
 *   • "For wavelengths longer than the tube — at low and midrange
 *     frequencies — the tube has little effect … a shotgun microphone has no
 *     greater rejection of off-axis sound than the capsule on which it is
 *     based." Below f_t = c / L_tube the pattern IS the base capsule's
 *     (a supercardioid, polar.ts).
 *   • "At higher frequencies the pickup pattern becomes narrower, but with
 *     great variations in response for different angles and frequencies."
 *     Above f_t the lobe NARROWS — drawn, never given a number.
 *   • "In a diffuse sound field (i.e. at significant distances indoors) they
 *     are less effective than one might wish." Said in words on the pages.
 *
 * L_tube is UNKNOWN for a generic mic: a drawing default of 200 mm (inside a
 * common short shotgun's Ø 19 × 250 mm body) → f_t ≈ 1.7 kHz, shown only as
 * "above roughly the upper mids". The narrow band's SHAPE (`HIGH_POWER`) is
 * ILLUSTRATIVE: a picture of "narrower", not a measured pattern — the page
 * says "a simplified picture" once, and no readout prints it.
 */
import { gain } from './polar.ts';

/** The speed of sound the app's calculators use (SOURCES_SHARED.md §1, 20 °C). */
export const C_SOUND = 343.21;
/** The interference tube's length (mm): a drawing default (SOURCES.md §c). */
export const SHOTGUN_TUBE_MM = 200;
/** How sharply the drawn high band narrows: an ILLUSTRATIVE exponent. */
export const HIGH_POWER = 6;

/** The frequency below which the tube "has little effect" (Hz): c / L. */
export function tubeTransitionHz(tubeMm: number = SHOTGUN_TUBE_MM, c: number = C_SOUND): number {
  'worklet';
  return c / (tubeMm / 1000);
}

/**
 * The drawn lobe of one band at θ degrees off the axis (0 … 1):
 *   'low'  — below the tube's transition: the base supercardioid, |g(θ)|;
 *   'high' — above it: the base pattern narrowed toward the front
 *            (|g(θ)| × max(0, cos θ)^HIGH_POWER) — ILLUSTRATIVE.
 * The high band never exceeds the low band at any angle (it only narrows).
 */
export function shotgunLobe(thetaDeg: number, band: 'low' | 'high'): number {
  'worklet';
  const base = Math.abs(gain('supercardioid', thetaDeg));
  if (band === 'low') return base;
  const c = Math.cos((thetaDeg * Math.PI) / 180);
  return c <= 0 ? 0 : base * Math.pow(c, HIGH_POWER);
}

/** The half-angle (deg) at which a band falls to half its on-axis value —
 *  for the tests only (the app prints no angle for the shotgun's lobe). */
export function halfWidthDeg(band: 'low' | 'high'): number {
  for (let t = 0; t <= 180; t += 0.25) if (shotgunLobe(t, band) < 0.5) return t;
  return 180;
}
