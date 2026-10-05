/**
 * A11 ACCORDION — its pages: the free-reed journey (shared/freereed/
 * freeReedPages) with the accordion's own words, drawings and anchors.
 *
 *   BELLOWS (the variant) is a moment of the push–pull cycle: closed, half
 *   open, fully open. The bass side — and its outlets, its starting point's
 *   distance, its delay to each mic — moves with it; every stand stays
 *   outside the whole travel. The sound page's third step drives the
 *   bellows continuously (a fader) and reads a fixed mic's distance to each
 *   side as they move.
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing loops.
 */
import { useState } from 'react';
import type { DocumentedZone } from '../../engine/model/types.ts';
import { fmtLen, fmtMs } from '../../engine/model/units.ts';
import { C20 } from '../../engine/physics/twoMic.ts';
import { Body, Card, Landing, Note, Point } from '../../engine/kit';
import type { MikingStep } from '../../engine/steps';
import type { PageProps } from '../../pages/pageTypes';
import type { HandSpec } from '../shared/hand/handPages';
import { VariantChips } from '../shared/metal/metalPages';
import { makeFreeReedPages, type FreeReedSpec } from '../shared/freereed/freeReedPages';
import { A11_ART, ACC_FRONT, BellowsCycle } from './art';
import { A11_ZONES, CENTRE_Z } from './geometry.ts';
import { bassBoxAt, BODY, FLOOR_Y, TREBLE } from './model.ts';

const zoneOf = (id: string) => A11_ZONES.find((z) => z.id === id)!;
const ONE = zoneOf('ac.one').start;
const BASS_MIC = zoneOf('ac.bass').start.p;
const MID_X = (TREBLE.x0 + TREBLE.x1) / 2;
const dist3 = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ── HOW IT SOUNDS, step 3: the bellows' cycle and the two sides ── */
function useBellows(_p: PageProps): MikingStep {
  const [t, setT] = useState(0.5);
  const [push, setPush] = useState(false);
  const [moved, setMoved] = useState(false);
  const top = 100 + (264 - 100) * t;
  const bottom = 100 + (600 - 100) * t;
  const b = bassBoxAt(top, bottom);
  const out = { x: MID_X, y: b.outlets.y, z: b.outlets.z };
  const dBass = dist3(BASS_MIC, out);
  const dTreble = dist3(BASS_MIC, { x: 5, y: 0, z: 0 });
  const dt = ((dTreble - dBass) / (C20 * 1000)) * 1000;
  const label = t < 0.05 ? 'CLOSED' : t > 0.95 ? 'FULLY OPEN' : `${Math.round(t * 100)} % OPEN`;
  return {
    key: 'bellows',
    title: 'Bellows and two sides',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <BellowsCycle
          w={w}
          h={h}
          t={t}
          push={push}
          mic={{ u: -BASS_MIC.z, v: BASS_MIC.y }}
          accessibilityLabel={`The accordion from the audience, the bellows ${label.toLowerCase()}, ${push ? 'pushing' : 'pulling'}. A mic on a stand beyond the bass side is ${fmtLen(dBass)} from the bass outlets and ${fmtLen(dTreble)} from the treble grille.`}
        />
      ),
      badge: 'A simplified picture · the sizes are a drawing · straight paths, no room · silent',
      bezel: [
        { k: 'BELLOWS', v: label, flex: 1.3 },
        { k: 'MIC → BASS', v: fmtLen(dBass), flex: 1.1 },
        { k: 'MIC → TREBLE', v: fmtLen(dTreble), flex: 1.1 },
        { k: 'TREBLE LATER BY', v: fmtMs(dt), flex: 1.2 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'bellows',
          label: 'BELLOWS',
          value: t,
          onChange: (v) => {
            setT(Math.round(v * 20) / 20);
            setMoved(true);
          },
          format: () => `${label} · the bass side ${fmtLen(Math.abs(b.ib.z - TREBLE.z0))} from the treble side at the bottom`,
          formatShort: () => label.split(' ')[0],
        },
        { kind: 'toggle', id: 'dir', label: push ? 'PUSH' : 'PULL', value: push, onToggle: () => setPush((x) => !x) },
      ],
      initialParam: 'bellows',
    },
    well: (
      <>
        <Landing looking="The accordion from the audience · a mic on a stand beyond the bass side" prompt="Drag BELLOWS through the cycle and switch PUSH / PULL. Watch the bass side move — and the mic’s distances." />
        <Card>
          <Point title="TWO SIDES, ONE MOVING">{`Both sides sound: the treble reeds through the grille, the bass reeds through the bass side. The bass side moves with every push and pull — so this mic is now ${fmtLen(dBass)} from it, and the treble side’s sound reaches it ${fmtMs(Math.abs(dt))} ${dt >= 0 ? 'after' : 'before'} the bass side’s.`}</Point>
        </Card>
        <Note>On a piano accordion a key gives the same note on the push and the pull; on a diatonic button accordion the note changes with the direction. Either way, the air flows through the reeds both ways — and the bellows are the air source, not a place to point a mic into.</Note>
        {moved ? <Note tone="ok">The treble side stayed put; the bass side moved — so a fixed mic’s distance, its level and the timing between the two sides all change through the phrase. A fixed delay or polarity setting cannot follow that.</Note> : null}
      </>
    ),
  };
}

