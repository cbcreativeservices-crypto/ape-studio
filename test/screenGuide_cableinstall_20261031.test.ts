/**
 * Screen Guide roll-out — Cable Dressing & Installation (owner 2026-10-31) —
 * receipts. The Wave Physics pilot (test/screenGuide_20261031.test.ts) is the
 * standard; this lab follows it.
 *
 *   1. every screen the learner reaches — the intro, the 13 stages (CiModuleId),
 *      the Rule-or-Myth card, the end screen and the field check — has a guide
 *      with all five sections, 1–5 bullets each, 2–3 TRY THIS experiments,
 *      every step inside its no-scroll budget, in the house copy rules;
 *   2. each guide quotes the screen's REAL names — every one pinned here is in
 *      both the guide and the lab's source (comments stripped);
 *   3. the numbers quoted in TRY THIS are what the screen prints: route scores
 *      recomputed with rankRoutes, bend readouts / exposure bands / spans /
 *      twist from the scenes' own constants;
 *   4. wiring: CableInstallLabScreen passes the per-screen guide to LabHeader
 *      and wraps its root content in ScreenGuideHost (regions on the Rack Unit
 *      stage only); the resetKey follows the screen;
 *   5. the chip decision: a CONCEPT / decision lab — no live mic and no
 *      real-world measurement readouts (its numbers are scenario-supplied
 *      specs) — so the AccuracyNote is gone from every file of the lab.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

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

const DIR = 'src/screens/lab/cableinstall';
const { CI_MODULES } = await import('../src/screens/lab/cableinstall/registry.ts');
const G = await import('../src/screens/lab/cableinstall/cableInstallScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { rankRoutes } = await import('../src/screens/lab/cableinstall/engine/routeEval.ts');
const S = await import('../src/screens/lab/cableinstall/data/scenarios.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const allGuides: [string, Guide][] = [
  ['home', G.CI_HOME_GUIDE as unknown as Guide],
  ...Object.entries(G.CI_SCREEN_GUIDES as unknown as Record<string, Guide>),
  ['myth', G.CI_MYTH_GUIDE as unknown as Guide],
  ['complete', G.CI_COMPLETE_GUIDE as unknown as Guide],
  ['fieldCheck', G.CI_FIELD_CHECK_GUIDE as unknown as Guide],
];
const guideOf = (id: string) => (allGuides.find(([k]) => k === id) ?? [id, null])[1] as Guide;
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

describe('1. every Cable Install screen has a complete guide', () => {
  it('every CiModuleId has a guide — and no guide is for a stage that does not exist', () => {
    const ids = CI_MODULES.map((m: { id: string }) => m.id).sort();
    assert.equal(ids.length, 13, '12 stages + the final inspection');
    assert.deepEqual(Object.keys(G.CI_SCREEN_GUIDES).sort(), ids);
  });
  it('ciScreenGuide resolves every screen key', () => {
    for (const k of ['home', 'myth', 'complete', 'fieldCheck', ...CI_MODULES.map((m: { id: string }) => m.id)]) {
      assert.ok(G.ciScreenGuide(k), k);
    }
    assert.equal(G.ciScreenGuide('home'), G.CI_HOME_GUIDE);
    assert.equal(G.ciScreenGuide('fire'), G.CI_SCREEN_GUIDES.fire);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 experiments`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro && intro.learning.trim().length > 10 && intro.start.trim().length > 10, `${id}: the intro card (learning + start)`);
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('every step fits its no-scroll budget, on every screen', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
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
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no brands', () => {
    for (const [id, gd] of allGuides) {
      // The end screen's card is headed KNOWLEDGE PROFILE (renamed from
      // MASTERY PROFILE, D42), so no exemption is needed any more.
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      // The scenario data names one audio-network product; the guide never does.
      assert.doesNotMatch(t, /\bDante\b/, `${id}: a product name`);
    }
  });
  it('audit 2026-10-31: no off-screen job loop, no "never tested", no scored wrong call steered by TRY THIS', () => {
    const home = textOf(guideOf('home'));
    assert.doesNotMatch(home, /TERMINATE|PLAN → ROUTE/, 'the PLAN → … → INSPECT loop is a code comment, not on screen');
    for (const m of CI_MODULES as { tag: string }[]) {
      const word = m.tag.split(' · ')[1];
      assert.ok(home.includes(word), `home: stage tag word ${word}`);
    }
    assert.doesNotMatch(textOf(guideOf('know')), /never tested/);
    // TRY THIS never tells the learner to make a call that locks or costs score.
    const steer: [string, RegExp][] = [
      ['why', /Approve [AD]\b/],
      ['know', /call it PERMANENT/],
      ['route', /pick Across the hallway floor/],
      ['supports', /J-hook at P3 \(6u\) and tap CHECK SPACING/],
      ['rack', /dress AC POWER into the left|pick FORCE IT/],
      // Decision 6 (2026-11-08): the scored scenario-2 answer is never named before the pick.
      ['walls', /pick Wedge|pick Wrap|Verify the assembly before penetrating/],
      ['ceiling', /U6 and tap CHECK SPACING/],
      ['floor', /pick the center aisle|OVER LOOP three times/],
      ['fire', /answer A plenum|choose Yes/],
      ['label', /set ORIGIN — STAGE END to R1-PP2-12/],
    ];
    for (const [id, re] of steer) assert.doesNotMatch(guideOf(id).tryThis.join('\n'), re, `${id}: TRY THIS steers a scored wrong call`);
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const files = [
    ...readdirSync(join(ROOT, DIR)).filter((f) => /\.tsx?$/.test(f) && f !== 'cableInstallScreenGuides.ts').map((f) => `${DIR}/${f}`),
    ...readdirSync(join(ROOT, DIR, 'scenes')).map((f) => `${DIR}/scenes/${f}`),
    ...readdirSync(join(ROOT, DIR, 'data')).map((f) => `${DIR}/data/${f}`),
    ...readdirSync(join(ROOT, DIR, 'engine')).map((f) => `${DIR}/engine/${f}`),
    // shared kit the lab draws on screen
    'src/screens/lab/kit/labNav.ts',
    'src/screens/lab/kit/ExpandableFigure.tsx',
    'src/screens/lab/rack/RackUnit.tsx',
  ];
  const SRC = files.map(code).join('\n');
  const NAMES: Record<string, string[]> = {
    home: ['START LAB', 'RESUME — MODULE', 'WHAT YOU’LL LEARN', 'SOURCES / STANDARDS ›', '‹ PREV', 'NEXT ›', "WHAT'S LEFT", 'RULE OR MYTH?', 'CODE / REGULATION', 'INDUSTRY STANDARD', 'MANUFACTURER REQUIREMENT', 'PROFESSIONAL PRACTICE'],
    why: ['MARK STAGE COMPLETE ✓', 'SIX THINGS RIDING ON EVERY RUN', 'SAFETY', 'RELIABILITY', 'SIGNAL INTEGRITY', 'SERVICEABILITY', 'MECHANICAL PROTECTION', 'PROFESSIONAL WORKMANSHIP', 'WHICH INSTALLATION WOULD YOU APPROVE?', 'A — THE SHOWPIECE', 'B — THE PROFESSIONAL', 'C — THE PILE', 'D — THE BLOCKADE', 'NEAT ≠ CORRECT', '▸ WHY?', 'FULL SCREEN', 'APPROVE'],
    know: ['THE CABLE WORKBENCH', 'PERMANENT', 'TEMPORARY', 'PERM · TEMP', 'SECTION', 'CHECK BEFORE ROUTING', 'SCENARIO DRILL — WHAT ARE YOU INSTALLING?', '1 · WHAT CABLE IS THIS?', '2 · TEMPORARY OR PERMANENT?', '3 · THE LIKELY PATHWAY?', '4 · THE KEY RISK?', 'THEN THE PAPERWORK', 'Microphone cable', 'Fiber-optic cable'],
    route: ['Scale: 20 units = 1 m · person 1.75 m', 'CABLE: ', 'FINISHED', 'X-RAY', 'WHICH ROUTE DO YOU PULL?', 'PULL ', 'THE VERDICT — ALL THREE ROUTES, SCORED', '✕ REJECTED — SAFETY', 'Across the hallway floor', '×1.0', '/100', '▸ WHY?'],
    mech: ['A · BEND RADIUS', 'SIMULATED SPEC', 'B · PULLING', 'C · RESTRAINT', 'LOOSE', 'SECURE', 'EXCESSIVE', 'BEND TIGHTNESS', '− EASE', '+ TIGHTEN', 'CHECK BEND', 'MEETS SPEC ✓', 'Steady smooth pull', 'Pull harder through the snag', 'Hard yank around the corner', 'Pull it through by the connector', 'STRAP TENSION', 'SET LOOSE', 'SET SECURE', 'SET EXCESSIVE'],
    supports: ['A · FOUR JOBS', 'SUPPORT', 'PATHWAY', 'PROTECTION', 'MANAGEMENT', 'B · THE SORT', 'C · SUPPORT SPACING', 'MAX SAG ½ UNIT', 'APPROVE', 'REJECT', 'NEXT ITEM ›', 'FINISH SORT ›', 'RETRY THE SORT', 'RUN THE SORT AGAIN', 'CHECK SPACING'],
    rack: ['RACK', 'PHASE A — INSPECT', 'PHASE B — DRESS', 'PHASE C — SERVICE', 'PHASE D — MAINTAIN', 'FIX', '▸ SUSPECT LIST', 'RACK CONDEMNED — NOW DRESS IT RIGHT ›', 'DSP INPUT 7', 'REPLACE THIS CABLE ✓', 'STRIP THE RACK', 'CUT THE DRESSING', 'USE THE DRESSING', 'FORCE IT', 'A-007', 'THE SAME JOB, BEFORE'],
    walls: ['ROOM', 'X-RAY WALL VIEW', '1 · SURFACE RACEWAY', '2 · WALL PENETRATION', '3 · THE DOORWAY', '4 · SHARP EDGE', 'NEXT WALL ›', 'TEMPORARY', 'PERMANENT', 'Wedge the door open for the event', 'Wrap the edge in tape and move on', 'Install a bushing / grommet on the opening'],
    ceiling: ['CEILING', 'ABOVE CEILING · AS FOUND', 'FINISHED VIEW', 'EXERCISE 1 · FIND THE PROBLEMS', 'EXERCISE 2 · INSTALL THE ROUTE', 'SUSPECT LIST', 'CONTINUE TO THE INSTALL ›', '1 · PICK THE PATHWAY / SUPPORT', '2 · PLACE J-HOOKS ON THE 12-UNIT SPAN', 'CHECK SPACING', 'CONFIRM THE ROUTE ✓'],
    floor: ['STAGE CRAFT — CLEAN UP THE DECK', 'STAGE PLAN', 'THE FOH RUN', 'BACKSTAGE', 'OVERALL', 'STRIKE — COIL THE SNAKE OVER-UNDER', 'TWIST', 'SHOW THE PROFESSIONAL WAY', 'OVER LOOP', 'UNDER LOOP', 'RESTART THE COIL', 'NONE — loops cancel', 'LOW', 'BUILDING', 'HIGH — will fight deployment', '✕ REJECTED — SAFETY'],
    emi: ['THE CONCEPT FIELD', 'EXPOSURE', 'LOW', 'MODERATE', 'HIGH', 'BALANCED', 'UNBALANCED', 'CLOSE', 'MID', 'FAR', 'THE REAL LEVERS — NOT A MAGIC NUMBER', 'THE CROSSING — POWER ROUTE MEETS SIGNAL ROUTE', 'AC FEEDER', 'TRANSFORMER', 'MOTOR', 'DIMMER RACK', 'NETWORK CABLE', 'DISTANCE', '◂ CLOSER', 'FARTHER ▸', 'BALANCED PAIR', 'LEVEL', 'SHIELDING', 'CURRENT', 'GEOMETRY', 'GROUNDING'],
    fire: ['1 · IDENTIFY EACH SPACE', '2 · ONE RATED-WALL PENETRATION', 'READING THE SECTION', 'DUCTED CAVITY', 'OPEN-RETURN CAVITY', 'RISER', 'A plenum — every ceiling cavity is one', 'Yes — the label says fire rated', 'FULL SCREEN', '▸ WHY?'],
    label: ['SYSTEM', 'A · SERVICE CALL', 'B · ASSIGN IDENTITY', 'C · TRACE TEST', 'D · SERVICE LOOPS', 'THE OTHER HALF OF IDENTITY — THE RECORDS', 'A-012', 'CABLE ', 'ORIGIN — STAGE END', 'DESTINATION — RACK END', 'CABLE ID', 'APPLY LABELS — BOTH ENDS', 'STORED SLACK', 'TOO LITTLE', 'INTENTIONAL', 'EXCESSIVE', 'CONFIRM STORED SLACK', 'R1-PP2-12', 'PB-3'],
    inspect: ['FACILITY WALK', 'STAGE', 'FLOOR', 'WALL / DOOR', 'RACK', 'CEILING / TRAY', 'EQUIP ROOM', 'KNOWLEDGE CHECK', '1 · CLASSIFY', '2 · CORRECT', '▸ FINDINGS LIST', 'Fire / Building', 'Serviceability', 'SIGN OFF THE INSPECTION ✓', 'FINAL INSPECTION COMPLETE', 'AS FOUND ON THE WALK', 'NEW INSPECTION ATTEMPT ↻'],
    myth: ['RULE OR MYTH?', 'TRUE', 'FALSE', '✓ Right', '✕ It’s', 'CONTINUE ›', 'NEXT ›'],
    complete: ['KNOWLEDGE PROFILE · OVERALL', 'CABLE DRESSING & INSTALLATION — ', 'COMPLETE', 'WHAT IS LEFT', 'OVERALL', 'Safety', 'Cable Protection', 'Routing & Support', 'VIEW FIELD CHECK', 'REVIEW RESULTS', 'REPEAT LAB', 'RETURN TO TRAINING', 'STAGE', 'CREDITED'],
    fieldCheck: ['CABLE INSTALLATION FIELD CHECK', 'BEFORE PULLING', 'DURING INSTALLATION', 'DRESSING', 'FINISH', '‹ RETURN TO RESULTS', 'records must match reality'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([k]) => k).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(guideOf(id));
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
});

describe('3. every TRY THIS number is one the screen prints', () => {
  const tryOf = (id: string) => guideOf(id).tryThis.join('\n');
  const scoreOf = (scn: { options: unknown[] }, name: string) => {
    const r = rankRoutes(scn.options as never).find((x: { option: { name: string } }) => x.option.name.includes(name));
    assert.ok(r, name);
    return r as { overall: number; safetyReject: boolean };
  };
  it('Stage 3 routes: hallway floor 62/100 LAST + rejected; over the grid 63; duct 78 + rejected', () => {
    const [stage, amp] = S.CI_ROUTE_SCENARIOS;
    const ranked = rankRoutes(stage.options);
    const floor = scoreOf(stage, 'Across the hallway floor');
    assert.equal(floor.overall, 62);
    assert.equal(floor.safetyReject, true);
    assert.equal(ranked[ranked.length - 1].option.name, 'Across the hallway floor', 'it finishes LAST');
    assert.equal(stage.options.find((o: { name: string }) => o.name === 'Across the hallway floor').relLength, 1);
    assert.equal(scoreOf(amp, 'draped over the ceiling grid').overall, 63);
    const duct = scoreOf(amp, 'main supply duct');
    assert.equal(duct.overall, 78);
    assert.equal(duct.safetyReject, true);
    for (const s of ['LAST at 62/100', '63/100', '78/100']) assert.ok(tryOf('route').includes(s), s);
    // the screen's own lesson card says it the same way
    assert.match(code(`${DIR}/scenes/RouteScene.tsx`), /`LAST at \$\{shortOverall\}\/100`/);
  });
  it('Stage 9 routes: center aisle OVERALL 75 + rejected; doormat 77 + rejected; vehicle-rated protector 100', () => {
    const [foh, back] = S.CI_FLOOR_SCENARIOS;
    const aisle = scoreOf(foh, 'center aisle');
    assert.equal(aisle.overall, 75);
    assert.equal(aisle.safetyReject, true);
    const mat = scoreOf(back, 'doormat');
    assert.equal(mat.overall, 77);
    assert.equal(mat.safetyReject, true);
    assert.equal(scoreOf(back, 'Vehicle-rated protector').overall, 100);
    for (const s of ['OVERALL 75', 'OVERALL 77', 'OVERALL 100']) assert.ok(tryOf('floor').includes(s), s);
    assert.match(code(`${DIR}/scenes/FloorScene.tsx`), /`OVERALL \$\{overall\}`/);
  });
  it('Stage 4 bend: coax after five − EASE taps ≈ 9.5× (< 10×), after six ≈ 11× (passes)', () => {
    const m = code(`${DIR}/scenes/MechScene.tsx`);
    assert.match(m, /const R_MAX_DIA = 20;/);
    assert.match(m, /const R_MIN_DIA = 1;/);
    assert.match(m, /const START_T = 0\.95;/);
    assert.match(m, /onPress=\{\(\) => nudge\(-0\.08\)\}/);
    assert.match(m, /const fmtDia = \(d: number\) => \(d >= 10 \? String\(Math\.round\(d\)\) : d\.toFixed\(1\)\);/);
    const dia = (t: number) => 20 - t * 19;
    const fmt = (d: number) => (d >= 10 ? String(Math.round(d)) : d.toFixed(1));
    let t = 0.95;
    assert.ok(Math.abs(dia(t) - 2) < 0.1, 'starts about 2 diameters');
    for (let i = 0; i < 5; i++) t = Math.max(0, Math.min(1, t - 0.08));
    assert.ok(['9.5', '9.6'].includes(fmt(dia(t))) && dia(t) < 10, `five taps: ${fmt(dia(t))}`);
    t = Math.max(0, Math.min(1, t - 0.08));
    assert.equal(fmt(dia(t)), '11');
    assert.ok(dia(t) >= 10);
    assert.equal(S.CI_BEND_EXERCISES.find((e: { cable: string }) => e.cable === 'coax').minRadiusDia, 10);
    assert.ok(tryOf('mech').includes('about 9.5×') && tryOf('mech').includes('about 11×'));
    // pulls quoted in the guide
    const ev = Object.fromEntries(S.CI_PULL_SPEC.events.map((e: { id: string; tension: number }) => [e.id, e.tension]));
    assert.deepEqual([ev.snag, ev.corner, ev.connector, S.CI_PULL_SPEC.maxTension], [140, 120, 80, 100]);
  });
  it('Stage 5 spacing: one hook at 6 fails on a 6-unit span; 4 + 8 exact; 2, 6, 10 passes the maximum', () => {
    const sc = code(`${DIR}/scenes/SupportsScene.tsx`);
    assert.match(sc, /const POS_UNITS = \[2, 4, 6, 8, 10\] as const;/);
    assert.match(sc, /const SPEC_EVERY = 4;/);
    const maxGap = (u: number[]) => {
      const a = [0, ...u, 12];
      return Math.max(...a.slice(1).map((b, i) => b - a[i]));
    };
    assert.equal(maxGap([6]), 6);
    assert.equal(maxGap([4, 8]), 4);
    assert.equal(maxGap([2, 6, 10]), 4);
    // The drawn dip: a 4-unit span sags exactly TO the MAX SAG ½ UNIT line (not
    // level); 6- and 8-unit spans hit the drawing's cap, past the line.
    assert.match(sc, /const depthPx = span > 0 \? Math\.min\(27, SAG_LIMIT_UNITS \* Math\.pow\(span \/ SPEC_EVERY, 2\) \* UNIT\) : 0;/);
    assert.match(sc, /y1=\{CABLE_Y \+ SAG_LIMIT_UNITS \* UNIT\}/);
    const unitPx = Number(/const UNIT = (\d+(?:\.\d+)?);/.exec(sc)?.[1]);
    const dip = (span: number) => Math.min(27, 0.5 * (span / 4) ** 2 * unitPx);
    assert.equal(dip(4), 0.5 * unitPx, '4-unit span dips just to the line');
    assert.ok(dip(6) > 0.5 * unitPx && dip(6) === dip(8), '6 and 8 both capped, past the line');
    assert.ok(!tryOf('supports').includes('level'));
    assert.match(sc, /P\{i \+ 1\}/);
    assert.ok(tryOf('supports').includes('P3 (6u)') && tryOf('supports').includes('P2 and P4 (4u, 8u)'));
    assert.equal(S.CI_SUPPORT_ITEMS.length, 17);
    assert.equal(Math.ceil(S.CI_SUPPORT_ITEMS.length * 0.8), 14, 'the pass mark quoted');
  });
  it('Stage 8 hooks: U6 alone → widest span 6; U4 + U8 meets the 4-unit spec', () => {
    const c = code(`${DIR}/scenes/CeilingScene.tsx`);
    assert.match(c, /const SPEC_MAX_GAP = 4;/);
    assert.match(c, /const FIND_REQUIRED = 6;/);
    assert.ok(tryOf('ceiling').includes('6 units'));
  });
  it('Stage 9 coil: three OVER loops → HIGH twist', () => {
    const f = code(`${DIR}/scenes/FloorScene.tsx`);
    assert.match(f, /const twist = Math\.abs\(signs\.reduce\(\(a, b\) => a \+ b, 0\)\);/);
    assert.match(f, /onPress=\{\(\) => addLoop\(1\)\}[\s\S]*?OVER LOOP/);
    assert.match(f, /: \{ label: 'HIGH — will fight deployment'/);
    assert.equal(Math.abs(1 + 1 + 1), 3, 'twist ≥ 3 is the HIGH band');
  });
  it('Stage 10 exposure: the bands the guide quotes, from the scene’s own formula', () => {
    const e = code(`${DIR}/scenes/EmiScene.tsx`);
    assert.match(e, /const raw = src\.noise \* \(1 - 0\.85 \* dist\);\s*return balanced \? raw \* 0\.4 : raw;/);
    assert.match(e, /if \(coupled < 0\.22\) return \{ word: 'LOW'/);
    assert.match(e, /if \(coupled < 0\.5\) return \{ word: 'MODERATE'/);
    assert.match(e, /\{ id: 'feeder', label: 'AC FEEDER', noise: 0\.8,/);
    assert.match(e, /\{ id: 'dimmer', label: 'DIMMER RACK', noise: 1,/);
    assert.match(e, /useState\(0\.5\);/);
    assert.match(e, /stepDist\(-0\.25\)/);
    const band = (noise: number, dist: number, bal: boolean) => {
      const c = noise * (1 - 0.85 * dist) * (bal ? 0.4 : 1);
      return c < 0.22 ? 'LOW' : c < 0.5 ? 'MODERATE' : 'HIGH';
    };
    assert.match(e, /const distWord = \(d: number\) => \(d < 0\.33 \? 'CLOSE' : d < 0\.66 \? 'MID' : 'FAR'\);/);
    assert.equal(band(0.8, 0.5, false), 'MODERATE'); // the start
    assert.equal(band(0.8, 0.25, false), 'HIGH'); // ◂ CLOSER once (0.25 reads CLOSE)
    assert.equal(band(0.8, 0.25, true), 'MODERATE'); // + BALANCED PAIR
    assert.ok(tryOf('emi').includes('◂ CLOSER once'));
    assert.equal(band(1, 0.5, false), 'HIGH'); // DIMMER RACK, MID, UNBALANCED
    assert.equal(band(1, 1, false), 'LOW'); // FARTHER ▸ twice
  });
});

describe('4. wiring: the guide key in the header, the host around the screen', () => {
  const SCR = code(`${DIR}/CableInstallLabScreen.tsx`);
  it('LabHeader carries the per-screen guide (and its title)', () => {
    assert.match(SCR, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(SCR, /import \{ ciScreenGuide, type CiScreenKey \} from '\.\/cableInstallScreenGuides';/);
    assert.match(SCR, /<LabHeader title=\{CI_TITLE\.toUpperCase\(\)\} subtitle=\{CI_SUBTITLE\} guide=\{ciScreenGuide\(guideKey\)\} guideTitle=\{guideTitle\} \/>/);
  });
  it('the screen key follows what is shown: myth, intro, field check, end screen, else the stage', () => {
    assert.match(
      SCR,
      /const guideKey: CiScreenKey = myth\s*\? 'myth'\s*: step === INTRO_STEP\s*\? 'home'\s*: step === COMPLETE_STEP\s*\? showFieldCheck\s*\? 'fieldCheck'\s*: 'complete'\s*: mod\s*\? mod\.id\s*: 'home';/,
    );
  });
  it('ScreenGuideHost wraps the root’s whole content; regions only on the Rack Unit stage; reset per screen', () => {
    assert.match(SCR, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{guideKey\} regions=\{rackStage\}>\s*<LabHeader /);
    assert.match(SCR, /<SourceSheet [^\n]*\/>\s*<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    // Stage 11 is the lab's one Rack Unit stage — the regions it registers are real.
    assert.equal(CI_MODULES.filter((m: { rack?: boolean }) => m.rack).map((m: { id: string }) => m.id).join(), 'fire');
    assert.match(code(`${DIR}/scenes/FireScene.tsx`), /<RackUnit/);
  });
});

describe('5. the chip decision: a concept / decision lab drops the AccuracyNote', () => {
  it('no file of the lab renders or imports AccuracyNote', () => {
    const all = [
      ...readdirSync(join(ROOT, DIR)).filter((f) => /\.tsx?$/.test(f)).map((f) => `${DIR}/${f}`),
      ...readdirSync(join(ROOT, DIR, 'scenes')).map((f) => `${DIR}/scenes/${f}`),
    ];
    for (const p of all) assert.doesNotMatch(code(p), /AccuracyNote/, `${p} still carries the chip`);
  });
  it('why: its numbers are scenario-supplied specs, said so on screen — not real-world measurements', () => {
    assert.match(S.CI_PULL_SPEC.specText, /^SIMULATED SPEC/);
    for (const e of S.CI_BEND_EXERCISES) assert.match(e.specText, /^SIMULATED SPEC/);
    assert.match(S.CI_SUPPORT_SPACING_SPEC, /^SIMULATED SUPPORT SYSTEM SPEC/);
    assert.match(code(`${DIR}/scenes/MechScene.tsx`), /Conceptual meter for judgment training — not an engineering pull calculation\./);
    assert.match(code(`${DIR}/scenes/EmiScene.tsx`), /Not measured values\./);
  });
  it('the code / safety boundary stays on the intro (CI_GOVERN_NOTE)', () => {
    assert.match(code(`${DIR}/CableInstallLabScreen.tsx`), /<Text style=\{styles\.governNote\}>\{CI_GOVERN_NOTE\}<\/Text>/);
  });
});
