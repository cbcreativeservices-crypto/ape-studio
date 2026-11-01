/**
 * Screen Guide rollout — Sound Systems Lab (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts and the Fundamentals tests.
 *
 *   1. every screen the learner reaches has a guide: the hub, every page of
 *      the five modes (by its on-screen title, read from the page arrays'
 *      source), LEARN's appended understanding check and the what's-left
 *      screen — five sections, 1–5 bullets, 2–3 TRY THIS, the house copy
 *      rules, each step within its no-scroll budget;
 *   2. each guide quotes its screen's REAL names — every name pinned here is
 *      in both the guide and this lab's source;
 *   3. every TRY THIS number is what the page prints at that setting — worked
 *      out here from the lab's own models (loads, operate, the console
 *      outputs, the build engine) with the page's defaults, which are pinned
 *      too, so a change in the page fails here instead of leaving the guide
 *      quietly wrong;
 *   4. wiring: SsPagedLab hosts the guide (ScreenGuideHost + LabHeader key),
 *      all five modes pass pageGuide + endGuide, the hub has its own key;
 *   5. the accuracy-chip decision: KEPT — this lab prints real-world
 *      measurement numbers (speaker coverage, gain/level readouts, SPL at a
 *      distance, delay times, amplifier loads), owner-named examples.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const G = await import('../src/screens/lab/soundsystems/soundsystemsScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { SS_PAGE_COUNTS } = await import('../src/screens/lab/soundsystems/units.ts');
const { CAPSTONES_IN_ORDER } = await import('../src/features/soundsystems/capstones.ts');
const { FAULT_GROUPS, FAULTS } = await import('../src/features/soundsystems/faults.ts');
const { VENUE_CASES } = await import('../src/features/soundsystems/configs.ts');
const { WHICH_TOOL } = await import('../src/features/soundsystems/console.ts');
const L = await import('../src/features/soundsystems/loads.ts');
const O = await import('../src/features/soundsystems/operate.ts');
const S = await import('../src/features/soundsystems/system.ts');
const OUT = await import('../src/features/soundsystems/outputs.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const tryOf = (gd: Guide) => gd.tryThis.join('\n');

const SS = 'src/screens/lab/soundsystems';
/** Page titles as the arrays declare them (the header shows these). */
const titlesIn = (file: string) => [...code(`${SS}/${file}`).matchAll(/\{ title: '([^']+)', short: '[^']+', Component: Page\w+/g)].map((m) => m[1]);
const LEARN = [...titlesIn('pagesLearnA.tsx'), ...titlesIn('pagesLearnB.tsx'), ...titlesIn('pagesLearnC.tsx')];
const ROUTE = titlesIn('pagesRoute.tsx');
const OPERATE = titlesIn('pagesOperate.tsx');
const BUILD = [...titlesIn('pagesBuild.tsx'), ...CAPSTONES_IN_ORDER.map((c: { n: number; title: string }) => `Capstone ${c.n} · ${c.title}`)];
const TROUBLE = [...titlesIn('pagesTroubleshoot.tsx'), ...FAULT_GROUPS.map((g: { title: string }) => g.title)];

const MODES: [string, string[], Record<string, Guide>][] = [
  ['learn', LEARN, G.SS_LEARN_GUIDES],
  ['build', BUILD, G.SS_BUILD_GUIDES],
  ['route', ROUTE, G.SS_ROUTE_GUIDES],
  ['operate', OPERATE, G.SS_OPERATE_GUIDES],
  ['troubleshoot', TROUBLE, G.SS_TROUBLESHOOT_GUIDES],
];
const allGuides: [string, Guide][] = [
  ['hub', G.SS_HUB_GUIDE],
  ['end', G.SS_END_GUIDE],
  ['check', G.SS_CHECK_GUIDE],
  ...MODES.flatMap(([, , gs]) => Object.entries(gs)),
];
const byId: Record<string, Guide> = Object.fromEntries(allGuides);

