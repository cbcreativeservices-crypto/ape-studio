/**
 * Small percussion: a variant change is never words over a frozen picture
 * (inst G2, 2026-11-05).
 *
 * On the strike step the chooser changed one word over one drawing in the six
 * lessons whose strike art takes no variant. On THE PARTS, part ids carry the
 * variant: PART = SCRAPER then BUILD = FIBERGLASS drew the white scraper while
 * the card still read THE SCRAPER (WOODEN). The real pages run here on a small
 * hook stand-in, so each test presses the dock params the phone presses.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { SSound } = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/pages/SSound.tsx'));
const { SInstrument } = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/pages/SInstrument.tsx'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

type Param = { id: string; onChange?: (v: number) => void; onSelect?: (id: string) => void; format?: () => string };
type Bezel = { k: string; v: string };
type Rack = { render: (w: number, h: number) => { props: Record<string, unknown> }; bezel: Bezel[]; params: Param[] };
type Step = { key: string; rack?: Rack; well?: unknown };
type Part = { id: string; label: string; short: string; variants?: string[]; listIn?: string[] };
type Node = { props?: Record<string, unknown> };

/** Runs a component body with hooks that remember between runs. */
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

const propsFor = (lesson: unknown, variant: string, setVariant: (v: string) => void) => ({
  lesson,
  art: {},
  answers: {},
  onAnswered() {},
  onInteractive() {},
  interactiveDone: new Set<string>(),
  variant,
  setVariant,
  hidden: false,
  journey: { met: {}, path: null },
});

function strikeChooser(id: string) {
  const lesson = lessonById(id);
  const host = hookHost();
  const el = host(() => (SSound as (p: unknown) => { props: { steps: Step[] } })(propsFor(lesson, lesson.model.variants[0].id, () => {})));
  return el.props.steps.find((s) => s.key === 'strike')!.rack!.params.find((p) => p.id === 'state');
}

/** One student on THE PARTS. */
function student(id: string, startVariant?: string) {
  const lesson = lessonById(id);
  const host = hookHost();
  let variant: string = startVariant ?? lesson.model.variants[0].id;
  const step = (): { rack: Rack; well: unknown } => {
    const el = host(() => (SInstrument as (p: unknown) => { props: { steps: Step[] } })(propsFor(lesson, variant, (v) => { variant = v; })));
    return el.props.steps.find((s) => s.key === 'parts') as { rack: Rack; well: unknown };
  };
  const listed = (): Part[] => lesson.model.parts.filter((p: Part) => (!p.variants || p.variants.includes(variant)) && (!p.listIn || p.listIn.includes(variant)));
  /** Reads the card the student sees under the drawing. */
  const titles = () => {
    const out: string[] = [];
    const walk = (n: unknown) => {
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== 'object') return;
      const p = (n as Node).props;
      if (typeof p?.title === 'string') out.push(p.title);
      walk(p?.children);
    };
    walk(step().well);
    return out;
  };
  return {
    pick(partId: string) {
      const parts = listed();
      const at = parts.findIndex((p) => p.id === partId);
      assert.ok(at >= 0, `${partId} is on the list`);
      // Few parts dock as tap buttons, many as a fader; press whichever is there.
      const dock = step().rack.params.find((p) => p.id === 'part')!;
      if (dock.onSelect) dock.onSelect(String(at));
      else dock.onChange!(parts.length > 1 ? at / (parts.length - 1) : 0);
    },
    build(v: string) {
      step().rack.params.find((p) => p.id === 'head')!.onSelect!(v);
    },
    cell: (k: string) => step().rack.bezel.find((b) => b.k === k)?.v,
    highlight: () => step().rack.render(375, 300).props.highlight,
    a11yLabel: () => (step().rack.render(375, 300).props.labelFor as (v: string) => string)('side'),
    titles,
    listed,
  };
}

describe('strike step: a chooser only where the drawing answers it', () => {
  for (const id of ['I03a', 'I03b', 'I03c', 'I05a', 'I05b', 'I05c']) {
    it(`${id}: no chooser, one strike drawing`, () => assert.equal(strikeChooser(id), undefined));
  }
  for (const id of ['I04', 'I05d', 'I02']) {
    it(`${id}: keeps it, the drawing redraws`, () => assert.ok(strikeChooser(id)));
  }
  for (const id of ['I03a', 'I03b', 'I03c', 'I05a', 'I05b', 'I05c']) {
    it(`${id}: the variant stays on THE PARTS`, () => {
      const s = student(id);
      const to = lessonById(id).model.variants[1].id;
      s.build(to);
      assert.ok(s.listed().every((p) => !p.variants || p.variants.includes(to)));
    });
  }
});

describe('THE PARTS: the card follows the build', () => {
  it('güiro: SCRAPER then FIBERGLASS reads, lights and speaks the fiberglass scraper', () => {
    const s = student('I05d', 'gourd');
    s.pick('gui.scraper.gourd');
    const wooden = lessonById('I05d').model.parts.find((p: Part) => p.id === 'gui.scraper.gourd').label.toUpperCase();
    assert.ok(s.titles().includes(wooden));
    s.build('fiberglass');
    const plastic = lessonById('I05d').model.parts.find((p: Part) => p.id === 'gui.scraper.fiberglass');
    assert.notEqual(plastic.label.toUpperCase(), wooden);
    assert.ok(s.titles().includes(plastic.label.toUpperCase()), 'the card names the part drawn');
    assert.ok(!s.titles().includes(wooden), 'the wooden card is gone');
    assert.equal(s.highlight(), 'gui.scraper.fiberglass');
    assert.ok(s.a11yLabel().includes(`Highlighted: ${plastic.label}.`));
    s.build('gourd');
    assert.equal(s.highlight(), 'gui.scraper.gourd');
  });

  for (const id of ['I02', 'I03a', 'I03b', 'I03c', 'I04', 'I05a', 'I05b', 'I05c', 'I05d']) {
    it(`${id}: every suffixed part crosses to its own twin, or lets go`, () => {
      const { variants, parts } = lessonById(id).model as { variants: { id: string }[]; parts: Part[] };
      for (const a of variants) {
        for (const b of variants) {
          if (a.id === b.id) continue;
          for (const p of student(id, a.id).listed()) {
            const s = student(id, a.id);
            s.pick(p.id);
            s.build(b.id);
            const twin = p.id.endsWith(`.${a.id}`) ? `${p.id.slice(0, -a.id.length)}${b.id}` : p.id;
            const exists = parts.some((q) => q.id === twin && (!q.variants || q.variants.includes(b.id)));
            assert.equal(s.highlight(), exists ? twin : null, `${p.id} into ${b.id}`);
            assert.equal(s.cell('PART'), exists ? parts.find((q) => q.id === twin)!.short.toUpperCase() : 'TAP ONE');
          }
        }
      }
    });

    it(`${id}: the bezel names the part and counts nothing`, () => {
      const { variants } = lessonById(id).model as { variants: { id: string }[] };
      const s = student(id);
      for (const v of variants) {
        s.build(v.id);
        for (const p of s.listed()) {
          s.pick(p.id);
          assert.equal(s.cell('PART'), p.short.toUpperCase());
          assert.equal(s.cell('LOOKED AT'), undefined);
        }
      }
    });
  }
});
