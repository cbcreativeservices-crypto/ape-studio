/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the suggested starting
 * points (charter §2 layer 1), on the standing guest (frame V) and the
 * reporter facing them; the voice family's zone builder (shared/voice/
 * voiceZones). Source keys: docs/labs/miking/field_reporter/SOURCES.md, the
 * Lab 7a register (radio_host/SOURCES.md §0) and lead_vocal/SOURCES.md §0;
 * every distance is from the LIP POINT to the mic's FRONT. No source gives a
 * reporter's mouth distance for the omni: the one-mic start is the SHARED
 * place at chest height between the two mouths (R-REPORTER), plus the
 * handoff path (fieldInterview.ts).
 *
 *   b3.shared       the reporter's omni at chest height midway between the
 *                   mouths, aimed up between them (R-REPORTER) — ONE MIC, the
 *                   worked example (STREET, LIVE EVENT);
 *   b3.handoffOmni  the same omni moved toward the speaking guest along the
 *                   handoff path, 15–30 cm (PRACTICE: the lesson L12 "move it
 *                   toward the active speaker"; the band a drawing default) —
 *                   ANOTHER START, with foam or fur;
 *   b3.handoffDir   a directional handheld aimed at the speaking mouth, under
 *                   15 cm (the Lab 5 handheld row, S-SM58-UG; the lesson L20
 *                   "a directional handheld must be close") — CLOSE · LIVE;
 *   b3.repOwn       TWO MICS: the reporter's own directional handheld at
 *                   their mouth, under 15 cm;
 *   b3.guestLav     TWO MICS: a lav on the guest's chest, with agreement — the
 *                   body-worn family's sternum place (D-LAV1 band).
 */
import type { DocumentedZone, Provenance, Vec3 } from '../../engine/model/types.ts';
import { MIC_TYPES } from '../../data/micTypes.ts';
import { FRAME_V } from '../shared/voice/voiceSpec.ts';
import { voiceZone, type VoiceZoneSpec } from '../shared/voice/voiceZones.ts';
import { aimOf } from '../shared/ensemble/frameS.ts';
import { standerAnchor } from '../shared/broadcast/standing.ts';
import { LAV_BAND } from '../shared/broadcast/bodyWorn.ts';
import { between } from '../shared/broadcast/handoff.ts';
import { B03_MODEL, IDS_R, LAV, PAIR, REPORTER, SHARED_P } from './geometry.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const LIP: Vec3 = { x: 0, y: 0, z: 0 };
const VR = standerAnchor(REPORTER);
const cm = (mm: number) => Math.round(mm / 10);

/** A zone whose start is a named place (the shared midpoint, the lav's
 *  clip): the voice zone's own search finds it clear; the start is then that
 *  place, aimed at `at`. */
function atPlace(spec: VoiceZoneSpec, p: Vec3, at: Vec3 = LIP): DocumentedZone {
  const base = voiceZone(B03_MODEL, FRAME_V, spec, MIC_TYPES);
  return { ...base, start: { p, ...aimOf(sub(at, p)) } };
}

const SHARED_D = Math.hypot(SHARED_P.x, SHARED_P.y, SHARED_P.z);
const SHARED: VoiceZoneSpec = {
  id: 'b3.shared',
  label: 'One omni at chest height, between the two',
  band: `After our research, here is where we suggest you begin in a quiet or moderate place: the reporter’s omni held at about chest height midway between the two people, its top tilted up between their mouths — here about ${cm(SHARED_D)} cm from each. Then listen: if the street is loud or the people are far apart, move it toward whoever is speaking.`,
  kind: 'sourced',
  src: 'R-REPORTER',
  quote: 'held at around chest height between the interviewer and the person being interviewed (the maker’s own model and a typical interview: a starting trial, not a distance rule — the lesson L20)',
  bandProv: ill('chest height (28 cm below the mouths) and the 75 cm spacing are drawing defaults; 35–60 cm from each mouth is the band round the drawing'),
  distance: { min: 350, max: 600 },
  off: { min: 20, max: 60, toward: 'down', prov: ill('below and between the mouths: 20–60° below the guest’s mouth axis (the drawing)') },
  aimTol: 60,
  aimProv: ill('an omni: its aim matters little — its top tilted up between the mouths (the lab’s tolerance)'),
  micTypeIds: ['repOmni'],
  mount: 'clip',
  variants: ['street', 'event'],
  start: { d: [Math.round(SHARED_D), Math.round(SHARED_D) - 20, Math.round(SHARED_D) + 20], deg: 37, spread: 10, at: 'mouth' },
  tendency: 'An easy, forgiving start: no rushed aiming, and both voices at about the same level. It hears the street, the crowd and a loudspeaker from every side just as well — in a loud place the voices sink into them.',
  checks: ['Both voices against the background at the program', 'The flag and the grille out of the shot of the guest’s face', 'Handling noise from the fingers and the cable'],
};

const HANDOFF_OMNI: VoiceZoneSpec = {
  id: 'b3.handoffOmni',
  label: 'The omni moved toward the speaker, about 15–30 cm',
  band: 'When the place is loud or the two stand farther apart, an idea to try: move the same omni toward whoever is speaking — about 15–30 cm from their mouth, a little below it — just before they start, and back for the next question. Add a fitted foam or fur when the air moves.',
  kind: 'trial',
  src: 'LESSON-B03',
  quote: 'deliberately move it toward the active speaker when noise or spacing calls for it (L12); the reporter … moves it toward the guest just before the guest’s answer begins (L24; PRACTICE)',
  bandProv: ill('no source gives a distance: 15–30 cm along the handoff path (between the close end and the shared place) is the lab’s drawing'),
  distance: { min: 150, max: 300 },
  off: { min: 5, max: 45, toward: 'down', prov: ill('a little below the mouth: 5–45° below its axis (the lab’s drawing)') },
  aimTol: 45,
  aimProv: ill('an omni: forgiving of aim (the lab’s tolerance)'),
  micTypeIds: ['repOmni'],
  mount: 'clip',
  variants: ['street', 'event'],
  start: { d: [200, 220, 180, 250, 160, 280], deg: 25, spread: 10, at: 'mouth' },
  tendency: 'The speaker clearly ahead of the street and of the other voice — at the price of a move before every answer. Late, and the first words come from the wrong place.',
  checks: ['The first words after each move', 'Wind at the capsule with the foam or fur on', 'The guest’s comfort: ask before coming close'],
};

const HANDOFF_DIR: VoiceZoneSpec = {
  id: 'b3.handoffDir',
  label: 'A directional handheld at the speaker, under 15 cm',
  band: 'With a cardioid handheld, keep its front on the speaking mouth, under about 15 cm (6 in) and a little below the breath — re-aimed for every answer and every question.',
  kind: 'sourced',
  src: 'S-SM58-UG',
  quote: 'Lips less than 15 cm (6 in.) away or touching the wind- screen, on axis (frame V’s handheld row; the lesson L20: "a directional handheld must be close to the chosen speaker")',
  bandProv: ill('frame V’s close handheld row as a suggested start; 4–15 cm and 0–40° below the axis are the lab’s drawing'),
  distance: { min: 40, max: 150 },
  off: { min: 0, max: 40, toward: 'down', prov: ill('a little below the breath: 0–40° below the mouth’s axis (the lab’s drawing)') },
  aimTol: 20,
  micTypeIds: ['bcFlagCard'],
  mount: 'clip',
  variants: ['street', 'event'],
  start: { d: [100, 110, 90, 120, 80, 130], deg: 20, spread: 10, at: 'mouth' },
  tendency: 'More voice against the side and rear noise when its front is on the mouth — but a missed aim or a turned head dulls the voice, and closeness adds bass, breath and wind.',
  checks: ['A turn of the guest’s head: re-aim', 'Wind and pops at this distance', 'Where the loudspeaker sits against its back'],
};

const REP_OWN: VoiceZoneSpec = {
  ...(({ variants: _v, ...rest }) => rest)(HANDOFF_DIR),
  id: 'b3.repOwn',
  label: 'The reporter’s own handheld at their mouth',
  band: 'With a mic each: the reporter keeps a cardioid handheld under about 15 cm from their own mouth, a little below the breath — on its own channel.',
  variant: 'twoMics',
  tendency: 'The reporter steady on their own channel and no rushed handoff — the guest’s voice reaches this mic too, later and lower.',
  checks: ['Each channel alone while the other speaks', 'Which channel each voice is on, named', 'The unused channel kept down'],
};

const GUEST_LAV: VoiceZoneSpec = {
  id: 'b3.guestLav',
  label: 'A lav on the guest’s chest — with their agreement',
  band: 'With the guest’s agreement: a lav clipped over the middle of their chest, about 12–25 cm from the lips, on its own channel and its own route.',
  kind: 'sourced',
  src: LAV_BAND.src,
  quote: LAV_BAND.quote,
  bandProv: ill('D-LAV1: 12.5–25 cm, one union band (the body-worn family); the mount point is the shared figure’s'),
  distance: { min: LAV_BAND.min, max: LAV_BAND.max },
  off: { min: 55, max: 100, toward: 'down', prov: ill('on the chest, below the mouth: 55–100° below its axis (the drawing)') },
  aimTol: 60,
  aimProv: ill('an omni: its aim matters little (the lab’s tolerance)'),
  micTypeIds: ['locLav'],
  mount: 'clip',
  variant: 'twoMics',
  start: { d: [Math.round(Math.hypot(LAV.at.x, LAV.at.y))], deg: 85, spread: 2, at: 'mouth' },
  noDraw: true,
  tendency: 'The guest at one distance however they turn, with no mic in their face — but it takes time to fit, it hears clothing, and it adds a channel to route and check.',
  checks: ['Agreement first; the clip on a firm edge', 'Rubbing, the cable and the transmitter', 'Both channels at the actual program'],
};

export const B03_ZONES: DocumentedZone[] = [
  atPlace(SHARED, SHARED_P, between(PAIR.a, PAIR.b)),
  voiceZone(B03_MODEL, FRAME_V, HANDOFF_OMNI, MIC_TYPES),
  voiceZone(B03_MODEL, FRAME_V, HANDOFF_DIR, MIC_TYPES),
  voiceZone(B03_MODEL, VR, REP_OWN, MIC_TYPES, { surface: IDS_R.surface }),
  atPlace(GUEST_LAV, LAV.at),
];
