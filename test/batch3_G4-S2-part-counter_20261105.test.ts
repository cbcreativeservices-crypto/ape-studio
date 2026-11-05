/**
 * The PART counter on MEET IT never prints an impossible count (F06 and F07
 * read "8 of 6 looked at"): it counts the parts on the list in front of the
 * student, whatever was tapped in another variant, and the kick's front head
 * is one tap target with one part id per variant.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lookedAtCount } = R(await import('../src/screens/lab/miking/pages/PInstrument.tsx'));
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));

type Part = { id: string; variants?: string[]; listIn?: string[] };
type Model = { parts: Part[]; variants: { id: string }[] };
const modelOf = (id: string): Model => lessonById(id)!.model;
const listed = (m: Model, v: string) => m.parts.filter((p) => (!p.variants || p.variants.includes(v)) && (!p.listIn || p.listIn.includes(v)));
const read = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('the PART counter counts the list on screen', () => {
  for (const id of ['F06', 'F07']) {
    it(`${id}: looking at every part of every site never prints more than the list`, () => {
      const m = modelOf(id);
      assert.ok(m.variants.length > 1, `${id} has more than one site`);
      const seen = new Set<string>();
      for (const v of [...m.variants, ...m.variants]) {
        const parts = listed(m, v.id);
        for (const p of parts) {
          seen.add(p.id);
          assert.ok(lookedAtCount(parts, seen) <= parts.length, `${id} ${v.id}`);
        }
        assert.equal(lookedAtCount(parts, seen), parts.length, `${id} ${v.id}: all looked at`);
      }
      assert.ok(seen.size > Math.max(...m.variants.map((v) => listed(m, v.id).length)), `${id}: the sites differ, so seen.size alone would overrun`);
    });
  }

  it('another site counts for nothing here', () => {
    const m = modelOf('F06');
    const [a, b] = m.variants.map((v) => listed(m, v.id));
    const onlyA = a.filter((p) => !b.some((q) => q.id === p.id));
    assert.ok(onlyA.length > 0);
    assert.equal(lookedAtCount(b, new Set(onlyA.map((p) => p.id))), 0);
  });

  it('a tapped part that is drawn but not listed does not count', () => {
    assert.equal(lookedAtCount([{ id: 'a' }, { id: 'b' }], new Set(['a', 'wall', 'neck'])), 1);
  });

  it('the kick front head counts once, whichever id the tap or the fader used', () => {
    const m = modelOf('M01');
    for (const list of [listed(m, 'intact'), listed(m, 'ported')]) {
      assert.equal(lookedAtCount(list, new Set(['kick.reso'])), 1);
      assert.equal(lookedAtCount(list, new Set(['kick.resoPorted'])), 1);
      assert.equal(lookedAtCount(list, new Set(['kick.reso', 'kick.resoPorted'])), 1);
    }
  });

  it('no lesson can exceed its list on any variant', () => {
    for (const { id } of LESSONS as { id: string }[]) {
      const L = lessonById(id);
      if (!L) continue;
      const all = new Set<string>(L.model.parts.map((p: Part) => p.id));
      for (const v of L.model.variants as { id: string }[]) {
        const parts = listed(L.model, v.id);
        assert.equal(lookedAtCount(parts, all), parts.length, `${id} ${v.id}`);
      }
    }
  });

  for (const f of ['pages/PInstrument.tsx', 'lessons/shared/kitPages/PKitOrient.tsx', 'lessons/shared/handdrums/pages/HInstrument.tsx']) {
    it(`${f}: the dock line and the bezel both print the list's count`, () => {
      const src = read(f);
      assert.match(src, /const lookedAt = lookedAtCount\(parts, seen\);/);
      assert.ok(src.includes('${lookedAt} of ${parts.length} looked at'), 'dock line');
      assert.ok(src.includes('v: `${lookedAt} / ${parts.length}`'), 'bezel');
      assert.ok(!src.includes('seen.size'), 'nothing prints the raw set size');
    });
  }
});
