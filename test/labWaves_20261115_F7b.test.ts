/**
 * Beginner waves 1-3 (2026-11-15) — group F7b: Delay, Reverb, Chorus,
 * Flanger, Phaser, Distortion, Phase. Owner go, 2026-11-15: "build waves 1
 * thru 3" (D62 adoption plan). Brief:
 * docs/labs/beginner_waves_2026_11_15/00_BUILD_BRIEF.md; items: F7b_ITEMS.md;
 * report: F7b_REPORT.md.
 *
 * Every test here would have failed before its change.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const CFG = code('src/screens/lab/fxLabConfigs.tsx');
const block = (start: string, end: string) => CFG.slice(CFG.indexOf(start), CFG.indexOf(end));
const DELAY = block('const delayConfig: FxLabConfig = {', 'export const DelayLabScreen');
const REVERB = block('const reverbConfig: FxLabConfig = {', 'export const ReverbLabScreen');
const CHORUS = block('const chorusConfig: FxLabConfig = {', 'export const ChorusLabScreen');
const FLANGER = block('const flangerConfig: FxLabConfig = {', 'export const FlangerLabScreen');
const PHASER = block('const phaserConfig: FxLabConfig = {', 'export const PhaserLabScreen');
const DIST = CFG.slice(CFG.indexOf('const DIST_OS_HZ'), CFG.indexOf('export const DistortionLabScreen'));
const PHASE = block('const phaseConfig: FxLabConfig = {', 'export const PhaseLabScreen');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const SCREEN = code('src/screens/lab/FxLabScreen.tsx');
const CONTENT = read('src/features/lab/guidedLessons/content.ts');
const lesson = (lab: string, next: string) => CONTENT.slice(CONTENT.indexOf(`  ${lab}: {`), CONTENT.indexOf(`  ${next}: {`));
const CHECKS = read('src/features/lab/understandingChecks.ts');
const checks = (name: string, next: string) => CHECKS.slice(CHECKS.indexOf(`const ${name}: readonly Q[] = [`), CHECKS.indexOf(`const ${next}: readonly Q[] = [`));

const { DELAY_SCREEN_GUIDES: DG } = await import('../src/screens/lab/delayScreenGuides.ts');
const { REVERB_SCREEN_GUIDES: RG } = await import('../src/screens/lab/reverbScreenGuides.ts');
const { CHORUS_SCREEN_GUIDES: CG } = await import('../src/screens/lab/chorusScreenGuides.ts');
const { FLANGER_SCREEN_GUIDES: FG } = await import('../src/screens/lab/flangerScreenGuides.ts');
const { PHASER_SCREEN_GUIDES: PG } = await import('../src/screens/lab/phaserScreenGuides.ts');
const { DISTORTION_SCREEN_GUIDES: XG } = await import('../src/screens/lab/distortionScreenGuides.ts');
const { PHASE_SCREEN_GUIDES: HG } = await import('../src/screens/lab/phaseScreenGuides.ts');
const { PLAIN_TERMS, termWithShort } = await import('../src/features/lab/plainTerms.ts');
const { LAB_TERM_ENTRIES } = await import('../src/features/intro/labTermIntroData.ts');
const { laneStepValue } = await import('../src/screens/lab/rack/laneStep.ts');

type G = Record<string, unknown> & { intro: { learning: string; start: string } };
const GUIDES: Record<string, Record<string, G>> = { delay: DG, reverb: RG, chorus: CG, flanger: FG, phaser: PG, distortion: XG, phase: HG } as never;
const text = (g: G) => Object.entries(g).filter(([k]) => k !== 'intro').map(([, v]) => (v as string[]).join('\n')).join('\n') + '\n' + g.intro.learning + '\n' + g.intro.start;
const card = (key: string) => (LAB_TERM_ENTRIES as Record<string, { plainEnglish?: string }>)[key]?.plainEnglish ?? '';

/** Lift a plain function out of the config source and run it (types stripped by tsc). */
function liftRun<T>(name: string, prelude = ''): T {
  const m = read('src/screens/lab/fxLabConfigs.tsx').match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}\\n`));
  assert.ok(m, `${name} not found`);
  const js = ts.transpileModule(`${prelude}\n${m[0]}\nreturn ${name};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(js)() as T;
}

