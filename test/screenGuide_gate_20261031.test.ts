/**
 * Screen Guide rollout — Gate / Expander Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_chain_20261031.test.ts (a LabShell lab).
 *
 *   1. a guide for every LabShell tab the lab offers — EXPLORE, LEARN, CHECK —
 *      all five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget;
 *   3. the guide quotes the screen's REAL names (fxLabConfigs gateConfig,
 *      FxLabScreen, fxAnim, fxViz, the lesson, the check);
 *   4. the TRY THIS numbers follow from the engine (Effects.hpp DynamicsEffect
 *      GateMode) on the lab's CLICK 90 — re-run sample by sample, both routes —
 *      and the guide keeps clear of the default THRESH −35 dB on the click,
 *      where the engine's gate never opens (a suspected screen-code issue,
 *      pinned here so a fix shows up);
 *   5. wiring (TODO until the shared FxLabScreen pass-through lands) + chip.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { GATE_SCREEN_GUIDES, gateScreenGuide } = await import('../src/screens/lab/gateScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = GATE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(GUIDES);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const CFG = code('src/screens/lab/fxLabConfigs.tsx');
const GATE = CFG.slice(CFG.indexOf('const gateConfig'), CFG.indexOf('export const GateLabScreen'));
assert.match(CFG, /const srcClick = \(bpm: number\) => \(\{ label: `CLICK \$\{bpm\}`/);
const SRC = [
  GATE,
  /sources: \[srcClick\(90\), SRC_PINK\]/.test(GATE) ? 'CLICK 90' : '',
  CFG.slice(0, CFG.indexOf('// Retrieval checks')),
  code('src/screens/lab/FxLabScreen.tsx'),
  code('src/screens/lab/fxAnim.tsx'),
  code('src/features/lab/fxViz.tsx'),
  code('src/screens/lab/LabShell.tsx'),
  code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');
const LESSON = (() => {
  const c = code('src/features/lab/guidedLessons/content.ts');
  return c.slice(c.indexOf('  gate: {'), c.indexOf('  limiter: {'));
})();
const CHECKS = (() => {
  const c = code('src/features/lab/understandingChecks.ts');
  return c.slice(c.indexOf('const GATE'), c.indexOf('const LIMITER'));
})();

describe('1. every Gate / Expander screen has a complete guide', () => {
  it('one guide per LabShell tab: explore + learn + check', () => {
    assert.deepEqual(Object.keys(GUIDES).sort(), ['check', 'explore', 'learn']);
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*gate: GATE,/m);
    assert.equal((CHECKS.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(GUIDES.check.seeing.join(' '), /four questions/);
    for (const m of ['explore', 'learn', 'check']) assert.equal(gateScreenGuide(m), GUIDES[m]);
    assert.equal(gateScreenGuide('other'), undefined);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k].length} bullets`);
        for (const line of gd[k]) assert.ok(line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3);
    });
  }
  it('house copy rules', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed|ing)\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|v6)\b/i, `${id}: a build note`);
      assert.doesNotMatch(t, /\b(Waves|UAD|Universal Audio|SSL|Neve|API|Drawmer|Fairchild|Urei|Lexicon|Eventide|Boss|TC Electronic|Midas|dbx)\b/, `${id}: a gear maker/model name`);
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
      'IN ▸', '▸ OUT', 'GATE', 'GR', 'THRESH', 'RANGE', '— dB',
      '−20 GENTLE', '−40', '−70 SILENCE', 'HOLD', 'RLS', '20 ms CHATTER', '100 ms', '500 ms', 'SOURCE', 'CLICK 90', 'PINK NOISE',
      'LAB NOTES', 'GATE ATTENUATION', 'DESIGNED RESPONSE', 'GUIDED LESSON', 'THE AUDIO PATH',
      'TEACHING MODEL', 'DRUM-HIT MODEL',
    ],
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', 'Threshold', 'Attack', 'Hold', 'Release', 'Range', 'Hysteresis', 'Lookahead', 'CLICK 90', '20 ms CHATTER', '−70 SILENCE', '−20 GENTLE'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', '✓', 'LEARN', 'EXPLORE', 'CLICK 90', 'RANGE', 'HOLD', 'THRESH', '−20 GENTLE'],
  };
  it('a name list for every screen', () => assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort()));
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      const src = SRC + '\n' + LESSON + '\n' + CHECKS;
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the dock and bezel are exactly what the guide lists', () => {
    assert.match(GATE, /fader: \{ min: -50, max: -20,/);
    assert.match(GUIDES.explore.control.join(' '), /THRESH fader runs from −50 to −20 dB/);
    assert.match(GATE, /choices: \[0, 10, 100\]\.map\(\(ms\) => \(\{ label: `\$\{ms\} ms`, value: ms \}\)\)/);
    assert.match(GUIDES.explore.control.join(' '), /HOLD key: 0, 10 or 100 ms/);
    assert.match(GATE, /bezel: \[\s*\{ k: 'THRESH', paramId: P\.thresholdDb \},\s*\{ k: 'RANGE', paramId: P\.rangeDb \},\s*\]/);
    assert.match(GATE, /pollGr: 'gate'/);
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /maxDb=\{pollGr === 'gate' \? 70 : 30\}/);
    assert.match(GUIDES.explore.seeing.join(' '), /0 to 70 dB/);
    assert.equal((GATE.match(/^\s{6}question: '/gm) ?? []).length, 2);
    assert.match(GUIDES.explore.control.join(' '), /two CHECK YOURSELF questions/);
    assert.match(read('src/screens/lab/foundations/bits.tsx'), />CHECK YOURSELF\{/);
  });
});

// ── Sample-level re-run of the engine (Effects.hpp DynamicsEffect GateMode) ──
const FS = 48000;
const onePole = (ms: number) => 1 - Math.exp(-1 / (0.001 * Math.max(ms, 0.01) * FS));
const highpass = (f0: number) => {
  const w = 2 * Math.PI * f0, K = 2 * FS, K2 = K * K, A1 = w / Math.SQRT1_2, A0 = w * w, a0 = K2 + A1 * K + A0;
  const c = { b0: K2 / a0, b1: (-2 * K2) / a0, b2: K2 / a0, a1: (2 * A0 - 2 * K2) / a0, a2: (K2 - A1 * K + A0) / a0 };
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x: number) => { const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
};
/** The engine's gate: attack = its 10 ms default (the lab never writes it). */
const gate = (thr: number, rangeDb: number, holdMs: number, relMs: number) => {
  let env = 0, g = 1, holdLeft = 0;
  const aA = onePole(10), aR = onePole(relMs), holdN = Math.floor(holdMs * 0.001 * FS), floor = 10 ** (rangeDb / 20);
  return (x: number) => {
    const ax = Math.abs(x);
    env += (ax > env ? aA : aR) * (ax - env);
    if (20 * Math.log10(env + 1e-9) > thr) { holdLeft = holdN; g += aA * (1 - g); }
    else if (holdLeft > 0) holdLeft--;
    else g += aR * (floor - g);
    return -20 * Math.log10(g + 1e-9);
  };
};
const click = (bpm: number) => (i: number) => {
  const t = (i / FS) % (60 / bpm);
  return t < 0.005 ? 0.1 * 0.5 * (1 - Math.cos((2 * Math.PI * t) / 0.005)) * Math.sin(2 * Math.PI * 1000 * t) : 0;
};
/** The engine's DETECTOR alone (attack 10 ms, release = RLS): its lowest
 *  level between hits, and whether the gate's close branch ever runs. */
