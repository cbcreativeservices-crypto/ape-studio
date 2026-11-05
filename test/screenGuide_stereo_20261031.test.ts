/**
 * Screen Guide rollout — Stereo Imaging Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot) and
 * test/screenGuide_chain_20261031.test.ts (a LabShell rack lab).
 *
 *   1. every screen the learner reaches has a guide — the three LabShell tabs
 *      EXPLORE (the rack), LEARN (the reading page) and CHECK (the lab has an
 *      understanding check) — all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget (types.ts SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the source (stereoConfig in fxLabConfigs.tsx,
 *      FxLabScreen.tsx, fxAnim.tsx StereoFlow, fxViz.tsx LissajousGraph,
 *      LabShell / RackUnit / LabUnderstandingCheck);
 *   4. the TRY THIS numbers are what the screen draws: LissajousGraph's
 *      correlation for the width lab's test tone, re-run sample by sample,
 *      and the constant-power pan law shared by the engine and the display;
 *   5. wiring — PENDING a shared-file change: the lab is a config inside the
 *      shared fxLabConfigs.tsx and renders through the shared FxLabScreen,
 *      which does not forward `guide` / `accuracy` to LabShell yet. Once it
 *      does, these checks run (skipped until then, never silently passing).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const { STEREO_SCREEN_GUIDES, stereoScreenGuide } = await import('../src/screens/lab/stereoScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = STEREO_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CONFIGS = code('src/screens/lab/fxLabConfigs.tsx');
const CFG = CONFIGS.slice(CONFIGS.indexOf('const stereoConfig: FxLabConfig = {'), CONFIGS.indexOf('export const StereoLabScreen'));
const SOURCES = CONFIGS.slice(CONFIGS.indexOf('const SRC_PINK = '), CONFIGS.indexOf('const srcClick'));
const FX = code('src/screens/lab/FxLabScreen.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const STEREO_FLOW = ANIM.slice(ANIM.indexOf('function StereoFlow('), ANIM.indexOf('function FlowBody('));
const VIZ = code('src/features/lab/fxViz.tsx');
const LISSA = VIZ.slice(VIZ.indexOf('export function LissajousGraph('), VIZ.indexOf('export function GrMeter('));
const CONTENT = code('src/features/lab/guidedLessons/content.ts');
const LESSON = CONTENT.slice(CONTENT.indexOf('  stereo: {'), CONTENT.indexOf('  harmonograph: {'));
const CHECKS_SRC = code('src/features/lab/understandingChecks.ts');
const CHECK = CHECKS_SRC.slice(CHECKS_SRC.indexOf('const STEREO'), CHECKS_SRC.indexOf('const BINAURAL'));
const SHELL = [code('src/screens/lab/LabShell.tsx'), code('src/screens/lab/rack/RackUnit.tsx'), code('src/components/LabUnderstandingCheck.tsx'), code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'), code('src/screens/lab/foundations/bits.tsx')].join('\n');

describe('1. every Stereo Imaging screen has a complete guide', () => {
  it('one guide per LabShell tab: explore, learn and check (the lab has an understanding check)', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(CHECKS_SRC, /^\s*stereo: STEREO,/m, 'the stereo check is what gives the lab its CHECK tab');
    assert.match(CFG, /labId: 'stereo',/);
    for (const m of ['explore', 'learn', 'check']) assert.equal(stereoScreenGuide(m), (STEREO_SCREEN_GUIDES as any)[m]);
    assert.equal(stereoScreenGuide('other'), undefined);
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
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|engine 10)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Waves|iZotope|Ozone|Brainworx|bx_|Soundtoys|FabFilter|Izotope|Nugen|Ableton|Pro Tools|Logic)\b/, `${id}: a gear/software brand`);
    }
  });
});

describe('1b. review fixes 2026-10-31', () => {
  it('no app-version note in learner text', () => {
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /app version|older build|without stereo sources/i, `${id}: a build note`);
  });
  it('MID, SIDE and goniometer are explained the first time they appear', () => {
    assert.match(GUIDES.explore.seeing[0], /M\/S WIDTH stage \(MID = what L and R share, SIDE = what differs\)/);
    assert.match(GUIDES.explore.seeing.join(' '), /a goniometer, a picture of L against R \(M up, S across\)/);
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
      in: [CFG, SOURCES, FX, STEREO_FLOW, ANIM, LISSA, SHELL].join('\n'),
      names: [
        'IN ▸', '▸ OUT', 'M/S WIDTH', 'STEREO TEST TONE · L ≠ R', 'SAME TONE IN L AND R',
        'WIDTH', 'PAN', 'FOLD', 'STEREO', 'MONO', 'MONO CHECK', 'CENTER', 'BASS', '120 Hz', 'OFF', 'SOURCE',
        'PINK NOISE · STEREO', 'SINE 440 Hz · STEREO', 'PINK NOISE · MONO', 'PINK NOISE', 'SINE 440 Hz',
        'DESIGNED RESPONSE', 'CORRELATION', 'LAB NOTES', 'CHECK YOURSELF', 'ⓘ GUIDED LESSON',
      ],
    },
    learn: {
      in: SHELL + LESSON,
      names: ['CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'ADV', 'Pan', 'Width', 'Mid gain', 'Side gain', 'Mono-fold', 'Bass-Mono', 'ⓘ GUIDED LESSON', 'LAB NOTES'],
    },
    check: {
      in: SHELL,
      names: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'Every question answered correctly — this lab is complete.'],
    },
  };
  it('a name list for every screen', () => assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort()));
  for (const [id, { names, in: src }] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the screen source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the dock, the readouts and the display labels are the config’s and the shell’s', () => {
    // dock keys: the WIDTH fader + PAN / BASS / FOLD trays + the shared SOURCE tray
    assert.match(CFG, /label: 'WIDTH', paramId: P\.widthPct/);
    assert.match(CFG, /fader: \{ min: 0, max: 200, .*, home: 100 \},/);
    assert.match(CFG, /label: 'BASS-MONO', short: 'BASS'/);
    assert.match(CFG, /label: 'MONO-FOLD', short: 'FOLD'/);
    assert.match(CFG, /\{ label: 'L', value: -1 \},\s*\{ label: 'CENTER', value: 0 \},\s*\{ label: 'R', value: 1 \},/);
    assert.match(CFG, /\{ label: 'OFF', value: 0 \},\s*\{ label: '120 Hz', value: 120 \},/);
    assert.match(CFG, /\{ label: 'STEREO', value: 0 \},\s*\{ label: 'MONO CHECK', value: 1 \},/);
    assert.match(FX, /label: 'SOURCE',/);
    // bezel readouts WIDTH · PAN · BASS · FOLD; the FOLD cell shortens 'MONO CHECK' to 'MONO' (shortChoice)
    assert.match(CFG, /bezel: \[\s*\{ k: 'WIDTH', paramId: P\.widthPct \},\s*\{ k: 'PAN', paramId: P\.pan \},\s*\{ k: 'BASS', paramId: P\.bassMonoHz \},\s*\{ k: 'FOLD', paramId: P\.monoFold \},\s*\],/);
    const shortChoice = (label: string) => {
      if (label.length <= 8) return label;
      const parts = label.split(' ');
      return parts.length > 1 && /^(dB|Hz|kHz|ms|s|%)$/.test(parts[1]) ? `${parts[0]} ${parts[1]}` : parts[0];
    };
    assert.match(FX, /if \(label\.length <= 8\) return label;/);
    assert.equal(shortChoice('MONO CHECK'), 'MONO');
    assert.equal(shortChoice('STEREO'), 'STEREO');
    assert.match(GUIDES.explore.seeing.join(' '), /Readouts: WIDTH, PAN, BASS and FOLD \(STEREO, or MONO in a mono check\)/);
    // the display: the width flavour's stage label, IN/OUT, the L/R legend colours
    assert.match(ANIM, /case 'stereo': return model\.flavor === 'phase' \? 'R: Ø · DLY' : 'M\/S WIDTH';/);
    assert.match(CFG, /kind: 'stereo',\s*flavor: 'width',/);
    assert.match(STEREO_FLOW, /legend=\{\[\{ label: 'L', color: AMBER \}, \{ label: 'R', color: BLUE \}\]\}/);
    // the goniometer's graticule labels M (top), S (right), L and R (top corners)
    for (const l of ['M', 'S', 'L', 'R']) assert.match(LISSA, new RegExp(`fontFamily=\\{fonts\\.oswaldSemiBold\\}>${l}</SvgText>`));
    for (const t of ['−1', '0', '+1']) assert.ok(LISSA.includes(`<Text style={lissaStyles.corrTick}>${t}</Text>`));
    // stereo sources replace the mono pair only when the build can play them
    assert.match(FX, /config\.stereoSources && ApeDsp\.stereoSpreadAvailable\(\) \? config\.stereoSources : config\.sources/);
    assert.match(CFG, /sources: \[SRC_PINK, srcSine\(440\)\],/);
    assert.match(CFG, /stereoSources: \[SRC_PINK_STEREO, SRC_SINE_STEREO, SRC_PINK_MONO\],/);
  });
  it('LEARN: the lesson lists Mid gain and Side gain (not on EXPLORE) and three ADV entries — the guide says so', () => {
    assert.equal((LESSON.match(/advanced: true/g) ?? []).length, 3);
    assert.match(LESSON, /key: 'mid', name: 'Mid gain \(M\)'/);
    assert.match(LESSON, /key: 'side', name: 'Side gain \(S\)'/);
    assert.doesNotMatch(CFG, /P\.midGain|P\.sideGain|label: 'MID'|label: 'SIDE'/);
    assert.match(GUIDES.learn.changes.join(' '), /Mid gain, Side gain and the ADV entries describe controls this screen does not have/);
  });
  it('the guide never reads the goniometer after a FOLD or a PAN (LissajousGraph does not receive them)', () => {
    assert.match(CFG, /<LissajousGraph widthPct=\{v\[P\.widthPct\]\} invertR=\{false\} delayRms=\{0\} toneHz=\{440\} inputLrRad=\{src\?\.monoCompare \? 0 : STEREO_TEST_LR_RAD\} \/>/);
    for (const [id, gd] of allGuides) {
      for (const line of gd.tryThis) {
        if (/goniometer|CORRELATION/.test(line)) assert.doesNotMatch(line, /FOLD|MONO CHECK|PAN/, `${id}: reads the goniometer after a fold/pan — it does not show them`);
      }
    }
    // …and never combines MONO CHECK with PAN L/R (the flow folds after the pan, the engine before).
    for (const [id, gd] of allGuides) for (const line of gd.tryThis) assert.ok(!(/MONO CHECK/.test(line) && /PAN to [LR]\b/.test(line)), `${id}: combines fold and pan`);
  });
  it('the CHECK guide names the four questions the check asks; right answers survive a tab switch (D41)', () => {
    for (const id of ["id: 'width-is-side'", "id: 'mono-fold'", "id: 'bass-mono'", "id: 'correlation-negative'"]) assert.ok(CHECK.includes(id), id);
    assert.equal((CHECK.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(GUIDES.check.seeing.join(' '), /four questions: what WIDTH changes, a fold to mono at 200%, why bass goes mono, and a correlation near −1/);
    // D41: the CHECK stays mounted across a tab switch; right answers stay right.
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{hasCheck \? \(\s*<View style=\{mode === 'check' \? styles\.rackFill : styles\.rackHidden\}>\s*<ScrollView[\s\S]*?<LabUnderstandingCheck/);
    assert.match(GUIDES.check.control.join(' '), /Answers already right stay right if you switch to LEARN or EXPLORE and come back/);
    assert.match(GUIDES.check.control.join(' '), /FINISH · SEE WHAT’S LEFT › opens Where you are/);
  });
  it('the Phase lab draws the same goniometer (the "shares its goniometer" claim)', () => {
    const phase = CONFIGS.slice(CONFIGS.indexOf('const phaseConfig'), CONFIGS.indexOf('export const PhaseLabScreen'));
    assert.match(phase, /<LissajousGraph /);
    assert.match(GUIDES.explore.teaches.join(' '), /shares its goniometer with the Phase lab/);
  });
});

/** LissajousGraph's correlation, sample by sample, exactly as fxViz draws it. */
function corr(widthPct: number, inputLrRad: number): number {
  const N = 720;
  const phi = inputLrRad;
  const w = widthPct / 100;
  let sLL = 0, sRR = 0, sLR = 0;
  for (let i = 0; i <= N; i++) {
    const th = (2 * Math.PI * i) / N;
    let l = Math.sin(th);
    let r = Math.sin(th - phi);
    const m = 0.5 * (l + r), s = 0.5 * (l - r) * w;
    l = m + s;
    r = m - s;
    sLL += l * l; sRR += r * r; sLR += l * r;
  }
  return sLR / Math.max(Math.sqrt(sLL * sRR), 1e-9);
}
const fmt = (c: number) => (c >= 0 ? `+${c.toFixed(2)}` : `−${Math.abs(c).toFixed(2)}`);

