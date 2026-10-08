/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — the recommended starting
 * points (charter §2 layer 1), on frame V (the reader) and the guest's own
 * anchor (shared/broadcast), built by the voice family's zone builder.
 * Source keys: docs/labs/miking/voiceover_guests/SOURCES.md and the Lab 7a
 * register (radio_host/SOURCES.md §0); every distance is from the LIP POINT
 * to the mic's FRONT.
 *
 * BOOTH
 *   b7.close      close frontal: a broadcast dynamic on a boom stand, its
 *                 windscreen on, on axis 2.5–15 cm (S-SM7B-UG "1 to 6
 *                 inches"), started at about 10 cm (DPA-VOC-STUDIO "about 4
 *                 inches … directly on axis") — the worked example;
 *   b7.moderate   moderate frontal: a screened condenser 20–30 cm (N-VOC
 *                 "20–30 cm (8–12 inches)"; DPA-VOC-STUDIO "around 12
 *                 inches") in a room worth hearing;
 *   b7.offBreath  the dynamic a little off the breath stream (R-POD "a very
 *                 slight angle"; 10–20° above is the lab's drawing);
 *   b7.overScript above the stand at about eye level, angled down at the
 *                 mouth, no screen (N-POP; 20–30 cm is N-VOC's distance,
 *                 Lab 5's lv.above).
 * GUEST DESK
 *   b7.host       the host's broadcast dynamic on its arm, 2.5–15 cm,
 *                 started at about 11 cm (S-SM7B-UG) — the worked example;
 *   b7.live       closer, for a live read (the same range, started at 6 cm);
 *   b7.guest      the guest's own mic, the same type and range, its rear
 *                 toward the host (the lesson L34: a separate mic each);
 *   b7.guestHs    a headset on a guest who turns (Lab 5's headset row: its
 *                 capsule "near the mouth corner", drawing default; B05 not
 *                 built yet — B-XLINK: no link).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { headsetRow } from '../shared/voice/voiceStarts.ts';
import { B07_MODEL, IDS_G, V_GUEST } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ON_AXIS = ill('on the mouth’s axis: within 15° of it (the lab’s drawing)');

const CLOSE: VoiceZoneSpec = {
  id: 'b7.close',
  label: 'Close in front, about 10 cm',
  band: 'After our research, here is where we recommend you begin: the end of a broadcast dynamic about 10 cm (4 in) from the lips — anywhere from about 2.5 to 15 cm (1–6 in) — on the mouth’s axis, its windscreen on.',
  kind: 'sourced',
  src: 'S-SM7B-UG',
  quote: 'speak directly into the mic 1 to 6 inches (2.54 to 15 cm) away (DPA-VOC-STUDIO: "about 4 inches from the mouth directly on axis")',
  distance: { min: 25.4, max: 152.4 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcDynStand'],
  variant: 'booth',
  start: { d: [101.6, 105, 110, 95, 120], at: 'mouth' },
  tendency: 'A direct, intimate, dry voice with little of the room — and more breath, lip noise and low end from the proximity effect.',
  checks: ['Pops on P and B, and harsh S sounds', 'The same distance through a page turn and a laugh', 'Clean gain on the softest line'],
};

const MODERATE: VoiceZoneSpec = {
  id: 'b7.moderate',
  label: 'Moderate, about 20–30 cm — a little of the room',
  band: 'In a good-sounding studio room, try a screened condenser about 20–30 cm (8–12 in) from the lips, on the mouth’s axis — a more open narration with some of the room in it.',
  kind: 'sourced',
  src: 'N-VOC',
  quote: 'Maintain a distance of 20–30 cm (8–12 inches). (DPA-VOC-STUDIO: "around 12 inches")',
  distance: { min: 203.2, max: 304.8 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['vocLdc'],
  variant: 'booth',
  start: { d: [250, 240, 260, 230, 280], at: 'mouth' },
  tendency: 'A more open, natural narration: less breath and bass, more of the room and the booth — noise and reflections become easier to hear.',
  checks: ['Is the room worth hearing?', 'Fan and vent noise against the voice', 'Consistency after a head turn'],
};

const OFF_BREATH: VoiceZoneSpec = {
  id: 'b7.offBreath',
  label: 'A little above the breath stream',
  band: 'An alternative: the dynamic a little above the mouth’s line, about 10–15 cm away, still aimed at the mouth — the air of P and B passes beneath it.',
  kind: 'sourced',
  src: 'R-POD',
  quote: 'talk on a very slight angle to prevent plosives',
  bandProv: ill('"a very slight angle": 10–20° above the mouth’s axis is the lab’s drawing'),
  distance: { min: 90, max: 152.4 },
  off: { min: 10, max: 20, toward: 'up', prov: ill('a little above the breath stream: 10–20° above the axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['bcDynStand'],
  variant: 'booth',
  start: { d: [120, 115, 125, 130], deg: 15, at: 'mouth' },
  tendency: 'Fewer pops with much the same body. Too far off the line and some mics change the consonants — test it on this mic, not every mic.',
  checks: ['Pops against the on-axis start', 'The consonants still clear', 'Clear of the nose and the reader’s view of the script'],
};

const OVER_SCRIPT: VoiceZoneSpec = {
  id: 'b7.overScript',
  label: 'Above the script, aimed down at the mouth',
  band: 'An idea to try: a condenser firmly mounted above the script at about eye level, about 20–30 cm from the lips, aimed down at the mouth — the reader keeps their view and the paper’s reflection drops.',
  kind: 'sourced',
  src: 'N-POP',
  quote: 'Position the mic top down, at about eye level, and angle it down toward the singer’s mouth',
  bandProv: ill('no distance is given: 20–30 cm is N-VOC’s; "about eye level": 10–25° above the mouth’s axis is the lab’s drawing'),
  distance: { min: 200, max: 300 },
  off: { min: 10, max: 25, toward: 'up', prov: ill('at about eye level: 10–25° above the mouth’s axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['vocLdcOpen'],
  variant: 'booth',
  start: { d: [250, 240, 260, 230, 270], deg: 18, at: 'mouth' },
  tendency: 'The reader looks over the mic to the script; fewer pops and less of the paper’s reflection. Check how the voice sounds a little off the mic’s axis.',
  checks: ['The sight line to the script', 'The mount firm, rated for the mic', 'Head movement as the reader looks down'],
};

const HOST_MIC: VoiceZoneSpec = {
  id: 'b7.host',
  label: 'The host’s mic, about 11 cm',
  band: 'At the desk, try the host’s broadcast dynamic about 11 cm (4 in) from the lips — anywhere from about 2.5 to 15 cm (1–6 in) — on the mouth’s axis, on its arm.',
  kind: 'sourced',
  src: 'S-SM7B-UG',
  quote: 'speak directly into the mic 1 to 6 inches (2.54 to 15 cm) away',
  distance: { min: 25.4, max: 152.4 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcDynArm'],
  mount: 'clip',
  variants: ['desk', 'guest'],
  start: { d: [110, 105, 115, 100, 120], at: 'mouth' },
  tendency: 'A close, steady voice that a guest’s mic can be matched to. Closer adds bass and pops; farther, the guest and the room.',
  checks: ['The host and the guest at the same level in the program', 'The guest in the host’s mic', 'Pops and breath'],
};

const LIVE: VoiceZoneSpec = {
  ...HOST_MIC,
  id: 'b7.live',
  label: 'Close, for a live read — about 2.5–8 cm',
  band: 'For a live read, try the close end of the same range — about 2.5–8 cm (1–3 in) from the lips — a steady, repeatable place that keeps the voice ahead of the room.',
  bandProv: ill('the close end of S-SM7B-UG’s 1–6 in: 2.5–8 cm is the lab’s band'),
  distance: { min: 25.4, max: 80 },
  variants: undefined,
  variant: 'desk',
  start: { d: [60, 55, 65, 70], at: 'mouth' },
  tendency: 'The most voice against the room, and a cue the host can return to — with more low end and pops this close.',
  checks: ['A physical cue to return to', 'Pops on the loudest lines', 'The level as the host turns to the guest'],
};

const GUEST_MIC: VoiceZoneSpec = {
  id: 'b7.guest',
  label: 'The guest’s own mic, about 11 cm',
  band: 'Give the guest their own mic: the same kind at a similar distance — about 11 cm from their lips — placed so they can look at the host and stay on its axis.',
  kind: 'sourced',
  src: 'S-SM7B-UG',
  quote: 'speak directly into the mic 1 to 6 inches (2.54 to 15 cm) away (the lesson L34: a separate mic each, looking at the host)',
  distance: { min: 25.4, max: 152.4 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcDynArm'],
  mount: 'clip',
  variant: 'guest',
  start: { d: [110, 105, 115, 100, 120], at: 'mouth' },
  tendency: 'The guest close and clear on their own channel, the host later and lower in it. Placement and level matter more than matching the mic’s name.',
  checks: ['Each voice at the program destination', 'The host in the guest’s mic', 'Unused mics muted or lowered'],
};

export const B07_ZONES: DocumentedZone[] = [
  voiceZone(B07_MODEL, FRAME_V, CLOSE, MIC_TYPES),
  voiceZone(B07_MODEL, FRAME_V, MODERATE, MIC_TYPES),
  voiceZone(B07_MODEL, FRAME_V, OFF_BREATH, MIC_TYPES),
  voiceZone(B07_MODEL, FRAME_V, OVER_SCRIPT, MIC_TYPES),
  voiceZone(B07_MODEL, FRAME_V, HOST_MIC, MIC_TYPES),
  voiceZone(B07_MODEL, FRAME_V, LIVE, MIC_TYPES),
  voiceZone(B07_MODEL, V_GUEST, GUEST_MIC, MIC_TYPES, { surface: IDS_G.surface }),
  voiceZone(B07_MODEL, V_GUEST, headsetRow({ id: 'b7.guestHs', variant: 'guest', micTypeIds: ['vocHeadset'], label: 'A headset for a guest who turns', band: 'An alternative for a guest who turns or moves: a headset holds one distance — the capsule where its maker says, near the corner of the mouth, out of the breath.', tendency: 'One steady distance as the guest turns to the host and back, both hands left for the script. Check comfort, how it looks on camera, and that it is the program mic, not a second one left open.', checks: ['Comfort and how it looks', 'The capsule out of the breath', 'Only one of the guest’s mics in the program'] }), MIC_TYPES, { surface: IDS_G.surface }),
];
