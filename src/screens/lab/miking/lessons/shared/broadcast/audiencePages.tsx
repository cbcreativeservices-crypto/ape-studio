/**
 * THE AUDIENCE VENUE — the tool steps (Lab 7 group 3, B08; LessonArt.pages).
 * Rack steps on Lab 7b group 2's plan stage (shared/sports/sportsPages
 * PlanStage): the display pinned above, the well between, the controls
 * docked below — FULLY SILENT, static until a control changes it (D8).
 *
 *   useVenueTourStep  THE VENUE, LAYER BY LAYER (key 'tour'): the studio
 *                     audience or the multi-section event — seats and routes,
 *                     the PA and where it points, the cameras, the approved
 *                     places a mic may hang or stand.
 *   useNearSeatStep   ONE PERSON OR THE CROWD (key 'nearSeat'): a crowd mic
 *                     on the bar above the front rows, raised or lowered —
 *                     the nearest seat against the section's middle at the
 *                     mic (venue.nearSeatBias).
 *   useImmersiveStep  FIVE CAPSULES OR FOUR (key 'immersive'): the tokens
 *                     with their front and channel labels — no decode.
 *   usePaAngleStep    FACES, NOT THE PA (key 'paAngle'): a crowd mic aimed at
 *                     the faces or toward the PA, its pattern; the PA's angle
 *                     off its axis and the ideal pattern there (venue.paAngle).
 *   usePairZonesStep  A PAIR OR TWO ZONES (key 'pairZones'): XY, ORTF, spaced
 *                     AB and two zone mics on one source at the middle or at a
 *                     side — Δt and the mono sum's first notch.
 */
import { useEffect, useState } from 'react';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard } from '../../../engine/kit';
import type { Prediction } from '../../../engine/model/types.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { PlanStage, MicOnPlan, type SportMic } from '../sports/sportsPages';
import { PlanPath, TargetRing, venueLabels } from '../sports/VenueArt';
import { degOf, dirFromDeg, fmtM1, planUV, type P2 } from '../sports/venuePlan.ts';
import { CoverageWedge, ImmersiveScene } from './AudienceArt';
import { DOMINATE_DB, EVENT, EVENT_SCENE, FACE_H, STUDIO, STUDIO_SCENE, VENUES, nearSeatBias, pairReading, paAngle, type VenueId } from './venue.ts';

