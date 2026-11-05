/**
 * Sound Systems ROUTE (2026-11-05): three dock controls whose result the glass
 * did not show. MC → AUX 7 wrote a send no column drew; BAND DCA was the first
 * key on the Subgroups page and moved nothing until a channel hung on it; PRE
 * on Four monitor mixes showed only on the goal line and the bezel.
 *
 * pagesRoute.tsx, ConsolePanel.tsx and consoleDock.tsx are really rendered:
 * transpiled with the repo's TypeScript over the real console engine, with
 * stand-ins that record every word the glass prints. The dock's own controls
 * are then worked through their onChange / onToggle and the page redrawn.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as engine from '../src/features/soundsystems/console.ts';
import * as taper from '../src/features/soundsystems/faderTaper.ts';

type Cs = ReturnType<typeof engine.bandConsole>;
type Param = { id: string; locked?: string; autoBind?: boolean; onChange?: (p: number) => void; onToggle?: () => void };
type Rack = { params: Param[]; stage: (w: number, h: number) => React.ReactNode };
type Goal = { label: string; hit: boolean };

const DIR = process.env.G3_DIR ?? 'src/screens/lab/soundsystems';
const nodeRequire = createRequire(import.meta.url);
const none = () => null;
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const transpile = (src: string) => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const anyModule = (extra: Record<string, unknown> = {}) => new Proxy({ __esModule: true, ...extra } as Record<string | symbol, unknown>, { get: (t, k) => (k in t ? t[k] : none) });
const names = new Proxy({}, { get: (_t, k) => String(k) });

/** One page on a phone-sized glass, with a console the test can work. */
function openPage(index: number, start?: Cs) {
  const words: string[] = [];
  const box: { cs?: Cs; rack?: Rack; goals: Goal[] } = { cs: start, goals: [] };
  const pass = (p: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, p.children);
  const Text = (p: { children?: React.ReactNode }) => {
    words.push(React.Children.toArray(p.children).join(''));
    return null;
  };
  const usePageMemory = (_name: string, init: Cs | (() => Cs)) => {
    box.cs ??= typeof init === 'function' ? init() : init;
    const set = (next: Cs | ((c: Cs) => Cs)) => {
      box.cs = typeof next === 'function' ? next(box.cs as Cs) : next;
    };
    return [box.cs, set];
  };
  const modules: [string, unknown][] = [
    ['features/soundsystems/console', engine],
    ['features/soundsystems/faderTaper', taper],
    ['theme/tokens', { colors: names, fonts: names }],
    ['theme/legibility', { fitValue: () => ({}) }],
    ['features/tools/levelColor', { LOUDNESS_STOPS: [], levelColorForDb: () => '#c' }],
    ['art/motion', { usePeakHold: () => ({ value: 0 }), useProgrammeLevel: () => ({ value: 0 }) }],
    ['./motion', { usePeakHold: () => ({ value: 0 }), useProgrammeLevel: () => ({ value: 0 }) }],
    ['./pageMemory', { usePageMemory }],
    ['./rackLayout', anyModule({
      SoundSystemsRackLayout: ({ rack, children }: { rack: Rack; children?: React.ReactNode }) => {
        box.rack = rack;
        return React.createElement(React.Fragment, null, rack.stage(344, 196), children);
      },
    })],
    ['./bits', anyModule({
      GoalChips: ({ goals }: { goals: Goal[] }) => {
        box.goals = goals;
        return null;
      },
      useVisitGoals: () => [],
    })],
  ];
  const cache: Record<string, unknown> = {};
  const local = (file: string) => {
    if (cache[file]) return cache[file];
    const mod = { exports: {} as Record<string, unknown> };
    cache[file] = mod.exports;
    new Function('require', 'module', 'exports', transpile(read(file)))(req, mod, mod.exports);
    return mod.exports;
  };
  function req(spec: string): unknown {
    if (spec === 'react' || spec.startsWith('react/')) return nodeRequire(spec);
    if (spec === 'react-native') return { StyleSheet: { create: (x: unknown) => x }, Text, View: pass, Pressable: pass, ScrollView: pass };
    if (spec === 'react-native-reanimated') return { __esModule: true, default: { createAnimatedComponent: () => none }, useAnimatedProps: () => ({}), useAnimatedStyle: () => ({}) };
    if (spec === './art/ConsolePanel') return local(`${DIR}/art/ConsolePanel.tsx`);
    if (spec === './consoleDock') return local('src/screens/lab/soundsystems/consoleDock.tsx');
    const hit = modules.find(([k]) => spec.endsWith(k));
    return hit ? hit[1] : anyModule();
  }
  const route = local(`${DIR}/pagesRoute.tsx`) as { SS_ROUTE_PAGES: { Component: React.ComponentType<{ ctx: unknown }> }[] };
  const draw = () => {
    words.length = 0;
    renderToStaticMarkup(React.createElement(route.SS_ROUTE_PAGES[index].Component, { ctx: { isDone: true, markDone: none } }));
    return [...words];
  };
  draw();
  return {
    box,
    draw,
    param: (id: string) => {
      const p = box.rack?.params.find((x) => x.id === id);
      assert.ok(p, `dock key ${id}`);
      return p;
    },
  };
}

