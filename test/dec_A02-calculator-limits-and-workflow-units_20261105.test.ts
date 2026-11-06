/**
 * Decision 24 and the section 5 Calculator Workflows bug (2026-11-05).
 *
 *  1. D53, limits chosen from the app's existing spans:
 *       compressor threshold RESULT   not below -150 dBFS
 *       amplifier voltage gain        0 to 100 dB
 *     A solved threshold of -6068 dBFS and a 500 dB amp both printed as numbers.
 *     The limits are written out here so this file fails if the shared constant
 *     drifts from what the owner approved.
 *  2. A workflow answer row with one unit (dB, samples) has nothing to change:
 *     no press action, no 'tap to change' promise, no ⇄. A row with more units
 *     keeps all three, as the single calculator does.
 *
 * Part 2 evaluates the runner's real JSX for the rows against a stub
 * createElement, since the whole screen cannot load outside React Native.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { CALC_LIMITS, outputUnits } = await import('../src/screens/lab/calc/calcUnits.ts');
const { COMP_LEVEL_MIN_DB, COMP_LEVEL_MAX_DB } = await import('../src/screens/lab/calc/workspaces/dynamics.ts');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runner = readFileSync(path.join(root, 'src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');

type Values = Record<string, number>;
const fnOf = (ws: string, key: string) => {
  const f = getWorkspace(ws)!.functions.find((x) => x.key === key);
  assert.ok(f, `${ws}/${key}`);
  return f!;
};
/** The order runCompute uses: refuse first, compute only when it passes. */
const evaluate = (ws: string, key: string, values: Values) => {
  const fn = fnOf(ws, key);
  const why = fn.refuse ? fn.refuse(values) : null;
  return why ? { why, outputs: [] } : { why: null, outputs: fn.compute(values) };
};
const thr = (values: Values) => evaluate('compressor', 'thrForGr', values);
const limiter = (values: Values) => evaluate('limiter', 'threshold', values);
const num = (outputs: { label: string }[], label: string) => (outputs.find((o) => o.label === label) as { value: number }).value;

describe('a solved compressor threshold is refused below -150 dBFS', () => {
  it('the limits are the ones chosen', () => {
    assert.deepEqual(CALC_LIMITS.compLevelDb, [-150, 30]);
    assert.equal(COMP_LEVEL_MIN_DB, -150);
    assert.equal(COMP_LEVEL_MAX_DB, 30);
  });
  it('the report case: -6068 dBFS is words, not a number', () => {
    const r = thr({ inLvl: -8, ratio: 1.01, targetGr: 60 });
    assert.match(r.why ?? '', /−150 dBFS/);
    assert.ok(!/6068|6060/.test(r.why ?? ''));
    assert.equal(r.outputs.length, 0);
  });
  it('holds at the edge', () => {
    const r = thr({ inLvl: -90, ratio: 2, targetGr: 30 });
    assert.equal(r.why, null);
    assert.equal(num(r.outputs, 'SET THRESHOLD TO'), -150);
    assert.match(thr({ inLvl: -90, ratio: 2, targetGr: 30.01 }).why ?? '', /−150 dBFS/);
  });
  it('a ratio barely over 1:1 is words too', () => {
    assert.match(thr({ inLvl: -8, ratio: 1 + 1e-15, targetGr: 3 }).why ?? '', /−150 dBFS/);
  });
  it('an ordinary setting answers exactly as before', () => {
    const r = thr({ inLvl: -8, ratio: 4, targetGr: 9 });
    assert.equal(r.why, null);
    assert.equal(num(r.outputs, 'SET THRESHOLD TO'), -20);
    assert.equal(num(r.outputs, 'INPUT WILL SIT ABOVE IT BY'), 12);
  });
  it('1:1 and below keep their own words', () => {
    assert.equal(thr({ inLvl: -8, ratio: 1, targetGr: 3 }).outputs[0]!.label, 'NO THRESHOLD');
    assert.equal(thr({ inLvl: -8, ratio: 0.5, targetGr: 3 }).outputs[0]!.label, 'NOT A COMPRESSOR RATIO');
  });
  it('the 60 dB target reduction limit still speaks first', () => {
    assert.match(thr({ inLvl: -8, ratio: 1.01, targetGr: 500 }).why ?? '', /0 to 60 dB/);
  });
});

