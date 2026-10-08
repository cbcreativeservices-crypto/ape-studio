/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — the recommended starting points
 * (charter §2 layer 1): the engine's zones (for the shared pages' data and
 * the tests), the lesson's STARTING SETUPS drawn on the venue plans, the
 * Placement Studio's zones and the two-zone overlap pair. Research:
 * docs/labs/miking/audience_ambience/SOURCES.md and GEOMETRY_PROPOSAL.md
 * §3; words from the owner's lesson (source_text/B08-…; "L<n>" in comments
 * only). No source gives a crowd mic's height, distance or angle: every
 * place is a drawing default on the venue plan; the REASONING (faces, not the
 * PA; the nearest seat; a pair, not two zones) is DERIVED.
 *
 * ENGINE ZONES (frame: geometry.ts — the studio audience):
 *   b8.mono    one directional crowd mic on the rigging bar, above and a
 *              little in front of the section, aimed at the faces, the PA
 *              off its axis (S-TOP6) — ONE MIC and the worked example;
 *   b8.xy      a coincident XY pair at the same place (DPA-STEREO) — TWO MICS;
 *   b8.zoneL   a crowd mic at the stage's front corner on the
 *              left, aimed into the section away from the PA (PRACTICE: the
 *              lesson L19) — one of two zones;
 *   b8.zoneR   the same on the right (left and right as drawn).
 */
import type { DocumentedZone, MicPose, Provenance } from '../../engine/model/types.ts';
import { engineAim, toEngine, type P2, type PlanRect } from '../shared/sports/venuePlan.ts';
import type { PlanZone, SportMic, SportSetup } from '../shared/sports/sportsPages';
import { EVENT, EVENT_SCENE, FACE_H, STUDIO } from '../shared/broadcast/venue.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const pose = (at: P2, h: number, to: P2, hTo: number): MicPose => ({ p: toEngine(at, h), ...engineAim(at, h, to, hTo) });
/** A plan rectangle and a height range as an engine box (mm). */
const boxOf = (r: PlanRect, h0: number, h1: number, why: string) => ({ min: { x: r.x0 * 1000, y: -h1 * 1000, z: -r.y1 * 1000 }, max: { x: r.x1 * 1000, y: -h0 * 1000, z: -r.y0 * 1000 }, prov: ill(why) });

/** The zone mics' aim points: into the section, away from the PA beside them. */
export const ZL_AIM = { x: -2.2, y: 5 };
export const ZR_AIM = { x: 2.2, y: 5 };

function crowdZone(o: { id: string; label: string; band: string; kind: 'sourced' | 'trial'; src: string; quote: string; at: P2; h: number; aimAt: P2; rect: PlanRect; hr: [number, number]; dist: [number, number]; tendency: string; checks: string[] }): DocumentedZone {
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: o.kind,
    src: o.src,
    quote: o.quote,
    bandProv: ill('no source gives a crowd mic’s height, distance or angle: the place, the height and the band are drawing defaults on the venue plan'),
    refSurface: 'tS',
    side: 'either',
    distance: { min: o.dist[0], max: o.dist[1] },
    aimAt: { surface: 'tS', r: 2500, prov: ill('aimed at the section’s faces within about 2.5 m at its distance (the lab’s tolerance)') },
    box: boxOf(o.rect, o.hr[0], o.hr[1], 'the approved place (the lab’s box)'),
    requires: { micTypeIds: ['arrCard'] },
    start: pose(o.at, o.h, o.aimAt, FACE_H),
    tendency: o.tendency,
    checks: o.checks,
  };
}

