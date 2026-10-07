/**
 * Miking Lab 5 — the shared STEREO-ARRAY TOOL and SEATING BUILDER (frame S),
 * and the arrays-and-orchestra lessons built on them (E11, E13, E14).
 * Real relationships, never the implementation re-run:
 *
 *   arrays    ORTF is 170 mm / 110° whatever the tilt, with its 95° recording
 *             angle; X/Y 90–135°; A/B 40–60 cm to start, clamped 0.4–2.5 m;
 *             the tree 2 m × 1.5 m with every capsule pair ≥ 1.5 m and its
 *             centre 4–5 dB down; the compact tree flagged under 1.5 m; M/S a
 *             cardioid forward and a figure-8 across; 1 m of path = 2.9 ms;
 *             3:1 is a separate-mic test
 *   seating   the conductor's-view order of the strings per preset (modern:
 *             violins left, cellos right, basses behind them; antiphonal:
 *             2nd violins right, cellos and basses beside the 1sts); no two
 *             players on top of each other; the quartet's two orders
 *   lessons   every setup's array clear of the players and the conductor,
 *             nothing floating (every stand on the floor), supports 1–1.5 m
 *             from three or four players, two Placement zones per seating,
 *             the worked example inside a zone, learner words clean
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ARRAYS, ARRAY_IDS, arrayCapsules, dtLR, includedAngle, insideRecordingAngle, pairSpacing, threeToOne, treeSpacings, TREE_CENTRE_DB, TREE_MIN_GAP } from '../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts';
import { arrayClear, covered, edges, headTop, seatingOf, seatsOf, soundPoint, type SeatingId } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { aimOf, dirOf, dist, planDir, uv, v3 } from '../src/screens/lab/miking/lessons/shared/ensemble/frameS.ts';
import { deltaTms } from '../src/screens/lab/miking/engine/physics/twoMic.ts';
import { ENSEMBLE_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleMics.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { lessonMeta } from '../src/screens/lab/miking/data/registry.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';
import { BANNED_FORMS, BRAND_NAMES } from './mikingLearnerText.test.ts';

const DEG = Math.PI / 180;
const C = v3(0, -3200, 1500);
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;

describe('the stereo-array tool', () => {
  it('ORTF: 170 mm and 110° between the axes at any tilt; a 95° recording angle', () => {
    for (const tilt of [0, 25, 40]) {
      const caps = arrayCapsules('ortf', {}, { c: C, face: 0, tilt });
      assert.ok(near(pairSpacing(caps), 170), `${tilt}: ${pairSpacing(caps)}`);
      assert.ok(near(includedAngle(caps), 110, 0.01), `${tilt}: ${includedAngle(caps)}`);
    }
    assert.equal(ARRAYS.ortf.recordingAngle, 95);
    assert.equal(ARRAYS.ortf.locked, true);
    for (const id of ARRAY_IDS) if (id !== 'ortf') assert.equal(ARRAYS[id].recordingAngle, null, `${id}: no recording angle is invented`);
  });
  it('the left capsule points left (as the array faces the players) and the right one right', () => {
    const caps = arrayCapsules('ortf', {}, { c: C, face: 0, tilt: 0 });
    const L = caps.find((q) => q.id === 'L')!;
    assert.ok(L.p.x < 0 && L.dir.x < 0, 'the conductor’s left is −x');
    // A source on the left reaches the left capsule first.
    assert.ok(dtLR(caps, v3(-3000, -1000, -2000)) > 0);
  });
  it('X/Y: coincident, 90° to start, 90–135° by its angle, clamped', () => {
    assert.ok(near(includedAngle(arrayCapsules('xy', {}, { c: C, tilt: 30 })), 90, 0.01));
    assert.ok(near(includedAngle(arrayCapsules('xy', { angle: 120 }, { c: C })), 120, 0.01));
    assert.ok(near(includedAngle(arrayCapsules('xy', { angle: 170 }, { c: C })), 135, 0.01));
    assert.ok(pairSpacing(arrayCapsules('xy', {}, { c: C })) < 30, 'capsules together (stacked)');
  });
  it('A/B: 50 cm to start (40–60 cm usual), clamped 0.4–2.5 m; omnis', () => {
    assert.ok(near(pairSpacing(arrayCapsules('ab', {}, { c: C })), 500));
    assert.ok(near(pairSpacing(arrayCapsules('ab', { spacing: 100 }, { c: C })), 400));
    assert.ok(near(pairSpacing(arrayCapsules('ab', { spacing: 9000 }, { c: C })), 2500));
    assert.ok(arrayCapsules('ab', {}, { c: C }).every((q) => q.pattern === 'omni'));
  });
  it('M/S: a cardioid Mid forward and a figure-8 Side across it', () => {
    const caps = arrayCapsules('ms', {}, { c: C, face: 0, tilt: 20 });
    const M = caps.find((q) => q.id === 'M')!;
    const S = caps.find((q) => q.id === 'S')!;
    assert.equal(M.pattern, 'cardioid');
    assert.equal(S.pattern, 'figure8');
    assert.ok(Math.abs(S.dir.x) > 0.99, 'the Side faces across');
    assert.equal(S.route, 'S');
  });
  it('the tree: 2 m wide, the centre 1.5 m ahead, every pair ≥ 1.5 m; the centre 4–5 dB down into both sides', () => {
    const caps = arrayCapsules('tree', {}, { c: C, face: 0, tilt: 25 });
    const t = treeSpacings(caps);
    assert.ok(near(t.LR, 2000) && near(t.LC, Math.hypot(1000, 1500)) && t.ok);
    assert.ok(t.min >= TREE_MIN_GAP);
    const c = caps.find((q) => q.id === 'C')!;
    assert.equal(c.route, 'LR');
    assert.ok(c.levelDb >= TREE_CENTRE_DB.min && c.levelDb <= TREE_CENTRE_DB.max);
    assert.ok(c.p.z < C.z, 'the centre mic is ahead, toward the players');
    assert.ok(caps.every((q) => q.pattern === 'omni'));
    // The outward turn: 0–45°.
    const turned = arrayCapsules('tree', { turn: 90 }, { c: C, face: 0, tilt: 0 });
    const L = turned.find((q) => q.id === 'L')!;
    assert.ok(near(Math.acos(-L.dir.z) / DEG, 45, 0.01));
  });
  it('the compact tree from practice is flagged: its pairs are under 1.5 m', () => {
    const t = treeSpacings(arrayCapsules('treeCompact', {}, { c: C }));
    assert.ok(!t.ok && near(t.LR, 1524));
  });
  it('outriggers: two omnis on their own, the span asked for, at the tree’s height', () => {
    const caps = arrayCapsules('tree', { outriggers: true, outSpan: 6096, outU: -1500 }, { c: C });
    const OL = caps.find((q) => q.id === 'OL')!;
    const OR = caps.find((q) => q.id === 'OR')!;
    assert.ok(near(dist(OL.p, OR.p), 6096) && near(OL.p.y, C.y) && OL.route === 'L' && OR.route === 'R');
  });
  it('time: 1 m of path is 2.9 ms (the calculator’s speed of sound)', () => {
    assert.ok(near(deltaTms(1000), 2.914, 0.002));
  });
  it('the recording angle is read from above: a source on the axis is inside, one 60° off is outside', () => {
    const place = { c: C, face: 0, tilt: 25 };
    assert.equal(insideRecordingAngle('ortf', place, v3(0, -1000, -3000)), true);
    const off = v3(C.x + Math.sin(60 * DEG) * 4000, -1000, C.z - Math.cos(60 * DEG) * 4000);
    assert.equal(insideRecordingAngle('ortf', place, off), false);
    assert.equal(insideRecordingAngle('ab', place, v3(0, -1000, -3000)), null);
  });
  it('3:1 is a test for separate mics: mic-to-mic ≥ 3 × the larger mic-to-source distance', () => {
    assert.ok(threeToOne(v3(0, 0, 0), v3(0, 0, 300), v3(1000, 0, 0), v3(1000, 0, 300)).ok);
    assert.ok(!threeToOne(v3(0, 0, 0), v3(0, 0, 500), v3(1000, 0, 0), v3(1000, 0, 500)).ok);
  });
  it('the frame’s aim conversion round-trips', () => {
    for (const d of [v3(0, 0.4, -1), v3(1, -0.2, 0.3), v3(-0.3, 0.9, 0.1)]) {
      const a = aimOf(d);
      const back = dirOf(a.az, a.el);
      const L = Math.hypot(d.x, d.y, d.z);
      assert.ok(near(back.x, d.x / L, 1e-9) && near(back.y, d.y / L, 1e-9) && near(back.z, d.z / L, 1e-9));
    }
  });
});

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const meanX = (id: SeatingId, sec: string) => mean(seatsOf(seatingOf(id), sec).map((q) => q.p.x));

describe('the seating builder (frame S, the conductor’s view)', () => {
  it('modern layout: high to low, left to right; the basses behind the cellos', () => {
    const id: SeatingId = 'orch.american';
    assert.ok(meanX(id, 'vn1') < meanX(id, 'vn2') && meanX(id, 'vn2') < meanX(id, 'va') && meanX(id, 'va') < meanX(id, 'vc'));
    const s = seatingOf(id);
    const back = (sec: string) => mean(seatsOf(s, sec).map((q) => Math.hypot(q.p.x, q.p.z - s.podium!.c.z)));
    assert.ok(meanX(id, 'cb') > 0 && back('cb') > back('vc'));
  });
  it('antiphonal layout: 1sts left, 2nds right facing them; cellos and basses beside the 1sts, violas beside the 2nds', () => {
    const id: SeatingId = 'orch.german';
    assert.ok(meanX(id, 'vn1') < -1500 && meanX(id, 'vn2') > 1500);
    assert.ok(meanX(id, 'vc') < meanX(id, 'va') && meanX(id, 'cb') < meanX(id, 'va'));
  });
  it('both orchestras: the same players; winds behind the strings, brass behind the winds, timpani at the back', () => {
    for (const id of ['orch.american', 'orch.german'] as const) {
      const s = seatingOf(id);
      assert.equal(s.seats.length, 57);
      const z = (sec: string) => mean(seatsOf(s, sec).map((q) => q.p.z));
      assert.ok(z('fl') < z('vn2') && z('hn') < z('cl') && z('timp') < z('tpt'));
      assert.ok(s.podium && s.conductor && s.conductor.p.z > 0, 'the conductor stands downstage of the front row');
    }
  });
  it('nobody sits on anybody: every two players at least 0.5 m apart in plan', () => {
    for (const id of ['orch.american', 'orch.german', 'strings.american', 'chamber.mixed', 'quartet.arc', 'quartet.arcVa'] as const) {
      const s = seatingOf(id);
      for (let i = 0; i < s.seats.length; i++)
        for (let j = i + 1; j < s.seats.length; j++) {
          const a = s.seats[i].p;
          const b = s.seats[j].p;
          assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 500, `${id}: ${s.seats[i].id} / ${s.seats[j].id}`);
        }
    }
  });
  it('the quartet: 1st violin on the left; the two orders swap the viola and the cello', () => {
    const a = seatingOf('quartet.arc');
    const b = seatingOf('quartet.arcVa');
    const order = (s: ReturnType<typeof seatingOf>) => [...s.seats].sort((p, q) => p.p.x - q.p.x).map((q) => q.section);
    assert.deepEqual(order(a), ['vn1', 'vn2', 'va', 'vc']);
    assert.deepEqual(order(b), ['vn1', 'vn2', 'vc', 'va']);
    assert.equal(edges(a).left.section, 'vn1');
  });
  it('every player faces the conductor or the group’s centre (never away from the hall)', () => {
    for (const id of ['orch.american', 'chamber.mixed', 'quartet.arc'] as const) {
      for (const q of seatingOf(id).seats) assert.ok(planDir(q.face).z > -0.2 || q.kind === 'piano', `${id}: ${q.id} faces ${q.face}`);
    }
  });
  it('sound points sit where the instruments do: cellos low, violins at the shoulder, risers counted', () => {
    const s = seatingOf('orch.american');
    const h = (sec: string) => -soundPoint(seatsOf(s, sec)[0]).y;
    assert.ok(h('vc') < h('vn1') && h('tbn') > 1000 + 300 && h('timp') > 800);
    assert.ok(headTop(seatsOf(s, 'cb')[0]) > headTop(seatsOf(s, 'vc')[0]), 'the basses stand');
  });
  it('the views map frame S as documented: plan is the conductor’s view, the section looks from the conductor’s right', () => {
    const p = v3(-1000, -500, -2000);
    assert.deepEqual(uv('plan', p), { u: -1000, v: -2000 });
    assert.deepEqual(uv('front', p), { u: -1000, v: -500 });
    assert.deepEqual(uv('section', p), { u: 2000, v: -500 });
  });
});

const LESSONS = ['E11', 'E13', 'E14'].map((id) => lessonById(id) as EnsembleLesson);

describe('the arrays-and-orchestra lessons', () => {
  it('are registered in Lab 5 and carry their stage data', () => {
    for (const L of LESSONS) {
      assert.ok(L && L.ensemble, L?.id);
      assert.equal(lessonMeta(L.id)?.labId, 'ensembles');
      for (const v of L.model.variants) assert.ok(L.ensemble.seatings[v.id], `${L.id}/${v.id}: a seating`);
    }
  });
  it('every setup is drawn whole and safe: arrays clear of the players and the conductor, every stand on the floor', () => {
    for (const L of LESSONS) {
      for (const s of L.ensemble.setups) {
        const variants = s.variants ?? L.model.variants.map((v) => v.id);
        assert.ok(s.rig || s.singles?.length, `${L.id} ${s.id}: something to draw`);
        for (const v of variants) {
          const seat = seatingOf(L.ensemble.seatings[v]);
          if (s.rig) {
            const caps = arrayCapsules(s.rig.id, s.rig.params, s.rig.place);
            for (const c of caps) {
              assert.ok(c.p.y < 0, `${L.id} ${s.id}: a capsule above the floor`);
              for (const q of [...seat.seats, ...(seat.conductor ? [seat.conductor] : [])]) {
                const clearH = -c.p.y > headTop(q) + (q.kind === 'conductor' ? 600 : 150);
                assert.ok(clearH || Math.hypot(c.p.x - q.p.x, c.p.z - q.p.z) >= 450, `${L.id} ${s.id}/${v}: ${c.id} over ${q.id}`);
              }
            }
            if (s.rig.id === 'tree') assert.ok(treeSpacings(caps).ok, `${L.id} ${s.id}: the tree keeps 1.5 m`);
            const m = s.rig.mount ?? { kind: 'stand' as const };
            const f = planDir(s.rig.place.face ?? 0);
            const c0 = s.rig.place.c;
            const foot = m.kind === 'boom' ? v3(c0.x - f.x * m.reach, 0, c0.z - f.z * m.reach) : v3(c0.x, 0, c0.z);
            assert.equal(arrayClear(seat, caps, foot), null, `${L.id} ${s.id}/${v}`);
          }
        }
      }
    }
  });
  it('supports sit 1–1.5 m from three or four players and are aimed across them', () => {
    for (const L of LESSONS) {
      for (const z of L.zones.filter((q) => q.src === 'DPA-MULTI')) {
        const surf = L.model.surfaces.find((s) => s.id === z.refSurface)!;
        const d = dist(z.start.p, surf.point);
        assert.ok(d >= 1000 && d <= 1500, `${L.id} ${z.id}: ${d.toFixed(0)} mm`);
        const v = z.requires?.variants?.[0] ?? L.model.defaultVariant;
        const seat = seatingOf(L.ensemble.seatings[v]);
        const n = covered(seat, z.start.p, dirOf(z.start.az, z.start.el), 60, 2200).length;
        assert.ok(n >= 3, `${L.id} ${z.id}: covers ${n}`);
      }
    }
  });
  it('each seating has two Placement starting points, and the worked example starts inside one', () => {
    for (const L of LESSONS) {
      for (const v of L.model.variants) {
        const zones = L.ensemble.placeZones.filter((z) => !z.variants || z.variants.includes(v.id));
        assert.ok(zones.length >= 2, `${L.id}/${v.id}`);
        const w = L.ensemble.setups.find((s) => s.id === L.ensemble.worked[v.id]);
        assert.ok(w?.rig, `${L.id}/${v.id}: a worked rig`);
        const c = w!.rig!.place.c;
        assert.ok(zones.some((z) => c.x >= z.box.min.x && c.x <= z.box.max.x && c.y >= z.box.min.y && c.y <= z.box.max.y && c.z >= z.box.min.z && c.z <= z.box.max.z), `${L.id}/${v.id}: the worked example in a zone`);
      }
    }
  });
  it('STARTING SETUPS: at least four setups to look at per seating, at least one of them a main array', () => {
    for (const L of LESSONS) {
      for (const v of L.model.variants) {
        const core = L.ensemble.setups.filter((s) => s.core && (!s.variants || s.variants.includes(v.id)));
        assert.ok(core.length >= 4, `${L.id}/${v.id}: ${core.length}`);
        assert.ok(core.some((s) => s.rig && !s.singles), `${L.id}/${v.id}: a main array alone`);
      }
    }
  });
  it('learner words in the shared tool and mic types are clean (no sources, brands or badges)', () => {
    const RE = new RegExp(`\\b(?:${BRAND_NAMES.join('|')})\\b`);
    const words: string[] = [];
    for (const d of Object.values(ARRAYS)) words.push(d.name, d.short, d.what, d.tends, d.check);
    for (const t of Object.values(ENSEMBLE_MIC_TYPES)) words.push(t.label, t.short, t.blurb, t.power, ...t.patterns.map((p) => p.label));
    for (const id of ['orch.american', 'chamber.mixed', 'quartet.arc'] as const) for (const s of seatingOf(id).sections) words.push(s.label, s.short, s.radiates);
    const bad = words.filter((w) => RE.test(w) || BANNED_FORMS.some((f) => f.test(w)));
    assert.deepEqual(bad, []);
    assert.ok(!words.some((w) => /Decca/.test(w)), 'the tree is named by what it is');
  });
});
