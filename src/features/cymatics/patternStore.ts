/**
 * cymatics/patternStore — saved patterns + artwork for the Pattern Gallery
 * (spec §4, Phase 4). AsyncStorage-backed, the calc-workflow store's idiom
 * (one JSON list per collection, corruption-safe: damaged rows are set aside
 * under a `:damaged` key, never silently destroyed).
 *
 * TWO collections, on purpose (spec: "numeric state is stored SEPARATELY from
 * artwork"):
 *   ape:cymatics:patterns:v1   SavedPattern[] — the exact experiment state
 *                              (studio + spec + drive + view), name, notes,
 *                              favourite, the honesty badge it carried.
 *   ape:cymatics:artwork:v1    Artwork[] — the colouring of a pattern, keyed
 *                              by patternId. Deleting a pattern deletes its
 *                              artwork; reopening a pattern in its studio
 *                              never reads the artwork.
 *
 * The storage adapter is injectable so node:test round-trips the real
 * serialiser without AsyncStorage (see test/cymaticsGallery.test.ts).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_LIQUID, type LiquidSpec } from './faraday';
import { DEFAULT_MEMBRANE, type MembraneSpec } from './membrane';
import { DEFAULT_PLATE, type PlateSpec } from './plateModes';
import { START_LEVEL_01 } from '../audio/startLevel';
import { holdSessionWork, registerSessionCarry } from '../lab/sessionCarry';
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';

export type StudioId = 'plate' | 'liquid' | 'membrane';

export type PlatePatternState = {
  studio: 'plate';
  spec: PlateSpec;
  hz: number;
  amplitude: number;
  /** PlateViewMode id — kept as a string so the store never imports the viz. */
  view: string;
  /** Second-tone id: off | oct | fifth | fourth (TONE_RATIOS). */
  multi: string;
  sandCount: number;
  sandSize: number;
  friction: number;
};
export type LiquidPatternState = {
  studio: 'liquid';
  /** Carries dualRatio for the science chain; `dualId` restores the chip. */
  spec: LiquidSpec;
  hz: number;
  accelG: number;
  view: string;
  dualId: string;
};
export type MembranePatternState = {
  studio: 'membrane';
  spec: MembraneSpec;
  hz: number;
  amplitude: number;
  view: string;
  driverId: string;
};
export type PatternState = PlatePatternState | LiquidPatternState | MembranePatternState;

/** Second-tone ids shared by the plate MULTI and liquid DUAL chips. */
export const TONE_RATIOS: Record<string, number | null> = { off: null, oct: 2, fifth: 1.5, fourth: 4 / 3 };

export type SavedPattern = {
  id: string;
  v: 1;
  name: string;
  notes: string;
  favourite: boolean;
  createdAt: number;
  updatedAt: number;
  /** The Simulation / Calculated / Approximated badge at save time. */
  badge: string;
  state: PatternState;
};

export type FillStyle = 'solid' | 'gradient';
export type RegionFill = { region: number; color: string; style: FillStyle };
export type Artwork = {
  patternId: string;
  v: 1;
  updatedAt: number;
  /** Grid size the region ids were labelled on — a different N re-labels, so fills are dropped rather than misplaced. */
  N: number;
  fills: RegionFill[];
  /** 0 = nodal lines hidden. */
  lineWeight: number;
  lineColor: string;
  /** 'plate' = the material finish; a colour; or 'transparent'. */
  background: string;
  /** Rotational symmetry order for fills (1 = off). */
  symmetry: number;
};

export const PATTERN_KEYS = {
  patterns: 'ape:cymatics:patterns:v1',
  artwork: 'ape:cymatics:artwork:v1',
} as const;

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

// ── shape guards + normalisation ─────────────────────────────────────────────
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

