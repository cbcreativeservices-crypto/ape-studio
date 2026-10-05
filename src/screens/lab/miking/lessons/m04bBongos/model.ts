/**
 * M04b BONGOS — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/bongos/SOURCES.md; frame H and the drawing defaults:
 * docs/labs/miking/bongos/GEOMETRY_PROPOSAL.md.
 *
 * A connected pair of small open-bottom drums: the 7¼ in MACHO (smaller,
 * higher) on the player's left and the 8⅝ in HEMBRA (larger, lower) on the
 * right (LP-GEN2, MEINL-BONGO). The centre block, the shell height, the
 * playing height and the side assignment are DRAWING DEFAULTS.
 *
 * No source gives a bongo mic distance (the lesson and the research agree):
 * the zones use the geometry file's drawing-default "just above" band and are
 * read as regions to begin in, never as published numbers.
 */
import type { Dim, DocumentedZone } from '../../engine/model/types.ts';
import { IN, drawAbove, drawingDefault, ill, src, type HandDrum } from '../shared/handdrums/handDrumModel.ts';

export const BONGO_DIMS = {
  machoD: { mm: 7.25 * IN, prov: src('LP-GEN2', 'This set of 7-1/4″ and 8-5/8″ drums') } as Dim,
  hembraD: { mm: 8.625 * IN, prov: src('LP-GEN2', 'This set of 7-1/4″ and 8-5/8″ drums') } as Dim,
  block: drawingDefault(40, 'the centre block’s width (drawing default 40 mm)'),
  shellH: drawingDefault(150, 'the shells’ height (drawing default 150 mm)'),
  seatedH: drawingDefault(560, 'the heads’ height for a seated player, the pair between the knees (drawing default 560 mm)'),
  standH: drawingDefault(900, 'the heads’ height on a stand (drawing default 900 mm)'),
  rimRise: drawingDefault(10, 'the traditional rims: how far they stand above the heads'),
  rimT: drawingDefault(6, 'the traditional rims: how far they sit outside the heads’ edge'),
  lugs: drawingDefault(4, 'the number of tension rods per drum'),
  handsUp: drawingDefault(250, 'how far the hands rise above each head (the lesson’s illustrative 250 mm envelope)'),
  headClear: { mm: 8, prov: ill('head motion: no source gives a number; the owner approves it') } as Dim,
} as const;

export const HEAD_Y = -BONGO_DIMS.seatedH.mm;
/** The stand raises the heads to 900 mm: the floor moves 340 mm down. */
export const STAND_FLOOR = BONGO_DIMS.standH.mm - BONGO_DIMS.seatedH.mm;

function drum(id: 'macho' | 'hembra', d: Dim, z: number): HandDrum {
  const R = d.mm / 2;
  return {
    id,
    name: id,
    label: id === 'macho' ? 'macho (7¼ in)' : 'hembra (8⅝ in)',
    short: id.toUpperCase(),
    c: { x: 0, z },
    headY: HEAD_Y,
    R,
    bottomY: HEAD_Y + BONGO_DIMS.shellH.mm,
    rBottom: R,
    rim: { rise: BONGO_DIMS.rimRise.mm, t: BONGO_DIMS.rimT.mm },
    prov: { size: d.prov, height: BONGO_DIMS.seatedH.prov, shell: BONGO_DIMS.shellH.prov },
  };
}

const HALF_BLOCK = BONGO_DIMS.block.mm / 2;
/** The macho on the player's left (a common, unsourced assignment: a drawing default). */
export const MACHO = drum('macho', BONGO_DIMS.machoD, -(BONGO_DIMS.machoD.mm / 2 + HALF_BLOCK));
export const HEMBRA = drum('hembra', BONGO_DIMS.hembraD, BONGO_DIMS.hembraD.mm / 2 + HALF_BLOCK);

/** "just above top heads" (S-DRUMS): the geometry file's drawing-default band. */
export const JUST_ABOVE = { min: 50, max: 150 } as const;
/** Between the drums: the proposal's x 0…80 at z = (z_h + z_m) / 2. */
export const BETWEEN = { x: 40, z: (MACHO.c.z + HEMBRA.c.z) / 2, r: 40 } as const;

const STAND = ['hdDynCard', 'hdDynHyper', 'hdSdc'];
const aim = (max: number, why: string) => ({ maxOffAxis: max, prov: ill(why) });

