/**
 * CALC area — full-app bug run 2 (2026-10-01), the last run before publish.
 * Calculators are a source of truth (legal and safety grade): each test pins
 * an edge where a calculator gave a wrong or unsafe answer, or a store
 * overwrote saved data after a failed read.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Fake AsyncStorage whose reads or writes can be made to FAIL.
class FlakyMap extends Map<string, string> {
  failReads = false;
  failWrites = false;
  override has(k: string): boolean {
    if (this.failReads) throw new Error('read failed');
    return super.has(k);
  }
  override set(k: string, v: string): this {
    if (this.failWrites) throw new Error('write failed');
    return super.set(k, v);
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
const { negativeInput } = await import('../src/screens/lab/calc/calcUnits.ts');
const { workflowStore } = await import('../src/screens/lab/calc/workflowStore.ts');

const fnOf = (wsId: string, key: string) => {
  const ws = getWorkspace(wsId)!;
  const fn = ws.functions.find((f) => f.key === key);
  assert.ok(fn, `${wsId}.${key}`);
  return { ws, fn };
};
type Out = { label: string; value?: number; text?: string };
const out = (outs: Out[], label: string) => {
  const o = outs.find((x) => x.label === label);
  assert.ok(o, `${label} in ${outs.map((x) => x.label).join(' | ')}`);
  return o;
};
const close = (a: number, b: number, rel = 1e-3) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} ≈ ${b}`);

// ---------------------------------------------------------------------------
// Speaker Cable Loss: every gauge costed as itself
// ---------------------------------------------------------------------------

test('G2 — 20/22/24 AWG are costed as themselves, never as 18 AWG', () => {
  const { fn } = fnOf('cable', 'loss');
  // 24 AWG copper: 0.08421 Ω/m per conductor (standard AWG area, ρ 1.724e-8).
  const o24 = fn.compute({ len: 30, awg: 24, z: 8, pamp: 500 }) as Out[];
  close(out(o24, 'LOOP RESISTANCE (24 AWG)').value!, 2 * 30 * 0.08421);
  const o18 = fn.compute({ len: 30, awg: 18, z: 8, pamp: 500 }) as Out[];
  // 4× the resistance of 18 AWG: 39% of the amp's power heats the wire, not 14%.
  close(out(o24, 'POWER LOST IN THE CABLE').value!, (1 - 8 / (8 + 2 * 30 * 0.08421)) * 100);
  assert.ok(out(o24, 'WATTS HEATING THE CABLE').value! > 2 * out(o18, 'WATTS HEATING THE CABLE').value!);
  close(out(fn.compute({ len: 10, awg: 22, z: 8, pamp: 100 }) as Out[], 'LOOP RESISTANCE (22 AWG)').value!, 2 * 10 * 0.05296);
  close(out(fn.compute({ len: 10, awg: 20, z: 8, pamp: 100 }) as Out[], 'LOOP RESISTANCE (20 AWG)').value!, 2 * 10 * 0.03331);
  // Odd gauges are exact too; the listed table values are unchanged.
  close(out(fn.compute({ len: 10, awg: 17, z: 8, pamp: 100 }) as Out[], 'LOOP RESISTANCE (17 AWG)').value!, 2 * 10 * 0.01661);
  close(out(o18, 'LOOP RESISTANCE (18 AWG)').value!, 2 * 30 * 0.02095);
  close(out(fn.compute({ len: 30, awg: 16, z: 8, pamp: 500 }) as Out[], 'LOOP RESISTANCE (16 AWG)').value!, 2 * 30 * 0.01318);
  // Thicker than the old table too: 8 AWG was costed as 10 AWG.
  close(out(fn.compute({ len: 30, awg: 8, z: 8, pamp: 500 }) as Out[], 'LOOP RESISTANCE (8 AWG)').value!, 2 * 30 * 0.002061);
});

test('G2 — MAX LENGTH for a thin gauge is the thin gauge’s, not 18 AWG’s', () => {
  const { fn } = fnOf('cable', 'maxlen');
  const l24 = out(fn.compute({ awg: 24, z: 8, maxloss: 0.5 }) as Out[], 'MAX ONE-WAY LENGTH (24 AWG)').value!;
  const l18 = out(fn.compute({ awg: 18, z: 8, maxloss: 0.5 }) as Out[], 'MAX ONE-WAY LENGTH (18 AWG)').value!;
  close(l24 / l18, 0.02095 / 0.08421);
});

test('G2 — a fraction rounds to the nearest whole gauge (tie → thinner); out of range is an error', () => {
  const { fn } = fnOf('cable', 'loss');
  out(fn.compute({ len: 30, awg: 16.5, z: 8, pamp: 500 }) as Out[], 'LOOP RESISTANCE (17 AWG)');
  out(fn.compute({ len: 30, awg: 16.4, z: 8, pamp: 500 }) as Out[], 'LOOP RESISTANCE (16 AWG)');
  assert.throws(() => fn.compute({ len: 30, awg: 41, z: 8, pamp: 500 }));
  assert.throws(() => fn.compute({ len: 30, awg: -1, z: 8, pamp: 500 }));
  assert.throws(() => fnOf('cable', 'maxlen').fn.compute({ awg: 99, z: 8, maxloss: 0.5 }));
  const steps = fn.steps!({ len: 30, awg: 16.5, z: 8, pamp: 500 }).join(' ');
  assert.match(steps, /16\.5 → 17 AWG/);
});

// ---------------------------------------------------------------------------
// Reserves and gains that are SUBTRACTED cannot be negative
// ---------------------------------------------------------------------------

test('H1 — a negative speaker headroom is an error, not a quarter of the needed power', () => {
  const { ws, fn } = fnOf('speakerpower', 'reqpower');
  assert.equal(negativeInput(fn, { sens: 97, target: 105, dist: 10, headroom: -6, nspk: 1 }, ws.fields)?.key, 'headroom');
  assert.equal(negativeInput(fn, { sens: 97, target: 105, dist: 10, headroom: 6, nspk: 1 }, ws.fields), null);
  const pred = fnOf('speakerpower', 'predictspl');
  assert.equal(negativeInput(pred.fn, { sens: 97, power: 500, dist: 10, headroom: -6, nspk: 1 }, ws.fields)?.key, 'headroom');
});

test('H2 — preamp headroom and limiter amp gain refuse negatives', () => {
  const mic = fnOf('micgain', 'gain');
  assert.equal(negativeInput(mic.fn, { sens: 2, spl: 94, target: 4, headroom: -12 }, mic.ws.fields)?.key, 'headroom');
  assert.equal(negativeInput(mic.fn, { sens: 2, spl: 94, target: 4, headroom: 12 }, mic.ws.fields), null);
  // A negative TARGET dBu is a real level and stays allowed.
  assert.equal(negativeInput(mic.fn, { sens: 2, spl: 94, target: -10, headroom: 12 }, mic.ws.fields), null);
  const lim = fnOf('limiter', 'threshold');
  assert.equal(negativeInput(lim.fn, { pwr: 500, z: 8, ampGain: -32, margin: 3 }, lim.ws.fields)?.key, 'ampGain');
  assert.equal(negativeInput(lim.fn, { pwr: 500, z: 8, ampGain: 32, margin: 3 }, lim.ws.fields), null);
});

// ---------------------------------------------------------------------------
// Whole counts hidden by float noise
// ---------------------------------------------------------------------------

test('T1 — 9 ms at 48 kHz is exactly 432 samples, rounded down OR up', () => {
  const { fn } = fnOf('distdelay', 'timeToSmp');
  const v = { delay: 9e-3, sr: 48000 }; // 9e-3 × 48000 = 431.99999999999994 in floats
  const o = fn.compute(v) as Out[];
  assert.equal(out(o, 'ROUNDED DOWN / UP').text, '432 / 432 samples');
  const rows = fn.table!(v)!.rows;
  assert.deepEqual(rows.map((r) => r[1]), ['432', '432', '432']);
  // A genuine fraction still floors and ceils.
  assert.equal(out(fn.compute({ delay: 7e-3, sr: 44100 }) as Out[], 'ROUNDED DOWN / UP').text, '308 / 309 samples');
});

test('T1 — 11 ms at 1 kHz is 11 full cycles and 0°, not 10 cycles and 360°', () => {
  const { fn } = fnOf('phase', 'phaseFromTime');
  const o = fn.compute({ f: 1000, dt: 11e-3 }) as Out[];
  assert.equal(out(o, 'FULL CYCLES LATE').value, 11);
  assert.equal(out(o, 'PHASE (WRAPPED 0–360°)').value, 0);
  const half = fn.compute({ f: 1000, dt: 5.5e-3 }) as Out[];
  assert.equal(out(half, 'FULL CYCLES LATE').value, 5);
  close(out(half, 'PHASE (WRAPPED 0–360°)').value!, 180);
});

// ---------------------------------------------------------------------------
// Favourites / recents: a failed READ never overwrites them
// ---------------------------------------------------------------------------

test('F1 — a favourite toggle after a failed read writes nothing', async () => {
  store.clear();
  store.failReads = false;
  store.failWrites = false;
  await workflowStore.toggleFavorite('a');
  await workflowStore.toggleFavorite('b');
  const before = store.get('ape:calcwf:favorites');
  assert.deepEqual(JSON.parse(before!), ['b', 'a']);

  store.failReads = true;
  assert.equal(await workflowStore.toggleFavorite('c'), null, 'the screen must keep what it shows');
  store.failReads = false;
  assert.equal(store.get('ape:calcwf:favorites'), before, 'favourites untouched');
});

test('F1 — a favourite toggle whose WRITE fails returns the stored list, not the toggle', async () => {
  store.clear();
  store.failReads = false;
  store.failWrites = false;
  await workflowStore.toggleFavorite('a');
  store.failWrites = true;
  assert.deepEqual(await workflowStore.toggleFavorite('b'), ['a']);
  store.failWrites = false;
});

test('F2 — touching a recent after a failed read keeps every recent', async () => {
  store.clear();
  store.failReads = false;
  store.failWrites = false;
  for (const id of ['a', 'b', 'c']) await workflowStore.touchRecent(id);
  const before = store.get('ape:calcwf:recents');
  store.failReads = true;
  await workflowStore.touchRecent('d');
  store.failReads = false;
  assert.equal(store.get('ape:calcwf:recents'), before);
  assert.deepEqual(await workflowStore.getRecents(), ['c', 'b', 'a']);
});

test('M1 — a reorder whose WRITE fails returns the stored order', async () => {
  store.clear();
  store.failReads = false;
  store.failWrites = false;
  const wf = (id: string) => ({ id, name: id, steps: [] }) as never;
  await workflowStore.saveWorkflow(wf('a'));
  await workflowStore.saveWorkflow(wf('b')); // new ones go first: [b, a]
  store.failWrites = true;
  const shown = await workflowStore.moveWorkflow('b', 1);
  store.failWrites = false;
  assert.deepEqual(shown?.map((w) => w.id), ['b', 'a']);
});

test('F3 — the Workflows screen keeps its favourites when a toggle returns null', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/screens/lab/calc/CalcWorkflowsScreen.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /toggleFavorite\(id\)\.then\(setFavorites\)/);
  assert.match(src, /toggleFavorite\(id\)\.then\(\(list\) => \{\s*if \(list\) setFavorites\(list\);/);
});
