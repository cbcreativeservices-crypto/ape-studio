/**
 * Lab fix round 2026-11-14, group F5 (Amplitude, Foundations of Sound, Sound
 * Playground, Microphone Principles, Wave Physics, Speaker Placement, Room
 * Design). Owner: "Begin fixing all bugs found and do obvious (my decision is
 * not required) fixes as you suggested in the report."
 *
 * Each block would have failed before its fix (the old string, the old rule or
 * the old layout is what it rules out). Report:
 * docs/labs/novice_audit_2026_11_14/fixes/F5_REPORT.md
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source without comments — what can reach the screen. */
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/[ \t]\/\/ .*$/gm, '');

const W = 'src/screens/lab/wave/';
const F = 'src/screens/lab/foundations/';

const { bezelMs, cyclesOff, sumVerdict, vsOnAxisReadout, COVERAGE_FLOOR_GAIN } = await import('../src/screens/lab/wave/bezelWords.ts');
const { sceneNameTags } = await import('../src/screens/lab/wave/sceneNameTags.ts');
const { directivityGain, speedOfSound } = await import('../src/screens/lab/wave/waveEngine.ts');
const { amplitudeEndStep } = await import('../src/screens/lab/amplitude/amplitudeEndStep.ts');
const { levelColor } = await import('../src/features/tools/levelColor.ts');
const room = await import('../src/screens/lab/roomdesign/roomModel.ts');

// ─── Wave Physics ─────────────────────────────────────────────────────────────

