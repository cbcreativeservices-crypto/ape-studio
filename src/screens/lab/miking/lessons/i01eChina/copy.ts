/**
 * I01e CHINA CYMBAL — the pages' words and the family's HOW IT SOUNDS data.
 * Starting-points voice (owner ruling 2026-10-04). No distance is published
 * for a China: every band is said as a place to begin.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { CymbalExtra } from '../shared/cymbals/cymbalLesson.ts';
import { bandMid } from '../shared/cymbals/cymbalLesson.ts';
import { CYM_CONTEXT_WORDS, CYM_LINKS, CYM_TWO_WARN, CYM_VIEW_WORDS, CYM_WHERE, cymbalWords, underPatterns } from '../shared/cymbals/cymbalCopy.ts';
import { CHINA_18 } from '../shared/cymbals/cymbalFx.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { AB_RIDE } from '../m09Overheads/model.ts';
import { BAND, INV, R, STRIKE, STRIKE_UP, UP } from './model.ts';

const TOM2 = KIT_DRUMS.tom2;

export const CHINA_COPY: Partial<LessonCopy> = {
  variantKey: 'MOUNT',
  variantShort: { upright: 'the China upright', inverted: 'the China turned over' },
  sceneSubject: { upright: 'the 18 in China upright on its stand, over the 12 in tom', inverted: 'the 18 in China turned over on its stand, over the 12 in tom' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x), from the China’s centre.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y), from the China. Distances are read from the face the zone names, square to it.' },
    z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z), from the China’s centre.' },
    origin: { upright: UP.c, inverted: INV.c },
  },
  instrument: {
    figureBadge: 'An 18 in China, upright, on its stand',
    figureLabel: 'Side view of a China cymbal: an 18 in plate with a squarer cup, a shoulder falling to the valley and an upturned lip, on a boom stand, its swing dashed; the stick on the shoulder; the 12 in tom below and the ride beside, dimmed.',
    partsBadge: 'Switch MOUNT for upright or turned over · tap a part to name it',
    partsLooking: { side: 'Side view · the China on its stand', top: 'Top view · the China from above' },
    partsIdle: 'A China has a squarer cup and an upturned edge. Tap the cup, the shoulder and the lip — then switch MOUNT and see the shape turned over.',
    variantNotes: { inverted: 'TURNED OVER: cup down. The valley becomes a raised ring and the lip turns down — the way most players mount a China to crash it. The whole China shape here is a drawing, not a measured cymbal.' },
  },
  setting: {
    kitA11y: 'The drum kit from above: the China drawn in the 18 in crash’s place on the right and ringed in amber, over the 12 in tom; the ride beside it, the throne behind.',
    kitLanding: 'Tap anything around the China — or step through ITEM — to see what it means for a China mic. There is nothing to answer yet.',
    kitIdle: 'Here the China takes the 18 in crash’s stand on the right, over the 12 in tom and beside the ride. Chinas are often set high or far out; this is one typical place.',
    leftHanded: 'Many left-handed players set the kit up mirrored — the China moves with the rest.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s fill beside the throne and another player’s wedge on the audience side. A China cuts through a loud stage on its own.',
    studioIdle: 'No monitors on the floor. The overheads usually carry a China — it is one of the most cutting sounds on the kit.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'How is the China used — crashed for accents (usually turned over), or ridden (sometimes upright)? Does it already cut through the overheads? Its mount and angle are the player’s choice.' },
      { title: 'WATCH THE WHOLE MOTION', text: 'A China is crashed hard and swings; turned over, its lowest point is the cup, upright the valley. Watch the hardest accent before choosing a place.' },
    ],
  },
  placement: {
    workedZone: { upright: 'ch.top', inverted: 'ch.topI' },
    workedLine: 'This starting point also places the mic relative to {line}: over the shoulder and the lip.',
    workedAim: 'Aim it at the China — the lab counts it while the mic’s axis meets the plate. On a tilted China, “above” is measured square to its rim plane.',
    workedClear: 'Clear of every part — the stick’s side, the swing after the hardest crash, the ride beside it and the player’s arm. Clearance comes first, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Toward the lip tends to bring more of the trashy edge; toward the cup a harder, more focused tone — and every China is different. Each zone’s LISTEN FOR line is an idea to check by ear.',
    typeNotes: {
      sdcCard: 'Ideas to try: above the China on the far side, change the height first, then the aim. Underneath, aimed up, start below the plate’s lowest point in its mount — the cup when it is turned over.',
      smallDynCard: 'Ideas to try: a dynamic above the China on the far side; a China cuts through, so distance is your friend.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. A China is crashed hard and swings — check the whole motion.',
    availableLead: 'Starting points for this mic on the China',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the face of the China it names. No distance is published for a China: these bands are places to begin — move from there and listen.',
      separate: 'Height above the China, the spot over the plate and the angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT, square to the rim plane, and rounded to ≈ 5 mm.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand and cable out of the stick’s side, the swing, the China’s boom, the ride beside it and the player’s arm. Underneath, start below the plate’s lowest point in its mount. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear.',
      tendencies: 'Toward the lip tends to bring more of the trashy edge, toward the cup a harder tone; underneath, a very direct sound with less stick. A China often cuts through the overheads on its own. Tendencies, checked by ear.',
    },
  },
  context: {
    ...CYM_CONTEXT_WORDS,
    variant: 'upright',
    zone: 'ch.under',
    typeId: 'sdcCard',
    patterns: underPatterns('sdcCard'),
    micNoun: 'A small condenser',
    shield: [],
    azMax: 60,
    elMax: 40,
    aimBlurb: 'Swing the front up to 60° either way — it still looks up at the China.',
    plan: { u0: -1150, u1: 1500, v0: -700, v1: 1250 },
    side: { u0: -1150, u1: 1500, v0: -1300, v1: 360 },
    target: 'fill',
    frontIds: [],
    targetWord: 'monitor',
    looking: 'Top view · the mic under the China, aimed up',
    prompt: 'The monitors stay where the players need them. Turn the MIC (AIM) or change its PATTERN until the drummer’s fill sits in the rejection — while the mic still looks up at the China.',
    studioId: 'ch.ctx.studio',
    studioPrompt: 'A studio session: does the China need its own mic at all?',
    studioNote: 'In the studio, the overheads usually carry a China — it cuts through. A close mic adds a very direct sound when the music wants it. Switch back to LIVE for the monitor exercise.',
  },
  twoMic: {
    variant: 'upright',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'ch.top' },
    B: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'ch.under' },
    opposite: {
      surface: 'chTopU',
      note: 'One mic over the China and one under it face opposite sides of the plate: as it moves up, toward the top mic, it moves away from the bottom one — so the pair starts in opposite polarity, before any arrival-time difference. A simplified picture: check both polarity states, no setting is required.',
    },
    learn: [
      'A China is loud and cutting: every mic on the kit hears it, each at its own time. Each pair is a two-mic problem: compare in mono, at matched levels.',
      'Bring in one channel at a time, compare both polarity states, and move or leave out a mic if the China goes thin. The polarity switch flips the sign; it does not remove a delay.',
    ],
    warn: CYM_TWO_WARN,
  },
  practice: {
    gain: 'ch.prac.gain',
    second: 'ch.prac.3',
    mixed: ['ch.mix.1', 'ch.mix.2', 'ch.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a shape turned over, a starting point with no number, and polarity versus delay.',
  },
  where: CYM_WHERE,
  viewWords: CYM_VIEW_WORDS,
  words: cymbalWords('China'),
};

const TOM_MIC = { x: TOM2.c.x + 90, y: TOM2.c.y - 60, z: TOM2.c.z + 140 };

export const CHINA_CYM: CymbalExtra = {
  spec: CHINA_18,
  profile: 'china',
  invertedIn: ['inverted'],
  strike: {
    title: 'Strike to sound',
    badge: 'The order of events, not their speed · a simplified China profile · motion drawn much larger · silent',
    looking: 'Side view · the China cut through the stick’s line',
    prompt: 'STEP through the stroke, or PLAY ONCE — it stops at the end. Switch SETUP to turn the China over. Nothing here makes a sound.',
    rFrac: STRIKE.upright / R,
    rFracIn: { inverted: STRIKE.inverted / R },
    stages: [
      { title: 'The stick strikes', text: 'Upright, the stick rides the side of the shoulder, about an inch above the valley. The attack is quick and cutting.', byVariant: { inverted: 'Turned over, the stick crashes the China near its edge. The attack is quick, harsh and cutting.' } },
      { title: 'The plate bends', text: 'The plate bends under the stick, the felts holding the cup. Drawn many times larger than it really moves.' },
      { title: 'It rings — trashy — and swings', text: 'The whole plate rings; its upturned lip and odd shape break the sound up into the China’s trashy roar, which dies away sooner than a crash. It swings on its felts.' },
      { title: 'Sound leaves both faces', text: 'Sound leaves both faces — up toward the overheads, down toward the tom below — and cuts through nearly everything on the stage.' },
    ],
    cells: [
      { k: 'PLATE', at: ['STRUCK', 'BENT', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK', 'TRASHY', 'UP AND DOWN'], flex: 1.2 },
    ],
    marks: ['1 · STICK ON THE PLATE', '2 · THE PLATE BENDS', '3 · RINGS AND SWINGS', '4 · UP, TO THE OVERHEADS', 'AND DOWN, TO THE TOM'],
    reveal: 'A China speaks fast and harsh, then roars and fades sooner than a crash. Switch SETUP to see the same shape turned over — the valley becomes a raised ring.',
    after: 'Then the plate keeps ringing for a while — the BODY, trashy rather than smooth. Upright and ridden lightly, a large China can even keep time.',
  },
  shapes: {
    title: 'The plate’s shapes',
    badge: 'A simplified picture: a flat disc, not a China’s cup and lip · blue + toward you, amber − away',
    prompt: 'Step through SHAPE, then move the STICK between the cup, the shoulder and the lip.',
    looking: 'The China from above, drawn as a flat disc',
    notes: [
      'This step draws the China as a flat disc: the shapes’ pattern — still lines across the plate, the outer part moving most — is what it teaches. A real China’s squarer cup and upturned lip change the numbers, and help give it its trashy sound.',
      'A shape is set moving only as much as the plate moves under the stick. On the shoulder and the lip most shapes move a lot; near the held cup, most barely move.',
    ],
    areas: [
      { id: 'cup', label: 'CUP', blurb: 'The squarer cup at the centre.', r: 20, rFrac: 0.09 },
      { id: 'shoulder', label: 'SHOULDER', blurb: 'About an inch above the valley — where an upright China is ridden.', r: STRIKE.upright, rFrac: STRIKE.upright / R },
      { id: 'lip', label: 'LIP', blurb: 'The upturned edge.', r: 0.9 * R, rFrac: 0.9 },
    ],
    defaultArea: 'shoulder',
  },
  arrivals: {
    title: 'Who hears it',
    badge: 'Straight paths in air at 20 °C · when each sound arrives, not how loud it is',
    prompt: 'Drag TIME after a hit on the China and the tom below. At each POINT, which arrives first?',
    looking: 'The China and the 12 in tom below it',
    note: 'A China reaches every mic — the close mic first, then the tom mic and the overhead on that side. It cuts through on its own: compare every pair in mono.',
    arrived: 'arrived after',
    pending: 'arrives after',
    sources: [
      { id: 'china', label: 'China', p: STRIKE_UP, color: '#ff8c3c' },
      { id: 'tom', label: '12 in tom', p: TOM2.c, color: '#6fa8ff' },
    ],
    points: [
      { id: 'close', label: 'THE CLOSE CHINA MIC', short: 'CLOSE', p: bandMid(UP, BAND.topU, { r: 0.55, h: 0.45 }) },
      { id: 'tomMic', label: 'THE 12 IN TOM’S MIC', short: 'TOM MIC', p: TOM_MIC },
      { id: 'over', label: 'THE OVERHEAD ON THE RIDE SIDE', short: 'OVERHEAD', p: AB_RIDE },
    ],
    box: { side: { u0: -400, u1: 800, v0: -1500, v1: -200 }, top: { u0: -400, u1: 800, v0: -150, v1: 950 } },
    maxMs: 4,
  },
  bodyTitle: 'WHERE IT GOES',
  bodyNote: 'Up, down and through everything: a China is one of the most cutting sounds on the kit. The overheads usually carry it; a close mic gives a very direct version when the music wants it.',
  links: [CYM_LINKS.overheads, CYM_LINKS.kit],
};
