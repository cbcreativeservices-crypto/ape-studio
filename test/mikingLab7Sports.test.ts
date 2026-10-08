/**
 * Miking Lab 7 part 2, group 2 — the shared sports kit (lessons/shared/
 * sports: the venue plan builder, the practice scenes, the sport plans, the
 * headroom chain, the parabolic dish, the boundary and plant tools, the one
 * safety card). Real relationships, not re-runs of the implementation: the
 * practice layouts reproduce the lessons' printed ranges and aims, a mic's
 * mark is never in keep-clear space, every sport plan's approved places are
 * clear of its play and keep-clear areas, the dish focuses on the axis and
 * not off it, the boundary notch is c / 4h, the chain's first overloaded
 * stage is the one that clipped, and the safety words are exact.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { C20, deltaTms, notchesHz } from '../src/screens/lab/miking/engine/physics/twoMic.ts';
import {
  aimRel,
  bandAround,
  degOf,
  dirFromDeg,
  fromEngine,
  inPoly,
  keepClearAt,
  offAxisDeg,
  overlap,
  planRange,
  rangeDb,
  reachable,
  refusedAt,
  slantRange,
  toEngine,
  type P2,
} from '../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts';
import { FIELD_RECT, PF, PF_ARC, PF_PRINTED, PL, PL_PRINTED, PRACTICE_FIELD, PRACTICE_LINE, alongTargets } from '../src/screens/lab/miking/lessons/shared/sports/practiceScenes.ts';
import { COURT_SPORTS, FIELD_SPORTS, sportPlan } from '../src/screens/lab/miking/lessons/shared/sports/sportPlans.ts';
import { EVENT_IDS, HEADROOM_DEFAULTS, START_SETTINGS, TRIAL_DBFS, chainGood, readChain } from '../src/screens/lab/miking/lessons/shared/sports/headroom.ts';
import { AIM_TRIALS, DISHES, focalLength, gainOnsetHz, halfWidthAt, raySet, reflectRay, spreadAt } from '../src/screens/lab/miking/lessons/shared/sports/parabolic.ts';
import { HEIGHTS, firstNotch, paths, perpendicularNotch } from '../src/screens/lab/miking/lessons/shared/sports/boundary.ts';
import { INDOOR_ROWS, OUTDOOR_ROWS, SPORTS_SAFETY } from '../src/screens/lab/miking/lessons/shared/sports/safety.ts';
import { SPORTS_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/sports/sportsMics.ts';

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

describe('frame P (venuePlan.ts)', () => {
  it('round-trips through the engine frame: x along, y into the field (−z), h up (−y)', () => {
    const p: P2 = { x: 15, y: -6 };
    const e = toEngine(p, 1.2);
    assert.deepEqual(e, { x: 15000, y: -1200, z: 6000 });
    const back = fromEngine(e);
    assert.ok(near(back.p.x, 15, 1e-9) && near(back.p.y, -6, 1e-9) && near(back.h, 1.2, 1e-9));
  });
  it('left is positive: a target at smaller x, facing into the field, is to the LEFT', () => {
    assert.ok(aimRel(PF.M, PF.B) > 0);
    assert.ok(aimRel(PF.M, { x: 25, y: 10 }) < 0);
    assert.ok(near(degOf(dirFromDeg(32)), 32, 1e-9));
  });
  it('slant range adds the height difference; the inverse-square rule is 6 dB per doubling', () => {
    assert.ok(near(slantRange({ x: 0, y: 0 }, 0, { x: 3, y: 0 }, 4), 5, 1e-12));
    assert.ok(near(rangeDb(10, 20), 20 * Math.log10(2), 1e-9));
  });
  it('two mics on one source: Δt from the calculator’s speed of sound, notches at odd multiples of 1/(2Δt)', () => {
    const o = overlap({ x: 0, y: 10 }, 0, { x: 0, y: 0 }, 0, { x: 0, y: -3.432 }, 0);
    assert.ok(near(o.dtMs, deltaTms(3432), 1e-9));
    assert.ok(near(o.dtMs, 3432 / C20, 1e-9));
    assert.deepEqual(o.notches, notchesHz(o.dtMs, 1, 20000, 4));
    assert.ok(near(o.notches[0], 1000 / (2 * o.dtMs), 1e-6));
  });
});

describe('practiceField (B13): the lesson’s own layout, by calculation', () => {
  it('30 × 20 m; M (15, −6) outside it; A, B, C inside', () => {
    assert.deepEqual(FIELD_RECT, { x0: 0, y0: 0, x1: 30, y1: 20 });
    assert.ok(!inPoly(PF.M, PRACTICE_FIELD.play));
    for (const t of PRACTICE_FIELD.targets) assert.ok(inPoly(t.p, PRACTICE_FIELD.play), t.id);
  });
  it('the printed ranges and aims from M: 10.0 m 0°, 18.9 m 32° left, 24.0 m 0°', () => {
    for (const id of ['A', 'B', 'C'] as const) {
      const t = PRACTICE_FIELD.targets.find((q) => q.id === id)!;
      assert.equal(planRange(PF.M, t.p).toFixed(1), PF_PRINTED[id].range.toFixed(1), id);
      assert.equal(Math.round(aimRel(PF.M, t.p)), PF_PRINTED[id].aim, id);
    }
    // √(10² + 16²) = 18.87, atan(10/16) = 32.0° (field_diamond/SOURCES.md L118–L135).
    assert.ok(near(planRange(PF.M, PF.B), Math.sqrt(356), 1e-12));
    assert.ok(near(aimRel(PF.M, PF.B), (Math.atan(10 / 16) * 180) / Math.PI, 1e-9));
  });
  it('M and E stand on the approved crew strip, out of the keep-clear offset; every target is reachable inside the turn arc', () => {
    assert.equal(refusedAt(PRACTICE_FIELD, PF.M), null);
    assert.equal(refusedAt(PRACTICE_FIELD, PF.E), null);
    assert.ok(keepClearAt(PRACTICE_FIELD, { x: 15, y: -3 }), 'the offset is keep-clear');
    assert.equal(refusedAt(PRACTICE_FIELD, { x: 15, y: 2 })?.kind, 'play');
    for (const t of PRACTICE_FIELD.targets) assert.ok(reachable(PF_ARC, t.p), t.id);
  });
  it('the two shotgun heights are the lesson’s own trials (1.2 m, 0.6 m); E is a drawing default', () => {
    assert.equal(PF.hHigh, 1.2);
    assert.equal(PF.hLow, 0.6);
    assert.ok(PRACTICE_FIELD.marks.find((m) => m.id === 'E')?.placeholder);
    assert.ok(!PRACTICE_FIELD.marks.find((m) => m.id === 'M')?.placeholder);
  });
  it('the walking source runs A → B → C', () => {
    assert.deepEqual(alongTargets(PRACTICE_FIELD, 0), PF.A);
    assert.deepEqual(alongTargets(PRACTICE_FIELD, 1), PF.B);
    assert.ok(near(alongTargets(PRACTICE_FIELD, 1.999999).y, PF.C.y, 1e-3));
  });
});

describe('practiceLine (B14): A, B, C 2/5/8 m inside, M 3 m outside → 5, 8, 11 m', () => {
  it('one line, perpendicular to the boundary; the printed ranges', () => {
    for (const q of [PL.A, PL.B, PL.C, PL.M]) assert.equal(q.x, 0);
    assert.equal(planRange(PL.M, PL.A), PL_PRINTED.A);
    assert.equal(planRange(PL.M, PL.B), PL_PRINTED.B);
    assert.equal(planRange(PL.M, PL.C), PL_PRINTED.C);
    assert.equal(PL.h, 1.0);
  });
  it('the mics stay in the outside zone; the source points are in the cleared inside area', () => {
    assert.equal(refusedAt(PRACTICE_LINE, PL.M), null);
    assert.equal(refusedAt(PRACTICE_LINE, PL.M2), null);
    for (const t of PRACTICE_LINE.targets) assert.ok(inPoly(t.p, PRACTICE_LINE.play));
  });
  it('the 30° off-axis trial at B is 30° off the axis', () => {
    const aim = degOf({ x: PL.B.x - PL.M.x, y: PL.B.y - PL.M.y }) + PL.offAxisTrial;
    assert.ok(near(offAxisDeg(PL.M, aim, PL.B), 30, 1e-9));
  });
});

describe('the sport plans (D7-2 outlines, D7-1 clear-zone words)', () => {
  for (const id of [...FIELD_SPORTS, ...COURT_SPORTS]) {
    it(`${id}: approved places are clear of play, keep-clear space and routes; every drawing default is listed`, () => {
      const s = sportPlan(id);
      assert.ok(s.footprints.length >= 1, 'at least one approved place');
      for (const f of s.footprints) {
        const c = { x: (f.rect.x0 + f.rect.x1) / 2, y: (f.rect.y0 + f.rect.y1) / 2 };
        assert.equal(refusedAt(s, c), null, `${f.id} centre`);
      }
      assert.ok(s.defaults.length >= 3);
      for (const k of s.keepClear) if (k.basis === 'rule') assert.match(k.note, /typical clear zone — check your event’s rules/);
    });
  }
  it('the clearances from the rules read in the research: rugby 5 m, basketball 2 m, volleyball 3 m', () => {
    const band = (id: Parameters<typeof sportPlan>[0]) => {
      const k = sportPlan(id).keepClear.find((q) => q.basis === 'rule')!;
      const xs = k.poly.map((q) => q.y);
      return Math.max(...xs) - Math.min(...xs);
    };
    assert.ok(near(band('rugby'), 5, 1e-9));
    assert.ok(near(band('basketball'), 2, 1e-9));
    assert.ok(near(band('volleyball'), 3, 1e-9));
    assert.match(sportPlan('rugby').keepClear[0].note, /3\.5 m for the men’s game and 3 m for the women’s/);
  });
  it('soccer’s goals and flagposts carry the no-attaching badge; hockey’s boards no hardware', () => {
    assert.equal(sportPlan('soccer').badges.filter((b) => b.kind === 'noAttach').length, 4);
    assert.ok(sportPlan('hockey').badges.some((b) => b.kind === 'noHardware'));
  });
  it('a band round a rectangle is four strips that never cover the rectangle itself', () => {
    const r = { x0: 0, y0: 0, x1: 10, y1: 5 };
    for (const poly of bandAround(r, 2)) assert.ok(!inPoly({ x: 5, y: 2.5 }, poly));
  });
});

describe('the headroom chain (headroom.ts)', () => {
  it('the starting chain is the common mistake: the gentle clap at −12 dBFS, the transmitter over on the loudest peak while the converter looks fine', () => {
    const clap = readChain(START_SETTINGS, 'clap');
    assert.equal(clap.adcDbfs, TRIAL_DBFS);
    assert.equal(clap.firstOver, null);
    const loud = readChain(START_SETTINGS, 'loud');
    assert.equal(loud.firstOver, 'tx');
    assert.ok(loud.adcDbfs < 0, 'the converter alone does not show it');
    assert.ok(loud.stages.filter((s) => s.id !== 'capsule' && s.id !== 'tx').every((s) => s.clippedBefore));
  });
  it('a lower output fader changes the bus output only — never the clip upstream', () => {
    const a = readChain(START_SETTINGS, 'loud');
    const b = readChain({ ...START_SETTINGS, fader: -20 }, 'loud');
    assert.equal(b.firstOver, a.firstOver);
    assert.equal(b.busOut, a.busOut - 20);
  });
  it('a reachable good chain exists: the loudest rehearsal peak near −12 dBFS and room for the surprise', () => {
    assert.ok(!chainGood(START_SETTINGS));
    const s = { tx: -20, pre: -2, fader: 0 };
    assert.ok(s.tx >= HEADROOM_DEFAULTS.tx.min && s.pre <= HEADROOM_DEFAULTS.pre.max);
    assert.ok(chainGood(s));
    for (const e of EVENT_IDS) assert.equal(readChain(s, e).firstOver, null, e);
  });
});

describe('the parabolic dish (parabolic.ts)', () => {
  it('the derived presets are self-consistent: f = r²/4d, rim at D/2, focus inside the bowl', () => {
    for (const d of Object.values(DISHES)) {
      assert.ok(near(focalLength(d.D, d.depth), d.f, 1.5), d.id);
      assert.ok(near(halfWidthAt(d, d.depth) * 2, d.D, 4), d.id);
      assert.ok(d.f < d.depth && d.placeholder);
    }
  });
  it('the gain onset c / D: about 520 Hz (large), about 845 Hz (small)', () => {
    assert.ok(near(gainOnsetHz(DISHES.large), 520, 2));
    assert.ok(near(gainOnsetHz(DISHES.small), 845, 2));
  });
  it('on the axis every reflection passes through the focus; off the axis they miss it, more as the error grows', () => {
    for (const r of raySet(DISHES.large, 0)) assert.ok(r.miss < 0.01, `${r.miss}`);
    const s10 = spreadAt(DISHES.large, 10);
    const s20 = spreadAt(DISHES.large, 20);
    assert.ok(s10 > 3 && s20 > s10, `${s10} ${s20}`);
    assert.deepEqual([...AIM_TRIALS], [0, 10, 20]);
    const r = reflectRay(DISHES.small, 50, 0);
    assert.ok(near(r.at.x, DISHES.small.f, 0.01) && near(r.at.y, 0, 0.01));
  });
});

describe('the boundary tool (boundary.ts)', () => {
  it('sound straight down: the extra path is 2h, the first notch c / 4h — 286 Hz at 30 cm, 858 Hz at 10 cm', () => {
    assert.ok(near(paths({ h: 300, x: 0, hs: 3000 }).extra, 600, 1e-9));
    assert.ok(near(perpendicularNotch(300), C20 / 1.2, 1e-9));
    assert.equal(Math.round(perpendicularNotch(300)), 286);
    assert.equal(Math.round(perpendicularNotch(100)), 858);
    assert.ok(near(firstNotch({ h: 300, x: 0, hs: 3000 })!, perpendicularNotch(300), 1e-6));
  });
  it('lower is higher, and at the surface the notch leaves the audio band', () => {
    const src = { x: 1000, hs: 1000 };
    const f = HEIGHTS.filter((h) => h > 0).map((h) => firstNotch({ h, ...src })!);
    for (let i = 1; i < f.length; i++) assert.ok(f[i] > f[i - 1]);
    assert.equal(firstNotch({ h: 0, ...src }), null);
    assert.ok(paths({ h: 300, x: 8000, hs: 1000 }).extra < paths({ h: 300, x: 1000, hs: 1000 }).extra, 'grazing arrival: a shorter extra path');
  });
});

describe('the one safety card (safety.ts)', () => {
  it('the lightning words are exact: shelter, 30 minutes after the last thunder, dugouts and open rain shelters are not safe', () => {
    assert.match(SPORTS_SAFETY.lightning.text, /30 minutes after the last thunder/);
    assert.match(SPORTS_SAFETY.lightning.text, /Dugouts and open rain shelters are not safe/);
    assert.match(SPORTS_SAFETY.play.text, /medical route/);
    assert.match(SPORTS_SAFETY.protective.text, /Never alter/);
    assert.match(SPORTS_SAFETY.animals.text, /No mic on a horse, its tack or its rider/);
    assert.match(SPORTS_SAFETY.electrics.text, /qualified person/);
    assert.match(SPORTS_SAFETY.hearing.text, /Start the headphone level low/);
    assert.match(SPORTS_SAFETY.feedback.text, /never provoke feedback/);
  });
  it('outdoors carries the lightning row; both lists carry approval and never into play', () => {
    assert.ok(OUTDOOR_ROWS.includes(SPORTS_SAFETY.lightning));
    for (const rows of [OUTDOOR_ROWS, INDOOR_ROWS]) assert.ok(rows.includes(SPORTS_SAFETY.approval) && rows.includes(SPORTS_SAFETY.play));
  });
  it('the dish mic type is a placeholder drawing of the derived large dish', () => {
    const t = SPORTS_MIC_TYPES.spDish;
    assert.equal(t.body.radius.mm, DISHES.large.D / 2);
    assert.ok(t.body.radius.placeholder && t.body.length.placeholder);
    assert.equal(t.patterns[0].id, 'unstated');
  });
});
