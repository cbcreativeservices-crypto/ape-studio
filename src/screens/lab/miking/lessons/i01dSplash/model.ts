/**
 * I01d SPLASH CYMBAL — the technical truth (charter §2 layer 1). Source keys
 * point into docs/labs/miking/splash_cymbal/SOURCES.md (and hihat/SOURCES.md
 * §0); the geometry follows splash_cymbal/GEOMETRY_PROPOSAL.md, on the shared
 * kit, with the family's Lab 2 additions (cymbalFx.ts: SPLASH_10, SPLASH_8,
 * the arm, the piggyback).
 *
 * TWO SETUPS (the variants): the 10 in splash on a Z-shaped arm over the
 * 10 in tom (the proposal's first mount, "build mount.arm first"), and an
 * 8 in splash upside down on top of the 18 in crash (the published inverted
 * piggyback). The stack (two or three plates on one bolt) is said in words,
 * not drawn (proposal: "the hardest art in I01").
 *
 * THE STARTING POINTS are NUMBERLESS in the research: above (15–25 cm) and
 * underneath (8–13 cm) are DRAWING DEFAULTS (`bandProv`). The arm's own rod
 * is where a small clip mic can hold on under the splash.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { SPLASH_ARM, SPLASH_PIGGY, splashArmPoints } from '../shared/cymbals/cymbalFx.ts';
import { at, bandDrawn, bandMid, ill, poseToward, towardThrone, type Band } from '../shared/cymbals/cymbalLesson.ts';

export const ARM = SPLASH_ARM;
export const PIGGY = SPLASH_PIGGY;
export const R10 = ARM.spec.d.mm / 2;
export const R8 = PIGGY.spec.d.mm / 2;
export const TH_ARM = towardThrone(ARM).theta;
export const TH_PIG = towardThrone(PIGGY).theta;
export const STRIKE_ARM = at(ARM, 0.85 * R10, TH_ARM, 2);
export const STRIKE_PIG = at(PIGGY, 0.85 * R8, TH_PIG, -2);
const farA = TH_ARM + 180;
const farP = TH_PIG + 180;

/** Where the clip holds on: the arm's last, vertical piece (drawing default). */
export const ARM_CLIP = (() => {
  const a = splashArmPoints();
  return { x: a.tilter.x, y: (a.elbow.y + a.tilter.y) / 2, z: a.tilter.z };
})();

export const BAND = {
  armTop: { r: [40, 120], th: [farA - 50, farA + 50], h: [150, 250] } as Band,
  armUnder: { r: [40, 100], th: [-80, -30], h: [-130, -80] } as Band,
  pigTop: { r: [50, 98], th: [farP - 50, farP + 50], h: [150, 250] } as Band,
} as const;

const TOP_PROV = ill('no source gives a distance for a splash: 15–25 cm above, outside the swing and the stick, is the lab’s drawing (splash_cymbal/GEOMETRY_PROPOSAL.md zone.splash.top)');

export const SPLASH_ZONES: DocumentedZone[] = [
  {
    id: 'sp.top',
    label: 'Above the splash, away from the player',
    band: 'Start about 15–25 cm (6–10 in) above the splash on the side away from the player, aimed at its bow — a place to begin; no number is published for a splash.',
    kind: 'trial',
    src: 'LESSON',
    quote: 'an engineering starting suggestion, no number',
    bandProv: TOP_PROV,
    refSurface: 'spTop',
    side: 'outside',
    distance: { min: 150, max: 250 },
    radial: { line: 'spEdge', min: 40 - R10, max: 120 - R10, prov: ill('over the bow') },
    cone: { min: 8, max: 42, toward: { x: Math.cos((farA * Math.PI) / 180), y: 0, z: Math.sin((farA * Math.PI) / 180) }, prov: ill('the side away from the player') },
    aimAt: { surface: 'spTop', r: R10, prov: ill('aimed at the splash') },
    requires: { variant: 'arm', micTypeIds: ['sdcCard', 'smallDynCard'] },
    drawn: bandDrawn(ARM, BAND.armTop),
    start: poseToward(bandMid(ARM, BAND.armTop, { r: 0.5, h: 0.45 }), at(ARM, 50, farA, 0)),
    tendency: 'The splash’s quick, bright accent on its own. It is small and fast: a little closer catches more of its attack, a little farther more of the kit around it.',
    checks: ['Clear of the stick and the player’s arm', 'Clear of the crash above it and its swing', 'Does it add what the overheads are missing?'],
  },
  {
    id: 'sp.under',
    label: 'Underneath, on the arm',
    band: 'Start with a small clip-on mic held on the arm, about 8–13 cm (3–5 in) under the splash on the side away from the player, aimed up — above the tom below.',
    kind: 'trial',
    src: 'DPA-KIT',
    quote: 'Mics are placed either on separate stands or on the cymbal stand pointing the microphone upward towards the underneath the cymbals.',
    bandProv: ill('no source gives a distance underneath: 8–13 cm under the edge plane, below the swing, is the lab’s drawing'),
    refSurface: 'spUnder',
    side: 'outside',
    distance: { min: 80, max: 130 },
    radial: { line: 'spEdge', min: 40 - R10, max: 100 - R10, prov: ill('under the bow') },
    cone: { min: 15, max: 55, prov: ill('under the plate') },
    aim: { maxOffAxis: 45, prov: ill('aimed up at the underside: within 45° of its straight-on line') },
    requires: { variant: 'arm', micTypeIds: ['standClip'] },
    drawn: bandDrawn(ARM, BAND.armUnder),
    start: poseToward(bandMid(ARM, BAND.armUnder, { r: 0.5, h: 0.5 }), at(ARM, 30, -55, 0)),
    tendency: 'Small and out of the way, its rear toward the tom and the floor. From below there tends to be less stick and more of the splash’s short wash.',
    checks: ['The clip holds on the arm, and the arm still holds the splash', 'Clear of the tom below and its mic', 'Below the splash’s swing'],
  },
  {
    id: 'pg.top',
    label: 'Above the splash on the crash',
    band: 'Start about 15–25 cm (6–10 in) above the upside-down splash on the side away from the player, aimed at it — it sits on top, so above is the clear side.',
    kind: 'trial',
    src: 'LESSON',
    quote: 'an engineering starting suggestion, no number',
    bandProv: TOP_PROV,
    refSurface: 'pgTop',
    side: 'outside',
    distance: { min: 150, max: 250 },
    radial: { line: 'pgEdge', min: 50 - R8, max: 98 - R8, prov: ill('over the plate') },
    cone: { min: 10, max: 36, toward: { x: Math.cos((farP * Math.PI) / 180), y: 0, z: Math.sin((farP * Math.PI) / 180) }, prov: ill('the side away from the player') },
    aimAt: { surface: 'pgTop', r: R8 + 30, prov: ill('aimed at the splash on top') },
    requires: { variant: 'piggy', micTypeIds: ['sdcCard', 'smallDynCard'] },
    drawn: bandDrawn(PIGGY, BAND.pigTop),
    start: poseToward(bandMid(PIGGY, BAND.pigTop, { r: 0.6, h: 0.45 }), at(PIGGY, 45, farP, 0)),
    tendency: 'The splash and the crash under it, together: the two move as one, so a mic above hears both. Higher takes in more of the crash; closer, more of the splash’s bite.',
    checks: ['Above the stick and the player’s arm', 'Clear of both plates’ swing — the crash carries the splash', 'Does it add what the overheads are missing?'],
  },
];
