/**
 * Lane edge guard (owner, Pixel 7 Pro with gesture navigation, 2026-10-04):
 * "when grabbing at extreme ends wants to scroll (swipe gesture) to next
 * screen — very frustrating".
 *
 * Cause: the dock pads the ParamLane 8 dp from each screen edge and the cap
 * travelled the lane's full width, so at either end the grabbable cap sat
 * 8–34 dp from the edge — inside Android's back-gesture strip, which pilfers
 * a touch that starts there and moves inward.
 *
 * Fix: the cap's travel is inset so its OUTER edge stays ≥ 40 dp from both
 * window edges, from the lane's measured frame (laneEdgeGuard.ts). These
 * cases prove it for every window width 320–1366 in the dock's real layouts
 * (phone dock, tablet reading column, full screen with an asymmetric
 * landscape cutout), and that both endpoints stay reachable.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const g = await import('../src/screens/lab/rack/laneEdgeGuard.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const DOCK_PAD = 8; // RackUnit styles.dock paddingHorizontal
const READING_MAX_W = 560; // theme/readingColumn.ts (dockInner maxWidth)

/** The lane's frame in the window for a dock spanning [left, winW - right). */
function dockLane(winW: number, left = 0, right = 0) {
  const inner = winW - left - right - DOCK_PAD * 2;
  const w = Math.min(inner, READING_MAX_W);
  const x = left + DOCK_PAD + (inner - w) / 2;
  return { x, w };
}

/** Window-space x of the cap's left and right edges at value v. */
function capEdges(frame: { x: number; w: number }, winW: number, v: number) {
  const ins = g.laneEdgeInsets(frame, winW);
  const left = frame.x + g.capLeftAt(v, frame.w, ins);
  return { left, right: left + g.LANE_CAP_W, ins };
}

function assertGuarded(frame: { x: number; w: number }, winW: number, tag: string) {
  const lo = capEdges(frame, winW, 0);
  const hi = capEdges(frame, winW, 1);
  assert.ok(lo.left >= g.EDGE_GUARD_DP - 1e-9, `${tag}: cap at min is ${lo.left.toFixed(2)} dp from the left edge`);
  assert.ok(winW - hi.right >= g.EDGE_GUARD_DP - 1e-9, `${tag}: cap at max is ${(winW - hi.right).toFixed(2)} dp from the right edge`);
  // The cap never leaves the lane either.
  assert.ok(lo.left >= frame.x - 1e-9 && hi.right <= frame.x + frame.w + 1e-9, `${tag}: cap leaves the lane`);
}

describe('ParamLane cap stays ≥ 40 dp from both window edges', () => {
  it('phone and tablet dock, portrait and landscape, every width 320–1366', () => {
    for (let winW = 320; winW <= 1366; winW++) assertGuarded(dockLane(winW), winW, `dock @${winW}`);
  });

  it('full screen with an asymmetric landscape cutout / safe-area inset', () => {
    for (let winW = 320; winW <= 1366; winW += 7) {
      for (const [l, r] of [
        [0, 0],
        [47, 0],
        [0, 47],
        [24, 24],
        [59, 34],
        [0, 120],
      ]) {
        assertGuarded(dockLane(winW, l, r), winW, `full @${winW} insets ${l}/${r}`);
      }
    }
  });

  it('a lane at the very edge (no dock pad) and fractional measurements', () => {
    for (let winW = 320; winW <= 1366; winW += 13) {
      assertGuarded({ x: 0, w: winW }, winW, `edge @${winW}`);
      assertGuarded({ x: 8.33, w: winW - 16.66 }, winW, `frac @${winW}`);
    }
  });

  it('the dock fallback (before the first measurement) is exact for a phone dock', () => {
    assert.deepEqual(g.FALLBACK_INSETS, { l: 32, r: 32 });
    for (const winW of [320, 360, 375, 390, 412, 430]) {
      const f = dockLane(winW);
      assert.equal(f.x + g.FALLBACK_INSETS.l, 40);
      assert.equal(winW - (f.x + f.w) + g.FALLBACK_INSETS.r, 40);
      assert.deepEqual(g.laneEdgeInsets(f, winW), g.FALLBACK_INSETS);
    }
  });

  it('a lane already far from the edges (tablet reading column) gets no inset', () => {
    assert.deepEqual(g.laneEdgeInsets(dockLane(1024), 1024), { l: 0, r: 0 });
    assert.deepEqual(g.laneEdgeInsets(dockLane(820), 820), { l: 0, r: 0 });
  });

  it('a missing or mid-transition measurement keeps the dock fallback', () => {
    assert.deepEqual(g.laneEdgeInsets(null, 390), g.FALLBACK_INSETS);
    assert.deepEqual(g.laneEdgeInsets({ x: 8, w: 0 }, 390), g.FALLBACK_INSETS);
    assert.deepEqual(g.laneEdgeInsets({ x: 300, w: 374 }, 390), g.FALLBACK_INSETS); // off the right edge
    assert.deepEqual(g.laneEdgeInsets({ x: -200, w: 374 }, 390), g.FALLBACK_INSETS); // off the left edge
  });
});

