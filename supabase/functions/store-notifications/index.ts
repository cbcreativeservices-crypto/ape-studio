// store-notifications — Apple App Store Server Notifications V2 + Google Play
// Real-Time Developer Notifications, in one endpoint.
//
// ccode 2026-09-17, at the owner's instruction. This is the missing half of the
// credential rule: "no certificates if they refund and I never get paid
// anything". Without it a refunded member keeps `status='active'` until their
// period simply expires, `refunded_at` is never set, and no predicate anywhere
// can tell the difference between a paying member and one whose money went back.
//
// ── THE SECURITY MODEL, WHICH IS THE WHOLE DESIGN ────────────────────────────
//
// This endpoint is PUBLIC. It has to be: Apple and Google POST to it with no
// credential of ours. So it treats EVERY request body as a rumour.
//
// A notification is used ONLY as a trigger — "something changed for transaction
// X" — and never as evidence of WHAT changed. The function then asks Apple or
// Google directly, with our own authenticated call, and acts on that answer
// alone. A forged notification can therefore do exactly one thing: cause us to
// re-check a transaction against the store and confirm it is fine.
//
// That is deliberately stronger than verifying Apple's JWS signature chain and
// trusting the payload. It reuses the same server APIs `validate-purchase`
// already uses, so there is one way of establishing truth in this codebase
// rather than two that can drift apart.
//
// ── OWNER SETUP ──────────────────────────────────────────────────────────────
// Deploy:
//   supabase functions deploy store-notifications --no-verify-jwt
//
// Secrets — all already set for validate-purchase except the last:
//   APPLE_ISSUER_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_BUNDLE_ID, APPLE_ENV
//   GOOGLE_SERVICE_ACCOUNT, ANDROID_PACKAGE_NAME
//   STORE_NOTIFY_SLUG   — any long random string; it must appear in the URL path
//
// Then point the stores at it:
//   Apple  — App Store Connect → your app → App Information → App Store Server
//            Notifications → Production & Sandbox URL:
//            https://<project>.functions.supabase.co/store-notifications/<SLUG>
//   Google — Play Console → Monetisation setup → Real-time developer
//            notifications → a Pub/Sub topic, with a PUSH subscription to the
//            same URL. Also enable "Voided Purchases" notifications.
//
// FAILS SAFE: an unset secret, an unverifiable transaction or an unknown user
// changes nothing and returns 200. Returning 200 on a rumour we could not
// confirm is correct — a non-2xx makes the store retry the same rumour for
// hours, and we have already decided we do not act on rumours.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SLUG = Deno.env.get('STORE_NOTIFY_SLUG') ?? '';

const ok = (note: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ ok: true, note, ...extra }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
const notFound = () =>
  new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });

// ── base64url helpers (same shapes as validate-purchase) ─────────────────────
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
/** Read a JWS payload WITHOUT verifying it. Safe here, and only here, because
 *  nothing downstream trusts the result — it is used to pull out an id that we
 *  then look up against the store ourselves. */
function peekJwtPayload<T>(jwt: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(jwt.split('.')[1]))) as T;
  } catch {
    return null;
  }
}

// ── Apple ────────────────────────────────────────────────────────────────────
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

type AppleTx = {
  productId?: string;
  bundleId?: string;
  expiresDate?: number;
  revocationDate?: number;
  originalTransactionId?: string;
};

/** Ask Apple what is actually true about this transaction. */
async function appleTruth(transactionId: string): Promise<AppleTx | null> {
  const jwt = await appleAccessJwt();
  if (!jwt || !transactionId) return null;
  const env = (Deno.env.get('APPLE_ENV') ?? 'production').toLowerCase();
  const look = async (host: string) => {
    const res = await fetch(`${host}/inApps/v1/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) return { status: res.status, signed: null as string | null };
    const body = (await res.json()) as { signedTransactionInfo?: string };
    return { status: res.status, signed: body.signedTransactionInfo ?? null };
  };
  // Production first, then sandbox on 404 — Apple's own guidance, and what App
  // Review needs (reviewers buy in the sandbox against a production build).
  let hit = await look(env === 'sandbox' ? APPLE_SANDBOX : APPLE_PROD);
  if (!hit.signed && env !== 'sandbox' && hit.status === 404) hit = await look(APPLE_SANDBOX);
  if (!hit.signed) return null;
  return peekJwtPayload<AppleTx>(hit.signed);
}

// ── Google ───────────────────────────────────────────────────────────────────
async function googleAccessToken(): Promise<string | null> {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
  if (!raw) return null;
  const sa = JSON.parse(raw) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: unknown) => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc({ alg: 'RS256', typ: 'JWT' })}.${enc({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signingInput}.${bytesToB64url(sig)}`,
  });
  if (!res.ok) return null;
  return ((await res.json()) as { access_token?: string }).access_token ?? null;
}

