/**
 * Instrument audit G6-S2 (2026-11-05), the two hand-drum page sets.
 *
 * 1. Worked example: on handPages (tonbak, tabla, gong, triangle, harmonica,
 *    accordion, organ) and HPlacement (congas, bongos, timbales, djembe) the
 *    STEP control moved the words and left the drawing frozen. Every piece now
 *    marks the drawing, and what it marks agrees with the card.
 * 2. Two mics at equal paths: handPages said NO COMB whatever the polarity.
 *
 * The real pages run here on tiny hook stand-ins, as in the G7 test, and each
 * test reads what the phone would be handed at each setting.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { HPlacement } = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/pages/HPlacement.tsx'));
const { TONBAK_PAGES } = R(await import('../src/screens/lab/miking/lessons/m12Tonbak/pages.tsx'));
const { TABLA_PAGES } = R(await import('../src/screens/lab/miking/lessons/m13Tabla/pages.tsx'));
const { M12_LESSON } = R(await import('../src/screens/lab/miking/lessons/m12Tonbak/lesson.ts'));
const { M13_LESSON } = R(await import('../src/screens/lab/miking/lessons/m13Tabla/lesson.ts'));
const { M04A_LESSON } = R(await import('../src/screens/lab/miking/lessons/m04aCongas/lesson.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

type Param = { id: string; kind: string; onChange?: (v: number) => void; onToggle?: () => void };
type Bezel = { k: string; v: string; sub?: string };
type Scene = { art: { labels: (v: string, vr: string) => { id: string; text: string }[] }; showZones?: boolean; zoneIds?: string[]; guides?: boolean; pathsFrom?: unknown; highlight?: string | null };
type Rack = { params: Param[]; bezel: Bezel[]; render: (w: number, h: number) => { props: Scene } };
type Step = { key: string; rack?: Rack; well?: unknown };
type El = { type?: unknown; props?: Record<string, unknown> };
type Lessonish = { model: { defaultVariant: string } };

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
  return (key: string) => {
    at = 0;
    queue = [];
    internals.H = H;
    let el: El;
    try {
      el = Page(all as never) as El;
    } finally {
      internals.H = null;
    }
    for (const f of queue) f();
    const step = (el.props as { steps: Step[] }).steps.find((s) => s.key === key)!;
    return { ...step.rack!, words: wordsIn(step.well) };
  };
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

const blankArt = { labels: () => [] };

/** The drawing the page hands the phone at each of the six pieces. */
function pieces(Page: (p: never) => unknown, lesson: Lessonish) {
  const render = student(Page, { lesson, art: blankArt, variant: lesson.model.defaultVariant });
  render('watch');
  return [0, 1, 2, 3, 4, 5].map((i) => {
    render('watch').params.find((p) => p.id === 'piece')!.onChange!(i / 5);
    render('watch');
    const scene = render('watch').render(375, 300).props;
    const mark = scene.art.labels('side', lesson.model.defaultVariant).find((l) => l.id === 'worked.mark')?.text ?? null;
    return { ...scene, mark };
  });
}

const tonbak = TONBAK_PAGES.placement as (p: never) => unknown;
const tabla = TABLA_PAGES.placement as (p: never) => unknown;
const cases: [string, (p: never) => unknown, Lessonish][] = [
  ['tonbak (handPages, no line)', tonbak, M12_LESSON],
  ['tabla (handPages, a pair)', tabla, M13_LESSON],
  ['congas (HPlacement)', HPlacement as (p: never) => unknown, M04A_LESSON],
];

for (const [name, Page, lesson] of cases) {
  test(`${name}: every piece changes the drawing`, () => {
    const seen = pieces(Page, lesson);
    const prints = seen.map((s) => JSON.stringify([s.mark, !!s.showZones, !!s.guides, s.pathsFrom, s.highlight]));
    assert.equal(new Set(prints).size, 6, `six pieces, six different drawings: ${prints.join(' | ')}`);
    assert.equal(seen[0].mark, 'START HERE');
    assert.equal(seen[0].showZones, true, 'where to begin shows the zone');
    assert.match(String(seen[1].mark), /^FROM /, 'the head piece names what it is measured from');
    assert.equal(seen[2].guides, true, 'the distance draws its dimension');
    assert.equal(seen[4].mark, 'THE AIM');
    assert.ok(seen[4].pathsFrom, 'the aim is drawn');
    assert.match(String(seen[5].mark), /KEEP/, 'clearance points at what to keep clear');
  });
}

test('piece 4 never says NO LINE NAMED over a card about something else', () => {
  assert.equal(pieces(tonbak, M12_LESSON)[3].mark, 'THE VIEWPOINT');
});

test('the line piece of the hand drums draws the blue region its card points at', () => {
  const seen = pieces(HPlacement as (p: never) => unknown, M04A_LESSON);
  assert.match(String(seen[3].mark), /^OFF /);
  assert.equal(seen[3].showZones, true);
  assert.equal(seen[3].zoneIds?.length, 1, 'just the worked zone');
  assert.equal(seen[2].showZones, false, 'the other pieces leave it off');
});

/** Tonbak, with its two mics started on one point: both paths match. */
const sameSpot = { ...M12_LESSON, zones: M12_LESSON.zones.map((z: { start: unknown }) => ({ ...z, start: M12_LESSON.zones[0].start })) };
const cell = (r: { bezel: Bezel[] }, k: RegExp) => r.bezel.find((b) => k.test(b.k))!;

test('at equal paths the readout and the words follow the polarity', () => {
  const render = student(TONBAK_PAGES.twoMic as (p: never) => unknown, { lesson: sameSpot, art: blankArt, variant: sameSpot.model.defaultVariant });
  render('pair');
  const normal = render('pair');
  assert.equal(cell(normal, /PATH/).v, 'NONE', 'the paths match');
  assert.equal(cell(normal, /1ST NOTCH/).v, 'NO COMB');
  assert.match(normal.words.join(' '), /no comb/i);
  assert.doesNotMatch(normal.words.join(' '), /cancels/i);

  normal.params.find((p) => p.id === 'polarity')!.onToggle!();
  render('pair');
  const inverted = render('pair');
  assert.equal(cell(inverted, /1ST NOTCH/).v, 'CANCELS');
  assert.equal(cell(inverted, /DELAY/).sub, 'cancels');
  const said = inverted.words.join(' ');
  assert.match(said, /cancels/i);
  assert.doesNotMatch(said, /no comb/i, 'the words must not say no comb while the sum cancels');

  inverted.params.find((p) => p.id === 'polarity')!.onToggle!();
  render('pair');
  assert.equal(cell(render('pair'), /1ST NOTCH/).v, 'NO COMB');
});
