/**
 * HOW IT SOUNDS for a cymbal lesson (LESSON_JOURNEY §6 stage 2, §7 "plates:
 * plate mode shapes from features/cymatics/plateModes.ts"). FULLY SILENT —
 * how the plate PRODUCES and RADIATES sound, shown with physics the app
 * already has, never played:
 *
 *   STRIKE TO SOUND (rack)  PREDICT FIRST, then the four events on the
 *                           lesson's own plate (CymbalStrikeFx): STEP, or PLAY
 *                           ONCE — a staged reveal that stops at ④ (D8).
 *   THE PLATE'S SHAPES (rack) the plate face-on in one vibration shape (the
 *                           Cymatics Lab's centre-held disc, cymbalModes.ts):
 *                           still lines, + / −, the ratio, and how much moves
 *                           under the stick on each playing area.
 *   WHO HEARS IT (rack)     when the cymbal's sound reaches its own mic, an
 *                           overhead and a drum mic (straight paths, 20 °C;
 *                           kitPages/ArrivalsScene) — where it sits, in time.
 *   ATTACK AND BODY (read)  in words, the links to the overheads and the
 *                           complete-kit lessons, then the checks.
 * Credit: the strike sequence reached ④ + the checks (the shared rule).
 */
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { colors } from '../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { ViewId } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { useStepReveal } from '../kitPages/useStepReveal';
import { useArrivalsStep } from '../kitPages/kitSoundSteps';
import { CymbalModeFace } from './CymbalArt';
import { CYMBAL_SHAPES, cymbalStrikeShare, edgeToBow } from './cymbalModes.ts';
import { CymbalStrikeFx } from './CymbalStrikeFx';
import { cymOf } from './cymbalLesson.ts';

