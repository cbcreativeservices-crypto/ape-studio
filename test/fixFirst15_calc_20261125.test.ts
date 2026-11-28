/**
 * Fix-first 15 (owner 2026-11-25), group CALC — the Calculator Lab workflows
 * (lab controls audit, "fix first" items 1 and 2; Appendix D findings 1, 6–10).
 *
 * 1. Loudspeaker SPL Estimate: step 2 got step 1's level but not the distance
 *    it was worked out at. Following the "often 1 m" hint gave 79.93 dB at 8 m
 *    for a true 99.93 dB. Step 2 now CARRIES both (level and distance).
 * 2. A value typed in step 1 was neither carried nor offered to a later step,
 *    and an edit left the later step on the old number while the ↻ note said
 *    "N later results recalculated". Template steps now carry what they share
 *    (reviewed link by link — the table below), any step offers an earlier
 *    input that is the same thing, and the ↻ note counts every dependent step
 *    and names one that cannot be worked out from the new value.
 *
 * The chain below is the runner's REAL computeChain (sliced out of
 * CalcWorkflowRunScreen.tsx; owner 2026-11-25, fix-first 15 round 2) run on
 * the REAL calcPanel compute block (sliced out of calcPanel.tsx, as
 * test/screenGuide_calc_20261031 does) and the real carry helpers. Single-calculator maths is untouched: every
 * existing calc test still passes, and the outputs checked here are the
 * calculators' own.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const U = await import('../src/screens/lab/calc/calcUnits.ts');
const C = await import('../src/screens/lab/calc/workflowCatalog.ts');
const K = await import('../src/screens/lab/calc/workflowCarry.ts');
const { WORKFLOW_TEMPLATES, resolveStep, validateWorkflow } = C;

// The REAL calcPanel compute path (defaultUnitIdx, buildValues, runCompute, formatOutput).
const Panel = await (async () => {
  const PANEL = read('src/screens/lab/calc/calcPanel.tsx');
  const a = PANEL.indexOf('export function defaultUnitIdx(');
  const b = PANEL.indexOf('export const FieldRow');
  assert.ok(a > 0 && b > a, 'calcPanel.tsx: the pure compute block was found');
  const unitsUrl = pathToFileURL(join(ROOT, 'src/screens/lab/calc/calcUnits.ts')).href;
  const typesUrl = pathToFileURL(join(ROOT, 'src/screens/lab/calc/calcTypes.ts')).href;
  const head =
    `import { isRefused } from '${typesUrl}';\n` +
    `import { NEGATIVE_MSG, domainError, domainMsg, fmt, isNonNegativeField, listProblem, negativeInput, fmtSamples, namedOutputUnit, outputUnits, parseList, parseQuantity, unitsFor, wholeCount } from '${unitsUrl}';\n`;
  return import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(head + PANEL.slice(a, b))).toString('base64'));
})();

type AnyObj = any; // eslint-disable-line @typescript-eslint/no-explicit-any
type Bound = { raw: string; unitIdx: number; source: AnyObj };
const tplOf = (id: string): AnyObj => {
  const t = (WORKFLOW_TEMPLATES as AnyObj[]).find((w) => w.id === id);
  assert.ok(t, id);
  return t;
};
const manual = (raw: string, unitIdx?: number) => ({ raw, unitIdx, source: { kind: 'manual' } });

// owner 2026-11-25, fix-first 15 round 2: the chain is the runner's REAL
// `computeChain` and `linkedBound`, sliced out of CalcWorkflowRunScreen.tsx
// (the file imports React Native, so node cannot import it whole) and run on
// the real calcPanel compute block and the real pure helpers — never a copy
// of the loop. A change to the runner's loop is what these tests exercise.
const Chain = await (async () => {
  const RUN_SRC = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');
  const PANEL_SRC = read('src/screens/lab/calc/calcPanel.tsx');
  const slice = (src: string, from: string, to: string) => {
    const a = src.indexOf(from);
    const b = src.indexOf(to, a);
    assert.ok(a > 0 && b > a, `slice ${from}`);
    return src.slice(a, b);
  };
  const url = (p: string) => pathToFileURL(join(ROOT, 'src/screens/lab/calc', p)).href;
  const head =
    `import { isRefused } from '${url('calcTypes.ts')}';\n` +
    `import { NEGATIVE_MSG, domainError, domainMsg, fmt, fmtCarried, isNonNegativeField, listProblem, liveImport, negativeInput, fmtSamples, namedOutputUnit, outputUnits, parseList, parseQuantity, unitsFor, wholeCount } from '${url('calcUnits.ts')}';\n` +
    `import { resolveStep } from '${url('workflowCatalog.ts')}';\n` +
    `import { carriedInputs, carriedValue, carrySource } from '${url('workflowCarry.ts')}';\n` +
    `import { estimateFor, estimateValue } from '${url('workflowEstimate.ts')}';\n`;
  const body =
    slice(PANEL_SRC, 'export function defaultUnitIdx(', 'export const FieldRow') +
    slice(RUN_SRC, 'function linkedBound(', '/** Human line for a source label') +
    slice(RUN_SRC, 'function computeChain(', 'export function CalcWorkflowRunScreen()') +
    '\nexport { computeChain, linkedBound };\n';
  return import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(head + body)).toString('base64'));
})();

/** The runner's chain on what the learner set (`set[step][key]`); every other
 *  field takes the template's carry, as in the app. (`carry` is unused now:
 *  the real loop always carries.) */
