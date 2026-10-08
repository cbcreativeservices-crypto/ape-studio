/**
 * E07 SINGER WITH GUITAR OR PIANO — the shared pages' words (engine/model/
 * copy.ts). Starting-points voice (owner ruling 2026-10-04): no sources,
 * brands or badges. Every number is from singer_with_instrument/SOURCES.md,
 * the Lab 5 register, or a named drawing default (CORRECTIONS_LOG E7-…).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { GUITAR_SC } from './geometry.ts';

const hole = GUITAR_SC.at.hole;

/** The guitar as a source for the vocal mic to reject (the Studio-or-live
 *  page's target): its sound hole, on the top. */
export const GUITAR_SOURCE = { x: hole.x, y: 0, z: 2 };

export const E07_COPY: Partial<LessonCopy> = {
  variantKey: 'WITH',
  variantShort: { guitar: 'guitar', piano: 'grand piano' },
  sceneSubject: { guitar: 'a seated singer with a steel-string guitar, seen from the front', piano: 'a singer at a grand piano, seen from the side' },
  viewTag: { side: 'UPRIGHT VIEW', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'right on the drawing', minus: 'left on the drawing', label: 'LEFT–RIGHT', blurb: 'Left or right across the drawing (x): along the guitar, or along the piano from the keys to the tail.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y).' },
    z: { plus: 'toward you', minus: 'away from you', label: 'NEAR–FAR', blurb: 'Toward you or away from you in the upright view (z): out toward the audience from the guitar, or across the piano toward its treble side.' },
  },
  instrument: {
    figureBadge: 'A singer with an instrument, drawn to scale · every part named',
    figureLabel: 'A seated singer with a steel-string guitar, seen from the front.',
    partsBadge: 'A singer and an instrument · tap a part to name it',
    partsLooking: { side: 'Upright view · the singer and the instrument', top: 'From above' },
    partsIdle: 'Two sources, one performer: the voice leaves the mouth, the guitar’s or the piano’s sound leaves its top, its sound hole, its strings and its soundboard — and every mic hears both. Tap the mouth, then the instrument’s parts.',
    variantNotes: {
      guitar: 'WITH A GUITAR: the mouth sits about 40 cm above the strings, the guitar in front of the body. Switch WITH to see the singer at a grand piano.',
      piano: 'AT A GRAND PIANO: the singer faces the keys, the strings and the soundboard in front of them under the open lid. Switch WITH to see the guitar.',
    },
  },
  setting: {
    kitA11y: 'A singer with an instrument, from above.',
    kitLanding: 'Tap anything around the singer. There is nothing to answer yet.',
    kitIdle: 'Everything around the performer is either their space or something the mics can hear.',
    leftHanded: '',
    stageA11y: 'On a stage, from above.',
    studioA11y: 'In a studio room, from above.',
    stageIdle: 'A wedge, the PA and the room all reach the mics.',
    studioIdle: 'The room and the headphones; no wedge.',
    before: [
      { title: 'ONE PERFORMANCE OR TWO SOURCES?', text: 'Decide first whether this should sound like one coherent live event — one mic, the balance set in the room — or two sources you can control separately: a vocal mic and an instrument mic, a pickup or a line out. One mic keeps the interaction but cannot be re-balanced later; separate paths give control, and bring bleed and phase with them.' },
      { title: 'HEAR THE WHOLE SONG IN PLACE', text: 'Ask for the complete arrangement — the loudest chorus, the quietest verse, every change of posture, the foot on a pedal — with the performer in the exact place they will play. Listen from where the audience will be. Fix the performer’s geometry and the instrument’s balance first; EQ and compression come last.' },
      { title: 'NOTHING IN THE WAY', text: 'Stands and cables stay clear of the hands, the strumming arm, the neck, the pedals, the bench and the way out; a boom keeps a vocal mic clear of a pianist’s head, hands and music desk. Stop the performer before moving any mic or changing a connection. Open a piano only with its owner’s or the venue’s agreement.' },
    ],
  },
  placement: {
    workedZone: { guitar: 'sg.voice', piano: 'sp.voice' },
    workedLine: 'This starting point also reads how far the mic is off {line}.',
    workedAim: 'Aim the vocal mic at the mouth — the lab counts it while the mic points within about {tol}° of the mouth — and turn its least-sensitive side toward the instrument where it can.',
    workedClear: 'Clear of the performer and the instrument: the mic, its stand and its boom keep off the face, the hands, the strumming arm, the neck, the music desk and the lid. Clearance comes first, before any number.',
    blocked: {},
    reveal: 'Closer to the mouth tends to bring a stronger voice and less instrument; the instrument mic’s distance and angle set how much of the guitar or piano — and of the voice — it hears. Performers and rooms vary, so “it depends” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      vocDynCard: 'Ideas to try with a vocal dynamic: hold a steady distance, then turn the mic until its rear faces the instrument as much as the mouth allows.',
      vocDynSuper: 'Ideas to try with a supercardioid: its least-sensitive directions sit off its rear — aim them at the guitar or the strings.',
      vocLdc: 'Ideas to try with the studio condenser: its screen at least 10 cm in front, the singer’s posture kept steady through the song.',
      sdcCard: 'Ideas to try with a small condenser: 15–30 cm out from the 12th fret or the sound hole — and turn its rear toward the mouth.',
      instDynCard: 'Ideas to try with an instrument dynamic: closer to the guitar than a condenser, its rear toward the mouth.',
      vocLdcOpen: 'Ideas to try with one condenser for both: move it until voice and instrument balance, then ask the performer to keep the posture.',
    },
    note: 'Clearance comes first: stop the performer before moving a real mic, and keep every stand clear of the hands, the arm, the pedals and the bench.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic — the vocal mic measured from the lips, the instrument mic from the point its zone names. They are starting points, not rules: move from there and listen.',
      separate: 'Distance and angle are separate variables for each mic: change one thing at a time, and have the performer play and sing the real song each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. The mics, the stands and the booms keep clear of the face, the hands, the strumming arm, the neck, the pedals, the music desk and the lid.',
      tendencies: 'Each mic hears both sources. A mic closer to its own source, with its rejection toward the other, hears more of its own; the two together, summed, can thin or hollow the sound. These are tendencies — judge the pair in mono.',
    },
  },
  context: {
    variant: 'guitar',
    zone: 'sg.voice',
    typeId: 'vocDynCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'vocDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'vocDynSuper' },
    ],
    micNoun: 'A handheld vocal dynamic',
    shield: [],
    azMax: 60,
    elMax: 60,
    aimBlurb: 'Swing the front up to 60° either way — it still faces the singer.',
    plan: { u0: -500, u1: 1100, v0: -600, v1: 900 },
    side: { u0: -500, u1: 1100, v0: -700, v1: 720 },
    target: 'guitar',
    frontIds: [],
    targetWord: 'guitar',
    looking: 'The singer-guitarist · the vocal mic in front of the mouth, the guitar below it',
    prompt: 'The guitar is right below the vocal mic. Tilt or turn the MIC (AIM), or change its PATTERN, until the guitar sits in the rejection — while the mic still faces the singer.',
    activityDone: 'done — the guitar sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — and the guitar is a large source, not a point. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: the guitar sits almost square below a level vocal mic — about 90° off its front, where a cardioid still hears a good deal. Tilting the mic’s front up turns its rear toward the guitar; a supercardioid’s rejection, off its rear, reaches the guitar with less tilt.',
    shieldNote: 'The singer’s body and the guitar reflect sound too, and the free-field pattern cannot show that. Listen to each mic alone, then the pair in mono.',
    studioId: 'sw.ctx.studio',
    studioPrompt: 'A singer-guitarist in a quiet, good-sounding studio, a song where the interaction matters most. A fair first idea?',
    studioNote: 'In a good room, one coherent mic out in front can capture the performance whole — or a vocal mic and a guitar mic, each with its rejection toward the other, for control. Switch back to LIVE for the null exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: the performer is the same — the room, the stage and what the mix needs change.',
      points: [
        { title: 'ONE MIC OR TWO', text: 'One mic: the performance whole, the room in it, no re-balancing later. Two: control of each source — and bleed, phase and a mono check to manage.' },
        { title: 'SPILL BOTH WAYS', text: 'The vocal mic hears the guitar or piano; the instrument mic hears the voice. Turn each mic’s least-sensitive direction toward the other source — a figure-8’s side null can help, but it is not a guarantee.' },
        { title: 'LIVE: THE MOST STABLE PATH', text: 'A directional vocal mic and the most stable instrument path — a pickup or DI for a guitar, a line out for a keyboard — before a distant instrument mic. A piano’s mics go close or inside the lid.' },
        { title: 'THE MARGIN', text: 'Set the agreed level with a stable margin. At any ring, lower that send at once and change the placement, the angle or the pattern — never raise the level to find feedback.' },
      ],
      body: 'A pattern’s rejection is a tool to aim at the other source. Some bleed is normal with a singer behind an instrument; the question is how much the music can take.',
      warn: 'No mic position alone prevents feedback: the patterns, the open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — bring the level up only to the agreed performance level, and at any ring lower that send at once.',
    },
  },
  twoMic: {
    variant: 'guitar',
    A: { typeId: 'vocDynCard', pattern: 'cardioid', zone: 'sg.voice' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'sg.fret12.guitar' },
    learn: [
      'Here the two mics are on two sources — but each hears both. The guitar mic hears the voice a little later than the vocal mic does; summed, that delayed copy of the voice combs the vocal sound (and the guitar does the same the other way).',
      'So: hear each mic alone, then the pair in MONO at the intended levels. Change the spacing or an angle first, or turn one down; check polarity at matched levels only after that — a polarity switch cannot line up every pitch.',
    ],
    warn: 'This simplified graph treats the chosen source as one point heard by both mics. Read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative — real bleed is quieter than the source it leaks from. Judge by ear, in mono, at matched levels.',
  },
  practice: { gain: 'sw.prac.gain', second: 'sw.prac.3', mixed: ['sw.mix.1', 'sw.mix.2', 'sw.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: spill both ways, a pattern’s null, and polarity versus delay.' },
  terms: {
    instrument: 'the performer',
    aimRef: 'the line to the point it is measured from',
    startIntro: 'This lesson is about miking a singer who plays at the same time — behind an acoustic guitar, or at a grand piano. The performer, the instrument, the room and the monitors form one system: first where each sound comes from, then real starting setups drawn on the performer, then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    startNew: 'Good — NEXT takes you through the voice and the instrument first. You can change how you started here at any time.',
    refTitle: 'MEASURED FROM',
    otherRef: 'The vocal mic is measured from the lips; the instrument mic from the point its zone names — the 12th fret, the sound hole, the strings.',
    noAim: 'This starting point gives no aim, so the mic simply faces its source.',
    clipMount: 'Mount: a clip made for the instrument, only with the owner’s agreement',
    standMount: 'Mount: a stand and boom, kept clear of the hands, the strumming arm, the neck, the pedals and the bench',
    inPath: 'body in path',
    facing: 'facing the singer',
    observation: 'For a real performer, with their agreement, and the performer stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
