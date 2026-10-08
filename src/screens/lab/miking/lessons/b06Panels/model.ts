/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — the recommended starting
 * points (charter §2 layer 1), on frame V (the focus panelist, the
 * presenter) and the other talkers' anchors (shared/broadcast). Source keys:
 * docs/labs/miking/panels_press/SOURCES.md and the Lab 7a register
 * (radio_host/SOURCES.md §0); every distance is from the LIP POINT to the
 * mic's FRONT.
 *
 * PANEL
 *   b6.goose     a gooseneck on a table base, its capsule about 20–30 cm from
 *                the mouth, below the mouth's line (PRACTICE: the lesson L12
 *                "bring the capsule toward the mouth"; 25 cm is the
 *                proposal's drawing default) — the worked example;
 *   b6.gooseP3   the next panelist's own gooseneck, the same (TWO MICS);
 *   b6.boundary  a shared half-cardioid boundary on the table between two
 *                panelists (the lesson L15; its place a drawing default).
 * LECTERN
 *   b6.lectern   the lectern gooseneck 25–36 cm (10–14 in) from the mouth, a
 *                little off the mouth's axis, below it (S-CHURCH, after
 *                correction B06-1: NOT "eight inches below, centred" — that
 *                figure is the same article's omni lavalier) — worked;
 *   b6.headset   a headset on the presenter who walks (Lab 5's headset row);
 *   b6.question  the fixed aisle question mic within about 10 cm of the
 *                questioner's lips (Lab 5's stage row, DPA-VOICE).
 * O-LEC (owner item): S-PODIUM's 7–10 in gain-setting distance is NOT drawn
 * as a second zone (the proposal: "only if the owner wants").
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { headsetRow, stageRow } from '../shared/voice/voiceStarts.ts';
import { B06_MODEL, BOUNDARY_AT, IDS_ASK, IDS_P3, TABLE, V_ASKER, V_P3 } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

const GOOSE: VoiceZoneSpec = {
  id: 'b6.goose',
  label: 'A gooseneck about 20–30 cm, below the mouth',
  band: 'After our research, here is where we recommend you begin: a gooseneck in front of each panelist, its capsule about 20–30 cm (8–12 in) from the lips and a little below the mouth’s line, aimed across their normal speaking arc — the base away from the papers.',
  kind: 'trial',
  src: 'LESSON-B06',
  quote: 'One per seated talker where practical; bring the capsule toward the mouth, aim across the normal speaking arc, keep the base away from page turning and knocks (the lesson L12; PRACTICE)',
  bandProv: ill('no source gives a distance: 20–30 cm round the proposal’s 25 cm drawing default; 10–35° below the mouth’s axis is the lab’s drawing'),
  distance: { min: 200, max: 300 },
  off: { min: 10, max: 35, toward: 'down', prov: ill('a little below the mouth’s line: 10–35° below the axis (the lab’s drawing)') },
  aimTol: 20,
  micTypeIds: ['bcGoose', 'bcGooseSuper'],
  mount: 'clip',
  variant: 'panel',
  start: { d: [250, 240, 260, 230, 270], deg: 20, at: 'mouth' },
  tendency: 'Each panelist close and clear on their own channel — the best control for soft or overlapping talkers. A gooseneck can block a camera’s view, and a speaker who leans back leaves it behind.',
  checks: ['The panelist facing forward and turning to a neighbour', 'Paper, hands and knocks through the base', 'The camera’s view past the neck'],
};

