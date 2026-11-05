/**
 * M1 (owner 2026-11-05, option b): a sandbox purchase verifies and answers ok,
 * because App Review buys in the sandbox, but it buys 24 hours at most and no
 * certificate tenure, and it leaves a row with longer real access alone.
 *
 * This runs the REAL edge function file end to end. The only stand-ins are the
 * Deno runtime, the Supabase client and the stores' web answers, so what is
 * tested here is the file Comp A deploys, not a copy of its logic.
 */
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';

const DAY = 24 * 60 * 60 * 1000;
const SLACK = 60 * 1000;
const UID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-row-1';
const BUNDLE = 'com.test.app';

type Row = Record<string, unknown>;
type Handler = (req: Request) => Promise<Response>;

const state: {
  entitlement: Row | null;
  writes: Row[];
  readFails: boolean;
  appleProdStatus: number;
  appleTx: Row;
  googleBody: Row;
  acks: number;
} = { entitlement: null, writes: [], readFails: false, appleProdStatus: 200, appleTx: {}, googleBody: {}, acks: 0 };

let handler: Handler;
let dir: string;
const realFetch = globalThis.fetch;
const realWarn = console.warn;
const realLog = console.log;
const realError = console.error;
const realDeno = (globalThis as { Deno?: unknown }).Deno;

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jws = (o: unknown) => `${b64url({ alg: 'none' })}.${b64url(o)}.sig`;

/** The small part of the Supabase client this function uses. */
function fakeClient() {
  const query = (table: string) => {
    const filters: Record<string, unknown> = {};
    let excludeSelf = false;
    const api = {
      select: () => api,
      eq: (k: string, v: unknown) => ((filters[k] = v), api),
      in: () => api,
      neq: () => ((excludeSelf = true), api),
      maybeSingle: async () => {
        if (table === 'users') return { data: { id: USER_ID }, error: null };
        if (excludeSelf) return { data: null, error: null }; // the one-receipt check
        if (state.readFails) return { data: null, error: { message: 'timeout' } };
        return { data: state.entitlement, error: null };
      },
      update: (row: Row) => ({
        eq: async () => {
          state.writes.push(row);
          state.entitlement = { ...state.entitlement, ...row };
          return { error: null };
        },
      }),
      insert: async (row: Row) => {
        state.writes.push(row);
        state.entitlement = { id: 'new', ...row };
        return { error: null };
      },
      upsert: async (row: Row) => {
        state.writes.push(row);
        state.entitlement = { id: 'new', ...row };
        return { error: null };
      },
    };
    return api;
  };
  return { auth: { getUser: async () => ({ data: { user: { id: UID } } }) }, from: query };
}

async function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = String(input instanceof Request ? input.url : input);
  const ok = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });
  if (url.includes('oauth2.googleapis.com')) return ok({ access_token: 'g' });
  if (url.endsWith(':acknowledge')) {
    state.acks += 1;
    return ok({});
  }
  if (url.includes('androidpublisher')) return ok(state.googleBody);
  if (url.includes('/inApps/v1/subscriptions/')) return new Response('{}', { status: 404 });
  if (url.includes('/inApps/v1/transactions/')) {
    const isSandboxHost = url.includes('storekit-sandbox');
    if (!isSandboxHost && state.appleProdStatus !== 200) return new Response('{}', { status: state.appleProdStatus });
    return ok({ signedTransactionInfo: jws(state.appleTx) });
  }
  void init;
  throw new Error(`unexpected fetch ${url}`);
}

