/**
 * Function audit 2026-11-05, decision 25 A and two left-not-fixed items.
 *
 *  - A chooser with one choice is a plain label, fixed once in the rack: no
 *    tray, no press, no promise of a chooser. The word and the value stay.
 *  - MIC B POLARITY on three more two-mic pages is a value key, so the sign
 *    stays on the key at phone width.
 *  - POSITION and POLARITY stay whole at 320 wide: a key that cannot hold its
 *    word at 9 pt takes the width from keys with room to spare.
 *
 * The dock renderer is cut from RackUnit and run against a stub createElement;
 * the three pages run for real on tiny hook stand-ins.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import * as React from 'react';
import ts from 'typescript';
import { DOCK_KEY_GAP, DOCK_KEY_GAP_TIGHT, VALUE_FIT_MARGIN_PX, dockFitSize, dockKeyNeed, dockLabelFit, dockStripFit, isLabelOnly } from '../src/screens/lab/rack/dockFit.ts';
import { MIN_DISPLAY_PT } from '../src/theme/legibility.ts';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { MTwoMic } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/MTwoMic.tsx'));
const { PTwoOverheads } = R(await import('../src/screens/lab/miking/lessons/m09Overheads/PTwoOverheads.tsx'));
const { HTwoMic } = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/pages/HTwoMic.tsx'));
const { I07_LESSON } = R(await import('../src/screens/lab/miking/lessons/i07Vibraphone/lesson.ts'));
const { I07_ART } = R(await import('../src/screens/lab/miking/lessons/i07Vibraphone/art.tsx'));
const { M09_LESSON } = R(await import('../src/screens/lab/miking/lessons/m09Overheads/lesson.ts'));
const { M04A_LESSON } = R(await import('../src/screens/lab/miking/lessons/m04aCongas/lesson.ts'));
const read = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type P = Record<string, any>;
const one: P = { kind: 'options', id: 'size', label: 'SIZE', valueLabel: 'SOPRANO', options: [{ id: 's', label: 'SOPRANO' }], selectedId: 's', onSelect: () => {} };
const two: P = { ...one, options: [...one.options, { id: 't', label: 'TENOR' }] };

describe('decision 25: isLabelOnly', () => {
  it('one choice, or none, is a label; two choices are a chooser', () => {
    assert.equal(isLabelOnly(one as never), true);
    assert.equal(isLabelOnly({ ...one, options: [] } as never), true);
    assert.equal(isLabelOnly(two as never), false);
  });
  it('stays a key while something else lives behind it', () => {
    assert.equal(isLabelOnly({ ...one, locked: 'why' } as never), false);
    assert.equal(isLabelOnly({ ...one, helpKey: 'lesson' } as never), false);
    assert.equal(isLabelOnly({ ...one, onReset: { label: 'RESET', onPress: () => {} } } as never), false);
    assert.equal(isLabelOnly({ ...one, options: [{ id: 's', label: 'S', onLongPress: () => {} }] } as never), false);
  });
  it('only an options param: faders, groups, toggles and actions are untouched', () => {
    for (const kind of ['fader', 'group', 'toggle', 'action']) assert.equal(isLabelOnly({ ...one, kind } as never), false, kind);
  });
});

describe('decision 25: the rack draws it', () => {
  const blob: any = new Proxy(function () {}, { get: (_t, k) => (typeof k === 'symbol' ? undefined : blob), apply: () => blob });
  const compile = (src: string) => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
  const cut = (src: string, from: string, to: string) => {
    const a = src.indexOf(from);
    const b = src.indexOf(to, a);
    assert.ok(a >= 0 && b > a, from);
    return src.slice(a, b);
  };
  const run = (js: string, own: Record<string, unknown>, result: string) => {
    const scope = new Proxy(own, {
      has: () => true,
      get: (t, k) => (typeof k === 'symbol' ? undefined : k in t ? t[k as string] : k in globalThis ? (globalThis as any)[k] : blob),
    });
    return new Function('scope', `with (scope) { ${js}; return ${result}; }`)(scope);
  };
  const stub = { createElement: (type: unknown, props: P, ...children: unknown[]) => ({ type, props: { ...props, children } }), Fragment: 'Fragment' };
  const rack = read('rack/RackUnit.tsx');
  const dockJs = compile(cut(rack, 'const shownIn = (inFull: boolean) =>', '\n  const closeTray'));
  const walk = (n: any, out: any[] = []): any[] => {
    if (Array.isArray(n)) n.forEach((c) => walk(c, out));
    else if (n && typeof n === 'object' && 'props' in n) {
      out.push(n);
      walk(n.type === 'DockStrip' ? n.props.children[0](() => undefined) : n.props.children, out);
    }
    return out;
  };
  const keyOf = (params: P[], extra: P = {}) => {
    const dockFor = run(dockJs, { React: stub, DockButton: 'DockButton', DockStrip: 'DockStrip', isLabelOnly, params, lockedNoteId: null, bound: null, trayParam: null, openTrayId: null, effBoundId: '', styles: blob, ...extra }, 'dockFor');
    return walk(dockFor(false)).find((e) => e.type === 'DockButton');
  };

  it('one choice: the word and value, no verb glyph, no chooser promise', () => {
    const k = keyOf([one]);
    assert.equal(k.props.plain, true);
    assert.equal(k.props.label, 'SIZE');
    assert.equal(k.props.value, 'SOPRANO');
    assert.equal(k.props.glyph, undefined);
    assert.equal(k.props.onLongPress, undefined);
    assert.doesNotMatch(k.props.a11y, /chooser|tap/i);
  });
  it('the full word is what is read aloud', () => {
    assert.equal(keyOf([{ ...one, valueLabel: 'SUPER', valueA11y: 'SUPERCARDIOID' }]).props.a11y, 'SIZE: SUPERCARDIOID.');
  });
  it('a press on it opens nothing', () => {
    let opened = false;
    keyOf([one], { setOpenTrayId: () => { opened = true; } }).props.onPress();
    assert.equal(opened, false);
  });
  it('two choices are the same chooser key as before', () => {
    const k = keyOf([two]);
    assert.equal(k.props.plain, undefined);
    assert.equal(k.props.glyph, '▸');
    assert.match(k.props.a11y, /Tap to open the chooser/);
  });
  it('no tray can open on it, and one left open closes itself', () => {
    assert.match(rack, /\(p\.kind === 'options' \|\| p\.kind === 'group'\) && !isLabelOnly\(p\)/);
    assert.match(rack, /if \(openIsLabel\) setOpenTrayId\(null\)/);
  });
  it('the lane still binds the first fader when the only choice key is a label or is named as initialParam', () => {
    const js = compile(cut(rack, 'const effBoundId = ', '\n  const bound = '));
    const faders = [{ id: 'dist' }, { id: 'aim' }];
    const bound = (boundId: string, validInitial: boolean, initialParam: string) => run(js, { faders, boundId, validInitial, initialParam }, 'effBoundId');
    assert.equal(bound('dist', true, 'dist'), 'dist');
    assert.equal(bound('size', false, 'size'), 'dist', 'a page whose initialParam is the label key lands on its first fader');
  });
  it('the plain face has no Pressable and no key skin', () => {
    const btn = read('rack/DockButton.tsx');
    const plain = cut(btn, 'if (plain) {', '\n  return (\n    <Pressable');
    assert.doesNotMatch(plain, /Pressable|onPress/);
    assert.match(plain, /accessibilityRole="text"/);
  });
});

describe('section 5: MIC B POLARITY keeps its sign on the key', () => {
  const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  function learner(Page: (p: never) => unknown, lesson: unknown, art: unknown, stepsOf: (el: any) => any[]) {
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
      useLayoutEffect: () => {},
      useContext: (c: { _currentValue?: unknown }) => c._currentValue,
    };
    const dock = () => {
      at = 0;
      queue = [];
      internals.H = H;
      let el: unknown;
      try {
        el = Page({ lesson, art, answers: {}, onAnswered: () => {}, onInteractive: () => {}, interactiveDone: new Set(), variant: (lesson as any).model.defaultVariant, setVariant: () => {}, hidden: false } as never);
        // HTwoMic hands the page to PairPage, keyed by the chosen pair.
        if ((el as any)?.props?.pair) el = (el as any).type((el as any).props);
      } finally {
        internals.H = null;
      }
      for (const f of queue) f();
      for (const s of stepsOf(el)) {
        const k = s.rack?.params.find((p: P) => p.id === 'polarity');
        if (k) return k as P;
      }
      throw new Error('no polarity key');
    };
    return dock;
  }

  const steps = (el: any): any[] => {
    const found: any[] = [];
    const seek = (n: any) => {
      if (Array.isArray(n)) n.forEach(seek);
      else if (n && typeof n === 'object' && n.props) {
        if (Array.isArray(n.props.steps)) found.push(...n.props.steps);
        seek(n.props.children);
      }
    };
    seek(el);
    return found;
  };


  for (const [name, Page, lesson, art] of [['MTwoMic', MTwoMic, I07_LESSON, I07_ART], ['PTwoOverheads', PTwoOverheads, M09_LESSON, {}], ['HTwoMic', HTwoMic, M04A_LESSON, {}]] as const) {
    it(`${name}: a value key that shows the sign, reads the full words, and flips`, () => {
      const dock = learner(Page as never, lesson, art, steps);
      const k = dock();
      assert.equal(k.kind, 'options');
      assert.equal(k.label, 'POLARITY');
      assert.equal(k.valueLabel, 'MIC B +');
      assert.equal(k.valueA11y, 'MIC B POLARITY +');
      assert.equal(k.selectedId, 'normal');
      assert.equal(k.options.length, 2, 'two choices: this key must not become a label');
      assert.notEqual(k.sticky, true, 'a pick closes the tray, so the flip is seen at once');
      k.onSelect('inverted');
      const after = dock();
      assert.equal(after.valueLabel, 'MIC B −');
      assert.equal(after.valueA11y, 'MIC B POLARITY −');
      assert.equal(after.selectedId, 'inverted');
    });
  }
});

describe('section 5: the word stays whole at 320 and 375, at least 9 pt', () => {
  /** A line's measured widths at 12 pt, at the Oswald pitch measured at 375. */
  const PITCH = 6.35;
  const GLYPH = 9;
  const chrome = 2 + 2 * 4;
  const glyphKey = (word: string) => {
    const spaced = (word.length + 1) * PITCH;
    return { chrome, labelBase: 12, label: spaced + GLYPH, spaced, spacedGlyph: spaced + GLYPH, trackPx: (word.length + 1) * 0.5 };
  };
  const dockAt = (screen: number) => screen - 16;
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const SIX = ['POSITION', 'AIM', 'SIZE', 'MIC', 'POLARITY', 'VIEW'];

  for (const screen of [320, 375]) {
    it(`six keys at ${screen}: each word fits its key at 9 pt or more, on the screen`, () => {
      const keys = SIX.map(glyphKey);
      const needs = keys.map((k) => dockKeyNeed(k));
      const strip = dockAt(screen);
      const row = dockStripFit(needs, strip);
      const gaps = SIX.length - 1;
      const widths = row?.widths ?? SIX.map(() => (strip - DOCK_KEY_GAP * gaps) / SIX.length);
      const gap = row?.gap ?? DOCK_KEY_GAP;
      assert.ok(sum(widths) + gap * gaps <= strip + 0.01, 'the row stays on the screen');
      // The key's chrome at the row's own padding (frame round 2, 2026-11-13:
      // at 320 these keys now take a tightened row, so no key is under 44).
      const rowChrome = 2 + 2 * (row?.padX ?? 4);
      keys.forEach((k, i) => {
        assert.ok(widths[i] >= 44, `${SIX[i]}: ${widths[i]} wide`);
        const f = dockLabelFit(12, k.label, widths[i] - rowChrome, k.spaced, k.spacedGlyph, k.trackPx);
        assert.ok(f.fs >= MIN_DISPLAY_PT, `${SIX[i]} at ${f.fs}`);
        const trackFree = f.tracked ? 0 : k.trackPx;
        const line = ((k.spaced - trackFree) * f.fs) / 12 + (f.tight ? GLYPH : k.spacedGlyph - k.spaced);
        assert.ok(line <= widths[i] - rowChrome + 0.5, `${SIX[i]}: ${line} in ${widths[i] - rowChrome}`);
      });
    });
  }

  it('without the wider key POSITION could not fit: the equal share at 320 is short of it', () => {
    const k = glyphKey('POSITION');
    const even = (dockAt(320) - DOCK_KEY_GAP * 5) / 6;
    assert.equal(dockFitSize(12, k.spaced - k.trackPx, even - chrome, GLYPH), null);
  });

  it('a dock whose words fit at the even width stays equal with the normal gap: nothing moves', () => {
    assert.equal(dockStripFit([50, 50, 50, 50], dockAt(390)), null);
    assert.equal(dockStripFit([0, 0, 0], dockAt(320)), null, 'not measured yet');
  });

  it('three keys short of room share the row in proportion, and never run off the screen', () => {
    const row = dockStripFit([120, 120, 120], 304)!;
    assert.equal(row.gap, DOCK_KEY_GAP_TIGHT);
    assert.equal(row.wrap, false);
    assert.ok(sum(row.widths) + 2 * row.gap <= 304);
  });

  it('the six conga keys at 320 cannot share a row at 9 pt: they take two, and every word has its width', () => {
    // Measured at 320 on M04a: POSITION, AIM, EDIT MIC B, POLARITY, PAIR (ONE MIC OV), SOURCE.
    const needs = [58, 48, 68, 60, 65, 54];
    const strip = dockAt(320);
    assert.ok(sum(needs) > strip);
    const row = dockStripFit(needs, strip)!;
    assert.equal(row.wrap, true);
    assert.equal(row.widths.length, 6);
    for (const part of [row.widths.slice(0, 3), row.widths.slice(3)]) assert.ok(sum(part) + 2 * row.gap <= strip, 'each row stays on the screen, with no third row');
    row.widths.forEach((w, i) => assert.ok(w >= needs[i], `key ${i}: ${w} for ${needs[i]}`));
  });

  it('the rack wraps only on the row the fit asked to wrap', () => {
    assert.match(read('rack/DockButton.tsx'), /flexWrap: row\.wrap \? 'wrap' : 'nowrap'/);
  });

  it('a fader value is left out, so the keys do not shift under the drag', () => {
    const k = glyphKey('GAIN');
    assert.equal(dockKeyNeed({ ...k, valueBase: 14, value: 0 }), dockKeyNeed(k));
    assert.ok(dockKeyNeed({ ...k, valueBase: 14, value: 200 }) > dockKeyNeed(k));
  });

  it('a shrunk value keeps a hair of margin: "≈ -10°" overran its key by a quarter pixel and lost its digits', () => {
    const fs = dockFitSize(14, 45.2 + VALUE_FIT_MARGIN_PX, 38)!;
    assert.ok((45.2 * fs) / 14 + 0.23 <= 38, String(fs));
  });

  it('a two-line key asks for about half its one-line width', () => {
    assert.equal(dockKeyNeed({ chrome, labelBase: 12, label: 100, lines: 2 }), chrome + 50 + 1);
  });

  it('the row has one gap constant, and RackUnit no longer spells out 6', () => {
    assert.match(read('rack/RackUnit.tsx'), /strip: \{ flexDirection: 'row', gap: DOCK_KEY_GAP \}/);
  });
});
