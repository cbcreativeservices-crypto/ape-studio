/**
 * Owner 2026-09-30: "fix the neg results to show error". An impossible
 * negative (frequency, time, distance, power…) is an ERROR, never a
 * wrong-signed answer; signed quantities (dB, voltage, temperature…) stay open.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NON_NEGATIVE_KINDS, negativeInput } from '../src/screens/lab/calc/calcUnits.ts';

const fields = [
  { key: 'f', name: 'FREQUENCY', quantity: 'frequency' as const },
  { key: 'g', name: 'GAIN', quantity: 'db' as const },
  { key: 't', name: 'TEMPERATURE', quantity: 'temperature' as const },
];

test('a negative physical input is flagged by name', () => {
  assert.equal(negativeInput({ inputs: ['f'] }, { f: -100 }, fields)?.name, 'FREQUENCY');
  assert.equal(negativeInput({ inputs: ['f'] }, { f: 100 }, fields), null);
  assert.equal(negativeInput({ inputs: ['f'] }, { f: 0 }, fields), null); // zero is the formulas' own business
});

test('signed quantities stay open', () => {
  assert.equal(negativeInput({ inputs: ['g', 't'] }, { g: -6, t: -10 }, fields), null);
  for (const k of ['db', 'spl', 'voltage', 'current', 'temperature', 'angle', 'cents', 'ratio', 'number', 'percent'] as const)
    assert.ok(!NON_NEGATIVE_KINDS.has(k), k);
});

test('both calculator screens route the error through runCompute with their fields', () => {
  const ws = readFileSync('src/screens/lab/calc/CalcWorkspaceScreen.tsx', 'utf8');
  const run = readFileSync('src/screens/lab/calc/CalcWorkflowRunScreen.tsx', 'utf8');
  assert.match(ws, /runCompute\(fn, values, fields\)/);
  assert.match(run, /runCompute\(resolved\?\.fn \?\? null, values, fields\)/);
  assert.match(ws, /can’t be negative — enter a positive value/);
  const panel = readFileSync('src/screens/lab/calc/calcPanel.tsx', 'utf8');
  assert.match(panel, /if \(neg\) return \{[^}]*computeError: true, negativeField: neg\.name \}/);
});
