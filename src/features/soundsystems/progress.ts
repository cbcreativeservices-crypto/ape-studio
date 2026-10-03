/**
 * Sound Systems Lab — progress that the paged shells do not track.
 *
 * PagedLab already persists which PAGES are done per mode. This store holds
 * the finer grain the hub's WHAT-IS-LEFT screen reports on: which faults
 * were solved (and solved with a forward walk), which capstones passed, and
 * which route/operate exercises were completed. Device-local, `ape:`-prefixed
 * (so the account wipe removes it), corruption-safe.
 *
 * On the shared safe store (pattern catalog 2026-10-02, closer A2; wave 2):
 * a read that THREW is not an empty record — nothing is written over the
 * stored copy until a read succeeds (it used to start empty, and the next
 * solved fault saved a one-item record over every fault, capstone and
 * exercise on the device); a mark made before the read lands joins the stored
 * record; a read or write in flight across the account wipe lands nowhere;
 * the wipe reaches the store without a hand entry.
 */
import { useSyncExternalStore } from 'react';
import { getLabPreview } from '../lab/labPreviewStore';
import { holdSessionWork, registerSessionCarry } from '../lab/sessionCarry';
import { createLocalStore } from '../storage/localStore';

const STORAGE_KEY = 'ape:soundsystems:v1';

export type SoundSystemsProgress = {
  /** Fault ids solved (a correct diagnosis). */
  faults: string[];
  /** Fault ids solved WITH a source-forward walk. */
  forward: string[];
  /** Capstone ids passed. */
  capstones: string[];
  /** ROUTE exercise ids completed. */
  route: string[];
  /** OPERATE exercise ids completed. */
  operate: string[];
};

type ListKey = keyof SoundSystemsProgress;

const EMPTY = (): SoundSystemsProgress => ({ faults: [], forward: [], capstones: [], route: [], operate: [] });
const LISTS = Object.keys(EMPTY()) as ListKey[];

function cleanList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length < 64))];
}

function normalise(raw: unknown): SoundSystemsProgress {
  const r = (raw ?? {}) as Partial<Record<ListKey, unknown>>;
  return {
    faults: cleanList(r.faults),
    forward: cleanList(r.forward),
    capstones: cleanList(r.capstones),
    route: cleanList(r.route),
    operate: cleanList(r.operate),
  };
}

/* ── this session's work that is NOT written (a guest) ───────────────────── */

/** What a blocked (guest) session added, and the lists its in-lab reset
 *  cleared. Shown over the stored record, never written — the sign-in
 *  hand-off writes the held copy instead. Dropped with the account wipe. */
type Session = { added: SoundSystemsProgress; cleared: ReadonlySet<ListKey> };
const emptySession = (): Session => ({ added: EMPTY(), cleared: new Set() });
let session: Session = emptySession();
const sessionListeners = new Set<() => void>();
function setSession(next: Session): void {
  session = next;
  for (const l of [...sessionListeners]) l();
}

const store = createLocalStore<SoundSystemsProgress>({
  key: STORAGE_KEY,
  empty: EMPTY,
  parse: (p) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('not a progress record');
    return normalise(p);
  },
  // The learner's hub RESET empties every list: nothing saved = no key.
  serialize: (v) => (LISTS.every((k) => v[k].length === 0) ? null : JSON.stringify(v)),
  onReset: () => setSession(emptySession()),
});

