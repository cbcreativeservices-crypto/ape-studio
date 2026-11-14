/**
 * Lab fix round 1 (2026-11-14), group F8 — phase 1.
 * Owner approval: "Begin fixing all bugs found and do obvious (my decision is
 * not required) fixes as you suggestted in the report."
 *
 * Every test here fails on the code as it was before the fix
 * (docs/labs/novice_audit_2026_11_14/fixes/F8_REPORT.md lists each item).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const LAB = 'src/screens/lab';

const HM = await import('../src/screens/lab/harmonicModel.ts');
const DC = await import('../src/screens/lab/drumtuning/drumContent.ts');
const EAR = await import('../src/screens/lab/eartraining/earLabEnd.ts');
const { OSCILLATOR_SCREEN_GUIDES } = await import('../src/screens/lab/oscillatorScreenGuides.ts');
const { NOISE_SCREEN_GUIDES } = await import('../src/screens/lab/noiseScreenGuides.ts');
const { HARMONIC_SCREEN_GUIDES } = await import('../src/screens/lab/harmonicScreenGuides.ts');
const { BASS_SCREEN_GUIDES } = await import('../src/screens/lab/bassScreenGuides.ts');
const { MODULAR_SCREEN_GUIDES } = await import('../src/screens/lab/modular/modularScreenGuides.ts');
const { TUNING_SCREEN_GUIDES } = await import('../src/screens/lab/tuning/tuningScreenGuides.ts');
const { DRUM_SCREEN_GUIDES } = await import('../src/screens/lab/drumtuning/drumScreenGuides.ts');
const { SPEECH_SCREEN_GUIDES } = await import('../src/screens/lab/speech/speechScreenGuides.ts');
const { CYMATICS_END_GUIDE, CYMATICS_GALLERY_GUIDES } = await import('../src/screens/lab/cymatics/cymaticsScreenGuides.ts');

describe('Bass · the drag bubble never doubles its label', () => {
  it('the FRET fader value carries no "FRET" word (the frame prints the label beside it)', () => {
    const s = read(`${LAB}/BassLabScreen.tsx`);
    assert.doesNotMatch(s, /format: \(\) => \(fret === 0 \? 'OPEN' : `FRET /);
    assert.match(s, /format: \(\) => \(fret === 0 \? 'OPEN' : `\$\{fret\} of \$\{NUM_FRETS\}`\)/);
    // the frame really prints label + value in the drag tag
    assert.match(read(`${LAB}/rack/RackUnit.tsx`), /\{bound\.label\}  \{bound\.format\(bound\.value\)\}/);
  });
});

describe('Harmonics · labels follow the lit harmonics; SLOPE has a unit', () => {
  const markers = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, y: 400 - i * 30 }));
  it('after SQUARE (odd only) no label sits on an even, empty row', () => {
    const square = HM.buildPreset('square');
    const lit = new Set(square.filter((h: { amp: number; enabled: boolean; muted: boolean }) => HM.effectiveAmp(h as never) > HM.AMP_FLOOR).map((h: { n: number }) => h.n));
    const picked = HM.pickMarkerLabels(markers, 13, lit).map((m: { n: number }) => m.n);
    assert.ok(picked.length > 0);
    assert.ok(picked.every((n: number) => n % 2 === 1), `even label kept: ${picked}`);
    assert.ok(picked.includes(5) && picked.includes(7) && picked.includes(9), 'the lit 5, 7 and 9 are named');
  });
  it('without a lit set (live view) the old greedy rule is unchanged', () => {
    assert.deepEqual(HM.pickMarkerLabels(markers, 13).map((m: { n: number }) => m.n), markers.map((m) => m.n));
    const crowded = [{ n: 1, y: 100 }, { n: 2, y: 95 }, { n: 3, y: 80 }];
    assert.deepEqual(HM.pickMarkerLabels(crowded, 13).map((m: { n: number }) => m.n), [1, 3]);
  });
  it('the view passes the lit set in MODEL view, and SLOPE prints dB/OCT', () => {
    const v = read(`${LAB}/HarmonicsView.tsx`);
    assert.match(v, /pickMarkerLabels\(markers, labelGap, lit\)/);
    assert.match(v, /const lit = view === 'model' \?/);
    // the unit on the bezel's unit line (`sub`), so the SLOPE key stays at 390 (seen on screen)
    assert.match(v, /k: 'SLOPE',[\s\S]{0,400}?sub: slopeInfo\.slope != null \? 'dB\/OCT' : undefined,/);
  });
});

describe('Drum Tuning · chapter 2 checklist', () => {
  it('a revealed result counts faults found / missed / extra, never un-ticked lines as "right"', () => {
    const r = DC.prepResult(new Set(['loose']), new Set(['loose', 'worn']));
    assert.deepEqual(r, { found: 1, missed: 1, extra: 0, perfect: false });
    assert.equal(DC.prepResultLine(r), 'You found 1 fault and missed 1 — no credit yet.');
    const extra = DC.prepResult(new Set(['loose', 'debris']), new Set(['loose']));
    assert.deepEqual(extra, { found: 1, missed: 0, extra: 1, perfect: false });
    assert.equal(DC.prepResultLine(extra), 'You found 1 fault and flagged 1 line that was not there — no credit yet.');
    const none = DC.prepResult(new Set(), new Set(['worn', 'uneven']));
    assert.equal(DC.prepResultLine(none), 'You found 0 faults and missed 2 — no credit yet.');
    const ok = DC.prepResult(new Set(['worn']), new Set(['worn']));
    assert.equal(ok.perfect, true);
    assert.doesNotMatch(DC.prepResultLine(none), /\d+ of \d+/);
  });
  it('REVEAL KEY waits until every spot has been looked at, and says why', () => {
    const s = read(`${LAB}/drumtuning/modules/ch2Prepare.tsx`);
    assert.match(s, /if \(notLooked > 0\) \{\s*setRevealAsked\(true\);\s*return;\s*\}/);
    assert.match(s, /revealWaitLine\(notLooked\)/);
    assert.doesNotMatch(s, /of \$\{PREP_ITEMS\.length\} right/);
    assert.match(DC.revealWaitLine(12), /12 spots have not been looked at yet/);
    assert.match(DC.revealWaitLine(1), /1 spot has not been looked at yet/);
  });
});

describe('Drum Tuning · chapter 5 step 4 opens on SHORT, and its intro says so', () => {
  it('the start line names the goal the page opens on first', () => {
    assert.match(read(`${LAB}/drumtuning/modules/ch5Types.tsx`), /useState<GoalId>\('short'\)/);
    const start = DRUM_SCREEN_GUIDES.types[3].intro!.start;
    assert.match(start, /^The step opens on GOAL SHORT/);
    assert.ok(start.indexOf('SHORT') < start.indexOf('BEND'));
    assert.ok(start.trim().split(/\s+/).length <= 40);
  });
});

describe('Drum Tuning · listening steps have a silent path', () => {
  it('chapter 3 step 2: CAN\'T LISTEN NOW shows the map after a tap that did not sound', () => {
    const s = read(`${LAB}/drumtuning/modules/ch3Method.tsx`);
    assert.match(s, /if \(ok\) setTapped\(\(s\) => \(s\.has\(at\) \? s : new Set\(\[\.\.\.s, at\]\)\)\);\s*else setNoSound\(true\);/);
    assert.match(s, /◉ CAN'T LISTEN NOW · SHOW THE MAP/);
    assert.match(s, /const showMapSilently = \(\) => \{\s*setMapShown\(true\);\s*setMapSilent\(true\);/);
  });
  it('chapter 7 step 2: CAN\'T LISTEN NOW opens WHERE? from the readouts, and such a case never counts', () => {
    const s = read(`${LAB}/drumtuning/modules/ch7Trouble.tsx`);
    assert.match(s, /const investigated = \(struck && tappedEnough\) \|\| sim\.silent;/);
    assert.match(s, /if \(!present && !sim\.silent && !cleared\.has\(caseId\)/);
    assert.match(s, /◉ CAN'T LISTEN NOW · USE THE READOUTS/);
    assert.match(s, /void solo\.strike\(\)\.then\(\(ok\) => \{\s*if \(!ok\) setNoSound\(true\);/);
    // a fresh case starts NOT silent
    assert.match(s, /before: null, silent: false \}/);
  });
  it('chapter 7 review never prints "0 of 0 named"', () => {
    assert.match(read(`${LAB}/drumtuning/modules/ch7Trouble.tsx`), /hypothesised_n \? `Cleared[\s\S]*?: `Cleared \$\{cleared\.size\} of \$\{SYMPTOMS\.length\}; you have not named a cause yet\.`/);
  });
});

describe('Tuning · a NEXT off an acknowledgement chapter marks it', () => {
  it('chapters 0, 7 and 11 (BEGIN LAB / I’VE GOT IT / I’VE COMPARED THEM) carry ackDone, task chapters do not', () => {
    const idx = read(`${LAB}/tuning/chapters/index.ts`);
    const flagged = [...idx.matchAll(/\{ index: (\d+),[^\n]*ackDone: true/g)].map((m) => Number(m[1]));
    assert.deepEqual(flagged, [0, 7, 11]);
    assert.match(read(`${LAB}/tuning/chapters/ch0Welcome.tsx`), /<Btn label="BEGIN LAB ›" tone="primary" onPress=\{ctx\.markDone\} \/>/);
  });
  it('the shell marks an ackDone chapter in beforeAdvance, and hands it to the nav', () => {
    const s = read(`${LAB}/tuning/TuningLabScreen.tsx`);
    assert.match(s, /if \(CHAPTERS\[from\]\?\.ackDone && CHAPTERS\[from\]\.index === chapter\) markDone\(\);/);
    assert.match(s, /useLabNav\(\{[\s\S]*?beforeAdvance,/);
  });
});

describe('Cymatics · home in the preview, check on the end screen, title fits', () => {
  it('the preview table opens the HOME', () => {
    const w = read('src/dev/webPreviews.tsx');
    assert.match(w, /CymaticsLab: CymaticsHomeScreen as ComponentType,/);
  });
  it('both end screens list and draw the lab’s check (its credit)', () => {
    const e = read(`${LAB}/cymatics/useCymaticsEnd.tsx`);
    assert.match(e, /understandingFor\('cymatics'\)/);
    assert.match(e, /<LabUnderstandingBlock labId="cymatics"/);
    for (const f of ['CymaticsHomeScreen', 'CymaticsModuleScreen']) {
      const s = read(`${LAB}/cymatics/${f}.tsx`);
      assert.match(s, /useCymaticsEnd\(visited, /, f);
      assert.match(s, /shownHereId=\{end\.shownHereId\}\s*extra=\{end\.extra\}/, f);
    }
    assert.doesNotMatch(CYMATICS_END_GUIDE.changes.join(' '), /on the lab home or on any studio’s CHECK tab/);
  });
  it('the Membrane studio title is two words that fit two lines', () => {
    const s = read(`${LAB}/cymatics/MembraneStudioScreen.tsx`);
    assert.match(s, /title="MEMBRANE & LOUDSPEAKER"/);
    assert.doesNotMatch(s, /title="MEMBRANE & LOUDSPEAKER STUDIO"/);
  });
  it('the empty gallery’s intro no longer names cards that are not there', () => {
    assert.match(CYMATICS_GALLERY_GUIDES.browse.intro!.start, /^No cards yet\?/);
  });
});

describe('Silent first step in WHERE TO START', () => {
  const starts: [string, string][] = [
    ['Oscillators', OSCILLATOR_SCREEN_GUIDES.explore.intro!.start],
    ['Noise', NOISE_SCREEN_GUIDES.explore.intro!.start],
    ['Harmonics', HARMONIC_SCREEN_GUIDES.explore.intro!.start],
    ['Bass', BASS_SCREEN_GUIDES.fretted.intro!.start],
    ['Modular', MODULAR_SCREEN_GUIDES.explore.intro!.start],
    ['Tuning ch 1', TUNING_SCREEN_GUIDES[0].intro!.start],
  ];
  for (const [lab, start] of starts) {
    it(`${lab}: the first sentence needs no sound; sound comes after`, () => {
      const first = start.split(/(?<=[.!?])\s/)[0];
      assert.doesNotMatch(first, /▶|HEAR IT|hear|listen/i, `${lab}: "${first}"`);
      assert.match(start, /▶|HEAR IT/, `${lab}: the sound step is still there`);
      assert.ok(start.trim().split(/\s+/).length <= 40, `${lab}: over 40 words`);
    });
  }
});

describe('Ear Training · the score pill says what it rests on', () => {
  it('under 20 answers it names the count, at 20 it reads "last 20"', () => {
    assert.equal(EAR.earScoreWindowLabel(1).sub, '1 answer');
    assert.equal(EAR.earScoreWindowLabel(7).sub, '7 answers');
    assert.equal(EAR.earScoreWindowLabel(20).sub, 'last 20');
    assert.equal(EAR.earScoreWindowLabel(64).sub, 'last 20');
    assert.match(read(`${LAB}/eartraining/EarModuleScreen.tsx`), /earScoreWindowLabel\(scoreAnswers\)\.sub/);
  });
});

describe('Speech and Envelope · small copy and feedback bugs', () => {
  it('Speech page 2’s intro counts the five stages the page draws', () => {
    assert.match(read(`${LAB}/speech/speechPagesA.tsx`), /<Lead>Five stages, always in this order\./);
    assert.match(SPEECH_SCREEN_GUIDES.p2.intro!.learning, /five stages/);
    assert.doesNotMatch(SPEECH_SCREEN_GUIDES.p2.intro!.learning, /four jobs/);
  });
  it('a GOT IT › that has been tapped leaves a done line, never nothing', () => {
    assert.match(read(`${LAB}/envelope/EnvelopeLabScreen.tsx`), /markDone\} \/> : <Text style=\{styles\.loaded\}>✓ THIS PAGE IS DONE · NEXT MOVES ON<\/Text>\}/);
    assert.match(read(`${LAB}/speech/speechPagesB.tsx`), /markDone\} \/> : <Text style=\{styles\.doneLine\}>✓ THIS PAGE IS DONE · NEXT MOVES ON<\/Text>\}/);
  });
});

/* ══ PHASE 2 (shared mechanisms filled in, 2026-11-14) ══════════════════════ */

