/**
 * MEET IT: the part's name, never a tally; and the pick follows the drawing
 * (owner decisions 14, 15 and 16, 2026-11-05; the no-totals rule, D117).
 *
 *  14. After a site or variant switch the old part stayed on screen: F06 CITY
 *      PLAZA still said STREAM until a new tap. One shared helper (livePartId)
 *      maps a pick to the same part in the new variant, or to nothing.
 *  15. "2 of 5 looked at" and "2 / 5" are gone from Meet It. Credit is not.
 *  16. Clothing's strike drawing takes no variant, so GARMENT leaves that step
 *      and stays on The Parts.
 * The real pages run on a small hook stand-in and each test presses the dock.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { PInstrument, livePartId } = R(await import('../src/screens/lab/miking/pages/PInstrument.tsx'));
const { PKitOrient } = R(await import('../src/screens/lab/miking/lessons/shared/kitPages/PKitOrient.tsx'));
const { HInstrument } = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/pages/HInstrument.tsx'));
const { SSound } = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/pages/SSound.tsx'));
const { SInstrument } = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/pages/SInstrument.tsx'));
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { copyOf } = R(await import('../src/screens/lab/miking/engine/model/copy.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const read = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Param = { id: string; onChange?: (v: number) => void; onSelect?: (id: string) => void; format?: () => string; valueA11y?: string };
type Bezel = { k: string; v: string };
type Rack = { render: (w: number, h: number) => { props: Record<string, unknown> }; bezel: Bezel[]; params: Param[] };
type Step = { key: string; rack: Rack; well: unknown };
type Part = { id: string; label: string; short: string; variants?: string[]; listIn?: string[] };
type Page = (p: unknown) => { props: { steps: Step[] } };

function hookHost() {
  const slots: unknown[] = [];
  let at = 0;
  const dispatcher = {
    useState: (init: unknown) => {
      const i = at++;
      if (!(i in slots)) slots[i] = typeof init === 'function' ? (init as () => unknown)() : init;
      return [slots[i], (v: unknown) => { slots[i] = typeof v === 'function' ? (v as (o: unknown) => unknown)(slots[i]) : v; }];
    },
    useMemo: (f: () => unknown) => f(),
    useCallback: <T,>(f: T) => f,
    useRef: (v: unknown) => ({ current: v }),
    useContext: (c: { _currentValue?: unknown }) => c._currentValue,
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
    useInsertionEffect: () => undefined,
    useSyncExternalStore: (_s: unknown, get: () => unknown) => get(),
    useDebugValue: () => undefined,
  };
  return <T,>(body: () => T): T => {
    at = 0;
    const was = internals.H;
    internals.H = dispatcher;
    try {
      return body();
    } finally {
      internals.H = was;
    }
  };
}

/** Someone on THE PARTS of a real page. */
function reader(page: unknown, id: string, chooser: string, start?: string, extra: Record<string, unknown> = {}) {
  const lesson = lessonById(id);
  const host = hookHost();
  let variant: string = start ?? lesson.model.variants[0].id;
  const props = () => ({ lesson, art: {}, answers: {}, onAnswered() {}, onInteractive() {}, interactiveDone: new Set<string>(), variant, setVariant: (v: string) => { variant = v; }, hidden: false, journey: { met: {}, path: null }, ...extra });
  const step = () => host(() => (page as Page)(props())).props.steps.find((s) => s.key === 'parts')!;
  const dock = () => step().rack.params.find((p) => p.id === 'part')!;
  const text = () => {
    const out: string[] = [];
    const walk = (n: unknown) => {
      if (typeof n === 'string') out.push(n);
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== 'object') return;
      const p = (n as { props?: Record<string, unknown> }).props;
      if (typeof p?.title === 'string') out.push(p.title);
      walk(p?.children);
    };
    walk(step().well);
    return out.join(' | ');
  };
  return {
    pressPart(at: number, of: number) {
      const d = dock();
      if (d.onSelect) d.onSelect(String(at));
      else d.onChange!(of > 1 ? at / (of - 1) : 0);
    },
    switchTo: (v: string) => step().rack.params.find((p) => p.id === chooser)!.onSelect!(v),
    bezel: () => step().rack.bezel,
    cell: (k: string) => step().rack.bezel.find((b) => b.k === k)?.v,
    highlight: () => step().rack.render(375, 300).props.highlight as string | null,
    label: () => (step().rack.render(375, 300).props.labelFor as (v: string) => string)('side'),
    line: () => dock().valueA11y ?? dock().format!(),
    text,
  };
}

