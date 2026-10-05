/**
 * M04c TIMBALES — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/timbales/SOURCES.md; frame H and the drawing defaults:
 * docs/labs/miking/timbales/GEOMETRY_PROPOSAL.md.
 *
 * A pair of shallow, single-headed brass drums on a stand, played with
 * sticks: a 14 in drum on the player's left and a 15 in on the right, both
 * 6½ in deep (LP-257, "Brass shells"), with a cowbell bracket (LP-257: "Cowbell
 * bracket (cowbells sold separately)"). The stand height, the spacing, the
 * side assignment, the bracket and the bell's position are DRAWING DEFAULTS.
 */
import type { Dim, DocumentedZone } from '../../engine/model/types.ts';
import { DOWN, IN, drawAbove, drawingDefault, ill, src, type HandDrum } from '../shared/handdrums/handDrumModel.ts';

export const TIMB_DIMS = {
  smallD: { mm: 14 * IN, prov: src('LP-257', '14″ & 15″ diameter, 6-1/2″ deep') } as Dim,
  largeD: { mm: 15 * IN, prov: src('LP-257', '14″ & 15″ diameter, 6-1/2″ deep') } as Dim,
  depth: { mm: 6.5 * IN, prov: src('LP-257', '14″ & 15″ diameter, 6-1/2″ deep') } as Dim,
  headH: drawingDefault(950, 'the heads’ height on the stand (drawing default 950 mm)'),
  spacing: drawingDefault(400, 'the plan spacing of the two drums (drawing default 400 mm between centres)'),
  rimRise: drawingDefault(8, 'the rims: how far they stand above the heads'),
  rimT: drawingDefault(6, 'the rims: how far they sit outside the heads’ edge'),
  lugs: drawingDefault(6, 'the number of tuning lugs per drum'),
  bellX: drawingDefault(-60, 'where the cowbell sits (drawing default 60 mm toward the player, 150 mm above the heads)'),
  bellUp: drawingDefault(150, 'where the cowbell sits (drawing default 60 mm toward the player, 150 mm above the heads)'),
  sticksUp: drawingDefault(400, 'how far the sticks rise above the heads (the geometry file’s illustrative 400 mm)'),
  headClear: { mm: 8, prov: ill('head motion: no source gives a number; the owner approves it') } as Dim,
} as const;

export const HEAD_Y = -TIMB_DIMS.headH.mm;
const HALF = TIMB_DIMS.spacing.mm / 2;

function drum(id: 'small' | 'large', d: Dim, z: number): HandDrum {
  const R = d.mm / 2;
  const inch = id === 'small' ? '14' : '15';
  return {
    id,
    name: `${inch} in timbale`,
    label: `${inch} in timbale`,
    short: `${inch} IN`,
    c: { x: 0, z },
    headY: HEAD_Y,
    R,
    bottomY: HEAD_Y + TIMB_DIMS.depth.mm,
    rBottom: R,
    rim: { rise: TIMB_DIMS.rimRise.mm, t: TIMB_DIMS.rimT.mm },
    prov: { size: d.prov, height: TIMB_DIMS.headH.prov, shell: TIMB_DIMS.depth.prov },
  };
}

/** The 14 in on the player's left, the 15 in on the right (a drawing default — players differ). */
export const SMALL = drum('small', TIMB_DIMS.smallD, -HALF);
export const LARGE = drum('large', TIMB_DIMS.largeD, +HALF);
export const BELL = { x: TIMB_DIMS.bellX.mm, y: HEAD_Y - TIMB_DIMS.bellUp.mm, z: 0 } as const;

export const JUST_ABOVE = { min: 50, max: 150 } as const;
export const JUST_BELOW = { min: 50, max: 150 } as const;
export const BETWEEN = { x: 45, z: 0, r: 40 } as const;

const STAND = ['hdDynCard', 'hdDynHyper', 'hdSdc'];
const aim = (max: number, why: string) => ({ maxOffAxis: max, prov: ill(why) });

