/**
 * M01 KICK DRUM — the technical truth (charter §2 layer 1). Every number has
 * a provenance; keys point into docs/labs/miking/kick/SOURCES.md and
 * docs/labs/miking/SOURCES_SHARED.md. Frame and anchors: kick/
 * GEOMETRY_PROPOSAL.md §1–§3 (origin = batter-head centre, +x toward the
 * resonant head, +y DOWN, +z the drummer's right).
 *
 * UNKNOWN facts the drawing cannot exist without are PLACEHOLDERS (a neutral
 * value, `placeholder: true`): drawn ILLUSTRATIVE, never a readout reference
 * (ruling §16.12), all listed in the lesson's unknowns.
 */
import type { Dim, DocumentedZone, Provenance } from '../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

/** 1 in = 25.4 mm exactly (SOURCES.md rules). */
const IN = 25.4;

export const KICK_DIMS = {
  /** 22 in nominal diameter (YMH-RC RBB-2218, TAMA-SSC, DW-DES). */
  dNom: { mm: 22 * IN, prov: src('YMH-RC', 'RBB-2218 22"×18"') } as Dim,
  /** Shell OD = nominal (real OD UNKNOWN) — TRIAL. */
  R: { mm: (22 * IN) / 2, prov: trial('YMH-RC', 'the nominal 22 in used as the shell outside diameter; the real OD is unknown') } as Dim,
  /** 18 in depth, heads as flat planes at the shell ends — TRIAL. */
  L: { mm: 18 * IN, prov: trial('YMH-RC', '18 in nominal depth; heads drawn as flat planes at the shell ends') } as Dim,
  tShell: { mm: 7, prov: src('TAMA-SSC', 'Bass Drum : 8ply, 7mm') } as Dim,
  tHoop: { mm: 8, prov: trial('YMH-TC', 'BD : 8.0 mm — a 22×16 Tour Custom hoop, not this drum') } as Dim,
  hHoop: placeholder(25, 'hoop height (axial width)'),
  cHoop: placeholder(3, 'gap between shell and hoop'),
  hoopInset: placeholder(6, 'how far the hoop stands past the head plane'),
  nRods: { mm: 10, prov: src('YMH-RC', 'No. of Tuning Bolts 10 (per head; owner-confirmed 2026-10-04)') } as Dim,
  rodPhaseDeg: placeholder(18, 'tension-rod phase (is a rod at bottom centre?)'),
  /** Remo 5 in offset port — the default head (ruling §16.12). */
  portD: { mm: 5 * IN, prov: src('REMO-OH', '5" Offset Hole') } as Dim,
  portY: placeholder(90, 'offset port position (radius and clock angle)'),
  portZ: placeholder(110, 'offset port position (radius and clock angle)'),
  /** DW: "the center of the drum or an area 1-2 inches above the center";
   *  the lab draws 1.5 in above (mid-range) — TRIAL choice. Above = −y. */
  strikeY: { mm: -1.5 * IN, prov: trial('DW-9000', 'DW allows the centre or 1–2 in above it; the lab draws 1.5 in above') } as Dim,
  beaterHeadR: placeholder(30, 'beater head diameter'),
  beaterLen: placeholder(240, 'beater shaft length and pedal axle position'),
  beaterSwingDeg: placeholder(50, 'beater swing arc'),
  /** A standard kick pillow (owner 2026-10-04: "use a standard kick pillow"):
   *  the DW 18 in pillow (DW: "Fits 18″ depth kick drums"; no dimensions on
   *  DW's page). Size from the RETAILER listing, 18.1 × 15.8 × 4.8 in —
   *  length along the drum axis × width × height. Cross-check: KickPro
   *  "Standard Size 17"x11"", 3 in thick (retailer). */
  pillowLen: { mm: 18.1 * IN, prov: src('DW-PILLOW', '18.1 × 15.8 × 4.8 in (retailer listing of the DW 18 in pillow)') } as Dim,
  pillowH: { mm: 4.8 * IN, prov: src('DW-PILLOW', '18.1 × 15.8 × 4.8 in (retailer listing of the DW 18 in pillow)') } as Dim,
  pillowHalfW: { mm: (15.8 * IN) / 2, prov: src('DW-PILLOW', '18.1 × 15.8 × 4.8 in (retailer listing of the DW 18 in pillow)') } as Dim,
  spurX: placeholder(120, 'spur mount position, angle and length'),
  /** Floor: both hoops tangent to it would put it at R + c + t (proposal §2) — placeholder. */
  yFloor: placeholder(279.4 + 3 + 8, 'the floor line (do the hoops touch the floor? how much do the spurs lift the drum?)'),
  /** Illustrative keep-out margins (no source gives clearances, ruling §16.4). */
  headClear: { mm: 10, prov: ill('head excursion: no source gives a number; the owner approves it') } as Dim,
  dampClear: { mm: 10, prov: ill('"does not touch … damping" (S-B52-UG p.3) — margin is illustrative') } as Dim,
} as const;

