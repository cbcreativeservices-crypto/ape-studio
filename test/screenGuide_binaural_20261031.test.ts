/**
 * Screen Guide rollout — Binaural Panner Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot) and
 * test/screenGuide_chain_20261031.test.ts (a LabShell rack lab).
 *
 *   1. every screen the learner reaches has a guide — the three LabShell tabs
 *      EXPLORE (the stage), LEARN (the reading page) and CHECK (the lab has an
 *      understanding check) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the screen's source;
 *   4. the TRY THIS numbers are what the screen prints: its own ITD / ILD
 *      display mirrors and the native bus-norm law, re-run here;
 *   5. wiring: LabShell gets the per-tab guide function, and the chip
 *      decision is pinned — a CONCEPT lab, so `accuracy={false}`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const { BINAURAL_SCREEN_GUIDES, binauralScreenGuide } = await import('../src/screens/lab/binauralScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = BINAURAL_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/BinauralLabScreen.tsx';
const S = code(SCREEN);
const CONTENT = code('src/features/lab/guidedLessons/content.ts');
const LESSON = CONTENT.slice(CONTENT.indexOf('  binaural: {'), CONTENT.indexOf('  modular: {'));
const CHECKS_SRC = code('src/features/lab/understandingChecks.ts');
const CHECK = CHECKS_SRC.slice(CHECKS_SRC.indexOf('const BINAURAL'), CHECKS_SRC.indexOf('];', CHECKS_SRC.indexOf('const BINAURAL')));
const SHELL = [code('src/screens/lab/LabShell.tsx'), code('src/screens/lab/rack/RackUnit.tsx'), code('src/components/LabUnderstandingCheck.tsx'), code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'), code('src/screens/lab/foundations/bits.tsx')].join('\n');

describe('1. every Binaural Panner screen has a complete guide', () => {
  it('one guide per LabShell tab: explore, learn and check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS_SRC, /^\s*binaural: BINAURAL,/m, 'the binaural check is what gives the lab its CHECK tab');
    for (const m of ['explore', 'learn', 'check']) assert.equal(binauralScreenGuide(m), (BINAURAL_SCREEN_GUIDES as any)[m]);
    assert.equal(binauralScreenGuide('other'), undefined);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
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
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v7)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Dolby|Atmos|Sennheiser|Neumann|KU ?100|Apple|Sony|Waves|dearVR|Steam Audio)\b/i, `${id}: a gear/software brand`);
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

describe('3. each guide quotes the screen’s real names', () => {
  const NAMES: Record<string, { names: string[]; in: string }> = {
    explore: {
      in: S + SHELL,
      names: [
        'FRONT 0°', 'BEHIND ±180°', '+90°', '−90°', '4 m',
        'OBJ', 'AZ', 'DIST', 'ITD', 'µs',
        'SOUND OBJECTS', 'SOURCE TYPE', 'TONE FREQUENCY (Hz)', 'TONE', 'PINK', 'WHITE', 'SRC',
        '🎧 HEADPHONES REQUIRED', 'THE TWO CUES', 'THE MIX, HONESTLY', 'Bus norm', 'CHECK YOURSELF', 'LAB NOTES', '⤢  FULL SCREEN',
      ],
    },
    learn: {
      in: SHELL + LESSON,
      names: ['CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'Azimuth', 'Distance', 'Source type', 'Sound objects', 'Tone frequency', 'ⓘ GUIDED LESSON', 'LAB NOTES'],
    },
    check: {
      in: SHELL,
      names: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'Every question answered correctly — this lab is complete.'],
    },
  };
  it('a name list for every screen', () => assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort()));
  for (const [id, { names, in: src }] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]).replace('⤢ FULL SCREEN', '⤢  FULL SCREEN');
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the screen source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the badge is quoted verbatim nowhere it is not drawn; the dock ranges and choices are the screen’s', () => {
    assert.match(S, /const MIN_DIST = 0\.5;/);
    assert.match(S, /const MAX_DIST = 4\.0;/);
    assert.match(S, /const TONE_FREQS = \[250, 440, 880, 2000\] as const;/);
    assert.match(S, /value: \(sel\.azDeg \+ 180\) \/ 360,/);
    assert.match(S, /\[1, 2, 3, 4\]\.map\(\(m\) => \(/);
    const ctl = GUIDES.explore.control.join(' ');
    assert.match(ctl, /AZ fader \(−180° to \+180°, 0° = front\) and DIST fader \(0\.5–4\.0 m\)/);
    assert.match(ctl, /250, 440, 880 or 2000/);
    // the long-press map as the screen wires it: AZ → azimuth, DIST → distance (key + readout); ITD readout → display
    assert.equal((S.match(/helpKey: 'display'/g) ?? []).length, 1);
    assert.equal((S.match(/helpKey: 'azimuth'/g) ?? []).length, 2);
    assert.equal((S.match(/helpKey: 'distance'/g) ?? []).length, 2);
    assert.match(S, /k: 'ITD', v: [^\n]*helpKey: 'display'/);
    assert.match(S, /onGuide: \(\) => openLesson\('display'\)/);
    for (const k of ['azimuth', 'distance', 'display']) {
      assert.match(LESSON, new RegExp(`key: '${k}', name: `), k);
    }
    assert.match(GUIDES.learn.control.join(' '), /long-press OBJ, SRC, AZ or DIST \(key or readout\) for its own entry; the ITD readout opens the display entry/);
  });
  it('the default scene the guide describes is DEFAULT_SOURCES (only object 1 on: pink, −60°, 1.5 m)', () => {
    assert.match(S, /\{ on: true, type: BIN_SRC\.pink, freq: 440, azDeg: -60, dist: 1\.5 \},\s*\{ on: false, type: BIN_SRC\.sine, freq: 440, azDeg: 60, dist: 1\.5 \},\s*\{ on: false, type: BIN_SRC\.white, freq: 440, azDeg: 180, dist: 2\.5 \},/);
    assert.match(S, /const SRC_COLORS = \['#ffc64d', '#5bff85', '#6fa8ff'\] as const;/);
    assert.match(GUIDES.explore.seeing.join(' '), /1 amber, 2 green, 3 blue[\s\S]*only 1 is ON: pink noise at −60°, 1\.5 m/);
    assert.match(S, /<G key=\{i\} opacity=\{s\.on \? 1 : 0\.5\}>/);
    assert.match(S, /r=\{i === selected \? 12 : 10\} stroke=\{col\} strokeWidth=\{i === selected \? 2 : 1\.2\}/);
  });
  it('the CHECK guide names the four questions the check asks', () => {
    for (const id of ["id: 'itd'", "id: 'head-shadow'", "id: 'headphones'", "id: 'no-elevation'"]) assert.ok(CHECK.includes(id), id);
    assert.equal((CHECK.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(GUIDES.check.seeing.join(' '), /four questions: what ITD is, the head shadow, why headphones, and why no up or down/);
    assert.match(CHECK, /at most roughly 0\.7 ms/);
  });
  it('the CHECK tab unmounts on a tab switch, so the guide says unfinished answers clear', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{mode === 'check' \? \(\s*<ScrollView[\s\S]*?<LabUnderstandingCheck/);
    assert.match(GUIDES.check.control.join(' '), /Leaving this tab before every answer is right clears the answers/);
  });
});

// The screen's own display mirrors, re-run (they are module functions inside a
// TSX file, so pin the source and recompute).
const itdUs = (az: number) => {
  const a = Math.abs(az);
  const th = ((a > 90 ? 180 - a : a) * Math.PI) / 180;
  return (0.0875 / 343) * (th + Math.sin(th)) * 1e6;
};
const ildDb = (az: number) => {
  const a = Math.abs(az);
  return 8 * Math.sin(((a > 90 ? 180 - a : a) * Math.PI) / 180);
};

describe('4. the numbers in the guide are the numbers the screen prints', () => {
  it('the mirrors in the source are the ones re-run here (Woodworth ITD, 8·sin θ ILD, front fold)', () => {
    assert.match(S, /const front = a > 90 \? 180 - a : a;/);
    assert.match(S, /return \(0\.0875 \/ 343\) \* \(th \+ Math\.sin\(th\)\) \* 1e6;/);
    assert.match(S, /return 8 \* Math\.sin\(foldTheta\(azDeg\)\);/);
    assert.match(S, /\{ k: 'ITD', v: `\$\{itdUs\(sel\.azDeg\)\.toFixed\(0\)\} µs`/);
    // and the native model agrees (Binaural.hpp)
    const hpp = read('modules/ape-dsp/ios/core/Binaural.hpp');
    assert.match(hpp, /constexpr double kHeadRadiusM = 0\.0875;/);
    assert.match(hpp, /constexpr double kSpeedOfSound = 343\.0;/);
    assert.match(hpp, /constexpr double kMaxIldDb = 8\.0;/);
  });
  it('ITD: 656 µs at ±90°, 0 at 0°, 261 at 30° AND 150°, 381 at 45°, 488 at −60°', () => {
    assert.equal(itdUs(90).toFixed(0), '656');
    assert.equal(itdUs(0).toFixed(0), '0');
    assert.equal(itdUs(30).toFixed(0), '261');
    assert.equal(itdUs(150).toFixed(0), '261');
    assert.equal(itdUs(45).toFixed(0), '381');
    assert.equal(itdUs(-60).toFixed(0), '488');
    const t = GUIDES.explore.tryThis.join(' ');
    assert.match(t, /AZ reads \+90° right and ITD 656 µs[\s\S]*ITD 0 µs/);
    assert.match(t, /\+30° \(ITD 261 µs\), then to \+150°: ITD reads 261 µs again/);
    assert.match(GUIDES.explore.changes.join(' '), /up to 656 µs at ±90°/);
    assert.match(GUIDES.learn.tryThis.join(' '), /\+45°: ITD reads 381 µs — \(0\.0875 ÷ 343\) × \(0\.785 \+ 0\.707\)/);
    assert.equal((Math.PI / 4).toFixed(3), '0.785');
    assert.equal(Math.sin(Math.PI / 4).toFixed(3), '0.707');
    assert.match(GUIDES.check.tryThis.join(' '), /ITD reads 656 µs/);
    // 2026-10-31 review: θ is in radians (foldTheta converts after folding behind to the front).
    assert.match(S, /return \(front \* Math\.PI\) \/ 180;/);
    assert.match(GUIDES.learn.changes.join(' '), /with r = 8\.75 cm and θ in radians \(45° = 0\.785\)/);
  });
  it('2026-10-31 review: the −8 dB far-ear drop is full-range; the darkening is a separate low-pass', () => {
    const hpp = readFileSync('modules/ape-dsp/ios/core/Binaural.hpp', 'utf8').replace(/\r\n/g, '\n');
    assert.match(hpp, /const double ild = std::pow\(10\.0, -binaural::kMaxIldDb \* std::sin\(theta\) \/ 20\.0\);/);
    assert.match(hpp, /const double shadowHz = binaural::kShadowMaxHz \*/);
    assert.match(GUIDES.explore.changes.join(' '), /quieter \(a simple full-range drop, to −8 dB at the side\) and darker: the head blocks highs/);
    assert.match(GUIDES.check.tryThis.join(' '), /−6\.9 dB — the level half of the head-shadow cue/);
    assert.doesNotMatch(GUIDES.check.tryThis.join(' '), /0\.7 ms/, 'TRY THIS runs before the check: never quote an answer explanation');
  });
  it('2026-10-31 review: object 1 starts as PINK at 440 Hz, so the 250 Hz A/B names the TONE FREQUENCY step', () => {
    assert.match(S, /\{ on: true, type: BIN_SRC\.pink, freq: 440, azDeg: -60, dist: 1\.5 \}/);
    assert.match(GUIDES.learn.tryThis.join(' '), /set SRC to TONE, pick 250 under TONE FREQUENCY \(Hz\), then switch to PINK/);
    assert.match(S, /const \[running, setRunning\] = useState\(false\);/);
  });
  it('the direction words the AZ readout prints: +90° right, +30° front-right, +150° rear-right', () => {
    assert.match(S, /if \(a < 65\) return 'front-right';\s*if \(a < 115\) return 'right';\s*if \(a < 155\) return 'rear-right';/);
    assert.match(S, /const azSign = sel\.azDeg >= 0 \? '\+' : '';/);
  });
  it('ILD: far-ear level 0.0 dB at 0°, −6.9 dB at 60°, −8.0 dB at 90° (THE TWO CUES)', () => {
    assert.match(S, /\{ildDb\(sel\.azDeg\) >= 0\.05 \? `−\$\{ildDb\(sel\.azDeg\)\.toFixed\(1\)\}` : '0\.0'\} dB/);
    assert.equal(ildDb(60).toFixed(1), '6.9');
    assert.equal(ildDb(90).toFixed(1), '8.0');
    assert.ok(ildDb(0) < 0.05);
    assert.match(GUIDES.check.tryThis.join(' '), /far-ear level 0\.0 → −6\.9 dB/);
    assert.match(GUIDES.explore.changes.join(' '), /to −8 dB at the side/);
  });
  it('Bus norm 0.79 with object 1 alone at 0.5 m (and none at the default 1.5 m) — the native 1 ÷ max(1, Σ ÷ cap) law', () => {
    const hpp = read('modules/ape-dsp/ios/core/Binaural.hpp');
    assert.match(hpp, /constexpr double kCapDb = -12\.0;/);
    assert.match(hpp, /const double dGain = 1\.0 \/ \(dist < binaural::kMinDist \? binaural::kMinDist : dist\);/);
    assert.match(hpp, /const double norm = 1\.0 \/ \(sumPeak \/ capPeak > 1\.0 \? sumPeak \/ capPeak : 1\.0\);/);
    assert.match(S, /const SRC_LEVEL_DB = -16;/);
    assert.match(S, /\{busNorm < 0\.999\s*\? ` Bus norm \$\{busNorm\.toFixed\(2\)\}/);
    const lvl = 10 ** (-16 / 20);
    const cap = 10 ** (-12 / 20);
    const norm = (dists: number[]) => 1 / Math.max(1, dists.reduce((a, d) => a + lvl / d, 0) / cap);
    assert.equal(norm([0.5]).toFixed(2), '0.79');
    assert.ok(norm([1.5]) >= 0.999, 'no Bus norm line at the default distance');
    assert.match(GUIDES.explore.tryThis.join(' '), /only object 1 on and ▶ playing, slide DIST to 0\.5 m: THE MIX, HONESTLY shows Bus norm 0\.79/);
    // The DIST fader reaches exactly 0.5 m (snapped to 0.1 m).
    assert.match(S, /dist: Math\.round\(\(MIN_DIST \+ v \* \(MAX_DIST - MIN_DIST\)\) \* 10\) \/ 10,/);
  });
  it('distance law: inverse distance (6 dB per halving), and the head the ITD assumes is 17.5 cm across', () => {
    assert.equal((20 * Math.log10(2)).toFixed(1), '6.0');
    assert.equal(2 * 8.75, 17.5);
    assert.match(GUIDES.explore.changes.join(' '), /half the distance, 6 dB louder/);
  });
});

describe('5. wiring and the accuracy-chip decision', () => {
  it('LabShell gets the per-tab guide function from binauralScreenGuides', () => {
    assert.match(S, /import \{ binauralScreenGuide \} from '\.\/binauralScreenGuides';/);
    assert.match(S, /<LabShell[\s\S]*?guide=\{binauralScreenGuide\}/);
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /typeof guide === 'function' \? guide\(mode\)/);
    assert.match(shell, /<ScreenGuideHost resetKey=\{mode\} regions=\{!!rack && mode === 'explore'\}>/);
    assert.match(S, /rack=\{\{/);
  });
  it('a CONCEPT lab: a synthesized head model, no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(S, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(S, /<AccuracyNote/);
    const calls = new Set([...S.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^bin[A-Z]\w*$|^(isAvailable|engineVersion|wave2Available)$/, `ApeDsp.${c} — not a binaural-bus call`);
    assert.doesNotMatch(S, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
    // The honesty disclosure stays on the faceplate.
    assert.match(S, /badge: 'SIMPLIFIED BINAURAL — NOT MEASURED HRTF'/);
  });
});

describe('2026-10-31 verified fix: the low-tone caption matches what the model plays', () => {
  it('the ILD is broadband (8·sinθ dB at every frequency), so the copy separates real hearing from this model', () => {
    // Native truth: the far-ear level drop has no frequency term.
    const hpp = read('modules/ape-dsp/ios/core/Binaural.hpp');
    assert.match(hpp, /constexpr double kMaxIldDb = 8\.0;/);
    assert.match(hpp, /const double ild = std::pow\(10\.0, -binaural::kMaxIldDb \* std::sin\(theta\) \/ 20\.0\);/);
    // At ±90° and TONE 250: broadband −8.0 dB, shadow one-pole at 1.2 kHz adds only ≈ −0.18 dB.
    const fs = 48000, k = 1 - Math.exp((-2 * Math.PI * 1200) / fs), a = 1 - k, w = (2 * Math.PI * 250) / fs;
    const shadowDb = 20 * Math.log10(k / Math.sqrt(1 - 2 * a * Math.cos(w) + a * a));
    assert.ok(Math.abs(20 * Math.log10(10 ** (-8 / 20)) + 8) < 1e-9);
    assert.ok(shadowDb > -0.25 && shadowDb < -0.1, `shadow at 250 Hz ${shadowDb.toFixed(3)} dB`);
    // Screen caption and lesson COMMON MISTAKES say so honestly.
    assert.match(S, /In real hearing, below ~1\.5 kHz the head casts almost no shadow, so timing \(ITD\) does most of the work, and it does it well\. This simplified model still applies its level drop \(to −8 dB at the side\) at every frequency, so here a low tone carries a level cue too\./);
    assert.doesNotMatch(S, /so ITD does the work/);
    const lesson = read('src/features/lab/guidedLessons/content.ts');
    assert.match(lesson, /in real hearing a low tone has almost no level difference between the ears, so it leans on timing[^']*This simplified model still applies its level drop \(to −8 dB at the side\) at every frequency/);
    assert.doesNotMatch(lesson, /so it leans on timing alone/);
  });
});
