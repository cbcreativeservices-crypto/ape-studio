/**
 * Web fallback for the offline study batch queue (Code brief §6).
 * expo-sqlite's web build needs SharedArrayBuffer + wa-sqlite wasm setup
 * (alpha in SDK 57), so web uses a session-scoped in-memory queue instead:
 * same interface, no persistence across reloads. Native resolves the SQLite
 * sibling (studyQueueStorage.native.ts).
 */
export type StudyQueueRow = {
  id: number;
  achievement_id: string;
  method_key: string;
  batch_id: string;
  active_seconds: number;
  events_json: string;
};

let nextId = 1;
const queue: StudyQueueRow[] = [];

export function insertQueuedBatch(
  row: Omit<StudyQueueRow, 'id'>,
  _createdAt: number,
): void {
  queue.push({ id: nextId++, ...row });
}

export function getQueuedBatches(): StudyQueueRow[] {
  return [...queue];
}

export function deleteQueuedBatches(ids: number[]): void {
  const drop = new Set(ids);
  for (let i = queue.length - 1; i >= 0; i--) {
    if (drop.has(queue[i].id)) queue.splice(i, 1);
  }
}
