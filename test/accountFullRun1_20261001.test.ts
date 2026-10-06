/**
 * ACCOUNT + COMMERCE — full-app bug RUN 1 (2026-10-01 evening).
 * Source-reading regressions for the fixes made in that run.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const ent = read('src/features/commercial/EntitlementProvider.tsx');

test('the tier is re-read when the app returns from the background (refund = same day, cancel = at expires_at)', () => {
  // Before: only a cold start or a sign-in/out read the tier, so a refunded or
  // expired member stayed 'academy' for as long as the app stayed suspended.
  assert.match(ent, /import \{ AppState, Platform, type AppStateStatus \} from 'react-native';/);
  const listener = ent.slice(ent.indexOf("AppState.addEventListener('change'"));
  assert.ok(ent.includes("AppState.addEventListener('change'"), 'no foreground listener');
  assert.match(listener, /appState === 'background' && next === 'active'/);
  // Signed-in accounts only, never a fresh session read that can stall into "signed out".
  assert.match(listener, /lastUid\.current === null\) return;\s*void deriveWithRetry\(true\);/);
  // Removed with the auth subscription.
  assert.match(ent, /sub\.subscription\.unsubscribe\(\);\s*appSub\.remove\(\);/);
});

test('a derive older than a refreshEntitlement answer never overwrites it (purchase-sheet return)', () => {
  const derive = ent.slice(ent.indexOf('const deriveAndApply'), ent.indexOf('const RETRY_DELAYS_MS'));
  assert.match(derive, /const refreshSeen = refreshApplied\.current;/);
  assert.match(derive, /refreshApplied\.current === refreshSeen/);
  const refresh = ent.slice(ent.indexOf('const refreshEntitlement = useCallback'), ent.indexOf('setMemberStanding(entitlement'));
  assert.match(refresh, /serverTierApplied\.current = true;\s*refreshApplied\.current \+= 1;\s*setEntitlementState\(tier\);/);
});

test("status 'refunded' is not a member; a cancelled row is a member until expires_at", () => {
  // The tier rule itself (pinned, unchanged): only status 'active' grants, and
  // only while its expiry has not passed.
  const fn = ent.slice(ent.indexOf('function academyTierFromRows'), ent.indexOf('const ENTITLEMENT_READ_MS'));
  assert.match(fn, /if \(r\.status !== 'active'\) continue;/);
  assert.match(fn, /classifyExpiry\(r\.expires_at, now\)/);
});
