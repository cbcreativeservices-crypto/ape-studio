/**
 * FIGURE V2 — THE APPROVED UNDERHAND HAND FROM ABOVE, PLACED ON THE BOOM OPERATOR (2026-11-25). poleHandTopUnder.tsx is
 * approved and FROZEN; BoomV2 places it (mirrored, re-lit: the file's own option) on a hand in the underhand hold
 * (BoomArm3.under — OVERHEAD_UNDERHAND 'ruledHandOnly': B10's left hand) in the view from above, where the rig's
 * forearm on the page is within TOP_UNDER_TOL of the drawing's ±98° from the pole's thumb end. Checked here:
 *   • the frozen art file is untouched (its text hash); BoomV2 imports it and paints it (handSil + BoomHandArt);
 *   • B10 start (≤ 1° off), raised (≤ 3°), every pose of the drag grid (≤ 20°) take it on the left hand; dragged below the
 *     mouth (≈ 56° off) does NOT and keeps what it had (the overhand top drawing or the old hand, as before);
 *   • no other hand changes: B10's right hand, every hand of B04 / B04 low / F09 / B11, and B10's left with the
 *     underhand rule off ('none') never take it;
 *   • placed: its grip on the lesson's grip point, its pole axis along the rig's pole toward the thumb, the pole THROUGH
 *     the closed hand (skin over the axis inside the fist, clear past it), the forearm one straight line from the elbow
 *     to the drawing's own cuff (no kink, the sleeve's mouth on the cuff rim);
 *   • the hold through a drag: a pose between TOP_UNDER_TOL − HOLD and + HOLD keeps whichever it carried; a moving rig
 *     whose caller names no `hold.top` remembers it (b10Sideline passes only the side view's hold).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const BV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx'));
const PT = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTopUnder.tsx'));
const FSm = R(await import('../src/dev/frontBoomStudy.tsx'));

type Pt = { u: number; v: number };
type V3 = { x: number; y: number; z: number };
type Hand = {
  painter?: string;
  poleTopUnder?: { x: number; y: number; rot: number; mirror: boolean };
  topFace?: { fits: boolean; why?: string; drawing?: string; underOff?: number; underWhy?: string };
  arm: { side: 'L' | 'R'; fist: V3; elbow: V3; under?: boolean };
};
type ArmP = { hand: Hand; arm: { elbow: Pt; wrist: Pt; opening: { e: { c: Pt } } } };
type Plans = { arms: ArmP[]; vs: { proj: (p: V3) => Pt; toward: V3 }; poleDir: V3 };
const plans = (rig: unknown, who: unknown, hold?: unknown, mode?: string): Plans => BV.boomPlans(rig, who, 'top', false, hold, mode) as Plans;
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const rigs = FSm.SIDE_RIGS as { key: string; title: string; rig: unknown; who: unknown }[];
const B10 = rigs.find((x) => x.key === 'b10')!;
const WHO = B10.who;
const byTitle = (s: string) => rigs.find((x) => x.title.includes(s))!.rig;
const live = (d: number, e: number) => {
  const q = (e * Math.PI) / 180;
  const front = { x: d * Math.cos(q), y: -d * Math.sin(q), z: 0 };
  const l = Math.hypot(front.x, front.y);
  return FSm.b10LiveRig(front, { x: -front.x / l, y: -front.y / l, z: 0 }) as unknown;
};
const left = (B: Plans) => B.arms.find((a) => a.hand.arm.side === 'L')!;
const right = (B: Plans) => B.arms.find((a) => a.hand.arm.side === 'R')!;
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

describe('the approved underhand hand from above, placed on the boom operator (BoomV2 poleTopUnder)', () => {
  it('the frozen art is untouched; BoomV2 imports it and paints it', () => {
    const art = src('src/screens/lab/miking/lessons/shared/figureV2/poleHandTopUnder.tsx');
    assert.equal(createHash('sha256').update(art).digest('hex'), FROZEN_TOP_UNDER, 'poleHandTopUnder.tsx is frozen (owner-approved 2026-11-25)');
    const b = src('src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx');
    assert.match(b, /from '\.\/poleHandTopUnder'/);
    assert.match(b, /hp\.painter === 'poleTopUnder' && hp\.poleTopUnder\s*\? poleHandTopUnderOutline\(\{ \.\.\.hp\.poleTopUnder, s: 1, sleeve: false \}\)/);
    assert.match(b, /<PoleHandTopUnder x=\{ptu\.x\} y=\{ptu\.y\} s=\{1\} rot=\{ptu\.rot\} mirror=\{ptu\.mirror\} sleeve=\{false\} poleLook="boom" ownScale=\{false\}/);
    // (the sleeve root's fade over the shoulders never takes skin off this hand: B10's left fist lies over her shoulders)
    assert.match(b, /const fadeOver = ap\.hand\.painter === 'poleTopUnder' \? Skia\.Path\.MakeFromOp\(torso\.body, sil, PathOp\.Difference\) \?\? torso\.body : torso\.body;/);
    assert.match(b, /<Group clip=\{fadeOver\}>\s*<Path path=\{root\.plane\} blendMode="dstOut">/);
    assert.equal(BV.TOP_UNDER_HANDS, true);
    assert.equal(BV.TOP_UNDER_TOL, 40);
  });

  it('B10 start, raised and every drag of the grid: the left hand takes it (≤ 1°, ≤ 3°, ≤ 20° off), mirrored', () => {
    const S = left(plans(B10.rig, WHO));
    assert.equal(S.hand.painter, 'poleTopUnder', S.hand.topFace?.underWhy ?? S.hand.topFace?.why);
    assert.equal(S.hand.poleTopUnder!.mirror, true);
    assert.ok(S.hand.topFace!.underOff! < 1, `start ${S.hand.topFace!.underOff!.toFixed(1)}° off`);
    const Rz = left(plans(byTitle('raised over the head'), WHO));
    assert.equal(Rz.hand.painter, 'poleTopUnder', Rz.hand.topFace?.underWhy);
    assert.ok(Rz.hand.topFace!.underOff! < 3, `raised ${Rz.hand.topFace!.underOff!.toFixed(1)}° off`);
    let n = 0;
    for (const d of [600, 700, 800, 900, 1000])
      for (const e of [20, 30, 40, 50, 60]) {
        const rig = live(d, e);
        if (!rig) continue;
        const L = left(plans(rig, WHO));
        if (!L.hand.arm.under) continue;
        n++;
        assert.equal(L.hand.painter, 'poleTopUnder', `${d} mm at ${e}°: ${L.hand.topFace?.underWhy}`);
        assert.ok(L.hand.topFace!.underOff! < 20, `${d} mm at ${e}°: ${L.hand.topFace!.underOff!.toFixed(1)}° off`);
      }
    assert.ok(n >= 20, `${n} dragged poses`);
  });

  it('dragged below the mouth (≈ 56° off): NOT this drawing — it keeps what it had', () => {
    const L = left(plans(byTitle('dragged below the mouth'), WHO));
    assert.ok(L.hand.arm.under, 'still the underhand hold');
    assert.notEqual(L.hand.painter, 'poleTopUnder');
    assert.ok(L.hand.topFace!.underOff! > 50 && L.hand.topFace!.underOff! < 62, `${L.hand.topFace!.underOff!.toFixed(1)}° off`);
    assert.ok(/off the underhand drawing/.test(L.hand.topFace!.underWhy ?? ''));
    // (what it had: the overhand top drawing where that fits, else the old hand — the same rule as before)
    assert.ok(L.hand.painter === 'poleTop' ? L.hand.topFace!.drawing === 'top' : L.hand.topFace!.drawing === 'old');
  });

  it('no other hand changes: B10’s right hand, every other rig’s hands, B10’s left with the rule off', () => {
    for (const r of rigs) {
      const B = plans(r.rig, r.who);
      for (const a of B.arms) {
        if (a.hand.arm.under) continue;
        assert.notEqual(a.hand.painter, 'poleTopUnder', `${r.key} ${a.hand.arm.side}`);
        assert.equal(a.hand.topFace?.underOff, undefined);
      }
      if (!r.key.startsWith('b10')) assert.ok(B.arms.every((a) => !a.hand.arm.under), `${r.key}: no underhand hand`);
    }
    assert.notEqual(right(plans(B10.rig, WHO)).hand.painter, 'poleTopUnder');
    assert.notEqual(left(plans(B10.rig, WHO, undefined, 'none')).hand.painter, 'poleTopUnder');
  });

  it('placed: the grip on the fist, the pole axis along the rig’s pole, the pole THROUGH the hand, the forearm one straight line into the cuff', () => {
    for (const rig of [B10.rig, byTitle('raised over the head'), live(600, 20), live(1000, 60)]) {
      const B = plans(rig, WHO);
      const L = left(B);
      const at = L.hand.poleTopUnder!;
      const F2 = B.vs.proj(L.hand.arm.fist);
      assert.ok(Math.hypot(at.x - F2.u, at.y - F2.v) < 1e-6, 'the grip on the lesson’s grip point');
      const step = { x: L.hand.arm.fist.x + B.poleDir.x, y: L.hand.arm.fist.y + B.poleDir.y, z: L.hand.arm.fist.z + B.poleDir.z };
      const P1 = B.vs.proj(step);
      const pd = { u: P1.u - F2.u, v: P1.v - F2.v };
      const ax = PT.poleHandTopUnderAxisOnPage({ rot: at.rot, mirror: true }) as Pt;
      assert.ok(Math.abs(cross2(unit2(pd), ax)) < 1e-6, 'the drawn pole along the rig’s pole');
      // (the pole through the closed hand: the drawing's skin over the rig's pole axis inside the fist, clear past it)
      const toPage = PT.poleHandTopUnderToPage({ ...at, s: 1 }) as (q: Pt) => Pt;
      const A = PT.POLE_HAND_TOP_UNDER as { fingers: Pt[][]; body: Pt[]; thumb: Pt[] };
      const skin = [...A.fingers, A.body, A.thumb].map((q) => q.map(toPage));
      const on = (k: number) => ({ u: F2.u + pd.u * k, v: F2.v + pd.v * k });
      for (const k of [-36, -20, 0, 20, 36]) assert.ok(skin.some((q) => inside(q, on(k))), `skin over the pole ${k} mm along`);
      for (const k of [-85, 85]) assert.ok(!skin.some((q) => inside(q, on(k))), `the pole clear of the hand ${k} mm along`);
      // (the forearm: one straight line elbow → wrist on the drawing's own forearm line through its cuff)
      const fe = PT.poleHandTopUnderForeOnPage({ rot: at.rot, mirror: true }) as Pt;
      const W = toPage(PT.POLE_HAND_TOP_UNDER_CUFF as Pt);
      const arm = L.arm;
      const ew = unit2({ u: arm.wrist.u - arm.elbow.u, v: arm.wrist.v - arm.elbow.v });
      assert.ok(Math.abs(cross2(ew, fe)) < 1e-3 && ew.u * fe.u + ew.v * fe.v < -0.999, 'the forearm along the drawing’s (elbow → wrist)');
      const off = (p: Pt) => Math.abs(cross2({ u: p.u - W.u, v: p.v - W.v }, fe));
      assert.ok(off(arm.elbow) < 0.5 && off(arm.wrist) < 0.5, 'the forearm’s line through the drawing’s cuff (no kink)');
      const c = arm.opening.e.c;
      assert.ok(off(c) < 0.5 && Math.hypot(c.u - W.u, c.v - W.v) < 12, `the sleeve’s mouth on the cuff rim (${Math.hypot(c.u - W.u, c.v - W.v).toFixed(1)} mm)`);
    }
  });

  it('the hold through a drag: between TOL − HOLD and TOL + HOLD a hand keeps what it carried; a moving rig remembers it', () => {
    const tol = BV.TOP_UNDER_TOL as number;
    const hold = BV.TOP_UNDER_HOLD as number;
    assert.equal(hold, 5);
    const path = dragPath(120);
    const grid: unknown[] = [];
    for (let d = 200; d <= 1000; d += 25)
      for (let e = -40; e <= 80; e += 2.5) {
        const r = live(d, e);
        if (r) grid.push(r);
      }
    const offs = [...path, ...grid].map((r) => ({ r, off: left(plans(r, WHO)).hand.topFace?.underOff ?? NaN }));
    // (read 2026-11-25: the rig's poses jump across the band's upper half — 33° → 45°+ — so only its lower half has real
    // poses: 35.4°, 38.4°, 39.5°; the upper half is tested where a pose falls in it)
    const mid = offs.find((x) => x.off > tol - hold + 0.3 && x.off < tol - 0.3);
    const mid2 = offs.find((x) => x.off > tol + 0.3 && x.off < tol + hold - 0.3);
    assert.ok(mid, `poses in the hold's band: ${offs.filter((x) => x.off > 25 && x.off < 50).map((x) => x.off.toFixed(1)).join(' ')}`);
    for (const m of mid2 ? [mid!, mid2] : [mid!]) {
      const ix = plans(m.r, WHO).arms.findIndex((a) => a.hand.arm.side === 'L');
      const keepU = ['old', 'old'];
      keepU[ix] = 'topUnder';
      const keepT = ['old', 'old'];
      keepT[ix] = 'top';
      assert.equal(left(plans(m.r, WHO, { top: keepU })).hand.painter, 'poleTopUnder', `${m.off.toFixed(1)}°: kept`);
      assert.notEqual(left(plans(m.r, WHO, { top: keepT })).hand.painter, 'poleTopUnder', `${m.off.toFixed(1)}°: not taken over`);
    }
    // (static: as the limit says — under TOL takes it, past TOL does not)
    assert.equal(left(plans(mid!.r, WHO)).hand.painter, 'poleTopUnder');
    if (mid2) assert.notEqual(left(plans(mid2.r, WHO)).hand.painter, 'poleTopUnder');
    // (a moving rig with only the side view's hold: the drawing carried on the last such rig is remembered)
    plans(B10.rig, WHO, { side: [] });
    assert.equal(left(plans(mid!.r, WHO, { side: [] })).hand.painter, 'poleTopUnder', 'carried from the start: kept');
    if (mid2) assert.equal(left(plans(mid2.r, WHO, { side: [] })).hand.painter, 'poleTopUnder', 'carried from the start: kept');
    plans(byTitle('dragged below the mouth'), WHO, { side: [] });
    assert.notEqual(left(plans(mid!.r, WHO, { side: [] })).hand.painter, 'poleTopUnder', 'carried from below the mouth: not taken over');
    // (a drag sweep start → below → start changes the drawing once each way, the way back at a smaller angle)
    let top: string[] | undefined;
    const sw = [...path, ...path.slice(0, -1).reverse()];
    const changes: { i: number; off: number; to: string }[] = [];
    sw.forEach((r, i) => {
      const B = plans(r, WHO, top ? { top } : undefined);
      const L = left(B);
      const now = L.hand.topFace?.drawing ?? 'old';
      const was = top?.[B.arms.indexOf(L)];
      if (was && was !== now && (was === 'topUnder' || now === 'topUnder')) changes.push({ i, off: L.hand.topFace!.underOff!, to: now });
      top = (BV.topDrawings as (b: Plans) => string[])(B);
    });
    assert.equal(changes.length, 2, JSON.stringify(changes));
    assert.ok(changes[0].to !== 'topUnder' && changes[0].off > tol && changes[1].to === 'topUnder' && changes[1].off < tol, JSON.stringify(changes));
  });

  it('source: JS only, hooks never after an early return in the new painter branch', () => {
    const b = src('src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx');
    const fn = b.slice(b.indexOf('function BoomHandArt('), b.indexOf('const ptu = ap.hand.poleTopUnder;'));
    // (BoomHandArt's hooks all come before its first return)
    const firstReturn = fn.indexOf('return ');
    assert.ok(firstReturn > 0 && !/\buse[A-Z]\w*\(/.test(fn.slice(firstReturn)), 'no hook after a return');
  });
});

/** The approved art's text (CRLF normalised), 2026-11-25. */
const FROZEN_TOP_UNDER = 'b64bf12d0470cb89e34730db5a5c99164ee566135a3fe89b6731cfc2334244a7';
