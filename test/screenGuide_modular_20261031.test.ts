/**
 * Screen Guide rollout — Modular Synth Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (the LabShell lab).
 *
 *   1. every screen the learner reaches in this LabShell lab has a guide —
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the four
 *      Modular understanding questions + the FINISH link under them) — all
 *      five sections, the copy rules, 2–3 TRY THIS experiments; the "Where
 *      you are" layer is its own modal with no ⓘ, so no guide;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source (comments stripped);
 *   4. the TRY THIS numbers and states are what the screen draws: the
 *      spectrum math (spectrumMath.ts, pinned to the engine's filter damping
 *      in Modular.hpp), the patch presets, the bezel short names, the cables;
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
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { MODULAR_SCREEN_GUIDES, modularScreenGuide } = await import('../src/screens/lab/modular/modularScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { harmonicAmp, svfLowpassMag } = await import('../src/screens/lab/modular/spectrumMath.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = MODULAR_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/ModularLabScreen.tsx';
const CHECKS = 'src/features/lab/understandingChecks.ts';
const SRC = [
  code(SCREEN),
  code('src/screens/lab/modular/ModularSpectrum.tsx'),
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/features/lab/guidedLessons/content.ts'),
  code('src/components/LabUnderstandingCheck.tsx'),
  code('src/screens/lab/kit/LabEndScreen.tsx'),
].join('\n');

describe('1. every Modular screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has authored questions)', () => {
    assert.deepEqual(Object.keys(MODULAR_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    const checks = code(CHECKS);
    assert.match(checks, /^\s*modular: MODULAR,$/m);
    assert.equal(modularScreenGuide('explore'), MODULAR_SCREEN_GUIDES.explore);
    assert.equal(modularScreenGuide('learn'), MODULAR_SCREEN_GUIDES.learn);
    assert.equal(modularScreenGuide('check'), MODULAR_SCREEN_GUIDES.check);
    assert.equal(modularScreenGuide('other'), undefined);
    const q = checks.match(/const MODULAR: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
    assert.equal((q.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(MODULAR_SCREEN_GUIDES.check.seeing[0], /four questions/);
    // The CHECK tab ends on the lab's FINISH link (checkEnd) → the guide names it.
    assert.match(code(SCREEN), /checkEnd=\{<ModularLabEnd onOpen=\{stop\} \/>\}/);
    assert.match(MODULAR_SCREEN_GUIDES.check.seeing.join(' '), /FINISH · SEE WHAT’S LEFT › opens Where you are/);
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
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v7)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Moog|Buchla|Doepfer|Make Noise|Mutable|Roland|TB-303|303|Korg|ARP|Behringer)\b/, `${id}: a gear maker/model name`);
    }
  });
  it('the CHECK guide never gives an answer away', () => {
    const t = textOf(GUIDES.check);
    for (const answer of ['no harmonics above the fundamental', 'Vibrato', 'Envelope → filter cutoff', 'filter cutoff', 'Oscillator (VCO) → filter (VCF)', 'VCO → VCF']) {
      assert.ok(!t.includes(answer), `the CHECK guide quotes the answer "${answer}"`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200', () => {
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
    assert.deepEqual(over, []);
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const NAMES: Record<string, string[]> = {
    explore: [
      // the case: group labels, module names
      'CONTROL SOURCES (CV)', 'AUDIO PATH → OUT', 'SEQ', 'LFO', 'ENV', 'VCO', 'VCF', 'VCA', 'OUT',
      // bezel keys + values
      'PATCH', 'CUSTOM', 'RES', '→CUT', '→PIT',
      // dock: fader, trays, chips
      'CUTOFF', 'MOD', 'RAW DRONE', 'ACID BASS', 'WOBBLE', 'VIBRATO LEAD', 'TREMOLO', 'SAW', 'SQUARE', 'TRI', 'SINE',
      'RES MAX', 'PLUCK', 'PAD', 'ORGAN', 'ENV→VCF OFF', '+50%', '+100%', 'DEPTH 0', '→PITCH', '→CUTOFF', '→AMP', 'SEQ ON', '✕',
      // the well
      'THE VOICE, AS SOUND',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'VCO', 'VCF', 'VCA', 'LFO', 'SINE', 'CUTOFF', 'ACID BASS', 'MAX', 'ENV'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'FINISH · SEE WHAT’S LEFT ›', 'Where you are', 'LEARN', 'EXPLORE', 'AUDIO PATH → OUT', 'WOBBLE', 'MOD'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(MODULAR_SCREEN_GUIDES).sort());
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
  it('the dock options the guide lists are exactly the screen’s', () => {
    const s = code(SCREEN);
    const patches = [...s.matchAll(/key: '[a-z]+',\s*label: '([A-Z ]+)',\s*why:/g)].map((m) => m[1]);
    assert.deepEqual(patches, ['RAW DRONE', 'ACID BASS', 'WOBBLE', 'VIBRATO LEAD', 'TREMOLO']);
    assert.match(s, /const LFO_RATES = \[0\.5, 2, 6\] as const;/);
    assert.match(s, /const SEQ_RATES = \[2, 4, 8\] as const;/);
    assert.match(s, /label=\{`\$\{r\} Hz`\}/);
    assert.match(s, /label=\{`\$\{r\}\/s`\}/);
    assert.match(s, /const STEP_CYCLE = \[0, 3, 5, 7, 12, -1\] as const;/);
    assert.match(s, /label=\{s < 0 \? '✕' : `\+\$\{s\}`\}/);
    assert.equal((s.match(/steps: \[0, 0, 7, 0, 3, 0, 12, -1\]/g) ?? []).length, 1, 'eight steps');
    const ctl = MODULAR_SCREEN_GUIDES.explore.control.join(' ');
    assert.match(ctl, /LFO 0\.5, 2 or 6 Hz/);
    assert.match(ctl, /2\/s, 4\/s or 8\/s, and eight steps \(tap to cycle, ✕ = rest\)/);
    // the case: seven modules, left → right
    const mods = [...s.matchAll(/key: '[a-z]+',\s*name: '([A-Z]+)',\s*hp:/g)].map((m) => m[1]);
    assert.deepEqual(mods, ['SEQ', 'LFO', 'ENV', 'VCO', 'VCF', 'VCA', 'OUT']);
    assert.match(MODULAR_SCREEN_GUIDES.explore.seeing[0], /seven modules/);
    // the cable colours the guide names (SEQ red, LFO blue, ENV green)
    assert.match(s, /const LFO_COLOR = '#6fa8ff';/);
    assert.match(s, /const ENV_COLOR = '#5bff85';/);
    assert.match(s, /SEQ red, LFO blue, ENV green/);
  });
});

describe('4. the TRY THIS numbers and states are what the screen draws', () => {
  const s = code(SCREEN);
  const dB = (a: number) => 20 * Math.log10(a);
  it('the spectrum math is the engine’s filter, and the screen feeds it the lab’s numbers', () => {
    assert.match(read('modules/ape-dsp/ios/core/Modular.hpp'), /const double kDamp = 2\.0 - 1\.6 \* resCur_;/);
    assert.match(code('src/screens/lab/modular/spectrumMath.ts'), /const k = 2 - 1\.6 \* Math\.max\(0, Math\.min\(1, res\)\);/);
    assert.match(s, /const BASE_FREQ = 110;/);
    assert.match(s, /<ModularSpectrum shape=\{patch\.shape\} f0=\{BASE_FREQ\} cutoff=\{patch\.cutoff\} res=\{patch\.res\}/);
    // CUTOFF lane: 250 Hz … 8.0 kHz
    assert.match(s, /const CUT_MIN = 250;/);
    assert.match(s, /const CUT_MAX = 8000;/);
    assert.match(s, /const fmtCut = \(hz: number\) => \(hz >= 1000 \? `\$\{\(hz \/ 1000\)\.toFixed\(1\)\} kHz` : `\$\{Math\.round\(hz\)\} Hz`\);/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.control.join(' '), /250 Hz to 8\.0 kHz/);
  });
  it('EXPLORE 1 + LEARN 1: SINE’s one bar drops only ~1.5 dB from 8.0 kHz to 250 Hz; on SAW many bars lose far more', () => {
    assert.equal(harmonicAmp(3, 1), 1);
    for (let n = 2; n < 20; n++) assert.equal(harmonicAmp(3, n), 0, 'a sine has one harmonic');
    const at8k = dB(svfLowpassMag(110, 8000, 0));
    const at250 = dB(svfLowpassMag(110, 250, 0));
    assert.equal(Math.abs(at8k).toFixed(1), '0.0');
    assert.equal(at250.toFixed(1), '-1.5');
    assert.match(MODULAR_SCREEN_GUIDES.explore.tryThis[0], /drops only about 1\.5 dB/);
    // SAW at 250 Hz: every harmonic from the 3rd up loses more than 6 dB
    for (let n = 3; n * 110 <= 12000; n++) assert.ok(dB(svfLowpassMag(n * 110, 250, 0)) < -6, `harmonic ${n}`);
    assert.ok(harmonicAmp(0, 5) > 0, 'a saw has them to lose');
  });
  it('EXPLORE 2: the filter curve at the CUTOFF line is −6 dB at RES 0 and about +8 dB at RES MAX', () => {
    assert.equal(dB(svfLowpassMag(1000, 1000, 0)).toFixed(1), '-6.0');
    assert.equal(Math.round(dB(svfLowpassMag(1000, 1000, 1))), 8);
    assert.match(s, /\{ v: 1, label: 'RES MAX' \}/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.tryThis[1], /peaks about 8 dB above 0 dB at the CUTOFF line\. At RES 0 it sits 6 dB below\./);
    // the spectrum's grid really has a 0 dB line and a CUTOFF tag
    const spec = code('src/screens/lab/modular/ModularSpectrum.tsx');
    assert.match(spec, /\{db === 0 \? '0 dB' : `\$\{db\}`\}/);
    assert.match(spec, /CUTOFF \{cutLabel\}/);
  });
  it('EXPLORE 3: WOBBLE → LFO →CUT + a cable to the VCF; →PITCH → LFO →PIT, cable to the VCO, PATCH CUSTOM', () => {
    assert.match(s, /key: 'wobble',[\s\S]*?patch: \{ \.\.\.DEFAULT_PATCH, cutoff: 800, res: 0\.5, lfoRate: 2, lfoDepth: 1, lfoDest: 2 \}/);
    assert.match(s, /const lfoShort = lfoLive \? \['OFF', '→PIT', '→CUT', '→AMP'\]\[patch\.lfoDest\] : 'OFF';/);
    assert.match(s, /add\('lfo-vcf', \['lfo', 'out'\], \['vcf', 'cv2'\], LFO_COLOR\);/);
    assert.match(s, /add\('lfo-vco', \['lfo', 'out'\], \['vco', 'fm'\], LFO_COLOR\);/);
    // a MOD chip is not a preset: update() with no preset key → PATCH reads CUSTOM
    assert.match(s, /\(patchPatch: Partial<Patch>, fromPreset: string \| null = null\)/);
    assert.match(s, /onPress=\{\(\) => update\(\{ lfoDest: d\.v \}\)\}/);
    assert.match(s, /k: 'PATCH',\s*v: patchIdea\?\.label \?\? 'CUSTOM',/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.tryThis[2], /LFO reads →CUT and a blue cable runs to the VCF\. In MOD tap →PITCH: the cable moves to the VCO, LFO reads →PIT, PATCH reads CUSTOM\./);
  });
  it('LEARN 2: ACID BASS → RES MAX, SEQ 8/s and a green ENV → VCF cable', () => {
    assert.match(s, /key: 'bass',[\s\S]*?patch: \{ \.\.\.DEFAULT_PATCH, cutoff: 800, res: 1, envKey: 'pluck', envToCut: 1, seqOn: true, seqRate: 8 \}/);
    assert.match(s, /const resShort = patch\.res >= 1 \? 'MAX'/);
    assert.match(s, /v: patch\.seqOn \? `\$\{patch\.seqRate\}\/s` : 'OFF',/);
    assert.match(s, /if \(patch\.envToCut > 0\) add\('env-vcf', \['env', 'outF'\], \['vcf', 'cv1'\], ENV_COLOR\);/);
    assert.match(MODULAR_SCREEN_GUIDES.learn.tryThis[1], /RES reads MAX, SEQ 8\/s, and a green cable runs from ENV to the VCF/);
  });
  it('the LFO rule the guide states: live only with DEPTH above 0 and a destination', () => {
    assert.match(s, /const lfoLive = patch\.lfoDepth > 0 && patch\.lfoDest > 0;/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.changes.join(' '), /live only with DEPTH above 0 and a destination/);
  });
  // Review 2026-10-31 — each claim vetted against the code before the fix.
  it('vetted: THE VOICE, AS SOUND is introduced in WHAT YOU’RE SEEING, and TRY THIS says where it is', () => {
    assert.match(s, /<Text style=\{styles\.sectionHead\}>THE VOICE, AS SOUND<\/Text>/);
    assert.match(s, /const BASE_FREQ = 110;/);
    const sp = code('src/screens/lab/modular/ModularSpectrum.tsx');
    assert.match(sp, /gray = removed by the filter/);
    assert.match(sp, /strokeDasharray="4 3"/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.seeing.join(' '), /LAB NOTES › THE VOICE, AS SOUND: harmonics of the 110 Hz note as bars \(gray = filtered out\) under the filter’s dashed curve/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.tryThis[0], /THE VOICE, AS SOUND \(LAB NOTES; ▴ HIDE DISPLAY gives room\)/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.tryThis[1], /THE VOICE, AS SOUND \(LAB NOTES\)/);
    assert.match(code('src/screens/lab/rack/RackUnit.tsx'), /'▴  HIDE DISPLAY'/);
  });
  it('vetted: the live lights (ENV glow, lit SEQ step) are named', () => {
    assert.match(s, /const st = ApeDsp\.modStatus\(\);/);
    assert.match(s, /const lit = running && patch\.seqOn && activeStep === sI;/);
    assert.match(s, /running && envLevel > 0\.02/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.seeing.join(' '), /the ENV light shows the envelope; the lit SEQ step is sounding/);
  });
  it('vetted: the readouts are still explained (PATCH or CUSTOM, LFO/SEQ OFF)', () => {
    assert.match(s, /v: patchIdea\?\.label \?\? 'CUSTOM',/);
    assert.match(MODULAR_SCREEN_GUIDES.explore.control.join(' '), /The readouts echo the keys: PATCH \(or CUSTOM\), VCO, RES, LFO \(route or OFF\), SEQ \(rate or OFF\)/);
  });
  it('vetted: only some COMMON MISTAKES lines are signal mix-ups (3 of 7) — "Several", not "Most"', () => {
    const lesson = code('src/features/lab/guidedLessons/content.ts').match(/\n  modular: \{([\s\S]*?)\n  \},/)?.[1] ?? '';
    const cm = lesson.match(/commonMistakes: \[([\s\S]*?)\n    \],/)?.[1] ?? '';
    assert.equal((cm.match(/^      '/gm) ?? []).length, 7);
    assert.match(MODULAR_SCREEN_GUIDES.learn.changes.join(' '), /Several COMMON MISTAKES lines mix up what a signal does/);
    assert.doesNotMatch(MODULAR_SCREEN_GUIDES.learn.changes.join(' '), /Most COMMON MISTAKES/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  const s = code(SCREEN);
  it('LabShell gets the per-tab guide function from modularScreenGuides', () => {
    assert.match(s, /import \{ modularScreenGuide \} from '\.\/modular\/modularScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{modularScreenGuide\}/);
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /typeof guide === 'function' \? guide\(mode\)/);
    assert.match(shell, /<ScreenGuideHost resetKey=\{mode\} regions=\{!!rack && mode === 'explore'\}>/);
  });
  it('a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(s, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(s, /<AccuracyNote/);
    // Only the modular voice is driven — no microphone is opened. modStatus
    // reads the voice's OWN envelope level and step (not a measurement).
    const calls = new Set([...s.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^mod[A-Z]\w*$|^(isAvailable|engineVersion|wave2Available)$/, `ApeDsp.${c} — not a modular-voice call`);
    assert.doesNotMatch(s, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
    // The honesty stays where it was: the faceplate badge and the spectrum caption.
    assert.match(s, /badge: 'THE PATCH — EVERY CABLE IS LIVE · KNOBS AT YOUR SETTINGS'/);
    assert.match(s, /Learn here; measure real gear with a calibrated analyzer\./);
  });
});
