/**
 * Custom Calculator Workflows — persistence (owner spec 2026-08-06).
 *
 * AsyncStorage-backed CRUD for workflows, in-progress runs (drafts survive an
 * app restart), projects, saved results, favorites and recents. Deliberately
 * simple: one JSON blob per collection under stable keys — no migrations
 * framework, no version history.
 *
 * CORRUPTION-SAFE (spec: an old or damaged workflow must never crash the app):
 * every load validates shape; unreadable blobs are set aside under a
 * `:damaged` key (so nothing is silently destroyed) and the collection loads
 * as empty — the UI can offer repair/replacement.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportUnhandledSaveFailure } from '../../../features/storage/saveFailureNotice';
import type { Project, SavedRunSummary, Workflow, WorkflowRun } from './workflowModel';

const KEYS = {
  workflows: 'ape:calcwf:workflows',
  runs: 'ape:calcwf:runs',
  projects: 'ape:calcwf:projects',
  results: 'ape:calcwf:results',
  favorites: 'ape:calcwf:favorites', // template/workflow ids
  recents: 'ape:calcwf:recents', // most-recent-first workflow ids
} as const;

type CollectionKey = (typeof KEYS)[keyof typeof KEYS];

// ---------------------------------------------------------------------------
// Account-wipe fence (night bug pass 3, 2026-10-01)
// ---------------------------------------------------------------------------

/** Bumped by resetLocal() at every account wipe. Every write carries the
 *  generation it was ASKED for in, and is dropped if a wipe has happened since:
 *  a still-mounted runner's 1 s autosave or beforeRemove save, or a project
 *  editor SAVE, landing after the sign-out sweep otherwise wrote the departing
 *  account's draft/project back under `ape:calcwf:*` for the next person.
 *  Screens that hold an account's data in state pass their MOUNT generation, so
 *  a save they request after the wipe is fenced too. */
let generation = 0;
export function workflowGeneration(): number {
  return generation;
}

// ---------------------------------------------------------------------------
// Load / save with damage quarantine
// ---------------------------------------------------------------------------

/** The empty stand-ins `loadList` returns for a list it could not READ (hunt 5,
 *  2026-10-03 — the hunt-4 Cymatics gallery fix, patternStore): Saved Results
 *  and My Workflows said "Nothing saved yet" over every saved row. */
const unreadableLists = new WeakSet<readonly unknown[]>();
/** True when this list is the empty stand-in for a read that FAILED. */
export function workflowListUnreadable(list: readonly unknown[]): boolean {
  return unreadableLists.has(list);
}

async function loadList<T>(key: CollectionKey, validate: (x: unknown) => x is T): Promise<T[]> {
  const list = await readList(key, validate, false);
  if (list) return list;
  const none: T[] = [];
  unreadableLists.add(none);
  return none;
}

/** loadList, but `null` when the storage READ itself failed (full-app run 1,
 *  2026-10-01). A failed getItem is not a damaged blob: it used to land in the
 *  corruption branch, which REMOVED the key whenever the retry read succeeded,
 *  and either way returned [] — so the next upsert wrote `[item]` over the
 *  whole collection and reported "saved". (Android's AsyncStorage cannot read a
 *  row past ~2 MB at all, so a large results list hit this on every save.)
 *  Writers refuse on null; readers show empty without touching the data.
 *
 *  `inChain`: is this read running on the write chain (serialWrite)? The
 *  quarantine below WRITES the collection back. From a plain list read (off the
 *  chain) that write used the snapshot read before any queued upsert landed, so
 *  a SAVE whose write slipped in between was erased by it after reporting
 *  success (hunt 5, 2026-10-03). Off the chain the quarantine now runs ON the
 *  chain instead — re-reading there, after every queued write — and the reader
 *  gets that fresh list. Only a damaged collection takes this path. */
