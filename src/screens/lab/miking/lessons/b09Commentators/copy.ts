/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: the commentary booth, the open
 * position and the quiet booth, the headset boom, the lip ribbon, the
 * partner, the crowd and the PA. Starting-points voice (owner ruling
 * 2026-10-04): no sources, brands or badges. Every number is from
 * commentators/SOURCES.md or a named drawing default (CORRECTIONS_LOG
 * "L7B-G1").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';

const INTRO = 'This lesson is about putting a microphone on a commentator — in a booth, at an open position in the stadium, and in a quiet booth calling from a screen. First the commentator and the position: where the voice leaves, what following the play does to a mic, and how much of the partner’s voice a mic hears; then real starting setups drawn on the commentator, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a commentator',
  startIntro: INTRO,
  worked: { studio: 'b9.headset', live: 'b9.lip' },
  liveZone: 'b9.lip',
  pairA: 'b9.headset',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b9.prac.gain', second: 'b9.prac.3', mixed: ['b9.mix.1', 'b9.mix.2', 'b9.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the partner in your mic, the routes, and polarity versus delay.' },
  before: [
    { title: 'SURVEY THE POSITION FIRST', text: 'Before any mic: draw who sits where, the sight lines, the desk, the notes and the screen, the windows, the venue’s loudspeakers, the crowd’s direction — and where each voice must go: the program, the recorder, the PA, talkback and the commentator’s own headphones.' },
    { title: 'HEAR A REAL CALL', text: 'Ask for a quiet passage and an excited peak while the commentator follows imaginary play: watch how far the mouth moves, whether the head turns to the partner, and what glasses, a scarf or the notes knock against.' },
    { title: 'A RIBBON NEEDS CARE', text: 'Never blow into a mic to test it. A lip ribbon is passive: check its interface and its phantom-power setting with the audio lead before connecting, and follow the venue’s hygiene rule for a shared lip mic.' },
    { title: 'CABLES AND STRUCTURE', text: 'Secure headset and desk cables away from walkways, doors and windows. Nothing over the playing area, and nothing fixed to the venue’s structure without approval. Have a tested fallback mic before the event starts.' },
  ],
  studio: {
    id: 'b9.ctx.studio',
    prompt: 'Two commentators in a closed booth, headsets on. What is the first thing to set up?',
    note: 'In a closed booth the glass keeps much of the crowd out: a headset boom each, at the mouth corner, on its own channel, is a place to begin. Switch to OPEN for the PA exercise.',
  },
  contextPoints: [
    { title: 'CLOSENESS FIRST', text: 'A close mic keeps the voice ahead of the crowd: a headset boom at the mouth corner, or a lip ribbon against the lip. No pattern makes the crowd vanish.' },
    { title: 'THE PA AND THE CROWD', text: 'At an open position the PA may be louder in the commentary mic than the crowd. A figure-8 hears least at its sides: aim a side at the PA where the voice allows. Never provoke feedback.' },
    { title: 'MOVEMENT', text: 'Commentators follow the play, read down and turn to the partner. A headset turns with the head; a desk-arm mic does not — it suits a quiet booth with a steady caller.' },
    { title: 'THE LOUDEST CALL', text: 'Set gain on the most excited real call, with headroom at every stage. A filter cannot undo an input overloaded by a shout or a blast of air.' },
  ],
});

