/**
 * Web fallback for the offline quiz submission queue (Code brief §6).
 * expo-sqlite's web build needs SharedArrayBuffer + wa-sqlite wasm setup
 * (alpha in SDK 57), so web uses a session-scoped in-memory queue instead:
 * same interface, no persistence across reloads. Native resolves the SQLite
 * sibling (submissionQueueStorage.native.ts).
 */
export type QueuedSubmissionRow = {
  attempt_id: string;
  achievement_id: string;
  answers_json: string;
  submitted_at: string;
  focus_loss_count: number;
  focus_loss_duration: number;
};

const queue = new Map<string, { row: QueuedSubmissionRow; created_at: number }>();

export function upsertQueuedSubmission(row: QueuedSubmissionRow, createdAt: number): void {
  queue.set(row.attempt_id, { row, created_at: createdAt });
}

export function getQueuedSubmissions(): QueuedSubmissionRow[] {
  return [...queue.values()].sort((a, b) => a.created_at - b.created_at).map((e) => e.row);
}

export function deleteQueuedSubmission(attemptId: string): void {
  queue.delete(attemptId);
}
