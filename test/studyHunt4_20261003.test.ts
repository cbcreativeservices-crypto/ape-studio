/**
 * STUDY area, toddler hunt 4 (2026-10-03).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed file
 * was copied aside, the old one restored, this file run, the fix put back).
 *
 *   1. study/sync.ts — StudySession.flushOnce's LAST-CHANCE enqueue (the send
 *      failed AND the write-ahead had already failed, i.e. a full disk while
 *      offline) was unguarded. It threw out of the catch, so `flush()`
 *      REJECTED: every caller is a bare `void this.flush()` / `void s.stop()`
 *      (an unhandled rejection), a caller waiting on `inflight` re-threw and
 *      skipped its own pass — the exact hazard the replay guard above it was
 *      written to stop — and the learner's lost study events were never
 *      reported. Now it is caught, flush/stop resolve, and the loss raises
 *      the shared failed-save notice (owner ruling 2026-10-03).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const SYNC_URL = new URL('../src/features/study/sync.ts', import.meta.url).href;
const mod = (body: string) => `data:text/javascript,${encodeURIComponent(body)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'expo-crypto') {
      return { url: mod('let n=0; export function randomUUID(){ return "b" + (++n); }'), shortCircuit: true };
    }
    if (specifier === 'react-native') {
      return {
        url: mod('export const AppState = { currentState: "active", addEventListener(){ return { remove(){} }; } };'),
        shortCircuit: true,
      };
    }
    if (specifier.endsWith('/lib/supabase')) {
      return {
        url: mod('export const supabase = { rpc: async () => { throw new Error("Network request failed"); } };'),
        shortCircuit: true,
      };
    }
    if (specifier === './studyQueueStorage') {
      return {
        url: mod(
          'export function insertQueuedBatch(){ globalThis.__inserts = (globalThis.__inserts||0)+1; throw new Error("database or disk is full"); }' +
            'export function getQueuedBatches(){ return []; }' +
            'export function deleteQueuedBatches(){}',
        ),
        shortCircuit: true,
      };
    }
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  // sync.ts uses constructor parameter properties, which node's type
  // stripping refuses — transpile that one file.
  load(url, context, nextLoad) {
    if (url === SYNC_URL) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
g.__FAKE_ASYNC_STORAGE__ = new Map<string, string>();

const notice = await import('../src/features/storage/saveFailureNotice.ts');
const { StudySession } = await import(SYNC_URL);

test('1. full disk + offline: flush and stop resolve, and the lost batch is reported', async () => {
  const shown: string[] = [];
  notice.__resetSaveFailureNoticeForTests();
  notice.setSaveFailurePresenter((title) => shown.push(title));

  const s = new StudySession('ach-1', 'flashcards', () => {});
  s.addEvent({ item: 'i1', kind: 'view' });
  // Before the fix this rejected with "database or disk is full".
  await s.flush();
  assert.equal(g.__inserts, 2, 'write-ahead and last-chance enqueue were both tried');
  assert.deepEqual(shown, [notice.SAVE_FAILURE_TITLE], 'the learner is told the work was not kept');

  s.addEvent({ item: 'i2', kind: 'view' });
  await s.stop(); // the screen's unmount: `void s.stop()` must never reject
  notice.setSaveFailurePresenter(null);
});

/*
 * 2. courses/StudyAreaExplore — ENROLL on a credential raised "Your choices
 *    won't be saved without an account" (+ the membership line) on
 *    `resolved && entitlement === 'anonymous'`. `resolved` flips even when the
 *    read FAILED, and a signed-in member with no cached tier then reads
 *    'anonymous': a paying member was told they have no account and shown
 *    membership copy. Identity assertions wait for `tierKnown` (tier.ts; final
 *    round A; owner ruling 2026-10-03 tierReadFailed). A real guest is known.
 */
test('2. StudyAreaExplore: the no-account prompt waits for a tier a read produced', () => {
  const src = readFileSync(new URL('../src/screens/courses/StudyAreaExplore.tsx', import.meta.url), 'utf8');
  const raises = src.split('\n').filter((l) => /setPayPrompt\(\{/.test(l));
  assert.ok(raises.length >= 1, 'the prompt is still raised for a guest');
  for (const l of raises) {
    assert.match(l, /tierKnown && entitlement === 'anonymous'/, `gated on tierKnown: ${l.trim()}`);
    assert.doesNotMatch(l, /resolved && entitlement === 'anonymous'/, l.trim());
  }
});
