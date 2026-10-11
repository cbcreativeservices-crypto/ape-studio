/**
 * C09c CELLO — the technical truth (charter §2 layer 1). Source keys point
 * into docs/labs/miking/cello/SOURCES.md and violin/SOURCES.md (the bowed
 * family's keys); the geometry follows cello/GEOMETRY_PROPOSAL.md on the
 * shared bowed family (lessons/shared/bowed/).
 *
 * LESSON FRAME (the engine's): origin B0 = the bridge's foot line on the
 * top; +x toward the audience; +y DOWN; +z the player's right. The cellist
 * sits behind the cello and faces +x (posture.ts `seated`).
 *
 * SUGGESTED STARTING POINTS (corrections C-01 … C-05 in CORRECTIONS_LOG):
 *   front  "one foot from the bridge" (Shure) — 25–35 cm, drawn ±5 cm round
 *          the foot; "in front" is the lesson's reading of a direction the
 *          source does not give (C-02);
 *   far    a farther view for a solo in a good room — no number in the
 *          lesson; 0.6–1.2 m, inside the proposal's 600–1500 drawing default;
 *   clip   DPA's string clip: on the C and A strings below the bridge, the
 *          capsule between the bridge and the fingerboard, under the strings
 *          (the natural position) — the distance is a drawing default;
 *   fhole  the same clip angled to an f-hole (DPA: "for the highest output").
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { CELLO, archAt, stringZ } from '../shared/bowed/bowedSpec.ts';
import { anchorsOf, seated, toLesson } from '../shared/bowed/posture.ts';
import { aimAt, along, zoneDisc, zoneSection } from '../shared/bowed/bowedModel.ts';

export const SPEC = CELLO;
export const POSTURE = seated(SPEC);
export const A = anchorsOf(POSTURE);
const ax = POSTURE.ax;
const B = (x: number, y: number, z: number) => toLesson(ax, { x, y, z });

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const D = Math.PI / 180;

/** The space under the strings between the bridge and the fingerboard,
 *  where DPA's clip brings the capsule. */
export const UNDER = B(62, 0, (archAt(SPEC, 62) + stringZ(SPEC, 62)) / 2 - 6);
/** The f-hole setting's capsule: still under the strings, turned to the
 *  treble f-hole. */
export const FH = B(60, 15, 42);
/** Where the clip grips the C and A strings, below the bridge. */
export const CLIP_AT = { x: -60, y: 0, z: stringZ(SPEC, -60) };

const sideOf = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number, toward?: Vec3) => ({
  side: zoneSection('side', target, axis, cone, r0, r1, toward),
  top: zoneSection('top', target, axis, cone, r0, r1, toward),
});

const FRONT_DIR = norm(add(ax.z, scale(ax.y, 0.38)));
const FAR_DIR = norm(add(ax.z, scale(ax.y, 0.2)));