function runChain(w: AnyObj, set: Record<number, Record<string, Partial<Bound>>>, carry = true) {
  const run = {
    steps: w.steps.map((step: AnyObj, i: number) => {
      const r = resolveStep(step)!;
      const inputs: Record<string, Bound> = {};
      for (const [k, g] of Object.entries(set[i] ?? {})) {
        const f = r.ws.fields.find((x: AnyObj) => x.key === k);
        inputs[k] = { raw: g.raw ?? '', unitIdx: g.unitIdx ?? Panel.defaultUnitIdx(f), source: g.source ?? { kind: 'manual' } };
      }
      return { inputs, stale: false };
    }),
  };
  const out: AnyObj[] = Chain.computeChain(w, run);
  // What each field is bound to, as the runner reads it (its own linkedBound).
  out.forEach((c: AnyObj, i: number) => {
    c.bindings = Object.fromEntries(c.fields.map((f: AnyObj) => [f.key, run.steps[i].inputs[f.key] ?? Chain.linkedBound(w, i, f)]));
  });
  return out;
}
const shown = (step: AnyObj, label: string): string => {
  const o = step.result.outputs.find((x: AnyObj) => x.label === label);
  assert.ok(o && 'value' in o, `${label}: ${JSON.stringify(step.result).slice(0, 300)}`);
  return Panel.formatOutput(o, 4, 0);
};
const deps = (w: AnyObj, chain: AnyObj[], from: number, key: string) =>
  K.dependentSteps(
    w.steps.length,
    (i: number) => chain[i].fields.map((f: AnyObj) => f.key),
    (i: number, k: string) => chain[i].bindings[k]?.source,
    from,
    key,
  );

