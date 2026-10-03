/**
 * ACCOUNT + COMMERCE — hunt 7 (2026-10-03).
 *
 * 1. `amIVerifiedEmployer()` answered `false` both for "not a verified
 *    employer" and for a check that FAILED (an RPC error or a throw). Profile's
 *    EmployerSection reads the application and the verified check side by
 *    side; on a flaky connection the first landed and the second dropped, and
 *    a VERIFIED employer with an approved application was told "This
 *    application is no longer active." with a link to re-open it on the
 *    website — a failed read stated as fact. The check now answers null for a
 *    failed read (never anything that opens the chips), and the section says it
 *    could not check instead.
 *
 * Behaviour on a stubbed Supabase client for the API, source-reading for the
 * screen. R2: every test fails against the HEAD files.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const g = globalThis as Record<string, unknown>;
g.__DEV__ = false;
g.__AH7_RPC__ = null;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const STUBS: Record<string, string> = {
  'lib/supabase': mod(`export const supabase = {
    auth: { async getSession() { return { data: { session: { user: { id: 'u' } } } }; } },
    async rpc(name) { return globalThis.__AH7_RPC__(name); },
  };`),
  'lib/getSessionSafe': mod(`export async function hasSafeSession() { return true; }`),
  'lib/boundedCall': mod(`export async function withDeadline(fn) { return await fn(); }`),
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes('features/employer/')) {
      for (const [tail, url] of Object.entries(STUBS)) {
        if (specifier.endsWith('/' + tail)) return { url, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const api = (await import('../src/features/employer/api.ts')) as typeof import('../src/features/employer/api');

test('employer: a FAILED verified-employer check is null, never a "not verified" false', async () => {
  g.__AH7_RPC__ = () => ({ data: null, error: { message: 'Failed to fetch' } });
  assert.equal(await api.amIVerifiedEmployer(), null);
  g.__AH7_RPC__ = () => {
    throw new Error('network down');
  };
  assert.equal(await api.amIVerifiedEmployer(), null);
  // Real answers are unchanged.
  g.__AH7_RPC__ = () => ({ data: true, error: null });
  assert.equal(await api.amIVerifiedEmployer(), true);
  g.__AH7_RPC__ = () => ({ data: false, error: null });
  assert.equal(await api.amIVerifiedEmployer(), false);
});

test('employer section: a failed check never reads "no longer active", and never opens the chips', () => {
  const s = read('src/screens/profile/EmployerSection.tsx');
  // Only a definite `true` counts as verified (the chips stay closed on null).
  assert.match(s, /setVerified\(isVerified === true\);/);
  assert.match(s, /setVerifyFailed\(isVerified === null\);/);
  // The "no longer active" claim sits behind the failed-check branch.
  assert.match(
    s,
    /\) : verifyFailed \? \(\s*<Text style=\{styles\.warn\}>[\s\S]*?<\/Text>\s*\) : \(\s*<Text style=\{styles\.body\}>This application is no longer active\.<\/Text>/,
  );
});
