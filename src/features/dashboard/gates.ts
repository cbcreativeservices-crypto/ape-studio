/**
 * Quiz-gate mirror — DISPLAY ONLY (Code brief §5). Mirrors the deployed
 * start_quiz_attempt §3.6 math for the Dashboard readout; the server
 * re-checks at quiz start, so nothing here gates anything for real.
 *
 * Server gate per applicable method (owner 2026-08-06 — NO timer, NO accuracy
 * ratio): completion_pct = 100, where completion means each card SEEN once
 * (flashcards) / each question answered CORRECTLY once (other methods).
 * Missing student_method_progress row = fail-closed.
 */
import type { MethodProgressRow, StudyMethodConfig } from './api';

export type GateReadout = {
  methodKey: string;
  /** null when the gate passes */
  lines: { text: string; color: string }[];
  pct: number;
  gatePass: boolean;
};

/** Readout line color for the completion line. */
const COMPLETION_COLOR = '#ffc233';

export function gateReadout(
  cfg: StudyMethodConfig,
  row: MethodProgressRow | undefined,
): GateReadout {
  const pct = row?.completion_pct ?? 0;
  const NAME = cfg.name.toUpperCase();

  // Sole gate now (owner 2026-08-06): completion 100%. Timer + accuracy-ratio
  // gates removed — completion itself encodes "seen once" / "correct once".
  const completion = pct >= 100;

  /**
   * ⛔ A PASSED TIME TRIAL CLEARS THE METHOD — and this mirror did not know.
   *
   * The real gate does honour it. `start_quiz_attempt` reads `trial_passed`,
   * and `build_study_snapshot` returns
   *   gate_pass = COALESCE(trial_passed,false) OR (completion AND time AND accuracy)
   * while this readout looked only at completion_pct. So a learner who passed
   * a trial was told "NEED 100%" by the Dashboard on a method the server had
   * already cleared — the readout contradicting the thing it mirrors.
   *
   * It stayed hidden because the write was broken too: `credit_time_trial`
   * only implemented the retired course model and threw `not_enrolled` on
   * every v3 topic, so the flag was never set for anyone and the mirror was
   * never wrong in practice. Fixing that (migration 2026092102) is what makes
   * this reachable, so both halves land together.
   */
  const trialPassed = row?.trial_passed === true;
  const cleared = completion || trialPassed;

  const lines: { text: string; color: string }[] = [];
  if (!cleared) {
    lines.push({ text: `◦ ${NAME} ${pct}% COMPLETE — NEED 100%`, color: COMPLETION_COLOR });
  }

  return { methodKey: cfg.key, lines, pct, gatePass: cleared };
}

/** % readout color for method rows (design: 100 green · high gold · low orange). */
export function pctColor(pct: number): string {
  if (pct >= 100) return '#5bff85';
  if (pct >= 70) return '#ffc233';
  return '#ff8a1e';
}
