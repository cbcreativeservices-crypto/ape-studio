/**
 * Lab 6 (Foley, Field & Scientific), group 1 — THE FOLEY STAGE: the shared
 * Foley family (lessons/shared/foley, frame F), the field mics (lessons/
 * shared/fieldmics), the engine additions (the 'pole' mount, a body that
 * reaches ahead of its reference point, the shotgun's simplified lobe, the
 * hydrophone / contact transducers, the scaled rounding tier) and the four
 * lessons F01 FOOTSTEPS, F02 CLOTHING, F03 PROPS, F04 IMPACTS & LIQUIDS —
 * checked as RELATIONSHIPS:
 *
 *   • frame F converts to frame S and back; the pit is the sourced 1.2 × 1 m
 *     (above the 0.8 m² minimum), its layers fill its depth;
 *   • the shotgun: the capsule is the reference point (the tube reaches 200
 *     mm ahead and is tested for collision); below the tube's transition the
 *     lobe is the supercardioid, above it narrower, never wider;
 *   • the pole: the operator's hands at chest height, the operator's body in
 *     the collision assembly — an operator standing in a keep-out is stopped;
 *   • every lesson validates, serves the journey, follows the item rules,
 *     names no research source; every start is clear of every keep-out (the
 *     motion, the gesture, the swing and pinch points, the splash) and in its
 *     own zone; STARTING SETUPS has a ONE MIC in every variant;
 *   • the sourced numbers stay sourced: 3–6 ft and "about 15°" (F01), 1–1.5 m
 *     and up to 3 m (F02); the drawing defaults stay placeholders;
 *   • the registry: the field lab is ready with its blurbs, no lab total is
 *     hard-coded.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, MIKING_LABS, lessonsOf, readyLabs } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { assembly, checkAssembly, compileScene, POLE_HANDS_H, POLE_LEN } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { gain } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { halfWidthDeg, shotgunLobe, tubeTransitionHz } from '../src/screens/lab/miking/engine/physics/shotgun.ts';
import { fmtLenScaled, roundScaled, scaleStep } from '../src/screens/lab/miking/engine/model/units.ts';
import { fromFrameS, offFront, poseAround, toFrameS } from '../src/screens/lab/miking/lessons/shared/foley/frameF.ts';
import { layerDepth, PIT, PIT_AREA_M2, STAGE_DIMS, SURFACES } from '../src/screens/lab/miking/lessons/shared/foley/stage.ts';
import { PERFORMER_DIMS } from '../src/screens/lab/miking/lessons/shared/foley/performer.ts';
import { DOOR, splashRadius, PROP_DIMS } from '../src/screens/lab/miking/lessons/shared/foley/propGeom.ts';
import { MEDIA } from '../src/screens/lab/miking/lessons/shared/foley/medium.ts';
import { FIELD_MIC_TYPES, SHOTGUN_SHORT } from '../src/screens/lab/miking/lessons/shared/fieldmics/fieldMics.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { itemRules, learnerStrings } from './_mikingItemRules.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const IDS = ['F01', 'F02', 'F03', 'F04'];
const L = (id: string): Lesson => lessonById(id)!;
const RESEARCH = /\b(Rode|RØDE|Rycote|KMR|NTG|CMIT|TLM|U67|Schoeps|SCHOEPS|Foley First|NoiseFloor|Krotos|Hensley|Hecker|Roesch|Malcolm|Valasis|Hayes|Sound Devices|Warner|Shure|Sennheiser|Neumann|DPA|NIOSH)\b/;

describe('frame F and the Foley stage (lessons/shared/foley)', () => {
  it('frame F turns into frame S and back (the stereo-array tool drops in)', () => {
    const p = { x: 1234, y: -567, z: -89 };
    assert.deepEqual(fromFrameS(toFrameS(p)), p);
    // In front of the walker (+x_F) is toward the recordist (+z_S).
    assert.deepEqual(toFrameS({ x: 1000, y: 0, z: 0 }), { x: -0, y: 0, z: 1000 });
  });
  it('the pit: the sourced 1.2 × 1 m with a 100 mm rim, above the 0.8 m² minimum; every surface fills its depth', () => {
    assert.equal(STAGE_DIMS.pitAcross.mm, 1200);
    assert.equal(STAGE_DIMS.pitDeep.mm, 1000);
    assert.equal(STAGE_DIMS.rim.mm, 100);
    assert.equal(STAGE_DIMS.pitAcross.prov.kind, 'sourced');
    assert.ok(PIT_AREA_M2 >= STAGE_DIMS.minArea.mm);
    assert.ok(STAGE_DIMS.depth.placeholder && STAGE_DIMS.depth.mm >= 50 && STAGE_DIMS.depth.mm <= 1000, 'inside FF-PIT’s 50 mm – 1 m');
    for (const s of Object.values(SURFACES)) assert.equal(layerDepth(s), PIT.depth, s.id);
    assert.ok(SURFACES.carpetOver.layers.some((l) => l.kind === 'board'), 'a carpet always lies on something');
    assert.ok(SURFACES.woodPanel.hollow && SURFACES.woodPanel.layers.some((l) => l.kind === 'void'));
  });
  it('the performer’s keep-outs are drawing defaults (no source gives a clearance)', () => {
    for (const d of Object.values(PERFORMER_DIMS)) assert.ok(d.placeholder && d.prov.kind === 'unknown');
  });
  it('poseAround puts a start at the bearing and elevation it names', () => {
    const p = poseAround({ x: 0, y: 0, z: 0 }, 1400, 15, 50);
    assert.ok(Math.abs(Math.hypot(p.p.x, p.p.y, p.p.z) - 1400) < 1);
    assert.ok(Math.abs((Math.atan2(p.p.z, p.p.x) * 180) / Math.PI - 15) < 0.1);
    assert.ok(Math.abs(offFront({ x: 0, y: 0, z: 0 }, p.p) - (Math.acos(Math.cos((50 * Math.PI) / 180) * Math.cos((15 * Math.PI) / 180)) * 180) / Math.PI) < 0.1);
  });
});

describe('the field mics and the engine additions', () => {
  it('the short shotgun: its capsule is the reference point; the tube reaches ahead and is in the collision assembly', () => {
    assert.equal(SHOTGUN_SHORT.body.fore!.mm, 200);
    assert.equal(SHOTGUN_SHORT.body.length.mm + SHOTGUN_SHORT.body.fore!.mm, 250, 'Ø 19 × 250 mm overall');
    assert.equal(SHOTGUN_SHORT.lobe, 'shotgun');
    const m = L('F01').model;
    const sc = compileScene(m, 'tile');
    const body = micBodyOf(SHOTGUN_SHORT);
    // A capsule 150 mm outside the motion envelope's front face (x = 600), aimed straight back at it:
    const pose = { p: { x: 760, y: -500, z: 0 }, az: 0, el: 0 };
    const seg = assembly(sc, pose, body)[0];
    assert.ok(seg.a.x < 760 - 150, 'the body segment starts ahead of the capsule');
    assert.equal(checkAssembly(sc, pose, body)?.partId, 'env.motion', 'the tube reaches into the movement');
    assert.equal(checkAssembly(sc, pose, { ...body, fore: 0 }), null, 'a body ending at the capsule would not');
  });
  it('the shotgun lobe: the supercardioid below the tube’s transition, narrower above, never wider', () => {
    for (const t of [0, 30, 60, 90, 125, 150, 180]) assert.ok(Math.abs(shotgunLobe(t, 'low') - Math.abs(gain('supercardioid', t))) < 1e-12);
    for (let t = 0; t <= 180; t += 5) assert.ok(shotgunLobe(t, 'high') <= shotgunLobe(t, 'low') + 1e-12, `${t}°`);
    assert.ok(halfWidthDeg('high') < halfWidthDeg('low'));
    assert.ok(Math.abs(tubeTransitionHz() - 343.21 / 0.2) < 1e-9, 'c / L for the 200 mm drawing default');
  });
  it('the hydrophone and the contact sensor are their own transducers, with no drawn pattern, and no lesson places them', () => {
    assert.equal(FIELD_MIC_TYPES.hydrophone.transducer, 'hydrophone');
    assert.equal(FIELD_MIC_TYPES.contactSensor.transducer, 'contact');
    for (const t of [FIELD_MIC_TYPES.hydrophone, FIELD_MIC_TYPES.contactSensor]) assert.deepEqual(t.patterns.map((p) => p.id), ['unstated']);
    for (const id of IDS) assert.ok(!L(id).micTypeIds.some((t) => t === 'hydrophone' || t === 'contactSensor'), id);
    assert.deepEqual(MEDIA.map((m) => m.id), ['air', 'water', 'structure']);
    assert.match(MEDIA.find((m) => m.id === 'water')!.care, /never an ordinary mic/);
  });
  it('the POLE mount: the pole to the operator’s hands at chest height, the operator in the assembly', () => {
    const lesson = L('F02');
    const z = lesson.zones.find((q) => q.id === 'f02.boom')!;
    const sc = compileScene(lesson.model, 'worn');
    const body = micBodyOf(MIC_TYPES.shotgunPole);
    assert.equal(body.mount, 'pole');
    const segs = assembly(sc, z.start, body);
    const pole = segs.find((s) => s.piece === 'boom')!;
    const op = segs.find((s) => s.piece === 'stand')!;
    assert.ok(Math.abs(Math.hypot(pole.b.x - pole.a.x, pole.b.y - pole.a.y, pole.b.z - pole.a.z) - POLE_LEN) < 1e-6, 'a 2 m pole');
    assert.ok(Math.abs(pole.b.y - (sc.yFloor - POLE_HANDS_H)) < 1e-6, 'the hands at chest height');
    assert.ok(op.a.x > pole.b.x, 'the operator stands behind the hands, away from the mic');
    assert.equal(checkAssembly(sc, z.start, body), null, 'clear at its start');
    // Aimed away from the action, the pole runs back over the performer: the operator would stand in their body.
    const behind = { p: { x: 2400, y: -200, z: 0 }, az: 180, el: 0 };
    assert.notEqual(checkAssembly(sc, behind, body), null);
  });
  it('the scaled rounding tier: 10 mm below 1 m, 50 mm to 10 m, 0.1 m to 100 m, then 1 m', () => {
    assert.deepEqual([scaleStep(999), scaleStep(1000), scaleStep(9999), scaleStep(10000), scaleStep(100000)], [10, 50, 50, 100, 1000]);
    assert.equal(roundScaled(864), 860);
    assert.equal(roundScaled(1376), 1400);
    assert.equal(roundScaled(35049), 35000);
    assert.equal(roundScaled(-3), 0);
    assert.equal(fmtLenScaled(1376), '≈ 1.4 m (4.6 ft)');
    assert.equal(fmtLenScaled(864), '≈ 86 cm (33.9 in)');
  });
});

describe('the four Foley lessons', () => {
  for (const id of IDS) {
    it(`${id}: validates, serves the journey, follows the item rules, names no research source`, () => {
      const l = L(id);
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      assertJourneyPages(l);
      itemRules(l);
      const text = learnerStrings(l).join('\n');
      assert.doesNotMatch(text, RESEARCH);
      assert.doesNotMatch(text, /\b(classroom|students?|instructor|academy|course)\b/i);
      assert.match(l.accuracyDetail, /suggest/);
      assert.match(l.accuracyDetail, /your ears and the room/);
      assert.match(l.accuracyDetail, /Experimentation is encouraged/);
      assert.equal(l.labId, 'field');
    });
    it(`${id}: every start is clear of every part and keep-out, inside its own zone; ONE MIC in every variant`, () => {
      const l = L(id);
      for (const z of l.zones) {
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        for (const v of z.requires!.variants!) {
          const sc = compileScene(l.model, v);
          assert.equal(checkAssembly(sc, z.start, micBodyOf(t)), null, `${z.id} in ${v}`);
          assert.ok(inZone(z, { scene: sc, surfaces: l.model.surfaces, lines: l.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} in ${v}`);
        }
      }
      for (const v of l.model.variants) {
        const s = startingSetups(l, v.id, MIC_TYPES);
        assert.equal(s[0]?.role, 'one', `${id} ${v.id}`);
        assert.ok(s.every((x) => x.mics.every((m) => l.micTypeIds.includes(m.typeId))));
      }
    });
  }
  it('F01: the sourced 3–6 ft "about 15°" start is the worked example; the 0.8–1.0 m trial is the close one', () => {
    const z = L('F01').zones;
    const r = z.find((q) => q.id === 'f01.roesch')!;
    assert.ok(Math.abs(r.distance.min - 914.4) < 1e-6 && Math.abs(r.distance.max - 1828.8) < 1e-6, '3–6 ft');
    assert.ok(Math.abs((Math.atan2(r.start.p.z, r.start.p.x) * 180) / Math.PI - 15) < 0.5, 'about 15° off the walker’s front line in plan (O-4)');
    const c = z.find((q) => q.id === 'f01.close')!;
    assert.deepEqual([c.distance.min, c.distance.max], [800, 1000]);
    assert.equal(c.kind, 'trial');
    assert.deepEqual(z.find((q) => q.id === 'f01.mid')!.distance, { min: 1500, max: 2000 });
    for (const v of ['tile', 'wood', 'gravel', 'carpet']) assert.equal(startingSetups(L('F01'), v, MIC_TYPES)[1].role, 'pair', 'close + room');
  });
  it('F02: 1–1.5 m for the garment, up to 3 m for a rain cover; the close start lies outside the gesture envelope', () => {
    const l = L('F02');
    assert.deepEqual(l.zones.find((q) => q.id === 'f02.garment')!.distance, { min: 1000, max: 1500 });
    assert.equal(l.zones.find((q) => q.id === 'f02.rain')!.distance.max, 3000);
    const env = l.model.envelopes.find((e) => e.id === 'env.gesture.held')!;
    const close = l.zones.find((q) => q.id === 'f02.close')!;
    assert.ok(sdf(env.shape, close.start.p) > 0, 'outside the gesture');
    assert.ok(env.shape.kind === 'capsule' && env.shape.r === PERFORMER_DIMS.reach.mm);
    assert.deepEqual(close.requires!.micTypeIds, ['scSupercard'], 'no tube reaching into the gesture');
  });
  it('F03: the door’s swing and pinch points are keep-outs; no start lies in the swing', () => {
    const l = L('F03');
    const swing = l.model.envelopes.find((e) => e.id === 'env.swing')!;
    assert.ok(swing.shape.kind === 'sector' && Math.abs(swing.shape.r1 - DOOR.W - 30) < 1e-9);
    // A point in the swing (half open, toward the performer) is inside it.
    assert.ok(sdf(swing.shape, { x: -300, y: -500, z: 500 }) < 0);
    for (const z of l.zones.filter((q) => q.requires?.variants?.includes('door'))) assert.ok(sdf(swing.shape, z.start.p) > 0, z.id);
    assert.ok(l.model.envelopes.some((e) => e.id === 'env.pinchHinge') && l.model.envelopes.some((e) => e.id === 'env.pinchLatch'));
  });
  it('F04: the splash envelope is 2.5 × the basin’s radius (illustrative); the side start stands 300 mm outside it', () => {
    const l = L('F04');
    assert.equal(splashRadius(), 2.5 * PROP_DIMS.basinR.mm);
    assert.ok(PROP_DIMS.splashK.placeholder);
    const side = l.zones.find((q) => q.id === 'f04.side')!;
    assert.ok(Math.hypot(side.start.p.x, side.start.p.z) >= splashRadius() + 300 - 1, 'horizontally outside the splash by 300 mm');
    assert.ok(side.distance.min >= splashRadius() + 300);
    const env = l.model.envelopes.find((e) => e.id === 'env.splash')!;
    for (const z of l.zones.filter((q) => q.requires?.variants?.includes('water'))) assert.ok(sdf(env.shape, z.start.p) > 0, z.id);
    assert.ok(l.diagnostic.some((d) => d.critical && /splash/.test(d.correct)), 'a critical water item');
  });
});

describe('the registry', () => {
  it('the field lab is ready, its blurbs filled, its four Foley lessons listed in order (no total hard-coded)', () => {
    assert.ok(readyLabs().some((l) => l.id === 'field'));
    const lab = MIKING_LABS.find((l) => l.id === 'field')!;
    assert.ok(lab.blurb.length > 40 && lab.familyBlurb.length > 10);
    assert.doesNotMatch(lab.blurb + lab.familyBlurb, RESEARCH);
    const ids = lessonsOf('field').map((l) => l.id);
    for (const id of IDS) assert.ok(ids.includes(id), id);
    assert.deepEqual(LESSONS.filter((l) => IDS.includes(l.id)).map((l) => l.id), IDS);
  });
});
