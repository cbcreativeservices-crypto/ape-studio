/**
 * Screen Guide rollout — Vacuum Tube Fundamentals (owner 2026-10-31) —
 * receipts. Pattern: test/screenGuide_20261031.test.ts (the Wave pilot).
 *
 * The screens a learner reaches, and their guides:
 *   the nine modules — VacuumTubeLabScreen's SECTIONS (the lab opens on the
 *   first; there is no separate home) → TUBE_SCREEN_GUIDES[section key];
 *   the what's-left screen → TUBE_END_GUIDE;
 *   the dock's TUBE REF › → TubeReferenceScreen → TUBE_REFERENCE_GUIDE;
 *   a row there → TubeCardScreen (card view) → TUBE_CARD_GUIDE.
 *
 * Chip decisions (owner rule 2026-10-31): the lab is a CONCEPT lab (every
 * drawing badged an illustrative model, no live input, no real-world
 * measurement) → its AccuracyNote is gone and the ⓘ takes the spot. The Tube
 * Reference list and card carry real published data-sheet ratings → their
 * chip STAYS and the ⓘ sits beside it.
 *
 *   1. every screen has a guide: five sections, 1–5 bullets, 2–3 TRY THIS,
 *      house copy rules;
 *   2. every step within its no-scroll budget;
 *   3. each pinned on-screen name is in the guide AND in that screen's code;
 *   4. the TRY THIS numbers are the numbers the screen prints;
 *   5. wiring + the chip decisions.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

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

const G = await import('../src/screens/lab/tube/tubeScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const grid = await import('../src/screens/lab/tube/gridModel.ts');

type Guide = Record<string, string[]>;
const MODULES = G.TUBE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const ALL: [string, Guide][] = [
  ...Object.entries(MODULES),
  ['end', G.TUBE_END_GUIDE as unknown as Guide],
  ['reference', G.TUBE_REFERENCE_GUIDE as unknown as Guide],
  ['card', G.TUBE_CARD_GUIDE as unknown as Guide],
];
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const LAB = 'src/screens/lab/tube/VacuumTubeLabScreen.tsx';
const REF = 'src/screens/lab/tube/TubeReferenceScreen.tsx';
const CARD = 'src/screens/lab/tube/TubeCardScreen.tsx';
const LAB_SRC = code(LAB);
const REF_SRC = code(REF);
const CARD_SRC = code(CARD);
/** One section component's source: from `function <Name>(` to the next top-level function. */
const fnBlock = (src: string, name: string) => {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at >= 0, `${name} not found`);
  const rest = src.slice(at + 10);
  const next = rest.search(/\nfunction |\nexport function |\nconst [A-Z_]+[:= ]/);
  return src.slice(at, at + 10 + (next < 0 ? rest.length : next));
};

