/**
 * C09a VIOLIN / FIDDLE — the recommended starting points (charter §2 layer
 * 1). Source keys point into docs/labs/miking/violin/SOURCES.md (the bowed
 * family's keys are in its §0); the geometry is violin/GEOMETRY_PROPOSAL.md
 * on the shared bowed family. Corrections V-01 … V-06 (CORRECTIONS_LOG).
 *
 *   front   the lesson's own studio start, "in front and somewhat above the
 *           violin, looking toward the bridge/top, 0.5–1.2 m" — an unsourced
 *           teaching trial (L9, L75), kept as a modest suggestion; it sits
 *           inside the published 30 cm–2 m band for strings (S-PGA27);
 *   close   about 30 cm in front of where the bow meets the strings — a
 *           sourced session figure (GEOS), added (V-02);
 *   side    "a few inches from the side" for reinforcement (Shure, no
 *           number): 5–10 cm, drawn at the lower bout, clear of the bow;
 *   clip    a miniature on the bass-side rib, the capsule over the top
 *           aimed at the bridge or an f-hole, away from the head (DPA);
 *   holder  a holder gripping two strings between the tailpiece and the
 *           bridge, the capsule over or under the strings (DPA).
 * Every start is found once at load: the first pose (in order of
 * preference) inside the zone and clear of every solid, standing AND seated.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { add, norm, scale, sub } from '../../engine/geometry/vec.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { around, firstClear, zoneDisc, zoneSection } from '../shared/bowed/bowedModel.ts';
import { A, BEHIND, CLOSE_DIR, FRONT, RIB_T, STANDING, VIOLIN_MODEL } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ax = STANDING.ax;
const VARIANTS = ['standing', 'seated'] as const;
const draws = (target: typeof A.bridgeTop, axis: typeof FRONT, cone: number, r0: number, r1: number, toward?: typeof FRONT) => ({
  side: zoneSection('side', target, axis, cone, r0, r1, toward),
  top: zoneSection('top', target, axis, cone, r0, r1, toward),
});
const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<DocumentedZone['start']>): DocumentedZone => ({ ...z, start: firstClear(VIOLIN_MODEL, z, VARIANTS, gen, MIC_TYPES) } as DocumentedZone);

const FRONT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'vn.front',
  label: 'In front of the violin, a little above it',
  band: 'Try about 0.5–1.2 m (about 1.6–3.9 ft) from the bridge, in front of the player and a little above the violin, aimed at the bridge and top — a modest place to begin.',
  kind: 'trial',
  src: 'LESSON',
  quote: 'begin with one mic in front and somewhat above the violin, looking toward the bridge/top region while remaining well outside the bow’s full sweep … A practical solo trial is approximately 0.5–1.2 m (1.5–4 ft) (L9)',
  bandProv: { kind: 'trial', src: 'S-PGA27', note: 'the lesson’s own unsourced trial (L75), inside the published "Strings or horns 1-6 feet (30 cm - 2 m)"; "1.5–4 ft" corrected to about 1.6–3.9 ft (V-01)' },
  refSurface: 'bridge',
  side: 'outside',
  distance: { min: 500, max: 1200 },
  cone: { min: 0, max: 35, prov: ill('in front and a little above: within 35° of a line 20° above the audience-facing direction') },
  aim: { maxOffAxis: 25, prov: ill('aimed at the bridge and top: within 25° (the lab’s tolerance)') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.bridgeTop, FRONT, 35, 500, 1200),
  tendency: 'The whole violin blended — strings, body and some room. More of the room and the neighbours comes with it. A modest place to begin; move it and listen.',
  checks: ['The bow’s full sweep and the bow arm stay clear of the mic and stand', 'Quiet bow starts, string changes and the loudest passage', 'How much room and how many neighbours it hears'],
};

const CLOSE_Z: Omit<DocumentedZone, 'start'> = {
  id: 'vn.close',
  label: 'About 30 cm in front of where the bow meets the strings',
  band: 'Try about 25–35 cm (10–14 in) in front of where the bow meets the strings, aimed there — closer, for more definition.',
  kind: 'sourced',
  src: 'GEOS',
  quote: 'A DPA 4023 compact cardioid… positioned approximately 30cm in front of where the bow rubs the strings to capture articulation without suffering proximity effect',
  bandProv: ill('"approximately 30cm": drawn 25–35 cm'),
  refSurface: 'contact',
  side: 'outside',
  distance: { min: 250, max: 350 },
  cone: { min: 0, max: 45, prov: ill('in front of the top, toward the audience side: within 45° (the lab’s drawing)') },
  aim: { maxOffAxis: 25, prov: ill('aimed at where the bow meets the strings: within 25°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(A.contact, ax.z, 45, 250, 350),
  tendency: 'More articulation and presence from the bow; listen that the rosin and scratch do not take over, and play all four strings — the E can sound brighter than the G.',
  checks: ['The bow’s sweep and the bow arm at the tip of a stroke', 'Scratch and rosin noise', 'The G string against the E'],
};

const SIDE_Z: Omit<DocumentedZone, 'start'> = {
  id: 'vn.side',
  label: 'A few inches from the side',
  band: 'For a stage: try about 5–10 cm (2–4 in) from the side of the violin by its lower bout, aimed at the body — clear of the bow and the bow arm.',
  kind: 'sourced',
  src: 'S-BWS',
  quote: 'Place the microphone a few inches from the side of the violin to capture a natural, well-balanced sound.',
  bandProv: ill('"a few inches" has no number: 5–10 cm from the treble rib at the lower bout is the lab’s drawing (the proposal drew it at the bridge, inside the bow’s path — V-03)'),
  refSurface: 'side',
  side: 'outside',
  distance: { min: 50, max: 100 },
  cone: { min: 0, max: 50, prov: ill('beside the rib: within 50° of its outward line') },
  aim: { maxOffAxis: 40, prov: ill('aimed at the body: within 40°') },
  requires: { micTypeIds: ['sdcCard'] },
  draw: draws(RIB_T, ax.y, 50, 50, 100),
  tendency: 'Separation on a busy stage, with a closer, more local colour. The player must stay with it: mark the spot.',
  checks: ['The bow arm at the frog and at the tip', 'The player’s movement away from the mic', 'Feedback with the monitors on'],
};

const CLIP_Z: Omit<DocumentedZone, 'start'> = {
  id: 'vn.clip',
  label: 'Miniature clipped to the side, over the top',
  band: 'Clip it to the bass-side rib by the lower bout and bring the capsule about 3–9 cm from the bridge’s foot, over the top, aimed at the bridge (or toward an f-hole) — away from the player’s face.',
  kind: 'sourced',
  src: 'DPA-MOUNT',
  quote: 'Most players prefer the 4099V to be placed on the left side of the instrument… Point the microphone away from the performer’s head to avoid breath noise.',
  bandProv: ill('no distance is given: 3–9 cm from the bridge’s foot on the bass side is the lab’s drawing'),
  refSurface: 'foot',
  side: 'outside',
  distance: { min: 30, max: 90 },
  cone: { min: 15, max: 80, toward: scale(ax.y, -1), prov: ill('over the top on the bass side (the lab’s drawing)') },
  aim: { maxOffAxis: 50, prov: ill('aimed at the bridge and top, away from the head: within 50°') },
  requires: { micTypeIds: ['strMini'] },
  draw: { side: zoneDisc('side', add(A.bridgeFoot, scale(norm(add(ax.z, scale(ax.y, -1))), 50)), 30), top: zoneDisc('top', add(A.bridgeFoot, scale(norm(add(ax.z, scale(ax.y, -1))), 50)), 30) },
  tendency: 'A steady close sound as the player moves — aimed at the bridge it is brighter; toward an f-hole, more level and a little duller. A narrower, more coloured picture than a stand mic.',
  checks: ['A clip made for this violin, fitted to its depth, with the player’s agreement', 'Nothing touches the bridge or the varnish; the bow never meets the gooseneck', 'Chin rest, shoulder rest and the full bow, then the cable'],
};

const HOLDER_Z: Omit<DocumentedZone, 'start'> = {
  id: 'vn.holder',
  label: 'Miniature on a holder behind the bridge',
  band: 'On a holder gripping two strings between the tailpiece and the bridge, try the capsule within about 2 cm of the strings just behind the bridge — under them or over them.',
  kind: 'sourced',
  src: 'DPA-MHS',
  quote: 'mounted between the tailpiece and the bridge. It can be turned upwards or downwards so that the mic will be placed either over or under the strings',
  bandProv: ill('no distance is given: within 2 cm of the strings just behind the bridge is the lab’s drawing'),
  refSurface: 'behind',
  side: 'either',
  distance: { min: 0, max: 22 },
  requires: { micTypeIds: ['strMini'] },
  draw: { side: zoneDisc('side', BEHIND, 22), top: zoneDisc('top', BEHIND, 22) },
  tendency: 'Strings and top together with a lot of bite — it can sound harsh; compare under and over the strings. It moves with the violin.',
  checks: ['The holder made for this, gripping two strings, with the player’s agreement', 'Contact and cable noise as the player moves', 'Harshness: compare under and over the strings'],
};

const fwdSide = norm(sub({ x: 0, y: 0, z: 1 }, scale(FRONT, FRONT.z)));
export const VIOLIN_ZONES: DocumentedZone[] = [
  start(FRONT_Z, around(A.bridgeTop, FRONT, [700, 800, 600, 900, 550, 1000], 30, A.bridgeTop, fwdSide)),
  start(CLOSE_Z, around(A.contact, CLOSE_DIR, [300, 280, 320, 260, 340], 40, A.contact, ax.y)),
  start(SIDE_Z, around(RIB_T, ax.y, [75, 65, 85, 60, 90, 55, 95], 48, RIB_T, ax.z)),
  start(CLIP_Z, around(A.bridgeFoot, norm(add(ax.z, scale(ax.y, -1.1))), [55, 45, 65, 40, 75], 30, A.bridgeFoot, ax.x)),
  start(HOLDER_Z, around(BEHIND, ax.z, [0, 6, 10, 14, 18], 90, A.bridgeFoot, ax.y)),
];
