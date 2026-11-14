/**
 * stageplot/spSymbols — the BLACK-LINE SYMBOLS of a printed stage plot, as
 * plain data: each stage object as a few lines, boxes and circles seen from
 * above. One description, drawn by three renderers (the on-screen print look,
 * the HTML packet's inline SVG, the PDF writer), so the page a venue prints
 * cannot differ from the page the band saw.
 *
 * WHY LINE SYMBOLS (owner 2026-11-12, question 4): a venue prints the packet
 * in black on white, often on an office printer. The symbols follow the way
 * stage plots are usually drawn: a circle for a person, a wedge shape for a
 * wedge, a box for an amplifier, a cluster of circles for a drum kit. They
 * are told apart by SHAPE and by their printed label, never by color.
 *
 * Geometry: METERS, centered on the object's own position, drawn for an
 * object that faces the AUDIENCE (down the page, +y). `w`/`h` is the nominal
 * footprint. A symbol is a drawing of a kind of thing: it is NOT the real
 * footprint of anybody's equipment, and the packet says so when the plot is
 * to scale.
 *
 * Pure data and pure functions. No colors here: a renderer maps the three
 * fills to white, black and one light gray.
 */
import type { SpObject, SpObjectKind, SpProject } from './spTypes.ts';

/** paper = white, ink = black, tone = one light gray, none = outline only. */
export type SpFill = 'none' | 'paper' | 'ink' | 'tone';

export type SpShape =
  | { t: 'rect'; x: number; y: number; w: number; h: number; r?: number; fill?: SpFill; dash?: boolean }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: SpFill; dash?: boolean }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; dash?: boolean }
  /** x0,y0,x1,y1…; closed = join the last point to the first. */
  | { t: 'poly'; pts: number[]; closed?: boolean; fill?: SpFill; dash?: boolean };

export type SpSymbol = {
  /** Nominal footprint in meters (also the selection box). */
  w: number;
  h: number;
  shapes: SpShape[];
  /** A short word printed inside the symbol ("DI", "AC"), or ''. */
  tag: string;
};

const rect = (x: number, y: number, w: number, h: number, more: Partial<Extract<SpShape, { t: 'rect' }>> = {}): SpShape => ({ t: 'rect', x, y, w, h, ...more });
const circle = (cx: number, cy: number, r: number, more: Partial<Extract<SpShape, { t: 'circle' }>> = {}): SpShape => ({ t: 'circle', cx, cy, r, ...more });
const line = (x1: number, y1: number, x2: number, y2: number): SpShape => ({ t: 'line', x1, y1, x2, y2 });
const poly = (pts: number[], closed = true, fill: SpFill = 'paper'): SpShape => ({ t: 'poly', pts, closed, fill });

/** A box centered on 0,0. */
const box = (w: number, h: number, more: Partial<Extract<SpShape, { t: 'rect' }>> = {}): SpShape => rect(-w / 2, -h / 2, w, h, { fill: 'paper', ...more });

