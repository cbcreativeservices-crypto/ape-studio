/**
 * Miking Lab 7 group 2 â€” the body-worn and camera kit (lessons/shared/
 * broadcast/: cameraFrame, boomPole, bodyWorn, the group 2 mic types) and the
 * lessons built on it (B05, B04, B02). Real relationships, not re-runs of the
 * implementation: the frame is a pyramid from the lens (a point on an edge
 * ray is on the boundary; the lens axis is deep inside); a boom start is the
 * nearest point on its line that clears the frame; a wider shot pushes it
 * farther; a mic on the camera moves with it.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CAMERA_ASPECT,
  SHOT_PRESETS,
  boomAbove,
  boomBelow,
  boomOutside,
  boomSide,
  cameraAxes,
  cameraForShot,
  cameraLooking,
  cameraMic,
  frameClearance,
  frameCoords,
  frameEdgeRays,
  frameHalfExtents,
  headroomFan,
  hFovDeg,
  inShot,
  outsideFrame,
  segmentClearance,
  sideFan,
  toLocationFrame,
  towardCamera,
} from '../src/screens/lab/miking/lessons/shared/broadcast/cameraFrame.ts';
import { inFrame } from '../src/screens/lab/miking/lessons/shared/field/location.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';

const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const LIP = v3(0, 0, 0);
const LENS = v3(2500, -80, 0);

describe('the camera frame (cameraFrame.ts)', () => {
  const close = cameraForShot(LENS, LIP, SHOT_PRESETS.close);
  const wide = cameraForShot(LENS, LIP, SHOT_PRESETS.wide);
  it('a camera in front of the talker looks along âˆ’x; its axes are unit and square; its right is the talkerâ€™s left', () => {
    const { fwd, right, up } = cameraAxes(close);
    for (const a of [fwd, right, up]) assert.ok(Math.abs(Math.hypot(a.x, a.y, a.z) - 1) < 1e-9);
    assert.ok(Math.abs(fwd.x * right.x + fwd.y * right.y + fwd.z * right.z) < 1e-9);
    assert.ok(Math.abs(fwd.x * up.x + fwd.y * up.y + fwd.z * up.z) < 1e-9);
    assert.ok(fwd.x < -0.99);
    assert.ok(right.z < -0.99, 'the operatorâ€™s right is âˆ’z');
    assert.ok(up.y < -0.9, 'the pictureâ€™s top is up (âˆ’y)');
  });
  it('the presetâ€™s edges cross the talkerâ€™s plane exactly where the preset says', () => {
    for (const cam of [close, wide]) {
      const s = cam === close ? SHOT_PRESETS.close : SHOT_PRESETS.wide;
      assert.ok(Math.abs(frameClearance(cam, v3(0, s.top, 0))) < 1e-6, 'the top edge');
      assert.ok(Math.abs(frameClearance(cam, v3(0, s.bottom, 0))) < 1e-6, 'the bottom edge');
      const lf = toLocationFrame(cam);
      assert.ok(Math.abs(lf.top - s.top) < 1e-6 && Math.abs(lf.bottom - s.bottom) < 1e-6);
    }
    assert.ok(Math.abs(hFovDeg(close) - (2 * Math.atan(Math.tan((close.vFovDeg * Math.PI) / 360) * CAMERA_ASPECT) * 180) / Math.PI) < 1e-9);
    assert.ok(wide.vFovDeg > close.vFovDeg);
  });
  it('the lips are in both shots; a point well above the head is in neither; behind the lens is never in the picture', () => {
    assert.ok(inShot(close, LIP) && inShot(wide, LIP));
    assert.ok(outsideFrame(close, v3(0, -700, 0)) && outsideFrame(wide, v3(0, -700, 0)));
    assert.equal(frameClearance(close, v3(2600, -80, 0)), Infinity);
  });
  it('agrees with the location kitâ€™s frame for the same shot (a camera looking along âˆ’x)', () => {
    const lf = toLocationFrame(close);
    for (const p of [v3(0, 0, 0), v3(400, -350, 0), v3(800, 300, 200), v3(300, -150, 700), v3(1200, 100, -50)]) {
      // Half-width is the location kit's constant-per-plane simplification:
      // compare only in the camera's vertical plane.
      if (p.z !== 0) continue;
      assert.equal(inShot(close, p), inFrame(lf, p), JSON.stringify(p));
    }
  });
  it('the frame half extents grow with distance at the aspect', () => {
    const a = frameHalfExtents(close, 1000);
    const b = frameHalfExtents(close, 2000);
    assert.ok(Math.abs(b.halfW / a.halfW - 2) < 1e-9 && Math.abs(a.halfW / a.halfH - CAMERA_ASPECT) < 1e-9);
  });
  it('a point on an edge ray is on the frameâ€™s boundary', () => {
    for (const view of ['side', 'top'] as const) {
      for (const e of frameEdgeRays(close, view, 2000)) {
        const mid = v3((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2, (e.a.z + e.b.z) / 2);
        assert.ok(Math.abs(frameClearance(close, mid)) < 1e-6, `${view} ${e.edge}`);
      }
    }
  });
  it('the boom above: the nearest point on its line that clears the frame by the margin; a wider shot pushes it farther', () => {
    const b = boomAbove(close, LIP, { clearance: 150 });
    assert.ok(b.ok && frameClearance(close, b.p) >= 150);
    const back = v3(b.p.x - (b.p.x / b.d) * 5, b.p.y - (b.p.y / b.d) * 5, b.p.z - (b.p.z / b.d) * 5);
    assert.ok(frameClearance(close, back) < 150, '5 mm nearer would not clear');
    assert.ok(b.p.y < 0 && b.p.x > 0, 'above the mouth and in front of it');
    assert.ok(Math.abs(dist(b.p, LIP) - b.d) < 1e-6);
    assert.ok(Math.abs(b.aim.x * b.p.x + b.aim.y * b.p.y + b.aim.z * b.p.z + b.d) < 1e-6, 'aimed back at the mouth');
    const w = boomAbove(wide, LIP, { clearance: 150 });
    assert.ok(w.d > b.d, 'the wide shot pushes the boom farther');
  });
  it('below and beside the frame clear it too; nothing clears on a line straight at the lens', () => {
    const lo = boomBelow(close, LIP);
    assert.ok(lo.ok && lo.p.y > 0 && frameClearance(close, lo.p) >= 150);
    const sd = boomSide(close, LIP, { side: -1 });
    assert.ok(sd.ok && sd.p.z < 0 && frameClearance(close, sd.p) >= 150);
    const at = boomOutside(close, LIP, towardCamera(close, LIP, 0), 150, 60, 2000);
    assert.equal(at.ok, false);
  });
  it('a pole through the picture is caught along its length, not only at its tip', () => {
    const b = boomAbove(close, LIP);
    assert.ok(segmentClearance(close, b.p, v3(b.p.x, b.p.y - 300, -1500)) >= 0);
    assert.ok(segmentClearance(close, v3(600, -500, -1000), v3(600, -500, 1000)) < 0 === inShot(close, v3(600, -500, 0)));
  });
  it('a mic on the camera moves with the camera and points where the lens points', () => {
    const m1 = cameraMic(close);
    const far = cameraForShot(v3(4500, -80, 0), LIP, SHOT_PRESETS.close);
    const m2 = cameraMic(far);
    assert.ok(Math.abs(m2.p.x - m1.p.x - 2000) < 5, 'moved back with the camera');
    assert.ok(dist(m2.p, LIP) > dist(m1.p, LIP) + 1900);
    assert.ok(outsideFrame(close, m1.p), 'on the camera, out of its own picture');
    assert.ok(m1.aim.x < -0.99);
  });
  it('the keep-outs: a point in the headroom is inside the headroom fan; the lips and the sternum are not', () => {
    const top = v3(-87, -173, 0);
    const fan = headroomFan(close, top);
    assert.ok(sdf(fan, v3(300, -230, 0)) < 0, 'in the shot above the head');
    assert.ok(sdf(fan, LIP) > 0 && sdf(fan, v3(13, 200, 0)) > 0);
    assert.ok(sdf(fan, boomAbove(close, LIP).p) > 0, 'the boom start is outside it');
    const right = sideFan(close, LIP, 1);
    assert.ok(sdf(right, v3(300, 0, 420)) < 0 && sdf(right, v3(300, 0, -420)) > 0 && sdf(right, LIP) > 0);
  });
  it('a camera aimed at a target looks straight at it (the target is on the axis)', () => {
    const cam = cameraLooking(v3(2000, -300, 900), v3(0, 0, 0), 30);
    const c = frameCoords(cam, LIP);
    assert.ok(Math.abs(c.aDeg) < 1e-6 && Math.abs(c.uDeg) < 1e-6 && c.f > 0);
  });
});
