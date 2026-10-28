/**
 * Owner H-A 2026-10-22: the app says "employers can verify them online", so the
 * website's credential-verification pages must open without the site key, even
 * while the rest of the site is gated — exact match and one segment only, with
 * no gate cookie (not a site-wide unlock).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const proxy = readFileSync(join(import.meta.dirname, '..', 'web', 'proxy.ts'), 'utf8').replace(/\r\n/g, '\n');

describe('website /verify is public while the site is gated', () => {
  it('exempts /verify and one-segment /verify/<code>', () => {
    assert.match(proxy, /legalPublic === "\/verify" \|\| \/\^\\\/verify\\\/\[\^\/\]\+\$\/\.test\(legalPublic\)/);
  });

  it('the exemption runs before the gate cookie / key screen and sets no cookie', () => {
    const exempt = proxy.indexOf('legalPublic === "/verify"');
    const cookieCheck = proxy.indexOf('request.cookies.get(GATE_COOKIE)');
    assert.ok(exempt > 0 && cookieCheck > exempt);
    const block = proxy.slice(exempt, proxy.indexOf('}', exempt) + 1);
    assert.doesNotMatch(block, /cookies\.set/);
  });

  it('the one-segment pattern does not open deeper paths', () => {
    const re = /^\/verify\/[^/]+$/;
    assert.ok(re.test('/verify/ABCD-1234'));
    assert.ok(!re.test('/verify/a/b'));
    assert.ok(!re.test('/verifyx'));
  });
});
