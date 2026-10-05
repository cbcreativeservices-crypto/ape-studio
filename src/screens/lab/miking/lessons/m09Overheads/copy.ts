/**
 * M09 DRUM OVERHEADS — the pages' words (engine/model/copy.ts) and the words
 * of the lesson's own pages (orient, how it sounds, two overheads). Owner
 * ruling 2026-10-04: starting points; no sources, brands, badges or names of
 * people. Walked by test/mikingKitLessons.test.ts.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { KitOrientWords } from '../shared/kitPages/PKitOrient';
import type { ArrivalsWords, ShapesWords, StrikeWords } from '../shared/kitPages/kitSoundSteps';
import { S0 } from '../shared/kitScene/kitSceneModel.ts';

export const M09_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { studio: 'studio', live: 'live stage' },
  sceneSubject: { studio: 'a 5-piece drum kit in a studio, seen for its overheads', live: 'a 5-piece drum kit on a stage, seen for its overheads' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the drummer', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the drummer (x), from the snare’s centre.' },
    y: { plus: 'below the snare', minus: 'above the snare', label: 'HEIGHT', blurb: 'Up or down (y), from the snare head.' },
    z: { plus: 'to the drummer’s right', minus: 'to the drummer’s left', label: 'ACROSS', blurb: 'Toward the drummer’s left or right (z), from the snare’s centre.' },
    origin: { studio: S0, live: S0 },
  },
  instrument: {
    figureBadge: 'A 5-piece kit from the player’s right — what the overheads hear',
    figureLabel: 'Side view of a 5-piece drum kit: the hi-hat and the crash on the left, the snare, the rack toms over the kick, the floor tom and the ride on the right, the drummer’s keep-out hatched.',
    partsBadge: 'The kit from the side and from above · a typical right-handed layout · tap a part',
    partsLooking: { side: 'Side view · from the player’s right', top: 'Top view · from above' },
    partsIdle: 'Above the kit the cymbals are closest, the snare is the usual reference and the kick is farthest away. Tap a part to see what it means for an overhead.',
    variantNotes: { live: 'LIVE STAGE: the same kit with monitors on the floor and a PA facing the audience. The studio-or-live page shows what that changes for the overheads.' },
  },
  setting: {
    kitA11y: 'The drum kit from above: the kick in the middle, the snare and hi-hat to the player’s left, the floor tom and ride to the right, the rack toms over the kick and the crashes above them; the snare is ringed as the overheads’ reference.',
    kitLanding: 'Tap anything on the kit — or step through ITEM — to see what it means for an overhead. There is nothing to answer yet.',
    kitIdle: 'Overheads hear the whole kit at once. The cymbals hang closest to them; the snare is the usual reference; the drummer’s head and sticks are the space to keep clear.',
    leftHanded: 'Left-handed players set the kit up mirrored — the hi-hat on the right, the floor tom (and the floor-tom side mic) on the left.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill monitor beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s own fill beside the throne, and another player’s wedge downstage. Overheads point down at the kit — and the stage is below them too.',
    studioIdle: 'No monitors. The room is part of what overheads hear: higher and wider tends to bring in more of it.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Have the drummer play grooves and fills at the level of the show — every cymbal, the hi-hat foot, snare accents and tom fills. Listen to the balance in the room. Then decide what the overheads are for: the main picture of the kit, mostly the cymbals, or something between.' },
      { title: 'WORK WITH THE KIT AS IT IS', text: 'The balance between drums and cymbals starts with the player and the kit. Change tuning, cymbals or playing only with the player. A pair cannot rebalance what it already hears together.' },
      { title: 'NOTHING OVER THE PLAYER', text: 'Overheads hang above a moving player. Use stands and counterweights made for the load, the base outside the kit, and keep everything out of the sticks’ reach and the cymbals’ swing. Hanging a mic from a venue’s structure is for the venue’s qualified people to approve.' },
    ],
  },
  placement: {
    workedZone: { studio: 'oh.gj.main', live: 'oh.mono' },
    workedLine: 'This starting point also places the mic relative to {line}: “directly over” is drawn as a range you can see.',
    workedAim: 'Aim the mic at {head} — the lab counts it while its axis lands on the head. Height, position and aim are separate things to try.',
    workedClear: 'Clear of the sticks’ reach, the cymbals’ swing and the ceiling, with the boom stand’s base outside the kit. Clearance comes first, and the drummer stops before a real mic moves.',
    blocked: { studio: ' Move the mic out of the sticks’ reach or the cymbal’s swing — the number is never a reason to crowd the player.', live: ' Move the mic out of the sticks’ reach or the cymbal’s swing — the number is never a reason to crowd the player.' },
    reveal: 'Higher tends to bring in more cymbals and more of the room; lower, more of the drums. Kits and rooms vary, so “it depends” is fair too — check by ear.',
    typeNotes: { ohLdc: 'A side-address mic hears out of the face of its body: aim the face at the kit. It is heavier — counterweight the boom.' },
    note: 'Clearance comes first: stop the drummer before moving a real mic, keep every boom counterweighted, and keep the boom stand’s base outside the kit.',
    availableLead: 'Starting points for this mic',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is a place we recommend you begin, measured from a named reference — the snare head, the floor-tom rim, the snare’s centre. They are starting points, not rules: move from there and listen — there is no single right answer.',
      separate: 'Height, front–back position, aim and the spacing of a pair are separate variables: change one at a time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the end of its grille, so no millimetre claim is made.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep mics, booms and cables out of the sticks’ reach and the cymbals’ swing, with the stand’s base outside the kit. The grey hatching shows roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Raising overheads tends to bring in more cymbals and room; lowering them, more drums. Moving a pair toward the front of the kit brings the cymbals and rack toms closer; toward the back, the snare, the floor tom and the hi-hat. Tendencies to check by ear.',
    },
  },
  context: {
    variant: 'live',
    zone: 'oh.gj.side',
    typeId: 'ohPencil',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'ohPencil' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'ohPencil' },
      { id: 'hypercardioid', label: 'hypercardioid', typeId: 'ohPencil' },
    ],
    micNoun: 'A small condenser',
    shield: [],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the front up to 45° either way — it still looks across the kit.',
    plan: { u0: -1350, u1: 1700, v0: -1050, v1: 1350 },
    side: { u0: -1350, u1: 1700, v0: -1950, v1: 330 },
    target: 'fill',
    frontIds: ['downstage'],
    targetWord: 'monitor',
    looking: 'The floor-tom side mic, live',
    prompt: 'The monitors stay where the stage needs them. Tilt or turn the MIC (AIM), or change its PATTERN, until the drum fill sits in the rejection.',
    activityDone: 'done — the drum fill sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). The drum fill sits below the side mic, so a cardioid’s rear barely reaches it.',
    shieldNote: 'A side mic low beside the kit is one more open mic on stage: it hears the kit, the monitors and the room. Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: 'oh.ctx.studio',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: what is the room worth?',
    studioNote: 'In the studio, repeated trials are practical when the drummer stops. Switch back to LIVE for the monitor exercise.',
    learn: {
      intro: 'These are scenario-based comparisons, not restrictions: a pair can work on a quiet stage, and one overhead can serve a studio.',
      points: [
        { title: 'WHAT THE OVERHEADS ARE FOR', text: 'Studio: often the main picture of the kit, with close mics adding focus. Live: start from what the audience already hears from the kit — overheads may add cymbals or detail, or feed a recording, at the cost of stage spill.' },
        { title: 'MONO OR STEREO', text: 'Studio: choose a width for the music, then check it in mono with the close mics. Live: stereo techniques suit a stereo system; in a mono PA one overhead may be simpler, and a spaced pair summed to mono can colour the kit.' },
        { title: 'POSITION AND PATTERN', text: 'Studio: a higher or wider pair may suit a good room. Live: a closer, directional pickup can leave more gain before feedback — check the actual pattern against the monitors.' },
        { title: 'MECHANICS', text: 'Studio: stop the take to try heights and positions safely. Live: stable stands, secured cables, a repeatable changeover, sightlines and a moving player come first.' },
      ],
      body: 'On a stage the monitors stay where the players need them: you turn a mic or choose its pattern so that a null faces a loud unwanted source. Mics pointing down at the kit have the stage below them; a side mic low beside the kit is another open mic.',
      warn: 'No overhead position alone prevents feedback: the monitors, the PA, gain, the room and every open mic matter. Never create feedback deliberately — not as an exercise, not to find a frequency.',
    },
  },
  twoMic: {
    variant: 'studio',
    A: { typeId: 'ohPencil', pattern: 'cardioid', zone: 'oh.gj.main' },
    B: { typeId: 'ohPencil', pattern: 'cardioid', zone: 'oh.gj.side' },
    learn: [
      'Two overheads hear every source at two different distances, so each sound reaches them at two different times. Matching their distances to the snare’s centre lines up the snare — the usual starting check for the floor-tom method and for a spaced pair. It lines up nothing else: the kick, the toms and the cymbals still arrive at different times.',
      'So listen: each mic alone, both together in mono, then at modest, deliberate pan positions. Bring close mics up one at a time and check again. Flipping polarity is a test to try at matched levels, never a time alignment.',
    ],
    warn: 'This graph is a simplified picture: one point source, straight paths, no room and no cymbal radiation. Notch POSITIONS follow from the arrival-time difference; their depth depends on the two levels, which this model takes from distance and pattern alone — read the depths as illustrative. Judge the pair by ear, in mono.',
  },
  practice: {
    gain: 'oh.prac.gain',
    second: 'oh.prac.3',
    mixed: ['oh.mix.1', 'oh.mix.2', 'oh.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a starting point and its reference, a pattern’s null, and what removes a delay.',
  },
};

/* ── the words of the lesson's own pages ── */