describe('1. every Vacuum Tube screen has a complete guide', () => {
  it('one guide per module, keyed exactly by the SECTIONS keys, in lab order', () => {
    const keys = [...LAB_SRC.matchAll(/\{ key: '(\w+)', label: '[^']+', title: '/g)].map((m) => m[1]);
    assert.equal(keys.length, 9, 'nine modules');
    assert.deepEqual(Object.keys(MODULES), keys);
  });
  for (const [id, gd] of ALL) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no brands', () => {
    for (const [id, gd] of ALL) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Mullard|Telefunken|Sylvania|RCA|JJ|Tung-Sol|Svetlana|Fender|Marshall|Vox|Mesa|Shure|Neumann|Yamaha)\b/, `${id}: a maker/brand name`);
    }
  });
  it('every module says where it sits in the lesson sequence', () => {
    const order = Object.keys(MODULES);
    order.forEach((id, i) => {
      const t = MODULES[id].teaches.join(' ');
      if (i === 0) assert.match(t, /first module[\s\S]*first lab in Audio Electronics/);
      else if (i === order.length - 1) assert.match(t, /last module[\s\S]*Amplifier Principles Lab/);
      else assert.match(t, /(It follows|comes next)/, `${id}: no place in the sequence`);
    });
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of ALL) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const DOCK = ['TUBE REF ›', '⤢ FULL SCREEN'];
  const NAMES: Record<string, { src: string; names: string[] }> = {
    inside: { src: fnBlock(LAB_SRC, 'InsideSection'), names: ['PARTS', 'EMISSION', 'CURRENT', 'NONE', 'METERED', 'WIDE OPEN', 'HIDE ALL', 'SHOW ALL'] },
    flow: { src: fnBlock(LAB_SRC, 'FlowSection'), names: ['WARM-UP', 'HEAT', 'STAGE', 'PLATE I', 'warming…', 'conducting'] },
    grid: { src: fnBlock(LAB_SRC, 'GridSection'), names: ['GRID V', 'GRID', 'PLATE I'] },
    amplify: { src: fnBlock(LAB_SRC, 'AmplifySection'), names: ['GAIN', '~×7', 'IN', 'GRID', 'OUT', 'PLATE'] },
    highv: { src: fnBlock(LAB_SRC, 'HighVoltSection'), names: ['SUPPLY', 'SMALL SUPPLY', 'HIGH-VOLTAGE SUPPLY (B+)', 'B+ HIGH', 'PULL', 'WEAK', 'STRONG', 'STREAM', 'SPARSE', 'DENSE'] },
    types: { src: fnBlock(LAB_SRC, 'TypesSection'), names: ['TYPE', 'GRIDS', 'NEW', 'ADDS'] },
    bias: { src: fnBlock(LAB_SRC, 'BiasSection'), names: ['BIAS', 'ZONE', 'CUTOFF', 'SATURATION', 'LINEAR', 'too negative', 'too positive', 'correct'] },
    sat: { src: fnBlock(LAB_SRC, 'SaturationSection'), names: ['DRIVE', 'STATE', 'CLEAN', 'WARMING', 'SATURATED', 'clean — straight-line region', 'warming — peaks rounding', 'saturated — soft clipping'] },
    versus: { src: fnBlock(LAB_SRC, 'VersusSection'), names: ['TUBE', 'VACUUM', 'TRANSISTOR', 'JUNCTION'] },
    reference: { src: REF_SRC, names: ['✕'] },
    card: { src: CARD_SRC, names: ['PAGE', 'RETRY', 'LOADING', 'Preamp Triode', 'Power Output', 'Directly-Heated Triode', 'Rectifier'] },
  };
  it('a name list for every module guide and both reference guides', () => {
    for (const id of [...Object.keys(MODULES), 'reference', 'card']) assert.ok(NAMES[id], `${id}: no name list`);
  });
  for (const [id, { src, names }] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on its screen AND in its guide`, () => {
      const gd = id === 'reference' ? G.TUBE_REFERENCE_GUIDE : id === 'card' ? G.TUBE_CARD_GUIDE : MODULES[id];
      const gt = textOf(gd as unknown as Guide);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer on the screen — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the shared dock tail is named on every module that has it', () => {
    assert.match(LAB_SRC, /label: 'TUBE REF ›'/);
    assert.match(LAB_SRC, /label: '⚡ E-VIEW'/);
    assert.match(read('src/screens/lab/rack/RackUnit.tsx'), /⤢ {2}FULL SCREEN/);
    for (const [id, gd] of Object.entries(MODULES)) for (const n of DOCK) assert.ok(textOf(gd).includes(n), `${id}: never names ${n}`);
  });
  it('E-VIEW is described only on the modules whose dock carries it', () => {
    const uses = (name: string) => /tailParams\(p, true\)/.test(fnBlock(LAB_SRC, name));
    const map: Record<string, string> = { inside: 'InsideSection', flow: 'FlowSection', grid: 'GridSection', amplify: 'AmplifySection', highv: 'HighVoltSection', types: 'TypesSection', bias: 'BiasSection', sat: 'SaturationSection', versus: 'VersusSection' };
    for (const [id, fn] of Object.entries(map)) {
      assert.equal(MODULES[id].control.join(' ').includes('E-VIEW'), uses(fn), `${id}: E-VIEW in the guide ≠ E-VIEW in the dock`);
    }
  });
  it('INSIDE names every part chip, in build order', () => {
    const chips = [...LAB_SRC.matchAll(/\{ key: '\w+', label: '([A-Z ]+)', note: /g)].map((m) => m[1]);
    assert.deepEqual(chips, ['GLASS', 'VACUUM', 'HEATER', 'CATHODE', 'PLATE', 'CONTROL GRID', 'SCREEN GRID', 'SUPPRESSOR']);
    assert.ok(MODULES.inside.control.join(' ').includes(chips.join(', ')));
  });
  it('TYPES names the tray options and the NEW words exactly', () => {
    for (const n of ["label: 'TRIODE'", "label: 'TETRODE'", "label: 'PENTODE'", "grids: '1 GRID'", "grids: '2 GRIDS'", "grids: '3 GRIDS'", "newShort: 'G1 CONTROL'", "newShort: 'G2 SCREEN'", "newShort: 'G3 SUPPR'"]) assert.ok(LAB_SRC.includes(n), n);
    assert.match(LAB_SRC, /label: `\$\{ty\.label\} · \$\{ty\.grids\}`/);
    const t = textOf(MODULES.types);
    for (const n of ['TRIODE · 1 GRID', 'TETRODE · 2 GRIDS', 'PENTODE · 3 GRIDS', 'G1 CONTROL', 'G2 SCREEN', 'G3 SUPPR']) assert.ok(t.includes(n), n);
  });
  it('the reference families and the what’s-left names are the screens’ own', () => {
    const fams = read('src/screens/lab/tube/tubeRefs.ts');
    for (const f of ['PREAMP & SMALL-SIGNAL TRIODES', 'POWER PENTODES & BEAM TETRODES', 'DIRECTLY-HEATED TRIODES', 'RECTIFIERS']) {
      assert.ok(fams.includes(`title: '${f}'`), f);
      assert.ok(textOf(G.TUBE_REFERENCE_GUIDE as unknown as Guide).includes(f), f);
    }
    assert.match(REF_SRC, /40 tubes · structure, pins, ratings, substitutions/);
    const end = code('src/screens/lab/kit/LabEndScreen.tsx');
    for (const n of ['PRACTICE AGAIN FROM THE START', 'REVIEW ▾', 'YOUR PROGRESS']) assert.ok(end.includes(n) && textOf(G.TUBE_END_GUIDE as unknown as Guide).includes(n), n);
    assert.match(code('src/screens/lab/kit/labEnd.ts'), /'LAB COMPLETE' : "WHAT'S LEFT"/);
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), />CHECK YOUR UNDERSTANDING</);
    assert.match(LAB_SRC, /extra=\{<LabUnderstandingBlock labId="tube"/);
    assert.match(LAB_SRC, /onPracticeAgain=\{\(\) => openSection\(0\)\}/);
  });
});

describe('4. the numbers in the guide are the numbers the screen prints', () => {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  it('GRID: 50% → 26%, 75% → 59%, 15% → CUT OFF and 0% (gridModel, the lane the screen reads)', () => {
    assert.match(LAB_SRC, /const plateI = plateCurrentFrac\(v\);/);
    assert.match(LAB_SRC, /const \[v, setV\] = useState\(0\.5\);/);
    assert.equal(pct(grid.plateCurrentFrac(0.5)), '26%');
    assert.equal(pct(grid.plateCurrentFrac(0.75)), '59%');
    assert.equal(pct(grid.plateCurrentFrac(0.15)), '0%');
    assert.equal(grid.gridState(0.15), 'CUT OFF');
    assert.equal(grid.gridState(0.5), 'PARTIAL');
    assert.ok(grid.plateCurrentFrac(0.75) > 2 * grid.plateCurrentFrac(0.5), '"more than double"');
    const t = MODULES.grid.tryThis.join(' ');
    assert.match(t, /50%: PLATE I reads 26%[\s\S]*75%: it reads about 59%/);
    assert.match(t, /Slide below 15%: GRID reads CUT OFF and PLATE I reads 0%/);
    // The GRID V fader is continuous (no step): a displayed "75%" spans
    // 0.745–0.755 → 59–60%, hence "about"; a displayed "15%" can be 0.150–0.154
    // (PARTIAL), so the guide says BELOW 15% — a displayed 14% is ≤ 0.145.
    assert.equal(pct(grid.plateCurrentFrac(0.745)), '59%');
    assert.equal(pct(grid.plateCurrentFrac(0.7549)), '60%');
    assert.equal(grid.gridState(0.1449), 'CUT OFF');
    assert.equal(grid.gridState(0.154), 'PARTIAL');
    assert.match(MODULES.grid.changes.join(' '), /At 15% and below the tube is cut off/);
    for (const w of [grid.CUTOFF_WORDS, 'partly negative', 'barely negative — full flow']) assert.ok(MODULES.grid.control.join(' ').includes(w), w);
  });
  it('WARM-UP: 50% → step 3, 0%; 85% → step 5, 50%; PLATE I starts above 70%', () => {
    const body = fnBlock(LAB_SRC, 'FlowSection');
    assert.match(body, /const current = heat > 0\.7 \? \(heat - 0\.7\) \/ 0\.3 : 0;/);
    assert.match(body, /const stage = FLOW_STAGES\.find\(\(s\) => heat < s\.until\) \?\? FLOW_STAGES\[4\];/);
    const untils = [...LAB_SRC.matchAll(/\{ until: ([\d.]+), text: '(\d) · /g)].map((m) => [Number(m[1]), m[2]] as const);
    assert.deepEqual(untils.map((u) => u[0]), [0.15, 0.35, 0.7, 0.85, 1.01]);
    const stageAt = (h: number) => untils.findIndex(([u]) => h < u) + 1;
    const plate = (h: number) => (h > 0.7 ? (h - 0.7) / 0.3 : 0);
    assert.equal(stageAt(0.5), 3);
    assert.equal(pct(plate(0.5)), '0%');
    assert.equal(stageAt(0.85), 5);
    assert.equal(pct(plate(0.85)), '50%');
    assert.equal(pct(plate(1)), '100%');
    assert.match(LAB_SRC, /text: '5 · Steady current flows/);
    assert.match(LAB_SRC, /text: '1 · Cold:/);
    assert.match(LAB_SRC, /v < 0\.15 \? 'cold' : v < 0\.7 \? 'warming…' : 'conducting'/);
    const t = MODULES.flow.tryThis.join(' ');
    assert.match(t, /50%: STAGE shows step 3 and PLATE I stays 0%/);
    assert.match(t, /Push WARM-UP past 85%: the line reaches 5 · Steady current and PLATE I passes 50%\. At 100%, PLATE I reads 100%/);
    // The WARM-UP fader is continuous: a displayed "85%" can be 0.846 (stage 4,
    // PLATE I 49%), so the guide says PAST 85% — a displayed 86% is ≥ 0.855.
    assert.equal(stageAt(0.846), 4);
    assert.equal(pct(plate(0.846)), '49%');
    assert.equal(stageAt(0.855), 5);
    assert.ok(plate(0.855) > 0.5);
  });
  it('INSIDE: CONTROL GRID hidden → WIDE OPEN; GLASS hidden → VACUUM goes too, EMISSION ON, CURRENT NONE', () => {
    const body = fnBlock(LAB_SRC, 'InsideSection');
    assert.match(body, /if \(key === 'envelope' && has\) next = next\.filter\(\(x\) => x !== 'vacuum'\);/);
    assert.match(body, /const emitting = visible\.includes\('heater'\) && visible\.includes\('cathode'\);/);
    assert.match(body, /const airInside = !visible\.includes\('envelope'\) \|\| !visible\.includes\('vacuum'\);/);
    assert.match(body, /const flowing = emitting && !airInside && visible\.includes\('plate'\);/);
    assert.match(body, /const current = !flowing \? 'NONE' : visible\.includes\('grid'\) \? 'METERED' : 'WIDE OPEN';/);
    assert.match(body, /setVisible\(allOn \? \['envelope'\] : ALL_PART_KEYS\)/);
    // Re-run the screen's own rules.
    const ALL_P = ['envelope', 'vacuum', 'heater', 'cathode', 'plate', 'grid', 'screen', 'suppressor'];
    const state = (vis: string[]) => {
      const em = vis.includes('heater') && vis.includes('cathode');
      const air = !vis.includes('envelope') || !vis.includes('vacuum');
      const fl = em && !air && vis.includes('plate');
      return { emission: em ? 'ON' : 'OFF', current: !fl ? 'NONE' : vis.includes('grid') ? 'METERED' : 'WIDE OPEN' };
    };
    assert.deepEqual(state(ALL_P), { emission: 'ON', current: 'METERED' });
    assert.deepEqual(state(ALL_P.filter((p) => p !== 'grid')), { emission: 'ON', current: 'WIDE OPEN' });
    assert.deepEqual(state(ALL_P.filter((p) => p !== 'envelope' && p !== 'vacuum')), { emission: 'ON', current: 'NONE' });
    assert.deepEqual(state(ALL_P.filter((p) => p !== 'heater')), { emission: 'OFF', current: 'NONE' });
    const t = MODULES.inside.tryThis.join(' ');
    assert.match(t, /Tap CONTROL GRID: CURRENT jumps from METERED to WIDE OPEN/);
    assert.match(t, /Tap GLASS: VACUUM goes dark with it\. EMISSION stays ON, but CURRENT reads NONE/);
    // After those two taps the toggle reads SHOW ALL (it reads HIDE ALL only with every part showing).
    assert.match(body, /const allOn = visible\.length === ALL_PART_KEYS\.length;/);
    assert.match(t, /Tap SHOW ALL if it shows, then HIDE ALL/);
    // Electrons are drawn only in ⚡ E-VIEW (off at the start), so the guide says so.
    const viz = read('src/screens/lab/tube/viz.tsx');
    assert.match(viz, /if \(!electronView \|\| !emitting\) return p;/);
    assert.match(LAB_SRC, /const \[electron, setElectron\] = useState\(false\);/);
    assert.match(MODULES.inside.changes.join(' '), /the readouts — and, in ⚡ E-VIEW, the electrons — show what it was for/);
  });
  it('BIAS: below 22% CUTOFF, above 80% SATURATION, 50% LINEAR', () => {
    const body = fnBlock(LAB_SRC, 'BiasSection');
    assert.match(body, /v: b < 0\.22 \? 'CUTOFF' : b > 0\.8 \? 'SATURATION' : 'LINEAR'/);
    assert.match(body, /const \[b, setB\] = useState\(0\.5\);/);
    assert.match(body, /x < 0\.22 \? 'too negative' : x > 0\.8 \? 'too positive' : 'correct'/);
    assert.match(MODULES.bias.changes.join(' '), /Below 22%[\s\S]*CUTOFF[\s\S]*Above 80%[\s\S]*SATURATION/);
    assert.match(MODULES.bias.tryThis.join(' '), /50%: ZONE reads LINEAR/);
  });
  it('DRIVE: starts at 20% CLEAN, WARMING from 30%, SATURATED from 70%', () => {
    const body = fnBlock(LAB_SRC, 'SaturationSection');
    assert.match(body, /const \[drive, setDrive\] = useState\(0\.2\);/);
    assert.match(body, /const state = drive < 0\.3 \? 'CLEAN' : drive < 0\.7 \? 'WARMING' : 'SATURATED';/);
    const t = MODULES.sat.tryThis.join(' ');
    assert.match(t, /start \(20%\) STATE reads CLEAN/);
    assert.match(t, /Slide past 30%: STATE reads WARMING/);
    assert.match(t, /Push past 70%: STATE reads SATURATED/);
    assert.doesNotMatch(t, /or more/, 'a displayed 30% can still be 0.295 = CLEAN');
  });
  it('HIGH V: B+ reads STRONG and DENSE; AMPLIFY: GAIN ~×7, inverted', () => {
    const hv = fnBlock(LAB_SRC, 'HighVoltSection');
    assert.match(hv, /v: highB \? 'STRONG' : 'WEAK'/);
    assert.match(hv, /v: highB \? 'DENSE' : 'SPARSE'/);
    assert.match(MODULES.highv.tryThis.join(' '), /HIGH-VOLTAGE SUPPLY \(B\+\): PULL reads STRONG and STREAM reads DENSE/);
    const viz = read('src/screens/lab/tube/viz.tsx');
    assert.match(viz, /const yi = mid - 8 \* Math\.sin\(th\);/);
    assert.match(viz, /const yo = mid \+ 52 \* Math\.sin\(th\);/);
    // 52 / 8 = 6.5 — "about seven times taller"; opposite signs = inverted.
    assert.match(MODULES.amplify.seeing.join(' '), /about seven times taller/);
    assert.match(MODULES.amplify.tryThis.join(' '), /where the input is up, the output is down/);
  });
  it('REFERENCE: ECC83 finds only the 12AX7; rectifier finds only RECTIFIERS; octal finds every octal tube', () => {
    const refs = read('src/screens/lab/tube/tubeRefs.ts');
    assert.match(refs, /return TUBE_REFS\.filter\(\(r\) =>\s*\[r\.short, r\.name, r\.base, r\.role, \.\.\.r\.alt\]\.some\(\(s\) => s\.toLowerCase\(\)\.includes\(q\)\),\s*\);/);
    const rows = [...refs.matchAll(/t\((\d+), '([^']+)', '([^']+)', \[([^\]]*)\], '(\w+)', '([^']+)', '([^']+)', '[^']+'\)/g)].map((m) => ({
      short: m[2], name: m[3], alt: [...m[4].matchAll(/'([^']+)'/g)].map((a) => a[1]), family: m[5], base: m[6], role: m[7],
    }));
    assert.equal(rows.length, 40);
    const search = (q: string) => rows.filter((r) => [r.short, r.name, r.base, r.role, ...r.alt].some((s) => s.toLowerCase().includes(q.toLowerCase())));
    assert.deepEqual(search('ECC83').map((r) => r.short), ['12AX7']);
    const rect = search('rectifier');
    assert.ok(rect.length > 0 && rect.every((r) => r.family === 'rectifier'));
    assert.equal(rect.length, rows.filter((r) => r.family === 'rectifier').length);
    const oct = search('octal');
    assert.ok(oct.length > 0 && oct.every((r) => /Octal \(8-pin\)/.test(r.base)));
    assert.equal(oct.length, rows.filter((r) => /Octal/.test(r.base)).length);
    // 12AX7 = ECC83 = 7025.
    assert.match(refs, /t\(1, '12AX7', '12AX7 \/ ECC83', \['ECC83', '7025'\]/);
    assert.match(REF_SRC, /placeholder="Search — 12AX7, ECC83, GZ34, octal…"/);
  });
  it('CARD: swipe left = next sheet; double-tap toggles zoom; up to 4×; two pages', () => {
    assert.match(CARD_SRC, /const MAX_SCALE = 4;/);
    assert.match(CARD_SRC, /if \(g\.dx <= -threshold\) committed = goSheetRef\.current\(1\);/);
    assert.match(read(CARD), /\/\/ Double-tap toggles zoom\./);
    assert.match(read('src/screens/lab/tube/tubeRefs.ts'), /export const TUBE_PAGES = 2 as const;/);
    assert.match(MODULES.inside.seeing.join(' ') + textOf(G.TUBE_CARD_GUIDE as unknown as Guide), /up to 4×/);
    assert.match(G.TUBE_CARD_GUIDE.tryThis.join(' '), /Tap PAGE 2, then swipe left: the next tube opens on its page 1/);
  });
});

describe('4b. review round 2026-10-31 — what the screen really shows', () => {
  it('TYPES: red secondaries are drawn only in ⚡ E-VIEW, so TRY THIS turns it on first', () => {
    const viz = read('src/screens/lab/tube/viz.tsx');
    assert.match(viz, /const demo = showSecondary && hasScreen;/);
    assert.match(viz, /if \(electronView && emitting && \(demo \|\| auto\)\) \{/);
    assert.match(fnBlock(LAB_SRC, 'TypesSection'), /highlight=\{t\.newPart\} electron=\{p\.electron\}/);
    const t = MODULES.types.tryThis;
    assert.match(t[0], /^Turn on ⚡ E-VIEW, then step from TRIODE to TETRODE: red dots appear/);
    assert.match(t[2], /Turn ⚡ E-VIEW off/);
    assert.match(MODULES.types.seeing.join(' '), /in ⚡ E-VIEW, red dots are secondary electrons/);
    // The newest-grid glow (hl) is not gated on the view.
    assert.doesNotMatch(viz, /electronView && hl\(|hl\([^)]*\) && electronView/);
  });
  it('SAT: harmonics defined where first used, as multiples of the note’s frequency', () => {
    assert.match(MODULES.sat.changes.join(' '), /harmonics — extra tones at whole-number multiples of the note’s frequency/);
    assert.doesNotMatch(textOf(MODULES.sat), /note’s pitch/);
  });
  it('REFERENCE: “family” alternates are not called the same tube; no membership line for members', () => {
    const refs = read('src/screens/lab/tube/tubeRefs.ts');
    for (const f of ["['12AX7 family']", "['EL34 upgrade']", "['6L6 family']", "['5687 family']"]) assert.ok(refs.includes(f), f);
    const g = textOf(G.TUBE_REFERENCE_GUIDE as unknown as Guide);
    assert.match(g, /a “family” tube is a close relative, not always a direct swap/);
    assert.doesNotMatch(g, /equivalents \(other names for the same tube\)/);
    assert.match(g, /by job or construction/);
    assert.doesNotMatch(g, /ACADEMY|membership/i);
    assert.match(REF_SRC, /if \(!unlocked\) \{/);
  });
});

describe('5. wiring and the accuracy-chip decisions', () => {
  it('the lab: guides imported; host wraps the root content (regions off on the end screen); key via LabHeader guide', () => {
    assert.match(LAB_SRC, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(LAB_SRC, /import \{ TUBE_END_GUIDE, TUBE_SCREEN_GUIDES, type TubeSectionId \} from '\.\/tubeScreenGuides';/);
    assert.match(LAB_SRC, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost resetKey=\{ending \? 'end' : s\.key\} regions=\{!ending\}>\s*<LabHeader/);
    assert.match(LAB_SRC, /guide=\{ending \? TUBE_END_GUIDE : TUBE_SCREEN_GUIDES\[s\.key\]\}\s*guideTitle=\{ending \? 'WHAT’S LEFT' : s\.title\}/);
    assert.match(LAB_SRC, /onClose=\{\(\) => setLessonOpen\(false\)\}\s*\/>\s*<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    assert.match(LAB_SRC, /key: TubeSectionId; label: string;/);
  });
  it('chip decision — the lab: a CONCEPT lab, no AccuracyNote; its honesty badges and lethal-voltage lines stay on the screens', () => {
    assert.doesNotMatch(LAB_SRC, /AccuracyNote/);
    assert.match(LAB_SRC, /badge: 'ILLUSTRATIVE MODEL — SCHEMATIC CROSS-SECTION, NOT MEASURED TUBE DATA'/);
    assert.match(LAB_SRC, /it is enough to kill/);
    assert.match(LAB_SRC, /inside an energized chassis at lethal voltage, by a qualified technician/);
    assert.match(MODULES.highv.teaches.join(' '), /can kill, even after the amp is unplugged/);
    assert.match(MODULES.bias.teaches.join(' '), /lethal voltage, by a qualified technician/);
    assert.doesNotMatch(LAB_SRC, /useMic|getUserMedia|startFenced|expo-audio/, 'a live input would earn the chip back');
  });
  it('chip decision — Tube Reference list and card: real data-sheet ratings, so the chip STAYS and the ⓘ sits beside it', () => {
    assert.match(REF_SRC, /<ScreenGuideHost regions=\{false\} resetKey="tubeRef">\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.header\}>/);
    assert.match(REF_SRC, /<AccuracyNote compact detail="These cards are a STUDY REFERENCE[^"]*" \/>\s*<ScreenGuideKey title="TUBE REFERENCE" guide=\{TUBE_REFERENCE_GUIDE\} \/>\s*<\/View>\s*<\/ScreenGuideHintAnchor>/);
    assert.match(REF_SRC, /<\/ScrollView>\s*<\/ScreenGuideHost>\s*<\/View>/);
    assert.match(CARD_SRC, /<ScreenGuideHost regions=\{false\} resetKey="tubeCard">\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.navBar\}>/);
    assert.match(CARD_SRC, /<AccuracyNote compact detail="This card is a STUDY REFERENCE[^"]*" \/>\s*<ScreenGuideKey title="TUBE REFERENCE CARD" guide=\{TUBE_CARD_GUIDE\} \/>\s*<Pressable/);
    assert.match(CARD_SRC, /<\/View>\s*<\/ScreenGuideHintAnchor>\s*<View style=\{styles\.pageRow\}>/);
    assert.match(CARD_SRC, /\) : null\}\s*<\/View>\s*<\/ScreenGuideHost>\s*<\/View>\s*\);\s*\}/);
  });
});