async function readList<T>(key: CollectionKey, validate: (x: unknown) => x is T, inChain = true): Promise<T[] | null> {
  const gen = generation;
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
  const quarantineOnChain = (fallback: T[]): Promise<T[] | null> =>
    gen === generation ? serialWrite(() => readList(key, validate, true)) : Promise.resolve(fallback);
  try {
    if (raw == null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    // Keep the valid rows; quarantine the rest instead of crashing or deleting.
    const good = parsed.filter(validate);
    if (good.length !== parsed.length && !inChain) return await quarantineOnChain(good);
    // Not after a wipe: these rows were read from the departing account.
    if (good.length !== parsed.length && gen === generation) {
      const bad = parsed.filter((x) => !validate(x));
      // Silent on purpose: quarantining damaged rows is the app's housekeeping.
      void AsyncStorage.setItem(`${key}:damaged`, JSON.stringify(bad)).catch(() => {});
      void AsyncStorage.setItem(key, JSON.stringify(good)).catch(() => {});
    }
    return good;
  } catch {
    // Whole blob unreadable (it was read, it is not JSON) — quarantine it and
    // start empty. Removed only once the copy is safely set aside.
    if (!inChain) return await quarantineOnChain([]);
    try {
      if (gen === generation) {
        await AsyncStorage.setItem(`${key}:damaged`, raw as string);
        await AsyncStorage.removeItem(key);
      }
    } catch {}
    return [];
  }
}

/** Favourites / recents: a list of ids. `null` when the READ failed (full-app
 *  run 2, 2026-10-01) — writers refuse rather than overwrite it. A blob that
 *  was read but is not a JSON array still counts as empty, as before. */
async function readIds(key: CollectionKey): Promise<string[] | null> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
  try {
    const v: unknown = raw == null ? [] : JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** `report`: the caller shows nothing for a refusal (a ▲▼ reorder or a ★
 *  that just does not move), so the shared notice says it (owner 2026-10-03).
 *  Default false: the save / delete callers surface "failed save" themselves. */
async function saveList<T>(key: CollectionKey, list: T[], gen: number, report = false): Promise<boolean> {
  // Wiped since this write was asked for — nothing of that account is written.
  if (gen !== generation) return false;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    if (report && gen === generation) reportUnhandledSaveFailure();
    return false; // caller surfaces "failed save" honestly
  }
}

// Shape guards — intentionally shallow (id + the fields the UI dereferences).
const isWorkflow = (x: unknown): x is Workflow =>
  !!x && typeof x === 'object' && typeof (x as Workflow).id === 'string' &&
  typeof (x as Workflow).name === 'string' && Array.isArray((x as Workflow).steps);
const isRun = (x: unknown): x is WorkflowRun =>
  !!x && typeof x === 'object' && typeof (x as WorkflowRun).id === 'string' &&
  typeof (x as WorkflowRun).workflowId === 'string' && Array.isArray((x as WorkflowRun).steps);
const isProject = (x: unknown): x is Project =>
  !!x && typeof x === 'object' && typeof (x as Project).id === 'string' &&
  typeof (x as Project).name === 'string' && Array.isArray((x as Project).values);
const isResult = (x: unknown): x is SavedRunSummary =>
  !!x && typeof x === 'object' && typeof (x as SavedRunSummary).id === 'string' &&
  Array.isArray((x as SavedRunSummary).inputs) && Array.isArray((x as SavedRunSummary).results);

// ---------------------------------------------------------------------------
// Write serialisation (bug hunt 2026-09-29)
// ---------------------------------------------------------------------------

/** Every write below is a read-modify-write of one whole JSON blob. Two in
 *  flight at once (a double-tapped SAVE, a save racing a reorder, two quick
 *  favourite toggles) both read the same old list and the later write erased
 *  the earlier one. Writes now run one at a time on this chain. A failed write
 *  never jams it — the chain always continues from a settled promise. */
let writeChain: Promise<unknown> = Promise.resolve();
function serialWrite<R>(fn: () => Promise<R>): Promise<R> {
  const run = writeChain.then(fn, fn);
  writeChain = run.catch(() => {});
  return run;
}

// ---------------------------------------------------------------------------
// Public CRUD — upsert-by-id everywhere; lists stay newest-first
// ---------------------------------------------------------------------------

function upsert<T extends { id: string }>(
  key: CollectionKey,
  validate: (x: unknown) => x is T,
  item: T,
  keepPlace = false,
  gen = generation,
): Promise<boolean> {
  return serialWrite(async () => {
    const list = await readList(key, validate);
    if (list === null) return false; // could not read it — never overwrite it
    const at = keepPlace ? list.findIndex((w) => w.id === item.id) : -1;
    const next = at >= 0 ? list.map((w, i) => (i === at ? item : w)) : [item, ...list.filter((w) => w.id !== item.id)];
    return saveList(key, next, gen);
  });
}

function removeById<T extends { id: string }>(
  key: CollectionKey,
  validate: (x: unknown) => x is T,
  id: string,
  gen = generation,
): Promise<boolean> {
  return serialWrite(async () => {
    const list = await readList(key, validate);
    if (list === null) return false; // could not read it — never overwrite it
    return saveList(key, list.filter((w) => w.id !== id), gen);
  });
}

/** `gen` (optional, every write): the generation the caller's data belongs to —
 *  a screen passes its mount-time workflowGeneration(). Default: now. */
export const workflowStore = {
  listWorkflows: () => loadList(KEYS.workflows, isWorkflow),
  // keepPlace: My Workflows is user-ordered (moveWorkflow below — "the stored
  // order IS the display order"), and every EDIT → SAVE jumped the edited one
  // back to the top, undoing the ▲▼ order. New workflows still go first.
  saveWorkflow: (w: Workflow, gen = generation) => upsert(KEYS.workflows, isWorkflow, w, true, gen),
  deleteWorkflow: (id: string, gen = generation) => removeById(KEYS.workflows, isWorkflow, id, gen),
  /** Reorder My Workflows (owner 2026-08-06): swap the workflow with its
   *  neighbour; the stored order IS the display order. */
  moveWorkflow(id: string, dir: -1 | 1, gen = generation): Promise<Workflow[] | null> {
    return serialWrite(async () => {
      const list = await readList(KEYS.workflows, isWorkflow);
      if (list === null) return null; // unreadable: change nothing; the screen keeps its list
      const i = list.findIndex((w) => w.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      // A failed write returns the stored order, not a swap that was never saved.
      return (await saveList(KEYS.workflows, next, gen, true)) ? next : list;
    });
  },

  listRuns: () => loadList(KEYS.runs, isRun),
  saveRun: (r: WorkflowRun, gen = generation) => upsert(KEYS.runs, isRun, r, false, gen),
  deleteRun: (id: string, gen = generation) => removeById(KEYS.runs, isRun, id, gen),
  /** FINISH (calc check B, 2026-10-03): a completed run is never read again —
   *  the runner's resume search is the only reader and it skips completed runs
   *  (Saved Results keep their own copy) — yet every FINISH stored one, so the
   *  one `ape:calcwf:runs` blob only grew, toward Android's ~2 MB row limit,
   *  past which the drafts could not be read at all. The finished run is
   *  removed instead, with any completed run older versions left behind.
   *  Drafts are untouched; nothing is written when nothing is removed. */
  finishRun(id: string, gen = generation): Promise<boolean> {
    return serialWrite(async () => {
      if (gen !== generation) return false;
      const list = await readList(KEYS.runs, isRun);
      if (list === null) return false; // could not read it — never overwrite it
      const next = list.filter((r) => r.id !== id && !r.completedAt);
      if (next.length === list.length) return true;
      return saveList(KEYS.runs, next, gen);
    });
  },

  listProjects: () => loadList(KEYS.projects, isProject),
  saveProject: (p: Project, gen = generation) => upsert(KEYS.projects, isProject, p, false, gen),
  deleteProject: (id: string, gen = generation) => removeById(KEYS.projects, isProject, id, gen),

  listResults: () => loadList(KEYS.results, isResult),
  saveResult: (r: SavedRunSummary, gen = generation) => upsert(KEYS.results, isResult, r, false, gen),
  deleteResult: (id: string, gen = generation) => removeById(KEYS.results, isResult, id, gen),

  getFavorites: async (): Promise<string[]> => (await readIds(KEYS.favorites)) ?? [],
  /** `null` when the stored favourites could not be READ (full-app run 2,
   *  2026-10-01): toggling then wrote `[id]` over every other favourite. Now
   *  nothing is written and the screen keeps what it shows. A failed write
   *  returns the unchanged list, never the toggle that was not stored. */
  toggleFavorite(id: string, gen = generation): Promise<string[] | null> {
    return serialWrite(async () => {
      const cur = await readIds(KEYS.favorites);
      if (cur === null) return null;
      const next = cur.includes(id) ? cur.filter((s) => s !== id) : [id, ...cur];
      return (await saveList(KEYS.favorites, next, gen, true)) ? next : cur;
    });
  },

  getRecents: async (): Promise<string[]> => (await readIds(KEYS.recents)) ?? [],
  touchRecent(id: string, gen = generation): Promise<void> {
    return serialWrite(async () => {
      const cur = await readIds(KEYS.recents);
      if (cur === null) return; // unreadable: never overwrite the recents with one id
      await saveList(KEYS.recents, [id, ...cur.filter((s) => s !== id)].slice(0, 8), gen);
    });
  },
};

/** Account switch / sign-out wipe (night bug pass 3, 2026-10-01). The keys
 *  themselves are removed by clearLocalAccountData's `ape:*` sweep; this holds
 *  no in-memory copy, so the reset is the fence: every write asked for before
 *  it (queued on the write chain, or still mid read-modify-write) is dropped
 *  instead of re-creating the departing account's blob after the sweep.
 *  Registered in resetAllLocalStores (src/features/account/clearLocalAccountData.ts). */
export function resetLocal(): void {
  generation++;
}
/** The name resetAllLocalStores imports this store's reset under. */
export const resetCalcWorkflowStore = resetLocal;
