/**
 * Miking Labs — STAGE / STUDIO PLANS (owner 2026-10-15):
 *
 *   1. NO COLLISIONS OR IMPOSSIBLE LAYERING in any plan, stage or studio: no
 *      two objects share floor (the side fill stood over the kit's floor tom
 *      and ride in C02 LIVE), nothing stands in another player's keep-clear
 *      space, no cable runs through an object, no feed crosses another, and
 *      in a studio everything stays inside the room. Real stacking — parts
 *      of ONE assembly (`group`: a kit's cymbals over its drums, a player on
 *      their chair) or a pair named in `allow` with its reason — is allowed.
 *   2. THE STUDIO HEADPHONE MIX: no wedges in a studio; every performer the
 *      plan draws has a personal headphone mixer, the phones plugged into it,
 *      and its own feed back to the CONTROL ROOM distribution point at the
 *      room's edge (monitoring/cueMix.ts).
 *   3. Words never sit on objects: every plan renderer lays its labels out
 *      clear of its footprints (StaticLabels `clearOf`).
 *
 * The cases come from each family's pure layout (lessons/shared/planCases),
 * the same numbers the drawings use.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { allPlanCases, PLAN_FAMILIES, type PlanCase } from '../src/screens/lab/miking/lessons/shared/planCases/index.ts';
import { overlapArea, rectsOverlap, segmentGap, segmentHitsRect, segmentsCross, type PlanFoot } from '../src/screens/lab/miking/lessons/shared/planFoot.ts';
import { CUE_LANE, cueMixerRect } from '../src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const CASES = allPlanCases();
const name = (c: PlanCase) => `${c.lesson}${c.variant ? `/${c.variant}` : ''} ${c.scene.toUpperCase()}`;
/** Overlap smaller than this (mm²) is two edges touching, not a collision. */
const TOUCH = 25;
/** Separate objects keep at least this much floor between them (mm): a
 *  realistic clearance, never two things drawn flush against each other. */
const CLEAR = 40;
const grow = (f: PlanFoot, d: number): PlanFoot => ({ ...f, u0: f.u0 - d, u1: f.u1 + d, v0: f.v0 - d, v1: f.v1 + d });

function allowed(c: PlanCase, a: PlanFoot, b: PlanFoot): boolean {
  if (a.group && a.group === b.group) return true;
  return (c.allow ?? []).some((x) => (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id) || (x.a === `kind:${a.kind}` && x.b === `kind:${b.kind}`) || (x.a === `kind:${b.kind}` && x.b === `kind:${a.kind}`));
}

describe('every Miking plan is covered', () => {
  it('cases exist for the plan families that draw a stage / studio switch', () => {
    const fams = new Set(CASES.map((c) => c.family));
    for (const f of Object.keys(PLAN_FAMILIES)) assert.ok(fams.has(f), `no plan cases for the ${f} plans`);
    assert.ok(CASES.length >= 100, `only ${CASES.length} plan cases`);
  });
});

describe('no two objects share floor (stage and studio)', () => {
  for (const c of CASES) {
    it(name(c), () => {
      const solid = c.foots.filter((f) => !f.zone);
      const bad: string[] = [];
      for (let i = 0; i < solid.length; i++)
        for (let j = i + 1; j < solid.length; j++) {
          const a = solid[i];
          const b = solid[j];
          if (overlapArea(grow(a, CLEAR / 2), grow(b, CLEAR / 2)) > TOUCH && !allowed(c, a, b)) bad.push(`${a.id} (${a.kind}) × ${b.id} (${b.kind}): ${overlapArea(a, b) > TOUCH ? `${Math.round(overlapArea(a, b))} mm² overlap` : `closer than ${CLEAR} mm`}`);
        }
      // nothing stands in another player's keep-clear space
      for (const z of c.foots.filter((f) => f.zone && f.kind === 'keepClear'))
        for (const o of solid) if (o.group !== z.group && overlapArea(o, z) > TOUCH && !allowed(c, o, z)) bad.push(`${o.id} (${o.kind}) in ${z.id} (${z.group})`);
      assert.deepEqual(bad, [], `${name(c)}: ${bad.join('; ')}`);
    });
  }
});

describe('the studio: no wedges, everything inside the room', () => {
  for (const c of CASES.filter((x) => x.scene === 'studio')) {
    it(name(c), () => {
      assert.ok(c.room, `${name(c)}: no room`);
      const r = c.room!;
      assert.deepEqual(c.foots.filter((f) => f.kind === 'wedge' || f.kind === 'sideFill').map((f) => f.id), [], `${name(c)}: a wedge in a studio`);
      const out = c.foots.filter((f) => !f.zone && (f.u0 < r.u0 - 1 || f.u1 > r.u1 + 1 || f.v0 < r.v0 - 1 || f.v1 > r.v1 + 1)).map((f) => f.id);
      assert.deepEqual(out, [], `${name(c)}: outside the room walls`);
    });
  }
});

