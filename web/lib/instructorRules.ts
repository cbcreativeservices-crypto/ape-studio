/**
 * The instructor page's words for numbers (must-do E3, 2026-11-07). Import-free
 * so the node tests load it. Mirrors the app's instructor screen
 * (src/features/instructor/classRules.ts on the forum-next-build branch).
 *
 *  - A quiz score is a COUNT of right answers (quiz_attempts.score and
 *    best_genuine_score), not a percent. The rows do not say how many
 *    questions were served, so the score is printed alone ("24 right"). A
 *    value above the largest quiz is not a quiz score (seeded test values): it
 *    is explained in words, never printed (D53).
 *  - Never "N of total" for progress (owner 2026-10-29): what was done, by
 *    count and by name. `labs_total` / `topics_started` are never printed as a
 *    denominator. A final exam's "27 / 30" is a SCORE and keeps its total (D41).
 */

/** The largest quiz the Academy serves (app features/quiz/api QUIZ_SIZE). */
export const LARGEST_QUIZ = 30;

/** An unfinished lab, by name. */
export const NOT_YET = "Not yet";

/** A quiz score is a count of right answers. null = no number to print. */
export function quizScoreText(score: number | null | undefined): string | null {
  if (score == null || typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > LARGEST_QUIZ) {
    return null;
  }
  return `${Math.round(score)} right`;
}

/** One attempt's chip: the score, or words when there is no score to print. */
export function attemptScoreText(score: number | null | undefined): string {
  return quizScoreText(score) ?? "no score on record";
}

/** The best-score line on a topic card. */
export function bestScoreText(bestScore: number | null | undefined, attempts: { practice: boolean }[]): string {
  const s = quizScoreText(bestScore);
  const scored = attempts.some((a) => !a.practice);
  if (s && (scored || (bestScore ?? 0) > 0)) return `Best quiz: ${s}`;
  if (bestScore != null && bestScore > LARGEST_QUIZ) return "No quiz score on record";
  return attempts.length ? "Practice quizzes only" : "No quiz taken yet";
}

const whole = (v: unknown): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** "1 topic done", "3 labs done": a count with its own noun. */
function done(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many} done`;
}

/** The class-list row: what was done, never "of" anything. */
export function studentReadouts(s: { topics_started: unknown; topics_complete: unknown; labs_complete: unknown }): string[] {
  const complete = whole(s.topics_complete);
  // Enrolled or studied, not complete.
  const studying = Math.max(0, whole(s.topics_started) - complete);
  return [done(complete, "topic", "topics"), `${studying} in progress`, labsDoneText(whole(s.labs_complete))];
}

/** "N labs done", counted from the rows the page lists. */
export function labsDoneText(n: number): string {
  return done(whole(n), "lab", "labs");
}

/** How many of the listed labs carry a completion date. */
export function labsDoneCount(rows: { completed_at: string | null }[]): number {
  return rows.filter((l) => !!l.completed_at).length;
}
