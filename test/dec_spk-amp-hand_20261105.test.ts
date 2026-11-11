/**
 * SPEAKERS, GUITAR AMP AND THE HAND PAGES: owner decisions of 2026-11-05
 * (function audit sections 4 and 5).
 *
 *  27. The REAR cell's second line fits: "opposed" and "in step".
 *  False CANCELS: at equal paths the cell says CANCELS only where the levels match.
 *  Two Sources: each mic reads from the side it faces, whichever mic is edited.
 *  The MIC B polarity key is a value key on the hand pages.
 *  15. No "looked at" tally on these pages; a stale pick lets go of the card.
 *
 * The real pages run on a small hook stand-in and each test presses the dock.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));
const { SPK_CABS } = R(await import('../src/screens/lab/miking/lessons/spk/geometry.ts'));
const { C02_WORKED } = R(await import('../src/screens/lab/miking/lessons/c02GuitarAmp/model.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const read = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Vec = { x: number; y: number; z: number };
type Pose = { p: Vec; az: number; el: number };
type Param = { id: string; kind: string; label?: string; valueLabel?: string; valueA11y?: string; selectedId?: string; onChange?: (v: number) => void; onSelect?: (id: string) => void; onToggle?: () => void; format?: () => string };
type Bezel = { k: string; v: string; sub?: string };
type Rack = { render: (w: number, h: number) => { props: Record<string, unknown> }; bezel: Bezel[]; params: Param[] };
type Step = { key: string; rack: Rack; well: unknown };
type Page = (p: unknown) => { props: { steps: Step[] } };
type Lesson = { id: string; zones: { id: string; start: Pose }[]; model: { parts: { id: string; short: string }[]; regions: { id: string; anchor: Vec }[]; variants: { id: string }[] } };

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
    useRef: (() => {
      const refs: { current: unknown }[] = [];
      return (v: unknown) => {
        const i = at++;
        if (!(i in refs)) refs[i] = { current: v };
        return refs[i];
      };
    })(),
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

function reader(id: string, key: string, stepKey: string, lesson: Lesson = lessonById(id)) {
  const host = hookHost();
  const page = lessonArt(id)!.pages![key] as unknown as Page;
  const props = () => ({ lesson, art: lessonArt(id), answers: {}, onAnswered() {}, onInteractive() {}, interactiveDone: new Set<string>(), variant: lesson.model.variants[0].id, setVariant() {}, hidden: false, journey: { met: {}, path: null } });
  const step = () => host(() => page(props())).props.steps.find((s) => s.key === stepKey)!;
  const param = (p: string) => step().rack.params.find((q) => q.id === p)!;
  return {
    step,
    param,
    cell: (k: string) => step().rack.bezel.find((b) => b.k === k),
    bezel: () => step().rack.bezel,
    stage: () => step().rack.render(375, 300).props,
    /** Press a stepped control at position `at` of `n`. */
    press(p: string, at: number, n: number) {
      const d = param(p);
      if (d.onSelect) d.onSelect(String(at));
      else d.onChange!(n > 1 ? at / (n - 1) : 0);
    },
  };
}

const COUNT = /\d+\s*(of|\/)\s*\d+/;

/** Both mics at the same distance from their own side of the cone. `turnB` swings mic B away, which drops its level and nothing else. */
function equalPaths(a: Pose, sFront: Vec, b: Pose, sBack: Vec, turnB: number): [Pose, Pose] {
  const len = (u: Vec, v: Vec) => Math.hypot(u.x - v.x, u.y - v.y, u.z - v.z);
  const scale = len(b.p, sBack) / len(a.p, sFront);
  const along = (k: 'x' | 'y' | 'z') => sFront[k] + (a.p[k] - sFront[k]) * scale;
  return [{ ...a, p: { x: along('x'), y: along('y'), z: along('z') } }, { ...b, az: b.az + turnB }];
}

