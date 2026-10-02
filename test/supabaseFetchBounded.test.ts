/**
 * P7 / A4 / G3 — every network request has a deadline at the boundary.
 *
 * The recurring freeze of this project is a request that HANGS rather than
 * fails: no rejection, no `finally`, a spinner for ever. Hand-wrapping each
 * call (withDeadline / softDeadline / safeSession) was done six times and
 * drifted, and 22 files still made calls with no bound of their own
 * (pattern catalog 2026-10-02, P7). So the Supabase client is now created with
 * a bounded `global.fetch`, which every REST, auth, functions and storage
 * request goes through.
 *
 * Two halves:
 *   1. BEHAVIOUR — the bounded fetch rejects a never-settling request at its
 *      deadline (as an error that says "timeout", never an empty success),
 *      cancels the socket, and leaves a normal request untouched.
 *   2. RATCHET — the client is still created with it, and no NEW direct
 *      `fetch(` appears in src/ outside the allowlist below. The allowlist may
 *      only shrink: a stale entry fails too.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import {
  createBoundedFetch,
  fetchDeadlineFor,
  DEFAULT_DEADLINE_MS,
  FETCH_DEADLINE_MS,
  FUNCTIONS_FETCH_DEADLINE_MS,
  STORAGE_FETCH_DEADLINE_MS,
} from '../src/lib/boundedCall.ts';

const URL_BASE = 'https://example.supabase.co';

/** A fetch that never settles unless its signal aborts — a stalled socket. */
function stalledFetch() {
  const seen: { signal?: AbortSignal; aborted: boolean } = { aborted: false };
  // Like the platform fetch: silent until its signal aborts, then rejects.
  const fn = (_input: unknown, init?: { signal?: AbortSignal }) =>
    new Promise<never>((_resolve, reject) => {
      seen.signal = init?.signal;
      init?.signal?.addEventListener('abort', () => {
        seen.aborted = true;
        const e = new Error('Aborted');
        e.name = 'AbortError';
        reject(e);
      });
    });
  return { fn, seen };
}

