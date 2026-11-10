/**
 * Screen Guide rollout — Phase Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (Wave pilot) and
 * test/screenGuide_chain_20261031.test.ts (the LabShell lab).
 *
 *   1. every screen the learner reaches in this LabShell lab has a guide —
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the
 *      understanding check) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source (phaseConfig, FxLabScreen, the flow
 *      display, the phase scope, LabShell, the rack, the lesson, the check);
 *   4. every CORRELATION number is what LissajousGraph prints (440 Hz model),
 *      and every "you hear" claim is re-run on the engine's own law
 *      (Effects.hpp StereoEffect: R flipped, R delayed in WHOLE samples,
 *      MONO = (L+R)/2) at 48 kHz and 44.1 kHz;
 *   5. the chip decision is pinned: a CONCEPT lab, `accuracy` false.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { PHASE_SCREEN_GUIDES, phaseScreenGuide, PHASE_ACCURACY_CHIP } = await import('../src/screens/lab/phaseScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = PHASE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
/** The Phase lab's own config block. */
const PH = CONFIGS.slice(CONFIGS.indexOf('const PHASE_INV = P.invertR;'), CONFIGS.indexOf('export const PhaseLabScreen'));
const FXSCREEN = code('src/screens/lab/FxLabScreen.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const FLOW = ANIM.slice(ANIM.indexOf('function StereoFlow'), ANIM.indexOf('function FlowBody'));
const VIZ = code('src/features/lab/fxViz.tsx');
const SCOPE = VIZ.slice(VIZ.indexOf('export function LissajousGraph'), VIZ.indexOf('export function GrMeter'));
const SHELL = code('src/screens/lab/LabShell.tsx');
const RACK = [code('src/screens/lab/rack/RackUnit.tsx'), code('src/screens/lab/rack/BezelReadouts.tsx'), code('src/screens/lab/rack/ParamLane.tsx')].join('\n');
const LESSON = code('src/features/lab/guidedLessons/content.ts');
const LESSON_PH = LESSON.slice(LESSON.indexOf('  phase: {'), LESSON.indexOf('  harmonic: {'));
const CHECKS = code('src/features/lab/understandingChecks.ts');
const CHECK_PH = CHECKS.slice(CHECKS.indexOf('const PHASE: readonly Q[]'), CHECKS.indexOf('const OSCILLATOR: readonly Q[]'));
const UNDERSTAND = code('src/components/LabUnderstandingCheck.tsx');
const SHEET = code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx');
const BITS = code('src/screens/lab/foundations/bits.tsx');
const CATALOG = code('src/screens/lab/labCatalog.ts');

describe('1. every Phase screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(PHASE_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS, /^\s*phase: PHASE,$/m, 'the Phase check is registered — LabShell shows a CHECK tab');
    for (const m of ['explore', 'learn', 'check']) assert.equal(phaseScreenGuide(m), GUIDES[m]);
    assert.equal(phaseScreenGuide('other'), undefined);
    assert.match(PH, /labId: 'phase',/);
  });
  it('the CHECK guide matches the check: four questions — cancel, 2 ms, frequency, +1', () => {
    assert.equal((CHECK_PH.match(/^\s{4}id: '/gm) ?? []).length, 4);
    for (const id of ['invert-silence', 'flip-wont-fix-delay', 'delay-phase-frequency', 'correlation']) assert.match(CHECK_PH, new RegExp(`id: '${id}'`));
    assert.match(CHECK_PH, /One channel is 2 ms late/);
    assert.match(PHASE_SCREEN_GUIDES.check.seeing.join(' '), /four questions/);
    assert.match(PHASE_SCREEN_GUIDES.check.teaches.join(' '), /a 2 ms delay/);
  });
  it('where things are (review 2026-10-31): IN draws L dim, colours appear after the stage; CORRELATION is located; the ⓘ opens the lesson display entry', () => {
    // IN: L is DIM (grey) on the phase flavor, R faint blue; OUT: L amber, R blue
    assert.match(FLOW, /<Path path=\{inL\} color=\{flavor === 'width' \? AMBER : DIM\}/);
    assert.match(FLOW, /<FlowGlow path=\{outR\} color=\{BLUE\}/);
    assert.match(FLOW, /<FlowGlow path=\{outL\} width=\{1\.8\} \/>/);
    assert.match(PHASE_SCREEN_GUIDES.explore.seeing[0], /At ▸ OUT, L is amber and R is blue/);
    assert.doesNotMatch(PHASE_SCREEN_GUIDES.explore.seeing[0], /^One tone in L \(amber\)/);
    // the scope's axes: up = (L+R)/2 (mid), across = (R−L)/2 (side)
    assert.match(SCOPE, /const px = SIZE \/ 2 \+ \(\(r - l\) \/ 2\)/);
    assert.match(SCOPE, /const py = SIZE \/ 2 - \(\(l \+ r\) \/ 2\)/);
    // the first TRY THIS says where CORRELATION is
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[0], /CORRELATION \(LAB NOTES, under DESIGNED RESPONSE\)/);
    // the readouts' ⓘ opens the lesson 'display' entry. Fix 2026-10-31 (two verifiers): the ⓘ
    // sits beside the animated StereoFlow, so the entry leads with the L/R traces; the
    // goniometer (the LAB NOTES scope) is the closing line.
    assert.match(FXSCREEN, /onGuide: \(\) => openLesson\('display'\)/);
    // 2026-11-08: the entry is read up to the next control so it holds for the old lesson and the
    // Part A rewrite alike; both name the flow's labels in order.
    const d0 = LESSON_PH.search(/key: ["']display["']/);
    assert.ok(d0 >= 0, 'no display entry');
    const next = LESSON_PH.slice(d0 + 5).search(/key: ["']/);
    const entry = LESSON_PH.slice(d0, next < 0 ? undefined : d0 + 5 + next);
    assert.match(entry, /name: ["']What the display shows["']/);
    assert.match(entry, /the same (tone|sound) enters L and R at IN ▸[\s\S]*R: Ø · DLY stage[\s\S]*L \(amber\) and R \(blue\)/i);
    for (const name of ['IN ▸', '▸ OUT', "'SAME TONE IN L AND R'", "'R: Ø · DLY'", "{ label: 'L', color: AMBER }, { label: 'R', color: BLUE }"]) assert.ok(ANIM.includes(name), `fxAnim: ${name}`);
    // FOLD pulls both traces onto (L+R)/2; INVERTED Ø + MONO is a flat line
    assert.match(FLOW, /const mono = \(lp \+ rp\) \/ 2;/);
    assert.doesNotMatch(entry, /DLY R slides R later/, 'the drawn shift direction is not claimed');
    // The guide no longer says the ⓘ entry covers the LAB NOTES scope (the Part A entry does not):
    // the ⓘ explains the moving display; the scope is located on its own (LAB NOTES, DESIGNED RESPONSE).
    assert.match(PHASE_SCREEN_GUIDES.explore.control.join(' '), /the ⓘ after the readouts explains this display\./);
    assert.doesNotMatch(textOf(GUIDES.explore) + textOf(GUIDES.learn), /display entry (covers|explains)[^.]*(then|and) the (phase )?scope/);
    assert.match(PHASE_SCREEN_GUIDES.explore.seeing.join(' '), /In LAB NOTES, DESIGNED RESPONSE holds a 440 Hz phase scope/);
    assert.match(PHASE_SCREEN_GUIDES.learn.changes.join(' '), /The phase scope sits on EXPLORE in LAB NOTES, under DESIGNED RESPONSE\./);
    // LEARN does not say "nothing plays": the header ▶ shows on every tab and the rack stays mounted
    assert.match(SHELL, /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing (here )?plays/i);
    assert.ok(PHASE_SCREEN_GUIDES.learn.seeing[0].includes('the header ▶ still plays or stops the sound'));
    // a SOURCE choice is chosen by a tap; its note opens on a long-press
    assert.match(FXSCREEN, /onLongPress: \(\) => openSourceHelp\(s\.gen\)/);
    assert.match(PHASE_SCREEN_GUIDES.learn.control.join(' '), /long-press a SOURCE choice/i);
    assert.doesNotMatch(textOf(GUIDES.check), /points back to something the EXPLORE/);
  });
  it('the EXPLORE guide names the two CHECK YOURSELF cards in LAB NOTES', () => {
    assert.equal((PH.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(PHASE_SCREEN_GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
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
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend", no brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*4\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Little Labs|IBP|Lexicon|Eventide|Boss|TC Electronic|RTW|Dorrough)\b/, `${id}: a gear maker/model name`);
    }
  });
  it('the flow draws the 440 Hz tone the scope and the sound use (D41 fix 2026-11-01); no step reads an angle off it', () => {
    // One drawn cycle (lamPx) = 1/440 s: DLY R turns R by 2π·440·τ, the same
    // phase the scope's correlation and the engine's delay produce. (It used
    // to be lamPx / 12 — 12 ms a cycle, an 83 Hz tone.)
    assert.match(ANIM, /^const STEREO_TONE_HZ = 440;$/m);
    assert.equal((FLOW.match(/const dxp = dlyG\.value \* 0\.001 \* STEREO_TONE_HZ \* lamPx;/g) ?? []).length, 2, 'both OUT traces');
    assert.doesNotMatch(FLOW, /lamPx \/ 12/);
    assert.match(FLOW, /const lamPx = w \/ 3\.0;/);
    assert.match(FLOW, /const kc = \(PI2 \* 3\.0\) \/ w;/);
    // …the same tone as the scope hero and its badge
    assert.match(PH, /<LissajousGraph widthPct=\{100\} invertR=\{v\[PHASE_INV\] > 0\.5\} delayRms=\{v\[PHASE_DLY\]\} toneHz=\{440\} \/>/);
    assert.match(PH, /heroBadge: 'LISSAJOUS \+ CORRELATION — ANALYTIC \(440 Hz model\)'/);
    // The guide still reads CORRELATION and the sound — never a degree figure.
    // (180° is the polarity flip — true at every frequency, not read off the flow.)
    // 2026-11-08: the LEARN teaches line says "more degrees" in words (no figure), so the
    // check is on a NUMBER of degrees.
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd).replace(/180°/g, ''), /\d\s*°|\d\s*degrees?\b/i, `${id}: an angle figure`);
    for (const [id, gd] of allGuides) assert.doesNotMatch(gd.tryThis.join(' '), /R trace (moves|slides|shifts)/i, `${id}: a TRY THIS reads the flow's R offset`);
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
  // [token in the screen source, that source, the words the guide uses (default: the token)]
  const NAMES: Record<string, [string, string, string?][]> = {
    explore: [
      // the flow display (fxAnim StereoFlow + FlowScene)
      ['IN ▸', ANIM], ['▸ OUT', ANIM], ["'R: Ø · DLY'", ANIM, 'R: Ø · DLY'], ['SAME TONE IN L AND R', FLOW, 'as SAME TONE IN L AND R'],
      ["{ label: 'L', color: AMBER }, { label: 'R', color: BLUE }", FLOW, 'L is amber and R is blue'],
      // the readouts, the dock keys and their choices
      ["k: 'POL'", PH, 'POL'], ["k: 'DLY R'", PH, 'DLY R'], ["k: 'FOLD'", PH, 'FOLD'],
      ["label: 'NORMAL'", PH, 'NORMAL'], ['INVERTED Ø', PH], ["label: 'STEREO'", PH, 'STEREO'], ['MONO (L+R)', PH],
      ["label: 'SOURCE'", FXSCREEN, 'SOURCE picks'], ['PINK NOISE', CONFIGS], ['SINE ${hz} Hz', CONFIGS, 'SINE 440 Hz'],
      ['min: 0, max: 10, snap: (v) => Math.round(v * 10) / 10', PH, '0 to 10 ms, in 0.1 ms steps'], ['home: 0', PH, 'Double-tap the lane for 0 ms'], ['now - lastTapRef.current < DOUBLE_TAP_MS && homeRef.current != null', RACK, 'Double-tap the lane'],
      // the scope in the well
      ['DESIGNED RESPONSE', FXSCREEN], ['CORRELATION', SCOPE], ['toneHz={440}', PH, '440 Hz phase scope'], ['>M<', SCOPE, 'M (mid, L+R) up'], ['>S<', SCOPE, 'S (side, L−R) across'],
      ['ANTI-PHASE — cancels in mono', SCOPE, 'ANTI-PHASE'],
      // the rack's own controls
      ['dBFS · uncalibrated', FXSCREEN, '−20 dBFS, a digital level'], ['LAB NOTES', SHELL], ['CHECK YOURSELF', BITS],
      ['HIDE DISPLAY', RACK], ['FULL SCREEN', RACK], ['ⓘ', RACK], ["'■'", SHELL, '■'], ["'▶'", SHELL, '▶'],
      // "where it sits" (Phase after Modulation) dropped: course-navigation lines left WHAT THIS
      // TEACHES (decision 4, 2026-11-08) — the negative check is in the next test.
    ],
    learn: [
      ['LEARN', SHELL], ['EXPLORE', SHELL], ['CHECK', SHELL], ['CONTROLS', SHEET], ['COMMON MISTAKES', SHEET], ['PRO TIPS', SHEET], ['FORMULA / CONCEPT', SHEET],
      ['GUIDED LESSON', SHELL], ['LAB NOTES', SHELL], ['DESIGNED RESPONSE', FXSCREEN],
      // CONTROLS names = the on-screen labels (decision 1, 2026-11-08): Polarity (invert) / Delay one
      // channel / Mono-fold became POL / DLY R / FOLD — pinned from the dock config. Lesson tokens
      // below are ones the old lesson and the Part A rewrite share, so the check holds across that load.
      ['name: "What the display shows"', LESSON_PH, 'What the display shows'], ["k: 'POL'", PH, 'POL (polarity)'],
      ['min: 0, max: 10', PH, 'DLY R (0–10 ms)'], ["k: 'FOLD'", PH, 'FOLD (mono-fold)'],
      ['φ(f) = −2πfτ', LESSON_PH], ['goniometer', LESSON_PH], ['(+1)', LESSON_PH, 'upright line = in phase (+1)'],
      ['anti-phase (−1', LESSON_PH, 'flat line = anti-phase (−1)'], ['a ball', LESSON_PH, 'round ball = wide'], ["'▶'", SHELL, '▶'],
      ["k: 'POL'", PH, 'POL'], ["k: 'DLY R'", PH, 'DLY R'], ["k: 'FOLD'", PH, 'FOLD'],
    ],
    check: [
      ['CHECK YOUR UNDERSTANDING', UNDERSTAND], ['CORRECT', UNDERSTAND], ['NOT QUITE — TRY ANOTHER', UNDERSTAND], ['no score', UNDERSTAND], ['✓', UNDERSTAND],
      // 'certificate and program' dropped (decision 5: no credit bookkeeping in student text);
      // DLY R / NORMAL dropped: the CHECK TRY THIS no longer walks to the answering readings (decision 6).
      ['this lab is complete', UNDERSTAND, 'the lab is complete'],
      ['PINK NOISE', CONFIGS], ['CORRELATION', SCOPE], ['COMMON MISTAKES', SHEET], ['FORMULA / CONCEPT', SHEET],
    ],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(PHASE_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const [n, src, w = n] of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(w), `${id}: the guide never names "${w}"`);
      }
    });
  }
  it('no course-order line (decision 4) and no credit bookkeeping (decision 5)', () => {
    for (const [id, gd] of allGuides) {
      assert.doesNotMatch(textOf(gd), /sits after|Advanced Training Labs|Training Labs list/i, `${id}: course order`);
      assert.doesNotMatch(textOf(gd), /certificate|program credit/i, `${id}: credit bookkeeping`);
    }
  });
  it('the sources, keys and readouts are exactly the ones the guide lists', () => {
    assert.match(PH, /sources: \[srcSine\(440\), SRC_PINK\],/);
    assert.deepEqual([...PH.matchAll(/^\s{6}label: '([^']+)', short: '([^']+)', paramId:/gm)].map((m) => m[2]), ['DLY R', 'POL', 'FOLD']);
    assert.deepEqual([...PH.matchAll(/\{ k: '([A-Z ]+)', paramId:/g)].map((m) => m[1]), ['POL', 'DLY R', 'FOLD']);
    // the flow always draws a tone; the source only switches its IN note
    // (2026-10-31: it had said "SAME TONE" with PINK playing)
    assert.doesNotMatch(FLOW, /\bsrc\b/);
    assert.match(PH, /anim: \(v, src\) => \(\{\s*kind: 'stereo',\s*flavor: 'phase',[\s\S]*?srcIsNoise: isNoiseSrc\(src\),\s*\}\),/);
    assert.match(FLOW, /flavor === 'phase' && srcIsNoise \? 'PART OF THE NOISE · L = R' : 'SAME TONE IN L AND R'/);
    // the width lab passes no srcIsNoise, so its notes are unchanged
    const width = CONFIGS.slice(CONFIGS.indexOf("flavor: 'width'"), CONFIGS.indexOf('heroCaption', CONFIGS.indexOf("flavor: 'width'")));
    assert.doesNotMatch(width, /srcIsNoise/);
    assert.match(PHASE_SCREEN_GUIDES.explore.seeing.join(' '), /With PINK NOISE the label reads PART OF THE NOISE · L = R\./);
    // the scope takes no FOLD: it shows the channels before the sum
    assert.match(PH, /Hero: \(v\) => <LissajousGraph widthPct=\{100\} invertR=\{v\[PHASE_INV\] > 0\.5\} delayRms=\{v\[PHASE_DLY\]\} toneHz=\{440\} \/>,/);
    assert.match(PHASE_SCREEN_GUIDES.explore.changes.join(' '), /The scope shows the channels before FOLD\./);
  });
});

describe('4. the numbers: what the scope prints, and what the engine plays', () => {
  /** LissajousGraph's own sum (N = 720, width 100 %). */
  const corr = (delayMs: number, inv: boolean, hz = 440) => {
    const phi = 2 * Math.PI * hz * (delayMs / 1000);
    let sLL = 0, sRR = 0, sLR = 0;
    for (let i = 0; i <= 720; i++) {
      const th = (2 * Math.PI * i) / 720;
      const l = Math.sin(th), r = Math.sin(th - phi) * (inv ? -1 : 1);
      sLL += l * l; sRR += r * r; sLR += l * r;
    }
    return sLR / Math.max(Math.sqrt(sLL * sRR), 1e-9);
  };
  /** As the screen prints it: "+0.99" / "-0.99". */
  const shown = (c: number) => (c >= 0 ? `+${c.toFixed(2)}` : c.toFixed(2));
  /** The scope's hint words for that value. */
  const hint = (c: number) => (c > 0.9 ? 'mono / in phase' : c < -0.9 ? 'ANTI-PHASE — cancels in mono' : c < 0 ? 'partly out of phase' : 'wide / decorrelated');
  /** MONO level (dB re the un-delayed tone) of SINE 440 Hz: R flipped, R
   *  delayed by floor(ms·fs/1000) samples, then (L+R)/2 — Effects.hpp. */
  const monoDb = (delayMs: number, inv: boolean, fs: number) => {
    const tau = Math.floor(delayMs * 0.001 * fs) / fs;
    const a = inv ? Math.abs(Math.sin(Math.PI * 440 * tau)) : Math.abs(Math.cos(Math.PI * 440 * tau));
    return 20 * Math.log10(Math.max(a, 1e-9));
  };
  it('the inputs: the scope formula, the scope tone, the engine law', () => {
    assert.match(SCOPE, /const phi = 2 \* PI \* toneHz \* \(delayRms \/ 1000\) \+ inputLrRad;/);
    assert.match(SCOPE, /let r = Math\.sin\(th - phi\) \* \(invertR \? -1 : 1\);/);
    assert.match(SCOPE, /\{corr >= 0 \? `\+\$\{corr\.toFixed\(2\)\}` : corr\.toFixed\(2\)\}/);
    assert.match(SCOPE, /corr > 0\.9 \? 'mono \/ in phase' : corr < -0\.9 \? 'ANTI-PHASE — cancels in mono'/);
    const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(fx, /const size_t dSamp = static_cast<size_t>\(delayRms_\.load\(\) \* 0\.001 \* fs_\);/);
    assert.match(fx, /if \(inv\) r = -r;/);
    assert.match(fx, /if \(fold\) \{ l = r = 0\.5 \* \(l \+ r\); \}/);
    // width 100 %, centre pan, no bass-mono: nothing else touches the pair
    assert.match(PH, /\{ paramId: P\.widthPct, value: 100 \},\s*\{ paramId: P\.pan, value: 0 \},\s*\{ paramId: P\.bassMonoHz, value: 0 \},/);
  });
  it('EXPLORE TRY THIS 1: INVERTED Ø reads -1.00 ANTI-PHASE; MONO is silence; the OUT trace goes flat', () => {
    assert.equal(shown(corr(0, true)), '-1.00');
    assert.equal(hint(corr(0, true)), 'ANTI-PHASE — cancels in mono');
    for (const fs of [48000, 44100]) assert.ok(monoDb(0, true, fs) < -150, 'exact cancellation');
    // the flow folds both traces onto (L+R)/2 — with R = −L that is zero
    assert.match(FLOW, /const mono = \(lp \+ rp\) \/ 2;/);
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[0], /−1\.00, ANTI-PHASE/);
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[0], /silence, and the OUT trace goes flat/);
  });
  it('EXPLORE TRY THIS 2: DLY R 1.1 ms reads -0.99 and MONO nearly vanishes; INVERTED Ø reads +0.99 and it returns', () => {
    assert.equal(shown(corr(1.1, false)), '-0.99');
    assert.equal(shown(corr(1.1, true)), '+0.99');
    for (const fs of [48000, 44100]) {
      assert.ok(monoDb(1.1, false, fs) < -20, `MONO at 1.1 ms (${fs}): ${monoDb(1.1, false, fs).toFixed(1)} dB`);
      assert.ok(monoDb(1.1, true, fs) > -0.1, `flipped (${fs}): ${monoDb(1.1, true, fs).toFixed(2)} dB`);
    }
    // the flow's MONO OUT trace, worked from its own law: R = sin(kc·(x − dxp) − pc),
    // dxp = τ·0.001·440·lamPx, so a phase of 2π·440·τ; the folded trace (L+R)/2
    // has height |cos(π·440·τ)| — about 5 % at 1.1 ms, full again when flipped
    const lam = 1, kcl = (2 * Math.PI) / lam;
    const traceH = (ms: number, inv: boolean) => {
      const dxp = ms * 0.001 * 440 * lam;
      let pk = 0;
      for (let i = 0; i < 2000; i++) { const x = (i / 2000) * lam; const r = (inv ? -1 : 1) * Math.sin(kcl * (x - dxp)); pk = Math.max(pk, Math.abs((Math.sin(kcl * x) + r) / 2)); }
      return pk;
    };
    assert.ok(traceH(1.1, false) < 0.06, `drawn MONO at 1.1 ms: ${traceH(1.1, false).toFixed(3)}`);
    assert.ok(traceH(1.1, true) > 0.99, `drawn MONO flipped at 1.1 ms: ${traceH(1.1, true).toFixed(3)}`);
    assert.ok(traceH(1000 / 440, false) > 0.999, 'one whole 440 Hz cycle (2.27 ms) lines up again, as the scope reads +1.00');
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[1], /DLY R to 1\.1 ms\. CORRELATION reads −0\.99; the tone and the OUT trace nearly vanish/);
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[1], /\+0\.99, the tone is back, for this one frequency/);
  });
  it('EXPLORE TRY THIS 3: PINK NOISE in MONO with a delay combs; a flip moves the notches but cannot remove them', () => {
    // H(f) = (1 ± e^(−j2πfτ))/2: notches at odd multiples of 1/2τ (NORMAL) or
    // at multiples of 1/τ (INVERTED) — present either way, never the same set.
    for (const fs of [48000, 44100]) {
      const tau = Math.floor(1.1 * 0.001 * fs) / fs;
      const mag = (f: number, inv: boolean) => Math.abs(inv ? Math.sin(Math.PI * f * tau) : Math.cos(Math.PI * f * tau));
      const n0 = 1 / (2 * tau), n1 = 1 / tau;
      assert.ok(mag(n0, false) < 1e-9 && mag(n0, true) > 0.99, 'the NORMAL notch is gone when flipped');
      assert.ok(mag(n1, true) < 1e-9 && mag(n1, false) > 0.99, '…and a new notch appears');
      assert.ok(n1 < 20000, 'audible notches');
    }
    // the pink generator plays the same noise in both channels (no spread)
    assert.match(CONFIGS, /const SRC_PINK = \{ label: 'PINK NOISE', short: 'PINK', gen: \{ mode: GEN_MODES\.pink \},/);
    assert.match(FXSCREEN, /return \{ levelDb: GEN_LEVEL_DB, stereoSpreadRad: 0, \.\.\.src\.gen \};/);
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[2], /the notches move but stay/);
    // Review 2026-10-31: 0 ms clears the comb only with POL NORMAL — INVERTED Ø
    // + MONO + 0 ms is (L − L)/2 = silence (TRY THIS 1), so the step says so.
    for (const fs of [48000, 44100]) {
      assert.ok(monoDb(0, false, fs) > -1e-9, 'NORMAL + 0 ms: the tone at full level');
      assert.ok(monoDb(0, true, fs) < -150, 'INVERTED + 0 ms: silence, not "cleared"');
    }
    assert.match(PHASE_SCREEN_GUIDES.explore.tryThis[2], /With POL on NORMAL, DLY R back to 0 ms clears them\./);
  });
  it('LEARN TRY THIS 1: DLY R 2.3 ms reads +1.00 again — one whole 440 Hz cycle (2.27 ms)', () => {
    assert.equal(shown(corr(2.3, false)), '+1.00');
    assert.equal(hint(corr(2.3, false)), 'mono / in phase');
    assert.ok(Math.abs(1000 / 440 - 2.27) < 0.005);
    assert.match(PHASE_SCREEN_GUIDES.learn.tryThis[0], /DLY R to 2\.3 ms with SINE 440 Hz: the scope stands upright again at \+1\.00/);
  });
  it('DESIGNED RESPONSE delay captions never contradict the 440 Hz meter (fix 2026-10-31)', () => {
    // Inverted + delay: the meter reaches −1.00 again (2.3, 9.1 ms) and +0.99
    // (1.1 ms), so the caption may not say "no longer a clean −1".
    assert.equal(shown(corr(2.3, true)), '-1.00');
    assert.equal(shown(corr(9.1, true)), '-1.00');
    assert.equal(shown(corr(1.1, true)), '+0.99');
    // Normal + delay: at 1.1 ms a flip does bring this one tone back, so
    // "no polarity flip can fix it" must be scoped to full-range sound.
    assert.equal(hint(corr(1.1, false)), 'ANTI-PHASE — cancels in mono');
    assert.equal(hint(corr(1.1, true)), 'mono / in phase');
    assert.doesNotMatch(PH, /no longer a clean −1|no polarity flip can fix it/);
    assert.match(PH, /`Flipped AND delayed \$\{v\[PHASE_DLY\]\} ms: on this 440 Hz tone the CORRELATION now depends on the delay\. On full-range sound like PINK NOISE, some frequencies cancel in mono and others add\.`/);
    assert.match(PH, /On full-range sound like PINK NOISE that combs in mono, and no polarity flip fixes every frequency at once\. On this one 440 Hz tone, a flip helps only at some delays\.`/);
  });
  it('CHECK (decision 6, 2026-11-08): TRY THIS and the intro never give a check answer away', () => {
    // the facts the old lines walked to still hold (2 ms combs either way; 0 ms NORMAL reads +1.00)…
    for (const fs of [48000, 44100]) {
      const tau = Math.floor(2 * 0.001 * fs) / fs;
      assert.ok(Math.abs(Math.cos((Math.PI * 1) / (2 * tau) * tau)) < 1e-9 && Math.abs(Math.sin(Math.PI * (1 / tau) * tau)) < 1e-9);
    }
    assert.equal(shown(corr(0, false)), '+1.00');
    // …but the CHECK screen no longer walks to them, nor states the answers
    const ck = PHASE_SCREEN_GUIDES.check as unknown as Guide & { intro: { learning: string; start: string } };
    const all = [textOf(ck), ck.intro.learning, ck.intro.start].join('\n');
    assert.doesNotMatch(all, /comb stays|flip POL|upright line|\+1\.00|move together|in step|safe in mono/i);
    assert.doesNotMatch(all, /time alignment|more at higher|grows with frequency|equal and opposite/i);
    assert.match(ck.tryThis[0], /On LEARN, reread the COMMON MISTAKES line on what the Ø button can and cannot fix/);
    assert.match(ck.tryThis[1], /On LEARN, COMMON MISTAKES and FORMULA \/ CONCEPT explain what each end of its scale means/);
  });
});

describe('5. the chip decision: a concept lab', () => {
  it('accuracy chip OFF — the flow is a teaching model and the scope is analytic', () => {
    assert.equal(PHASE_ACCURACY_CHIP, false);
    assert.match(FXSCREEN, /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(PH, /heroBadge: 'LISSAJOUS \+ CORRELATION — ANALYTIC \(440 Hz model\)',/);
    assert.doesNotMatch(PH, /pollGr/);
  });
});
