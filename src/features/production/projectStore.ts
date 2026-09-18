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

// ── list persistence (patternStore's shape) ──────────────────────────────────

async function loadList(kv: KeyValueStore, key: string): Promise<ProductionProject[]> {
  try {
    const raw = await kv.getItem(key);
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
      const raw = await kv.getItem(key);
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
  get(lab: LabKind, id: string): Promise<ProductionProject | null>;
  upsert(p: ProductionProject): Promise<boolean>;
  remove(lab: LabKind, id: string): Promise<boolean>;
  duplicate(lab: LabKind, id: string): Promise<ProductionProject | null>;
  /** Write one answer. Returns the updated project, or null if it is gone. */
  setValue(lab: LabKind, id: string, stageId: string, fieldId: string, value: FieldValue): Promise<ProductionProject | null>;
  /** Mark a field not-applicable WITH a reason; an empty reason clears it. */
  setNa(lab: LabKind, id: string, stageId: string, fieldId: string, reason: string): Promise<ProductionProject | null>;
  /** Record an accepted blocker. Refuses an unattributed or unexplained one. */
  acceptCondition(lab: LabKind, id: string, c: AcceptedCondition): Promise<ProductionProject | null>;
  clearCondition(lab: LabKind, id: string, ruleId: string): Promise<ProductionProject | null>;
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
      const all = await list(lab);
      const i = all.findIndex((p) => p.id === id);
      if (i < 0) return null;
      const next = { ...fn(all[i]), updatedAt: Date.now() };
      all[i] = next;
      const ok = await write(lab, all);
      return ok ? next : null;
    });
  }

  return {
    load: list,
    async get(lab, id) {
      return (await list(lab)).find((p) => p.id === id) ?? null;
    },
    upsert(p) {
      // Same queue as `mutate`: an upsert racing a keystroke would drop whichever
      // read the older snapshot.
      return serialize(p.lab, async () => {
        const all = await list(p.lab);
        const i = all.findIndex((x) => x.id === p.id);
        const row = { ...p, updatedAt: Date.now() };
        if (i >= 0) all[i] = row;
        else all.unshift(row);
        return write(p.lab, all);
      });
    },
    // Both of these are read-modify-writes of the SAME list as `mutate`, so both
    // belong in its queue (2026-09-17, pass 5). The first version of the
    // serialization covered `mutate` and `upsert` and left these racing — a
    // concrete hazard on the activity screen's RESTART, which deletes and
    // recreates back to back.
    remove(lab, id) {
      return serialize(lab, async () => write(lab, (await list(lab)).filter((p) => p.id !== id)));
    },
    duplicate(lab, id) {
      return serialize(lab, async () => {
      const all = await list(lab);
      const src = all.find((p) => p.id === id);
      if (!src) return null;
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
      return (await write(lab, all)) ? copy : null;
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
