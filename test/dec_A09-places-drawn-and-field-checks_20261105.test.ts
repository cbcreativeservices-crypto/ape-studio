/**
 * Function audit, decision 10 A and the "left not fixed" list (2026-11-05).
 *
 * F06 / F07 SITE and B03 PLACE changed the words but not the picture: forest,
 * plaza and street looked the same. Each place now has a plain backdrop, drawn
 * in code behind the wind marks. WindArt and ReporterArt are really rendered
 * here, with stand-ins that record every Skia path in drawing order.
 *
 * The Field Reporter's readouts could print "−0 dB": the sign came from the
 * raw value and the digits from the rounded one. The real step hook runs on a
 * small useState stand-in, so the dock is pressed as it is on a phone.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as wind from '../src/screens/lab/miking/lessons/shared/field/wind.ts';
import * as reporterWind from '../src/screens/lab/miking/lessons/shared/broadcast/reporterWind.ts';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { useInterviewStep } = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/reporterPages.tsx'));
const { PAIR, SHOULDER_REP } = R(await import('../src/screens/lab/miking/lessons/b03FieldReporter/geometry.ts'));

const nodeRequire = createRequire(import.meta.url);
const WIND_FILE = 'src/screens/lab/miking/lessons/shared/field/WindArt.tsx';
const REPORTER_FILE = 'src/screens/lab/miking/lessons/shared/broadcast/ReporterArt.tsx';
const AIR = '#8fbcff';

type Drawn = { color: string; ops: number };

/** Renders one scene and returns its paths in drawing order. */
function draw(file: string, scene: string, props: Record<string, unknown>, own: Record<string, unknown>): Drawn[] {
  const drawn: Drawn[] = [];
  const pass = (p: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, p.children);
  const blank = () => null;
  const makePath = () => {
    const path: Record<string, unknown> & { ops: number } = { ops: 0 };
    return new Proxy(path, {
      get: (t, k) => (k === 'ops' ? t.ops : () => { t.ops += 1; return { x: 0, y: 0, width: 1, height: 1 }; }),
    });
  };
  const Path = (p: { path: { ops: number }; color?: string; children?: React.ReactElement<{ colors?: string[] }> }) => {
    drawn.push({ color: p.color ?? p.children?.props?.colors?.join('>') ?? '?', ops: p.path.ops });
    return null;
  };
  const skia = {
    Canvas: pass, Circle: blank, DashPathEffect: blank, Group: pass, LinearGradient: blank, RadialGradient: blank, Path,
    Skia: { Path: { Make: makePath }, XYWHRect: () => ({}), RRectXY: () => ({}) },
    vec: (x: number, y: number) => ({ x, y }),
  };
  let n = 7;
  const modules: Record<string, unknown> = {
    '@shopify/react-native-skia': skia,
    '../smallperc/soundKit': { SoundCanvas: pass },
    '../foley/StageArt': { seeded: () => () => { n = (n * 31 + 11) % 1000; return n / 1000; } },
    '../../../../../../features/lab/micDrawings': { ShotgunMountMic: blank, MikingMicArt: blank },
    './BroadcastArt': { PaSpeaker: blank },
    ...own,
  };
  const req = (spec: string): unknown => {
    if (spec === 'react' || spec.startsWith('react/')) return nodeRequire(spec);
    assert.ok(spec in modules, `no stand-in for ${spec}`);
    return modules[spec];
  };
  const js = ts.transpileModule(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} as Record<string, React.ComponentType<Record<string, unknown>>> };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  renderToStaticMarkup(React.createElement(mod.exports[scene], { w: 355, h: 290, accessibilityLabel: 'x', ...props }));
  return drawn;
}

/** What is drawn before the first wind mark: the place. */
const backdrop = (d: Drawn[]) => {
  const air = d.findIndex((p) => p.color === AIR);
  assert.ok(air >= 0, 'the wind marks are still drawn');
  return d.slice(0, air);
};
const look = (d: Drawn[]) => d.map((p) => `${p.color}:${p.ops}`).join(' ');
const hues = (d: Drawn[]) => new Set(d.map((p) => p.color));

