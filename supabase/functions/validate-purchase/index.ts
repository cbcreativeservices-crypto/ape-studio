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

async function verifyApple(transactionId: string, expectedSku: string): Promise<VerifyResult> {
  const jwt = await appleAccessJwt();
  if (!jwt || !transactionId) return { valid: false, expiresAtMs: null };
  const env = (Deno.env.get('APPLE_ENV') ?? 'production').toLowerCase();
  const host = env === 'sandbox' ? 'https://api.storekit-sandbox.itunes.apple.com' : 'https://api.storekit.itunes.apple.com';
  const res = await fetch(`${host}/inApps/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return { valid: false, expiresAtMs: null };
  const body = (await res.json()) as { signedTransactionInfo?: string };
  if (!body.signedTransactionInfo) return { valid: false, expiresAtMs: null };
  // signedTransactionInfo is a JWS from Apple's authenticated endpoint — decode
  // its payload (transport already authenticated by our TLS + bearer JWT).
  const tx = decodeJwtPayload<{ productId?: string; bundleId?: string; expiresDate?: number; revocationDate?: number }>(
    body.signedTransactionInfo,
  );
  const bundleOk = tx.bundleId === Deno.env.get('APPLE_BUNDLE_ID');
  const skuOk = tx.productId === expectedSku;
  const notRevoked = !tx.revocationDate;
  return { valid: !!(bundleOk && skuOk && notRevoked), expiresAtMs: tx.expiresDate ?? null };
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

  const isApple = (body.platform ?? '').toLowerCase().includes('ios');
  const kind: 'subs' | 'in-app' = plan === 'lifetime' ? 'in-app' : 'subs';
  const verified = isApple
    ? await verifyApple(body.transactionId ?? '', sku)
    : await verifyGoogle(body.purchaseToken ?? '', sku, kind);

  if (!verified.valid) return json({ ok: false, error: 'not_verified' });

  // Verified — write the entitlement with the service role (bypasses RLS).
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userRow } = await admin.from('users').select('id').eq('auth_id', authUid).maybeSingle();
  const userId = (userRow as { id?: string } | null)?.id;
  if (!userId) return json({ ok: false, error: 'no_user_row' });

  const expires_at = expiresAtFor(plan, verified);
  const source = isApple ? 'appstore' : 'playstore';
  const store_ref = body.transactionId || body.purchaseToken || sku;

  const { data: existing } = await admin
    .from('entitlements')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('product', ACADEMY_PRODUCT)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin
      .from('entitlements')
      .update({ status: 'active', source, store_ref, expires_at, updated_at: new Date().toISOString() })
      .eq('id', (existing as { id: string }).id);
  } else {
    await admin
      .from('entitlements')
      .insert({ user_id: userId, product: ACADEMY_PRODUCT, status: 'active', source, store_ref, expires_at });
  }

  return json({ ok: true, tier: 'academy', expires_at });
});
