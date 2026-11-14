/**
 * Lab fix round 1, phase 1 (2026-11-14), group F6: Meter, Signal Chain, Gain,
 * Patchbay, Digital, the three cable labs, Vacuum Tube, Amplifier and the
 * Calculator Lab. Owner approval (2026-11-14): "Begin fixing all bugs found
 * and do obvious (my decision is not required) fixes as you suggestted in the
 * report." Each block below would have failed before its fix.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('Meter lab', () => {
  const viz = read('src/screens/lab/meter/vizMeters.tsx');
  const A = read('src/screens/lab/meter/modules/modMeterA.tsx');
  it('module 1: the picture line reads the same buffer and the stored (clipped) values as the frame', () => {
    assert.match(viz, /const ref = renderSignal\(p\.signal\);/);
    assert.match(viz, /const stored = showClip \? ref\.map\(\(v\) => Math\.max\(-1, Math\.min\(1, v\)\)\) : ref;/);
    assert.match(viz, /pkDb: db\(peakOf\(stored\)\)/);
  });
  it('module 1: DC on the picture is a percent, like the frame', () => {
    assert.match(viz, /`DC \$\{st\.dc >= 0 \? '\+' : ''\}\$\{\(st\.dc \* 100\)\.toFixed\(1\)\}%`/);
    assert.doesNotMatch(viz, /st\.dc\.toFixed\(2\)/);
  });
  it('module 4: the loudness model disclosure is printed once (stage badge only)', () => {
    assert.equal((A.match(/LOUDNESS_MODEL_BADGE/g) ?? []).length, 2, 'declared + the stage badge');
    assert.doesNotMatch(A, /<Badge text=\{LOUDNESS_MODEL_BADGE\}/);
  });
  it('module 4: the five loudness keys keep their place (unit on the sub line)', () => {
    const lo = A.slice(A.indexOf('export function LoudnessModule'));
    for (const u of ["sub: 'LUFS'", "sub: 'LU'", "sub: 'dBFS'", "sub: 'dBTP'", "sub: 'dB'"]) assert.ok(lo.includes(u), u);
    assert.doesNotMatch(lo, /toFixed\(1\)\}LUFS`|toFixed\(1\)\}dBTP`/);
  });
  it('modules 1 and 2: OVER / OVR ride on the sub line so PEAK, PK HOLD and CLIP keep their keys', () => {
    assert.doesNotMatch(A, / OVR`| OVER`/);
    assert.match(A, /sub: overSamples > 0 \? 'OVER' : undefined/);
    assert.match(A, /sub: rawPeakDb >= 0 \? 'OVR' : undefined/);
  });
  it('module 9: MONO is described as the line the picture draws', () => {
    const C = read('src/screens/lab/meter/modules/modMeterC.tsx');
    assert.doesNotMatch(C, /single point at center/);
    assert.match(C, /a single line straight up the middle/);
  });
});

describe('Signal Chain', () => {
  const S = read('src/screens/lab/SignalChainLabScreen.tsx');
  it('SCENE uses the scenario button’s own words (no SQUASH)', () => {
    assert.doesNotMatch(S, /'SQUASH'/);
    assert.match(S, /label: 'HOT INTO LIMITER', short: 'HOT→LIMIT'/);
  });
  it('▶ with sound off (or no chain audio) says so on OUT and in a note with the GR numbers', () => {
    assert.match(S, /if \(!fxReady\) \{\n\s*setSilent\('device'\);/);
    assert.match(S, /if \(!ok\) \{\n\s*setSilent\('off'\);/);
    assert.doesNotMatch(S, /disabled=\{!fxReady\}/);
    assert.match(S, /v: running \? 'LIVE' : silent \? 'SILENT' : 'IDLE'/);
    assert.match(S, /GR −4\.5/);
  });
  it('no "update the app" line for learners', () => {
    assert.doesNotMatch(S, /update the app to hear it/);
  });
});

describe('Gain Staging', () => {
  const X = read('src/screens/lab/gain/modules/modExplore.tsx');
  const V = read('src/screens/lab/gain/gainViz.tsx');
  const L = read('src/screens/lab/gain/modules/modLearn.tsx');
  it('M8: the big in-well FINISH waits for FIXED; a quiet link and the strip keep the way out open', () => {
    assert.match(X, /<LabNavProvider value=\{healthy \? labNav : null\}>/);
    assert.match(X, /\{!healthy && labNav && !labNav\.ending \? \(\n\s*<Pressable\n\s*onPress=\{labNav\.next\}/);
    assert.match(X, /Not solved yet\. Leave anyway: SEE WHAT’S LEFT ›/);
  });
  it('M8: an inspected column keeps its verdict word', () => {
    assert.match(X, /checked: visited\[st\.key\] \? checkedWord\(nodes\[i \+ 1\]\) : undefined/);
    assert.match(V, /\{c\.checked \? \(\n\s*<Text style=\{\[s\.slotUnder, \{ color: c\.checked\.tint \}\]\}>\{c\.checked\.v\}<\/Text>/);
    assert.match(X, /setVisited\(\{\}\);/, 'a new round starts with a clean map');
  });
  it('M8: one search strategy (either end), not forward on the card and backward in the well', () => {
    assert.doesNotMatch(X, /so work back upstream\)/);
    assert.match(X, /search\n\s*from either end/);
  });
  it('M3: the first stage to clip is named in words', () => {
    assert.match(L, /const firstClip = nodes\.find\(\(n\) => n\.stageClipped\) \?\? null;/);
    assert.match(L, /First stage to clip: /);
  });
  it('M2: the short region word for TOO LOW is LOW, not TOO', async () => {
    const m = /export function shortRegionLabel\(label: string\): string \{([\s\S]*?)\n\}/.exec(V);
    assert.ok(m);
    const fn = new Function('label', m[1]) as (l: string) => string;
    assert.equal(fn('TOO LOW'), 'LOW');
    assert.equal(fn('QUIET SOURCE'), 'QUIET');
    assert.equal(fn('HEALTHY'), 'HEALTHY');
  });
});

describe('Patchbay', () => {
  const A = read('src/screens/lab/patchbay/pagesA.tsx');
  const P = read('src/screens/lab/patchbay/predictCheck.tsx');
  it('page 7: ANY committed prediction unlocks the jacks (predict, then test)', () => {
    const p7 = A.slice(A.indexOf('function PageHalfSurprise'), A.indexOf('function PageHalfSurprise') + 4000);
    assert.match(p7, /<PredictCheck/);
    assert.match(p7, /onCommit=\{\(\) => setPredicted\(true\)\}/);
    assert.doesNotMatch(p7, /onCorrect=\{\(\) => setPredicted\(true\)\}/);
    assert.match(P, /if \(!committed\.current\) \{\n\s*committed\.current = true;\n\s*onCommit\(\);/);
  });
  it('page 7: the wrong-answer lines never send the learner to a jack that is not there', () => {
    assert.doesNotMatch(A, /Try the top jack below/);
    assert.match(A, /The jacks are unlocked: patch the TOP jack/);
  });
  it('page 7: the goal chip points at the question above it', () => {
    assert.match(A, /'PREDICT IT \(answer above\)'/);
  });
});

describe('Digital Audio', () => {
  const D = 'src/screens/lab/digital/';
  const an = read(`${D}modules/modAnalog.tsx`);
  const dac = read(`${D}modules/modDac.tsx`);
  const q = read(`${D}modules/modQuant.tsx`);
  it('FS has one meaning (full scale): the sample-rate readouts are RATE', () => {
    for (const s of [an, dac, q]) assert.doesNotMatch(s, /k: 'FS'/);
    assert.match(an, /k: 'RATE',( caption: '[^']*',)?\n\s*\.\.\.hzCell\(fs/);
    assert.match(dac, /\{ k: 'RATE', v: '48 kHz'/);
    const g = read(`${D}digitalScreenGuides.ts`);
    assert.doesNotMatch(g, /FS \(here the sample rate|Readouts: FS \(48 kHz\)/);
  });
  it('M2/M4/M8: readouts keep their keys at 390 (unit on the sub line)', () => {
    assert.match(an, /\{ k: 'INPUT', \.\.\.hzCell\(f\)/);
    assert.match(an, /\{ k: 'READS AS', \.\.\.hzCell\(alias\)/);
    assert.match(q, /k: 'LEVEL',\n\s*v: Number\.isFinite\(sampleDb\(v\)\) \? sampleDb\(v\)\.toFixed\(1\) : '−∞',\n\s*sub: 'dBFS'/);
    assert.match(dac, /\{ k: 'INTERVAL', v: '20\.83', sub: 'µs @48k'/);
  });
  it('M1: the badge is short enough not to be cut', () => {
    const m = /'(ILLUSTRATIVE MODEL, SLOWED[^']*)'/.exec(an);
    assert.ok(m && m[1].length <= 100, `${m?.[1].length}`);
  });
});

describe('Cable labs', () => {
  it('Cable Fundamentals: the lesson tag carries no second count that disagrees with the strip', () => {
    const s = read('src/screens/lab/cable/CableLabScreen.tsx');
    assert.doesNotMatch(s, /OF \$\{CABLE_LESSONS\.length\}/);
    assert.match(s, /<Text style=\{styles\.tag\}>\{s\.tag\}<\/Text>/);
  });
  it('Cable Fundamentals L5: the guide counts the four connections the page shows', () => {
    assert.match(read('src/screens/lab/cable/cableScreenGuides.ts'), /three separate jobs around one loudspeaker, met in four connections/);
  });
  it('Cable Dressing stage 3: the best pick never wears a ✕', () => {
    const r = read('src/screens/lab/cableinstall/scenes/RouteScene.tsx');
    assert.match(r, /const pickedBest = picked != null && rk\[0\]\?\.option\.id === picked;/);
    assert.match(r, /verdict=\{f\.positive \? 'good' : pickedBest \? 'info' : 'bad'\}/);
  });
  it('Cable Dressing stage 4: no − / + on buttons whose number moves the other way', () => {
    const m = read('src/screens/lab/cableinstall/scenes/MechScene.tsx');
    assert.doesNotMatch(m, />− EASE<|>\+ TIGHTEN</);
    assert.match(m, /◂ GENTLER/);
    assert.match(m, /TIGHTER ▸/);
  });
  it('Cable Dressing end: no OVERALL 0 before a score; the guide matches the buttons', () => {
    const c = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(c, /if \(rows\.length === 0\) \{[\s\S]{0,200}KNOWLEDGE PROFILE · NOT SCORED YET/);
    const g = read('src/screens/lab/cableinstall/cableInstallScreenGuides.ts');
    assert.doesNotMatch(g, /Tap REVIEW RESULTS to open/);
    assert.match(g, /plus REVIEW RESULTS when an area is under 80/);
  });
  it('Connector Selection p6: a failed check explains the red rows in words', () => {
    const b = read('src/screens/lab/connectorselect/pagesB.tsx');
    assert.match(b, /each is either a real job you left unmarked or an impostor you marked/);
  });
});

describe('Vacuum Tube reference', () => {
  const r = read('src/screens/lab/tube/tubeRefs.ts');
  it('the list order is the page order (by family) and rows print their position, not the card number', () => {
    assert.match(r, /export const TUBE_REFS: TubeRef\[\] = TUBE_FAMILY_META\.flatMap\(\(f\) => TUBE_REFS_BY_NUM\.filter\(\(r\) => r\.family === f\.key\)\);/);
    assert.match(read('src/screens/lab/tube/TubeReferenceScreen.tsx'), /String\(tubeListNum\(r\)\)\.padStart\(2, '0'\)/);
    assert.match(read('src/screens/lab/tube/TubeCardScreen.tsx'), /String\(tubeListNum\(tube\)\)\.padStart\(2, '0'\)/);
  });
  it('positions run 1…40 in display order with no jump (data check)', () => {
    const rows = [...r.matchAll(/^\s*t\((\d+), '([^']+)', '[^']*', \[[^\]]*\], '(\w+)'/gm)].map((m) => ({ num: +m[1], fam: m[3] }));
    assert.equal(rows.length, 40);
    const fams = ['preamp', 'power', 'dht', 'rectifier'];
    const ordered = fams.flatMap((f) => rows.filter((x) => x.fam === f));
    assert.equal(ordered.length, 40);
    // inside each family the card numbers rise, so position order = card order within a group
    for (const f of fams) {
      const n = ordered.filter((x) => x.fam === f).map((x) => x.num);
      assert.deepEqual(n, [...n].sort((a, b) => a - b), f);
    }
  });
});

describe('Amplifier', () => {
  it('M7: the bezel numbers say they are fader SETTINGS (the drawing reads % of clip)', () => {
    const m = read('src/screens/lab/amp/modules/mod7RealWorld.tsx');
    for (const k of ['SOURCE', 'MIXER', 'AMP IN']) assert.match(m, new RegExp(String.raw`\{ k: '${k}', v: pct\(\w+\), sub: 'SETTING'`), k);
  });
  it('M5: no section numbered past the module’s two steps', () => {
    const m = read('src/screens/lab/amp/modules/mod5ClassD.tsx');
    assert.doesNotMatch(m, /<SectionTitle>3 · /);
  });
});

describe('Meter LoudnessView: optional true peak for the Mastering lab (F4 request)', () => {
  const viz = read('src/screens/lab/meter/vizMeters.tsx');
  const lv = viz.slice(viz.indexOf('export function LoudnessView'), viz.indexOf('export function LoudnessView') + 3000);
  it('undefined keeps the Visual Audio Analysis lab as before: the simulated value, untouched', () => {
    assert.match(lv, /const s = tpIn === undefined \? s0 : \{ \.\.\.s0, truePeakDbtp: tpIn \};/);
    assert.match(lv, /truePeakDbtp: Math\.round\(\(s\.truePeakDbtp \+ gainDb\) \* 10\) \/ 10/);
    // the Meter lab never passes it
    for (const f of ['modMeterA.tsx', 'modMeterB.tsx', 'modMeterC.tsx']) {
      assert.doesNotMatch(read(`src/screens/lab/meter/modules/${f}`), /truePeakDbtp=\{/, f);
    }
  });
  it('Mastering module 6 hands its bezel TRUE PK to the face', () => {
    const m = read('src/screens/lab/mastering/modules/mod6Loudness.tsx');
    assert.match(m, /<MetersStage [^>]*truePeakDbtp=\{teach\.tp\} \/>/);
    assert.match(m, /<viz\.LoudnessView [^>]*truePeakDbtp=\{truePeakDbtp\} \/>/);
  });
});

describe('Calculator Lab', async () => {
  const U = await import('../src/screens/lab/calc/calcUnits.ts');
  it('a level answer prints the reference its label names (dBV / dBu), never a bare dB', () => {
    assert.equal(U.namedOutputUnit({ label: 'SAME LEVEL IN dBV', quantity: 'db' }), 'dBV');
    assert.equal(U.namedOutputUnit({ label: 'SAME LEVEL IN dBu', quantity: 'db' }), 'dBu');
    assert.equal(U.namedOutputUnit({ label: 'OUTPUT LEVEL (dBu)', quantity: 'number' }), 'dBu');
    assert.equal(U.namedOutputUnit({ label: 'THRESHOLD (dBV)', quantity: 'db' }), 'dBV');
    assert.equal(U.namedOutputUnit({ label: 'OUTPUT LEVEL', quantity: 'db', meaning: 'db:dbfs-level' }), 'dBFS');
    assert.equal(U.namedOutputUnit({ label: 'GAIN REDUCTION', quantity: 'db' }), null, 'a difference stays dB');
    assert.equal(U.namedOutputUnit({ label: 'PANEL MASS (kg/m²)', quantity: 'db' }), null);
    const P = read('src/screens/lab/calc/calcPanel.tsx');
    assert.match(P, /const named = units\.length === 1 \? namedOutputUnit\(o\) : null;\n\s*const u = named \? \{ \.\.\.u0, label: named \} : u0;/);
  });
  it('the AWG refusals speak in gauges, not "-3 to 18"', () => {
    const a = read('src/screens/lab/calc/workspaces/ampacity.ts');
    assert.match(a, /CONDUCTOR SIZE must be a gauge from 18 AWG up to 4\/0/);
    assert.match(read('src/screens/lab/calc/workspaces/powerElec.ts'), /WIRE GAUGE must be from 40 AWG up to 4\/0/);
  });
  it('a workspace with empty boxes names them', () => {
    const w = read('src/screens/lab/calc/CalcWorkspaceScreen.tsx');
    assert.match(w, /const stillNeeded = values \? \[\] : fields\.filter\(\(f\) => !\(raw\[f\.key\] \?\? ''\)\.trim\(\)\)\.map\(\(f\) => f\.name\);/);
    assert.match(w, /`Still needed: \$\{stillNeeded\.join\(', '\)\}\./);
  });
  it('mV/Pa keeps its case in the answer heading (MV/PA read as megavolts)', () => {
    assert.ok(read('src/screens/lab/calc/CalcWorkspaceScreen.tsx').includes(String.raw`.replace(/\bMV\/PA\b/g, 'mV/Pa')`));
  });
  it('a workflow report headlines the last step’s answer, with its name', () => {
    const r = read('src/screens/lab/calc/calcReport.ts');
    assert.match(r, /results\.find\(\(r, idx\) => s\.results\[idx\]\.step === lastStep && looksNumeric\(r\.formattedValue\)\)/);
    assert.match(r, /'PRIMARY RESULT', leaderLine\(r\.primaryResult\.label, r\.primaryResult\.formattedValue\)/);
    assert.match(read('src/screens/lab/calc/ReportCard.tsx'), /<Text style=\{styles\.rowLabel\}>\{r\.primaryResult\.label\}<\/Text>/);
  });
  it('a half-sample FIR latency is kept (physics) and explained; huge level counts are written out', () => {
    const d = read('src/screens/lab/calc/workspaces/digitalAdv.ts');
    assert.equal((d.match(/label: 'WHY HALF A SAMPLE'/g) ?? []).length, 2);
    assert.match(d, /const latS = \(N - 1\) \/ 2;/, 'the latency itself is unchanged');
    const m = /function levelsInWords\(x: number\): string \| null \{([\s\S]*?)\n\}/.exec(d)!;
    const f = new Function('x', m[1]) as (x: number) => string | null;
    assert.equal(f(2 ** 24), '16,777,216 levels (about 16.8 million)');
    assert.equal(f(65536), null);
  });
});

// ── PHASE 2 (2026-11-14): the shared mechanisms filled in for F6's labs ────
describe('Phase 2 · check cards with their own reasons', async () => {
  const W = await import('../src/features/amp/ampCheckWhy.ts');
  const C = await import('../src/features/amp/ampContent.ts');
  it('Amp: every module check has a reason for every wrong option, never for the right one, ≤ 30 words', () => {
    for (const c of C.AMP_CHECKS) {
      const why = W.AMP_CHECK_WHY[c.id];
      assert.ok(why, c.id);
      for (let i = 0; i < c.options.length; i++) {
        if (i === c.correct) assert.equal(why[i], undefined, `${c.id}: no reason on the right option`);
        else {
          assert.ok(why[i], `${c.id}: option ${i} has its reason`);
          assert.ok(why[i].split(/\s+/).length <= 30, `${c.id}/${i} ≤ 30 words`);
          assert.ok(!why[i].includes(c.options[c.correct]), `${c.id}/${i} never quotes the answer`);
        }
      }
    }
  });
  it('Amp CheckCard: a first miss shows that option’s reason; the explanation only from the second different miss', () => {
    const k = read('src/screens/lab/amp/kit.tsx');
    assert.match(k, /`✗ Not quite — try another\. \$\{ampWrongLine\(check\.id, picked\)\}\$\{missed\.size >= 2 \? ` \$\{check\.explain\}` : ''\}`/);
    assert.doesNotMatch(k, /Not quite\. \$\{check\.explain\} — now choose/);
  });
  it('Cable Fundamentals L1: a wrong pick names what THAT category is', () => {
    const l = read('src/screens/lab/cable/lessons/lesson01.tsx');
    assert.match(l, /verdict === 'wrong' \? wrongPickLine\(picked, pair\.from\)/);
  });
  it('Cable Dressing stage 1: no nickname or judging caption before the pick', () => {
    const w = read('src/screens/lab/cableinstall/scenes/WhyScene.tsx');
    assert.match(w, /\{revealed \? ex\.name : ex\.id\.toUpperCase\(\)\}/);
    assert.match(w, /\{revealed \? ex\.caption : ex\.blind\}/);
    assert.equal((w.match(/    blind: '/g) ?? []).length, 4);
  });
});

describe('Phase 2 · end screens name what is missing; state-neutral WHERE TO START', async () => {
  const E = await import('../src/features/amp/ampEnd.ts');
  it('Amp rows: their own missing piece', () => {
    assert.equal(E.ampModuleLeft({ modules: {} }, 'what'), 'Still to do: answer its CHECK YOURSELF questions, then MARK COMPLETE ›.');
    assert.equal(E.ampModuleLeft({ modules: { what: { visited: true, done: false, checks: { 'w-energy': true } } } }, 'what'), 'Still to do: 2 more checks to answer, then MARK COMPLETE ›.');
    assert.equal(E.ampModuleLeft({ modules: { what: { visited: true, done: true, checks: {} } } }, 'what'), undefined);
    assert.match(E.ampModuleLeft({ modules: {} }, 'apply')!, /final assessment/);
  });
  it('Patchbay and Connector Selection pass pageDetail', () => {
    assert.match(read('src/screens/lab/patchbay/PatchbayLabScreen.tsx'), /pageDetail=\{pageDetail\}/);
    assert.match(read('src/screens/lab/connectorselect/ConnectorSelectLabScreen.tsx'), /pageDetail=\{pageDetail\}/);
  });
  it('open-to-count labs say the shared rule once (howItCounts); Gain names its one pass-only module', () => {
    for (const f of ['meter/MeterLabHomeScreen.tsx', 'meter/MeterModuleScreen.tsx', 'digital/DigitalLabHomeScreen.tsx', 'digital/DigitalModuleScreen.tsx', 'gain/GainLabHomeScreen.tsx', 'gain/GainModuleScreen.tsx', 'tube/VacuumTubeLabScreen.tsx']) {
      assert.match(read(`src/screens/lab/${f}`), /howItCounts="/, f);
    }
    assert.match(read('src/screens/lab/gain/GainModuleScreen.tsx'), /detail: m\.id === 'troubleshoot' \? GAIN_TROUBLESHOOT_LEFT : undefined/);
  });
  it('every F6 end guide starts state-neutral', () => {
    const NEU = 'Read WHERE TO START at the top: it names the next thing to do from where you are.';
    for (const f of ['amp/ampScreenGuides.ts', 'meter/meterScreenGuides.ts', 'gain/gainScreenGuides.ts', 'digital/digitalScreenGuides.ts', 'patchbay/patchbayScreenGuides.ts', 'connectorselect/connectorSelectScreenGuides.ts', 'tube/tubeScreenGuides.ts']) {
      assert.ok(read(`src/screens/lab/${f}`).includes(`start: '${NEU}'`), f);
    }
  });
});

describe('Phase 2 · silent learner, captions, arrival holds, accuracy chip', () => {
  it('Signal Chain: its own sound-off line; DELAY → REVERB tagged NEEDS SOUND with a can’t-listen path', () => {
    const s = read('src/screens/lab/SignalChainLabScreen.tsx');
    assert.match(s, /soundOffLine: 'Sound off\? Every step still works/);
    assert.match(s, /scenario\.key === 'delay_reverb' \? <NeedsSoundTag \/> : null/);
    assert.match(s, /Can’t listen now\? Read the chain left to right/);
  });
  it('Digital M2: HEAR THE FOLD is tagged and has a can’t-listen line', () => {
    const a = read('src/screens/lab/digital/modules/modAnalog.tsx');
    assert.match(a, /HEAR THE FOLD <NeedsSoundTag \/>/);
    assert.match(a, /Can’t listen now\? INPUT plays/);
  });
  it('bezel captions are 1–3 words, ≤ 14 characters', () => {
    const files = ['meter/modules/modMeterA.tsx', 'meter/modules/modMeterB.tsx', 'meter/modules/modMeterC.tsx', 'digital/modules/modAnalog.tsx', 'digital/modules/modQuant.tsx', 'digital/modules/modDac.tsx', 'digital/modules/modChain.tsx', 'gain/modules/modLearn.tsx', 'gain/modules/modExplore.tsx', 'SignalChainLabScreen.tsx', 'tube/VacuumTubeLabScreen.tsx', 'amp/modules/mod3Bias.tsx', 'amp/modules/mod4Classes.tsx', 'amp/modules/mod5ClassD.tsx', 'patchbay/rackLayout.tsx'];
    let n = 0;
    for (const f of files) {
      for (const m of read(`src/screens/lab/${f}`).matchAll(/caption: '((?:[^'\\]|\\.)*)'/g)) {
        n++;
        const c = m[1].replace(/\\'/g, "'");
        assert.ok(c.length <= 14 && c.split(/\s+/).length <= 3, `${f}: "${c}"`);
      }
    }
    assert.ok(n >= 40, `${n} captions`);
  });
  it('arrival holds: the Tube card waits out a load error; Cable Dressing waits for its intro drawing', () => {
    assert.match(read('src/screens/lab/tube/TubeCardScreen.tsx'), /<ScreenGuideHost regions=\{false\} resetKey="tubeCard" hold=\{failed\}>/);
    const c = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(c, /<ScreenGuideHost resetKey=\{guideKey\} regions=\{rackStage\} hold=\{introAnimating\}>/);
    assert.match(c, /setTimeout\(\(\) => setIntroAnimating\(false\), 1600\)/);
  });
  it('Tube reference cards: the ABOUT chip with only their own note (D37)', () => {
    assert.match(read('src/screens/lab/tube/TubeReferenceScreen.tsx'), /<AccuracyNote compact variant="about" label="ABOUT THESE CARDS"/);
    assert.match(read('src/screens/lab/tube/TubeCardScreen.tsx'), /<AccuracyNote compact variant="about" label="ABOUT THIS CARD"/);
  });
});

describe('Phase 2 · CheckSpec.why: every wrong option of every F6 CHECK YOURSELF question has its own reason', () => {
  // The shared card (foundations/bits CheckQuestion, F5) shows `why[picked]` on a wrong pick.
  // Parsed from source: question → options → correctIdx → why, so a NEW question without
  // reasons fails here.
  const FILES = [
    'meter/modules/modMeterA.tsx', 'meter/modules/modMeterB.tsx', 'meter/modules/modMeterC.tsx',
    'gain/modules/modLearn.tsx', 'digital/modules/clockingCard.ts', 'digital/modules/modAnalog.tsx',
    'digital/modules/modChain.tsx', 'digital/modules/modQuant.tsx', 'digital/modules/modDac.tsx',
    'tube/VacuumTubeLabScreen.tsx', 'SignalChainLabScreen.tsx', 'cable/data/lesson02.ts', 'cable/data/lesson03.ts',
    'cable/data/lesson06.ts', 'cable/data/lesson07.ts', 'cable/data/lesson12.ts', 'cableinstall/data/scenarios.ts',
  ];
  const STR = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|` + '`(?:[^`\\\\]|\\\\.)*`';
  it('117 questions, every wrong option covered, never the right one, ≤ 30 words, never quoting the answer', () => {
    let n = 0;
    for (const f of FILES) {
      const s = read(`src/screens/lab/${f}`);
      const re = new RegExp(String.raw`question:\s*(?:${STR}),\s*\n\s*options:\s*\[([\s\S]*?)\],\s*\n\s*correctIdx:\s*(\d+),\s*\n(\s*why: \{[\s\S]*?\n\s*\},)?`, 'g');
      for (const m of s.matchAll(re)) {
        if (f === 'cableinstall/data/scenarios.ts' && s.slice(0, m.index).includes('CI_FIRE_SPACES') && !s.slice(0, m.index).includes('CI_QUIZ')) {
          // the M11 fire-space flow has its own card (FireScene), not CheckQuestion
          if (s.indexOf('export type CiQuizItem') > m.index) continue;
        }
        n++;
        const opts = [...m[1].matchAll(new RegExp(STR, 'g'))].map((x) => x[0].slice(1, -1));
        const correct = Number(m[2]);
        assert.ok(m[3], `${f}: "${opts[correct]?.slice(0, 40)}" has no why`);
        const why = new Map([...m[3].matchAll(/^\s*(\d+): ('(?:[^'\\]|\\.)*'),$/gm)].map((x) => [Number(x[1]), x[2].slice(1, -1).replace(/\\'/g, "'")]));
        for (let i = 0; i < opts.length; i++) {
          if (i === correct) {
            assert.ok(!why.has(i), `${f}: a reason on the right option ${i}`);
            continue;
          }
          const w = why.get(i);
          assert.ok(w, `${f}: option ${i} of "${opts[correct].slice(0, 40)}" has no reason`);
          assert.ok(w!.split(/\s+/).length <= 30, `${f}: ${w}`);
          assert.ok(!w!.includes(opts[correct]), `${f}: a reason quotes the answer`);
        }
      }
    }
    assert.equal(n, 117);
  });
});

describe('Phase 2 · balanced options: the right answer is never more than 1.4× the next-longest option', async () => {
  // Owner approval (2026-11-14, report row 4 / pattern 4, via the coordinator): a right answer that is
  // obviously the longest gives itself away. Patchbay's checks are owner-RATIFIED copy (PatchbayLabScreen.tsx
  // header: "ALL COPY RATIFIED by the owner 2026-09-10", docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md) and stay as written.
  const FILES = [
    'meter/modules/modMeterA.tsx', 'meter/modules/modMeterB.tsx', 'meter/modules/modMeterC.tsx',
    'gain/modules/modLearn.tsx', 'digital/modules/clockingCard.ts', 'digital/modules/modAnalog.tsx',
    'digital/modules/modChain.tsx', 'digital/modules/modQuant.tsx', 'digital/modules/modDac.tsx',
    'tube/VacuumTubeLabScreen.tsx', 'SignalChainLabScreen.tsx', 'cable/data/lesson02.ts', 'cable/data/lesson03.ts',
    'cable/data/lesson06.ts', 'cable/data/lesson07.ts', 'cable/data/lesson12.ts', 'cableinstall/data/scenarios.ts',
  ];
  const STR = String.raw`'(?:[^'\\]|\\.)*'`;
  const unq = (x: string) => x.slice(1, -1).replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, '$1');
  const over = (opts: string[], c: number) => opts[c].length / Math.max(...opts.filter((_, i) => i !== c).map((o) => o.length));
  it('every CHECK YOURSELF question in F6’s labs (and the fire-space flow)', () => {
    let n = 0;
    for (const f of FILES) {
      const s = read(`src/screens/lab/${f}`);
      const re = new RegExp(String.raw`question:\s*(?:${STR}),\s*\n\s*(?:correctIdx:\s*(\d+),\s*\n\s*)?options:\s*\[([\s\S]*?)\],\s*\n\s*(?:correctIdx:\s*(\d+))?`, 'g');
      for (const m of s.matchAll(re)) {
        const c = Number(m[1] ?? m[3]);
        const opts = [...m[2].matchAll(new RegExp(STR, 'g'))].map((x) => unq(x[0]));
        if (opts.length < 2 || !Number.isFinite(c)) continue;
        n++;
        assert.ok(over(opts, c) <= 1.4, `${f}: "${opts[c]}" is ${over(opts, c).toFixed(2)}× the next-longest`);
      }
    }
    assert.ok(n >= 117, `${n}`);
  });
  it('every Amplifier check', async () => {
    const C = await import('../src/features/amp/ampContent.ts');
    for (const c of C.AMP_CHECKS) assert.ok(over(c.options, c.correct) <= 1.4, `${c.id}: ${over(c.options, c.correct).toFixed(2)}`);
  });
});

describe('Phase 2 · Cable Dressing fire-space flow card: a reason per wrong option, the answer after a second miss', () => {
  const F = read('src/screens/lab/cableinstall/scenes/FireScene.tsx');
  const D = read('src/screens/lab/cableinstall/data/scenarios.ts');
  const blocks = (s: string, key: string) =>
    [...s.matchAll(new RegExp(String.raw`${key}:\s*'(?:[^'\\]|\\.)*',\s*\n?\s*options:\s*\[([\s\S]*?)\],\s*\n\s*correctIdx:\s*(\d+),\s*\n\s*why: \{([\s\S]*?)\}`, 'g'))];
  it('5 flow questions + 3 spaces: every wrong option has its reason, none on the right one; options balanced', () => {
    const all = [...blocks(F, 'q'), ...blocks(D.slice(D.indexOf('CI_FIRE_SPACES'), D.indexOf('CI_LABEL_SCHEME_NOTE')), 'question')];
    assert.equal(all.length, 8);
    for (const m of all) {
      const opts = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
      const c = Number(m[2]);
      const keys = [...m[3].matchAll(/(\d+):/g)].map((x) => Number(x[1])).sort();
      assert.deepEqual(keys, opts.map((_, i) => i).filter((i) => i !== c));
      const next = Math.max(...opts.filter((_, i) => i !== c).map((o) => o.length));
      assert.ok(opts[c].length <= 1.4 * next, opts[c]);
    }
  });
  it('first pick is still the scored one; a wrong pick shows its reason, the explanation only on a right answer or from the second miss', () => {
    assert.match(F, /if \(solvedBy\(key, first, correct\)\) return reveal;/);
    assert.match(F, /return t\.length >= 2 \? `\$\{reason\} \$\{reveal\}` : `\$\{reason\} Try another answer\.`;/);
    assert.match(F, /const spaceWrong = CI_FIRE_SPACES\.filter\(\(s\) => spaces\[s\.id\] !== s\.correctIdx\)\.length;/);
  });
});

describe('Phase 2 · recap + next-lab card (labEndContent.ts, S4) reach every F6 lab end', () => {
  const ENDS: Array<[string, string]> = [
    ['src/screens/lab/digital/DigitalLabHomeScreen.tsx', 'af_digital_audio'],
    ['src/screens/lab/digital/DigitalModuleScreen.tsx', 'af_digital_audio'],
    ['src/screens/lab/meter/MeterLabHomeScreen.tsx', 'af_visual_analysis'],
    ['src/screens/lab/meter/MeterModuleScreen.tsx', 'af_visual_analysis'],
    ['src/screens/lab/gain/GainLabHomeScreen.tsx', 'af_gain_staging'],
    ['src/screens/lab/gain/GainModuleScreen.tsx', 'af_gain_staging'],
    ['src/screens/lab/tube/VacuumTubeLabScreen.tsx', 'tube'],
    ['src/screens/lab/amp/AmpLabHomeScreen.tsx', 'amp'],
    ['src/screens/lab/amp/AmpModuleScreen.tsx', 'amp'],
  ];
  it('each shared <LabEndScreen> carries its credit key as labId', () => {
    for (const [f, id] of ENDS) {
      const s = read(f);
      const at = s.indexOf('<LabEndScreen\n');
      assert.ok(at >= 0, f);
      const tag = s.slice(at, s.indexOf('/>', at));
      assert.match(tag, new RegExp(`\\blabId="${id}"`), f);
    }
  });
  it('the two cable labs with their own end screen draw LabRecapNext from labEndContentFor', () => {
    const X = read('src/screens/lab/cable/labEndExtras.tsx');
    assert.match(X, /const \{ recap, next \} = labEndContentFor\(labId\);/);
    assert.match(X, /if \(!next \|\| !claimLabLeave\(\)\) return;/);
    assert.match(X, /runSoon\(\(\) =>/);
    assert.match(X, /complete \? 'WHAT YOU LEARNED' : 'WHAT THIS LAB COVERS'/);
    assert.match(X, /complete \? 'UP NEXT' : 'AFTER THIS LAB'/);
    assert.match(read('src/screens/lab/cable/lessons/lesson12.tsx'), /<LabRecapNext labId="af_cables" complete=\{completion\.complete\} \/>/);
    assert.match(read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx'), /<LabRecapNext labId="af_cable_install" complete=\{done\} \/>/);
  });
});
