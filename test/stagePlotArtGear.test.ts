/**
 * Stage Plot and Channel Designer — the TOP-VIEW ART for equipment and
 * furniture (must-do D60; owner 2026-11-12: "create new art for each, do not
 * use simple line drawings"): a playback rig, in-ear monitor equipment, a
 * drum fill, a sidefill, an equipment rack, a power location, a chair, a
 * music stand (stage/topArtGear.tsx).
 *
 * A .tsx component cannot be imported under plain node type stripping, so
 * the art file is read as text. What is checked for each kind:
 *   • the map has it, under its kind id, and the stage draws from the map;
 *   • the numbers it is drawn to keep it inside the kind's print-symbol
 *     footprint (the box the stage frames, names and touches), outline
 *     included, and it fills most of that box;
 *   • its component draws to those numbers, and draws a shadow first;
 *   • it is a pure drawing: no text, no image, no file, no hook, no state.
 *   • nothing drawn for a power location states a voltage or a rating.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { spSymbol } from '../src/features/stageplot/spSymbols.ts';
import type { SpObjectKind } from '../src/features/stageplot/spTypes.ts';
import { TOP_ART_UNITS } from '../src/screens/lab/stageplot/stage/topArtTypes.ts';

const ROOT = process.cwd();
const FILE = 'src/screens/lab/stageplot/stage/topArtGear.tsx';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

/** Every kind this file draws, with the component that draws it. */
const KINDS: readonly (readonly [SpObjectKind, string])[] = [
  ['playback', 'PlaybackTop'],
  ['iem', 'IemTop'],
  ['drum-fill', 'DrumFillTop'],
  ['sidefill', 'SidefillTop'],
  ['rack', 'RackTop'],
  ['power', 'PowerTop'],
  ['chair', 'ChairTop'],
  ['music-stand', 'MusicStandTop'],
];

const src = code(FILE);

/** The source of one component: from its `function Name()` to the next
 *  top-level declaration. */
function component(name: string): string {
  const start = src.indexOf(`function ${name}()`);
  assert.ok(start >= 0, `${name} is declared`);
  const rest = src.slice(start + 1);
  const end = rest.search(/\n(?:function |export const )/);
  return rest.slice(0, end < 0 ? undefined : end);
}

/** The extents the art file states, read from its text. */
function statedExtents(): Record<string, { hw: number; hh: number }> {
  const block = /export const TOP_ART_GEAR_EXTENT = \{([\s\S]*?)\} as const;/.exec(src);
  assert.ok(block, 'TOP_ART_GEAR_EXTENT is declared');
  const out: Record<string, { hw: number; hh: number }> = {};
  for (const m of block[1].matchAll(/'?([a-z-]+)'?: \{ hw: ([\d.]+), hh: ([\d.]+) \}/g)) out[m[1]] = { hw: Number(m[2]), hh: Number(m[3]) };
  return out;
}

function statedOutline(): number {
  const m = /export const TOP_ART_GEAR_OUTLINE = ([\d.]+);/.exec(src);
  assert.ok(m, 'TOP_ART_GEAR_OUTLINE is declared');
  return Number(m[1]);
}

describe('top-view art for equipment and furniture: the map', () => {
  it('draws at the floor art’s scale', () => {
    assert.equal(TOP_ART_UNITS, 32);
  });

  it('has one component for each of the eight kinds, under its kind id', () => {
    const map = /export const TOP_ART_GEAR: TopArtMap = \{([\s\S]*?)\};/.exec(src);
    assert.ok(map, 'TOP_ART_GEAR is declared as a TopArtMap');
    for (const [kind, name] of KINDS) {
      const key = /^[a-z]+$/.test(kind) ? kind : `'${kind}'`;
      assert.ok(map[1].includes(`${key}: ${name},`), `${kind} is drawn by ${name}`);
    }
    assert.equal(map[1].split(',').filter((l) => l.trim()).length, KINDS.length, 'and nothing else is in the map');
  });

  it('is the map the stage draws from, and each kind has no other drawing there', () => {
    const stage = code('src/screens/lab/stageplot/stage/stageArt.tsx');
    assert.match(stage, /import \{ TOP_ART_GEAR \} from '\.\/topArtGear';/);
    assert.match(stage, /STAGE_TOP_ART: TopArtMap = \{[^}]*\.\.\.TOP_ART_GEAR[^}]*\}/);
    for (const [kind] of KINDS) assert.doesNotMatch(stage, new RegExp(`case '${kind}':`), `${kind} is drawn from the map`);
  });
});