describe('both endpoints stay reachable', () => {
  for (const winW of [320, 390, 412, 844, 932, 1366]) {
    it(`@${winW}: min and max by tap and by dragging inward from a guarded cap`, () => {
      const f = dockLane(winW);
      const ins = g.laneEdgeInsets(f, winW);
      const travel = g.laneTravel(f.w, ins);
      assert.ok(travel > 200, `travel ${travel}`);
      // Tap anywhere in an inset end clamps to that end.
      assert.equal(g.laneValueAt(0, f.w, ins), 0);
      assert.equal(g.laneValueAt(f.w, f.w, ins), 1);
      // Tap on the cap's centre at each end lands exactly on the end value.
      assert.equal(g.laneValueAt(ins.l + g.LANE_CAP_W / 2, f.w, ins), 0);
      assert.ok(Math.abs(g.laneValueAt(f.w - ins.r - g.LANE_CAP_W / 2, f.w, ins) - 1) < 1e-9);
      // Grab the cap at max (≥ 40 dp from the right edge) and drag inward the
      // full travel: reaches min; and back out: reaches max.
      assert.equal(g.laneDragValue(1, -travel, f.w, ins), 0);
      assert.equal(g.laneDragValue(0, travel, f.w, ins), 1);
      // The grab point itself is ≥ 40 dp in at both ends.
      const grabMin = f.x + ins.l + g.LANE_CAP_W / 2;
      const grabMax = f.x + f.w - ins.r - g.LANE_CAP_W / 2;
      assert.ok(grabMin >= 40 + g.LANE_CAP_W / 2 - 1e-9);
      assert.ok(winW - grabMax >= 40 + g.LANE_CAP_W / 2 - 1e-9);
    });
  }
});

describe('ParamLane source uses the guard', () => {
  const s = read('src/screens/lab/rack/ParamLane.tsx');
  it('touch math goes through the guarded travel, never the raw lane width', () => {
    assert.match(s, /laneValueAt\(e\.nativeEvent\.locationX, wRef\.current, insRef\.current\)/);
    assert.match(s, /laneDragValue\(baseRef\.current, dx, wRef\.current, insRef\.current\)/);
    assert.doesNotMatch(s, /wRef\.current - CAP_W\)/);
  });
  it('slot, scale and cap are drawn inside the inset travel', () => {
    assert.match(s, /style=\{\[styles\.travel, \{ left: ins\.l, right: ins\.r \}\]\}/);
    assert.match(s, /useEdgeGuard\(\{ capW: CAP_W, fallback: FALLBACK_INSETS \}\)/);
    assert.match(read('src/screens/lab/rack/useEdgeGuard.ts'), /measureInWindow/);
  });
  it('the finger-follow contract is untouched', () => {
    assert.match(s, /fingerRef\.current = laneFingerAt\(e\.nativeEvent\);/);
    assert.match(s, /const dx = laneFingerDx\(e\.nativeEvent, fingerRef\.current, g\.dx\);\n\s*if \(dx === 'lifted'\) return;/);
  });
});
