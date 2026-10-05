/**
 * I06c BAR CHIMES — its pages: the suspended-metal journey (shared/metal/
 * metalPages) with the bar chimes' own words, drawings and anchors; the two-
 * mic page puts a mic at each end of the row. FULLY SILENT; nothing loops.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { fmtLen } from '../../engine/model/units.ts';
import type { HandSpec } from '../shared/hand/handPages';
import { makeMetalPages, VariantChips, type MetalSpec } from '../shared/metal/metalPages';
import { BC_ZONES } from './geometry.ts';
import { LENGTHS, P0 } from './model.ts';
import { BarChimesArt, barChimesHitTest, barChimesLabels, BarChimesStrike, BC_FRONT, chimeBar } from './art';

export const BAR_CHIMES_ART = { Instrument: BarChimesArt, labels: barChimesLabels, hitTest: barChimesHitTest };

const zoneOf = (id: string) => BC_ZONES.find((z) => z.id === id)!;
const A0 = zoneOf('bc.A').start;

const HAND: HandSpec = {
  art: BAR_CHIMES_ART,
  intro: 'This lesson is about putting a microphone on bar chimes — but first the instrument itself: what it is, how it makes its sound, and where it sits with its player. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'BAR CHIMES', badge: '', label: '', box: { u0: -600, u1: 400, v0: -1800, v1: -900 } },
  partsBox: { side: { u0: -600, u1: 400, v0: -1800, v1: -900 }, top: { u0: -600, u1: 400, v0: -400, v1: 400 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: {
    items: [
      { id: 'row', box: { u0: -60, u1: 60, v0: -200, v1: 260 }, scene: 'all', label: { u: 120, v: -260, align: 'left' } },
      { id: 'player', box: { u0: -560, u1: -240, v0: -290, v1: 290 }, scene: 'all', label: { u: -400, v: -380 } },
      { id: 'wedge', box: { u0: 1350, u1: 1850, v0: 50, v1: 650 }, scene: 'stage', label: { u: 1600, v: 760 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -790 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2250, v: -1000 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: -1000, v1: -860 }, scene: 'studio', label: { u: 200, v: -780 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: bar chimes on a stand with the player behind them; a wedge downstage on the audience side, the cymbals and louder players upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the bar chimes on their stand and the player, no monitors on the floor, the room's walls around.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The row runs across in front of the player; the hand sweeps along it and the struck bars swing. Everything else fits round that.',
    before: [
      { title: 'ASK FOR THE WHOLE GESTURE', text: 'Which direction, which start and end bars, how fast, how hard — single accents, repeated sweeps, and any damping. A sound continues after the hand passes unless the player or a damper stops it.' },
      { title: 'CHECK THE INSTRUMENT', text: 'The filaments, the rail, the clamp and the stand, with the player: a loose bar or an overloaded clamp can fall. Use hardware rated for it, on a stable stand. The instrument and its care are the player’s.' },
      { title: 'LISTEN IN THE ROOM', text: 'Hear a slow sweep in both directions, a single accent and the decay unamplified, before any mic goes up. Tell the bars’ ring from clanks in the frame or clamp.' },
    ],
  },
  mic: {
    intro: 'No brand and no special chime mic is required. Choose by what the job needs: the pattern and its off-axis response across a wide row, the power, the size, the mount, and headroom for brief peaks. Try what you have first and compare at matched loudness.',
    mountLine: (m) => (m.transducer === 'dynamic' ? 'Mount: a stand from the audience side, outside the swing — robust on a stage' : 'Mount: a stand from the audience side, outside the swing and the hand'),
  },
  axes: {
    x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the audience side (x).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'in front of' : 'behind'} the row` },
    y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown as a target.', fmt: (v) => `${fmtLen(Math.abs(v - P0.y))} ${v <= P0.y ? 'above' : 'below'} the middle of the bars` },
    z: { label: 'ALONG THE ROW', short: 'ALONG', blurb: 'Along the row: toward the long bars (the player’s left) or the short bars (right) (z).', fmt: (v) => `${fmtLen(Math.abs(v))} toward the ${v >= 0 ? 'short' : 'long'} bars` },
  },
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the swing',
  worked: {
    zone: 'bc.A',
    mic: 'sdcCard',
    looking: 'Worked example · a small condenser · the chimes from above',
    label: 'The bar chimes with a small condenser placed for you',
    done: 'That is the whole reading: where to begin, what it is measured from, the distance, the viewpoint, the aim, clearance. Next you place the mic yourself.',
    pieces: (z: DocumentedZone) => [
      { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we recommend you begin with bar chimes — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
      { title: 'MEASURED FROM', text: 'From the middle of the row, at the bars’ height: the readout measures to the mic’s FRONT, rounded to ≈ 5 mm.', cell: 0 },
      { title: 'THE DISTANCE', text: z.band, cell: 0 },
      { title: 'THE VIEWPOINT', text: 'In front of the row, facing its whole length — so the first and the last bars are heard in balance — at a height that sees the bars, not only the rail.', cell: 1 },
      { title: 'THE AIM', text: `At the middle of the row — the lab counts anything within ±${z.aim?.maxOffAxis ?? 20}°. Distance, height and angle are separate things to try.`, cell: 2 },
      { title: 'CLEARANCE', text: 'Outside the bars’ swing after each strike and the hand’s whole sweep; the stand and cable clear of the player and the instrument’s stand.', cell: 3 },
    ],
  },
  place: {
    zone: 'bc.A',
    mic: 'sdcCard',
    looking: 'the chimes from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then try one at an end of the row.',
    label: 'Bar chimes on a stand, the player behind',
    tried: (p) => `You predicted “${p}”. Farther back, the row sounds more even and the tail blends with the room — with less isolation. Closer, the strikes nearest the mic stand out.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we recommend you begin, measured from the middle of the row (or, for the end mics, from an end). They are starting points, not rules: move from there and listen — every row, mount and player is different.',
    'Change one thing at a time, and replay the same direction, speed and force: a faster or stronger sweep changes the source, not the mic. Listen to the first and last bars, the shimmer, any harshness, clanks, the room and spill. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
    'An end mic on its own favours its end of the row; a mic at each end is an option for a deliberately wide or difficult setup. Start with one mic and add a second only after hearing the reason.',
  ],
  ctx: {
    pose: { ...A0 },
    mic: 'smallDynCard',
    plan: { u0: -700, u1: 1950, v0: -900, v1: 900 },
    side: { u0: -700, u1: 1950, v0: -1800, v1: 40 },
    creditWedge: 'wedge',
    looking: 'From above · a mic in front of the row',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — and keep the front on the row.',
    label: 'the bar chimes with a mic in front of them.',
    learn: [
      { title: 'STUDIO', text: 'A solo: the same stand and hand or striker as the take, sweeps in both directions and the full decay, a moderately close mono position compared with a wider one. With an ensemble, listen to the main pickup first.' },
      { title: 'LIVE', text: 'Quieter ensembles: a shared percussion mic or the overheads. Loud stages: a directional spot outside the swing, its null toward the loudest wedge; a wide or double row may need more distance for even coverage.' },
      { title: 'THE WEDGE', text: 'The player hears the chimes acoustically: keep them low in, or out of, the monitor. If they are masked, move the instrument or lower competing levels before forcing gain.' },
    ],
  },
  two: {
    A: { zone: 'bc.endL', mic: 'sdcCard' },
    B: { zone: 'bc.endR', mic: 'sdcCard' },
    names: { A: 'LONG-END MIC', B: 'SHORT-END MIC' },
    looking: 'Two mics · one beyond each end of the row',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then try each SOURCE: the long bars, the middle, the short bars — each has its own delay.',
    label: 'The bar chimes with a mic beyond each end (A at the long end, B at the short end)',
    warn: 'This simplified graph shows one point source and straight paths. A sweep moves along the row, so the delay between the two end mics changes with every bar — the comb moves through the sweep. Read the notch depths as illustrative only, and judge the pair by ear, in stereo and in mono.',
    learn: [
      'A deliberately wide option: a mic beyond each end of the row. A bar near the middle reaches both at about the same time; a bar near an end reaches one mic well before the other. Every bar has its own delay.',
      'Check the stereo width and the mono sum — two end mics do not automatically give an even image. If the sum turns hollow, move, re-aim or rebalance; try polarity as a diagnostic, not an automatic switch. One mic is often enough.',
    ],
  },
  practice: {
    orderNote: 'A one-mic bar-chime setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'bc.prac.gain',
    secondId: 'bc.prac.3',
    mixIds: ['bc.mix.1', 'bc.mix.2', 'bc.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: who made the brightness, what a null can promise, and polarity versus delay.',
    sheetNote: 'For a real instrument and player, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};

const SPEC: MetalSpec = {
  hand: HAND,
  meet: {
    intro: HAND.intro,
    front: BC_FRONT,
    figure: { title: 'BAR CHIMES', badge: 'A 27-bar row on a 38 cm rail, face-on from the audience · bar sizes are a drawing choice', label: (v) => `Bar chimes seen face-on from the audience: a wooden rail on a stand, ${v === 'double' ? 'two staggered rows of 30 bars' : 'a single row of 27 bars'} hanging below it on filaments, long bars on the player's left (the screen's right) down to short bars, and the player's hand at the long end ready to sweep.` },
    partsBadge: 'Bar chimes on a stand, face-on · tap a part to name it',
    partsLooking: () => 'From the audience · the row face-on, the player behind',
    partsNote: 'A wooden rail, and graduated metal bars on filaments. Switch ROWS to see a double row.',
    partsWarn: 'The instrument and its stand are the player’s: never clip a mic to the rail or the stand, and never touch moving bars or the player’s hand.',
    variantKey: 'ROWS',
  },
  sound: {
    Strike: BarChimesStrike,
    strikeTitle: 'Sweep to sound',
    strikeBadge: 'The order of events, not their speed · swing drawn larger than it really is · silent',
    strikeLooking: () => 'From the audience · the row face-on',
    cells: () => [
      { k: 'HAND', at: ['ENTERS', 'MID-ROW', 'PAST', 'PAST'], flex: 1 },
      { k: 'BARS', at: ['AT REST', 'IN TURN', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['—', 'STRIKES', 'OVERLAP', 'ALONG ROW'], flex: 1.1 },
    ],
    after: () => 'The bars ring on, the earlier ones fading first, until they die away — or the player or a damper stops them. That ending is part of the music: no gate should cut it.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how real bar chimes sound depends on the row, the metal, the mount and the player. The pictures show where the sound comes from and where it leaves.',
    variantKey: 'ROWS',
    shapes: {
      kind: 'bar',
      geom: (v, L) => chimeBar(v, L),
      strikes: [
        { id: 'mid', label: 'THE MIDDLE', words: 'at the middle of the bar', blurb: 'Where the sweeping hand usually meets a bar.', s: 0.5 },
        { id: 'lower', label: 'LOWER DOWN', words: 'lower down the bar', blurb: 'Between the middle and the free end.', s: 0.78 },
        { id: 'end', label: 'THE FREE END', words: 'at the bar’s free end', blurb: 'The bottom end, which moves in every shape.', s: 0.98 },
      ],
      lengths: { mm: LENGTHS, words: 'Bars of one thickness and metal: a shorter bar rings higher, with pitch rising as 1 ÷ length².' },
      title: 'One bar’s shapes',
      badge: 'A simplified picture: a bar free at both ends (the filament barely holds it) · motion drawn much larger · white dots = still points',
      looking: () => 'One bar, face-on · one vibration shape',
      prompt: 'Step through SHAPE and move the STROKE, then slide BAR from the longest to the shortest. What happens to the pitch?',
      strikeWord: 'STROKE',
      subject: 'One chime bar hanging from its filament',
      notes: () => [
        'A shape is set moving only as much as the bar moves where it is struck. At the middle, every second shape stands still — so a sweep at the bars’ middles drives some shapes and not others.',
        'Every bar in the row has the same shapes; only its length changes, and with it the pitch of all its shapes together. The row’s rising run is the lengths, not the metal.',
      ],
      tried: 'At the middle some shapes barely move; at the free end every shape moves. And each shorter bar moves all its pitches up together.',
    },
  },
};

export const BAR_CHIMES_PAGES = makeMetalPages(SPEC);
export const BAR_CHIMES_STEP_COUNTS = { instrument: 3, sound: 3, setting: 2 } as const;
