/**
 * I05d GÜIRO — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/guiro/SOURCES.md and shaker/SOURCES.md §0; geometry from
 * guiro/GEOMETRY_PROPOSAL.md on the small-percussion family (§A).
 *
 * FRAME H (smallperc/geom.ts). The güiro lies across the player's front
 * (along z), held in the LEFT hand through the grip holes underneath; its
 * ridges face up. P0 is the centre of the scraped area — the top of the
 * gourd at its middle. The scraper, in the right hand, runs along the ridges
 * and overshoots each end (forward and return). TWO STATES are the build (a
 * source control): GOURD (with a wooden scraper) and FIBERGLASS (a plastic
 * scraper, more than one playing surface) — the same drawing size.
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { add, armTo, drawingDefault, IN, mul, P0, src, targetZone, unit, v3, type Arm } from '../shared/smallperc/geom.ts';

export const GU_DIMS = {
  len: { mm: 381.0, prov: src('MET-GUIRO', '15 in. (38.1 cm)') } as Dim,
  dMax: drawingDefault(90, 'the güiro’s largest diameter (no source gives one)'),
  dMin: drawingDefault(60, 'the güiro’s end diameter'),
  pitch: drawingDefault(3, 'the ridge pitch'),
  hole: drawingDefault(22, 'the grip holes’ size'),
  scraper: drawingDefault(180, 'the scraper’s length'),
  over: drawingDefault(60, 'how far the scraper runs past each end of the ridges'),
  near: { mm: 300, prov: { kind: 'trial', src: 'LESSON-GUIRO', note: 'roughly 30–60 cm (1–2 ft) from the center of the actual scraped area' } } as Dim,
  far: { mm: 600, prov: { kind: 'trial', src: 'LESSON-GUIRO', note: 'roughly 30–60 cm (1–2 ft) from the center of the actual scraped area' } } as Dim,
  floor: { mm: 12 * IN, prov: src('S-HOME', 'Percussion – Aim the mic directly at the instrument, with a gap of at least 12” / 30cm.') } as Dim,
} as const;

export const GL = GU_DIMS.len.mm;
export const GR = GU_DIMS.dMax.mm / 2;
/** The ridged section: the middle 60 % of the length (a drawing default). */
export const RIDGE_HALF = 0.3 * GL;

export type GuId = 'gourd' | 'fiberglass';
export type GuState = {
  id: GuId;
  /** The gourd's axis centre (P0 is the top of it). */
  c: Vec3;
  /** The scraper: tip on the ridges at mid-stroke, and its far end. */
  scraper: { a: Vec3; b: Vec3 };
  hold: Arm;
  scrape: Arm;
};

function state(id: GuId): GuState {
  const c = v3(P0.x, P0.y + GR, P0.z);
  const tip = v3(P0.x + 6, P0.y - 2, 0);
  const hand = v3(tip.x - 135, tip.y - 70, tip.z + 50);
  const dir = unit(v3(hand.x - tip.x, hand.y - tip.y, hand.z - tip.z));
  return {
    id,
    c,
    scraper: { a: tip, b: add(tip, mul(dir, GU_DIMS.scraper.mm)) },
    // Fingers through the holes underneath, near the left end.
    hold: armTo('L', v3(-110, c.y + 70, -165), v3(-6, c.y + GR - 6, -115)),
    scrape: armTo('R', v3(hand.x - 82, hand.y + 30, hand.z + 25), hand),
  };
}

export const STATES: Readonly<Record<GuId, GuState>> = { gourd: state('gourd'), fiberglass: state('fiberglass') };
export const stateOf = (v: VariantId): GuState => STATES[v === 'fiberglass' ? 'fiberglass' : 'gourd'];

/** The scraper's whole travel: along the ridges and past each end by the
 *  overshoot, forward and return, with the right hand — one capsule. */
export function motionOf(_s: GuState): { a: Vec3; b: Vec3; r: number } {
  const z = RIDGE_HALF + GU_DIMS.over.mm;
  return { a: v3(P0.x - 50, P0.y - 50, -z), b: v3(P0.x - 50, P0.y - 50, z), r: 85 };
}

const BOTH = ['orchSdc', 'smallDynCard'];
const NEAR = GU_DIMS.near.mm;
const FAR = GU_DIMS.far.mm;
const BAND = 'Start about 30–60 cm (1–2 ft) from the middle of the scraped area';

function zonesFor(v: GuId): DocumentedZone[] {
  const tag = v === 'gourd' ? ' (gourd)' : ' (fiberglass)';
  return [
    targetZone({
      id: `gui.ridges.${v}`,
      label: `Higher, facing more of the ridges${tag}`,
      band: `${BAND}, higher and in front, facing more of the ridged surface — covering the whole stroke, outside the scraper’s path.`,
      kind: 'trial',
      src: 'LESSON-GUIRO',
      quote: 'Try a viewpoint facing more of the ridged surface',
      surface: `p0.${v}`,
      c: P0,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [30, 55],
      aimTol: 30,
      startD: 420,
      startA: 42,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 100 },
      tendency: 'More of the rasp: each ridge’s click. Closer favours a small section of the stroke; check both ends of a long scrape.',
      checks: ['Both ends of the longest scrape', 'Rasp against hollow body', 'The forward and the return stroke'],
    }),
    targetZone({
      id: `gui.body.${v}`,
      label: `In front, roughly level, for more body${tag}`,
      band: `${BAND}, in front of it and roughly level — a different height or angle that hears more body while still covering the whole stroke.`,
      kind: 'trial',
      src: 'LESSON-GUIRO',
      quote: 'a modestly different height or angle that hears more body while still covering the entire stroke',
      surface: `p0.${v}`,
      c: P0,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [NEAR, FAR],
      a: [0, 25],
      aimTol: 30,
      startD: 430,
      startA: 8,
      variants: [v],
      micTypeIds: BOTH,
      clear: { line: `clear.${v}`, min: 100 },
      tendency: 'More of the hollow resonance against the rasp — not a rule that one side is less harsh; compare by ear at matched level.',
      checks: ['Rasp against hollow body', 'Hand noise from the holding hand', 'Neighbours the mic now faces'],
    }),
  ];
}

/* ── RECOMMENDED STARTING POINTS (lesson L10-L14; corrections GU-xx). ── */
export const GU_ZONES: DocumentedZone[] = [...zonesFor('gourd'), ...zonesFor('fiberglass')];
