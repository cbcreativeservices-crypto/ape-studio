/**
 * MEET IT on the metal family: the part's name, never a tally
 * (function audit section 5 and owner decision 15 A, 2026-11-05; D117).
 *
 * The metal page used the counter that made Woodblock read "7 of 5": it counted
 * every pick in every variant against the list of one variant. The tally is
 * gone, and the pick follows the drawing as it does on the small percussion
 * page. The real pages run on a small hook stand-in and each test presses the dock.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const source = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/metal/metalPages.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const meetFn = source.slice(source.indexOf('export function MetalInstrument'), source.indexOf('2 · HOW IT SOUNDS'));

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

const listed = (id: string, v: string): Part[] => lessonById(id).model.parts.filter((p: Part) => (!p.variants || p.variants.includes(v)) && (!p.listIn || p.listIn.includes(v)));

/** Someone on THE PARTS of a real metal page. */
function reader(id: string, start?: string) {
  const lesson = lessonById(id);
  const host = hookHost();
  const page = lessonArt(id)!.pages!.instrument as unknown as Page;
  let variant: string = start ?? lesson.model.variants[0].id;
  const props = () => ({ lesson, art: {}, answers: {}, onAnswered() {}, onInteractive() {}, interactiveDone: new Set<string>(), variant, setVariant: (v: string) => { variant = v; }, hidden: false, journey: { met: {}, path: null } });
  const step = () => host(() => page(props())).props.steps.find((s) => s.key === 'parts')!;
  const dock = () => step().rack.params.find((p) => p.id === 'part')!;
  const stage = () => step().rack.render(375, 300).props;
  return {
    press(at: number) {
      const d = dock();
      const n = listed(id, variant).length;
      if (d.onSelect) d.onSelect(String(at));
      else d.onChange!(n > 1 ? at / (n - 1) : 0);
    },
    switchTo: (v: string) => step().rack.params.find((p) => p.id === 'variant')!.onSelect!(v),
    bezel: () => step().rack.bezel,
    cell: (k: string) => step().rack.bezel.find((b) => b.k === k)?.v,
    highlight: () => stage().highlight as string | null,
    label: () => stage().label as string,
    line: () => dock().valueA11y ?? dock().format!(),
    words: () => JSON.stringify(step().well, (k, v) => (k === '_owner' || k === '_store' || typeof v === 'function' ? undefined : v)),
  };
}

const TALLY = /\d+\s*(of|\/)\s*\d+/;
const METAL = ['I06a', 'I06b', 'I06c', 'I12', 'A10', 'A11', 'A12'];

describe('Meet It on the metal pages: the part name only', () => {
  it('every metal lesson really is on this page', () => {
    for (const id of METAL) assert.equal((lessonArt(id)?.pages?.instrument as { name?: string } | undefined)?.name, 'MInstrument', id);
  });

  for (const id of METAL) {
    it(`${id}: the dock line and the bezel name the part, with no tally, in every variant`, () => {
      for (const v of lessonById(id).model.variants.map((x: { id: string }) => x.id)) {
        const s = reader(id, v);
        assert.equal(s.line(), 'step through the parts', `${id} ${v}`);
        assert.equal(s.cell('PART'), 'TAP ONE', `${id} ${v}`);
        const list = listed(id, v);
        for (let i = 0; i < list.length; i++) {
          s.press(i);
          assert.equal(s.line(), list[i].short.toUpperCase(), `${id} ${v} ${list[i].id}`);
          assert.equal(s.cell('PART'), list[i].short.toUpperCase());
          assert.equal(s.cell('LOOKED AT'), undefined);
          assert.ok(s.bezel().every((b) => !TALLY.test(b.v)), `${id} ${v}: ${JSON.stringify(s.bezel())}`);
        }
      }
    });
  }

  it('I06a: walking both ways of playing prints no number, where the old counter read past its total', () => {
    const s = reader('I06a', 'held');
    for (let i = 0; i < listed('I06a', 'held').length; i++) s.press(i);
    s.switchTo('mounted');
    const list = listed('I06a', 'mounted');
    for (let i = 0; i < list.length; i++) {
      s.press(i);
      assert.equal(s.line(), list[i].short.toUpperCase());
    }
  });

  it('the page keeps no count it no longer shows', () => {
    assert.doesNotMatch(source, /LOOKED AT|looked at|lookedAt|setSeen|seen\.size/i);
    assert.doesNotMatch(meetFn, /parts\.length\} parts/);
  });
});

describe('the pick follows the drawing, as on the small percussion page', () => {
  it('I12: the boss does not stay lit on a tam-tam, which has none', () => {
    const s = reader('I12', 'bossed');
    s.press(listed('I12', 'bossed').findIndex((p) => p.id === 'gg.boss'));
    assert.equal(s.highlight(), 'gg.boss');
    assert.equal(s.cell('PART'), 'BOSS');
    s.switchTo('tamtam');
    assert.equal(s.highlight(), null);
    assert.equal(s.cell('PART'), 'TAP ONE');
    assert.equal(s.line(), 'step through the parts');
    assert.ok(!s.label().includes('Highlighted'));
    assert.ok(!s.words().includes('WHERE SOUND COMES FROM'), 'the sound line goes with the part');
  });

  it('I06a: the clip of the held triangle lets go on the mounted one', () => {
    const s = reader('I06a', 'held');
    s.press(listed('I06a', 'held').findIndex((p) => p.id === 'tri.clip'));
    assert.equal(s.highlight(), 'tri.clip');
    s.switchTo('mounted');
    assert.equal(s.highlight(), null);
    assert.equal(s.cell('PART'), 'TAP ONE');
  });

  it('a part in both variants stays picked', () => {
    const s = reader('I06a', 'held');
    s.press(listed('I06a', 'held').findIndex((p) => p.id === 'tri.open'));
    s.switchTo('mounted');
    assert.equal(s.highlight(), 'tri.open');
    assert.equal(s.cell('PART'), 'OPEN CORNER');
  });
});