function normaliseState(raw: unknown): PatternState | null {
  if (!isObj(raw) || !isStr(raw.studio) || !isObj(raw.spec) || !isNum(raw.hz)) return null;
  const spec = raw.spec;
  const view = isStr(raw.view) ? raw.view : '';
  if (raw.studio === 'plate') {
    return {
      studio: 'plate',
      spec: { ...DEFAULT_PLATE, ...(spec as Partial<PlateSpec>) },
      hz: raw.hz,
      // A saved pattern's OWN amplitude is honoured — that is the user's
      // choice and reopening it is not a first open. But a row MISSING the
      // field must not resurrect the old loud default (2026-09-19).
      amplitude: isNum(raw.amplitude) ? raw.amplitude : START_LEVEL_01,
      view: view || 'particles',
      multi: isStr(raw.multi) && raw.multi in TONE_RATIOS ? raw.multi : 'off',
      sandCount: isNum(raw.sandCount) ? raw.sandCount : 3000,
      sandSize: isNum(raw.sandSize) ? raw.sandSize : 0.45,
      friction: isNum(raw.friction) ? raw.friction : 0.4,
    };
  }
  if (raw.studio === 'liquid') {
    const dualId = isStr(raw.dualId) && raw.dualId in TONE_RATIOS ? raw.dualId : 'off';
    return {
      studio: 'liquid',
      spec: { ...DEFAULT_LIQUID, ...(spec as Partial<LiquidSpec>), dualRatio: TONE_RATIOS[dualId] },
      hz: raw.hz,
      accelG: isNum(raw.accelG) ? raw.accelG : 0.25,
      view: view || 'surface',
      dualId,
    };
  }
  if (raw.studio === 'membrane') {
    return {
      studio: 'membrane',
      spec: { ...DEFAULT_MEMBRANE, ...(spec as Partial<MembraneSpec>) },
      hz: raw.hz,
      // A saved pattern's OWN amplitude is honoured — that is the user's
      // choice and reopening it is not a first open. But a row MISSING the
      // field must not resurrect the old loud default (2026-09-19).
      amplitude: isNum(raw.amplitude) ? raw.amplitude : START_LEVEL_01,
      view: view || 'head',
      driverId: isStr(raw.driverId) ? raw.driverId : 'woofer200',
    };
  }
  return null;
}

