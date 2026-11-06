/**
 * Miking, C03 Resonator, Meet step 4 (How it makes its sound), gap S3
 * (2026-11-05). The NECK key on this step changed only words: the two resonators
 * differ in the bridge's kind, and this step draws the face of the instrument,
 * so "round neck, upright" arrived while the neck in the picture stayed as it
 * was. The key is dropped here; the choice is made on step 3 and the words of
 * step 4 still follow it. The other plucked lessons keep their key: their
 * pictures do change.
 *
 * These run the real page function, with its real hooks, and read the steps it
 * hands to the rack.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import React, { type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { C01_ART } = R(await import('../src/screens/lab/miking/lessons/c01Guitar/art.tsx'));
const { C03_ART } = R(await import('../src/screens/lab/miking/lessons/c03Resonator/art.tsx'));
const { C05A_ART } = R(await import('../src/screens/lab/miking/lessons/c05aBanjo/art.tsx'));
const { C05B_ART } = R(await import('../src/screens/lab/miking/lessons/c05bMandolin/art.tsx'));
const { C05C_ART } = R(await import('../src/screens/lab/miking/lessons/c05cUkulele/art.tsx'));
const { C07_ART } = R(await import('../src/screens/lab/miking/lessons/c07AcousticBass/art.tsx'));

type Param = { id: string; label: string; selectedId?: string; options?: { id: string }[]; onSelect?: (id: string) => void };
type Step = { key: string; rack?: { params: Param[]; render: (w: number, h: number) => ReactElement<{ sc: { variant: string; g: { spec: { id: string } } } }> }; well?: ReactNode };
type Art = { pages: { sound: (p: unknown) => ReactElement<{ steps: Step[] }> } };

const source = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** The steps the real page hands to the rack, for one chosen variant. */
function stepsOf(id: string, art: Art, variant: string, setVariant: (v: string) => void = () => {}): Step[] {
  let page: ReactElement<{ steps: Step[] }> | null = null;
  const Probe = () => {
    page = art.pages.sound({ lesson: lessonById(id), answers: {}, onAnswered() {}, onInteractive() {}, interactiveDone: new Set(), variant, setVariant, hidden: false });
    return null;
  };
  renderToStaticMarkup(React.createElement(Probe));
  assert.ok(page, `${id}: the page ran`);
  return (page as ReactElement<{ steps: Step[] }>).props.steps;
}

/** Every `looking` caption in a step's well. */
function captions(n: ReactNode, out: string[] = []): string[] {
  if (Array.isArray(n)) n.forEach((c) => captions(c, out));
  else if (React.isValidElement(n)) {
    const p = n.props as { looking?: string; children?: ReactNode };
    if (typeof p.looking === 'string') out.push(p.looking);
    captions(p.children, out);
  }
  return out;
}

const strike = (steps: Step[]) => {
  const s = steps.find((x) => x.key === 'strike');
  assert.ok(s?.rack, 'the pluck step has a rack');
  return s;
};
const variantsOf = (id: string): string[] => lessonById(id).model.variants.map((v: { id: string }) => v.id);

describe('C03 Meet step 4: no key that changes only words', () => {
  it('has no NECK key on any step of the page, for either neck', () => {
    assert.deepEqual(variantsOf('C03'), ['lap', 'round']);
    for (const v of variantsOf('C03')) {
      const steps = stepsOf('C03', C03_ART, v);
      assert.deepEqual(strike(steps).rack!.params.map((p) => p.id), ['step', 'play'], `${v}: only STEP and PLAY are left on the pluck step`);
      for (const s of steps) assert.ok(!(s.rack?.params ?? []).some((p) => p.label === 'NECK' || p.id === 'body'), `${v}/${s.key}: no NECK key`);
    }
  });

  it('still follows the choice made on step 3: caption and instrument', () => {
    const want: Record<string, { looking: string; spec: string }> = {
      lap: { looking: 'Front view · square neck, lap style', spec: 'reso' },
      round: { looking: 'Front view · round neck, upright', spec: 'resoRound' },
    };
    for (const [v, w] of Object.entries(want)) {
      const s = strike(stepsOf('C03', C03_ART, v));
      assert.deepEqual(captions(s.well), [w.looking], `${v}: the caption`);
      assert.equal(s.rack!.render(375, 300).props.sc.g.spec.id, w.spec, `${v}: the instrument drawn`);
    }
  });

  it('keeps the chooser on step 3, where the neck can be seen', () => {
    const page = source('pages/PInstrument.tsx');
    assert.match(page, /label: C\.variantKey,\n\s+valueLabel: variantLabel,/);
    assert.match(page, /onSelect: \(id[^)]*\) => setVariant\(id/);
  });
});

describe('the other plucked lessons keep their key', () => {
  const others: [string, Art, string][] = [
    ['C01', C01_ART, 'BODY'],
    ['C05A', C05A_ART, 'BACK'],
    ['C05B', C05B_ART, 'STYLE'],
  ];
  for (const [id, art, label] of others) {
    it(`${id} still offers ${label} on the pluck step, and it still works`, () => {
      const vs = variantsOf(id);
      assert.ok(vs.length > 1, `${id} has more than one variant`);
      const picked: string[] = [];
      const params = strike(stepsOf(id, art, vs[0], (v) => picked.push(v))).rack!.params;
      assert.deepEqual(params.map((p) => p.id), ['step', 'play', 'body']);
      const key = params[2];
      assert.equal(key.label, label);
      assert.equal(key.selectedId, vs[0]);
      assert.deepEqual(key.options?.map((o) => o.id), vs);
      key.onSelect?.(vs[1]);
      assert.deepEqual(picked, [vs[1]]);
    });
  }

  for (const [id, art] of [['C05C', C05C_ART], ['C07', C07_ART]] as [string, Art][]) {
    it(`${id} has one variant, so its page has no key and never had`, () => {
      assert.equal(variantsOf(id).length, 1);
      assert.deepEqual(strike(stepsOf(id, art, variantsOf(id)[0])).rack!.params.map((p) => p.id), ['step', 'play']);
    });
  }

  it('C01 passes no option at its call', () => {
    assert.match(source('lessons/c01Guitar/art.tsx'), /sound: makeStringSoundPage\(C01_BUILT\),/);
  });

  it('only C03 turns the key off', () => {
    assert.match(source('lessons/c03Resonator/art.tsx'), /sound: makeStringSoundPage\(C03_BUILT, \{ variantKey: false \}\),/);
    for (const f of ['c01Guitar', 'c05aBanjo', 'c05bMandolin', 'c05cUkulele', 'c07AcousticBass']) {
      assert.doesNotMatch(source(`lessons/${f}/art.tsx`), /variantKey/, f);
    }
  });
});