/** The stored record as the screen sees it: the session's lists on top. */
let viewCache: { base: SoundSystemsProgress; session: Session; out: SoundSystemsProgress } | null = null;
function view(): SoundSystemsProgress {
  const base = store.get();
  if (viewCache && viewCache.base === base && viewCache.session === session) return viewCache.out;
  const out = { ...base };
  for (const k of LISTS) {
    const kept = session.cleared.has(k) ? [] : base[k];
    out[k] = session.added[k].length ? [...new Set([...kept, ...session.added[k]])] : kept;
  }
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

/** Set by the lab's host (SsPagedLab) on every render: true for a signed-out
 *  guest or a members-only preview — the cable labs' guest rule and PREVIEW
 *  EARNS NOTHING (bug hunt 2026-09-29). A preview records nothing; a guest
 *  keeps this session's progress in memory, nothing is written — and what
 *  they finish is HELD for the sign-in hand-off (owner ruling 2026-10-01:
 *  signing in later in the same app session writes it to the account). */
let saveBlocked = false;
export function setSoundSystemsSaveBlocked(blocked: boolean): void {
  saveBlocked = blocked;
}

function add(list: ListKey, id: string) {
  if (getLabPreview().active) return;
  if (saveBlocked) {
    holdSessionWork<Partial<SoundSystemsProgress>>(CARRY_KEY, (prev) => withHeldItem(prev, list, id));
    if (!session.added[list].includes(id)) {
      setSession({ ...session, added: { ...session.added, [list]: [...session.added[list], id] } });
    }
    void store.hydrate(); // shown over the stored record (read-only)
    return;
  }
  // Applied to the HYDRATED record (queued until the read lands).
  void store.mutate((s) => (s[list].includes(id) ? s : { ...s, [list]: [...s[list], id] }));
}

const CARRY_KEY = 'soundsystems';

/** Pure: `prev` plus one completed id (a fresh object). */
export function withHeldItem(prev: Partial<SoundSystemsProgress> | undefined, list: ListKey, id: string): Partial<SoundSystemsProgress> {
  const cur = prev?.[list] ?? [];
  return cur.includes(id) ? { ...prev } : { ...prev, [list]: [...cur, id] };
}

/** Pure: the stored copy plus held work — every list a union. */
export function mergeSoundSystemsProgress(stored: SoundSystemsProgress, h: Partial<SoundSystemsProgress>): SoundSystemsProgress {
  const out = { ...stored };
  for (const k of LISTS) {
    out[k] = [...new Set([...stored[k], ...(h[k] ?? [])])];
  }
  return out;
}

// The ledger's writer: the guest's finished faults / capstones / exercises
// join the signed-in account's copy and are written (whatever the screen's
// save flag says — the ledger only writes for a real account). Merged into
// the HYDRATED record, never over a copy that could not be read; true only
// when the device took the write.
registerSessionCarry<Partial<SoundSystemsProgress>>(CARRY_KEY, (h) => store.mutate((s) => mergeSoundSystemsProgress(s, h)));

export function markFaultSolved(id: string, forward: boolean): void {
  add('faults', id);
  if (forward) add('forward', id);
}

export function markCapstonePassed(id: string): void {
  add('capstones', id);
}

export function markRouteDone(id: string): void {
  add('route', id);
}

export function markOperateDone(id: string): void {
  add('operate', id);
}

export function getSoundSystemsProgress(): SoundSystemsProgress {
  return view();
}

/** Reactive snapshot (a fresh object per change so React re-renders). */
export function useSoundSystemsProgress(): SoundSystemsProgress {
  return useSyncExternalStore(subscribe, view, view);
}

/** The learner's own RESET (PagedLab's reset only clears its pages). */
export async function resetSoundSystemsProgress(): Promise<void> {
  setSession(emptySession());
  await store.set(EMPTY(), { reportFailure: false }); // the account wipe's call: the ape:* sweep removes the key
}

/** One mode's in-lab RESET: clears only that mode's lists, so the in-mode
 *  and hub resets clear the same stores (bug hunt 2026-09-29). A guest's
 *  reset clears what they see and writes nothing. */
export async function resetSoundSystemsLists(lists: readonly ListKey[]): Promise<void> {
  if (!lists.length) return;
  const added = { ...session.added };
  for (const l of lists) added[l] = [];
  const cleared = saveBlocked ? new Set([...session.cleared, ...lists]) : session.cleared;
  setSession({ added, cleared });
  if (saveBlocked) return;
  await store.mutate((s) => {
    const next = { ...s };
    for (const l of lists) next[l] = [];
    return next;
  });
}

/** Account switch: the persisted key is removed by clearLocalAccountData
 *  (it is `ape:*`); this drops the in-memory copy (new generation) so hooks
 *  re-read the swept storage. The shared store also registers it with the
 *  wipe itself. */
export function resetLocal(): void {
  store.reset();
}
