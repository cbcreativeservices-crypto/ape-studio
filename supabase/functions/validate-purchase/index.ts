// validate-purchase — server-side IAP receipt verification + entitlement grant.
// Owner 2026-08-21. Deno / Supabase Edge Function.
//
// The app (features/commercial/purchase.ts) calls this after a store purchase.
// It verifies the receipt with Apple / Google's SERVER APIs (never trusts the
// client), then upserts the caller's `entitlements` row. FAILS SAFE: if a
// required secret is missing or verification fails, it returns { ok:false } and
// grants NOTHING.
//
// ── OWNER SETUP (see docs/APE_IAP_PLAN_2026_08_21.md) ────────────────────────
// Secrets (supabase secrets set ...):
//   APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (.p8 contents),
//   APPLE_BUNDLE_ID, APPLE_ENV ("production" | "sandbox")
//   GOOGLE_SERVICE_ACCOUNT (service-account JSON), ANDROID_PACKAGE_NAME
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// TEST IN SANDBOX before trusting in production.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ACADEMY_PRODUCT = 'academy';
const PLAN_SKUS: Record<string, 'monthly' | 'annual' | 'lifetime'> = {
  academy_monthly: 'monthly',
  academy_annual: 'annual',
  academy_lifetime: 'lifetime',
};

type VerifyResult = { valid: boolean; expiresAtMs: number | null };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// ── base64url helpers ────────────────────────────────────────────────────────
function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function bytesToB64url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeJwtPayload<T>(jwt: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(jwt.split('.')[1]))) as T;
}

// ── Apple: App Store Server API (get transaction by id) ──────────────────────
async function appleAccessJwt(): Promise<string | null> {
  const issuer = Deno.env.get('APPLE_ISSUER_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const p8 = Deno.env.get('APPLE_PRIVATE_KEY');
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID');
  if (!issuer || !keyId || !p8 || !bundleId) return null;

  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuer, iat: now, exp: now + 600, aud: 'appstoreconnect-v1', bid: bundleId };
  const enc = (o: unknown) => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(payload)}`;

  const pem = p8.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    b64urlToBytes(pem.replace(/\+/g, '-').replace(/\//g, '_')),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput)),
  );
  return `${signingInput}.${bytesToB64url(sig)}`;
}

const APPLE_PROD = 'https://api.storekit.itunes.apple.com';
const APPLE_SANDBOX = 'https://api.storekit-sandbox.itunes.apple.com';

async function appleLookup(host: string, jwt: string, transactionId: string): Promise<{ status: number; signed: string | null }> {
  const res = await fetch(`${host}/inApps/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return { status: res.status, signed: null };
  const body = (await res.json()) as { signedTransactionInfo?: string };
  return { status: res.status, signed: body.signedTransactionInfo ?? null };
}

async function verifyApple(transactionId: string, expectedSku: string, kind: 'subs' | 'in-app'): Promise<VerifyResult> {
  const jwt = await appleAccessJwt();
  if (!jwt || !transactionId) return { valid: false, expiresAtMs: null };
  // Production first, then sandbox on "not found" — Apple's own guidance, and
  // what App Review needs: reviewers buy in the SANDBOX against the production
  // build. APPLE_ENV=sandbox forces sandbox only (local testing).
  const env = (Deno.env.get('APPLE_ENV') ?? 'production').toLowerCase();
  let hit = await appleLookup(env === 'sandbox' ? APPLE_SANDBOX : APPLE_PROD, jwt, transactionId);
  if (!hit.signed && env !== 'sandbox' && hit.status === 404) hit = await appleLookup(APPLE_SANDBOX, jwt, transactionId);
  if (!hit.signed) return { valid: false, expiresAtMs: null };
  // signedTransactionInfo is a JWS from Apple's authenticated endpoint — decode
  // its payload (transport already authenticated by our TLS + bearer JWT).
  const tx = decodeJwtPayload<{ productId?: string; bundleId?: string; expiresDate?: number; revocationDate?: number }>(hit.signed);
  const bundleOk = tx.bundleId === Deno.env.get('APPLE_BUNDLE_ID');
  const skuOk = tx.productId === expectedSku;
  const notRevoked = !tx.revocationDate;
  // A subscription transaction is only good while its expiry is in the future;
  // a lifetime (non-consumable) purchase has no expiry.
  const current = kind === 'in-app' ? true : !!tx.expiresDate && tx.expiresDate > Date.now();
  return { valid: !!(bundleOk && skuOk && notRevoked && current), expiresAtMs: tx.expiresDate ?? null };
}

