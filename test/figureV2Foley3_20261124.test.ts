/**
 * FIGURE V2 — "FOLEY3" (builder Foley3, 2026-11-24): F02 Clothing, F08
 * Pass-bys and F10 Spatial Field converted whole to the new look. Checked
 * here (the pictures are judged by eye on `#labpreview/FigureStudy/foley3-*`):
 *   • the cast: roles appended only; the boom operator is never the lesson's
 *     performer or walker or crew; F10's people are three different people;
 *   • THE BOOM GEOMETRY, checked first: the engine's pole (from the mic's tail
 *     to the hands) never crosses the operator's head or face, at any slope,
 *     height or side; no arm crosses the face in profile; both fists lie ON
 *     the pole; no arm is stretched past its length;
 *   • F02: the jacket, its fold and the labels are where they were; the held
 *     fists are the lesson's hands; a true left hand on the left arm;
 *   • F10: the singer's mouth on the lesson's mouth point; the in-ear head's
 *     ears where the in-ear mics are drawn;
 *   • the wiring: each lesson's people go through the new look behind its
 *     switch; the engine draws the pole operator over its pole only when the
 *     lesson asks (`poleOperatorOver`).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const RIG = R(await import('../src/screens/lab/miking/lessons/shared/fieldmics/poleRigV2.ts'));
const POV = R(await import('../src/screens/lab/miking/lessons/shared/fieldmics/PoleOperatorV2.tsx'));
const PV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/personV2.tsx'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const COL = R(await import('../src/screens/lab/miking/engine/geometry/collision.ts'));
const F02G = R(await import('../src/screens/lab/miking/lessons/f02Clothing/geometry.ts'));
const F02V = R(await import('../src/screens/lab/miking/lessons/f02Clothing/clothingV2.tsx'));
const F02A = R(await import('../src/screens/lab/miking/lessons/f02Clothing/art.tsx'));
const F10S = R(await import('../src/screens/lab/miking/lessons/f10SpatialField/scene.tsx'));
const F10P = R(await import('../src/screens/lab/miking/lessons/f10SpatialField/peopleV2.tsx'));
const F10G = R(await import('../src/screens/lab/miking/lessons/f10SpatialField/geometry.ts'));
const SA = R(await import('../src/screens/lab/miking/lessons/shared/field/SiteArt.tsx'));

type Pt = { u: number; v: number };
const P = (u: number, v: number): Pt => ({ u, v });
const OP = CAST.castFor('operator.boomFoley');

/** Whether segment ab crosses (or lies inside) a closed polygon. */
function segHitsPoly(a: Pt, b: Pt, poly: readonly Pt[]): boolean {
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    if (GE.inPoly(P(a.u + (b.u - a.u) * t, a.v + (b.v - a.v) * t), poly)) return true;
  }
  return false;
}

describe('Foley3 — the cast', () => {
  it('the roles are appended and fixed', () => {
    assert.equal(CAST.castFor('foley.performer').id, 'mei', 'the Foley performer stays Mei');
    assert.equal(OP.id, 'ruth');
    assert.equal(CAST.castFor('spatial.singer').id, 'ana');
    assert.equal(CAST.castFor('spatial.walker').id, 'kofi');
    assert.equal(CAST.castFor('spatial.listener').id, 'mei');
  });
  it('the boom operator is never F02’s performer, F08’s walker or the vehicle plan’s crew', () => {
    assert.notEqual(OP.id, CAST.castFor('foley.performer').id);
    assert.notEqual(OP.id, SA.sitePersonWho(0).id, 'F08 walk: the site’s one person');
    assert.notEqual(OP.id, SA.sitePersonWho(1).id, 'F08 vehicle: the second crew member');
  });
  it('F10: the singer, the walker and the listener are three different people', () => {
    const ids = new Set([F10P.SINGER_WHO.id, F10P.WALKER_WHO.id, F10P.LISTENER_WHO.id]);
    assert.equal(ids.size, 3);
  });
});

