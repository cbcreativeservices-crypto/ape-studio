/**
 * Two mics at equal paths, polarity flipped (G7 S2, 2026-11-05).
 *
 * With no path difference, an inverted mic B is the case that cancels most,
 * yet the 1ST NOTCH cell and the words said NO COMB / no comb either way, so
 * on the Overheads page the switch changed only its own label. The real pages
 * run here on tiny hook stand-ins, with both mics started on one point so the
 * paths match, and each test reads what the phone would show on each setting.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { PTwoMic } = R(await import('../src/screens/lab/miking/pages/PTwoMic.tsx'));
const { PTwoOverheads } = R(await import('../src/screens/lab/miking/lessons/m09Overheads/PTwoOverheads.tsx'));
const { HTwoMic } = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/pages/HTwoMic.tsx'));
const { MTwoMic } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/MTwoMic.tsx'));
const { M01_LESSON } = R(await import('../src/screens/lab/miking/lessons/m01Kick/lesson.ts'));
const { M09_LESSON } = R(await import('../src/screens/lab/miking/lessons/m09Overheads/lesson.ts'));
const { M04A_LESSON } = R(await import('../src/screens/lab/miking/lessons/m04aCongas/lesson.ts'));
const { I07_LESSON } = R(await import('../src/screens/lab/miking/lessons/i07Vibraphone/lesson.ts'));
const { combDb } = R(await import('../src/screens/lab/miking/engine/physics/twoMic.ts'));
const { I07_ART } = R(await import('../src/screens/lab/miking/lessons/i07Vibraphone/art.tsx'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

type Param = { id: string; kind: string; onToggle?: () => void; onSelect?: (id: string) => void };
type Bezel = { k: string; v: string; sub?: string };
type Step = { key: string; rack?: { params: Param[]; bezel: Bezel[] }; well?: unknown };
type El = { type?: unknown; props?: Record<string, unknown> };

function student(Page: (p: never) => unknown, props: Record<string, unknown>) {
  const slots: unknown[] = [];
  let at = 0;
  let queue: (() => void)[] = [];
  const slot = (init: () => unknown) => {
    const i = at++;
    if (!(i in slots)) slots[i] = init();
    return i;
  };
  const H = {
    useState: (init: unknown) => {
      const i = slot(() => (typeof init === 'function' ? (init as () => unknown)() : init));
      return [slots[i], (v: unknown) => { slots[i] = typeof v === 'function' ? (v as (o: unknown) => unknown)(slots[i]) : v; }];
    },
    useMemo: (f: () => unknown) => f(),
    useCallback: (f: unknown) => f,
    useRef: (init: unknown) => slots[slot(() => ({ current: init }))],
    useEffect: (f: () => void) => { queue.push(f); },
    useContext: (c: { _currentValue?: unknown }) => c._currentValue,
  };
  const all = { art: {}, answers: {}, onAnswered: () => {}, onInteractive: () => {}, interactiveDone: new Set<string>(), hidden: false, setVariant: () => {}, ...props };
  const render = () => {
    at = 0;
    queue = [];
    internals.H = H;
    let el: El;
    try {
      el = Page(all as never) as El;
      // HTwoMic wraps its page in a keyed PairPage.
      if (typeof el.type === 'function' && !(el.props as { steps?: unknown }).steps) el = (el.type as (p: unknown) => El)(el.props);
    } finally {
      internals.H = null;
    }
    for (const f of queue) f();
    const steps = (el.props as { steps: Step[] }).steps;
    const step = steps.find((s) => s.rack?.params.some((p) => p.id === 'polarity'))!;
    return { ...step.rack!, words: wordsIn(step.well) };
  };
  return { render };
}

/** Every string a step's well draws or speaks: the Body text and the graph's label. */
function wordsIn(n: unknown, out: string[] = []): string[] {
  if (typeof n === 'string') out.push(n);
  else if (Array.isArray(n)) n.forEach((c) => wordsIn(c, out));
  else if (n && typeof n === 'object') {
    const p = (n as El).props ?? {};
    wordsIn(p.children, out);
    if (typeof p.label === 'string') out.push(p.label);
  }
  return out;
}

const flip = (rack: { params: Param[] }, to: 'inverted' | 'normal') => {
  const p = rack.params.find((q) => q.id === 'polarity')!;
  if (p.onToggle) p.onToggle();
  else p.onSelect!(to);
};
const cell = (r: { bezel: Bezel[] }, k: RegExp) => r.bezel.find((b) => k.test(b.k));

/** Each lesson with its two mics started on one point: both paths match. */
const zones = (l: typeof M01_LESSON) => l.zones.map((z: { start: unknown }) => ({ ...z, start: l.zones[0].start }));
const pages: [string, (p: never) => unknown, Record<string, unknown>][] = [
  ['PTwoMic', PTwoMic, { lesson: { ...M01_LESSON, zones: zones(M01_LESSON), copy: { ...M01_LESSON.copy, twoMic: { ...M01_LESSON.copy.twoMic, B: { ...M01_LESSON.copy.twoMic.A, zone: undefined } } } }, variant: M01_LESSON.model.defaultVariant }],
  ['PTwoOverheads', PTwoOverheads, { lesson: { ...M09_LESSON, zones: zones(M09_LESSON) }, variant: M09_LESSON.model.defaultVariant }],
  ['HTwoMic', HTwoMic, { lesson: { ...M04A_LESSON, hand: { ...M04A_LESSON.hand, pairs: M04A_LESSON.hand.pairs.map((p: { A: unknown }) => ({ ...p, B: p.A })) } }, variant: M04A_LESSON.model.defaultVariant }],
  ['MTwoMic', MTwoMic, { lesson: { ...I07_LESSON, mallet: { ...I07_LESSON.mallet, two: { ...I07_LESSON.mallet.two, presets: I07_LESSON.mallet.two.presets.map((p: { A: unknown }) => ({ ...p, B: p.A })) } } }, variant: I07_LESSON.model.defaultVariant, art: I07_ART }],
];

for (const [name, Page, props] of pages) {
  test(`${name}: at equal paths the readout and the words follow the polarity`, () => {
    const s = student(Page, props);
    const normal = s.render();
    assert.equal(cell(normal, /1ST NOTCH/)!.v, 'NO COMB');
    assert.match(normal.words.join(' '), /no comb/i);
    assert.doesNotMatch(normal.words.join(' '), /cancels/i);

    flip(normal, 'inverted');
    const inverted = s.render();
    assert.equal(cell(inverted, /1ST NOTCH/)!.v, 'CANCELS');
    const said = inverted.words.join(' ');
    assert.match(said, /cancels/i);
    assert.doesNotMatch(said, /no comb/i, 'the words must not say no comb while the sum cancels');
    const delay = cell(inverted, /DELAY/);
    if (delay) assert.notEqual(delay.sub, 'no comb');

    flip(inverted, 'normal');
    assert.equal(cell(s.render(), /1ST NOTCH/)!.v, 'NO COMB');
  });
}

test('the graph agrees: no delay and inverted hits the floor at every frequency, as far as the levels match', () => {
  for (const f of [100, 1000, 10000]) {
    assert.equal(combDb(f, 0, 1, 1, -1), -40);
    assert.ok(Math.abs(combDb(f, 0, 1, 1, 1)) < 1e-9);
    assert.ok(combDb(f, 0, 1, 0.5, -1) > -40, 'unequal levels leave a remainder');
  }
});