// ── Google: Play Developer API (OAuth2 service account) ──────────────────────
async function googleAccessToken(): Promise<string | null> {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
  if (!raw) return null;
  const sa = JSON.parse(raw) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const enc = (o: unknown) => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(claim)}`;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)));
  const assertion = `${signingInput}.${bytesToB64url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  if (!res.ok) return null;
  return ((await res.json()) as { access_token?: string }).access_token ?? null;
}

async function verifyGoogle(purchaseToken: string, sku: string, kind: 'subs' | 'in-app'): Promise<VerifyResult> {
  const pkg = Deno.env.get('ANDROID_PACKAGE_NAME');
  const token = await googleAccessToken();
  if (!pkg || !token || !purchaseToken) return { valid: false, expiresAtMs: null };
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`;
  const url =
    kind === 'subs'
      ? `${base}/purchases/subscriptions/${sku}/tokens/${purchaseToken}`
      : `${base}/purchases/products/${sku}/tokens/${purchaseToken}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { valid: false, expiresAtMs: null };
  const body = (await res.json()) as { expiryTimeMillis?: string; purchaseState?: number };
  if (kind === 'subs') {
    const expiresAtMs = body.expiryTimeMillis ? Number(body.expiryTimeMillis) : null;
    return { valid: !!expiresAtMs && expiresAtMs > Date.now(), expiresAtMs };
  }
  // in-app (lifetime): purchaseState 0 = purchased.
  return { valid: body.purchaseState === 0, expiresAtMs: null };
}

