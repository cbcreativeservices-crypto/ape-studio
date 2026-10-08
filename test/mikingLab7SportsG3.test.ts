/**
 * Miking Lab 7 part 2, group 3 — arenas, moving sources, complete coverage
 * (B15, B16, B17) and the shared pieces this group adds to lessons/shared/
 * sports: the practice room (practiceSmall, ONE scene for B15 and B16) and the
 * mock venue (practiceCrowd), the arena plans and their silhouettes, the
 * pass-by tool, the coverage planner, the downmix and M/S panel. Real
 * relationships, not re-runs of the implementation: the practice layouts
 * reproduce the lessons' printed ranges after the frame turn, every mic mark
 * and starting point is on an approved place, a mirror pair is in time all
 * along the walk and a moved one is not, an oblique aim holds the approach,
 * the channel counts come from the role table (4 = 1 + 1 + 2, 14 = 2 + 4 +
 * 4 + 4), the M/S mono sum is the Mid at every width, and no pitch number is
 * ever drawn.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { C20 } from '../src/screens/lab/miking/engine/physics/twoMic.ts';
import { aimRel, inPoly, keepClearAt, overlap, planRange, refusedAt, slantRange } from '../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts';
import { PC, PC_PRINTED, PRACTICE_CROWD, PRACTICE_SMALL, PS, PS_PRINTED, crowdP, smallP } from '../src/screens/lab/miking/lessons/shared/sports/practiceScenes.ts';
import { MOTOR_HORSE_WATER, TRACK_GYM_COMBAT, containerPlan, sportPlan } from '../src/screens/lab/miking/lessons/shared/sports/sportPlans.ts';
import { CONTAINER, WRESTLING, ringPts } from '../src/screens/lab/miking/lessons/shared/sports/arenaPlans.ts';
import { PITCH_NOTE, closestOnPath, dtSpan, pointAt, readPass, type PassCase, type PassMic } from '../src/screens/lab/miking/lessons/shared/sports/passBy.ts';
import { LAYOUTS, LAYOUT_IDS, ROLE_IDS, carrierFor, channelCount, countParts, roleChannels } from '../src/screens/lab/miking/lessons/shared/sports/coverage.ts';
import { DELIVERY, ITU_K, K_STEPS, MONO_SOURCES, downmixShareDb, monoChangeDb, msBalanceDb, msDecode, sideDb } from '../src/screens/lab/miking/lessons/shared/sports/downmix.ts';
import { SPORTS_SAFETY } from '../src/screens/lab/miking/lessons/shared/sports/safety.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS, lessonsOf } from '../src/screens/lab/miking/data/registry.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { itemRules } from './_mikingItemRules.ts';
import { B15_COVERAGE, B15_OVERLAP, B15_PLACE, B15_SETUPS } from '../src/screens/lab/miking/lessons/b15TrackGymCombat/model.ts';
import { B16_COVERAGE, B16_PASS, B16_PLACE, B16_SETUPS } from '../src/screens/lab/miking/lessons/b16MotorHorseWater/model.ts';
import { B17_COVERAGE, B17_MS_SOURCES, B17_OVERLAP, B17_PLACE, B17_SETUPS } from '../src/screens/lab/miking/lessons/b17CrowdComplete/model.ts';

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
const lesson = (x: number, y: number) => ({ x, y });

describe('practiceSmall (B15 = B16): the lessons’ own layout, one scene, by calculation', () => {
  it('the quarter turn keeps every distance: M1→B 2.00 m, M1→A/C √8 = 2.83 m, the double range 4 m', () => {
    // The lesson's own coordinates, measured directly, against the turned scene.
    const L = { A: lesson(0, 0), B: lesson(0, 2), C: lesson(0, 4), M1: lesson(2, 2), M2: lesson(-2, 2), M1far: lesson(4, 2) };
    for (const [a, b] of [['M1', 'A'], ['M1', 'B'], ['M1', 'C'], ['M2', 'B'], ['M1far', 'B']] as const) assert.ok(near(planRange(PS[a], PS[b]), planRange(L[a], L[b]), 1e-12), `${a}→${b}`);
    assert.equal(planRange(PS.M1, PS.B).toFixed(2), PS_PRINTED.B.toFixed(2));
    assert.equal(planRange(PS.M1, PS.A).toFixed(2), PS_PRINTED.A.toFixed(2));
    assert.equal(planRange(PS.M1, PS.C).toFixed(2), PS_PRINTED.C.toFixed(2));
    assert.equal(planRange(PS.M1far, PS.B).toFixed(1), PS_PRINTED.Bfar.toFixed(1));
    assert.ok(near(planRange(PS.M1, PS.A), Math.SQRT2 * 2, 1e-12));
    assert.deepEqual(smallP(0, 2), PS.B);
  });
  it('the 1 m capsule and clap height are the lessons’ own; slant = plan at equal heights', () => {
    assert.equal(PS.h, 1.0);
    for (const t of PRACTICE_SMALL.targets) assert.equal(t.h, PS.h);
    assert.ok(near(slantRange(PS.M1, PS.h, PS.B, PS.h), 2, 1e-12));
  });
  it('M1, M2 and the double-range place are approved and out of the walking path; A, B, C are in it; M1 faces into it', () => {
    for (const q of [PS.M1, PS.M2, PS.M1far]) {
      assert.equal(refusedAt(PRACTICE_SMALL, q), null);
      assert.equal(keepClearAt(PRACTICE_SMALL, q), null);
    }
    for (const t of PRACTICE_SMALL.targets) assert.ok(inPoly(t.p, PRACTICE_SMALL.play), t.id);
    assert.equal(Math.round(aimRel(PS.M1, PS.B)), 0, 'B straight ahead of M1');
    assert.equal(Math.round(Math.abs(aimRel(PS.M1, PS.A))), 45, 'A 45° off');
  });
});

describe('practiceCrowd (B17): the lesson’s own layout, by calculation', () => {
  it('the half turn keeps every distance: S→U2 2.0, S→U1/U3 2.24, S→A 4.0, D→A 2.0 m', () => {
    assert.equal(planRange(PC.S, PC.U2).toFixed(1), PC_PRINTED.SU2.toFixed(1));
    assert.equal(planRange(PC.S, PC.U1).toFixed(2), PC_PRINTED.SU1.toFixed(2));
    assert.equal(planRange(PC.S, PC.U3).toFixed(2), PC_PRINTED.SU1.toFixed(2));
    assert.equal(planRange(PC.S, PC.A).toFixed(1), PC_PRINTED.SA.toFixed(1));
    assert.equal(planRange(PC.D, PC.A).toFixed(1), PC_PRINTED.DA.toFixed(1));
    assert.ok(near(planRange(PC.S, PC.U1), Math.sqrt(5), 1e-12));
    assert.ok(near(planRange(PC.Sclose, PC.U2), 1, 1e-12), 'S′ is 1 m closer to U2');
    assert.deepEqual(crowdP(0, 4), PC.S);
  });
  it('left and right survive the turn: facing U2 from S, U3 (x = 1) is on the left, U1 on the right', () => {
    assert.ok(aimRel(PC.S, PC.U3) > 0);
    assert.ok(aimRel(PC.S, PC.U1) < 0);
    assert.equal(Math.round(aimRel(PC.S, PC.U2)), 0);
    const ms = Object.fromEntries(B17_MS_SOURCES.map((s) => [s.id, s.deg]));
    assert.ok(near(ms.u3, (Math.atan(0.5) * 180) / Math.PI, 1e-9));
  });
  it('S, S′, D and the commentary station stand on approved places outside the source area', () => {
    for (const q of [PC.S, PC.Sclose, PC.D, PC.K]) assert.equal(refusedAt(PRACTICE_CROWD, q), null);
    for (const t of PRACTICE_CROWD.targets) assert.ok(inPoly(t.p, PRACTICE_CROWD.play), t.id);
    assert.ok(PRACTICE_CROWD.marks.find((m) => m.id === 'K')?.placeholder);
  });
});

describe('the arena plans (D7-2 outlines, D7-1 clear-zone words, D7-3 silhouettes)', () => {
  for (const id of [...TRACK_GYM_COMBAT, ...MOTOR_HORSE_WATER, 'arena'] as const) {
    it(`${id}: approved places are clear of play, keep-clear space and routes; every drawing default is listed`, () => {
      const s = sportPlan(id);
      assert.ok(s.footprints.length >= 1);
      for (const f of s.footprints) {
        const c = { x: (f.rect.x0 + f.rect.x1) / 2, y: (f.rect.y0 + f.rect.y1) / 2 };
        assert.equal(refusedAt(s, c), null, `${f.id} centre`);
      }
      assert.ok(s.defaults.length >= 3);
      for (const k of s.keepClear) if (k.basis === 'rule') assert.match(k.note, /typical clear zone — check your event’s rules/);
    });
  }
  it('the wrestling border is the one rule clearance: a 1.5 m ring round a 9 m area, its hole open', () => {
    const w = sportPlan('wrestling');
    const k = w.keepClear.find((q) => q.basis === 'rule')!;
    assert.equal(WRESTLING.r * 2, 9);
    assert.equal(WRESTLING.border, 1.5);
    assert.ok(inPoly({ x: WRESTLING.r + 0.75, y: 0 }, k.poly), 'inside the border');
    assert.ok(!inPoly({ x: 0, y: 0 }, k.poly), 'the mat itself is not the border');
    assert.ok(!inPoly({ x: WRESTLING.r + WRESTLING.border + 0.5, y: 0 }, k.poly));
    assert.ok(inPoly({ x: 0.4, y: 0.4 }, w.play));
    assert.ok(!inPoly({ x: 0, y: 0 }, ringPts({ x: 0, y: 0 }, 1, 2)));
  });
  it('judo carries no rule number; only the circuit has cars and only the arena of horses a horse', () => {
    assert.ok(sportPlan('judo').keepClear.every((k) => k.basis !== 'rule'));
    assert.deepEqual(sportPlan('circuit').tokens?.map((t) => t.kind), ['car', 'car']);
    assert.deepEqual(sportPlan('jumping').tokens?.map((t) => t.kind), ['horse']);
    for (const id of [...TRACK_GYM_COMBAT, 'pool', 'arena'] as const) assert.ok(!sportPlan(id).tokens?.length, id);
  });
  it('the hydrophone container keeps its sensor in the water and the dry area out of the splash zone', () => {
    const c = containerPlan();
    assert.ok(inPoly(CONTAINER.sensor, c.play));
    const dry = c.footprints[0].rect;
    assert.equal(keepClearAt(c, { x: (dry.x0 + dry.x1) / 2, y: (dry.y0 + dry.y1) / 2 }), null);
    assert.ok(CONTAINER.depth < CONTAINER.water);
  });
});

describe('the pass-by tool (passBy.ts)', () => {
  const pm = (id: string, at: { x: number; y: number }, aimAt: { x: number; y: number }): PassMic => ({ id, label: id, at, h: PS.h, aimAt, aimH: PS.h, pattern: 'supercardioid' });
  const walk = [PS.A, PS.C];
  it('a path is walked by its length; the closest point of a straight walk is the foot of the perpendicular', () => {
    assert.deepEqual(pointAt(walk, 0.5), PS.B);
    const c = closestOnPath(walk, PS.M1);
    assert.ok(near(c.t, 0.5, 1e-12) && near(c.d, 2, 1e-12));
  });
  it('mirror places are in time all along the walk; the double-range place is not (a delay fits one point)', () => {
    const mirror: PassCase = { path: walk, hSrc: PS.h, mics: [pm('m1', PS.M1, PS.B), pm('m2', PS.M2, PS.B)] };
    assert.ok(dtSpan(mirror) < 1e-9);
    assert.ok(Math.abs(readPass(mirror, 0.2).dtMs) < 1e-9);
    const moved: PassCase = { path: walk, hSrc: PS.h, mics: [pm('m1', PS.M1far, PS.B), pm('m2', PS.M2, PS.B)] };
    assert.ok(dtSpan(moved) > 0.9, `${dtSpan(moved)}`);
    // At B: 4 m against 2 m → 2 m of path, Δt = 2000 / c ms.
    assert.ok(near(Math.abs(readPass(moved, 0.5).dtMs), 2000 / C20, 1e-9));
  });
  it('the level is read against each mic’s own loudest point, and doubling the distance costs about 6 dB', () => {
    const c: PassCase = { path: walk, hSrc: PS.h, mics: [pm('m1', PS.M1, PS.B)] };
    assert.ok(near(readPass(c, 0.5).mics[0].vsPeakDb, 0, 1e-6));
    assert.ok(near(readPass(c, 0.5).mics[0].byDistanceDb, 0, 1e-9));
    assert.ok(near(readPass(c, 0).mics[0].byDistanceDb, 20 * Math.log10(Math.SQRT2), 1e-9), '2.83 m against 2 m');
  });
  it('an oblique aim holds the approach and gives up the departure; across is symmetric', () => {
    const across: PassCase = { path: walk, hSrc: PS.h, mics: [pm('m1', PS.M1, PS.B)] };
    const oblique: PassCase = { path: walk, hSrc: PS.h, mics: [pm('m1', PS.M1, PS.A)] };
    assert.ok(readPass(oblique, 0).mics[0].vsPeakDb > readPass(across, 0).mics[0].vsPeakDb + 2);
    assert.ok(readPass(oblique, 1).mics[0].vsPeakDb < readPass(across, 1).mics[0].vsPeakDb - 2);
    assert.ok(near(readPass(across, 0).mics[0].vsPeakDb, readPass(across, 1).mics[0].vsPeakDb, 1e-9));
  });
  it('no pitch or speed number, ever: the pitch note carries no digit', () => {
    assert.doesNotMatch(PITCH_NOTE, /\d/);
    assert.match(PITCH_NOTE, /not a speed measurement/);
  });
});

describe('the coverage planner (coverage.ts): counts computed from the roles', () => {
  it('minimal = 1 + 1 + 2 = 4 mic channels; extensive = 2 + 4 + 4 + 4 = 14 (B17-01, by arithmetic)', () => {
    assert.deepEqual(countParts('minimal'), [1, 1, 2]);
    assert.equal(channelCount('minimal'), 4);
    assert.deepEqual(countParts('extensive'), [2, 4, 4, 4]);
    assert.equal(channelCount('extensive'), 14);
    for (const l of LAYOUT_IDS) assert.equal(ROLE_IDS.reduce((a, r) => a + roleChannels(l, r), 0), channelCount(l));
  });
  it('the failure drill: another input of the role first, then the role’s fallback, else an honest gap', () => {
    assert.equal(carrierFor('minimal', 'a1').by?.id, 'pair');
    assert.equal(carrierFor('minimal', 'a1').kind, 'fallback');
    assert.equal(carrierFor('minimal', 'c1').kind, 'gap');
    assert.equal(carrierFor('extensive', 'c1').by?.id, 'c2');
    assert.equal(carrierFor('extensive', 'main4').by?.role, 'spots');
    assert.equal(carrierFor('extensive', 'spotA').by?.id, 'spotB');
    for (const l of LAYOUT_IDS) for (const q of LAYOUTS[l].inputs) assert.ok(carrierFor(l, q.id).words.length > 20);
  });
  it('B17’s channel-count check is computed from the planner, never typed', () => {
    const q = lessonById('B17')!.scenarios.find((s) => s.id === 'cc.ctx.1')!;
    assert.equal(q.correct, `${channelCount('minimal')} mic channels`);
  });
});

describe('the downmix and the M/S matrix (downmix.ts)', () => {
  it('M = (L + R) / 2: a centred source keeps its level, one side drops 6 dB, a diffuse bed about 3 dB', () => {
    const by = Object.fromEntries(MONO_SOURCES.map((s) => [s.id, monoChangeDb(s.gL, s.gR, s.correlated)]));
    assert.ok(near(by.centre, 0, 1e-9));
    assert.ok(near(by.side, -20 * Math.log10(2), 1e-9));
    assert.ok(near(by.diffuse, -10 * Math.log10(2), 1e-9));
  });
  it('the fold-down coefficient is −3 dB; the delivery card is one example: −23 LUFS, ±1 LU live, −1 dBTP', () => {
    assert.equal(ITU_K, 0.7071);
    assert.ok(near(downmixShareDb(), -3.01, 0.01));
    assert.deepEqual({ ...DELIVERY }, { lufs: -23, liveLu: 1, dBTP: -1 });
  });
  it('M/S: (L + R) / 2 = M at every width; a left source favours L more as k grows; k = 1 is the Side at the Mid’s level', () => {
    for (const k of K_STEPS) for (const th of [-90, -30, 0, 26.6, 60, 180]) {
      const d = msDecode(th, k);
      assert.ok(near(d.mono, msDecode(th, 0).L, 1e-12), `${k} ${th}`);
    }
    assert.ok(msBalanceDb(30, 0.5) > 0 && msBalanceDb(30, 1) > msBalanceDb(30, 0.5));
    assert.ok(near(msBalanceDb(0, 1), 0, 1e-9));
    assert.equal(sideDb(1), 0);
  });
});

/* ═════════ the three lessons ═════════ */

