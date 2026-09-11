/**
 * Where saved measurements actually live on a phone — SQLite, one row each.
 *
 * WHY THIS EXISTS (device pass 2026-09-11, a CONFIRMED data loss). The library
 * used to be one JSON blob under a single AsyncStorage key, which measurementStore's
 * own docblock warned about: "if a future engine tool needs big grids
 * (spectrogram), migrate that payload to the SQLite split". The Spectrogram and
 * MultiMeter tools then shipped exactly those grids — ~119 KB per snapshot —
 * and ~20 of them killed it on an Android device:
 *
 *     Error: database or disk is full (code 13 SQLITE_FULL)
 *
 * and the saved snapshots were gone after a restart. The cap is not this
 * feature's: Android backs AsyncStorage with ONE SQLite database whose maximum
 * size is fixed at build time (`AsyncStorage_db_size_in_MB`, default 6, which
 * this app does not override). That 6 MB is the budget for all 102 `ape:` keys
 * across the app — progress, enrollments, bookmarks, settings, pace records —
 * so a tool that writes megabytes does not merely lose its own data, it stops
 * EVERY other feature from persisting anything. That is what the device saw:
 * several unrelated writes rejected at once.
 *
 * SQLite here is a plain database file with no artificial ceiling, and
 * expo-sqlite is a C++ binding rather than android.database.Cursor, so the
 * ~2 MB CursorWindow read-back limit does not apply either.
 *
 * Native only — Metro picks this file on ios/android and resolves the
 * AsyncStorage sibling (measurementsBackend.ts) on web, so expo-sqlite and its
 * wasm worker never enter the web bundle. Same split as
 * studyQueueStorage.native.ts / submissionQueueStorage.native.ts.
 */
import * as SQLite from 'expo-sqlite';
import type { MeasurementRow } from './measurementsBackend.shared';

export type { MeasurementRow };

/**
 * Opened on FIRST USE, not at module scope. measurementStore is reachable from
 * account teardown, and opening a database as a side effect of an import is how
 * a native module ends up on the boot path (see the 2026-08-28 debug audit).
 */
let handle: SQLite.SQLiteDatabase | null = null;
function db(): SQLite.SQLiteDatabase {
  if (handle) return handle;
  // Same file as the study/submission queues — one app database, not three.
  handle = SQLite.openDatabaseSync('ape-studio.db');
  // MIGRATION NOTE (inherited from studyQueueStorage.native.ts): this is
  // CREATE TABLE IF NOT EXISTS only. Before EVER adding or renaming a column,
  // add a PRAGMA user_version migration — on an existing install IF NOT EXISTS
  // does NOT alter the table, so new-column inserts would throw.
  handle.execSync(`CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  json TEXT NOT NULL
);`);
  return handle;
}

export async function readAllRows(): Promise<MeasurementRow[]> {
  return db().getAllSync<MeasurementRow>(
    'SELECT id, created_at, json FROM measurements ORDER BY created_at',
  );
}

export async function putRow(row: MeasurementRow): Promise<void> {
  db().runSync('INSERT OR REPLACE INTO measurements (id, created_at, json) VALUES (?,?,?)', [
    row.id,
    row.created_at,
    row.json,
  ]);
}

export async function deleteRows(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const database = db();
  // Bound, not interpolated: these ids are client-generated UUIDs, but the
  // house rule (studyQueueStorage) is that only internal integer keys may be
  // interpolated, so parameterise.
  database.withTransactionSync(() => {
    for (const id of ids) database.runSync('DELETE FROM measurements WHERE id = ?', [id]);
  });
}

export async function replaceAllRows(rows: MeasurementRow[]): Promise<void> {
  const database = db();
  database.withTransactionSync(() => {
    database.runSync('DELETE FROM measurements');
    for (const r of rows) {
      database.runSync('INSERT OR REPLACE INTO measurements (id, created_at, json) VALUES (?,?,?)', [
        r.id,
        r.created_at,
        r.json,
      ]);
    }
  });
}

/** Wipe every stored measurement — the account-switch / guest-wipe path.
 *  clearLocalAccountData() removes `ape:*` AsyncStorage keys, which used to be
 *  where this library lived; now that it is a SQLite table, that sweep no
 *  longer reaches it, so the wipe has to say so explicitly or one account's
 *  measurements would greet the next one. */
export async function clearAllRows(): Promise<void> {
  db().runSync('DELETE FROM measurements');
}
