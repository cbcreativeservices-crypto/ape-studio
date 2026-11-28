/**
 * Stage Plot and Channel Designer — the TOP-VIEW ART of the seven instrument
 * kinds (stage/topArtInstruments.tsx; must-do D60; owner 2026-11-12: "create
 * new art for each, do not use simple line drawings").
 *
 * The art is drawn in code, so a node test can hold what a band relies on:
 *   • every instrument kind has its drawing, and the drawing stays inside the
 *     kind's print-symbol footprint (the selection frame, the name and the
 *     touch area all use that box) while filling most of it;
 *   • each drawing has its drop shadow, and is a pure drawing: no text, no
 *     image file, no state;
 *   • each instrument is the right way round for a player who stands UPSTAGE
 *     of it and faces the audience (the player's right is stage right, -x):
 *     the tumba and the bongó's hembra on the player's right, the timbales'
 *     hembra on the left with the bells on the audience's side, the piano's
 *     88 keys and the guitar's head upstage, the trumpet's bell downstage.
 *
 * The art module is compiled by the house TSX loader (the native drawing
 * package becomes a stand-in), then each component is called and its real
 * shapes are measured, transforms included.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const ART = 'src/screens/lab/stageplot/stage/topArtInstruments.tsx';
const { TOP_ART_INSTRUMENTS, TOP_ART_INSTRUMENT_EXTENT } = R(await import('../src/screens/lab/stageplot/stage/topArtInstruments.tsx'));
const { spSymbol } = R(await import('../src/features/stageplot/spSymbols.ts'));

const KINDS = ['percussion', 'congas', 'timbales', 'bongo', 'piano', 'acoustic-guitar', 'horn'] as const;
type Kind = (typeof KINDS)[number];
const text = readFileSync(join(process.cwd(), ART), 'utf8').replace(/\r\n/g, '\n');
const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

/* ── measuring a drawing: every shape, with the transforms above it ── */

/** x' = a·x + c·y + e, y' = b·x + d·y + f. */
type Mat = [number, number, number, number, number, number];
const UNIT: Mat = [1, 0, 0, 1, 0, 0];
const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const at = (m: Mat, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/** `translate(x y)` and `rotate(deg)` only: the art uses nothing else. */
function transformOf(t: unknown): Mat {
  let m = UNIT;
  for (const [, fn, args] of String(t ?? '').matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args.trim().split(/[\s,]+/).map(Number);
    if (fn === 'translate') m = mul(m, [1, 0, 0, 1, a[0], a[1] ?? 0]);
    else if (fn === 'rotate' && a.length === 1) {
      const r = (a[0] * Math.PI) / 180;
      m = mul(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
    } else throw new Error(`a transform this test cannot measure: ${fn}(${args})`);
  }
  return m;
}

/** The points of a path (absolute M L H V C A Z only), each curve by its
 *  control points and each arc by the box round its ends: never less than
 *  the true outline. */
function pathPoints(d: string): [number, number][] {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const pts: [number, number][] = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i]!)) cmd = tokens[i++]!;
    if (cmd === 'Z') continue;
    if (cmd === 'M' || cmd === 'L') {
      x = num();
      y = num();
      pts.push([x, y]);
    } else if (cmd === 'H') {
      x = num();
      pts.push([x, y]);
    } else if (cmd === 'V') {
      y = num();
      pts.push([x, y]);
    } else if (cmd === 'C') {
      for (let k = 0; k < 3; k++) {
        x = num();
        y = num();
        pts.push([x, y]);
      }
    } else if (cmd === 'A') {
      const rx = num();
      const ry = num();
      i += 3;
      for (const [px, py] of [[x, y], [num(), num()]] as [number, number][]) {
        pts.push([px - rx, py - ry], [px + rx, py + ry], [px - rx, py + ry], [px + rx, py - ry]);
        x = px;
        y = py;
      }
    } else throw new Error(`a path command this test cannot measure: ${cmd} in ${d.slice(0, 40)}`);
  }
  return pts;
}

