/**
 * MEET IT once printed an impossible count (F06 and F07 read "8 of 6 looked
 * at"). The count is gone (owner decision 15, the no-totals rule). What it
 * guarded stays: a pick only ever means a part of the variant on screen, and
 * the kick's front head is one tap target with one part id per variant.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { livePartId } = R(await import('../src/screens/lab/miking/pages/PInstrument.tsx'));
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));

type Part = { id: string; variants?: string[]; listIn?: string[] };
type Model = { parts: Part[]; variants: { id: string }[] };
const modelOf = (id: string): Model => lessonById(id)!.model;
const on = (m: Model, v: string) => m.parts.filter((p) => !p.variants || p.variants.includes(v));
const read = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('a pick means a part of the variant on screen', () => {
  it('F06: a part of another site means nothing here', () => {
    const m = modelOf('F06');
    const ids = m.variants.map((v) => v.id);
    const [a, b] = ids.map((v) => on(m, v));
    const onlyA = a.filter((p) => !b.some((q) => q.id === p.id));
    assert.ok(onlyA.length > 0);
    for (const p of onlyA) assert.equal(livePartId(p.id, ids[1], m.parts, ids), null, p.id);
  });

  it('the kick front head is one part, whichever id the tap or the fader used', () => {
    const m = modelOf('M01');
    const ids = m.variants.map((v) => v.id);
    assert.equal(livePartId('kick.reso', 'intact', m.parts, ids), 'kick.reso');
    assert.equal(livePartId('kick.reso', 'ported', m.parts, ids), 'kick.resoPorted');
    assert.equal(livePartId('kick.resoPorted', 'ported', m.parts, ids), 'kick.resoPorted');
    assert.equal(livePartId('kick.resoPorted', 'intact', m.parts, ids), 'kick.reso');
  });

  it('no lesson can land off its own variant, from any part of any variant', () => {
    for (const { id } of LESSONS as { id: string }[]) {
      const L = lessonById(id);
      if (!L) continue;
      const m: Model = L.model;
      const ids = m.variants.map((v) => v.id);
      for (const v of ids) {
        const here = new Set(on(m, v).map((p) => p.id));
        for (const p of m.parts) {
          const live = livePartId(p.id, v, m.parts, ids);
          assert.ok(live === null || here.has(live), `${id} ${p.id} into ${v}`);
        }
      }
    }
  });

  for (const f of ['pages/PInstrument.tsx', 'lessons/shared/kitPages/PKitOrient.tsx', 'lessons/shared/handdrums/pages/HInstrument.tsx', 'lessons/shared/smallperc/pages/SInstrument.tsx']) {
    it(`${f}: reads the live pick and prints no count`, () => {
      const src = read(f);
      assert.match(src, /livePartId\(/);
      assert.ok(!src.includes('looked at'), 'dock line');
      assert.ok(!src.includes('LOOKED AT'), 'bezel');
      assert.ok(!src.includes('seen.size'), 'nothing prints a set size');
    });
  }

  it('sports Meet It steps print no tally: the tour names its LAYER, the range step its TARGET', () => {
    const src = read('lessons/shared/sports/sportsPages.tsx');
    assert.ok(!src.includes('looked at'), 'no tally in the well');
    assert.ok(!src.includes('LOOKED AT'), 'no tally on the bezel');
    assert.ok(!src.includes('of ${LAYERS.length}'), 'LAYER names the layer');
    assert.ok(!src.includes('of ${ts.length}'), 'TARGET names the target');
  });
});
