/**
 * The mallet keyboards' RESONATORS are the tubes, never the bars (owner,
 * Pixel 2026-10-06: "marimba resonator are the tubes not the wooden struck
 * note"). On the parts page the RESONATORS highlight used to ring the point
 * where a tube's mouth meets its bar (the region's anchor) — on the bar row —
 * and from above, where the bars hide the tubes, it ringed a bar outright.
 *
 * Now, for the marimba, vibraphone, xylophone and glockenspiel:
 *   • the resonators part is marked hidden from above (no marker there), and
 *     so is every tube group;
 *   • the side view highlights the tube groups' own solids, which all lie
 *     below the bar row;
 *   • the side label names a tube body (its leader point is on a tube, well
 *     below the bars) and there is no resonator label from above;
 *   • a tap on a bar is never answered "resonators".
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));

type Box = { kind: 'box'; min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
type P = { id: string; solid?: Box; variants?: string[]; hiddenIn?: string[] };

for (const id of ['I07', 'I08', 'I09', 'I10']) {
  const L = lessonById(id);
  const A = lessonArt(id);
  describe(`${id}: the resonators are the tubes`, () => {
    for (const { id: variant } of L.model.variants as { id: string }[]) {
      const parts = (L.model.parts as P[]).filter((p) => !p.variants || p.variants.includes(variant));
      const res = parts.find((p) => /\.res\.[^.]+$/.test(p.id));
      if (!res) continue; // a variant without tubes (a case-mounted glockenspiel)
      const tubes = parts.filter((p) => p.id.startsWith(`${res.id}.`) && p.solid);
      const nat = parts.find((p) => /\.nat\./.test(p.id))!;
      const barBottom = nat.solid!.max.y;
      it(`${variant}: hidden from above, highlighted by its tubes, all below the bars`, () => {
        assert.deepEqual(res.hiddenIn, ['top']);
        assert.ok(tubes.length > 0);
        for (const t of tubes) {
          assert.deepEqual(t.hiddenIn, ['top'], t.id);
          assert.ok(t.solid!.min.y >= barBottom - 1, `${t.id}: tube top ${t.solid!.min.y} above the bar bottom ${barBottom}`);
        }
      });
      it(`${variant}: the side label points at a tube body; no resonator label from above`, () => {
        const side = (A.labels('side', variant) as { id: string; at?: { u: number; v: number } }[]).find((l) => l.id === 'res');
        assert.ok(side?.at, 'the side label has a leader point');
        assert.ok(side!.at!.v > barBottom + 60, 'the leader point is well below the bars');
        assert.equal(A.hitTest('side', variant, side!.at!.u, side!.at!.v, 0), res.id, 'the leader point is on a tube');
        assert.equal((A.labels('top', variant) as { id: string }[]).some((l) => l.id === 'res' || /RESONATOR|TUBE/.test((l as { text?: string }).text ?? '')), false);
      });
      it(`${variant}: a tap on a bar is never "resonators"`, () => {
        const b = nat.solid!;
        for (let i = 1; i < 10; i++) {
          const u = b.min.x + ((b.max.x - b.min.x) * i) / 10;
          assert.notEqual(A.hitTest('side', variant, u, (b.min.y + b.max.y) / 2, 0), res.id);
          assert.notEqual(A.hitTest('top', variant, u, (b.min.z + b.max.z) / 2, 0), res.id);
        }
      });
    }
  });
}
