/**
 * Quiz-gate mirror — DISPLAY ONLY (Code brief §5). Mirrors the deployed
 * start_quiz_attempt §3.6 math for the Dashboard readout; the server
 * re-checks at quiz start, so nothing here gates anything for real.
 *
 * Server gate per applicable method:
 *   1. completion_pct = 100
 *   2. engagement_seconds ≥ study_methods.min_engagement_seconds
 *   3. accuracy methods: correct/answered ≥ threshold (flashcards exempt)
 * Missing student_method_progress row = fail-closed (all gates unmet).
 */
import type { MethodProgressRow, StudyMethodConfig } from './api';

export type GateReadout = {
  methodKey: string;
  /** null when the gate passes */
  lines: { text: string; color: string }[];
  pct: number;
  gatePass: boolean;
};

/** Readout line colors (proposal, [TBD-DESIGN] #5 in seed brief §4). */
const COMPLETION_COLOR = '#ffc233';
const ACCURACY_COLOR = '#ff8a1e';
const TIME_COLOR = '#5bb0ff';

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function gateReadout(
  cfg: StudyMethodConfig,
  row: MethodProgressRow | undefined,
): GateReadout {
  const pct = row?.completion_pct ?? 0;
  const secs = row?.engagement_seconds ?? 0;
  const answered = row?.answered_count ?? 0;
  const correct = row?.correct_count ?? 0;
  const NAME = cfg.name.toUpperCase();

  const completion = pct >= 100;
  const time = secs >= cfg.min_engagement_seconds;
  const accuracy = !cfg.requires_accuracy || (answered > 0 && (correct / answered) * 100 >= cfg.accuracy_threshold);

  const lines: { text: string; color: string }[] = [];
  if (!completion) {
    lines.push({ text: `◦ ${NAME} ${pct}% COMPLETE — NEED 100%`, color: COMPLETION_COLOR });
  }
  if (!accuracy) {
    const accPct = answered > 0 ? Math.floor((correct / answered) * 100) : 0;
    lines.push({
      text: `◦ ${NAME} ACCURACY ${accPct}% — NEED ${cfg.accuracy_threshold}%`,
      color: ACCURACY_COLOR,
    });
  }
  if (!time) {
    lines.push({
      text: `◦ ${NAME} STUDY TIME ${fmtTime(secs)} — NEED ${fmtTime(cfg.min_engagement_seconds)}`,
      color: TIME_COLOR,
    });
  }

  return { methodKey: cfg.key, lines, pct, gatePass: completion && time && accuracy };
}

/** % readout color for method rows (design: 100 green · high gold · low orange). */
export function pctColor(pct: number): string {
  if (pct >= 100) return '#5bff85';
  if (pct >= 70) return '#ffc233';
  return '#ff8a1e';
}
