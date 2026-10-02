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
 */
import type { AmpModuleId } from './ampContent';
import type { AmpProgressState } from './ampProgress';

export type AmpEndUnit = { id: string; label: string; detail?: string; kind?: 'unit' | 'check' };

export function ampEndModel(
  state: AmpProgressState,
  built: readonly { id: AmpModuleId; title: string }[],
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
  return { units, cleared };
}
