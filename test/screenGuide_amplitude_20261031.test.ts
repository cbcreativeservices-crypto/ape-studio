/**
 * Screen Guide rollout — Understanding Level & Amplitude (owner 2026-10-31) —
 * receipts. Pattern: test/screenGuide_20261031.test.ts (the Wave pilot).
 *
 * The lab is ONE scrolling page reached two ways, so two guides:
 *   lab    — AmplitudeLabScreen (Labs menu → Audio Fundamentals, first lab);
 *            it is also the lab home (AMPLITUDE_HOME_GUIDE === lab).
 *   primer — AmplitudeOrientationGatePage, the one-time colour-language
 *            primer drawn in place of a level-drawing screen.
 * Neither uses a shared host (custom header), so both wire the key, the
 * one-time hint anchor and the overlay host by hand (regions off: no Rack
 * Unit). Chip decision (owner rule 2026-10-31): a CONCEPT lab — still,
 * illustrative drawings, no live input, its own LEARNING CONVENTION card and
 * "not live measurements" line — so the AccuracyNote chip is gone from both
 * headers and the ⓘ key sits in its spot.
 *
 *   1. both screens: five sections, 1–5 bullets, 2–3 TRY THIS, house copy rules;
 *   2. every section within its no-scroll budget;
 *   3. each pinned on-screen name is in the guide AND in the page's source;
 *   4. the TRY THIS numbers are the numbers the page draws (PEAK/RMS are
 *      illustrative; SPL 78 vs PEAK −3 colours; the symmetric scope trace);
 *   5. wiring + the chip decision pinned.
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

const { AMPLITUDE_SCREEN_GUIDES, AMPLITUDE_HOME_GUIDE } = await import('../src/screens/lab/amplitude/amplitudeScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { levelColor, WAVE_LEVEL_STOPS } = await import('../src/features/tools/levelColor.ts');

type Guide = Record<string, string[]>;
const GUIDES = AMPLITUDE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const allGuides: [string, Guide][] = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const PAGE = 'src/screens/lab/amplitude/AmplitudeOrientation.tsx';
const SRC = code(PAGE);

describe('1. both Level & Amplitude screens have a complete guide', () => {
  it('one guide per screen the learner reaches: the lab and the primer; the home is the lab', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['lab', 'primer']);
    assert.equal(AMPLITUDE_HOME_GUIDE, AMPLITUDE_SCREEN_GUIDES.lab);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro, `${id}: no intro`);
      assert.ok(intro.learning.trim().split(/\s+/).length <= 30, `${id}: intro.learning over 30 words`);
      assert.ok(intro.start.trim().split(/\s+/).length <= 40, `${id}: intro.start over 40 words`);
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Pro Tools|Logic|Ableton|iZotope|Waves|Shure|Neumann|Sennheiser|Yamaha|Avid|Smaart|Dante)\b/, `${id}: a gear/software brand`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
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

describe('3. each guide quotes the page’s real names', () => {
  const END = code('src/screens/lab/kit/LabEndScreen.tsx');
  const SHARED = [
    'LOW', 'HIGH', 'quiet', 'loud', 'less', 'more',
    'SIX VIEWS · ONE SIGNAL', 'WAVEFORM', 'SPECTROGRAM', 'LEVEL METER', 'SPECTRUM (RTA)',
    'PEAK', 'RMS', 'LEARNING CONVENTION', 'BLUE = LESS', 'RED = MORE', 'CHECK YOURSELF',
    'OSCILLOSCOPE', 'SPL METER',
  ];
  const NAMES: Record<string, string[]> = {
    lab: [...SHARED, 'CHECK YOURSELF — THREE QUICK READS', 'UNDERSTOOD — MARK REVIEWED', '✓ ORIENTATION COMPLETE', 'MARK REVIEWED', 'TEST YOURSELF AGAIN ›'],
    primer: [...SHARED, 'UNDERSTOOD — CONTINUE'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the page AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in ${PAGE} — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the what’s-left link is named as the shared end link draws it', () => {
    assert.ok(END.includes('FINISH · SEE WHAT’S LEFT ›'));
    assert.ok(textOf(GUIDES.lab).includes('FINISH · SEE WHAT’S LEFT ›'));
    assert.match(SRC, /<ReviewLabEnd\s/);
  });
  it('the colour names and the dynamics marks match the colour bar', () => {
    assert.match(SRC, /DARK BLUE → BLUE → GREEN → YELLOW → ORANGE → RED/);
    // pp / mp / f / fff — four SMuFL marks (the glyphs are drawn, so pin the count + order of the source comments).
    assert.match(read(PAGE), /\/\/ pp\n[\s\S]*?\/\/ mp\n[\s\S]*?\/\/ f\n[\s\S]*?\/\/ fff\n/);
    for (const gd of allGuides.map(([, g]) => g)) assert.match(gd.seeing.join(' '), /LOW \(dark blue\) to HIGH \(red\)/);
    assert.match(GUIDES.lab.seeing.join(' '), /pp, mp, f, fff/);
  });
  it('no name the page does not show: the check’s choices carry no visible labels', () => {
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /Display A|Display B/, `${id}: "Display A/B" is only an accessibility label`);
  });
  it('the lab covers BOTH states: the check (first visit) and the done page (revisit, or the primer already passed)', () => {
    // Done branch: chip, a plain MARK REVIEWED while the lab credit is missing,
    // and TEST YOURSELF AGAIN › opening a practice check titled TEST YOURSELF.
    assert.match(SRC, /\{done \? \(\s*<>\s*<View style=\{styles\.doneChip\}>\s*<Text style=\{styles\.doneChipText\}>✓ ORIENTATION COMPLETE<\/Text>/);
    assert.match(SRC, /\{alsoReviewLab && !labReviewed \? \(\s*<GlassButton\s*label="MARK REVIEWED"/);
    assert.match(SRC, /<Text style=\{styles\.practiceBtnText\}>TEST YOURSELF AGAIN ›<\/Text>/);
    assert.match(SRC, /\{practice \? 'TEST YOURSELF' : CHECK_TITLE\}/);
    // Not-done branch: the check, then the gated button.
    assert.match(SRC, /label=\{alsoReviewLab \? 'UNDERSTOOD — MARK REVIEWED' : 'UNDERSTOOD — CONTINUE'\}/);
    const lab = textOf(GUIDES.lab);
    assert.match(lab, /once passed: ✓ ORIENTATION COMPLETE/);
    assert.match(lab, /Passed the color check before[\s\S]*MARK REVIEWED if the lab isn’t marked yet[\s\S]*TEST YOURSELF AGAIN ›/);
    // The primer never shows the done branch: the gate swaps to the chosen screen once the flag is set.
    assert.match(SRC, /if \(done \|\| overlaysSuppressed \|\| sampling\) return <Screen \{\.\.\.props\} \/>;/);
  });
  it('no claim wider than the page: level colours apply where level is shown; the primer gates labs and tools, not only colour screens', () => {
    assert.match(SRC, /whenever level or amplitude is being visualized/);
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /every Academy display|on every Academy/i, `${id}: claims every display uses the scale`);
      assert.doesNotMatch(t, /bigger number[^.]*warmer/i, `${id}: "bigger number = warmer" is false across meters`);
      assert.doesNotMatch(t, /\bhott?(er|est)?\b/i, `${id}: say "warmer", not "hot"`);
      assert.match(t, /Wherever an Academy display shows level or amplitude/);
    }
    assert.doesNotMatch(textOf(GUIDES.primer), /draws sound levels in color/);
  });
  it('first-use terms are glossed: pp…fff, RMS, dB, harmonic, amplitude and level', () => {
    assert.match(textOf(GUIDES.lab), /pp, mp, f, fff \(music marks, very soft to very loud\)/);
    for (const [, gd] of allGuides) {
      const t = textOf(gd);
      assert.match(t, /RMS averages over time/);
      assert.match(t, /dB \(decibels\)/);
      assert.match(t, /harmonic, a weaker tone at 3× its frequency/);
      assert.match(t, /Amplitude is how big the swings are\. Level is that size read as a number/);
    }
    // The page's harmonic is the 3rd (trace(): 2 and 6 cycles across the card).
    assert.match(SRC, /0\.62 \* Math\.sin\(2 \* Math\.PI \* 2 \* x01\) \+ 0\.3 \* Math\.sin\(2 \* Math\.PI \* 6 \* x01\)/);
  });
});

describe('4. the numbers in the guide are the numbers the page draws', () => {
  it('LEVEL METER: PEAK −3 / RMS −14 are illustrative; the guide never gives their gap as the drawn signal’s, nor counts lit segments', () => {
    // The page picks these two values by hand ("Illustrative dBFS values"); the
    // drawn signal's own crest factor is far smaller, and MeterBar ROUNDS
    // (11.25 → 11, 8.5 → 9), so neither "11 dB apart for this signal" nor a
    // segment difference is something the guide may teach (audit 2026-10-31).
    assert.match(read(PAGE), /Illustrative dBFS values/);
    assert.match(SRC, /const PEAK_LEVEL = 1 - 3 \/ METER_RANGE_DB;/);
    assert.match(SRC, /const RMS_LEVEL = 1 - 14 \/ METER_RANGE_DB;/);
    assert.match(SRC, /<MeterBar level=\{PEAK_LEVEL\} label="PEAK" db="−3" \/>/);
    assert.match(SRC, /<MeterBar level=\{RMS_LEVEL\} label="RMS" db="−14" \/>/);
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.ok(t.includes('PEAK (−3) tops RMS (−14)'), `${id}: PEAK above RMS`);
      assert.doesNotMatch(t, /segments?\b/i, `${id}: counts meter segments`);
      assert.doesNotMatch(t, /\bdB apart\b|one signal, \d+ dB/i, `${id}: gives the illustrative gap as the signal’s`);
    }
  });
  it('SPL METER 78 dB SPL is the bigger number but the cooler colour than PEAK −3 — each meter colours its own scale', () => {
    assert.match(SRC, /const SPL_DB = 78;/);
    assert.match(SRC, /const SPL_MIN = 40;/);
    assert.match(SRC, /const SPL_MAX = 100;/);
    assert.match(SRC, /const frac = \(SPL_DB - SPL_MIN\) \/ \(SPL_MAX - SPL_MIN\);/);
    assert.match(SRC, /<Text style=\{\[styles\.splReadout, \{ color: levelColor\(frac\) \}\]\}>/);
    assert.match(SRC, /<Text style=\{\[styles\.meterBarDb, \{ color: levelColor\(level\) \}\]\}>\{db\}<\/Text>/);
    const splFrac = (78 - 40) / (100 - 40);
    const peakLevel = 1 - 3 / 48;
    assert.ok(splFrac < peakLevel, 'SPL sits lower on its own scale than PEAK on its own');
    assert.notEqual(levelColor(splFrac), levelColor(peakLevel));
    for (const [, gd] of allGuides) {
      assert.ok(gd.tryThis.some((x) => /SPL METER’s 78 dB SPL[\s\S]*PEAK −3[\s\S]*cooler color/.test(x)));
      assert.ok(gd.changes.some((x) => /own scale/.test(x)));
    }
  });
  it('OSCILLOSCOPE: the trace is coloured by distance from zero, the same up and down', () => {
    assert.match(SRC, /colors=\{WAVE_LEVEL_STOPS\.map\(\(s\) => s\.color\)\}/);
    const stops = WAVE_LEVEL_STOPS as ReadonlyArray<{ offset: number; color: string }>;
    for (let i = 0; i < stops.length; i++) {
      const j = stops.findIndex((s) => Math.abs(s.offset - (1 - stops[i].offset)) < 1e-9);
      assert.ok(j >= 0 && stops[j].color === stops[i].color, 'symmetric about the zero line');
    }
    assert.equal(stops.find((s) => s.offset === 0.5)?.color, levelColor(0));
    for (const [, gd] of allGuides) assert.ok(gd.tryThis.some((x) => /OSCILLOSCOPE[\s\S]*zero line[\s\S]*top and bottom/.test(x)));
  });
  it('the burst sits at 70% across in WAVEFORM and SPECTROGRAM', () => {
    assert.match(SRC, /if \(t >= 0\.66 && t <= 0\.74\) \{\s*const c = 1 - Math\.abs\(\(t - 0\.7\) \/ 0\.04\);/);
    assert.match(SRC, /m \+= 0\.78 \* gaussian\(t, 0\.7, 0\.022\)/);
    for (const [, gd] of allGuides) assert.ok(gd.tryThis.some((s) => /WAVEFORM[\s\S]*70%[\s\S]*SPECTROGRAM/.test(s)));
  });
  it('a wrong answer keeps the same question and shows the hint + a small ramp', () => {
    assert.match(SRC, /if \(!correct\) \{\s*setWrong\(true\);\s*return;\s*\}/);
    assert.match(SRC, /\{wrong \? \([\s\S]*?<Text style=\{styles\.checkWrong\}>[\s\S]*?<GradientView/);
  });
  it('SPECTRUM (RTA): the tallest band is the low tone; the harmonic is shorter and further right', () => {
    const mags = (SRC.match(/const RTA_MAGS = \[([^\]]+)\]/) ?? ['', ''])[1].split(',').map(Number);
    const top = mags.indexOf(Math.max(...mags));
    assert.equal(top, 3);
    assert.ok(mags[5] < mags[3] && mags[5] > mags[4], 'harmonic band 5 is shorter than the tone, a visible bump to its right');
  });
});

describe('5. wiring and the accuracy-chip decision', () => {
  const lab = (() => {
    const at = SRC.indexOf('export function AmplitudeLabScreen(');
    return SRC.slice(at, SRC.indexOf('export function AmplitudeOrientationGatePage(', at));
  })();
  const gate = (() => {
    const at = SRC.indexOf('export function AmplitudeOrientationGatePage(');
    return SRC.slice(at, SRC.indexOf('export function withAmplitudeOrientation', at));
  })();
  it('imports the shared screen-guide parts and this lab’s guides', () => {
    assert.match(SRC, /import \{ ScreenGuideHintAnchor, ScreenGuideHost, ScreenGuideKey \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(SRC, /import \{ AMPLITUDE_SCREEN_GUIDES \} from '\.\/amplitudeScreenGuides';/);
  });
  it('the lab: host (no regions) wraps the root’s content, hint anchor wraps the header, key at the trailing edge', () => {
    assert.ok(lab.length > 100, 'lab screen found');
    assert.match(lab, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost regions=\{false\} resetKey="lab">\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.gateHeader\}>/);
    assert.match(lab, /<View style=\{styles\.guideKeySlot\}>\s*<ScreenGuideKey title=\{AMP_ORIENT_TITLE\} guide=\{AMPLITUDE_SCREEN_GUIDES\.lab\} \/>/);
    assert.match(lab, /<\/View>\s*<\/ScreenGuideHintAnchor>/);
    assert.match(lab, /<\/ScrollView>\s*<\/ScreenGuideHost>\s*<\/View>/);
    assert.match(SRC, /guideKeySlot: \{ marginLeft: 'auto' \}/);
  });
  it('the primer: same wiring, its own guide', () => {
    assert.ok(gate.length > 100, 'primer found');
    assert.match(gate, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>\s*<ScreenGuideHost regions=\{false\} resetKey="primer">\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.gateHeader\}>/);
    assert.match(gate, /<Text style=\{styles\.gateIntro\}>\{GATE_INTRO\}<\/Text>\s*<ScreenGuideKey title=\{AMP_ORIENT_TITLE\} guide=\{AMPLITUDE_SCREEN_GUIDES\.primer\} \/>/);
    assert.match(gate, /<\/ScrollView>\s*<\/ScreenGuideHost>\s*<\/View>/);
  });
  it('chip decision: a CONCEPT lab — no AccuracyNote on either header; the page keeps its own honesty lines', () => {
    assert.doesNotMatch(SRC, /AccuracyNote/);
    assert.match(SRC, /const HONESTY_LINE = 'Illustrative training graphics — not live measurements\.';/);
    assert.match(SRC, /<Text style=\{styles\.honesty\}>\{HONESTY_LINE\}<\/Text>/);
    assert.match(SRC, /<Text style=\{styles\.conventionTitle\}>\{CONVENTION_TITLE\}<\/Text>/);
    // Nothing on the page reads a microphone or plays sound (what would earn the chip back).
    assert.doesNotMatch(SRC, /useMic|getUserMedia|startFenced|AudioContext|expo-audio/);
  });
});
