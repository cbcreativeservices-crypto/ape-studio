/**
 * Fix-first 15, group SYNTH (owner 2026-11-25, "Fix-first 15"): items 6, 13, 14, 15
 * of the lab controls audit (Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md).
 *
 *  6  Bass › Fretboard: the string's swing rate follows the SOUNDING note
 *     (string pitch × fret × harmonic), not the fret alone.
 * 13  FM Synth › stick graph: one fixed frequency axis, so INDEX adds sticks
 *     at fixed places and RATIO widens the gaps in proportion.
 * 14  Digital › Sampling: a new RATE keeps the input tone's Hz.
 * 15  Cymatics › Plate / Membrane: RESPONSE is measured against a fixed
 *     reference, so DAMPING lowers the peak; LEVEL scales the heat colours.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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

// ── 6. Bass swing rate ──────────────────────────────────────────────────────
describe('6 · Bass Fretboard: the swing follows the sounding note, string included', () => {
  const s = src('src/screens/lab/BassLabScreen.tsx');
  // The screen's own STRINGS table and swing helper, run as written.
  const block = s.slice(s.indexOf('const STRINGS = ['), s.indexOf('const NOTE_NAMES'));
  const js = ts.transpileModule(`${block}\nreturn { STRINGS, swingHzFor };`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const { STRINGS, swingHzFor } = new Function(js)() as { STRINGS: readonly { key: string; hz: number }[]; swingHzFor: (hz: number) => number };
  // The exact expression the Fretboard uses.
  const visHz = (stringIdx: number, mode: 'fretted' | 'harmonics', fret: number, harmonicN: number) =>
    swingHzFor(STRINGS[stringIdx].hz * (mode === 'fretted' ? Math.pow(2, fret / 12) : harmonicN));

  it('the Fretboard computes its rate from the string pitch × fret × harmonic', () => {
    assert.match(s, /const visHz = swingHzFor\(STRINGS\[stringIdx\]\.hz \* \(mode === 'fretted' \? Math\.pow\(2, fret \/ 12\) : harmonicN\)\);/);
    assert.match(s, /const SWING_SLOWDOWN = STRINGS\[0\]\.hz \/ 0\.45;/);
  });
  it('open G (98 Hz) swings faster than E at fret 12 (82.4 Hz); it used to be half as fast', () => {
    assert.ok(visHz(3, 'fretted', 0, 2) > visHz(0, 'fretted', 12, 2));
    assert.ok(close(visHz(3, 'fretted', 0, 2) / visHz(0, 'fretted', 12, 2), 97.999 / (41.203 * 2), 1e-9));
  });
  it('exactly proportional to the note: an octave is twice as fast on every string; the same note is the same rate', () => {
    for (let i = 0; i < 4; i++) {
      assert.ok(close(visHz(i, 'fretted', 12, 2) / visHz(i, 'fretted', 0, 2), 2, 1e-12), `string ${STRINGS[i].key}`);
      assert.ok(close(visHz(i, 'harmonics', 0, 2), visHz(i, 'fretted', 12, 2), 1e-12), 'node ½ = fret 12');
    }
    for (let i = 0; i < 3; i++) assert.ok(close(visHz(i, 'fretted', 5, 2), visHz(i + 1, 'fretted', 0, 2), 1e-3), 'fret 5 = next string open');
  });
  it('one slow-down constant: open E keeps its old 0.45/s; the top (G, 5th harmonic) is 5.35/s, watchable', () => {
    assert.ok(close(visHz(0, 'fretted', 0, 2), 0.45, 1e-12));
    // The E string is exactly what it was (the old formula ignored the string, i.e. assumed E).
    for (let f = 0; f <= 12; f++) assert.ok(close(visHz(0, 'fretted', f, 2), 0.45 * Math.pow(2, f / 12), 1e-12));
    const top = visHz(3, 'harmonics', 0, 5);
    assert.ok(top > 5.3 && top < 5.4, `top ${top}`);
    assert.ok(60 / top > 10, 'more than 10 frames per swing at 60 fps');
  });
  it('strictly increasing across every note the board can play', () => {
    const all: { hz: number; v: number }[] = [];
    for (let i = 0; i < 4; i++) {
      for (let f = 0; f <= 12; f++) all.push({ hz: STRINGS[i].hz * Math.pow(2, f / 12), v: visHz(i, 'fretted', f, 2) });
      for (const n of [2, 3, 4, 5]) all.push({ hz: STRINGS[i].hz * n, v: visHz(i, 'harmonics', 0, n) });
    }
    all.sort((a, b) => a.hz - b.hz);
    for (let k = 1; k < all.length; k++) {
      if (all[k].hz - all[k - 1].hz > 1e-3) assert.ok(all[k].v > all[k - 1].v, `${all[k - 1].hz} → ${all[k].hz}`);
    }
  });
});

// ── 13. FM stick graph ─────────────────────────────────────────────────────
const FM_FILE = fileURLToPath(new URL('../src/screens/lab/FmLabScreen.tsx', import.meta.url));
const FM_GRID = await import('../src/screens/lab/fmGrid.ts');
const nodeRequire = createRequire(import.meta.url);
const W = 353;
const H = 190;
const PAD = 14;
const GREEN = '#5bff85';
const RED = '#ff6b5e';
type Mark = Record<string, unknown>;
type Param = { id: string; onSelect?: (id: string) => void; onChange?: (v: number) => void };
const textOf = (n: unknown): string => (Array.isArray(n) ? n.map(textOf).join('') : n == null ? '' : String(n));

/** The real FM screen with its neighbours stood in (same harness as early_G3-fm-lab_20261105). */
function openFm() {
  const slots: unknown[] = [];
  let cursor = 0;
  let params: Param[] = [];
  let lines: Mark[] = [];
  let labels: Mark[] = [];
  const box = (p: { children?: React.ReactNode }) => React.createElement('div', null, p.children);
  const useState = (init: unknown) => {
    const at = cursor++;
    if (!(at in slots)) slots[at] = typeof init === 'function' ? (init as () => unknown)() : init;
    return [slots[at], (v: unknown) => { slots[at] = v; }];
  };
  const anything = (): unknown =>
    new Proxy(function () {}, {
      get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : k === '__esModule' ? true : k === 'prototype' ? undefined : anything()),
      apply: () => null,
    });
  const modules: Record<string, unknown> = {
    react: { ...React, useState },
    'react-native': { View: box, Text: box, Pressable: box, StyleSheet: { create: (x: unknown) => x } },
    'react-native-svg': {
      __esModule: true,
      default: box,
      Rect: () => null,
      Circle: () => null,
      Line: (p: Mark) => { lines.push(p); return null; },
      Text: (p: Mark) => { labels.push(p); return null; },
    },
    '../../features/audio/AudioOutputGate': { useAudioOutputGate: () => ({ requestAudioOutput: async () => false }) },
    './rack/stageAspect': { useStageTextScale: () => 1 },
    './fmGrid': FM_GRID,
    './LabShell': {
      HeaderPlayButton: () => null,
      LabShell: (p: { rack: { params: Param[]; stage: { render: (w: number, h: number) => React.ReactNode } } }) => {
        params = p.rack.params;
        return React.createElement('div', null, p.rack.stage.render(W, H));
      },
    },
  };
  const req = (spec: string): unknown => (spec in modules ? modules[spec] : spec.startsWith('react/') ? nodeRequire(spec) : anything());
  const js = ts.transpileModule(readFileSync(FM_FILE, 'utf8').replace(/\r\n/g, '\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} as { FmLabScreen: React.ComponentType } };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  const paint = () => {
    cursor = 0;
    lines = [];
    labels = [];
    renderToStaticMarkup(React.createElement(mod.exports.FmLabScreen));
    const sticks = lines.filter((l) => l.strokeWidth === 2 || l.strokeWidth === 3);
    const axisY = labels.find((m) => textOf(m.children) === 'Hz')?.y;
    return {
      sticks: sticks.map((l) => ({ x: Number(l.x1), stroke: String(l.stroke) })),
      carrierX: Number(sticks.find((l) => l.stroke === GREEN)?.x1 ?? NaN),
      ticks: labels.filter((l) => l.y === axisY).map((l) => `${textOf(l.children)}@${Number(l.x).toFixed(3)}`),
    };
  };
  const param = (id: string) => {
    paint();
    const p = params.find((q) => q.id === id);
    assert.ok(p, `${id} is on the dock`);
    return p;
  };
  return {
    paint,
    setFc: (hz: number) => { param('carrier').onSelect?.(String(hz)); return paint(); },
    setRatio: (label: string) => { param('ratio').onSelect?.(label); return paint(); },
    setIndex: (v: number) => { param('index').onChange?.(v / 8); return paint(); },
  };
}

