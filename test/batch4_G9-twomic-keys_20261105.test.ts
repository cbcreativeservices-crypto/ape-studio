/**
 * Two Microphones dock keys at phone width (batch 4, G9, 2026-11-05).
 *
 * At 375 wide MIC B POLARITY + was 94 px on a key with 43 px beside its LED,
 * and it printed across EDIT MIC B. Two lines did not save it: POLARITY alone
 * is 51 px at 12 pt, so it drew "MIC B / POLARI…" and the sign was gone.
 *
 * The real page runs here on tiny hook stand-ins, so each test reads the dock
 * the phone gets, lays its words out at the real key widths, and presses it.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { PTwoMic } = R(await import('../src/screens/lab/miking/pages/PTwoMic.tsx'));
const { M01_LESSON } = R(await import('../src/screens/lab/miking/lessons/m01Kick/lesson.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

type Param = {
  id: string;
  kind: string;
  label: string;
  labelLines?: 1 | 2;
  value?: boolean;
  valueLabel?: string;
  valueA11y?: string;
  selectedId?: string;
  sticky?: boolean;
  onToggle?: () => void;
  onSelect?: (id: string) => void;
  onChange?: (v: number) => void;
  onCommit?: () => void;
  options?: { id: string; label: string }[];
};
type Bezel = { k: string; v: string; sub?: string };

/** One student on the page: state survives between presses, effects run. */
function student() {
  const slots: unknown[] = [];
  let at = 0;
  let queue: (() => void)[] = [];
  const credits: string[] = [];
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
  const render = () => {
    at = 0;
    queue = [];
    internals.H = H;
    const el = (() => {
      try {
        return PTwoMic({
          lesson: M01_LESSON,
          art: {},
          answers: {},
          onAnswered: () => {},
          onInteractive: (id: string) => { credits.push(id); },
          interactiveDone: new Set(credits),
          variant: M01_LESSON.model.defaultVariant,
          hidden: false,
        } as never);
      } finally {
        internals.H = null;
      }
    })() as { props: { steps: { key: string; rack?: { params: Param[]; bezel: Bezel[] }; well?: { props: { children: { props?: { prompt?: string } }[] } } }[] } };
    for (const f of queue) f();
    const pair = el.props.steps.find((s) => s.key === 'pair')!;
    return { ...pair.rack!, well: pair.well! };
  };
  return { render, credits };
}

/** The dock at each phone width, measured in the web preview. Five keys share
 *  the row with 6 px gaps; a toggle gives up 14 px of its key to the LED. */
const keyW = (screen: number) => (screen - 16 - 4 * 6) / 5;
const innerOf = (screen: number, led: boolean) => keyW(screen) - 2 - 2 * 4 - (led ? 14 : 0);
/** Oswald SemiBold 12 + tracking, the widest measured letter pitch at 375:
 *  POLARITY 50.8 px over 8 letters. */
const PITCH = 6.35;
const width = (s: string) => s.length * PITCH;
/** Lay text out as the key does: greedy wrap, and a word wider than the line
 *  is a line that does not fit. */
function wrap(text: string, room: number) {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last != null && width(`${last} ${word}`) <= room) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}
const key = (rack: { params: Param[] }, id: string) => {
  const p = rack.params.find((q) => q.id === id);
  assert.ok(p, `no ${id} key`);
  return p;
};

for (const screen of [320, 375, 430]) {
  test(`${screen} wide: EDIT MIC fits on two lines and the polarity key carries its mic and sign in the value line`, () => {
    const s = student();
    const rack = s.render();
    const mic = key(rack, 'mic');
    assert.equal(mic.kind, 'toggle');
    assert.equal(mic.labelLines, 2);
    const lines = wrap(mic.label, innerOf(screen, true));
    assert.ok(lines.length <= 2, `${mic.label} needs ${lines.length} lines: ${lines.join(' / ')}`);
    for (const l of lines) assert.ok(width(l) <= innerOf(screen, true) + 0.5, `"${l}" is wider than the key`);

    // Whichever way the polarity key is drawn, its words and its sign must fit.
    const pol = key(rack, 'polarity');
    if (pol.kind === 'toggle') {
      const room = innerOf(screen, true);
      const drawn = wrap(pol.label, room);
      assert.ok(drawn.length <= (pol.labelLines ?? 1) && drawn.every((l) => width(l) <= room + 0.5), `the key cannot draw "${pol.label}": ${drawn.join(' / ')}`);
    } else {
      assert.equal(pol.label, 'POLARITY');
      assert.match(pol.valueLabel ?? '', /^MIC B [+−]$/);
    }
  });
}