const G3 = ['B15', 'B16', 'B17'] as const;

describe('Lab 7 part 2, group 3: registry and validity', () => {
  it('B15, B16, B17 are ready lessons of the broadcast lab, in one contiguous block', () => {
    const ids = lessonsOf('broadcast').map((l) => l.id);
    for (const id of G3) assert.ok(ids.includes(id), id);
    const at = LESSONS.findIndex((l) => l.id === 'B15');
    assert.deepEqual(LESSONS.slice(at, at + 3).map((l) => l.id), [...G3]);
  });
  for (const id of G3) {
    it(`${id} validates and follows the item-writing rules`, () => {
      const l = lessonById(id)!;
      assert.equal(l.labId, 'broadcast');
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      itemRules(l);
    });
  }
  it('the safety words reach the lessons: lightning everywhere, the horse rule on B16', () => {
    for (const id of G3) assert.match(lessonById(id)!.accuracyDetail, /30 minutes after the last thunder/);
    assert.match(SPORTS_SAFETY.animals.text, /No mic on a horse, its tack or its rider/);
    assert.ok(lessonById('B16')!.scenarios.some((s) => /horse|bridle/.test(s.prompt) && /Never a mic on a horse/.test(s.explain)));
  });
});

describe('the placement zones and setups sit in approved, clear places', () => {
  const cases = [
    { id: 'B15', scene: PRACTICE_SMALL, zones: B15_PLACE, setups: B15_SETUPS, coverage: B15_COVERAGE },
    { id: 'B16', scene: PRACTICE_SMALL, zones: B16_PLACE, setups: B16_SETUPS, coverage: B16_COVERAGE },
    { id: 'B17', scene: PRACTICE_CROWD, zones: B17_PLACE, setups: B17_SETUPS, coverage: B17_COVERAGE },
  ];
  for (const c of cases) {
    it(`${c.id}: every zone centre is on an approved place, out of play and keep-clear space; every target exists`, () => {
      for (const z of c.zones) {
        const centre = { x: (z.rect.x0 + z.rect.x1) / 2, y: (z.rect.y0 + z.rect.y1) / 2 };
        assert.equal(refusedAt(c.scene, centre), null, z.id);
        assert.ok(c.scene.targets.some((t) => t.id === z.target), z.id);
        assert.ok(z.h[0] <= z.h[1]);
      }
    });
    it(`${c.id}: ONE MIC first, at least four core roles; every practice-scene mic approved; sport plans print no range`, () => {
      assert.equal(c.setups[0].role, 'ONE MIC');
      assert.ok(c.setups.filter((s) => s.core).length >= 4);
      for (const s of c.setups) {
        if (s.scene) {
          assert.ok(s.noRange, `${s.id}: a sport outline prints no range`);
          for (const m of s.mics) if (s.scene.id !== 'container') assert.equal(refusedAt(s.scene, m.at), null, `${s.id}/${m.id}`);
          continue;
        }
        for (const m of s.mics) assert.equal(refusedAt(c.scene, m.at), null, `${s.id}/${m.id}`);
      }
    });
    it(`${c.id}: the coverage map has a zone that is not detail, and every zone a handoff`, () => {
      assert.ok(c.coverage.some((z) => !z.ok.includes('detail')));
      for (const z of c.coverage) assert.ok(z.handoff.length > 5 && z.ok.length >= 1);
    });
  }
  it('the overlap pairs change their delay as the source walks (B15, B17); B16’s mirror pair does not until it moves', () => {
    for (const o of [B15_OVERLAP, B17_OVERLAP]) {
      const h = o === B17_OVERLAP ? PC.hA : PS.h;
      const d = o.path.map((p) => overlap(p, h, o.a.at, o.a.h, o.b.at, o.b.h).dtMs);
      assert.ok(Math.max(...d) - Math.min(...d) > 0.9, d.join(', '));
    }
    const mic = (m: (typeof B16_PASS)['m1']): PassMic => ({ id: m.id, label: m.label, at: m.at, h: m.h, aimAt: m.aimAt, aimH: m.aimH, pattern: 'supercardioid' });
    assert.ok(dtSpan({ path: B16_PASS.path, hSrc: PS.h, mics: [mic(B16_PASS.m1), mic(B16_PASS.m2)] }) < 1e-9);
    assert.ok(dtSpan({ path: B16_PASS.path, hSrc: PS.h, mics: [mic(B16_PASS.far), mic(B16_PASS.m2)] }) > 0.9);
  });
  it('B16 keeps the optional hydrophone as ONE non-core ANOTHER START, in its container (D7-4 default)', () => {
    const h = B16_SETUPS.filter((s) => s.mics.some((m) => m.kind === 'hydrophone'));
    assert.equal(h.length, 1);
    assert.equal(h[0].role, 'ANOTHER START');
    assert.ok(!h[0].core && h[0].noRange && h[0].scene?.id === 'container');
  });
});