const detector = (thr: number, holdMs: number, relMs: number, speaker: boolean) => {
  const hp = speaker ? highpass(150) : (x: number) => x;
  const aA = onePole(10), aR = onePole(relMs), holdN = Math.floor(holdMs * 0.001 * FS), src = click(90);
  let env = 0, holdLeft = 0, minDb = Infinity, closing = 0;
  for (let i = 0; i < FS * 4; i++) {
    const ax = Math.abs(hp(src(i)));
    env += (ax > env ? aA : aR) * (ax - env);
    const e = 20 * Math.log10(env + 1e-9);
    if (e > thr) holdLeft = holdN; else if (holdLeft > 0) holdLeft--; else if (i >= FS * 2) closing++;
    if (i >= FS * 2) minDb = Math.min(minDb, e);
  }
  return { minDb, closing };
};
/** Milliseconds per hit the gate sits fully open (GR < 1 dB). */
const openMsPerHit = (hold: number, rel: number, speaker: boolean) => {
  const hp = speaker ? highpass(150) : (x: number) => x;
  const d = gate(-50, -40, hold, rel), src = click(90);
  let open = 0, n = 0;
  for (let i = 0; i < FS * 4; i++) { const gr = d(hp(src(i))); if (i >= FS * 2) { n++; if (gr < 1) open++; } }
  return (open / n) * (60000 / 90);
};
const run = (thr: number, range: number, hold: number, rel: number, speaker: boolean) => {
  const hp = speaker ? highpass(150) : (x: number) => x;
  const d = gate(thr, range, hold, rel);
  const src = click(90);
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < FS * 4; i++) {
    const gr = d(hp(src(i)));
    if (i >= FS * 2) { mn = Math.min(mn, gr); mx = Math.max(mx, gr); }
  }
  return { mn: +mn.toFixed(1) + 0, mx: +mx.toFixed(1) + 0 };
};

