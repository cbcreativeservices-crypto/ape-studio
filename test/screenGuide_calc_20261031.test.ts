/**
 * Screen Guide rollout — Audio Calculator Laboratory (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave pilot) and the
 * Fundamentals tests.
 *
 * Screens and guides (src/screens/lab/calc/calcScreenGuides.ts):
 *   home · symbols · workflows · workflowEdit · workflowRun · workflowResults ·
 *   projects · projectEdit · results — static guides; and the calculator page
 *   itself (CalcWorkspaceScreen), whose guide is BUILT for the calculator and
 *   calculation on screen: 56 calculators × 166 calculations share it.
 *
 *   1. shape + house copy rules, static guides AND every built guide;
 *   2. every step within its no-scroll budget — for all 166 calculations;
 *   3. the names the guides quote are on the screens they explain;
 *   4. every TRY THIS number is what the screen prints: the calculator page's
 *      numbers are computed by the REAL calcPanel code (buildValues /
 *      runCompute / formatOutput, loaded from calcPanel.tsx itself), and the
 *      static guides' numbers are recomputed here the same way;
 *   5. wiring + the accuracy-chip decision (calculators keep ✓ VERIFIED).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const G = await import('../src/screens/lab/calc/calcScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { WORKSPACES, SECTION_META, getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const U = await import('../src/screens/lab/calc/calcUnits.ts');
const { SYMBOL_GROUPS } = await import('../src/screens/lab/calc/symbolsKey.ts');
const { WORKFLOW_TEMPLATES } = await import('../src/screens/lab/calc/workflowCatalog.ts');

// ── The REAL calcPanel compute path ───────────────────────────────────────────
// calcPanel.tsx holds JSX (FieldRow), so it cannot be imported here. Its pure
// part — defaultUnitIdx, buildValues, runCompute, formatOutput — is sliced out
// of the file, its types stripped, and run as-is: the guide's numbers are the
// screen's numbers by construction, and a change to that code changes them.
const PANEL = read('src/screens/lab/calc/calcPanel.tsx');
const Panel = await (async () => {
  const a = PANEL.indexOf('export function defaultUnitIdx(');
  const b = PANEL.indexOf('export const FieldRow');
  assert.ok(a > 0 && b > a, 'calcPanel.tsx: the pure compute block was found');
  const unitsUrl = pathToFileURL(join(ROOT, 'src/screens/lab/calc/calcUnits.ts')).href;
  const typesUrl = pathToFileURL(join(ROOT, 'src/screens/lab/calc/calcTypes.ts')).href;
  const head =
    `import { isRefused } from '${typesUrl}';\n` +
    `import { NEGATIVE_MSG, domainError, domainMsg, fmt, isNonNegativeField, listProblem, negativeInput, fmtSamples, outputUnits, parseList, parseQuantity, unitsFor, wholeCount } from '${unitsUrl}';\n`;
  const js = stripTypeScriptTypes(head + PANEL.slice(a, b));
  return import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
})();

type Guide = Record<string, string[]>;
type Ex = { label: string; at4: string; at5: string; next: string | null; at5Next: string | null; sendable: boolean; sendTo: 'other' | 'here' | null; steps: boolean; sendAny: 'other' | 'here' | null };
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const STATIC = G.CALC_SCREEN_GUIDES as unknown as Record<string, Guide>;

/** Exactly the CalcWorkspaceScreen `guideExample` memo (pinned in §5). */
function exampleFor(ws: any, fn: any): Ex | null {
  const fields = fn.inputs.map((k: string) => ws.fields.find((f: any) => f.key === k)).filter(Boolean);
  const exRaw: Record<string, string> = {};
  for (const f of fields) exRaw[f.key] = f.placeholder ?? '';
  const r = Panel.runCompute(fn, Panel.buildValues(fields, exRaw, {}), fields);
  if (r.computeError || r.refused) return null;
  const o = r.outputs.find((x: any) => 'value' in x && Number.isFinite(x.value));
  if (!o) return null;
  const at4 = Panel.formatOutput(o, 4, 0);
  const next = Panel.formatOutput(o, 4, 1);
  const at5 = Panel.formatOutput(o, 5, 0);
  const at5Next = Panel.formatOutput(o, 5, 1);
  const sendable = o.chainable !== false;
  return {
    label: o.label,
    at4,
    at5,
    next: next === at4 ? null : next,
    at5Next: at5Next === at5 ? null : at5Next,
    sendable,
    sendTo: sendable ? G.calcSendTarget(ws, fn, o.label, o.quantity, o.meaning) : null,
    steps: r.steps.length > 0,
    sendAny: G.calcSendReach(ws, fn, r.outputs),
  };
}

/** Every calculator page's guide, as the screen builds it on each calculation:
 *  `gd` for an uncapped reader (member, onboarding demo), `gdCapped` for a
 *  free/lapsed account (the CALCULATE lines). */
const BUILT: { id: string; ws: any; fn: any; ex: Ex | null; gd: Guide; gdCapped: Guide }[] = [];
for (const ws of WORKSPACES as any[]) {
  for (const fn of ws.functions) {
    const ex = exampleFor(ws, fn);
    BUILT.push({
      id: `${ws.id}/${fn.key}`,
      ws,
      fn,
      ex,
      gd: G.calcWorkspaceGuide(ws, fn, ex) as unknown as Guide,
      gdCapped: G.calcWorkspaceGuide(ws, fn, ex, true) as unknown as Guide,
    });
  }
}

/** Copy written by us — the quoted on-screen data (formula, labels, names,
 *  values) removed, so a rule on OUR words is not tripped by the screen's own
 *  text (a formula "T = 1 / f" is not an "N / total"). */
function ownWords(t: string, b?: (typeof BUILT)[number]): string {
  if (!b) return t;
  let s = t;
  const quoted = [b.fn.formula, b.fn.name, ...b.fn.inputs.map((k: string) => b.ws.fields.find((f: any) => f.key === k)?.name ?? '')];
  if (b.ex) quoted.push(b.ex.label, b.ex.at4, b.ex.at5, b.ex.next ?? '', b.ex.at5Next ?? '');
  for (const q of quoted.filter(Boolean).sort((x, y) => y.length - x.length)) s = s.split(q).join('«»');
  return s;
}

function houseRules(id: string, gd: Guide, b?: (typeof BUILT)[number]) {
  const t = ownWords(textOf(gd), b);
  assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
  assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
  assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
  assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
  assert.doesNotMatch(t, /\b(Pro Tools|Logic|Ableton|iZotope|Waves|Shure|Neumann|Sennheiser|Yamaha|Avid|Smaart|Dante|Crown|QSC|JBL)\b/, `${id}: a gear/software brand`);
  // Trust-forward (owner): the guide never casts doubt on the maths.
  assert.doesNotMatch(t, /\b(approximate only|may be wrong|not accurate|inaccurate|rough guess|don’t trust|do not trust|unverified)\b/i, `${id}: casts doubt on the calculation`);
}

