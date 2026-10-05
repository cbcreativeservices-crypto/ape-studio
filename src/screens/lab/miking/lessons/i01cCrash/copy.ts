/**
 * I01c CRASH CYMBAL — the pages' words and the family's HOW IT SOUNDS data.
 * Starting-points voice (owner ruling 2026-10-04). The research gives no
 * distance for a crash: every band here is said as a place to begin.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { CymbalExtra } from '../shared/cymbals/cymbalLesson.ts';
import { bandMid } from '../shared/cymbals/cymbalLesson.ts';
import { CYM_CONTEXT_WORDS, CYM_LINKS, CYM_TWO_WARN, CYM_VIEW_WORDS, CYM_WHERE, cymbalWords, underPatterns } from '../shared/cymbals/cymbalCopy.ts';
import { AB_HAT } from '../m09Overheads/model.ts';
import { BAND, C1, C2, EDGE_FRAC, STRIKE1, TOM1 } from './model.ts';

export const CRASH_COPY: Partial<LessonCopy> = {
  variantKey: 'CRASH',
  variantShort: { crash1: 'the 16 in crash', crash2: 'the 18 in crash' },
  sceneSubject: { crash1: 'the 16 in crash over the 10 in tom', crash2: 'the 18 in crash over the 12 in tom' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x), from the crash’s centre.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y), from the crash. Distances are read from the face of the crash the zone names, square to it.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z), from the crash’s centre.' },
    origin: { crash1: C1.c, crash2: C2.c },
  },
  instrument: {
    figureBadge: 'The 16 in crash from the side, over the 10 in tom',
    figureLabel: 'Side view of a crash cymbal: a 16 in plate on its boom stand, tilted toward the player, its edge, bow and bell, the swing dashed at the edge, the stick’s shoulder on the edge; the toms, the hi-hats and the kick around it, dimmed.',
    partsBadge: 'Switch CRASH for the 16 in or the 18 in · tap a part to name it',
    partsLooking: { side: 'Side view · the crash on its stand', top: 'Top view · the crash from above' },
    partsIdle: 'Most players strike a crash on its edge with a glancing blow. Tap a part — the edge, the bow, the bell, the felts that let it swing.',
    variantNotes: { crash2: '18 in CRASH: larger, a little higher, over the 12 in tom on the player’s right. Same reasoning, different neighbours.' },
  },
  setting: {
    kitA11y: 'The drum kit from above: a crash ringed in amber over a rack tom; the hi-hats, the snare, the ride and the throne around it.',
    kitLanding: 'Tap anything around the crash — or step through ITEM — to see what it means for a crash mic. There is nothing to answer yet.',
    kitIdle: 'The crashes hang high over the rack toms, one on each side. The player reaches up to strike the edge with a glancing blow that follows through.',
    leftHanded: 'Left-handed players set the kit up mirrored — the crashes swap sides with everything else.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s fill beside the throne and another player’s wedge on the audience side. Crashes are loud and spread widely: every open mic on stage hears them.',
    studioIdle: 'No monitors on the floor. The overheads usually carry the crashes first — they hang closest to them.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Hear the crashes at full strength, in the song. Do the overheads already carry them — they usually hang right by them? A crash’s height and angle are the player’s; the mic works round them.' },
      { title: 'WATCH THE WHOLE MOTION', text: 'A crash is struck with a glancing blow that carries the stick on past the edge, and it swings and rocks hard after. Watch the biggest crash in the song before you choose a place.' },
    ],
  },
  placement: {
    workedZone: { crash1: 'c1.top', crash2: 'c2.top' },
    workedLine: 'This starting point also places the mic relative to {line}: over the bow and the edge.',
    workedAim: 'Aim it at the plate — the lab counts it while the mic’s axis meets the crash. On a tilted crash, “above” is measured square to the plate. Height, the spot over the plate and the angle are separate things to try.',
    workedClear: 'Clear of every part — the stick’s side and its follow-through past the edge, the swing after the hardest crash, the other cymbals and the player’s arm. Clearance comes first, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Toward the edge tends to bring more of the crash’s spread; toward the bell a brighter, more focused tone — and every crash is different, so “it depends on this crash” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: above the plate on the far side, change the height first, then the aim from the edge toward the bell. Underneath, aimed up, keep below the swing.',
      smallDynCard: 'Ideas to try: a dynamic above the plate on the far side. Listen for how much of the tom below it takes in.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. A crash swings hardest after the biggest hit, and the stick follows through past the edge — check the whole motion.',
    availableLead: 'Starting points for this mic on the crash',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the face of the crash it names. No one number is published for a crash: these bands are places to begin, not rules — move from there and listen.',
      separate: 'Height above the crash, the spot over the plate and the angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT, square to the tilted plate, and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand and cable out of the stick’s side and its follow-through, the swing (hardest after the biggest crash), the crash’s own boom, the other cymbals and the player’s arm. The grey hatched areas show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Toward the edge tends to bring more of the crash’s spread, toward the bell a more focused tone; underneath, less stick and more wash. A crash that sounds right in the overheads may need no mic at all. Tendencies, checked by ear.',
    },
  },
  context: {
    ...CYM_CONTEXT_WORDS,
    variant: 'crash1',
    zone: 'c1.under',
    typeId: 'sdcCard',
    patterns: underPatterns('sdcCard'),
    micNoun: 'A small condenser',
    shield: [],
    azMax: 60,
    elMax: 40,
    aimBlurb: 'Swing the front up to 60° either way — it still looks up at the crash.',
    plan: { u0: -1150, u1: 1500, v0: -1050, v1: 1000 },
    side: { u0: -1150, u1: 1500, v0: -1300, v1: 360 },
    target: 'fill',
    frontIds: [],
    targetWord: 'monitor',
    looking: 'Top view · the mic under the crash, aimed up',
    prompt: 'The monitors stay where the players need them. Turn the MIC (AIM) or change its PATTERN until the drummer’s fill sits in the rejection — while the mic still looks up at the crash.',
    studioId: 'cr.ctx.studio',
    studioPrompt: 'A studio session: does the crash need its own mic at all?',
    studioNote: 'In the studio, the overheads usually carry the crashes — they hang closest to them. A close mic adds focus only when it helps. Switch back to LIVE for the monitor exercise.',
  },
  twoMic: {
    variant: 'crash1',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'c1.top' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'c1.under' },
    opposite: {
      surface: 'c1Top',
      note: 'One mic over the crash and one under it face opposite sides of the plate: as it moves up, toward the top mic, it moves away from the bottom one — so the pair starts in opposite polarity, before any arrival-time difference. A simplified picture of the plate’s lowest motion: check both polarity states, no setting is required.',
    },
    learn: [
      'A crash reaches every mic on the kit at a different time — the overheads, a close mic, the tom mic below, a vocal mic nearby. Each pair is a two-mic problem: compare in mono, at matched levels.',
      'Bring in one channel at a time, compare both polarity states, and move or leave out a mic if the crash goes thin. The polarity switch flips the sign; it does not remove a delay.',
    ],
    warn: CYM_TWO_WARN,
  },
  practice: {
    gain: 'cr.prac.gain',
    second: 'cr.prac.3',
    mixed: ['cr.mix.1', 'cr.mix.2', 'cr.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a starting point with no number, the tom below, and polarity versus delay.',
  },
  where: CYM_WHERE,
  viewWords: CYM_VIEW_WORDS,
  words: cymbalWords('crash'),
};

const TOM_MIC = { x: TOM1.c.x + 80, y: TOM1.c.y - 60, z: TOM1.c.z - 120 };

export const CRASH_CYM: CymbalExtra = {
  spec: C1.spec,
  specIn: { crash2: C2.spec },
  profile: 'bow',
  strike: {
    title: 'Strike to sound',
    badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
    looking: 'Side view · the crash cut through the stick’s line',
    prompt: 'STEP through the stroke, or PLAY ONCE — it stops at the end. Switch SETUP for the 18 in crash. Nothing here makes a sound.',
    rFrac: EDGE_FRAC,
    stages: [
      { title: 'A glancing blow on the edge', text: 'The shoulder of the stick strikes the edge with a glancing blow — it carries on past rather than stopping on the plate. The crash responds at once: the ATTACK.' },
      { title: 'The plate bends', text: 'The edge bends under the stick, the felts holding the centre. Drawn many times larger than it really moves.' },
      { title: 'It rings and swings', text: 'Waves run across the plate and it opens up into its wash at once. It rocks and swings on its felts — hardest after the biggest crash: the space a mic keeps clear of.' },
      { title: 'Sound leaves both faces', text: 'Sound leaves the top face, up toward the overheads, and the underside, down toward the tom below — and spreads widely: every open mic on the kit hears a crash, each at its own moment.' },
    ],
    cells: [
      { k: 'PLATE', at: ['STRUCK', 'BENT', 'SWINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK', 'WASH', 'EVERYWHERE'], flex: 1.2 },
    ],
    marks: ['1 · SHOULDER ON THE EDGE', '2 · THE PLATE BENDS', '3 · RINGS AND SWINGS', '4 · UP, TO THE OVERHEADS', 'AND DOWN, TO THE TOM'],
    reveal: 'Struck on the edge with a glancing blow, the crash opens up at once and swings hard — and its sound leaves both faces, reaching every mic on the kit.',
    after: 'Then the plate keeps ringing — the BODY, the wash — and swings back and forth on its felts. Thin crashes respond fast and decay sooner; heavier ones ring louder and longer.',
  },
  shapes: {
    title: 'The plate’s shapes',
    badge: 'A simplified picture: one flat disc held at its centre · blue + toward you, amber − away',
    prompt: 'Step through SHAPE, then move the STICK between the bell, the bow and the edge. Which spot drives the most shapes?',
    looking: 'The crash from above',
    notes: [
      'A shape is set moving only as much as the plate moves under the stick in that shape. Most of the shapes move most near the edge — part of why a crash struck on its edge responds at once.',
      'A simplified picture: a flat disc of even thickness. A real crash is domed, lathed, thinner at the edge and builds its wash in ways this picture does not show — the pattern of the shapes is what it teaches.',
    ],
    areas: [
      { id: 'bell', label: 'BELL', blurb: 'The raised centre, held by the felts.', r: 18 },
      { id: 'bow', label: 'BOW', blurb: 'The wide middle of the plate.', r: 110 },
      { id: 'edge', label: 'EDGE', blurb: 'The crash area, struck with a glancing blow.', r: 187 },
    ],
    defaultArea: 'edge',
  },
  arrivals: {
    title: 'Who hears it',
    badge: 'Straight paths in air at 20 °C · when each sound arrives, not how loud it is',
    prompt: 'Drag TIME after a crash. At each POINT — the close mic, the tom mic below, an overhead — when does it arrive?',
    looking: 'The 16 in crash and the 10 in tom below it',
    note: 'A crash reaches the close mic first, then the overhead and the tom mic below, each at its own moment — and a vocal mic nearby too. That is why every mic that hears the crash is compared in mono.',
    arrived: 'arrived after',
    pending: 'arrives after',
    sources: [
      { id: 'crash', label: '16 in crash', p: STRIKE1, color: '#e7a6ff' },
      { id: 'tom', label: '10 in tom', p: TOM1.c, color: '#6fa8ff' },
    ],
    points: [
      { id: 'close', label: 'THE CLOSE CRASH MIC', short: 'CLOSE', p: bandMid(C1, BAND.top1, { r: 0.5, h: 0.4 }) },
      { id: 'tomMic', label: 'THE 10 IN TOM’S MIC', short: 'TOM MIC', p: TOM_MIC },
      { id: 'over', label: 'THE OVERHEAD ON THE HI-HAT SIDE', short: 'OVERHEAD', p: AB_HAT },
    ],
    box: { side: { u0: -900, u1: 500, v0: -1500, v1: 330 }, top: { u0: -900, u1: 500, v0: -1100, v1: 0 } },
    maxMs: 4,
  },
  bodyTitle: 'WHERE IT GOES',
  bodyNote: 'Up, down and wide: a crash is one of the loudest things on the kit, and every open mic hears it. The overheads hang right by it and usually carry it first; a close mic adds focus only when they do not.',
  links: [CYM_LINKS.overheads, CYM_LINKS.kit],
};
