/**
 * Owner H-A 2026-10-22: employers can verify a credential only once it is
 * listed in the Pro Registry. The About sheet must say so, in the same words
 * as the landing's certificate line, and must not promise blanket verification.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(import.meta.dirname, '..', 'src', p), 'utf8').replace(/\r\n/g, '\n');

describe('About sheet certificate line matches the approved wording', () => {
  const about = read('screens/about/AboutHomeSheet.tsx');
  it('names the Registry listing step', () => {
    assert.match(about, /'List your credentials in the Pro Registry and employers can verify them online\.'/);
    assert.match(read('lib/copy.ts'), /list them in the Pro Registry and employers can verify them online\./);
  });
  it('drops the blanket "verifiable for life" promise', () => {
    assert.doesNotMatch(about, /verifiable for life/);
  });
  // Owner 2026-10-22: membership is not needed to stay listed, be found or be
  // verified (the DB registry/verify functions never check membership).
  it('says plainly that an ongoing membership is not required to stay listed, found and verified', () => {
    assert.match(
      about,
      /'An ongoing membership is not required\. Your credentials stay in the registry, and employers can still find and verify them, whether or not you keep your membership\.'/,
    );
  });
});

// Owner 2026-10-22: the same promise where a member looks for it — the cancel
// help answer and the Pro Registry intro on the paywall.
describe('membership is not needed to stay listed — said in help and on the registry intro', () => {
  it('Help "How do I cancel?" says listed certificates stay listed and verifiable', () => {
    assert.match(
      read('features/help/helpContent.ts'),
      /if you listed them in the Pro Registry, they stay listed, and employers can still find and verify them after your membership ends\./,
    );
  });
  it('the Pro Registry intro says the listing stays whether or not you keep your membership', () => {
    assert.match(
      read('lib/copy.ts'),
      /Your listing and certificates stay in the registry whether or not you keep your membership\.'/,
    );
  });
});
