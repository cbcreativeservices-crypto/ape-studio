/**
 * GUARD — STUDY area, full-app bug run 2 (2026-10-01 evening).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { describe, it, mock } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath } from 'node:url';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

// A guest session: the enrollment store's server sync returns before any call.
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: null } }; } },
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads in this test'); },
  };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier === './sync') {
      return { url: new URL('./_stub-sync.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 30; i++) await Promise.resolve();
};

describe('enrollmentStore: an edit before the stored list lands never overwrites it', () => {
  it('ENROLL tapped before hydrate keeps the stored topics AND the new one', async () => {
    store.set('ape:enrollmentList', JSON.stringify([
      { gs: 3060, favorite: false, active: true },
      { gs: 3970, favorite: false, active: true },
      { gs: 4100, favorite: true, active: true },
    ]));
    store.set('ape:enrollmentSeeded5', '1');
    const es = await import('../src/features/enrollment/enrollmentStore.ts');
    // The Awards / Explore ENROLL path: no useEnrollment mounted, nothing hydrated.
    es.addTopics([4200]);
    await flush();
    const gs = es.getEnrollment().map((e) => e.gs);
    assert.deepEqual(gs, [3060, 3970, 4100, 4200], 'the stored list was overwritten by the early tap');
    const saved = (JSON.parse(store.get('ape:enrollmentList')!) as { gs: number }[]).map((e) => e.gs);
    assert.deepEqual(saved, [3060, 3970, 4100, 4200], 'storage must hold the whole list, not the one tap');
    assert.equal(es.getEnrollment().find((e) => e.gs === 4100)?.favorite, true);
  });
});

describe('enrolledBundlesStore: the same race', () => {
  it('a bundle added before hydrate joins the stored bundles instead of replacing them', async () => {
    store.set('ape:enrolledBundles', JSON.stringify([
      { key: 'cert:A', kind: 'cert', name: 'A', topics: [1], loaded: true },
    ]));
    const bs = await import('../src/features/enrollment/enrolledBundlesStore.ts');
    bs.addBundle('program', 'B', [2, 3]);
    await flush();
    assert.deepEqual(bs.getBundles().map((b) => b.key), ['cert:A', 'program:B']);
    const saved = (JSON.parse(store.get('ape:enrolledBundles')!) as { key: string }[]).map((b) => b.key);
    assert.deepEqual(saved, ['cert:A', 'program:B']);
  });
});

describe('Final-exam queue: one failed read does not refuse writes for the rest of the session', () => {
  const src = read('features', 'finalExam', 'api.ts');
  it('no session-wide latch', () => {
    assert.doesNotMatch(src, /let queueReadable/);
    assert.doesNotMatch(src, /queueReadable = false/);
  });
  it('readQueue answers null for "could not read", and each writer refuses only that read', () => {
    assert.match(src, /async function readQueue\(\): Promise<QueuedExam\[\] \| null>/);
    const enq = src.slice(src.indexOf('export function enqueueExamSubmission'));
    assert.ok(enq.indexOf('if (rows == null)') > 0 && enq.indexOf('if (rows == null)') < enq.indexOf('writeQueue(next)'));
    assert.match(src, /const latest = await readQueue\(\);\s*if \(latest == null\) return false;/);
    assert.match(src, /if \(!rows \|\| rows\.length === 0\) return \[\];/);
  });
});

describe('Replayed quiz / exam submissions drop their answer draft', () => {
  it('final exam replay clears the draft on success and on a permanent drop', () => {
    const src = read('features', 'finalExam', 'api.ts');
    const body = src.slice(src.indexOf('async function replayExamSubmissionsLocked'));
    const ok = body.indexOf('await clearExamIntent(r.awardType, r.awardId);');
    assert.ok(ok > 0);
    assert.ok(body.indexOf('await clearAttemptDraft(r.attemptId);', ok) > ok);
    const drop = body.indexOf("dropping permanently rejected submission");
    assert.ok(body.indexOf('await clearAttemptDraft(r.attemptId);', drop) > drop);
  });
  it('quiz replay clears the draft on success and on a permanent drop', () => {
    const src = read('features', 'quiz', 'api.ts');
    const body = src.slice(src.indexOf('async function replayQuizSubmissionsOnce'));
    const ok = body.indexOf('await clearQuizIntent(r.achievement_id);');
    assert.ok(ok > 0);
    assert.ok(body.indexOf('await clearAttemptDraft(r.attempt_id);', ok) > ok);
    const drop = body.indexOf('dropping permanently rejected queued submission');
    assert.ok(body.indexOf('await clearAttemptDraft(r.attempt_id);', drop) > drop);
  });
});

describe('Credentials: a FAILED holder-name read never prints "Academy Member"', () => {
  it('the share row remembers the failure and SHARE QR refuses on it', () => {
    const src = read('features', 'credentials', 'CredentialShareRow.tsx');
    assert.doesNotMatch(src, /fetchMyRegistryName\(\)\.catch\(\(\) => null\)/);
    assert.match(src, /\(\) => \(\{ failed: true, name: null as string \| null \}\)/);
    assert.match(src, /setNameFailed\(nameRead\.failed\)/);
    const at = src.indexOf('const qr = useCallback(');
    const guard = src.indexOf('if (nameFailed)', at);
    const capture = src.indexOf('captureAndShare(', at);
    assert.ok(guard > at && guard < capture, 'the name-failure check must come before the capture');
  });
  it('exportCertificate lets a failed name read reach its catch (reason "failed")', () => {
    const src = read('features', 'credentials', 'certificatePdf.ts');
    assert.match(src, /await Promise\.all\(\[fetchMyRegistryName\(\), fetchMyQrTokenOrThrow\(\)\]\)/); // the QR read also refuses on failure (lead, 2026-10-02)
    const body = src.slice(src.indexOf('export async function exportCertificate'));
    assert.ok(body.indexOf('try {') < body.indexOf('fetchMyRegistryName()'));
    assert.match(body, /catch \{\s*return \{ ok: false, reason: 'failed' \};/);
    // …and profile/api really does reject on a failed read.
    const api = read('features', 'profile', 'api.ts');
    const fn = api.slice(api.indexOf('export async function fetchMyRegistryName'));
    assert.match(fn.slice(0, 300), /myUserRowOrThrow/);
  });
});

describe('Time Trial (run-1 correction): a guest is not told "saving…" for eight minutes', () => {
  it('a pass with no account settles at once as no_account, and the panel says so', async () => {
    mock.timers.enable({ apis: ['setInterval', 'Date'], now: 2_000_000 });
    try {
      const tt = await import('../src/features/study/timeTrial.ts');
      tt.startTimeTrial('flashcards', 'topic-g');
      for (let i = 0; i < tt.TIME_TRIAL_NEEDED; i++) tt.registerTrialAnswer('flashcards', true, 'topic-g');
      mock.timers.tick(tt.TIME_TRIAL_SECONDS * 1000 + 1000);
      await flush();
      let credit: unknown = 'none';
      const Probe = () => {
        credit = tt.useTimeTrial('flashcards', 'topic-g').result?.credit;
        return null;
      };
      renderToStaticMarkup(createElement(Probe));
      assert.equal(credit, 'no_account');
      tt.resetTimeTrials();
    } finally {
      mock.timers.reset();
    }
    const panel = read('features', 'study', 'PaceReadout.tsx');
    assert.match(panel, /trial\.result\.credit === 'no_account'/);
  });
});
