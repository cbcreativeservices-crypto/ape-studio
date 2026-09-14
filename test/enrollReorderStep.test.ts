/**
 * Enrollment drag-reorder step math — the neighbor-height stepping loop.
 *
 * THE INTENDED BEHAVIOR (owner rulings 2026-08-05 and 2026-09-13): a lifted
 * card commits one ±1 swap each time the finger travels past the row it is
 * PASSING, and each step is sized by THAT NEIGHBOR's real measured height —
 * not a fixed constant, and not the lifted card's own height. A thin collapsed
 * row next to a tall expanded one must need different travel, or a one-card
 * drag fires the wrong number of swaps (the 2026-08-05 bug) and a multi-row
 * drag mis-steps (the 2026-09-13 bug).
 *
 * EXTRACTION NOTE (report item): the algorithm under test lives INLINE in the
 * PanResponder of src/screens/enrollment/EnrollmentScreen.tsx
 * (onPanResponderMove, ~lines 368-401) and cannot be imported without
 * rendering the component. `stepDrag` below is a faithful line-for-line
 * replica — loop guard of 24, `|| DRAG_ROW_H` fallback, strict `<` threshold,
 * local order-array mirror swap, dragAccum bookkeeping — serving as the
 * executable spec of the intended behavior. If the inline math is ever edited,
 * this spec is the contract it must still satisfy; extracting the loop into a
 * pure importable function (fed by rowOrder/rowHeights) would let this file
 * test the shipping code directly.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const DRAG_ROW_H = 84; // EnrollmentScreen.tsx fallback until a row is measured

type DragSession = {
  /** Rendered order of reorderable row ids (rowOrder.current.<section>). */
  order: string[];
  /** Measured heights (rowHeights.current); missing → DRAG_ROW_H. */
  heights: Map<string, number>;
  /** The lifted row (liftedIdRef.current). */
  id: string;
  /** dragAccum.current — reset to 0 on grant (lift). */
  accum: number;
  /** Every ±1 handed to move(), in order, across the whole session. */
  moves: (-1 | 1)[];
};

function lift(order: string[], heights: Record<string, number>, id: string): DragSession {
  return { order: [...order], heights: new Map(Object.entries(heights)), id, accum: 0, moves: [] };
}

/** One onPanResponderMove event. `dy` is the gesture's TOTAL vertical travel
 *  since grant (RN's g.dy is cumulative, not a delta). Returns the value the
 *  card's translate is set to (dragY = g.dy - dragAccum) — the "ride under
 *  the thumb" residual. */
function moveEvent(s: DragSession, dy: number): number {
  const arr = s.order;
  for (let guard = 0; guard < 24; guard++) {
    const remaining = dy - s.accum;
    const dir: -1 | 1 = remaining > 0 ? 1 : -1;
    const i = arr.indexOf(s.id);
    const nb = i >= 0 ? arr[i + dir] : undefined;
    if (nb == null) break; // end of the list in this direction
    const nbH = s.heights.get(nb) || DRAG_ROW_H;
    if (Math.abs(remaining) < nbH) break; // not past the neighbor yet
    s.moves.push(dir);
    [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]]; // mirror the swap locally
    s.accum += dir * nbH;
  }
  return dy - s.accum;
}

// ── Single steps, mixed heights ─────────────────────────────────────────────

test('a step is sized by the NEIGHBOR being passed, not the lifted card', () => {
  // Lifted card is TALL (200); the row below is THIN (30). Passing the thin
  // row must take 30 px of travel, not 200 and not 84.
  const s = lift(['A', 'B', 'C'], { A: 200, B: 30, C: 120 }, 'A');
  assert.equal(moveEvent(s, 29), 29, '29 px < the 30 px neighbor → no swap yet, card rides the full 29');
  assert.deepEqual(s.order, ['A', 'B', 'C']);
  moveEvent(s, 30); // exactly the neighbor height commits (strict < holds it only BELOW)
  assert.deepEqual(s.order, ['B', 'A', 'C']);
  assert.deepEqual(s.moves, [1]);
  assert.equal(s.accum, 30);
});

test('dragging up steps by the height of the row ABOVE', () => {
  const s = lift(['A', 'B', 'C'], { A: 40, B: 40, C: 90 }, 'C');
  moveEvent(s, -39);
  assert.deepEqual(s.order, ['A', 'B', 'C'], 'not past B yet');
  const residual = moveEvent(s, -50);
  assert.deepEqual(s.order, ['A', 'C', 'B']);
  assert.deepEqual(s.moves, [-1]);
  assert.equal(s.accum, -40);
  assert.equal(residual, -10, 'card keeps riding the 10 px not yet committed');
});

test('an unmeasured neighbor falls back to the 84 px estimate', () => {
  const s = lift(['A', 'B'], { A: 50 }, 'A'); // B never reported onLayout
  moveEvent(s, 83);
  assert.deepEqual(s.order, ['A', 'B']);
  moveEvent(s, 84);
  assert.deepEqual(s.order, ['B', 'A']);
});

// ── List ends ───────────────────────────────────────────────────────────────

test('at the top of the list an upward drag commits nothing, however far', () => {
  const s = lift(['A', 'B'], { A: 60, B: 60 }, 'A');
  const residual = moveEvent(s, -500);
  assert.deepEqual(s.order, ['A', 'B']);
  assert.deepEqual(s.moves, []);
  assert.equal(residual, -500, 'the card follows the finger but nothing swaps');
});

