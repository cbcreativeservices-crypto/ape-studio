/**
 * M04a CONGAS — the technical truth (charter §2 layer 1). Every number has a
 * provenance; keys point into docs/labs/miking/congas/SOURCES.md (and
 * SOURCES_SHARED.md). Frame H and the drawing defaults:
 * docs/labs/miking/congas/GEOMETRY_PROPOSAL.md.
 *
 * A two-drum set: an 11-3/4 in conga on the player's LEFT (−z) and a
 * 12-1/2 in tumba on the RIGHT (+z), both 30 in tall (LP-CLASSIC). Their plan
 * spacing, shell taper, rim and the raised-stand height are DRAWING DEFAULTS
 * (placeholder: true — drawn, never a readout, listed in the unknowns).
 *
 * The RECOMMENDED STARTING POINTS (owner ruling 2026-10-04): learner-facing
 * `label`, `band`, `tendency`, `checks` in plain starting-point words; `kind`,
 * `src`, `quote` and every `prov` are the INTERNAL research record.
 */
import type { Dim, DocumentedZone } from '../../engine/model/types.ts';
import { IN, drawAbove, drawingDefault, ill, src, type HandDrum } from '../shared/handdrums/handDrumModel.ts';

export const CONGA_DIMS = {
  congaD: { mm: 11.75 * IN, prov: src('LP-CLASSIC', 'LP Classic 11-3/4″ Conga') } as Dim,
  tumbaD: { mm: 12.5 * IN, prov: src('LP-CLASSIC', 'LP Classic 12-1/2″ Tumba') } as Dim,
  height: { mm: 30 * IN, prov: src('LP-CLASSIC', 'These drums stand 30″ tall') } as Dim,
  spacing: drawingDefault(340, 'the plan spacing of the two drums (drawing default 340 mm between centres)'),
  bottomRatio: drawingDefault(0.8, 'the shell taper: the bottom opening’s diameter (drawing default 0.8 × the head)'),
  rimRise: drawingDefault(14, 'the rim: how far its top stands above the head'),
  rimT: drawingDefault(8, 'the rim: how far it sits outside the head’s edge'),
  lugs: drawingDefault(6, 'the number of tuning lugs per drum'),
  raise: drawingDefault(150, 'how far the "raised" setup lifts the drums (drawing default 150 mm)'),
  handsUp: drawingDefault(300, 'how far the player’s hands rise above the heads (an illustrative envelope)'),
  headClear: { mm: 10, prov: ill('head motion: no source gives a number; the owner approves it') } as Dim,
} as const;

const H = CONGA_DIMS.height.mm;
const HALF = CONGA_DIMS.spacing.mm / 2;
export const HEAD_Y = -H;

function drum(id: 'conga' | 'tumba', d: Dim, z: number): HandDrum {
  const R = d.mm / 2;
  return {
    id,
    name: id,
    label: id === 'conga' ? 'conga (11¾ in)' : 'tumba (12½ in)',
    short: id.toUpperCase(),
    c: { x: 0, z },
    headY: HEAD_Y,
    R,
    bottomY: 0,
    rBottom: R * CONGA_DIMS.bottomRatio.mm,
    rim: { rise: CONGA_DIMS.rimRise.mm, t: CONGA_DIMS.rimT.mm },
    prov: { size: d.prov, height: CONGA_DIMS.height.prov, shell: CONGA_DIMS.bottomRatio.prov },
  };
}

/** The conga on the player's left, the tumba on the right (a common layout;
 *  the side is a drawing default — players set their drums their own way). */
export const CONGA = drum('conga', CONGA_DIMS.congaD, -HALF);
export const TUMBA = drum('tumba', CONGA_DIMS.tumbaD, +HALF);

/* ── bands ── */
/** "just above top heads" (S-DRUMS): the geometry file's drawing-default band. */
export const JUST_ABOVE = { min: 50, max: 150 } as const;
/** "anywhere from 6 inches to two feet from the head of the drum" (RM-CONGA). */
export const FERGUSON = { min: 6 * IN, max: 24 * IN } as const;
/** "about a foot away" (SOS-LATIN, Garza): ±5 cm is the lab's tolerance. */
export const FOOT = { min: 12 * IN - 50, max: 12 * IN + 50 } as const;
/** Where the line between the drums is drawn (the proposal's x 0…+80 at z = 0). */
export const BETWEEN = { x: 50, z: 0, r: 50 } as const;

/** The tumba's lower opening, front edge: the plane "in front of" it is
 *  measured from (x = the shell's bottom radius), a little above the lower edge. */
export const LOW = { x: TUMBA.c.x + TUMBA.rBottom, y: -20 } as const;

const STAND = ['hdDynCard', 'hdDynHyper', 'hdSdc'];
const aim = (max: number, why: string) => ({ maxOffAxis: max, prov: ill(why) });

