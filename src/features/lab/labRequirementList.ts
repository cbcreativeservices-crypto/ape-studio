/**
 * What a learner must finish in the labs, and how far along they are.
 *
 * Two audiences, one source of truth:
 *   · the end-of-lab completion screen — "what is left in THIS lab"
 *   · the Lab Requirements sheet on Enrollments — "what is left across the
 *     labs your credential needs"
 *
 * ── THE RULE THIS ENCODES (owner 2026-09-20) ────────────────────────────────
 * Every lab in the AUDIO FUNDAMENTALS area is a universal prerequisite: if it
 * is in there, it must be completed for credit, for every certificate and
 * every program. Member labs are the variable part — a credential may require
 * a few of them on top. A lab completed once counts everywhere it is required;
 * nobody repeats a lab because two credentials both wanted it.
 *
 * ⚠️ THE FUNDAMENTALS LIST IS DERIVED, NEVER HAND-WRITTEN. It is read out of
 * `labCatalog` at call time, so a lab added to that area is required the moment
 * it appears — which is the whole point of the owner's ruling. A second
 * hand-kept list would drift the first time someone adds a lab and forgets, and
 * the failure would be silent: a learner told they were finished when they were
 * not.
 */
import { LAB_CATEGORIES, type LabCategory, type LabLeaf } from '../../screens/lab/labCatalog';
import { isLabDone, labProgress } from './labCompletion';
import { describeLabKey } from '../../data/labKeyCatalog';
import { isTrainingKey, trainingLabByRoute } from './trainingLabKeys';

export type LabRequirementRow = {
  /** Stable lab key — the completion system's id. */
  key: string;
  name: string;
  /** Where tapping the row goes. A leaf with no route is a read-only entry;
   *  the sheet renders it without a chevron rather than a dead tap target. */
  route?: LabLeaf['route'];
  params?: object;
  done: boolean;
  /** Units cleared / total, when the lab reports them. total 0 = not unit-tracked. */
  cleared: number;
  total: number;
  /** Why this credential needs it. Absent for the universal fundamentals. */
  why?: string;
  /**
   * Does this row record completion at all?
   *
   * ⛔ ONLY WHAT CAN ACTUALLY BE COMPLETED IS TRACKED (rewritten 2026-10-13).
   * Tracked: the 15 `af_*` fundamentals labs (units in labCompletion) and —
   * since the owner tied the training labs to the certificates — every
   * training key in src/features/lab/trainingLabKeys.ts (tr_ whole labs, mk_
   * Miking lessons, mxb_/mxa_ Mixing pages, ear_ Ear Training modules), each
   * with a real completion rule (features/lab/trainingCompletion.ts) that
   * reports to the server. A training lab named by its ROUTE is tracked
   * through its tr_ key. `done` is THIS DEVICE's record (complete locally, or
   * credit already accepted by the server); the server stays the judge for
   * the final exam (start_final_exam → labs_incomplete).
   * Anything else is NOT tracked: drawing it an empty checkbox would promise
   * a tick the app can never give — untracked rows render as links, not as
   * tasks. (A practice lab whose understanding-check questions are not
   * authored yet is tracked but cannot be ticked until they land.)
   */
  tracked: boolean;
};

/** Every leaf a category holds, whatever shape it is. A HUB category has no
 *  leaves of its own — it opens a lab that owns its own drill-down. */
function leavesOf(cat: LabCategory): LabLeaf[] {
  const own = cat.kind === 'list' ? [...(cat.labs ?? []), ...(cat.families ?? []).flatMap((f) => f.labs)] : [];
  return [...own, ...(cat.extraLabs ?? [])];
}

/** Every leaf in the Audio Fundamentals section that carries a lab key. */
function fundamentalsLeaves(): LabLeaf[] {
  const out: LabLeaf[] = [];
  for (const cat of LAB_CATEGORIES) {
    if (cat.section !== 'fundamentals') continue;
    for (const leaf of leavesOf(cat)) if (leaf.key) out.push(leaf);
  }
  return out;
}

function rowFor(leaf: LabLeaf, why?: string): LabRequirementRow {
  // A training lab by route is tracked through its tr_ key.
  const training = !leaf.key && leaf.route ? trainingLabByRoute(leaf.route as string) : undefined;
  if (training) {
    return { key: training.key, name: leaf.name, route: leaf.route, params: leaf.params, done: isLabDone(training.key), cleared: 0, total: 0, why, tracked: true };
  }
  // A leaf with no `key` is not in the completion system at all.
  const tracked = !!leaf.key;
  const p = tracked ? labProgress(leaf.key as string) : { cleared: 0, total: 0 };
  return {
    key: leaf.key ?? (leaf.route as string) ?? leaf.name,
    name: leaf.name,
    route: leaf.route,
    params: leaf.params,
    done: tracked ? isLabDone(leaf.key as string) : false,
    cleared: p.cleared,
    total: p.total,
    why,
    tracked,
  };
}

