/**
 * stageplot/spStore — the SAVED STAGE PLOTS on this device (must-do D60;
 * handoff §2: "autosave locally… restore after a restart… rename, duplicate
 * and delete with the app's normal safeguards").
 *
 * On the shared safe store (createLocalStore, AGENTS.md house helpers), one
 * `ape:` key, so the four storage rules hold by construction:
 *   • a read that FAILED is UNREADABLE, never "nothing saved": nothing is
 *     written over the stored copy until a read succeeds, and a project
 *     started meanwhile joins the stored list when it does;
 *   • "saved" is only ever said from a write the device accepted;
 *   • the account wipe reaches the store with no hand-written entry (the
 *     store registers its own reset), and the key is swept with `ape:*`;
 *   • a read or a write in flight across the wipe lands nowhere.
 *
 * EVERY LOAD GOES THROUGH spMigrate, row by row: a saved band's setup
 * survives a release that changed the shape. A row written by a NEWER
 * version of the app than this one is not understood here, so it is kept
 * aside untouched and written back as it was (never dropped, never shown as
 * something it is not).
 *
 * WHO IS SAVED (house guest rule, tier.ts):
 *   'write'  a real account: every change is written to the device.
 *   'hold'   a guest, or an account still being checked: the work is kept for
 *            this app session only, and held for a sign-in later in the same
 *            session (features/lab/sessionCarry).
 *   'drop'   a preview: kept on screen for this session, held for nobody.
 * The screen sets the mode from useTier(); the store never guesses it.
 *
 * ON THIS DEVICE ONLY. Deferred [MD:D60]: there is no server table for stage
 * plots, so a project is not carried to the same account on another phone.
 *
 * NO PROJECT IS EVER PUSHED OUT. The library has a cap, and at the cap a NEW
 * project is refused with a plain message; saving a project that is already
 * there always works. (Room Design drops its oldest design at its cap. A
 * band's stage plot is not something to lose that way.)
 */
import { useSyncExternalStore } from 'react';
import { holdSessionWork, peekSessionWork, registerSessionCarry, releaseSessionWork } from '../lab/sessionCarry';
import { createLocalStore } from '../storage/localStore';
import { spMigrate } from './spModel.ts';
import { SP_SCHEMA, type SpId, type SpProject } from './spTypes.ts';

export const SP_STORE_KEY = 'ape:stageplot:v1';
/** The most stage plots one device keeps (a few hundred kilobytes at most). */
export const SP_MAX_PROJECTS = 24;

export type SpLibrary = {
  v: 1;
  projects: SpProject[];
  /** Rows a newer version of the app wrote: kept and written back untouched. */
  later: unknown[];
};

export type SpSaveMode = 'write' | 'hold' | 'drop';
/** `saved` = the device accepted the write. `session-only` = kept for this
 *  session, not written. `failed` = a write was tried and did not land. */
export type SpSaveResult = 'saved' | 'session-only' | 'failed';

const EMPTY = (): SpLibrary => ({ v: 1, projects: [], later: [] });

/* ── pure ───────────────────────────────────────────────────────────────── */

/** Newest change first. */
export const spNewestFirst = (list: readonly SpProject[]): SpProject[] => [...list].sort((a, b) => b.modifiedAt - a.modifiedAt || a.id.localeCompare(b.id));

/** A stored blob as a clean library: every project through spMigrate, one
 *  row per id (the newest wins), junk dropped, newer-schema rows kept aside. */
export function spSanitizeLibrary(raw: unknown): SpLibrary {
  const out = EMPTY();
  const r = (raw ?? {}) as { projects?: unknown; later?: unknown };
  const rows = [...(Array.isArray(r.projects) ? r.projects : []), ...(Array.isArray(r.later) ? r.later : [])];
  const byId = new Map<SpId, SpProject>();
  const laterIds = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const x = row as { id?: unknown; schema?: unknown };
    if (typeof x.id !== 'string' || !x.id || typeof x.schema !== 'number') continue;
    if (x.schema > SP_SCHEMA) {
      if (!laterIds.has(x.id)) {
        laterIds.add(x.id);
        out.later.push(row);
      }
      continue;
    }
    let p: SpProject | null = null;
    try {
      p = spMigrate(row);
    } catch {
      p = null; // one unusable row never takes the others with it
    }
    if (!p) continue;
    const have = byId.get(p.id);
    if (!have || p.modifiedAt >= have.modifiedAt) byId.set(p.id, p);
  }
  out.projects = [...byId.values()];
  return out;
}

