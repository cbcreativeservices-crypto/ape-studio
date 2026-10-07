/**
 * E01 LEAD VOCAL — the recommended starting points (charter §2 layer 1),
 * built on frame V (lessons/shared/voice). Source keys point into
 * docs/labs/miking/lead_vocal/SOURCES.md §0; every distance is from the LIP
 * POINT to the mic's FRONT; corrections E1-… (CORRECTIONS_LOG).
 *
 * STUDIO
 *   lv.close   on the mouth's axis, 10–20 cm (S-VOC-REC) — the worked
 *              example, a screened condenser at 15 cm (D-LV1: a drawing
 *              default inside the band, not a recommendation of its own);
 *   lv.farther on axis, 20–30 cm (N-VOC);
 *   lv.low     a little below the mouth line, 10–20 cm (S-VOC-REC, for S
 *              and T; "slightly lower": 20–40° is the lab's drawing);
 *   lv.above   above at about eye level, angled down, no screen (N-POP;
 *              20–30 cm is N-VOC's own distance, a drawing default here);
 *   lv.room    looser, around 30 cm, for the room (DPA-VOC-STUDIO).
 * STAGE
 *   lv.stage   within 10 cm, on axis, a handheld in a stand clip (DPA-VOICE)
 *              — the worked example on stage;
 *   lv.nose    15–60 cm, just above nose height (S-SM58-UG);
 *   lv.side    20–60 cm, slightly off to one side (S-SM58-UG; 10–30° is the
 *              lab's drawing of "slightly");
 *   lv.headset a headset capsule by the mouth corner (the lesson: "according
 *              to the manufacturer's instructions" — its place a drawing
 *              default).
 * Every start is found once at load: the first candidate inside the zone and
 * clear of the singer (and, for the screened condenser, its SCREEN clear too).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V, VOICE_DIMS, VOICE_ROWS } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { closeRow, fartherRow, headsetRow, looseRow, lowRow, stageRow } from '../shared/voice/voiceStarts.ts';
import { E01_MODEL } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const R = VOICE_ROWS;
const STAGE_MICS = ['vocDynCard', 'vocDynSuper'];

const SPECS: VoiceZoneSpec[] = [
  closeRow({ id: 'lv.close', variant: 'studio', micTypeIds: ['vocLdc', 'vocDynCard', 'vocDynSuper'] }),
  fartherRow({ id: 'lv.farther', variant: 'studio', micTypeIds: ['vocLdc'] }),
  lowRow({ id: 'lv.low', variant: 'studio', micTypeIds: ['vocLdc', 'vocDynCard'] }),
  {
    id: 'lv.above',
    label: 'Above, at about eye level, angled down',
    band: 'Without a screen, an idea to try: the mic at about eye level, about 20–30 cm from the lips, angled down toward the mouth — the air from the lips passes beneath it.',
    kind: 'sourced',
    src: 'N-POP',
    quote: 'Position the mic top down, at about eye level, and angle it down toward the singer’s mouth',
    bandProv: ill('no distance is given: 20–30 cm is the same maker’s studio distance (N-VOC); "about eye level": 10–25° above the mouth’s axis is the lab’s drawing'),
    distance: { min: 200, max: 300 },
    off: { min: 10, max: 25, toward: 'up', prov: ill('at about eye level: 10–25° above the mouth’s axis (the lab’s drawing)') },
    aimTol: 15,
    micTypeIds: ['vocLdcOpen'],
    variant: 'studio',
    start: { d: [250, 240, 260, 230, 270], deg: 16, at: 'mouth' },
    tendency: 'Less breath and fewer pops without a screen; the vowels can change colour, so it suits a mic that sounds smooth off its axis. An idea, not a usual start.',
    checks: ['The singer’s view of the lyric sheet and the room', 'Pops and breath against a screened mic', 'How the vowels sound off the mic’s axis'],
  },
  looseRow({ id: 'lv.room', variant: 'studio', micTypeIds: ['vocLdc'] }),
  stageRow({ id: 'lv.stage', variant: 'live', micTypeIds: STAGE_MICS }),
  {
    id: 'lv.nose',
    label: 'Farther, just above nose height',
    band: 'Try about 15–60 cm (6 in – 2 ft) from the mouth with the mic just above nose height, aimed down at the mouth.',
    kind: 'sourced',
    src: R.noseHeight.src,
    quote: R.noseHeight.quote,
    bandProv: ill('"just above nose height": 6–20° above the mouth’s axis is the lab’s drawing'),
    distance: { min: R.noseHeight.min, max: R.noseHeight.max },
    off: { min: 6, max: 20, toward: 'up', prov: ill('just above nose height: 6–20° above the mouth’s axis (the lab’s drawing)') },
    aimTol: 20,
    micTypeIds: STAGE_MICS,
    variant: 'live',
    start: { d: [300, 280, 320, 250, 350], deg: 10, at: 'mouth' },
    tendency: 'A more natural voice with less bass than close up — and more of the stage around it. Check the voice still stays ahead of the band.',
    checks: ['The band and the wedge in the mic', 'Level as the singer moves', 'The stand clear of the singer’s face and hands'],
  },
  {
    id: 'lv.side',
    label: 'Slightly off to one side',
    band: 'For fewer S sounds, try about 20–60 cm (8 in – 2 ft) from the mouth, slightly off to one side, still aimed at the mouth.',
    kind: 'sourced',
    src: R.side.src,
    quote: `${R.side.quote} ("minimal 's' sounds")`,
    bandProv: ill(`"slightly off to one side": ${VOICE_DIMS.sideDeg.mm - 10}–${VOICE_DIMS.sideDeg.mm + 10}° off the mouth’s axis is the lab’s drawing`),
    distance: { min: R.side.min, max: R.side.max },
    off: { min: VOICE_DIMS.sideDeg.mm - 10, max: VOICE_DIMS.sideDeg.mm + 10, toward: 'right', prov: ill('slightly off to one side: 10–30° off the axis (the lab’s drawing)') },
    aimTol: 20,
    micTypeIds: STAGE_MICS,
    variant: 'live',
    start: { d: [300, 280, 320, 260, 350], deg: VOICE_DIMS.sideDeg.mm, at: 'mouth' },
    tendency: 'A natural voice with less bass and fewer S sounds, the mic out of the straight line of the breath. Check the words stay clear.',
    checks: ['S sounds against on-axis', 'Clarity as the singer turns', 'The wedge against the pattern from this side'],
  },
  headsetRow({ id: 'lv.headset', variant: 'live', micTypeIds: ['vocHeadset'] }),
];

export const E01_ZONES: DocumentedZone[] = SPECS.map((s) => voiceZone(E01_MODEL, FRAME_V, s, MIC_TYPES));
