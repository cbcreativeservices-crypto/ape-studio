/**
 * M12 TONBAK — its pages: the shared hand-drum journey (shared/hand/
 * handPages) with the tonbak's own words and anchors, and its own HOW IT
 * SOUNDS (the stroke stepped through over the drawing; the head's shapes for
 * a stroke in the middle, halfway or at the edge; where the sound leaves).
 * FULLY SILENT; nothing loops.
 */
import { useEffect, useState } from 'react';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { DocumentedZone, ViewBox } from '../../engine/model/types.ts';
import { HEAD_SHAPES, strikeShare } from '../../engine/physics/membrane.ts';
import { MembraneFace } from '../../engine/scene/MembraneFace';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../engine/kit';
import { fmtLen } from '../../engine/model/units.ts';
import type { PageProps } from '../../pages/pageTypes';
import { HandStrike, type StrikeSpec } from '../shared/hand/HandStrike';
import { makeHandPages, useStepper, type HandSpec } from '../shared/hand/handPages';
import { TONBAK_ZONES, T_F, T_H0, T_N } from './geometry.ts';
import { radiusAt, T_LEN, T_R } from './model.ts';
import { TonbakArt, tonbakHitTest, tonbakLabels, tonbakPose } from './art';
import { poseHit } from '../shared/players/playerPose.ts';

// figureAt: the part labels keep off the drawn player (artLabels.ts).
export const TONBAK_ART = { Instrument: TonbakArt, labels: (v: 'side' | 'top') => tonbakLabels(v), hitTest: tonbakHitTest, figureAt: (view: 'side' | 'top', _v: string, u: number, v: number, tol: number) => poseHit(tonbakPose(view), u, v, tol) };

/* ═══════════════ 2 · HOW IT SOUNDS ═══════════════ */
const nz = Math.hypot(T_N.x, T_N.z);
const STRIKE: StrikeSpec = {
  view: 'top',
  box: { u0: -560, u1: 760, v0: T_F.z - 170, v1: T_H0.z + 330 } as ViewBox,
  heads: [{ id: 'head', c: [T_H0.x, T_H0.z], n: [T_N.x / nz, T_N.z / nz], r: T_R, label: 'HEAD' }],
  strokes: [
    { head: 'head', at: 0, label: 'MIDDLE' },
    { head: 'head', at: 0.82, label: 'EDGE' },
  ],
  air: { path: [[T_H0.x, T_H0.z - 30], [T_F.x, T_F.z + 60], [T_F.x, T_F.z - 70]], label: 'AIR INSIDE · OUT AT THE OPENING' },
  opening: { c: [T_F.x, T_F.z], n: [0, -1], r: radiusAt(T_LEN), label: 'SOME LEAVES THE OPENING' },
};

const STROKES = [
  { id: 'mid', label: 'MIDDLE', words: 'in the middle', frac: 0, blurb: 'Near the middle of the head: the deep stroke.' },
  { id: 'half', label: 'HALFWAY', words: 'halfway out', frac: 0.5, blurb: 'Halfway between the middle and the edge.' },
  { id: 'edge', label: 'EDGE', words: 'at the edge', frac: 0.85, blurb: 'Near the edge: the bright stroke, and much of the finger work.' },
] as const;