describe('bounded fetch — behaviour', () => {
  test('a never-settling request REJECTS at its deadline, saying "timeout"', async () => {
    const { fn, seen } = stalledFetch();
    const bounded = createBoundedFetch(fn, 'supabase', () => 30);
    const t0 = Date.now();
    await assert.rejects(bounded(`${URL_BASE}/rest/v1/rpc/submit_quiz?select=*`), (e: Error) => {
      assert.equal(e.name, 'AbortError', 'postgrest-js must see an AbortError so it does not retry');
      assert.match(e.message, /timeout after 30ms/, 'the transient matchers need "timeout"');
      assert.match(e.message, /\/rest\/v1\/rpc\/submit_quiz/, 'the stall names the call');
      assert.doesNotMatch(e.message, /example\.supabase\.co|select=/, 'no host or query in the message');
      return true;
    });
    assert.ok(Date.now() - t0 >= 25, 'it waited for the deadline');
    assert.ok(seen.aborted, 'the socket was cancelled, not left running');
  });

  test('it rejects even if the underlying fetch ignores the abort signal', async () => {
    const deaf = () => new Promise<never>(() => {});
    const bounded = createBoundedFetch(deaf, 'supabase', () => 20);
    await assert.rejects(bounded(`${URL_BASE}/auth/v1/token`), /timeout after 20ms/);
  });

  test('a normal request passes straight through, with its init intact', async () => {
    const response = { ok: true, status: 200 };
    let got: { input?: unknown; init?: Record<string, unknown> } = {};
    const ok = (input: unknown, init?: Record<string, unknown>) => {
      got = { input, init };
      return Promise.resolve(response);
    };
    const bounded = createBoundedFetch(ok, 'supabase', () => 50);
    const headers = { apikey: 'k' };
    const res = await bounded(`${URL_BASE}/rest/v1/x`, { method: 'POST', headers, body: '{}' });
    assert.equal(res, response, 'the very same response object');
    assert.equal(got.input, `${URL_BASE}/rest/v1/x`);
    assert.equal(got.init?.method, 'POST');
    assert.equal(got.init?.headers, headers);
    assert.equal(got.init?.body, '{}');
    // The timer is cleared: waiting past the deadline produces nothing.
    await new Promise((r) => setTimeout(r, 80));
  });

  test('a real network error is passed through unchanged', async () => {
    const boom = new TypeError('Network request failed');
    const bounded = createBoundedFetch(() => Promise.reject(boom), 'supabase', () => 50);
    await assert.rejects(bounded(`${URL_BASE}/rest/v1/x`), (e) => e === boom);
  });

  test("the caller's own abort signal still cancels the request", async () => {
    const { fn, seen } = stalledFetch();
    const bounded = createBoundedFetch(fn, 'supabase', () => 10_000);
    const caller = new AbortController();
    const p = bounded(`${URL_BASE}/rest/v1/x`, { signal: caller.signal });
    caller.abort();
    await assert.rejects(p, (e: Error) => e.message === 'Aborted', 'the caller sees its own abort');
    assert.ok(seen.aborted, 'postgrest .abortSignal() / functions-js timeout must keep working');
  });

  test('budgets: longer than every per-call deadline, longer still for functions and storage', () => {
    // Per-call withDeadline/softDeadline must fire FIRST so their labels
    // (`redeem_access_code timeout`, `signOut timeout`) and timings survive.
    assert.ok(FETCH_DEADLINE_MS > DEFAULT_DEADLINE_MS);
    // validate-purchase is bounded at 30 s by its caller.
    assert.ok(FUNCTIONS_FETCH_DEADLINE_MS > 30000);
    assert.ok(STORAGE_FETCH_DEADLINE_MS > FUNCTIONS_FETCH_DEADLINE_MS);
    assert.equal(fetchDeadlineFor(`${URL_BASE}/rest/v1/rpc/x`), FETCH_DEADLINE_MS);
    assert.equal(fetchDeadlineFor(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`), FETCH_DEADLINE_MS);
    assert.equal(fetchDeadlineFor(`${URL_BASE}/functions/v1/validate-purchase`), FUNCTIONS_FETCH_DEADLINE_MS);
    assert.equal(fetchDeadlineFor(`${URL_BASE}/storage/v1/object/b/k`), STORAGE_FETCH_DEADLINE_MS);
  });
});

// ── Through the REAL supabase-js client ──────────────────────────────────────
// How each sub-client maps the deadline matters as much as the deadline: an
// abort that came back as `{ data: null, error: null }` would be an empty
// success, the worst outcome. Pin the mapping against the installed version.

describe('bounded fetch — through supabase-js', () => {
  const make = async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const { fn } = stalledFetch();
    let calls = 0;
    const counting = (input: unknown, init?: { signal?: AbortSignal }) => {
      calls++;
      return fn(input, init);
    };
    const client = createClient(URL_BASE, 'anon-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: createBoundedFetch(counting, 'supabase', () => 30) },
    });
    return { client, calls: () => calls };
  };

  test('.rpc() on a stalled socket resolves to an ERROR, not an empty success, and is not retried', async () => {
    const { client, calls } = await make();
    const { data, error } = await client.rpc('submit_quiz', { p: 1 });
    assert.equal(data, null);
    assert.ok(error, 'a stall must surface as { error }');
    assert.match(error!.message, /timeout after 30ms/);
    assert.equal(calls(), 1, 'an AbortError is not retried by postgrest-js');
  });

  test('.from().select() (a retryable GET) still settles once, at the deadline', async () => {
    const { client, calls } = await make();
    const t0 = Date.now();
    const { data, error } = await client.from('t').select('*');
    assert.equal(data, null);
    assert.match(error!.message, /timeout/);
    assert.equal(calls(), 1);
    assert.ok(Date.now() - t0 < 1000, 'no retry back-off on top of the deadline');
  });

  test('functions.invoke() resolves to an error', async () => {
    const { client } = await make();
    const { data, error } = await client.functions.invoke('lab-audio', { body: {} });
    assert.equal(data, null);
    assert.ok(error, 'functions-js must return { error }');
  });

  test('an auth network call resolves to an error that reads as offline', async () => {
    const { client } = await make();
    const orig = console.error;
    console.error = () => {}; // auth-js logs the fetch failure itself
    try {
      const { error } = await client.auth.signInWithPassword({ email: 'a@b.co', password: 'x' });
      assert.ok(error, 'auth-js must return { error }');
      assert.match(error!.message, /timeout/);
      assert.equal(error!.status, 0, 'AuthRetryableFetchError — the offline case');
    } finally {
      console.error = orig;
    }
  });
});

// ── G3 ratchet ───────────────────────────────────────────────────────────────

const ROOT = new URL('../src/', import.meta.url);

const walk = (dir: URL): URL[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(new URL(e.name + '/', dir))
      : /\.tsx?$/.test(e.name)
        ? [new URL(e.name, dir)]
        : [],
  );

const rel = (u: URL) =>
  decodeURIComponent(u.pathname).slice(decodeURIComponent(ROOT.pathname).length);

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/**
 * Direct `fetch(` calls that do not go through the Supabase client. Each one
 * must carry its own bound. This list may only SHRINK.
 */
const DIRECT_FETCH_ALLOWED: Record<string, string> = {
  'lib/boundedCall.ts': 'the bounded fetch itself',
  'features/lab/labClipBuffer.ts':
    'web clip download (a signed storage URL, not the client): own AbortController + withTimeout at CLIP_FETCH_TIMEOUT_MS',
};

describe('G3 — every request is bounded at the boundary', () => {
  test('the Supabase client is created with the bounded fetch', () => {
    const src = stripComments(readFileSync(new URL('lib/supabase.ts', ROOT), 'utf8'));
    assert.match(src, /import \{ createBoundedFetch \} from '\.\/boundedCall';/);
    assert.match(src, /const boundedFetch = createBoundedFetch\(/);
    assert.match(src, /global:\s*\{\s*fetch:\s*boundedFetch\s*\}/, 'createClient lost global.fetch');
  });

  test('there is exactly one Supabase client in src/', () => {
    const creators: string[] = [];
    for (const file of walk(ROOT)) {
      const name = rel(file).split('\\').join('/');
      const src = stripComments(readFileSync(file, 'utf8'));
      if (/\bcreateClient\s*\(/.test(src)) creators.push(name);
    }
    assert.deepEqual(creators, ['lib/supabase.ts'], 'a second client would bypass the deadline');
  });

  test('no new direct fetch( in src/ (multi-line, comments stripped)', () => {
    const found = new Set<string>();
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const name = rel(file).split('\\').join('/');
      const src = stripComments(readFileSync(file, 'utf8'));
      // A call to the global fetch, however spaced — not a `.fetch(` method
      // and not a declaration like `async fetch(`.
      const re = /(^|[^\w.$])(?:globalThis\s*\.\s*|window\s*\.\s*|global\s*\.\s*)?fetch\s*\(/g;
      for (const m of src.matchAll(re)) {
        const before = src.slice(Math.max(0, m.index! - 20), m.index! + m[1].length);
        if (/(async|function|private|public|protected)\s*$/.test(before)) continue;
        found.add(name);
        if (!(name in DIRECT_FETCH_ALLOWED)) offenders.push(name);
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'a direct fetch( has no deadline — React Native never times it out. Go through ' +
        'the Supabase client, or wrap it (createBoundedFetch / withDeadline):\n' +
        offenders.join('\n'),
    );
    const stale = Object.keys(DIRECT_FETCH_ALLOWED).filter((k) => !found.has(k));
    assert.deepEqual(stale, [], 'allowlist entries with no fetch( left — remove them (the list only shrinks)');
  });
});
