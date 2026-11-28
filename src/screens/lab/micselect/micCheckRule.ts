/**
 * The feedback rule of Microphone Selection's CHECK YOURSELF cards (lab fix
 * round 2026-11-14, F9 phase 2; the S2 check-card rule). Pure, for the tests.
 */
export type MicCheckSpec = {
  question: string;
  options: string[];
  correctIdx: number;
  /** Shown on the right answer, or after a second different miss. */
  reveal: string;
  /** One line per WRONG option (by index): why that one is not it. Never
   *  names the right answer. */
  why: Readonly<Record<number, string>>;
  /** For a wrong option with no `why`. */
  hint?: string;
};

export const MIC_CHECK_DEFAULT = 'Not that one. Look back at what this module showed you, then try another answer.';

/** What the card says now: nothing before a pick; ✓ + reveal when right; the
 *  picked option's reason on a first miss; the reason + reveal from the
 *  second different miss on. */
export function checkFeedback(spec: MicCheckSpec, picked: number | null, misses: readonly number[]): { right: boolean; text: string } | null {
  if (picked == null) return null;
  if (picked === spec.correctIdx) return { right: true, text: `✓ ${spec.reveal}` };
  const why = spec.why[picked] ?? spec.hint ?? MIC_CHECK_DEFAULT;
  return { right: false, text: misses.length >= 2 ? `NOT QUITE · ${why} ${spec.reveal}` : `NOT QUITE — TRY ANOTHER · ${why}` };
}
