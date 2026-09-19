/**
 * Layout arithmetic for the Enrollments selection head.
 *
 * Its own module, and a plain `.ts` one, for two reasons: the rule below is
 * the subject of a regression test (the component is `.tsx`, which the test
 * runner cannot load), and keeping it out of the view is what makes it
 * checkable at all rather than a number buried in a render.
 */

/**
 * The side of the square artwork, from the ROW'S WIDTH and nothing else.
 *
 * ⛔ THE ARGUMENT MUST BE A WIDTH. NEVER PASS A HEIGHT — THIS SHIPPED AS AN
 * INFINITE LOOP.
 *
 * The first version measured the text column's height and used it as the
 * side, reasoning that only the ROW's height was unsafe to feed back. That
 * was wrong. The square's side is also its WIDTH, and the text column is
 * `flex: 1` beside it in the same row: a wider square leaves a narrower
 * column, a narrower column wraps more and gets TALLER, and that height
 * became the next side. Every pass grew. On a phone it never converged — the
 * head swelled to most of the screen with the buttons pushed off the right
 * edge, re-rendering continuously, which reads as a violent flicker.
 *
 * A width cannot do that, because nothing the art does can change it: the
 * row's width is set by the panel above.
 *
 * 34% leaves the text column the larger share, which is right — it carries
 * the title, the progress meter and all four actions, and it is the part that
 * suffers when squeezed. The clamp stops a narrow phone shrinking the art to
 * a stamp and a tablet blowing it up past the text beside it.
 */
export function artSideLen(rowWidth: number): number {
  if (!(rowWidth > 0)) return 96; // pre-measurement; replaced on first layout
  return Math.max(84, Math.min(176, Math.round(rowWidth * 0.34)));
}

/** The gap between the art and the text column in `head`. */
export const HEAD_GAP = 14;
