/**
 * The SSRF guard on the employer website probe.
 *
 * This decides whether our own server will issue a request to a host someone
 * else influenced, so the interesting cases are all the ones that are NOT a
 * company website.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { isPublicHostname } = await import('../web/lib/publicHostname.ts');

describe('real company websites are allowed', () => {
  for (const h of ['acme.com', 'abbeyroad.com', 'acme.co.uk', 'sub.acme.com', 'a-b.audio', 'xn--bcher-kva.example']) {
    it(h, () => assert.equal(isPublicHostname(h), true));
  }
});

describe('⛔ nothing that points back inside', () => {
  const blocked = [
    'localhost',            // dotless
    'metadata',             // dotless — the cloud metadata trick
    'metadata.internal',    // internal TLD
    'foo.localhost',
    'box.local',
    '127.0.0.1',            // loopback literal
    '169.254.169.254',      // link-local: the classic metadata address
    '10.0.0.5',             // private
    '192.168.1.1',
    '172.16.0.1',
    '0.0.0.0',
  ];
  for (const h of blocked) {
    it(`refuses ${h}`, () => assert.equal(isPublicHostname(h), false));
  }
});

describe('⛔ malformed input cannot sneak through', () => {
  for (const h of ['', 'a', '.acme.com', 'acme.com.', 'acme..com', 'acme.com:8080', '[::1]', 'acme.1', 'ACME.COM']) {
    it(`refuses ${JSON.stringify(h)}`, () => assert.equal(isPublicHostname(h), false));
  }
});
