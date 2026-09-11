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

async function readRaw(): Promise<MeasurementRow[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return (parsed as MeasurementRow[]).filter(
      (r) =>
        r != null &&
        typeof r.id === 'string' &&
        typeof r.created_at === 'string' &&
        typeof r.json === 'string',
    );
  } catch {
    return [];
  }
}

async function writeRaw(rows: MeasurementRow[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows));
}

export async function readAllRows(): Promise<MeasurementRow[]> {
  const rows = await readRaw();
  return [...rows].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export async function putRow(row: MeasurementRow): Promise<void> {
  const rows = await readRaw();
  const at = rows.findIndex((r) => r.id === row.id);
  if (at >= 0) rows[at] = row;
  else rows.push(row);
  await writeRaw(rows);
}

export async function deleteRows(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const drop = new Set(ids);
  await writeRaw((await readRaw()).filter((r) => !drop.has(r.id)));
}

export async function replaceAllRows(rows: MeasurementRow[]): Promise<void> {
  await writeRaw(rows);
}

/** Wipe every stored measurement — see the native sibling for why this exists. */
export async function clearAllRows(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