/** Ask Google what is actually true about this purchase token. */
async function googleTruth(
  purchaseToken: string,
  sku: string,
  kind: 'subs' | 'in-app',
): Promise<{ revoked: boolean; expiresAtMs: number | null } | null> {
  const pkg = Deno.env.get('ANDROID_PACKAGE_NAME');
  const token = await googleAccessToken();
  if (!pkg || !token || !purchaseToken) return null;
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`;
  const url =
    kind === 'subs'
      ? `${base}/purchases/subscriptions/${sku}/tokens/${purchaseToken}`
      : `${base}/purchases/products/${sku}/tokens/${purchaseToken}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    expiryTimeMillis?: string;
    purchaseState?: number;
    userCancellationTimeMillis?: string;
  };
  if (kind === 'subs') {
    const expiresAtMs = body.expiryTimeMillis ? Number(body.expiryTimeMillis) : null;
    // purchaseState 1 = cancelled/refunded on the subscriptions resource.
    return { revoked: body.purchaseState === 1, expiresAtMs };
  }
  // in-app (lifetime): 0 purchased, 1 cancelled, 2 pending.
  return { revoked: body.purchaseState === 1, expiresAtMs: null };
}

// ── the one thing this function exists to do ─────────────────────────────────
type Store = ReturnType<typeof createClient>;

/**
 * Mark a refund against whichever entitlement row carries this store reference.
 *
 * Clearing `member_since` is the point: it is what stops a refunded member ever
 * satisfying `member_month_complete`, and it is why a refund cannot be undone
 * by simply waiting. Coming back later is a NEW run of membership and starts
 * the month again, which is the owner's "lapses reset it" applied to the case
 * where the lapse was a chargeback.
 */
async function markRefunded(admin: Store, storeRefs: string[], why: string): Promise<number> {
  const refs = storeRefs.filter(Boolean);
  if (refs.length === 0) return 0;
  const { data, error } = await admin
    .from('entitlements')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      member_since: null,
      updated_at: new Date().toISOString(),
    })
    .in('store_ref', refs)
    // SCOPED TO STORE PURCHASES (hardened 2026-09-17, found by a bug-hunt pass).
    //
    // `store_ref` is not a namespace: a purchase writes a transaction id there,
    // and `redeem_access_code` writes THE CODE ITSELF — so every holder of one
    // access code shares a single store_ref. Without this filter, a forged
    // notification naming a known code as its orderId would mark every user who
    // ever redeemed it as refunded, clearing member_since for all of them. The
    // endpoint is public, so "forged" is the normal case to design for.
    //
    // Apple and Google can only refund what Apple and Google sold. A comp or a
    // code is the owner's gift and no store notification may revoke it.
    .in('source', ['app_store', 'play_store'])
    .select('id');
  if (error) {
    console.error('[store-notifications] refund write failed:', error.message, why);
    return 0;
  }
  const n = (data ?? []).length;
  console.log(`[store-notifications] ${why}: ${n} entitlement row(s) marked refunded`);
  return n;
}

/** A refund that the store later reverses gives the member their access back —
 *  but NOT their old tenure. The month restarts, because they did not in fact
 *  hold an unbroken paid month. */