// ══ Delay ═══════════════════════════════════════════════════════════════════
describe('DL-01 · Delay opens at FEEDBACK 0%, and the picture names the echo', () => {
  it('FEEDBACK initial is 0', () => {
    assert.match(DELAY, /paramId: P\.delayFeedback[\s\S]*?initial: 0,/);
    assert.doesNotMatch(DELAY, /paramId: P\.delayFeedback[^}]*?\n\s*initial: 0\.5,/);
  });
  it('the glass key says gray is the click and blue its echo (in place of the old BPM key)', () => {
    assert.match(ANIM, /sk === 0 \? \(feedback > 0 \? 'GRAY CLICK · BLUE ECHOES' : 'GRAY CLICK · BLUE ECHO'\)/);
    assert.doesNotMatch(ANIM.slice(ANIM.indexOf('function EchoFlow'), ANIM.indexOf('const REV_WIN_MS')), /`CLICK · \$\{Math\.round\(60000 \/ periodMs\)\} BPM`/);
  });
  it('EXPLORE WHERE TO START watches first: no FDBK step needed, ▶ comes last', () => {
    const s = DG.explore.intro.start;
    assert.match(s, /^Watch ▸ OUT: each gray click comes back once, as a blue echo\./);
    assert.ok(s.indexOf('▶') > s.indexOf('Watch'));
  });
});

describe('DL-02 · one tempo: a 120 BPM click, TIME 250 ms, a caption in the click’s tempo', () => {
  const phrase = liftRun<(t: number) => string>('delayTempoPhrase', 'const DELAY_BPM = 120;');
  it('the source, the TIME default, the tray choices', () => {
    assert.match(CFG, /const DELAY_BPM = 120;/);
    assert.match(DELAY, /sources: \[srcClick\(DELAY_BPM\), SRC_PINK, srcSine\(220\)\]/);
    assert.match(DELAY, /initial: 250,/);
    assert.doesNotMatch(DELAY, /srcClick\(90\)|initial: 375,/);
  });
  it('the caption names the CLICK’s note values at 120 BPM, and keeps the law elsewhere', () => {
    // checker fix 2026-11-15: only the FIRST repeat sits halfway (repeat 2 lands on the next click at FDBK > 0).
    assert.match(phrase(250), /^250 ms = an eighth note at the CLICK’s 120 BPM: the first repeat lands halfway between two clicks\.$/);
    assert.doesNotMatch(phrase(250), /each repeat lands halfway/);
    assert.match(phrase(375), /a dotted eighth at the CLICK’s 120 BPM/);
    assert.match(phrase(500), /a quarter-note at 120 BPM, the CLICK’s tempo: each repeat lands on the next click\./);
    assert.match(phrase(300), /a quarter-note at 200 BPM — match the delay/);
    assert.doesNotMatch(phrase(375), /160 BPM/);
  });
  it('no CLICK 90 left in the Delay guide or lesson', () => {
    for (const g of Object.values(DG)) assert.doesNotMatch(text(g as G), /CLICK 90|90 BPM|160 BPM/);
    assert.doesNotMatch(lesson('delay', 'reverb'), /CLICK 90/);
    assert.match(lesson('delay', 'reverb'), /Set SOURCE to CLICK 120 and tap ▶\./);
  });
});

describe('DL-03 · Delay LEARN starts on the silent slapback, the formula last', () => {
  it('WHERE TO START', () => {
    const s = DG.learn.intro.start;
    assert.match(s, /^Start on EXPLORE, no sound needed: with FDBK at 0%, drag TIME all the way down to 80 ms/);
    assert.ok(s.indexOf('slapback') < s.indexOf('FORMULA / CONCEPT'));
    assert.match(s, /Leave FORMULA \/ CONCEPT for last\.$/);
  });
  it('TRY THIS follows the same order', () => {
    assert.match((DG.learn as unknown as { tryThis: string[] }).tryThis[0], /slapback/);
    assert.match((DG.learn as unknown as { tryThis: string[] }).tryThis[1], /^Last, read FORMULA \/ CONCEPT/);
  });
});

