/**
 * HOME + SHELL — evening toddler hunt, pass 2 (2026-10-02).
 *
 * useScreenIntro (features/intro/ScreenIntroOverlay.tsx): the STORED seen flag
 * must decide the intro both ways. Home mounts "Our Commitment to You" with
 * `sessionOnly={entitlement !== 'academy'}`; right after a sign-in the tier is
 * still 'anonymous', so the session-only branch put the intro up, and when the
 * tier landed as 'academy' the persisted branch read the member's stored "1"
 * and LEFT IT UP (it only ever set `true`). A member who had dismissed it for
 * good saw it again on every sign-in.
 *
 * Driven for real: the .tsx is transpiled with the repo's TypeScript and run
 * on a tiny hooks runtime (state slots, refs, effects with deps + cleanup).
 *
 * R2: the [R2] test and the dismiss-race test FAILED against
 * ScreenIntroOverlay.tsx as it was at ecc8e2fa, and the attractStore [R2] test
 * FAILED against attractStore.ts at ecc8e2fa (each copied aside, the old file
 * restored, run, the fix put back).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__HSE2_AS__ = AS;
g.__HSE2_FAIL__ = false;

// ── a tiny hooks runtime ────────────────────────────────────────────────────
type Effect = { deps?: unknown[]; cleanup?: void | (() => void) };
const rt = {
  slots: [] as unknown[],
  effects: [] as Effect[],
  pending: [] as (() => void)[],
  i: 0,
  e: 0,
  rerender: () => {},
};
g.__HSE2_RT__ = rt;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const REACT = mod(`
  const rt = globalThis.__HSE2_RT__;
  export function useState(init) {
    const i = rt.i++;
    if (!(i in rt.slots)) rt.slots[i] = typeof init === 'function' ? init() : init;
    return [rt.slots[i], (v) => { const n = typeof v === 'function' ? v(rt.slots[i]) : v; if (n !== rt.slots[i]) { rt.slots[i] = n; rt.rerender(); } }];
  }
  export function useRef(init) { const i = rt.i++; if (!(i in rt.slots)) rt.slots[i] = { current: init }; return rt.slots[i]; }
  export function useCallback(fn) { rt.i++; return fn; }
  export function useEffect(fn, deps) {
    const e = rt.e++;
    const prev = rt.effects[e];
    const changed = !prev || !deps || !prev.deps || deps.some((d, k) => !Object.is(d, prev.deps[k]));
    if (!changed) return;
    rt.pending.push(() => {
      if (prev && typeof prev.cleanup === 'function') prev.cleanup();
      rt.effects[e] = { deps, cleanup: fn() };
    });
  }
  export default { useState, useRef, useCallback, useEffect };`);
const JSX = mod(`export const jsx = () => null; export const jsxs = () => null; export const Fragment = 'F';`);
const RN = mod(`export const Pressable = 'P'; export const Text = 'T'; export const View = 'V'; export const StyleSheet = { create: (s) => s };`);
const NAV = mod(`export const useIsFocused = () => true;`);
const FAKE_AS = mod(`
  const s = globalThis.__HSE2_AS__;
  export default {
    async getItem(k) { if (globalThis.__HSE2_FAIL__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, String(v)); },
  };`);
const STUBS: Record<string, string> = {
  react: REACT,
  'react/jsx-runtime': JSX,
  'react-native': RN,
  '@react-navigation/native': NAV,
  '@react-native-async-storage/async-storage': FAKE_AS,
  '../../components/modalOrientations': mod(`export const ALL_ORIENTATIONS = [];`),
  '../../config/devMode': mod(`export const devBypass = () => false;`),
  '../dev/popupSuppressStore': mod(`export const useOverlaysSuppressed = () => false;`),
  './onboardingSampling': mod(`export const useSamplingActive = () => false;`),
  '../../theme/tokens': mod(`export const colors = {}; export const fonts = {};`),
  '../../components/DimModal': mod(`export const Modal = 'M';`),
  './screenIntros': mod(`export const INTRO_STORAGE_PREFIX = 'ape:intro:';
    export const SCREEN_INTROS = { commitment: { placeholder: false, title: 't', body: 'b' } };`),
};

const SRC_URL = new URL('../src/features/intro/ScreenIntroOverlay.tsx', import.meta.url).href;
const ATTRACT_URL = new URL('../src/features/onboarding/attractStore.ts', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === SRC_URL || context.parentURL === ATTRACT_URL || context.parentURL?.startsWith('data:')) {
      if (specifier in STUBS) return { url: STUBS[specifier], shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === SRC_URL) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { useScreenIntro } = (await import(SRC_URL)) as {
  useScreenIntro: (key: string, sessionOnly?: boolean, hold?: boolean) => { visible: boolean; dismiss: () => void };
};

const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
};

/** Mount the hook; `render(sessionOnly)` re-renders it with new props. */
function mount(initialSessionOnly: boolean) {
  rt.slots = [];
  rt.effects = [];
  rt.pending = [];
  let props = initialSessionOnly;
  let last = { visible: false, dismiss: () => {} };
  const render = () => {
    rt.i = 0;
    rt.e = 0;
    last = useScreenIntro('commitment', props);
    const run = rt.pending.splice(0);
    run.forEach((f) => f());
  };
  rt.rerender = render;
  render();
  return {
    get: () => last,
    setSessionOnly: (v: boolean) => {
      props = v;
      render();
    },
  };
}

