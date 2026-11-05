/**
 * S3, Amp Module 8 step 3 (2026-11-05): the page handed `faulted` to the
 * picture and AmpRig never read it, so Bridge into 2 Ω printed FAULT and HEAT
 * DANGER over a healthy sine, and mode, load and vent moved nothing on the
 * glass. Now a page that opts in (`stageStatus`) gets a red broken output
 * trace, a fault tag, and CURRENT / HEAT bars read from `supplyFlow` and `heat`.
 *
 * AmpRig.tsx is really rendered: transpiled with the repo's TypeScript and run
 * with stand-ins that record every output polyline, text and bar width. The
 * Module 8 values come from the real evaluateRig.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { evaluateRig, type RigVerdict } from '../src/features/amp/ampModel.ts';

const nodeRequire = createRequire(import.meta.url);
const FILE = 'src/screens/lab/amp/AmpRig.tsx';
const RED = '#ff0001';
const AMBER = '#ffaa01';

type Line = { stroke: string; dash?: string; width: number };
type Pic = Record<string, unknown>;

function draw(p: Pic, w = 340, h = 190) {
  const lines: Line[] = [];
  const texts: string[] = [];
  const bars: { width: string; color: string }[] = [];
  const flat = (s: unknown): Record<string, unknown> => (Array.isArray(s) ? Object.assign({}, ...s.map(flat)) : ((s ?? {}) as Record<string, unknown>));
  const pass = (q: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, q.children);
  const View = (q: { children?: React.ReactNode; style?: unknown }) => {
    const s = flat(q.style);
    if (typeof s.width === 'string' && s.backgroundColor) bars.push({ width: s.width, color: String(s.backgroundColor) });
    return pass(q);
  };
  const Text = (q: { children?: React.ReactNode }) => {
    texts.push(React.Children.toArray(q.children).join(''));
    return null;
  };
  const Polyline = (q: { stroke: string; strokeDasharray?: string; strokeWidth: number }) => {
    lines.push({ stroke: q.stroke, dash: q.strokeDasharray, width: q.strokeWidth });
    return null;
  };
  const anim = { interpolate: () => 0 };
  const modules: Record<string, unknown> = {
    'react-native': {
      StyleSheet: { create: (x: unknown) => x },
      View,
      Text,
      Animated: { View: () => null, Value: function Value() { return anim; } },
      Easing: { linear: 0 },
    },
    'react-native-svg': { __esModule: true, default: pass, Defs: pass, Line: () => null, LinearGradient: () => null, Polyline, Rect: () => null, Stop: () => null },
    '../../../theme/tokens': { colors: { textMuted: '#777', textSub: '#777', green: '#0f0', red: RED }, fonts: { oswaldMedium: 'x' } },
    '../../../theme/legibility': { fitValue: () => ({}) },
    '../../../features/tools/levelColor': { WAVE_LEVEL_STOPS: [], levelColor: () => '#000' },
    '../../../features/settings/decorativeMotion': { useDecorativeMotion: () => false },
    '../../../features/amp/ampModel': { cycleRms: () => 0 },
    '../rack/stageAspect': { useStageTextScale: () => 1 },
    './kit': { AMP_COLORS: { pos: '#111', neg: '#222', supply: AMBER, fault: RED } },
  };
  const req = (spec: string): unknown => {
    if (spec === 'react' || spec.startsWith('react/')) return nodeRequire(spec);
    assert.ok(spec in modules, `stand-in missing for ${spec}`);
    return modules[spec];
  };
  const js = ts.transpileModule(readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} as { WaveStack: React.ComponentType<Pic>; rigAspect: (p: Pic) => number } };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  const play = { motion: false, stepPhase: 0, phase: anim };
  renderToStaticMarkup(React.createElement(mod.exports.WaveStack, { w, h, p, play }));
  return { lines, texts, bars, aspect: mod.exports.rigAspect(p) };
}

const output = new Float32Array([0, 0.5, 0, -0.5, 0]);
const base: Pic = { output, input: output, clipAt: 1, speaker: true, a11ySummary: 'x' };
const outTrace = (d: ReturnType<typeof draw>) => d.lines.at(-1)!;

const rig = (bridged: boolean, loadZ: number, vent: 0 | 1): RigVerdict =>
  evaluateRig({ sourceLevel: 0.5, mixerLevel: 0.5, ampInput: 0.5, railLimit: 1, loadZ, minLoadZ: 4, bridged, bridgeSupported: true, ventBlocked: vent, instrumentCable: false, shorted: false });
const pic = (r: RigVerdict): Pic => ({ ...base, supplyFlow: r.currentDemand, heat: r.thermal, faulted: r.primary != null, stageStatus: true, faultTag: 'LOAD' });
const fillOf = (d: ReturnType<typeof draw>, i: number) => parseInt(d.bars[i].width, 10);

describe('Module 8: a fault shows on the output trace, not only on the bezel', () => {
  it('Bridge into 2 Ω turns the output trace red and broken and tags the panel', () => {
    const v = rig(true, 2, 1);
    assert.ok(v.primary, 'the model calls this a fault');
    const d = draw(pic(v));
    assert.equal(outTrace(d).stroke, RED);
    assert.ok(outTrace(d).dash);
    assert.ok(d.texts.includes('FAULT · LOAD'), d.texts.join(' | '));
  });

  it('a healthy setup keeps the amplitude ramp, unbroken, with no tag', () => {
    const v = rig(false, 8, 0);
    assert.equal(v.primary, null);
    const d = draw(pic(v));
    assert.match(outTrace(d).stroke, /^url\(#/);
    assert.equal(outTrace(d).dash, undefined);
    assert.ok(!d.texts.some((t) => t.startsWith('FAULT')), d.texts.join(' | '));
  });
});

describe('Module 8: mode, load and vent move the stage', () => {
  it('the bars read the existing supplyFlow and heat values, with their words', () => {
    const d = draw({ ...base, supplyFlow: 0.37, heat: 0.85, stageStatus: true });
    assert.deepEqual(d.bars.map((b) => b.width), ['37%', '85%']);
    assert.equal(d.bars[0].color, AMBER);
    assert.ok(d.texts.includes('CURRENT') && d.texts.includes('37%'), d.texts.join(' | '));
    assert.ok(d.texts.includes('HEAT') && d.texts.includes('DANGER'), d.texts.join(' | '));
  });

  it('a lower load or a bridge fills the CURRENT bar; a blocked vent fills the HEAT bar', () => {
    const clean = draw(pic(rig(false, 8, 0)));
    assert.ok(fillOf(draw(pic(rig(false, 4, 0))), 0) > fillOf(clean, 0), 'load');
    assert.ok(fillOf(draw(pic(rig(true, 8, 0))), 0) > fillOf(clean, 0), 'mode');
    assert.ok(fillOf(draw(pic(rig(false, 8, 1))), 1) > fillOf(clean, 1), 'vent');
  });

  it('the strip takes its own room: the stack gets taller, so nothing lands on a panel', () => {
    const plain = draw({ ...base, supplyFlow: 0, heat: 0 });
    const status = draw({ ...base, supplyFlow: 0, heat: 0, stageStatus: true });
    assert.ok(status.aspect < plain.aspect, `${status.aspect} < ${plain.aspect}`);
  });
});

describe('the other rig pages look the same as today', () => {
  it('without stageStatus, `faulted` draws nothing new (Modules 1 and 6 set it)', () => {
    const today = { ...base, supplyFlow: 0.9, heat: 0.9 };
    const healthy = draw(today);
    const faulted = draw({ ...today, faulted: true });
    // The gradient id is random per stack, so it is left out of the comparison.
    const same = (d: ReturnType<typeof draw>) => ({ ...d, lines: d.lines.map((l) => ({ ...l, stroke: l.stroke.replace(/^url.*/, 'gradient') })) });
    assert.deepEqual(same(faulted), same(healthy));
    assert.equal(faulted.aspect, 340 / 154, 'two panels keep today’s shape');
    assert.match(outTrace(faulted).stroke, /^url\(#/);
    assert.equal(faulted.bars.length, 0);
    assert.ok(!faulted.texts.some((t) => /FAULT|CURRENT|HEAT/.test(t)), faulted.texts.join(' | '));
  });

  it('only Module 8 opts in', () => {
    const src = (f: string) => readFileSync(`src/screens/lab/amp/modules/${f}.tsx`, 'utf8').replace(/\r\n/g, '\n');
    assert.match(src('mod8Apply'), /stageStatus: true/);
    for (const f of ['mod1What', 'mod3Bias', 'mod4Classes', 'mod5ClassD', 'mod6Supply']) assert.doesNotMatch(src(f), /stageStatus/, f);
  });
});
