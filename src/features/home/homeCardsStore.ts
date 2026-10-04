/**
 * homeCardsStore — the paid user's chosen HOME (Course Select) screen topic
 * cards (user request 2026-07-22). An ordered list of topic gs; Glossary and
 * Audio Tools are ALWAYS on Home and locked (never stored here). Hard cap of
 * HOME_MAX (20) user cards. Device-local, persisted.
 *
 * On the shared safe store (G1 tightening, 2026-10-02): three keys, three
 * createLocalStore instances. The hand-rolled version set `readFailed` on a
 * failed read, marked itself hydrated, and never read again in that launch —
 * so every later Home Setup save, book tap and core-slot reservation looked
 * applied on screen but was silently never written. The safe store keeps a
 * failed read UNREADABLE, holds the taps queued, reads again on the next
 * action, and applies them on top of the stored copy (never over it).
 *
 * Every operation decides its INTENT from `get()` (what the screen shows) and
 * then mutates with that intent — a tap before the list loads means ADD, and
 * is replayed as an add, never as a toggle (full run 2, 2026-10-01).
 */
import { createLocalStore } from '../storage/localStore';

export const HOME_MAX = 20;
const KEY = 'ape:homeCards';
const BKEY = 'ape:homeBundles';
const DKEY = 'ape:homeDefaultGs';

/**
 * START HERE's place in the saved Home order (owner 2026-10-04: "home is
 * default, stays where user last left it after they move it"). Start Here is
 * on every Home deck; on a member's custom deck Home Setup lets them drag it
 * like a topic row, and its slot is stored IN this list, beside the topics,
 * as this marker. It is never a topic: every topic view below leaves it out,
 * and it does not count toward HOME_MAX.
 *
 * A saved list WITHOUT the marker (every list saved before this, and every
 * new account) has Start Here at its default place — the front, right after
 * Career Finder — added on READ only (`withStartHere`): a stored order is not
 * rewritten to add it. The first Home Setup save stores it where the learner
 * left it; from then on their order wins. It cannot be taken off Home (it is
 * the only way into Start Here — owner 2026-09-29: "always reachable from its
 * own Home card").
 */
export const HOME_START_HERE = -1;

const isTopic = (g: number) => g !== HOME_START_HERE;
/** Dedupe; at most HOME_MAX topics; the Start Here marker kept where it is. */
function capTopics(l: number[]): number[] {
  let n = 0;
  return [...new Set(l)].filter((g) => !isTopic(g) || ++n <= HOME_MAX);
}

/** Last-input memo: the views below must hand React the SAME array until the
 *  stored list changes (useMemo deps, useSyncExternalStore snapshots). */
function lastOf(fn: (l: number[]) => number[]): (l: number[]) => number[] {
  let lastIn: number[] | null = null;
  let lastOut: number[] = [];
  return (l) => {
    if (l !== lastIn) {
      lastIn = l;
      lastOut = fn(l);
    }
    return lastOut;
  };
}
/** The topics only (what every topic caller has always read). */
const topicsView = lastOf((l) => (l.includes(HOME_START_HERE) ? l.filter(isTopic) : l));
/** The whole order with Start Here in it — at the front when never placed. */
const orderView = lastOf((l) => (l.includes(HOME_START_HERE) ? l : [HOME_START_HERE, ...l]));

const listStore = createLocalStore<number[]>({
  key: KEY,
  empty: () => [],
  parse: (p) => {
    if (!Array.isArray(p)) throw new Error('home cards: not a list');
    return capTopics(p.filter((g): g is number => typeof g === 'number'));
  },
});

const bundleStore = createLocalStore<string[]>({
  key: BKEY,
  empty: () => [],
  parse: (p) => {
    if (!Array.isArray(p)) throw new Error('home bundles: not a list');
    return [...new Set(p.filter((k): k is string => typeof k === 'string'))];
  },
});

/** The topic the Home carousel opens on (user 2026-07-24); null = none. Stored
 *  as the bare number (String(n) — what the old store wrote); "none" removes
 *  the key. Validated against the topic list when read out, below. */
