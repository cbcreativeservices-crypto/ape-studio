/**
 * Miking Labs — a scene with no mic on it fits the instrument's CONTENT FRAME
 * (engine/geometry/contentFrame.ts), not the generous authored view box
 * (owner, Pixel 2026-10-06: "many their object size could be proportioned
 * better — too small, there is more room to easily occupy larger").
 *
 * The frame is built from the model (the parts' solids, the player's body
 * keep-outs), so it must still hold everything the ART draws: for every
 * lesson, variant and view, the drawing's hit-testable extent (the art's hit
 * test sampled over the authored box) lies inside the frame, or the view is
 * marked `fitAuthored` in its model and keeps its authored box.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
const { sceneFrame, contentFrame, shapeBox, bodyEnvelope } = R(await import('../src/screens/lab/miking/engine/geometry/contentFrame.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));

type Box = { u0: number; u1: number; v0: number; v1: number };
const N = 48;

function drawnExtent(A: { hitTest: (view: string, variant: string, u: number, v: number, tol: number) => string | null }, view: string, variant: string, a: Box): Box | null {
  let e: Box | null = null;
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++) {
      const u = a.u0 + ((a.u1 - a.u0) * i) / N;
      const v = a.v0 + ((a.v1 - a.v0) * j) / N;
      if (!A.hitTest(view, variant, u, v, 0)) continue;
      e = e ? { u0: Math.min(e.u0, u), u1: Math.max(e.u1, u), v0: Math.min(e.v0, v), v1: Math.max(e.v1, v) } : { u0: u, u1: u, v0: v, v1: v };
    }
  return e;
}

const rows: string[] = [];
const outside: string[] = [];
let gainSum = 0;
let gainN = 0;
for (const { id } of LESSONS as { id: string }[]) {
  const L = lessonById(id);
  const A = lessonArt(id);
  if (!L || !A) continue;
  for (const { id: variant } of L.model.variants as { id: string }[]) {
    const views = viewsOf(L.model, variant);
    for (const view of Object.keys(views) as ('side' | 'top')[]) {
      const a = views[view]!;
      const f = sceneFrame(L.model, variant, view, false)!;
      // The frame never grows past the authored box.
      if (f.u0 < a.u0 - 0.01 || f.u1 > a.u1 + 0.01 || f.v0 < a.v0 - 0.01 || f.v1 > a.v1 + 0.01) outside.push(`${id} ${variant} ${view}: frame past the authored box`);
      if (L.model.fitAuthored?.[view]) continue;
      const d = drawnExtent(A, view, variant, a);
      const tol = 0.03 * Math.max(f.u1 - f.u0, f.v1 - f.v0);
      if (d && (d.u0 < f.u0 - tol || d.u1 > f.u1 + tol || d.v0 < f.v0 - tol || d.v1 > f.v1 + tol)) {
        outside.push(`${id} ${variant} ${view}: drawn ${JSON.stringify(d)} outside frame ${JSON.stringify(f)}`);
      }
      if (variant === L.model.defaultVariant) {
        const g = fitXform(view, f, 390, 248, 8).s / fitXform(view, a, 390, 248, 8).s;
        gainSum += g;
        gainN++;
        rows.push(`${id} ${view} ×${g.toFixed(2)}`);
      }
    }
  }
}

describe('the content frame holds the drawing', () => {
  it('every drawn part of every lesson lies inside its scene frame (or the view keeps its authored box)', () => {
    assert.deepEqual(outside, []);
  });
  it('the frame makes the instrument larger on average (it only crops empty space)', () => {
    assert.ok(gainSum / gainN > 1.15, `mean gain ×${(gainSum / gainN).toFixed(2)}: ${rows.join(', ')}`);
  });
});

describe('contentFrame()', () => {
  it('a mic scene keeps the authored box; a scene with no mic crops to its content', () => {
    const L = lessonById('M08');
    const v = L.model.defaultVariant;
    const a = viewsOf(L.model, v).side;
    assert.deepEqual(sceneFrame(L.model, v, 'side', true), a);
    const f = sceneFrame(L.model, v, 'side', false);
    assert.ok((f.u1 - f.u0) * (f.v1 - f.v0) < (a.u1 - a.u0) * (a.v1 - a.v0));
    assert.ok(contentFrame(L.model, L.zones, v, 'side', 'mics'));
  });
  it('a box shape projects to its own extent', () => {
    assert.deepEqual(shapeBox({ kind: 'box', min: { x: 1, y: 2, z: 3 }, max: { x: 4, y: 5, z: 6 } }), { min: { x: 1, y: 2, z: 3 }, max: { x: 4, y: 5, z: 6 } });
    assert.equal(shapeBox({ kind: 'floor', y: 0 }), null);
  });
  it("the player's body holds room; a stick's travel does not", () => {
    assert.equal(bodyEnvelope({ id: 'env.drummer', label: 'the drummer' }), true);
    assert.equal(bodyEnvelope({ id: 'a.torso', label: 'the player' }), true);
    assert.equal(bodyEnvelope({ id: 'env.beater', label: 'beater travel' }), false);
    assert.equal(bodyEnvelope({ id: 'env.mallets.oct5', label: 'the mallets’ travel' }), false);
  });
});
