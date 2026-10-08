/**
 * A10 HARMONICA — its pages: the free-reed journey (shared/freereed/
 * freeReedPages) with the harmonica's own words, drawings and anchors.
 *
 *   PATH (the variant) is the signal path: a stand mic at the acoustic
 *   harmonica, or a mic on the harp amp's speaker. Placement offers both
 *   (chips in the well); STUDIO OR LIVE is the stand mic's (the wedge in
 *   its null); TWO MICROPHONES is the amp's (a close and a farther mic).
 *   The cupped harp mic lives in the hands: the sound page's third step and
 *   the setting page's paths.
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing loops.
 */
import { useState } from 'react';
import type { DocumentedZone } from '../../engine/model/types.ts';
import { fmtLen } from '../../engine/model/units.ts';
import { Body, Card, Landing, Note, Point } from '../../engine/kit';
import type { MikingStep } from '../../engine/steps';
import type { PageProps } from '../../pages/pageTypes';
import type { HandSpec } from '../shared/hand/handPages';
import { VariantChips } from '../shared/metal/metalPages';
import { SpkLink } from '../shared/keys/keysPages';
import { makeFreeReedPages, type FreeReedSpec } from '../shared/freereed/freeReedPages';
import { A10_ART, HandChamber, HARP_FRONT } from './art';
import { HarpPaths, HARP_PATCHES, harpPatchVerdict, type HarpPatch } from './paths';
import { A10_ZONES } from './geometry.ts';
import { AMP, FLOOR_Y, H0, HAND_STATES, type HandState } from './model.ts';

const zoneOf = (id: string) => A10_ZONES.find((z) => z.id === id)!;
const STAND = zoneOf('hm.stand').start;
const G = AMP.grilleX;

/* ── HOW IT SOUNDS, step 3: the hands' chamber ── */
function useHandChamber(_p: PageProps): MikingStep {
  const [state, setState] = useState<HandState>('half');
  const s = HAND_STATES.find((q) => q.id === state)!;
  const out = state === 'open' ? 'STRAIGHT OUT' : state === 'half' ? 'THROUGH THE GAP' : state === 'cupped' ? 'ROUND THE HANDS' : 'INTO THE MIC';
  return {
    key: 'hands',
    title: 'The hands’ chamber',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <HandChamber w={w} h={h} state={state} accessibilityLabel={`The harmonica at the lips in the hands, from the side: ${s.label.toLowerCase()}. ${s.text}`} />,
      badge: 'A simplified picture of the hands round the harmonica · the drawing changes, nothing is played',
      bezel: [
        { k: 'HANDS', v: s.short, flex: 1.2 },
        { k: 'CHAMBER', v: state === 'open' ? 'OPEN' : state === 'half' ? 'PARTLY' : 'CLOSED', flex: 1 },
        { k: 'SOUND LEAVES', v: out, flex: 1.5 },
      ],
      params: [
        {
          kind: 'options',
          id: 'hands',
          label: 'HANDS',
          valueLabel: s.short,
          selectedId: state,
          onSelect: (id) => setState(id as HandState),
          sticky: true,
          options: HAND_STATES.map((q) => ({ id: q.id, label: q.label, blurb: q.text })),
        },
      ],
      initialParam: 'hands',
    },
    well: (
      <>
        <Landing looking="The harmonica at the lips · from the player’s right" prompt="Choose HANDS: open, partly cupped, fully cupped, or cupped round a harp mic. Where does the sound leave?" />
        <Card>
          <Point title={s.label}>{s.text}</Point>
        </Card>
        <Note>The hands’ chamber is part of the player’s sound — compare open, partly and fully cupped phrases at matched level, and write down the hand position. Fully enclosing the harmonica and a dedicated harp mic is a recognised amplified technique; covering a directional vocal mic’s grille is not the same thing.</Note>
        {state === 'mic' ? <Note tone="warn">A harp mic in the hands feeds an amp: the hands, the mic, the amp and its speaker are all part of the amplified sound. Start the mic’s own volume control low before you plug in.</Note> : null}
      </>
    ),
  };
}

