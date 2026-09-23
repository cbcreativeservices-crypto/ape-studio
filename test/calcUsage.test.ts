/**
 * Calculator weekly cap — the client half of the server-enforced 5-per-rolling-
 * week limit (src/features/lab/calcUsage.ts).
 *
 * WHY THIS SUITE EXISTS (audit night 2026-09-13): the cap FAILS OPEN by design —
 * any RPC error, missing function, or dead network returns `allowed: true` so
 * calculators never break pre-migration. That is exactly the failure class that
 * hid the DEAD glossary cap for 3 days: with no happy-path test, a broken
 * `calc_consume` RPC is indistinguishable from a working one, because both let
 * every reveal through. So the load-bearing cases here are the ones where the
 * RPC SUCCEEDS and the cap actually enforces; the fail-open cases pin the
 * documented intent so nobody "fixes" it into fail-closed by accident either.
 *
 * The supabase client is replaced with a module stub (registerHooks, the same
 * approach as measurementStore.test.ts) whose `rpc` is steered per-test via
 * `globalThis.__apeCalcRpc`.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const STUB_URL = 'ape-test:supabase';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('lib/supabase')) return { url: STUB_URL, shortCircuit: true };
    // Extensionless relative imports inside the module under test: Node's ESM
    // needs the extension, the app's bundler does not. Resolve them rather than
    // forcing source files to carry `.ts` in their imports for the harness's
    // benefit. (Added 2026-09-23 when src/lib/boundedCall was extracted.)
    // ...but ONLY for our own source. The first version of this rule had no
    // parentURL check and appended `.ts` to node_modules' own relative imports
    // too, which broke async-storage's `./AsyncStorage`.
    if (
      context.parentURL?.includes('/src/') &&
      /^\.{1,2}\//.test(specifier) &&
      !/\.[cm]?[jt]sx?$/.test(specifier)
    ) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export const supabase = { rpc: (fn) => globalThis.__apeCalcRpc(fn) };',
      };
    }
    return next(url, context);
  },
});

const { CALC_WEEKLY_LIMIT, consumeCalc, getCalcStatus } = await import('../src/features/lab/calcUsage.ts');

type RpcResult = { data: unknown; error: { message: string; code?: string } | null };
declare global {
  // eslint-disable-next-line no-var
  var __apeCalcRpc: (fn: string) => Promise<RpcResult> | RpcResult;
}

const row = (used: number, extra: Record<string, unknown> = {}) => ({
  used,
  lim: CALC_WEEKLY_LIMIT,
  window_start: '2026-09-07T00:00:00Z',
  ...extra,
});

// ── The happy path: the RPC answers, and the cap is REAL ────────────────────

test('HAPPY PATH — calc_consume succeeds and the cap BLOCKS at the limit', async () => {
  // The one case that would have exposed a dead glossary-style cap: the server
  // answers, says "no", and the client must actually say no.
  globalThis.__apeCalcRpc = (fn) => {
    assert.equal(fn, 'calc_consume');
    return { data: [row(5, { allowed: false })], error: null };
  };
  const u = await consumeCalc();
  assert.equal(u.allowed, false);
  assert.equal(u.unavailable, false); // the server WAS reached — this is a real refusal
  assert.equal(u.used, 5);
  assert.equal(u.limit, CALC_WEEKLY_LIMIT);
  assert.equal(u.windowStart, '2026-09-07T00:00:00Z');
});

test('under the cap, a successful consume allows and reports the real count', async () => {
  globalThis.__apeCalcRpc = () => ({ data: [row(3, { allowed: true })], error: null });
  const u = await consumeCalc();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, false);
  assert.equal(u.used, 3);
});

test('the status read derives allowed from used < limit — at 5/5 it blocks', async () => {
  // calc_usage_status has no allowed column; the "#/5" counter derives it.
  globalThis.__apeCalcRpc = (fn) => {
    assert.equal(fn, 'calc_usage_status');
    return { data: [row(5)], error: null };
  };
  const u = await getCalcStatus();
  assert.equal(u.allowed, false);
  assert.equal(u.unavailable, false);
  assert.equal(u.used, 5);
});

test('the status read under the cap allows', async () => {
  globalThis.__apeCalcRpc = () => ({ data: [row(4)], error: null });
  const u = await getCalcStatus();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, false);
});

test('a null server limit falls back to the client constant, never NaN/undefined', async () => {
  globalThis.__apeCalcRpc = () => ({ data: [{ used: 1, lim: null, window_start: null, allowed: true }], error: null });
  const u = await consumeCalc();
  assert.equal(u.limit, CALC_WEEKLY_LIMIT);
  assert.equal(u.windowStart, null);
});

// ── Fail-open BY DESIGN (docblock: "calculators never break") ───────────────
// Pinned so a future edit neither breaks calculators pre-migration NOR removes
// the `unavailable` flag the UI needs to say "usage not counted".

test('RPC error fails OPEN by design — allowed, and flagged unavailable', async () => {
  globalThis.__apeCalcRpc = () => ({ data: null, error: { message: 'permission denied', code: '42501' } });
  const u = await consumeCalc();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, true); // the honesty hook: the cap was NOT checked
});

test('a missing RPC (migration not deployed) fails OPEN with unavailable', async () => {
  globalThis.__apeCalcRpc = () => ({
    data: null,
    error: { message: 'Could not find the function public.calc_consume', code: 'PGRST202' },
  });
  const u = await consumeCalc();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, true);
});

test('a thrown/network failure fails OPEN with unavailable — never rejects', async () => {
  globalThis.__apeCalcRpc = () => Promise.reject(new Error('Network request failed'));
  const u = await consumeCalc();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, true);
});

test('an empty row set (malformed RPC answer) also fails OPEN with unavailable', async () => {
  globalThis.__apeCalcRpc = () => ({ data: [], error: null });
  const u = await consumeCalc();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, true);
});

test('the status read fails OPEN with unavailable on error too', async () => {
  globalThis.__apeCalcRpc = () => ({ data: null, error: { message: 'permission denied' } });
  const u = await getCalcStatus();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, true);
});

// ── Contract edge, pinned as-is ─────────────────────────────────────────────

test('a consume row WITHOUT an allowed column reads as allowed (current contract)', async () => {
  // The live calc_consume always returns the column; this pins what the client
  // does if a row arrives without it (allowed ?? true). It is NOT flagged
  // unavailable — a change here is a product decision, not a refactor.
  globalThis.__apeCalcRpc = () => ({ data: [row(2)], error: null });
  const u = await consumeCalc();
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, false);
});
