/**
 * I01a HI-HAT — the technical truth (charter §2 layer 1). Source keys point
 * into docs/labs/miking/hihat/SOURCES.md (§0 = the Lab 2 key register); the
 * geometry follows hihat/GEOMETRY_PROPOSAL.md, on the shared kit and the
 * shared cymbal family (cymbalSpec.ts: HIHAT_14, HIHAT_HARDWARE — unchanged).
 *
 * FRAME: the kit frame K (kit/GEOMETRY_PROPOSAL.md §1). The pair sits where
 * the shared kit puts it: the top cymbal's edge plane at h 850 (inside a
 * maker's "80-92cm" stand range), (−470, −650) in plan.
 *
 * THE STARTING POINTS (owner ruling 2026-10-04: suggestions in plain words;
 * the research stays here). Four of the six published close positions are
 * zones (proposal §7 owner question 3 — the lesson shows the ones that are
 * different places to begin): above the bow with the snare hidden; over the
 * far edge, 10–15 cm up; a few centimetres over the outer edge; and under the
 * bottom cymbal on a clip. "Within four inches" and "just below the cup" are
 * said in words (the aim idea and the closeness limit). Every band without a
 * published number is a DRAWING DEFAULT, and the zone's `bandProv` says so.
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { HIHAT_HARDWARE, KIT_PLACED_CYMBALS, hihatStandPoints } from '../shared/cymbals/cymbalSpec.ts';
import { at, bandDrawn, bandMid, ill, poseToward, thetaOf, towardThrone, type Band } from '../shared/cymbals/cymbalLesson.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });

export const HAT = KIT_PLACED_CYMBALS.hihat;
export const HAT_R = HAT.spec.d.mm / 2;
export const HAT_RISE = HAT.spec.rise.mm;
export const GAP = { closed: HIHAT_HARDWARE.closedGap.mm, open: HIHAT_HARDWARE.openGap.mm } as const;

/** The plan direction from the hats to the snare, and its opposite (the
 *  "far side, away from the snare"): proposal §2, (80, 320)/329.85. */
const S = KIT_DRUMS.snare.c;
const sl = Math.hypot(S.x - HAT.c.x, S.z - HAT.c.z);
export const U_SNARE = { x: (S.x - HAT.c.x) / sl, z: (S.z - HAT.c.z) / sl };
export const FAR = { x: -U_SNARE.x, y: 0, z: -U_SNARE.z };
/** The cymbal-frame angle of the far side (≈ −104°) and of the throne (≈ 119°). */
export const TH_FAR = thetaOf(HAT, FAR.x, FAR.z);
export const TH_THRONE = towardThrone(HAT).theta;

/** The stick's spot: 25 mm in from the edge (DPA-HH "usually around 2-3 cm
 *  (1 inch) from the edge"), toward the throne (direction: drawing default). */
export const STRIKE_R = HAT_R - 25;
export const STRIKE = at(HAT, STRIKE_R, TH_THRONE, 2);

/** The clamp on the stand (drawing default): just under the seat. */
export const STAND_CLAMP_Y = hihatStandPoints().seat.y + 40;

/* ── the bands (r, θ, h in the hats' frame; h along n = up) ── */
export const BAND = {
  top: { r: [60, 148], th: [TH_FAR - 36, TH_FAR + 36], h: [50, 100] } as Band,
  farEdge: { r: [150, 200], th: [TH_FAR - 20, TH_FAR + 20], h: [100, 150] } as Band,
  edgeLow: { r: [150, HAT_R], th: [TH_FAR - 40, TH_FAR + 40], h: [45, 65] } as Band,
  // Under the bottom cymbal: h is NEGATIVE (below the top cymbal's edge plane),
  // measured from the bottom cymbal's edge plane (gap below).
  underC: { r: [100, 150], th: [-40, 40], h: [-(GAP.closed + 85), -(GAP.closed + 50)] } as Band,
  underO: { r: [100, 150], th: [-40, 40], h: [-(GAP.open + 85), -(GAP.open + 50)] } as Band,
} as const;

const toward = (b: Band, f: { r?: number; th?: number; h?: number }, aimAt: Vec3) => poseToward(bandMid(HAT, b, f), aimAt);

