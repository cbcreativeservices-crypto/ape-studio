/**
 * SHARED, hunt 10 (2026-10-03).
 *
 * pagedProgress: a paged lab whose load could not READ re-reads before a
 * save. When that re-read fails too, the page the save carried was dropped
 * with no word (Amp, Ear and Tuning raise the shared notice in this case
 * since hunt 7). It now raises it — fenced by the account wipe, like every
 * other report in the file.
 *
 * R2: against HEAD's pagedProgress.ts the "raises the notice" test fails
 * (shown stays 0).
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__SH10_AS__ = AS;
g.__SH10_READ_FAIL__ = false;
g.__SH10_READ_HOLD__ = null;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__SH10_AS__;
     export default {
       async getItem(k) {
         const fail = globalThis.__SH10_READ_FAIL__;
         const h = globalThis.__SH10_READ_HOLD__; if (h) await h;
         if (fail) throw new Error('storage read failed');
         return s.has(k) ? s.get(k) : null;
       },
       async multiGet(ks) { return ks.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async getAllKeys() { return [...s.keys()]; },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async multiSet(rows) { for (const [k, v] of rows) s.set(k, v); },
       async multiRemove(ks) { for (const k of ks) s.delete(k); },
     };`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const notice = await import('../src/features/storage/saveFailureNotice.ts');
const { resetRegisteredLocalStores } = await import('../src/features/storage/localStoreRegistry.ts');
const paged = await import('../src/features/lab/pagedProgress.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
};

let shown = 0;
function fresh() {
  AS.clear();
  g.__SH10_READ_FAIL__ = false;
  g.__SH10_READ_HOLD__ = null;
  shown = 0;
  notice.__resetSaveFailureNoticeForTests(() => 1_000_000);
  notice.setSaveFailurePresenter(() => {
    shown++;
  });
}

describe('pagedProgress: a save dropped because the page record cannot be read is SAID', () => {
  it('load unreadable, re-read unreadable: nothing written, the shared notice raised', async () => {
    fresh();
    AS.set('ape:lab10:v1', JSON.stringify({ completed: [0, 1], lastPage: 1, done: false }));
    g.__SH10_READ_FAIL__ = true;
    await paged.loadPagedProgress('lab10');
    assert.equal(paged.isPagedProgressUnreadable('lab10'), true);
    await paged.savePagedProgress('lab10', { completed: [2], lastPage: 2, done: false });
    assert.equal(AS.get('ape:lab10:v1'), JSON.stringify({ completed: [0, 1], lastPage: 1, done: false }), 'the stored pages were written over');
    assert.equal(shown, 1, 'the page this save carried was dropped without a word');
  });

  it('the re-read succeeds: stored pages join, nothing is reported', async () => {
    fresh();
    AS.set('ape:lab10b:v1', JSON.stringify({ completed: [0], lastPage: 0, done: false }));
    g.__SH10_READ_FAIL__ = true;
    await paged.loadPagedProgress('lab10b');
    g.__SH10_READ_FAIL__ = false;
    await paged.savePagedProgress('lab10b', { completed: [3], lastPage: 3, done: false });
    assert.deepEqual(JSON.parse(AS.get('ape:lab10b:v1')!).completed, [0, 3]);
    assert.equal(shown, 0);
  });

  it('the account wipe lands mid re-read: the departing account’s dropped page is not reported', async () => {
    fresh();
    g.__SH10_READ_FAIL__ = true;
    await paged.loadPagedProgress('lab10c');
    let release!: () => void;
    g.__SH10_READ_HOLD__ = new Promise<void>((r) => (release = r));
    const p = paged.savePagedProgress('lab10c', { completed: [1], lastPage: 1, done: false });
    await settle();
    resetRegisteredLocalStores();
    release();
    await p;
    assert.equal(shown, 0);
  });
});
