/**
 * Digital Module 3 DITHER and Module 7 OS RATE (2026-11-05): both trays are
 * sticky and say to A/B, yet each pick only redrew a chart down the well, under
 * the open tray, so the pinned display never answered. A pick must now put that
 * chart on the glass, say how to return, and the well chart must stay.
 *
 * The real module files are transpiled and run with stand-ins: the useState
 * slots persist between renders, the rack's dock params are pressed as a
 * student would, and stage.render(w, h) is read for what the glass shows.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import ts from 'typescript';

const DIR = 'src/screens/lab/digital/';
const nodeRequire = createRequire(import.meta.url);
const W = 355;
const H = 250;

type El = { type: unknown; props: Record<string, unknown> };
type Param = {
  id: string;
  onSelect?: (id: string) => void;
  onChange?: (v: number) => void;
  onToggle?: () => void;
  render?: () => unknown;
};
type Stage = { badge: string; bezel: { k: string; v: string }[]; render: (w: number, h: number) => unknown; onGuide: () => void };

const anything = (): unknown => new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : anything()), apply: () => anything() });

function load(file: string, extra: Record<string, unknown>) {
  const js = ts.transpileModule(readFileSync(DIR + file, 'utf8').replace(/\r\n/g, '\n'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const slots: unknown[] = [];
  let at = 0;
  const react = {
    useState: (init: unknown) => {
      const i = at++;
      if (!(i in slots)) slots[i] = typeof init === 'function' ? (init as () => unknown)() : init;
      return [slots[i], (v: unknown) => { slots[i] = typeof v === 'function' ? (v as (o: unknown) => unknown)(slots[i]) : v; }];
    },
    useMemo: (f: () => unknown) => f(),
    useRef: (v: unknown) => ({ current: v }),
    useEffect: () => {},
  };
  const req = (id: string) => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return nodeRequire(id);
    if (id in extra) return extra[id];
    return anything();
  };
  const mod = { exports: {} as Record<string, (p: unknown) => El> };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  return { exports: mod.exports, reset: () => { at = 0; } };
}

/** Every element in a tree, depth first. */
function walk(node: unknown, out: El[] = []): El[] {
  if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (node && typeof node === 'object' && 'props' in node) {
    out.push(node as El);
    walk((node as El).props.children, out);
  }
  return out;
}
const textOf = (node: unknown) =>
  walk(node)
    .flatMap((e) => [e.props.children].flat())
    .filter((c) => typeof c === 'string')
    .join(' ');

const stub = (name: string) => Object.defineProperty(() => null, 'name', { value: name });
const RN = { StyleSheet: { create: <T,>(x: T) => x }, View: stub('View'), Text: stub('Text'), Pressable: stub('Pressable') };

function harness(file: string, moduleName: string, gate: string, charts: string[]) {
  const viz = Object.fromEntries(charts.map((c) => [c, stub(c)]));
  const { exports, reset } = load(file, {
    'react-native': RN,
    '../skiaGate': { [gate]: () => viz },
  });
  const help: string[] = [];
  const render = () => {
    reset();
    return exports[moduleName]({ width: W, focused: true, help: (k: string) => help.push(k) });
  };
  const rack = () => render().props as { params: Param[]; stage: Stage; children: unknown };
  const param = (id: string) => {
    const p = rack().params.find((q) => q.id === id);
    assert.ok(p, `dock key ${id}`);
    return p;
  };
  const glass = () => walk(rack().stage.render(W, H));
  const chart = (name: string) => glass().find((e) => e.type === viz[name]);
  const well = (name: string) => walk(rack().children).find((e) => e.type === viz[name]);
  return { rack, param, glass, chart, well, help };
}

describe('Module 3: DITHER answers on the pinned display', () => {
  const lab = () => harness('modules/modQuant.tsx', 'QuantModule', 'requireVizQuant', ['QuantView', 'DitherView', 'BitDotStrip', 'InspectStripView']);

  it('starts on the steps, and a dither pick puts that dither on the glass', () => {
    const t = lab();
    assert.ok(t.chart('QuantView'));
    assert.equal(t.chart('DitherView'), undefined);
    t.param('dither').onSelect!('tpdf');
    assert.equal(t.chart('QuantView'), undefined);
    assert.equal(t.chart('DitherView')?.props.mode, 'tpdf');
    t.param('dither').onSelect!('shaped');
    assert.equal(t.chart('DitherView')?.props.mode, 'shaped');
  });

  it('fits the glass, names the way back, and reads out the chart it shows', () => {
    const t = lab();
    t.param('dither').onSelect!('rpdf');
    const c = t.chart('DitherView')!;
    assert.ok((c.props.height as number) <= H - 14);
    assert.ok((c.props.width as number) <= W);
    assert.match(textOf(t.rack().stage.render(W, H)), /LEVEL, BITS or ERROR returns/);
    const bezel = t.rack().stage.bezel;
    assert.deepEqual(bezel.find((b) => b.k === 'DITHER')?.v, 'RPDF');
    assert.equal(bezel.find((b) => b.k === 'BITS'), undefined, 'BITS does not drive this chart');
    assert.match(t.rack().stage.badge, /REAL DITHER MATH/);
    t.rack().stage.onGuide();
    assert.deepEqual(t.help, ['dither']);
  });

  it('LEVEL, BITS and ERROR each bring the steps back', () => {
    const back: [string, (t: ReturnType<typeof lab>) => void][] = [
      ['level', (t) => t.param('level').onChange!(0.5)],
      ['bits', (t) => t.param('bits').onSelect!('8')],
      ['error', (t) => t.param('error').onToggle!()],
    ];
    for (const [name, press] of back) {
      const t = lab();
      t.param('dither').onSelect!('tpdf');
      press(t);
      assert.ok(t.chart('QuantView'), name);
      assert.equal(t.chart('DitherView'), undefined, name);
    }
  });

  it('keeps the well chart in step', () => {
    const t = lab();
    assert.equal(t.well('DitherView')?.props.mode, 'none');
    t.param('dither').onSelect!('tpdf');
    assert.equal(t.well('DitherView')?.props.mode, 'tpdf');
  });
});

