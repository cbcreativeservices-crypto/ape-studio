/**
 * The GR ladder's fill maths. It reads DOWNWARD — 0 dB of reduction at the top,
 * growing down as the compressor takes more away — so "lit" counts from the top
 * and the arithmetic is worth pinning: this is a METER, and a meter that
 * over-reads is worse than no meter (owner's no-fake-meters rule).
 *
 * The component is Skia/RN and cannot be rendered here, so the pure function is
 * tested and the component uses the identical expression. Kept in lockstep by
 * hand — if the component's `lit` line changes, this must change with it.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const SEGS = 16;
/** Mirror of GrLadder's lit-segment maths (fxViz.tsx). */
const lit = (grDb: number, maxDb = 24) =>
  Math.round(Math.min(Math.max(grDb, 0) / maxDb, 1) * SEGS);

describe('GrLadder fill', () => {
  test('silence lights nothing — a lit meter over silence is a fake meter', () => {
    assert.equal(lit(0), 0);
  });

  test('negative or nonsense reduction cannot light it', () => {
    assert.equal(lit(-5), 0);
    assert.equal(lit(-0.001), 0);
  });

  test('full scale lights every segment and no more', () => {
    assert.equal(lit(24), SEGS);
    assert.equal(lit(99), SEGS, 'over-range clamps rather than overflowing the stack');
  });

  test('half the scale lights half the ladder', () => {
    assert.equal(lit(12), SEGS / 2);
  });

  test('it grows monotonically with reduction — never dips as GR deepens', () => {
    let prev = -1;
    for (let db = 0; db <= 24; db += 0.25) {
      const n = lit(db);
      assert.ok(n >= prev, `lit(${db}) = ${n} went backwards from ${prev}`);
      prev = n;
    }
  });

  test("the gate's 70 dB scale is honoured, not the compressor's 24", () => {
    // A gate closes far harder than a compressor reduces; on a 24 dB scale it
    // would peg instantly and teach nothing.
    assert.equal(lit(35, 70), SEGS / 2);
    assert.equal(lit(24, 70), Math.round((24 / 70) * SEGS));
    assert.notEqual(lit(24, 70), SEGS, '24 dB must NOT peg a 70 dB gate scale');
  });
});
