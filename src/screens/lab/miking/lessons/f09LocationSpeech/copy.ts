/**
 * F09 LOCATION SPEECH — the shared pages' words (engine/model/copy.ts), on
 * the voice family's standing-singer words (shared/voice/voiceCopy.ts) with
 * the lesson's own: the three set-ups (on set, outdoors, live), the worked
 * starting points, the boom + body-mic pair, the "before any mic" points.
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from location_speech/SOURCES.md or a named drawing
 * default (CORRECTIONS_LOG "Lab 6 · group 6").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { SAFETY_WORDS } from '../shared/field/location.ts';

const BASE = standingVoiceCopy({
  what: 'a talker on location',
  startIntro: 'This lesson is about picking up speech on location — on a set, outdoors and live — and the practical sounds of a scene, like keys put down on a counter. First the scene: where the voice leaves, what the camera sees and how the head turns; then real starting setups drawn on the talker, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  worked: { studio: 'loc.boom', live: 'loc.stage' },
  liveZone: 'loc.stage',
  pairA: 'loc.boom',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'loc.prac.gain', second: 'loc.prac.3', mixed: ['loc.mix.1', 'loc.mix.2', 'loc.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the frame line, the head turn, and two mics in mono.' },
  before: [
    { title: 'MAP THE SCENE FIRST', text: 'Before any mic: where the talker stands and moves, where the head turns, what the camera frames, the practical action and when it happens, and what else is there — air conditioning, traffic, hard walls, costume. Change what you can at the source before relying on noise reduction later.' },
    { title: 'ASK BEFORE ANY MIC GOES ON A PERSON', text: 'Ask before touching a performer or attaching anything to clothing or skin; follow the production’s costume and hygiene practice. Keep stands, cables and bodypacks out of foot traffic and out of the performer’s action, secured without snags or pressure.' },
    { title: 'PERMISSION AND PRIVACY', text: 'Confirm the production’s permission and the privacy rules that apply before recording conversations. A mic hidden from the camera is not automatically allowed to record people: never hide a mic to record anyone secretly. Log where each mic was and any limits with the take.' },
    { title: 'OVERHEAD LINES AND WEATHER', text: `${SAFETY_WORDS.powerLine} ${SAFETY_WORDS.lightning}` },
  ],
  studio: {
    id: 'loc.ctx.set',
    prompt: 'On a quiet indoor set, a medium shot, the talker moving between two marks. What is a fair first setup?',
    note: 'On a set there is no wedge to reject: the frame, the head turns and the room decide. A boom just above the frame, aimed at the mouth, with a body mic on its own channel as a second option, is a place to begin. Switch to LIVE for the wedge exercise.',
  },
  contextPoints: [
    { title: 'PERSPECTIVE', text: 'On set or outdoors: a boom as close as the frame allows, a body mic for wide shots or busy blocking, a planted mic for one action — each on its own labelled channel. Live: a close handheld or a well-fitted headset or body mic for a steady speech feed.' },
    { title: 'SPILL AND FEEDBACK', text: 'Live, the audience hears the loudspeakers as it happens: every open mic hears the PA and the room. Keep unused mics closed, put the wedge where the pattern rejects most, and check the stream, the recorder and the local PA as separate paths.' },
    { title: 'MOVEMENT', text: 'Talkers turn and walk. A boom follows the head, turned by its operator; a body mic stays the same distance from the mouth but turns with the chest, not the head; a planted mic covers one place only.' },
    { title: 'THE FRAME', text: 'A wider shot pushes the boom farther from the mouth. When it cannot get close enough for the shot, a body mic often takes over — both can be recorded and the editor chooses.' },
  ],
});

export const F09_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { set: 'set', outdoor: 'outdoors', live: 'stage' },
  sceneSubject: { set: 'a talker at a counter on a set, a camera in front', outdoor: 'a talker outdoors, a power line overhead behind them', live: 'a talker presenting on a stage' },
  viewTag: { side: 'SIDE · FROM THE TALKER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'out from the talker', minus: 'toward the talker', label: 'IN–OUT', blurb: 'Out from the talker toward the camera, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: above them the head and the frame line, below them the chest and the counter.' },
    z: { plus: 'to talker’s right', minus: 'to talker’s left', label: 'ACROSS', blurb: 'Toward the talker’s right or left (z).' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A talker on a set, the camera in front · every part named',
    figureLabel: 'A talker standing at a counter, seen from the right, a camera on a tripod in front.',
    partsBadge: 'A talker on location · tap a part to name it',
    partsLooking: { side: 'Side view · from the talker’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. Around the talker: the camera and its frame, the counter and the keys, the boom operator. Tap any of them.',
    variantNotes: {
      set: 'ON SET: a medium shot from a camera 2.5 m away; the boom stays above the frame; the keys are the practical sound. Switch WHERE to see outdoors or live.',
      outdoor: 'OUTDOORS: the same shot with wind — the boom in a fur windshield — and a power line overhead behind the talker: nothing within 3 m (10 ft) of it.',
      live: 'LIVE: no camera frame to hide from; the audience hears the PA as it happens, and a wedge sits in front of the talker.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A talker on location, from above.',
    kitLanding: 'Tap anything around the talker. There is nothing to answer yet.',
    kitIdle: 'Everything around the talker is either their space, the camera’s frame, or something a mic can hear.',
    stageA11y: 'A talker presenting on a stage, from above.',
    studioA11y: 'A talker on a set, from above.',
    stageIdle: 'A wedge in front of the talker, the PA facing the audience.',
    studioIdle: 'No loudspeakers on a set: the frame, the room and the noise around decide.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { set: 'loc.boom', outdoor: 'loc.boom.out', live: 'loc.stage' },
    workedAim: 'Aim it at the mouth — the lab counts it while the mic points within about {tol}° of the lips. As the talker turns, the operator turns the mic with them.',
    workedClear: 'Clear of the talker and out of the shot: the mic, the pole and their shadows stay above the frame line, and nothing touches the talker. Outdoors, nothing within 3 m (10 ft) of a power line. Clearance comes first, before any number.',
    reveal: 'Closer tends to bring more voice and less room; a wider shot pushes the boom away; a body mic keeps one distance but sounds of the chest and the clothes. Talkers and places vary, so “it depends on this scene” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      locBoomSg: 'Ideas to try with the shotgun on the pole: bring it as close as the frame allows, keep it pointed at the mouth through the whole line, and listen to the head turns — not only where the talker started.',
      locBoomHyper: 'Ideas to try indoors: a short hypercardioid often sounds smoother off its axis among hard walls than a long shotgun — compare the two at the same distance.',
      locBoomFur: 'Ideas to try outdoors: the fur cover on, the pole’s cable secured, the operator’s footsteps quiet — and the pole never near the power line.',
      locLav: 'Ideas to try with a body mic: just above the breastbone, the capsule clear of rubbing fabric, a small cable loop secured — then test a turn, sitting and the arms moving.',
      locPlant: 'Ideas to try with a planted mic: aim it across the action, keep it out of sight and out of reach, and check the whole blocking — it covers one place only.',
      locCam: 'Ideas to try with the camera mic: use it as a reference; compare it with the boom or the body mic at the talker — then move a mic closer rather than raising its gain.',
      vocDynCard: 'Ideas to try with a handheld: coach one steady distance and angle; closer adds low end, farther adds the PA and the room. Keep the grille open.',
      vocDynSuper: 'Ideas to try with a supercardioid: its rear lobe means the wedge goes a little to one side of its rear — check the actual pattern.',
      vocHeadset: 'Ideas to try with a headset: place the capsule where its maker says, near the corner of the mouth and out of the breath; then leave it there.',
    },
    note: 'Clearance comes first: nothing touches the talker, the pole and its shadow stay out of the shot, cables stay out of the walking path, and outdoors nothing comes within 3 m (10 ft) of a power line. Ask before putting anything on a person.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic on location, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: there is no single right answer, and every talker, place and shot is different.',
      separate: 'Distance, height and the angle off the mouth’s axis are separate variables; the frame and the head turn change them during a take. Distances are measured to the mic’s FRONT and rounded to about 5 mm — a shotgun’s capsule sits behind its slotted tube, so no millimetre claim is made.',
      clearance: 'Clearance comes first: out of the shot, clear of the talker and the walking path, and away from power lines.',
      tendencies: 'Closer tends to bring more voice and less room; farther, more room and noise; a body mic, a steady distance with a chest-heavy tone and clothing noise; a planted mic, one place only. These are tendencies, and places vary.',
    },
  },
  context: {
    ...BASE.context!,
    looking: 'The talker live on a stage · the wedge on the floor in front',
    prompt: 'The talker’s wedge stays where they need it. Turn or tilt the MIC (AIM), or change its PATTERN, until the wedge sits in the rejection — while the mic still points at the mouth.',
  },
  twoMic: {
    variant: 'set',
    label: 'Boom + body mic, each on its own channel',
    A: { typeId: 'locBoomSg', pattern: 'supercardioid', zone: 'loc.boom' },
    B: { typeId: 'locLav', pattern: 'omni', zone: 'loc.lav' },
    learn: [
      'A boom and a body mic hear the same voice from different distances and directions: the body mic first, the boom a little later. They are two choices for the editor, each on its own labelled channel — not two sides of a stereo picture.',
      'Listen to each alone, then together in MONO at the levels you would use. A hollow, thin sound means some pitches cancel: favour one channel, change the blend or rebalance — a polarity switch only tests the idea, it never removes a delay.',
    ],
    warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of voice, room and clothes, and the talker moves — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the talker',
    startIntro: 'This lesson is about picking up speech on location — on a set, outdoors and live — and the practical sounds of a scene, like keys put down on a counter. First the scene: where the voice leaves, what the camera sees and how the head turns; then real starting setups drawn on the talker, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the scene first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic. A planted mic is measured from the action it covers.',
    clipMount: 'Mount: on a boom pole held by an operator outside the frame — or, for a body mic, a clip on the clothing above the breastbone',
    standMount: 'Mount: a weighted stand, its base and cable clear of the talker’s feet and the walking path',
    observation: 'For a real scene, with the talker’s agreement and the production’s permission. Write tendencies in words — what you heard, not a promised result.',
  },
};
