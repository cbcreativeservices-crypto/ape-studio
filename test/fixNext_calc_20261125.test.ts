/**
 * Fix-first 15, ROUND 2 (owner 2026-11-25), group CALC — the checker's
 * corrections C1–C5 on the round-1 workflow carry, and the owner's C6 and C7
 * on the Acoustic Treatment Plan ("i like it to add but many users will not
 * be able to so maybe we offer also a default setting?").
 *
 * C1 the ↻ note speaks only of dependent steps the learner has started or
 *    that were complete before the edit (a step never opened is not "can't be
 *    worked out").
 * C2 Long Power Run: a drop-limited gauge Table 310.16 does not list arrives in
 *    the ampacity step as the next THICKER listed size, said in words; an
 *    answer in words is never "no answer yet".
 * C3 the ampacity step's note names MAX CONTINUOUS LOAD for 3-hour loads.
 * C4 Hearing Exposure step 1 asks for an A-weighted L₁.
 * C5 the editor's ▲ / ▼ / ✕ renumber or drop a customized copy's carries;
 *    the guide's start line says "In a template".
 * C6 Acoustic Treatment Plan: 4 steps, the room's RT60 now carried into the
 *    panels step's CURRENT RT60.
 * C7 a stated ESTIMATE for a room whose absorption is unknown.
 *
 * The chain below is the runner's REAL computeChain (sliced out of
 * CalcWorkflowRunScreen.tsx) run on the REAL calcPanel compute block and the
 * real carry and estimate helpers; source ratchets pin the rest. Single-calculator maths is untouched (the calculators' own outputs are
 * checked here unchanged, and the lab still has 166 calculators).
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

const { getWorkspace, WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');
const U = await import('../src/screens/lab/calc/calcUnits.ts');
const C = await import('../src/screens/lab/calc/workflowCatalog.ts');
const K = await import('../src/screens/lab/calc/workflowCarry.ts');
const E = await import('../src/screens/lab/calc/workflowEstimate.ts');
const { CALC_SCREEN_GUIDES } = await import('../src/screens/lab/calc/calcScreenGuides.ts');
const { WORKFLOW_TEMPLATES, resolveStep } = C;

// The REAL calcPanel compute path (as test/fixFirst15_calc_20261125 does).
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
const estimate = (unitIdx?: number) => ({ raw: '', unitIdx, source: { kind: 'estimate', id: 'untreated-room' } });

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

/** The runner's chain on what the learner set; `estScale` scales a stated
 *  estimate, as the runner does to find the answers that depend on it. */
function runChain(w: AnyObj, set: Record<number, Record<string, Partial<Bound>>>, estScale = 1) {
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
  const out: AnyObj[] = Chain.computeChain(w, run, estScale);
  // What each field is bound to, as the runner reads it (its own linkedBound).
  out.forEach((c: AnyObj, i: number) => {
    c.bindings = Object.fromEntries(c.fields.map((f: AnyObj) => [f.key, run.steps[i].inputs[f.key] ?? Chain.linkedBound(w, i, f)]));
  });
  return out;
}
const shown = (step: AnyObj, label: string): string => {
  const o = step.result.outputs.find((x: AnyObj) => x.label === label || x.label.startsWith(label));
  assert.ok(o && 'value' in o, `${label}: ${JSON.stringify(step.result).slice(0, 300)}`);
  return Panel.formatOutput(o, 4, 0);
};
const keysOf = (c: AnyObj[]) => (i: number) => c[i].fields.map((f: AnyObj) => f.key);
const bindingOf = (c: AnyObj[]) => (i: number, k: string) => c[i].bindings[k]?.source;
const reach = (w: AnyObj, c: AnyObj[]) => E.estimateReach(w.steps.length, keysOf(c), bindingOf(c), (i: number, k: string) => k in c[i].estimates);
const RUN = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');