export const CONGA_ZONES: DocumentedZone[] = [
  {
    id: 'cg.shared',
    label: 'One mic for the pair: between the heads, just above',
    band: 'Start just above the heads — about 5–15 cm (2–6 in) above them — between the two drums, aimed down.',
    kind: 'sourced',
    src: 'S-DRUMS',
    quote: 'One microphone aiming down between pair of drums, just above top heads',
    refSurface: 'pair',
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill('"just above": no number; 5 to 15 cm is the geometry file’s drawing default'),
    radial: { line: 'between', max: BETWEEN.r, prov: ill('"between pair of drums": the proposal draws x 0 to +80 at z = 0; a 5 cm radius about x = 5 cm is the lab’s drawing of it') },
    requires: { micTypeIds: STAND },
    aim: aim(30, '"aiming down": ±30° of straight down is the lab’s tolerance'),
    draw: drawAbove(HEAD_Y, JUST_ABOVE, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r }, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r, v0: -BETWEEN.r, v1: BETWEEN.r, round: true }),
    start: { p: { x: 55, y: HEAD_Y - 100, z: 0 }, az: 0, el: -80 },
    tendency: 'A full sound with good attack from both drums, on one channel. Shift it toward the quieter drum, or raise it for a more blended pair — and listen to every stroke on both drums.',
    checks: ['Clearance above the player’s hands, at full intensity', 'Every stroke on both drums: open tones, slaps, bass and muted touches', 'Which drum is louder in this one channel'],
  },
  ...([TUMBA, CONGA] as const).map<DocumentedZone>((d) => ({
    id: `cg.${d.id}`,
    label: `Over the ${d.name}, toward its far edge`,
    band: `Start about 15–60 cm (6 in–2 ft) from the ${d.name} head — over the head or near its far edge, aimed at it. In a quiet room, start closer and listen as you back off.`,
    kind: 'sourced',
    src: 'RM-CONGA',
    quote: 'anywhere from 6 inches to two feet from the head of the drum',
    refSurface: d.id,
    side: 'either',
    distance: FERGUSON,
    radial: { line: `${d.id}.axis`, max: d.R, prov: ill('"over the head or near its far edge": within the head’s radius of its centre line is the lab’s drawing of it') },
    requires: { micTypeIds: STAND },
    aim: aim(45, '"aim to include head tone and hand detail": ±45° of straight down is the lab’s tolerance'),
    draw: drawAbove(HEAD_Y, FERGUSON, { u0: d.c.x - d.R, u1: d.c.x + d.R }, { u0: d.c.x - d.R, u1: d.c.x + d.R, v0: d.c.z - d.R, v1: d.c.z + d.R, round: true }),
    start: { p: { x: d.c.x + d.R * 0.55, y: HEAD_Y - 260, z: d.c.z }, az: 0, el: -65 },
    tendency: 'More of this drum on its own channel. Closer brings more direct sound and hand detail — and can favour one stroke; farther balances open tones, slaps and muted strokes, with more of the room.',
    checks: ['Outside the player’s hands and wrists, at full intensity', 'The balance of strokes, closer then farther', 'Room and spill as you back off'],
  })),
  ...([TUMBA, CONGA] as const).map<DocumentedZone>((d) => ({
    id: `cg.clip.${d.id}`,
    label: `A clip-on mic at the ${d.name}’s far rim`,
    band: `Clip it to the ${d.name}’s rim on the audience side, the capsule just above the head (about 5–15 cm) and aimed across it — only with the player’s OK.`,
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
    draw: drawAbove(HEAD_Y, JUST_ABOVE, { u0: d.c.x + d.R * 0.5, u1: d.c.x + d.R + 40 }, { u0: d.c.x - d.R - 40, u1: d.c.x + d.R + 40, v0: d.c.z - d.R - 40, v1: d.c.z + d.R + 40, round: true }),
    start: { p: { x: d.c.x + d.R - 25, y: HEAD_Y - 70, z: d.c.z }, az: 0, el: -50 },
    tendency: 'Independent control of each drum in little stage space — the mic moves with the drum. Closer can favour the stroke nearest the capsule; check the whole phrase.',
    checks: ['The player agrees to a clip on the rim', 'Clear of every hand stroke and the rim hits', 'Vibration or rattle from the clamp'],
  })),
  {
    id: 'cg.bottom',
    label: 'In front of the tumba’s lower opening (raised drums)',
    band: 'With the drums raised on stands, start about 30 cm (1 ft) in front of the lower opening — near it, never blocking it.',
    kind: 'sourced',
    src: 'SOS-LATIN',
    quote: 'if they’re raised on stands, using an X-Y pair of Neumann U87s in front of the congas and angled towards the rims about a foot away',
    refSurface: 'tumba.low',
    side: 'either',
    distance: FOOT,
    bandProv: ill('"about a foot": ±5 cm is the lab’s tolerance'),
    radial: { line: 'tumba.low', max: 150, prov: ill('in line with the opening: within 15 cm of the line through it is the lab’s drawing of it') },
    requires: { variant: 'raised', micTypeIds: STAND },
    aim: aim(45, 'facing the opening: ±45° is the lab’s tolerance'),
    draw: {
      side: { u0: LOW.x + FOOT.min, u1: LOW.x + FOOT.max, v0: LOW.y - 150, v1: LOW.y + 150 },
      top: { u0: LOW.x + FOOT.min, u1: LOW.x + FOOT.max, v0: TUMBA.c.z - 150, v1: TUMBA.c.z + 150 },
    },
    start: { p: { x: LOW.x + 12 * IN, y: LOW.y, z: TUMBA.c.z }, az: 0, el: 0 },
    tendency: 'Often boomier, with less hand detail — an extra perspective to blend with the top, not a replacement for it. Check the pair in mono.',
    checks: ['The opening stays clear: nothing in it, no cable into it', 'The stand and cable clear of the player’s feet', 'The blend with the top mic, in mono'],
  },
];