describe('top-view art for equipment and furniture: each drawing keeps to its footprint', () => {
  const extents = statedExtents();
  const outline = statedOutline();

  it('states the numbers it is drawn to for every kind, and for nothing else', () => {
    assert.deepEqual(Object.keys(extents).sort(), KINDS.map(([k]) => k).sort());
    assert.ok(outline > 0 && outline <= 0.4, 'the outline allowance is half a thin outline');
  });

  for (const [kind, name] of KINDS) {
    it(`${kind}: inside ${spSymbol(kind).w} × ${spSymbol(kind).h} m, outline included, and fills most of it`, () => {
      const sym = spSymbol(kind);
      const maxHw = (sym.w * TOP_ART_UNITS) / 2;
      const maxHh = (sym.h * TOP_ART_UNITS) / 2;
      const { hw, hh } = extents[kind];
      assert.ok(hw + outline <= maxHw + 1e-9, `half width ${hw} + ${outline} is within ${maxHw}`);
      assert.ok(hh + outline <= maxHh + 1e-9, `half depth ${hh} + ${outline} is within ${maxHh}`);
      assert.ok(hw >= maxHw * 0.85, `it fills the width (${hw} of ${maxHw})`);
      assert.ok(hh >= maxHh * 0.85, `it fills the depth (${hh} of ${maxHh})`);
    });

    it(`${kind}: ${name} draws to those numbers`, () => {
      const body = component(name);
      const ref = /^[a-z]+$/.test(kind) ? `TOP_ART_GEAR_EXTENT.${kind}` : `TOP_ART_GEAR_EXTENT['${kind}']`;
      assert.ok(body.includes(`= ${ref};`), `${name} reads ${ref}`);
      assert.ok((body.match(/\bh[wh]\b/g) ?? []).length >= 3, 'and its shapes are placed from them');
    });
  }

  it('no literal coordinate in the file is outside the largest footprint', () => {
    // a coarse net under the stated numbers: a stray number would show here
    const biggest = Math.max(...KINDS.map(([k]) => Math.max(spSymbol(k).w, spSymbol(k).h))) * (TOP_ART_UNITS / 2);
    const body = src.slice(src.indexOf('function PlaybackTop()'));
    for (const m of body.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy)=\{(-?[\d.]+)\}/g)) {
      assert.ok(Math.abs(Number(m[1])) <= biggest, `${m[0]} is on the drawing`);
    }
  });
});

