/**
 * A REFUSAL costs nothing (owner 2026-10-03, "do 1").
 *
 * Since 00e3869b some impossible inputs answer with WORDS instead of throwing
 * ("NOT A COMPRESSOR RATIO", "NOT A REFLECTION", "NO TIME TO AVERAGE" …), so
 * they slipped past the error path and spent a free account's weekly
 * calculation. A plain "text-only is free" rule would be wrong — roommodes.axial
 * answers in text only — so refusals carry an explicit `refusal: true` marker.
 *
 *  R1  every refusal path is marked, and its result is a refusal;
 *  R2  a refused result costs nothing — the CALCULATE gate (the only caller of
 *      consumeCalc) never runs for it, and the refusal's words show first;
 *  R3  a genuine text-only answer (roommodes.axial) is not marked and still costs;
 *  R4  a normal numeric answer still costs;
 *  R5  a workflow step that refuses is incomplete and feeds no later step.
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
const types = (await import('../src/screens/lab/calc/calcTypes.ts')) as Record<string, unknown>;
const read = (rel: string) => readFileSync(new URL(`../src/screens/lab/calc/${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

type Out = { label: string; text?: string; value?: number; refusal?: true };
const compute = (wsId: string, key: string, v: Record<string, number | number[]>): Out[] => {
  const w = getWorkspace(wsId);
  assert.ok(w, wsId);
  const f = w!.functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!.compute(v) as Out[];
};

// The same decision runCompute + the CALCULATE gate make, executed here.
// On HEAD neither helper exists, so every receipt below fails there.
const isRefused = (outs: Out[]): boolean => {
  assert.equal(typeof types.isRefused, 'function', 'calcTypes exports isRefused');
  return (types.isRefused as (o: Out[]) => boolean)(outs);
};
const costs = (outs: Out[]): boolean => {
  assert.equal(typeof types.costsACalculation, 'function', 'calcTypes exports costsACalculation');
  return (types.costsACalculation as (r: { computeError: boolean; refused?: boolean }) => boolean)({ computeError: false, refused: isRefused(outs) });
};

/** Every refusal path, with inputs that reach it. */
const REFUSALS: [string, string, Record<string, number | number[]>, string][] = [
  ['compressor', 'outFromRatio', { thr: -20, ratio: 0.5, inLvl: -10 }, 'NOT A COMPRESSOR RATIO'],
  ['compressor', 'thrForGr', { inLvl: -10, ratio: 1, targetGr: 6 }, 'NO THRESHOLD'],
  ['level', 'pctToDb', { pct: -150 }, 'NO dB LEVEL'],
  ['stereomic', 'pathDelay', { spacing: 0.3, angle: 0, temp: 20 }, 'MONO COMB FILTERING'],
  ['reflection', 'comb', { dDirect: 3, dReflected: 2, temp: 20 }, 'NOT A REFLECTION'],
  ['reflection', 'comb', { dDirect: 3, dReflected: 3, temp: 20 }, 'COMB FILTERING'],
  ['comb', 'combFromPath', { pathDiff: 0, temp: 20 }, 'COMB FILTERING'],
  ['vdrop', 'drop', { awg: 18, len: 100, current: 50, vsrc: 12 }, 'MODEL BREAKS DOWN'],
  ['driver', 'portLength', { av: 0.005, vb: 0.05, fbTarget: 200, temp: 20 }, 'PHYSICAL PORT LENGTH'],
  ['dose', 'leq', { doseLevels: [90, 95], doseMins: [0, 0] }, 'NO TIME TO AVERAGE'],
  ['impedance', 'seriesparallel', { z4: [8, 8] }, 'INPUT'],
  ['cv70', 'load', { taps: [0], prated: 250, vline: 70, hr: 1 }, 'INPUT'],
];

test('R1 — every refusal path is marked and reads as a refusal', () => {
  for (const [ws, key, v, label] of REFUSALS) {
    const outs = compute(ws, key, v);
    const row = outs.find((o) => o.label === label && typeof o.text === 'string');
    assert.ok(row, `${ws}.${key} answers ${label} in words`);
    assert.equal(row!.refusal, true, `${ws}.${key} ${label} is marked as a refusal`);
    assert.equal(isRefused(outs), true, `${ws}.${key} is a refusal`);
  }
});

test('R2 — a refused compute does not call consume', () => {
  for (const [ws, key, v] of REFUSALS) assert.equal(costs(compute(ws, key, v)), false, `${ws}.${key} costs nothing`);
  // The gate: runCappedCalc (the only consumeCalc caller) refuses a refusal,
  // and the refusal's own words render BEFORE the CALCULATE button.
  const src = read('CalcWorkspaceScreen.tsx');
  const fnBody = src.slice(src.indexOf('const runCappedCalc = async () => {'), src.indexOf('u = await consumeCalc();'));
  assert.match(fnBody, /if \(!values \|\| !costsACalculation\(\{ computeError, refused \}\) \|\|/);
  const refusal = src.indexOf(') : refused && (capped || tierPending) ? (');
  const gate = src.indexOf(') : capped && !resultUnlocked ? (');
  assert.ok(refusal > 0 && gate > 0 && refusal < gate, 'the refusal shows before any credit-spending CALCULATE');
  assert.match(src.slice(refusal, gate), /refusalRows\(outputs\)\.map/);
  // runCompute derives the flag from the marker.
  assert.match(read('calcPanel.tsx'), /computeError: false,\s*refused: isRefused\(outputs\),/);
});

test('R3 — a genuine text-only answer (roommodes.axial) is not marked and still costs', () => {
  const outs = compute('roommodes', 'axial', { len: 5, wid: 4, hei: 3, temp: 20 });
  assert.ok(outs.length > 0 && outs.every((o) => typeof o.text === 'string'), 'axial answers in text only');
  assert.ok(outs.every((o) => o.refusal !== true), 'no axial row is a refusal');
  assert.equal(isRefused(outs), false);
  assert.equal(costs(outs), true, 'a real answer in words still spends a calculation');
});

test('R4 — a normal numeric answer still costs', () => {
  const outs = compute('level', 'pctToDb', { pct: 50 });
  assert.ok(outs.some((o) => typeof o.value === 'number' && Number.isFinite(o.value)));
  assert.equal(isRefused(outs), false);
  assert.equal(costs(outs), true);
  // An error is still free, exactly as before.
  assert.equal((types.costsACalculation as (r: { computeError: boolean }) => boolean)({ computeError: true }), false);
});

test('R5 — a refused workflow step is not complete and feeds no later step', () => {
  const src = read('CalcWorkflowRunScreen.tsx');
  assert.match(src, /complete: values != null && !result\.computeError && !result\.refused/);
  assert.match(src, /const up = up0\?\.result\.refused \? undefined : up0;/);
  assert.match(src, /if \(computed\[k\]\?\.result\.refused\) continue;/);
});
