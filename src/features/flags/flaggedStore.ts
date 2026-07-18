/**
 * flaggedStore — the user's personal TERM LISTS (Booth 2026-07-18).
 *
 * Started as the ONE shared "Flagged" list (Glossary star ↔ Flashcards ↔ the
 * Flagged dashboard topic). Booth 2026-07-18 (second order) generalized it to
 * FOUR selectable lists, togglable from any term list popup:
 *   flagged — the original shared flag list (legacy storage key kept so terms
 *             users already starred carry straight over)
 *   heart   — favorites
 *   starred — the user's ★ "CUSTOM LIST" (Booth 2026-07-18 naming): their own
 *             curated term list, which will also feed their notifications.
 *             Scheduling the actual notifications is a future feature.
 *   known   — self-assessed "I know this" curation list. GLOBAL and separate
 *             from per-topic flashcard study progress (which stays server-
 *             credited via item_states) — this one never touches progress.
 *
 * Each list is a tiny hand-rolled external store (same pattern as
 * profile/api useAlbumTier): module-level Set + listeners, hydrated once,
 * persisted on every change. Term identity = glossary row id (uuid string).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FLAGGED_KEY = 'ape:glossaryFavs'; // legacy key kept for carryover

/** Pseudo achievementId for the user's personal dashboard topic — routes
 *  Flashcards into local-only mode (no server topic). Display name is the
 *  user's "Custom List" (user request 2026-07-17); the id/storage stay
 *  'flagged' so terms starred in the Glossary/Flashcards carry over. */
export const FLAGGED_TOPIC_ID = 'flagged';
export const FLAGGED_TOPIC_NAME = 'My Custom List';

export type TermListKind = 'flagged' | 'heart' | 'starred' | 'known';

const STORAGE_KEYS: Record<TermListKind, string> = {
  flagged: FLAGGED_KEY,
  heart: 'ape:heartTerms',
  starred: 'ape:notifyTerms',
  known: 'ape:knownTermsGlobal',
};

type SetStore = {
  ids: ReadonlySet<string>;
  hydrated: boolean;
  hydrating: Promise<void> | null;
  listeners: Set<() => void>;
};

const stores: Record<TermListKind, SetStore> = {
  flagged: { ids: new Set(), hydrated: false, hydrating: null, listeners: new Set() },
  heart: { ids: new Set(), hydrated: false, hydrating: null, listeners: new Set() },
  starred: { ids: new Set(), hydrated: false, hydrating: null, listeners: new Set() },
  known: { ids: new Set(), hydrated: false, hydrating: null, listeners: new Set() },
};

function emit(kind: TermListKind) {
  stores[kind].listeners.forEach((l) => l());
}

async function hydrate(kind: TermListKind): Promise<void> {
  const s = stores[kind];
  if (s.hydrated) return;
  if (!s.hydrating) {
    s.hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS[kind]);
        if (raw) s.ids = new Set(JSON.parse(raw) as string[]);
      } catch {
        // corrupt/absent → start empty
      }
      s.hydrated = true;
      emit(kind);
    })();
  }
  return s.hydrating;
}

function persist(kind: TermListKind) {
  void AsyncStorage.setItem(STORAGE_KEYS[kind], JSON.stringify([...stores[kind].ids]));
}

export function getTermList(kind: TermListKind): ReadonlySet<string> {
  void hydrate(kind);
  return stores[kind].ids;
}

export function toggleTermList(kind: TermListKind, id: string): boolean {
  const s = stores[kind];
  const next = new Set(s.ids);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  s.ids = next; // new identity so React state updates propagate
  persist(kind);
  emit(kind);
  return next.has(id);
}

/** Force-set membership (e.g. the ✓/✗ known–unknown pair in term lists). */
export function setInTermList(kind: TermListKind, id: string, member: boolean): void {
  const s = stores[kind];
  if (s.ids.has(id) === member) return;
  const next = new Set(s.ids);
  if (member) next.add(id);
  else next.delete(id);
  s.ids = next;
  persist(kind);
  emit(kind);
}

/** Remove many ids at once (e.g. a deck reset unflagging its own terms). */
export function removeManyFromTermList(kind: TermListKind, ids: Iterable<string>): void {
  const s = stores[kind];
  let changed = false;
  const next = new Set(s.ids);
  for (const id of ids) {
    if (next.delete(id)) changed = true;
  }
  if (!changed) return;
  s.ids = next;
  persist(kind);
  emit(kind);
}

/** Live view of one list (re-renders on any change to it, any screen). */
export function useTermList(kind: TermListKind): ReadonlySet<string> {
  const [snap, setSnap] = useState<ReadonlySet<string>>(stores[kind].ids);
  useEffect(() => {
    const l = () => setSnap(stores[kind].ids);
    stores[kind].listeners.add(l);
    void hydrate(kind).then(l);
    return () => {
      stores[kind].listeners.delete(l);
    };
  }, [kind]);
  return snap;
}

/* ---- Legacy flagged-list API (pre-generalization callers) ---- */

export function getFlagged(): ReadonlySet<string> {
  return getTermList('flagged');
}

export function isFlagged(id: string): boolean {
  return stores.flagged.ids.has(id);
}

export function toggleFlagged(id: string): boolean {
  return toggleTermList('flagged', id);
}

export function unflagMany(ids: Iterable<string>): void {
  removeManyFromTermList('flagged', ids);
}

export function useFlagged(): ReadonlySet<string> {
  return useTermList('flagged');
}