export const CELLO_ZONES: DocumentedZone[] = [
  {
    id: 'vc.front',
    label: 'In front of the bridge, about a foot away',
    band: 'Start about 25–35 cm (10–14 in) from the bridge, in front of it, aimed at the bridge and top — a little to one side so the bow’s sweep stays clear.',
    kind: 'sourced',
    src: 'S-BWS',
    quote: 'place the mic one foot from the bridge to produce a well-defined, balanced sound, though with less isolation from other instruments',
    bandProv: ill('"one foot from the bridge": drawn 25–35 cm round 30.5 cm; "in front" is the lesson’s reading (Shure gives no direction)'),
    refSurface: 'bridge',
    side: 'outside',
    distance: { min: 250, max: 350 },
    cone: { min: 0, max: 40, prov: ill('in front of the top: within 40° of its straight-on line (the lab’s drawing)') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the bridge and top region: within 25° (the lab’s tolerance)') },
    requires: { micTypeIds: ['sdcCard'] },
    draw: sideOf(A.bridgeTop, ax.z, 40, 250, 350),
    start: aimAt(along(A.bridgeTop, FRONT_DIR, 300), A.bridgeTop),
    tendency: 'A defined, fairly balanced cello — body, string and some room together. It hears neighbouring instruments too. Move it and listen.',
    checks: ['The bow’s full sweep and the bow arm stay clear of the mic and stand', 'The low C and the high A both sound even', 'How much of the other players it hears'],
  },
  {
    id: 'vc.far',
    label: 'Farther in front, for a solo in a good room',
    band: 'Try about 0.6–1.2 m (2–4 ft) in front, aimed at the cello, when the room sounds good.',
    kind: 'trial',
    src: 'LESSON',
    quote: 'For a solo in a good room, try a farther position to hear a more integrated sound (L9; no number)',
    bandProv: ill('no number in the lesson: 0.6–1.2 m, inside the proposal’s 600–1500 drawing default'),
    refSurface: 'bridge',
    side: 'outside',
    distance: { min: 600, max: 1200 },
    cone: { min: 0, max: 45, prov: ill('in front: within 45° of the top’s straight-on line') },
    aim: { maxOffAxis: 25, prov: ill('aimed at the cello: within 25°') },
    requires: { micTypeIds: ['sdcCard'] },
    draw: sideOf(A.bridgeTop, ax.z, 45, 600, 1200),
    start: aimAt(along(A.bridgeTop, FAR_DIR, 850), A.bridgeTop),
    tendency: 'The body and the room blend into one sound; more of the room and of any other players comes with it.',
    checks: ['Whether the room is worth hearing', 'Other players and monitors reaching the mic'],
  },
  {
    id: 'vc.clip',
    label: 'Miniature on the strings, under them',
    band: 'Clip it to the two outer strings below the bridge, and bring the capsule about 4–9 cm from the bridge’s foot on the fingerboard side — under the strings, below the bow’s path.',
    kind: 'sourced',
    src: 'DPA-VC',
    quote: 'Attaching the microphone to the C and A string below the bridge places the microphone capsule in the sweet spot, between the bridge and fingerboard.',
    bandProv: ill('no distance is given: 4–9 cm from the bridge’s foot, under the strings, is the lab’s drawing'),
    refSurface: 'foot',
    side: 'outside',
    distance: { min: 40, max: 90 },
    cone: { min: 0, max: 45, toward: ax.x, prov: ill('between the bridge and the fingerboard, under the strings: within 45° of the strings’ line') },
    aim: { maxOffAxis: 50, prov: ill('aimed back toward the bridge and top (the natural setting): within 50°') },
    requires: { micTypeIds: ['strMini'] },
    draw: { side: zoneDisc('side', UNDER, 32), top: zoneDisc('top', UNDER, 32) },
    start: aimAt(UNDER, B(0, 0, (archAt(SPEC, 62) + stringZ(SPEC, 62)) / 2 - 6)),
    tendency: 'A close, steady view of the strings and top that moves with the player — with less spill, but a narrower, more coloured picture of the cello.',
    checks: ['A clip made for this cello, with the player’s agreement', 'Nothing touches the bridge, and the bow never meets the gooseneck', 'The cable’s route away from the endpin, the chair and the feet'],
  },
  {
    id: 'vc.fhole',
    label: 'The same miniature, angled toward an f-hole',
    band: 'With the clip on the strings below the bridge, angle the capsule toward an f-hole, about 4–11 cm from the bridge’s foot.',
    kind: 'sourced',
    src: 'DPA-MOUNT',
    quote: 'For the most natural sound: below the bridge, between instrument top (belly) and strings. For the highest output: angled to one of t[he f-holes]',
    bandProv: ill('no distance is given: 4–11 cm from the bridge’s foot is the lab’s drawing'),
    refSurface: 'foot',
    side: 'outside',
    distance: { min: 40, max: 110 },
    cone: { min: 0, max: 70, toward: ax.x, prov: ill('on the fingerboard side of the bridge (the lab’s drawing)') },
    aimAt: { surface: 'fhole', r: 45, prov: ill('aimed at the f-hole: the mic’s axis meets the top within 45 mm of its middle') },
    requires: { micTypeIds: ['strMini'] },
    draw: { side: zoneDisc('side', FH, 38), top: zoneDisc('top', FH, 38) },
    start: aimAt(FH, A.fholeT),
    tendency: 'More level, and often more low-mid body — and, in some setups, a duller or more uneven sound than aiming at the bridge. Check feedback on stage.',
    checks: ['The bow’s path, as before', 'Boomy or uneven notes', 'Feedback with the monitors on'],
  },
];

export { D };