before(async () => {
  const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const env: Record<string, string> = {
    APPLE_ISSUER_ID: 'i',
    APPLE_KEY_ID: 'k',
    APPLE_PRIVATE_KEY: ec,
    APPLE_BUNDLE_ID: BUNDLE,
    GOOGLE_SERVICE_ACCOUNT: JSON.stringify({ client_email: 'a@b.c', private_key: rsa }),
    ANDROID_PACKAGE_NAME: 'com.test.app',
    SUPABASE_URL: 'https://x.test',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
  };
  (globalThis as unknown as { Deno: unknown }).Deno = {
    env: { get: (k: string) => env[k] },
    serve: (h: Handler) => {
      handler = h;
    },
  };
  (globalThis as unknown as { __fakeSupabase: unknown }).__fakeSupabase = fakeClient;
  globalThis.fetch = fakeFetch as typeof fetch;
  console.warn = () => {};
  console.log = () => {};
  console.error = () => {};

  const src = readFileSync(new URL('../supabase/functions/validate-purchase/index.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const stubbed = src.replace(
    "import { createClient } from 'jsr:@supabase/supabase-js@2';",
    'const createClient = () => (globalThis as any).__fakeSupabase();',
  );
  assert.notEqual(stubbed, src, 'the import line this test replaces has moved');
  dir = mkdtempSync(join(tmpdir(), 'vp-'));
  const file = join(dir, 'index.ts');
  writeFileSync(file, stubbed);
  await import(new URL(`file:///${file.replace(/\\/g, '/')}`).href);
  assert.ok(handler, 'the function did not register a handler');
});

after(() => {
  globalThis.fetch = realFetch;
  console.warn = realWarn;
  console.log = realLog;
  console.error = realError;
  (globalThis as { Deno?: unknown }).Deno = realDeno;
  rmSync(dir, { recursive: true, force: true });
});

beforeEach(() => {
  state.entitlement = null;
  state.writes = [];
  state.readFails = false;
  state.appleProdStatus = 200;
  state.appleTx = {};
  state.googleBody = {};
  state.acks = 0;
});

async function buy(body: Row) {
  const res = await handler(
    new Request('https://x.test/functions/v1/validate-purchase', {
      method: 'POST',
      headers: { Authorization: 'Bearer t' },
      body: JSON.stringify(body),
    }),
  );
  return (await res.json()) as { ok: boolean; expires_at?: string | null; error?: string };
}
const appleBuy = (productId: string) => buy({ platform: 'ios', productId, transactionId: 'tx-1' });
const googleBuy = (productId: string) => buy({ platform: 'android', productId, purchaseToken: 'tok-1' });
const appleLifetimeTx = (environment: string) => ({ environment, bundleId: BUNDLE, productId: 'academy_lifetime' });

function assertAboutOneDay(iso: string | null | undefined) {
  const ms = Date.parse(String(iso)) - Date.now();
  assert.ok(ms > DAY - SLACK && ms <= DAY + SLACK, `expected about 24 hours, got ${iso}`);
}

describe('validate-purchase: Apple', () => {
  it('a sandbox Lifetime gets 24 hours and still answers ok', async () => {
    state.appleTx = appleLifetimeTx('Sandbox');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assertAboutOneDay(r.expires_at);
    assertAboutOneDay(state.writes[0].expires_at as string);
  });

  it('being answered only by the sandbox host counts as sandbox, even with no environment field', async () => {
    state.appleProdStatus = 404;
    state.appleTx = { bundleId: BUNDLE, productId: 'academy_lifetime' };
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assertAboutOneDay(r.expires_at);
  });

  it('a production Lifetime is unchanged: 2099, with tenure started', async () => {
    state.appleTx = appleLifetimeTx('Production');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assert.equal(r.expires_at, '2099-12-31T00:00:00.000Z');
    assert.equal(typeof state.writes[0].member_since, 'string');
  });

  it('a production monthly keeps the store expiry', async () => {
    const end = Date.now() + 30 * DAY;
    state.appleTx = { environment: 'Production', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: end };
    const r = await appleBuy('academy_monthly');
    assert.equal(r.expires_at, new Date(end).toISOString());
  });

  it('a sandbox subscription shorter than a day keeps its shorter store expiry', async () => {
    const end = Date.now() + 5 * 60 * 1000;
    state.appleTx = { environment: 'Sandbox', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: end };
    const r = await appleBuy('academy_monthly');
    assert.equal(r.expires_at, new Date(end).toISOString());
  });
});

describe('validate-purchase: Google', () => {
  it('purchaseType 0 on Lifetime gets 24 hours, and the purchase is still acknowledged', async () => {
    state.googleBody = { purchaseState: 0, purchaseType: 0, acknowledgementState: 0 };
    const r = await googleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assertAboutOneDay(r.expires_at);
    assert.equal(state.acks, 1);
  });

  it('purchaseType 0 on a subscription is capped at 24 hours', async () => {
    state.googleBody = { expiryTimeMillis: String(Date.now() + 365 * DAY), purchaseType: 0, acknowledgementState: 1 };
    assertAboutOneDay((await googleBuy('academy_annual')).expires_at);
  });

  it('a real purchase has no purchaseType and is unchanged', async () => {
    state.googleBody = { purchaseState: 0, acknowledgementState: 1 };
    const r = await googleBuy('academy_lifetime');
    assert.equal(r.expires_at, '2099-12-31T00:00:00.000Z');
    assert.equal(typeof state.writes[0].member_since, 'string');
  });

  it('a promo code (purchaseType 1) is a real grant and is unchanged', async () => {
    state.googleBody = { purchaseState: 0, purchaseType: 1, acknowledgementState: 1 };
    assert.equal((await googleBuy('academy_lifetime')).expires_at, '2099-12-31T00:00:00.000Z');
  });
});

describe('validate-purchase: what a sandbox purchase leaves alone', () => {
  const comp = (): Row => ({
    id: 'e1',
    status: 'active',
    source: 'admin_grant',
    store_ref: null,
    plan: null,
    expires_at: '2099-01-01T00:00:00.000Z',
    member_since: '2026-01-01T00:00:00.000Z',
    refunded_at: null,
  });

  it('a comp to 2099 stays exactly as it was: nothing is written', async () => {
    state.entitlement = comp();
    state.appleTx = appleLifetimeTx('Sandbox');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assert.equal(r.expires_at, '2099-01-01T00:00:00.000Z');
    assert.equal(state.writes.length, 0);
    assert.deepEqual(state.entitlement, comp());
  });

  it('a Google test purchase on a comp is still acknowledged', async () => {
    state.entitlement = comp();
    state.googleBody = { purchaseState: 0, purchaseType: 0, acknowledgementState: 0 };
    assert.equal((await googleBuy('academy_lifetime')).ok, true);
    assert.equal(state.writes.length, 0);
    assert.equal(state.acks, 1);
  });

  it('member_since stays out of the write for a new sandbox buyer', async () => {
    state.appleTx = appleLifetimeTx('Sandbox');
    await appleBuy('academy_lifetime');
    assert.equal('member_since' in state.writes[0], false);
  });

  it('member_since does not move when a short sandbox row is renewed', async () => {
    state.entitlement = { ...comp(), expires_at: new Date(Date.now() - DAY).toISOString() };
    state.appleTx = appleLifetimeTx('Sandbox');
    await appleBuy('academy_lifetime');
    assert.equal('member_since' in state.writes[0], false);
    assert.equal(state.entitlement?.member_since, '2026-01-01T00:00:00.000Z');
  });

  it('a refunded row does not get its old end date back from a free purchase', async () => {
    state.entitlement = { ...comp(), status: 'refunded', refunded_at: '2026-10-01T00:00:00.000Z', member_since: null };
    state.appleTx = appleLifetimeTx('Sandbox');
    assertAboutOneDay((await appleBuy('academy_lifetime')).expires_at);
    assert.equal(state.entitlement?.member_since, null);
  });

  it('a real monthly after a refund gets its own month, not the refunded plan\'s end date', async () => {
    const refundedEnd = new Date(Date.now() + 300 * DAY).toISOString();
    const end = Date.now() + 30 * DAY;
    state.entitlement = { ...comp(), source: 'app_store', store_ref: 'tx-0', plan: 'annual', status: 'refunded', refunded_at: '2026-10-01T00:00:00.000Z', member_since: null, expires_at: refundedEnd };
    state.appleTx = { environment: 'Production', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: end };
    const r = await appleBuy('academy_monthly');
    assert.equal(r.expires_at, new Date(end).toISOString());
    assert.equal(state.entitlement?.expires_at, new Date(end).toISOString());
    assert.equal(state.entitlement?.status, 'active');
  });

  it('an inactive row with a later end date has no influence on a real purchase either', async () => {
    const end = Date.now() + 30 * DAY;
    state.entitlement = { ...comp(), source: 'app_store', status: 'inactive', expires_at: new Date(Date.now() + 300 * DAY).toISOString() };
    state.appleTx = { environment: 'Production', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: end };
    assert.equal((await appleBuy('academy_monthly')).expires_at, new Date(end).toISOString());
  });

  const forever = (): Row => ({ ...comp(), expires_at: null });

  it('a no-end-date comp is permanent: a sandbox Lifetime leaves it unchanged', async () => {
    state.entitlement = forever();
    state.appleTx = appleLifetimeTx('Sandbox');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assert.equal(r.expires_at, null);
    assert.equal(state.writes.length, 0);
    assert.deepEqual(state.entitlement, forever());
  });

  it('a no-end-date comp is permanent: a real monthly leaves it unchanged, source included', async () => {
    state.entitlement = forever();
    state.appleTx = { environment: 'Production', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: Date.now() + 30 * DAY };
    const r = await appleBuy('academy_monthly');
    assert.equal(r.ok, true);
    assert.equal(r.expires_at, null);
    assert.equal(state.writes.length, 0);
    assert.equal(state.entitlement?.source, 'admin_grant');
  });

  it('a real Google purchase on a no-end-date comp is still acknowledged', async () => {
    state.entitlement = forever();
    state.googleBody = { purchaseState: 0, acknowledgementState: 0 };
    assert.equal((await googleBuy('academy_lifetime')).ok, true);
    assert.equal(state.writes.length, 0);
    assert.equal(state.acks, 1);
  });

  it('a real monthly leaves a dated access code alone too', async () => {
    state.entitlement = { ...comp(), source: 'access_code', store_ref: 'CODE1' };
    state.appleTx = { environment: 'Production', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: Date.now() + 30 * DAY };
    const r = await appleBuy('academy_monthly');
    assert.equal(r.expires_at, '2099-01-01T00:00:00.000Z');
    assert.equal(state.writes.length, 0);
  });

  it('a paid plan bought again still updates its row, keeping the later date', async () => {
    const later = new Date(Date.now() + 200 * DAY).toISOString();
    state.entitlement = { ...comp(), source: 'app_store', store_ref: 'tx-0', expires_at: later };
    state.appleTx = { environment: 'Production', bundleId: BUNDLE, productId: 'academy_monthly', expiresDate: Date.now() + 30 * DAY };
    const r = await appleBuy('academy_monthly');
    assert.equal(r.expires_at, later);
    assert.equal(state.writes.length, 1);
    assert.equal(state.entitlement?.store_ref, 'tx-1');
  });

  it('a gift that has run out does not hold the row back from a real purchase', async () => {
    state.entitlement = { ...comp(), expires_at: new Date(Date.now() - DAY).toISOString() };
    state.appleTx = appleLifetimeTx('Production');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.expires_at, '2099-12-31T00:00:00.000Z');
    assert.equal(state.entitlement?.source, 'app_store');
  });

  it('a refunded row with no end date is not permanent access', async () => {
    state.entitlement = { ...forever(), status: 'refunded', refunded_at: '2026-10-01T00:00:00.000Z', member_since: null };
    state.appleTx = appleLifetimeTx('Sandbox');
    assertAboutOneDay((await appleBuy('academy_lifetime')).expires_at);
  });

  it('an unreadable prior row grants nothing on a sandbox purchase, so a comp is never shortened', async () => {
    state.readFails = true;
    state.appleTx = appleLifetimeTx('Sandbox');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, false);
    assert.equal(state.writes.length, 0);
  });

  it('an unreadable prior row still grants a real purchase', async () => {
    state.readFails = true;
    state.appleTx = appleLifetimeTx('Production');
    const r = await appleBuy('academy_lifetime');
    assert.equal(r.ok, true);
    assert.equal('member_since' in state.writes[0], false);
  });
});