/** The universal prerequisite set — every Audio Fundamentals lab. */
export function fundamentalsRequirements(): LabRequirementRow[] {
  return fundamentalsLeaves().map((l) => rowFor(l));
}

/**
 * Find a lab leaf by its key OR its route.
 *
 * ⛔ THE ROUTE FALLBACK IS NOT A CONVENIENCE — IT IS THE ONLY WAY MEMBER LABS
 * RESOLVE. Exactly 15 leaves in the whole catalog carry a `key`, and all 15 are
 * the `af_*` fundamentals. Every training lab is identified by its route, which
 * is what `labRequirements.ts` uses. Matching on `key` alone silently returned
 * nothing for every member requirement, and because unresolved keys are dropped
 * by design the failure showed as an empty list rather than an error.
 */
function leafByKey(key: string): LabLeaf | null {
  for (const cat of LAB_CATEGORIES) {
    for (const leaf of leavesOf(cat)) if (leaf.key === key || leaf.route === key) return leaf;
  }
  return null;
}

/**
 * Resolve a requirement's SERVER KEY (tr_ / mk_ / mxb_ / mxa_ / ear_, see
 * src/data/labKeyCatalog.ts) to the catalog leaf that opens it, plus the row
 * name. A whole lab keeps its catalog name; a lesson / page / module is named
 * for itself ("Miking: Kick Drum") but opens its lab's tile — a Miking lesson
 * the family tile whose `params.lab` is the lesson's lab. Anything else falls
 * back to `leafByKey` (an `af_*` key or a route).
 */
function leafForRequirement(key: string): { leaf: LabLeaf; name: string } | null {
  const info = describeLabKey(key);
  if (!info) {
    const leaf = leafByKey(key);
    return leaf ? { leaf, name: leaf.name } : null;
  }
  for (const cat of LAB_CATEGORIES) {
    for (const leaf of leavesOf(cat)) {
      if (leaf.route !== info.route) continue;
      if (info.params && (leaf.params as { lab?: string } | undefined)?.lab !== info.params.lab) continue;
      return { leaf, name: info.area === 'training' ? leaf.name : info.name };
    }
  }
  return null;
}

/**
 * The full requirement list for one credential: the fundamentals, then any
 * member labs it specifically needs.
 *
 * `extra` is passed in rather than imported so this module stays independent of
 * the credential↔lab mapping while that is being authored. A key with no leaf
 * in the catalog is DROPPED, not rendered as a dead row — a requirement the
 * learner cannot open is worse than one they cannot see.
 */
export function requirementsForCredential(
  extra: readonly { key: string; why?: string }[] = [],
): { fundamentals: LabRequirementRow[]; member: LabRequirementRow[] } {
  const member: LabRequirementRow[] = [];
  const seen = new Set<string>();
  for (const req of extra) {
    if (seen.has(req.key)) continue; // one credential listing it twice
    seen.add(req.key);
    const hit = leafForRequirement(req.key);
    // Row key = the requirement's server key: several lessons share one leaf
    // (the Miking family tile, the Mixing lab), and the list keys rows by it.
    if (!hit) continue;
    const row = { ...rowFor(hit.leaf, req.why), key: req.key, name: hit.name };
    // A server training key is tracked under ITSELF (a Miking lesson is one
    // row of the family tile's leaf, not the whole tile).
    if (isTrainingKey(req.key)) Object.assign(row, { tracked: true, done: isLabDone(req.key), cleared: 0, total: 0 });
    member.push(row);
  }
  return { fundamentals: fundamentalsRequirements(), member };
}

/**
 * Rolled-up progress — "9 of 15 labs complete".
 *
 * ⚠️ COUNTS ONLY TRACKED ROWS. Including an untracked row in the denominator
 * would cap every learner below 100% forever, which reads as broken and is
 * unfixable by any amount of work on their part. (Training labs and lessons
 * are tracked since 2026-10-13 — see LabRequirementRow.tracked.)
 */
export function requirementTally(rows: readonly LabRequirementRow[]): { done: number; total: number; pct: number } {
  const tracked = rows.filter((r) => r.tracked);
  const done = tracked.filter((r) => r.done).length;
  const total = tracked.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}
