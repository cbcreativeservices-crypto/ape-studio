// Calculators share ONE intro card (owner 2026-11-10: "the what you are learning
// pop up shows every time for every calculation … it would show 166 times").
// The card shows once per device per intro TEXT, so the workspace intro must
// not name the calculation or its example.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync('src/screens/lab/calc/calcScreenGuides.ts', 'utf8').replace(/\r\n/g, '\n');

describe('calculator intro card shows once', () => {
  it('every workspace guide uses the shared constant', () => {
    assert.match(SRC, /intro: CALC_WORKSPACE_INTRO,/);
  });
  it('the shared intro is fixed text, with nothing per calculation in it', () => {
    const m = SRC.match(/export const CALC_WORKSPACE_INTRO = \{([\s\S]*?)\} as const;/);
    assert.ok(m, 'CALC_WORKSPACE_INTRO not found');
    assert.doesNotMatch(m[1], /\$\{|`/);
  });
});
