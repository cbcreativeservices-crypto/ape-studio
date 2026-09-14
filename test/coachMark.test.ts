/**
 * useCoachMark — the self-retiring onboarding hint (src/lib/coachMark.ts).
 *
 * The rule these tests pin (Booth 2026-07-08, rev 07-09): a hint shows until
 * the user has COMPLETED the taught action on MAX_OPENS separate opens. The
 * persisted counter advances only at the moment the dismissAfter-th action
 * lands, and only ONCE per session — opening the screen and leaving early
 * makes no progress toward retirement. Get this wrong in either direction and
 * the hint is a nag (never retires) or a ghost (retires before it taught
 * anything). The dev bypass must show the hint without ever touching the real
 * counter, or a dev pass on a device silently retires hints for the owner.
 *
 * HARNESS: node:test has no React renderer, so `react` is replaced (via
 * node:module registerHooks) with a micro hook runtime — useState/useRef/
 * useEffect/useCallback with real re-render-on-setState semantics, enough to
 * run this one hook faithfully. AsyncStorage and the two suppression hooks
 * are stubbed the same way, each controllable from the tests.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// ── Module stubs ────────────────────────────────────────────────────────────

const STUBS: Record<string, string> = {
  'ape-test:react': `
    const R = () => globalThis.__apeReact;
    export function useState(init) {
      const inst = R().inst; const i = inst.cursor++;
      if (!(i in inst.slots)) inst.slots[i] = { v: typeof init === 'function' ? init() : init };
      const slot = inst.slots[i];
      const set = (nv) => {
        const next = typeof nv === 'function' ? nv(slot.v) : nv;
        if (!Object.is(next, slot.v)) { slot.v = next; inst.dirty = true; }
      };
      return [slot.v, set];
    }
    export function useRef(init) {
      const inst = R().inst; const i = inst.cursor++;
      if (!(i in inst.slots)) inst.slots[i] = { current: init };
      return inst.slots[i];
    }
    export function useEffect(fn, deps) {
      const inst = R().inst; const i = inst.cursor++;
      const prev = inst.slots[i];
      const changed = !prev || !deps || !prev.deps ||
        deps.length !== prev.deps.length || deps.some((d, k) => !Object.is(d, prev.deps[k]));
      inst.slots[i] = { deps, fn, cleanup: prev && prev.cleanup, effect: true };
      if (changed) inst.pendingEffects.push(i);
    }
    export function useCallback(fn) { return fn; }
    export default { useState, useRef, useEffect, useCallback };
  `,
  'ape-test:async-storage': `
    const mem = new Map();
    globalThis.__apeStorage = mem;
    const gate = () => { if (globalThis.__apeStorageFail) throw new Error('storage unreadable'); };
    export default {
      async getItem(k) { gate(); return mem.has(k) ? mem.get(k) : null; },
      async setItem(k, v) { gate(); mem.set(k, String(v)); },
      async removeItem(k) { mem.delete(k); },
      async getAllKeys() { return [...mem.keys()]; },
      async multiRemove(ks) { for (const k of ks) mem.delete(k); },
    };
  `,
  'ape-test:devMode': `
    export const DEV_BYPASS = {};
    export const devBypass = (flag) => !!(globalThis.__apeDevBypass && globalThis.__apeDevBypass[flag]);
    export const devModeActive = () => false;
  `,
  'ape-test:popupSuppress': `
    export const useOverlaysSuppressed = () => !!globalThis.__apeSuppressed;
  `,
  'ape-test:sampling': `
    export const useSamplingActive = () => !!globalThis.__apeSampling;
  `,
};

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react') return { url: 'ape-test:react', shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage')
      return { url: 'ape-test:async-storage', shortCircuit: true };
    if (specifier.endsWith('config/devMode')) return { url: 'ape-test:devMode', shortCircuit: true };
    if (specifier.endsWith('dev/popupSuppressStore'))
      return { url: 'ape-test:popupSuppress', shortCircuit: true };
    if (specifier.endsWith('intro/onboardingSampling'))
      return { url: 'ape-test:sampling', shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', shortCircuit: true, source: STUBS[url] };
    return next(url, context);
  },
});

const { useCoachMark, MAX_OPENS, COACH_KEYS, resetCoachMarks } = await import('../src/lib/coachMark.ts');

// ── Micro hook runtime driver ───────────────────────────────────────────────

type Slot = { v?: unknown; current?: unknown; deps?: unknown[]; fn?: () => unknown; effect?: boolean };
type Inst = {
  slots: Slot[];
  cursor: number;
  pendingEffects: number[];
  dirty: boolean;
  comp: () => { visible: boolean; registerAction: () => void };
  out: { visible: boolean; registerAction: () => void };
};

const G = ((globalThis as Record<string, unknown>).__apeReact = { inst: null as Inst | null });

function render(inst: Inst): void {
  for (let pass = 0; pass < 10; pass++) {
    G.inst = inst;
    inst.cursor = 0;
    inst.pendingEffects = [];
    inst.dirty = false;
    inst.out = inst.comp();
    for (const i of inst.pendingEffects) {
      const r = (inst.slots[i].fn as () => unknown)();
      if (typeof r === 'function') inst.slots[i] = { ...inst.slots[i], cleanup: r } as Slot;
    }
    if (!inst.dirty) return;
  }
  throw new Error('render did not settle in 10 passes');
}

function mount(comp: Inst['comp']): Inst {
  const inst: Inst = { slots: [], cursor: 0, pendingEffects: [], dirty: false, comp, out: null as never };
  render(inst);
  return inst;
}

/** Let the hook's async storage read land, then re-render if it set state. */
async function flush(inst: Inst): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 0));
    if (inst.dirty) render(inst);
  }
}

