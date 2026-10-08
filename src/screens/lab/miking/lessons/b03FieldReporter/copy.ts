/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: the reporter and the guest face to
 * face, the shared omni at chest height, the handoff, the directional
 * handheld, two mics, the street and a live event. The safety words are
 * exact and plain (the lightning rule, a windscreen is not waterproofing or
 * safety, electronics out of the rain, a stop/relocate signal). Starting-
 * points voice (owner ruling 2026-10-04): no sources, brands or badges
 * (CORRECTIONS_LOG "L7G3").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { LIGHTNING } from '../shared/field/location.ts';

const INTRO = 'This lesson is about one handheld mic between two people on location — a reporter and the person they are interviewing — and the wind, the street and the camera around them. First the two people and the place: where the voices leave, where one mic can sit between them or move to whoever speaks, and what the wind does; then real starting setups drawn on them, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

/** The lightning rule, exact and plain (B03 L6; the field kit's 30 minutes). */
export const B03_LIGHTNING = `If you hear thunder, stop and move everyone to a substantial building or a hard-topped vehicle, and stay there at least ${LIGHTNING.waitMin} minutes after the last thunder. A weatherproof windscreen does not make an outdoor interview safe in a thunderstorm.`;

const BASE = standingVoiceCopy({
  what: 'an interview on location',
  startIntro: INTRO,
  contextIntro: 'These are scenario-based comparisons, not restrictions: the two people are the same — the place, the wind and the loudspeakers change.',
  worked: { studio: 'b3.shared', live: 'b3.shared' },
  liveZone: 'b3.handoffDir',
  pairA: 'b3.repOwn',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b3.prac.gain', second: 'b3.prac.3', mixed: ['b3.mix.1', 'b3.mix.2', 'b3.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the shared mic, the wind, and two open mics.' },
  before: [
    { title: 'PLAN THE SHOT AND THE ROUTE', text: 'Before raising a mic: the camera’s shot and eyelines, how long the interview runs, the route to the recorder or the live program, and permission to stand there. Find a spot away from avoidable traffic, ventilation, crowds and loudspeakers — and listen there before you start.' },
    { title: 'A SAFE SPOT', text: 'The reporter, the guest and the camera operator stay out of vehicle paths, crowd surges, emergency activity and restricted areas. No stand or cable blocks an exit or a walkway. Never put people somewhere unsafe for a quieter background.' },
    { title: 'A STOP SIGNAL', text: 'For a live report, agree a clear stop or move signal with the crew before going on air — and use it.' },
    { title: 'LIGHTNING', text: B03_LIGHTNING },
    { title: 'RAIN', text: 'A windscreen is not waterproofing: keep the mic, the transmitter and the connectors out of the rain. Do not expose electronics to rain, and never make wind or loudness hazardous for a demonstration.' },
    { title: 'ASK FIRST', text: 'Get the guest’s agreement before bringing a mic close to their face or clipping one to their clothes. Keep the outstretched mic clear of passers-by and vehicles, and never stretch until your stance is unstable.' },
  ],
  studio: {
    id: 'b3.ctx.studio',
    prompt: 'A controlled studio interview, two people seated, time to prepare. What is a fair first setup?',
    note: 'In a studio there is time and access: seated lavs or a boom give each person their own channel and no handoff. A field report often has neither — that is when a rugged handheld earns its place. Switch to LIVE EVENT for the loudspeaker exercise.',
  },
  contextPoints: [
    { title: 'ONE MIC OR TWO', text: 'One rugged handheld is quick to set up and makes the speaking turns plain on camera. A mic each — a handheld and a lav — avoids the rushed handoff, but adds a channel, open-mic spill and routing work.' },
    { title: 'THE PATTERN', text: 'An omni forgives aim and handoffs, and hears the street from every side. A directional handheld can favour the voice when its front is on the mouth — and loses it when the aim slips or the head turns.' },
    { title: 'A LOCAL PA', text: 'At a live event, what goes to the loudspeaker and where a directional mic’s rejection points decide how close it gets to feedback. Bring it up only to its working level; at any ring, pull it down.' },
    { title: 'THE LOUDEST WORDS', text: 'A close guest can suddenly shout: set gain on the loudest likely speech and leave headroom at the transmitter, the receiver, the preamp and the recorder. A later compressor or an automatic level cannot repair an overloaded input.' },
  ],
});