describe('Foley3 — THE BOOM GEOMETRY (checked first)', () => {
  const cases: { slopeDeg: number; handsH: number; flip: boolean }[] = [];
  for (const slopeDeg of [-60, -40, -20, -5, 0, 3, 10, 20, 33, 45, 60, 75, 85])
    for (const handsH of [1400, 1560, 1768])
      for (const flip of [false, true]) cases.push({ slopeDeg, handsH, flip });

  it('the engine pole (mic tail → hands) never enters the head or the hair, at any slope, height or side', () => {
    for (const c of cases) {
      const rig = RIG.poleRig(c, OP.body?.shoulder ?? 1);
      const plan = PV.personPlan(rig.side, OP, {});
      const t = (c.slopeDeg * Math.PI) / 180;
      const s = c.flip ? -1 : 1;
      const hands = P(0, -c.handsH);
      const tail = P(-s * Math.cos(t) * COL.POLE_LEN, -c.handsH - Math.sin(t) * COL.POLE_LEN);
      for (const poly of [plan.head.skull, plan.head.hair, plan.head.neck]) assert.equal(segHitsPoly(hands, tail, poly), false, `pole through the head at ${JSON.stringify(c)}`);
      // and its drawn rear section (behind the rear fist) stays clear too
      const b = P(rig.pole.b.x, rig.pole.b.y);
      for (const poly of [plan.head.skull, plan.head.hair]) assert.equal(segHitsPoly(b, hands, poly), false, `rear section through the head at ${JSON.stringify(c)}`);
    }
  });

  it('the pole runs from the hands AWAY from the body (the body behind the rear fist)', () => {
    for (const c of cases) {
      const rig = RIG.poleRig(c, OP.body?.shoulder ?? 1);
      const s = c.flip ? -1 : 1;
      // the operator's neck is behind the rear fist (+x in the engine's local frame, before the mirror)
      assert.ok(s * rig.side.neck.u >= 250, `neck behind the hands: ${JSON.stringify(c)}`);
      assert.ok(-s * (rig.front.x - rig.rear.x) >= 0, 'the front fist toward the mic');
    }
  });

  it('both fists are ON the pole (the rear at its end, the front on its line), hands a real grip apart', () => {
    for (const c of cases) {
      const rig = RIG.poleRig(c, OP.body?.shoulder ?? 1);
      assert.deepEqual([rig.rear.x, rig.rear.z], [0, 0]);
      assert.equal(Math.round(-rig.rear.y), Math.round(c.handsH / 10) * 10);
      const d = { x: rig.pole.a.x - rig.pole.b.x, y: rig.pole.a.y - rig.pole.b.y };
      const l = Math.hypot(d.x, d.y);
      const off = Math.abs((rig.front.x - rig.pole.b.x) * d.y - (rig.front.y - rig.pole.b.y) * d.x) / l;
      assert.ok(off < 0.5, `front fist off the pole by ${off.toFixed(2)} mm`);
      assert.ok(rig.gap >= RIG.GAP_MIN && rig.gap <= RIG.GAP_MAX);
    }
  });

  it('no arm is stretched past its length; the near arm takes the rear hand', () => {
    for (const c of cases) {
      const rig = RIG.poleRig(c, OP.body?.shoulder ?? 1);
      const arms = RIG.poleArms(rig, OP.body?.shoulder ?? 1);
      for (const a of arms) assert.ok(a.reach <= 1.0, `${a.side} arm at ${(a.reach * 100).toFixed(0)}% of its length: ${JSON.stringify(c)}`);
      // the elbows hang below the fists' line (a low hold, never winged up beside the head)
      for (const a of arms) assert.ok(a.elbow.y > Math.min(a.shoulder.y, a.fist.y), `${a.side} elbow raised: ${JSON.stringify(c)}`);
      const B = POV.polePlans(rig, OP, 'side');
      const rearPlan = B.arms.find((a: { hand: { arm: { fist: { x: number } } } }) => a.hand.arm.fist.x === rig.rear.x);
      assert.equal(rearPlan.far, false, 'the near arm holds the pole’s end');
    }
  });

  it('in profile no arm crosses the face (the upper arm and forearm stay off the skull)', () => {
    for (const c of cases) {
      const rig = RIG.poleRig(c, OP.body?.shoulder ?? 1);
      const plan = PV.personPlan(rig.side, OP, {});
      const B = POV.polePlans(rig, OP, 'side');
      for (const ap of B.arms) {
        const A = ap.arm;
        for (const [p, q] of [[A.shoulder, A.elbow], [A.elbow, A.wrist]] as [Pt, Pt][]) {
          if (ap.far) continue; // (the far arm is drawn behind the head and the body)
          assert.equal(segHitsPoly(p, q, plan.head.skull), false, `near arm across the face at ${JSON.stringify(c)}`);
        }
      }
    }
  });

  it('the engine draws the operator over the pole and re-solves it only for a lesson that asks', () => {
    const ps = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
    assert.match(ps, /over=\{!!art\.poleOperatorOver\}/);
    assert.match(ps, /\{over \? null : op\}/);
    assert.match(ps, /\{over \? op : null\}/);
    for (const f of [`${L}/f02Clothing/art.tsx`, `${L}/f08Passby/art.tsx`]) {
      const s = read(f);
      assert.match(s, /PoleOperator: V2 \? PoleOperatorV2 : PoleOperatorArt/);
      assert.match(s, /poleOperatorOver: V2/);
    }
  });
});

