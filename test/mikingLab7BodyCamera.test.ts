/**
 * Miking Lab 7 group 2 — the body-worn and camera kit (lessons/shared/
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
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { validateLesson, micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { assembly, checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { turnHead } from '../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts';
import { BODY_MOUNTS, BODY_MOUNT_IDS, BREATH_JET, HEADSET_BAND, LAV_BAND, LOOPS, MOVES, SAFETY as BODY_SAFETY, bodyMicReadout, cablePull, fromCorner, inBreathJet, turnImbalanceDb, withHead } from '../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts';
import { SAFETY as BOOM_SAFETY, boomSwing, operatorAt, standBoomRule } from '../src/screens/lab/miking/lessons/shared/broadcast/boomPole.ts';
import { G2_SLOTS } from '../src/screens/lab/miking/lessons/shared/broadcast/broadcastMics.ts';
import { routeProblems, withSends, type RoutingPlan } from '../src/screens/lab/miking/lessons/shared/broadcast/routing.ts';
import { learnerStrings } from './_mikingItemRules.ts';
import { BOOM_ABOVE, BOOM_BELOW, BOOM_SIDE, BOOM_WIDE, CAMMIC_CLOSE, CAMMIC_WIDE, CAM_CLOSE as B4_CLOSE, CAM_WIDE as B4_WIDE, GRIP_CLOSE, GRIP_WIDE } from '../src/screens/lab/miking/lessons/b04BoomCamera/geometry.ts';
import { BOOM_CLOSE as B2_BOOM, BOOM_TWO as B2_BOOM_TWO, CAM_CLOSE as B2_CLOSE, CAM_TWO as B2_TWO } from '../src/screens/lab/miking/lessons/b02NewsAnchor/geometry.ts';

const v3 = (x: number, y: number, z: number) => ({ x, y, z });
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const LIP = v3(0, 0, 0);
const LENS = v3(2500, -80, 0);

describe('the camera frame (cameraFrame.ts)', () => {
  const close = cameraForShot(LENS, LIP, SHOT_PRESETS.close);
  const wide = cameraForShot(LENS, LIP, SHOT_PRESETS.wide);
  it('a camera in front of the talker looks along −x; its axes are unit and square; its right is the talker’s left', () => {
    const { fwd, right, up } = cameraAxes(close);
    for (const a of [fwd, right, up]) assert.ok(Math.abs(Math.hypot(a.x, a.y, a.z) - 1) < 1e-9);
    assert.ok(Math.abs(fwd.x * right.x + fwd.y * right.y + fwd.z * right.z) < 1e-9);
    assert.ok(Math.abs(fwd.x * up.x + fwd.y * up.y + fwd.z * up.z) < 1e-9);
    assert.ok(fwd.x < -0.99);
    assert.ok(right.z < -0.99, 'the operator’s right is −z');
    assert.ok(up.y < -0.9, 'the picture’s top is up (−y)');
  });
  it('the preset’s edges cross the talker’s plane exactly where the preset says', () => {
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
  it('agrees with the location kit’s frame for the same shot (a camera looking along −x)', () => {
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
  it('a point on an edge ray is on the frame’s boundary', () => {
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

describe('the body-worn family (bodyWorn.ts)', () => {
  it('every chest mount point falls inside the researched lav band (D-LAV1: 12.5–25 cm from the lips)', () => {
    for (const id of BODY_MOUNT_IDS) {
      const m = BODY_MOUNTS[id];
      if (m.rides !== 'chest') continue;
      const d = dist(m.at, LIP);
      assert.ok(d >= LAV_BAND.min && d <= LAV_BAND.max, `${id}: ${d.toFixed(0)} mm`);
      assert.ok(m.at.y > 0, `${id} is below the mouth`);
    }
  });
  it('the headset capsule sits 20–30 mm from the corner of the mouth, out of the breath jet', () => {
    const h = BODY_MOUNTS.headset.at;
    const c = fromCorner(h);
    assert.ok(c >= HEADSET_BAND.min && c <= HEADSET_BAND.max, `${c.toFixed(1)} mm`);
    assert.equal(inBreathJet(h), false);
    assert.equal(inBreathJet(v3(30, 0, 0)), true, 'straight in front of the lips is in the jet');
    assert.equal(inBreathJet(v3(BREATH_JET.reach + 10, 0, 0)), false, 'past its reach');
  });
  it('a head-worn point turns with the head exactly as the mouth does (withHead = turnHead at the lips)', () => {
    for (const [y, p] of [[30, 0], [-45, -15], [60, 10]] as const) {
      const t = turnHead(y, p);
      const m = withHead(LIP, y, p);
      assert.ok(dist(m, t.mouth) < 1e-9, `${y}/${p}`);
    }
  });
  it('chest versus head: a headset keeps its distance through any turn; a chest lav does not', () => {
    const hs = BODY_MOUNTS.headset.at;
    const lav = BODY_MOUNTS.sternum.at;
    for (const [y, p] of [[45, 0], [-45, 0], [0, -20], [60, 10]] as const) {
      const a = bodyMicReadout(hs, 'head', y, p);
      assert.ok(Math.abs(a.d - a.d0) < 1e-6 && Math.abs(a.distDb) < 1e-6, `headset ${y}/${p}`);
      const b = bodyMicReadout(lav, 'chest', y, p);
      assert.ok(Math.abs(b.d - b.d0) > 1, `lav ${y}/${p}`);
    }
  });
  it('a centred lav reads a turn either way alike; a lapel lav does not', () => {
    assert.ok(turnImbalanceDb(BODY_MOUNTS.sternum.at, 'chest') < 1e-9);
    assert.ok(turnImbalanceDb(BODY_MOUNTS.lapel.at, 'chest') > 0.3);
  });
  it('the loops: no loop passes the whole move to the capsule; the broadcast loop takes its spare first; the taped loop stops it before the clip', () => {
    const sit = MOVES.sit.mm;
    assert.equal(cablePull(sit, { broadcast: false, secondary: false }).atCapsule, sit);
    assert.equal(cablePull(sit, { broadcast: true, secondary: false }).atCapsule, Math.max(0, sit - LOOPS.broadcast.mm));
    const both = cablePull(MOVES.gesture.mm, { broadcast: true, secondary: true });
    assert.equal(both.atCapsule, 0);
    assert.equal(both.atClip, 0);
    assert.equal(cablePull(0, { broadcast: false, secondary: false }).atCapsule, 0, 'standing still pulls nothing');
  });
  it('the safety words say the exact rules', () => {
    assert.match(BODY_SAFETY.phantom, /48 V/);
    assert.match(BODY_SAFETY.phantom, /specified adapter/);
    assert.match(BODY_SAFETY.skin, /made for skin/);
    assert.match(BODY_SAFETY.consent, /Ask the wearer first/);
    assert.match(BOOM_SAFETY.overPeople, /above people/);
    assert.match(BOOM_SAFETY.rigged, /qualified crew/);
    assert.match(BOOM_SAFETY.powerLines, /power lines/);
  });
});

describe('the boom (boomPole.ts) and the group 2 mic types', () => {
  it('the operator stands behind the grip, away from the mic; the fixed stand’s arm runs along its one direction', () => {
    const feet = operatorAt(GRIP_CLOSE, BOOM_ABOVE.p, 1550);
    assert.ok(dist(v3(feet.x, 0, feet.z), v3(BOOM_ABOVE.p.x, 0, BOOM_ABOVE.p.z)) > dist(v3(GRIP_CLOSE.x, 0, GRIP_CLOSE.z), v3(BOOM_ABOVE.p.x, 0, BOOM_ABOVE.p.z)));
    const r = standBoomRule(v3(0, 0, -2));
    assert.ok(r.fixed && r.boom === 'level' && Math.abs(r.fallback.z + 1) < 1e-9);
  });
  it('the boom swing between two mouths is the angle between the two aims', () => {
    assert.ok(Math.abs(boomSwing(v3(0, -1000, 0), v3(-1000, 0, 0), v3(1000, 0, 0)) - 90) < 1e-9);
  });
  it('every group 2 slot resolves to a mic type; the camera mic clips to a shoe, the lavs and headsets to clips', () => {
    for (const id of Object.values(G2_SLOTS)) assert.ok(MIC_TYPES[id], id);
    assert.equal(MIC_TYPES.camMic.mount, 'clip');
    assert.equal(MIC_TYPES.compactHyper.mount, 'stand');
    assert.equal(MIC_TYPES.lavCard.mount, 'clip');
    assert.equal(MIC_TYPES.hsCard.mount, 'clip');
    assert.equal(MIC_TYPES.bcBoundaryDesk.surfacePartId, 'bc.desk');
  });
  it('one talker through two open mics into one feed is caught (doubleMic); muting one clears it', () => {
    const plan: RoutingPlan = {
      sources: [
        { id: 'hs', label: 'headset', short: 'H', kind: 'mic', level: 'mic', talker: 'p' },
        { id: 'lec', label: 'lectern', short: 'L', kind: 'mic', level: 'mic', talker: 'p' },
        { id: 'g', label: 'guest', short: 'G', kind: 'mic', level: 'mic', talker: 'g' },
      ],
      dests: ['pa', 'stream'],
      sends: { hs: ['pa', 'stream'], lec: [], g: ['pa', 'stream'] },
      openMics: ['hs', 'lec', 'g'],
    };
    assert.deepEqual(routeProblems(plan), []);
    const both = routeProblems(withSends(plan, 'lec', ['stream']));
    assert.deepEqual(both, [{ code: 'doubleMic', dest: 'stream', talker: 'p', a: 'hs', b: 'lec' }]);
  });
});

describe('Lab 7 group 2 lessons: B05, B04, B02', () => {
  const IDS = ['B05', 'B04', 'B02'];
  it('ready lessons of the broadcast lab, in one contiguous block after group 1', () => {
    const ids = lessonsOf('broadcast').map((l) => l.id);
    for (const id of IDS) assert.ok(ids.includes(id), id);
    const at = LESSONS.findIndex((l) => l.id === 'B05');
    assert.deepEqual(LESSONS.slice(at, at + 3).map((l) => l.id), IDS);
  });
  for (const id of IDS) {
    const l = lessonById(id)!;
    const variantsOf = (z: (typeof l.zones)[number]) => (z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? l.model.variants.map((v) => v.id));
    it(`${id}: validates; every start is inside its zone and clear in every variant it is offered in`, () => {
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      for (const z of l.zones) {
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        if (t.mount === 'surface') continue;
        for (const v of variantsOf(z)) {
          const scene = compileScene(l.model, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null, `${z.id} in ${v}`);
          assert.ok(inZone(z, { scene, surfaces: l.model.surfaces, lines: l.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} in ${v}`);
        }
      }
    });
    it(`${id}: every clip reaches its mic from its grip (clips, poles, the shoe, the ear, the base)`, () => {
      for (const z of l.zones) {
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        if (t.mount !== 'clip') continue;
        for (const v of variantsOf(z)) {
          const arm = assembly(compileScene(l.model, v), z.start, micBodyOf(t)).find((q) => q.piece === 'arm');
          assert.ok(arm, `${z.id} in ${v}: no grip`);
          assert.ok(dist(arm!.a, arm!.b) <= t.clip!.reach.mm, `${z.id} in ${v}: ${dist(arm!.a, arm!.b).toFixed(0)} mm`);
        }
      }
    });
    it(`${id}: the context exercise can put its target in a null by the learner’s aim or pattern`, () => {
      const X = copyOf(l).context;
      const z = l.zones.find((q) => q.id === X.zone)!;
      const w = l.live.wedges.find((q) => q.id === X.target)!;
      const src = v3(w.p.x, w.p.y - w.lift, w.p.z);
      let ok = false;
      for (const p of X.patterns) for (let da = -X.azMax; da <= X.azMax && !ok; da += 2) for (let de = -X.elMax; de <= X.elMax && !ok; de += 2) if (nearNull(p.id, arrivalAngle({ ...z.start, az: z.start.az + da, el: z.start.el + de }, src), 15)) ok = true;
      assert.ok(ok);
    });
    it(`${id}: no institutional words, no brand, the starting-points voice, no link to an unbuilt lesson, 3:1 never graded`, () => {
      const strings = learnerStrings(l);
      for (const s of strings) assert.doesNotMatch(s, /\b(student|classroom|instructor|Pro Audio Training Academy)\b/i);
      assert.ok(strings.some((s) => /After our research, here is where we suggest you begin/.test(s)));
      assert.ok(strings.some((s) => /Experimentation is encouraged/.test(s)));
      for (const s of strings.filter((q) => q !== id)) assert.doesNotMatch(s, /\b(B0[1-8]|B1\d|F1[0-6]|F0\d)\b/);
      for (const t of l.setupTasks) for (const r of t.reasons) if (/3:1/.test(r.label)) assert.equal(r.role, 'wrong');
      // The voice family's words are the singer's: none may leak into a talker's lesson.
      for (const s of [...strings, ...learnerStrings(copyOf(l).context), ...learnerStrings(copyOf(l).placement), ...learnerStrings(copyOf(l).terms)]) assert.doesNotMatch(s, /\b(singers?|band|song)\b/i, s.slice(0, 80));
    });
  }
  it('B05: lav starts in the researched band, the headset by the mouth corner; B05-1 — no attributed “5–8 in” on screen', () => {
    const l = lessonById('B05')!;
    for (const id of ['b5.sternum', 'b5.lapel', 'b5.concealed', 'b5.lavCard']) {
      const z = l.zones.find((q) => q.id === id)!;
      assert.deepEqual(z.distance, { min: 125, max: 250 });
      const d = dist(z.start.p, LIP);
      assert.ok(d >= 125 && d <= 250, id);
    }
    const hs = l.zones.find((q) => q.id === 'b5.headset')!;
    const c = fromCorner(hs.start.p);
    assert.ok(c >= 20 && c <= 30, `${c}`);
    const all = learnerStrings(l).join(' ');
    assert.doesNotMatch(all, /5\s*[–-]\s*8\s*in/);
    assert.match(all, /adhesive made for skin/);
    assert.match(all, /phantom/);
    assert.match(all, /agreement/);
  });
  it('B04: every boom start sits 15 cm outside its frame; the wide shot pushes the boom farther; the camera mic moves back with the camera', () => {
    for (const [b, cam] of [[BOOM_ABOVE, B4_CLOSE], [BOOM_BELOW, B4_CLOSE], [BOOM_SIDE, B4_CLOSE], [BOOM_WIDE, B4_WIDE]] as const) {
      assert.ok(b.ok && frameClearance(cam, b.p) >= 150 - 1e-6);
    }
    assert.ok(BOOM_WIDE.d > BOOM_ABOVE.d);
    assert.ok(dist(CAMMIC_WIDE.p, LIP) > dist(CAMMIC_CLOSE.p, LIP) + 1000);
    assert.ok(outsideFrame(B4_CLOSE, CAMMIC_CLOSE.p) && outsideFrame(B4_WIDE, CAMMIC_WIDE.p));
    // The pole from the operator’s hands to the boom’s tail stays out of the shot.
    const tail = (b: { p: { x: number; y: number; z: number }; aim: { x: number; y: number; z: number } }) => v3(b.p.x - b.aim.x * 250, b.p.y - b.aim.y * 250, b.p.z - b.aim.z * 250);
    assert.ok(segmentClearance(B4_CLOSE, GRIP_CLOSE, tail(BOOM_ABOVE)) > 0);
    assert.ok(segmentClearance(B4_WIDE, GRIP_WIDE, tail(BOOM_WIDE)) > 0);
    const l = lessonById('B04')!;
    assert.doesNotMatch(learnerStrings(l).join(' '), /four to five times/i, 'D-SG1 is never shown');
  });
  it('B02: the fixed boom’s tube tip keeps 15 cm clear of the frame; its capsule is read the tube’s length farther; the two-shot pushes it back', () => {
    assert.ok(frameClearance(B2_CLOSE, B2_BOOM.tip) >= 150 - 1e-6);
    assert.ok(frameClearance(B2_TWO, B2_BOOM_TWO.tip) >= 150 - 1e-6);
    assert.ok(Math.abs(dist(B2_BOOM.p, B2_BOOM.tip) - 200) < 1e-6);
    assert.ok(B2_BOOM_TWO.d > B2_BOOM.d);
    const l = lessonById('B02')!;
    const stand = assembly(compileScene(l.model, 'twoShot'), l.zones.find((z) => z.id === 'b2.boom.two')!.start, micBodyOf(MIC_TYPES.shotgunShort)).find((q) => q.piece === 'stand');
    assert.ok(stand, 'the fixed boom has a stand');
    assert.ok(segmentClearance(B2_TWO, stand!.a, stand!.b) > 0, 'the stand stays out of the two-shot');
  });
  it('the setups by variant: one mic, the pairs, the live and the farther starts', () => {
    const roles = (id: string, v: string) => startingSetups(lessonById(id)!, v, MIC_TYPES).map((s) => s.role);
    assert.deepEqual(roles('B05', 'studio'), ['one', 'close', 'more', 'more', 'more']);
    assert.deepEqual(roles('B05', 'live'), ['one', 'pair', 'close', 'more']);
    assert.deepEqual(roles('B04', 'close'), ['one', 'pair', 'distant', 'more', 'more', 'more']);
    assert.deepEqual(roles('B04', 'wide'), ['one', 'distant', 'more']);
    assert.deepEqual(roles('B02', 'close'), ['one', 'pair', 'close', 'distant', 'more']);
    assert.deepEqual(roles('B02', 'public'), ['one', 'close', 'more', 'more']);
  });
});