function TonbakSound({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant, hidden }: PageProps) {
  const S = lesson.sound;
  const n = S.stages.length;
  const st = useStepper(n, hidden);
  const [predicted, setPredicted] = useState<string | null>(null);
  useEffect(() => {
    if (st.shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [st.shown, n, interactiveDone, onInteractive]);
  const stage = S.stages[st.shown - 1];
  /* the shapes */
  const [shapeIdx, setShapeIdx] = useState(0);
  const [swing, setSwing] = useState(1);
  const [strokeId, setStrokeId] = useState<(typeof STROKES)[number]['id']>('mid');
  const [triedEdge, setTriedEdge] = useState(false);
  const shape = HEAD_SHAPES[shapeIdx];
  const stroke = STROKES.find((s) => s.id === strokeId)!;
  const share = strikeShare(shape, stroke.frac);
  const sharePct = Math.round(share * 100);
  const pred = lesson.predictions.sound;
  const reached = st.shown >= n;

  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${st.shown} / ${n}`, flex: 0.8 },
    { k: 'HEAD', v: st.shown >= 2 ? 'MOVING' : 'AT REST', flex: 1.1 },
    { k: 'AIR INSIDE', v: st.shown >= 3 ? 'MOVING' : '—', flex: 1.1 },
    { k: 'SOUND OUT', v: st.shown >= 4 ? 'HEAD + END' : '—', flex: 1.2 },
  ];
  const shapeParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'shape',
      label: 'SHAPE',
      value: shapeIdx / (HEAD_SHAPES.length - 1),
      onChange: (v) => setShapeIdx(Math.round(v * (HEAD_SHAPES.length - 1))),
      format: () => `${shape.label} · ${shape.still}`,
      formatShort: () => shape.label,
    },
    {
      kind: 'options',
      id: 'stroke',
      label: 'STROKE',
      valueLabel: stroke.label,
      selectedId: strokeId,
      onSelect: (id) => {
        setStrokeId(id as (typeof STROKES)[number]['id']);
        if (id === 'edge') setTriedEdge(true);
      },
      sticky: true,
      options: STROKES.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
    },
    {
      kind: 'fader',
      id: 'swing',
      label: 'SWING',
      value: (swing + 1) / 2,
      home: 1,
      onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
      format: () => (Math.abs(swing) < 0.05 ? 'passing through flat' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
      formatShort: () => `${Math.round(swing * 100)} %`,
    },
  ];
  const shapeBezel: BezelItem[] = [
    { k: 'SHAPE', v: shape.label, flex: 0.8 },
    { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
    { k: 'UNDER STROKE', v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
    { k: 'STROKE', v: stroke.label, flex: 1 },
  ];
  const steps: MikingStep[] = [
    {
      key: 'strike',
      title: 'Stroke to sound',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <HandStrike w={w} h={h} art={TONBAK_ART} variant={variant} spec={STRIKE} shown={st.shown} accessibilityLabel={`The tonbak from above, across the player's lap. Event ${st.shown} of ${n}: ${stage.title}. ${stage.text}`} />,
        badge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
        bezel: strikeBezel,
        params: st.params,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking="From above · the tonbak across the lap, the head to the player’s right" prompt="STEP through the stroke, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${st.shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
          </Card>
          {reached ? <Note>The head keeps ringing for a moment after the hand leaves — unless the player damps it. How long depends on the drum, the head and the player.</Note> : null}
        </>
      ),
    },
    {
      key: 'shapes',
      title: 'Middle and edge',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <MembraneFace
            w={w}
            h={h}
            diameterMm={S.head.diameterMm}
            rods={0}
            shape={shape}
            strikeMm={stroke.frac * T_R}
            swing={swing}
            strikeWord="STROKE"
            accessibilityLabel={`The tonbak's head seen face-on, in the shape ${shape.label}: ${shape.still}. Under a stroke ${stroke.words}, the head moves ${sharePct} percent of this shape's peak.`}
          />
        ),
        badge: 'A simplified picture: an ideal round head on its own, no air, no bowl · blue + toward you, amber − away',
        bezel: shapeBezel,
        params: shapeParams,
        initialParam: 'shape',
      },
      well: (
        <>
          <Landing looking={`The head face-on · ${fmtLen(S.head.diameterMm)} across · shape ${shape.label}`} prompt="Step through SHAPE, then move the STROKE from the middle to the edge. Which shapes does a stroke in the middle leave still?" />
          <Card>
            <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
              {`A struck head vibrates in several shapes at once; this is one of them. Under a stroke ${stroke.words}, the head moves ${sharePct} % of this shape’s peak, so the stroke ${share < 0.05 ? 'does not drive this shape at all: it lands on a still line' : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.`}
            </Point>
          </Card>
          <Note>A shape is set moving only as much as the head moves where the stroke lands. In the middle, every shape with a still line across the head stands still — so a middle stroke drives mostly the ring-shaped, lower ones: the deep sound. Toward the edge, many more shapes move: the bright sound.</Note>
          {triedEdge && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. At the edge, nearly every shape moves under the stroke — that is why it sounds brighter.`}</Note> : null}
          <Note>This is a simplified head in empty space. On a real tonbak the air inside, the bowl and the player’s hand pull these numbers around; the stroke technique matters as much as the spot.</Note>
        </>
      ),
    },
    {
      key: 'where',
      title: 'Where it leaves',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{S.attack}</Point>
            <Point title="BODY">{S.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the drum: how a real tonbak sounds depends on the drum, the head, the player and the room. The pictures show where the sound comes from and where it leaves.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ the rest of the journey: the tonbak's words ═══════════════ */
const zoneOf = (id: string) => TONBAK_ZONES.find((z) => z.id === id)!;
const A0 = zoneOf('tb.A').start;

const SPEC: HandSpec = {
  art: TONBAK_ART,
  intro: 'This lesson is about putting a microphone on a tonbak — but first the drum itself: what it is, how it makes its sound, and where it sits with its player. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  partsBox: { top: { u0: -700, u1: 560, v0: -520, v1: 330 }, side: { u0: -560, u1: 560, v0: -1000, v1: -240 } },
  figure: { view: 'top', box: { u0: -700, u1: 560, v0: -520, v1: 330 }, title: 'TONBAK', badge: 'A wooden tonbak across the player’s lap, from above · posture drawn as a starting picture', label: 'The tonbak from above, lying across a seated player’s lap: the skin head at the wide end facing the player’s right, the bowl, the narrow neck and the flared foot, open at the end.' },
  partsBadge: 'A wooden tonbak · tap a part to name it · the posture is a drawing choice',
  partsLooking: (v) => (v === 'top' ? 'From above · the drum across the lap' : 'From the player’s right · the head nearly face-on'),
  partsNote: 'The fingers and hands strike the head; the bowl and the air inside shape the sound; some leaves the open lower end. Switch the view to see the head face-on.',
  partsWarn: 'The drum is the player’s: never clamp the rim, never put anything inside the opening, and never move the drum to suit a microphone.',
  plan: {
    items: [
      { id: 'drum', box: { u0: -200, u1: 200, v0: -440, v1: 120 }, scene: 'all', label: { u: 330, v: -200, align: 'left' } },
      { id: 'player', box: { u0: -700, u1: -260, v0: -260, v1: 260 }, scene: 'all', label: { u: -480, v: -330 } },
      { id: 'chair', box: { u0: -420, u1: 220, v0: -340, v1: 300 }, scene: 'all', label: { u: -100, v: 420 } },
      { id: 'wedge', box: { u0: 1250, u1: 1750, v0: 50, v1: 650 }, scene: 'stage', label: { u: 1500, v: 760 } },
      { id: 'band', box: { u0: -560, u1: 1000, v0: -1430, v1: -880 }, scene: 'stage', label: { u: 200, v: -790 } },
      { id: 'audience', box: { u0: 2000, u1: 2700, v0: -1520, v1: 1700 }, scene: 'stage', label: { u: 2250, v: -1000 } },
      { id: 'room', box: { u0: -1300, u1: 1700, v0: -1000, v1: -860 }, scene: 'studio', label: { u: 200, v: -780 } },
    ],
    label: (scene, sel) => (scene === 'stage' ? `A stage from above: the tonbak player seated with the drum across the lap, the head to the player's right; the player's wedge downstage on the audience side, a side fill to the right, louder players upstage, and the audience and PA to the right.${sel ? ` Highlighted: ${sel}.` : ''}` : `A studio room from above: the tonbak player seated, no monitors on the floor, the room's walls around.${sel ? ` Highlighted: ${sel}.` : ''}`),
    looking: (scene) => (scene === 'stage' ? 'Plan · a stage from above, the audience at the right' : 'Plan · a studio room from above'),
    first: 'The player sits with the drum across the lap; the hands move over the head and its edge. Everything else fits round that.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'How do they hold the drum, and how do they move? Ask for their deep, edge and quiet strokes, rolls, and a short real passage — in their own terms. What is the tonbak’s role here, and what must stay audible?' },
      { title: 'LISTEN WITHOUT A MIC', text: 'Hear the passage unamplified from a comfortable audience-side position, at normal and strongest levels. Note the head’s orientation, the hands’ full paths and the normal movement.' },
      { title: 'WORK WITH THE DRUM AS IT IS', text: 'The drum and its head are the player’s. Do not move it, clamp it or treat its head to suit a mic. A stand is the default.' },
    ],
  },
  mic: {
    intro: 'No brand and no special tonbak mic is required. Choose by what the job needs: the pattern, the power, its size, how it mounts. Try what you have first and compare at matched loudness.',
    mountLine: (m) => (m.transducer === 'dynamic' ? 'Mount: a stand from the audience side, clear of the hands — compact on a stage' : 'Mount: a stand from the audience side, clear of the hands and the legs'),
  },
  axes: {
    x: { label: 'TOWARD THE AUDIENCE', short: 'FRONT', blurb: 'Toward or away from the audience side (x).', fmt: (v) => `${fmtLen(Math.abs(v))} ${v >= 0 ? 'toward the audience from' : 'toward the player from'} the head’s centre` },
    y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y). Height above the floor is not shown as a target.', fmt: (v) => `${fmtLen(Math.abs(v - T_H0.y))} ${v <= T_H0.y ? 'above' : 'below'} the head’s centre` },
    z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Toward the player’s right (the way the head faces) or left (z).', fmt: (v) => `${fmtLen(Math.abs(v))} to the player’s ${v >= 0 ? 'right' : 'left'} of the head’s centre` },
  },
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'outside the drum',
  worked: {
    zone: 'tb.A',
    mic: 'sdcCard',
    looking: 'Worked example · a small condenser · the tonbak from above',
    label: 'The tonbak with a small condenser placed for you',
    done: 'That is the whole reading: where to begin, what it is measured from, the distance, the viewpoint, the aim, clearance. Next you place the mic yourself.',
    pieces: (z: DocumentedZone) => [
      { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we recommend you begin with a tonbak — a balanced starting point, not a rule, and not a promise of a sound.`, cell: 3 },
      { title: 'MEASURED FROM', text: 'From the head: the readout measures from the head area the mic is aimed at to the mic’s FRONT, rounded to ≈ 5 mm.', cell: 0 },
      { title: 'THE DISTANCE', text: z.band, cell: 0 },
      { title: 'THE VIEWPOINT', text: 'From the audience side, about 30–45° off the line straight out of the head — not straight into it, and never in the hands’ path.', cell: 1 },
      { title: 'THE AIM', text: `At the head area between the middle and the edge, toward the audience side — the lab counts anything within ±${z.aim?.maxOffAxis ?? 30}°. Distance, viewpoint and angle are separate things to try.`, cell: 2 },
      { title: 'CLEARANCE', text: 'Outside the hands’ whole path, vigorous passages included; the stand clear of the legs and the player’s movement; the cable away from the feet.', cell: 3 },
    ],
  },
  place: {
    zone: 'tb.A',
    mic: 'sdcCard',
    looking: 'the tonbak from above',
    prompt: 'Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then change one thing at a time.',
    label: 'The tonbak across the lap',
    tried: (p) => `You predicted “${p}”. Closer in, the mic hears more of the head’s detail and less of the room — and more contact and finger sound. Whether that suits depends on the player and the music.`,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we recommend you begin, measured from the head (or, for the opening mic, from the lower opening). They are starting points, not rules: move from there and listen — every drum and player is different.',
    'Change one thing at a time. Keep the distance and change the viewpoint, or keep the viewpoint and change the distance. If one hand or the edge takes over, move to a new viewpoint rather than only turning the mic. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
    'The opening mic is a support for the head mic, never a replacement — outside the opening, and judged in mono with the head mic.',
  ],
  ctx: {
    pose: { ...A0, az: A0.az + 18 },
    mic: 'instDynCard',
    plan: { u0: -700, u1: 1950, v0: -700, v1: 900 },
    side: { u0: -700, u1: 1950, v0: -1050, v1: 40 },
    creditWedge: 'wedge',
    looking: 'From above · a mic on the audience side of the tonbak',
    prompt: 'The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the player’s wedge sits in the rejection — and keep the front on the head.',
    label: 'the tonbak with a mic on the audience side.',
    learn: [
      { title: 'STUDIO', text: 'A balanced position for the whole vocabulary; a farther, room-inclusive view can suit a solo in a good room. Compare at matched loudness, and keep the pattern and the distance as separate changes.' },
      { title: 'LIVE', text: 'One workable directional mic first, and only the monitor level the player needs. A closer pickup helps against louder neighbours — if the player stays comfortable. A second mic must justify its extra spill.' },
      { title: 'WHAT TO SEND', text: 'Reinforce only what the audience needs. Let the system operator route the PA, wedges, in-ears and recording separately.' },
    ],
  },
  two: {
    A: { zone: 'tb.A', mic: 'sdcCard' },
    B: { zone: 'tb.D', mic: 'sdcCard' },
    names: { A: 'HEAD MIC', B: 'OPENING MIC' },
    looking: 'Two mics · A at the head, B outside the lower opening',
    prompt: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes — and try each SOURCE.',
    label: 'The tonbak with a head mic (A) and an opening mic (B)',
    warn: 'The two mics hear DIFFERENT places on the drum, so this simplified graph shows only the shared part of one source — not what the pair will sound like. Judge the pair by ear, in mono, at matched levels, with deep, edge and roll strokes and the player’s normal movement. 3:1 is a spill guideline for mics on different sources; it says nothing about this pair.',
    learn: [
      'A common idea: one mic for the head, and a quieter support mic outside the open lower end for some of the body’s resonance. Two mics are not automatically better — start with the head mic working on its own.',
      'At the lowest pitches, the air pushed out of the opening moves opposite to the outside of the head — like the back of an open speaker cabinet — and higher up that relation changes with pitch. That is one reason no polarity setting is right by rule.',
      'Bring the opening mic in quietly, in mono, while the player alternates deep, edge and roll strokes. Compare both polarity states — neither is correct by rule — and keep the second mic only if it adds something useful and survives ordinary movement. Delay changes only for a measured, understood timing problem.',
    ],
  },
  practice: {
    orderNote: 'A one-mic tonbak setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'tb.prac.gain',
    secondId: 'tb.prac.3',
    mixIds: ['tb.mix.1', 'tb.mix.2', 'tb.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: what a distance needs, what a null can promise, and polarity versus delay.',
    sheetNote: 'For a real tonbak and player, with their agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};

export const TONBAK_PAGES = makeHandPages(SPEC, TonbakSound);
