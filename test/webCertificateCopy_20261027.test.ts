/**
 * D15 (2026-10-27) — the website draws certificates with a VERBATIM copy of
 * the app's renderer, under web/lib/certificate/ (the web app is built from
 * web/ alone, with its Turbopack root pinned there, so it cannot import ../src).
 *
 * The copy keeps the app's relative layout (credentials/ next to
 * tools/capture/), so `certificateHtml.ts` resolves its `optionalModule` import
 * to the web seam there — the app's optionalModule has literal requires of
 * expo-print / react-native-view-shot that no Next bundle can resolve.
 *
 * If the app's certificate changes, the website must change with it: copy
 * src/features/credentials/certificateHtml.ts and certificateAssets.ts over
 * the two web files. This test fails until you do.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) =>
  readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('web certificate renderer is a verbatim copy of the app renderer', () => {
  for (const file of ['certificateHtml.ts', 'certificateAssets.ts']) {
    test(file, () => {
      const app = read(`src/features/credentials/${file}`);
      const web = read(`web/lib/certificate/credentials/${file}`);
      assert.ok(
        app === web,
        `web/lib/certificate/credentials/${file} differs from src/features/credentials/${file} — copy it over.`,
      );
    });
  }

  test('the web seam supplies qrcode at the path the renderer imports', () => {
    assert.match(read('web/lib/certificate/credentials/certificateHtml.ts'), /from '\.\.\/tools\/capture\/optionalModule'/);
    const seam = read('web/lib/certificate/tools/capture/optionalModule.ts');
    assert.match(seam, /import \* as qrcode from "qrcode"/);
    assert.match(seam, /export function optionalModule/);
    assert.doesNotMatch(seam, /(require\(|from )['"](expo-|react-native)/, 'no native-only module may reach the web bundle');
  });

  test('qrcode and js-sha256 are direct web dependencies (else the QR silently vanishes)', () => {
    const pkg = JSON.parse(read('web/package.json'));
    assert.equal(pkg.dependencies?.qrcode, '1.5.4');
    assert.ok(pkg.dependencies?.['js-sha256']);
  });

  test('the renderer is only ever reached through import(), never a static import', () => {
    const gallery = read('web/components/CertificateGallery.tsx');
    assert.match(gallery, /import\("@\/lib\/certificate\/render"\)/);
    assert.doesNotMatch(gallery, /^import [^t].*lib\/certificate/m, 'a static value import would put ~520 KB on every page');
  });
});
