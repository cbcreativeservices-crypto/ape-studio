/**
 * DragSlider lands where a FAST FLICK lifts (emulator pass 2026-10-14, Gain
 * Staging M6 PROCESS → EQ GAIN: a flick to the left end landed −8/−10 dB,
 * not −12). PanResponder does not update gestureState on release, so the
 * slider settled on the last MOVE; it now reads the lift point from the
 * release event (laneFingerLiftDx), as ParamLane does in onEnd.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { laneFingerLiftDx } = await import('../src/screens/lab/rack/laneFinger.ts');
const g = await import('../src/screens/lab/rack/laneEdgeGuard.ts');

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('laneFingerLiftDx', () => {
  const f = { id: 3, px: 200 };
  it('reads the grabbing finger from changedTouches', () => {
    assert.equal(laneFingerLiftDx({ identifier: 3, pageX: 10, changedTouches: [{ identifier: 3, pageX: 10 }] }, f), -190);
  });
  it('falls back to the event touch itself', () => {
    assert.equal(laneFingerLiftDx({ identifier: 3, pageX: 390 }, f), 190);
    assert.equal(laneFingerLiftDx({ pageX: 390 }, { id: undefined, px: 200 }), 190);
  });
  it('ignores a different finger lifting (the grabbing one is already gone)', () => {
    assert.equal(laneFingerLiftDx({ identifier: 7, pageX: 10, changedTouches: [{ identifier: 7, pageX: 10 }] }, f), null);
    assert.equal(laneFingerLiftDx({ identifier: 7, pageX: 10 }, f), null);
  });
  it('null without a position', () => {
    assert.equal(laneFingerLiftDx({}, f), null);
  });
  it('a flick from the middle to past the left end lands at 0 (−12 dB), not short', () => {
    const w = 320;
    const base = g.laneRawAt(160, w, g.NO_INSETS, 24);
    // Last move seen at −90 dp (short of the end); the lift is at −200 dp.
    const lastMove = g.laneDragValue(base, -90, w, g.NO_INSETS, 24);
    assert.ok(lastMove > 0.1, 'the last move alone stops short');
    const lift = laneFingerLiftDx({ identifier: 1, pageX: 0, changedTouches: [{ identifier: 1, pageX: 0 }] }, { id: 1, px: 200 });
    assert.equal(g.laneDragValue(base, lift as number, w, g.NO_INSETS, 24), 0);
  });
});

describe('DragSlider applies the release position', () => {
  const s = read('src/screens/lab/foundations/bits.tsx');
  const body = s.slice(s.indexOf('export function DragSlider'), s.indexOf('export function', s.indexOf('export function DragSlider') + 10));
  const rel = body.slice(body.indexOf('onPanResponderRelease'), body.indexOf('onPanResponderTerminate'));
  it('reads the lift point and feeds it before ending', () => {
    assert.match(rel, /laneFingerLiftDx\(e\.nativeEvent, fingerRef\.current\)/);
    assert.ok(rel.indexOf('feed.move(v)') > -1 && rel.indexOf('feed.move(v)') < rel.indexOf('feed.end()'));
    assert.match(rel, /capV\.value = v/);
  });
  it('a plain tap keeps the grant value (tap slop)', () => {
    assert.match(rel, /movedRef\.current \|\| Math\.abs\(lift\) > TAP_SLOP/);
  });
});
