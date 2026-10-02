/**
 * ACCOUNT + COMMERCE — full-app bug RUN 2 (2026-10-01 evening).
 * Regressions for the fixes made in that run (source-reading + pure-module).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessEndsAt } from '../src/features/commercial/entitlementExpiry.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

test('popup suppression: a reset emits to mounted hooks and fences an in-flight hydrate', () => {
  const s = read('src/features/dev/popupSuppressStore.ts');
  const reset = s.slice(s.indexOf('export function resetPopupSuppression'), s.indexOf('export function arePopupsSuppressed'));
  assert.match(reset, /gen \+= 1;/, 'no generation bump on reset');
  assert.match(reset, /emit\(\);/, 'mounted useOverlaysSuppressed hooks never hear about the reset');
  const hydrate = s.slice(s.indexOf('function hydrate()'), s.indexOf('// Kick off hydration'));
  assert.match(hydrate, /const mine = gen;/);
  // The fence sits AFTER the storage await and BEFORE the state is applied.
  const awaitAt = hydrate.indexOf('await AsyncStorage.getItem');
  const fenceAt = hydrate.indexOf('if (mine !== gen) return;');
  const applyAt = hydrate.indexOf("suppressed = raw === '1'");
  assert.ok(awaitAt > 0 && fenceAt > awaitAt && applyAt > fenceAt, 'stale hydrate can still land after a reset');
});

test('fetchMyRegistryName throws on a failed read instead of reporting "no name"', () => {
  const api = read('src/features/profile/api.ts');
  const fn = api.slice(api.indexOf('export async function fetchMyRegistryName'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.doesNotMatch(body, /catch \{\s*return null;/, 'a failed read still returns null');
  assert.match(body, /myUserRowOrThrow</);
  const row = read('src/features/account/myUserRow.ts');
  const strict = row.slice(row.indexOf('export async function myUserRowOrThrow'), row.indexOf('export async function myUserId'));
  assert.match(strict, /if \(error\) throw/);
  assert.match(strict, /withDeadline\(\(\) => supabase\.auth\.getSession\(\)/, 'a stalled session read must throw, not read as signed out');
  assert.match(strict, /\.eq\('auth_id', uid\)\.maybeSingle\(\)/);
  // The best-effort caller keeps its old fallback rather than rejecting.
  assert.match(read('src/features/profile/publicProfile.ts'), /await fetchMyRegistryName\(\)\.catch\(\(\) => null\)/);
});

test('Paywall guest copy states the 2026-10-01 carry ruling truthfully', () => {
  const p = read('src/screens/commercial/PaywallScreen.tsx');
  assert.doesNotMatch(p, /work done without an account stays on this device and does not transfer/);
  assert.match(p, /lab work from this session comes with you, but study progress done without an account does not transfer/);
});

test('derive refuses an answer read without a live session (anon-key read = empty rows = false "free")', () => {
  const ent = read('src/features/commercial/EntitlementProvider.tsx');
  const derive = ent.slice(ent.indexOf('const deriveAndApply'), ent.indexOf('const RETRY_DELAYS_MS'));
  const check = derive.indexOf("safeSession(supabase.auth.getSession(), 'entitlement/derive')");
  const bail = derive.indexOf('if (!isRealAccount(live.session)) return false;');
  const readAt = derive.indexOf('await readAcademyRows()');
  assert.ok(check > 0 && bail > check && readAt > bail, 'the session is not confirmed before the rows are trusted');
});

test('the tier is re-read when a cancelled member’s paid cycle ends in the foreground', () => {
  const ent = read('src/features/commercial/EntitlementProvider.tsx');
  assert.match(ent, /armExpiryRecheck\(tier === 'academy' \? accessEndsAt\(rows\) : null\);/);
  const arm = ent.slice(ent.indexOf('const armExpiryRecheck'), ent.indexOf('const deriveAndApply'));
  assert.match(arm, /2147483647/, 'a month-long delay overflows setTimeout');
  assert.match(arm, /lastUid\.current === null\) return;\s*void deriveWithRetry\(true\);/);
  assert.match(ent, /if \(expiryTimer\) clearTimeout\(expiryTimer\);\s*sub\.subscription\.unsubscribe\(\);/);
});

test('accessEndsAt: the moment access ends, or null when it does not end on a known date', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  const a = '2026-10-05T00:00:00Z';
  const b = '2026-11-05T00:00:00Z';
  assert.equal(accessEndsAt([{ status: 'active', expires_at: a }], now), Date.parse(a));
  // The LAST end among granting rows, never the first.
  assert.equal(accessEndsAt([{ status: 'active', expires_at: a }, { status: 'active', expires_at: b }], now), Date.parse(b));
  // Expired / inactive rows do not count.
  assert.equal(accessEndsAt([{ status: 'active', expires_at: '2026-01-01T00:00:00Z' }, { status: 'active', expires_at: a }], now), Date.parse(a));
  assert.equal(accessEndsAt([{ status: 'refunded', expires_at: b }], now), null);
  // No end date (lifetime) or an unreadable one keeps access with no end.
  assert.equal(accessEndsAt([{ status: 'active', expires_at: a }, { status: 'active', expires_at: null }], now), null);
  assert.equal(accessEndsAt([{ status: 'active', expires_at: 'garbage' }], now), null);
  assert.equal(accessEndsAt([], now), null);
});
