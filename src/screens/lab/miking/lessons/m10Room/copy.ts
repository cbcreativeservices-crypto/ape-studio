/**
 * M10 DRUM ROOM MICROPHONES — the pages' words (engine/model/copy.ts) and the
 * words of the lesson's own pages (orient, how the room sounds, the room).
 * Starting points; no sources, brands or names (owner ruling 2026-10-04).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { KitOrientWords } from '../shared/kitPages/PKitOrient';
import type { ArrivalsWords } from '../shared/kitPages/kitSoundSteps';
import { KICK_FRONT } from '../shared/kitScene/kitSceneModel.ts';

export const M10_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { studio: 'studio room', live: 'live stage' },
  sceneSubject: { studio: 'a 5-piece drum kit in a studio live room about 6.5 by 5.4 metres', live: 'a 5-piece drum kit on a stage with monitors and a PA' },
  viewTag: { side: 'SIDE · THE ROOM FROM THE PLAYER’S RIGHT', top: 'TOP · THE ROOM FROM ABOVE' },
  axes: {
    x: { plus: 'out from the kick', minus: 'back toward the kit', label: 'OUT FROM KIT', blurb: 'Out into the room or back toward the kit (x), from the kick’s front head.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y).' },
    z: { plus: 'to the drummer’s right', minus: 'to the drummer’s left', label: 'ACROSS', blurb: 'Across the room (z), from the kick’s axis.' },
    origin: { studio: KICK_FRONT, live: KICK_FRONT },
  },
  instrument: {
    figureBadge: 'The kit in its room — what a room mic hears',
    figureLabel: 'Side view of a studio live room about 6.5 metres long with a 3 metre ceiling: the drum kit near the back wall, the wooden floor, absorber panels on the walls.',
    partsBadge: 'The kit in its room, from the side and from above · tap a part',
    partsLooking: { side: 'Side view · the room from the player’s right', top: 'Top view · the room from above' },
    partsIdle: 'A room mic hears the kit after its parts have begun to blend — and the room answering back. Tap a part of the kit, or switch to LIVE STAGE.',
    variantNotes: { live: 'LIVE STAGE: monitors on the floor and a PA at the front. A distant mic hears them as well as the kit.' },
  },
  setting: {
    kitA11y: '',
    kitLanding: '',
    kitIdle: '',
    leftHanded: 'Left-handed players set the kit up mirrored; a room mic in front of the kit is affected least.',
    stageA11y: '',
    studioA11y: '',
    stageIdle: '',
    studioIdle: '',
    before: [
      { title: 'LISTEN TO THE KIT AND THE ROOM FIRST', text: 'Have the drummer play the real passage — groove, fills, open and closed cymbals, soft notes and loud accents. Walk the space you are allowed to use and listen at more than one height. Note the places that sound clear and useful, and those full of flutter, boom, air handling or other players.' },
      { title: 'DECIDE WHAT THE ROOM IS FOR', text: 'An intimate kit, a natural room, wide ambience, or a separate feed for a recording or broadcast? A room feed is optional — with a poor room, closer mics may serve the kit better, and leaving the room mic out can be the right choice.' },
      { title: 'NOTHING ON THE WALLS', text: 'Floor stands only, clear of exits, walkways, rolling cases and other players. Long booms need a suitable base and counterweight. Fixing a mic to a wall, the ceiling or a grid is for the venue to approve, with qualified people.' },
    ],
  },
  placement: {
    workedZone: { studio: 'rm.front', live: 'rm.front' },
    workedLine: 'This starting point also places the mic relative to {line}: “in front of the kit” is drawn as a range you can see.',
    workedAim: 'Face the mic toward the kit — the lab counts it while it faces back along {head}. Height, distance and aim are separate things to try.',
    workedClear: 'Clear of the kit, the player, the walls, the door and the walkway — floor stands only. Clearance comes first, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Farther out tends to bring more of the room — reflections and decay — and less direct kit; whether that helps depends on this room. “It depends” is a fair answer here.',
    typeNotes: { roomLdc: 'A side-address mic hears out of the face of its body: face it toward the kit.', ohLdc: 'The same large condenser as an overhead, facing down: a counterweighted boom, nothing over the player.' },
    note: 'Clearance comes first: stop the drummer before moving a real mic, keep stands out of exits and walkways, and fix nothing to the walls or the ceiling.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is a place we recommend you begin — most measured from the kick’s front head. They are starting points, not rules: no distance is a “room mic” by itself. Move from there and listen.',
      separate: 'Distance, height and aim are separate variables: change one at a time, and compare at the same listening level so louder does not win. Distances are measured to the mic’s front and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Keep stands and cables clear of the drummer, exits, walkways, cases and other players; give long booms a proper base. The door and its walkway are a keep-clear area: it appears as a mic or stand gets close.',
      tendencies: 'Closer tends to give a clearer kit with little room; farther, more early reflections and decay. A high mic in the cymbals’ line of sight hears more cymbals; low and in front, more kick. Tendencies — this room decides.',
    },
  },
  context: {
    variant: 'live',
    zone: 'rm.front',
    typeId: 'roomLdc',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'roomLdc' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'roomLdc' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'roomLdc' },
    ],
    micNoun: 'A large condenser',
    shield: [],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the face up to 45° either way — it still looks at the kit.',
    plan: { u0: -2500, u1: 4000, v0: -2870, v1: 2540 },
    side: { u0: -2500, u1: 4000, v0: -2710, v1: 330 },
    target: 'paL',
    frontIds: ['fill', 'downstage'],
    targetWord: 'PA',
    looking: 'A room mic in front of the kit, live',
    prompt: 'The PA and the monitors stay where the show needs them. Turn the MIC (AIM) or change its PATTERN until the PA speaker sits in the rejection.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less, least at low frequencies — and the room sends the PA’s sound back from every side. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). The PA sits behind and to one side, so a cardioid’s null does not quite reach it.',
    shieldNote: 'A distant mic hears the room as well as the PA directly: reflections arrive from every side, which no pattern rejects. This is the reasoning, not a prediction.',
    studioId: 'rm.ctx.studio',
    studioPrompt: 'A studio session has no PA to reject. The decision changes: what is this room worth?',
    studioNote: 'In a good room a room signal can become part of the kit’s sound; in a poor one, record it only if it earns its channel. Switch back to LIVE for the PA exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a room mic can serve a show’s recording, and a studio session can do without one.',
      points: [
        { title: 'WHAT THE ROOM FEED IS FOR', text: 'Studio: a mono or stereo room signal can become a big part of the kit’s sound in a good room. Live: a distant room mic hears the PA and the monitors and costs gain before feedback; start with the mics the audience needs.' },
        { title: 'WHERE IT GOES', text: 'Studio: into the recording, kept on its own track for later decisions. Live: often a separate feed for a recording or broadcast, kept out of the PA and the monitor mixes.' },
        { title: 'A SHARED ROOM', text: 'With vocals, amplifiers and other players in the same room, a room mic hears them too: decide whether that ensemble picture is welcome — and do not promise separation later.' },
        { title: 'WHO CHECKS IT', text: 'Studio: compare positions at the same listening level. Live: the system operator checks the real routing and margin at show level — never by provoking feedback.' },
      ],
      body: 'On a stage the PA and the monitors stay where the show needs them: you turn the mic or choose its pattern so that a null faces the loudest unwanted source. Monitors on the kit’s side are in front of a room mic facing the kit, where no null reaches.',
      warn: 'Do not assume a room mic can be turned up safely in the PA. Never create feedback deliberately — not as an exercise, not to find a frequency.',
    },
  },
  twoMic: {
    variant: 'studio',
    A: { typeId: 'ohLdc', pattern: 'cardioid', zone: 'rm.over' },
    B: { typeId: 'roomPencil', pattern: 'omni', zone: 'rm.trialA' },
    learn: [
      'A room mic hears the kit LATER than the overheads and the close mics — milliseconds later, set by the extra distance. That delay, and the room’s answer that follows it, is what a room mic is for.',
      'So do not automatically slide the room track into line with the snare or the kick: it changes the very relationship that made the room mic worth having, and the rest of the kit with it. Treat alignment as a creative option, tried only after hearing the whole kit, with the original position written down. Bring the room channel up at the level you will use it, in stereo and in mono.',
    ],
    warn: 'This graph is a simplified picture: one point source, straight paths, no room. A real room adds reflections that arrive later still, from every side, so the comb you hear is blurred by them. Notch positions follow from the arrival-time difference; read the depths as illustrative. A polarity switch flips the sign — it does not remove the delay.',
  },
  practice: {
    gain: 'rm.prac.gain',
    second: 'rm.prac.3',
    mixed: ['rm.mix.1', 'rm.mix.2', 'rm.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what sets an arrival, what a null can do, and whether to align.',
  },
};

export const M10_ORIENT: KitOrientWords = {
  start: 'This lesson is about room microphones — mics that hear the kit after its parts have begun to blend in the space, and the room answering back. First the kit in its room: what a room mic is for, how the room answers a stroke, and where things sit. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  newPath: 'Good — NEXT takes you through the kit and the room first. You can change how you started here at any time.',
  partsPrompt: 'Tap any part of the kit — or step through PART. Switch WHERE to see the stage. There is nothing to answer on this page.',
};

export const M10_ARRIVALS: ArrivalsWords = {
  title: 'Near and far',
  badge: 'Straight paths at 20 °C (343 m/s, about 34 cm per millisecond) · no room yet · silent',
  prompt: 'Drag TIME from 0. Then change the POINT, from close to far: how much later does the kit arrive?',
  looking: 'One listening point, three sources',
  note: 'The farther the point, the later every part of the kit arrives — 5 m is about 15 ms. A room mic is late by design: that delay is part of the room sound it brings.',
  arrived: 'arrived at',
  pending: 'arrives at',
};

export const M10_ECHOES: ArrivalsWords = {
  title: 'The room answers',
  badge: 'Each reflection drawn from the source’s mirror image behind the surface · straight paths at 20 °C · one bounce each · silent',
  prompt: 'Drag TIME past the direct sound and keep going: the floor, the walls and the ceiling answer one after another. Change the POINT.',
  looking: 'The snare’s direct sound and its first reflections',
  note: 'Each surface sends the sound back as if from a mirror image of the snare behind it. The direct sound comes first, then the nearest surfaces, then the rest — and after many bounces, the decay. Farther from the kit, the reflections arrive closer behind the direct sound and matter more.',
  arrived: 'arrived at',
  pending: 'arrives at',
};
