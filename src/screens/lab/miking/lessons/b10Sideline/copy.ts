/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: the reporter and the guest, the
 * handoff, the sideline, two handhelds, the post-event mark. The safety rows
 * come from the ONE sports safety card (shared/sports/safety.ts), worded
 * once. Starting-points voice (owner ruling 2026-10-04): no sources, brands
 * or badges (CORRECTIONS_LOG "L7B-G1").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { SPORTS_SAFETY } from '../shared/sports/safety.ts';

const INTRO = 'This lesson is about the microphones of a sports interview — at the sideline seconds after play, with two handhelds, and at a post-event mark. First the two people and the place: where the voices leave, how one handheld moves between them, and what every open mic hears; then real starting setups drawn on the guest and the reporter, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a guest at an interview',
  startIntro: INTRO,
  worked: { studio: 'b10.hand', live: 'b10.hand' },
  liveZone: 'b10.hand',
  pairA: 'b10.hand',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b10.prac.gain', second: 'b10.prac.3', mixed: ['b10.mix.1', 'b10.mix.2', 'b10.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: a shotgun from the stands, the radio frequencies, and polarity versus delay.' },
  before: [
    { title: 'PLAN THE POSITION BEFORE THE HANDOFF', text: 'Confirm the permitted interview zone, the camera’s framing, the cable or radio path, the program feed and who moves the mic. Mark where the reporter and the guest stand, the crowd and the PA, the wind, and the nearest clear exit.' },
    SPORTS_SAFETY.play,
    SPORTS_SAFETY.approval,
    { title: 'ASK ABOUT THE GUEST', text: 'Are they walking, out of breath, wearing a helmet or a head covering, carrying equipment, under kit rules? Rehearse with the camera operator so the mic stays close without hiding the face or hitting the lens.' },
    SPORTS_SAFETY.weather,
    SPORTS_SAFETY.lightning,
    { title: 'STOP OR MOVE', text: 'If play, the crowd, the weather or the venue’s people make the spot unsafe, stop the interview or move it. Never follow a guest into an unapproved area for a better angle.' },
  ],
  studio: {
    id: 'b10.ctx.studio',
    prompt: 'A scheduled post-event guest in front of a backdrop, time to prepare. What is a fair first setup?',
    note: 'At a post-event mark there is time: a body mic on the guest with their and the event’s approval, or a boom held outside the frame — each on its own channel. Switch to SIDELINE for the PA exercise.',
  },
  contextPoints: [
    { title: 'CLOSE TO THE SPEAKING MOUTH', text: 'A handheld under about 15 cm from whoever is speaking — moved before the answer. No pattern makes up for a mic left far from the mouth.' },
    { title: 'THE PATTERN', text: 'An omni forgives small aiming errors; a cardioid or supercardioid hears less from the side but needs accurate aim — and a supercardioid has a small lobe behind: check where the PA sits.' },
    { title: 'WIND', text: 'Use a windscreen fit for the conditions; it is not waterproof. If the wind changes, turn the bodies or move to a sheltered, permitted spot that keeps the camera and the exit.' },
    { title: 'THE LOUDEST WORDS', text: 'Two voices at different levels, a shout, a close cheer: leave input headroom. A filter cannot repair wind overload or lost consonants.' },
  ],
});