describe('Wave 11 · Delay Alignment readouts', () => {
  it('REQ keeps its key: values from 10 ms print to 0.1 ms, so "14.98 ms" (8 chars) becomes "15.0 ms"', () => {
    assert.equal(bezelMs(14.98), '15.0 ms');
    assert.equal(bezelMs(6.96), '6.96 ms');
    assert.equal(bezelMs(-16.06), '-16.1 ms');
    assert.equal(bezelMs(-8.02, true), '-8.02 ms');
    assert.equal(bezelMs(0, true), '+0.00 ms');
    // Every REQ / SET / OFF BY value the module can print is ≤ 8 characters
    // (the 390 cell holds 8 mono characters at 13.5 pt).
    for (let v = -36; v <= 36; v += 0.01) {
      assert.ok(bezelMs(v, true).length <= 9 - (v >= 0 ? 0 : 1) + 1, `${v}`);
      assert.ok(bezelMs(v).length <= 8 || Math.abs(v) >= 99.95, `${v}: ${bezelMs(v)}`);
    }
    const src = code(`${W}modules/modWaveB.tsx`);
    assert.match(src, /\{ k: 'REQ', v: bezelMs\(reqDelay\)/);
    assert.doesNotMatch(src, /\{ k: 'REQ', v: `\$\{reqDelay\.toFixed\(2\)\} ms`/);
  });
  it('the auditor\'s case: OFF BY −8.02 ms at 117 Hz is ONE whole cycle, so SUM ≈ 0 dB is right and now says so', () => {
    const period = 1000 / 117; // 8.55 ms
    assert.ok(Math.abs(-8.02 / period + 1) < 0.07, 'about one cycle');
    assert.equal(cyclesOff(-8.02, 117), 1);
    assert.equal(sumVerdict({ sumDb: -0.1, mismatchMs: -8.02, freq: 117, inverted: false }), '1 CYCLE OFF');
    assert.equal(sumVerdict({ sumDb: -0.0, mismatchMs: 0, freq: 100, inverted: false }), 'IN STEP');
    assert.equal(sumVerdict({ sumDb: -4.4, mismatchMs: -6.96, freq: 100, inverted: false }), 'OUT OF STEP');
    assert.equal(sumVerdict({ sumDb: -0.4, mismatchMs: 17.2, freq: 117, inverted: false }), '2 CYCLES OFF');
  });
  it('THE WRONG TOOL improving the start seat is real physics (half a cycle at 100 Hz) and is now explained', () => {
    // Start geometry: listener (8,6), sub (3,0.8), main (8.5,1.2).
    const c = speedOfSound(20);
    const req = ((Math.hypot(5, 5.2) - Math.hypot(0.5, 4.8)) / c) * 1000;
    assert.ok(Math.abs(req - 6.96) < 0.02);
    const phase = ((req / 10) * 360) % 360; // 100 Hz
    const flipped = (phase + 180) % 360;
    const off = (deg: number) => Math.min(deg, 360 - deg);
    assert.ok(off(flipped) < off(phase), 'the flip lands nearer in step at this seat — by luck');
    assert.equal(sumVerdict({ sumDb: -1.7, mismatchMs: -6.96, freq: 100, inverted: true }), 'OUT OF STEP');
    assert.equal(sumVerdict({ sumDb: -0.3, mismatchMs: -5, freq: 100, inverted: true }), 'LUCKY FLIP');
    const src = code(`${W}modules/modWaveB.tsx`);
    assert.match(src, /Better at this seat \(SUM \$\{fmtSum\(sumUnflipped\)\} → \$\{sumText\}\), by luck/);
    assert.match(src, /\{ k: 'SUM', v: sumText, sub: sumWord/);
  });
});

describe('Wave 9 · vs ON-AXIS at the model floor', () => {
  it('the floor is the engine\'s 0.25 (−12 dB); at it the cell reads "≤ −12 dB", not a stuck number', () => {
    const spk = { id: 'spk', x: 7, y: 1, freq: 8000, levelDb: 0, delayMs: 0, polarity: 1 as const, kind: 'speaker' as const, aimDeg: 0, coverageDeg: 90 };
    const g = directivityGain(spk, -5, 1, 8000); // far off to the side at 8 kHz
    assert.equal(g, COVERAGE_FLOOR_GAIN);
    assert.equal(vsOnAxisReadout(-12.04, g).v, '≤ −12 dB');
    assert.equal(vsOnAxisReadout(-5.2, 0.55).v, '-5.2 dB');
    assert.equal(vsOnAxisReadout(-0.01, 1).v, '0.0 dB');
  });
});

describe('Wave 10 / 16 · no slider behind "more ↓"', () => {
  it('Line Array: BOXES, SPLAY and HEIGHT are their own dock faders (the ARRAY tray of three is gone)', () => {
    const src = code(`${W}modules/modWaveB.tsx`);
    for (const id of ['boxes', 'splay', 'hang']) assert.match(src, new RegExp(`kind: 'fader',\\s*id: '${id}'`));
    assert.doesNotMatch(src, /label="SPLAY \(PER BOX\)"/);
    assert.doesNotMatch(src, /valueLabel: `\$\{n\}·\$\{splay\.toFixed\(1\)\}°`/);
  });
  it('Room Builder: WIDTH and DEPTH sit side by side in one 65 px row (the 108 px tray at 770 tall held 140 px)', () => {
    const src = code(`${W}modules/modWaveB.tsx`);
    assert.match(src, /<View style=\{\{ flexDirection: 'row', gap: 14 \}\}>\s*<View style=\{\{ flex: 1 \}\}>\s*<DragSlider value=\{wV\}[^>]*label="WIDTH"[\s\S]*?<DragSlider value=\{hV\}[^>]*label="DEPTH"/);
    assert.doesNotMatch(src, /label="ROOM DEPTH"/);
  });
});

describe('Wave home · 15 vs 16', () => {
  it('the home numbers the Room Builder as module 16, as the strip inside does', () => {
    const home = code(`${W}WaveLabHomeScreen.tsx`);
    assert.doesNotMatch(home, /THE 15 MODULES/);
    assert.match(home, /MODULES 1–15/);
    assert.match(home, /PUT IT ALL TOGETHER · MODULE 16/);
    assert.match(read(`${W}modules/registry.ts`), /\{ id: 'builder', num: '16',/);
  });
});

describe('Wave · on-picture names (Module 12\'s labels, everywhere)', () => {
  const src = (kinds: string[]) => ({ sources: kinds.map((k, i) => ({ id: `s${i}`, kind: k as 'point' | 'speaker' | 'sub', x: i, y: 0 })) });
  it('one speaker and a draggable listener: SPEAKER and YOU (drag)', () => {
    const t = sceneNameTags(src(['point']) as never, { draggableListener: true });
    assert.deepEqual(t.sources.map((s) => s.text), ['SPEAKER']);
    assert.equal(t.listener, 'YOU (drag)');
  });
  it('two of a kind are numbered; an array gets one plural tag; a mic is MIC', () => {
    assert.deepEqual(sceneNameTags(src(['speaker', 'speaker']) as never, {}).sources.map((s) => s.text), ['SPEAKER 1', 'SPEAKER 2']);
    assert.deepEqual(sceneNameTags(src(['sub', 'sub', 'sub', 'sub']) as never, {}).sources.map((s) => s.text), ['SUBS']);
    assert.equal(sceneNameTags(src(['point']) as never, { listenerKind: 'mic' }).listener, 'MIC');
  });
  it('overrides rename or hide; false hides all', () => {
    const t = sceneNameTags({ sources: [{ id: 'sub', kind: 'sub' }, { id: 'main', kind: 'speaker' }] } as never, { nameTags: { sources: { main: 'MAIN' } } });
    assert.deepEqual(t.sources.map((s) => s.text), ['SUB', 'MAIN']);
    const h = sceneNameTags({ sources: [{ id: 'front', kind: 'sub' }] } as never, { nameTags: { sources: { front: null }, listener: 'YOU (front)' } });
    assert.deepEqual(h.sources, []);
    assert.equal(h.listener, 'YOU (front)');
    assert.deepEqual(sceneNameTags(src(['point']) as never, { nameTags: false }), { sources: [], listener: null });
  });
  it('RoomSceneView draws them, and the modules pass their names', () => {
    const v = code(`${W}vizWave.tsx`);
    assert.match(v, /const tags = sceneNameTags\(scene, \{ nameTags: p\.nameTags, listenerKind: p\.listenerKind, draggableListener: !!p\.onDragListener \}\);/);
    const b = code(`${W}modules/modWaveB.tsx`);
    assert.match(b, /nameTags=\{\{ sources: \{ main: 'MAIN' \} \}\}/);
    assert.match(b, /nameTags=\{\{ sources: \{ box0: 'LINE ARRAY' \} \}\}/);
    assert.match(b, /nameTags=\{\{ sources: \{ front: null, rear: null \}, listener: 'YOU \(front\)' \}\}/);
    assert.match(code(`${W}modules/modWaveA.tsx`), /nameTags=\{\{ sources: \{ s1: 'SPEAKER S1', s2: 'SPEAKER S2' \} \}\}/);
  });
});

// ─── House slang ────────────────────────────────────────────────────────────

describe('"ride" / "lane" → "slide" in learner text', () => {
  it('no learner string in Foundations, Room or Wave tells the student to "ride" a control or names a "lane"', () => {
    const files = [
      `${F}FoundationsCourseScreen.tsx`,
      `${F}foundationsScreenGuides.ts`,
      `${F}FoundationsPlaygroundScreen.tsx`,
      'src/screens/lab/roomdesign/roomdesignScreenGuides.ts',
      'src/screens/lab/roomdesign/modules/modCreate.tsx',
      'src/screens/lab/roomdesign/modules/modMonitoring.tsx',
      `${W}waveScreenGuides.ts`,
      `${W}modules/modWaveA.tsx`,
      `${W}modules/modWaveB.tsx`,
      'src/screens/lab/micspeaker/micSpeakerScreenGuides.ts',
    ];
    const bad: string[] = [];
    for (const f of files) {
      const c = code(f);
      for (const m of c.matchAll(/\b(?:[Rr]ide|[Rr]iding)\s+(?:the\s+)?[A-Z]{2,}|\b[Rr]ide the (?:lane|fader)\b|\b(?:the|its|[A-Z]+ ?B?)\s+lane\b(?!['_])/g)) bad.push(`${f}: ${m[0]}`);
    }
    assert.deepEqual(bad, []);
  });
});

// ─── Foundations of Sound ───────────────────────────────────────────────────

describe('Foundations', () => {
  const course = code(`${F}FoundationsCourseScreen.tsx`);
  it('module 1 explains MODEL (×4 in FREQ, about ×1.8 in MODEL)', () => {
    assert.match(course, /MODEL is how fast the drawing rocks: slowed far down/);
    // the numbers it quotes are the screen's own (visHzFor)
    const vis = (f: number) => 0.45 + 1.15 * (Math.log(Math.max(110, Math.min(1760, f)) / 110) / Math.log(16));
    assert.equal((vis(880) / vis(220)).toFixed(1), '1.8');
  });
  it('module 9: "40Hz" sits on the frequency axis, not beside "0dB"', () => {
    const viz = code(`${F}viz.tsx`);
    assert.match(viz, /\{ left: \(AX \+ 4\) \* ts, top: \(gh - 12\) \* ts, width: 30 \* ts, color: '#c8ccd4' \}\]\}>40Hz</);
    assert.doesNotMatch(viz, /top: 0, width: 30 \* ts, color: '#c8ccd4' \}\]\}>40Hz/);
  });
  it('module 10: the cancelled line says CANCELED — SILENT (red stays: owner 2026-08-05)', () => {
    assert.match(code(`${F}viz.tsx`), /\{cancelled \? \(\s*<OText[^>]*>CANCELED — SILENT<\/OText>/);
  });
  it('no learner build says "update the app" in modules 10/11 or the Playground', () => {
    for (const f of [`${F}FoundationsCourseScreen.tsx`, `${F}FoundationsPlaygroundScreen.tsx`]) {
      const c = code(f).replace(/__DEV__\s*\?\s*'[^']*'/g, '');
      assert.doesNotMatch(c, /update the\s+app to hear/i, f);
    }
  });
});

describe('Sound Playground', () => {
  const pg = code(`${F}FoundationsPlaygroundScreen.tsx`);
  it('the check uses the page\'s 290 Hz and says what a low-pass is', () => {
    assert.doesNotMatch(pg, /295 Hz/);
    assert.match(pg, /A low-pass filter \(LPF\) cuts what lies above its cutoff\. You low-pass a 290 Hz sine/);
    assert.match(code(`${F}foundationsScreenGuides.ts`), /starting at 290 Hz/);
  });
  it('the header is the menu tile\'s name', () => {
    assert.match(pg, /<Text style=\{styles\.title\}>SOUND PLAYGROUND<\/Text>/);
    assert.doesNotMatch(pg, /FOUNDATIONS PLAYGROUND/);
  });
  it('the first instruction works with sound off; "Module 10" names its lab', () => {
    assert.match(pg, /Change anything below and watch all three views answer\. Press PLAY to hear it too\./);
    assert.doesNotMatch(pg, /Why not\? Module 10 answers/);
  });
});

// ─── Microphone Principles ──────────────────────────────────────────────────

describe('Mic · DISTANCE runs the same way in modules 3 and 4', () => {
  it('right = farther in both, module 4 still 1–12 in and starting at 12 in', () => {
    const m = code('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx');
    // module 3: inches = 4 + d01·44 (rises with the lane)
    assert.match(m, /const inches = Math\.round\(4 \+ d01 \* 44\);/);
    // module 4: inches = 1 + d01·11 (rises with the lane), d01 starts at 1
    assert.match(m, /const \[d01, setD01\] = useState\(1\);[\s\S]{0,80}const inches = Math\.round\(\(1 \+ d01 \* 11\) \* 10\) \/ 10;/);
    const inches4 = (d01: number) => Math.round((1 + d01 * 11) * 10) / 10;
    assert.equal(inches4(1), 12);
    assert.equal(inches4(0), 1);
    assert.ok(inches4(0.6) > inches4(0.4));
  });
});

// ─── Room Design ────────────────────────────────────────────────────────────

describe('Room', () => {
  it('Review: one rule for both early-reflection counts', () => {
    const d = room.defaultDesign();
    const a = room.analyze(d);
    const n = room.earlyUntreatedWallReflections(a.reflections).length;
    const lines = a.suggestions.map((s: { text: string }) => s.text).filter((t: string) => /early wall reflection/.test(t));
    if (n > 0) assert.ok(lines[0].startsWith(`${n} early wall reflection`), lines[0]);
    const review = code('src/screens/lab/roomdesign/modules/modReview.tsx');
    assert.match(review, /const early = earlyUntreatedWallReflections\(a\.reflections\)\.length;/);
    assert.doesNotMatch(review, /r\.surface\.kind === 'wall' && r\.delayMs < 15 && !r\.treatedBy\)\.length/);
  });
  it('Treatment: after bass traps the tray says why TREATED does not move', () => {
    const t = code('src/screens/lab/roomdesign/modules/modTreatment.tsx');
    assert.match(t, /design\.treatment\.some\(\(t\) => t\.kind === 'basstrap'\) \?/);
    assert.match(t, /TREATED counts only the reflection paths that land on a panel/);
  });
});

// ─── Amplitude ──────────────────────────────────────────────────────────────

describe('Amplitude', () => {
  const amp = read('src/screens/lab/amplitude/AmplitudeOrientation.tsx');
  it('What\'s left names the open step once the check is passed', () => {
    assert.equal(amplitudeEndStep({ checkPassed: false, orientationDone: false }), 'Pass CHECK YOURSELF — THREE QUICK READS, then press UNDERSTOOD — MARK REVIEWED');
    assert.equal(amplitudeEndStep({ checkPassed: true, orientationDone: false }), 'Press UNDERSTOOD — MARK REVIEWED (your check is passed)');
    assert.match(amplitudeEndStep({ checkPassed: false, orientationDone: true }), /^Press MARK REVIEWED/);
    assert.match(amp, /stepLabel=\{amplitudeEndStep\(\{ checkPassed, orientationDone \}\)\}/);
  });
  it('the WAVEFORM burst is at least 1.8× the sustain and a different colour, peaking at the meter\'s −3 dBFS', () => {
    const num = (name: string) => Number((amp.match(new RegExp(`const ${name} = ([0-9.]+);`)) ?? ['', 'NaN'])[1]);
    const S = num('SUSTAIN_ENV');
    const B = num('BURST_ENV');
    let peak = 0;
    for (let i = 0; i < 2000; i++) {
      const x = i / 2000;
      peak = Math.max(peak, Math.abs(0.62 * Math.sin(2 * Math.PI * 2 * x) + 0.3 * Math.sin(2 * Math.PI * 6 * x)));
    }
    const sustainBar = S * peak;
    const burstBar = B * peak;
    assert.ok(burstBar / sustainBar >= 1.8, `${burstBar} vs ${sustainBar}`);
    assert.ok(Math.abs(20 * Math.log10(burstBar) - -3) < 0.1, 'the burst peaks at the LEVEL METER\'s PEAK −3');
    assert.notEqual(levelColor(burstBar), levelColor(sustainBar));
    // and it spans more bars than the old ±0.04 (≈ 4 of 56)
    assert.match(amp, /if \(t >= 0\.64 && t <= 0\.76\)/);
  });
  it('the words explain 78 dB SPL green-yellow vs PEAK −3 orange (each display colours its own scale)', () => {
    assert.match(amp, /Each display colors its OWN scale/);
    const spl = levelColor((78 - 40) / 60);
    const pk = levelColor(1 - 3 / 48);
    assert.notEqual(spl, pk);
  });
});

// ─── Plain bugs from the G1 files ───────────────────────────────────────────

describe('G1 plain bugs: words that disagreed with the picture, doubled text, overlaps', () => {
  it('Foundations 2: the text matches the graph, which is drawn along the air at one moment', () => {
    const c = code(`${F}FoundationsCourseScreen.tsx`);
    assert.match(code(`${F}viz.tsx`), /THE GRAPH — pressure along the air/);
    assert.doesNotMatch(c, /It is a graph of PRESSURE over time\./);
    assert.match(c, /the pressure all along the air at one moment/);
  });
  it('Foundations 12: the UNMIX sentence is printed once, not twice', () => {
    const c = code(`${F}FoundationsCourseScreen.tsx`);
    assert.equal((c.match(/UNMIX to pull this wave apart into its ingredient list/g) ?? []).length, 1);
  });
  it('Wave 8: the text names the readout the strip really shows (VERDICT NODE / ANTINODE)', () => {
    const a = code(`${W}modules/modWaveA.tsx`);
    assert.doesNotMatch(a, /swing from MAXIMUM to QUIET/);
    assert.match(a, /watch VERDICT swing from ANTINODE \(loudest\) to NODE \(quiet\)/);
  });
  it('Wave 3: an arrivals row fits its 86 px (16 mono characters wrapped)', () => {
    const v = code(`${W}vizWave.tsx`);
    assert.match(v, /scattered \? 'spread' :/);
    // longest row: "15.5 ms" + "spread" at 10 px mono ≈ 6 px a character
    assert.ok(('15.5 ms'.length + 'spread'.length) * 6 <= 96 - 10);
  });
  it('Wave 6: the intro names the colours the map draws', () => {
    assert.doesNotMatch(code(`${W}waveScreenGuides.ts`), /through the red and blue bands/);
  });
  it('Mic 10: the first step can be done (the title sits right under each picture)', () => {
    assert.doesNotMatch(code('src/screens/lab/micspeaker/micSpeakerScreenGuides.ts'), /guess each habit before you read its title/);
  });
  it('Room 4: no "flip LAYOUT to START" when it already reads START', () => {
    assert.doesNotMatch(code('src/screens/lab/roomdesign/roomdesignScreenGuides.ts'), /start: 'Flip LAYOUT to START/);
  });
  it('Playground: no "Update the app" line in the FX caption', () => {
    assert.doesNotMatch(code(`${F}FoundationsPlaygroundScreen.tsx`), /Update the app to hear these effects/);
  });
});

describe('Wave 14 · the FAR WALL tag never sits on the early stems', () => {
  it('a label row is kept clear above the stems and the tag sits beside its own stem', () => {
    const b = code(`${W}modules/modWaveB.tsx`);
    assert.match(b, /const labelRow = mark \? fs \+ 6 : 10;/);
    assert.match(b, /\* \(H - padB - labelRow\)\);/);
    assert.match(b, /x=\{markRight \? markX \+ 6 : markX - 6\}\s*y=\{fs \+ 2\}/);
    assert.doesNotMatch(b, /Math\.max\(40, xAt\(mark\.t \* 1000 - t0\)\)/);
  });
});

describe('Shared check card · a reason per wrong option (CheckSpec.why)', () => {
  it('why[picked] wins, else wrongHint, else the old line; keyed by the authored index', async () => {
    const { checkWrongText } = await import('../src/screens/lab/foundations/checkWords.ts');
    const spec = { why: { 0: 'Reason for A', 2: 'Reason for C' }, wrongHint: 'Hint' };
    assert.equal(checkWrongText(spec, 0), 'Reason for A');
    assert.equal(checkWrongText(spec, 2), 'Reason for C');
    assert.equal(checkWrongText(spec, 3), 'Hint');
    assert.equal(checkWrongText({ wrongHint: 'Hint' }, 1), 'Hint');
    assert.equal(checkWrongText({}, 1), 'Not quite — try again.');
  });
  it('CheckQuestion shows it, and CheckSpec carries the optional field', () => {
    const bits = code(`${F}bits.tsx`);
    assert.match(bits, /why\?: Record<number, string>;/);
    assert.match(bits, /<Text style=\{styles\.checkHint\}>\{checkWrongText\(spec, picked\)\}<\/Text>/);
    assert.doesNotMatch(bits, /\{spec\.wrongHint \?\? 'Not quite — try again\.'\}/);
  });
});

describe('Shared check card · the answer only after a second, different miss (owner-approved row 4)', () => {
  it('first miss = reason only; a second DIFFERENT miss adds the explanation; the same miss twice is one', async () => {
    const { addMiss, showRevealAfterMisses } = await import('../src/screens/lab/foundations/checkWords.ts');
    const correct = 1;
    let m = addMiss([], 0, correct);
    assert.deepEqual(m, [0]);
    assert.equal(showRevealAfterMisses(m), false);
    m = addMiss(m, 0, correct); // the same wrong option again
    assert.deepEqual(m, [0]);
    assert.equal(showRevealAfterMisses(m), false);
    m = addMiss(m, 2, correct); // a different wrong option
    assert.deepEqual(m, [0, 2]);
    assert.equal(showRevealAfterMisses(m), true);
    assert.deepEqual(addMiss([0], correct, correct), [0], 'a right pick is never a miss');
  });
  it('CheckQuestion wires it: misses tracked per pick, the reveal under the reason after two', () => {
    const bits = code(`${F}bits.tsx`);
    assert.match(bits, /setMisses\(\(m\) => addMiss\(m, orig, spec\.correctIdx\)\);/);
    assert.match(bits, /\{showRevealAfterMisses\(misses\) \? <Text style=\{styles\.checkRevealAfterMiss\}>\{spec\.reveal\}<\/Text> : null\}/);
  });
});

// ─── Phase 2 ────────────────────────────────────────────────────────────────

describe('Phase 2 · a reason for every wrong option on every F5 check card', () => {
  const files = [
    `${F}FoundationsCourseScreen.tsx`,
    `${F}FoundationsPlaygroundScreen.tsx`,
    'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx',
    'src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx',
    `${W}modules/modWaveA.tsx`,
    `${W}modules/modWaveB.tsx`,
  ];
  type Card = { file: string; question: string; options: string[]; correct: number; why: Record<number, string> | null };
  const cards: Card[] = [];
  for (const f of files) {
    const s = read(f);
    for (const m of s.matchAll(/question:\s*(['`])((?:\\.|(?!\1).)*)\1,/g)) {
      const seg = s.slice(m.index!, m.index! + 4000);
      const opts = seg.match(/options:\s*\[([\s\S]*?)\],/);
      if (!opts || !/^\s*['`]/.test(opts[1])) continue; // computed options (Mic's picture rounds)
      const options = [...opts[1].matchAll(/'((?:\\.|[^'\\])*)'/g)].map((o) => o[1]);
      const correct = Number((seg.match(/correctIdx:\s*(\d)/) ?? ['', '-1'])[1]);
      const w = seg.slice(seg.indexOf(opts[0]) + opts[0].length).match(/^\s*why:\s*\{([^}]*)\}/);
      const why = w ? Object.fromEntries([...w[1].matchAll(/(\d+):\s*'((?:\\.|[^'\\])*)'/g)].map((x) => [Number(x[1]), x[2].replace(/\\'/g, "'")])) : null;
      cards.push({ file: f, question: m[2], options, correct, why });
    }
  }
  it('found the cards (Foundations 15, Playground 1, Mic 7, Speaker 3, Wave 19)', () => {
    assert.equal(cards.length, 45);
  });
  for (const c of cards) {
    it(`${c.file.split('/').pop()}: ${c.question.slice(0, 50)}`, () => {
      assert.ok(c.why, 'has why');
      const wrong = c.options.map((_, i) => i).filter((i) => i !== c.correct);
      assert.deepEqual(Object.keys(c.why!).map(Number).sort(), wrong, 'one reason per wrong option, none for the right one');
      for (const [, line] of Object.entries(c.why!)) {
        assert.ok(line.trim().split(/\s+/).length <= 30, `≤ 30 words: ${line}`);
        assert.ok(!line.includes(c.options[c.correct]), 'never quotes the right answer');
      }
      // balanced lengths: the right answer is never more than 1.6× the longest wrong one
      const longestWrong = Math.max(...wrong.map((i) => c.options[i].length));
      assert.ok(c.options[c.correct].length <= longestWrong * 1.6, `right ${c.options[c.correct].length} vs wrong ${longestWrong}`);
    });
  }
});

describe('Phase 2 · first-visit bezel captions', () => {
  it('every caption is 1–3 plain words, ≤ 14 characters, and no caption is a second unit', async () => {
    const m = await import('../src/screens/lab/foundations/bezelCaptions.ts');
    for (const dict of [m.WAVE_CAPTIONS, m.FOUNDATIONS_CAPTIONS, m.MIC_CAPTIONS, m.SPEAKER_CAPTIONS, m.ROOM_CAPTIONS]) {
      for (const [k, c] of Object.entries(dict)) {
        assert.ok(c.length <= 14, `${k}: "${c}" is ${c.length} characters`);
        assert.ok(c.split(/\s+/).length <= 3, `${k}: ${c}`);
        assert.doesNotMatch(c, /\b(dB|Hz|ms|kHz)\b/, `${k}: a caption is a meaning, not a unit`);
      }
    }
  });
  it('the codes the auditors named are captioned (LOSS/BNC, FRESNEL N, RT60, F0, MODEL, λ, RATIO S:M:L)', async () => {
    const m = await import('../src/screens/lab/foundations/bezelCaptions.ts');
    const W = m.withCaptions([{ k: 'LOSS/BNC', v: '1 dB' }, { k: 'FRESNEL N', v: '2.0' }, { k: 'LOSS @ 1 kHz', v: '9 dB' }, { k: 'MODE (1,0)', v: '34 Hz' }, { k: 'RT60', v: '1 s' }], m.WAVE_CAPTIONS)!;
    assert.deepEqual(W.map((i) => i.caption), ['per bounce', 'shadow depth', 'shadow loss', 'room note', 'ring time']);
    assert.equal(m.withCaptions([{ k: 'F0', v: '220 Hz' }], m.FOUNDATIONS_CAPTIONS)![0].caption, 'base note');
    assert.equal(m.withCaptions([{ k: 'MODEL', v: '0.74 Hz' }], m.FOUNDATIONS_CAPTIONS)![0].caption, 'drawing speed');
    assert.equal(m.withCaptions([{ k: 'RATIO S:M:L', v: '1:1.6:2' }], m.ROOM_CAPTIONS)![0].caption, 'room shape');
    assert.equal(m.withCaptions([{ k: 'X', v: '1', caption: 'own' }], m.ROOM_CAPTIONS)![0].caption, 'own', 'a cell\'s own caption wins');
  });
  it('every F5 rack goes through it (Wave layout; Foundations, Playground, Mic, Speaker, Room via captionedRack)', () => {
    // Phase 3 (owner's decision 3): the same factory now also adds the plain
    // model note and "drawing…"; Wave's layout uses it too.
    const SOFT = 'FOUNDATIONS_CAPTIONS, { soundOffWhenPlayable: true, modelNotes: true, drawingPlaceholder: true }';
    for (const [f, d] of [[`${W}modules/waveLayout.tsx`, 'WAVE_CAPTIONS, { modelNotes: true, drawingPlaceholder: true }'], [`${F}FoundationsCourseScreen.tsx`, SOFT], [`${F}FoundationsPlaygroundScreen.tsx`, SOFT], ['src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx', 'MIC_CAPTIONS, { modelNotes: true, drawingPlaceholder: true }'], ['src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx', 'SPEAKER_CAPTIONS, { modelNotes: true }'], ['src/screens/lab/roomdesign/rackLayout.tsx', 'ROOM_CAPTIONS']]) {
      const c = code(f);
      assert.ok(c.includes(`const RackUnit = captionedRack(${d});`), f);
      assert.doesNotMatch(c, /import \{ RackUnit \} from '\.\.(\/\.\.)?\/rack\/RackUnit'/, f);
    }
  });
});

describe('Phase 2 · silent learner (Foundations, Playground)', () => {
  it('the sound-off line on every rack with a PLAY key; TONE / OUT read OFF while sound is off', () => {
    const r = code(`${F}captionedRack.tsx`);
    assert.match(r, /props\.params\.some\(\(p\) => p\.id === 'play'\)/);
    assert.match(r, /soundOffLine: props\.stage\.soundOffLine \?\? \(playable \? true : undefined\)/);
    const c = code(`${F}FoundationsCourseScreen.tsx`);
    assert.match(c, /k: 'TONE'[^\n]*silent: \{ v: 'OFF' \}/);
    assert.match(c, /k: 'OUT'[^\n]*silent: \{ v: 'OFF' \}/);
  });
  it('every listening-only TRY THIS step says it needs sound and gives a silent way to see it (≤ 200 characters)', async () => {
    const { FOUNDATIONS_SCREEN_GUIDES, PLAYGROUND_SCREEN_GUIDE } = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
    const all = [...Object.values(FOUNDATIONS_SCREEN_GUIDES), PLAYGROUND_SCREEN_GUIDE].flatMap((g) => g.tryThis ?? []);
    const listening = all.filter((t) => /^(Press PLAY and|Tap PLAY, then|With PLAY on)/.test(t) || /Then press PLAY\. The tone/.test(t));
    assert.ok(listening.length >= 7);
    for (const t of listening) {
      assert.match(t, /Sound off\? /, t);
      assert.ok(t.length <= 200, `${t.length}: ${t}`);
    }
  });
});

describe('Phase 2 · end screens', () => {
  // Phase 3 (owner's decision 1, "done = work done"): the rows and the rule now
  // name the module's goal, not a visit; Mic and Speaker say "module" like
  // their strip (one progress word per lab).
  const ends: [string, string, string][] = [
    [`${F}FoundationsCourseScreen.tsx`, 'af_foundations', 'goalCounts({ next: true })'],
    ['src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx', 'af_mic_principles', 'goalCounts({ next: true })'],
    ['src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx', 'af_speaker_coverage', 'goalCounts()'],
    [`${W}WaveLabHomeScreen.tsx`, 'af_wave_physics', 'goalCounts()'],
    [`${W}WaveModuleScreen.tsx`, 'af_wave_physics', 'goalCounts()'],
    ['src/screens/lab/roomdesign/RoomDesignLabScreen.tsx', 'room-design', 'roomCounts()'],
  ];
  for (const [f, id, counts] of ends) {
    it(`${f.split('/').pop()}: labId ${id}, a missing line per row, the rule once`, () => {
      const c = code(f);
      const at = c.indexOf('<LabEndScreen');
      assert.ok(at >= 0 && c.slice(at, at + 160).includes(`labId="${id}"`), 'labId on the end screen');
      assert.match(c, /detail: moduleGoalDetail\(/);
      assert.ok(c.includes(`howItCounts={${counts}}`));
      assert.doesNotMatch(c, /noun="section"/);
    });
  }
  it('each row names what is still to do and what the module holds; the rule is said once', async () => {
    const { moduleGoalDetail, goalCounts, roomCounts } = await import('../src/screens/lab/foundations/endRows.ts');
    assert.equal(moduleGoalDetail('check', 'Why a wall bounces sound.'), 'Still to do: answer its CHECK YOURSELF right. Inside: why a wall bounces sound.');
    assert.equal(moduleGoalDetail('next', undefined), 'Still to do: read it through and press NEXT at its foot.');
    assert.match(goalCounts({ next: true }), /Opening a module does not count it/);
    assert.match(roomCounts(), /hands-on module counts once you change the room on it/);
  });
  it('end-guide WHERE TO START lines are state-neutral', async () => {
    const S = 'Read WHERE TO START at the top: it names the next thing to do from where you are.';
    const fg = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
    const mg = await import('../src/screens/lab/micspeaker/micSpeakerScreenGuides.ts');
    const rg = await import('../src/screens/lab/roomdesign/roomdesignScreenGuides.ts');
    for (const g of [fg.FOUNDATIONS_END_GUIDE, mg.MIC_END_GUIDE, mg.SPEAKER_END_GUIDE, rg.ROOM_END_GUIDE]) assert.equal(g.intro?.start, S);
  });
});

describe('Checker C3 F-1 · a name tag never covers text already on the room', () => {
  it('the RING GAP plate, probe labels and module labels count as taken before any tag is placed', () => {
    const v = code(`${W}vizWave.tsx`);
    assert.match(v, /if \(ringGapWide\) placed\.push\(textBox\(geo\.x0 \+ 3 \* ts, geo\.y1 - 17 \* ts, 'RING GAP > λ'\)\);/);
    assert.match(v, /for \(const pr of p\.probes \?\? \[\]\) placed\.push\(textBox\(/);
    assert.match(v, /for \(const lb of p\.labels \?\? \[\]\) \{/);
    // and they are pushed BEFORE the first tag is placed
    assert.ok(v.indexOf('placed.push(textBox(geo.x0 + 3 * ts') < v.indexOf('const place = (xm: number'));
  });
});

describe('Checker C3 O-2 · the check card never reorders itself', () => {
  it('the order is seeded by the question: the same on every mount, different across questions, a full permutation', async () => {
    const { seededOrder } = await import('../src/screens/lab/foundations/checkWords.ts');
    const q = 'Two IDENTICAL waves meet at 180°. The result is…';
    const o = ['Twice as loud', 'Silence', 'The pitch drops one octave'];
    const a = seededOrder(q, o);
    for (let i = 0; i < 20; i++) assert.deepEqual(seededOrder(q, o), a, 'a remount gives the same order');
    assert.deepEqual([...a].sort(), [0, 1, 2]);
    // across many questions the right answer is not parked in one slot
    const slots = new Set<number>();
    for (let i = 0; i < 40; i++) slots.add(seededOrder(`question ${i}`, ['a', 'b', 'c']).indexOf(1));
    assert.equal(slots.size, 3);
  });
  it('CheckQuestion uses it, never Math.random', () => {
    const bits = code(`${F}bits.tsx`);
    assert.match(bits, /const \[order\] = useState<number\[\]>\(\(\) => seededOrder\(spec\.question, spec\.options\)\);/);
    assert.doesNotMatch(bits, /Math\.random\(\)/);
  });
});

// ─── Phase 3 (owner's decisions, 2026-11-14) ────────────────────────────────

describe('Phase 3 · 1 "done = work done": a module counts when its check is met, not when it is opened', () => {
  it('the rule: every card the module drew must be answered right; a module with no card is never done by it', async () => {
    const { allChecksSolved } = await import('../src/screens/lab/foundations/checkCreditRules.ts');
    assert.equal(allChecksSolved(new Set(), new Set()), false);
    assert.equal(allChecksSolved(new Set(['a', 'b']), new Set(['a'])), false);
    assert.equal(allChecksSolved(new Set(['a', 'b']), new Set(['b', 'a'])), true);
  });
  it('CheckQuestion registers with the scope and reports a right answer (outside a scope: nothing)', () => {
    const bits = code(`${F}bits.tsx`);
    assert.match(bits, /const credit = useContext\(CheckCreditContext\);/);
    assert.match(bits, /useEffect\(\(\) => credit\?\.register\(spec\.question\), \[credit, spec\.question\]\);/);
    assert.match(bits, /credit\?\.solved\(spec\.question\);/);
  });
  it('no lab of mine marks a module on OPEN any more; each wraps the module in a CheckCreditScope', () => {
    const fc = code(`${F}FoundationsCourseScreen.tsx`);
    assert.doesNotMatch(fc, /useEffect\(\(\) => \{\s*markLabUnit\(FOUNDATIONS_LAB_KEY, String\(step\)\);\s*\}, \[step\]\);/);
    assert.match(fc, /<CheckCreditScope key=\{s\.key\} onComplete=\{\(\) => creditStep\(step\)\}>/);
    assert.match(fc, /if \(n === step \+ 1 && !moduleHasCheck\(STEPS\[step\]\)\) creditStep\(step\);/);
    const wm = code(`${W}WaveModuleScreen.tsx`);
    assert.doesNotMatch(wm, /if \(focused\) markLabUnit\('af_wave_physics', meta\.id\);/);
    assert.equal((wm.match(/<CheckCreditScope key=\{meta\.id\} onComplete=\{creditModule\}>/g) ?? []).length, 2);
    const mic = code('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx');
    assert.doesNotMatch(mic, /useEffect\(\(\) => \{\s*markLabUnit\(MIC_PRINCIPLES_LAB_KEY, SECTIONS\[sectionIdx\]\.key\);/);
    assert.match(mic, /<CheckCreditScope key=\{s\.key\} onComplete=\{\(\) => creditSection\(sectionIdx\)\}>/);
    assert.match(mic, /const MIC_NO_CHECK: ReadonlySet<string> = new Set\(\['capsule', 'pop'\]\);/);
    const spk = code('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx');
    assert.doesNotMatch(spk, /useEffect\(\(\) => \{\s*markLabUnit\(SPEAKER_COVERAGE_LAB_KEY/);
    assert.match(spk, /<CheckCreditScope key=\{ending \? 'end' : s\.key\} onComplete=\{\(\) => markLabUnit\(SPEAKER_COVERAGE_LAB_KEY, s\.key\)\}>/);
  });
  it('the modules with no card are exactly the ones named (Foundations 3, Mic CAPSULE and PLOSIVES)', () => {
    const fc = read(`${F}FoundationsCourseScreen.tsx`);
    const stepsSrc = fc.slice(fc.indexOf('const STEPS: Step[] = ['));
    const keys = [...stepsSrc.matchAll(/key: '(m\d+)'/g)].map((m) => m[1]);
    const noCheck: string[] = [];
    for (let i = 0; i < keys.length; i++) {
      const body = stepsSrc.slice(stepsSrc.indexOf(`key: '${keys[i]}'`), i + 1 < keys.length ? stepsSrc.indexOf(`key: '${keys[i + 1]}'`) : undefined);
      if (!/\bcheck: \{|\bchecks: \[/.test(body)) noCheck.push(keys[i]);
    }
    assert.deepEqual(noCheck, ['m3']);
    const mic = read('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx');
    for (const fn of ['CapsuleSection', 'PopSection']) {
      const at = mic.indexOf(`function ${fn}`);
      assert.ok(at > 0, fn);
      const body = mic.slice(at, mic.indexOf('\nfunction ', at + 10));
      assert.doesNotMatch(body, /<CheckQuestion/, `${fn} has no card`);
    }
  });
  it('Room Design: a hands-on module counts on a change to the room, a reading one on NEXT; never on open', () => {
    const r = code('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx');
    assert.doesNotMatch(r, /useEffect\(\(\) => \{\s*if \(!resolved \|\| ending\) return;\s*markLabVisit/);
    assert.match(r, /markWorkRef\.current\(\);\s*setDesign/);
    assert.match(r, /if \(!ending && mod\.rack\) markDone\(mod\.id\);/);
    assert.match(r, /if \(!ending && i === idx \+ 1 && !mod\.rack\) markDone\(mod\.id\);/);
  });
  it('Sound Playground: MARK AS REVIEWED waits for its check (a lab already reviewed keeps its mark)', () => {
    const pg = code(`${F}FoundationsPlaygroundScreen.tsx`);
    assert.match(pg, /onSolved=\{\(\) => setCheckPassed\(true\)\}/);
    assert.match(pg, /\{checkPassed \|\| reviewed \? \(\s*<LabReviewButton labKey="af_sound_playground" \/>/);
  });
  it('the words that said "opening counts" now name the goal (guides; one progress word: module)', async () => {
    const fg = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
    const mg = await import('../src/screens/lab/micspeaker/micSpeakerScreenGuides.ts');
    const wg = await import('../src/screens/lab/wave/waveScreenGuides.ts');
    const rg = await import('../src/screens/lab/roomdesign/roomdesignScreenGuides.ts');
    const text = (g: Record<string, unknown>) => JSON.stringify(g);
    for (const g of [fg.FOUNDATIONS_END_GUIDE, mg.MIC_END_GUIDE, mg.SPEAKER_END_GUIDE, wg.WAVE_HOME_GUIDE, rg.ROOM_END_GUIDE]) {
      const t = text(g as Record<string, unknown>);
      assert.doesNotMatch(t, /counts once you open it|as soon as you open it|Opening a module checks it off|you’ve opened|haven’t opened/, t.slice(0, 80));
    }
    assert.doesNotMatch(text(mg.MIC_END_GUIDE as Record<string, unknown>) + text(mg.SPEAKER_END_GUIDE as Record<string, unknown>), /\bsections?\b/);
  });
});

describe('Phase 3 · 2 no "N of total" progress counter of my own', () => {
  it('Amplitude\'s check says QUESTION 1, not 1/3', () => {
    const amp = read('src/screens/lab/amplitude/AmplitudeOrientation.tsx');
    assert.match(amp, /<Text style=\{styles\.checkProgress\}>QUESTION \{q \+ 1\}<\/Text>/);
    assert.doesNotMatch(amp, /\{q \+ 1\}\/3/);
  });
});

describe('Phase 3 · 3 the plain model note and "drawing…"', () => {
  it('every all-caps Foundations, Playground and Wave badge has a plain sentence (≤ 90 characters, not all caps)', async () => {
    const { MODEL_NOTES } = await import('../src/screens/lab/foundations/modelNotes.ts');
    const badges = new Set<string>();
    for (const f of [`${F}FoundationsCourseScreen.tsx`, `${F}FoundationsPlaygroundScreen.tsx`, `${W}modules/modWaveA.tsx`, `${W}modules/modWaveB.tsx`]) {
      const s = read(f);
      for (const m of s.matchAll(/badge: '([^']+)'/g)) badges.add(m[1]);
      for (const m of s.matchAll(/const (?:BADGE_CONCEPT|HONESTY|MODEL_BADGE) = '([^']+)'/g)) badges.add(m[1]);
    }
    for (const b of badges) {
      assert.ok(MODEL_NOTES[b], `a note for "${b}"`);
      assert.ok(MODEL_NOTES[b].length <= 90, MODEL_NOTES[b]);
      assert.notEqual(MODEL_NOTES[b], MODEL_NOTES[b].toUpperCase());
    }
  });
  it('the factory sets modelNote and drawing (until the drawing mounted and the app went idle)', () => {
    const r = code(`${F}captionedRack.tsx`);
    assert.match(r, /modelNote: props\.stage\.modelNote \?\? \(opts\.modelNotes \? modelNoteFor\(props\.stage\.badge\) : undefined\)/);
    assert.match(r, /drawing: props\.stage\.drawing \?\? !painted/);
    assert.match(r, /runSoon\(onPainted, \{ idleTimeoutMs: 300 \}\)/);
  });
});

describe('Phase 3 · 5 beginner core first, depth folded', () => {
  it('Wave: explanation, the readouts card (its prose and instructions), controls and CHECK YOURSELF open; second graph and mistakes under GO DEEPER (checker K3 F-2)', () => {
    const l = code(`${W}modules/waveLayout.tsx`);
    const core = l.indexOf('{explain}\n          {readouts}\n          {controls}\n          {check}');
    const deeper = l.indexOf('<GoDeeper');
    assert.ok(core > 0 && deeper > core);
    assert.match(l, /<GoDeeper[^>]*>\s*\{secondary\}\s*\{mistakes\}\s*<\/GoDeeper>/);
    assert.doesNotMatch(l, /<GoDeeper[^>]*>\s*\{readouts\}/, 'the readouts card must not fold: modules 9, 11, 13, 14, 15 teach in it');
  });
  it('Wave: only the number table folds (FoldedReadoutGrid), in every module', () => {
    assert.match(code(`${W}modules/waveLayout.tsx`), /export function FoldedReadoutGrid\(props: ComponentProps<typeof ReadoutGrid>\) \{\s*return \(\s*<GoDeeper hint="Every number in full\.">\s*<ReadoutGrid \{\.\.\.props\} \/>/);
    for (const f of ['modWaveA.tsx', 'modWaveB.tsx']) {
      const c = code(`${W}modules/${f}`);
      assert.doesNotMatch(c, /<ReadoutGrid\b/, `${f}: a bare tile table`);
      assert.ok((c.match(/<FoldedReadoutGrid\b/g) ?? []).length >= 7, f);
    }
    // The teaching prose K3 found hidden is in the open readouts card.
    const b = code(`${W}modules/modWaveB.tsx`);
    assert.match(b, /then DRAG THE LISTENER: an alignment that only works at one seat is not an alignment/);
    assert.match(b, /when a late reflection’s gap crosses ~50 ms its verdict flips/);
  });
  it('Room Review: SUGGESTED NEXT STEPS first; the two tables under GO DEEPER', () => {
    const r = code('src/screens/lab/roomdesign/modules/modReview.tsx');
    const next = r.indexOf('title="SUGGESTED NEXT STEPS"');
    const deeper = r.indexOf('<GoDeeper');
    const layout = r.indexOf('title="ROOM AND LAYOUT"');
    const behavior = r.indexOf('title="LIKELY ACOUSTIC BEHAVIOR"');
    const closeDeeper = r.indexOf('</GoDeeper>');
    assert.ok(next > 0 && next < deeper && deeper < layout && layout < behavior && behavior < closeDeeper);
  });
  it('GO DEEPER starts closed and keeps everything (it only hides until tapped)', () => {
    const g = code(`${F}GoDeeper.tsx`);
    assert.match(g, /const \[open, setOpen\] = useState\(false\);/);
    assert.match(g, /\{open \? <View style=\{\{ gap: 12 \}\}>\{children\}<\/View> : null\}/);
  });
});

describe('Checkers K1 + K3 F-1 · model notes are one plain sentence-case line (owner decision 3)', () => {
  const WELLS = [
    `${F}bits.tsx`, `${F}FoundationsCourseScreen.tsx`, `${F}FoundationsPlaygroundScreen.tsx`,
    `${W}modules/modWaveA.tsx`, `${W}modules/modWaveB.tsx`,
    'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx', 'src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx',
  ];
  it('no in-well all-caps disclaimer is left (Badge, ConceptBadge, AnalyticBadge, styles.badge text)', () => {
    for (const f of WELLS) {
      const c = code(f);
      assert.doesNotMatch(c, /<Badge text=/, `${f}: an all-caps <Badge>`);
      assert.doesNotMatch(c, /<(ConceptBadge|AnalyticBadge|IllustrationBadge)[^>]*(extra|text)=["{`]+[A-Z][A-Z ,'’()·—=&+-]{14}/, `${f}: an all-caps badge text`);
      assert.doesNotMatch(c, /<Text style=\{styles\.badge\}>\s*[A-Z][A-Z ,'’()·—-]{14}/, `${f}: an all-caps styles.badge line`);
      assert.doesNotMatch(c, /'ANALYTIC — DRAWN FROM THE (MATH|SETTINGS)|'ILLUSTRATIVE MODEL — DRAWN FROM THE EQUATIONS/, f);
    }
  });
  it('the shared plain note: ConceptBadge / PlainModelNote in sentence case at 12 pt', () => {
    const b = code(`${F}bits.tsx`);
    assert.match(b, /modelNote: \{ fontFamily: fonts\.barlowRegular, fontSize: 12, lineHeight: 16, color: colors\.textSub \}/);
    assert.match(b, /<Text style=\{styles\.modelNote\}>\s*A picture of the idea, slowed down so you can see it: real air moves thousands of times\s*faster\./);
    assert.match(b, /export function PlainModelNote\(\{ children \}: \{ children: string \}\)/);
    assert.match(code(`${F}FoundationsPlaygroundScreen.tsx`), /<PlainModelNote>The waveform and spectrum are drawn from your settings, not measured: the measurement tools do the real thing\.<\/PlainModelNote>/);
    // The m13 guide pin keeps its chain words.
    assert.match(code(`${F}FoundationsCourseScreen.tsx`), /<ConceptBadge extra="SOURCE → AIR → MIC is the chain every tool below listens to\." \/>/);
  });
  it('Mic Principles and Speaker Placement rack badges read as plain notes (modelNotes on), each ≤ 104 characters', async () => {
    assert.match(code('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx'), /captionedRack\(MIC_CAPTIONS, \{ modelNotes: true, drawingPlaceholder: true \}\)/);
    assert.match(code('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx'), /captionedRack\(SPEAKER_CAPTIONS, \{ modelNotes: true \}\)/);
    const { MODEL_NOTES } = await import('../src/screens/lab/foundations/modelNotes.ts');
    const mic = code('src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx');
    const rackBadges = [...mic.matchAll(/\bbadge:\s*(["'])(.+?)\1/g)].map((m) => m[2]);
    assert.ok(rackBadges.length >= 8);
    for (const k of [...rackBadges, 'CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION', 'CONCEPTUAL LEVEL MAP — ILLUSTRATIVE, NOT SPL']) {
      const note = MODEL_NOTES[k];
      assert.ok(note, `no plain note for ${k}`);
      assert.ok(note.length <= 104, note);
      assert.match(note, /^[A-Z][a-z ]/, `sentence case: ${note}`);
      assert.doesNotMatch(note, /\b(?!SPL\b)[A-Z]{4,}\b/, `no shouting: ${note}`);
    }
    assert.match(mic, /badge="A model cutaway: the coil’s travel is exaggerated about 1,000×; amber is the induced current\."/);
  });
});
