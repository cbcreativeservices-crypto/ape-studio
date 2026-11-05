import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/screens/startHere/StartHereTermsScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

// Definitions already end in their own period, so a label must not add a second one.
test('flipped flashcard label does not add a period after the definition', () => {
  assert.ok(src.includes('`${t?.term}: ${t?.def} Tap to see the word again`'));
  assert.ok(!src.includes('${t?.def}. Tap'));
});
