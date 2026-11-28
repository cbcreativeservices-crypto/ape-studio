/**
 * Round 2, group SYNTH (owner 2026-11-25, "Fix-first 15", then "continue with
 * next fixes"): the FM checker corrections, then the remaining Appendix B rows
 * of Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md that are not the owner's call
 * (FX Chorus capped wobble and the FM axis shape are left as built).
 *
 * Each block fails on the code before the fix and passes after. Maths that
 * live in React Native / Skia files are run as written by slicing the named
 * function out of the source and transpiling it (the house harness), or were
 * moved into small pure modules the screens import.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// House style imports siblings extensionless; Node's ESM loader needs the .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const src = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
/** Run a slice of a source file as plain JS and return what `ret` names. */
function runSlice<T>(code: string, ret: string, inject: Record<string, unknown> = {}): T {
  const js = ts.transpileModule(`${code}\nreturn { ${ret} };`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const names = Object.keys(inject);
  return new Function(...names, js)(...names.map((n) => inject[n])) as T;
}
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  const j = s.indexOf(b, i + a.length);
  assert.ok(i >= 0 && j > i, `slice ${a} … ${b}`);
  return s.slice(i, j);
};

// ── FM corrections ─────────────────────────────────────────────────────────
const FM = await import('../src/screens/lab/fmGrid.ts');

describe('FM stick graph corrections (round 2)', () => {
  const span = (l: { text: string; x: number; anchor: string }) => {
    const w = l.text.length * FM.FM_AXIS_CHAR_W;
    return l.anchor === 'start' ? [l.x, l.x + w] : l.anchor === 'end' ? [l.x - w, l.x] : [l.x - w / 2, l.x + w / 2];
  };
  it('"24k" is anchored at its own tick, the right end of the plot', () => {
    for (const plotW of [180, 240, 282, 325, 400]) {
      const ls = FM.fmAxisLabels(14, plotW, 24000);
      const end = ls[ls.length - 1];
      assert.equal(end.text, '24k');
      assert.equal(end.anchor, 'end');
      assert.ok(close(end.x, 14 + plotW), `plotW ${plotW}`);
    }
  });
  it('no two axis labels touch on any glass from 180 to 420 px (it used to overlap 5k under ~310 px)', () => {
    for (let glass = 180; glass <= 420; glass += 2) {
      const plotW = glass - 28;
      const ls = FM.fmAxisLabels(14, plotW, 24000);
      for (let i = 1; i < ls.length; i++) {
        const [, prevEnd] = span(ls[i - 1]);
        const [start] = span(ls[i]);
        assert.ok(start - prevEnd >= 3 - 1e-9, `glass ${glass}: ${ls[i - 1].text} vs ${ls[i].text}`);
      }
      for (const l of ls) {
        const [a, b] = span(l);
        assert.ok(a >= 14 - 1e-9 && b <= 14 + plotW + 1e-9, `glass ${glass}: ${l.text} on the plot`);
      }
    }
  });
  it('a phone glass (310 px) keeps every number 0…5k and the unit', () => {
    const texts = FM.fmAxisLabels(14, 310 - 28, 24000).map((l) => l.text);
    assert.deepEqual(texts, ['0', 'Hz', '1k', '2k', '3k', '4k', '5k', '24k']);
  });
  it('the squeezed 5–24 kHz strip skips sticks under |J| 0.01; the linear part keeps every one', () => {
    assert.equal(FM.fmStickShown(6000, 0.009), false);
    assert.equal(FM.fmStickShown(6000, 0.01), true);
    assert.equal(FM.fmStickShown(4999, 0.005), true);
    assert.equal(FM.fmStickShown(5000, 0.005), true);
  });
  it('the screen draws the labels from fmAxisLabels and filters the sticks; the axis mapping is untouched', () => {
    const s = src('src/screens/lab/FmLabScreen.tsx');
    assert.match(s, /\{fmAxisLabels\(PAD, plotW, NYQUIST\)\.map\(\(l\) => \(/);
    assert.match(s, /if \(!fmStickShown\(s\.f, s\.a\)\) return null;/);
    assert.doesNotMatch(s, /x=\{lw - PAD - 16\}/, 'the old offset 24k label is gone');
    assert.match(s, /const xOf = \(f: number\) => PAD \+ fmAxisFrac\(f, NYQUIST\) \* plotW;/);
  });
});

// ── B2 / B17 EQ band markers ───────────────────────────────────────────────
const EQC = await import('../src/screens/lab/fxEqCurve.ts');

describe('B2 / B17 · EQ: FREQ and Q show where the band is at 0 dB', () => {
  it('MultiBand passes the selected bell as the graph band marker, in its colour', () => {
    const s = src('src/screens/lab/eq/modules/MultiBand.tsx');
    assert.match(s, /band=\{selBell && selBell\.on \? \{ f: selBell\.f, q: selBell\.q, color: BAND_COLOR\[sel\] \} : undefined\}/);
  });
  it('ParametricControls and FilterShapes (BELL with its Q, shelves at their FREQ) pass a band marker', () => {
    assert.match(src('src/screens/lab/eq/modules/ParametricControls.tsx'), /band=\{\{ f: freq, q \}\}/);
    assert.match(src('src/screens/lab/eq/modules/FilterShapes.tsx'), /band=\{shape === 'bell' \? \{ f: freq, q \} : hasGain \? \{ f: freq \} : undefined\}/);
  });
  it('the house graph draws that marker (centre line + half-gain bandwidth (Q)) whatever the gain', () => {
    const v = src('src/features/lab/fxViz.tsx');
    assert.match(v, /band && band\.f >= 20 && band\.f <= 20000 \?/);
  });
  it('FX Equalizer: one gain-bearing band gets a marker on both the DESIGNED RESPONSE and the stage strip', () => {
    assert.equal(EQC.eqBandMarkHz([{ type: 'peak', freq: 1000 }]), 1000);
    assert.equal(EQC.eqBandMarkHz([{ type: 'lowShelf', freq: 120 }]), 120);
    assert.equal(EQC.eqBandMarkHz([{ type: 'highShelf', freq: 8000 }]), 8000);
    assert.equal(EQC.eqBandMarkHz([{ type: 'highPass', freq: 80 }]), null, 'a pass filter shows its corner already');
    assert.equal(EQC.eqBandMarkHz([{ type: 'peak', freq: 1000 }, { type: 'peak', freq: 2000 }]), null);
    const cfg = src('src/screens/lab/fxLabConfigs.tsx');
    assert.match(cfg, /band=\{markHz != null \? \{ f: markHz, q: band\.type === 'peak' \? band\.q : undefined \} : undefined\}/);
    const anim = src('src/screens/lab/fxAnim.tsx');
    assert.match(anim, /const markHz = eqBandMarkHz\(bands\);/);
    assert.match(anim, /<Path path=\{curve\.mark\} color=\{AMBER\}/);
  });
});

// ── B4 Tuning ch4 beating model ────────────────────────────────────────────
const BEAT = await import('../src/screens/lab/tuning/components/beatingModel.ts');

/** The drawing as it was (window = 1.5 / d), to prove the old fault. */
function oldBeating(diffHz: number) {
  const W2 = 340, H2 = 90, n = 170;
  const d = Math.abs(diffHz);
  const windowS = d > 0.01 ? Math.min(1.5, 1.5 / d) : 1;
  const env: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * windowS;
    const xx = 6 + (i / n) * (W2 - 12);
    env.push(`${xx.toFixed(1)},${(H2 / 2 - Math.abs(Math.cos(Math.PI * d * t)) * 34).toFixed(1)}`);
  }
  return env.join(' ');
}
/** Swells on screen: the envelope's local minima (beat nulls) inside the box. */
const nulls = (env: string) => {
  const ys = env.split(' ').map((p) => Number(p.split(',')[1]));
  let k = 0;
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1]) k++;
  return k;
};