/** Validate + normalise one stored row (missing newer fields get defaults). */
export function normalisePattern(raw: unknown): SavedPattern | null {
  if (!isObj(raw) || !isStr(raw.id) || !isStr(raw.name)) return null;
  const state = normaliseState(raw.state);
  if (!state) return null;
  const now = Date.now();
  return {
    id: raw.id,
    v: 1,
    name: raw.name,
    notes: isStr(raw.notes) ? raw.notes : '',
    favourite: raw.favourite === true,
    createdAt: isNum(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : now,
    badge: isStr(raw.badge) ? raw.badge : 'SIMULATION',
    state,
  };
}

export function normaliseArtwork(raw: unknown): Artwork | null {
  if (!isObj(raw) || !isStr(raw.patternId) || !Array.isArray(raw.fills) || !isNum(raw.N)) return null;
  const fills: RegionFill[] = [];
  for (const f of raw.fills) {
    if (!isObj(f) || !isNum(f.region) || !isStr(f.color)) continue;
    fills.push({ region: f.region, color: f.color, style: f.style === 'gradient' ? 'gradient' : 'solid' });
  }
  return {
    patternId: raw.patternId,
    v: 1,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : Date.now(),
    N: raw.N,
    fills,
    lineWeight: isNum(raw.lineWeight) ? raw.lineWeight : 1.5,
    lineColor: isStr(raw.lineColor) ? raw.lineColor : '#ffffff',
    background: isStr(raw.background) ? raw.background : 'plate',
    symmetry: isNum(raw.symmetry) && raw.symmetry >= 1 ? Math.round(raw.symmetry) : 1,
  };
}

export function newPatternId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a fresh SavedPattern from live studio state. */
export function newPattern(state: PatternState, badge: string, name: string): SavedPattern {
  const now = Date.now();
  return { id: newPatternId(), v: 1, name, notes: '', favourite: false, createdAt: now, updatedAt: now, badge, state };
}

export function blankArtwork(patternId: string, N: number): Artwork {
  return { patternId, v: 1, updatedAt: Date.now(), N, fills: [], lineWeight: 1.5, lineColor: '#ffffff', background: 'plate', symmetry: 1 };
}

// ── the store ────────────────────────────────────────────────────────────────
export type PatternStore = {
  loadPatterns(): Promise<SavedPattern[]>;
  /** `null` = no such pattern (it may have been deleted). REJECTS when the
   *  list cannot be read (final round B, 2026-10-02): the two used to read
   *  the same, so an edit whose read failed was dropped without a word. */
  getPattern(id: string): Promise<SavedPattern | null>;
  /** Insert or replace by id. Returns false when the write failed. */
  upsertPattern(p: SavedPattern): Promise<boolean>;
  deletePattern(id: string): Promise<boolean>;
  /** A copy with a new id, "(copy)" name, no artwork. */
  duplicatePattern(id: string): Promise<SavedPattern | null>;
  /** Rejects when the artwork list cannot be read. */
  loadArtwork(patternId: string): Promise<Artwork | null>;
  /** Every artwork (the gallery's thumbnails read them in one go). */
  loadArtworks(): Promise<Artwork[]>;
  saveArtwork(a: Artwork): Promise<boolean>;
  deleteArtwork(patternId: string): Promise<boolean>;
  /** The sign-in hand-off's writer: a guest session's patterns and
   *  colourings join this device's lists after the sign-in wipe. */
  carryIn(held: HeldGallery): Promise<boolean>;
};

/* ── the sign-in hand-off (owner ruling 2026-10-01; hunt 12) ────────────────
   The gallery writes for everyone, but a guest's FIRST sign-in wipes this
   device's `ape:*` keys — every pattern saved and coloured as a guest in this
   app session was gone from the gallery the moment they signed in (the
   ticks in ExperimentWell and Room Design's saved designs were carried; the
   gallery was not). What a guest saves here is held by the shared ledger
   (`guestOnly`: an account's own saves need no carrying) and written back
   after the wipe. A row deleted again in the session is let go of too. */
const CARRY_KEY = 'cymatics:gallery';
export type HeldGallery = { patterns: SavedPattern[]; artwork: Artwork[] };

/** Pure: the held gallery after one saved pattern / colouring, or removals. */
export function withHeldGallery(
  prev: HeldGallery | undefined,
  change: { pattern?: SavedPattern; artwork?: Artwork; dropPattern?: string; dropArtwork?: string },
): HeldGallery {
  let patterns = prev?.patterns ?? [];
  let artwork = prev?.artwork ?? [];
  if (change.pattern) patterns = [change.pattern, ...patterns.filter((p) => p.id !== change.pattern!.id)];
  if (change.artwork) artwork = [...artwork.filter((a) => a.patternId !== change.artwork!.patternId), change.artwork];
  if (change.dropPattern) {
    patterns = patterns.filter((p) => p.id !== change.dropPattern);
    artwork = artwork.filter((a) => a.patternId !== change.dropPattern);
  }
  if (change.dropArtwork) artwork = artwork.filter((a) => a.patternId !== change.dropArtwork);
  return { patterns, artwork };
}

function holdGallery(change: Parameters<typeof withHeldGallery>[1]): void {
  holdSessionWork<HeldGallery>(CARRY_KEY, (prev) => withHeldGallery(prev, change), { guestOnly: true });
}

/* A DELETE IS HONOURED BY THE CARRY (hunt 13, 2026-10-04). The ledger
   refuses a guestOnly hold once the account is settled — removals included —
   so a pattern (or colouring) deleted after the sign-in stayed in what was
   held. The writer runs again whenever the held copy was not written (a carry
   whose write failed, re-run by any later flush) and it ran LATE when the
   delete reached the write chain first: the deleted pattern came back. What
   this session deleted is remembered here and never carried back in; a later
   save of the same id lets go of it. Cleared by the account wipe. */
const deletedPatternIds = new Set<string>();
const deletedArtworkIds = new Set<string>();
registerLocalStoreReset(() => {
  deletedPatternIds.clear();
  deletedArtworkIds.clear();
});

/** Pure: the stored rows plus the held ones — by id, the newer `updatedAt`
 *  wins; a held row the list lacks is added (patterns newest first). */
export function mergeHeldGallery(patterns: SavedPattern[], artwork: Artwork[], held: HeldGallery): { patterns: SavedPattern[]; artwork: Artwork[] } {
  const p = [...patterns];
  for (const h of [...held.patterns].reverse()) {
    const i = p.findIndex((x) => x.id === h.id);
    if (i < 0) p.unshift(h);
    else if (h.updatedAt >= p[i].updatedAt) p[i] = h;
  }
  const a = [...artwork];
  for (const h of held.artwork) {
    if (!p.some((x) => x.id === h.patternId)) continue; // never an orphan colouring
    const i = a.findIndex((x) => x.patternId === h.patternId);
    if (i < 0) a.push(h);
    else if (h.updatedAt >= a[i].updatedAt) a[i] = h;
  }
  return { patterns: p, artwork: a };
}

/**
 * One collection, or `null` when it could not be READ (full-app run 1,
 * 2026-10-01): a getItem that THREW (an oversized row on Android, a storage
 * error) used to read as an empty list, and the very next save wrote a
 * one-row list over every saved pattern — or, from DELETE, an empty artwork
 * list over every colouring. A damaged blob is still set aside under
 * `:damaged` and read as empty; if setting it aside fails, it is unreadable
 * too (a write would destroy it).
 */
async function readList<T>(kv: KeyValueStore, key: string, normalise: (x: unknown) => T | null): Promise<T[] | null> {
  let raw: string | null;
  try {
    raw = await kv.getItem(key);
  } catch {
    return null;
  }
  if (raw == null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    const good: T[] = [];
    const bad: unknown[] = [];
    for (const row of parsed) {
      const n = normalise(row);
      if (n) good.push(n);
      else bad.push(row);
    }
    if (bad.length) {
      await kv.setItem(`${key}:damaged`, JSON.stringify(bad)).catch(() => {});
      await kv.setItem(key, JSON.stringify(good)).catch(() => {});
    }
    return good;
  } catch {
    try {
      await kv.setItem(`${key}:damaged`, raw);
      await kv.removeItem(key);
    } catch {
      return null;
    }
    return [];
  }
}

/** The empty stand-ins `loadList` returned for a list it could not READ
 *  (hunt 4, 2026-10-03): the gallery said "NOTHING SAVED YET" over every
 *  saved pattern. Told apart here, like roomDesignStore's readFailed. */
const unreadableLists = new WeakSet<readonly unknown[]>();
/** True when this list is the empty stand-in for a read that FAILED. */
export function patternsUnreadable(list: readonly unknown[]): boolean {
  return unreadableLists.has(list);
}

async function loadList<T>(kv: KeyValueStore, key: string, normalise: (x: unknown) => T | null): Promise<T[]> {
  const list = await readList(kv, key, normalise);
  if (list) return list;
  const none: T[] = [];
  unreadableLists.add(none);
  return none;
}

async function saveList<T>(kv: KeyValueStore, key: string, list: T[]): Promise<boolean> {
  try {
    await kv.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function createPatternStore(kv: KeyValueStore): PatternStore {
  const patterns = () => loadList<SavedPattern>(kv, PATTERN_KEYS.patterns, normalisePattern);
  const artworks = () => loadList<Artwork>(kv, PATTERN_KEYS.artwork, normaliseArtwork);
  // The WRITE paths read with `readList`: an unreadable collection is never
  // written over (null → the write reports failure).
  const patternsRW = () => readList<SavedPattern>(kv, PATTERN_KEYS.patterns, normalisePattern);
  const artworksRW = () => readList<Artwork>(kv, PATTERN_KEYS.artwork, normaliseArtwork);
  // Every write is a read-modify-write of a whole list, so two in flight at
  // once (a double-tapped SAVE, a favourite during an artwork autosave) could
  // each read the old list and the second would drop the first's row. Writes
  // run one after another on this chain (bug hunt 2026-09-29).
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = chain.then(fn, fn);
    chain = run.catch(() => undefined);
    return run;
  };
  return {
    loadPatterns: patterns,
    async getPattern(id) {
      const list = await patternsRW();
      if (!list) throw new Error('patterns unreadable');
      return list.find((p) => p.id === id) ?? null;
    },
    upsertPattern: (p) => serial(async () => {
      const list = await patternsRW();
      if (!list) return false;
      const i = list.findIndex((x) => x.id === p.id);
      const row = { ...p, updatedAt: Date.now() };
      if (i >= 0) list[i] = row;
      else list.unshift(row);
      const ok = await saveList(kv, PATTERN_KEYS.patterns, list);
      if (ok) {
        deletedPatternIds.delete(row.id);
        holdGallery({ pattern: row });
      }
      return ok;
    }),
    deletePattern: (id) => serial(async () => {
      const read = await patternsRW();
      if (!read) return false;
      const ok = await saveList(kv, PATTERN_KEYS.patterns, read.filter((x) => x.id !== id));
      const arts = await artworksRW();
      if (arts) await saveList(kv, PATTERN_KEYS.artwork, arts.filter((a) => a.patternId !== id));
      if (ok) {
        deletedPatternIds.add(id);
        holdGallery({ dropPattern: id });
      }
      return ok;
    }),
    duplicatePattern: (id) => serial(async () => {
      const list = await patternsRW();
      const src = list?.find((x) => x.id === id);
      if (!list || !src) return null;
      const now = Date.now();
      const copy: SavedPattern = { ...src, id: newPatternId(), name: `${src.name} (copy)`, favourite: false, createdAt: now, updatedAt: now, state: JSON.parse(JSON.stringify(src.state)) };
      list.unshift(copy);
      const ok = await saveList(kv, PATTERN_KEYS.patterns, list);
      if (ok) holdGallery({ pattern: copy });
      return ok ? copy : null;
    }),
    // On the write chain, and it THROWS when the list cannot be read (evening
    // pass 3, 2026-10-02): the art board opens from this read, so it must see
    // a save still writing (‹ then COLOUR › fast reopened the pre-edit
    // colouring, and the next stroke wrote it back over the newer one), and an
    // unreadable list must not open a BLANK board whose first stroke replaces
    // the pattern's stored colouring. `null` = no artwork yet.
    loadArtwork: (patternId) => serial(async () => {
      const list = await artworksRW();
      if (!list) throw new Error('artwork unreadable');
      return list.find((a) => a.patternId === patternId) ?? null;
    }),
    loadArtworks: artworks,
    saveArtwork: (a) => serial(async () => {
      const list = await artworksRW();
      if (!list) return false;
      const i = list.findIndex((x) => x.patternId === a.patternId);
      const row = { ...a, updatedAt: Date.now() };
      if (i >= 0) list[i] = row;
      else list.push(row);
      const ok = await saveList(kv, PATTERN_KEYS.artwork, list);
      if (ok) {
        deletedArtworkIds.delete(row.patternId);
        holdGallery({ artwork: row });
      }
      return ok;
    }),
    deleteArtwork: (patternId) => serial(async () => {
      const list = await artworksRW();
      if (!list) return false;
      const ok = await saveList(kv, PATTERN_KEYS.artwork, list.filter((a) => a.patternId !== patternId));
      if (ok) {
        deletedArtworkIds.add(patternId);
        holdGallery({ dropArtwork: patternId });
      }
      return ok;
    }),
    // On the write chain; never over a list that could not be read.
    carryIn: (heldIn) => serial(async () => {
      // Never carry back what this session deleted (see deletedPatternIds).
      const held: HeldGallery = {
        patterns: heldIn.patterns.filter((p) => !deletedPatternIds.has(p.id)),
        artwork: heldIn.artwork.filter((a) => !deletedPatternIds.has(a.patternId) && !deletedArtworkIds.has(a.patternId)),
      };
      if (!held.patterns.length && !held.artwork.length) return true;
      const pats = await patternsRW();
      // The artwork list is needed only when colourings are carried (hunt
      // 13): an unreadable one used to hold back the PATTERNS too.
      const arts = held.artwork.length ? await artworksRW() : [];
      if (!pats || !arts) return false;
      const next = mergeHeldGallery(pats, arts, held);
      const okP = held.patterns.length ? await saveList(kv, PATTERN_KEYS.patterns, next.patterns) : true;
      const okA = held.artwork.length ? await saveList(kv, PATTERN_KEYS.artwork, next.artwork) : true;
      // No screen is saving these (the Room Design carry rule): a refused
      // write is told with the shared notice.
      if (!okP || !okA) reportUnhandledSaveFailure();
      return okP && okA;
    }),
  };
}

/** In-memory adapter (tests, and a safe fallback if AsyncStorage is missing). */
export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    async getItem(k) {
      return m.has(k) ? m.get(k)! : null;
    },
    async setItem(k, v) {
      m.set(k, v);
    },
    async removeItem(k) {
      m.delete(k);
    },
  };
}

