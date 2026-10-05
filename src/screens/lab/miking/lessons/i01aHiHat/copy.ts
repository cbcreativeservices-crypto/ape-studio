/**
 * I01a HI-HAT — the pages' words (engine/model/copy.ts) and the family's
 * HOW IT SOUNDS data (`cym`, CymbalSound.tsx). Starting-points voice (owner
 * ruling 2026-10-04): suggestions in plain words, no sources, brands or
 * badges. Numbers are from hihat/SOURCES.md or named drawing defaults.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { KIT_PLACED_CYMBALS } from '../shared/cymbals/cymbalSpec.ts';
import type { CymbalExtra } from '../shared/cymbals/cymbalLesson.ts';
import { CYM_CONTEXT_WORDS, CYM_LINKS, CYM_TWO_WARN, CYM_VIEW_WORDS, CYM_WHERE, cymbalWords, underPatterns } from '../shared/cymbals/cymbalCopy.ts';
import { GJ_MAIN } from '../m09Overheads/model.ts';
import { BAND, GAP, HAT, HAT_R, STRIKE, STRIKE_R } from './model.ts';
import { bandMid } from '../shared/cymbals/cymbalLesson.ts';

const S0 = KIT_DRUMS.snare.c;

export const HAT_COPY: Partial<LessonCopy> = {
  variantKey: 'PEDAL',
  variantShort: { closed: 'the pair closed', open: 'the pair open' },
  sceneSubject: { closed: 'the 14 in hi-hats, closed, beside the snare', open: 'the 14 in hi-hats, open, beside the snare' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x), from the hats’ centre.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y), from the top cymbal. Distances are read from the cymbal the zone names, square to it.' },
    z: { plus: 'to player’s right (toward the snare)', minus: 'to player’s left (away from the snare)', label: 'ACROSS', blurb: 'Toward the player’s left or right (z), from the hats’ centre — right is toward the snare.' },
    origin: { closed: HAT.c, open: HAT.c },
  },
  instrument: {
    figureBadge: 'The hi-hats from the side, beside the snare',
    figureLabel: 'Side view of the hi-hats: two cymbals face to face on a stand, the clutch on the pull rod, the pedal at the floor, the air burst drawn at the edges, a stick at its spot near the edge; the snare in front and the crash above, dimmed.',
    partsBadge: 'Switch PEDAL for closed or open · tap a part to name it',
    partsLooking: { side: 'Side view · the hats and their stand', top: 'Top view · the hats from above' },
    partsIdle: 'Two cymbals face to face: the stick plays the top one, the left foot opens and closes the pair. Tap any part — the dashed blue band is the air that rushes out as the pair closes.',
    variantNotes: { open: 'OPEN: the pedal up, the cymbals apart (drawn ½ in). They ring longer and wash into each other. A mic must stay clear of the pair at its widest.' },
  },
  setting: {
    kitA11y: 'The drum kit from above: the hi-hats on the player’s left, ringed in amber, the snare beside them, the crash above, the throne behind.',
    kitLanding: 'Tap anything around the hi-hats — or step through ITEM — to see what it means for a hat mic. There is nothing to answer yet.',
    kitIdle: 'The hats stand on the player’s left, right beside the snare and a little higher; the crash hangs above their audience side. The player’s left foot works the pedal.',
    leftHanded: 'Left-handed players set the kit up mirrored — the hi-hats on the right.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors: the drummer’s fill beside the throne and another player’s wedge on the audience side. On a loud stage, the snare is still the hats’ loudest neighbour.',
    studioIdle: 'No monitors on the floor. A good overhead pair often carries the hi-hat well on its own.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Hear the hats played the way the song needs them — closed, open, with the foot. Does the music need a hat channel at all, or do the overheads already carry it? The two cymbals and the clutch are the player’s: a mic never goes where they would have to change how they play.' },
      { title: 'WATCH THE WHOLE MOTION', text: 'The left foot opens and closes the pair, the stick (often the right one, crossing over) lands near the edge, and air rushes out of the edges as the pair closes. Watch a full song’s worth before you choose a place.' },
    ],
  },
  placement: {
    workedZone: { closed: 'hh.top', open: 'hh.top' },
    workedLine: 'This starting point also places the mic relative to {line}: over the bow means in from the edge, toward the centre.',
    workedAim: 'Aim it at the top cymbal — the lab counts it while the mic’s axis meets the cymbal — and on the side away from the snare, so the pair itself hides the snare. Height, position over the plate and angle are separate things to try.',
    workedClear: 'Clear of every part — the stick’s side of the pair, the air burst at the edges, the clutch, the crash above and the player’s left arm. Clearance comes first, before any number, and the drummer stops before a real mic moves.',
    blocked: {},
    reveal: 'Toward the edge tends to bring more of the lower tones, toward the cup more of the high overtones — and every pair is different, so “it depends on these hats” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
    typeNotes: {
      sdcCard: 'Ideas to try: keep the height and slide the aim from the edge toward the cup; then, separately, change the height. Keep the snare on the far side of the pair. Within about 10 cm (4 in) of the cymbals is a common place to begin — outside the air burst.',
      smallDynCard: 'Ideas to try: a dynamic over the outer edge on the far side, aimed down. Listen as the pair closes: a thump or wind noise means the air is reaching it — move it up or round, then use a high-pass filter only if the low end is unwanted.',
      standClip: 'Ideas to try: clamp the clip low on the stand, out of the pedal’s way, then turn the capsule a little toward the bow. From below there tends to be less stick and a warmer top cymbal.',
    },
    note: 'Clearance comes first: stop the drummer before moving a real mic. Watch the pair open fully, the stick crossing over, and the air at the edges — check the whole motion, not one stroke.',
    availableLead: 'Starting points for this mic on the hats',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the cymbal it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every pair of hats is different.',
      separate: 'Height above the top cymbal, the position over the plate (edge, bow or toward the cup) and the angle are separate variables: change one at a time. Distances are measured to the mic’s FRONT, square to the cymbal, and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille.',
      clearance: 'Clearance comes first. Stop the drummer before moving a mic; keep the mic, stand and cable out of the stick’s side of the pair, the air at the edges, the clutch and rod, the crash above and the player’s left arm and foot. The grey hatched areas show roughly where to keep clear — leave more room on a real kit.',
      tendencies: 'Toward the edge tends to bring more of the lower tones; toward the cup more of the high overtones. From below, less stick and a warmer top cymbal. Two ways to handle the snare: keep it off the mic’s front with the pair shading it — or, when channels are short, angle the snare mic a little toward the hats and use one mic for both. Tendencies, checked by ear.',
    },
  },
  context: {
    ...CYM_CONTEXT_WORDS,
    variant: 'closed',
    zone: 'hh.under',
    typeId: 'standClip',
    patterns: underPatterns('standClip'),
    micNoun: 'A miniature condenser',
    shield: [],
    azMax: 60,
    elMax: 40,
    aimBlurb: 'Swing the front up to 60° either way — it still looks up at the bottom cymbal.',
    plan: { u0: -1150, u1: 1500, v0: -1050, v1: 1000 },
    side: { u0: -1150, u1: 1500, v0: -1150, v1: 360 },
    target: 'fill',
    frontIds: [],
    targetWord: 'monitor',
    looking: 'Top view · the mic under the hats, aimed up',
    prompt: 'The monitors stay where the players need them. Turn the MIC (AIM) or change its PATTERN until the drummer’s fill sits in the rejection — while the mic still looks up at the bottom cymbal.',
    studioId: 'hh.ctx.studio',
    studioPrompt: 'A studio session: does the hi-hat need its own mic at all?',
    studioNote: 'In the studio, the overheads (and the room) often carry the hats; a close mic adds focus when the music needs it. Repeated trials are practical when the drummer stops. Switch back to LIVE for the monitor exercise.',
  },
  twoMic: {
    variant: 'closed',
    A: { typeId: 'sdcCard', pattern: 'cardioid', zone: 'hh.farEdge' },
    B: { typeId: 'standClip', pattern: 'supercardioid', zone: 'hh.under' },
    opposite: {
      surface: 'hatTop',
      note: 'One mic above the pair and one below it face opposite sides of the plates: as the cymbals move up, toward the top mic, they move away from the bottom one — so the pair starts in opposite polarity, before any arrival-time difference. A simplified picture of the plates’ lowest motion: check both polarity states, no setting is required.',
    },
    learn: [
      'A mic under the hats hears a warmer top cymbal and less stick: a different perspective, kept only if it helps the hats in the whole kit.',
      'The same check applies whenever two mics hear one cymbal — above and below, or a close mic and the overheads: bring in one channel at a time, compare both polarity states in mono at matched levels, and move or leave out a mic if the hats go thin. The polarity switch flips the sign; it does not remove a delay.',
    ],
    warn: CYM_TWO_WARN,
  },
  practice: {
    gain: 'hh.prac.gain',
    second: 'hh.prac.3',
    mixed: ['hh.mix.1', 'hh.mix.2', 'hh.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and the snare beside the hats.',
  },
  where: CYM_WHERE,
  viewWords: CYM_VIEW_WORDS,
  words: cymbalWords('hi-hat'),
};

const SNARE_MIC = { x: S0.x - 40, y: S0.y - 60, z: S0.z - KIT_DRUMS.snare.spec.d.mm / 2 + 20 };

/** HOW IT SOUNDS (CymbalSound.tsx). */
export const HAT_CYM: CymbalExtra = {
  spec: HAT.spec,
  profile: 'bow',
  pair: { gapIn: { closed: GAP.closed, open: GAP.open } },
  ringIn: { closed: 0.3, open: 1 },
  strike: {
    title: 'Strike to sound',
    badge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
    looking: 'Side view · the hi-hats cut through the stick’s line',
    prompt: 'STEP through the stroke, or PLAY ONCE — it stops at the end. Switch SETUP to open the pair. Nothing here makes a sound.',
    rFrac: STRIKE_R / HAT_R,
    stages: [
      { title: 'The stick strikes', text: 'The tip of the stick strikes the top cymbal about 2–3 cm in from its edge. That brief contact is where the ATTACK begins — bright and short.' },
      { title: 'The top cymbal bends', text: 'The plate bends under the stick, most near the strike and not at all at the clutch, which holds its centre. Drawn many times larger than it really moves.' },
      {
        title: 'The pair rings — or is held',
        text: 'Closed, the two cymbals are pressed together: each damps the other, so the ring dies almost at once — the tight, short sound of closed hats.',
        byVariant: { open: 'Open, the top cymbal rings freely and rocks a little on the clutch; it can touch the bottom one and wash into it — a longer, sizzling sound.' },
      },
      { title: 'Sound leaves the pair', text: 'Sound leaves both faces — up toward the overheads, down under the pair — and out sideways from between the edges: a hi-hat spreads a lot of its sound horizontally. As the pedal closes the pair, air rushes out of the edges too.' },
    ],
    cells: [
      { k: 'TOP CYMBAL', at: ['STRUCK', 'BENT', 'RINGING', 'RINGING'], flex: 1.2 },
      { k: 'SOUND', at: ['ATTACK', 'ATTACK', 'BODY', 'SPREADING'], flex: 1.1 },
    ],
    marks: ['1 · STICK NEAR THE EDGE', '2 · THE PLATE BENDS', '3 · RINGS, OR IS HELD', '4 · UP, AND OUT OF THE SIDES', 'AND DOWN, UNDER THE PAIR'],
    reveal: 'Closed, the two cymbals hold each other and the ring dies at once; open, they ring on and wash into each other. Switch SETUP and step through again to compare.',
    after: 'Then the pair keeps ringing (open) or stops almost at once (closed) — the BODY of the sound. How it rings also depends on the two cymbals, which are rarely the same.',
  },
  shapes: {
    title: 'The plate’s shapes',
    badge: 'A simplified picture: one flat disc held at its centre, no second cymbal · blue + toward you, amber − away',
    prompt: 'Step through SHAPE, then move the STICK between the cup, the bow and the edge. Which shapes does each spot drive?',
    looking: 'The top cymbal from above',
    notes: [
      'A shape is set moving only as much as the plate moves under the stick in that shape. The clutch holds the centre still, so the shapes that ring have still lines across the plate — and in most of them the edge moves the most. That is part of why the stick lands near the edge.',
      'A simplified picture: a flat disc of even thickness on its own. Real hi-hat cymbals are domed, lathed and thinner at the edge, and the second cymbal touches the first — the shapes’ pattern (still lines across, the edge moving most) is what the picture teaches, not their numbers.',
    ],
    areas: [
      { id: 'cup', label: 'CUP', blurb: 'The raised centre around the clutch.', r: 20 },
      { id: 'bow', label: 'BOW', blurb: 'The wide middle of the plate.', r: 100 },
      { id: 'edge', label: 'NEAR THE EDGE', blurb: 'About 2–3 cm in from the edge — where the stick usually lands.', r: STRIKE_R },
    ],
    defaultArea: 'edge',
  },
  arrivals: {
    title: 'Who hears it',
    badge: 'Straight paths in air at 20 °C · when each sound arrives, not how loud it is',
    prompt: 'Drag TIME after a stroke on the hats and the snare. At each POINT, which arrives first — and by how much?',
    looking: 'The hats and the snare',
    note: 'The close hat mic hears the hats a fraction of a millisecond after the stroke, and the snare a little later. An overhead hears both later still. Every mic hears every source at its own time — which is why two mics on one kit can thin each other out, and why you compare them in mono.',
    arrived: 'arrived after',
    pending: 'arrives after',
    sources: [
      { id: 'hats', label: 'hi-hats', p: STRIKE, color: '#5bff85' },
      { id: 'snare', label: 'snare', p: S0, color: '#6fa8ff' },
    ],
    points: [
      { id: 'close', label: 'THE CLOSE HAT MIC', short: 'CLOSE MIC', p: bandMid(HAT, BAND.farEdge) },
      { id: 'snareMic', label: 'THE SNARE MIC', short: 'SNARE MIC', p: SNARE_MIC },
      { id: 'over', label: 'AN OVERHEAD, 1 m OVER THE SNARE', short: 'OVERHEAD', p: GJ_MAIN },
    ],
    box: { side: { u0: -900, u1: -60, v0: -1420, v1: -160 }, top: { u0: -900, u1: -60, v0: -960, v1: -160 } },
    maxMs: 4,
  },
  bodyTitle: 'WHERE IT GOES',
  bodyNote: 'Up, down and out of the sides of the pair: a hi-hat spreads much of its sound horizontally, so an overhead hears it well — and a mic level with the edges hears the air as the pair closes.',
  links: [CYM_LINKS.overheads, CYM_LINKS.kit],
};

export const KIT_CRASH1 = KIT_PLACED_CYMBALS.crash1;