const LECTERN: VoiceZoneSpec = {
  id: 'b6.lectern',
  label: 'The lectern gooseneck, about 25–36 cm, a little off the mouth',
  band: 'At a lectern, try the gooseneck’s capsule about 25–36 cm (10–14 in) from the lips, a little off the mouth’s line and below it, out of the presenter’s sight line and the paper’s path.',
  kind: 'sourced',
  src: 'S-CHURCH',
  quote: '10"-14" and a little off-center from a speaker\'s mouth (lectern; correction B06-1)',
  bandProv: ill('"a little off-center": below the mouth’s line, 10–35° off the axis, is the lab’s drawing (the lesson L27: "below and slightly off the mouth axis")'),
  distance: { min: 254, max: 355.6 },
  off: { min: 10, max: 35, toward: 'down', prov: ill('below and a little off the mouth’s axis: 10–35° (the lab’s drawing)') },
  aimTol: 20,
  micTypeIds: ['bcGoose', 'bcGooseSuper'],
  mount: 'clip',
  variant: 'lectern',
  start: { d: [300, 290, 310, 280, 320], deg: 25, at: 'mouth' },
  tendency: 'A clear voice that allows modest head turns, with fewer breath bursts off the mouth’s line. A short or tall presenter, or one who steps back, changes it — rehearse the handoff.',
  checks: ['A short and a tall presenter at the same gooseneck', 'Breath and pops on the loudest lines', 'The paper and the sight line clear'],
};

export const B06_ZONES: DocumentedZone[] = [
  voiceZone(B06_MODEL, FRAME_V, GOOSE, MIC_TYPES),
  voiceZone(B06_MODEL, V_P3, { ...GOOSE, id: 'b6.gooseP3', label: 'The next panelist’s own gooseneck', band: 'The next panelist gets their own gooseneck the same way — about 20–30 cm from their lips, below the mouth’s line — on their own channel.' }, MIC_TYPES, { surface: IDS_P3.surface }),
  {
    id: 'b6.boundary',
    label: 'Shared, on the table between two panelists',
    band: 'For a quiet studio roundtable with no PA: one boundary mic lying on the table between two neighbours, its front toward them — check its actual pattern; this one is half-cardioid, not omni.',
    kind: 'trial',
    src: 'LESSON-B06',
    quote: 'A low-profile microphone on a clear, stable surface between adjacent talkers; use its actual pattern and orientation, not the assumption that every boundary is omnidirectional (L15; PRACTICE)',
    bandProv: ill('its place on the table is a drawing default; the distance from the lips (45–90 cm) is read from the drawing'),
    refSurface: 'mouth',
    side: 'either',
    distance: { min: 450, max: 900 },
    aim: { maxOffAxis: 75, prov: ill('a boundary lies flat: its front faces the talkers, the mouth well above it (the lab’s tolerance)') },
    requires: { variant: 'panel', micTypeIds: ['bcBoundary'], mount: 'surface' },
    start: { p: { x: BOUNDARY_AT.x, y: TABLE.min.y - 2 * MIC_TYPES.bcBoundary.body.radius.mm, z: BOUNDARY_AT.z }, az: 0, el: 0 },
    tendency: 'One small mic for two people: less to see and to set up — but farther from each mouth, so more room, more of the table and more of each head turn.',
    checks: ['Papers, laptops and hands kept off it', 'Both talkers turning to each other', 'Not for a loud room with a PA'],
  },
  voiceZone(B06_MODEL, FRAME_V, LECTERN, MIC_TYPES),
  voiceZone(B06_MODEL, FRAME_V, headsetRow({ id: 'b6.headset', variant: 'lectern', micTypeIds: ['vocHeadset'], label: 'A headset for a presenter who walks', band: 'For a presenter who leaves the lectern, a headset holds one distance: the capsule where its maker says, near the corner of the mouth, out of the breath — and someone ready to mute the lectern.', tendency: 'One steady distance as the presenter walks and turns. With the lectern mic also open on the same voice, the two copies comb: plan who mutes which.', checks: ['Who mutes the lectern when the headset is live', 'The capsule out of the breath', 'The bodypack and cable secured'] }), MIC_TYPES),
  voiceZone(B06_MODEL, V_ASKER, stageRow({ id: 'b6.question', variant: 'lectern', micTypeIds: ['vocDynCard'], label: 'The aisle question mic, within about 10 cm', band: 'For audience questions, a fixed mic on a stand in the aisle: the questioner within about 10 cm (4 in) of it, coached to stay close for the whole question.', tendency: 'The question clear in the stream and the press feed — if it is routed there. Off the mic, or with an interruption, the question disappears from the feed even when the room heard it.', checks: ['The question reaching the stream and the press feed', 'A short and a tall questioner', 'The stand’s base and cable out of the aisle’s path'] }), MIC_TYPES, { surface: IDS_ASK.surface }),
];