let defaultStore: PatternStore | undefined;
/** The app's store on AsyncStorage (lazy — keeps this module importable in node). */
export function patternStore(): PatternStore {
  if (!defaultStore) {
    let kv: KeyValueStore;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage').default as KeyValueStore;
      kv = AsyncStorage;
    } catch {
      kv = memoryStore();
    }
    defaultStore = createPatternStore(kv);
  }
  return defaultStore;
}

// The ledger's writer (see CARRY_KEY): registered at module load, like every
// lab store's.
registerSessionCarry<HeldGallery>(CARRY_KEY, (held) => patternStore().carryIn(held));

/** Gallery hook: the list, a reload, and write-through actions. */
export function usePatterns() {
  const [patterns, setPatterns] = useState<SavedPattern[] | null>(null);
  // Only the NEWEST read may land (pattern hunt P2, 2026-10-02): the mount
  // load and a save's reload overlap, and the older list landing last showed a
  // gallery without the pattern just saved. `alive` keeps an unmounted gallery
  // from being written to (P11).
  const seqRef = useRef(0);
  const aliveRef = useRef(true);
  const reload = useCallback(async () => {
    const my = ++seqRef.current;
    const list = await patternStore().loadPatterns();
    if (aliveRef.current && my === seqRef.current) setPatterns(list);
    return list;
  }, []);
  useEffect(() => {
    aliveRef.current = true;
    void reload();
    return () => {
      aliveRef.current = false;
    };
  }, [reload]);
  const upsert = useCallback(
    async (p: SavedPattern) => {
      const ok = await patternStore().upsertPattern(p);
      await reload();
      return ok;
    },
    [reload],
  );
  const remove = useCallback(
    async (id: string) => {
      const ok = await patternStore().deletePattern(id);
      await reload();
      return ok;
    },
    [reload],
  );
  const duplicate = useCallback(
    async (id: string) => {
      const copy = await patternStore().duplicatePattern(id);
      await reload();
      return copy;
    },
    [reload],
  );
  return { patterns, reload, upsert, remove, duplicate };
}
