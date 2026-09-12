/**
 * The tuning labs' cents rail: the touch map must be the exact inverse of the
 * drawing.
 *
 * The rail is DRAWN inset by 14 of its 340 viewBox units at each end, but the
 * three drag handlers read a bare `(locationX / width) * 1200`. Aiming at the
 * drawn `1:1` tick returned 49.4 cents; the drawn `2:1` returned 1150.6; the
 * error was zero only at midrail. In chapter 1 the prompt asks the learner to
 * drag to the octave and `onSettle` needs >= 1199.5 to unlock the card carrying
 * the chapter objective — so dragging to the visible endpoint landed 49 cents
 * outside a 9-cent snap and the chapter could not be completed by dragging at
 * all. Only SHOW ME finished it.
 *
 * Mirror convention as in `grLadder.test.ts` (the component is RN/Svg and
 * cannot be imported here), plus a source pin so the mirror cannot drift.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIL_W = 340;
const RAIL_PAD = 14;

/** Mirror of `xOfCents` (primitives.tsx) — where a value is DRAWN. */
const xOfCents = (c: number) => RAIL_PAD + (Math.max(0, Math.min(1200, c)) / 1200) * (RAIL_W - RAIL_PAD * 2);

/** Mirror of `centsOfXFrac` (primitives.tsx) — what a TOUCH there returns. */
const centsOfXFrac = (xFrac: number) => {
  const vb = xFrac * RAIL_W;
  const c = ((vb - RAIL_PAD) / (RAIL_W - RAIL_PAD * 2)) * 1200;
  return Math.max(0, Math.min(1200, c));
};

/** The old, broken handler, kept so the regression stays legible. */
const oldHandler = (xFrac: number) => xFrac * 1200;

describe('cents rail — touch is the inverse of the drawing', () => {
  test('tapping a drawn landmark returns that landmark', () => {
    for (const c of [0, 100, 386.3, 498, 700, 701.955, 1200]) {
      const back = centsOfXFrac(xOfCents(c) / RAIL_W);
      assert.ok(Math.abs(back - c) < 1e-9, `${c} cents drew at x and read back as ${back}`);
    }
  });

  test('the octave is reachable — the chapter-1 unlock needs >= 1199.5', () => {
    const atDrawnOctave = centsOfXFrac(xOfCents(1200) / RAIL_W);
    assert.ok(atDrawnOctave >= 1199.5, `dragging to the drawn 2:1 must settle the octave; got ${atDrawnOctave}`);
  });

  test('and the old handler could NOT reach it — this is the regression', () => {
    const old = oldHandler(xOfCents(1200) / RAIL_W);
    assert.ok(old < 1199.5, 'the old map is what made the chapter uncompletable');
    assert.ok(Math.abs(old - 1150.6) < 0.2, `expected the documented 1150.6; got ${old.toFixed(1)}`);
  });

  test('unison was 49 cents out — the other end of the same error', () => {
    assert.ok(Math.abs(oldHandler(xOfCents(0) / RAIL_W) - 49.4) < 0.2);
    assert.equal(centsOfXFrac(xOfCents(0) / RAIL_W), 0);
  });

  test('it still clamps outside the drawn rail', () => {
    assert.equal(centsOfXFrac(0), 0);
    assert.equal(centsOfXFrac(1), 1200);
  });

  test('source pin: the handlers use the shared inverse, not a bare ratio', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const rail = readFileSync(join(here, '..', 'src', 'screens', 'lab', 'tuning', 'components', 'dragRail.tsx'), 'utf8');
    assert.doesNotMatch(rail, /locationX \/ wRef\.current\) \* 1200/, 'the bare ratio is the 2026-09-12 regression');
    assert.match(rail, /centsOfXFrac\(e\.nativeEvent\.locationX \/ wRef\.current\)/);
    const prim = readFileSync(join(here, '..', 'src', 'screens', 'lab', 'tuning', 'components', 'primitives.tsx'), 'utf8');
    assert.match(prim, /export const centsOfXFrac/, 'the inverse must live beside the drawing it inverts');
  });
});
