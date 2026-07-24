/**
 * flaggedStore — the user's personal TERM LISTS (Booth 2026-07-18).
 *
 * Started as the ONE shared list. Generalized to FOUR selectable lists,
 * togglable from any term list popup:
 *   bookmark — the shared BOOKMARK list (renamed from "flagged" — user request
 *              2026-07-18; legacy storage key kept so existing terms carry over)
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

// Storage key for the BOOKMARK list (renamed from "flagged" — user request
// 2026-07-18); the VALUE is unchanged so existing saved terms carry over.
export const BOOKMARK_KEY = 'ape:glossaryFavs';

/** Pseudo achievementId for the user's personal dashboard topic — routes
 *  Flashcards into local-only mode (no server topic). Display name is the
 *  user's "Custom List" (user request 2026-07-17); the id/storage stay
 *  'flagged' so terms starred in the Glossary/Flashcards carry over. */
export const FLAGGED_TOPIC_ID = 'flagged';
export const FLAGGED_TOPIC_NAME = 'My Custom List';

export type TermListKind = 'bookmark' | 'heart' | 'starred' | 'known';

const STORAGE_KEYS: Record<TermListKind, string> = {
  bookmark: BOOKMARK_KEY,
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
  bookmark: { ids: new Set(), hydrated: false, hydrating: null, listeners: new Set() },
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

/* ---- PER-CONTEXT bookmark API (the 🔖 list) ----
 * Bookmarks are no longer one global list: each CONTEXT (the Glossary, or a
 * given topic) keeps its own bookmark set under `ape:bm:<ctx>`. Same
 * hand-rolled external-store pattern as the term lists above, but the stores
 * are created lazily per ctx and held in a Map. Fresh start — the old global
 * `ape:glossaryFavs` (BOOKMARK_KEY) is abandoned and never read. */
const bookmarkStores = new Map<string, SetStore>();

function bookmarkKey(ctx: string): string {
  return `ape:bm:${ctx}`;
}

function bookmarkStore(ctx: string): SetStore {
  let s = bookmarkStores.get(ctx);
  if (!s) {
    s = { ids: new Set(), hydrated: false, hydrating: null, listeners: new Set() };
    bookmarkStores.set(ctx, s);
  }
  return s;
}

function emitBookmarks(s: SetStore) {
  s.listeners.forEach((l) => l());
}

function hydrateBookmarks(ctx: string): Promise<void> {
  const s = bookmarkStore(ctx);
  if (s.hydrated) return Promise.resolve();
  if (!s.hydrating) {
    s.hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(bookmarkKey(ctx));
        if (raw) s.ids = new Set(JSON.parse(raw) as string[]);
      } catch {
        // corrupt/absent → start empty
      }
      s.hydrated = true;
      emitBookmarks(s);
    })();
  }
  return s.hydrating;
}

function persistBookmarks(ctx: string) {
  void AsyncStorage.setItem(bookmarkKey(ctx), JSON.stringify([...bookmarkStore(ctx).ids]));
}

export function getBookmarks(ctx: string): ReadonlySet<string> {
  void hydrateBookmarks(ctx);
  return bookmarkStore(ctx).ids;
}

export function isBookmarked(ctx: string, id: string): boolean {
  return bookmarkStore(ctx).ids.has(id);
}

export function toggleBookmark(ctx: string, id: string): boolean {
  const s = bookmarkStore(ctx);
  const next = new Set(s.ids);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  s.ids = next; // new identity so React state updates propagate
  persistBookmarks(ctx);
  emitBookmarks(s);
  return next.has(id);
}

export function removeBookmarks(ctx: string, ids: Iterable<string>): void {
  const s = bookmarkStore(ctx);
  let changed = false;
  const next = new Set(s.ids);
  for (const id of ids) {
    if (next.delete(id)) changed = true;
  }
  if (!changed) return;
  s.ids = next;
  persistBookmarks(ctx);
  emitBookmarks(s);
}

/** Every context that currently holds ≥1 bookmark — scanned from storage. Used
 *  by the Glossary's two-level bookmark filter (user request 2026-07-24). */
export async function listBookmarkContexts(): Promise<{ ctx: string; count: number }[]> {
  const keys = await AsyncStorage.getAllKeys();
  const out: { ctx: string; count: number }[] = [];
  for (const k of keys) {
    if (!k.startsWith('ape:bm:')) continue;
    try {
      const raw = await AsyncStorage.getItem(k);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (Array.isArray(arr) && arr.length > 0) out.push({ ctx: k.slice('ape:bm:'.length), count: arr.length });
    } catch {
      // skip corrupt entries
    }
  }
  return out;
}

/** Live view of one context's bookmark set (re-renders on change, any screen). */
export function useBookmarks(ctx: string): ReadonlySet<string> {
  const [snap, setSnap] = useState<ReadonlySet<string>>(bookmarkStore(ctx).ids);
  useEffect(() => {
    const s = bookmarkStore(ctx);
    const l = () => setSnap(bookmarkStore(ctx).ids);
    s.listeners.add(l);
    void hydrateBookmarks(ctx).then(l);
    return () => {
      s.listeners.delete(l);
    };
  }, [ctx]);
  return snap;
}

/* ---- "Show my Custom List on the Dashboard" toggle ----
 * A device-local boolean (same hand-rolled external-store pattern as the term
 * lists above): module var + listeners + hydrate-once + persist. Controls
 * whether the user's Custom List appears as a synthetic current-topic on the
 * Dashboard. Default false. */
const CUSTOM_ON_DASHBOARD_KEY = 'ape:customOnDashboard';

const customOnDashboard = {
  value: false,
  hydrated: false,
  hydrating: null as Promise<void> | null,
  listeners: new Set<() => void>(),
};

function emitCustomOnDashboard() {
  customOnDashboard.listeners.forEach((l) => l());
}

async function hydrateCustomOnDashboard(): Promise<void> {
  if (customOnDashboard.hydrated) return;
  if (!customOnDashboard.hydrating) {
    customOnDashboard.hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(CUSTOM_ON_DASHBOARD_KEY);
        if (raw != null) customOnDashboard.value = raw === 'true';
      } catch {
        // corrupt/absent → keep default false
      }
      customOnDashboard.hydrated = true;
      emitCustomOnDashboard();
    })();
  }
  return customOnDashboard.hydrating;
}

export function getCustomOnDashboard(): boolean {
  void hydrateCustomOnDashboard();
  return customOnDashboard.value;
}

export function setCustomOnDashboard(v: boolean): void {
  if (customOnDashboard.value === v) return;
  customOnDashboard.value = v;
  void AsyncStorage.setItem(CUSTOM_ON_DASHBOARD_KEY, v ? 'true' : 'false');
  emitCustomOnDashboard();
}

/** Live view of the "show custom list on dashboard" flag (any screen). */
export function useCustomOnDashboard(): boolean {
  const [snap, setSnap] = useState<boolean>(customOnDashboard.value);
  useEffect(() => {
    const l = () => setSnap(customOnDashboard.value);
    customOnDashboard.listeners.add(l);
    void hydrateCustomOnDashboard().then(l);
    return () => {
      customOnDashboard.listeners.delete(l);
    };
  }, []);
  return snap;
}
