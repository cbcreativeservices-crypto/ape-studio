/**
 * C10 HARP — where things are (charter §2 layer 2), frame H (harpSpec.ts):
 * the soundbox as a chain of capsules leaning back, the pillar, the crown,
 * the neck, the base and its pedals; the strings and the harpist's hands as
 * one keep-out (a sector between the board, the pillar and the neck, ±17 cm
 * either side of the strings); the harpist, the chair, the feet. Clearances
 * and the harpist are ILLUSTRATIVE.
 */
import type { Envelope, InstrumentModel, Part, Provenance, ReferenceSurface, RefLine, Rim, Shape3, VariantId } from '../../engine/model/types.ts';
import { dd, HARP_SIZES, type HarpGeom } from './harpSpec.ts';
import { HARPIST, HP, LV, v3 } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const dflt = ill('a drawing default (harp/GEOMETRY_PROPOSAL.md)');
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Shape3 => ({ kind: 'box', min: { x: Math.min(x0, x1), y: Math.min(y0, y1), z: Math.min(z0, z1) }, max: { x: Math.max(x0, x1), y: Math.max(y0, y1), z: Math.max(z0, z1) } });

export const HARP_CLEAR = {
  box: dd(15, 'clearance from the soundbox and its finish'),
  neck: dd(15, 'clearance from the neck, the crown and the pillar'),
};

function harpParts(g: HarpGeom, pre: 'hp' | 'lv', V: VariantId[]): Part[] {
  const k = g.scale;
  const out: Part[] = [];
  const segs = [0, 0.25, 0.5, 0.75, 1];
  for (let i = 0; i < segs.length - 1; i++) {
    const f0 = segs[i];
    const f1 = segs[i + 1];
    const c = (f: number) => {
      const p = g.boardAt(f);
      const d = g.depthAt(f) / 2;
      return { x: p[0] - g.n[0] * d, y: p[1] - g.n[1] * d, z: 0 };
    };
    out.push({
      id: i === 0 ? `${pre}.box` : `${pre}.box${i}`,
      label: 'soundbox',
      short: 'soundbox',
      role: 'The long body leaning back onto the harpist’s right shoulder. Its front is the soundboard; its back carries the sound holes.',
      clearance: HARP_CLEAR.box,
      prov: { kind: 'trial', src: 'MET-ERARD', note: 'the board’s resonating length and greatest width; the box’s depth is a drawing default' },
      variants: V,
      listIn: i === 0 ? undefined : [],
      solid: { kind: 'capsule', a: c(f0), b: c(f1), r: (g.depthAt(f0) + g.depthAt(f1)) / 4 },
    });
  }
  out.push(
    { id: `${pre}.board`, label: 'soundboard', short: 'soundboard', role: 'The thin board down the soundbox’s front, where the strings are anchored. The strings pull on it and it moves the air — the harp’s main source of sound.', prov: { kind: 'trial', src: 'MET-ERARD', note: '"Soundboard: resonating L.: 132.8 cm; greatest W.: 39 cm"' }, variants: V },
    { id: `${pre}.holes`, label: 'sound holes', short: 'sound holes', role: 'Openings along the back of the soundbox, toward the harpist. Air from inside the box comes out here; the second from the bottom is a place for a concealed miniature, with the owner’s agreement.', prov: { kind: 'sourced', src: 'DPA-HARP', quote: 'try the second sound hole from the bottom' }, variants: V },
    { id: `${pre}.strings`, label: 'strings', short: 'strings', role: `${pre === 'hp' ? 'About 47' : 'Fewer, shorter'} strings between the soundboard and the neck — the longest by the pillar, the shortest at the top of the board. The harpist’s hands work on both sides of them.`, moving: true, prov: { kind: 'trial', src: 'MET-ERARD', note: 'longest 155.7 cm, shortest 6.5 cm' }, variants: V },
    { id: `${pre}.neck`, label: 'neck', short: 'neck', role: 'The curved arm along the top, holding the tuning pins' + (pre === 'lv' ? ' and the levers that sharpen each string.' : ' and the discs the pedals turn.'), clearance: HARP_CLEAR.neck, prov: dflt, variants: V },
    { id: `${pre}.pillar`, label: 'pillar', short: 'pillar', role: 'The column at the front, carrying the neck’s pull down to the base' + (pre === 'hp' ? ' (and, inside it, the pedal rods).' : '.'), clearance: HARP_CLEAR.neck, prov: { kind: 'trial', src: 'MET-ERARD', note: '"L. of pillar: 165.7 cm"' }, variants: V, solid: { kind: 'capsule', a: v3(g.pillar.a), b: v3(g.pillar.b), r: g.pillar.r } },
    { id: `${pre}.crown`, label: 'crown', short: 'crown', role: 'The top of the pillar — the tallest point of the harp. A spot mic often starts near here, looking down at the soundboard.', clearance: HARP_CLEAR.neck, prov: pre === 'hp' ? { kind: 'sourced', src: 'DPA-HARP', quote: 'a full sized pedal harp with its 190 cm height' } : dflt, variants: V, solid: { kind: 'capsule', a: { x: g.crown.c[0], y: g.crown.top + g.crown.r, z: 0 }, b: { x: g.crown.c[0], y: g.crown.c[1] + 40 * k, z: 0 }, r: g.crown.r } },
    { id: `${pre}.base`, label: 'base', short: 'base', role: 'The plinth the harp stands on' + (pre === 'hp' ? ', with the pedals round it.' : '.'), prov: dflt, variants: V, solid: box(g.base.x0, g.base.y0, -g.base.hw, g.base.x1, 0, g.base.hw) },
  );
  // The neck as capsules through its lower edge (raised by its own depth).
  const nk = g.neck;
  for (let i = 0; i + 4 < nk.length; i += 4) {
    const a = nk[i];
    const b = nk[Math.min(nk.length - 1, i + 4)];
    out.push({ id: `${pre}.neck${i}`, label: 'neck', short: 'neck', role: 'The neck.', clearance: HARP_CLEAR.neck, prov: dflt, variants: V, listIn: [], solid: { kind: 'capsule', a: { x: a[0], y: a[1] - 32 * k, z: 0 }, b: { x: b[0], y: b[1] - 32 * k, z: 0 }, r: 36 * k } });
  }
  if (g.pedals) out.push({ id: `${pre}.pedals`, label: 'pedals', short: 'pedals', role: 'Seven pedals round the base, worked by the harpist’s feet to change the strings’ pitches — they move, and they knock: keep stands, cables and mics clear of them.', moving: true, prov: { kind: 'unknown', needed: 'the pedals’ count and layout (drawing default)' }, variants: V, solid: box(g.base.x0 - 130, -70, -g.base.hw, g.base.x0 + 10, 0, g.base.hw) });
  return out;
}

