/**
 * Screen Guide rollout — Harmonic Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell lab).
 *
 *   1. every screen the learner reaches has a guide — EXPLORE in both of its
 *      MODEs (ANALYTIC MODEL → `explore`, REAL SIGNAL → `live`), LEARN and
 *      CHECK — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget;
 *   3. the guide quotes the screen's REAL names (pinned in both);
 *   4. the TRY THIS numbers are what the bezel prints, re-run through
 *      harmonicModel exactly as HarmonicsView computes them (THD from thd(),
 *      CREST from crestFactorDb(synthWaveform(model, 240, 3)), SLOPE from
 *      envelopeSlopeDbPerOct with the ≥ 3-harmonic guard), and the marker
 *      labels come from noteInfo; the REAL SIGNAL guide quotes no measured
 *      figure;
 *   5. wiring: HarmonicsView hands `view` to its host, LabShell gets a mode
 *      → guide function, and the chip decision is pinned — KEPT: REAL SIGNAL
 *      opens the live microphone (owner rule: live-mic tools keep it).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { HARMONIC_SCREEN_GUIDES, harmonicScreenGuide } = await import('../src/screens/lab/harmonicScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/screens/lab/harmonicModel.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = HARMONIC_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const VIEW = 'src/screens/lab/HarmonicsView.tsx';
const HOST = 'src/screens/lab/HarmonicLabScreen.tsx';
const CHECKS = code('src/features/lab/understandingChecks.ts');
const SRC = [
  code(VIEW),
  code(HOST),
  code('src/screens/lab/HarmonicStems.tsx'),
  code('src/screens/lab/HarmonicCard.tsx'),
  code('src/screens/lab/harmonicModel.ts'),
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/features/audio/FeedbackAllowRow.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/features/lab/guidedLessons/content.ts'),
  code('src/components/LabUnderstandingCheck.tsx'),
  code('src/screens/lab/labCatalog.ts'),
].join('\n');

describe('1. every Harmonic screen has a complete guide', () => {
  it('EXPLORE per MODE (model + live), LEARN and CHECK (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(HARMONIC_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn', 'live']);
    assert.match(CHECKS, /^\s*harmonic: HARMONIC,$/m);
    assert.equal((CHECKS.match(/const HARMONIC: readonly Q\[\] = \[([\s\S]*?)\n\];/)![1].match(/^\s{4}id: '/gm) ?? []).length, 4, 'four questions — the CHECK guide says four');
    assert.equal(harmonicScreenGuide('explore', 'model'), HARMONIC_SCREEN_GUIDES.explore);
    assert.equal(harmonicScreenGuide('explore', 'live'), HARMONIC_SCREEN_GUIDES.live);
    for (const v of ['model', 'live'] as const) {
      assert.equal(harmonicScreenGuide('learn', v), HARMONIC_SCREEN_GUIDES.learn);
      assert.equal(harmonicScreenGuide('check', v), HARMONIC_SCREEN_GUIDES.check);
      assert.equal(harmonicScreenGuide('other', v), undefined);
    }
    // the MODE key's two options are the two EXPLORE screens
    const v = code(VIEW);
    assert.match(v, /\{ id: 'model', label: 'ANALYTIC MODEL',/);
    assert.match(v, /\{ id: 'live', label: 'REAL SIGNAL',/);
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
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend", no brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|ape-dsp|HV-\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(iZotope|RX|Moog|Roland|Korg|Yamaha|Fender|Marshall|Boss|Ibanez|Tube Screamer)\b/, `${id}: a gear maker/model name`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length})`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const NAMES: Record<string, string[]> = {
    explore: [
      // bezel, badge, dock keys + options
      'F0', 'THD', 'CREST', 'SLOPE', 'ANALYTIC MODEL — NOT A MEASUREMENT', 'PRESET', 'THD CALC', 'AXIS', 'MODE', 'LOG ♪', 'LIN',
      'ANALYTIC MODEL', 'REAL SIGNAL', 'RESTORE PRESET',
      'SINE', 'SQUARE', 'TRIANGLE', 'SAW', 'PULSE', 'SYM CLIP', 'ASYM CLIP', 'SOFT SAT', 'HARD CLIP',
      // the stem editor, card, detail sheet and well chips
      'LAB NOTES', '▶ SOLO', 'POLARITY +180°', 'MUTE', 'GROUPS & OVERLAYS', 'NORMALIZE', 'SNAPSHOT A', 'A/B GHOST', 'MUTE EVEN',
      // catalog placement
      'Oscillators', 'Noise', 'FM Synthesis', 'Distortion',
    ],
    live: ['REAL SIGNAL', 'F0', 'MIC', 'LIVE', 'START…', 'OFF', 'TONE', 'ON', 'MUTED', 'MAX', 'REAL SIGNAL — dBFS · UNCALIBRATED', '⚠ ALLOW SPEAKER WHILE MIC IS ON', 'LAB NOTES', 'AXIS', 'LOG ♪', 'LIN', 'MODE', 'ANALYTIC MODEL', 'PRESET', 'THD CALC'],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'PULSE', 'NORMALIZE', 'SINE', 'POLARITY +180°', 'THD', 'CREST', 'SLOPE', 'MODE', 'AXIS', 'PRESET'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'F0', 'MUTE EVEN', 'SAW', 'SQUARE', 'PRESET'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(HARMONIC_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the presets, defaults, fader range and dock per MODE are the ones the guides state', () => {
    const v = code(VIEW);
    assert.deepEqual(M.PRESETS.map((p: { label: string }) => p.label), ['SINE', 'SQUARE', 'TRIANGLE', 'SAW', 'PULSE', 'SYM CLIP', 'ASYM CLIP', 'SOFT SAT', 'HARD CLIP']);
    assert.match(v, /useState<ViewMode>\('model'\)/);
    assert.match(v, /useState<AxisMode>\('log'\)/);
    assert.match(v, /useState<PresetKey>\('saw'\)/);
    assert.match(v, /const F0_MIN = 60;\s*const F0_MAX = 300;\s*const DEFAULT_F0 = 100;/);
    // PRESET + THD CALC only in model view; F0 · AXIS · MODE in both
    assert.match(v, /\.\.\.\(view === 'model'\s*\? \(\[\s*\{\s*kind: 'options',\s*id: 'preset'/);
    // live bezel
    assert.match(v, /\{ k: 'MIC', v: running \? 'LIVE' : state === 'starting' \? 'START…' : 'OFF', helpKey: 'view' \}/);
    assert.match(v, /\{ k: 'TONE', v: genRunning \? 'ON' : feedbackAllowed \? 'OFF' : 'MUTED' \}/);
    // history ≈ 18 s; waveform strip = 3 cycles; PULSE fixed at 25 %
    assert.match(v, /const SPEC_POLL_MS = 150;/);
    assert.match(v, /const HIST_COLS = 120;/);
    assert.match(v, /const WAVE_CYCLES = 3;/);
    assert.equal(M.PULSE_DUTY, 0.25);
    // live mode plays the fundamental alone, a sine at −20 dBFS
    assert.match(v, /const GEN_LEVEL_DB = -20;/);
    assert.match(v, /it plays the fundamental as a sine \(/);
    // a mode switch stops everything
    assert.match(v, /stopAll\(\); \/\/ mode switch always silences \+ stops capture/);
  });
});

describe('4. the TRY THIS numbers are what the bezel prints', () => {
  const v = code(VIEW);
  it('the readouts are computed the way the guide’s numbers were', () => {
    assert.match(v, /const WAVE_POINTS = 240;/);
    assert.match(v, /const modelWave = useMemo\(\(\) => synthWaveform\(model, WAVE_POINTS, WAVE_CYCLES\), \[model\]\);/);
    assert.match(v, /const modelCrestDb = useMemo\(\(\) => crestFactorDb\(modelWave\), \[modelWave\]\);/);
    assert.match(v, /const modelThd = useMemo\(\(\) => thd\(model\), \[model\]\);/);
    assert.match(v, /slope: qualifying >= MIN_SLOPE_HARMONICS \? envelopeSlopeDbPerOct\(model\) : null/);
    assert.match(v, /v: modelThd\.pct != null \? `\$\{modelThd\.pct\.toFixed\(1\)\} %` : '—'/);
    assert.match(v, /v: modelCrestDb != null \? `\$\{modelCrestDb\.toFixed\(1\)\} dB` : '—'/);
    assert.match(v, /v: slopeInfo\.slope != null \? slopeInfo\.slope\.toFixed\(1\) : '—'/);
  });
  type H = { n: number; amp: number; phaseDeg: number; enabled: boolean; muted: boolean };
  const read3 = (set: H[]) => {
    const q = set.filter((h) => M.effectiveAmp(h) > M.AMP_FLOOR).length;
    const t = M.thd(set).pct as number | null;
    return {
      thd: t == null ? '—' : t.toFixed(1),
      crest: (M.crestFactorDb(M.synthWaveform(set, 240, 3)) as number).toFixed(1),
      slope: q >= 3 ? (M.envelopeSlopeDbPerOct(set) as number).toFixed(1) : '—',
    };
  };
  it('SAW 75.2 % / 5.8 dB → MUTE EVEN 43.8 % / 1.6 dB = SQUARE', () => {
    const saw = read3(M.buildPreset('saw'));
    assert.deepEqual([saw.thd, saw.crest, saw.slope], ['75.2', '5.8', '-6.0']);
    const muted = read3(M.buildPreset('saw').map((h: H) => ({ ...h, muted: h.n % 2 === 0 })));
    const sq = read3(M.buildPreset('square'));
    assert.deepEqual([muted.thd, muted.crest], ['43.8', '1.6']);
    assert.deepEqual(sq, muted, 'the same numbers as SQUARE');
  });
  it('TRIANGLE: SLOPE −12.0 against SQUARE’s −6.0, THD 12.1 %', () => {
    const tri = read3(M.buildPreset('triangle'));
    assert.deepEqual([tri.slope, tri.thd], ['-12.0', '12.1']);
    assert.equal(read3(M.buildPreset('square')).slope, '-6.0');
  });
  it('SAW, H2 POLARITY +180°: CREST 4.4 dB, THD still 75.2 %', () => {
    const hs = code('src/screens/lab/HarmonicStems.tsx');
    assert.match(hs, /label="POLARITY \+180°"/);
    const flipped = M.buildPreset('saw').map((h: H) => (h.n === 2 ? { ...h, phaseDeg: (h.phaseDeg + 180) % 360 } : h));
    const r = read3(flipped);
    assert.deepEqual([r.crest, r.thd], ['4.4', '75.2']);
  });
  it('marker labels at F0 100 Hz: "1: 100 G2 +35¢" and "3: 300 …" (the label format is n: Hz note ±¢)', () => {
    assert.match(v, /\{`\$\{m\.n\}: \$\{hzShort\(m\.hz\)\} \$\{m\.note\.label\} \$\{c >= 0 \? '\+' : ''\}\$\{c\}¢`\}/);
    const a = M.noteInfo(100);
    assert.equal(`1: 100 ${a.label} ${a.cents >= 0 ? '+' : ''}${a.cents}¢`, '1: 100 G2 +35¢');
    assert.equal(3 * 100, 300);
    assert.match(HARMONIC_SCREEN_GUIDES.check.tryThis[0], /3: 300/);
  });
  it('the REAL SIGNAL guide quotes no measured figure (it depends on the phone, the volume and the room)', () => {
    const t = textOf(GUIDES.live).replace(/−20 dBFS|60–300 Hz|18 s|2×, 3×/g, '');
    assert.doesNotMatch(t, /\d+(\.\d+)?\s*(dB|%|Hz)\b/, 'a number in the live guide beyond the screen’s own settings');
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  const v = code(VIEW);
  const h = code(HOST);
  it('HarmonicsView hands `view` to its host; LabShell gets a mode → guide function closing over it', () => {
    assert.match(v, /export type HarmonicRackParts = \{[\s\S]*?\n\s*view: ViewMode;\n\};/);
    assert.match(v, /return children\(\{ rack, headerAction, renderWell, view \}\);/);
    assert.match(h, /import \{ harmonicScreenGuide \} from '\.\/harmonicScreenGuides';/);
    assert.match(h, /\{\(\{ rack, headerAction, renderWell, view \}\) => \(/);
    assert.match(h, /<LabShell[\s\S]*?guide=\{\(mode\) => harmonicScreenGuide\(mode, view\)\}/);
  });
  it('chip KEPT: REAL SIGNAL opens the live microphone and prints measured dBFS — the owner’s live-mic rule', () => {
    assert.doesNotMatch(h, /accuracy=\{false\}/, 'the Harmonic lab keeps its AccuracyNote');
    assert.match(code('src/screens/lab/LabShell.tsx'), /accuracy = true,/);
    // the live path: a real mic capture through useDspEngine, a measured MAX readout
    assert.match(v, /const \{ state, frames, start, stop, lastError, meterFlags \} = useDspEngine\(cfg, \{ meter: true, waveform: true \}\);/);
    assert.match(v, /\{ k: 'MAX', v: observedMax != null \? `\$\{observedMax\.toFixed\(0\)\} dB` : '—' \}/);
    assert.match(v, /: 'REAL SIGNAL — dBFS · UNCALIBRATED',/);
  });
});

describe('6. review round 2026-10-31 — each fix re-proved from the code', () => {
  const v = code(VIEW);
  const g = HARMONIC_SCREEN_GUIDES;
  it('F0 does NOT move the bands: both axes are F0-relative, so a marker’s y has no F0 in it', () => {
    assert.match(v, /const AXIS_MULT = 13;/);
    assert.match(v, /const LOG_LO_DIV = 1\.5;/);
    assert.match(v, /const LOG_MULT = 13\.5;/);
    const yLog = (n: number, f0: number) => 1 - (Math.log2(n * f0) - Math.log2(f0 / 1.5)) / (Math.log2(13.5 * f0) - Math.log2(f0 / 1.5));
    const yLin = (n: number, f0: number) => 1 - (n * f0) / (13 * f0);
    for (const n of [1, 3, 7, 12]) {
      assert.ok(Math.abs(yLog(n, 60) - yLog(n, 300)) < 1e-12);
      assert.ok(Math.abs(yLin(n, 60) - yLin(n, 300)) < 1e-12);
    }
    // live: the Nyquist clamp never bites inside the fader range (13.5 × 300 = 4,050 Hz)
    assert.ok(13.5 * 300 < 22050 / 2);
    assert.match(g.explore.changes[0], /axis follows F0: bands stay put/);
    assert.match(g.live.control[2], /the axis follows it, so the markers keep their places/);
    assert.doesNotMatch(textOf(GUIDES.explore), /F0 slides them/);
  });
  it('a room adds no harmonics — only the speaker, the mic or a rattle', () => {
    assert.doesNotMatch(textOf(GUIDES.live), /the room or the mic/);
    assert.match(g.live.changes[0], /by the speaker or the mic, or something rattling nearby\. A room changes levels but adds no new frequencies\./);
  });
  it('▶ starts the tone only once the override is ticked', () => {
    assert.match(v, /void start\(\);\s*if \(isFeedbackAllowed\(\)\) void startTone\(\);/);
    assert.match(g.live.control[0], /starts the mic \(and the tone, once the override is ticked\)/);
  });
  it('first live experiment starts at the top of the F0 fader and is hedged (speaker high-pass at 100 Hz ≈ −7.8 dB)', () => {
    const hpfDb = (f: number) => { const r4 = (f / 150) ** 4; return 10 * Math.log10(r4 / (1 + r4)); };
    assert.equal(hpfDb(100).toFixed(1), '-7.8');
    assert.ok(hpfDb(300) > -0.3);
    assert.match(g.live.tryThis[0], /^Push the F0 fader to the top/);
    assert.match(g.live.tryThis[0], /usually lights at marker 1/);
  });
  it('THD is overtones against the FUNDAMENTAL (not a share — it can pass 100 %); CREST is peak against RMS', () => {
    const t = textOf(GUIDES.explore);
    assert.doesNotMatch(t, /overtone share|how much is overtone|peak vs average/);
    assert.match(t, /THD \(overtones vs the fundamental, %\)/);
    assert.match(t, /CREST \(peak vs the effective, RMS level, dB\)/);
    type H = { n: number; amp: number; phaseDeg: number; enabled: boolean; muted: boolean };
    const loud = M.buildPreset('sine').map((h: H) => (h.n === 2 || h.n === 3 ? { ...h, amp: 1 } : h));
    assert.ok((M.thd(loud).pct as number) > 100, 'THD > 100 % — so it is not a share of the whole');
    assert.match(code('src/screens/lab/harmonicModel.ts'), /return 20 \* Math\.log10\(peak \/ Math\.sqrt\(sumSq \/ waveform\.length\)\);/);
  });
  it('no promised "link" to the Distortion lab (none exists on this screen)', () => {
    assert.doesNotMatch(textOf(GUIDES.explore), /link to the Distortion/);
    assert.doesNotMatch(v + code(HOST), /DistortionLab|navigate\(/);
  });
  it('the POLARITY experiments close the detail sheet first (it is a modal over the display)', () => {
    const hs = code('src/screens/lab/HarmonicStems.tsx');
    assert.match(hs, /<Modal accessibilityViewIsModal visible transparent/);
    assert.match(hs, /<Text style=\{styles\.doneText\}>DONE<\/Text>/);
    assert.match(g.explore.tryThis[2], /POLARITY \+180°, then DONE:/);
    assert.match(g.learn.tryThis[1], /POLARITY \+180°, then DONE:/);
  });
  it('the square recipe in dB re full scale: H3 −9.5, H5 −14, H7 −17 (1/3, 1/5, 1/7 of a 0 dB H1)', () => {
    assert.equal((20 * Math.log10(1 / 3)).toFixed(1), '-9.5');
    assert.equal((20 * Math.log10(1 / 5)).toFixed(0), '-14');
    assert.equal((20 * Math.log10(1 / 7)).toFixed(0), '-17');
    type H = { n: number; amp: number };
    assert.equal(M.buildPreset('sine').find((h: H) => h.n === 1).amp, 1, 'SINE’s H1 sits at 0 dB re full scale');
    assert.match(code('src/screens/lab/harmonicModel.ts'), /return Math\.max\(DBC_FLOOR_DB, 20 \* Math\.log10\(h\.amp\)\);/);
    assert.match(g.learn.tryThis[0], /drag H3 to about −9\.5 dB, H5 to −14 and H7 to −17 \(1\/3, 1\/5, 1\/7 of H1\)/);
  });
  it('LEARN names the lesson entry View (MODEL / LIVE) and lists only the readouts/chips that long-press', () => {
    assert.match(code('src/features/lab/guidedLessons/content.ts'), /name: 'View \(MODEL \/ LIVE\)'/);
    assert.match(g.learn.seeing[1], /View \(MODEL \/ LIVE\)/);
    assert.match(v, /<Chip label="NORMALIZE" selected=\{false\} onPress=\{normalizeModel\} \/>/);
    assert.match(v, /<Chip label="SNAPSHOT A" selected=\{false\} onPress=\{takeSnapshot\} \/>/);
    assert.match(g.learn.control[2], /the F0, CREST or SLOPE readout, or an ODD\/EVEN, ENVELOPE, SPACING, SOLO or MUTE chip/);
  });
  it('CHECK: partial answers do not survive leaving the tab, and the guide says so', () => {
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), /const \[correct, setCorrect\] = useState<Set<string>>/);
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{mode === 'check' \? \(/);
    const t = textOf(GUIDES.check);
    assert.doesNotMatch(t, /even if you come back later|nothing is lost/);
    assert.match(t, /A right answer stays right while you stay on this tab/);
  });
});
