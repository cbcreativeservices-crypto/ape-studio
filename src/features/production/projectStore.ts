/**
 * production/projectStore — saved production projects.
 *
 * AsyncStorage-backed, the patternStore / calc-workflow idiom: one JSON list per
 * collection, corruption-safe (a damaged row is set aside under a `:damaged`
 * key, never silently destroyed), and the adapter is injectable so `node --test`
 * round-trips the real serialiser without AsyncStorage.
 *
 * One collection per lab, on purpose. A user's pre-production plans and their
 * post-production repairs are different work with different shapes; keeping them
 * apart means a future change to one cannot corrupt the other.
 */
import { useCallback, useEffect, useState } from 'react';
import type {
  AcceptedCondition,
  FieldValue,
  LabKind,
  NaMap,
  PathwayId,
  ProductionProject,
  ValueMap,
} from './types';
import { newProjectId, valueKey } from './types';
import { holdSessionWork, registerSessionCarry } from '../lab/sessionCarry';
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

export const PROJECT_KEYS: Record<LabKind, string> = {
  preprod: 'ape:production:preprod:v1',
  postprod: 'ape:production:postprod:v1',
};

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

// ── normalisation ────────────────────────────────────────────────────────────

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

function normaliseValues(x: unknown): ValueMap {
  if (!isPlainObject(x)) return {};
  const out: ValueMap = {};
  for (const [k, v] of Object.entries(x)) {
    if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v as FieldValue;
    } else if (Array.isArray(v)) {
      out[k] = v as FieldValue;
    }
    // anything else (function, nested object) is dropped rather than trusted
  }
  return out;
}

function normaliseNa(x: unknown): NaMap {
  if (!isPlainObject(x)) return {};
  const out: NaMap = {};
  for (const [k, v] of Object.entries(x)) if (typeof v === 'string') out[k] = v;
  return out;
}

function normaliseConditions(x: unknown): AcceptedCondition[] {
  if (!Array.isArray(x)) return [];
  const out: AcceptedCondition[] = [];
  for (const row of x) {
    if (!isPlainObject(row)) continue;
    const { ruleId, acceptedBy, reason, at } = row;
    if (typeof ruleId !== 'string' || !ruleId) continue;
    if (typeof acceptedBy !== 'string' || typeof reason !== 'string') continue;
    out.push({ ruleId, acceptedBy, reason, at: typeof at === 'number' ? at : Date.now() });
  }
  return out;
}

/** Returns null for a row that cannot be trusted — the caller sets it aside. */
export function normaliseProject(x: unknown): ProductionProject | null {
  if (!isPlainObject(x)) return null;
  const { id, lab, pathway, name, createdAt, updatedAt, scenarioId, revision } = x;
  if (typeof id !== 'string' || !id) return null;
  if (lab !== 'preprod' && lab !== 'postprod') return null;
  if (typeof pathway !== 'string') return null;
  return {
    id,
    v: 1,
    lab,
    pathway: pathway as PathwayId,
    name: typeof name === 'string' ? name : 'Untitled project',
    createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
    updatedAt: typeof updatedAt === 'number' ? updatedAt : Date.now(),
    values: normaliseValues(x.values),
    na: normaliseNa(x.na),
    acceptedConditions: normaliseConditions(x.acceptedConditions),
    ...(typeof scenarioId === 'string' ? { scenarioId } : {}),
    revision: typeof revision === 'number' && revision >= 0 ? revision : 0,
  };
}

export function newProject(lab: LabKind, pathway: PathwayId, name: string): ProductionProject {
  const now = Date.now();
  return {
    id: newProjectId(),
    v: 1,
    lab,
    pathway,
    name: name.trim() || 'Untitled project',
    createdAt: now,
    updatedAt: now,
    values: {},
    na: {},
    acceptedConditions: [],
    revision: 0,
  };
}

// ── the sign-in hand-off (owner ruling 2026-10-01; hunt 13) ─────────────────
// The projects are written for everyone, but a guest's FIRST sign-in wipes
// this device's `ape:*` keys — every project planned or repaired as a guest in
// this app session was gone the moment they signed in (the Cymatics gallery's
// hunt-12 fix; Room Design's saved designs). What a guest writes here is held
// by the shared ledger (`guestOnly`: an account's own writes need no carrying)
// and merged back after the wipe. A project deleted again is let go of too.
const CARRY_KEY = 'production:projects';
export type HeldProjects = Partial<Record<LabKind, ProductionProject[]>>;

