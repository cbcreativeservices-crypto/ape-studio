/**
 * DJ Systems Lab — FULL SCREEN zoom after a touch (bug 2026-10-19, grader on
 * screens 4 and 6): a tap or a 1× drag, then 2× or 3×, landed the zoomed
 * window off-screen (nearly all black, or a thin strip at the right).
 *
 * The cause: the rack scrolls every step to the opening's last touch, but the
 * DJ host dropped that touch on every step — it told an opening from a step
 * by the time since its last unmount, and a step's new host renders BEFORE
 * the old one's cleanup runs. Pinned here on the pure maths (art/djZoom):
 *   - the opening memory keeps the touch across a step and forgets it at an
 *     opening, in React's real order (render new → clean up old → mount new);
 *   - after any touch, the window is exactly the body's view where the rack
 *     scrolls (the rack's own anchorOffset), so the content is in view;
 *   - the next step opens on the touched (or dragged-to) part, and the pan
 *     limits keep the frame covering the gear's region after a prior pan.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  alignedWindow,
  anchorOf,
  createZoomMemory,
  keepInBox,
  viewportFrom1x,
  regionCentreAt,
  sameFrame,
  scenePointAt,
  stepWindow,
  zoomWindow,
  zoomedXf,
  type SceneView,
} from '../src/screens/lab/dj/art/djZoom.ts';
import { anchorOffset } from '../src/screens/lab/rack/stageFitMath.ts';

// a 390 × 844 phone's full-screen body at 1×: the rack's box is the body less
// 8 a side across and 8 in all down
const BODY_W = 390;
const BODY_H = 615;
const W1 = BODY_W - 16;
const H1 = BODY_H - 8;
const STEPS = [1.5, 2, 3];

/** What the rack's scroll shows of the zoomed box (box coordinates). */
function rackView(z: number, a: { fx: number; fy: number } | null) {
  const w = Math.round(W1 * z);
  const h = Math.round(H1 * z);
  const f = a ?? { fx: 0.5, fy: 0.5 };
  return { w, h, x: anchorOffset(w, BODY_W, f.fx), y: anchorOffset(h, BODY_H, f.fy) };
}

describe('the opening memory (createZoomMemory) in React’s real order', () => {
  it('a step keeps the touch: the new host renders while the old one is still mounted', () => {
    const m = createZoomMemory();
    // opening at 1×
    assert.deepEqual(m.begin(), { anchor: null, at: null });
    m.mounted();
    // the learner taps near the bottom-right
    m.touch({ fx: 0.86, fy: 0.88 }, null);
    // 2×: render the new host FIRST, then the old cleanup, then the new mount
    const step = m.begin();
    m.unmounted();
    m.mounted();
    assert.deepEqual(step.anchor, { fx: 0.86, fy: 0.88 });
    // 3× without a new touch: still the same anchor (the rack keeps it too)
    const step3 = m.begin();
    m.unmounted();
    m.mounted();
    assert.deepEqual(step3.anchor, { fx: 0.86, fy: 0.88 });
  });

  it('closing and opening again starts fresh (the rack forgets its anchor on close)', () => {
    const m = createZoomMemory();
    m.begin();
    m.mounted();
    m.touch({ fx: 0.1, fy: 0.2 }, { x: 5, y: 6, frame: { x: 0, y: 0, w: 10, h: 10 } });
    m.unmounted(); // the full screen closes
    assert.deepEqual(m.begin(), { anchor: null, at: null });
  });

  it('a touch during a step does not move that step’s camera (the carry is a snapshot)', () => {
    const m = createZoomMemory();
    const c = m.begin();
    m.mounted();
    m.touch({ fx: 0.3, fy: 0.3 }, null);
    assert.equal(c.anchor, null);
    assert.deepEqual(m.get().anchor, { fx: 0.3, fy: 0.3 });
  });

  it('a drag’s end replaces the opening part, a later tap outside the gear keeps it', () => {
    const m = createZoomMemory();
    m.begin();
    m.mounted();
    const F = { x: 0, y: 0, w: 100, h: 50 };
    m.dragged({ x: 70, y: 20, frame: F });
    m.touch({ fx: 0.5, fy: 0.9 }, null); // on a pinned plot: no scene part
    assert.deepEqual(m.get().at, { x: 70, y: 20, frame: F });
    m.dragged(null);
    assert.deepEqual(m.get().at, { x: 70, y: 20, frame: F });
  });
});

