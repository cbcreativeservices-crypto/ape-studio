/**
 * Owner 2026-09-30: "instead of 10 expandable bullet list points - show the
 * main calculator screen into 2 column of 5 rows of containers -> 1 each for
 * each of the 10." A container opens its calculators in a centred popup.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const s = readFileSync('src/screens/lab/calc/CalcLabScreen.tsx', 'utf8');

test('ten categories, each with calculators → a 2 × 5 grid', () => {
  const reg = readFileSync('src/screens/lab/calc/registry.ts', 'utf8');
  const meta = reg.slice(reg.indexOf('export const SECTION_META'), reg.indexOf('];', reg.indexOf('export const SECTION_META')));
  const ids = [...meta.matchAll(/\{ id: '(\w+)'/g)].map((m) => m[1]);
  assert.equal(ids.length, 10);
  assert.match(s, /catFrame: \{\s*width: '48\.5%'/);
});

test('no accordion; a tap opens a centred popup', () => {
  assert.doesNotMatch(s, /openSecs/);
  assert.match(s, /onPress=\{\(\) => setOpenSec\(sec\.id\)\}/);
  assert.match(s, /popBackdrop: \{[^}]*alignItems: 'center', justifyContent: 'center'/);
});