/** Pure: the held projects after one written project, or a removal. */
export function withHeldProject(
  prev: HeldProjects | undefined,
  change: { project?: ProductionProject; drop?: { lab: LabKind; id: string } },
): HeldProjects {
  const next: HeldProjects = { ...(prev ?? {}) };
  if (change.project) {
    const p = change.project;
    next[p.lab] = [p, ...(next[p.lab] ?? []).filter((x) => x.id !== p.id)];
  }
  if (change.drop) {
    const { lab, id } = change.drop;
    next[lab] = (next[lab] ?? []).filter((x) => x.id !== id);
  }
  return next;
}

function holdProject(change: Parameters<typeof withHeldProject>[1]): void {
  holdSessionWork<HeldProjects>(CARRY_KEY, (prev) => withHeldProject(prev, change), { guestOnly: true });
}

/** Pure: the stored list plus the held rows — by id, the newer `updatedAt`
 *  wins; a held row the list lacks is added (newest first). */
export function mergeHeldProjects(stored: ProductionProject[], held: ProductionProject[]): ProductionProject[] {
  const out = [...stored];
  for (const h of [...held].reverse()) {
    const i = out.findIndex((x) => x.id === h.id);
    if (i < 0) out.unshift(h);
    else if (h.updatedAt >= out[i].updatedAt) out[i] = h;
  }
  return out;
}

// ── list persistence (patternStore's shape) ──────────────────────────────────

/** Storage itself could not be read (night pass 2, 2026-10-01). Distinct from
 *  a damaged file: a read failure says nothing about what is stored, so it is
 *  never quarantined and never written over. It used to fall into the damaged
 *  branch: a transient failure could move every project aside under
 *  `:damaged` and remove the key, and an upsert after a failed read wrote a
 *  one-project list over the whole collection. */
class StorageReadError extends Error {}

