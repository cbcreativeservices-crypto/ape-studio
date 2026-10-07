/**
 * Microphones by property for Lab 5's voice (E01 lead vocal, E03 rap, E07
 * the singer with an instrument, and every later singer). Generic types; the
 * products their sizes come from stay in `examples` and every `prov` — the
 * INTERNAL record (owner ruling 2026-10-04: no brand or model on screen).
 * Merged into MIC_TYPES by data/micTypes.ts. Source keys:
 * docs/labs/miking/lead_vocal/SOURCES.md §0.
 *
 *   vocDynCard   a handheld vocal dynamic, cardioid, in a stand clip (S-VOC-REC:
 *                dynamics for "Rock, Heavy metal, Rap, Aggressive style vocals";
 *                S-SM58-UG's placement table and proximity figure);
 *   vocDynSuper  the same, supercardioid — its least-sensitive directions
 *                126° off the front (S-LIVE), the null a wedge is aimed into;
 *   vocLdc       a side-address large-diaphragm condenser on a stand with a
 *                POP SCREEN at least 10 cm in front of it (N-POP), angled off
 *                parallel (N-VOC); cardioid, with omni and figure-8 on a
 *                multi-pattern model (the lesson's rows);
 *   vocLdcOpen   the same condenser with NO screen — for the mic above the
 *                mouth at about eye level, angled down (N-POP's no-screen way);
 *   vocHeadset   a miniature on a headset, the capsule near the mouth corner
 *                "according to the manufacturer's instructions" (the lesson).
 * The handheld's size, the screen's hoop and tilt, and the headset's capsule
 * and boom are drawing defaults (`placeholder`): no source read gives them.
 */
import type { MicType } from '../../../engine/model/types.ts';
import { VOICE_DIMS } from './voiceSpec.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });
const src = (s: string, quote: string) => ({ kind: 'sourced', src: s, quote }) as const;
const generic = { kind: 'illustrative', reason: 'a textbook pattern for the generic type (a multi-pattern condenser)' } as const;

/** The handheld vocal dynamic's body (drawing default: a common 16 cm handheld with a 5 cm ball grille). */
const HANDHELD = { length: placeholder(162, 'a handheld vocal dynamic’s overall length'), radius: placeholder(25, 'a handheld vocal dynamic’s ball-grille radius') };
/** The side-address condenser's body: the studio condenser the E03 research names (S-SM4-WEB product data, as the kit and sax lessons draw it). */
const LDC_BODY = {
  length: { mm: 80.01, prov: src('S-SM4-WEB', 'height "80.01" (product data), drawn as the depth front to back') },
  radius: { mm: 59.004, prov: src('S-SM4-WEB', 'width "118.008" (product data)') },
  width: { mm: 254.991, prov: src('S-SM4-WEB', 'depth "254.991" (product data), drawn as the upright length') },
};

