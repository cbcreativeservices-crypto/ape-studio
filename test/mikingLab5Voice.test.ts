/**
 * Lab 5 (Ensembles and Voice), group 1 — VOICE I, SOLO: the shared voice
 * family (lessons/shared/voice, "frame V") and its three lessons — E01 LEAD
 * VOCAL, E03 RAP AND RHYTHMIC VOCAL, E07 SINGER WITH GUITAR OR PIANO
 * (docs/labs/miking/{lead_vocal,rap_vocal,singer_with_instrument}/) —
 * checked as RELATIONSHIPS:
 *
 *   • frame V: the profile head's mouth ON the lip point; the nose ahead of
 *     and above it; the sourced 25 mm reference point and 10 cm screen gap;
 *     the standing figure 1550 mm above the floor, the body behind the lips;
 *   • the POP SCREEN is real: it rides on the mic's stand (in the collision
 *     assembly), so a screened condenser is stopped short of the face where
 *     a dynamic is not;
 *   • each lesson validates, serves the eight journey pages, follows the
 *     item-writing rules, names no research source, and its copy names ids
 *     that exist;
 *   • every recommended starting point: clear of the singer and the
 *     instrument, inside its own zone, measured from the lips, aimed at the
 *     mouth, inside its views;
 *   • E01: the wedge in front of the singer sits near a supercardioid's null
 *     for a level stage mic (the S-LIVE angle);
 *   • E03: the working zone and the inverse-square swing it causes;
 *   • E07: two hosts in one model (each host's parts only in its variant),
 *     the 3:1 rewrite computed from the drawing, the guitar reachable in a
 *     supercardioid's null by aim alone;
 *   • the registry: Lab 5 ready, "Voice & Ensemble", its blurbs filled.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson, MicPose } from '../src/screens/lab/miking/engine/model/types.ts';
import { viewsOf } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, MIKING_LABS, lessonsOf, readyLabs } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { assembly, checkAssembly, compileScene, nearestRimPoint } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { aimOff, inZone, surfaceDistance } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { EAR, HEAD_C, HEAD_R, NOSE, VOICE_DIMS, VOICE_ROWS, distanceSwingDb } from '../src/screens/lab/miking/lessons/shared/voice/voiceSpec.ts';
import { FLOOR_Y, SINGER_SIDE, SINGER_SOLIDS } from '../src/screens/lab/miking/lessons/shared/voice/voicePose.ts';
import { VOICE_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/voice/voiceMics.ts';
import { E01_LESSON } from '../src/screens/lab/miking/lessons/e01LeadVocal/lesson.ts';
import { E03_LESSON } from '../src/screens/lab/miking/lessons/e03RapVocal/lesson.ts';
import { E07_LESSON, E07_PAIR, E07_RATIO } from '../src/screens/lab/miking/lessons/e07SingerInstrument/lesson.ts';
import { GUITAR_SOURCE } from '../src/screens/lab/miking/lessons/e07SingerInstrument/copy.ts';
import { V_GUITAR, V_PIANO } from '../src/screens/lab/miking/lessons/e07SingerInstrument/geometry.ts';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';
import { assertJourneyPages } from './_mikingPages.ts';

const LAB5 = [E01_LESSON, E03_LESSON, E07_LESSON];
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const LAB5_NAMES = /\b(SM ?58|SM ?4|KMS ?104|GRAS|Neumann|Shure|DPA|AKG)\b/;

describe('frame V — the shared voice family (lessons/shared/voice)', () => {
  it('the profile head’s mouth sits on the lip point; the nose ahead of and above it', () => {
    // PlayerFigure.headProfile: the lips at (−84, 52) in its own units (k = r / 110), facing +x.
    const k = HEAD_R / 110;
    assert.ok(Math.abs(HEAD_C.x + 84 * k) < 1e-9 && Math.abs(HEAD_C.y + 52 * k) < 1e-9);
    assert.ok(NOSE.x > 0 && NOSE.x < 30, `nose ${NOSE.x} mm ahead`);
    assert.ok(NOSE.y < -15 && NOSE.y > -45, `nose ${NOSE.y} mm (y down: above)`);
    assert.ok(EAR.x < HEAD_C.x, 'the ear is behind the head’s centre');
  });
  it('the sourced numbers: the mouth reference point 25 mm, the screen at least 10 cm from the mic', () => {
    assert.equal(VOICE_DIMS.mrp.mm, 25);
    assert.equal(VOICE_DIMS.mrp.prov.kind, 'sourced');
    assert.equal(VOICE_DIMS.popGap.mm, 100);
    assert.equal(VOICE_DIMS.popGap.prov.kind, 'sourced');
    for (const d of [VOICE_DIMS.lipStanding, VOICE_DIMS.popR, VOICE_DIMS.popTilt, VOICE_DIMS.jetHalfDeg, VOICE_DIMS.workFwd, VOICE_DIMS.sideDeg, VOICE_DIMS.belowDeg]) assert.ok(d.placeholder && d.prov.kind === 'unknown');
  });
  it('the research rows, mm from the lips: 10–20 cm, 20–30 cm, within 10 cm, 1–6 in, around 12 in', () => {
    assert.deepEqual([VOICE_ROWS.shure.min, VOICE_ROWS.shure.max], [100, 200]);
    assert.deepEqual([VOICE_ROWS.neumann.min, VOICE_ROWS.neumann.max], [200, 300]);
    assert.equal(VOICE_ROWS.stage.max, 100);
    assert.deepEqual([VOICE_ROWS.sm4.min, VOICE_ROWS.sm4.max], [25.4, 152.4]);
    assert.ok(VOICE_ROWS.loose.min < 304.8 && VOICE_ROWS.loose.max > 304.8);
    assert.equal(VOICE_ROWS.dpaClose.start, 101.6);
  });
  it('the standing singer: the lips 1550 mm above the floor, the feet on it, the body behind the lips', () => {
    assert.equal(FLOOR_Y, 1550);
    assert.equal(SINGER_SIDE.floor, FLOOR_Y);
    assert.equal(SINGER_SIDE.footR.v, FLOOR_Y);
    const torso = SINGER_SOLIDS.torso;
    assert.ok(torso.kind === 'box' && torso.max.x < 20, 'the chest is behind the lips');
    assert.ok(SINGER_SIDE.head.c.u < 0 && SINGER_SIDE.head.c.v < 0, 'the head’s centre behind and above the lips');
    const hipV = (SINGER_SIDE.hipR.v + SINGER_SIDE.hipL.v) / 2;
    assert.ok(hipV > 500 && hipV < 800, 'adult proportions: the hips about halfway down');
  });
  it('the inverse-square swing: doubling the distance is about 6 dB', () => {
    assert.ok(Math.abs(distanceSwingDb(80, 160) - 6.02) < 0.01);
    assert.ok(Math.abs(distanceSwingDb(40, 100) - 7.96) < 0.01);
  });
});

describe('the voice mics and the pop screen', () => {
  const body = micBodyOf(MIC_TYPES.vocLdc);
  it('the voice mic types are registered, generic, and the screened condenser carries its screen', () => {
    for (const id of Object.keys(VOICE_MIC_TYPES)) assert.ok(MIC_TYPES[id], id);
    assert.ok(body.pop && body.pop.gap >= 100);
    assert.equal(micBodyOf(MIC_TYPES.vocLdcOpen).pop, undefined);
    for (const t of Object.values(VOICE_MIC_TYPES)) {
      assert.doesNotMatch(`${t.label} ${t.short} ${t.blurb}`, LAB5_NAMES, t.id);
      assert.ok(t.blurb.length > 40);
    }
  });
  it('the screen is part of the assembly, its disc square to the aim, the gap ahead of the front', () => {
    const pose: MicPose = { p: { x: 150, y: 0, z: 0 }, az: 0, el: 0 };
    const segs = assembly(compileScene(E01_LESSON.model, 'studio'), pose, body);
    const disc = segs.filter((s) => s.piece === 'body' && Math.abs((s.a.x + s.b.x) / 2 - (150 - body.pop!.gap)) < 1e-6);
    assert.equal(disc.length, 2, 'two crossed diameters');
    for (const s of disc) assert.ok(Math.abs(dist(s.a, s.b) - 2 * body.pop!.r) < 1e-6);
  });
  it('real physics: a screened condenser cannot come as close to the lips as a handheld dynamic', () => {
    const scene = compileScene(E01_LESSON.model, 'studio');
    const at = (x: number): MicPose => ({ p: { x, y: 0, z: 0 }, az: 0, el: 0 });
    assert.ok(checkAssembly(scene, at(110), body), 'the screen would reach the face at 11 cm');
    assert.equal(checkAssembly(scene, at(110), micBodyOf(MIC_TYPES.vocDynCard)), null, 'a dynamic at 11 cm is clear');
    assert.equal(checkAssembly(scene, at(150), body), null, 'the screened condenser at 15 cm is clear');
  });
});

describe('Lab 5 voice lessons: registered, valid, complete', () => {
  it('Lab 5 is ready, one family tile “Voice & Ensemble”, its blurbs filled, the voice lessons listed', () => {
    const lab = MIKING_LABS.find((l) => l.id === 'ensembles')!;
    assert.ok(readyLabs().some((l) => l.id === 'ensembles'));
    assert.equal(lab.family, 'Voice & Ensemble');
    assert.ok(lab.blurb.length > 40 && lab.familyBlurb.length > 20);
    const ids = lessonsOf('ensembles').map((l) => l.id);
    for (const id of ['E01', 'E03', 'E07']) assert.ok(ids.includes(id), `${id} listed`);
    for (const id of ['E01', 'E03', 'E07']) {
      const m = LESSONS.find((l) => l.id === id)!;
      assert.ok(m.labId === 'ensembles' && m.status === 'ready');
      assert.ok(lessonById(id), `${id} is served`);
    }
  });
  for (const L of LAB5) {
    it(`${L.id}: validateLesson is clean; its written pages serve the 8 journey pages`, () => {
      assert.deepEqual(validateLesson(L, MIC_TYPES), []);
      assertJourneyPages(L);
    });
    it(`${L.id}: the item-writing rules`, () => itemRules(L));
    it(`${L.id}: no research name in learner text`, () => {
      const bad = learnerStrings(L).filter((s) => RESEARCH_NAMES.test(s) || LAB5_NAMES.test(s));
      assert.deepEqual(bad, []);
    });
    it(`${L.id}: the copy names zones, mic types and ids that exist`, () => {
      const C = copyOf(L);
      const zones = new Set(L.zones.map((z) => z.id));
      for (const z of Object.values(C.placement.workedZone)) assert.ok(zones.has(z!), `worked zone ${z}`);
      assert.ok(zones.has(C.context.zone) && zones.has(C.twoMic.A.zone));
      if (C.twoMic.B.zone) assert.ok(zones.has(C.twoMic.B.zone));
      assert.ok(MIC_TYPES[C.context.typeId] && MIC_TYPES[C.twoMic.A.typeId] && MIC_TYPES[C.twoMic.B.typeId]);
      const ids = new Set([...L.scenarios.map((s) => s.id), ...L.orderTasks.map((s) => s.id), ...L.setupTasks.map((s) => s.id)]);
      for (const id of [C.practice.gain, C.practice.second, ...C.practice.mixed]) assert.ok(ids.has(id), id);
      assert.ok(L.live.wedges.some((w) => w.id === C.context.target));
    });
    it(`${L.id}: a STARTING SETUP in every variant, the worked one first`, () => {
      for (const v of L.model.variants) {
        const s = startingSetups(L, v.id, MIC_TYPES);
        assert.ok(s.length >= 2, `${v.id}: ${s.length} setups`);
        assert.equal(s[0].role, 'one');
        assert.equal(s[0].zones[0].id, copyOf(L).placement.workedZone[v.id]);
      }
    });
  }
});

describe('Lab 5 voice: every starting point is clear, in its zone, measured from the lips', () => {
  for (const L of LAB5) {
    for (const z of L.zones) {
      const variants = z.requires?.variant ? [z.requires.variant] : L.model.variants.map((v) => v.id);
      for (const v of variants) {
        it(`${L.id} ${z.id} (${v}): clear, in its zone, inside both views`, () => {
          const t = MIC_TYPES[(z.requires?.micTypeIds ?? L.micTypeIds)[0]];
          const scene = compileScene(L.model, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null);
          assert.ok(inZone(z, { scene, surfaces: L.model.surfaces, lines: L.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start));
          const views = viewsOf(L.model, v);
          for (const [k, b] of Object.entries(views)) {
            const u = z.start.p.x;
            const w = k === 'side' ? z.start.p.y : z.start.p.z;
            assert.ok(u > b!.u0 + 20 && u < b!.u1 - 20 && w > b!.v0 + 20 && w < b!.v1 - 20, `${k} view`);
          }
          const s = L.model.surfaces.find((q) => q.id === z.refSurface)!;
          if (s.target && /^mouth/.test(s.id)) {
            // A vocal zone: its start is its own distance from the lips and aimed at the mouth.
            const d = surfaceDistance(L.model.surfaces, s.id, z.start);
            assert.ok(d >= z.distance.min - 0.5 && d <= z.distance.max + 0.5, `${d} mm from the lips`);
            assert.ok(aimOff(s, z.start) <= (z.aim?.maxOffAxis ?? 90) + 1e-6);
          }
          if (t.mount === 'clip') {
            const a = aimVec(z.start.az, z.start.el);
            const tail = { x: z.start.p.x - a.x * t.body.length.mm, y: z.start.p.y - a.y * t.body.length.mm, z: z.start.p.z - a.z * t.body.length.mm };
            const g = nearestRimPoint(scene.rims, tail);
            assert.ok(g && g.d <= t.clip!.reach.mm, 'the headset’s boom reaches the ear');
          }
        });
      }
    }
  }
});

describe('E01 lead vocal', () => {
  it('the worked studio start: a screened condenser 15 cm from the lips (D-LV1, inside 10–20 cm), clear', () => {
    const z = E01_LESSON.zones.find((q) => q.id === 'lv.close')!;
    assert.ok(Math.abs(dist(z.start.p, { x: 0, y: 0, z: 0 }) - 150) < 1);
    assert.equal(z.requires?.micTypeIds?.[0], 'vocLdc');
  });
  it('the wedge sits in front of the singer (behind the mic), near a supercardioid’s null for a level stage mic', () => {
    const w = E01_LESSON.live.wedges[0];
    assert.ok(w.p.x > 0 && w.faces.x < 0, 'in front of the singer, facing back');
    const z = E01_LESSON.zones.find((q) => q.id === 'lv.stage')!;
    const theta = arrivalAngle(z.start, { x: w.p.x, y: w.p.y - w.lift, z: w.p.z });
    assert.ok(nearNull('supercardioid', theta, 15), `${theta.toFixed(0)}° off the front`);
    assert.ok(!nearNull('cardioid', theta, 15), 'a level cardioid does not have it in its null — tilt or pattern');
  });
  it('studio and stage: the headphones are drawn only in the studio; the headset only on stage', () => {
    assert.deepEqual(E01_LESSON.model.parts.find((p) => p.id === 'v.phones')!.variants, ['studio']);
    assert.deepEqual(E01_LESSON.model.rims!.map((r) => r.variants), [['live']]);
  });
});

describe('E03 rap vocal', () => {
  it('the worked start: a dynamic about 4 in (101.6 mm) from the lips, on the mouth’s axis', () => {
    const z = E03_LESSON.zones.find((q) => q.id === 'rp.close')!;
    assert.ok(Math.abs(dist(z.start.p, { x: 0, y: 0, z: 0 }) - 101.6) < 1);
    assert.equal(MIC_TYPES[z.requires!.micTypeIds![0]].transducer, 'dynamic');
  });
  it('the 1–6 in condenser row with a screen: only its far end is reachable, and the start is there', () => {
    const z = E03_LESSON.zones.find((q) => q.id === 'rp.screen')!;
    assert.equal(z.distance.min, 25.4);
    const d = dist(z.start.p, { x: 0, y: 0, z: 0 });
    assert.ok(d >= 140 && d <= 152.4, `${d}`);
  });
});

describe('E07 singer with guitar or piano', () => {
  const m = E07_LESSON.model;
  it('two hosts in one model: each host’s parts exist only in its variant', () => {
    assert.ok(m.parts.filter((p) => p.id.startsWith('guitar.')).every((p) => p.variants?.length === 1 && p.variants[0] === 'guitar'));
    assert.ok(m.parts.filter((p) => p.id.startsWith('gp.')).every((p) => p.variants?.length === 1 && p.variants[0] === 'piano'));
    assert.ok(m.parts.some((p) => p.id.startsWith('guitar.')) && m.parts.some((p) => p.id.startsWith('gp.')));
    assert.deepEqual(m.variants.map((v) => v.id), ['guitar', 'piano']);
    assert.ok(viewsOf(m, 'guitar').side!.u1 < viewsOf(m, 'piano').side!.u1, 'each variant keeps its own views');
  });
  it('the singer’s mouth: above the guitar’s top, facing the audience; above the keys, facing them', () => {
    assert.ok(V_GUITAR.lip.y < -300 && V_GUITAR.fwd.z === 1);
    assert.ok(V_PIANO.fwd.x === 1 && V_PIANO.lip.y < 0);
  });
  it('the 3:1 rewrite is computed from the drawing: the pair is under 3:1 on purpose, and the example says so', () => {
    assert.ok(E07_RATIO < 3, `ratio ${E07_RATIO.toFixed(2)}`);
    assert.ok(Math.abs(E07_PAIR.rVoice - 150) < 1, 'the vocal mic 15 cm from the lips');
    assert.ok(E07_PAIR.rGuitar >= 152.4 && E07_PAIR.rGuitar <= 304.8, 'the guitar mic inside 6–12 in');
    const s = E07_LESSON.scenarios.find((q) => q.id === 'sw.place.2')!;
    assert.match(s.correct, new RegExp(`${Math.round((3 * Math.max(E07_PAIR.rVoice, E07_PAIR.rGuitar)) / 10)} cm`));
  });
  it('the vocal mic’s null can reach the guitar by aim alone (a supercardioid, within ±60°)', () => {
    const z = E07_LESSON.zones.find((q) => q.id === 'sg.voice')!;
    let ok = false;
    for (let daz = -60; daz <= 60 && !ok; daz += 5)
      for (let del = -60; del <= 60 && !ok; del += 5) {
        const pose = { ...z.start, az: z.start.az + daz, el: z.start.el + del };
        if (nearNull('supercardioid', arrivalAngle(pose, GUITAR_SOURCE), 15)) ok = true;
      }
    assert.ok(ok);
  });
  it('the piano variant: the vocal mic on a boom over the keys, clear; a pair setup with the middle-strings mic', () => {
    const z = E07_LESSON.zones.find((q) => q.id === 'sp.voice')!;
    assert.ok(z.start.p.x > V_PIANO.lip.x && Math.abs(z.start.p.y - V_PIANO.lip.y) < 1);
    const s = startingSetups(E07_LESSON as Lesson, 'piano', MIC_TYPES);
    assert.ok(s.some((x) => x.role === 'pair' && x.zones.map((q) => q.id).join() === 'sp.voice,sp.over'));
  });
});
