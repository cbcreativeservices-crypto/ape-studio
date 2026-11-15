/**
 * Beginner waves 1-3 (2026-11-15), group F6b: Cable & Connector Fundamentals,
 * Audio Connectors & Cable Selection, Cable Dressing & Installation, Vacuum
 * Tube Fundamentals, Amplifier Principles, Audio Calculator Laboratory.
 * Owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan). Each block
 * would have failed before its change.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path, { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The calculator registry imports its workspaces without extensions.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const CAB = 'src/screens/lab/cable/';
const CS = 'src/screens/lab/connectorselect/';
const CI = 'src/screens/lab/cableinstall/';
const TUBE = 'src/screens/lab/tube/';
const AMP = 'src/screens/lab/amp/';
const CALC = 'src/screens/lab/calc/';
/** The source with comments removed, so a test never passes on a comment. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('Cable & Connector Fundamentals', () => {
  it('CF-01: every connector record in lessons 5, 6, 7 (and every ALSO RECOGNIZE card) opens folded', () => {
    for (const f of ['lesson05.tsx', 'lesson06.tsx', 'lesson07.tsx']) {
      const s = code(`${CAB}lessons/${f}`);
      assert.doesNotMatch(s, /<ConnectorCard rec=\{\w+\} \/>/, `${f}: an unfolded record is left`);
      assert.match(s, /<ConnectorCard rec=\{\w+\} folded \/>/, f);
    }
    assert.match(code(`${CAB}lessons/connectorCard.tsx`), /\{selected \? <ConnectorCard rec=\{selected\} folded \/> : null\}/);
  });
  it('CF-01: lesson 6 shows each card’s first paragraph; the rest folds under GO DEEPER', () => {
    const s = code(`${CAB}lessons/lesson06.tsx`);
    assert.match(s, /<Text style=\{s\.body\}>\{strip\.paras\[0\]\}<\/Text>/);
    assert.match(s, /<GoDeeper hint=[\s\S]*strip\.paras\.slice\(1\)\.map/);
    assert.doesNotMatch(s, /\{strip\.paras\.map\(/);
    const d = read(`${CAB}data/lesson06.ts`);
    const eth = d.slice(d.indexOf("id: 'ethernet_concept'"));
    assert.ok(eth.indexOf('The connector proves NOTHING about the protocol') < eth.indexOf('T568A and T568B are BOTH valid'), 'the title’s promise is the paragraph shown');
  });
  it('CF-01: lesson 7’s never list shows four rules; the others are one tap away (nothing removed)', async () => {
    const s = code(`${CAB}lessons/lesson07.tsx`);
    assert.match(s, /export const NEVER_SHOWN = 4;/);
    assert.match(s, /NEVER_ITEMS\.slice\(0, NEVER_SHOWN\)/);
    assert.match(s, /<GoDeeper hint=[^>]*>\s*\{NEVER_ITEMS\.slice\(NEVER_SHOWN\)/);
    const g = (await import(`../${CAB}cableScreenGuides.ts`)).CABLE_SCREEN_GUIDES;
    assert.doesNotMatch(g.l06_digital.seeing.join(' '), /always show in full/);
  });
  it('CF-04 + CF-02: lesson 1 opens on one line and the first question; the twelve categories follow in AUDIO / DATA / POWER', async () => {
    const s = code(`${CAB}lessons/lesson01.tsx`);
    assert.ok(s.indexOf('{L01_OPENING}') < s.indexOf('WHAT MUST TRAVEL HERE?'), 'the opening line comes first');
    assert.ok(s.indexOf('WHAT MUST TRAVEL HERE?') < s.indexOf('WHAT CAN TRAVEL THROUGH A CABLE?'), 'the question before the categories');
    assert.doesNotMatch(s, /Twelve different things ride cables/);
    assert.match(s, /How big an audio signal is, is called its level\./);
    const groups = [...s.matchAll(/\{ title: '(\w+)', ids: \[([^\]]+)\] \}/g)];
    assert.deepEqual(groups.map((g) => g[1]), ['AUDIO', 'DATA', 'POWER']);
    const ids = groups.flatMap((g) => [...g[2].matchAll(/'(\w+)'/g)].map((m) => m[1]));
    const { CARRIED_CATEGORIES } = await import(`../${CAB}data/lesson01.ts`);
    const all = CARRIED_CATEGORIES.map((c: { id: string }) => c.id);
    assert.deepEqual([...ids].sort(), [...all].sort(), 'every category, once');
  });
  it('CF-02: powered / passive, protocol and OPEN / CLOSED each get one plain line where they matter', () => {
    assert.match(code(`${CAB}lessons/lesson05.tsx`), /Powered = the amplifier is\s+inside the box; passive = the amplifier is a separate box\./);
    assert.match(code(`${CAB}lessons/lesson06.tsx`), /A protocol is the data language both devices must speak/);
    const t = code(`${CAB}lessons/lesson10.tsx`);
    assert.match(t, /export const MAP_KEY = 'CLOSED = connected · OPEN = a gap, no path';/);
    assert.ok(t.indexOf('{MAP_KEY}') < t.indexOf('>PATH<'), 'the key sits above the map header');
    assert.doesNotMatch(t, /Connect each one to the tester, read the continuity map/, 'the bench lead paid for the line');
  });
  it('CF-05: the first card names signal level (verbatim glossary row), not the cable builds', async () => {
    const { LAB_TERM_ENTRIES } = await import('../src/features/intro/labTermIntroData.ts');
    const e = LAB_TERM_ENTRIES.CableLab;
    assert.equal(e.status, 'wired');
    if (e.status !== 'wired') return;
    assert.equal(e.term, 'Audio levels');
    assert.equal(e.glossaryId, '3ff09ee6-7282-4506-8957-d3922be6fdd6');
    assert.doesNotMatch(e.plainEnglish, /shielding|strain relief|gauge|coax/);
  });
});

describe('Audio Connectors & Cable Selection', () => {
  const A = code(`${CS}pagesA.tsx`);
  const p1 = A.slice(A.indexOf('function PageThreeThings'), A.indexOf('function PageSamePlug'));
  it('CS-05: the opening line names the four questions; the photo, then the questions, come before the parts', () => {
    assert.match(A, /Every time, ask four questions: does it fit, what signal, which cable, is it safe\?/);
    const lead = p1.indexOf('<Lead>{CS_OPENING}</Lead>');
    const photo = p1.indexOf('<LabPhoto');
    const qs = p1.indexOf('ASK THESE FOUR QUESTIONS');
    const parts = p1.indexOf('THE EXPLODED CABLE');
    assert.ok(lead > 0 && lead < photo && photo < qs && qs < parts, 'line → photo → four questions → parts');
  });
  it('CS-06: one line places this lab beside its sister lab; the photo caption went to pay for it', () => {
    assert.match(A, /This is the choosing lab\. Cable & Connector Fundamentals is the naming lab\. Either one can come first\./);
    assert.match(p1, /\{CS_SISTER_LINE\}/);
    assert.doesNotMatch(p1, /caption="STRIPPED BACK/);
  });
  it('CS-02: balanced, protocol, phantom power and DI are said in plain words where they first appear', () => {
    assert.match(A, /mode === 'balanced' \? <Text style=\{styles\.factValue\}>\{CS_BALANCED_LINE\}<\/Text> : null/);
    assert.match(A, /one copy flipped, so noise picked up on the way cancels at the input/);
    const r = read(`${CS}data/roster.ts`);
    assert.match(r, /a protocol is the data language both ends speak/);
    assert.match(r, /phantom power \(the \+48 V a mixer sends up a mic cable\)/);
    assert.match(read(`${CS}data/scenarios.ts`), /a DI box \(it turns the guitar’s signal into a balanced mic-level line\)/);
  });
});

describe('Cable Dressing & Installation', async () => {
  const T = await import(`../${CI}tapRects.ts`);
  it('SH-49: close markers no longer share a tap square; each marker stays inside its own', () => {
    // The rack findings at a 358-wide drawing: ins-13 (92,58) and ins-17 (94,52) sit 7 pt and 14 pt apart.
    const w = 358;
    const h = (w * 240) / 360;
    const pts = [
      [88, 66], [92, 58], [86, 50], [90, 44], [84, 38], [94, 52], [88, 30], [12, 78], [22, 84], [8, 70], [30, 80],
    ].map(([x, y]) => ({ x: (x / 100) * w, y: (y / 100) * h }));
    const rects = T.splitTapRects(pts);
    const overlap = (a: (typeof rects)[number], b: (typeof rects)[number]) =>
      a.left < b.left + b.width - 1e-9 && b.left < a.left + a.width - 1e-9 && a.top < b.top + b.height - 1e-9 && b.top < a.top + a.height - 1e-9;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      assert.ok(pts[i].x > r.left && pts[i].x < r.left + r.width && pts[i].y > r.top && pts[i].y < r.top + r.height, `marker ${i} inside its square`);
      for (let j = i + 1; j < rects.length; j++) assert.ok(!overlap(r, rects[j]), `squares ${i} and ${j} overlap`);
    }
    // A marker with room keeps the full 44-pt square.
    const lone = T.splitTapRects([{ x: 50, y: 50 }, { x: 200, y: 50 }]);
    assert.deepEqual(lone[0], { left: 28, top: 28, width: 44, height: 44 });
    const s = code(`${CI}scenes/InspectScene.tsx`);
    assert.match(s, /splitTapRects\(defects\.map\(\(d\) => \(\{ x: \(d\.x \/ 100\) \* w, y: \(d\.y \/ 100\) \* h \}\)\)\)\.map\(\(r, i\) =>/);
    assert.doesNotMatch(s, /width: 44, height: 44 \}\}\s*accessibilityRole="button"\s*accessibilityLabel=\{`Finding/);
    assert.doesNotMatch(s, /'#8a4a44'/, 'the dull unfound ring is gone');
  });
  it('CI-01: stage 6 drops the 90-word note; the class colors fold below the work', () => {
    const s = code(`${CI}scenes/RackScene.tsx`);
    assert.doesNotMatch(s, /reverse-racked|punch-downs|PDU \(power distribution unit\)/);
    assert.match(s, /<CollapsibleSection title="COLOR KEY · TEACHING COLORS" startOpen=\{false\}>/);
    assert.ok(s.indexOf('COLOR KEY · TEACHING COLORS') > s.indexOf('PHASE A — INSPECT'), 'below the drawing, not above it');
  });
  it('CI-01: stage 8 folds its own key and flags it on the drawing; stage 9 folds its long key', () => {
    const c = code(`${CI}scenes/CeilingScene.tsx`);
    assert.match(c, /<CollapsibleSection title="COLOR KEY · THIS SCENE’S OWN COLORS" startOpen=\{false\}>/);
    assert.match(c, /\{above \? \(\s*<View pointerEvents="none" style=\{styles\.ownColorsTag\}>\s*<Text style=\{styles\.ownColorsText\}>\{CEILING_OWN_COLORS_TAG\}<\/Text>/);
    assert.match(c, /ownColorsText: \{[^}]*fontSize: 9,/);
    const f = code(`${CI}scenes/FloorScene.tsx`);
    assert.match(f, /<CollapsibleSection title="COLOR KEY · TEACHING COLORS" startOpen=\{false\}>\s*<Text style=\{s\.caption\}>\s*Training visualization — stage plot to scale/);
  });
  it('CI-02: a stage-6 find is explained under the drawing, before the counter and the suspect list', () => {
    const s = code(`${CI}scenes/RackScene.tsx`);
    const a = s.slice(s.indexOf('PHASE A — INSPECT'), s.indexOf("phase === 'b'"));
    const fb = a.indexOf('styles.foundLabel');
    assert.ok(fb > 0 && fb < a.indexOf('\n          {aCounter}\n') && fb < a.indexOf('SUSPECT LIST'), 'feedback first');
    assert.equal((a.match(/styles\.foundLabel/g) ?? []).length, 1, 'drawn once');
  });
  it('CI-02: stage 2 says why each call locks (scoring unchanged)', () => {
    const s = code(`${CI}scenes/KnowScene.tsx`);
    assert.match(s, /Your first call on each question is the one that scores, so it locks; the card then shows the right call\./);
    assert.match(s, /if \(cur\[field\] != null\) return;/, 'the lock itself is unchanged');
  });
  it('CI-04: a fresh open lands on Stage 1; the long lead and the code note sit behind SOURCES / STANDARDS', () => {
    const s = code(`${CI}CableInstallLabScreen.tsx`);
    assert.match(s, /const \[step, setStep\] = useState\(FIRST_STAGE_STEP\);/);
    assert.match(s, /export const FIRST_STAGE_STEP = INTRO_STEP \+ 1;/);
    const intro = s.slice(s.indexOf('function IntroStage'), s.indexOf('function IntroScene'));
    assert.doesNotMatch(intro, /Professional cable installation is not|CI_GOVERN_NOTE/);
    assert.match(s, /const CI_INTRO_SOURCES_LEAD: readonly string\[\] = \[CI_INTRO_LEAD, CI_GOVERN_NOTE\];/);
    assert.match(code(`${CI}bits.tsx`), /\{lead\?\.map\(\(t\) => \(\s*<Text key=\{t\} style=\{styles\.srcNote\}>\{t\}<\/Text>/);
    // Stage 1 opens on the close-ups; the six cards follow; the finish waits for both.
    const w = code(`${CI}scenes/WhyScene.tsx`);
    assert.ok(w.indexOf('WHICH INSTALLATION WOULD YOU APPROVE?') < w.indexOf('SIX THINGS RIDING ON EVERY RUN'));
    assert.ok(w.indexOf('SIX THINGS RIDING ON EVERY RUN') < w.indexOf('MARK STAGE COMPLETE ✓'));
    assert.match(w, /Open all six consequences below/);
  });
  it('CI-03: trade words get their meaning inside the sentence where they first appear', async () => {
    assert.match(code(`${CI}scenes/MechScene.tsx`), /counted in OD: the cable's outside\s+diameter/);
    assert.match(code(`${CI}scenes/MechScene.tsx`), /pull events \(moments while cable is pulled through its route\)/);
    assert.match(code(`${CI}scenes/WallsScene.tsx`), /raceway = a channel fixed to the wall that holds\s+cable/);
    assert.match(code(`${CI}scenes/CeilingScene.tsx`), /return-air plenum \(a space the building’s air flows back through\)/);
    assert.match(code(`${CI}scenes/FloorScene.tsx`), /SR \/ SL = stage right \/ stage left/);
    assert.match(read(`${CI}data/scenarios.ts`), /record the added fill \(how much of its space cable now takes\)/);
    assert.match(read(`${CI}registry.ts`), /rated assemblies \(walls and floors built to hold back fire\), air-handling spaces \(where building air flows\), risers \(shafts between floors\)/);
  });
});

describe('Vacuum Tube Fundamentals', () => {
  const S = code(`${TUBE}VacuumTubeLabScreen.tsx`);
  it('TB-01: the lesson row and the guides point at visible help, never long-press', async () => {
    assert.doesNotMatch(S, /every control long-presses for its own entry/);
    assert.match(S, /<Text style=\{styles\.lessonRowText\}>\{TUBE_LESSON_ROW\}<\/Text>/);
    const g = read(`${TUBE}tubeScreenGuides.ts`);
    assert.doesNotMatch(g, /Long-press \$\{control\}/);
    for (const k of ['PARTS', 'SUPPLY', 'TYPE']) assert.match(g, new RegExp(`dockTail\\('${k}', true\\)`), k);
    const { TUBE_SCREEN_GUIDES } = await import(`../${TUBE}tubeScreenGuides.ts`);
    assert.match(TUBE_SCREEN_GUIDES.grid.control.join(' '), /Tap ⓘ GUIDED LESSON under the lesson to read about GRID V/);
  });
  it('TB-04: module 1 opens with what a tube is and ONE instruction; PARTS reads START HERE until a part is tapped', () => {
    assert.match(S, /A tube is a valve for electrons: a tiny voltage controls a big flow\. Open PARTS and tap a part to take it out and see what stops working\./);
    assert.match(S, /blurb: TUBE_INSIDE_BLURB, Comp: InsideSection/);
    assert.doesNotMatch(S, /tap each piece to learn its job|tap a part to REMOVE it|Drawn as a pentode/);
    assert.match(S, /valueLabel: touched\.size === 0 \? 'START HERE' :/);
  });
  it('TB-05: removing the control grid is said big, with the way to module 2', () => {
    assert.match(S, /export const NO_GRID_RESULT = 'No grid → the flow can’t be controlled → no amplifier';/);
    assert.match(S, /firstMissing\?\.key === 'grid' \? \(\s*<View style=\{\{ gap: 6 \}\}>\s*<Text style=\{styles\.bigResult\}/);
    assert.match(S, /bigResult: \{[^}]*fontSize: 19/);
    assert.match(S, /onNext: sectionIdx < SECTIONS\.length - 1 \? \(\) => openSection\(sectionIdx \+ 1\) : undefined/);
  });
  it('TB-02: GRID V says what its % measures and its ends read in words; the graphs name their axes', () => {
    assert.match(S, /format: \(x\) => `\$\{pct\(x\)\} open · \$\{word\(x\)\}`/);
    assert.match(S, /nudges: gridNudges\(v, setV\)/);
    assert.match(S, /label: '◂ CLOSES'[\s\S]*label: 'OPENS ▸'/);
    const v = code(`${TUBE}viz.tsx`);
    for (const fn of ['BiasView', 'SaturationView']) {
      const body = v.slice(v.indexOf(`export function ${fn}(`), v.indexOf('\n// ───', v.indexOf(`export function ${fn}(`)));
      assert.match(body, /\{TUBE_AXIS_IN\}/, fn);
      assert.match(body, /\{TUBE_AXIS_OUT\}/, fn);
      assert.match(body, /fontSize: 9 \* ts/, `${fn}: 9 pt`);
    }
  });
});

describe('Amplifier Principles', () => {
  it('AMPL-02 + AMPL-06: module 1 shows OUTPUT and SUPPLY only, with the guess-first prompt on top', () => {
    const s = code(`${AMP}modules/mod1What.tsx`);
    assert.match(s, /\.\.\.rigStatusBezel\(pic, MOD1_BEZEL\)/);
    assert.match(s, /export const MOD1_BEZEL: \('supply' \| 'heat' \| 'eff' \| 'load'\)\[\] = \['supply'\];/);
    const well = s.slice(s.indexOf('well: ('));
    assert.ok(well.indexOf('PREDICT, THEN TRY') < well.indexOf('does not enlarge the input signal'), 'the prompt is first');
  });
  it('AMPL-02: module 4 shows the three readouts its lesson names', () => {
    const s = code(`${AMP}modules/mod4Classes.tsx`);
    const bz = s.slice(s.indexOf('bezel: ['), s.indexOf('],', s.indexOf('bezel: [')));
    assert.deepEqual([...bz.matchAll(/k: '([^']+)'/g)].map((m) => m[1]), ['CONDUCT.', 'DISTORT.']);
    assert.match(bz, /\.\.\.rigStatusBezel\(pic, \['eff'\]\)/);
  });
  it('AMPL-03: the home folds the final check under its own title', () => {
    const s = code(`${AMP}AmpLabHomeScreen.tsx`);
    assert.match(s, /export const AMP_FINAL_CHECK_TITLE = 'FINAL CHECK: AFTER THE MODULES';/);
    const scroll = s.slice(s.indexOf('<ScrollView'));
    assert.match(scroll, /<LearnMore title=\{AMP_FINAL_CHECK_TITLE\}>\s*<LabUnderstandingBlock labId="amp" labTitle="Amp Lab" \/>\s*<\/LearnMore>/);
    assert.equal((scroll.match(/<LabUnderstandingBlock/g) ?? []).length, 1, 'never open on the home');
  });
  it('AMPL-05: the home opens on the steer-and-pay line', () => {
    const s = code(`${AMP}AmpLabHomeScreen.tsx`);
    assert.match(s, /export const AMP_HOME_LINE =\s*'The power supply pays, your signal steers\./);
    assert.doesNotMatch(s, /One question runs through every module/);
    assert.ok(s.indexOf('{AMP_HOME_LINE}') < s.indexOf('styles.resumeBtn'), 'above START');
  });
  it('AMPL-01: formulas sit under LEARN MORE; modules 2, 5 and 6 open with plain words first', () => {
    const m1 = code(`${AMP}modules/mod1What.tsx`);
    const lm = m1.indexOf('<LearnMore>');
    assert.ok(m1.indexOf('title="Three kinds of gain"') > lm, 'gain card inside LEARN MORE');
    const card = m1.slice(m1.indexOf('APPLIED COMPARISON'), lm);
    assert.doesNotMatch(card, /P = /, 'no arithmetic in the main card');
    assert.match(m1.slice(lm), /P = Vrms²\/R\. Line out: \{lineVrms\.toFixed\(2\)\}² ÷ 8 ≈\{' '\}\s*\{linePower\.toFixed\(3\)\} W\. Power amp: \{ampVrms\.toFixed\(1\)\}² ÷ 8 = \{ampPower\.toFixed\(0\)\} W\./);
    const m2 = code(`${AMP}modules/mod2Devices.tsx`);
    assert.ok(m2.indexOf('<Body>{MOD2_TRANSFORMER_PLAIN}</Body>') < m2.indexOf('title="Ideal transformer"'));
    assert.ok(m2.indexOf('<LearnMore title="THE FORMULAS · IMPEDANCE TRANSFORMATION">') < m2.indexOf('title="Ideal transformer"'));
    assert.match(code(`${AMP}modules/mod5ClassD.tsx`), /Think of a light switch flicked on and off so fast the lamp only looks dimmed/);
    const m6 = code(`${AMP}modules/mod6Supply.tsx`);
    assert.ok(m6.indexOf('<Body>{MOD6_LOAD_PLAIN}</Body>') < m6.indexOf('<LearnMore title="THE FORMULAS">'));
    assert.ok(m6.indexOf('<LearnMore title="THE FORMULAS">') < m6.indexOf('Vrms = Vpeak / √2'));
  });
  it('SH-36 / SH-76: figure docks use the dock key’s name; every ANGLE choice has a one-line meaning', () => {
    assert.match(code(`${AMP}modules/mod1What.tsx`), /label="LEVEL · input level"/);
    assert.match(code(`${AMP}modules/mod3Bias.tsx`), /label="BIAS · output-stage overlap"/);
    assert.match(code(`${AMP}modules/mod4Classes.tsx`), /label="AB BIAS · 0% is the Class B condition"/);
    const angle = code(`${AMP}modules/mod3Bias.tsx`).match(/\{ key: (90|180|270|360), label: '[^']+', short: '[^']+', blurb: '[^']+' \}/g) ?? [];
    assert.equal(angle.length, 4);
  });
});

describe('Audio Calculator Laboratory', async () => {
  const { WORKSPACES } = await import(`../${CALC}registry.ts`);
  const U = await import(`../${CALC}calcUnits.ts`);
  it('CA-03: every SAMPLE RATE box asks in kHz; the value it feeds the equations is unchanged', () => {
    const sr = WORKSPACES.flatMap((w: { id: string; fields: { key: string; name: string; quantity: string; defaultUnit?: string; placeholder?: string }[] }) =>
      w.fields.filter((f) => f.quantity === 'samplerate').map((f) => ({ ws: w.id, ...f })));
    assert.ok(sr.length >= 10, `found ${sr.length}`);
    for (const f of sr) {
      assert.equal(f.defaultUnit, 'srkhz', `${f.ws}.${f.key}`);
      assert.equal(f.placeholder, '48', `${f.ws}.${f.key}`);
    }
    const units = U.unitsFor('samplerate');
    const khz = units.find((u: { id: string }) => u.id === 'srkhz')!;
    const hz = units.find((u: { id: string }) => u.id === 'srhz')!;
    assert.equal(khz.toBase(48), hz.toBase(48000), '48 kHz = 48000 Hz, the same base value');
    assert.equal(khz.toBase(44.1), 44100);
  });
  it('CA-04: the home opens with three jobs, each a real built-in template; then all 166 calculators by topic', async () => {
    const J = await import(`../${CALC}startJobs.ts`);
    const { WORKFLOW_TEMPLATES } = await import(`../${CALC}workflowCatalog.ts`);
    assert.equal(J.CALC_START_TITLE, 'PICK A JOB, GET A NUMBER YOU CAN USE');
    assert.equal(J.CALC_START_JOBS.length, 3);
    for (const j of J.CALC_START_JOBS) {
      const t = WORKFLOW_TEMPLATES.find((w: { id: string }) => w.id === j.templateId);
      assert.ok(t, j.templateId);
      assert.equal(t.steps[0].workspaceId, j.firstWorkspaceId, `${j.templateId}: a non-member opens its first calculator`);
      assert.ok(WORKSPACES.some((w: { id: string }) => w.id === j.firstWorkspaceId));
    }
    const total = WORKSPACES.reduce((n: number, w: { functions: unknown[] }) => n + w.functions.length, 0);
    assert.equal(total, 166, 'the app says 166 calculators everywhere');
    assert.equal(J.calcBrowseTitle(total), 'OR BROWSE ALL 166 CALCULATORS BY TOPIC');
    const s = code(`${CALC}CalcLabScreen.tsx`);
    const scroll = s.slice(s.indexOf('<ScrollView'));
    assert.ok(scroll.indexOf('{CALC_START_TITLE}') < scroll.indexOf('CUSTOM CALCULATOR WORKFLOWS'), 'the jobs come first');
    assert.ok(scroll.indexOf('{calcBrowseTitle(CALC_TOTAL)}') < scroll.indexOf('<GlassPanel'));
    assert.match(s, /if \(workflowsAllowed\) navigation\.navigate\('CalcWorkflowRun', \{ id: j\.templateId \}\);\s*else if \(tierUnconfirmed\) gateWorkflow\(\(\) => \{\}\);\s*else navigation\.navigate\('CalcWorkspace', \{ id: j\.firstWorkspaceId \}\);/);
    assert.match(s, /const \[descOpen, setDescOpen\] = useState\(false\);/, 'ABOUT folds to pay for the block');
  });
});