/* ── THE SETTING, step 2: the two paths and one patch, checked ── */
function usePaths(_p: PageProps): MikingStep[] {
  const [patch, setPatch] = useState<HarpPatch>('harpToAmp');
  const P = HARP_PATCHES.find((q) => q.id === patch)!;
  const v = harpPatchVerdict(patch);
  return [
    {
      key: 'paths',
      title: 'Two paths to the desk',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <HarpPaths w={w} h={h} patch={patch} accessibilityLabel={`Two paths from the harmonica to the desk: acoustic, a stand mic; amplified, a harp mic into the amp, a mic on its speaker. Checked patch: ${P.label}: ${v === 'ok' ? 'OK' : v === 'check' ? 'check first' : 'stop'}.`} />,
        badge: 'Each path is its own source · solid = cables, blue = sound in the air · amber dashes = check first, red = never',
        bezel: [
          { k: 'PATCH', v: P.short, flex: 1.8 },
          { k: 'VERDICT', v: v === 'ok' ? 'OK' : v === 'check' ? 'CHECK FIRST' : 'STOP', tint: v === 'ok' ? '#5bff85' : v === 'check' ? '#ffc64d' : '#ff5a48', flex: 1.2 },
        ],
        params: [
          {
            kind: 'options',
            id: 'patch',
            label: 'PATCH',
            valueLabel: P.short,
            selectedId: patch,
            onSelect: (id) => setPatch(id as HarpPatch),
            sticky: true,
            options: HARP_PATCHES.map((q) => ({ id: q.id, label: q.label, blurb: q.text })),
          },
        ],
        initialParam: 'patch',
      },
      well: (
        <>
          <Landing looking="Two paths from the harmonica to the desk" prompt="Choose a PATCH and read whether it is safe. Each path hears something different." />
          <Card>
            <Point title={P.label.toUpperCase()}>{P.text}</Point>
          </Card>
          <Body>These are separate tone choices. A mic on the amp hears the amplified system — the harp mic, the amp, its distortion and the speaker. A mic in front of the harmonica hears an acoustic performance — and, on a stage, the nearby amp and PA too. Compare each feed alone and summed, and mute unused open mics.</Body>
          <SpkLink />
        </>
      ),
    },
  ];
}

const AXES_ACOUSTIC: HandSpec['axes'] = {
  x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the harmonica, along the line the player faces (x).', fmt: (v) => `${fmtLen(Math.abs(v - H0.x))} ${v >= H0.x ? 'in front of' : 'behind'} the harmonica` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y): about mouth and hand height is where to begin.', fmt: (v) => `${fmtLen(Math.abs(v - H0.y))} ${v <= H0.y ? 'above' : 'below'} the harmonica` },
  z: { label: 'ACROSS', short: 'ACROSS', blurb: 'To the player’s right or left (z).', fmt: (v) => `${fmtLen(Math.abs(v - H0.z))} to the player’s ${v >= H0.z ? 'right' : 'left'}` },
};
const AXES_AMP: HandSpec['axes'] = {
  x: { label: 'TOWARD THE SPEAKER', short: 'FRONT', blurb: 'Toward or away from the grille (x).', fmt: (v) => `${fmtLen(Math.abs(v - G))} ${v >= G ? 'in front of' : 'behind'} the grille` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down across the cone (y).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v <= 0 ? 'above' : 'below'} the speaker’s centre` },
  z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Left or right across the cone (z).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'right' : 'left'} of the speaker’s centre` },
};

const WORDS: HandSpec['words'] = {
  placeBadge: 'Blue = suggested starting points · grey dashes = the hands, the player and the amp’s vents · pinch to zoom',
  clearance: 'Clearance comes first: the mouth, the hands’ whole movement, any neck holder and a harmonica swap. On the amp, keep the mic off the grille and the air behind the amp clear. Cables out of walkways.',
  cardioidTried: 'What you just saw: a cardioid rejects most directly behind (180°). A stand mic facing the harmonica turns its back toward the audience side — where a floor wedge often sits. The harp amp, behind the player, sits off to its side: no null reaches it.',
  sourceNote: 'What you just saw: sound reaches two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: the front and the back of the cone each give their own delay.',
};

