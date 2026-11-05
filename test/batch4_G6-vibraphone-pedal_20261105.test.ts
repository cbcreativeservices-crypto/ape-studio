/**
 * Strike to sound, PEDAL UP (batch 4, G6, 2026-11-05).
 *
 * The note said the notes stop, while BAR and TUBE AIR still read RINGING and
 * the bar stayed flexing. The real page runs here on a small hook stand-in,
 * so each test presses the same dock params the phone does and reads the same
 * bezel; the real BarStrike then says what it would draw.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { MSound } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/MSound.tsx'));
const { BarStrike, barFlex } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/MalletSound.tsx'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { VIBE_FAM } = R(await import('../src/screens/lab/miking/lessons/i07Vibraphone/model.ts'));
const { GLOCK_FAM } = R(await import('../src/screens/lab/miking/lessons/i10Glockenspiel/model.ts'));
const { MARIMBA_FAM } = R(await import('../src/screens/lab/miking/lessons/i08Marimba/model.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

type Param = { id: string; onSelect?: (id: string) => void; options?: { id: string; label: string }[] };
type Bezel = { k: string; v: string };
type Step = { key: string; rack: { render: (w: number, h: number) => { type: unknown; props: Record<string, unknown> }; bezel: Bezel[]; params: Param[] } };
type El = { type?: unknown; props?: Record<string, unknown> };

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

/** One student on the page. */
function student(id: string, fam: unknown, variant: string) {
  const lesson = lessonById(id);
  const host = hookHost();
  const props = { lesson, art: { malletFam: fam }, answers: {}, onAnswered() {}, onInteractive() {}, interactiveDone: new Set<string>(), variant, setVariant() {}, hidden: false };
  const strike = (): Step['rack'] => {
    const el = host(() => (MSound as (p: unknown) => { props: { steps: Step[] } })(props));
    return el.props.steps.find((s) => s.key === 'strike')!.rack;
  };
  const param = (pid: string) => strike().params.find((p) => p.id === pid);
  return {
    strike,
    param,
    pedal: (to: 'up' | 'down') => param('pedal')!.onSelect!(to),
    step: (k: number) => param('step')!.onSelect!(String(k - 1)),
    cell: (k: string) => strike().bezel.find((b) => b.k === k)?.v,
  };
}

/** What the real BarStrike returns for a page's current state. */
function drawn(s: ReturnType<typeof student>) {
  const el = s.strike().render(390, 300);
  const out = hookHost()(() => (BarStrike as (p: unknown) => El)(el.props));
  const all: El[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    all.push(n as El);
    walk((n as El).props?.children);
  };
  walk(out);
  const labels = all.flatMap((e) => (Array.isArray(e.props?.labels) ? (e.props!.labels as { id: string; text: string }[]) : []));
  return {
    label: (id: string) => labels.find((l) => l.id === id)?.text,
    // The tube's air is the one thin air-blue stroke with round joins.
    airDrawn: all.some((e) => e.props?.color === '#9cc4ff' && e.props?.strokeJoin === 'round'),
    a11y: String(el.props.accessibilityLabel),
  };
}

test('vibraphone: pedal down rings, pedal up reads DAMPED at ③ and ④', () => {
  const s = student('I07', VIBE_FAM, 'motor');
  for (const k of [3, 4]) {
    s.step(k);
    s.pedal('down');
    assert.equal(s.cell('BAR'), 'RINGING');
    assert.equal(s.cell('TUBE AIR'), 'RINGING');
    s.pedal('up');
    assert.equal(s.cell('BAR'), 'DAMPED');
    assert.equal(s.cell('TUBE AIR'), 'DAMPED');
  }
});

test('pedal up leaves the words that are still true alone', () => {
  const s = student('I07', VIBE_FAM, 'motor');
  s.pedal('up');
  s.step(1);
  assert.equal(s.cell('BAR'), 'STRUCK');
  s.step(2);
  assert.equal(s.cell('BAR'), 'BENDING');
  assert.equal(s.cell('TUBE AIR'), 'AT REST');
  s.step(4);
  assert.equal(s.cell('SOUND'), 'UP AND OUT');
});

test('the second vibraphone setup and the pedal glockenspiel behave the same', () => {
  for (const [id, fam, variant] of [['I07', VIBE_FAM, 'nomotor'], ['I10', GLOCK_FAM, 'pedal']] as const) {
    const s = student(id, fam, variant);
    s.step(3);
    assert.equal(s.cell('BAR'), 'RINGING', id);
    s.pedal('up');
    assert.equal(s.cell('BAR'), 'DAMPED', id);
    assert.equal(s.cell('TUBE AIR'), 'DAMPED', id);
  }
});

test('no damper, no change: the case glockenspiel and the marimba have no PEDAL and ring', () => {
  const glock = student('I10', GLOCK_FAM, 'case');
  const marimba = student('I08', MARIMBA_FAM, MARIMBA_FAM.variants[0].row.id);
  for (const s of [glock, marimba]) {
    assert.equal(s.param('pedal'), undefined);
    s.step(3);
    assert.equal(s.cell('BAR'), 'RINGING');
    const d = drawn(s);
    assert.equal(d.label('dp'), undefined);
    assert.doesNotMatch(d.a11y, /damper/i);
  }
  assert.equal(glock.cell('TUBE AIR'), 'NO TUBE');
});

test('pedal up: the air is not drawn ringing and the display says so', () => {
  const s = student('I07', VIBE_FAM, 'motor');
  s.step(3);
  const free = drawn(s);
  assert.equal(free.airDrawn, true);
  assert.equal(free.label('s3'), '③ TUBE AIR RINGS');
  assert.equal(free.label('dp'), undefined);
  s.pedal('up');
  const held = drawn(s);
  assert.equal(held.airDrawn, false);
  assert.equal(held.label('s3'), '③ TUBE AIR DAMPED');
  assert.equal(held.label('dp'), 'DAMPER ON THE BAR');
  assert.match(held.a11y, /damper is on the bar/);
});

test('the bar: bent by the stroke at ②, then still by ③ with the damper on it', () => {
  assert.equal(barFlex(1, true), 0);
  assert.equal(barFlex(2, true), 1, 'the stroke still bends a damped bar');
  assert.equal(barFlex(3, true), 0);
  assert.equal(barFlex(4, true), 0);
  assert.equal(barFlex(2.5, true), 0.5);
});

test('the bar: free of the damper it keeps moving through ③ and ④', () => {
  for (const [at, flex] of [[1, 0], [1.5, 0.5], [2, 1], [3, 1], [4, 1]]) assert.equal(barFlex(at, false), flex);
});

test('BarStrike bends the drawn bar by barFlex, in a worklet', () => {
  const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/mallets/MalletSound.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.match(src, /useDerivedValue\(\(\) => bentBar\(b, 0, amp \* barFlex\(reveal\.value, damperUp\)\)\)/);
  assert.match(src, /export const barFlex = [^\n]*\{\n\s*'worklet';/);
});