describe('1. every Sound Systems screen has a complete guide', () => {
  for (const [mode, titles, guides] of MODES) {
    it(`${mode}: one guide per page title (the page counts units.ts declares), none for a page that does not exist`, () => {
      assert.equal(titles.length, SS_PAGE_COUNTS[mode as keyof typeof SS_PAGE_COUNTS], `${mode}: page titles read from source`);
      assert.deepEqual(Object.keys(guides).sort(), [...titles].sort());
    });
  }
  it('LEARN carries the appended check: ssGuideFor returns the check guide just past the last page', () => {
    assert.equal(G.ssGuideFor(G.SS_LEARN_GUIDES, LEARN, LEARN.length, true), G.SS_CHECK_GUIDE);
    assert.equal(G.ssGuideFor(G.SS_LEARN_GUIDES, LEARN, 0, true), G.SS_LEARN_GUIDES[LEARN[0]]);
    assert.equal(G.ssGuideFor(G.SS_ROUTE_GUIDES, ROUTE, ROUTE.length), undefined, 'no check on the other modes');
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 experiments`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no gear brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      // MASTER is a control name here; the rule is about claiming a skill.
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou mastered\b|\byou will learn to\b|\byou can now\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|build \d+)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Dante|Shure|Neumann|Yamaha|Behringer|Midas|DiGiCo|Avid|Allen & Heath|Crown|QSC|Meyer|d&b|L-Acoustics|JBL|Sennheiser)\b/, `${id}: a gear brand`);
    }
  });
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
});

describe('2. each guide quotes its screen’s real names', () => {
  const files = (dir: string) => readdirSync(join(ROOT, dir)).filter((f) => /\.tsx?$/.test(f)).map((f) => `${dir}/${f}`);
  const SRC = [
    ...files(SS).filter((f) => !f.endsWith('ScreenGuides.ts')),
    ...files(`${SS}/art`),
    ...files('src/features/soundsystems'),
    'src/screens/lab/kit/LabEndScreen.tsx',
    'src/screens/lab/kit/labEnd.ts',
    'src/components/LabUnderstandingCheck.tsx',
    'src/screens/lab/kit/labNav.ts',
  ]
    .map(code)
    .join('\n');
  const UP = SRC.toUpperCase();
  const CAP = ['PART', 'OUTPUT', 'PLACED', 'CABLES', 'LIVE', 'REQS', 'PASS'];
  const NAMES: Record<string, { exact: string[]; upper?: string[] }> = {
    hub: { exact: ['LEARN', 'BUILD', 'ROUTE', 'OPERATE', 'TROUBLESHOOT', 'WHAT IS LEFT', 'UNDERSTANDING CHECK', 'START OVER (PRACTICE)', 'SOUND SYSTEMS LAB — COMPLETE'] },
    end: { exact: ["WHAT'S LEFT", 'LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO SOUND SYSTEMS', 'LAB NOTES'] },
    check: { exact: ['CORRECT', 'NOT QUITE — TRY ANOTHER', 'UNDERSTANDING CHECK', '‹ PREV'] },
    'The complete system': { exact: ['STAGE', 'CONSOLE · RACKS', 'LOUDSPEAKERS', 'STAGE IN', 'HOUSE', 'STATION', 'SEEN', 'Analog snake', 'Digital stagebox', 'Passive + amps', 'Powered boxes', 'LAB NOTES', 'MULTICORE', 'NETWORK', 'Powered tops', 'Powered sub', 'SUB OUT', 'MAIN L/R', 'Snake', 'Stagebox', 'Processor', 'Amps'] },
    'Trace the signal': { exact: ['NEXT', 'RESET', 'LIT', 'LAST', 'THREAD', 'WRONG', 'COMPLETE', 'OK', 'Source', 'Amplifier'] },
    'Ten kinds of system': { exact: ['TYPE', 'BOXES', 'SEEN', 'TEN KINDS OF SYSTEM', 'CHOSEN BY THE VENUE', 'A WAY TO BUILD ANY OF THEM', 'WHEN', 'NOT WHEN', 'Large-format line-array system', 'Distributed loudspeaker system', 'Small powered-loudspeaker PA', 'Outdoor performance system'] },
    'Match the venue': { exact: [] },
    'Output configurations': { exact: ['CONFIG', 'POSITIONS', 'FEEDS', 'SUBS', 'NONE', 'MONO', 'STEREO', 'THIRTEEN OUTPUT CONFIGURATIONS', 'BUSES', 'Mono', 'Stereo', 'LCR — left, center, right', 'Stereo mains with mono subwoofers', 'Stereo subwoofers', 'Lobby, recording and broadcast feeds'] },
    'Choose the configuration': { exact: [] },
    'The routing map': { exact: ['Main mix bus', 'Auxiliary send', 'Subgroup', 'DCA / VCA', 'Matrix output', 'Mute group', 'carries audio', 'sums channels', 'a copy', 'remote control', 'USE IT FOR', 'NOT FOR'] },
    'Subwoofer feeds': { exact: ['FEED', 'Crossover-fed', 'Aux-fed', 'Matrix-fed', 'VOCAL → SUB', 'REACHES', 'CONTROL', 'VOCAL', 'CLEAR', 'IN SUBS', 'PROC TRIM', 'PER SEND', 'MATRIX', 'WHEN'] },
    'Subwoofer placement and arrays': { exact: ['LAYOUT', 'SUBWOOFER ARRANGEMENTS', 'Left / right', 'Center cluster', 'Cardioid stacks', 'End-fire array', 'Flown subs', 'SUBS', 'PATTERN', 'RIG', 'OMNI', 'CARDIOID', 'END-FIRE', 'GROUND', 'FLOWN'] },
    'Stage monitors': { exact: ['MONITOR', 'THE MONITOR WORLD', 'Floor wedge', 'Side fill', 'Drum fill', 'In-ear monitors', 'FED BY', 'SEEN', 'ONE AUX · PRE', 'STEREO AUX', 'STEREO AUX · TX'] },
    'Monitor console, splits and talkback': { exact: ['MON GAIN', 'SPLIT', 'Analog split', 'Digital gain sharing', 'MON PREAMP', 'FOH HEARS', 'CHECKS', 'UNCHANGED', 'TRIM −'] },
    'Wiring and connections': { exact: ['CONNECT', 'REFUSE'] },
    'Amplifier loads': { exact: ['CABINETS', 'CABINET', 'BRIDGED', 'TOTAL LOAD', 'AMP MIN', 'INTO LOAD', 'VERDICT'], upper: ['MARGINAL', 'UNSAFE', 'SAFE'] },
    'Power and headroom': { exact: ['AMP', 'LISTENER', 'MATCH', 'CONTINUOUS', 'PROGRAM', 'IN BAND', 'UNDER', 'OVER', 'SPL @'] },
    'The deployment sequence': { exact: [], upper: ['VERIFY ROUTING BEFORE POWERING LOUDSPEAKERS'] },
    'Gain structure': { exact: ['PREAMP', 'WHICH STAGE', 'FADER', 'MAIN', 'PROC IN', 'PROC OUT', 'AMP', 'AT SPEAKER', 'ABOVE NOISE', 'HEADROOM', 'VERDICT'], upper: ['NOISY', 'CLIPPING', 'OK'] },
    'Coverage and aim': { exact: ['COVERAGE', 'AIM', 'FLOWN', 'FILLS', 'RIG'] },
    'Delay and alignment': { exact: ['DELAY', 'DISTANCE', 'AIR', 'NEEDED', 'SET', 'ERROR', 'SOUND'] },
    'Processing and tuning': { exact: ['Input EQ vs system EQ', 'Parametric EQ', 'Graphic EQ', 'Limiters', 'RTA', 'SPL meter', 'Spectrogram'] },
    'Feedback control': { exact: ['SEND', 'WEDGE', 'In the live angle', 'In the null', 'NOTCH', 'LOOP LIMIT', 'MARGIN', 'LOOP', 'STABLE', 'RINGING', 'OVER'] },
    'The source-forward method': { exact: ['WALK', '▶ RUN', 'WALK AGAIN', 'START', 'READ', 'LAST', 'FAULT', 'FOUND', 'NO SIGNAL', 'OK'] },
    'What you can now do': { exact: ['Lab home — what is left', 'NEXT'] },
    'The empty venue': { exact: ['PART', 'THE PARTS BIN', 'OUTPUT', 'REMOVE', 'CLEAR', 'PLACED', 'CABLES', 'LIVE', 'SILENT'] },
    'Capstone 1 · Speech system': { exact: [...CAP, 'MAIN L', 'MAIN R', 'MAIN MONO'] },
    'Capstone 2 · Small mono music system': { exact: [...CAP, 'MAIN MONO'] },
    'Capstone 3 · 2.1 with a dedicated subwoofer output': { exact: [...CAP, 'MAIN L', 'MAIN R', 'MAIN MONO'] },
    'Capstone 4 · Stereo band system with subwoofers': { exact: CAP },
    'Capstone 5 · Digital stagebox and networked audio': { exact: CAP },
    'Capstone 6 · Band with four monitor mixes': { exact: [...CAP, 'CONSOLE', 'PRE'] },
    'Capstone 7 · Subgroups and effects': { exact: [...CAP, 'CONSOLE', 'PRE', 'DRUMS', 'BAND'] },
    'Capstone 8 · Matrices for mains, fills and lobby': { exact: [...CAP, 'CONSOLE', 'MAIN', 'AUX 7'] },
    'Capstone 9 · Outdoor system with front fills and delays': { exact: [...CAP, 'MAIN MONO'] },
    'Capstone 10 · Festival-style complete system': { exact: [...CAP, 'CONSOLE', 'PRE'] },
    'Anatomy of a channel': { exact: ['STATION', 'AUDIO', 'SEEN', 'THE CHANNEL, TOP TO BOTTOM', 'THROUGH', 'A COPY', 'THE PATH', 'PRE', 'POST', 'Input and preamp', 'Assignment', 'Fader, pan and mute', 'MUTE'] },
    'Pre-fader and post-fader': { exact: ['AUX 1 · SINGER’S WEDGE', 'AUX 5 · REVERB', 'MAIN MIX', 'FADER', 'WEDGE HEARS', 'REVERB HEARS', 'MAIN', 'VOX FADER', 'WEDGE TAP', 'FX TAP', 'PRE-fader', 'POST-fader', 'CONSOLE', 'MUTE'] },
    'Subgroup, aux, matrix or DCA?': { exact: [] },
    'Four monitor mixes': { exact: ['CHANNEL', 'SEND', 'TAP', 'WEDGES ≥2', 'TO WHICH WEDGE', 'PRE', 'CONSOLE', 'ALL PRE', 'SINGER', 'GUITAR', 'BASS', 'DRUMS'] },
    'Subgroups and DCAs': { exact: ['DRUMS SUBGROUP', 'MAIN MIX', 'AUX 4 · DRUMMER', 'KICK → MAIN', 'KICK → WEDGE', 'BAND DCA', 'DRUMS GRP', 'CONSOLE', 'GROUP', 'DCA', 'BAND', 'DRUMS', '→ L/R'] },
    'Mute groups, solo and direct outs': { exact: ['MAIN MIX — WHO IS STILL LIVE', 'BAND MUTE', 'MAIN HEARS', 'STILL LIVE', 'CHECK', 'ALL MICS', 'MC · PB'] },
    'Matrix outputs': { exact: ['MX 2 · FRONT FILLS', 'MX 3 · LOBBY', 'MX 4 · RECORDING', 'FILLS TAKE', 'LOBBY TAKES', 'REC TAKES', 'MC → AUX 7', 'MATRICES', 'CONSOLE', 'AUX 7', 'MAIN'] },
    'Output patching': { exact: ['SOCKET', 'BUS', 'FED FROM', 'PATCHED', 'THE STAGEBOX’S LINE OUTPUTS', 'Main L', 'Main R', 'Aux 1', 'Aux 2', 'Aux 6', 'Matrix 2', 'Matrix 3', 'Wedge 1 amplifier'] },
    'Power-up sequence': { exact: ['STEP', 'RESET', 'STEPS', 'LAST', 'ORDER', 'LIT', 'WRONG', '● ON', 'YOUR ORDER', 'Verify routing — amps OFF', 'Amps and powered boxes — LAST'] },
    'Line check': { exact: ['LINE', 'PROBE', 'MARK OK', 'MARK FAULT', 'STAGEBOX LED', 'CH METER', 'MARKED', 'LIT', 'DARK', 'MOVING', 'FLAT', 'PROC OUT', 'RIGHT FEED', 'SIGNAL', 'NONE', 'YES', 'NO', 'OUTPUTS FIRST, THEN EVERY INPUT', 'Ch 5 · Keys DI', 'Ch 7 · Backing vocal', 'Read it again'] },
    'Establish gain structure': { exact: ['PREAMP', 'WHICH STAGE', 'FADER', 'MAIN', 'PROC IN', 'PROC OUT', 'AMP', 'AT SPEAKER', 'ABOVE NOISE', 'HEADROOM', 'VERDICT', 'CLIP'], upper: ['CLIPPING', 'OK'] },
    'Ring-out and soundcheck': { exact: ['WEDGE', 'SEND', 'POSITION', 'NOTCH', 'In the live angle', 'In the null', 'W1 SINGER', 'W2 GUITAR', 'W3 BASS', 'W4 DRUMS', 'Wedge 3 · Bass', 'Wedge 1 · Singer'] },
    'Shutdown and documentation': { exact: ['STEP', 'DOCUMENT', 'RESET', 'STEPS', 'LAST', 'ORDER', 'DARK', '○ OFF', 'YOUR ORDER', 'Console — save first', 'Mute the outputs', 'WRONG'] },
    'How the bench works': { exact: ['NO SIGNAL', 'OK', '✓✓', 'NEXT'] },
  };
  for (const g of FAULT_GROUPS as readonly { title: string }[]) NAMES[g.title] = { exact: [g.title, 'CASE', 'PROBE', 'FAULT', 'RESET', 'BENCH', 'PROBED', 'READS', 'GRADE', '✓✓'] };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort());
  });
  for (const [id, { exact, upper = [] }] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(byId[id]);
      for (const n of exact) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in this lab's source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
      for (const n of upper) {
        assert.ok(UP.includes(n), `${id}: "${n}" is no longer in this lab's source — update the guide`);
        assert.ok(gt.toUpperCase().includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the counts the quiz guides state are the screens’ own (eight venues, six briefs, eight situations, twenty-two faults)', () => {
    assert.equal(VENUE_CASES.length, 8);
    assert.match(textOf(byId['Match the venue']), /Eight venue cards/);
    assert.equal((code(`${SS}/pagesLearnA.tsx`).match(/^ {2}\{ id: 'c-\w+', situation:/gm) ?? []).length, 6);
    assert.match(textOf(byId['Choose the configuration']), /Six briefs/);
    assert.equal(WHICH_TOOL.length, 8);
    assert.match(textOf(byId['Subgroup, aux, matrix or DCA?']), /Eight situations/);
    assert.equal(FAULTS.length, 22);
    assert.match(textOf(byId['How the bench works']), /twenty-two faults in five groups/);
    assert.equal(FAULT_GROUPS.length, 5);
  });
  it('the OUTPUT labels the capstone guides quote are what the OUTPUT tray prints (outLabel)', () => {
    assert.equal(OUT.outLabel('aux6'), 'AUX 6');
    assert.equal(OUT.outLabel('mtx1'), 'MTX 1 · SUBS');
    assert.equal(OUT.outLabel('mtx2'), 'MTX 2 · FILLS');
    assert.equal(OUT.outLabel('mainMono'), 'MAIN MONO');
    assert.ok(tryOf(byId['Capstone 3 · 2.1 with a dedicated subwoofer output']).includes('AUX 6 or MTX 1 · SUBS'));
    assert.ok(tryOf(byId['Capstone 8 · Matrices for mains, fills and lobby']).includes('MTX 2 · FILLS'));
  });
});

describe('3. every TRY THIS number is what the page prints', () => {
  const B = code(`${SS}/pagesLearnB.tsx`);
  const C = code(`${SS}/pagesLearnC.tsx`);
  const OP = code(`${SS}/pagesOperate.tsx`);
  const R = code(`${SS}/pagesRoute.tsx`);

  it('the defaults the numbers rest on are still the pages’', () => {
    // Loads: one 8 Ω cabinet, unbridged; the amplifier rating.
    assert.match(B, /const \[ohms, setOhms\] = useState\(8\);\s*const \[count, setCount\] = useState\(1\);\s*const \[bridged, setBridged\] = useState\(false\);/);
    assert.match(B, /const AMP: AmpRating = \{ at8: 300, at4: 500, minOhms: 4, bridged8: 1000, minOhmsBridged: 8 \};/);
    // Power: 500 W at 10 m; the cabinet; 6 dB headroom; 50 W steps.
    assert.match(B, /const \[amp, setAmp\] = useState\(500\);\s*const \[dist, setDist\] = useState\(10\);/);
    assert.match(B, /const CABINET = \{ continuous: 400, program: 800, sensitivity: 97 \};/);
    assert.match(B, /predictedSpl\(CABINET\.sensitivity, amp, dist, 6\)/);
    assert.match(B, /laneVal\(p, AMP_MIN_W, AMP_MAX_W, 50\)/);
    // Alignment: 30 m, 20 °C, 0 ms; within 2 ms is aligned.
    assert.match(C, /const \[dist, setDist\] = useState\(30\);\s*const \[temp, setTemp\] = useState\(20\);\s*const \[setMs, setSetMs\] = useState\(0\);/);
    assert.match(C, /const aligned = Math\.abs\(err\) <= 2;/);
    // Feedback: −12 dB, live angle; the 12 dB / 4 dB model; the 2.5 kHz notch.
    assert.match(C, /const \[send, setSend\] = useState\(-12\);\s*const \[position, setPosition\] = useState<'null' \| 'live'>\('live'\);/);
    assert.match(C, /const gbf = \(position === 'null' \? 0 : -12\) \+ \(notched \? 4 : 0\);/);
    assert.match(C, /const ringHz = 2500;/);
    // LEARN gain: the starved preamp; OPERATE gain: the cranked one.
    assert.match(C, /useState<GainSettings>\(\{ preamp: 5, fader: 10, main: 10, procIn: 10, procOut: 0 \}\)/);
    assert.match(OP, /useState<GainSettings>\(\{ preamp: 60, fader: -20, main: -10, procIn: 0, procOut: 0, amp: 0 \}\)/);
    // Ring-out: every wedge at −18; W3 already in the null; same 12/4 model.
    assert.match(OP, /\{ id: 'w1', name: 'Wedge 1 · Singer', short: 'W1 SINGER', geometry: 'live', send: -18, notched: false \}/);
    assert.match(OP, /\{ id: 'w3', name: 'Wedge 3 · Bass', short: 'W3 BASS', geometry: 'null', send: -18, notched: false \}/);
    assert.match(OP, /const WEDGE_LIMIT = \(w: WedgeState\) => \(w\.geometry === 'null' \? 0 : -12\) \+ \(w\.notched \? 4 : 0\);/);
    // Pre/post: the wedge send starts POST and the reverb send PRE (backwards).
    assert.match(R, /setSend\(setSend\(bandConsole\(\), 'vox', 'aux1', \{ db: 0, tap: 'post' \}\), 'vox', 'aux5', \{ db: 0, tap: 'pre' \}\)/);
  });

  const AMP = { at8: 300, at4: 500, minOhms: 4, bridged8: 1000, minOhmsBridged: 8 };
  const loadAt = (z: number, n: number, bridged = false) => {
    const ld = L.parallelLoad(Array.from({ length: n }, () => z));
    const min = bridged ? 8 : 4;
    return { total: L.fmtOhms(ld.ohms), verdict: L.loadVerdict(ld.ohms, min).toUpperCase(), watts: L.wattsIntoLoad(AMP, ld.ohms, bridged), min };
  };
  it('Amplifier loads', () => {
    const t = tryOf(byId['Amplifier loads']);
    const two = loadAt(8, 2);
    const three = loadAt(8, 3);
    assert.ok(t.includes(`set CABINETS to 2: TOTAL LOAD ${two.total}, VERDICT ${two.verdict}, INTO LOAD ${two.watts} W. Then 3: ${three.total} and ${three.verdict}.`));
    assert.equal(three.watts, null, 'INTO LOAD reads — below the minimum');
    const s16 = loadAt(16, 2);
    assert.ok(t.includes(`set CABINETS to 2: ${s16.total}, ${s16.verdict}, ${s16.watts} W.`));
    const br = loadAt(8, 1, true);
    assert.ok(t.includes(`AMP MIN becomes ${br.min} Ω and INTO LOAD reads ${br.watts} W.`));
  });
  it('Power and headroom', () => {
    const t = tryOf(byId['Power and headroom']);
    const spl = (w: number, d: number) => L.predictedSpl(97, w, d, 6).toFixed(1);
    assert.equal(L.ampMatch(500, 400, 800), 'ok');
    assert.ok(t.includes(`MATCH reads IN BAND and SPL @ 10 m reads ${spl(500, 10)} dB. Double to 1000 W: ${spl(1000, 10)} dB.`));
    assert.ok(t.includes(`Back at 500 W, set LISTENER to 30 m: SPL falls to ${spl(500, 30)} dB.`));
    assert.equal(L.ampMatch(300, 400, 800), 'under');
    assert.ok(t.includes('pull AMP down to 300 W: MATCH reads UNDER'));
  });
  it('Power and headroom: the drawn band and the words agree past the program rating (verified 2026-10-31)', () => {
    // ampMatch keeps a limiter allowance up to program × 1.25 = 1000 W, but the
    // green band stops at the 800 W program rating. From 850 to 1000 W the
    // marker sits right of the band, so the screen must not say IN BAND there.
    const B = code(`${SS}/pagesLearnB.tsx`);
    assert.equal(L.ampMatch(800, 400, 800), 'ok');
    assert.equal(L.ampMatch(850, 400, 800), 'ok');
    assert.equal(L.ampMatch(1000, 400, 800), 'ok');
    assert.equal(L.ampMatch(1050, 400, 800), 'over');
    // The band is drawn continuous → program only.
    assert.match(B, /left: `\$\{band\(CABINET\.continuous\)\}%`, width: `\$\{band\(CABINET\.program\) - band\(CABINET\.continuous\)\}%`/);
    // Above program the words switch: bezel, verdict line and spoken label.
    assert.match(B, /const justOver = match === 'ok' && amp > CABINET\.program;/);
    assert.match(B, /v: match === 'ok' \? \(amp > CABINET\.program \? 'JUST OVER' : 'IN BAND'\)/);
    assert.match(B, /justOver \? '● JUST OVER — OK WITH THE LIMITER SET' : match === 'ok' \? '● IN THE BAND'/);
    // The copy above the controls no longer claims 1000 W "sits between" 400 and 800.
    for (const w of [850, 1000]) {
      const c = L.ampMatchCopy(L.ampMatch(w, 400, 800), w, 400, 800);
      assert.ok(!c.includes('sits between'), `${w} W copy`);
      assert.ok(c.includes(`${w} W is just above the cabinet’s 800 W program rating`), `${w} W copy`);
      assert.ok(c.includes('limiter set for the cabinet'));
    }
    for (const w of [400, 500, 800]) {
      assert.ok(L.ampMatchCopy(L.ampMatch(w, 400, 800), w, 400, 800).includes('sits between'), `${w} W copy`);
    }
  });
  it('Delay and alignment', () => {
    const t = tryOf(byId['Delay and alignment']);
    assert.ok(t.includes(`At 30 m and 20 °C NEEDED reads ${L.delayMs(30, 20).toFixed(1)} ms.`));
    assert.ok(t.includes(`NEEDED jumps to ${L.delayMs(60, 20).toFixed(1)} ms. Then set AIR to 35 °C: ${L.delayMs(60, 35).toFixed(1)} ms.`));
    assert.equal(L.speedOfSound(20).toFixed(0), '343');
    assert.ok(textOf(byId['Delay and alignment']).includes('about 343 m each second at 20 °C'));
  });
  it('Feedback control (and the ring-out page on the same model)', () => {
    const gbf = (pos: 'live' | 'null', notch = false) => (pos === 'null' ? 0 : -12) + (notch ? 4 : 0);
    const t = tryOf(byId['Feedback control']);
    assert.equal(gbf('live') - -12, 0);
    assert.ok(t.includes('At the start SEND is −12 dB and MARGIN 0 dB. Raise SEND to −11 dB: LOOP reads RINGING and MARGIN 1 dB OVER.'));
    assert.equal(-11 - gbf('live'), 1);
    assert.equal(gbf('null'), 0);
    assert.ok(t.includes('LOOP LIMIT becomes 0 dB. Bring SEND to −6 dB: STABLE with 6 dB of margin.'));
    const r = tryOf(byId['Ring-out and soundcheck']);
    assert.ok(-6 > gbf('live') && gbf('null') - -6 === 6);
    assert.ok(r.includes('raise SEND to −6 dB: it rings. Set POSITION to In the null: it stops, with 6 dB of margin.'));
    assert.equal(gbf('live', true), -8);
    // the screen prints the overshoot, not the limit: −6 − (−8) = 2 dB over
    assert.equal(-6 - gbf('live', true), 2);
    assert.ok(r.includes('try NOTCH alone: it still reads RINGING — 2 dB over. A notch buys only 4 dB.'));
    assert.ok(OP.includes('RINGING — ${x.send - l} dB over'), 'the ring-out page prints the overshoot');
  });
  const chain = (s: Record<string, number>) => {
    const ch = O.computeGainChain(s);
    const last = ch[ch.length - 1];
    const clipped = ch.some((n: { clipped: boolean }) => n.clipped);
    const first = ch.find((n: { clipped: boolean; inheritedClip: boolean }) => n.clipped && !n.inheritedClip);
    return {
      verdict: O.gainVerdict(ch).toUpperCase(),
      atSpeaker: Math.round(last.levelDbu),
      aboveNoise: Math.round(last.snrDb),
      headroom: clipped ? 'CLIP' : Math.round(Math.min(...ch.map((n: { headroomDb: number }) => n.headroomDb))),
      first: first?.id,
    };
  };
  const dbu = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n)} dBu`;
  it('Gain structure (LEARN)', () => {
    const t = tryOf(byId['Gain structure']);
    const start = { preamp: 5, fader: 10, main: 10, procIn: 10, procOut: 0 };
    assert.equal(chain(start).verdict, 'NOISY');
    assert.ok(t.includes('At the start VERDICT reads NOISY.'));
    const hot = chain({ ...start, preamp: 40 });
    assert.equal(hot.verdict, 'CLIPPING');
    assert.ok(t.includes('Raise PREAMP to +40 dB: with the later stages still at +10, it reads CLIPPING.'));
    const fixed = chain({ preamp: 40, fader: 0, main: 0, procIn: 0, procOut: 0 });
    assert.equal(fixed.verdict, 'OK');
    assert.ok(t.includes(`VERDICT OK, AT SPEAKER ${dbu(fixed.atSpeaker)}, ABOVE NOISE ${fixed.aboveNoise} dB.`));
  });
  it('Establish gain structure (OPERATE)', () => {
    const t = tryOf(byId['Establish gain structure']);
    const start = chain({ preamp: 60, fader: -20, main: -10, procIn: 0, procOut: 0, amp: 0 });
    assert.equal(start.first, 'preamp', 'the first CLIP lights at the preamp');
    const ampHot = chain({ preamp: 40, fader: 0, main: 0, procIn: 0, procOut: 0, amp: 0 });
    assert.equal(ampHot.verdict, 'CLIPPING');
    assert.equal(ampHot.first, 'amp');
    assert.ok(t.includes('leaving AMP at 0: VERDICT still reads CLIPPING — now at the amplifier.'));
    const ok = chain({ preamp: 35, fader: 0, main: 0, procIn: 0, procOut: 0, amp: -18 });
    assert.equal(ok.verdict, 'OK');
    assert.ok(typeof ok.headroom === 'number' && ok.headroom >= 12, 'meets the page’s 12 dB goal');
    assert.ok(t.includes(`Set PREAMP to +35 dB and AMP to −18: VERDICT OK, HEADROOM ${ok.headroom} dB, AT SPEAKER ${dbu(ok.atSpeaker)}.`));
    const amp = (O.GAIN_STAGES as readonly { id: string; unity: number }[]).find((s) => s.id === 'amp')!;
    assert.equal(amp.unity, -18, 'AMP’s unity mark');
  });
  it('the build engine says what the BUILD tries promise', () => {
    let sys = S.EMPTY_SYSTEM;
    const put = (kind: string, slot: string) => {
      const v = S.place(sys, kind, slot);
      assert.ok(v.ok, `${kind} at ${slot}`);
      sys = v.system;
      return sys.placed[sys.placed.length - 1].id;
    };
    const mic = put('vocalMic', 'stageC');
    const con = put('console', 'foh');
    const spk = put('poweredSpeaker', 'mainL');
    assert.equal(S.connect(sys, mic, spk).ok, false, 'mic straight to the loudspeaker is refused');
    let r = S.connect(sys, mic, con);
    assert.ok(r.ok);
    sys = r.system;
    r = S.connect(sys, con, spk);
    assert.ok(r.ok);
    sys = r.system;
    assert.equal(S.trace(sys).live.length, 1, 'LIVE goes to 1');
    assert.ok(tryOf(byId['The empty venue']).includes('LIVE goes to 1'));
    const pas = put('passiveSpeaker', 'mainR');
    assert.equal(S.connect(sys, con, pas).ok, false, 'console straight to a passive top is refused');
    let s2 = S.EMPTY_SYSTEM;
    const sb = S.place(s2, 'stagebox', 'stageBox');
    s2 = sb.system;
    const pr = S.place(s2, 'processor', 'rack1');
    s2 = pr.system;
    assert.ok(S.connect(s2, s2.placed[0].id, s2.placed[1].id).ok, 'the stagebox can feed the processor (Capstone 5)');
  });
});

describe('4. wiring: every mode and the hub carry the guide key', () => {
  const PAGED = code(`${SS}/SsPagedLab.tsx`);
  const MODESRC = code(`${SS}/modeScreens.tsx`);
  const HUB = code(`${SS}/SoundSystemsLabScreen.tsx`);
  it('SsPagedLab: pageGuide / endGuide props, a ScreenGuideHost round the root (rack regions), the guide on LabHeader', () => {
    assert.match(PAGED, /import \{ ScreenGuideHost, type ScreenGuide \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(PAGED, /pageGuide\?: \(index: number\) => ScreenGuide \| undefined;/);
    assert.match(PAGED, /const guide = ending \? endGuide : pageGuide\?\.\(page\);/);
    assert.match(PAGED, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\} regions=\{rack && !ending\}>/);
    assert.match(PAGED, /<LabHeader[\s\S]*?guide=\{guide\}\s*guideTitle=\{ending \? 'WHERE YOU ARE' : def\.title\.toUpperCase\(\)\}/);
    assert.match(PAGED, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('all five modes pass their guides (by page title) and the what’s-left guide; LEARN includes its check', () => {
    for (const [arr, guides, check] of [
      ['LEARN_TITLES', 'SS_LEARN_GUIDES', ', true'],
      ['BUILD_TITLES', 'SS_BUILD_GUIDES', ''],
      ['ROUTE_TITLES', 'SS_ROUTE_GUIDES', ''],
      ['OPERATE_TITLES', 'SS_OPERATE_GUIDES', ''],
      ['TROUBLESHOOT_TITLES', 'SS_TROUBLESHOOT_GUIDES', ''],
    ]) {
      assert.ok(MODESRC.includes(`pageGuide={(i) => ssGuideFor(${guides}, ${arr}, i${check})}`), `${guides} wired`);
    }
    assert.equal((MODESRC.match(/endGuide=\{SS_END_GUIDE\}/g) ?? []).length, 5);
  });
  it('the hub: a host with regions off, the hint anchor round the header, the key after the chip', () => {
    assert.match(HUB, /<ScreenGuideHost regions=\{false\}>\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.header\}>/);
    assert.match(HUB, /<AccuracyNote compact \/>\s*<ScreenGuideKey title="SOUND SYSTEMS LAB" guide=\{SS_HUB_GUIDE\} \/>\s*<\/View>\s*<\/ScreenGuideHintAnchor>/);
    assert.match(HUB, /<\/ScrollView>\s*<\/ScreenGuideHost>\s*<\/View>/);
  });
});

describe('5. the accuracy chip: KEPT (real-world measurement numbers)', () => {
  it('the chip stays on the hub, on every rack page header and on every reading page', () => {
    assert.match(code(`${SS}/SoundSystemsLabScreen.tsx`), /<AccuracyNote compact \/>/);
    const PAGED = code(`${SS}/SsPagedLab.tsx`);
    assert.match(PAGED, /right=\{rack && !ending \? <AccuracyNote compact \/> : undefined\}/);
    assert.match(PAGED, /<AccuracyNote style=\{styles\.accuracy\} \/>/);
  });
  it('the reason, re-vetted from the code: the pages print SPL at a distance, delay times, loads, gain/level readouts and speaker coverage', () => {
    const B = code(`${SS}/pagesLearnB.tsx`);
    const C = code(`${SS}/pagesLearnC.tsx`);
    assert.match(B, /k: `SPL @ \$\{dist\} m`/);
    assert.match(B, /k: 'TOTAL LOAD'/);
    assert.match(C, /k: 'NEEDED'/);
    assert.match(C, /k: 'COVERAGE'/);
    assert.match(code(`${SS}/gainDock.tsx`), /k: 'AT SPEAKER', v: `\$\{Math\.round\(last\.levelDbu\)\} dBu`/);
  });
});

describe('6. Line check: an output reads with its own words (vetted fix 2026-10-31)', () => {
  it('the bezel names an output’s two readings as the upper strip does, and the key fact matches what Wedge 2 shows', () => {
    const OP = code(`${SS}/pagesOperate.tsx`);
    // Wedge 2, the one output fault: signal present, wrong feed — the data is unchanged.
    assert.match(OP, /id: 'w2'[^\n]*healthy: false[^\n]*led: true, meter: false/);
    assert.match(OP, /const isOut = LINE_OUTPUTS\.some\(\(o\) => o\.id === sel\);/);
    assert.match(OP, /k: isOut \? 'PROC OUT' : 'STAGEBOX LED', v: probed \? \(it\.led \? \(isOut \? 'SIGNAL' : 'LIT'\) : \(isOut \? 'NONE' : 'DARK'\)\)/);
    assert.match(OP, /k: isOut \? 'RIGHT FEED' : 'CH METER', v: probed \? \(it\.meter \? \(isOut \? 'YES' : 'MOVING'\) : \(isOut \? 'NO' : 'FLAT'\)\)/);
    assert.match(OP, /On an output, signal present but the wrong feed plays = the output patch\./);
    assert.doesNotMatch(OP, /Both moving but the wrong box plays/);
    const guide = JSON.stringify(G.SS_OPERATE_GUIDES['Line check']);
    assert.match(guide, /PROC OUT \(SIGNAL or NONE\) and RIGHT FEED \(YES or NO\) on an output/);
    assert.match(guide, /signal present but the wrong feed plays = the output patch/);
  });
});