describe('item 1 — Loudspeaker SPL Estimate carries the level WITH its distance', () => {
  const w = tplOf('tpl-spl-estimate');
  const step1 = { sens: manual('97'), power: manual('500'), dist: manual('10'), headroom: manual('6'), nspk: manual('1') };
  it('step 1: 97.99 dB SPL at 10 m', () => {
    const c = runChain(w, { 0: step1 });
    assert.equal(shown(c[0], 'PREDICTED SPL (one speaker, after headroom)'), '97.99 dB SPL');
  });
  it('step 2 arrives with L₁ = 97.99 dB SPL and d₁ = 10 m: at 8 m it reads 99.93 dB SPL, the direct answer at 8 m', () => {
    const c = runChain(w, { 0: step1, 1: { d2: manual('8') } });
    assert.equal(c[1].effRaw.l1, '97.9897');
    assert.equal(c[1].effRaw.d1, '10');
    assert.equal(shown(c[1], 'LEVEL AT d₂'), '99.93 dB SPL');
    const direct = runChain(w, { 0: { ...step1, dist: manual('8') } });
    assert.equal(shown(direct[0], 'PREDICTED SPL (one speaker, after headroom)'), '99.93 dB SPL');
    // Both carried values are marked as coming from step 1 (and so stay out of the report's INPUTS).
    assert.equal(c[1].bindings.d1.source.inputKey, 'dist');
    assert.equal(c[1].bindings.l1.source.outputLabel, 'PREDICTED SPL (one speaker, after headroom)');
  });
  it('the old way — level carried, d₁ typed from the "often 1 m" hint — is the 20 dB error the audit found', () => {
    const c = runChain(w, { 0: step1, 1: { d1: manual('1'), d2: manual('8') } });
    assert.equal(shown(c[1], 'LEVEL AT d₂'), '79.93 dB SPL');
  });
  it('editing step 1’s distance flows on; the answer at 8 m stays 99.93 dB (the same speaker, the same seat)', () => {
    const c = runChain(w, { 0: { ...step1, dist: manual('20') }, 1: { d2: manual('8') } });
    assert.equal(c[1].effRaw.d1, '20');
    assert.equal(shown(c[1], 'LEVEL AT d₂'), '99.93 dB SPL');
    assert.deepEqual(deps(w, c, 0, 'dist'), [1]);
    assert.equal(K.recalcNoteText('LISTENING DISTANCE', [1], () => true), 'LISTENING DISTANCE changed — 1 later result recalculated.');
  });
  it('the 1 m SPL stays unchainable: a 1 m level beside the carried 10 m distance would be 20 dB wrong the other way', () => {
    const o = getWorkspace('speakerpower').functions.find((f: AnyObj) => f.key === 'predictspl').compute({ sens: 97, power: 500, dist: 10, headroom: 6, nspk: 1 });
    assert.equal(o.find((x: AnyObj) => x.label.startsWith('SPL AT 1 m')).chainable, false);
  });
});

