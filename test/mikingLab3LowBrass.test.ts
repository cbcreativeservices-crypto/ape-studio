/**
 * Lab 3 (Winds) — the shared LOW / COILED BRASS family (lessons/shared/
 * lowbrass) and its three lessons: A03 FRENCH HORN, A04a TUBA, A04b
 * EUPHONIUM (docs/labs/miking/{french_horn,tuba,euphonium}/):
 *
 *   • the family: the sourced bell diameters and valves; the horn's bell
 *     diameter is a drawing default (LB-01);
 *   • the scenes: the horn's bell points BACK with the right hand inside it;
 *     a tuba's / euphonium's bell up or to the front; no bell, coil or valve
 *     passes through the player's body;
 *   • the air-column physics the HOW IT SOUNDS page draws: the closed–open
 *     pipe's pressure (most at the lips, still at the bell), odd ratios,
 *     still points; the wall reflection's image path and delay;
 *   • each lesson validates, has the 9 pages, sits in Lab 3, and its copy
 *     names ids that exist; the quick check has 6 items, 2 per foundation,
 *     one critical;
 *   • every recommended starting point is clear of every part in every
 *     variant it is offered, inside its own zone, and its centre (the start)
 *     is outside every keep-out with margin; no starting point is lowered
 *     into a bell;
 *   • the keep-outs are drawn only on approach (envelopeReveal).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Lesson } from '../src/screens/lab/miking/engine/model/types.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { LESSONS, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, surfaceDistance } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { EUPH, HORN, TUBA } from '../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassSpec.ts';
import { brassScene, flareR, segDist } from '../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassScene.ts';
import { pipeLowestHz, pipeRatio, pipeShape, reflection, spreadHalfAngle, stillPoints } from '../src/screens/lab/miking/lessons/shared/lowbrass/airColumn.ts';
import { A03_LESSON } from '../src/screens/lab/miking/lessons/a03Horn/lesson.ts';
import { A04A_LESSON } from '../src/screens/lab/miking/lessons/a04aTuba/lesson.ts';
import { A04B_LESSON } from '../src/screens/lab/miking/lessons/a04bEuphonium/lesson.ts';

const LAB3: Lesson[] = [A03_LESSON, A04A_LESSON, A04B_LESSON];
const len = (a: { x: number; y: number; z: number }) => Math.hypot(a.x, a.y, a.z);
const sub = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;

describe('the low-brass family (lessons/shared/lowbrass)', () => {
  it('the sourced bells and valves; the horn’s bell is a drawing default', () => {
    assert.equal(TUBA.bell.mm, 443);
    assert.equal(EUPH.bell.mm, 300);
    assert.equal(HORN.bell.placeholder, true);
    assert.equal(HORN.bell.prov.kind, 'unknown');
    assert.deepEqual([HORN.valves.n, HORN.valves.kind], [4, 'rotary']);
    assert.deepEqual([TUBA.valves.n, TUBA.valves.kind], [4, 'piston']);
    assert.equal(HORN.tube?.m, 3.75);
    assert.equal(TUBA.tube?.m, 5.5);
  });
  it('the horn’s bell points back (and out), with the right hand inside it', () => {
    const s = brassScene(HORN, 'back');
    assert.ok(s.bell.axis.x < -0.8, `axis ${JSON.stringify(s.bell.axis)}`);
    assert.ok(s.bell.axis.z > 0, 'out to the player’s right');
    const tip = s.bellHand!.tip;
    const along = dot(sub(tip, s.bell.throat), s.bell.axis) / len(sub(s.bell.rim, s.bell.throat));
    assert.ok(along > 0 && along < 1, 'the hand sits between the throat and the rim');
    const off = len(sub(sub(tip, s.bell.throat), { x: s.bell.axis.x * along * len(sub(s.bell.rim, s.bell.throat)), y: s.bell.axis.y * along * len(sub(s.bell.rim, s.bell.throat)), z: s.bell.axis.z * along * len(sub(s.bell.rim, s.bell.throat)) }));
    assert.ok(off < flareR(s.bell, along), 'inside the flare');
  });
  it('a tuba’s and a euphonium’s bell: up, or to the front', () => {
    for (const spec of [TUBA, EUPH]) {
      assert.ok(brassScene(spec, 'up').bell.axis.y < -0.95, `${spec.id} up`);
      assert.ok(brassScene(spec, 'front').bell.axis.x > 0.95, `${spec.id} front`);
    }
  });
  it('no bell rim, coil, valve or leadpipe end passes through the player’s torso or head', () => {
    for (const [spec, o] of [[HORN, 'back'], [TUBA, 'up'], [TUBA, 'front'], [EUPH, 'up'], [EUPH, 'front']] as const) {
      const s = brassScene(spec, o);
      const pts = [s.bell.rim, s.bell.throat, ...s.valves.map((v) => v.c), s.centre];
      for (const p of pts) {
        assert.ok(segDist(p, s.J.pelvis, s.J.neck) > 150, `${spec.id}/${o}: a part inside the torso at ${JSON.stringify(p)}`);
        assert.ok(len(sub(p, s.J.head)) > s.J.headR + 40, `${spec.id}/${o}: a part inside the head`);
      }
    }
  });
});

describe('the air column and the bell (airColumn.ts)', () => {
  it('the pressure swings most at the lips and stands still at the open bell', () => {
    for (let n = 1; n <= 6; n++) {
      assert.equal(pipeShape(n, 0), 1);
      assert.ok(Math.abs(pipeShape(n, 1)) < 1e-12);
    }
  });
  it('a plain closed–open pipe: odd ratios, n still points, the last at the bell', () => {
    assert.deepEqual([1, 2, 3, 4].map(pipeRatio), [1, 3, 5, 7]);
    for (let n = 1; n <= 6; n++) {
      const sp = stillPoints(n);
      assert.equal(sp.length, n);
      assert.equal(sp[n - 1], 1);
      for (const x of sp) assert.ok(Math.abs(pipeShape(n, x)) < 1e-9);
    }
    assert.ok(Math.abs(pipeLowestHz(1) - 85.75) < 1e-9);
  });
  it('the wall: the reflected way is longer, its delay at 343 m/s, the hit point on the wall', () => {
    const r = reflection({ x: -150, y: -690, z: 335 }, { x: 2200, y: -1150, z: 0 }, -1475);
    assert.ok(r.extra > 0);
    assert.ok(Math.abs(r.delayMs - r.extra / 343) < 1e-9);
    assert.equal(r.hit.x, -1475);
    // Image-source check: the two legs through the hit point add up to the reflected path.
    const a = len(sub(r.hit, { x: -150, y: -690, z: 335 }));
    const b = len(sub({ x: 2200, y: -1150, z: 0 }, r.hit));
    assert.ok(Math.abs(a + b - r.viaWall) < 1e-6);
    assert.ok(spreadHalfAngle('low') > spreadHalfAngle('mid') && spreadHalfAngle('mid') > spreadHalfAngle('high'));
  });
});

for (const lesson of LAB3) {
  describe(`${lesson.id} ${lesson.title}`, () => {
    const m = lesson.model;
    it('validates, has the 9 pages and sits in Lab 3 (Winds)', () => {
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
      assert.deepEqual(Object.keys(lesson.pages).sort(), [...PAGE_IDS].sort());
      assert.equal(lesson.labId, 'winds');
      assert.ok(LESSONS.some((x) => x.id === lesson.id && x.labId === 'winds'));
      assert.ok(lessonsOf('winds').some((x) => x.id === lesson.id));
      assert.equal(lessonById(lesson.id), lesson);
    });
    it('its copy names zones, wedges and items that exist', () => {
      const C = copyOf(lesson);
      const zid = new Set(lesson.zones.map((z) => z.id));
      for (const z of Object.values(C.placement.workedZone)) assert.ok(zid.has(z!), `worked ${z}`);
      assert.ok(zid.has(C.context.zone));
      assert.ok(lesson.live.wedges.some((w) => w.id === C.context.target));
      assert.ok(zid.has(C.twoMic.A.zone) && (!C.twoMic.B.zone || zid.has(C.twoMic.B.zone)));
      const sid = new Set(lesson.scenarios.map((s) => s.id));
      for (const id of [C.practice.gain, C.practice.second, ...C.practice.mixed, C.context.studioId]) assert.ok(sid.has(id), id);
      for (const id of C.context.shield) assert.ok(m.parts.some((p) => p.id === id), id);
      for (const t of Object.keys(C.placement.typeNotes)) assert.ok(lesson.micTypeIds.includes(t), t);
    });
    it('the quick check: six items, two per foundation, a critical one', () => {
      assert.equal(lesson.diagnostic.length, 6);
      for (const p of ['instrument', 'sound', 'setting'] as const) assert.equal(lesson.diagnostic.filter((d) => d.covers === p).length, 2, p);
      assert.ok(lesson.diagnostic.some((d) => d.critical));
    });
    it('every starting point: clear, inside its zone, its centre outside every keep-out with margin', () => {
      for (const z of lesson.zones) {
        const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? m.variants.map((v) => v.id);
        for (const v of variants) {
          const scene = compileScene(m, v);
          for (const t of z.requires?.micTypeIds ?? lesson.micTypeIds) {
            const mt = MIC_TYPES[t];
            assert.equal(checkAssembly(scene, z.start, micBodyOf(mt)), null, `${z.id}/${v}/${t}`);
            assert.ok(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: t, mount: mt.mount }, z.start), `${z.id}/${v}/${t} in zone`);
          }
          for (const e of m.envelopes.filter((e) => !e.variants || e.variants.includes(v))) assert.ok(sdf(e.shape, z.start.p) > 40, `${z.id}/${v}: inside ${e.id}`);
        }
      }
    });
    it('no starting point sits in a bell’s opening (the space just beyond the rim)', () => {
      for (const z of lesson.zones) {
        const s = m.surfaces.find((q) => q.id === z.refSurface)!;
        if (!s.id.startsWith('bell')) continue;
        assert.ok(surfaceDistance(m.surfaces, s.id, z.start) >= 300, `${z.id}`);
      }
    });
    it('the keep-outs are drawn on approach, and every one blocks a mic', () => {
      assert.ok((m.envelopeReveal ?? 0) > 0);
      const ids = new Set(compileScene(m, m.defaultVariant).solids.map((s) => s.partId));
      for (const e of m.envelopes.filter((e) => !e.variants || e.variants.includes(m.defaultVariant))) assert.ok(ids.has(e.id), e.id);
    });
  });
}

describe('the lessons’ own facts', () => {
  it('the horn: a bell-side spot measured from the bell, the front spots from the horn', () => {
    const z = (id: string) => A03_LESSON.zones.find((q) => q.id === id)!;
    assert.equal(z('hn.rear').refSurface, 'bell');
    assert.equal(z('hn.above').refSurface, 'centre');
    assert.equal(z('hn.below').refSurface, 'centre');
    assert.ok(z('hn.rear').start.p.x < -400, 'behind the player');
  });
  it('the tuba and euphonium: “about 2 ft above the bell” drawn round 61 cm, only for an upward bell', () => {
    for (const [l, id] of [[A04A_LESSON, 'tu.above'], [A04B_LESSON, 'eu.above']] as const) {
      const z = l.zones.find((q) => q.id === id)!;
      assert.ok(z.distance.min <= 609.6 && z.distance.max >= 609.6);
      assert.equal(z.requires?.variant, 'up');
    }
  });
  it('the tuba lesson no longer names an unsourced ribbon-on-solo-tuba example (LB-07)', () => {
    assert.doesNotMatch(JSON.stringify(A04A_LESSON), /solo tuba captured with/i);
  });
});
