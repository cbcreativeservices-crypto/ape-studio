/**
 * The offline study queue must not delete answers the server never received.
 *
 * ⛔ WHAT THIS PINS — a silent, permanent loss of a learner's work.
 *
 * The replay coalesces every queued row for one (achievement, method) into a
 * single call and sends it under the FIRST row's `batch_id`. The server
 * dedupes on exactly that id, and it does so BEFORE reading the payload:
 *
 *     IF v_batches @> to_jsonb(ARRAY[p_batch_id::text])
 *       THEN RETURN build_study_snapshot(v_row.id, true); END IF;
 *
 * It then returns SUCCESSFULLY. So when the first row had already committed
 * and only its response was lost — the ordinary outcome of going offline
 * mid-send, and the exact case the write-ahead queue exists to handle — the
 * whole coalesced payload was discarded, the call looked fine, and the client
 * deleted every row in the chunk. The other rows' answers and seconds were
 * never on the server and were now gone from the phone too.
 *
 * ⚠️ THE OBVIOUS FIX IS A DIFFERENT BUG, which is why the last test here
 * exists. Sending each row under its own id looks right and quietly destroys
 * credited time instead: the server clamps with
 * `v_delta := LEAST(p_active_seconds, now() - last_updated)` and every
 * successful call sets `last_updated = now()`, so ten rows sent back to back
 * credit the first and clamp the rest to about zero. Coalescing is what feeds
 * that clamp (contract §8), so a "simplification" that drops it must fail.
 *
 * The server had been reporting the discard all along via `duplicate_batch`;
 * nothing read it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sendCoalescedChunk, type ReplayRow } from '../src/features/study/replayChunk.ts';

type Ev = { item: string };

let nextId = 1;
/** One queued row's worth of work — a lost send, or an answer given offline. */
const row = (batchId: string, seconds: number, items: string[]) => ({
  row: { id: nextId++, batch_id: batchId, active_seconds: seconds } as ReplayRow,
  ev: items.map((item) => ({ item })) as Ev[],
});

/**
 * A stand-in for `record_study_progress`. `committed` are batch ids applied on
 * an earlier send whose response never made it back.
 */
function server(committed: string[]) {
  const applied: string[] = [];
  const credited: number[] = [];
  const calls: string[] = [];
  const send = async (batchId: string, seconds: number, events: Ev[]) => {
    calls.push(batchId);
    if (committed.includes(batchId)) return { duplicate_batch: true }; // payload discarded
    committed.push(batchId);
    applied.push(...events.map((e) => e.item));
    credited.push(seconds);
    return { duplicate_batch: false };
  };
  return { send, applied, credited, calls };
}

/** Rows the client deleted from the on-device queue. */
function recorder() {
  const dropped: number[] = [];
  return { drop: (ids: number[]) => dropped.push(...ids), dropped };
}

test('THE BUG: a committed first row must not take the other rows down with it', async () => {
  const items = [row('X', 60, ['a1']), row('Y', 60, ['b1']), row('Z', 60, ['c1'])];
  const s = server(['X']); // X committed earlier; its response was lost
  const r = recorder();

  await sendCoalescedChunk(items, s.send, r.drop);

  // b1 and c1 had never reached the server. If they are deleted without being
  // applied, the learner's answers are gone for good — that is the whole bug.
  assert.ok(s.applied.includes('b1'), 'b1 was deleted without ever reaching the server');
  assert.ok(s.applied.includes('c1'), 'c1 was deleted without ever reaching the server');
});

test("the duplicate row's own work is NOT re-sent — it is already counted", async () => {
  const items = [row('X', 60, ['a1']), row('Y', 60, ['b1'])];
  const s = server(['X']);

  await sendCoalescedChunk(items, s.send, recorder().drop);

  assert.equal(
    s.applied.filter((i) => i === 'a1').length,
    0,
    're-sending a committed row would double-count it',
  );
});

test('seconds follow the rows — the accepted call carries only what is left', async () => {
  const items = [row('X', 60, ['a1']), row('Y', 45, ['b1']), row('Z', 30, ['c1'])];
  const s = server(['X']);

  await sendCoalescedChunk(items, s.send, recorder().drop);

  assert.deepEqual(s.credited, [75], "X's 60s was already credited; only Y+Z remain");
});

test('every row is deleted exactly once, and only after it is accounted for', async () => {
  const items = [row('X', 10, ['a1']), row('Y', 10, ['b1']), row('Z', 10, ['c1'])];
  const s = server(['X']);
  const r = recorder();

  await sendCoalescedChunk(items, s.send, r.drop);

  assert.deepEqual(
    [...r.dropped].sort((a, b) => a - b),
    items.map((i) => i.row.id).sort((a, b) => a - b),
    'the queue must drain fully — a row left behind replays forever',
  );
  assert.equal(new Set(r.dropped).size, r.dropped.length, 'no row deleted twice');
});

test('several already-committed rows in a row still terminate and keep the rest', async () => {
  const items = [row('X', 10, ['a1']), row('Y', 10, ['b1']), row('Z', 10, ['c1'])];
  const s = server(['X', 'Y']); // two lost responses back to back
  const r = recorder();

  await sendCoalescedChunk(items, s.send, r.drop);

  assert.deepEqual(s.applied, ['c1']);
  assert.equal(r.dropped.length, 3, 'the queue must drain, not wedge');
});

test('every row already committed: nothing is re-applied and the queue empties', async () => {
  const items = [row('X', 60, ['a1']), row('Y', 60, ['b1'])];
  const s = server(['X', 'Y']);
  const r = recorder();

  await sendCoalescedChunk(items, s.send, r.drop);

  assert.deepEqual(s.applied, [], 'nothing was outstanding, so nothing should be applied');
  assert.equal(r.dropped.length, 2);
});

test('a duplicate is reported, so this stops being invisible', async () => {
  const seen: string[] = [];
  await sendCoalescedChunk([row('X', 10, ['a1']), row('Y', 10, ['b1'])], server(['X']).send, () => {}, (id) =>
    seen.push(id),
  );
  assert.deepEqual(seen, ['X']);
});

test('COALESCING SURVIVES: the ordinary path is still ONE call', async () => {
  // The property that makes the server's wall-clock clamp work. A "fix" that
  // sends each row separately passes every test above and fails here —
  // deliberately, because it would silently stop crediting study time.
  const items = [row('X', 60, ['a1']), row('Y', 60, ['b1']), row('Z', 60, ['c1'])];
  const s = server([]);

  await sendCoalescedChunk(items, s.send, recorder().drop);

  assert.equal(s.calls.length, 1, 'three queued rows must coalesce into one call');
  assert.deepEqual(s.credited, [180], 'all three rows seconds in one call');
  assert.deepEqual(s.applied, ['a1', 'b1', 'c1']);
});

test('an empty chunk sends nothing', async () => {
  const s = server([]);
  await sendCoalescedChunk([], s.send, recorder().drop);
  assert.equal(s.calls.length, 0);
});
