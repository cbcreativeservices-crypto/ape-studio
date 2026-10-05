/**
 * A03 FRENCH HORN — the shared pages' horn words (engine/model/copy.ts).
 * Starting-points voice (owner ruling 2026-10-04): no sources, brands or
 * badges. Every number is from french_horn/SOURCES.md or a named drawing
 * default.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const HORN_COPY: Partial<LessonCopy> = {
  variantKey: 'POSTURE',
  variantShort: { back: 'seated' },
  sceneSubject: { back: 'a horn, the player seated, the bell behind the right hip pointing back' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the back', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the back of the stage (x), from under the player’s seat. The bell points back.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). A mic behind the horn often sits low, below the bell.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z). The bell is on the player’s right.' },
  },
  instrument: {
    figureBadge: 'A horn, played seated — the bell behind the player, the right hand in it',
    figureLabel: 'Side view of a seated horn player: the coil in front of the right side of the chest, the mouthpiece at the lips, the rotary valves under the left hand, the bell behind the right hip pointing back with the right hand inside it.',
    partsBadge: 'A horn, played seated · tap a part to name it',
    partsLooking: { side: 'Side view · from the player’s right', top: 'Top view · from above' },
    partsIdle: 'The lips buzz into the mouthpiece; the air in the long coiled tube vibrates; the sound leaves from the bell — which points BEHIND the player. The next page shows how.',
    variantNotes: { back: 'The horn is the brass instrument whose bell points to the rear: what a listener in front hears is shaped by the room behind the player.' },
  },
  placement: {
    workedZone: { back: 'hn.rear' },
    workedLine: 'This starting point also reads how far the mic is from {line}: the dashed line straight out of the bell.',
    workedAim: 'Aim it toward the bell, a little off its axis — the lab counts it while the mic points within about {tol}° of the bell’s centre. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — the bell and the space it rises into in a “bells up” passage, the right hand and arm, the player turning, and the chair. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: 'Behind the bell a mic hears the horn directly — more edge and detail, bigger level swings; in front it hears the horn with the room. Both are recommended places to begin: which suits depends on the room, the music and what else is on stage.',
    typeNotes: {
      smallDynCard: 'Ideas to try with a small dynamic behind the horn: start low, off to the bell’s side, aimed toward the bell; then move one thing at a time — farther, more off axis, lower — and play the soft and the loud passages each time.',
      sdcCard: 'Ideas to try with a small condenser: behind the bell for a direct view, or in front, above or below the horn, for the horn with the room. Compare the two at matched level.',
      lbRibbon: 'Ideas to try with a figure-8 above the horn: aim its front at the horn and turn a SIDE toward what you do not want — a piano, a neighbour. Keep it out of any blast of air, and follow its manual on phantom power.',
      lbLdc: 'Ideas to try with a large condenser below the horn: aim its FACE up at the horn, and compare it with a mic above at matched level — a different balance, not a better one.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, stand or cable anywhere the bell can rise, the right hand can go or the player can turn is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic: behind and beside the bell (measured from the bell), or in front of the player (measured from the horn). They are starting points, not rules — move from there and listen; every horn, player and room is different.',
      separate: 'Distance, height and the angle off the bell’s axis are separate variables: change one at a time, and play the soft phrase and the strongest accent each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand and cable out of the bell’s rise, the right hand’s way into the bell and the player’s turn. The grey hatch appears as the mic comes near one of them.',
      tendencies: 'Closer to the bell’s axis tends to bring more edge and level swings; farther off axis, softer; in front, more of the room. These are tendencies, and horns and rooms vary.',
    },
  },
  context: {
    zone: 'hn.rear',
    typeId: 'smallDynCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'smallDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'smallDynCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'smallDynCard' },
    ],
    micNoun: 'A small dynamic',
    shield: ['lb.bell', 'lb.body', 'lb.hand', 'pl.body'],
    azMax: 70,
    elMax: 45,
    aimBlurb: 'Swing the front up to 70° either way — it still faces toward the bell.',
    plan: { u0: -1700, u1: 1800, v0: -700, v1: 2000 },
    side: { u0: -1700, u1: 1800, v0: -1500, v1: 60 },
    target: 'fill',
    frontIds: ['wedge'],
    targetWord: 'side-fill',
    looking: 'Top view · a mic behind and beside the bell',
    prompt: 'The side-fill behind the horn stays where it is. Turn the MIC (AIM) or change its PATTERN until the fill sits in the rejection — while the mic still faces toward the bell.',
    activityDone: 'done — the side-fill sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). A mic behind the horn faces forward, toward the bell, so its rear points at the back of the stage — where a side-fill or a drum kit may be. The player’s own wedge, in FRONT of the mic, sits where no null can reach.',
    shieldNote: 'Real patterns change with pitch, and the wall behind the player reflects the stage back into the mic — the free-field pattern cannot show that. Test with the full band playing.',
    studioId: 'hn.ctx.studio',
    studioPrompt: 'A studio session, a horn and piano, a good hall: is a mic behind the bell needed at all?',
    studioNote: 'In a good room, a main pair and front spots may carry the horn with its reflection — the sound most listeners know. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: the front view can suit a loud stage too, and a rear spot can help a featured line in a studio.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: hear the horn with the room first; the front view and a main pair carry the reflected sound. Live: decide what the room already gives the audience, and what the PA must add.' },
        { title: 'SPILL AND FEEDBACK', text: 'Behind the horn, a mic sits near whatever is at the back of the stage. Close pickup reduces spill and feedback risk compared with distance — it does not remove them.' },
        { title: 'MOVEMENT', text: 'The bell rises in “bells up” passages, and the player turns. A stand behind the horn needs room for all of it; a clip moves with the bell — if one is made for this horn.' },
        { title: 'MOUNTING', text: 'A general brass clip is not proof it fits a horn. Only a clip its maker confirms for this horn, never on the detachable bell joint, with the player’s agreement — or a stand.' },
      ],
      body: 'With a fill or a kit behind the horn section, a rear mic’s rejection is a tool to aim. Some stage sound in a horn mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    A: { typeId: 'smallDynCard', pattern: 'cardioid', zone: 'hn.rear' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'hn.above' },
    learn: [
      'A common pair: a spot behind the bell for control, and a front mic (or the main pair) for the horn with its room. Each hears the horn at a different time — and the front one hears it after the wall.',
      'When both go in: hear each alone, then the pair in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch, and the reflection adds its own delay.',
    ],
    warn: 'This simplified graph treats the horn as one point and both paths as straight. A real horn reaches a front mic mostly by way of the room, so the delay between the two is not one number. Read the notch POSITIONS as the direct-path picture, treat their depths as illustrative, and judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'hn.prac.gain',
    second: 'hn.prac.3',
    mixed: ['hn.mix.1', 'hn.mix.2', 'hn.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the horn',
    aimRef: 'its reference',
    startIntro: 'This lesson is about putting a microphone on a horn — but first the horn itself: what it is, how the lips and the long coiled tube make its sound, why its bell points backward, and where it sits among the players. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the horn first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The same number measured from another part — the horn’s coil, the player — would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the horn. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: only a clip its maker confirms for this horn, never on the detachable bell joint, with the player’s agreement',
    standMount: 'Mount: a stable stand placed clear of the bell’s rise, the right hand and the player’s turn',
    inPath: 'horn in path',
    facing: 'facing the horn',
    observation: 'For a real horn, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
