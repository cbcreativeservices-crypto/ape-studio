/**
 * I01c CRASH CYMBAL — the technical truth (charter §2 layer 1). Source keys
 * point into docs/labs/miking/crash_cymbal/SOURCES.md (and hihat/SOURCES.md
 * §0); the geometry follows crash_cymbal/GEOMETRY_PROPOSAL.md on the shared
 * kit and cymbal family (CRASH_16, CRASH_18 and their boom stands —
 * unchanged).
 *
 * TWO SETUPS (the variants): the 16 in crash over the hi-hat side and the
 * 10 in tom (the proposal's default), and the 18 in crash over the 12 in tom.
 *
 * THE STARTING POINTS are NUMBERLESS in the research ("no published distance
 * anywhere"): above the plate (20–35 cm) and underneath (10–20 cm) are
 * DRAWING DEFAULTS, said as places to begin, each zone's `bandProv` says so.
 * The under-mic's band starts below the plate's downward travel (the swing
 * plus the proposal's 80 mm flex band). The glancing "J" stroke follows
 * through past the edge on the player's side: the stick's side reaches 25 cm
 * past the edge.
 */
import type { DocumentedZone, VariantId } from '../../engine/model/types.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { KIT_PLACED_CYMBALS, cymbalAreas } from '../shared/cymbals/cymbalSpec.ts';
import { at, bandDrawn, bandMid, ill, poseToward, towardThrone, type Band } from '../shared/cymbals/cymbalLesson.ts';

export const C1 = KIT_PLACED_CYMBALS.crash1;
export const C2 = KIT_PLACED_CYMBALS.crash2;
export const CRASH_OF = (v: VariantId) => (v === 'crash2' ? C2 : C1);
export const TH1 = towardThrone(C1).theta;
export const TH2 = towardThrone(C2).theta;
/** The edge strike (the shoulder, a glancing blow) at 0.92 R toward the player. */
export const EDGE_FRAC = 0.92;
export const STRIKE1 = at(C1, EDGE_FRAC * (C1.spec.d.mm / 2), TH1, 2);
export const STRIKE2 = at(C2, EDGE_FRAC * (C2.spec.d.mm / 2), TH2, 2);
/** The glancing stroke follows through 250 mm past the edge (proposal ko.stroke). */
export const FOLLOW_THROUGH = 250;
export const A1 = cymbalAreas(C1.spec);
export const A2 = cymbalAreas(C2.spec);

const far1 = TH1 + 180;
const far2 = TH2 + 180;
const R1 = C1.spec.d.mm / 2;
const R2 = C2.spec.d.mm / 2;

export const BAND = {
  top1: { r: [60, 190], th: [far1 - 45, far1 + 45], h: [200, 350] } as Band,
  under1: { r: [70, 150], th: [-75, -10], h: [-200, -120] } as Band,
  top2: { r: [60, 215], th: [far2 - 45, far2 + 45], h: [200, 350] } as Band,
  under2: { r: [70, 160], th: [-45, 0], h: [-200, -120] } as Band,
} as const;

const TOP_BAND = ill('no source gives a distance for a crash: 20–35 cm above the plate, outside the swing and the glancing stroke, is the lab’s drawing (crash_cymbal/GEOMETRY_PROPOSAL.md zone.crash.top)');
const UNDER_BAND = ill('no source gives a distance underneath: 12–20 cm below the edge plane — under the swing and the 80 mm downward flex band — is the lab’s drawing');
const UNDER_QUOTE = 'Mics are placed either on separate stands or on the cymbal stand pointing the microphone upward towards the underneath the cymbals.';