describe('top-view art for equipment and furniture: the house language', () => {
  for (const [kind, name] of KINDS) {
    it(`${kind}: a soft shadow is drawn first`, () => {
      const body = component(name);
      const firstShape = /<(Rect|Path|Line|Circle|Polygon)\b[^>]*>/.exec(body);
      assert.ok(firstShape, `${name} draws shapes`);
      assert.match(firstShape[0], /(fill|stroke)=\{SHADOW\}/, 'the first shape is the shadow');
    });

    it(`${kind}: a pure drawing — no text, no image, no file, no hook`, () => {
      const body = component(name);
      assert.doesNotMatch(body, /<Text|<SvgText|<TSpan/, 'no text');
      assert.doesNotMatch(body, /Image|require\(|\.png|\.jpg|\.svg/, 'no image and no file');
      assert.doesNotMatch(body, /\buse[A-Z]\w*\(/, 'no hook');
      assert.match(body, /^unction \w+\(\) \{/, 'it takes no props');
    });
  }

  it('the shadow is the floor art’s shadow', () => {
    assert.match(src, /const SHADOW = 'rgba\(0,0,0,0\.45\)';/);
  });

  it('the file imports only the drawing primitives and its contract', () => {
    const imports = [...src.matchAll(/^import .*$/gm)].map((m) => m[0]);
    assert.deepEqual(imports, ["import { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';", "import type { TopArtMap } from './topArtTypes';"]);
    assert.doesNotMatch(src, /useState|useEffect|useMemo|useRef|Animated|Reanimated/);
  });

  it('colors are literals in the file (no theme token, no prop)', () => {
    assert.doesNotMatch(src, /theme\/tokens|colors\.|palette\./);
    assert.ok((src.match(/"#[0-9a-f]{6}"/g) ?? []).length > 40, 'the materials are stated as literals');
  });
});

describe('top-view art for equipment and furniture: what each one shows', () => {
  it('playback: the operator is upstage, like every player — trackpad and keys upstage, hinge and screen toward the audience, as the print symbol has it', () => {
    // the print symbol: the hinge line downstage (+y), the small pad upstage (−y)
    const shapes = spSymbol('playback').shapes;
    const line = shapes.find((s) => s.t === 'line');
    const pad = shapes.find((s) => s.t === 'rect' && s.w < 0.3);
    assert.ok(line && line.t === 'line' && line.y1 > 0 && line.y2 > 0, 'the symbol’s hinge line is on the audience side');
    assert.ok(pad && pad.t === 'rect' && pad.y + pad.h < 0, 'the symbol’s pad is on the operator’s side, upstage');
    const body = component('PlaybackTop');
    const num = (re: RegExp, what: string): number => {
      const m = re.exec(body);
      assert.ok(m, what);
      return Number(m[1]);
    };
    const trackpad = num(/<Rect x=\{-4\.1\} y=\{(-?[\d.]+)\} width=\{3\.4\} height=\{1\.95\}[^>]*fill="#b6b4ab"/, 'the trackpad');
    const keysTop = num(/<Rect x=\{-6\.5\} y=\{(-?[\d.]+)\} width=\{8\.2\} height=\{3\.1\}[^>]*fill="#141518"/, 'the keyboard');
    const hinge = num(/<Rect x=\{-6\.6\} y=\{(-?[\d.]+)\} width=\{8\.4\} height=\{0\.5\}[^>]*fill="#3a3c42"/, 'the hinge');
    const screen = num(/<Rect x=\{-6\.8\} y=\{(-?[\d.]+)\} width=\{8\.8\} height=\{1\.45\}[^>]*fill="#46647e"/, 'the lit screen');
    const lidEdge = num(/<Line x1=\{-7\} y1=\{(-?[\d.]+)\}[^>]*stroke="#c9c6bc"/, 'the lid’s top edge');
    // from the operator (−y) to the audience (+y): trackpad, keys, hinge, lit screen, lid edge
    assert.ok(trackpad + 1.95 <= keysTop, 'the trackpad is nearest the operator');
    assert.ok(trackpad < 0 && keysTop < 0, 'and both start upstage of the center');
    assert.ok(keysTop + 3.1 <= hinge, 'the keys are upstage of the hinge');
    assert.ok(hinge > 0, 'the hinge is on the audience side');
    assert.ok(screen >= hinge && screen + 1.45 <= lidEdge, 'the lit screen is on the operator’s side of the lid’s top edge');
    // the interface's knobs stand out of its upstage side, toward the operator
    const iface = num(/<Rect x=\{2\.9\} y=\{(-?[\d.]+)\} width=\{4\} height=\{3\.2\}[^>]*fill="#34373e"/, 'the audio interface');
    const knobs = [...body.matchAll(/<Rect x=\{[\d.]+\} y=\{(-?[\d.]+)\} width=\{0\.(?:55|95)\} height=\{0\.[45]\}/g)].map((m) => Number(m[1]));
    assert.equal(knobs.length, 3, 'three knobs');
    for (const y of knobs) assert.ok(y < iface, 'a knob stands out toward the operator');
    // not the old drawing turned round: the shadows still fall toward +x, +y
    assert.doesNotMatch(body, /rotate\(/);
    assert.match(body, /<Rect x=\{-hw \+ 0\.8\} y=\{-hh \+ 1\.2\}[^>]*fill=\{SHADOW\}/);
    assert.match(body, /<Rect x=\{-6\.8\} y=\{-3\.9\} width=\{9\.6\} height=\{8\.9\}[^>]*fill="rgba\(0,0,0,0\.4\)"/, 'the laptop’s shadow on the table');
    assert.match(body, /<Rect x=\{3\.3\} y=\{-1\.8\} width=\{4\} height=\{3\.2\}[^>]*fill="rgba\(0,0,0,0\.4\)"/, 'the interface’s shadow on the table');
  });

  it('iem and power: the stage prints a tag over the center, and the art is dark there', () => {
    assert.equal(spSymbol('iem').tag, 'IEM');
    assert.equal(spSymbol('power').tag, 'AC');
    // iem: the transmitter's plain cover lies over the center
    const iem = component('IemTop');
    assert.match(iem, /const x0 = -3\.1;/);
    assert.match(iem, /const rear = -2\.1;/);
    assert.match(iem, /const front = 3\.3;/);
    assert.match(iem, /<Rect x=\{x0\} y=\{rear\} width=\{unitW\} height=\{front - rear\}[^>]*fill="#1d1f24"/);
    // power: the cable goes round the center and the box stands clear of it
    const power = component('PowerTop');
    assert.match(power, /const bx = hw - 3\.8;/);
    assert.match(power, /const by = hh - 3\.4;/);
    assert.match(power, /A4\.5 4\.5 0 0 1 -0\.6 -5\.3 A4\.2 4\.2 0 0 1 -0\.6 3\.1/, 'a loop of slack round the tag');
  });

  it('power: nothing drawn states a voltage or a circuit rating', () => {
    const power = component('PowerTop');
    // (color literals aside: "#15161a" is a color, not fifteen thousand amperes)
    assert.doesNotMatch(power.replace(/"#[0-9a-f]{6}"/g, '""'), /\b\d+\s*(V|A|VAC|amp|amps|volt|volts)\b/i);
    assert.doesNotMatch(power, /volt|ampere|\bVAC\b|\bGFCI\b|\bHz\b/i);
    assert.doesNotMatch(power, /<Text|<SvgText/);
    // the outlets are two plain slots and a ground hole: no T slot, no color code
    assert.doesNotMatch(power, /#c8372b|#e3b73a/);
  });

  it('drum fill and sidefill: the grille is along the front (+y), and the two differ in more than size', () => {
    const drum = component('DrumFillTop');
    const side = component('SidefillTop');
    assert.match(drum, /const subFront = hh - 1\.5;/);
    assert.match(drum, /Q0 \$\{subFront \+ 3\.2\}/, 'the drum fill’s grille bows toward +y');
    assert.match(side, /const front = hh - 1\.5;/);
    assert.match(side, /Q0 \$\{front \+ 3\.2\}/, 'the sidefill’s grille bows toward +y');
    // proportion: one is wider than deep, the other deeper than wide
    assert.ok(spSymbol('drum-fill').w > spSymbol('drum-fill').h);
    assert.ok(spSymbol('sidefill').h > spSymbol('sidefill').w);
    // detail: the drum fill has a carry handle and stacking recesses; the
    // sidefill has flying tracks and a tapered plan to the cabinet's own width
    assert.match(drum, /fill="#0b0b0d"/, 'the top box’s carry handle');
    assert.doesNotMatch(drum, /strokeDasharray="0\.5 0\.33"/);
    assert.match(side, /strokeDasharray="0\.5 0\.33"/, 'the flying tracks');
    assert.match(side, /const rearHw = 6\.7;/, '419 mm at the rear');
  });

  it('chair and music stand: the sitter and the player are upstage of the front edge', () => {
    const chair = component('ChairTop');
    // the backrest is upstage (−y) of the seat
    assert.match(chair, /const back = 'M-6\.3 -4\.9 Q0 -7\.7 6\.3 -4\.9/);
    const stand = component('MusicStandTop');
    // the lip is on the player's side (−y), the desk's top edge toward +y
    assert.match(stand, /const lipTop = -3\.3;/);
    assert.match(stand, /const deskTop = 1\.9;/);
    // one leg toward the player, two toward the audience, as the print symbol has it
    const legs = spSymbol('music-stand').shapes.filter((s) => s.t === 'line');
    assert.equal(legs.length, 3);
    assert.equal(legs.filter((s) => s.t === 'line' && s.y2 < 0).length, 1);
    assert.match(stand, /\[0, -hh \+ 0\.5\],\s*\[-5\.1, 3\.9\],\s*\[5\.1, 3\.9\],/);
  });

  it('rack: a ball corner at each corner and a latch at each end of both lid seams', () => {
    const rack = component('RackTop');
    assert.match(rack, /\[-seam, seam\]\.map/);
    assert.match(rack, /\[-4\.5, 4\.5\]\.map/);
    assert.equal((rack.match(/\[-?1, -?1\],/g) ?? []).length, 4);
  });
});