describe('4. the numbers in the guide are the numbers the screen draws', () => {
  it('the maths re-run here is LissajousGraph’s (same mid/side law, same correlation, same printout)', () => {
    assert.match(VIZ, /export const STEREO_TEST_LR_RAD = 1\.1;/);
    assert.match(LISSA, /const phi = 2 \* PI \* toneHz \* \(delayRms \/ 1000\) \+ inputLrRad;/);
    assert.match(LISSA, /const m = 0\.5 \* \(l \+ r\), s = 0\.5 \* \(l - r\) \* width;/);
    assert.match(LISSA, /const c = sLR \/ Math\.max\(Math\.sqrt\(sLL \* sRR\), 1e-9\);/);
    assert.match(LISSA, /\{corr >= 0 \? `\+\$\{corr\.toFixed\(2\)\}` : corr\.toFixed\(2\)\}/);
  });
  it('CORRELATION: +1.00 at 0%, +0.45 at 100%, −0.20 at 200% (it never nears −1 for this tone)', () => {
    const T = 1.1;
    assert.equal(fmt(corr(0, T)), '+1.00');
    assert.equal(fmt(corr(100, T)), '+0.45');
    assert.equal(fmt(corr(200, T)), '−0.20');
    // closed form agrees: (1+c − w²(1−c)) / (1+c + w²(1−c))
    const c = Math.cos(T);
    const cf = (w: number) => (1 + c - w * w * (1 - c)) / (1 + c + w * w * (1 - c));
    for (const w of [0, 0.5, 1, 1.5, 2]) assert.ok(Math.abs(cf(w) - corr(w * 100, T)) < 5e-3, `closed form vs drawn at ${w}`);
    assert.ok(corr(200, T) > -0.5, 'the lab’s widest setting stays far from −1');
    assert.match(GUIDES.explore.tryThis.join(' '), /CORRELATION reads \+1\.00 at 0%, \+0\.45 at 100% and −0\.20 at 200%/);
    assert.match(GUIDES.check.tryThis.join(' '), /WIDTH to 200%: CORRELATION reads −0\.20/);
    assert.match(GUIDES.learn.tryThis.join(' '), /WIDTH to 0%[\s\S]*CORRELATION reads \+1\.00/);
  });
  it('0% draws a vertical line (no SIDE); the mono comparison source is +1.00 at every width', () => {
    // the rotated plot: x = (r − l)/2 = −s, so s = 0 → x constant → a vertical line
    assert.match(LISSA, /const px = SIZE \/ 2 \+ \(\(r - l\) \/ 2\) \* \(SIZE \/ 2 - 12\);/);
    for (const w of [0, 100, 200]) assert.equal(fmt(corr(w, 0)), '+1.00');
    assert.match(CFG, /Width 0 = pure MID: a vertical line, perfectly mono-safe\./);
    assert.match(SOURCES, /monoCompare: true,/);
  });
  it('the WIDTH fader reaches 0, 100 and 200 exactly (5% snap)', () => {
    assert.match(CFG, /snap: \(v\) => Math\.round\(v \/ 5\) \* 5/);
  });
  it('PAN L: R output 0, L ×√2 (+3 dB) — the engine law the flow display mirrors', () => {
    const hpp = read('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(hpp, /const double panL = std::cos\(\(pan \+ 1\.0\) \* fx::kPi \/ 4\.0\);/);
    assert.match(hpp, /const double panR = std::sin\(\(pan \+ 1\.0\) \* fx::kPi \/ 4\.0\);/);
    assert.match(hpp, /R\[i\] = static_cast<float>\(r \* panR \* 1\.41421356\);/);
    assert.match(STEREO_FLOW, /const gR = Math\.sin\(\(\(panG\.value \+ 1\) \* Math\.PI\) \/ 4\) \* Math\.SQRT2;/);
    const gL = Math.cos(0) * Math.SQRT2;
    const gR = Math.sin(0) * Math.SQRT2;
    assert.equal(gR, 0);
    assert.equal((20 * Math.log10(gL)).toFixed(1), '3.0');
    assert.equal(Math.cos(Math.PI / 4) * Math.SQRT2 - 1 < 1e-12, true, 'CENTER is unity');
    assert.match(GUIDES.explore.changes.join(' '), /PAN at L or R silences the other side and lifts the kept side 3 dB/);
    assert.match(GUIDES.explore.tryThis.join(' '), /With FOLD on STEREO, set PAN to L: the blue R trace on OUT goes flat/);
    // 2026-10-31 review: PAN is a balance on the finished stereo signal — the R input
    // never reaches L (L = l·panL·√2), so it is muted, not moved.
    assert.match(hpp, /L\[i\] = static_cast<float>\(l \* panL \* 1\.41421356\);/);
    assert.match(GUIDES.explore.control.join(' '), /PAN key: L, CENTER or R — a balance control: at L the right channel is muted and the left is lifted 3 dB/);
    assert.match(GUIDES.explore.tryThis.join(' '), /the right channel is muted, not moved/);
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /moves the whole image|everything moves to the/, `${id}: PAN does not move the image`);
  });
  it('MONO CHECK: both OUT traces land on one line (the flow display), as the engine sums L and R', () => {
    assert.match(STEREO_FLOW, /const mono = \(lp \+ rp\) \/ 2;/);
    assert.match(read('modules/ape-dsp/ios/core/Effects.hpp'), /if \(fold\) \{ l = r = 0\.5 \* \(l \+ r\); \}/);
    assert.match(GUIDES.explore.tryThis.join(' '), /At WIDTH 200%, set FOLD to MONO CHECK: the two OUT traces glide onto one line/);
  });
  it('BASS: the engine high-passes the SIDE at the crossover (lows go mono), it does not touch the MID', () => {
    const hpp = read('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(hpp, /if \(bassHz > 0\.0\) sSig = static_cast<double>\(sHp_\.process\(static_cast<float>\(sSig\)\)\);/);
    assert.match(GUIDES.explore.control.join(' '), /the SIDE is filtered out below about 120 Hz, so the lows go mono/);
  });
});

// ── 5. wiring — waits on the shared FxLabScreen / fxLabConfigs change ────────
const FX_FORWARDS_GUIDE = /guide=\{config\.guide\}/.test(FX);
const PENDING = FX_FORWARDS_GUIDE ? false : 'PENDING: FxLabScreen (shared by every effect lab) does not forward `guide` / `accuracy` to LabShell yet';

describe('5. wiring and the accuracy-chip decision', () => {
  it('stereoConfig hands LabShell the per-tab guide function', { skip: PENDING }, () => {
    assert.match(CONFIGS, /import \{ stereoScreenGuide \} from '\.\/stereoScreenGuides';/);
    assert.match(CFG, /guide: stereoScreenGuide,/);
    assert.match(FX, /guide=\{config\.guide\}/);
  });
  it('a CONCEPT lab: a teaching model on a built-in test source, no mic, no real-world measurement — accuracy off', { skip: PENDING }, () => {
    assert.match(CFG, /accuracy: false,/);
    assert.match(FX, /accuracy=\{config\.accuracy\b/);
  });
  it('the reason for the chip decision holds today: no microphone anywhere in the effect-lab screen; badges say model, not measurement', () => {
    const calls = new Set([...FX.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    for (const c of calls) assert.match(c, /^(gen|fx)[A-Z]\w*$|^(isAvailable|engineVersion|stereoSpreadAvailable)$/, `ApeDsp.${c} — not a generator/effects call`);
    assert.doesNotMatch(FX, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getMeterFrame/);
    assert.match(FX, /const ANIM_BADGE = 'TEACHING MODEL · DRAWN FROM THE SAME MATH AS THE AUDIO · NOT A MEASUREMENT';/);
    assert.match(CFG, /heroBadge: 'GONIOMETER \+ CORRELATION — 440 Hz STEREO TEST TONE \(model\)',/);
  });
});