export const TIMB_ZONES: DocumentedZone[] = [
  {
    id: 'tb.shared',
    label: 'One mic for the pair: between the heads, just above',
    band: 'Start just above the heads — about 5–15 cm (2–6 in) — between the two drums on the audience side, aimed down, out of every stick path.',
    kind: 'sourced',
    src: 'S-REC',
    quote: 'One microphone aiming down between pair of drums, just above top heads',
    refSurface: 'pair',
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill('"just above": no number; 5 to 15 cm is the geometry file’s drawing default'),
    radial: { line: 'between', max: BETWEEN.r, prov: ill('"between pair of drums": a 4 cm radius about x = 4.5 cm, on the audience side, is the lab’s drawing of it') },
    requires: { micTypeIds: STAND },
    aim: aim(30, '"aiming down": ±30° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r }, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r, v0: -BETWEEN.r, v1: BETWEEN.r, round: true }),
    start: { p: { x: 62, y: HEAD_Y - 100, z: 0 }, az: 0, el: -80 },
    tendency: 'A coherent pair on one channel with the fewest mics. Bells and spill may be strong in it; shift or re-aim if one drum or the shell pattern is weak — and check the whole phrase.',
    checks: ['Clear of every stick stroke — heads, rims and shells', 'Both drums, rimshots and the cáscara', 'How loud the bell is in it'],
  },
  {
    id: 'tb.shells',
    label: 'Between the shells',
    band: 'Start right between the two shells, at shell height, on the audience side. No distance or aim is published — move it and listen to the shell pattern against the heads.',
    kind: 'sourced',
    src: 'AX-OZO',
    quote: 'The D2 is on timbales, right in between the shells.',
    refSurface: 'pair',
    side: 'either',
    distance: { min: -TIMB_DIMS.depth.mm, max: 0 },
    bandProv: ill('"right in between the shells": the shells’ depth below the heads (sourced, 6½ in) is drawn as the height band'),
    radial: { line: 'centre', max: SMALL.R, prov: ill('"in between the shells": within the smaller drum’s radius of the pair’s centre line — the shells themselves bound it') },
    requires: { micTypeIds: STAND },
    drawn: {
      side: { u0: 40, u1: SMALL.R, v0: HEAD_Y, v1: HEAD_Y + TIMB_DIMS.depth.mm },
      top: { u0: 40, u1: SMALL.R, v0: -55, v1: 45 },
    },
    start: { p: { x: 140, y: HEAD_Y + 80, z: -6 }, az: 0, el: 0 },
    tendency: 'Can favour the cáscara on the shells; check that the heads and rimshots stay usable. One band’s live choice, not a rule.',
    checks: ['Clear of the shell strikes and the tension hardware', 'The heads and rimshots still usable', 'The mount secure between the drums'],
  },
  ...([SMALL, LARGE] as const).map<DocumentedZone>((d) => ({
    id: `tb.under.${d.id}`,
    label: `Under the ${d.name}, pointing out toward its rim`,
    band: `Start under the ${d.name} — about 5–15 cm below its lower edge — pointing up and outward toward its rim.`,
    kind: 'sourced',
    src: 'SOS-LATIN',
    quote: 'places two Shure SM57s beneath the pair of timbales pointed outwards towards their rims',
    refSurface: `${d.id}.low`,
    side: 'either',
    distance: JUST_BELOW,
    bandProv: ill('"beneath": no number; the 5 to 15 cm drawing-default band is used below the lower edge'),
    radial: { line: `${d.id}.axis`, max: d.R, prov: ill('"beneath": within the drum’s radius of its centre line') },
    requires: { micTypeIds: STAND },
    aim: { maxOffAxis: 60, prov: ill('"pointed outwards towards their rims": within 60° of straight up is the lab’s tolerance') },
    drawn: {
      side: { u0: d.c.x - d.R, u1: d.c.x + d.R, v0: d.bottomY + JUST_BELOW.min, v1: d.bottomY + JUST_BELOW.max },
      top: { u0: d.c.x - d.R, u1: d.c.x + d.R, v0: d.c.z - d.R, v1: d.c.z + d.R, round: true },
    },
    start: { p: { x: 60, y: d.bottomY + 100, z: d.c.z + Math.sign(d.c.z) * 30 }, az: Math.sign(d.c.z) * 45, el: 55 },
    tendency: 'The head from below and its shell — one engineer’s studio approach, often paired with an overhead pair for the bells. Not a safe default for a crowded stage.',
    checks: ['The stand’s legs and the player’s feet', 'The head’s sound against the shell’s', 'The blend with any top or overhead mic, in mono'],
  })),
  ...([SMALL, LARGE] as const).map<DocumentedZone>((d) => ({
    id: `tb.clip.${d.id}`,
    label: `A clip-on mic at the ${d.name}’s far rim`,
    band: `Clip it to the ${d.name}’s rim on the audience side, the capsule just above the head (about 5–15 cm), out of the stick path — only with the player’s OK.`,
    kind: 'sourced',
    src: 'DPA-JB',
    quote: 'we have 4099s on high and low congas, the bongos, two toms and two timbales',
    refSurface: d.id,
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill('the touring case gives no position; the "just above" drawing default is used for the capsule'),
    radial: { line: `${d.id}.axis`, min: d.R * 0.5, max: d.R + 40, prov: ill('"at the rim": the outer half of the head to 4 cm past the rim is the lab’s drawing of it') },
    requires: { micTypeIds: ['hdClip'] },
    aim: aim(60, 'aimed across the head: ±60° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: d.c.x + d.R * 0.5, u1: d.c.x + d.R + 40 }, { u0: d.c.x - d.R - 40, u1: d.c.x + d.R + 40, v0: d.c.z - d.R - 40, v1: d.c.z + d.R + 40, round: true }),
    start: { p: { x: d.c.x + d.R - 25, y: HEAD_Y - 70, z: d.c.z }, az: 0, el: -50 },
    tendency: 'Independent control of each drum; the mic confirms the count, not a geometry. Check the clamp, the stick path and the combined sound.',
    checks: ['The player agrees, and the clamp fits', 'Clear of the stick on the head, the rim and the shell', 'Stand or clamp noise; the pair in mono'],
  })),
];

/** The down direction, for the under-mics' reference surfaces (normal +y). */
export const LOW_NORMAL = DOWN;