const PREPOST = 1;
const MONITORS = 3;
const GROUPS = 4;
const MATRIX = 6;
const after = (ws: string[], word: string, n: number) => {
  const i = ws.indexOf(word);
  return i < 0 ? [] : ws.slice(i + 1, i + 1 + n);
};

describe('MC → AUX 7 moves something on the glass', () => {
  it('draws Aux 7 beside the three matrices, and the fader lands in it', () => {
    const page = openPage(MATRIX);
    const before = page.draw();
    assert.ok(before.includes('AUX 7 · ANNOUNCE'), 'the column is on the stage');
    assert.ok(!before.includes('Announce'), 'nothing on it yet');
    page.param('mc7').onChange?.(taper.dbToPos(-6, -60, 6));
    const moved = page.draw();
    assert.deepEqual(after(moved, 'Announce', 1), ['-6'], 'the fader shows with no matrix taking Aux 7');
    page.param('mc7').onChange?.(taper.dbToPos(3, -60, 6));
    assert.deepEqual(after(page.draw(), 'Announce', 1), ['+3'], 'riding it moves the row');
  });
});

describe('BAND DCA says why it waits', () => {
  it('is locked with a plain reason while no channel is on BAND', () => {
    const p = openPage(GROUPS).param('dca');
    assert.match(p.locked ?? '', /CONSOLE/);
    assert.equal(p.autoBind, true, 'binds the lane the moment it unlocks');
  });

  it('unlocks for any channel, and locks again when the last one leaves', () => {
    const page = openPage(GROUPS);
    page.box.cs = engine.setChannel(page.box.cs as Cs, 'bass', { dca: 'dca-band' });
    page.draw();
    assert.equal(page.param('dca').locked, undefined);
    page.box.cs = engine.setChannel(page.box.cs as Cs, 'bass', { dca: null });
    page.draw();
    assert.ok(page.param('dca').locked);
  });

  it('a member on another DCA does not count', () => {
    const page = openPage(GROUPS);
    const other = (page.box.cs as Cs).dcas.find((d) => d.id !== 'dca-band');
    assert.ok(other);
    page.box.cs = engine.setChannel(page.box.cs as Cs, 'vox', { dca: other.id });
    page.draw();
    assert.ok(page.param('dca').locked);
  });

  it('keeps the goal: the unlocked fader still proves main drops and the wedge does not', () => {
    const page = openPage(GROUPS);
    let cs = page.box.cs as Cs;
    for (const id of ['kick', 'snare', 'oh']) cs = engine.setChannel(cs, id, { subgroup: 'sub-drums', toMain: false });
    page.box.cs = engine.setChannel(cs, 'kick', { dca: 'dca-band' });
    page.draw();
    assert.equal(page.box.goals[1].hit, false);
    page.param('dca').onChange?.(taper.dbToPos(-12, -60, 10));
    page.draw();
    assert.equal((page.box.cs as Cs).dcas.find((d) => d.id === 'dca-band')?.levelDb, -12);
    assert.deepEqual(page.box.goals.map((g) => g.hit), [true, true]);
  });
});

describe('PRE shows on the wedge row', () => {
  it('the first tap shows, even before the send is brought up', () => {
    const page = openPage(MONITORS);
    assert.ok(!page.draw().includes('Lead vocal'));
    page.param('pre').onToggle?.();
    assert.deepEqual(after(page.draw(), 'Lead vocal', 2), ['OFF', 'PRE']);
  });

  it('flips PRE and POST on the matching row of the matching wedge', () => {
    const page = openPage(MONITORS, engine.setSend(engine.setSend(engine.bandConsole(), 'vox', 'aux1', { db: -6, tap: 'post' }), 'kick', 'aux2', { db: 0, tap: 'pre' }));
    assert.deepEqual(after(page.draw(), 'Lead vocal', 2), ['-6', 'POST']);
    page.param('pre').onToggle?.();
    const on = page.draw();
    assert.deepEqual(after(on, 'Lead vocal', 2), ['-6', 'PRE']);
    assert.deepEqual(after(on, 'Kick', 2), ['0', 'PRE'], 'the other wedge keeps its own');
    page.param('pre').onToggle?.();
    assert.deepEqual(after(page.draw(), 'Lead vocal', 2), ['-6', 'POST']);
  });

  it('adds nothing for a user of BusBank that gives no tags', () => {
    const ws = openPage(PREPOST).draw();
    assert.ok(ws.includes('Lead vocal'));
    assert.ok(!ws.includes('PRE') && !ws.includes('POST'));
    const groups = openPage(GROUPS).draw();
    assert.ok(!groups.includes('PRE') && !groups.includes('POST'));
  });
});
