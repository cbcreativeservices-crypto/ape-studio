/**
 * SUSPENDED METAL PAGES — the Kick journey (LESSON_JOURNEY.md) for Lab 2's
 * triangle, finger cymbals, bar chimes and gong: meet → how it sounds →
 * where it sits → microphones → placement (worked example first) → studio or
 * live → two mics → troubleshoot → practice.
 *
 * The hand-drum factory (shared/hand/handPages) carries the setting,
 * microphone, placement, context, two-mic and practice pages unchanged; this
 * family adds what a hanging metal instrument needs:
 *   • MEET: the instrument drawn FACE-ON (from the audience) — the side and
 *     top placement views see a triangle, a row of chimes or a gong edge-on —
 *     with its parts named by tap, and the way it is played chosen (VARIANT);
 *   • HOW IT SOUNDS: the stroke stepped through (or played ONCE) over the
 *     face-on drawing, then the metal's own vibration shapes (a bar free at
 *     both ends, or a disc), then attack and ring in words;
 *   • the way of playing can differ per variant (finger cymbals held still
 *     or danced): each variant may bring its own placement words and zones.
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing loops (the stroke plays ONCE, D8).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { ExpandableFigure } from '../../../../kit/ExpandableFigure';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { PageId, VariantId, ViewBox } from '../../../engine/model/types.ts';
import { fitXform, unproject } from '../../../engine/geometry/frame.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';
import { StaticLabels } from '../../../engine/scene/StaticLabels';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { factsStep, startStep } from '../journeyPages';
import { makeHandPages, useStepper, type HandSpec } from '../hand/handPages';
import { BAR_SHAPES, barAt, barStrikeShare, chimePitchRatio, DISC_SHAPES, discAt, discPeak, discStillDiameters, discStillRings, discStrikeShare, octaves } from './metalModes.ts';
import { CYMBAL_SHAPES, cymbalShapeAt, cymbalShapePeak, cymbalStillDiameters, cymbalStillRings, cymbalStrikeShare } from '../cymbals/cymbalModes.ts';
import { BarFace, DiscFace, type BarGeom } from './metalFigures';

/* ═══════════════ the face-on drawing ═══════════════ */

export type FrontArt = {
  /** The frame (u = across, seen from the audience; v = y, down). */
  box: (variant: VariantId) => ViewBox;
  Art: (p: { variant: VariantId; highlight: string | null }) => ReactElement;
  labels: (variant: VariantId) => ArtLabel[];
  hitTest: (variant: VariantId, u: number, v: number, tol: number) => string | null;
};

function FrontStage({ w, h, front, variant, highlight, onTap, label }: { w: number; h: number; front: FrontArt; variant: VariantId; highlight: string | null; onTap?: (id: string) => void; label: string }) {
  const textScale = useStageTextScale();
  const box = front.box(variant);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [box, w, h]);
  const Art = front.Art;
  const press = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!onTap) return;
    const { u, v } = unproject(xf, e.nativeEvent.locationX, e.nativeEvent.locationY);
    const id = front.hitTest(variant, u, v, 22 / xf.s);
    if (id) onTap(id);
  };
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={press} disabled={!onTap} accessibilityRole="image" accessibilityLabel={label} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={label}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <Art variant={variant} highlight={highlight} />
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={front.labels(variant).map((l) => ({ ...l, tone: l.id === highlight ? 'amber' : l.tone }))} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/* ═══════════════ the variant choice, shared by the pages ═══════════════ */

type VariantCtx = { variant: VariantId; setVariant: (v: VariantId) => void; options: readonly { id: string; label: string; blurb: string }[]; key: string };
const VariantContext = createContext<VariantCtx | null>(null);

