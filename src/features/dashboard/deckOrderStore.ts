/**
 * deckOrderStore — device-local ordering of the Dashboard topic carousel (owner
 * 2026-08-01).
 *
 * DEFAULT is ALPHABETICAL. The user must EXPLICITLY engage CUSTOM ordering (from
 * the Topic-Deck list opened by the blue Study icon), where they can drag topics
 * into any order and remove topics from the deck. Switching back to alphabetical
 * keeps the custom order stored, so changing your mind restores it. Removed
 * topics can be restored.
 *
 * On the shared safe store (pattern catalog 2026-10-02, closer A2). The rules
 * it used to carry by hand live there now: a read that FAILED is unreadable
 * and the next reorder / ✕ / mode tap never saves the default over the
 * learner's custom order (full run 2, 2026-10-01); a tap before the read
 * lands is applied on top of the stored deck; a read in flight when the
 * boot-time identity check wipes the store lands nowhere (bug pass 2,
 * 2026-09-30); the wipe reaches the store without a hand entry.
 */
import { createLocalStore } from '../storage/localStore';

export type DeckMode = 'alpha' | 'custom';
export type DeckPrefs = { mode: DeckMode; order: string[]; removed: string[] };

const KEY = 'ape:deckOrder';
const DEFAULT: DeckPrefs = { mode: 'alpha', order: [], removed: [] };

const store = createLocalStore<DeckPrefs>({
  key: KEY,
  empty: () => ({ ...DEFAULT }),
  parse: (raw) => {
    const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<DeckPrefs>;
    const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    return { mode: p.mode === 'custom' ? 'custom' : 'alpha', order: strs(p.order), removed: strs(p.removed) };
  },
});
// Warm at module load so the Dashboard reads the deck synchronously.
void store.hydrate();

export function getDeckPrefs(): DeckPrefs {
  return store.get();
}

/** Alphabetical (default) or the user's custom order. */
export function setDeckMode(mode: DeckMode): void {
  void store.mutate((prefs) => (prefs.mode === mode ? prefs : { ...prefs, mode }));
}

/** Store the full custom order (list of topic IDs, left→right). */
export function setDeckOrder(order: string[]): void {
  void store.mutate((prefs) => ({ ...prefs, order: [...order] }));
}

/**
 * Remove a topic from the deck (also drops it from the custom order).
 *
 * `deckIds` = the topics currently on the deck. When given, the store refuses
 * to remove the LAST one (bug hunt 2026-09-29): the Dashboard's
 * `topics.length <= 1` guard reads a render-old list, so two quick ✕ taps both
 * passed it. The check here runs against the store's live `removed`, so the
 * second tap sees the first.
 */
export function removeFromDeck(id: string, deckIds?: readonly string[]): void {
  void store.mutate((prefs) => {
    if (prefs.removed.includes(id)) return prefs;
    if (deckIds) {
      const left = deckIds.filter((x) => x !== id && !prefs.removed.includes(x));
      if (left.length === 0) return prefs;
    }
    return { ...prefs, removed: [...prefs.removed, id], order: prefs.order.filter((x) => x !== id) };
  });
}

/** Put a removed topic back on the deck. */
export function restoreToDeck(id: string): void {
  void store.mutate((prefs) => (prefs.removed.includes(id) ? { ...prefs, removed: prefs.removed.filter((x) => x !== id) } : prefs));
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

/** Reset the in-memory cache on account switch. The persisted key is removed
 *  by the `ape:*` sweep and the shared store registers this reset with the
 *  wipe itself; kept exported for callers and tests. */
export function resetLocal(): void {
  store.reset();
}

/** Live view of the deck prefs (any screen). */
export function useDeckPrefs(): DeckPrefs {
  return store.use();
}