describe('Module 7: OS RATE answers on the pinned display', () => {
  const lab = () => harness('modules/modDac.tsx', 'DacModule', 'requireVizDac', ['ReconstructionView', 'ImagesView', 'IspView', 'DacChainStrip']);

  it('a rate pick puts that rate on the glass', () => {
    const t = lab();
    assert.ok(t.chart('ReconstructionView'));
    t.param('os').onSelect!('8');
    assert.equal(t.chart('ReconstructionView'), undefined);
    assert.equal(t.chart('ImagesView')?.props.os, 8);
    t.param('os').onSelect!('2');
    assert.equal(t.chart('ImagesView')?.props.os, 2);
  });

  it('fits the glass, names the way back, and reads out the first image', () => {
    const t = lab();
    t.param('os').onSelect!('4');
    assert.ok((t.chart('ImagesView')!.props.height as number) <= H - 14);
    assert.match(textOf(t.rack().stage.render(W, H)), /MODE or LAYERS returns/);
    assert.equal(t.rack().stage.bezel.find((b) => b.k === '1ST IMAGE')?.v, '192 kHz');
    assert.match(t.rack().stage.badge, /ILLUSTRATIVE SPECTRA/);
    t.rack().stage.onGuide();
    assert.deepEqual(t.help, ['oversampling']);
  });

  it('MODE, LAYERS and the ISP keys still take the glass back', () => {
    const t = lab();
    t.param('os').onSelect!('8');
    t.param('mode').onSelect!('xray');
    assert.ok(t.chart('ReconstructionView'));

    t.param('os').onSelect!('8');
    const chips = walk(t.param('layers').render!());
    const chip = chips.find((e) => e.props.label === 'SAMPLES');
    (chip!.props.onPress as () => void)();
    assert.ok(t.chart('ReconstructionView'));

    t.param('os').onSelect!('8');
    t.param('ispf').onChange!(0.2);
    assert.ok(t.chart('IspView'));
    assert.equal(t.chart('ImagesView'), undefined);
  });

  it('keeps the well chart in step', () => {
    const t = lab();
    t.param('os').onSelect!('8');
    assert.equal(t.well('ImagesView')?.props.os, 8);
  });
});

describe('DitherView takes a height', () => {
  const path = (): unknown => new Proxy({}, { get: () => () => path() });
  const { exports, reset } = load('vizQuant.tsx', {
    'react-native': { ...RN, PanResponder: { create: () => ({ panHandlers: {} }) } },
    '@shopify/react-native-skia': new Proxy({ Skia: { Path: { Make: path } } }, { get: (t, k) => (k === 'Skia' ? t.Skia : stub(String(k))) }),
  });
  const strips = (p: { width: number; mode: string; height?: number }) => {
    reset();
    const root = exports.DitherView(p);
    return {
      gap: (root.props.style as { gap: number }).gap,
      heights: walk(root).filter((e) => typeof e.props.label === 'string').map((e) => e.props.height as number),
    };
  };

  it('leaves the well strips exactly as they were', () => {
    assert.deepEqual(strips({ width: W, mode: 'none' }), { gap: 8, heights: [88, 44, 42, 42] });
  });

  it('fits all four strips and their labels on the glass, at both stage sizes', () => {
    for (const glass of [232, 182]) {
      const { gap, heights } = strips({ width: W, mode: 'tpdf', height: glass });
      assert.equal(heights.length, 4);
      const LABEL_ROW = 13 + 3;
      const used = heights.reduce((a, b) => a + b, 0) + 4 * LABEL_ROW + 3 * gap;
      assert.ok(used <= glass + 2, `${used} of ${glass}`);
      assert.ok(used >= glass - 4, `${used} of ${glass}: the glass is used`);
      assert.ok(Math.min(...heights) >= 20, `every strip stays readable: ${heights}`);
      assert.ok(heights[0] > heights[1], 'the waveform stays the biggest strip');
    }
  });
});
