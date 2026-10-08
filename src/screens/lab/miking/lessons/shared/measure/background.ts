/**
 * BACKGROUND SUBTRACTION (F12 L34; sound_level/GEOMETRY_PROPOSAL.md §3).
 * Pure; tested.
 *
 * The combined level holds the source's energy AND the background's, so the
 * source alone is an ENERGY subtraction:
 *     Ls = 10·log10(10^(Lt/10) − 10^(Lb/10))
 * — never Lt − Lb. When the two are too close the answer is refused: the
 * difference is small enough that a tiny error in either reading swings the
 * result, and the method you use rejects it. The refusal limit belongs to
 * the method (owner decision D-6B-8): this lab's default is 3 dB, always
 * shown as "your method sets this", never as a rule.
 *
 * TODO(calculator, D-6B-8): this subtraction belongs on audio-tools-engine
 * as a calculator workspace ("Background subtraction — energy, with the
 * method's refusal limit", SPL & exposure section, beside "Combine any
 * number of levels"). Calculators are the source of truth: once it lands,
 * replace `subtractBackground` with a call through calcBridge and delete
 * this local function. Listed in the Lab 6 group 4 hand-off.
 */

/** This lab's default refusal limit (dB between total and background) —
 *  the METHOD sets the real one (owner decision D-6B-8). */
export const DEFAULT_LIMIT_DB = 3;

export type Subtraction =
  | { ok: true; source: number; difference: number; correction: number }
  | { ok: false; reason: 'tooClose' | 'notAbove' | 'invalid'; difference: number };

export function subtractBackground(total: number, background: number, limitDb = DEFAULT_LIMIT_DB): Subtraction {
  if (!Number.isFinite(total) || !Number.isFinite(background)) return { ok: false, reason: 'invalid', difference: NaN };
  const difference = total - background;
  // The background cannot be louder than the total (D53: refused in words).
  if (difference <= 0) return { ok: false, reason: 'notAbove', difference };
  if (difference < limitDb) return { ok: false, reason: 'tooClose', difference };
  const source = 10 * Math.log10(Math.pow(10, total / 10) - Math.pow(10, background / 10));
  return { ok: true, source, difference, correction: total - source };
}