/** Insert, or replace the row with the same id. */
export function spWithProject(lib: SpLibrary, p: SpProject): SpLibrary {
  const at = lib.projects.findIndex((x) => x.id === p.id);
  const projects = at < 0 ? [...lib.projects, p] : lib.projects.map((x, i) => (i === at ? p : x));
  return { ...lib, projects };
}

/** Insert or replace several; for a row already there, the NEWER one wins. */
export function spWithProjects(lib: SpLibrary, add: readonly SpProject[]): SpLibrary {
  let next = lib;
  for (const p of add) {
    const have = next.projects.find((x) => x.id === p.id);
    if (!have || p.modifiedAt >= have.modifiedAt) next = spWithProject(next, p);
  }
  return next;
}

export function spWithoutProject(lib: SpLibrary, id: SpId): SpLibrary {
  return lib.projects.some((x) => x.id === id) ? { ...lib, projects: lib.projects.filter((x) => x.id !== id) } : lib;
}

/** True when a NEW project may not be added. */
export const spAtCap = (list: readonly SpProject[]): boolean => list.length >= SP_MAX_PROJECTS;

/** What a project is called in a list: the band, then the title. */
export function spProjectName(p: Pick<SpProject, 'band' | 'title'>): string {
  const band = p.band.trim();
  const title = p.title.trim();
  if (band && title) return `${band} — ${title}`;
  return band || title || 'Untitled stage plot';
}

/** The words read as a month: the full name or its usual short form (a
 *  period after it is allowed). Nothing else: "Junk 5 2026" is not June 5. */
const MONTH_WORDS_READ: readonly (readonly string[])[] = [
  ['jan', 'january'],
  ['feb', 'february'],
  ['mar', 'march'],
  ['apr', 'april'],
  ['may'],
  ['jun', 'june'],
  ['jul', 'july'],
  ['aug', 'august'],
  ['sep', 'sept', 'september'],
  ['oct', 'october'],
  ['nov', 'november'],
  ['dec', 'december'],
];
/** 1…12, or 0 when the word is not a month. */
const monthOf = (word: string): number => MONTH_WORDS_READ.findIndex((names) => names.includes(word)) + 1;

/**
 * An event date as typed → the stored form, an ISO day (YYYY-MM-DD).
 * '' stays '' (no date). null = not understood: the caller keeps what was
 * there and says how to type it. Read: 2026-12-05, 2026/12/5, Dec 5 2026,
 * December 5, 2026, 5 Dec 2026. A day that does not exist (February 30) is
 * not understood.
 *
 * NUMBERS ONLY WITH THE YEAR FIRST. "5/12/2026" is May 12 to one musician and
 * December 5 to another, and a wrong day in a packet's heading and file name
 * is worse than typing the date again: that form is not read, and the field
 * says how the date it did read is understood (spDateWords).
 */
export function spDayFromText(text: string): string | null {
  const t = text.trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
  if (!t) return '';
  let y = 0;
  let m = 0;
  let d = 0;
  let hit: RegExpExecArray | null;
  if ((hit = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(t))) [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^([a-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)? (\d{4})$/.exec(t))) [m, d, y] = [monthOf(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})(?:st|nd|rd|th)? ([a-z]{3,9})\.? (\d{4})$/.exec(t))) [d, m, y] = [Number(hit[1]), monthOf(hit[2]), Number(hit[3])];
  else return null;
  if (m < 1 || m > 12 || d < 1 || y < 1900 || y > 2200) return null;
  const real = new Date(Date.UTC(y, m - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** A stage size as typed: a number above zero, with a period or a comma.
 *  '' = no size (null). 'unread' = not a number; 'zero' and 'big' = a
 *  number out of range, each said in its own words. */
export function spStageSizeFromText(text: string): number | null | 'unread' | 'zero' | 'big' {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+([.,]\d+)?$/.test(t)) return 'unread';
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n)) return 'unread';
  if (n <= 0) return 'zero';
  if (n > 1000) return 'big';
  return Math.round(n * 100) / 100;
}
/** A time as most people type one: "9", "9 PM", "9:30", "21:30", "9:30 p.m.".
 *  Anything else is kept as typed (a time can be "after the opener"), and
 *  the field says it was not read as a time. */
