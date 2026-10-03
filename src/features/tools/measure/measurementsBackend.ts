/**
 * Web sibling of measurementsBackend.native.ts — AsyncStorage-backed.
 *
 * Metro resolves the `.native.ts` file on ios/android, so this one runs only in
 * the browser preview, where expo-sqlite's wasm worker is exactly what the
 * split exists to keep out of the bundle (same arrangement as
 * studyQueueStorage.ts / .native.ts).
 *
 * The 6 MB ceiling that forced the native migration is an ANDROID AsyncStorage
 * build constant, so it does not apply here — and the web build is a preview
 * surface, not a place anyone keeps a measurement library. Rows are kept in the
 * same shape as the native table so the store above cannot tell them apart.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MeasurementRow } from './measurementsBackend.shared';

export type { MeasurementRow };

const KEY = 'ape:toolMeasurementRows';

/** A row the store above can trust. */
function isRow(r: unknown): r is MeasurementRow {
  const x = r as MeasurementRow | null;
  return x != null && typeof x.id === 'string' && typeof x.created_at === 'string' && typeof x.json === 'string';
}

/**
 * The stored rows, or a THROW when the key could not be read (pattern catalog
 * 2026-10-02, P1; wave 2).
 *
 * `putRow` and `deleteRows` are read-modify-write over ONE key. The read used
 * to answer `[]` for a read that failed, so the next save wrote a one-row
 * library over the whole stored one. A read failed is not an empty library:
 * the error propagates, the write never happens, and the store above reports
 * the save as failed (saveMeasurement says so out loud). A blob that will not
 * parse is different — it is set aside under `<key>:damaged` and the library
 * starts empty with writes allowed, as before.
 */
async function readRaw(): Promise<MeasurementRow[]> {
  const raw = await AsyncStorage.getItem(KEY); // a READ failed throws — never "empty"
  if (raw == null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (!Array.isArray(parsed)) {
    // Silent on purpose: setting a damaged blob aside is the app's housekeeping.
    await AsyncStorage.setItem(`${KEY}:damaged`, raw).catch(() => {});
    return [];
  }
  return parsed.filter(isRow);
}

async function writeRaw(rows: MeasurementRow[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows));
}

export async function readAllRows(): Promise<MeasurementRow[]> {
  const rows = await readRaw();
  return [...rows].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

/**
 * One read-modify-write at a time, and none across the account wipe.
 * `tail` serializes every writer (two saves that both read before either
 * wrote dropped one of the rows); `generation` is bumped by clearAllRows, so
 * a save that read the DEPARTING account's rows before the clear does not
 * write them back after it (the generation fence, catalog P3).
 */
const fence = { tail: Promise.resolve() as Promise<unknown>, generation: 0 };

function serialized<T>(work: () => Promise<T>): Promise<T> {
  const p = fence.tail.then(work, work);
  fence.tail = p.catch(() => {});
  return p;
}

function assertSameGeneration(gen: number): void {
  if (gen !== fence.generation) throw new Error('measurement library was wiped while this write was waiting');
}

export function putRow(row: MeasurementRow): Promise<void> {
  const gen = fence.generation;
  return serialized(async () => {
    assertSameGeneration(gen);
    const rows = await readRaw();
    assertSameGeneration(gen);
    const at = rows.findIndex((r) => r.id === row.id);
    if (at >= 0) rows[at] = row;
    else rows.push(row);
    await writeRaw(rows);
  });
}

export function deleteRows(ids: string[]): Promise<void> {
  if (ids.length === 0) return Promise.resolve();
  const gen = fence.generation;
  const drop = new Set(ids);
  return serialized(async () => {
    assertSameGeneration(gen);
    const rows = await readRaw();
    assertSameGeneration(gen);
    await writeRaw(rows.filter((r) => !drop.has(r.id)));
  });
}

export function replaceAllRows(rows: MeasurementRow[]): Promise<void> {
  return serialized(() => writeRaw(rows));
}

/** Wipe every stored measurement — see the native sibling for why this exists. */
export function clearAllRows(): Promise<void> {
  fence.generation++;
  return serialized(() => AsyncStorage.removeItem(KEY));
}