test('flipping polarity shows on the key and the bezel, moves the notch and leaves the delay alone', () => {
  const s = student();
  const before = s.render();
  const cell = (r: { bezel: Bezel[] }, k: string) => r.bezel.find((b) => b.k === k)!;
  assert.equal(key(before, 'polarity').valueLabel, 'MIC B +');
  assert.equal(key(before, 'polarity').selectedId, 'normal');
  // An open tray veils the comb graph, and at 320 by 700 it covers the bezel.
  assert.notEqual(key(before, 'polarity').sticky, true, 'a pick closes the tray, so the flip is seen at once');

  key(before, 'polarity').onSelect!('inverted');
  const after = s.render();
  assert.equal(key(after, 'polarity').valueLabel, 'MIC B −');
  assert.equal(key(after, 'polarity').valueA11y, 'MIC B POLARITY −');
  assert.equal(key(after, 'polarity').selectedId, 'inverted');
  assert.equal(cell(after, 'POLARITY').v, 'MIC B −');
  assert.equal(cell(after, 'DELAY Δt B−A').v, cell(before, 'DELAY Δt B−A').v);
  assert.notEqual(cell(after, '1ST NOTCH').v, cell(before, '1ST NOTCH').v);
});

test('the activity credit still takes a real flip each way plus a moved mic', () => {
  const s = student();
  const flip = (id: string) => key(s.render(), 'polarity').onSelect!(id);
  // Re-picking the setting already on is not a flip.
  flip('normal');
  assert.equal(key(s.render(), 'polarity').valueLabel, 'MIC B +');
  flip('inverted');
  flip('inverted');
  flip('normal');
  s.render();
  assert.deepEqual(s.credits, [], 'no mic has moved yet');
  const pos = key(s.render(), 'pos');
  pos.onChange!(0.1);
  pos.onCommit!();
  s.render();
  s.render();
  assert.deepEqual([...new Set(s.credits)], ['polarityVsDelay']);
});

test('a re-pick alone never earns the flip back', () => {
  const s = student();
  const flip = (id: string) => key(s.render(), 'polarity').onSelect!(id);
  flip('inverted');
  flip('inverted');
  const pos = key(s.render(), 'pos');
  pos.onChange!(0.1);
  pos.onCommit!();
  s.render();
  s.render();
  assert.deepEqual(s.credits, [], 'it went to − but never came back to +');
});

test('the prompt sends the student to the key by the word on it', () => {
  const s = student();
  const rack = s.render();
  const prompt = rack.well.props.children.map((c) => c?.props?.prompt).find(Boolean) ?? '';
  assert.ok(prompt.includes(`${key(rack, 'polarity').label} key`), prompt);
  assert.doesNotMatch(prompt, /MIC B POLARITY/);
});

test('EDIT MIC still swaps which mic the dock edits', () => {
  const s = student();
  const r = s.render();
  assert.equal(key(r, 'mic').label, 'EDIT MIC B');
  key(r, 'mic').onToggle!();
  assert.equal(key(s.render(), 'mic').label, 'EDIT MIC A');
});

test('a drawn dock label keeps a margin: "POSITION …" and "MAKEUP …" at 375', async () => {
  const { LABEL_FIT_MARGIN_PX, dockFitSize, dockKeyNeed, dockLabelFit, dockKeyWidths } = await import('../src/screens/lab/rack/dockFit.ts');
  // The sizes are floored, so the line must clear its key by the margin.
  const r = dockLabelFit(12, 66, 57, 54.4, 65, 4.5, LABEL_FIT_MARGIN_PX);
  assert.ok(r.tight && r.fs >= 9);
  assert.ok((54.4 * r.fs) / 12 + (65 - 54.4) <= 57 - LABEL_FIT_MARGIN_PX, `${r.fs}`);
  // The web measures 57.25 px as 57: a line that only just fits on paper shrinks.
  assert.ok(dockFitSize(12, 57, 57, 0, LABEL_FIT_MARGIN_PX)! < 12);
  assert.equal(dockFitSize(12, 56.4, 57, 0, LABEL_FIT_MARGIN_PX), 12, 'one with room stays as authored');
  // A key given exactly its need still reaches the 9 pt floor.
  const k = { chrome: 10, labelBase: 12, label: 66, spaced: 54.4, spacedGlyph: 65, trackPx: 4.5 };
  const need = dockKeyNeed(k);
  const f = dockLabelFit(12, k.label, need - k.chrome, k.spaced, k.spacedGlyph, k.trackPx, LABEL_FIT_MARGIN_PX);
  assert.ok(f.fs >= 9 && f.tight, `${f.fs}`);
  // A key a pixel short of its need is not left at the even width.
  assert.notEqual(dockKeyWidths([need, 40], need + 39), null);
});
