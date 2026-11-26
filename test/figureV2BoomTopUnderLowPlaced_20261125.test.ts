/**
 * FIGURE V2 — THE APPROVED LOW UNDERHAND HAND FROM ABOVE, PLACED ON THE BOOM OPERATOR (2026-11-25). poleHandTopUnderLow.tsx
 * (the underhand hold with the mic dragged BELOW THE MOUTH: the pole out of the fist over the wrist, the forearm ±150°
 * from the pole's thumb end) is approved and FROZEN; BoomV2 places it beside poleHandTopUnder (±98°): an underhand hand
 * whose forearm lies past TOP_UNDER_SPLIT (±140°, in the gap between the poses the owner passed with poleHandTopUnder and
 * the below-the-mouth ones) takes it first, else poleHandTopUnder first, each within its own fit; a drawing carried
 * through a drag kept until the forearm is TOP_UNDER_PICK_HOLD past the line. Checked here:
 *   • the frozen art file is untouched (its text hash); BoomV2 imports it and paints it (handSil, BoomHandArt, the fade);
 *   • B10 dragged below the mouth (b10live1) takes it, ≤ 6.7° off; start, raised, the drag grid, the sweep's step 13
 *     (32.7° off) and every pose the owner passed keep poleHandTopUnder;
 *   • placed: the grip on the fist, its pole axis along the rig's pole, turned only (never scaled or sheared), the
 *     forearm one straight line elbow → wrist through the drawing's own cuff, mirrored (re-lit by the drawing's option);
 *   • the pole stays IN FRONT of the wrist: the drawing's skin over the pole's axis at the wrist, the pole piece drawn far
 *     enough toward the little-finger end to cover all of it, painted after the hand's body; the scene's pole after the
 *     sleeves;
 *   • the hold: within TOP_UNDER_PICK_HOLD of ±140° a hand keeps what it carried; a drag sweep changes once each way.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const BV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx'));
const PL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTopUnderLow.tsx'));
const FSm = R(await import('../src/dev/frontBoomStudy.tsx'));

type Pt = { u: number; v: number };
type V3 = { x: number; y: number; z: number };
type At = { x: number; y: number; rot: number; mirror: boolean };
type Hand = {
  painter?: string;
  poleTopUnder?: At;
  poleTopUnderLow?: At;
  topFace?: { fits: boolean; why?: string; drawing?: string; underOff?: number; lowOff?: number; underWhy?: string };
  arm: { side: 'L' | 'R'; fist: V3; elbow: V3; under?: boolean };
};
type ArmP = { hand: Hand; arm: { elbow: Pt; wrist: Pt; opening: { e: { c: Pt } } } };
type Plans = { arms: ArmP[]; vs: { proj: (p: V3) => Pt; toward: V3 }; poleDir: V3; o: unknown };
const plans = (rig: unknown, who: unknown, hold?: unknown, mode?: string): Plans => BV.boomPlans(rig, who, 'top', false, hold, mode) as Plans;
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FV = 'src/screens/lab/miking/lessons/shared/figureV2';

const rigs = FSm.SIDE_RIGS as { key: string; title: string; rig: unknown; who: unknown }[];
const rigOf = (k: string) => rigs.find((x) => x.key === k)!.rig;
const B10 = rigs.find((x) => x.key === 'b10')!;
const WHO = B10.who;
const live = (d: number, e: number) => {
  const q = (e * Math.PI) / 180;
  const front = { x: d * Math.cos(q), y: -d * Math.sin(q), z: 0 };
  const l = Math.hypot(front.x, front.y);
  return FSm.b10LiveRig(front, { x: -front.x / l, y: -front.y / l, z: 0 }) as unknown;
};
const left = (B: Plans) => B.arms.find((a) => a.hand.arm.side === 'L')!;
const right = (B: Plans) => B.arms.find((a) => a.hand.arm.side === 'R')!;
const measured = (rig: unknown) => {
  const B = plans(rig, WHO);
  return (BV.topUnderAngle(B.o, left(B).hand.arm, B.poleDir, B.vs) as { measured: number }).measured;
};
const unit2 = (p: Pt): Pt => {
  const l = Math.hypot(p.u, p.v) || 1;
  return { u: p.u / l, v: p.v / l };
};
const cross2 = (a: Pt, b: Pt) => a.u * b.v - a.v * b.u;
function inside(q: Pt[], p: Pt): boolean {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const a = q[i];
    const b = q[j];
    if (a.v > p.v !== b.v > p.v && p.u < ((b.u - a.u) * (p.v - a.v)) / (b.v - a.v) + a.u) c = !c;
  }
  return c;
}
/** Points along the start → below-the-mouth drag (the study page's sweep, finer). */
function dragPath(n: number): unknown[] {
  const a = { f: { x: 900 * Math.SQRT1_2, y: -900 * Math.SQRT1_2 }, m: { x: -1, y: 1 } };
  const b = { f: { x: 260, y: 260 }, m: { x: -0.7, y: -1 } };
  const out: unknown[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const mx = a.m.x + (b.m.x - a.m.x) * t;
    const my = a.m.y + (b.m.y - a.m.y) * t;
    const l = Math.hypot(mx, my);
    const r = FSm.b10LiveRig({ x: a.f.x + (b.f.x - a.f.x) * t, y: a.f.y + (b.f.y - a.f.y) * t, z: 0 }, { x: mx / l, y: my / l, z: 0 });
    if (r) out.push(r);
  }
  return out;
}
/** [prefer left, right] in the plan's arm order, for a hold. */
const holdFor = (rig: unknown, l: string) => {
  const B = plans(rig, WHO);
  const ix = B.arms.indexOf(left(B));
  const t = ['old', 'old'];
  t[ix] = l;
  t[1 - ix] = (BV.topDrawings as (b: Plans) => string[])(B)[1 - ix];
  return { top: t };
};