const CF = await import('../src/screens/lab/tuning/components/checkFeedback.ts');
const SW = await import('../src/screens/lab/speech/speechCheckWhy.ts');
const SM = await import('../src/features/speech/speechModel.ts');
const G = {
  oscillator: (await import('../src/screens/lab/oscillatorScreenGuides.ts')).OSCILLATOR_SCREEN_GUIDES,
  noise: NOISE_SCREEN_GUIDES,
  harmonic: HARMONIC_SCREEN_GUIDES,
  bass: BASS_SCREEN_GUIDES,
  autotune: (await import('../src/screens/lab/autotuneScreenGuides.ts')).AUTOTUNE_SCREEN_GUIDES,
  harmonograph: (await import('../src/screens/lab/harmonographScreenGuides.ts')).HARMONOGRAPH_SCREEN_GUIDES,
  fm: (await import('../src/screens/lab/fmScreenGuides.ts')).FM_SCREEN_GUIDES,
  modular: MODULAR_SCREEN_GUIDES,
};
const words = (s: string) => s.trim().split(/\s+/).length;

describe('Phase 2 · FINISH · SEE WHAT’S LEFT under the CHECK stops the lab’s sound', () => {
  const LABS: [string, string, string][] = [
    ['OscillatorLabScreen.tsx', 'oscillator', 'stopTone'],
    ['NoiseLabScreen.tsx', 'noise', 'stopNoise'],
    ['HarmonicLabScreen.tsx', 'harmonic', 'stopAllSound'],
    ['AutotuneLabScreen.tsx', 'autotune', 'stop'],
    ['HarmonographLabScreen.tsx', 'harmonograph', 'stopInterval'],
    ['BassLabScreen.tsx', 'bass', 'stopNote'],
  ];
  for (const [f, id, stop] of LABS) {
    it(`${id}: its own checkEnd with onOpen={${stop}}`, () => {
      const s = read(`${LAB}/${f}`);
      assert.match(s, new RegExp(`checkEnd=\\{<LabCheckEnd labId="${id}" labTitle="[^"]+" onOpen=\\{${stop}\\} />\\}`));
      assert.match(s, /import \{ LabCheckEnd \} from '\.\/kit\/LabCheckEnd';/);
    });
  }
});

