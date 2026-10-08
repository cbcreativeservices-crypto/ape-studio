/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: a presenter standing in a studio or
 * at a lectern on a stage, lavaliers on the chest, a headset by the mouth,
 * the cable, the pack, the PA. Starting-points voice (owner ruling
 * 2026-10-04): no sources, brands or badges. Every number is from
 * lavalier_headset/SOURCES.md or a named drawing default (CORRECTIONS_LOG
 * "L7G2").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { SAFETY } from '../shared/broadcast/bodyWorn.ts';

const INTRO = 'This lesson is about microphones a presenter wears — a lavalier clipped to the clothes, one hidden under them, and a headset beside the mouth — in a studio and live at a lectern. First the presenter: where the voice leaves, what a turn of the head does to a mic on the chest and to one on the head, the cable and its loops, and the breath; then real starting setups drawn on the presenter, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a presenter',
  startIntro: INTRO,
  worked: { studio: 'b5.sternum', live: 'b5.headset' },
  liveZone: 'b5.hsCard',
  pairA: 'b5.headset',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b5.prac.gain', second: 'b5.prac.3', mixed: ['b5.mix.1', 'b5.mix.2', 'b5.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the head turn, the loops, and polarity versus delay.' },
  before: [
    { title: 'ASK FIRST — CONSENT AND COMFORT', text: `${SAFETY.consent} ${SAFETY.remove}` },
    { title: 'WARDROBE AND SKIN', text: `${SAFETY.wardrobe} ${SAFETY.skin}` },
    { title: 'THE RIGHT ADAPTER, THE RIGHT INPUT', text: `Use the connector and adapter made for this mic and this transmitter: a plug that fits is not proof of the right wiring, bias or level. ${SAFETY.phantom}` },
    { title: 'LIVE: NEVER PROVOKE FEEDBACK', text: 'Compare the feeds at a safe level with the venue’s operator. Bring each mic up only to its working level, mute the ones not in use, and at the first sign of ringing pull it down at once and fix the geometry — never raise a level to find feedback.' },
  ],
  studio: {
    id: 'b5.ctx.studio',
    prompt: 'A recorded studio interview, no loudspeakers, a close shot. What is a fair first mic for the presenter?',
    note: 'In a quiet studio with no PA there is nothing to reject: a clean, centred lav that fits the picture is a good start — or a headset, a hidden lav or a boom, each for a reason. Switch to LIVE for the PA exercise.',
  },
  contextPoints: [
    { title: 'STUDIO', text: 'No PA: a natural voice, low clothing noise and the picture come first — a visible lav, a hidden one, a headset or a boom can all work.' },
    { title: 'LIVE', text: 'With a PA, a capsule close to the mouth — a headset — keeps the voice ahead of the loudspeakers and the room better than a lav on the chest. It is not a license to raise the PA.' },
    { title: 'ONE VOICE, ONE MIC', text: 'A headset and a lectern mic open on the same voice comb in the sum and cost margin before feedback. Agree who mutes which.' },
    { title: 'THE PATH', text: 'Check the radio along the whole path the presenter walks, the batteries, and what goes to the PA, the stream, the recorder and the earpiece.' },
  ],
});

