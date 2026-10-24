/**
 * ACCOUNT + COMMERCE — overnight toddler pass 2 (2026-10-24).
 *
 * 1. flaggedStore toggleTermList / toggleBookmark on an UNREADABLE store
 *    (assigned by the lead from the study agent's pass 1).
 *    After a read that FAILED, `get()` is the empty stand-in, so the toggle's
 *    intent was always ADD (even for a term already on the saved list), the
 *    edit was only queued behind a read that kept failing, nothing told the
 *    user, and the Glossary row flashed it as done. A toggle now refuses
 *    (answers null, changes nothing, queues nothing), retries the read, and
 *    raises the shared "couldn't be saved" notice.
 *
 * Driven for real on a fake AsyncStorage whose reads can be made to THROW.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__N2_AS__ = AS;
g.__N2_FAIL_READS__ = false;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__N2_AS__;
     export default {
       async getItem(k) {
         if (globalThis.__N2_FAIL_READS__) throw new Error('storage read failed');
         return s.has(k) ? s.get(k) : null;
       },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiGet(keys) { return keys.map((k) => [k, s.has(k) ? s.get(k) : null]); },
     };`,
  );
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: null } }; } },
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads in this test'); },
  };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const flags = await import('../src/features/flags/flaggedStore.ts');
const notice = await import('../src/features/storage/saveFailureNotice.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function fresh() {
  AS.clear();
  g.__N2_FAIL_READS__ = false;
  flags.resetLocal();
  notice.__resetSaveFailureNoticeForTests();
}
const json = (k: string) => JSON.parse(AS.get(k) ?? 'null');

test('term list: a toggle while the stored list is UNREADABLE is refused and told, never a false ADD', async () => {
  fresh();
  AS.set('ape:notifyTerms', JSON.stringify(['saved-term']));
  const shown: string[] = [];
  notice.setSaveFailurePresenter((title) => shown.push(title));
  g.__N2_FAIL_READS__ = true;
  flags.getTermList('starred');
  await settle();
  assert.equal(flags.getTermList('starred').size, 0, 'precondition: unreadable shows the empty stand-in');
  assert.equal(flags.toggleTermList('starred', 'saved-term'), null, 'the tap is refused, not answered as ADD');
  assert.equal(flags.getTermList('starred').has('saved-term'), false, 'nothing queued on the stand-in');
  await settle();
  assert.equal(shown.length, 1, 'the user is told the change was not kept');
  // The read recovers: the saved list is intact and no ghost edit lands on it.
  g.__N2_FAIL_READS__ = false;
  flags.getTermList('starred');
  await flags.readTermList('starred');
  await settle();
  assert.deepEqual([...flags.getTermList('starred')], ['saved-term']);
  assert.deepEqual(json('ape:notifyTerms'), ['saved-term']);
  // Readable again: a toggle works normally.
  assert.equal(flags.toggleTermList('starred', 'saved-term'), false, 'readable: the tap removes');
  await settle();
  assert.deepEqual(json('ape:notifyTerms'), []);
});

test('bookmarks: a toggle while the context is UNREADABLE is refused and told', async () => {
  fresh();
  AS.set('ape:bm:glossary', JSON.stringify(['b1']));
  const shown: string[] = [];
  notice.setSaveFailurePresenter((title) => shown.push(title));
  g.__N2_FAIL_READS__ = true;
  flags.getBookmarks('glossary');
  await settle();
  assert.equal(flags.toggleBookmark('glossary', 'b1'), null, 'refused while unreadable');
  assert.equal(flags.isBookmarked('glossary', 'b1'), false, 'no edit queued on the stand-in');
  await settle();
  assert.equal(shown.length, 1);
  assert.deepEqual(json('ape:bm:glossary'), ['b1'], 'the saved bookmarks are untouched');
  // A second tap retries the read: once storage answers, it lands on the saved copy.
  g.__N2_FAIL_READS__ = false;
  assert.equal(flags.toggleBookmark('glossary', 'b2'), null, 'still unreadable at the tap — refused, and the read retried');
  await settle();
  assert.deepEqual([...flags.getBookmarks('glossary')], ['b1'], 'the retried read landed the saved copy');
  assert.equal(flags.toggleBookmark('glossary', 'b2'), true);
  await settle();
  assert.deepEqual(json('ape:bm:glossary'), ['b1', 'b2']);
});

test('term list: a toggle BEFORE the first read lands still queues its intent (P2 unchanged)', async () => {
  fresh();
  AS.set('ape:heartTerms', JSON.stringify(['t1']));
  assert.equal(flags.toggleTermList('heart', 't2'), true);
  await settle();
  assert.deepEqual((json('ape:heartTerms') as string[]).sort(), ['t1', 't2']);
});

test('Glossary flashes the list acknowledgement only when the toggle was not refused (lead, night pass 2)', () => {
  const g = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.match(g, /if \(toggleFav\(item\.id\) !== null\) ackList\('fav'\);/);
  assert.match(g, /if \(toggleTermList\('starred', item\.id\) !== null\) ackList\('custom'\);/);
  assert.doesNotMatch(g, /toggleTermList\('starred', item\.id\);\n\s+ackList/);
});