/* ── MICROPHONES: the mounts and the built-in mics (never dragged) ── */
const MOUNTED = (
  <>
    <Card>
      <Point title="ON THE INSTRUMENT · A MOUNT MADE FOR IT">A miniature on a mount made for the accordion moves with its side: its distance stays the same as the bellows move — helpful for a player who walks or turns. A common pair: a miniature on the bass side aimed at a sound hole, with a stand mic toward the treble. Close, it also hears more of the keys and the bellows.</Point>
      <Point title="ON THE STRAP">A small mic clipped to a shoulder strap — on the keyboard side or the bellows side — rides with the player. Never compress or load a strap the player relies on.</Point>
      <Point title="BUILT-IN MICS">Some accordions have their own mics or outputs: a practical live choice, but not the same as a mic at a listening distance. Ask what they capture and how the treble and bass are routed, and compare when you can.</Point>
    </Card>
    <Note tone="warn">Protect the instrument: the player’s consent before any mount, hardware made for this instrument, no drilling, no tape on a grille, no load on the air button, no cable through the bellows. Leave permanent installation to the owner or a qualified accordion technician. Give the cable slack for the full bellows cycle.</Note>
  </>
);

const AXES: HandSpec['axes'] = {
  x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the instrument’s front (x).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'in front of' : 'behind'} the instrument’s front` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v <= 0 ? 'above' : 'below'} the grille’s centre` },
  z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Toward the treble side (the player’s right) or the bass side (z).', fmt: (v) => `${fmtLen(Math.abs(v))} toward the ${v >= 0 ? 'treble side' : 'bass side'}` },
};