/** The way of playing, as chips (the placement page's well). */
export function VariantChips() {
  const c = useContext(VariantContext);
  if (!c || c.options.length < 2) return null;
  const cur = c.options.find((o) => o.id === c.variant);
  return (
    <View style={styles.tray}>
      <Text style={styles.trayHead}>{c.key}</Text>
      <View style={styles.chips}>
        {c.options.map((o) => (
          <Pressable key={o.id} onPress={() => c.setVariant(o.id)} style={[styles.chip, o.id === c.variant && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: o.id === c.variant }} accessibilityLabel={o.label}>
            <Text style={[styles.chipText, o.id === c.variant && { color: colors.amber }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
      {cur ? <Text style={styles.blurb}>{cur.blurb}</Text> : null}
    </View>
  );
}

function variantParam(p: PageProps, key: string): DockParam | null {
  const vs = p.lesson.model.variants;
  if (vs.length < 2) return null;
  const cur = vs.find((v) => v.id === p.variant) ?? vs[0];
  return { kind: 'options', id: 'variant', label: key, valueLabel: cur.label, selectedId: cur.id, onSelect: (id) => p.setVariant(id), sticky: true, options: vs.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })) };
}

/* ═══════════════ 1 · MEET THE INSTRUMENT ═══════════════ */

export type MeetSpec = {
  intro: string;
  front: FrontArt;
  figure: { title: string; badge: string; label: (variant: VariantId) => string };
  partsBadge: string;
  partsLooking: (variant: VariantId) => string;
  partsNote: string;
  partsWarn: string;
  /** The dock key for the variant ("PLAYED", "GONG"). */
  variantKey: string;
};

function MetalInstrument(spec: MeetSpec) {
  return function MInstrument(p: PageProps) {
    const { lesson, journey, variant } = p;
    const model = lesson.model;
    const parts = model.parts.filter((q) => (!q.variants || q.variants.includes(variant)) && (!q.listIn || q.listIn.includes(variant)));
    const [partId, setPartId] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const pick = (id: string) => {
      if (!parts.some((q) => q.id === id)) return;
      setPartId(id);
      setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    };
    const shown = parts.find((q) => q.id === partId);
    const region = model.regions.find((r) => r.partId === partId && (!r.variants || r.variants.includes(variant)));
    const partIdx = Math.max(0, parts.findIndex((q) => q.id === partId));
    const box = spec.front.box(variant);
    const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
    const vNote = model.variants.find((v) => v.id === variant);
    const vp = variantParam(p, spec.variantKey);
    const steps: MikingStep[] = [
      startStep(lesson, journey, spec.intro),
      factsStep(lesson, <ExpandableFigure badge={spec.figure.badge} title={spec.figure.title} aspect={aspect} render={(fw: number, fh: number) => <FrontStage w={fw} h={fh} front={spec.front} variant={variant} highlight={null} label={spec.figure.label(variant)} />} />),
      {
        key: 'parts',
        title: 'The parts',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) => <FrontStage w={w} h={h} front={spec.front} variant={variant} highlight={partId} onTap={pick} label={`${spec.figure.label(variant)}${shown ? ` Highlighted: ${shown.label}.` : ''}`} />,
          badge: spec.partsBadge,
          bezel: [
            { k: 'PART', v: shown ? shown.short.toUpperCase() : 'TAP ONE', flex: 1.5 },
            { k: 'LOOKED AT', v: `${seen.size} / ${parts.length}` },
            { k: spec.variantKey, v: (vNote?.label ?? variant).split(' ')[0], flex: 1.1 },
          ],
          params: [
            {
              kind: 'fader',
              id: 'part',
              label: 'PART',
              value: parts.length > 1 ? partIdx / (parts.length - 1) : 0,
              onChange: (v) => {
                const q = parts[Math.round(v * (parts.length - 1))];
                if (q) pick(q.id);
              },
              format: () => (shown ? `${shown.short.toUpperCase()} · ${seen.size} of ${parts.length} looked at` : `step through the ${parts.length} parts`),
              formatShort: () => (shown ? shown.short.toUpperCase().slice(0, 9) : 'STEP'),
            },
            ...(vp ? [vp] : []),
          ],
          initialParam: 'part',
        },
        well: (
          <>
            <Landing looking={spec.partsLooking(variant)} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
            {shown ? (
              <Card>
                <Point title={shown.label.toUpperCase()}>{shown.role}</Point>
                {region ? <Body>{`WHERE SOUND COMES FROM · ${region.note}`}</Body> : null}
              </Card>
            ) : (
              <Note>{spec.partsNote}</Note>
            )}
            {vp && vNote ? <Body>{`${vNote.label}: ${vNote.blurb}`}</Body> : null}
            <Note tone="warn">{spec.partsWarn}</Note>
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/* ═══════════════ 2 · HOW IT SOUNDS ═══════════════ */

export type StrikeFigure = (p: { w: number; h: number; variant: VariantId; shown: number; accessibilityLabel: string }) => ReactElement;
export type StrikePick = { id: string; label: string; words: string; blurb: string };

type ShapeView = { label: string; still: string; ratio: number; at: (q: number, t: number) => number; share: (q: number) => number; rings: readonly number[]; diams: readonly number[]; nodes: readonly number[] };

export type BarShapesSpec = {
  kind: 'bar';
  /** The bar as drawn, per variant (and, with `lengths`, per chosen bar). */
  geom: (variant: VariantId, lengthMm?: number) => { box: ViewBox; geom: BarGeom; rodD: number; metal: readonly string[]; amp: number; under?: ReactNode };
  strikes: readonly (StrikePick & { s: number })[];
  /** A graduated set (bar chimes): the bars' lengths, longest first. */
  lengths?: { mm: readonly number[]; words: string };
};
export type DiscShapesSpec = {
  kind: 'disc';
  /** 'free': hung by its rim (a gong); 'centreHeld': held at a centre strap. */
  set: 'free' | 'centreHeld';
  diameterMm: (variant: VariantId) => number;
  strikes: (variant: VariantId) => readonly (StrikePick & { r: number })[];
  metal: readonly string[];
  boss?: (variant: VariantId) => number | undefined;
  knot?: boolean;
  rim?: boolean;
};

export type SoundSpec = {
  Strike: StrikeFigure;
  strikeTitle: string;
  strikeBadge: string;
  strikeLooking: (variant: VariantId) => string;
  cells: (variant: VariantId) => readonly { k: string; at: readonly string[]; flex?: number }[];
  /** After the last event. */
  after: (variant: VariantId) => string;
  shapes: (BarShapesSpec | DiscShapesSpec) & { title: string; badge: string; looking: (variant: VariantId) => string; prompt: string; strikeWord: string; subject: string; notes: (variant: VariantId) => readonly string[]; tried: string };
  silentNote: string;
  variantKey: string;
};

function barViews(): ShapeView[] {
  return BAR_SHAPES.map((b) => ({ label: `${b.n}`, still: `${b.nodes.length} still points`, ratio: b.ratio, at: (x) => barAt(b, x), share: (x) => barStrikeShare(b, x), rings: [], diams: [], nodes: b.nodes }));
}
function discViews(set: 'free' | 'centreHeld'): ShapeView[] {
  if (set === 'free') return DISC_SHAPES.slice(0, 9).map((d) => ({ label: d.label, still: d.still, ratio: d.ratio, at: (r, t) => discAt(d, r, t) / discPeak(d), share: (r) => discStrikeShare(d, r), rings: discStillRings(d), diams: discStillDiameters(d), nodes: [] }));
  return CYMBAL_SHAPES.map((c) => ({ label: c.label, still: c.still, ratio: c.ratio, at: (r, t) => cymbalShapeAt(c, r, t) / cymbalShapePeak(c), share: (r) => cymbalStrikeShare(c, r), rings: cymbalStillRings(c), diams: cymbalStillDiameters(c), nodes: [] }));
}

function MetalSound(spec: SoundSpec) {
  return function MSound(p: PageProps) {
    const { lesson, answers, onAnswered, onInteractive, interactiveDone, variant, hidden } = p;
    const S = lesson.sound;
    const n = S.stages.length;
    const st = useStepper(n, hidden);
    const [predicted, setPredicted] = useState<string | null>(null);
    useEffect(() => {
      if (st.shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
    }, [st.shown, n, interactiveDone, onInteractive]);
    const stage = S.stages[st.shown - 1];
    const stageText = (i: number) => S.stages[i].byVariant?.[variant] ?? S.stages[i].text;
    const vp = variantParam(p, spec.variantKey);
    const pred = lesson.predictions.sound;
    const reached = st.shown >= n;
    const cells = spec.cells(variant);
    const strikeBezel: BezelItem[] = [{ k: 'EVENT', v: `${st.shown} / ${n}`, flex: 0.8 }, ...cells.map((c) => ({ k: c.k, v: c.at[Math.min(c.at.length - 1, st.shown - 1)] ?? '—', flex: c.flex ?? 1 }))];

    /* the shapes */
    const SH = spec.shapes;
    const views = useMemo(() => (SH.kind === 'bar' ? barViews() : discViews(SH.set)), [SH]);
    const picks = SH.kind === 'bar' ? SH.strikes : SH.strikes(variant);
    const [shapeIdx, setShapeIdx] = useState(0);
    const [swing, setSwing] = useState(1);
    const [pickId, setPickId] = useState<string>(picks[0].id);
    const [moved, setMoved] = useState(false);
    const [barIdx, setBarIdx] = useState(0);
    const shape = views[Math.min(shapeIdx, views.length - 1)];
    const pick = picks.find((q) => q.id === pickId) ?? picks[0];
    const at = (pick as { s?: number; r?: number }).s ?? (pick as { r?: number }).r ?? 0;
    const share = shape.share(at);
    const sharePct = Math.round(share * 100);
    const lengths = SH.kind === 'bar' ? SH.lengths : undefined;
    const Lsel = lengths ? lengths.mm[Math.min(barIdx, lengths.mm.length - 1)] : undefined;
    const pitch = lengths && Lsel ? chimePitchRatio(Lsel, lengths.mm[0]) : 1;

    const shapeParams: DockParam[] = [
      {
        kind: 'fader',
        id: 'shape',
        label: 'SHAPE',
        value: shapeIdx / (views.length - 1),
        onChange: (v) => setShapeIdx(Math.round(v * (views.length - 1))),
        format: () => `${SH.kind === 'bar' ? `shape ${shape.label}` : shape.label} · ${shape.still}`,
        formatShort: () => (SH.kind === 'bar' ? `#${shape.label}` : shape.label),
      },
      {
        kind: 'options',
        id: 'strike',
        label: 'STROKE',
        valueLabel: pick.label,
        selectedId: pick.id,
        onSelect: (id) => {
          setPickId(id);
          if (id !== picks[0].id) setMoved(true);
        },
        sticky: true,
        options: picks.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })),
      },
      {
        kind: 'fader',
        id: 'swing',
        label: 'SWING',
        value: (swing + 1) / 2,
        home: 1,
        onChange: (v) => setSwing(Math.round((v * 2 - 1) * 20) / 20),
        format: () => (Math.abs(swing) < 0.05 ? 'passing through rest' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'one way' : 'the other way'}`),
        formatShort: () => `${Math.round(swing * 100)} %`,
      },
      ...(lengths
        ? [
            {
              kind: 'fader' as const,
              id: 'bar',
              label: 'BAR',
              value: barIdx / (lengths.mm.length - 1),
              onChange: (v: number) => setBarIdx(Math.round(v * (lengths.mm.length - 1))),
              format: () => `bar ${barIdx + 1} of ${lengths.mm.length} · ${Math.round((Lsel ?? 0) / 10)} cm long`,
              formatShort: () => `${barIdx + 1}`,
            },
          ]
        : []),
      ...(vp ? [vp] : []),
    ];
    const shapeBezel: BezelItem[] = lengths
      ? [
          { k: 'SHAPE', v: shape.label, flex: 0.7 },
          { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
          { k: 'UNDER STROKE', v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.1 },
          { k: 'VS LONGEST', v: `× ${pitch.toFixed(2)}`, sub: `${octaves(pitch).toFixed(1)} oct up`, flex: 1.1 },
        ]
      : [
          { k: 'SHAPE', v: shape.label, flex: 0.8 },
          { k: 'RATIO', v: `× ${shape.ratio.toFixed(2)}`, sub: 'vs lowest', flex: 0.9 },
          { k: 'UNDER STROKE', v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
          { k: 'STROKE', v: pick.label, flex: 1 },
        ];
    const a11yShape = `${SH.subject}, in its vibration shape ${shape.label}: ${shape.still}. ${Math.abs(swing) < 0.05 ? 'Passing through rest.' : 'Motion drawn much larger than life.'} A stroke ${pick.words} moves ${sharePct} percent of this shape's peak.`;
    const renderShapes = (w: number, h: number) => {
      if (SH.kind === 'bar') {
        const g = SH.geom(variant, Lsel);
        return <BarFace w={w} h={h} box={g.box} geom={g.geom} rodD={g.rodD} metal={g.metal} amp={g.amp} under={g.under} at={(x) => shape.at(x, 0) * swing} nodes={shape.nodes} strikeS={at} strikeWord={SH.strikeWord} accessibilityLabel={a11yShape} />;
      }
      return (
        <DiscFace
          w={w}
          h={h}
          diameterMm={SH.diameterMm(variant)}
          at={(r, t) => shape.at(r, t) * swing}
          fieldKey={`${shape.label}:${swing}`}
          stillRings={shape.rings}
          stillDiameters={shape.diams}
          strikeMm={(at * SH.diameterMm(variant)) / 2}
          strikeWord={SH.strikeWord}
          metal={SH.metal}
          boss={SH.boss?.(variant)}
          knot={SH.knot}
          rim={SH.rim}
          accessibilityLabel={a11yShape}
        />
      );
    };
    const drive = share < 0.05 ? 'barely drives this shape: it lands on or near a still line' : share < 0.4 ? 'drives it only a little' : 'drives it strongly';
    const steps: MikingStep[] = [
      {
        key: 'strike',
        title: spec.strikeTitle,
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => <spec.Strike w={w} h={h} variant={variant} shown={st.shown} accessibilityLabel={`${spec.strikeLooking(variant)}. Event ${st.shown} of ${n}: ${stage.title}. ${stageText(st.shown - 1)}`} />,
          badge: spec.strikeBadge,
          bezel: strikeBezel,
          params: [...st.params, ...(vp ? [vp] : [])],
          initialParam: 'step',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={spec.strikeLooking(variant)} prompt="STEP through the stroke, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
            <Card>
              <Point title={`${st.shown} · ${stage.title.toUpperCase()}`}>{stageText(st.shown - 1)}</Point>
            </Card>
            {reached ? <Note>{spec.after(variant)}</Note> : null}
          </>
        ),
      },
      {
        key: 'shapes',
        title: SH.title,
        kind: 'COMPARE',
        layout: 'rack',
        rack: { render: renderShapes, badge: SH.badge, bezel: shapeBezel, params: shapeParams, initialParam: 'shape' },
        well: (
          <>
            <Landing looking={SH.looking(variant)} prompt={SH.prompt} />
            <Card>
              <Point title={`SHAPE ${shape.label} · ${shape.still.toUpperCase()}`}>
                {`A struck ${lesson.noun.one} rings in many shapes at once; this is one of them. ${shapeIdx === 0 ? 'It is the lowest one this simplified model gives.' : `In this simplified model its pitch is ${shape.ratio.toFixed(2)} times the lowest one’s — not a whole number, which is part of why struck metal shimmers rather than sounding one plain note.`} A stroke ${pick.words} moves ${sharePct} % of this shape’s peak there, so it ${drive}.`}
              </Point>
              {lengths && Lsel ? <Body>{`${lengths.words} This bar is ${Math.round(Lsel / 10)} cm long: about ${pitch.toFixed(2)} times the pitch of the longest (${octaves(pitch).toFixed(1)} octaves up) — every one of its shapes moves up together.`}</Body> : null}
            </Card>
            {SH.notes(variant).map((t) => (
              <Note key={t.slice(0, 28)}>{t}</Note>
            ))}
            {moved && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${SH.tried}`}</Note> : null}
          </>
        ),
      },
      {
        key: 'where',
        title: 'Attack and ring',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              <Point title="ATTACK">{S.attack}</Point>
              <Point title="RING">{S.body}</Point>
            </Card>
            <Note>{spec.silentNote}</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/* ═══════════════ the page set ═══════════════ */

export type MetalSpec = {
  meet: MeetSpec;
  sound: SoundSpec;
  /** The hand-drum journey's words, per variant where they differ (the
   *  default variant's spec is the fallback). */
  hand: HandSpec;
  handByVariant?: Partial<Record<VariantId, HandSpec>>;
};

type PageFn = (p: PageProps) => ReactNode;

export function makeMetalPages(spec: MetalSpec): Record<PageId, PageFn> {
  const sound = MetalSound(spec.sound);
  const base = makeHandPages(spec.hand, sound);
  const byV: Record<string, Record<PageId, PageFn>> = {};
  for (const [v, h] of Object.entries(spec.handByVariant ?? {})) if (h) byV[v] = makeHandPages(h, sound);
  const pick = (id: PageId): PageFn =>
    function VariantPage(p: PageProps) {
      const P = (byV[p.variant] ?? base)[id];
      const ctx: VariantCtx = { variant: p.variant, setVariant: p.setVariant, options: p.lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })), key: spec.meet.variantKey };
      return (
        <VariantContext.Provider value={ctx}>
          <P key={p.variant} {...p} />
        </VariantContext.Provider>
      );
    };
  return {
    ...base,
    instrument: MetalInstrument(spec.meet),
    sound,
    placement: pick('placement'),
    context: pick('context'),
    twoMic: pick('twoMic'),
  };
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingVertical: 6 },
  trayHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  blurb: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
