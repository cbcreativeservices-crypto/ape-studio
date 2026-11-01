/**
 * Screen Guide rollout — Harmonograph Lab (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (one LabShell screen, a
 * guide per tab).
 *
 *   1. one guide per tab (explore / learn / check): shape + house copy rules;
 *   2. every section within its no-scroll budget;
 *   3. each pinned on-screen name is in the guide AND in the source;
 *   4. the TRY THIS numbers re-derived from the screen's own rules;
 *   5. wiring + the accuracy-chip decision (a CONCEPT lab: chip off, ⓘ on).
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

const { HARMONOGRAPH_SCREEN_GUIDES, harmonographScreenGuide } = await import('../src/screens/lab/harmonographScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const GUIDES = HARMONOGRAPH_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const ALL: [string, Guide][] = Object.entries(GUIDES);

const SCREEN = 'src/screens/lab/HarmonographLabScreen.tsx';
const SRC = code(SCREEN);

describe('1. every Harmonograph tab has a complete guide', () => {
  it('one guide per LabShell tab: explore, learn, check (the lab has an authored check)', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(read('src/features/lab/understandingChecks.ts'), /\n\s*harmonograph: HARMONOGRAPH,/);
    for (const m of ['explore', 'learn', 'check'] as const) assert.equal(harmonographScreenGuide(m), HARMONOGRAPH_SCREEN_GUIDES[m]);
  });
  for (const [id, gd] of ALL) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 TRY THIS`, () => {
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
    for (const [id, gd] of ALL) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|v3|engine \d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Pro Tools|Logic|Ableton|iZotope|Waves|Shure|Neumann|Sennheiser|Yamaha|Avid|Smaart|Dante)\b/, `${id}: a gear/software brand`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of ALL) {
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
  type Name = string | [string, string];
  const PIN: Record<string, { files: string[]; names: Name[] }> = {
    explore: {
      files: [SCREEN, 'src/screens/lab/HarmonographMachine.tsx', 'src/screens/lab/LabShell.tsx'],
      names: ['OSC 1', 'OSC 2', 'PLAT', 'THE DRAWING', 'RATIO', 'INTERVAL', 'PEN', 'DRAWING', 'FROZEN', 'CUSTOM RATIO', 'PERFECT 5TH', 'TUNE', 'DETUNE', 'LOCKED RATIO', '+1%', '+3%', 'UNISON', 'MAJOR 3RD', 'SHAPE', 'PHASE', 'DAMPING', 'LIGHT', 'MEDIUM', 'HEAVY', 'ROTARY', 'LATERAL', 'FREEZE', '⟲ NEW SHEET', '⟲ RESET ALL', 'OCTAVE', 'THE INTERVAL, AS SOUND', 'on LEFT', 'on RIGHT', 'OFF', ['φ 0° / 45° / 90°', 'φ ${p}°'], ['2:1 OCTAVE', "{ n1: 2, n2: 1, label: '2:1', interval: 'OCTAVE' }"], ['3:2', "label: '3:2'"]],
    },
    learn: {
      files: ['src/features/lab/guidedLessons/GuidedLessonSheet.tsx', 'src/screens/lab/LabShell.tsx', 'src/features/lab/guidedLessons/content.ts', SCREEN],
      names: ['CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'LEARN', 'EXPLORE', 'CHECK', 'GUIDED LESSON', 'LAB NOTES', 'DETUNE', '+1%', '+3%', 'LIGHT', 'HEAVY', ['ratio-lock', 'Ratio-lock'], ['amplitude', 'Amplitude'], ['lateral / rotary', 'Lateral / Rotary'], ['drive from oscillators', 'Drive from oscillators']],
    },
    check: {
      files: ['src/components/LabUnderstandingCheck.tsx'],
      names: ['CHECK YOUR UNDERSTANDING', 'NOT QUITE — TRY ANOTHER', 'CORRECT'],
    },
  };
  it('a name list for every tab', () => {
    assert.deepEqual(Object.keys(PIN).sort(), Object.keys(GUIDES).sort());
  });
  for (const [id, { files, names }] of Object.entries(PIN)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const src = files.map(code).join('\n');
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        const [g, s] = typeof n === 'string' ? [n, n] : n;
        assert.ok(src.includes(s), `${id}: "${s}" is no longer in ${files.join(', ')} — update the guide`);
        assert.ok(gt.includes(g), `${id}: the guide never names "${g}"`);
      }
    });
  }
  it('the CHECK guide counts the authored questions (four) and names their topics', () => {
    const src = read('src/features/lab/understandingChecks.ts');
    const at = src.indexOf('const HARMONOGRAPH: readonly Q[] = [');
    const block = src.slice(at, src.indexOf('\n];', at));
    assert.equal((block.match(/prompt:/g) ?? []).length, 4);
    assert.match(block, /perfect fifth/);
    assert.match(block, /DAMPING/);
    assert.match(textOf(GUIDES.check), /four questions on the fifth’s ratio, locked figures, detune and damping/);
  });
  it('the lesson describes THIS machine: OSC 1 / OSC 2, amplitude as an idea (no key), ROTARY = arms + an orbiting paper platform', () => {
    const lesson = read('src/features/lab/guidedLessons/content.ts');
    const at = lesson.indexOf('  harmonograph: {');
    const block = lesson.slice(at, lesson.indexOf('\n  },', at));
    assert.match(block, /name: 'OSC 1 \/ OSC 2'/);
    assert.doesNotMatch(block, /f₁–f₄|sums two circular motions|petal count/);
    assert.match(block, /name: 'Amplitude', definition: 'An idea, not a key here: this machine keeps the swing size fixed\./);
    assert.match(block, /PLAT moves the paper around a small circle at its own speed \(it never spins\)/);
    // the screen really has no amplitude key, and the swing is a fixed constant
    assert.doesNotMatch(SRC, /label: 'AMP|id: 'amp/);
    assert.match(read('src/screens/lab/HarmonographMachine.tsx'), /const AMP = 0\.26 \* TOP;/);
    // the platform translates (ox/oy orbit) and stays put with PLAT off
    assert.match(read('src/screens/lab/HarmonographMachine.tsx'), /ox = -ORB \* Math\.sin\(g\) \* env;\n\s*oy = ORB \* Math\.cos\(g\) \* env;/);
    assert.match(textOf(GUIDES.learn), /Amplitude is an idea here, not a key: the machine on EXPLORE keeps its swing size fixed\./);
    assert.doesNotMatch(textOf(GUIDES.learn), /four frequencies/);
  });
});

describe('4. the numbers in the guide are the screen’s own', () => {
  it('ranges: OSC 0.5–10 Hz; PLAT full-left is OFF', () => {
    assert.match(SRC, /const OSC_F_MIN = 0\.5;\nconst OSC_F_MAX = 10;/);
    assert.match(SRC, /v <= PLAT_OFF_ZONE \? 0 :/);
    assert.match(SRC, /format: \(\) => \(hz3 > 0 \? fmtHz\(hz3\) : 'OFF — platform stationary'\)/);
    assert.match(textOf(GUIDES.explore), /0\.5–10 Hz each[\s\S]*far left is OFF/);
  });
  it('opening state: OSC 1 1.5 Hz, OSC 2 1.0 Hz, PLAT 1.0 Hz, φ 90°, MEDIUM, ROTARY, +1 %', () => {
    assert.match(SRC, /const BASE_F0 = 110;/);
    assert.match(SRC, /useState\(1\.5 \/ BASE_F0\)/);
    assert.match(SRC, /const \[n2, setN2\] = useState\(1\.0 \/ BASE_F0\);/);
    assert.match(SRC, /const \[n3, setN3\] = useState\(1\.0 \/ BASE_F0\);/);
    assert.match(SRC, /useState<\(typeof PHASES\)\[number\]>\(90\)/);
    assert.match(SRC, /useState<\(typeof DAMPINGS\)\[number\]\['key'\]>\('medium'\)/);
    assert.match(SRC, /const \[rotary, setRotary\] = useState\(true\);/);
    assert.match(SRC, /useState<\(typeof DETUNES\)\[number\]\['key'\]>\(0\.01\)/);
    assert.match(textOf(GUIDES.explore), /It opens at OSC 1 1\.5 Hz, OSC 2 1\.0 Hz, PLAT 1\.0 Hz, ROTARY, detuned \+1%/);
  });
  it('the opening pair reads 3:2 PERFECT 5TH (the ratio match ignores detune), so LOCKED RATIO closes the 3:2 figure', () => {
    const RATIOS = [[1, 1, '1:1', 'UNISON'], [2, 1, '2:1', 'OCTAVE'], [3, 2, '3:2', 'PERFECT 5TH'], [4, 3, '4:3', 'PERFECT 4TH'], [5, 4, '5:4', 'MAJOR 3RD']] as const;
    for (const [n1, n2, label, interval] of RATIOS) assert.ok(SRC.includes(`{ n1: ${n1}, n2: ${n2}, label: '${label}', interval: '${interval}' }`), label);
    assert.match(SRC, /RATIOS\.find\(\(r\) => b > 0 && Math\.abs\(a \/ b - r\.n1 \/ r\.n2\) <= \(r\.n1 \/ r\.n2\) \* 0\.02\)/);
    const match = (a: number, b: number) => RATIOS.find(([n1, n2]) => Math.abs(a / b - n1 / n2) <= (n1 / n2) * 0.02);
    assert.equal(match(1.5, 1.0)?.[3], 'PERFECT 5TH');
    assert.match(SRC, /const detuneActs = detune !== 0 && \(!rotary \|\| n3 > 0\);/);
    assert.match(SRC, /const isExact = ratioExact && platSimple && !detuneActs;/);
    assert.match(textOf(GUIDES.explore), /tap LOCKED RATIO: the 3:2 figure stops turning and closes/);
  });
  it('2:1 OCTAVE keeps OSC 1 at 1.5 Hz and sets OSC 2 = 1.5 × 1/2 = 0.75 Hz', () => {
    assert.match(SRC, /const nn2 = n1 \* \(r\.n2 \/ r\.n1\);/);
    const fmtHz = (hz: number) => `${hz >= 100 ? Math.round(hz) : hz >= 1 ? hz.toFixed(1) : hz.toFixed(2)} Hz`;
    assert.match(SRC, /const fmtHz = \(hz: number\) => `\$\{hz >= 100 \? Math\.round\(hz\) : hz >= 1 \? hz\.toFixed\(1\) : hz\.toFixed\(2\)\} Hz`;/);
    assert.equal(fmtHz(1.5), '1.5 Hz');
    assert.equal(fmtHz(1.5 * (1 / 2)), '0.75 Hz');
    assert.match(textOf(GUIDES.explore), /OSC 1 stays at 1\.5 Hz, OSC 2 moves to 0\.75 Hz and INTERVAL reads OCTAVE/);
  });
  it('PLAY at 3:2 (stereo engine): both swings raised by one factor until the lower is 220 Hz → 330 Hz LEFT, 220 Hz RIGHT; ROTARY plays the exact ratio', () => {
    assert.match(SRC, /const AUDIO_LOW_HZ = 220;/);
    assert.match(SRC, /const f2 = b \* BASE_F0 \* \(rot \? 1 : 1 \+ d\);/);
    assert.match(SRC, /const k = AUDIO_LOW_HZ \/ low;\s*return \{ fL: f1 \* k, fR: f2 \* k \};/);
    const pair = (hz1: number, hz2: number) => {
      const k = 220 / Math.min(hz1, hz2);
      return [Math.round(hz1 * k), Math.round(hz2 * k)];
    };
    assert.deepEqual(pair(1.5, 1.0), [330, 220]);
    assert.match(SRC, /\$\{Math\.round\(soundNow\.fL\)\} Hz on LEFT, \$\{Math\.round\(soundNow\.fR\)\} Hz on RIGHT/);
    assert.match(textOf(GUIDES.explore), /330 Hz on LEFT, 220 Hz on RIGHT/);
    // ROTARY drops the detune from the sound (rot ? 1 : 1 + d) and the platform
    // (n3) never reaches soundPair, so the default ROTARY +1 % plays an exact
    // 330 : 220 (2·330 − 3·220 = 0, no beat). LATERAL +1 %: k = 220/1.01 →
    // 326.7 : 220 Hz. The guide and the check must not promise a ROTARY beat.
    const lat = 1.5 * (220 / 1.01);
    assert.ok(Math.abs(lat - 326.73) < 0.01 && Math.abs(2 * 330 - 3 * 220) === 0);
    assert.match(SRC, /const soundPair = useCallback\(\(a: number, b: number, d: number, rot: boolean\) => \{\s*const f1 = a \* BASE_F0;/);
    assert.match(textOf(GUIDES.explore), /plays OSC 1 and OSC 2 as sound\. The platform is silent, so DETUNE is heard in LATERAL only\./);
    assert.match(read('src/features/lab/understandingChecks.ts'), /▶ sounds the detune in LATERAL only — in ROTARY it moves the silent platform\./);
    assert.doesNotMatch(read('src/features/lab/understandingChecks.ts'), /slowly turning figure and hear it as beating/);
  });
  it('DETUNE acts on OSC 2 in LATERAL, on the platform in ROTARY — as the machine draws it', () => {
    const M = code('src/screens/lab/HarmonographMachine.tsx');
    assert.match(M, /if \(m\.azr > 0\) \{\s*const g = m\.azr \* phi \* \(1 \+ m\.det\);/);
    assert.match(M, /sB = AMP \* Math\.sin\(m\.ayr \* phi \* \(1 \+ m\.det\) \+ Math\.PI \/ 2\) \* env;/);
    assert.match(textOf(GUIDES.explore), /DETUNE acts on OSC 2 in LATERAL, on the platform in ROTARY \(so PLAT must be on\)/);
    // A wrong pick shows the same q.explanation as a right one — never called a "hint".
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), /\{got \? 'CORRECT' : 'NOT QUITE — TRY ANOTHER'\}<\/Text>\s*<Text style=\{s\.explainBody\}>\{q\.explanation\}<\/Text>/);
    assert.doesNotMatch(textOf(GUIDES.check), /\bhint\b/);
  });
  it('ROTARY with PLAT OFF: DETUNE draws nothing, so the caption and TUNE key never claim a detune', () => {
    // motion(): in ROTARY det only enters via the platform (azr > 0); PLAT OFF → azr = 0 → det inert.
    const M = code('src/screens/lab/HarmonographMachine.tsx');
    assert.match(M, /sB = AMP \* Math\.sin\(m\.ayr \* phi \+ Math\.PI \/ 2\) \* env;\s*if \(m\.azr > 0\)/);
    const acts = (detune: number, rotary: boolean, n3: number) => detune !== 0 && (!rotary || n3 > 0);
    assert.equal(acts(0.01, true, 0), false); // ROTARY, PLAT OFF: closed 3:2 figure
    assert.equal(acts(0.01, true, 1 / 110), true); // ROTARY, PLAT 1.0 Hz: platform precesses
    assert.equal(acts(0.01, false, 0), true); // LATERAL: OSC 2 detuned
    assert.match(SRC, /\$\{detuneActs \? `·\+\$\{detune \* 100\}%` : ''\}/);
    assert.match(SRC, /: detuneActs\s*\? `Detuned \+/);
  });
  it('"closes" needs an EXACT ratio (0.1%), and in ROTARY PLAT OFF or on a simple ratio — the 2% band only names the interval', () => {
    // 1.5 : 1.02 Hz is inside the 3:2 naming window (|1.4706 − 1.5| = 0.029 ≤ 0.03) but 34 cents
    // off; over ~55.7 MEDIUM turns it slips 0.029 × 55.7 ≈ 1.6 cycles — it precesses, never closes.
    assert.match(SRC, /const nearRatio = \(x: number, r: number\) => Math\.abs\(x - r\) <= r \* 1e-3;/);
    assert.match(SRC, /const ratioExact = matched != null && nearRatio\(n1 \/ n2, matched\.n1 \/ matched\.n2\);/);
    assert.match(SRC, /const isExact = ratioExact && platSimple && !detuneActs;/);
    const near = (x: number, r: number) => Math.abs(x - r) <= r * 1e-3;
    const exact = (a: number, b: number, n: number, d: number) => Math.abs(a / b - n / d) <= (n / d) * 0.02 && near(a / b, n / d);
    const platOk = (rotary: boolean, n3: number, n2: number) =>
      !rotary || n3 <= 0 || [1, 2, 3, 4, 5].some((q) => { const p = Math.round((n3 / n2) * q); return p >= 1 && near(n3 / n2, p / q); });
    assert.ok(Math.abs(1.5 / 1.02 - 1.5) <= 1.5 * 0.02, '1.5 : 1.02 still NAMES 3:2');
    assert.equal(exact(1.5, 1.02, 3, 2), false, '1.5 : 1.02 is not clean');
    assert.equal(exact(1.5, 1.5 * (2 / 3), 3, 2), true, 'the 3:2 chip sets it exactly');
    assert.equal(platOk(true, 1.0, 1.0), true, 'default PLAT 1.0 : OSC 2 1.0');
    assert.equal(platOk(true, 1.07, 1.0), false, 'PLAT 1.07 Hz precesses the rose');
    assert.equal(platOk(true, 0, 1.0), true, 'PLAT OFF: the platform is still');
    assert.equal(platOk(true, 1.0, 0.75), true, '2:1 chip from 1.5 Hz: PLAT 1.0 : 0.75 = 4:3');
    assert.equal(platOk(false, 1.07, 1.0), true, 'LATERAL ignores PLAT');
    assert.match(SRC, /: ratioExact && !platSimple\s*\? `A clean \$\{ratio\.label\} ratio between the arms, but PLAT is only a complex ratio of OSC 2 — the figure takes many swings to repeat/);
    assert.match(SRC, /: matched\s*\? `Near \$\{ratio\.label\} \(\$\{ratio\.interval\.toLowerCase\(\)\}\) but not exact — the figure slowly precesses/);
    assert.match(textOf(GUIDES.explore), /An exact simple ratio \(a RATIO chip\), locked, and in ROTARY PLAT OFF or on a simple ratio too: the figure closes\.[\s\S]*Detuned, or off an exact ratio: the figure slowly turns \(precesses\) and never closes/);
  });
  it('heavier DAMPING ends the drawing sooner (fewer turns at a smaller end amplitude)', () => {
    assert.match(SRC, /\{ key: 'light', label: 'LIGHT', endAmp: 0\.55 \},\s*\{ key: 'medium', label: 'MEDIUM', endAmp: 0\.25 \},\s*\{ key: 'heavy', label: 'HEAVY', endAmp: 0\.06 \}/);
    assert.match(code('src/screens/lab/HarmonographMachine.tsx'), /return \(TURNS_REF \* Math\.log\(STOP_ENV\)\) \/ Math\.log\(Math\.min\(0\.9, Math\.max\(0\.01, endAmp\)\)\);/);
    const turns = (endAmp: number) => Math.log(0.05) / Math.log(endAmp); // any STOP_ENV < 1, same sign
    assert.ok(turns(0.06) < turns(0.25) && turns(0.25) < turns(0.55));
    assert.match(textOf(GUIDES.explore), /More DAMPING spirals the figure in faster and ends the drawing sooner/);
  });
});

describe('5. wiring and the accuracy-chip decision', () => {
  it('the LabShell carries the per-tab guide and drops the chip', () => {
    assert.match(SRC, /import \{ harmonographScreenGuide \} from '\.\/harmonographScreenGuides';/);
    assert.match(SRC, /labId="harmonograph"[\s\S]*?guide=\{harmonographScreenGuide\}\s*accuracy=\{false\}/);
  });
  it('chip decision: a CONCEPT lab — a drawing from the equations, no mic, output labelled uncalibrated', () => {
    assert.doesNotMatch(SRC, /AccuracyNote/);
    assert.match(SRC, /badge: 'RIGID-BODY MACHINE — DRAWN FROM THE EQUATIONS'/);
    assert.match(SRC, /dBFS · uncalibrated/);
    assert.doesNotMatch(SRC, /useMic|getUserMedia|micStart|startMic|requestRecordingPermissions/);
  });
});
