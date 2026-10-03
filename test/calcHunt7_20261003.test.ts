/**
 * Hunt 7 (2026-10-03) — CALC area. Every receipt here FAILS on HEAD c2864ab1.
 *
 * H7-1 (correction to calc follow-up F6) List fields: the thousands-comma
 *      refusal also caught plain lists typed without spaces — "85,94,100" in
 *      the noise-dose levels, "240,120,60" in the minutes — and told the
 *      learner to "leave out thousands commas" they never typed: a remedy that
 *      did not apply, so the field stayed refused. The message now names both
 *      readings and how to write the list. A group right after a decimal point
 *      ("20.5,100") is no thousands group and now reads as two values.
 * H7-2 Electronics › voltage divider: ATTENUATION was Vout ÷ Vin, so 0 V in
 *      made it 0 ÷ 0 — "—" (and "That is — dB of attenuation") beside a real
 *      resistor ratio. It is now taken from R2 ÷ (R1 + R2), as the circuit is.
 * H7-3 Stereo-Mic Geometry (source dead centre, 0°) and Comb Filter › from
 *      path (0 m): no path difference printed the comb null as "—", the steps
 *      as "= — Hz" and the comb table as rows of "— kHz" — the F4 equal-paths
 *      class (fixed in Reflection Path only). Now said in words; an empty
 *      table is no table.
 * H7-4 Level Converter › dB from a percent change: −150% printed RESULTING
 *      AMPLITUDE RATIO −0.5× (an amplitude that cannot exist, D53) beside
 *      LEVEL CHANGE "—". At or below −100% it is now said in words.
 * H7-5 (correction to hunt 6 H6-3) Voltage Drop › gauge: the steps still said
 *      "That is about -1.25 AWG" past 0 AWG — the "-7 AWG" class, left in the
 *      worked steps after the value was fixed.
 * H7-6 Saved Results / My Workflows: no LOADING face — before the first read
 *      landed, the initial [] said "Nothing saved yet" over every saved row
 *      (AGENTS.md: a list screen has three faces).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The workspaces use Metro-style extensionless imports (see calcDegenerate).
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

const U = (await import('../src/screens/lab/calc/calcUnits.ts')) as Record<string, any>;
const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');

const fn = (ws: string, key: string) => {
  const w = getWorkspace(ws);
  assert.ok(w, `workspace ${ws}`);
  const f = w.functions.find((x) => x.key === key);
  assert.ok(f, `${ws}.${key}`);
  return f;
};
type Out = { label: string; value?: number; text?: string };
const outs = (ws: string, key: string, v: Record<string, number>) => fn(ws, key).compute(v) as Out[];
const steps = (ws: string, key: string, v: Record<string, number>) => fn(ws, key).steps?.(v) ?? [];
const src = (f: string) => readFileSync(new URL(`../src/screens/lab/calc/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Every numeric output is a real number — no "—" shown beside an answer. */
const allFinite = (o: Out[]) => o.filter((x) => 'value' in x).every((x) => Number.isFinite(x.value));
/** fmt() prints a non-finite number as "—": "= — Hz", "is — dB". (An em dash
 *  used as punctuation in the prose is fine.) */
