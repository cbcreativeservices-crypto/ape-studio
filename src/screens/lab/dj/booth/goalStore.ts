/**
 * goalStore — what each DJ screen still has to do, for the what's-left screen
 * (learning review 2026-10-18 X5: "show each screen's unmet goal labels").
 *
 * Every screen's goal chips latch while it is open (bits.useVisitGoals); each
 * render reports here which labels are still unmet. The what's-left row of a
 * screen that is not done then reads "Left: Fix the silent start · Pass the
 * check" — from the last visit, or every goal of a screen not yet opened.
 * SESSION state only (a module map, like the shared booth): nothing here is
 * the learner's record, so it is never saved.
 */

const reported = new Map<string, readonly string[]>();

/** The labels whose goals are not latched, in the screen's order. */
export function unmetGoals(labels: readonly string[], latched: readonly boolean[]): string[] {
  return labels.filter((_, i) => !latched[i]);
}

/** A screen reports its goals (called on render; cheap and idempotent). */
export function reportGoals(page: string, labels: readonly string[], latched: readonly boolean[]): void {
  reported.set(page, unmetGoals(labels, latched));
}

/** The what's-left line for a screen: its unmet goals from the last visit,
 *  or all of them when it has not been opened this session. */
export function leftLine(page: string, allLabels: readonly string[]): string {
  const left = reported.get(page) ?? allLabels;
  if (!left.length) return 'Every goal is met — open it once more to count it.';
  return `Left: ${left.join(' · ')}`;
}

/** Forget every report (tests; a fresh session). */
export function clearGoalReports(): void {
  reported.clear();
}
