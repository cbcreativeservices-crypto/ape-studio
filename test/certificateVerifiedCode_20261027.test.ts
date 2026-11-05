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
 * Hashes re-taken 2026-11-04: the owner changed the signature to Professor
 * Channing Booth, Founder, Pro Audio Training Academy.
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
  'registry QR, real qrcode library': '5cd3e3dfb2df7a8b7efac7a8023f169c58c6e71e47c4b37c97c30f079ffa0788',
  'registry QR, injected matrix': '291b2cf4148285a99129ca2f53888689a2154c49c7c33347b58a9b8717b58553',
  'no token (fail-closed panel)': '74c041c7246e8793275ebfc99d7064f3732662892782a24aceef956eb58d6538',
  'program, two-line name, no date': 'c07a2396af27052ef8c358c63715326b4d7f1f788ad4dcfc77a09dcaddf12b38',
  'URL disagrees with token': '2b013527b251a9d20a11ee8f65bc38e8258099d16312b78b8867cbbecaa9d3c2',
};

describe('certificate export — app output byte-identical (D15)', () => {
  for (const [name, render] of Object.entries(APP_CASES)) {
    test(name, () => {
      assert.equal(sha(render()), APP_SNAPSHOTS[name], `app certificate HTML changed: ${name}`);
    });
  }
});

const CODE_FIELDS = { ...BASE, qrToken: null, verifyUrl: null };
const VERIFIED_CODE_SNAPSHOT = '555f466525b65b55778a83c1529780c875d39c3e268d8b845ad855ec10548db2';

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