type Mark = {
  shape: 'circle' | 'ellipse' | 'rect' | 'line' | 'path';
  fill: string;
  stroke: string;
  /** Radius of a circle; 0 for the rest. */
  r: number;
  d: string;
  shadow: boolean;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cx: number;
  cy: number;
};
type El = { type: unknown; props: Record<string, unknown> & { children?: unknown } };
const STUB = (globalThis as { __mikingStub?: unknown }).__mikingStub;

function marksOf(node: unknown, m: Mat = UNIT, out: Mark[] = []): Mark[] {
  if (node == null || typeof node === 'boolean') return out;
  if (Array.isArray(node)) {
    for (const n of node) marksOf(n, m, out);
    return out;
  }
  const el = node as El;
  if (typeof el.type === 'function' && el.type !== STUB) return marksOf((el.type as (p: unknown) => unknown)(el.props), m, out);
  const p = el.props ?? {};
  const n = (k: string) => Number(p[k] ?? 0);
  const fill = String(p.fill ?? '');
  const stroke = String(p.stroke ?? '');
  let shape: Mark['shape'];
  let pts: [number, number][];
  let pad = stroke && stroke !== 'none' ? Number(p.strokeWidth ?? 1) / 2 : 0;
  if ('d' in p) {
    shape = 'path';
    pts = pathPoints(String(p.d));
  } else if ('x1' in p) {
    shape = 'line';
    pts = [[n('x1'), n('y1')], [n('x2'), n('y2')]];
  } else if ('width' in p) {
    shape = 'rect';
    pts = [[n('x'), n('y')], [n('x') + n('width'), n('y')], [n('x'), n('y') + n('height')], [n('x') + n('width'), n('y') + n('height')]];
  } else if ('r' in p) {
    shape = 'circle';
    pts = [[n('cx'), n('cy')]];
    pad += n('r');
  } else if ('rx' in p) {
    shape = 'ellipse';
    pts = [[n('cx'), n('cy')]];
    pad += Math.max(n('rx'), n('ry'));
  } else return marksOf(p.children, mul(m, transformOf(p.transform)), out);
  const w = pts.map(([x, y]) => at(m, x, y));
  const xs = w.map((q) => q[0]);
  const ys = w.map((q) => q[1]);
  out.push({
    shape,
    fill,
    stroke,
    r: shape === 'circle' ? n('r') : 0,
    d: String(p.d ?? ''),
    shadow: [fill, stroke].some((c) => /^rgba\(0,\s*0,\s*0,/.test(c)),
    x0: Math.min(...xs) - pad,
    x1: Math.max(...xs) + pad,
    y0: Math.min(...ys) - pad,
    y1: Math.max(...ys) + pad,
    cx: xs.reduce((a, b) => a + b, 0) / xs.length,
    cy: ys.reduce((a, b) => a + b, 0) / ys.length,
  });
  return out;
}

const drawn = (kind: Kind): Mark[] => marksOf((TOP_ART_INSTRUMENTS[kind] as () => unknown)());
const solid = (kind: Kind): Mark[] => drawn(kind).filter((k) => !k.shadow);
const box = (ms: Mark[]) => ({ x0: Math.min(...ms.map((k) => k.x0)), x1: Math.max(...ms.map((k) => k.x1)), y0: Math.min(...ms.map((k) => k.y0)), y1: Math.max(...ms.map((k) => k.y1)) });
const foot = (kind: Kind) => ({ hw: spSymbol(kind).w * 16, hh: spSymbol(kind).h * 16 });
const SKIN = '#dccfae';
const HEAD = '#e8e6dd';
const BELL = '#8f8c84';
/** The heads of a kind's drums: the big circles of that fill, largest first. */
const heads = (kind: Kind, fill: string, minR: number) => solid(kind).filter((k) => k.shape === 'circle' && k.fill === fill && k.r >= minR).sort((a, b) => b.r - a.r);

describe('the instruments have their own top-view art', () => {
  it('one drawing for each of the seven kinds, and no other', () => {
    assert.deepEqual(Object.keys(TOP_ART_INSTRUMENTS).sort(), [...KINDS].sort());
    assert.deepEqual(Object.keys(TOP_ART_INSTRUMENT_EXTENT).sort(), [...KINDS].sort());
    for (const k of KINDS) assert.equal(typeof TOP_ART_INSTRUMENTS[k], 'function', k);
  });

  it('a drawing is more than a symbol: many true parts, in more than one material', () => {
    for (const k of KINDS) {
      const ms = solid(k);
      assert.ok(ms.length >= 10, `${k}: ${ms.length} shapes`);
      const fills = new Set(ms.map((q) => q.fill).filter((f) => f && f !== 'none'));
      assert.ok(fills.size >= 3, `${k}: ${fills.size} fills`);
    }
  });
});

describe('each drawing keeps to its footprint', () => {
  for (const k of KINDS) {
    it(`${k}: inside the print symbol's box, and filling most of it`, () => {
      const f = foot(k);
      const b = box(solid(k));
      // inside the footprint, outlines included
      assert.ok(b.x0 >= -f.hw && b.x1 <= f.hw, `${k}: x ${b.x0.toFixed(2)}..${b.x1.toFixed(2)} in ±${f.hw}`);
      assert.ok(b.y0 >= -f.hh && b.y1 <= f.hh, `${k}: y ${b.y0.toFixed(2)}..${b.y1.toFixed(2)} in ±${f.hh}`);
      // the stated extent is the drawn one (outlines aside), and it fits too
      const e = TOP_ART_INSTRUMENT_EXTENT[k];
      assert.ok(e.hw <= f.hw && e.hh <= f.hh, `${k}: stated extent`);
      assert.ok(Math.abs(Math.max(-b.x0, b.x1) - e.hw) <= 0.5, `${k}: hw drawn ${Math.max(-b.x0, b.x1).toFixed(2)}, stated ${e.hw}`);
      assert.ok(Math.abs(Math.max(-b.y0, b.y1) - e.hh) <= 0.5, `${k}: hh drawn ${Math.max(-b.y0, b.y1).toFixed(2)}, stated ${e.hh}`);
      // centered, and the long side of the box is filled
      assert.ok(Math.abs(b.x0 + b.x1) <= 1.2 && Math.abs(b.y0 + b.y1) <= 1.2, `${k}: centered`);
      const long = f.hw >= f.hh ? (b.x1 - b.x0) / (2 * f.hw) : (b.y1 - b.y0) / (2 * f.hh);
      assert.ok(long >= 0.9, `${k}: fills ${(long * 100).toFixed(0)} % of its long side`);
    });
  }

  it('each has a drop shadow, drawn first and close under the object', () => {
    for (const k of KINDS) {
      const ms = drawn(k);
      assert.equal(ms[0]!.shadow, true, `${k}: the shadow is drawn first`);
      const sh = ms.filter((q) => q.fill === 'rgba(0,0,0,0.45)' || q.stroke === 'rgba(0,0,0,0.45)');
      assert.ok(sh.length >= 1, k);
      const f = foot(k);
      const b = box(sh);
      assert.ok(b.x1 <= f.hw + 1.5 && b.y1 <= f.hh + 1.5 && b.x0 >= -f.hw && b.y0 >= -f.hh, `${k}: the shadow stays by the object`);
    }
  });
});

describe('a pure drawing', () => {
  it('no text, no image file, no state, no animation', () => {
    assert.doesNotMatch(code, /<Text\b|SvgText|<TSpan\b/);
    assert.doesNotMatch(code, /\bImage\b|require\(|\.png|\.jpg|\.webp/);
    assert.doesNotMatch(code, /\buse[A-Z]\w*\s*\(/);
    assert.doesNotMatch(code, /Animated|reanimated|setState|setInterval|setTimeout/);
  });

  it('it imports the drawing package and its own contract, nothing else', () => {
    const from = [...code.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(from.sort(), ['./topArtTypes', 'react-native-svg']);
  });

  it('every component takes no props from the stage', () => {
    for (const k of KINDS) assert.equal((TOP_ART_INSTRUMENTS[k] as (...a: unknown[]) => unknown).length, 0, k);
  });
});

describe('each instrument is the right way round (the player upstage, facing the audience)', () => {
  it('congas: the larger tumba on the player’s right (stage right), the conga beside it', () => {
    const [tumba, conga] = heads('congas', SKIN, 4);
    assert.ok(tumba && conga && heads('congas', SKIN, 4).length === 2);
    assert.ok(tumba.r > conga.r);
    assert.ok(tumba.cx < 0 && conga.cx > 0);
    // the wooden belly shows as a ring round each head
    const bellies = solid('congas').filter((q) => q.shape === 'circle' && q.fill === '#7a4c2c');
    assert.equal(bellies.length, 2);
    for (const h of [tumba, conga]) assert.ok(bellies.some((q) => Math.abs(q.cx - h.cx) < 0.01 && q.r >= h.r + 1), 'belly wider than the head');
  });

  it('bongó: the larger hembra on the player’s right, the macho on the left, the block between', () => {
    const [hembra, macho] = heads('bongo', SKIN, 2.5);
    assert.ok(hembra && macho && hembra.r > macho.r);
    assert.ok(hembra.cx < 0 && macho.cx > 0);
    const block = solid('bongo').find((q) => q.shape === 'rect');
    assert.ok(block && block.cx > hembra.cx && block.cx < macho.cx);
  });

  it('timbales: the larger hembra on the player’s LEFT, the bells on the audience’s side', () => {
    const [hembra, macho] = heads('timbales', HEAD, 5);
    assert.ok(hembra && macho && hembra.r > macho.r);
    assert.ok(hembra.cx > 0 && macho.cx < 0, 'the reverse of the bongó');
    const bells = solid('timbales').filter((q) => q.shape === 'path' && q.fill === BELL).sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0));
    assert.equal(bells.length, 2);
    const [mambo, chacha] = bells;
    for (const b of bells) assert.ok(b.cy > hembra.cy, 'a bell is downstage of the drums’ centers');
    assert.ok(mambo!.cx < chacha!.cx, 'the long bell points to the player’s right, the small one to the left');
    assert.ok(mambo!.cx < macho.cx + macho.r && chacha!.cx > hembra.cx - hembra.r, 'each bell reaches over its own drum');
  });

  it('percussion: a table of hand instruments, every piece on the table', () => {
    const ms = solid('percussion');
    const table = ms[0]!;
    assert.equal(table.shape, 'rect');
    for (const q of ms) assert.ok(q.x0 >= table.x0 && q.x1 <= table.x1 && q.y0 >= table.y0 && q.y1 <= table.y1, `${q.shape} ${q.fill}`);
    assert.equal(ms.filter((q) => q.fill === HEAD && q.shape === 'circle').length, 1, 'the tambourine’s head');
    assert.equal(ms.filter((q) => q.shape === 'ellipse' && q.fill === '#b8935a').length, 2, 'two maracas');
    assert.equal(ms.filter((q) => q.fill === BELL).length, 1, 'one hand cowbell');
  });

  it('piano: 88 keys on the player’s side, the case behind them', () => {
    const ms = solid('piano');
    const count = (stroke: string) => (ms.find((q) => q.shape === 'path' && q.stroke === stroke)!.d.match(/M/g) ?? []).length;
    assert.equal(count('#7d7a70') + 1, 52, 'white keys');
    assert.equal(count('#121316'), 36, 'black keys');
    const keys = ms.find((q) => q.shape === 'rect' && q.fill === HEAD)!;
    assert.ok(keys.y1 < 0, 'the keys are upstage of the center, where the player sits');
    const lid = ms.filter((q) => q.shape === 'rect').sort((a, b) => (b.x1 - b.x0) * (b.y1 - b.y0) - (a.x1 - a.x0) * (a.y1 - a.y0))[0]!;
    assert.ok(lid.y0 > keys.y1 && lid.y1 > 9, 'the lid is downstage of the keys');
    // the black keys come in twos and threes: no black key after B or E
    assert.match(text, /'ACDFG'\.includes\('ABCDEFG'\[i % 7\]!\)/);
    // the bass is at the player's LEFT hand (+x): the lowest black key, A sharp,
    // is one white key in from that end; at the treble end (C, B, A) it is two
    const black = ms.find((q) => q.shape === 'path' && q.stroke === '#121316')!;
    const xs = [...black.d.matchAll(/M(-?[\d.]+)/g)].map((m) => Number(m[1]));
    const keyW = (keys.x1 - keys.x0) / 52;
    assert.ok(Math.abs(keys.x1 - Math.max(...xs) - keyW) < 0.01, 'bass end, stage left');
    assert.ok(Math.abs(Math.min(...xs) - keys.x0 - 2 * keyW) < 0.01, 'treble end, stage right');
  });

  it('acoustic instrument: the head upstage, the body downstage, twenty frets, six strings', () => {
    const ms = solid('acoustic-guitar');
    const body = ms.find((q) => q.shape === 'path' && q.fill === '#b8935a')!;
    const head = ms.find((q) => q.shape === 'path' && q.fill === '#221712')!;
    assert.ok(head.y1 < body.y0 && head.y0 < -13.5, 'the head is the upstage end');
    assert.ok(body.y1 > 13.5 && body.x1 - body.x0 > 10, 'the body is the downstage end');
    const hole = ms.find((q) => q.shape === 'circle' && q.fill === '#0b0a09')!;
    assert.ok(hole.cy > body.y0 && hole.cy < (body.y0 + body.y1) / 2, 'the soundhole is in the upper half of the body');
    assert.equal((ms.find((q) => q.shape === 'path' && q.stroke === '#b9b7ae')!.d.match(/M/g) ?? []).length, 20, 'frets');
    assert.equal((ms.find((q) => q.shape === 'path' && /^rgba\(235/.test(q.stroke))!.d.match(/M/g) ?? []).length, 6, 'strings');
    assert.equal(ms.filter((q) => q.shape === 'rect' && q.fill === '#c9c6bc').length, 6, 'tuner buttons');
  });

  it('horn: the bell toward the audience, the mouthpiece upstage, three valves, the lead pipe on the player’s right', () => {
    const ms = solid('horn');
    const b = box(ms);
    const flare = ms.find((q) => q.shape === 'path' && q.d.startsWith('M0.23'))!;
    assert.ok(Math.abs(flare.y1 - b.y1) < 0.3, 'the bell’s rim is the downstage end');
    assert.ok(flare.x1 - flare.x0 >= 4.5, 'the rim is the widest part');
    const mouthpiece = ms.find((q) => q.shape === 'path' && q.fill === '#c9c6bc')!;
    assert.ok(Math.abs(mouthpiece.y0 - b.y0) < 0.3, 'the mouthpiece is the upstage end');
    const buttons = ms.filter((q) => q.shape === 'circle' && q.fill === '#c9c6bc');
    assert.equal(buttons.length, 3);
    // the mouthpiece's pipe is on the player's right (-x) of the valves, the bell on the left
    for (const v of buttons) assert.ok(mouthpiece.cx < v.cx && v.cx < flare.cx + 0.01);
  });
});