const defaultStore = createLocalStore<number | null>({
  key: DKEY,
  empty: () => null,
  parse: (p) => (typeof p === 'number' && Number.isFinite(p) ? Math.trunc(p) : null),
  serialize: (v) => (v == null ? null : String(v)),
});

/** Total Home cards (topics + bundles) — the 20-cap counts both. */
export function homeCardCount(): number {
  return topicsView(listStore.get()).length + bundleStore.get().length;
}

const addTopic = (gs: number) => (l: number[]) =>
  !isTopic(gs) || l.includes(gs) || topicsView(l).length + bundleStore.get().length >= HOME_MAX ? l : [...l, gs];
const dropTopic = (gs: number) => (l: number[]) => (l.includes(gs) ? l.filter((g) => g !== gs) : l);
/** A topic leaving Home takes the default-landing choice with it. */
const clearDefaultIf = (gone: (d: number) => boolean) => (d: number | null) => (d != null && gone(d) ? null : d);

export function getHomeGs(): number[] {
  return topicsView(listStore.get());
}

/** The saved Home order WITH Start Here's slot (HOME_START_HERE) — at the
 *  front when it has never been placed. For Home Setup and the Home deck. */
export function getHomeOrder(): number[] {
  return orderView(listStore.get());
}

/** Live view of getHomeOrder. */
export function useHomeOrder(): number[] {
  return orderView(listStore.use());
}

/**
 * Where Start Here goes on a member's Home deck: null = its default place
 * (right after Career Finder, ahead of the member's own cards); otherwise the
 * gs of the topic card it follows. The required cores are skipped — Home
 * Setup keeps them at the front of the saved list, ahead of every row the
 * learner can move — and so is anything the deck does not show (`skip`).
 */
export function startHereAfter(order: readonly number[], skip: (gs: number) => boolean): number | null {
  const i = order.indexOf(HOME_START_HERE);
  for (let j = i - 1; j >= 0; j--) if (!skip(order[j])) return order[j];
  return null;
}

/** Whether the stored Home list has been READ (not the empty placeholder).
 *  The Home Setup sheet captures this when it builds its draft: a draft built
 *  from an unread list must not be saved even if the list lands meanwhile. */
export function isHomeListHydrated(): boolean {
  return listStore.isHydrated();
}

/** Commit a new ordered list (deduped, capped). Used by the Home Setup sheet's
 *  Save action. Answers whether the device accepted BOTH writes (owner ruling
 *  2026-10-03: "if it fails the user needs to know") — the sheet says so. */
export function setHomeGs(gs: number[]): Promise<boolean> {
  // ⛔ A WHOLE-LIST SAVE NEEDS THE STORED LIST (hunt 6, 2026-10-03). The sheet
  // builds its draft from getHomeGs(); while the stored list is unread (the
  // read FAILED, or has not landed) that is the empty placeholder, so the
  // draft lacked every saved card AND the reserved core slots. `set` queued
  // it, the sheet said "Home not saved", and the next good read then wrote
  // that draft OVER the stored list — the cards the learner never saw were
  // gone. Refuse instead (the sheet says so), and read again so the next
  // open shows the real list.
  if (!listStore.isHydrated()) {
    void listStore.hydrate();
    void defaultStore.hydrate(); // the sheet reads both when it reopens
    return Promise.resolve(false);
  }
  // The Home Setup save carries Start Here's slot (HOME_START_HERE) where the
  // learner left it; it is stored like any row and never counted as a topic.
  const next = capTopics(gs);
  // The sheet says a refused write itself ("Home not saved"): not the shared notice too.
  const list = listStore.set(next, { reportFailure: false });
  const def = defaultStore.mutate(clearDefaultIf((d) => !next.includes(d)), { reportFailure: false });
  return Promise.all([list, def]).then(([a, b]) => a && b);
}

export function isOnHome(gs: number): boolean {
  return topicsView(listStore.get()).includes(gs);
}

/** Toggle a single topic on/off Home (per-card book toggle, user request
 *  2026-07-22). Returns 'full' without adding when already at HOME_MAX. */
