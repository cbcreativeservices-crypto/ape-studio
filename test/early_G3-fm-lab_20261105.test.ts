/**
 * FM Synth Lab: the FC key moves the picture (early-lab sweep, 2026-11-05).
 *
 * Renders the real screen with its neighbours stood in, presses the real FC,
 * RATIO and INDEX controls, then measures what the student sees on the glass.
 * The axis used to follow the carrier. fm is fc × ratio, so every stick landed
 * in the same place and a two-octave move drew nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const FILE = fileURLToPath(new URL('../src/screens/lab/FmLabScreen.tsx', import.meta.url));
const nodeRequire = createRequire(import.meta.url);
const W = 353; // the glass at a 375-wide phone
const H = 190;
const PAD = 14;
const GREEN = '#5bff85';
const RATIOS = ['0.5', '1', '1.41 ✳', '2', '3.5', '7'];

type Mark = Record<string, unknown>;
type Param = { id: string; onSelect?: (id: string) => void; onChange?: (v: number) => void };
const textOf = (n: unknown): string => (Array.isArray(n) ? n.map(textOf).join('') : n == null ? '' : String(n));

/** The real screen, with hook state kept here so a pressed control re-renders. */
function openLab() {
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
    './LabShell': {
      HeaderPlayButton: () => null,
      LabShell: (p: { rack: { params: Param[]; stage: { render: (w: number, h: number) => React.ReactNode } } }) => {
        params = p.rack.params;
        return React.createElement('div', null, p.rack.stage.render(W, H));
      },
    },
  };
  const req = (spec: string): unknown => {
    if (spec in modules) return modules[spec];
    if (spec.startsWith('react/')) return nodeRequire(spec);
    return anything();
  };
  const js = ts.transpileModule(readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n'), {
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
    const carrier = sticks.find((l) => l.stroke === GREEN);
    const text = (l: Mark) => textOf(l.children);
    const axisY = labels.find((m) => text(m) === 'Hz')?.y;
    return {
      sticks: sticks.map((l) => ({ x: Number(l.x1), top: Number(l.y2) })),
      stickXs: sticks.map((l) => Number(l.x1)),
      carrierX: carrier ? Number(carrier.x1) : NaN,
      ticks: labels.filter((l) => l.y === axisY).map(text),
      fcTag: labels.find((l) => text(l).startsWith('fc ')),
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

describe('FC moves the picture', () => {
  it('the same ratio and index at FC 110, 220 and 440 put the carrier in three places', () => {
    const lab = openLab();
    const low = lab.setFc(110).carrierX;
    const mid = lab.setFc(220).carrierX;
    const high = lab.setFc(440).carrierX;
    assert.ok(low < mid && mid < high, `the carrier walks right (${low}, ${mid}, ${high})`);
    const ratioOnGlass = (high - PAD) / (low - PAD);
    assert.ok(Math.abs(ratioOnGlass - 4) < 1e-6, `two octaves read as four times as far along (${ratioOnGlass})`);
  });

  it('the sticks spread with the carrier, so the sidebands move too', () => {
    const lab = openLab();
    const widest = (hz: number) => Math.max(...lab.setFc(hz).stickXs);
    assert.ok(widest(220) - widest(110) >= 30, 'one octave up: the top sideband travels');
    assert.ok(widest(440) - widest(220) >= 60, 'the next octave: it travels twice as far');
  });

  it('the axis numbers stay put while the sticks move, at every FC', () => {
    const lab = openLab();
    const at110 = lab.setFc(110).ticks;
    assert.ok(at110.length >= 3, 'a real axis');
    assert.deepEqual(lab.setFc(220).ticks, at110);
    assert.deepEqual(lab.setFc(440).ticks, at110);
  });

  it('every RATIO keeps the carrier moving at index 0, where only the carrier is drawn', () => {
    for (const r of RATIOS) {
      const lab = openLab();
      lab.setRatio(r);
      lab.setIndex(0);
      assert.ok(lab.setFc(440).carrierX - lab.setFc(110).carrierX >= 100, `ratio ${r}`);
    }
  });
});

describe('the picture stays honest and on the glass', () => {
  it('ratio 7, index 8 widens the axis and keeps every stick on the glass at every FC', () => {
    const lab = openLab();
    const narrow = lab.setFc(440).ticks;
    lab.setRatio('7');
    lab.setIndex(8);
    for (const hz of [110, 220, 440]) {
      const { stickXs } = lab.setFc(hz);
      assert.ok(stickXs.length > 5, 'a full spray of sticks');
      assert.ok(Math.min(...stickXs) >= PAD, `FC ${hz}: nothing past the left edge`);
      assert.ok(Math.max(...stickXs) <= W - PAD, `FC ${hz}: nothing past the right edge`);
    }
    assert.notDeepEqual(lab.paint().ticks, narrow, 'the axis widened to fit');
  });

  it('every ratio and index step keeps every stick on the glass at every FC', () => {
    for (const r of RATIOS) {
      for (const i of [0, 1, 2.4, 4, 8]) {
        const lab = openLab();
        lab.setRatio(r);
        lab.setIndex(i);
        for (const hz of [110, 220, 440]) {
          assert.ok(Math.max(...lab.setFc(hz).stickXs) <= W - PAD, `ratio ${r}, I ${i}, FC ${hz}`);
        }
      }
    }
  });

  it('the fc tag stays whole at the lowest carrier on the widest axis', () => {
    const lab = openLab();
    lab.setRatio('7');
    lab.setIndex(8);
    const tag = lab.setFc(110).fcTag;
    assert.ok(tag, 'the tag is drawn');
    assert.equal(textOf(tag.children), 'fc 110');
    const halfWidth = (6 * 11 * 0.6) / 2; // six characters of 11-pt mono
    assert.ok(Number(tag.x) - halfWidth >= 0, `the tag starts on the glass (x ${tag.x})`);
  });

  it('no stick runs through the fc tag, however crowded the low carrier gets', () => {
    const halfWidth = (6 * 11 * 0.6) / 2;
    for (const r of RATIOS) {
      const lab = openLab();
      lab.setRatio(r);
      lab.setIndex(8);
      const { sticks, fcTag } = lab.setFc(110);
      assert.ok(fcTag, 'the tag is drawn');
      for (const s of sticks) {
        if (Math.abs(s.x - Number(fcTag.x)) <= halfWidth) {
          assert.ok(s.top > Number(fcTag.y), `ratio ${r}: the stick at x ${s.x} stops under the tag`);
        }
      }
    }
  });

  it('FC 440 at the opening ratio and index keeps the picture it always had', () => {
    const lab = openLab();
    const top = 440 + 5 * 880; // J_5(2) is the last stick drawn
    const expected = PAD + (440 / (top * 1.15)) * (W - 2 * PAD);
    assert.ok(Math.abs(lab.setFc(440).carrierX - expected) < 1e-6);
  });
});