const SYMBOLS: Record<SpObjectKind, SpSymbol> = {
  // a person: a circle, with a short mark on the side they face
  performer: { w: 0.6, h: 0.6, tag: '', shapes: [circle(0, 0, 0.3, { fill: 'tone' }), line(0, 0.3, 0, 0.44)] },
  // a microphone on a stand: the round base, the stem, a filled capsule
  'vocal-mic': { w: 0.5, h: 0.6, tag: '', shapes: [circle(0, 0.12, 0.2, { fill: 'paper' }), line(0, 0.12, 0, -0.22), circle(0, -0.24, 0.07, { fill: 'ink' })] },
  'mic-stand': { w: 0.5, h: 0.6, tag: '', shapes: [circle(0, 0.12, 0.2, { fill: 'paper' }), line(0, 0.12, 0, -0.22), circle(0, -0.24, 0.07, { fill: 'ink' })] },
  // a drum kit: the stool, kick, snare, floor tom, two rack toms, two cymbals
  'drum-kit': {
    w: 1.9,
    h: 1.7,
    tag: '',
    shapes: [
      // a right-handed kit: the drummer sits upstage and faces the audience,
      // so the drummer's LEFT (snare, hi-hat) is the viewer's RIGHT (+x).
      // The layout follows the kit drawn on the screen (review 2,
      // 2026-11-12): stool upstage, the drums in front of it, the cymbals at
      // the audience-side corners. One kit, one layout, on screen and paper.
      circle(0, -0.62, 0.17, { fill: 'paper' }), // the stool (white: the drummer's own circle sits on it)
      circle(0, -0.04, 0.34, { fill: 'paper' }), // kick
      circle(0.5, -0.04, 0.2, { fill: 'paper' }), // snare
      circle(-0.52, -0.06, 0.22, { fill: 'paper' }), // floor tom
      circle(-0.18, 0.4, 0.16, { fill: 'paper' }), // rack tom
      circle(0.18, 0.4, 0.16, { fill: 'paper' }), // rack tom
      circle(0.68, 0.46, 0.24, { dash: true }), // hi-hat and crash side
      circle(-0.66, 0.46, 0.26, { dash: true }), // ride side
    ],
  },
  // small percussion: three drums of different sizes (no case: a box with
  // circles reads as a loudspeaker)
  percussion: { w: 1.0, h: 0.6, tag: '', shapes: [circle(-0.3, 0.04, 0.18, { fill: 'paper' }), circle(0.06, -0.08, 0.13, { fill: 'paper' }), circle(0.34, 0.08, 0.1, { fill: 'paper' })] },
  // THE PLAYER IS UPSTAGE, FACING THE AUDIENCE, so the player's right hand is
  // toward stage right (-x). These three follow a right-handed setup, the
  // same as the art on the Stage screen (stage/topArtInstruments.tsx):
  // congas: the larger drum (tumba) on the player's right
  congas: { w: 0.9, h: 0.5, tag: '', shapes: [circle(-0.22, 0, 0.22, { fill: 'paper' }), circle(0.22, 0, 0.2, { fill: 'paper' }), circle(-0.22, 0, 0.14), circle(0.22, 0, 0.12)] },
  // timbales: two shallow drums side by side, the larger (hembra) on the
  // player's LEFT, the bells between them on the audience's side
  timbales: { w: 1.1, h: 0.8, tag: '', shapes: [circle(-0.26, -0.08, 0.24, { fill: 'paper' }), circle(0.26, -0.08, 0.26, { fill: 'paper' }), circle(0, 0.28, 0.1, { fill: 'tone' })] },
  // bongó: the larger drum (hembra) on the player's right
  bongo: { w: 0.6, h: 0.35, tag: '', shapes: [circle(-0.15, 0, 0.15, { fill: 'paper' }), circle(0.14, 0, 0.12, { fill: 'paper' }), line(0.0, 0, 0.02, 0)] },
  // an amplifier: a cabinet, the grille on the side it faces
  'guitar-amp': { w: 0.7, h: 0.4, tag: '', shapes: [box(0.7, 0.4, { r: 0.04 }), line(-0.3, 0.12, 0.3, 0.12), line(-0.3, 0.06, 0.3, 0.06)] },
  'bass-amp': { w: 0.8, h: 0.5, tag: '', shapes: [box(0.8, 0.5, { r: 0.04 }), line(-0.34, 0.17, 0.34, 0.17), line(-0.34, 0.1, 0.34, 0.1), line(-0.34, 0.03, 0.34, 0.03)] },
  // a keyboard: a long case, with the keys on the player's side
  keyboard: {
    w: 1.3,
    h: 0.36,
    tag: '',
    shapes: [box(1.3, 0.36, { r: 0.03 }), line(-0.6, -0.04, 0.6, -0.04), ...[-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].map((x) => line(x, -0.04, x, -0.16))],
  },
  // a piano: a deeper case than a keyboard, with the same row of keys
  piano: {
    w: 1.5,
    h: 0.66,
    tag: '',
    shapes: [box(1.5, 0.66, { r: 0.04 }), line(-0.7, -0.12, 0.7, -0.12), ...[-0.56, -0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42, 0.56].map((x) => line(x, -0.12, x, -0.3))],
  },
  // an acoustic instrument: a guitar body from above
  'acoustic-guitar': { w: 0.45, h: 0.9, tag: '', shapes: [circle(0, 0.2, 0.2, { fill: 'paper' }), circle(0, -0.06, 0.15, { fill: 'paper' }), line(0, -0.2, 0, -0.45), circle(0, 0.14, 0.06)] },
  // a horn: the bell, opening toward the audience
  horn: { w: 0.4, h: 0.66, tag: '', shapes: [line(0, -0.42, 0, -0.14), poly([-0.04, -0.14, 0.04, -0.14, 0.18, 0.2, -0.18, 0.2]), line(-0.18, 0.2, 0.18, 0.2)] },
  // a playback rig: a laptop. Its operator is upstage of it, like every
  // player: the trackpad on the operator's side, the screen edge on the
  // audience's side
  playback: { w: 0.5, h: 0.4, tag: '', shapes: [box(0.5, 0.4, { r: 0.03 }), line(-0.25, 0.1, 0.25, 0.1), rect(-0.09, -0.12, 0.18, 0.1, { fill: 'none' })] },
  ...MORE_SYMBOLS(),
  di: { w: 0.3, h: 0.3, tag: 'DI', shapes: [box(0.3, 0.3, { r: 0.03 })] },
  // a wedge: its FRONT (the grille, the wide side) is the side it faces. A
  // wedge at the stage edge is turned 180° so the wide side faces the
  // performer; the line inside is the grille's edge
  wedge: { w: 0.7, h: 0.45, tag: '', shapes: [poly([-0.24, -0.22, 0.24, -0.22, 0.35, 0.22, -0.35, 0.22]), line(-0.3, 0.12, 0.3, 0.12)] },
  // square corners like every other box: a rounded box is the legend's mark
  // for a monitor mix code (M1), so an IEM must never read as one
  iem: { w: 0.5, h: 0.3, tag: 'IEM', shapes: [box(0.5, 0.3, { r: 0.03 })] },
  // a drum fill and a sidefill, from above: a cabinet with a heavy bar on
  // the side it faces (a front view with its drivers showing would be the
  // only symbol not seen from above)
  'drum-fill': { w: 0.8, h: 0.6, tag: '', shapes: [box(0.8, 0.6, { r: 0.04 }), rect(-0.36, 0.2, 0.72, 0.08, { fill: 'ink' })] },
  sidefill: { w: 0.7, h: 0.9, tag: '', shapes: [box(0.7, 0.9, { r: 0.04 }), rect(-0.31, 0.34, 0.62, 0.09, { fill: 'ink' }), line(-0.31, -0.1, 0.31, -0.1)] },
  rack: { w: 0.6, h: 0.6, tag: '', shapes: [box(0.6, 0.6, { r: 0.03 }), line(-0.3, -0.12, 0.3, -0.12), line(-0.3, 0.02, 0.3, 0.02), line(-0.3, 0.16, 0.3, 0.16)] },
  // a stage box: a box with its rows of sockets
  'stage-box': {
    w: 0.5,
    h: 0.35,
    tag: '',
    shapes: [box(0.5, 0.35, { r: 0.03 }), ...[-0.15, 0, 0.15].flatMap((x) => [circle(x, -0.07, 0.035, { fill: 'ink' }), circle(x, 0.07, 0.035, { fill: 'ink' })])],
  },
  // a power drop: a circle marked AC (a request for a location, never a
  // statement about the circuit)
  power: { w: 0.4, h: 0.4, tag: 'AC', shapes: [circle(0, 0, 0.2, { fill: 'paper' })] },
  chair: { w: 0.45, h: 0.45, tag: '', shapes: [box(0.45, 0.45, { r: 0.05 }), line(-0.22, -0.16, 0.22, -0.16)] },
  // a music stand, from above: the desk as a thin bar, three short legs
  'music-stand': { w: 0.5, h: 0.35, tag: '', shapes: [line(0, 0.02, -0.13, 0.16), line(0, 0.02, 0.13, 0.16), line(0, 0.02, 0, -0.16), rect(-0.25, -0.02, 0.5, 0.07, { fill: 'tone' })] },
  // sized by the band: a dashed outline, so it reads as a platform under things
  riser: { w: 2.4, h: 2.0, tag: '', shapes: [rect(-0.5, -0.5, 1, 1, { dash: true, fill: 'none' })] },
  generic: { w: 0.8, h: 0.6, tag: '', shapes: [rect(-0.5, -0.5, 1, 1, { fill: 'paper', r: 0.04 })] },
};

