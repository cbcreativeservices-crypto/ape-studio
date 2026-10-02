/**
 * drumProgress — the Drum Tuning Lab's device-local progress (AsyncStorage
 * `ape:drumtuning:v1`, inside the `ape:*` account wipe). The
 * mastering/masteringProgress pattern: only what reproduces the learner's
 * place — which chapters are banked, which scenarios were answered, whether
 * the chapter's interactive was completed, the resume point — plus the
 * Chapter 6 TUNING NOTES (owner spec: "save tuning notes so users can
 * reproduce a setup"). Never per-frame state.
 *
 * HOUSE GUEST RULE (owner 2026-08-12): a signed-out guest or a members-only
 * preview neither restores nor saves. The screen sets the flag every render
 * from the live entitlement (setDrumSaveBlocked) and waits for the tier to be
 * `resolved` before the first load.
 *
 * CREDIT IS NEVER REMOVED (owner 2026-09-29): a practice reset clears the
 * answers, the interactive flags and the resume point; it keeps `done` and
 * the tuning notes.
 *
 * SIGN-IN HAND-OFF (owner ruling 2026-10-01: "if in same session guest signs
 * in then current session is saved and stored"): every change the blocked
 * store refuses is applied to a SESSION COPY held by the shared ledger
 * (features/lab/sessionCarry). It starts empty, so it holds only this
 * session's work, and the ledger WRITES it into the account's copy
 * (mergeDrumProgress) when the guest signs in — or when a signed-in
 * learner's late membership read lands. A preview holds nothing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { holdSessionWork, registerSessionCarry } from '../../../features/lab/sessionCarry';
import { registerLocalStoreReset } from '../../../features/storage/localStoreRegistry';
import { DRUM_CHAPTERS, type DrumChapterId, type TuningNote } from './drumContent';

const KEY = 'ape:drumtuning:v1';

/** Notes are small; the list is capped so it can never grow into the
 *  AsyncStorage ceiling. Oldest drops first. */
export const MAX_TUNING_NOTES = 24;

export type DrumChapterProgress = {
  done: boolean;
  /** scenario id → answered correctly on the first pick. */
  answers: Record<string, boolean>;
  /** The chapter's interactive reached its goal this run. */
  interactive?: boolean;
};

export type DrumProgressState = {
  modules: Partial<Record<DrumChapterId, DrumChapterProgress>>;
  lastModule?: DrumChapterId;
  lastStep?: number;
  notes: TuningNote[];
};

export const emptyDrumChapter = (): DrumChapterProgress => ({ done: false, answers: {} });

let saveBlocked = false;
export function setDrumSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

const empty = (): DrumProgressState => ({ modules: {}, notes: [] });

export async function loadDrumProgress(): Promise<DrumProgressState> {
  return (await readStore()).state;
}

/** The stored copy, and whether it could be READ. `ok: false` = the read
 *  itself threw (an oversized row on Android, a storage error): the copy on
 *  the disk is unknown, so nothing may be written over it (toddler pass 2 —
 *  the read used to fall back to an EMPTY copy that the very next write saved
 *  over the real one: every chapter's credit, the answers and the notes
 *  gone, from one failed read). A missing or unparseable copy reads as empty
 *  and may be written. */
