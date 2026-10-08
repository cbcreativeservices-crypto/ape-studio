/**
 * I01d SPLASH CYMBAL — the pages' words and the family's HOW IT SOUNDS data.
 * Starting-points voice (owner ruling 2026-10-04). No distance is published
 * for a splash: every band is said as a place to begin.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { CymbalExtra } from '../shared/cymbals/cymbalLesson.ts';
import { bandMid } from '../shared/cymbals/cymbalLesson.ts';
import { CYM_CONTEXT_WORDS, CYM_LINKS, CYM_TWO_WARN, CYM_VIEW_WORDS, CYM_WHERE, cymbalWords, underPatterns } from '../shared/cymbals/cymbalCopy.ts';
import { SPLASH_8 } from '../shared/cymbals/cymbalFx.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { AB_HAT } from '../m09Overheads/model.ts';
import { ARM, BAND, PIGGY, STRIKE_ARM } from './model.ts';

const TOM1 = KIT_DRUMS.tom1;

export const SPLASH_COPY: Partial<LessonCopy> = {
  variantKey: 'MOUNT',
  variantShort: { arm: 'the splash on its arm', piggy: 'the splash on the crash' },
  sceneSubject: { arm: 'a 10 in splash on an arm over the 10 in tom', piggy: 'an 8 in splash upside down on top of the 18 in crash' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x), from the splash’s centre.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y), from the splash. Distances are read from the face the zone names, square to it.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z), from the splash’s centre.' },
    origin: { arm: ARM.c, piggy: PIGGY.c },
  },
  instrument: {
    figureBadge: 'A 10 in splash on its arm, over the 10 in tom',
    figureLabel: 'Side view of a splash cymbal: a small 10 in plate on a Z-shaped arm clamped to the tom holder’s post, its swing dashed, over the 10 in tom, below the 16 in crash; the stick near its edge.',
    partsBadge: 'Switch MOUNT for the arm or on top of the crash · tap a part to name it',
    partsLooking: { side: 'Side view · the splash and its mount', top: 'Top view · the splash from above' },
    partsIdle: 'A small, thin cymbal for short accents. Tap the splash, its arm and clamp — or switch MOUNT to see one stacked on top of a crash.',
    variantNotes: { piggy: 'ON THE CRASH: an 8 in splash turned over on top of the 18 in crash, a felt between, one rod. The two move as one. A third way, a STACK (two or three plates bolted together), is said in words here, not drawn.' },
  },
  setting: {
    kitA11y: 'The drum kit from above: the splash drawn in its place and ringed in amber — on its arm over the 10 in tom, or on top of the 18 in crash; the drums, cymbals and throne around it.',
    kitLanding: 'Tap anything around the splash — or step through ITEM — to see what it means for a splash mic. There is nothing to answer yet.',
    kitIdle: 'A splash goes wherever the player can reach it quickly — here on an arm between the toms and the crash, or stacked on a crash. It sits among loud neighbours.',
    leftHanded: 'Left-handed players set the kit up mirrored — the splash moves with the rest.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s fill beside the throne and another player’s wedge on the audience side.',
    studioIdle: 'No monitors on the floor. The overheads usually carry a splash’s accents — the question is whether they carry the one cue that matters.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Which accents does the splash play — and do the overheads carry them? A splash is often a short cue in one place in a song. Its mount, height and angle are the player’s; never loosen a stack the player has tensioned on purpose.' },
      { title: 'WATCH THE WHOLE MOTION', text: 'A splash is small and swings a lot; on top of a crash it moves with the crash. Watch the hardest accent before choosing a place.' },
    ],
  },
  placement: {
    workedZone: { arm: 'sp.top', piggy: 'pg.top' },
    workedLine: 'This starting point also places the mic relative to {line}: over the bow.',
    workedAim: 'Aim it at the splash — the lab counts it while the mic’s axis meets the plate. On a tilted splash, “above” is measured square to the plate.',
    workedClear: 'Clear of every part — the stick’s side, the swing, the crash above (or under) it, the arm and the player’s arm. Clearance comes first, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Closer tends to catch more of the splash’s quick attack; farther, more of the kit around it — and every splash is different. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: above the splash on the far side; change the height first, then the aim. On top of the crash, the mic hears both plates — that is the sound the player chose.',
      smallDynCard: 'Ideas to try: a dynamic above the splash on the far side, aimed at its bow.',
      standClip: 'Ideas to try: hold the clip on the arm’s rising piece, under the splash, and turn the capsule up toward the bow. Check the arm still holds the splash firmly.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. A splash is small and swings a lot, and it sits between loud neighbours — check the whole motion.',
    availableLead: 'Starting points for this mic on the splash',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the face of the splash it names. No distance is published for a splash: these bands are places to begin — move from there and listen.',
      separate: 'Height above the splash, the spot over the plate and the angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT, square to the plate, and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand and cable out of the stick’s side, the swing, the crash above or under it, the arm and the player’s arm. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Closer tends to catch more of the quick attack; farther, more of the kit. On top of a crash, the two plates sound together. A splash is often one cue: the overheads may carry it well. Tendencies, checked by ear.',
    },
  },
  context: {
    ...CYM_CONTEXT_WORDS,
    variant: 'arm',
    zone: 'sp.under',
    typeId: 'standClip',
    patterns: underPatterns('standClip'),
    micNoun: 'A miniature condenser',
    shield: [],
    azMax: 60,
    elMax: 40,
    aimBlurb: 'Swing the front up to 60° either way — it still looks up at the splash.',
    plan: { u0: -1150, u1: 1500, v0: -1050, v1: 1000 },
    side: { u0: -1150, u1: 1500, v0: -1200, v1: 360 },
    target: 'fill',
    frontIds: [],
    targetWord: 'monitor',
    looking: 'Top view · the mic under the splash, aimed up',
    prompt: 'The monitors stay where the players need them. Turn the MIC (AIM) or change its PATTERN until the drummer’s fill sits in the rejection — while the mic still looks up at the splash.',
    studioId: 'sp.ctx.studio',
    studioPrompt: 'A studio session: does the splash need its own mic at all?',
    studioNote: 'In the studio, the overheads usually carry a splash. A close mic earns its channel when one cue needs more focus. Switch back to LIVE for the monitor exercise.',
  },
  twoMic: {
    variant: 'arm',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'sp.top' },
    B: { typeId: 'standClip', pattern: 'supercardioid', zone: 'sp.under' },
    opposite: {
      surface: 'spTop',
      note: 'One mic over the splash and one under it face opposite sides of the plate: as it moves up, toward the top mic, it moves away from the bottom one — so the pair starts in opposite polarity, before any arrival-time difference. A simplified picture: check both polarity states, no setting is required.',
    },
    learn: [
      'A splash is small, so two mics on it are close together — and both hear the crash above and the tom below. Each pair on the kit is a two-mic problem: compare in mono, at matched levels.',
      'Bring in one channel at a time, compare both polarity states, and move or leave out a mic if the splash goes thin. The polarity switch flips the sign; it does not remove a delay.',
    ],
    warn: CYM_TWO_WARN,
  },
  practice: {
    gain: 'sp.prac.gain',
    second: 'sp.prac.3',
    mixed: ['sp.mix.1', 'sp.mix.2', 'sp.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a starting point with no number, a stacked cymbal, and polarity versus delay.',
  },
  where: CYM_WHERE,
  viewWords: CYM_VIEW_WORDS,
  words: cymbalWords('splash'),
};

const TOM_MIC = { x: TOM1.c.x + 80, y: TOM1.c.y - 60, z: TOM1.c.z - 120 };

export const SPLASH_CYM: CymbalExtra = {
  spec: ARM.spec,
  specIn: { piggy: SPLASH_8 },
  invertedIn: ['piggy'],
  profile: 'bow',
  strike: {
    title: 'Strike to sound',
    badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
    looking: 'Side view · the splash cut through the stick’s line',
    prompt: 'STEP through the stroke, or PLAY ONCE — it stops at the end. Switch SETUP for the splash upside down. Nothing here makes a sound.',
    rFrac: 0.85,
    stages: [
      { title: 'The stick strikes', text: 'The stick strikes near the edge. A small, thin plate responds at once: a quick, bright ATTACK — an accent, a “splash”.' },
      { title: 'The plate bends', text: 'The small plate bends under the stick, the felts holding its centre. Drawn many times larger than it really moves.' },
      { title: 'It rings, briefly, and swings', text: 'The whole plate rings — high and short, because it is small and thin — and it swings on its felts.', byVariant: { piggy: 'Upside down on the crash, it rings with the crash under it: the two plates sound and swing together.' } },
      { title: 'Sound leaves both faces', text: 'Sound leaves both faces, up toward the overheads and down toward the tom below — and dies away soon.' },
    ],
    cells: [
      { k: 'PLATE', at: ['STRUCK', 'BENT', 'RINGING', 'FADING'], flex: 1 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK', 'SHORT WASH', 'UP AND DOWN'], flex: 1.2 },
    ],
    marks: ['1 · STICK NEAR THE EDGE', '2 · THE PLATE BENDS', '3 · RINGS, BRIEFLY', '4 · UP, TO THE OVERHEADS', 'AND DOWN, TO THE TOM'],
    reveal: 'A splash speaks fast and fades soon: small and thin, it rings high and short — and it swings a lot for its size.',
    after: 'Then it fades quickly — the BODY is short. That is the point of a splash: a quick accent, often one cue in a song.',
  },
  shapes: {
    title: 'The plate’s shapes',
    badge: 'A simplified picture: one flat disc held at its centre · blue + toward you, amber − away',
    prompt: 'Step through SHAPE, then move the STICK between the bell, the bow and the edge.',
    looking: 'The splash from above',
    notes: [
      'A smaller plate rings in the same shapes as a larger one, only higher: the ratios between them are the same; every pitch is higher. Most shapes move most near the edge.',
      'A simplified picture: a flat disc of even thickness. A real splash is domed, thin and lathed — the pattern of the shapes is what the picture teaches.',
    ],
    areas: [
      { id: 'bell', label: 'BELL', blurb: 'The small raised centre.', r: 10, rFrac: 0.1 },
      { id: 'bow', label: 'BOW', blurb: 'The middle of the plate.', r: 60, rFrac: 0.5 },
      { id: 'edge', label: 'NEAR THE EDGE', blurb: 'Where the stick usually lands.', r: 105, rFrac: 0.85 },
    ],
    defaultArea: 'edge',
  },
  arrivals: {
    title: 'Who hears it',
    badge: 'Straight paths in air at 20 °C · when each sound arrives, not how loud it is',
    prompt: 'Drag TIME after an accent on the splash and a hit on the tom below. At each POINT, which arrives first?',
    looking: 'The splash and the 10 in tom below it',
    note: 'The tom mic right under the splash hears it almost as soon as a close splash mic does; the overhead a little later. A short cue reaches every mic — compare them in mono.',
    arrived: 'arrived after',
    pending: 'arrives after',
    sources: [
      { id: 'splash', label: 'splash', p: STRIKE_ARM, color: '#e7a6ff' },
      { id: 'tom', label: '10 in tom', p: TOM1.c, color: '#6fa8ff' },
    ],
    points: [
      { id: 'close', label: 'THE CLOSE SPLASH MIC', short: 'CLOSE', p: bandMid(ARM, BAND.armTop, { r: 0.5, h: 0.45 }) },
      { id: 'tomMic', label: 'THE 10 IN TOM’S MIC', short: 'TOM MIC', p: TOM_MIC },
      { id: 'over', label: 'THE OVERHEAD ON THE HI-HAT SIDE', short: 'OVERHEAD', p: AB_HAT },
    ],
    box: { side: { u0: -700, u1: 500, v0: -1450, v1: 0 }, top: { u0: -700, u1: 500, v0: -1000, v1: 100 } },
    maxMs: 4,
  },
  bodyTitle: 'WHERE IT GOES',
  bodyNote: 'Up and down, quickly: a splash is a short accent among loud neighbours. The overheads usually carry it; a close mic earns its channel when one cue needs more focus.',
  links: [CYM_LINKS.overheads, CYM_LINKS.kit],
};
