/**
 * HOW IT SOUNDS for the kit-level lessons (LESSON_JOURNEY §6 stage 2, §7):
 * the steps each lesson composes into its sound page. FULLY SILENT — "how it
 * sounds" is how the kit PRODUCES and RADIATES sound, shown with real physics
 * from models the app already has, never played:
 *
 *   useCymbalStrikeStep   a cymbal's strike, stepped or played ONCE (D8);
 *   useCymbalShapesStep   the plate's vibration shapes (the Cymatics Lab's
 *                         plate model), the stick's spot on bell / bow / edge;
 *   useArrivalsStep       when each source's sound reaches a listening point
 *                         (straight paths at 20 °C; optional reflections).
 *
 * The words are the lesson's (its kitCopy), walked by the learner-text test.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { colors } from '../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { Prediction, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import { fmtLen, fmtMs } from '../../../engine/model/units.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard } from '../../../engine/kit';
import { CymbalModeFace } from '../cymbals/CymbalArt';
import { CRASH_16, cymbalAreas } from '../cymbals/cymbalSpec.ts';
import { CYMBAL_SHAPES, cymbalStrikeShare, edgeToBow } from '../cymbals/cymbalModes.ts';
import { CymbalStrike } from './CymbalStrike';
import { ArrivalsScene, msFor, type ArrivalImage, type ArrivalPoint, type ArrivalSource } from './ArrivalsScene';
import { useStepReveal } from './useStepReveal';
import { viewToggle } from '../../../engine/scene/viewToggle.ts';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/* ── 1 · the strike ── */

export type StrikeWords = {
  title: string;
  badge: string;
  looking: string;
  prompt: string;
  stages: readonly { title: string; text: string }[];
  /** Bezel cells: their value at each event (index = event − 1). */
  cells: readonly { k: string; at: readonly string[]; flex?: number }[];
  /** After the last event (with a prediction made, `reveal` first). */
  reveal: string;
  after: string;
};