describe('B4 · Tuning ch4: the beating picture changes with the gap', () => {
  it('before: 2 Hz and 16 Hz drew the same envelope (the fault)', () => {
    assert.equal(oldBeating(2), oldBeating(16));
  });
  it('after: one fixed time span, so the swells on screen are the beat rate × that span', () => {
    assert.equal(BEAT.BEAT_WINDOW_S, 0.5);
    assert.notEqual(BEAT.beatingTraces(2, 340, 90).env, BEAT.beatingTraces(16, 340, 90).env);
    for (const d of [2, 4, 10, 16, 30]) {
      const t = BEAT.beatingTraces(d, 340, 90);
      assert.ok(close(t.beatsShown, d * 0.5));
      assert.ok(Math.abs(nulls(t.env) - d * 0.5) <= 1, `${d} Hz: ${nulls(t.env)} nulls`);
    }
  });
  it('Equal vs Pythagorean at C4: the wider gap draws more swells', () => {
    const f = 261.63;
    const gap = (cents: number) => Math.abs(4 * f * Math.pow(2, cents / 1200) - 5 * f);
    const et = BEAT.beatingTraces(gap(400), 340, 90);
    const py = BEAT.beatingTraces(gap(407.82), 340, 90);
    assert.ok(nulls(py.env) > nulls(et.env), `${nulls(et.env)} vs ${nulls(py.env)}`);
  });
  it('the partials stay faster than the swells (≥ 3 drawn cycles per swell) and the drawing uses the helper', () => {
    const t = BEAT.beatingTraces(40, 340, 90);
    assert.ok(t.p1.split(' ').length >= 600);
    assert.match(src('src/screens/lab/tuning/components/harmonicLadder.tsx'), /const tr = beatingTraces\(d, W2, H2\);/);
  });
});

