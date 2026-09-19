/**
 * The cold-start auth race on the study reads (owner 2026-09-19:
 * "first time opening flashcards for a topic often creates error message").
 *
 * Traced on the live app: the session is read from the OS keychain
 * asynchronously, so a study fetch issued on a cold start can leave before
 * the JWT is attached. PostgREST answers 42501, and because all three of the
 * study fetch's fallback paths end at the same view, one denial fails every
 * one of them and the screen reports a connection problem it does not have.
 *
 * These pin both halves of the rule, because getting either wrong is worse
 * than the bug: retrying something that is NOT an auth denial hides real
 * failures behind a double round-trip, and retrying without a session turns a
 * guest's honest "you cannot read this" into a retry loop.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { isAuthDenial, withSessionRetry } = await import('../src/features/study/sessionRetry.ts');

/** The exact body PostgREST returned on the traced failure. */
const DENIAL = { code: '42501', details: null, hint: null, message: 'permission denied for view glossary_study_v' };

describe('isAuthDenial', () => {
  it('recognises the denial the study path actually returns', () => {
    assert.equal(isAuthDenial(DENIAL), true);
    assert.equal(isAuthDenial({ code: '42501' }), true);
    assert.equal(isAuthDenial(new Error('permission denied for table student_method_progress')), true);
    assert.equal(isAuthDenial({ message: 'Permission Denied for function record_study_progress' }), true);
  });

  it('does not claim ordinary failures are auth', () => {
    // These must NOT be retried — a second round-trip only delays the report.
    assert.equal(isAuthDenial(new Error('Network request failed')), false);
    assert.equal(isAuthDenial({ code: 'PGRST116', message: 'no rows returned' }), false);
    assert.equal(isAuthDenial(new Error('relation does not exist')), false);
    assert.equal(isAuthDenial(null), false);
    assert.equal(isAuthDenial(undefined), false);
  });
});

describe('withSessionRetry', () => {
  it('passes a successful read straight through, and asks for no session', async () => {
    let asked = 0;
    const got = await withSessionRetry(async () => 'items', async () => (asked++, true));
    assert.equal(got, 'items');
    assert.equal(asked, 0, 'a working read must not touch auth at all');
  });

  it('retries once when the session had simply not loaded yet', async () => {
    // The real sequence: first read anon-denied, session hydrates, second works.
    let calls = 0;
    const got = await withSessionRetry(
      async () => {
        calls++;
        if (calls === 1) throw DENIAL;
        return 'items';
      },
      async () => true,
    );
    assert.equal(got, 'items');
    assert.equal(calls, 2);
  });

  it('gives up after ONE retry rather than looping', async () => {
    let calls = 0;
    await assert.rejects(
      withSessionRetry(
        async () => {
          calls++;
          throw DENIAL;
        },
        async () => true,
      ),
      (e: unknown) => e === DENIAL,
    );
    assert.equal(calls, 2, 'must be exactly one retry, never a loop');
  });

  it('does not retry a guest — the denial is the true answer', async () => {
    let calls = 0;
    await assert.rejects(
      withSessionRetry(
        async () => {
          calls++;
          throw DENIAL;
        },
        async () => false,
      ),
      (e: unknown) => e === DENIAL,
    );
    assert.equal(calls, 1, 'a guest must fail on the first read, not the second');
  });

  it('never retries a failure that is not an auth denial', async () => {
    let calls = 0;
    const offline = new Error('Network request failed');
    await assert.rejects(
      withSessionRetry(
        async () => {
          calls++;
          throw offline;
        },
        async () => true,
      ),
      (e: unknown) => e === offline,
    );
    assert.equal(calls, 1);
  });
});
