/**
 * LABS B — evening toddler hunt, pass 1 (2026-10-02). Receipts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// 1. Pattern Gallery: a name or note typed and then left by ‹ / Colour › /
//    Duplicate (the field unmounts while focused, so onEndEditing never
//    reaches JS) was silently dropped. Every keystroke is now held and written
//    when the field leaves the screen.
test('gallery name/notes fields hold typed text and flush it when OPEN mode is left', () => {
  const src = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const inputs = src.match(/<TextInput key=\{`[nt]\$\{current\.id\}`\}[^\n]*/g) ?? [];
  assert.equal(inputs.length, 2, 'the two OPEN-mode fields');
  for (const line of inputs) {
    assert.match(line, /onChangeText=\{\(t\) => draft\(current\.id, '(name|notes)', t\)\}/, 'every keystroke is held');
    assert.match(line, /flushDrafts\(\)/, 'end of editing writes it');
  }
  // The held text is written when the field goes away (mode / pattern / unmount).
  assert.match(src, /useEffect\(\(\) => \{\s*if \(mode !== 'open' \|\| !currentId\) return;\s*return \(\) => flushRef\.current\(\);\s*\}, \[mode, currentId\]\);/);
  // …through the serialized latest-row edit chain, never a stale snapshot.
  const flush = src.slice(src.indexOf('const flushDrafts'), src.indexOf('const flushRef'));
  assert.match(flush, /editLatest\(d\.id,/);
});