describe('4. the TRY THIS numbers follow from the lab and the engine', () => {
  it('the inputs: CLICK 90 at −20 dBFS, the defaults (−35, −40, 10 ms, 100 ms), the engine’s gate, its 10 ms attack', () => {
    const fx = code('modules/ape-dsp/ios/core/Effects.hpp');
    assert.match(code('src/screens/lab/FxLabScreen.tsx'), /const GEN_LEVEL_DB = -20;/);
    assert.match(GATE, /sources: \[srcClick\(90\), SRC_PINK\]/);
    assert.match(GATE, /choices: \[-50, -35, -20\][\s\S]*?initial: -35,/);
    assert.match(GATE, /label: 'HOLD'[\s\S]*?initial: 10,/);
    assert.match(GATE, /label: 'RELEASE', short: 'RLS'[\s\S]*?initial: 100,/);
    // the lab never writes param 3 (attack): no ATTACK param, no `fixed`
    assert.doesNotMatch(GATE, /P\.attackMs|fixed:/);
    assert.match(fx, /attackMs_\{10\.0\}/);
    assert.match(fx, /if \(envDb > thr\) \{\s*holdLeft_ = holdSamples;\s*gGate_ \+= aA \* \(1\.0 - gGate_\);/);
    assert.match(fx, /gGate_ \+= aR \* \(floorG - gGate_\);/);
  });
  for (const speaker of [false, true]) {
    const route = speaker ? 'phone speaker' : 'headphones';
    it(`EXPLORE 1 on ${route}: THRESH −50, RLS 100 → GR down to 0.0 on each hit, back up between`, () => {
      const r = run(-50, -40, 10, 100, speaker);
      assert.equal(r.mn, 0);
      assert.ok(r.mx > 30, `between hits ${r.mx}`);
    });
    it(`EXPLORE 2 + LEARN 2 + CHECK 1 on ${route}: THRESH −50, RLS 20 → between hits GR reaches 20.0 / 40.0 / 70.0`, () => {
      assert.deepEqual([-20, -40, -70].map((r) => run(-50, r, 10, 20, speaker).mx), [20, 40, 70]);
    });
    it(`EXPLORE 3 on ${route}: THRESH −50, RLS 500 → GR 0.0 throughout`, () => {
      const r = run(-50, -40, 10, 500, speaker);
      assert.deepEqual([r.mn, r.mx], [0, 0]);
      // …and WHY (the guide's reason): RLS also slows the detector's fall, so it
      // never drops below −50 between hits and the gate never starts to close
      const d = detector(-50, 10, 500, speaker);
      assert.ok(d.minDb > -50, `detector low ${d.minDb.toFixed(1)}`);
      assert.equal(d.closing, 0);
    });
    it(`CHECK 2 on ${route}: HOLD 100 ms keeps GR at 0.0 far longer after each hit than HOLD 0 (RLS 20)`, () => {
      const h0 = openMsPerHit(0, 20, speaker), h100 = openMsPerHit(100, 20, speaker);
      assert.ok(h0 < 25 && h100 > 100, `open ${h0.toFixed(0)} ms vs ${h100.toFixed(0)} ms per hit`);
    });
    it(`(suspected screen issue) on ${route}: at the default THRESH −35 the click never opens the gate — GR sits at |RANGE|`, () => {
      for (const range of [-20, -40, -70]) {
        const r = run(-35, range, 10, 100, speaker);
        assert.deepEqual([r.mn, r.mx], [-range, -range], `RANGE ${range}`);
      }
    });
  }
  it('the guide states exactly those readings — and no step uses THRESH −35 dB on the click', () => {
    const t = GUIDES.explore.tryThis;
    assert.match(t[0], /CLICK 90 and pull THRESH down to −50 dB: GR drops toward 0 on each hit and climbs back/);
    assert.match(t[1], /−50 dB, set RLS to 20 ms CHATTER and step RANGE: between hits GR reaches 20\.0, 40\.0, then 70\.0 dB/);
    assert.match(t[2], /RLS to 500 ms: GR stays at 0\.0\. The sensed level falls so slowly it never drops below −50 dB before the next hit, so the gate never starts to close/);
    assert.doesNotMatch(t[2], /closes so slowly/);
    assert.match(t[1], /clean hit, so this shows depth, not chatter/);
    assert.match(GUIDES.explore.changes.join(' '), /RLS sets how fast it then closes, and how fast its sensed level falls/);
    // the opening state is explained, not hidden (pinned by the −35 run above)
    assert.match(GUIDES.explore.changes.join(' '), /at the starting THRESH −35 dB the short click never registers, so the gate stays shut/);
    assert.match(GUIDES.learn.tryThis[0], /at RLS 20 ms CHATTER GR reaches the RANGE floor between hits; at 500 ms it stays at 0\.0/);
    assert.match(GUIDES.check.tryThis[1], /compare HOLD 0 ms and 100 ms: at 100 ms GR rests at 0\.0 a moment after each hit/);
    assert.match(GUIDES.learn.tryThis[1], /THRESH −50 dB, RLS 20 ms CHATTER\) step RANGE: between hits GR reaches 70\.0 at −70 SILENCE, 20\.0 at −20 GENTLE/);
    assert.match(GUIDES.check.tryThis[0], /THRESH −50 dB with RLS 20 ms CHATTER and RANGE −20 GENTLE: GR tops out at 20\.0 dB/);
    for (const gd of allGuides.map(([, g]) => g)) for (const line of gd.tryThis) assert.doesNotMatch(line, /−35/);
    // and no number is quoted on PINK NOISE (route-dependent)
    for (const gd of allGuides.map(([, g]) => g)) for (const line of gd.tryThis) assert.doesNotMatch(line, /PINK NOISE/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  // The shared FxLabScreen change is not this rollout's, and sibling effect
  // labs proposed different field names (guide / accuracy, screenGuide /
  // accuracyChip) — read them from FxLabScreen, then pin this config.
  const SCREEN_SRC = code('src/screens/lab/FxLabScreen.tsx');
  const guideKey = SCREEN_SRC.match(/<LabShell[\s\S]*?guide=\{config\.(\w+)\}/)?.[1];
  const accKey = SCREEN_SRC.match(/<LabShell[\s\S]*?accuracy=\{config\.(\w+)/)?.[1];
  const wired = guideKey != null;
  it('wiring: LabShell gets this lab’s per-tab guide, and no AccuracyNote chip', { todo: wired ? false : 'needs the shared FxLabScreen / fxLabConfigs change (12 effect labs share them — see the rollout report)' }, () => {
    if (!wired) return; // TODO until the shared files are wired; enforced from then on
    assert.ok(accKey, 'FxLabScreen forwards a guide but no accuracy flag');
    assert.ok(GATE.includes(`${guideKey}: gateScreenGuide,`), `config lacks ${guideKey}: gateScreenGuide`);
    assert.ok(GATE.includes(`${accKey}: false,`), `config lacks ${accKey}: false`);
  });
  it('a CONCEPT lab: no mic, no real-world measurement', () => {
    const fxs = code('src/screens/lab/FxLabScreen.tsx');
    assert.doesNotMatch(fxs, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getFrame|getMeterFrame/);
  });
});