describe('useScreenIntro: the stored seen flag decides, both ways', () => {
  it('[R2] a member who dismissed it for good: up on the anonymous first frame, DOWN once the tier lands', async () => {
    AS.set('ape:intro:commitment', '1'); // dismissed long ago, on this device
    const h = mount(true); // signed in a moment ago: entitlement still 'anonymous'
    await settle();
    assert.equal(h.get().visible, true, 'session-only branch: shown while the tier is unknown');
    h.setSessionOnly(false); // the tier landed: 'academy'
    await settle();
    assert.equal(h.get().visible, false, 'their stored "seen" takes it down');
  });

  it('a member who never dismissed it keeps it up (nothing retired by the flip)', async () => {
    AS.delete('ape:intro:commitment');
    const h = mount(true);
    await settle();
    h.setSessionOnly(false);
    await settle();
    assert.equal(h.get().visible, true);
  });

  it('a failed read on the stored-flag branch shows nothing', async () => {
    AS.delete('ape:intro:commitment');
    g.__HSE2_FAIL__ = true;
    try {
      const h = mount(false);
      await settle();
      assert.equal(h.get().visible, false);
    } finally {
      g.__HSE2_FAIL__ = false;
    }
  });

  it('a dismiss is never undone by a read that lands after it', async () => {
    AS.delete('ape:intro:commitment');
    const h = mount(true);
    await settle();
    h.setSessionOnly(false); // the read is now in flight…
    h.get().dismiss(); // …and the learner taps it away
    await settle();
    assert.equal(h.get().visible, false);
    assert.equal(AS.get('ape:intro:commitment'), '1', 'the dismiss on the persisted branch is stored');
  });
});

/**
 * attractStore (pass-1 fix, completed): a failed read writes nothing — and a
 * cue the learner retired IN that state is no longer dropped. Pass 1's
 * `if (!hydrated) return` in persist() discarded the mark, so Explore's ring
 * breathed again once storage answered.
 */
describe('attractStore: a mark made while the record is unreadable is kept, then laid on top', () => {
  it('[R2] Explore opened during a failed read stays opened once a read lands; the stored cues survive', async () => {
    const KEY = 'ape:homeAttract2';
    const STORED = { exploreDone: false, aboutDone: true, enrolledOnce: false, deckNextDone: true, firstSeenAt: 1_700_000_000_000 };
    AS.set(KEY, JSON.stringify(STORED));
    g.__HSE2_FAIL__ = true;
    const attract = (await import(ATTRACT_URL)) as typeof import('../src/features/onboarding/attractStore.ts');
    attract.markExploreOpened();
    await settle();
    assert.deepEqual(JSON.parse(AS.get(KEY) as string), STORED, 'nothing written over an unread record');
    g.__HSE2_FAIL__ = false;
    attract.noteHomeSeen(); // the next Home view reads again
    await settle();
    const saved = JSON.parse(AS.get(KEY) as string);
    assert.equal(saved.exploreDone, true, 'the Explore mark was kept and applied');
    assert.deepEqual({ ...saved, exploreDone: false }, STORED, 'every other stored cue intact');
  });
});
