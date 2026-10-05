/**
 * M07b CONCERT SNARE — the technical truth (charter §2 layer 1). Keys point
 * into docs/labs/miking/concert_snare/SOURCES.md (and snare/SOURCES.md for
 * the kit-snare figures the lesson borrows). Frame: the shared drum family's
 * (drums/drumSpec.ts): origin = the BATTER-HEAD centre, +x toward the
 * audience (away from the player), +y DOWN, +z the player's right; the drum
 * stands upright (its axis +y) on a concert stand.
 *
 * Owner ruling 2026-10-04: the learner sees starting points only; `src`,
 * `quote`, every `prov` and the unknowns are the internal record.
 */
import type { Dim, DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { CONCERT_SNARE_14x65 } from '../shared/drums/concertSpec.ts';
import { hoopRadii } from '../shared/drums/drumSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export const SPEC = CONCERT_SNARE_14x65;
export const R = SPEC.d.mm / 2;
export const D = SPEC.depth.mm;
export const HOOP = hoopRadii(SPEC);
/** The rim's top edge (the hoop stands above the head). */
export const RIM_Y = -SPEC.hoop.above.mm;

export const CSN_DIMS = {
  /** Batter height above the floor for a standing player on a concert stand
   *  (concert_snare/GEOMETRY_PROPOSAL: drawing default 800, UNKNOWN). */
  batterH: placeholder(800, 'batter height on a concert stand for a standing player'),
  /** The stick's reach above the head on the player's side (proposal:
   *  "up to 450 above the head", ILLUSTRATIVE). */
  stickH: { mm: 450, prov: ill('the lesson asks for "the highest and widest stick motion"; no source gives a height') } as Dim,
  stickR: { mm: R + 250, prov: ill('the sticks’ reach past the rim on the player’s side: no source gives it') } as Dim,
  headClear: { mm: 8, prov: ill('head excursion: no source gives a number') } as Dim,
} as const;

export const FLOOR_Y = CSN_DIMS.batterH.mm;

const BOTH = ['orchDyn', 'orchSdc'];

/* ── RECOMMENDED STARTING POINTS (lesson L20-L31; corrections CS-01, CS-02 in
 *  CORRECTIONS_LOG.md). No source gives a CONCERT-snare number: the close
 *  figures are the kit snare's, borrowed (internal record), and the app says
 *  "a starting point to adjust with the player". ── */
export const CSN_ZONES: DocumentedZone[] = [
  {
    id: 'csn.top',
    label: 'Close, just outside the rim',
    band: 'Start about 2.5–7.5 cm (1–3 in) above the rim, just outside it, aimed across the head — then set the gap with the player.',
    kind: 'trial',
    src: 'S-SM57-UG',
    quote: '2.5 to 7.5 cm (1 to 3 in.) above rim of top head of drum. Aim mic at drum head.',
    refSurface: 'rim',
    side: 'outside',
    distance: { min: 25, max: 75 },
    radial: { line: 'rim', min: -30, max: 80, prov: ill('"just outside the rim": 3 cm in to 8 cm out from the rim edge is the lab’s drawing of it') },
    aimAt: { surface: 'batter', r: R * 0.9, prov: ill('"aim mic at drum head": the axis meets the head inside 90 % of its radius') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: R - 30, u1: R + 80, v0: RIM_Y - 75, v1: RIM_Y - 25 }, top: { u0: R - 30, u1: R + 80, v0: -110, v1: 110 } },
    start: { p: { x: R + 40, y: RIM_Y - 50, z: 0 }, az: 0, el: -15 },
    tendency: 'More direct detail and less room: crisp strokes and more of the snares’ edge. Rolls can sound less joined-up this close — check a soft roll, not only an accent.',
    checks: ['The whole stick path, with the player playing the passage', 'A soft roll and the loudest accent', 'Other percussion and monitors nearby'],
  },
  {
    id: 'csn.whole',
    label: 'A little farther, toward the centre',
    band: 'Start about 10 cm (4 in) or a little more from the drum, angled toward the centre of the head.',
    kind: 'trial',
    src: 'S-SM57-ART',
    quote: 'placing the mic a good 4 inches away from the snare and angled toward the center will ensure you capture the whole drum sound',
    refSurface: 'rim',
    side: 'outside',
    distance: { min: 101.6, max: 160 },
    bandProv: ill('"a good 4 inches" (at least about 10 cm): 10–16 cm above the rim is the lab’s band'),
    radial: { line: 'rim', min: -20, max: 160, prov: ill('beside the rim, not over the playing area: the lab’s drawing') },
    aimAt: { surface: 'batter', r: R * 0.5, prov: ill('"angled toward the center": the axis meets the head within half its radius') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: R - 20, u1: R + 160, v0: RIM_Y - 160, v1: RIM_Y - 100 }, top: { u0: R - 20, u1: R + 160, v0: -150, v1: 150 } },
    start: { p: { x: R + 60, y: RIM_Y - 120, z: 0 }, az: 0, el: -30 },
    tendency: 'More of the whole drum — head, shell and snares together — with a little more room and nearby percussion than the close spot.',
    checks: ['Clearance from the sticks at every stroke', 'Roll continuity against attack', 'Spill from cymbals and timpani'],
  },
  {
    id: 'csn.broad',
    label: 'Higher, above and to one side',
    band: 'Start above the drum and off to one side, well outside the sticks’ reach, aimed across the head — no set height: move it and listen.',
    kind: 'trial',
    src: 'LESSON-CSN',
    quote: 'begin outside the entire stick path above and to one side of the drum, aiming across the batter head',
    refSurface: 'batter',
    side: 'outside',
    distance: { min: 250, max: 650 },
    bandProv: ill('the lesson gives no number: 25–65 cm above the head is the lab’s drawing of "above"'),
    radial: { line: 'rim', min: 0, max: 450, prov: ill('"to one side": outside the rim, the lab’s drawing') },
    aimAt: { surface: 'batter', r: R, prov: ill('"aiming across the batter head": the axis meets the head') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: R, u1: R + 450, v0: -650, v1: -250 }, top: { u0: R, u1: R + 450, v0: -320, v1: 320 } },
    start: { p: { x: 300, y: -380, z: 200 }, az: -34, el: -46 },
    tendency: 'A more balanced drum-and-room picture, closer to what the ensemble mics hear — with more bleed and less gain before feedback on a loud stage.',
    checks: ['Quiet rolls and accents, not one loud hit', 'How much of the neighbours it hears', 'Whether the main pickup already does this job'],
  },
  {
    id: 'csn.bottom',
    label: 'Under the drum, toward the snares',
    band: 'Optional second mic: start just below the bottom rim, about 3–8 cm (1–3 in) under the snare-side head, aimed up at the snares.',
    kind: 'trial',
    src: 'S-SM57-UG',
    quote: 'If desired, place a second mic just below rim of bottom head.',
    refSurface: 'snareHead',
    side: 'outside',
    distance: { min: 30, max: 80 },
    bandProv: ill('"just below rim": 3–8 cm under the snare-side head is the drawing default (batch research, M02)'),
    radial: { line: 'rim', min: -60, max: 70, prov: ill('"just below rim": near the rim edge, the lab’s drawing') },
    aimAt: { surface: 'snareHead', r: R * 0.9, prov: ill('aimed up at the snares: the axis meets the snare-side head') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: R - 60, u1: R + 70, v0: D + 30, v1: D + 80 }, top: { u0: R - 60, u1: R + 70, v0: -110, v1: 110 } },
    start: { p: { x: R + 20, y: D + 55, z: 0 }, az: 0, el: 19 },
    tendency: 'More of the snares’ buzz — and of the stand, the throw-off and the floor. Try it only if it earns its channel next to the top mic.',
    checks: ['The stand, the throw-off lever and the cables', 'Both mics together in mono, both polarity states', 'Hiss and spill against what it adds'],
  },
];
