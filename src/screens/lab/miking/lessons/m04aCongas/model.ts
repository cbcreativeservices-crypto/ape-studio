/**
 * M04a CONGAS — the technical truth (charter §2 layer 1). Every number has a
 * provenance; keys point into docs/labs/miking/congas/SOURCES.md (and
 * SOURCES_SHARED.md). The frame and the drawing defaults:
 * docs/labs/miking/congas/GEOMETRY_PROPOSAL.md.
 *
 * A SET OF THREE (owner 2026-11-22, on his iPhone at MEET IT step 2: "center
 * conga is conga w tumba and quinto on sides"; decision "Three drums"): an
 * 11 in quinto on the player's LEFT, an 11-3/4 in conga in the CENTER, right in
 * front of the player, and a 12-1/2 in tumba on the player's RIGHT, all three
 * 30 in tall (LP-CLASSIC). "Congas are commonly grouped into a set of three"
 * (RM-CONGA). The sides are a drawing default — a common layout; players set
 * their drums their own way. The gap between the drums, the shell's taper and
 * belly, the rim and the raised-stand height are DRAWING DEFAULTS
 * (placeholder: true — drawn, never a readout, listed in the unknowns).
 *
 * FRAME C (this lesson only, 2026-11-22 — the hand-drum family's frame H
 * turned a quarter, so the drums lie along the axis the elevation shows and
 * no drum hides another): mm; origin on the floor under the conga's head
 * center; +x toward the PLAYER'S LEFT (the quinto's side — the audience's
 * right); +y DOWN; +z toward the AUDIENCE. The player stands at −z. The
 * engine's 'side' view (u = x, v = y; the camera at +z looking toward −z) is
 * therefore the FRONT elevation, seen from the audience: tumba on the left of
 * the picture, conga in the middle, quinto on the right. The top view (u = x,
 * v = z) has the audience at the bottom, as the stage plans do.
 *
 * The SUGGESTED STARTING POINTS (owner ruling 2026-10-04): learner-facing
 * `label`, `band`, `tendency`, `checks` in plain starting-point words; `kind`,
 * `src`, `quote` and every `prov` are the INTERNAL research record. A zone the
 * sources give for a PAIR and the lab extends to three drums is `kind:
 * 'trial'`, its reason in `bandProv` / `radial.prov`.
 */
import type { Dim, DocumentedZone, Vec3 } from '../../engine/model/types.ts';
import { IN, drawAbove, drawingDefault, ill, src, type HandDrum } from '../shared/handdrums/handDrumModel.ts';

export const CONGA_DIMS = {
  quintoD: { mm: 11 * IN, prov: src('LP-CLASSIC', 'LP Classic 11″ Quinto') } as Dim,
  congaD: { mm: 11.75 * IN, prov: src('LP-CLASSIC', 'LP Classic 11-3/4″ Conga') } as Dim,
  tumbaD: { mm: 12.5 * IN, prov: src('LP-CLASSIC', 'LP Classic 12-1/2″ Tumba') } as Dim,
  height: { mm: 30 * IN, prov: src('LP-CLASSIC', 'These drums stand 30″ tall') } as Dim,
  gap: drawingDefault(30, 'the gap between neighboring drums at their widest (drawing default 30 mm)'),
  bottomRatio: drawingDefault(0.8, 'the shell taper: the bottom opening’s diameter (drawing default 0.8 × the head)'),
  belly: drawingDefault(0.18, 'the shell’s belly: how far it swells past the straight taper (drawing default 0.18 × the head radius, a third of the way down)'),
  rimRise: drawingDefault(14, 'the rim: how far its top stands above the head'),
  rimT: drawingDefault(8, 'the rim: how far it sits outside the head’s edge'),
  lugs: drawingDefault(6, 'the number of tuning lugs per drum'),
  raise: drawingDefault(150, 'how far the "raised" setup lifts the drums (drawing default 150 mm)'),
  handsUp: drawingDefault(300, 'how far the player’s hands rise above the heads (an illustrative envelope)'),
  headClear: { mm: 10, prov: ill('head motion: no source gives a number; the owner approves it') } as Dim,
} as const;

/** The drawn shell's belly (the art's ShellSide `belly`): the drawing default above. */
export const BELLY = { out: CONGA_DIMS.belly.mm, at: 0.33 } as const;

