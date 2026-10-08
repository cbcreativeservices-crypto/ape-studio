/**
 * B04 BOOM AND CAMERA-MOUNTED PICKUP — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words (shared/voice/
 * voiceCopy.ts) with the lesson's own: a talker standing on camera, a boom
 * just outside the frame, the camera's own mic, a safety lav, the PA live.
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from boom_camera/SOURCES.md, DERIVED from the
 * drawn frame, or a named drawing default (CORRECTIONS_LOG "L7G2").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';
import { SAFETY } from '../shared/broadcast/boomPole.ts';

const INTRO = 'This lesson is about a microphone held near a talker but kept out of the picture — on a boom just outside the frame — and about the mic on the camera itself. First the talker and the shot: where the voice leaves, where the frame ends and the boom can go, what a head turn and a second talker do; then real starting setups drawn round the talker, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a talker on camera',
  startIntro: INTRO,
  worked: { studio: 'b4.above', live: 'b4.above' },
  liveZone: 'b4.above',
  pairA: 'b4.above',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b4.prac.gain', second: 'b4.prac.3', mixed: ['b4.mix.1', 'b4.mix.2', 'b4.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the frame line, the two talkers, and polarity versus delay.' },
  before: [
    { title: 'ASK FOR THE WIDEST FRAME', text: 'Before any mic: ask the camera operator for the widest active frame, every camera angle, the reframes and the moves, and where the light and its shadows fall. Mark the speaking places and the turns. Then choose the closest safe place those allow — and check the picture there.' },
    { title: 'RIGGING AND THE POLE', text: `${SAFETY.overPeople} ${SAFETY.rigged}` },
    { title: 'OUTDOORS', text: `${SAFETY.powerLines} ${SAFETY.weather}` },
    { title: 'LIVE: NEVER PROVOKE FEEDBACK', text: 'A boom at a public event hears the PA too. Check its working position and pattern with the system’s operator at a safe level; bring it up only to its working level, and at any ring pull it down at once and fix the geometry — never raise a level to find feedback.' },
  ],
  studio: {
    id: 'b4.ctx.studio',
    prompt: 'A recorded interview in a quiet studio, no loudspeakers, a close shot. A fair first mic for the talker?',
    note: 'With no PA there is nothing to reject but the room: a boom as close as the frame allows, on its own channel — with a safety lav on its own track if the talker agrees. Switch to LIVE for the PA exercise.',
  },
  contextPoints: [
    { title: 'STUDIO', text: 'No PA: the boom as close as the frame allows; the room and the light are the limits. A compact directional mic may sound smoother than a shotgun among reflections.' },
    { title: 'LIVE', text: 'A boom near a public PA hears it too: its working position and pattern checked with the system’s operator, the fewest open mics.' },
    { title: 'THE CAMERA’S MIC', text: 'It is as far from the talker as the camera: a reference or a backup, not the main voice for a distant talker.' },
    { title: 'TIRED ARMS', text: `${SAFETY.fatigue}` },
  ],
});

export const B04_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'SHOT',
  variantShort: { close: 'close shot', wide: 'wide shot', live: 'live' },
  sceneSubject: { close: 'a talker standing on camera, a close shot', wide: 'a talker standing on camera, a wide shot', live: 'a talker on a stage on camera, the PA at the corner' },
  viewTag: { side: 'SIDE · FROM THE TALKER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the camera', minus: 'toward the talker', label: 'IN–OUT', blurb: 'Out from the talker toward the camera, or back (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: above them the head and the frame’s top edge.' },
    z: { plus: 'to talker’s right', minus: 'to talker’s left', label: 'ACROSS', blurb: 'Toward the talker’s right or left (z) — the operator stands on their left.' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A talker on camera · every part named',
    figureLabel: 'A talker standing in profile, a camera on a tripod in front, a boom operator outside its frame.',
    partsBadge: 'A talker on camera · tap a part to name it',
    partsLooking: { side: 'Side view · from the talker’s right', top: 'Top view · from above' },
    partsIdle: 'The voice leaves through the mouth — every distance is read from the lips. Around the talker: the camera and its frame, the boom operator, the PA live. Tap any of them.',
    variantNotes: {
      close: 'CLOSE SHOT: the camera 2.2 m in front, head and shoulders. Switch SHOT to see the wide shot or the stage.',
      wide: 'WIDE SHOT: the camera moved back to 3.6 m, to the waist with room round them — the frame’s top is higher.',
      live: 'LIVE: the close shot for the broadcast; the PA at the stage’s front corner faces the audience, but its back and side reach the stage.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A talker on camera, from above.',
    kitLanding: 'Tap anything around the talker. There is nothing to answer yet.',
    kitIdle: 'Everything is either the talker, the picture, the crew, or something a mic can hear.',
    stageA11y: 'A talker on a stage, from above.',
    studioA11y: 'A talker in a studio, from above.',
    stageIdle: 'The PA faces the audience; its back and side reach the stage.',
    studioIdle: 'No loudspeakers: the room and the frame are the limits.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { close: 'b4.above', wide: 'b4.above.wide', live: 'b4.above' },
    workedAim: 'Aim it at the mouth — the lab counts it while the mic points within about {tol}° of the lips. The operator re-aims it as the talker turns.',
    workedClear: 'Clear of the picture and of people: the mic, the pole and any shadow stay outside every frame; the pole and the operator stay clear of the talker, and nothing swings above anyone. Clearance comes first, before any number.',
    reveal: 'Above tends to sound the most natural; below, more chest and floor; beside, more of the room at head height; the camera’s mic, the most room of all. Rooms vary, so “it depends on this room” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      locBoomSg: 'Ideas to try with the short shotgun: as close as the frame allows, aimed at the mouth; then compare a compact directional mic in the same place if the room is reflective.',
      locBoomHyper: 'Ideas to try with a compact hypercardioid: the same place, matched loudness — listen to the reflected speech and the room behind the talker.',
      locBoomFur: 'Ideas to try outdoors: the shotgun in its basket and fur for the wind — it does not keep rain out.',
      camMic: 'Ideas to try with the camera’s mic: a reference track; compare it with the boom at matched loudness, with the camera close and moved back.',
      locLav: 'Ideas to try with a safety lav: centred on the chest, on its own track — compared with the boom, never summed by default.',
    },
    note: 'The picture first: ask for the widest frame and check it at the mic’s exact place. Never swing a mic, a clamp or a cable above people; an overhead rig is set by qualified crew.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic on a talker on camera, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every shot, room and voice is different.',
      separate: 'The side the boom comes from, its distance and its aim are separate variables: change one at a time, with the talker speaking and turning as they really will. Distances are measured to the mic’s front and rounded to about 5 mm — no millimetre claim is made.',
      clearance: 'Clearance comes first: outside every frame, clear of the light’s shadows, the pole and the operator clear of the talker, nothing above anyone’s head.',
      tendencies: 'Closer tends to bring more voice and less room; the shotgun’s narrower pickup higher up does not reach farther; a wider shot means a farther boom. These are tendencies, and rooms vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'live',
    zone: 'b4.above',
    typeId: 'locBoomHyper',
    patterns: [
      { id: 'supercardioid', label: 'short shotgun (drawn as a supercardioid)', typeId: 'locBoomSg' },
      { id: 'hypercardioid', label: 'compact hypercardioid', typeId: 'locBoomHyper' },
    ],
    micNoun: 'A boom mic',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Turn the boom mic up to 60° either way — it still faces the mouth.',
    plan: { u0: -600, u1: 2650, v0: -2400, v1: 900 },
    side: { u0: -600, u1: 2650, v0: -800, v1: 1620 },
    target: 'pa',
    targetWord: 'PA',
    looking: 'The talker on a stage · the PA at the stage’s front corner, on their left',
    prompt: 'The PA stays where the show needs it. Turn or tilt the boom mic (AIM), or change its PATTERN, until the PA sits in its rejection — while it still points at the mouth.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: aimed down at the mouth from above and to the left, a boom mic’s rear points up and out toward that front corner — the PA there falls well off its axis, near the rejection a supercardioid has about 125° round and a hypercardioid about 110°. The aim and the pattern decide how close it comes.',
    shieldNote: 'The talker and the stage reflect the PA’s sound too, and the free-field pattern cannot show that. Check it with the system’s operator at a safe level.',
    learn: {
      ...BASE.context!.learn,
      intro: 'These are scenario-based comparisons, not restrictions: the talker is the same — the room, the shot and the PA change.',
      body: 'Live, a boom hears the PA as well as the talker: its place and its pattern’s rejection are tools to aim — and the fewest open mics do more.',
      warn: 'No mic position alone prevents feedback: the pattern, the open mics, the PA’s place and level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'close',
    label: 'The boom and the safety lav',
    A: { typeId: 'locBoomSg', pattern: 'supercardioid', zone: 'b4.above' },
    B: { typeId: 'locLav', pattern: 'omni', zone: 'b4.lav' },
    learn: [
      'A boom for the program and a lav as a safety track hear the same voice — the lav first, close on the chest, the boom a little later from above. Summed, the voice combs.',
      'Listen to each alone, then any sum in MONO. Choose the intended channel and keep the other on its own track. A polarity switch only tests the idea — it never removes a delay, and a guessed delay lines up only one position.',
    ],
    warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. A boom and a lav hear very different mixes of voice, chest and room — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the talker',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the talker and the frame first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic. A boom’s place is set by the frame: as close as the picture allows.',
    clipMount: 'Mount: a boom pole held by an operator outside the frame (a suspension on its end), the camera’s shoe, or a clip on the clothes',
    standMount: 'Mount: a boom stand rigged and secured by qualified crew',
    observation: 'For a real talker and crew, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
