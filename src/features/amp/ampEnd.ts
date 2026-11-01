/**
 * ampEnd — what the Amplifier Principles Lab's WHAT'S LEFT screen lists, from
 * the ape:amp:v1 progress (owner 2026-10-02, "favor consistency").
 *
 * ONE builder for both callers: the module host's FINISH (AmpModuleScreen)
 * and the hub's SEE WHAT'S LEFT link (AmpLabHomeScreen), so the two can never
 * disagree. The units are the built modules in lab order, then the final
 * assessment as a check. A module is cleared when marked done; the final when
 * the BEST result passed (a later, weaker retake never un-passes it — credit
 * is never removed). React-free so it is unit-tested without Metro.
 *
 * THE UNDERSTANDING CHECK IS A UNIT TOO (D41 J2, owner 2026-11-01; the Mic
 * Selection fix): the check on the lab menu is what completes this lab for
 * certificates (trainingLabKeys tr_amp, completion 'understanding'), so when
 * the caller passes `check` it is the last row (kind 'check') and LAB COMPLETE
 * can never show above an unpassed check. `passed` comes from the banked
 * labCompletion record, which a practice run never clears.
 */
import type { AmpModuleId } from './ampContent';
import type { AmpProgressState } from './ampProgress';

export type AmpEndUnit = { id: string; label: string; detail?: string; kind?: 'unit' | 'check' };

/** The check's unit id — features/lab/understanding UNDERSTANDING_UNIT
 *  (pinned equal by test/labEndCheckUnit_tubeAmp_d41j_20261101). */
export const AMP_CHECK_UNIT = 'understanding';

export function ampEndModel(
  state: AmpProgressState,
  built: readonly { id: AmpModuleId; title: string }[],
  check?: { passed: boolean },
): { units: AmpEndUnit[]; cleared: Set<string> } {
  const final = state.bestFinal ?? state.final;
  const cleared = new Set<string>(built.filter((x) => state.modules[x.id]?.done).map((x) => x.id));
  if (state.bestFinal?.passed || state.final?.passed) cleared.add('final');
  const units: AmpEndUnit[] = [
    ...built.map((x) => ({ id: x.id, label: x.title })),
    {
      id: 'final',
      label: 'Final assessment',
      kind: 'check' as const,
      detail: final ? `Best so far: ${Math.round(final.scorePct)}%${final.passed ? ' — passed' : ''}` : 'In Module 8 — not yet submitted',
    },
  ];
  if (check) {
    units.push({ id: AMP_CHECK_UNIT, label: 'Check your understanding', kind: 'check', detail: 'Every answer correct — retry until you are.' });
    if (check.passed) cleared.add(AMP_CHECK_UNIT);
  }
  return { units, cleared };
}
