/**
 * M05 DJEMBE — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/djembe/SOURCES.md; frame H and the drawing defaults:
 * docs/labs/miking/djembe/GEOMETRY_PROPOSAL.md.
 *
 * A single-headed goblet drum, open at the bottom: a 12½ in goat head
 * (MEINL-HDJ500) on a carved shell, rope-tuned. The height sits inside the
 * typical 58–63 cm range (WP-DJEMBE); the waist, foot and opening sizes are
 * the geometry file's drawing defaults. Two values are NEW build defaults,
 * logged in CORRECTIONS_LOG.md (DJ-03, DJ-04) for the owner: the bowl's depth
 * (where the waist sits), and the raised support's height (200 mm, not the
 * file's 50 mm — a mic must fit "underneath", as the source says the foam was
 * there "to give a bit of clearance for a mic underneath").
 */
import type { Dim, DocumentedZone, Vec3 } from '../../engine/model/types.ts';
import { IN, drawingDefault, ill, src, type HandDrum } from '../shared/handdrums/handDrumModel.ts';

export const DJ_DIMS = {
  headD: { mm: 12.5 * IN, prov: src('MEINL-HDJ500', 'Head Diameter: 12.5"') } as Dim,
  height: { mm: 610, prov: { kind: 'trial', src: 'WP-DJEMBE', note: 'the geometry file’s 610 mm drawing default, inside the typical "height of 58–63 cm"' } } as Dim,
  waistD: drawingDefault(120, 'the waist’s diameter (drawing default 120 mm)'),
  footD: drawingDefault(280, 'the foot’s diameter (drawing default 280 mm)'),
  openingD: drawingDefault(240, 'the bottom opening’s diameter (drawing default 240 mm)'),
  bowlDepth: drawingDefault(330, 'how deep the bowl is above the waist (a build default, 330 mm)'),
  ringT: drawingDefault(10, 'the rope ring: how far it stands outside the head'),
  ringRise: drawingDefault(8, 'the rope ring: how far it stands above the head'),
  support: drawingDefault(200, 'the raised support’s height (a build default, 200 mm, so a mic fits underneath)'),
  handsUp: drawingDefault(300, 'how far the hands rise above the head (the geometry file’s illustrative 300 mm)'),
  headClear: { mm: 10, prov: ill('head motion: no source gives a number; the owner approves it') } as Dim,
} as const;

export const HEAD_Y = -DJ_DIMS.height.mm;
export const R = DJ_DIMS.headD.mm / 2;
export const WAIST_Y = HEAD_Y + DJ_DIMS.bowlDepth.mm;
export const R_WAIST = DJ_DIMS.waistD.mm / 2;
export const R_FOOT = DJ_DIMS.footD.mm / 2;
export const R_OPEN = DJ_DIMS.openingD.mm / 2;
/** A point down the bowl where its curve turns in (between the head and the waist). */
export const BELLY = { y: HEAD_Y + 160, r: 125 } as const;
export const SUPPORT = DJ_DIMS.support.mm;

export const DJEMBE: HandDrum = {
  id: 'djembe',
  name: 'djembe',
  label: 'djembe (12½ in head)',
  short: 'DJEMBE',
  c: { x: 0, z: 0 },
  headY: HEAD_Y,
  R,
  bottomY: 0,
  rBottom: R_FOOT,
  rim: { rise: DJ_DIMS.ringRise.mm, t: DJ_DIMS.ringT.mm },
  prov: { size: DJ_DIMS.headD.prov, height: DJ_DIMS.height.prov, shell: DJ_DIMS.waistD.prov },
};

/** The outer profile, head to foot (the drawing and the collision share it). */
export const PROFILE = [
  { y: HEAD_Y, r: R },
  { y: BELLY.y, r: BELLY.r },
  { y: WAIST_Y, r: R_WAIST },
  { y: 0, r: R_FOOT },
] as const;

/** The far top mic's line (COPPINGER): 16 in from the head centre, the mic
 *  above the head's OUTER EDGE (horizontal offset = the head radius) — so the
 *  line rises at asin(√(406.4² − R²) / 406.4) ≈ 67° (DJ-02). */
export const COP_DIST = 16 * IN;
export const DIAG_N: Vec3 = (() => {
  const h = Math.sqrt(COP_DIST * COP_DIST - R * R);
  return { x: R / COP_DIST, y: -h / COP_DIST, z: 0 };
})();

/** "2–4" above the drum head" (S-DUVEL). */
export const DUVEL_TOP = { min: 2 * IN, max: 4 * IN } as const;
/** "2" above the floor" (S-DUVEL): 3–8 cm is the lab's band about it. */
export const DUVEL_LOW = { min: 30, max: 80 } as const;
/** Toward the opening's centre from the low mic's nominal spot (260, 135). */
const LOW_AIM: Vec3 = (() => {
  const dx = -260;
  const dy = -(SUPPORT - 65);
  const l = Math.hypot(dx, dy);
  return { x: dx / l, y: dy / l, z: 0 };
})();

const STAND = ['hdDynCard', 'hdDynHyper', 'hdSdc'];
const SHORT = ['hdDynHyper', 'hdSdc'];