export const spSymbol = (kind: SpObjectKind): SpSymbol => SYMBOLS[kind];

/** The kinds added for more diverse music (owner 2026-11-13: "We also need
 *  more symbols for more diverse music"), in the palette's order. */
export type SpMoreKind =
  | 'choir'
  | 'e-drums'
  | 'cajon'
  | 'djembe'
  | 'tabla'
  | 'steel-pan'
  | 'vibraphone'
  | 'upright-bass'
  | 'grand-piano'
  | 'electric-piano'
  | 'keyboard-rig'
  | 'organ'
  | 'leslie'
  | 'violin'
  | 'cello'
  | 'harp'
  | 'banjo'
  | 'mandolin'
  | 'accordion'
  | 'saxophone'
  | 'trombone'
  | 'dj';
export const SP_MORE_KINDS: readonly SpMoreKind[] = ['choir', 'e-drums', 'cajon', 'djembe', 'tabla', 'steel-pan', 'vibraphone', 'upright-bass', 'grand-piano', 'electric-piano', 'keyboard-rig', 'organ', 'leslie', 'violin', 'cello', 'harp', 'banjo', 'mandolin', 'accordion', 'saxophone', 'trombone', 'dj'];

/** A closed outline from one half (x ≥ 0, top to bottom), mirrored. */
function mirrored(half: number[], fill: SpFill = 'paper'): SpShape {
  const pts = [...half];
  for (let k = half.length - 4; k >= 2; k -= 2) pts.push(-half[k], half[k + 1]);
  return { t: 'poly', pts, closed: true, fill };
}

/** Shapes turned by `deg` about 0,0 (clockwise on the page), then moved. */
function turnedShapes(shapes: SpShape[], deg: number, dx = 0, dy = 0): SpShape[] {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const pt = (x: number, y: number): [number, number] => [x * c - y * s + dx, x * s + y * c + dy];
  return shapes.map((sh): SpShape => {
    if (sh.t === 'circle') {
      const [cx, cy] = pt(sh.cx, sh.cy);
      return { ...sh, cx, cy };
    }
    if (sh.t === 'line') {
      const [x1, y1] = pt(sh.x1, sh.y1);
      const [x2, y2] = pt(sh.x2, sh.y2);
      return { ...sh, x1, y1, x2, y2 };
    }
    if (sh.t === 'poly') {
      const pts: number[] = [];
      for (let k = 0; k + 1 < sh.pts.length; k += 2) pts.push(...pt(sh.pts[k], sh.pts[k + 1]));
      return { ...sh, pts };
    }
    const q = [pt(sh.x, sh.y), pt(sh.x + sh.w, sh.y), pt(sh.x + sh.w, sh.y + sh.h), pt(sh.x, sh.y + sh.h)];
    return { t: 'poly', pts: q.flat(), closed: true, fill: sh.fill ?? 'none' };
  });
}

/** Lines across a strip, `n` of them, evenly from x0 to x1 (piano keys,
 *  pads of a pedalboard, bars of a vibraphone). */
function ticks(n: number, x0: number, x1: number, y0: number, y1: number): SpShape[] {
  return Array.from({ length: n }, (_, i) => line(x0 + ((x1 - x0) * (i + 1)) / (n + 1), y0, x0 + ((x1 - x0) * (i + 1)) / (n + 1), y1));
}

/** The print symbols of the added kinds. Like every print symbol: seen from
 *  above, the player upstage (−y) facing the audience (+y), drawn in black
 *  line on white, told apart by shape and by the printed label. The sizes
 *  are the instrument as it stands on a stage (a live-sound reviewer's
 *  figures, 2026-11-13). */
