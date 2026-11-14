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
  it('module 4: the loudness model disclosure is printed once (the stage model note only, phase 3)', () => {
    assert.equal((A.match(/LOUDNESS_MODEL_NOTE/g) ?? []).length, 2, 'declared + the stage model note');
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
  it('M1: the model note is short enough not to be cut', () => {
    // S3 plain model note since phase 3 (owner decision 3; checker K3 F-1, 2026-11-14).
    const m = /modelNote: '(A slowed model[^']*)'/.exec(an);
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
    // Names 14 AWG, as the title, help and the 18/16 refusal do (checker C3 F-3, 2026-11-14).
    assert.match(a, /CONDUCTOR SIZE must be a gauge from 14 AWG up to 4\/0/);
    assert.doesNotMatch(a, /from 18 AWG up to/);
    assert.match(read('src/screens/lab/calc/workspaces/powerElec.ts'), /WIRE GAUGE must be from 40 AWG up to 4\/0/);
  });
  it('C3 F-3: 20 AWG gets the 14 AWG range sentence; 18 and 16 still reach their own explanation; the table is untouched', () => {
    const a = read('src/screens/lab/calc/workspaces/ampacity.ts');
    const range = a.match(/key: 'awg',[\s\S]*?range: \[(-?\d+), (-?\d+)\]/)!;
    assert.deepEqual([Number(range[1]), Number(range[2])], [-3, 18]);
    const rangeMsg = a.match(/rangeMsg:\s*'([^']+)'/)![1];
    const f = { name: 'CONDUCTOR SIZE (AWG)', integer: true, range: [-3, 18] as [number, number], rangeMsg };
    assert.match(U.domainMsg(f, 20) ?? '', /from 14 AWG up to 4\/0/);
    assert.equal(U.domainMsg(f, 18), null, '18 is in range, so awgRefusal explains it');
    assert.equal(U.domainMsg(f, 16), null);
    assert.match(a, /if \(g === 18 \|\| g === 16\) \{/);
    assert.match(a, /'This calculator covers 14 AWG and larger\.'/);
    // NEC 2023 Table 310.16 copper rows (hand-checked 2026-10-04, pinned in calcAmpacity_20261004).
    assert.match(a, /\[18, \[null, null, 14\]\],\n\s*\[16, \[null, null, 18\]\],\n\s*\[14, \[15, 20, 25\]\],/);
    assert.match(a, /\[-3, \[195, 230, 260\]\],/);
  });
  it('C3 F-4: the FIR half-sample line says "center"', () => {
    const d = read('src/screens/lab/calc/workspaces/digitalAdv.ts');
    assert.equal((d.match(/the filter’s center falls halfway between two taps/g) ?? []).length, 2);
    assert.doesNotMatch(d, /centre/);
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
  it('each module lab says its rule once (howItCounts) and each row says what is still to do (phase 3: done = work done)', () => {
    for (const f of ['meter/MeterLabHomeScreen.tsx', 'meter/MeterModuleScreen.tsx', 'digital/DigitalLabHomeScreen.tsx', 'digital/DigitalModuleScreen.tsx', 'gain/GainLabHomeScreen.tsx', 'gain/GainModuleScreen.tsx', 'tube/VacuumTubeLabScreen.tsx']) {
      const s = read(`src/screens/lab/${f}`);
      assert.match(s, /howItCounts=/, f);
      assert.doesNotMatch(s, /counts once you open it/, f);
    }
    assert.match(read('src/screens/lab/gain/GainModuleScreen.tsx'), /detail: GAIN_LEFT\[m\.id\]/);
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
  it('119 questions (117 + the two Tube module checks of phase 3), every wrong option covered, never the right one, ≤ 30 words, never quoting the answer', () => {
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
    assert.equal(n, 119);
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

describe('C3 F-2: first-visit bezel captions fit their cell at 390 and 320 (never cut with "…")', () => {
  // Measured in the 8142 preview at 320 and 390 (2026-11-14): each caption's
  // width at 10 px Barlow is no wider than its cell. The cut ones were renamed.
  const NOW: Array<[string, string[]]> = [
    ['src/screens/lab/meter/modules/modMeterA.tsx', ['overall', 'range', 'highest', 'real top', 'extra', 'clips', 'average', 'spiky?', 'shift', 'clipped?', 'max yet']],
    ['src/screens/lab/meter/modules/modMeterB.tsx', ['top vs low', 'bass fade', 'rings most']],
    ['src/screens/lab/meter/modules/modMeterC.tsx', ['mono level']],
    ['src/screens/lab/digital/modules/modAnalog.tsx', ['a second', 'top freq', 'heard as']],
    ['src/screens/lab/digital/modules/modChain.tsx', ['over hiss', 'until clip']],
    ['src/screens/lab/digital/modules/modQuant.tsx', ['step count', 'over hiss']],
    ['src/screens/lab/gain/modules/modLearn.tsx', ['until clip']],
    ['src/screens/lab/amp/AmpRig.tsx', ['power in', 'wasted', 'useful %']],
    ['src/screens/lab/amp/modules/mod4Classes.tsx', ['at rest', 'clean?']],
    ['src/screens/lab/SignalChainLabScreen.tsx', ['sound in']],
  ];
  const CUT = ['whole program', 'loud-soft span', 'top in between', 'times clipped', 'average level', 'peak vs avg', 'off-center', 'over the top?', 'highest yet',
    'high vs low', 'low-end fade', 'rings longest', 'level in mono', 'samples a sec', 'highest kept', 'what you get', 'signal vs hiss', 'room to clip', 'how many steps',
    'power drawn', 'wasted as heat', 'useful share', 'resting draw', 'clean or not', 'test sound'];
  it('the renamed captions are in place and the cut ones are gone from F6 labs', () => {
    for (const [f, caps] of NOW) {
      const s = read(f);
      for (const c of caps) assert.ok(s.includes(`caption: '${c}'`), `${f}: ${c}`);
      for (const c of CUT) assert.ok(!s.includes(`caption: '${c}'`), `${f}: ${c} is still there`);
    }
  });
  it('every caption in the C3 pages is 12 characters or fewer (the longest that measured inside its cell at 320 is "needle’s top", 52 px in a 53 px cell)', () => {
    for (const f of ['src/screens/lab/meter/modules/modMeterA.tsx', 'src/screens/lab/digital/modules/modQuant.tsx']) {
      for (const [, c] of read(f).matchAll(/caption: '([^']+)'/g)) assert.ok(c.length <= 12, `${f}: ${c}`);
    }
  });
});

describe('C3 O-1: the Peak Meter picture and the bezel read CREST from the same render', () => {
  it('both use the 1024-sample renderSignal(signal) scaled by the gain', () => {
    const v = read('src/screens/lab/meter/vizMeters.tsx');
    assert.match(v, /const crest = crestDb\(renderSignal\(sig\)\.map\(\(v\) => v \* gain\)\);/);
    assert.doesNotMatch(v, /crestDb\(renderSignal\(sig, n, 1\)/);
    const a = read('src/screens/lab/meter/modules/modMeterA.tsx');
    assert.match(a, /const sig = useMemo\(\(\) => renderSignal\(signal\), \[signal\]\);\n\s*const proc = useMemo\(\(\) => processed\(sig, gainDb\), \[sig, gainDb\]\);/);
    assert.match(a, /\{ k: 'CREST', v: `\$\{crestDb\(proc\)\.toFixed\(1\)\}dB`/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PHASE 3 (owner's decisions, 2026-11-14)
// ════════════════════════════════════════════════════════════════════════════

/** The source of one exported function component, up to the next top-level export/function. */
const fnBody = (src: string, name: string) => {
  const a = src.indexOf(`export function ${name}(`) >= 0 ? src.indexOf(`export function ${name}(`) : src.indexOf(`function ${name}(`);
  assert.ok(a >= 0, name);
  const rest = src.slice(a + 10);
  const m = rest.search(/\n(export )?function [A-Z]\w*\(/);
  return src.slice(a, m < 0 ? undefined : a + 10 + m);
};
const goalChecks = (body: string) => (body.match(/<GoalCheck\b/g) ?? []).length;

describe('Phase 3 · decision 1: a module counts when its goal or check is met, never on opening', async () => {
  const G = await import('../src/screens/lab/meter/moduleGoal.tsx').catch(() => null);
  it('the shared goal: enough distinct right answers, and never with nothing to answer', () => {
    const src = read('src/screens/lab/meter/moduleGoal.tsx');
    assert.match(src, /export function goalReached\(solved: ReadonlySet<string>, need: number\): boolean \{\n\s*return need > 0 && solved\.size >= need;/);
    assert.match(src, /goal\?\.solved\(spec\.question\);/);
    assert.match(src, /if \(firedRef\.current\) return;\n\s*firedRef\.current = true;/, 'fires once per visit');
    void G;
  });
  it('no module host marks credit on focus any more', () => {
    for (const f of ['digital/DigitalModuleScreen.tsx', 'meter/MeterModuleScreen.tsx', 'gain/GainModuleScreen.tsx']) {
      const s = read(`src/screens/lab/${f}`);
      assert.doesNotMatch(s, /if \(focused[^)]*\) markLabUnit/, f);
      assert.match(s, /<ModuleGoalProvider need=\{\w+_MODULE_CHECKS\[meta\.id\]\} onMet=\{onGoalMet\} resetKey=\{meta\.id\}>/, f);
    }
    const t = read('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
    assert.doesNotMatch(t, /markLabVisit\('tube', SECTIONS\[sectionIdx\]\.key/);
    assert.match(t, /goalsMet\.forEach\(\(key\) => markLabVisit\('tube', key, \{ persist: !guest \}\)\);/);
  });
  it('Digital: the check counts match what each module draws', async () => {
    const { DIGITAL_MODULE_CHECKS } = await import('../src/screens/lab/digital/modules/registry.ts');
    const A = read('src/screens/lab/digital/modules/modAnalog.tsx');
    const Q = read('src/screens/lab/digital/modules/modQuant.tsx');
    const C = read('src/screens/lab/digital/modules/modChain.tsx');
    const D = read('src/screens/lab/digital/modules/modDac.tsx');
    const drawn = {
      analog: goalChecks(fnBody(A, 'AnalogModule')), sampling: goalChecks(fnBody(A, 'SamplingModule')),
      quant: goalChecks(fnBody(Q, 'QuantModule')), binary: goalChecks(fnBody(Q, 'BinaryModule')),
      adc: goalChecks(fnBody(C, 'AdcModule')), processing: goalChecks(fnBody(C, 'ProcessingModule')),
      dac: goalChecks(fnBody(D, 'DacModule')), errors: goalChecks(fnBody(D, 'ErrorsModule')),
    };
    assert.deepEqual(drawn, DIGITAL_MODULE_CHECKS);
  });
  it('Meter: modules 1–10 count on their checks; Signal Detective on one whole case', async () => {
    const { METER_MODULE_CHECKS } = await import('../src/screens/lab/meter/modules/registry.ts');
    const A = read('src/screens/lab/meter/modules/modMeterA.tsx');
    const B = read('src/screens/lab/meter/modules/modMeterB.tsx');
    const C = read('src/screens/lab/meter/modules/modMeterC.tsx');
    const drawn = {
      waveform: goalChecks(fnBody(A, 'WaveformModule')), peak: goalChecks(fnBody(A, 'PeakModule')), vu: goalChecks(fnBody(A, 'VuModule')), loudness: goalChecks(fnBody(A, 'LoudnessModule')),
      spectrum: goalChecks(fnBody(B, 'SpectrumModule')), spectrogram: goalChecks(fnBody(B, 'SpectrogramModule')), waterfall: goalChecks(fnBody(B, 'WaterfallModule')),
      phase: goalChecks(fnBody(C, 'PhaseModule')), stereo: goalChecks(fnBody(C, 'StereoModule')), scope: goalChecks(fnBody(C, 'ScopeModule')), detective: 0,
    };
    assert.deepEqual(drawn, METER_MODULE_CHECKS);
    assert.match(C, /export function aCaseSolved\(solved: ReadonlySet<string>\): boolean \{\n\s*return CASES\.some\(\(_, ci\) => \[0, 1, 2, 3\]\.every\(\(q\) => solved\.has\(`\$\{ci\}-\$\{q\}`\)\)\);/);
    assert.match(C, /if \(aCaseSolved\(solvedRef\.current\)\) goalMet\(\);/);
  });
  it('Gain: four modules count on their check, three on a hands-on goal, the challenge on its pass', async () => {
    const { GAIN_MODULE_CHECKS, GAIN_LEFT } = await import('../src/screens/lab/gain/modules/registry.ts');
    const L = read('src/screens/lab/gain/modules/modLearn.tsx');
    const X = read('src/screens/lab/gain/modules/modExplore.tsx');
    assert.equal(goalChecks(fnBody(L, 'IntroModule')), GAIN_MODULE_CHECKS.intro);
    assert.equal(goalChecks(fnBody(L, 'FollowModule')), GAIN_MODULE_CHECKS.follow);
    assert.equal(goalChecks(fnBody(L, 'LowHighModule')), GAIN_MODULE_CHECKS.lowhigh);
    assert.equal(goalChecks(fnBody(L, 'FaderVsGainModule')), GAIN_MODULE_CHECKS.fadervsgain);
    assert.match(fnBody(L, 'InputGainModule'), /useMetWhen\(done\);/);
    assert.match(fnBody(X, 'MultiStageModule'), /useMetWhen\(healthy\);/);
    assert.match(fnBody(X, 'FreePlayModule'), /useMetWhen\(source !== -30 \|\| /);
    assert.match(X, /if \(healthy\) markLabUnit\('af_gain_staging', 'troubleshoot'\);/);
    for (const id of Object.keys(GAIN_MODULE_CHECKS)) assert.match(GAIN_LEFT[id as keyof typeof GAIN_LEFT], /^Still to do: /);
  });
  it('Gain: neither hands-on goal is met at the start (opening never counts)', async () => {
    const E = await import('../src/screens/lab/gain/gainEngine.ts');
    const mk = (key: string, kind: string, gain: number, min: number, max: number) => ({ key, name: key, kind, gain, min, max, adjustable: true }) as never;
    const multi = { pre: 8, eq: -6, comp: 0, fad: 6, bus: 6, out: 0 };
    assert.match(read('src/screens/lab/gain/modules/modExplore.tsx'), /const MULTI_START: Gains = \{ pre: 8, eq: -6, comp: 0, fad: 6, bus: 6, out: 0 \};/);
    const chain = [mk('pre', 'preamp', multi.pre, 0, 40), mk('eq', 'eq', multi.eq, -12, 12), mk('comp', 'comp', multi.comp, -12, 12), mk('fad', 'fader', multi.fad, -30, 10), mk('bus', 'bus', multi.bus, -12, 12), mk('out', 'output', multi.out, -30, 6)];
    assert.equal(E.chainIsHealthy(E.computeChain(-30, chain)), false, 'Multiple Gain Stages starts unbalanced');
    const input = E.computeChain(-30, [{ key: 'pre', name: 'Preamp', kind: 'preamp', gain: 0, min: 0, max: 40, adjustable: true } as never, { key: 'out', name: 'Output', kind: 'output', gain: 0, min: -30, max: 6, adjustable: false } as never]);
    assert.notEqual(input[1].region, 'healthy', 'Input Gain First starts below the healthy green');
  });
  it('Vacuum Tube: each module has its task; two reading modules gained their own check', () => {
    const t = read('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
    const checks = t.match(/export const TUBE_SECTION_CHECKS: Record<TubeSectionId, number> = \{([\s\S]*?)\};/)![1];
    const n = Object.fromEntries([...checks.matchAll(/(\w+): (\d)/g)].map((m) => [m[1], Number(m[2])]));
    const comp: Record<string, string> = { inside: 'InsideSection', flow: 'FlowSection', grid: 'GridSection', amplify: 'AmplifySection', highv: 'HighVoltSection', types: 'TypesSection', bias: 'BiasSection', sat: 'SaturationSection', versus: 'VersusSection' };
    for (const [k, fn] of Object.entries(comp)) {
      const body = fnBody(t, fn);
      if (n[k]) assert.equal(goalChecks(body), n[k], k);
      else assert.match(body, /useMetWhen\(/, `${k} has a hands-on goal`);
    }
    assert.match(t, /useMetWhen\(touched\.size >= PARTS\.length\);/);
    assert.match(t, /useMetWhen\(stageNum === FLOW_STAGES\.length\);/);
    assert.match(t, /useMetWhen\(highB\);/);
    assert.match(t, /useMetWhen\(seenTypes\.size >= TYPES\.length\);/);
    assert.match(t, /useMetWhen\(state === 'SATURATED'\);/);
    assert.doesNotMatch(t, /noun="section"/);
  });
  it('the words: no lab of F6 says opening counts', () => {
    for (const f of ['meter/meterScreenGuides.ts', 'digital/digitalScreenGuides.ts', 'gain/gainScreenGuides.ts', 'tube/tubeScreenGuides.ts', 'meter/MeterLabHomeScreen.tsx', 'digital/DigitalLabHomeScreen.tsx', 'gain/GainLabHomeScreen.tsx']) {
      const s = read(`src/screens/lab/${f}`);
      assert.doesNotMatch(s, /counts? (as done )?(once|as soon as) you open|you haven’t opened|modules you’ve opened|✓ means you’ve opened|marks a module you’ve opened/, f);
    }
  });
  it('stored progress is untouched: an old record (every old id banked) still reads LAB COMPLETE', async () => {
    const L = await import('../src/screens/lab/kit/labEnd.ts');
    const { DIGITAL_MODULES } = await import('../src/screens/lab/digital/modules/registry.ts');
    const { METER_MODULES } = await import('../src/screens/lab/meter/modules/registry.ts');
    const { GAIN_MODULES } = await import('../src/screens/lab/gain/modules/registry.ts');
    // The ids an earlier build banked (unchanged: nothing was split or renamed).
    const OLD = {
      digital: ['analog', 'sampling', 'quant', 'binary', 'adc', 'processing', 'dac', 'errors'],
      meter: ['waveform', 'peak', 'vu', 'loudness', 'spectrum', 'spectrogram', 'waterfall', 'phase', 'stereo', 'scope', 'detective'],
      gain: ['intro', 'input', 'follow', 'lowhigh', 'fadervsgain', 'multistage', 'freeplay', 'troubleshoot'],
    };
    for (const [lab, mods] of [['digital', DIGITAL_MODULES], ['meter', METER_MODULES], ['gain', GAIN_MODULES]] as const) {
      const units = mods.map((m) => ({ id: m.id, label: m.title }));
      assert.equal(L.endTitle(L.whatsLeft(units, new Set(OLD[lab]))), 'LAB COMPLETE', lab);
    }
  });
});

describe('Phase 3 · decision 2: no "N of total" progress counters in F6 labs', () => {
  it('the counters became plain names or what is left', () => {
    const amp = read('src/screens/lab/amp/modules/mod8Apply.tsx');
    assert.match(amp, /\{ k: 'PICTURE', v: `\$\{diagIdx \+ 1\}`/);
    assert.doesNotMatch(amp, / of \{DIAG_ORDER\.length\}| of \{APP_SCENARIOS\.length\}| of \{MYTH_REVIEW_IDS\.length\}|OF 6 DIMENSIONS|of \{finalItems\.length\}|of \{diagScore\.total\}/);
    const host = read('src/screens/lab/amp/AmpModuleScreen.tsx');
    assert.doesNotMatch(host, /\{answeredCount\} OF \{checks\.length\}|of \$\{AMP_MODULES\.length\}/);
    assert.match(host, /` · \$\{checks\.length - answeredCount\} TO ANSWER`/);
    assert.doesNotMatch(read('src/screens/lab/patchbay/pagesB.tsx'), / OF \$\{(PREDICT_SCENARIOS|DETECTIVE_CASES)\.length\}/);
    assert.doesNotMatch(read('src/screens/lab/patchbay/pagesC.tsx'), / OF \$\{WRONG_PATCH_CASES\.length\}/);
    assert.doesNotMatch(read('src/screens/lab/cableinstall/scenes/FireScene.tsx'), /QUESTION \{qi \+ 1\} \/ \{FLOW\.length\}/);
    const know = read('src/screens/lab/cableinstall/scenes/KnowScene.tsx');
    assert.doesNotMatch(know, / of \{CI_CABLE_TYPES\.length\}| OF \{CI_ID_SCENARIOS\.length\}| of 12 calls/);
    const mech = read('src/screens/lab/cableinstall/scenes/MechScene.tsx');
    assert.doesNotMatch(mech, /OF \{total\}|of \{CI_BEND_EXERCISES\.length\} bends/);
    assert.doesNotMatch(read('src/screens/lab/cableinstall/scenes/CeilingScene.tsx'), /\{found\.size\} of \{CI_CEILING_DEFECTS\.length\}/);
    assert.doesNotMatch(read('src/screens/lab/tube/TubeCardScreen.tsx'), /\/ \{TUBE_REFS\.length\}/);
  });
  it('values that are not progress stay (CHAIN units in, the warm-up STAGE, LAYERS shown)', () => {
    assert.match(read('src/screens/lab/SignalChainLabScreen.tsx'), /\{ k: 'CHAIN', v: `\$\{chainCount\}\/9`/);
    assert.match(read('src/screens/lab/tube/VacuumTubeLabScreen.tsx'), /\{ k: 'STAGE', v: `\$\{stageNum\}\/5`/);
  });
});

describe('Phase 3 · decision 3: one unit word per lab; S3’s plain model note', () => {
  it('Cable Fundamentals says lesson, Cable Dressing says stage, Patchbay and Connector Selection say page', () => {
    assert.match(read('src/screens/lab/cable/CableLabScreen.tsx'), /<LabNounProvider value="lesson">/);
    const ci = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(ci, /<LabNounProvider value="stage">/);
    assert.match(ci, /`RESUME — STAGE \$\{firstIncomplete\}`/);
    assert.match(read('src/screens/lab/patchbay/PatchbayLabScreen.tsx'), /unitNoun="page"/);
    assert.match(read('src/screens/lab/connectorselect/ConnectorSelectLabScreen.tsx'), /unitNoun="page"/);
    assert.doesNotMatch(read('src/screens/lab/patchbay/patchbayScreenGuides.ts'), /calls each page a MODULE|\(MODULE, with/);
  });
  it('Patchbay declares its three reading pages', () => {
    assert.match(read('src/screens/lab/patchbay/pagesA.tsx'), /Component: PageDirection, reading: true \}/);
    assert.match(read('src/screens/lab/patchbay/pagesA.tsx'), /Component: PagePair, reading: true, rack: true \}/);
    assert.match(read('src/screens/lab/patchbay/pagesB.tsx'), /Component: PageWrap, reading: true \}/);
  });
  it('Meter: every stage carries a plain model note (≤ 90 characters), no all-caps badge', () => {
    for (const f of ['modMeterA.tsx', 'modMeterB.tsx', 'modMeterC.tsx']) {
      const s = read(`src/screens/lab/meter/modules/${f}`);
      assert.doesNotMatch(s, /^\s*badge: /m, f);
      for (const m of s.matchAll(/(?:const \w+_NOTE|const HONESTY|modelNote:) = ?'([^']+)'|modelNote: '([^']+)'/g)) {
        const t = m[1] ?? m[2];
        assert.ok(t.length <= 90, t);
        assert.notEqual(t, t.toUpperCase(), 'sentence case');
      }
    }
  });
});

describe('Phase 3 · decision 5: long pages, beginner core first', () => {
  it('Digital modules 2, 3, 7 and 8 keep lesson one open and fold lesson two (nothing removed)', () => {
    const A = fnBody(read('src/screens/lab/digital/modules/modAnalog.tsx'), 'SamplingModule');
    const Q = fnBody(read('src/screens/lab/digital/modules/modQuant.tsx'), 'QuantModule');
    const D = read('src/screens/lab/digital/modules/modDac.tsx');
    const fold = (s: string, title: string, inside: string[]) => {
      const a = s.indexOf(`<CollapsibleSection title="${title}" startOpen={false}>`);
      assert.ok(a > 0, title);
      const body = s.slice(a, s.indexOf('</CollapsibleSection>', a));
      for (const x of inside) assert.ok(body.includes(x), `${title}: ${x}`);
    };
    fold(A, 'PART 2 · THE ANTI-ALIASING FILTER', ['ANTI-ALIASING FILTER</Text>', '<GoalCheck spec={CHECK_AA} />']);
    assert.ok(A.indexOf('<GoalCheck spec={CHECK_ALIAS} />') < A.indexOf('PART 2 ·'));
    fold(Q, 'PART 2 · DITHER', ['DITHER — THE FIX FOR CORRELATED ERROR', '<GoalCheck spec={CHECK_DITHER} />']);
    fold(fnBody(D, 'DacModule'), 'PART 2 · OVERSAMPLING AND INTER-SAMPLE PEAKS', ['SPECTRAL IMAGES & OVERSAMPLING', 'INTER-SAMPLE PEAK EXPLORER', 'Every sample in a file sits below 0 dBFS.']);
    fold(fnBody(D, 'ErrorsModule'), 'PART 2 · MYTHS, DATA RATE AND THE LAB REVIEW', ['MODULE 8 · MYTH vs REALITY', 'DATA RATE — THE MENTAL MATH', 'Which signal chain is in the correct order?', 'A sensible format pairing?']);
  });
  it('Cable lesson 3 opens its connector record folded', () => {
    assert.match(read('src/screens/lab/cable/lessons/lesson03.tsx'), /<ConnectorCard rec=\{rec\} folded \/>/);
    assert.match(read('src/screens/lab/cable/lessons/connectorCard.tsx'), /<Section title="CONTACTS & USES" startOpen=\{!folded\}>/);
  });
  it('Amp module 7: the six-section step is two steps; step position is never stored, so nothing earned moves', () => {
    const m = read('src/screens/lab/amp/modules/mod7RealWorld.tsx');
    assert.match(m, /key: 'practice',\n\s*title: 'Loads, power and bridging',/);
    assert.match(m, /key: 'risk',\n\s*title: 'Loudness, risk and spec sheets',/);
    assert.ok(m.indexOf("key: 'risk'") < m.indexOf('5 · WATTS AND LOUDNESS'));
    assert.ok(m.indexOf("key: 'risk'") > m.indexOf('4 · BRIDGED OPERATION'));
    assert.doesNotMatch(read('src/screens/lab/amp/steps.tsx'), /createLocalStore|AsyncStorage|persist/);
  });
});

describe('Checker K3 (phase 3): plain notes, no leftover counters, one word, plain English', () => {
  it('F-1: Digital, Tube, Gain and Signal Chain racks use a plain model note; no all-caps badge left', () => {
    const files = ['digital/modules/modAnalog.tsx', 'digital/modules/modChain.tsx', 'digital/modules/modDac.tsx', 'digital/modules/modQuant.tsx', 'tube/VacuumTubeLabScreen.tsx', 'gain/modules/modLearn.tsx', 'gain/modules/modExplore.tsx', 'SignalChainLabScreen.tsx'];
    for (const f of files) {
      const s = read(`src/screens/lab/${f}`);
      assert.doesNotMatch(s, /^\s*badge:/m, f);
      for (const m of s.matchAll(/modelNote:\s*'([^']+)'/g)) {
        assert.ok(m[1].length <= 90, `${f}: ${m[1]}`);
        assert.notEqual(m[1], m[1].toUpperCase(), `${f}: sentence case`);
      }
      for (const m of s.matchAll(/<Badge text="([^"]+)"/g)) assert.notEqual(m[1], m[1].toUpperCase(), `${f}: ${m[1]}`);
    }
    assert.match(read('src/screens/lab/digital/modules/modAnalog.tsx'), /modelNote: 'Each dot measures the continuous signal; below Nyquist the dots describe it fully\.'/);
    assert.match(read('src/screens/lab/tube/VacuumTubeLabScreen.tsx'), /modelNote: 'A drawn cross-section, not measured tube data\.'/);
    assert.match(read('src/screens/lab/digital/bits.tsx'), /badge: \{ fontFamily: fonts\.barlowRegular, fontSize: 12, lineHeight: 16, color: colors\.textSub \}/);
  });
  it('F-4: no "n of N" / "n OF N" progress left in either cable lab', () => {
    const files = [
      ...['lesson02.tsx', 'lesson05.tsx', 'lesson11.tsx', 'lesson12.tsx'].map((f) => `src/screens/lab/cable/lessons/${f}`),
      ...['FireScene.tsx', 'KnowScene.tsx', 'MechScene.tsx', 'RackScene.tsx', 'RouteScene.tsx', 'SupportsScene.tsx', 'WallsScene.tsx', 'CeilingScene.tsx'].map((f) => `src/screens/lab/cableinstall/scenes/${f}`),
    ];
    for (const f of files) {
      const s = read(f);
      assert.doesNotMatch(s, /\$\{[^}]+\} OF \$\{[^}]+(length|N)\}|\} OF \{[^}]+\}|\{[^}]+\} of \{[A-Z_.]+(length)?\} (sorted|pull|bends|reviewed|violations)|Found \$\{nx\.size\} of/, f);
    }
    assert.match(read('src/screens/lab/cableinstall/scenes/SupportsScene.tsx'), /\{correct\} correct · \{Math\.max\(0, N - answered\)\} left to sort/);
  });
  it('F-5: Cable Fundamentals counts LESSONS DONE under its LESSON tag, never units', () => {
    const s = read('src/screens/lab/cable/CableLabScreen.tsx');
    assert.match(s, /const lessonsDone = navUnits\.filter\(\(u\) => u\.done\)\.length;/);
    assert.match(s, /`\$\{lessonsDone\} \$\{lessonsDone === 1 \? 'LESSON' : 'LESSONS'\} DONE`/);
    assert.doesNotMatch(s, /UNITS CLEARED/);
  });
  it('plain English: "both of its", and "Slide" a lane, never "ride"', async () => {
    const { digitalLeftDetail } = await import('../src/screens/lab/digital/modules/registry.ts');
    assert.equal(digitalLeftDetail('sampling'), 'Still to do: answer both of its CHECK YOURSELF questions right.');
    assert.equal(digitalLeftDetail('errors'), 'Still to do: answer all 5 of its CHECK YOURSELF questions right.');
    for (const f of ['meter/modules/modMeterA.tsx', 'meter/modules/modMeterB.tsx', 'digital/modules/modAnalog.tsx', 'digital/modules/modChain.tsx', 'digital/modules/modQuant.tsx']) {
      assert.doesNotMatch(read(`src/screens/lab/${f}`), /Ride the [A-Z]|ride the [A-Z]{3,} (fader|lane)/, f);
    }
  });
});
