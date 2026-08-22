/**
 * deckOrderStore — device-local ordering of the Dashboard topic carousel (owner
 * 2026-08-01).
 *
 * DEFAULT is ALPHABETICAL. The user must EXPLICITLY engage CUSTOM ordering (from
 * the Topic-Deck list opened by the blue Study icon), where they can drag topics
 * into any order and remove topics from the deck. Switching back to alphabetical
 * keeps the custom order stored, so changing your mind restores it. Removed
 * topics can be restored. Same tiny external-store pattern as flaggedStore.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DeckMode = 'alpha' | 'custom';
export type DeckPrefs = { mode: DeckMode; order: string[]; removed: string[] };

const KEY = 'ape:deckOrder';
const DEFAULT: DeckPrefs = { mode: 'alpha', order: [], removed: [] };

let prefs: DeckPrefs = { ...DEFAULT };
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw) as Partial<DeckPrefs>;
          const strs = (v: unknown): string[] =>
            Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
          prefs = { mode: p.mode === 'custom' ? 'custom' : 'alpha', order: strs(p.order), removed: strs(p.removed) };
        }
      } catch {
        // corrupt/absent → keep default (alphabetical)
      }
      hydrated = true;
      emit();
    })();
  }
  return hydrating;
}
void hydrate();

function commit(next: DeckPrefs) {
  prefs = next;
  void AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  emit();
}

export function getDeckPrefs(): DeckPrefs {
  void hydrate();
  return prefs;
}

/** Alphabetical (default) or the user's custom order. */
export function setDeckMode(mode: DeckMode): void {
  if (prefs.mode === mode) return;
  commit({ ...prefs, mode });
}

/** Store the full custom order (list of topic IDs, left→right). */
export function setDeckOrder(order: string[]): void {
  commit({ ...prefs, order: [...order] });
}

/** Remove a topic from the deck (also drops it from the custom order). */
export function removeFromDeck(id: string): void {
  if (prefs.removed.includes(id)) return;
  commit({ ...prefs, removed: [...prefs.removed, id], order: prefs.order.filter((x) => x !== id) });
}

/** Put a removed topic back on the deck. */
export function restoreToDeck(id: string): void {
  if (!prefs.removed.includes(id)) return;
  commit({ ...prefs, removed: prefs.removed.filter((x) => x !== id) });
}

/**
 * Resolve the visible carousel order (list of IDs, left→right) from a full set
 * of deck members. `firstId` (the ★ Custom List) is pinned first in ALPHA mode.
 * Removed IDs are excluded. In CUSTOM mode, members follow `prefs.order`; any
 * not yet placed fall in alphabetically after the ordered ones.
 */
export function orderDeckIds(all: { id: string; name: string }[], p: DeckPrefs, firstId?: string): string[] {
  const removed = new Set(p.removed);
  const kept = all.filter((t) => !removed.has(t.id));
  if (p.mode === 'custom') {
    const idx = new Map(p.order.map((id, i) => [id, i] as const));
    return [...kept]
      .sort((a, b) => {
        const ia = idx.has(a.id) ? (idx.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
        const ib = idx.has(b.id) ? (idx.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
        return ia !== ib ? ia - ib : a.name.localeCompare(b.name);
      })
      .map((t) => t.id);
  }
  const sorted = [...kept].sort((a, b) => a.name.localeCompare(b.name)).map((t) => t.id);
  return firstId && sorted.includes(firstId) ? [firstId, ...sorted.filter((id) => id !== firstId)] : sorted;
}

/** Reset the in-memory cache on account switch (parity with the other local
 *  stores — see clearLocalAccountData/resetAllLocalStores). The persisted key is
 *  removed by the `ape:*` sweep; this drops the cache so the next user doesn't
 *  briefly see the previous user's deck order until relaunch. */
export function resetLocal(): void {
  prefs = { ...DEFAULT };
  hydrated = false;
  hydrating = null;
  emit();
}

/** Live view of the deck prefs (any screen). */
export function useDeckPrefs(): DeckPrefs {
  const [snap, setSnap] = useState<DeckPrefs>(prefs);
  useEffect(() => {
    const l = () => setSnap(prefs);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}