function MORE_SYMBOLS(): Record<SpMoreKind, SpSymbol> {
  // a vibraphone: the low end (long bars) at the player's LEFT hand, which
  // is +x, as on a piano; naturals nearest the player, accidentals beyond
  const vibeBars: SpShape[] = [];
  // (the on-screen art's bars, in meters: 0.175 m to 0.315 m long)
  const vibeLen = (x: number) => 0.175 + 0.14 * Math.min(1, Math.max(0, (x + 0.634) / 1.268));
  for (let i = 0; i < 22; i++) {
    const x = -0.634 + (1.268 * i) / 21;
    vibeBars.push(line(x, -0.025, x, -0.025 - vibeLen(x)));
  }
  // accidentals: in twos and threes over the gaps (F# G# A#, C# D#, …), low F at +x
  for (let i = 0; i < 21; i++) {
    if ('BE'.includes('FGABCDE'[i % 7]!)) continue;
    const x = 0.634 - (1.268 * (i + 0.5)) / 21;
    vibeBars.push(line(x, 0.025, x, 0.025 + vibeLen(x) - 0.016));
  }
  const vibeHalf = (t: number) => 0.025 + (0.175 + 0.14 * t) + 0.028;
  /** The case of a 5 ft 8 in grand piano from above, in concert placement
   *  (the keyboard end at −x, the straight spine upstage, the tail at +x):
   *  the on-screen art's outline (topArtStringsKeys), in meters. */
  const GRAND_CASE = [-0.53, -0.74, 1.06, -0.74, 1.16, -0.69, 1.19, -0.56, 1.16, -0.41, 1.05, -0.21, 0.88, -0.02, 0.66, 0.18, 0.41, 0.38, 0.16, 0.55, -0.09, 0.69, -0.31, 0.74, -0.53, 0.74];
  return {
    // a choir on a three-step riser: the singers in rows, the back row highest (upstage)
    choir: {
      w: 1.85,
      h: 1.4,
      tag: '',
      shapes: [
        rect(-0.925, -0.7, 1.85, 1.4, { fill: 'paper' }),
        line(-0.925, -0.233, 0.925, -0.233),
        line(-0.925, 0.233, 0.925, 0.233),
        ...[-0.62, -0.31, 0, 0.31, 0.62].map((x) => circle(x, -0.47, 0.13, { fill: 'tone' })),
        ...[-0.775, -0.465, -0.155, 0.155, 0.465, 0.775].map((x) => circle(x, 0, 0.13, { fill: 'tone' })),
        ...[-0.62, -0.31, 0, 0.31, 0.62].map((x) => circle(x, 0.47, 0.13, { fill: 'tone' })),
      ],
    },
    // an electronic kit: the rack's bars round the pads, the throne upstage;
    // the drummer's left (snare, hi-hat) is the viewer's right, as on the kit
    'e-drums': {
      // (the on-screen art's layout, in meters)
      w: 1.5,
      h: 1.1,
      tag: '',
      shapes: [
        circle(0, -0.378, 0.156, { fill: 'paper' }),
        { t: 'poly', pts: [-0.5625, -0.259, -0.5625, 0.409, 0.5625, 0.409, 0.5625, -0.259], closed: false, fill: 'none' },
        rect(-0.125, 0.147, 0.25, 0.119, { fill: 'paper' }),
        circle(-0.419, -0.016, 0.1375, { fill: 'tone' }),
        circle(-0.144, 0.259, 0.106, { fill: 'tone' }),
        circle(0.15, 0.259, 0.106, { fill: 'tone' }),
        circle(0.2375, 0.047, 0.144, { fill: 'tone' }),
        circle(0.494, 0.091, 0.1375, { fill: 'tone' }),
        circle(-0.516, 0.247, 0.2, { fill: 'tone' }),
        circle(0.375, 0.372, 0.169, { fill: 'tone' }),
        rect(0.55, -0.309, 0.181, 0.119, { fill: 'ink' }),
      ],
    },
    // a cajón: the square seat, the front plate (tapa) along the audience's side
    cajon: { w: 0.4, h: 0.4, tag: '', shapes: [box(0.375, 0.375, { r: 0.01 }), rect(-0.1875, 0.155, 0.375, 0.032, { fill: 'ink' }), circle(-0.15, 0.12, 0.012, { fill: 'ink' }), circle(0.15, 0.12, 0.012, { fill: 'ink' })] },
    // a djembe: the head inside its rope ring
    djembe: { w: 0.45, h: 0.45, tag: '', shapes: [circle(0, 0, 0.215, { fill: 'paper' }), circle(0, 0, 0.18, { fill: 'paper' }), ...Array.from({ length: 12 }, (_, i) => circle(Math.cos((i * Math.PI) / 6) * 0.198, Math.sin((i * Math.PI) / 6) * 0.198, 0.012, { fill: 'ink' }))] },
    // tabla: the two drums in front of the player, on the floor rug the
    // player sits on; the small dayan at the right hand (−x), the bayan left
    tabla: {
      w: 1.0,
      h: 1.0,
      tag: '',
      shapes: [
        rect(-0.48, -0.48, 0.96, 0.96, { fill: 'tone' }),
        rect(-0.43, -0.43, 0.86, 0.86, { fill: 'none' }),
        circle(-0.15, 0.2, 0.1, { fill: 'paper' }),
        circle(-0.15, 0.2, 0.035, { fill: 'ink' }),
        circle(0.16, 0.2, 0.15, { fill: 'paper' }),
        circle(0.16, 0.2, 0.12, { fill: 'paper' }),
        circle(0.16, 0.235, 0.04, { fill: 'ink' }),
      ],
    },
    // a steel pan: the rim and the rings of note areas
    'steel-pan': { w: 0.65, h: 0.65, tag: '', shapes: [circle(0, 0, 0.3, { fill: 'paper' }), circle(0, 0, 0.27), circle(0, 0, 0.17), circle(0, 0, 0.08)] },
    // a vibraphone: the tapered frame, the bars in two rows
    vibraphone: {
      w: 1.42,
      h: 0.76,
      tag: '',
      shapes: [poly([-0.71, -vibeHalf(0), 0.71, -vibeHalf(1), 0.71, vibeHalf(1), -0.71, vibeHalf(0)]), line(-0.71, 0, 0.71, 0), ...vibeBars],
    },
    // an upright bass leaning back toward its player: the face shortened,
    // the fingerboard running up to the scroll on the player's side, the
    // endpin toward the audience
    'upright-bass': {
      w: 0.7,
      h: 0.75,
      tag: '',
      shapes: [
        mirrored([0, -0.19, 0.16, -0.18, 0.25, -0.11, 0.2, -0.03, 0.17, 0.02, 0.22, 0.08, 0.32, 0.16, 0.28, 0.24, 0.12, 0.27, 0, 0.275]),
        line(0, 0.275, 0, 0.36),
        rect(-0.03, -0.33, 0.06, 0.37, { fill: 'ink' }),
        circle(0, -0.34, 0.035, { fill: 'paper' }),
        line(-0.08, 0.1, 0.08, 0.1),
        line(-0.1, 0.02, -0.11, 0.14),
        line(0.1, 0.02, 0.11, 0.14),
        poly([-0.04, 0.13, 0.04, 0.13, 0.02, 0.24, -0.02, 0.24]),
      ],
    },
    // a grand piano in concert placement: the keyboard and bench at stage
    // right (−x), the straight side upstage, the curved side and the open
    // lid toward the audience (the lid in gray)
    'grand-piano': {
      w: 2.4,
      h: 1.5,
      tag: '',
      shapes: [
        poly(GRAND_CASE),
        // the raised lid, from behind the music desk to the tail
        poly(GRAND_CASE.map((v, i) => (i % 2 ? -0.74 + 0.62 * (v + 0.74) : Math.max(v, -0.25))), true, 'tone'),
        line(0.3, 0.42, 0.3, 0.02),
        rect(-0.544, -0.61, 0.15, 1.22, { fill: 'paper' }),
        ...Array.from({ length: 13 }, (_, i) => line(-0.544, -0.61 + (1.22 * (i + 1)) / 14, -0.47, -0.61 + (1.22 * (i + 1)) / 14)),
        rect(-1.2, -0.42, 0.33, 0.84, { fill: 'paper' }),
      ],
    },
    // an electric piano: the case, its keys on the player's side, the two
    // knobs at the left end of the keys
    'electric-piano': {
      w: 1.15,
      h: 0.56,
      tag: '',
      shapes: [box(1.15, 0.56, { r: 0.04 }), line(-0.5, -0.08, 0.42, -0.08), ...ticks(11, -0.5, 0.42, -0.08, -0.25), line(-0.56, 0.02, 0.56, 0.02), circle(0.48, -0.2, 0.025), circle(0.48, -0.12, 0.025)],
    },
    // a two-tier keyboard rig: the lower board nearest the player, the upper
    // one higher and set back, the stand's two ends
    'keyboard-rig': {
      w: 1.4,
      h: 0.7,
      tag: '',
      shapes: [
        line(-0.62, -0.32, -0.62, 0.32),
        line(0.62, -0.32, 0.62, 0.32),
        rect(-0.66, -0.34, 1.32, 0.3, { fill: 'paper', r: 0.03 }),
        line(-0.6, -0.2, 0.6, -0.2),
        ...ticks(13, -0.6, 0.6, -0.2, -0.33),
        rect(-0.5, -0.04, 1.0, 0.3, { fill: 'paper', r: 0.03 }),
        line(-0.45, 0.07, 0.45, 0.07),
        ...ticks(9, -0.45, 0.45, 0.07, -0.03),
      ],
    },
    // a Hammond-type organ: the console, its two manuals and drawbars on the
    // player's side, the pedalboard and the bench upstage
    organ: {
      w: 1.24,
      h: 1.32,
      tag: '',
      shapes: [
        rect(-0.47, -0.66, 0.94, 0.38, { fill: 'paper', r: 0.02 }),
        ...ticks(9, -0.4, 0.4, -0.27, -0.1),
        rect(-0.62, -0.08, 1.24, 0.74, { fill: 'paper', r: 0.02 }),
        rect(-0.43, -0.08, 0.86, 0.1, { fill: 'none' }),
        rect(-0.43, 0.04, 0.86, 0.09, { fill: 'none' }),
        rect(-0.2, 0.15, 0.4, 0.05, { fill: 'tone' }),
        line(-0.58, 0.24, 0.58, 0.24),
      ],
    },
    // a Leslie speaker: its cabinet from above, the cable at the back
    // (the box is a little deeper than the 0.52 m cabinet: its leads)
    leslie: {
      w: 0.74,
      h: 0.6,
      tag: '',
      shapes: [rect(-0.37, -0.24, 0.74, 0.52, { fill: 'paper', r: 0.03 }), rect(-0.33, -0.2, 0.66, 0.44, { fill: 'none' }), line(0.1, -0.24, 0.21, -0.29), line(0.2, -0.24, 0.33, -0.28)],
    },
    // a violin or viola, held level from the player's left shoulder, its
    // scroll forward and to the player's left (+x)
    violin: {
      w: 0.45,
      h: 0.55,
      tag: '',
      shapes: turnedShapes(
        [
          mirrored([0, -0.27, 0.07, -0.265, 0.105, -0.2, 0.095, -0.13, 0.06, -0.09, 0.055, -0.06, 0.07, -0.02, 0.085, 0.03, 0.07, 0.08, 0, 0.09]),
          rect(-0.015, -0.05, 0.03, 0.26, { fill: 'ink' }),
          circle(0, 0.25, 0.025, { fill: 'paper' }),
          line(-0.04, -0.13, 0.04, -0.13),
        ],
        -35,
        0.015,
        0,
      ),
    },
    // a cello with its chair: the player sits on the chair, the cello in
    // front, leaning back, the endpin toward the audience
    cello: {
      w: 0.5,
      h: 1.0,
      tag: '',
      shapes: [
        rect(-0.225, -0.5, 0.45, 0.42, { fill: 'paper', r: 0.04 }),
        line(-0.2, -0.44, 0.2, -0.44),
        mirrored([0, -0.1, 0.12, -0.09, 0.17, -0.04, 0.13, 0.02, 0.12, 0.06, 0.16, 0.11, 0.22, 0.17, 0.19, 0.24, 0.08, 0.28, 0, 0.285]),
        line(0, 0.285, 0, 0.47),
        rect(-0.022, -0.3, 0.044, 0.33, { fill: 'ink' }),
        circle(0, -0.31, 0.03, { fill: 'paper' }),
        line(-0.06, 0.13, 0.06, 0.13),
      ],
    },
    // a pedal harp and the harpist's stool: the harp leans back onto the
    // player's right shoulder, so it is turned a little; the column and its
    // crown toward the audience, the body widening down to the base
    harp: {
      w: 0.6,
      h: 1.24,
      tag: '',
      shapes: [
        rect(-0.219, -0.609, 0.438, 0.328, { fill: 'paper', r: 0.04 }),
        ...turnedShapes(
          [
            rect(-0.2125, 0.1125, 0.425, 0.366, { fill: 'paper', r: 0.03 }),
            poly([-0.078, -0.484, 0.078, -0.484, 0.27, 0.256, 0.21, 0.34, -0.21, 0.34, -0.27, 0.256]),
            line(0, 0.41, 0, -0.475),
            circle(0, 0.419, 0.085, { fill: 'ink' }),
          ],
          -10,
          -0.041,
          0.094,
        ),
      ],
    },
    // a banjo laid face up, neck upstage (as the acoustic instrument is drawn)
    banjo: {
      w: 0.4,
      h: 0.95,
      tag: '',
      shapes: [
        rect(-0.025, -0.43, 0.05, 0.5, { fill: 'paper' }),
        poly([-0.04, -0.475, 0.04, -0.475, 0.035, -0.4, -0.035, -0.4]),
        circle(-0.04, -0.12, 0.014, { fill: 'ink' }),
        circle(0, 0.25, 0.185, { fill: 'paper' }),
        circle(0, 0.25, 0.15, { fill: 'paper' }),
        line(-0.05, 0.31, 0.05, 0.31),
        line(0, 0.31, 0, 0.42),
      ],
    },
    // a mandolin laid face up, neck upstage
    mandolin: {
      w: 0.3,
      h: 0.66,
      tag: '',
      shapes: [
        rect(-0.018, -0.203, 0.036, 0.18, { fill: 'paper' }),
        poly([-0.042, -0.31, 0.042, -0.31, 0.02, -0.203, -0.02, -0.203]),
        mirrored([0, -0.028, 0.06, -0.01, 0.11, 0.08, 0.135, 0.16, 0.125, 0.24, 0.08, 0.295, 0, 0.31]),
        circle(0, 0.08, 0.045),
        line(-0.045, 0.147, 0.045, 0.147),
        rect(-0.03, 0.237, 0.06, 0.06, { fill: 'none' }),
      ],
    },
    // an accordion on the player's chest: the treble keyboard on the
    // player's right (−x), the bellows, the bass buttons on the left
    accordion: {
      w: 0.5,
      h: 0.3,
      tag: '',
      shapes: [
        rect(-0.11, -0.095, 0.23, 0.19, { fill: 'paper' }),
        ...ticks(5, -0.11, 0.12, -0.095, 0.095),
        rect(-0.25, -0.11, 0.14, 0.22, { fill: 'paper', r: 0.015 }),
        rect(-0.25, -0.11, 0.035, 0.22, { fill: 'tone' }),
        rect(0.12, -0.09, 0.12, 0.18, { fill: 'paper', r: 0.015 }),
        line(-0.15, -0.11, -0.12, -0.15),
        line(0.17, -0.09, 0.14, -0.15),
      ],
    },
    // a saxophone as it is held: the mouthpiece at the player, the body
    // down and forward to the player's right, the bell opening up and forward
    saxophone: {
      w: 0.35,
      h: 0.43,
      tag: '',
      shapes: [
        line(0.081, -0.21, 0.081, -0.156),
        line(0.081, -0.156, 0.059, -0.069),
        poly([0.04, -0.069, 0.078, -0.069, 0.03, 0.125, -0.046, 0.125]),
        circle(-0.025, 0.15, 0.062, { fill: 'paper' }),
        circle(-0.025, 0.15, 0.042),
      ],
    },
    // a trombone as it is held: the slide reaching toward the audience, the
    // bell on the player's left (+x) facing the audience, the tuning slide
    // back over the player's shoulder
    trombone: {
      // (the bell rim 0.5 m ahead of the mouthpiece, the tuning crook 0.22 m
      // behind it, the slide's end 0.94 m ahead: a tenor, slide closed)
      w: 0.36,
      h: 1.23,
      tag: '',
      shapes: [
        { t: 'poly', pts: [-0.125, -0.33, -0.125, 0.575, -0.056, 0.575, -0.056, -0.27], closed: false, fill: 'none' },
        { t: 'poly', pts: [-0.056, -0.27, -0.01, -0.27, -0.01, -0.6, 0.056, -0.6, 0.056, -0.044], closed: false, fill: 'none' },
        poly([0.046, -0.044, 0.066, -0.044, 0.162, 0.156, -0.05, 0.156]),
        line(-0.125, -0.33, -0.125, -0.38),
      ],
    },
    // a DJ table: two media players either side of the mixer; the DJ is
    // upstage, so the jog wheels and the faders are on the DJ's side
    dj: {
      w: 1.8,
      h: 0.75,
      tag: '',
      shapes: [
        box(1.8, 0.75, { r: 0.02 }),
        ...[-0.63, 0.63].flatMap((cx) => [rect(cx - 0.17, -0.25, 0.34, 0.44, { fill: 'paper', r: 0.02 }), circle(cx, -0.07, 0.12), rect(cx - 0.1, 0.08, 0.2, 0.07, { fill: 'tone' })]),
        rect(-0.17, -0.25, 0.34, 0.44, { fill: 'paper', r: 0.02 }),
        ...ticks(4, -0.17, 0.17, -0.2, -0.1),
        line(-0.08, -0.22, 0.08, -0.22),
      ],
    },
  };
}


