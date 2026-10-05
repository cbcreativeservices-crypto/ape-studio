/**
 * I06b FINGER CYMBALS — its pages: the suspended-metal journey (shared/
 * metal/metalPages) with the finger cymbals' own words, drawings and
 * anchors. Two ways of playing, two sets of placement words: held still
 * (the default) and danced (handByVariant.dance). FULLY SILENT.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { fmtLen } from '../../engine/model/units.ts';
import type { HandSpec } from '../shared/hand/handPages';
import { makeMetalPages, VariantChips, type MetalSpec } from '../shared/metal/metalPages';
import { BRASS } from '../shared/metal/metalArt';
import { FC_ZONES } from './geometry.ts';
import { FC, P0, RA } from './model.ts';
import { FC_FRONT, FingerCymbalsArt, fingerCymbalsHitTest, fingerCymbalsLabels, FingerCymbalsStrike } from './art';

export const FINGER_CYMBALS_ART = { Instrument: FingerCymbalsArt, labels: fingerCymbalsLabels, hitTest: fingerCymbalsHitTest };

const zoneOf = (id: string) => FC_ZONES.find((z) => z.id === id)!;
const A0 = zoneOf('fc.A').start;
const H0 = zoneOf('fc.high').start;

const pieces = (z: DocumentedZone, view: string, clear: string) => [
  { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we recommend you begin — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
  { title: 'MEASURED FROM', text: `From ${z.refSurface === 'dance' ? 'the dancer’s hands, in the middle of the route' : 'the middle of the area where the cymbals are played'}: the readout measures to the mic’s FRONT, rounded to ≈ 5 mm.`, cell: 0 },
  { title: 'THE DISTANCE', text: z.band, cell: 0 },
  { title: 'THE VIEWPOINT', text: view, cell: 1 },
  { title: 'THE AIM', text: `At the playing area as a whole — the lab counts anything within ±${z.aim?.maxOffAxis ?? 25}°. Distance, height and angle are separate things to try.`, cell: 2 },
  { title: 'CLEARANCE', text: clear, cell: 3 },
];

const HELD: HandSpec = {
  art: FINGER_CYMBALS_ART,
  intro: 'This lesson is about putting a microphone on finger cymbals — but first the instrument itself: what it is, how it makes its sound, and where it is played. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'FINGER CYMBALS', badge: '', label: '', box: { u0: -600, u1: 400, v0: -1800, v1: -900 } },
  partsBox: { side: { u0: -600, u1: 400, v0: -1800, v1: -900 }, top: { u0: -600, u1: 400, v0: -400, v1: 400 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: {
    items: [
      { id: 'pair', box: { u0: -60, u1: 60, v0: -60, v1: 80 }, scene: 'all', label: { u: 120, v: -170, align: 'left' } },
      { id: 'player', box: { u0: -560, u1: -240, v0: -290, v1: 290 }, scene: 'all', label: { u: -400, v: -380 } },
      { id: 'wedge', box: { u0: 1350, u1: 1850, v0: 50, v1: 650 }, scene: 'stage', label: { u: 1600, v: 760 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -790 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2250, v: -1000 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: -1000, v1: -860 }, scene: 'studio', label: { u: 200, v: -780 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the player with finger cymbals in front of the chest; a wedge downstage on the audience side, louder players upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the player standing, no monitors on the floor, the room's walls around.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The player stands with the cymbals in front of the chest — or dances across the stage. Everything else fits round the hands, and the route.',
    before: [
      { title: 'ASK FOR THE WHOLE PASSAGE — OR DANCE', text: 'Accents, fast figures, soft notes and deliberate cutoffs; held still or danced; turns, body position and where the player moves. Do not assume a dancer stands still at chest height.' },
      { title: 'CHECK THE STRAPS', text: 'Straps or finger loops in good order — a loose cymbal can fall or fly. Keep stands and cables where nothing can snag. The cymbals and their care are the player’s.' },
      { title: 'LISTEN AT A SAFE POSITION', text: 'Hear the attack and the ring unamplified, soft and strong, before any mic goes up — and watch how the player releases the pair after each stroke.' },
    ],
  },
  mic: {
    intro: 'No brand and no special finger-cymbal mic is required. Choose by what the job needs: the pattern, the power, its size, how it mounts, and headroom for very brief, bright peaks. Try what you have first and compare at matched loudness.',
    mountLine: (m) => (m.transducer === 'dynamic' ? 'Mount: a stand clear of both hands — robust on a stage' : 'Mount: a stand clear of both hands and, for a dancer, the whole route'),
  },
  axes: {
    x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the audience side (x).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'in front of' : 'behind'} the playing area` },
    y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown as a target.', fmt: (v) => `${fmtLen(Math.abs(v - P0.y))} ${v <= P0.y ? 'above' : 'below'} the cymbals` },
    z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Toward the player’s left or right (z).', fmt: (v) => `${fmtLen(Math.abs(v))} to the player’s ${v >= 0 ? 'right' : 'left'}` },
  },
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the hands’ path',
  worked: {
    zone: 'fc.A',
    mic: 'sdcCard',
    looking: 'Worked example · a small condenser · the cymbals from the side',
    label: 'Finger cymbals held still, with a small condenser placed for you',
    done: 'That is the whole reading: where to begin, what it is measured from, the distance, the viewpoint, the aim, clearance. Next you place the mic yourself.',
    pieces: (z) => pieces(z, 'In front and a little above, so the mic sees both cymbals — and the release after each stroke.', 'Outside both hands’ whole path, the drop included; never between the two cymbals or where fingers can strike it.'),
  },
  place: {
    zone: 'fc.A',
    mic: 'sdcCard',
    looking: 'the cymbals from the side',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then switch PLAYED to see a dancer.',
    label: 'Finger cymbals held still in front of the player',
    tried: (p) => `You predicted “${p}”. Farther back, the attack and the ring blend with the room, and small hand movements change the level less. Closer, more attack and isolation.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we recommend you begin, measured from where the cymbals are played. They are starting points, not rules: move from there and listen — every pair, player and room is different.',
    'Change one thing at a time, and replay the whole phrase rather than one ideal hit. Judge whether every stroke stays audible, whether the attack drowns the ring, and whether movement changes the level or tone. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
    'For a dancer, a stand spot can miss the source as it leaves the pickup area: map the route, listen to the existing stage mics, and try a wider or higher view — never restrict the dance to meet a mic.',
  ],
  ctx: {
    pose: { ...A0, az: A0.az },
    mic: 'smallDynCard',
    plan: { u0: -700, u1: 1950, v0: -900, v1: 900 },
    side: { u0: -700, u1: 1950, v0: -1800, v1: 40 },
    creditWedge: 'wedge',
    looking: 'From above · a mic in front of the cymbals',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — and keep the front on the cymbals.',
    label: 'the finger cymbals with a mic in front of them.',
    learn: [
      { title: 'STUDIO', text: 'A still player: one moderate-distance spot, compared with a wider view in a good room. Record the silence after an accent too. In an ensemble, listen to the main pair and overheads first.' },
      { title: 'LIVE', text: 'A fixed station: a stand-mounted directional mic clear of both hands. A dancer: the stage mics or a broader, higher pickup — more spill, less feedback margin. A wearable mic is not a default: it changes with every move.' },
      { title: 'THE WEDGE', text: 'Keep the finger cymbals low in, or out of, the monitor unless the player needs them: the bright attack raises the feedback risk.' },
    ],
  },
  two: {
    A: { zone: 'fc.A', mic: 'sdcCard' },
    B: { zone: 'fc.B', mic: 'sdcCard' },
    names: { A: 'CLOSER MIC', B: 'FARTHER MIC' },
    looking: 'Two mics · A closer, B farther back',
    prompt: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.',
    label: 'Finger cymbals with a closer mic (A) and a farther mic (B)',
    warn: 'This simplified graph shows one point source and straight paths. Real cymbals move with the hands, so the delay between two mics changes as they play. Read the notch depths as illustrative only, and judge the pair by ear, in mono.',
    learn: [
      'A common situation: a spot, and another mic that hears the cymbals too — the main pair, a percussion overhead, or a second view. Each hears them at a different time. Two cymbals do not need two mics.',
      'Compare the mics together at the intended levels in MONO. If the attack changes or the ring turns coloured, move, re-aim or rebalance first; try polarity as a diagnostic, not an automatic switch.',
    ],
  },
  practice: {
    orderNote: 'A one-mic finger-cymbal setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'fc.prac.gain',
    secondId: 'fc.prac.3',
    mixIds: ['fc.mix.1', 'fc.mix.2', 'fc.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: what a second pair tells you, what a null can promise, and polarity versus delay.',
    sheetNote: 'For a real pair and player, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};

/** Danced: the zones, the worked example and the pair are the dance's own. */
const DANCE: HandSpec = {
  ...HELD,
  worked: {
    ...HELD.worked,
    zone: 'fc.high',
    looking: 'Worked example · a small condenser · a dancer from the side',
    label: 'A dancer with finger cymbals, with a small condenser placed for you',
    pieces: (z) => pieces(z, 'High and in front, outside the whole dance envelope, so the hands stay in view along the route.', 'Outside the dancer’s whole route, arms and turns; the stand and cable off the dance path entirely.'),
  },
  place: { ...HELD.place, zone: 'fc.high', looking: 'a dancer from the side', label: 'A dancer with finger cymbals on a route across the stage', prompt: 'Drag the mic (or use POSITION and AIM). Rest it in two different blue zones — outside the dancer’s whole space.' },
  ctx: { ...HELD.ctx, pose: { ...H0 }, plan: { u0: -1000, u1: 2700, v0: -2500, v1: 2500 }, side: { u0: -1000, u1: 2700, v0: -3050, v1: 120 }, looking: 'From above · a mic high in front of the dancer', label: 'a dancer with finger cymbals and a mic high in front.' },
  two: { ...HELD.two, A: { zone: 'fc.high', mic: 'sdcCard' }, B: { zone: 'fc.far', mic: 'sdcCard' }, names: { A: 'HIGH MIC', B: 'WIDER MIC' }, looking: 'Two mics · A high in front, B farther out', label: 'A dancer with a high mic (A) and a wider mic (B)' },
};

