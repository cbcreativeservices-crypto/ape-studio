/**
 * eqEnd — what the EQ Lab's WHAT'S LEFT screen lists. ONE builder for both
 * callers (EqLabHomeScreen's SEE WHAT'S LEFT and EqModuleScreen's FINISH), so
 * the two can never disagree.
 *
 * THE CHECK IS A UNIT (D41 J2, owner 2026-11-01; the Mic Selection / Vacuum
 * Tube fix): the EQ Lab banks no per-module credit — its understanding check
 * ('eq', trainingLabKeys tr_eq, completion 'understanding') is what completes
 * it for certificates. So the check is the end screen's last row (kind
 * 'check') and LAB COMPLETE can never show above an unpassed check. It is
 * cleared only from the banked labCompletion record, which a practice run
 * never clears (credit is never removed).
 */
import { UNDERSTANDING_UNIT } from '../../../features/lab/understanding';
import type { LabEndUnit } from '../kit/labEnd';

/** Every module in order, then the check as a CHECK row when questions are
 *  authored for this lab. */
export function eqEndUnits(modules: readonly { id: string; title: string }[], hasCheck: boolean): LabEndUnit[] {
  const units: LabEndUnit[] = modules.map((m) => ({ id: m.id, label: m.title }));
  if (hasCheck) units.push({ id: UNDERSTANDING_UNIT, label: 'Check your understanding', kind: 'check', detail: 'Every answer correct — retry until you are.' });
  return units;
}

/** Modules opened (device progress) plus the check once it is banked. */
export function eqEndCleared(visited: ReadonlySet<string>, banked: ReadonlySet<string>): ReadonlySet<string> {
  const out = new Set(visited);
  if (banked.has(UNDERSTANDING_UNIT)) out.add(UNDERSTANDING_UNIT);
  return out;
}