describe('item 2 — the four named workflows', () => {
  it('Delay Speaker Setup: step 2 uses step 1’s temperature, so its speed of sound IS step 1’s', () => {
    const w = tplOf('tpl-delay-speaker');
    const c = runChain(w, { 0: { temp: manual('30') }, 1: { dist: manual('30') } });
    assert.equal(c[1].effRaw.temp, '30');
    assert.equal(shown(c[1], 'SPEED OF SOUND USED'), shown(c[0], 'SPEED OF SOUND'));
    // Edit step 1 → step 2's delay follows.
    const c2 = runChain(w, { 0: { temp: manual('0') }, 1: { dist: manual('30') } });
    assert.notEqual(shown(c2[1], 'DELAY'), shown(c[1], 'DELAY'));
    assert.equal(shown(c2[1], 'SPEED OF SOUND USED'), shown(c2[0], 'SPEED OF SOUND'));
    // Units: a step 2 field shown in °F reads step 1's 30 °C as 86 °F.
    const f = runChain(w, { 0: { temp: manual('30') }, 1: { dist: manual('30'), temp: { source: K.carrySource(w, 1, 'temp'), unitIdx: 1, raw: '' } } });
    assert.equal(f[1].effRaw.temp, '86');
    assert.equal(shown(f[1], 'DELAY'), shown(c[1], 'DELAY'));
  });
  it('Delay Speaker Setup: the buffer-latency step takes no delay (no calculator subtracts one) — HELD for the owner', () => {
    const lat = getWorkspace('latency').functions.find((f: AnyObj) => f.key === 'bufLatency');
    assert.deepEqual(lat.inputs, ['buf', 'sr']);
    assert.equal(tplOf('tpl-delay-speaker').steps[2].carry, undefined);
  });
  // owner 2026-11-25, fix-first 15 round 2: the plan now opens with the
  // room's RT60 NOW (step 1), so the panels step is step 3 and its CURRENT
  // RT60 is carried too (test/fixNext_calc_20261125 has the rest).
  it('Acoustic Treatment Plan: the panels step uses the same room volume and target RT60 as the absorption step', () => {
    const w = tplOf('tpl-treatment-plan');
    const c = runChain(w, { 0: { vol: manual('150'), absA: manual('20') }, 1: { targetRt: manual('0.5') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } });
    assert.equal(c[2].effRaw.vol, '150');
    assert.equal(c[2].effRaw.rtTgt, '0.5');
    // With the room's real current RT60 (0.161 × 150 ÷ 20 = 1.2075 s, now
    // carried) the two steps agree on the absorption to add: 28.3 m².
    assert.equal(c[2].effRaw.rtCur, '1.2075');
    assert.equal(shown(c[1], 'ABSORPTION TO ADD'), '28.3 m²');
    assert.equal(shown(c[2], 'ABSORPTION TO ADD ΔA'), '28.3 m²');
  });
  it('Amplifier & Loudspeaker Matching: the required power does not depend on the load (audit corrected, nothing carried)', () => {
    const rp = getWorkspace('speakerpower').functions.find((f: AnyObj) => f.key === 'reqpower');
    assert.deepEqual(rp.inputs, ['sens', 'target', 'dist', 'headroom', 'nspk']);
    assert.equal(rp.formula, 'P = 10^((target + 20·log10(d) − sens + headroom) / 10)');
    for (const s of tplOf('tpl-amp-matching').steps) assert.equal(s.carry, undefined);
  });
  it('Long Power Run: step 2 gets step 1’s run, and step 2’s gauge is checked in step 3', () => {
    const w = tplOf('tpl-power-run');
    const step1 = { awg: manual('16'), len: manual('30'), current: manual('15'), vsrc: manual('120'), condTemp: manual('75') };
    const c = runChain(w, { 0: step1, 1: { pct: manual('3') }, 2: { insul: manual('90'), term: manual('60'), ambient: manual('30'), ccc: manual('3') } });
    for (const k of ['len', 'current', 'vsrc', 'condTemp']) assert.equal(c[1].effRaw[k], c[0].effRaw[k], k);
    assert.equal(shown(c[1], 'DROP-LIMITED AWG (CHECK AMPACITY)'), '10 AWG');
    assert.equal(c[2].effRaw.awg, '10');
    assert.equal(shown(c[2], 'ALLOWABLE AMPACITY'), '30 A'); // ≥ the 15 A from step 1
    // owner 2026-11-25, fix-first 15 round 2: a drop-limited gauge finer than
    // 14 AWG (here 16) carries NOTHING into the ampacity check — the step says
    // in words that the drop does not limit the run (it used to carry 16, which
    // the check then refused).
    const c13 = runChain(w, { 0: { ...step1, current: manual('3') }, 1: { pct: manual('3') }, 2: { insul: manual('90'), term: manual('60'), ambient: manual('30'), ccc: manual('3') } });
    assert.equal(shown(c13[1], 'DROP-LIMITED AWG (CHECK AMPACITY)'), '16 AWG');
    assert.equal(c13[2].effRaw.awg, '');
    assert.match(c13[2].snapNotes.awg, /^The voltage drop does not limit this run \(it allows 16 AWG\); size it by ampacity/);
    assert.equal(c13[2].complete, false);
    // When step 2 answers in words ("any gauge"), step 3's field waits, and says so.
    const tiny = runChain(w, { 0: { ...step1, len: manual('1'), current: manual('0.001'), vsrc: manual('48') }, 1: { pct: manual('3') } });
    assert.equal(tiny[2].effRaw.awg, '');
    // owner 2026-11-25, fix-first 15 round 2 (C2): an answer in WORDS is an
    // answer — never "that step has no answer yet".
    assert.equal(K.answeredInWords(tiny, tiny[2].bindings.awg.source), true);
    assert.equal(K.waitingText(tiny[2].bindings.awg.source, true, 'gauge'), 'Step 2 answered in words — type the gauge here.');
    // The ampacity step takes no current (NEC ampacity belongs to the conductor): its note says what to compare.
    assert.deepEqual(getWorkspace('ampacity').functions.find((f: AnyObj) => f.key === 'awg').inputs, ['awg', 'insul', 'term', 'ambient', 'ccc']);
    assert.match(w.steps[2].note, /its ALLOWABLE AMPACITY must be at least the current from step 1/);
  });
  it('the gauge is still never OFFERED or SENT (only the reviewed template link carries it)', () => {
    const o = getWorkspace('vdrop').functions.find((f: AnyObj) => f.key === 'gaugeFor').compute({ len: 30, current: 15, vsrc: 120, pct: 3, condTemp: 75 });
    const g = o.find((x: AnyObj) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)');
    assert.equal(g.chainable, false);
    assert.equal(g.meaning, 'number:awg');
    assert.equal(g.value, 10);
  });
});

