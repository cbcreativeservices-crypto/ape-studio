/**
 * Edge guard, part 2 (2026-10-04): the two shared in-page sliders.
 *
 * DragSlider (foundations/bits.tsx, ~30 call sites across the foundations,
 * digital, gain, eq, wave, tuning, mic/speaker and cable labs) and
 * ControlSlider (amp/kit.tsx: amp, de-esser, envelope and patchbay labs) sit
 * in a well padded ~12 dp from the window edge, so their caps came within
 * 12–36 dp of it at either end — inside Android's back-gesture strip, the
 * same trap as the dock lane (laneEdgeGuard20261004.test.ts). They now take
 * the same measured guard with their own 24 dp cap and no fallback inset
 * (their position is unknown until measured; far from an edge they are
 * unchanged).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const g = await import('../src/screens/lab/rack/laneEdgeGuard.ts');
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const CAP = 24;

describe('24 dp sliders keep the cap ≥ 40 dp from both edges', () => {
  it('every width 320–1366, track inset 0–60 dp from either edge', () => {
    for (let winW = 320; winW <= 1366; winW += 3) {
      for (const pad of [0, 8, 12, 16, 20, 24, 28, 39.5, 40, 60]) {
        for (const extraR of [0, 10, 47]) {
          const x = pad;
          const w = winW - pad - (pad + extraR);
          const ins = g.laneEdgeInsets({ x, w }, winW, { capW: CAP, fallback: g.NO_INSETS });
          const lo = x + g.capLeftAt(0, w, ins, CAP);
          const hi = x + g.capLeftAt(1, w, ins, CAP) + CAP;
          assert.ok(lo >= 40 - 1e-9, `@${winW} pad ${pad}: min cap ${lo} dp from the left`);
          assert.ok(winW - hi >= 40 - 1e-9, `@${winW} pad ${pad}+${extraR}: max cap ${winW - hi} dp from the right`);
          assert.equal(g.laneValueAt(0, w, ins, CAP), 0);
          assert.equal(g.laneValueAt(w, w, ins, CAP), 1);
          const t = g.laneTravel(w, ins, CAP);
          assert.equal(g.laneDragValue(1, -t, w, ins, CAP), 0);
          assert.equal(g.laneDragValue(0, t, w, ins, CAP), 1);
        }
      }
    }
  });

  it('unmeasured → no inset (no visual change before the first measurement)', () => {
    assert.deepEqual(g.laneEdgeInsets(null, 390, { capW: CAP, fallback: g.NO_INSETS }), { l: 0, r: 0 });
  });

  it('with no inset the map is exactly the old one (no behaviour change far from an edge)', () => {
    for (const w of [200, 320, 500]) {
      for (const x of [0, 7, 12, 50, w / 2, w - 3, w]) {
        const old = Math.max(0, Math.min(1, (x - CAP / 2) / Math.max(1, w - CAP)));
        assert.ok(Math.abs(g.laneValueAt(x, w, g.NO_INSETS, CAP) - old) < 1e-12);
      }
    }
  });
});

describe('sources use the guard', () => {
  it('DragSlider', () => {
    const s = read('src/screens/lab/foundations/bits.tsx');
    assert.match(s, /useEdgeGuard\(\{ capW: CAP_W, fallback: NO_INSETS \}\)/);
    assert.match(s, /laneValueAt\(e\.nativeEvent\.locationX, wRef\.current, insRef\.current, CAP_W\)/);
    // dx = the GRABBING finger's travel (laneFingerDx), TestFlight triage 2026-10-08.
    assert.match(s, /laneDragValue\(baseRef\.current, dx, wRef\.current, insRef\.current, CAP_W\)/);
    assert.match(s, /style=\{\[styles\.sliderGuard, \{ left: ins\.l, right: ins\.r \}\]\}/);
  });
  it('ControlSlider', () => {
    const s = read('src/screens/lab/amp/kit.tsx');
    assert.match(s, /useEdgeGuard\(\{ capW: CAP_W, fallback: NO_INSETS \}\)/);
    assert.match(s, /const frac = laneValueAt\(x, wRef\.current, insRef\.current, CAP_W\);/);
    assert.match(s, /\{ left: CAP_W \/ 2 \+ ins\.l, right: CAP_W \/ 2 \+ ins\.r \}/);
  });
});
