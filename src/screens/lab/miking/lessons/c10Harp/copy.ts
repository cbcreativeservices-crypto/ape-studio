/**
 * C10 HARP — the pages' harp words (engine/model/copy.ts). Starting-points
 * voice (owner ruling 2026-10-04): no sources, brands or badges. Numbers from
 * harp/SOURCES.md or named drawing defaults.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { aimedAt, HP } from './model.ts';

const P = HP.boardAt(0.3);

export const HARP_COPY: LessonCopy = {
  variantKey: 'HARP',
  variantShort: { pedal: 'concert pedal harp', lever: 'lever harp' },
  sceneSubject: { pedal: 'a 1.9 m concert pedal harp with its harpist', lever: 'a smaller lever harp with its harpist' },
  viewTag: { side: 'SIDE · THE STRINGS FACING YOU', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the harpist', label: 'FRONT–BACK', blurb: 'Toward the audience (the pillar side) or toward the harpist (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Distances are read from the surface each starting point names — the soundboard, the crown, the floor.' },
    z: { plus: 'to the harpist’s right', minus: 'to the harpist’s left', label: 'ACROSS', blurb: 'Across the row of strings: to the harpist’s left or right (z).' },
  },
  instrument: {
    figureBadge: 'A concert pedal harp in profile, the strings facing you, the harpist behind it',
    figureLabel: 'Side view of a concert pedal harp: the soundbox leaning back onto the seated harpist’s right shoulder, the strings standing between the soundboard and the curved neck, the pillar at the front with its crown, the base with its pedals.',
    partsBadge: 'Tap a part to name it',
    partsLooking: { side: 'Side view · the strings facing you', top: 'From above · the strings edge-on' },
    partsIdle: 'The harpist plucks the strings; the soundboard down the front of the soundbox moves the air; air also leaves through the holes in its back. The next page shows how — tap anything here first.',
    variantNotes: { lever: 'LEVER HARP: smaller, with levers on the neck instead of pedals — a different scale and balance. Start from the same kinds of position, and listen rather than copy.' },
  },
  sound: {
    strikes: [{ id: 'c', label: 'CENTRE', mm: 0, blurb: 'Not used by this lesson.' }],
    strikeDefault: 'c',
    striker: 'PLUCK',
    strikerPhrase: 'the pluck',
    subject: 'The harp from the side, one string lit',
    looking: {},
    cells: [],
    reveal: '',
    after: '',
    shapesNotes: [],
    coupledSubject: '',
    coupledNote: '',
    silentNote: '',
  },
  setting: {
    kitA11y: 'The harp and the harpist from above, with the music stand and the chair.',
    kitLanding: 'Tap anything around the harp — or step through ITEM — to see what it means for a harp mic. There is nothing to answer yet.',
    kitIdle: 'The harpist sits close behind the harp, reaching round both sides of the strings, with their feet on the pedals. Everything round the harp is either their space or something a mic will hear.',
    leftHanded: '',
    stageA11y: 'The harp on a stage, from above: the harpist’s wedge downstage, other players, and the audience.',
    studioA11y: 'The harp in a studio room, from above: a spaced pair of mics about 2 m away, toward the room’s centre.',
    stageIdle: 'On a stage the harp is quiet beside most instruments: close pickup, careful monitor placement and few open mics help it through.',
    studioIdle: 'In a good room, the harp and the room together can be the sound: a spaced pair about 2 m or more away.',
    before: [
      { title: 'ASK THE HARPIST FIRST', text: 'Ask for the real passages: low bass notes, high strings, sweeping glissandi, quiet plucks, strong accents, pedal or lever changes. Stand where a mic might go and listen. A resonance on one low note may be part of the music, not a fault.' },
      { title: 'THE HARP IS THE OWNER’S', text: 'Nothing touches the harp without the harpist’s and the owner’s agreement: no tape on the finish, nothing forced into a sound hole, no foam pushed in unless they ask for that technique. Stands, feet and cables stay clear of the pedals or levers, the chair, the hands and the harpist’s view — and nothing swings over the harp or the harpist’s head.' },
    ],
  },
  placement: {
    workedZone: { pedal: 'hp.front', lever: 'lv.front' },
    workedLine: 'This starting point also places the mic relative to {line}: the readout says how far to one side of them the mic is.',
    workedAim: 'Aim it as the starting point says — the lab counts it while the mic faces the way it names. Distance, height and angle are separate things to try.',
    workedClear: 'Clear of everything — the strings and the harpist’s hands round them, the pillar, the neck, the pedals and the harpist’s view. Clearance comes first, before any number.',
    blocked: {},
    reveal: 'Closer to the board tends to bring more of one region and of its low resonance; farther away, more of the whole harp and the room — and every harp and room is different, so “it depends” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try with a small condenser: with the omni capsule, step back for the whole harp and the room; with the cardioid, a spot that picks out the harp from its neighbours — closer to the board brings more low end.',
      miniOmni: 'Ideas to try with a miniature: only on an approved holder, at the opening — then compare it with a stand mic before deciding.',
    },
    note: 'Clearance comes first: keep every mic, stand and cable out of the harpist’s reach and view, off the pedals or levers, and never over the harp or the harpist’s head without a secure stand.',
    availableLead: 'Starting points for this mic and harp',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic on this harp, measured from the surface it names — the soundboard, the crown, the floor, a sound hole. They are starting points, not rules: move from there and listen — there is no single right answer.',
      separate: 'Distance from the board, height and angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. The harpist’s hands work both sides of the strings; their feet work the pedals; they look past the neck at the music and the conductor. The grey hatched areas show roughly where to keep clear — leave more room on a real stage.',
      tendencies: 'A close cardioid aimed straight at the middle of the board tends to favour one region and boom; higher and looking down, more of the upper strings; farther away, the whole harp and the room. These are tendencies; harps and rooms vary.',
    },
  },
  context: {
    variant: 'pedal',
    zone: 'hp.front',
    typeId: 'sdcCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
    ],
    micNoun: 'A small condenser',
    shield: ['hp.box', 'hp.pillar'],
    azMax: 45,
    elMax: 40,
    aimBlurb: 'Swing the front up to 45° either way — it still looks at the soundboard.',
    plan: { u0: -1300, u1: 2200, v0: -1500, v1: 1500 },
    side: { u0: -1300, u1: 2200, v0: -2300, v1: 200 },
    target: 'wedge.harp',
    frontIds: ['wedge.other'],
    targetWord: 'wedge',
    looking: 'Side view · the mic in front of the harp',
    prompt: 'The harpist’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still looks at the soundboard.',
    activityDone: 'done — the wedge sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Up at the harp, looking down at the soundboard, its rear points up and out — the wedge on the floor in front arrives from below, about 105° off the axis, nowhere near that rear. A supercardioid or hypercardioid rejects most toward the rear but off the axis, nearer where this wedge sits: aim by the actual pattern, or move the wedge.',
    shieldNote: 'Reduce the level before moving a mic, then retest the gain before feedback. Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: 'hp.ctx.studio',
    studioPrompt: 'A solo harp in a good room: what is the room worth?',
    studioNote: 'In a quiet room, step back: a spaced pair about 2 m or more away, toward the room’s centre, not too low. Switch back to LIVE for the wedge exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a distant pair can be right for a solo recording, and a close spot or a concealed miniature right for a loud stage.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: a spaced pair about 2 m or more from a full-size harp, toward the room’s centre. Live: closer — a spot near the pillar, the front view at about 60 cm, or an approved miniature.' },
        { title: 'IN AN ENSEMBLE', text: 'Set the band’s or orchestra’s main picture first; bring a harp spot up only as far as the music needs — a spot near the pillar can pull the harp forward.' },
        { title: 'TWO SPOTS', text: 'An upper and a lower spot can cover registers one mic misses. They need not be panned apart: much of the harp’s range runs up and down. Check them in mono.' },
        { title: 'MOUNTING', text: 'Live: secure stands, cables relieved so a pull never reaches the harp, and any miniature on a holder the owner approves.' },
      ],
      body: 'A pattern’s rejection is a tool to aim — moving the wedge, fewer open mics and a lower level often do more. A harp with a built-in pickup can be compared with the mic, separately, before blending.',
      warn: 'No mic position alone prevents feedback: the pattern, the monitors, the other open mics, the system level and the room all matter. Never create feedback deliberately. Turn the level down before moving a mic.',
    },
  },
  twoMic: {
    variant: 'pedal',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'hp.pair' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', pose: aimedAt({ x: P[0] + HP.n[0] * 300, y: P[1] + HP.n[1] * 300, z: 300 }, { x: P[0], y: P[1], z: 0 }) },
    learn: [
      'Two spots about 30 cm from the soundboard — one toward its upper half, one lower — can support registers one mic misses. One reported setup brought the upper spot up a little more than the lower (about twice as loud, roughly 6 dB) — a starting point, not a rule.',
      'Then listen: each mic alone, the pair together, and the pair in MONO. Sound from the board reaches the two mics at different times — in mono that can comb. Moving a mic changes the delay; the polarity switch does not.',
    ],
    warn: 'This simplified graph takes ONE point of the board as the source; a harp is a large, spread-out source, so read the graph as the reasoning, not a prediction. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the levels. Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'hp.prac.gain',
    second: 'hp.prac.3',
    mixed: ['hp.mix.1', 'hp.mix.2', 'hp.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference surface, a pattern’s null, and polarity versus delay.',
  },
  words: {
    intro: 'This lesson is about putting microphones on a harp — a concert pedal harp or a smaller lever harp — but first the harp itself: what it is, how it makes its sound, and where it sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    newNote: 'Good — NEXT takes you through the harp first. You can change how you started here at any time.',
    mount: {
      stand: 'Mount: a secure stand, kept out of the harpist’s reach and view, off the pedals — never swung over the harp',
      clip: 'Mount: an approved holder at a sound hole, with the owner’s agreement — nothing forced in, nothing taped to the finish',
    },
    workedHead: 'The distance is measured from {head}. On a harp the soundboard, the crown and the floor each give a different number for the same spot — so every starting point names its surface.',
    workedNoAim: 'This starting point names no aim, so the mic simply looks at the harp. Distance, height and angle are still separate things to try.',
    facing: 'looking at the soundboard',
    inPath: 'harp in path',
    sheet: 'For a real harp, with the harpist’s and the owner’s agreement and the harpist stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};