describe('C1 — the ↻ note never speaks of a step the learner has not reached', () => {
  const w = tplOf('tpl-spl-estimate');
  it('first pass: typing step 1 of a fresh run (step 2 never opened, never complete) gives NO note', () => {
    const c = runChain(w, { 0: { sens: manual('97'), power: manual('500'), dist: manual('10') } });
    const deps = K.dependentSteps(2, keysOf(c), bindingOf(c), 0, 'dist');
    assert.deepEqual(deps, [1]); // step 2 does depend on it…
    assert.equal(c[1].complete, false); // …but it has no d₂ yet: before round 2 this read "step 2 can’t be worked out"
    const started = (i: number) => i === 0;
    const shownDeps = K.noteDependents(deps, started, () => false, () => false);
    assert.deepEqual(shownDeps, []);
    assert.equal(K.recalcNoteText('LISTENING DISTANCE', shownDeps, () => false), null);
  });
  it('a step the learner has started is named; a step complete before the edit is counted', () => {
    // Started and working out now: recalculated. Complete before: counted, or named if it no longer works out.
    assert.deepEqual(K.noteDependents([1, 2], (i: number) => i === 2, () => false, (i: number) => i === 2), [2]);
    assert.deepEqual(K.noteDependents([1, 2], () => false, (i: number) => i === 1, () => false), [1]);
    assert.equal(
      K.recalcNoteText('CURRENT', K.noteDependents([1, 2], () => false, (i: number) => i === 1, () => false), () => false),
      'CURRENT changed — step 2 can’t be worked out from the new value — open it to see why.',
    );
  });
  it('a step STARTED but never finished is never named "can’t be worked out" (it never was)', () => {
    assert.deepEqual(K.noteDependents([1, 2], () => true, () => false, () => false), []);
    assert.equal(K.recalcNoteText('CURRENT', K.noteDependents([1, 2], () => true, () => false, () => false), () => false), null);
  });
  it('the runner records completeness BEFORE each edit and filters by it (source)', () => {
    assert.match(RUN, /const shown = noteDependents\(deps, \(i\) => Object\.keys\(run\.steps\[i\]\?\.inputs \?\? \{\}\)\.length > 0, \(i\) => !!recalc\.before\[i\], \(i\) => !!computed\[i\]\?\.complete\);/);
    assert.equal((RUN.match(/\n\s+markRecalc\(f\);/g) ?? []).length, 3); // edit, project value, estimate
    assert.doesNotMatch(RUN, /setRecalc\(\{ from: idx, fieldKey: f\.key, fieldName: f\.name \}\)/);
  });
  it('the FIRST "before" is kept while the same field keeps being edited (clear and retype keeps the note)', () => {
    // markRecalc's own updater, lifted from the runner and run on plain objects.
    const m = RUN.match(/const markRecalc = \(f: FieldDef\) =>\n\s+setRecalc\(\(p\) =>\n([\s\S]*?)\n\s+\);\n/);
    assert.ok(m, 'markRecalc updater');
    const upd = new Function('idx', 'f', 'computed', `return (p) => ${m![1].trim().replace(/,$/, '')};`) as (idx: number, f: AnyObj, computed: AnyObj[]) => (p: AnyObj) => AnyObj;
    const f = { key: 'dist', name: 'LISTENING DISTANCE' };
    // Keystroke 1 (clearing the field): step 2 was complete before it.
    let p = upd(0, f, [{ complete: true }, { complete: true }])(null);
    assert.deepEqual(p.before, [true, true]);
    // Keystroke 2 (retyping): step 2 is incomplete NOW (the field was empty) — the first before is kept.
    p = upd(0, f, [{ complete: false }, { complete: false }])(p);
    assert.deepEqual(p.before, [true, true]);
    assert.equal(K.recalcNoteText('LISTENING DISTANCE', K.noteDependents([1], () => false, (i: number) => !!p.before[i], () => true), () => true), 'LISTENING DISTANCE changed — 1 later result recalculated.');
    // Another field: a fresh before.
    const q = upd(0, { key: 'sens', name: 'SENSITIVITY' }, [{ complete: false }, { complete: false }])(p);
    assert.deepEqual(q.before, [false, false]);
  });
});