export const R = KICK_DIMS.R.mm;
export const L = KICK_DIMS.L.mm;
export const R_IN = R - KICK_DIMS.tShell.mm;
export const STRIKE_Y = KICK_DIMS.strikeY.mm;
export const PILLOW_TOP = R_IN - KICK_DIMS.pillowH.mm;
/** The pillow's far end. Its 18.1 in length is longer than the drum's 18 in
 *  inside depth: a soft pillow made to "fit 18″ depth kick drums" is drawn
 *  pressed between the heads (1 mm short of each head plane). */
export const PILLOW_X1 = Math.min(KICK_DIMS.pillowLen.mm, KICK_DIMS.L.mm - 1);

/* ── SUGGESTED STARTING POINTS (lesson table L19-37; corrections K-01, K-02,
 *  K-09). Learner-facing: label, band, tendency, checks — plain starting-point
 *  words (owner ruling 2026-10-04). `kind`, `src`, `quote` and every `prov`
 *  are the INTERNAL research record, never shown. ── */
const DYN_STAND = ['kickDynCard', 'kickDynSuper', 'sdc'];

export const KICK_ZONES: DocumentedZone[] = [
  {
    id: 'in.near',
    label: 'Inside, near the batter head',
    band: 'Start about 5–7.5 cm (2–3 in) from the batter head, a little off the beater’s line.',
    kind: 'sourced',
    src: 'S-B52-UG',
    quote: '5 to 7.5 cm (2 to 3 in.) away from beater head, slightly off-center from beater.',
    refSurface: 'batter',
    side: 'inside',
    distance: { min: 50, max: 75 },
    radial: { line: 'beater', min: 10, max: 80, prov: ill('"slightly off-center": the guide gives no amount; 1 to 8 cm is the lab’s drawing of it') },
    requires: { variant: 'ported', micTypeIds: ['kickDynSuper'] },
    aim: { maxOffAxis: 30, prov: ill('the row assumes the mic faces the head it is measured from; ±30° is the lab’s tolerance') },
    start: { p: { x: 60, y: STRIKE_Y, z: 40 }, az: 0, el: 0 },
    tendency: 'A sharp, defined attack with plenty of low end, and the loudest spot of these starting points. Why so much low end this close? A directional mic near a radiating head lifts its own lows (proximity effect) — that is this mic at this distance, not a rule that deeper means more bass. Move it and listen.',
    checks: ['Clearance from the batter head, the damping and the beater', 'The total tone, on this drum', 'Input overload on the strongest strokes'],
  },
  {
    id: 'in.far',
    label: 'Inside, farther in, on the beater’s line',
    band: 'Start about 20–30 cm (8–12 in) from the batter head, facing the beater.',
    kind: 'sourced',
    src: 'S-B52-UG',
    quote: '20 to 30 cm (8 to 12 in.) from beater head, on-axis with beater.',
    refSurface: 'batter',
    side: 'inside',
    distance: { min: 200, max: 300 },
    radial: { line: 'beater', max: 15, prov: ill('"on-axis with beater": within 1.5 cm of the beater line is the lab’s tolerance') },
    requires: { variant: 'ported', micTypeIds: ['kickDynSuper'] },
    aim: { maxOffAxis: 30, prov: ill('the row assumes the mic faces the head it is measured from; ±30° is the lab’s tolerance') },
    start: { p: { x: 250, y: STRIKE_Y, z: 0 }, az: 0, el: 0 },
    tendency: 'A softer attack and a more balanced sound. Compare attack and resonance on this drum — only where the drum and the mic physically fit.',
    checks: ['The whole assembly still clears the port edge, the damping and the beater', 'Articulation against resonance, on this drum'],
  },
  {
    id: 'in.pillow',
    label: 'Boundary mic resting on the pillow',
    band: 'Start about 2.5–15 cm (1–6 in) from the batter head, resting on the cushioning.',
    kind: 'sourced',
    src: 'S-B91-UG',
    quote: 'Inside drum, on a pillow or other cushioning surface, 25 to 152 mm (1 to 6 in.) from beater head.',
    refSurface: 'batter',
    side: 'inside',
    distance: { min: 25, max: 152 },
    requires: { mount: 'surface', micTypeIds: ['boundaryHalf'] },
    start: { p: { x: 60, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'A full, natural sound; with a contour switch (if the mic has one), a sharper attack and more low-end punch. Resting on cushioning suits a boundary mic made for it.',
    checks: ['It rests on the cushioning, grille uncovered', 'Orientation: sources within 60° above the surface', 'The cable is stable and clear of the pedal', 'The contour switch setting'],
  },
  {
    id: 'reso.level',
    label: 'Level with the front head',
    band: 'Start level with the front head — just inside or just outside it, within about 6 cm (2.4 in).',
    kind: 'sourced',
    src: 'SN-902-2019',
    quote: 'Position the microphone at the level of the resonant head.',
    refSurface: 'reso',
    side: 'either',
    distance: { min: -60, max: 60 },
    bandProv: ill('"at the level of": the manual gives no distance; ±6 cm about the head plane is the lab’s drawing of it'),
    requires: { micTypeIds: ['kickDynCard'] },
    start: { p: { x: L + 40, y: 0, z: 0 }, az: 0, el: 0 },
    tendency: 'Less attack and more resonance — a smoother, fuller sound than close to the batter head.',
    checks: ['Room and kit spill', 'Port-air noise, if the head is ported', 'The usable balance in context'],
  },
  {
    id: 'out.edge',
    label: 'Just outside, toward the edge of the front head',
    band: 'Start about 2–15 cm (1–6 in) outside the front head, toward its edge.',
    kind: 'sourced',
    src: 'DPA-KICK',
    quote: 'Sometimes placing a kick drum mic just outside the drum, on the edge of the resonator head, gives more impact.',
    refSurface: 'reso',
    side: 'outside',
    distance: { min: 20, max: 150 },
    bandProv: ill('"just outside": no distance given; 2 to 15 cm is the lab’s drawing of it'),
    radial: { line: 'axis', min: 180, max: 300, prov: ill('"on the edge": 18 to 30 cm from the drum’s axis is the lab’s drawing of it') },
    requires: { micTypeIds: ['sdc', 'kickDynCard', 'kickDynSuper'] },
    aim: { maxOffAxis: 30, prov: ill('the row assumes the mic faces the head it is measured from; ±30° is the lab’s tolerance') },
    start: { p: { x: L + 60, y: -220, z: 0 }, az: 0, el: 0 },
    tendency: 'Sometimes more impact. A natural choice when the front head has no port. You will hear more of the kit around the drum, too.',
    checks: ['The head’s contribution', 'The surrounding kit sound', 'Any acoustic gain needed live'],
  },
  {
    id: 'in.offset',
    label: 'Inside, a third of the way in from the edge',
    band: 'Start about 5–10 cm (2–4 in) from the batter head, about a third of the way in from the edge of the head.',
    kind: 'trial',
    src: 'S-LIVE',
    quote: 'Mount microphone on boom arm inside drum a few inches from beater head, about 1/3 of way in from edge of head (Position D)',
    refSurface: 'batter',
    side: 'inside',
    distance: { min: 50, max: 100 },
    bandProv: trial('S-LIVE', '"a few inches" has no number; 2 to 4 in is the lab’s reading'),
    radial: { line: 'axis', min: (2 / 3) * R - 30, max: (2 / 3) * R + 30, prov: trial('S-LIVE', '"about 1/3 of way in from edge" = 2/3 × 279.4 mm ≈ 186 mm from the axis, ±3 cm; the direction is not stated') },
    requires: { variant: 'ported', micTypeIds: DYN_STAND },
    aim: { maxOffAxis: 30, prov: ill('the row assumes the mic faces the head it is measured from; ±30° is the lab’s tolerance') },
    start: { p: { x: 75, y: 0, z: -(2 / 3) * R }, az: 0, el: 0 },
    tendency: 'Off-centre placement tends to pick up more overtones.',
    checks: ['Clearance from the shell, the damping and the head', 'Overtones against attack, on this drum'],
  },
];
