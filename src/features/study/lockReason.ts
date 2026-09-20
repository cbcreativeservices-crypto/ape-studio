/**
 * lockReason — what a learner is told when they tap a POWERED-OFF rack panel.
 *
 * ⛔ THE DARK PANEL IS NOT A BUG, AND THIS DOES NOT LIGHT IT. The staged power
 * sequence is the owner's design (2026-08-11): a stage that has not unlocked
 * renders dead — dark icon, unlit screen, a clear cap with no colour — and the
 * sequence itself is meant to be the guidance. The panel stays exactly as dark
 * as it was.
 *
 * What changed (2026-09-19) is what a TAP does. It did nothing at all: no
 * movement, no sound, no message. A user who taps a dead panel has already
 * told you they do not know why it is dead, and answering that costs nothing
 * and reveals nothing the rack was hiding. The agent driving the Pixel spent a
 * whole investigation on "why won't Scenarios open" that one sentence would
 * have ended.
 *
 * Kept as a pure function in its own module so the wording is testable and so
 * the two call sites (a method panel and the quiz panel) cannot drift apart.
 */

/** The gate state the dashboard already computes, passed in rather than re-derived. */
export type MethodGates = {
  flashcardsSeenAll: boolean;
  fillInBlankComplete: boolean;
  matchingComplete: boolean;
  scenariosComplete: boolean;
};

/** Which panel was tapped. */
export type LockedPanel = 'fill_in_blank' | 'matching' | 'scenarios' | 'quiz';

const LABEL = {
  flashcards: 'Flashcards',
  fill_in_blank: 'Fill in the Blank',
  matching: 'Matching',
  scenarios: 'Scenarios',
} as const;

/**
 * The methods that must finish before `panel` powers on, in rack order, with
 * the ones already done left out — a learner should be told what is LEFT, not
 * re-read the whole ladder.
 */
export function remainingFor(panel: LockedPanel, g: MethodGates): string[] {
  const out: string[] = [];
  if (!g.flashcardsSeenAll) out.push(LABEL.flashcards);
  if (panel === 'fill_in_blank' || panel === 'matching') return out;
  if (!g.fillInBlankComplete) out.push(LABEL.fill_in_blank);
  if (!g.matchingComplete) out.push(LABEL.matching);
  if (panel === 'scenarios') return out;
  if (!g.scenariosComplete) out.push(LABEL.scenarios);
  return out;
}

/** "A, B and C" — an Oxford-free list, because this is one spoken sentence. */
function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export const LOCK_TITLE = 'NOT POWERED YET';

/**
 * The body of the notice. Two cases, and the second one matters:
 *
 *  • Something is genuinely left → name it.
 *  • NOTHING is left → say that, and say the rack needs a moment. A method
 *    finished offline has not synced yet, so the gate can read closed for a
 *    beat after the work is actually done. Telling that learner "finish X"
 *    when X is finished is worse than saying nothing; telling them the truth
 *    ("it should open shortly — leave and come back") is the only honest line.
 *
 * ⚠️ This used to say "Pull down to refresh". There is no RefreshControl on
 * the Dashboard — the only one in the app is on AwardProgressScreen — and the
 * rack uses a VERTICAL DRAG to jog between topics, so a learner following that
 * instruction moved off the topic they were trying to unlock.
 */
export function lockReason(panel: LockedPanel, g: MethodGates): string {
  const left = remainingFor(panel, g);
  const target = panel === 'quiz' ? 'the Topic Quiz' : LABEL[panel];
  if (left.length === 0) {
    return `${target} should be open — your progress may not have finished syncing yet. Leave this screen and come back in a moment, and it will be on.`;
  }
  return `Finish ${joinList(left)} to power on ${target}.`;
}