export const B08_ZONES: DocumentedZone[] = [
  crowdZone({
    id: 'b8.mono',
    label: 'One crowd mic above the front of the section',
    band: 'After our research, here is where we recommend you begin: one directional mic raised above and somewhat in front of a representative section, aimed down at the faces and upper bodies, the PA as far off its front as you can — then listen and adjust.',
    kind: 'sourced',
    src: 'S-TOP6',
    quote: 'one (or two for stereo) microphone(s) above and somewhat in front of the congregation … aimed at the faces of the people and away from the main PA speakers',
    at: STUDIO.M,
    h: STUDIO.hBar,
    aimAt: STUDIO.S,
    rect: STUDIO.bar,
    hr: [2.8, 3.8],
    dist: [3000, 5000],
    tendency: 'The section’s laughter and applause together, the PA off to the side of its pattern. One position can still over-represent a few people, an aisle or the nearest clapper — and it gives no width.',
    checks: ['Quiet speech, applause and the PA at full level', 'One nearby person dominating', 'Mounted safely by qualified crew'],
  }),
  crowdZone({
    id: 'b8.xy',
    label: 'An XY pair at the same place',
    band: 'For stereo from one place, an idea to try: a coincident XY pair of cardioids at the same raised place, angled to take in the section’s width.',
    kind: 'sourced',
    src: 'DPA-STEREO',
    quote: 'XY: a coincident pair, a stable image and a predictable mono sum (Lab 5 full_orchestra §A; the lesson L18)',
    at: STUDIO.M,
    h: STUDIO.hBar,
    aimAt: STUDIO.S,
    rect: STUDIO.bar,
    hr: [2.8, 3.8],
    dist: [3000, 5000],
    tendency: 'Width with a stable centre and a predictable mono sum — less spacious than a spaced pair, and a central place may hear more PA than crowd.',
    checks: ['The width against the section', 'The mono sum', 'The PA in the middle of the image'],
  }),
  crowdZone({
    id: 'b8.zoneL',
    label: 'A zone mic at the stage’s left corner',
    band: 'For two zones: a crowd mic at each front corner of the stage, raised, aimed into its side of the section and away from the PA beside it — each on its own channel.',
    kind: 'trial',
    src: 'LESSON-B08',
    quote: 'Place distinct left/right crowd positions with similar coverage and a known channel map, often raised at stage edges or in front of audience sections. Aim away from PA (L19; PRACTICE)',
    at: STUDIO.ZL,
    h: STUDIO.hCorner,
    aimAt: ZL_AIM,
    rect: STUDIO.cornerL,
    hr: [2.0, 3.0],
    dist: [4500, 8000],
    tendency: 'Its own part of the audience on its own channel — not a stereo pair: unequal local events and PA pickup can wander and colour the mono sum.',
    checks: ['Each channel alone, then the mono sum', 'The PA beside it', 'The channel map named'],
  }),
  crowdZone({
    id: 'b8.zoneR',
    label: 'A zone mic at the stage’s right corner',
    band: 'The other zone: the same at the opposite corner, aimed into its side of the section, away from the PA beside it.',
    kind: 'trial',
    src: 'LESSON-B08',
    quote: 'Place distinct left/right crowd positions with similar coverage and a known channel map (L19; PRACTICE)',
    at: STUDIO.ZR,
    h: STUDIO.hCorner,
    aimAt: ZR_AIM,
    rect: STUDIO.cornerR,
    hr: [2.0, 3.0],
    dist: [4500, 8000],
    tendency: 'Its own part of the audience on its own channel — combined with the other zone, check the mono sum.',
    checks: ['Each channel alone', 'The PA beside it', 'The channel map named'],
  }),
];

/* ═════════ the plan setups (the lesson's own STARTING SETUPS page) ═════════ */

const m = (id: string, kind: SportMic['kind'], label: string, at: P2, h: number, aimAt: P2, aimH: number, pattern: SportMic['pattern'] = null): SportMic => ({ id, kind, label, at, h, aimAt, aimH, pattern });
export const MONO = m('mono', 'compact', 'crowd mic', STUDIO.M, STUDIO.hBar, STUDIO.S, FACE_H, 'cardioid');
export const XY = m('xy', 'xy', 'XY pair', STUDIO.M, STUDIO.hBar, STUDIO.S, FACE_H);
export const ZONE_L = m('zl', 'compact', 'zone mic, left', STUDIO.ZL, STUDIO.hCorner, ZL_AIM, FACE_H, 'cardioid');
export const ZONE_R = m('zr', 'compact', 'zone mic, right', STUDIO.ZR, STUDIO.hCorner, ZR_AIM, FACE_H, 'cardioid');
const TRUSS_Y = (EVENT.truss.y0 + EVENT.truss.y1) / 2;
const AB_L = m('abl', 'compact', 'spaced omni, left', { x: -1.5, y: TRUSS_Y }, EVENT.hTruss, { x: -1.5, y: 14 }, FACE_H);
const AB_R = m('abr', 'compact', 'spaced omni, right', { x: 1.5, y: TRUSS_Y }, EVENT.hTruss, { x: 1.5, y: 14 }, FACE_H);
const railMid = (r: PlanRect): P2 => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 });
const EVENT_BOX: PlanRect = { x0: -20, y0: -8, x1: 20, y1: 19 };