describe('the zoomed window is where the rack scrolled, after any touch', () => {
  const anchors = [null, { fx: 0, fy: 0 }, { fx: 1, fy: 1 }, { fx: 0.86, fy: 0.88 }, { fx: 0.1, fy: 0.07 }, { fx: 0.7, fy: 0.3 }];
  for (const z of STEPS) {
    for (const a of anchors) {
      it(`${z}× after ${a ? `a touch at (${a.fx}, ${a.fy})` : 'no touch'}: the window covers the visible body`, () => {
        const r = rackView(z, a);
        const win = zoomWindow(r.w, r.h, z, a);
        assert.equal(win.w, BODY_W);
        assert.equal(win.h, BODY_H);
        assert.ok(Math.abs(win.x - r.x) <= 0.5, `x ${win.x} vs rack ${r.x}`);
        assert.ok(Math.abs(win.y - r.y) <= 0.5, `y ${win.y} vs rack ${r.y}`);
        // and inside the box
        assert.ok(win.x >= 0 && win.x + win.w <= r.w + 1e-6);
        assert.ok(win.y >= 0 && win.y + win.h <= r.h + 1e-6);
      });
    }
  }

  it('the bug, measured live: rack at the touch (732, 1206), host at the centre (366, 603) — now equal', () => {
    const a = anchorOf({ x: 330, y: 640 }, { x: 8, y: 107 }, { w: 374, h: 607 })!;
    const r = rackView(3, a);
    // the rack scrolled to the far corner
    assert.equal(Math.round(r.x), 732);
    // the dropped anchor put the window in the middle: 366 pt off, off-screen
    const dropped = zoomWindow(r.w, r.h, 3, null);
    assert.ok(Math.abs(dropped.x - r.x) > 300);
    // carried, it is where the rack is
    const kept = zoomWindow(r.w, r.h, 3, a);
    assert.ok(Math.abs(kept.x - r.x) <= 0.5 && Math.abs(kept.y - r.y) <= 0.5);
  });

  it('the box growing after the scroll (hint line shrinks) keeps the first offset, never past the far edge', () => {
    const a = { fx: 1, fy: 1 };
    const s0 = stepWindow(Math.round(W1 * 2), Math.round((H1 - 16) * 2), 2, a, null);
    const s1 = stepWindow(Math.round(W1 * 2), Math.round(H1 * 2), 2, a, s0.first);
    assert.equal(s1.y, s0.y, 'same scroll, same window offset');
    assert.ok(s1.y + s1.h <= Math.round(H1 * 2));
    const shrunk = stepWindow(500, 500, 2, a, { x: 9999, y: 9999 });
    assert.ok(shrunk.x + shrunk.w <= 500 && shrunk.y + shrunk.h <= 500);
  });
});

describe('the window checked against the real scroll (alignedWindow)', () => {
  // measured live on screen 6 (390 × 844): body at y 106, 519 tall; the 1×
  // box at (8, 110); at 2× the rack had scrolled (358, 473) while the
  // prediction said y 487 — a 14 pt black band along the top
  const vp = viewportFrom1x({ x: 8, y: 110 }, 374);
  it('the 1× box gives the viewport: 8 in, 3 down (the body’s 1 pt border above)', () => {
    assert.deepEqual(vp, { x: 0, y: 107, w1: 374 });
  });
  it('zoomed, the viewport minus the box is the real scroll, and the window goes there', () => {
    const win = { w: 390, h: 519 };
    const a = alignedWindow(vp, { x: -358, y: 107 - 473 }, 748, 1022, 2, win);
    assert.deepEqual(a, { x: 358, y: 473 });
  });
  it('never past the box, never at another width, never before the rack has scrolled', () => {
    const win = { w: 390, h: 519 };
    assert.deepEqual(alignedWindow(vp, { x: -5000, y: -5000 }, 748, 1022, 2, win), { x: 748 - 390, y: 1022 - 519 });
    assert.equal(alignedWindow(vp, { x: -100, y: -100 }, 1600, 1022, 2, win), null, 'the phone turned: another layout');
    assert.equal(alignedWindow(vp, { x: 0, y: 107 }, 748, 1022, 2, win), null, 'still at the corner: not scrolled yet');
    assert.equal(alignedWindow(null, { x: -10, y: -10 }, 748, 1022, 2, win), null);
    assert.deepEqual(keepInBox({ x: 900, y: -4 }, 748, 1022, win), { x: 358, y: 0 });
  });
});

