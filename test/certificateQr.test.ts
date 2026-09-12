/**
 * The certificate QR — the guard for a defect that was live in EVERY build.
 *
 * `certificateHtml` reaches `qrcode` through `optionalModule`, which routes any
 * name without a LOADERS row through `eval('require')`. Metro only bundles what
 * it can see as a LITERAL require, and `qrcode` was a transitive dependency of
 * react-native-qrcode-svg with no literal require anywhere — so the dynamic
 * path resolved null on device, `factory` was null, and the document silently
 * fell back to the "verification unavailable" panel on every certificate the
 * Academy has ever issued. These tests fail if the LOADERS row is removed, if
 * `qrcode` stops being a direct dependency, or if the matrix stops reaching the
 * rendered document.
 *
 * ⚠️ Node resolves `require` differently from Metro, so "the library loads
 * here" is NECESSARY but not SUFFICIENT — it proves the package is installed
 * and API-compatible, not that Metro bundled it. The `literal row` test is the
 * half that guards the Metro side, by pinning the one property Metro keys on.
 *
 * MUTATION-CHECKED 2026-09-13, and the result is the reason that test exists:
 * with the LOADERS row deleted, SEVEN of these eight still pass. Node's
 * `eval('require')` fallback resolves the real package from node_modules, so
 * the end-to-end document still renders its QR here while the shipped app
 * renders none. Only the source-text test fails. Do not "simplify" it away as
 * redundant with the behavioural tests — in this file it is the ONLY test that
 * can see the bug.
 *
 * Loader note: `certificateHtml.ts` imports its siblings extensionless (the
 * house style — Metro and tsc both resolve that; Node's ESM loader does not).
 * The resolve hook below appends `.ts` for relative specifiers so the real
 * module can be exercised instead of a hand-copied mirror of it.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { registerHooks } from 'node:module';
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

const require_ = createRequire(import.meta.url);

/**
 * optionalModule's LOADERS rows are LITERAL CommonJS `require` calls - that is
 * the whole point of them, because a literal is the only thing Metro sees and
 * bundles. Node's ESM scope has no `require` at all, so without this shim every
 * row throws ReferenceError, optionalModule's catch returns null, and the
 * tests below would report the shipped bug whether or not it was fixed. The
 * shim supplies the CJS `require` that Metro's runtime provides on device, so
 * what is exercised here is the same code path with the same resolver contract.
 */
(globalThis as { require?: NodeRequire }).require ??= require_;

const { buildCertificateHtml, buildQrSvg } = await import(
  '../src/features/credentials/certificateHtml.ts'
);
const { optionalModule } = await import('../src/features/tools/capture/optionalModule.ts');

interface QrMatrix {
  size: number;
  get(row: number, column: number): boolean | number;
}
type QrLib = { create: (v: string, o: { errorCorrectionLevel: string }) => { modules: QrMatrix } };

/**
 * The EXACT fallback element, not the bare class name: `.qr-fallback` is also a
 * CSS rule inside the always-present <style> block, so a substring match on the
 * class alone is true of every document ever rendered - a "no QR" assertion
 * written that way passes whether the QR is there or not.
 */
const FALLBACK_PANEL = '<div class="qr-fallback"';

const TOKEN = '3f2a9c14-5b7e-4d81-9a03-6e2c8f1b4d70';
const FIELDS = {
  holderName: 'Alex Rivera',
  credentialName: 'Live Sound Reinforcement',
  awardType: 'certificate' as const,
  earnedAt: '2026-09-02',
  qrToken: TOKEN,
  // The renderer fails closed unless the URL AGREES with the token, so a
  // realistic fixture has to carry the matching registry URL - a null here
  // suppresses the QR for a reason that has nothing to do with the library.
  verifyUrl: `https://www.proaudiotrainingacademy.com/registry/${TOKEN}`,
};

