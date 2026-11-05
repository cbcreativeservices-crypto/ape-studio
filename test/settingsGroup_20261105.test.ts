// Report items 6 and 13 (2026-11-05): a failed redeem keeps the popup and the
// code; the MESSAGES & REQUESTS section is hidden while Community is hidden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const settings = read('src/screens/settings/SettingsScreen.tsx');

function submitRedeemBody(): string {
  const start = settings.indexOf('const submitRedeem = useCallback(');
  const end = settings.indexOf('}, [redeemCode, refreshEntitlement]);', start);
  assert.ok(start > 0 && end > start, 'submitRedeem not found');
  return settings.slice(start, end);
}

test('Redeem: only a code that worked closes the popup and clears the code', () => {
  const body = submitRedeemBody();
  assert.match(
    body,
    /if \(res\.ok\) \{\n\s+setRedeemOpen\(false\);\n\s+setRedeemCode\(''\);\n\s+\} else \{/,
  );
  assert.equal(body.split('setRedeemOpen(false)').length, 2, 'no other close in submitRedeem');
  assert.equal(body.split("setRedeemCode('')").length, 2, 'no other clear in submitRedeem');
});

test('Redeem: a failure still says why, with the keyboard out of the way of OK', () => {
  const body = submitRedeemBody();
  const fail = body.slice(body.indexOf('} else {'));
  assert.match(fail, /Keyboard\.dismiss\(\);/);
  assert.match(fail, /notify\(res\.ok \? 'Code applied' : 'Code not applied'/);
});

test('Redeem: the popup is a DimModal, so the notice can draw inside it', () => {
  assert.match(settings, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/);
  assert.match(read('src/components/AppDialog.tsx'), /const sheetOpen = useModalHostOpen\(\['dialog', 'gate'\]\);/);
});

test('MESSAGES & REQUESTS renders only when the Community switch is on', () => {
  assert.match(settings, /\{COMMUNITY_VISIBLE \? <CommunityNotifySection \/> : null\}/);
  assert.equal(settings.split('<CommunityNotifySection').length, 2, 'one render site');
  assert.match(settings, /import \{ COMMUNITY_VISIBLE \} from '\.\.\/\.\.\/config\/communityVisible';/);
});
