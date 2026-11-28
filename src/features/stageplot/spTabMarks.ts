/**
 * spTabMarks — the one line that says what a tab's mark means (beginner waves
 * 2026-11-15, PLOT-10; owner 2026-11-15: "build waves 1 thru 3").
 *
 * The tab bar grows "? 1" and "! 1" marks as the review finds questions and
 * corrections, and nothing on screen said what they meant (the only words
 * were inside the GUIDED TASK). The first time a mark is on the bar, one
 * short line under it says so; it goes once the user has opened a tab that
 * carries a mark (the meaning is then on that tab's own question card), and
 * it stays gone while the app is open.
 *
 * Pure TypeScript: the words, and when they show.
 */

export const SP_MARK_ASK_LEGEND = '? = a question for you to answer in that tab.';
export const SP_MARK_MUST_LEGEND = '! = something to correct in that tab.';

/** The legend for the marks on the bar now, or null when there is no mark or
 *  the user has already opened a marked tab. Only the marks that are shown
 *  are explained. */
export function spTabMarkLegend(marks: readonly { ask: number; must: number }[], dismissed: boolean): string | null {
  if (dismissed) return null;
  const ask = marks.some((m) => m.ask > 0);
  const must = marks.some((m) => m.must > 0);
  if (!ask && !must) return null;
  return [must ? SP_MARK_MUST_LEGEND : '', ask ? SP_MARK_ASK_LEGEND : ''].filter(Boolean).join(' ');
}
