/**
 * SQLite-backed storage for the offline study batch queue (Code brief §6).
 * Native only — Metro picks this file on ios/android; web resolves the
 * in-memory sibling (studyQueueStorage.ts) so expo-sqlite (and its wa-sqlite
 * wasm worker) never enters the web bundle.
 */
import * as SQLite from 'expo-sqlite';

export type StudyQueueRow = {
  id: number;
  achievement_id: string;
  method_key: string;
  batch_id: string;
  active_seconds: number;
  events_json: string;
};

const db = SQLite.openDatabaseSync('ape-studio.db');
// MIGRATION NOTE (owner debug audit 2026-08-21): this uses CREATE TABLE IF NOT
// EXISTS only. Before EVER adding/renaming a column here, add a PRAGMA
// user_version migration (ALTER TABLE on upgrade) — on an existing install
// `IF NOT EXISTS` will NOT alter the table, so new-column inserts would throw.
db.execSync(`CREATE TABLE IF NOT EXISTS study_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_id TEXT NOT NULL,
  method_key TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  active_seconds INTEGER NOT NULL,
  events_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);`);

export function insertQueuedBatch(
  row: Omit<StudyQueueRow, 'id'>,
  createdAt: number,
): void {
  db.runSync(
    'INSERT INTO study_queue (achievement_id, method_key, batch_id, active_seconds, events_json, created_at) VALUES (?,?,?,?,?,?)',
    [row.achievement_id, row.method_key, row.batch_id, row.active_seconds, row.events_json, createdAt],
  );
}

export function getQueuedBatches(): StudyQueueRow[] {
  return db.getAllSync<StudyQueueRow>('SELECT * FROM study_queue ORDER BY id');
}

export function deleteQueuedBatches(ids: number[]): void {
  if (ids.length === 0) return; // empty IN () is invalid SQL — guard it
  db.runSync(`DELETE FROM study_queue WHERE id IN (${ids.join(',')})`);
}

/** Drop the entire queue — called on account switch so one user's un-synced
 *  offline batches never replay under the next user's session (cross-account
 *  contamination). See clearLocalAccountData / resetAllLocalStores. */
export function clearQueuedBatches(): void {
  db.runSync('DELETE FROM study_queue');
}
