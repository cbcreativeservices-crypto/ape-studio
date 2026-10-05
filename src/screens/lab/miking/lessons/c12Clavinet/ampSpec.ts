/**
 * C12 CLAVINET — the numbers. The miked source is the AMPLIFIER the clavinet
 * plays through (clavinet/GEOMETRY_PROPOSAL.md: reuse the C02 amp frame), so
 * this file is a lean, generic amp in frame C plus the clavinet itself for
 * the stage plan and the mechanism drawing.
 *
 * FRAME C (speaker_leslie/GEOMETRY_PROPOSAL.md Part A, restated): origin at
 * the centre of the speaker's cone on the baffle's front plane; +x out toward
 * the mic (the audience side); +y down; +z to the listener's right facing the
 * cabinet. The grille cloth stands 15 mm proud of the baffle (drawing
 * default). The floor is 190 mm below the speaker's centre in both cabinets.
 *
 * ONE AMP FAMILY (integrator, 2026-10-05): the cabinets are the shared
 * speaker family's (lessons/shared/speakers: the open-backed `combo12` and
 * the closed `1x12`) — their boxes come from cabDraw() and art.tsx draws
 * them with the family's CabSection. Only the clavinet's own extras (the
 * open-back opening's words, the stage layout) are defined here.
 *
 * Classes: SOURCED (a source's own number), TRIAL (a real instrument's size,
 * not the lesson's), placeholder (a drawing default named in the unknowns).
 */
import type { Dim, Provenance } from '../../engine/model/types.ts';
import { cabDraw } from '../shared/speakers/cabGeometry.ts';
import { comboParts } from '../shared/speakers/ampModel.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

/** The 12-in speaker (frame C, about its own centre). */
export const SPEAKER = {
  nominal: { mm: 305, prov: trial('CEL-V30', '"Nominal Diameter 305mm / 12in"') } as Dim,
  rCone: { mm: 141.5, prov: trial('CEL-V30', '"Cut-out diameter 283mm": the visible cone edge at half of it') } as Dim,
  rDust: dd(50, 'the dust cap’s radius (not on the datasheet; drawing default)'),
  rSurround: dd(128, 'the surround’s inner radius (drawing default)'),
};
export const GRILLE_X = 15;

export type AmpKind = 'combo' | 'cab';
export type AmpBox = {
  kind: AmpKind;
  /** The cabinet in frame C: x back..front (front = the grille), y top..bottom, z left..right. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  open: boolean;
  /** An open back: the opening between y = openY0 and openY1 (the rest is panel). */
  openY0: number;
  openY1: number;
  /** The combo's chassis (controls along the top front, tubes hanging at the back). */
  chassis: { y0: number; y1: number } | null;
};

/** The combo: sizes from a real open-backed 1×12 combo (TRIAL); the speaker
 *  60 mm right of the cabinet's centre and 255 mm below its top (drawing
 *  defaults, the C02 proposal). The closed 1×12 cabinet: a real cabinet's
 *  sizes (TRIAL), the speaker 45 mm above its centre (drawing default). */
export const AMP_SIZES = {
  comboW: { mm: 622, prov: trial('FEN-65DR-MAN', '24.5 in = 622 mm wide') } as Dim,
  comboH: { mm: 445, prov: trial('FEN-65DR-MAN', '17.5 in = 445 mm high') } as Dim,
  comboD: { mm: 241, prov: trial('FEN-65DR-MAN', '9.5 in = 241 mm deep') } as Dim,
  cabW: { mm: 500, prov: trial('MAR-MX112', '"Width 500 mm / 19.7""') } as Dim,
  cabH: { mm: 470, prov: trial('MAR-MX112', '"Height 470 mm / 18.5""') } as Dim,
  cabD: { mm: 290, prov: trial('MAR-MX112', '"Depth 290 mm / 11.4""') } as Dim,
};
export const AMP_DIMS = {
  openBack: dd(250, 'the open back’s opening (between the chassis panel and the bottom rail)'),
}
const D = (k: keyof typeof AMP_DIMS) => AMP_DIMS[k].mm;

export function ampBox(kind: AmpKind): AmpBox {
  if (kind === 'combo') {
    // The family's open-backed 1×12 combo (the same TRIAL sizes, speaker 60 mm
    // right of centre and 255 mm below the top).
    const { c, chassis } = comboParts('open');
    const chassisY1 = chassis.y1;
    return { kind, ...c.box, open: true, openY0: chassisY1 + 10, openY1: chassisY1 + 10 + D('openBack'), chassis: { y0: c.box.y0, y1: chassisY1 } };
  }
  // The family's closed 1×12 cabinet (the speaker centred on the baffle).
  const c = cabDraw('1x12', 'closed');
  return { kind, ...c.box, open: false, openY0: 0, openY1: 0, chassis: null };
}
/** The floor under each cabinet (each stands on it): the combo's 190 mm and
 *  the closed cabinet's 235 mm below the speaker's centre. */
export const FLOOR_Y = cabDraw('combo12', 'open').floorY;
export const FLOOR_Y_CAB = cabDraw('1x12', 'closed').floorY;

/* ── the clavinet (for the stage plan and the mechanism drawing) ── */
export const CLAV = {
  keys: { mm: 60, prov: src('HOH-D6', '60 piano keys with a range from contra F to e\'\'\'') } as Dim,
  output: { mm: 100, prov: src('HOH-D6', 'Output 100 mV') } as Dim,
  /** The case: a drawing default (the leaflet gives no dimensions). */
  caseW: dd(1000, 'the clavinet case’s width'),
  caseD: dd(450, 'the clavinet case’s depth'),
};
/** The lowest and highest notes (contra F, e'''): F1 and E6 in equal temperament. */
export const CLAV_RANGE_HZ = { low: 43.65, high: 1318.5 };

/** The stage layout (frame C, plan mm; ILLUSTRATIVE): the amp behind the
 *  keyboardist, who faces the audience (+x) with the clavinet in front. */
export const LAYOUT = {
  clav: { x0: 1300, x1: 1750, z0: -1500, z1: -500 },
  player: { x: 1080, z: -1000 },
  pedals: { x: 1080, z: -650 },
};
