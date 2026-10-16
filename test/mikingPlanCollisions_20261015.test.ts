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
import { clearOfFoots, overlapArea, planTurn, rectsOverlap, segmentGap, segmentHitsRect, segmentsCross, turnPt, turnRect, unturnPt, type PlanFoot, type PlanRect } from '../src/screens/lab/miking/lessons/shared/planFoot.ts';
import { orchDesks, PAIR } from '../src/screens/lab/miking/lessons/shared/concert/orchestraPlanModel.ts';
import { standingWedges, STAGE_THINGS } from '../src/screens/lab/miking/lessons/shared/smallperc/stage.ts';
import { C11_LESSON } from '../src/screens/lab/miking/lessons/c11Piano/lesson.ts';
import { grandSpots, grandOf } from '../src/screens/lab/miking/lessons/c11Piano/planModel.ts';
import { FRONT_ROW_GAP_MM } from '../src/features/lab/audienceChairsModel.ts';
import { CUE_LANE, cueMixerRect, cuePhones, cueSeats, PHONES_FRONT } from '../src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts';

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

describe('the studio headphone mix: a mixer for every performer (one per music stand in an orchestra), each fed from the control room', () => {
  // Owner 2026-10-16 (stage-plot review HOLD 4): an orchestra records with one
  // headphone box per MUSIC STAND, shared by the players at that stand; every
  // other plan gives each performer their own. Either way every performer is
  // served by exactly one mixer, each player has their own phones cord from
  // it, and every mixer still has its own traceable feed to the control room.
  for (const c of CASES.filter((x) => x.scene === 'studio')) {
    it(name(c), () => {
      assert.ok(c.cue.length >= 1, `${name(c)}: no headphone mix`);
      const stations = c.cue.flatMap((r) => r.stations);
      const served = stations.flatMap((s) => cueSeats(s).map((p) => p.id));
      assert.ok(c.performers.length >= 1, `${name(c)}: no performer listed`);
      for (const p of c.performers) assert.equal(served.filter((id) => id === p.id).length, 1, `${name(c)}: ${p.id} is served by ${served.filter((id) => id === p.id).length} headphone mixers`);
      assert.equal(served.length, c.performers.length, `${name(c)}: a mixer for nobody`);
      assert.equal(new Set(stations.map((s) => s.id)).size, stations.length, `${name(c)}: two mixers share an id`);
      // every mixer has its own feed; every player their own phones cord
      for (const s of stations) {
        assert.equal(c.cables.filter((k) => k.kind === 'cueFeed' && k.from === `cueMixer:${s.id}`).length, 1, `${name(c)}: ${s.id} feed`);
        const seats = cueSeats(s);
        assert.equal(c.cables.filter((k) => k.kind === 'phones' && k.from === `cueMixer:${s.id}`).length, seats.length, `${name(c)}: ${s.id} phones`);
        for (const p of seats) assert.equal(c.cables.filter((k) => k.kind === 'phones' && k.from === `cueMixer:${s.id}` && k.to === `head:${p.id}`).length, 1, `${name(c)}: ${p.id}'s phones cord`);
        // within reach of every player it serves (set by the player, ≤ 1.2 m)
        for (const p of seats) {
          const d = Math.hypot(s.at.u - p.head.u, s.at.v - p.head.v);
          assert.ok(d >= 200 && d <= 1200, `${name(c)}: ${p.id}'s mixer is ${Math.round(d)} mm from them`);
        }
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
    // ... and clear of every cable (expert review 2026-10-15: HEADPHONE MIX
    // and CONTROL ROOM were printed across the feed lanes)
    it(f, () => assert.match(read(f), /clearOf=\{clearOfFoots\([^)]*(?:\([^)]*\))?[^)]*, [^}]*cueCables[^}]*\)\}/));
  }
  it('a word box crossed by a cable is not clear', () => {
    const clear = clearOfFoots([], [{ id: 'k', kind: 'cueFeed', pts: [{ u: 0, v: 50 }, { u: 1000, v: 50 }] }]);
    assert.equal(clear(100, 0, 300, 100), false);
    assert.equal(clear(100, 200, 300, 300), true);
  });
  it('StaticLabels hands clearOf to the level-of-detail layout', () => {
    const src = read('src/screens/lab/miking/engine/scene/StaticLabels.tsx');
    assert.match(src, /clearOf \? fitLabels\(labels, xf, scale, w, undefined, undefined, \{ clearOf/);
  });
});

