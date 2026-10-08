/**
 * F04 IMPACTS, LIQUIDS AND TEXTURES — the recommended starting points
 * (charter §2 layer 1). No source gives a distance or a splash radius (F04
 * L21): every number is a DRAWING DEFAULT; the METHODS are sourced
 * (foley_impacts_liquids/SOURCES.md, GEOMETRY_PROPOSAL.md §2):
 *
 *   f04.side     WATER: an airborne mic off to the side of the basin,
 *                outside the splash envelope by at least 300 mm, aimed at
 *                the water's entry ("off to one side") — ONE MIC;
 *   f04.contact  IMPACT: aimed at the block and the surface together, about
 *                40–60 cm — ONE MIC for the impact, and the live start;
 *   f04.room     a farther view, about 1.3–1.7 m: the object, the room and
 *                the tail — FARTHER BACK, and the water pair's second mic;
 *   f04.stroke   TEXTURE: aimed along the friction line, about 30–50 cm,
 *                never crossed by the brush — ONE MIC for the texture.
 * TWO MICS (water): mic A at the entry, mic B on the tail and the room — "a
 * different task" for each.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { foleyZone } from '../shared/foley/foleyZones.ts';
import { splashRadius } from '../shared/foley/propGeom.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DD = ill('no source gives a distance for an impact, a basin or a texture (F04 L21): a drawing default');
const SPLASH = splashRadius();

export const F04_ZONES: DocumentedZone[] = [
  foleyZone({
    id: 'f04.side',
    label: 'Off to the side, outside the splash',
    band: `A suggested start: an airborne mic off to one side of the basin, outside the marked splash by at least 30 cm — about ${((SPLASH + 300) / 1000).toFixed(1)}–1.1 m from the water’s entry — aimed at the entry.`,
    kind: 'trial',
    src: 'DS-BRY',
    quote: 'Stand moved "off to one side"',
    surface: 'action',
    d: [SPLASH + 300, 1100],
    a: [30, 80],
    aimTol: 30,
    start: { d: 950, bearing: 55, elev: 30 },
    variants: ['water'],
    micTypeIds: ['scSupercard', 'shotgunShort'],
    bandProv: ill('outside the illustrative splash envelope (2.5 × the basin’s radius) by 300 mm: a drawing default; "off to one side" is sourced'),
    tendency: 'The entry and the splash with the basin’s ring, the mic out of the spray. Listen for whether the water still reads, and for the drip tail.',
    checks: ['The stand, its feet and the cable outside the splash', 'No water reaching the capsule or the windshield', 'The tail: let the drips finish'],
  }),
  foleyZone({
    id: 'f04.contact',
    label: 'Close, on the block and the surface',
    band: 'A suggested trial: about 40–60 cm (16–24 in) from the impact, aimed at the block and the table together, outside the block’s whole travel.',
    kind: 'trial',
    src: 'LESSON-F04',
    quote: 'Aim a secure mic at the padded object and the surface together from outside the object’s entire travel.',
    surface: 'action',
    d: [400, 600],
    a: [10, 50],
    aimTol: 30,
    start: { d: 520, bearing: -15, elev: 25 },
    variants: ['impact', 'live'],
    micTypeIds: ['scSupercard', 'smallDynCard'],
    bandProv: DD,
    tendency: 'A sharp contact, the attack forward — and maybe less of the table’s body. Set the gain on the strongest planned hit. On a live stage the close mic also keeps more of the PA out.',
    checks: ['Peak attack against the body and decay', 'The block’s travel and the hand clear', 'Table and stand vibration'],
  }),
  foleyZone({
    id: 'f04.room',
    label: 'Farther back, the object and the room',
    band: 'An idea to try: about 1.3–1.7 m (4.3–5.6 ft) from the action — the object, its resonance, the room and the tail together.',
    kind: 'trial',
    src: 'LESSON-F04',
    quote: 'Compare a nearer contact view with a farther view that includes resonance and room.',
    surface: 'action',
    d: [1300, 1700],
    a: [10, 50],
    aimTol: 30,
    start: { d: 1500, bearing: -10, elev: 25 },
    variants: ['impact', 'water', 'texture'],
    micTypeIds: ['scSupercard', 'shotgunShort'],
    bandProv: DD,
    tendency: 'The source and the room joined, the decay or the drip tail with them — farther from splash and air bursts, at the cost of more room noise.',
    checks: ['Room noise under the soft parts', 'The tail heard to its end', 'The pair together in mono, if paired'],
  }),
  foleyZone({
    id: 'f04.stroke',
    label: 'Along the friction line',
    band: 'A suggested trial: about 30–50 cm (12–20 in) in front of the stroke, aimed along the friction line — never where the brush can cross it.',
    kind: 'trial',
    src: 'LESSON-F04',
    quote: 'Aim along the active friction zone without letting the brush cross the mic.',
    surface: 'action',
    d: [300, 500],
    a: [10, 50],
    aimTol: 30,
    start: { d: 420, bearing: 0, elev: 25 },
    variants: ['texture'],
    micTypeIds: ['scSupercard', 'smallDynCard'],
    bandProv: DD,
    tendency: 'The friction itself, changing with pressure, and its natural end — finger and handle noise come closer too.',
    checks: ['Friction against handle and finger noise', 'The brush’s whole stroke clear of the mic', 'A steady stroke, take to take'],
  }),
];
