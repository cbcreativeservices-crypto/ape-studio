/**
 * Screen Guide rollout — Equalizer, the audible one-band FX lab (route EqLab,
 * labId 'eq', config eqConfig in fxLabConfigs.tsx) — receipts. Pattern:
 * test/screenGuide_digital_20261031.test.ts and the sibling effect-lab tests
 * (screenGuide_chorus_20261031.test.ts).
 *
 *   1. one guide per LabShell tab (explore / learn / check), all five
 *      sections, in the house copy rules;
 *   2. every section fits its no-scroll budget;
 *   3. each guide quotes its screen's real names (eqConfig, the shared
 *      FxLabScreen / LabShell, the animated EqFlow hero, the guided lesson,
 *      the understanding check);
 *   4. the TRY THIS numbers are what the screen prints (eqConfig's caption);
 *   5. the chip ruling (concept lab) and the WIRING, which is pending: the
 *      Equalizer renders through the shared FxLabScreen, whose FxLabConfig
 *      carries no guide / accuracy field yet. Like the siblings, the wiring
 *      assertion reads the field names from FxLabScreen and is a todo until
 *      they exist — enforced from then on.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { EQUALIZER_SCREEN_GUIDES, equalizerScreenGuide } = await import('../src/screens/lab/eq/equalizerScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const GUIDES = EQUALIZER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

/** The Equalizer's own block of fxLabConfigs.tsx (LAB 1 · EQ up to LAB 2). */
const CFG_ALL = code('src/screens/lab/fxLabConfigs.tsx');
const EQ_CFG = CFG_ALL.slice(CFG_ALL.indexOf('const EQ_TYPE ='), CFG_ALL.indexOf('export const EqLabScreen'));
const SHARED = CFG_ALL.slice(0, CFG_ALL.indexOf('const EQ_TYPE ='));
const FX_SCREEN = 'src/screens/lab/FxLabScreen.tsx';
const FX = code(FX_SCREEN);
const SHELL = code('src/screens/lab/LabShell.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx') + code('src/screens/lab/fxEqCurve.ts');
const LESSON_UI = code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx');
const CONTENT = code('src/features/lab/guidedLessons/content.ts');
const EQ_LESSON = CONTENT.slice(CONTENT.indexOf("  eq: {"), CONTENT.indexOf("  delay: {"));
const CHECK_UI = code('src/components/LabUnderstandingCheck.tsx');
const UC = code('src/features/lab/understandingChecks.ts');
const EQ_QS = UC.slice(UC.indexOf('const EQ: readonly Q[] = ['), UC.indexOf('];', UC.indexOf('const EQ: readonly Q[] = [')));

