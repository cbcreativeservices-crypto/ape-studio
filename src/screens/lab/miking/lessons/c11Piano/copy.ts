/**
 * C11 PIANO — the pages' piano words (engine/model/copy.ts). Starting-points
 * voice (owner ruling 2026-10-04): no sources, brands or badges. Every number
 * is from acoustic_piano/SOURCES.md or a named drawing default.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { GB, UP } from './model.ts';

export const PIANO_COPY: LessonCopy = {
  variantKey: 'PIANO',
  variantShort: { grand: 'grand, full stick', short: 'grand, short stick', baby: 'baby grand', upright: 'upright, top open', uprightFront: 'upright, panel off' },
  sceneSubject: {
    grand: 'a 2.1 m grand piano with its lid on the full stick',
    short: 'a 2.1 m grand piano with its lid on the short stick',
    baby: 'a 1.55 m baby grand with its lid on the full stick',
    upright: 'a 1.32 m upright piano with its top open, 40 cm from the wall',
    uprightFront: 'a 1.32 m upright piano with its top open and its upper front panel off',
  },
  viewTag: { side: 'SIDE · CUT OPEN', top: 'FROM ABOVE' },
  axes: {
    x: { plus: 'toward the tail', minus: 'toward the pianist', label: 'FRONT–BACK', blurb: 'Toward the pianist or away (x). On a grand, away is toward the tail; on an upright, toward the back.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Heights are read from the surface the starting point names — the strings, the top, the case bottom.' },
    z: { plus: 'toward the treble', minus: 'toward the bass', label: 'ACROSS', blurb: 'Toward the bass end (the pianist’s left) or the treble end (right) (z).' },
  },
  instrument: {
    figureBadge: 'A 2.1 m grand from its curved side, that wall cut away so you can see in',
    figureLabel: 'Side view of a grand piano with the curved side cut away: the keys and the pianist at the left, the hammer under the strings, the dampers over them, the iron frame and the soundboard below, the music desk, the lid raised on its stick, the legs and the pedals.',
    partsBadge: 'Tap a part to name it · the dashed amber line is the hammer line',
    partsLooking: { side: 'Side view · the curved side cut away', top: 'From above · the lid drawn see-through' },
    partsIdle: 'The keys throw felt hammers at the strings; the soundboard under them moves the air; the lid shapes where the sound goes. The next page shows how — tap anything here first.',
    variantNotes: {
      short: 'SHORT STICK: the lid is propped low. Less sound is thrown out over the curved side, and there is little room under the lid for a mic and its arm.',
      baby: 'BABY GRAND: the same layout in a shorter case — shorter strings, less room inside, its own balance. Listen; don’t copy a concert grand’s positions blindly.',
      upright: 'UPRIGHT: the strings stand upright with the soundboard at the back, the hammers striking from the pianist’s side. Here it stands 40 cm out from the wall, with its top open.',
      uprightFront: 'PANEL OFF: the upper front panel is taken off — by the owner or a technician, never as a matter of course — so the hammers face you.',
    },
  },
  sound: {
    strikes: [{ id: 'c', label: 'CENTRE', mm: 0, blurb: 'Not used by this lesson.' }],
    strikeDefault: 'c',
    striker: 'HAMMER',
    strikerPhrase: 'the hammer',
    subject: 'One note of the piano, cut open',
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
    kitA11y: 'The piano and the pianist from above, with the music desk, the bench and what sits round them.',
    kitLanding: 'Tap anything around the piano — or step through ITEM — to see what it means for a piano mic. There is nothing to answer yet.',
    kitIdle: 'The pianist sits at the keys; their hands sweep the whole keyboard and their feet work the pedals. Everything else round the piano is either their space or something a mic will hear.',
    leftHanded: '',
    stageA11y: 'The piano on a stage, from above: the pianist’s wedge, a singer’s wedge, other players, and the audience to the right.',
    studioA11y: 'The piano in a studio room, from above: no monitors; a pair of mics just outside the curve.',
    stageIdle: 'On a stage the piano shares the air with monitors, other players and the PA: a closer, more directional pickup and a lower lid help it stand out from the spill.',
    studioIdle: 'In a good room, the piano and the room together can be the sound: a pair outside the curve, or closer mics if the music needs definition.',
    before: [
      { title: 'ASK THE PIANIST AND THE OWNER FIRST', text: 'Ask for the actual piece: low, middle and high passages, soft playing and fortissimo chords, the sustain pedal, staccato. Listen to the key, hammer, pedal, bench and room noises before setting up. The piano’s tuning, voicing and rattles are not things a mic can fix — they belong to a piano technician.' },
      { title: 'THE LID AND THE PANELS ARE THE OWNER’S', text: 'Ask before moving the piano, changing the lid, taking off an upright panel or putting anything inside. The lid goes on its stick by someone who knows the instrument, before any stand goes near it — and never reach under a lid that is not safely propped. Nothing may touch the strings, dampers, hammers, action or the lid’s hardware.' },
    ],
  },
  placement: {
    workedZone: { grand: 'gp.over', short: 'gp.short', baby: 'gp.over', upright: 'up.top', uprightFront: 'up.front' },
    workedLine: 'This starting point also places the mic relative to {line}: the readout says how far behind (or in front of) it the mic is.',
    workedAim: 'Aim it as the starting point says — the lab counts it while the mic faces the way it names. Height, distance from the hammers and angle are separate things to try.',
    workedClear: 'Clear of everything — the strings, the dampers and hammers, the lid and its stick, the pianist’s hands and sight line. Clearance comes first, before any number: set the lid first, then place the mic, and take the mic out before the lid is lowered.',
    blocked: { grand: ' The boom reaches in from the curved side, under the lid.', short: ' Under a short-stick lid there is very little room.', baby: ' The boom reaches in from the curved side, under the lid.', upright: ' The arm comes up out of the top, or round the back.', uprightFront: ' The arm comes up past the open front.' },
    reveal: 'Nearer the hammers tends to bring more attack and mechanism; farther away, a softer attack — and every piano and room is different, so “it depends” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      sdcCard: 'Ideas to try with a small condenser: start in a blue zone, then change one thing at a time — the height, the distance from the hammers, the angle. With the omni capsule, distance changes the room more than the lows.',
      instDynCard: 'Ideas to try with a dynamic: a practical choice on a loud stage. Start close in a blue zone and check the whole keyboard, low to high — a dynamic close to one register can miss the others.',
    },
    note: 'Clearance comes first. Set the lid before placing a mic, keep everything off the strings, dampers, hammers and action, and keep stands out of the pianist’s reach, sight line and pedals.',
    availableLead: 'Starting points for this mic and piano',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic on this piano, measured from the surface it names — the strings, the curved side, the top, the soundboard. They are starting points, not rules: move from there and listen — there is no single right answer, and every piano and room is different.',
      separate: 'Height above the strings, distance back from the hammers and the angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. The lid on its stick by someone who knows the piano, then the stands — never a hand under an unsupported lid. Nothing touches the strings, dampers, hammers or action; nothing rests on the soundboard; magnets, clips or panel removal only with the owner’s agreement. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where the pianist works — leave more room on a real stage.',
      tendencies: 'Nearer the hammers tends to bring more attack and mechanical noise; farther away and higher, more of the whole instrument and the room. Two mics over the bass and treble can widen the picture — and can thin out in mono. These are tendencies; pianos vary.',
    },
  },
  context: {
    variant: 'short',
    zone: 'gp.short',
    typeId: 'instDynCard',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'instDynCard' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'instDynCard' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'instDynCard' },
    ],
    micNoun: 'A piano mic',
    shield: ['gp.rim', 'gp.lid.short', 'gp.strings'],
    azMax: 60,
    elMax: 40,
    aimBlurb: 'Swing the front up to 60° either way — it still looks down into the piano.',
    plan: { u0: -1200, u1: 2400, v0: -1100, v1: 2300 },
    side: { u0: -1200, u1: 2400, v0: -1100, v1: 900 },
    target: 'fill.side',
    frontIds: ['wedge.pianist'],
    targetWord: 'side-fill',
    looking: 'From above · mic under the short-stick lid',
    prompt: 'The side-fill speaker stays where the band needs it. Turn the MIC (AIM) or change its PATTERN until the side-fill sits in the rejection — while the mic still looks down at the strings.',
    activityDone: 'done — the side-fill sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence — and inside the case the lid and rim change the picture too.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Looking down into the piano, its rear points up at the lid — a side-fill out beside the piano sits well off that, so only a pattern with its null off to the side reaches it.',
    shieldNote: 'Lowering the lid changes both the tone and the spill; reduce the level before moving a mic or the lid, then retest the gain before feedback. Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: 'pn.ctx.studio',
    studioPrompt: 'A studio session in a good room: what is the room worth to this piano?',
    studioNote: 'In a quiet room you can step back: a pair outside the curve, the lid on the full stick, listening for the whole instrument. Switch back to LIVE for the wedge exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: an outside pair can be right for a solo recital, and close mics under a low lid can be right for a loud band.',
      points: [
        { title: 'PERSPECTIVE', text: 'Studio: the instrument and the room together — an outside pair, or a pair over the strings for more definition. Live: closer, more directional pickup for separation; the room is already in the audience’s ears.' },
        { title: 'THE LID', text: 'Studio: usually the full stick. Live: the short stick or a closed lid (with low-profile mics inside) for separation and gain before feedback — at the cost of a closer, more percussive sound.' },
        { title: 'MONO AND IMAGE', text: 'A bass/treble pair can sound wide and thin out in mono. A stereo piano need not span hard left and right in a full-band mix; check each mic alone, then the pair, in mono.' },
        { title: 'MOUNTING', text: 'Studio: stands and booms, careful comparisons. Live: secure mounts the owner approves (magnets on the frame, a boundary under the lid), cables clear of the pedals and the bench.' },
      ],
      body: 'A pattern’s rejection is a tool to aim; lowering the lid and moving the wedge change more than any pattern can. With a singer and a piano sharing a room, the vocal spill may decide where the piano mics go — that belongs to the ensembles lab.',
      warn: 'No mic position alone prevents feedback: the pattern, the lid, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency. Turn the level down before moving a mic or the lid.',
    },
  },
  twoMic: {
    variant: 'grand',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'gp.treble' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'gp.bass' },
    learn: [
      'One mic over the treble and one over the bass is a common way to cover the keyboard — and a different technique from a matched stereo pair, so don’t call it one. Splaying the two apart a little reduces their overlap in the middle; moving the low mic back toward the tail tends to give truer bass and less damper noise.',
      'Then listen: each mic alone, the pair in stereo, and the pair in MONO at the same level. Sound from the middle strings reaches the two mics at different times — in mono that comb can hollow the middle out. Moving a mic (or using one mic, or a coincident pair) changes it; the polarity switch does not remove a delay.',
    ],
    warn: 'This simplified graph takes ONE point of the strings as the source; a piano is a large, spread-out source, so read the graph as the reasoning, not a prediction. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, here taken from distance alone. Judge the pair by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'pn.prac.gain',
    second: 'pn.prac.3',
    mixed: ['pn.mix.1', 'pn.mix.2', 'pn.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a reference surface, a pattern’s null, and polarity versus delay.',
  },
  words: {
    intro: 'This lesson is about putting microphones on a piano — a grand, a baby grand or an upright — but first the piano itself: what it is, how it makes its sound, and where it sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
    newNote: 'Good — NEXT takes you through the piano first. You can change how you started here at any time.',
    mount: {
      stand: 'Mount: a stand and boom, reaching in from the open side — kept off the strings, dampers, lid and action',
      clip: 'Mount: an approved clip or holder, with the owner’s agreement — never on the strings or the finish',
    },
    workedHead: 'The distance is measured from {head}. On a piano the strings, the curved side, the top and the soundboard each give a different number for the same spot — so every starting point names its surface.',
    workedNoAim: 'This starting point names no aim, so the mic simply looks at the piano. Height, distance and angle are still separate things to try.',
    facing: 'looking into the piano',
    inPath: 'case in path',
    sheet: 'For a real piano, with the pianist’s and the owner’s agreement, the lid set first and the pianist stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
};

/** The worked zones' instrument (kept beside the copy for the tests). */
export const PIANO_COPY_ANCHORS = { grandHw: GB.hw, uprightHw: UP.hw };