const H = CONGA_DIMS.height.mm;
export const HEAD_Y = -H;

/** A drum's widest drawn radius (its belly) — the same curve as the art's
 *  shellR (handDrumArt.tsx): the straight taper plus out·R·sin(π·t^k). */
export function bellyR(R: number): number {
  const k = Math.log(0.5) / Math.log(BELLY.at);
  let m = 0;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    m = Math.max(m, R + (R * CONGA_DIMS.bottomRatio.mm - R) * t + BELLY.out * R * Math.sin(Math.PI * Math.pow(t, k)));
  }
  return m;
}

export type CongaId = 'quinto' | 'conga' | 'tumba';

function drum(id: CongaId, d: Dim, x: number): HandDrum {
  const R = d.mm / 2;
  return {
    id,
    name: id,
    label: id === 'quinto' ? 'quinto (11 in)' : id === 'conga' ? 'conga (11¾ in)' : 'tumba (12½ in)',
    short: id.toUpperCase(),
    c: { x, z: 0 },
    headY: HEAD_Y,
    R,
    bottomY: 0,
    rBottom: R * CONGA_DIMS.bottomRatio.mm,
    rim: { rise: CONGA_DIMS.rimRise.mm, t: CONGA_DIMS.rimT.mm },
    prov: { size: d.prov, height: CONGA_DIMS.height.prov, shell: CONGA_DIMS.bottomRatio.prov },
  };
}

const R_Q = CONGA_DIMS.quintoD.mm / 2;
const R_C = CONGA_DIMS.congaD.mm / 2;
const R_T = CONGA_DIMS.tumbaD.mm / 2;
const GAP = CONGA_DIMS.gap.mm;

/** The quinto on the player's left (+x), the conga in the center, the tumba
 *  on the player's right (−x), in a row with their bellies GAP apart (a
 *  common layout; the sides are a drawing default — players set their drums
 *  their own way). */
export const CONGA = drum('conga', CONGA_DIMS.congaD, 0);
export const QUINTO = drum('quinto', CONGA_DIMS.quintoD, bellyR(R_C) + bellyR(R_Q) + GAP);
export const TUMBA = drum('tumba', CONGA_DIMS.tumbaD, -(bellyR(R_C) + bellyR(R_T) + GAP));
/** Left to right as the FRONT view draws them (from the audience). */
export const SET = [TUMBA, CONGA, QUINTO] as const;

/* ── bands ── */
/** "just above top heads" (S-DRUMS): the geometry file's drawing-default band. */
export const JUST_ABOVE = { min: 50, max: 150 } as const;
/** "anywhere from 6 inches to two feet from the head of the drum" (RM-CONGA). */
export const FERGUSON = { min: 6 * IN, max: 24 * IN } as const;
/** "about a foot away" (SOS-LATIN, Garza): ±5 cm is the lab's tolerance. */
export const FOOT = { min: 12 * IN - 50, max: 12 * IN + 50 } as const;
/** Where the one-mic-over-the-set line is drawn: over the conga, on its
 *  audience half (the pair's proposal drew x 0…+80 in front of the gap). */
export const BETWEEN = { x: 0, z: 50, r: 50 } as const;
/** The matched pair over the set: each mic over a gap between two drums,
 *  the same distance from the drums either side of it. */
export const PAIR_AT = [(TUMBA.c.x + CONGA.c.x) / 2, (CONGA.c.x + QUINTO.c.x) / 2] as const;
export const PAIR_BOX = { x0: TUMBA.c.x, x1: QUINTO.c.x, z0: 0, z1: 160 } as const;

/** The tumba's lower opening, front edge: the plane "in front of" it is
 *  measured from (z = the shell's bottom radius), a little above the lower edge. */
export const LOW = { x: TUMBA.c.x, y: -20, z: TUMBA.c.z + TUMBA.rBottom } as const;

/** Toward the audience (a zone's boom side), and the aim "back toward the player". */
export const FRONT: Vec3 = { x: 0, y: 0, z: 1 };
/** az of a mic facing the player from the audience side (aimVec: z = sin az · cos el). */
export const AZ_BACK = -90;

/** The matched pair's second mic (over the conga–quinto gap); the first is
 *  the cg.pair zone's start, its mirror over the tumba–conga gap. */
export const PAIR_B_POSE = { p: { x: PAIR_AT[1], y: HEAD_Y - 380, z: 80 }, az: AZ_BACK, el: -75 };