export function spLooksLikeTime(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  const hit = /^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/.exec(t);
  if (!hit) return false;
  const h = Number(hit[1]);
  const m = hit[2] == null ? 0 : Number(hit[2]);
  if (m > 59) return false;
  return hit[3] ? h >= 1 && h <= 12 : h <= 23;
}

const MONTH_WORDS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A stored day in words nobody can read two ways: "December 5, 2026".
 *  '' for no date or a text that is not a stored day. */
export function spDateWords(iso: string): string {
  const hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!hit) return '';
  const m = Number(hit[2]);
  if (m < 1 || m > 12) return '';
  return `${MONTH_WORDS[m - 1]} ${Number(hit[3])}, ${Number(hit[1])}`;
}

/** A new project id. Never a channel number, never reused. */
export function spNewProjectId(now: number = Date.now(), rand: number = Math.random()): SpId {
  return `sp-${now.toString(36)}-${Math.floor(rand * 0xfffff)
    .toString(36)
    .padStart(4, '0')}`;
}

/* ── this session's unwritten work (a guest, a preview, an account still
      being checked) ──────────────────────────────────────────────────────── */

type Session = { projects: readonly SpProject[]; removed: ReadonlySet<SpId> };
const emptySession = (): Session => ({ projects: [], removed: new Set() });
let session: Session = emptySession();
const sessionListeners = new Set<() => void>();
function setSession(next: Session): void {
  session = next;
  for (const l of [...sessionListeners]) l();
}

let mode: SpSaveMode = 'hold';
/** Set by the lab screen on every render, from useTier(). The default is
 *  'hold': until the screen has said who this is, nothing is written. */
export function setSpSaveMode(next: SpSaveMode): void {
  mode = next;
}
export const getSpSaveMode = (): SpSaveMode => mode;

const store = createLocalStore<SpLibrary>({
  key: SP_STORE_KEY,
  empty: EMPTY,
  parse: (p) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('not a stage plot library');
    return spSanitizeLibrary(p);
  },
  // Nothing saved = no key.
  serialize: (v) => (v.projects.length === 0 && v.later.length === 0 ? null : JSON.stringify(v)),
  // The account wipe: the departing person's session copies go with it.
  onReset: () => setSession(emptySession()),
});

/** The library as the screen sees it: the stored projects with this
 *  session's unwritten copies on top, newest first. */
let viewCache: { base: SpLibrary; session: Session; out: SpProject[] } | null = null;
function view(): SpProject[] {
  const base = store.get();
  if (viewCache && viewCache.base === base && viewCache.session === session) return viewCache.out;
  const byId = new Map<SpId, SpProject>();
  for (const p of base.projects) if (!session.removed.has(p.id)) byId.set(p.id, p);
  for (const p of session.projects) byId.set(p.id, p);
  const out = spNewestFirst([...byId.values()]);
  viewCache = { base, session, out };
  return out;
}
function subscribe(listener: () => void): () => void {
  sessionListeners.add(listener);
  const off = store.subscribe(listener);
  return () => {
    sessionListeners.delete(listener);
    off();
  };
}

const CARRY_KEY = 'stageplot';

/** Pure: held projects plus one (insert or replace by id). */
export function spWithHeld(prev: readonly SpProject[] | undefined, p: SpProject): SpProject[] {
  return [...(prev ?? []).filter((x) => x.id !== p.id), p];
}

// The session ledger's writer: a guest signed in during this session, or an
// account's check finished. What was held joins that account's library. A
// refused write is told by the shared notice (no screen is saving it).
registerSessionCarry<SpProject[]>(CARRY_KEY, async (held) => {
  // What the ledger holds NOW: a project deleted meanwhile was let go there.
  const now = spSanitizeLibrary({ projects: peekSessionWork<SpProject[]>(CARRY_KEY) ?? held }).projects;
  if (!now.length) return true;
  const ok = await store.mutate((lib) => spWithProjects(lib, now));
  if (ok) {
    // The stored copy is the one to show now, unless this session moved on.
    const writtenAt = new Map(now.map((p) => [p.id, p.modifiedAt] as const));
    setSession({ ...session, projects: session.projects.filter((p) => !(writtenAt.has(p.id) && p.modifiedAt <= (writtenAt.get(p.id) ?? 0))) });
  }
  return ok;
});

