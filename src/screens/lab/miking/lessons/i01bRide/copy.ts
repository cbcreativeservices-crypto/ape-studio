/**
 * I01b RIDE CYMBAL — the pages' words (engine/model/copy.ts) and the
 * family's HOW IT SOUNDS data (`cym`). Starting-points voice (owner ruling
 * 2026-10-04). Numbers: ride_cymbal/SOURCES.md or named drawing defaults.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { CymbalExtra } from '../shared/cymbals/cymbalLesson.ts';
import { bandMid } from '../shared/cymbals/cymbalLesson.ts';
import { CYM_CONTEXT_WORDS, CYM_LINKS, CYM_TWO_WARN, CYM_VIEW_WORDS, CYM_WHERE, cymbalWords, underPatterns } from '../shared/cymbals/cymbalCopy.ts';
import { AB_RIDE } from '../m09Overheads/model.ts';
import { AREAS, BAND, FLOOR, RIDE, RIDE_R, STRIKE, STRIKE_BOW } from './model.ts';

export const RIDE_COPY: Partial<LessonCopy> = {
  variantKey: 'CYMBAL',
  variantShort: { ride: 'the ride' },
  sceneSubject: { ride: 'the 20 in ride on its boom stand, over the floor tom' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x), from the ride’s centre.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y), from the ride. Distances are read from the face of the ride the zone names, square to it.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z), from the ride’s centre.' },
    origin: { ride: RIDE.c },
  },
  instrument: {
    figureBadge: 'The ride from the side, over the floor tom',
    figureLabel: 'Side view of the ride cymbal: a 20 in plate on its boom stand, tilted toward the player, its bell, bow and edge, the swing dashed at the edge, the stick’s tip on the bow; the floor tom below and a crash beside, dimmed.',
    partsBadge: 'Tap a part to name it — the bell, the bow, the edge, the mount',
    partsLooking: { side: 'Side view · the ride on its stand', top: 'Top view · the ride from above' },
    partsIdle: 'Three playing areas: the bell, the bow (the ride area) and the edge (the crash area). Tap any of them — and the felts and stand that let the ride swing.',
    variantNotes: {},
  },
  setting: {
    kitA11y: 'The drum kit from above: the ride on the player’s right, ringed in amber, over the floor tom; the larger crash beside it, the throne behind.',
    kitLanding: 'Tap anything around the ride — or step through ITEM — to see what it means for a ride mic. There is nothing to answer yet.',
    kitIdle: 'The ride hangs over the floor tom on the player’s right, with the larger crash beside it. The player’s right arm reaches out to it all song long.',
    leftHanded: 'Left-handed players set the kit up mirrored — the ride on the left.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s fill beside the throne and another player’s wedge on the audience side. The fill sits close to the ride’s side of the kit.',
    studioIdle: 'No monitors on the floor. An overhead on the ride side often carries the ride and the floor tom together.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Hear the ride played the way the song needs it — time on the bow, accents on the bell, a crash on the edge. Does the music need a ride channel at all, or do the overheads (and the floor-tom mic) already carry it? The ride’s height and tilt are the player’s.' },
      { title: 'WATCH THE WHOLE MOTION', text: 'The right arm reaches out to the ride all song; a crash on the edge makes the ride swing hard on its felts. Watch a full song before you choose a place.' },
    ],
  },
  placement: {
    workedZone: { ride: 'ride.spot' },
    workedLine: 'This starting point also places the mic relative to {line}: over the bow means in from the edge band.',
    workedAim: 'Aim it at the bow — or at the bell for bell accents; the lab counts it while the mic’s axis meets the ride inside its edge band. Height, the spot over the plate and the angle are separate things to try.',
    workedClear: 'Clear of every part — the stick’s side of the ride, the swing, the crash beside it, the ride’s boom and the player’s right arm. Clearance comes first, before any number, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Toward the bell tends to bring a brighter, cutting sound; toward the edge more of the wash — and every ride is different, so “it depends on this ride” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      sdcCard: 'Ideas to try: over the bow, slide the aim from the bow toward the bell, then separately change the height. A foot or two above covers the other cymbals as well — a different job from a spot mic.',
      smallDynCard: 'Ideas to try: a dynamic over the bow, on the side away from the player. Listen for how much of the wash and the floor tom it takes in compared with a condenser.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. The ride swings hardest after a crash on its edge — check the whole motion, not one stroke.',
    availableLead: 'Starting points for this mic on the ride',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the face of the ride it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every ride is different.',
      separate: 'Height above the ride, the spot over the plate (bell, bow or edge) and the angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT, square to the tilted ride, and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand and cable out of the stick’s side of the ride, its swing (hardest after a crash on the edge), the crash beside it, the ride’s own boom and the player’s right arm. The grey hatched areas show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Toward the bell tends to bring a brighter, more cutting sound; toward the edge more of the wash. Higher takes in more of the kit around the ride; underneath, less stick. Tendencies, checked by ear.',
    },
  },
  context: {
    ...CYM_CONTEXT_WORDS,
    variant: 'ride',
    zone: 'ride.under',
    typeId: 'sdcCard',
    patterns: underPatterns('sdcCard'),
    micNoun: 'A small condenser',
    shield: [],
    azMax: 60,
    elMax: 40,
    aimBlurb: 'Swing the front up to 60° either way — it still looks up at the ride.',
    plan: { u0: -1150, u1: 1500, v0: -700, v1: 1250 },
    side: { u0: -1150, u1: 1500, v0: -1150, v1: 360 },
    target: 'fill',
    frontIds: [],
    targetWord: 'monitor',
    looking: 'Top view · the mic under the ride, aimed up',
    prompt: 'The monitors stay where the players need them. Turn the MIC (AIM) or change its PATTERN until the drummer’s fill sits in the rejection — while the mic still looks up at the ride.',
    studioId: 'rd.ctx.studio',
    studioPrompt: 'A studio session: does the ride need its own mic at all?',
    studioNote: 'In the studio, the overheads and the floor-tom mic often carry the ride; a spot adds definition when the music needs it. Repeated trials are practical when the drummer stops. Switch back to LIVE for the monitor exercise.',
  },
  twoMic: {
    variant: 'ride',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'ride.spot' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'ride.under' },
    opposite: {
      surface: 'rideTop',
      note: 'One mic over the ride and one under it face opposite sides of the plate: as it moves up, toward the top mic, it moves away from the bottom one — so the pair starts in opposite polarity, before any arrival-time difference. A simplified picture of the plate’s lowest motion: check both polarity states, no setting is required.',
    },
    learn: [
      'A mic under the ride hears less stick and more of the wash — and its rear faces the floor. A second perspective, kept only if it helps the ride in the whole kit.',
      'The same check applies whenever two mics hear one cymbal — over and under, or a spot and the overheads (or the floor-tom mic below): bring in one channel at a time, compare both polarity states in mono at matched levels, and move or leave out a mic if the ride goes thin. The polarity switch flips the sign; it does not remove a delay.',
    ],
    warn: CYM_TWO_WARN,
  },
  practice: {
    gain: 'rd.prac.gain',
    second: 'rd.prac.3',
    mixed: ['rd.mix.1', 'rd.mix.2', 'rd.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, the floor tom below, and polarity versus delay.',
  },
  where: CYM_WHERE,
  viewWords: CYM_VIEW_WORDS,
  words: cymbalWords('ride'),
};

const FLOOR_MIC = { x: FLOOR.c.x + 60, y: FLOOR.c.y - 50, z: FLOOR.c.z - FLOOR.spec.d.mm / 2 - 10 };

export const RIDE_CYM: CymbalExtra = {
  spec: RIDE.spec,
  profile: 'bow',
  strike: {
    title: 'Strike to sound',
    badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
    looking: 'Side view · the ride cut through the stick’s line',
    prompt: 'STEP through the stroke, or PLAY ONCE — it stops at the end. Nothing here makes a sound.',
    rFrac: STRIKE.bow / RIDE_R,
    stages: [
      { title: 'The tip strikes the bow', text: 'The tip of the stick strikes the bow — the ride area. That brief contact is the “ping”: the ATTACK, and the ride’s definition.' },
      { title: 'The plate bends', text: 'The plate bends under the tip, most near the strike and not at all at the felts, which hold its centre. Drawn many times larger than it really moves.' },
      { title: 'The plate rings and rocks', text: 'Waves run out to the edge and the whole plate rings — struck on the bow it does not open up at once like a crash; the wash builds slowly under the ping. It rocks a little on its felts: the swing a mic keeps clear of.' },
      { title: 'Sound leaves both faces', text: 'Sound leaves the top face, up toward the overheads, and the underside, down toward the floor tom below — the ride reaches a lot of mics on the kit.' },
    ],
    cells: [
      { k: 'PLATE', at: ['STRUCK', 'BENT', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['PING', 'PING', 'PING + WASH', 'UP AND DOWN'], flex: 1.3 },
    ],
    marks: ['1 · TIP ON THE BOW', '2 · THE PLATE BENDS', '3 · RINGS AND ROCKS', '4 · UP, TO THE OVERHEADS', 'AND DOWN, TO THE FLOOR TOM'],
    reveal: 'Struck on the bow, the ride keeps a clear ping over a slowly building wash — and its underside radiates too, down toward the floor tom.',
    after: 'Then the plate keeps ringing — the BODY, the wash. A crash on the edge with the shoulder of the stick opens it up into a much bigger wash, and swings it harder.',
  },
  shapes: {
    title: 'The plate’s shapes',
    badge: 'A simplified picture: one flat disc held at its centre · blue + toward you, amber − away',
    prompt: 'Step through SHAPE, then move the STICK between the bell, the bow and the edge. Which shapes does each spot drive?',
    looking: 'The 20 in ride from above',
    notes: [
      'A shape is set moving only as much as the plate moves under the stick in that shape. The felts hold the centre still, so a stroke on the bell drives most shapes only a little (a few with a still ring move near it) — part of why the bell rings clear and bright — while the edge drives most of them strongly.',
      'A simplified picture: a flat disc of even thickness. A real ride is domed, lathed, hammered and thinner at the edge, and builds its wash in ways this picture does not show — the shapes’ pattern is what it teaches, not their numbers.',
    ],
    areas: [
      { id: 'bell', label: 'BELL', blurb: 'The raised centre: bright, cutting accents.', r: STRIKE.bell },
      { id: 'bow', label: 'BOW', blurb: 'The ride area, played with the tip for time.', r: STRIKE.bow },
      { id: 'edge', label: 'EDGE', blurb: 'The crash area, struck with the shoulder of the stick.', r: STRIKE.edge },
    ],
    defaultArea: 'bow',
  },
  arrivals: {
    title: 'Who hears it',
    badge: 'Straight paths in air at 20 °C · when each sound arrives, not how loud it is',
    prompt: 'Drag TIME after a stroke on the ride and the floor tom. At each POINT, which arrives first — and by how much?',
    looking: 'The ride and the floor tom below it',
    note: 'The spot mic hears the ride first; the floor-tom mic, right underneath, hears the ride a moment after its own drum — often loudly. The overhead on that side hears both. Every mic hears every source at its own time: compare them in mono.',
    arrived: 'arrived after',
    pending: 'arrives after',
    sources: [
      { id: 'ride', label: 'ride', p: STRIKE_BOW, color: '#ffc64d' },
      { id: 'floor', label: 'floor tom', p: FLOOR.c, color: '#6fa8ff' },
    ],
    points: [
      { id: 'spot', label: 'THE RIDE SPOT MIC', short: 'SPOT', p: bandMid(RIDE, BAND.spot, { r: 0.5, h: 0.45 }) },
      { id: 'floorMic', label: 'THE FLOOR-TOM MIC', short: 'FLOOR MIC', p: FLOOR_MIC },
      { id: 'over', label: 'THE OVERHEAD ON THE RIDE SIDE', short: 'OVERHEAD', p: AB_RIDE },
    ],
    box: { side: { u0: -900, u1: 500, v0: -1450, v1: 330 }, top: { u0: -900, u1: 500, v0: -150, v1: 1250 } },
    maxMs: 4,
  },
  bodyTitle: 'WHERE IT GOES',
  bodyNote: 'Up from the top face and down from the underside — onto the floor tom right below it, and into the floor tom’s mic. A ride is heard all over the kit; a close mic adds its definition when the overheads do not.',
  links: [CYM_LINKS.overheads, CYM_LINKS.kit],
};

export const RIDE_EDGE_START = AREAS.edge[0];