export function useCymbalStrikeStep({ words, hidden, prediction, onReached }: { words: StrikeWords; hidden: boolean; prediction?: Prediction; onReached: () => void }): { step: MikingStep; reached: boolean } {
  const n = words.stages.length;
  const s = useStepReveal(n, hidden);
  const [predicted, setPredicted] = useState<string | null>(null);
  const reached = s.shown >= n;
  useEffect(() => {
    if (reached) onReached();
  }, [reached, onReached]);
  const stage = words.stages[s.shown - 1];
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'step',
      label: 'STEP',
      value: (s.shown - 1) / Math.max(1, n - 1),
      onChange: (v) => s.goTo(1 + Math.round(v * (n - 1))),
      format: () => `${s.shown} of ${n} · ${stage.title.toLowerCase()}`,
      formatShort: () => `${s.shown} / ${n}`,
    },
    { kind: 'action', id: 'play', label: s.playing ? 'PAUSE' : reached ? 'REPLAY ONCE' : s.motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: s.play, tint: colors.green },
  ];
  const bezel: BezelItem[] = [{ k: 'EVENT', v: `${s.shown} / ${n}`, flex: 0.8 }, ...words.cells.map((c) => ({ k: c.k, v: c.at[Math.min(c.at.length - 1, s.shown - 1)] ?? '—', flex: c.flex ?? 1 }))];
  const step: MikingStep = {
    key: 'strike',
    title: words.title,
    kind: 'LEARN',
    layout: 'rack',
    rack: {
      render: (w, h) => <CymbalStrike w={w} h={h} reveal={s.reveal} shown={s.shown} accessibilityLabel={`A 16 inch crash cymbal cut through the stick's line, on its felts. Event ${s.shown} of ${n}: ${stage.title}. ${stage.text}`} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'step',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={words.looking} prompt={words.prompt} />
        <Card>
          <Point title={`${s.shown} · ${stage.title.toUpperCase()}`}>{stage.text}</Point>
        </Card>
        {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${words.reveal}`}</Note> : null}
        {reached ? <Note>{words.after}</Note> : null}
      </>
    ),
  };
  return { step, reached };
}

/* ── 2 · the plate's shapes ── */

export type ShapesWords = { title: string; badge: string; prompt: string; notes: readonly string[]; areas: Readonly<Record<'bell' | 'bow' | 'edge', { label: string; blurb: string }>> };

export function useCymbalShapesStep({ words }: { words: ShapesWords }): MikingStep {
  const spec = CRASH_16;
  const R = spec.d.mm / 2;
  const A = cymbalAreas(spec);
  const SPOTS = {
    bell: (A.bell[0] + A.bell[1]) / 2,
    bow: (A.bow[0] + A.bow[1]) / 2,
    edge: (A.edge[0] + A.edge[1]) / 2,
  } as const;
  const [idx, setIdx] = useState(0);
  const [swing, setSwing] = useState(1);
  const [spot, setSpot] = useState<'bell' | 'bow' | 'edge'>('bow');
  const shape = CYMBAL_SHAPES[idx];
  const share = cymbalStrikeShare(shape, SPOTS[spot] / R);
  const pct = Math.round(share * 100);
  const lines = shape.n + shape.s;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'shape',
      label: 'SHAPE',
      value: idx / (CYMBAL_SHAPES.length - 1),
      onChange: (v) => setIdx(Math.round(v * (CYMBAL_SHAPES.length - 1))),
      format: () => `${shape.label} · ${shape.still}`,
      formatShort: () => shape.label,
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
    {
      kind: 'options',
      id: 'stick',
      label: 'STICK',
      valueLabel: words.areas[spot].label,
      selectedId: spot,
      onSelect: (id) => setSpot(id as 'bell' | 'bow' | 'edge'),
      sticky: true,
      options: (['bell', 'bow', 'edge'] as const).map((k) => ({ id: k, label: words.areas[k].label, blurb: words.areas[k].blurb })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'SHAPE', v: shape.label, flex: 0.8 },
    { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
    { k: 'UNDER STICK', v: `${pct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.1 },
    { k: 'STILL LINES', v: `${lines}`, flex: 0.9 },
  ];
  const edgeMost = edgeToBow(shape) > 1;
  return {
    key: 'shapes',
    title: words.title,
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <CymbalModeFace
          w={w}
          h={h}
          spec={spec}
          shape={shape}
          strikeMm={SPOTS[spot]}
          swing={swing}
          accessibilityLabel={`A 16 inch crash seen from above, in the shape ${shape.label}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through flat.' : 'Blue regions move toward you, amber away.'} The stick on the ${spot} moves ${pct} percent of this shape's peak.`}
        />
      ),
      badge: words.badge,
      bezel,
      params,
      initialParam: 'shape',
    },
    well: (
      <>
        <Landing looking={`A 16 in crash from above · shape ${shape.label}`} prompt={words.prompt} />
        <Card>
          <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
            {`A struck cymbal rings in many shapes at once; this is one of them. ${idx === 0 ? 'It is the lowest the plate model gives a centre-held disc.' : `On the simplified flat disc its pitch is ${shape.ratio.toFixed(2)} times the lowest one’s — not a whole number, which is part of why a cymbal sounds like a wash rather than a note.`} With the stick on the ${words.areas[spot].label.toLowerCase()}, the plate moves ${pct} % of this shape’s peak there, so the stroke ${share < 0.05 ? 'barely drives this shape' : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.${edgeMost ? ' In this shape the edge moves more than the bow.' : ''}`}
          </Point>
        </Card>
        {words.notes.map((t) => (
          <Note key={t.slice(0, 24)}>{t}</Note>
        ))}
      </>
    ),
  };
}

/* ── 3 · arrivals ── */

/** `subject` / `event` (Lab 6 group 4): what the scene shows and what the clock counts from, for the screen reader and the TIME lane — default the kit's words ("the kit", "the strokes"). */
export type ArrivalsWords = { title: string; badge: string; prompt: string; looking: string; note: string; arrived: string; pending: string; subject?: string; event?: string };

