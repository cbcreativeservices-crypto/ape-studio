/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — the recommended starting points
 * (charter §2 layer 1), on the seated talker (shared/broadcast, frame V on
 * the host) and the voice family's zone builder (shared/voice/voiceZones).
 * Source keys: docs/labs/miking/radio_host/SOURCES.md §0; every distance is
 * from the LIP POINT to the mic's FRONT (a broadcast dynamic's windscreen
 * front; a side-address condenser's face).
 *
 *   b1.dyn       end-address broadcast dynamic, 10–15 cm (R-POD "about 4 - 6
 *                inches") on the mouth's axis — the worked example (studio);
 *   b1.close     the same, 2.5–15 cm (S-SM7B-UG "1 to 6 inches") — closer
 *                for a live show: the worked example live (D-HOST1: the two
 *                ranges are device examples, both shown);
 *   b1.cond      a side-address condenser with a pop screen, 15–20 cm (R-POD
 *                "about 6 – 8 inches") in a quiet studio;
 *   b1.offBreath the condenser a little above the breath stream, still aimed
 *                at the mouth (R-POD "a very slight angle"; 10–20° is the
 *                lab's drawing, the proposal's 15° default);
 *   b1.hostB     the second host's own mic, under 15 cm (R-BLEED "less than
 *                six inches"), its rear toward the host.
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { talkerAnchor } from '../shared/broadcast/talkerPose.ts';
import { B01_MODEL, HOST_A, HOST_B, IDS_B } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ON_AXIS = ill('on the mouth’s axis: within 15° of it (the lab’s drawing)');
const VA = talkerAnchor(HOST_A);
const VB = talkerAnchor(HOST_B);

const DYN: VoiceZoneSpec = {
  id: 'b1.dyn',
  label: 'In front of the mouth, about 10–15 cm',
  band: 'After our research, here is where we recommend you begin: the end of a broadcast dynamic about 10–15 cm (4–6 in) from the lips, on the mouth’s axis, aimed at the mouth — the host speaks into its end.',
  kind: 'sourced',
  src: 'R-POD',
  quote: 'about 4 - 6 inches away from your mouth (dynamic)',
  distance: { min: 101.6, max: 152.4 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcDynArm'],
  mount: 'clip',
  variants: ['studio', 'twoHosts', 'live'],
  start: { d: [125, 120, 130, 115, 140], at: 'mouth' },
  tendency: 'A close, steady voice with little of the room — and some low end from the proximity effect. Closer adds bass and pops; farther, more room and the other host.',
  checks: ['The host keeps this distance while reading and turning', 'Bass build-up, pops and lip noise', 'Enough clean gain on the soft lines'],
};

const CLOSE: VoiceZoneSpec = {
  id: 'b1.close',
  label: 'Close, for a live show — about 2.5–15 cm',
  band: 'For a live show, an idea to try: the broadcast dynamic’s end closer, anywhere from about 2.5 to 15 cm (1–6 in) from the lips, on the mouth’s axis — more voice against the room and the PA.',
  kind: 'sourced',
  src: 'S-SM7B-UG',
  quote: 'speak directly into the mic 1 to 6 inches (2.54 to 15 cm) away',
  distance: { min: 25.4, max: 152.4 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcDynArm', 'bcDynSuper'],
  mount: 'clip',
  variants: ['studio', 'live'],
  start: { d: [60, 55, 65, 70, 50], at: 'mouth' },
  tendency: 'The most voice against the room and the PA, and the most gain before feedback — with a fuller low end and more pops and breath. Small head moves change the level more this close.',
  checks: ['Pops and breath on the loudest lines', 'Level changes as the host leans in and out', 'Where the PA sits against the pattern'],
};

const COND: VoiceZoneSpec = {
  id: 'b1.cond',
  label: 'A studio condenser, about 15–20 cm',
  band: 'In a quiet studio, try a side-address condenser with its front mark toward the mouth, about 15–20 cm (6–8 in) from the lips, a pop screen in front.',
  kind: 'sourced',
  src: 'R-POD',
  quote: 'about 6 – 8 inches for condenser microphones',
  distance: { min: 152.4, max: 203.2 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcLdcArm'],
  mount: 'clip',
  variant: 'studio',
  start: { d: [180, 175, 185, 170, 190], at: 'mouth' },
  tendency: 'A detailed, open voice — and more of the room and the other host than a close dynamic. It suits a quiet, treated room.',
  checks: ['Room sound and the desk’s reflection', 'Sibilance and breath blasts on loud words', 'The other host in this mic'],
};

const OFF_BREATH: VoiceZoneSpec = {
  id: 'b1.offBreath',
  label: 'A little above the breath stream',
  band: 'An alternative: the screened condenser a little above the mouth’s line, about 15–20 cm away, still aimed at the mouth — so the air of P and B passes beneath it.',
  kind: 'sourced',
  src: 'R-POD',
  quote: 'talk on a very slight angle to prevent plosives',
  bandProv: ill('"a very slight angle": 10–20° above the mouth’s axis is the lab’s drawing (the proposal’s 15° default)'),
  distance: { min: 152.4, max: 203.2 },
  off: { min: 10, max: 20, toward: 'up', prov: ill('a little above the breath stream: 10–20° above the axis (the lab’s drawing)') },
  aimTol: 15,
  micTypeIds: ['bcLdcArm'],
  mount: 'clip',
  variant: 'studio',
  start: { d: [180, 175, 185, 170], deg: 15, at: 'mouth' },
  tendency: 'Fewer pops and a softer breath, with much the same body; too far off the line and the consonants turn duller.',
  checks: ['Pops on P and B against the on-axis start', 'The consonants still clear', 'The screen clear of the nose and the host’s sight line'],
};

const HOST_B_MIC: VoiceZoneSpec = {
  id: 'b1.hostB',
  label: 'The second host’s own mic, under 15 cm',
  band: 'Each host on their own mic: the second host’s end-address dynamic under about 15 cm (6 in) from their lips, aimed at their mouth — its rear toward the other host.',
  kind: 'sourced',
  src: 'R-BLEED',
  quote: 'position each microphone less than six inches from you and your guests … facing away from one another',
  distance: { min: 90, max: 152.4 },
  off: { min: 0, max: 15, prov: ON_AXIS },
  aimTol: 15,
  micTypeIds: ['bcDynArm'],
  mount: 'clip',
  variant: 'twoHosts',
  start: { d: [125, 120, 130, 115], at: 'mouth' },
  tendency: 'Each voice strongest in its own mic, the other voice later and lower in it. On separate channels each can be checked alone and in the mix.',
  checks: ['Each channel alone, then the mix', 'A brief overlap: does the sum sound hollow?', 'Comfortable eye contact across the desk'],
};

export const B01_ZONES: DocumentedZone[] = [
  voiceZone(B01_MODEL, VA, DYN, MIC_TYPES),
  voiceZone(B01_MODEL, VA, CLOSE, MIC_TYPES),
  voiceZone(B01_MODEL, VA, COND, MIC_TYPES),
  voiceZone(B01_MODEL, VA, OFF_BREATH, MIC_TYPES),
  voiceZone(B01_MODEL, VB, HOST_B_MIC, MIC_TYPES, { surface: IDS_B.surface }),
];
