/**
 * TRACER PARTICLES — the marked molecule in the early sound animations
 * (owner 2026-10-16; replaces the 2026-08-10 star glints).
 *
 * The owner's teaching goal: show a new audio student that a molecule only
 * VIBRATES in place — it does not travel with the wave. The star glints did
 * that job but read as decoration (the art grading called them unexplained).
 * The standard physics-classroom marker replaces them: one or two molecules
 * drawn in a distinct colour, a small FIXED tick at each one's rest position,
 * and a faint ↔ bracket spanning its real swing. The coloured dot swings
 * around its tick while the compression bands visibly travel past.
 *
 * Constants only (no Skia, no React Native), so the Skia view file and the
 * plain-text captions share ONE colour.
 *
 * Colour: a saturated magenta that no other mark in these views uses — amber
 * is the pressure trace and the λ bracket, green is the ear and the sounding
 * side, warm orange / cool blue are the pressure bands, grey is every other
 * molecule. On the #0c0c0f stage it stays clearly coloured under the
 * Low-Light 50 % black wash (≈ #80 2e 6b, still distinct from the #68 grey
 * molecules), and it reads against both band tints.
 */
export const TRACER_COLOR = '#ff5cd6';
/** Tick + bracket: a lighter tint of the same hue, drawn fainter than the dot
 *  so the molecule itself stays the brightest coloured thing. */
export const TRACER_MARK_COLOR = '#ffa6ea';

/** NEW COPY 2026-10-16 — for owner review. The legend under the first
 *  display that carries tracers (Foundations M1, the Playground). */
export const TRACER_CAPTION =
  'Colored dot = one small parcel of air. It swings around its mark — it never travels with the wave.';
/** NEW COPY 2026-10-16 — for owner review. Start Here's plainer register
 *  ("a tiny bit of air", its own words in Lesson 1). */
export const TRACER_CAPTION_PLAIN =
  'Colored dot = one tiny bit of air. It swings around its mark — it never travels with the wave.';
