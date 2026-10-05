/**
 * I12 GONG — its pages: the suspended-metal journey (shared/metal/
 * metalPages) with the gong's own words, drawings and anchors. GONG (tam-tam
 * or bossed) is chosen on every page that shows the instrument: identify the
 * gong before choosing an approach. The build-up is stepped pictures, never
 * played. FULLY SILENT; nothing loops.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { fmtLen } from '../../engine/model/units.ts';
import type { HandSpec } from '../shared/hand/handPages';
import { makeMetalPages, VariantChips, type MetalSpec } from '../shared/metal/metalPages';
import { BRONZE } from '../shared/metal/metalArt';
import { GONG_ZONES } from './geometry.ts';
import { CY, diameterOf, GONG, kindOf } from './model.ts';
import { GONG_FRONT, GongArt, gongHitTest, gongLabels, GongStrike } from './art';

export const GONG_ART = { Instrument: GongArt, labels: gongLabels, hitTest: gongHitTest };

const zoneOf = (id: string) => GONG_ZONES.find((z) => z.id === id)!;
const A0 = zoneOf('gg.A').start;

const HAND: HandSpec = {
  art: GONG_ART,
  intro: 'This lesson is about putting a microphone on a gong — but first the instrument itself: which kind of gong it is, how it makes its sound, and where it hangs with its player. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'GONG', badge: '', label: '', box: { u0: -800, u1: 800, v0: -2200, v1: 50 } },
  partsBox: { side: { u0: -800, u1: 800, v0: -2200, v1: 50 }, top: { u0: -800, u1: 800, v0: -800, v1: 800 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: {
    items: [
      { id: 'gong', box: { u0: -80, u1: 80, v0: -560, v1: 560 }, scene: 'all', label: { u: 130, v: 640, align: 'left' } },
      { id: 'player', box: { u0: 150, u1: 500, v0: -800, v1: -330 }, scene: 'all', label: { u: 330, v: -880 } },
      { id: 'wedge', box: { u0: 1450, u1: 1950, v0: -500, v1: 100 }, scene: 'stage', label: { u: 1700, v: 200 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -790 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2250, v: -1000 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: -1000, v1: -860 }, scene: 'studio', label: { u: 200, v: -780 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the gong in its frame with the player beside its struck face; a wedge downstage in front, the band upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the gong in its frame and the player, no monitors on the floor, the room's walls around.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The gong hangs in its frame, free to swing; the player stands beside the struck face with the mallet. Everything else fits round the swing and the mallet’s arc.',
    before: [
      { title: 'IDENTIFY THE GONG', text: 'An orchestral tam-tam (no boss, a broad bloom) or a bossed gong (a raised centre, a more pitch-centred sound)? Do not assume all gongs behave the same. Then ask for quiet and forceful strokes, rolls, the intended decay and any damping.' },
      { title: 'THE SWING AND THE SUSPENSION', text: 'The gong must swing freely without touching the stand. Check the cords, the stand’s rating, locks and feet with the owner or the venue’s crew — the gong and its suspension are theirs. Mark the full swing and the mallet’s arc.' },
      { title: 'LISTEN FIRST', text: 'From a safe, ordinary audience position, hear the whole rise and decay unamplified. Note the walls nearby, the monitors, and how far the gong can swing.' },
    ],
  },
  mic: {
    intro: 'No brand and no special gong mic is required. Choose by the perspective you want and what the job needs: the pattern, headroom for the strongest stroke, the power, the size, how it mounts. No diaphragm size alone guarantees bass or a tone — test the real mic at the real distance.',
    mountLine: (m) => (m.transducer === 'dynamic' ? 'Mount: a stand of its own, outside the swing and the mallet — robust on a stage' : 'Mount: a stand of its own, outside the swing and the mallet; never on the gong, its cords or its frame without approval'),
  },
  axes: {
    x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the struck face (x).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'in front of' : 'behind'} the gong` },
    y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown as a target.', fmt: (v) => `${fmtLen(Math.abs(v - CY))} ${v <= CY ? 'above' : 'below'} the gong’s centre` },
    z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Across the face: toward the player’s side or the far side (z).', fmt: (v) => `${fmtLen(Math.abs(v))} toward the ${v >= 0 ? 'far side' : 'player’s side'}` },
  },
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the swing',
  worked: {
    zone: 'gg.A',
    mic: 'sdcCard',
    looking: 'Worked example · a small condenser · the gong from above',
    label: 'The gong in its frame with a small condenser placed for you',
    done: 'That is the whole reading: where to begin, what it is measured from, the distance, the viewpoint, the aim, clearance. Next you place the mic yourself.',
    pieces: (z: DocumentedZone) => [
      { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we recommend you begin with a gong — a useful overall view, not a rule, and not a promise of a sound.`, cell: 3 },
      { title: 'MEASURED FROM', text: 'From the gong’s face while it hangs at rest, to the mic’s FRONT — rounded to ≈ 5 mm. The readout also says how far the mic is off the face’s centre line.', cell: 0 },
      { title: 'THE DISTANCE', text: z.band, cell: 0 },
      { title: 'OFF THE CENTRE LINE', text: 'Close to the line straight out of the face’s centre, at about the height where it is played — facing the broad radiating surface.', cell: 1 },
      { title: 'THE AIM', text: `At the face — the lab counts anything within ±${z.aim?.maxOffAxis ?? 25}°. Back away for more bloom and room; come closer for more presence: one change at a time.`, cell: 2 },
      { title: 'CLEARANCE', text: 'Outside the gong’s full swing and the mallet’s arc with its follow-through; the stand separately stable, its cable away from the player’s feet.', cell: 3 },
    ],
  },
  place: {
    zone: 'gg.A',
    mic: 'sdcCard',
    looking: 'the gong from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — and switch GONG to see the boss view.',
    label: 'The gong in its frame, the player beside it',
    tried: (p) => `You predicted “${p}”. Farther back, the mic hears more of the bloom and the room; closer, more presence and more of one local area. Compare the same passage at a similar level.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we recommend you begin, measured from the gong’s face at rest (or, for the boss view, from the boss). They are starting points, not rules: move from there and listen — every gong, mallet, player and room is different.',
    'A change in angle or distance also changes the room in the sound: compare the same passage at a similar level, one change at a time. Do not assume the strongest point is the centre, or that both faces sound the same.',
    'A tam-tam: compare a view that hears a broad area with a deliberately closer colour before deciding what is “natural”. A bossed gong: hear the player’s stroke acoustically first, then aim at the boss from a safe offset and compare a broader front view.',
  ],
  ctx: {
    pose: { ...A0, az: A0.az + 8 },
    mic: 'smallDynCard',
    plan: { u0: -800, u1: 2400, v0: -1100, v1: 1100 },
    side: { u0: -800, u1: 2400, v0: -2300, v1: 60 },
    creditWedge: 'wedge',
    looking: 'From above · a mic in front of the gong',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — and keep the front on the gong.',
    label: 'the gong with a mic in front of it.',
    learn: [
      { title: 'STUDIO', text: 'One clear main view first; then a coincident pair, a wider pair or a room layer if the room is part of the music. Keep the whole rise and decay in the evaluation; compare strong and soft passages.' },
      { title: 'LIVE', text: 'One directional mic as close as practical outside the swing, its null toward the loudest wedge. Bring monitor sends up cautiously and stop if ringing begins. A house mic may feed little or no gong to the player’s wedge.' },
      { title: 'NEVER IN THE WAY', text: 'Never run a boom through the gong’s travel, or behind the player where it blocks an exit. Elevated or flown mics need approved hardware and qualified rigging.' },
    ],
  },
  two: {
    A: { zone: 'gg.A', mic: 'sdcCard' },
    B: { zone: 'gg.D', mic: 'sdcCard' },
    names: { A: 'FRONT MIC', B: 'ROOM MIC' },
    looking: 'Two mics · A in front, B farther out in the room',
    prompt: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.',
    label: 'The gong with a front mic (A) and a room mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no reflections. A real gong radiates from its whole face, front and back, and its decay evolves — so the comb is not one fixed pattern. Read the notch depths as illustrative only, and judge the blend by ear, in mono, through the whole decay.',
    learn: [
      'Front plus room: independent control of definition and decay — once the front mic works on its own. The room mic hears the gong several milliseconds later, so the combined tone can change.',
      'Solo each mic, then blend at the intended level; collapse to mono and compare the attack and the decay at several strengths. If it turns hollow or loses body, change distance, angle or level; try polarity as a diagnostic. A delay set on the desk is a mix decision — recheck the evolving decay.',
    ],
  },
  practice: {
    orderNote: 'A one-mic gong setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'gg.prac.gain',
    secondId: 'gg.prac.3',
    mixIds: ['gg.mix.1', 'gg.mix.2', 'gg.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a pair that stays solid in mono, what a null can promise, and polarity versus delay.',
    sheetNote: 'For a real gong, with the owner’s and the player’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};

const SPEC: MetalSpec = {
  hand: HAND,
  meet: {
    intro: HAND.intro,
    front: GONG_FRONT,
    figure: { title: 'GONG', badge: 'A gong in its frame, face-on from the audience · switch GONG for the other kind', label: (v) => (kindOf(v) === 'bossed' ? 'An 18 inch bossed gong seen face-on in a square frame stand, hanging on two cords, its raised boss in the middle; the player beside it with a felt mallet.' : 'A 32 inch orchestral tam-tam seen face-on in a square frame stand, hanging on two cords, its broad face with no boss and a turned rim; the player beside it with a felt mallet.') },
    partsBadge: 'A gong in its frame, face-on · tap a part to name it',
    partsLooking: (v) => (kindOf(v) === 'bossed' ? 'From the audience · a bossed gong' : 'From the audience · an orchestral tam-tam'),
    partsNote: 'Two kinds of gong matter for a mic: switch GONG to compare the bossless tam-tam and the bossed gong. Identify yours first.',
    partsWarn: 'The gong, its cords and its frame are the owner’s: never attach a mic to them without approval, never restrain the gong, and keep clear of its swing and the mallet.',
    variantKey: 'GONG',
  },
  sound: {
    Strike: GongStrike,
    strikeTitle: 'Stroke to sound',
    strikeBadge: 'The order of events, not their speed or level · blue + toward you, amber − away · silent',
    strikeLooking: (v) => (kindOf(v) === 'bossed' ? 'From the audience · the bossed gong’s face' : 'From the audience · the tam-tam’s face'),
    cells: (v) => [
      { k: 'MALLET', at: ['CONTACT', 'OFF', 'OFF', 'OFF'], flex: 0.9 },
      { k: 'FACE', at: kindOf(v) === 'bossed' ? ['AT REST', 'BROAD', 'BOSS TONE', 'RINGING'] : ['AT REST', 'BROAD', 'BUILD-UP', 'RINGING'], flex: 1.1 },
      { k: 'SOUND', at: ['—', '—', kindOf(v) === 'bossed' ? 'STEADY' : 'SWELLS', 'BOTH FACES'], flex: 1.1 },
    ],
    after: (v) => (kindOf(v) === 'bossed' ? 'It decays slowly round the boss’s tone unless the player damps it. Very close to the boss, a mic exaggerates the mallet’s impact — compare a broader view.' : 'It decays slowly after the bloom unless the player damps it — keep the whole rise and decay in every comparison. The swell is shown, never played; its speed depends on the gong and the stroke.'),
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real gong sounds depends on the gong, the mallet, the stroke and the room. The pictures show where the sound comes from and where it leaves.',
    variantKey: 'GONG',
    shapes: {
      kind: 'disc',
      set: 'free',
      diameterMm: (v) => diameterOf(v),
      strikes: (v) =>
        kindOf(v) === 'bossed'
          ? [
              { id: 'boss', label: 'ON THE BOSS', words: 'on the boss', blurb: 'The raised centre — where a bossed gong is meant to be struck.', r: 0 },
              { id: 'near', label: 'NEAR THE BOSS', words: 'just off the boss', blurb: 'A couple of inches from the boss: a thicker mix of tones.', r: 0.3 },
              { id: 'outer', label: 'OUT TOWARD THE RIM', words: 'out toward the rim', blurb: 'Far from the boss.', r: 0.75 },
            ]
          : [
              { id: 'off', label: 'A LITTLE OFF CENTRE', words: 'a little off centre', blurb: 'The usual playing area, drawn a quarter of the way out.', r: 0.25 },
              { id: 'centre', label: 'THE CENTRE', words: 'at the exact centre', blurb: 'The middle of the face.', r: 0 },
              { id: 'outer', label: 'OUT TOWARD THE RIM', words: 'out toward the rim', blurb: 'Most of the way to the rim.', r: 0.75 },
            ],
      metal: BRONZE,
      boss: (v) => (kindOf(v) === 'bossed' ? GONG.bossD.mm / 2 : undefined),
      rim: true,
      title: 'The face’s shapes',
      badge: 'A simplified picture: a flat disc free at its edge · blue + toward you, amber − away · white dashes = still lines',
      looking: (v) => `The face, face-on · ${Math.round(diameterOf(v) / 10)} cm across · one vibration shape`,
      prompt: 'Step through SHAPE, then move the STROKE: off centre, the exact centre, out toward the rim. Which shapes does a centre stroke leave still?',
      strikeWord: 'STROKE',
      subject: 'The gong’s face, seen face-on',
      notes: (v) => [
        'A shape is set moving only as much as the face moves where the mallet lands. At the exact centre, every shape with a still line across the face stands still — so a centre stroke drives only the ring-shaped ones: fewer shapes, a more centred pitch. Off centre, many more move.',
        kindOf(v) === 'bossed'
          ? 'This is a flat disc of even thickness. A real bossed gong’s boss and shoulder shape and concentrate its main tone, so its numbers differ — the picture shows which shapes a stroke can reach.'
          : 'This is a flat disc of even thickness, hung free by its rim. A real tam-tam is slightly domed with a turned rim, and hit hard its energy spreads into finer shapes after the stroke — the build-up you stepped through.',
      ],
      tried: 'At the exact centre only the ring-shaped shapes move; off centre, nearly all of them do. Where the mallet lands is part of the gong’s colour.',
    },
  },
};

export const GONG_PAGES = makeMetalPages(SPEC);
export const GONG_STEP_COUNTS = { instrument: 3, sound: 3, setting: 2 } as const;
