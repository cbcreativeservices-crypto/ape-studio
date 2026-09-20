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
   * Does this lab record progress at all?
   *
   * ⛔ ONLY THE 15 `af_*` FUNDAMENTALS LABS DO. Verified 2026-09-20: every
   * `markLabUnit` call site in the app passes an `af_*` key, and no training
   * leaf in the catalog even carries a `key`. A member lab therefore cannot be
   * completed, and drawing it an empty checkbox would promise a tick the app
   * can never give — the exact class of lie this whole checklist exists to
   * end. Untracked rows render as links, not as tasks.
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
 * The full requirement list for one credential: the fundamentals, then any
 * member labs it specifically needs.
 *
 * `extra` is passed in rather than imported so this module stays independent of
 * the credential↔lab mapping while that is being authored. A key with no leaf
 * in the catalog is DROPPED, not rendered as a dead row — a requirement the
 * learner cannot open is worse than one they cannot see.
 */
export function requirementsForCredential(
  extra: readonly { labKey: string; why?: string }[] = [],
): { fundamentals: LabRequirementRow[]; member: LabRequirementRow[] } {
  const member: LabRequirementRow[] = [];
  const seen = new Set<string>();
  for (const req of extra) {
    if (seen.has(req.labKey)) continue; // one credential listing it twice
    seen.add(req.labKey);
    const leaf = leafByKey(req.labKey);
    if (leaf) member.push(rowFor(leaf, req.why));
  }
  return { fundamentals: fundamentalsRequirements(), member };
}

/**
 * Rolled-up progress — "9 of 15 labs complete".
 *
 * ⚠️ COUNTS ONLY TRACKED LABS. Including untracked member labs in the
 * denominator would cap every learner below 100% forever, which reads as
 * broken and is unfixable by any amount of work on their part.
 */
export function requirementTally(rows: readonly LabRequirementRow[]): { done: number; total: number; pct: number } {
  const tracked = rows.filter((r) => r.tracked);
  const done = tracked.filter((r) => r.done).length;
  const total = tracked.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}
