/**
 * Calculator bug pass 2 of 3 (2026-09-30 day) — regressions.
 *
 *  CH1  the chain / workflow / project import matches UNITS, not just the kind:
 *       a kg/m² never fills a µF, a dBV never fills a dBu, a dBV/Pa never fills
 *       a mV/Pa; same-unit and unnamed relative-dB chains still work;
 *  CH2  a workflow import survives an upstream label that carries an input
 *       ("RECOMMENDED GAIN LEAVING 12 dB HEADROOM") — falls back by position;
 *  NF1  a result whose every number is NaN/∞ is an error, not a panel of "—"
 *       (and so never costs a capped account a weekly calculation);
 *  N2   RMS / peak / supply / line / mains voltages, load & breaker currents,
 *       allowable drop %, perforation % and falloff-per-doubling refuse
 *       negatives (−28.3 V RMS used to report a confident 100 W and 8 Ω);
 *  M1   spaced-pair path uses |sin θ| — a source at −30° gave a −858 Hz null;
 *  P1   "smallest time offset" from phase wraps into one cycle;
 *  A1   the membrane absorber's USEFUL BAND is a band, not f₀ printed twice;
 *  I1   IMD LOWER / UPPER third-order rows follow the tones, not entry order.
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
const { chainFits, unitTags, isNonNegativeField } = await import('../src/screens/lab/calc/calcUnits.ts');
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
const num = (outs: ReturnType<ReturnType<typeof fn>['compute']>, label: string) => {
  const o = outs.find((x) => x.label === label);
  assert.ok(o && 'value' in o, label);
  return (o as { value: number }).value;
};

test('CH1 — unit tags read the result side of a label', () => {
  assert.deepEqual(unitTags('SENSITIVITY (dBV/Pa)'), ['dBV/Pa']);
  assert.deepEqual(unitTags('IF THIS IS dBu → in dBV'), ['dBV']);
  assert.deepEqual(unitTags('LEVEL (dBu or dBV)').sort(), ['dBV', 'dBu']);
  assert.deepEqual(unitTags('Q'), []);
});

test('CH1 — mismatched units never fill, matching ones still do', () => {
  // The two cases named in the brief.
  assert.equal(chainFits('REQUIRED PANEL MASS (kg/m²)', 'number', field('electronics', 'cap')), false);
  assert.equal(chainFits('LEVEL (dBV)', 'db', field('level', 'dbu')), false);
  assert.equal(chainFits('SENSITIVITY (dBV/Pa)', 'number', field('micgain', 'sens')), false);
  assert.equal(chainFits('DIFFERENCE (LU)', 'number', field('loudnorm', 'measured')), false);
  assert.equal(chainFits('Speakers', 'number', field('complexz', 'capuF')), false); // a project "Count"
  // Same unit / unnamed still chain.
  assert.equal(chainFits('SENSITIVITY (mV/Pa)', 'number', field('micgain', 'sens')), true);
  assert.equal(chainFits('LEVEL (dBu)', 'db', field('level', 'dbu')), true);
  assert.equal(chainFits('LEVEL (dBV)', 'db', field('level', 'dbx')), true);
  assert.equal(chainFits('LEVEL CHANGE', 'db', field('level', 'dbAmp')), true);
  assert.equal(chainFits('OUTPUT LEVEL (dBu)', 'db', field('micgain', 'target')), true); // unnamed field
  assert.equal(chainFits('Q', 'number', field('qbw', 'q')), true);
  assert.equal(chainFits('DELAY', 'time', field('latency', 'proc')), true);
  assert.equal(chainFits('DELAY', 'time', field('wave', 'f')), false); // kinds still must match
});

test('CH1 — every chain entry point uses chainFits', () => {
  const wsScreen = read('screens/lab/calc/CalcWorkspaceScreen.tsx');
  assert.match(wsScreen, /const canChain = chain && chainFits\(chain\.label, chain\.quantity, f\);/);
  const run = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  assert.match(run, /'value' in o && chainFits\(o\.label, o\.quantity, f\) && o\.chainable !== false/);
  assert.match(run, /\.filter\(\(v\) => chainFits\(v\.label, v\.quantity, f\)\)/);
  assert.match(run, /if \(o && chainFits\(o\.label, o\.quantity, f\)/);
});

test('CH2 — a relabelled upstream output is found by position', () => {
  const run = read('screens/lab/calc/CalcWorkflowRunScreen.tsx');
  assert.match(run, /source: \{ kind: 'prior-step', stepIndex: fromStep, outputLabel, outputIndex \}/);
  assert.match(run, /if \(!o && srcRef\.outputIndex != null\)/);
  // The case: the label embeds the headroom input, the position does not move.
  const g = fn('micgain', 'gain');
  const a = g.compute({ sens: 2, spl: 94, target: 4, headroom: 12 });
  const b = g.compute({ sens: 2, spl: 94, target: 4, headroom: 10 });
  assert.notEqual(a[1]!.label, b[1]!.label);
  assert.equal(num(b, b[1]!.label), num(b, 'GAIN TO HIT TARGET (dB)') - 10);
});

test('NF1 — an all-NaN/∞ result is an error, never a panel of dashes', () => {
  const panel = read('screens/lab/calc/calcPanel.tsx');
  assert.match(panel, /if \(nums\.length > 0 && nums\.every\(\(o\) => !Number\.isFinite\(o\.value\)\)\) \{\s*return \{ outputs: \[\], steps: \[\], table: null, computeError: true \};/);
  // The inputs it guards: 0 Hz wavelength is every-number-infinite.
  const outs = fn('wave', 'wavelength').compute({ f: 0, temp: 20 });
  assert.ok(outs.every((o) => 'value' in o && !Number.isFinite(o.value)));
});

test('N2 — physical magnitudes on signed kinds refuse negatives', () => {
  const nonNeg: [string, string][] = [
    ['ohmspower', 'vrms'], ['ohmspower', 'vpk'], ['level', 'vFromDbu'], ['level', 'vFromDbv'],
    ['vdrop', 'current'], ['vdrop', 'vsrc'], ['vdrop', 'pct'], ['rackheat', 'mains'], ['rackheat', 'breaker'],
    ['cv70', 'vline'], ['absorber', 'openPct'], ['spldist', 'rate'],
  ];
  for (const [w, k] of nonNeg) assert.ok(isNonNegativeField(field(w, k)), `${w}.${k}`);
  // Still signed: a divider's DC input, a percent CHANGE, a phase angle, a source angle.
  for (const [w, k] of [['electronics', 'vin'], ['level', 'pct'], ['phase', 'phi'], ['stereomic', 'angle']] as const)
    assert.ok(!isNonNegativeField(field(w, k)), `${w}.${k} is signed`);
});

test('M1 — a source on the other side gives the same (positive) path and null', () => {
  const f = fn('stereomic', 'pathDelay');
  const left = f.compute({ spacing: 0.4, angle: -30, temp: 20 });
  const right = f.compute({ spacing: 0.4, angle: 30, temp: 20 });
  assert.ok(num(left, 'FIRST MONO COMB NULL') > 0);
  assert.equal(num(left, 'FIRST MONO COMB NULL'), num(right, 'FIRST MONO COMB NULL'));
  assert.ok(num(left, 'PATH DIFFERENCE') > 0);
});

test('P1 — the smallest time offset really is the smallest', () => {
  const f = fn('phase', 'timeFromPhase');
  assert.ok(Math.abs(num(f.compute({ phi: 450, f: 1000 }), 'SMALLEST TIME OFFSET') - 0.00025) < 1e-12);
  assert.ok(Math.abs(num(f.compute({ phi: -90, f: 1000 }), 'SMALLEST TIME OFFSET') - 0.00075) < 1e-12);
  assert.ok(Math.abs(num(f.compute({ phi: 90, f: 1000 }), 'SMALLEST TIME OFFSET') - 0.00025) < 1e-12);
});

test('A1 — the useful band is a range around f₀', () => {
  const outs = fn('absorber', 'panel').compute({ mass: 5, gap: 0.05 });
  const band = outs.find((o) => o.label === 'USEFUL BAND (≈ ±½ oct)');
  assert.ok(band && 'text' in band);
  assert.equal(band.text, '84.85–169.7 Hz');
});

test('I1 — third-order LOWER is lower whatever order the tones are typed', () => {
  const f = fn('imd', 'products');
  for (const v of [{ f1: 19000, f2: 20000 }, { f1: 20000, f2: 19000 }]) {
    const outs = f.compute(v);
    assert.equal(num(outs, '3RD-ORDER LOWER (2·lower − higher)'), 18000);
    assert.equal(num(outs, '3RD-ORDER UPPER (2·higher − lower)'), 21000);
  }
});
