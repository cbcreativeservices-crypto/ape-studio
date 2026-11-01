/**
 * Screen Guide rollout — Amplifier Principles Lab (owner 2026-10-31) —
 * receipts. Pattern: test/screenGuide_20261031.test.ts (the Wave pilot).
 *
 * The screens a learner reaches, and their guides:
 *   the lab home (AmpLabHomeScreen) → AMP_HOME_GUIDE;
 *   every STEP of every module (AmpModuleScreen hosts the module, and each
 *   step — a rack rig/diagram or a read document — is its own screen) →
 *   AMP_STEP_GUIDES[module][step index], whose key/kind must match the
 *   module's own step list;
 *   the what's-left screen (from the home's SEE WHAT'S LEFT › or the last
 *   module's FINISH) → AMP_END_GUIDE.
 *
 * Chip decision (owner rule 2026-10-31: level readouts and calculators keep
 * the chip): the module screens print numbers a learner could carry to a real
 * rack — Module 6's volts, amps and watts, Module 7's gain-structure meters,
 * speaker-load Ω and power figures — so the module header KEEPS its
 * AccuracyNote ("teaching tools, not bench measurements") with the ⓘ beside
 * it. The lab home shows no numbers: the ⓘ alone, plus its own lethal-voltage
 * safety note. (Guide-review round 2026-10-31 restored the module chip; the
 * shared receipt R7-AMP-03 in test/wiringFix_r8_text_20261021 pins its text.)
 *
 *   1. every screen has a guide (step lists match the modules): five
 *      sections, 1–5 bullets, 2–3 TRY THIS, house copy rules;
 *   2. every step within its no-scroll budget;
 *   3. each pinned on-screen name is in the guide AND in that module's code;
 *   4. the TRY THIS numbers are recomputed from ampModel exactly as the
 *      module computes them;
 *   5. wiring + the chip decision.
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

const G = await import('../src/screens/lab/amp/ampScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const C = await import('../src/features/amp/ampContent.ts');
const M = await import('../src/features/amp/ampModel.ts');

type Guide = Record<string, string[]>;
type Step = { key: string; kind: 'rack' | 'read'; guide: Guide };
const STEPS = G.AMP_STEP_GUIDES as unknown as Record<string, Step[]>;
const ALL: [string, Guide][] = [
  ['home', G.AMP_HOME_GUIDE as unknown as Guide],
  ['end', G.AMP_END_GUIDE as unknown as Guide],
  ...Object.entries(STEPS).flatMap(([mod, steps]) => steps.map((s) => [`${mod}.${s.key}`, s.guide] as [string, Guide])),
];
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const guideOf = (mod: string, key: string) => {
  const s = STEPS[mod].find((x) => x.key === key);
  assert.ok(s, `${mod}.${key}: no guide`);
  return s!.guide;
};
const pct = (v: number) => `${Math.round(v * 100)}%`;
const heatWord = (h: number) => (h < 0.35 ? 'cool' : h < 0.6 ? 'warm' : h < 0.8 ? 'hot' : 'DANGER');

const MOD_FILE: Record<string, string> = {
  what: 'mod1What', devices: 'mod2Devices', bias: 'mod3Bias', classes: 'mod4Classes',
  classd: 'mod5ClassD', supply: 'mod6Supply', realworld: 'mod7RealWorld', apply: 'mod8Apply',
};
const modSrc = (id: string) => code(`src/screens/lab/amp/modules/${MOD_FILE[id]}.tsx`);
const HOME = code('src/screens/lab/amp/AmpLabHomeScreen.tsx');
const HOST = code('src/screens/lab/amp/AmpModuleScreen.tsx');
const RIG = code('src/screens/lab/amp/AmpRig.tsx');
const RACK = code('src/screens/lab/amp/AmpRack.tsx');

describe('1. every Amplifier Principles screen has a complete guide', () => {
  it('a step list for every module, and nothing for a module that does not exist', () => {
    const ids = (C.AMP_MODULES as { id: string }[]).map((m) => m.id);
    assert.deepEqual(Object.keys(STEPS), ids);
    assert.deepEqual(Object.keys(MOD_FILE), ids);
    assert.match(code('src/screens/lab/amp/modules/index.ts'), /what: Mod1What,\s*devices: Mod2Devices,\s*bias: Mod3Bias,\s*classes: Mod4Classes,\s*classd: Mod5ClassD,\s*supply: Mod6Supply,\s*realworld: Mod7RealWorld,\s*apply: Mod8Apply,/);
  });
  for (const id of Object.keys(MOD_FILE)) {
    it(`${id}: one guide per step, same keys, kinds and order as the module declares`, () => {
      const declared = [...modSrc(id).matchAll(/key: '(\w+)',\s*title: '[^']+',\s*kind: '(rack|read)'/g)].map((m) => ({ key: m[1], kind: m[2] }));
      assert.ok(declared.length >= 1, `${id}: no steps found`);
      assert.deepEqual(STEPS[id].map((s) => ({ key: s.key, kind: s.kind })), declared);
    });
  }
  it('ampStepGuide() is the step at that index', () => {
    assert.equal(G.ampStepGuide('bias', 2)?.key, 'pushpull');
    assert.equal(G.ampStepGuide('apply', 3)?.key, 'final');
    assert.equal(G.ampStepGuide('what', 5), undefined);
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
      assert.doesNotMatch(t, /\b(Crown|QSC|Lab\.gruppen|Powersoft|Crest|Yamaha|Behringer|Fender|Marshall|Texas Instruments|Infineon)\b/, `${id}: a maker/brand name`);
    }
  });
  it('the first step of every module says where it sits in the lab, and the home says where the lab sits', () => {
    assert.match(G.AMP_HOME_GUIDE.teaches.join(' '), /follows Vacuum Tube Fundamentals in Audio Electronics/);
    for (const [id, steps] of Object.entries(STEPS)) {
      const t = steps.map((s) => s.guide.teaches.join(' ')).join(' ');
      assert.match(t, /(comes next|The first module|draws on|last step|Module \d)/, `${id}: no place in the sequence`);
    }
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
  const NAMES: Record<string, string[]> = {
    'what.rig': ["'OUTPUT'", "'CLEAN'", "'CLIP'", "label: 'LEVEL'", 'PREDICT, THEN TRY', 'SIGNAL PATH', 'APPLIED COMPARISON', 'Line out → speaker'],
    'devices.device': ["label: 'CONTROL'", "label: 'DEVICE'", "k: 'REGION'", "short: 'OFF'", "short: 'CONTROL'", "short: 'FULL'", "k: 'CURRENT'", 'CONTROLLED CURRENT', 'SUPPLY', 'LOAD', "generic: 'Generic'", "bjt: 'BJT'", "mosfet: 'MOSFET'", "tube: 'Tube'"],
    'devices.xfmr': ["label: 'Np'", "label: 'Ns'", "k: 'KIND'", "k: 'RATIO'", "k: 'Vs'", "k: 'Is'", 'PRIMARY · Np', 'SECONDARY · Ns', 'CORE', "'STEP-UP'", "'STEP-DOWN'", "'1:1 ISOLATION'"],
    'bias.bias': ["label: 'BIAS'", "k: 'REGION'", "'CUTOFF'", "'SATUR.'", "'LINEAR'", "k: 'IDLE'", 'DEVICE CURRENT (gold) — 0 to full conduction only', 'TOO LITTLE BIAS', 'APPROPRIATE LINEAR BIAS', 'EXCESSIVE BIAS'],
    'bias.angle': ["label: 'ANGLE'", "k: 'CLASS'", "label: '90° · C'", "label: '180° · B'", "label: '270° · AB'", "label: '360° · A'"],
    'bias.pushpull': ["k: 'HANDOFF'", "'NOTCH'", "'OVERBIAS'", "'CLEAN'", 'YOUR TASK', 'ZERO CROSS', '×3.2'],
    'classes.explorer': ["label: 'CLASS'", "label: 'LEVEL'", "label: 'SIGNAL'", "label: 'AB BIAS'", "label: 'TUNE'", "k: 'CONDUCT.'", "k: 'IDLE'", "k: 'DISTORT.'", "'NOTCH'", "'DETUNED'", "'CLEAN'", 'SIDE BY SIDE', 'ZERO CROSS', 'dashed = after the tuned circuit'],
    'classd.pwm': ["label: 'LEVEL'", "label: 'VIEW'", "k: 'AT TROUGH'", "k: 'AT PEAK'", "label: 'Raw switching'", "label: 'Filter action'", "label: 'Recovered audio'", 'CLASS D'],
    'classd.bridge': ["k: 'AT PEAK'", "k: 'TO LOAD'", "k: 'AS HEAT'", '+RAIL', '−RAIL', 'HIGH SIDE', 'LOW SIDE', 'LOAD', '0 V', 'DEAD TIME', 'WHERE THE ENERGY GOES'],
    'supply.rails': ["k: 'STATE'", "k: 'RAILS'", "k: 'OUTPUT'", "k: 'CURRENT'", "k: 'POWER'", "'V-CLIP'", "'I-LIMIT'", "'PROTECT'", "label: 'RAIL'", "label: 'LOAD'", "label: 'SUPPLY'", "label: 'Linear supply'", "label: 'Switch-mode supply'"],
    'realworld.gain': ["label: 'SOURCE'", "label: 'MIXER'", "label: 'AMP IN'", "k: 'VERDICT'", "'HEALTHY'", "'STARVED'", "'MIXER / DSP'", "'AMP OUTPUT'", "'(rails)'", "'SPEAKER'", 'CLIPPING', '% of clip'],
    'realworld.practice': ["label: 'Parallel'", "label: 'Series'", 'CLEAR', 'Bridge mode', 'Power ratio P2 ÷ P1', 'CHECK', 'POWER AND CURRENT'],
    'apply.diagnose': ['OUTPUT — what is this amplifier doing?', "k: 'PICTURE'", "k: 'SCORE'", "k: 'READING'", "'RIGHT'", "'WRONG'", 'NEXT WAVEFORM ›', 'REPEAT THE ROUND ›'],
    'apply.choose': ['2 · CHOOSE AN AMPLIFIER', '3 · MYTH REVIEW', 'NEXT SCENARIO ›', 'NEXT STATEMENT ›', "label: 'True'", "label: 'False'", "label: 'It depends'"],
    'apply.challenge': ["k: 'OUTPUT'", "k: 'FAULT'", "'NONE'", "k: 'SCORE'", "label: 'SETUP'", 'SCORE THIS CONFIGURATION', '"Operating mode"', '"Supply condition"', '"Speaker load (nominal)"', '"Ventilation"', "label: 'Sagging (weak mains)'"],
    'apply.final': ['5 · FINAL ASSESSMENT', '6 · COMPLETION SUMMARY', 'NEEDS REVIEW', 'SUBMIT FINAL', 'REPEAT WITH A NEW SET ›', 'FINAL'],
  };
  /** A name pinned as a code token ('X', label: 'X', k: 'X', "X") is shown in the guide without its quotes/prefix. */
  const shown = (n: string) => n.replace(/^(label|k|short|generic|bjt|mosfet|tube): /, '').replace(/^['"]|['"]$/g, '');
  it('a name list for every step', () => {
    for (const [mod, steps] of Object.entries(STEPS)) for (const s of steps) assert.ok(NAMES[`${mod}.${s.key}`], `${mod}.${s.key}: no name list`);
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the module’s screen AND in its guide`, () => {
      const [mod, key] = id.split('.');
      const src = modSrc(mod) + C_TEXT;
      const gt = textOf(guideOf(mod, key));
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the module — update the guide`);
        const word = shown(n);
        const inGuide = gt.includes(word) || (word === 'Vs' && gt.includes('Vs')) || gt.toUpperCase().includes(word.toUpperCase());
        assert.ok(inGuide, `${id}: the guide never names "${word}"`);
      }
    });
  }
  it('the rig’s shared names: panel titles, status cells, transport keys, rail legend', () => {
    for (const n of ['"INPUT (signal)"', "'OUTPUT (to load)'", "'DEVICE CURRENTS (+ gold solid · − purple dashed)'", "k: 'SUPPLY'", "k: 'HEAT'", "k: 'EFFIC.'", "k: 'LOAD'", "'┄ rail limit'"]) assert.ok(RIG.includes(n), n);
    assert.match(RIG, /heat < 0\.35 \? 'cool' : heat < 0\.6 \? 'warm' : heat < 0\.8 \? 'hot' : 'DANGER'/);
    for (const n of ["label: 'RUN'", "label: 'SLOW'", "label: 'STEP ¼'"]) assert.ok(RACK.includes(n), n);
    assert.match(read('src/screens/lab/rack/RackUnit.tsx'), /⤢ {2}FULL SCREEN/);
  });
  it('RUN and SLOW are named only where the dock has both; RUN alone where the transport is "run"', () => {
    for (const [mod, steps] of Object.entries(STEPS)) {
      for (const s of steps) {
        if (s.kind !== 'rack') continue;
        const src = modSrc(mod);
        const at = src.search(new RegExp(`key: '${s.key}',\\s*title: '`));
        const rest = src.slice(at + 5);
        const nextStep = rest.search(/key: '\w+',\s*title: '/);
        const block = src.slice(at, nextStep < 0 ? undefined : at + 5 + nextStep);
        const hasRig = /rig: \w+/.test(block);
        const transport = (block.match(/transport: '(\w+)'/) ?? [])[1] ?? (hasRig ? 'full' : 'none');
        const ctl = s.guide.control.join(' ');
        if (transport === 'full') assert.match(ctl, /RUN and SLOW/, `${mod}.${s.key}: full transport not named`);
        else assert.doesNotMatch(ctl, /SLOW/, `${mod}.${s.key}: names SLOW, but the dock has ${transport}`);
        if (transport === 'none') assert.doesNotMatch(ctl, /\bRUN\b/, `${mod}.${s.key}: names RUN on a still diagram`);
      }
    }
  });
  it('home and end names', () => {
    for (const n of ['MODULE MAP', 'SEE WHAT’S LEFT ›', 'RESET LAB PROGRESS', 'RESUME', 'START', 'OPEN']) {
      assert.ok(HOME.includes(n) || code('src/screens/lab/ModuleAccordionRow.tsx').includes(n), n);
      assert.ok(textOf(G.AMP_HOME_GUIDE as unknown as Guide).includes(n), n);
    }
    assert.match(HOME, /clears your answered checks and your latest final attempt\. Completed modules and your best final result are kept\./);
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), />CHECK YOUR UNDERSTANDING</);
    assert.match(HOME, /<LabUnderstandingBlock labId="amp"/);
    const end = code('src/screens/lab/kit/LabEndScreen.tsx');
    for (const n of ['PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'REVIEW ▾', 'YOUR PROGRESS']) assert.ok(end.includes(n) && textOf(G.AMP_END_GUIDE as unknown as Guide).includes(n), n);
    assert.match(code('src/features/amp/ampEnd.ts'), /label: 'Final assessment'/);
    assert.match(HOME, /onJump=\{\(id\) => open\(id === 'final' \? 'apply' : \(id as AmpModuleId\)\)\}/);
  });
  it('the summary label and diagnosis line claim knowledge, never mastery (owner rule 2026-10-31)', () => {
    assert.doesNotMatch(modSrc('apply'), /CONCEPTS MASTERED|you can read an amplifier/);
    assert.match(modSrc('apply'), /RIGHT ON THE FIRST PICK · \{summary\.mastered\.length\}/);
    assert.match(modSrc('apply'), /you can tell these faults apart by their waveform shape/);
    for (const [id, gd] of ALL) assert.doesNotMatch(textOf(gd), /MASTERED/i, `${id}`);
  });
});

