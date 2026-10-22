/**
 * Owner 2026-10-22: one name everywhere — "Academy membership". The retired
 * "Reference Mode / Full Academy Mode / ACADEMY MODE" wording must not appear
 * in any string the app shows (code comments may still mention it as history).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = join(import.meta.dirname, '..', 'src');
const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !p.includes(`${join('src', 'dev')}`)) files.push(p);
  }
};
walk(SRC);
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const MODE = /(['"`])[^'"`\n]*\b(academy mode|reference mode)\b[^'"`\n]*\1/i;

describe('no "Academy Mode" / "Reference Mode" wording in shown text', () => {
  it('no string literal in src uses the retired mode names', () => {
    const hits = files.filter((f) => MODE.test(stripComments(readFileSync(f, 'utf8').replace(/\r\n/g, '\n'))));
    assert.deepEqual(hits, []);
  });
  it('the replacements are in place', () => {
    const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\r\n/g, '\n');
    assert.match(read('lib/copy.ts'), /Common Mistakes are included with Academy membership\./);
    assert.match(read('lib/copy.ts'), /upgradePhrase: 'Upgrade to Academy membership\.'/);
    assert.equal((read('screens/courses/CourseSelectionScreen.tsx').match(/'🔒 MEMBERSHIP'/g) ?? []).length, 2);
    assert.match(read('screens/profile/ProfileScreen.tsx'), /: 'FREE ACCESS';/);
  });
});