describe('the approved LOW underhand hand from above, placed on the boom operator (BoomV2 poleTopUnderLow)', () => {
  it('the frozen art is untouched; BoomV2 imports it, outlines it, paints it, keeps it out of the shoulder fade', () => {
    const art = src(`${FV}/poleHandTopUnderLow.tsx`);
    assert.equal(createHash('sha256').update(art).digest('hex'), FROZEN_TOP_UNDER_LOW, 'poleHandTopUnderLow.tsx is frozen (owner-approved 2026-11-25)');
    const b = src(`${FV}/BoomV2.tsx`);
    assert.match(b, /from '\.\/poleHandTopUnderLow'/);
    assert.match(b, /hp\.painter === 'poleTopUnderLow' && hp\.poleTopUnderLow\s*\? poleHandTopUnderLowOutline\(\{ \.\.\.hp\.poleTopUnderLow, s: 1, sleeve: false \}\)/);
    assert.match(b, /<PoleHandTopUnderLow x=\{ptl\.x\} y=\{ptl\.y\} s=\{1\} rot=\{ptl\.rot\} mirror=\{ptl\.mirror\} sleeve=\{false\} poleLook="boom" ownScale=\{false\} pole=\{\[-150, 110\]\} \/>/);
    assert.match(b, /const fadeOver = ap\.hand\.painter === 'poleTopUnder' \|\| ap\.hand\.painter === 'poleTopUnderLow' \? Skia\.Path\.MakeFromOp\(torso\.body, sil, PathOp\.Difference\) \?\? torso\.body : torso\.body;/);
    assert.match(b, /<Group clip=\{fadeOver\}>\s*<Path path=\{root\.plane\} blendMode="dstOut">/);
    assert.equal(BV.TOP_UNDER_TOL, 40);
    assert.equal(BV.TOP_UNDER_HOLD, 5);
    assert.equal(BV.TOP_UNDER_LOW_TOL, 30);
    assert.equal(BV.TOP_UNDER_SPLIT, 140);
    assert.equal(BV.TOP_UNDER_PICK_HOLD, 2);
  });

  it('B10 dragged below the mouth (b10live1) takes it on the left hand, ≤ 6.7° off ±150°, mirrored; the right hand unchanged', () => {
    for (const rig of [rigOf('b10live1'), rigs.find((x) => x.title.includes('dragged below the mouth'))!.rig]) {
      const B = plans(rig, WHO);
      const L = left(B);
      assert.ok(L.hand.arm.under, 'the underhand hold');
      assert.equal(L.hand.painter, 'poleTopUnderLow', L.hand.topFace?.underWhy);
      assert.equal(L.hand.topFace!.drawing, 'topUnderLow');
      assert.ok(L.hand.topFace!.fits);
      assert.ok(L.hand.topFace!.lowOff! < 6.7, `${L.hand.topFace!.lowOff!.toFixed(1)}° off ±150°`);
      assert.ok(L.hand.topFace!.lowOff! < L.hand.topFace!.underOff!, 'nearer ±150° than ±98°');
      assert.equal(L.hand.poleTopUnderLow!.mirror, true);
      assert.equal(L.hand.poleTopUnder, undefined);
      // (the right hand: the same as with the underhand rule off for the left — not an underhand drawing)
      assert.ok(!['poleTopUnder', 'poleTopUnderLow'].includes(right(B).hand.painter ?? ''), 'right hand');
    }
    // (read 2026-11-25: −154.5°, 4.5° off)
    const m = measured(rigOf('b10live1'));
    assert.ok(Math.abs(m + 154.5) < 0.5, `${m.toFixed(1)}°`);
  });

  it('start, raised and every drag of the grid keep poleHandTopUnder (unchanged)', () => {
    for (const k of ['b10', 'b10live0', 'b10live2']) assert.equal(left(plans(rigOf(k), WHO)).hand.painter, 'poleTopUnder', k);
    let n = 0;
    for (const d of [600, 700, 800, 900, 1000])
      for (const e of [20, 30, 40, 50, 60]) {
        const rig = live(d, e);
        if (!rig) continue;
        const L = left(plans(rig, WHO));
        if (!L.hand.arm.under) continue;
        n++;
        assert.equal(L.hand.painter, 'poleTopUnder', `${d} mm at ${e}°`);
      }
    assert.ok(n >= 20, `${n} dragged poses`);
    // (the sweep's step 13 of 24 on /boomtopunder, 32.7° off: passed by the owner with poleHandTopUnder — kept)
    const uv = (p: { x: number; y: number }) => {
      const l = Math.hypot(p.x, p.y);
      return { x: p.x / l, y: p.y / l };
    };
    const a0 = { x: 900 * Math.SQRT1_2, y: -900 * Math.SQRT1_2 };
    const m0 = uv({ x: -1, y: 1 });
    const m1 = uv({ x: -0.7, y: -1 });
    const t13 = 13 / 24;
    const edge = FSm.b10LiveRig({ x: a0.x + (260 - a0.x) * t13, y: a0.y + (260 - a0.y) * t13, z: 0 }, { ...uv({ x: m0.x + (m1.x - m0.x) * t13, y: m0.y + (m1.y - m0.y) * t13 }), z: 0 });
    const E = left(plans(edge, WHO));
    assert.equal(E.hand.painter, 'poleTopUnder', 'sweep step 13');
    assert.ok(Math.abs(E.hand.topFace!.underOff! - 32.7) < 0.2, `${E.hand.topFace!.underOff!.toFixed(1)}° off`);
    // (every pose: poleHandTopUnder wherever its forearm is within ±140° and that drawing fits — every pose passed with it
    // stays; the low one past ±140°)
    let low = 0;
    let kept = 0;
    for (let d = 200; d <= 1000; d += 50)
      for (let e = -40; e <= 80; e += 5) {
        const rig = live(d, e);
        if (!rig) continue;
        const L = left(plans(rig, WHO));
        if (!L.hand.arm.under) continue;
        const m = Math.abs(measured(rig));
        const t = L.hand.topFace!;
        if (m <= 140 && t.underOff! <= 40) {
          assert.equal(L.hand.painter, 'poleTopUnder', `${d} mm at ${e}°: ${m.toFixed(1)}°`);
          kept++;
        } else if (m > 140 && t.lowOff! <= 30) {
          assert.equal(L.hand.painter, 'poleTopUnderLow', `${d} mm at ${e}°: ${m.toFixed(1)}°`);
          low++;
        }
      }
    assert.ok(low >= 10 && kept >= 20, `${low} poses take the low drawing, ${kept} keep poleHandTopUnder`);
  });

  it('no other hand changes: other rigs, B10’s right hand, B10’s left with the underhand rule off', () => {
    for (const r of rigs)
      for (const a of plans(r.rig, r.who).arms) if (!a.hand.arm.under) assert.notEqual(a.hand.painter, 'poleTopUnderLow', `${r.key} ${a.hand.arm.side}`);
    assert.notEqual(left(plans(rigOf('b10live1'), WHO, undefined, 'none')).hand.painter, 'poleTopUnderLow');
  });

  it('placed: the grip on the fist, the pole axis along the rig’s pole, turned only, the forearm one straight line into the cuff', () => {
    const B = plans(rigOf('b10live1'), WHO);
    const L = left(B);
    const at = L.hand.poleTopUnderLow!;
    const F2 = B.vs.proj(L.hand.arm.fist);
    assert.ok(Math.hypot(at.x - F2.u, at.y - F2.v) < 1e-6, 'the grip on the lesson’s grip point');
    const P1 = B.vs.proj({ x: L.hand.arm.fist.x + B.poleDir.x, y: L.hand.arm.fist.y + B.poleDir.y, z: L.hand.arm.fist.z + B.poleDir.z });
    const pd = { u: P1.u - F2.u, v: P1.v - F2.v };
    const ax = PL.poleHandTopUnderLowAxisOnPage({ rot: at.rot, mirror: true }) as Pt;
    assert.ok(Math.abs(cross2(unit2(pd), ax)) < 1e-6, 'the drawn pole along the rig’s pole');
    // (turned only: every distance in the drawing kept, mm for mm)
    const toPage = PL.poleHandTopUnderLowToPage({ ...at, s: 1 }) as (q: Pt) => Pt;
    const A = PL.POLE_HAND_TOP_UNDER_LOW as { fingers: Pt[][]; body: Pt[]; thumb: Pt[] };
    const q0 = A.body[0];
    const q1 = A.body[Math.floor(A.body.length / 2)];
    const p0 = toPage(q0);
    const p1 = toPage(q1);
    assert.ok(Math.abs(Math.hypot(p1.u - p0.u, p1.v - p0.v) - Math.hypot(q1.u - q0.u, q1.v - q0.v)) < 1e-6, 'not scaled');
    assert.ok(Math.abs(at.rot) < (8 * Math.PI) / 180, `turned ${((at.rot * 180) / Math.PI).toFixed(1)}° (the drawing is authored for this pose)`);
    // (the forearm: one straight line elbow → wrist on the drawing's own forearm line through its cuff)
    const fe = PL.poleHandTopUnderLowForeOnPage({ rot: at.rot, mirror: true }) as Pt;
    const W = toPage(PL.POLE_HAND_TOP_UNDER_LOW_CUFF as Pt);
    const arm = L.arm;
    const ew = unit2({ u: arm.wrist.u - arm.elbow.u, v: arm.wrist.v - arm.elbow.v });
    assert.ok(Math.abs(cross2(ew, fe)) < 1e-3 && ew.u * fe.u + ew.v * fe.v < -0.999, 'the forearm along the drawing’s (elbow → wrist)');
    const off = (p: Pt) => Math.abs(cross2({ u: p.u - W.u, v: p.v - W.v }, fe));
    assert.ok(off(arm.elbow) < 0.5 && off(arm.wrist) < 0.5, 'the forearm’s line through the drawing’s cuff (no kink)');
    const c = arm.opening.e.c;
    assert.ok(off(c) < 0.5 && Math.hypot(c.u - W.u, c.v - W.v) < 12, `the sleeve’s mouth on the cuff rim (${Math.hypot(c.u - W.u, c.v - W.v).toFixed(1)} mm)`);
    // (the elbow where the rig's is, within the 4.5° pose error)
    const E = B.vs.proj(L.hand.arm.elbow);
    assert.ok(Math.hypot(arm.elbow.u - E.u, arm.elbow.v - E.v) < 40, `elbow ${Math.hypot(arm.elbow.u - E.u, arm.elbow.v - E.v).toFixed(0)} mm from the rig's`);
  });

  it('the pole is WITHIN the fist and IN FRONT of the wrist: skin over its axis there, the pole piece covering it all, painted after the forearm', () => {
    const B = plans(rigOf('b10live1'), WHO);
    const L = left(B);
    const at = L.hand.poleTopUnderLow!;
    const toPage = PL.poleHandTopUnderLowToPage({ ...at, s: 1 }) as (q: Pt) => Pt;
    const A = PL.POLE_HAND_TOP_UNDER_LOW as { fingers: Pt[][]; body: Pt[]; thumb: Pt[] };
    const F2 = B.vs.proj(L.hand.arm.fist);
    const ax = PL.poleHandTopUnderLowAxisOnPage({ rot: at.rot, mirror: true }) as Pt;
    const k0 = PL.POLE_TOP_UNDER_LOW_FORESHORTEN as number;
    const on = (k: number) => ({ u: F2.u + ax.u * k * k0, v: F2.v + ax.v * k * k0 });
    const body = A.body.map(toPage);
    const skin = [...A.fingers, A.body, A.thumb].map((q) => q.map(toPage));
    // (the fist round the pole: skin over the axis through the fist)
    for (const k of [-30, -15, 0, 15, 30]) assert.ok(skin.some((q) => inside(q, on(k))), `skin over the pole ${k} mm along`);
    // (past the fist toward the little-finger end the pole lies over the WRIST: the hand's body under it there)
    for (const k of [-50, -60]) assert.ok(inside(body, on(k)), `the wrist under the pole ${k} mm along`);
    // (the hand's own pole piece reaches past every bit of skin under the pole's axis: from −150 mm)
    let last = 0;
    for (let k = 0; k >= -200; k -= 1) if (skin.some((q) => inside(q, on(k)))) last = k;
    assert.ok(last > -150, `skin under the axis to ${last} mm; the pole piece from −150 mm`);
    // (paint order: in the drawing the pole after the hand's body — the wrist and forearm — and before the fingers)
    const art = src(`${FV}/poleHandTopUnderLow.tsx`);
    const paint = art.slice(art.indexOf('function TopUnderLowPaint('));
    const iBody = paint.indexOf('<HandFill path={B.body}');
    const iPole = paint.indexOf('{poleArt}');
    const iFingers = paint.indexOf('<HandFill path={B.fingers[i]}');
    assert.ok(iBody > 0 && iPole > iBody && iFingers > iPole, 'body → pole → fingers');
    // (the boom look's pole is drawn inside the hand's whole outline, so over the wrist too)
    assert.match(art, /poleClip: op\(grown\(all, 1\.2\), pole, PathOp\.Intersect\)/);
    // (the operator from above: the scene's pole after the arms and sleeves; outside the hands' outlines)
    const b = src(`${FV}/BoomV2.tsx`);
    assert.match(b, /\{order\.map\(arm\)\}\s*\{poleArt\}/);
    assert.match(b, /<Group clip=\{handsAll\} invertClip>\s*<PoleSeg a=\{B\.pole\.a\} b=\{B\.pole\.b\} proj=\{proj\} \/>/);
    // (with this hand the scene's pole is one layer with the hands taken out once: no dark rim line along the forearm's
    // edge where the outline crosses the pole lengthwise; only with this hand)
    assert.match(b, /const poleOneEdge = B\.arms\.some\(\(a\) => a\.hand\.painter === 'poleTopUnderLow'\);/);
    assert.match(b, /<Group layer=\{<Paint \/>\}>\s*<PoleSeg a=\{B\.pole\.a\} b=\{B\.pole\.b\} proj=\{proj\} \/>\s*<Path path=\{handsAll\} color="black" blendMode="dstOut" \/>/);
  });

  it('the hold: within TOP_UNDER_PICK_HOLD of ±140° a hand keeps what it carried; a drag sweep changes once each way', () => {
    const split = BV.TOP_UNDER_SPLIT as number;
    const ph = BV.TOP_UNDER_PICK_HOLD as number;
    const first = BV.topUnderLowFirst as (off: number, lowOff: number, prefer?: string) => boolean;
    // (the rule on the forearm's angle a° from the pole's thumb end: off ±98° = |a − 98|, off ±150° = |a − 150|)
    const at = (a: number, prefer?: string) => first(Math.abs(a - 98), Math.abs(a - 150), prefer);
    for (const a of [100, 124, 130.7, 138, 139.9]) assert.equal(at(a), false, `${a}°: poleHandTopUnder first`);
    for (const a of [140.1, 143, 150, 157, 175]) assert.equal(at(a), true, `${a}°: the low drawing first`);
    for (const a of [split - ph + 0.1, split, split + ph - 0.1]) {
      assert.equal(at(a, 'topUnder'), false, `${a.toFixed(1)}°: poleHandTopUnder carried, kept`);
      assert.equal(at(a, 'topUnderLow'), true, `${a.toFixed(1)}°: the low drawing carried, kept`);
    }
    assert.equal(at(split + ph + 0.1, 'topUnder'), true, 'past the hold: changes');
    assert.equal(at(split - ph - 0.1, 'topUnderLow'), false, 'past the hold: changes back');
    // (the same on real rigs, where one falls in the hold's band: B10's real poses leave a gap round ±140°)
    for (let d = 200; d <= 1000; d += 25)
      for (let e = -40; e <= 80; e += 2.5) {
        const r = live(d, e);
        if (!r || !left(plans(r, WHO)).hand.arm.under) continue;
        const m = Math.abs(measured(r));
        if (Math.abs(m - split) > ph - 0.1) continue;
        assert.equal(left(plans(r, WHO, holdFor(r, 'topUnder'))).hand.painter, 'poleTopUnder', `${m.toFixed(1)}°: kept`);
        assert.equal(left(plans(r, WHO, holdFor(r, 'topUnderLow'))).hand.painter, 'poleTopUnderLow', `${m.toFixed(1)}°: kept`);
      }
    // (a moving rig with only the side view's hold remembers the drawing it carried last; neither holds past the band)
    plans(B10.rig, WHO, { side: [] });
    assert.equal(left(plans(rigOf('b10live1'), WHO, { side: [] })).hand.painter, 'poleTopUnderLow', 'carried from the start: below the mouth takes the low one');
    assert.equal(left(plans(rigOf('b10live2'), WHO, { side: [] })).hand.painter, 'poleTopUnder', 'carried from below the mouth: raised takes poleHandTopUnder back');
    // (a drag sweep start → below → start: one change each way between the two, the way back at a smaller angle)
    const path = dragPath(120);
    let top: string[] | undefined;
    const sw = [...path, ...path.slice(0, -1).reverse()];
    const changes: { i: number; m: number; to: string }[] = [];
    sw.forEach((r, i) => {
      const B = plans(r, WHO, top ? { top } : undefined);
      const L = left(B);
      const now = L.hand.topFace?.drawing ?? 'old';
      const was = top?.[B.arms.indexOf(L)];
      if (was && was !== now) changes.push({ i, m: measured(r), to: now });
      top = (BV.topDrawings as (b: Plans) => string[])(B);
    });
    assert.equal(changes.length, 2, JSON.stringify(changes));
    assert.equal(changes[0].to, 'topUnderLow', JSON.stringify(changes));
    assert.equal(changes[1].to, 'topUnder', JSON.stringify(changes));
    // (going down past the line and its hold, coming back short of both)
    assert.ok(changes[0].m < -(split + ph) && changes[1].m > -(split - ph) && changes[0].i < sw.length / 2 && changes[1].i > sw.length / 2, JSON.stringify(changes));
  });
});

/** The approved art's text (CRLF normalised), 2026-11-25. */
const FROZEN_TOP_UNDER_LOW = 'b0313490997839458dbbb096292874adf010f5a661150b45a2e168b966bb38ba';