/** ampContent text the modules render (scenario titles, option labels). */
const C_TEXT = read('src/features/amp/ampContent.ts');

describe('4. the numbers in the guide are the numbers the screen prints', () => {
  it('Module 1: clip from 67%; SUPPLY 57% at 40% and 82% at 60%; line out ≈ 0.19 W vs 25 W', () => {
    const src = modSrc('what');
    assert.match(src, /const GAIN = 1\.5;\s*const RAIL = 1\.0;/);
    assert.match(src, /supplyFlow: Math\.min\(1, 0\.06 \+ outRms \* 1\.2\),/);
    const at = (lvl: number) => {
      const out = M.amplify(M.sineCycle(lvl), 1.5, 1);
      return { clip: M.isClipping(M.sineCycle(lvl), 1.5, 1), supply: pct(Math.min(1, 0.06 + M.cycleRms(out) * 1.2)) };
    };
    assert.equal(at(0.66).clip, false);
    assert.equal(at(0.67).clip, true);
    assert.equal(at(0.4).supply, '57%');
    assert.equal(at(0.6).supply, '82%');
    assert.match(src, /Past about \{Math\.round\(limitLevel \* 100\)\}% input/);
    assert.equal(Math.round((1 / 1.5) * 100), 67);
    const lineVrms = Math.pow(10, 4 / 20) * Math.sqrt(0.6);
    assert.match(read('src/screens/lab/calc/calcUnits.ts'), /export const DBU_REF_V = Math\.sqrt\(0\.6\);/);
    assert.equal(M.resistivePower(lineVrms, 8)!.toFixed(2), '0.19');
    assert.equal(M.resistivePower(M.sineVrms(20)!, 8)!.toFixed(0), '25');
    const t = guideOf('what', 'rig').tryThis.join(' ');
    assert.match(t, /past 67%: OUTPUT flips to CLIP/);
    assert.match(t, /At 40% SUPPLY reads 57%; at 60% it reads 82%/);
    assert.match(t, /about 0\.19 W, against 25 W/);
  });
  it('Module 2: CONTROL 50% → 50%; 90% → 100% FULL; below 15% OFF; transformer 400:200 and 400:800', () => {
    const src = modSrc('devices');
    assert.match(src, /const currentFor = \(control: number\) => \(control < 0\.15 \? 0 : Math\.min\(1, \(control - 0\.15\) \/ 0\.7\)\);/);
    assert.match(src, /if \(control < 0\.15\) return \{ label: 'OFF'/);
    assert.match(src, /if \(control > 0\.85\) return \{ label: 'FULLY DRIVEN', short: 'FULL'/);
    const cur = (c: number) => (c < 0.15 ? 0 : Math.min(1, (c - 0.15) / 0.7));
    assert.equal(pct(cur(0.5)), '50%');
    assert.equal(pct(cur(0.9)), '100%');
    assert.match(guideOf('devices', 'device').tryThis.join(' '), /CONTROL to 50%: CURRENT reads 50%\. At 90% it reads 100% and REGION reads FULL/);
    assert.match(src, /const \[np, setNp\] = useState\(400\);\s*const \[ns, setNs\] = useState\(200\);\s*const VP = 120;[^\n]*\n\s*const IP = 1;/);
    const a = M.transformer(400, 200, 120, 8)!;
    assert.equal(a.kind, 'step-down');
    assert.equal(`${a.voltageRatio.toFixed(2)}:1`, '2.00:1');
    assert.equal(a.vs.toFixed(1), '60.0');
    assert.equal(a.isFromIp(1).toFixed(2), '2.00');
    const b = M.transformer(400, 800, 120, 8)!;
    assert.equal(b.kind, 'step-up');
    assert.equal(b.vs.toFixed(1), '240.0');
    assert.equal(b.isFromIp(1).toFixed(2), '0.50');
    assert.equal(b.vs * b.isFromIp(1), 120);
    const c = M.transformer(400, 400, 120, 8)!;
    assert.equal(c.kind, 'isolation');
    assert.equal(c.vs.toFixed(1), '120.0');
    const t = guideOf('devices', 'xfmr').tryThis.join(' ');
    assert.match(t, /STEP-DOWN, RATIO 2\.00:1, Vs 60\.0 V and Is 2\.00 A/);
    assert.match(t, /Ns to 800: KIND flips to STEP-UP, Vs reads 240\.0 V and Is 0\.50 A — still 120 W/);
    assert.match(t, /1:1 ISOLATION and Vs 120\.0 V/);
    assert.match(src, /min: 100, max: 1000, step: 50/);
  });
  it('Module 3: bias 20% CUTOFF, 90% SATUR./90%/DANGER, 50% LINEAR; angle SUPPLY/HEAT; push-pull 44% clean, 84% overbias', () => {
    const src = modSrc('bias');
    assert.match(src, /const \[bias, setBias\] = useState\(0\.5\);\s*const \[angle, setAngle\] = useState\(360\);\s*const \[ppBias, setPpBias\] = useState\(0\.1\);/);
    assert.equal(M.simulateSingleDeviceBias(1, 0.2).region, 'cutoff');
    const hi = M.simulateSingleDeviceBias(1, 0.9);
    assert.equal(hi.region, 'saturation');
    assert.equal(pct(hi.idleCurrent), '90%');
    assert.equal(heatWord(hi.heat), 'DANGER');
    assert.equal(M.simulateSingleDeviceBias(1, 0.5).region, 'linear');
    assert.equal(M.simulateSingleDeviceBias(1, 0.25).region, 'linear');
    assert.equal(M.simulateSingleDeviceBias(1, 0.24).region, 'cutoff');
    assert.equal(M.simulateSingleDeviceBias(1, 0.76).region, 'saturation');
    assert.match(guideOf('bias', 'bias').tryThis.join(' '), /20%: REGION reads CUTOFF[\s\S]*90%: REGION reads SATUR\., IDLE reads 90% and HEAT reads DANGER[\s\S]*50%: REGION reads LINEAR/);
    // Conduction angle: supplyFlow = angle/360, heat = 0.15 + angle/360 × 0.5.
    assert.match(src, /supplyFlow: angle \/ 360,\s*heat: 0\.15 \+ \(angle \/ 360\) \* 0\.5,/);
    assert.equal(heatWord(0.15 + 0.5), 'hot');
    assert.equal(heatWord(0.15 + 0.125), 'cool');
    assert.match(guideOf('bias', 'angle').tryThis.join(' '), /360° · A: SUPPLY reads 100% and HEAT reads hot\. Pick 90° · C: SUPPLY reads 25% and HEAT reads cool/);
    // Push-pull: taskSolved = no notch && idle ≤ 0.08; tooHot = idle > 0.08.
    assert.match(src, /const taskSolved = !pp\.crossoverNotch && pp\.idleCurrent <= 0\.08;\s*const tooHot = pp\.idleCurrent > 0\.08;/);
    const pp = (b: number) => M.simulateLinearClass('AB', 1, b);
    assert.equal(pp(0.1).crossoverNotch, true);
    assert.equal(pp(0.43).crossoverNotch, true);
    assert.equal(pp(0.44).crossoverNotch, false);
    assert.equal((pp(0.44).idleCurrent * 100).toFixed(1), '4.2');
    assert.ok(pp(0.83).idleCurrent <= 0.08 && pp(0.84).idleCurrent > 0.08, 'OVERBIAS from 84%');
    assert.ok(pp(0.9).idleCurrent > 0.08 && !pp(0.9).crossoverNotch);
    const t = guideOf('bias', 'pushpull');
    assert.match(t.changes.join(' '), /from 44% the notch is gone[\s\S]*From 84% HANDOFF reads OVERBIAS and IDLE turns gold at 8\.1% — just past the 8% limit\./);
    assert.match(t.tryThis.join(' '), /start \(10%\) HANDOFF reads NOTCH[\s\S]*44%: HANDOFF reads CLEAN, with IDLE at 4\.2%[\s\S]*90%: HANDOFF reads OVERBIAS[\s\S]*SUPPLY climbs from 63% to 76%/);
    // Review round 2026-10-31: a whole-number IDLE printed 8% on BOTH sides of
    // the 8% limit (84%–88% read OVERBIAS beside "8%"), so IDLE now shows one
    // decimal and agrees with the 0.08 test at every 1% BIAS step. The HEAT
    // cell reads "warm" across the whole lane, so the cost shown is SUPPLY.
    assert.match(src, /const idlePct = \(pp\.idleCurrent \* 100\)\.toFixed\(1\);/);
    assert.match(src, /\{ k: 'IDLE', v: `\$\{idlePct\}%`, tint: tooHot \? colors\.gold : AMP_COLORS\.pos \}/);
    assert.doesNotMatch(src, /Math\.round\(pp\.idleCurrent \* 100\)/);
    assert.equal((pp(0.83).idleCurrent * 100).toFixed(1), '8.0');
    assert.equal((pp(0.84).idleCurrent * 100).toFixed(1), '8.1');
    for (let i = 0; i <= 100; i++) {
      const at = pp(Math.round(i) * 0.01);
      assert.equal(Number((at.idleCurrent * 100).toFixed(1)) > 8, at.idleCurrent > 0.08, `IDLE readout agrees with OVERBIAS at ${i}%`);
    }
    assert.match(src, /supplyFlow: 0\.5 \+ pp\.idleCurrent \* 3,/);
    const supplyAt = (b: number) => pct(Math.min(1, 0.5 + pp(b).idleCurrent * 3));
    assert.equal(supplyAt(0.44), '63%');
    assert.equal(supplyAt(0.9), '76%');
    for (let i = 0; i <= 100; i++) assert.equal(heatWord(pp(i / 100).heat), 'warm', `HEAT at ${i}%`);
    assert.doesNotMatch(textOf(t), /only heat is added|idle current and heat/);
  });
  it('Module 4: A 16% → B 48% NOTCH at LEVEL 80%; AB 0→50% bias: CLEAN, 165°→190°; C TUNE 1.05× DETUNED', () => {
    const src = modSrc('classes');
    assert.match(src, /const \[cls, setCls\] = useState<Explorable>\('A'\);\s*const \[drive, setDrive\] = useState\(0\.8\);/);
    const A = M.simulateLinearClass('A', 0.8, 0);
    const B = M.simulateLinearClass('B', 0.8, 0);
    assert.equal(pct(A.efficiencyPct / 100), '16%');
    assert.equal(pct(B.efficiencyPct / 100), '48%');
    assert.equal(B.crossoverNotch, true);
    assert.equal(Math.round(M.simulateLinearClass('A', 0, 0).idleCurrent * 100), 100, 'A idles at 100% with SIGNAL off');
    const ab0 = M.simulateLinearClass('AB', 0.8, 0);
    const ab5 = M.simulateLinearClass('AB', 0.8, 0.5);
    assert.equal(Math.round(ab0.conductionDeg), 165);
    assert.equal(Math.round(ab5.conductionDeg), 190);
    assert.equal(ab5.crossoverNotch, false);
    assert.match(src, /cls === 'C' && \(c\?\.resonanceGain \?\? 1\) < 0\.9 \? 'DETUNED' : 'CLEAN'/);
    assert.ok(M.simulateClassC(0.8, 1.05).resonanceGain < 0.9);
    assert.ok(M.simulateClassC(0.8, 1).resonanceGain >= 0.9 && M.simulateClassC(0.8, 1).conductionDeg > 0);
    // B: ideally 180° (the ANGLE key's 180° · B); the model's dead zone makes CONDUCT. read 165°.
    assert.equal(Math.round(M.simulateLinearClass('B', 0.8, 0).conductionDeg), 165);
    assert.match(guideOf('classes', 'explorer').changes.join(' '), /B: each device ideally conducts half the cycle \(180°\); CONDUCT\. reads 165°/);
    const t = guideOf('classes', 'explorer').tryThis.join(' ');
    assert.match(t, /LEVEL 80%\): EFFIC\. reads 16%\. Switch CLASS to B: 48%, and DISTORT\. reads NOTCH/);
    assert.match(t, /0% to 50%: DISTORT\. turns CLEAN and CONDUCT\. rises from 165° to 190°/);
    assert.match(t, /TUNE to 1\.05×: DISTORT\. reads DETUNED/);
    assert.match(src, /min: 0\.5,\s*max: 2,/);
  });
  it('Module 5: 70% → 15%/85% and 83%/17%; 10% → 45%/55% and 56%/44%; top → 98%', () => {
    const src = modSrc('classd');
    assert.match(src, /const \[drive, setDrive\] = useState\(0\.7\);/);
    assert.match(src, /const dutyAtPeak = \(1 \+ Math\.min\(0\.95, drive\)\) \/ 2;\s*const dutyAtTrough = \(1 - Math\.min\(0\.95, drive\)\) \/ 2;\s*const lossW = 100 - sim\.efficiencyPct;/);
    const at = (d: number) => {
      const s = M.simulateClassD(d);
      return { trough: pct((1 - Math.min(0.95, d)) / 2), peak: pct((1 + Math.min(0.95, d)) / 2), load: `${Math.round(s.efficiencyPct)}%`, heat: `${Math.round(100 - s.efficiencyPct)}%` };
    };
    assert.deepEqual(at(0.7), { trough: '15%', peak: '85%', load: '83%', heat: '17%' });
    assert.deepEqual(at(0.1), { trough: '45%', peak: '55%', load: '56%', heat: '44%' });
    assert.equal(at(0.95).peak, '98%');
    assert.equal(at(0).peak, '50%');
    assert.equal(at(0).trough, '50%');
    assert.match(src, /min: 0, max: 0\.95/);
    assert.match(src, /speaker: view === 'recovered',/);
    assert.match(guideOf('classd', 'pwm').tryThis.join(' '), /\(70%\) AT TROUGH reads 15% and AT PEAK 85%\. Drop LEVEL to 10%: 45% and 55%/);
    assert.match(guideOf('classd', 'bridge').tryThis.join(' '), /At 70% TO LOAD reads 83% and AS HEAT 17%\. Drop LEVEL to 10%: 56% and 44%[\s\S]*high part of the drawn period widen as AT PEAK climbs to 98%/);
    // The drawn period has a FIXED width; only its high part follows the duty.
    assert.match(src, /const px0 = 92, pw = 52, pyHi = 52, pyLo = 64;/);
    assert.match(src, /short: 'AUDIO'/);
    assert.match(guideOf('classd', 'pwm').seeing.join(' '), /LOAD once VIEW reads AUDIO \(Recovered audio\)/);
  });
  it('Module 6: 8 Ω linear V-CLIP at 75% with ±37 V; 2 Ω I-LIMIT 51% at 9.0 A, PROTECT 74%; switch-mode clips at 79%', () => {
    const src = modSrc('supply');
    assert.match(src, /const \[supply, setSupply\] = useState<'linear' \| 'smps'>\('linear'\);\s*const \[drive, setDrive\] = useState\(0\.5\);\s*const \[rail, setRail\] = useState\(1\);\s*const \[loadZ, setLoadZ\] = useState<8 \| 4 \| 2>\(8\);/);
    const first = (z: number, sup: 'linear' | 'smps', state: string) => {
      for (let i = 0; i <= 100; i++) if (M.simulateRailLimits(i / 100, 1, z, sup).state === state) return i;
      return -1;
    };
    assert.equal(first(8, 'linear', 'voltage-clip'), 75);
    assert.equal(M.simulateRailLimits(0.75, 1, 8, 'linear').railEff.toFixed(0), '37');
    assert.equal(first(2, 'linear', 'current-limit'), 51);
    assert.equal(M.simulateRailLimits(0.51, 1, 2, 'linear').irms.toFixed(1), '9.0');
    assert.equal(first(2, 'linear', 'protect'), 74);
    assert.equal(first(8, 'smps', 'voltage-clip'), 79);
    assert.equal(M.RAIL_V_FULL, 40);
    assert.equal(M.RAIL_I_LIMIT, 9);
    assert.equal(M.RAIL_I_PROTECT, 13);
    assert.match(src, /min: 0\.3, max: 1, step: 0\.01, format: \(v\) => `±\$\{Math\.round\(v \* RAIL_V_FULL\)\} V`/);
    assert.equal(Math.round(0.3 * 40), 12);
    const t = guideOf('supply', 'rails').tryThis.join(' ');
    assert.match(t, /V-CLIP at 75%, with RAILS sagged to ±37 V/);
    assert.match(t, /I-LIMIT from 51%, with CURRENT held at 9\.0 A, and PROTECT from 74%/);
    assert.match(t, /clipping now starts at 79%/);
  });
  it('Module 7: 80/64/51% of clip HEALTHY; SOURCE 63% → CLIP:SRC; AMP IN 98% → CLIP:OUT; load builder and power numbers', () => {
    const src = modSrc('realworld');
    assert.match(src, /const \[src, setSrc\] = useState\(0\.5\);\s*const \[mix, setMix\] = useState\(0\.5\);\s*const \[ampIn, setAmpIn\] = useState\(0\.5\);/);
    const g = M.evaluateGainStructure(0.5, 0.5, 0.5);
    assert.deepEqual([pct(g.levels.source), pct(g.levels.mixer), pct(g.levels.amp)], ['80%', '64%', '51%']);
    assert.equal(g.firstClip, null);
    assert.equal(g.starved, null);
    assert.equal(M.evaluateGainStructure(0.62, 0.5, 0.5).firstClip, null);
    assert.equal(M.evaluateGainStructure(0.63, 0.5, 0.5).firstClip, 'source');
    assert.equal(M.evaluateGainStructure(0.63, 0.5, 0.2).firstClip, 'source', 'lowering AMP IN keeps CLIP:SRC');
    assert.equal(M.evaluateGainStructure(0.5, 0.5, 0.97).firstClip, null);
    assert.equal(M.evaluateGainStructure(0.5, 0.5, 0.98).firstClip, 'amp');
    assert.match(src, /`CLIP:\$\{gs\.firstClip === 'source' \? 'SRC' : gs\.firstClip === 'mixer' \? 'MIX' : 'OUT'\}`/);
    const t = guideOf('realworld', 'gain').tryThis.join(' ');
    assert.match(t, /80%, 64% and 51% of clip — VERDICT HEALTHY/);
    assert.match(t, /SOURCE to 63%: VERDICT reads CLIP:SRC/);
    assert.match(t, /AMP IN to 98%: VERDICT reads CLIP:OUT/);
    // Practice page.
    assert.match(src, /useState<number\[\]>\(\[8, 8\]\)/);
    assert.match(src, /const V_RMS_EXAMPLE = 28\.3;/);
    assert.equal(M.parallelImpedance([8, 8])!.toFixed(2), '4.00');
    assert.equal(M.parallelImpedance([8, 8, 8])!.toFixed(2), '2.67');
    assert.equal(M.ohmsCurrent(28.3, 4)!.toFixed(2), '7.08');
    assert.equal(M.resistivePower(28.3, 4)!.toFixed(0), '200');
    assert.equal(M.ohmsCurrent(28.3, 8)!.toFixed(2), '3.54');
    assert.equal(M.resistivePower(28.3, 8)!.toFixed(0), '100');
    assert.equal(M.powerDeltaDb(1, 2)!.toFixed(2), '3.01');
    assert.equal(2 ** -2, 0.25);
    const p = guideOf('realworld', 'practice').tryThis.join(' ');
    assert.match(p, /Ztotal ≈ 4\.00 Ω[\s\S]*\+ 8 Ω: 2\.67 Ω/);
    assert.match(p, /4 Ω: 7\.08 A and 200 W, against 3\.54 A and 100 W at 8 Ω/);
    assert.match(p, /starts at 2\.00×: the formula reads \+3\.01 dB\. Slide it to the top, 10\.00×: \+10\.00 dB/);
    assert.match(src, /const \[ratio, setRatio\] = useState\(2\);/);
    // The log2 lane's top: round(log2(10)·12)/12 overshoots, the clamp lands on log2(10) → 10.000×.
    const top = Math.min(Math.log2(10), Math.round(Math.log2(10) / (1 / 12)) * (1 / 12));
    assert.equal(+(2 ** top).toFixed(3), 10);
    assert.equal(M.powerDeltaDb(1, 10)!.toFixed(2), '10.00');
    assert.match(src, /max=\{Math\.log2\(10\)\} step=\{1 \/ 12\}/);
  });
  it('Module 8: the challenge arrives LOAD / DANGER; 8 Ω → UP-CLIP; SOURCE 60% → NONE, 61%, six of six; vents clear → cool', () => {
    const src = modSrc('apply');
    assert.match(src, /const CH_START = \{ source: 0\.8, mixer: 0\.5, amp: 0\.5, mode: 'stereo' as const, supply: 'healthy' as const, load: 2 as const, vent: 'blocked' as const \};/);
    const run = (source: number, load: number, vent: 'clear' | 'blocked') => {
      const rig = M.evaluateRig({ sourceLevel: source, mixerLevel: 0.5, ampInput: 0.5, railLimit: 1, loadZ: load, minLoadZ: 4, bridged: false, bridgeSupported: true, ventBlocked: vent === 'blocked' ? 1 : 0, instrumentCable: false, shorted: false });
      const gs = M.evaluateGainStructure(source, 0.5, 0.5, 1);
      const out = Math.min(gs.levels.amp, 1);
      const dims = [!rig.upstreamClips && !rig.outputClips, (rig.effectiveLoadZ ?? 0) >= 4, true, rig.thermal < 0.75, out >= 0.5 && out <= 0.85, true];
      return { primary: rig.primary, heat: heatWord(rig.thermal), out: pct(out), passed: dims.filter(Boolean).length };
    };
    const start = run(0.8, 2, 'blocked');
    assert.equal(start.primary, 'load-below-min');
    assert.equal(start.heat, 'DANGER');
    assert.equal(run(0.8, 8, 'blocked').primary, 'upstream-clipping');
    const fixed = run(0.6, 8, 'blocked');
    assert.equal(fixed.primary, null);
    assert.equal(fixed.out, '61%');
    assert.equal(fixed.passed, 6);
    assert.equal(fixed.heat, 'warm');
    assert.equal(run(0.6, 8, 'clear').heat, 'cool');
    assert.equal(run(0.6, 8, 'clear').passed, 6);
    // Blocked vents only fail the thermal check at 4 Ω (review round 2026-10-31).
    const at4 = M.evaluateRig({ sourceLevel: 0.6, mixerLevel: 0.5, ampInput: 0.5, railLimit: 1, loadZ: 4, minLoadZ: 4, bridged: false, bridgeSupported: true, ventBlocked: 1, instrumentCable: false, shorted: false });
    assert.equal(at4.primary, 'thermal-limiting');
    assert.match(guideOf('apply', 'challenge').changes.join(' '), /blocked vents, which add heat — enough to trip thermal limiting at 4 Ω/);
    assert.match(src, /'load-below-min': 'LOAD'/);
    assert.match(src, /'upstream-clipping': 'UP-CLIP'/);
    const t = guideOf('apply', 'challenge').tryThis.join(' ');
    assert.match(t, /FAULT reads LOAD and HEAT reads DANGER\. In SETUP pick 8 Ω: FAULT turns to UP-CLIP/);
    assert.match(t, /SOURCE to 60%: FAULT reads NONE and OUTPUT 61%/);
    assert.match(t, /SOURCE to 60%: FAULT reads NONE and OUTPUT 61%\.[\s\S]*Ventilation to Clear: HEAT drops from warm to cool\. Now tap SCORE THIS CONFIGURATION/);
    // Final: 12 items from the scored pool; 70% passes.
    assert.match(src, /export const FINAL_STRONG_PCT = 70;\s*const FINAL_ITEMS = 12;/);
    assert.ok((C.AMP_CHECKS as { scored?: boolean }[]).filter((c) => c.scored).length > 12, 'a larger pool than one draw');
    assert.match(guideOf('apply', 'final').changes.join(' '), /70% or more counts as a pass/);
    assert.equal((C.WAVE_KINDS as unknown[]).length, 8);
    assert.match(guideOf('apply', 'diagnose').seeing.join(' '), /eight possible readings/);
  });
});

describe('5. wiring and the accuracy-chip decision', () => {
  it('the home: host (no regions) wraps the root content; the ⓘ via LabHeader guide; no AccuracyNote', () => {
    assert.match(HOME, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(HOME, /import \{ AMP_END_GUIDE, AMP_HOME_GUIDE \} from '\.\/ampScreenGuides';/);
    assert.match(HOME, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'list'\}>\s*<LabHeader/);
    assert.match(HOME, /guide=\{ending \? AMP_END_GUIDE : AMP_HOME_GUIDE\}\s*guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
    assert.match(HOME, /<\/ScrollView>\s*\)\}\s*<\/ScreenGuideHost>\s*<\/View>/);
    assert.doesNotMatch(HOME, /AccuracyNote/);
    assert.match(HOME, /Amplifiers and their power supplies can contain lethal voltage/);
  });
  it('the module host: per-step guide by index, regions only on a rack step, end guide on what’s left; the chip stays beside the ⓘ', () => {
    assert.match(HOST, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(HOST, /import \{ AMP_END_GUIDE, ampStepGuide \} from '\.\/ampScreenGuides';/);
    assert.match(HOST, /const stepGuide = ampStepGuide\(mod\.id, stepIdx\);/);
    assert.match(HOST, /<ScreenGuideHost resetKey=\{endState \? 'end' : `\$\{mod\.id\}:\$\{stepIdx\}`\} regions=\{!endState && stepGuide\?\.kind === 'rack'\}>\s*<LabHeader/);
    assert.match(HOST, /right=\{\s*<AccuracyNote compact detail="This lab MODELS amplifier behavior on your phone — the numbers and curves are teaching tools, not bench measurements\. For real amplifier work use proper test gear\." \/>\s*\}\s*guide=\{endState \? AMP_END_GUIDE : stepGuide\?\.guide\}\s*guideTitle=\{guideTitle\}/);
    assert.match(HOST, /<\/View>\s*\)\}\s*<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    assert.match(HOST, /import \{ AccuracyNote \} from '\.\.\/\.\.\/\.\.\/components\/AccuracyNote';/);
  });
  it('inside a module ‹ goes back one screen, to the lab menu (the menu pushes the module); American spelling', () => {
    assert.match(HOME, /navigation\.navigate\('AmpModule', \{ id: m\.id \}\)/);
    assert.match(code('src/screens/lab/kit/LabNavBar.tsx'), /safeGoBack\(navigation\);/);
    for (const [mod, steps] of Object.entries(STEPS)) {
      for (const s of steps) {
        const ctl = s.guide.control.join(' ');
        assert.doesNotMatch(ctl, /‹ leaves the lab/, `${mod}.${s.key}`);
        if (/The strip under the title/.test(ctl)) assert.match(ctl, /‹ goes back one screen, to the lab menu/, `${mod}.${s.key}`);
      }
    }
    for (const [id, gd] of ALL) assert.doesNotMatch(textOf(gd), /\bpractis/i, `${id}: British spelling`);
    assert.doesNotMatch(textOf(guideOf('apply', 'challenge')), /\bHow to bring\b/);
  });
  it('chip decision: every display is badged conceptual; nothing reads a microphone or plays sound', () => {
    assert.match(RIG, /export const CONCEPT_NOTE = 'Conceptual visualization — not a component-level circuit simulation\.';/);
    assert.match(RACK, /badge: spec\.badge \?\? CONCEPT_NOTE,/);
    for (const id of Object.keys(MOD_FILE)) assert.doesNotMatch(modSrc(id), /useMic|getUserMedia|startFenced|expo-audio/, `${id}: a live input would earn the chip back`);
  });
});