export const BONGO_ZONES: DocumentedZone[] = [
  {
    id: 'bg.shared',
    label: 'One mic for both: between the heads, just above',
    band: 'Start just above the heads — about 5–15 cm (2–6 in) above them — between the two drums, aimed down, outside every finger and hand stroke.',
    kind: 'sourced',
    src: 'S-DRUMS',
    quote: 'One microphone aiming down between pair of drums, just above top heads',
    refSurface: 'pair',
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill('"just above": no number; 5 to 15 cm is the geometry file’s drawing default'),
    radial: { line: 'between', max: BETWEEN.r, prov: ill('"between pair of drums": the proposal’s x 0 to +80 at the pair’s centre line') },
    requires: { micTypeIds: STAND },
    aim: aim(30, '"aiming down": ±30° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r }, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r, v0: BETWEEN.z - BETWEEN.r, v1: BETWEEN.z + BETWEEN.r, round: true }),
    start: { p: { x: 62, y: HEAD_Y - 100, z: BETWEEN.z }, az: 0, el: -80 },
    tendency: 'Both drums on one channel, with no interaction between two bongo mics. Move toward the weaker drum, or back off for a more blended picture if spill and the room allow it.',
    checks: ['Clear of the hands, from every side the player plays', 'The macho’s attack against the hembra’s lower tone', 'The quietest finger work as well as the loudest accents'],
  },
  ...([HEMBRA, MACHO] as const).map<DocumentedZone>((d) => ({
    id: `bg.spot.${d.id}`,
    label: `A spot for the ${d.name}, just beyond its rim`,
    band: `Start just outside the hands’ reach of the ${d.name} — about 5–15 cm above its head, a little beyond the rim — aimed at the head, at a distance comparable to the other drum’s mic.`,
    kind: 'trial',
    src: 'LESSON',
    quote: 'give each head its own directional mic at a safe, comparable distance',
    refSurface: d.id,
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: { kind: 'trial', src: 'LESSON', note: 'the lesson gives no number for a spot; the "just above" drawing default is used' },
    radial: { line: `${d.id}.axis`, min: d.R + 20, max: d.R + 120, prov: ill('"a safe, comparable distance" outside the hand path: 2 to 12 cm past the head’s edge is the lab’s drawing of it') },
    requires: { micTypeIds: STAND },
    aim: aim(60, 'aimed at the head: ±60° is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: d.c.x + d.R + 20, u1: d.c.x + d.R + 120 }, { u0: d.c.x - d.R - 120, u1: d.c.x + d.R + 120, v0: d.c.z - d.R - 120, v1: d.c.z + d.R + 120, round: true }),
    start: { p: { x: d.c.x + d.R + 70, y: HEAD_Y - 100, z: d.c.z }, az: 0, el: -45 },
    tendency: 'Separate levels for each drum — though each mic still hears both drums to some degree. Check each alone and the pair in mono.',
    checks: ['Clear of every finger and palm stroke', 'Comparable distances on both drums', 'The mono sum of the two spots'],
  })),
  ...([HEMBRA, MACHO] as const).map<DocumentedZone>((d) => ({
    id: `bg.clip.${d.id}`,
    label: `A clip-on mic at the ${d.name}’s rim`,
    band: `Clip it to the ${d.name}’s rim on the audience side, the capsule just above the head (about 5–15 cm), outside the hands — only with the player’s OK.`,
    kind: 'sourced',
    src: 'DPA-JB',
    quote: 'we have 4099s on high and low congas, the bongos, two toms and two timbales',
    refSurface: d.id,
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill('the touring case gives no position; the "just above" drawing default is used for the capsule'),
    radial: { line: `${d.id}.axis`, min: d.R, max: d.R + 50, prov: ill('"at the rim, outside the hand zone": the head’s edge to 5 cm past it is the lab’s drawing of it') },
    requires: { micTypeIds: ['hdClip'] },
    aim: aim(60, 'aimed at the head: ±60° is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: d.c.x + d.R, u1: d.c.x + d.R + 50 }, { u0: d.c.x - d.R - 50, u1: d.c.x + d.R + 50, v0: d.c.z - d.R - 50, v1: d.c.z + d.R + 50, round: true }),
    start: { p: { x: d.c.x + d.R + 18, y: HEAD_Y - 62, z: d.c.z }, az: 0, el: -50 },
    tendency: 'Little stage space and independent control; the mic moves with the pair. Check the clamp for vibration and every finger motion.',
    checks: ['The clamp fits this drum, and the player agrees', 'Vibration, cable strain and every finger motion', 'Movement to neighbouring percussion'],
  })),
];
