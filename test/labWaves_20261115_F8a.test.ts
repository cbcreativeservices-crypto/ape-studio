/**
 * Beginner waves 1-3 (2026-11-15), group F8a: Oscillators, Noise, Harmonics,
 * FM Synthesis, Modular Synth, Sound Envelope & Transients, Autotune.
 * Owner go: "build waves 1 thru 3" (D62 adoption plan).
 *
 * Every test here fails on the code as it was before the change
 * (docs/labs/beginner_waves_2026_11_15/F8a_REPORT.md lists each item).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a word in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const LAB = 'src/screens/lab';
const words = (s: string) => s.trim().split(/\s+/).length;
const firstSentence = (s: string) => s.split(/(?<=[.!?])\s/)[0];

const { OSCILLATOR_SCREEN_GUIDES } = await import('../src/screens/lab/oscillatorScreenGuides.ts');

describe('OSC-04 · Oscillators: the check questions first, the engineer notes folded', () => {
  const s = code(`${LAB}/OscillatorLabScreen.tsx`);
  it('both CheckQuestions come before WHAT YOU’RE SEEING, THE SOUND and FM · AM', () => {
    const q = s.indexOf('<CheckQuestion');
    assert.ok(q > 0);
    assert.ok(q < s.indexOf('WHAT YOU’RE SEEING'));
    assert.ok(q < s.indexOf('>THE SOUND<'));
    assert.ok(q < s.indexOf('FM · AM — NOT IN THIS LAB'));
  });
  it('THE SOUND and the FM · AM note sit inside GO DEEPER, with their words kept', () => {
    const open = s.indexOf('<GoDeeper');
    const close = s.indexOf('</GoDeeper>');
    assert.ok(open > 0 && close > open, 'one GO DEEPER fold');
    const inside = s.slice(open, close);
    assert.match(inside, />THE SOUND</);
    assert.match(inside, /Band-limited by construction/);
    assert.match(inside, /'FM · AM — NOT IN THIS LAB'/);
    assert.match(inside, /sidebands at fc ± n·fm \(FM, Bessel amplitudes\)/);
    assert.match(s, /import \{ GoDeeper \} from '\.\/foundations\/GoDeeper';/);
  });
  it('the speaker advisory and a sound error stay outside the fold', () => {
    const open = s.indexOf('<GoDeeper');
    assert.ok(s.indexOf('{LOW_FREQ_ADVISORY}') > 0 && s.indexOf('{LOW_FREQ_ADVISORY}') < open);
    assert.ok(s.indexOf('{genError}') < open);
  });
});

describe('OSC-05 · Oscillators: the intro card opens with the plain recipe, bar 1 is the note', () => {
  const l = OSCILLATOR_SCREEN_GUIDES.explore.intro!.learning;
  it('plain words, no harmonics / fundamental / timbre jargon', () => {
    assert.match(l, /built from simple tones stacked up, like a recipe/);
    assert.match(l, /Bar 1 is the note/);
    assert.doesNotMatch(l, /harmonic|fundamental|timbre/i);
    assert.ok(words(l) <= 30);
  });
});

describe('OSC-03 · Oscillators: one plain line says what the bars are', () => {
  it('the first line under the display (it replaces the old caption: a line in, a line out)', () => {
    const s = code(`${LAB}/OscillatorLabScreen.tsx`);
    assert.match(s, /exploreCaption="Each bar is one pure tone: bar 1 is the note, bars 2 to 12 add its color\."/);
    assert.equal(s.split('Each bar is one pure tone').length, 2, 'said once');
  });
});

describe('SH-37 · Oscillators: no "update the app" in learner text', () => {
  it('the sine-only line keeps its meaning without the update instruction', () => {
    const s = code(`${LAB}/OscillatorLabScreen.tsx`);
    assert.match(s, /plays the fundamental SINE only; square, saw, triangle and pulse stay visual\.`/);
    assert.doesNotMatch(s, /update the app/i);
  });
});

describe('SH-76 · Oscillators and FM: every F0 / FC choice carries a one-line meaning', () => {
  it('Oscillator F0 tray', () => {
    const s = code(`${LAB}/OscillatorLabScreen.tsx`);
    assert.match(s, /label: `\$\{hz\} Hz`, blurb: F0_BLURBS\[hz\] \}/);
    for (const hz of [110, 220, 440, 880]) assert.match(s, new RegExp(`\\n  ${hz}: '[^']{20,}',`));
  });
  it('FM FC tray', () => {
    const s = code(`${LAB}/FmLabScreen.tsx`);
    assert.match(s, /label: `\$\{c\} Hz`, blurb: CARRIER_BLURBS\[c\] \}/);
    for (const hz of [110, 220, 440]) assert.match(s, new RegExp(`\\n  ${hz}: '[^']{20,}',`));
  });
});

const { NOISE_SCREEN_GUIDES } = await import('../src/screens/lab/noiseScreenGuides.ts');

describe('NOI-04 · Noise: the intro card says what noise is for', () => {
  const l = NOISE_SCREEN_GUIDES.explore.intro!.learning;
  it('a hiss with no note, used on purpose to test speakers and rooms; no dB per octave', () => {
    assert.match(l, /hiss with no note/);
    assert.match(l, /on purpose to test speakers and rooms/);
    assert.doesNotMatch(l, /dB per octave/);
    assert.ok(words(l) <= 30);
  });
});

describe('NOI-02 · Noise: the chart says what its directions mean', () => {
  const s = code(`${LAB}/NoiseLabScreen.tsx`);
  it('louder up, quieter down, rumble left, hiss right', () => {
    for (const w of ['↑ louder', '↓ quieter', '← rumble', 'hiss →']) assert.ok(s.includes(w), w);
    assert.match(s, /const VH = H \+ 32;/, 'a second label row under the numbers');
    assert.match(NOISE_SCREEN_GUIDES.explore.seeing[0], /rumble to hiss; up is louder/);
  });
});

describe('NOI-03 · Noise: the WHITE line explains why flat sounds bright, without sound', () => {
  it('LEARN’s 50 Hz versus 5,000 Hz example is on the WHITE line', () => {
    const s = code(`${LAB}/NoiseLabScreen.tsx`);
    const white = s.match(/ {2}white: '([^']+)',/)![1];
    assert.match(white, /5,000 to 10,000 Hz holds 5,000 Hz/);
    assert.match(white, /50 to 100 Hz only 50/);
    assert.doesNotMatch(white, /twice the bandwidth/);
    assert.match(read('src/features/lab/guidedLessons/content.ts'), /the octave from 5 to 10 kHz spans 5,000 Hz; 50 to 100 Hz spans 50/);
  });
});

const { FM_SCREEN_GUIDES } = await import('../src/screens/lab/fmScreenGuides.ts');
const FMG = await import('../src/screens/lab/fmGrid.ts');

describe('FM-01 · FM: the display speaks plain words', () => {
  const s = code(`${LAB}/FmLabScreen.tsx`);
  it('the legend: green = the note, amber = new tones FM adds; no reflected / aliased words', () => {
    assert.ok(s.includes("'green = the note · amber = new tones FM adds\\n"));
    assert.doesNotMatch(s, /reflected below 0 Hz|ALIASED past Nyquist/);
  });
  it('caption, note under the display and subtitle drop the math words', () => {
    const cap = s.match(/exploreCaption=\{([\s\S]*?)\n\s*\}/)![1];
    assert.doesNotMatch(cap, /Bessel|sideband|dashed/i);
    const note = s.match(/modelNote:([\s\S]*?),\n/)![1];
    assert.doesNotMatch(note, /Bessel|FC ± k·FM/);
    assert.match(s, /subtitle="One tone shakes another · new tones appear"/);
  });
  it('the rare cases are still explained in the ⓘ guide', () => {
    assert.match(FM_SCREEN_GUIDES.explore.seeing.join(' '), /Dim dashed: reflected below 0 Hz/);
    assert.match(FM_SCREEN_GUIDES.explore.seeing.join(' '), /Red dashed: ALIASED past Nyquist/);
  });
});

describe('FM-02 · FM: the modulator readout is MOD', () => {
  it('no FM readout; the lesson, guide and check reasons say MOD', () => {
    const s = code(`${LAB}/FmLabScreen.tsx`);
    assert.match(s, /\{ k: 'MOD', v: `\$\{fm\.toFixed\(0\)\} Hz`, helpKey: 'ratio', caption: 'the shaker' \}/);
    assert.doesNotMatch(s, /k: 'FM'/);
    const lesson = read('src/features/lab/guidedLessons/content.ts').match(/\n {2}fm: \{([\s\S]*?)\n {2}\},/)![1];
    assert.doesNotMatch(lesson, /FM reads|FM = FC|× FM\b/);
    assert.doesNotMatch(JSON.stringify(FM_SCREEN_GUIDES), /FM reads|× FM\b|FM: modulator/);
    assert.doesNotMatch(read('src/features/lab/understandingChecks.ts'), /FM = FC × RATIO/);
  });
});

describe('FM-04 · FM: the intro card opens with the plain idea; INDEX first, play second', () => {
  const i = FM_SCREEN_GUIDES.explore.intro!;
  it('learning and start', () => {
    assert.match(i.learning, /^FM shakes one tone with another, which makes new tones/);
    assert.doesNotMatch(i.learning, /sideband/i);
    assert.match(firstSentence(i.start), /^Drag INDEX/);
    assert.doesNotMatch(firstSentence(i.start), /▶|hear|listen/i);
    assert.match(i.start, /Then tap ▶/);
    assert.ok(words(i.start) <= 40 && words(i.learning) <= 30);
  });
});

describe('FM-03 · FM: faint in-tune lines behind the sticks', () => {
  it('the step is the series’ fundamental: fc for whole ratios, fc/2 for 0.5 and 3.5, fc for ✳', () => {
    assert.equal(FMG.fmNoteStep(220, 2, false), 220);
    assert.equal(FMG.fmNoteStep(220, 7, false), 220);
    assert.equal(FMG.fmNoteStep(220, 0.5, false), 110);
    assert.equal(FMG.fmNoteStep(220, 3.5, false), 110);
    assert.equal(FMG.fmNoteStep(220, 1.41, true), 220);
  });
  it('a pitched ratio puts every stick on a line; 1.41 ✳ puts most between', () => {
    const onLine = (f: number, step: number) => Math.abs(f / step - Math.round(f / step)) < 1e-6;
    for (const ratio of [0.5, 1, 2, 3.5, 7]) {
      const step = FMG.fmNoteStep(220, ratio, false);
      for (let k = 0; k <= 6; k++) for (const f of [220 + k * 220 * ratio, Math.abs(220 - k * 220 * ratio)]) assert.ok(onLine(f, step), `${ratio}: ${f}`);
    }
    const step = FMG.fmNoteStep(220, 1.41, true);
    const off = [1, 2, 3, 4].flatMap((k) => [220 + k * 310.2, Math.abs(220 - k * 310.2)]).filter((f) => !onLine(f, step));
    assert.ok(off.length >= 6);
  });
  it('too dense to read: no lines', () => {
    assert.equal(FMG.fmNoteGrid(110, 27000, 330 / 27000).length, 0);
    assert.equal(FMG.fmNoteGrid(220, 5566, 330 / 5566).length, 25);
  });
  it('the graph draws them faint (1 px), and the key names them', () => {
    const s = code(`${LAB}/FmLabScreen.tsx`);
    assert.match(s, /const noteLines = fmNoteGrid\(fmNoteStep\(fc, ratio, inharmonic\), fMax, \(lw - 2 \* PAD\) \/ fMax\);/);
    assert.match(s, /noteLines\.map\(\(f\) => \(\s*<Line key=\{`n\$\{f\}`\}[^>]*strokeWidth=\{1\} \/>/);
    assert.match(s, /faint lines = in-tune spots for a clear note/);
  });
});

describe('SH-37 · FM: no "update the app" in learner text', () => {
  it('the store line keeps its meaning', () => {
    const s = code(`${LAB}/FmLabScreen.tsx`);
    assert.doesNotMatch(s, /update the app/i);
    assert.match(s, /cannot play the FM voice yet\. The sideband graph and lessons work fully\.'/);
  });
});

describe('SH-75-F · CHECK guides no longer repeat the card’s no-score sentence', () => {
  it('none of the seven guides says it again; the shared card says it once', () => {
    for (const p of ['autotuneScreenGuides.ts', 'envelope/envelopeScreenGuides.ts', 'fmScreenGuides.ts', 'harmonicScreenGuides.ts', 'modular/modularScreenGuides.ts', 'noiseScreenGuides.ts', 'oscillatorScreenGuides.ts']) {
      assert.doesNotMatch(read(`${LAB}/${p}`), /no score|costs nothing/, p);
    }
    assert.match(read('src/components/LabUnderstandingCheck.tsx'), /Nothing is lost and there is no score\./);
  });
});

const { MODULAR_SCREEN_GUIDES } = await import('../src/screens/lab/modular/modularScreenGuides.ts');

describe('MOD-01 · Modular: plain names for the sound path and the subtitle', () => {
  const s = code(`${LAB}/ModularLabScreen.tsx`);
  it('TONE, FILTER, VOLUME, OUT over their own modules, above the case; no "AUDIO PATH → OUT"', () => {
    assert.match(s, /const PLAIN_NAME: Partial<Record<string, string>> = \{ vco: 'TONE', vcf: 'FILTER', vca: 'VOLUME', out: 'OUT' \};/);
    assert.match(s, /PLAIN_NAME\[m\.key\] \? \(\s*<SvgText key=\{`pn\$\{m\.key\}`\} x=\{mx\(i\) \+ \(m\.hp \* hpPx\) \/ 2\} y=\{10\}/);
    assert.doesNotMatch(s, /AUDIO PATH → OUT/);
    assert.match(s, /fontSize=\{9\.5\}[^>]*>\s*\{PLAIN_NAME\[m\.key\]\}/, '≥ 9 pt');
  });
  it('the subtitle is plain words, not acronyms', () => {
    assert.match(s, /subtitle="Tone → Filter → Volume, patched with cables"/);
    assert.doesNotMatch(s, /subtitle="VCO · VCF/);
  });
});

describe('MOD-02 · Modular: the line under the case says the boxes open their help', () => {
  it('the caption under the case (it replaces the old one)', () => {
    const s = code(`${LAB}/ModularLabScreen.tsx`);
    assert.match(s, /exploreCaption="Tap any box to learn what it does\. The case is patched exactly like the sound you hear\."/);
    assert.doesNotMatch(s, /Tap any module for what it does\./);
  });
  it('the jack legend folds under GO DEEPER, words kept', () => {
    const s = code(`${LAB}/ModularLabScreen.tsx`);
    const inside = s.slice(s.indexOf('<GoDeeper'), s.indexOf('</GoDeeper>'));
    assert.match(inside, /Labels sit above each jack/);
    assert.match(inside, /LVL = output level\./);
  });
});

describe('MOD-03 · Modular: THE VOICE, AS SOUND sits straight under the case', () => {
  it('the bar graph is pinned in the rack’s wellTop, outside LAB NOTES', () => {
    const s = code(`${LAB}/ModularLabScreen.tsx`);
    const top = s.slice(s.indexOf('wellTop: ('), s.indexOf('render: (w, h) =>'));
    assert.match(top, /THE VOICE, AS SOUND/);
    assert.match(top, /<ModularSpectrum shape=\{patch\.shape\}/);
    assert.equal((s.match(/<ModularSpectrum /g) ?? []).length, 1, 'drawn once');
    assert.match(s, /Learn here; measure real gear with a calibrated analyzer\./, 'its honesty line stays');
  });
});

describe('MOD-04 · Modular: the intro card names the amber path in plain words', () => {
  it('learning line', () => {
    const l = MODULAR_SCREEN_GUIDES.explore.intro!.learning;
    assert.match(l, /^Sound flows along the amber cable: TONE, FILTER, VOLUME, OUT\. The colored cables turn knobs for you/);
    assert.doesNotMatch(l, /VCO|VCF|VCA/);
    assert.ok(words(l) <= 30);
    assert.match(MODULAR_SCREEN_GUIDES.explore.intro!.start, /^Tap PATCH → WOBBLE/);
  });
});

describe('SH-37 · Modular and Harmonics: no "update the app" in learner text', () => {
  for (const f of ['ModularLabScreen.tsx', 'HarmonicsView.tsx', 'HarmonicStems.tsx']) {
    it(f, () => assert.doesNotMatch(code(`${LAB}/${f}`), /update the app/i));
  }
});

describe('ENV-04 · Envelope: the Try-it line says what to notice', () => {
  it('a snap at the start, or a slow fade-in; that rise is the attack', () => {
    const s = code(`${LAB}/envelope/EnvelopeLabScreen.tsx`);
    assert.match(s, /<Prompt>Try it: drag ATTACK all the way left and the sound starts with a snap; drag it right and it fades in slowly\. That rise is the attack\.<\/Prompt>/);
  });
});

describe('ENV-01 · Envelope: the plain meaning before the dB numbers on Peak vs Average', () => {
  const s = code(`${LAB}/envelope/EnvelopeLabScreen.tsx`);
  const page = s.slice(s.indexOf('function PagePeakAverage'), s.indexOf('function PageScope'));
  it('drum = big gap, trumpet = small gap, BEFORE the readout', () => {
    const plain = page.indexOf('A big gap between the lines means a spiky sound, like a drum; a small gap, a steady sound, like a trumpet.');
    assert.ok(plain > 0);
    assert.ok(plain < page.indexOf('{crestRead}\n'), 'before the numbers');
  });
  it('dB is glossed once, with the shared words', () => {
    assert.match(page, /The numbers are in \$\{termWithShort\('db'\)\}\./);
    assert.match(s, /import \{ termWithShort \} from '\.\.\/\.\.\/\.\.\/features\/lab\/plainTerms';/);
  });
  it('the chart’s duplicate "relative to full scale" caption went (the card’s eyebrow keeps it)', () => {
    assert.doesNotMatch(page, /caption="levels relative to the chart’s full scale/);
    assert.match(page, /RELATIVE TO FULL SCALE/);
  });
});

const { AUTOTUNE_SCREEN_GUIDES } = await import('../src/screens/lab/autotuneScreenGuides.ts');
const { PLAIN_TERMS } = await import('../src/features/lab/plainTerms.ts');

describe('AUT-04 · Autotune: the intro card says how to read the marks, then a silent step', () => {
  const i = AUTOTUNE_SCREEN_GUIDES.explore.intro!;
  it('gray = as sung, the gridline = the right note (never the other way round)', () => {
    assert.match(i.learning, /gray is the note as sung/);
    assert.match(i.learning, /gridline, the right note/);
    assert.doesNotMatch(i.learning + i.start, /gr[ae]y line (beside it )?is where it should be/i);
  });
  it('the first step is AMOUNT to OFF and back to 100 %; play second', () => {
    assert.match(firstSentence(i.start), /^Slide AMOUNT to OFF .* back to 100%/);
    assert.doesNotMatch(firstSentence(i.start), /PLAY|▶|hear|listen/i);
    assert.match(i.start, /Then tap PLAY/);
    assert.ok(words(i.start) <= 40 && words(i.learning) <= 30);
  });
});

describe('AUT-01 · Autotune: a one-line key on the display, notes numbered', () => {
  const s = code(`${LAB}/AutotuneLabScreen.tsx`);
  it('the note under the display is the key: rows, top to bottom, gray as sung, amber as heard, gridline = right note', () => {
    const note = s.match(/modelNote: '([^']+)'/)![1];
    assert.equal(note, 'Each row is one sung note, top to bottom: gray as sung, amber as heard; gridline = right note.');
    assert.ok(note.length <= 100);
  });
  it('each row carries its number, 1 to 6, at its right edge', () => {
    assert.match(s, /<SvgText x=\{w - 3\} y=\{c\.y0 \+ 11\} fill=\{colors\.textSub\} fontSize=\{10\}[^>]*>\s*\{`\$\{i \+ 1\}`\}/);
  });
  it('the code still draws gray at the sung pitch and the target as the gridline', () => {
    assert.match(s, /const sungX = xOf\(note\.midi \* 100 \+ note\.offCents\);/);
    assert.match(s, /<Line x1=\{c\.sungX\} y1=\{c\.y0\} x2=\{c\.sungX\} y2=\{c\.y1\} stroke="#6a6a74"/);
    assert.match(s, /gridX: xOf\(note\.midi \* 100\)/);
  });
});

describe('AUT-02 · Autotune: ¢ is explained under the display, with the shared words', () => {
  it('the caption under the display reads "¢ = cents: 100 cents = one piano key"', () => {
    const s = code(`${LAB}/AutotuneLabScreen.tsx`);
    assert.match(s, /exploreCaption=\{`¢ = cents: \$\{PLAIN_TERMS\.cents\.short\}\./);
    assert.equal(PLAIN_TERMS.cents.short, '100 cents = one piano key');
  });
});

describe('AUT-03 · Autotune: a SPEED change replays the corrected curves top to bottom', () => {
  const s = code(`${LAB}/AutotuneLabScreen.tsx`);
  it('the grid gets the SPEED key as its replay key and reveals each row over one note', () => {
    assert.match(s, /replayKey=\{speedKey\}/);
    assert.match(s, /const p = Math\.min\(1, \(Date\.now\(\) - t0\) \/ NOTE_MS\);/);
    assert.match(s, /const last = Math\.max\(1, Math\.round\(reveal \* N\)\);\s*for \(let k = 0; k <= last; k\+\+\)/);
    assert.match(s, /\}, \[replayKey, motion\]\);/);
  });
  it('it follows the decorative-motion setting (no replay under Reduce animations / Low-Light)', () => {
    assert.match(s, /if \(!motion\) \{\s*setReveal\(1\);\s*return;\s*\}/);
  });
  it('the sound-off line points the eye at the bend (same slot)', () => {
    assert.match(s, /soundOffLine: 'Sound off\? Switch SPEED and watch each curve replay: FAST snaps, SLOW glides\.'/);
  });
});

const { HARMONIC_SCREEN_GUIDES } = await import('../src/screens/lab/harmonicScreenGuides.ts');

describe('HAR-01 · Harmonics: stems first, measurements on request', () => {
  const v = code(`${LAB}/HarmonicsView.tsx`);
  it('the stem editor is pinned as the first thing in the well (wellTop), above the caption and LAB NOTES', () => {
    // renderStems holds the editor and is wired as the rack's wellTop in analytic mode only
    const stems = v.slice(v.indexOf('const renderStems = (api: LabShellExploreApi): ReactNode =>'), v.indexOf("const rack: HarmonicRackParts['rack']"));
    assert.match(stems, /<HarmonicStems[\s\S]*onDragActive=\{api\.setScrollLocked\}/, 'the drag still locks the well’s scroll');
    assert.match(stems, /<HarmonicCard/);
    assert.match(v, /wellTop: view === 'model' \? renderStems : undefined,/);
    assert.match(v, /wellTop\?: \(api: LabShellExploreApi\) => ReactNode;/);
    // …and drawn once: no longer inside the LAB NOTES well
    assert.equal((v.match(/<HarmonicStems/g) ?? []).length, 1);
    assert.equal(v.slice(v.indexOf('const renderWell')).indexOf('<HarmonicStems'), -1);
    // the shell calls a function wellTop with the api, outside the LAB NOTES disclosure
    const shell = code(`${LAB}/LabShell.tsx`);
    assert.match(shell, /\{typeof rack\.wellTop === 'function' \? rack\.wellTop\(api\) : rack\.wellTop\}/);
    assert.ok(shell.indexOf('rack.wellTop(api)') < shell.indexOf('<CollapsibleSection title="LAB NOTES"'));
    // HarmonicLabScreen threads the whole rack (wellTop included) into LabShell
    assert.match(code(`${LAB}/HarmonicLabScreen.tsx`), /rack=\{rack\}/);
  });
  it('THD, CREST and SLOPE show only after MEASURE; F0 stays', () => {
    assert.match(v, /const \[showMeasures, setShowMeasures\] = useState\(false\);/);
    assert.match(v, /\{ k: 'F0', v: `\$\{f0\} Hz`, helpKey: 'frequency', caption: 'the pitch' \},\s*\.\.\.\(showMeasures \? \(\[/);
    assert.match(v, /kind: 'toggle',\s*id: 'measure',\s*label: 'MEASURE',\s*value: showMeasures,/);
    assert.match(HARMONIC_SCREEN_GUIDES.explore.seeing.join(' '), /Readouts: F0; MEASURE adds THD/);
  });
});

describe('HAR-04 · Harmonics: opens on SINE with "Drag H3 up"', () => {
  const v = code(`${LAB}/HarmonicsView.tsx`);
  it('SINE is the starting preset', () => {
    assert.match(v, /useState<PresetKey>\('sine'\)/);
    assert.match(v, /useRef<PresetKey>\('sine'\)/);
    assert.match(v, /useState<HarmonicSet>\(\(\) => buildPreset\('sine'\)\)/);
  });
  it('the stems’ heading says DRAG H3 UP until the first edit (no new line)', () => {
    assert.match(v, /hint=\{pristineSine \? 'DRAG H3 UP' : undefined\}/);
    assert.match(code(`${LAB}/HarmonicStems.tsx`), /HARMONIC STEMS — \{hint \?\? 'EDITABLE MODEL'\}/);
  });
  it('WHERE TO START: drag H3 first, sound second; no THD numbers', () => {
    const st = HARMONIC_SCREEN_GUIDES.explore.intro!.start;
    assert.match(firstSentence(st), /^Drag stem H3 up/);
    assert.doesNotMatch(firstSentence(st), /▶|hear|listen/i);
    assert.doesNotMatch(st, /75\.2|43\.8/);
    assert.match(st, /▶/);
  });
});

describe('HAR-02 · Harmonics: the THD CALC sheet opens with one plain sentence', () => {
  it('before the formula, and true (THD can pass 100 %, so it is not called a share)', () => {
    const v = code(`${LAB}/HarmonicsView.tsx`);
    const sheet = v.slice(v.indexOf('THD — HOW IT IS CALCULATED'));
    const plain = sheet.indexOf('THD compares the harmonics with the main note: 0 % is a pure tone');
    assert.ok(plain > 0 && plain < sheet.indexOf('THD % = √'));
    assert.doesNotMatch(sheet.slice(0, sheet.indexOf('THD % = √')), /share|how much of the sound/);
  });
});

describe('SH-64 · Autotune: SPEED is grayed, with a reason, while AMOUNT is OFF', () => {
  it('the rack locks the SPEED key only at AMOUNT OFF', () => {
    const s = code(`${LAB}/AutotuneLabScreen.tsx`);
    assert.match(s, /locked: amount <= 0\.005 \? 'SPEED does nothing while AMOUNT is OFF: raise AMOUNT first\.' : undefined,/);
  });
});

describe('HAR-01 · Harmonics: the caption under the display points at the stems', () => {
  it('same slot, shorter words', () => {
    assert.match(code(`${LAB}/HarmonicLabScreen.tsx`), /exploreCaption="Drag a stem up to add a harmonic; the bands and the wave follow live\."/);
  });
});
