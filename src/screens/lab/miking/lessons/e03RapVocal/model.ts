/**
 * E03 RAP AND RHYTHMIC VOCAL — the recommended starting points (charter §2
 * layer 1), on frame V (lessons/shared/voice), from rap_vocal/SOURCES.md and
 * the Lab 5 register (lead_vocal/SOURCES.md §0). Every distance is from the
 * lip point to the mic's front; corrections E3-… (CORRECTIONS_LOG).
 *
 * STUDIO
 *   rp.close   a close dynamic "about 4 inches … directly on axis", rehearse
 *              2–6 in (DPA-VOC-STUDIO) — the worked example (the lesson's
 *              table said "2–6 in" with no source: E3-01);
 *   rp.screen  a studio condenser close, "1–6 inches … Use a pop filter"
 *              (S-SM4-UG): with the screen 10 cm ahead, the mic starts at
 *              about 15 cm — the drawing shows why the close end is out of
 *              reach with a screen;
 *   rp.cond    a condenser at 8–12 in (N-VOC);
 *   rp.loose   looser, around 12 in — "careful not to get too roomy"
 *              (DPA-VOC-STUDIO);
 *   rp.low     a little below the mouth, for S and T (S-VOC-REC; the lesson's
 *              L31 re-cited: E3-02).
 * STAGE
 *   rp.stage   a handheld within 10 cm (DPA-VOICE) — the worked example;
 *   rp.headset a headset by the mouth corner (the lesson L44).
 * The rapper's WORKING ZONE (rap_vocal/GEOMETRY_PROPOSAL.md env.v.workingZone,
 * a drawing default) is drawn round the head in the studio; it is a picture of
 * the agreed movement, not a keep-out the drawing enforces.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V, VOICE_ROWS } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { ON_AXIS, fartherRow, headsetRow, looseRow, lowRow, stageRow } from '../shared/voice/voiceStarts.ts';
import { E03_MODEL } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const R = VOICE_ROWS;
const DYN = ['vocDynCard', 'vocDynSuper'];

const SPECS: VoiceZoneSpec[] = [
  {
    id: 'rp.close',
    label: 'Close, about 10 cm — a dynamic',
    band: 'Try a dynamic about 10 cm (4 in) from the lips, on the mouth’s axis — and keep it there: about 5–15 cm (2–6 in) is the range to rehearse in.',
    kind: 'sourced',
    src: R.dpaClose.src,
    quote: R.dpaClose.quote,
    distance: { min: R.dpaClose.min, max: R.dpaClose.max },
    off: { min: 0, max: 15, prov: ON_AXIS },
    aimTol: 15,
    micTypeIds: DYN,
    variant: 'studio',
    start: { d: [R.dpaClose.start, 105, 98, 110, 92], at: 'mouth' },
    tendency: 'A dry, focused voice with presence and little of the room — it fits a dense beat. Closer brings boom (the proximity effect) and pops; the distance has to stay steady through the verse.',
    checks: ['Plosives piling up in a fast verse', 'Low-end boom as the rapper leans in', 'Headroom for the loudest ad-lib'],
  },
  {
    id: 'rp.screen',
    label: 'A close condenser behind a screen',
    band: 'Try a studio condenser close — up to about 15 cm (6 in) from the lips — with a pop screen in front. With the screen at least 10 cm ahead of the mic, the mic itself starts about 15 cm out.',
    kind: 'sourced',
    src: R.sm4.src,
    quote: R.sm4.quote,
    bandProv: ill('with a screen at least 10 cm ahead (N-POP), only the far end of the 2.5–15 cm row can be reached: the drawing shows it'),
    distance: { min: R.sm4.min, max: R.sm4.max },
    off: { min: 0, max: 15, prov: ON_AXIS },
    aimTol: 15,
    micTypeIds: ['vocLdc'],
    variant: 'studio',
    start: { d: [150, 152, 148, 145] },
    tendency: 'Detail and presence in the consonants, with the screen breaking up the repeated puffs of a fast verse. A condenser can turn harsh on an aggressive voice — compare it with a dynamic at matched level.',
    checks: ['Harsh S and T sounds on the fastest lines', 'The screen still breaking up the puffs', 'Peaks from a shouted hook'],
  },
  fartherRow({
    id: 'rp.cond',
    variant: 'studio',
    micTypeIds: ['vocLdc'],
    inches: true,
    label: 'A condenser at about 20–30 cm',
    band: 'Try a studio condenser about 20–30 cm (8–12 in) from the lips, on the mouth’s axis, a screen in front — more open consonants and natural level movement.',
    start: { d: [254, 250, 260, 240] },
    tendency: 'More open consonants and natural level changes, with some of the room. Room reflections, breath and S sounds come up — check the room is worth hearing.',
  }),
  looseRow({
    id: 'rp.loose',
    variant: 'studio',
    micTypeIds: ['vocLdc'],
    label: 'Looser, around 30 cm — an open, roomier sound',
    tendency: 'An open, spacious rhythmic vocal — when the room sounds good. Careful: the room is hard to take out later, so it is a production choice, not a fix.',
  }),
  lowRow({ id: 'rp.low', variant: 'studio', micTypeIds: ['vocDynCard', 'vocLdc'], start: { d: [150, 140, 160, 130, 170], deg: 30 } }),
  stageRow({
    id: 'rp.stage',
    variant: 'live',
    micTypeIds: DYN,
    tendency: 'A strong, close voice that stays ahead of the beat and the wedge. Close for quiet lines, a little farther for shouts — the grille open, never covered.',
    checks: ['The loudest ad-lib: back off rather than cover the grille', 'The grille kept clear: no cupping', 'Where the wedge sits against the pattern'],
  }),
  headsetRow({ id: 'rp.headset', variant: 'live', micTypeIds: ['vocHeadset'] }),
];

export const E03_ZONES: DocumentedZone[] = SPECS.map((s) => voiceZone(E03_MODEL, FRAME_V, s, MIC_TYPES));