export const B10_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { sideline: 'sideline', twoMics: 'two handhelds', postEvent: 'post-event' },
  sceneSubject: { sideline: 'a reporter and a guest at the sideline', twoMics: 'a reporter and a guest, each with a handheld', postEvent: 'a guest at a post-event mark in front of a backdrop' },
  viewTag: { side: 'SIDE · FROM THE GUEST’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the camera', minus: 'toward the guest', label: 'IN–OUT', blurb: 'Out from the guest toward the camera, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin and the chest.' },
    z: { plus: 'to guest’s right', minus: 'toward the reporter', label: 'ACROSS', blurb: 'Toward the guest’s right, or their left — where the reporter stands (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A reporter and a guest · every part named',
    figureLabel: 'A reporter and a guest standing side by side in front of a camera, the touchline behind them.',
    partsBadge: 'An interview · tap a part to name it',
    partsLooking: { side: 'Side view · from the guest’s right', top: 'Top view · from above' },
    partsIdle: 'The guest’s voice leaves through the mouth — every distance is read from the lips. Around them: the reporter, the camera, the play area, the exit, the PA, the crowd. Tap any of them.',
    variantNotes: {
      sideline: 'SIDELINE: one handheld in the reporter’s hand, moved to whoever speaks; the reporter’s headset for cues; the touchline and the play area behind; the exit route kept open.',
      twoMics: 'TWO HANDHELDS: the reporter and the guest each hold their own — each on its own channel, the unused one kept down.',
      postEvent: 'POST-EVENT: a mark in front of a backdrop — a body mic on a scheduled guest, with approval, or a boom held outside the frame.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A reporter and a guest, from above.',
    kitLanding: 'Tap anything around the interview. There is nothing to answer yet.',
    kitIdle: 'Everything around the interview is either the two people’s space, the camera’s, the play area, or something a mic can hear.',
    stageA11y: 'A sideline interview, from above.',
    studioA11y: 'A post-event mark, from above.',
    stageIdle: 'The crowd around, the PA beyond the camera, the play area behind: the mic stays close to the speaking mouth.',
    studioIdle: 'A controlled mark: time for a body mic with approval, or a boom outside the frame.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { sideline: 'b10.hand', twoMics: 'b10.hand', postEvent: 'b10.lav' },
    workedAim: 'Aim it at the speaking mouth — the lab counts it while the mic points within about {tol}° of the lips.',
    workedClear: 'Clear of both people: the mic and its flag off the faces and out of the lens’s way, comfortable clearance from the lips. Clearance comes first, before any number.',
    reveal: 'Closer tends to bring more voice against the crowd, and more breath and handling; farther, or between two people, more crowd and a distant first word. Voices and stadiums vary, so “it depends on this guest” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      bcFlagOmni: 'Ideas to try with the omni handheld: keep it close and follow the mouth; it forgives a little aim, not distance.',
      bcFlagCard: 'Ideas to try with a cardioid handheld: keep its front on the speaking mouth — a mouth off its front is a duller, quieter voice.',
      bcFlagSuper: 'Ideas to try with a supercardioid handheld: aim carefully, and check where the PA sits against its small rear lobe.',
      bcHeadsetBoom: 'Ideas to try with the reporter’s headset: the capsule at the outside corner of their mouth, out of the breath; it does not hear the guest.',
      locLav: 'Ideas to try with a body mic: only with approval; the capsule clear of fabric, straps and gear; listen through a walk, a turn and the breathing after exertion.',
      locBoomSgCap: 'Ideas to try with the boom: as close as the frame allows, re-aimed as the guest turns; the pole’s sweep inside the approved area.',
    },
    note: 'Clearance comes first: nothing touches a face, the flag stays out of the lens, and nobody steps into play or blocks a route.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic at an interview, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every voice, wind and stadium is different.',
      separate: 'Distance and the angle off the mouth’s axis are separate variables: change one at a time, with real questions and answers each time. Distances are measured to the mic’s FRONT — a shotgun’s to its capsule, about 20 cm behind the tip — and rounded to about 5 mm; no millimetre claim is made.',
      clearance: 'Clearance comes first: off the faces, out of the lens, inside the approved area, the exit kept clear.',
      tendencies: 'Closer tends to sound fuller and drier, with more breath and handling; farther, more crowd and wind; below the mouth’s line, softer pops. These are tendencies, and voices vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'sideline',
    zone: 'b10.hand',
    typeId: 'bcFlagCard',
    patterns: [
      { id: 'omni', label: 'omni', typeId: 'bcFlagOmni' },
      { id: 'cardioid', label: 'cardioid', typeId: 'bcFlagCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'bcFlagSuper' },
    ],
    micNoun: 'An interview handheld',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the speaking mouth.',
    plan: { u0: -1700, u1: 2900, v0: -1500, v1: 1900 },
    side: { u0: -1600, u1: 2900, v0: -1700, v1: 1640 },
    target: 'pa',
    targetWord: 'PA',
    badgeWhere: 'the PA where the venue hangs it',
    looking: 'The guest at the sideline · the PA high beyond the camera',
    prompt: 'The PA stays where the venue needs it. Turn or tilt the handheld (AIM), or change its PATTERN, until the PA sits in the rejection — while the mic still points at the guest’s mouth.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. Held below the mouth and aimed up at it, its rear points down and out toward the camera — where the PA is decides how much it hears. An omni rejects nothing.',
    shieldNote: 'The two people, the camera and the stadium reflect the PA’s sound too, and the free-field pattern cannot show that. Listen at the actual program, with the venue live.',
    learn: {
      ...BASE.context!.learn,
      intro: 'These are scenario-based comparisons, not restrictions: the voices are the same — the place, the time to prepare, the crowd and the PA change.',
      body: 'At the sideline every open mic hears the crowd and the PA. A pattern’s rejection is a tool to aim; a mic close to the speaking mouth does more.',
      warn: 'No mic position alone makes a stadium quiet. Never create feedback deliberately — if an interview mic feeds a local PA, bring it up only to its working level and pull it down at any ring.',
    },
  },
  twoMic: {
    variant: 'twoMics',
    label: 'Two handhelds, one each',
    A: { typeId: 'bcFlagCard', pattern: 'cardioid', zone: 'b10.hand' },
    B: { typeId: 'bcFlagCard', pattern: 'cardioid', zone: 'b10.reporter' },
    learn: [
      'The reporter and the guest each hold their own mic, but each mic also hears the other voice — later and lower. In the mix, one voice arrives twice.',
      'Listen to each channel alone, then both open in MONO. A hollow sound means some pitches cancel: keep each mic close to its own mouth and pull down the one not in use. The same happens with a body mic and a handheld open on one person. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats each mouth as one point and both mics as hearing the same sound. Real mics outdoors hear different mixes of voice, wind and crowd, and people move — read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the guest',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the two people and the place first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic: a handheld’s grille, a headset capsule’s foam, a body mic’s cap, a shotgun’s capsule, about 20 cm behind its tip.',
    clipMount: 'Mount: a mic held in the reporter’s hand — or a headset, a body clip, a boom pole held outside the frame',
    standMount: 'Mount: held — never a stand in a walkway or a route',
    observation: 'For a real interview, in an approved area, with the guest’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
