/**
 * Calculator bug pass 1 of 3 (2026-09-30 day) — regressions.
 *
 *  N1  the negative-input rule reaches physically non-negative fields that ride
 *      a signed kind (µF, channel counts, Q …) and LIST entries (a −30 min
 *      interval used to REDUCE a noise dose); signed fields stay open;
 *  C1  compressor "ratio for a target output" refuses targets no downward
 *      compressor can reach instead of printing −2.4:1;
 *  Z1  a 0 Ω speaker in an impedance list is an error, never silently dropped
 *      (a dead short used to report a safe 8 Ω load);
 *  S1  Sabine surface/coefficient lists of different lengths are announced;
 *  U1  'number' outputs that carry a physical unit name it in the label;
 *  W1  a capped account never spends a weekly calculation on an error;
 *  K1  the cap counter's status read is bounded.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const { negativeInput, isNonNegativeField } = await import('../src/screens/lab/calc/calcUnits.ts');
const read = (rel: string) => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const ws = (id: string) => {
  const w = getWorkspace(id);
  assert.ok(w, id);
  return w!;
};
const fn = (wsId: string, key: string) => {
  const f = ws(wsId).functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};
const field = (wsId: string, key: string) => {
  const f = ws(wsId).fields.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};

test('N1 — physically non-negative fields on signed kinds are flagged', () => {
  const nonNeg: [string, string][] = [
    ['electronics', 'cap'], ['electronics', 'ind'], ['electronics', 'rlist'], ['qbw', 'q'],
    ['compressor', 'ratio'], ['compressor', 'targetGr'], ['dose', 'doseMins'], ['spladd', 'count'],
    ['impedance', 'zlist'], ['impedance', 'z4'], ['cv70', 'taps'], ['sabine', 'surfaces'], ['sabine', 'coeffs'],
    ['complexz', 'capuF'], ['complexz', 'indmH'], ['pads', 'atten'], ['timecode', 'mins'], ['netaudio', 'channels'],
    ['micsens', 'mvpa'], ['rflink', 'freqMHz'], ['transloss', 'mass'], ['driver', 'qts'], ['critdist', 'q'],
  ];
  for (const [w, k] of nonNeg) assert.ok(isNonNegativeField(field(w, k)), `${w}.${k} must refuse negatives`);
  // Signed quantities stay open — levels, dBm, LUFS, semitones, SPL lists.
  const signed: [string, string][] = [
    ['compressor', 'thr'], ['compressor', 'inLvl'], ['rflink', 'ptx'], ['loudnorm', 'measured'],
    ['pitch', 'semi'], ['spladd', 'levels'], ['dose', 'doseLevels'], ['level', 'dbu'], ['vdrop', 'awg'],
  ];
  for (const [w, k] of signed) assert.ok(!isNonNegativeField(field(w, k)), `${w}.${k} is signed`);
});

test('N1 — negativeInput reads list entries and flagged numbers', () => {
  const dose = ws('dose');
  const doseNiosh = fn('dose', 'doseNiosh');
  assert.equal(negativeInput(doseNiosh, { doseLevels: [94, 100], doseMins: [90, -30] }, dose.fields)?.key, 'doseMins');
  assert.equal(negativeInput(doseNiosh, { doseLevels: [-5, 100], doseMins: [90, 30] }, dose.fields), null);
  const el = ws('electronics');
  assert.equal(negativeInput(fn('electronics', 'rcCutoff'), { r: 1000, cap: -1 }, el.fields)?.key, 'cap');
  assert.equal(negativeInput(fn('electronics', 'rcCutoff'), { r: 1000, cap: 1 }, el.fields), null);
});

test('C1 — compressor ratio for a target output refuses impossible targets', () => {
  const f = fn('compressor', 'ratioForOut');
  const ratio = f.compute({ thr: -20, inLvl: -8, targetOut: -17 }).find((o) => o.label.startsWith('REQUIRED RATIO'));
  assert.ok(ratio && 'value' in ratio);
  assert.equal(ratio.value, 4);
  assert.throws(() => f.compute({ thr: -20, inLvl: -8, targetOut: -25 })); // below threshold: was −2.4:1
  assert.throws(() => f.compute({ thr: -20, inLvl: -8, targetOut: -2 })); // louder than the input: was 0.67:1
  assert.throws(() => f.compute({ thr: -20, inLvl: -30, targetOut: -25 })); // input never crosses threshold
});

test('Z1 — a zero-ohm speaker is an error, not silently dropped', () => {
  const par = fn('impedance', 'parallel');
  assert.throws(() => par.compute({ zlist: [8, 0] }));
  assert.throws(() => fn('impedance', 'series').compute({ zlist: [8, 0] }));
  assert.throws(() => fn('impedance', 'seriesparallel').compute({ z4: [8, 8, 0, 8] }));
  const tot = par.compute({ zlist: [8, 8] }).find((o) => o.label === 'TOTAL PARALLEL IMPEDANCE');
  assert.ok(tot && 'value' in tot);
  assert.equal(tot.value, 4);
});

test('S1 — mismatched Sabine lists are announced', () => {
  const f = fn('sabine', 'rtFromSurfaces');
  const labels = (v: Record<string, number | number[]>) => f.compute(v).map((o) => o.label);
  assert.ok(labels({ vol: 100, surfaces: [20, 20, 12.5], coeffs: [0.05, 0.3] }).includes('CHECK INPUTS'));
  assert.ok(!labels({ vol: 100, surfaces: [20, 20, 12.5], coeffs: [0.05, 0.3, 0.9] }).includes('CHECK INPUTS'));
});

test('U1 — unit-bearing "number" outputs name their unit', () => {
  const labels = (w: string, k: string, v: Record<string, number>) => fn(w, k).compute(v).map((o) => o.label);
  assert.ok(labels('vdrop', 'gaugeFor', { len: 30, current: 3, vsrc: 48, pct: 3 }).includes('REQUIRED AREA (mm²)'));
  assert.ok(labels('rackheat', 'heatLoad', { watts: 800, mains: 120, dTempF: 10 }).includes('HEAT OUTPUT (BTU/hr)'));
  assert.ok(labels('transloss', 'massForTL', { tlTarget: 40, f: 125 }).includes('REQUIRED PANEL MASS (kg/m²)'));
  assert.ok(labels('complexz', 'resonance', { indmH: 1, capuF: 10 }).includes('ANGULAR FREQUENCY ω₀ (rad/s)'));
});

test('W1 — the error state renders before the CALCULATE gate', () => {
  const src = read('screens/lab/calc/CalcWorkspaceScreen.tsx');
  const err = src.indexOf(') : computeError ? (');
  const gate = src.indexOf(') : capped && !resultUnlocked ? (');
  assert.ok(err > 0 && gate > 0, 'both branches present');
  assert.ok(err < gate, 'an error must never sit behind a credit-spending CALCULATE');
});

test('K1 — the cap counter status read is bounded', () => {
  const src = read('features/lab/calcUsage.ts');
  const status = src.slice(src.indexOf('export async function getCalcStatus'));
  assert.match(status, /withDeadline\(\s*async \(\) => await supabase\.rpc\('calc_usage_status'\)/);
});
