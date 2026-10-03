/**
 * ACCOUNT + COMMERCE — toddler hunt 4 (single pass, 2026-10-03).
 *
 * Source-reading (the screen needs React Native). Failed against the pre-fix
 * file (R2).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

test('Create Account + code: a granted code whose tier refresh did not come back academy is TOLD, as in Settings → Redeem', () => {
  const s = read('src/screens/auth/AuthScreen.tsx');
  const start = s.indexOf('const onCreateAccount = async () => {');
  const body = s.slice(start, s.indexOf('const onLogin = async () => {', start));
  assert.ok(start > 0, 'onCreateAccount found');
  // The refresh answers the TIER and the caller reads it (it was discarded).
  assert.match(body, /const tier = await refreshEntitlement\(\);/);
  assert.doesNotMatch(body, /^\s*await refreshEntitlement\(\);/m, 'the tier is not thrown away');
  // Same condition and the same ratified wording Settings uses.
  assert.match(body, /if \(redeem\.status === 'granted' && tier !== 'academy'\) \{/);
  assert.match(body, /notify\('Account created', REDEEM_GRANTED_NOT_REFRESHED, \(\) => \{\s*hold\(\);\s*void claimAndProceed\(toHome\)\.finally\(end\);\s*\}\);\s*return;/);
  assert.match(s, /import \{ REDEEM_GRANTED_NOT_REFRESHED, redeemAccessCode \} from '\.\.\/\.\.\/features\/commercial\/accessCode';/);
});
