/**
 * F10 SPATIAL FIELD PICKUP — the lesson's own pages (LessonArt.pages), on
 * the journey (docs/labs/miking/LESSON_JOURNEY.md), written to the new
 * journey (MEET IT and STARTING SETUPS given here):
 *
 *   MEET IT          START → WHAT IT IS → THE SCENE (step through the
 *                    listener's point, the front source, the moving source,
 *                    the footpath, the wall, the PA) → WHERE THE SOUND COMES
 *                    FROM (the walker scrubbed along the footpath by a
 *                    finger, its direction from the face; the wall's
 *                    reflection, its delay from the drawing) → THE
 *                    DELIVERABLE FIRST → checks
 *   STARTING SETUPS  real spatial rigs drawn whole on the site — a binaural
 *                    head; an Ambisonic mic with a close mic on the source; a
 *                    five-channel array (an example layout); Double M/S; a
 *                    front pair with a rear add-on; a seated listener's
 *                    height — each with its stand, its capsules' aims and its
 *                    exact shape in a corner → what else the mics hear →
 *                    before any mic (the checks)
 *   MICROPHONES      (after the engine's "on the instrument" step) THE
 *                    SYSTEMS, one by one: channels, where it goes, what it is
 *                    for, its limit → checks
 *   PLACEMENT        the worked example read piece by piece → START from a
 *                    setup, MOVE the rig and TURN its front, rest it in two
 *                    recommended starting points → how they work → checks
 *   CHANNELS AND     the A-FORMAT DRILL (four tracks in order, matched and
 *   DESTINATIONS     linked gain, the output convention chosen, no
 *   (context)        full-range channel in the LFE — where a test source
 *                    lands when one is wrong) → the DESTINATION CHECK → live
 *                    and broadcast routing → checks
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing moves by itself (a finger moves the walker).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { DashPathEffect, Group, LinearGradient, Path, RoundedRect, Skia, vec, Circle } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { SourcePageId, Vec3, ViewBox, ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { factsStep, startStep } from '../shared/journeyPages';
import { ARRAYS, dtLR } from '../shared/ensemble/stereoArray.ts';
import { deltaTms } from '../../engine/physics/twoMic.ts';
import { Aim, Dim, FieldStage, MicAt, Ray, uvOf, type FieldInset } from '../shared/field/FieldStage';
import { A_ORDER, A_WORDS, DESTINATIONS, DEST_WORDS, DRILL_START, ROUTES, decodedDirection, dirFrom, directionError, drillProblems, wrongTracks, type ATrack, type Capture, type Destination, type DrillState } from '../shared/field/spatial.ts';
import { SAFETY_WORDS } from '../shared/field/location.ts';
import { headAbove, FigureHead } from '../shared/players/PlayerFigure';
import { pt } from '../shared/players/playerPose.ts';
import { EAR_SEATED, EAR_STANDING, EVENT, LISTENER, PA_BOXES, PLAZA, WALKER_AT } from './geometry.ts';
import { F10_SETUPS, F10_ZONES, setupsIn, type SpatialRig, type SpatialSetup } from './model.ts';
import { RigArt, SiteArt, rigCapsules } from './scene';
import { along } from '../shared/field/spatial.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const fmtM = (mm: number) => `${(mm / 1000).toFixed(1)} m`;
const fmtMFt = (mm: number) => `${(mm / 1000).toFixed(1)} m (${(mm / 304.8).toFixed(1)} ft)`;
const AMBER = '#ffc64d';
const BLUE = '#8fbcff';

/* ── shared bits ── */

/** The web preview harness only (`&setup=<n>`, 1-based; never the production router). */
function devSetupIndex(): number {
  if (!(__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined')) return 0;
  const m = /[?&]setup=(\d+)/.exec(window.location.search);
  return m ? Math.max(0, Number(m[1]) - 1) : 0;
}

function variantParam(p: PageProps): DockParam[] {
  const vs = p.lesson.model.variants;
  const cur = vs.find((v) => v.id === p.variant);
  return [{ kind: 'options', id: 'variant', label: 'WHERE', valueLabel: cur ? cur.label.split(' ')[0] : '', selectedId: p.variant, onSelect: (id) => p.setVariant(id), options: vs.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })) }];
}
function viewParam(view: ViewId, setView: (v: ViewId) => void): DockParam[] {
  return [
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: view === 'top' ? 'ABOVE' : 'SIDE',
      selectedId: view,
      onSelect: (id) => setView(id as ViewId),
      sticky: true,
      options: [
        { id: 'top', label: 'FROM ABOVE', blurb: 'The plan: the scene front to the right.' },
        { id: 'side', label: 'FROM THE SIDE', blurb: 'Heights: the listener’s point and the ground.' },
      ],
    },
  ];
}

const isEvent = (variant: string) => variant === 'event';
/** The front source's point for a variant (the singer's or the performer's lips). */
const frontSource = (variant: string): Vec3 => (isEvent(variant) ? EVENT.perfMouth : PLAZA.singerMouth);
/** The site's boxes, whole (MEET IT's scene) and round the listener (setups, placement). */
const SITE: Record<'plaza' | 'event', Record<'whole' | 'near', Record<ViewId, ViewBox>>> = {
  plaza: {
    whole: { top: { u0: -4100, u1: 6700, v0: -3300, v1: 3300 }, side: { u0: -4100, u1: 6700, v0: -3300, v1: 350 } },
    near: { top: { u0: -2900, u1: 6600, v0: -2900, v1: 2900 }, side: { u0: -2900, u1: 6600, v0: -2800, v1: 350 } },
  },
  event: {
    whole: { top: { u0: -1600, u1: 9900, v0: -4300, v1: 4300 }, side: { u0: -1600, u1: 9900, v0: -3900, v1: 350 } },
    near: { top: { u0: -3600, u1: 8200, v0: -4000, v1: 4000 }, side: { u0: -3600, u1: 8200, v0: -3600, v1: 350 } },
  },
};
const siteBox = (variant: string, which: 'whole' | 'near', view: ViewId): ViewBox => SITE[isEvent(variant) ? 'event' : 'plaza'][which][view];

/** A rig's own box (its capsules ± a margin, the stand to the ground in a side view). */
function rigBox(rigs: readonly SpatialRig[], view: ViewId): ViewBox {
  let u0 = Infinity;
  let u1 = -Infinity;
  let w0 = Infinity;
  let w1 = -Infinity;
  for (const r of rigs) {
    const pts = [r.c, ...rigCapsules(r).map((q) => q.p)];
    for (const p of pts) {
      const o = uvOf(view, p);
      u0 = Math.min(u0, o.u);
      u1 = Math.max(u1, o.u);
      w0 = Math.min(w0, o.v);
      w1 = Math.max(w1, o.v);
    }
  }
  const m = Math.max(260, 0.22 * Math.max(u1 - u0, w1 - w0));
  if (view === 'side') return { u0: u0 - m, u1: u1 + m, v0: w0 - m, v1: w0 + Math.max(2 * m, (w1 - w0) + m) };
  return { u0: u0 - m, u1: u1 + m, v0: w0 - m, v1: w1 + m };
}

/** The rig's exact shape, in the corner (an example layout: no numbers). */
function rigInset(rigs: readonly SpatialRig[]): FieldInset {
  const box = rigBox(rigs, 'top');
  const ex = rigs.some((r) => ARRAYS[r.id].example);
  return {
    view: 'top',
    box,
    at: { x: 0.645, y: 0.02, w: 0.34, h: 0.34 },
    draw: (px) => (
      <>
        {rigs.map((r, i) => (
          <RigArt key={i} view="top" rig={r} px={px} />
        ))}
      </>
    ),
    labels: [{ id: 'in', text: ex ? 'AN EXAMPLE LAYOUT' : 'THE RIG FROM ABOVE', short: ex ? 'EXAMPLE' : 'RIG', u: (box.u0 + box.u1) / 2, v: box.v0 + (box.v1 - box.v0) * 0.06, align: 'center', tone: 'muted' }],
  };
}

/* ═══════════════════ 1 · MEET IT ═══════════════════ */

type SceneItem = { id: string; label: string; short: string; at: Vec3; text: string };
function sceneItems(lesson: PageProps['lesson'], variant: string): SceneItem[] {
  const part = (id: string) => lesson.model.parts.find((q) => q.id === id);
  const it = (id: string, at: Vec3, short?: string): SceneItem => ({ id, label: part(id)?.label ?? id, short: short ?? part(id)?.short.toUpperCase() ?? id, at, text: part(id)?.role ?? '' });
  const front: SceneItem = { id: 'front', label: 'the scene front', short: 'FRONT', at: v3(1200, -1700, 0), text: 'The direction the listener faces — the one every spatial mic’s front mark, face or front Mid points to. Mark it, and true north only if the project needs it.' };
  if (isEvent(variant)) return [it('sp.listener', LISTENER, 'LISTENER'), front, it('sp.performer', EVENT.perfMouth, 'PERFORMER'), it('sp.pa', v3(EVENT.pa[0].x, EVENT.pa[0].y, EVENT.pa[0].z), 'PA'), it('sp.stage', v3(7800, -800, 0), 'STAGE')];
  const w = along(PLAZA.walk.a, PLAZA.walk.b, WALKER_AT);
  return [
    it('sp.listener', LISTENER, 'LISTENER'),
    front,
    it('sp.singer', PLAZA.singerMouth, 'SINGER'),
    it('sp.walker', v3(w.x, w.y, w.z), 'WALKER'),
    { id: 'sp.path', label: 'the public footpath', short: 'FOOTPATH', at: v3(2900, -300, 1500), text: 'A public route across the square. Nothing of the setup stands in it: not a stand, not a cable, not a wide array — people need the way.' },
    it('sp.wall', v3(PLAZA.wallX, -2000, 0), 'WALL'),
  ];
}