const windScene = (exposure: string) => draw(WIND_FILE, 'WindScene', { layer: 'foam', exposure }, { './wind.ts': wind });
const reporterScene = (site: string) => draw(REPORTER_FILE, 'ReporterWindScene', { cover: 'foam', site }, { './reporterWind.ts': reporterWind });

test('F06 / F07 SITE: forest, grassland and plaza are each drawn, behind the wind marks', () => {
  const forest = backdrop(windScene('forest'));
  const open = backdrop(windScene('open'));
  const plaza = backdrop(windScene('plaza'));
  for (const b of [forest, open, plaza]) assert.ok(b.length >= 3, 'a place has a backdrop of its own');
  assert.notEqual(look(forest), look(open));
  assert.notEqual(look(forest), look(plaza));
  assert.notEqual(look(open), look(plaza));
  const shared = [...hues(forest)].filter((c) => hues(plaza).has(c));
  assert.deepEqual(shared, [], 'the forest and the plaza share no colour: they read differently at a glance');
});

test('B03 PLACE: street, doorway and waterfront are each drawn, behind the wind marks', () => {
  const street = backdrop(reporterScene('street'));
  const door = backdrop(reporterScene('sheltered'));
  const water = backdrop(reporterScene('exposed'));
  for (const b of [street, door, water]) assert.ok(b.length >= 3, 'a place has a backdrop of its own');
  assert.notEqual(look(street), look(door));
  assert.notEqual(look(street), look(water));
  assert.notEqual(look(door), look(water));
});

test('the sites of F06 and the street of B03 do not look alike either', () => {
  const street = hues(backdrop(reporterScene('street')));
  const forest = hues(backdrop(windScene('forest')));
  assert.ok(street.size >= 3 && forest.size >= 3, 'both places are drawn');
  assert.deepEqual([...street].filter((c) => forest.has(c)), []);
});

/* ── the signed readouts ── */

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const art = { art: 'flagHandheld' as const, r: 24, len: 200 };
const SPEC = {
  pair: PAIR,
  shoulder: SHOULDER_REP,
  top: () => null,
  side: () => null,
  box: { u0: -1900, u1: 2700, v0: -2350, v1: 2350 },
  sideBox: { u0: -400, u1: 1200, v0: -420, v1: 700 },
  omni: art,
  dir: art,
  words: { looking: 'looking', prompt: 'prompt', done: 'FINISHED' },
};
type Param = { id: string; onSelect?: (id: string) => void; onChange?: (v: number) => void };

function learner() {
  const slots: unknown[] = [];
  let at = 0;
  const useState = (init: unknown) => {
    const i = at++;
    if (!(i in slots)) slots[i] = typeof init === 'function' ? (init as () => unknown)() : init;
    return [slots[i], (v: unknown) => { slots[i] = typeof v === 'function' ? (v as (o: unknown) => unknown)(slots[i]) : v; }];
  };
  const step = () => {
    at = 0;
    internals.H = { useState };
    try {
      return useInterviewStep(SPEC);
    } finally {
      internals.H = null;
    }
  };
  const param = (id: string): Param => step().rack.params.find((p: Param) => p.id === id);
  const reads = (k: string): string => step().rack.bezel.find((b: { k: string }) => b.k === k).v;
  const everything = () => JSON.stringify([step().rack.bezel, step().well]);
  return { param, reads, everything };
}

test('MIC AT 0, cardioid, the guest speaking: LOUD SOURCE reads 0 dB, never −0 dB', () => {
  const s = learner();
  s.param('pattern').onSelect!('cardioid');
  s.param('at').onChange!(0);
  assert.equal(s.reads('LOUD SOURCE'), '0 dB');
  assert.doesNotMatch(s.everything(), /[−-]0 dB/);
});

test('the shared place reads 0 dB over the other voice, not +0 dB; real levels keep their sign', () => {
  const s = learner();
  assert.equal(s.reads('OVER OTHER'), '0 dB');
  assert.doesNotMatch(s.everything(), /\+0 dB/);
  s.param('pattern').onSelect!('cardioid');
  assert.equal(s.reads('OVER OTHER'), '+9 dB');
  assert.equal(s.reads('LOUD SOURCE'), '−1 dB');
});
