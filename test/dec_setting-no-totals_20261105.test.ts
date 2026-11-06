/**
 * SETTING AND SETUP PAGES: no tally on the bezel (owner rule D117, progress
 * never shows "n of total"; the same call as the Meet It tally, 2026-11-05).
 *
 * The real pages of every ready lesson run on a small hook stand-in, and the
 * bezel of every step is read as a person would read it. A LOOKED AT cell that
 * names the item (audiencePages) is not a count and stays.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { PSetting } = R(await import('../src/screens/lab/miking/pages/PSetting.tsx'));
const { PSetups } = R(await import('../src/screens/lab/miking/pages/PSetups.tsx'));
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { lessonArt } = R(await import('../src/screens/lab/miking/data/lessonArt.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const read = (f: string) => readFileSync(new URL(`../src/screens/lab/miking/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Param = { id: string; onChange?: (v: number) => void; onSelect?: (id: string) => void; options?: { id: string }[] };
type Bezel = { k: string; v: string };
type Step = { key: string; rack?: { bezel?: Bezel[]; params: Param[] } };
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

const propsOf = (id: string) => {
  const lesson = lessonById(id);
  const art = lessonArt(id) ?? {};
  return { lesson, art, answers: {}, onAnswered() {}, onInteractive() {}, chooseStart() {}, interactiveDone: new Set<string>(), variant: lesson.model.variants[0].id, setVariant() {}, hidden: false, journey: { met: {}, path: null } };
};
const ready = (LESSONS as { id: string; status: string }[]).filter((l) => l.status === 'ready').map((l) => l.id);
const pageOf = (id: string, name: 'setting' | 'setups', dflt: unknown) => ((lessonArt(id)?.pages as Record<string, unknown> | undefined)?.[name] ?? dflt) as Page;

const FILES = [
  'lessons/m10Room/PRoomSetting.tsx',
  'lessons/shared/bowed/BowedSettingPage.tsx',
  'lessons/shared/brass/BrassSettingPage.tsx',
  'lessons/shared/ensemble/ensemblePages.tsx',
  'lessons/shared/guitars/StagePlan.tsx',
  'lessons/shared/handdrums/pages/HSetting.tsx',
  'lessons/shared/lowbrass/LowBrassSettingPage.tsx',
  'lessons/shared/lutes/LutePlan.tsx',
  'lessons/shared/sax/SaxSettingPage.tsx',
  'lessons/shared/strings/PStagePlan.tsx',
  'lessons/shared/woodwinds/WindSettingPage.tsx',
  'pages/PSetting.tsx',
  'pages/PSetups.tsx',
];
// lessons/spk/pages.tsx prints its own tally and is a separate job: remove this entry when it goes.
const NOT_YET = new Set(['SPK']);
const SETTING_ONLY = FILES.filter((f) => !/ensemblePages|PSetups/.test(f));

describe('the bezel of a setting or setup page carries no tally', () => {
  it('no named file holds a LOOKED AT cell', () => {
    for (const f of FILES) assert.ok(!read(f).includes('LOOKED AT'), f);
  });

  it('a setting page keeps no state it no longer shows, and its helper works with one argument', () => {
    for (const f of SETTING_ONLY) {
      const src = read(f);
      assert.doesNotMatch(src, /setSeen|setKitSeen|setBandSeen|\w*Seen\.size|seen\.size/, f);
      assert.match(src, /extra\?: BezelItem\): BezelItem\[\] => \[/, f);
      assert.match(src, /\.\.\.\(extra \? \[extra\] : \[\]\),/, f);
      assert.match(src, /k: 'WHERE', v: where === /, `${f}: the wide step still names where it is`);
    }
  });

  it('the setups pages still gate credit on the setups looked at', () => {
    const gate = /if \(core\.length && seenCore >= core\.length && !interactiveDone\.has\('setupsSeen'\)\) onInteractive\('setupsSeen'\);/;
    assert.match(read('pages/PSetups.tsx'), gate);
    assert.match(read('lessons/shared/ensemble/ensemblePages.tsx'), gate);
  });

  it('LOOKED AT that names the item stays on the audience pages', () => {
    const src = read('lessons/shared/broadcast/audiencePages.tsx');
    assert.match(src, /\{ k: 'LOOKED AT', v: L\.short, flex: 1 \}/);
  });

  it('every ready lesson: setting and setup steps read no LOOKED AT count, before and after a pick', () => {
    assert.ok(ready.length > 50);
    const tally = /^\d+ \/ \d+$/;
    let settingSteps = 0;
    let setupSteps = 0;
    for (const id of ready.filter((l) => !NOT_YET.has(l))) {
      for (const [name, dflt] of [['setting', PSetting], ['setups', PSetups]] as const) {
        const page = pageOf(id, name, dflt);
        if (typeof page !== 'function') continue;
        const host = hookHost();
        const render = () => host(() => page(propsOf(id))).props.steps;
        for (const key of render().filter((s) => s.rack?.bezel).map((s) => s.key)) {
          const step = () => render().find((s) => s.key === key)!;
          const check = () => {
            for (const c of step().rack!.bezel!) {
              assert.ok(c.k !== 'LOOKED AT' || !tally.test(c.v), `${id} ${name}/${key}: ${c.k} ${c.v}`);
            }
          };
          check();
          const item = step().rack!.params.find((p) => p.id === 'item');
          if (name === 'setting') settingSteps++;
          else setupSteps++;
          if (item?.onChange) item.onChange(1);
          else if (item?.onSelect && item.options?.[0]) item.onSelect(item.options[0].id);
          check();
        }
      }
    }
    assert.ok(settingSteps > 50, `setting steps read: ${settingSteps}`);
    assert.ok(setupSteps > 50, `setup steps read: ${setupSteps}`);
  });
});