/** Kinds whose shapes are a UNIT box (−0.5…0.5), stretched to the object's
 *  own width and depth. */
export const spIsSized = (kind: SpObjectKind): boolean => kind === 'riser' || kind === 'generic';

/* ── the key ────────────────────────────────────────────────────────────── */

/** THE KEY (owner 2026-11-12: "the key explaining what drawn objects are
 *  needs to always be there in the drawing to understand it"). Every drawing
 *  of a stage, on the screen and on paper, carries a key: each KIND of symbol
 *  that is on THIS plot, drawn small, with its name beside it. It is part of
 *  the drawing, never a popup and never behind a switch.
 *
 *  One entry per different-looking symbol: a vocal microphone and any other
 *  microphone on a stand are the same symbol, so they share one entry; so do
 *  a guitar amplifier and a bass amplifier (two cabinets that look alike at
 *  key size; each is named on the plot). */
export type SpKeyEntry = {
  /** The kind whose symbol (or on-screen art) is drawn for this entry. */
  kind: SpObjectKind;
  /** What it is, in words: "Performer", "Wedge monitor", "Drum kit". */
  name: string;
};

const KEY_NAME: Record<SpObjectKind, string> = {
  performer: 'Performer',
  'vocal-mic': 'Microphone on a stand',
  'mic-stand': 'Microphone on a stand',
  'drum-kit': 'Drum kit',
  percussion: 'Percussion',
  congas: 'Congas',
  timbales: 'Timbales',
  bongo: 'Bongó',
  'guitar-amp': 'Amplifier (guitar or bass)',
  'bass-amp': 'Amplifier (guitar or bass)',
  keyboard: 'Keyboard',
  piano: 'Upright piano',
  'acoustic-guitar': 'Acoustic instrument',
  horn: 'Horn',
  playback: 'Playback rig',
  choir: 'Choir on a riser',
  'e-drums': 'Electronic drum kit',
  cajon: 'Cajón',
  djembe: 'Djembe',
  tabla: 'Tabla (on a floor rug)',
  'steel-pan': 'Steel pan',
  vibraphone: 'Vibraphone',
  'upright-bass': 'Upright bass',
  'grand-piano': 'Grand piano',
  'electric-piano': 'Electric piano',
  'keyboard-rig': 'Two-tier keyboard rig',
  organ: 'Hammond organ',
  leslie: 'Leslie speaker',
  violin: 'Violin or viola',
  cello: 'Cello (with its chair)',
  harp: 'Harp',
  banjo: 'Banjo',
  mandolin: 'Mandolin',
  accordion: 'Accordion',
  saxophone: 'Saxophone',
  trombone: 'Trombone',
  dj: 'DJ table',
  di: 'DI',
  wedge: 'Wedge monitor (wide side faces the performer)',
  iem: 'In-ear monitor equipment',
  'drum-fill': 'Drum fill',
  sidefill: 'Sidefill',
  rack: 'Equipment rack',
  'stage-box': 'Stage box',
  power: 'Power location requested',
  chair: 'Chair',
  'music-stand': 'Music stand',
  riser: 'Riser (dashed outline)',
  generic: 'Other object (named on the plot)',
};