describe('the next step opens on the touched part and the pan limits hold', () => {
  const frame = { x: -200, y: -100, w: 800, h: 320 };
  const region = { x: 0, y: 0, w: BODY_W, h: BODY_H };
  // a FILL scene (screen 4: the frame covers the body at 1×) and a fitted
  // one (a wide drawing in a band: it covers across, and is centred down)
  const FILL = { s: Math.max(BODY_W / frame.w, BODY_H / frame.h) };
  const FIT = { s: (BODY_W - 12) / frame.w };
  let base = FILL;
  const focus = { x: 200, y: 60 };

  const viewAt = (z: number, f: { x: number; y: number }, pan: { x: number; y: number }): SceneView => {
    const { xf } = zoomedXf(base, region, frame, f, z, pan);
    return { xf, region, frame, pan };
  };
  /** The drawing is in view on each axis: covering the region where it is
   *  bigger than it, centred in it where it is smaller (never off to a side). */
  const axisOk = (o: number, s: number, f0: number, fl: number, r0: number, rl: number) => {
    const a = o + f0 * s;
    const b = o + (f0 + fl) * s;
    if (fl * s >= rl - 1e-6) return a <= r0 + 1e-6 && b >= r0 + rl - 1e-6;
    return Math.abs((a + b) / 2 - (r0 + rl / 2)) < 1e-6;
  };
  const covers = (xf: { s: number; ox: number; oy: number }) =>
    axisOk(xf.ox, xf.s, frame.x, frame.w, region.x, region.w) && axisOk(xf.oy, xf.s, frame.y, frame.h, region.y, region.h);

  it('a touch is read as the part under the finger, inside the frame', () => {
    const v = viewAt(2, focus, { x: 0, y: 0 });
    const p = { x: 300, y: 200 };
    const at = scenePointAt(p, v)!;
    assert.ok(Math.abs(v.xf.ox + at.x * v.xf.s - p.x) < 1e-6);
    assert.ok(Math.abs(v.xf.oy + at.y * v.xf.s - p.y) < 1e-6);
    assert.ok(sameFrame(at.frame, frame));
    // outside the gear's region (a pinned plot): no part
    assert.equal(scenePointAt({ x: 10, y: BODY_H + 20 }, v), null);
  });

  it('after a prior pan, the touched part opens mid-region at the next step', () => {
    const v = viewAt(2, focus, { x: -120, y: 40 });
    const at = scenePointAt({ x: 260, y: 300 }, v)!;
    const next = zoomedXf(base, region, frame, at, 3, { x: 0, y: 0 }).xf;
    const px = next.ox + at.x * next.s;
    const py = next.oy + at.y * next.s;
    assert.ok(Math.abs(px - (region.x + region.w / 2)) < 1e-6, `x ${px}`);
    assert.ok(Math.abs(py - (region.y + region.h / 2)) < 1e-6, `y ${py}`);
  });

  it('a drag’s end opens the next step on what the drag brought to the middle', () => {
    const v0 = viewAt(1.8, focus, { x: 0, y: 0 });
    const pan = { x: -150, y: 30 };
    const at = regionCentreAt(v0, pan)!;
    const drawn = zoomedXf(base, region, frame, focus, 1.8, pan).xf;
    assert.ok(Math.abs(drawn.ox + at.x * drawn.s - region.w / 2) < 1e-6);
    assert.ok(Math.abs(drawn.oy + at.y * drawn.s - region.h / 2) < 1e-6);
  });

  it('a touch at the frame’s corner still opens inside the drawing (clamped, no empty band)', () => {
    for (const b of [FILL, FIT]) {
      for (const z of [1, 1.5, 2, 3]) {
        for (const corner of [{ x: frame.x, y: frame.y }, { x: frame.x + frame.w, y: frame.y + frame.h }]) {
          const { xf } = zoomedXf(b, region, frame, corner, z, { x: 0, y: 0 });
          assert.ok(covers(xf), `${b === FILL ? 'fill' : 'fit'} ${z}×`);
        }
      }
    }
  });

  it('with any prior opening point, every clamped drag keeps the frame covering the region', () => {
    const points = [focus, { x: frame.x, y: frame.y }, { x: frame.x + frame.w, y: frame.y + frame.h }, { x: 37, y: -80 }];
    const drags = [
      { x: 0, y: 0 },
      { x: 1e5, y: 0 },
      { x: -1e5, y: 0 },
      { x: 0, y: 1e5 },
      { x: 0, y: -1e5 },
      { x: 333, y: -222 },
    ];
    for (const b of [FILL, FIT]) {
    base = b;
    for (const z of [1, ...STEPS]) {
      for (const f of points) {
        const { limits } = zoomedXf(base, region, frame, f, z, { x: 0, y: 0 });
        assert.ok(limits.minX <= 0 && limits.maxX >= 0 && limits.minY <= 0 && limits.maxY >= 0, 'the opening is inside the limits');
        for (const d of drags) {
          // the host clamps the drag to the Scene's limits, then the Scene draws it
          const pan = { x: Math.max(limits.minX, Math.min(limits.maxX, d.x)), y: Math.max(limits.minY, Math.min(limits.maxY, d.y)) };
          const { xf } = zoomedXf(base, region, frame, f, z, pan);
          assert.ok(covers(xf), `${z}× from (${f.x}, ${f.y}) dragged (${d.x}, ${d.y})`);
          // a drag inside the limits moves the gear one point per point
          const open = zoomedXf(base, region, frame, f, z, { x: 0, y: 0 }).xf;
          assert.ok(Math.abs(xf.ox - open.ox - pan.x) < 1e-6 && Math.abs(xf.oy - open.oy - pan.y) < 1e-6);
        }
      }
    }
    }
    base = FILL;
  });
});
