/**
 * ONE topic-progress formula shared by the Dashboard topic card and the
 * Enrollments / Profile / Directory progress readouts (useEnrollmentProgress).
 *
 * The two screens used to compute the same number separately and disagreed
 * (bug hunt B-087: DAW 100% on the Dashboard vs 75% on Enrollments because the
 * scenarios exemption was only applied on the Dashboard; Safety 20% vs 21%
 * because one side floored and the other rounded). The Dashboard formula is the
 * source of truth, so it lives here and both callers import it.
 *
 *  - methodDisplayPct: per-method smooth %. Scenarios is round-based homework:
 *    its LED reflects server completion_pct (rounds ÷ 3 → 33/67/100), set by
 *    complete_scenario_round. Every other method creeps per-item from
 *    item_states via studyDisplayPct.
 *  - smoothMethodPct: methodDisplayPct + the scenarios exemption (owner
 *    launch-triage E4): a topic CONFIRMED to have no scenario content reads 100%
 *    for scenarios so its meter / overall % / quiz gate can complete.
 *  - topicOverallPct: Math.floor of the mean of the applicable methods' smooth %.
 *    UN-rounded per method (QA night 2026-08-31): Math.round turned 99.5 into 100
 *    and unlocked the next stage early; the floor is applied once, at the end.
 */
import { studyDisplayPct } from '../study/api';
import { isScenariosExempt } from '../study/scenarioExempt';
import { isTermsExempt } from '../study/termsExempt';

export type MethodPctRow =
  | {
      item_states?: unknown;
      completion_pct?: number | null;
      /** Set by `credit_time_trial` when a Time Trial is passed — see below. */
      trial_passed?: boolean | null;
    }
  | undefined;

export function methodDisplayPct(
  row: MethodPctRow,
  itemCount: number,
  key: string,
  requiredPasses: number,
): number {
  if (key === 'scenarios') {
    // Round-based server completion (record_scenario_answer / round RPCs).
    return Math.round(row?.completion_pct ?? 0);
  }
  // flashcards / fill-in-blank / matching: full-set completion via studyDisplayPct.
  return studyDisplayPct(
    (row?.item_states ?? {}) as Parameters<typeof studyDisplayPct>[0],
    itemCount,
    key,
    requiredPasses,
  );
}

export function smoothMethodPct(
  row: MethodPctRow,
  itemCount: number,
  key: string,
  topicId: string,
  requiredPasses: number,
): number {
  /**
   * ⛔ A PASSED TIME TRIAL CLEARS THE METHOD — and this is where the app has to
   * agree, because this is the formula the Dashboard, Enrollments, Profile and
   * Directory all actually use.
   *
   * The server already treats it that way: `start_quiz_attempt` reads
   * `trial_passed`, and `build_study_snapshot` returns
   *   gate_pass = COALESCE(trial_passed,false) OR (completion AND time AND accuracy)
   * So without this the learner passes a trial, is told the method is cleared
   * toward the quiz, and watches the meter sit at the percentage they had —
   * with the power sequencing still refusing to light the next stage, while the
   * server would have let them straight through.
   *
   * ⚠️ IT WAS "FIXED" IN THE WRONG FILE FIRST (2026-09-22). The same change went
   * into `features/dashboard/gates.ts`, whose header calls itself the
   * Dashboard's mirror of the server gate — and which nothing imports. It was
   * dead code, so the fix and its tests were real and changed nothing anyone
   * could see. If you are here to adjust gate behaviour, this file is the live
   * one; check for callers before trusting a name.
   */
  if (row?.trial_passed === true) return 100;

  /**
   * ⛔ A TOPIC CONFIRMED TO HAVE NO TERMS CANNOT SATISFY ANY ITEM-BASED METHOD.
   *
   * Every non-scenario method divides by the term count, and studyDisplayPct
   * returns 0 when that count is 0 — so flashcards is stuck at 0%,
   * homeworkPowered never flips, and the quiz is locked FOREVER, taking every
   * credential that requires the topic with it (overnight hunt 2026-09-23, A1-2).
   *
   * Same shape and same ruling as the scenarios exemption directly below, and
   * the same hard condition: `markTermsExempt` is only ever called after a
   * SUCCESSFUL fetch that returned zero items, never on an error, a denial or a
   * guest read. This removes a gate that cannot be satisfied; it does not claim
   * the topic was studied. A topic with nothing to study has nothing to withhold.
   */
  if (key !== 'scenarios' && isTermsExempt(topicId)) return 100;

  return key === 'scenarios' && isScenariosExempt(topicId)
    ? 100
    : methodDisplayPct(row, itemCount, key, requiredPasses);
}

/** Topic "overall progress" = floor of the mean of `keys`' smooth display %.
 *  `rpFor` is the caller's required_passes lookup (falls back to 2 when
 *  study_methods is unavailable for a guest). Returns 0 for no methods. */
export function topicOverallPct(
  keys: readonly string[],
  rowFor: (key: string) => MethodPctRow,
  itemCount: number,
  topicId: string,
  rpFor: (key: string) => number,
): number {
  if (keys.length === 0) return 0;
  return Math.floor(
    keys.reduce((s, k) => s + smoothMethodPct(rowFor(k), itemCount, k, topicId, rpFor(k)), 0) /
      keys.length,
  );
}