async function markReinstated(admin: Store, storeRefs: string[], expiresAtMs: number | null): Promise<number> {
  const refs = storeRefs.filter(Boolean);
  if (refs.length === 0) return 0;
  const patch: Record<string, unknown> = {
    status: 'active',
    refunded_at: null,
    member_since: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (expiresAtMs) patch.expires_at = new Date(expiresAtMs).toISOString();
  const { data, error } = await admin
    .from('entitlements')
    .update(patch)
    .in('store_ref', refs)
    // Same scope as markRefunded: only a store purchase can be reinstated by a
    // store, and only one it previously refunded.
    .in('source', ['app_store', 'play_store'])
    .not('refunded_at', 'is', null)
    .select('id');
  if (error) {
    console.error('[store-notifications] reinstate failed:', error.message);
    return 0;
  }
  return (data ?? []).length;
}

// ── request handling ─────────────────────────────────────────────────────────

/** Apple notification types that mean money went back, or access was pulled. */
const APPLE_REFUND_TYPES = new Set(['REFUND', 'REVOKE']);
const APPLE_REINSTATE_TYPES = new Set(['REFUND_REVERSED']);

async function handleApple(admin: Store, signedPayload: string): Promise<Response> {
  const outer = peekJwtPayload<{
    notificationType?: string;
    subtype?: string;
    data?: { signedTransactionInfo?: string };
  }>(signedPayload);
  if (!outer) return ok('apple: unreadable payload, ignored');

  const type = outer.notificationType ?? '';
  const interesting = APPLE_REFUND_TYPES.has(type) || APPLE_REINSTATE_TYPES.has(type);
  if (!interesting) return ok(`apple: ${type || 'unknown'} is not a refund event, ignored`);

  // The transaction id is the ONLY thing taken from the rumour.
  const tx = outer.data?.signedTransactionInfo
    ? peekJwtPayload<AppleTx & { transactionId?: string }>(outer.data.signedTransactionInfo)
    : null;
  const transactionId = tx?.transactionId ?? '';
  const originalId = tx?.originalTransactionId ?? '';
  if (!transactionId) return ok('apple: no transaction id, ignored');

  // Now ask Apple directly. Everything below acts on THIS, not on the payload.
  const truth = await appleTruth(transactionId);
  if (!truth) return ok('apple: could not verify with the store, nothing changed');
  if (truth.bundleId !== Deno.env.get('APPLE_BUNDLE_ID')) {
    return ok('apple: bundle mismatch, ignored');
  }

  // `store_ref` is whatever validate-purchase wrote: the transaction id for
  // Apple. Try the original id too — a renewed subscription refunds against a
  // later transaction than the one we first stored.
  const refs = [transactionId, originalId, truth.originalTransactionId ?? ''];

  if (truth.revocationDate) {
    const n = await markRefunded(admin, refs, `apple ${type}`);
    return ok('apple: refund confirmed by the store', { rows: n });
  }
  if (APPLE_REINSTATE_TYPES.has(type)) {
    const n = await markReinstated(admin, refs, truth.expiresDate ?? null);
    return ok('apple: refund reversed, access restored and the month restarted', { rows: n });
  }
  // Apple said REFUND but its own API shows no revocation — believe the API.
  return ok('apple: store reports no revocation, nothing changed');
}

async function handleGoogle(admin: Store, body: unknown): Promise<Response> {
  const msg = (body as { message?: { data?: string } })?.message;
  if (!msg?.data) return ok('google: no message data, ignored');
  const decoded = peekJwtPayloadFromBase64(msg.data);
  if (!decoded) return ok('google: unreadable message, ignored');

  const voided = decoded.voidedPurchaseNotification;
  const sub = decoded.subscriptionNotification;

  // A voided purchase is Google's refund signal.
  if (voided?.purchaseToken) {
    // CORRECTED 2026-09-17: this passed `packageName` where the SKU belongs, so
    // the lookup built a URL with the package name as the product id and always
    // 404'd — meaning it never verified anything. A voided notification does not
    // carry the SKU, so try the subscription resource without one and fall back
    // to the product resource; either resolving is evidence.
    const sku = decoded.subscriptionNotification?.subscriptionId ?? '';
    const truth =
      (sku ? await googleTruth(voided.purchaseToken, sku, 'subs') : null) ??
      (sku ? await googleTruth(voided.purchaseToken, sku, 'in-app') : null);

    // The ORDER ID IS NOT USED as a match key. It is attacker-controlled on a
    // public endpoint and shares a namespace with access codes; only the
    // purchase token identifies a real purchase. See markRefunded.
    const n = await markRefunded(admin, [voided.purchaseToken], 'google voided purchase');
    return ok('google: voided purchase', {
      rows: n,
      verified: truth ? truth.revoked : 'token did not resolve; refund applied on the voided-purchases feed alone',
    });
  }

  if (sub?.purchaseToken) {
    // 12 = SUBSCRIPTION_REVOKED (refund / chargeback). 13 = EXPIRED, which is a
    // normal ending and must NOT clear tenure — the member simply lapsed.
    if (sub.notificationType !== 12) {
      return ok(`google: subscription notification ${sub.notificationType} is not a revocation, ignored`);
    }
    const truth = await googleTruth(sub.purchaseToken, sub.subscriptionId ?? '', 'subs');
    if (!truth) return ok('google: could not verify with the store, nothing changed');
    if (!truth.revoked) return ok('google: store reports no revocation, nothing changed');
    const n = await markRefunded(admin, [sub.purchaseToken], 'google SUBSCRIPTION_REVOKED');
    return ok('google: revocation confirmed by the store', { rows: n });
  }

  return ok('google: nothing actionable in this notification');
}

type GoogleRtdn = {
  packageName?: string;
  subscriptionNotification?: { notificationType?: number; purchaseToken?: string; subscriptionId?: string };
  voidedPurchaseNotification?: { purchaseToken?: string; orderId?: string; refundType?: number };
};
function peekJwtPayloadFromBase64(data: string): GoogleRtdn | null {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(data))) as GoogleRtdn;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // The slug is noise reduction, not security — the security is that nothing
  // here trusts the request body. But an unset slug means the owner has not
  // finished setup, and an endpoint that acts before setup is finished is worse
  // than one that does nothing.
  const url = new URL(req.url);
  if (!SLUG || !url.pathname.split('/').filter(Boolean).includes(SLUG)) return notFound();
  if (req.method !== 'POST') return notFound();
  if (!SUPABASE_URL || !SERVICE) return ok('not configured, nothing changed');

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return ok('unparseable body, ignored');
  }

  const admin = createClient(SUPABASE_URL, SERVICE);

  try {
    // Apple sends { signedPayload }. Google Pub/Sub sends { message, subscription }.
    if (typeof body.signedPayload === 'string') return await handleApple(admin, body.signedPayload);
    if (body.message) return await handleGoogle(admin, body);
    return ok('unrecognised notification shape, ignored');
  } catch (e) {
    // Never 500 at a store. A 500 makes it retry the same rumour for hours, and
    // we do not act on rumours anyway — so log it and accept.
    console.error('[store-notifications] handler threw:', (e as Error).message);
    return ok('handler error, logged, nothing changed');
  }
});
