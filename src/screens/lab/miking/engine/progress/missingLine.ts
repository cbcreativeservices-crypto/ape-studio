/**
 * The what's-left row line of a Miking module (lab fix round 2026-11-14, F9
 * phase 2, the S2 end-screen rule; owner approval of the fix round: "Begin
 * fixing all bugs found and do obvious ... fixes as you suggestted in the
 * report"). Each unfinished row names what is STILL missing on that module,
 * from the learner's own answers and activity, never a rule every row shares
 * (that one is said once: MIKING_HOW_IT_COUNTS).
 *
 * Pure (no React Native), so the tests reach it directly.
 */
import type { PageContent } from '../model/types.ts';

/** The rule every row shares, said once above the list. */
export const MIKING_HOW_IT_COUNTS = 'A module counts the moment its activity is done and its checks are answered (a retry costs nothing); a module with neither counts when you press NEXT at its last step.';

/** The common activities, in the words a row can carry. Others: the
 *  module's own requirement note. */
const ACTIVITY: Readonly<Record<string, string>> = {
  setupsSeen: 'step through every core starting setup',
  symptoms: 'choose the first check for every symptom',
  twoZones: 'rest the mic in two different blue zones',
  polarityVsDelay: 'flip polarity both ways and move a mic',
  wedgeInNull: 'put the wedge in the mic’s quiet side (live)',
};

export function missingLine(credit: PageContent['credit'], answers: Readonly<Record<string, boolean>>, interactiveDone: ReadonlySet<string>): string {
  const left = credit.scenarios.filter((id) => !(id in answers)).length;
  const act = credit.interactive && !interactiveDone.has(credit.interactive) ? credit.interactive : null;
  if (!credit.scenarios.length && !credit.interactive) return 'Still to do: read it to its last step and press NEXT.';
  const parts: string[] = [];
  if (act) parts.push(ACTIVITY[act] ?? 'its activity');
  if (left) parts.push(`answer ${left === credit.scenarios.length ? (left === 1 ? 'its check' : `its ${left} checks`) : `${left} more ${left === 1 ? 'check' : 'checks'}`}`);
  if (!parts.length) return 'Still to do: open it once more; it counts as you arrive.';
  const line = `Still to do: ${parts.join(', then ')}.`;
  return act && !ACTIVITY[act] ? `${line} ${credit.note}` : line;
}
