/**
 * enrolledBundlesStore — cert/program BUNDLES the user has enrolled as a whole
 * (user request 2026-07-22). Each bundle = a certificate or program with its
 * topic gs list. Adding a bundle ALSO adds its topics as individual enrollment
 * entries (via addTopics in enrollmentStore) — the bundle is shown as its own
 * container plus its topics.
 *
 * `loaded` = whether the bundle's topics are currently loaded on the Dashboard
 * study swipe (LOAD/UNLOAD). Device-local, persisted; same store pattern.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BundleKind = 'cert' | 'program' | 'subject';
export type EnrolledBundle = { key: string; kind: BundleKind; name: string; topics: number[]; loaded: boolean };

const KEY = 'ape:enrolledBundles';

export function bundleKey(kind: BundleKind, name: string): string {
  return `${kind}:${name}`;
}

let list: EnrolledBundle[] = [];
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function persist() {
  void AsyncStorage.setItem(KEY, JSON.stringify(list));
}
function commit(next: EnrolledBundle[]) {
  list = next;
  persist();
  emit();
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) {
            list = p
              .filter((b) => b && typeof b.key === 'string' && Array.isArray(b.topics))
              .map((b) => ({
                key: b.key,
                kind: b.kind === 'program' ? 'program' : b.kind === 'subject' ? 'subject' : 'cert',
                name: b.name,
                topics: b.topics,
                loaded: !!b.loaded,
              }));
          }
        }
      } catch {
        // start empty
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}

export function getBundles(): EnrolledBundle[] {
  void hydrate();
  return list;
}
export function isBundleEnrolled(key: string): boolean {
  return list.some((b) => b.key === key);
}

/** Add a cert/program bundle. NOT loaded by default (user request 2026-07-22:
 *  topics only join the Dashboard when the user explicitly taps LOAD). */
export function addBundle(kind: BundleKind, name: string, topics: number[]): void {
  const key = bundleKey(kind, name);
  if (list.some((b) => b.key === key)) return;
  commit([...list, { key, kind, name, topics, loaded: false }]);
}

export function removeBundle(key: string): void {
  if (!list.some((b) => b.key === key)) return;
  commit(list.filter((b) => b.key !== key));
}

/** LOAD (true) / UNLOAD (false) — toggles the bundle's topics on the Dashboard. */
export function setBundleLoaded(key: string, loaded: boolean): void {
  commit(list.map((b) => (b.key === key ? { ...b, loaded } : b)));
}

/** All gs from LOADED bundles — joins the Dashboard's active study swipe. */
export function loadedBundleGs(): number[] {
  return Array.from(new Set(list.filter((b) => b.loaded).flatMap((b) => b.topics)));
}

/** Reset the IN-MEMORY cache (account wipe / user switch — clearLocalAccountData).
 *  Clears the list + hydrated flags and emits so live useBundles() hooks
 *  re-render empty; the next read re-hydrates from the (cleared) storage. */
export function resetLocal(): void {
  list = [];
  hydrated = false;
  hydrating = null;
  emit();
}

export function useBundles(): EnrolledBundle[] {
  const [snap, setSnap] = useState<EnrolledBundle[]>(list);
  useEffect(() => {
    const l = () => setSnap(list);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