export const B09_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { booth: 'booth', open: 'open position', studio: 'quiet booth' },
  sceneSubject: { booth: 'two commentators at a desk in a booth', open: 'a commentator at an open position in the stadium', studio: 'a commentator at a desk in a quiet booth' },
  viewTag: { side: 'SIDE · FROM THE COMMENTATOR’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the field', minus: 'toward the commentator', label: 'IN–OUT', blurb: 'Out from the commentator toward the field, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin, the chest and the desk top (45 cm down).' },
    z: { plus: 'toward the analyst', minus: 'away from the analyst', label: 'ACROSS', blurb: 'Toward the commentator’s right — where the analyst sits — or their left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A commentator at the desk · every part named',
    figureLabel: 'A commentator seated at a desk, seen from the right, headphones on, the window to the field in front.',
    partsBadge: 'A commentator at the desk · tap a part to name it',
    partsLooking: { side: 'Side view · from the commentator’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. Around the commentator: the desk, the notes, the screen, the window or the rail, the analyst, the crowd. Tap any of them.',
    variantNotes: {
      booth: 'BOOTH: two commentators side by side, closed-ear headsets with a boom mic, the window to the field in front.',
      open: 'OPEN: nothing between the commentator and the stadium — the crowd in front, the PA cluster high to the front-left. A lip ribbon in the hand.',
      studio: 'QUIET BOOTH: an enclosed booth or a studio calling from a screen; a broadcast dynamic on a desk arm.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A commentator at a desk, from above.',
    kitLanding: 'Tap anything around the commentator. There is nothing to answer yet.',
    kitIdle: 'Everything around the commentator is either their space, the desk, or something a mic can hear.',
    stageA11y: 'A commentator at an open position, from above.',
    studioA11y: 'Two commentators in a booth, from above.',
    stageIdle: 'The crowd in front, the PA high to the front-left: the commentary mic hears both.',
    studioIdle: 'The glass keeps much of the crowd out; the analyst is the main other voice a mic hears.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { booth: 'b9.headset', open: 'b9.headset', studio: 'b9.headset' },
    workedAim: 'Aim it at the mouth — the lab counts it while the mic points within about {tol}° of the lips.',
    workedClear: 'Clear of the commentator: the capsule beside the mouth, out of the breath, never touching the face; the cable clear of glasses, a scarf and the notes. Clearance comes first, before any number.',
    reveal: 'Closer tends to bring more breath, pops and low end and less of the crowd; beside the mouth, fewer pops; farther, more of the stadium and the partner. Voices and positions vary, so “it depends on this commentator” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      bcHeadsetBoom: 'Ideas to try with the headset boom: fit the headset first, then bring the capsule to the outside corner of the mouth, just out of the breath; listen on an excited call, then a turn to the partner.',
      bcHeadsetSuper: 'Ideas to try with a supercardioid headset: its small rear lobe means the partner or a loudspeaker straight behind it is not in its quietest direction — check the actual pattern.',
      bcLipRibbon: 'Ideas to try with the lip ribbon: let the guard rest on the upper lip, the same way every time; listen to the rear and the sides with the venue live.',
      bcDynArm: 'Ideas to try with the desk-arm mic: about 10 cm from the lips, just off the breath; then have the commentator follow real play and listen as the head turns.',
    },
    note: 'Clearance comes first: nothing touches the face, the boom clears glasses and the notes, and every cable is secured away from walkways and windows.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic on a commentator, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every voice, booth and stadium is different.',
      separate: 'Distance and the angle off the mouth’s axis are separate variables: change one at a time, with the commentator calling real play each time. Distances are measured to the mic’s FRONT — a headset capsule’s foam, a lip ribbon’s guard — and rounded to about 5 mm; no millimetre claim is made.',
      clearance: 'Clearance comes first: off the face, out of the breath, clear of glasses, a scarf and the notes.',
      tendencies: 'Closer tends to sound fuller and drier, with more breath and pops (the proximity effect); beside the mouth, softer pops; farther, more crowd and more of the partner. These are tendencies, and voices vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'open',
    zone: 'b9.lip',
    typeId: 'bcLipRibbon',
    patterns: [{ id: 'figure8', label: 'figure-8', typeId: 'bcLipRibbon' }],
    micNoun: 'A lip ribbon',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — the guard still meets the mouth.',
    plan: { u0: -700, u1: 2400, v0: -3400, v1: 900 },
    side: { u0: -700, u1: 2400, v0: -1900, v1: 1260 },
    target: 'pa',
    targetWord: 'PA',
    looking: 'The commentator at the open rail · the PA cluster high to the front-left',
    prompt: 'The PA stays where the venue needs it. Turn or tilt the lip mic (AIM) until the PA sits in the figure-8’s side null — while its front still meets the mouth.',
    activityDone: 'done — the PA sat in the side null by your aim',
    cardioidReveal: 'What you just saw: a figure-8 hears its front and its back equally and least at its sides, 90° off. Held to the mouth, its back faces out over the crowd — so the crowd is NOT rejected; the PA can be put in a side null by turning the mic a little.',
    shieldNote: 'The stadium’s reflections, the desk and the commentator reflect the PA’s sound too, and the free-field pattern cannot show that. Listen with the venue live, at the agreed level.',
    learn: {
      ...BASE.context!.learn,
      body: 'At an open position the PA and the crowd reach every commentary mic. A pattern’s null is a tool to aim; a close mic does more.',
      warn: 'No mic position alone prevents feedback where the commentary feeds the PA: the pattern, the open mics, the PA’s place and level and the stadium all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'booth',
    label: 'Two commentators, a headset each',
    A: { typeId: 'bcHeadsetBoom', pattern: 'cardioid', zone: 'b9.headset' },
    B: { typeId: 'bcHeadsetBoom', pattern: 'cardioid', zone: 'b9.analyst' },
    learn: [
      'Each commentator has their own mic, but each mic also hears the other — later and much lower. In the mix, one voice arrives twice: through its own mic first, through the partner’s a little later.',
      'Listen to each channel alone while the other speaks, then both open in MONO. A hollow, thin sound means some pitches cancel: set both booms close, check which side each boom sits, or pull down the mic of whoever is not speaking. A polarity switch only tests the idea — it never removes a delay.',
    ],
    warn: 'This simplified graph treats each mouth as one point and both mics as hearing the same sound. Real mics in a real booth hear different mixes of voice and room, and commentators move — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the commentator',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the commentator and the position first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic: a headset capsule’s foam, a lip ribbon’s guard, a broadcast dynamic’s windscreen.',
    clipMount: 'Mount: a headset boom from over the ear — or a mic held in the hand, or a desk arm clamped within its rating',
    standMount: 'Mount: a desk arm clear of the screen and the notes',
    observation: 'For a real commentator, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
