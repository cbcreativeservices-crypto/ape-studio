/**
 * Receipt: Comp A calculator audit round 2, twelve fixes K01–K12 (owner GO
 * 2026-11-27, 23:05 PT, "all 12"). Comp B audited ape-workbench 1ed10e8b.
 *
 * Each test uses the brief's repro inputs and fails on the code as audited.
 * Every expected figure is worked by hand from the published source or the
 * code rule (shown beside it), never read back from the app. The calculators
 * run through the REAL calcPanel compute block, and the workflow report is
 * built by the runner's REAL computeChain + buildRunSummary (sliced out of
 * CalcWorkflowRunScreen.tsx, as test/fixFirst15_calc_20261125 does).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

type AnyObj = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { WORKFLOW_TEMPLATES } = await import('../src/screens/lab/calc/workflowCatalog.ts');
const U = await import('../src/screens/lab/calc/calcUnits.ts');
const R = await import('../src/screens/lab/calc/calcReport.ts');
const { SYMBOL_GROUPS } = (await import('../src/screens/lab/calc/symbolsKey.ts')) as AnyObj;

const url = (p: string) => pathToFileURL(join(ROOT, 'src/screens/lab/calc', p)).href;
const slice = (src: string, from: string, to: string) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  assert.ok(a > 0 && b > a, `slice ${from}`);
  return src.slice(a, b);
};
const PANEL_SRC = read('src/screens/lab/calc/calcPanel.tsx');
const RUN_SRC = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');
// The REAL calcPanel compute block + the runner's REAL chain and summary.
const M: AnyObj = await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      stripTypeScriptTypes(
        `import { isRefused, refusalRows } from '${url('calcTypes.ts')}';\n` +
          `import { NEGATIVE_MSG, domainError, domainMsg, fmt, fmtCarried, isNonNegativeField, listProblem, liveImport, negativeInput, fmtSamples, namedOutputUnit, outputUnits, parseList, parseQuantity, unitsFor, wholeCount } from '${url('calcUnits.ts')}';\n` +
          `import { resolveStep } from '${url('workflowCatalog.ts')}';\n` +
          `import { carriedInputs, carriedValue, carrySource } from '${url('workflowCarry.ts')}';\n` +
          `import { ESTIMATE_SOURCE_LABEL, estimateFor, estimateLabel, estimateReportLine, estimateValue } from '${url('workflowEstimate.ts')}';\n` +
          slice(PANEL_SRC, 'export function defaultUnitIdx(', 'export const FieldRow') +
          slice(RUN_SRC, 'function linkedBound(', '/** Human line for a source label') +
          slice(RUN_SRC, 'function sourceLabel(', '/**\n * The compute chain') +
          slice(RUN_SRC, 'function computeChain(', 'export function CalcWorkflowRunScreen()') +
          '\nexport { computeChain, buildRunSummary };\n',
      ),
    ).toString('base64')
);

const fnOf = (ws: string, key: string): AnyObj => {
  const f = getWorkspace(ws).functions.find((x: AnyObj) => x.key === key);
  assert.ok(f, `${ws}.${key}`);
  return f;
};
/** calcPanel.runCompute on BASE-unit values, as the screen runs it. */
const run = (ws: string, key: string, v: Record<string, number>) => {
  const w = getWorkspace(ws);
  const f = fnOf(ws, key);
  return M.runCompute(f, v, f.inputs.map((k: string) => w.fields.find((x: AnyObj) => x.key === k)));
};
const row = (r: AnyObj, label: string) => {
  const o = r.outputs.find((x: AnyObj) => x.label === label);
  assert.ok(o, `${label} in ${r.outputs.map((x: AnyObj) => x.label).join(', ')} ${r.inputError ?? ''}`);
  return o;
};
const shown = (r: AnyObj, label: string) => M.formatOutput(row(r, label), 4, 0);
const near = (a: number, b: number, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const tpl = (id: string): AnyObj => {
  const t = (WORKFLOW_TEMPLATES as AnyObj[]).find((x) => x.id === id);
  assert.ok(t, id);
  return t;
};
const manual = (raw: string) => ({ raw, source: { kind: 'manual' } });

/** A finished run of template `w` on what the learner typed; the summary is
 *  the runner's own buildRunSummary over its own computeChain. */
function finishedRun(w: AnyObj, set: Record<number, Record<string, { raw: string; source: AnyObj }>>) {
  const r = {
    id: 'run-k',
    workflowId: w.id,
    workflowName: w.name,
    startedAt: '2026-11-27T20:00:00.000Z',
    completedAt: '2026-11-27T21:00:00.000Z',
    stepIndex: w.steps.length,
    steps: w.steps.map((s: AnyObj, i: number) => {
      const ws = getWorkspace(s.workspaceId);
      const inputs: AnyObj = {};
      for (const [k, b] of Object.entries(set[i] ?? {})) {
        inputs[k] = { ...b, unitIdx: M.defaultUnitIdx(ws.fields.find((x: AnyObj) => x.key === k)) };
      }
      return { inputs, stale: false };
    }),
  };
  const computed = M.computeChain(w, r);
  const summary = M.buildRunSummary(w, r, computed, (i: number) => computed[i]?.resolved?.fn.name ?? `step ${i + 1}`, () => undefined);
  return { computed, summary, report: R.buildReportFromSummary(summary) };
}

describe('K01 — Long Power Run step 3 checks the 240.4 breaker limit too', () => {
  const note = tpl('tpl-power-run').steps[2].note;
  it('the step note is Comp A’s wording', () => {
    assert.equal(
      note,
      'Whether the gauge from step 2 may carry the current (NEC Table 310.16 and its limits): the current from step 1 must be no more than its ALLOWABLE AMPACITY and no more than its MAX OVERCURRENT DEVICE (240.4) — the breaker has to carry the load, and 240.4(D) caps it at 15 A for 14 AWG, 20 A for 12 AWG and 30 A for 10 AWG; for a load that runs 3 hours or more, compare with MAX CONTINUOUS LOAD instead. If the current is more, choose a thicker conductor (a lower AWG number) and check again.',
    );
    assert.doesNotMatch(note, /its ALLOWABLE AMPACITY must be at least the current/);
  });
  it('24 A on 12 AWG (75 °C, 75 °C terminals, 30 °C, 2 CCC) fails by the breaker; 10 AWG passes', () => {
    // NEC Table 310.16 75 °C column: 12 AWG 25 A, 10 AWG 35 A; 240.4(D): 20 A and 30 A.
    const pass = (awg: number, I: number) => {
      const o = run('ampacity', 'awg', { awg, insul: 75, term: 75, ambient: 30, ccc: 2 });
      return I <= row(o, 'ALLOWABLE AMPACITY').value && I <= row(o, 'MAX OVERCURRENT DEVICE (240.4)').value;
    };
    const o12 = run('ampacity', 'awg', { awg: 12, insul: 75, term: 75, ambient: 30, ccc: 2 });
    assert.equal(row(o12, 'ALLOWABLE AMPACITY').value, 25);
    assert.equal(row(o12, 'MAX OVERCURRENT DEVICE (240.4)').value, 20);
    assert.equal(pass(12, 24), false, '24 A > the 20 A largest breaker for 12 AWG');
    const o10 = run('ampacity', 'awg', { awg: 10, insul: 75, term: 75, ambient: 30, ccc: 2 });
    assert.equal(row(o10, 'MAX OVERCURRENT DEVICE (240.4)').value, 30);
    assert.equal(pass(10, 24), true);
    // 14 AWG the same way: 20 A table, 15 A breaker.
    assert.equal(row(run('ampacity', 'awg', { awg: 14, insul: 75, term: 75, ambient: 30, ccc: 2 }), 'MAX OVERCURRENT DEVICE (240.4)').value, 15);
  });
});

describe('K02 — a workflow report headlines the step’s primaryResultLabel', () => {
  it('Long Power Run ending on 12 AWG / 90 °C / 75 °C terminals / 40 °C / 6 CCC → ALLOWABLE AMPACITY 21.84 A', () => {
    // 30 A (90 °C column) × 0.91 (36–40 °C) × 0.80 (4–6 CCC) = 21.84 A, under the 75 °C column's 25 A.
    const { summary, report } = finishedRun(tpl('tpl-power-run'), {
      0: { len: manual('10'), awg: manual('12'), current: manual('20'), vsrc: manual('120'), condTemp: manual('75') },
      1: { pct: manual('3') },
      2: { awg: manual('12'), insul: manual('90'), term: manual('75'), ambient: manual('40'), ccc: manual('6') },
    });
    const flagged = summary.results.filter((x: AnyObj) => x.primary === true);
    assert.deepEqual(flagged.map((x: AnyObj) => x.label), ['ALLOWABLE AMPACITY']);
    assert.equal(report.primaryResult?.label, 'ALLOWABLE AMPACITY');
    assert.equal(report.primaryResult?.formattedValue, '21.84 A');
    assert.match(R.reportToText(report), /PRIMARY RESULT\nALLOWABLE AMPACITY \.+ 21\.84 A/);
  });
  it('a result saved before the flag existed still headlines the last step’s first number', () => {
    const r = R.buildReportFromSummary({
      id: 'old', workflowName: 'Old', completedAt: '2026-11-01T00:00:00.000Z', inputs: [], warnings: [],
      results: [{ label: 'A', value: '1 Hz', unit: '', step: '1. One' }, { label: 'B', value: '2 Hz', unit: '', step: '2. Two' }, { label: 'C', value: '3 Hz', unit: '', step: '2. Two' }],
    });
    assert.equal(r.primaryResult?.label, 'B');
  });
});

describe('K03 — a dB difference is never relabelled as an absolute level', () => {
  it('SAMPLE-PEAK HEADROOM TO 0 dBFS: −3 dBFS peak → 3 dB; −0.1 → 0.1 dB', () => {
    // headroom = 0 dBFS − peak, a difference in dB.
    assert.equal(shown(run('loudtp', 'truePeakMargin', { samplePeak: -3, lossy: 0 }), 'SAMPLE-PEAK HEADROOM TO 0 dBFS'), '3 dB');
    assert.equal(shown(run('loudtp', 'truePeakMargin', { samplePeak: -0.1, lossy: 0 }), 'SAMPLE-PEAK HEADROOM TO 0 dBFS'), '0.1 dB');
    assert.equal(U.namedOutputUnit({ label: 'SAMPLE-PEAK HEADROOM TO 0 dBFS', quantity: 'db' }), null);
    assert.equal(U.namedOutputUnit({ label: 'GAIN TO −14 LUFS', quantity: 'number' }), null, 'any future label naming a reference as context');
  });
  it('every label that STATES its unit keeps it (the full list of tagged db/number answers, 2026-11-27)', () => {
    const stated: [string, string, string][] = [
      ['SAME LEVEL IN dBV', 'db', 'dBV'], ['LEVEL (dBu)', 'db', 'dBu'], ['SAME LEVEL IN dBu', 'db', 'dBu'], ['LEVEL (dBV)', 'db', 'dBV'],
      ['IF THIS IS dBu → in dBV', 'db', 'dBV'], ['IF THIS IS dBV → in dBu', 'db', 'dBu'],
      ['OUTPUT LEVEL (dBV)', 'db', 'dBV'], ['OUTPUT LEVEL (dBu)', 'db', 'dBu'], ['AS A LEVEL (dBu)', 'db', 'dBu'],
      ['THRESHOLD (dBu)', 'db', 'dBu'], ['THRESHOLD (dBV)', 'db', 'dBV'],
      ['SENSITIVITY (dBV/Pa)', 'number', 'dBV/Pa'], ['OUTPUT LEVEL (dBu)', 'number', 'dBu'], ['OUTPUT LEVEL (dBV)', 'number', 'dBV'],
      ['RECEIVED POWER (dBm)', 'number', 'dBm'], ['RESULTING TRUE PEAK (dBTP)', 'number', 'dBTP'], ['DIFFERENCE (LU)', 'number', 'LU'],
      ['SUGGESTED CEILING (dBTP)', 'number', 'dBTP'],
      // Non-level tags are unchanged.
      ['REQUIRED PANEL MASS (kg/m²)', 'number', 'kg/m²'], ['DROP-LIMITED AWG (CHECK AMPACITY)', 'number', 'AWG'], ['PEAK VOLUME DISPLACEMENT (Vd) — cm³', 'number', 'cm³'],
    ];
    for (const [label, quantity, unit] of stated) assert.equal(U.namedOutputUnit({ label, quantity }), unit, label);
    assert.equal(U.namedOutputUnit({ label: 'OUTPUT LEVEL', quantity: 'db', meaning: 'db:dbfs-level' }), 'dBFS');
  });
});

describe('K04 — symbols key: RT falls as −ln(1 − ā) rises (Eyring)', () => {
  it('the ln example is RT ∝ 1 / (−ln(1 − ā))', () => {
    const ln = (SYMBOL_GROUPS as AnyObj[]).flatMap((g) => g.entries).find((e: AnyObj) => e.symbol === 'ln');
    assert.equal(ln.example, 'RT ∝ 1 / (−ln(1 − ā))');
  });
});

describe('K05 — the NIOSH ceiling is 140 dBA on all noise (NIOSH 98-126 §1.1.4)', () => {
  const TEXT =
    'A level here is above 140 dBA. NIOSH’s dose counts sound only from 80 to 140 dBA, and the NIOSH recommended exposure limit sets a ceiling: no exposure to continuous, varying, intermittent or impulsive noise should exceed 140 dBA. Levels above 140 dBA are counted here by extending the same 3 dB rule, so the result is the formula’s answer, not an allowed exposure.';
  it('allowNiosh 141 dBA and doseNiosh 145 dBA print Comp A’s wording', () => {
    assert.equal(row(run('dose', 'allowNiosh', { lex: 141 }), 'ABOVE 140 dBA').text, TEXT);
    assert.equal(row(M.runCompute(fnOf('dose', 'doseNiosh'), { doseLevels: [120, 145], doseMins: [1, 1] }, getWorkspace('dose').fields.filter((f: AnyObj) => ['doseLevels', 'doseMins'].includes(f.key))), 'ABOVE 140 dBA').text, TEXT);
    assert.doesNotMatch(TEXT, /dB peak/);
  });
});

describe('K06 — Hearing Exposure: the free-field level is a LOWER bound indoors', () => {
  it('step 1 says so, in Comp A’s wording', () => {
    assert.equal(
      tpl('tpl-hearing-dose').steps[0].note,
      'SPL at the audience or operator distance. Enter L₁ as an A-weighted level (dBA). Indoors this free-field figure is a LOWER bound: past the critical distance the room keeps the level up, so the real level is usually higher and the allowable time in step 2 shorter. For a real exposure decision, measure the level (dBA, slow) at that position and type it into step 2.',
    );
  });
  it('the repro: free-field 91.94 dB gives 96.61 min; a measured 98 dBA gives 23.81 min', () => {
    // 110 − 20·log10(32/4) = 91.94; 480 / 2^((91.94 − 85)/3) = 96.61; 480 / 2^(13/3) = 23.81.
    const L = row(run('spldist', 'point', { l1: 110, d1: 4, d2: 32 }), 'LEVEL AT d₂').value;
    near(L, 110 - 20 * Math.log10(8), 1e-9);
    near(row(run('dose', 'allowNiosh', { lex: L }), 'ALLOWABLE TIME (85 dBA / 3 dB / 8 h)').value, 480 * 60 / Math.pow(2, (L - 85) / 3), 1e-6);
    assert.equal(shown(run('dose', 'allowNiosh', { lex: 98 }), 'ALLOWABLE TIME (85 dBA / 3 dB / 8 h)'), '23.81 min');
  });
});

describe('K07 — the 75 dB preamp limit is on the setting, not the gain to target', () => {
  it('1.12 mV/Pa at 78 dB SPL, +4 dBu target, 12 dB headroom → 76.78 dB to target, set 64.78 dB', () => {
    // p = 20 µPa·10^(78/20) = 0.15887 Pa; mic = 20·log10(1.12e-3·0.15887 / 0.7746) = −72.78 dBu.
    const mic = 20 * Math.log10((1.12e-3 * U.P_REF_PA * Math.pow(10, 78 / 20)) / U.DBU_REF_V);
    const r = run('micgain', 'gain', { sens: 1.12, spl: 78, target: 4, headroom: 12 });
    assert.equal(r.inputError ?? null, null);
    near(row(r, 'GAIN TO HIT TARGET (dB)').value, 4 - mic, 1e-9);
    assert.equal(shown(r, 'GAIN TO HIT TARGET (dB)'), '76.78 dB');
    assert.equal(shown(r, 'SUGGESTED GAIN LEAVING 12 dB HEADROOM'), '64.78 dB');
  });
  it('a setting past 75 dB is still refused in words (1.12 mV/Pa at 60 dB SPL: setting ≈ 82.8 dB)', () => {
    const r = run('micgain', 'gain', { sens: 1.12, spl: 60, target: 4, headroom: 12 });
    assert.match(r.inputError ?? '', /needs more gain than most preamps have/);
  });
});

describe('K08 — the SMPTE ST 12-3 high frame rates have timecode', () => {
  it('1000 frames at 120 fps → 8.333 s, 00:00:08:40', () => {
    // 1000 / 120 = 8.333 s; 1000 = 8·120 + 40.
    const r = run('timecode', 'fromFrames', { frames: 1000, fps: 120 });
    assert.equal(r.inputError ?? null, null);
    assert.equal(shown(r, 'TOTAL TIME'), '8.333 s');
    assert.deepEqual(r.table.rows[0], ['00', '00', '08', '40']);
    assert.equal(row(run('timecode', 'toFrames', { hours: 0, mins: 0, secs: 10, fps: 120 }), 'TOTAL FRAMES').value, 1200);
  });
  it('72, 96, 100, 119.88 and 120 fps are accepted; 12.5 fps is refused with the new list', () => {
    for (const fps of [72, 96, 100, 119.88, 120000 / 1001, 120]) assert.equal(run('timecode', 'fromFrames', { frames: 1000, fps }).inputError ?? null, null, String(fps));
    assert.equal(
      run('timecode', 'fromFrames', { frames: 9000, fps: 12.5 }).inputError,
      'Timecode needs a standard frame rate — 23.976, 24, 25, 29.97, 30, 47.952, 48, 50, 59.94, 60, 72, 96, 100, 119.88 or 120 fps. 12.5 fps has no HH:MM:SS:FF labels.',
    );
  });
});

describe('K09 — workflow results say which step gave them', () => {
  it('Series & Parallel Impedance, 8, 8, 16 Ω: 32 Ω from the series step, 3.2 Ω from the parallel step', () => {
    // 8 + 8 + 16 = 32; 1 / (1/8 + 1/8 + 1/16) = 3.2.
    const { report } = finishedRun(tpl('tpl-impedance'), { 0: { rlist: manual('8, 8, 16') }, 1: { rlist: manual('8, 8, 16') } });
    const t = R.reportToText(report);
    assert.match(t, /TOTAL RESISTANCE \.+ 32 Ω\n {3}from Series resistance\n/);
    assert.match(t, /TOTAL RESISTANCE \.+ 3\.2 Ω\n {3}from Parallel resistance\n/);
    const card = read('src/screens/lab/calc/ReportCard.tsx');
    assert.match(card, /r\.reportType === 'workflow' && v\.sourceStepName \? <Text style=\{styles\.detail\}>from \{v\.sourceStepName\}<\/Text> : null/);
  });
  it('a single calculator report adds no step line', () => {
    const r = R.buildReportFromCalc({ workspaceName: 'W', functionName: 'F', inputs: [], results: [{ label: 'X', formattedValue: '1 Ω' }], createdAtISO: '2026-11-27T00:00:00.000Z' });
    assert.doesNotMatch(R.reportToText(r), /\n {3}from /);
  });
});

describe('K10 — the report states the gauge step 3 checked (9 AWG → 8 AWG)', () => {
  it('30 m, 20 A, 120 V, 3 %, 20 °C → 9 AWG; checked as 8 AWG (90 °C, 60 °C terminals, 30 °C, 3 CCC) → 40 A', () => {
    // 8 AWG, NEC Table 310.16 60 °C column = 40 A (no ambient or bundling factor at 30 °C, 3 CCC).
    const { summary, report } = finishedRun(tpl('tpl-power-run'), {
      0: { len: manual('30'), awg: manual('10'), current: manual('20'), vsrc: manual('120'), condTemp: manual('20') },
      1: { pct: manual('3') },
      2: { insul: manual('90'), term: manual('60'), ambient: manual('30'), ccc: manual('3') },
    });
    assert.equal(summary.results.find((x: AnyObj) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)').value, '9 AWG');
    const gauge = report.inputs.find((i: AnyObj) => i.label === 'CONDUCTOR SIZE (AWG)');
    assert.ok(gauge, report.inputs.map((i: AnyObj) => i.label).join(', '));
    assert.equal(gauge.formattedValue, '8');
    assert.equal(report.primaryResult?.label, 'ALLOWABLE AMPACITY');
    assert.equal(report.primaryResult?.formattedValue, '40 A');
    const t = R.reportToText(report);
    assert.match(t, /CONDUCTOR SIZE \(AWG\) \.+ 8\n/);
    assert.ok(t.includes('Step 3 (Ampacity of a conductor (14 AWG – 4/0)): 9 AWG is not a size Table 310.16 lists; using 8 AWG, the next thicker.'));
  });
  it('a carry that did not change its value stays out of INPUTS', () => {
    // 10 m, 24 A, 120 V, 3 %, 75 °C → 2.796 mm² → 12 AWG, a size the table lists (Comp B, K01).
    const { summary, report } = finishedRun(tpl('tpl-power-run'), {
      0: { len: manual('10'), awg: manual('12'), current: manual('24'), vsrc: manual('120'), condTemp: manual('75') },
      1: { pct: manual('3') },
      2: { insul: manual('75'), term: manual('75'), ambient: manual('30'), ccc: manual('2') },
    });
    assert.equal(summary.results.find((x: AnyObj) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)').value, '12 AWG');
    assert.equal(report.inputs.filter((i: AnyObj) => i.label === 'CONDUCTOR SIZE (AWG)').length, 0);
    assert.doesNotMatch(R.reportToText(report), /is not a size Table 310\.16 lists/);
  });
});

describe('K11 — a project SPL value offers dB SPL only, no dBA chip', () => {
  it('the editor, its reopen and its save all use unitsFor (plain units)', () => {
    const s = read('src/screens/lab/calc/CalcProjectsScreen.tsx');
    assert.doesNotMatch(s, /QUANTITIES\[/);
    assert.match(s, /const units = unitsFor\(PROJECT_KINDS\[kindIdx\]\.kind\);/);
    assert.match(s, /const units = unitsFor\(kind\);/);
    assert.match(s, /const units = unitsFor\(kind\.kind\);/);
    assert.deepEqual(U.unitsFor('spl').map((u: AnyObj) => u.label), ['dB SPL']);
  });
});

describe('K12 — notes are named up to 20 kHz (owner decision 2026-11-27)', () => {
  it('16 kHz at A4 = 440 → B9 (beyond MIDI 127), 21.3 cents sharp, exact B9 15 804 Hz', () => {
    // m = 69 + 12·log2(16000/440) = 131.21 → B9 (131 mod 12 = 11, octave 131/12 − 1 = 9); B9 = 440·2^(62/12).
    const m = 69 + 12 * Math.log2(16000 / 440);
    const r = run('pitch', 'freqToNote', { f: 16000, ref: 440 });
    assert.equal(r.inputError ?? null, null);
    assert.equal(row(r, 'NEAREST NOTE').text, 'B9 (beyond MIDI 127)');
    assert.equal(row(r, 'TUNING OFFSET').text, '21.3 cents sharp of B9.');
    near(row(r, 'CENTS OFF').value, (m - 131) * 100, 1e-9);
    near(row(r, 'EXACT B9').value, 440 * Math.pow(2, 62 / 12), 1e-9);
    assert.equal(Math.round(row(r, 'EXACT B9').value), 15804);
    assert.match(fnOf('pitch', 'freqToNote').steps({ f: 16000, ref: 440 }).join(' '), /Nearest whole note: B9 \(beyond MIDI 127, the top of the MIDI range; it would be number 131\)/);
  });
  it('20 kHz is named; above 20 kHz is refused; MIDI 127 keeps its number', () => {
    assert.equal(row(run('pitch', 'freqToNote', { f: 20000, ref: 440 }), 'NEAREST NOTE').text, 'D#10 (beyond MIDI 127)');
    assert.equal(run('pitch', 'freqToNote', { f: 20001, ref: 440 }).inputError, '20001 Hz is above 20 kHz, the top of human hearing, so this tool names no note for it.');
    assert.equal(row(run('pitch', 'freqToNote', { f: 12900, ref: 440 }), 'NEAREST NOTE').text, 'G9 (MIDI 127)');
    assert.equal(row(run('pitch', 'freqToNote', { f: 440, ref: 440 }), 'NEAREST NOTE').text, 'A4 (MIDI 69)');
  });
});

// ── Follow-ups (owner 2026-11-28, after the independent check) ─────────────

describe('K12 follow-up 1 — note frequencies to 5 significant figures', () => {
  // 440·2^((m − 69)/12): B9 (131) 15804.3, A#9 (130) 14917.2, C10 (132) 16744.0,
  // C4 (60) 261.626, B3 246.942, C#4 277.183, G9 (127) 12543.9, D#10 (135) 19912.1.
  it('EXACT and ADJACENT NOTES print 5 figures; the worked step uses the same figure', () => {
    const r = run('pitch', 'freqToNote', { f: 16000, ref: 440 });
    assert.equal(shown(r, 'EXACT B9'), '15804 Hz');
    assert.equal(row(r, 'ADJACENT NOTES').text, 'A#9 = 14917 Hz below · C10 = 16744 Hz above.');
    assert.equal(
      fnOf('pitch', 'freqToNote').steps({ f: 16000, ref: 440 })[1],
      'Nearest whole note: B9 (beyond MIDI 127, the top of the MIDI range; it would be number 131), whose exact frequency is 15804 Hz.',
    );
    const c4 = run('pitch', 'freqToNote', { f: 261.6, ref: 440 });
    assert.equal(shown(c4, 'EXACT C4'), '261.63 Hz');
    assert.equal(row(c4, 'ADJACENT NOTES').text, 'B3 = 246.94 Hz below · C#4 = 277.18 Hz above.');
    assert.equal(shown(run('pitch', 'freqToNote', { f: 12544, ref: 440 }), 'EXACT G9'), '12544 Hz');
    assert.equal(shown(run('pitch', 'freqToNote', { f: 20000, ref: 440 }), 'EXACT D#10'), '19912 Hz');
  });
  it('a 6-figure setting still gets 6; nothing else changes rounding', () => {
    assert.equal(M.formatOutput(row(run('pitch', 'freqToNote', { f: 16000, ref: 440 }), 'EXACT B9'), 6, 0), '15804.3 Hz');
    // CENTS OFF (same function) and an ordinary frequency answer stay at the setting.
    assert.equal(shown(run('pitch', 'freqToNote', { f: 16000, ref: 440 }), 'CENTS OFF'), '21.31 cents');
    const minSigUsers = read('src/screens/lab/calc/workspaces/roomsMusic.ts').match(/minSig:/g) ?? [];
    assert.equal(minSigUsers.length, 1, 'only freqToNote’s EXACT row asks for 5 figures');
    for (const f of readdirSync(join(ROOT, 'src/screens/lab/calc/workspaces')).filter((x) => x.endsWith('.ts') && x !== 'roomsMusic.ts')) {
      assert.doesNotMatch(read(`src/screens/lab/calc/workspaces/${f}`), /minSig:/, f);
    }
  });
});

describe('K12 follow-up 2 — owner-approved refusal wording', () => {
  it('above 20 kHz', () => {
    assert.equal(run('pitch', 'freqToNote', { f: 20001, ref: 440 }).inputError, '20001 Hz is above 20 kHz, the top of human hearing, so this tool names no note for it.');
  });
  it('below range, worked from the A4 entered (ref·2^(−69/12), ref·2^(−69.5/12))', () => {
    assert.equal(
      run('pitch', 'freqToNote', { f: 5, ref: 440 }).inputError,
      '5 Hz is below the lowest note this tool names (C-1, MIDI 0, is about 8.18 Hz at A4 = 440 Hz; anything under about 7.94 Hz is out of range), so it names no note for it.',
    );
    // A4 = 432: 432·2^(−69/12) = 8.03; 432·2^(−69.5/12) = 7.797 → "7.8" at 3 figures.
    assert.equal(
      run('pitch', 'freqToNote', { f: 5, ref: 432 }).inputError,
      '5 Hz is below the lowest note this tool names (C-1, MIDI 0, is about 8.03 Hz at A4 = 432 Hz; anything under about 7.8 Hz is out of range), so it names no note for it.',
    );
    // The edge itself: 7.95 Hz rounds to MIDI 0 and is named; 7.93 Hz is refused.
    assert.equal(row(run('pitch', 'freqToNote', { f: 7.95, ref: 440 }), 'NEAREST NOTE').text, 'C-1 (MIDI 0)');
    assert.match(run('pitch', 'freqToNote', { f: 7.93, ref: 440 }).inputError ?? '', /below the lowest note this tool names/);
  });
});

describe('K02 follow-up 3 — an OLD saved Long Power Run (no primary flag) still headlines ALLOWABLE AMPACITY', () => {
  it('hand-built pre-flag summary of the K02 repro → PRIMARY RESULT ALLOWABLE AMPACITY 21.84 A', () => {
    const fn = fnOf('ampacity', 'awg');
    const outs = fn.compute({ awg: 12, insul: 90, term: 75, ambient: 40, ccc: 6 });
    const step3 = `3. ${fn.name}`;
    const old = {
      id: 'saved-2026-11-20', workflowName: 'Long Power Run', completedAt: '2026-11-20T10:00:00.000Z', inputs: [], warnings: [],
      results: [
        { label: 'VOLTAGE DROP', value: '2.1 V', unit: '', step: '1. Voltage drop over a run' },
        ...outs.map((o: AnyObj) => ({ label: o.label, value: 'value' in o ? M.formatOutput(o, 4, 0) : o.text, unit: '', step: step3 })),
      ],
    };
    assert.ok(!old.results.some((x: AnyObj) => 'primary' in x));
    assert.equal(old.results.find((x) => x.step === step3)!.label, 'TABLE 310.16 AMPACITY', 'the first row of the step is the raw table value');
    const r = R.buildReportFromSummary(old);
    assert.equal(r.primaryResult?.label, 'ALLOWABLE AMPACITY');
    assert.equal(r.primaryResult?.formattedValue, '21.84 A');
  });
  it('the same old step in a renamed (custom) workflow is found by its calculator name', () => {
    const fn = fnOf('ampacity', 'awg');
    const outs = fn.compute({ awg: 12, insul: 90, term: 75, ambient: 40, ccc: 6 });
    const r = R.buildReportFromSummary({
      id: 'c', workflowName: 'My Feeder Check', completedAt: '2026-11-20T10:00:00.000Z', inputs: [], warnings: [],
      results: outs.map((o: AnyObj) => ({ label: o.label, value: 'value' in o ? M.formatOutput(o, 4, 0) : o.text, unit: '', step: `1. ${fn.name}` })),
    });
    assert.equal(r.primaryResult?.label, 'ALLOWABLE AMPACITY');
  });
});

describe('follow-up 4 — the dose warning names OSHA’s impulse limit', () => {
  it('Peak/impulse line, exact', () => {
    const w = getWorkspace('dose').warnings as string;
    assert.ok(w.includes('Peak/impulse limits (e.g. OSHA’s 140 dB peak for impulse or impact noise) are a separate constraint this workspace does not evaluate.'));
    assert.doesNotMatch(w, /\(e\.g\. 140 dB peak\)/);
  });
});

// ── F1/F2 (owner GO 2026-11-28, relayed by Comp A after it verified K01–K12) ──

describe('F1 — the FRAME RATE help lists every rate Timecode accepts', () => {
  it('help = the TC_RATES list, the same as the refusal message', () => {
    const fps = getWorkspace('timecode').fields.find((f: AnyObj) => f.key === 'fps');
    assert.equal(fps.help, 'Frames per second: 23.976, 24, 25, 29.97, 30, 47.952, 48, 50, 59.94, 60, 72, 96, 100, 119.88 or 120.');
    const list = 'Frames per second: '.length;
    const refusal = run('timecode', 'fromFrames', { frames: 1, fps: 12.5 }).inputError as string;
    assert.ok(refusal.includes(`${fps.help.slice(list, -1)} fps.`), 'help and refusal name the same rates');
  });
});

const K = await import('../src/screens/lab/calc/workflowCarry.ts');
const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');
describe('F2 — a plain dB SPL is never offered to the dBA-only EXPOSURE LEVEL', () => {
  const lex = getWorkspace('dose').fields.find((f: AnyObj) => f.key === 'lex');
  const offered = (ws: string, key: string, label: string, v: Record<string, number | number[]>) => {
    const o = fnOf(ws, key).compute(v).find((x: AnyObj) => x.label === label);
    assert.ok(o && 'value' in o, label);
    return U.chainFits(o.label, o.quantity, lex, o.meaning) && U.aliasUnitFits(o.unit, lex);
  };
  it('lex is the only alias-only input in the lab', () => {
    const only = (WORKSPACES as AnyObj[]).flatMap((w: AnyObj) => w.fields.filter((f: AnyObj) => U.aliasOnlyUnits(f)).map((f: AnyObj) => `${w.id}.${f.key}`));
    assert.deepEqual(only, ['dose.lex']);
  });
  it('a dB SPL answer (spldist LEVEL AT d₂) is NOT offered; a dBA answer (dose Leq OVER THE INTERVALS) IS', () => {
    assert.equal(offered('spldist', 'point', 'LEVEL AT d₂', { l1: 110, d1: 4, d2: 32 }), false);
    assert.equal(offered('spladd', 'combine', 'COMBINED LEVEL', { levels: [90, 90] }), false);
    assert.equal(offered('dose', 'leq', 'Leq OVER THE INTERVALS', { doseLevels: [85, 94], doseMins: [60, 60] }), true);
  });
  it('a saved project SPL value (no unit) is not offered to lex; still offered to a plain SPL input', () => {
    assert.equal(U.unitFits('FOH level', 'spl', lex) && U.aliasUnitFits(undefined, lex), false);
    const l1 = getWorkspace('spldist').fields.find((f: AnyObj) => f.key === 'l1');
    assert.equal(U.unitFits('FOH level', 'spl', l1) && U.aliasUnitFits(undefined, l1), true);
  });
  it('lex still takes lex (an earlier dose step’s own EXPOSURE LEVEL); a plain SPL input does not', () => {
    assert.equal(K.inputOfferFits('dose', lex, 'dose', lex), true);
    const l1 = getWorkspace('spldist').fields.find((f: AnyObj) => f.key === 'l1');
    assert.equal(K.inputOfferFits('spldist', l1, 'dose', lex), false);
  });
  it('every offer site applies the rule (runner ⤵ USE, project values, workspace SEND/USE, the guide’s SEND reach)', () => {
    const run_ = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');
    assert.match(run_, /chainFits\(o\.label, o\.quantity, f, o\.meaning\) && aliasUnitFits\(o\.unit, f\)/);
    assert.match(run_, /\.filter\(\(v\) => unitFits\(v\.label, v\.quantity, f\) && aliasUnitFits\(undefined, f\)\)/);
    const ws_ = read('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
    assert.match(ws_, /chainFits\(chain\.label, chain\.quantity, f, chain\.meaning\) && aliasUnitFits\(chain\.unit, f\)/);
    assert.match(ws_, /setChainValue\(\{ label: o\.label, quantity: o\.quantity, meaning: o\.meaning, unit: o\.unit,/);
    assert.match(read('src/screens/lab/calc/calcScreenGuides.ts'), /!chainFits\(label, quantity, f, meaning\) \|\| !aliasUnitFits\(unit, f\)/);
  });
  it('the reviewed Hearing Exposure carry (step 1 LEVEL AT d₂ → step 2) is unchanged: its note asks for L₁ in dBA', () => {
    const { computed } = finishedRun(tpl('tpl-hearing-dose'), { 0: { l1: manual('110'), d1: manual('4'), d2: manual('32') } });
    // 110 − 20·log10(32/4) = 91.938 → carried as typed text "91.94" (fmtCarried).
    assert.match(computed[1].effRaw.lex, /^91\.9/);
  });
});