const BASE: Omit<HandSpec, 'axes' | 'worked' | 'place' | 'learnZones'> = {
  art: A10_ART,
  intro: 'This lesson is about putting a microphone on a harmonica — acoustic on a stand, or amplified through a harp mic and an amp. First the instrument itself: what it is, how breath becomes a note, and where it sits with its player and the amp. Then the microphones, a worked example and your own placements on both paths. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'HARMONICA', badge: '', label: '', box: { u0: H0.x - 400, u1: H0.x + 600, v0: H0.y - 300, v1: FLOOR_Y + 40 } },
  partsBox: { side: { u0: H0.x - 300, u1: H0.x + 400, v0: H0.y - 250, v1: H0.y + 300 }, top: { u0: H0.x - 300, u1: H0.x + 400, v0: H0.z - 350, v1: H0.z + 350 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: {
    items: [
      { id: 'player', box: { u0: H0.x - 330, u1: H0.x + 160, v0: H0.z - 270, v1: H0.z + 270 }, scene: 'all', label: { u: H0.x - 80, v: H0.z + 360 } },
      { id: 'amp', box: { u0: AMP.box.x0 - 20, u1: AMP.box.x1 + 20, v0: AMP.box.z0 - 20, v1: AMP.box.z1 + 20 }, scene: 'all', label: { u: -100, v: AMP.box.z1 + 120 } },
      { id: 'wedge', box: { u0: 1900, u1: 2300, v0: H0.z - 320, v1: H0.z + 320 }, scene: 'stage', label: { u: 2100, v: H0.z + 400 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -1500 } },
      { id: 'audience', box: { u0: 2300, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2500, v: 1800 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: 900, v1: 1040 }, scene: 'studio', label: { u: 200, v: 820 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the harmonica player facing the audience, the harp amp behind and to the side of them, a wedge downstage in front, the band upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the harmonica player and the harp amp, no monitors on the floor.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The player faces the audience with the harmonica in their hands; their amp stands behind and to the side, so they hear it without it pointing at the cupped mic.',
    before: [
      { title: 'ASK THE PLAYER', text: 'Which sound: clean acoustic harmonica, close amplified harp through the PA, or the harp amp itself? Which harmonicas — and do they swap them, sing too, or use a neck holder? Where will they put a hand-held mic down?' },
      { title: 'WATCH THE HANDS', text: 'Ask for low and high phrases, long notes, attacks, hand wah and breath changes. Note how far the hands and the instrument move. Let the player stand or sit as they normally do.' },
      { title: 'START LOW', text: 'For a harp mic and amp: every volume control down before plugging in, then up together for the player’s tone with headroom. Walk the playing area with the amp and monitors at planned levels.' },
    ],
    useExtra: usePaths,
  },
  mic: {
    intro: 'No brand and no special “harmonica mic” is required for a stand. Choose by what the job needs: the pattern, the power it needs, its impedance, its size and how it mounts. A directional stand mic helps on a stage; an omni can suit a quiet room. A dedicated harp mic is a different tool — an omni made to be cupped, feeding a high-impedance amp input.',
    mountLine: (m) => (m.id === 'harpBullet' ? 'Mount: in the player’s hands, cupped with the harmonica — never on a stand; its cable to the amp’s input' : 'Mount: a stand of its own, just beyond the hands, never able to swing into the face'),
  },
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'clear of the player',
  ctx: {
    pose: { ...STAND, az: STAND.az + 8 },
    mic: 'smallDynCard',
    plan: { u0: H0.x - 600, u1: 2450, v0: H0.z - 900, v1: H0.z + 700 },
    side: { u0: H0.x - 600, u1: 2450, v0: FLOOR_Y - 1950, v1: FLOOR_Y + 40 },
    creditWedge: 'wedge',
    looking: 'From above · a stand mic in front of the player',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — and keep the front on the hands.',
    label: 'the harmonica player with a stand mic in front of their hands.',
    learn: [
      { title: 'STUDIO', text: 'A stand mic just beyond the hands; step back for a more integrated sound if the room is good, closer for detail. Compare several positions over whole phrases at matched level.' },
      { title: 'LIVE · THE STAND MIC', text: 'A directional mic as close as the hands allow, its null toward the loudest wedge. A cardioid hears less of the stage; it does not hear nothing.' },
      { title: 'LIVE · THE CUPPED HARP MIC', text: 'An omni with no null: keep it away from, and never pointed into, the amp or the PA. Set the system so nothing rings even at the mic’s top volume. Do not use a narrow EQ notch instead of safe geometry or lower gain.' },
      { title: 'THE AMP ON STAGE', text: 'Set its loudness for the player’s tone and a safe stage level; add its speaker mic to the PA only as much as needed. Place it so the player hears it without it pointing at the cupped mic.' },
    ],
  },
  two: {
    A: { zone: 'hm.amp.boundary', mic: 'smallDynCard' },
    B: { zone: 'hm.amp.far', mic: 'sdcCard' },
    names: { A: 'CLOSE SPEAKER MIC', B: 'FARTHER AMP MIC' },
    looking: 'Two mics on the harp amp · A close, B farther back',
    prompt: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.',
    label: 'The harp amp with a close mic (A) and a farther mic (B)',
    warn: 'This simplified graph shows one point source and straight paths, no reflections. A real speaker radiates from its whole cone and the room answers back — read the notch depths as illustrative only, and judge the blend by ear, in mono, over real phrases.',
    learn: [
      'A farther mic adds the amp’s body and the room — once the close mic works on its own. It hears the speaker a couple of milliseconds later, so the combined tone can change.',
      'Solo each feed, then sum in mono over real phrases. If it hollows the tone, move or rebalance, or leave the second feed out. A direct split from the harp mic is another feed with its own timing: check it the same way. And a “clean” acoustic stand mic near the amp hears the amp too — compare it alone and summed.',
    ],
  },
  practice: {
    orderNote: 'A one-mic harmonica setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'hm.prac.gain',
    secondId: 'hm.prac.3',
    mixIds: ['hm.mix.1', 'hm.mix.2', 'hm.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: one mic for voice and harmonica, what a null can promise, and what removes a delay.',
    sheetNote: 'For a real harmonica and amp, with the player’s agreement and every level low while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
  words: WORDS,
};

const workedAcoustic = (z: DocumentedZone) => [
  { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we suggest you begin with an acoustic harmonica — a practical starting experiment, not a published standard, and not a promise of a sound.`, cell: 3 },
  { title: 'MEASURED FROM', text: 'From the harmonica — its hole face at the lips — to the mic’s FRONT, rounded to ≈ 5 mm. The readout also says how far the mic is off the line straight out of the harmonica (the breath line).', cell: 0 },
  { title: 'THE DISTANCE', text: z.band, cell: 0 },
  { title: 'THE HEIGHT', text: 'At about mouth and hand height, facing the playing zone. If breath bursts dominate, move a little off the breath line — the next zone.', cell: 1 },
  { title: 'THE AIM', text: `At the hands round the harmonica — the lab counts anything within ±${z.aim?.maxOffAxis ?? 25}°. Closer for detail and isolation; farther, in a quiet room, for a more integrated sound: one change at a time.`, cell: 2 },
  { title: 'CLEARANCE', text: 'Just beyond the hands’ whole movement, never able to swing into the mouth, the instrument or a neck holder; the stand stable, its cable away from the player’s feet.', cell: 3 },
];
const workedAmp = (z: DocumentedZone) => [
  { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we suggest you begin on a harp amp — amplifier-speaker practice, a dependable first listen, not a rule.`, cell: 3 },
  { title: 'MEASURED FROM', text: 'From the grille cloth to the mic’s FRONT, rounded to ≈ 5 mm — on the REAL speaker behind the cloth, found first. The cabinet’s middle is not always the speaker’s.', cell: 0 },
  { title: 'THE DISTANCE', text: z.band, cell: 0 },
  { title: 'ACROSS THE CONE', text: 'At the edge of the dust cap — the ring where the dome meets the cone. From here: toward the centre for more bite, outward for a softer top end.', cell: 1 },
  { title: 'THE AIM', text: `Straight at the speaker — the lab counts anything within ±${z.aim?.maxOffAxis ?? 20}°. One change at a time: keep the distance while you move across.`, cell: 2 },
  { title: 'CLEARANCE', text: 'Off the grille, clear of the moving cone and of the air the amp needs behind it; the stand stable, the cable out of walkways.', cell: 3 },
];

const HAND_ACOUSTIC: HandSpec = {
  ...BASE,
  axes: AXES_ACOUSTIC,
  worked: { zone: 'hm.stand', mic: 'smallDynCard', looking: 'Worked example · a small dynamic · the player from above', label: 'The harmonica player with a stand mic placed for you', done: 'That is the whole reading: where to begin, what it is measured from, the distance, the height, the aim, clearance. Next you place the mic yourself — on either path.', pieces: workedAcoustic },
  place: {
    zone: 'hm.stand',
    mic: 'smallDynCard',
    looking: 'the harmonica player from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — switch PATH below to try the harp amp’s speaker.',
    label: 'The harmonica player, the hands round the harmonica',
    tried: (p) => `You predicted “${p}”. Farther back, the mic hears more of the room and less breath and detail; closer, more detail, more isolation — and more breath. Compare the same phrase at a similar level.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we suggest you begin: at the harmonica, measured from the harmonica; on the amp, measured from the grille. They are starting points, not rules: move from there and listen — every player, harmonica, amp and room is different.',
    'Acoustic: the hands’ chamber is part of the sound, so face the playing zone and keep it in every comparison. Move off the breath stream if bursts dominate. Avoid a high-pass setting that thins the low register — test with the real harmonicas.',
    'Amp: find the real speaker, then compare the dust cap’s edge, the centre and the edge at the same distance. A mic on the amp hears the amplified system — the cupped harp mic, the amp, its distortion and the speaker.',
  ],
};
const HAND_AMP: HandSpec = {
  ...BASE,
  axes: AXES_AMP,
  worked: { zone: 'hm.amp.boundary', mic: 'smallDynCard', looking: 'Worked example · a small dynamic · the harp amp from above', label: 'The harp amp with a speaker mic placed for you', done: 'That is the whole reading: where to begin, what it is measured from, the distance, across the cone, the aim, clearance. Next you place the mic yourself.', pieces: workedAmp },
  place: {
    zone: 'hm.amp.mid',
    mic: 'smallDynCard',
    looking: 'the harp amp from above',
    prompt: 'Drag the mic (or use POSITION and AIM). Rest it in two different blue zones on the speaker — or switch PATH below to the acoustic harmonica.',
    label: 'The harp amp cut through its speaker',
    tried: (p) => `You predicted “${p}”. On the amp, closer tends to bite more and hear less room; farther back, more of the whole amp and the room. Compare at matched level.`,
    notes: () => <VariantChips />,
  },
  learnZones: HAND_ACOUSTIC.learnZones,
};

const SPEC: FreeReedSpec = {
  meet: {
    intro: BASE.intro,
    front: HARP_FRONT,
    figure: { title: 'HARMONICA', badge: 'A 10-hole harmonica, taken apart and at the lips · a simplified drawing · switch PATH for the harp amp', label: (v) => (v === 'amp' ? 'A combo amp with one 12 inch speaker, seen from the front, drawn without its grille cloth so the speaker behind it shows; the control panel across the top.' : 'A 10-hole harmonica taken apart, drawn larger than life: two chrome cover plates, two brass reed plates with ten reeds each, and the comb with its ten holes. Beside it, the harmonica at the lips with the hands cupped round its back.') },
    partsBadge: 'Tap a part to name it · switch PATH for the harp amp',
    partsLooking: (v) => (v === 'amp' ? 'From the front · the harp amp, its speaker shown behind the cloth' : 'The harmonica taken apart · and at the lips'),
    partsNote: 'Two things to meet: the harmonica (and the hands round it), and — on the amplified path — the harp amp. Switch PATH to see the amp.',
    partsWarn: 'Never reach for the player’s harmonicas or hands. A stand that can strike the mouth, the instrument or a neck holder is never acceptable.',
    variantKey: 'PATH',
  },
  sound: {
    voice: 'harmonica',
    cells: [
      { k: 'REED', at: ['AT REST', 'THROUGH', 'BACK UP', 'SWINGING'], flex: 1.1 },
      { k: 'AIR', at: ['ARRIVES', 'A PUFF', 'A PUFF', 'PUFFS'], flex: 1 },
      { k: 'SOUND', at: ['—', '—', '—', 'THE NOTE'], flex: 1 },
    ],
    seqLooking: 'One reed cut open · the comb’s channel above, the plate and its slot',
    useWhere: useHandChamber,
    shapesNote: 'A real harmonica reed is tapered and weighted at its tip by the maker, so its numbers differ — the picture shows which parts move. Every reed is a different length: one note each.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: how a real harmonica sounds depends on the player, the reeds, the hands and the room. The pictures show where the sound comes from and where it leaves.',
  },
  hand: HAND_ACOUSTIC,
  handByVariant: { acoustic: HAND_ACOUSTIC, amp: HAND_AMP },
  pin: { context: 'acoustic', twoMic: 'amp' },
};

export const A10_PAGES = makeFreeReedPages(SPEC);
export const A10_STEP_COUNTS = { instrument: 3, sound: 4, setting: 3 } as const;
export const A10_LESSON_ART = { ...A10_ART, pages: A10_PAGES, stepCounts: A10_STEP_COUNTS };