const AMBER = '#ffc64d';
const RED = '#ff6b5e';
const GREEN = '#5bff85';
const db1 = (d: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} dB`;

/** The PA clusters of a venue and where each points (drawing defaults). */
const PA_AIMS: Readonly<Record<VenueId, { c: P2; dirDeg: number; halfDeg: number; reach: number }[]>> = {
  studio: [
    { c: STUDIO.paL, dirDeg: -8, halfDeg: 40, reach: 8 },
    { c: STUDIO.paR, dirDeg: 8, halfDeg: 40, reach: 8 },
  ],
  event: [
    { c: EVENT.paL, dirDeg: 18, halfDeg: 45, reach: 16 },
    { c: EVENT.paR, dirDeg: -18, halfDeg: 45, reach: 16 },
    { c: EVENT.fill, dirDeg: 0, halfDeg: 55, reach: 5 },
  ],
};
export function PaCoverage({ venue, px, hot = false }: { venue: VenueId; px: number; hot?: boolean }) {
  return (
    <>
      {PA_AIMS[venue].map((w, i) => (
        <CoverageWedge key={i} c={w.c} dirDeg={w.dirDeg} halfDeg={w.halfDeg} reach={w.reach} px={px} hot={hot} />
      ))}
    </>
  );
}

/* ── THE VENUE, LAYER BY LAYER ── */

/** The names on a venue plan (left and right as drawn). */
function tourLabels(venue: VenueId): StaticLabel[] {
  const at = (id: string, text: string, p: P2, tone: StaticLabel['tone'] = 'muted'): StaticLabel => ({ id, text, u: planUV(p).u, v: planUV(p).v, align: 'center', tone });
  if (venue === 'studio') return [at('stage', 'STAGE', { x: 0, y: -2 }), at('aud', 'AUDIENCE', { x: 0, y: 8.8 }), at('paL', 'PA', { x: -4.6, y: -1.4 }), at('paR', 'PA', { x: 4.6, y: -1.4 })];
  return [at('stage', 'STAGE', { x: 0, y: -3.5 }), at('l', 'LEFT', { x: -14, y: 14 }), at('c', 'CENTRE', { x: 0, y: 15 }), at('r', 'RIGHT', { x: 14, y: 14 }), at('paL', 'PA', { x: -9, y: -2 }), at('paR', 'PA', { x: 9, y: -2 })];
}

type Layer = 'seats' | 'pa' | 'cameras' | 'places';
const LAYERS: Readonly<Record<Layer, { label: string; short: string; words: Record<VenueId, string> }>> = {
  seats: {
    label: 'Seats, aisles and exits',
    short: 'SEATS',
    words: {
      studio: 'One raked section, an aisle down each side, an exit at each back corner. A stand, a cable or a mic never goes in an aisle or an exit.',
      event: 'Three sections round the stage, aisles between them, a cross-aisle and exits at the back. One mic cannot stand for every section.',
    },
  },
  pa: {
    label: 'The PA and where it points',
    short: 'PA',
    words: {
      studio: 'A loudspeaker at each front corner of the stage, aimed out over the seats. A crowd mic in that wedge hears the PA as loudly as the people.',
      event: 'Clusters high at the stage’s corners and a fill at its edge, each aimed at the seats: the PA covers the very places the audience sits.',
    },
  },
  cameras: {
    label: 'The cameras',
    short: 'CAMERAS',
    words: {
      studio: 'A camera on a riser at the back looks over the seats to the stage: a hung mic stays above its picture, out of the sight lines.',
      event: 'The camera riser at the back: a mic or a truss in its view is in every wide shot.',
    },
  },
  places: {
    label: 'The approved places',
    short: 'PLACES',
    words: {
      studio: 'The rigging bar above the front rows (rigged by qualified crew) and the stage’s front corners: where a crowd mic may hang or stand.',
      event: 'A rail at the front of each section, and a truss over the hall — anything over people is flown only by a qualified rigger with approved hardware.',
    },
  },
};

export function useVenueTourStep(spec: { words: { looking: string; prompt: string; done: string } }): MikingStep {
  const [venue, setVenue] = useState<VenueId>('studio');
  const [layer, setLayer] = useState<Layer>('seats');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['studio:seats']));
  const mark = (v: VenueId, l: Layer) => setSeen((q) => (q.has(`${v}:${l}`) ? q : new Set([...q, `${v}:${l}`])));
  const scene = VENUES[venue];
  const L = LAYERS[layer];
  const show = { sectors: true, routes: layer === 'seats', cameras: layer === 'cameras', footprints: layer === 'places', targets: false, marks: false } as const;
  const done = seen.size >= 6;
  return {
    key: 'tour',
    title: 'The venue',
    kind: 'WATCH',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={scene} a11y={`${scene.label}, from above: ${L.label.toLowerCase()}. ${L.words[venue]}`} labels={[...tourLabels(venue), ...venueLabels(scene, { layers: layer === 'places', targets: false, marks: false })]} show={show}>
          {(px) => (layer === 'pa' ? <PaCoverage venue={venue} px={px} hot /> : null)}
        </PlanStage>
      ),
      badge: 'From above · the stage at the bottom · seats drawn without people · the PA’s wedge is a simplified picture of where it points',
      bezel: [
        { k: 'VENUE', v: venue === 'studio' ? 'STUDIO' : 'EVENT', flex: 1 },
        { k: 'LAYER', v: L.short, flex: 1 },
        { k: 'LOOKED AT', v: `${Math.min(seen.size, 8)} / 8`, flex: 1 },
      ],
      params: [
        {
          kind: 'options',
          id: 'layer',
          label: 'LAYER',
          valueLabel: L.short,
          selectedId: layer,
          sticky: true,
          onSelect: (id) => {
            setLayer(id as Layer);
            mark(venue, id as Layer);
          },
          options: (Object.keys(LAYERS) as Layer[]).map((k) => ({ id: k, label: LAYERS[k].label })),
        },
        {
          kind: 'options',
          id: 'venue',
          label: 'VENUE',
          valueLabel: venue === 'studio' ? 'STUDIO' : 'EVENT',
          selectedId: venue,
          sticky: true,
          onSelect: (id) => {
            setVenue(id as VenueId);
            mark(id as VenueId, layer);
          },
          options: [
            { id: 'studio', label: 'A small studio audience', blurb: STUDIO_SCENE.blurb },
            { id: 'event', label: 'A larger multi-section event', blurb: EVENT_SCENE.blurb },
          ],
        },
      ],
      initialParam: 'layer',
    },
    well: (
      <>
        <Landing looking={`${spec.words.looking} · ${scene.label}`} prompt={spec.words.prompt} />
        <Card>
          <Point title={L.label.toUpperCase()}>{L.words[venue]}</Point>
        </Card>
        {done ? <Note tone="ok">{spec.words.done}</Note> : <Body>Step through LAYER in both venues.</Body>}
      </>
    ),
  };
}

/* ── ONE PERSON OR THE CROWD ── */

export function useNearSeatStep(spec: { prediction?: Prediction; words: { looking: string; prompt: string; done: string } }): MikingStep {
  const [h, setH] = useState<number>(STUDIO.hBar);
  const [front, setFront] = useState(0.5);
  const [seen, setSeen] = useState({ low: false, high: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const y = STUDIO.bar.y0 + front * (STUDIO.bar.y1 - STUDIO.bar.y0);
  const mic = { x: 0, y };
  const B = nearSeatBias(mic, h, STUDIO.N, STUDIO.S);
  const m: SportMic = { id: 'crowd', kind: 'compact', label: 'crowd mic', at: mic, h, aimAt: STUDIO.S, aimH: FACE_H, pattern: 'cardioid' };
  const words = `The crowd mic ${fmtM1(h)} up: the nearest seat ${fmtM1(B.rNear)} away, the middle of the section ${fmtM1(B.rCentre)} — the nearest person about ${Math.abs(B.db).toFixed(1)} dB louder at the mic than one in the middle.`;
  const labels: StaticLabel[] = [
    ...venueLabels(STUDIO_SCENE, { targets: true, marks: false }),
  ];
  return {
    key: 'nearSeat',
    title: 'One person or the crowd',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, hh) => (
        <PlanStage w={w} h={hh} scene={STUDIO_SCENE} box={{ x0: -6, y0: -1.5, x1: 6, y1: 9 }} a11y={words} labels={labels} show={{ targets: true, marks: false }}>
          {(px, g) => (
            <>
              <PlanPath a={STUDIO.S} b={mic} px={px} color={AMBER} width={2.4} />
              <PlanPath a={STUDIO.N} b={mic} px={px} color={RED} width={3.4} />
              <MicOnPlan m={m} px={px} g={g} />
              <TargetRing p={STUDIO.N} px={px} active />
            </>
          )}
        </PlanStage>
      ),
      badge: 'From above · red = the nearest seat, amber = the middle of the section · by distance alone: a simplified picture · silent',
      bezel: [
        { k: 'HEIGHT', v: fmtM1(h), flex: 0.9 },
        { k: 'NEAREST', v: fmtM1(B.rNear), flex: 0.9 },
        { k: 'MIDDLE', v: fmtM1(B.rCentre), flex: 0.9 },
        { k: 'ONE PERSON', v: db1(B.db), tint: B.dominates ? RED : GREEN, flex: 1.1 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'height',
          label: 'HEIGHT',
          value: (h - 1.6) / (4.4 - 1.6),
          onChange: (v) => {
            const nh = Math.round((1.6 + v * (4.4 - 1.6)) * 10) / 10;
            setH(nh);
            setSeen((s) => ({ low: s.low || nh <= 2.0, high: s.high || nh >= 3.8 }));
          },
          format: () => `the capsule ${fmtM1(h)} above the floor`,
          formatShort: () => fmtM1(h),
        },
        {
          kind: 'fader',
          id: 'front',
          label: 'OUT',
          value: front,
          onChange: (v) => setFront(v),
          format: () => `${fmtM1(y)} in front of the stage`,
          formatShort: () => fmtM1(y),
        },
      ],
      initialParam: 'height',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={B.dominates ? '✕ ONE PERSON DOMINATES' : 'THE SECTION, NOT ONE SEAT'}>{words}</Point>
          <Point title="WHY HEIGHT HELPS">{`Raised above and a little in front, the mic is nearly as far from the front row as from the middle: the section arrives together. Low, the nearest clapper or talker is much closer than everyone else — more than about ${DOMINATE_DB} dB (one doubling of distance) and one person can dominate.`}</Point>
        </Card>
        {seen.low && seen.high ? <Note tone="ok">{spec.words.done}</Note> : <Body>Bring the mic down low, then raise it high, and watch ONE PERSON.</Body>}
        <Body>Distances are calculated from the drawing; levels by distance alone. A real section adds reflections, the PA and the room.</Body>
      </>
    ),
  };
}

/* ── FIVE CAPSULES OR FOUR ── */

export function useImmersiveStep(spec: { words: { looking: string; prompt: string; done: string } }): MikingStep {
  const [kind, setKind] = useState<'surround5' | 'ambi4'>('surround5');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['surround5']));
  const S = kind === 'surround5';
  return {
    key: 'immersive',
    title: 'Five capsules or four',
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => <ImmersiveScene w={w} h={h} kind={kind} accessibilityLabel={S ? 'A five-capsule surround mic from above: three capsules across the front labelled L, C and R, two toward the rear labelled Ls and Rs, and an arrow marking its front.' : 'A four-capsule Ambisonic mic from above: four capsules on a small tetrahedron labelled FLU, FRD, BLD and BRU, and its front mark with an arrow.'} />,
      badge: 'From above · each mic drawn with its front · channel labels only: no decode is drawn · silent',
      bezel: [
        { k: 'MIC', v: S ? '5 CAPSULES' : '4 CAPSULES', flex: 1.2 },
        { k: 'SIGNALS', v: S ? '5 CHANNELS' : '4 TRACKS', flex: 1.1 },
        { k: 'LOOKED AT', v: `${seen.size} / 2`, flex: 0.9 },
      ],
      params: [
        {
          kind: 'options',
          id: 'kind',
          label: 'MIC',
          valueLabel: S ? 'SURROUND' : 'AMBISONIC',
          selectedId: kind,
          sticky: true,
          onSelect: (id) => {
            setKind(id as typeof kind);
            setSeen((q) => (q.has(id) ? q : new Set([...q, id])));
          },
          options: [
            { id: 'surround5', label: 'A five-capsule surround mic', blurb: 'Three capsules across the front, two toward the rear: one signal per loudspeaker of a five-channel layout.' },
            { id: 'ambi4', label: 'A four-capsule Ambisonic mic', blurb: 'Four capsules on a small tetrahedron: four gain-matched tracks, converted afterwards by its maker’s tool.' },
          ],
        },
      ],
      initialParam: 'kind',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          {S ? (
            <>
              <Point title="WHAT IT GIVES">Five channels — left, centre, right, left surround, right surround — ready for a five-loudspeaker layout, from one compact head.</Point>
              <Point title="KEEP">Its front pointing at the front of the picture, its mount, and every channel’s identity: L, C, R, Ls, Rs in the order its manual gives.</Point>
            </>
          ) : (
            <>
              <Point title="WHAT IT GIVES">Four capsule signals — a different format from five channels. Its maker’s conversion turns them into a sound field that can be turned and rendered for headphones or loudspeakers.</Point>
              <Point title="KEEP">Its front mark, the capsule order from its manual, four separate tracks with matched, linked gain — and the maker’s conversion. Rotating a finished stereo file is not the same thing.</Point>
            </>
          )}
          <Point title="EITHER WAY">An optional advanced deliverable, never a replacement for a clean mono and stereo plan. A stereo fold-down is checked by ear, not guessed from channel names.</Point>
        </Card>
        {seen.size >= 2 ? <Note tone="ok">{spec.words.done}</Note> : <Body>Look at both mics with MIC.</Body>}
      </>
    ),
  };
}

/* ── FACES, NOT THE PA ── */

type Spot = 'rail' | 'corner';
export function usePaAngleStep(spec: { onDone: () => void; prediction?: Prediction; words: { looking: string; prompt: string; done: string } }): MikingStep {
  const [spot, setSpot] = useState<Spot>('rail');
  const [turn, setTurn] = useState(-60);
  const [tilt, setTilt] = useState<'faces' | 'over'>('over');
  const [pattern, setPattern] = useState<'cardioid' | 'supercardioid'>('cardioid');
  const [predicted, setPredicted] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  // The event: a crowd mic on the centre section's rail, or at the stage's corner under the left PA cluster.
  const at: P2 = spot === 'rail' ? { x: -3.5, y: 2.1 } : { x: -7.8, y: 0.6 };
  const hMic = spot === 'rail' ? EVENT.hRail : 3.0;
  const base = degOf({ x: EVENT.CC.x - at.x, y: EVENT.CC.y - at.y });
  const aimDeg = base + turn;
  const ahead = dirFromDeg(aimDeg);
  const aimAt: P2 = { x: at.x + ahead.x * 8, y: at.y + ahead.y * 8 };
  const aimH = tilt === 'faces' ? FACE_H : hMic + 2.5;
  const pa = paAngle(at, hMic, aimAt, aimH, EVENT.paL, EVENT.paH, pattern);
  const faces = paAngle(at, hMic, aimAt, aimH, EVENT.CC, FACE_H, pattern);
  const good = touched && pa.deg >= 110 && faces.deg <= 35;
  const onDone = spec.onDone;
  useEffect(() => {
    if (good) onDone();
  }, [good, onDone]);
  const m: SportMic = { id: 'crowd', kind: 'compact', label: 'crowd mic', at, h: hMic, aimAt, aimH, pattern };
  return {
    key: 'paAngle',
    title: 'Faces, not the PA',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={EVENT_SCENE} box={{ x0: -14, y0: -3, x1: 6, y1: 16 }} a11y={`A crowd mic ${spot === 'rail' ? 'on the centre section’s rail' : 'at the stage’s corner'}, aimed ${tilt === 'faces' ? 'down at the faces' : 'up over the heads'}: the left PA cluster ${Math.round(pa.deg)}° off its axis, ${Math.abs(Math.round(pa.db))} dB down by the pattern.`} labels={venueLabels(EVENT_SCENE, { targets: true, marks: false })} show={{ targets: true, marks: false, routes: false }}>
          {(px, g) => (
            <>
              <PaCoverage venue="event" px={px} />
              <PlanPath a={EVENT.paL} b={at} px={px} color={RED} width={2.4} />
              <MicOnPlan m={m} px={px} g={g} />
            </>
          )}
        </PlanStage>
      ),
      badge: 'From above · red = the path from the PA cluster · white dashed = an ideal pattern’s shape · angles in 3-D, calculated from the drawing · silent',
      bezel: [
        { k: 'PA OFF AXIS', v: `${Math.round(pa.deg)}°`, tint: pa.deg >= 110 ? GREEN : RED, flex: 1.1 },
        { k: 'PA PICKUP', v: db1(pa.db), flex: 1 },
        { k: 'FACES', v: faces.deg <= 35 ? 'IN FRONT' : `${Math.round(faces.deg)}° OFF`, tint: faces.deg <= 35 ? GREEN : RED, flex: 1 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'turn',
          label: 'TURN',
          value: (turn + 90) / 180,
          onChange: (v) => {
            setTurn(Math.round(v * 180 - 90));
            setTouched(true);
          },
          format: () => (turn === 0 ? 'aimed at the middle of the section' : `turned ${Math.abs(turn)}° ${turn > 0 ? 'left' : 'right'}`),
          formatShort: () => `${turn > 0 ? '+' : ''}${turn}°`,
        },
        {
          kind: 'options',
          id: 'tilt',
          label: 'TILT',
          valueLabel: tilt === 'faces' ? 'FACES' : 'OVER',
          selectedId: tilt,
          sticky: true,
          onSelect: (id) => {
            setTilt(id as typeof tilt);
            setTouched(true);
          },
          options: [
            { id: 'faces', label: 'Down at the faces', blurb: 'Tilted down toward the faces and upper bodies of the section.' },
            { id: 'over', label: 'Up over the heads', blurb: 'Tilted up, over the heads — toward the back of the hall.' },
          ],
        },
        {
          kind: 'options',
          id: 'spot',
          label: 'PLACE',
          valueLabel: spot === 'rail' ? 'RAIL' : 'CORNER',
          selectedId: spot,
          sticky: true,
          onSelect: (id) => {
            setSpot(id as Spot);
            setTouched(true);
          },
          options: [
            { id: 'rail', label: 'The centre section’s rail', blurb: 'Raised at the front of the centre section.' },
            { id: 'corner', label: 'The stage’s corner', blurb: 'At the stage’s corner, right under the left PA cluster.' },
          ],
        },
        {
          kind: 'options',
          id: 'pattern',
          label: 'PATTERN',
          valueLabel: pattern === 'cardioid' ? 'CARDIOID' : 'SUPER',
          selectedId: pattern,
          sticky: true,
          onSelect: (id) => {
            setPattern(id as typeof pattern);
            setTouched(true);
          },
          options: [
            { id: 'cardioid', label: 'cardioid' },
            { id: 'supercardioid', label: 'supercardioid' },
          ],
        },
      ],
      initialParam: 'turn',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title="THE PA">{`The left PA cluster sits ${Math.round(pa.deg)}° off the mic’s axis: the ideal ${pattern} takes it ${Math.abs(pa.db).toFixed(1)} dB below the faces in front. ${pa.deg >= 110 ? 'Well toward its rejection.' : 'Too near its front — the PA arrives nearly as loud as the people.'}`}</Point>
          <Point title="THE FACES">{faces.deg <= 35 ? 'The section’s faces are in front of the mic: it hears the people first.' : `The section is ${Math.round(faces.deg)}° off the mic’s axis: it hears less of the people it is there for.`}</Point>
        </Card>
        {good ? <Note tone="ok">{spec.words.done}</Note> : <Body>Aim at the faces with the PA toward the mic’s rejection — try TILT and PLACE as well as TURN.</Body>}
        <Note tone="warn">A pattern’s rejection depends on frequency, and the room reflects the PA from every side: a label never removes a loudspeaker. Listen with the PA at full level — at the agreed level, never provoking feedback.</Note>
      </>
    ),
  };
}

/* ── A PAIR OR TWO ZONES ── */

type PairId = 'xy' | 'ortf' | 'ab' | 'zones';
const PAIRS: Readonly<Record<PairId, { label: string; short: string; a: P2; b: P2; h: number; words: string }>> = {
  xy: { label: 'A coincident XY pair', short: 'XY', a: STUDIO.M, b: STUDIO.M, h: STUDIO.hBar, words: 'Two capsules at one point, angled apart: every source reaches both at the same moment. Width from level differences only — a predictable mono sum.' },
  ortf: { label: 'A near-coincident pair', short: 'NEAR PAIR', a: { x: STUDIO.M.x - 0.085, y: STUDIO.M.y }, b: { x: STUDIO.M.x + 0.085, y: STUDIO.M.y }, h: STUDIO.hBar, words: 'Two capsules a hand’s width apart, angled out: small time differences add width, with some mono compatibility — audition the mono sum.' },
  ab: { label: 'A spaced omni pair', short: 'SPACED', a: { x: -0.3, y: 4 }, b: { x: 0.3, y: 4 }, h: 3.8, words: 'Two omnis spaced apart over the hall: a sense of the room and its low end — and time differences that comb in mono.' },
  zones: { label: 'Two zone mics', short: 'TWO ZONES', a: STUDIO.ZL, b: STUDIO.ZR, h: STUDIO.hCorner, words: 'One mic at each front corner, each its own zone: metres apart, each nearest its own people. Not a stereo pair — the image can wander and the mono sum colours.' },
};

export function usePairZonesStep(spec: { onDone: () => void; prediction?: Prediction; words: { looking: string; prompt: string; done: string } }): MikingStep {
  const [pid, setPid] = useState<PairId>('xy');
  const [src, setSrc] = useState<'middle' | 'side'>('middle');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['xy:middle']));
  const [predicted, setPredicted] = useState<string | null>(null);
  const P = PAIRS[pid];
  const sp: P2 = src === 'middle' ? STUDIO.S : { x: -3.6, y: 3 };
  const R = pairReading(sp, FACE_H, P.a, P.h, P.b, P.h);
  const onDone = spec.onDone;
  const done = seen.has('zones:side') && seen.has('xy:side');
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  const mark = (p: PairId, s: 'middle' | 'side') => setSeen((q) => (q.has(`${p}:${s}`) ? q : new Set([...q, `${p}:${s}`])));
  const mics: SportMic[] =
    pid === 'xy'
      ? [{ id: 'xy', kind: 'xy', label: 'XY pair', at: P.a, h: P.h, aimAt: STUDIO.S, aimH: FACE_H, pattern: null }]
      : [
          { id: 'a', kind: 'compact', label: 'mic A', at: P.a, h: P.h, aimAt: pid === 'zones' ? { x: -2.2, y: 5 } : pid === 'ortf' ? { x: -3, y: 7 } : { x: P.a.x, y: 7 }, aimH: FACE_H, pattern: pid === 'ab' ? null : 'cardioid' },
          { id: 'b', kind: 'compact', label: 'mic B', at: P.b, h: P.h, aimAt: pid === 'zones' ? { x: 2.2, y: 5 } : pid === 'ortf' ? { x: 3, y: 7 } : { x: P.b.x, y: 7 }, aimH: FACE_H, pattern: pid === 'ab' ? null : 'cardioid' },
        ];
  const words = `${P.label}; a source ${src === 'middle' ? 'in the middle of the section' : 'at one side, near the front'}: ${Math.abs(R.dtMs) < 0.005 ? 'it reaches both capsules at the same moment — no comb in mono' : `one capsule hears it ${Math.abs(R.dtMs).toFixed(2)} ms later; summed to mono, the first notch near ${R.notch != null ? `${Math.round(R.notch)} Hz` : '—'}`}.`;
  return {
    key: 'pairZones',
    title: 'A pair or two zones',
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={STUDIO_SCENE} box={{ x0: -6, y0: -1.5, x1: 6, y1: 9 }} a11y={words} labels={venueLabels(STUDIO_SCENE, { targets: false, marks: false })} show={{ targets: false, marks: false }}>
          {(px, g) => (
            <>
              <PlanPath a={sp} b={P.a} px={px} color="#8fbcff" width={2.2} />
              <PlanPath a={sp} b={P.b} px={px} color={AMBER} width={2.2} />
              {mics.map((m) => (
                <MicOnPlan key={m.id} m={m} px={px} g={g} />
              ))}
              <TargetRing p={sp} px={px} active />
            </>
          )}
        </PlanStage>
      ),
      badge: 'From above · blue and amber = the paths to the two capsules · one point source, straight paths: a simplified picture · silent',
      bezel: [
        { k: 'METHOD', v: P.short, flex: 1.2 },
        { k: 'Δt', v: Math.abs(R.dtMs) < 0.005 ? '0 ms' : `${Math.abs(R.dtMs).toFixed(2)} ms`, flex: 0.9 },
        { k: 'MONO NOTCH', v: R.notch != null ? `${Math.round(R.notch)} Hz` : 'NONE', tint: R.notch != null && R.notch < 2000 ? RED : undefined, flex: 1.2 },
      ],
      params: [
        {
          kind: 'options',
          id: 'pair',
          label: 'METHOD',
          valueLabel: P.short,
          selectedId: pid,
          sticky: true,
          onSelect: (id) => {
            setPid(id as PairId);
            mark(id as PairId, src);
          },
          options: (Object.keys(PAIRS) as PairId[]).map((k) => ({ id: k, label: PAIRS[k].label, blurb: PAIRS[k].words })),
        },
        {
          kind: 'options',
          id: 'src',
          label: 'SOURCE',
          valueLabel: src === 'middle' ? 'MIDDLE' : 'SIDE',
          selectedId: src,
          sticky: true,
          onSelect: (id) => {
            setSrc(id as typeof src);
            mark(pid, id as typeof src);
          },
          options: [
            { id: 'middle', label: 'Applause in the middle', blurb: 'A source in the middle of the section.' },
            { id: 'side', label: 'A laugh at one side', blurb: 'A source at one side, near the front.' },
          ],
        },
      ],
      initialParam: 'pair',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          <Point title={P.label.toUpperCase()}>{P.words}</Point>
          <Point title="THIS SOURCE">{words}</Point>
        </Card>
        {done ? <Note tone="ok">{spec.words.done}</Note> : <Body>Try TWO ZONES and XY with the SOURCE at one SIDE.</Body>}
        <Body>Calculated from the drawing with the speed of sound; the notch is the first one of an equal-level mono sum. A real crowd is many sources at once — listen to the mono output.</Body>
      </>
    ),
  };
}