function ampAt(turnB: number) {
  const lesson = lessonById('C02') as Lesson;
  const at = (id: string) => lesson.model.regions.find((r) => r.id === id)!.anchor;
  const A = lesson.zones.find((z) => z.id === C02_WORKED)!;
  const B = lesson.zones.find((z) => z.id.endsWith('.rear'))!;
  const [pa, pb] = equalPaths(A.start, at('r.cone'), B.start, at('r.back'), turnB);
  return { ...lesson, zones: lesson.zones.map((z) => (z === A ? { ...z, start: pa } : z === B ? { ...z, start: pb } : z)) } as Lesson;
}

/** SPK reads its zones from the cabinet table, so the pose is set there for the one read. */
function spkAt<T>(turnB: number, body: () => T): T {
  const cab = SPK_CABS['1x12'];
  const front = cab.zones.find((z: { id: string }) => z.id === 'cab.boundary')!;
  const rear = cab.zones.find((z: { id: string }) => z.id === 'cab.rear')!;
  const was = [front.start, rear.start];
  const anchor = (id: string) => cab.model.regions.find((r: { id: string }) => r.id === id)!.anchor;
  [front.start, rear.start] = equalPaths(front.start, anchor('r.cone'), rear.start, anchor('r.back'), turnB);
  try {
    return body();
  } finally {
    [front.start, rear.start] = was;
  }
}

describe('the REAR cell and the equal-path cell', () => {
  it('Speakers: CANCELS only with matched levels, PARTIAL with one mic turned away, and the switch undoes it', () => {
    spkAt(0, () => {
      const s = reader('SPK', 'twoMic', 'pair');
      assert.equal(s.cell('PATH REAR−FRONT')!.v, 'NONE');
      assert.equal(s.cell('1ST NOTCH')!.v, 'CANCELS');
      assert.equal(s.cell('REAR')!.sub, 'opposed');
      s.param('polarity').onToggle!();
      assert.equal(s.cell('1ST NOTCH')!.v, 'NO COMB');
      assert.equal(s.cell('REAR')!.sub, 'in step');
    });
    spkAt(90, () => {
      const s = reader('SPK', 'twoMic', 'pair');
      assert.equal(s.cell('PATH REAR−FRONT')!.v, 'NONE', 'turning a mic moves no path');
      assert.equal(s.cell('1ST NOTCH')!.v, 'PARTIAL');
      assert.equal(s.cell('REAR')!.sub, 'opposed');
    });
  });

  it('Guitar Amp: the same', () => {
    const on = reader('C02', 'twoMic', 'pair', ampAt(0));
    assert.equal(on.cell('PATH REAR−FRONT')!.v, 'NONE');
    assert.equal(on.cell('NOTCH')!.v, 'CANCELS');
    assert.equal(on.cell('REAR')!.sub, 'opposed');
    on.param('polarity').onToggle!();
    assert.equal(on.cell('NOTCH')!.v, 'NO COMB');
    assert.equal(on.cell('REAR')!.sub, 'in step');
    const off = reader('C02', 'twoMic', 'pair', ampAt(90));
    assert.equal(off.cell('PATH REAR−FRONT')!.v, 'NONE');
    assert.equal(off.cell('NOTCH')!.v, 'PARTIAL');
  });

  it('neither page keeps the prefix that clipped, or a CANCELS that ignores the levels', () => {
    for (const f of ['spk/pages.tsx', 'shared/electric/ampPages.tsx']) {
      const s = read(f);
      assert.doesNotMatch(s, /sum: (in step|opposed)/, f);
      assert.doesNotMatch(s, /sEff === -1 \? 'CANCELS'/, f);
    }
  });
});

describe('Guitar Amp Two Sources: each mic reads from its own side', () => {
  const words = (s: ReturnType<typeof reader>) => (s.stage().labelFor as (v: string) => string)('side');

  it('mic A names the grille and mic B the open back, whichever mic is being edited', () => {
    for (const lessonId of ['C02', 'C04', 'I11a']) {
      const s = reader(lessonId, 'twoMic', 'pair');
      for (let i = 0; i < 2; i++) {
        const t = words(s);
        const [a, b] = t.slice(t.indexOf('Mic A:')).split('Mic B:');
        assert.match(a, /from the grille/, `${lessonId} ${s.param('mic').label}: ${t}`);
        assert.match(b, /from the open back/, `${lessonId} ${s.param('mic').label}: ${t}`);
        s.param('mic').onToggle!();
      }
    }
  });

  it('no rig-wide head follows the edited mic any more', () => {
    const s = read('shared/electric/ampPages.tsx');
    const page = s.slice(s.indexOf('function AmpTwoMic'), s.indexOf('return { instrument: AmpInstrument'));
    assert.doesNotMatch(page, /setSurfaceId/);
  });
});