async function readStore(force = false): Promise<{ state: DrumProgressState; ok: boolean }> {
  if (saveBlocked && !force) return { state: empty(), ok: true };
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    return { state: empty(), ok: false };
  }
  if (!raw) return { state: empty(), ok: true };
  try {
    return { state: sanitizeDrumProgress(JSON.parse(raw)), ok: true };
  } catch {
    return { state: empty(), ok: true };
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** A damaged or older-shape copy (toddler pass 1, 2026-10-01): every field
 *  the lab reads is re-checked, so `scenarioId in answers` (which THROWS on
 *  a string) or `d.drum.split(...)` on a malformed note can never crash the
 *  screen or wedge the write queue. What is valid is kept. */
export function sanitizeDrumProgress(raw: unknown): DrumProgressState {
  const p = isObj(raw) ? raw : {};
  const modules: DrumProgressState['modules'] = {};
  const mods = isObj(p.modules) ? p.modules : {};
  for (const c of DRUM_CHAPTERS) {
    const m = mods[c.id];
    if (!isObj(m)) continue;
    const answers: Record<string, boolean> = {};
    if (isObj(m.answers)) for (const [k, v] of Object.entries(m.answers)) if (typeof v === 'boolean') answers[k] = v;
    modules[c.id] = { done: m.done === true, answers, ...(m.interactive === true ? { interactive: true } : {}) };
  }
  const lastModule = DRUM_CHAPTERS.some((c) => c.id === p.lastModule) ? (p.lastModule as DrumChapterId) : undefined;
  const lastStep = typeof p.lastStep === 'number' && Number.isInteger(p.lastStep) && p.lastStep >= 0 ? p.lastStep : undefined;
  return { modules, lastModule, lastStep, notes: Array.isArray(p.notes) ? p.notes.filter(validNote) : [] };
}

function validNote(n: unknown): n is TuningNote {
  if (!isObj(n)) return false;
  const x = n as unknown as TuningNote;
  return (
    typeof x.id === 'string' &&
    typeof x.name === 'string' &&
    typeof x.savedAt === 'number' &&
    Number.isFinite(x.savedAt) &&
    Array.isArray(x.drums) &&
    x.drums.every((d) => isObj(d) && typeof d.drum === 'string' && typeof d.batterHz === 'number' && Number.isFinite(d.batterHz) && (d.note == null || typeof d.note === 'string'))
  );
}

/** Where the lab resumes (toddler pass 1): a learner who never left
 *  Chapter 1 has a stored `lastStep` (and answers) but no `lastModule` —
 *  the resume point is Chapter 1 at that step, not step 0 of a blank run. */
export function drumResumePoint(s: DrumProgressState): { id: DrumChapterId; step: number; answers: Record<string, boolean> } {
  const id = s.lastModule ?? DRUM_CHAPTERS[0].id;
  return { id, step: s.lastStep ?? 0, answers: s.modules[id]?.answers ?? {} };
}

/** True when the copy reached the disk. A blocked store (guest / preview)
 *  and a failed write both answer false — never "saved". */
async function save(s: DrumProgressState, force = false): Promise<boolean> {
  if (saveBlocked && !force) return false;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    // Local convenience state — losing it never blocks learning.
    return false;
  }
}

/** Serialized read-modify-write: two writers in one tap never clobber each
 *  other through a stale copy. */
let queue: Promise<unknown> = Promise.resolve();
/** The identity generation (wave 2, 2026-10-02): bumped by the account wipe
 *  (registered with it below). An update tapped under the departing account
 *  that runs — or writes — after the wipe lands nowhere: it used to read the
 *  departing account's copy before the sweep and save it back after it, or
 *  apply the departing learner's tap to the next account's copy. */
let generation = 0;
registerLocalStoreReset(() => {
  generation++;
});
function runUpdate(mutate: (s: DrumProgressState) => void): Promise<{ state: DrumProgressState; saved: boolean; blocked: boolean }> {
  const gen = generation;
  const run = queue.then(async () => {
    const blocked = saveBlocked;
    const { state: s, ok: readOk } = await readStore();
    mutate(s);
    // Never write over a copy that could not be read (see readStore), and
    // never across the account wipe.
    const saved = readOk && gen === generation ? await save(s) : false;
    // Blocked (a guest, or the tier not known yet): the same change lands on
    // the session copy the ledger holds for the sign-in hand-off.
    if (blocked) holdSessionWork<DrumProgressState>(CARRY_KEY, (prev) => {
      const c = sanitizeDrumProgress(prev ?? empty());
      mutate(c);
      return c;
    });
    return { state: s, saved, blocked };
  });
  queue = run.catch(() => undefined);
  return run;
}
export function updateDrumProgress(mutate: (s: DrumProgressState) => void): Promise<DrumProgressState> {
  return runUpdate(mutate).then((r) => r.state);
}

/** A PRACTICE reset: answers, interactive flags and the resume point clear;
 *  `done` and the tuning notes are kept. */
