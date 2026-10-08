/**
 * THE PARABOLIC DISH (Lab 6 group 2; field_wildlife_distant/
 * GEOMETRY_PROPOSAL.md §2, SOURCES.md): F07 and later B12. Pure; tested
 * (test/mikingLab6Field.test.ts). Drawn by DishArt.tsx.
 *
 *   D        570 mm by default — a typical dish (CORNELL-MIC "57 cm");
 *            presets 585 mm / focal 210 mm (SCH-DISH) and 500 mm / 140 mm
 *            (INNERCORE)
 *   f        0.36 · D by default (205 mm — DERIVED from SCH-DISH's ratio;
 *            a drawing default, D-DISH-GEOM)
 *   profile  a paraboloid z = r² / (4f): every ray along the axis reflects
 *            through the FOCUS, on the axis, f from the vertex
 *   capsule  at the focus, FACING THE DISH (SCH-DISH, INNERCORE)
 *   help     "little help from the dish below about c / D" — the wavelength
 *            longer than the dish (CORNELL-MIC's rule, DERIVED with the
 *            calculator's c): 602 Hz for 570 mm, 587 Hz for 585 mm, 686 Hz
 *            for 500 mm. Below it the capsule still hears the sound
 *            directly; the dish just does not concentrate it (D-DISH-LF).
 *   beam     drawn narrowing as the pitch rises — an ILLUSTRATIVE picture
 *            (an aperture's spread, about λ / D), never printed as a number
 *   gain     NO gain curve (owner decision O-9 default: words + the "little
 *            help below" readout only).
 */
import { C20 } from '../../../engine/physics/twoMic.ts';

export type DishId = 'typical' | 'd585' | 'd500';
export type Dish = { id: DishId; label: string; short: string; D: number; f: number; note: string };

/** The dishes the lab draws (mm). Product names stay in the research record. */
export const DISHES: Readonly<Record<DishId, Dish>> = {
  typical: { id: 'typical', label: 'A typical 57 cm dish', short: '57 CM', D: 570, f: Math.round(0.36 * 570), note: 'A common size for a bird-recording dish; the focus drawn at about a third of its width from the middle.' },
  d585: { id: 'd585', label: 'A 58.5 cm dish, focus 21 cm', short: '58.5 CM', D: 585, f: 210, note: 'One maker’s set: the capsule mounted at the focus, facing the dish.' },
  d500: { id: 'd500', label: 'A 50 cm dish, focus 14 cm', short: '50 CM', D: 500, f: 140, note: 'Another maker’s set: a deeper bowl, the capsule at a marked focus, aimed back at the dish.' },
};
export const DISH_IDS: readonly DishId[] = ['typical', 'd585', 'd500'];

/** The bowl's depth at its rim (mm): (D/2)² / (4f). */
export function dishDepth(D: number, f: number): number {
  return (D / 2) * (D / 2) / (4 * f);
}

/** The paraboloid's height above its vertex at radius r (mm). */
export function profileZ(r: number, f: number): number {
  return (r * r) / (4 * f);
}

/** How far the focus lies beyond the rim's plane (mm): + outside the bowl,
 *  − inside it. */
export function focusBeyondRim(D: number, f: number): number {
  return f - dishDepth(D, f);
}

/**
 * Where a ray coming in along the axis, hitting the bowl at radius r,
 * crosses the axis after its reflection (mm from the vertex). For a
 * paraboloid that is the focus, whatever r — the reason the capsule sits
 * there.
 */
export function reflectedAxisCrossing(r: number, f: number): number {
  const z = profileZ(r, f);
  // The surface normal at (r, z) for z = r²/(4f): (−r/(2f), 1), normalised.
  const nx = -r / (2 * f);
  const nz = 1;
  const nl = Math.hypot(nx, nz);
  const ux = nx / nl;
  const uz = nz / nl;
  // Incoming along −z (toward the vertex): d = (0, −1). Reflect: d − 2(d·n)n.
  const dx = 0;
  const dz = -1;
  const dn = dx * ux + dz * uz;
  const rx = dx - 2 * dn * ux;
  const rz = dz - 2 * dn * uz;
  // From (r, z) along (rx, rz) to the axis (x = 0).
  const t = -r / rx;
  return z + t * rz;
}

/** Below about this frequency the dish gives little help (Hz): c / D. */
export function helpBelowHz(Dmm: number, c: number = C20): number {
  return c / (Dmm / 1000);
}

/** The wavelength (mm) at f Hz. */
export function wavelengthMm(fHz: number, c: number = C20): number {
  return (c / fHz) * 1000;
}

/** The pitch bands the beam is drawn for (Hz): low, middle, high. */
export const BEAM_BANDS: readonly { id: 'low' | 'mid' | 'high'; hz: number; label: string }[] = [
  { id: 'low', hz: 300, label: 'LOW · a rumble or a deep call' },
  { id: 'mid', hz: 1500, label: 'MIDDLE · many songs and calls' },
  { id: 'high', hz: 5000, label: 'HIGH · a thin, high call' },
];

/**
 * The beam's drawn half-angle (deg) at f — an ILLUSTRATIVE spread about
 * asin(λ / D), wide open (90°) once the wavelength is longer than the dish.
 * Drawn, never printed.
 */
export function beamHalfDeg(fHz: number, Dmm: number, c: number = C20): number {
  const x = wavelengthMm(fHz, c) / Dmm;
  return x >= 1 ? 90 : (Math.asin(x) * 180) / Math.PI;
}

export type AimHelp = 'strong' | 'some' | 'little';
/** What the dish adds for a source `offDeg` off its axis at f: words, from the drawn beam. */
export function aimHelp(offDeg: number, fHz: number, Dmm: number, c: number = C20): AimHelp {
  if (fHz < helpBelowHz(Dmm, c)) return 'little';
  const half = beamHalfDeg(fHz, Dmm, c);
  const off = Math.abs(offDeg);
  return off <= half * 0.5 ? 'strong' : off <= half ? 'some' : 'little';
}

export const AIM_HELP_WORDS: Readonly<Record<AimHelp, string>> = {
  strong: 'The dish concentrates it at the focus',
  some: 'At the beam’s edge: less help, a duller tone',
  little: 'Little help from the dish — the capsule hears it directly',
};

/** "about 600 Hz": the help threshold in words (rounded to 10 Hz). */
export function fmtHelpHz(hz: number): string {
  return `about ${Math.round(hz / 10) * 10} Hz`;
}
