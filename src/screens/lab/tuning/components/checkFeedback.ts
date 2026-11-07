/**
 * The feedback line an UnderstandingCheck shows after a pick (pure, so it can
 * be pinned without rendering).
 *
 * Owner decision 7 (lab text audit, 2026-11-07): many `explain` lines name
 * the right answer, so a FIRST wrong pick on a check with no `wrong` map says
 * only "Not quite — try again." From the second miss on, the explanation is
 * shown as a hint. A correct pick and the `wrong` map are unchanged.
 */

// Generic fallback when a distractor has no bespoke feedback.
export const GENERIC_WRONG = 'Not quite. Re-read the question — which quantity does it actually ask about?';
export const FIRST_MISS = 'Not quite — try again.';

export function checkFeedback({
  picked, correct, explain, wrong, misses,
}: {
  /** ORIGINAL option index picked, or null before any pick. */
  picked: number | null;
  correct: number;
  explain: string;
  wrong?: (string | undefined)[];
  /** Wrong picks so far, counting this one. */
  misses: number;
}): string | null {
  if (picked == null) return null;
  if (picked === correct) return `✓ ${explain}`;
  if (wrong) return wrong[picked] ?? GENERIC_WRONG;
  return misses <= 1 ? FIRST_MISS : `${explain} — try again with that in mind.`;
}