describe('the studio headphone mix: one personal mixer per performer, each fed from the control room', () => {
  for (const c of CASES.filter((x) => x.scene === 'studio')) {
    it(name(c), () => {
      assert.ok(c.cue.length >= 1, `${name(c)}: no headphone mix`);
      const stations = c.cue.flatMap((r) => r.stations);
      assert.ok(c.performers.length >= 1, `${name(c)}: no performer listed`);
      for (const p of c.performers) assert.equal(stations.filter((s) => s.id === p.id).length, 1, `${name(c)}: ${p.id} has ${stations.filter((s) => s.id === p.id).length} headphone mixers`);
      assert.equal(stations.length, c.performers.length, `${name(c)}: a mixer for nobody`);
      // every mixer has its own feed and its own phones cord
      for (const s of stations) {
        assert.equal(c.cables.filter((k) => k.kind === 'cueFeed' && k.from === `cueMixer:${s.id}`).length, 1, `${name(c)}: ${s.id} feed`);
        assert.equal(c.cables.filter((k) => k.kind === 'phones' && k.from === `cueMixer:${s.id}`).length, 1, `${name(c)}: ${s.id} phones`);
        // within reach of the performer (a mixer is set by the player, ≤ 1.2 m)
        const d = Math.hypot(s.at.u - s.head.u, s.at.v - s.head.v);
        assert.ok(d >= 200 && d <= 1200, `${name(c)}: ${s.id}'s mixer is ${Math.round(d)} mm from them`);
        // its footprint is listed
        const m = c.foots.find((f) => f.id === `cueMixer:${s.id}`);
        assert.ok(m, `${name(c)}: ${s.id} mixer footprint`);
        assert.deepEqual({ ...cueMixerRect(s) }, { u0: m!.u0, u1: m!.u1, v0: m!.v0, v1: m!.v1 });
      }
    });
  }
});

describe('cables: none through an object, no feed crossing or merging with another', () => {
  for (const c of CASES.filter((x) => x.cables.length)) {
    it(name(c), () => {
      const bad: string[] = [];
      const groupOf = new Map(c.performers.map((p) => [p.id, p.group]));
      for (const k of c.cables) {
        const perf = k.to?.startsWith('head:') ? k.to.slice(5) : null;
        const g = perf ? groupOf.get(perf) : undefined;
        for (let i = 0; i + 1 < k.pts.length; i++)
          for (const f of c.foots) {
            if (f.id === k.from || f.id === k.to) continue;
            if (f.zone && f.kind !== 'keepClear') continue;
            if (g && f.group === g) continue; // the phones cord reaches its own player
            if (segmentHitsRect(k.pts[i], k.pts[i + 1], f, 2)) bad.push(`${k.id} through ${f.id}`);
          }
      }
      const feeds = c.cables.filter((k) => k.kind === 'cueFeed');
      for (let a = 0; a < feeds.length; a++)
        for (let b = a + 1; b < feeds.length; b++) {
          const A = feeds[a];
          const B = feeds[b];
          for (let i = 0; i + 1 < A.pts.length; i++)
            for (let j = 0; j + 1 < B.pts.length; j++) {
              // the last leg of each feed ends at its own jack in the shared box
              const gap = segmentGap(A.pts[i], A.pts[i + 1], B.pts[j], B.pts[j + 1]);
              if (segmentsCross(A.pts[i], A.pts[i + 1], B.pts[j], B.pts[j + 1])) bad.push(`${A.id} crosses ${B.id}`);
              else if (gap < CUE_LANE.gap / 2) bad.push(`${A.id} merges with ${B.id} (${Math.round(gap)} mm)`);
            }
        }
      assert.deepEqual(bad, [], `${name(c)}: ${bad.join('; ')}`);
    });
  }
});

describe('words never sit on objects: every plan lays its labels out clear of its footprints', () => {
  const FILES = [
    'src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx',
    'src/screens/lab/miking/lessons/shared/KitPlan.tsx',
    'src/screens/lab/miking/lessons/m10Room/PRoomSetting.tsx',
    'src/screens/lab/miking/lessons/shared/handdrums/HandPlan.tsx',
    'src/screens/lab/miking/lessons/shared/hand/HandPlan.tsx',
    'src/screens/lab/miking/lessons/shared/guitars/StagePlan.tsx',
    'src/screens/lab/miking/lessons/shared/lutes/LutePlan.tsx',
    'src/screens/lab/miking/lessons/shared/strings/PStagePlan.tsx',
    'src/screens/lab/miking/lessons/shared/speakers/StagePlan.tsx',
    'src/screens/lab/miking/lessons/shared/keys/KeysPlan.tsx',
    'src/screens/lab/miking/lessons/shared/concert/OrchestraPlan.tsx',
    'src/screens/lab/miking/lessons/shared/brass/BrassSettingPage.tsx',
    'src/screens/lab/miking/lessons/shared/lowbrass/LowBrassSettingPage.tsx',
    'src/screens/lab/miking/lessons/shared/sax/SaxSettingPage.tsx',
    'src/screens/lab/miking/lessons/shared/woodwinds/WindPlan.tsx',
    'src/screens/lab/miking/lessons/shared/bowed/BowedSettingPage.tsx',
  ];
  for (const f of FILES) {
    it(f, () => assert.match(read(f), /clearOf=\{clearOfFoots\(/));
  }
  it('StaticLabels hands clearOf to the level-of-detail layout', () => {
    const src = read('src/screens/lab/miking/engine/scene/StaticLabels.tsx');
    assert.match(src, /clearOf \? fitLabels\(labels, xf, scale, w, undefined, undefined, \{ clearOf/);
  });
});

describe('a rect overlap is an overlap', () => {
  it('sanity', () => {
    assert.equal(rectsOverlap({ u0: 0, u1: 10, v0: 0, v1: 10 }, { u0: 5, u1: 15, v0: 5, v1: 15 }), true);
    assert.equal(rectsOverlap({ u0: 0, u1: 10, v0: 0, v1: 10 }, { u0: 10, u1: 15, v0: 0, v1: 10 }), false);
  });
});