export function useArrivalsStep({
  words,
  box,
  Background,
  sources,
  points,
  images = [],
  maxMs,
  onAllArrived,
  imagesFor,
}: {
  words: ArrivalsWords;
  box: Readonly<Record<ViewId, ViewBox>>;
  Background: (p: { view: ViewId }) => ReactElement;
  sources: readonly ArrivalSource[];
  points: readonly ArrivalPoint[];
  images?: readonly ArrivalImage[];
  maxMs: number;
  /** Called once TIME has passed every arrival at the point (the room's credit). */
  onAllArrived?: () => void;
  /** Mirror images that depend on the chosen point (reflections). */
  imagesFor?: (pointId: string) => readonly ArrivalImage[];
}): MikingStep {
  const [t, setT] = useState(0);
  const [pid, setPid] = useState(points[0].id);
  const [view, setView] = useState<ViewId>('side');
  const point = points.find((p) => p.id === pid) ?? points[0];
  const imgs = imagesFor ? imagesFor(point.id) : images;
  const rows = useMemo(() => {
    const out = sources.map((s) => ({ id: s.id, label: s.label, mm: dist(s.p, point.p), color: s.color, reflected: false }));
    for (const m of imgs) out.push({ id: m.id, label: m.label, mm: dist(m.p, point.p), color: m.color, reflected: true });
    return out.map((r) => ({ ...r, ms: msFor(r.mm) })).sort((a, b) => a.ms - b.ms);
  }, [sources, imgs, point]);
  const first = rows[0];
  const last = rows[rows.length - 1];
  useEffect(() => {
    if (onAllArrived && t >= last.ms) onAllArrived();
  }, [t, last.ms, onAllArrived]);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'time',
      label: 'TIME',
      value: t / maxMs,
      home: 0,
      onChange: (v) => setT(Math.round(v * maxMs * 20) / 20),
      format: () => `${t.toFixed(2)} ms after ${words.event ?? 'the strokes'}`,
      formatShort: () => `${t.toFixed(1)} ms`,
    },
    {
      kind: 'options',
      id: 'point',
      label: 'POINT',
      valueLabel: point.short ?? point.label.split(' ')[0],
      selectedId: point.id,
      onSelect: setPid,
      sticky: true,
      options: points.map((p) => ({ id: p.id, label: p.label })),
    },
    ...viewToggle({ view: view, setView: setView, stage: 'single' }),
  ];
  const bezel: BezelItem[] = rows.slice(0, 3).map((r) => ({ k: r.label.toUpperCase(), v: t >= r.ms ? 'ARRIVED' : fmtMs(r.ms), sub: t >= r.ms ? fmtMs(r.ms) : 'arrives at', tint: t >= r.ms ? r.color : undefined, flex: 1 }));
  bezel.push({ k: 'SPREAD', v: fmtMs(rows[rows.length - 1].ms - first.ms), sub: 'first→last', flex: 1 });
  return {
    key: 'arrivals',
    title: words.title,
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <ArrivalsScene
          w={w}
          h={h}
          view={view}
          box={box[view]}
          Background={Background}
          sources={sources}
          images={imgs}
          point={point}
          tMs={t}
          accessibilityLabel={`${view === 'side' ? 'Side' : 'Top'} view of ${words.subject ?? 'the kit'} with a listening point: ${point.label}. ${t.toFixed(2)} milliseconds after ${words.event ?? 'the strokes'}. ${rows.map((r) => `${r.label}: ${fmtLen(r.mm)} away, arrives after ${fmtMs(r.ms)}${t >= r.ms ? ', arrived' : ''}`).join('; ')}.`}
        />
      ),
      badge: words.badge,
      bezel,
      params,
      initialParam: 'time',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${point.label}`} prompt={words.prompt} />
        <Card>
          {rows.map((r) => (
            <Body key={r.id}>{`${t >= r.ms ? '✓' : '○'} ${r.label.toUpperCase()} · ${fmtLen(r.mm)} away · ${t >= r.ms ? words.arrived : words.pending} ${fmtMs(r.ms)}`}</Body>
          ))}
        </Card>
        <Note>{words.note}</Note>
      </>
    ),
  };
}