function top(id: string, v: 'crash1' | 'crash2', label: string): DocumentedZone {
  const c = v === 'crash1' ? C1 : C2;
  const b = v === 'crash1' ? BAND.top1 : BAND.top2;
  const R = v === 'crash1' ? R1 : R2;
  const s = v === 'crash1' ? 'c1Top' : 'c2Top';
  const far = v === 'crash1' ? far1 : far2;
  return {
    id,
    label,
    band: 'Start about 20–35 cm (8–14 in) above the plate, on the side away from the player, aimed at the bow or the edge — a place to begin; no one number is published for a crash.',
    kind: 'trial',
    src: 'LESSON',
    quote: 'a conditional teaching starting point, not a source-established distance',
    bandProv: TOP_BAND,
    refSurface: s,
    side: 'outside',
    distance: { min: 200, max: 350 },
    radial: { line: v === 'crash1' ? 'c1Edge' : 'c2Edge', min: 60 - R, max: (v === 'crash1' ? 190 : 215) - R, prov: ill('over the bow and the edge') },
    cone: { min: 8, max: 50, toward: { x: Math.cos(far * (Math.PI / 180)), y: 0, z: Math.sin(far * (Math.PI / 180)) }, prov: ill('the side away from the player, out of the glancing stroke') },
    aimAt: { surface: s, r: R, prov: ill('aimed at the plate') },
    requires: { variant: v, micTypeIds: ['sdcCard', 'smallDynCard'] },
    drawn: bandDrawn(c, b),
    start: poseToward(bandMid(c, b, { r: 0.5, h: 0.4 }), at(c, R * 0.55, far, 0)),
    tendency: 'The crash on its own, with more of its attack than the overheads give. Toward the edge tends to bring more of the crash’s spread; toward the bell, a brighter, more focused tone.',
    checks: ['Above the glancing stroke and the player’s arm', 'Clear of the swing after the hardest crash', 'Does it add what the overheads are missing?'],
  };
}

function under(id: string, v: 'crash1' | 'crash2'): DocumentedZone {
  const c = v === 'crash1' ? C1 : C2;
  const b = v === 'crash1' ? BAND.under1 : BAND.under2;
  const R = v === 'crash1' ? R1 : R2;
  return {
    id,
    label: 'Underneath, aimed up',
    band: 'Start about 12–20 cm (5–8 in) under the plate on the side away from the player, aimed up at it — below its downward swing, clear of its own stand.',
    kind: 'trial',
    src: 'DPA-KIT',
    quote: UNDER_QUOTE,
    bandProv: UNDER_BAND,
    refSurface: v === 'crash1' ? 'c1Under' : 'c2Under',
    side: 'outside',
    distance: { min: 120, max: 200 },
    radial: { line: v === 'crash1' ? 'c1Edge' : 'c2Edge', min: 70 - R, max: (v === 'crash1' ? 150 : 160) - R, prov: ill('under the bow, about half-way out') },
    cone: { min: 15, max: 55, prov: ill('under the plate, out of its own boom') },
    aim: { maxOffAxis: 40, prov: ill('aimed up at the underside: within 40° of its straight-on line') },
    requires: { variant: v, micTypeIds: ['sdcCard'] },
    drawn: bandDrawn(c, b),
    start: poseToward(bandMid(c, b, { r: 0.45, h: 0.5 }), at(c, 60, (b.th[0] + b.th[1]) / 2, 0)),
    tendency: 'Out of the stick’s way and below the overheads’ view, its rear toward the floor and the monitors. From below there tends to be less stick and more of the plate’s wash.',
    checks: ['Below the plate’s downward swing after the hardest crash', 'Clear of the crash’s own boom and the drums below', 'Its rear faces the floor: good for the monitors'],
  };
}

export const CRASH_ZONES: DocumentedZone[] = [top('c1.top', 'crash1', 'Above the 16 in crash, away from the player'), under('c1.under', 'crash1'), top('c2.top', 'crash2', 'Above the 18 in crash, away from the player'), under('c2.under', 'crash2')];

export const TOM1 = KIT_DRUMS.tom1;
export const TOM2 = KIT_DRUMS.tom2;
