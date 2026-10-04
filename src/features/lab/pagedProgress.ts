/**
 * pagedProgress — persistence for the visual, paged labs (Sound Envelope,
 * Speech & Voice, Smart Processors). AsyncStorage `ape:<labId>:v1` keeps
 * only what reproduces the learner's place: completed pages, last page.
 *
 * GUESTS (owner ruling 2026-10-01): a host that does not save for a guest
 * HOLDS the guest's work instead (holdPagedProgress — the pages finished and
 * the page reached, as deltas). The shared ledger (sessionCarry) writes it to
 * the account the guest signs in to in the same app session, and every later
 * save of that lab merges it in, so a save from a copy read before the
 * hand-off can never drop it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dropSessionWork, holdSessionWork, peekSessionWork, registerSessionCarry } from './sessionCarry';
import { armSaveFailureReport } from '../storage/saveFailureNotice';

export type PagedProgress = { completed: number[]; lastPage: number; done: boolean };

const key = (labId: string) => `ape:${labId}:v1`;

const EMPTY = (): PagedProgress => ({ completed: [], lastPage: 0, done: false });

/** Only non-negative integers, each once, ascending — a damaged or hand-edited
 *  record can never make the page dots or the n/N counter lie. */
function cleanCompleted(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  for (const v of raw) if (typeof v === 'number' && Number.isInteger(v) && v >= 0) seen.add(v);
  return [...seen].sort((a, b) => a - b);
}

function parsePaged(raw: string | null): PagedProgress {
  try {
    if (!raw) return EMPTY();
    const p = JSON.parse(raw) as Partial<PagedProgress>;
    return {
      completed: cleanCompleted(p.completed),
      lastPage: typeof p.lastPage === 'number' && Number.isInteger(p.lastPage) && p.lastPage >= 0 ? p.lastPage : 0,
      done: !!p.done,
    };
  } catch {
    return EMPTY();
  }
}

/** Labs whose last load FAILED to read (full run 2, 2026-10-01): the screen
 *  was handed an empty copy, and saving it would have written over the
 *  learner's stored pages. */
const unreadable = new Set<string>();

/** True while this lab's last load FAILED to read (owner 2026-10-03, "do 2"):
 *  the copy the screen holds is a stand-in, so the lab says so instead of
 *  showing every page unstarted. Read-only — changes nothing that is written. */
export function isPagedProgressUnreadable(labId: string): boolean {
  return unreadable.has(labId);
}

export async function loadPagedProgress(labId: string): Promise<PagedProgress> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key(labId));
  } catch {
    unreadable.add(labId);
    return EMPTY();
  }
  unreadable.delete(labId);
  return parsePaged(raw);
}

export async function savePagedProgress(labId: string, p: PagedProgress): Promise<void> {
  const reportRefused = armSaveFailureReport();
  if (unreadable.has(labId)) {
    // Read again first; still unreadable → write nothing. Read → what is
    // stored joins (pages are a union, `done` never clears).
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(key(labId));
    } catch {
      // The page this save carried is dropped (never written over a copy
      // that could not be read) — and SAID (hunt 10, 2026-10-03; Amp, Ear and
      // Tuning's hunt 7 rule): a ✓ the screen showed was gone next visit,
      // without a word. Callers save only after a change.
      reportRefused();
      return;
    }
    // STAYS flagged until a load succeeds (evening pass 3, 2026-10-02): the
    // screen still holds the empty copy it was handed, so its NEXT save (one
    // more page) would have replaced the stored pages merged in here. Every
    // save until then joins what is stored; a practice reset removes the key,
    // so it is not undone by this.
    const stored = parsePaged(raw);
    p = { completed: [...new Set([...stored.completed, ...p.completed])].sort((a, b) => a - b), lastPage: p.lastPage, done: stored.done || p.done };
  }
  try {
    await AsyncStorage.setItem(key(labId), JSON.stringify(withHeldPages(p, heldPaged(labId))));
  } catch {
    // A page the device refused is told to the learner (owner 2026-10-03).
    reportRefused();
  }
}

/** A guest's work in one paged lab this session (deltas only). */
export type HeldPaged = { completed: number[]; lastPage?: number; done?: boolean };

const carryKey = (labId: string) => `paged:${labId}`;
const registered = new Set<string>();

/** What is held for this lab in this session (undefined when nothing is). */
export function heldPaged(labId: string): HeldPaged | undefined {
  return peekSessionWork<HeldPaged>(carryKey(labId));
}

/**
 * Hold a guest's work in a paged lab: a page finished (`done`), the page
 * reached (`lastPage`), or the lab finished (`labDone`). Never a whole
 * on-screen copy. The ledger refuses a preview and anything after a sign-out.
 */
export function holdPagedProgress(labId: string, d: { done?: number; lastPage?: number; labDone?: boolean }): void {
  // The writer for this key — registered once per lab, BEFORE the first hold
  // (a hold for a signed-in account writes straight away).
  if (!registered.has(labId)) {
    registered.add(labId);
    registerSessionCarry<HeldPaged>(carryKey(labId), async (h) => {
      const reportRefused = armSaveFailureReport();
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(key(labId));
      } catch {
        return false; // never written over a copy that could not be read
      }
      try {
        await AsyncStorage.setItem(key(labId), JSON.stringify(withHeldPages(parsePaged(raw), h, true)));
        return true;
      } catch {
        reportRefused(); // the guest's carried pages
        return false;
      }
    });
  }
  holdSessionWork<HeldPaged>(carryKey(labId), (prev) => {
    const completed = prev?.completed ?? [];
    return {
      completed: d.done != null && !completed.includes(d.done) ? [...completed, d.done].sort((a, b) => a - b) : [...completed],
      lastPage: d.lastPage ?? prev?.lastPage,
      done: !!(prev?.done || d.labDone),
    };
  });
}

/**
 * Pure: a copy plus the held work — pages are a union (credit only grows),
 * `done` is never cleared. `takePlace` (the hand-off itself): the guest's
 * page is where the learner now is.
 */
export function withHeldPages(p: PagedProgress, h: HeldPaged | undefined, takePlace = false): PagedProgress {
  if (!h) return p;
  const completed = [...new Set([...p.completed, ...h.completed])].sort((a, b) => a - b);
  return {
    completed,
    lastPage: takePlace && h.lastPage != null ? h.lastPage : p.lastPage,
    done: p.done || !!h.done,
  };
}

/** A PRACTICE reset clears the page marks (credit lives elsewhere and is
 *  never touched): the marks held for the sign-in hand-off go too. */
export function forgetHeldPaged(labId: string): void {
  dropSessionWork(carryKey(labId));
}

export async function resetPagedProgress(labId: string): Promise<void> {
  forgetHeldPaged(labId);
  const reportRefused = armSaveFailureReport();
  try {
    await AsyncStorage.removeItem(key(labId));
  } catch {
    // The learner's practice reset did not stick: told, not silent.
    reportRefused();
  }
}
