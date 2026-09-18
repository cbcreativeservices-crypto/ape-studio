/**
 * resTint — how the RESONANCE STATE is coloured, in one place.
 *
 * ── WHY IT IS NOT GREEN ANY MORE (2026-09-18, design review #5) ──────────────
 *
 * The plate studio prints two cells side by side:
 *
 *   RESPONSE   tinted by `levelColor(strength)` — at resonance that is RED
 *   RES        tinted by this table — at resonance that was GREEN
 *
 * Two adjacent cells, the same physical fact, opposite ends of the same hue
 * vocabulary. A learner reading red-next-to-green has to be told which one to
 * believe, and the whole point of the house ramp is that they do not.
 *
 * The standing colour rule is that the velocity ramp means AMPLITUDE and only
 * amplitude, and categorical states must not borrow its hues. "Below /
 * approaching / at / between" is a category, not a level.
 *
 * So this is a BRIGHTNESS ladder instead: dim → bright, ending at white. It
 * carries the same "getting warmer" reading, it survives colour-blindness, and
 * it cannot be confused with a ramp colour because it has no hue at all. AT is
 * pure white — the brightest thing in the bezel, which is exactly what arriving
 * should look like.
 *
 * Colour is never the only channel here regardless: every one of these cells
 * prints the state as a word beside the tint.
 *
 * ── AND IT IS SHARED ─────────────────────────────────────────────────────────
 *
 * There were FOUR copies of this table — PlateStudioScreen, MembraneStudioScreen,
 * modChange and modNodes — two of which had already drifted (`colors.textSub`
 * vs `'#8a8f99'` for `below`). One definition now.
 */
export type ResState = 'below' | 'approaching' | 'at' | 'between';

export const RES_TINT: Readonly<Record<ResState, string>> = {
  /** Far below the first mode — barely anything is happening. */
  below: '#6e727b',
  /** Off a mode, several responding weakly. Same dimness as `below` by design:
   *  both mean "nothing is organising", and they differ in cause, not in level. */
  between: '#8a8f99',
  /** Climbing toward a mode. */
  approaching: '#c9ced8',
  /** Arrived. The brightest thing in the bezel. */
  at: '#ffffff',
};