/* ── the store's actions ────────────────────────────────────────────────── */

/** Newest first. Starts the read when nothing has tried yet. */
export const getSpProjects = (): SpProject[] => view();
export const getSpProject = (id: SpId): SpProject | undefined => view().find((p) => p.id === id);

/** Where a project in the list stands right now, for the words on screen. */
export function spProjectSaveState(id: SpId): SpSaveResult {
  if (session.projects.some((p) => p.id === id)) return 'session-only';
  return store.isHydrated() ? 'saved' : 'failed';
}

/**
 * Save one project (insert, or replace the row with its id).
 *   'write' → written to the device; 'saved' only when the write landed.
 *   'hold' / 'drop' → kept for this session, nothing written.
 */
export function saveSpProject(p: SpProject): Promise<SpSaveResult> {
  if (mode !== 'write') {
    setSession({ projects: spWithHeld(session.projects, p), removed: session.removed });
    // A guest's work is held for a sign-in later this session; a preview's is
    // not (the ledger refuses a preview itself as well).
    if (mode === 'hold') holdSessionWork<SpProject[]>(CARRY_KEY, (prev) => spWithHeld(prev, p));
    void store.hydrate(); // shown over the stored list, which is only read
    return Promise.resolve('session-only');
  }
  // A write the device refuses raises the shared notice (createLocalStore),
  // and the editor's own line reads "Not saved" until a later write lands.
  return store.mutate((lib) => spWithProject(lib, p)).then((ok) => {
    if (!ok) return 'failed';
    // Written: this session's unwritten copy of it, if any, is no longer needed.
    if (session.projects.some((x) => x.id === p.id)) setSession({ ...session, projects: session.projects.filter((x) => x.id !== p.id) });
    return 'saved';
  });
}

/** Delete one project. True when it is gone: from the device for a real
 *  account, from this session for a guest. A gig copy never takes its master
 *  with it, and a master never takes its gig copies. */
export function deleteSpProject(id: SpId): Promise<boolean> {
  // Let go of it in the session ledger too, whoever is signed in: a guest who
  // made it, deleted it and then signed in must not get it back.
  releaseSessionWork<SpProject[]>(CARRY_KEY, (held) => held.filter((p) => p.id !== id));
  if (mode !== 'write') {
    const removed = new Set(session.removed);
    removed.add(id);
    setSession({ projects: session.projects.filter((p) => p.id !== id), removed });
    return Promise.resolve(true);
  }
  return store.mutate((lib) => spWithoutProject(lib, id)).then((ok) => {
    if (ok && session.projects.some((p) => p.id === id)) setSession({ ...session, projects: session.projects.filter((p) => p.id !== id) });
    return ok;
  });
}

/** Moves on at every account wipe. The open editor compares it, so one
 *  person's open project is never autosaved into the next person's library. */
export const spStoreGeneration = (): number => store.generation();

/** Read the device again after a failed read (the "Try again" button). */
export function retrySpLibrary(): void {
  void store.hydrate();
}

/** The account wipe reaches this by itself; exported for the tests. */
export function resetLocal(): void {
  store.reset();
}

/* ── React ──────────────────────────────────────────────────────────────── */

/** The library, newest first (hydrates on first use). */
export function useSpProjects(): SpProject[] {
  return useSyncExternalStore(subscribe, view, view);
}

/** The three faces of the list: still reading, could not be read, ready
 *  (which may be empty). A failed read is never shown as "nothing saved". */
export type SpLibraryFace = 'loading' | 'unreadable' | 'ready';
export function spLibraryFace(): SpLibraryFace {
  if (store.isUnreadable()) return 'unreadable';
  return store.isHydrated() ? 'ready' : 'loading';
}
export function useSpLibraryFace(): SpLibraryFace {
  store.use(); // re-render when a read lands or fails
  store.useHydrated();
  return spLibraryFace();
}
