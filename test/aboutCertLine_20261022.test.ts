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
    assert.match(about, /'List your credentials in the Pro Registry and employers can verify them online\. /);
    assert.match(read('lib/copy.ts'), /list them in the Pro Registry and employers can verify them online\./);
  });
  it('drops the blanket "verifiable for life" promise', () => {
    assert.doesNotMatch(about, /verifiable for life/);
  });
  it('keeps the no-membership promise', () => {
    assert.match(about, /Current membership is not required to keep your transcript in the registry\./);
  });
});
