/**
 * Hunt 9 (2026-10-03) — Study area receipts. Each fails on HEAD 3131eae3.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (...p: string[]) =>
  readFileSync(fileURLToPath(new URL(`../src/${p.join('/')}`, import.meta.url)), 'utf8');

describe('Credential share: a FAILED token read is not "your record is still being set up"', () => {
  it('myRegistryLink reads the token strictly, so COPY / SHARE LINK report `failed`', () => {
    const src = read('features', 'credentials', 'shareCredential.ts');
    const fn = src.slice(src.indexOf('export async function myRegistryLink'));
    assert.match(fn.slice(0, 900), /await fetchMyQrTokenOrThrow\(\)/);
    assert.doesNotMatch(src, /\bfetchMyQrToken\(\)/, 'the lenient read answers null for a failure');
    // Both callers already turn a throw into `failed`.
    for (const name of ['copyRegistryLink', 'shareRegistryLink']) {
      const body = src.slice(src.indexOf(`export async function ${name}`));
      assert.ok(body.indexOf('try {') < body.indexOf('myRegistryLink()'), `${name}: the read is inside the try`);
      assert.match(body, /catch \{\s*return \{ ok: false, reason: 'failed' \};/);
    }
  });

  it('the share row remembers a failed token read and SHARE QR says so', () => {
    const src = read('features', 'credentials', 'CredentialShareRow.tsx');
    assert.doesNotMatch(src, /\bfetchMyQrToken\(\)/);
    assert.match(src, /fetchMyQrTokenOrThrow\(\)\.then\(/);
    assert.match(src, /setTokenFailed\(tokRead\.failed\)/);
    assert.match(src, /myRegistryLink\(\)\.catch\(\(\) => null\)/, 'the strict link read must not reject the row load');
    const at = src.indexOf('const qrNow = useCallback(');
    const body = src.slice(at, src.indexOf('captureAndShare(', at));
    assert.match(body, /reason: tokenFailed \? 'failed' : 'no_token'/);
  });
});