const COUNT = /\d+\s*(of|\/)\s*\d+/;
const parts = (id: string, v: string): Part[] => lessonById(id).model.parts.filter((p: Part) => (!p.variants || p.variants.includes(v)) && (!p.listIn || p.listIn.includes(v)));
const partsPage = (id: string) => (lessonArt(id)?.pages?.instrument as { name?: string } | undefined)?.name;
const handLessons = (LESSONS as { id: string }[]).map((l) => l.id).filter((id) => partsPage(id) === 'HInstrument' && lessonById(id).model.variants.length > 1);

describe('decision 14: the pick follows the drawing', () => {
  it('F06: STREAM does not stay on screen at the city plaza', () => {
    const s = reader(PInstrument, 'F06', 'head', 'woodland');
    const list = parts('F06', 'woodland');
    s.pressPart(list.findIndex((p) => p.id === 'stream'), list.length);
    assert.equal(s.highlight(), 'stream');
    assert.ok(s.text().includes('THE STREAM'));
    s.switchTo('plaza');
    assert.equal(s.cell('PART'), 'TAP ONE');
    assert.equal(s.highlight(), null);
    assert.ok(!s.text().includes('THE STREAM'), 'the card is gone');
    assert.ok(!s.label().includes('Highlighted'), 'the screen reader line is gone');
  });

  it('M01: the front head crosses to its other id, card and sound line included', () => {
    const s = reader(PInstrument, 'M01', 'head', 'intact');
    const list = parts('M01', 'intact');
    s.pressPart(list.findIndex((p) => p.id === 'kick.reso'), list.length);
    assert.ok(s.text().includes('WHERE SOUND COMES FROM'));
    s.switchTo('ported');
    assert.equal(s.highlight(), 'kick.resoPorted');
    assert.equal(s.cell('PART'), 'FRONT HEAD');
    assert.ok(s.text().includes('WHERE SOUND COMES FROM'), 'the sound line follows the head');
  });

  it('livePartId: the kick tap target means the head of this variant, a part with no twin means nothing', () => {
    const { parts: all, variants } = lessonById('M01').model;
    const ids = variants.map((v: { id: string }) => v.id);
    assert.equal(livePartId('kick.reso', 'ported', all, ids), 'kick.resoPorted');
    assert.equal(livePartId('kick.resoPorted', 'intact', all, ids), 'kick.reso');
    assert.equal(livePartId(null, 'intact', all, ids), null);
    assert.equal(livePartId('nothing.here', 'intact', all, ids), null);
  });

  for (const id of ['M09', 'M10', 'M11']) {
    it(`${id}: the kit page never lights or names a part off this variant's list`, () => {
      const { variants } = lessonById(id).model as { variants: { id: string }[] };
      for (const a of variants) {
        for (const b of variants) {
          const list = parts(id, a.id);
          for (let i = 0; i < list.length; i++) {
            const s = reader(PKitOrient, id, 'where', a.id, { words: { start: '', newPath: '', partsPrompt: '' } });
            s.pressPart(i, list.length);
            s.switchTo(b.id);
            const hl = s.highlight();
            const on = parts(id, b.id).find((p) => p.id === hl);
            assert.ok(hl === null || on, `${list[i].id} into ${b.id}`);
            assert.equal(s.cell('PART'), on ? on.short.toUpperCase() : 'TAP ONE');
          }
        }
      }
    });
  }

  it('hand drums: the pick never outlives its setup', () => {
    assert.ok(handLessons.length > 0);
    for (const id of handLessons) {
      const { variants } = lessonById(id).model as { variants: { id: string }[] };
      for (const a of variants) {
        const seenIds = new Set(parts(id, a.id).map((p) => p.short));
        for (const b of variants) {
          const s = reader(HInstrument, id, 'setup', a.id);
          s.pressPart(0, seenIds.size);
          s.switchTo(b.id);
          const hl = s.highlight();
          assert.ok(hl === null || parts(id, b.id).some((p) => p.id === hl), `${id} into ${b.id}`);
        }
      }
    }
  });

  it('keys: a part this view does not draw lets go of the card', () => {
    const src = read('lessons/shared/keys/keysPages.tsx');
    assert.match(src, /const shown = parts\.find\(\(p\) => p\.id === partId\);/);
    assert.equal(src.match(/highlight=\{shown\?\.id \?\? null\}/g)?.length, 2);
  });
});

