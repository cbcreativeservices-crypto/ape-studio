/**
 * pathLayout — the geometry AND topology of the De-Esser lab's signal-flow
 * drawing (page 3), as pure data, so the drawing (deEsserViz PathDiagram)
 * and its ratchet test (test/wiringFix_r3_deesser_20261021) read the SAME
 * boxes and wires.
 *
 * DE-R2-01 (wiring round 2, fixed 2026-10-21): split-band mode used to be the
 * broadband drawing with the gain box relabelled "gain · hiss band" — no band
 * split, no recombining sum. Split-band is now drawn as a working engineer
 * would: the input is SPLIT into the hiss band (around the detector
 * frequency) and the rest of the voice; only the hiss band passes through the
 * gain element; the two bands are SUMMED back to the output. The side chain
 * (a copy of the input → band-pass → detector → threshold → gain computer) is
 * the same in both modes, and its dashed control line always lands on the
 * gain element — which in broadband mode carries the whole voice. This
 * matches deEsserModel.processFrame: split → outBody untouched, outHiss × g;
 * broadband → both × g.
 *
 * Units are the drawing's 340-unit viewBox. Solid = audio (cyan main path,
 * gold side-chain copy); dashed = control.
 */
import type { Mode } from '../../../features/deesser/deEsserModel';

export type PathBoxId = 'in' | 'split' | 'gain' | 'sum' | 'out' | 'bpf' | 'det' | 'thr' | 'gc';
export type PathBox = {
  id: PathBoxId;
  x: number; y: number; w: number; h: number;
  /** main = the voice's own path (cyan); side = the side chain (gold). */
  row: 'main' | 'side';
  /** One label line per entry, drawn centred, uppercase. */
  label: string[];
};
/** audio = the voice; copy = the side chain's audio copy; control = the
 *  gain computer's instruction (not audio). */
export type WireKind = 'audio' | 'copy' | 'control';
export type PathWire = {
  from: PathBoxId; to: PathBoxId; kind: WireKind;
  /** Which band an audio wire carries (split mode only). */
  band?: 'hiss' | 'rest';
  /** Polyline, first point on (or at the junction beside) `from`, last point
   *  on the edge of `to`; the arrowhead's tip is the last point. */
  pts: [number, number][];
};
export type PathText = {
  x: number; y: number; text: string;
  tone: 'muted' | 'cyan' | 'gold' | 'orange';
  anchor: 'start' | 'middle' | 'end';
};
export type PathLayout = {
  mode: Mode;
  /** viewBox height (width is always 340). */
  h: number;
  boxes: PathBox[];
  wires: PathWire[];
  /** The tap dot where the side-chain copy leaves the input line. */
  junction: [number, number];
  texts: PathText[];
};

export const PATH_W = 340;
/** Box height of a single-lane box. */
export const PATH_BH = 30;
/** Smallest text in the drawing, viewBox units (9 pt at a 343-pt-wide phone). */
export const PATH_LBL = 9;
export const PATH_H_BROADBAND = 160;
export const PATH_H_SPLIT = 200;

export function pathHeight(mode: Mode): number {
  return mode === 'split' ? PATH_H_SPLIT : PATH_H_BROADBAND;
}

/** The split band's centre, written the way the lab writes it elsewhere. */
export function bandLabel(freqHz: number): string {
  const k = freqHz / 1000;
  return `near ${k >= 10 ? k.toFixed(0) : k.toFixed(1)} kHz`;
}

/** Text width estimate (viewBox units at PATH_LBL), measured off artshot
 *  renders: Barlow Medium ≈ 4.1 per character, Oswald Medium caps ≈ 4.5. */
export function textWidth(text: string, face: 'barlow' | 'oswald'): number {
  return text.length * (face === 'oswald' ? 4.5 : 4.1);
}

const sideChain = (y: number, xs: [number, number, number, number], ws: [number, number, number, number]): PathBox[] => [
  { id: 'bpf', x: xs[0], y, w: ws[0], h: PATH_BH, row: 'side', label: ['band-pass'] },
  { id: 'det', x: xs[1], y, w: ws[1], h: PATH_BH, row: 'side', label: ['detector'] },
  { id: 'thr', x: xs[2], y, w: ws[2], h: PATH_BH, row: 'side', label: ['threshold'] },
  { id: 'gc', x: xs[3], y, w: ws[3], h: PATH_BH, row: 'side', label: ['gain comp.'] },
];
const scWires = (bx: PathBox[]): PathWire[] => {
  const by = (id: PathBoxId) => bx.find((b) => b.id === id)!;
  const order: PathBoxId[] = ['bpf', 'det', 'thr', 'gc'];
  return order.slice(1).map((to, i) => {
    const a = by(order[i]), b = by(to), y = a.y + a.h / 2;
    return { from: order[i], to, kind: 'copy' as const, pts: [[a.x + a.w, y], [b.x, y]] as [number, number][] };
  });
};