const worked = (z: DocumentedZone) => [
  { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we recommend you begin with an accordion — an integrated view of both sides, not a rule, and not a promise of a sound.`, cell: 3 },
  { title: 'MEASURED FROM', text: 'From the instrument’s front to the mic’s FRONT, rounded to ≈ 5 mm. The readout also says how far the mic is off the line through the instrument’s middle.', cell: 0 },
  { title: 'THE DISTANCE', text: z.band, cell: 0 },
  { title: 'CENTRED', text: 'Between the treble and the bass sides, so the two combine. Toward the treble favours the melody; toward the bass, the accompaniment.', cell: 1 },
  { title: 'THE AIM', text: `At the instrument — the lab counts anything within ±${z.aim?.maxOffAxis ?? 30}°. Compare farther and nearer at matched level, over both bellows directions.`, cell: 2 },
  { title: 'CLEARANCE', text: 'Outside the bellows’ whole travel, the hands, the straps and the elbows — and, for a seated player, the chair’s turn and the lower bellows arc. Stand legs and cables out of the way.', cell: 3 },
];

const HAND: HandSpec = {
  art: A11_ART,
  intro: 'This lesson is about putting microphones on an accordion — two sides that both sound, one of them moving. First the instrument itself: what it is, how the bellows’ air becomes notes, and where it sits with its player. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'ACCORDION', badge: '', label: '', box: { u0: -620, u1: 820, v0: -760, v1: 700 } },
  partsBox: { side: { u0: -620, u1: 400, v0: -700, v1: 500 }, top: { u0: -620, u1: 400, v0: -900, v1: 500 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: {
    items: [
      { id: 'player', box: { u0: BODY.backX - 30, u1: 40, v0: -880, v1: 260 }, scene: 'all', label: { u: -220, v: 360 } },
      { id: 'wedge', box: { u0: 1300, u1: 1700, v0: CENTRE_Z - 320, v1: CENTRE_Z + 320 }, scene: 'stage', label: { u: 1500, v: CENTRE_Z + 400 } },
      { id: 'side', box: { u0: 1020, u1: 1480, v0: -1560, v1: -1140 }, scene: 'stage', label: { u: 1250, v: -1050 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -1500 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2350, v: 1800 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: 900, v1: 1040 }, scene: 'studio', label: { u: 200, v: 820 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the accordionist facing the audience, the bass side reaching toward the band, a wedge downstage, a side-fill on the bass side, the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the accordionist, no monitors on the floor.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The player faces the audience with the accordion on their chest: the treble side on their right, the bass side on their left — moving out and in with the bellows.',
    before: [
      { title: 'ASK THE PLAYER', text: 'Which accordion and registers? Are the bass notes and chords essential to the arrangement, or does a bass player carry them? Will they stand, sit or move — and how far do the bellows and the bass side travel?' },
      { title: 'WATCH A FULL PASSAGE', text: 'Low bass, full chords, the treble melody, quick articulation, opening AND closing strokes, the softest and loudest passage — with the bellows at full stretch. Never make the player constrain their technique for a stand.' },
      { title: 'NOTHING ON THE INSTRUMENT UNASKED', text: 'No clip, tape or cable on the accordion, its grille, its straps or its bellows without the player’s agreement and hardware made for it. A cable that catches the bellows is a stop.' },
    ],
  },
  mic: {
    intro: 'No brand and no special “accordion mic” is required for a stand. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts. An omni can combine both sides in a quiet room; a directional mic helps on a stage. A miniature on a mount made for the instrument moves with its side.',
    mountLine: (m) => (m.mount === 'clip' ? 'Mount: on a mount made for the accordion, on a side — with the player’s agreement; never on the bellows' : 'Mount: a stand of its own, outside the bellows’ whole travel, the hands, the straps and the elbows'),
    extra: MOUNTED,
  },
  axes: AXES,
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the bellows’ travel',
  worked: { zone: 'ac.one', mic: 'sdcCard', looking: 'Worked example · a small condenser · the accordion from above', label: 'The accordionist with a mic placed for you', done: 'That is the whole reading: where to begin, what it is measured from, the distance, centred, the aim, clearance. Next you place the mic yourself.', pieces: worked },
  place: {
    zone: 'ac.one',
    mic: 'sdcCard',
    looking: 'the accordionist from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then switch BELLOWS and watch the bass side move.',
    label: 'The accordionist, the bellows part-open',
    tried: (p) => `You predicted “${p}”. The treble side stays on the chest; the bass side moves out on a pull and in on a push — so a fixed mic’s distance to it changes all through the phrase.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we recommend you begin: one mic in front and centred, a dynamic facing the grille, a mic about 30 cm from the keyboard side, a mic just beyond the fully open bass side. They are starting points, not rules — every accordion, register and room is different.',
    'A farther position integrates the two sides and the room; toward the treble favours the melody, toward the bass the accompaniment. A close mic emphasises the nearest surface — and its mechanism. Verify both bellows directions and register changes, not a held note.',
    'The bass side moves: the bellows-side zone is measured from its FULLEST opening, so the stand stays outside the travel. On every push the side moves away from that mic — its level and timing change through the phrase.',
  ],
  ctx: {
    pose: { ...ONE, az: ONE.az + 8 },
    mic: 'smallDynCard',
    plan: { u0: -700, u1: 1900, v0: -1700, v1: 700 },
    side: { u0: -700, u1: 1900, v0: -800, v1: FLOOR_Y + 40 },
    creditWedge: 'wedge',
    looking: 'From above · a mic in front of the accordion',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — and keep the front on the instrument.',
    label: 'the accordionist with a mic in front.',
    learn: [
      { title: 'STUDIO', text: 'One mic where the two sides combine; compare nearer the treble and farther positions at matched level. Add a bass-side mic only if its contribution matters, and check the pair in mono over full strokes.' },
      { title: 'LIVE', text: 'The fewest open channels that give the balance. Keep the PA and monitors out of each mic’s strongest pickup across the player’s whole movement; raise levels gradually during a real passage. A mount or the built-in mics suit a walking player.' },
      { title: 'A MOVING SIDE', text: 'If the bass side — or a mic on it — moves toward a monitor, evaluate that position separately. A closer, mounted mic improves direct sound against spill, but reveals more keys and bellows.' },
    ],
  },
  two: {
    A: { zone: 'ac.treble', mic: 'sdcCard' },
    B: { zone: 'ac.bass', mic: 'sdcCard' },
    names: { A: 'TREBLE MIC', B: 'BASS MIC' },
    looking: 'Two mics · A on the keyboard side, B beyond the bass side',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then switch BELLOWS (below) and choose the bass SOURCE: watch the delay move.',
    label: 'The accordion with a treble mic (A) and a bass mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no reflections. A real accordion sounds from two sides at once, and one of them moves — so the comb changes all through the phrase. Read the notch depths as illustrative only, and judge the pair by ear, in mono, over full opening and closing strokes.',
    learn: [
      'Two channels are a balance decision, not an automatic hard stereo pair. First solo each mic while the player plays the part for that side; set gain so peaks do not clip; then balance them for the musical role.',
      'The moving sides change each mic-to-side distance, so a fixed phase correction or a calculated delay cannot hold for the whole phrase. If the sum hollows, move or rebalance — or let one mic carry the sound.',
    ],
  },
  practice: {
    orderNote: 'A one-mic accordion setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'ac.prac.gain',
    secondId: 'ac.prac.3',
    mixIds: ['ac.mix.1', 'ac.mix.2', 'ac.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a filter on the bass mic, what a null can promise, and what removes a delay.',
    sheetNote: 'For a real accordion, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = recommended starting points · grey dashes = the bellows’ travel and the player · pinch to zoom',
    clearance: 'Clearance comes first: the bellows’ whole travel — opening and closing, the lower arc most — the hands, the straps, the elbows and, seated, the chair’s turn. No stand leg or cable in that path; slack for the full cycle.',
    cardioidTried: 'What you just saw: a cardioid rejects most directly behind (180°). A mic facing the accordion turns its back toward the audience side — where a floor wedge often sits. The side-fill on the bass side sits off to its side: no null reaches it.',
    sourceNote: 'What you just saw: sound reaches two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE and the BELLOWS: each side, at each moment of the cycle, gives its own delay.',
  },
};

const SPEC: FreeReedSpec = {
  meet: {
    intro: HAND.intro,
    front: ACC_FRONT,
    figure: { title: 'ACCORDION', badge: 'A full-size piano accordion on its player, from the audience · a simplified drawing · switch BELLOWS', label: (v) => `A piano accordion on a standing player, seen from the audience: the treble side on the player’s right with its grille and keyboard edge, the pleated bellows ${v === 'in' ? 'closed' : v === 'out' ? 'fully open, fanned wider at the bottom' : 'half open'}, and the bass side on the player’s left under its strap.` },
    partsBadge: 'Tap a part to name it · switch BELLOWS to see the bass side move',
    partsLooking: (v) => `From the audience · the bellows ${v === 'in' ? 'closed' : v === 'out' ? 'fully open' : 'half open'}`,
    partsNote: 'Two sides and the bellows between them: the treble side stays on the chest; the bass side moves. Switch BELLOWS to see how far.',
    partsWarn: 'Nothing goes on the accordion, its straps or its bellows without the player’s agreement. Keep clear of the hands, the elbows and the bellows’ whole travel.',
    variantKey: 'BELLOWS',
  },
  sound: {
    voice: 'accordion',
    cells: [
      { k: 'REED', at: ['AT REST', 'THROUGH', 'BACK UP', 'SWINGING'], flex: 1.1 },
      { k: 'AIR', at: ['ARRIVES', 'A PUFF', 'A PUFF', 'PUFFS'], flex: 1 },
      { k: 'SOUND', at: ['—', '—', '—', 'BOTH SIDES'], flex: 1.1 },
    ],
    seqLooking: 'One reed cut open · its cell in the reed block, the plate and its slot',
    useWhere: useBellows,
    shapesNote: 'A real accordion reed is tapered and weighted at its tip, so its numbers differ — the picture shows which parts move. Each note has its own reed (and a register can add more, tuned together).',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real accordion sounds depends on the instrument, its registers, the player and the room. The pictures show where the sound comes from and where it leaves.',
  },
  hand: HAND,
};

export const A11_PAGES = makeFreeReedPages(SPEC);
export const A11_STEP_COUNTS = { instrument: 3, sound: 4, setting: 2 } as const;
export const A11_LESSON_ART = { ...A11_ART, pages: A11_PAGES, stepCounts: A11_STEP_COUNTS };
