/**
 * Screen Guide rollout — Mastering Lab (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_patchbay_20261031.test.ts.
 *
 *   1. every STEP of every module (the screens the learner reaches) has a
 *      guide, pinned to the step's own key, title and layout in the module
 *      files, in step order; each guide complete, inside its no-scroll
 *      budget, in the house copy rules;
 *   2. each guide quotes its step's REAL names (guide AND source);
 *   3. every number TRY THIS quotes is what the step prints at that setting
 *      (masteringEngine maths, the module files' own formulas);
 *   4. wiring: MasteringLabScreen hands the step's guide to LabHeader and
 *      hosts the overlay (regions on rack steps; none on the what's-left
 *      screen);
 *   5. the accuracy chip: KEPT — LUFS / true-peak / PLR estimates and
 *      monitoring SPL against the NIOSH daily limit are on screen.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const MA = 'src/screens/lab/mastering';
const { MASTERING_GUIDE_STEPS, masteringStepGuide } = await import(`../${MA}/masteringScreenGuides.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const C = await import(`../${MA}/masteringContent.ts`);
const E = await import(`../${MA}/masteringEngine.ts`);

type Guide = Record<string, string[]>;
type Step = { key: string; title: string; rack: boolean; guide: Guide };
const STEPS = MASTERING_GUIDE_STEPS as unknown as Record<string, Step[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const guideOf = (mod: string, key: string) => STEPS[mod].find((s) => s.key === key)!.guide;

const MOD_FILES: Record<string, string> = {
  what: 'mod1What.tsx', roles: 'mod2Roles.tsx', room: 'mod3Room.tsx', tools: 'mod4Tools.tsx',
  workflow: 'mod5Workflow.tsx', loudness: 'mod6Loudness.tsx', release: 'mod7Release.tsx', project: 'mod8Project.tsx',
};
/** The steps as the module files declare them: key, title, layout, in order. */
const declared = (mod: string) =>
  [...code(`${MA}/modules/${MOD_FILES[mod]}`).matchAll(/key: '([^']+)', title: '((?:[^'\\]|\\.)*)', kind: '(LEARN|LISTEN|EXPLORE|PRACTICE|REVIEW)', layout: '(rack|read)'/g)].map((m) => ({ key: m[1], title: m[2], rack: m[4] === 'rack' }));

const ALL: [string, Step][] = Object.entries(STEPS).flatMap(([mod, list]) => list.map((s) => [`${mod}:${s.key}`, s] as [string, Step]));

describe('1. every step of every module has a complete guide', () => {
  it('a guide list for each of the eight modules, in module order', () => {
    assert.deepEqual(Object.keys(STEPS), C.MASTERING_MODULES.map((m: { id: string }) => m.id));
  });
  for (const mod of Object.keys(MOD_FILES)) {
    it(`${mod}: one guide per step — key, title and layout match the module file, in order`, async () => {
      const d = declared(mod);
      assert.ok(d.length > 0, 'parsed the steps');
      assert.deepEqual(STEPS[mod].map((s) => ({ key: s.key, title: s.title, rack: s.rack })), d);
      const { MASTERING_STEP_COUNTS } = { MASTERING_STEP_COUNTS: Object.fromEntries([...code(`${MA}/modules/index.ts`).matchAll(/(\w+): (\d+)/g)].filter((m) => m[1] in MOD_FILES).slice(0, 8).map((m) => [m[1], Number(m[2])])) };
      assert.equal(STEPS[mod].length, MASTERING_STEP_COUNTS[mod], 'MASTERING_STEP_COUNTS agrees');
    });
  }
  it('the lookup: (module, step) → that step; past the end → undefined', () => {
    assert.equal(masteringStepGuide('what', 0), STEPS.what[0]);
    assert.equal(masteringStepGuide('project', 4), STEPS.project[4]);
    assert.equal(masteringStepGuide('project', 5), undefined);
  });
  for (const [id, s] of ALL) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      const gd = s.guide;
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('every step fits its no-scroll budget (375 × 812)', () => {
    const over: string[] = [];
    for (const [id, s] of ALL) {
      for (const sec of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (sec.place === 'strip') {
          for (const item of s.guide.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = s.guide[sec.key].join(' ').length;
        const cap = sec.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${sec.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no loudness target as THE rule', () => {
    for (const [id, s] of ALL) {
      const t = textOf(s.guide);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou(’|')?ve mastered\b|\byou mastered\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass|cognitive review|bug pass)\b/i, `${id}: a build note`);
      assert.doesNotMatch(t, /\b(aim for|target of|should hit|must hit)\s+[−-]?\d+\s*LUFS/i, `${id}: a loudness target stated as a rule`);
      assert.doesNotMatch(t, /\bturn (it )?up to hear\b/i, `${id}: encourages loud monitoring`);
    }
  });
  it('PRACTICE guides never give away an answer; Module 8’s checks guide names no check line', () => {
    const scen = [...C.TRIAGE_SCENARIOS, ...C.ROLE_SCENARIOS, ...C.WORKFLOW_SCENARIOS, ...C.PROJECT_TRACKS.map((t: { issue: unknown }) => t.issue)] as { prompt: string; explain: string }[];
    for (const [id, s] of ALL.filter(([id]) => /practice|problems|checks/.test(id))) {
      const t = textOf(s.guide);
      for (const sc of scen) assert.ok(!t.includes(sc.explain.slice(0, 40)), `${id} quotes an explanation`);
    }
    const checks = textOf(guideOf('project', 'checks'));
    for (const c of C.PROJECT_CHECKS as { label: string }[]) assert.ok(!checks.includes(c.label.slice(0, 30)), `checks guide names “${c.label}”`);
  });
});

describe('2. each guide quotes its step’s real names', () => {
  const SRC = [
    ...Object.values(MOD_FILES).map((f) => `${MA}/modules/${f}`),
    `${MA}/modules/shared.tsx`,
    `${MA}/kit.tsx`,
    `${MA}/stages.tsx`,
    `${MA}/masteringContent.ts`,
    `${MA}/masteringEngine.ts`,
    `${MA}/MasteringLabScreen.tsx`,
    'src/screens/lab/meter/meterEngine.ts',
    'src/screens/lab/kit/labNav.ts',
    'src/screens/lab/kit/LabNavBar.tsx',
    'src/screens/lab/rack/RackUnit.tsx',
  ]
    .map(code)
    .join('\n');
  const NAMES: Record<string, string[]> = {
    'what:fits': ['IN THIS MODULE', 'RECORDING', 'EDITING', 'MIXING', 'MASTERING', 'RELEASE', 'STAGE', 'NAME', 'WORKS ON', 'TRACKS', 'STEREO', 'FILES', 'REC', 'EDIT', 'MIX', 'MASTER', '‹ PREV', 'NEXT ›', '⏮', 'HIDE DISPLAY', 'FULL SCREEN'],
    'what:can': ['WHAT MASTERING CAN ADDRESS', 'WHAT IT CANNOT DO', 'THE PURPOSE OF OBJECTIVITY'],
    'what:listen': ['INPUT', 'CEILING', 'RELEASE', 'GR', 'BYP', 'PEAK', 'TRUE PK', 'LUFS', 'PLR', 'MATCH dB', '▶ MIX', '▶ LOUDER', '■ STOP', 'MATCH LEVEL', 'THE MIX', 'LOUDER'],
    'what:practice': ['Mastering adjustment', 'Mix revision', 'More information from the client', 'Your FIRST answer on each card is the one recorded', '‹ PREV CARD', 'NEXT CARD ›'],
    'what:review': ['KEY IDEAS', 'KEY TERMS', 'Mastering', 'Stereo master', 'Mix revision', 'TAKEAWAY', 'START OVER (PRACTICE)'],
    'roles:table': ['IN THIS MODULE', 'MIXING ENGINEER', 'MASTERING ENGINEER', 'The roles can overlap', 'Mastering is not simply "making it louder"'],
    'roles:control': ['REQUEST', 'ADDRESSED BY', 'A CLIENT REQUEST', 'VOCAL', 'SNARE', 'FORMAT', 'WIDTH', 'BUS COMP', 'FADES', 'MIXING', 'MASTERING', 'EITHER'],
    'roles:practice': ['‹ PREV CARD', 'NEXT CARD ›'],
    'roles:review': ['KEY IDEAS', 'KEY TERMS', 'TAKEAWAY'],
    'room:room': ['A TREATED ROOM', 'ROOM DESIGN AND ACOUSTIC CONTROL', 'MAIN MONITORS AND SECONDARY CHECKS'],
    'room:level': ['SPL (C)', 'BASS', 'TREBLE', 'PER DAY', 'READING', 'MONITOR', 'QUIET', 'GOOD', '8 h+'],
    'room:path': ['NEXT ›', 'COMPLETE', 'WORKS · MINIMAL', 'CHECK THE CHAIN', 'STAGES', 'TO ADD', 'PATH', 'EMPTY', 'CHECK', 'MINIMAL', 'DEVICE', 'DAW', 'DAC', 'MON CTL', 'AMP', 'PASSIVE', 'ACTIVE', '+ CONNECT', '✓ PLACED', 'SLOTS FULL', '‹ UNDO', 'CLEAR'],
    'room:practice': ['‹ PREV CARD', 'NEXT CARD ›'],
    'room:review': ['KEY IDEAS', 'KEY TERMS', 'TAKEAWAY'],
    'tools:groups': ['Playback and editing', 'Analog equipment (optional)', 'Meters and analysis'],
    'tools:shelf': ['TOOL', 'TILT', 'RATIO', 'WIDTH', 'LEVEL', 'OUT AT 0 IN', 'CORRELATION', 'LUFS (I)', 'MODEL', 'MEASURED', 'EDITING', 'MONITORS', 'EQ', 'DYNAMICS', 'STEREO', 'METERS', 'ANALOG', '▶ DRAW MIX'],
    'tools:analog': ['ANALOG EQUIPMENT (OPTIONAL)', 'What it is', 'What it is not', 'How to compare honestly'],
    'tools:practice': ['‹ PREV CARD', 'NEXT CARD ›'],
    'tools:review': ['KEY IDEAS', 'KEY TERMS', 'TAKEAWAY'],
    'workflow:flow': ['IN THIS MODULE', 'FLOW', 'NAME', 'INSPECT', 'LISTEN', 'DECIDE', 'CHANGE', 'SEQUENCE', 'DELIVER', 'QC', 'Receive and inspect', 'Quality-check the exports'],
    'workflow:inspect': ['Decide'],
    'workflow:listen': ['TILT', 'OUTPUT', 'SAFETY', 'BYPASS', 'BYP', 'PEAK', 'TRUE PK', 'LUFS', 'PLR', 'MATCH dB', 'MATCH LEVEL', '▶ BYPASS', '▶ WITH EQ', '■ STOP', 'WITH EQ'],
    'workflow:practice': ['‹ PREV CARD', 'NEXT CARD ›'],
    'workflow:review': ['KEY IDEAS', 'KEY TERMS', 'TAKEAWAY'],
    'loudness:numbers': ['IN THIS MODULE', 'PEAK', 'TRUE PK', 'LUFS', 'GAIN', 'FACE', 'SIGNAL', 'Sample peak meter', 'Loudness meter (BS.1770-style)', 'Music mix', 'Speech', 'Kick drum', 'Organ'],
    'loudness:listen': ['INPUT', 'CEILING', 'RELEASE', 'GR', 'ESTIMATE · RENDERS WHEN YOU LET GO', 'PEAK', 'TRUE PK', 'LUFS', 'PLR', 'MATCH dB', 'DRIVE', 'MATCH LEVEL', '▶ QUIETER', '▶ LOUDER', '■ STOP', 'QUIETER', 'LOUDER'],
    'loudness:normal': ['PLAYBACK LOUDNESS NORMALIZATION', 'TRANSLATION CHECKS'],
    'loudness:translate': ['SYSTEM', 'FOLD', 'STEREO', 'MONO', 'MODEL', 'Main monitors (treated room)', 'Headphones', 'Small speaker', 'Phone speaker (mono)', 'Car', '▶ DRAW MIX'],
    'loudness:practice': ['‹ PREV CARD', 'NEXT CARD ›'],
    'loudness:review': ['KEY IDEAS', 'KEY TERMS', 'TAKEAWAY'],
    'release:contexts': ['IN THIS MODULE', 'Streaming / digital distribution', 'CD preparation', 'Vinyl preparation', 'Broadcast or picture-related delivery', 'Alternate versions', 'The one constant'],
    'release:checklist': ['DESTINATION', 'CONFIRMED', 'CONFIRM', 'FACT', 'EXAMPLE', 'CD preparation', 'Vinyl preparation'],
    'release:practice': ['‹ PREV CARD', 'NEXT CARD ›'],
    'release:review': ['KEY IDEAS', 'KEY TERMS', 'TAKEAWAY'],
    'project:brief': ['IN THIS MODULE', 'Night Signal — EP', 'Low Orbit (fictional)', 'THE MIX FILES, AS INSPECTED', 'Tide Table', 'Night Signal'],
    'project:problems': ['‹ PREV CARD', 'NEXT CARD ›'],
    'project:checks': ['☐', '☑', 'Ready?', 'REVEAL THE KEY ›', 'Needed:', 'Not this:'],
    'project:sequence': ['ORDER', 'GAP', 'MAX STEP', 'TOTAL', 'THE DELIVERY PLAN', 'Opener first, quiet song last', 'OPENER→QUIET', 'Quiet song in the middle', 'QUIET MID', 'Build to the opener', 'BUILD UP', 'CROSSFADE', 'XF'],
    'project:qc': ['☐', '☑', 'QC complete', 'Delivered', 'KEY TERMS', 'TAKEAWAY', 'FINISH'],
  };
  it('a name list for every step', () => {
    assert.deepEqual(Object.keys(NAMES), ALL.map(([id]) => id));
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const [mod, key] = id.split(':');
      const gt = textOf(guideOf(mod, key));
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab’s source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
});

describe('3. every number TRY THIS quotes is what the step prints', () => {
  it('Module 1: WORKS ON maps REC/EDIT/MIX → TRACKS, MASTER → STEREO, RELEASE → FILES; LOUDER is +8 dB into a −0.3 dBFS ceiling', () => {
    const m = code(`${MA}/modules/mod1What.tsx`);
    assert.match(m, /v: stage <= 2 \? 'TRACKS' : stage === 3 \? 'STEREO' : 'FILES'/);
    assert.match(m, /home: 3/);
    assert.match(m, /const CEILING = -0\.3;/);
    assert.match(m, /process: \{ driveDb: 8, ceilingDb: CEILING \}/);
    assert.match(textOf(guideOf('what', 'listen')), /8 dB[\s\S]*−0\.3 dBFS/);
  });
  it('Module 2: VOCAL → MIXING, WIDTH → EITHER on the ADDRESSED BY cell', () => {
    const cell = (id: string) => C.CONTROL_OWNER_LABEL[C.CONTROL_ITEMS.find((c: { id: string }) => c.id === id).owner].toUpperCase().split(' ')[0];
    assert.equal(cell('vocalLevel'), 'MIXING');
    assert.equal(cell('width'), 'EITHER');
    assert.equal(C.CONTROL_ITEMS.find((c: { id: string }) => c.id === 'vocalLevel').short, 'VOCAL');
    assert.match(code(`${MA}/modules/mod2Roles.tsx`), /CONTROL_OWNER_LABEL\[item\.owner\]\.toUpperCase\(\)\.split\(' '\)\[0\]/);
  });
  it('Module 3 level: 65 dB → BASS −5.3, TREBLE −1.1; 88 → 4 h HOT; 91 → 2 h UNSAFE; 83 → 8 h+ GOOD', () => {
    const s65 = E.perceivedBalanceShift(65);
    assert.equal(s65.bassDb.toFixed(1), '-5.3');
    assert.equal(s65.trebleDb.toFixed(1), '-1.1');
    assert.equal(E.dailyLimitLabel(88), '4 h');
    assert.equal(E.monitoringAdvice(88).tone, 'hot');
    assert.equal(E.dailyLimitLabel(91), '2 h');
    assert.equal(E.monitoringAdvice(91).tone, 'unsafe');
    assert.equal(E.dailyLimitLabel(83), '8 h+');
    assert.equal(E.monitoringAdvice(83).tone, 'sensible');
    assert.equal(E.monitoringAdvice(69).tone, 'low');
    assert.equal(E.monitoringAdvice(70).tone, 'sensible');
    assert.equal(E.monitoringAdvice(84).tone, 'hot');
    assert.equal(E.monitoringAdvice(89).tone, 'unsafe');
    const m = code(`${MA}/modules/mod3Room.tsx`);
    assert.match(m, /useState\(83\)/);
    assert.match(m, /min: 55, max: 100, step: 1/);
    assert.match(m, /advice\.tone === 'sensible' \? 'GOOD' : advice\.tone === 'low' \? 'QUIET' : advice\.tone\.toUpperCase\(\)/);
    const t = textOf(guideOf('room', 'level'));
    assert.match(t, /BASS reads −5\.3 dB and TREBLE −1\.1 dB/);
    assert.match(t, /88 dB: PER DAY reads 4 h, READING HOT\. At 91 dB: 2 h, UNSAFE/);
  });
  it('Module 3 path: five presses of + CONNECT walk DAW → DAC → MON CTL → AMP → PASSIVE and grade COMPLETE; an AMP before ACTIVE grades CHECK', () => {
    const m = code(`${MA}/modules/mod3Room.tsx`);
    const order = [...m.matchAll(/\{ key: '(\w+)', label: PATH_DEVICE_NAMES\.\w+, short: '([^']+)'/g)].map((x) => x[1]);
    assert.deepEqual(order, ['daw', 'dac', 'monitorCtl', 'amp', 'passive', 'active']);
    // The page's own auto-advance: the next device not yet in the chain.
    const firstUnplaced = (chain: string[], after: string) => {
      const start = order.indexOf(after);
      for (let i = 1; i <= order.length; i++) {
        const k = order[(start + i) % order.length];
        if (!chain.includes(k)) return k;
      }
      return after;
    };
    let chain: string[] = [];
    let next = 'daw';
    for (let i = 0; i < 5; i++) {
      chain = [...chain, next];
      next = firstUnplaced(chain, next);
    }
    assert.deepEqual(chain, ['daw', 'dac', 'monitorCtl', 'amp', 'passive']);
    assert.equal(E.checkMonitorPath(chain).grade, 'complete');
    assert.equal(E.checkMonitorPath(['daw', 'dac', 'monitorCtl', 'amp', 'active']).grade, 'fail');
    assert.match(m, /verdict\.grade === 'fail' \? 'CHECK'/);
  });
  it('Module 4 shelf: reset to 0.5 → EQ ±1.5 dB brighter, DYNAMICS 10.5 : 1 (0 dB in → −10.9 dB), STEREO ×1.00 (CORRELATION 0.60 → 0.00 at ×2.00)', () => {
    const m = code(`${MA}/modules/mod4Tools.tsx`);
    const st = code(`${MA}/stages.tsx`);
    assert.match(m, /onSelect: \(id\) => \{ setView\(id as ToolView\); setAmount\(0\.5\); \}/);
    assert.match(m, /case 'eq': return `±\$\{Math\.abs\(a \* 3\)\.toFixed\(1\)\} dB \$\{a > 0 \? 'brighter'/);
    assert.match(m, /case 'dyn': return `\$\{\(1 \+ Math\.max\(0, a\) \* 19\)\.toFixed\(1\)\} : 1`;/);
    assert.match(m, /case 'stereo': return `×\$\{\(Math\.max\(0, a\) \* 2\)\.toFixed\(2\)\}`;/);
    assert.match(m, /dynamicsLawDb\(0, -12, 1 \+ Math\.max\(0, a\) \* 19\)/);
    assert.match(st, /return inDb <= thresholdDb \? inDb : thresholdDb \+ \(inDb - thresholdDb\) \/ ratio;/);
    assert.match(st, /export function widthCorrelation\(widthMult: number, sideRatio = 0\.5\): number \{\n\s*const m = 1;\n\s*const s = sideRatio \* Math\.max\(0, widthMult\);\n\s*return \(m \* m - s \* s\) \/ \(m \* m \+ s \* s\);/);
    const law = (inDb: number, thr: number, r: number) => (inDb <= thr ? inDb : thr + (inDb - thr) / r);
    const corr = (w: number) => (1 - (0.5 * w) ** 2) / (1 + (0.5 * w) ** 2);
    assert.equal(`±${Math.abs(0.5 * 3).toFixed(1)} dB brighter`, '±1.5 dB brighter');
    assert.equal(`${(1 + 0.5 * 19).toFixed(1)} : 1`, '10.5 : 1');
    assert.equal(law(0, -12, 10.5).toFixed(1), '-10.9');
    assert.equal(law(0, -12, 1).toFixed(1), '0.0');
    assert.equal(corr(1).toFixed(2), '0.60');
    assert.equal(corr(2).toFixed(2), '0.00');
    const t = textOf(guideOf('tools', 'shelf'));
    assert.match(t, /×1\.00 up to ×2\.00: CORRELATION falls from 0\.60 to 0\.00/);
    assert.match(t, /RATIO 10\.5 : 1 turns a 0 dB input into −10\.9 dB\. Ride RATIO down to 1\.0 : 1 and it reads 0\.0 dB/);
  });
  it('Module 5: TILT −4…+4 in 0.5 steps from +1.5; +4.0 reads “+4.0 dB end to end (±2.0)”; the trim is +2 dB, the SAFETY ceiling −0.3 dBFS', () => {
    const m = code(`${MA}/modules/mod5Workflow.tsx`);
    assert.match(m, /const \[tilt, setTilt\] = useState\(1\.5\);/);
    assert.match(m, /min: -4, max: 4, step: 0\.5/);
    assert.match(m, /const EQ_TRIM_DB = 2;/);
    const fmtTilt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB end to end (±${(Math.abs(v) / 2).toFixed(1)})`;
    assert.match(m, /const fmtTilt = \(v: number\) => `\$\{v > 0 \? '\+' : ''\}\$\{v\.toFixed\(1\)\} dB end to end \(±\$\{\(Math\.abs\(v\) \/ 2\)\.toFixed\(1\)\}\)`;/);
    assert.equal(fmtTilt(4), '+4.0 dB end to end (±2.0)');
    assert.ok(textOf(guideOf('workflow', 'listen')).includes(fmtTilt(4)));
    assert.equal(E.SAFETY_CEILING_DB, -0.3);
    assert.match(code(`${MA}/masteringContent.ts`), /value: 'NightSignal_Mix_v7_FINAL\.wav'[\s\S]*value: 'v8'/);
  });
  it('Module 6: GAIN −12…+6 moves PEAK, TRUE PK and LUFS by the same amount; DRIVE 0…14 from +6, ceiling −1.0, release 80 ms; the phone system high-passes at 400 Hz and folds to mono', () => {
    const m = code(`${MA}/modules/mod6Loudness.tsx`);
    assert.match(m, /\{ k: 'PEAK', v: `\$\{\(teach\.peak \+ meterGain\)\.toFixed\(1\)\}`/);
    assert.match(m, /\{ k: 'TRUE PK', v: `\$\{\(teach\.tp \+ meterGain\)\.toFixed\(1\)\}`/);
    assert.match(m, /\{ k: 'LUFS', v: `\$\{\(teach\.lufs \+ meterGain\)\.toFixed\(1\)\}`/);
    assert.match(m, /id: 'gain', label: 'GAIN', value: meterGain, min: -12, max: 6, step: 0\.5/);
    assert.match(m, /const \[drive, setDrive\] = useState\(6\);/);
    assert.match(m, /min: 0, max: 14, step: 0\.5/);
    assert.match(m, /const CEILING = -1\.0;/);
    assert.match(m, /RELEASE 80 ms/);
    assert.match(code(`${MA}/stages.tsx`), /\{ id: 'phone', name: 'Phone speaker \(mono\)', bands: \[\{ type: 'highPass', freq: 400,[^\n]*mono: true \}/);
    assert.match(code(`${MA}/stages.tsx`), /\{ id: 'small', name: 'Small speaker', bands: \[\{ type: 'highPass', freq: 150,/);
  });
  it('Module 7: the EP runs 16.8 minutes, 177 MB as Red Book WAV (16-bit, 44.1 kHz, two channels, about 74 minutes)', () => {
    const secs = 232 + 301 + 214 + 258;
    assert.equal((secs / 60).toFixed(1), '16.8');
    assert.equal((E.wavBytes(secs, E.CD_RED_BOOK.sampleRateHz, E.CD_RED_BOOK.bitDepth, E.CD_RED_BOOK.channels) / 1e6).toFixed(0), '177');
    assert.deepEqual(C.PROJECT_TRACKS.map((t: { seconds: number }) => t.seconds).sort(), [214, 232, 258, 301]);
    assert.equal(E.CD_PLAY_MINUTES, 74);
    assert.match(textOf(guideOf('release', 'contexts')), /16\.8 minutes, 177 MB/);
  });
  it('Module 8 brief: Tide Table −19.8 vs Night Signal −12.6 LUFS (7.2 LU); Night Signal peaks at −0.4 dBTP, the closest to 0', () => {
    const by = (title: string) => C.PROJECT_TRACKS.find((t: { title: string }) => t.title === title);
    assert.equal(by('Tide Table').lufsEstimate, -19.8);
    assert.equal(by('Night Signal').lufsEstimate, -12.6);
    assert.equal((by('Night Signal').lufsEstimate - by('Tide Table').lufsEstimate).toFixed(1), '7.2');
    const tp = C.PROJECT_TRACKS.map((t: { truePeakDb: number }) => t.truePeakDb);
    assert.equal(Math.max(...tp), by('Night Signal').truePeakDb);
    assert.equal(by('Night Signal').truePeakDb, -0.4);
  });
  it('Module 8 sequence: OPENER→QUIET at 2.0 s → MAX STEP 5.9 LU, TOTAL 16:51; QUIET MID 7.2 LU (amber over 6); CROSSFADE → XF, 16:39', () => {
    const tracks = (seqId: string) =>
      C.PROJECT_SEQUENCES.find((s: { id: string }) => s.id === seqId).order.map((id: string) => {
        const t = C.PROJECT_TRACKS.find((x: { id: string }) => x.id === id);
        return { id: t.id, title: t.title, seconds: t.seconds, lufs: t.lufsEstimate, fadeOutSec: 5 };
      });
    const total = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
    const s1 = tracks('s1');
    assert.equal(C.PROJECT_SEQUENCES[0].short, 'OPENER→QUIET');
    assert.equal(E.maxLoudnessStep(s1).toFixed(1), '5.9');
    assert.equal(total(E.layoutSequence(s1, 2, false).totalSec), '16:51');
    assert.equal(total(E.layoutSequence(s1, 2, true).totalSec), '16:39');
    assert.equal(E.maxLoudnessStep(tracks('s2')).toFixed(1), '7.2');
    const m = code(`${MA}/modules/mod8Project.tsx`);
    assert.match(m, /const \[gap, setGap\] = useState\(2\);/);
    assert.match(m, /tint: step > 6 \? colors\.amber : colors\.green/);
    assert.match(m, /v: crossfade \? 'XF' : `\$\{gap\.toFixed\(1\)\} s`/);
    assert.match(m, /min: 0, max: 6, step: 0\.5/);
    const t = textOf(guideOf('project', 'sequence'));
    assert.match(t, /MAX STEP reads 5\.9 LU and TOTAL 16:51\. Switch to QUIET MID: 7\.2 LU, in amber/);
    assert.match(t, /GAP reads XF and TOTAL drops to 16:39/);
  });
});

describe('4. wiring: the step’s guide reaches the header; the host wraps the screen', () => {
  const S = code(`${MA}/MasteringLabScreen.tsx`);
  it('imports and asks masteringStepGuide for the step on screen; none on the what’s-left screen', () => {
    assert.match(S, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(S, /import \{ masteringStepGuide \} from '\.\/masteringScreenGuides';/);
    assert.match(S, /const stepGuide = endState \? undefined : masteringStepGuide\(mod\.id, stepIdx\);/);
  });
  it('LabHeader carries the guide and its step title; the host resets per step and measures regions only on rack steps', () => {
    assert.match(S, /<LabHeader[\s\S]*?guide=\{stepGuide\?\.guide\}\s*guideTitle=\{stepGuide\?\.title\.toUpperCase\(\)\}\s*\/>/);
    assert.match(S, /<ScreenGuideHost resetKey=\{endState \? 'end' : `\$\{mod\.id\}:\$\{stepIdx\}`\} regions=\{!!stepGuide\?\.rack\}>/);
    assert.match(S, /<\/ScreenGuideHost>\n\s*<\/View>\s*(\{\})?\s*<ProNoteIntro \/>/);
  });
});

describe('5. the accuracy chip: KEPT — real measurement numbers on screen', () => {
  it('the header keeps the compact AccuracyNote with the lab’s own detail', () => {
    assert.match(code(`${MA}/MasteringLabScreen.tsx`), /right=\{<AccuracyNote compact detail=\{ACCURACY_DETAIL\} \/>\}/);
  });
  it('the reason is on screen: LUFS / TRUE PK / PLR bezels and the NIOSH daily limit', () => {
    assert.match(code(`${MA}/kit.tsx`), /\{ k: 'LUFS', v: m \? `\$\{m\.lufs\.toFixed\(1\)\}`/);
    assert.match(code(`${MA}/modules/mod3Room.tsx`), /\{ k: 'PER DAY', v: dailyLimitLabel\(level\)/);
  });
});
