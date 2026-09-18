/**
 * The Final Exam briefing must never assert a membership standing it cannot know.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * The rule (owner, 2026-09-18) is that a certificate requires one complete paid
 * month, and the exam briefing says so before the learner sits it. But the rule
 * cannot be evaluated yet: `entitlements` has no `member_since` and no
 * `refunded_at` — the migration adding them has never been applied — so
 * `member_month_complete` either does not exist or cannot answer.
 *
 * So `readTenureState` has THREE states, and the third one is the whole point.
 * It is also exactly the kind of thing a later reader "simplifies" into a
 * boolean, because two states look tidier. Both collapses are wrong:
 *
 *   'unknown' → 'incomplete'  tells a member of two years their results will be
 *                             held. Alarming, false, and a support email.
 *   'unknown' → 'complete'    tells a day-one member nothing, which is the
 *                             omission the rule exists to prevent.
 *
 * On 'unknown' the briefing states the POLICY and claims nothing about the
 * person — true for everyone, alarming to nobody. These tests pin that, and pin
 * the harder rule underneath it: nothing that happens here may stop somebody
 * sitting a graded exam.
 *
 * The supabase client is replaced with a module stub (registerHooks, the same
 * approach as calcUsage.test.ts) steered per-test via `globalThis.__apeTenureRpc`.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const STUB_URL = 'ape-test:supabase';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('lib/supabase')) return { url: STUB_URL, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export const supabase = { rpc: (fn) => globalThis.__apeTenureRpc(fn) };',
      };
    }
    return next(url, context);
  },
});

const { readTenureState } = await import('../src/features/finalExam/tenure.ts');

type Rpc = (fn: string) => Promise<{ data: unknown; error: unknown }>;
function withRpc(impl: Rpc): void {
  (globalThis as unknown as { __apeTenureRpc: Rpc }).__apeTenureRpc = impl;
}

describe('readTenureState — the answer the briefing is built on', () => {
  it('true means the month is complete, and no reminder is shown', async () => {
    withRpc(async () => ({ data: true, error: null }));
    assert.equal(await readTenureState(), 'complete');
  });

  it('false means it is not, and the full warning applies', async () => {
    withRpc(async () => ({ data: false, error: null }));
    assert.equal(await readTenureState(), 'incomplete');
  });
});

describe("what it does when it cannot know — the state that must not be collapsed", () => {
  it('the RPC is not deployed yet (today, on production)', async () => {
    // This is the CURRENT live state: the migration has never been applied.
    withRpc(async () => ({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.member_month_complete' },
    }));
    assert.equal(await readTenureState(), 'unknown');
  });

  it('the function is undefined at the database layer', async () => {
    withRpc(async () => ({ data: null, error: { code: '42883', message: 'function does not exist' } }));
    assert.equal(await readTenureState(), 'unknown');
  });

  it('permission denied', async () => {
    withRpc(async () => ({ data: null, error: { code: '42501', message: 'permission denied' } }));
    assert.equal(await readTenureState(), 'unknown');
  });

  it('a network failure', async () => {
    withRpc(async () => ({ data: null, error: { code: '', message: 'Network request failed' } }));
    assert.equal(await readTenureState(), 'unknown');
  });

  it('an answer in a shape we do not understand', async () => {
    // A future signature change must not be read as a coin toss.
    for (const data of [null, undefined, 'yes', 1, 0, {}, []]) {
      withRpc(async () => ({ data, error: null }));
      assert.equal(await readTenureState(), 'unknown', `${JSON.stringify(data)} should be unknown`);
    }
  });
});

describe('it can never stop somebody sitting a graded exam', () => {
  it('a thrown client never propagates', async () => {
    withRpc(() => {
      throw new Error('client exploded');
    });
    assert.equal(await readTenureState(), 'unknown');
  });

  it('a rejected promise never propagates', async () => {
    withRpc(() => Promise.reject(new Error('rejected')));
    assert.equal(await readTenureState(), 'unknown');
  });

  it('an error object with no code and no message', async () => {
    withRpc(async () => ({ data: null, error: {} }));
    assert.equal(await readTenureState(), 'unknown');
  });

  it('every path resolves to one of exactly three values', async () => {
    const seen = new Set<string>();
    const cases: Rpc[] = [
      async () => ({ data: true, error: null }),
      async () => ({ data: false, error: null }),
      async () => ({ data: null, error: { code: 'PGRST202', message: 'missing' } }),
      () => Promise.reject(new Error('x')),
    ];
    for (const c of cases) {
      withRpc(c);
      seen.add(await readTenureState());
    }
    for (const v of seen) {
      assert.ok(['complete', 'incomplete', 'unknown'].includes(v), `unexpected state: ${v}`);
    }
    // And all three are genuinely reachable — a function that can only ever
    // return one value would pass every test above.
    assert.equal(seen.size, 3);
  });
});
