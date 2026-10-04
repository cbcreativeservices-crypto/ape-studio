/**
 * Owner answers 2026-09-29 on Start Here:
 *  - the FIRST app open lands on Start Here; every later open on Glossary;
 *  - its word links open full glossary entries WITHOUT spending weekly lookups.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STARTER_TERMS } from '../src/features/startHere/startHereContent.ts';
import { starterGlossaryEntry } from '../src/features/startHere/startHereGlossary.ts';

test('every linked starter word has a built-in full entry', () => {
  for (const t of STARTER_TERMS) {
    if (!t.glossary) continue;
    const e = starterGlossaryEntry(t.glossary);
    assert.ok(e, `no built-in entry for "${t.glossary}"`);
    assert.ok(e!.definition.length > 20 && e!.plain_english.length > 10);
  }
});

test('the Start Here popup passes the built-in entry, and a preloaded entry skips the metered read', () => {
  const bits = readFileSync('src/screens/startHere/bits.tsx', 'utf8');
  assert.match(bits, /preloaded=\{starterGlossaryEntry\(full\)\}/);
  const popup = readFileSync('src/features/glossary/GlossaryTermPopup.tsx', 'utf8');
  const pre = popup.indexOf('if (preloaded) {');
  assert.ok(pre > 0 && pre < popup.indexOf('readOnce(hit.id, via)'), 'preloaded returns before the gateway call');
});

test('every open lands on Glossary, the first one included (owner 2026-10-04)', () => {
  // Replaces the 2026-09-29 "first open lands on Start Here" — see
  // test/startHereDecisions_20261004.test.ts for the receipt.
  const home = readFileSync('src/screens/courses/CourseSelectionScreen.tsx', 'utf8');
  assert.match(home, /if \(!sessionLanded\) \{\s*target = glossaryIdx;/);
  assert.doesNotMatch(home, /isFirstAppOpen|firstOpen/);
});
