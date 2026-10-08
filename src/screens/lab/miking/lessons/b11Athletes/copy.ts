/**
 * B11 ATHLETES, COACHES AND OFFICIALS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: approval first, the coach, the
 * official, the athlete, the body-worn chain, the private circuit, the
 * fallback. The safety rows come from the ONE sports safety card
 * (shared/sports/safety.ts), worded once. Starting-points voice (owner
 * ruling 2026-10-04): no sources, brands, rule books or badges
 * (CORRECTIONS_LOG "L7B-G1"; D7-1: one plain approval card).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { SPORTS_SAFETY } from '../shared/sports/safety.ts';

const INTRO = 'This lesson is about putting a microphone on a person taking part — a coach, an official, an athlete — where the event allows it. First the person and the approval: where the voice leaves, where a body mic, its pack and its cable can go, and what is never touched; then real starting setups drawn on the wearer, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a coach, an official or an athlete',
  startIntro: INTRO,
  worked: { studio: 'b11.lav', live: 'b11.headset' },
  liveZone: 'b11.official',
  pairA: 'b11.lav',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b11.prac.gain', second: 'b11.prac.3', mixed: ['b11.mix.1', 'b11.mix.2', 'b11.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the stop conditions, the radio frequencies, and polarity versus delay.' },
  before: [
    { title: 'BEFORE ANY MIC: APPROVAL', text: 'Approval is the first mic position. Get the current rules for this sport and event, the production’s rights, the team’s and the person’s agreement, and a named equipment reviewer: who may be miked, when, where the pack sits, what audio may be used or sent, and who may remove it. A sideline credential approves none of that.' },
    SPORTS_SAFETY.protective,
    { title: 'A BROADCAST MIC IS NOT THEIR COMMS', text: 'Keep the broadcast mic separate from the team’s and the officials’ own communications. Their private circuits stay on their approved routes.' },
    SPORTS_SAFETY.play,
    { title: 'STOP CONDITIONS', text: 'A loose pack, a displaced protective item, discomfort, heat or a dangling cable is a stop: mute that mic and use the approved fallback. Never send crew into play to repair a mic.' },
    { title: 'PRACTICE SAFELY', text: 'Rehearse only with a consenting adult in non-contact clothing, with safe movement — no staged collisions, no forced contact.' },
  ],
  studio: {
    id: 'b11.ctx.studio',
    prompt: 'A coach has agreed to a mic, and the event has approved it. What is a fair first setup?',
    note: 'With approval in hand: a chest mic at the approved place, or an approved headset — on its own channel, kept apart from the team’s own headset. Switch to OFFICIAL for the PA exercise.',
  },
  contextPoints: [
    { title: 'APPROVAL FIRST', text: 'Every position here starts with permission — for the mount, the pack, the destination and the time window. Where it is refused, the perimeter or an interview is the fallback.' },
    { title: 'ON THE PA', text: 'An official’s announcement mic feeds the PA and hears it back: open it on purpose, mute it again, aim its quietest side toward the PA where the mouth allows. Never provoke feedback.' },
    { title: 'MOVEMENT', text: 'People in sport run, bend, shout and sweat. A headset holds one distance through the turns; a chest mic stays on the chest. Test with safe, representative movement.' },
    { title: 'THE LOUDEST MOMENT', text: 'Set the transmitter’s gain for the loudest voice, a whistle nearby or a celebration, with headroom — and watch the transmitter, the receiver and the actual destination.' },
  ],
});

export const B11_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHO',
  variantShort: { coach: 'coach', official: 'official', athlete: 'athlete' },
  sceneSubject: { coach: 'a coach at the sideline', official: 'an official with an announcement headset', athlete: 'an athlete in contact kit' },
  viewTag: { side: 'SIDE · FROM THE WEARER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the field', minus: 'toward the wearer', label: 'IN–OUT', blurb: 'Out from the wearer toward the field, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin, the breastbone and the belt.' },
    z: { plus: 'to wearer’s right', minus: 'to wearer’s left', label: 'ACROSS', blurb: 'Toward the wearer’s right or left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A wearer and a body-worn mic · every part named',
    figureLabel: 'A coach standing at the sideline, seen from the right, a pack at the small of the back.',
    partsBadge: 'A body-worn mic · tap a part to name it',
    partsLooking: { side: 'Side view · from the wearer’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. On the body: the breastbone, the pack, the cable, the team’s headset; around: the field, the PA, the perimeter. Tap any of them.',
    variantNotes: {
      coach: 'COACH: an approved chest mic or a broadcast headset; their team headset is their own system; a perimeter boom outside play as the fallback.',
      official: 'OFFICIAL: the event’s announcement headset, opened on purpose to the PA; the officials’ private circuit stays closed.',
      athlete: 'ATHLETE: only where the event, the team and the athlete approve — the exact approved place, clear of the helmet and the pads.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A wearer with a body-worn mic, from above.',
    kitLanding: 'Tap anything on or around the wearer. There is nothing to answer yet.',
    kitIdle: 'Everything here is either the wearer’s body, their own equipment, or something a mic can hear.',
    stageA11y: 'An official near the PA, from above.',
    studioA11y: 'A coach at the sideline, from above.',
    stageIdle: 'The official’s announcement mic feeds the PA — and hears it back.',
    studioIdle: 'A coach at the sideline: the field in front, the perimeter outside play.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { coach: 'b11.lav', official: 'b11.official', athlete: 'b11.athlete' },
    workedAim: 'Aim it toward the mouth — the lab counts it while the mic points within about {tol}° of the lips.',
    workedClear: 'Clear of the body’s equipment: the capsule off fabric edges, zips, badges and straps, nothing on a helmet or a pad, the cable with a loop and slack. Approval and clearance come first, before any number.',
    reveal: 'A chest mic tends to sound fuller in the chest and steadier in level, but it does not turn with the head; a headset boom keeps one distance and hears more breath. People and kit vary, so “it depends on this person” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      locLav: 'Ideas to try with a body mic: at the approved place, its capsule toward the mouth, clear of rubbing fabric; listen through a turn, an arm raise, a jog and the breathing after it.',
      bcHeadsetBoom: 'Ideas to try with a broadcast headset: the capsule at the outside corner of the mouth, out of the breath; check it beside the team’s own headset, a cap or a visor.',
      bcHeadsetSuper: 'Ideas to try with a supercardioid headset: its small rear lobe — check where the PA sits.',
      locBoomSg: 'Ideas to try with the perimeter boom: as close as the perimeter allows, re-aimed as the coach moves — a different perspective, labelled as one.',
    },
    note: 'Approval and clearance come first: the approved place only, nothing on protective equipment, the cable without a loop that can catch, nobody in play.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic on a person in sport — once it is approved — measured from the lips to the front of the mic. They are starting points, not rules: no chest position or mouth offset fits every uniform, body and mic. Experimentation is encouraged, inside the approval.',
      separate: 'Distance and the angle off the mouth’s axis are separate variables: change one at a time, with safe, representative movement each time. Distances are measured to the mic’s FRONT and rounded to about 5 mm — no millimetre claim is made.',
      clearance: 'Clearance comes first: the approved place, nothing on protective equipment, the cable and the pack secured.',
      tendencies: 'A chest mic tends to sound fuller and steadier and to change with head turns; a headset boom keeps one distance and hears more breath; a perimeter mic hears more of the field and the crowd. These are tendencies, and people vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'official',
    zone: 'b11.official',
    typeId: 'bcHeadsetBoom',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'bcHeadsetBoom' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'bcHeadsetSuper' },
    ],
    micNoun: 'An announcement headset',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the capsule’s front up to 60° either way — it still faces the mouth.',
    plan: { u0: -700, u1: 2700, v0: -2900, v1: 700 },
    side: { u0: -700, u1: 2700, v0: -2100, v1: 1640 },
    target: 'pa',
    targetWord: 'PA',
    looking: 'The official with an announcement headset · the PA high to the front-left',
    prompt: 'The PA stays where the venue needs it. Turn or tilt the headset capsule (AIM), or change its PATTERN, until the PA sits in the rejection — while it still points at the mouth.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. At the corner of the mouth, aimed across it, its rear points out to the official’s side — the PA, high in front, is not behind it. Closeness does most of the work; open the mic only for the announcement.',
    shieldNote: 'The official’s head and the stadium reflect the PA’s sound too, and the free-field pattern cannot show that. Bring the mic up only to its working level with the PA on.',
    learn: {
      ...BASE.context!.learn,
      intro: 'These are scenario-based comparisons, not restrictions: the voice is the same — who wears the mic, what is approved and where it goes change.',
      body: 'An official’s announcement mic feeds the PA it can hear. A pattern’s rejection helps a little; a close capsule, the mic open only for the announcement and the PA’s own placement do more.',
      warn: 'No mic position alone prevents feedback: the pattern, the open mics, the PA’s place and level and the stadium all matter. Never create feedback deliberately — at any ring, pull it down at once.',
    },
  },
  twoMic: {
    variant: 'coach',
    label: 'A chest mic and a headset on one coach',
    A: { typeId: 'locLav', pattern: 'omni', zone: 'b11.lav' },
    B: { typeId: 'bcHeadsetBoom', pattern: 'cardioid', zone: 'b11.headset' },
    learn: [
      'Not a setup to aim for: a chest mic and a headset open on the same voice. The voice reaches the headset first and the chest mic a little later — summed, some pitches cancel.',
      'Choose one mic for the program, or switch between them on purpose. Listen to each alone, then both in MONO, and hear what the delay does. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. A chest mic hears a different voice from a capsule at the mouth, and people move — read the notch POSITIONS and treat their depths as illustrative.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the wearer',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the wearer, the approval and the kit first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic: a body mic’s cap, a headset capsule’s foam, a shotgun’s tip.',
    clipMount: 'Mount: a clip at the approved place, a headset boom from over the ear, or a pole held outside play',
    standMount: 'Mount: never a stand in the field or a route',
    observation: 'Only with approval and the person’s agreement, in safe movement. Write tendencies in words — what you heard, not a promised result.',
  },
};