// ── entitlement window ───────────────────────────────────────────────────────
function expiresAtFor(plan: 'monthly' | 'annual' | 'lifetime', verified: VerifyResult): string {
  if (plan === 'lifetime') return new Date('2099-12-31T00:00:00Z').toISOString();
  // Trust the store's expiry when present; otherwise fall back to the nominal term.
  if (verified.expiresAtMs) return new Date(verified.expiresAtMs).toISOString();
  const d = new Date();
  if (plan === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Identify the caller from their JWT (RLS-scoped client with their token).
  const asUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await asUser.auth.getUser();
  const authUid = auth.user?.id;
  if (!authUid) return json({ ok: false, error: 'not_authenticated' }, 401);

  let body: { platform?: string; productId?: string; purchaseToken?: string; transactionId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  const sku = body.productId ?? '';
  const plan = PLAN_SKUS[sku];
  if (!plan) return json({ ok: false, error: 'unknown_product' }, 400);

  // Route by platform; if the client didn't send one, infer from which
  // credential is present (Apple = transaction id, Google = purchase token).
  const plat = (body.platform ?? '').toLowerCase();
  const isApple = plat.includes('ios') || (!body.purchaseToken && !!body.transactionId);
  const kind: 'subs' | 'in-app' = plan === 'lifetime' ? 'in-app' : 'subs';
  const verified = isApple
    ? await verifyApple(body.transactionId ?? '', sku, kind)
    : await verifyGoogle(body.purchaseToken ?? '', sku, kind);

  if (!verified.valid) return json({ ok: false, error: 'not_verified' });

  // Verified — write the entitlement with the service role (bypasses RLS).
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userRow } = await admin.from('users').select('id').eq('auth_id', authUid).maybeSingle();
  const userId = (userRow as { id?: string } | null)?.id;
  if (!userId) return json({ ok: false, error: 'no_user_row' });

  const computed = expiresAtFor(plan, verified);
  // MUST match the entitlements_source_check constraint (app_store / play_store).
  const source = isApple ? 'app_store' : 'play_store';
  // ── store_ref MUST BE THE ID THAT STORE'S REFUND FEED NAMES ────────────────
  //
  // This is the key a refund is matched on later, and the two stores do not use
  // the same identifier:
  //
  //   Apple  · refund notifications carry TRANSACTION IDS
  //   Google · purchases/voidedpurchases and SUBSCRIPTION_REVOKED carry the
  //            PURCHASE TOKEN, and store-notifications matches on that alone
  //
  // The old line was `body.transactionId || body.purchaseToken || sku` for both
  // platforms. react-native-iap populates BOTH fields on Android, where
  // `transactionId` is the Google ORDER ID (GPA.xxxx-xxxx-xxxx-xxxxx) — so the
  // order id won, and every Android row was keyed on an id that appears in no
  // refund feed.
  //
  // The consequence was silent and permanent: markRefunded's
  // `.in('store_ref', [purchaseToken])` matched ZERO rows, the function still
  // returned 200 so Google never retried, and a refunded Android member kept
  // paid access AND kept accruing tenure toward a certificate they had been
  // refunded for. Nothing logged an error, because nothing failed.
  //
  // ⛔ DO NOT "fix" this instead by matching on the order id in
  //    store-notifications. That was considered and deliberately rejected on
  //    2026-09-17: that endpoint is public, the order id is attacker-controlled,
  //    and store_ref is not a namespace — `redeem_access_code` writes the CODE
  //    ITSELF there, so a forged notification naming a known code would mark
  //    every user who ever redeemed it as refunded. See markRefunded's comment.
  //
  // Safe by construction: verifyGoogle returns invalid without a purchaseToken
  // and verifyApple without a transactionId, and we have already returned on
  // `!verified.valid` above — so the field each branch needs is guaranteed
  // present here. The fallbacks are belt-and-braces, not load-bearing.
  const store_ref = isApple
    ? body.transactionId || body.purchaseToken || sku
    : body.purchaseToken || body.transactionId || sku;

  // There is a UNIQUE (user_id, product); read the one row if it exists.
  //
  // ── A FAILED READ IS NOT "NO PRIOR ROW" (fixed 2026-09-18) ────────────────
  //
  // The error was discarded here. Every consumer below treats a null `prior` as
  // "brand new member", and the tenure clock's first condition is literally
  // `!prior → member_since = now`. So ANY transient read failure — a timeout, a
  // pool exhaustion, a duplicate row making maybeSingle throw — silently
  // RESTARTED the paid month of an existing member.
  //
  // That is the same severe failure already fixed once on 2026-09-17 by a
  // different route (inferring a lapse from our own expires_at): a member is
  // permanently denied every credential, in silence, with no support path,
  // because nothing anywhere records that their clock was reset.
  //
  // Retried once, because most of these are transient and a retry costs one
  // round trip on a path that already made two HTTPS calls to a store.
  let { data: existing, error: readErr } = await admin
    .from('entitlements')
    .select('id, expires_at, member_since, refunded_at')
    .eq('user_id', userId)
    .eq('product', ACADEMY_PRODUCT)
    .maybeSingle();
  if (readErr) {
    console.warn('[validate-purchase] prior entitlement read failed, retrying:', readErr.message);
    ({ data: existing, error: readErr } = await admin
      .from('entitlements')
      .select('id, expires_at, member_since, refunded_at')
      .eq('user_id', userId)
      .eq('product', ACADEMY_PRODUCT)
      .maybeSingle());
  }
  // Still unreadable. We do NOT fail the request — the customer has already been
  // charged, and refusing here means finishTransaction never runs and the store
  // auto-refunds them in 72 hours. Instead we grant access and leave the tenure
  // clock strictly alone; see `member_since` below.
  const priorUnknown = !!readErr;
  if (priorUnknown) {
    console.error('[validate-purchase] prior entitlement UNREADABLE — granting access, leaving member_since untouched:', readErr?.message);
  }

  // Never SHORTEN access a user already has (e.g. a lifetime comp who also
  // buys a month): keep the later expiry.
  const prior = existing as { id: string; expires_at: string; member_since: string | null; refunded_at: string | null } | null;
  const priorMs = prior?.expires_at ? Date.parse(prior.expires_at) : 0;
  const computedMs = Date.parse(computed);
  const expires_at = priorMs > computedMs ? prior!.expires_at : computed;

  // ── the tenure clock (owner 2026-09-17) ──────────────────────────────────
  // A credential needs one complete month of unbroken membership, so this has
  // to record when the CURRENT run began — and must not restart it on a
  // renewal, or nobody on a monthly plan would ever reach a month.
  //
  // ── WHY A LAPSE IS NOT INFERRED FROM OUR OWN expires_at ──────────────────
  //
  // The first version restarted the clock whenever `prior.expires_at` was in
  // the past. That is absence of evidence, not evidence of a lapse: this row is
  // only written when the app happens to call us, so a perfectly good monthly
  // subscription looks expired here for as long as no renewal has reached the
  // server. A bug-hunt pass on 2026-09-17 found the consequence and it was
  // severe — a monthly subscriber's clock restarted on every restore, so they
  // could NEVER satisfy member_month_complete and were permanently denied every
  // credential. It hit the cheapest plan only, which is the worst possible
  // group to quietly punish.
  //
  // So the clock now restarts only on POSITIVE evidence that the run ended:
  //   • there was no run before (a genuinely new member), or
  //   • the previous run ended in a refund — the owner's rule, money returned
  //     buys no tenure, or
  //   • the gap since expiry is long enough that no renewal could explain it.
  //
  // The grace window errs towards KEEPING tenure, deliberately. Wrongly denying
  // a paying customer the certificate they earned is a far worse failure than
  // wrongly granting one a few weeks early, and only the first generates a
  // support ticket nobody can resolve.
  const LAPSE_GRACE_DAYS = 60;
  const nowIso = new Date().toISOString();
  const priorEnd = prior?.expires_at ? Date.parse(prior.expires_at) : 0;
  const reallyLapsed =
    priorEnd > 0 && Date.now() - priorEnd > LAPSE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  //
  // `undefined` when the prior row could not be read: the key is then OMITTED
  // from the write below, so an existing clock is preserved untouched rather
  // than guessed at. A genuinely new member simply gets no tenure this call —
  // the next one (renewal, restore, or app launch) reads the row successfully,
  // sees `member_since` null, and sets it. Late is recoverable; restarted is
  // not.
  const member_since = priorUnknown
    ? undefined
    : !prior || !prior.member_since || prior.refunded_at || reallyLapsed
      ? nowIso
      : prior.member_since;

  // ── ONE RECEIPT, ONE ACCOUNT ──────────────────────────────────────────────
  //
  // Verifying a receipt with Apple or Google proves the PURCHASE is real. It
  // does NOT prove the caller is the person who made it. Nothing here checked
  // whether this store_ref was already bound to a different account, and
  // `entitlements` is unique on (user_id, product) and nothing else — so one
  // subscription could entitle unlimited accounts, each with its own row, by
  // replaying the same token from each of them.
  //
  // The refund path shows the column was always meant to identify ONE
  // purchase: store-notifications revokes with `.in('store_ref',[token])`,
  // which would mark every one of those accounts refunded together.
  //
  // Migration 2026092103 adds the partial unique index that makes this true
  // no matter which code path writes the row. This check exists so the second
  // account gets a clear, actionable answer instead of a constraint violation
  // reported as `grant_failed`.
  //
  // Scoped to the two store sources deliberately: access codes also live in
  // store_ref (source='access_code') and are redeemed by many people by
  // design, so they must not be caught by this.
  const { data: boundElsewhere, error: bindErr } = await admin
    .from('entitlements')
    .select('user_id')
    .eq('store_ref', store_ref)
    .in('source', ['app_store', 'play_store'])
    .neq('user_id', userId)
    .maybeSingle();
  if (bindErr) {
    // Unreadable: do NOT block the grant on a check we could not perform. The
    // customer has already been charged, and the unique index is the real
    // guarantee — it will refuse the write if this truly is a second account.
    console.warn('[validate-purchase] store_ref binding check failed, relying on the index:', bindErr.message);
  } else if (boundElsewhere) {
    console.warn('[validate-purchase] receipt already bound to another account — refusing');
    return json({ ok: false, error: 'receipt_already_linked' });
  }

  const row = {
    status: 'active',
    source,
    store_ref,
    expires_at,
    // Omitted entirely when the prior row was unreadable — see above. Spreading
    // `undefined` would send an explicit null and wipe the very clock this is
    // protecting.
    ...(member_since === undefined ? {} : { member_since }),
    // Paying again clears a prior refund flag; the clock above has already been
    // restarted for it, so this cannot hand back tenure that was never earned.
    refunded_at: null,
    updated_at: nowIso,
  };
  // When the prior row could not be READ, we still do not know whether one
  // exists — and a plain insert would hit UNIQUE (user_id, product), fail the
  // grant, and hand the customer "we couldn't verify that purchase" for a
  // purchase that verified perfectly. Upsert lands either way.
  const write = existing
    ? await admin.from('entitlements').update(row).eq('id', prior!.id)
    : priorUnknown
      ? await admin
          .from('entitlements')
          .upsert({ user_id: userId, product: ACADEMY_PRODUCT, ...row }, { onConflict: 'user_id,product' })
      : await admin.from('entitlements').insert({ user_id: userId, product: ACADEMY_PRODUCT, ...row });

  // The receipt verified but the grant did not land — do NOT tell the client
  // it succeeded, or it will finishTransaction and the paid user gets nothing.
  if (write.error) {
    console.error('[validate-purchase] entitlement write failed:', write.error.message);
    return json({ ok: false, error: 'grant_failed' });
  }

  return json({ ok: true, tier: 'academy', expires_at });
});