export const B08_SETUPS: SportSetup[] = [
  {
    id: 'su.one',
    role: 'ONE MIC',
    core: true,
    title: 'One crowd mic above the front of the section',
    type: 'a small cardioid condenser, hung from the rigging bar by qualified crew',
    start: 'Raised above and somewhat in front of the section, aimed down at the faces and upper bodies, the PA at the stage’s corners well off its front.',
    line: 'The section’s response together, the PA to the side of its pattern — but no width, and one nearby clapper can still dominate.',
    mics: [MONO],
  },
  {
    id: 'su.two',
    role: 'TWO MICS',
    core: true,
    title: 'An XY pair at the same place',
    type: 'two small cardioids crossed at one point',
    start: 'At the same raised place on the bar, the pair angled to take in the section’s width.',
    line: 'A stable image and a predictable mono sum from one place — less spacious, and a central place can hear more PA.',
    mics: [XY],
  },
  {
    id: 'su.far',
    role: 'FARTHER BACK · STUDIO',
    core: true,
    title: 'A spaced omni pair over the hall',
    type: 'two small omnis, spaced, on the truss over the event (a qualified rigger)',
    start: 'High over the centre of the hall on the approved truss, the pair spaced apart — for the room’s size and its low end.',
    line: 'The scale of the venue and its diffuse energy — and time differences that comb when the pair is summed to mono.',
    mics: [AB_L, AB_R],
    scene: EVENT_SCENE,
    box: EVENT_BOX,
    noRange: true,
    // Hung from the truss: no corner close-up (it would draw the pair on a stand).
    noCloseUp: true,
  },
  {
    id: 'su.zones',
    role: 'ANOTHER START',
    core: false,
    title: 'Two zones at the stage’s corners',
    type: 'a small cardioid at each front corner of the stage, raised on a stand',
    start: 'One at each front corner, each aimed into its side of the section and away from the PA beside it — on separate, named channels.',
    line: 'Each side of the audience on its own channel — not a coherent stereo pair: check each one and the mono sum.',
    mics: [ZONE_L, ZONE_R],
  },
  {
    id: 'su.sections',
    role: 'ANOTHER START',
    core: false,
    title: 'A zone for each section of a larger event',
    type: 'a small cardioid on the rail at the front of each section',
    start: 'On each section’s approved rail, aimed up the section at its faces — the fewest zones that cover the event, each named by where it is.',
    line: 'An arena often needs several zones: no single capsule represents every section. Monitor each on its own before blending.',
    mics: [m('sl', 'compact', 'left section', railMid(EVENT.railL), EVENT.hRail, EVENT.CL, FACE_H, 'cardioid'), m('sc', 'compact', 'centre section', railMid(EVENT.railC), EVENT.hRail, EVENT.CC, FACE_H, 'cardioid'), m('sr', 'compact', 'right section', railMid(EVENT.railR), EVENT.hRail, EVENT.CR, FACE_H, 'cardioid')],
    scene: EVENT_SCENE,
    box: EVENT_BOX,
  },
  {
    id: 'su.near',
    role: 'ANOTHER START',
    core: false,
    title: 'A near-coincident pair at the same place',
    type: 'two small cardioids a hand’s width apart, angled out',
    start: 'At the raised place on the bar: more width than XY with some mono compatibility — audition the mono sum.',
    line: 'Wider than XY; small time differences between the capsules — check the mono sum before trusting it.',
    mics: [m('nl', 'compact', 'near pair, left', { x: STUDIO.M.x - 0.085, y: STUDIO.M.y }, STUDIO.hBar, { x: -3, y: 7 }, FACE_H, 'cardioid'), m('nr', 'compact', 'near pair, right', { x: STUDIO.M.x + 0.085, y: STUDIO.M.y }, STUDIO.hBar, { x: 3, y: 7 }, FACE_H, 'cardioid')],
  },
];

/* ═════════ the Placement Studio's zones (plan, the studio audience) ═════════ */

export const B08_PLACE: PlanZone[] = [
  { id: 'pz.mono', label: 'On the bar, aimed at the faces', band: 'Raised about 3–4 m on the bar, aimed at the middle of the section.', tendency: 'The section together, the PA off its front.', rect: STUDIO.bar, h: [2.8, 3.8], target: 'S', tol: 15, kinds: ['compact'] },
  { id: 'pz.xy', label: 'An XY pair on the bar', band: 'The pair at the same raised place, its middle on the section.', tendency: 'Width with a stable centre; check the mono sum.', rect: STUDIO.bar, h: [2.8, 3.8], target: 'S', tol: 15, kinds: ['xy'] },
  { id: 'pz.zoneL', label: 'A zone at the stage’s left corner', band: 'Raised about 2–3 m at the stage’s corner, aimed into the section.', tendency: 'One side of the audience on its own channel.', rect: STUDIO.cornerL, h: [2.0, 3.0], target: 'S', tol: 35, kinds: ['compact'] },
  { id: 'pz.zoneR', label: 'A zone at the stage’s right corner', band: 'The same at the opposite corner.', tendency: 'The other side on its own channel.', rect: STUDIO.cornerR, h: [2.0, 3.0], target: 'S', tol: 35, kinds: ['compact'] },
];

/** The overlap pair (TWO MICS page): the two zone mics, a source walking
 *  across the front of the section. */
export const B08_OVERLAP = { a: ZONE_L, b: ZONE_R, path: [{ x: 3.8, y: 2.6 }, { x: 0, y: 2.6 }, { x: -3.8, y: 2.6 }] } as const;