describe('Phase 2 · CHECK guide lines no longer promise the explanation on a wrong tap', () => {
  const FALSE = /with the same explanation|Every answer opens its explanation|with the explanation: read it|NOT QUITE — TRY ANOTHER with the reason|TRY ANOTHER, with the reason|Read the explanation either way|A wrong pick shows the explanation/;
  for (const [id, gd] of Object.entries(G)) {
    it(`${id}: the CHECK guide`, () => {
      const t = JSON.stringify((gd as Record<string, unknown>).check);
      assert.doesNotMatch(t, FALSE);
      assert.match(t, /a second wrong pick (also )?(shows|adds) the (full )?explanation/);
    });
  }
  it('Envelope, Speech, Cymatics: the shared-check lines', () => {
    for (const p of ['envelope/envelopeScreenGuides.ts', 'speech/speechScreenGuides.ts', 'cymatics/cymaticsScreenGuides.ts']) {
      assert.doesNotMatch(read(`${LAB}/${p}`), FALSE, p);
    }
  });
});

describe('Phase 2 · end-screen guides start state-neutral', () => {
  const S = 'Read WHERE TO START at the top: it names the next thing to do from where you are.';
  for (const p of ['cymatics/cymaticsScreenGuides.ts', 'eartraining/earTrainingScreenGuides.ts', 'drumtuning/drumScreenGuides.ts', 'fmScreenGuides.ts', 'envelope/envelopeScreenGuides.ts', 'tuning/tuningScreenGuides.ts', 'speech/speechScreenGuides.ts']) {
    it(p, () => assert.ok(read(`${LAB}/${p}`).includes(`start: '${S}`), p));
  }
});