/** The order the key is read in: people, what they play, how it is captured,
 *  monitors, then the stage itself. */
const KEY_ORDER: readonly SpObjectKind[] = [
  'performer',
  'choir',
  'drum-kit',
  'e-drums',
  'percussion',
  'congas',
  'timbales',
  'bongo',
  'cajon',
  'djembe',
  'tabla',
  'steel-pan',
  'vibraphone',
  'guitar-amp',
  'bass-amp',
  'upright-bass',
  'keyboard',
  'piano',
  'grand-piano',
  'electric-piano',
  'keyboard-rig',
  'organ',
  'leslie',
  'acoustic-guitar',
  'violin',
  'cello',
  'harp',
  'banjo',
  'mandolin',
  'accordion',
  'horn',
  'saxophone',
  'trombone',
  'playback',
  'dj',
  'mic-stand',
  'di',
  'wedge',
  'iem',
  'drum-fill',
  'sidefill',
  'rack',
  'stage-box',
  'power',
  'chair',
  'music-stand',
  'riser',
  'generic',
];

/** The key for a set of stage objects: one entry for each kind of symbol
 *  that is drawn, in reading order. Empty only when the stage is empty. */
export function spPlotKey(objects: readonly { kind: SpObjectKind }[]): SpKeyEntry[] {
  const used = new Set<SpObjectKind>();
  for (const o of objects) used.add(spKeyKind(o.kind));
  return KEY_ORDER.filter((k) => used.has(k)).map((kind) => ({ kind, name: KEY_NAME[kind] }));
}

