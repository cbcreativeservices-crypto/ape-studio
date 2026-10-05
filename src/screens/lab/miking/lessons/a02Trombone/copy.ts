/**
 * A02 TROMBONE AND BASS TROMBONE — the shared pages' words (engine/model/
 * copy.ts). Starting-points voice (owner ruling 2026-10-04): no sources,
 * brands or badges. Every number is from trombone/ or bass_trombone/
 * SOURCES.md, DERIVED from them (the slide positions), or a named drawing
 * default (CORRECTIONS_LOG A2-…).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const A02_COPY: Partial<LessonCopy> = {
  variantKey: 'TROMBONE',
  variantShort: { tenor: 'tenor trombone', bass: 'bass trombone' },
  sceneSubject: { tenor: 'a tenor trombone played standing, the slide at 1st position', bass: 'a bass trombone played standing, the slide at 1st position' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Out along the bell toward the audience, or back toward the player (x). Distances are read from the bell rim’s centre.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The slide runs below the bell.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left (the bell’s side) or right (the slide’s side) (z).' },
  },
  instrument: {
    figureBadge: 'The tenor and the bass trombone, seen at an angle · every part named',
    figureLabel: 'A tenor trombone and a bass trombone.',
    partsBadge: 'A trombone played standing · tap a part to name it',
    partsLooking: { side: 'Side view · from the player’s right', top: 'Top view · from above' },
    partsIdle: 'The lips buzz in the mouthpiece; the slide changes the tube’s length; the bell sends the sound out — the next page shows how. The slide is drawn closed: at 7th position it reaches about 56 cm farther out.',
    variantNotes: { bass: 'BASS: the same tube length, a wider bore and a larger bell — and two valves in the bell section, worked by the left thumb, for the lowest notes. Switch TROMBONE to see the tenor.' },
  },
  placement: {
    workedZone: { tenor: 'tb.off', bass: 'tb.off' },
    workedLine: 'This starting point also reads how far the mic is off {line}: the dashed line straight out of the bell.',
    workedAim: 'Aim it across the bell — the lab counts it while the mic points within about {tol}° of the bell. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of every part — and above all the slide’s whole path out to 7th position, with a comfortable buffer: the mic, the boom AND the stand. A mic straight in front of the bell looks reasonable, but its stand drops through the slide’s path. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: { tenor: 'Stopped: that would put the mic or its stand in the slide’s path. Try above the slide, or out to the bell’s side.', bass: 'Stopped: that would put the mic or its stand in the slide’s path. Try above the slide, or out to the bell’s side.' },
    reveal: 'Toward the bell’s axis tends to bring more bite and edge; farther off, a softer top; farther away, more room and section. Horns, players and rooms vary, so “it depends on this horn” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      instDynCard: 'Ideas to try with a dynamic: begin above or beside the slide, aimed across the bell, then move one thing at a time — the angle toward or away from the axis, then the distance — and recheck the slide’s reach after every move.',
      sdcCard: 'Ideas to try with a condenser: check it can take the horn’s peaks (or use a pad its maker allows); farther away it can carry the room and the section as well as the horn.',
      brClip: 'Ideas to try with a bell clip: on the bell rim, never the slide; then change only the capsule’s angle — between the bell’s centre and its edge — and route the cable clear of the slide and the hands.',
    },
    note: 'Clearance comes first: stop the player before moving a real mic. A mic, stand or cable anywhere the slide, a mute, the hands or the player can reach is in the wrong place, whatever the number says.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the bell rim’s centre. They are starting points, not rules. Move from there and listen: there is no single right answer, and every horn, player and room is different.',
      separate: 'Distance and the angle off the bell’s axis are separate variables: change one at a time, and play the full phrase — the lowest notes, the strongest accents, the full slide reach and every mute — each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, boom, stand and cable out of the slide’s whole path to 7th position with a comfortable buffer, out of the mutes’ path, the hands and any valve triggers. No distance number is a safe slide clearance — watch the real player.',
      tendencies: 'Toward the axis tends to sound brighter and more defined; off to one side, softer; farther, more room and section. A directional mic close up also lifts the lows (proximity effect). These are tendencies, and horns vary.',
    },
  },
  context: {
    variant: 'tenor',
    zone: 'tb.off',
    typeId: 'instDynCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'instDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'instDynCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'instDynCard' },
    ],
    micNoun: 'A dynamic',
    shield: ['br.bell', 'br.bell1', 'br.bell2'],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the bell.',
    plan: { u0: -900, u1: 2200, v0: -1400, v1: 1400 },
    side: { u0: -900, u1: 2200, v0: -900, v1: 1780 },
    target: 'wedge',
    frontIds: [],
    targetWord: 'wedge',
    looking: 'Top view · mic beside the bell, clear of the slide',
    prompt: 'The player’s wedge stays where they need it — beyond the slide’s reach. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the bell.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — and a trombone’s lows are strong. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). A mic beside the bell, aimed across it, has its rear toward the audience side — the wedge, down on the floor in front, sits below and to the side of that line, so tilting the mic matters as much as turning it.',
    shieldNote: 'The bell and the player reflect stage sound too, and the free-field pattern cannot show that. Listen with the monitors on.',
    studioId: 'tb.ctx.studio',
    studioPrompt: 'A studio overdub, one trombone, a large and good-sounding room: what is a fair plan?',
    studioNote: 'In the studio, a safe main mic beside the slide’s path carries the horn; in a large, good room a mic about 3 m away can add scale — check each alone and the pair in mono. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: the horn is the same — the room, the band and the monitors change.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a balanced main mic, and in a large good room a view about 3 m away. Live: a closer directional mic or a bell clip for control against the band.' },
        { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the section. Live: monitors, the PA, the drums. Aim the pattern’s rejection; the trombone’s lows spread all round, so every open mic hears them.' },
        { title: 'THE SLIDE', text: 'Whatever the context, the slide’s path to 7th is a keep-out — for the stand, the boom and the cable as much as the mic.' },
        { title: 'LOW END ON STAGE', text: 'Subs and risers shake a stand mic. Tell that rumble from the horn’s real lows before filtering — and check the lowest notes of the part after any filter.' },
      ],
      body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in a trombone mic is normal; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'tenor',
    A: { typeId: 'instDynCard', pattern: 'cardioid', zone: 'tb.off' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'tb.far' },
    learn: [
      'A second mic — a farther view in a good room, or the section’s mic — is a choice for a reason, not a requirement: get one safe, reliable main mic first.',
      'When it goes in: hear each mic alone, then the pair in MONO at the intended levels — listen to the lowest notes especially. Move or rebalance a mic first; check both polarity states at matched levels only after that.',
    ],
    warn: 'This simplified graph treats the bell as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of horn and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'tb.prac.gain',
    second: 'tb.prac.3',
    mixed: ['tb.mix.1', 'tb.mix.2', 'tb.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: the slide’s reach, a pattern’s null, and polarity versus delay.',
  },
  terms: {
    instrument: 'the trombone',
    aimRef: 'the bell',
    startIntro: 'This lesson is about putting a microphone on a trombone — the tenor, and the bass trombone. First the horn itself: what it is, how the lips, the tube and the slide make its sound, where the sound leaves, and where the player stands — and how far the slide reaches. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the trombone first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'Every starting point here is measured from the centre of the bell’s rim — the place the sound leaves. A number measured from the slide or the mouthpiece would put the mic somewhere else.',
    noAim: 'This starting point gives no aim, so the mic simply faces the bell. Distance, height and angle are still separate things to try.',
    clipMount: 'Mount: a clip made for this bell, on the rim — never on the slide — with the player’s agreement',
    standMount: 'Mount: a weighted stand outside the slide’s whole path, the mutes, the hands and the player',
    inPath: 'horn in path',
    facing: 'facing the bell',
    observation: 'For a real horn, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
