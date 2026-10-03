/**
 * enrolledBundlesStore — cert/program BUNDLES the user has enrolled as a whole
 * (user request 2026-07-22). Each bundle = a certificate or program with its
 * topic gs list. Adding a bundle ALSO adds its topics as individual enrollment
 * entries (via addTopics in enrollmentStore) — the bundle is shown as its own
 * container plus its topics.
 *
 * `loaded` = whether the bundle's topics are currently loaded on the Dashboard
 * study swipe (LOAD/UNLOAD). Device-local, persisted.
 *
 * On the shared safe store (pattern catalog 2026-10-02, closer A2): a read
 * that FAILS is unreadable and never written over (it used to start empty and
 * save that over the stored bundles); an edit before the stored list lands is
 * applied on top of it (full-app run 2, 2026-10-01); a read in flight across
 * the account wipe lands nowhere (bug pass 2, 2026-09-30); the wipe reaches
 * the store without a hand entry.
 */
import { createLocalStore } from '../storage/localStore';

export type BundleKind = 'cert' | 'program' | 'subject';
export type EnrolledBundle = { key: string; kind: BundleKind; name: string; topics: number[]; loaded: boolean };

const KEY = 'ape:enrolledBundles';

export function bundleKey(kind: BundleKind, name: string): string {
  return `${kind}:${name}`;
}

const store = createLocalStore<EnrolledBundle[]>({
  key: KEY,
  empty: () => [],
  parse: (p) => {
    if (!Array.isArray(p)) return [];
    return p
      .filter((b) => b && typeof b.key === 'string' && Array.isArray(b.topics))
      .map((b) => ({
        key: b.key as string,
        kind: b.kind === 'program' ? 'program' : b.kind === 'subject' ? 'subject' : 'cert',
        name: b.name as string,
        topics: b.topics as number[],
        loaded: !!b.loaded,
      }));
  },
});

export function getBundles(): EnrolledBundle[] {
  return store.get();
}
export function isBundleEnrolled(key: string): boolean {
  return store.get().some((b) => b.key === key);
}

/** Add a cert/program bundle. NOT loaded by default (user request 2026-07-22:
 *  topics only join the Dashboard when the user explicitly taps LOAD). */
export function addBundle(kind: BundleKind, name: string, topics: number[]): void {
  const key = bundleKey(kind, name);
  void store.mutate((list) => (list.some((b) => b.key === key) ? list : [...list, { key, kind, name, topics, loaded: false }]));
}

export function removeBundle(key: string): void {
  void store.mutate((list) => (list.some((b) => b.key === key) ? list.filter((b) => b.key !== key) : list));
}

/** Reorder: shift a stored bundle one step up (dir −1) or down (dir +1) in the
 *  list — the drag-to-sort primitive, mirroring enrollmentStore.moveTopic. */
export function moveBundle(key: string, dir: -1 | 1): void {
  void store.mutate((list) => {
    const i = list.findIndex((b) => b.key === key);
    if (i < 0) return list;
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

/** LOAD (true) / UNLOAD (false) — toggles the bundle's topics on the Dashboard. */
export function setBundleLoaded(key: string, loaded: boolean): void {
  void store.mutate((list) => list.map((b) => (b.key === key ? { ...b, loaded } : b)));
}

/** All gs from LOADED bundles — joins the Dashboard's active study swipe. */
export function loadedBundleGs(): number[] {
  return Array.from(new Set(store.get().filter((b) => b.loaded).flatMap((b) => b.topics)));
}

/** Reset the IN-MEMORY cache (account wipe / user switch). The shared store
 *  registers this with the wipe itself; kept exported for callers and tests. */
export function resetLocal(): void {
  store.reset();
}

export function useBundles(): EnrolledBundle[] {
  return store.use();
}

/** Whether the stored bundles have been READ (false while the read is out, or
 *  after it failed). `useBundles()` is `[]` until then, which is not "holds no
 *  credential" — an effect that writes from it must wait (hunt 6, 2026-10-03). */
export function useBundlesHydrated(): boolean {
  return store.useHydrated();
}
