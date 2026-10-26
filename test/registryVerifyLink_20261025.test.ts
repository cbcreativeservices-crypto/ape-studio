/**
 * Pro Registry / Get Discovered (owner 2026-10-25): the blue, underlined line
 * under the registry QR — "Scan to verify, or enter your code at
 * proaudiotrainingacademy.com/verify" — LOOKED like a link but did nothing.
 * Owner: "that link must match the user's unique qr code to open the same ID'd
 * page so they can show some one their phone either way to prove their
 * credential." It opens registryUrl(qrToken) — exactly what the QR encodes
 * (/registry/<token>, already public on the website).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync(join(process.cwd(), 'src/screens/directory/DirectoryScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');

test('the registry verify line opens the same page the QR encodes', () => {
  const i = src.indexOf('style={styles.registryLink}');
  assert.ok(i > 0);
  const tag = src.slice(i, src.indexOf('</Text>', i));
  assert.match(tag, /onPress=\{\(\) => \{\s*Linking\.openURL\(registryUrl\(qrToken\)\)/);
  assert.match(tag, /accessibilityRole="link"/);
  assert.match(tag, /\.catch\(\(\) => \{\s*notify\('Page unavailable'/);
  // The QR and the link share one URL builder.
  const qr = readFileSync(join(process.cwd(), 'src/components/CredentialQr.tsx'), 'utf8');
  // (2026-10-26: the QR may also encode a given `url`, the website for a guest.)
  assert.match(qr, /token \? registryUrl\(token\)/);
  assert.doesNotMatch(tag, /\/verify`/);
});

test('anything styled as a link in this screen has a tap action', () => {
  const uses = [...src.matchAll(/style=\{styles\.registryLink\}/g)].length;
  const linked = [...src.matchAll(/style=\{styles\.registryLink\}[\s\S]{0,200}?onPress=/g)].length;
  assert.equal(uses, linked);
});