/** The key entry a kind is listed under: itself, or the kind it shares a
 *  look with. */
export function spKeyKind(kind: SpObjectKind): SpObjectKind {
  if (kind === 'vocal-mic') return 'mic-stand';
  if (kind === 'bass-amp') return 'guitar-amp';
  return kind;
}

/** How a kind's symbol is turned in the key, in degrees. A wedge on a plot
 *  is turned so its wide side faces its performer (upstage), so the key
 *  shows it that way too: the picture beside the words matches the wedges on
 *  the stage (review 2, 2026-11-12). On-screen keys use the same turn. */
export function spKeyRot(kind: SpObjectKind): number {
  return kind === 'wedge' ? 180 : 0;
}

/** A kind's print symbol for a key cell: its shapes in meters around 0,0,
 *  facing the audience, with its footprint. A sized kind (riser, labeled
 *  object) is given a small sample box so it has a shape to show. */
export function spKeySymbol(kind: SpObjectKind): SpSymbol {
  const sym = SYMBOLS[kind];
  if (spKeyRot(kind) === 180) {
    // half a turn: every point through the center
    const shapes: SpShape[] = sym.shapes.map((x) =>
      x.t === 'circle'
        ? { ...x, cx: -x.cx, cy: -x.cy }
        : x.t === 'line'
          ? { ...x, x1: -x.x1, y1: -x.y1, x2: -x.x2, y2: -x.y2 }
          : x.t === 'poly'
            ? { ...x, pts: x.pts.map((v) => -v) }
            : { ...x, x: -x.x - x.w, y: -x.y - x.h },
    );
    return { ...sym, shapes };
  }
  if (!spIsSized(kind)) return sym;
  const w = 0.9;
  const h = 0.6;
  const shapes: SpShape[] = sym.shapes.map((x) => (x.t === 'rect' ? { ...x, x: x.x * w, y: x.y * h, w: x.w * w, h: x.h * h } : x));
  return { w, h, tag: sym.tag, shapes };
}