const STAND = ['hdDynCard', 'hdDynHyper', 'hdSdc'];
const aim = (max: number, why: string) => ({ maxOffAxis: max, prov: ill(why) });
const word = (d: HandDrum) => d.name;

export const CONGA_ZONES: DocumentedZone[] = [
  {
    id: 'cg.shared',
    label: 'One mic over the set: above the conga, just above the heads',
    band: 'Start just above the heads — about 5–15 cm (2–6 in) above them — over the middle drum, between the other two, aimed down.',
    kind: 'trial',
    src: 'S-DRUMS',
    quote: 'One microphone aiming down between pair of drums, just above top heads',
    refSurface: 'set',
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill('"just above": no number; 5 to 15 cm is the geometry file’s drawing default. The source gives this mic for a PAIR; over the middle of a set of three — between the quinto and the tumba — is the lab’s extension (owner 2026-11-22, "Three drums")'),
    radial: { line: 'between', max: BETWEEN.r, prov: ill('the source says "between pair of drums"; for three drums the lab draws a 5 cm radius about a line over the conga’s audience half, 5 cm in front of its center') },
    requires: { micTypeIds: STAND },
    aim: aim(30, '"aiming down": ±30° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r }, { u0: BETWEEN.x - BETWEEN.r, u1: BETWEEN.x + BETWEEN.r, v0: BETWEEN.z - BETWEEN.r, v1: BETWEEN.z + BETWEEN.r, round: true }),
    start: { p: { x: 0, y: HEAD_Y - 100, z: 55 }, az: AZ_BACK, el: -80 },
    tendency: 'One channel for the whole set. The conga, right under the mic, tends to come through loudest, the quinto and the tumba from the sides. Shift toward a quieter drum, or raise the mic for more blend — and listen to every stroke on all three drums.',
    checks: ['Clearance above the player’s hands, at full intensity', 'Every stroke on all three drums: open tones, slaps, bass and muted touches', 'Which drum is loudest, and which is lost, in this one channel'],
  },
  {
    id: 'cg.pair',
    label: 'A matched pair over the set, each mic between two drums',
    band: 'Start each mic about 15–60 cm (6 in–2 ft) above the heads, over a gap — one between the tumba and the conga, one between the conga and the quinto — the same distance from the drums either side, aimed down.',
    kind: 'trial',
    src: 'RM-CONGA',
    quote: 'I typically use a matched pair of microphones to record a two- or three-drum setup.',
    refSurface: 'set',
    side: 'either',
    distance: FERGUSON,
    bandProv: ill('the pair is placed "similar to that used with a single drum", "equidistant from the separate drums" (RM-CONGA): the single drum’s 6 in–2 ft is the band; one mic over each gap is the lab’s drawing of "equidistant" for three drums'),
    box: { min: { x: PAIR_BOX.x0, y: -4000, z: PAIR_BOX.z0 }, max: { x: PAIR_BOX.x1, y: 0, z: PAIR_BOX.z1 }, prov: ill('over the set, between the tumba’s and the quinto’s centers, on the audience half: the lab’s drawing of a pair over three drums') },
    requires: { micTypeIds: STAND },
    aim: aim(45, 'aimed down at the drums: ±45° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, FERGUSON, { u0: PAIR_BOX.x0, u1: PAIR_BOX.x1 }, { u0: PAIR_BOX.x0, u1: PAIR_BOX.x1, v0: PAIR_BOX.z0, v1: PAIR_BOX.z1 }),
    start: { p: { x: PAIR_AT[0], y: HEAD_Y - 380, z: 80 }, az: AZ_BACK, el: -75 },
    tendency: 'Two channels that hear the whole set, each a little more of the drums under it — the set can be spread left to right in the mix. Each mic hears every drum at a different time: check the pair in mono.',
    checks: ['Both mics the same distance from the drums either side', 'The balance of the three drums, every stroke', 'The pair summed to mono, at matched levels'],
  },
  ...SET.map<DocumentedZone>((d) => ({
    id: `cg.${d.id}`,
    label: `Over the ${word(d)}, toward its front edge`,
    band: `Start about 15–60 cm (6 in–2 ft) from the ${word(d)} head — over the head or near its front edge, aimed at it. In a quiet room, start closer and listen as you back off.`,
    kind: 'sourced',
    src: 'RM-CONGA',
    quote: 'anywhere from 6 inches to two feet from the head of the drum',
    refSurface: d.id,
    side: 'either',
    distance: FERGUSON,
    radial: { line: `${d.id}.axis`, max: d.R, prov: ill('"over the head or near its far edge": within the head’s radius of its center line is the lab’s drawing of it; the source gives the distance for one mic on one conga, used here for each drum of the set') },
    requires: { micTypeIds: STAND },
    aim: aim(45, '"aim to include head tone and hand detail": ±45° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, FERGUSON, { u0: d.c.x - d.R, u1: d.c.x + d.R }, { u0: d.c.x - d.R, u1: d.c.x + d.R, v0: d.c.z - d.R, v1: d.c.z + d.R, round: true }),
    start: { p: { x: d.c.x, y: HEAD_Y - 260, z: d.c.z + d.R * 0.55 }, az: AZ_BACK, el: -65 },
    tendency: 'More of this drum on its own channel. Closer brings more direct sound and hand detail — and can favor one stroke; farther balances open tones, slaps and muted strokes, with more of the room and of the drums beside it.',
    checks: ['Outside the player’s hands and wrists, at full intensity', 'The balance of strokes, closer then farther', 'Room and spill from the other two drums as you back off'],
  })),
  ...SET.map<DocumentedZone>((d) => ({
    id: `cg.clip.${d.id}`,
    label: `A clip-on mic at the ${word(d)}’s front rim`,
    band: `Clip it to the ${word(d)}’s rim on the audience side, the capsule just above the head (about 5–15 cm) and aimed across it — only with the player’s OK.`,
    kind: d.id === 'quinto' ? 'trial' : 'sourced',
    src: 'DPA-JB',
    quote: 'we have 4099s on high and low congas, the bongos, two toms and two timbales',
    refSurface: d.id,
    side: 'either',
    distance: JUST_ABOVE,
    bandProv: ill(d.id === 'quinto' ? 'the touring case clips a mic to each of TWO congas, high and low; a clip on the third drum of a set is the lab’s extension, with the "just above" drawing default for the capsule' : 'the touring case gives no position; the "just above" drawing default is used for the capsule'),
    radial: { line: `${d.id}.axis`, min: d.R * 0.5, max: d.R + 40, prov: ill('"at the rim": the outer half of the head to 4 cm past the rim is the lab’s drawing of it') },
    requires: { micTypeIds: ['hdClip'] },
    aim: aim(60, 'aimed across the head: ±60° of straight down is the lab’s tolerance'),
    drawn: drawAbove(HEAD_Y, JUST_ABOVE, { u0: d.c.x - d.R - 40, u1: d.c.x + d.R + 40 }, { u0: d.c.x - d.R - 40, u1: d.c.x + d.R + 40, v0: d.c.z - d.R - 40, v1: d.c.z + d.R + 40, round: true }),
    start: { p: { x: d.c.x, y: HEAD_Y - 70, z: d.c.z + d.R - 25 }, az: AZ_BACK, el: -50 },
    tendency: 'Independent control of each drum in little stage space — the mic moves with the drum. Closer can favor the stroke nearest the capsule; check the whole phrase.',
    checks: ['The player agrees to a clip on the rim', 'Clear of every hand stroke and the rim hits', 'Vibration or rattle from the clamp'],
  })),
  {
    id: 'cg.bottom',
    label: 'In front of the tumba’s lower opening (raised drums)',
    band: 'With the drums raised on stands, start about 30 cm (1 ft) in front of the tumba’s lower opening — near it, never blocking it.',
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
    drawn: {
      side: { u0: LOW.x - 150, u1: LOW.x + 150, v0: LOW.y - 150, v1: LOW.y + 150 },
      top: { u0: LOW.x - 150, u1: LOW.x + 150, v0: LOW.z + FOOT.min, v1: LOW.z + FOOT.max },
    },
    start: { p: { x: LOW.x, y: LOW.y, z: LOW.z + 12 * IN }, az: AZ_BACK, el: 0 },
    tendency: 'Often boomier, with less hand detail — an extra perspective to blend with the top, not a replacement for it. Check the two in mono.',
    checks: ['The opening stays clear: nothing in it, no cable into it', 'The stand and cable clear of the player’s feet', 'The blend with the top mic, in mono'],
  },
];