/** The strings and the harpist's hands: a sector from the board's foot,
 *  between the board and the pillar, ±17 cm either side of the strings. */
function stringsEnvelope(g: HarpGeom, V: VariantId[], pre: string): Envelope {
  const p0 = v3(g.b0);
  const a0 = Math.atan2(g.b1[1] - g.b0[1], g.b1[0] - g.b0[0]);
  const a1 = Math.atan2(g.pillar.b[1] - g.b0[1], g.pillar.b[0] - g.pillar.r - g.b0[0]);
  const r1 = Math.max(...g.neck.map(([x, y]) => Math.hypot(x - g.b0[0], y - g.b0[1]))) - 20;
  return { id: `${pre}.hands`, label: 'the strings and the harpist’s hands', shape: { kind: 'sweep', pivot: p0, r0: 0, r1, a0, a1, halfW: 170 }, prov: ill('the hands work both sides of the strings: ±17 cm, the lab’s drawing'), variants: V };
}

const PV: VariantId[] = ['pedal'];
const LVV: VariantId[] = ['lever'];
const ALL: VariantId[] = ['pedal', 'lever'];
const h = HARPIST;

const parts: Part[] = [
  ...harpParts(HP, 'hp', PV),
  ...harpParts(LV, 'lv', LVV),
  { id: 'chair', label: 'the harpist and the chair', short: 'harpist', role: 'The harpist sits behind the harp with the soundbox on their right shoulder, reaching round both sides of the strings. Nothing goes over their head, in their reach, or across their view of the music.', prov: ill('GEOMETRY_PROPOSAL: seated at x = −750, seat 550 (drawing defaults)'), variants: ALL, solid: box(h.seat.x0, h.seat.y - 50, -h.seat.hw, h.seat.x1, 0, h.seat.hw) },
];

const envelopes: Envelope[] = [
  stringsEnvelope(HP, PV, 'hp'),
  stringsEnvelope(LV, LVV, 'lv'),
  { id: 'harpist', label: 'the harpist', shape: box(-1000, h.head.y - h.headR - 20, -430, -580, h.seat.y, 140), prov: ill('the seated harpist (drawing default)'), variants: ALL },
  { id: 'hp.feet', label: 'the harpist’s feet and the pedals', shape: box(HP.base.x0 - 330, -170, -330, HP.base.x0 + 40, 0, 330), prov: ill('the feet on the pedals'), variants: PV },
  { id: 'lv.feet', label: 'the harpist’s feet', shape: box(-600, -170, -330, LV.base.x0, 0, 330), prov: ill('the feet'), variants: LVV },
];

