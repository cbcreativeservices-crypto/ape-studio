/**
 * Certificate shared as an IMAGE (owner 2026-09-18 ask; in the iOS 37 /
 * Android 21 build, owner 2026-10-24): the SAME certificateHtml the PDF prints,
 * rendered off-screen in a WebView and captured — never a second drawing.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const hook = read('src/features/credentials/useCertificateImage.tsx');
const row = read('src/features/credentials/CredentialShareRow.tsx');
const wall = read('src/screens/achievements/CredentialWall.tsx');
const loaders = read('src/features/tools/capture/optionalModule.ts');

test('one definition: the image renders buildCertificateHtml, like the PDF', () => {
  assert.match(hook, /buildCertificateHtml\(\{/);
  assert.match(hook, /captureAndShare\(viewRef\.current/);
  assert.match(hook, /androidLayerType="software"/, 'Android WebView must be capturable');
  assert.match(loaders, /'react-native-webview': \(\) => require\('react-native-webview'\)/);
});

test('honest gate and wiring: SHARE IMAGE only for an open certificate in a capable build', () => {
  assert.match(row, /\{certificate && certificateImageAvailable\(\) \? <ShareBtn label="SHARE IMAGE"/);
  assert.match(row, /\{certImage\.node\}/);
  assert.match(wall, /<CredentialShareRow credentialName=\{open\.name\} certificate=\{\{ credentialName: open\.name, awardType: open\.type, earnedAt: open\.awardedAt \}\}/);
});