describe('Phase 2 · each unfinished row names what is missing', () => {
  it('Tuning: one task line per chapter, shown only while the chapter is not done; the shared rule once', () => {
    const idx = read(`${LAB}/tuning/chapters/index.ts`);
    const block = idx.slice(idx.indexOf('export const CHAPTER_FINISH'));
    const keys = [...block.matchAll(/^\s+(\d+): 'Still to do: /gm)].map((m) => Number(m[1]));
    assert.deepEqual(keys, [...Array(14).keys()]);
    const s = read(`${LAB}/tuning/TuningLabScreen.tsx`);
    assert.match(s, /detail: endCleared\.has\(String\(c\.index\)\) \? undefined : CHAPTER_FINISH\[c\.index\]/);
    assert.match(s, /howItCounts="A chapter counts once its own task is done/);
  });
  it('Envelope and Speech: the hands-on check page names its missing piece (pageDetail)', () => {
    assert.match(read(`${LAB}/envelope/EnvelopeLabScreen.tsx`), /pageDetail=\{\(i\) => \(i === 6 \? 'Still to do: get all six questions on this page right\.' : undefined\)\}/);
    assert.match(read(`${LAB}/speech/SpeechLabScreen.tsx`), /pageDetail=\{\(i\) => \(i === 10 \? 'Still to do: five right answers on this page\.' : undefined\)\}/);
  });
  it('Cymatics: the shared rule is said once on both end screens', () => {
    assert.match(read(`${LAB}/cymatics/useCymaticsEnd.tsx`), /howItCounts: 'A module counts once you open it\. The check counts once every answer is right\.'/);
    for (const f of ['CymaticsHomeScreen', 'CymaticsModuleScreen']) assert.match(read(`${LAB}/cymatics/${f}.tsx`), /howItCounts=\{end\.howItCounts\}/);
  });
});

describe('Phase 2 · the lab-local checks: a reason first, the explanation after a second different miss', () => {
  it('the shared UnderstandingCheck feedback (Tuning, Envelope, Speech and every lab that uses it)', () => {
    const w = ['Reason zero.', undefined, 'Reason two.'];
    assert.equal(CF.checkFeedback({ picked: 0, correct: 1, explain: 'E.', wrong: w, misses: 1 }), 'Reason zero.');
    assert.equal(CF.checkFeedback({ picked: 2, correct: 1, explain: 'E.', wrong: w, misses: 2 }), 'Reason two. E.');
    assert.equal(CF.checkFeedback({ picked: 1, correct: 1, explain: 'E.', wrong: w, misses: 2 }), '✓ E.');
    const c = read(`${LAB}/tuning/components/check.tsx`);
    assert.match(c, /missedRef\.current\.add\(i\);/, 'the same wrong option twice is one miss');
  });
  it('Envelope page 7: all six checks carry a reason for each wrong option', () => {
    const s = read(`${LAB}/envelope/EnvelopeLabScreen.tsx`);
    const arrays = [...s.matchAll(/^\s+wrong: \[(.*)\],$/gm)].map((m) => m[1]);
    assert.equal(arrays.length, 6);
    for (const a of arrays) {
      const parts = a.split(/', '|', undefined|undefined, '/);
      assert.equal((a.match(/undefined/g) ?? []).length, 1, 'exactly the right option has no reason');
      for (const p of parts) assert.ok(words(p.replace(/^'|'$/g, '')) <= 30, p);
    }
    assert.match(s, /explain=\{c\.explain\} wrong=\{c\.wrong\}/);
  });
  it('Speech: a reason for every wrong option of every check, keyed by its exact text, never the right one', () => {
    for (const c of SM.SPEECH_CHECKS) {
      const map = SW.SPEECH_CHECK_WHY[c.id];
      assert.ok(map, c.id);
      const right = c.options[c.correct];
      for (const k of Object.keys(map)) assert.ok(c.options.includes(k) && k !== right, `${c.id}: ${k}`);
      c.options.forEach((o: string, i: number) => { if (i !== c.correct) assert.ok(map[o], `${c.id}: no reason for "${o}"`); });
      for (const r of Object.values(map) as string[]) {
        assert.ok(words(r) <= 30, r);
        assert.ok(!r.includes(right), `${c.id}: a reason quotes the answer`);
      }
      const wrong = SW.speechWrongFor(c.id, c.options, c.correct)!;
      assert.equal(wrong[c.correct], undefined);
    }
    assert.match(read(`${LAB}/speech/speechPagesA.tsx`), /wrong=\{wrong\} onCorrect=\{onCorrect\}/);
  });
  it('Drum Tuning decision cards: a reason per wrong option; the explanation after a second different miss', () => {
    for (const s of DC.ALL_DRUM_SCENARIOS) {
      const map = DC.DRUM_SCENARIO_WHY[s.id];
      assert.ok(map, s.id);
      for (const o of s.options) {
        if (o === s.correct) assert.equal(map[o], undefined);
        else assert.ok(map[o] && words(map[o]) <= 30, `${s.id}: "${o}"`);
      }
      const wrongOpt = s.options.find((o: string) => o !== s.correct)!;
      assert.ok(!DC.drumWrongLine(s, wrongOpt, 1).includes(s.explain), 'first miss: no explanation');
      assert.ok(DC.drumWrongLine(s, wrongOpt, 2).endsWith(s.explain), 'second miss: the explanation follows');
    }
    assert.match(read(`${LAB}/drumtuning/kit.tsx`), /drumWrongLine\(s, picked, wrongPicks\.length\)/);
  });
});

describe('Phase 2 · silent learner and bezel captions (S3)', () => {
  const RACKS = ['OscillatorLabScreen.tsx', 'NoiseLabScreen.tsx', 'FmLabScreen.tsx', 'ModularLabScreen.tsx', 'AutotuneLabScreen.tsx', 'HarmonographLabScreen.tsx', 'BassLabScreen.tsx', 'HarmonicsView.tsx'];
  for (const f of RACKS) {
    it(`${f}: its own "Sound off?" line on the rack stage`, () => {
      const m = read(`${LAB}/${f}`).match(/soundOffLine: '(Sound off\? [^']+)'/);
      assert.ok(m, f);
      assert.ok(words(m![1]) <= 20, m![1]);
    });
  }
  it('captions: 1-3 plain words, at most 14 characters, on the code-named readouts', () => {
    const want: [string, string[]][] = [
      ['OscillatorLabScreen.tsx', ['the pitch', 'drawn as']],
      ['NoiseLabScreen.tsx', ['how it tilts', 'output level']],
      ['FmLabScreen.tsx', ['the note', 'the shaker', 'how hard', 'how wide']],
      ['ModularLabScreen.tsx', ['tone shape', 'filter peak', 'wobbler', 'steps a second']],
      ['AutotuneLabScreen.tsx', ['how far pulled', 'how fast', 'still off by']],
      ['HarmonographLabScreen.tsx', ['swing ratio']],
      ['HarmonicsView.tsx', ['the pitch', 'overtone share', 'how spiky']],
    ];
    for (const [f, caps] of want) {
      const s = read(`${LAB}/${f}`);
      for (const c of caps) {
        assert.ok(s.includes(`caption: '${c}'`), `${f}: ${c}`);
        assert.ok(c.length <= 14 && c.split(' ').length <= 3, c);
      }
    }
  });
  it('captions on every Tuning chapter readout and every Cymatics readout (named exceptions only), each ≤ 14 characters', () => {
    const files = [
      ...readdirSync(join(process.cwd(), LAB, 'tuning/chapters')).filter((f) => f.endsWith('.tsx')).map((f) => `tuning/chapters/${f}`),
      ...['LiquidStudioScreen', 'MembraneStudioScreen', 'PlateStudioScreen'].map((f) => `cymatics/${f}.tsx`),
      ...readdirSync(join(process.cwd(), LAB, 'cymatics/modules')).filter((f) => f.endsWith('.tsx')).map((f) => `cymatics/modules/${f}`),
    ];
    // Plain words already, so no caption: the DONE counter, a FREQ in Hz, the plate names A · / B ·.
    const EXEMPT = /k: '(DONE|FREQ)'|k: `[AB] · /;
    let seen = 0;
    for (const f of files) {
      const s = read(`${LAB}/${f}`);
      for (const line of s.split('\n').filter((l) => /\{ k: ['`]/.test(l))) {
        if (EXEMPT.test(line)) continue;
        seen++;
        const m = line.match(/caption: '([^']+)'/);
        assert.ok(m, `${f}: no caption on ${line.trim().slice(0, 60)}`);
        assert.ok(m![1].length <= 14, `${f}: "${m![1]}" over 14`);
      }
    }
    assert.ok(seen > 70, `only ${seen} readouts found`);
    assert.match(read(`${LAB}/cymatics/modules/modNodes.tsx`), /k: 'RES',\n\s+caption: 'on a mode\?',/);
    assert.match(read(`${LAB}/cymatics/modules/modSystems.tsx`), /k: 'SYSTEM', [^\n]*caption: 'what vibrates'/);
  });
  it('checker C4: a reason never repeats a 5-word run of its own explanation (Speech, Drum Tuning)', () => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    const runs = (s: string) => { const w = norm(s); return w.slice(0, Math.max(0, w.length - 4)).map((_, i) => w.slice(i, i + 5).join(' ')); };
    const flat = (s: string) => ` ${norm(s).join(' ')} `;
    for (const c of SM.SPEECH_CHECKS) {
      for (const r of Object.values(SW.SPEECH_CHECK_WHY[c.id] ?? {}) as string[]) {
        for (const run of runs(r)) assert.ok(!flat(c.explain).includes(` ${run} `), `${c.id}: "${run}" is in the explanation too`);
      }
    }
    for (const s of DC.ALL_DRUM_SCENARIOS) {
      for (const r of Object.values(DC.DRUM_SCENARIO_WHY[s.id] ?? {}) as string[]) {
        for (const run of runs(r)) assert.ok(!flat(s.explain).includes(` ${run} `), `${s.id}: "${run}" is in the explanation too`);
      }
    }
  });
  it('checker C2: the rack labs’ own CHECK YOURSELF cards — a reason per wrong option, balanced lengths, right answers kept', () => {
    const FILES = ['AutotuneLabScreen.tsx', 'BassLabScreen.tsx', 'FmLabScreen.tsx', 'HarmonicsView.tsx', 'ModularLabScreen.tsx', 'NoiseLabScreen.tsx', 'OscillatorLabScreen.tsx'];
    const strOf = (e: ts.Expression): string => (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? e.text : '');
    type Card = { file: string; question: string; options: string[]; correct: number; why: Record<number, string> | null };
    const cards: Card[] = [];
    for (const f of FILES) {
      const sf = ts.createSourceFile(f, read(`${LAB}/${f}`), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (n: ts.Node) => {
        if (ts.isObjectLiteralExpression(n)) {
          const p: Record<string, ts.Expression> = {};
          for (const pr of n.properties) if (ts.isPropertyAssignment(pr) && ts.isIdentifier(pr.name)) p[pr.name.text] = pr.initializer;
          if (p.question && p.options && p.correctIdx && ts.isArrayLiteralExpression(p.options)) {
            let why: Record<number, string> | null = null;
            if (p.why && ts.isObjectLiteralExpression(p.why)) {
              why = {};
              for (const w of p.why.properties) if (ts.isPropertyAssignment(w)) why[Number(w.name.getText(sf))] = strOf(w.initializer);
            }
            cards.push({ file: f, question: strOf(p.question), options: p.options.elements.map(strOf), correct: Number(p.correctIdx.getText(sf)), why });
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    assert.equal(cards.length, 13);
    const bad: string[] = [];
    for (const c of cards) {
      if (!c.why) { bad.push(`${c.file}: no why: ${c.question}`); continue; }
      const lens = c.options.map((o) => o.length);
      const next = Math.max(...lens.filter((_, i) => i !== c.correct));
      if (lens[c.correct] > 1.4 * next) bad.push(`${c.file}: right answer ${lens[c.correct]} vs ${next}: ${c.question}`);
      c.options.forEach((_o, i) => {
        if (i === c.correct) { if (c.why![i] != null) bad.push(`why on the right answer: ${c.question}`); return; }
        const t = c.why![i];
        if (!t) { bad.push(`no reason for option ${i}: ${c.question}`); return; }
        if (t.split(/\s+/).length > 30) bad.push(`over 30 words: ${t}`);
        const right = c.options[c.correct].toLowerCase();
        if (right.length > 3 && t.toLowerCase().includes(right)) bad.push(`quotes the answer: ${t}`);
      });
    }
    assert.deepEqual(bad, []);
    // the right answers stay the right ones (the authored index is 0 on every card)
    assert.ok(cards.every((c) => c.correct === 0));
  });
  it('checker C4: Drum Tuning ch 3 step 2’s YOU ARE LOOKING AT line follows the map', () => {
    assert.match(read(`${LAB}/drumtuning/modules/ch3Method.tsx`), /<Landing looking=\{mapShown \? 'an uneven head with its color map shown/);
  });
  it('NEEDS SOUND tags where credit needs listening: Drum Tuning ch 4, 6, 7; every Ear Training drill', () => {
    for (const f of ['ch4Whole', 'ch6Kit', 'ch7Trouble']) {
      const s = read(`${LAB}/drumtuning/modules/${f}.tsx`);
      assert.match(s, /import \{ NeedsSoundTag \} from '\.\.\/\.\.\/rack\/silentPath';/, f);
      assert.match(s, /<NeedsSoundTag \/>/, f);
    }
    assert.match(read(`${LAB}/eartraining/EarModuleScreen.tsx`), /\{trial\.question\} <NeedsSoundTag \/><\/Text>/);
  });
});
