/**
 * enrollmentPlan — pure set math for bundle enrol / remove (bug hunt
 * 2026-09-29). No React, no storage: importable by node tests.
 *
 * Topics are SHARED between bundles (a cert and a program can both contain the
 * same topic), so a bundle action must only touch the topics it OWNS:
 *   - enrolling a bundle adds its NEW topics unloaded, and must NOT unload a
 *     topic that was already enrolled (and maybe loaded) for another bundle;
 *   - removing a bundle must NOT remove a topic another enrolled bundle still
 *     contains.
 */

/** The topics in `gsList` not already enrolled — the only ones an "add bundle"
 *  may set unloaded. Order kept, duplicates dropped. */
export function freshGs(enrolledGs: Iterable<number>, gsList: readonly number[]): number[] {
  const have = new Set(enrolledGs);
  const out: number[] = [];
  for (const gs of gsList) {
    if (have.has(gs)) continue;
    have.add(gs);
    out.push(gs);
  }
  return out;
}

/**
 * What a "study THIS topic" request (STUDY NOW's `focusGs`) must do to the
 * enrollment list so the topic reaches the Dashboard deck, which carries only
 * ACTIVE enrolled topics (student report 2026-09-30: Explore → Post-Production
 * Audio → STUDY NOW landed on Pro Audio Safety).
 *   'none'     — already enrolled and active;
 *   'activate' — enrolled but switched off (the 09-27 fix);
 *   'enroll'   — NOT ENROLLED AT ALL. The credential's bundle can outlive its
 *                topics (Clear enrollment list kept bundles until 2026-09-30,
 *                and a topic can be removed on its own), so the popup still
 *                says ENROLLED and offers STUDY NOW for a topic the deck can
 *                never receive. The armed focus waited forever on topic 0.
 */
export function studyFocusAction(
  enrolled: readonly { gs: number; active: boolean }[],
  gs: number,
): 'none' | 'activate' | 'enroll' {
  const e = enrolled.find((x) => x.gs === gs);
  if (!e) return 'enroll';
  return e.active ? 'none' : 'activate';
}

/** The topics of a bundle being removed that may leave the enrollment list:
 *  not kept by `keep` (the mandatory free topics) and not contained in any
 *  OTHER still-enrolled bundle. */
export function removableOnBundleDrop(
  topics: readonly number[],
  otherBundleTopics: readonly (readonly number[])[],
  keep: (gs: number) => boolean = () => false,
): number[] {
  const shared = new Set<number>();
  for (const t of otherBundleTopics) for (const gs of t) shared.add(gs);
  return topics.filter((gs) => !keep(gs) && !shared.has(gs));
}