function shape(id: string, gd: Guide) {
  assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort(), `${id}: the five sections`);
  // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
  const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
  assert.ok(intro, 'no intro');
  assert.ok(intro.learning.trim().split(/\s+/).length <= 30, 'intro.learning over 30 words');
  assert.ok(intro.start.trim().split(/\s+/).length <= 40, 'intro.start over 40 words');
  for (const k of SECTION_KEYS) {
    assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
    assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
    for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
  }
  assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
}

function overBudget(id: string, gd: Guide): string[] {
  const over: string[] = [];
  for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
    if (s.place === 'strip') {
      for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 50)}…`);
      continue;
    }
    const n = gd[s.key].join(' ').length;
    const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
    if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
  }
  return over;
}

describe('1. a complete guide for every screen of the lab', () => {
  it('one static guide per non-calculator screen face', () => {
    assert.deepEqual(Object.keys(STATIC).sort(), ['home', 'projectEdit', 'projects', 'results', 'symbols', 'workflowEdit', 'workflowResults', 'workflowRun', 'workflows']);
  });
  it('every calculator and every calculation gets a built guide (56 × 166)', () => {
    assert.equal(WORKSPACES.length, 56);
    assert.equal(BUILT.length, 166);
  });
  for (const [id, gd] of Object.entries(STATIC)) {
    it(`${id}: five sections, 1–5 bullets, 2–3 TRY THIS, house copy rules`, () => {
      shape(id, gd);
      houseRules(id, gd);
    });
  }
  it('every built calculator guide: five sections, 2–3 TRY THIS, house copy rules', () => {
    for (const b of BUILT) {
      shape(b.id, b.gd);
      houseRules(b.id, b.gd, b);
      shape(b.id + ' (capped)', b.gdCapped);
      houseRules(b.id + ' (capped)', b.gdCapped, b);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('static guides', () => {
    const over = Object.entries(STATIC).flatMap(([id, gd]) => overBudget(id, gd));
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
  it('all 166 built calculator guides — with each calculator’s real names, formula and numbers', () => {
    const over = BUILT.flatMap((b) => [...overBudget(b.id, b.gd), ...overBudget(b.id + ' (capped)', b.gdCapped)]);
    assert.deepEqual(over, [], 'a calculator’s guide outgrows a step');
  });
});

describe('3. the guides quote each screen’s real names', () => {
  const S = {
    home: code('src/screens/lab/calc/CalcLabScreen.tsx'),
    symbols: code('src/screens/lab/calc/CalcSymbolsKeyScreen.tsx'),
    workflows: code('src/screens/lab/calc/CalcWorkflowsScreen.tsx'),
    workflowEdit: code('src/screens/lab/calc/CalcWorkflowEditScreen.tsx'),
    run: code('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'),
    projects: code('src/screens/lab/calc/CalcProjectsScreen.tsx'),
    results: code('src/screens/lab/calc/CalcResultsScreen.tsx'),
    workspace: code('src/screens/lab/calc/CalcWorkspaceScreen.tsx'),
    panel: code('src/screens/lab/calc/calcPanel.tsx'),
    report: code('src/screens/lab/calc/ReportCard.tsx'),
    key: code('src/screens/lab/calc/FormulaKeyPopup.tsx'),
    note: code('src/components/AccuracyNote.tsx'),
  };
  const NAMES: Record<string, [string, string[]][]> = {
    home: [
      [S.home, ['CALCULATORS', 'CUSTOM CALCULATOR WORKFLOWS', 'ABOUT THIS LAB', '⛓ CHAIN ACTIVE', '✕ CLEAR', '＋ NEW WORKFLOW', 'SAVED PROJECTS ›', 'SAVED RESULTS ›', 'RECENT · TAP TO RUN', 'sensitivity → voltage → gain → headroom']],
      [S.home + S.note, ['VERIFIED CALCULATION', 'KEY']],
      [S.workspace, ['WHAT ARE YOU CALCULATING?', 'WORKED STEPS', 'WHY THIS MATTERS', 'PRACTICAL EXAMPLE', 'COMMON MISTAKES']],
    ],
    symbols: [
      [S.symbols, ['SYMBOL KEY']],
      [read('src/screens/lab/calc/symbolsKey.ts'), ['GREEK LETTERS', 'OPERATORS & RELATIONS', 'CALCULUS & LOGARITHMS', 'POWERS, SUBSCRIPTS & PREFIXES', 'COMMON VARIABLES', 'VALUES THAT KEEP TURNING UP']],
      [S.symbols + S.key, ['ⓘ TAP FOR GLOSSARY DEFINITION', 'OPEN THE FULL SYMBOL KEY', 'FORMULA KEY']],
    ],
    workflows: [
      [S.workflows, ['CALCULATOR WORKFLOWS', 'MY WORKFLOWS', 'WORKFLOW TEMPLATES', '▶ RUN', 'DUPLICATE & CUSTOMIZE', 'EDIT', 'DUPLICATE', 'DELETE', '＋ NEW', '★', '▲', '▼']],
    ],
    workflowEdit: [
      [S.workflowEdit, ['EDIT WORKFLOW', 'NEW WORKFLOW', 'WORKFLOW NAME', 'DESCRIPTION (OPTIONAL)', 'STEPS', '＋ ADD CALCULATOR', 'Search calculators', 'SAVE', 'Discard changes?', '✕']],
    ],
    workflowRun: [
      [S.run, ['Step 1', 'RESULTS', 'YOUR ANSWER', 'FORMULA', '⟲ RESTORE IMPORT', '⛭ USE A SAVED PROJECT', '(PROJECT)', '‹ PREVIOUS', 'CONTINUE ›', 'FINISH ✓', 'SAVE', 'Manually overridden', '↻']],
    ],
    workflowResults: [
      [S.run, ['YOUR NOTES', 'SAVE RESULT', 'SAVED ✓', 'SHARE AS TEXT', 'SHARE AS IMAGE', 'START AGAIN', 'FINISH ✓']],
      [S.report, ['PRIMARY RESULT', 'INPUTS', 'RESULTS', 'NOTES', 'WARNINGS', 'Report ID']],
    ],
    projects: [
      [S.projects, ['SAVED PROJECTS', '＋ NEW', 'EDIT', 'DELETE', 'Length / distance']],
      [S.run, ['⛭ USE A SAVED PROJECT', '(PROJECT)']],
    ],
    projectEdit: [
      [S.projects, ['NEW PROJECT', 'EDIT PROJECT', 'PROJECT NAME', 'NOTES (OPTIONAL)', 'VALUES', 'Length / distance', 'Temperature', 'SPL', 'Power', 'Impedance', '＋ ADD VALUE', '✕', 'SAVE', 'Discard changes?', 'Rows without a label or a valid number are skipped on save']],
    ],
    results: [
      [S.results, ['SAVED RESULTS', 'SHARE AS TEXT', 'SHARE AS IMAGE', 'DELETE', '▸ ', '▾ ']],
      [S.report, ['PRIMARY RESULT', 'INPUTS', 'RESULTS', 'NOTES', 'WARNINGS', 'Report ID']],
      [S.run, ['SAVE RESULT']],
    ],
  };
  it('a name list for every static guide', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(STATIC).sort());
  });
  for (const [id, groups] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(STATIC[id]);
      for (const [src, names] of groups) {
        for (const n of names) {
          assert.ok(src.includes(n), `${id}: "${n}" is no longer on the screen — update the guide`);
          assert.ok(gt.includes(n.trim()), `${id}: the guide never names "${n}"`);
        }
      }
    });
  }
  it('home: ten category tiles, first WAVES & TIME, last ELECTRONICS, each holding calculators', () => {
    assert.equal(SECTION_META.length, 10);
    assert.equal(SECTION_META[0].title, 'WAVES & TIME');
    assert.equal(SECTION_META[9].title, 'ELECTRONICS');
    for (const m of SECTION_META) assert.ok(WORKSPACES.some((w: any) => w.section === m.id), `${m.title} has calculators`);
    assert.match(textOf(STATIC.home), /ten category tiles, from WAVES & TIME to ELECTRONICS/);
  });
  it('the calculator page’s fixed names are on its screen', () => {
    const page = S.workspace + S.panel;
    const fixed = (gd: Guide) => ['seeing', 'control', 'changes', 'teaches'].map((k) => gd[k].join(' ')).join(' ');
    for (const n of ['YOUR ANSWER', 'FUNCTION', 'SIG FIGS', 'FORMULA', 'π KEY', 'INPUTS', 'WHAT ARE YOU CALCULATING?', 'WHY THIS MATTERS', 'PRACTICAL EXAMPLE', 'COMMON MISTAKES', 'IN THE GLOSSARY', 'WORKED STEPS', 'SEND →', 'SHARE / COPY RESULT', '⇄', 'ⓘ', '⚠']) {
      assert.ok(page.includes(n), `"${n}" is no longer on the calculator page`);
      for (const b of BUILT) assert.ok(fixed(b.gd).includes(n) && fixed(b.gdCapped).includes(n), `${b.id}: the guide never names "${n}"`);
    }
    // CALCULATE: explained to capped readers only; everyone's TRY THIS says "if it shows".
    assert.ok(page.includes('CALCULATE'));
    for (const b of BUILT) {
      assert.ok(fixed(b.gdCapped).includes('CALCULATE'), `${b.id}: capped guide explains CALCULATE`);
      assert.ok(b.gd.tryThis[0].includes('(then CALCULATE, if it shows)'), `${b.id}: TRY THIS allows for CALCULATE`);
    }
    assert.ok(page.includes('⤵ USE'));
    assert.ok(BUILT.some((b) => b.gd.tryThis.join(' ').includes('⤵ USE')), 'a calculator guide names ⤵ USE');
    // SIG FIGS cycles exactly 3, 4, 5, starting at 4 — as the guide says.
    assert.match(S.workspace, /const SIGS = \[3, 4, 5\] as const;/);
    assert.match(S.workspace, /useState<number>\(4\)/);
    // A list box splits on commas (and spaces/semicolons) — calcUnits.parseList.
    assert.deepEqual(U.parseList('8, 8, 16'), [8, 8, 16]);
  });
  it('each built guide names THIS calculation and THESE inputs, and quotes THIS formula', () => {
    for (const b of BUILT) {
      const t = textOf(b.gd);
      assert.ok(t.includes(`“${b.fn.name}”`), `${b.id}: names its calculation`);
      assert.ok(t.includes(b.fn.formula), `${b.id}: quotes its formula`);
      for (const k of b.fn.inputs) {
        const f = b.ws.fields.find((x: any) => x.key === k);
        assert.ok(t.includes(f.name), `${b.id}: names input ${f.name}`);
        assert.ok(typeof f.placeholder === 'string' && f.placeholder.length > 0, `${b.id}: ${f.name} has a grey example value`);
      }
      if (b.fn.inputs.some((k: string) => b.ws.fields.find((x: any) => x.key === k).quantity === 'list')) {
        assert.ok(t.includes('a list box takes several numbers separated by commas'), `${b.id}: explains its list box`);
      }
      const n = b.ws.functions.length;
      assert.ok(n > 1 ? t.includes(`one of this page’s ${n} calculations`) : t.includes('this page’s one calculation'), `${b.id}: the picker line`);
    }
  });
});

describe('4. every TRY THIS number is what the screen prints', () => {
  it('calculator pages: the example numbers are the real compute path’s, and the guide quotes them', () => {
    for (const b of BUILT) {
      const tt = b.gd.tryThis.join('\n');
      if (!b.ex) {
        assert.doesNotMatch(tt, /\d/, `${b.id}: no example, so no numbers`);
        continue;
      }
      assert.ok(tt.includes(`${b.ex.label} reads ${b.ex.at4}`), `${b.id}: first experiment quotes ${b.ex.label} = ${b.ex.at4}`);
      const sig = b.ex.at5 !== b.ex.at4;
      if (sig) assert.ok(tt.includes(`now reads ${b.ex.at5}`), `${b.id}: SIG FIGS 5 reads ${b.ex.at5}`);
      // A unit tap quotes what the screen shows AT THAT POINT: after the SIG
      // FIGS step the answer reads at5, so the tap is at5 → at5Next.
      if (tt.includes('itself: it reads')) {
        const want = sig ? `Tap ${b.ex.at5} itself: it reads ${b.ex.at5Next}` : `Tap ${b.ex.at4} itself: it reads ${b.ex.next}`;
        assert.ok((sig ? b.ex.at5Next : b.ex.next) && tt.includes(want), `${b.id}: unit tap — ${want}`);
        // …and never an exponent form or a six-figure count of milli-units.
        const shown = (sig ? b.ex.at5Next : b.ex.next)!;
        assert.ok(!/\de[+-]?\d/.test(shown) && !/^-?\d{6,}/.test(shown), `${b.id}: unhelpful unit tap ${shown}`);
      }
      if (tt.includes('SEND →')) assert.ok(b.ex.sendable && b.ex.sendTo, `${b.id}: SEND → only where it shows AND something takes the value`);
      if (tt.includes('open another calculator')) assert.equal(b.ex.sendTo, 'other', `${b.id}: another calculator takes it`);
      if (tt.includes('pick another calculation under WHAT ARE YOU CALCULATING?')) assert.equal(b.ex.sendTo, 'here', `${b.id}: only this calculator takes it`);
      if (tt.includes('WORKED STEPS')) assert.ok(b.ex.steps, `${b.id}: WORKED STEPS only where it shows`);
      if (tt.includes('one more figure')) {
        const num = (s: string) => /^-?[\d.]+/.exec(s)![0];
        assert.ok(num(b.ex.at5).startsWith(num(b.ex.at4)) && num(b.ex.at5).replace(/[-.]/g, '').replace(/^0+/, '').length === num(b.ex.at4).replace(/[-.]/g, '').replace(/^0+/, '').length + 1, `${b.id}: "one more figure" but ${b.ex.at4} → ${b.ex.at5}`);
      }
    }
  });
  it('SEND → is promised only where ⤵ USE can take the value (chainFits over every calculator)', () => {
    // Independent of calcSendTarget: scan every input of every OTHER calculation.
    const target = (b: (typeof BUILT)[number]) => {
      const fields = b.fn.inputs.map((k: string) => b.ws.fields.find((f: any) => f.key === k));
      const exRaw = Object.fromEntries(fields.map((f: any) => [f.key, f.placeholder]));
      const r = Panel.runCompute(b.fn, Panel.buildValues(fields, exRaw, {}), fields);
      const o = r.outputs.find((x: any) => 'value' in x && x.label === b.ex!.label);
      const hits = (WORKSPACES as any[]).flatMap((w) =>
        w.functions
          .filter((g: any) => !(w.id === b.ws.id && g.key === b.fn.key))
          .flatMap((g: any) => g.inputs.map((k: string) => w.fields.find((f: any) => f.key === k)).filter((f: any) => f && U.chainFits(o.label, o.quantity, f, o.meaning)).map(() => w.id)),
      );
      return hits.some((id: string) => id !== b.ws.id) ? 'other' : hits.length ? 'here' : null;
    };
    const sendable = BUILT.filter((b) => b.ex?.sendable);
    for (const b of sendable) assert.equal(b.ex!.sendTo, target(b), b.id);
    // The audit named ten (three nowhere, seven this calculator only). Since
    // D41 an input takes an answer only when it MEANS the same thing, so more
    // answers have no taker: a cable's loop resistance is no load, a voltage
    // drop no supply voltage, an absorption total no panel area.
    const pick = (t: string | null) => sendable.filter((b) => b.ex!.sendTo === t).map((b) => b.id).sort();
    assert.deepEqual(pick(null), [
      'bitdepth/fromBits', 'bpm/lfoSync', 'cable/loss', 'cable/maxlen', 'complexz/impedance',
      'critdist/dc', 'critdist/drr', 'diffuser/qrd', 'driver/portLength', 'electronics/divider', 'electronics/xc',
      'electronics/xl', 'fft/resFromSize', 'fft/tradeoff', 'filesize/multitrack', 'filesize/size', 'loudtp/loudnessDelta',
      'micgain/maxspl', 'netaudio/bandwidth', 'pitch/interval', 'pitch/transpose', 'rflink/pathLoss', 'sabine/neededA',
      'schroeder/volForFs', 'stereomic/threeToOne', 'transloss/massTL', 'treatment/panels', 'vdrop/drop', 'wave/speed',
    ]);
    assert.deepEqual(pick('here'), [
      'bitdepth/bitsFromRange', 'bpm/bpmFromInterval', 'compressor/outFromRatio', 'compressor/ratioForOut', 'compressor/thrForGr', 'eyring/absForRt',
      'firlen/sizeTaps', 'level/ampToDb', 'level/dbToAmp', 'level/dbToPow', 'level/dbuDbv', 'level/pctToDb', 'level/powToDb',
      'level/vToDbu', 'level/vToDbv', 'micsens/mvToDb', 'phase/phaseFromDist', 'phase/phaseFromTime', 'pitch/freqToNote',
      'qbw/bwFromQ', 'qbw/octFromQ', 'qbw/qFromBw', 'qbw/qFromOct', 'sabine/rtFromSurfaces', 'timecode/toFrames',
      'transformer/ratioFromZ', 'transloss/massForTL', 'wave/wavelength',
    ]);
    for (const b of sendable.filter((x) => x.ex!.sendTo === null)) assert.doesNotMatch(b.gd.tryThis.join(' '), /SEND →/, b.id);
    const lvl = BUILT.find((b) => b.id === 'level/dbToAmp')!;
    assert.ok(lvl.gd.tryThis.includes('Tap SEND → beside AMPLITUDE RATIO, then pick another calculation under WHAT ARE YOU CALCULATING? An input there offers ⤵ USE AMPLITUDE RATIO.'));
  });
  it('cv70/morespeakers: SIG FIGS first, so no unit tap quotes 4-figure numbers (250 / 10^(1/10) = 198.58 W)', () => {
    const b = BUILT.find((x) => x.id === 'cv70/morespeakers')!;
    assert.equal(b.ex!.at4, '198.6 W');
    assert.equal(b.ex!.at5, '198.58 W');
    assert.equal((250 / 10 ** (1 / 10)).toFixed(2), '198.58');
    const tt = b.gd.tryThis.join('\n');
    assert.doesNotMatch(tt, /198600 mW|Tap 198\.6 W itself/);
    assert.match(tt, /now reads 198\.58 W/);
  });
  it('SIG FIGS: a rounded 4-figure value is said to be rounded, not "one more figure"', () => {
    const b = BUILT.find((x) => x.id === 'distdelay/delayToDist')!;
    assert.equal(b.ex!.at4, '30 m');
    assert.equal(b.ex!.at5, '29.997 m');
    assert.ok(b.gd.tryThis.includes('Tap SIG FIGS to 5: DISTANCE now reads 29.997 m. It’s the same answer: at 4 figures it rounds to 30 m.'));
    const w = BUILT.find((x) => x.id === 'wave/wavelength')!;
    assert.ok(w.gd.tryThis.includes('Tap SIG FIGS to 5: WAVELENGTH λ now reads 3.4321 m, the same answer with one more figure.'));
  });
  it('members never read weekly-allowance or membership copy; capped readers get the CALCULATE lines', () => {
    const tier = /\bfree\b|membership|this week|CALCULATE shows each new answer|wait until you tap CALCULATE/i;
    for (const b of BUILT) {
      // The registry's formula-in-words is physics quoted verbatim ("The free-space path loss…",
      // "free-air resonance"): it is masked here only after checking it holds no tier copy
      // beyond those physics terms.
      const pf = b.fn.plainFormula ?? '';
      assert.doesNotMatch(pf.replace(/\bfree-(space|air)\b/gi, ''), tier, `${b.id}: tier copy in the formula words`);
      const own = ownWords(textOf(b.gd), b);
      assert.doesNotMatch(pf ? own.split(pf).join('«»') : own, tier, `${b.id}: tier copy shown to an uncapped reader`);
      assert.match(b.gdCapped.control.join(' '), /On this account, CALCULATE shows each new answer and uses one of this week’s calculations/);
      assert.match(b.gdCapped.changes.join(' '), /New inputs wait until you tap CALCULATE \(one more of this week’s calculations\)/);
      const ownCapped = ownWords(textOf(b.gdCapped), b);
      assert.doesNotMatch(pf ? ownCapped.split(pf).join('«»') : ownCapped, /\bfree\b|membership/i, `${b.id}: capped copy stays neutral`);
    }
    for (const [id, gd] of Object.entries(STATIC)) assert.doesNotMatch(textOf(gd), /\bfree\b|membership|open to all/i, `${id}: tier copy in a static guide`);
    // The screen's own rule the capped lines describe.
    const W = code('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
    assert.match(W, /const resultUnlocked = !capped \|\| consumedSigs\.has\(inputSig\);/);
    assert.match(W, /const capped = \(entitlement === 'free' \|\| entitlement === 'lapsed'\) && !onboardingSampling;/);
  });
  it('WHAT CHANGES says why: the calculation’s formula in words wherever the step fits', () => {
    let withWords = 0;
    for (const b of BUILT) {
      assert.ok(b.fn.plainFormula, `${b.id}: has its π KEY words`);
      if (b.gd.changes[0].includes(b.fn.plainFormula) || b.gd.teaches[0].includes(b.fn.plainFormula)) withWords += 1;
    }
    assert.ok(withWords >= 108, `formula-in-words on ${withWords} calculations`);
    const p = BUILT.find((b) => b.id === 'ohmspower/pFromVZ')!;
    assert.ok(p.gd.changes[0].endsWith(p.fn.plainFormula));
  });
  it('the example fails on exactly one calculation, the axial mode list (its answers are lines of words)', () => {
    assert.deepEqual(BUILT.filter((b) => !b.ex).map((b) => b.id), ['roommodes/axial']);
  });
  it('spot checks against the formulas themselves (independent of the compute path)', () => {
    const ex = (ws: string, fn: string) => BUILT.find((b) => b.id === `${ws}/${fn}`)!.ex!;
    // T = 1 / f: 100 Hz → 10 ms.
    assert.equal(ex('wave', 'period').at4, '10 ms');
    // V = 0.7746 · 10^(dBu/20): +4 dBu → 1.228 V.
    assert.equal((0.7746 * 10 ** (4 / 20)).toFixed(3), '1.228');
    // P = V² / Z: 28.3 V into 8 Ω → 100.1 W.
    assert.equal(ex('ohmspower', 'pFromVZ').at4, '100.1 W');
    assert.equal(((28.3 * 28.3) / 8).toFixed(1), '100.1');
  });
  it('home: Sound & Wave at FREQUENCY 100 → PERIOD 10 ms; Audio Level Converter at 4 dBu → VOLTAGE (RMS) 1.228 V', () => {
    const run = (wsId: string, fnIdx: number, raw: Record<string, string>) => {
      const ws = getWorkspace(wsId) as any;
      const fn = ws.functions[fnIdx];
      const fields = fn.inputs.map((k: string) => ws.fields.find((f: any) => f.key === k));
      return { ws, fn, fields, r: Panel.runCompute(fn, Panel.buildValues(fields, raw, {}), fields) };
    };
    const a = run('wave', 0, { f: '100' });
    assert.equal(a.ws.name, 'Sound & Wave');
    assert.equal(a.ws.section, 'waves');
    assert.equal(a.fields[0].name, 'FREQUENCY');
    assert.equal(a.r.outputs[0].label, 'PERIOD');
    assert.equal(Panel.formatOutput(a.r.outputs[0], 4, 0), '10 ms');
    const b = run('level', 0, { [getWorkspace('level')!.functions[0].inputs[0]]: '4' });
    assert.equal(b.ws.name, 'Audio Level Converter');
    assert.equal(b.ws.section, 'levels');
    assert.equal(b.fields[0].name, 'LEVEL (dBu)');
    assert.equal(b.r.outputs[0].label, 'VOLTAGE (RMS)');
    assert.equal(Panel.formatOutput(b.r.outputs[0], 4, 0), '1.228 V');
    const t = STATIC.home.tryThis.join('\n');
    assert.ok(t.includes('Open WAVES & TIME › Sound & Wave and type 100 in FREQUENCY (then CALCULATE, if it shows). PERIOD reads 10 ms'));
    assert.ok(t.includes('Open LEVELS & DECIBELS › Audio Level Converter and type 4 in LEVEL (dBu) (then CALCULATE, if it shows). VOLTAGE (RMS) reads 1.228 V'));
  });
  it('workflowRun: the Ohm’s Law template — step 1 POWER 200 W, CURRENT 5 A; step 2 imports POWER as the runner does → the same 5 A', () => {
    const tpl = (WORKFLOW_TEMPLATES as any[]).find((w) => w.name === 'Ohm’s Law');
    assert.deepEqual(tpl.steps.map((s: any) => `${s.workspaceId}/${s.fnKey}`), ['ohmspower/pFromVZ', 'ohmspower/iFromPV']);
    const ws = getWorkspace('ohmspower') as any;
    const f1 = ws.functions.find((f: any) => f.key === 'pFromVZ');
    const fields1 = f1.inputs.map((k: string) => ws.fields.find((f: any) => f.key === k));
    assert.deepEqual(fields1.map((f: any) => f.name), ['VOLTAGE (RMS)', 'IMPEDANCE']);
    const r1 = Panel.runCompute(f1, Panel.buildValues(fields1, { [fields1[0].key]: '40', [fields1[1].key]: '8' }, {}), fields1);
    const power = r1.outputs.find((o: any) => o.label === 'POWER');
    // The runner shows 4 figures, fixed (no SIG FIGS there).
    assert.match(code('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), /formatOutput\(o, 4, outUnit/);
    assert.equal(Panel.formatOutput(power, 4, 0), '200 W');
    // P = V² / Z = 40² / 8 = 200 W; I = V / Z = 40 / 8 = 5 A.
    assert.equal(Panel.formatOutput(r1.outputs.find((o: any) => o.label === 'CURRENT'), 4, 0), '5 A');
    // Step 2: a LIVE import is fmtCarried(unit.fromBase(value)) — the runner's own rule.
    const f2 = ws.functions.find((f: any) => f.key === 'iFromPV');
    const fields2 = f2.inputs.map((k: string) => ws.fields.find((f: any) => f.key === k));
    assert.deepEqual(fields2.map((f: any) => f.name), ['POWER', 'VOLTAGE (RMS)']);
    assert.ok(U.chainFits(power.label, power.quantity, fields2[0], power.meaning), 'POWER fits step 2’s POWER');
    assert.match(code('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), /effRaw\[f\.key\] = fmtCarried\(u\.fromBase\(o\.value\), f\.quantity\);/);
    const pu = U.unitsFor(fields2[0].quantity, fields2[0].unitIds)[Panel.defaultUnitIdx(fields2[0])];
    const carried = U.fmtCarried(pu.fromBase(power.value), fields2[0].quantity);
    const r2 = Panel.runCompute(f2, Panel.buildValues(fields2, { [fields2[0].key]: carried, [fields2[1].key]: '40' }, {}), fields2);
    const current = r2.outputs.find((o: any) => 'value' in o && o.label === 'CURRENT');
    const shown = Panel.formatOutput(current, 4, 0);
    // The carried power is exact (no drift between step 1’s and step 2’s current).
    assert.equal(carried, '200');
    assert.equal(shown, '5 A');
    const t = STATIC.workflowRun.tryThis.join('\n');
    assert.ok(t.includes('type 40 in VOLTAGE (RMS) and 8 in IMPEDANCE on step 1: POWER reads 200 W and CURRENT reads 5 A'));
    assert.ok(t.includes(`⤵ USE POWER (STEP 1) and type 40 in VOLTAGE (RMS): CURRENT reads ${shown}, the same current`), `CURRENT reads ${shown}`);
    // The import button's words, as drawn.
    assert.match(code('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), /⤵ USE \{s\.label\.toUpperCase\(\)\} \(STEP \{s\.fromStep \+ 1\}\)/);
  });
  it('workflowEdit: Power from voltage & impedance → Current from power & voltage is a real chain (POWER → POWER)', () => {
    const ws = getWorkspace('ohmspower') as any;
    const names = ws.functions.map((f: any) => f.name);
    assert.ok(names.includes('Power from voltage & impedance') && names.includes('Current from power & voltage'));
    assert.ok(STATIC.workflowEdit.tryThis.join('\n').includes('Name it, add Power from voltage & impedance, then Current from power & voltage, and SAVE. Run it, fill in step 1, and step 2 offers ⤵ USE POWER (STEP 1).'));
    // SAVE refuses an unnamed workflow; an incomplete step offers nothing to import.
    const E = code('src/screens/lab/calc/CalcWorkflowEditScreen.tsx');
    assert.match(E, /if \(!trimmed\) \{\s*notify\('Name the workflow'/);
    assert.match(code('src/screens/lab/calc/CalcWorkflowRunScreen.tsx'), /\(computed\[k\]\?\.result\.outputs \?\? \[\]\)\.forEach/);
    // New steps go to the END of the list (the guide says "the last step").
    assert.match(code('src/screens/lab/calc/CalcWorkflowEditScreen.tsx'), /setSteps\(\(s\) => \[\.\.\.s, \{ workspaceId: c\.workspaceId, fnKey: c\.fnKey \}\]\)/);
  });
  it('symbols: λ, Δ, µ, ρ say what the key says; 10 µF = 0.00001 F', () => {
    const all = (SYMBOL_GROUPS as any[]).flatMap((g) => g.entries);
    assert.deepEqual((SYMBOL_GROUPS as any[]).map((g) => g.title), ['GREEK LETTERS', 'OPERATORS & RELATIONS', 'CALCULUS & LOGARITHMS', 'POWERS, SUBSCRIPTS & PREFIXES', 'COMMON VARIABLES', 'VALUES THAT KEEP TURNING UP']);
    const lambda = all.find((e) => e.symbol === 'λ');
    assert.equal(lambda.glossaryTerm, 'Wavelength');
    assert.equal(lambda.example, 'λ = c / f');
    assert.match(all.find((e) => e.symbol === 'Δ').meaning, /A change, or the difference between two values/);
    assert.match(all.find((e) => e.symbol === 'µ').meaning, /one-millionth/);
    assert.match(all.find((e) => e.symbol === 'ρ').meaning, /Resistivity .* for cable, or density .* for air/);
    assert.ok(Math.abs(10 * 1e-6 - 0.00001) < 1e-18);
    assert.ok((getWorkspace('phase') as any).fields.some((f: any) => f.name === 'TIME OFFSET Δt'));
  });
  it('projectEdit: the type button starts at Length / distance and clears the number; m → ft on the unit button', () => {
    const P = code('src/screens/lab/calc/CalcProjectsScreen.tsx');
    assert.match(P, /const PROJECT_KINDS[^=]*= \[\s*\{ kind: 'length', label: 'Length \/ distance' \},\s*\{ kind: 'temperature', label: 'Temperature' \},\s*\{ kind: 'spl', label: 'SPL' \},\s*\{ kind: 'power', label: 'Power' \},\s*\{ kind: 'impedance', label: 'Impedance' \},/);
    assert.match(P, /setVal\(i, \{ kindIdx: \(v\.kindIdx \+ 1\) % PROJECT_KINDS\.length, unitIdx: 0, raw: '' \}\)/);
    assert.deepEqual((U.QUANTITIES as any).length.slice(0, 2).map((u: any) => u.label), ['m', 'ft']);
    // The unit button relabels; the typed number stays (so 20 m becomes 20 ft).
    assert.match(P, /onPress=\{\(\) => setVal\(i, \{ unitIdx: \(v\.unitIdx \+ 1\) % units\.length \}\)\}/);
    assert.ok(STATIC.projectEdit.tryThis.join(' ').includes('m becomes ft and the number stays, so 20 m is now 20 ft'));
    // projects: a row needs a valid number to be saved, so the TRY THIS types one.
    assert.match(P, /if \(!label \|\| !Number\.isFinite\(base\)\) \{/);
    assert.ok(STATIC.projects.tryThis.join(' ').includes('as Length / distance, type 12, and SAVE'));
  });
  it('workflows: the duplicate is named “… copy” and opens in the builder; the templates named exist', () => {
    const W = code('src/screens/lab/calc/CalcWorkflowsScreen.tsx');
    assert.match(W, /name: `\$\{src\.name\} copy`/);
    assert.match(W, /navigation\.navigate\('CalcWorkflowEdit', \{ id: copy\.id \}\)/);
    const names = (WORKFLOW_TEMPLATES as any[]).map((w) => w.name);
    for (const n of ['Delay Speaker Setup', 'Room Acoustics Survey', 'Ohm’s Law']) assert.ok(names.includes(n), n);
    // The template the guide holds up as chaining really passes answers on,
    // by the runner's own offer rule (chainFits + chainable + finite).
    const tpl = (WORKFLOW_TEMPLATES as any[]).find((w) => w.name === 'Room Acoustics Survey');
    assert.deepEqual(tpl.steps.map((s: any) => `${s.workspaceId}/${s.fnKey}`), ['sabine/rtFromVA', 'critdist/dc', 'critdist/drr']);
    const links: string[] = [];
    const outs: [number, any][] = [];
    tpl.steps.forEach((st: any, i: number) => {
      const ws = getWorkspace(st.workspaceId) as any;
      const fn = ws.functions.find((f: any) => f.key === st.fnKey);
      const fields = fn.inputs.map((k: string) => ws.fields.find((f: any) => f.key === k));
      for (const f of fields) for (const [k, o] of outs) if ('value' in o && o.chainable !== false && U.chainFits(o.label, o.quantity, f, o.meaning)) links.push(`${o.label}@${k + 1}>${f.name}@${i + 1}`);
      const r = Panel.runCompute(fn, Panel.buildValues(fields, Object.fromEntries(fields.map((f: any) => [f.key, f.placeholder])), {}), fields);
      for (const o of r.outputs) outs.push([i, o]);
    });
    assert.ok(links.includes('RT60@1>REVERBERATION TIME (RT60)@2'), links.join('; '));
    // D41: Dc is a property of the room, not where the listener sits — fed in
    // as LISTENING DISTANCE it always read 0 dB. It is no longer offered.
    assert.ok(!links.includes('CRITICAL DISTANCE Dc@2>LISTENING DISTANCE@3'), links.join('; '));
    assert.deepEqual(links, ['RT60@1>REVERBERATION TIME (RT60)@2', 'RT60@1>REVERBERATION TIME (RT60)@3']);
    assert.match(textOf(STATIC.workflows), /RT60 comes first, then critical distance, then the direct-to-reverberant ratio/);
    assert.ok(textOf(STATIC.workflows).includes('Room Acoustics Survey'));
    assert.ok(STATIC.workflows.tryThis.join(' ').includes('On step 2, look for ⤵ USE RT60 (STEP 1)'));
    assert.doesNotMatch(textOf(STATIC.workflows), /speed of sound → distance delay/i);
  });
  it('home: the lab has its own Home card, not a place in the Advanced Training Labs; most calculators hold several calculations', () => {
    assert.match(code('src/screens/lab/labCatalog.ts'), /c\.section === section && c\.id !== 'calculators'/);
    assert.match(code('src/screens/courses/CourseSelectionScreen.tsx'), /'OPEN CALCULATORS'/);
    assert.ok(textOf(STATIC.home).includes('OPEN CALCULATORS on Home brings you back here'));
    assert.doesNotMatch(textOf(STATIC.home), /Advanced Training Labs/);
    assert.deepEqual((WORKSPACES as any[]).filter((w) => w.functions.length === 1).map((w) => w.id).sort(), ['diffuser', 'imd', 'loudnorm', 'treatment']);
    assert.ok(STATIC.home.changes[0].startsWith('When one job can be worked out several ways, those calculators share a page'));
  });
  it('symbols: ‹ returns to the calculator page (its FORMULA KEY closes before the symbol key opens)', () => {
    assert.match(code('src/screens/lab/calc/CalcWorkspaceScreen.tsx'), /onOpenFullKey=\{\(\) => \{\s*setKeyOpen\(false\);\s*navigation\.navigate\('CalcSymbolsKey'\);/);
    assert.ok(STATIC.symbols.control.join(' ').includes('the calculator whose FORMULA KEY you left through π OPEN THE FULL SYMBOL KEY ›'));
  });
});

describe('5. wiring and the accuracy-chip decision', () => {
  const IMPORT = /import \{ ScreenGuideHintAnchor, ScreenGuideHost, ScreenGuideKey(, useGuideRegion)? \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/;
  const SCREENS: [string, RegExp][] = [
    ['CalcLabScreen', /<ScreenGuideKey title="AUDIO CALCULATOR LABORATORY" guide=\{CALC_SCREEN_GUIDES\.home\} \/>/],
    ['CalcSymbolsKeyScreen', /<ScreenGuideKey title="SYMBOL KEY" guide=\{CALC_SCREEN_GUIDES\.symbols\} \/>/],
    ['CalcWorkflowsScreen', /<ScreenGuideKey title="CALCULATOR WORKFLOWS" guide=\{CALC_SCREEN_GUIDES\.workflows\} \/>/],
    ['CalcWorkflowEditScreen', /<ScreenGuideKey title=\{editingId \? 'EDIT WORKFLOW' : 'NEW WORKFLOW'\} guide=\{CALC_SCREEN_GUIDES\.workflowEdit\} \/>/],
    ['CalcWorkflowRunScreen', /guide=\{idx < n \? CALC_SCREEN_GUIDES\.workflowRun : CALC_SCREEN_GUIDES\.workflowResults\}/],
    ['CalcProjectsScreen', /guide=\{editing \? CALC_SCREEN_GUIDES\.projectEdit : CALC_SCREEN_GUIDES\.projects\}/],
    ['CalcResultsScreen', /<ScreenGuideKey title="SAVED RESULTS" guide=\{CALC_SCREEN_GUIDES\.results\} \/>/],
    ['CalcWorkspaceScreen', /\{guide \? <ScreenGuideKey title=\{calcWorkspaceGuideTitle\(ws\)\} guide=\{guide\} \/> : null\}/],
  ];
  for (const [name, key] of SCREENS) {
    it(`${name}: host wraps the content, hint anchor wraps the header, key at the header’s trailing edge`, () => {
      const src = code(`src/screens/lab/calc/${name}.tsx`);
      assert.match(src, IMPORT);
      assert.match(src, key);
      assert.match(src, /<ScreenGuideHost[^>]*>\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.header\}>/);
      // The key is the header's LAST item: header closes, then the anchor.
      assert.match(src, /<ScreenGuideKey[\s\S]{0,260}?\/>( : null\})?\s*<\/View>\s*<\/ScreenGuideHintAnchor>/);
      assert.match(src, /<\/ScreenGuideHost>\s*<\/(View|ImageBackground)>/);
    });
  }
  it('screens without a display open the guide as a bottom card (regions off); the calculator page lends its pinned answer stage', () => {
    for (const n of ['CalcLabScreen', 'CalcSymbolsKeyScreen', 'CalcWorkflowsScreen', 'CalcWorkflowEditScreen', 'CalcWorkflowRunScreen', 'CalcProjectsScreen', 'CalcResultsScreen']) {
      assert.match(code(`src/screens/lab/calc/${n}.tsx`), /<ScreenGuideHost regions=\{false\}/, n);
    }
    const W = code('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
    assert.match(W, /<ScreenGuideHost resetKey=\{ws\.id\}>/);
    assert.match(W, /useGuideRegion\('display', stageRef\);/);
    // No strip, no dock: never-attached refs top those stacks, so a lab page
    // underneath (Sound Systems Σ links push this screen) is never measured.
    assert.match(W, /useGuideRegion\('readouts', noReadoutsRef\);/);
    assert.match(W, /useGuideRegion\('dock', noDockRef\);/);
    assert.doesNotMatch(W, /ref=\{(noReadoutsRef|noDockRef)\}/);
    assert.match(W, /<View style=\{styles\.stageWrap\} ref=\{stageRef\} collapsable=\{false\}>/);
  });
  it('the calculator page builds its guide from THIS calculation and the REAL compute path (the memo §4 mirrors)', () => {
    const W = code('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
    assert.match(W, /for \(const f of fields\) exRaw\[f\.key\] = f\.placeholder \?\? '';/);
    assert.match(W, /const r = runCompute\(fn, buildValues\(fields, exRaw, \{\}\), fields\);/);
    assert.match(W, /if \(r\.computeError \|\| r\.refused\) return null;/);
    assert.match(W, /const o = r\.outputs\.find\(\(x\): x is Extract<OutputVal, \{ value: number \}> => 'value' in x && Number\.isFinite\(x\.value\)\);/);
    assert.match(W, /const at4 = formatOutput\(o, 4, 0\);\s*const next = formatOutput\(o, 4, 1\);/);
    assert.match(W, /const at5 = formatOutput\(o, 5, 0\);\s*const at5Next = formatOutput\(o, 5, 1\);\s*const sendable = o\.chainable !== false;/);
    assert.match(W, /next: next === at4 \? null : next,\s*at5Next: at5Next === at5 \? null : at5Next,\s*sendable,\s*sendTo: ws && sendable \? calcSendTarget\(ws, fn, o\.label, o\.quantity, o\.meaning\) : null,\s*steps: r\.steps\.length > 0,/);
    assert.match(W, /calcWorkspaceGuide\(ws, fn, guideExample, capped\)/);
    // calcSendTarget is the screen's ⤵ USE rule: chainFits on each input.
    assert.match(W, /const canChain = chain && chainFits\(chain\.label, chain\.quantity, f, chain\.meaning\);/);
    // The answer itself uses the same formatter (formatOut → formatOutput), and SEND → the same chainable rule.
    assert.match(W, /return formatOutput\(o, sig, \(outUnit\[o\.label\] \?\? 0\) \+ extraIdx\);/);
    assert.match(W, /o\.chainable !== false && Number\.isFinite\(o\.value\) && !refused \? \(/);
  });
  it('chip decision: calculators KEEP ✓ VERIFIED (AccuracyNote variant "calc"); the ⓘ sits beside it, never replaces it', () => {
    for (const n of ['CalcLabScreen', 'CalcWorkspaceScreen', 'CalcWorkflowRunScreen', 'CalcResultsScreen']) {
      const src = code(`src/screens/lab/calc/${n}.tsx`);
      assert.match(src, /<AccuracyNote compact variant="calc"( detail=\{ws\.accuracyDetail\})? \/>/, `${n} keeps the calc chip`);
      assert.ok(src.indexOf('<AccuracyNote compact variant="calc"') < src.indexOf('<ScreenGuideKey'), `${n}: the key follows the chip`);
    }
    // No calc screen switched to another variant, or lost the chip it had.
    for (const n of ['CalcSymbolsKeyScreen', 'CalcWorkflowsScreen', 'CalcWorkflowEditScreen', 'CalcProjectsScreen']) {
      assert.doesNotMatch(code(`src/screens/lab/calc/${n}.tsx`), /AccuracyNote/, `${n} never had the chip`);
    }
  });
});

describe('owner 2026-11-01: "166 calculators" everywhere', () => {
  it('the ten home tiles total every calculator (each function), the same count the catalog shows', async () => {
    const S = readFileSync(join(process.cwd(), 'src/screens/lab/calc/CalcLabScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(S, /w\.section === sec\.id\)\.reduce\(\(n, w\) => n \+ w\.functions\.length, 0\)/);
    const total = (WORKSPACES as any[]).reduce((n, w) => n + w.functions.length, 0);
    assert.ok(total >= 166, String(total));
    const C = readFileSync(join(process.cwd(), 'src/screens/lab/labCatalog.ts'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(C, /countLabel: \(n\) => `\$\{n\} Calculators`/);
    assert.doesNotMatch(C, /\} Calculations`/);
  });
});