export function resetDrumPractice(): Promise<DrumProgressState> {
  return updateDrumProgress((s) => {
    for (const id of Object.keys(s.modules) as DrumChapterId[]) {
      s.modules[id] = { ...emptyDrumChapter(), done: !!s.modules[id]?.done };
    }
    s.lastModule = undefined;
    s.lastStep = undefined;
  });
}

/** Insert or replace by id, oldest first, capped. */
export function withNote(notes: readonly TuningNote[], note: TuningNote): TuningNote[] {
  const next = [...notes.filter((n) => n.id !== note.id), note];
  next.sort((a, b) => a.savedAt - b.savedAt);
  while (next.length > MAX_TUNING_NOTES) next.shift();
  return next;
}

/** Save (insert or replace by id) a tuning note. `saved` is true only when
 *  the write reached the disk (toddler pass 1: the screen said "Saved on this
 *  device" before — and whether or not — the write landed). */
export function saveTuningNote(note: TuningNote): Promise<DrumProgressState & { saved: boolean; blocked: boolean }> {
  return runUpdate((st) => {
    st.notes = withNote(st.notes, note);
  }).then((r) => ({ ...r.state, saved: r.saved, blocked: r.blocked }));
}

/** Delete a tuning note. `saved` is true only when the shorter list reached
 *  the disk (toddler pass 2: a failed write used to vanish the row "for good"
 *  while the note stayed on the device and came back on the next visit). */
export function deleteTuningNote(id: string): Promise<DrumProgressState & { saved: boolean; blocked: boolean }> {
  return runUpdate((s) => {
    s.notes = s.notes.filter((n) => n.id !== id);
  }).then((r) => ({ ...r.state, saved: r.saved, blocked: r.blocked }));
}

const CARRY_KEY = 'drumtuning';

/**
 * Pure: the stored copy plus a session copy. Credit is a union (`done`,
 * `interactive`), the FIRST recorded answer wins (the stored one), the
 * session's notes are added under the cap (insert or replace by id), and the
 * place is where the learner is now.
 */
export function mergeDrumProgress(stored: DrumProgressState, session: DrumProgressState): DrumProgressState {
  const out = sanitizeDrumProgress(stored);
  for (const c of DRUM_CHAPTERS) {
    const m = session.modules[c.id];
    if (!m) continue;
    const st = out.modules[c.id] ?? emptyDrumChapter();
    out.modules[c.id] = {
      done: st.done || m.done,
      answers: { ...m.answers, ...st.answers },
      ...(st.interactive || m.interactive ? { interactive: true } : {}),
    };
  }
  if (session.lastModule) out.lastModule = session.lastModule;
  if (session.lastStep != null) out.lastStep = session.lastStep;
  let notes = out.notes;
  for (const n of session.notes) if (!notes.some((x) => x.id === n.id && x.savedAt >= n.savedAt)) notes = withNote(notes, n);
  out.notes = notes;
  return out;
}

// The ledger's writer: through the same serialized queue, reading and saving
// the stored copy whatever the screen's save flag says (the ledger writes
// only for a real account), and never over a copy that could not be read.
registerSessionCarry<DrumProgressState>(CARRY_KEY, (session) => {
  const gen = generation;
  const run = queue.then(async () => {
    const { state, ok } = await readStore(true);
    if (!ok || gen !== generation) return false;
    return save(mergeDrumProgress(state, session), true);
  });
  queue = run.catch(() => undefined);
  return run;
});

/** SIGN-IN RE-READ (toddler pass 3): write each session note the store does
 *  not hold yet. `notes` = what the device HOLDS afterwards; `failed` = the
 *  notes a write refused. The returned copy of a refused write still carries
 *  the note (it was added in memory), and a failed READ returns an empty
 *  list — so neither is ever taken as the stored list. */
export async function keepSessionNotes(stored: readonly TuningNote[], session: readonly TuningNote[]): Promise<{ notes: TuningNote[]; failed: TuningNote[] }> {
  let notes = [...stored];
  const failed: TuningNote[] = [];
  for (const n of session) {
    if (notes.some((x) => x.id === n.id)) continue;
    const r = await saveTuningNote(n);
    if (r.saved) notes = r.notes;
    else failed.push(n);
  }
  return { notes, failed };
}