export const VOICE_MIC_TYPES = {
  vocDynCard: {
    id: 'vocDynCard',
    label: 'Handheld vocal dynamic, cardioid, in a stand clip',
    short: 'VOCAL DYN',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM58-UG', 'Cardioid … Place the microphone so that unwanted sound sources, such as monitors and loudspeakers, are directly behind it.') }],
    body: HANDHELD,
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM58-class handheld vocal dynamic', fact: 'S-VOC-REC: dynamics for "Rock, Heavy metal, Rap, Aggressive style vocals"; S-SM58-UG: cardioid "progressively boost bass frequencies by 6 to 10 dB below 100 Hz when the microphone is at a distance of about 6 mm (1/4 in.)"', src: 'S-SM58-UG' }],
    art: 'vocalDynamic',
    blurb: 'A handheld vocal dynamic with a ball grille — the grille is its own windscreen. Made for close use, handling and loud voices; cardioid, so it rejects most directly behind. Closer brings more bass (proximity effect). Needs no power.',
  },
  vocDynSuper: {
    id: 'vocDynSuper',
    label: 'Handheld vocal dynamic, supercardioid',
    short: 'VOCAL SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: src('S-LIVE', 'supercardioid … least sensitive at 126 degrees off-axis … rear rejection -12 dB') }],
    body: HANDHELD,
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'supercardioid handheld vocal dynamics (generic)', fact: 'S-LIVE: supercardioid least sensitive "at 126 degrees off-axis", rear "-12 dB"; S-VOC-TIPS: a hypercardioid wedge "slightly to one side or the other".', src: 'S-LIVE' }],
    art: 'vocalDynamic',
    blurb: 'The same handheld shape with a tighter, supercardioid pattern: its least-sensitive directions sit toward the rear, about 125° off the front, with a small lobe straight behind — so a floor wedge goes a little to one side of its rear, not straight behind. Needs no power.',
  },
  vocLdc: {
    id: 'vocLdc',
    label: 'Large-diaphragm condenser with a pop screen, on a stand',
    short: 'LARGE + SCREEN',
    transducer: 'condenser',
    address: 'side',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: src('S-SM4-UG', 'Polar Pattern: Cardioid') },
      { id: 'omni', label: 'omni (a multi-pattern model)', prov: generic },
      { id: 'figure8', label: 'figure-8 (a multi-pattern model)', prov: generic },
    ],
    body: LDC_BODY,
    pop: { gap: VOICE_DIMS.popGap, r: VOICE_DIMS.popR, tilt: VOICE_DIMS.popTilt },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [{ model: 'Shure SM4 (side-address cardioid condenser); Neumann studio vocal set-up', fact: 'S-SM4-UG: "Vocals and speech 1–6 inches (2–15 cm) Use a pop filter to prevent plosives."; N-POP: pop screen "at least 10 cm (4 inches) away from the mic"; N-VOC: "Angle the pop shield slightly so it isn\'t parallel to the capsule".', src: 'S-SM4-UG' }],
    art: 'vocalLdc',
    blurb: 'A side-address studio condenser: sing to its FACE. Detailed, with the room it is in. A pop screen on its stand, at least 10 cm in front of it and angled a little off parallel, breaks up the puffs of air from P and B. Needs phantom power.',
  },
  vocLdcOpen: {
    id: 'vocLdcOpen',
    label: 'Large-diaphragm condenser, no pop screen, on a stand',
    short: 'LARGE, OPEN',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM4-UG', 'Polar Pattern: Cardioid') }],
    body: LDC_BODY,
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [{ model: 'a studio condenser without a screen', fact: 'N-POP: "Position the mic top down, at about eye level, and angle it down toward the singer\'s mouth" (the no-screen way).', src: 'N-POP' }],
    art: 'vocalLdc',
    blurb: 'The same studio condenser without a screen: an idea for a mic above the mouth, at about eye level, angled down — the air from the lips passes beneath it. Needs phantom power.',
  },
  vocHeadset: {
    id: 'vocHeadset',
    label: 'Miniature condenser on a headset, omni',
    short: 'HEADSET',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'omni', label: 'omni', prov: src('DPA-VOICE', 'the high frequency from the voice is very directional (re cheek-placed headsets)') }],
    body: { length: placeholder(14, 'a headset capsule’s length'), radius: placeholder(3, 'a headset capsule’s radius') },
    power: 'phantom power through its adapter, or a wireless pack',
    mount: 'clip',
    clip: { reach: placeholder(170, 'the headset boom’s reach from the ear to the capsule') },
    examples: [{ model: 'head-worn vocal miniatures (generic)', fact: 'The lessons: "place the capsule consistently near the mouth corner according to the manufacturer\'s instructions"; DPA-VOICE: the voice\'s highs are "very directional", so a capsule on the cheek hears less of them.', src: 'DPA-VOICE' }],
    art: 'gooseneck',
    blurb: 'A tiny capsule on a thin boom from a headset over the ear: it stays at one place by the mouth however the singer moves. Place it as its maker says — near the mouth corner, out of the breath. Needs phantom power or a wireless pack.',
  },
} satisfies Record<string, MicType>;
