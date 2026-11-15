/**
 * Beginner waves 1-3 (2026-11-15), group F7a: Equalizer, EQ Lab, Compression,
 * Gate / Expander, Limiter, Smart Processors (De-Esser), Stereo Imaging and
 * Binaural Panner. Owner go 2026-11-15: "build waves 1 thru 3" (D62 adoption plan).
 * Brief: docs/labs/beginner_waves_2026_11_15/00_BUILD_BRIEF.md; items:
 * F7a_ITEMS.md; report: F7a_REPORT.md.
 *
 * Every test here would have failed before its change.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { LAB_LESSONS } from '../src/features/lab/guidedLessons/content.ts';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (so a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

// ── GATE-05 / LIM-06 · LEARN lists only this screen's controls; one "for later" row ──
describe('GATE-05 / LIM-06 · off-screen controls fold into one "for later" row', () => {
  const cases = [
    { id: 'gate' as const, row: 'On real gates (for later)', gone: ['hysteresis', 'lookahead', 'sidechain', 'key_filter', 'sc_listen'] },
    { id: 'limiter' as const, row: 'On real limiters (for later)', gone: ['drive', 'attack', 'lookahead', 'true_peak', 'character', 'dither'] },
  ];
  for (const c of cases) {
    it(`${c.id}: no "Not on this screen" row in the main list, and the for-later row is last`, () => {
      const controls = LAB_LESSONS[c.id].controls;
      for (const k of c.gone) assert.ok(!controls.some((x) => x.key === k), `${c.id}: ${k} is still its own row`);
      const last = controls[controls.length - 1];
      assert.equal(last.name, c.row);
      assert.match(last.definition ?? '', /^Not on this screen/);
      // every other row is a control (or readout) the screen has
      for (const x of controls.slice(0, -1)) assert.doesNotMatch(`${x.range ?? ''} ${x.definition ?? ''}`, /Not on this screen/, `${c.id}.${x.key}`);
    });
  }
});

// ── DES-01..05 · Smart Processors (De-Esser) ─────────────────────────────────
describe('DES-01..05 · De-Esser: plain path first, plain hub, S frame on page 7', () => {
  const LAB = code('src/screens/lab/deesser/DeEsserLabScreen.tsx');
  const HUB = code('src/screens/lab/deesser/SmartProcessorsLabScreen.tsx');
  const fn = (name: string) => {
    const i = LAB.indexOf(`function ${name}(`);
    const j = LAB.indexOf('\nfunction ', i + 10);
    return LAB.slice(i, j < 0 ? undefined : j);
  };
  it('DES-01: page 3 draws the broadband (main + ear) path until page 7 has been reached', () => {
    const p = fn('PagePath');
    assert.match(p, /const mode: Mode = modeTaught \? rackS\.mode : 'broadband';/);
    assert.doesNotMatch(p, /pathOrder\(rackS\.mode\)|pathHeight\(rackS\.mode\)|mode=\{rackS\.mode\}/);
    assert.match(fn('PageMode'), /useEffect\(\(\) => \{ modeTaught = true; \}, \[\]\);/);
    assert.match(fn('DeEsserLabScreen'), /useState\(\(\) => \{ modeTaught = false; return true; \}\);/);
  });
  it('DES-02: the hub check is labeled for after the lab, right above the check', () => {
    assert.match(HUB, /<Text style=\{styles\.afterLabel\}>AFTER THE DE-ESSER LAB<\/Text>\s*(\{\}\s*)*<LabUnderstandingBlock/);
  });
  it('DES-03: no "gain computer" on the hub, no "hard-knee" on page 4', () => {
    assert.doesNotMatch(HUB, /gain computer/i);
    assert.doesNotMatch(fn('PageThreshold'), /hard-knee/);
  });
  it('DES-04: the row is one plain line with a START › button, no OPEN tag', () => {
    assert.match(HUB, /blurb: 'It softens the hissy S sounds in a voice, and only those\.'/);
    assert.match(HUB, />START ›</);
    assert.doesNotMatch(HUB, />OPEN</);
  });
  it('DES-05: page 7 opens on the first S frame, which the model reduces', async () => {
    assert.match(fn('PageMode'), /useState\(SIB\[0\]\)/);
    const M = await import('../src/features/deesser/deEsserModel.ts');
    const first = M.PHRASE.findIndex((f) => f.sibilant);
    const out = M.processPhrase(M.PHRASE, { ...M.DEFAULTS, rangeDb: 8 });
    assert.ok(out[first].grDb > 0, 'the opening frame shows a reduction, so a mode switch shows a difference');
    assert.equal(out[0].grDb, 0, 'frame 1 ("th") had none');
  });
});

// ── ST-01 / ST-04 · Stereo: one name, MONO CHECK; WIDTH first; the phone-speaker reason ──
describe('ST-01 / ST-04 · Stereo Imaging says MONO CHECK everywhere and starts on WIDTH', () => {
  const CFG = read('src/screens/lab/fxLabConfigs.tsx');
  const STEREO = CFG.slice(CFG.indexOf('const stereoConfig'), CFG.indexOf('export const StereoLabScreen'));
  it('ST-01: key, tray, readout and caption all say MONO CHECK; no MONO-FOLD or FOLD key', () => {
    assert.match(STEREO, /label: 'MONO CHECK', paramId: P\.monoFold/);
    assert.match(STEREO, /\{ k: 'MONO CHECK', kNarrow: 'MONO', paramId: P\.monoFold/);
    assert.match(STEREO, /exploreCaption: 'Widen, then turn MONO CHECK on:/);
    const live = code('src/screens/lab/fxLabConfigs.tsx');
    assert.doesNotMatch(live.slice(live.indexOf('const stereoConfig'), live.indexOf('export const StereoLabScreen')), /MONO-FOLD|short: 'FOLD'|k: 'FOLD'|FOLD on|FOLD to/);
  });
  it('ST-01: the lesson, the checks and every stereo guide use the same name', async () => {
    const lesson = LAB_LESSONS.stereo;
    assert.equal(lesson.controls.find((c) => c.key === 'mono_fold')?.name, 'MONO CHECK');
    assert.doesNotMatch(JSON.stringify(lesson), /\bFOLD\b/);
    const { STEREO_SCREEN_GUIDES, STEREO_END_GUIDE } = await import('../src/screens/lab/stereoScreenGuides.ts');
    assert.doesNotMatch(JSON.stringify([STEREO_SCREEN_GUIDES, STEREO_END_GUIDE]), /\bFOLD\b|MONO-FOLD/);
    const checks = read('src/features/lab/understandingChecks.ts');
    const st = checks.slice(checks.indexOf('const STEREO'), checks.indexOf('const BINAURAL'));
    assert.doesNotMatch(st, /MONO-FOLD/);
  });
  it('ST-04: the start opens on WIDTH (no ▶ first) and names MONO CHECK as how a phone speaker hears the mix', async () => {
    const { STEREO_SCREEN_GUIDES } = await import('../src/screens/lab/stereoScreenGuides.ts');
    const start = STEREO_SCREEN_GUIDES.explore.intro!.start;
    assert.match(start, /^Drag WIDTH/);
    assert.doesNotMatch(start, /▶/);
    assert.match(start, /MONO CHECK on: that is how a phone speaker hears your mix/);
    assert.ok(start.split(/\s+/).length <= 40);
    // …and the reason sits on the control itself, as the ON choice's one-line meaning
    assert.match(STEREO, /\{ label: 'ON', value: 1, blurb: 'Left and right are added into one, the way a phone speaker hears your mix\.' \}/);
  });
});

// ── BIN-01 / BIN-03 / BIN-04 / BIN-05 · Binaural Panner ─────────────────────
describe('BIN-01/03/04/05 · Binaural: name the ears, front/back at the moment, no vanishing objects', async () => {
  const B = await import('../src/screens/lab/binauralCues.ts');
  const S = code('src/screens/lab/BinauralLabScreen.tsx');
  it('BIN-04: the cue line names the side and the far ear', () => {
    assert.equal(
      B.twoCuesLine(1, 60, 491.2, 6.93),
      'Object 1 is on your RIGHT, so your LEFT ear hears it 491 µs later, 6.9 dB quieter and a little darker (the head shadow). Those are the two cues your brain uses to place a sound.',
    );
    assert.match(B.twoCuesLine(1, -60, 491.2, 6.93), /on your LEFT, so your RIGHT ear/);
    assert.match(B.twoCuesLine(2, 0, 0, 0), /straight ahead: both ears hear it at the same moment/);
    assert.match(B.twoCuesLine(3, 180, 0, 0), /straight behind/);
    assert.match(S, /\{twoCuesLine\(selected \+ 1, sel\.azDeg, itdUs\(sel\.azDeg\), ildDb\(sel\.azDeg\)\)\}/);
    assert.doesNotMatch(S, /far-ear delay ≈/);
  });
  it('BIN-01: the stage marks the far ear, and the mark swaps sides across the middle', () => {
    assert.equal(B.farEarMark(30), 'L');
    assert.equal(B.farEarMark(-30), 'R');
    assert.equal(B.farEarMark(150), 'L');
    assert.equal(B.farEarMark(0), null);
    assert.equal(B.farEarMark(180), null);
    assert.match(S, /const far = farEarMark\(sources\[selected\]\?\.azDeg \?\? 0\);/);
    assert.match(S, />\s*late\s*</);
  });
  it('BIN-03: the front/back line shows only near the front–back line, and the always-on sentence is gone', () => {
    for (const a of [0, 10, -20, 160, 180, -170]) assert.ok(B.nearFrontBackLine(a), String(a));
    for (const a of [30, -60, 90, 150, -150]) assert.ok(!B.nearFrontBackLine(a), String(a));
    assert.match(S, /\{nearFrontBackLine\(sel\.azDeg\) \? <Text style=\{styles\.caption\}>\{FRONT_BACK_LINE\}<\/Text> : null\}/);
    assert.doesNotMatch(S, /Behind-the-head is only gently/);
  });
  it('BIN-05: a stacked object gets a wider ring drawn on top, so none disappears', () => {
    const same = [{ x: 50, y: 50 }, { x: 50, y: 50 }, { x: 51, y: 50 }];
    const r = B.stageRingRadii(same, 0);
    assert.equal(new Set(r).size, 3, 'three distinct rings');
    assert.deepEqual(B.stageRingRadii([{ x: 0, y: 0 }, { x: 100, y: 0 }], 1), [10, 12], 'apart: the usual rings');
    // the rings are drawn after (on top of) every body; the selected body last
    assert.ok(S.indexOf('key={`ring${i}`}') > S.indexOf('{order.map((i) => {'));
    assert.match(S, /const order = sources\.map\(\(_, i\) => i\)\.filter\(\(i\) => i !== selected\)\.concat\(selected\);/);
  });
});

// ── SH-75-F · CHECK guides no longer repeat the card's no-score sentence ──────
describe('SH-75-F · the CHECK guides drop the sentence the shared card now says', () => {
  it('Binaural, Stereo and Equalizer CHECK guides', async () => {
    const files: [string, string][] = [
      ['../src/screens/lab/binauralScreenGuides.ts', 'BINAURAL_SCREEN_GUIDES'],
      ['../src/screens/lab/stereoScreenGuides.ts', 'STEREO_SCREEN_GUIDES'],
      ['../src/screens/lab/eq/equalizerScreenGuides.ts', 'EQUALIZER_SCREEN_GUIDES'],
    ];
    for (const [f, name] of files) {
      const mod = (await import(f)) as Record<string, Record<string, { control: string[] }>>;
      const txt = mod[name].check.control.join(' ');
      assert.doesNotMatch(txt, /Nothing is lost and there is no score|There is no score, and a wrong answer costs nothing/, f);
    }
  });
});

// ── Wave 2: first cards (EQ-06, CMP-03, GATE-01, LIM-01) ─────────────────────
describe('EQ-06 / CMP-03 / GATE-01 / LIM-01 · the first cards are one or two plain sentences', async () => {
  const { LAB_TERM_ENTRIES } = await import('../src/features/intro/labTermIntroData.ts');
  const card = (k: string) => {
    const e = LAB_TERM_ENTRIES[k];
    assert.equal(e.status, 'wired', k);
    return e as { term: string; plainEnglish: string; glossaryId: string };
  };
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  it('each of the four cards has at most two sentences and keeps its glossary row id (seen flag)', () => {
    const ids: Record<string, string> = {
      EqLab: '09b3ec3d-8fbe-4a04-8c85-77aa44546a87',
      CompressionLab: '037a431c-1b1a-418f-b6c1-51e0cea14a9b',
      GateLab: '484e28c0-8ddc-40c8-8f06-347ee12fb285',
      LimiterLab: '7f621dc4-6d04-4c29-bc61-e6352f8afcd8',
    };
    for (const [k, id] of Object.entries(ids)) {
      assert.ok(sentences(card(k).plainEnglish) <= 2, k);
      assert.equal(card(k).glossaryId, id, k);
    }
  });
  it('EQ-06: the tone knobs of audio, and ONE knob in this lab', () => {
    assert.match(card('EqLab').plainEnglish, /tone knobs of audio, like bass, middle and treble\. In this lab you control one of those knobs/);
  });
  it('CMP-03: an automatic hand on the volume knob; no five-term list', () => {
    assert.equal(card('CompressionLab').term, 'Compressor');
    assert.match(card('CompressionLab').plainEnglish, /automatic hand on the volume knob/);
    assert.doesNotMatch(card('CompressionLab').plainEnglish, /ratio|attack|release|make-up/i);
  });
  it('GATE-01: titled Noise gate, and says first that it mutes the gaps', () => {
    assert.equal(card('GateLab').term, 'Noise gate');
    assert.match(card('GateLab').plainEnglish, /^A noise gate mutes the gaps\./);
  });
  it('LIM-01: a ceiling for loudness, two sentences, no "nothing gets past" (the lab has no lookahead)', () => {
    assert.match(card('LimiterLab').plainEnglish, /^A limiter is a ceiling for loudness\./);
    assert.doesNotMatch(card('LimiterLab').plainEnglish, /lookahead|master bus|squash|infinite|nothing gets past/i);
  });
});

// ── CMP-02 · plain ratio words and a SPEED key ──────────────────────────────
describe('CMP-02 · Compression trays: gentle, medium, strong, almost a wall; SPEED', () => {
  const CFG = code('src/screens/lab/fxLabConfigs.tsx');
  const COMP = CFG.slice(CFG.indexOf('const compConfig'), CFG.indexOf('export const CompressionLabScreen'));
  it('the ratio choices and blurbs carry no studio slang', () => {
    for (const l of ['2:1 GENTLE', '4:1 MEDIUM', '8:1 STRONG', '20:1 ALMOST A WALL']) assert.ok(COMP.includes(`label: '${l}'`), l);
    assert.doesNotMatch(COMP, /GLUE|20:1 LIMIT|workhorse|squash/);
  });
  it('the key reads SPEED, and the tray says what attack and release are', () => {
    assert.match(COMP, /id: 'env', label: 'SPEED'/);
    assert.match(COMP, /label: 'ATTACK', paramId: P\.attackMs, lessonKey: 'attack', hint: 'how fast it grabs'/);
    assert.match(COMP, /label: 'RELEASE', paramId: P\.releaseMs, lessonKey: 'release', hint: 'how fast it lets go'/);
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /gp\.hint \? <Text style=\{styles\.sectionHint\}> · \{gp\.hint\}<\/Text>/);
    assert.doesNotMatch(COMP, /ATK\/REL/);
  });
});

// ── LIM-05 / LIM-02 · Limiter opens on the drum hits; Compression first ──────
describe('LIM-05 / LIM-02 · Limiter: CLICK first, and a pointer to Compression', async () => {
  const { LIMITER_SCREEN_GUIDES } = await import('../src/screens/lab/limiterScreenGuides.ts');
  it('LIM-05: the first source is CLICK 120', () => {
    const CFG = code('src/screens/lab/fxLabConfigs.tsx');
    const LIM = CFG.slice(CFG.indexOf('const limiterConfig'), CFG.indexOf('export const LimiterLabScreen'));
    assert.match(LIM, /sources: \[srcClick\(120\), srcSine\(440\), SRC_PINK\]/);
    assert.match(LIMITER_SCREEN_GUIDES.explore.intro!.start, /the tops of the hits flatten at the dashed ceiling/);
  });
  it('LIM-02: the intro card says to do Compression first, still ≤ 40 words', () => {
    const start = LIMITER_SCREEN_GUIDES.explore.intro!.start;
    assert.match(start, /New to this\? Do Compression first\.$/);
    assert.ok(start.split(/\s+/).length <= 40, String(start.split(/\s+/).length));
  });
});

// ── EQL-01 / EQL-02 / EQL-03 / EQL-05 · EQ Lab ───────────────────────────────
describe('EQL-01/02/03/05 · EQ Lab: beginner page first, primer announced, plain words, a start line', async () => {
  const { EQ_MODULES } = await import('../src/screens/lab/eq/modules/registry.ts');
  it('EQL-01: Why We Use EQ is module 1 and Seeing Frequency module 2; the rest keep their places', () => {
    assert.deepEqual(EQ_MODULES.slice(0, 3).map((m) => m.id), ['whyEq', 'spectrum', 'camera']);
    assert.equal(EQ_MODULES[6].id, 'slopes');
    assert.equal(EQ_MODULES[9].id, 'graphic');
    assert.equal(EQ_MODULES[10].id, 'liveEq');
  });
  it('EQL-02: the primer says it is one time, about a minute, and the lesson opens right after', () => {
    assert.match(code('src/screens/lab/amplitude/AmplitudeOrientation.tsx'), /const GATE_INTRO =\s*'A one-time stop, about a minute: the color language our audio visualizers use\. Your lesson opens right after\.';/);
  });
  it('EQL-03: no "Butterworth"/"poles" in module 7, PHASE explained in module 10, no "COMB" or "FFT" in module 11', () => {
    const fs = code('src/screens/lab/eq/modules/FilterSlopes.tsx');
    assert.doesNotMatch(fs, /'[^']*\bpoles?\b[^']*'|`Butterworth/);
    assert.match(fs, /badge: `Far below \$\{CUTOFF\} Hz, each octave down is about \$\{slope\} dB quieter\.`/);
    const gt = code('src/screens/lab/eq/modules/GraphicTruth.tsx');
    assert.match(gt, /'Phase is timing: how far each frequency’s wave is shifted ahead or behind in its cycle\./);
    assert.doesNotMatch(gt, /minimum-phase\)? (EQ|boost)/);
    const ls = code('src/screens/lab/eq/modules/LiveSpectrumEq.tsx');
    assert.doesNotMatch(ls, /'COMB'|label="COMBINED"|FFT size/);
  });
  it('EQL-05: the menu top line says start at 1 and points to the Equalizer lab', () => {
    const h = code('src/screens/lab/eq/EqLabHomeScreen.tsx');
    assert.match(h, /Start at module 1 and take the modules in order; each one is short\. New to EQ\? Try the\s+one-band Equalizer lab first/);
    assert.doesNotMatch(h, /Start by seeing the real frequency content/);
  });
});

// ── Sweeps: SH-64 (Stereo BASS grays with no SIDE), SH-76 (tray meanings), SH-26 (codes) ──
describe('Sweeps · SH-64 / SH-76 / SH-26 in F7a labs', () => {
  const CFG = code('src/screens/lab/fxLabConfigs.tsx');
  const STEREO = CFG.slice(CFG.indexOf('const stereoConfig'), CFG.indexOf('export const StereoLabScreen'));
  it('SH-64: Stereo BASS-MONO grays (with its reason) when no SIDE is left', () => {
    const m = STEREO.match(/ignoredBy: \(paramId, v\) =>\s*([\s\S]*?): undefined,/);
    assert.ok(m, 'stereo has an ignoredBy');
    const P = { bassMonoHz: 1, monoFold: 2, widthPct: 3 };
    // eslint-disable-next-line no-new-func
    const fn = new Function('P', `return (paramId, v) => ${m![1]}: undefined;`)(P) as (id: number, v: Record<number, number>) => string | undefined;
    assert.ok(fn(1, { 1: 120, 2: 1, 3: 100 }), 'MONO CHECK on');
    assert.ok(fn(1, { 1: 120, 2: 0, 3: 0 }), 'WIDTH 0%');
    assert.equal(fn(1, { 1: 120, 2: 0, 3: 100 }), undefined, 'a SIDE exists: live');
    assert.equal(fn(2, { 1: 120, 2: 1, 3: 0 }), undefined, 'only BASS is ever grayed');
  });
  it('SH-76: every Stereo tray choice carries a one-line meaning', () => {
    const pan = STEREO.slice(STEREO.indexOf("label: 'PAN'"), STEREO.indexOf("label: 'BASS-MONO'"));
    const bass = STEREO.slice(STEREO.indexOf("label: 'BASS-MONO'"), STEREO.indexOf("label: 'MONO CHECK'"));
    for (const s of [pan, bass]) {
      const choices = s.match(/\{ label: '[^']+', value: [^,}]+(, blurb: '[^']+')? \}/g) ?? [];
      assert.ok(choices.length >= 2);
      for (const c of choices) assert.match(c, /blurb: '/, c);
    }
  });
  it('SH-26: the EQ Lab multiband guide spells out HPF and LPF the first time', async () => {
    const { EQ_SCREEN_GUIDES } = await import('../src/screens/lab/eq/eqScreenGuides.ts');
    assert.match(EQ_SCREEN_GUIDES.multiband.seeing[0], /^A six-band EQ: HPF \(low cut\), LOW, LMF \(low mids\), HMF \(high mids\), HIGH and LPF \(high cut\)\./);
  });
});

// ── GATE-02 · the CLICK caption says where RANGE, HOLD and RELEASE show ───────
describe('GATE-02 · the Gate caption points to where the three keys show, not that they are dead', () => {
  it('names the drawn tail (HOLD, RELEASE) and GR between hits (RANGE); PINK NOISE to hear them', () => {
    const CFG = code('src/screens/lab/fxLabConfigs.tsx');
    const GATE = CFG.slice(CFG.indexOf('const gateConfig'), CFG.indexOf('export const GateLabScreen'));
    assert.match(GATE, /On OUT, HOLD and RELEASE set how soon each hit’s tail is cut; ' \+\s*'RANGE shows on GR between the hits\. To hear those three, choose PINK NOISE\./);
    assert.doesNotMatch(GATE, /barely change/);
    // the drawing really uses HOLD and RELEASE on the gate's hit tail (fxAnim DynamicsFlow)
    const anim = code('src/screens/lab/fxAnim.tsx');
    assert.match(anim, /holdLeft = holdV;/);
    assert.match(anim, /gG \+= aRel \* \(floorG - gG\);/);
  });
});