const surf = (g: HarpGeom, S: string, V: VariantId[], pre: string): ReferenceSurface[] => [
  { id: `board${S}`, partId: `${pre}.board`, label: 'the soundboard', point: v3(g.boardAt(0.5)), normal: { x: g.n[0], y: g.n[1], z: 0 }, plus: { words: 'out from', key: 'OUT FROM' }, minus: { words: 'behind', key: 'BEHIND' }, variants: V },
  { id: `crown${S}`, partId: `${pre}.crown`, label: 'the crown', point: { x: g.crown.c[0], y: g.crown.top, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: V },
  { id: `hole${S}`, partId: `${pre}.holes`, label: 'the sound hole', point: v3(g.holes[1].c), normal: { x: -g.n[0], y: -g.n[1], z: 0 }, plus: { words: 'out from', key: 'OUT FROM' }, minus: { words: 'inside', key: 'INSIDE' }, variants: V },
];
const surfaces: ReferenceSurface[] = [
  ...surf(HP, '', PV, 'hp'),
  ...surf(LV, 'L', LVV, 'lv'),
  { id: 'floor', partId: 'chair', label: 'the floor', point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
];
const lines: RefLine[] = [{ id: 'centre', label: 'the strings', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 0, z: 1 }, plane: true, words: { plus: 'to the right of', minus: 'to the left of', keyPlus: 'RIGHT OF STRINGS', keyMinus: 'LEFT OF STRINGS' } }];

const rimOf = (g: HarpGeom, V: VariantId[], id: string): Rim => ({ id, label: 'the sound hole’s edge', c: v3(g.holes[1].c), axis: { x: -g.n[0], y: -g.n[1], z: 0 }, r: 40 * g.scale, variants: V });

export const HARP_MODEL: InstrumentModel = {
  id: 'harp',
  name: 'harp',
  parts,
  regions: [
    { id: 'r.low', partId: 'hp.board', label: 'low board', anchor: v3(HP.boardAt(0.3)), prov: dflt, variants: PV, note: 'The lower part of the soundboard, where the longer strings pull: it sends sound out from its face, toward the strings and the room in front.' },
    { id: 'r.high', partId: 'hp.board', label: 'high board', anchor: v3(HP.boardAt(0.7)), prov: dflt, variants: PV, note: 'The upper part of the soundboard, where the shorter strings pull.' },
    { id: 'r.holes', partId: 'hp.holes', label: 'sound holes', anchor: v3(HP.holes[1].c), prov: dflt, variants: PV, note: 'Air from inside the soundbox leaves through the holes in its back, toward the harpist.' },
    { id: 'r.lowL', partId: 'lv.board', label: 'low board', anchor: v3(LV.boardAt(0.3)), prov: dflt, variants: LVV, note: 'The lower part of the soundboard sends sound out from its face.' },
    { id: 'r.highL', partId: 'lv.board', label: 'high board', anchor: v3(LV.boardAt(0.7)), prov: dflt, variants: LVV, note: 'The upper part of the soundboard, where the shorter strings pull.' },
    { id: 'r.holesL', partId: 'lv.holes', label: 'sound holes', anchor: v3(LV.holes[1].c), prov: dflt, variants: LVV, note: 'Air leaves through the holes in the back.' },
  ],
  surfaces,
  lines,
  envelopes,
  variants: [
    { id: 'pedal', label: 'CONCERT PEDAL HARP', blurb: 'A full-size pedal harp, about 1.9 m tall: the pedals round the base change the strings’ pitches.', phrase: 'its pedals' },
    { id: 'lever', label: 'LEVER HARP', blurb: 'A smaller lever (Celtic) harp — levers on the neck instead of pedals, a different scale and balance. Don’t copy a concert harp’s measurements without listening.', phrase: 'its levers' },
  ],
  defaultVariant: 'pedal',
  views: { side: { u0: -1200, u1: 1000, v0: -2250, v1: 60 }, top: { u0: -1200, u1: 1000, v0: -950, v1: 950 } },
  viewsByVariant: { lever: { side: { u0: -1200, u1: 900, v0: -2000, v1: 60 }, top: { u0: -1200, u1: 900, v0: -950, v1: 950 } } },
  aimAzLimit: 180,
  yFloor: { mm: 0, prov: { kind: 'illustrative', reason: 'the frame’s floor (y = 0)' } },
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  rims: [rimOf(HP, PV, 'rim.hole'), rimOf(LV, LVV, 'rim.holeL')],
  ports: { pedal: null, lever: null },
};

export const HARP_HEIGHT = HARP_SIZES.height;
