/**
 * Calculator answers (G6, 2026-11-05).
 *
 *  1. A row whose value cycles through units must not name a unit in its label:
 *     a tap put "0.0004856 min" under "DELAY (µs)". The labels must also stay
 *     unique, because the tap count is kept by label: two rows called DELAY
 *     would change unit together.
 *  2. A result value is a control only if it has another unit to show. A
 *     one-unit row (dB, °, samples) must not be pressable or promise a change,
 *     and a cycling row carries the same ⇄ cue as the input chips.
 *
 * Part 2 evaluates the screen's real JSX for that value against a stub
 * createElement, since the whole screen cannot load outside React Native.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { outputUnits } = await import('../src/screens/lab/calc/calcUnits.ts');
const { fitValue } = await import('../src/theme/legibility.ts');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screen = readFileSync(path.join(root, 'src/screens/lab/calc/CalcWorkspaceScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');

const compute = (key: string, v: Record<string, number>) => {
  const f = getWorkspace('distdelay')!.functions.find((x) => x.key === key);
  assert.ok(f, key);
  return f!.compute(v as never);
};
const CASES: [string, Record<string, number>, string, string][] = [
  ['distToDelay', { dist: 10, temp: 20 }, 'SAME DELAY', 'us'],
  ['delayToDist', { delay: 0.01, temp: 20 }, 'SAME DISTANCE', 'ft'],
  ['smpToTime', { smp: 480, sr: 48000, temp: 20 }, 'SAME TIME', 'us'],
];

for (const [key, v, label, unit] of CASES) {
  test(`${key}: "${label}" still opens in ${unit}, and no label names a unit a tap can leave`, () => {
    const rows = compute(key, v);
    const row = rows.find((o) => o.label === label);
    assert.ok(row && 'value' in row, label);
    assert.equal(row.unit, unit);
    assert.equal(row.chainable, false);
    for (const o of rows) {
      if (!('value' in o)) continue;
      const units = outputUnits(o.quantity, o.unit);
      if (units.length < 2) continue;
      for (const u of units) assert.ok(!o.label.includes(`(${u.label})`), `${o.label} names ${u.label}`);
    }
  });

  test(`${key}: labels are unique, so a tap cycles one row only`, () => {
    const labels = compute(key, v).map((o) => o.label);
    assert.deepEqual(labels, [...new Set(labels)]);
  });
}

type El = { type: string; props: Record<string, any>; children: unknown[] };

/** Runs the screen's own JSX for the value, for an output `o`. */
function renderValue(o: { label: string; quantity: string; unit?: string }) {
  const start = screen.indexOf('{outputUnits(o.quantity, o.unit).length > 1 ? (');
  assert.ok(start > 0, 'the value must branch on how many units it can show');
  const end = screen.indexOf('{sendTakers.get(o.label)', start);
  const jsx = screen.slice(start + 1, screen.lastIndexOf('}', end));
  const js = ts.transpileModule(`export const run = () => (${jsx});`, {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'h', module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: 'value.tsx',
  }).outputText;
  const exports: { run?: () => El } = {};
  const h = (type: string, props: Record<string, any> | null, ...children: unknown[]): El => ({ type, props: props ?? {}, children });
  const styles = new Proxy({}, { get: (_, k) => String(k) });
  const counts: Record<string, number> = {};
  const setOutUnit = (f: (m: Record<string, number>) => Record<string, number>) => Object.assign(counts, f(counts));
  new Function('exports', 'h', 'Pressable', 'Text', 'styles', 'o', 'outputUnits', 'formatOut', 'fitValue', 'setOutUnit', js)(
    exports, h, 'Pressable', 'Text', styles, o, outputUnits, () => '12 ms', fitValue, setOutUnit,
  );
  return { el: exports.run!(), counts };
}
const flat = (el: El): string => el.children.map((c) => (typeof c === 'object' && c ? flat(c as El) : String(c))).join('');
const textOf = (el: El): El => (el.type === 'Text' ? el : (el.children.find((c) => typeof c === 'object') as El));

test('a one-unit value is plain text with no press action and no promise', () => {
  for (const [quantity, unit] of [['db', undefined], ['angle', undefined], ['samples', undefined], ['spl', 'dba']]) {
    const { el } = renderValue({ label: 'X', quantity: quantity!, unit });
    assert.equal(el.type, 'Text', quantity);
    assert.equal(el.props.onPress, undefined);
    assert.equal(el.props.accessibilityLabel, undefined);
    assert.ok(!flat(el).includes('⇄'));
  }
});

test('a value with more units is a control with the ⇄ cue, and a press counts for that row', () => {
  const { el, counts } = renderValue({ label: 'SAME DELAY', quantity: 'time', unit: 'us' });
  assert.equal(el.type, 'Pressable');
  assert.match(el.props.accessibilityLabel, /tap to change the display unit/);
  assert.ok(flat(el).endsWith(' ⇄'));
  el.props.onPress();
  assert.deepEqual(counts, { 'SAME DELAY': 1 });
});

test('both faces stay on one line, never under 9 pt, inside a width-limited row', () => {
  for (const o of [{ label: 'A', quantity: 'db' }, { label: 'B', quantity: 'time', unit: 'ms' }]) {
    const t = textOf(renderValue(o).el);
    assert.equal(t.props.numberOfLines, 1);
    assert.equal(t.props.adjustsFontSizeToFit, true);
    assert.ok(t.props.minimumFontScale * 19 >= 9);
  }
  assert.match(screen, /resultRight: \{[^}]*maxWidth/);
});
