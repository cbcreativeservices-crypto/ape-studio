/**
 * credentialsCommunity — overnight toddler pass 2 (2026-10-24).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/**
 * #1 — CredentialWall DOWNLOAD CERTIFICATE: a late failure lands under the
 * NEXT certificate. exportCertificate makes two network reads and a PDF
 * render before any sheet appears (seconds offline). Close the certificate
 * meanwhile and open another: the late "Could not prepare the certificate"
 * went into the wall's shared message slot under a certificate the learner
 * never tried to download. Same class night 1 closed in CredentialShareRow.
 */
test('#1 CredentialWall: a download result reports only while its certificate is still open', () => {
  const src = read('src/screens/achievements/CredentialWall.tsx');
  const start = src.indexOf('const download = useCallback(async () => {');
  assert.ok(start >= 0, 'download not found');
  const end = src.indexOf('\n  }, [open]);', start);
  assert.ok(end > start, 'download end not found');
  const body = src.slice(start, end);
  // The open certificate is tracked in a ref the late result can read.
  assert.match(src, /openIdRef\.current = open \? String\(open\.id\) : null;/);
  // The id is captured BEFORE the await…
  const capture = body.indexOf('const forId = String(open.id);');
  const awaitAt = body.indexOf('await exportCertificate(');
  assert.ok(capture >= 0 && capture < awaitAt, 'forId must be captured before the export starts');
  // …and checked after it, before any message is set.
  const guard = body.indexOf('if (openIdRef.current !== forId) return;');
  const say = body.indexOf('setMessage(');
  assert.ok(guard > awaitAt, 'the open-certificate check must follow the export');
  assert.ok(say > guard, 'no message may be set before the open-certificate check');
});
