/**
 * D15 (2026-10-27) — the website's verify-by-code page draws the certificate
 * with an opt-in `verifiedCode` (owner chose OPTION A). Two promises are
 * pinned here:
 *
 *  1. APP OUTPUT IS BYTE-IDENTICAL. Every app call site passes nothing new, so
 *     the exported HTML must hash exactly as it did before the option existed.
 *     The hashes below were taken from blob ff2ac2db (the renderer on
 *     ota-after-approval-39-23, the version the owner approved) BEFORE the
 *     verifiedCode path was added. If one of these moves, a printed app
 *     certificate changed — that is never a side effect of web work.
 *
 *  2. THE verifiedCode PATH is its own snapshot, and stays fail-closed: no QR,
 *     no microprint, no ID glyph (those come from the full UUID, which the code
 *     page does not have — they must never be faked), and it only applies with
 *     no qrToken and an 8-hex code.
 *
 * Template literals cook CRLF source to LF, so these hashes are the same on a
 * Windows (CRLF) checkout and in the cloud.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const require_ = createRequire(import.meta.url);
// optionalModule's LOADERS are literal CJS requires (see certificateQr.test.ts).
(globalThis as { require?: NodeRequire }).require ??= require_;

const { buildCertificateHtml } = await import('../src/features/credentials/certificateHtml.ts');

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const TOKEN = 'f8461fbf-6e39-4350-bd5d-cff3d1c57eac';
const URL_OK = `https://www.proaudiotrainingacademy.com/registry/${TOKEN}`;
const BASE = {
  holderName: 'Alex Rivera',
  credentialName: 'Live Sound Reinforcement',
  awardType: 'certificate' as const,
  earnedAt: '2026-09-02',
  qrToken: TOKEN,
  verifyUrl: URL_OK,
};
/** A fixed, fake-but-valid 21×21 matrix so one snapshot does not depend on qrcode. */
const fixedMatrix = () => ({ size: 21, get: (r: number, c: number) => ((r * 7 + c * 3) % 5 === 0 ? 1 : 0) });

/** App call shapes: every one passes NO verifiedCode. */
const APP_CASES: Record<string, () => string> = {
  'registry QR, real qrcode library': () => buildCertificateHtml(BASE),
  'registry QR, injected matrix': () => buildCertificateHtml(BASE, { createQrMatrix: fixedMatrix }),
  'no token (fail-closed panel)': () => buildCertificateHtml({ ...BASE, qrToken: null, verifyUrl: null }),
  'program, two-line name, no date': () => buildCertificateHtml({
    ...BASE,
    holderName: 'Maria Fernanda Gonzalez-Rodriguez',
    credentialName: 'Professional Live Sound and Studio Engineering Program',
    awardType: 'program',
    earnedAt: null,
  }),
  'URL disagrees with token': () => buildCertificateHtml({
    ...BASE,
    verifyUrl: 'https://www.proaudiotrainingacademy.com/registry/00000000-0000-4000-8000-000000000000',
  }),
};

// sha256 of each app case's HTML, captured from blob ff2ac2db before the edit.
const APP_SNAPSHOTS: Record<string, string> = {
  'registry QR, real qrcode library': '95a840bec68bbcf4db405b8c98ab6ad19cbf6ce050aed9e8d8c18a148e656c11',
  'registry QR, injected matrix': 'a425eabb4bb9b0fa787ad852a356eb9aa3cc6e020b242de15a3ba52aa1f76d18',
  'no token (fail-closed panel)': '62b0e269a678044d6ecb7ef65d25df240ba5c6b8be6c4e294c7707da5670512b',
  'program, two-line name, no date': '3ee9a96930d43ebea60e844e0ff397505c2c655af5c56ddffc8b6a2283fa846e',
  'URL disagrees with token': 'a54de0826a8447a622ef7c69d9603138ad150719defe08ca755c94e44a0163d8',
};

describe('certificate export — app output byte-identical (D15)', () => {
  for (const [name, render] of Object.entries(APP_CASES)) {
    test(name, () => {
      assert.equal(sha(render()), APP_SNAPSHOTS[name], `app certificate HTML changed: ${name}`);
    });
  }
});

const CODE_FIELDS = { ...BASE, qrToken: null, verifyUrl: null };
const VERIFIED_CODE_SNAPSHOT = 'f3f5cae6e791f75a6d19e1acb50f83e6ebb06c4b3703d3f6b1c30b7cbda3209e';

describe('certificate verifiedCode path — the website code page (D15)', () => {
  const html = () => buildCertificateHtml(CODE_FIELDS, { verifiedCode: 'f8461fbf' });

  test('snapshot', () => {
    assert.equal(sha(html()), VERIFIED_CODE_SNAPSHOT);
  });

  test('shows VERIFIED CODE + the code, "Verified by code", the /verify host', () => {
    const h = html();
    assert.ok(h.includes('>Verified code</div>'), 'kicker missing');
    assert.ok(h.includes('>F8461FBF</div>'), 'upper-cased code missing from the box');
    assert.ok(h.includes('>Verified by code</div>'), 'label missing');
    assert.ok(h.includes('>proaudiotrainingacademy.com/verify</a>'), 'host line must be /verify');
    assert.ok(!h.includes('Verification unavailable'), 'a verified code must not read as unverifiable');
    assert.ok(!h.includes('Please contact the Academy'), 'nor carry the contact fallback');
    assert.ok(!h.includes('<div class="qr-fallback"'), 'no blank fallback panel');
  });

  test('metadata "Credential" value is the code', () => {
    assert.ok(html().includes('<div class="label">Credential</div><div class="value">F8461FBF</div>'));
  });

  test('covert layers stay ABSENT (they come from the full UUID) and there is no QR', () => {
    const h = html();
    assert.ok(!h.includes('REGISTERED CREDENTIAL'), 'microprint must not be faked');
    assert.ok(!h.includes('stroke-width="0.5" opacity="0.62"'), 'ID glyph must not be faked');
    assert.ok(!h.includes('aria-label="QR code for the public registry"'), 'no QR without a token');
    assert.ok(!h.includes('Scan to verify'), 'nothing to scan');
  });

  test('ignored when a qrToken is present — the registry render wins, byte for byte', () => {
    assert.equal(
      buildCertificateHtml(BASE, { verifiedCode: 'F8461FBF' }),
      buildCertificateHtml(BASE),
    );
  });

  test('ignored unless the code is exactly 8 hex characters', () => {
    const closed = buildCertificateHtml(CODE_FIELDS);
    for (const bad of ['', 'F8461FB', 'F8461FBF0', 'G8461FBF', 'F846 1FBF', '<b>8461F</b>']) {
      assert.equal(buildCertificateHtml(CODE_FIELDS, { verifiedCode: bad }), closed, `accepted ${JSON.stringify(bad)}`);
    }
  });
});
