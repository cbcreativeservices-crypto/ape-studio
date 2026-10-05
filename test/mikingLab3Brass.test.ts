/**
 * Lab 3 (Winds) — the shared BRASS family (lessons/shared/brass) and its two
 * lessons: A01 TRUMPET AND FLUGELHORN, A02 TROMBONE AND BASS TROMBONE
 * (docs/labs/miking/{trumpet,flugelhorn,trombone,bass_trombone}/), checked
 * as RELATIONSHIPS:
 *
 *   • the family: the sourced bell diameters and tube length; the DERIVED
 *     slide positions (0 … 559 mm, a semitone each); the bell drawn to its
 *     rim; the flugelhorn's bell dipped, its axis a unit vector;
 *   • the poses: the lips on the mouthpiece, the floor 1550 mm below them,
 *     the hands on the valves or the slide, the trombone's slide below and
 *     to the right of the bell and reaching past it;
 *   • each lesson validates, carries the 9 pages, sits in Lab 3, follows the
 *     item-writing rules, and its copy names ids that exist;
 *   • every recommended starting point is clear of every part in every
 *     variant it is offered, inside its own zone, never inside the slide's
 *     path or the valve hands' space; a clip zone's start rides on the bell
 *     rim within the gooseneck's reach;
 *   • THE TROMBONE'S LESSON (L45): a stand mic straight in front of the bell
 *     is stopped by the slide's path, while the zones above or beside it are
 *     clear;
 *   • the radiation picture: the lows near-even, the highs beamed, a larger
 *     bell beaming more.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS, viewsOf } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, MIKING_LABS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, nearestRimPoint } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { aimVec } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { BASS_TB, FLUGELHORN, SLIDE_POSITIONS, SLIDE_7TH, TENOR, TRUMPET, bellRadius, slideTravel } from '../src/screens/lab/miking/lessons/shared/brass/brassSpec.ts';
import { slidePose, valvedPose } from '../src/screens/lab/miking/lessons/shared/brass/brassPosture.ts';
import { A01_LESSON } from '../src/screens/lab/miking/lessons/a01Trumpet/lesson.ts';
import { A02_LESSON } from '../src/screens/lab/miking/lessons/a02Trombone/lesson.ts';
import { lobe } from '../src/screens/lab/miking/lessons/shared/brass/brassSoundMath.ts';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';

const LAB3 = [A01_LESSON, A02_LESSON];
const r1 = (x: number) => Math.round(x * 10) / 10;
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('the brass family (lessons/shared/brass)', () => {
  it('the makers’ bell diameters and the measured tube lengths', () => {
    assert.equal(TRUMPET.bell.mm, 123);
    assert.equal(FLUGELHORN.bell.mm, 151.8);
    assert.equal(TENOR.bell.mm, 204.4);
    assert.equal(BASS_TB.bell.mm, 241.3);
    assert.equal(TRUMPET.tube?.mm, 1400);
    assert.equal(TENOR.tube?.mm, 2700);
    assert.equal(BASS_TB.tube?.mm, TENOR.tube?.mm, 'tenor and bass: the same tube length');
  });
  it('the slide positions: a semitone each on the 2.7 m tube — 0, 80.3 … 559.2 mm (DERIVED)', () => {
    assert.deepEqual(SLIDE_POSITIONS.map(r1), [0, 80.3, 165.3, 255.4, 350.9, 452, 559.2]);
    for (let n = 2; n <= 7; n++) assert.ok(Math.abs(2 * slideTravel(n) + 2700 - 2700 * Math.pow(2, (n - 1) / 12)) < 1e-6, `position ${n}`);
    assert.ok(Math.abs(SLIDE_7TH - 559.2) < 0.1);
  });
  it('the bell widens from the tube to the rim, monotonically', () => {
    for (const s of [TRUMPET, FLUGELHORN, TENOR, BASS_TB]) {
      let prev = 0;
      for (let x = -s.flare.mm; x <= 0; x += s.flare.mm / 50) {
        const r = bellRadius(s, x);
        assert.ok(r >= prev - 1e-9, `${s.id} at ${x}`);
        prev = r;
      }
      assert.equal(bellRadius(s, 0), s.bell.mm / 2);
    }
  });
  it('the poses: lips on the mouthpiece, the floor 1550 mm below the lips, the bell axis a unit vector', () => {
    for (const P of [valvedPose(TRUMPET), valvedPose(FLUGELHORN), slidePose(TENOR), slidePose(BASS_TB)]) {
      assert.ok(dist(P.lips, P.mouthpiece.cup) < 12, `${P.spec.id}: lips at the cup`);
      assert.equal(Math.round(P.floorY - P.lips.y), 1550, P.spec.id);
      assert.ok(Math.abs(Math.hypot(P.axis.x, P.axis.y, P.axis.z) - 1) < 1e-9);
      // The player stands behind the horn: the head is behind the lips.
      assert.ok(P.player.head.x < P.lips.x, `${P.spec.id}: head behind the lips`);
    }
    const F = valvedPose(FLUGELHORN);
    assert.ok(F.axis.y > 0.1, 'the flugelhorn’s bell is angled down');
  });
  it('the trumpet’s hands are on the valves', () => {
    const P = valvedPose(TRUMPET);
    for (const h of [P.player.handL, P.player.handR]) assert.ok(Math.abs(h.x - P.valves[1].c.x) < 60, `hand at x ${h.x}`);
  });
  it('the trombone’s slide: below and to the right of the bell, past it even closed; the slide hand on the brace at 1st, 4th and 7th', () => {
    const P = slidePose(TENOR);
    const s = P.slide!;
    assert.ok(s.legs[0] > 0 && s.z > 0, 'below (+y) and to the player’s right (+z)');
    assert.ok(s.crook.x > 0, 'the crook reaches past the bell rim at 1st');
    assert.deepEqual(P.slideArm.map((a) => r1(a.s)), [0, 255.4, 559.2]);
    assert.ok(Math.abs(P.slideArm[0].hand.x - s.brace.x) < 1, 'the hand is on the brace at 1st');
    // The arm is not stretched past its length (340 + 360 mm) at 7th.
    assert.ok(dist(P.player.shoulderR, P.slideArm[2].hand) <= 700 + 1);
  });
  it('the bass trombone: two rotors and their loops, the thumb triggers', () => {
    const P = slidePose(BASS_TB);
    assert.equal(P.rotors.length, 2);
    assert.equal(P.triggers.length, 2);
    assert.ok(P.tubes.some((t) => t.id === 'loopF') && P.tubes.some((t) => t.id === 'loopGb'));
  });
  it('the radiation picture: the lows near-even, the highs beamed — and a larger bell beams more', () => {
    for (const d of [123, 204.4]) {
      assert.ok(lobe('low', 180, d) > 0.6, 'the lows reach behind');
      assert.ok(lobe('high', 0, d) === 1 && lobe('high', 90, d) < 0.2, 'the highs beam');
      assert.ok(lobe('mid', 90, d) > lobe('high', 90, d) && lobe('mid', 90, d) < lobe('low', 90, d));
    }
    assert.ok(lobe('high', 45, 241.3) < lobe('high', 45, 123), 'a larger bell is more directional');
  });
});

describe('Lab 3 brass lessons: registered, valid, complete', () => {
  it('both lessons sit in Lab 3 (winds), ready, and the lab has its blurb', () => {
    for (const id of ['A01', 'A02']) {
      const m = LESSONS.find((l) => l.id === id);
      assert.ok(m && m.labId === 'winds' && m.status === 'ready', id);
      assert.ok(lessonById(id), `${id} is served`);
    }
    assert.ok(MIKING_LABS.find((l) => l.id === 'winds')!.blurb.length > 40);
  });
  for (const L of LAB3) {
    it(`${L.id}: validateLesson is clean; the nine journey pages are there`, () => {
      assert.deepEqual(validateLesson(L, MIC_TYPES), []);
      for (const p of PAGE_IDS) assert.ok(L.pages[p], `${L.id} page ${p}`);
    });
    it(`${L.id}: the item-writing rules`, () => itemRules(L));
    it(`${L.id}: no research name in learner text`, () => {
      const bad = learnerStrings(L).filter((s) => RESEARCH_NAMES.test(s));
      assert.deepEqual(bad, []);
    });
    it(`${L.id}: the copy names zones, mic types and ids that exist`, () => {
      const C = copyOf(L);
      const zones = new Set(L.zones.map((z) => z.id));
      for (const z of Object.values(C.placement.workedZone)) assert.ok(zones.has(z!), `worked zone ${z}`);
      assert.ok(zones.has(C.context.zone) && zones.has(C.twoMic.A.zone) && zones.has(C.twoMic.B.zone!));
      assert.ok(MIC_TYPES[C.context.typeId] && MIC_TYPES[C.twoMic.A.typeId] && MIC_TYPES[C.twoMic.B.typeId]);
      const ids = new Set([...L.scenarios.map((s) => s.id), ...L.orderTasks.map((s) => s.id), ...L.setupTasks.map((s) => s.id)]);
      for (const id of [C.practice.gain, C.practice.second, ...C.practice.mixed]) assert.ok(ids.has(id), id);
      for (const id of C.context.shield) assert.ok(L.model.parts.some((p) => p.id === id), `shield part ${id}`);
      assert.ok(L.live.wedges.some((w) => w.id === C.context.target));
    });
  }
});

describe('Lab 3 brass: every starting point is clear, inside its zone, and inside both views', () => {
  for (const L of LAB3) {
    for (const z of L.zones) {
      const variants = z.requires?.variant ? [z.requires.variant] : L.model.variants.map((v) => v.id);
      for (const v of variants) {
        it(`${L.id} ${z.id} (${v}): the start is clear and in the zone; never in the slide’s path or the valve hands`, () => {
          const t = MIC_TYPES[(z.requires?.micTypeIds ?? L.micTypeIds)[0]];
          const scene = compileScene(L.model, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null);
          assert.ok(inZone(z, { scene, surfaces: L.model.surfaces, lines: L.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start));
          for (const so of scene.solids.filter((s) => /slidePath|valveHands|armR/.test(s.partId))) assert.ok(sdf(so.shape, z.start.p) > 0, `${so.partId}`);
          const views = viewsOf(L.model, v);
          for (const [k, b] of Object.entries(views)) {
            const u = z.start.p.x;
            const w = k === 'side' ? z.start.p.y : z.start.p.z;
            assert.ok(u > b!.u0 + 20 && u < b!.u1 - 20 && w > b!.v0 + 20 && w < b!.v1 - 20, `${k} view`);
          }
          if (t.mount === 'clip') {
            const tail = { x: z.start.p.x - aimVec(z.start.az, z.start.el).x * t.body.length.mm, y: z.start.p.y - aimVec(z.start.az, z.start.el).y * t.body.length.mm, z: z.start.p.z - aimVec(z.start.az, z.start.el).z * t.body.length.mm };
            const g = nearestRimPoint(scene.rims, tail);
            assert.ok(g && g.d <= t.clip!.reach.mm, 'the gooseneck reaches the bell rim');
            assert.ok(g!.rim.id.startsWith('bell'));
          }
        });
      }
    }
  }
});

describe('THE TROMBONE’S LESSON (L45): straight in front of the bell meets the slide', () => {
  for (const v of ['tenor', 'bass']) {
    it(`${v}: a stand mic on the bell’s axis 30–50 cm out is stopped by the slide’s path; the worked start is clear`, () => {
      const scene = compileScene(A02_LESSON.model, v);
      const body = micBodyOf(MIC_TYPES.instDynCard);
      for (const d of [300, 400, 500]) {
        const hit = checkAssembly(scene, { p: { x: d, y: 0, z: 0 }, az: 0, el: 0 }, body);
        assert.ok(hit && /slidePath|armR/.test(hit.partId), `at ${d}: ${hit?.partId}`);
      }
      const worked = A02_LESSON.zones.find((z) => z.id === 'tb.off')!;
      assert.equal(checkAssembly(scene, worked.start, body), null);
    });
  }
  it('the slide’s path covers the crook out to 7th position', () => {
    const scene = compileScene(A02_LESSON.model, 'tenor');
    const path = scene.solids.find((s) => s.partId === 'br.slidePath')!;
    const P = slidePose(TENOR, SLIDE_7TH);
    assert.ok(sdf(path.shape, P.slide!.crook) < 0, 'the crook at 7th is inside the path');
  });
});

describe('the lessons’ words', () => {
  it('the distant studio view reads “about 3 m” (correction A1-01), never “several-meter”', () => {
    for (const L of LAB3) {
      const all = learnerStrings(L).join(' ');
      assert.doesNotMatch(all, /several[- ]met(er|re)/i);
    }
    assert.match(learnerStrings(A02_LESSON).join(' '), /about 3 m/);
    assert.match(learnerStrings(A01_LESSON).join(' '), /about 3 m/);
  });
  it('a clip goes on the bell, never on the slide', () => {
    const words = learnerStrings(A02_LESSON).join(' ');
    assert.match(words, /never on the slide/);
  });
  it('the vibration line is the softened one (correction A2-01)', () => {
    assert.doesNotMatch(learnerStrings(A02_LESSON).join(' '), /undamped clip/i);
  });
  void ({} as Lesson);
});