// ── B5 Tuning ch13 FOLD ────────────────────────────────────────────────────
describe('B5 · Tuning ch13 FOLD: practice after RESET; the ✓ reads the current value', () => {
  const s = src('src/screens/lab/tuning/chapters/ch13Apply.tsx');
  it('×2 / ÷2 no longer stop once the challenge is solved', () => {
    assert.doesNotMatch(s, /if \(done\[0\]\) return;/);
    assert.match(s, /if \(fracValue\(after\) >= 1 && fracValue\(after\) < 2\) mark\(0\);/, 'the credit is still earned (and never removed)');
  });
  it('the card shows ✓ and its OK tone only while the current ratio is inside', () => {
    assert.match(s, /<Card tone=\{c1In \? 'ok' : 'plain'\}>/);
    assert.match(s, /current: \{fracLabel\(c1\)\}\{c1In \? ' ✓ inside 1 ≤ r < 2' : ''\}/);
  });
});

// ── B16 octave elevator ────────────────────────────────────────────────────
const ELEV = await import('../src/screens/lab/tuning/components/elevatorFloors.ts');

describe('B16 · Tuning ch3 / ch13 octave elevator: every press moves the glass', () => {
  it('the three drawn floors are unchanged', () => {
    assert.equal(ELEV.elevatorRegion(0.75), 0);
    assert.equal(ELEV.elevatorRegion(1), 1);
    assert.equal(ELEV.elevatorRegion(1.999), 1);
    assert.equal(ELEV.elevatorRegion(2), 2);
    assert.equal(ELEV.elevatorRegion(9 / 4), 2);
  });
  it('×2 on 9/4, again and again: each press changes the tile (step or octave tag); ÷2 walks it back', () => {
    const seen: string[] = [];
    let r = 9 / 4;
    for (let k = 0; k < 4; k++) {
      seen.push(`${ELEV.elevatorRegion(r)}|${ELEV.elevatorBeyondSteps(r)}|${ELEV.elevatorTag(r)}`);
      r *= 2;
    }
    assert.equal(new Set(seen).size, seen.length, seen.join(' / '));
    assert.equal(ELEV.elevatorTag(9 / 4), '', 'one octave above: the ABOVE floor alone says it');
    assert.equal(ELEV.elevatorTag(9 / 2), '▲ 2 oct');
    assert.equal(ELEV.elevatorTag(9), '▲ 3 oct');
    assert.equal(ELEV.elevatorTag(9 / 32), '▼ 2 oct');
    assert.equal(ELEV.elevatorOctave(4), 2);
    assert.equal(ELEV.elevatorOctave(0.5), -1);
  });
  it('the elevator uses the helpers for the tile position and tag', () => {
    const s = src('src/screens/lab/tuning/components/octaveElevator.tsx');
    assert.match(s, /const target = tileY\(v\);/);
    assert.match(s, /\{tag \? <Text style=\{\[styles\.tileTag/);
  });
});

// ── B14 Tuning ch1 screen-reader steps ─────────────────────────────────────
const TM = await import('../src/features/tuning/tuningMath.ts');

describe('B14 · Tuning ch1: a landmark is named only when the marker is on it (screen-reader ±10 ¢)', () => {
  const rail = src('src/screens/lab/tuning/components/dragRail.tsx');
  const { snapToLandmark } = runSlice<{ snapToLandmark: (raw: number, window?: number) => number }>(
    between(rail, 'export const snapToLandmark', '/** Show Me').replace('export const', 'const'),
    'snapToLandmark',
    { LANDMARKS: TM.LANDMARKS, STEP_SNAP: 1 },
  );
  const walk = (window: number) => {
    const bad: string[] = [];
    for (const dir of [10, -10]) {
      let c = dir > 0 ? 0 : 1200;
      for (let k = 0; k < 130; k++) {
        c = snapToLandmark(c + dir, window);
        const l = TM.nearestLandmark(c, 6); // ch1Intervals names within 6 ¢
        if (l && Math.abs(l.value.cents - c) > 1e-9) bad.push(`${c.toFixed(2)} named ${l.name}`);
      }
    }
    return bad;
  };
  it('before: the 1 ¢ window stopped at 700 ¢ while the chapter named the fifth (the fault)', () => {
    assert.ok(walk(1).some((b) => b.startsWith('700.00')), walk(1).join('; '));
  });
  it('after: the screen-reader steps snap with the drag window, so every named landmark is exact', () => {
    assert.deepEqual(walk(9), []);
    assert.match(rail, /const A11Y_STEP_SNAP = DRAG_SNAP;/);
    assert.match(rail, /step\(e\.nativeEvent\.actionName === 'increment' \? 10 : -10, A11Y_STEP_SNAP\)/);
  });
  it('a 10 ¢ step can always leave the landmark it sits on', () => {
    for (const l of TM.LANDMARKS) {
      for (const dir of [10, -10]) {
        const to = snapToLandmark(l.value.cents + dir, 9);
        if (l.value.cents + dir >= 0 && l.value.cents + dir <= 1200) assert.notEqual(to, l.value.cents, l.name);
      }
    }
  });
});

// ── B15 Tuning ch8 EXAMPLE lights ──────────────────────────────────────────
describe('B15 · Tuning ch8: the EXAMPLE picker lights only the passage (and the inspected NOTE)', () => {
  const s = src('src/screens/lab/tuning/chapters/ch8Compare.tsx');
  const { exampleRole } = runSlice<{ exampleRole: (sp: string, lane: 0 | 1, inEx: readonly string[], sel: string, differ: readonly string[]) => string }>(
    between(s, 'function exampleRole', '\nexport function Ch8Compare'),
    'exampleRole',
  );
  const D = ['E', 'A', 'B'];
  it('"C–E third" with NOTE E: A and B are muted on both lanes; C neutral, E lit', () => {
    const ex = ['C', 'E'];
    assert.equal(exampleRole('A', 0, ex, 'E', D), 'muted');
    assert.equal(exampleRole('B', 0, ex, 'E', D), 'muted');
    assert.equal(exampleRole('A', 1, ex, 'E', D), 'muted');
    assert.equal(exampleRole('E', 0, ex, 'E', D), 'near');
    assert.equal(exampleRole('E', 1, ex, 'E', D), 'exact');
    assert.equal(exampleRole('C', 0, ex, 'E', D), 'neutral');
    assert.equal(exampleRole('G', 0, ex, 'E', D), 'muted');
  });
  it('"G–B third": B and its just marker light; the scale lights every note', () => {
    assert.equal(exampleRole('B', 0, ['G', 'B'], 'E', D), 'near');
    assert.equal(exampleRole('B', 1, ['G', 'B'], 'E', D), 'exact');
    for (const n of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) assert.notEqual(exampleRole(n, 0, ['C', 'D', 'E', 'F', 'G', 'A', 'B'], 'E', D), 'muted');
  });
  it('both lanes use it', () => {
    assert.match(s, /role: exampleRole\(n\.spelling, 0, inExample, sel, DIFFER\), lane: 0 as const/);
    assert.match(s, /role: exampleRole\(n\.spelling, 1, inExample, sel, DIFFER\), lane: 1 as const/);
  });
});

// ── B19 Tuning ch7 arcs ────────────────────────────────────────────────────
describe('B19 · Tuning ch7: SHOW FIRST / NEXT / LAST ARC draws the pure third on the rail', () => {
  const s = src('src/screens/lab/tuning/chapters/ch7Just.tsx');
  it('the rail receives one bracket per revealed arc, pure 5/4 in the exact colour', () => {
    assert.match(s, /<CentsRail markers=\{markers\} brackets=\{arcBrackets\}/);
    assert.match(s, /THIRDS\.slice\(0, arcs\)\.map\(\(\[lo, hi\]\) => \(\{ fromCents: ratioToCents\(fracValue\(jf\(lo\)\)\), toCents: ratioToCents\(fracValue\(jf\(hi\)\)\), label: `\$\{lo\}–\$\{hi\} · 5\/4`, role: 'exact' as const, row: ARC_ROW\[lo\] \}\)\)/);
  });
  it('each arc spans exactly 386.31 ¢ and the rows keep overlapping arcs apart', () => {
    const j: Record<string, number> = { C: 1, E: 5 / 4, F: 4 / 3, A: 5 / 3, G: 3 / 2, B: 15 / 8 };
    const arcs = [['C', 'E'], ['F', 'A'], ['G', 'B']].map(([lo, hi]) => ({ lo, a: 1200 * Math.log2(j[lo]), b: 1200 * Math.log2(j[hi]) }));
    const { ARC_ROW } = runSlice<{ ARC_ROW: Record<string, number> }>(between(s, 'const ARC_ROW', '\nconst NAMES'), 'ARC_ROW');
    for (const x of arcs) assert.ok(close(x.b - x.a, 1200 * Math.log2(5 / 4), 1e-9));
    for (const x of arcs) for (const y of arcs) {
      if (x === y) continue;
      const overlap = Math.min(x.b, y.b) > Math.max(x.a, y.a);
      if (overlap) assert.ok(Math.abs(ARC_ROW[x.lo] - ARC_ROW[y.lo]) === 2, `${x.lo} and ${y.lo} overlap: two rows apart`);
    }
  });
  it('the rail honours a bracket row', () => {
    assert.match(src('src/screens/lab/tuning/components/primitives.tsx'), /const y = 14 \+ \(b\.row \?\? i\) \* 12;/);
  });
});

// ── B20 Tuning ch6 / ch10 A → B ────────────────────────────────────────────
const AB = await import('../src/screens/lab/tuning/components/abHalf.ts');
const RENDER = await import('../src/features/tuning/tuningRender.ts');

describe('B20 · Tuning ch6 / ch10: A → B lights A, then B as it sounds', () => {
  it('the switch lands in the middle of the silence between the halves (real clips)', () => {
    const SR = RENDER.SR;
    // ch6: two 1.4 s notes.
    const a6 = RENDER.renderNotes([261.63], 1.4, 'rich');
    const ab6 = RENDER.concatWithGap(a6, RENDER.renderNotes([265], 1.4, 'rich'));
    const sw6 = (AB.abSwitchMs(1.4) / 1000) * SR;
    assert.ok(sw6 > a6.length && sw6 < a6.length + 0.35 * SR, 'ch6 inside the gap');
    assert.ok(ab6.length > sw6);
    // ch10: a seven-note pattern at 0.28 s each.
    const seq = RENDER.renderSequence([1, 2, 3, 4, 5, 6, 7].map((k) => 261.63 * k), 0.28, 'rich');
    assert.ok(close(seq.length / SR, AB.sequenceSeconds(7, 0.28), 1 / SR * 7));
    const sw10 = (AB.abSwitchMs(AB.sequenceSeconds(7, 0.28)) / 1000) * SR;
    assert.ok(sw10 > seq.length - 7 && sw10 < seq.length + 0.35 * SR, 'ch10 inside the gap');
  });
  it('both chapters follow the half that sounds instead of lighting both', () => {
    const c6 = src('src/screens/lab/tuning/chapters/ch6Comma.tsx');
    assert.match(c6, /last === 'ab' \? \(abHalf === 'b' \? 'B♯' : 'C'\)/);
    const c10 = src('src/screens/lab/tuning/chapters/ch10Equal.tsx');
    assert.match(c10, /last === 'ab' \? \(abHalf === 'b' \? pattern\.map\(\(s\) => s \+ 5\) : pattern\)/);
    assert.doesNotMatch(c10, /\[\.\.\.pattern, \.\.\.pattern\.map/);
  });
});

// ── B6 Amp Class C ─────────────────────────────────────────────────────────
const AMP = await import('../src/features/amp/ampModel.ts');

describe('B6 · Amp Class C: the card says what the recovered sine does with LEVEL', () => {
  const peak = (d: number) => Math.max(...Array.from(AMP.simulateClassC(d, 1).recovered).map(Math.abs));
  it('the model: none below the bias, then far faster than the input', () => {
    assert.ok(peak(0.4) < 1e-9);
    assert.ok(peak(0.5) > 0 && peak(1) > 0.99);
    assert.ok(peak(1) / peak(0.5) > 2 * 5, 'twice the input → more than ten times the output');
  });
  it('the sentence no longer claims it "does not track the input level"', () => {
    const s = src('src/screens/lab/amp/modules/mod4Classes.tsx');
    assert.doesNotMatch(s, /does not track the input level/);
    assert.match(s, /does not follow the input in proportion: below the bias there is none, then it grows far faster than the input does\./);
  });
});

// ── B7 / B8 Tube ───────────────────────────────────────────────────────────
const BIAS = await import('../src/screens/lab/tube/biasCurve.ts');
const FLOW = await import('../src/screens/lab/tube/flowModel.ts');

describe('B7 · Tube Bias: the zone word and the drawn wave agree', () => {
  const wave = (b: number) => {
    const out: number[] = [];
    for (let i = 0; i <= 200; i++) {
      const v = b + BIAS.TUBE_BIAS_DRIVE * Math.sin((2 * Math.PI * i) / 200);
      out.push(BIAS.plateCurrent01(v < 0 ? 0 : v > 1 ? 1 : v));
    }
    return out;
  };
  const flatAt = (w: number[], level: number) => w.filter((y) => Math.abs(y - level) < 1e-12).length;
  it('the zone thresholds stay 22 % and 80 %', () => {
    for (let k = 0; k <= 1000; k++) {
      const b = k / 1000;
      const old = b < 0.22 ? 'cutoff' : b > 0.8 ? 'saturation' : 'linear';
      assert.equal(BIAS.biasZone(b), old, `${b}`);
    }
  });
  it('CUTOFF ⇔ the bottom of the drawn wave has a flat stretch at zero current; SATURATION ⇔ a flat top', () => {
    for (let k = 0; k <= 100; k++) {
      const b = k / 100;
      const w = wave(b);
      const z = BIAS.biasZone(b);
      assert.equal(flatAt(w, 0) > 1, z === 'cutoff', `b ${b}: bottom`);
      assert.equal(flatAt(w, 1) > 1, z === 'saturation', `b ${b}: top`);
    }
  });
  it('the old curve never flatlined at 15–22 % (the fault): its bottom stayed above zero', () => {
    const oldIp = (v: number) => (Math.tanh(4.2 * (Math.max(0, Math.min(1, v)) - 0.52)) + 1) / 2;
    const v = 0.2 - 0.15;
    assert.ok(oldIp(v) > 0.01);
  });
  it('the middle of the curve is the old shape within 5 %', () => {
    const oldIp = (v: number) => (Math.tanh(4.2 * (v - 0.52)) + 1) / 2;
    for (let v = 0.25; v <= 0.8; v += 0.01) assert.ok(Math.abs(BIAS.plateCurrent01(v) - oldIp(v)) < 0.05, `${v}`);
  });
  it('the screen and the drawing read one rule', () => {
    const screen = src('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
    assert.match(screen, /const zk = biasZone\(b\);/);
    assert.doesNotMatch(screen, /b < 0\.22 \|\| b > 0\.8/);
    const viz = src('src/screens/lab/tube/viz.tsx');
    assert.match(viz, /const opBad = biasZone\(bias01\) !== 'linear';/);
    assert.match(viz, /const ip = plateCurrent01\(vc\);/);
  });
});

describe('B8 · Tube Electron flow: drawn share crossing = PLATE I', () => {
  it('the share is the old PLATE I formula (readout unchanged)', () => {
    for (let k = 0; k <= 100; k++) {
      const h = k / 100;
      assert.ok(close(FLOW.plateCurrentShare(h), h > 0.7 ? (h - 0.7) / 0.3 : 0, 1e-12), `${h}`);
    }
  });
  it('the drawing uses it, with no +0.25 offset', () => {
    const viz = src('src/screens/lab/tube/viz.tsx');
    assert.doesNotMatch(viz, /\(heat01 - 0\.7\) \/ 0\.3 \+ 0\.25/);
    assert.match(viz, /hashW\(i \* 3\.7\) < plateCurrentShare\(heat01\)/);
    assert.match(src('src/screens/lab/tube/VacuumTubeLabScreen.tsx'), /const current = plateCurrentShare\(heat\);/);
  });
});

// ── B9 Noise ───────────────────────────────────────────────────────────────
describe('B9 · Noise: Stop settles the trace on the ideal slope', () => {
  it('the shimmer path recomputes when `running` changes', () => {
    assert.match(src('src/screens/lab/NoiseLabScreen.tsx'), /\}, \[tick, running, selectedSlope, speakerView, W\]\);/);
  });
});

// ── B10 / B18 Autotune ─────────────────────────────────────────────────────
describe('B10 / B18 · Autotune: the dot rides the sounding note; AMOUNT ≤ 0.5 % is OFF everywhere', () => {
  const s = src('src/screens/lab/AutotuneLabScreen.tsx');
  const { amountFromLane, pitchDotFrom } = runSlice<{ amountFromLane: (v: number) => number; pitchDotFrom: (e: number, t: number) => number }>(
    between(s, 'function amountFromLane', '\nconst INTRO'),
    'amountFromLane, pitchDotFrom',
  );
  it('AMOUNT: a lane value at or under 0.005 becomes 0 (curve dashed, no wedge, no correction)', () => {
    assert.equal(amountFromLane(0.003), 0);
    assert.equal(amountFromLane(0.005), 0);
    assert.equal(amountFromLane(0.006), 0.006);
    assert.equal(amountFromLane(1), 1);
    assert.match(s, /setAmount\(amountFromLane\(v\)\);/);
    assert.match(s, /strokeDasharray=\{amount === 0 \? '4 4' : undefined\}/);
  });
  it('after a SPEED change mid-play the dot starts where the replayed melody is (1.1 s redraw, 6.6 s pass)', () => {
    const total = 1100 * 6;
    assert.ok(close(pitchDotFrom(1100 - 250, total), 850 / total));
    assert.equal(pitchDotFrom(-5, total), 0);
    assert.equal(pitchDotFrom(99999, total), 1);
    assert.match(s, /const from = pitchDotFrom\(Date\.now\(\) - passT0\.current, total\);/);
    assert.match(s, /passT0\.current = Date\.now\(\);\n {2}\}, \[passId\]\);/);
  });
});

// ── B11 De-Esser ───────────────────────────────────────────────────────────
const DE = await import('../src/features/deesser/deEsserModel.ts');

describe('B11 · De-Esser split-band: the frame strip and the spectrum show one cut', () => {
  it('at the hiss frequency the strip cut equals the spectrum cut, every frame, several bands', () => {
    for (const st of [DE.DEFAULTS, { ...DE.DEFAULTS, freqHz: 8000, q: 3, thresholdDb: -30 }, { ...DE.DEFAULTS, freqHz: 4000, q: 1, thresholdDb: -25 }]) {
      const s = { ...st, mode: 'split' as const };
      for (const f of DE.PHRASE) {
        const p = DE.processFrame(f, s);
        const g = Math.pow(10, -p.grDb / 20);
        // The complementary split's exact gain (round 2 checker): √((g² + X²)/(1 + X²)).
        const X = s.q * (f.hissHz / s.freqHz - s.freqHz / f.hissHz);
        const spectrumCut = Math.sqrt((g * g + X * X) / (1 + X * X));
        assert.ok(close(p.outHiss, f.hiss * spectrumCut, 1e-12), `${f.label} @ ${s.freqHz}`);
        assert.equal(p.outBody, f.body);
      }
    }
  });
  it('the "sh" (4 kHz) under the default 6.5 kHz band loses less than the band centre', () => {
    const sh = DE.PHRASE.find((f) => f.label === 'sh')!;
    const s = { ...DE.DEFAULTS, mode: 'split' as const, thresholdDb: -20 };
    const p = DE.processFrame(sh, s);
    assert.ok(p.grDb > 0);
    const lost = DE.toDb(sh.hiss) - DE.toDb(p.outHiss);
    assert.ok(lost > 0 && lost < p.grDb - 0.5, `${lost} vs ${p.grDb}`);
  });
  it('broadband is unchanged: everything × g', () => {
    for (const f of DE.PHRASE) {
      const p = DE.processFrame(f, { ...DE.DEFAULTS, mode: 'broadband', thresholdDb: -30 });
      const g = Math.pow(10, -p.grDb / 20);
      assert.ok(close(p.outHiss, f.hiss * g, 1e-12) && close(p.outBody, f.body * g, 1e-12));
    }
  });
  it('page 7 prints the split hiss cut it draws; the spectrum loop uses the same exact gain', () => {
    const s = src('src/screens/lab/deesser/DeEsserLabScreen.tsx');
    assert.match(s, /split-band → body 0 dB, hiss −\$\{splitHissDb\} dB/);
    assert.match(s, /outMag\[i\] = inSp\.mag\[i\] \* \(s\.mode === 'broadband' \? g : splitBandGain\(inSp\.hz\[i\], s, g\)\);/);
    assert.doesNotMatch(s, /1 - w \* \(1 - g\)/);
  });
  it('exact split gain: g at the band centre, 1 with no reduction; the checker’s numbers', () => {
    const s = { ...DE.DEFAULTS, mode: 'split' as const };
    assert.ok(close(DE.splitBandGain(6500, s, 0.25), 0.25, 1e-12));
    assert.ok(close(DE.splitBandGain(3000, s, 1), 1, 1e-12));
    // sh at 4 kHz under the default 6.5 kHz, Q 1.4 band (gain reduction 2.47 dB):
    // about 0.68 dB exact; the magnitude blend said 1.34.
    const sh = DE.PHRASE.find((f) => f.label === 'sh')!;
    const g = Math.pow(10, -DE.processFrame(sh, s).grDb / 20);
    const exactSh = -DE.toDb(DE.splitBandGain(4000, s, g));
    const blendSh = -DE.toDb(1 - DE.bandpassGain(4000, 6500, 1.4) * (1 - g));
    assert.ok(Math.abs(exactSh - 0.68) < 0.05 && Math.abs(blendSh - 1.34) < 0.05, `${exactSh} / ${blendSh}`);
  });
  it('pages 2 and 8 print the drop the strips draw; page 6 is labelled gain reduction', () => {
    const s = src('src/screens/lab/deesser/DeEsserLabScreen.tsx');
    const de = DE.processPhrase(DE.PHRASE, { ...DE.DEFAULTS, thresholdDb: -12, rangeDb: 8 });
    const drawn = DE.PHRASE.filter((f) => f.sibilant).map((f) => DE.toDb(f.hiss) - DE.toDb(de[DE.PHRASE.indexOf(f)].outHiss));
    assert.ok(close(DE.meanSibilantDropDb(de), drawn.reduce((a, b) => a + b, 0) / drawn.length, 1e-12));
    assert.equal(DE.meanSibilantDropDb(de).toFixed(1), '6.0');
    assert.match(s, /const sGr = which === 'eq' \? cut : meanSibilantDropDb\(de\);/);
    assert.match(s, /S’S DOWN ABOUT \{drop\.toFixed\(0\)\} dB/);
    assert.match(s, /peak gain reduction \{max\.toFixed\(1\)\} dB · average gain reduction on S’s/);
    const bb = DE.processPhrase(DE.PHRASE, DE.overSettings(1, 'broadband'));
    assert.ok(close(DE.meanSibilantDropDb(bb), DE.meanSibilantGr(bb), 1e-9), 'broadband: drop = gain reduction');
  });
});

// ── B13 Harmonograph viewer caption ────────────────────────────────────────
describe('B13 · Harmonograph viewer: no detune claim where it does nothing; PLAT OFF', () => {
  const s = src('src/screens/lab/HarmonographViewer.tsx');
  const { harmonoViewerCaption } = runSlice<{ harmonoViewerCaption: (c: Record<string, unknown>, a: string, b: string, d: string) => string }>(
    between(s, 'const fmtHz', '\nexport function HarmonographViewer').replace('export function', 'function'),
    'harmonoViewerCaption',
  );
  const base = { n1: 1.5, n2: 1, n3: 0, phaseDeg: 0, endAmp: 0.2, rotary: true, detune: 0.01, upTo: 1 };
  it('ROTARY, PLAT OFF, +1 %: reads PLAT OFF and no DETUNE', () => {
    const c = harmonoViewerCaption(base, '3:2', 'Perfect 5th', 'MEDIUM');
    assert.match(c, /PLAT OFF/);
    assert.doesNotMatch(c, /DETUNE/);
    assert.doesNotMatch(c, /0\.00 Hz/);
  });
  it('where the detune acts it is still named (ROTARY with PLAT on; LATERAL)', () => {
    assert.match(harmonoViewerCaption({ ...base, n3: 1 }, '3:2', 'P5', 'M'), /PLAT 1\.0 Hz.*DETUNE \+1%/);
    assert.match(harmonoViewerCaption({ ...base, rotary: false }, '3:2', 'P5', 'M'), /LATERAL.*DETUNE \+1%/);
    assert.doesNotMatch(harmonoViewerCaption({ ...base, rotary: false }, '3:2', 'P5', 'M'), /PLAT/);
  });
});

// ── B21 FX Distortion caption ──────────────────────────────────────────────
const DIST = await import('../src/screens/lab/fxDistCaption.ts');

describe('B21 · FX Distortion: SOFT / TUBE at low DRIVE say the bend is small', () => {
  it('the measured bend: about 1.3 % for SOFT at +6 dB, large at +20 dB', () => {
    const p6 = Math.pow(10, (-20 + 6) / 20);
    assert.ok(Math.abs(DIST.distBendPct('soft', p6) - 1.3) < 0.1, `${DIST.distBendPct('soft', p6)}`);
    assert.ok(DIST.distBendPct('soft', 1) > 20);
  });
  it('+6 dB SOFT gets the faint sentence; TUBE at +6 dB already bends ~8 % unequally, so it keeps its sentence', () => {
    const soft6 = DIST.distFaintCaption('soft', 6, -20);
    assert.ok(soft6 && /about 1 %/.test(soft6) && /faint/.test(soft6), soft6 ?? '');
    const p6 = Math.pow(10, (-20 + 6) / 20);
    assert.ok(DIST.distBendPct('tube', p6) > 7, 'the asymmetric bend is visible at +6 dB');
    assert.equal(DIST.distFaintCaption('tube', 6, -20), null);
    const tube0 = DIST.distFaintCaption('tube', 0, -20);
    assert.ok(tube0 && /unequally/.test(tube0), tube0 ?? '');
    assert.equal(DIST.distFaintCaption('soft', 20, -20), null);
    assert.equal(DIST.distFaintCaption('tube', 20, -20), null);
  });
  it('the shapers match fxViz distShape (the DSP mirror)', () => {
    const v = src('src/features/lab/fxViz.tsx');
    assert.match(v, /case 'soft': return Math\.tanh\(x\);/);
    assert.match(v, /case 'tube': return Math\.tanh\(x \+ 0\.4\) - Math\.tanh\(0\.4\);/);
  });
  it('the config uses it for SOFT and TUBE only (HARD keeps its own branch)', () => {
    const cfg = src('src/screens/lab/fxLabConfigs.tsx');
    assert.match(cfg, /if \(v\[P\.distType\] !== 0\) \{\n\s*const faint = distFaintCaption\(/);
    assert.match(cfg, /so far DRIVE is just gain/);
  });
});

// ── Round 2 checker NITs ───────────────────────────────────────────────────
describe('round 2 checker nits', () => {
  it('Tube Bias: the floor and ceiling guides sit at the curve’s real 0 and 1', () => {
    const viz = src('src/screens/lab/tube/viz.tsx');
    assert.match(viz, /p1=\{\{ x: cx0, y: yOfI\(0\) \}\}/);
    assert.match(viz, /p1=\{\{ x: cx0, y: yOfI\(1\) \}\}/);
    assert.doesNotMatch(viz, /yOfI\(0\.02\)|yOfI\(0\.98\)/);
    assert.equal(BIAS.plateCurrent01(0), 0);
    assert.equal(BIAS.plateCurrent01(1), 1);
  });
  it('Tuning ch1: off the landmark, the well line says where the marker is', () => {
    const s = src('src/screens/lab/tuning/chapters/ch1Intervals.tsx');
    assert.match(s, /Math\.abs\(cents - landmark\.value\.cents\) < 0\.005/);
    assert.match(s, /the marker is at \$\{cents\.toFixed\(2\)\} cents above the root\./);
  });
  it('EQ comments name the shading the half-gain bandwidth (Q)', () => {
    for (const f of ['src/screens/lab/eq/modules/MultiBand.tsx', 'src/screens/lab/eq/modules/FilterShapes.tsx', 'src/screens/lab/fxLabConfigs.tsx']) {
      assert.match(src(f), /half-gain bandwidth \(Q\)/, f);
      assert.doesNotMatch(src(f), /−3 dB width/, f);
    }
  });
});