export const M09_ORIENT: KitOrientWords = {
  start: 'This lesson is about overheads — microphones above or just beside the drum kit that hear the whole kit at once. First the kit itself as an overhead hears it: what overheads are for, how the cymbals and drums make and send out their sound, and where everything sits. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  newPath: 'Good — NEXT takes you through the kit first. You can change how you started here at any time.',
  partsPrompt: 'Tap any part — or step through PART — to see what it means for an overhead. There is nothing to answer on this page.',
};

export const M09_STRIKE: StrikeWords = {
  title: 'Strike to sound',
  badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
  looking: 'Side view · a 16 in crash, cut through the stick’s line',
  prompt: 'STEP through the stroke, or PLAY ONCE — it stops at the end. Nothing here makes a sound.',
  stages: [
    { title: 'The stick meets the bow', text: 'The stick strikes the cymbal on its bow — the wide middle between the bell and the edge — for a moment, then leaves.' },
    { title: 'The plate bends', text: 'The thin bronze plate bends under the stick. The felts hold the cymbal at its centre, so the bend spreads out from where the stick landed.' },
    { title: 'It rings and rocks', text: 'Waves run out to the edge and back: the whole plate rings in many shapes at once, the edge moving most. The cymbal also rocks on its felts — the swing a mic and its boom keep clear of.' },
    { title: 'Sound leaves both faces', text: 'The plate pushes air from BOTH faces: up toward the overheads and down toward the drums below. Above the kit, a mic is close to that top face — one reason overheads hear so much cymbal.' },
  ],
  cells: [
    { k: 'STICK', at: ['CONTACT', 'LEAVING', 'OFF', 'OFF'], flex: 1 },
    { k: 'PLATE', at: ['AT REST', 'BENT', 'RINGING', 'RINGING'], flex: 1.1 },
    { k: 'SOUND', at: ['—', '—', 'STARTING', 'BOTH FACES'], flex: 1.2 },
  ],
  reveal: 'The plate radiates from both faces, the top one toward the overheads — and it keeps ringing long after the stick has gone.',
  after: 'Then the cymbal keeps ringing and slowly settles — far longer than a drum. Hit hard, its ringing builds into a wash that a simple plate model does not capture.',
};

