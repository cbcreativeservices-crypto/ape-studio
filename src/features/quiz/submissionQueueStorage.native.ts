/**
 * SQLite-backed storage for the offline quiz submission queue (Code brief §6).
 * Native only — Metro picks this file on ios/android; web resolves the
 * in-memory sibling (submissionQueueStorage.ts) so expo-sqlite (and its
 * wa-sqlite wasm worker) never enters the web bundle.
 */
import * as SQLite from 'expo-sqlite';

export type QueuedSubmissionRow = {
  attempt_id: string;
  achievement_id: string;
  answers_json: string;
  submitted_at: string;
  focus_loss_count: number;
  focus_loss_duration: number;
};

const db = SQLite.openDatabaseSync('ape-studio.db');
// MIGRATION NOTE (owner debug audit 2026-08-21): CREATE TABLE IF NOT EXISTS only.
// Before EVER changing this schema, add a PRAGMA user_version migration — an
// existing install won't be ALTERed by IF NOT EXISTS, so new-column inserts throw.
db.execSync(`CREATE TABLE IF NOT EXISTS quiz_submission_queue (
  attempt_id TEXT PRIMARY KEY,
  achievement_id TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  focus_loss_count INTEGER NOT NULL,
  focus_loss_duration INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);`);

export function upsertQueuedSubmission(row: QueuedSubmissionRow, createdAt: number): void {
  db.runSync(
    'INSERT OR REPLACE INTO quiz_submission_queue (attempt_id, achievement_id, answers_json, submitted_at, focus_loss_count, focus_loss_duration, created_at) VALUES (?,?,?,?,?,?,?)',
    [
      row.attempt_id,
      row.achievement_id,
      row.answers_json,
      row.submitted_at,
      row.focus_loss_count,
      row.focus_loss_duration,
      createdAt,
    ],
  );
}

export function getQueuedSubmissions(): QueuedSubmissionRow[] {
  return db.getAllSync<QueuedSubmissionRow>(
    'SELECT * FROM quiz_submission_queue ORDER BY created_at',
  );
}

export function deleteQueuedSubmission(attemptId: string): void {
  db.runSync('DELETE FROM quiz_submission_queue WHERE attempt_id = ?', [attemptId]);
}

/** Drop the entire queue — called on account switch so one user's un-synced
 *  offline quiz submissions never replay under the next user's session. */
export function clearQueuedSubmissions(): void {
  db.runSync('DELETE FROM quiz_submission_queue');
}
