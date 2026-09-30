/**
 * The calculator's purple π FORMULA KEY popup is a CENTRED popup, never a
 * bottom sheet (owner rule: popups are centred, never pulldowns/bottom sheets).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const src = readFileSync('src/screens/lab/calc/FormulaKeyPopup.tsx', 'utf8').replace(/\r\n/g, '\n');

test('FormulaKeyPopup backdrop centres the card', () => {
  assert.doesNotMatch(src, /backdrop: \{[^}]*flex-end/, 'no bottom-anchored backdrop');
  assert.match(src, /backdrop: \{[^}]*justifyContent: 'center'/);
  assert.match(src, /backdrop: \{[^}]*alignItems: 'center'/);
});

test('FormulaKeyPopup fades in rather than sliding up', () => {
  assert.match(src, /animationType="fade"/);
  assert.doesNotMatch(src, /animationType="slide"/);
});

test('FormulaKeyPopup card is rounded and bordered on all sides', () => {
  assert.match(src, /sheet: \{[^}]*borderRadius: \d+/);
  assert.match(src, /sheet: \{[^}]*borderWidth: 1/);
  assert.match(src, /sheet: \{[^}]*maxWidth: 520/);
  assert.doesNotMatch(src, /borderTopLeftRadius|borderTopWidth/);
});