test('a huge downward drag stops cleanly at the bottom of the list', () => {
  const s = lift(['A', 'B', 'C'], { A: 50, B: 50, C: 50 }, 'A');
  const residual = moveEvent(s, 10_000);
  assert.deepEqual(s.order, ['B', 'C', 'A']);
  assert.deepEqual(s.moves, [1, 1], 'exactly the two real swaps, no phantom moves past the end');
  assert.equal(residual, 10_000 - 100);
});

// ── Multi-step in one event ─────────────────────────────────────────────────

test('one large move event commits every neighbor passed, each at its own height', () => {
  // Passing a 30 then a 200 in a single event: total travel needed is 230.
  const s = lift(['A', 'B', 'C', 'D'], { A: 80, B: 30, C: 200, D: 30 }, 'A');
  moveEvent(s, 229);
  assert.deepEqual(s.order, ['B', 'A', 'C', 'D'], '229 clears the 30 but not 30+200');
  moveEvent(s, 230);
  assert.deepEqual(s.order, ['B', 'C', 'A', 'D']);
  assert.deepEqual(s.moves, [1, 1]);
  assert.equal(s.accum, 230);
});

test('the same multi-row distance lands differently when heights are reversed', () => {
  // The 2026-09-13 bug: sizing every step by the LIFTED card made step costs
  // order-independent. With neighbor sizing, passing [200, 30] vs [30, 200]
  // differs midway even though the total is the same.
  const tallFirst = lift(['A', 'B', 'C'], { A: 80, B: 200, C: 30 }, 'A');
  const thinFirst = lift(['A', 'B', 'C'], { A: 80, B: 30, C: 200 }, 'A');
  moveEvent(tallFirst, 210);
  moveEvent(thinFirst, 210);
  assert.deepEqual(tallFirst.order, ['B', 'A', 'C'], '210 clears only the 200');
  assert.deepEqual(thinFirst.order, ['B', 'A', 'C'], '210 clears the 30 but not 30+200');
  assert.equal(tallFirst.accum, 200);
  assert.equal(thinFirst.accum, 30, 'same order, different committed travel — neighbor-sized');
});

// ── Direction reversal mid-drag ─────────────────────────────────────────────

test('reversing the drag un-commits swaps on the way back', () => {
  const s = lift(['A', 'B', 'C'], { A: 80, B: 30, C: 200 }, 'A');
  moveEvent(s, 40); // down past the thin B
  assert.deepEqual(s.order, ['B', 'A', 'C']);
  // Finger comes back up above the start point. Undoing the swap means
  // re-passing B (30 px) in the other direction: accum 30 → needs dy ≤ 0.
  moveEvent(s, 10);
  assert.deepEqual(s.order, ['B', 'A', 'C'], 'dy 10: remaining -20 < B\'s 30 — swap holds');
  moveEvent(s, 0);
  assert.deepEqual(s.order, ['A', 'B', 'C'], 'dy 0: remaining -30 reaches B\'s height — swap undone');
  assert.deepEqual(s.moves, [1, -1]);
  assert.equal(s.accum, 0, 'a full round trip leaves no committed travel');
});

test('a reversal that keeps going reorders in the new direction', () => {
  const s = lift(['A', 'B', 'C'], { A: 50, B: 50, C: 50 }, 'B');
  moveEvent(s, 50); // down past C
  assert.deepEqual(s.order, ['A', 'C', 'B']);
  moveEvent(s, -100); // sweep up: undo C (50), then pass A (50)
  assert.deepEqual(s.order, ['B', 'A', 'C']);
  assert.deepEqual(s.moves, [1, -1, -1]);
  assert.equal(s.accum, -50);
});

// ── The loop guard ──────────────────────────────────────────────────────────

test('one event commits at most 24 swaps; the next event finishes the job', () => {
  // 30 thin rows below the lifted one — a single violent fling. The guard
  // caps the loop at 24 iterations per event; the residual carries, so the
  // NEXT move event (same cumulative dy) completes the remaining swaps.
  const ids = Array.from({ length: 31 }, (_, i) => `r${i}`);
  const heights = Object.fromEntries(ids.map((id) => [id, 10]));
  const s = lift(ids, heights, 'r0');
  moveEvent(s, 300);
  assert.equal(s.moves.length, 24, 'guard caps a single event');
  assert.equal(s.accum, 240);
  moveEvent(s, 300);
  assert.equal(s.moves.length, 30, 'follow-up event walks the rest of the way');
  assert.equal(s.order[s.order.length - 1], 'r0');
});

// ── Fresh grant ─────────────────────────────────────────────────────────────

test('each new lift starts from zero accumulated travel', () => {
  // onPanResponderGrant resets dragAccum — travel from a previous lift must
  // never leak into the next one.
  const first = lift(['A', 'B'], { A: 50, B: 50 }, 'A');
  moveEvent(first, 50);
  assert.deepEqual(first.order, ['B', 'A']);
  const second = lift(['B', 'A'], { A: 50, B: 50 }, 'A');
  assert.equal(second.accum, 0);
  moveEvent(second, -49);
  assert.deepEqual(second.order, ['B', 'A'], 'a fresh lift needs the full neighbor height again');
});
