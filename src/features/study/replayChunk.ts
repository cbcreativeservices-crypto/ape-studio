/**
 * Sending one coalesced chunk of the offline study queue.
 *
 * ⛔ WHY THIS IS ITS OWN MODULE. It is the step that decides which queued
 * rows get DELETED, so getting it wrong loses work a learner actually did —
 * and it has been got wrong three times (see the history in sync.ts). It
 * lives here, free of React Native and Supabase, so it can be tested against
 * a stand-in server instead of only being read.
 *
 * ⛔ THE RULE: A DUPLICATE REPLY MEANS NOTHING LANDED.
 *
 * A chunk goes out under its FIRST row's `batch_id`, and the server dedupes
 * on exactly that id, before it looks at the payload:
 *
 *     IF v_batches @> to_jsonb(ARRAY[p_batch_id::text])
 *       THEN RETURN build_study_snapshot(v_row.id, true); END IF;
 *
 * It then returns SUCCESSFULLY. So if that first row had already committed
 * and only its response was lost — the ordinary result of going offline
 * mid-send, which is the case the queue exists for — the whole coalesced
 * payload was thrown away while the call looked like a success, and every row
 * in the chunk was deleted. The rest of those rows' answers and seconds had
 * never reached the server and were now gone from the phone as well.
 *
 * ⚠️ DO NOT "SIMPLIFY" THIS BY SENDING EACH ROW ON ITS OWN. It is the obvious
 * fix and it trades this bug for a quieter one: the server credits time with
 *     v_delta := LEAST(p_active_seconds, now() - last_updated)
 * and every successful call sets `last_updated = now()`, so ten rows sent
 * back to back credit the first and clamp the other nine to roughly zero.
 * Coalescing is what feeds that clamp (contract §8).
 *
 * So: on a duplicate, the id we sent under is PROVEN committed — that row's
 * work is safely on the server, and it is the only row we may delete. Retry
 * the remainder under the next row's own id. Each pass drops exactly one row,
 * so this terminates; it keeps one call per group for the clamp; and it can
 * never delete a row the server has not seen.
 */

/** The little a queued row must expose for this to be safe. */
export type ReplayRow = { id: number; batch_id: string; active_seconds: number };

/** What the server tells us back. `duplicate_batch` is the load-bearing bit —
 *  the snapshot has always carried it and nothing used to read it. */
export type ReplyLike = { duplicate_batch?: boolean } | null | undefined;

export async function sendCoalescedChunk<E>(
  items: { row: ReplayRow; ev: E[] }[],
  send: (batchId: string, seconds: number, events: E[]) => Promise<ReplyLike>,
  drop: (rowIds: number[]) => void,
  onDuplicate?: (batchId: string) => void,
): Promise<void> {
  let pending = items;
  while (pending.length > 0) {
    const seconds = pending.reduce((sum, p) => sum + p.row.active_seconds, 0);
    const events = pending.flatMap((p) => p.ev);
    const reply = await send(pending[0].row.batch_id, seconds, events);

    if (!reply?.duplicate_batch) {
      // ⛔ Delete AS IT LANDS. Deleting only after the whole group meant a
      // later chunk's failure re-sent every earlier chunk on the next pass.
      drop(pending.map((p) => p.row.id));
      return;
    }

    onDuplicate?.(pending[0].row.batch_id);
    drop([pending[0].row.id]);
    pending = pending.slice(1);
  }
}
