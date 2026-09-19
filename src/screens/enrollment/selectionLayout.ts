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
const clampSide = (n: number) => Math.max(84, Math.min(240, Math.round(n)));

/**
 * The art's share of the row, which depends on WHAT ELSE IS IN THE ROW.
 *
 * ⛔ BOTH ARE STILL FUNCTIONS OF WIDTH ALONE — that is the invariant that
 * stops the flicker coming back, and branching on another width-derived
 * value does not break it.
 *
 * 0.34 when the identity and buttons sit side by side: the column has to
 * hold two things across, so it needs the larger share.
 *
 * 0.46 when they stack. The owner circled the empty space under the art, and
 * this is most of the answer: a stacked column is TALLER (the buttons are
 * below the title, not beside it) while needing less width, so the square
 * can grow into the height that was previously dead space.
 */
const SHARE_BESIDE = 0.34;
const SHARE_STACKED = 0.46;

export function artSideLen(rowWidth: number): number {
  if (!(rowWidth > 0)) return 96; // pre-measurement; replaced on first layout
  return clampSide(rowWidth * (actionsFitBesideIdentity(rowWidth) ? SHARE_BESIDE : SHARE_STACKED));
}

/** The gap between the art and the text column in `head`. */
export const HEAD_GAP = 14;

/**
 * Can the identity and the two topic buttons sit SIDE BY SIDE in the column
 * beside the art, or must the buttons drop beneath them?
 *
 * ⛔ AT 375pt THEY CANNOT. The owner asked for STUDY ALL in the top-right
 * corner with LOAD ALL TOPICS under it, and on their phone that is right.
 * But the buttons are a fixed ~150pt and the identity takes what is left, so
 * on a narrow phone the identity is squeezed to about 50pt and the text
 * breaks MID-WORD: "CERTIFICA / TE", "Microp / hone…". A title broken across
 * a syllable reads as a rendering fault, not as a narrow screen.
 *
 * Below the threshold the same two buttons simply stack under the identity,
 * full width of the column, which keeps every control and its order and only
 * gives up the corner placement that no longer fits.
 *
 * ⚠️ 260 WAS MEASURED, AND 230 WAS TRIED AND REJECTED. 230 was chosen first
 * to protect the corner placement on the owner's own phone — but at a 430pt
 * viewport the column is 235 and the buttons take ~150 of it, leaving ~73 for
 * the title, and "Microphone Technology Specialist" broke as "Microphon / e".
 * The corner layout cannot survive a long credential name on ANY phone; it
 * only looked right because the card under test was called "DJ & Club Sound".
 *
 * So the line is drawn where the text is safe rather than where the layout is
 * preserved: phones stack, tablets and desktop keep the corner. 260 = ~110
 * for a readable title + 12 gap + ~150 for the buttons.
 */
export function actionsFitBesideIdentity(rowWidth: number): boolean {
  // ⚠️ Measured against the BESIDE share, not against artSideLen — asking
  // artSideLen here would make the two functions define each other.
  return rowWidth - clampSide(rowWidth * SHARE_BESIDE) - HEAD_GAP >= 260;
}