export const B03_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { street: 'street', twoMics: 'two mics', event: 'live event' },
  sceneSubject: { street: 'a reporter and a guest face to face on a street', twoMics: 'a reporter and a guest, a mic each', event: 'a reporter and a guest at a live event with a loudspeaker' },
  viewTag: { side: 'SIDE · FROM THE GUEST’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the reporter', minus: 'toward the guest', label: 'IN–OUT', blurb: 'Out from the guest toward the reporter, or back toward the guest (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin and the chest.' },
    z: { plus: 'to guest’s right', minus: 'to guest’s left', label: 'ACROSS', blurb: 'Toward the guest’s right — where the camera stands — or their left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A reporter and a guest · every part named',
    figureLabel: 'A reporter and a guest standing face to face on a pavement, the camera beside the reporter, the road behind the guest.',
    partsBadge: 'An interview on location · tap a part to name it',
    partsLooking: { side: 'Side view · from the guest’s right', top: 'Top view · from above' },
    partsIdle: 'The guest’s voice leaves through the mouth — every distance is read from the lips. Around them: the reporter, the camera, the road, the loudspeaker. Tap any of them.',
    variantNotes: {
      street: 'STREET: one handheld in the reporter’s right hand, moved between the two; the camera beside the reporter; the kerb and the traffic behind the guest.',
      twoMics: 'TWO MICS: the reporter keeps a handheld at their own mouth, the guest wears a lav — each on its own channel.',
      event: 'LIVE EVENT: the same interview with a local loudspeaker on a pole beyond the reporter, facing the crowd.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A reporter and a guest, from above.',
    kitLanding: 'Tap anything around the interview. There is nothing to answer yet.',
    kitIdle: 'Everything around the interview is either the two people’s space, the camera’s, the road, or something a mic can hear.',
    stageA11y: 'An interview at a live event, from above.',
    studioA11y: 'An interview on a street, from above.',
    stageIdle: 'The loudspeaker faces the crowd; every open mic near it hears it too.',
    studioIdle: 'The traffic behind the guest is the loudest thing here — and a path nobody stands in.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { street: 'b3.shared', twoMics: 'b3.repOwn', event: 'b3.shared' },
    workedAim: 'Aim it at the mouth — the lab counts it while the mic points within about {tol}° of the lips (an omni forgives more).',
    workedClear: 'Clear of both people: the grille and the flag off the faces and out of the lens’s way, the arm relaxed, not stretched. Clearance comes first, before any number.',
    reveal: 'Closer to the speaking mouth tends to bring the voice up against the street and the other voice — and more breath, wind and handling; the shared place is easy and even, and hears more of the street. Voices and places vary, so “it depends on this street” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      repOmni: 'Ideas to try with the omni: start shared at chest height; if the street is loud, move it toward whoever is speaking just before they start. Hold below the flag, fingers off the grille.',
      bcFlagCard: 'Ideas to try with a cardioid handheld: its front on the speaking mouth, close — re-aim for every turn; pointed between two people, it serves neither.',
      locLav: 'Ideas to try with a lav on the guest: with their agreement, clipped over the middle of the chest, clear of rubbing fabric — on its own channel.',
    },
    note: 'Clearance comes first: nothing touches a face, the flag stays out of the lens, the arm stays relaxed, and nobody stands in the road.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic in an interview, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every voice, street and wind is different.',
      separate: 'Distance and the angle off the mouth’s axis are separate variables: change one at a time, with real questions and answers each time. Distances are measured to the mic’s FRONT and rounded to about 5 mm — no millimetre claim is made.',
      clearance: 'Clearance comes first: off the faces, out of the lens, the arm relaxed, the people out of the road.',
      tendencies: 'Closer tends to bring more voice against the street, and more breath, pops and wind; shared between them, an even balance with more of the place. These are tendencies, and places vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'event',
    zone: 'b3.handoffDir',
    typeId: 'bcFlagCard',
    patterns: [
      { id: 'omni', label: 'omni', typeId: 'repOmni' },
      { id: 'cardioid', label: 'cardioid', typeId: 'bcFlagCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'bcFlagSuper' },
    ],
    micNoun: 'An interview handheld',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the speaking mouth.',
    plan: { u0: -800, u1: 3200, v0: -900, v1: 1900 },
    side: { u0: -800, u1: 3200, v0: -1300, v1: 1640 },
    target: 'pa',
    targetWord: 'loudspeaker',
    badgeWhere: 'the loudspeaker where an event often puts it',
    looking: 'The guest at a live event · the local loudspeaker beyond the reporter',
    prompt: 'The loudspeaker stays where the event needs it. Turn or tilt the handheld (AIM), or change its PATTERN, until the loudspeaker sits in the rejection — while the mic still points at the guest’s mouth.',
    activityDone: 'done — the loudspeaker sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind it. Held below the guest’s mouth and aimed up at it, its rear points down and out toward the reporter — where the loudspeaker is decides how much it hears. An omni rejects nothing: held close it may suit the broadcast, and still need another plan for a loud local PA.',
    shieldNote: 'The two people, the camera and the buildings reflect the loudspeaker’s sound too, and the free-field pattern cannot show that. Listen at the actual program, with the event live.',
    learn: {
      ...BASE.context!.learn,
      body: 'At a live event every open mic hears the loudspeaker. A directional pattern helps only when it is aimed so its rejection suits the loudspeaker; closeness to the speaking mouth does more.',
      warn: 'No mic position alone prevents feedback. Never create feedback deliberately — bring an interview mic that feeds a local PA up only to its working level, and pull it down at any ring.',
    },
  },
  twoMic: {
    variant: 'twoMics',
    label: 'A mic each: the reporter’s handheld + the guest’s lav',
    A: { typeId: 'bcFlagCard', pattern: 'cardioid', zone: 'b3.repOwn' },
    B: { typeId: 'locLav', pattern: 'omni', zone: 'b3.guestLav' },
    learn: [
      'A mic each avoids a rushed handoff: the reporter’s handheld at their mouth, a lav on the guest. But each mic also hears the other voice — later and lower — so in the mix one voice arrives twice.',
      'Listen to each channel alone, then both open in MONO. A hollow sound means some pitches cancel: keep each mic close to its own mouth and pull down the one not in use. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats each mouth as one point and both mics as hearing the same sound. Real mics outdoors hear different mixes of voice, wind and street, and people move — read the notch POSITIONS and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the guest',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the two people and the place first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic: a handheld’s grille, a lav’s cap. The reporter’s own mic is measured from the reporter’s lips.',
    clipMount: 'Mount: held in the reporter’s hand, below the flag — or a lav clipped to the guest’s clothing, with their agreement',
    standMount: 'Mount: held — never a stand in a walkway or the road',
    observation: 'For a real interview, in a permitted, safe place, with the guest’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
