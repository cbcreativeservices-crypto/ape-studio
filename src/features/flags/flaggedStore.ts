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
 * Each list is one key on the shared safe store (pattern catalog 2026-10-02,
 * closer A2): a read that FAILED is never written over (a tap used to save a
 * one-term list over the stored one), a tap before the read lands is applied
 * to the stored list with the intent it had when tapped, a read in flight
 * across the account wipe lands nowhere, and the wipe reaches every list —
 * including the per-context bookmark lists created later — without a hand
 * entry. Term identity = glossary row id (uuid string).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalStore, type LocalStore } from '../storage/localStore';

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

type IdSet = ReadonlySet<string>;

function idSetStore(key: string): LocalStore<IdSet> {
  return createLocalStore<IdSet>({
    key,
    empty: () => new Set<string>(),
    parse: (p) => new Set(Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []),
    serialize: (s) => JSON.stringify([...s]),
  });
}

/** Pure set edits — a fresh Set only when something changes, so React
 *  snapshots (and the store's write) move only on a real change. */
function withId(s: IdSet, id: string, member: boolean): IdSet {
  if (s.has(id) === member) return s;
  const next = new Set(s);
  if (member) next.add(id);
  else next.delete(id);
  return next;
}
function withoutIds(s: IdSet, ids: Iterable<string>): IdSet {
  let next: Set<string> | null = null;
  for (const id of ids) {
    if (!s.has(id)) continue;
    next ??= new Set(s);
    next.delete(id);
  }
  return next ?? s;
}

const stores: Record<TermListKind, LocalStore<IdSet>> = {
  bookmark: idSetStore(STORAGE_KEYS.bookmark),
  heart: idSetStore(STORAGE_KEYS.heart),
  starred: idSetStore(STORAGE_KEYS.starred),
  known: idSetStore(STORAGE_KEYS.known),
};

export function getTermList(kind: TermListKind): ReadonlySet<string> {
  return stores[kind].get();
}

/** One list AFTER its stored copy has been read (final round C, 2026-10-03).
 *  `getTermList` before the read lands is the empty placeholder — a cold-start
 *  "My Custom List" deck read it once and showed nothing. Rejects when the
 *  read FAILED, so a screen says "could not load", never "empty". */
export async function readTermList(kind: TermListKind): Promise<ReadonlySet<string>> {
  await stores[kind].hydrate();
  if (!stores[kind].isHydrated()) throw new Error(`term list "${kind}" could not be read`);
  return stores[kind].get();
}

/** Toggle membership. The intent (add / remove) is decided from what the
 *  screen shows NOW and applied to the stored list once it has loaded —
 *  replaying a toggle against a list that loaded meanwhile would undo it. */
export function toggleTermList(kind: TermListKind, id: string): boolean {
  const member = !stores[kind].get().has(id);
  void stores[kind].mutate((s) => withId(s, id, member));
  return member;
}

/** Force-set membership (e.g. the ✓/✗ known–unknown pair in term lists). */
export function setInTermList(kind: TermListKind, id: string, member: boolean): void {
  void stores[kind].mutate((s) => withId(s, id, member));
}

/** Remove many ids at once (e.g. a deck reset unflagging its own terms). */
export function removeManyFromTermList(kind: TermListKind, ids: Iterable<string>): void {
  const list = [...ids];
  void stores[kind].mutate((s) => withoutIds(s, list));
}

/** Live view of one list (re-renders on any change to it, any screen). */
export function useTermList(kind: TermListKind): ReadonlySet<string> {
  return stores[kind].use();
}

/* ---- PER-CONTEXT bookmark API (the 🔖 list) ----
 * Bookmarks are no longer one global list: each CONTEXT (the Glossary, or a
 * given topic) keeps its own bookmark set under `ape:bm:<ctx>`. The stores
 * are created lazily per ctx and held in a Map (never cleared: mounted
 * useBookmarks() hooks subscribe to the captured store, and each store
 * registers its own account-wipe reset). Fresh start — the old global
 * `ape:glossaryFavs` (BOOKMARK_KEY) is abandoned and never read. */
const bookmarkStores = new Map<string, LocalStore<IdSet>>();

function bookmarkKey(ctx: string): string {
  return `ape:bm:${ctx}`;
}

function bookmarkStore(ctx: string): LocalStore<IdSet> {
  let s = bookmarkStores.get(ctx);
  if (!s) {
    s = idSetStore(bookmarkKey(ctx));
    bookmarkStores.set(ctx, s);
  }
  return s;
}

export function getBookmarks(ctx: string): ReadonlySet<string> {
  return bookmarkStore(ctx).get();
}

export function isBookmarked(ctx: string, id: string): boolean {
  return bookmarkStore(ctx).get().has(id);
}

export function toggleBookmark(ctx: string, id: string): boolean {
  const s = bookmarkStore(ctx);
  const member = !s.get().has(id);
  void s.mutate((set) => withId(set, id, member));
  return member;
}

export function removeBookmarks(ctx: string, ids: Iterable<string>): void {
  const list = [...ids];
  void bookmarkStore(ctx).mutate((set) => withoutIds(set, list));
}

/** Every context that currently holds ≥1 bookmark — scanned from storage. Used
 *  by the Glossary's two-level bookmark filter (user request 2026-07-24).
 *  A read-only scan: a key it cannot read is skipped, nothing is written. */
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
  return bookmarkStore(ctx).use();
}

/* ---- "Show my Custom List on the Dashboard" toggle ----
 * A device-local boolean on the same store. Controls whether the user's
 * Custom List appears as a synthetic current-topic on the Dashboard. Default
 * false. Stored as the words 'true' / 'false' (unchanged on disk). */
const CUSTOM_ON_DASHBOARD_KEY = 'ape:customOnDashboard';

const customOnDashboard = createLocalStore<boolean>({
  key: CUSTOM_ON_DASHBOARD_KEY,
  empty: () => false,
  parse: (p) => p === true || p === 'true',
  serialize: (v) => (v ? 'true' : 'false'),
});

export function getCustomOnDashboard(): boolean {
  return customOnDashboard.get();
}

export function setCustomOnDashboard(v: boolean): void {
  void customOnDashboard.set(v);
}

/** Live view of the "show custom list on dashboard" flag (any screen). */
export function useCustomOnDashboard(): boolean {
  return customOnDashboard.use();
}

/* ---- Account-wipe reset (clearLocalAccountData / user switch) ---- */

/** Reset ALL in-memory caches owned by this module — the four term lists, every
 *  per-context bookmark store, and the customOnDashboard flag. Each store
 *  registers its own reset with the wipe, so this is for callers and tests. */
export function resetLocal(): void {
  for (const s of Object.values(stores)) s.reset();
  for (const s of bookmarkStores.values()) s.reset();
  customOnDashboard.reset();
}