/** The stage size used to draw, in meters. Real dimensions when the band
 *  gave them. Otherwise an ASSUMED stage, only so the symbols have a sensible
 *  size against it, and the plot is labeled "Not to scale": a usual club
 *  stage (7.2 × 4.5 m, about 24 × 15 ft) for up to five performers, a wider
 *  one for a larger band, so a twelve-piece is not drawn as twelve people
 *  standing on each other. The three sizes keep one shape (1.6 to 1). */
export const SP_ASSUMED_STAGE_M = { width: 7.2, depth: 4.5 } as const;
export function spAssumedStageM(performers: number): { width: number; depth: number } {
  if (performers >= 9) return { width: 11.2, depth: 7 };
  if (performers >= 6) return { width: 9.2, depth: 5.75 };
  return { width: SP_ASSUMED_STAGE_M.width, depth: SP_ASSUMED_STAGE_M.depth };
}
export function spStageMeters(p: SpProject): { width: number; depth: number; toScale: boolean } {
  const { width, depth, unit } = p.stage;
  if (width && depth) {
    const k = unit === 'ft' ? 0.3048 : 1;
    return { width: width * k, depth: depth * k, toScale: true };
  }
  const assumed = spAssumedStageM(p.performers.length);
  // a circular stage in the round is as deep as it is wide (2026-11-13)
  if (p.stage.shape === 'round' && p.stage.roundForm !== 'square') return { width: assumed.width * 0.8, depth: assumed.width * 0.8, toScale: false };
  return { ...assumed, toScale: false };
}

/** An object's box in METERS on the drawing: where its center is and how big
 *  its symbol is. A sized object uses the band's own width and depth. */
export function spObjectBoxM(p: SpProject, o: SpObject): { cx: number; cy: number; w: number; h: number; rot: number } {
  const st = spStageMeters(p);
  const sym = spSymbol(o.kind);
  const w = spIsSized(o.kind) && o.w ? o.w * st.width : sym.w;
  const h = spIsSized(o.kind) && o.h ? o.h * st.depth : sym.h;
  return { cx: o.x * st.width, cy: o.y * st.depth, w, h, rot: o.rot };
}

/** A symbol's shapes placed for one object: scaled (sized kinds), turned by
 *  the object's rotation and moved to its place. Every renderer draws this
 *  list, so none of them repeats the geometry. Circles stay circles (a sized
 *  kind has none). */
export function spPlacedShapes(p: SpProject, o: SpObject): SpShape[] {
  const b = spObjectBoxM(p, o);
  const sized = spIsSized(o.kind);
  const sx = sized ? b.w : 1;
  const sy = sized ? b.h : 1;
  const a = (b.rot * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const pt = (x: number, y: number): [number, number] => {
    const X = x * sx;
    const Y = y * sy;
    return [b.cx + X * cos - Y * sin, b.cy + X * sin + Y * cos];
  };
  const out: SpShape[] = [];
  for (const s of spSymbol(o.kind).shapes) {
    if (s.t === 'circle') {
      const [cx, cy] = pt(s.cx, s.cy);
      out.push({ ...s, cx, cy });
    } else if (s.t === 'line') {
      const [x1, y1] = pt(s.x1, s.y1);
      const [x2, y2] = pt(s.x2, s.y2);
      out.push({ ...s, x1, y1, x2, y2 });
    } else if (s.t === 'poly') {
      const pts: number[] = [];
      for (let k = 0; k + 1 < s.pts.length; k += 2) pts.push(...pt(s.pts[k], s.pts[k + 1]));
      out.push({ ...s, pts });
    } else {
      // a rectangle becomes its four corners, so any rotation is exact
      const c = [pt(s.x, s.y), pt(s.x + s.w, s.y), pt(s.x + s.w, s.y + s.h), pt(s.x, s.y + s.h)];
      out.push({ t: 'poly', pts: c.flat(), closed: true, fill: s.fill ?? 'none', dash: !!s.dash });
    }
  }
  return out;
}
