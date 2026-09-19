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
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LIQUID, type LiquidSpec } from './faraday';
import { DEFAULT_MEMBRANE, type MembraneSpec } from './membrane';
import { DEFAULT_PLATE, type PlateSpec } from './plateModes';
import { START_LEVEL_01 } from '../audio/startLevel';

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
  getPattern(id: string): Promise<SavedPattern | null>;
  /** Insert or replace by id. Returns false when the write failed. */
  upsertPattern(p: SavedPattern): Promise<boolean>;
  deletePattern(id: string): Promise<boolean>;
  /** A copy with a new id, "(copy)" name, no artwork. */
  duplicatePattern(id: string): Promise<SavedPattern | null>;
  loadArtwork(patternId: string): Promise<Artwork | null>;
  /** Every artwork (the gallery's thumbnails read them in one go). */
  loadArtworks(): Promise<Artwork[]>;
  saveArtwork(a: Artwork): Promise<boolean>;
  deleteArtwork(patternId: string): Promise<boolean>;
};

async function loadList<T>(kv: KeyValueStore, key: string, normalise: (x: unknown) => T | null): Promise<T[]> {
  try {
    const raw = await kv.getItem(key);
    if (raw == null) return [];
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
      const raw = await kv.getItem(key);
      if (raw != null) await kv.setItem(`${key}:damaged`, raw);
      await kv.removeItem(key);
    } catch {}
    return [];
  }
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
  return {
    loadPatterns: patterns,
    async getPattern(id) {
      return (await patterns()).find((p) => p.id === id) ?? null;
    },
    async upsertPattern(p) {
      const list = await patterns();
      const i = list.findIndex((x) => x.id === p.id);
      const row = { ...p, updatedAt: Date.now() };
      if (i >= 0) list[i] = row;
      else list.unshift(row);
      return saveList(kv, PATTERN_KEYS.patterns, list);
    },
    async deletePattern(id) {
      const list = (await patterns()).filter((x) => x.id !== id);
      const ok = await saveList(kv, PATTERN_KEYS.patterns, list);
      const arts = (await artworks()).filter((a) => a.patternId !== id);
      await saveList(kv, PATTERN_KEYS.artwork, arts);
      return ok;
    },
    async duplicatePattern(id) {
      const src = (await patterns()).find((x) => x.id === id);
      if (!src) return null;
      const now = Date.now();
      const copy: SavedPattern = { ...src, id: newPatternId(), name: `${src.name} (copy)`, favourite: false, createdAt: now, updatedAt: now, state: JSON.parse(JSON.stringify(src.state)) };
      const list = await patterns();
      list.unshift(copy);
      const ok = await saveList(kv, PATTERN_KEYS.patterns, list);
      return ok ? copy : null;
    },
    async loadArtwork(patternId) {
      return (await artworks()).find((a) => a.patternId === patternId) ?? null;
    },
    loadArtworks: artworks,
    async saveArtwork(a) {
      const list = await artworks();
      const i = list.findIndex((x) => x.patternId === a.patternId);
      const row = { ...a, updatedAt: Date.now() };
      if (i >= 0) list[i] = row;
      else list.push(row);
      return saveList(kv, PATTERN_KEYS.artwork, list);
    },
    async deleteArtwork(patternId) {
      const list = (await artworks()).filter((a) => a.patternId !== patternId);
      return saveList(kv, PATTERN_KEYS.artwork, list);
    },
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

/** Gallery hook: the list, a reload, and write-through actions. */
export function usePatterns() {
  const [patterns, setPatterns] = useState<SavedPattern[] | null>(null);
  const reload = useCallback(async () => {
    const list = await patternStore().loadPatterns();
    setPatterns(list);
    return list;
  }, []);
  useEffect(() => {
    void reload();
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