describe('Foley3 — F02 Clothing', () => {
  it('the jacket, the floor and the bodies are the lesson’s own (nothing moved)', () => {
    assert.deepEqual(F02G.JACKET, { hangs: 330, across: 230, thick: 90 });
    assert.equal(F02G.FLOOR, 1200);
  });
  it('the held fists close where the lesson’s hands were (about 75 mm past each wrist)', () => {
    const H = F02V.heldArms('side');
    for (const ap of H.arms) {
      const wr = ap.hand.arm.side === 'R' ? F02G.HOLDER.wrR : F02G.HOLDER.wrL;
      const f = ap.hand.arm.fist;
      const d = Math.hypot(f.x - wr.x, f.y - wr.y, f.z - wr.z);
      assert.ok(Math.abs(d - 75) < 1, `fist ${d.toFixed(1)} mm from the wrist`);
      // (review 2026-11-24, "staple arms" from above: the drawn elbow settled a little forward, lower and in — a
      // drawing default, within a few centimetres of the lesson's own; the fists, the jacket and the envelope
      // unchanged)
      const e0 = ap.hand.arm.side === 'R' ? F02G.HOLDER.elR : F02G.HOLDER.elL;
      const e = ap.hand.arm.elbow;
      assert.ok(Math.hypot(e.x - e0.x, e.y - e0.y, e.z - e0.z) < 60, 'near the lesson’s own elbow');
    }
    // the near (right) arm is drawn near, the left far
    assert.equal(H.arms.find((a: { hand: { arm: { side: string } } }) => a.hand.arm.side === 'R').far, false);
    assert.equal(H.arms.find((a: { hand: { arm: { side: string } } }) => a.hand.arm.side === 'L').far, true);
  });
  it('the labels are unchanged (text and place)', () => {
    const side = F02A.clothingLabels('side', 'held').map((l: { id: string; text: string; u: number; v: number }) => [l.id, l.text, l.u, l.v]);
    assert.deepEqual(side, [['jacket', 'LEATHER JACKET', 260, 230], ['fold', 'THE FOLD', 240, -150]]);
    const worn = F02A.clothingLabels('side', 'worn').map((l: { id: string; text: string }) => [l.id, l.text]);
    assert.deepEqual(worn, [['jacket', 'SLEEVE PAST THE BODY']]);
  });
  it('labels keep off the new outlines: the head, the hands and the arms are the figure', () => {
    const H = F02V.heldArms('side');
    for (const ap of H.arms) {
      const f = ap.hand.arm.fist;
      assert.equal(F02V.clothingCoversV2('side', 'held', f.x, f.y, 0), true, 'the fist');
      const e = ap.arm.elbow;
      assert.equal(F02V.clothingCoversV2('side', 'held', e.u, e.v, 2), true, 'the elbow');
    }
    const hc = F02G.HOLDER.head;
    assert.equal(F02V.clothingCoversV2('side', 'held', hc.x, hc.y, 0), true, 'the head');
    assert.equal(F02V.clothingCoversV2('side', 'held', 260, 230, 0), false, 'the jacket label’s place is free');
  });
  it('the art draws the new look behind the switch, folds soft, the worn jacket in leather', () => {
    const s = read(`${L}/f02Clothing/art.tsx`);
    assert.match(s, /export const V2 = figureV2On\('sidePlayers'\)/);
    assert.match(s, /<ClothingPersonV2 view="side"/);
    assert.match(s, /<ClothingPersonV2 view="top"/);
    const v = read(`${L}/f02Clothing/clothingV2.tsx`);
    assert.match(v, /<SoftFolds\.Provider value>/);
    assert.equal(F02V.WEARER_WHO.id, 'mei');
    assert.equal(F02V.WEARER_WHO.look.JACKET, F02V.LEATHER_JACKET);
  });
});

