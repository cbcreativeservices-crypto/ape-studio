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
  assert.ok(pre > 0 && pre < popup.indexOf('fetchDefinitionViaGateway(hit.id)'), 'preloaded returns before the gateway call');
});

test('Start Here is the landing only on the first app open; Glossary after', () => {
  // Owner 2026-09-29 (revised): "The intro lab should be the default spot only
  // for the first time the user opens the app."
  const home = readFileSync('src/screens/courses/CourseSelectionScreen.tsx', 'utf8');
  assert.match(home, /target = firstOpen && startHereIdx >= 0 \? startHereIdx : glossaryIdx;/);
  assert.match(home, /isFirstAppOpen\(\)/);
  const fo = readFileSync('src/features/startHere/firstOpen.ts', 'utf8');
  // The flag is written on the first read, so the NEXT launch is not first.
  assert.ok(fo.indexOf('if (seen) return false;') < fo.indexOf("setItem(FIRST_OPEN_KEY, '1')"));
  assert.match(fo, /seenHomeBefore/);
});
