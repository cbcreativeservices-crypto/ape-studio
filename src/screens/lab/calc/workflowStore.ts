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
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Load / save with damage quarantine
// ---------------------------------------------------------------------------

async function loadList<T>(key: CollectionKey, validate: (x: unknown) => x is T): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    // Keep the valid rows; quarantine the rest instead of crashing or deleting.
    const good = parsed.filter(validate);
    if (good.length !== parsed.length) {
      const bad = parsed.filter((x) => !validate(x));
      void AsyncStorage.setItem(`${key}:damaged`, JSON.stringify(bad)).catch(() => {});
      void AsyncStorage.setItem(key, JSON.stringify(good)).catch(() => {});
    }
    return good;
  } catch {
    // Whole blob unreadable — quarantine it and start empty.
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw != null) await AsyncStorage.setItem(`${key}:damaged`, raw);
      await AsyncStorage.removeItem(key);
    } catch {}
    return [];
  }
}

async function saveList<T>(key: CollectionKey, list: T[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
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
// Public CRUD — upsert-by-id everywhere; lists stay newest-first
// ---------------------------------------------------------------------------

async function upsert<T extends { id: string }>(
  key: CollectionKey,
  validate: (x: unknown) => x is T,
  item: T,
): Promise<boolean> {
  const list = await loadList(key, validate);
  const next = [item, ...list.filter((w) => w.id !== item.id)];
  return saveList(key, next);
}

async function removeById<T extends { id: string }>(
  key: CollectionKey,
  validate: (x: unknown) => x is T,
  id: string,
): Promise<boolean> {
  const list = await loadList(key, validate);
  return saveList(key, list.filter((w) => w.id !== id));
}

export const workflowStore = {
  listWorkflows: () => loadList(KEYS.workflows, isWorkflow),
  saveWorkflow: (w: Workflow) => upsert(KEYS.workflows, isWorkflow, w),
  deleteWorkflow: (id: string) => removeById(KEYS.workflows, isWorkflow, id),

  listRuns: () => loadList(KEYS.runs, isRun),
  saveRun: (r: WorkflowRun) => upsert(KEYS.runs, isRun, r),
  deleteRun: (id: string) => removeById(KEYS.runs, isRun, id),

  listProjects: () => loadList(KEYS.projects, isProject),
  saveProject: (p: Project) => upsert(KEYS.projects, isProject, p),
  deleteProject: (id: string) => removeById(KEYS.projects, isProject, id),

  listResults: () => loadList(KEYS.results, isResult),
  saveResult: (r: SavedRunSummary) => upsert(KEYS.results, isResult, r),
  deleteResult: (id: string) => removeById(KEYS.results, isResult, id),

  async getFavorites(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.favorites);
      const v: unknown = raw == null ? [] : JSON.parse(raw);
      return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
    } catch {
      return [];
    }
  },
  async toggleFavorite(id: string): Promise<string[]> {
    const cur = await workflowStore.getFavorites();
    const next = cur.includes(id) ? cur.filter((s) => s !== id) : [id, ...cur];
    await saveList(KEYS.favorites, next);
    return next;
  },

  async getRecents(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.recents);
      const v: unknown = raw == null ? [] : JSON.parse(raw);
      return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
    } catch {
      return [];
    }
  },
  async touchRecent(id: string): Promise<void> {
    const cur = await workflowStore.getRecents();
    await saveList(KEYS.recents, [id, ...cur.filter((s) => s !== id)].slice(0, 8));
  },
};

/** Hook: a collection that reloads on focus-count bump. Minimal by design —
 *  screens call `reload()` after their own mutations. */
export function useWorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const reload = useCallback(() => {
    void workflowStore.listWorkflows().then(setWorkflows);
  }, []);
  useEffect(reload, [reload]);
  return { workflows, reload };
}