describe('C2 — Long Power Run: the gauge arrives as a size Table 310.16 lists', () => {
  const w = tplOf('tpl-power-run');
  const step3 = { insul: manual('90'), term: manual('60'), ambient: manual('30'), ccc: manual('3') };
  it('the snap: 13→12, 11→10, 9→8, 7→6, 5→4 (next THICKER); listed sizes kept; finer than 18 → 18', () => {
    assert.deepEqual([13, 11, 9, 7, 5].map(K.snapAwgToTable), [12, 10, 8, 6, 4]);
    assert.deepEqual([18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0].map(K.snapAwgToTable), [18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0]);
    assert.deepEqual([15, 17, 19, 24, 40].map(K.snapAwgToTable), [14, 16, 18, 18, 18]);
    // Never thinner: the drop budget still holds with the carried size.
    for (let g = 0; g <= 40; g++) assert.ok(K.snapAwgToTable(g) <= g, `${g}`);
  });
  it('20 m, 15 A at 120 V, 3 %: step 2 still reads 11 AWG (the calculator unchanged); step 3 checks 10 AWG and says why', () => {
    const c = runChain(w, { 0: { awg: manual('16'), len: manual('20'), current: manual('15'), vsrc: manual('120'), condTemp: manual('75') }, 1: { pct: manual('3') }, 2: step3 });
    assert.equal(shown(c[1], 'DROP-LIMITED AWG (CHECK AMPACITY)'), '11 AWG');
    assert.equal(c[2].effRaw.awg, '10');
    assert.equal(c[2].snapNotes.awg, '11 AWG is not a size Table 310.16 lists; using 10 AWG, the next thicker.');
    assert.equal(c[2].complete, true);
    assert.equal(shown(c[2], 'ALLOWABLE AMPACITY'), '30 A'); // ≥ 15 A — and it is a thicker wire than the drop needs
    // The single Voltage Drop calculator's own answer is the same number as before.
    const o = getWorkspace('vdrop').functions.find((f: AnyObj) => f.key === 'gaugeFor').compute({ len: 20, current: 15, vsrc: 120, pct: 3, condTemp: 75 });
    assert.equal(o.find((x: AnyObj) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)').value, 11);
  });
  it('a drop-limited gauge FINER than 14 AWG carries nothing: the step says the drop does not limit the run', () => {
    const src = K.carrySource(w, 2, 'awg');
    for (const g of [15, 16, 18, 29, 40]) {
      const cv = K.carriedValue(src, g);
      assert.ok(Number.isNaN(cv.value), `${g}`);
      assert.equal(cv.note, `The voltage drop does not limit this run (it allows ${g} AWG); size it by ampacity: type a gauge of 14 AWG or thicker here.`);
    }
    assert.deepEqual(K.carriedValue(src, 14), { value: 14, note: null });
    const c = runChain(w, { 0: { awg: manual('16'), len: manual('2'), current: manual('15'), vsrc: manual('120'), condTemp: manual('75') }, 1: { pct: manual('3') }, 2: step3 });
    assert.equal(shown(c[1], 'DROP-LIMITED AWG (CHECK AMPACITY)'), '21 AWG');
    assert.equal(c[2].effRaw.awg, '');
    assert.match(c[2].snapNotes.awg, /^The voltage drop does not limit this run \(it allows 21 AWG\)/);
    assert.match(RUN, /&& \(cur\.effRaw\[f\.key\] \?\? ''\) === '' && !cur\.snapNotes\[f\.key\] \? \(/); // no "Waiting for…" beside it
  });
  it('a listed gauge carries unchanged, with no note (round-1 behaviour kept)', () => {
    const c = runChain(w, { 0: { awg: manual('16'), len: manual('30'), current: manual('15'), vsrc: manual('120'), condTemp: manual('75') }, 1: { pct: manual('3') }, 2: step3 });
    assert.equal(c[2].effRaw.awg, '10');
    assert.equal(c[2].snapNotes.awg, undefined);
  });
  it('step 2 answering in words ("2/0 AWG or thicker.", "Any gauge…"): step 3 says so, never "no answer yet"', () => {
    const big = runChain(w, { 0: { awg: manual('16'), len: manual('350'), current: manual('15'), vsrc: manual('120'), condTemp: manual('75') }, 1: { pct: manual('3') } });
    const g = big[1].result.outputs.find((x: AnyObj) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)');
    assert.equal(g.text, '2/0 AWG or thicker.');
    assert.equal(big[2].effRaw.awg, '');
    const src = big[2].bindings.awg.source;
    assert.equal(K.answeredInWords(big, src), true);
    assert.equal(K.waitingText(src, K.answeredInWords(big, src), 'gauge'), 'Step 2 answered in words — type the gauge here.');
    // A step with no answer at all still says that.
    const none = runChain(w, { 0: { len: manual('30') } });
    assert.equal(K.answeredInWords(none, none[2].bindings.awg.source), false);
    assert.match(K.waitingText(none[2].bindings.awg.source, false, 'gauge'), /that step has no answer for it yet/);
  });
  it('the template link carries the snap; the runner applies it and shows its words (source)', () => {
    assert.equal(w.steps[2].carry.awg.snap, 'awg-table');
    assert.equal(K.carrySource(w, 2, 'awg').snap, 'awg-table');
    assert.match(RUN, /const cv = carriedValue\(b\.source, o\.value\);\n\s+if \(cv\.note\) \{\n\s+snapNotes\[f\.key\] = cv\.note;\n[^\n]*\n\s+effRaw\[f\.key\] = Number\.isFinite\(cv\.value\) \? fmtCarried\(u\.fromBase\(cv\.value\), f\.quantity\) : '';/);
    assert.match(RUN, /\{isImport && cur\.snapNotes\[f\.key\] \? \(/);
  });
});

describe('C3, C4 — the step notes', () => {
  it('Long Power Run step 3 names MAX CONTINUOUS LOAD for a load of 3 hours or more (an output the step really shows)', () => {
    const note = tplOf('tpl-power-run').steps[2].note;
    assert.match(note, /for a load that runs 3 hours or more, compare with MAX CONTINUOUS LOAD instead\./);
    const o = getWorkspace('ampacity').functions.find((f: AnyObj) => f.key === 'awg').compute({ awg: 10, insul: 90, term: 60, ambient: 30, ccc: 3 });
    assert.ok(o.some((x: AnyObj) => x.label.startsWith('MAX CONTINUOUS LOAD')));
  });
  it('Hearing Exposure step 1 asks for L₁ in dBA (step 2’s dBA field fills from its answer)', () => {
    const w = tplOf('tpl-hearing-dose');
    assert.match(w.steps[0].note, /Enter L₁ as an A-weighted level \(dBA\)\./);
    assert.equal(K.carrySource(w, 1, 'lex').outputLabel, 'LEVEL AT d₂');
  });
});

describe('C5 — the editor keeps a customized copy’s carries true; the guide says "In a template"', () => {
  const w = tplOf('tpl-gain-staging'); // 2 ← 1 (sens, spl), 3 ← 2 (sens)
  it('▲ / ▼: carries follow their source step, and are dropped once the source no longer comes first', () => {
    const [a, b, c] = w.steps;
    const moved = K.reindexCarry(w.steps, [b, a, c]); // step 2 moved above its source
    assert.deepEqual(moved[0].carry, {}); // its source (old step 1) now comes AFTER it: dropped
    assert.equal(moved[1], a); // no carry: the same object
    assert.equal(moved[2].carry.sens.from, 0); // old step 2 is now step 1: renumbered
    assert.ok(K.carrySource({ ...w, steps: moved }, 2, 'sens'));
    assert.equal(K.carrySource({ ...w, steps: moved }, 0, 'sens'), null);
    // Before round 2 the copy kept from: 1 for step 3, pointing at old step 1 (a different calculator).
    assert.equal(c.carry.sens.from, 1);
  });
  it('✕: a carry whose source step is removed is dropped; the rest are renumbered', () => {
    const [a, b, c] = w.steps;
    void a;
    const removed = K.reindexCarry(w.steps, [b, c]);
    assert.deepEqual(removed[0].carry, {});
    assert.equal(removed[1].carry.sens.from, 0);
    assert.ok(K.carrySource({ ...w, steps: removed }, 1, 'sens'));
    // A note edited (the step replaced in place): its carries and those that
    // come FROM it keep their places.
    const noted = [a, { ...b, note: 'mine' }, c];
    const kept = K.reindexCarry(w.steps, noted);
    assert.deepEqual(kept[1].carry, b.carry);
    assert.equal(kept[2], c);
    // Nothing moved: the same objects back.
    const same = K.reindexCarry(w.steps, [...w.steps]);
    same.forEach((s: AnyObj, i: number) => assert.equal(s, w.steps[i]));
  });
  it('the editor calls it on ▲ / ▼ and ✕ (source); the guide start line', () => {
    const ed = read('src/screens/lab/calc/CalcWorkflowEditScreen.tsx');
    // ▲ / ▼ / ✕ and the note edits all pass through `mutate`, which reindexes.
    assert.match(ed, /const mutate = \(fn: \(s: WorkflowStep\[\]\) => WorkflowStep\[\]\) => \{\n\s+setSteps\(\(s\) => reindexCarry\(s, fn\(s\)\)\);/);
    assert.match(ed, /const move = \(step: WorkflowStep, dir: -1 \| 1\) => \{\n\s+mutate\(/);
    assert.match(ed, /const removeStep = \(step: WorkflowStep\) => mutate\(/);
    assert.match(ed, /const setNote = \(i: number, note: string\) =>\n\s+mutate\(/);
    assert.match(CALC_SCREEN_GUIDES.workflowRun.intro.start, /In a template, the next step arrives/);
  });
});

describe('C6 — Acoustic Treatment Plan: the room’s RT60 now, carried into the panels step', () => {
  const w = tplOf('tpl-treatment-plan');
  it('4 steps: RT60 from V & A, absorption needed, panels, wall isolation', () => {
    assert.deepEqual(w.steps.map((s: AnyObj) => `${s.workspaceId}.${s.fnKey}`), ['sabine.rtFromVA', 'sabine.neededA', 'treatment.panels', 'transloss.massTL']);
  });
  it('a measured room (150 m³, A = 20 m², target 0.5 s): step 3 receives RT60 = 1.2075 s, and steps 2 and 3 agree on the absorption to add', () => {
    const c = runChain(w, { 0: { vol: manual('150'), absA: manual('20') }, 1: { targetRt: manual('0.5') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } });
    assert.equal(shown(c[0], 'RT60'), '1.208 s');
    assert.equal(c[1].effRaw.absA, '20');
    assert.equal(c[2].effRaw.rtCur, '1.2075');
    assert.equal(c[2].effRaw.vol, '150');
    assert.equal(c[2].effRaw.rtTgt, '0.5');
    assert.equal(shown(c[1], 'ABSORPTION TO ADD'), '28.3 m²');
    assert.equal(shown(c[2], 'ABSORPTION TO ADD ΔA'), '28.3 m²');
    assert.equal(shown(c[2], 'PANELS NEEDED'), '11');
    assert.deepEqual([...reach(w, c).keys()], []); // nothing estimated
  });
  it('editing step 1’s absorption flows to steps 2 and 3 (the ↻ note counts both once they are reached)', () => {
    const c = runChain(w, { 0: { vol: manual('150'), absA: manual('30') }, 1: { targetRt: manual('0.5') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } });
    assert.deepEqual(K.dependentSteps(4, keysOf(c), bindingOf(c), 0, 'absA'), [1, 2]);
    assert.equal(shown(c[1], 'ABSORPTION TO ADD'), shown(c[2], 'ABSORPTION TO ADD ΔA'));
  });
});

describe('C7 — a stated ESTIMATE for a room whose absorption is unknown', () => {
  const w = tplOf('tpl-treatment-plan');
  it('the basis: ᾱ = 0.07 over a 1 : 1.4 : 1.9 box (S ≈ 6.21·V^(2/3)); the shape matters little', () => {
    assert.equal(E.UNTREATED_ALPHA, 0.07);
    assert.deepEqual([...E.ROOM_BOX_RATIO], [1, 1.4, 1.9]);
    const r = E.untreatedRoomAbsorption(100)!;
    assert.ok(Math.abs(r.S - 133.769) < 1e-3, `${r.S}`);
    assert.ok(Math.abs(r.A - 0.07 * r.S) < 1e-12);
    // A cube (the least surface for a volume) is 3.4 % less; 1 : 1.6 : 2.33 is 2.6 % more.
    assert.ok(Math.abs(1 - (6 * 100 ** (2 / 3)) / r.S - 0.0336) < 0.001);
    const h = Math.cbrt(100 / (1.6 * 2.33));
    assert.ok(Math.abs((2 * (1.6 + 2.33 + 1.6 * 2.33) * h * h) / r.S - 1.0255) < 0.001);
    // Under Sabine's ≈ 0.3 limit, and matching the app's own calibrated bare rooms (meterEngine.ts).
    assert.ok(E.UNTREATED_ALPHA < 0.3);
    const meter = read('src/screens/lab/meter/meterEngine.ts');
    assert.match(meter, /classroom: \{\n\s+V: 220, S: 250,[^\n]*\n\s+bareRt: \[2\.6, 2\.4, 2\.2, 2\.0,/);
    assert.ok(Math.abs((0.161 * 220) / (2.0 * 250) - 0.0708) < 0.0005);
    assert.equal(E.untreatedRoomAbsorption(0), null);
    assert.equal(E.untreatedRoomAbsorption(NaN), null);
  });
  it('offered only in the plan’s step 1, for TOTAL ABSORPTION A (never applied without a tap)', () => {
    assert.deepEqual(w.steps[0].estimate, { absA: 'untreated-room' });
    const r0 = resolveStep(w.steps[0])!;
    assert.equal(E.estimateFor(w.steps[0], r0.fn.inputs, 'absA'), 'untreated-room');
    assert.equal(E.estimateFor(w.steps[0], r0.fn.inputs, 'vol'), null);
    assert.equal(E.estimateFor(w.steps[1], resolveStep(w.steps[1])!.fn.inputs, 'absA'), null);
    // A moved/changed step never offers an estimate that does not fit it.
    assert.equal(E.estimateFor({ ...w.steps[0], workspaceId: 'treatment', fnKey: 'panels' }, ['vol', 'rtCur'], 'absA'), null);
    assert.equal(E.estimateButton('untreated-room'), 'I DON’T KNOW IT: USE A TYPICAL UNTREATED ROOM');
    // Every other template offers none.
    for (const t of WORKFLOW_TEMPLATES as AnyObj[]) for (const [i, s] of t.steps.entries()) if (!(t.id === 'tpl-treatment-plan' && i === 0)) assert.equal(s.estimate, undefined, `${t.id} ${i}`);
  });
  it('WORKED EXAMPLE with the default: 100 m³, target 0.3 s, 2.88 m² panels at α 0.9 → 18 panels, an ESTIMATE', () => {
    const c = runChain(w, { 0: { vol: manual('100'), absA: estimate() }, 1: { targetRt: manual('0.3') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } });
    assert.equal(c[0].effRaw.absA, '9.36382');
    assert.equal(shown(c[0], 'RT60'), '1.719 s');
    assert.equal(c[1].effRaw.absA, '9.36382');
    assert.equal(shown(c[1], 'ABSORPTION NEEDED'), '53.67 m²');
    assert.equal(shown(c[1], 'ABSORPTION TO ADD'), '44.3 m²');
    assert.equal(shown(c[2], 'ABSORPTION TO ADD ΔA'), '44.3 m²');
    assert.equal(shown(c[2], 'PANELS NEEDED'), '18');
    assert.equal(shown(c[2], 'PREDICTED RT60 WITH 18 PANELS'), '0.2874 s');
    const r = reach(w, c);
    assert.deepEqual([...r.entries()].sort(), [[0, 0], [1, 0], [2, 0]]);
    // Only answers that CHANGE with the estimate are marked (worked out again at ½×, 1.01×, 2×).
    const marks = E.estimatedOutputs(c, [0.5, 1.01, 2].map((k) => runChain(w, { 0: { vol: manual('100'), absA: estimate() }, 1: { targetRt: manual('0.3') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } }, k)));
    const labelsAt = (i: number) => [...(marks.get(i) ?? [])].map((oi) => c[i].result.outputs[oi].label);
    assert.deepEqual(labelsAt(0), ['RT60']);
    assert.deepEqual(labelsAt(1), ['ABSORPTION TO ADD']); // ABSORPTION NEEDED = 0.161·V/RT target does not use it: unmarked
    assert.deepEqual(labelsAt(2), ['ABSORPTION TO ADD ΔA', 'PANELS NEEDED', 'PREDICTED RT60 WITH 18 PANELS']);
    assert.equal(marks.has(3), false); // the wall step
    const disp = E.withEstimateLabels(c[2], marks.get(2))!;
    assert.ok(disp.result.outputs.some((o: AnyObj) => o.label === 'PANELS NEEDED (ESTIMATE)'));
    assert.ok(c[2].result.outputs.some((o: AnyObj) => o.label === 'PANELS NEEDED')); // later steps still import by the calculator's own label
    const d1 = E.withEstimateLabels(c[1], marks.get(1))!;
    assert.deepEqual(d1.result.outputs.map((o: AnyObj) => o.label), ['ABSORPTION NEEDED', 'ABSORPTION TO ADD (ESTIMATE)']);
    assert.equal(E.withEstimateLabels(c[3], marks.get(3)), c[3]);
    // A rounded count that a 1 % nudge leaves alone is still caught (½× / 2×).
    const nudgeOnly = E.estimatedOutputs(c, [runChain(w, { 0: { vol: manual('100'), absA: estimate() }, 1: { targetRt: manual('0.3') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } }, 1.01)]);
    assert.equal(shown(runChain(w, { 0: { vol: manual('100'), absA: estimate() }, 1: { targetRt: manual('0.3') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } }, 1.01)[2], 'PANELS NEEDED'), '18');
    assert.ok(!nudgeOnly.get(2)?.has(c[2].result.outputs.findIndex((o: AnyObj) => o.label === 'PANELS NEEDED')));
    assert.ok(marks.get(2)!.has(c[2].result.outputs.findIndex((o: AnyObj) => o.label === 'PANELS NEEDED')));
    assert.equal(E.estimateResultText(0, 2), 'This answer rests on step 1’s typical untreated-room absorption, not a measurement of this room.');
  });
  it('WORKED EXAMPLE without it: the same room measured at A = 20 m² → 13 panels, no estimate anywhere', () => {
    const c = runChain(w, { 0: { vol: manual('100'), absA: manual('20') }, 1: { targetRt: manual('0.3') }, 2: { panelArea: manual('2.88'), alpha: manual('0.9') } });
    assert.equal(shown(c[0], 'RT60'), '0.805 s');
    assert.equal(shown(c[2], 'ABSORPTION TO ADD ΔA'), '33.67 m²');
    assert.equal(shown(c[2], 'PANELS NEEDED'), '13');
    assert.equal(reach(w, c).size, 0);
  });
  it('the assumption is on screen in plain words, in the field’s own unit; it waits for the volume', () => {
    const f = getWorkspace('sabine').fields.find((x: AnyObj) => x.key === 'absA');
    const est = E.untreatedRoomAbsorption(100)!;
    const t = E.estimateText('untreated-room', f, 0, { value: est.A, S: est.S });
    assert.equal(
      t,
      'ESTIMATE, not a measurement: an ordinary untreated room (hard walls, ceiling and floor, a door, a window and a few furnishings) absorbs about 7% of the sound that hits its surfaces (ᾱ ≈ 0.07, 500 Hz – 1 kHz). ' +
        'The room is taken as a box shaped 1 : 1.4 : 1.9 (height : width : length), so its surfaces total about 133.8 m², and A = 0.07 × 133.8 ≈ 9.364 m². ' +
        'An empty, bare room absorbs less (about 4–5%) and rings longer; a room with carpet, curtains, soft furniture or people absorbs more and decays faster. Type a measured value to replace it.',
    );
    const units = U.unitsFor(f.quantity, f.unitIds);
    const ft = units.findIndex((u: AnyObj) => u.label === 'ft²');
    assert.ok(ft > 0);
    assert.match(E.estimateText('untreated-room', f, ft, { value: est.A, S: est.S }), /surfaces total about 1440 ft²/);
    assert.equal(E.estimateText('untreated-room', f, 0, null), 'ESTIMATE needs a ROOM VOLUME above 0: enter it above.');
    assert.equal(runChain(w, { 0: { vol: manual('0'), absA: estimate() } })[0].estimates.absA, null);
    // The bare-room arithmetic the comment states: area-weighted over the box, 500 Hz / 1 kHz averaged.
    const box = { fl: 1.4 * 1.9, ce: 1.4 * 1.9, wa: 2 * (1.4 + 1.9) };
    const S = box.fl + box.ce + box.wa;
    const avg = (wall: [number, number], floor: [number, number]) => ((wall[0] + wall[1]) / 2 * (box.ce + box.wa) + (floor[0] + floor[1]) / 2 * box.fl) / S;
    assert.ok(Math.abs(avg([0.05, 0.04], [0.10, 0.07]) - 0.054) < 0.001); // drywall on a wood floor
    assert.ok(Math.abs(avg([0.05, 0.04], [0.015, 0.02]) - 0.039) < 0.001); // drywall on concrete
    assert.match(read('src/screens/lab/calc/workflowEstimate.ts'), /a BARE room averages over the two bands: drywall walls\n \* and ceiling on a wood floor 0\.054, on a concrete floor 0\.039/);
    assert.match(E.estimateReportLine(1, f, 0, { value: est.A, S: est.S }), /Every answer marked \(ESTIMATE\) changes with it;/);
    const c = runChain(w, { 0: { absA: estimate() } });
    assert.equal(c[0].effRaw.absA, '');
    assert.equal(c[0].estimates.absA, null);
    // Shown in ft², the same absorption.
    const cf = runChain(w, { 0: { vol: manual('100'), absA: estimate(ft) } });
    assert.equal(shown(cf[0], 'RT60'), '1.719 s');
    assert.match(E.estimateReportLine(1, f, 0, { value: est.A, S: est.S }), /^Step 1: TOTAL ABSORPTION A is an ESTIMATE, not a measurement — an ordinary untreated room/);
  });
  it('a measured value typed over it replaces it; the volume edited flows into the estimate live', () => {
    const typed = runChain(w, { 0: { vol: manual('100'), absA: manual('12') } });
    assert.equal(typed[0].effRaw.absA, '12');
    assert.equal(reach(w, typed).size, 0);
    const big = runChain(w, { 0: { vol: manual('800'), absA: estimate() } });
    assert.equal(big[0].effRaw.absA, U.fmtCarried(E.untreatedRoomAbsorption(800)!.A, 'area'));
    // Steps 2 and 3 typed over their carried inputs no longer rest on it.
    const own = runChain(w, { 0: { vol: manual('100'), absA: estimate() }, 1: { absA: manual('20'), targetRt: manual('0.3') }, 2: { rtCur: manual('0.8'), panelArea: manual('2.88'), alpha: manual('0.9') } });
    // Step 3 still takes its VOLUME from step 1, but the volume is not the
    // estimate: with its RT60 and step 2's absorption typed, only step 1 rests on it.
    assert.deepEqual([...reach(w, own).keys()].sort(), [0]);
  });
  it('editing the VOLUME counts what rests on the estimate it feeds (the ↻ note)', () => {
    const c = runChain(w, { 0: { vol: manual('100'), absA: estimate() }, 1: { vol: manual('100'), targetRt: manual('0.3') }, 2: { vol: manual('100'), rtCur: manual('1.7'), panelArea: manual('2.88'), alpha: manual('0.9') } });
    // Steps 2 and 3 typed their own volume and RT60: only step 2's carried absorption follows the volume, through the estimate.
    assert.deepEqual(K.dependentSteps(4, keysOf(c), bindingOf(c), 0, 'vol'), []);
    const fed = E.estimatesFedBy(c[0].estimates, c[0].bindings, 'vol');
    assert.deepEqual(fed, ['absA']);
    assert.deepEqual(K.dependentSteps(4, keysOf(c), bindingOf(c), 0, fed[0]), [1]);
    assert.deepEqual(E.estimatesFedBy(c[0].estimates, c[0].bindings, 'absA'), []);
    assert.match(RUN, /const keys = \[recalc\.fieldKey, \.\.\.estimatesFedBy\(/);
  });
  it('the runner offers it, works it out live, prints it, and marks every answer and the report (source)', () => {
    assert.match(RUN, /const est = estimateValue\(b\.source\.id, fields, effRaw, unitSel\);/);
    assert.match(RUN, /\{estimateButton\(estId\)\}/);
    assert.match(RUN, /estId && !onEst && !isImport && \(cur\.effRaw\[f\.key\] \?\? ''\) === ''/);
    assert.match(RUN, /\{estimateText\(b\.source\.id, f, b\.unitIdx, cur\.estimates\[f\.key\]\)\}/);
    assert.match(RUN, /const cur = idx < n \? withEstimateLabels\(computed\[idx\], markedAt\(idx\)\) : null;/);
    assert.match(RUN, /return estimatedOutputs\(computed, \[0\.5, 1\.01, 2\]\.map\(\(k\) => computeChain\(workflow, run, k\)\)\);/);
    assert.match(RUN, /fromBase\(est\.value \* estScale\)/);
    assert.match(RUN, /\{cur\.complete && \(markedAt\(idx\)\?\.size \?\? 0\) > 0 \? \(/);
    assert.match(RUN, /carriesEstimate\(b\.source\) \? `\$\{src\} \(estimate\)` : src/);
    assert.match(RUN, /results\.push\(\{ label: estimateLabel\(o\.label, !!marks\?\.has\(oi\)\)/);
    assert.match(RUN, /if \(est\) warnings\.add\(estimateReportLine\(i \+ 1, f, b\?\.unitIdx \?\? defaultUnitIdx\(f\), est\)\);/);
    assert.match(RUN, /case 'estimate':\n\s+return ESTIMATE_SOURCE_LABEL;/);
  });
  it('no calculator was added: the lab still has 166', () => {
    let total = 0;
    for (const ws of WORKSPACES as AnyObj[]) total += ws.functions.length;
    assert.equal(total, 166);
  });
});
