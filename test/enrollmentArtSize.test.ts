/**
 * The square artwork on the Enrollments selection head.
 *
 * ⛔ WHY THIS TEST EXISTS. The first version sized the square from the height
 * of the text column beside it. The square's side is also its WIDTH, and the
 * text column is `flex: 1` in the same row — so a bigger square left a
 * narrower column, a narrower column wrapped more and grew TALLER, and that
 * height became the next side. It never converged: on the owner's phone the
 * head filled the screen, the buttons ran off the right edge, and the
 * continuous re-render read as a violent flicker. It reached a real device.
 *
 * The property that makes it safe is that the side depends on the row's WIDTH
 * and nothing else — the row's width is fixed by the panel above and no
 * choice the art makes can change it. These tests hold that property and the
 * consequence of it: that the column left over is always wide enough for the
 * controls that broke.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { artSideLen, HEAD_GAP } = await import('../src/screens/enrollment/selectionLayout.ts');

/** Panel widths for the narrowest phone we support up to a large tablet. */
const ROWS = [280, 300, 320, 343, 360, 390, 412, 430, 600, 834, 1024];
/** `head` is a row with this gap between the art and the text column. */
const GAP = HEAD_GAP;

describe('artSideLen', () => {
  it('is a function of width alone, so it settles in one pass', () => {
    // The loop that shipped fed the result back in as the next input. Doing
    // that here must be a no-op: feeding a row width through repeatedly can
    // never move the answer, because the answer is not an input to the width.
    for (const row of ROWS) {
      const first = artSideLen(row);
      let side = first;
      for (let i = 0; i < 25; i++) side = artSideLen(row);
      assert.equal(side, first, `row ${row} did not hold steady`);
    }
  });

  it('never takes so much width that the controls are squeezed', () => {
    // This is the failure the owner photographed: "FINAL EXAM · ON THE AWARD
    // PAGE →" wrapped to one character per line and STUDY ALL ran off-screen.
    for (const row of ROWS) {
      const column = row - artSideLen(row) - GAP;
      assert.ok(column >= 150, `row ${row}: text column only ${column}pt`);
      assert.ok(column > artSideLen(row), `row ${row}: art is wider than the column beside it`);
    }
  });

  it('stays within its clamp at absurd widths', () => {
    assert.equal(artSideLen(1), 84);
    assert.equal(artSideLen(100), 84);
    assert.equal(artSideLen(4000), 176);
    for (const row of ROWS) {
      const side = artSideLen(row);
      assert.ok(side >= 84 && side <= 176, `row ${row}: side ${side} outside the clamp`);
    }
  });

  it('grows with the row, never shrinks', () => {
    for (let i = 1; i < ROWS.length; i++) {
      assert.ok(artSideLen(ROWS[i]) >= artSideLen(ROWS[i - 1]), `not monotonic at ${ROWS[i]}`);
    }
  });

  it('has a usable size before anything has been measured', () => {
    // First render happens before onLayout; a 0 here must not collapse the art.
    for (const bad of [0, -1, Number.NaN]) {
      assert.equal(artSideLen(bad as number), 96);
    }
  });
});