describe('13 · FM stick graph: one fixed axis', () => {
  it('the axis mapping is fixed and strictly increasing, 0 Hz → Nyquist', () => {
    const f = (hz: number) => FM_GRID.fmAxisFrac(hz, 24000);
    assert.equal(f(0), 0);
    assert.ok(close(f(5000), 0.85));
    assert.equal(f(24000), 1);
    let prev = -1;
    for (let hz = 0; hz <= 24000; hz += 10) {
      assert.ok(f(hz) > prev, `${hz} Hz`);
      prev = f(hz);
    }
  });
  it('riding INDEX adds sticks but never moves one (FC 220, RATIO 2); the axis never changes', () => {
    const lab = openFm();
    lab.setFc(220);
    lab.setRatio('2');
    const at0 = lab.setIndex(0);
    let prev = at0;
    for (const i of [0.5, 1, 2, 4, 6, 8]) {
      const now = lab.setIndex(i);
      assert.ok(close(now.carrierX, at0.carrierX), `I ${i}: the note stays put`);
      assert.deepEqual(now.ticks, at0.ticks, `I ${i}: same axis`);
      // Every stick sits at |fc ± k·fm| = an odd multiple of 220 Hz, read back off the
      // fixed axis: the places are fixed, so INDEX can only add or remove sticks.
      for (const t of now.sticks) {
        const frac = (t.x - PAD) / (W - 2 * PAD);
        const hz = frac <= 0.85 ? (frac / 0.85) * 5000 : 5000 + ((frac - 0.85) / 0.15) * 19000;
        const n = hz / 220;
        assert.ok(Math.abs(n - Math.round(n)) < 1e-6 && Math.round(n) % 2 === 1, `I ${i}: stick at ${hz} Hz`);
      }
      prev = now;
    }
    assert.ok(prev.sticks.length > at0.sticks.length + 6, 'the sticks multiplied');
  });
  it('RATIO widens the gaps in proportion (FC 220, INDEX 2): 0.5 → 7 is fourteen times wider', () => {
    const lab = openFm();
    lab.setFc(220);
    lab.setIndex(2);
    const pxPerHz = (0.85 * (W - 2 * PAD)) / 5000; // the fixed linear part
    const gaps: number[] = [];
    for (const [label, r] of [['0.5', 0.5], ['1', 1], ['1.41 ✳', 1.41], ['2', 2], ['3.5', 3.5], ['7', 7]] as const) {
      const p = lab.setRatio(label);
      // the first upper sideband, fc + fm, is drawn exactly fm × the fixed scale right of the note
      const want = p.carrierX + r * 220 * pxPerHz;
      assert.ok(p.sticks.some((s) => close(s.x, want, 1e-6)), `ratio ${label}: a stick at fc + fm`);
      gaps.push(want - p.carrierX);
    }
    assert.ok(close(gaps[5] / gaps[0], 14, 1e-9), 'RATIO 7 vs 0.5: fourteen times the gap');
    assert.ok(gaps[5] - gaps[0] > 60, `a visible change on a phone glass (${gaps[0]} → ${gaps[5]} px)`);
  });
  it('the extreme settings the lessons name still draw red fold-backs, on the glass', () => {
    for (const i of [6, 8]) {
      const lab = openFm();
      lab.setFc(440);
      lab.setRatio('7');
      const p = lab.setIndex(i);
      const red = p.sticks.filter((s) => s.stroke === RED);
      assert.ok(red.length > 0, `INDEX ${i}: red dashed sticks appear`);
      for (const s of p.sticks) assert.ok(s.x >= PAD - 1e-9 && s.x <= W - PAD + 1e-9, 'on the glass');
      for (const s of red) assert.ok(s.x > PAD + 0.85 * (W - 2 * PAD), 'a fold-back lands above 5 kHz, in the squeezed strip');
    }
  });
  it('the BW readout and the aliasing maths are untouched', () => {
    const s = src('src/screens/lab/FmLabScreen.tsx');
    assert.match(s, /const carson = 2 \* fm \* \(index \+ 1\);/);
    assert.match(s, /if \(ff > NYQUIST\) \{\n\s*ff = 2 \* NYQUIST - ff;\n\s*fold = 'alias';/);
    assert.match(s, /const xOf = \(f: number\) => PAD \+ fmAxisFrac\(f, NYQUIST\) \* plotW;/);
  });
});

// ── 14. Sampling RATE keeps the tone ───────────────────────────────────────
const SF = await import('../src/screens/lab/digital/samplingFreq.ts');
const RATES = [8000, 16000, 22050, 32000, 44100, 48000, 96000, 192000];

describe('14 · Digital Sampling: a new RATE keeps the input tone', () => {
  it('1 kHz stays 1 kHz through every rate (it read 914 / 786 / 691 / 522 Hz)', () => {
    let f = 1000;
    for (const fs of [48000, 32000, 22050, 16000, 8000, 96000, 48000]) {
      const r = SF.samplingFreqOnRate(f, SF.samplingFreqMax({ kind: 'abs', fs }));
      assert.equal(r.fHz, 1000, `${fs}`);
      assert.equal(r.clampedFrom, null);
      f = r.fHz;
    }
  });
  it('the FREQ fader shows the same Hz at its new position on every rate', () => {
    for (const fs of RATES) {
      const max = SF.samplingFreqMax({ kind: 'abs', fs });
      for (const hz of [100, 440, 1000, 5000, 5999]) {
        if (hz > max) continue;
        assert.equal(SF.samplingFreqOf(SF.samplingPosOf(hz, max), max), hz, `${hz} Hz at ${fs}`);
      }
    }
    // The same Hz sits higher on a narrower range.
    assert.ok(SF.samplingPosOf(1000, SF.samplingFreqMax({ kind: 'abs', fs: 8000 })) > SF.samplingPosOf(1000, SF.samplingFreqMax({ kind: 'abs', fs: 48000 })));
  });
  it('only a tone past the new top is lowered, to that top, and says from what', () => {
    assert.deepEqual(SF.samplingFreqOnRate(20000, SF.samplingFreqMax({ kind: 'abs', fs: 8000 })), { fHz: 6000, clampedFrom: 20000 });
    assert.deepEqual(SF.samplingFreqOnRate(30000, SF.samplingFreqMax({ kind: 'abs', fs: 32000 })), { fHz: 24000, clampedFrom: 30000 });
    assert.deepEqual(SF.samplingFreqOnRate(9000, SF.samplingFreqMax({ kind: 'cyc', mult: 2 })), { fHz: 8000, clampedFrom: 9000 });
    // The fader's own top at 22.05k (16 538 Hz) is not "past the top" when that rate is picked again.
    const top = SF.samplingFreqOf(1, SF.samplingFreqMax({ kind: 'abs', fs: 22050 }));
    assert.deepEqual(SF.samplingFreqOnRate(top, SF.samplingFreqMax({ kind: 'abs', fs: 22050 })), { fHz: top, clampedFrom: null });
  });
  it('at 48k the fader is the same map as before (100 Hz → 30 kHz, opening at 1 kHz)', () => {
    const max = SF.samplingFreqMax({ kind: 'abs', fs: 48000 });
    assert.equal(max, 30000);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) assert.equal(SF.samplingFreqOf(v, max), Math.round(100 * Math.pow(300, v)));
  });
  it('the module keeps the tone in Hz, routes RATE through pickRate, and says so on screen when it lowers it', () => {
    const s = src('src/screens/lab/digital/modules/modAnalog.tsx');
    assert.match(s, /const \[f, setF\] = useState\(1000\);/);
    assert.match(s, /const freqV = samplingPosOf\(f, fMax\);/);
    assert.match(s, /onPress=\{\(\) => pickRate\(\{ kind: 'abs', fs: r \}\)\}/);
    assert.match(s, /onPress=\{\(\) => pickRate\(\{ kind: 'cyc', mult: m \}\)\}/);
    assert.doesNotMatch(s, /setRateMode\(\{ kind/);
    assert.match(s, /At this RATE the FREQ fader only reaches \$\{fmtHz\(f\)\}, so your \$\{fmtHz\(clampedFrom\)\} tone was lowered to \$\{fmtHz\(f\)\}\./);
  });
});

// ── 15. Cymatics DAMPING and LEVEL ─────────────────────────────────────────
const PM = await import('../src/features/cymatics/plateModes.ts');
const MB = await import('../src/features/cymatics/membrane.ts');
const PF = await import('../src/features/cymatics/patternField.ts');

describe('15 · Cymatics: DAMPING lowers the peak; LEVEL brightens the heat map', () => {
  const plate = PM.DEFAULT_PLATE;
  const modes = PM.plateModes(plate, 16);
  const m22 = modes.find((m: { hz: number }) => Math.abs(m.hz - 191.1) < 1)!;
  const plateAt = (damping: number, f = m22.hz) =>
    PM.readResonance(f, modes, PM.effectiveQ(plate.material, damping), PM.plateRefQ(plate.material));

  it('plate on its 191.1 Hz mode: Low 98 %, Medium 35 %, High 7.5 % (was 98.0 / 99.8 / 100.0 %); all still AT', () => {
    const low = plateAt(0.1, 191.1);
    const med = plateAt(0.4, 191.1);
    const high = plateAt(0.85, 191.1);
    assert.equal(Math.round(low.strength * 1000) / 10, 98.0);
    assert.ok(Math.abs(med.strength - 0.354) < 0.002, `${med.strength}`);
    assert.ok(Math.abs(high.strength - 0.075) < 0.002, `${high.strength}`);
    assert.ok(low.strength > med.strength && med.strength > high.strength);
    for (const r of [low, med, high]) assert.equal(r.state, 'at', 'damping blurs a resonance, it does not move it');
  });
  it('more damping = a broader peak: 2 % off the mode keeps more of its peak', () => {
    const keep = (d: number) => plateAt(d, m22.hz * 1.02).strength / plateAt(d, m22.hz).strength;
    assert.ok(keep(0.85) > keep(0.4) && keep(0.4) > keep(0.1));
  });
  it('the reference is the Low plate: at Low every reading is what it was', () => {
    assert.equal(PM.PLATE_REF_DAMPING, PM.DEFAULT_PLATE.damping);
    const Q = PM.effectiveQ(plate.material, 0.1);
    for (const f of [60, 120, 191.1, 240, 400, 900, 2000]) {
      const a = PM.readResonance(f, modes, Q, PM.plateRefQ(plate.material));
      const b = PM.readResonance(f, modes, Q); // the old normalisation
      assert.equal(a.strength, b.strength, `${f} Hz`);
      assert.equal(a.state, b.state);
    }
  });
  it('the STATE ignores the reference (same as the old reading at every damping)', () => {
    for (const d of [0.1, 0.4, 0.85]) {
      const Q = PM.effectiveQ(plate.material, d);
      for (const f of [60, 150, 191.1, 240, 500]) assert.equal(PM.readResonance(f, modes, Q, PM.plateRefQ(plate.material)).state, PM.readResonance(f, modes, Q).state);
    }
  });

  const mModes = MB.membraneModes(MB.DEFAULT_MEMBRANE, 16);
  const m11 = mModes.find((m: { label: string }) => m.label.startsWith('(1,1)'))!;
  const drum = (damping: number) => {
    const spec = { ...MB.DEFAULT_MEMBRANE, damping };
    return MB.membraneStrength(mModes, m11.hz, MB.membraneQ(spec), MB.membraneRefQ(spec));
  };
  it('drum (1,1): Open 43 %, Muffled 27 %, Hand on the head 7 % (was 43 % for all three)', () => {
    const open = drum(0.15);
    const muffled = drum(0.5);
    const hand = drum(0.95);
    assert.equal(Math.round(open.strength * 100), 43);
    assert.equal(Math.round(muffled.strength * 100), 27);
    assert.equal(Math.round(hand.strength * 100), 7);
    for (const r of [open, muffled, hand]) {
      assert.equal(Math.round(r.near * 100), 43, '"am I on a mode?" does not change with damping');
      assert.equal(r.dominant?.id, m11.id);
    }
  });
  it('the drum reference is the Open head: at Open the reading is what it was', () => {
    assert.equal(MB.MEMBRANE_REF_DAMPING, MB.DEFAULT_MEMBRANE.damping);
    const Q = MB.membraneQ(MB.DEFAULT_MEMBRANE);
    for (const f of [80, 150, m11.hz, 500, 900]) {
      const a = MB.membraneStrength(mModes, f, Q, MB.membraneRefQ(MB.DEFAULT_MEMBRANE));
      assert.equal(a.strength, MB.membraneStrength(mModes, f, Q).strength, `${f} Hz`);
      assert.equal(a.strength, a.near);
    }
  });
  it('a saved pattern reads the same RESPONSE the studio showed (gallery / Lab Print)', () => {
    const state = { studio: 'plate', spec: { ...plate, damping: 0.85 }, hz: 191.1, amplitude: 0.3, view: 'heat', multi: 'off', sandCount: 1, sandSize: 1, friction: 0.4 };
    const geo = PF.patternGeometry(state as never, 12);
    assert.ok(Math.abs(geo.strength - plateAt(0.85, 191.1).strength) < 1e-12);
    const rows = PF.patternReadout(state as never).rows as { k: string; v: string }[];
    const shown = Math.round(plateAt(0.85, 191.1).strength * 100);
    assert.ok(shown <= 8);
    assert.ok(rows.find((r) => r.k === 'Resonance')!.v.endsWith(` · strength ${shown} %`));
    assert.ok(rows.find((r) => r.k === 'Resonance')!.v.startsWith('AT · mode (2,2)'));
  });
  it('the screens pass the fixed reference; the drum decides "on a mode?" from near', () => {
    assert.match(src('src/screens/lab/cymatics/PlateStudioScreen.tsx'), /readResonance\(freq, modes, Q, refQ\)/);
    assert.match(src('src/screens/lab/cymatics/modules/modChange.tsx'), /readResonance\(hz, modes, Q, plateRefQ\(spec\.material\)\)/);
    const m = src('src/screens/lab/cymatics/MembraneStudioScreen.tsx');
    assert.match(m, /membraneStrength\(modes, freq, Q, refQ\)/);
    assert.doesNotMatch(m, /st\.strength [<>]/);
  });
  // Owner 2026-11-25, fix-first 15 (round 2, checker Y2/Y4): the linear
  // LEVEL × strength pin is replaced by the one stated compressive curve
  // (vizGain.heatGainK) and the table-lookup colours; test/fixNext_cym_20261125
  // pins the curve itself.
  it('LEVEL scales the heat colours (plate heat + 3D; drum heat + 3D + cone front view)', () => {
    const p = src('src/screens/lab/cymatics/vizPlate.tsx');
    assert.match(p, /const heatK = heatGainK\(p\.amplitude, p\.strength\);/);
    assert.match(p, /cols\[k\] = heatColorFast\(a \* heatK\);/);
    assert.match(p, /cols\[k\] = heatColorFast\(Math\.abs\(grid3d\.vals\[k\]\) \* heatK\);/);
    assert.doesNotMatch(p, /heatColor(Fast)?\([^)]*strengthK/);
    const d = src('src/screens/lab/cymatics/vizMembrane.tsx');
    assert.match(d, /const heatK = heatGainK\(p\.amplitude, p\.strength\);/);
    assert.match(d, /else cols\[k\] = heatColorFast\(a \* heatK\);/);
    assert.match(d, /Math\.abs\(v\) \* levelK \* \(0\.35 \+ 0\.65 \* coneExc\)/);
    assert.doesNotMatch(d, /heatColor(Fast)?\([^)]*strengthK/);
  });
});