describe('the ↻ note is true', () => {
  it('counts dependents through answers AND carried inputs, transitively', () => {
    const w = tplOf('tpl-room-survey');
    const c = runChain(w, { 0: { vol: manual('300'), absA: manual('60') }, 1: { q: manual('2') }, 2: { r: manual('5') } });
    assert.equal(c[1].effRaw.vol, '300');
    assert.equal(c[2].effRaw.rt60, c[1].effRaw.rt60);
    assert.deepEqual(deps(w, c, 0, 'vol'), [1, 2]);
    assert.deepEqual(deps(w, c, 0, 'absA'), [1, 2]); // RT60 answer → step 2 → carried to step 3
    assert.deepEqual(deps(w, c, 1, 'q'), [2]);
  });
  it('a typed-over (overridden) value does not depend on the edit', () => {
    const w = tplOf('tpl-delay-speaker');
    const c = runChain(w, { 0: { temp: manual('30') }, 1: { dist: manual('30'), temp: { raw: '20', source: { kind: 'override', replaced: K.carrySource(w, 1, 'temp') } } } });
    assert.equal(c[1].effRaw.temp, '20');
    assert.deepEqual(deps(w, c, 0, 'temp'), []);
    assert.equal(K.recalcNoteText('AIR TEMPERATURE', [], () => true), null);
    // …but in the SPL Estimate, d₁ typed over still depends on step 1's distance
    // through the carried LEVEL (an answer of step 1): it is recalculated.
    const s = tplOf('tpl-spl-estimate');
    const cs = runChain(s, { 0: { dist: manual('10') }, 1: { d1: { raw: '1', source: { kind: 'override', replaced: K.carrySource(s, 1, 'd1') } } } });
    assert.deepEqual(deps(s, cs, 0, 'dist'), [1]);
  });
  it('a dependent step that cannot be worked out is named in words, never counted as recalculated', () => {
    assert.equal(
      K.recalcNoteText('CURRENT', [1, 2], (i: number) => i === 1),
      'CURRENT changed — 1 later result recalculated; step 3 can’t be worked out from the new value — open it to see why.',
    );
    assert.equal(K.recalcNoteText('CURRENT', [1, 2], () => false), 'CURRENT changed — steps 2 and 3 can’t be worked out from the new value — open them to see why.');
  });
});