const SPEC: MetalSpec = {
  hand: HELD,
  handByVariant: { dance: DANCE },
  meet: {
    intro: HELD.intro,
    front: FC_FRONT,
    figure: { title: 'FINGER CYMBALS', badge: 'A pair of 5.5 and 4.8 cm brass finger cymbals, from the audience · the hold is a drawing choice', label: (v) => (v === 'dance' ? 'A dancer seen from the audience, arms raised, a pair of finger cymbals on the thumb and a finger of each hand, with arrows showing the route across the stage.' : 'A pair of small brass finger cymbals seen from the audience: one held flat by its strap, the other above it, tipped edge-first, about to drop into it.') },
    partsBadge: 'A pair of brass finger cymbals · tap a part to name it',
    partsLooking: (v) => (v === 'dance' ? 'From the audience · a dancer, a pair on each hand' : 'From the audience · the pair close up'),
    partsNote: 'Two small brass plates, each with a strap through its centre. Switch PLAYED to see them worn by a dancer.',
    partsWarn: 'The cymbals and their straps are the player’s: never clip a mic to them, and never limit a dance to suit a microphone.',
    variantKey: 'PLAYED',
  },
  sound: {
    Strike: FingerCymbalsStrike,
    strikeTitle: 'Stroke to sound',
    strikeBadge: 'The order of events, not their speed · close up, motion drawn larger · silent',
    strikeLooking: (v) => (v === 'dance' ? 'Close up · a thumb-and-finger pair' : 'Close up · the held pair, edge-on'),
    cells: () => [
      { k: 'CONTACT', at: ['—', 'EDGES MEET', 'APART', 'APART'], flex: 1.1 },
      { k: 'PLATES', at: ['AT REST', 'STRUCK', 'RINGING', 'RINGING'], flex: 1 },
      { k: 'SOUND', at: ['—', '—', '—', 'ALL ROUND'], flex: 1 },
    ],
    after: (v) => (v === 'dance' ? 'They ring on until the dancer damps them or strikes again — and the dancer keeps moving, so the level at a fixed mic rises and falls along the route.' : 'They ring on until the player lets them fade or damps them. Pressed together after the stroke, they would choke — the release matters as much as the stroke.'),
    silentNote: 'This lab never plays a sound and draws no frequency curve: how real finger cymbals sound depends on the pair, the contact and the player. The pictures show where the sound comes from and where it leaves.',
    variantKey: 'PLAYED',
    shapes: {
      kind: 'disc',
      set: 'centreHeld',
      diameterMm: () => FC.dA.mm,
      strikes: () => [
        { id: 'edge', label: 'NEAR THE EDGE', words: 'near the edge', blurb: 'Where the other cymbal’s edge usually lands.', r: 0.88 },
        { id: 'bow', label: 'HALFWAY OUT', words: 'halfway out', blurb: 'Between the dome and the edge.', r: 0.6 },
        { id: 'dome', label: 'BY THE DOME', words: 'by the dome', blurb: 'Close to the raised centre and the strap.', r: 0.32 },
      ],
      metal: BRASS,
      knot: true,
      title: 'The plate’s shapes',
      badge: 'A simplified picture: a flat disc held at its centre · blue + toward you, amber − away · white dashes = still lines',
      looking: () => `One cymbal face-on · ${Math.round(RA * 2) / 10} cm across · one vibration shape`,
      prompt: 'Step through SHAPE, then move the STROKE in toward the dome. Which shapes does a stroke near the edge drive?',
      strikeWord: 'STROKE',
      subject: 'A 5.5 centimetre finger cymbal seen face-on',
      notes: () => [
        'A shape is set moving only as much as the plate moves where the edge lands. Near the edge, most shapes move a lot — the bright, piercing ring. The strap holds the centre, so shapes that would move the centre are held still.',
        'This is a flat disc of even thickness. A real finger cymbal is domed and small, so its pitches are high and its numbers differ; thin and thick pairs differ too — compare real pairs by ear.',
      ],
      tried: 'Near the edge nearly every shape moves under the stroke; nearer the dome, fewer do. The contact point is part of the source’s colour.',
    },
  },
};

export const FINGER_CYMBALS_PAGES = makeMetalPages(SPEC);
export const FINGER_CYMBALS_STEP_COUNTS = { instrument: 3, sound: 3, setting: 2 } as const;