/** Broadband: the drawing as graded A-level in round 2 (unchanged geometry). */
function broadband(): PathLayout {
  const boxes: PathBox[] = [
    { id: 'in', x: 12, y: 24, w: 48, h: PATH_BH, row: 'main', label: ['input'] },
    { id: 'gain', x: 100, y: 24, w: 110, h: PATH_BH, row: 'main', label: ['gain · whole voice'] },
    { id: 'out', x: 266, y: 24, w: 60, h: PATH_BH, row: 'main', label: ['output'] },
    ...sideChain(104, [44, 122, 192, 266], [64, 56, 60, 60]),
  ];
  return {
    mode: 'broadband',
    h: PATH_H_BROADBAND,
    boxes,
    junction: [76, 39],
    wires: [
      { from: 'in', to: 'gain', kind: 'audio', pts: [[60, 39], [100, 39]] },
      { from: 'gain', to: 'out', kind: 'audio', pts: [[210, 39], [266, 39]] },
      { from: 'in', to: 'bpf', kind: 'copy', pts: [[76, 42], [76, 104]] },
      ...scWires(boxes),
      { from: 'gc', to: 'gain', kind: 'control', pts: [[296, 104], [296, 80], [168, 80], [168, 54]] },
    ],
    texts: [
      { x: 12, y: 15, text: 'MAIN PATH · the voice', tone: 'muted', anchor: 'start' },
      { x: 82, y: 68, text: 'copy of the voice', tone: 'gold', anchor: 'start' },
      { x: 232, y: 75, text: 'control · turn down N dB', tone: 'gold', anchor: 'middle' },
      { x: 12, y: 151, text: 'SIDE CHAIN · what it listens to', tone: 'muted', anchor: 'start' },
    ],
  };
}

/** Split-band: input → band split → (rest of the voice ─────────────┐)
 *                                   (hiss band → gain element ─────┴→ sum → output
 *  with the side chain under it and its control line rising into the gain
 *  element on the hiss lane. The rest lane runs ABOVE the hiss lane so the
 *  control line reaches the gain element without crossing any audio. */
function split(freqHz: number): PathLayout {
  const REST_Y = 46, HISS_Y = 96, MID_Y = 71;
  const TALL_Y = REST_Y - 15, TALL_H = HISS_Y - REST_Y + PATH_BH;
  const SC_Y = 146;
  const boxes: PathBox[] = [
    { id: 'in', x: 10, y: MID_Y - PATH_BH / 2, w: 32, h: PATH_BH, row: 'main', label: ['input'] },
    { id: 'split', x: 62, y: TALL_Y, w: 40, h: TALL_H, row: 'main', label: ['band', 'split'] },
    { id: 'gain', x: 172, y: HISS_Y - PATH_BH / 2, w: 56, h: PATH_BH, row: 'main', label: ['gain'] },
    { id: 'sum', x: 244, y: TALL_Y, w: 26, h: TALL_H, row: 'main', label: ['sum'] },
    { id: 'out', x: 284, y: MID_Y - PATH_BH / 2, w: 42, h: PATH_BH, row: 'main', label: ['output'] },
    ...sideChain(SC_Y, [24, 100, 172, 248], [60, 56, 60, 60]),
  ];
  const gainCx = 172 + 56 / 2, gcCx = 248 + 60 / 2, CTL_Y = 128, JX = 50;
  return {
    mode: 'split',
    h: PATH_H_SPLIT,
    boxes,
    junction: [JX, MID_Y],
    wires: [
      { from: 'in', to: 'split', kind: 'audio', pts: [[42, MID_Y], [62, MID_Y]] },
      { from: 'split', to: 'sum', kind: 'audio', band: 'rest', pts: [[102, REST_Y], [244, REST_Y]] },
      { from: 'split', to: 'gain', kind: 'audio', band: 'hiss', pts: [[102, HISS_Y], [172, HISS_Y]] },
      { from: 'gain', to: 'sum', kind: 'audio', band: 'hiss', pts: [[228, HISS_Y], [244, HISS_Y]] },
      { from: 'sum', to: 'out', kind: 'audio', pts: [[270, MID_Y], [284, MID_Y]] },
      { from: 'in', to: 'bpf', kind: 'copy', pts: [[JX, MID_Y + 3], [JX, SC_Y]] },
      ...scWires(boxes),
      { from: 'gc', to: 'gain', kind: 'control', pts: [[gcCx, SC_Y], [gcCx, CTL_Y], [gainCx, CTL_Y], [gainCx, HISS_Y + PATH_BH / 2]] },
    ],
    texts: [
      { x: 12, y: 15, text: 'MAIN PATH · the voice, in two bands', tone: 'muted', anchor: 'start' },
      { x: 108, y: REST_Y - 6, text: 'rest of the voice · untouched', tone: 'cyan', anchor: 'start' },
      { x: 108, y: HISS_Y - 6, text: 'hiss band', tone: 'orange', anchor: 'start' },
      { x: 108, y: HISS_Y + 11, text: bandLabel(freqHz), tone: 'orange', anchor: 'start' },
      { x: JX + 6, y: 130, text: 'copy of the voice', tone: 'gold', anchor: 'start' },
      { x: gainCx + 6, y: CTL_Y - 5, text: 'control · turn down N dB', tone: 'gold', anchor: 'start' },
      { x: 12, y: 193, text: 'SIDE CHAIN · what it listens to', tone: 'muted', anchor: 'start' },
    ],
  };
}

export function pathLayout(mode: Mode, freqHz: number): PathLayout {
  return mode === 'split' ? split(freqHz) : broadband();
}

/** The order the page's NEXT BLOCK / WALK THE SIGNAL steps through. */
export function pathOrder(mode: Mode): PathBoxId[] {
  return mode === 'split'
    ? ['in', 'split', 'bpf', 'det', 'thr', 'gc', 'gain', 'sum', 'out']
    : ['in', 'bpf', 'det', 'thr', 'gc', 'gain', 'out'];
}
