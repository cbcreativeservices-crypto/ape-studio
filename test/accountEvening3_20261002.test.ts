/**
 * ACCOUNT + COMMERCE — evening toddler hunt, PASS 3 (final, 2026-10-02).
 *
 * Source-reading (the screen needs React Native). Failed against the pre-fix
 * file (R2).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

test('employer interests: a FAILED read of the stored choices never offers chips that would overwrite them', () => {
  const s = read('src/screens/profile/EmployerSection.tsx');
  // A null (failed) read is recorded, not left as the empty `picked` it seeds.
  assert.match(s, /if \(mine\) setPicked\(mine\);\s*else setInterestsFailed\(true\);/);
  // Each save writes a kind's WHOLE list from `picked`, so the chips render
  // only once the stored choices are known; the failure says so instead.
  assert.match(s, /\{verified && tax && !interestsFailed \? \(\s*<>\s*<Row kind="area"/);
  assert.match(s, /\{verified && tax && interestsFailed \? \(\s*<Text style=\{styles\.warn\}>/);
  // No other chip render path.
  assert.equal((s.match(/<Row kind="area"/g) ?? []).length, 1);
});