describe('the MIC B polarity key on the hand pages', () => {
  it('is a value key that keeps the sign in view, and a repeat press flips nothing', () => {
    const s = reader('M13', 'twoMic', 'pair');
    const key = () => s.param('polarity');
    assert.equal(key().kind, 'options');
    assert.equal(key().label, 'POLARITY');
    assert.equal(key().valueLabel, 'MIC B +');
    assert.equal(key().valueA11y, 'MIC B POLARITY +');
    key().onSelect!('inverted');
    assert.equal(key().valueLabel, 'MIC B −');
    assert.equal(key().selectedId, 'inverted');
    assert.equal(s.cell('POLARITY')!.v, 'MIC B −');
    key().onSelect!('inverted');
    assert.equal(key().valueLabel, 'MIC B −');
    key().onSelect!('normal');
    assert.equal(key().valueLabel, 'MIC B +');
  });
});

describe('decision 15: the part name, never a tally', () => {
  const none = (s: ReturnType<typeof reader>, what: string) => {
    assert.equal(s.cell('LOOKED AT'), undefined, what);
    assert.ok(s.bezel().every((b) => !COUNT.test(b.v)), `${what}: ${JSON.stringify(s.bezel())}`);
  };

  it('Speakers, the parts: name only, and a part this cabinet does not have lets go', () => {
    const s = reader('SPK', 'instrument', 'parts');
    const line = () => s.param('part').format!();
    assert.equal(line(), 'step through the parts');
    assert.equal(s.cell('PART')!.v, 'TAP ONE');
    s.param('cab').onSelect!('1x12:open');
    (s.stage().onTapPart as (id: string) => void)('spk.openBack');
    assert.equal(line(), 'OPEN BACK');
    assert.equal(s.cell('PART')!.v, 'OPEN BACK');
    none(s, 'open');
    s.param('cab').onSelect!('1x12:closed');
    assert.equal(s.cell('PART')!.v, 'TAP ONE', 'a closed cabinet has no open back to show');
    assert.equal(s.stage().highlight, null);
    assert.equal(line(), 'step through the parts');
    (s.stage().onTapPart as (id: string) => void)('spk.cone');
    s.param('cab').onSelect!('1x12:open');
    assert.equal(s.stage().highlight, 'spk.cone', 'a part both cabinets have stays picked');
    none(s, 'back to open');
  });

  it('Guitar Amp, both Meet pages, and a hand page: name only', () => {
    const inst = reader('C02', 'instrument', 'inst');
    const amp = reader('C02', 'instrument', 'amp');
    (amp.stage().onTapPart as (id: string) => void)('spk.cone');
    assert.equal(amp.param('part').format!(), 'CONE');
    none(inst, 'inst');
    none(amp, 'amp');
    const hand = reader('M13', 'instrument', 'parts');
    assert.equal(hand.param('part').format!(), 'step through the parts');
    const parts = (lessonById('M13') as Lesson).model.parts;
    hand.press('part', 1, parts.length);
    assert.equal(hand.param('part').format!(), parts[1].short.toUpperCase());
    none(hand, 'hand');
  });

  it('the three files keep no tally and no state they no longer show', () => {
    for (const f of ['spk/pages.tsx', 'shared/electric/ampPages.tsx', 'shared/hand/handPages.tsx']) {
      assert.doesNotMatch(read(f), /LOOKED AT|looked at|lookedAt|aLooked|\bsetSeen|setASeen|setChainSeen|\bseen\.size|aSeen|chainSeen/, f);
    }
  });
});
