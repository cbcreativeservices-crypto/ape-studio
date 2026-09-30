/**
 * Calculator bug pass 3 of 3 (2026-09-30 day) — regressions + re-audit.
 *
 *  RA1 re-audit of pass 2: chainFits never blocks a same-kind db/number value
 *      between the steps of ANY built-in workflow template;
 *  RA2 re-audit of pass 2 (NaN-only → error): the compressor's "threshold for
 *      a target GR" at 1:1 now ANSWERS in words instead of ±∞ rows that the
 *      new rule turned into a bare "check for zeros" error;
 *  T1  treatment planner refuses a 0 s current / target RT60 (was "0 panels,
 *      predicted RT60 0 s");
 *  P1  pitch interval refuses a 0 Hz tone (was "RATIO 0 ×" + dashes);
 *  R1  axial room modes refuse a 0 m dimension (text-only "— Hz" rows);
 *  F1  FFT size/resolution refuse 0 points / 0 Hz Δf (confident "0 ms" / "0 Hz");
 *  V1  70 V "more speakers" refuses a 0 W tap ("— more speakers … fit");
 *  E1  Eyring's SABINE OVER-ESTIMATE is relative to Eyring, as labelled.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
const { chainFits, parseList, parseQuantity, unitsFor } = await import('../src/screens/lab/calc/calcUnits.ts');
const { WORKFLOW_TEMPLATES } = await import('../src/screens/lab/calc/workflowCatalog.ts');

type Ws = NonNullable<ReturnType<typeof getWorkspace>>;
const ws = (id: string): Ws => {
  const w = getWorkspace(id);
  assert.ok(w, id);
  return w!;
};
const fn = (wsId: string, key: string) => {
  const f = ws(wsId).functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};
const num = (outs: ReturnType<ReturnType<typeof fn>['compute']>, label: string) => {
  const o = outs.find((x) => x.label === label);
  assert.ok(o && 'value' in o, label);
  return (o as { value: number }).value;
};
/** Placeholder values in base units (the calculators' own worked defaults). */
const placeholderValues = (w: Ws, keys: string[]) => {
  const out: Record<string, number | number[]> = {};
  for (const k of keys) {
    const f = w.fields.find((x) => x.key === k)!;
    if (f.quantity === 'list') out[k] = parseList(f.placeholder ?? '');
    else {
      const units = unitsFor(f.quantity, f.unitIds);
      const u = units.find((x) => x.id === f.defaultUnit) ?? units[0];
      out[k] = u.toBase(parseQuantity(f.placeholder ?? '1') ?? 1);
    }
  }
  return out;
};

test('RA1 — no template chain between steps is blocked by the unit guard', () => {
  let checked = 0;
  for (const t of WORKFLOW_TEMPLATES) {
    const steps = t.steps.map((s) => ({ w: ws(s.workspaceId), f: fn(s.workspaceId, s.fnKey) }));
    for (let j = 1; j < steps.length; j++) {
      for (let k = 0; k < j; k++) {
        const outs = steps[k].f.compute(placeholderValues(steps[k].w, steps[k].f.inputs));
        for (const o of outs) {
          if (!('value' in o) || o.chainable === false) continue;
          for (const key of steps[j].f.inputs) {
            const field = steps[j].w.fields.find((x) => x.key === key)!;
            if (field.quantity !== o.quantity || field.quantity === 'list') continue;
            checked++;
            // The only same-kind pairs a unit tag may refuse are named-unit
            // mismatches — none exist between template steps.
            assert.ok(chainFits(o.label, o.quantity, field), `${t.id}: ${o.label} → ${field.name}`);
          }
        }
      }
    }
  }
  assert.ok(checked > 20, `checked ${checked} template chains`);
});

test('RA2 — threshold for a target GR at 1:1 answers in words, not ±∞', () => {
  const f = fn('compressor', 'thrForGr');
  const outs = f.compute({ inLvl: -8, ratio: 1, targetGr: 3 });
  assert.equal(outs.filter((o) => 'value' in o).length, 0); // not the NaN-only error path
  const t = outs.find((o) => o.label === 'NO THRESHOLD');
  assert.ok(t && 'text' in t && /raise the ratio/.test(t.text));
  // The normal case is untouched: −8 in, 4:1, 3 dB GR → threshold −12.
  assert.equal(num(f.compute({ inLvl: -8, ratio: 4, targetGr: 3 }), 'SET THRESHOLD TO'), -12);
});

test('T1 — treatment planner refuses a 0 s RT60', () => {
  const f = fn('treatment', 'panels');
  const base = { vol: 150, rtCur: 1.2, rtTgt: 0.5, panelArea: 2.88, alpha: 0.9 };
  assert.throws(() => f.compute({ ...base, rtCur: 0 }));
  assert.throws(() => f.compute({ ...base, rtTgt: 0 }));
  assert.equal(num(f.compute(base), 'PANELS NEEDED'), 11);
});

test('P1 — pitch interval refuses a 0 Hz tone', () => {
  const f = fn('pitch', 'interval');
  assert.throws(() => f.compute({ f: 452, f2: 0 }));
  assert.throws(() => f.compute({ f: 0, f2: 452 }));
  assert.ok(Math.abs(num(f.compute({ f: 440, f2: 660 }), 'CENTS') - 701.955) < 0.01);
});

test('R1 — axial room modes refuse a 0 m dimension', () => {
  const f = fn('roommodes', 'axial');
  assert.throws(() => f.compute({ len: 0, wid: 4, hei: 2.5, temp: 20 }));
  const ok = f.compute({ len: 5, wid: 4, hei: 2.5, temp: 20 });
  assert.ok(ok.some((o) => o.label === 'LENGTH FUNDAMENTAL (1,0,0)' && 'text' in o && o.text === '34.32 Hz'));
});

test('F1 — FFT calculators refuse 0 points and a 0 Hz resolution', () => {
  assert.throws(() => fn('fft', 'resFromSize').compute({ N: 0, sr: 48000, fInterest: 100 }));
  assert.throws(() => fn('fft', 'tradeoff').compute({ N: 0, sr: 48000 }));
  assert.throws(() => fn('fft', 'sizeFromRes').compute({ df: 0, sr: 48000 }));
  assert.equal(num(fn('fft', 'sizeFromRes').compute({ df: 5, sr: 48000 }), 'MINIMUM FFT SIZE'), 9600);
});

test('V1 — "how many more speakers" refuses a 0 W tap', () => {
  const f = fn('cv70', 'morespeakers');
  const taps = Array(12).fill(10);
  assert.throws(() => f.compute({ taps, prated: 250, hr: 2, tapw: 0 }));
  assert.equal(num(f.compute({ taps, prated: 250, hr: 2, tapw: 10 }), 'LOAD IF FILLED'), 150);
});

test('E1 — Sabine over-estimate is measured against Eyring', () => {
  const outs = fn('eyring', 'eyring').compute({ vol: 120, surf: 160, aBar: 0.3 });
  const s = num(outs, 'RT60 (SABINE)');
  const e = num(outs, 'RT60 (EYRING)');
  assert.ok(Math.abs(num(outs, 'SABINE OVER-ESTIMATE') - ((s - e) / e) * 100) < 1e-9);
  assert.ok(Math.abs(num(outs, 'SABINE OVER-ESTIMATE') - 18.9) < 0.05);
});