export function toggleHome(gs: number): 'added' | 'removed' | 'full' {
  // Until the saved list has loaded, a tap means ADD (full run 2, 2026-10-01):
  // a double tap then must not cancel itself out against its own queued add.
  if (listStore.isHydrated() && listStore.get().includes(gs)) {
    void listStore.mutate(dropTopic(gs));
    void defaultStore.mutate(clearDefaultIf((d) => d === gs));
    return 'removed';
  }
  if (homeCardCount() >= HOME_MAX) return 'full';
  void listStore.mutate(addTopic(gs));
  return 'added';
}

/** Ensure a topic is on Home (add if absent, respecting the cap). Returns false
 *  if the cap blocked it. Used to auto-reserve the required core courses' Home
 *  slots (user request 2026-07-22). */
export function ensureHome(gs: number): boolean {
  if (listStore.get().includes(gs)) return true;
  if (homeCardCount() >= HOME_MAX) return false;
  void listStore.mutate(addTopic(gs));
  return true;
}

/** Remove a topic from Home if present (e.g. a core course, once completed,
 *  auto-frees its reserved slot — user request 2026-07-22). */
export function removeHome(gs: number): void {
  void listStore.mutate(dropTopic(gs));
  void defaultStore.mutate(clearDefaultIf((d) => d === gs));
}

/* ---- Bundle (cert/program) Home cards (user request 2026-07-22) ---- */

export function isBundleOnHome(key: string): boolean {
  return bundleStore.get().includes(key);
}

/** Toggle a cert/program bundle card on/off Home (counts toward HOME_MAX). */
export function toggleHomeBundle(key: string): 'added' | 'removed' | 'full' {
  // Before the saved list loads a tap means ADD — see toggleHome.
  if (bundleStore.isHydrated() && bundleStore.get().includes(key)) {
    void bundleStore.mutate((b) => b.filter((k) => k !== key));
    return 'removed';
  }
  if (homeCardCount() >= HOME_MAX) return 'full';
  void bundleStore.mutate((b) =>
    b.includes(key) || b.length + listStore.get().length >= HOME_MAX ? b : [...b, key],
  );
  return 'added';
}

/** Drop a bundle from Home (e.g. when it's removed from the registry). */
export function removeHomeBundle(key: string): void {
  void bundleStore.mutate((b) => (b.includes(key) ? b.filter((k) => k !== key) : b));
}

export function useHomeBundles(): string[] {
  return bundleStore.use();
}

/** Live view of the Home topic list. */
export function useHomeGs(): number[] {
  return topicsView(listStore.use());
}

/** Reset ALL in-memory caches (account wipe / user switch — clearLocalAccountData).
 *  The safe stores also self-register with the wipe registry; calling them
 *  twice is harmless. Mounted hooks re-read the (cleared) storage. */
export function resetLocal(): void {
  listStore.reset();
  bundleStore.reset();
  defaultStore.reset();
}

/* ---- Default landing card (user request 2026-07-24) ----
 * The Home (Course Select) carousel opens on this topic's card. null = no
 * explicit choice → the carousel opens on Glossary (its prior default). Always
 * one of the Home topics, or null. */

const validDefault = (d: number | null, list: number[]): number | null =>
  d != null && isTopic(d) && list.includes(d) ? d : null;

export function getDefaultHomeGs(): number | null {
  return validDefault(defaultStore.get(), listStore.get());
}

/** Set (or clear, with null) the default landing card. A gs that isn't a current
 *  Home topic is ignored (stored as null). */
export function setDefaultHomeGs(gs: number | null): Promise<boolean> {
  // Validated against the Home list — an unread list is the empty placeholder,
  // which would store "none" over the learner's choice (see setHomeGs).
  if (!listStore.isHydrated()) {
    void listStore.hydrate();
    void defaultStore.hydrate();
    return Promise.resolve(false);
  }
  return defaultStore.set(validDefault(gs, listStore.get()), { reportFailure: false }); // Home Setup says a refusal
}

/** Live view of the default landing topic gs (null = none). */
export function useDefaultHomeGs(): number | null {
  const d = defaultStore.use();
  const list = listStore.use();
  return validDefault(d, list);
}
