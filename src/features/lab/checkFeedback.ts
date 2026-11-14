/**
 * checkFeedback — what the understanding check card says after a tap (lab fix
 * round 2026-11-14, report section 3 row 4 and pattern 4; owner approval:
 * "Begin fixing all bugs found and do obvious ... fixes as you suggested in
 * the report", then the suggested order, item 5 "The check card: per-option
 * reasons and FINISH after a pass").
 *
 * The fault it fixes: the "wrong" box printed the question's explanation,
 * which usually names the right answer, on the FIRST wrong tap — so a learner
 * learned to tap anything and read (10 effect labs, 8 G7 rack labs). Now:
 *   • first miss  → NOT QUITE — TRY ANOTHER + that option's own `why`, else
 *                   the question's `hint`, else the shared default line;
 *   • second miss → the same line, plus the explanation;
 *   • right       → CORRECT + the explanation (unchanged).
 * A miss is a DIFFERENT wrong option: tapping the same wrong option twice is
 * still one miss, so the answer is never two idle taps away.
 *
 * Pure and React-free so test/labFixes_20261114_S2 runs it without Metro.
 */
import type { UnderstandingQuestion } from './understanding';

/** The line for a wrong option that has no `why` and no question `hint`:
 *  points back at the lab, never at the answer. */
export const CHECK_DEFAULT_NUDGE = 'Not that one. Look back at what the lab showed you, then try another answer.';

/** Misses before the explanation (which may name the answer) is shown. */
export const MISSES_BEFORE_EXPLANATION = 2;

export type CheckFeedback = {
  /** Right → the card's CORRECT head; wrong → NOT QUITE — TRY ANOTHER (the
   *  heads stay word for word in LabUnderstandingCheck.tsx: some thirty lab
   *  screen guides name them, and their tests read that file). */
  right: boolean;
  /** The per-option reason / hint / default nudge (wrong answers only). */
  line?: string;
  /** The question's explanation: on a right answer, or after the second miss. */
  explanation?: string;
};

/** Record a wrong pick: a new option adds a miss, a repeat does not. */
export function addMiss(misses: readonly string[] | undefined, option: string): string[] {
  const m = misses ?? [];
  return m.includes(option) ? [...m] : [...m, option];
}

/**
 * The feedback for one question, or null when nothing has been picked yet.
 * `chose` is the option on screen right now; `misses` the distinct wrong
 * options tried so far; `got` whether the question is answered right.
 */
export function checkFeedback(
  q: Pick<UnderstandingQuestion, 'correct' | 'explanation' | 'why' | 'hint'>,
  chose: string | undefined,
  misses: readonly string[],
  got: boolean,
): CheckFeedback | null {
  if (got) return { right: true, explanation: q.explanation };
  if (!chose || chose === q.correct) return null;
  const line = q.why?.[chose] ?? q.hint ?? CHECK_DEFAULT_NUDGE;
  return misses.length >= MISSES_BEFORE_EXPLANATION
    ? { right: false, line, explanation: q.explanation }
    : { right: false, line };
}

/** Problems with a question's `why` / `hint` (empty = fine). Used by the S2
 *  test over every authored check, so a phase-2 typo is caught. */
export function checkWhyProblems(q: UnderstandingQuestion): string[] {
  const out: string[] = [];
  const words = (s: string) => s.trim().split(/\s+/).length;
  for (const [opt, line] of Object.entries(q.why ?? {})) {
    if (!q.options.includes(opt)) out.push(`${q.id}: why key is not an option: "${opt}"`);
    if (opt === q.correct) out.push(`${q.id}: why is given for the CORRECT option`);
    if (words(line) > 30) out.push(`${q.id}: why for "${opt}" is over 30 words`);
    if (line.includes(q.correct)) out.push(`${q.id}: why for "${opt}" quotes the right answer`);
  }
  if (q.hint !== undefined) {
    if (words(q.hint) > 30) out.push(`${q.id}: hint is over 30 words`);
    if (q.hint.includes(q.correct)) out.push(`${q.id}: hint quotes the right answer`);
  }
  return out;
}