export const B05_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { studio: 'studio', live: 'live' },
  sceneSubject: { studio: 'a presenter standing in a studio, a camera in front', live: 'a presenter at a lectern on a stage, the PA at the corner' },
  viewTag: { side: 'SIDE · FROM THE PRESENTER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'out from the presenter', minus: 'toward the presenter', label: 'IN–OUT', blurb: 'Out from the presenter along the mouth’s axis, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin, the collar, the chest — where a lav clips.' },
    z: { plus: 'to presenter’s right', minus: 'to presenter’s left', label: 'ACROSS', blurb: 'Toward the presenter’s right or left (z) — a lapel sits off the middle.' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A presenter in a jacket · every part named',
    figureLabel: 'A presenter standing in profile in a jacket and shirt, a bodypack on the belt.',
    partsBadge: 'A presenter · tap a part to name it',
    partsLooking: { side: 'Side view · from the presenter’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. A lav clips to the clothes on the chest; a headset hooks over the ear. Tap the mouth, the chest, the jacket, the pack, the camera or the lectern.',
    variantNotes: {
      studio: 'STUDIO: the presenter standing in front of a camera, a close shot, no loudspeakers. Switch WHERE to see the stage.',
      live: 'LIVE: the presenter at a lectern that has its own gooseneck; the PA at the stage’s front corner faces the audience, but its back and side reach the stage.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A presenter standing, from above.',
    kitLanding: 'Tap anything on or around the presenter. There is nothing to answer yet.',
    kitIdle: 'Everything is either the presenter, what they wear, or something a mic can hear.',
    stageA11y: 'A presenter at a lectern on a stage, from above.',
    studioA11y: 'A presenter in a studio, from above.',
    stageIdle: 'The PA faces the audience; its back and side reach the stage. A lectern mic sits in front.',
    studioIdle: 'No loudspeakers: the room, the clothes and the cable are what a body mic hears besides the voice.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { studio: 'b5.sternum', live: 'b5.headset' },
    workedAim: 'An omni lav’s aim matters little — point it up toward the mouth; the lab counts it while it points within about {tol}° of the lips. A directional one is aimed with care.',
    workedClear: 'Clear of the wearer’s movement: the capsule on a firm edge, off rubbing fabric, hair and jewellery, the cable looped at the clip and secured lower down. The wearer agreed to all of it. Clearance comes first, before any number.',
    reveal: 'On the chest the distance holds as long as the chest does, but a turn of the head moves the mouth away; beside the mouth a headset keeps its distance; under one layer of cloth the top end can dull. People and clothes vary, so “it depends on this presenter” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      locLav: 'Ideas to try with an omni lav: begin in the middle of the chest, then try a lapel or the collar and rehearse turns both ways; compare at matched loudness. If a puff reaches it, turning it upside down in its clip is one trial on some models.',
      lavCard: 'Ideas to try with a directional lav: turn its sensitive end to the mouth, then turn the head — listen for how quickly the voice dulls.',
      vocHeadset: 'Ideas to try with a headset: the capsule where its maker says, beside the corner of the mouth and out of the breath — then leave it there.',
      hsCard: 'Ideas to try with a directional headset: aim it as its maker says, then check where its rear points against the PA and the monitors.',
      bcGoose: 'Ideas to try with the lectern gooseneck: about 25–36 cm from the lips, a little off the mouth’s line — and muted whenever the body mic is live.',
      bcGooseSuper: 'Ideas to try with a supercardioid gooseneck: its rejection is toward the rear, a little to one side — check where the PA sits.',
    },
    note: 'Ask first: the mic goes on a person only with their agreement, and they can take it off. Nothing is taped to skin except with an adhesive made for skin; wardrobe approves any change to the clothes.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic on a presenter, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every voice, garment and room is different.',
      separate: 'The place on the body, the distance and the angle off the mouth’s axis are separate variables: change one at a time, with the presenter speaking, turning and moving as they really will. Distances are measured to the capsule’s front and rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m — no millimetre claim is made.',
      clearance: 'Clearance and comfort come first: the capsule off rubbing fabric, the cable looped and secured, the pack where it cannot fall or press — and the wearer’s agreement throughout.',
      tendencies: 'On the chest: one steady distance, a little chest-heavy, quieter as the head turns. Off the middle (a lapel): one turn quieter than the other. Hidden: duller and noisier with movement. A headset: steady with turns, the closest to the mouth. These are tendencies, and people vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'live',
    zone: 'b5.hsCard',
    typeId: 'hsCard',
    patterns: [{ id: 'cardioid', label: 'cardioid', typeId: 'hsCard' }],
    micNoun: 'A directional headset',
    shield: [],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Turn the capsule up to 45° either way — it still points toward the mouth.',
    plan: { u0: -600, u1: 1900, v0: -800, v1: 1950 },
    side: { u0: -600, u1: 1900, v0: -600, v1: 1620 },
    target: 'pa',
    targetWord: 'PA',
    badgeWhere: 'the PA where a stage often puts it',
    looking: 'The presenter at the lectern · the PA at the stage’s front corner, on their right',
    prompt: 'The PA stays where the show needs it. Turn or tilt the headset’s capsule (AIM) until the PA sits in its rejection — while it still points toward the mouth.',
    activityDone: 'done — the PA sat in the headset’s null by your aim',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind. A directional headset beside the mouth, aimed in at the lips, points its rear out past the cheek — toward the PA on that side. A small turn of the boom decides how close the PA comes to that rejection.',
    shieldNote: 'The head and the body reflect the PA’s sound too, and the free-field pattern cannot show that. Compare it with the venue’s operator at a safe level.',
    learn: {
      ...BASE.context!.learn,
      intro: 'These are scenario-based comparisons, not restrictions: the presenter is the same — the room, the PA and the picture change.',
      body: 'With a PA, the closest capsule keeps the voice ahead of the loudspeakers; a directional headset adds a rejection to aim. The fewest open mics do more than either.',
      warn: 'No mic position alone prevents feedback: the pattern, the open mics, the PA’s place and level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'live',
    label: 'The headset and the lectern mic',
    A: { typeId: 'vocHeadset', pattern: 'omni', zone: 'b5.headset' },
    B: { typeId: 'bcGoose', pattern: 'cardioid', zone: 'b5.lectern' },
    learn: [
      'A presenter at a lectern with a headset on: both mics hear the same voice — the headset first, the lectern a little later. Open together, the sum combs.',
      'Listen to each alone, then together in MONO. A hollow, thin sound means some pitches cancel: mute the one not in use. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. Real mics at different places hear different mixes of voice and room — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the presenter',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the presenter, the cable and the breath first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the capsule. A headset’s place is also read from the corner of the mouth.',
    clipMount: 'Mount: a clip on a firm clothing edge (a lav) or a hook over the ear (a headset) — with the wearer’s agreement',
    standMount: 'Mount: the lectern’s own gooseneck',
    observation: 'For a real presenter, with their agreement and wardrobe’s. Write tendencies in words — what you heard, not a promised result.',
  },
};