export function CymbalSoundPage({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const X = cymOf(lesson);
  const W = X.strike;
  const variants = lesson.model.variants;
  const variantLabel = variants.find((v) => v.id === variant)?.label ?? variant.toUpperCase();
  const spec = X.specIn?.[variant] ?? X.spec;
  const inverted = !!X.invertedIn?.includes(variant);
  const gap = X.pair ? X.pair.gapIn[variant] ?? 0 : null;
  const ringScale = X.ringIn?.[variant] ?? 1;

  /* ── 1 · the strike ── */
  const n = W.stages.length;
  const s = useStepReveal(n, hidden);
  const [predicted, setPredicted] = useState<string | null>(null);
  const reached = s.shown >= n;
  useEffect(() => {
    if (reached && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [reached, interactiveDone, onInteractive]);
  const stage = W.stages[s.shown - 1];
  const stageText = (i: number) => W.stages[i].byVariant?.[variant] ?? W.stages[i].text;
  const strikeParams: DockParam[] = [
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
    ...(variants.length > 1
      ? [
          {
            kind: 'options' as const,
            id: 'setup',
            label: 'SETUP',
            valueLabel: variantLabel,
            selectedId: variant,
            onSelect: (id: string) => setVariant(id),
            options: variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
          },
        ]
      : []),
  ];
  const strikeBezel: BezelItem[] = [{ k: 'EVENT', v: `${s.shown} / ${n}`, flex: 0.8 }, ...W.cells.map((c) => ({ k: c.k, v: c.at[Math.min(c.at.length - 1, s.shown - 1)] ?? '—', flex: c.flex ?? 1 }))];

  /* ── 2 · the plate's shapes ── */
  const areas = X.shapes.areas;
  const [idx, setIdx] = useState(0);
  const [swing, setSwing] = useState(1);
  const [areaId, setAreaId] = useState(X.shapes.defaultArea);
  const area = areas.find((a) => a.id === areaId) ?? areas[0];
  const R = spec.d.mm / 2;
  const areaR = area.rFrac != null ? area.rFrac * R : area.r;
  const shape = CYMBAL_SHAPES[idx];
  const share = cymbalStrikeShare(shape, areaR / R);
  const pct = Math.round(share * 100);
  const shapeParams: DockParam[] = [
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
      valueLabel: area.label,
      selectedId: area.id,
      onSelect: setAreaId,
      sticky: true,
      options: areas.map((a) => ({ id: a.id, label: a.label, blurb: a.blurb })),
    },
  ];
  const shapeBezel: BezelItem[] = [
    { k: 'SHAPE', v: shape.label, flex: 0.8 },
    { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
    { k: 'UNDER STICK', v: `${pct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.1 },
    { k: 'STILL LINES', v: `${shape.n + shape.s}`, flex: 0.9 },
  ];
  const edgeMost = edgeToBow(shape) > 1;

  /* ── 3 · who hears it ── */
  const A = X.arrivals;
  const Instrument = art.Instrument;
  const Background = useCallback((p: { view: ViewId }): ReactElement => <Instrument view={p.view} variant={variant} />, [Instrument, variant]);
  const box = useMemo(() => ({ side: A.box.side, top: A.box.top }), [A.box]);
  const arrivals = useArrivalsStep({ words: A, box, Background, sources: A.sources, points: A.points, maxMs: A.maxMs });

  const pred = lesson.predictions.sound;
  const steps: MikingStep[] = [
    {
      key: 'strike',
      title: W.title,
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <CymbalStrikeFx
            w={w}
            h={h}
            spec={spec}
            profile={X.profile}
            inverted={inverted}
            pairGap={gap}
            rFrac={W.rFracIn?.[variant] ?? W.rFrac}
            ringScale={ringScale}
            reveal={s.reveal}
            shown={s.shown}
            marks={W.marks}
            accessibilityLabel={`${W.looking}, ${variantLabel.toLowerCase()}. Event ${s.shown} of ${n}: ${stage.title}. ${stageText(s.shown - 1)}`}
          />
        ),
        badge: W.badge,
        bezel: strikeBezel,
        params: strikeParams,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${W.looking} · ${variantLabel.toLowerCase()}`} prompt={W.prompt} />
          <Card>
            <Point title={`${s.shown} · ${stage.title.toUpperCase()}`}>{stageText(s.shown - 1)}</Point>
          </Card>
          {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${W.reveal}`}</Note> : null}
          {reached ? <Note>{W.after}</Note> : null}
        </>
      ),
    },
    {
      key: 'shapes',
      title: X.shapes.title,
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <CymbalModeFace
            w={w}
            h={h}
            spec={spec}
            shape={shape}
            strikeMm={areaR}
            swing={swing}
            accessibilityLabel={`${X.shapes.looking}, in the shape ${shape.label}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through flat.' : 'Blue regions move toward you, amber away.'} The stick on the ${area.label.toLowerCase()} moves ${pct} percent of this shape's peak.`}
          />
        ),
        badge: X.shapes.badge,
        bezel: shapeBezel,
        params: shapeParams,
        initialParam: 'shape',
      },
      well: (
        <>
          <Landing looking={`${X.shapes.looking} · shape ${shape.label}`} prompt={X.shapes.prompt} />
          <Card>
            <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
              {`A struck cymbal rings in many shapes at once; this is one of them. ${idx === 0 ? 'It is the lowest the plate model gives a disc held at its centre.' : `On the simplified flat disc its pitch is ${shape.ratio.toFixed(2)} times the lowest one’s — not a whole number, which is part of why a cymbal sounds like a wash rather than a note.`} With the stick on the ${area.label.toLowerCase()}, the plate moves ${pct} % of this shape’s peak there, so the stroke ${share < 0.05 ? 'barely drives this shape' : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.${edgeMost ? ' In this shape the edge moves more than the middle of the plate.' : ''}`}
            </Point>
          </Card>
          {X.shapes.notes.map((t) => (
            <Note key={t.slice(0, 24)}>{t}</Note>
          ))}
        </>
      ),
    },
    arrivals,
    {
      key: 'body',
      title: 'Attack and body',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{lesson.sound.attack}</Point>
            <Point title="BODY">{lesson.sound.body}</Point>
            <Point title={X.bodyTitle}>{X.bodyNote}</Point>
          </Card>
          {X.links.map((t) => (
            <Note key={t.slice(0, 24)}>{t}</Note>
          ))}
          <Note>This lab never plays a sound and draws no frequency curve for the cymbal: how a real cymbal sounds depends on its alloy, weight, hammering and lathing, the stick and the player. The pictures show where the sound starts, where it leaves and when it arrives.</Note>
          <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/** The family's own pages (the rest are the shared pages/). */
export const CYMBAL_PAGES = { sound: CymbalSoundPage as never };
