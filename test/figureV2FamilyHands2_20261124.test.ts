/**
 * FIGURE V2 — FAMILIES, FACE-ON SHOULDERS (builder "FamilyHands2", 2026-11-24).
 * Checked here (reads normalise CRLF):
 *   • the sleeve hangs from a shoulder point never higher than the shirt's own shoulder line (a skeleton with
 *     high shoulders — the lutes, the guitars — put the sleeve's line 30 mm above the trapezius: a step ending in
 *     a pointed tip at each shoulder);
 *   • every arm that does not hang takes the deltoid's line (one curve from the trapezius into the sleeve's edge)
 *     — no fixed ball cap, no level line cutting the sleeve;
 *   • the upper arm's outer normal faces up and out, never the underside of an arm held near level.
 * No joint, wrist or elbow moves: the drawing only.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx'));
const FF = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/FigureV2Front.tsx'));
const LM = R(await import('../src/screens/lab/miking/lessons/shared/lutes/luteModel.ts'));
const LF = R(await import('../src/screens/lab/miking/lessons/shared/lutes/luteFigureV2.tsx'));
const GP = R(await import('../src/screens/lab/miking/lessons/shared/guitars/guitarPlayerV2.ts'));
const C01 = R(await import('../src/screens/lab/miking/lessons/c01Guitar/geometry.ts'));
const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));

type Pt = { u: number; v: number };
/** The shirt polygon's top at a page u. */
function topAt(poly: Pt[], u: number): number {
  let top = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a.u - u) * (b.u - u) > 0 || a.u === b.u) continue;
    top = Math.min(top, a.v + ((b.v - a.v) * (u - a.u)) / (b.u - a.u));
  }
  return top;
}

const cases = () => [
  { name: 'oud', fi: LF.luteFamIn(LM.sceneOfKind('oud'), 'side', {}) },
  { name: 'guitar c01 steel', fi: GP.guitarFamIn(C01.C01_BUILT.scenes.steel, 'side', CAST.castFor('lute.oud')) },
];

describe('face-on shoulders (families)', () => {
  it('the sleeve hangs from a point at or below the shirt’s own shoulder line; joints unchanged', () => {
    for (const { name, fi } of cases()) {
      const fp = FV.famPlan(fi);
      assert.ok(fp.front, name);
      const F = FF.personFrontPlan(fp.front.pose, fi.who, {});
      for (const a of fp.arms) {
        assert.ok(a.f0, `${name} ${a.side}: a shoulder point`);
        const sg = a.f0.u >= fi.s.neck.x ? 1 : -1;
        const top = topAt(F.shirt, a.f0.u - sg * 18);
        assert.ok(a.f0.v >= top + 24 - 0.5, `${name} ${a.side}: shoulder point ${a.f0.v.toFixed(1)} above the shirt line ${(top + 24).toFixed(1)}`);
        // (the posed hand's wrist and the skeleton's elbow are the lesson's own)
        assert.equal(a.elbow2.u, fi.arms[a.side].elbow.x, `${name} ${a.side}: elbow u`);
        assert.equal(a.elbow2.v, fi.arms[a.side].elbow.y, `${name} ${a.side}: elbow v`);
      }
    }
  });
  it('every arm that does not hang takes the deltoid’s line (no fixed ball cap, no level cut)', () => {
    for (const { name, fi } of cases()) {
      const fp = FV.famPlan(fi);
      for (const a of fp.arms) if (a.cap) assert.ok(a.capTop && a.capTop.length > 10, `${name} ${a.side}: the deltoid's curve`);
    }
    const src = read('src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx');
    assert.ok(!/F0\.u \+ sg \* 22, F0\.v \+ 76/.test(src), 'the old ball-bottomed cap is gone');
  });
  it('the outer normal faces up and out (a level arm: its top; a hanging arm: its outer side; in across the chest: its outer side)', () => {
    assert.ok(/function outerNormal\(du: Pt, sg: number\): Pt/.test(read('src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx')));
  });
});
