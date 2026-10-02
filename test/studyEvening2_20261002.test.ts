/**
 * STUDY area, evening toddler hunt pass 2 (2026-10-02).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed file
 * was copied aside, the old one restored, this file run, the fix put back).
 *
 *   1. assess/attemptDraft — a quiz / final exam whose opening draft read
 *      FAILED starts blind; the submit re-reads the draft only while
 *      isAttemptDraftUnreadable() says so. The first later save that could
 *      read the stored draft merged onto it AND cleared that flag, so the
 *      submit skipped its re-read and the graded paper went without every
 *      answer given before the hiccup (they sat in the stored draft, unread).
 *   2. study/paceRecords + PaceTimerModal — getPaceRecords answered `{}` for
 *      a read that FAILED, and the popup then told a learner with logged runs
 *      "No timed runs yet" (also while the read was still in flight). The
 *      modal imports React Native, so its half is pinned by source.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__SE2_AS__ = AS;
g.__SE2_FAIL_READS__ = false;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__SE2_AS__;
     export default {
       async getItem(k) {
         if (globalThis.__SE2_FAIL_READS__) throw new Error('storage read failed');
         return s.has(k) ? s.get(k) : null;
       },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiGet(keys) { return keys.map((k) => [k, s.has(k) ? s.get(k) : null]); },
       async multiRemove(keys) { for (const k of keys) s.delete(k); },
     };`,
  );

const SUPABASE =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    async rpc(name, args) {
      const h = globalThis.__SE2_RPC__;
      if (!h) return { data: null, error: { message: 'no handler' } };
      return h(name, args);
    },
  };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const draft = await import('../src/features/assess/attemptDraft.ts');
const pace = await import('../src/features/study/paceRecords.ts');
const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

function fresh(): void {
  AS.clear();
  g.__SE2_FAIL_READS__ = false;
}

// ── 1. attemptDraft: the submit's re-read survives a merged save ───────────

test('attempt draft: a merged save does not cancel the submit re-read of a screen that started blind', async () => {
  fresh();
  const id = 'att-blind';
  const k = `ape:attemptDraft:${id}`;
  // Questions 1-3 answered in an earlier sitting (crash, relaunch).
  AS.set(k, JSON.stringify({ answers: { '0': 'a', '1': 'b', '2': 'c' }, qIdx: 3 }));
  // The opening read fails: the screen starts from question one, answers {}.
  g.__SE2_FAIL_READS__ = true;
  assert.equal(await draft.loadAttemptDraft(id), null);
  g.__SE2_FAIL_READS__ = false;
  // Storage is back; the learner answers question 4 — the save merges.
  const screenAnswers: Record<string, unknown> = { '3': 'd' };
  assert.equal(await draft.saveAttemptDraft(id, { answers: screenAnswers, qIdx: 4 }), true);
  // The submit (QuizScreen / FinalExamScreen doSubmit) re-reads ONLY while
  // this says so. It must still say so: the screen's answers lack 0-2.
  assert.equal(draft.isAttemptDraftUnreadable(id), true, 'the submit would skip its re-read and send 1 of 4 answers');
  const stored = await draft.loadAttemptDraft(id);
  const sent = { ...(stored?.answers ?? {}), ...screenAnswers };
  assert.deepEqual(sent, { '0': 'a', '1': 'b', '2': 'c', '3': 'd' });
  assert.equal(draft.isAttemptDraftUnreadable(id), false, 'a load that succeeds clears it');
});

test('attempt draft: the clear resets the started-blind flag too', async () => {
  fresh();
  const id = 'att-clear';
  g.__SE2_FAIL_READS__ = true;
  await draft.loadAttemptDraft(id);
  g.__SE2_FAIL_READS__ = false;
  assert.equal(draft.isAttemptDraftUnreadable(id), true);
  await draft.clearAttemptDraft(id);
  assert.equal(draft.isAttemptDraftUnreadable(id), false);
});

// ── 2. pace records: a failed read is not "no timed runs" ──────────────────

test('pace records: a read that FAILED answers null, never the empty record', async () => {
  g.__SE2_RPC__ = () => ({ data: null, error: { message: 'network request failed' } });
  assert.equal(await pace.getPaceRecords(), null, 'a failed read came back as {} — "No timed runs yet"');
  g.__SE2_RPC__ = () => {
    throw new Error('fetch failed');
  };
  assert.equal(await pace.getPaceRecords(), null);
  // A read that answered, with nothing on record, is still the empty record.
  g.__SE2_RPC__ = () => ({ data: null, error: null });
  assert.deepEqual(await pace.getPaceRecords(), {});
  const rec = { best_seconds: 90, avg_seconds: 100, sessions: 3, last_seconds: 95 };
  g.__SE2_RPC__ = () => ({ data: { matching: rec }, error: null });
  assert.deepEqual(await pace.getPaceRecords(), { matching: rec });
  g.__SE2_RPC__ = null;
});

test('pace timer popup: "No timed runs yet" only from a read that answered', () => {
  const s = src('features/study/PaceTimerModal.tsx');
  assert.match(s, /if \(all == null\) \{\s*setRecordRead\('failed'\);/);
  assert.match(s, /recordRead === 'ok'\s*\?\s*encouragingRecord\(record\)/);
  assert.match(s, /'Your times could not be loaded right now\.'/);
});
