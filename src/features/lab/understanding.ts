/**
 * End-of-lab understanding checks — the thing that completes a member lab.
 *
 * ── WHY THIS EXISTS (owner 2026-09-20) ──────────────────────────────────────
 * The 15 Audio Fundamentals labs record progress; the ~30 MEMBER labs record
 * none at all, so a credential that requires one could never be satisfied and
 * the requirements sheet had to draw a dash where a checkbox belonged. The
 * owner's ruling: "create new test for each lab at end for understanding —
 * that completes the requirement."
 *
 * ── THE PASS RULE, AND WHY IT IS THIS ONE (owner ruling) ────────────────────
 * **Every question correct, retry until you are.** No percentage, no score to
 * argue with, no partial credit. It matches the study-method gate the Academy
 * already uses (correct-once per item), and the learner leaves having got
 * everything right rather than having scraped past. A wrong answer is not a
 * failure, it is a question you have not finished yet.
 *
 * ── ⛔ ABSENCE IS HONEST, AND MUST STAY THAT WAY ────────────────────────────
 * A lab with no authored questions has NO check and is NOT completable, and
 * every surface must say so rather than draw an empty checkbox nobody can
 * tick. That was the exact fault fixed in the requirements sheet earlier
 * today; re-introducing it here by stubbing placeholder questions would be
 * worse, because these grant credit.
 *
 * So `QUESTIONS` starts EMPTY on purpose. Computer B authors per lab
 * (handoff: `2026-09-20_LAB_UNDERSTANDING_TESTS_FOR_B.md`), and each lab
 * becomes completable the moment its questions land — no other wiring needed.
 */

export type UnderstandingQuestion = {
  /** Stable within its lab; used as the per-question progress key. */
  id: string;
  prompt: string;
  /** 3–5 options. Order as authored; the UI shuffles per learner. */
  options: readonly string[];
  /** The correct option, BY VALUE — never by index, so re-ordering the
   *  authored list can never silently change the answer. */
  correct: string;
  /** Shown after answering, right or wrong. This is the teaching moment and
   *  is not optional. */
  explanation: string;
};

/**
 * Authored checks, keyed by the lab's `labId` — the same id `PagedLab` already
 * persists progress under, so there is no second identifier to keep in step.
 *
 * ⚠️ EMPTY BY DESIGN. See the header. Adding a lab here makes it completable.
 */
export const UNDERSTANDING_CHECKS: Record<string, readonly UnderstandingQuestion[]> = {};

/** The check for a lab, or null when none is authored yet. */
export function understandingFor(labId: string): readonly UnderstandingQuestion[] | null {
  const qs = UNDERSTANDING_CHECKS[labId];
  return qs && qs.length > 0 ? qs : null;
}

/** Can this lab be completed at all yet? Surfaces use it to decide whether to
 *  show a checkbox or say plainly that there is nothing to complete. */
export function hasUnderstandingCheck(labId: string): boolean {
  return understandingFor(labId) != null;
}

/** The completion unit a passed check marks. One per lab, like the
 *  read-through labs' REVIEW unit. */
export const UNDERSTANDING_UNIT = 'understanding';