export const DJ_ZONES: DocumentedZone[] = [
  {
    id: 'dj.top.near',
    label: 'Close above the head, at an angle',
    band: 'Start about 5–10 cm (2–4 in) above the head, tilted 40–60° from straight down, on the audience side — outside the hands.',
    kind: 'sourced',
    src: 'S-DUVEL',
    quote: 'one 2–4" above the drum head at a 40–60 degree angle to capture the attack and higher pitch tones',
    refSurface: 'head',
    side: 'either',
    distance: DUVEL_TOP,
    requires: { micTypeIds: STAND },
    aim: { maxOffAxis: 60, minOffAxis: 40, prov: ill('"at a 40–60 degree angle": the reference is not stated; measured from the head’s normal (the geometry file’s default)') },
    draw: {
      side: { u0: 0, u1: R + 60, v0: HEAD_Y - DUVEL_TOP.max, v1: HEAD_Y - DUVEL_TOP.min },
      top: { u0: 0, u1: R + 60, v0: -R, v1: R },
    },
    start: { p: { x: 110, y: HEAD_Y - 75, z: 0 }, az: 0, el: -40 },
    tendency: 'The attack and the higher tones — very close to the head. Closer exaggerates contact and narrows the balance of strokes; it may or may not carry enough bass on its own.',
    checks: ['Clear of every slap and of a tilting shell', 'Bass, tone and slap all represented', 'Whether a second mic is needed at all'],
  },
  {
    id: 'dj.top.far',
    label: 'Above the outer edge, pointing across to the centre',
    band: 'Start about 41 cm (16 in) from the centre of the head, the mic above its outer edge on the audience side, pointing across to the centre.',
    kind: 'sourced',
    src: 'COPPINGER',
    quote: 'placed 16 inches (41cm) from the center of the drum with the mic near the outer edge pointing across to the center',
    refSurface: 'diag',
    side: 'either',
    distance: { min: COP_DIST - 30, max: COP_DIST + 30 },
    bandProv: ill('"16 inches": ±3 cm is the lab’s tolerance'),
    radial: { line: 'diag', max: 80, prov: ill('"near the outer edge": within 8 cm of the line from the centre up over the edge is the lab’s drawing of it') },
    requires: { micTypeIds: STAND },
    aim: { maxOffAxis: 30, prov: ill('"pointing across to the center": ±30° is the lab’s tolerance') },
    draw: {
      side: { u0: DIAG_N.x * COP_DIST - 80, u1: DIAG_N.x * COP_DIST + 80, v0: HEAD_Y + DIAG_N.y * COP_DIST - 60, v1: HEAD_Y + DIAG_N.y * COP_DIST + 60, round: true },
      top: { u0: DIAG_N.x * COP_DIST - 80, u1: DIAG_N.x * COP_DIST + 80, v0: -80, v1: 80, round: true },
    },
    start: { p: { x: DIAG_N.x * COP_DIST, y: HEAD_Y + DIAG_N.y * COP_DIST, z: 0 }, az: 0, el: -67 },
    tendency: 'The snap of the hand on the head with a full bass in one engineer’s comparison — more of the whole drum and of the room than a very close mic. Test it before adding a second.',
    checks: ['The bass the top mic already carries', 'Room and other players in the pickup', 'Clear of the hands and the player’s head'],
  },
  {
    id: 'dj.bottom.near',
    label: 'Low, aimed at the bottom opening (raised)',
    band: 'With the drum raised clear of the floor, start about 5 cm (2 in) above the floor, beside the drum, aimed at the opening — never blocking it.',
    kind: 'sourced',
    src: 'S-DUVEL',
    quote: 'the second at the bottom of the drum, 2" above the floor, aimed directly at the opening on the bottom of the drum',
    refSurface: 'floorR',
    side: 'either',
    distance: DUVEL_LOW,
    bandProv: ill('"2 inches above the floor": 3 to 8 cm is the lab’s band about it'),
    radial: { line: 'axis', min: R_FOOT + 10, max: 400, prov: ill('"at the bottom of the drum": beside the foot, within 40 cm of the centre line, is the lab’s drawing of it') },
    requires: { variant: 'raised', micTypeIds: SHORT },
    aim: { maxOffAxis: 30, dir: LOW_AIM, prov: ill('"aimed directly at the opening": within 30° of the line to the opening’s centre is the lab’s tolerance') },
    draw: {
      side: { u0: R_FOOT + 10, u1: 400, v0: SUPPORT - DUVEL_LOW.max, v1: SUPPORT - DUVEL_LOW.min },
      top: { u0: -400, u1: 400, v0: -400, v1: 400, round: true },
    },
    start: { p: { x: 260, y: SUPPORT - 65, z: 0 }, az: 0, el: 20 },
    tendency: 'A selectable bass perspective — often a narrower view with less hand detail. First judge the top mic alone; then blend this one in mono.',
    checks: ['The opening stays clear in the player’s posture', 'Stand and cable away from feet', 'The blend with the top mic, in mono'],
  },
  {
    id: 'dj.bottom.under',
    label: 'Under the drum (raised)',
    band: 'With the drum raised, start under it, about 20 cm (8 in) from the bottom rim — just above the floor, below the opening.',
    kind: 'sourced',
    src: 'COPPINGER',
    quote: 'placed under, 8 inches (20cm) from the bottom rim',
    refSurface: 'opening',
    side: 'either',
    distance: { min: 120, max: 190 },
    bandProv: ill('"8 inches from the bottom rim": on this drawing a mic under the opening sits 12–19 cm below it, about 20 cm from the rim'),
    radial: { line: 'axis', max: 160, prov: ill('"placed under": within 16 cm of the centre line is the lab’s drawing of it') },
    requires: { variant: 'raised', micTypeIds: SHORT },
    draw: {
      side: { u0: -160, u1: 160, v0: 120, v1: 190 },
      top: { u0: -160, u1: 160, v0: -160, v1: 160, round: true },
    },
    start: { p: { x: 40, y: SUPPORT - 25, z: 0 }, az: 0, el: 0 },
    tendency: 'A lot of the bass that resonates out of the bottom of the drum — less hand detail. An extra perspective to blend with the top, in mono.',
    checks: ['Nothing blocks the opening', 'The support stays stable and the mic clear of it', 'The blend with the top mic, in mono'],
  },
];