describe('every template link, reviewed (units, kind and meaning on each)', () => {
  /** The reviewed list: template → "step:field ← step:input|answer". A change here is a physics review. */
  const EXPECTED: Record<string, string[]> = {
    'tpl-delay-speaker': ['2:temp ← 1:input temp'],
    'tpl-spl-estimate': ['2:l1 ← 1:answer PREDICTED SPL (one speaker, after headroom)', '2:d1 ← 1:input dist'],
    'tpl-amp-matching': [],
    'tpl-cable-drop': ['2:len ← 1:input len', '2:z ← 1:input z'],
    'tpl-room-modes': [],
    'tpl-tempo-delay': ['2:bpm ← 1:input bpm'],
    'tpl-wavelength': ['2:f ← 1:input f'],
    'tpl-ohms-law': ['2:p ← 1:answer POWER', '2:vrms ← 1:input vrms'],
    'tpl-impedance': ['2:rlist ← 1:input rlist'],
    'tpl-loudness-delivery': [],
    'tpl-room-survey': ['2:vol ← 1:input vol', '2:rt60 ← 1:answer RT60', '3:vol ← 2:input vol', '3:rt60 ← 2:input rt60', '3:q ← 2:input q'],
    'tpl-bass-boundaries': ['2:temp ← 1:input temp'],
    'tpl-wireless-link': ['2:dist ← 1:input dist', '2:freqMHz ← 1:input freqMHz'],
    'tpl-rack-power': ['2:mains ← 1:input mains'],
    'tpl-power-run': ['2:len ← 1:input len', '2:current ← 1:input current', '2:vsrc ← 1:input vsrc', '2:condTemp ← 1:input condTemp', '3:awg ← 2:answer DROP-LIMITED AWG (CHECK AMPACITY)'],
    'tpl-passive-crossover': ['2:fx ← 1:input fx', '2:z ← 1:input z'],
    'tpl-line-array': ['2:temp ← 1:input temp'],
    'tpl-sub-enclosure': ['2:vb ← 1:input vb'],
    'tpl-stereo-mic': [],
    'tpl-network-audio': ['2:channels ← 1:input channels', '2:sr ← 1:input sr', '2:bitdepth ← 1:input bitdepth'],
    'tpl-hearing-dose': ['2:lex ← 1:answer LEVEL AT d₂'],
    'tpl-gain-staging': ['2:sens ← 1:input sens', '2:spl ← 1:input spl', '3:sens ← 2:input sens'],
    'tpl-cv-distribution': ['2:taps ← 1:input taps', '2:prated ← 1:input prated', '2:hr ← 1:input hr'],
    'tpl-time-align': ['2:offset ← 1:input offset', '2:temp ← 1:input temp'],
    // owner 2026-11-25, fix-first 15 round 2: the RT60-now step (step 1).
    'tpl-treatment-plan': ['2:vol ← 1:input vol', '2:absA ← 1:input absA', '3:vol ← 1:input vol', '3:rtCur ← 1:answer RT60', '3:rtTgt ← 2:input targetRt'],
    'tpl-monitor-latency': ['2:inBuf ← 1:input buf', '2:outBuf ← 1:input buf', '2:sr ← 1:input sr'],
    // CHANNELS is NOT carried: step 2 needs the whole recording's channels, step 1 has one track's.
    'tpl-session-storage': ['2:sr ← 1:input sr', '2:bits ← 1:input bits'],
    'tpl-speaker-limiter': ['2:pwr ← 1:input pwr', '2:z ← 1:input z'],
  };
  const linksOf = (w: AnyObj): string[] =>
    w.steps.flatMap((s: AnyObj, i: number) =>
      Object.entries(s.carry ?? {}).map(([k, c]: [string, AnyObj]) => `${i + 1}:${k} ← ${c.from + 1}:${c.input ? `input ${c.input}` : `answer ${c.output}`}`),
    );
  it('covers all 28 templates', () => {
    assert.deepEqual((WORKFLOW_TEMPLATES as AnyObj[]).map((t) => t.id).sort(), Object.keys(EXPECTED).sort());
    assert.equal(WORKFLOW_TEMPLATES.length, 28);
  });
  for (const [id, want] of Object.entries(EXPECTED)) {
    it(`${id}: ${want.length} link${want.length === 1 ? '' : 's'}, each resolving with matching kind and unit`, () => {
      const w = tplOf(id);
      assert.deepEqual(linksOf(w), want);
      w.steps.forEach((s: AnyObj, i: number) => {
        const r = resolveStep(s)!;
        for (const [k, c] of Object.entries(s.carry ?? {}) as [string, AnyObj][]) {
          const src = K.carrySource(w, i, k);
          assert.ok(src, `${id} step ${i + 1} ${k}: the link resolves`);
          const target = r.ws.fields.find((f: AnyObj) => f.key === k);
          const from = resolveStep(w.steps[c.from])!;
          if (c.input) {
            const sf = from.ws.fields.find((f: AnyObj) => f.key === c.input);
            assert.equal(sf.quantity, target.quantity, `${id} ${k}: same kind`);
            assert.ok(K.carryUnitsFit(sf, target), `${id} ${k}: units fit`);
          } else {
            // An answer: the runner's own unit AND meaning rule at the example values.
            const c0 = runChain(w, {}, false);
            const ex = exampleOutputs(from);
            const o = ex.find((x: AnyObj) => x.label === c.output);
            assert.ok(o && 'value' in o, `${id}: ${c.output} is a numeric answer`);
            assert.ok(U.chainFits(o.label, o.quantity, target, o.meaning) && o.quantity === target.quantity, `${id} ${k}: ${c.output} fits`);
            assert.ok(c0.length === w.steps.length);
          }
        }
      });
    });
  }
  it('with example values in step 1, every carried field of every template fills (no link reads empty)', () => {
    for (const w of WORKFLOW_TEMPLATES as AnyObj[]) {
      const set: Record<number, Record<string, Partial<Bound>>> = {};
      w.steps.forEach((s: AnyObj, i: number) => {
        const r = resolveStep(s)!;
        set[i] = {};
        for (const k of r.fn.inputs) {
          if (s.carry?.[k]) continue;
          const f = r.ws.fields.find((x: AnyObj) => x.key === k);
          set[i][k] = manual(f.placeholder ?? '1');
        }
      });
      // Long Power Run: a gauge Table 310.16 lists (30 m, 15 A at 120 V → 10 AWG).
      if (w.id === 'tpl-power-run') Object.assign(set[0], { len: manual('30'), current: manual('15'), vsrc: manual('120') });
      const c = runChain(w, set);
      w.steps.forEach((s: AnyObj, i: number) => {
        for (const k of Object.keys(s.carry ?? {})) assert.notEqual(c[i].effRaw[k], '', `${w.id} step ${i + 1} ${k}`);
        assert.deepEqual(c[i].refusedImports, [], `${w.id} step ${i + 1}`);
      });
    }
  });
});

