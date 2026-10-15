/**
 * Calculator number fields open the NUMBER keypad, never the letter keyboard
 * (owner 2026-10-14). iOS 'numbers-and-punctuation' does not exist on Android,
 * which fell back to the full letter keyboard — so every calc number field goes
 * through calcKeyboard(), which gives Android 'numeric'.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CALC = join(process.cwd(), 'src', 'screens', 'lab', 'calc');
const read = (f: string) => readFileSync(join(CALC, f), 'utf8');

test('calcKeyboard gives Android the number pad', () => {
  const src = read('calcPanel.tsx');
  assert.match(src, /export function calcKeyboard\(\)[\s\S]*?Platform\.OS === 'ios' \? 'numbers-and-punctuation' : 'numeric'/);
});

test('calc number fields use calcKeyboard(), never a letter keyboard', () => {
  for (const f of ['calcPanel.tsx', 'CalcProjectsScreen.tsx']) {
    const src = read(f);
    const types = [...src.matchAll(/keyboardType=\{?([^\s}>]+)/g)].map((m) => m[1]);
    assert.ok(types.length > 0, `${f} has a number field`);
    for (const t of types) assert.equal(t, 'calcKeyboard()', `${f}: keyboardType ${t}`);
  }
});
