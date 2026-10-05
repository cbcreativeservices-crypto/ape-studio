/**
 * I01e CHINA CYMBAL — the technical truth (charter §2 layer 1). Source keys
 * point into docs/labs/miking/china_cymbal/SOURCES.md (and hihat/SOURCES.md
 * §0); the geometry follows china_cymbal/GEOMETRY_PROPOSAL.md with the
 * family's Lab 2 addition (cymbalFx.ts: CHINA_18 and its profile — the whole
 * profile is a drawing default).
 *
 * THE CHINA takes the 18 in crash's stand, in its place (the proposal's first
 * option; its second position overlaps that crash — CORRECTIONS_LOG CY-08).
 * TWO SETUPS: UPRIGHT (cup up — a jazz player's ride, the stick "about an
 * inch above" the valley, on the shoulder) and INVERTED (cup down — turned
 * over "like I'm going to crash it"). Turned over, the profile's valley
 * becomes a raised ring and the lip turns down (CY-09: the proposal's "lip
 * pointing up" contradicts its own profile).
 *
 * THE STARTING POINTS are NUMBERLESS: above (20–30 cm) and underneath (8–15 cm
 * below the plate's lowest point in its mount) are DRAWING DEFAULTS.
 */
import type { DocumentedZone, VariantId } from '../../engine/model/types.ts';
import { CHINA_INVERTED, CHINA_PROFILE, CHINA_SHOULDER_STRIKE_R, CHINA_TOP, CHINA_UPRIGHT, chinaAreas } from '../shared/cymbals/cymbalFx.ts';
import { at, bandDrawn, bandMid, ill, poseToward, towardThrone, type Band } from '../shared/cymbals/cymbalLesson.ts';

export const UP = CHINA_UPRIGHT;
export const INV = CHINA_INVERTED;
export const CHINA_OF = (v: VariantId) => (v === 'inverted' ? INV : UP);
export const R = UP.spec.d.mm / 2;
export const T = UP.spec.drawT.mm;
export const AREAS = chinaAreas();
export const TH = towardThrone(UP).theta;
const far = TH + 180;
/** The plate's lowest point below its rim plane: upright, the valley; inverted, the cup. */
export const DROP = { upright: CHINA_PROFILE.lipRise.mm + T, inverted: CHINA_TOP + T } as const;
/** The strikes: upright, the side of the shoulder; inverted, a crash near the edge. */
export const STRIKE = { upright: CHINA_SHOULDER_STRIKE_R, inverted: 0.9 * R } as const;
export const STRIKE_UP = at(UP, STRIKE.upright, TH, 6);
export const STRIKE_INV = at(INV, STRIKE.inverted, TH, 12);

const top = (h: readonly [number, number]): Band => ({ r: [60, 215], th: [far - 45, far + 45], h });
export const BAND = {
  topU: top([200, 300]),
  topI: top([200, 300]),
  underU: { r: [70, 160], th: [-45, 0], h: [-(DROP.upright + 150), -(DROP.upright + 80)] } as Band,
  underI: { r: [70, 160], th: [-45, 0], h: [-(DROP.inverted + 150), -(DROP.inverted + 80)] } as Band,
} as const;

const TOP_PROV = ill('no source gives a distance for a China: 20–30 cm above the rim plane, outside the swing and the stick, is the lab’s drawing (china_cymbal/GEOMETRY_PROPOSAL.md zone.china.top)');
const UNDER_PROV = ill('8–15 cm below the plate’s lowest point in its mount (proposal zone.china.under) — the band is the lab’s drawing');
const UNDER_QUOTE = 'The Beta 181 also makes a great underhead mic when a very direct cymbal sound is desired.';

function topZone(id: string, v: 'upright' | 'inverted'): DocumentedZone {
  const p = v === 'upright' ? UP : INV;
  const b = v === 'upright' ? BAND.topU : BAND.topI;
  const s = v === 'upright' ? 'chTopU' : 'chTopI';
  return {
    id,
    label: v === 'upright' ? 'Above the China, away from the player' : 'Above the turned-over China',
    band: 'Start about 20–30 cm (8–12 in) above the China on the side away from the player, aimed at the shoulder — a place to begin; no number is published for a China.',
    kind: 'trial',
    src: 'LESSON',
    quote: 'above the plate, 200–300, aimed at the bow/shoulder (drawing default)',
    bandProv: TOP_PROV,
    refSurface: s,
    side: 'outside',
    distance: { min: 200, max: 300 },
    radial: { line: v === 'upright' ? 'chEdgeU' : 'chEdgeI', min: 60 - R, max: 215 - R, prov: ill('over the shoulder and the lip') },
    cone: { min: 8, max: 50, toward: { x: Math.cos((far * Math.PI) / 180), y: 0, z: Math.sin((far * Math.PI) / 180) }, prov: ill('the side away from the player') },
    aimAt: { surface: s, r: R, prov: ill('aimed at the plate') },
    requires: { variant: v, micTypeIds: ['sdcCard', 'smallDynCard'] },
    drawn: bandDrawn(p, b),
    start: poseToward(bandMid(p, b, { r: 0.55, h: 0.45 }), at(p, R * 0.6, far, 0)),
    tendency: 'The China’s bite and trash on its own channel — it cuts through anyway. Toward the lip tends to bring more of the trashy edge; toward the cup a harder, more focused tone.',
    checks: ['Above the stick and the player’s arm', 'Clear of the swing after the hardest crash', 'Does it add what the overheads are missing?'],
  };
}

function underZone(id: string, v: 'upright' | 'inverted'): DocumentedZone {
  const p = v === 'upright' ? UP : INV;
  const b = v === 'upright' ? BAND.underU : BAND.underI;
  return {
    id,
    label: v === 'upright' ? 'Underneath, below the lip' : 'Underneath, below the cup',
    band: v === 'upright'
      ? 'Start about 8–15 cm (3–6 in) under the plate’s lowest point — the valley — on the side away from the player, aimed up: below its downward travel.'
      : 'Start about 8–15 cm (3–6 in) under the plate’s lowest point — the turned-down cup — on the side away from the player, aimed up: below its downward travel.',
    kind: 'trial',
    src: 'S-B181',
    quote: UNDER_QUOTE,
    bandProv: UNDER_PROV,
    refSurface: v === 'upright' ? 'chUnderU' : 'chUnderI',
    side: 'outside',
    distance: { min: 80, max: 150 },
    radial: { line: v === 'upright' ? 'chEdgeU' : 'chEdgeI', min: 70 - R, max: 160 - R, prov: ill('under the shoulder') },
    cone: { min: 20, max: 66, prov: ill('under the plate, out of its own boom') },
    aim: { maxOffAxis: 40, prov: ill('aimed up at the underside: within 40° of its straight-on line') },
    requires: { variant: v, micTypeIds: ['sdcCard'] },
    drawn: bandDrawn(p, b),
    start: poseToward(bandMid(p, b, { r: 0.45, h: 0.5 }), at(p, 60, -22, 0)),
    tendency: 'A very direct China sound, out of the stick’s way, its rear toward the floor. From below there tends to be less stick and more of the plate’s roar — and a side-address mic can do this job too.',
    checks: ['Below the plate’s downward travel after the hardest crash', 'Clear of the China’s boom and the tom below', 'Its rear faces the floor: good for the monitors'],
  };
}

export const CHINA_ZONES: DocumentedZone[] = [topZone('ch.top', 'upright'), underZone('ch.under', 'upright'), topZone('ch.topI', 'inverted'), underZone('ch.underI', 'inverted')];