describe('decision 15: the part name only', () => {
  it('F06, M01, I05d: the dock line and the bezel name the part with no tally, before and after a tap', () => {
    for (const [page, id, start] of [[PInstrument, 'F06', 'woodland'], [PInstrument, 'M01', 'intact'], [SInstrument, 'I05d', 'gourd']] as const) {
      const s = reader(page, id, 'head', start);
      assert.equal(s.line(), 'step through the parts', id);
      s.pressPart(1, parts(id, start).length);
      assert.equal(s.line(), parts(id, start)[1].short.toUpperCase(), id);
      assert.equal(s.cell('LOOKED AT'), undefined, id);
      assert.ok(s.bezel().length === 2 && s.bezel().every((b) => !COUNT.test(b.v)), id);
    }
  });

  it('hand drums: the same', () => {
    const id = handLessons[0];
    const start = lessonById(id).model.variants[0].id;
    const s = reader(HInstrument, id, 'setup', start);
    assert.equal(s.line(), 'step through the parts');
    s.pressPart(1, 3);
    assert.ok(!COUNT.test(s.line()));
    assert.equal(s.cell('LOOKED AT'), undefined);
  });

  it('every named Meet It site lost its tally, and no page keeps state it no longer shows', () => {
    for (const f of ['pages/PInstrument.tsx', 'lessons/shared/kitPages/PKitOrient.tsx', 'lessons/shared/handdrums/pages/HInstrument.tsx', 'lessons/shared/smallperc/pages/SInstrument.tsx', 'lessons/b12Parabolic/pages.tsx']) {
      const src = read(f);
      assert.doesNotMatch(src, /LOOKED AT|looked at|lookedAt|setSeen/i, f);
    }
    const tally = /LOOKED AT|`Looked at: \$\{|Sports looked at|Methods looked at/;
    assert.doesNotMatch(read('lessons/f10SpatialField/pages.tsx'), tally);
    assert.doesNotMatch(read('lessons/shared/keys/keysPages.tsx'), /LOOKED AT|looked at/);
    assert.doesNotMatch(read('lessons/shared/sports/sportsPages.tsx'), tally);
    assert.doesNotMatch(read('lessons/shared/sports/sportsTools.tsx'), /LOOKED AT/);
    assert.doesNotMatch(read('mikingScreenGuides.ts'), /LOOKED AT/);
  });

  it('credit did not move: the setups and comparison gates still read what was looked at', () => {
    for (const f of ['lessons/f10SpatialField/pages.tsx', 'lessons/shared/sports/sportsPages.tsx']) {
      assert.match(read(f), /if \(core\.length && seenCore >= core\.length && !interactiveDone\.has\('setupsSeen'\)\) onInteractive\('setupsSeen'\);/, f);
    }
    assert.match(read('lessons/shared/sports/sportsTools.tsx'), /if \(seen\.size === PLANT_IDS\.length && !done\) onInteractive\('plantCompared'\);/);
  });
});

describe('decision 16: GARMENT is not offered over a frozen drawing', () => {
  const strike = (id: string) => {
    const lesson = lessonById(id);
    const v = lesson.model.variants[0].id;
    const el = hookHost()(() => (SSound as Page)({ lesson, art: {}, answers: {}, onAnswered() {}, onInteractive() {}, interactiveDone: new Set<string>(), variant: v, setVariant() {}, hidden: false }));
    return el.props.steps.find((s) => s.key === 'strike')!;
  };
  it('F02: no chooser on the strike step, and its words do not ask for one', () => {
    const s = strike('F02');
    assert.equal(s.rack.params.find((p) => p.id === 'state'), undefined);
    const lesson = lessonById('F02');
    assert.doesNotMatch(JSON.stringify(lesson.sound.stages), /GARMENT/);
    assert.doesNotMatch(JSON.stringify(copyOf(lesson).sound), /GARMENT/, 'the strike step never sends the reader to a key it does not show');
  });
  it('F02: GARMENT stays on The Parts', () => {
    const s = reader(SInstrument, 'F02', 'head', 'held');
    s.switchTo('worn');
    assert.ok(s.text().length > 0);
  });
});

describe('section 5 note: the polarity key fits at 375', () => {
  it('sports: a value key with a full spoken name, as on the shared two-mic page', () => {
    const src = read('lessons/shared/sports/sportsPages.tsx');
    assert.ok(!src.includes(`label: 'MIC B POLARITY'`));
    assert.match(src, /id: 'pol',\n\s+label: 'POLARITY',\n\s+valueLabel: `MIC B \$\{pol === 1 \? '\+' : '−'\}`,\n\s+valueA11y: pol === 1 \? 'MIC B POLARITY \+' : 'MIC B POLARITY −',/);
  });
});
