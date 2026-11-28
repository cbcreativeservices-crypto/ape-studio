/**
 * Owner 2026-11-27 ("5 seconds"): a cold launch waits up to 5 s behind the
 * splash for a newer update, so a brand-new install opens today's app.
 * Fingerprint-changing, so it rides the 1.0.1 store build only
 * (docs/APE_NEXT_BUILD_CHECKLIST.md item 8; added 2026-11-28 after the
 * readiness review found it missing from app.json).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8').replace(/\r\n/g, '\n'));

describe('1.0.1 startup update wait (owner: 5 seconds)', () => {
  it('app.json updates: ON_LOAD, 5000 ms fallback, embedded update kept, url unchanged', () => {
    const u = app.expo.updates;
    assert.equal(u.url, 'https://u.expo.dev/72f69470-fe12-4ecb-a10b-e8331d53812d');
    assert.equal(u.checkAutomatically, 'ON_LOAD');
    assert.equal(u.fallbackToCacheTimeout, 5000);
    assert.equal(u.useEmbeddedUpdate, true);
  });
  it('runtime policy stays fingerprint', () => {
    assert.deepEqual(app.expo.runtimeVersion, { policy: 'fingerprint' });
  });
});
