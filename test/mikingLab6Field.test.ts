/**
 * Lab 6 (Foley, Field & Scientific), group 2 — PERSPECTIVE & FIELD: the
 * shared field family (lessons/shared/field: frame G, the sites, wind,
 * safety, the field log, the path tool, the stereo image, the dish) and the
 * four lessons F06 AMBIENCE, F08 PASS-BYS, F07 WILDLIFE, F05 FOLEY
 * PERSPECTIVE — checked as RELATIONSHIPS, against the research's numbers:
 *
 *   • frame G drops Lab 5's stereo-array tool in unchanged (ORTF stays
 *     170 mm / 110°, facing the scene, its left on the left);
 *   • the path tool: walking 1.4 m/s gives +7.1 / −7.0 cents (c = 343.21 m/s,
 *     the calculator's); the level is 0 dB at the closest point; the readouts
 *     match hand-computed distances;
 *   • the image: X/Y is level only (no comb in mono), M/S's mono sum is the
 *     Mid, a spaced pair's first notch sits at 1 / (2·Δt);
 *   • the dish: little help below c / D (602 / 587 / 686 Hz), every axial ray
 *     reflects through the focus on the axis;
 *   • the lessons: valid, served, item rules, clean words, starts outside
 *     every keep-out — the setback rings, the path envelope, the lanes — and
 *     the arrays drawn whole with their locked geometry.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { roleWords, SETUP_PICKS, startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { quickCheckOf } from '../src/screens/lab/miking/engine/restructure.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { C20 } from '../src/screens/lab/miking/engine/physics/twoMic.ts';
import { arrayCapsules, includedAngle, pairSpacing } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import { atBearing, bearingOf, faceS, frontUp, MM_PER_YD, poseFacing } from '../src/screens/lab/miking/lessons/shared/field/frameG.ts';
import { centsOf, closestApproach, dopplerFactor, insideEnvelope, pairDtMs, planDistanceToPath, pointAt, readMic, straightPath, stripOf, WALK_SPEED_MS, VEHICLE_SPEED_MS } from '../src/screens/lab/miking/lessons/shared/field/path.ts';
import { imageOf, imagePos, monoNotch } from '../src/screens/lab/miking/lessons/shared/field/stereoImage.ts';
import { aimHelp, beamHalfDeg, DISHES, dishDepth, focusBeyondRim, helpBelowHz, reflectedAxisCrossing } from '../src/screens/lab/miking/lessons/shared/field/dish.ts';
import { EXPOSURES, WIND_LAYERS, windVerdict } from '../src/screens/lab/miking/lessons/shared/field/wind.ts';
import { SAFETY, SETBACK } from '../src/screens/lab/miking/lessons/shared/field/safety.ts';
import { FIELD_LOG_CORE, fieldLog } from '../src/screens/lab/miking/lessons/shared/field/fieldLog.ts';
import { FIELD_SITES } from '../src/screens/lab/miking/lessons/shared/field/sites.ts';
import { pairPoses } from '../src/screens/lab/miking/lessons/shared/field/fieldArrays.ts';
import { WALK_PATH, VEH_PATH } from '../src/screens/lab/miking/lessons/f08Passby/geometry.ts';
import { BIRD_P, ANIMAL_P } from '../src/screens/lab/miking/lessons/f07Wildlife/geometry.ts';
import { itemRules, learnerStrings } from './_mikingItemRules.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const IDS = ['F05', 'F06', 'F07', 'F08'];
const L = (id: string): Lesson => lessonById(id)!;
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const RESEARCH = /\b(Cornell|Macaulay|Innercore|Telinga|Wildtronics|OpenStax|Rode|RØDE|Rycote|MKH|Roesch|Sound Devices|Schoeps|SCHOEPS|DPA|Shure|Sennheiser|Neumann|NPS|NWS|NIOSH|OSHA|MUTCD|ANSI|Hecker|Cross|Malcolm|Warner|Watson Wu|Potter|Les Smith)\b/;
const angleDeg = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z))))) * 180) / Math.PI;

describe('frame G and Lab 5’s arrays (lessons/shared/field)', () => {
  it('bearings: 0 ahead (+x), +90 to the right (+z); front-up turns the scene to the top', () => {
    const p = atBearing(10000, 90, 1500);
    assert.ok(Math.abs(p.z - 10000) < 1e-6 && Math.abs(p.x) < 1e-6 && p.y === -1500);
    assert.ok(Math.abs(bearingOf(atBearing(5000, -40)) + 40) < 1e-9);
    assert.deepEqual(frontUp({ x: 3000, y: 0, z: 1000 }), { u: 1000, v: -3000 });
    const a = aimVec(poseFacing({ x: 0, y: 0, z: 0 }, 0).az, 0);
    assert.ok(a.x > 0.999, 'facing bearing 0 aims along +x');
  });
  it('ORTF placed with faceS stays locked — 170 mm, 110° included — faces the scene, its left capsule on −z', () => {
    const caps = arrayCapsules('ortf', {}, { c: { x: 0, y: -1500, z: 0 }, face: faceS(0) });
    assert.ok(Math.abs(pairSpacing(caps) - 170) < 1e-6);
    assert.ok(Math.abs(includedAngle(caps) - 110) < 1e-6);
    const L0 = caps.find((c) => c.id === 'L')!;
    assert.ok(L0.p.z < 0, 'the left capsule on the array’s left');
    for (const c of caps) assert.ok(c.dir.x > 0.5, 'both capsules face the scene');
  });
  it('pairPoses: the two capsules as engine poses, X/Y coincident at 90°', () => {
    const p = pairPoses('xy', { x: 0, y: -1500, z: 0 }, 0);
    const a = aimVec(p.A.az, p.A.el);
    const b = aimVec(p.B.az, p.B.el);
    assert.ok(Math.abs(angleDeg(a, b) - 90) < 0.5);
    assert.ok(dist(p.A.p, p.B.p) < 40, 'capsules together');
  });
});

describe('the path tool (field_moving_passby §2)', () => {
  it('walking 1.4 m/s: about +7.1 cents approaching, −7.0 receding (c = 343.21 m/s)', () => {
    assert.ok(Math.abs(C20 - 343.21) < 0.005);
    assert.equal(WALK_SPEED_MS, 1.4);
    assert.equal(Math.round(centsOf(dopplerFactor(1.4, 1)) * 10) / 10, 7.1);
    assert.equal(Math.round(centsOf(dopplerFactor(1.4, -1)) * 10) / 10, -7.0);
    // The paper plan's vehicle example: about +104 / −98 cents.
    assert.equal(VEHICLE_SPEED_MS, 20);
    assert.equal(Math.round(centsOf(dopplerFactor(20, 1))), 104);
    assert.equal(Math.round(centsOf(dopplerFactor(20, -1))), -98);
  });
  it('readouts against hand-computed values: distance, 0 dB at the closest point, approach then recession', () => {
    const path = straightPath({ x: 3000, y: -1000, z: -15000 }, { x: 3000, y: -1000, z: 15000 }, 1.4, 1500);
    const mic = { id: 'm', pose: { p: { x: 0, y: -1500, z: 0 }, az: 180, el: 0 }, pattern: 'omni' as const };
    const mid = readMic(path, 0.5, mic);
    assert.ok(Math.abs(mid.r - Math.hypot(3000, 500)) < 1e-6);
    assert.ok(Math.abs(mid.levelDb) < 1e-9 && Math.abs(mid.cents) < 1e-9);
    const start = readMic(path, 0, mic);
    assert.ok(Math.abs(start.r - Math.hypot(3000, 500, 15000)) < 1e-6);
    assert.ok(Math.abs(start.levelDb - -20 * Math.log10(start.r / mid.r)) < 1e-9);
    assert.ok(start.approaching && start.cents > 6.5 && start.cents < 7.1);
    assert.ok(!readMic(path, 1, mic).approaching);
    const strip = stripOf(path, mic, 60);
    const peak = strip.reduce((a, b) => (b.levelDb > a.levelDb ? b : a));
    assert.equal(peak.s, 0.5);
  });
  it('a tracked mic keeps the source on its axis; a fixed cardioid loses level off its axis', () => {
    const path = WALK_PATH;
    const fixed = readMic(path, 0, { id: 'f', pose: { p: { x: 0, y: -1500, z: 0 }, az: 180, el: 0 }, pattern: 'cardioid' });
    const tracked = readMic(path, 0, { id: 't', pose: { p: { x: 0, y: -1500, z: 0 }, az: 180, el: 0 }, pattern: 'cardioid', tracked: true });
    assert.equal(tracked.thetaDeg, 0);
    assert.ok(fixed.patternDb < -1 && tracked.patternDb === 0);
  });
  it('two separate mics: Δt flips sign as the source passes between them', () => {
    const a = { x: 900, y: -1500, z: -9000 };
    const b = { x: 900, y: -1500, z: 9000 };
    assert.ok(pairDtMs(WALK_PATH, 0, a, b) > 0, 'near the start, the end mic hears it later');
    assert.ok(pairDtMs(WALK_PATH, 1, a, b) < 0);
    assert.ok(Math.abs(pairDtMs(WALK_PATH, 0.5, a, b)) < 1e-9);
  });
  it('the envelope test and the closest approach', () => {
    assert.ok(insideEnvelope(WALK_PATH, { x: 2000, y: 0, z: 4000 }));
    assert.ok(!insideEnvelope(WALK_PATH, { x: 0, y: 0, z: 0 }));
    assert.ok(Math.abs(closestApproach(WALK_PATH, { x: 0, y: -1000, z: 2500 }).s - (2500 + 15000) / 30000) < 1e-9);
    assert.deepEqual(pointAt(VEH_PATH, 0.5), { x: 9000, y: -600, z: 0 });
  });
});

describe('the stereo image (field_ambience §7, foley_perspective §4)', () => {
  const C = { x: 0, y: -1500, z: 0 };
  it('X/Y: level only — a source ahead lands in the middle, one to the left leans left, no comb', () => {
    const caps = arrayCapsules('xy', { angle: 90 }, { c: C, face: faceS(0) });
    const ahead = imageOf(caps, atBearing(8000, 0, 1500));
    assert.ok(Math.abs(ahead.levelDiffDb) < 1e-6 && Math.abs(ahead.pos) < 1e-6);
    const left = imageOf(caps, atBearing(8000, -60, 1500));
    assert.equal(left.kind, 'level');
    assert.ok(left.levelDiffDb > 3 && left.pos < 0 && left.dtMs === 0 && left.monoNotchHz === null);
  });
  it('ORTF: level and time — the right capsule hears a left source later', () => {
    const caps = arrayCapsules('ortf', {}, { c: C, face: faceS(0) });
    const r = imageOf(caps, atBearing(8000, -60, 1500));
    assert.equal(r.kind, 'levelTime');
    assert.ok(r.dtMs > 0 && r.pos < 0);
    assert.ok(Math.abs(r.monoNotchHz! - 1000 / (2 * r.dtMs)) < 1e-6);
  });
  it('M/S: the decoded image follows the Side, the mono sum is the Mid alone', () => {
    const caps = arrayCapsules('ms', {}, { c: C, face: faceS(0) });
    const r = imageOf(caps, atBearing(8000, -60, 1500));
    assert.equal(r.kind, 'ms');
    assert.ok(r.levelDiffDb > 0, 'a source on the left is louder on the left');
    assert.equal(r.monoNotchHz, null);
  });
  it('spaced omnis 60 cm (O-8): a side source combs in mono; the image clamps at a speaker', () => {
    const caps = arrayCapsules('ab', { spacing: 600 }, { c: C, face: faceS(0) });
    const r = imageOf(caps, atBearing(8000, 80, 1500));
    assert.ok(r.dtMs < 0 && r.monoNotchHz! > 0);
    assert.ok(monoNotch(0) === null);
    assert.equal(imagePos(40, 0), -1);
    assert.equal(imagePos(-40, 0), 1);
  });
});

describe('the parabolic dish (field_wildlife_distant §2)', () => {
  it('the presets: 57 cm (focus 0.36·D), 585 / 210 mm, 500 / 140 mm', () => {
    assert.deepEqual([DISHES.typical.D, DISHES.typical.f], [570, 205]);
    assert.deepEqual([DISHES.d585.D, DISHES.d585.f], [585, 210]);
    assert.deepEqual([DISHES.d500.D, DISHES.d500.f], [500, 140]);
  });
  it('little help below c / D: about 602, 587 and 686 Hz', () => {
    assert.equal(Math.round(helpBelowHz(570)), 602);
    assert.equal(Math.round(helpBelowHz(585)), 587);
    assert.equal(Math.round(helpBelowHz(500)), 686);
  });
  it('every ray along the axis reflects through the focus, on the axis', () => {
    for (const d of Object.values(DISHES)) {
      for (const k of [0.15, 0.4, 0.75, 1]) assert.ok(Math.abs(reflectedAxisCrossing((d.D / 2) * k, d.f) - d.f) < 1e-6, `${d.id} ${k}`);
      assert.ok(Math.abs(dishDepth(d.D, d.f) - (d.D / 2) ** 2 / (4 * d.f)) < 1e-9);
    }
    assert.ok(focusBeyondRim(570, 205) > 0, 'the 57 cm dish’s focus lies just beyond its rim');
    assert.ok(focusBeyondRim(500, 140) > 0 && focusBeyondRim(500, 140) < focusBeyondRim(570, 205), 'the deeper 50 cm dish holds its focus nearer its rim');
  });
  it('the beam narrows as the pitch rises; below c / D the dish gives little help whatever the aim', () => {
    assert.ok(beamHalfDeg(5000, 570) < beamHalfDeg(1500, 570));
    assert.equal(beamHalfDeg(300, 570), 90);
    assert.equal(aimHelp(0, 300, 570), 'little');
    assert.equal(aimHelp(0, 5000, 570), 'strong');
    assert.equal(aimHelp(15, 5000, 570), 'little');
  });
});

describe('wind, safety and the field log', () => {
  it('foam is enough in a sheltered forest, not on open ground; fur over the basket is the most', () => {
    assert.deepEqual(WIND_LAYERS.map((l) => l.id), ['none', 'foam', 'softie', 'basket', 'basketFur']);
    assert.ok(windVerdict('forest', 'foam').enough);
    assert.ok(!windVerdict('open', 'foam').enough);
    for (const e of EXPOSURES) assert.ok(windVerdict(e.id, 'basketFur').enough && windVerdict(e.id, 'basketFur').marks === 0);
    for (const e of EXPOSURES) assert.ok(!windVerdict(e.id, 'none').enough);
  });
  it('the exact facts, in plain words: lightning, wildlife, traffic', () => {
    assert.ok(Math.abs(SETBACK.most.mm - 25 * MM_PER_YD) < 1e-9 && Math.abs(SETBACK.bearWolf.mm - 100 * MM_PER_YD) < 1e-9);
    assert.match(SAFETY.lightning.text, /30 minutes after the last lightning or thunder/);
    assert.match(SAFETY.lightning.text, /Rain shelters, small sheds and open vehicles are not safe/);
    assert.match(SAFETY.wildlife.text, /Local rules come first/);
    assert.match(SAFETY.wildlife.text, /25 yards \(about 23 m\).*100 yards \(about 91 m\)/);
    assert.match(SAFETY.traffic.text, /a stand or a cone is not traffic control/);
    assert.match(SAFETY.water.text, /A windscreen is not waterproofing/);
    assert.match(SAFETY.hearing.text, /85 dBA averaged over 8 hours/);
    assert.doesNotMatch(Object.values(SAFETY).map((c) => c.text).join(' '), RESEARCH);
  });
  it('the field log is typed only — no location — and its ids fit the store', () => {
    const f = fieldLog([]);
    assert.ok(f.length > FIELD_LOG_CORE.length);
    for (const x of f) {
      assert.ok(x.id.length < 32, x.id);
      assert.doesNotMatch(`${x.id} ${x.label}`, /\b(GPS|latitude|longitude|coordinates)\b/i);
    }
  });
  it('every site’s keep-outs are drawn from its own features; the rings are the sourced example', () => {
    for (const s of Object.values(FIELD_SITES)) for (const e of s.keepOuts) assert.ok(e.shape.kind === 'prism' || e.shape.kind === 'box' || e.shape.kind === 'cyl', `${s.id} ${e.id}`);
    const ring = FIELD_SITES.woodEdge.keepOuts.find((e) => e.id === 'env.ring')!;
    assert.ok(ring.shape.kind === 'cyl' && Math.abs(ring.shape.r - SETBACK.most.mm) < 1e-9);
    assert.equal(ring.prov.kind, 'sourced');
  });
});

describe('the four lessons', () => {
  for (const id of IDS) {
    it(`${id}: validates, serves the journey, follows the item rules, names no research source`, () => {
      const l = L(id);
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      assertJourneyPages(l);
      itemRules(l);
      const text = learnerStrings(l).join('\n');
      assert.doesNotMatch(text, RESEARCH);
      assert.doesNotMatch(text, /\b(classroom|students?|instructor|academy|course)\b/i);
      assert.doesNotMatch(text, /Shown, never played/);
      assert.match(l.accuracyDetail, /After our research/);
      assert.match(l.accuracyDetail, /Experimentation is encouraged/);
      assert.match(l.accuracyDetail, /trust your ears and the room/);
      assert.equal(l.labId, 'field');
    });
    it(`${id}: a six-item quick check with a critical item; ONE MIC first in every variant`, () => {
      const l = L(id);
      const q = quickCheckOf(l);
      assert.equal(q.length, 6);
      assert.ok(q.some((d) => d.critical));
      for (const v of l.model.variants) {
        const s = startingSetups(l, v.id, MIC_TYPES);
        assert.equal(s[0]?.role, 'one', `${id} ${v.id}`);
        assert.ok(s.every((x) => x.mics.every((m) => l.micTypeIds.includes(m.typeId))), `${id} ${v.id}`);
      }
    });
  }
  it('F06: every start 1.5 m up, off every path, lane and bank; the pairs drawn whole with their locked geometry', () => {
    const l = L('F06');
    for (const z of l.zones) assert.ok(Math.abs(-z.start.p.y - 1500) < 1e-9, z.id);
    for (const v of ['woodland', 'plaza']) {
      const s = startingSetups(l, v, MIC_TYPES);
      assert.deepEqual(s.map((x) => roleWords(x)), ['ONE MIC', 'TWO MICS', 'SECOND POSITION', 'ANOTHER START', 'ANOTHER START', 'ANOTHER START']);
      const ortf = s.find((x) => /ORTF/.test(x.title))!;
      assert.ok(Math.abs(dist(ortf.mics[0].pose.p, ortf.mics[1].pose.p) - 170) < 1, 'ORTF 170 mm');
      assert.ok(Math.abs(angleDeg(aimVec(ortf.mics[0].pose.az, ortf.mics[0].pose.el), aimVec(ortf.mics[1].pose.az, ortf.mics[1].pose.el)) - 110) < 0.5, 'ORTF 110°');
      const ab = s.find((x) => /Spaced/.test(x.title))!;
      assert.ok(Math.abs(dist(ab.mics[0].pose.p, ab.mics[1].pose.p) - 600) < 1, 'A/B 600 mm (O-8)');
    }
  });
  it('F08: every walk start outside the path envelope; the vehicle only on paper, behind the crew line', () => {
    const l = L('F08');
    for (const z of l.zones.filter((q) => q.requires?.variant === 'walk')) assert.ok(planDistanceToPath(WALK_PATH, z.start.p) >= WALK_PATH.envelopeHalfWidth, z.id);
    for (const z of l.zones.filter((q) => q.requires?.variant === 'vehicle')) assert.ok(planDistanceToPath(VEH_PATH, z.start.p) >= VEH_PATH.envelopeHalfWidth + 3000, z.id);
    assert.match(l.model.variants.find((v) => v.id === 'vehicle')!.label, /PAPER PLAN/);
    const walk = startingSetups(l, 'walk', MIC_TYPES);
    assert.equal(roleWords(walk.find((s) => s.role === 'close')!), 'TRACKED');
    assert.ok(walk.some((s) => /Start mic \+ end mic/.test(s.title) && s.mics.length === 2));
    // A stand inside the envelope is stopped.
    const sc = compileScene(l.model, 'walk');
    const inside: MicPose = { p: { x: 2600, y: -1500, z: 0 }, az: 180, el: 0 };
    assert.notEqual(checkAssembly(sc, inside, micBodyOf(MIC_TYPES.arrOmni)), null);
  });
  it('F07: every start outside the setback ring, aimed at the target; a mic inside the ring is stopped', () => {
    const l = L('F07');
    for (const z of l.zones) {
      const v = z.requires!.variant!;
      const target = v === 'bird' ? BIRD_P : v === 'distant' ? ANIMAL_P : null;
      if (target) assert.ok(Math.hypot(z.start.p.x - target.x, z.start.p.z - target.z) > SETBACK.most.mm, z.id);
      if (z.aim) {
        const t = v === 'bird' ? BIRD_P : v === 'distant' ? ANIMAL_P : { x: 30000, y: -6000, z: 0 };
        const d = { x: t.x - z.start.p.x, y: t.y - z.start.p.y, z: t.z - z.start.p.z };
        assert.ok(angleDeg(aimVec(z.start.az, z.start.el), d) < 1, `${z.id} aimed at its target`);
      }
    }
    const sc = compileScene(l.model, 'bird');
    const tooClose: MicPose = { p: { x: 10000, y: -1500, z: 0 }, az: 180, el: 0 };
    assert.equal(checkAssembly(sc, tooClose, micBodyOf(MIC_TYPES.shotgunShort))?.partId, 'env.ring');
    assert.equal(MIC_TYPES.dishMic.body.radius.mm, 285);
    assert.ok(startingSetups(l, 'bird', MIC_TYPES).some((s) => s.mics[0].typeId === 'dishMic'), 'the dish is a starting setup for one bird');
    assert.equal(roleWords(startingSetups(l, 'flock', MIC_TYPES).find((s) => s.role === 'distant')!), 'WIDER VIEW');
  });
  it('F05: the close mic 3–6 ft out (about 15°), the room mic about 3 m; X/Y 90°, ORTF 170 mm / 110°, drawn whole', () => {
    const l = L('F05');
    const mono = l.zones.find((z) => z.id === 'f05.mono')!;
    assert.ok(Math.abs(mono.distance.min - 914.4) < 1e-6 && Math.abs(mono.distance.max - 1828.8) < 1e-6);
    const room = l.zones.find((z) => z.id === 'f05.room')!;
    assert.deepEqual([room.distance.min, room.distance.max], [2700, 3300]);
    const s = startingSetups(l, 'keys', MIC_TYPES);
    assert.equal(s[1].role, 'pair');
    assert.deepEqual(s[1].mics.map((m) => m.typeId), ['shotgunShort', 'ldcRoom']);
    const xy = s.find((x) => /X\/Y/.test(x.title))!;
    assert.ok(Math.abs(angleDeg(aimVec(xy.mics[0].pose.az, xy.mics[0].pose.el), aimVec(xy.mics[1].pose.az, xy.mics[1].pose.el)) - 90) < 0.5);
    const ortf = s.find((x) => /ORTF/.test(x.title))!;
    assert.ok(Math.abs(dist(ortf.mics[0].pose.p, ortf.mics[1].pose.p) - 170) < 1);
    // Every pair's capsules face the action (−x in frame F).
    for (const p of s.filter((x) => x.mics.length === 2 && x.role === 'more')) for (const m of p.mics) assert.ok(aimVec(m.pose.az, m.pose.el).x < 0 || m.typeId === 'arrFig8', p.title);
  });
  it('the registry: the four lessons are ready under the field lab; the role names fit the field (O-14)', () => {
    const ids = lessonsOf('field').map((l) => l.id);
    for (const id of IDS) assert.ok(ids.includes(id), id);
    assert.deepEqual(LESSONS.filter((l) => IDS.includes(l.id)).map((l) => l.id), IDS);
    assert.equal(SETUP_PICKS.F06.labels?.distant, 'SECOND POSITION');
    assert.equal(SETUP_PICKS.F07.labels?.distant, 'WIDER VIEW');
    assert.equal(SETUP_PICKS.F08.labels?.close, 'TRACKED');
    assert.equal(roleWords({ role: 'one' }), 'ONE MIC');
  });
  it('a field site draws its hardware larger than life, and says so', () => {
    for (const id of ['F06', 'F07', 'F08']) {
      const l = L(id);
      assert.ok((l.model.hardwareScale ?? 1) > 1, id);
      assert.match(l.accuracyDetail, /larger than life/, id);
    }
    assert.equal(L('F05').model.hardwareScale, undefined, 'the Foley stage is drawn at true size');
  });
});
