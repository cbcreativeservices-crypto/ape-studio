/**
 * stageplot/spHistory — UNDO and REDO for one open project, as a pure stack
 * of project states (must-do D60). The editor keeps one of these in memory;
 * nothing here is saved, so a restart begins a new history.
 *
 * Three rules beyond "a stack":
 *
 *   • ONLY A REAL CHANGE IS A STEP. An edit that leaves every row as it was
 *     is not recorded, and it never moves the revision: tapping into a field
 *     and out again on a document that was already shared must not turn
 *     revision 3 into revision 4.
 *   • SHARING IS NOT A STEP. Freezing a revision (an export), "Ready to
 *     advance", back to Draft and "venue confirmed" change what the document
 *     IS CALLED, not what it says. They replace the present state in place,
 *     so UNDO goes to the last real edit instead of quietly un-sharing.
 *   • A SHARED REVISION NUMBER IS NEVER USED AGAIN. If UNDO (or REDO) lands on
 *     a state from before a revision was shared, that state says something
 *     different from what was sent, so it takes the next revision number and
 *     is a Draft. The same rule spModel keeps for an ordinary edit.
 *
 * Pure: no React, no storage, no clock.
 */
import type { SpProject } from './spTypes.ts';

/** How many earlier states UNDO can reach. */
export const SP_HISTORY_CAP = 60;

export type SpHistory = {
  /** Earlier states, oldest first. */
  past: SpProject[];
  present: SpProject;
  /** States UNDO stepped back from, nearest first. */
  future: SpProject[];
};

export const spHistoryStart = (p: SpProject): SpHistory => ({ past: [], present: p, future: [] });

export const spCanUndo = (h: SpHistory): boolean => h.past.length > 0;
export const spCanRedo = (h: SpHistory): boolean => h.future.length > 0;

/** What a project SAYS, apart from what it is called: everything except the
 *  revision, what was shared, the status and the time stamp. */
function contentKey(p: SpProject): string {
  // Snap is never printed, and the grid only on a plot drawn to scale: they
  // are screen preferences there, not what the document says.
  const toScale = !!(p.stage.width && p.stage.depth);
  const stage = { ...p.stage, snap: true, grid: toScale ? p.stage.grid : true };
  const named: SpProject = { ...p, stage, revision: 0, frozenRevision: 0, status: 'draft', venueConfirmed: false, modifiedAt: 0 };
  return JSON.stringify(named);
}

/** The screen preferences kept in the project (see contentKey). */
const sameView = (a: SpProject, b: SpProject): boolean => a.stage.snap === b.stage.snap && a.stage.grid === b.stage.grid;

/** True when two states say the same thing (they may differ in revision,
 *  status and time). */
export const spSameContent = (a: SpProject, b: SpProject): boolean => a === b || contentKey(a) === contentKey(b);

/** A real edit: the present becomes the newest earlier state, and REDO is
 *  emptied (a new edit starts a new line of history). */
export function spHistoryPush(h: SpHistory, next: SpProject): SpHistory {
  const past = [...h.past, h.present];
  while (past.length > SP_HISTORY_CAP) past.shift();
  return { past, present: next, future: [] };
}

/** Not a step: the present state is replaced where it stands. */
export const spHistoryReplace = (h: SpHistory, next: SpProject): SpHistory => ({ past: h.past, present: next, future: h.future });

/** Record the result of one change, by the three rules above. Returns the
 *  SAME history object when the change did nothing. */
export function spHistoryApply(h: SpHistory, next: SpProject): SpHistory {
  if (next === h.present) return h;
  if (!spSameContent(next, h.present)) return spHistoryPush(h, next);
  // Same rows. An edit that changed nothing must not move the revision…
  // (Unless the move IS the sharing: an export that finished after the
  // project was edited freezes the number that went out and puts what is on
  // screen on the next one, spAfterExport. In an empty edit nothing was
  // shared, so `frozenRevision` stands still, and that is what is refused.)
  if (next.revision !== h.present.revision && next.frozenRevision === h.present.frozenRevision) return h;
  // …and sharing / status is kept, but is not something UNDO steps over.
  // (A switch of Snap, or of an unprinted grid, is kept the same way.)
  const same = next.frozenRevision === h.present.frozenRevision && next.status === h.present.status && next.venueConfirmed === h.present.venueConfirmed && sameView(next, h.present);
  return same ? h : spHistoryReplace(h, next);
}

/** A state taken from history, made safe to show NOW: what was shared since
 *  it was recorded stays shared, and a state that differs from the shared
 *  document takes the next revision number, as a Draft. */
export function spCarryShared(target: SpProject, current: SpProject): SpProject {
  if (target.frozenRevision >= current.frozenRevision) return target;
  const frozen = current.frozenRevision;
  return { ...target, frozenRevision: frozen, revision: Math.max(target.revision, frozen + 1), status: 'draft', venueConfirmed: false };
}

/** A state from history keeps the screen preferences set NOW (Snap, and an
 *  unprinted grid): UNDO reverses edits, not a switch that is not one. */
function keepView(target: SpProject, now: SpProject): SpProject {
  const toScale = !!(target.stage.width && target.stage.depth);
  const grid = toScale ? target.stage.grid : now.stage.grid;
  if (target.stage.snap === now.stage.snap && target.stage.grid === grid) return target;
  return { ...target, stage: { ...target.stage, snap: now.stage.snap, grid } };
}

export function spHistoryUndo(h: SpHistory): SpHistory {
  if (!h.past.length) return h;
  const past = h.past.slice(0, -1);
  const target = h.past[h.past.length - 1];
  return { past, present: keepView(spCarryShared(target, h.present), h.present), future: [h.present, ...h.future] };
}

export function spHistoryRedo(h: SpHistory): SpHistory {
  if (!h.future.length) return h;
  const [target, ...future] = h.future;
  return { past: [...h.past, h.present], present: keepView(spCarryShared(target, h.present), h.present), future };
}
