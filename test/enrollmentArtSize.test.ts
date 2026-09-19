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

const { artSideLen, HEAD_GAP, actionsFitBesideIdentity } =
  await import('../src/screens/enrollment/selectionLayout.ts');

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
      if (actionsFitBesideIdentity(row)) {
        // Identity AND buttons across: the column must stay the wider half.
        assert.ok(column >= 260, `row ${row}: side-by-side column only ${column}pt`);
        assert.ok(column > artSideLen(row), `row ${row}: art is wider than the column beside it`);
      } else {
        // Stacked: the art takes the larger share ON PURPOSE (it is what
        // fills the space the owner circled), but the column must still hold
        // a full-width button and a readable title.
        assert.ok(column >= 120, `row ${row}: stacked column only ${column}pt`);
      }
    }
  });

  it('stays within its clamp at absurd widths', () => {
    assert.equal(artSideLen(1), 84);
    assert.equal(artSideLen(100), 84);
    assert.equal(artSideLen(4000), 240);
    for (const row of ROWS) {
      const side = artSideLen(row);
      assert.ok(side >= 84 && side <= 240, `row ${row}: side ${side} outside the clamp`);
    }
  });

  it('grows with the row inside each layout mode', () => {
    // NOT monotonic across the whole range, and deliberately so: at the width
    // where the buttons stop stacking the share drops from 0.46 to 0.34,
    // because the column suddenly has to hold two things across instead of
    // one. Monotonic WITHIN a mode is the property that matters.
    const modes = [ROWS.filter((r) => !actionsFitBesideIdentity(r)), ROWS.filter(actionsFitBesideIdentity)];
    for (const group of modes) {
      for (let i = 1; i < group.length; i++) {
        assert.ok(artSideLen(group[i]) >= artSideLen(group[i - 1]), `not monotonic at ${group[i]}`);
      }
    }
  });

  it('keeps one share, with no jump where the buttons re-flow', () => {
    /**
     * An earlier version used two shares — a smaller square when the buttons
     * sat beside the identity, a bigger one when they stacked — so that a
     * SQUARE art could grow tall enough to cover the controls next to it.
     * The art visibly jumped size at the width where the layout re-flowed.
     * It is unnecessary now the art stretches to the row instead, and this
     * holds that it does not come back.
     */
    for (const row of ROWS) {
      const side = artSideLen(row);
      if (side <= 84 || side >= 240) continue; // clamped ends are not the rule
      const share = side / row;
      assert.ok(
        Math.abs(share - 0.4) < 0.005,
        `row ${row}: share ${(share * 100).toFixed(1)}% — the art must not change share with the layout mode`,
      );
    }
  });

  it('has a usable size before anything has been measured', () => {
    // First render happens before onLayout; a 0 here must not collapse the art.
    for (const bad of [0, -1, Number.NaN]) {
      assert.equal(artSideLen(bad as number), 96);
    }
  });
});