// ══ Reverb ══════════════════════════════════════════════════════════════════
describe('RV-04 · Reverb’s first pointer speaks of rooms, with the shared RT60 words', () => {
  it('the start', () => {
    const s = RG.explore.intro.start;
    // checker fix 2026-11-15: RT60 opens at 1.5 s (HALL), so the step goes down first, then up.
    assert.ok(s.startsWith(`Drag ${termWithShort('rt60')} down to a small room, then up toward a big hall, and watch the amber wash on OUT last longer.`), s);
    assert.match(REVERB, /paramId: P\.rt60[\s\S]*?initial: 1\.5,/);
    assert.doesNotMatch(s, /slope/);
    assert.match(read('src/screens/lab/reverbScreenGuides.ts'), /import \{ termWithShort \} from '\.\.\/\.\.\/features\/lab\/plainTerms\.ts';/);
  });
});

describe('RV-01 · readout and subtitle lead with DECAY TIME, RT60 beside them', () => {
  it('the words come from PLAIN_TERMS.rt60', () => {
    assert.equal(PLAIN_TERMS.rt60.short.toUpperCase(), 'DECAY TIME');
    assert.match(CFG, /import \{ PLAIN_TERMS \} from '\.\.\/\.\.\/features\/lab\/plainTerms';/);
    assert.match(CFG, /const REVERB_RT60_WORDS = PLAIN_TERMS\.rt60\.short\.toUpperCase\(\);/);
  });
  it('subtitle, tray label and readout', () => {
    assert.match(REVERB, /subtitle: `\$\{REVERB_RT60_WORDS\[0\]\}\$\{REVERB_RT60_WORDS\.slice\(1\)\.toLowerCase\(\)\} \(\$\{PLAIN_TERMS\.rt60\.term\}\) · Pre-delay · Damping`/);
    assert.doesNotMatch(REVERB, /subtitle: 'RT60 · Pre-delay · Damping'/);
    assert.match(REVERB, /label: `\$\{REVERB_RT60_WORDS\} \(\$\{PLAIN_TERMS\.rt60\.term\}\)`, short: 'RT60'/);
    assert.match(REVERB, /\{ k: `\$\{REVERB_RT60_WORDS\} \(\$\{PLAIN_TERMS\.rt60\.term\}\)`, kNarrow: REVERB_RT60_WORDS, paramId: P\.rt60 \}/);
    assert.doesNotMatch(REVERB, /\{ k: 'RT60'/);
  });
  it('FxLabScreen forwards kNarrow to the rack cell', () => {
    assert.match(SCREEN, /kNarrow\?: string;/);
    assert.equal((SCREEN.match(/\{ k: b\.k, kNarrow: b\.kNarrow, v: /g) ?? []).length, 2);
  });
});

describe('RV-03 · a GAP bracket marks pre-delay on the glass', () => {
  const rev = ANIM.slice(ANIM.indexOf('function ReverbFlow'), ANIM.indexOf('const SPEC_F0'));
  it('the bracket spans the click to the wash start (PRE-DELAY + 31 ms), labeled GAP, click source only', () => {
    assert.match(rev, /const x1 = outX0 \+ \(preG\.value \+ 31\) \/ msPerPx;/);
    assert.match(rev, /if \(sk !== 0\) return p;/);
    assert.match(rev, /text="GAP"/);
    assert.match(rev, /<Path path=\{gapPath\}/);
  });
  it('a line out for the line in: the key drops the click BPM', () => {
    assert.match(rev, /const note = sk === 0 \? 'CLICK · dB VIEW'/);
    assert.doesNotMatch(rev, /BPM · dB VIEW/);
  });
  it('the step and TRY THIS point at the GAP', () => {
    assert.match(lesson('reverb', 'chorus'), /the GAP bracket over OUT/);
    assert.match((RG.explore as unknown as { tryThis: string[] }).tryThis[1], /the GAP bracket over OUT stretches/);
  });
});

describe('SH-36 · Reverb’s PRE readout reads PRE-DLY, like its dock key', () => {
  it('bezel', () => {
    assert.match(REVERB, /\{ k: 'PRE-DLY', paramId: P\.preDelayMs/);
    assert.match(REVERB, /short: 'PRE-DLY', paramId: P\.preDelayMs/);
  });
});

// ══ Chorus ══════════════════════════════════════════════════════════════════
describe('CH-01 · the Chorus card promises what the lab draws (one late copy per side)', () => {
  it('no small choir', () => {
    assert.doesNotMatch(card('ChorusLab'), /small choir|seem like many/);
    assert.match(card('ChorusLab'), /two players who can never be perfectly together/);
  });
});

describe('CH-02 · the first chorus view moves within 2 s; DELAY says to try PINK NOISE', () => {
  it('RATE starts at 0.5 Hz (under the 0.87 Hz SLOWED cap)', () => {
    assert.match(CHORUS, /initial: 0\.5,\s*fader: \{\s*min: 0\.1, max: 3/);
    assert.ok(0.5 < 45 / (2 * Math.PI * 440 * 0.006 * 0.5 * 2 * Math.PI));
    assert.ok(1 / 0.5 <= 2, 'one wobble within 2 s');
  });
  it('each DELAY choice carries the PINK NOISE line', () => {
    assert.match(CHORUS, /choices: \[15, 20, 35\]\.map\(\(ms\) => \(\{\s*label: `\$\{ms\} ms`, value: ms,\s*blurb: 'How late the copy runs\. On SINE 440 Hz this barely changes the sound: switch SOURCE to PINK NOISE to hear it\.',/);
  });
});

describe('CH-03 · Chorus no longer leans on the flanger it has not met', () => {
  it('the notes drop the comparison', () => {
    assert.doesNotMatch(CHORUS.slice(CHORUS.indexOf('intro:'), CHORUS.indexOf('exploreCaption:')), /flanger/i);
  });
  it('the check names the flanger as the next lab, with how it sounds; options unchanged', () => {
    const c = checks('CHORUS', 'FLANGER');
    assert.match(c, /prompt: 'A flanger \(the next lab\) makes a sweeping, jet-like whoosh\. Compared with it, a chorus uses…',/);
    assert.match(c, /'A longer delay \(about 15–35 ms\), so you hear shimmer instead of a sweeping comb',/);
  });
});

// ══ Flanger ═════════════════════════════════════════════════════════════════
describe('FL-03 · one name: SWEEP on the readout and the dock key', () => {
  it('bezel', () => {
    assert.match(FLANGER, /\{ k: 'SWEEP', paramId: P\.rateHz, caption: 'sweep speed' \}/);
    assert.doesNotMatch(FLANGER, /\{ k: 'RATE'/);
    assert.match(FLANGER, /id: 'sweep', label: 'SWEEP', paramIds: \[P\.rateHz, P\.depth\]/);
  });
});

describe('FL-02 · Flanger LEARN: first paragraph + CENTER drag; three missing controls in ONE entry', () => {
  it('WHERE TO START', () => {
    const s = FG.learn.intro.start;
    assert.match(s, /^Read the first paragraph, what a flanger is\. Then on EXPLORE drag CENTER/);
    assert.match(s, /Leave FORMULA \/ CONCEPT for last\.$/);
  });
  it('the lesson folds LFO Waveform, Stereo width and Through-Zero into one line', () => {
    const l = lesson('flanger', 'phaser');
    assert.doesNotMatch(l, /key: "(lfo_wave|stereo_offset|tzf)"/);
    assert.equal((l.match(/key: "other_controls"/g) ?? []).length, 1);
  });
});

describe('FL-04 · the flanger’s dips are named on the picture', () => {
  it('OUT title, US spelling, phaser unchanged', () => {
    assert.match(ANIM, /text=\{mode === 'flanger' \? 'DIPS = CANCELED HERE' : 'SPECTRUM \(dB\)'\}/);
    assert.doesNotMatch(ANIM, /CANCELLED/);
  });
});

// ══ Phaser ══════════════════════════════════════════════════════════════════
describe('PS-02 · the Phaser notes say what a phaser is first, the flanger second', () => {
  it('intro', () => {
    const intro = PHASER.slice(PHASER.indexOf('intro:'), PHASER.indexOf('exploreCaption:'));
    assert.match(intro, /'A phaser makes a few UNEVEN dips in the sound and sweeps them up and down\./);
    assert.ok(intro.indexOf('dips') < intro.indexOf('flanger'));
    assert.doesNotMatch(intro, /that difference is the whole lesson/);
  });
});

describe('PS-03 · every counting step holds the dips still first', () => {
  it('LEARN WHERE TO START sets STATIC before the count', () => {
    const s = PG.learn.intro.start;
    assert.ok(s.indexOf('STATIC') > 0 && s.indexOf('STATIC') < s.indexOf('count them'), s);
  });
  it('each "count the dips" line names STATIC (guides, config, check)', () => {
    const lines = [
      ...Object.values(PG).flatMap((g) => text(g as G).split('\n')),
      ...PHASER.split('\n'),
      ...checks('PHASER', 'COMPRESSION').split('\n'),
      // Counting on OUT (the moving analyzer); a count "in the curve" reads the still DESIGNED RESPONSE.
    ].filter((l) => /count (the dips|them)/.test(l));
    assert.ok(lines.length >= 6, String(lines.length));
    for (const l of lines) assert.match(l, /STATIC/, l);
  });
});

describe('PS-01 · the Phaser card is two sentences', () => {
  it('card', () => {
    assert.equal(card('PhaserLab'), 'A phaser makes a few dips in the sound and sweeps them up and down, a swirling whoosh. More STAGES means more dips.');
  });
});

// ══ Distortion ══════════════════════════════════════════════════════════════
describe('DS-03 · plain choices and key: HARD (FLAT TOPS), SOFT (ROUNDED), TUBE (LOPSIDED), OVERSAMPLING', () => {
  it('the config', () => {
    for (const l of ['HARD (FLAT TOPS)', 'SOFT (ROUNDED)', 'TUBE (LOPSIDED)']) assert.ok(DIST.includes(`label: '${l}'`), l);
    assert.match(DIST, /label: 'OVERSAMPLING', paramId: P\.oversample/);
    assert.doesNotMatch(DIST, /TANH|ASYM|short: 'OS'|\bOS ON\b|\bOS OFF\b/);
  });
  it('the guide, lesson and check use the same words', () => {
    const all = [Object.values(XG).map((g) => text(g as G)).join('\n'), lesson('distortion', 'noise'), checks('DISTORTION', 'PHASE')].join('\n');
    assert.doesNotMatch(all, /TANH|\(ASYM\)|HARD CLIP|\bOS \(|name: "OS"/);
  });
});

describe('DS-05 · the oversampling reply says the picture stays, the sound changes', () => {
  it('why', () => {
    const c = checks('DISTORTION', 'PHASE');
    assert.match(c, /'Nothing — oversampling only changes how smoothly the display is drawn': 'The picture stays the same with OVERSAMPLING, but the sound changes, so this step needs your ears: play SINE 5 kHz at high DRIVE and compare ON with OFF\.'/);
    assert.doesNotMatch(c, /Switch it at a high DRIVE and compare OUT/);
  });
  it('EXPLORE WHERE TO START is silent first (SH-11)', () => {
    assert.match(XG.explore.intro.start, /^Drag DRIVE from \+12 dB to \+36 dB on HARD \(FLAT TOPS\)/);
  });
});

describe('DS-04 · the Distortion card stops at what the lab shows', () => {
  it('card', () => {
    assert.doesNotMatch(card('DistortionLab'), /intermodulation|harmonic and/);
    assert.match(card('DistortionLab'), /Push a sound harder than the equipment can carry and its shape gets squashed; that adds new tones\.$/);
  });
});

// ══ Phase ═══════════════════════════════════════════════════════════════════
describe('PH-01 · the Phase keys and stage label read in words', () => {
  it('dock keys, readouts, stage pill, Ø explained once', () => {
    assert.deepEqual([...PHASE.matchAll(/^\s{6}label: '([^']+)', short: '([^']+)', paramId:/gm)].map((m) => m[2]), ['DELAY R', 'FLIP R', 'LISTEN']);
    assert.deepEqual([...PHASE.matchAll(/\{ k: '([A-Z ]+)', paramId:/g)].map((m) => m[1]), ['FLIP R', 'DELAY R', 'LISTEN']);
    assert.match(ANIM, /case 'stereo': return model\.flavor === 'phase' \? 'FLIP · DELAY' : 'M\/S WIDTH';/);
    assert.match(PHASE, /\{ label: 'FLIPPED Ø', value: 1, blurb: 'Ø means flipped upside down:/);
  });
  it('no codes left in the Phase guide, config, lesson or check', () => {
    const all = [Object.values(HG).map((g) => text(g as G)).join('\n'), PHASE, lesson('phase', 'harmonic'), checks('PHASE', 'OSCILLATOR')].join('\n');
    // The tray title keeps the trade word in brackets: LISTEN (MONO-FOLD), as FLIP R (POLARITY).
    assert.doesNotMatch(all, /DLY R|\bPOL\b|(?<!MONO-)\bFOLD\b|INVERTED Ø|R: Ø/);
  });
});

describe('PH-03 · Phase LEARN starts with the flip-and-mono step, the formula last', () => {
  it('WHERE TO START', () => {
    const s = HG.learn.intro.start;
    assert.match(s, /^Start on EXPLORE: set FLIP R to FLIPPED Ø, then LISTEN to MONO \(L\+R\), and watch OUT go flat\./);
    assert.match(s, /The formula under FORMULA \/ CONCEPT comes last\.$/);
    assert.doesNotMatch(s, /φ\(f\)/);
  });
});

describe('PH-05 · the flat line is named on the picture; the first step is silent', () => {
  it('EXPLORE WHERE TO START', () => {
    const s = HG.explore.intro.start;
    assert.match(s, /^Set FLIP R to FLIPPED Ø, then LISTEN to MONO \(L\+R\): OUT goes flat, silence, as the two sides erase each other\./);
    assert.ok(s.indexOf('▶') > s.indexOf('drag DELAY R'));
  });
  it('the glass says SILENCE only at the exact cancel, where the L / R key steps aside', () => {
    assert.match(ANIM, /const cancelled = flavor === 'phase' && invertR && monoFold && delayRms === 0;/);
    assert.match(ANIM, /text="SILENCE: THE TWO SIDES ERASED EACH OTHER"/);
    assert.match(ANIM, /legend=\{cancelled \? undefined : \[/);
  });
});

describe('PH-06 · DELAY R − / + step exactly 0.1 ms', () => {
  it('the fader declares 100 steps and FxLabScreen forwards them', () => {
    assert.match(PHASE, /fader: \{ min: 0, max: 10, snap: \(v\) => Math\.round\(v \* 10\) \/ 10, format: \(v\) => `\$\{v\} ms`, home: 0, steps: 100 \}/);
    assert.match(SCREEN, /steps\?: number;/);
    assert.match(SCREEN, /home: s\.home != null \? faderPos\(s, s\.home\) : undefined,\s*steps: s\.steps,/);
  });
  it('11 taps from 0 ms land on 1.1 ms, 23 on 2.3 ms', () => {
    const snap = (v: number) => Math.round(v * 10) / 10;
    const tap = (n: number) => {
      let pos = 0;
      for (let i = 0; i < n; i++) pos = laneStepValue(snap(pos * 10) / 10, 1, undefined, 100);
      return snap(pos * 10);
    };
    assert.equal(tap(11), 1.1);
    assert.equal(tap(23), 2.3);
  });
});

describe('PH-04 · the Phase card opens on what the learner sees', () => {
  it('card', () => {
    assert.match(card('PhaseLab'), /^Two copies of a sound can help each other or erase each other\./);
    assert.doesNotMatch(card('PhaseLab'), /comb filtering|speaker alignment/);
  });
});

describe('PH-02 · the note above the scope says what its line means', () => {
  it('curveNote', () => {
    const n = PHASE.match(/^ {2}curveNote: '([^']+)',/m)?.[1] ?? '';
    assert.match(n, /L against R, upright = same, flat = opposite/);
    assert.match(n, /not measured/);
    assert.ok(n.length <= 100, String(n.length));
  });
});

// ══ Sweeps ══════════════════════════════════════════════════════════════════
describe('SH-64 · a control the setting ignores grays with its reason', () => {
  it('Delay: REPEAT DAMPING at FDBK 0%; Phaser: RATE at STATIC', () => {
    assert.match(DELAY, /ignoredBy: \(paramId, v\) =>\s*paramId === P\.dampHz && v\[P\.delayFeedback\] <= 0 \? 'needs FDBK above 0%: one repeat is not filtered' : undefined,/);
    assert.match(PHASER, /ignoredBy: \(paramId, v\) => \(paramId === P\.rateHz && v\[P\.depth\] <= 0 \? 'nothing moves at STATIC' : undefined\),/);
  });
  it('a group tray grays the ignored section and shows the reason in the hint’s place', () => {
    assert.match(SCREEN, /const why = ignored\(pid\);/);
    assert.match(SCREEN, /\{why \? <Text style=\{styles\.sectionHint\}> · \{why\}<\/Text> : gp\.hint \?/);
    assert.match(SCREEN, /style=\{\[styles\.chipRow, why \? styles\.chipRowIgnored : null\]\}/);
  });
});

describe('SH-76 · conceptual tray choices carry a one-line meaning', () => {
  it('Reverb DAMP, Chorus DEPTH, Flanger MIX, Phase LISTEN MONO', () => {
    for (const l of ['DARK 2k', 'NATURAL 5.5k', 'BRIGHT 12k']) assert.match(REVERB, new RegExp(`label: '${l.replace('.', '\\.')}', value: \\d+, blurb: '`), l);
    for (const l of ['SUBTLE', 'CLASSIC', 'DEEP']) assert.match(CHORUS, new RegExp(`label: '${l}', value: [\\d.]+, blurb: '`), l);
    for (const l of ['50% EVEN', '100%']) assert.match(FLANGER, new RegExp(`label: '${l}', value: [\\d.]+, blurb: '`), l);
    assert.match(PHASE, /label: 'MONO \(L\+R\)', value: 1, blurb: '/);
  });
});

describe('SH-75-F · the CHECK guides no longer repeat the card’s “no score”', () => {
  for (const [lab, g] of Object.entries(GUIDES)) {
    it(lab, () => assert.doesNotMatch(text(g.check), /no score/i));
  }
});

describe('SH-11 · every WHERE TO START in these labs opens on a step that needs no sound', () => {
  for (const [lab, g] of Object.entries(GUIDES)) {
    for (const tab of ['explore', 'learn'] as const) {
      it(`${lab} ${tab}`, () => {
        const s = g[tab].intro.start;
        assert.doesNotMatch(s, /^(Tap ▶|Play|Set SOURCE|Put on headphones|Listen)/, s);
        assert.ok(s.trim().split(/\s+/).length <= 40, `${lab} ${tab}: over 40 words`);
      });
    }
  }
});

// ══ Checker fixes (CHECK_F7b_REPORT.md, 2026-11-15) ═════════════════════════
describe('checker fixes · words that stay true at the new defaults', () => {
  it('Delay PING-PONG steps raise FDBK first (one repeat at the FDBK 0% default cannot alternate)', () => {
    assert.match((DG.explore as unknown as { tryThis: string[] }).tryThis[2], /^Set FDBK to 50%, open COLOR and turn PING-PONG on/);
    assert.match(lesson('delay', 'reverb'), /\{ do: "Set FDBK to 50%, then open COLOR and turn PING-PONG on\."/);
  });
  it('the Phaser in-notes wrong-answer hint sets STATIC before the count', () => {
    assert.match(PHASER, /wrongHint: 'Set the sweep to STATIC, then tap through STAGES and count the dips in the curve\.'/);
  });
  it('the Reverb RT60 reason is true whether the readout shows DECAY TIME (RT60) or DECAY TIME', () => {
    const c = checks('REVERB', 'CHORUS');
    assert.match(c, /'The room is 60 meters long': 'The 60 in RT60 is not a length\. On EXPLORE, the RT60 readout is named DECAY TIME\.'/);
    assert.doesNotMatch(c, /full name: DECAY TIME \(RT60\)/);
  });
});