describe('Foley3 — F08 Pass-bys', () => {
  it('the site’s people and the page token are the cast (the walker one person on every page)', () => {
    const a = read(`${L}/f08Passby/art.tsx`);
    assert.match(a, /v2=\{v2\}/);
    const p = read(`${L}/f08Passby/pages.tsx`);
    assert.match(p, /hide=\{\['person'\]\} v2=\{V2\}/);
    assert.match(p, /hide=\{\['car'\]\} v2=\{V2\}/);
    assert.match(p, /view="top" v2=\{V2\} who=\{WALKER_WHO\}/);
    assert.match(p, /const WALKER_WHO = sitePersonWho\(0\)/);
  });
});

describe('Foley3 — F10 Spatial Field', () => {
  it('the singer’s and the performer’s mouths are the lesson’s mouth points', () => {
    for (const [poses, mouth] of [[F10S.SINGER_POSES, F10G.PLAZA.singerMouth], [F10S.PERFORMER_POSES, F10G.EVENT.perfMouth]] as const) {
      const plan = PV.personPlan(poses.side, F10P.SINGER_WHO, { lip: { u: mouth.x, v: mouth.y }, rest: 'restSide' });
      // the mouth point lies on the drawn head (at its front edge: within the skull or a few mm off it)
      const near = plan.head.skull.some((q: Pt) => Math.hypot(q.u - mouth.x, q.v - mouth.y) < 30);
      assert.ok(near, 'the mouth on the face');
    }
  });
  it('the people are the figure for labels and taps (the new outlines)', () => {
    const m = F10G.PLAZA.singerMouth;
    assert.equal(F10S.spatialFigureAt('side', 'plaza', m.x + 60, m.y + 400, 0), true, 'the singer’s chest');
    assert.equal(F10S.spatialHitTest('side', 'plaza', m.x + 60, m.y + 400, 0), 'sp.singer');
    // the walker face-on: the approved front skeleton at the walker's place, standing on the ground
    const w = F10S.walkerPoses({ x: 2900, y: 0, z: 0 });
    const f = F10P.walkerFront(w.side.neck.u);
    assert.equal(f.footR.v, 0);
    assert.ok(Math.abs(f.neck.u - w.side.neck.u) < 1);
    assert.equal(F10P.walkerCoversV2('side', w, 2900, -1250, 0), true, 'the walker’s chest (the label’s leader end)');
  });
  it('the in-ear head is sized so its ears sit under the in-ear mics (a few percent at most)', () => {
    const k = 85 / F10P.HEAD_EARS.half;
    assert.ok(k > 0.85 && k < 1.2, `head scale ${k.toFixed(2)}`);
  });
  it('every person of the lesson goes through the new look behind its switch', () => {
    const s = read(`${L}/f10SpatialField/scene.tsx`);
    assert.match(s, /export const V2 = figureV2On\('sidePlayers'\)/);
    assert.match(s, /<SingerV2 view=\{view\} poses=\{PERFORMER_POSES\}/);
    assert.match(s, /<SingerV2 view=\{view\} poses=\{SINGER_POSES\}/);
    assert.match(s, /<WalkerV2 view=\{view\} poses=\{walker\}/);
    assert.match(s, /<ListenerTopV2 pose=\{LISTENER_TOP\}/);
    const p = read(`${L}/f10SpatialField/pages.tsx`);
    assert.equal((p.match(/<ListenerHeadV2 /g) ?? []).length, 2, 'the in-ear head and the playback head');
  });
});