describe('certificate QR — dead in every build until 2026-09-13', () => {
  test('qrcode is a DIRECT dependency, not merely transitive', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.ok(
      pkg.dependencies?.qrcode,
      'qrcode must stay in dependencies: as a transitive-only package it can vanish ' +
        'whenever react-native-qrcode-svg changes its tree, and the literal require in ' +
        'optionalModule would then fail to RESOLVE, taking the whole bundle down with it.',
    );
  });

  test('optionalModule has a LITERAL require row — the only thing Metro keys on', () => {
    const src = readFileSync(
      new URL('../src/features/tools/capture/optionalModule.ts', import.meta.url),
      'utf8',
    );
    assert.match(
      src,
      /qrcode:\s*\(\)\s*=>\s*require\('qrcode'\)/,
      "the literal require('qrcode') row is what makes Metro bundle the package; without " +
        'it optionalModule falls through to eval("require") and resolves null on device.',
    );
  });

  test('optionalModule actually hands back a usable library', () => {
    const lib = optionalModule<QrLib>('qrcode');
    assert.ok(lib, 'optionalModule returned null — this is exactly the shipped failure');
    assert.equal(typeof lib!.create, 'function');
  });

  test('the library produces a matrix of the shape certificateHtml expects', () => {
    const lib = require_('qrcode') as QrLib;
    const matrix = lib.create('https://www.proaudiotrainingacademy.com/registry/abc', {
      errorCorrectionLevel: 'M',
    }).modules;
    assert.ok(matrix.size >= 21, `a QR is at least 21 modules square, got ${matrix.size}`);
    // The three finder patterns are solid dark at those corners of the matrix —
    // if these read light, whatever came back is not a QR code.
    assert.ok(matrix.get(0, 0), 'top-left finder pattern must be dark');
    assert.ok(matrix.get(0, matrix.size - 1), 'top-right finder pattern must be dark');
    assert.ok(matrix.get(matrix.size - 1, 0), 'bottom-left finder pattern must be dark');
  });

  test('buildQrSvg turns that matrix into real ink, not an empty frame', () => {
    const lib = require_('qrcode') as QrLib;
    const svg = buildQrSvg('https://www.proaudiotrainingacademy.com/registry/abc', (url: string) =>
      lib.create(url, { errorCorrectionLevel: 'M' }).modules,
    );
    assert.match(svg, /^<svg/, 'buildQrSvg must return an <svg> element');
    assert.ok(svg.length > 200, `a real QR is not a handful of bytes (got ${svg.length})`);
  });

  test('END TO END: the rendered document carries a QR and says "Scan to verify"', () => {
    const html = buildCertificateHtml(FIELDS);
    assert.ok(
      html.includes('Scan to verify'),
      'the document fell back to the no-QR label — this is the exact defect: it reads ' +
        '"Verification unavailable" whenever the qrcode library fails to load.',
    );
    assert.ok(!html.includes(FALLBACK_PANEL), 'the blank fallback panel must not be rendered');
    assert.ok(
      html.includes('aria-label="Open the public credential registry"'),
      'the QR must be the linked, labelled anchor',
    );
  });

  test('fail-closed still holds: no credential token means no QR, not a broken one', () => {
    const html = buildCertificateHtml({ ...FIELDS, qrToken: null, verifyUrl: null });
    assert.ok(html.includes(FALLBACK_PANEL), 'a tokenless certificate must show the fallback panel');
    assert.ok(!html.includes('Scan to verify'), 'and must never invite a scan it cannot honour');
  });

  test('a working library does NOT loosen the URL/token agreement rule', () => {
    // The library being reachable is exactly what makes this worth re-pinning:
    // until today the null factory suppressed every QR, so this guard had
    // nothing to do. Now it is the only thing standing between a printed,
    // scannable code and a registry URL that does not match the credential.
    const html = buildCertificateHtml({
      ...FIELDS,
      verifyUrl: 'https://www.proaudiotrainingacademy.com/registry/00000000-0000-4000-8000-000000000000',
    });
    assert.ok(html.includes(FALLBACK_PANEL), 'a URL that disagrees with the token must render no QR');
    assert.ok(!html.includes('Scan to verify'), 'and must not invite a scan of the wrong credential');
  });
});
