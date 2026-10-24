/**
 * credentialsCommunity — overnight toddler pass 1 (2026-10-24).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** The body of `const <name> = useCallback(async () => { ... }, [...]);`. */
function handlerBody(src: string, name: string): string {
  const start = src.indexOf(`const ${name} = useCallback(async () => {`);
  assert.ok(start >= 0, `${name} not found`);
  const end = src.indexOf('\n  }, [', start);
  assert.ok(end > start, `${name} end not found`);
  return src.slice(start, end);
}

/**
 * #1 — A SHARE result from a closed certificate lands on the NEXT one.
 * SHARE IMAGE can run for seconds (two reads, a WebView load with an 8 s
 * timeout, a paint beat). Close the certificate window meanwhile and open
 * another: the row that started the share is gone, but its late
 * "Could not share the certificate image…" still went to the wall's
 * setMessage and appeared under a certificate the learner never touched.
 * A row that has unmounted must not report.
 */
test('#1 CredentialShareRow: no late result message after the row has unmounted', () => {
  const row = read('src/features/credentials/CredentialShareRow.tsx');
  assert.match(row, /const mounted = useRef\(false\);/);
  assert.match(row, /mounted\.current = true;\s*\n\s*return \(\) => \{\s*\n\s*mounted\.current = false;/);
  assert.match(row, /const say = useCallback\(\s*\(text: string \| null\) => \{\s*\n\s*if \(mounted\.current\) onMessage\(text\);/);
  for (const name of ['copyNow', 'linkNow', 'qrNow', 'imageNow']) {
    const body = handlerBody(row, name);
    assert.doesNotMatch(body, /onMessage\(/, `${name} reports straight to onMessage`);
    assert.match(body, /say\(/, `${name} must report through say()`);
  }
});
