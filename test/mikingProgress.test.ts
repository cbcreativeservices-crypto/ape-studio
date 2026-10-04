/**
 * Miking Labs progress (blueprint §8.1, §11 mikingProgress), with an
 * in-memory AsyncStorage (the drumTuningLab.test.ts approach):
 *
 *   • credit only grows; a practice run clears answers / interactives / the
 *     place and KEEPS `done` (owner 2026-09-29);
 *   • a members-only PREVIEW writes and holds nothing;
 *   • a blocked (guest / unknown) session holds its work for the sign-in
 *     hand-off and shows it this session; the hand-off MERGES (union);
 *   • a failed read → unreadable, and nothing is written over the disk copy;
 *   • a damaged blob is set aside and the store starts clean;
 *   • the pure merge: union of done/interactive, first answer wins;
 *   • observation sheets: capped at 24 per lesson, oldest dropped.
 *   • the page credit rule (pageComplete): checks + interactive; Sources has
 *     no requirement and never banks on its own.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const memory = new Map<string, string>();
let failReads = false;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-miking-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-miking-storage') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const g = globalThis; export default { getItem: async (k) => { if (g.__mkFail) throw new Error('read failed'); return g.__mkStore.has(k) ? g.__mkStore.get(k) : null; }, setItem: async (k, v) => { g.__mkStore.set(k, v); }, removeItem: async (k) => { g.__mkStore.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});
const G = globalThis as unknown as { __mkStore: Map<string, string>; __mkFail: boolean };
G.__mkStore = memory;
Object.defineProperty(globalThis, '__mkFail', { get: () => failReads, configurable: true });

const P = await import('../src/screens/lab/miking/engine/progress/mikingProgress.ts');
const O = await import('../src/screens/lab/miking/engine/progress/observations.ts');
const preview = await import('../src/features/lab/labPreviewStore.ts');
const carry = await import('../src/features/lab/sessionCarry.ts');
const credit = await import('../src/screens/lab/miking/engine/progress/credit.ts');
const { M01_LESSON } = await import('../src/screens/lab/miking/lessons/m01Kick/lesson.ts');

const L = 'M01';
async function fresh(stored?: unknown) {
  memory.clear();
  if (stored !== undefined) memory.set(P.MIKING_KEY, typeof stored === 'string' ? stored : JSON.stringify(stored));
  failReads = false;
  preview.endLabPreview();
  carry.__resetSessionCarryForTests();
  P.setMikingSaveBlocked(false);
  P.resetMikingLocal();
  await P.hydrateMiking();
}
const disk = () => JSON.parse(memory.get(P.MIKING_KEY) ?? '{}');

describe('credit only grows', () => {
  beforeEach(() => fresh());
  it('banking writes `done`; a practice run keeps it and clears the rest', async () => {
    assert.equal(await P.bankPage(L, 'instrument'), true);
    await P.recordAnswer(L, 'k.inst.1', true);
    await P.recordInteractive(L, 'regions');
    await P.recordPlace(L, 'placement', 2);
    let lp = P.lessonProgress(P.getMikingProgress(), L);
    assert.deepEqual(lp.done, ['instrument']);
    assert.equal(lp.lastPage, 'placement');
    await P.clearMikingPracticeRun(L);
    lp = P.lessonProgress(P.getMikingProgress(), L);
    assert.deepEqual(lp.done, ['instrument'], 'credit kept');
    assert.deepEqual(lp.answers, {});
    assert.deepEqual(lp.interactive, []);
    assert.equal(lp.lastPage, undefined);
    assert.deepEqual(disk().lessons.M01.done, ['instrument'], 'on disk too');
  });
  it('banking twice never duplicates; the first recorded answer wins', async () => {
    await P.bankPage(L, 'sources');
    await P.bankPage(L, 'sources');
    await P.recordAnswer(L, 'k.mic.1', false);
    await P.recordAnswer(L, 'k.mic.1', true);
    const lp = P.lessonProgress(P.getMikingProgress(), L);
    assert.deepEqual(lp.done, ['sources']);
    assert.equal(lp.answers['k.mic.1'], false);
  });
});

describe('who is written', () => {
  beforeEach(() => fresh());
  it('a members-only PREVIEW earns nothing: no write, nothing held', async () => {
    preview.startLabPreview('MikingLesson', 'Miking Labs');
    assert.equal(await P.bankPage(L, 'instrument'), false);
    assert.equal(memory.has(P.MIKING_KEY), false);
    assert.equal(carry.peekSessionWork('miking'), undefined);
    assert.deepEqual(P.lessonProgress(P.getMikingProgress(), L).done, []);
    preview.endLabPreview();
  });
  it('a blocked (guest) session writes nothing, holds the work, shows it, and the sign-in hand-off merges it', async () => {
    await fresh({ v: 1, lessons: { M01: { done: ['sources'], answers: { 'k.mic.1': true }, interactive: [] } } });
    carry.noteSessionIdentity(''); // a guest launch
    await carry.settleSessionCarry(); // one settle per auth event, in order
    P.setMikingSaveBlocked(true);
    assert.equal(await P.bankPage(L, 'instrument'), false);
    await P.recordAnswer(L, 'k.mic.1', false);
    assert.deepEqual(disk().lessons.M01.done, ['sources'], 'nothing written');
    const shown = P.lessonProgress(P.getMikingProgress(), L);
    assert.deepEqual([...shown.done].sort(), ['instrument', 'sources'], 'shown this session over the stored record');
    assert.equal(shown.answers['k.mic.1'], true, 'the stored (first) answer still wins');
    // Sign in → the ledger writes what was held, merged.
    carry.noteSessionIdentity('u1');
    await carry.settleSessionCarry();
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual([...disk().lessons.M01.done].sort(), ['instrument', 'sources']);
    assert.equal(disk().lessons.M01.answers['k.mic.1'], true);
  });
});

describe('a failed read is UNREADABLE, never overwritten', () => {
  it('nothing is written over the disk copy until a read succeeds', async () => {
    await fresh();
    memory.set(P.MIKING_KEY, JSON.stringify({ v: 1, lessons: { M01: { done: ['practice'], answers: {}, interactive: [] } } }));
    P.resetMikingLocal();
    failReads = true;
    await P.hydrateMiking();
    assert.equal(P.isMikingUnreadable(), true);
    void P.bankPage(L, 'instrument');
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(JSON.parse(memory.get(P.MIKING_KEY)!).lessons.M01.done, ['practice'], 'the stored record survived');
    failReads = false;
  });
  it('a damaged blob is set aside and the store starts clean (writes allowed)', async () => {
    await fresh('{not json');
    assert.equal(P.isMikingUnreadable(), false);
    assert.equal(await P.bankPage(L, 'twoMic'), true);
    assert.deepEqual(disk().lessons.M01.done, ['twoMic']);
  });
});

describe('pure pieces', () => {
  it('sanitize drops bad fields and keeps good ones', () => {
    const s = P.sanitizeMiking({ lessons: { M01: { done: ['instrument', 'bogus', 7], answers: { a: true, b: 'x' }, interactive: ['regions', ''], lastPage: 'nope', lastStep: 99 } } });
    assert.deepEqual(s.lessons.M01, { done: ['instrument'], answers: { a: true }, interactive: ['regions'] });
  });
  it('merge: union of done and interactive, the stored answer wins, the held place wins', () => {
    const stored = { v: 1 as const, lessons: { M01: { done: ['sources' as const], answers: { x: true }, interactive: ['a'], lastPage: 'instrument' as const, lastStep: 0 } } };
    const held = { v: 1 as const, lessons: { M01: { done: ['twoMic' as const], answers: { x: false, y: true }, interactive: ['b'], lastPage: 'placement' as const, lastStep: 1 } } };
    const m = P.mergeMiking(stored, held).lessons.M01;
    assert.deepEqual([...m.done].sort(), ['sources', 'twoMic']);
    assert.deepEqual(m.answers, { x: true, y: true });
    assert.deepEqual([...m.interactive].sort(), ['a', 'b']);
    assert.equal(m.lastPage, 'placement');
  });
  it('observation sheets: at most 24 per lesson, oldest dropped, other lessons untouched', () => {
    let st = { v: 1 as const, sheets: [{ id: 'other', lessonId: 'M02', at: 0, fields: {} }] };
    for (let i = 0; i < 30; i++) st = O.withSheet(st, { id: `s${i}`, lessonId: L, at: i + 1, fields: { notes: `n${i}` } });
    const mine = st.sheets.filter((s) => s.lessonId === L);
    assert.equal(mine.length, O.OBS_CAP);
    assert.equal(mine[0].id, 's6', 'the oldest six dropped');
    assert.ok(st.sheets.some((s) => s.id === 'other'));
  });
});

describe('the page credit rule', () => {
  it('checks AND the interactive; a retry-free first answer is not needed, an answer is', () => {
    const none = new Set<string>();
    assert.equal(credit.pageComplete(M01_LESSON, 'instrument', {}, none), false);
    assert.equal(credit.pageComplete(M01_LESSON, 'instrument', { 'k.inst.1': false }, none), false, 'the interactive is still owed');
    assert.equal(credit.pageComplete(M01_LESSON, 'instrument', { 'k.inst.1': false }, new Set(['regions'])), true, 'a first pick that was wrong still counts once the right one is reached');
    assert.equal(credit.pageComplete(M01_LESSON, 'microphone', { 'k.mic.1': true, 'k.mic.2': true }, none), false);
  });
  it('Sources has no requirement: it never banks on its own, only on NEXT / FINISH', () => {
    assert.equal(credit.pageComplete(M01_LESSON, 'sources', {}, new Set()), false);
    assert.equal(credit.banksOnNext(M01_LESSON, 'sources'), true);
    assert.equal(credit.banksOnNext(M01_LESSON, 'placement'), false);
  });
});
