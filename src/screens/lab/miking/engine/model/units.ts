/**
 * Display units (rulings §16.5 and §16.11): DUAL units everywhere, rounded to
 * ≈ 5 mm and ≈ 5°, prefixed "≈" — the lesson forbids implying millimetre
 * accuracy (Kick L39: the acoustic centre is not the grille front). Pure;
 * worklets (the live readout formats on the UI thread).
 *
 *   fmtLen(62)   → "≈ 6 cm (2.4 in)"
 *   fmtLen(65)   → "≈ 6.5 cm (2.6 in)"
 *   fmtLen(1240) → "≈ 1.25 m (49 in)"
 *   fmtLen(10005) → "≈ 10 m (33 ft)"   (owner X1: long distances round, feet ≥ 3 m)
 *   fmtAngle(12) → "≈ 10°"
 */

export const MM_PER_IN = 25.4;

/** Round to the nearest 5 mm. */
export function round5(mm: number): number {
  'worklet';
  const r = Math.round(mm / 5) * 5;
  return r === 0 ? 0 : r; // no "-0"
}

function trimZero(s: string): string {
  'worklet';
  // No regex: worklets run this on the UI thread.
  if (s.indexOf('.') < 0) return s;
  let end = s.length;
  while (end > 0 && s.charAt(end - 1) === '0') end--;
  if (end > 0 && s.charAt(end - 1) === '.') end--;
  return s.slice(0, end);
}

/* ── lab6 group 1 (2026-10-08): a SCALED rounding tier for scenes from a prop
 *  to a field (Lab 6 Foley, field and scientific; Lab 7): the step grows with
 *  the distance so a 3.5 m perspective or a 40 m pass-by never claims
 *  millimetres (foley_footsteps/GEOMETRY_PROPOSAL.md §1). ── */

/** The rounding step for a distance (mm): 10 mm below 1 m, 50 mm below 10 m,
 *  0.1 m below 100 m, then 1 m. */
export function scaleStep(mm: number): number {
  'worklet';
  const a = Math.abs(mm);
  if (a < 1000) return 10;
  if (a < 10000) return 50;
  if (a < 100000) return 100;
  return 1000;
}

/** Round a distance on the scaled tier (no "-0"). */
export function roundScaled(mm: number): number {
  'worklet';
  const st = scaleStep(mm);
  const r = Math.round(mm / st) * st;
  return r === 0 ? 0 : r;
}

/* ── ONE distance rule for every readout (owner decision X1, 2026-10-08) ──
 *  below 1 m   5 mm steps, cm and inches        "≈ 6.5 cm (2.6 in)"
 *  1 m – 3 m   the scaled tier (50 mm), m and whole inches   "≈ 1.25 m (49 in)"
 *  3 m and up  the scaled tier (50 mm to 10 m, 0.1 m to 100 m, then 1 m),
 *              m and FEET (0.1 ft below 10 m, whole feet beyond)
 *                                                "≈ 3.55 m (11.6 ft)", "≈ 10 m (33 ft)"
 *  so a long distance never claims millimetres. The imperial part always comes
 *  from the SAME rounded metric value. `fmtLenScaled` is the same rule. */

/** Feet start here (mm, on the rounded value). */
export const FEET_FROM_MM = 3000;
export const MM_PER_FT = 304.8;

/** The rounded value the shared rule shows for a distance (mm). */
export function roundLen(mm: number): number {
  'worklet';
  const r5 = round5(mm);
  return Math.abs(r5) < 1000 ? r5 : roundScaled(mm);
}

/** Metric part only, on the shared rule: "6 cm", "6.5 cm", "1.25 m", "10 m". */
export function fmtMetric(mm: number): string {
  'worklet';
  const r = roundLen(mm);
  const a = Math.abs(r);
  if (a >= 1000) return `${trimZero((r / 1000).toFixed(a >= 100000 ? 0 : 2))} m`;
  if (a >= 10) return `${trimZero((r / 10).toFixed(1))} cm`;
  return `${r} mm`;
}

/** Imperial part, from the SAME rounded value: "2.4 in", "49 in", "11.6 ft", "33 ft". */
export function fmtImperial(mm: number): string {
  'worklet';
  const r = roundLen(mm);
  const a = Math.abs(r);
  if (a < 1000) return `${trimZero((r / MM_PER_IN).toFixed(1))} in`;
  if (a < FEET_FROM_MM) return `${Math.round(r / MM_PER_IN)} in`;
  const ft = r / MM_PER_FT;
  return `${a < 10000 ? trimZero(ft.toFixed(1)) : String(Math.round(ft))} ft`;
}

/** "≈ 6 cm (2.4 in)" — metric first (the lab's own unit; a citation keeps
 *  the source's own unit first, written out in the lesson text). */
export function fmtLen(mm: number): string {
  'worklet';
  if (!(mm === mm)) return 'not measured';
  return `≈ ${fmtMetric(mm)} (${fmtImperial(mm)})`;
}

/** The shared distance rule (X1) — kept as a name for the scaled tier; it is
 *  exactly `fmtLen`. */
export function fmtLenScaled(mm: number): string {
  'worklet';
  return fmtLen(mm);
}

/** Round to the nearest 5°. */
export function round5deg(deg: number): number {
  'worklet';
  const r = Math.round(deg / 5) * 5;
  return r === 0 ? 0 : r;
}

export function fmtAngle(deg: number): string {
  'worklet';
  if (!(deg === deg)) return 'not measured';
  return `≈ ${round5deg(deg)}°`;
}

/** A signed distance from a head, in words: "≈ 6 cm (2.4 in) inside". */
export function fmtSigned(mm: number, plus: string, minus: string): string {
  'worklet';
  if (!(mm === mm)) return 'not measured';
  const r = round5(mm);
  if (r === 0) return 'at the head';
  return `${fmtLen(Math.abs(mm))} ${r > 0 ? plus : minus}`;
}

/** Milliseconds, rounded to 0.05 ms with "≈" ("≈ 0.70 ms"): the path
 *  difference is known to ≈ 5 mm (≈ 0.015 ms) and the acoustic centre is
 *  unknown, so 0.01 ms would claim more than the drawing knows (review m12). */
export function fmtMs(ms: number): string {
  'worklet';
  const r = Math.round(Math.abs(ms) / 0.05) * 0.05;
  return `≈ ${r.toFixed(2)} ms`;
}
export function fmtHz(hz: number): string {
  'worklet';
  if (!(hz === hz)) return 'not measured';
  if (hz >= 1000) return `${trimZero((hz / 1000).toFixed(2))} kHz`;
  if (hz >= 100) return `${Math.round(hz)} Hz`;
  return `${trimZero(hz.toFixed(1))} Hz`;
}
export function fmtDb(db: number): string {
  'worklet';
  if (db <= -59.5) return 'below −60 dB';
  const r = Math.round(db * 10) / 10;
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r).toFixed(1)} dB`;
}

/**
 * An IDEAL pattern's pickup for display (reviews M3 / M8). An ideal
 * first-order null is infinitely deep on paper, so any number near it is an
 * artefact of where the control landed; real microphones reject far less
 * there, and least at low frequencies. Below IDEAL_NULL_DB no number is
 * printed: "deep null" (the page says once, in words, that the pattern is a
 * simplified picture — owner ruling 2026-10-04: no "ideal" tag on every readout).
 */
export const IDEAL_NULL_DB = -25;
export function isDeepNull(db: number): boolean {
  'worklet';
  return db < IDEAL_NULL_DB;
}
export function fmtIdealPickup(db: number): string {
  'worklet';
  return isDeepNull(db) ? 'deep null' : fmtDb(db);
}
