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

function rowFor(leaf: LabLeaf & { key: string }, why?: string): LabRequirementRow {
  const p = labProgress(leaf.key);
  return {
    key: leaf.key,
    name: leaf.name,
    route: leaf.route,
    params: leaf.params,
    done: isLabDone(leaf.key),
    cleared: p.cleared,
    total: p.total,
    why,
  };
}

/** The universal prerequisite set — every Audio Fundamentals lab. */
export function fundamentalsRequirements(): LabRequirementRow[] {
  return fundamentalsLeaves().map((l) => rowFor(l as LabLeaf & { key: string }));
}

/** Find a lab leaf anywhere in the catalog by its key (member labs included). */
function leafByKey(key: string): (LabLeaf & { key: string }) | null {
  for (const cat of LAB_CATEGORIES) {
    for (const leaf of leavesOf(cat)) if (leaf.key === key) return leaf as LabLeaf & { key: string };
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

/** Rolled-up progress across a set of rows — "9 of 15 labs complete". */
export function requirementTally(rows: readonly LabRequirementRow[]): { done: number; total: number; pct: number } {
  const done = rows.filter((r) => r.done).length;
  const total = rows.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}