const mem = (): Map<string, string> => (globalThis as { __apeStorage?: Map<string, string> }).__apeStorage!;
const flags = globalThis as {
  __apeDevBypass?: Record<string, boolean>;
  __apeSuppressed?: boolean;
  __apeSampling?: boolean;
  __apeStorageFail?: boolean;
};

const KEY = 'ape:coach:test';

/** One screen open ("session"): fresh component instance, storage persists. */
async function open(dismissAfter = 2): Promise<{
  inst: Inst;
  visible: () => boolean;
  act: () => Promise<void>;
}> {
  const inst = mount(() => useCoachMark(KEY, dismissAfter));
  await flush(inst);
  return {
    inst,
    visible: () => inst.out.visible,
    act: async () => {
      inst.out.registerAction();
      if (inst.dirty) render(inst);
      await flush(inst); // let the fire-and-forget setItem land
    },
  };
}

function resetWorld(): void {
  mem().clear();
  flags.__apeDevBypass = {};
  flags.__apeSuppressed = false;
  flags.__apeSampling = false;
  flags.__apeStorageFail = false;
}

// ── Showing and qualifying ──────────────────────────────────────────────────

test('a never-seen hint shows on open', async () => {
  resetWorld();
  const s = await open();
  assert.equal(s.visible(), true);
  assert.equal(mem().has(KEY), false, 'merely showing writes nothing');
});

test('actions below dismissAfter neither hide the hint nor advance the counter', async () => {
  resetWorld();
  const s = await open(3);
  await s.act();
  await s.act();
  assert.equal(s.visible(), true, '2 of 3 actions — still teaching');
  assert.equal(mem().has(KEY), false, 'no qualifying open recorded yet');
});

test('the dismissAfter-th action hides the hint and records ONE qualifying open', async () => {
  resetWorld();
  const s = await open(2);
  await s.act();
  await s.act();
  assert.equal(s.visible(), false);
  assert.equal(mem().get(KEY), '1');
  // Extra completions in the SAME session must not double-count the open.
  await s.act();
  await s.act();
  assert.equal(mem().get(KEY), '1', 'once per session, no matter how many more actions');
});

test('leaving early makes no progress — the hint returns next open', async () => {
  resetWorld();
  mem().set(KEY, '2');
  const s = await open(3);
  await s.act(); // one action, then the user leaves
  assert.equal(mem().get(KEY), '2', 'a non-qualifying open is not counted');
  const next = await open(3);
  assert.equal(next.visible(), true, 'still showing on the next open');
});

