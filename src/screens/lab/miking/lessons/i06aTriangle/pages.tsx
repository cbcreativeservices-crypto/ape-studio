/**
 * I06a TRIANGLE — its pages: the suspended-metal journey (shared/metal/
 * metalPages) with the triangle's own words, drawings and anchors. FULLY
 * SILENT; nothing loops.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { fmtLen } from '../../engine/model/units.ts';
import type { HandSpec } from '../shared/hand/handPages';
import { makeMetalPages, VariantChips, type MetalSpec } from '../shared/metal/metalPages';
import { TRI_ZONES } from './geometry.ts';
import { P0, STRIKE_S } from './model.ts';
import { TriangleArt, triangleBar, triangleHitTest, triangleLabels, TriangleStrike, TRI_FRONT } from './art';

export const TRIANGLE_ART = { Instrument: TriangleArt, labels: triangleLabels, hitTest: triangleHitTest };

const zoneOf = (id: string) => TRI_ZONES.find((z) => z.id === id)!;
const A0 = zoneOf('tri.A').start;

const HAND: HandSpec = {
  art: TRIANGLE_ART,
  intro: 'This lesson is about putting a microphone on a triangle — but first the instrument itself: what it is, how it makes its sound, and where it sits with its player. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'TRIANGLE', badge: '', label: '', box: { u0: -600, u1: 400, v0: -1800, v1: -1000 } },
  partsBox: { side: { u0: -600, u1: 400, v0: -1800, v1: -1000 }, top: { u0: -600, u1: 400, v0: -400, v1: 400 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: {
    items: [
      { id: 'triangle', box: { u0: -60, u1: 60, v0: -130, v1: 130 }, scene: 'all', label: { u: 120, v: -200, align: 'left' } },
      { id: 'player', box: { u0: -560, u1: -240, v0: -290, v1: 290 }, scene: 'all', label: { u: -400, v: -380 } },
      { id: 'wedge', box: { u0: 1350, u1: 1850, v0: -650, v1: -50 }, scene: 'stage', label: { u: 1600, v: 60 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -790 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2250, v: -1000 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: -1000, v1: -860 }, scene: 'studio', label: { u: 200, v: -780 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the triangle player standing, the triangle held in front of the chest; a wedge downstage on the audience side, the drums and louder players upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the triangle player standing, no monitors on the floor, the room's walls around.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The player stands with the triangle in front of the chest; the beater and both hands work round it. Everything else fits round that.',
    before: [
      { title: 'ASK FOR THE WHOLE PASSAGE', text: 'Soft and strong strokes, rolls and the cutoffs — held or mounted, and the moves to other instruments. Which beater, and where on the bar? The source changes before the mic does.' },
      { title: 'CHECK THE SUSPENSION', text: 'Ask the player to check the clip, the main line and the catch line: a worn line can drop the instrument. The triangle must hang freely — no mic position restores a ring a poor suspension has already damped. The triangle and its care are the player’s.' },
      { title: 'LISTEN IN THE ROOM', text: 'From a safe point in front and a little to one side, hear the attack and the ring unamplified, at soft and strong levels, before any mic goes up.' },
    ],
  },
  mic: {
    intro: 'No brand and no special triangle mic is required. Choose by what the job needs: the pattern, the power, its size, how it mounts, and headroom for very brief peaks. Try what you have first and compare at matched loudness.',
    mountLine: (m) => (m.transducer === 'dynamic' ? 'Mount: a stand from the audience side, clear of the beater — robust on a loud stage' : 'Mount: a stand from the audience side, clear of the beater and both hands'),
  },
  axes: {
    x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the audience side (x).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'in front of' : 'behind'} the triangle` },
    y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown as a target.', fmt: (v) => `${fmtLen(Math.abs(v - P0.y))} ${v <= P0.y ? 'above' : 'below'} the triangle’s centre` },
    z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Toward the player’s left (the open corner’s side) or right (the beater’s side) (z).', fmt: (v) => `${fmtLen(Math.abs(v))} to the player’s ${v >= 0 ? 'right' : 'left'}` },
  },
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the triangle',
  worked: {
    zone: 'tri.A',
    mic: 'sdcCard',
    looking: 'Worked example · a small condenser · the triangle from above',
    label: 'The triangle with a small condenser placed for you',
    done: 'That is the whole reading: where to begin, what it is measured from, the distance, the viewpoint, the aim, clearance. Next you place the mic yourself.',
    pieces: (z: DocumentedZone) => [
      { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we suggest you begin with a triangle — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
      { title: 'MEASURED FROM', text: 'From the triangle itself, where it hangs while played: the readout measures from its centre to the mic’s FRONT, rounded to ≈ 5 mm.', cell: 0 },
      { title: 'THE DISTANCE', text: z.band, cell: 0 },
      { title: 'THE VIEWPOINT', text: 'In front of the triangle and a little to one side — the player’s left here, away from the beater hand — level with it or a little above.', cell: 1 },
      { title: 'THE AIM', text: `At the bars as a whole, not at the beater’s spot — the lab counts anything within ±${z.aim?.maxOffAxis ?? 25}°. Distance, viewpoint and angle are separate things to try.`, cell: 2 },
      { title: 'CLEARANCE', text: 'Outside the beater’s whole path, the rolls, the damping fingers and the clip hand; the stand clear of the player’s feet; never inside the triangle.', cell: 3 },
    ],
  },
  place: {
    zone: 'tri.A',
    mic: 'sdcCard',
    looking: 'the triangle from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then change one thing at a time.',
    label: 'The triangle held in front of the player',
    tried: (p) => `You predicted “${p}”. Farther back, the attack and the ring blend with the room — and the neighbours come up too. Closer, more attack and isolation. Which suits depends on the room and the music.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we suggest you begin, measured from the triangle where it is played. They are starting points, not rules: move from there and listen — every triangle, beater and player is different.',
    'Change one thing at a time, and listen to the same light stroke, strong stroke, roll and cutoff at matched level. If a stroke sounds painfully sharp, check the beater and the playing spot first, then a safer off-axis or wider view. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
    'Never put the mic inside the triangle or in the beater’s path just to gain level. On a loud stage, fix the balance on stage before raising the gain.',
  ],
  ctx: {
    pose: { ...A0, az: A0.az + 10 },
    mic: 'smallDynCard',
    plan: { u0: -700, u1: 1950, v0: -900, v1: 900 },
    side: { u0: -700, u1: 1950, v0: -1800, v1: 40 },
    creditWedge: 'wedge',
    looking: 'From above · a mic in front of the triangle',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — and keep the front on the triangle.',
    label: 'the triangle with a mic in front of it.',
    learn: [
      { title: 'STUDIO', text: 'A quiet solo: one moderate-distance spot, compared with a wider view in a good room. Record the whole phrase, pauses included, to hear clip noises and the room during the ring. Set gain on the strongest stroke, then check the soft ones.' },
      { title: 'LIVE', text: 'A quiet stage: a shared percussion mic may be enough. A loud one: a closer directional spot outside the beater’s path, with its null toward the loudest wedge. A mounted triangle makes the spot repeatable — if the mount does not rattle or ring.' },
      { title: 'THE WEDGE', text: 'Keep the triangle low in, or out of, the player’s monitor: its brief attack raises the feedback risk and can sound uncomfortably sharp there.' },
    ],
  },
  two: {
    A: { zone: 'tri.A', mic: 'sdcCard' },
    B: { zone: 'tri.C', mic: 'sdcCard' },
    names: { A: 'SPOT MIC', B: 'WIDER MIC' },
    looking: 'Two mics · A the spot, B a wider view farther back',
    prompt: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes — and try each SOURCE.',
    label: 'The triangle with a spot mic (A) and a wider mic (B)',
    warn: 'This simplified graph shows one point source and straight paths. A real triangle rings all along its rod and hangs on a line that can turn, so the delay between two mics is not one number. Read the notch depths as illustrative only, and judge the pair by ear, in mono.',
    learn: [
      'A common situation: the triangle spot, and another mic that hears it too — a percussion overhead, the main pair, or a wider mic in a good room. Each hears it at a different time. One mic is often enough.',
      'Compare the mics together at the intended levels in MONO. If the attack weakens or the ring turns hollow, move, re-aim or rebalance first; try polarity as a diagnostic, not an automatic switch. Live, every extra open mic adds spill and feedback risk.',
    ],
  },
  practice: {
    orderNote: 'A one-mic triangle setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'tri.prac.gain',
    secondId: 'tri.prac.3',
    mixIds: ['tri.mix.1', 'tri.mix.2', 'tri.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: who made the brightness, what a null can promise, and polarity versus delay.',
    sheetNote: 'For a real triangle and player, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};

const SPEC: MetalSpec = {
  hand: HAND,
  meet: {
    intro: HAND.intro,
    front: TRI_FRONT,
    figure: { title: 'TRIANGLE', badge: 'An 8 in steel triangle, face-on from the audience · the hold is a drawing choice', label: (v) => (v === 'mounted' ? 'An 8 inch triangle seen face-on, hung on a stand by two clips at its closed corners, the closed side on top and the open corner at the bottom, with two beaters.' : 'An 8 inch steel triangle seen face-on from the audience, hanging from a clip and a thin line held by the player’s left hand, the open corner at the bottom on the player’s left, and a steel beater from the player’s right hand at the base.') },
    partsBadge: 'An 8 in steel triangle, face-on · tap a part to name it',
    partsLooking: (v) => (v === 'mounted' ? 'From the audience · the triangle on its stand' : 'From the audience · the triangle face-on, the player behind'),
    partsNote: 'One steel rod, bent round two closed corners, with one corner left open. It hangs freely so the whole bar can ring. Switch PLAYED to see it mounted.',
    partsWarn: 'The triangle and its clip and lines are the player’s: never clip a mic to them, and never hold the metal — a hand on it stops the ring.',
    variantKey: 'PLAYED',
  },
  sound: {
    Strike: TriangleStrike,
    strikeTitle: 'Stroke to sound',
    strikeBadge: 'The order of events, not their speed · motion drawn much larger than it really is · silent',
    strikeLooking: () => 'From the audience · the triangle face-on',
    cells: () => [
      { k: 'BEATER', at: ['CONTACT', 'OFF', 'OFF', 'OFF'], flex: 1 },
      { k: 'BAR', at: ['AT REST', 'BENDS', 'RINGING', 'RINGING'], flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', '—', 'ALL ROUND'], flex: 1.1 },
    ],
    after: () => 'It rings on until the player lets it fade or closes their fingers round it — the cutoff is played too. A hand or a thick support on the metal would stop it early.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real triangle sounds depends on the instrument, the beater, the spot and the player. The pictures show where the sound comes from and where it leaves.',
    variantKey: 'PLAYED',
    shapes: {
      kind: 'bar',
      geom: () => triangleBar(),
      strikes: [
        { id: 'base', label: 'BASE, MIDDLE', words: 'in the middle of the base', blurb: 'The middle of the base — a common playing area.', s: STRIKE_S.base },
        { id: 'corner', label: 'NEAR THE CORNER', words: 'on the base near the closed corner', blurb: 'The base just inside the closed corner, where rolls are played.', s: STRIKE_S.corner },
        { id: 'side', label: 'SIDE', words: 'on the side by the closed corner', blurb: 'The outside of the side joined at the closed corner — the other common area.', s: STRIKE_S.side },
      ],
      title: 'The bar’s shapes',
      badge: 'A simplified picture: the straight bar it was bent from, drawn round the triangle · motion drawn much larger · white dots = still points',
      looking: () => 'The triangle face-on · one vibration shape',
      prompt: 'Step through SHAPE, then move the STROKE. Where on the bar does a shape stand still — and what does a stroke there drive?',
      strikeWord: 'STROKE',
      subject: 'The 8 inch triangle face-on, drawn as the bar it was bent from',
      notes: () => [
        'A shape is set moving only as much as the bar moves where the stroke lands. Each shape has still points (white); a stroke on one drives that shape hardly at all — so the spot changes the mix of shapes, and the colour of the sound.',
        'This is a bar held at neither end, drawn round the triangle’s corners. The real bends shift these numbers and add shapes that swing out of the triangle’s plane — part of the shimmer.',
      ],
      tried: 'Each spot drives a different mix of shapes — that is one reason players choose where to strike. Some shapes barely move at a given spot.',
    },
  },
};

export const TRIANGLE_PAGES = makeMetalPages(SPEC);
export const TRIANGLE_STEP_COUNTS = { instrument: 3, sound: 3, setting: 2 } as const;