export const M09_SHAPES: ShapesWords = {
  title: 'The cymbal’s shapes',
  badge: 'A simplified picture: a flat disc held at its centre · blue + toward you, amber − away · motion drawn larger',
  prompt: 'Step through SHAPE, then move the STICK between bell, bow and edge. Which spot drives the shapes least?',
  notes: [
    'A shape is set moving only as much as the plate moves where the stick lands in that shape. Near the held centre — the bell — these shapes barely move, so a stroke there drives them less; on the bow and toward the edge, much more.',
    'This is a flat disc. A real cymbal is domed, has a bell, is lathed and is thinner at the edge, so its pitches differ — and hit hard, its ringing builds into a wash no simple plate model follows. What carries over is the pattern: still lines across the plate, the edge moving most.',
  ],
  areas: {
    bell: { label: 'BELL', blurb: 'The raised centre, near the felts that hold the cymbal.' },
    bow: { label: 'BOW', blurb: 'The wide middle, where a stick plays a ride’s steady pattern.' },
    edge: { label: 'EDGE', blurb: 'The outer band, where a stick crashes the cymbal.' },
  },
};

export const M09_ARRIVALS: ArrivalsWords = {
  title: 'Who arrives first',
  badge: 'Straight paths at 20 °C (343 m/s, about 34 cm per millisecond) · no room, no level · silent',
  prompt: 'Drag TIME from 0 and watch each stroke’s sound spread. Which reaches the point first? Then change the POINT.',
  looking: 'One listening point, every source at once',
  note: 'One point hears every part of the kit at a different time, set only by the distance. Two mics are two such points — which is why the next pages measure distances to the snare, and why equal snare distance does not make everything equal.',
  arrived: 'arrived at',
  pending: 'arrives at',
};
