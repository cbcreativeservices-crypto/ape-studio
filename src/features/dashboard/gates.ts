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

  const lines: { text: string; color: string }[] = [];
  if (!completion) {
    lines.push({ text: `◦ ${NAME} ${pct}% COMPLETE — NEED 100%`, color: COMPLETION_COLOR });
  }

  return { methodKey: cfg.key, lines, pct, gatePass: completion };
}

/** % readout color for method rows (design: 100 green · high gold · low orange). */
export function pctColor(pct: number): string {
  if (pct >= 100) return '#5bff85';
  if (pct >= 70) return '#ffc233';
  return '#ff8a1e';
}
