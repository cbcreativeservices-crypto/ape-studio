/**
 * Screen Guide rollout — the Miking Labs (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot) and the
 * Fundamentals guide tests.
 *
 * The Miking Labs are ONE hub screen and ONE lesson screen serving 128
 * lessons, so their guides are BUILT for the step on screen
 * (src/screens/lab/miking/mikingScreenGuides.ts). These tests prove:
 *
 *   1. every screen a learner reaches has a complete guide — every module of
 *      every lesson (with the step kinds and docks the shared pages draw, and
 *      a family page's unknown step), the Foundations card, the what's-left
 *      screen and the hub for each family — all five sections, 1–5 bullets,
 *      2–3 TRY THIS, each step inside its no-scroll budget, in the house copy
 *      rules;
 *   2. every name a hand-written line quotes is on the screen it describes
 *      (pinned to the source); a note shared by several step copies is true
 *      of EVERY copy, and an engine-only note never lands on a family page;
 *   3. every number in a TRY THIS line is what the screen uses (pinned);
 *   4. the step engine reports the step on screen in its own words, and the
 *      strip label rule is PageSteps' own;
 *   5. wiring: the lesson header and the hub header carry the ⓘ, a
 *      ScreenGuideHost wraps each root, regions only on a Rack Unit step;
 *   6. the accuracy chip: KEPT on the lesson screen (real-world distances and
 *      the owner's one starting-points note), none on the hub menu.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const G = await import('../src/screens/lab/miking/mikingScreenGuides.ts');
const L = await import('../src/screens/lab/miking/data/lessons.ts');
const Reg = await import('../src/screens/lab/miking/data/registry.ts');
const R = await import('../src/screens/lab/miking/engine/restructure.ts');
const { nullAngles: nullAnglesOf } = await import('../src/screens/lab/miking/engine/physics/polar.ts');
const T = await import('../src/screens/lab/miking/engine/model/types.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS: string[] = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const MIKING = 'src/screens/lab/miking';
const LESSON_SCREEN = `${MIKING}/MikingLessonScreen.tsx`;
const HUB_SCREEN = `${MIKING}/MikingHubScreen.tsx`;
const STEPS = `${MIKING}/engine/steps.tsx`;
const COMPOSE = `${MIKING}/engine/compose.tsx`;
const P = (f: string) => `${MIKING}/pages/${f}.tsx`;

/** Every .tsx under the Miking folder (to find every copy of a step title). */
function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(join(ROOT, dir))) {
    const p = `${dir}/${n}`;
    if (statSync(join(ROOT, p)).isDirectory()) out.push(...tsxFiles(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}
const ALL_TSX = tsxFiles(MIKING);
const filesDefining = (title: string) => ALL_TSX.filter((f) => code(f).includes(`title: '${title}'`));

// The steps the shared pages draw, in their own words (each label pinned to
// its page's source in section 2), plus a family page's unknown steps.
const STEP_SAMPLES = [
  G.stepInfoOf({ kind: 'READ', title: 'Start here', layout: 'read' }),
  G.stepInfoOf({ kind: 'LEARN', title: 'What it is', layout: 'read' }),
  G.stepInfoOf({ kind: 'TRY', title: 'The parts', layout: 'rack', rack: { bezel: [{ k: 'PART' }, { k: 'LOOKED AT' }, { k: 'FRONT HEAD' }], params: [{ kind: 'fader', label: 'PART' }, { kind: 'toggle', label: 'SIDE VIEW' }, { kind: 'options', label: 'FRONT HEAD', options: [{ label: 'PORTED' }, { label: 'SOLID' }] }] } }),
  G.stepInfoOf({ kind: 'WATCH', title: 'Starting setups', layout: 'rack', rack: { bezel: [{ k: 'SETUP' }, { k: 'MIC' }, { k: 'DISTANCE' }, { k: 'LOOKED AT' }], params: [{ kind: 'fader', label: 'SETUP' }, { kind: 'options', label: 'SETUPS', options: [{ label: 'ONE MIC · Inside, near the batter head' }, { label: 'TWO MICS · Inside and outside' }, { label: 'CLOSE · LIVE · At the port' }, { label: 'FARTHER BACK · STUDIO · A tunnel' }, { label: 'ANOTHER START · Outside' }] }, { kind: 'toggle', label: 'TOP VIEW' }] } }),
  G.stepInfoOf({ kind: 'WATCH', title: 'Starting setups', layout: 'rack', rack: { bezel: [{ k: 'SETUP' }, { k: 'MIC' }, { k: 'DISTANCE' }, { k: 'LOOKED AT' }], params: [{ kind: 'options', label: 'SETUPS', options: [{ label: 'ONE MIC · A' }, { label: 'TWO MICS · B' }, { label: 'CLOSE · LIVE · C' }] }] } }),
  G.stepInfoOf({ kind: 'LEARN', title: 'What else the mic hears', layout: 'read' }),
  G.stepInfoOf({ kind: 'CHECK', title: 'Before any mic', layout: 'read' }),
  G.stepInfoOf({ kind: 'LEARN', title: 'On the instrument', layout: 'rack', rack: { bezel: [{ k: 'TYPE' }, { k: 'PATTERN' }, { k: 'POWER' }, { k: 'MOUNT' }], params: [{ kind: 'options', label: 'TYPE', options: [{ label: 'Kick dynamic' }, { label: 'Boundary plate' }] }, { kind: 'options', label: 'PATTERN', options: [{ label: 'Cardioid' }, { label: 'Supercardioid' }] }, { kind: 'toggle', label: 'SIDE VIEW' }] } }),
  G.stepInfoOf({ kind: 'COMPARE', title: 'Patterns', layout: 'rack', rack: { bezel: [{ k: 'PATTERN' }, { k: 'AT ANGLE' }, { k: 'PICKUP' }, { k: 'NULL' }], params: [{ kind: 'fader', label: 'SOURCE ANGLE' }, { kind: 'options', label: 'TYPE', options: [{ label: 'Kick dynamic' }] }, { kind: 'options', label: 'PATTERN', options: [{ label: 'Cardioid' }] }] } }),
  G.stepInfoOf({ kind: 'LEARN', title: 'By property, not brand', layout: 'read' }),
  G.stepInfoOf({ kind: 'CHECK', title: 'Check', layout: 'read' }),
  G.stepInfoOf({ kind: 'WATCH', title: 'Worked example', layout: 'rack', rack: { bezel: [{ k: '▸ FROM BATTER HEAD' }, { k: 'OFF LINE' }, { k: 'AIM' }, { k: 'ZONE' }], params: [{ kind: 'fader', label: 'STEP' }, { kind: 'toggle', label: 'SIDE VIEW' }] } }),
  G.stepInfoOf({ kind: 'PLACE', title: 'Place the mic', layout: 'rack', rack: { bezel: [{ k: 'FROM BATTER HEAD' }, { k: 'OFF LINE' }, { k: 'AIM' }, { k: 'ZONE' }], params: [{ kind: 'fader', label: 'POSITION', chooser: { options: [{ label: 'FRONT–BACK' }, { label: 'HEIGHT' }, { label: 'ACROSS' }] } }, { kind: 'fader', label: 'AIM', chooser: { options: [{ label: 'LEFT–RIGHT' }, { label: 'UP–DOWN' }] } }, { kind: 'options', label: 'START', options: Array.from({ length: 5 }, (_, i) => ({ label: `A starting setup with a long descriptive name ${i}` })) }, { kind: 'toggle', label: 'SIDE VIEW' }, { kind: 'group', label: 'SETUP' }, { kind: 'options', label: 'ZONE', options: Array.from({ length: 12 }, (_, i) => ({ label: `Inside the drum, a long zone label ${i}` })) }] } }),
  G.stepInfoOf({ kind: 'LEARN', title: 'How zones work', layout: 'read' }),
  G.stepInfoOf({ kind: 'LIVE', title: 'Aim the rejection', layout: 'rack', rack: { bezel: [{ k: 'OFF AXIS' }, { k: 'PICKUP' }, { k: 'NULL' }, { k: 'REJECTION' }], params: [{ kind: 'fader', label: 'AIM', chooser: { options: [{ label: 'LEFT–RIGHT' }, { label: 'UP–DOWN' }] } }, { kind: 'options', label: 'PATTERN', options: [{ label: 'CARDIOID' }, { label: 'SUPERCARDIOID' }, { label: 'HYPERCARDIOID' }, { label: 'FIGURE-8' }, { label: 'OMNI' }] }, { kind: 'options', label: 'MONITOR', options: [{ label: 'Downstage wedge' }, { label: 'Side fill' }] }, { kind: 'toggle', label: 'LIVE' }, { kind: 'toggle', label: 'TOP VIEW' }] } }),
  G.stepInfoOf({ kind: 'PAIR', title: 'Pair and polarity', layout: 'rack', rack: { bezel: [{ k: 'PATH Δd B−A' }, { k: 'DELAY Δt B−A' }, { k: '1ST NOTCH' }, { k: 'POLARITY' }], params: [{ kind: 'fader', label: 'POSITION', chooser: { options: [{ label: 'FRONT–BACK' }, { label: 'HEIGHT' }, { label: 'ACROSS' }] } }, { kind: 'fader', label: 'AIM' }, { kind: 'toggle', label: 'EDIT MIC B' }, { kind: 'toggle', label: 'MIC B POLARITY +' }, { kind: 'options', label: 'SOURCE', options: [{ label: 'Batter head' }, { label: 'Port' }] }] } }),
  G.stepInfoOf({ kind: 'READ', title: 'Symptoms', layout: 'read' }),
  G.stepInfoOf({ kind: 'PRACTICE', title: 'Set up in order', layout: 'read' }),
  G.stepInfoOf({ kind: 'PRACTICE', title: 'Your setup', layout: 'read' }),
  G.stepInfoOf({ kind: 'PRACTICE', title: 'Mixed review', layout: 'read' }),
  // A family page's own steps: names the guide has never seen.
  G.stepInfoOf({ kind: 'TRY', title: 'Background by energy', layout: 'rack', rack: { bezel: [{ k: 'TOTAL' }, { k: 'BACKGROUND' }, { k: 'GAP' }, { k: 'RESULT' }], params: [{ kind: 'fader', label: 'BACKGROUND' }, { kind: 'options', label: 'WEATHER', options: [{ label: 'CALM' }, { label: 'WINDY' }] }, { kind: 'toggle', label: 'TOP VIEW' }, { kind: 'action', label: 'RESET' }] } }),
  G.stepInfoOf({ kind: 'LEARN', title: 'Two zones', layout: 'rack', rack: { bezel: [], params: [] } }),
  G.stepInfoOf({ kind: 'WATCH', title: 'The venue', layout: 'read' }),
];

// Docks built from REAL lesson data (the reviewer-found cases, 2026-10-31):
// a lesson's own pattern and type menus, exactly as the engine pages list them.
const CP = await import('../src/screens/lab/miking/engine/model/copy.ts');
const MT = await import('../src/screens/lab/miking/data/micTypes.ts');
const ctxPatterns = (id: string) => (CP.copyOf(L.lessonById(id)).context.patterns as { label: string }[]).map((p) => ({ label: p.label }));
const typeLabels = (id: string) => (L.lessonById(id).micTypeIds as string[]).map((t) => ({ label: MT.MIC_TYPES[t].label as string }));
const firstTypePatterns = (id: string) => (MT.micType(L.lessonById(id).micTypeIds[0]).patterns as { label: string }[]).map((p) => ({ label: p.label }));
const liveDock = (id: string) => G.stepInfoOf({ kind: 'LIVE', title: 'Aim the rejection', layout: 'rack', rack: { bezel: [{ k: 'OFF AXIS' }, { k: 'PICKUP' }, { k: 'NULL' }, { k: 'REJECTION' }], params: [{ kind: 'fader', label: 'AIM' }, { kind: 'options', label: 'PATTERN', options: ctxPatterns(id) }, { kind: 'options', label: 'MONITOR', options: [{ label: 'x' }] }, { kind: 'toggle', label: 'LIVE' }] } });
const patternsDock = (id: string) => G.stepInfoOf({ kind: 'COMPARE', title: 'Patterns', layout: 'rack', rack: { bezel: [{ k: 'PATTERN' }, { k: 'AT ANGLE' }, { k: 'PICKUP' }, { k: 'NULL' }], params: [{ kind: 'fader', label: 'SOURCE ANGLE' }, { kind: 'options', label: 'TYPE', options: typeLabels(id) }, { kind: 'options', label: 'PATTERN', options: firstTypePatterns(id) }] } });
const onItDock = (id: string) => G.stepInfoOf({ kind: 'LEARN', title: 'On the instrument', layout: 'rack', rack: { bezel: [{ k: 'TYPE' }, { k: 'PATTERN' }, { k: 'POWER' }, { k: 'MOUNT' }], params: [{ kind: 'options', label: 'TYPE', options: typeLabels(id) }, { kind: 'options', label: 'PATTERN', options: firstTypePatterns(id) }] } });
const REVIEW_DOCKS = [liveDock('B09'), liveDock('B03'), liveDock('M01'), patternsDock('B04'), patternsDock('M01'), onItDock('F12'), onItDock('M01')];

function lessonPages(id: string) {
  const ls = R.restructureLesson(L.lessonById(id));
  return T.PAGE_IDS.map((p: string, i: number) => {
    const c = R.pageOf(ls, p);
    return { page: p, i, title: c.title as string, goal: c.goal as string, prev: i ? (R.pageOf(ls, T.PAGE_IDS[i - 1]).title as string) : null, next: i < T.PAGE_IDS.length - 1 ? (R.pageOf(ls, T.PAGE_IDS[i + 1]).title as string) : null };
  });
}

function checkShape(id: string, gd: Guide, problems: string[]) {
  const keys = Object.keys(gd).sort();
  if (keys.join() !== [...SECTION_KEYS].sort().join()) problems.push(`${id}: sections ${keys}`);
  for (const k of SECTION_KEYS) {
    if (!Array.isArray(gd[k]) || gd[k].length < 1 || gd[k].length > 5) problems.push(`${id}.${k}: ${gd[k]?.length} bullets`);
    for (const line of gd[k] ?? []) if (typeof line !== 'string' || line.trim().length <= 10) problems.push(`${id}.${k}: a blank bullet`);
  }
  if (gd.tryThis.length < 2 || gd.tryThis.length > 3) problems.push(`${id}: TRY THIS ${gd.tryThis.length}`);
  for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
    if (s.place === 'strip') {
      for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) problems.push(`${id}.tryThis (${item.length})`);
      continue;
    }
    const n = gd[s.key].join(' ').length;
    const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
    if (n > cap) problems.push(`${id}.${s.key}: ${n} > ${cap}`);
  }
  const t = textOf(gd);
  if (/\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i.test(t)) problems.push(`${id}: claims a skill`);
  if (/\b\d+\s+of\s+\d+\b/i.test(t)) problems.push(`${id}: an "N of total"`);
  if (/\brecommend/i.test(t)) problems.push(`${id}: "recommend"`);
  if (/\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i.test(t)) problems.push(`${id}: a build note`);
  if (/\b(Shure|Sennheiser|Neumann|AKG|Audio-Technica|Electro-Voice|Rode|Beyerdynamic|DPA|Sony|JBL|QSC|Meyer|d&b|L-Acoustics|Bose|Yamaha|SM58|SM57|Beta 52A|Beta 91A|D112|e 902)\b/.test(t)) problems.push(`${id}: a gear maker/model name`);
  // Lines a 2026-10-31 review refuted from the code (kept out for good).
  if (/condenser needs phantom|\bNOW line\b|answer its checks again|reads NO COMB/i.test(t)) problems.push(`${id}: a reviewer-refuted line`);
  // ("null" alone is a real word here — a pattern's null.)
  if (/\bundefined\b|\[object|\bNaN\b|“”|“null”/.test(t)) problems.push(`${id}: a broken interpolation`);
}

describe('1. every screen a learner reaches has a complete guide', () => {
  it('the registry and the lesson content agree (128 lessons, eight modules each)', () => {
    assert.equal(Reg.LESSONS.length, 128);
    for (const m of Reg.LESSONS) assert.ok(L.lessonById(m.id), `${m.id}: no content`);
    assert.deepEqual([...T.PAGE_IDS], ['meet', 'setups', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice']);
  });
  it('every module of every lesson, at every step the shared pages draw (and unknown family steps), first/last, engine or family page', () => {
    const problems: string[] = [];
    let n = 0;
    for (const m of Reg.LESSONS) {
      for (const pg of lessonPages(m.id)) {
        for (const step of [null, ...STEP_SAMPLES, ...REVIEW_DOCKS]) {
          for (const [first, last] of [[true, false], [false, true], [true, true], [false, false]] as const) {
            for (const enginePage of [true, false]) {
              for (const credited of [false, true]) {
                const gd = G.mikingScreenGuide({ page: pg.page, pageNum: pg.i + 1, pageTitle: pg.title, goal: pg.goal, prevTitle: pg.prev, nextTitle: pg.next, step, first, last, credited, enginePage }) as unknown as Guide;
                checkShape(`${m.id}.${pg.page}.${step?.label ?? '—'}`, gd, problems);
                n++;
              }
            }
          }
        }
      }
    }
    assert.ok(n > 100000, `${n} guides built`);
    assert.deepEqual([...new Set(problems)].slice(0, 25), []);
  });
  it('the Foundations card, for every module it can cover in every lesson', () => {
    const problems: string[] = [];
    for (const m of Reg.LESSONS) {
      for (const pg of lessonPages(m.id).filter((x) => x.page !== 'meet' && x.page !== 'setups')) {
        checkShape(`${m.id}.${pg.page}.foundations`, G.mikingFoundationsGuide({ pageNum: pg.i + 1, pageTitle: pg.title, prevTitle: pg.prev, nextTitle: pg.next }) as unknown as Guide, problems);
      }
    }
    assert.deepEqual(problems, []);
  });
  it('the what’s-left screen and the hub (each family, and every family at once)', () => {
    const problems: string[] = [];
    checkShape('end', G.MIKING_END_GUIDE as unknown as Guide, problems);
    checkShape('hub.all', G.mikingHubGuide() as unknown as Guide, problems);
    for (const lab of Reg.readyLabs()) checkShape(`hub.${lab.id}`, G.mikingHubGuide(lab) as unknown as Guide, problems);
    assert.equal(Reg.readyLabs().length, 7);
    assert.deepEqual(problems, []);
  });
  it('the guide names the step exactly as the strip does, and the module by its header title', () => {
    const pg = lessonPages('M01')[3];
    const step = STEP_SAMPLES.find((s) => s.title === 'Place the mic')!;
    const gd = G.mikingScreenGuide({ page: pg.page, pageNum: 4, pageTitle: pg.title, goal: pg.goal, prevTitle: pg.prev, nextTitle: pg.next, step, first: false, last: false, credited: false, enginePage: true }) as unknown as Guide;
    assert.match(gd.seeing[0], /^MODULE 4 · PLACEMENT STUDIO\./);
    assert.ok(gd.seeing.some((l) => l.includes('PLACE · Place the mic')));
    assert.ok(gd.control[0].startsWith('The dock: POSITION (slider; menu: FRONT–BACK / HEIGHT / ACROSS); AIM'));
    assert.ok(gd.teaches[0].includes(pg.goal));
    assert.ok(gd.teaches.some((l) => l.includes(`“${pg.prev}”`) && l.includes(`“${pg.next}”`)));
  });
});

describe('2. every hand-written name is on the screen it describes', () => {
  // [note key, files that must define that step, names quoted]
  const NOTE_NAMES: Record<string, [string[], string[]]> = {
    'READ|Start here': [[P('PInstrument'), `${MIKING}/engine/journeyKit.tsx`, `${MIKING}/engine/journey.ts`], ['THE JOURNEY', 'How would you like to start?', 'New to miking', 'I already mic', 'six-question quick check', 'QUICK CHECK', 'the one that counts']],
    'LEARN|What it is': [[P('PInstrument')], ['orient.map']],
    'TRY|The parts': [[P('PInstrument')], ['PART', 'LOOKED AT', 'WHERE SOUND COMES FROM', 'There is nothing to answer']],
    'WATCH|Starting setups': [[P('PSetups')], ['SETUP', 'SETUPS', 'LOOKED AT', 'START · ', 'TENDS TO', 'The Placement Studio starts from the last one you look at', 'faderUnlessFew']],
    'LEARN|What else the mic hears': [[P('PSetups')], ['ON A STAGE (LIVE)', 'IN A STUDIO']],
    'LEARN|On the instrument': [[P('PMicOnIt'), P('PMicrophone')], ['TYPE', 'PATTERN', 'POWER', 'powerOf(t).word', 'PHANTOM', 'NONE', 'BATTERY', 'OWN SUPPLY', 'VARIES', 'MOUNT']],
    'COMPARE|Patterns': [[P('PMicrophone')], ['SOURCE ANGLE', 'TYPE', 'PATTERN', 'PICKUP', 'DEEP NULL', 'NULL']],
    'LEARN|By property, not brand': [[P('PMicrophone')], ['No brand is required', 'SPEC DETAILS ▾']],
    'WATCH|Worked example': [[P('PPlacement')], ['STEP', 'WHERE TO BEGIN', 'THE DISTANCE', 'CLEARANCE', '▸ ', 'FRONT']],
    'PLACE|Place the mic': [[P('PPlacement')], ['START', 'ZONE', 'SETUP', 'MIC TYPE', 'MEASURE FROM', 'POSITION', 'AIM', 'twoZones', 'C.variantKey', '<ZoneCard']],
    'LIVE|Aim the rejection': [[P('PContext')], ['AIM', 'PATTERN', 'MONITOR', 'LIVE', 'STUDIO', 'PICKUP', 'REJECTION', 'IN NULL', 'NULL', 'X.badgeWhere', 'Studio: no monitor.']],
    'PAIR|Pair and polarity': [[P('PTwoMic')], ['EDIT MIC ${slot}', 'MIC B POLARITY', 'SOURCE', 'PATH Δd B−A', 'DELAY Δt B−A', '1ST NOTCH', 'NO COMB', 'POLARITY', 'OVER 20 kHz', 'rear lobe: −', 'heads: −']],
    'READ|Symptoms': [[P('PReadPages'), `${MIKING}/engine/kit.tsx`], ['OBSERVATION', 'a retry is explained, never penalized', 'What do you check first?', '<SymptomCard']],
    'PRACTICE|Set up in order': [[P('PReadPages')], ['A step tapped too early is answered with why it cannot come yet', 'OrderTaskCard']],
    'PRACTICE|Your setup': [[P('PReadPages')], ['Each brief accepts more than one setup', 'tick every reason']],
    'PRACTICE|Mixed review': [[P('PReadPages')], ['OBSERVATION SHEET · OPTIONAL', '<ScenarioList']],
  };
  it('a name list for every note, and every note’s step is defined (kind + title) in its page', () => {
    assert.deepEqual(Object.keys(NOTE_NAMES).sort(), Object.keys(G.STEP_NOTES).sort());
    for (const key of Object.keys(G.STEP_NOTES)) {
      const [kind, title] = key.split('|');
      const src = code(NOTE_NAMES[key][0][0]);
      const at = src.indexOf(`title: '${title}'`);
      assert.ok(at >= 0, `${key}: no step titled "${title}" in ${NOTE_NAMES[key][0][0]}`);
      assert.match(src.slice(at, at + 200), new RegExp(`kind: '${kind}'`), `${key}: the step is not a ${kind} step`);
    }
  });
  for (const [key, [files, names]] of Object.entries(NOTE_NAMES)) {
    it(`${key}: every quoted name is in the source`, () => {
      const src = files.map(code).join('\n');
      for (const n of names) assert.ok(src.includes(n), `${key}: "${n}" is no longer in the source — update the note`);
    });
  }
  it('a note WITHOUT engineOnly is true of every copy of that step in the Miking code', () => {
    // Each copy must draw the same thing the note describes.
    const SAME: Record<string, string[]> = {
      'Start here': ['<JourneyMap', '<PathChooser', '<QuickCheckCard'],
      'What it is': ['orient.map', '<Card'],
      'Patterns': ["label: 'SOURCE ANGLE'", "k: 'PICKUP'", "'DEEP NULL'", "k: 'NULL'", 'maxAngle >= 100'],
      'By property, not brand': ['MIC_TYPES', 'SPEC DETAILS ▾'],
      'Set up in order': ['<OrderTaskCard'],
      'Your setup': ['<SetupTaskCard'],
      'Mixed review': ['OBSERVATION SHEET · OPTIONAL', '<ScenarioList'],
    };
    for (const [key, n] of Object.entries(G.STEP_NOTES) as [string, { engineOnly?: boolean }][]) {
      if (n.engineOnly) continue;
      const title = key.split('|')[1];
      const copies = filesDefining(title);
      assert.ok(copies.length >= 1, `${key}: no copy found`);
      if (copies.length === 1) continue; // the one copy is pinned above
      const need = SAME[title];
      assert.ok(need, `${key}: ${copies.length} copies (${copies.join(', ')}) — pin what they share, or mark the note engineOnly`);
      for (const f of copies) for (const s of need) assert.ok(code(f).includes(s), `${key}: ${f} lacks ${s}`);
    }
  });
  it('an engineOnly note never lands on a family page; enginePageOf follows the lesson screen’s own-page rule', () => {
    const watch = STEP_SAMPLES.find((s) => s.title === 'Worked example')!;
    assert.ok(G.stepNoteFor(watch, true));
    assert.equal(G.stepNoteFor(watch, false), undefined);
    assert.ok(G.stepNoteFor(STEP_SAMPLES[0], false), 'Start here is the same everywhere');
    assert.equal(G.enginePageOf('placement', []), true);
    assert.equal(G.enginePageOf('placement', ['placement']), false);
    assert.equal(G.enginePageOf('meet', ['instrument']), false);
    assert.equal(G.enginePageOf('meet', ['sound']), true);
    assert.equal(G.enginePageOf('setups', ['setting']), true);
    assert.equal(G.enginePageOf('setups', ['setups']), false);
    assert.equal(G.enginePageOf('microphone', ['microphone']), true);
    const S = code(LESSON_SCREEN);
    assert.match(S, /const src = \(id: Exclude<SourcePageId, 'meet' \| 'setups'>\): PageFn => own\[id\] \?\? SHARED_PAGES\[id\];/);
    assert.match(S, /meet: own\.meet \?\? compose\('MeetIt', \[\{ key: 'instrument', Page: src\('instrument'\) \}/);
    assert.match(S, /setups: own\.setups \?\? compose\('StartingSetups', \[\{ key: 'setups', Page: PSetups \}/);
    assert.match(S, /microphone: compose\('Microphones', \[\{ key: 'onit', Page: PMicOnIt \}/);
  });
  it('the shell names: the strip, FULL SCREEN, the head and tail lines, the Foundations card, the end screen, the hub', () => {
    const NAV = code('src/screens/lab/kit/labNav.ts') + code('src/screens/lab/kit/LabNavBar.tsx');
    for (const n of ['‹ PREV', 'NEXT ›', 'FINISH ›', '⏮', 'Opens the contents']) assert.ok(NAV.includes(n), n);
    const RACK = code('src/screens/lab/rack/RackUnit.tsx');
    for (const n of ['⤢  FULL SCREEN', '▴  HIDE DISPLAY', 'Shows the drawing at full size with zoom']) assert.ok(RACK.includes(n), n);
    const S = code(LESSON_SCREEN);
    for (const n of ['`Page ${pageIdx + 1} goal: `', 'TO EARN CREDIT · ', 'This page is credited.']) assert.ok(S.includes(n), n);
    const J = code(`${MIKING}/engine/journeyKit.tsx`);
    for (const n of ['BUILT ON THE FIRST TWO PAGES', '`I ALREADY MIC ${journey.noun.many.toUpperCase()} · QUICK CHECK`', 'label="OPEN"', "journey.goPage('meet', 0)", "journey.choosePath('experienced')"]) assert.ok(J.includes(n), n);
    const E = code('src/screens/lab/kit/LabEndScreen.tsx') + code('src/screens/lab/kit/labEnd.ts');
    for (const n of ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS']) assert.ok(E.includes(n), n);
    const H = code(HUB_SCREEN);
    for (const n of ['pages`', "'✓ '", 'ProgressUnreadableNote', 'starting points, not rules']) assert.ok(H.includes(n), n);
    const gt = textOf(G.MIKING_END_GUIDE as unknown as Guide) + textOf(G.mikingFoundationsGuide({ pageNum: 3, pageTitle: 'Choose the microphone', prevTitle: 'Starting setups', nextTitle: 'Placement Studio' }) as unknown as Guide);
    for (const n of ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'BUILT ON THE FIRST TWO PAGES', 'I ALREADY MIC', 'QUICK CHECK', 'OPEN', '‹ PREV']) assert.ok(gt.includes(n), n);
  });
  it('the catalog neighbours the hub guide names are real', () => {
    const C = code('src/screens/lab/labCatalog.ts');
    assert.match(C, /name: 'Instruments & Recording'/);
    assert.match(C, /name: 'Microphone Selection Lab'/);
    assert.match(C, /name: 'Microphone Principles'/);
    const ht = textOf(G.mikingHubGuide() as unknown as Guide);
    for (const n of ['Instruments & Recording', 'Microphone Selection Lab', 'Microphone Principles']) assert.ok(ht.includes(n), n);
  });
});

describe('3. every TRY THIS number is what the screen uses', () => {
  it('only the pinned numbers appear in any TRY THIS line', () => {
    const lines: string[] = [];
    for (const n of Object.values(G.STEP_NOTES) as { tryThis: readonly (string | ((s: unknown) => string))[] }[]) {
      for (const w of n.tryThis) lines.push(typeof w === 'function' ? [{ dock: [] }, { dock: [{ label: 'SETUP' }] }, ...STEP_SAMPLES, ...REVIEW_DOCKS].map((s) => w(s)).join('\n') : w);
    }
    lines.push(...(G.MIKING_END_GUIDE.tryThis as string[]), ...(G.mikingHubGuide().tryThis as string[]));
    // Whole numbers only: a name such as "1ST NOTCH" is a label, not a number.
    const nums = lines.join('\n').match(/\b\d+(?:\.\d+)?\b/g) ?? [];
    assert.deepEqual([...new Set(nums)].sort(), ['100', '20']);
  });
  it('PAIR: "OVER 20 kHz" is the 1ST NOTCH cell once the first notch passes 20 kHz; it falls as Δt grows and climbs out of hearing as the paths meet (worked)', async () => {
    const tm = await import('../src/screens/lab/miking/engine/physics/twoMic.ts');
    assert.match(code(P('PTwoMic')), /const first = equal \? null : notchesHz\(dt, sEff, 20000, 4\)\[sEff === 1 \? 0 : 1\] \?\? null;/);
    assert.match(code(P('PTwoMic')), /first == null \? 'OVER 20 kHz'/);
    // Same polarity: first notch = 1 / (2 Δt). 100 mm → 0.291 ms → ≈ 1716 Hz; 200 mm → ≈ 858 Hz.
    const f = (mm: number, s: 1 | -1) => tm.notchesHz(tm.deltaTms(mm), s, 20000, 4)[s === 1 ? 0 : 1];
    assert.ok(Math.abs(f(100, 1) - 1716) < 2 && Math.abs(f(200, 1) - 858) < 2);
    // Inverted (a rear lobe): first notch = 1 / Δt — so the "drops" claim holds only while the POLARITY line stays the same.
    assert.ok(Math.abs(f(100, -1) - 3432) < 4);
    assert.ok(f(150, -1) > f(100, 1), 'a flip to inverted can raise the notch while Δt grows (100 → 150 mm: ≈ 1716 → ≈ 2288 Hz)');
    // Nearly equal paths (5 mm, above the 0.5 mm NO COMB line): no notch under 20 kHz in either polarity.
    assert.equal(f(5, 1), undefined);
    assert.equal(f(5, -1), undefined);
    assert.equal(tm.EQUAL_PATH_MM, 0.5);
  });
  it('PATTERNS: the NULL readout appears once the source has swept to 100° (both copies); SOURCE ANGLE spans 0°–180°', () => {
    for (const f of [P('PMicrophone'), `${MIKING}/lessons/shared/journeyPages.tsx`]) {
      assert.match(code(f), /const tried = predicted != null && maxAngle >= 100;/, f);
    }
    assert.match(code(P('PMicrophone')), /value: angle \/ 180,/);
    assert.match(code(P('PMicrophone')), /const a = Math\.round\(v \* 180\);/);
  });
  it('a cardioid all the way round (180°) reads DEEP NULL: its gain is the floor, below the deep-null line', async () => {
    const polar = await import('../src/screens/lab/miking/engine/physics/polar.ts');
    const units = await import('../src/screens/lab/miking/engine/model/units.ts');
    assert.equal(polar.gainDb('cardioid', 180), -60);
    assert.equal(units.isDeepNull(polar.gainDb('cardioid', 180)), true);
    assert.equal(units.isDeepNull(polar.gainDb('cardioid', 0)), false);
  });
});

describe('4. the step engine reports the step on screen in its own words', () => {
  it('stepInfoOf: strip label, bezel keys (lit-cell ▸ removed), dock keys with their menus', () => {
    const i = G.stepInfoOf({ kind: 'WATCH', title: 'Worked example', layout: 'rack', rack: { bezel: [{ k: '▸ FROM HEAD' }, { k: 'AIM' }], params: [{ kind: 'fader', label: 'STEP' }, { kind: 'options', label: 'ZONE', options: [{ label: 'A' }, { label: 'B' }] }, { kind: 'fader', label: 'AIM', chooser: { options: [{ label: 'LEFT–RIGHT' }] } }] } });
    assert.equal(i.label, 'WATCH · Worked example');
    assert.deepEqual(i.bezel, ['FROM HEAD', 'AIM']);
    assert.deepEqual(i.dock, [
      { label: 'STEP', kind: 'fader', options: [] },
      { label: 'ZONE', kind: 'options', options: ['A', 'B'] },
      { label: 'AIM', kind: 'fader', options: ['LEFT–RIGHT'] },
    ]);
    assert.equal(G.stripLabel('CHECK', 'Check'), 'Check');
    assert.equal(G.stepInfoOf({ kind: 'READ', title: 'Symptoms', layout: 'read' }).dock.length, 0);
  });
  it('the label rule is PageSteps’ own (the strip and the guide can never disagree)', () => {
    assert.match(code(STEPS), /s\.kind === s\.title\.toUpperCase\(\) \? s\.title : `\$\{s\.kind\} · \$\{s\.title\}`/);
  });
  it('PageSteps reports the active step, keyed by what it shows; a composed page passes the reporter to each part', () => {
    const S = code(STEPS);
    assert.match(S, /onStepInfo\?: \(info: MikingStepInfo\) => void;/);
    assert.match(S, /const shown = !host\?\.inactive && n > 0 \? stepInfoOf\(steps\[i\]\) : null;/);
    assert.match(S, /if \(shown\) onStepInfo\?\.\(shown\);/);
    assert.match(S, /\}, \[onStepInfo, shownKey\]\);/);
    assert.match(code(COMPOSE), /onStepInfo: host\?\.onStepInfo,/);
  });
});

describe('5. wiring', () => {
  const S = code(LESSON_SCREEN);
  it('the lesson header carries the guide for what is on screen: the end screen, the Foundations card, or the step', () => {
    assert.match(S, /const guide = ending\s*\? MIKING_END_GUIDE\s*: gated\s*\? mikingFoundationsGuide\(/);
    assert.match(S, /: mikingScreenGuide\(\{/);
    assert.match(S, /step: stepInfo,/);
    assert.match(S, /enginePage: enginePageOf\(page, Object\.keys\(art\.pages \?\? \{\}\)\),/);
    assert.match(S, /right=\{<AccuracyNote compact detail=\{lesson\.accuracyDetail\} \/>\}\s*guide=\{guide\}/);
    assert.match(S, /const host: StepHost = \{ step: stepIdx, setStep, onSteps, onStepInfo,/);
  });
  it('a ScreenGuideHost wraps the lesson root; a module or step change closes an open guide; regions only on a rack step', () => {
    assert.match(S, /<ScreenGuideHost resetKey=\{ending \? 'end' : `\$\{page\}:\$\{stepIdx\}`\} regions=\{!ending && !gated && stepInfo\?\.layout === 'rack'\}>/);
    assert.match(S, /<\/StepHostContext\.Provider>\s*<\/View>\s*<\/ScreenGuideHost>/);
    assert.match(S, /setStepInfo\(null\);/);
  });
  it('the hub header carries its family’s guide inside a host with no regions', () => {
    const H = code(HUB_SCREEN);
    assert.match(H, /<ScreenGuideHost regions=\{false\}>/);
    assert.match(H, /guide=\{mikingHubGuide\(one\)\}/);
    assert.match(H, /<\/ScrollView>\s*<\/ScreenGuideHost>/);
  });
});

describe('6. the accuracy chip', () => {
  it('KEPT on the lesson screen: real-world distances, measured as its starting-points note says', () => {
    assert.match(code(LESSON_SCREEN), /<AccuracyNote compact detail=\{lesson\.accuracyDetail\} \/>/);
    // Every lesson carries the note (the owner's ONE "about these starting
    // points" note, LESSON_JOURNEY §12).
    for (const m of Reg.LESSONS) {
      const d = L.lessonById(m.id).accuracyDetail as string;
      assert.ok(/^ABOUT THESE STARTING POINTS\./.test(d), `${m.id}: accuracyDetail`);
    }
  });
  it('none on the hub menu (it prints no measurement)', () => {
    assert.doesNotMatch(code(HUB_SCREEN), /AccuracyNote/);
  });
});

describe('7. the 2026-10-31 review: each accepted finding, re-proved from the code', () => {
  const guideAt = (id: string, page: string, step: unknown, enginePage = true) => {
    const pg = lessonPages(id).find((x) => x.page === page)!;
    return G.mikingScreenGuide({ page: pg.page, pageNum: pg.i + 1, pageTitle: pg.title, goal: pg.goal, prevTitle: pg.prev, nextTitle: pg.next, step, first: false, last: false, credited: false, enginePage }) as unknown as Guide;
  };
  it('POWER: the bezel word and the card line come from each type’s own power field, never from the transducer alone', () => {
    assert.match(code(P('PMicOnIt')), /k: 'POWER', v: powerOf\(t\)\.word/);
    assert.match(code(P('PMicrophone')), /power: powerOf\(m\)\.line/);
    assert.doesNotMatch(code(P('PMicOnIt')) + code(P('PMicrophone')), /transducer === 'condenser' \? '(PHANTOM|Power: needs phantom)/);
    assert.match(textOf(guideAt('F12', 'microphone', onItDock('F12'))), /BATTERY or OWN SUPPLY/);
  });
  it('ON THE INSTRUMENT: a one-TYPE lesson (F12) is never told to try each TYPE or open TYPE', () => {
    assert.equal(L.lessonById('F12').micTypeIds.length, 1);
    assert.doesNotMatch(guideAt('F12', 'microphone', onItDock('F12')).tryThis.join('\n'), /Try each TYPE|Open TYPE/);
    assert.match(guideAt('M01', 'microphone', onItDock('M01')).tryThis.join('\n'), /Try each TYPE/);
    // PATTERN redraws the lobe but not the place: the pose comes from the type's setup.
    assert.match(code(P('PMicOnIt')), /mics: \[\{ \.\.\.m, typeId, pattern: pat \}\]/);
  });
  it('PATTERNS: the cardioid try only where PATTERN offers a cardioid (B04 offers none)', () => {
    const b04 = guideAt('B04', 'microphone', patternsDock('B04')).tryThis.join('\n');
    assert.doesNotMatch(b04, /cardioid PATTERN/);
    assert.match(b04, /directly behind: PICKUP shows/);
    const withCard = guideAt('M01', 'microphone', STEP_SAMPLES.find((s) => s.title === 'Patterns'));
    assert.match(withCard.tryThis.join('\n'), /With a cardioid PATTERN/);
  });
  it('AIM THE REJECTION: "switch PATTERN" only with two or more patterns that have a null (B09 has one; omni has none)', () => {
    assert.deepEqual(ctxPatterns('B09').map((p) => p.label), ['figure-8']);
    assert.doesNotMatch(guideAt('B09', 'context', liveDock('B09')).tryThis.join('\n'), /switch PATTERN/);
    assert.match(guideAt('B03', 'context', liveDock('B03')).tryThis.join('\n'), /switch PATTERN between choices that have a null/);
    // Omni has no null (nullAngles → []): the NULL cell says NONE, never "≈ NaN°" (fixed 2026-10-31).
    const ctx = code(P('PContext'));
    assert.match(ctx, /k: 'NULL', v: !nulls\.length \? 'NONE' : tried \? `≈ \$\{Math\.round\(nulls\[0\]\)\}°` : '\?'/);
    // The reveal: omni gets its own "no null" line; figure-8 says SIDES (90°), never "toward the rear".
    assert.match(ctx, /\) : !nulls\.length \? \(\s*(?:\/\/[^\n]*\n\s*)?<Note tone="ok">\{`What you just saw: an omni hears every direction about equally/);
    assert.match(ctx, /pattern === 'figure8' \? \(\s*(?:\/\/[^\n]*\n\s*)?<Note tone="ok">\{`What you just saw: a figure-8 rejects most at its sides/);
    assert.deepEqual(nullAnglesOf('omni'), []);
    assert.equal(Math.round(nullAnglesOf('figure8')[0]), 90);
  });
  it('AIM THE REJECTION: the unwanted source is the lesson’s own (a PA, a loudspeaker, an amp), not always a stage monitor', () => {
    const t = textOf(guideAt('B09', 'context', liveDock('B09')));
    assert.match(t, /the loud source picked in MONITOR/);
    assert.doesNotMatch(t, /a MONITOR where a stage often puts one/);
  });
  it('the sharper "Studio or live" words only on the engine’s own page (M11 draws a routing matrix under that title)', () => {
    assert.match(code(`${MIKING}/lessons/m11Kit/pages.tsx`), /context: PRouting/);
    assert.equal(lessonPages('M11').find((x) => x.page === 'context')!.title, 'Studio or live');
    const check = G.stepInfoOf({ kind: 'CHECK', title: 'Check', layout: 'read' });
    const m11 = guideAt('M11', 'context', check, G.enginePageOf('context', ['instrument', 'sound', 'placement', 'context']));
    assert.doesNotMatch(textOf(m11), /monitors sit near the mic|quiet side must face/);
    assert.match(textOf(guideAt('M01', 'context', check, true)), /monitors sit near the mic/);
  });
  it('PAIR: the toggle is named as drawn (EDIT MIC A / B); the two-mics try keeps PATH Δd and DELAY Δt apart', () => {
    assert.match(code(P('PTwoMic')), /label: `EDIT MIC \$\{slot\}`/);
    assert.match(textOf(guideAt('M01', 'twoMic', STEP_SAMPLES.find((s) => s.title === 'Pair and polarity'))), /EDIT MIC B \/ EDIT MIC A/);
    const check = G.stepInfoOf({ kind: 'CHECK', title: 'Check', layout: 'read' });
    assert.match(guideAt('M01', 'twoMic', check).tryThis.join('\n'), /PATH Δd.*DELAY Δt/);
  });
  it('SYMPTOMS and MIXED REVIEW hold answer cards: never "Nothing to set"; an unknown PRACTICE or family read step is not told so either', () => {
    for (const title of ['Symptoms', 'Mixed review']) {
      const t = guideAt('M01', title === 'Symptoms' ? 'troubleshoot' : 'practice', STEP_SAMPLES.find((s) => s.title === title)).control.join('\n');
      assert.doesNotMatch(t, /Nothing to set/, title);
    }
    for (const st of [G.stepInfoOf({ kind: 'PRACTICE', title: 'A family task', layout: 'read' }), G.stepInfoOf({ kind: 'WATCH', title: 'The venue', layout: 'read' })]) {
      assert.doesNotMatch(guideAt('F12', 'practice', st, false).control.join('\n'), /Nothing to set/);
    }
  });
  it('WHAT’S LEFT: an answered check opens locked on its right answer, so the guide says re-read (a fresh run re-opens them)', () => {
    const K = code(`${MIKING}/engine/kit.tsx`);
    assert.match(K, /useState<string \| null>\(answered \? s\.correct : null\)/);
    assert.match(K, /disabled=\{correct\}/);
    assert.match(code(LESSON_SCREEN), /setLocalAnswers\(\{\}\);/);
    assert.match(G.MIKING_END_GUIDE.tryThis.join('\n'), /re-read its checks/);
  });
  it('SET UP IN ORDER: an early tap is a recorded miss in practice credit, so the guide never asks for one on purpose', () => {
    assert.match(code(`${MIKING}/engine/kit.tsx`), /early\.current = true;\s*noteFirstMiss\(t\.id\);/);
    assert.ok((R.pageOf(R.restructureLesson(L.lessonById('M01')), 'practice').credit.scenarios as string[]).includes('k.prac.order'));
    assert.doesNotMatch((G.STEP_NOTES['PRACTICE|Set up in order'].tryThis as string[]).join('\n'), /on purpose/);
  });
  it('PLACE: the NOW line is screen-reader only, so the try reads the bezel and the zone card; SETUP’s middle row is the source’s version key', () => {
    assert.match(code(`${MIKING}/engine/kit.tsx`), /srOnly: \{ position: 'absolute', width: 1, height: 1, opacity: 0/);
    assert.match(code(P('PPlacement')), /\{zone \? <ZoneCard z=\{zone\} \/>/);
    assert.match(code(P('PPlacement')), /<Text style=\{styles\.trayHead\}>\{C\.variantKey\}<\/Text>/);
    const t = textOf(guideAt('M01', 'placement', STEP_SAMPLES.find((s) => s.title === 'Place the mic')));
    assert.match(t, /the card under the drawing/);
    assert.doesNotMatch(t, /setup choices/);
  });
  it('STARTING SETUPS: the screen prompt names SETUP only when the dock draws it (3–4 setups leave just SETUPS), same rule as the guide', () => {
    const s = code(P('PSetups'));
    assert.match(s, /\.\.\.faderUnlessFew\(setups\.length, \{\s*kind: 'fader',\s*id: 'setup'/);
    assert.match(s, /prompt=\{`\$\{fewStops\(setups\.length\) \? 'Pick each setup by name in SETUPS\.' : 'Step through SETUP, or pick one by name in SETUPS\.'\}/);
    assert.doesNotMatch(s, /prompt="Step through SETUP/);
    assert.match(read('src/screens/lab/miking/mikingScreenGuides.ts'), /has\(s, 'SETUP'\) \? 'Step through SETUP, or pick one by name in SETUPS' : 'Pick each setup by name in SETUPS'/);
  });
  it('the strip line explains step mode as the strip reads it', () => {
    assert.match(code('src/screens/lab/kit/labNav.ts'), /noun: `MODULE \$\{i \+ 1\} · STEP`,/);
    assert.match(textOf(guideAt('M01', 'meet', null)), /reads MODULE, and STEP when a module has several/);
  });
  it('the other ⓘ: named only where the lesson header still carries the starting-points chip (never on the hub)', () => {
    assert.match(code(LESSON_SCREEN), /right=\{<AccuracyNote compact detail=\{lesson\.accuracyDetail\} \/>\}/);
    assert.match(G.MIKING_END_GUIDE.control.join('\n'), /The other ⓘ/);
    assert.doesNotMatch(textOf(G.mikingHubGuide() as unknown as Guide), /The other ⓘ/);
  });
});
