/**
 * B13 and B12 module 5 step 2 (2026-11-05): the FADER lane promises −30 to +6 dB,
 * yet HeadroomDisplay never used s.fader, so the cap stood still and the bus
 * row never changed. The clip logic is right to stay upstream, so the fader
 * must move only its cap, a marker and the printed bus output.
 *
 * HeadroomArt.tsx is really rendered: transpiled with the repo's TypeScript
 * and run with stand-ins that record every Skia rectangle and colour.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as headroom from '../src/screens/lab/miking/lessons/shared/sports/headroom.ts';
import type { ChainSettings, EventId } from '../src/screens/lab/miking/lessons/shared/sports/headroom.ts';

const { HEADROOM_DEFAULTS, START_SETTINGS, fmtDb, readChain } = headroom;
const FILE = 'src/screens/lab/miking/lessons/shared/sports/HeadroomArt.tsx';
const nodeRequire = createRequire(import.meta.url);
const W = 355;
const H = 290;

type Rect = { x: number; y: number; w: number; h: number };
type Drawn = { rect: Rect | null; color?: string; gradient?: string[] };

function draw(s: ChainSettings, ev: EventId) {
  const drawn: Drawn[] = [];
  let a11y = '';
  const pass = (p: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, p.children);
  const anything = (): unknown => new Proxy(function () {}, { get: () => anything(), apply: () => anything() });
  const Skia = {
    XYWHRect: (x: number, y: number, w: number, h: number) => ({ x, y, w, h }),
    RRectXY: (r: Rect) => r,
    Path: { Make: () => ({ rect: null as Rect | null, addRRect(r: Rect) { this.rect = r; }, moveTo() {}, lineTo() {} }) },
  };
  const Path = (p: { path: { rect: Rect | null }; color?: string; children?: React.ReactElement<{ colors?: string[] }> }) => {
    drawn.push({ rect: p.path.rect, color: p.color, gradient: p.children?.props?.colors });
    return null;
  };
  const Canvas = (p: { accessibilityLabel: string; children?: React.ReactNode }) => {
    a11y = p.accessibilityLabel;
    return pass(p);
  };
  const modules: Record<string, unknown> = {
    'react-native': { StyleSheet: { create: (x: unknown) => x }, Text: (p: { children?: React.ReactNode }) => React.createElement('p', null, p.children), View: pass },
    '@shopify/react-native-skia': { Canvas, Circle: () => null, Group: pass, LinearGradient: () => null, Path, Skia, vec: (x: number, y: number) => ({ x, y }) },
    '../../../../../../theme/tokens': { colors: { textSecondary: '#999' }, fonts: { oswaldMedium: 'x' } },
    '../../../../../../theme/legibility': { fitValue: () => ({}) },
    '../../../../rack/stageAspect': { useStageTextScale: () => 1 },
    '../../../../../../features/tools/levelColor': { levelColorForDb: () => '#00ff00' },
    '../fieldmics/FieldMicArt': { ShotgunArt: () => null },
    './headroom.ts': headroom,
  };
  const req = (spec: string): unknown => (spec === 'react' || spec.startsWith('react/') ? nodeRequire(spec) : (modules[spec] ?? anything()));
  const js = ts.transpileModule(readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} as { HeadroomDisplay: React.ComponentType<Record<string, unknown>> } };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  const html = renderToStaticMarkup(React.createElement(mod.exports.HeadroomDisplay, { w: W, h: H, s, ev, a11y: 'The chain.' }));
  const labels = [...html.matchAll(/<p>(.*?)<\/p>/g)].map((m) => m[1]);
  return { drawn, labels, a11y };
}

const CAP = ['#e0e3e8', '#8b9099'];
const capOf = (d: Drawn[]): Rect => {
  const c = d.find((p) => p.gradient?.join() === CAP.join());
  assert.ok(c?.rect, 'the fader cap is drawn');
  return c.rect;
};
const SAFE: ChainSettings = { tx: -24, pre: 0, fader: 0 };
const at = (fader: number, base: ChainSettings = SAFE) => ({ ...base, fader });
const bars = (d: Drawn[]) => d.filter((p) => p.color === '#00ff00' || p.color === '#ff5a48').map((p) => p.rect);

describe('the output fader, seen on the headroom chain', () => {
  const { min, max } = HEADROOM_DEFAULTS.fader;

  it('moves the cap through its slot: maximum at the top, minimum at the bottom', () => {
    const top = capOf(draw(at(max), 'loud').drawn);
    const unity = capOf(draw(at(0), 'loud').drawn);
    const bottom = capOf(draw(at(min), 'loud').drawn);
    assert.ok(top.y < unity.y && unity.y < bottom.y, `cap ${top.y} < ${unity.y} < ${bottom.y}`);
    assert.ok(bottom.y - top.y >= 20, `a phone must show it: ${bottom.y - top.y} px of travel`);
    const rowH = (H - 12) / 6;
    const rowTop = 6 + 5 * rowH;
    assert.ok(top.y >= rowTop, 'the cap stays in the bus row');
    assert.ok(bottom.y + bottom.h <= rowTop + rowH, 'the cap stays in the bus row');
    // Evenly: 0 dB sits a sixth of the way down the 36 dB slot.
    assert.ok(Math.abs((unity.y - top.y) / (bottom.y - top.y) - 6 / 36) < 1e-6);
  });

  it('prints the bus output after the fader on the bus row, clipped or not', () => {
    for (const fader of [min, -12, 0, max]) {
      const clean = draw(at(fader), 'clap');
      const want = fmtDb(readChain(at(fader), 'clap').busOut);
      assert.ok(clean.labels.at(-1)!.endsWith(want), `${clean.labels.at(-1)} ends ${want}`);
      assert.ok(clean.a11y.includes(want), 'a screen reader hears it too');
      const clipped = draw(at(fader, START_SETTINGS), 'loud');
      const wantC = fmtDb(readChain(at(fader, START_SETTINGS), 'loud').busOut);
      assert.ok(clipped.labels.at(-1)!.includes(wantC), clipped.labels.at(-1));
      assert.ok(clipped.labels.at(-1)!.includes('CLIPPED'), 'the clip still shows');
    }
  });

  it('slides a marker on the bus meter by the fader move, on the meter’s own scale', () => {
    const mark = (f: number) => {
      const m = draw(at(f), 'loud').drawn.find((p) => p.color === '#6fd3ff');
      assert.ok(m?.rect, 'the bus output marker is drawn');
      return m.rect.x;
    };
    const mx = 10 + Math.min(96, W * 0.24) + 8;
    const mw = Math.max(40, W - mx - Math.min(110, W * 0.3) - 14);
    assert.ok(Math.abs(mark(0) - mark(-20) - (mw * 20) / 40) < 1e-6, 'twenty dB is half the 40 dB meter');
  });

  it('changes no clip: every other mark and word holds still when only the fader moves', () => {
    for (const base of [SAFE, START_SETTINGS]) {
      for (const ev of ['clap', 'loud', 'event'] as EventId[]) {
        const a = draw(at(max, base), ev);
        const b = draw(at(min, base), ev);
        assert.deepEqual(a.labels.slice(0, -1), b.labels.slice(0, -1));
        assert.deepEqual(bars(a.drawn), bars(b.drawn), 'the meters read upstream of the fader');
        assert.equal(readChain(at(max, base), ev).firstOver, readChain(at(min, base), ev).firstOver);
      }
    }
  });
});