const noDashNumber = (s: string) => !/(?:[=×÷(]|\bis|\bat) —(?:\s|$)|— (?:dB|Hz|kHz|ms|µs|m|V)\b/.test(s);

describe('H7-1 — a list refusal tells the learner how to write the list', () => {
  it('"85,94,100" names both readings and the fix (a space after each comma)', () => {
    const msg = U.listProblem('85,94,100') ?? '';
    assert.match(msg, /“94,100” could be one number \(94100\) or two \(94 and 100\)/);
    assert.match(msg, /put a space after each one \(85, 94, 100\)/);
    assert.doesNotMatch(msg, /^“94,100” — Leave out thousands commas/, 'not the remedy for commas never typed');
  });
  it('the suggested way of writing it reads', () => {
    assert.deepEqual(U.parseList('85, 94, 100'), [85, 94, 100]);
  });
  it('a value after a DECIMAL point is not a thousands group', () => {
    assert.deepEqual(U.parseList('20.5,100,12'), [20.5, 100, 12]);
    assert.equal(U.listProblem('20.5,100,12'), null);
  });
  it('the F6 refusal itself still stands', () => {
    assert.deepEqual(U.parseList('1,000, 4,700'), []);
    assert.deepEqual(U.parseList('85,94,100'), []);
    assert.deepEqual(U.parseList('4,700'), []);
  });
});

describe('H7-2 — a divider’s attenuation does not depend on the input voltage', () => {
  it('0 V in still gives the resistor ratio in dB', () => {
    const o = outs('electronics', 'divider', { vin: 0, r1: 10000, r2: 10000 });
    const att = o.find((x) => x.label === 'ATTENUATION');
    assert.ok(att && Number.isFinite(att.value), `ATTENUATION ${att?.value}`);
    assert.ok(Math.abs(att.value! - 20 * Math.log10(0.5)) < 1e-12);
    assert.ok(steps('electronics', 'divider', { vin: 0, r1: 10000, r2: 10000 }).every(noDashNumber));
  });
  it('unchanged for a real input', () => {
    const att = outs('electronics', 'divider', { vin: 1, r1: 30000, r2: 10000 }).find((x) => x.label === 'ATTENUATION');
    assert.ok(Math.abs(att!.value! - 20 * Math.log10(0.25)) < 1e-12);
  });
});

describe('H7-3 — no path difference is no comb, said in words', () => {
  it('Stereo-Mic: a source dead centre', () => {
    const v = { spacing: 0.4, angle: 0, temp: 20 };
    const o = outs('stereomic', 'pathDelay', v);
    assert.ok(allFinite(o), JSON.stringify(o));
    assert.match(o.find((x) => x.label === 'MONO COMB FILTERING')?.text ?? '', /no comb-filter nulls/);
    assert.ok(steps('stereomic', 'pathDelay', v).every(noDashNumber));
  });
  it('Stereo-Mic: an off-axis source is unchanged', () => {
    const o = outs('stereomic', 'pathDelay', { spacing: 0.4, angle: 30, temp: 20 });
    assert.ok(Math.abs(o.find((x) => x.label === 'PATH DIFFERENCE')!.value! - 0.2) < 1e-12);
    assert.ok(Number.isFinite(o.find((x) => x.label === 'FIRST MONO COMB NULL')!.value));
  });
  it('Comb Filter from path: 0 m', () => {
    const v = { pathDiff: 0, temp: 20 };
    const o = outs('comb', 'combFromPath', v);
    assert.ok(allFinite(o), JSON.stringify(o));
    assert.match(o.find((x) => x.label === 'COMB FILTERING')?.text ?? '', /no comb-filter nulls/);
    assert.ok(steps('comb', 'combFromPath', v).every(noDashNumber));
    assert.equal(fn('comb', 'combFromPath').table!(v).rows.length, 0, 'no rows of "— kHz"');
  });
  it('an empty table is no table on screen', () => {
    assert.match(src('calcPanel.tsx'), /table: table && table\.rows\.length > 0 \? table : null,/);
  });
});

describe('H7-4 — an amplitude cannot fall by more than 100 %', () => {
  for (const pct of [-150, -100]) {
    it(`${pct}% prints no ratio and no "—"`, () => {
      const o = outs('level', 'pctToDb', { pct });
      assert.equal(o.filter((x) => 'value' in x).length, 0, JSON.stringify(o));
      assert.ok(o.find((x) => x.label === 'NO dB LEVEL')?.text);
      assert.ok(steps('level', 'pctToDb', { pct }).every((s) => noDashNumber(s) && !/-0\.5/.test(s)));
    });
  }
  it('−50% is unchanged', () => {
    const o = outs('level', 'pctToDb', { pct: -50 });
    assert.ok(Math.abs(o.find((x) => x.label === 'LEVEL CHANGE')!.value! - 20 * Math.log10(0.5)) < 1e-12);
  });
});

describe('H7-5 — the gauge steps never print a negative AWG', () => {
  it('a 2/0–3/0 feeder (≈ 71.8 mm²)', () => {
    const v = { len: 30, current: 100, vsrc: 48, pct: 3 };
    const s = steps('vdrop', 'gaugeFor', v).join(' ');
    assert.doesNotMatch(s, /-\d[\d.]* AWG/, s);
    assert.match(s, /3\/0 AWG or thicker/);
  });
  it('an ordinary gauge still quotes its number', () => {
    const s = steps('vdrop', 'gaugeFor', { len: 30, current: 3, vsrc: 48, pct: 3 }).join(' ');
    assert.match(s, /That is about \d[\d.]* AWG/);
  });
});

describe('H7-6 — the saved lists have a LOADING face', () => {
  it('Saved Results says it is loading until the first read lands', () => {
    const s = src('CalcResultsScreen.tsx');
    assert.match(s, /if \(ticket === loadTicket\.current\) setResults\(list\);\s*if \(ticket === loadTicket\.current\) setLoaded\(true\);/);
    assert.match(s, /\{!loaded \? \(\s*<Text style=\{styles\.caption\}>Loading saved results…<\/Text>\s*\) : workflowListUnreadable\(results\)/);
  });
  it('My Workflows says it is loading until the first read lands', () => {
    const s = src('CalcWorkflowsScreen.tsx');
    assert.match(s, /if \(ticket !== loadTicket\.current\) return;\s*setMineUnreadable\(workflowListUnreadable\(list\)\);\s*setMineLoaded\(true\);/);
    assert.match(s, /\{mineUnreadable\s*\? 'Your saved workflows could not be read[^']*'\s*: !mineLoaded\s*\? 'Loading your workflows…'/);
  });
});