describe('D42 · P3 polish pins', () => {
  const CHAIN = 'Real system design is a chain: one answer feeds the next calculation, and SEND → carries it into another calculator.';
  const HERE = 'One answer can feed another: SEND → passes it to another calculation on this page, but only to an input of the same kind.';
  it('K4: the screen hands the guide the reach of EVERY SEND → it shows (its sendTakers + render gate)', () => {
    const W = code('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
    assert.match(W, /steps: r\.steps\.length > 0,\s*sendAny: ws \? calcSendReach\(ws, fn, r\.outputs\) : null,/);
    // sendTakers = calcSendTarget(...) !== null; the button also needs chainable and a finite value.
    assert.match(W, /m\.set\(o\.label, calcSendTarget\(ws, fn, o\.label, o\.quantity, o\.meaning\) !== null\)/);
    assert.match(W, /\{sendTakers\.get\(o\.label\) && o\.chainable !== false && Number\.isFinite\(o\.value\) && !refused \? \(/);
    const G2 = code('src/screens/lab/calc/calcScreenGuides.ts');
    assert.match(G2, /if \(typeof o\.value !== 'number' \|\| !Number\.isFinite\(o\.value\) \|\| o\.chainable === false \|\| !o\.quantity\) continue;/);
  });
  it('K4: a SEND teaches line only where a SEND → can show — chain (another calculator), this page, or none', () => {
    const n = { other: 0, here: 0, none: 0 };
    for (const b of BUILT) {
      const t = b.gd.teaches.join('\n');
      const reach = b.ex?.sendAny ?? null;
      if (reach === 'other') {
        assert.ok(t.includes(CHAIN) && !t.includes(HERE), `${b.id}: chain line`);
        n.other += 1;
      } else if (reach === 'here') {
        assert.ok(t.includes(HERE) && !t.includes(CHAIN), `${b.id}: this-page line`);
        n.here += 1;
      } else {
        assert.doesNotMatch(t, /SEND →/, `${b.id}: no SEND → shows, so no SEND teaches line`);
        n.none += 1;
      }
    }
    assert.ok(n.other > 0 && n.none > 0, JSON.stringify(n));
    // The pages the checker named carry no SEND line (no taker for any answer).
    for (const id of ['wave/speed', 'electronics/xc', 'dose/doseOsha', 'cable/maxlen', 'pitch/interval', 'rflink/budget']) {
      const b = BUILT.find((x) => x.id === id);
      if (b) assert.doesNotMatch(b.gd.teaches.join(' '), /SEND →/, id);
    }
  });
  it('K2: a one-input calculation drops "in each"; K3: the bezel is placed under YOUR ANSWER', () => {
    for (const b of BUILT) {
      const c0 = b.gd.control[0];
      if (b.fn.inputs.length === 1 && !/list box/.test(c0)) assert.match(c0, /, type a number\. A gray number/, b.id);
      if (b.fn.inputs.length > 1 && !/list box/.test(c0)) assert.match(c0, /type a number in each box\./, b.id);
      assert.match(b.gd.seeing[0], /^YOUR ANSWER sits at the top/, b.id);
      assert.match(b.gd.seeing[1], /^Just under it: FUNCTION/, b.id);
    }
  });
});