const exampleOutputs = (r: AnyObj): AnyObj[] => {
  const v: Record<string, number | number[]> = {};
  for (const k of r.fn.inputs) {
    const f = r.ws.fields.find((x: AnyObj) => x.key === k);
    if (f.quantity === 'list') v[k] = U.parseList(f.placeholder ?? '');
    else {
      const units = U.unitsFor(f.quantity, f.unitIds);
      const u = units.find((x: AnyObj) => x.id === f.defaultUnit) ?? units[0];
      v[k] = u.toBase(U.parseQuantity(f.placeholder ?? '1') ?? 1);
    }
  }
  return r.fn.compute(v);
};

describe('offers and safety', () => {
  const field = (ws: string, k: string) => getWorkspace(ws).fields.find((f: AnyObj) => f.key === k);
  it('an earlier INPUT is offered only where it is the same thing', () => {
    assert.ok(K.inputOfferFits('cable', field('cable', 'len'), 'cable', field('cable', 'len'))); // the same field
    assert.ok(K.inputOfferFits('netaudio', field('netaudio', 'sr'), 'latency', field('latency', 'sr'))); // a sample rate is a sample rate
    assert.ok(!K.inputOfferFits('distdelay', field('distdelay', 'dist'), 'cable', field('cable', 'len'))); // a listener distance is not a cable run
    assert.ok(!K.inputOfferFits('vdrop', field('vdrop', 'len'), 'cable', field('cable', 'len'))); // untagged lengths of different calculators
    assert.ok(!K.inputOfferFits('rackheat', field('rackheat', 'mains'), 'vdrop', field('vdrop', 'vsrc'))); // untagged voltages
    assert.ok(!K.inputOfferFits('electronics', field('electronics', 'rlist'), 'electronics', field('electronics', 'rlist'))); // lists only by a template link
    // Tags say what an input TAKES, not what it is: a known level L₁ is not an
    // exposure level, and step 1's distance is not the NEW distance d₂ — the
    // SPL Estimate's d₁ is filled by its reviewed template link instead.
    assert.ok(!K.inputOfferFits('spldist', field('spldist', 'l1'), 'dose', field('dose', 'lex')));
    assert.ok(!K.inputOfferFits('speakerpower', field('speakerpower', 'dist'), 'spldist', field('spldist', 'd2')));
    assert.ok(!K.inputOfferFits('speakerpower', field('speakerpower', 'dist'), 'spldist', field('spldist', 'd1')));
    assert.ok(K.carrySource(tplOf('tpl-spl-estimate'), 1, 'd1'));
  });
  it('a link whose source step moved (a customized, reordered copy) is ignored, never filled from the wrong place', () => {
    const w = tplOf('tpl-spl-estimate');
    const swapped = { ...w, steps: [w.steps[1], w.steps[0]] };
    assert.equal(K.carrySource(swapped, 1, 'd1'), null);
    assert.equal(K.carrySource(swapped, 0, 'd1'), null);
    const inserted = { ...w, steps: [{ workspaceId: 'wave', fnKey: 'speed' }, ...w.steps] };
    assert.equal(K.carrySource(inserted, 2, 'd1'), null);
  });
  it('validateWorkflow renumbers carries past a dropped step, and drops a carry whose source is gone', () => {
    const w = tplOf('tpl-gain-staging');
    const broken = { ...w, steps: [{ workspaceId: 'nope', fnKey: 'gone' }, ...w.steps] };
    // Shift the links by one, as a saved copy with an extra first step would have them.
    broken.steps = broken.steps.map((s: AnyObj) => (s.carry ? { ...s, carry: Object.fromEntries(Object.entries(s.carry).map(([k, c]: [string, AnyObj]) => [k, { ...c, from: c.from + 1 }])) } : s));
    const { workflow, dropped } = validateWorkflow(broken);
    assert.equal(dropped, 1);
    assert.deepEqual(linksOfSteps(workflow), linksOfSteps(w));
    assert.ok(K.carrySource(workflow, 1, 'sens'));
    const lost = validateWorkflow({ ...w, steps: [{ workspaceId: 'nope', fnKey: 'gone' }, w.steps[1], w.steps[2]] });
    assert.deepEqual(lost.workflow.steps[0].carry, {}); // step 1 (its source) is gone
  });
});
const linksOfSteps = (w: AnyObj) => w.steps.map((s: AnyObj) => JSON.stringify(s.carry ?? null));