async function loadList(kv: KeyValueStore, key: string): Promise<ProductionProject[]> {
  let raw: string | null;
  try {
    raw = await kv.getItem(key);
  } catch {
    throw new StorageReadError('read failed');
  }
  try {
    if (raw == null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    const good: ProductionProject[] = [];
    const bad: unknown[] = [];
    for (const row of parsed) {
      const n = normaliseProject(row);
      if (n) good.push(n);
      else bad.push(row);
    }
    if (bad.length) {
      await kv.setItem(`${key}:damaged`, JSON.stringify(bad)).catch(() => {});
      await kv.setItem(key, JSON.stringify(good)).catch(() => {});
    }
    return good;
  } catch {
    try {
      if (raw != null) await kv.setItem(`${key}:damaged`, raw);
      await kv.removeItem(key);
    } catch {}
    return [];
  }
}

async function saveList(kv: KeyValueStore, key: string, list: ProductionProject[]): Promise<boolean> {
  try {
    await kv.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export type ProjectStore = {
  load(lab: LabKind): Promise<ProductionProject[]>;
  /** As `load`, but null when storage could not be READ (full run 2,
   *  2026-10-01) — `load` reads that as an empty list, and the lab home then
   *  showed a learner with saved projects "START A PROJECT", whose create
   *  was refused with a "free up some space" message for a storage READ. */
  tryLoad(lab: LabKind): Promise<ProductionProject[] | null>;
  get(lab: LabKind, id: string): Promise<ProductionProject | null>;
  upsert(p: ProductionProject): Promise<boolean>;
  /** Change ONLY the name, on the stored copy (hunt 6, 2026-10-03). The lab
   *  home renamed with `upsert({ ...project, name })` — its on-screen copy,
   *  which after a failed re-read on focus still held the answers from before
   *  the stage screen, so a rename wrote them back over the learner's work. */
  rename(lab: LabKind, id: string, name: string): Promise<ProductionProject | null>;
  remove(lab: LabKind, id: string): Promise<boolean>;
  duplicate(lab: LabKind, id: string): Promise<ProductionProject | null>;
  /** Write one answer. Returns the updated project, or null if it is gone. */
  setValue(lab: LabKind, id: string, stageId: string, fieldId: string, value: FieldValue): Promise<ProductionProject | null>;
  /** Mark a field not-applicable WITH a reason; an empty reason clears it. */
  setNa(lab: LabKind, id: string, stageId: string, fieldId: string, reason: string): Promise<ProductionProject | null>;
  /** Record an accepted blocker. Refuses an unattributed or unexplained one. */
  acceptCondition(lab: LabKind, id: string, c: AcceptedCondition): Promise<ProductionProject | null>;
  clearCondition(lab: LabKind, id: string, ruleId: string): Promise<ProductionProject | null>;
  /** The sign-in hand-off's writer: a guest session's projects join this
   *  device's lists after the sign-in wipe. Never over an unreadable list. */
  carryIn(held: HeldProjects): Promise<boolean>;
};

export function createProjectStore(kv: KeyValueStore): ProjectStore {
  const list = (lab: LabKind) => loadList(kv, PROJECT_KEYS[lab]);
  const write = (lab: LabKind, l: ProductionProject[]) => saveList(kv, PROJECT_KEYS[lab], l);

  /**
   * Every mutation of a lab's list runs strictly after the previous one.
   *
   * ── A LOST-UPDATE RACE ON EVERY KEYSTROKE (2026-09-17, bug-hunt pass 4) ───
   *
   * `mutate` is a read-modify-write of the WHOLE project list, and the stage
   * screen calls it from `onChangeText` — once per character. Three keystrokes
   * in flight all read the same pre-write snapshot and the last `setItem` wins,
   * so characters vanished as they were typed (the screen is controlled from the
   * snapshot the store returns) and, across fields, a finished answer was simply
   * dropped from storage.
   *
   * That is worse than the failed-write case fixed earlier the same day, because
   * nothing fails: `saved` comes back non-null, the banner stays quiet, and the
   * readiness meter and the exported client packet are computed from a file that
   * is missing an answer the user watched themselves give.
   *
   * Serialising is the whole fix. These writes are small, per-lab and already
   * asynchronous, so a queue costs nothing a user can perceive — and it makes
   * the read-modify-write atomic with respect to every other mutation, which is
   * the property the code always assumed it had.
   */
  const queues: Partial<Record<LabKind, Promise<unknown>>> = {};
  function serialize<T>(lab: LabKind, job: () => Promise<T>): Promise<T> {
    // A failed job must not poison the chain for every later one.
    const run = (queues[lab] ?? Promise.resolve()).then(job, job);
    queues[lab] = run.catch(() => undefined);
    return run;
  }

  function mutate(
    lab: LabKind,
    id: string,
    fn: (p: ProductionProject) => ProductionProject,
  ): Promise<ProductionProject | null> {
    return serialize(lab, async () => {
      const all = await list(lab).catch(() => null);
      if (!all) return null; // unreadable — never write over what is stored
      const i = all.findIndex((p) => p.id === id);
      if (i < 0) return null;
      const next = { ...fn(all[i]), updatedAt: Date.now() };
      all[i] = next;
      const ok = await write(lab, all);
      if (ok) holdProject({ project: next });
      return ok ? next : null;
    });
  }

  return {
    // Reads join the same queue (bug hunt 2026-09-30): a screen that read the
    // list while keystroke writes were still queued held a stale copy, and a
    // rename (`upsert({...project, name})`) then wrote that copy back over the
    // answers. The private `list` is what the queued jobs use, so no deadlock.
    // A failed READ still reads as empty (as before); only the writers refuse.
    load: (lab) => serialize(lab, () => list(lab).catch(() => [])),
    tryLoad: (lab) => serialize(lab, () => list(lab).catch(() => null)),
    get(lab, id) {
      return serialize(lab, async () => (await list(lab).catch(() => [])).find((p) => p.id === id) ?? null);
    },
    upsert(p) {
      // Same queue as `mutate`: an upsert racing a keystroke would drop whichever
      // read the older snapshot.
      return serialize(p.lab, async () => {
        const all = await list(p.lab).catch(() => null);
        if (!all) return false; // unreadable — never write over what is stored
        const i = all.findIndex((x) => x.id === p.id);
        const row = { ...p, updatedAt: Date.now() };
        if (i >= 0) all[i] = row;
        else all.unshift(row);
        const ok = await write(p.lab, all);
        if (ok) holdProject({ project: row });
        return ok;
      });
    },
    rename(lab, id, name) {
      return mutate(lab, id, (p) => ({ ...p, name }));
    },
    // Both of these are read-modify-writes of the SAME list as `mutate`, so both
    // belong in its queue (2026-09-17, pass 5). The first version of the
    // serialization covered `mutate` and `upsert` and left these racing — a
    // concrete hazard on the activity screen's RESTART, which deletes and
    // recreates back to back.
    remove(lab, id) {
      return serialize(lab, async () => {
        const all = await list(lab).catch(() => null);
        if (!all) return false;
        const ok = await write(lab, all.filter((p) => p.id !== id));
        if (ok) holdProject({ drop: { lab, id } });
        return ok;
      });
    },
    duplicate(lab, id) {
      return serialize(lab, async () => {
      const all = await list(lab).catch(() => null);
      const src = all?.find((p) => p.id === id);
      if (!all || !src) return null;
      const now = Date.now();
      const copy: ProductionProject = {
        ...src,
        id: newProjectId(),
        name: `${src.name} (copy)`,
        createdAt: now,
        updatedAt: now,
        revision: 0,
        values: { ...src.values },
        na: { ...src.na },
        acceptedConditions: src.acceptedConditions.map((c) => ({ ...c })),
      };
      all.unshift(copy);
      if (!(await write(lab, all))) return null;
      holdProject({ project: copy });
      return copy;
      });
    },
    setValue(lab, id, stageId, fieldId, value) {
      return mutate(lab, id, (p) => ({
        ...p,
        values: { ...p.values, [valueKey(stageId, fieldId)]: value },
      }));
    },
    setNa(lab, id, stageId, fieldId, reason) {
      return mutate(lab, id, (p) => {
        const na = { ...p.na };
        const k = valueKey(stageId, fieldId);
        if (reason.trim()) na[k] = reason.trim();
        else delete na[k];
        return { ...p, na };
      });
    },
    acceptCondition(lab, id, c) {
      // An acceptance without a named person and a reason is not an acceptance,
      // it is a dismiss button. Refuse it here so no screen can route around it.
      if (!c.acceptedBy.trim() || !c.reason.trim()) return Promise.resolve(null);
      return mutate(lab, id, (p) => ({
        ...p,
        acceptedConditions: [...p.acceptedConditions.filter((x) => x.ruleId !== c.ruleId), { ...c }],
      }));
    },
    clearCondition(lab, id, ruleId) {
      return mutate(lab, id, (p) => ({
        ...p,
        acceptedConditions: p.acceptedConditions.filter((x) => x.ruleId !== ruleId),
      }));
    },
    // Each lab on its own write chain; never over a list that could not be
    // read (that lab's held rows are refused, the other lab still lands).
    async carryIn(held) {
      let ok = true;
      for (const lab of ['preprod', 'postprod'] as const) {
        const rows = held[lab] ?? [];
        if (!rows.length) continue;
        const landed = await serialize(lab, async () => {
          const all = await list(lab).catch(() => null);
          if (!all) return false;
          return write(lab, mergeHeldProjects(all, rows));
        });
        if (!landed) ok = false;
      }
      // No screen is saving these (the Room Design / gallery carry rule): a
      // refused write is told with the shared notice.
      if (!ok) reportUnhandledSaveFailure();
      return ok;
    },
  };
}

/** In-memory adapter (tests, and a safe fallback if AsyncStorage is missing). */
export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    async getItem(k) {
      return m.has(k) ? m.get(k)! : null;
    },
    async setItem(k, v) {
      m.set(k, v);
    },
    async removeItem(k) {
      m.delete(k);
    },
  };
}

let defaultStore: ProjectStore | undefined;
/** The app's store on AsyncStorage (lazy — keeps this module importable in node). */
export function projectStore(): ProjectStore {
  if (!defaultStore) {
    let kv: KeyValueStore;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage').default as KeyValueStore;
      kv = AsyncStorage;
    } catch {
      kv = memoryStore();
    }
    defaultStore = createProjectStore(kv);
  }
  return defaultStore;
}

// The ledger's writer (see CARRY_KEY): registered at module load, like every
// lab store's.
registerSessionCarry<HeldProjects>(CARRY_KEY, (held) => projectStore().carryIn(held));

/** Screen hook: the list for one lab, plus a reload. */
export function useProductionProjects(lab: LabKind) {
  const [projects, setProjects] = useState<ProductionProject[] | null>(null);
  const reload = useCallback(async () => {
    setProjects(await projectStore().load(lab));
  }, [lab]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { projects, reload };
}