describe('1. every Equalizer screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check (labId eq has a CHECK tab)', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(EQ_CFG, /labId: 'eq',/);
    assert.match(UC, /^\s*eq: EQ,/m, 'eq lost its CHECK tab — drop the check guide');
    for (const m of ['explore', 'learn', 'check']) assert.equal(equalizerScreenGuide(m), GUIDES[m]);
    assert.equal(equalizerScreenGuide('other'), undefined);
  });
  for (const [id, gd] of Object.entries(GUIDES)) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k].length} bullets`);
        for (const line of gd[k]) assert.ok(line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3);
    });
  }
  it('knowledge not skills, no "N of total", no "recommend", no build notes, no brands', () => {
    for (const [id, gd] of Object.entries(GUIDES)) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, id);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, id);
      assert.doesNotMatch(t, /\brecommend/i, id);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|owner 20\d\d|ratchet|test\/|FxLabScreen|fxLabConfigs)\b/i, id);
      assert.doesNotMatch(t, /\b(FabFilter|Waves|SSL|Neve|Pultec|API|Pro Tools|Ableton|Logic)\b/, id);
    }
  });
  it('places itself in the sequence: first in Equalization, the EQ Lab follows; Dynamics after', () => {
    const cat = code('src/screens/lab/labCatalog.ts');
    const eqCat = cat.slice(cat.indexOf("id: 'equalization'"), cat.indexOf("id: 'dynamics'"));
    assert.ok(eqCat.indexOf("route: 'EqLab'") < eqCat.indexOf("route: 'EqLabHome'"));
    assert.ok(cat.indexOf("id: 'equalization'") < cat.indexOf("id: 'dynamics'"));
    assert.match(GUIDES.explore.teaches.join(' '), /The first lab in Equalization; the EQ Lab follows/);
    // The Advanced Training menu lists categories A→Z (Dynamics sits BEFORE Equalization): suggest it, never "next".
    assert.match(GUIDES.check.teaches.join(' '), /A good next step: the Dynamics labs/);
  });
});

describe('2. stepped: every section fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of Object.entries(GUIDES)) {
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
  const NAMES: Record<string, [string, string][]> = {
    explore: [
      ...['TYPE', 'FREQ', 'GAIN', 'Q', 'PEAK (BELL)', 'LOW SHELF', 'HIGH SHELF', 'HIGH-PASS', 'LOW-PASS', '0.7 WIDE', '1.4', '8 NARROW'].map((n): [string, string] => [n, EQ_CFG]),
      ['PINK NOISE', SHARED],
      ['WHITE NOISE', SHARED],
      ['SINE ', SHARED],
      ['SOURCE', FX],
      ['DESIGNED RESPONSE', FX],
      ['THE AUDIO PATH', FX],
      ['GUIDED LESSON', SHELL],
      ['LAB NOTES', SHELL],
      ['CHECK YOURSELF', code('src/screens/lab/foundations/bits.tsx')],
      ['IN ▸', ANIM],
      ['▸ OUT', ANIM],
      ['EQ CURVE', ANIM],
      ['150 Hz · 1k · 6k', ANIM],
    ],
    learn: [
      ['LEARN', SHELL],
      ['EXPLORE', SHELL],
      ['CHECK', SHELL],
      ['GUIDED LESSON', SHELL],
      ['LAB NOTES', SHELL],
      ['CONTROLS', LESSON_UI],
      ['COMMON MISTAKES', LESSON_UI],
      ['PRO TIPS', LESSON_UI],
      ['FORMULA / CONCEPT', LESSON_UI],
      ...["Filter type", 'Frequency', 'Gain', 'Q (bandwidth)'].map((n): [string, string] => [n, EQ_LESSON]),
    ],
    check: [
      ['CHECK YOUR UNDERSTANDING', CHECK_UI],
      ['CORRECT', CHECK_UI],
      ['NOT QUITE — TRY ANOTHER', CHECK_UI],
      ['Lab complete', CHECK_UI],
      ['LEARN', SHELL],
      ['EXPLORE', SHELL],
      // The slope step stays inside this lab (finding 2026-10-31: the EQ Lab
      // comes after the Equalizer) — the HIGH-PASS TYPE note states the rate.
      ['HIGH-PASS', EQ_CFG],
      ['12 dB-per-octave', EQ_CFG],
    ],
  };
  for (const [id, pairs] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const [name, src] of pairs) {
        assert.ok(src.includes(name), `${id}: "${name}" is no longer in the source`);
        assert.ok(gt.includes(name), `${id}: the guide never names "${name}"`);
      }
    });
  }
  it('explore: the animated EQ curve strip spans 20 Hz → 20 kHz at the three tones', () => {
    assert.match(ANIM, /export const EQ_CURVE_F_MIN = 20;/);
    assert.match(ANIM, /export const EQ_CURVE_F_MAX = 20000;/);
    assert.match(ANIM, /const EQ_COMP_FREQS = \[150, 1000, 6000\];/);
    assert.match(ANIM, /case 'eq': return 'EQ';/);
    assert.ok(GUIDES.explore.seeing.join(' ').includes('20 Hz → 20 kHz'));
    // The hero is a fixed three-tone teaching wave — SOURCE never reaches it (anim: bands only).
    assert.match(EQ_CFG, /anim: \(v\) => \(\{ kind: 'eq', bands: \[eqBandOf\(v\)\] \}\)/);
    assert.ok(GUIDES.explore.seeing[0].includes('not the SOURCE you play'));
  });
  it('explore: the dock — FREQ fader 100 Hz–8 kHz; GAIN −12…+12; Q 0.7…8; three sources; the display toggles play', () => {
    assert.match(EQ_CFG, /min: 100, max: 8000, log: true/);
    assert.match(EQ_CFG, /\[-12, -6, 0, 6, 12\]\.map/);
    assert.match(EQ_CFG, /\{ label: '4', value: 4 \}/);
    assert.match(EQ_CFG, /sources: \[SRC_PINK, srcSine\(440\), SRC_WHITE\]/);
    assert.match(FX, /onToggle=\{fxReady \? \(\) => \(running \? stop\(\) : void start\(\)\) : undefined\}/);
    const t = textOf(GUIDES.explore);
    for (const s of ['100 Hz to 8 kHz', '−12, −6, 0, +6 or +12 dB', '0.7 WIDE, 1.4, 4 or 8 NARROW', 'PINK NOISE, SINE 440 Hz or WHITE NOISE', 'two CHECK YOURSELF cards']) assert.ok(t.includes(s), s);
    assert.equal((EQ_CFG.match(/question: '/g) ?? []).length, 2);
  });
  it('learn: the lesson’s Frequency, Gain and Q ranges are the rack’s (100 Hz–8 kHz, −12…+12, 0.7…8), and the guide says so', () => {
    assert.match(EQ_LESSON, /range: '0\.7 wide … 8 narrow'/);
    assert.match(EQ_LESSON, /range: '−12 … \+12 dB'/);
    assert.match(EQ_LESSON, /range: '100 Hz – 8 kHz here \(EQs reach ~20 Hz – 20 kHz\)'/);
    assert.match(EQ_LESSON, /Q ≈ Fc \/ bandwidth\. Filter slope = 6\/12\/18\/24 dB per octave \(1\/2\/3\/4-pole\)/);
    assert.ok(GUIDES.learn.changes.join(' ').includes('Frequency 100 Hz to 8 kHz here (EQs reach about 20 Hz to 20 kHz), Gain −12 to +12 dB, Q 0.7 wide to 8 narrow'));
  });
  it('check: five questions, four answers each, and the topics the guide lists', () => {
    const ids = [...EQ_QS.matchAll(/id: '([\w-]+)'/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['q-width', 'high-pass', 'graphic-vs-parametric', 'slope', 'cut-first']);
    assert.match(GUIDES.check.seeing.join(' '), /five questions, four answers each/);
    for (const blk of EQ_QS.split(/\{\s*id: '/).slice(1)) {
      const opts = blk.match(/options: \[([\s\S]*?)\]/)?.[1] ?? '';
      assert.equal((opts.match(/'[^']*'/g) ?? []).length, 4, blk.slice(0, 20));
    }
  });
  it('check: the same labId eq check sits on the EQ Lab menu and completes the EQ Lab (tr_eq) — the guide says both', () => {
    const KEYS = code('src/features/lab/trainingLabKeys.ts');
    assert.match(KEYS, /EqLabHome: 'eq',/);
    assert.match(KEYS, /\{ route: 'EqLabHome', key: 'tr_eq', completion: 'understanding' \}/);
    assert.match(code('src/screens/lab/eq/EqLabHomeScreen.tsx'), /<LabUnderstandingBlock labId="eq"/);
    assert.match(SHELL, /const alreadyPassed = useLabClearedUnits\(labId\)\.has\(UNDERSTANDING_UNIT\);/);
    assert.match(GUIDES.check.changes.join(' '), /same questions as on the EQ Lab menu/);
    assert.match(GUIDES.check.teaches.join(' '), /completes the EQ Lab too/);
  });
});

describe('4. TRY THIS is what the screen prints', () => {
  it('Q 8 at the default 1 kHz +6 dB bell: the caption reads "+6 dB at 1 kHz, Q 8."', () => {
    assert.match(EQ_CFG, /initial: 1000,/);
    assert.match(EQ_CFG, /initial: 6,/);
    assert.match(EQ_CFG, /initial: EQ_BAND_TYPES\.peak/);
    assert.match(EQ_CFG, /`\$\{v\[EQ_GAIN\] > 0 \? '\+' : ''\}\$\{v\[EQ_GAIN\]\} dB at \$\{f\}, Q \$\{v\[EQ_Q\]\}\. `/);
    assert.match(EQ_CFG, /const f = v\[EQ_FREQ\] >= 1000 \? `\$\{v\[EQ_FREQ\] \/ 1000\} kHz` : `\$\{v\[EQ_FREQ\]\} Hz`;/);
    const fq = 1000;
    const f = fq >= 1000 ? `${fq / 1000} kHz` : `${fq} Hz`;
    assert.equal(`+${6} dB at ${f}, Q ${8}.`, '+6 dB at 1 kHz, Q 8.');
    assert.ok(GUIDES.explore.tryThis.join(' ').includes('+6 dB at 1 kHz, Q 8'));
    assert.match(FX, /<Text style=\{styles\.sectionHead\}>DESIGNED RESPONSE<\/Text>[\s\S]*?config\.heroCaption!\(values\)/);
  });
  it('a pass filter ignores GAIN: the caption and the drawn curve agree (the high-pass draw takes no gain or Q)', () => {
    assert.match(EQ_CFG, /GAIN and Q don't apply to the high-pass/);
    assert.match(EQ_CFG, /on the low-pass Q shapes the corner — a high Q adds a bump just before the cutoff/);
    assert.match(code('src/features/lab/fxViz.tsx'), /case 'highPass': db \+= butterworthHighPassDb\(b\.freq, f\); break;/);
    assert.match(code('src/features/lab/fxViz.tsx'), /case 'lowPass': db \+= biquadMagDb\(rbjLowPass\(b\.freq, b\.q\), f\); break;/);
    assert.ok(GUIDES.explore.tryThis.join(' ').includes('HIGH-PASS'));
  });
});

describe('5. the chip ruling and the wiring', () => {
  it('a concept lab: the glass is a teaching model, the curve a designed response, the audio uncalibrated, nothing measured', () => {
    assert.match(FX, /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(CFG_ALL, /const ANALYTIC = 'DESIGNED RESPONSE — ANALYTIC, NOT A MEASUREMENT';/);
    assert.match(EQ_CFG, /heroBadge: ANALYTIC,/);
    assert.match(FX, /dBFS · uncalibrated/);
    assert.doesNotMatch(EQ_CFG, /pollGr/, 'a measured readout appeared — re-rule the chip');
  });
  // Field names are read from FxLabScreen (siblings proposed screenGuide /
  // accuracyChip or guide / accuracy); the assertion is a todo until they exist.
  const guideKey = FX.match(/<LabShell[\s\S]*?guide=\{config\.(\w+)\}/)?.[1];
  const accKey = FX.match(/<LabShell[\s\S]*?accuracy=\{config\.(\w+)/)?.[1];
  const wired = guideKey != null;
  it('wiring: LabShell gets this lab’s per-tab guide, and no AccuracyNote chip', { todo: wired ? false : 'needs the shared FxLabScreen / fxLabConfigs change (see the rollout report)' }, () => {
    if (!wired) return;
    assert.ok(accKey, 'FxLabScreen forwards a guide but no accuracy flag');
    assert.ok(EQ_CFG.includes(`${guideKey}: equalizerScreenGuide,`), `eqConfig lacks ${guideKey}: equalizerScreenGuide`);
    assert.ok(EQ_CFG.includes(`${accKey}: false,`), `eqConfig lacks ${accKey}: false`);
  });
});
