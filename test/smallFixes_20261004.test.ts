/**
 * Owner-approved small fixes (2026-10-04). Receipts — each FAILS on HEAD
 * (d0449070 / 97b8e4ff).
 *
 * 1. REMOVALS APPLY AFTER THE ACCOUNT IS SETTLED (shared fix). A
 *    `holdSessionWork(…, { guestOnly: true })` refused EVERY update once the
 *    account was settled, removals included, so a delete or an untick done
 *    after the sign-in stayed in what the ledger held and the next flush
 *    wrote it back. Hunt 13 patched two stores with their own deleted-id
 *    sets; the Cymatics experiment unticks and the Production projects still
 *    had it. Now `releaseSessionWork` (removal-only) always applies; additions
 *    are still refused once settled; the wipe rules and epoch fences stand.
 *    The flush reads each key's value when its turn comes, and the writers
 *    merge what the ledger holds when they RUN — so the per-store sets are
 *    gone.
 * 2. FLASHCARDS `openTermFromList`: a failed fetch for an off-deck term closed
 *    the list and opened nothing, silently. Now told with the shared notice.
 * 3. TOPIC WELCOME HOLD: on the first-ever Flashcards visit the `flashcards`
 *    intro and the topic welcome were both due; iOS refuses the second root
 *    Modal, and the welcome (seen only on dismiss) came back later. The
 *    welcome now has `hold`, waits for the intro, and never presents during
 *    a dismiss (rootModalHoldMs).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, unknown>;

// ── stubs: AsyncStorage for the stores; a tiny hooks runtime for the sheets ──
const kvMap = new Map<string, string>();
g.__SF_KV__ = kvMap;
g.__DEV__ = false;
g.__SF_HOLD_MS__ = 0;

type Effect = { deps?: unknown[]; cleanup?: void | (() => void) };
const rt = {
  slots: [] as unknown[],
  effects: [] as Effect[],
  pending: [] as (() => void)[],
  i: 0,
  e: 0,
  rerender: () => {},
};
g.__SF_RT__ = rt;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const REACT = mod(`
  const rt = globalThis.__SF_RT__;
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
  export function useSyncExternalStore(_s, get) { return get(); }
  export default { useState, useRef, useCallback, useEffect };`);
const AS_STUB = `const m = globalThis.__SF_KV__; export default {
  getItem: async (k) => (m.has(k) ? m.get(k) : null),
  setItem: async (k, v) => { m.set(k, String(v)); },
  removeItem: async (k) => { m.delete(k); },
};`;
const SHEET_STUBS: Record<string, string> = {
  react: REACT,
  'react/jsx-runtime': mod(`export const jsx = (type, props) => ({ type, props }); export const jsxs = jsx; export const Fragment = 'F';`),
  'react-native': mod(`export const Pressable = 'P'; export const Text = 'T'; export const View = 'V'; export const ScrollView = 'S'; export const StyleSheet = { create: (s) => s };`),
  '@react-navigation/native': mod(`export const useIsFocused = () => true;`),
  '@react-native-async-storage/async-storage': mod(AS_STUB),
  '../../components/modalOrientations': mod(`export const ALL_ORIENTATIONS = [];`),
  '../../config/devMode': mod(`export const devBypass = () => false;`),
  '../dev/popupSuppressStore': mod(`export const useOverlaysSuppressed = () => false;`),
  './onboardingSampling': mod(`export const useSamplingActive = () => false;`),
  '../../theme/tokens': mod(`export const colors = {}; export const fonts = {};`),
  '../../components/DimModal': mod(`export const Modal = 'M'; export const rootModalHoldMs = () => globalThis.__SF_HOLD_MS__;`),
  './screenIntros': mod(`export const INTRO_STORAGE_PREFIX = 'ape:intro:';
    export const SCREEN_INTROS = { flashcards: { placeholder: false, title: 't', body: 'b' } };`),
  '../../lib/supabase': mod(`export const supabase = {
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { flashcard_welcome_title: 'Welcome', flashcard_welcome_body: 'Body' }, error: null }) }) }) }),
  };`),
  '../../lib/getSessionSafe': mod(`export const safeSessionResult = async (p) => ({ result: await p, timedOut: false });`),
};
const INTRO_URL = new URL('../src/features/intro/ScreenIntroOverlay.tsx', import.meta.url).href;
const WELCOME_URL = new URL('../src/features/intro/TopicWelcomeSheet.tsx', import.meta.url).href;
const SHEETS = new Set([INTRO_URL, WELCOME_URL]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL && (SHEETS.has(context.parentURL) || context.parentURL.startsWith('data:')) && specifier in SHEET_STUBS) {
      return { url: SHEET_STUBS[specifier], shortCircuit: true };
    }
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'sf-stub:async-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'sf-stub:async-storage') return { format: 'module', shortCircuit: true, source: AS_STUB };
    if (SHEETS.has(url)) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Comments out, so a receipt reads code only. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
};

type Carry = typeof import('../src/features/lab/sessionCarry.ts') & {
  releaseSessionWork?: <T>(key: string, update: (prev: T) => T) => boolean;
};
const carryMod = async () => (await import('../src/features/lab/sessionCarry.ts')) as Carry;
const release = (c: Carry) => {
  assert.equal(typeof c.releaseSessionWork, 'function', 'the ledger has a removal-only update');
  return c.releaseSessionWork!;
};

// ── 1. the ledger ────────────────────────────────────────────────────────────

describe('1 · the ledger: a removal applies after the account is settled; an addition does not', () => {
  it('a guestOnly hold carried, then a removal after the settle is let go of — and never written back', async () => {
    const c = await carryMod();
    const rel = release(c);
    c.__resetSessionCarryForTests();
    const writes: string[][] = [];
    c.registerSessionCarry<string[]>('sf:list', async (h) => {
      writes.push([...h]);
      return true;
    });
    c.noteSessionIdentity(''); // a guest launch
    await c.settleSessionCarry();
    assert.equal(c.holdSessionWork<string[]>('sf:list', (p) => [...(p ?? []), 'a', 'b'], { guestOnly: true }), true);
    c.noteSessionIdentity('uid-1'); // the sign-in
    await c.settleSessionCarry(); // the wipe finished: the carry lands
    assert.deepEqual(writes, [['a', 'b']]);
    // An ADDITION is still refused once the account is settled…
    assert.equal(c.holdSessionWork<string[]>('sf:list', (p) => [...(p ?? []), 'c'], { guestOnly: true }), false);
    // …a REMOVAL is not.
    assert.equal(rel<string[]>('sf:list', (p) => p.filter((x) => x !== 'a')), true);
    assert.deepEqual(c.peekSessionWork('sf:list'), ['b'], 'the deleted row is no longer held');
    await c.flushSessionWork();
    assert.equal(writes.length, 1, 'what is left already landed: nothing is rewritten');
    c.__resetSessionCarryForTests();
  });

  it('a removal before the carry landed (a failed write) is what the next flush writes', async () => {
    const c = await carryMod();
    const rel = release(c);
    c.__resetSessionCarryForTests();
    const writes: string[][] = [];
    let ok = false;
    c.registerSessionCarry<string[]>('sf:retry', async (h) => {
      writes.push([...h]);
      return ok;
    });
    c.noteSessionIdentity('');
    await c.settleSessionCarry();
    c.holdSessionWork<string[]>('sf:retry', (p) => [...(p ?? []), 'x', 'y'], { guestOnly: true });
    c.noteSessionIdentity('uid-2');
    await c.settleSessionCarry(); // the write fails
    assert.deepEqual(writes, [['x', 'y']]);
    ok = true;
    assert.equal(rel<string[]>('sf:retry', (p) => p.filter((v) => v !== 'x')), true);
    await c.flushSessionWork();
    assert.deepEqual(writes[writes.length - 1], ['y'], 'the re-run never brings back the removed row');
    c.__resetSessionCarryForTests();
  });

  it('nothing held: a removal starts nothing; after a sign-out nothing is held to let go of', async () => {
    const c = await carryMod();
    const rel = release(c);
    c.__resetSessionCarryForTests();
    c.noteSessionIdentity('uid-3');
    await c.settleSessionCarry();
    assert.equal(rel<string[]>('sf:none', (p) => p), false);
    assert.equal(c.peekSessionWork('sf:none'), undefined, 'a removal never creates a hold');
    // The wipe rule stands: a sign-out drops what was held.
    c.__resetSessionCarryForTests();
    c.noteSessionIdentity('');
    c.holdSessionWork<string[]>('sf:gone', (p) => [...(p ?? []), 'g'], { guestOnly: true });
    c.noteSessionIdentity('uid-4');
    c.noteSessionIdentity(''); // signed out again before anything settled
    assert.equal(c.peekSessionWork('sf:gone'), undefined);
    assert.equal(rel<string[]>('sf:gone', (p) => p), false);
    assert.equal(c.sessionCarryOpen(), false, 'work after the sign-out is still never carried');
    c.__resetSessionCarryForTests();
  });

  it('the flush reads each key when its turn comes: a removal made during an earlier writer is not written back', async () => {
    const c = await carryMod();
    const rel = release(c);
    c.__resetSessionCarryForTests();
    const seenB: string[][] = [];
    let unblock!: () => void;
    const gate = new Promise<void>((r) => (unblock = r));
    c.registerSessionCarry<string[]>('sf:first', async () => {
      await gate;
      return true;
    });
    c.registerSessionCarry<string[]>('sf:second', async (h) => {
      seenB.push([...h]);
      return true;
    });
    c.noteSessionIdentity('');
    await c.settleSessionCarry();
    c.holdSessionWork<string[]>('sf:first', () => ['1'], { guestOnly: true });
    c.holdSessionWork<string[]>('sf:second', () => ['keep', 'drop'], { guestOnly: true });
    c.noteSessionIdentity('uid-5');
    const flushing = c.settleSessionCarry(); // the first writer is waiting
    await settle();
    rel<string[]>('sf:second', (p) => p.filter((v) => v !== 'drop')); // deleted meanwhile
    unblock();
    await flushing;
    assert.ok(seenB.length >= 1);
    assert.deepEqual(seenB[0], ['keep'], 'the second writer saw the copy as it is NOW');
    c.__resetSessionCarryForTests();
  });
});

describe('1 · the stores: deletes and unticks after the sign-in stay deleted', () => {
  const plate = { studio: 'plate', hz: 440, amplitude: 0.3, view: 'particles', multi: 'off', sandCount: 3000, sandSize: 0.45, friction: 0.4 };

  it('Cymatics gallery: a delete after the settle reaches the ledger (no per-store deleted-id set)', async () => {
    const c = await carryMod();
    const store = await import('../src/features/cymatics/patternStore.ts');
    const { DEFAULT_PLATE } = await import('../src/features/cymatics/plateModes.ts');
    c.__resetSessionCarryForTests();
    c.noteSessionIdentity('');
    await c.settleSessionCarry();
    const guest = store.createPatternStore(store.memoryStore());
    const p = store.newPattern({ ...plate, spec: DEFAULT_PLATE } as never, 'SIMULATION', 'Guest plate');
    assert.equal(await guest.upsertPattern(p), true);
    const stale = c.peekSessionWork('cymatics:gallery') as never;
    c.noteSessionIdentity('uid-g');
    await c.settleSessionCarry();
    const account = store.createPatternStore(store.memoryStore());
    assert.equal(await account.carryIn(stale), true);
    assert.equal(await account.deletePattern(p.id), true);
    const held = c.peekSessionWork<{ patterns: { id: string }[] }>('cymatics:gallery');
    assert.deepEqual(held!.patterns.map((x) => x.id), [], 'let go of in the ledger');
    assert.equal(await account.carryIn(stale), true); // a writer queued with the older copy
    assert.deepEqual((await account.loadPatterns()).map((x) => x.id), [], 'and it stays deleted');
    assert.doesNotMatch(code(read('src/features/cymatics/patternStore.ts')), /deletedPatternIds|deletedArtworkIds/, 'the per-store workaround is gone');
    c.__resetSessionCarryForTests();
  });

  it('Room Design: a design deleted after the carry is let go of in the ledger', async () => {
    const c = await carryMod();
    const room = await import('../src/features/roomdesign/roomDesignStore.ts');
    const { defaultDesign } = await import('../src/screens/lab/roomdesign/roomModel.ts');
    const tick = async () => {
      for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
    };
    c.__resetSessionCarryForTests();
    kvMap.clear();
    room.resetLocal();
    c.noteSessionIdentity('');
    await c.settleSessionCarry();
    room.setRoomDesignSaveBlocked(true);
    assert.equal(room.holdRoomDesignForSession({ ...defaultDesign(), id: 'r1', name: 'Guest room' }), true);
    c.noteSessionIdentity('u-r');
    for (const k of [...kvMap.keys()]) if (k.startsWith('ape:')) kvMap.delete(k);
    room.resetLocal();
    await c.settleSessionCarry();
    await tick();
    room.setRoomDesignSaveBlocked(false);
    assert.equal(await room.deleteRoomDesign('r1'), true);
    assert.deepEqual((c.peekSessionWork<{ id: string }[]>('roomdesign') ?? []).map((d) => d.id), [], 'the ledger let go of it');
    assert.doesNotMatch(code(read('src/features/roomdesign/roomDesignStore.ts')), /deletedSinceCarry/, 'the per-store workaround is gone');
    c.__resetSessionCarryForTests();
  });

  it('Production: a project removed after the settle is let go of, and a stale carry does not restore it', async () => {
    const c = await carryMod();
    const store = await import('../src/features/production/projectStore.ts');
    c.__resetSessionCarryForTests();
    c.noteSessionIdentity('');
    await c.settleSessionCarry();
    const guest = store.createProjectStore(store.memoryStore());
    const a = store.newProject('preprod', 'live_event' as never, 'Guest plan');
    assert.equal(await guest.upsert(a), true);
    const stale = c.peekSessionWork('production:projects') as never;
    c.noteSessionIdentity('u-p');
    await c.settleSessionCarry();
    const account = store.createProjectStore(store.memoryStore()) as ReturnType<typeof store.createProjectStore> & { carryIn(h: unknown): Promise<boolean> };
    assert.equal(await account.carryIn(stale), true);
    assert.equal(await account.remove('preprod', a.id), true);
    const held = c.peekSessionWork<Record<string, { id: string }[]>>('production:projects');
    assert.deepEqual((held!.preprod ?? []).map((p) => p.id), [], 'let go of in the ledger');
    assert.equal(await account.carryIn(stale), true);
    assert.deepEqual((await account.load('preprod')).map((p) => p.id), [], 'the removed project stays removed');
    c.__resetSessionCarryForTests();
  });

  it('Cymatics experiment ticks: an untick is a removal; the writer merges what is held when it runs', () => {
    const s = code(read('src/screens/lab/cymatics/ExperimentWell.tsx'));
    const toggle = s.slice(s.indexOf('const toggle = (i: number) => {'), s.indexOf('const index = EXPERIMENTS.findIndex'));
    assert.match(toggle, /if \(on\) holdSessionWork<HeldTicks>\(CARRY_KEY, \(prev\) => withHeldTick\(prev, experiment\.id, i, on\), \{ guestOnly: true \}\);/);
    assert.match(toggle, /else releaseSessionWork<HeldTicks>\(CARRY_KEY, \(prev\) => withHeldTick\(prev, experiment\.id, i, false\)\);/);
    assert.match(s, /mergeHeldTicks\(all, peekSessionWork<HeldTicks>\(CARRY_KEY\) \?\? held\)/);
  });

  // A guard, not a behaviour change (passes on HEAD by design): the solved set
  // has no removal, so it needed nothing from the shared fix.
  it('Signal Detective has no removal path (solves only grow): untouched', () => {
    const s = code(read('src/screens/lab/meter/modules/modMeterC.tsx'));
    assert.doesNotMatch(s, /releaseSessionWork|solvedCache!?\.delete\(/);
  });
});

// ── 2. Flashcards: a failed off-deck term read is told ──────────────────────

describe('2 · Flashcards openTermFromList: a failed read is told, not silent', () => {
  const s = code(read('src/screens/study/FlashcardsScreen.tsx'));
  const fn = s.slice(s.indexOf('const openTermFromList = useCallback('), s.indexOf('const closeLinkedTerm = useCallback('));

  it('the fetch failure shows the shared notice (never a raw Alert), only for the newest tap', () => {
    assert.match(fn, /catch \{\s*failed = true;\s*\}/);
    assert.match(fn, /if \(req !== openTermReqRef\.current\) return;/, 'a superseded or closed request says nothing');
    assert.match(fn, /else notify\("Couldn't open that term", failed \? 'Check your connection and try again\.' : 'Please try again in a moment\.'\);/);
    assert.doesNotMatch(fn, /Alert\.alert/);
    assert.match(s, /import \{ confirmDialog, notify \} from '\.\.\/\.\.\/lib\/confirm';/);
  });

  it('leaving the screen cancels a fetch still in flight', () => {
    assert.match(s, /useEffect\(\s*\(\) => \(\) => \{\s*openTermReqRef\.current\+\+;\s*\},\s*\[\],\s*\);/);
  });
});

// ── 3. the topic welcome waits for the Flashcards intro ─────────────────────

type IntroApi = { visible: boolean; dismiss: () => void; owed?: boolean };
async function loadSheets() {
  const intro = (await import(INTRO_URL)) as { useScreenIntro: (k: string, s?: boolean, h?: boolean) => IntroApi };
  const welcome = (await import(WELCOME_URL)) as { TopicWelcomeSheet: (p: { topicId: string; enabled?: boolean; hold?: boolean }) => unknown };
  return { ...intro, ...welcome };
}
function mountHook<T>(renderOnce: () => T) {
  rt.slots = [];
  rt.effects = [];
  rt.pending = [];
  let last!: T;
  const render = () => {
    rt.i = 0;
    rt.e = 0;
    last = renderOnce();
    rt.pending.splice(0).forEach((f) => f());
  };
  rt.rerender = render;
  render();
  return { get: () => last, render };
}

describe('3 · TopicWelcomeSheet `hold`, and the Flashcards intro it waits for', () => {
  it('useScreenIntro reports `owed` until its flag answers, while due, and not after a dismiss', async () => {
    const { useScreenIntro } = await loadSheets();
    kvMap.delete('ape:intro:flashcards');
    const h = mountHook(() => useScreenIntro('flashcards'));
    assert.equal(h.get().owed, true, 'the stored flag has not answered yet');
    await settle();
    assert.equal(h.get().visible, true);
    assert.equal(h.get().owed, true);
    h.get().dismiss();
    assert.equal(h.get().owed, false);
    // Seen before: owed only until the read answers.
    kvMap.set('ape:intro:flashcards', '1');
    const h2 = mountHook(() => useScreenIntro('flashcards'));
    await settle();
    assert.equal(h2.get().visible, false);
    assert.equal(h2.get().owed, false);
  });

  it('the welcome is not presented while held, nor during the closing popup\'s dismiss; then it is', async () => {
    const { TopicWelcomeSheet } = await loadSheets();
    kvMap.clear();
    let hold = true;
    g.__SF_HOLD_MS__ = 0;
    const h = mountHook(() => TopicWelcomeSheet({ topicId: 't-1', hold }));
    await settle();
    await settle();
    assert.equal(h.get(), null, 'held: the intro is still up');
    // The intro is dismissed: its Modal is still animating away.
    hold = false;
    g.__SF_HOLD_MS__ = 40;
    h.render();
    assert.equal(h.get(), null, 'never presented during a dismiss');
    g.__SF_HOLD_MS__ = 0;
    await new Promise((r) => setTimeout(r, 60)); // the hold timer re-renders
    const shown = h.get() as { type?: unknown } | null;
    assert.ok(shown && shown.type === 'M', 'then it presents');
    // Once up, it stays up.
    hold = true;
    h.render();
    assert.ok(h.get(), 'a presented welcome is not pulled down by a later hold');
  });

  it('Flashcards owns the intro and holds the welcome on it', () => {
    const s = code(read('src/screens/study/FlashcardsScreen.tsx'));
    assert.match(s, /const flashIntro = useScreenIntro\('flashcards'\);/);
    assert.doesNotMatch(s, /<ScreenIntroOverlay introKey="flashcards"/);
    assert.match(s, /\{flashIntro\.visible \? <IntroSheet introKey="flashcards" onDismiss=\{flashIntro\.dismiss\} \/> : null\}/);
    assert.match(s, /<TopicWelcomeSheet\s+topicId=\{achievementId\}\s+enabled=\{!flaggedMode\}\s+hold=\{flashIntro\.owed \|\| [^}]*\}\s+onOwedChange=\{setWelcomeOwed\}\s*\/>/); // + the tutorial's wait (homeStartHereCard 2026-10-04)
  });
});