describe('headphones with nobody in them are drawn face-on (owner 2026-10-15)', () => {
  // From above, a lone pair (no head) is two pills and a bar nobody reads as
  // headphones: where the plan draws no figure the phones rest face-on —
  // the band's arc over two cups — and the cord leaves the bottom of a cup.
  const alone = (c: PlanCase) => c.cue.flatMap((r) => r.stations).filter((s) => s.alone).map((s) => s.id);
  it('the kit plan (no drummer drawn): on the throne', () => {
    for (const c of CASES.filter((x) => x.family === 'kitPlan' && x.scene === 'studio')) assert.deepEqual(alone(c), ['drummer'], name(c));
  });
  it('the orchestra (empty chairs, an empty podium): every pair', () => {
    for (const c of CASES.filter((x) => x.family === 'orchestra' && x.scene === 'studio')) assert.equal(alone(c).length, c.cue.flatMap((r) => r.stations).length, name(c));
  });
  it('the organ bench (no organist drawn)', () => {
    for (const c of CASES.filter((x) => x.family === 'spk' && x.scene === 'studio')) assert.deepEqual(alone(c), ['organist'], name(c));
  });
  it('a drawn drummer wears them (M10)', () => {
    for (const c of CASES.filter((x) => x.family === 'm10Room' && x.scene === 'studio')) assert.deepEqual(alone(c), [], name(c));
  });
  it('the cord leaves the bottom of the cup nearer the mixer', () => {
    const s = { id: 'x', at: { u: -600, v: 0 }, head: { u: 0, v: 0 }, facing: 0, alone: true };
    const k = cuePhones(s);
    const end = k.pts[k.pts.length - 1];
    assert.deepEqual(end, { u: -PHONES_FRONT.cupU, v: PHONES_FRONT.cupBot });
    assert.ok(PHONES_FRONT.cupBot - PHONES_FRONT.bandTop >= 180 && PHONES_FRONT.cupBot - PHONES_FRONT.bandTop <= 230, 'true size: ≈ 200 mm from the band to the cups');
  });
});

describe('the audience: marked only where one belongs and fits (owner 2026-10-15)', () => {
  // "make sure if you are marking an audience area, that there actually
  // should (or could fit) one there": none in a studio; on a stage the marks
  // lie beyond the deck's downstage edge — true-size chairs a walkway clear
  // of it, or the edge and an off-plan direction word / arrows — everything
  // else stands on the deck, and the PA stands on its downstage corners.
  for (const c of CASES) {
    it(name(c), () => {
      const marked = c.foots.filter((f) => /^audience/i.test(f.kind));
      if (c.scene === 'studio') {
        assert.equal(c.audience, undefined, `${name(c)}: an audience in a studio`);
        assert.deepEqual(marked.map((f) => f.id), [], `${name(c)}: audience marks in a studio`);
        return;
      }
      const A = c.audience;
      assert.ok(A, `${name(c)}: the stage plan does not say where its audience is`);
      const lo = (r: PlanRect) => (A.dir > 0 ? (A.axis === 'u' ? r.u0 : r.v0) : -(A.axis === 'u' ? r.u1 : r.v1));
      const hi = (r: PlanRect) => (A.dir > 0 ? (A.axis === 'u' ? r.u1 : r.v1) : -(A.axis === 'u' ? r.u0 : r.v0));
      const lip = A.dir * A.lip;
      assert.ok(A.marks.length > 0, `${name(c)}: no audience mark`);
      const bad: string[] = [];
      for (const m of A.marks) {
        if (A.offPlan) {
          if (!(hi(m) <= lip + 1 && hi(m) >= lip - 400)) bad.push(`an off-plan audience word not at the plan's downstage edge`);
        } else if (lo(m) < lip - 1) bad.push(`an audience mark ${Math.round(lip - lo(m))} mm upstage of the deck's edge`);
      }
      if (A.kind === 'seats') {
        const gap = Math.min(...A.marks.map(lo)) - lip;
        if (gap < FRONT_ROW_GAP_MM - 1) bad.push(`the front row only ${Math.round(gap)} mm past the deck's edge (≥ ${FRONT_ROW_GAP_MM})`);
      }
      // everything else stands on the deck (off-plan: inside the plan)
      const limit = lip;
      const deck = c.foots.filter((f) => !f.zone && !/^audience/i.test(f.kind));
      for (const f of deck) if (hi(f) > limit + 1) bad.push(`${f.id} (${f.kind}) ${Math.round(hi(f) - limit)} mm past the deck's edge`);
      // the PA on the deck's downstage corners
      const pa = deck.filter((f) => f.kind === 'pa');
      if (pa.length) {
        const across = (r: PlanRect) => (A.axis === 'u' ? [r.v0, r.v1] : [r.u0, r.u1]);
        const rest = deck.filter((f) => f.kind !== 'pa');
        const a0 = Math.min(...deck.map((f) => across(f)[0]));
        const a1 = Math.max(...deck.map((f) => across(f)[1]));
        for (const p of pa) {
          if (lip - hi(p) > 900) bad.push(`${p.id}: ${Math.round(lip - hi(p))} mm upstage of the deck's edge (a PA stands at the edge)`);
          const mid = (across(p)[0] + across(p)[1]) / 2;
          const t = (mid - a0) / Math.max(1, a1 - a0);
          if (t > 0.25 && t < 0.75) bad.push(`${p.id}: mid-stage, not on a downstage corner`);
        }
        void rest;
        if (pa.length !== 2) bad.push(`${pa.length} PA stacks (a pair, one per corner)`);
      }
      // the drawn deck holds everything but the audience
      if (c.deck) {
        const d = c.deck;
        for (const f of deck) if (f.u0 < d.u0 - 1 || f.u1 > d.u1 + 1 || f.v0 < d.v0 - 1 || f.v1 > d.v1 + 1) bad.push(`${f.id} (${f.kind}) hangs off the deck`);
      }
      assert.deepEqual(bad, [], `${name(c)}: ${bad.join('; ')}`);
    });
  }
});