export const HAT_ZONES: DocumentedZone[] = [
  {
    id: 'hh.top',
    label: 'Above the top cymbal, the snare hidden',
    band: 'Start about 5–10 cm (2–4 in) above the top cymbal, over its bow on the side away from the snare, angled so the cymbals hide the snare from the mic.',
    kind: 'sourced',
    src: 'DPA-HH',
    quote: 'Position your microphone at an angle where you can’t see the snare drum and place the microphone 5-10 cm from the top of the hi-hat cymbal.',
    refSurface: 'hatTop',
    side: 'outside',
    distance: { min: 50, max: 100 },
    radial: { line: 'hatEdge', min: 60 - HAT_R, max: 148 - HAT_R, prov: ill('"from the top of the hi-hat": the lab draws it over the bow, 6–14.8 cm from the centre (clear of the clutch)') },
    cone: { min: 25, max: 75, toward: FAR, prov: ill('"an angle where you can’t see the snare": the half of the pair away from the snare, read as a plan side') },
    aimAt: { surface: 'hatTop', r: HAT_R, prov: ill('aimed at the top cymbal') },
    requires: { micTypeIds: ['sdcCard'] },
    drawn: bandDrawn(HAT, BAND.top),
    start: toward(BAND.top, { r: 0.55, h: 0.5 }, at(HAT, 40, TH_FAR, 0)),
    tendency: 'A clear hi-hat with the stick’s detail, and the pair itself shading the snare. Toward the edge tends to bring more of the lower tones; toward the cup more of the high overtones — tendencies to check by ear.',
    checks: ['The pair hides the snare from the mic', 'Clear of the stick and the player’s left arm', 'The pair opened all the way, and the mic still clear'],
  },
  {
    id: 'hh.farEdge',
    label: 'Over the far edge, away from the snare',
    band: 'Start about 10–15 cm (4–6 in) above, directly over the edge on the far side away from the snare, pointing straight down.',
    kind: 'sourced',
    src: 'S-REC1',
    quote: 'try placing a pencil condenser mic roughly 10 - 15 cm away and pointing directly down at the edge on the far side, away from the snare.',
    refSurface: 'hatTop',
    side: 'outside',
    distance: { min: 100, max: 150 },
    radial: { line: 'hatEdge', min: 150 - HAT_R, max: 200 - HAT_R, prov: ill('"at the edge": the lab counts 2.8 cm in to 2.2 cm out past it') },
    cone: { min: 38, max: 66, toward: FAR, prov: ill('"on the far side, away from the snare": the half of the pair away from the snare') },
    aim: { maxOffAxis: 20, prov: ill('"pointing directly down": within 20° of straight down is the lab’s tolerance') },
    requires: { micTypeIds: ['sdcCard'] },
    drawn: bandDrawn(HAT, BAND.farEdge),
    start: { p: bandMid(HAT, BAND.farEdge, { r: 0.45, h: 0.5 }), az: 0, el: -90 },
    tendency: 'The hats on their own with the snare farther away and off to the side. Higher up takes in more of the whole pair; lower, more of the edge.',
    checks: ['Straight down at the edge, the snare on the far side of the pair', 'The pair opened all the way, and the mic still clear', 'The boom out of the player’s left arm'],
  },
  {
    id: 'hh.edgeLow',
    label: 'A few centimetres over the outer edge',
    band: 'Start a few centimetres — about 4.5–6.5 cm (2–2.5 in) — above the top cymbal’s outer edge on the far side, aimed down. Close to the edge, keep the mic out of the air that rushes out as the pair closes.',
    kind: 'trial',
    src: 'SN-E914',
    quote: 'Position the microphone a few centimetres above the outer edge of the hi-hat aiming down. … When closing the hi-hat, a strong air current is created on the edge.',
    bandProv: ill('"a few centimetres": 4.5–6.5 cm is the lab’s drawing of it — it starts where the body clears the top cymbal’s opening travel'),
    refSurface: 'hatTop',
    side: 'outside',
    distance: { min: 45, max: 65 },
    radial: { line: 'hatEdge', min: 150 - HAT_R, max: 0, prov: ill('"above the outer edge": the outer 2.8 cm of the top cymbal') },
    cone: { min: 64, max: 80, toward: FAR, prov: ill('the far side, out of the stick’s path') },
    aim: { maxOffAxis: 30, prov: ill('"aiming down": within 30° of straight down is the lab’s tolerance') },
    requires: { micTypeIds: ['sdcCard', 'smallDynCard'] },
    drawn: bandDrawn(HAT, BAND.edgeLow),
    start: { p: bandMid(HAT, BAND.edgeLow, { r: 0.55, h: 0.5 }), az: 0, el: -90 },
    tendency: 'Close and bright, with the most of the hats against the rest of the kit. So close to the edge, the air burst as the pair closes is the thing to listen for — a low thump or wind noise means move it.',
    checks: ['Clear of the air burst at the edge (listen as the pair closes)', 'A high-pass filter only if the low end is unwanted', 'The pair opened all the way, and the mic still clear'],
  },
  {
    id: 'hh.under',
    label: 'Under the bottom cymbal, on a clip',
    band: 'Start with a small clip-on mic on the stand, about 5–8.5 cm (2–3.5 in) under the bottom cymbal, on the audience side, aimed up at it.',
    kind: 'trial',
    src: 'DPA-HH',
    quote: 'The 4099 CORE+ can be mounted underneath the hi-hat using the universal U-CLIP Universal Microphone Clip. … If the hi-hat is miked from the bottom side, there will be a loss of stick attack and the warmer tones of the top cymbal will be attenuated.',
    bandProv: ill('no distance is published for the underside: 5–8.5 cm under the bottom cymbal, 10–15 cm out from the stand, is the lab’s drawing'),
    refSurface: 'hatUnderC',
    side: 'outside',
    distance: { min: 50, max: 85 },
    radial: { line: 'hatEdge', min: 100 - HAT_R, max: 150 - HAT_R, prov: ill('out from the stand, under the bow') },
    cone: { min: 45, max: 75, toward: { x: 1, y: 0, z: 0 }, prov: ill('the audience side of the stand, away from the pedal and the player’s foot') },
    aim: { maxOffAxis: 45, prov: ill('aimed up at the bottom cymbal: within 45° of straight up is the lab’s tolerance') },
    requires: { variant: 'closed', micTypeIds: ['standClip'] },
    drawn: bandDrawn(HAT, BAND.underC),
    start: toward(BAND.underC, { r: 0.5, th: 0.5, h: 0.45 }, at(HAT, 95, 0, -(GAP.closed + 10))),
    tendency: 'Out of the way, and out of the stick’s path. From below there tends to be less of the stick’s attack, and the warmer tones of the top cymbal are softer — a different hi-hat, not a worse one.',
    checks: ['The clip fits the stand and holds', 'Clear of the pedal, the player’s foot and the pull rod', 'Less stick, warmer: is that what the music wants?'],
  },
  {
    id: 'hh.underOpen',
    label: 'Under the bottom cymbal, on a clip',
    band: 'Start with a small clip-on mic on the stand, about 5–8.5 cm (2–3.5 in) under the bottom cymbal, on the audience side, aimed up at it.',
    kind: 'trial',
    src: 'DPA-HH',
    quote: 'The 4099 CORE+ can be mounted underneath the hi-hat using the universal U-CLIP Universal Microphone Clip.',
    bandProv: ill('as the closed pair; measured from the bottom cymbal in the open drawing'),
    refSurface: 'hatUnderO',
    side: 'outside',
    distance: { min: 50, max: 85 },
    radial: { line: 'hatEdge', min: 100 - HAT_R, max: 150 - HAT_R, prov: ill('out from the stand, under the bow') },
    cone: { min: 45, max: 75, toward: { x: 1, y: 0, z: 0 }, prov: ill('the audience side of the stand') },
    aim: { maxOffAxis: 45, prov: ill('within 45° of straight up') },
    requires: { variant: 'open', micTypeIds: ['standClip'] },
    drawn: bandDrawn(HAT, BAND.underO),
    start: toward(BAND.underO, { r: 0.5, th: 0.5, h: 0.45 }, at(HAT, 95, 0, -(GAP.open + 10))),
    tendency: 'Out of the way, and out of the stick’s path. From below there tends to be less of the stick’s attack, and the warmer tones of the top cymbal are softer.',
    checks: ['The clip fits the stand and holds', 'Clear of the pedal and the player’s foot', 'Less stick, warmer: is that what the music wants?'],
  },
];

/** "Within four inches" (S-RECBK, 101.6 mm) — a closeness limit said in words. */
export const WITHIN_4IN = { mm: 101.6, prov: src('S-RECBK', 'a mic placed away from the puff of air that happens when hi-hats close and within four inches to the cymbals should be a good starting point') } as const;
