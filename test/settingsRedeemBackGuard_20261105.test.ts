// Android BACK during a redeem must not close the popup: the Modal's
// onRequestClose carries the same busy guard as the scrim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/screens/settings/SettingsScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

test('Redeem popup: Android BACK is ignored while a redeem is in flight', () => {
  const modal = src.match(/<Modal\b[^>]*visible=\{redeemOpen\}.*$/m);
  assert.ok(modal, 'Redeem Modal not found');
  assert.match(
    modal[0],
    /onRequestClose=\{\(\) => \{ if \(redeemBusy\) return; setRedeemOpen\(false\); \}\}/,
  );
});