function Ring({ at, view, px }: { at: Vec3; view: ViewId; px: number }) {
  const o = uvOf(view, at);
  return (
    <Group>
      <Circle cx={o.u} cy={o.v} r={26 * px} color={AMBER} opacity={0.14} />
      <Circle cx={o.u} cy={o.v} r={26 * px} style="stroke" strokeWidth={2.6 * px} color={AMBER} />
    </Group>
  );
}

function F10Meet(p: PageProps) {
  const { lesson, journey, variant, answers, onAnswered } = p;
  const items = useMemo(() => sceneItems(lesson, variant), [lesson, variant]);
  const [k, setK] = useState(0);
  const [view, setView] = useState<ViewId>('top');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const item = items[Math.min(k, items.length - 1)];
  useEffect(() => {
    if (item) setSeen((prev) => (prev.has(item.id) ? prev : new Set([...prev, item.id])));
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // WHERE THE SOUND COMES FROM: the walker scrubbed along the footpath.
  const [t, setT] = useState(WALKER_AT);
  const [predicted, setPredicted] = useState<string | null>(null);
  const [walked, setWalked] = useState({ left: false, right: false });
  const walker = along(PLAZA.walk.a, PLAZA.walk.b, t);
  const ears = useMemo(() => rigCapsules({ id: 'binaural', c: LISTENER }), []);
  const wDir = Math.atan2(walker.z - LISTENER.z, walker.x - LISTENER.x) * (180 / Math.PI);
  const wSide = wDir < -8 ? 'LEFT' : wDir > 8 ? 'RIGHT' : 'FRONT';
  const earDt = dtLR(ears, walker); // + = the right ear hears it later
  const first = Math.abs(earDt) < 0.02 ? 'BOTH' : earDt > 0 ? 'LEFT EAR' : 'RIGHT EAR';
  const src = frontSource(variant);
  const dDirect = dist(src, LISTENER);
  // The wall's reflection of the walker: the image source behind the wall,
  // the path through the point where the image's line crosses the wall.
  const img = v3(2 * PLAZA.wallX - walker.x, walker.y, walker.z);
  const s = (PLAZA.wallX - img.x) / (LISTENER.x - img.x);
  const hit = v3(PLAZA.wallX, img.y + (LISTENER.y - img.y) * s, img.z + (LISTENER.z - img.z) * s);
  const late = deltaTms(dist(img, LISTENER) - dist(walker, LISTENER));
  // Event: the PA's direction against the performer's.
  const paDeg = Math.atan2(EVENT.pa[0].z, EVENT.pa[0].x) * (180 / Math.PI);

  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(
      lesson,
      <ExpandableFigure
        badge="The scene from above · the listener’s point and the scene front in amber"
        title="THE SCENE"
        aspect={(siteBox(variant, 'whole', 'top').u1 - siteBox(variant, 'whole', 'top').u0) / (siteBox(variant, 'whole', 'top').v1 - siteBox(variant, 'whole', 'top').v0)}
        render={(w: number, h: number) => (
          <FieldStage w={w} h={h} view="top" box={siteBox(variant, 'whole', 'top')} a11y={`${lesson.model.variants.find((v) => v.id === variant)?.blurb ?? ''} The listener’s point is marked, the scene front to the right.`} labels={[]}>
            {() => <SiteArt view="top" variant={variant} />}
          </FieldStage>
        )}
      />,
    ),
    {
      key: 'parts',
      title: 'The scene',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <FieldStage
            w={w}
            h={h}
            view={view}
            box={siteBox(variant, 'whole', view)}
            a11y={`${view === 'top' ? 'From above' : 'From the side'}: ${lesson.model.variants.find((v) => v.id === variant)?.blurb ?? ''} Highlighted: ${item?.label ?? ''}.`}
            labels={items.map((q) => ({ id: q.id, text: q.short, u: uvOf(view, q.at).u, v: uvOf(view, q.at).v - (view === 'top' ? 520 : 600), align: 'center' as const, tone: q.id === item?.id ? undefined : ('muted' as const) }))}
          >
            {(px) => (
              <>
                <SiteArt view={view} variant={variant} />
                {item ? <Ring at={item.at} view={view} px={px} /> : null}
              </>
            )}
          </FieldStage>
        ),
        badge: `${view === 'top' ? 'From above' : 'From the side'} · amber ring = the part you chose · a typical layout`,
        bezel: [
          { k: 'PART', v: item?.short ?? '—', flex: 1.4 },
          { k: 'FROM LISTENER', v: item && item.id !== 'sp.listener' && item.id !== 'front' ? fmtM(Math.hypot(item.at.x - LISTENER.x, item.at.z - LISTENER.z)) : '—', flex: 1.1 },
          { k: 'LOOKED AT', v: `${seen.size} / ${items.length}`, flex: 1 },
        ],
        params: [
          {
            kind: 'fader',
            id: 'item',
            label: 'PART',
            value: items.length > 1 ? k / (items.length - 1) : 0,
            onChange: (v) => setK(Math.round(v * (items.length - 1))),
            format: () => `${k + 1} of ${items.length} · ${item?.label ?? ''}`,
            formatShort: () => item?.short.slice(0, 8) ?? '',
          },
          ...viewParam(view, setView),
          ...variantParam(p),
        ],
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking={`${view === 'top' ? 'From above' : 'From the side'} · ${lesson.model.variants.find((v) => v.id === variant)?.label.toLowerCase() ?? ''}`} prompt="Step through PART: the listener’s point, the scene front, the sources and what is round them." />
          {item ? (
            <Card>
              <Point title={item.label.toUpperCase()}>{item.text}</Point>
            </Card>
          ) : null}
          <Body>{`Looked at: ${seen.size} of ${items.length}. Switch WHERE for the other scene.`}</Body>
        </>
      ),
    },
    {
      key: 'arrive',
      title: 'Where the sound comes from',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <FieldStage
            w={w}
            h={h}
            view="top"
            box={siteBox(variant, 'whole', 'top')}
            a11y={isEvent(variant) ? `From above: the performer’s voice arrives at the listener’s point from straight ahead, the two PA loudspeakers from about ${Math.abs(Math.round(paDeg))} degrees either side.` : `From above: the walker ${Math.abs(Math.round(wDir))} degrees to the listener’s ${wSide.toLowerCase()}, heard first by the ${first.toLowerCase()}, and again off the wall behind about ${late.toFixed(0)} milliseconds later; the singer straight ahead.`}
            labels={
              isEvent(variant)
                ? [{ id: 'pa', text: 'THE PA, LEFT AND RIGHT', short: 'PA', u: 3600, v: -2400, align: 'center', tone: 'blue' }]
                : [
                    { id: 'echo', text: `OFF THE WALL · +${late.toFixed(0)} ms`, short: `+${late.toFixed(0)} ms`, u: -1900, v: hit.z + (hit.z < 0 ? -420 : 420), align: 'center', tone: 'amber' },
                    { id: 'walk', text: `WALKER · ${Math.abs(Math.round(wDir))}° ${wSide}`, short: `${Math.abs(Math.round(wDir))}°`, u: walker.x, v: walker.z + (walker.z < 0 ? -520 : 520), align: 'center', tone: 'amber' },
                  ]
            }
          >
            {(px) => (
              <>
                <SiteArt view="top" variant={variant} walkerT={t} />
                <Ray a={uvOf('top', src)} b={uvOf('top', LISTENER)} px={px} width={2.6} />
                {isEvent(variant) ? (
                  EVENT.pa.map((q, i) => <Ray key={i} a={{ u: q.x - EVENT.paSize.x / 2, v: q.z }} b={uvOf('top', LISTENER)} px={px} width={2.2} color="#6fa8ff" />)
                ) : (
                  <>
                    <Ray a={uvOf('top', walker)} b={uvOf('top', LISTENER)} px={px} width={2.6} color={AMBER} />
                    <Ray a={uvOf('top', walker)} b={uvOf('top', hit)} px={px} width={1.8} dash={[5, 6]} color={AMBER} />
                    <Ray a={uvOf('top', hit)} b={uvOf('top', LISTENER)} px={px} width={1.8} dash={[5, 6]} color={AMBER} />
                  </>
                )}
                <RigArt view="top" rig={{ id: 'binaural', c: LISTENER }} px={px} lobes={false} />
              </>
            )}
          </FieldStage>
        ),
        badge: 'From above · blue = straight paths to the listener’s point · a simplified picture: no head shadow drawn, sound speed from the calculator',
        bezel: isEvent(variant)
          ? [
              { k: 'PERFORMER', v: `${fmtM(dDirect)} · AHEAD`, flex: 1.4 },
              { k: 'EACH PA', v: `${Math.abs(Math.round(paDeg))}° L / R`, flex: 1.1 },
            ]
          : [
              { k: 'WALKER', v: `${Math.abs(Math.round(wDir))}° ${wSide}`, flex: 1.1 },
              { k: 'FIRST', v: first, flex: 1.1 },
              { k: 'SINGER', v: `${fmtM(dDirect)} AHEAD`, flex: 1.1 },
              { k: 'WALL ECHO', v: `+${late.toFixed(0)} ms`, flex: 1 },
            ],
        params: [
          ...(isEvent(variant)
            ? []
            : [
                {
                  kind: 'fader' as const,
                  id: 'walk',
                  label: 'WALK',
                  value: t,
                  onChange: (v: number) => {
                    setT(v);
                    const z = along(PLAZA.walk.a, PLAZA.walk.b, v).z;
                    if (z < -2500) setWalked((s) => (s.left ? s : { ...s, left: true }));
                    if (z > 2500) setWalked((s) => (s.right ? s : { ...s, right: true }));
                  },
                  format: () => `the walker ${fmtM(Math.abs(walker.z))} to the ${walker.z < 0 ? 'left' : 'right'}`,
                  formatShort: () => `${walker.z < 0 ? 'L' : 'R'} ${fmtM(Math.abs(walker.z))}`,
                },
              ]),
          ...variantParam(p),
        ],
        initialParam: isEvent(variant) ? 'variant' : 'walk',
      },
      well: (
        <>
          {lesson.predictions.meet ? <PredictCard p={lesson.predictions.meet} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking="From above · sound arriving at the listener’s point" prompt={isEvent(variant) ? 'The performer is ahead; the PA loudspeakers stand either side. Every one of them reaches the listener’s point — a spatial mic hears them all.' : 'Move WALK: the walker crosses in front from left to right. Watch the direction and which ear the sound reaches first.'} />
          <Card>
            {isEvent(variant) ? (
              <Point title="AT AN EVENT">{`The audience mostly hears the PA: two loudspeakers about ${Math.abs(Math.round(paDeg))}° either side of straight ahead, ${fmtM(dist(EVENT.pa[0], LISTENER))} away. A spatial mic in the audience hears the event as the audience does — PA, crowd and all.`}</Point>
            ) : (
              <>
                <Point title="DIRECTION">{`The walker is ${Math.abs(Math.round(wDir))}° to the listener’s ${wSide === 'FRONT' ? 'front' : wSide.toLowerCase()}: the ${first === 'BOTH' ? 'two ears hear it together' : `${first.toLowerCase()} hears it first, and louder, the head shading the other`}. Those time and level differences, and the outer ears’ shaping, are the cues a binaural head keeps.`}</Point>
                <Point title="THE PLACE">{`The walker’s steps arrive again off the wall behind, about ${late.toFixed(0)} ms after the direct sound (calculated from the drawing); the singer arrives straight ahead, ${fmtM(dDirect)} away. A spatial capture keeps the place: the wall, the traffic, the wind.`}</Point>
              </>
            )}
          </Card>
          {walked.left && walked.right ? <Note tone="ok">{`You walked it across. A spatial capture should carry the walker from one side to the other — and it hears everything else on the square too: no array can later isolate one source. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : null}
        </>
      ),
    },
    {
      key: 'deliver',
      title: 'The deliverable first',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>Before any mic, decide what the listener should experience and where: the listening setup comes before the recording setup.</Body>
          <Card>
            {DESTINATIONS.map((d) => (
              <Point key={d} title={DEST_WORDS[d].label.toUpperCase()}>
                {DEST_WORDS[d].blurb}
              </Point>
            ))}
          </Card>
          <Note>A spatial capture records a perceptual scene — what reaches that place. It does not isolate one source, and it is not a calibrated measurement: a measurement needs its own instrument, calibration and method (the measurement lessons in this lab).</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            {lesson.sound.stages.map((q) => (
              <Point key={q.title} title={q.title.toUpperCase()}>
                {q.text}
              </Point>
            ))}
          </Card>
          <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'meet')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════════ 2 · STARTING SETUPS ═══════════════════ */

function SetupDrawing({ s, variant, view, w, h }: { s: SpatialSetup; variant: string; view: ViewId; w: number; h: number }) {
  const box = siteBox(variant, 'near', view);
  const singles = s.singles.map((q) => F10_ZONES.find((z) => z.id === q.zone)).filter((z): z is NonNullable<typeof z> => !!z);
  const c = s.rigs[0]?.c ?? LISTENER;
  const a11y = `${s.role}: ${s.title}. ${s.start}`;
  return (
    <FieldStage
      w={w}
      h={h}
      view={view}
      box={box}
      a11y={a11y}
      inset={view === 'top' ? rigInset(s.rigs) : null}
      labels={[
        ...(view === 'side' ? [{ id: 'h', text: `${fmtM(-c.y)} UP`, u: c.x + 180, v: c.y / 2, align: 'left' as const, tone: 'muted' as const }] : []),
        ...singles.map((z) => ({ id: z.id, text: s.singles[0].typeId === 'vocHeadset' ? 'HEADSET' : 'CLOSE MIC', u: z.start.p.x - 300, v: (view === 'side' ? z.start.p.y : z.start.p.z) - 520, align: 'center' as const, tone: 'muted' as const })),
      ]}
    >
      {(px) => (
        <>
          <SiteArt view={view} variant={variant} listener={false} />
          {s.rigs.map((r, i) => (
            <RigArt key={i} view={view} rig={r} px={px} />
          ))}
          {singles.map((z) => {
            const aim = v3(-Math.cos((z.start.az * Math.PI) / 180) * Math.cos((z.start.el * Math.PI) / 180), -Math.sin((z.start.el * Math.PI) / 180), Math.sin((z.start.az * Math.PI) / 180) * Math.cos((z.start.el * Math.PI) / 180));
            const head = s.singles[0].typeId === 'vocHeadset';
            const o = uvOf(view, z.start.p);
            return (
              <Group key={z.id}>
                {!head && view === 'side' ? <Ray a={{ u: z.start.p.x - aim.x * 162, v: z.start.p.y }} b={{ u: z.start.p.x - aim.x * 162, v: 0 }} px={px} color="#5b5f69" width={5} dash={[1000, 0]} /> : null}
                <MicAt view={view} p={z.start.p} aim={aim} art={head ? 'gooseneck' : 'vocalDynamic'} r={head ? 3 : 25} len={head ? 14 : 162} />
                <Aim from={o} dir={{ u: aim.x, v: view === 'side' ? aim.y : aim.z }} len={300} px={px} />
              </Group>
            );
          })}
          {view === 'side' && s.rigs[0] ? <Dim a={{ u: c.x - 140, v: 0 }} b={{ u: c.x - 140, v: c.y }} px={px} /> : null}
        </>
      )}
    </FieldStage>
  );
}

function F10Setups(p: PageProps) {
  const { lesson, variant, onInteractive, interactiveDone, chooseStart, answers, onAnswered } = p;
  const list = useMemo(() => setupsIn(variant), [variant]);
  const core = list.filter((q) => q.core);
  const [idx, setIdx] = useState(devSetupIndex);
  const i = Math.min(idx, Math.max(0, list.length - 1));
  const sel = list[i];
  const [view, setView] = useState<ViewId>('top');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (!sel) return;
    setSeen((prev) => (prev.has(`${variant}|${sel.id}`) ? prev : new Set([...prev, `${variant}|${sel.id}`])));
    chooseStart?.(sel.id);
  }, [sel?.id, variant]); // eslint-disable-line react-hooks/exhaustive-deps
  const seenCore = core.filter((q) => seen.has(`${variant}|${q.id}`)).length;
  useEffect(() => {
    if (core.length && seenCore >= core.length && !interactiveDone.has('setupsSeen')) onInteractive('setupsSeen');
  }, [seenCore, core.length, interactiveDone, onInteractive]);
  const rig = sel?.rigs[0];
  const items = lesson.setting.items;
  const steps: MikingStep[] = [
    {
      key: 'setups',
      title: 'Starting setups',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => (sel ? <SetupDrawing s={sel} variant={variant} view={view} w={w} h={h} /> : <Text style={styles.missing}>No setup here.</Text>),
        badge: view === 'top' ? 'Placed for you · amber dashed = where each capsule points · white dashed = a pattern’s shape, not its range · the corner box = the rig from above' : 'Placed for you · white = its height above the ground · amber dashed = where it points',
        bezel: [
          { k: 'SETUP', v: sel ? `${i + 1} / ${list.length}` : '—', flex: 0.8 },
          { k: 'RIG', v: rig ? ARRAYS[rig.id].short : '—', flex: 1.2 },
          { k: 'HEIGHT', v: rig ? fmtM(-rig.c.y) : '—', flex: 0.9 },
          { k: 'LOOKED AT', v: `${seenCore} / ${core.length}`, flex: 1 },
        ],
        params: [
          {
            kind: 'fader',
            id: 'setup',
            label: 'SETUP',
            value: list.length > 1 ? i / (list.length - 1) : 0,
            onChange: (v) => setIdx(Math.round(v * (list.length - 1))),
            format: () => (sel ? `${i + 1} of ${list.length} · ${sel.role.toLowerCase()}` : 'no setup'),
            formatShort: () => `${i + 1} / ${list.length}`,
          },
          { kind: 'options', id: 'pick', label: 'SETUPS', valueLabel: sel ? sel.role.split(' ')[0] : '—', selectedId: sel?.id ?? null, onSelect: (id) => setIdx(Math.max(0, list.findIndex((q) => q.id === id))), sticky: true, options: list.map((q) => ({ id: q.id, label: `${q.role} · ${q.title}`, blurb: q.line })) },
          ...viewParam(view, setView),
          ...variantParam(p),
        ],
        initialParam: 'setup',
      },
      well: (
        <>
          <Landing looking={sel ? `${sel.role} · ${view === 'top' ? 'from above' : 'from the side'}` : ''} prompt="Step through SETUP. Each rig is drawn at the listener’s point on its stand, every capsule with its aim; the corner box shows it from above, close up. Switch VIEW for its height." />
          {sel ? (
            <Card>
              <Text style={styles.role}>{sel.role}</Text>
              <Text style={styles.title}>{sel.title}</Text>
              <Text style={styles.line}>
                <Text style={styles.key}>{'DELIVERS · '}</Text>
                {sel.deliver.replace(/^For: /, '')}
              </Text>
              <Text style={styles.line}>
                <Text style={styles.key}>{'START · '}</Text>
                {sel.start}
              </Text>
              <Text style={styles.line}>
                <Text style={styles.key}>{'TENDS TO · '}</Text>
                {sel.line}
              </Text>
              {sel.rigs.some((r) => ARRAYS[r.id].example) ? <Text style={styles.small}>Drawn as an example layout: the spacing is chosen for the place and the taste, so no number is given.</Text> : null}
            </Card>
          ) : null}
          <Body>{`Looked at: ${seenCore} of ${core.length} main setups (ANOTHER START is there to explore).`}</Body>
        </>
      ),
    },
    {
      key: 'hears',
      title: 'What else the mics hear',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>A spatial mic hears everything that reaches its place. These decide where it goes and what you record beside it:</Body>
          <Card>
            {items.map((q) => (
              <Point key={q.id} title={q.short}>
                {q.note}
              </Point>
            ))}
          </Card>
          <Card>
            <Point title="FIELD AND POST">{lesson.setting.studio}</Point>
            <Point title="LIVE AND BROADCAST">{lesson.setting.stage}</Point>
          </Card>
        </>
      ),
    },
    {
      key: 'before',
      title: 'Before any mic',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="PERMISSION AND PRIVACY">Get permission for the place and the use — especially where people’s speech may be heard and recognised. A spatial take can hear conversations nearby.</Point>
            <Point title="KEEP THE WAY CLEAR">Never block a public route with a stand or a wide array, and never leave stands unattended where people walk. Cables run out of the way and are secured.</Point>
            <Point title="STANDS, WIND AND WATER">Check the ground, weight or guy the stand in wind, strain-relieve the cables, cover every exposed capsule against wind — a windscreen is not waterproofing; follow the maker’s moisture limits.</Point>
            <Point title="POWER LINES">{SAFETY_WORDS.powerLine}</Point>
            <Point title="LIGHTNING">{SAFETY_WORDS.lightning}</Point>
            <Point title="WILDLIFE AND THE PLACE">Never approach wildlife for a stronger cue; your presence affects animals and the place.</Point>
          </Card>
          <Note tone="warn">Protect hearing: monitor at a safe level — headphones on a spatial take can be turned up without noticing. An in-ear rig on a person must not cut them off from traffic, the stage or other hazards.</Note>
          <Body>Then the checks.</Body>
          <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'setups')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════════ 3 · MICROPHONES (after the engine's first step) ═══════════════════ */

type SystemId = 'binaural' | 'inear' | 'foa' | 'dms' | 'compact' | 's50' | 'addon';
const SYSTEMS: readonly { id: SystemId; label: string; short: string; rigs: SpatialRig[]; channels: string; where: string; playback: string; limit: string }[] = [
  { id: 'binaural', label: 'Binaural head', short: 'BINAURAL', rigs: [{ id: 'binaural', c: LISTENER }], channels: '2 (left ear, right ear)', where: 'At the listener’s point, the ears at the listener’s height, the face to the front.', playback: 'Headphones first; speakers depend on the head and the processing.', limit: 'A fixed point of view: a plain two-channel take does not turn when the listener turns.' },
  { id: 'inear', label: 'In-ear mics on a person', short: 'IN-EAR', rigs: [{ id: 'binaural', c: LISTENER }], channels: '2 (left ear, right ear)', where: 'In the wearer’s ears — with their informed consent and a hygienic fit.', playback: 'Headphones: the wearer’s own point of view.', limit: 'It records the wearer’s head movements, breath, clothing and steps; the wearer must stay aware of traffic and hazards.' },
  { id: 'foa', label: 'First-order Ambisonic mic', short: 'AMBISONIC', rigs: [{ id: 'foa', c: LISTENER }], channels: '4 raw A-format tracks', where: 'Upright at the listener’s point, its front mark to the scene front, in a suspension.', playback: 'Converted with the mic’s own converter, then turned and rendered: headphones, a speaker layout, stereo.', limit: 'Limited directional sharpness: an enveloping view, not separable point sources. Raw A-format is not stereo or 5.1.' },
  { id: 'dms', label: 'Double M/S', short: 'DOUBLE M/S', rigs: [{ id: 'dms', c: LISTENER }], channels: '3 (front Mid, rear Mid, Side)', where: 'At the listener’s point, the front Mid forward, the figure-8’s positive side marked.', playback: 'Decoded on purpose to front and rear, or plain M/S stereo.', limit: 'The raw tracks are not speaker channels; the matrix cannot repair a clipped or wind-ruined capsule.' },
  { id: 'compact', label: 'A compact surround mic', short: 'COMPACT 5.0', rigs: [{ id: 'dms', c: LISTENER }], channels: '5 (plus a low-frequency effects output on some)', where: 'On a stand or a camera, its front to the scene front — quick to set up and to move.', playback: 'A five-speaker layout, through its maker’s processing: read its channel map.', limit: 'Its topology and its low-frequency output are its maker’s — never assume every “5.1” cable carries the same thing.' },
  { id: 's50', label: 'A spaced five-channel array', short: '5.0 ARRAY', rigs: [{ id: 'surround50', c: LISTENER }], channels: '5 (L, C, R, Ls, Rs)', where: 'Round the listener’s point, the spacing chosen for the place — an example layout.', playback: 'A five-speaker layout; check the stereo and mono downmix.', limit: 'Needs room, stable stands and time; spaced mics summed can colour the sound.' },
  { id: 'addon', label: 'A rear add-on to a front array', short: 'ADD-ON', rigs: [{ id: 'ortf', c: LISTENER }, { id: 'hamasaki', c: v3(-1500, -EAR_STANDING, 0) }], channels: '2 front + 4 ambience', where: 'A front array at the listener’s point; a small square of cardioids or a wide square of figure-8s behind it — an example layout.', playback: 'A surround layout, the ambience layer under the front.', limit: 'Not a whole five-channel array on its own; check timing, direct-sound leakage and the downmix.' },
];

function F10Microphone(p: PageProps) {
  const { lesson, answers, onAnswered } = p;
  const [sid, setSid] = useState<SystemId>('binaural');
  const [seen, setSeen] = useState<ReadonlySet<SystemId>>(() => new Set(['binaural']));
  const [predicted, setPredicted] = useState<string | null>(null);
  const sys = SYSTEMS.find((q) => q.id === sid)!;
  const def = sys.rigs.map((r) => ARRAYS[r.id]);
  const box = useMemo(() => rigBox(sys.rigs, 'top'), [sys]);
  const steps: MikingStep[] = [
    {
      key: 'systems',
      title: 'The systems',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <FieldStage
            w={w}
            h={h}
            view="top"
            box={sid === 'inear' ? { u0: -330, u1: 330, v0: -260, v1: 260 } : box}
            a11y={`From above, close up: ${sys.label}. ${sys.channels}. ${sys.where}`}
            labels={sid === 'inear' ? [{ id: 'l', text: 'LEFT EAR', u: -90, v: -200, align: 'center', tone: 'amber' }, { id: 'r', text: 'RIGHT EAR', u: -90, v: 200, align: 'center', tone: 'amber' }] : rigCapsules(sys.rigs[0]).length > 1 && !['binaural', 'foa', 'dms'].includes(sys.rigs[0].id) ? rigCapsules(sys.rigs[0]).map((q) => ({ id: q.id, text: q.label, u: q.p.x + q.dir.x * 380, v: q.p.z + q.dir.z * 380, align: 'center' as const, tone: 'muted' as const })) : []}
          >
            {(px) =>
              sid === 'inear' ? (
                <InEarHead px={px} />
              ) : sid === 'compact' ? (
                <CompactUnit px={px} />
              ) : (
                <>
                  {sys.rigs.map((r, i) => (
                    <RigArt key={i} view="top" rig={r} px={px} />
                  ))}
                </>
              )
            }
          </FieldStage>
        ),
        badge: `From above, close up · amber dashed = where each capsule points · white dashed = a pattern’s shape${def.some((d) => d.example) ? ' · an example layout' : ''}`,
        bezel: [
          { k: 'SYSTEM', v: sys.short, flex: 1.3 },
          { k: 'CHANNELS', v: sys.channels.split(' (')[0], flex: 1.4 },
          { k: 'LOOKED AT', v: `${seen.size} / ${SYSTEMS.length}`, flex: 1 },
        ],
        params: [
          {
            kind: 'options',
            id: 'system',
            label: 'SYSTEM',
            valueLabel: sys.short,
            selectedId: sid,
            onSelect: (id) => {
              setSid(id as SystemId);
              setSeen((prev) => (prev.has(id as SystemId) ? prev : new Set([...prev, id as SystemId])));
            },
            sticky: true,
            options: SYSTEMS.map((q) => ({ id: q.id, label: q.label, blurb: q.channels })),
          },
        ],
        initialParam: 'system',
      },
      well: (
        <>
          {lesson.predictions.microphone ? <PredictCard p={lesson.predictions.microphone} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`Close up · ${sys.label.toLowerCase()}`} prompt="Choose a SYSTEM. Each one is a different answer to the same question: what will the listener hear it on?" />
          <Card>
            <Point title={sys.label.toUpperCase()}>{sid === 'inear' || sid === 'compact' ? sys.where : `${def[0].what}`}</Point>
            <Point title="CHANNELS">{sys.channels}</Point>
            <Point title="WHERE IT GOES">{sys.where}</Point>
            <Point title="PLAYBACK">{sys.playback}</Point>
            <Point title="ITS LIMIT">{sys.limit}</Point>
          </Card>
          {seen.size === SYSTEMS.length ? <Note tone="ok">There is no universal winner: a binaural head for headphones, an Ambisonic mic for a turnable scene, a five-channel array for a speaker layout — chosen by the destination, with a separate close mic when a source must be clear.</Note> : null}
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'microphone')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

/** In-ear mics on a person, from above: the figure's own head and two capsules in the ears. */
function InEarHead({ px }: { px: number }) {
  const head = useMemo(() => headAbove(pt(0, 0), 114), []);
  return (
    <Group>
      <Group transform={[{ rotate: -Math.PI / 2 }]}>
        <FigureHead fill={head.fill} />
      </Group>
      {[-1, 1].map((s) => (
        <Group key={s}>
          <Circle cx={-6} cy={s * 104} r={9} color="#0b0c0e" />
          <Circle cx={-6} cy={s * 104} r={9} style="stroke" strokeWidth={1.6 * px} color={AMBER} />
        </Group>
      ))}
    </Group>
  );
}

/** A compact surround mic from above: one body, five capsules round it. */
function CompactUnit({ px }: { px: number }) {
  const caps = [0, 40, -40, 140, -140];
  return (
    <Group>
      <Circle cx={0} cy={0} r={70} color="#2a2c32" />
      <Circle cx={0} cy={0} r={70} style="stroke" strokeWidth={2 * px} color="#9aa0ab" />
      {caps.map((a) => {
        const r = (a * Math.PI) / 180;
        const x = Math.cos(r) * 52;
        const z = Math.sin(r) * 52;
        const path = Skia.Path.Make();
        path.moveTo(x, z);
        path.lineTo(x + Math.cos(r) * 150, z + Math.sin(r) * 150);
        return (
          <Group key={a}>
            <Circle cx={x} cy={z} r={14} color="#121317" />
            <Circle cx={x} cy={z} r={14} style="stroke" strokeWidth={1.4 * px} color="#b9912f" />
            <Path path={path} style="stroke" strokeWidth={2 * px} color={AMBER}>
              <DashPathEffect intervals={[8 * px, 6 * px]} />
            </Path>
          </Group>
        );
      })}
    </Group>
  );
}

/* ═══════════════════ 4 · PLACEMENT STUDIO ═══════════════════ */

type PlaceZone = { id: string; label: string; band: string; tendency: string; x: [number, number]; z: [number, number]; h: [number, number] };
const PLACE_ZONES: Record<'plaza' | 'event', PlaceZone[]> = {
  plaza: [
    { id: 'listen', label: 'Where a standing listener would be', band: 'At the listener’s point, the ears about 1.55–1.8 m up, the front to the scene front.', tendency: 'The square as a listener hears it: the singer ahead, the walker crossing, the wall behind.', x: [-800, 1200], z: [-1000, 1000], h: [1550, 1800] },
    { id: 'seated', label: 'A seated listener’s height', band: 'The same place, the ears about 1.1–1.3 m up.', tendency: 'A seated point of view: what is near counts for more.', x: [-800, 1200], z: [-1000, 1000], h: [1100, 1300] },
    { id: 'closer', label: 'Closer to the singer, past the footpath', band: 'An idea to try: about 1–2 m from the singer, beyond the footpath, ears at standing height.', tendency: 'More of the singer and less of the square — the walker passes behind.', x: [3900, 4900], z: [-900, 900], h: [1550, 1800] },
  ],
  event: [
    { id: 'listen', label: 'In the audience, between the PA loudspeakers', band: 'At the audience’s listening point, about 1.55–1.8 m up, centred between the PAs.', tendency: 'The event as the audience hears it: the PA, the crowd and the place.', x: [-800, 1500], z: [-1200, 1200], h: [1550, 1800] },
    { id: 'seated', label: 'A seated audience’s height', band: 'The same place, the ears about 1.1–1.3 m up.', tendency: 'A seated point of view: the people around count for more.', x: [-800, 1500], z: [-1200, 1200], h: [1100, 1300] },
    { id: 'back', label: 'Farther back in the audience', band: 'An idea to try: 2–3.5 m farther back, still centred.', tendency: 'More of the crowd and the space, the stage farther away.', x: [-3500, -2000], z: [-1200, 1200], h: [1550, 1800] },
  ],
};

/** Where a rig's stand may not stand (the public footpath, the wall, the
 *  singer's space; the stage, the PA). */
function blockedAt(variant: string, c: Vec3): string | null {
  if (isEvent(variant)) {
    if (c.x >= EVENT.stage.min.x - 300 && Math.abs(c.z) <= EVENT.stage.max.z + 300) return 'the stage';
    for (const b of PA_BOXES) if (Math.abs(c.x - (b.min.x + b.max.x) / 2) < 700 && Math.abs(c.z - (b.min.z + b.max.z) / 2) < 700) return 'the PA loudspeaker';
    return null;
  }
  if (c.x >= PLAZA.path.x0 - 200 && c.x <= PLAZA.path.x1 + 200) return 'the public footpath';
  if (c.x <= PLAZA.wallX + 400) return 'the wall';
  if (Math.hypot(c.x - PLAZA.singerMouth.x, c.z - PLAZA.singerMouth.z) < 900) return 'the singer’s space';
  return null;
}

type Axis = 'x' | 'z' | 'h';
const AXES: Record<Axis, { label: string; blurb: string; lo: number; hi: number }> = {
  x: { label: 'FRONT–BACK', blurb: 'Toward the scene front, or back from it.', lo: -3500, hi: 5200 },
  z: { label: 'ACROSS', blurb: 'To the listener’s left or right.', lo: -2500, hi: 2500 },
  h: { label: 'HEIGHT', blurb: 'The rig’s height above the ground.', lo: 900, hi: 2400 },
};

function F10Placement(p: PageProps) {
  const { lesson, variant, answers, onAnswered, onInteractive, interactiveDone, startFrom } = p;
  const zones = PLACE_ZONES[isEvent(variant) ? 'event' : 'plaza'];
  const starts = useMemo(() => setupsIn(variant).filter((s) => s.rigs.length), [variant]);
  /* WATCH */
  const [ex, setEx] = useState(0);
  const pieces = [
    { title: 'WHERE TO BEGIN', text: 'At the listener’s point: where a listener would be for the experience you are making — in the middle of the square here, clear of the footpath.', view: 'top' as ViewId },
    { title: 'THE HEIGHT', text: `The ears about ${fmtMFt(EAR_STANDING)} up for a standing listener, about ${fmtMFt(EAR_SEATED)} seated — on a stable stand.`, view: 'side' as ViewId },
    { title: 'THE FRONT', text: 'The face (or the front mark, or the front Mid) toward the scene front: left and right labelled, the front written in the log.', view: 'top' as ViewId },
    { title: 'CLEARANCE', text: 'Clear of the public footpath and of people, the stand weighted against wind, the cables secured — and nothing within 3 m (10 ft) of a power line.', view: 'top' as ViewId },
    { title: 'THE DESTINATION', text: 'For a binaural head: headphones. Check the take on them before moving on — a pleasing headphone image is not proof of accurate direction for every listener.', view: 'top' as ViewId },
  ];
  const pc = pieces[ex];
  /* PLACE */
  const first = starts.find((s) => s.id === startFrom) ?? starts[0];
  const [startId, setStartId] = useState(first?.id ?? '');
  const start = starts.find((s) => s.id === startId) ?? first;
  const [c, setC] = useState<Vec3>(start?.rigs[0]?.c ?? LISTENER);
  const [face, setFace] = useState(0);
  const [rest, setRest] = useState<Vec3>(c);
  const [moved, setMoved] = useState(false);
  const [axis, setAxis] = useState<Axis>('x');
  const [view, setView] = useState<ViewId>('top');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const cRef = useRef(c);
  cRef.current = c;
  const pickStart = (id: string) => {
    const q = starts.find((s) => s.id === id);
    if (!q) return;
    setStartId(id);
    setC(q.rigs[0].c);
    setRest(q.rigs[0].c);
    setFace(0);
    setMoved(false);
  };
  const seenV = useRef(variant);
  useEffect(() => {
    if (seenV.current === variant) return;
    seenV.current = variant;
    if (first) pickStart(first.id);
  }, [variant]); // eslint-disable-line react-hooks/exhaustive-deps
  const rigs: SpatialRig[] = useMemo(() => (start ? start.rigs.map((r, k) => ({ ...r, c: k === 0 ? c : v3(r.c.x + (c.x - start.rigs[0].c.x), c.y, r.c.z + (c.z - start.rigs[0].c.z)), face })) : []), [start, c, face]);
  const blocked = blockedAt(variant, c);
  const h = -c.y;
  const zone = zones.find((z) => rest.x >= z.x[0] && rest.x <= z.x[1] && rest.z >= z.z[0] && rest.z <= z.z[1] && -rest.y >= z.h[0] && -rest.y <= z.h[1]) ?? null;
  useEffect(() => {
    if (moved && zone && !blockedAt(variant, rest)) setVisited((prev) => (prev.has(zone.id) ? prev : new Set([...prev, zone.id])));
  }, [zone?.id, rest, moved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (visited.size >= 2 && !interactiveDone.has('twoZones')) onInteractive('twoZones');
  }, [visited, interactiveDone, onInteractive]);
  const src = frontSource(variant);
  const toSrc = Math.atan2(src.z - c.z, src.x - c.x) * (180 / Math.PI);
  const frontOff = Math.abs(((toSrc - face + 540) % 360) - 180);
  const dSrc = dist(src, v3(c.x, c.y, c.z));
  const A = AXES[axis];
  const axisVal = axis === 'h' ? h : axis === 'x' ? c.x : c.z;
  const withAxis = (q: Vec3, val: number) => (axis === 'h' ? v3(q.x, -val, q.z) : axis === 'x' ? v3(val, q.y, q.z) : v3(q.x, q.y, val));
  const snap = (val: number) => Math.round((A.lo + val * (A.hi - A.lo)) / 50) * 50;
  const nowWords = `The ${start ? start.title.toLowerCase() : 'rig'}: ${fmtMFt(h)} up, ${c.x >= 0 ? `${fmtM(c.x)} toward the front` : `${fmtM(-c.x)} back`}${Math.abs(c.z) > 50 ? `, ${fmtM(Math.abs(c.z))} to the ${c.z < 0 ? 'left' : 'right'}` : ''}; the front source ${fmtM(dSrc)} away, ${Math.round(frontOff)}° off its front.${zone ? ` At a recommended starting point: ${zone.label}.` : ' Not at a recommended starting point.'}${blocked ? ` Blocked: it would stand in ${blocked}.` : ''}`;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'move',
      label: 'MOVE',
      value: Math.max(0, Math.min(1, (axisVal - A.lo) / (A.hi - A.lo))),
      onChange: (v) => setC((q) => withAxis(q, snap(v))),
      onCommit: (v) => {
        const n = withAxis(cRef.current, snap(v));
        setC(n);
        setRest(n);
        setMoved(true);
      },
      format: (v) => {
        const x = snap(v);
        return axis === 'h' ? `${fmtMFt(x)} above the ground` : axis === 'x' ? (x >= 0 ? `${fmtM(x)} toward the scene front` : `${fmtM(-x)} back from the listener’s point`) : x === 0 ? 'on the centre line' : `${fmtM(Math.abs(x))} to the ${x < 0 ? 'left' : 'right'}`;
      },
      formatShort: () => (axis === 'h' ? fmtM(h) : fmtM(axis === 'x' ? c.x : c.z)),
      chooser: { title: 'MOVE THE RIG', selectedId: axis, onSelect: (id) => setAxis(id as Axis), options: (['x', 'z', 'h'] as const).map((k) => ({ id: k, label: AXES[k].label, blurb: AXES[k].blurb })) },
    },
    {
      kind: 'fader',
      id: 'turn',
      label: 'FRONT',
      value: (face + 90) / 180,
      onChange: (v) => setFace(Math.round((v * 180 - 90) / 5) * 5),
      format: () => (face === 0 ? 'facing the scene front' : `turned ${Math.abs(face)}° to the ${face < 0 ? 'left' : 'right'}`),
      formatShort: () => `${face}°`,
      home: 0.5,
    },
    { kind: 'options', id: 'start', label: 'START', valueLabel: (start?.role ?? '').split(' ')[0], selectedId: startId, onSelect: pickStart, options: starts.map((q) => ({ id: q.id, label: `Start from: ${q.role} · ${q.title}`, blurb: q.start })) },
    ...viewParam(view, setView),
    ...variantParam(p),
  ];
  const zoneRects = (vw: ViewId, px: number) =>
    zones.map((z) => {
      const r = vw === 'top' ? { u0: z.x[0], u1: z.x[1], v0: z.z[0], v1: z.z[1] } : { u0: z.x[0], u1: z.x[1], v0: -z.h[1], v1: -z.h[0] };
      const on = zone?.id === z.id;
      return (
        <Group key={z.id}>
          <RoundedRect x={r.u0} y={r.v0} width={r.u1 - r.u0} height={r.v1 - r.v0} r={60} color={BLUE} opacity={on ? 0.22 : 0.1} />
          <RoundedRect x={r.u0} y={r.v0} width={r.u1 - r.u0} height={r.v1 - r.v0} r={60} style="stroke" strokeWidth={(on ? 2.6 : 1.6) * px} color={BLUE} opacity={0.85} />
        </Group>
      );
    });
  const steps: MikingStep[] = [
    {
      key: 'watch',
      title: 'Worked example',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, hh) => (
          <FieldStage w={w} h={hh} view={pc.view} box={siteBox(variant, 'near', pc.view)} a11y={`A worked example, placed for you: a binaural head at the listener’s point. ${pc.title.toLowerCase()}: ${pc.text}`} labels={pc.view === 'side' ? [{ id: 'h', text: `${fmtM(EAR_STANDING)} UP`, u: 200, v: -900, align: 'left', tone: 'muted' }] : []} inset={pc.view === 'top' ? rigInset([{ id: 'binaural', c: LISTENER }]) : null}>
            {(px) => (
              <>
                <SiteArt view={pc.view} variant={variant} listener={false} />
                <RigArt view={pc.view} rig={{ id: 'binaural', c: LISTENER }} px={px} />
                {pc.view === 'side' ? <Dim a={{ u: -140, v: 0 }} b={{ u: -140, v: LISTENER.y }} px={px} /> : null}
                {ex === 2 && pc.view === 'top' ? <Aim from={{ u: 0, v: 0 }} dir={{ u: 1, v: 0 }} len={1600} px={px} /> : null}
              </>
            )}
          </FieldStage>
        ),
        badge: 'WORKED EXAMPLE · placed for you · white = its height · the corner box = the rig from above',
        bezel: [
          { k: ex === 0 ? '▸ WHERE' : 'WHERE', v: 'LISTENER', tint: ex === 0 ? AMBER : undefined, flex: 1 },
          { k: ex === 1 ? '▸ HEIGHT' : 'HEIGHT', v: fmtM(EAR_STANDING), tint: ex === 1 ? AMBER : undefined, flex: 0.9 },
          { k: ex === 2 ? '▸ FRONT' : 'FRONT', v: 'SCENE FRONT', tint: ex === 2 ? AMBER : undefined, flex: 1.2 },
          { k: ex >= 3 ? '▸ FOR' : 'FOR', v: 'HEADPHONES', tint: ex >= 3 ? AMBER : undefined, flex: 1.1 },
        ],
        params: [{ kind: 'fader', id: 'piece', label: 'STEP', value: ex / (pieces.length - 1), onChange: (v) => setEx(Math.round(v * (pieces.length - 1))), format: () => `${ex + 1} of ${pieces.length} · ${pc.title.toLowerCase()}`, formatShort: () => `${ex + 1} / ${pieces.length}` }],
        initialParam: 'piece',
      },
      well: (
        <>
          <Landing looking="Worked example · a binaural head at the listener’s point" prompt="Step through how this starting point is read, piece by piece." />
          <Card>
            <Point title={`${ex + 1} · ${pc.title}`}>{pc.text}</Point>
          </Card>
          {ex === pieces.length - 1 ? <Note tone="ok">That is the whole reading. Next, start from a setup and move the rig yourself.</Note> : null}
        </>
      ),
    },
    {
      key: 'place',
      title: 'Move the rig',
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, hh) => (
          <FieldStage w={w} h={hh} view={view} box={siteBox(variant, 'near', view)} a11y={nowWords} labels={[]} inset={view === 'top' ? rigInset(rigs) : null}>
            {(px) => (
              <>
                <SiteArt view={view} variant={variant} listener={false} />
                {zoneRects(view, px)}
                {rigs.map((r, k) => (
                  <RigArt key={k} view={view} rig={r} px={px} lobes={false} />
                ))}
                {view === 'top' ? <Ray a={uvOf('top', c)} b={uvOf('top', src)} px={px} width={1.6} /> : <Dim a={{ u: c.x - 140, v: 0 }} b={{ u: c.x - 140, v: c.y }} px={px} />}
                {blocked ? <Circle cx={c.x} cy={view === 'top' ? c.z : c.y} r={60 * px} style="stroke" strokeWidth={3 * px} color="#ff6b5e" /> : null}
              </>
            )}
          </FieldStage>
        ),
        badge: 'Blue = recommended starting points for the rig’s centre · blue line = the path to the front source · calculated from the drawing',
        bezel: [
          { k: 'HEIGHT', v: fmtM(h), flex: 0.8 },
          { k: 'TO SOURCE', v: fmtM(dSrc), flex: 0.9 },
          { k: 'FRONT OFF', v: `${Math.round(frontOff)}°`, tint: frontOff > 20 ? '#ff6b5e' : undefined, flex: 0.9 },
          { k: 'ZONE', v: blocked ? 'BLOCKED' : zone ? 'IN ZONE' : '—', tint: blocked ? '#ff6b5e' : zone ? '#5bff85' : undefined, flex: 1 },
        ],
        params,
        initialParam: 'move',
      },
      well: (
        <>
          {lesson.predictions.placement ? <PredictCard p={lesson.predictions.placement} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${start?.title ?? ''} · ${view === 'top' ? 'from above' : 'from the side'}`} prompt="MOVE the rig (choose FRONT–BACK, ACROSS or HEIGHT) and let go to rest it; turn its FRONT. Rest it in two different blue zones." />
          <NowLine text={nowWords} />
          {blocked ? <Note tone="warn">{`It would stand in ${blocked}. Keep the way clear and people safe: move it.`}</Note> : null}
          {zone ? (
            <Card>
              <Point title={`RECOMMENDED STARTING POINT · ${zone.label.toUpperCase()}`}>{`${zone.band} ${zone.tendency}`}</Point>
            </Card>
          ) : (
            <Body>{`Not at a recommended starting point. Here: ${zones.map((z) => z.label).join('; ')}.`}</Body>
          )}
          {frontOff > 20 ? <Note>{`Its front is ${Math.round(frontOff)}° away from the front source. A spatial rig keeps its front to the scene front — turn the rig, not the scene; log the front either way.`}</Note> : null}
          <Body>{`Activity: zones rested in, clear of the way — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
          {predicted != null && visited.size >= 2 && lesson.predictions.placement ? <Note tone="ok">{lesson.predictions.placement.after}</Note> : null}
        </>
      ),
    },
    {
      key: 'learn',
      title: 'How the starting points work',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>After our research, each blue zone is where we recommend you begin for that point of view — measured from the ground, facing the scene front. They are starting points, not rules: walk and listen at other places, and use your ears and the place. Experimentation is encouraged.</Body>
          <Body>Height, place and facing are separate decisions; change one at a time and log each — the front, the height, the channel map — with the take.</Body>
          <Note tone="warn">{`Clearance comes first: never in a public route, the stand weighted against wind, nothing within 3 m (10 ft) of a power line, and inside at once if you hear thunder — ${SAFETY_WORDS.lightning.split(' — ')[0].toLowerCase()}.`}</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'placement')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════════ 5 · CHANNELS AND DESTINATIONS (context) ═══════════════════ */

const TEST_SOURCES: readonly { id: string; label: string; az: number; el: number }[] = [
  { id: 'fl', label: 'front-left', az: 45, el: 0 },
  { id: 'r', label: 'right', az: -90, el: 0 },
  { id: 'back', label: 'behind', az: 180, el: 0 },
  { id: 'up', label: 'front, above', az: 0, el: 45 },
];

/** The four tracks as console strips, and the field circle: where the test
 *  source really is (white) and where it lands (amber). Drawn in a 1000 × 560
 *  box of its own units. */
function DrillArt({ s, sel, src, px }: { s: DrillState; sel: number; src: { az: number; el: number }; px: number }) {
  const got = decodedDirection(s, dirFrom(src.az, src.el));
  const err = directionError(got, src);
  const strip = (k: number) => {
    const x = 40 + k * 135;
    const g = s.gains[k];
    const capY = 420 - (g + 6) * 25;
    const wrong = s.tracks[k] !== A_ORDER[k];
    return (
      <Group key={k}>
        <RoundedRect x={x} y={40} width={115} height={480} r={10}>
          <LinearGradient start={vec(x, 40)} end={vec(x + 115, 520)} colors={['#3a3d45', '#22242a', '#15161a']} />
        </RoundedRect>
        <RoundedRect x={x} y={40} width={115} height={480} r={10} style="stroke" strokeWidth={(k === sel ? 3 : 1.4) * px} color={k === sel ? AMBER : '#0b0c0f'} />
        {/* The LED: green when the track holds the capsule the converter expects. */}
        <Circle cx={x + 57} cy={78} r={11} color={wrong ? '#ff5a48' : '#5bff85'} />
        <Circle cx={x + 57} cy={78} r={11} style="stroke" strokeWidth={1.4 * px} color="#0b0c0f" />
        {/* The fader slot and cap. */}
        <RoundedRect x={x + 52} y={270} width={11} height={190} r={5} color="#08090b" />
        <RoundedRect x={x + 30} y={capY} width={55} height={28} r={5}>
          <LinearGradient start={vec(x + 30, capY)} end={vec(x + 30, capY + 28)} colors={['#d4d8e0', '#8a8f99', '#4a4e57']} />
        </RoundedRect>
        {/* The link bar across all four when linked. */}
      </Group>
    );
  };
  const cx = 820;
  const cy = 280;
  const R = 150;
  const pos = (d: { az: number; el: number }) => ({ x: cx - Math.sin((d.az * Math.PI) / 180) * R * Math.cos((d.el * Math.PI) / 180), y: cy - Math.cos((d.az * Math.PI) / 180) * R * Math.cos((d.el * Math.PI) / 180) });
  const want = pos(src);
  const now = pos(got);
  const link = Skia.Path.Make();
  if (s.linked) {
    link.moveTo(70, 500);
    link.lineTo(40 + 3 * 135 + 85, 500);
  }
  return (
    <Group>
      {[0, 1, 2, 3].map(strip)}
      <Path path={link} style="stroke" strokeWidth={7} strokeCap="round" color={AMBER} opacity={0.85} />
      {/* The field: a listener seen from above, the front up. */}
      <Circle cx={cx} cy={cy} r={R} color="#101114" />
      <Circle cx={cx} cy={cy} r={R} style="stroke" strokeWidth={2 * px} color="#5b5f69" />
      <Circle cx={cx} cy={cy} r={16} color="#5b5f69" />
      <Circle cx={want.x} cy={want.y} r={18} style="stroke" strokeWidth={3 * px} color="#e8eaee" />
      <Circle cx={now.x} cy={now.y} r={13} color={err > 10 ? '#ff5a48' : AMBER} />
    </Group>
  );
}

function useDrillStep(onInteractive: (id: string) => void, done: boolean): MikingStep {
  const [s, setS] = useState<DrillState>(DRILL_START);
  const [sel, setSel] = useState(1);
  const [srcId, setSrcId] = useState('fl');
  const src = TEST_SOURCES.find((q) => q.id === srcId)!;
  const probs = drillProblems(s);
  const got = decodedDirection(s, dirFrom(src.az, src.el));
  const err = directionError(got, src);
  useEffect(() => {
    if (probs.length === 0 && !done) onInteractive('aformatDrill');
  }, [probs.length, done, onInteractive]);
  const setCapsule = (cap: ATrack) =>
    setS((q) => {
      const tracks = [...q.tracks];
      const other = tracks.indexOf(cap);
      if (other >= 0) tracks[other] = tracks[sel];
      tracks[sel] = cap;
      return { ...q, tracks };
    });
  const setGain = (g: number) =>
    setS((q) => {
      if (q.linked) {
        const d = g - q.gains[sel];
        return { ...q, gains: q.gains.map((x) => Math.max(-6, Math.min(6, Math.round((x + d) * 2) / 2))) };
      }
      return { ...q, gains: q.gains.map((x, k) => (k === sel ? g : x)) };
    });
  const spread = Math.max(...s.gains) - Math.min(...s.gains);
  const wrong = wrongTracks(s);
  const where = (d: { az: number; el: number }) => {
    const a = Math.round(d.az / 5) * 5;
    const e = Math.round(d.el / 5) * 5;
    const side = Math.abs(a) <= 10 ? 'front' : Math.abs(a) >= 170 ? 'behind' : a > 0 ? (a < 80 ? 'front-left' : a > 100 ? 'back-left' : 'left') : a > -80 ? 'front-right' : a < -100 ? 'back-right' : 'right';
    return `${side}${Math.abs(e) >= 10 ? `, ${e > 0 ? 'above' : 'below'}` : ''}`;
  };
  const words: Record<string, string> = {
    order: `Tracks ${wrong.join(' and ')} hold the wrong capsule: the converter reads each track as the capsule its slot expects, so the field turns — a ${src.label} source lands ${where(got)}. Put each capsule on its track, in the order the mic’s manual gives.`,
    gainMatch: `The four gains differ by ${spread.toFixed(1)} dB: an uneven capsule pulls the whole image toward it. Match all four.`,
    unlinked: 'The gains are not linked: one move during a take would unbalance the four. Link them, so every change moves all four together.',
    format: 'No output convention chosen. Choose the one the next device or software expects — FuMa and ambiX order and scale the channels differently — and write it in the log. Never guess it from “four channels” or a file name.',
    lfe: 'A full-range field channel is going to the LFE bus. “.1” is a separate low-frequency effects channel in delivery, not a place for a spatial track: take it off.',
  };
  const params: DockParam[] = [
    { kind: 'options', id: 'capsule', label: `TRACK ${sel + 1}`, valueLabel: s.tracks[sel], selectedId: s.tracks[sel], onSelect: (id) => setCapsule(id as ATrack), sticky: true, options: A_ORDER.map((cap) => ({ id: cap, label: `${cap} — ${A_WORDS[cap]}`, blurb: 'Put this capsule’s signal on the chosen track (the one it was on takes the old one).' })) },
    {
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      value: (s.gains[sel] + 6) / 12,
      onChange: (v) => setGain(Math.round((v * 12 - 6) * 2) / 2),
      format: () => `track ${sel + 1}: ${s.gains[sel] >= 0 ? '+' : ''}${s.gains[sel].toFixed(1)} dB${s.linked ? ' (linked: all four move)' : ''}`,
      // The number only: six controls share a 390-pt dock, and "T2 +0.0"
      // was cropped mid-number (D36: a cropped readout drops its label, never
      // its number). The track is on the TRACK control and the fader's line.
      formatShort: () => `${s.gains[sel] >= 0 ? '+' : ''}${s.gains[sel].toFixed(1)}`,
      home: 0.5,
      chooser: { title: 'CHOOSE A TRACK', selectedId: `${sel}`, onSelect: (id) => setSel(Number(id)), options: [0, 1, 2, 3].map((k) => ({ id: `${k}`, label: `TRACK ${k + 1} — now ${s.tracks[k]}`, blurb: `The converter expects ${A_ORDER[k]} (${A_WORDS[A_ORDER[k]]}) here.` })) },
    },
    { kind: 'toggle', id: 'link', label: s.linked ? 'LINKED' : 'UNLINKED', value: s.linked, onToggle: () => setS((q) => ({ ...q, linked: !q.linked })) },
    { kind: 'options', id: 'format', label: 'OUTPUT', valueLabel: s.format ? (s.format === 'fuma' ? 'FuMa' : 'ambiX') : '—', selectedId: s.format, onSelect: (id) => setS((q) => ({ ...q, format: id as 'fuma' | 'ambix' })), options: [{ id: 'ambix', label: 'ambiX', blurb: 'Channels W, Y, Z, X; W not scaled down.' }, { id: 'fuma', label: 'FuMa', blurb: 'Channels W, X, Y, Z; W 3 dB down.' }] },
    { kind: 'toggle', id: 'lfe', label: s.lfe ? 'LFE FED' : 'LFE CLEAR', value: s.lfe, onToggle: () => setS((q) => ({ ...q, lfe: !q.lfe })) },
    { kind: 'options', id: 'source', label: 'SOURCE', valueLabel: src.label.toUpperCase().slice(0, 8), selectedId: srcId, onSelect: setSrcId, options: TEST_SOURCES.map((q) => ({ id: q.id, label: `A test source ${q.label}`, blurb: 'Where a sound really is; the amber dot shows where it lands after the conversion.' })) },
  ];
  return {
    key: 'drill',
    title: 'The four tracks',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="top"
          box={{ u0: 0, u1: 1000, v0: 0, v1: 560 }}
          a11y={`Four track strips and a sound field from above. Tracks: ${s.tracks.map((t, k) => `${k + 1} ${t}`).join(', ')}. Gains ${s.linked ? 'linked' : 'not linked'}, ${spread.toFixed(1)} dB apart. Output ${s.format ?? 'not chosen'}. LFE ${s.lfe ? 'fed by track 4' : 'clear'}. A test source ${src.label} lands ${where(got)}.`}
          labels={[
            ...[0, 1, 2, 3].map((k) => ({ id: `t${k}`, text: `TRACK ${k + 1}`, short: `${k + 1}`, u: 97 + k * 135, v: 130, align: 'center' as const, tone: 'muted' as const })),
            ...[0, 1, 2, 3].map((k) => ({ id: `c${k}`, text: s.tracks[k], u: 97 + k * 135, v: 190, align: 'center' as const, tone: s.tracks[k] === A_ORDER[k] ? undefined : ('amber' as const) })),
            { id: 'front', text: 'FRONT', u: 820, v: 110, align: 'center', tone: 'muted' },
            { id: 'got', text: err > 10 ? 'LANDS HERE' : 'ON TARGET', u: 820, v: 470, align: 'center', tone: 'amber' },
          ]}
        >
          {(px) => <DrillArt s={s} sel={sel} src={src} px={px} />}
        </FieldStage>
      ),
      badge: 'Green light = the capsule the converter expects · white ring = where the test source is · amber dot = where it lands · a simplified picture of the conversion',
      bezel: [
        { k: 'ORDER', v: wrong.length ? `TRACKS ${wrong.join(',')}` : 'OK', tint: wrong.length ? '#ff5a48' : '#5bff85', flex: 1.1 },
        { k: 'GAINS', v: spread > 0.5 ? `±${spread.toFixed(1)} dB` : s.linked ? 'LINKED' : 'UNLINKED', tint: spread > 0.5 || !s.linked ? '#ff5a48' : '#5bff85', flex: 1 },
        { k: 'OUTPUT', v: s.format ? (s.format === 'fuma' ? 'FuMa' : 'ambiX') : '—', tint: s.format ? undefined : '#ff5a48', flex: 0.8 },
        { k: 'LFE', v: s.lfe ? 'FED' : 'CLEAR', tint: s.lfe ? '#ff5a48' : '#5bff85', flex: 0.7 },
      ],
      params,
      initialParam: 'gain',
    },
    well: (
      <>
        <Landing looking="Four A-format tracks · the field they make" prompt="Fix the recording: each capsule on its own track in order, the four gains matched and linked, the output convention chosen, nothing full-range in the LFE. Change SOURCE to test it." />
        {probs.length ? (
          <Card>
            {probs.map((q) => (
              <Point key={q} title={q === 'order' ? 'A SWAPPED CHANNEL' : q === 'gainMatch' ? 'UNMATCHED GAIN' : q === 'unlinked' ? 'GAINS NOT LINKED' : q === 'format' ? 'NO OUTPUT CONVENTION' : 'A CHANNEL IN THE LFE'}>
                {words[q]}
              </Point>
            ))}
          </Card>
        ) : (
          <Note tone="ok">{`All four in order, matched and linked, the output chosen (${s.format === 'fuma' ? 'FuMa' : 'ambiX'}), the LFE clear: a ${src.label} source lands ${where(got)}. Keep the raw tracks, and write the capsule order, the mounting, the gain and the convention in the log.`}</Note>
        )}
        <Body>Never sum, pan, noise-reduce or normalise the four raw tracks one by one as if they were ordinary channels: they only mean something together, through the mic’s own converter.</Body>
      </>
    ),
  };
}

const DEST_ICON_BOX: ViewBox = { u0: -1300, u1: 1300, v0: -1000, v1: 1000 };
function DestArt({ d, px }: { d: Destination; px: number }) {
  // Loudspeakers round a listener (from above), or headphones on the listener.
  const spk = d === 'surround5' ? [0, 30, -30, 110, -110] : d === 'stereo' ? [30, -30] : d === 'mono' ? [0] : [];
  const head = useMemo(() => headAbove(pt(0, 0), 114), []);
  return (
    <Group>
      <Group transform={[{ rotate: -Math.PI / 2 }]}>
        <FigureHead fill={head.fill} />
      </Group>
      {d === 'headphones'
        ? [-1, 1].map((s) => <RoundedRect key={s} x={-60} y={s > 0 ? 96 : -136} width={100} height={40} r={16} color="#2a2c32" />)
        : spk.map((a) => {
            const r = ((a - 90) * Math.PI) / 180;
            const x = Math.cos(r) * 820;
            const y = Math.sin(r) * 820;
            return (
              <Group key={a} transform={[{ translateX: x }, { translateY: y }, { rotate: r + Math.PI / 2 }]}>
                <RoundedRect x={-110} y={-80} width={220} height={160} r={18}>
                  <LinearGradient start={vec(-110, -80)} end={vec(110, 80)} colors={['#4a4e57', '#1d1e23', '#0b0c0e']} />
                </RoundedRect>
                <Circle cx={0} cy={60} r={46} color="#121317" />
                <Circle cx={0} cy={60} r={46} style="stroke" strokeWidth={2 * px} color="#6c717b" />
              </Group>
            );
          })}
    </Group>
  );
}

function useDestStep(): MikingStep {
  const [cap, setCap] = useState<Capture>('foa');
  const [dest, setDest] = useState<Destination>('stereo');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['foa|stereo']));
  const r = ROUTES[cap][dest];
  const mark = (c: Capture, d: Destination) => setSeen((prev) => (prev.has(`${c}|${d}`) ? prev : new Set([...prev, `${c}|${d}`])));
  const CAPS: readonly { id: Capture; label: string }[] = [
    { id: 'binaural', label: 'Binaural head' },
    { id: 'foa', label: 'Ambisonic mic' },
    { id: 'dms', label: 'Double M/S' },
    { id: 'surround50', label: '5.0 array' },
  ];
  return {
    key: 'dest',
    title: 'The destination check',
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage w={w} h={h} view="top" box={DEST_ICON_BOX} a11y={`${CAPS.find((q) => q.id === cap)?.label} to ${DEST_WORDS[dest].label}: ${r.how}. ${r.words}`} labels={[{ id: 'how', text: r.how === 'native' ? 'MADE FOR IT' : r.how === 'render' ? 'THROUGH A RENDERER' : 'A DOWNMIX TO CHECK', u: 0, v: 940, align: 'center', tone: 'amber' }]}>
          {(px) => <DestArt d={dest} px={px} />}
        </FieldStage>
      ),
      badge: 'From above: the listener and the destination’s loudspeakers or headphones · what each capture gives, in words',
      bezel: [
        { k: 'CAPTURE', v: CAPS.find((q) => q.id === cap)!.label.toUpperCase().slice(0, 12), flex: 1.3 },
        { k: 'TO', v: DEST_WORDS[dest].short, flex: 1 },
        { k: 'HOW', v: r.how.toUpperCase(), flex: 0.9 },
        { k: 'TRIED', v: `${seen.size}`, flex: 0.6 },
      ],
      params: [
        { kind: 'options', id: 'cap', label: 'CAPTURE', valueLabel: cap === 'surround50' ? '5.0' : cap.toUpperCase().slice(0, 8), selectedId: cap, onSelect: (id) => { setCap(id as Capture); mark(id as Capture, dest); }, sticky: true, options: CAPS.map((q) => ({ id: q.id, label: q.label })) },
        { kind: 'options', id: 'dest', label: 'DESTINATION', valueLabel: DEST_WORDS[dest].short, selectedId: dest, onSelect: (id) => { setDest(id as Destination); mark(cap, id as Destination); }, sticky: true, options: DESTINATIONS.map((q) => ({ id: q, label: DEST_WORDS[q].label, blurb: DEST_WORDS[q].blurb })) },
      ],
      initialParam: 'dest',
    },
    well: (
      <>
        <Landing looking="A capture and a destination" prompt="Choose a CAPTURE and a DESTINATION. What does each capture give each listener — and what has to be checked?" />
        <Card>
          <Point title={`${CAPS.find((q) => q.id === cap)!.label.toUpperCase()} → ${DEST_WORDS[dest].label.toUpperCase()}`}>{r.words}</Point>
        </Card>
        {seen.size >= 6 ? <Note tone="ok">Check every destination the job asks for — the headphones, the speaker layout, the stereo and the mono — on the real decoder or renderer, and keep the original channels.</Note> : null}
      </>
    ),
  };
}

function F10Channels(p: PageProps) {
  const { lesson, answers, onAnswered, onInteractive, interactiveDone } = p;
  const drill = useDrillStep(onInteractive, interactiveDone.has('aformatDrill'));
  const dest = useDestStep();
  const steps: MikingStep[] = [
    drill,
    dest,
    {
      key: 'live',
      title: 'Live and broadcast',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="KEEP IT OUT OF THE PA">An open spatial array near a PA hears the PA. Routed back into the same loudspeakers it can make a feedback path: keep it out of local reinforcement unless the routing and the margin before feedback have been worked out.</Point>
            <Point title="SEPARATE PATHS">The stream, the recorder and the PA are separate paths. Check the stream’s surround, stereo and mono versions, and its timing with the picture, before it goes out.</Point>
            <Point title="CLOSE MICS FOR WORDS">Use close mics for speech or instruments that must be clear; the spatial mic is the place around them.</Point>
            <Point title="KEEP THE ORIGINALS">Keep the raw channels and a record of the channel map, gain, mounting, front, converter and output convention; store any render separately — never overwrite the source with an unlabelled render.</Point>
          </Card>
          <Body>Then the checks.</Body>
          <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'context')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

export const F10_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  meet: F10Meet,
  setups: F10Setups,
  microphone: F10Microphone,
  placement: F10Placement,
  context: F10Channels,
};
export const F10_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { meet: 6, setups: 3, microphone: 2, placement: 4, context: 3 };

const styles = StyleSheet.create({
  role: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  title: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 20 },
  key: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  small: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
