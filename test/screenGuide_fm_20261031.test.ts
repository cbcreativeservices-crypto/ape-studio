/**
 * Screen Guide rollout — FM Synth Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (the LabShell lab).
 *
 *   1. every screen the learner reaches in this LabShell lab has a guide —
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the four FM
 *      understanding questions) — all five sections, the copy rules, 2–3 TRY
 *      THIS experiments;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the lab's source (comments stripped);
 *   4. the TRY THIS numbers are what the screen prints: re-run here with the
 *      screen's OWN besselJ (lifted from FmLabScreen.tsx), its Carson and
 *      band-top formulas and its 0.004 stick threshold;
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

const { FM_SCREEN_GUIDES, fmScreenGuide } = await import('../src/screens/lab/fmScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = FM_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/FmLabScreen.tsx';
const CHECKS = 'src/features/lab/understandingChecks.ts';
const SRC = [
  code(SCREEN),
  code('src/screens/lab/LabShell.tsx'),
  code('src/screens/lab/rack/RackUnit.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/features/lab/guidedLessons/content.ts'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');

describe('1. every FM screen has a complete guide', () => {
  it('one guide per LabShell tab the lab offers: explore + learn + check (the lab has authored FM questions)', () => {
    assert.deepEqual(Object.keys(FM_SCREEN_GUIDES).sort(), ['check', 'explore', 'learn']);
    const checks = code(CHECKS);
    assert.match(checks, /^\s*fm: FM,$/m, 'FM has an understanding check → LabShell shows a CHECK tab');
    assert.equal(fmScreenGuide('explore'), FM_SCREEN_GUIDES.explore);
    assert.equal(fmScreenGuide('learn'), FM_SCREEN_GUIDES.learn);
    assert.equal(fmScreenGuide('check'), FM_SCREEN_GUIDES.check);
    assert.equal(fmScreenGuide('other'), undefined);
    // The CHECK guide says "four questions" — the check has exactly four.
    const fm = checks.match(/const FM: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
    assert.equal((fm.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(FM_SCREEN_GUIDES.check.seeing[0], /four questions/);
    // LAB NOTES on EXPLORE carries two CHECK YOURSELF questions — the guide says two.
    assert.equal((code(SCREEN).match(/<CheckQuestion/g) ?? []).length, 2);
    assert.match(FM_SCREEN_GUIDES.explore.control.join(' '), /LAB NOTES below hold two quick questions/);
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
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v7)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Yamaha|DX7|DX-7|Chowning|Native Instruments|FM8|Korg|Roland|Moog|Elektron)\b/, `${id}: a gear maker/model name`);
    }
  });
  it('the CHECK guide never gives an answer away', () => {
    const t = textOf(GUIDES.check);
    for (const answer of ['100 Hz and 300 Hz', 'How many sidebands are strong', 'between harmonics — a bell', 'A pure sine — the carrier alone']) {
      assert.ok(!t.includes(answer), `the CHECK guide quotes the answer "${answer}"`);
    }
    assert.doesNotMatch(t, /\b100 Hz\b|\b300 Hz\b|pure sine/i);
    // Decision 6 (2026-11-08): no TRY THIS walks to a reading that IS an answer.
    // Index 0 → the answer is the reading itself, so CHECK points to LEARN's INDEX entry;
    // the sideband question gets a DIFFERENT pair (FC 440 · RATIO 0.5), not 200 / 100.
    const ci = (GUIDES.check as unknown as { intro: { learning: string; start: string } }).intro;
    const ct = [...GUIDES.check.tryThis, ci.learning, ci.start].join(' ');
    assert.doesNotMatch(ct, /INDEX to 0|carrier alone|one green stick|step RATIO and watch|\b200 Hz\b/i);
    assert.match(GUIDES.check.tryThis[1], /On LEARN, read the INDEX entry under CONTROLS/);
    assert.match(GUIDES.check.tryThis[0], /FC 440 and RATIO 0\.5, so FM reads 220 Hz/);
  });
  it('the header ▶ stays on LEARN, so LEARN never says "Nothing here plays"', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.match(code(SCREEN), /headerAction=\{\s*<HeaderPlayButton/);
    assert.doesNotMatch(textOf(GUIDES.learn), /Nothing here plays|moves or plays/);
    assert.match(GUIDES.learn.seeing[0], /▶ in the header still strikes the voice you set on EXPLORE/);
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
      // the display: badge words, the legend, the axis tags
      'SIDEBAND SPECTRUM', 'Bessel', '|J| 1', '0.5', 'Hz', 'fc', 'carrier', 'amber', 'sidebands', 'reflected below 0 Hz', 'red dashed', 'ALIASED past Nyquist',
      // bezel keys
      'FC', 'FM', 'BW',
      // dock + header + rack
      'INDEX', 'RATIO', 'ENV', 'STRIKE', 'SUSTAIN', 'PLUCK', 'BELL', '110', '220', '440 Hz', '1.41 ✳', '3.5', 'LAB NOTES', 'HIDE DISPLAY', '▶', '■',
    ],
    // 'Bessel' (not 'Bessel amplitudes'): the 2026-11-08 lesson rewrite says "Bessel math / heights".
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'INDEX', 'FC', 'RATIO', 'ENV', 'Bessel', 'Nyquist', '1.41 ✳', '440 Hz', '▶'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'RATIO', 'INDEX', 'FM'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(FM_SCREEN_GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        // the legend says "red dashed"; the guide starts a sentence with it ("Red dashed:")
        const inGuide = n === 'red dashed' ? gt.toLowerCase().includes(n) : gt.includes(n);
        assert.ok(inGuide, `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the dock options the guide lists are exactly the screen’s', () => {
    const s = code(SCREEN);
    assert.match(s, /const CARRIERS = \[110, 220, 440\] as const;/);
    const ratios = [...s.matchAll(/\{ v: [\d.]+, label: '([^']+)', blurb:/g)].map((m) => m[1]);
    assert.deepEqual(ratios, ['0.5', '1', '1.41 ✳', '2', '3.5', '7']);
    assert.match(FM_SCREEN_GUIDES.explore.control.join(' '), /FC picks the carrier: 110, 220 or 440 Hz\. RATIO sets the modulator as carrier × 0\.5, 1, 1\.41 ✳, 2, 3\.5 or 7/);
    const envs = [...s.matchAll(/\{ key: '[a-z]+', label: '([A-Z]+)', decaySec:/g)].map((m) => m[1]);
    assert.deepEqual(envs, ['SUSTAIN', 'PLUCK', 'BELL']);
    assert.match(s, /const INDEX_MAX = 8;/);
    assert.match(s, /\{ kind: 'action', id: 'strike', label: 'STRIKE'/);
    // the LEARN guide's CONTROLS list = the lesson's five control entries
    const lesson = code('src/features/lab/guidedLessons/content.ts').match(/\n  fm: \{([\s\S]*?)\n  \},/)?.[1] ?? '';
    const keys = [...lesson.matchAll(/\{ key: ["']([a-z_]+)["'], name:/g)].map((m) => m[1]);
    assert.deepEqual(keys, ['display', 'carrier', 'ratio', 'index', 'index_env']);
  });
});

describe('4. the TRY THIS numbers are what the screen prints', () => {
  const s = code(SCREEN);
  // The screen's OWN Bessel function, lifted from its source and run as-is
  // (types stripped) — so the test cannot drift from what the graph draws.
  const besselSrc = s.match(/function besselJ\(k: number, x: number\): number \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(besselSrc, 'besselJ not found in FmLabScreen.tsx');
  const besselJ = new Function('k', 'x', besselSrc) as (k: number, x: number) => number;

  it('the screen’s formulas and defaults the numbers come from', () => {
    assert.match(s, /const NYQUIST = 24000;/);
    assert.match(s, /useState<number>\(220\)/); // FC 220
    assert.match(s, /useState\(3\); \/\/ ratio 2/); // RATIO 2
    assert.match(s, /useState<number>\(2\);/); // INDEX 2
    assert.match(s, /const fm = carrier \* ratio;/);
    assert.match(s, /const carson = 2 \* fm \* \(index \+ 1\);/);
    assert.match(s, /const bandTop = carrier \+ carson \/ 2;/);
    assert.match(s, /const pastNyquist = bandTop > NYQUIST;/);
    assert.match(s, /k: 'BW',\s*v: `\$\{\(carson \/ 1000\)\.toFixed\(1\)\} kHz`,\s*tint: pastNyquist \? '#ff6b5e' : undefined,/);
    assert.match(s, /\{ k: 'FM', v: `\$\{fm\.toFixed\(0\)\} Hz`/);
    assert.match(s, /onChange: \(v\) => setIndex\(Math\.round\(v \* INDEX_MAX \* 10\) \/ 10\)/); // 0.1 steps → 2.4 reachable
    assert.match(s, /format: \(\) => `I = \$\{index\.toFixed\(1\)\}`/);
    assert.match(s, /if \(a < 0\.004\) continue;/);
    assert.match(s, /const isCarrier = s\.fold === 'none' && Math\.abs\(s\.f - fc\) < 1e-6;/);
    assert.match(s, /col = s\.fold === 'alias' \? '#ff6b5e'/);
    // the lifted function is the real Bessel J (spot values)
    assert.ok(Math.abs(besselJ(0, 1) - 0.7651977) < 1e-6);
    assert.ok(Math.abs(besselJ(1, 2) - 0.5767248) < 1e-6);
  });

  const bw = (fc: number, ratio: number, I: number) => `${((2 * fc * ratio * (I + 1)) / 1000).toFixed(1)} kHz`;
  const red = (fc: number, ratio: number, I: number) => fc + (2 * fc * ratio * (I + 1)) / 2 > 24000;
  /** The sticks the graph draws, exactly as SidebandGraph builds them. */
  const sticks = (fc: number, fm: number, I: number) => {
    const K = Math.min(24, Math.ceil(I + 2) + 2);
    const out: { f: number; a: number; fold: string }[] = [];
    for (let k = 0; k <= K; k++) {
      const a = Math.abs(besselJ(k, I));
      if (a < 0.004) continue;
      const push = (f: number) => {
        let fold = 'none';
        let ff = f;
        if (ff < 0) { ff = -ff; fold = 'reflect'; }
        if (ff > 24000) { ff = 48000 - ff; fold = 'alias'; }
        if (ff < 0) return;
        out.push({ f: ff, a, fold });
      };
      push(fc + k * fm);
      if (k > 0) push(fc - k * fm);
    }
    return out;
  };

  it('EXPLORE 1: INDEX 0 → the carrier alone; BW 2.6 kHz at I 2.0 and 7.9 kHz at I 8.0 (FC 220, RATIO 2)', () => {
    const at0 = sticks(220, 440, 0);
    assert.deepEqual(at0.map((x) => [x.f, x.fold]), [[220, 'none']]);
    assert.equal(bw(220, 2, 2), '2.6 kHz');
    assert.equal(bw(220, 2, 8), '7.9 kHz');
    assert.ok(sticks(220, 440, 8).length > sticks(220, 440, 2).length, 'more sticks as the index rises');
    assert.match(FM_SCREEN_GUIDES.explore.tryThis[0], /I 2\.0: BW 2\.6 kHz\)\. Ride INDEX to 0: one green stick, the carrier alone\.[\s\S]*BW reaches 7\.9 kHz/);
  });
  it('EXPLORE 2: FM reads 220 Hz at RATIO 1 and 310 Hz at 1.41 ✳; sticks on multiples of 220 vs between', () => {
    assert.equal((220 * 1).toFixed(0), '220');
    assert.equal((220 * 1.41).toFixed(0), '310');
    for (const x of sticks(220, 220, 2)) assert.ok(Math.abs(x.f / 220 - Math.round(x.f / 220)) < 1e-9, `${x.f} Hz is a multiple of 220`);
    const off = sticks(220, 220 * 1.41, 2).filter((x) => Math.abs(x.f / 220 - Math.round(x.f / 220)) > 0.05);
    assert.ok(off.length >= 4, 'at 1.41 most sticks fall between the multiples of 220 Hz');
    assert.match(FM_SCREEN_GUIDES.explore.tryThis[1], /FM reads 220 Hz, then 310 Hz/);
  });
  it('CHECK 1: FC 440 · RATIO 0.5 → FM 220 Hz; the amber pair nearest the carrier is drawn at 220 and 660 Hz (I 2.0)', () => {
    assert.equal((440 * 0.5).toFixed(0), '220');
    const st = sticks(440, 220, 2).filter((x) => x.fold === 'none');
    for (const f of [220, 660]) assert.ok(st.some((x) => x.f === f && x.a > 0.5), `${f} Hz drawn as a strong amber stick`);
  });
  it('EXPLORE 3 + LEARN 1: RATIO 1.41 ✳ at I 2.4 → no green carrier stick (|J₀| < 0.004, nothing reflected onto fc)', () => {
    assert.ok(Math.abs(besselJ(0, 2.4)) < 0.004, `J0(2.4) = ${besselJ(0, 2.4)}`);
    const st = sticks(220, 220 * 1.41, 2.4);
    assert.equal(st.filter((x) => Math.abs(x.f - 220) < 1e-6).length, 0, 'nothing drawn at fc');
    // the neighbours still draw it — the vanishing is specific to I = 2.4
    assert.ok(Math.abs(besselJ(0, 2.3)) >= 0.004 && Math.abs(besselJ(0, 2.5)) >= 0.004);
    assert.match(FM_SCREEN_GUIDES.explore.tryThis[2], /RATIO 1\.41 ✳ and INDEX to I = 2\.4: the green carrier stick vanishes/);
    assert.match(FM_SCREEN_GUIDES.learn.tryThis[0], /RATIO 1\.41 ✳ and INDEX to I = 2\.4: the carrier stick disappears/);
    // …and the lesson line it points at says J₀ = 0 near 2.4
    assert.match(code('src/features/lab/guidedLessons/content.ts'), /J₀=0 near I≈2\.4|the carrier almost disappears near I = 2\.4/); // old lesson line, or the 2026-11-08 rewrite
  });
  it('LEARN 2: FC 440, RATIO 7, INDEX 8 → BW 55.4 kHz in red, with red dashed (aliased) sticks', () => {
    assert.equal(bw(440, 7, 8), '55.4 kHz');
    assert.ok(red(440, 7, 8));
    assert.ok(sticks(440, 3080, 8).some((x) => x.fold === 'alias'), 'an aliased stick is drawn');
    // and at the default (FC 220 RATIO 2) nothing is red even at I 8
    assert.ok(!red(220, 2, 8));
    assert.match(FM_SCREEN_GUIDES.learn.tryThis[1], /FC 440 Hz, RATIO 7 and INDEX 8: BW reads 55\.4 kHz in red, and red dashed sticks/);
  });
  it('the guide’s 24 kHz is the screen’s NYQUIST and its BW formula is the screen’s', () => {
    assert.match(FM_SCREEN_GUIDES.explore.changes.join(' '), /BW = 2 × FM × \(I \+ 1\) estimates where most energy sits\. Weaker sticks reach past it, and any past 24 kHz fold back: aliasing\./);
    assert.match(FM_SCREEN_GUIDES.explore.seeing.join(' '), /red once its top passes 24 kHz/);
    // 24 kHz = half the engine's 48 kHz rate (ApeDspJni.cpp configures 48000)
    assert.match(FM_SCREEN_GUIDES.explore.seeing.join(' '), /Nyquist, 24 kHz \(half of 48 kHz\)/);
    assert.match(code('modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp'), /gen_\.configure\(48000\.0\)/);
  });
  // Review 2026-10-31 (vetted): BW is Carson's ESTIMATE — weaker sticks alias
  // before BW turns red, so the guide must not tie aliasing to BW alone.
  it('sticks alias while BW is still plain: FC 440 · RATIO 7 · I 6.0 → BW 43.1 kHz (top 22 000 Hz), yet red dashed sticks', () => {
    assert.equal(bw(440, 7, 6), '43.1 kHz');
    assert.ok(!red(440, 7, 6), 'BW not red');
    const al = sticks(440, 3080, 6).filter((x) => x.fold === 'alias');
    assert.equal(al.length, 6);
    assert.ok(al.some((x) => x.f === 22920 && Math.abs(x.a - 0.0565) < 0.001), 'k = 8 (25 080 Hz) drawn at 22 920 Hz');
    assert.doesNotMatch(FM_SCREEN_GUIDES.explore.changes.join(' '), /If its top passes 24 kHz, those sidebands fold back/);
  });
  // Review 2026-10-31 (vetted): at the default every reflected stick lands on
  // another stick, and the two COMBINE — add OR partly cancel (sin-sin voice,
  // Generator.hpp): 220 Hz = J0 + J1 ≈ 0.80, 660 Hz = J1 − J2 ≈ 0.22.
  it('default (FC 220 · RATIO 2 · I 2.0): reflected sticks land on other sticks; the guide says they combine', () => {
    const st = sticks(220, 440, 2);
    const refl = st.filter((x) => x.fold === 'reflect');
    assert.ok(refl.length >= 4);
    for (const r of refl) assert.ok(st.some((x) => x.fold === 'none' && Math.abs(x.f - r.f) < 1e-6), `${r.f} Hz reflect sits on a true stick`);
    assert.ok(Math.abs(besselJ(0, 2) + besselJ(1, 2) - 0.801) < 0.001);
    assert.ok(Math.abs(besselJ(1, 2) - besselJ(2, 2) - 0.224) < 0.001);
    assert.match(code('modules/ape-dsp/ios/core/Generator.hpp'), /std::sin\(2\.0 \* kPi \* fmPhC_ \+ I \* std::sin\(2\.0 \* kPi \* fmPhM_\)\)/);
    assert.match(FM_SCREEN_GUIDES.explore.seeing.join(' '), /reflected below 0 Hz, folded up; on a stick, they combine/);
    assert.doesNotMatch(FM_SCREEN_GUIDES.explore.seeing.join(' '), /adds to/);
  });
  // Review 2026-10-31 (vetted): STRIKE has no helpKey, so the long-press line
  // names only the keys that open a lesson entry.
  it('long-press names only keys with a lesson entry', () => {
    assert.doesNotMatch(s, /\{ kind: 'action', id: 'strike'[^}]*helpKey/);
    assert.match(FM_SCREEN_GUIDES.explore.control.join(' '), /Long-press INDEX, FC, RATIO, ENV or a readout to read about it/);
  });
  // Review 2026-10-31 (vetted): the graph is drawn from the static index; the
  // PLUCK / BELL decay reaches only the native voice.
  it('PLUCK / BELL: the graph shows the strike, the sound dulls', () => {
    assert.match(s, /<SidebandGraph fc=\{carrier\} fm=\{fm\} index=\{index\}/);
    assert.match(s, /fm: \{ ratio, index, decaySec: env\.decaySec \}/);
    assert.match(FM_SCREEN_GUIDES.explore.control.join(' '), /The graph keeps the strike’s bright start while the sound dulls toward the carrier/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  const s = code(SCREEN);
  it('LabShell gets the per-tab guide function from fmScreenGuides', () => {
    assert.match(s, /import \{ FM_END_GUIDE, fmScreenGuide \} from '\.\/fmScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{fmScreenGuide\}/);
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /typeof guide === 'function' \? guide\(mode\)/);
    assert.match(shell, /<ScreenGuideHost resetKey=\{`\$\{mode\}:\$\{guideIdOf\(shownGuide\)\}`\} regions=\{!!rack && mode === 'explore'\}>/);
    assert.match(s, /rack=\{\{/);
  });
  it('a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(s, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(s, /<AccuracyNote/);
    // Only the generator is ever started — no microphone is opened; the
    // numbers are synthesis settings and the computed Bessel spectrum.
    const calls = new Set([...s.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^gen[A-Z]\w*$|^(isAvailable|engineVersion|wave2Available)$/, `ApeDsp.${c} — not a generator call`);
    assert.doesNotMatch(s, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
    // The honesty stays on the faceplate and in the notes.
    // PLUCK/BELL decay the voice's index after the strike, so there the badge
    // and caption say "at the strike"; SUSTAIN keeps the full claim.
    // Folded sticks are drawn separately but merge in the sound (default
    // FC 220 / RATIO 2 / I 2: 220 Hz = J0 + J1 ≈ 0.80, 660 Hz = J1 − J2 ≈ 0.22,
    // DFT-verified 2026-10-31), so no "exact spectrum" claim (fix 2026-10-31).
    assert.match(s, /badge:\s*env\.decaySec > 0\s*\? 'SIDEBAND SPECTRUM — BESSEL AMPLITUDES J_k\(I\) · AT THE STRIKE'\s*: 'SIDEBAND SPECTRUM — BESSEL AMPLITUDES J_k\(I\) · EACH AT FC ± k·FM'/);
    assert.match(s, /exploreCaption=\{\s*env\.decaySec > 0\s*\? '[^']*each sideband at the strike[^']*'\s*: '[^']*a dashed one merges with the stick it lands on\.'/);
    assert.doesNotMatch(s, /exact spectrum|THE MATH THE VOICE PLAYS|EXACT BESSEL/);
    const lessons = read('src/features/lab/guidedLessons/content.ts');
    assert.doesNotMatch(lessons, /actual spectrum the voice plays/);
    assert.match(lessons, /Where a dim dashed stick lands on another stick, the two combine in the sound/);
    assert.match(s, /Output \{GEN_LEVEL_DB\} dBFS · uncalibrated\./);
  });
});