describe('amplifier voltage gain is refused outside 0 to 100 dB', () => {
  const QUIET = { pwr: 1, z: 8, margin: 3 };
  it('the limit is the one chosen', () => assert.deepEqual(CALC_LIMITS.ampGainDb, [0, 100]));
  it('holds at both edges', () => {
    assert.equal(limiter({ ...QUIET, ampGain: 0 }).why, null);
    assert.equal(limiter({ ...QUIET, ampGain: 100 }).why, null);
    for (const ampGain of [100.01, 500, 1e7, -0.01]) assert.match(limiter({ ...QUIET, ampGain }).why ?? '', /0 to 100 dB/);
  });
  it('a typical amp answers exactly as before', () => {
    const r = limiter({ pwr: 500, z: 8, ampGain: 32, margin: 3 });
    assert.equal(r.why, null);
    assert.ok(Math.abs(num(r.outputs, 'THRESHOLD (dBu)') - (20 * Math.log10(Math.sqrt(4000) / 0.7746) - 35)) < 0.01);
  });
});

type El = { type: string; props: Record<string, any>; children: unknown[] };

/** Runs the runner's own JSX for the answer rows, on one output `o`. */
function renderRow(o: Record<string, unknown>) {
  const start = runner.indexOf('cur.result.outputs.map((o, oi) =>');
  assert.ok(start > 0, 'the runner must map its answer rows');
  const tail = runner.slice(start, runner.indexOf('<Text style={styles.formula}>', start));
  const close = tail.indexOf('\n                    )\n                  )}');
  assert.ok(close > 0, 'the end of the rows');
  const js = ts.transpileModule(`export const run = (cur) => (${tail.slice(0, close)}\n);`, {
    compilerOptions: { jsx: ts.JsxEmit.React, jsxFactory: 'h', module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: 'rows.tsx',
  }).outputText;
  const exports: { run?: (cur: unknown) => El[] } = {};
  const h = (type: string, props: Record<string, any> | null, ...children: unknown[]): El => ({ type, props: props ?? {}, children });
  const styles = new Proxy({}, { get: (_, k) => String(k) });
  const outUnit: Record<string, number> = {};
  const setOutUnit = (f: (m: Record<string, number>) => Record<string, number>) => Object.assign(outUnit, f(outUnit));
  const formatOutput = () => '12 ms';
  new Function('exports', 'h', 'Pressable', 'Text', 'View', 'styles', 'idx', 'outUnit', 'setOutUnit', 'outputUnits', 'formatOutput', js)(
    exports, h, 'Pressable', 'Text', 'View', styles, 2, outUnit, setOutUnit, outputUnits, formatOutput,
  );
  return { el: exports.run!({ result: { outputs: [o] } })[0]!, outUnit };
}
const flat = (el: El): string => el.children.map((c) => (typeof c === 'object' && c ? flat(c as El) : String(c))).join('');

describe('a workflow answer row', () => {
  it('with one unit has no press action, no promise and no ⇄', () => {
    for (const [quantity, unit] of [['db', undefined], ['angle', undefined], ['samples', undefined], ['spl', 'dba']]) {
      const { el } = renderRow({ label: 'GAIN REDUCTION', value: 9, quantity, unit });
      assert.equal(outputUnits(quantity as never, unit).length, 1, quantity);
      assert.equal(el.type, 'View', quantity);
      assert.equal(el.props.onPress, undefined);
      assert.equal(el.props.accessibilityRole, undefined);
      assert.equal(el.props.accessibilityLabel, undefined);
      assert.ok(!flat(el).includes('⇄'));
      assert.ok(flat(el).includes('12 ms'));
    }
  });
  it('with more units is a control with the promise and the ⇄, and a press counts for that row', () => {
    const { el, outUnit } = renderRow({ label: 'DELAY', value: 0.01, quantity: 'time', unit: 'ms' });
    assert.equal(el.type, 'Pressable');
    assert.equal(el.props.accessibilityRole, 'button');
    assert.match(el.props.accessibilityLabel, /^DELAY 12 ms — tap to change the display unit$/);
    assert.ok(flat(el).endsWith('12 ms ⇄'));
    el.props.onPress();
    assert.deepEqual(outUnit, { '2:DELAY': 1 });
  });
  it('a words row stays words', () => {
    const { el } = renderRow({ label: 'WHAT THIS IS', text: 'A note.' });
    assert.equal(el.type, 'Text');
    assert.equal(el.props.onPress, undefined);
  });
});
