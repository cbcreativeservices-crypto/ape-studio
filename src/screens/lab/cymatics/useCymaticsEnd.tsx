/**
 * The Cymatics what's-left screen's model, shared by the HOME (SEE WHAT'S
 * LEFT) and the module stepper (FINISH). The lab's certificate credit is its
 * understanding check (trainingLabKeys: completion 'understanding'), yet the
 * module path's end screen listed only the eight modules, so a learner who
 * followed START HERE → module 8 → FINISH never met the check (novice audit
 * 2026-11-14, G7_CymaticsLab: "reachable only from the studios"). The check
 * row and the check itself now sit on that screen (D41 K6: the row moves the
 * screen to the check drawn here), as in the Tube, Amp and Mic Selection labs.
 */
import { LabUnderstandingBlock } from '../../../components/LabUnderstandingBlock';
import { useLabClearedUnits, useLabCompletionUnreadable } from '../../../features/lab/labCompletion';
import { UNDERSTANDING_UNIT, understandingFor } from '../../../features/lab/understanding';
import type { LabEndUnit } from '../kit/labEnd';
import { CYMATICS_MODULES } from './modules/registry';

export const CYMATICS_CHECK_ROW = UNDERSTANDING_UNIT;

export function useCymaticsEnd(visited: ReadonlySet<string>, visitsUnreadable: boolean) {
  const hasCheck = !!understandingFor('cymatics');
  const banked = useLabClearedUnits('cymatics');
  const completionUnreadable = useLabCompletionUnreadable();
  const units: LabEndUnit[] = CYMATICS_MODULES.map((m) => ({ id: m.id, label: m.title }));
  if (hasCheck) units.push({ id: CYMATICS_CHECK_ROW, label: 'Check your understanding', kind: 'check', detail: 'Every answer correct — retry until you are.' });
  const cleared = new Set<string>(visited);
  if (hasCheck && banked.has(UNDERSTANDING_UNIT)) cleared.add(CYMATICS_CHECK_ROW);
  return {
    units,
    cleared,
    unreadable: visitsUnreadable || (hasCheck && completionUnreadable),
    shownHereId: hasCheck ? CYMATICS_CHECK_ROW : undefined,
    /** The rule every module row shares, said once (S2 §4). */
    // Work done, not opened (owner decision 1, 2026-11-14).
    howItCounts: 'A module counts once you work through it and move on with NEXT › (FINISH › on the last). Modules already counted stay counted. The check counts once every answer is right.',
    extra: hasCheck ? <LabUnderstandingBlock labId="cymatics" labTitle="Cymatics Lab" /> : undefined,
  };
}
