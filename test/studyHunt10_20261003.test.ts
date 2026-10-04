/**
 * Hunt 10 (2026-10-03) — Study area receipts. Each fails on HEAD d5ade47c.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (...p: string[]) =>
  readFileSync(fileURLToPath(new URL(`../src/${p.join('/')}`, import.meta.url)), 'utf8');

test('share QR card: the printed address comes from the SAME token read as the QR', () => {
  const src = read('features', 'credentials', 'CredentialShareRow.tsx');
  // A second, independent token read (myRegistryLink) could fail while the
  // first succeeded: a working QR captioned "still being set up".
  assert.doesNotMatch(src, /myRegistryLink\(\)/);
  assert.match(src, /setUrl\(tokRead\.token \? registryUrl\(tokRead\.token\) : null\)/);
  assert.match(src, /import \{ registryUrl \} from '\.\.\/profile\/registry';/);
});
