/**
 * Lab fix round 2026-11-14 — group F7 (the effect labs, EQ Lab, Binaural,
 * Smart Processors). Owner approval, 2026-11-14: "Begin fixing all bugs found
 * and do obvious (my decision is not required) fixes as you suggestted in the
 * report." Brief: docs/labs/novice_audit_2026_11_14/fixes/00_FIX_BRIEF.md;
 * report: docs/labs/novice_audit_2026_11_14/fixes/F7_REPORT.md.
 *
 * Every test here would have failed before its fix.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (so a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

// ── 1 · EQ Lab modules 1 and 11: the mic opens only on a tap ────────────────
describe('F7-1 · EQ Lab mic lessons never open the microphone on arrival', () => {
  const MODS = ['src/screens/lab/eq/modules/SeeingFrequency.tsx', 'src/screens/lab/eq/modules/LiveSpectrumEq.tsx'];
  for (const f of MODS) {
    it(`${f.split('/').pop()}: no auto-start, background release kept`, () => {
      const s = code(f);
      assert.doesNotMatch(s, /useToolAutoStart/, 'the tools’ auto-start rule must not run in a lesson');
      assert.match(s, /useReleaseMicOnBackground\(state, stop\);/);
      // The only callers of start() are taps: the display Pressable, the MIC
      // key / button, and the engine gate's TRY AGAIN.
      const starts = s.match(/onStart\b/g) ?? [];
      assert.ok(starts.length >= 3, 'onStart is still wired to the taps');
      assert.doesNotMatch(s, /useEffect\([^)]*\bstart\(\)/, 'no effect calls start()');
      // Off until a tap: the idle line says how to start it, the bezel says OFF.
      assert.match(s, /The microphone is off\./);
      assert.match(s, /micPaused \? 'PAUSED' : 'OFF'/);
    });
  }
  it('the guides say the mic waits for a tap', () => {
    const g = read('src/screens/lab/eq/eqScreenGuides.ts');
    assert.match(g, /The microphone stays off until you tap MIC\./);
    assert.match(g, /MIC OFF — START/);
    assert.doesNotMatch(g, /If the bars aren’t moving, tap MIC/);
  });
});

// ── 2 · Compression / Gate / Limiter: one GR truth, no "update the app" ─────
describe('F7-2 · dynamics labs: the GR meter never prints 0.0 dB beside "— dB"', () => {
  const fx = code('src/screens/lab/FxLabScreen.tsx');
  it('the meter is drawn only while the audio runs', () => {
    assert.match(fx, /\{running \? \(\s*<GrMeter\s+grDb=\{grDb\}/);
    assert.doesNotMatch(fx, /<GrMeter\s+grDb=\{running \? grDb : 0\}/);
  });
  it('stopped, one sentence says which number is measured and which is drawn', () => {
    assert.match(fx, /function grMeterCaption\(\s*running: boolean,\s*fxReady: boolean,\s*kind: 'comp' \| 'gate' \| 'limiter',\s*soundOff = false,/);
    assert.match(fx, /Stopped, GR reads — dB\./);
    assert.match(fx, /the GR PEAK in the drawing is worked out from your settings/);
    assert.match(fx, /\{grMeterCaption\(running, fxReady, config\.pollGr, soundOff, grModelDb != null\)\}/);
  });
  it('no learner line tells anyone to update the app (effect labs, Binaural)', () => {
    for (const f of ['src/screens/lab/FxLabScreen.tsx', 'src/screens/lab/BinauralLabScreen.tsx']) {
      assert.doesNotMatch(code(f), /update the app/i, f);
    }
    // The build notes stay, only in development clients.
    assert.match(read('src/screens/lab/BinauralLabScreen.tsx'), /: __DEV__\s*\? 'Binaural audio needs the v7 engine build/);
    assert.match(read('src/screens/lab/BinauralLabScreen.tsx'), /Platform\.OS === 'web'\s*\? 'On the web, the binaural mix can’t play — it plays in the phone app\./);
  });
});

// ── 3 · Equalizer: GAIN and Q gray out when the shape ignores them ──────────
describe('F7-3 · Equalizer grays out what the filter shape ignores (quick win 16)', () => {
  const fx = code('src/screens/lab/FxLabScreen.tsx');
  const cfg = code('src/screens/lab/fxLabConfigs.tsx');
  it('the frame: an ignored param reads "—" in gray on the bezel and LOCKED in the dock', () => {
    assert.match(fx, /ignoredBy\?: \(paramId: number, values: Record<number, number>\) => string \| undefined;/);
    assert.match(fx, /\? \{ k: b\.k, v: '—', tint: IGNORED_TINT, helpKey: p\.lessonKey, caption: b\.caption \}/);
    assert.equal((fx.match(/locked: ignored\(p\.paramId\),/g) ?? []).length, 2, 'fader and options keys both lock');
  });
  it('eqConfig: GAIN on both pass filters, Q on the high-pass only', () => {
    const at = cfg.indexOf('ignoredBy: (id, v) => {');
    assert.ok(at > 0);
    const body = cfg.slice(at, cfg.indexOf('Hero:', at));
    assert.match(body, /if \(id === EQ_GAIN && pass\) return/);
    assert.match(body, /if \(id === EQ_Q && v\[EQ_TYPE\] === EQ_BAND_TYPES\.highPass\) return/);
    // The low-pass keeps Q: fxViz draws it as rbjLowPass(freq, q).
    assert.match(read('src/features/lab/fxViz.tsx'), /case 'lowPass': db \+= biquadMagDb\(rbjLowPass\(b\.freq, b\.q\), f\)/);
    assert.match(read('src/features/lab/fxViz.tsx'), /case 'highPass': db \+= butterworthHighPassDb\(b\.freq, f\)/);
  });
  it('the hint and the guide no longer ask the learner to tap through a locked GAIN', () => {
    assert.doesNotMatch(cfg, /tap through the GAIN values/);
    assert.doesNotMatch(read('src/screens/lab/eq/equalizerScreenGuides.ts'), /then tap through GAIN/);
  });
});

// ── 4 · Binaural: the readouts agree; AZ can be set to the degree ───────────
describe('F7-4 · Binaural: a drag lands on whole degrees, AZ has one-degree steps', () => {
  const s = code('src/screens/lab/BinauralLabScreen.tsx');
  it('the stage drag snaps like the faders', () => {
    assert.match(s, /st\.onMove\(i, binSnapAz\(az\), Math\.round\(dist \* 10\) \/ 10\);/);
    assert.doesNotMatch(s, /st\.onMove\(i, az, dist\);/);
  });
  it('at +30° the ITD the bezel prints is the 261 µs LEARN quotes (Woodworth mirror)', () => {
    const itd = (az: number) => {
      const a = Math.abs(az);
      const th = ((a > 90 ? 180 - a : a) * Math.PI) / 180;
      return (0.0875 / 343) * (th + Math.sin(th)) * 1e6;
    };
    assert.match(s, /return \(0\.0875 \/ 343\) \* \(th \+ Math\.sin\(th\)\) \* 1e6;/, 'the mirror is unchanged');
    assert.equal(itd(30).toFixed(0), '261');
    // The bug: a raw drag just under 30° printed "+30°" beside 258–259 µs.
    assert.equal(itd(29.6).toFixed(0), '258');
    assert.equal(Math.round(29.6), 30);
  });
  it('the AZ lane has ±1° nudges (hold for 15°) that wrap round the back', () => {
    assert.match(s, /label: '‹ −1°',\s*onPress: \(\) => updateSource\(selected, \{ azDeg: binSnapAz\(sel\.azDeg - 1\) \}\)/);
    assert.match(s, /label: '\+1° ›',\s*onPress: \(\) => updateSource\(selected, \{ azDeg: binSnapAz\(sel\.azDeg \+ 1\) \}\)/);
    const snap = (az: number) => { let a = Math.round(az); while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };
    assert.match(s, /function binSnapAz\(az: number\): number \{\s*let a = Math\.round\(az\);\s*while \(a > 180\) a -= 360;\s*while \(a <= -180\) a \+= 360;\s*return a;/);
    assert.equal(snap(181), -179);
    assert.equal(snap(-180), 180);
    assert.equal(snap(29.6), 30);
  });
});

// ── 5 · Flanger: the words name the scale the notches are even on ───────────
describe('F7-5 · Flanger: "evenly spaced" says in Hz, and why the octave axis bunches them', () => {
  const cfg = read('src/screens/lab/fxLabConfigs.tsx');
  const fl = cfg.slice(cfg.indexOf('const flangerConfig'), cfg.indexOf('export const FlangerLabScreen'));
  it('every "evenly spaced" claim on the rack says "in Hz"', () => {
    assert.match(fl, /comb notches evenly spaced in Hz/);
    assert.match(fl, /evenly spaced in Hz, but the scale runs in octaves \(100 · 1k · 10k\), so they crowd together toward the right/);
    assert.match(fl, /'Evenly spaced in Hz — on this octave scale the gaps look smaller toward the right\. Compare with the phaser\.'/);
    // Phase 2 shortened this option (balanced lengths); it still says "in Hz".
    assert.match(fl, /notches are evenly spaced in Hz'/);
    assert.doesNotMatch(fl, /'Evenly spaced — compare with the phaser\.'/);
    assert.doesNotMatch(fl, /evenly spaced comb notches whose/);
  });
});

// ── 6 · WHERE TO START: a first step a sound-off learner can do and see ─────
describe('F7-6 · silent first step in every effect lab’s EXPLORE start', () => {
  // [guide file, the export, the silent first action the start must open with]
  const LABS: [string, string, RegExp][] = [
    ['src/screens/lab/eq/equalizerScreenGuides.ts', 'EQUALIZER_SCREEN_GUIDES', /^Drag the FREQ fader and watch the bump/],
    ['src/screens/lab/compressionScreenGuides.ts', 'COMPRESSION_SCREEN_GUIDES', /^Drag THRESH down and watch the amber strip under OUT/],
    ['src/screens/lab/gateScreenGuides.ts', 'GATE_SCREEN_GUIDES', /^Drag THRESH up to −20 dB/],
    ['src/screens/lab/limiterScreenGuides.ts', 'LIMITER_SCREEN_GUIDES', /^Drag CEILING down and watch OUT/],
    ['src/screens/lab/delayScreenGuides.ts', 'DELAY_SCREEN_GUIDES', /^Set FDBK to 0% and watch ▸ OUT/],
    ['src/screens/lab/reverbScreenGuides.ts', 'REVERB_SCREEN_GUIDES', /^Drag RT60 from 0\.40 s to 6\.0 s/],
    ['src/screens/lab/chorusScreenGuides.ts', 'CHORUS_SCREEN_GUIDES', /^Watch the bold line on OUT for a few seconds/],
    ['src/screens/lab/flangerScreenGuides.ts', 'FLANGER_SCREEN_GUIDES', /^Drag CENTER from 2\.0 ms down to 0\.50 ms/],
    ['src/screens/lab/binauralScreenGuides.ts', 'BINAURAL_SCREEN_GUIDES', /^Slide AZ from 0° to \+90°, or drag object 1/],
  ];
  for (const [file, name, first] of LABS) {
    it(`${file.split('/').pop()}: the start opens on a silent step, ▶ comes after it, ≤ 40 words`, async () => {
      const mod = (await import(new URL(file, ROOT).href)) as Record<string, Record<string, { intro?: { start: string } }>>;
      const start = mod[name].explore.intro!.start;
      assert.match(start, first);
      assert.ok(start.indexOf('▶') > 0, 'the sound step is still there, after the silent one');
      assert.ok(!/^(Tap ▶|Set SOURCE|Put on headphones)/.test(start));
      assert.ok(start.trim().split(/\s+/).length <= 40);
    });
  }
});

// ── 7 · Plain bugs from the G6 / G6b files ──────────────────────────────────
describe('F7-7 · plain bugs', () => {
  it('Distortion LEARN start points at a section that exists (GUIDED STEPS 2 and 3)', () => {
    const g = read('src/screens/lab/distortionScreenGuides.ts');
    assert.doesNotMatch(g, /COMMON MISTAKES line on odd and even harmonics/);
    assert.match(g, /Then read GUIDED STEPS 2 and 3, on odd and even harmonics/);
    // …and those steps really are the odd/even ones.
    const c = read('src/features/lab/guidedLessons/content.ts');
    assert.match(c, /add harmonics at 660 and 1100 Hz from 220 Hz/);
    assert.match(c, /An uneven bend adds even harmonics \(440, 880 Hz…\)/);
  });
  it('Delay at FDBK 0% names the one repeat, not "each repeat is 0% of the last"', () => {
    const s = read('src/screens/lab/fxLabConfigs.tsx');
    assert.match(s, /v\[P\.delayFeedback\] <= 0\s*\? `\$\{v\[P\.timeMs\]\} ms to the one repeat; at FDBK 0% nothing is fed back, so no second repeat follows\. `/);
  });
  it('EQ Lab end-screen guide follows the state instead of always saying "open the first module"', () => {
    const g = read('src/screens/lab/eq/eqScreenGuides.ts');
    // Phase 2: S2's state-neutral line (the end screen's own WHERE TO START card is state-aware).
    assert.match(g, /start: 'Read WHERE TO START at the top: it names the next thing to do from where you are\.',/);
    assert.doesNotMatch(g, /Open the first module on the list and work down/);
  });
  it('Smart Processors page 6 says the ratio is fixed (there is no ratio control)', () => {
    assert.match(read('src/screens/lab/deesser/DeEsserLabScreen.tsx'), /the ratio \(fixed at 4:1 in this lab\)/);
    assert.match(read('src/features/deesser/deEsserModel.ts'), /ratio: 4, mode: 'split'/);
  });
  it('Chorus CHECK YOURSELF names the MIX key the learner sees', () => {
    const s = read('src/screens/lab/fxLabConfigs.tsx');
    assert.match(s, /question: 'At MIX 100% \(100% wet\) the chorus stops sounding like a chorus\. Why\?'/);
    assert.match(s, /label: '100% = VIBRATO', value: 1\.0/);
  });
});

// ══ PHASE 2 (shared mechanisms filled in for F7's labs) ═════════════════════
describe('F7 phase 2 · FINISH after the check in every effect lab (S2 API)', () => {
  const fx = code('src/screens/lab/FxLabScreen.tsx');
  it('FxLabScreen passes LabCheckEnd for every config, stopping its sound', () => {
    assert.match(fx, /checkEnd=\{\s*<LabCheckEnd\s+labId=\{config\.labId\}\s+labTitle=\{labTitleWords\(config\.title\)\}\s+onOpen=\{stop\}/);
    assert.doesNotMatch(fx, /config\.labId === 'stereo' \? \(\s*<LabCheckEnd/);
  });
  it('the title reads as words ("STEREO IMAGING LAB" → "Stereo Imaging Lab")', () => {
    const f = (t: string) => t.toLowerCase().replace(/(^|\s)([a-z])/g, (_m, sp: string, c: string) => sp + c.toUpperCase());
    assert.ok(fx.includes('function labTitleWords(title: string): string {\n  return title.toLowerCase().replace(/(^|\\s)([a-z])/g,'));
    assert.equal(f('STEREO IMAGING LAB'), 'Stereo Imaging Lab');
    assert.equal(f('EQUALIZER LAB'), 'Equalizer Lab');
  });
});

describe('F7 phase 2 · silent learner (S3 API)', () => {
  const cfg = read('src/screens/lab/fxLabConfigs.tsx');
  it('every effect lab has a sound-off line in its own words', () => {
    assert.equal((cfg.match(/^  soundOffLine: '/gm) ?? []).length, 12, 'all twelve effect configs');
    assert.match(read('src/screens/lab/BinauralLabScreen.tsx'), /soundOffLine: 'Sound off\? The frame shows the cues your ears would use/);
  });
  it('the GR cell shows a MODEL value on a steady tone while sound is off', () => {
    const fx = code('src/screens/lab/FxLabScreen.tsx');
    assert.match(fx, /\.\.\.\(grModelDb != null \? \{ silent: \{ v: `\$\{grModelDb\.toFixed\(1\)\} dB`, sub: 'MODEL' \} \} : \{\}\)/);
    // compressor: hard knee, GR = over × (1 − 1/ratio); limiter: GR = over the ceiling.
    assert.match(cfg, /grModel: \(v, src\) => \(src\.steadyPeakDb != null \? Math\.max\(0, src\.steadyPeakDb - v\[P\.thresholdDb\]\) \* \(1 - 1 \/ v\[P\.ratio\]\) : undefined\)/);
    assert.match(cfg, /grModel: \(v, src\) => \(src\.steadyPeakDb != null \? Math\.max\(0, src\.steadyPeakDb - v\[P\.ceilingDb\]\) : undefined\)/);
    // The limiter guide's "CEILING −25 dB: GR reads about 5 dB" on SINE 440 Hz (−20 dBFS).
    assert.equal(Math.max(0, -20 - -25), 5);
  });
  it('listening-only hints carry a path that works with sound off', () => {
    assert.match(cfg, /wrongHint: 'Compare the pictures: here each click comes back as repeats you can count; in the Reverb lab it fades as one wash\./);
    assert.match(read('src/screens/lab/BinauralLabScreen.tsx'), /wrongHint: 'A steady low tone has no sharp start for your ears to time/);
  });
  it('the EQ Lab HEAR IT bar is tagged NEEDS SOUND', () => {
    assert.match(code('src/screens/lab/eq/modules/eqAudition.tsx'), /<Text style=\{styles\.head\}>HEAR IT<\/Text>\s*(\{\s*\}\s*)?<NeedsSoundTag \/>/);
  });
});

describe('F7 phase 2 · first-visit bezel captions (S3 API)', () => {
  it('every effect-lab bezel cell has a caption of at most 14 characters', () => {
    const cfg = read('src/screens/lab/fxLabConfigs.tsx');
    const cells = [...cfg.matchAll(/\{ k: '[^']+', paramId: [^,}]+(?:, caption: '([^']*)')? \}/g)];
    assert.ok(cells.length >= 35);
    for (const c of cells) {
      assert.ok(c[1], `no caption: ${c[0]}`);
      assert.ok(c[1].length <= 14, c[1]);
    }
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /caption: 'turned down',/);
  });
  it('Binaural and the EQ Lab code labels carry captions too', () => {
    const b = read('src/screens/lab/BinauralLabScreen.tsx');
    for (const c of ['which sound', 'direction', 'how far away', 'far ear late']) assert.ok(b.includes(`caption: '${c}'`), c);
    assert.match(read('src/screens/lab/eq/modules/SeeingFrequency.tsx'), /\{ k: 'HPF', caption: 'low cut', /);
    assert.match(read('src/screens/lab/eq/modules/ParametricControls.tsx'), /\{ k: 'BW', caption: 'width, octaves', /);
  });
});

describe('F7 phase 2 · check guides and own checks (S2 API)', () => {
  const GUIDES = ['compression', 'chorus', 'delay', 'gate', 'limiter', 'flanger', 'phaser', 'reverb', 'binaural', 'stereo', 'distortion', 'phase'].map((n) => `src/screens/lab/${n}ScreenGuides.ts`)
    .concat(['src/screens/lab/eq/equalizerScreenGuides.ts', 'src/screens/lab/deesser/smartProcessorsScreenGuides.ts']);
  it('no CHECK guide still promises the explanation on a wrong tap', () => {
    for (const f of GUIDES) {
      const s = read(f);
      assert.doesNotMatch(s, /TRY ANOTHER (shows why|explains|heads the explanation|with the same explanation)/, f);
      assert.doesNotMatch(s, /(Each|Every) answer shows its explanation/, f);
      assert.doesNotMatch(s, /A wrong one shows its explanation/, f);
    }
  });
  it('end guides start state-neutral (S2: "Read WHERE TO START at the top…")', () => {
    for (const f of ['src/screens/lab/eq/eqScreenGuides.ts', 'src/screens/lab/stereoScreenGuides.ts', 'src/screens/lab/binauralScreenGuides.ts', 'src/screens/lab/deesser/smartProcessorsScreenGuides.ts']) {
      assert.match(read(f), /start: 'Read WHERE TO START at the top: it names the next thing to do from where you are\.',/, f);
    }
  });
  it('EQ Lab end rows name what is still to open; the shared rule is said once', () => {
    const e = code('src/screens/lab/eq/eqEnd.ts');
    assert.match(e, /detail: `Still to open: \$\{m\.blurb\}`/);
    assert.match(e, /export const EQ_END_HOW_IT_COUNTS = 'A module counts once you open it\. The check counts once every answer is right\.';/);
    for (const f of ['src/screens/lab/eq/EqLabHomeScreen.tsx', 'src/screens/lab/eq/EqModuleScreen.tsx']) {
      // Owner 2026-11-14 approved the end-screen recap (row 5); the EQ Lab now has
      // its own recap key, separate from the Equalizer's "eq" (S4 wiring round).
      assert.match(code(f), /howItCounts=\{EQ_END_HOW_IT_COUNTS\}\s*labId="eq-lab"/, f);
    }
  });
  it('the right answer is no longer the long one on the CHECK YOURSELF cards', () => {
    const cfg = read('src/screens/lab/fxLabConfigs.tsx');
    for (const gone of ['3 — about stages ÷ 2', 'it is doing exactly nothing, which is fine', 'let the transient through, then clamp the tail', 'The MID/SIDE balance — turning up']) {
      assert.ok(!cfg.includes(gone), gone);
    }
    assert.match(cfg, /options: \['6', '3', '12'\],/);
  });
});


// ── Phase 2b · a reason for every wrong option on F7's CHECK YOURSELF cards ──
// F5's CheckSpec `why` (keyed by AUTHORED option index; checkWrongText shows it
// on a wrong pick). Coordinator: "one line per wrong option, naming the
// misconception and the real control, never the right answer, ≤30 words".
describe('F7 phase 2b · every wrong option on my CHECK YOURSELF cards has its own reason', () => {
  const FILES = [
    'src/screens/lab/fxLabConfigs.tsx',
    'src/screens/lab/BinauralLabScreen.tsx',
    ...['CameraAnalogy', 'EqChallenges', 'FilterShapes', 'FilterSlopes', 'GraphicTruth', 'GraphicVsParametric', 'MultiBand', 'ParametricControls', 'QBandwidth', 'SeeingFrequency', 'WhyEq'].map((m) => `src/screens/lab/eq/modules/${m}.tsx`),
  ];
  type Card = { file: string; question: string; options: string[]; correct: number; why: Record<number, string> | null };
  const strOf = (e: ts.Expression): string => (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? e.text : '');
  const cards: Card[] = [];
  for (const file of FILES) {
    const sf = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (n: ts.Node) => {
      if (ts.isObjectLiteralExpression(n)) {
        const props: Record<string, ts.Expression> = {};
        for (const pr of n.properties) if (ts.isPropertyAssignment(pr) && ts.isIdentifier(pr.name)) props[pr.name.text] = pr.initializer;
        if (props.question && props.options && props.correctIdx && ts.isArrayLiteralExpression(props.options)) {
          let why: Record<number, string> | null = null;
          if (props.why && ts.isObjectLiteralExpression(props.why)) {
            why = {};
            for (const w of props.why.properties) if (ts.isPropertyAssignment(w)) why[Number(w.name.getText(sf))] = strOf(w.initializer);
          }
          cards.push({ file, question: strOf(props.question), options: props.options.elements.map(strOf), correct: Number(props.correctIdx.getText(sf)), why });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  it('finds all 37 cards', () => assert.equal(cards.length, 37));
  it('each wrong option has a reason; never on the right one; ≤ 30 words; never quotes the right answer', () => {
    const bad: string[] = [];
    for (const c of cards) {
      if (!c.why) { bad.push(`no why: ${c.question}`); continue; }
      c.options.forEach((_o, i) => {
        if (i === c.correct) { if (c.why![i] != null) bad.push(`why on the right answer: ${c.question}`); return; }
        const t = c.why![i];
        if (!t) { bad.push(`no reason for option ${i}: ${c.question}`); return; }
        if (t.split(/\s+/).length > 30) bad.push(`over 30 words: ${t}`);
        const right = c.options[c.correct].toLowerCase();
        if (right.length > 3 && t.toLowerCase().includes(right)) bad.push(`quotes the answer: ${t}`);
      });
      for (const k of Object.keys(c.why)) if (Number(k) >= c.options.length) bad.push(`key ${k} is not an option: ${c.question}`);
    }
    assert.deepEqual(bad, []);
  });
  it('the shared card shows `why` before the hint (F5)', () => {
    assert.match(read('src/screens/lab/foundations/checkWords.ts'), /return spec\.why\?\.\[picked\] \?\? spec\.wrongHint \?\? 'Not quite — try again\.';/);
  });
});


// ── Checker C4 fixes ─────────────────────────────────────────────────────────
describe('F7 · checker C4 fixes', () => {
  it('FAIL-1: the GAIN REDUCTION words follow what the GR cell shows (MODEL vs — dB) in every state', () => {
    const fx = code('src/screens/lab/FxLabScreen.tsx');
    // the caller tells the words whether the cell is showing MODEL…
    assert.match(fx, /\{grMeterCaption\(running, fxReady, config\.pollGr, soundOff, grModelDb != null\)\}/);
    // …and the cell shows it exactly when a model exists (BezelItem.silent, swapped in while sound is off)
    assert.match(fx, /\.\.\.\(grModelDb != null \? \{ silent: \{ v: `\$\{grModelDb\.toFixed\(1\)\} dB`, sub: 'MODEL' \} \} : \{\}\)/);
    const body = fx.slice(fx.indexOf('function grMeterCaption('), fx.indexOf('function labTitleWords('));
    // sound off + model: no "— dB" in that branch; sound off without a model: "— dB" said
    const modelBranch = body.slice(body.indexOf('if (soundOff && modelShown)'), body.indexOf('if (soundOff) {'));
    assert.match(modelBranch, /the GR readout shows MODEL/);
    assert.doesNotMatch(modelBranch, /— dB/);
    // the sound-off branches come BEFORE the fxReady / web / device branches (no state falls through to "— dB" while MODEL shows)
    assert.ok(body.indexOf('if (soundOff && modelShown)') < body.indexOf('if (fxReady) {'));
    assert.ok(body.indexOf('if (soundOff) {') < body.indexOf("Platform.OS === 'web'\n    ? `On the web"));
  });
  it('FAIL-2: every flanger guide line that says "evenly spaced" says "in Hz"', () => {
    const g = read('src/screens/lab/flangerScreenGuides.ts');
    const lines = g.split('\n').filter((l) => /evenly spaced/.test(l));
    assert.ok(lines.length >= 4);
    for (const l of lines) assert.match(l, /evenly spaced in Hz/, l.trim());
  });
  it('Phaser WHERE TO START opens on a silent step, ▶ second', async () => {
    const mod = (await import(new URL('src/screens/lab/phaserScreenGuides.ts', ROOT).href)) as Record<string, Record<string, { intro?: { start: string } }>>;
    const start = mod.PHASER_SCREEN_GUIDES.explore.intro!.start;
    assert.match(start, /^Open SWEEP, set DEPTH \(SWEEP\) to STATIC, and drag CENTER/);
    assert.ok(start.indexOf('▶') > 0);
  });
});