describe('a rect overlap is an overlap', () => {
  it('sanity', () => {
    assert.equal(rectsOverlap({ u0: 0, u1: 10, v0: 0, v1: 10 }, { u0: 5, u1: 15, v0: 5, v1: 15 }), true);
    assert.equal(rectsOverlap({ u0: 0, u1: 10, v0: 0, v1: 10 }, { u0: 10, u1: 15, v0: 0, v1: 10 }), false);
  });
});

describe('DOWNSTAGE = BOTTOM: every LIVE plan shows its audience below (owner 2026-10-16)', () => {
  // Stage-plot review HOLD 1: eleven families put the audience to the right,
  // five at the bottom. Every stage plan now reads the common way: upstage at
  // the top, the deck's edge and the PA pair along the bottom, the audience
  // marks below it. The families laid out with the audience at +u are drawn
  // TURNED a quarter (planFoot planTurn) — their cases are the turned plan.
  for (const c of CASES.filter((x) => x.scene === 'stage')) {
    it(name(c), () => {
      assert.ok(c.audience, `${name(c)}: no audience`);
      assert.equal(c.audience!.axis, 'v', `${name(c)}: the audience is not down the screen`);
      assert.equal(c.audience!.dir, 1, `${name(c)}: the audience is at the top`);
    });
  }
  const TURNED = [
    'src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx',
    'src/screens/lab/miking/lessons/shared/KitPlan.tsx',
    'src/screens/lab/miking/lessons/m10Room/PRoomSetting.tsx',
    'src/screens/lab/miking/lessons/shared/handdrums/HandPlan.tsx',
    'src/screens/lab/miking/lessons/shared/hand/HandPlan.tsx',
    'src/screens/lab/miking/lessons/shared/strings/PStagePlan.tsx',
    'src/screens/lab/miking/lessons/shared/speakers/StagePlan.tsx',
    'src/screens/lab/miking/lessons/shared/keys/KeysPlan.tsx',
    'src/screens/lab/miking/lessons/shared/brass/BrassSettingPage.tsx',
    'src/screens/lab/miking/lessons/shared/lowbrass/LowBrassSettingPage.tsx',
    'src/screens/lab/miking/lessons/shared/sax/SaxSettingPage.tsx',
    'src/screens/lab/miking/lessons/shared/bowed/BowedSettingPage.tsx',
  ];
  for (const f of TURNED)
    it(`${f} draws, fits, labels and taps its stage turned`, () => {
      const src = read(f);
      assert.match(src, /planTurn\(/, 'no planTurn');
      assert.match(src, /fitXform\([^)]*T\.rect\(box\)/, 'the fitted box is not turned');
      assert.match(src, /\{ rotate: T\.rotate \}/, 'the drawing is not turned');
      assert.match(src, /labels=\{T\.labels\(/, 'the words are not turned');
      assert.match(src, /clearOfFoots\(T\.foots\(/, 'the words keep clear of unturned footprints');
      assert.match(src, /T\.unPt\(/, 'a tap is not turned back');
      assert.doesNotMatch(src, /AUDIENCE[^'`]*→/, 'an audience arrow still points right');
    });
  it('the turn is a quarter turn clockwise: the audience (+u) goes down, the player’s right (+v) to screen-left, distances kept', () => {
    assert.deepEqual(turnPt({ u: 1000, v: 0 }), { u: -0, v: 1000 });
    assert.deepEqual(turnPt({ u: 0, v: 1000 }), { u: -1000, v: 0 });
    const p = { u: 123, v: -456 };
    assert.deepEqual(unturnPt(turnPt(p)), p);
    const r = { u0: 10, u1: 30, v0: -5, v1: 45 };
    const t = turnRect(r);
    assert.equal(t.u1 - t.u0, r.v1 - r.v0);
    assert.equal(t.v1 - t.v0, r.u1 - r.u0);
    // a name placed round a turned object sits round it in the turned frame
    const T = planTurn(true);
    const pl = T.places(r, 0.1).map((q) => turnPt(q));
    assert.ok(pl[0].v > t.v1, 'the first place is below the turned object');
    assert.equal(planTurn(false).rotate, 0);
  });
});

describe('the seated percussionist’s own wedge stands downstage, angled up at them (owner 2026-10-16)', () => {
  // Stage-plot review HOLD 2 (I02–I05d): OWN MON. stood behind the player,
  // facing their back — not a standard monitor position.
  it('in front of the player (toward the audience) and facing back at them', () => {
    const w = standingWedges('the cajón').find((x) => x.id === 'fill')!;
    assert.ok(w.p.x > 600, 'downstage of the player');
    // it faces the player at the origin (within 15°)
    const toPlayer = Math.atan2(-w.p.z, -w.p.x);
    const facing = Math.atan2(w.faces.z, w.faces.x);
    assert.ok(Math.abs(Math.atan2(Math.sin(toPlayer - facing), Math.cos(toPlayer - facing))) < (15 * Math.PI) / 180, 'angled at the player');
    const t = STAGE_THINGS.find((x) => x.id === 'fill')!;
    assert.ok(t.u > 600, 'the plan draws it downstage too');
  });
});

describe('C11: the grand’s SIDE-FILL stands in the stage wing, facing across (owner 2026-10-16)', () => {
  // Stage-plot review HOLD 3: downstage-centre facing upstage it was a front
  // fill. The exercise that nulls it still works (mikingLab4Keys: reachable).
  it('the lesson’s speaker and the plan’s glyph: past the tail, facing across the stage (−x), at head height', () => {
    const w = C11_LESSON.live.wedges.find((x) => x.id === 'fill.side')!;
    assert.ok(w.p.x > 3000, 'in the wing past the tail');
    assert.equal(w.faces.z, 0);
    assert.ok(w.faces.x < 0, 'facing across the stage');
    assert.ok(w.lift >= 1200, 'at head height');
    for (const v of ['grand', 'short', 'baby'] as const) {
      const g = grandOf(v);
      const s = grandSpots(g).find((x) => x.item === 'fill.side')!;
      assert.ok(s.x > g.xTail + 1500, `${v}: in the wing`);
      assert.deepEqual(s.faces, { x: -1, z: 0 });
    }
  });
});

describe('the orchestra records with one headphone box per MUSIC STAND (owner 2026-10-16)', () => {
  // Stage-plot review HOLD 4: desk partners share a stand and its headphone
  // box (each with their own phones cord); every box keeps its own feed lane.
  for (const c of CASES.filter((x) => x.family === 'orchestra' && x.scene === 'studio')) {
    it(name(c), () => {
      const stations = c.cue.flatMap((r) => r.stations);
      const desks = orchDesks();
      const stands = c.foots.filter((f) => f.kind === 'musicStand' && /D\d+:stand$/.test(f.id));
      assert.equal(stands.length, desks.length, 'one stand per desk');
      for (const d of desks) {
        const s = stations.find((x) => x.id === d.id);
        assert.ok(s, `${d.id}: no box at the stand`);
        assert.deepEqual(cueSeats(s!).map((p) => p.id), [...d.players], `${d.id}: the box serves the players at its stand`);
        // between the two seats, on the stand's line
        assert.equal(s!.at.u, d.u);
        for (const p of cueSeats(s!)) assert.ok(Math.abs(p.head.u - d.u) === PAIR, `${p.id}: sits ${PAIR} mm off the stand's line`);
      }
      // no chair player has a box of their own
      assert.equal(stations.filter((x) => /^(brass|winds|str\d_)\d+$/.test(x.id)).length, 0);
    });
  }
});
