/**
 * Beginner waves 1-3, group F8b (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan).
 * Labs: Tuning & Temperament, Drum Tuning, Cymatics, Harmonograph, Speech & Voice, Ear Training,
 * Bass Guitar Physics. Every test here would have failed before its change. [MD:D62]
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { HOME_HERO_NOTE, HOME_PATH, HOME_PATH_HEAD, HOME_STUDIOS, STUDIOS_HEADING, STUDIO_RELATION } from '../src/screens/lab/cymatics/homePath.ts';
import { EAR_HUB_GROUPS, EAR_HUB_OPENING, EAR_START_ID, modulesInGroup } from '../src/screens/lab/eartraining/earHubGroups.ts';
import { PLAIN_TERMS } from '../src/features/lab/plainTerms.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const LAB = 'src/screens/lab';
/** Source without comments, so a test never passes on a comment. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('Cymatics home (CY-01, CY-02, CY-04)', () => {
  const home = code(`${LAB}/cymatics/CymaticsHomeScreen.tsx`);
  it('CY-04: a plain one-line note under the plate, no caps badge; the question and three numbered steps', () => {
    assert.doesNotMatch(home, /SIMULATION · 240 mm ALUMINUM/);
    assert.ok(HOME_HERO_NOTE.length <= 90 && !/^[A-Z ·]+$/.test(HOME_HERO_NOTE));
    assert.equal(HOME_PATH_HEAD, 'Does a note have a shape? Let’s test it.');
    assert.deepEqual(HOME_PATH.map((s) => s.label), ['Watch sand find the still lines', 'Change one thing', 'Run the experiments']);
    assert.match(home, /HOME_PATH\.map\(\(step, i\) =>/);
  });
  it('CY-01: each step opens its own place; step 3 starts the series (experiment 1)', () => {
    assert.deepEqual(HOME_PATH.map((s) => s.open), [{ module: 'intro' }, { module: 'change' }, { series: true }]);
    assert.match(home, /const startSeries = \(\) => \{\s*const r = experimentRoute\(EXPERIMENTS\[0\]\);\s*go\(r\.route, r\.params\);/);
  });
  it('CY-01: the START HERE row and the paragraph hook are gone; the studios come AFTER the modules', () => {
    assert.doesNotMatch(home, /NEW HERE\? START HERE/);
    assert.doesNotMatch(home, /Does 440 Hz have a shape\? Play a tone/);
    const modules = home.indexOf('CYMATICS_MODULES.map(');
    const studios = home.indexOf('HOME_STUDIOS.map(');
    assert.ok(modules > 0 && studios > modules, 'studios render below the modules');
    assert.match(home, /\{STUDIOS_HEADING\}/);
    assert.equal(STUDIOS_HEADING, 'STUDIOS, FREE PLAY');
  });
  it('CY-02: every studio says how it relates to the modules, on the home and in its own intro', () => {
    for (const s of HOME_STUDIOS.filter((x) => x.route !== 'CymaticsGallery')) assert.match(s.sub, /module/, s.route);
    assert.match(HOME_STUDIOS[3].sub, /any studio/);
    assert.equal(HOME_STUDIOS.length, 4);
    for (const [f, k] of [['PlateStudioScreen', 'plate'], ['LiquidStudioScreen', 'liquid'], ['MembraneStudioScreen', 'membrane']] as const) {
      assert.match(code(`${LAB}/cymatics/${f}.tsx`), new RegExp(`intro=\\{\`\\$\\{STUDIO_RELATION\\.${k}\\} `), f);
      assert.match(STUDIO_RELATION[k], /^Free play with .* module/);
    }
  });
});

describe('Cymatics values in words (CY-03)', () => {
  it('Harmony INTERVAL says fifth / fourth / maj 3rd / min 3rd, not P5 / P4 / M3 / m3', () => {
    const h = code(`${LAB}/cymatics/modules/modHarmony.tsx`);
    assert.doesNotMatch(h, /short: '(P5|P4|M3|m3)'/);
    assert.match(h, /interval: 'perfect fifth', short: 'fifth'/);
  });
  it('no S+H key; the Liquid key is ENOUGH (not a/a꜀) and reads its value aloud', () => {
    for (const f of ['modules/modChange.tsx', 'PlateStudioScreen.tsx']) assert.doesNotMatch(code(`${LAB}/cymatics/${f}`), /short: 'S\+H'/, f);
    const l = code(`${LAB}/cymatics/LiquidStudioScreen.tsx`);
    assert.doesNotMatch(l, /k: 'a\/a꜀'/);
    assert.match(l, /k: 'ENOUGH', v: ratioLabel, vA11y:/);
  });
  it('no Ritz or Bessel in any on-screen model note', () => {
    for (const f of ['modules/modNodes.tsx', 'PlateStudioScreen.tsx', 'MembraneStudioScreen.tsx', 'LiquidStudioScreen.tsx']) {
      const s = code(`${LAB}/cymatics/${f}`);
      const notes = [...s.matchAll(/modelNote(?:: |\s*=\s*)([\s\S]*?);?\n\s*(?:\/\/|[a-zA-Z]+:|const|\/\*|\})/g)].map((m) => m[1]).join(' ');
      assert.doesNotMatch(notes, /Ritz|Bessel/, f);
    }
    assert.match(code(`${LAB}/cymatics/PlateStudioScreen.tsx`), /badge,\s*(?:soundOffLine: '[^']*',\s*)?modelNote,/);
    assert.match(code(`${LAB}/cymatics/LiquidStudioScreen.tsx`), /badge,\s*(?:soundOffLine: '[^']*',\s*)?modelNote,/);
  });
  it('SH-36: the Plate studio names its views as Change One Thing does (Sand, Sand + heat)', () => {
    const p = code(`${LAB}/cymatics/PlateStudioScreen.tsx`);
    assert.match(p, /\{ id: 'particles', label: 'Sand',/);
    assert.match(p, /\{ id: 'overlay', label: 'Sand \+ heat',/);
  });
  it('SH-76: every Change One Thing VIEW choice carries a one-line meaning', () => {
    const c = code(`${LAB}/cymatics/modules/modChange.tsx`);
    assert.equal((c.match(/short: '[^']+', blurb: '[^']+' \}/g) ?? []).length, 4);
    assert.match(c, /options: VIEWS\.map\(\(v\) => \(\{ id: v\.id, label: v\.label, blurb: v\.blurb \}\)\)/);
  });
});

describe('SH-37: no "update the app" line for a learner in my labs', () => {
  const files = ['cymatics/CymaticsHomeScreen.tsx', 'cymatics/LiquidStudioScreen.tsx', 'cymatics/MembraneStudioScreen.tsx', 'cymatics/PlateStudioScreen.tsx', 'cymatics/modules/modChange.tsx', 'cymatics/modules/modHarmonics.tsx', 'cymatics/modules/modHarmony.tsx', 'cymatics/modules/modNodes.tsx', 'HarmonographLabScreen.tsx', 'BassLabScreen.tsx'];
  for (const f of files) it(f, () => assert.doesNotMatch(code(`${LAB}/${f}`), /update the app/i, f));
});

describe('Harmonograph (HG-03, HG-04, SH-35, SH-64)', () => {
  const s = code(`${LAB}/HarmonographLabScreen.tsx`);
  it('HG-03: SHAPE reads words, not 90°·M·R; the spoken label names all three', () => {
    assert.doesNotMatch(s, /\$\{damping\.label\[0\]\}/);
    assert.match(s, /valueLabel: shapeKeyValue\(phase, dampKey, rotary\)/);
    assert.match(s, /valueA11y: `phase \$\{phase\} degrees, \$\{damping\.label\.toLowerCase\(\)\} damping, \$\{rotary \? 'rotary' : 'lateral'\}`/);
    // The rule, mirrored: the phase, then only what differs from MEDIUM / ROTARY.
    const fn = /export function shapeKeyValue[\s\S]*?\n\}/.exec(s)?.[0] ?? '';
    assert.match(fn, /dampKey === 'medium' \? null : dampKey, rotary \? null : 'lateral'\]\.filter\(Boolean\)\.join\(' · '\)/);
  });
  it('HG-04: the intro opens on what the machine does', () => {
    const g = read(`${LAB}/harmonographScreenGuides.ts`);
    assert.match(g, /learning: 'This old machine draws music\. Two swinging arms move the pen\. When their speeds make a musical interval, the drawing closes into a neat shape\.'/);
    assert.match(g, /start: 'Tap TUNE, then 2:1 OCTAVE, and watch\./);
    assert.doesNotMatch(g, /learning: 'Musical intervals are frequency ratios\./);
  });
  it('SH-35 / SH-64: PLAT keeps its slot in LATERAL, dimmed with a reason', () => {
    assert.doesNotMatch(s, /\.\.\.\(rotary\s*\?\s*\[\s*\{\s*kind: 'fader' as const,\s*id: 'plat'/);
    assert.match(s, /id: 'plat',\s*locked: rotary \? undefined : 'LATERAL keeps the paper still\./);
  });
});

describe('Speech & Voice (VOX-05, VOX-02)', () => {
  it('VOX-05: module 1 opens with the throat test; module 3 calls back to it', () => {
    const a = code(`${LAB}/speech/speechPagesA.tsx`);
    assert.match(a, /<Lead>Put a finger on your throat and say "sss", then "zzz"\. Feel the buzz\? That buzz is your voice\. This lab follows it from your lungs to the microphone\./);
    assert.doesNotMatch(a, /Speech is air, a buzz, a set of resonating cavities/);
    assert.match(a, /<Lead>Say "sss", then "zzz" again, with a finger on your throat\./);
  });
  it('VOX-02: the Distance Effect shows the ONE shared dB sentence by the bars', () => {
    const b = code(`${LAB}/speech/speechPagesB.tsx`);
    assert.match(b, /\{PLAIN_TERMS\.db\.term\}: \{PLAIN_TERMS\.db\.sentence\}/);
    assert.match(PLAIN_TERMS.db.sentence, /\+6 dB is about twice the signal/);
    assert.doesNotMatch(b, /inverse-square for the voice, a much steeper fall/);
  });
});

describe('Ear Training hub (ET-02, ET-03, ET-04)', () => {
  const hub = code(`${LAB}/eartraining/EarTrainingLabScreen.tsx`);
  const families = ['tone', 'tone', 'tone', 'tone', 'defect', 'space', 'dynamics', 'time', 'time', 'dynamics', 'pitch', 'time', 'time', 'dynamics'] as const;
  const ids = ['frequency', 'eq', 'band', 'noise', 'defect', 'stereo', 'loudness', 'delay', 'reverb', 'compression', 'pitch', 'polarity', 'comb', 'clipping'];
  const mods = ids.map((id, i) => ({ id, family: families[i] }));
  it('the families mirror the registry', () => {
    const reg = read('src/features/ear/modules/registry.ts');
    const got = [...reg.matchAll(/\{ \.\.\.M\d+_[A-Z]+, family: '([a-z]+)'/g)].map((m) => m[1]);
    assert.deepEqual(got, [...families]);
  });
  it('ET-02: four labeled groups hold every module exactly once; Comb comes after Delay and Polarity', () => {
    assert.deepEqual(EAR_HUB_GROUPS.map((g) => g.title), ['TONE', 'LEVEL AND DYNAMICS', 'TIME AND SPACE', 'FAULTS AND PITCH']);
    const placed = EAR_HUB_GROUPS.flatMap((g) => modulesInGroup(mods, g.families).map((m) => m.id));
    assert.deepEqual([...placed].sort(), [...ids].sort());
    assert.equal(new Set(placed).size, 14);
    const time = modulesInGroup(mods, EAR_HUB_GROUPS[2].families).map((m) => m.id);
    assert.ok(time.indexOf('comb') > time.indexOf('delay') && time.indexOf('comb') > time.indexOf('polarity'));
    assert.match(read('src/features/ear/modules/time.ts'), /Builds on Delay and Polarity & Phase\./);
  });
  it('ET-02: no single MODULES heading; START HERE on module 1 until tried; every row still opens', () => {
    assert.doesNotMatch(hub, />MODULES</);
    assert.match(hub, /EAR_HUB_GROUPS\.map\(\(g\) =>/);
    assert.match(hub, /m\.id === EAR_START_ID && !stat/);
    assert.equal(EAR_START_ID, 'frequency');
    assert.match(hub, /onOpen=\{\(\) => navigation\.navigate\('EarModule', \{ id: m\.id \}\)\}/);
  });
  it('ET-04: the hub opens on the plain picture, not the analyzer paragraph', () => {
    assert.match(hub, /<Text style=\{styles\.body\}>\{EAR_HUB_OPENING\}<\/Text>/);
    assert.doesNotMatch(hub, /the level adapts on your last twenty answers/);
    assert.match(EAR_HUB_OPENING, /^Ear training is like learning to name colors, but for sound\. Start with Frequency Recognition\./);
  });
  it('ET-03: the named jargon is gone from level names and playback notes; trial counts untouched', () => {
    const tone = code('src/features/ear/modules/tone.ts');
    const time = code('src/features/ear/modules/time.ts');
    const dyn = code('src/features/ear/modules/dynamics.ts');
    assert.doesNotMatch(tone, /'±12 dB, 4 coarse bands'/);
    assert.doesNotMatch(time, /Copy at 0 dB — deep combs|'Dry vs wet',|Temporal, not spectral|'−9 dB, ABX'/);
    assert.match(time, /'Dry vs wet \(no reverb vs reverb\)'/);
    assert.match(time, /any speaker or headphones work/);
    assert.doesNotMatch(dyn, /any transducer|'ABX on mild'/);
    assert.match(dyn, /Level differences come through on any speaker or headphones\./);
    // Level counts unchanged.
    assert.match(tone, /title: 'Band Identification'[\s\S]*?levels: 4,/);
    assert.match(time, /title: 'Comb Filtering'[\s\S]*?levels: 4,/);
    assert.match(time, /title: 'Reverb Recognition'[\s\S]*?levels: 5,/);
  });
});

describe('Bass Guitar Physics (BA-02, BA-04, SH-11)', () => {
  const g = read(`${LAB}/bassScreenGuides.ts`);
  it('BA-02: LEARN starts on GUIDED STEPS 1 to 3, the formula later', () => {
    assert.match(g, /start: 'Read GUIDED STEPS 1 to 3, then switch to EXPLORE/);
    assert.doesNotMatch(g, /Read COMMON MISTAKES first, then FORMULA \/ CONCEPT/);
  });
  it('BA-04: the plain why opens FRETTED, and a ring marks fret 12 until it is first reached', () => {
    assert.match(g, /learning: 'Press a string and less of it can swing, so the note goes up\./);
    const s = code(`${LAB}/BassLabScreen.tsx`);
    assert.match(s, /if \(fret === 12\) setReached12\(true\);/);
    assert.match(s, /target=\{mode === 'fretted' && !reached12 \? 12 : null\}/);
    assert.match(s, /target != null && target !== fret \? \(\s*<Circle cx=\{fretPos\(target\) \* w\}/);
  });
  it('SH-11: NATURAL HARMONICS starts on a step seen without sound', () => {
    assert.match(g, /start: 'Pick STRING E\. Step NODE through/);
  });
});

describe('Tuning & Temperament (TU-01, TU-03, TU-05)', () => {
  const idx = read(`${LAB}/tuning/chapters/index.ts`);
  it('TU-03: one task list; the chapter shows "To finish:" until its task is done', () => {
    assert.match(idx, /export const chapterFinishLine = \(index: number\): string \| undefined =>\s*CHAPTER_TASK\[index\] \? `To finish: \$\{CHAPTER_TASK\[index\]\}` : undefined;/);
    const shell = code(`${LAB}/tuning/TuningLabScreen.tsx`);
    assert.match(shell, /finish: isDone \? undefined : chapterFinishLine\(def\.index\)/);
    const rack = code(`${LAB}/tuning/rackLayout.tsx`);
    assert.match(rack, /\{finish \? <Text style=\{styles\.objectiveFinish\}>\{finish\}<\/Text> : null\}/);
    // A line in, a line out: the IN THIS CHAPTER kicker is gone from both objective blocks.
    assert.doesNotMatch(rack + shell, />IN THIS CHAPTER</);
  });
  it('TU-05: CONTENTS marks the meantone chapter as deeper, never optional; credit unchanged', () => {
    assert.match(idx, /DEEPER_CHAPTERS: ReadonlySet<number> = new Set\(\[9\]\)/);
    assert.doesNotMatch(idx, /DEEPER_MARK = '[^']*optional/);
    assert.match(idx, /9: 'narrow the fifth until four of them make a pure third\.'/);
    const m = code(`${LAB}/tuning/chapters/ch9Meantone.tsx`);
    assert.match(m, /<Lead>\{MEANTONE_PLAIN\}<\/Lead>/);
    const plain = /MEANTONE_PLAIN =\s*'([^']+)'/.exec(read(`${LAB}/tuning/chapters/ch9Meantone.tsx`))?.[1] ?? '';
    assert.equal(plain.split(/(?<=[.:;])\s+(?=[A-Z])/).length >= 3, true);
    assert.doesNotMatch(plain, /[√⁴^]/);
  });
  it('TU-01: in BASIC the meantone keys and the derivations use words; MATH keeps the algebra', () => {
    const m = code(`${LAB}/tuning/chapters/ch9Meantone.tsx`);
    assert.match(m, /part === 'A' && !ctx\.mathView \? \[/);
    assert.match(m, /k: ctx\.mathView \? 'g = ⁴√5' : 'FIFTH'/);
    assert.match(m, /k: ctx\.mathView \? 'g⁴\/4' : 'THIRD'/);
    assert.equal((m.match(/\{ctx\.mathView \? <EquationStage/g) ?? []).length, 2);
    assert.match(code(`${LAB}/tuning/chapters/ch6Comma.tsx`), /\{ctx\.mathView \? <EquationStage\s+title="THE DERIVATION"/);
    assert.match(code(`${LAB}/tuning/chapters/ch10Equal.tsx`), /\{ctx\.mathView \? <EquationStage\s+title="TWELVE IDENTICAL STEPS"/);
    assert.match(code(`${LAB}/tuning/chapters/ch7Just.tsx`), /\{ctx\.mathView \? <EquationStage/);
    assert.match(code(`${LAB}/tuning/chapters/ch4Harmonics.tsx`), /label: thirdName\(k, ctx\.mathView\)/);
    assert.match(code(`${LAB}/tuning/chapters/ch8Compare.tsx`), /k: ctx\.mathView \? '81\/80' : 'COMMA'/);
    const t = code(`${LAB}/tuning/chapters/ch12Tradeoffs.tsx`);
    assert.match(t, /\{ctx\.mathView \? TUNING_SYSTEMS\[id\]\.rule : BASIC_RULE\[id\]\}/);
    const basic = /const BASIC_RULE[\s\S]*?\};/.exec(t)?.[0] ?? '';
    assert.doesNotMatch(basic, /[√⁴^]|\d\/\d/);
  });
  it('TU-01: the wrong-answer line on the comma check no longer points at a box BASIC hides', () => {
    assert.doesNotMatch(read(`${LAB}/tuning/chapters/ch6Comma.tsx`), /The derivation above used whole numbers only/);
  });
});

describe('SH-12: a sound-off line in the rack labs that had none', () => {
  it('Tuning (every task silent: the shared line), Drum Tuning and Cymatics (their own words)', () => {
    assert.match(code(`${LAB}/tuning/rackLayout.tsx`), /soundOffLine: true,/);
    assert.match(code(`${LAB}/drumtuning/DrumRack.tsx`), /soundOffLine: DRUM_SOUND_OFF_LINE,/);
    assert.match(code(`${LAB}/cymatics/modules/rackLayout.tsx`), /soundOffLine: CYMATICS_SOUND_OFF_LINE,/);
    for (const f of ['PlateStudioScreen', 'LiquidStudioScreen', 'MembraneStudioScreen']) {
      assert.match(code(`${LAB}/cymatics/${f}.tsx`), /soundOffLine: 'Sound off\? Turn on Silent drive in (DRIVE|STRIKE): /, f);
    }
  });
});

describe('SH-11: Drum Tuning starts that began with ▶ STRIKE now start on a readout', () => {
  const d = read(`${LAB}/drumtuning/drumScreenGuides.ts`);
  for (const s of ['Read PITCH 233 Hz and 1ST OVERTONE 371 Hz', 'At STRIKE 80 % read BEND +35 ¢', 'On ROD 1, set TURN to +⅛ turn and read SPREAD and BEAT']) {
    it(s, () => assert.ok(d.includes(`start: '${s}`)));
  }
});

describe('SH-75-F: the CHECK guides no longer repeat the card’s no-score sentence', () => {
  for (const f of ['bassScreenGuides.ts', 'cymatics/cymaticsScreenGuides.ts', 'harmonographScreenGuides.ts', 'speech/speechScreenGuides.ts']) {
    it(f, () => {
      const s = read(`${LAB}/${f}`);
      assert.doesNotMatch(s, /Nothing is lost and there is no score\./);
      assert.doesNotMatch(s, /there is no score\.'/);
    });
  }
});

describe('TU-04: a not-yet key in Just Intonation reads its own words, never LOCKED (rack lockedValue, SN-1)', () => {
  const j = code(`${LAB}/tuning/chapters/ch7Just.tsx`);
  it('lockedKey passes lockedValue through', () => {
    assert.match(j, /function lockedKey\(id: string, label: string, reason: string, lockedValue: string\): DockParam \{\s*return \{ kind: 'fader', id, label, locked: reason, lockedValue,/);
  });
  it('PLAY reads "after 2 notes"; TONIC and RETUNE read "after all 8"', () => {
    assert.match(j, /lockedKey\('play', 'PLAY', '[^']+', 'after 2 notes'\)/);
    assert.match(j, /lockedKey\('tonic', 'TONIC', `[^`]+`, `after all \$\{N\}`\)/);
    assert.match(j, /lockedKey\('retune', 'RETUNE', `[^`]+`, `after all \$\{N\}`\)/);
  });
  it('the frame shows lockedValue in place of LOCKED and says "not yet"', () => {
    const r = code(`${LAB}/rack/RackUnit.tsx`);
    assert.match(r, /value=\{p\.lockedValue \?\? 'LOCKED'\}/);
    assert.match(r, /\{lp\.lockedValue \? 'not yet' : 'locked'\}/);
  });
  it('Harmonograph PLAT stays on its reason: LATERAL is a choice, not a "not yet"', () => {
    assert.doesNotMatch(code(`${LAB}/HarmonographLabScreen.tsx`), /id: 'plat',[\s\S]{0,200}lockedValue/);
  });
});