// ── Retirement at MAX_OPENS ─────────────────────────────────────────────────

test('the hint retires permanently after MAX_OPENS qualifying opens', async () => {
  resetWorld();
  assert.equal(MAX_OPENS, 5, 'the retirement threshold is a ratified constant');
  for (let i = 0; i < MAX_OPENS; i++) {
    const s = await open(1);
    assert.equal(s.visible(), true, `open ${i + 1} of ${MAX_OPENS} still shows`);
    await s.act();
    assert.equal(mem().get(KEY), String(i + 1));
  }
  const retired = await open(1);
  assert.equal(retired.visible(), false, 'open 6: retired');
  await retired.act();
  assert.equal(mem().get(KEY), String(MAX_OPENS), 'actions on a retired hint change nothing');
});

test('a counter already past MAX_OPENS still reads as retired', async () => {
  resetWorld();
  mem().set(KEY, '12');
  const s = await open();
  assert.equal(s.visible(), false);
});

test('a corrupt counter value falls back to 0 and shows the hint again', async () => {
  // `Number(raw) || 0` — garbage cannot brick the hint into either state
  // permanently; it degrades to "never seen".
  resetWorld();
  mem().set(KEY, 'garbage');
  const s = await open(1);
  assert.equal(s.visible(), true);
  await s.act();
  assert.equal(mem().get(KEY), '1', 'recovery restarts the count from the corrupt value as 0');
});

test('unreadable storage treats the hint as retired rather than nagging forever', async () => {
  resetWorld();
  flags.__apeStorageFail = true;
  const s = await open();
  assert.equal(s.visible(), false);
});

// ── Dev bypass ──────────────────────────────────────────────────────────────

test('dev bypass shows a retired hint but NEVER advances the real counter', async () => {
  resetWorld();
  mem().set(KEY, String(MAX_OPENS)); // fully retired for a real user
  flags.__apeDevBypass = { alwaysShowIntros: true };
  const s = await open(1);
  assert.equal(s.visible(), true, 'bypass forces the first-time experience');
  await s.act();
  assert.equal(s.visible(), false, 'completing still dismisses for this session');
  assert.equal(mem().get(KEY), String(MAX_OPENS), 'the persisted counter is untouched');
});

test('dev bypass on a FRESH hint also leaves the counter untouched', async () => {
  resetWorld();
  flags.__apeDevBypass = { alwaysShowIntros: true };
  const s = await open(1);
  await s.act();
  assert.equal(mem().has(KEY), false, 'a dev pass must not retire hints for the owner');
});

// ── Suppression ─────────────────────────────────────────────────────────────

test('the dev kill-switch keeps the hint invisible and counts nothing', async () => {
  resetWorld();
  flags.__apeSuppressed = true;
  const s = await open(1);
  assert.equal(s.visible(), false);
  await s.act();
  assert.equal(mem().has(KEY), false, 'no phantom qualifying opens while suppressed');
});

test('suppression wins over the dev always-show bypass', async () => {
  resetWorld();
  flags.__apeSuppressed = true;
  flags.__apeDevBypass = { alwaysShowIntros: true };
  const s = await open(1);
  assert.equal(s.visible(), false);
});

test('the first-run sampler loop hushes coach marks the same way', async () => {
  resetWorld();
  flags.__apeSampling = true;
  const s = await open(1);
  assert.equal(s.visible(), false);
});

// ── The reset used by Settings ──────────────────────────────────────────────

test('resetCoachMarks clears exactly the registered coach keys', async () => {
  resetWorld();
  for (const k of Object.values(COACH_KEYS)) mem().set(k, '5');
  mem().set('ape:intro:glossary', 'seen'); // a neighbor namespace
  await resetCoachMarks();
  for (const k of Object.values(COACH_KEYS)) {
    assert.equal(mem().has(k), false, `${k} not cleared`);
  }
  assert.equal(mem().get('ape:intro:glossary'), 'seen', 'other namespaces untouched');
});