describe('the runner wires the carry in (source)', () => {
  const run = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');
  it('every place that reads a binding falls back to the template link', () => {
    assert.match(run, /const b = bound\[f\.key\] \?\? linkedBound\(workflow, i, f\);/);
    assert.match(run, /const b = run\.steps\[i\]\?\.inputs\[f\.key\] \?\? linkedBound\(workflow, i, f\);/); // the summary
    assert.match(run, /const b = run\.steps\[idx\]\?\.inputs\[f\.key\] \?\? linkedBound\(workflow, idx, f\);/); // the field row
    assert.match(run, /const existing = run\?\.steps\[idx\]\?\.inputs\[f\.key\] \?\? \(workflow \? linkedBound\(workflow, idx, f\) : undefined\);/); // typing → override; ⇄ keeps the link
    assert.match(run, /carried: carriedInputs\(fields, effRaw, unitSel\)/);
  });
  it('the ↻ note comes from the recomputed steps; earlier inputs are offered; an empty carry says so', () => {
    // owner 2026-11-25, fix-first 15 round 2 (C1): only started or
    // previously complete dependents are spoken of.
    assert.match(run, /return recalcNoteText\(recalc\.fieldName, shown, \(i\) => !!computed\[i\]\?\.complete\);/);
    assert.doesNotMatch(run, /const dependentsOf = /);
    assert.match(run, /inputOfferFits\(fromWs, g, workflow\.steps\[idx\]\?\.workspaceId \?\? '', f\)/);
    // owner 2026-11-25, fix-first 15 round 2 (C2): the words case is told apart.
    assert.match(run, /\{waitingText\(b\.source, answeredInWords\(computed, b\.source\), f\.meaning === 'number:awg' \? 'gauge' : 'value'\)\}/);
    assert.match(read('src/screens/lab/calc/calcUnits.ts'), /if \(src\.inputKey != null\) \{\n\s+const c = out\[src\.stepIndex\]\?\.carried\?\.\[src\.inputKey\];/);
  });
});
