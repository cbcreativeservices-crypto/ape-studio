/**
 * A04b EUPHONIUM — the shared pages' euphonium words (engine/model/copy.ts).
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from euphonium/SOURCES.md or a named drawing
 * default.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const EUPH_COPY: Partial<LessonCopy> = {
  variantKey: 'BELL',
  variantShort: { up: 'bell up', front: 'bell front' },
  sceneSubject: { up: 'a euphonium, the player seated, the bell pointing up', front: 'a bell-front euphonium, the player seated, the bell facing the front' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the back', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the back (x), from under the player’s seat.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Above an upward bell, a mic hangs from a boom.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z).' },
  },
  instrument: {
    figureBadge: 'A euphonium, played seated — the bell up beside the head',
    figureLabel: 'Side view of a seated euphonium player: the euphonium on the lap, the mouthpiece at the lips, three valves on top and a fourth at the side, the bell rising beside the head.',
    partsBadge: 'A euphonium, played seated · tap a part to name it',
    partsLooking: { side: 'Side view · from the player’s right', top: 'Top view · from above' },
    partsIdle: 'The lips buzz into the mouthpiece; the air in the widening tube vibrates; the sound leaves from the bell. Switch BELL: an upward bell and a front bell need different mic positions.',
    variantNotes: { up: 'Bell up: most concert setups. A mic goes above and to the side of the opening — never lowered into it, and not so close that the bell’s air reaches a ribbon.', front: 'Bell front: a model made for forward projection. Point the stand in the bell’s real direction, and leave the player room to stand.' },
  },
  placement: {
    workedZone: { up: 'eu.above', front: 'eu.sideF' },
    workedLine: 'This starting point also reads how far the mic is from {line}: the dashed line straight out of the bell.',
    workedAim: 'Aim it toward an outer part of the bell, not straight into it. The lab counts it while the mic points within about {tol}° of the bell’s centre.',
    workedClear: 'Clear of every part — the bell’s opening, the player rising or tilting the bell, both valve hands, the slides and the path to stand. Clearance comes first, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Closer tends to bring a tighter, more isolated euphonium with more valve and breath detail; farther brings more of the room and the section. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      smallDynCard: 'Ideas to try with a small dynamic: start a foot or two from the bell, slightly off axis; then change one thing at a time and play a lyrical phrase and a loud, tongued one each time.',
      sdcCard: 'Ideas to try with a small condenser: about two feet above the bell toward its edge for a rounded line; closer and a little more central for articulation.',
      lbRibbon: 'Ideas to try with a ribbon: an upward bell blows air at a mic close over its opening — keep a ribbon farther away and off the axis, and follow its manual on phantom power.',
      lbLdc: 'Ideas to try with a large condenser: aim its FACE toward the bell’s edge. A larger diaphragm is not a promise of a rounder sound.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, boom or cable anywhere the bell can tilt, a valve hand moves or the player stands up is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic and bell',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the bell (or, farther back, from the euphonium). They are starting points, not rules — move from there and listen; every euphonium, player and room is different.',
      separate: 'Distance, height and the angle off the bell’s axis are separate variables: change one at a time, and play a lyrical phrase and a loud, tongued one each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, boom and cable out of the bell’s opening and tilt, both valve hands, the slides and the path to stand. The grey hatch appears as the mic comes near one of them.',
      tendencies: 'Toward the bell’s axis tends to bring more brightness and bite; off axis, softer; farther, more room and section. These are tendencies — there is no fixed “warm” axis or distance.',
    },
  },
  context: {
    variant: 'front',
    zone: 'eu.sideF',
    typeId: 'smallDynCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'smallDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'smallDynCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'smallDynCard' },
    ],
    micNoun: 'A small dynamic',
    shield: ['lb.bell.front', 'lb.body', 'pl.body'],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the bell.',
    plan: { u0: -700, u1: 2300, v0: -1200, v1: 1300 },
    side: { u0: -700, u1: 2300, v0: -1650, v1: 60 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · a mic in front of a front bell',
    prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still faces the bell.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Facing back at a front bell, its rear points at the audience side — a wedge down on the floor in front sits below that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'Real patterns change with pitch, and a mic that sounds good solo may be full of drums once the band plays. Test at performance level, with the full band.',
    studioId: 'eu.ctx.studio',
    studioPrompt: 'A studio session, a lyrical euphonium solo, a good room: is a close mic needed at all?',
    studioNote: 'In a good room, a more distant view can carry the phrase and the size naturally; a controlled spot supplies articulation if the arrangement needs it. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a farther view can suit a quiet hall, and a close mic can suit a dense studio score.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: hear the line with the room first. Live: decide what the euphonium already gives the audience — the section mics may carry it — and what the PA must add.' },
        { title: 'SPILL AND FEEDBACK', text: 'Closer pickup gives a tighter sound and better isolation; farther, a fuller sound with more room and neighbours. Arrange the wedges round the mic’s rejection.' },
        { title: 'MOVEMENT', text: 'The player tilts the bell, may rise to stand, and uses both hands on valves. A stand needs room for all of it; a confirmed clip moves with the bell.' },
        { title: 'MOUNTING', text: 'A clip advertised for trumpet or trombone may not fit a euphonium bell. Only one its maker confirms, with the player’s agreement — or a stand. Never tape on the finish.' },
      ],
      body: 'With a front bell and a wedge in front, a pattern’s rejection is a tool to aim — tilting the mic as well as turning it. Some stage sound in a euphonium mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'up',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'eu.side' },
    B: { typeId: 'sdcCard', pattern: 'omni', zone: 'eu.far' },
    learn: [
      'A common pair: a spot for articulation and a farther mic (or the main pair) for the line in its room. A countermelody may need a little spot focus; a supporting line may not.',
      'When both go in: hear each alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — delay or polarity is not an automatic fix.',
    ],
    warn: 'This simplified graph treats the euphonium as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of bell and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'eu.prac.gain',
    second: 'eu.prac.3',
    mixed: ['eu.mix.1', 'eu.mix.2', 'eu.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the euphonium',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a euphonium — but first the euphonium itself: what it is, how the lips and the widening tube make its round sound, where its bell sends that sound, and where it sits among the players. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the euphonium first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part — the valve block, the player’s face — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the euphonium. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: only a clip its maker confirms for this euphonium bell, with the player’s agreement — never tape on the finish',
    standMount: 'Mount: a secure stand or boom placed clear of the bell’s tilt, both valve hands and the path to stand',
    inPath: 'euphonium in path',
    facing: 'facing the bell',
    observation: 'For a real euphonium, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
