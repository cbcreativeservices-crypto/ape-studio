/**
 * Owner 2026-09-30 morning list: Dashboard offline sign-out tells the truth,
 * SPL "NOT NOW" sticks, the calculation chain can be cleared.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('Dashboard sign-out only navigates once the sign-out really happened', () => {
  const d = src('src/screens/dashboard/DashboardScreen.tsx');
  assert.match(d, /async function signOutOrSay\(onDone: \(\) => void\)/);
  assert.match(d, /if \(error\) \{\s*consumeIntentionalSignOut\(\);/);
  // Full run 1 (2026-10-01): the callback now RESETS the root to Auth instead
  // of pushing it (homeShellFullRun1_20261001) — still only after signOutOrSay.
  // Hunt 13: both sign-out buttons share ONE latched call (signOutOnce).
  assert.equal((d.match(/signOutOrSay\(resetToLogin\)/g) ?? []).length, 1);
  assert.equal((d.match(/signOutOnce\(\);/g) ?? []).length, 2);
  assert.doesNotMatch(d, /\.signOut\(\)\s*\.catch\(\(\) => \{\}\)\s*\.then/);
});

test('SPL calibration prompt respects NOT NOW', () => {
  assert.match(src('src/features/tools/measure/deviceProfile.ts'), /export async function crowdsourceDeclined\(\)[\s\S]{0,120}=== '0'/);
  assert.match(src('src/screens/tools/SplMeterScreen.tsx'), /crowdsourceDeclined\(\)\.then\(\(declined\) => \{\s*if \(!declined\) setContribOffset\(o\);/);
});

test('the calculation chain has a CLEAR on both calculator screens', () => {
  for (const f of ['src/screens/lab/calc/CalcLabScreen.tsx', 'src/screens/lab/calc/CalcWorkspaceScreen.tsx']) {
    assert.match(src(f), /onPress=\{\(\) => setChainValue\(null\)\}[\s\S]{0,160}✕ CLEAR/, f);
  }
  assert.match(src('src/features/account/clearLocalAccountData.ts'), /setChainValue\(null\)/);
});
