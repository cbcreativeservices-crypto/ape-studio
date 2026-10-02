/**
 * CALC area — full-app bug run 1 (2026-10-01). Calculators are a source of
 * truth (legal and safety grade): each test pins an edge where a calculator
 * gave a wrong or unsafe answer, or a store reported success over lost data.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Fake AsyncStorage whose reads can be made to FAIL (an I/O error, or
// Android's "row too big to fit into CursorWindow" past ~2 MB).
class FlakyMap extends Map<string, string> {
  failReads = false;
  override has(k: string): boolean {
    if (this.failReads) throw new Error('read failed');
    return super.has(k);
  }
}
const store = new FlakyMap();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { negativeInput, parseQuantity } = await import('../src/screens/lab/calc/calcUnits.ts');
const { workflowStore } = await import('../src/screens/lab/calc/workflowStore.ts');

const fnOf = (wsId: string, key: string) => {
  const ws = getWorkspace(wsId)!;
  return { ws, fn: ws.functions.find((f) => f.key === key)! };
};
const labels = (outs: { label: string }[]) => outs.map((o) => o.label);

test('P1 — "0,500" is a decimal comma, never 500', () => {
  assert.equal(parseQuantity('0,500'), null);
  assert.equal(parseQuantity('-0,750'), null);
  assert.equal(parseQuantity('0,500.5'), null);
  assert.equal(parseQuantity('0.500,5'), null);
  // Real grouping is unchanged.
  assert.equal(parseQuantity('10,000'), 10000);
  assert.equal(parseQuantity('1,500'), 1500);
  assert.equal(parseQuantity('1,234,567.8'), 1234567.8);
  assert.equal(parseQuantity('1.234,5'), 1234.5);
  assert.equal(parseQuantity('0.5'), 0.5);
});

test('L1 — a negative limiter safety margin is an error, not a hotter threshold', () => {
  const { ws, fn } = fnOf('limiter', 'threshold');
  const neg = negativeInput(fn, { pwr: 500, z: 8, ampGain: 32, margin: -3 }, ws.fields);
  assert.equal(neg?.key, 'margin');
  assert.equal(negativeInput(fn, { pwr: 500, z: 8, ampGain: 32, margin: 3 }, ws.fields), null);
});

test('V1 — a negative 70 V headroom cannot fill the amp past its rating', () => {
  const { ws, fn } = fnOf('cv70', 'morespeakers');
  const neg = negativeInput(fn, { taps: [10, 10], prated: 100, tapw: 10, hr: -2 }, ws.fields);
  assert.equal(neg?.key, 'hr');
  const load = fnOf('cv70', 'load');
  assert.equal(negativeInput(load.fn, { taps: [10], prated: 100, vline: 70.7, hr: -2 }, ws.fields)?.key, 'hr');
});

test('Z1 — the "below a 4 Ω rating" warning fires below 4 Ω, not below 3', () => {
  const { fn } = fnOf('impedance', 'parallel');
  assert.ok(labels(fn.compute({ zlist: [4, 16] })).includes('AMPLIFIER LOAD WARNING')); // 3.2 Ω
  assert.ok(!labels(fn.compute({ zlist: [8, 8] })).includes('AMPLIFIER LOAD WARNING')); // 4 Ω
  assert.ok(!labels(fn.compute({ zlist: [12, 12, 12] })).includes('AMPLIFIER LOAD WARNING')); // 4 Ω (float noise)
  const sp = fnOf('impedance', 'seriesparallel').fn;
  assert.ok(labels(sp.compute({ z4: [3, 3, 4, 4] })).includes('AMPLIFIER LOAD WARNING')); // 3.5 Ω
  assert.ok(!labels(sp.compute({ z4: [8, 8, 8, 8] })).includes('AMPLIFIER LOAD WARNING'));
});

test('G1 — an odd gauge is costed as the THINNER listed wire', () => {
  const { fn } = fnOf('cable', 'loss');
  const out = fn.compute({ len: 30, awg: 17, z: 8, pamp: 500 });
  assert.ok(labels(out).includes('LOOP RESISTANCE (18 AWG)'), labels(out).join(' | '));
  const exact = fn.compute({ len: 30, awg: 16, z: 8, pamp: 500 });
  assert.ok(labels(exact).includes('LOOP RESISTANCE (16 AWG)'));
  const maxlen = fnOf('cable', 'maxlen').fn.compute({ awg: 13, z: 8, maxloss: 0.5 });
  assert.ok(labels(maxlen).includes('MAX ONE-WAY LENGTH (14 AWG)'));
});

const proj = (id: string) => ({ id, name: `P ${id}`, values: [], createdAt: 'x', updatedAt: 'x' });

test('S1 — a failed storage READ never lets a save overwrite the collection', async () => {
  store.clear();
  store.failReads = false;
  assert.equal(await workflowStore.saveProject(proj('a')), true);
  assert.equal(await workflowStore.saveProject(proj('b')), true);
  const before = store.get('ape:calcwf:projects');

  store.failReads = true;
  assert.equal(await workflowStore.saveProject(proj('c')), false, 'save must report failure');
  assert.equal(await workflowStore.deleteProject('a'), false, 'delete must report failure');
  assert.deepEqual(await workflowStore.listProjects(), []); // shows empty, touches nothing
  store.failReads = false;

  assert.equal(store.get('ape:calcwf:projects'), before, 'the stored projects are untouched');
  assert.equal(store.has('ape:calcwf:projects:damaged'), false, 'a read failure is not corruption');
  assert.deepEqual((await workflowStore.listProjects()).map((p) => p.id).sort(), ['a', 'b']);
});

test('S1 — a genuinely damaged blob is still quarantined, then starts empty', async () => {
  store.clear();
  store.failReads = false;
  store.set('ape:calcwf:projects', '{not json');
  assert.deepEqual(await workflowStore.listProjects(), []);
  assert.equal(store.get('ape:calcwf:projects:damaged'), '{not json');
  assert.equal(store.has('ape:calcwf:projects'), false);
  assert.equal(await workflowStore.saveProject(proj('n')), true);
});
