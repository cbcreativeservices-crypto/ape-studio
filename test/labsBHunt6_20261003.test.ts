/**
 * LABS B — hunt 6 (2026-10-03) receipts.
 *
 * Drum Tuning + Mastering progress: a change made while the stored copy
 * could NOT BE READ (AsyncStorage.getItem threw) is never written — right,
 * an unread copy must not be written over — but it was not queued either,
 * and nothing said so: the screen showed the answer / the chapter's credit
 * banked, and it was gone next visit. The learner is now told through the
 * shared failed-save notice. A pure re-read (nothing changed) stays quiet,
 * and so does Mastering's first-load carry while the screen will retry it.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__LBH6_AS__ = AS;
g.__LBH6_READ_FAIL__ = false;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__LBH6_AS__;
     export default {
       async getItem(k) { if (globalThis.__LBH6_READ_FAIL__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
       async multiGet(ks) { if (globalThis.__LBH6_READ_FAIL__) throw new Error('read failed'); return ks.map((k) => [k, s.has(k) ? s.get(k) : null]); },
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
    if (specifier.endsWith('.json')) return { ...nextResolve(specifier, context), importAttributes: { type: 'json' } };
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
const drum = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const mastering = await import('../src/screens/lab/mastering/masteringProgress.ts');

let shown = 0;
function fresh(readFails: boolean) {
  AS.clear();
  g.__LBH6_READ_FAIL__ = readFails;
  shown = 0;
  notice.__resetSaveFailureNoticeForTests(() => 1_000_000);
  notice.setSaveFailurePresenter(() => {
    shown++;
  });
  drum.setDrumSaveBlocked(false);
  mastering.setMasteringSaveBlocked(false);
}

describe('a change dropped because the stored copy could not be READ is said', () => {
  it('Drum Tuning: a banked chapter / an answer on an unreadable copy raises the notice', async () => {
    fresh(true);
    await drum.updateDrumProgress((s) => {
      s.modules.sound = { done: true, answers: { a: true } };
    });
    assert.equal(shown, 1, 'the credit was dropped without a word');
    assert.equal(AS.size, 0, 'an unread copy must still never be written over');
  });

  it('Drum Tuning: a pure re-read (the mount / FINISH load) says nothing', async () => {
    fresh(true);
    await drum.updateDrumProgress(() => {});
    assert.equal(shown, 0);
  });

  it('Drum Tuning: a tuning note says "not saved" on screen — one message, never two', async () => {
    fresh(true);
    const r = await drum.saveTuningNote({ id: 'n1', name: 'N', savedAt: 1, drums: [] });
    assert.equal(r.saved, false);
    assert.equal(shown, 0);
  });

  it('Drum Tuning: a readable copy raises nothing', async () => {
    fresh(false);
    await drum.updateDrumProgress((s) => {
      s.lastStep = 2;
    });
    assert.equal(shown, 0);
  });

  it('Mastering: an answer on an unreadable copy raises the notice; a re-read does not', async () => {
    fresh(true);
    await mastering.updateMasteringProgress(() => {});
    assert.equal(shown, 0, 'a pure re-read is not a lost change');
    await mastering.updateMasteringProgress((s) => {
      s.modules.what = { done: true, answers: { q1: true } };
    });
    assert.equal(shown, 1, 'the credit was dropped without a word');
    assert.equal(AS.size, 0, 'an unread copy must still never be written over');
  });

  it('Mastering: the first load’s carry stays quiet while the screen will retry it', async () => {
    fresh(true);
    await mastering.updateMasteringProgress((s) => {
      s.lastStep = 3;
    }, false);
    assert.equal(shown, 0);
    const src = readFileSync(new URL('../src/screens/lab/mastering/MasteringLabScreen.tsx', import.meta.url), 'utf8');
    assert.match(src, /if \(pre\) carryPreLoad\(s, pre\);\s*\}, readRetriesRef\.current >= 3\)/, 'only the last try of the first load reports');
  });
});
