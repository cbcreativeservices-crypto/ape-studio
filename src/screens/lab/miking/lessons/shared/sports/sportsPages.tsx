/**
 * THE SPORTS PAGE PIECES — the steps every Lab 7 part 2 lesson builds its own
 * pages from (LessonArt.pages), on the journey (docs/labs/miking/
 * LESSON_JOURNEY.md). Built once by group 2 (lab7-g5); group 3 imports them.
 *
 *   usePlanTourStep    MEET IT: a sport's plan, layer by layer — the playing
 *                      area, the keep-clear space, the routes, the approved
 *                      places, the fixtures nothing is attached to
 *   useSetupsStep      STARTING SETUPS drawn on the plan: each mic at its mark,
 *                      its aim (amber), its range (white) and a close-up of the
 *                      real mic at its height in the corner
 *   beforeStep         "before any mic": the one sports safety card + checks
 *   hearsStep          what else the mics hear (the lesson's setting items)
 *   useWorkedStep      PLACEMENT's worked example, read piece by piece
 *   usePlacementStep   the Placement Studio on the plan: START from a setup,
 *                      MOVE (along, out, height) and AIM; refused in play,
 *                      keep-clear space, a route or off an approved place;
 *                      rest in two recommended starting points
 *   useCoverageStep    coverage map mode: tag each zone detail / ambience
 *                      only / unavailable, with its handoff
 *   useHeadroomStep    the chain, stage by stage: find the first overloaded
 *                      stage and set the loudest safe rehearsal peak
 *   useOverlapStep     two mics on one moving source: the arrival difference
 *                      and the comb change as the source walks; polarity
 *                      flips the sign, never the time
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing moves by itself (a finger moves everything). Every
 * glass is a FieldStage (one labelled canvas, labels ≥ 9 pt that zoom).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { Lesson, Prediction, ViewBox } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { combDb, COMB_FLOOR_DB } from '../../../engine/physics/twoMic.ts';
import { FieldStage, type FieldInset } from '../field/FieldStage';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { ShotgunArt } from '../fieldmics/FieldMicArt';
import {
  BADGE_WORDS,
  COVERAGE_WORDS,
  aimRel,
  aimWords,
  degOf,
  fmtM1,
  fmtRange,
  footprintAt,
  nextTag,
  offAxisDeg,
  overlap,
  planRange,
  planUV,
  rangeDb,
  rectUV,
  refusedAt,
  slantRange,
  type CoverageTag,
  type CoverageZone,
  type P2,
  type PlanRect,
  type TurnArc,
  type VenueScene,
} from './venuePlan.ts';
import { ArcArt, CoverageArt, DishPlanGlyph, PlanAim, PlanLobe, PlanMic, PlanPath, TargetRing, VenuePlan, venueLabels, type PlanMicKind } from './VenueArt';
import { DishSection } from './DishArt';
import { hydroCloseUp, isPairKind } from './ArenaArt';
import { BoundarySection } from './BoundaryArt';
import { DISHES } from './parabolic.ts';
import { EVENTS, EVENT_IDS, HEADROOM_DEFAULTS, START_SETTINGS, STAGES, TRIAL_DBFS, chainGood, chainWords, fmtDb, fmtDbfs, readChain, type ChainSettings, type EventId } from './headroom.ts';
import { HeadroomDisplay } from './HeadroomArt';
import { sportPlan, type SportId } from './sportPlans.ts';
import type { SafetyRow } from './safety.ts';
import { PRACTICE_RULES } from './safety.ts';

export const AMBER = '#ffc64d';
export const BLUE = '#8fbcff';
const RED = '#ff6b5e';
const GREEN = '#5bff85';

/* ═════════ the shared pieces ═════════ */

/** A mic on a plan: where it stands (m), its capsule height, what it aims at. */
export type SportMic = { id: string; kind: PlanMicKind; label: string; at: P2; h: number; aimAt: P2; aimH: number; pattern?: 'shotgun' | 'supercardioid' | 'cardioid' | null };
export type SetupRole = 'ONE MIC' | 'TWO MICS' | 'CLOSE · LIVE' | 'FARTHER BACK · STUDIO' | 'ANOTHER START';
/** A STARTING SETUP drawn on a plan (the lesson's own, from its research). */
/** `noRange`: drawn on a real sport's outline (its size a drawing default) —
 *  no range is printed. */
export type SportSetup = { id: string; role: SetupRole; core: boolean; title: string; type: string; start: string; line: string; mics: SportMic[]; scene?: VenueScene; box?: PlanRect; noRange?: boolean; /** Lab 7b group 3: no corner close-up (a venue outline's capsule height is a drawing default, never printed). */ noCloseUp?: boolean };

export const micAimDeg = (m: Pick<SportMic, 'at' | 'aimAt'>): number => degOf({ x: m.aimAt.x - m.at.x, y: m.aimAt.y - m.at.y });
export const planBox = (r: PlanRect): ViewBox => rectUV(r);

/** The web preview harness only (`&setup=<n>`, 1-based; never the production router). */
export function devIndex(key = 'setup'): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (!(typeof __DEV__ !== 'undefined' && __DEV__ && g.window?.location?.search)) return 0;
  const m = new RegExp(`[?&]${key}=(\\d+)`).exec(g.window.location.search as string);
  return m ? Math.max(0, Number(m[1]) - 1) : 0;
}

/** A mic glyph's length on a plan (mm): about a tenth of the plan's width,
 *  so it reads at 1× and zooms with the drawing in full screen. */
export const glyphMm = (r: PlanRect): number => Math.min(((r.x1 - r.x0) * 1000) / (r.x1 - r.x0 < 14 ? 12 : 8), 4500); // a room-sized plan (Lab 7b group 3): a smaller mark

/** A plan on the glass: the venue, then the step's own layer, then labels. */
export function PlanStage({ w, h, scene, box, a11y, labels, inset, children, show, activeFootprint, highlight }: { w: number; h: number; scene: VenueScene; box?: PlanRect; a11y: string; labels: StaticLabel[]; inset?: FieldInset | null; children?: (px: number, g: number) => ReactNode; show?: Parameters<typeof VenuePlan>[0]['show']; activeFootprint?: string | null; highlight?: string | null }) {
  return (
    <FieldStage w={w} h={h} view="top" box={planBox(box ?? scene.frame)} a11y={a11y} labels={labels} inset={inset}>
      {(px) => (
        <>
          <VenuePlan scene={scene} px={px} show={show} activeFootprint={activeFootprint} highlight={highlight} />
          {children ? children(px, glyphMm(box ?? scene.frame)) : null}
        </>
      )}
    </FieldStage>
  );
}

/** A mic drawn on the plan: its pattern's shape (optional), the glyph, its aim. */
/** A plan point `metres` ahead of `at` along an aim (degrees, as dirFromDeg) —
 *  where an aim line starts, clear of the mic glyph it would otherwise hide. */
export function aheadOf(at: P2, deg: number, metres: number): P2 {
  return { x: at.x - Math.sin((deg * Math.PI) / 180) * metres, y: at.y + Math.cos((deg * Math.PI) / 180) * metres };
}

export function MicOnPlan({ m, px, g, lobe = true, aim = true }: { m: SportMic; px: number; /** the glyph's length (mm): glyphMm */ g: number; lobe?: boolean; aim?: boolean }) {
  const deg = micAimDeg(m);
  return (
    <Group>
      {lobe && m.pattern ? <PlanLobe at={m.at} aimDeg={deg} px={px} pattern={m.pattern} rPx={(g * 1.5) / px} /> : null}
      {aim ? <PlanAim from={aheadOf(m.at, deg, (g * 0.95) / 1000)} to={m.aimAt} px={px} /> : null}
      <PlanMic at={m.at} aimDeg={deg} kind={m.kind} px={px} sizePx={g / px} />
    </Group>
  );
}

/** The close-up in the corner: the real mic at its capsule height, from the
 *  side (u = metres from the mic toward its target, v = −height), its stand
 *  to the ground and the height as a white dimension — to scale. */
/** The corner the close-up takes: top-right, unless the mic itself is drawn
 *  there on the plan (then top-left), so the box never hides the mic. */
export function closeUpAt(m: SportMic, box: PlanRect): FieldInset['at'] {
  const u = (m.at.x - box.x0) / (box.x1 - box.x0);
  const v = (box.y1 - m.at.y) / (box.y1 - box.y0);
  return u > 0.5 && v < 0.6 ? { x: 0.02, y: 0.02, w: 0.38, h: 0.46 } : { x: 0.6, y: 0.02, w: 0.38, h: 0.46 };
}

export function micCloseUp(m: SportMic, at: FieldInset['at'] = { x: 0.6, y: 0.02, w: 0.38, h: 0.46 }): FieldInset {
  // Lab 7b group 3: the hydrophone's container, cut through.
  if (m.kind === 'hydrophone') return hydroCloseUp(at);
  if (m.kind === 'dish') {
    const d = DISHES.large;
    return {
      view: 'side',
      box: { u0: -260, u1: d.depth + 260, v0: -420, v1: 420 },
      at,
      draw: (px) => <DishSection dish={d} px={px} wind />,
      labels: [{ id: 'cu', text: 'THE DISH, CUT AWAY', short: 'DISH', u: d.depth / 2, v: -380, align: 'center', tone: 'muted' }],
    };
  }
  if (m.kind === 'boundary') {
    return {
      view: 'side',
      box: { u0: -500, u1: 1400, v0: -900, v1: 260 },
      at,
      draw: (px) => <BoundarySection g={{ h: 0, x: 1200, hs: 800 }} px={px} u0={-480} u1={1380} />,
      labels: [{ id: 'cu', text: 'ON THE FLOOR', short: 'FLOOR', u: 450, v: -820, align: 'center', tone: 'muted' }],
    };
  }
  const H = m.h * 1000;
  const R = planRange(m.at, m.aimAt) * 1000;
  const rise = (m.aimH - m.h) * 1000;
  const ang = Math.atan2(-rise, R); // screen angle of the aim
  return {
    view: 'side',
    // Close on the mic itself (to scale); the stand runs on down out of the box.
    box: { u0: -330, u1: 470, v0: -H - 300, v1: -H + 320 },
    at,
    draw: (px) => (
      <Group>
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.addRect(Skia.XYWHRect(-2000, -H - 2000, 5000, H + 2000));
            return p;
          })()}
          color="#4b5b6d"
        />
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.addRect(Skia.XYWHRect(-2000, 0, 5000, 300));
            return p;
          })()}
          color="#2f4a28"
        />
        <Path
          path={(() => {
            const p = Skia.Path.Make();
            p.moveTo(-60, -H + 40);
            p.lineTo(-60, -260);
            p.moveTo(-60, -260);
            p.lineTo(-330, 0);
            p.moveTo(-60, -260);
            p.lineTo(200, 0);
            p.moveTo(-60, -260);
            p.lineTo(-60, 0);
            return p;
          })()}
          style="stroke"
          strokeWidth={Math.max(14, 2.4 * px)}
          strokeCap="round"
          color="#5b5f69"
        />
        {m.kind === 'shotgun' ? <ShotgunArt x={0} y={-H} angleDeg={(ang * 180) / Math.PI} /> : null}
        {m.kind === 'compact' || m.kind === 'xy' || isPairKind(m.kind) ? (
          <Group transform={[{ translateX: 0 }, { translateY: -H }, { rotate: ang + Math.PI / 2 }]}>
            <MikingMicArt art="sdc" r={10.5} len={104} />
          </Group>
        ) : null}
        <PlanAimSide from={{ u: 0, v: -H }} ang={ang} px={px} />
      </Group>
    ),
    labels: [{ id: 'cu', text: `CAPSULE ${fmtM1(m.h)} UP`, short: fmtM1(m.h), u: 100, v: -H - 230, align: 'center', tone: 'muted' }],
  };
}
function PlanAimSide({ from, ang, px }: { from: { u: number; v: number }; ang: number; px: number }) {
  const p = Skia.Path.Make();
  // Starts past the mic's front (a short shotgun's tube is 200 mm), so the line never hides the mic.
  p.moveTo(from.u + Math.cos(ang) * 280, from.v + Math.sin(ang) * 280);
  p.lineTo(from.u + Math.cos(ang) * 900, from.v + Math.sin(ang) * 900);
  return <Path path={p} style="stroke" strokeWidth={2 * px} color={AMBER} opacity={0.9} />;
}
export function DimSide({ a, b, px }: { a: { u: number; v: number }; b: { u: number; v: number }; px: number }) {
  const p = Skia.Path.Make();
  p.moveTo(a.u, a.v);
  p.lineTo(b.u, b.v);
  for (const q of [a, b]) {
    p.moveTo(q.u - 7 * px, q.v);
    p.lineTo(q.u + 7 * px, q.v);
  }
  return <Path path={p} style="stroke" strokeWidth={2 * px} color="#f2f4f8" />;
}

/** The scene's variant dock key (the lessons each have one practice scene, so
 *  none is offered by default). */
const roleKey = (r: SetupRole) => r.split(' ')[0];

/* ═════════ MEET IT · the plan, layer by layer ═════════ */

type LayerId = 'play' | 'keepClear' | 'routes' | 'footprints' | 'fixtures' | 'sound';
const LAYERS: readonly { id: LayerId; label: string; short: string; text: (s: VenueScene) => string }[] = [
  { id: 'play', label: 'The playing area', short: 'PLAY', text: (s) => `${s.blurb} The playing area belongs to the athletes and officials — no mic, stand, cable or operator in it.` },
  {
    id: 'keepClear',
    label: 'Keep clear',
    short: 'KEEP CLEAR',
    text: (s) => (s.keepClear.length ? s.keepClear[0].note : 'This plan marks no extra band — the barrier itself is the edge. Check your event’s rules for the space round it.'),
  },
  { id: 'routes', label: 'Routes people need', short: 'ROUTES', text: (s) => (s.routes.length ? `${s.routes.map((r) => r.label).join('; ')}. A route is never a place to stand or run a cable across.` : 'No route is marked here.') },
  { id: 'footprints', label: 'Approved places', short: 'APPROVED', text: (s) => `${s.footprints.map((f) => f.label).join('; ')}. A mic goes only where the event has approved it — a credential is not an approval.` },
  { id: 'fixtures', label: 'Fixtures', short: 'FIXTURES', text: (s) => (s.badges.length || s.barriers.length ? [...s.badges.map((b) => `${b.label}: ${BADGE_WORDS[b.kind]}`), ...s.barriers.map((b) => `${b.label}: on its far side is live play.`)].filter((x, i, a) => a.indexOf(x) === i).join(' ') : 'No fixture is marked here.') },
  { id: 'sound', label: 'Cameras, crowd and PA', short: 'CROWD · PA', text: () => 'The cameras’ frames, the crowd and the PA: what a mic must stay out of the picture of, and what it will hear besides the play.' },
];

/** The sport a plan tour opens on (the preview harness may pick another). */
const sid0 = (sports: readonly SportId[]): SportId => sports[Math.min(devIndex('sport'), sports.length - 1)];

export function usePlanTourStep({ sports, title, prompt, a11yLead }: { sports: readonly SportId[]; title: string; prompt: string; a11yLead: string }): MikingStep {
  // The web preview harness only: `&sport=<n>&layer=<n>` (1-based) opens that sport and layer.
  const [sid, setSid] = useState<SportId>(() => sports[Math.min(devIndex('sport'), sports.length - 1)]);
  const [k, setK] = useState(() => Math.min(devIndex('layer'), LAYERS.length - 1));
  const [seen, setSeen] = useState<ReadonlySet<SportId>>(() => new Set([sid0(sports)]));
  const scene = sportPlan(sid);
  const layer = LAYERS[Math.min(k, LAYERS.length - 1)];
  const show = {
    keepClear: k >= 1,
    routes: k >= 2,
    footprints: k >= 3,
    badges: k >= 4,
    barriers: true,
    cameras: k >= 5,
    sectors: k >= 5,
    targets: false,
    marks: false,
  };
  const labels: StaticLabel[] = [];
  if (k === 1) for (const q of scene.keepClear.slice(0, 1)) labels.push({ id: 'kc', text: q.short, u: planUV(q.poly[0]).u + 1500, v: planUV(q.poly[0]).v - 600, align: 'left', tone: 'muted' });
  if (k === 3) for (const f of scene.footprints) labels.push({ id: f.id, text: f.short, u: planUV({ x: f.rect.x1, y: f.rect.y1 }).u + 300, v: planUV({ x: f.rect.x1, y: f.rect.y1 }).v - 200, align: 'left', tone: 'muted' });
  if (k === 4) for (const b of scene.badges) labels.push({ id: b.id, text: b.short, u: planUV(b.p).u, v: planUV(b.p).v - 2200, align: 'center', tone: 'muted', at: planUV(b.p) });
  return {
    key: 'plans',
    title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <PlanStage w={w} h={h} scene={scene} a11y={`${a11yLead} ${scene.label} from above. Showing: ${layer.label.toLowerCase()}. ${layer.text(scene)}`} labels={labels} show={show} />,
      badge: `${scene.label} from above · a typical layout, simplified · red hatch = keep clear · dashed = routes · green box = approved`,
      bezel: [
        { k: 'SPORT', v: scene.label.split(' (')[0].toUpperCase(), flex: 1.6 },
        { k: 'LAYER', v: layer.short, flex: 1.3 },
        { k: 'LOOKED AT', v: `${seen.size} / ${sports.length}`, flex: 1 },
      ],
      params: [
        { kind: 'fader', id: 'layer', label: 'LAYER', value: k / (LAYERS.length - 1), onChange: (v) => setK(Math.round(v * (LAYERS.length - 1))), format: () => `${k + 1} of ${LAYERS.length} · ${layer.label.toLowerCase()}`, formatShort: () => layer.short.slice(0, 8) },
        {
          kind: 'options',
          id: 'sport',
          label: 'SPORT',
          valueLabel: scene.label.split(' ')[0].toUpperCase().slice(0, 9),
          selectedId: sid,
          sticky: true,
          onSelect: (id) => {
            setSid(id as SportId);
            setSeen((p) => (p.has(id as SportId) ? p : new Set([...p, id as SportId])));
          },
          options: sports.map((q) => ({ id: q, label: sportPlan(q).label, blurb: sportPlan(q).blurb })),
        },
      ],
      initialParam: 'layer',
    },
    well: (
      <>
        <Landing looking={`${scene.label} · from above · ${layer.label.toLowerCase()}`} prompt={prompt} />
        <Card>
          <Point title={layer.label.toUpperCase()}>{layer.text(scene)}</Point>
        </Card>
        <Body>{`Sports looked at: ${seen.size} of ${sports.length}. The outlines are typical layouts for a picture of where approval is needed — your event’s own plan and rules decide.`}</Body>
      </>
    ),
  };
}

/* ═════════ MEET IT · range and angle from one mark ═════════ */

/** The targets as seen from one mark: plan and slant range, the aim left or
 *  right of straight ahead, and the free-field level change against the first
 *  target — all calculated from the drawing. */
export function useRangeStep({ scene, from, fromH, fromLabel, prediction, box, prompt }: { scene: VenueScene; from: P2; fromH: number; fromLabel: string; prediction?: Prediction; box?: PlanRect; prompt: string }): MikingStep {
  const ts = scene.targets;
  const [k, setK] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set([ts[0]?.id ?? '']));
  const [predicted, setPredicted] = useState<string | null>(null);
  const t = ts[Math.min(k, ts.length - 1)];
  const r0 = slantRange(from, fromH, ts[0].p, ts[0].h);
  const plan = planRange(from, t.p);
  const slant = slantRange(from, fromH, t.p, t.h);
  const aim = aimRel(from, t.p);
  const db = rangeDb(r0, slant);
  const words = `${t.label}: ${fmtM1(plan)} from ${fromLabel} in plan, ${fmtM1(slant)} to the source’s height; ${aimWords(aim)}; about ${Math.abs(db).toFixed(1)} dB ${db >= 0 ? 'weaker' : 'stronger'} than ${ts[0].short} (direct sound, open ground).`;
  return {
    key: 'range',
    title: 'Where the sound comes from',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={scene} box={box} a11y={words} labels={venueLabels(scene)} highlight={t.id}>
          {(px, g) => (
            <>
              <PlanAim from={from} to={{ x: from.x, y: from.y + Math.max(4, plan * 0.45) }} px={px} color="#9aa0ab" head={false} />
              <PlanPath a={from} b={t.p} px={px} width={2.4} />
            </>
          )}
        </PlanStage>
      ),
      badge: 'From above · blue = the straight path from the mark · grey dashed = straight ahead · calculated from the drawing',
      bezel: [
        { k: 'TARGET', v: t.short, flex: 0.8 },
        { k: 'RANGE', v: fmtM1(slant), flex: 1 },
        { k: 'AIM', v: Math.round(aim) === 0 ? '0°' : `${Math.abs(Math.round(aim))}° ${aim > 0 ? 'L' : 'R'}`, flex: 0.9 },
        { k: `VS ${ts[0].short}`, v: k === 0 ? '—' : `${db >= 0 ? '−' : '+'}${Math.abs(db).toFixed(1)} dB`, flex: 1 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'target',
          label: 'TARGET',
          value: ts.length > 1 ? k / (ts.length - 1) : 0,
          onChange: (v) => {
            const i = Math.round(v * (ts.length - 1));
            setK(i);
            setSeen((p) => (p.has(ts[i].id) ? p : new Set([...p, ts[i].id])));
          },
          format: () => `${k + 1} of ${ts.length} · ${t.label}`,
          formatShort: () => t.short,
        },
      ],
      initialParam: 'target',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`From ${fromLabel} · ${t.label}`} prompt={prompt} />
        <NowLine text={words} />
        <Card>
          <Point title="DISTANCE">{`${fmtRange(slant)} to the source’s height. Each doubling of distance costs about 6 dB of direct sound in the open; the background does not drop with it.`}</Point>
          <Point title="ANGLE">{Math.round(aim) === 0 ? 'Straight ahead: on the axis of a mic aimed this way.' : `${aimWords(aim)}: a mic aimed straight ahead hears it off its axis — weaker, the higher frequencies first.`}</Point>
        </Card>
        {seen.size === ts.length ? <Note tone="ok">{`Each target is a different range and angle from the same approved mark: a mic aimed at one hears the others less well. No mic zooms — the plan decides who covers what. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : <Body>{`Targets looked at: ${seen.size} of ${ts.length}.`}</Body>}
      </>
    ),
  };
}

/* ═════════ MICROPHONES · the pickup methods ═════════ */

export type Method = { id: string; label: string; short: string; gives: string; limit: string; mics: SportMic[]; scene?: VenueScene; box?: PlanRect; note?: string; /** Lab 7b group 3: no corner close-up (see SportSetup). */ noCloseUp?: boolean };

export function useMethodsStep({ scene, methods, box, prediction, prompt, done }: { scene: VenueScene; methods: readonly Method[]; box?: PlanRect; prediction?: Prediction; prompt: string; done: string }): MikingStep {
  const [id, setId] = useState(() => methods[Math.min(devIndex('method'), methods.length - 1)].id);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set([methods[0].id]));
  const [predicted, setPredicted] = useState<string | null>(null);
  const mt = methods.find((q) => q.id === id) ?? methods[0];
  const sc = mt.scene ?? scene;
  return {
    key: 'methods',
    title: 'The methods',
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={sc} box={mt.box ?? (mt.scene ? undefined : box)} a11y={`${mt.label}. ${mt.gives} ${mt.limit}`} labels={venueLabels(sc, { layers: false })} inset={mt.mics[0] && !mt.noCloseUp ? micCloseUp(mt.mics[0], closeUpAt(mt.mics[0], mt.box ?? (mt.scene ? sc.frame : box ?? sc.frame))) : null}>
          {(px, g) => (
            <>
              {mt.mics.map((m) => (
                <MicOnPlan g={g} key={m.id} m={m} px={px} aim={m.kind !== 'hydrophone'} />
              ))}
            </>
          )}
        </PlanStage>
      ),
      badge: 'From above · white dashed = a pattern’s shape, not its range · the corner box = the mic itself, to scale',
      bezel: [
        { k: 'METHOD', v: mt.short, flex: 1.6 },
        { k: 'LOOKED AT', v: `${seen.size} / ${methods.length}`, flex: 1 },
      ],
      params: [
        {
          kind: 'options',
          id: 'method',
          label: 'METHOD',
          valueLabel: mt.short.slice(0, 9),
          selectedId: id,
          sticky: true,
          onSelect: (v) => {
            setId(v);
            setSeen((p) => (p.has(v) ? p : new Set([...p, v])));
          },
          options: methods.map((q) => ({ id: q.id, label: q.label, blurb: q.gives })),
        },
      ],
      initialParam: 'method',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${mt.label} · from above`} prompt={prompt} />
        <Card>
          <Point title="WHAT IT GIVES">{mt.gives}</Point>
          <Point title="ITS LIMIT">{mt.limit}</Point>
          {mt.note ? <Point title="TO CHECK">{mt.note}</Point> : null}
        </Card>
        {seen.size === methods.length ? <Note tone="ok">{done}</Note> : <Body>{`Methods looked at: ${seen.size} of ${methods.length}.`}</Body>}
      </>
    ),
  };
}

/* ═════════ STARTING SETUPS ═════════ */

export function useSetupsStep({ p, scene, setups, box, prompt }: { p: PageProps; scene: VenueScene; setups: readonly SportSetup[]; box?: PlanRect; prompt: string }): MikingStep {
  const { onInteractive, interactiveDone, chooseStart } = p;
  const core = setups.filter((q) => q.core);
  const [idx, setIdx] = useState(() => Math.min(devIndex(), setups.length - 1));
  const i = Math.min(idx, setups.length - 1);
  const sel = setups[i];
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (!sel) return;
    setSeen((prev) => (prev.has(sel.id) ? prev : new Set([...prev, sel.id])));
    chooseStart?.(sel.id);
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const seenCore = core.filter((q) => seen.has(q.id)).length;
  useEffect(() => {
    if (core.length && seenCore >= core.length && !interactiveDone.has('setupsSeen')) onInteractive('setupsSeen');
  }, [seenCore, core.length, interactiveDone, onInteractive]);
  const sc = sel?.scene ?? scene;
  const m0 = sel?.mics[0];
  const r0 = m0 && !sel?.noRange && m0.kind !== 'xy' ? slantRange(m0.at, m0.h, m0.aimAt, m0.aimH) : NaN;
  const labels: StaticLabel[] = sel
    ? [
        ...venueLabels(sc, { layers: false }),
        // An ambience pair aims into the play, at no target: no range is printed for it.
        ...(sel.noRange ? [] : sel.mics.filter((m) => m.kind !== 'xy')).map((m) => {
          const a = planUV(m.at);
          const b = planUV(m.aimAt);
          const r = slantRange(m.at, m.h, m.aimAt, m.aimH);
          return { id: `r.${m.id}`, text: fmtM1(r), u: (a.u + b.u) / 2 + 500, v: (a.v + b.v) / 2, align: 'left' as const, tone: 'amber' as const };
        }),
      ]
    : [];
  return {
    key: 'setups',
    title: 'Starting setups',
    kind: 'WATCH',
    layout: 'rack',
    rack: {
      render: (w, h) =>
        sel ? (
          <PlanStage w={w} h={h} scene={sc} box={sel.box ?? box} a11y={`${sel.role}: ${sel.title}. ${sel.start}`} labels={labels} inset={m0 && !sel.noCloseUp ? micCloseUp(m0, closeUpAt(m0, sel.box ?? box ?? sc.frame)) : null}>
            {(px, g) => (
              <>
                {sel.mics.map((m) => (
                  <MicOnPlan g={g} key={m.id} m={m} px={px} aim={m.kind !== 'hydrophone'} />
                ))}
              </>
            )}
          </PlanStage>
        ) : (
          <Text style={styles.missing}>No setup here.</Text>
        ),
      badge: 'Placed for you · amber dashed = where each mic points · white dashed = a pattern’s shape, not its range · the corner box = the mic at its height, to scale · ranges calculated from the drawing',
      bezel: [
        { k: 'SETUP', v: `${i + 1} / ${setups.length}`, flex: 0.8 },
        { k: 'ROLE', v: sel ? roleKey(sel.role) : '—', flex: 1 },
        { k: 'RANGE', v: fmtM1(r0), flex: 1 },
        { k: 'LOOKED AT', v: `${seenCore} / ${core.length}`, flex: 1 },
      ],
      params: [
        { kind: 'fader', id: 'setup', label: 'SETUP', value: setups.length > 1 ? i / (setups.length - 1) : 0, onChange: (v) => setIdx(Math.round(v * (setups.length - 1))), format: () => (sel ? `${i + 1} of ${setups.length} · ${sel.role.toLowerCase()}` : 'no setup'), formatShort: () => `${i + 1} / ${setups.length}` },
        { kind: 'options', id: 'pick', label: 'SETUPS', valueLabel: sel ? roleKey(sel.role) : '—', selectedId: sel?.id ?? null, sticky: true, onSelect: (id) => setIdx(Math.max(0, setups.findIndex((q) => q.id === id))), options: setups.map((q) => ({ id: q.id, label: `${q.role} · ${q.title}`, blurb: q.line })) },
      ],
      initialParam: 'setup',
    },
    well: (
      <>
        <Landing looking={sel ? `${sel.role} · from above` : ''} prompt={prompt} />
        {sel ? (
          <Card>
            <Text style={styles.role}>{sel.role}</Text>
            <Text style={styles.title}>{sel.title}</Text>
            <Text style={styles.line}>
              <Text style={styles.key}>{'MIC · '}</Text>
              {sel.type}
            </Text>
            <Text style={styles.line}>
              <Text style={styles.key}>{'START · '}</Text>
              {sel.start}
            </Text>
            <Text style={styles.line}>
              <Text style={styles.key}>{'TENDS TO · '}</Text>
              {sel.line}
            </Text>
          </Card>
        ) : null}
        <Body>{`Looked at: ${seenCore} of ${core.length} main setups (ANOTHER START is there to explore).`}</Body>
      </>
    ),
  };
}

/** What else the mics hear (the lesson's setting items) — a read step. */
export function hearsStep(lesson: Lesson, lead: string): MikingStep {
  return {
    key: 'hears',
    title: 'What else the mics hear',
    kind: 'LEARN',
    layout: 'read',
    body: (
      <>
        <Body>{lead}</Body>
        <Card>
          {lesson.setting.items.map((q) => (
            <Point key={q.id} title={q.short}>
              {q.note}
            </Point>
          ))}
        </Card>
        <Card>
          <Point title="LIVE AND BROADCAST">{lesson.setting.stage}</Point>
          <Point title="PRACTICE AND REHEARSAL">{lesson.setting.studio}</Point>
        </Card>
      </>
    ),
  };
}

/** BEFORE ANY MIC: the one sports safety card, the practice rule, the checks. */
export function beforeStep(p: PageProps, rows: readonly SafetyRow[], extra?: ReactNode): MikingStep {
  return {
    key: 'before',
    title: 'Before any mic',
    kind: 'CHECK',
    layout: 'read',
    body: (
      <>
        <Card>
          {rows.map((r) => (
            <Point key={r.id} title={r.title}>
              {r.text}
            </Point>
          ))}
        </Card>
        {extra}
        <Note tone="warn">{PRACTICE_RULES}</Note>
        <Body>Then the checks.</Body>
        <ScenarioList items={p.lesson.scenarios.filter((q) => q.page === 'setups')} answers={p.answers} onAnswered={p.onAnswered} />
      </>
    ),
  };
}

/* ═════════ PLACEMENT ═════════ */

/** A recommended starting point on the plan: where the mic stands (a plan
 *  rectangle), its capsule height range, and the target it aims at (within
 *  `tol` degrees of it). `kinds`: the mics it takes. */
export type PlanZone = { id: string; label: string; band: string; tendency: string; rect: PlanRect; h: [number, number]; target: string; tol: number; kinds: readonly PlanMicKind[] };

export function inPlanZone(z: PlanZone, kind: PlanMicKind, at: P2, h: number, aimDeg: number, scene: VenueScene): boolean {
  if (!z.kinds.includes(kind)) return false;
  if (!(at.x >= z.rect.x0 && at.x <= z.rect.x1 && at.y >= z.rect.y0 && at.y <= z.rect.y1)) return false;
  if (h < z.h[0] - 1e-9 || h > z.h[1] + 1e-9) return false;
  const t = scene.targets.find((q) => q.id === z.target);
  if (!t) return false;
  return offAxisDeg(at, aimDeg, t.p) <= z.tol + 1e-9;
}

export function useWorkedStep({ scene, mic, pieces, box, title }: { scene: VenueScene; mic: SportMic; pieces: readonly { title: string; text: string; key: string; value: string }[]; box?: PlanRect; title: string }): MikingStep {
  const [ex, setEx] = useState(0);
  const pc = pieces[Math.min(ex, pieces.length - 1)];
  return {
    key: 'watch',
    title: 'Worked example',
    kind: 'WATCH',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={scene} box={box} a11y={`A worked example, placed for you: ${title}. ${pc.title.toLowerCase()}: ${pc.text}`} labels={venueLabels(scene)} inset={micCloseUp(mic, closeUpAt(mic, box ?? scene.frame))}>
          {(px, g) => <MicOnPlan g={g} m={mic} px={px} />}
        </PlanStage>
      ),
      badge: 'WORKED EXAMPLE · placed for you · the corner box = the mic at its height, to scale',
      bezel: pieces.map((q, i) => ({ k: i === ex ? `▸ ${q.key}` : q.key, v: q.value, tint: i === ex ? AMBER : undefined, flex: 1 })),
      params: [{ kind: 'fader', id: 'piece', label: 'STEP', value: ex / Math.max(1, pieces.length - 1), onChange: (v) => setEx(Math.round(v * (pieces.length - 1))), format: () => `${ex + 1} of ${pieces.length} · ${pc.title.toLowerCase()}`, formatShort: () => `${ex + 1} / ${pieces.length}` }],
      initialParam: 'piece',
    },
    well: (
      <>
        <Landing looking={`Worked example · ${title}`} prompt="Step through how this starting point is read, piece by piece." />
        <Card>
          <Point title={`${ex + 1} · ${pc.title}`}>{pc.text}</Point>
        </Card>
        {ex === pieces.length - 1 ? <Note tone="ok">That is the whole reading. Next, start from a setup and move the mic yourself.</Note> : null}
      </>
    ),
  };
}

type Axis = 'x' | 'y' | 'h';
const AXIS_WORDS: Record<Axis, { label: string; blurb: string }> = {
  x: { label: 'ALONG', blurb: 'Along the line (left or right as you face the field).' },
  y: { label: 'OUT · IN', blurb: 'Back from the line, or toward the play.' },
  h: { label: 'HEIGHT', blurb: 'The capsule’s height above the ground.' },
};

export function usePlacementStep({ p, scene, zones, starts, box, ranges, arc: arcIn, arcKinds, prediction, refuseWords }: {
  p: PageProps;
  scene: VenueScene;
  zones: readonly PlanZone[];
  /** The setups the learner may START from (their first mic). */
  starts: readonly SportSetup[];
  box?: PlanRect;
  /** The lanes' ranges (m): along, out/in and height. */
  ranges: { x: [number, number]; y: [number, number]; h: [number, number] };
  /** An operator's turn arc (a dish): an aim outside it is refused. */
  arc?: TurnArc;
  /** The mic kinds the arc applies to (default: every kind). */
  arcKinds?: readonly PlanMicKind[];
  prediction?: Prediction;
  refuseWords?: string;
}): MikingStep {
  const { startFrom, onInteractive, interactiveDone } = p;
  const first = starts.find((s) => s.id === startFrom) ?? starts[0];
  const [startId, setStartId] = useState(first.id);
  const start = starts.find((s) => s.id === startId) ?? first;
  const m0 = start.mics[0];
  const [at, setAt] = useState<P2>(m0.at);
  const [h, setH] = useState(m0.h);
  const [aim, setAim] = useState(() => aimRel(m0.at, m0.aimAt));
  const [rest, setRest] = useState<{ at: P2; h: number; aim: number }>({ at: m0.at, h: m0.h, aim: aimRel(m0.at, m0.aimAt) });
  const [moved, setMoved] = useState(false);
  const [axis, setAxis] = useState<Axis>('x');
  const [tid, setTid] = useState(scene.targets.find((t) => t.p.x === m0.aimAt.x && t.p.y === m0.aimAt.y)?.id ?? scene.targets[0]?.id ?? '');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const atRef = useRef(at);
  atRef.current = at;
  const hRef = useRef(h);
  hRef.current = h;
  const pickStart = (id: string) => {
    const q = starts.find((s) => s.id === id);
    if (!q) return;
    const m = q.mics[0];
    setStartId(id);
    setAt(m.at);
    setH(m.h);
    setAim(aimRel(m.at, m.aimAt));
    setRest({ at: m.at, h: m.h, aim: aimRel(m.at, m.aimAt) });
    setMoved(false);
  };
  const kind = m0.kind;
  const arc = arcIn && (!arcKinds || arcKinds.includes(kind)) ? arcIn : undefined;
  const deg = aim; // relative to straight ahead (+y): the same as degOf
  const refused = refusedAt(scene, at);
  const outOfArc = arc ? !(aim >= arc.fromDeg - 1e-9 && aim <= arc.toDeg + 1e-9) : false;
  const zone = zones.find((z) => inPlanZone(z, kind, rest.at, rest.h, rest.aim, scene) && !refusedAt(scene, rest.at)) ?? null;
  useEffect(() => {
    if (moved && zone && !(arc && !(rest.aim >= arc.fromDeg && rest.aim <= arc.toDeg))) setVisited((prev) => (prev.has(zone.id) ? prev : new Set([...prev, zone.id])));
  }, [zone?.id, rest, moved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (visited.size >= 2 && !interactiveDone.has('twoZones')) onInteractive('twoZones');
  }, [visited, interactiveDone, onInteractive]);
  const target = scene.targets.find((t) => t.id === tid) ?? scene.targets[0];
  const range = target ? slantRange(at, h, target.p, target.h) : NaN;
  const offT = target ? offAxisDeg(at, deg, target.p) : NaN;
  const crowd = scene.sectors.find((s) => s.kind === 'crowd') ?? scene.sectors[0];
  const offCrowd = crowd ? offAxisDeg(at, deg, crowd.c) : NaN;
  const mic: SportMic = { ...m0, at, h, aimAt: { x: at.x - Math.sin((deg * Math.PI) / 180) * 10, y: at.y + Math.cos((deg * Math.PI) / 180) * 10 }, aimH: h };
  const lo = ranges[axis];
  const axisVal = axis === 'h' ? h : axis === 'x' ? at.x : at.y;
  const snap = (v: number) => Math.round((lo[0] + v * (lo[1] - lo[0])) * 10) / 10;
  const apply = (val: number): { at: P2; h: number } => (axis === 'h' ? { at: atRef.current, h: Math.max(0, val) } : axis === 'x' ? { at: { x: val, y: atRef.current.y }, h: hRef.current } : { at: { x: atRef.current.x, y: val }, h: hRef.current });
  const nowWords = `The ${start.mics[0].label}: ${fmtM1(h)} up${target ? `; ${fmtM1(range)} from ${target.label}, ${Math.round(offT)}° off its axis` : ''}${crowd ? `; the crowd ${Math.round(offCrowd)}° off its axis` : ''}.${zone ? ` At a recommended starting point: ${zone.label}.` : ' Not at a recommended starting point.'}${refused ? ` Refused: it would stand in ${refused.label}.` : ''}${outOfArc ? ' Outside the turn arc: stop and hand off.' : ''}`;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'move',
      label: 'MOVE',
      value: Math.max(0, Math.min(1, (axisVal - lo[0]) / (lo[1] - lo[0]))),
      onChange: (v) => {
        const n = apply(snap(v));
        setAt(n.at);
        setH(n.h);
      },
      onCommit: (v) => {
        const n = apply(snap(v));
        setAt(n.at);
        setH(n.h);
        setRest({ at: n.at, h: n.h, aim });
        setMoved(true);
      },
      format: (v) => {
        const x = snap(v);
        return axis === 'h' ? `capsule ${fmtM1(x)} up` : axis === 'x' ? `${x.toFixed(1)} m along the line` : x < 0 ? `${(-x).toFixed(1)} m back from the line` : `${x.toFixed(1)} m in from the line`;
      },
      formatShort: () => (axis === 'h' ? fmtM1(h) : `${(axis === 'x' ? at.x : at.y).toFixed(1)}`),
      chooser: { title: 'MOVE THE MIC', selectedId: axis, onSelect: (id) => setAxis(id as Axis), options: (['x', 'y', 'h'] as const).map((k) => ({ id: k, label: AXIS_WORDS[k].label, blurb: AXIS_WORDS[k].blurb })) },
    },
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (aim + 60) / 120,
      onChange: (v) => setAim(Math.round(v * 120 - 60)),
      onCommit: (v) => {
        const a = Math.round(v * 120 - 60);
        setAim(a);
        setRest({ at: atRef.current, h: hRef.current, aim: a });
        setMoved(true);
      },
      format: (v) => aimWords(Math.round(v * 120 - 60)),
      formatShort: () => `${Math.abs(aim)}°${aim > 0 ? 'L' : aim < 0 ? 'R' : ''}`,
      home: 0.5,
    },
    { kind: 'options', id: 'target', label: 'TARGET', valueLabel: target?.short ?? '—', selectedId: tid, onSelect: setTid, options: scene.targets.map((t) => ({ id: t.id, label: `Measure to ${t.label}`, blurb: `The readouts measure to ${t.label}.` })) },
    { kind: 'options', id: 'start', label: 'START', valueLabel: roleKey(start.role), selectedId: startId, onSelect: pickStart, options: starts.map((q) => ({ id: q.id, label: `Start from: ${q.role} · ${q.title}`, blurb: q.start })) },
  ];
  const zoneRects = (px: number) =>
    zones
      .filter((z) => z.kinds.includes(kind))
      .map((z) => {
        const r = rectUV(z.rect);
        const on = zone?.id === z.id;
        const path = Skia.Path.Make();
        path.addRRect(Skia.RRectXY(Skia.XYWHRect(r.u0, r.v0, r.u1 - r.u0, r.v1 - r.v0), 3 * px, 3 * px));
        return (
          <Group key={z.id}>
            <Path path={path} color={BLUE} opacity={on ? 0.28 : 0.12} />
            <Path path={path} style="stroke" strokeWidth={(on ? 2.6 : 1.6) * px} color={BLUE} opacity={0.9} />
          </Group>
        );
      });
  return {
    key: 'place',
    title: 'Move the mic',
    kind: 'PLACE',
    layout: 'rack',
    rack: {
      render: (w, hh) => (
        <PlanStage w={w} h={hh} scene={scene} box={box} a11y={nowWords} labels={venueLabels(scene)} inset={micCloseUp(mic, closeUpAt(mic, box ?? scene.frame))} highlight={tid}>
          {(px, g) => (
            <>
              {arc ? <ArcArt arc={arc} px={px} out={outOfArc} /> : null}
              {zoneRects(px)}
              {target ? <PlanPath a={at} b={target.p} px={px} width={1.6} /> : null}
              <MicOnPlan g={g} m={mic} px={px} aim={false} />
              <PlanAim from={aheadOf(at, deg, (g * 0.95) / 1000)} to={{ x: at.x - Math.sin((deg * Math.PI) / 180) * Math.max(4, range * 0.6), y: at.y + Math.cos((deg * Math.PI) / 180) * Math.max(4, range * 0.6) }} px={px} />
              {refused || outOfArc ? <Circle cx={planUV(at).u} cy={planUV(at).v} r={14 * px} style="stroke" strokeWidth={3 * px} color={RED} /> : null}
            </>
          )}
        </PlanStage>
      ),
      badge: 'Blue = recommended starting points (where the mic stands) · blue line = the path to the target · amber dashed = the aim · calculated from the drawing',
      bezel: [
        { k: 'RANGE', v: fmtM1(range), flex: 1 },
        { k: 'OFF AXIS', v: Number.isFinite(offT) ? `${Math.round(offT)}°` : '—', tint: offT > 20 ? RED : undefined, flex: 0.9 },
        { k: 'HEIGHT', v: fmtM1(h), flex: 0.8 },
        { k: 'ZONE', v: refused || outOfArc ? 'REFUSED' : zone ? 'IN ZONE' : '—', tint: refused || outOfArc ? RED : zone ? GREEN : undefined, flex: 1 },
      ],
      params,
      initialParam: 'move',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${start.title} · from above`} prompt="MOVE the mic (ALONG, OUT · IN or HEIGHT) and AIM it, then let go to rest it. Rest it in two different blue starting points; TARGET chooses what the readouts measure to." />
        <NowLine text={nowWords} />
        {refused ? <Note tone="warn">{`It would stand in ${refused.label}. ${refuseWords ?? 'Never into play, keep-clear space or a route — and only on an approved place.'}`}</Note> : null}
        {outOfArc && arc ? <Note tone="warn">Outside the approved turn arc: stop tracking and hand off to a fixed mic or the ambience — never step or lean out of the operating box.</Note> : null}
        {zone ? (
          <Card>
            <Point title={`RECOMMENDED STARTING POINT · ${zone.label.toUpperCase()}`}>{`${zone.band} ${zone.tendency}`}</Point>
          </Card>
        ) : (
          <Body>{`Not at a recommended starting point. On this plan: ${zones.filter((z) => z.kinds.includes(kind)).map((z) => z.label).join('; ')}.`}</Body>
        )}
        {target && Number.isFinite(range) ? <Body>{`To ${target.label}: ${fmtRange(range)} (slant, capsule ${fmtM1(h)} to a source ${fmtM1(target.h)} up) — calculated from the drawing.`}</Body> : null}
        <Body>{`Activity: zones rested in — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
        {predicted != null && visited.size >= 2 && prediction ? <Note tone="ok">{prediction.after}</Note> : null}
      </>
    ),
  };
}

/** How the starting points work + the checks (the placement page's tail). */
export function placementLearnStep(p: PageProps, words: string, warn: string): MikingStep[] {
  return [
    {
      key: 'learn',
      title: 'How the starting points work',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>{words}</Body>
          <Note tone="warn">{warn}</Note>
        </>
      ),
    },
    checkStep(p, 'placement'),
  ];
}

/** A page's checks as a read step. */
export function checkStep(p: PageProps, page: 'meet' | 'setups' | 'microphone' | 'placement' | 'context' | 'twoMic', lead?: ReactNode): MikingStep {
  return {
    key: `check.${page}`,
    title: 'Check',
    kind: 'CHECK',
    layout: 'read',
    body: (
      <>
        {lead}
        <ScenarioList items={p.lesson.scenarios.filter((q) => q.page === page)} answers={p.answers} onAnswered={p.onAnswered} />
      </>
    ),
  };
}

/* ═════════ COVERAGE MAP ═════════ */

/** A zone to tag, with the tags that are fair for it (several may be) and why. */
export type CoverageTask = CoverageZone & { ok: readonly CoverageTag[]; why: string };

export function useCoverageStep({ scene, tasks, mics, box, onInteractive, done }: { scene: VenueScene; tasks: readonly CoverageTask[]; mics: readonly SportMic[]; box?: PlanRect; onInteractive: (id: string) => void; done: boolean }): MikingStep {
  const [tags, setTags] = useState<Record<string, CoverageTag>>(() => Object.fromEntries(tasks.map((t) => [t.id, t.tag])));
  const [zi, setZi] = useState(0);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const z = tasks[Math.min(zi, tasks.length - 1)];
  const zones: CoverageZone[] = tasks.map((t) => ({ ...t, tag: tags[t.id] }));
  const allFair = tasks.every((t) => touched.has(t.id) && t.ok.includes(tags[t.id]));
  useEffect(() => {
    if (allFair && !done) onInteractive('coverageMap');
  }, [allFair, done, onInteractive]);
  const tag = tags[z.id];
  const nearest = mics.length ? Math.min(...mics.map((m) => planRange(m.at, z.c))) : NaN;
  const labels: StaticLabel[] = tasks.map((t) => ({ id: `cz.${t.id}`, text: `${t.short} · ${COVERAGE_WORDS[tags[t.id]].short}`, short: t.short, u: planUV(t.c).u, v: planUV(t.c).v - t.r * 1000 - 700, align: 'center', tone: t.id === z.id ? 'amber' : 'muted' }));
  return {
    key: 'coverage',
    title: 'The coverage map',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={scene} box={box} a11y={`The coverage map from above. ${tasks.map((t) => `${t.label}: ${COVERAGE_WORDS[tags[t.id]].label.toLowerCase()}`).join('; ')}.`} labels={labels} show={{ targets: false }}>
          {(px, g) => (
            <>
              <CoverageArt zones={zones} px={px} active={z.id} />
              {mics.map((m) => (
                <MicOnPlan g={g} key={m.id} m={m} px={px} lobe={false} aim={false} />
              ))}
            </>
          )}
        </PlanStage>
      ),
      badge: 'Green solid = useful detail · blue dashed = ambience only · red crossed = unavailable · your judgement, after listening on a real day',
      bezel: [
        { k: 'ZONE', v: z.short, flex: 1 },
        { k: 'TAG', v: COVERAGE_WORDS[tag].short, tint: tag === 'detail' ? GREEN : tag === 'ambience' ? BLUE : RED, flex: 1.1 },
        { k: 'NEAREST MIC', v: fmtM1(nearest), flex: 1.1 },
        { k: 'FAIR', v: `${tasks.filter((t) => touched.has(t.id) && t.ok.includes(tags[t.id])).length} / ${tasks.length}`, flex: 0.8 },
      ],
      params: [
        { kind: 'options', id: 'zone', label: 'ZONE', valueLabel: z.short, selectedId: z.id, sticky: true, onSelect: (id) => setZi(Math.max(0, tasks.findIndex((t) => t.id === id))), options: tasks.map((t) => ({ id: t.id, label: t.label, blurb: `Handoff: ${t.handoff}` })) },
        {
          kind: 'action',
          id: 'tag',
          label: 'TAG IT',
          onPress: () => {
            setTags((prev) => ({ ...prev, [z.id]: nextTag(prev[z.id]) }));
            setTouched((prev) => (prev.has(z.id) ? prev : new Set([...prev, z.id])));
          },
        },
      ],
      initialParam: 'zone',
    },
    well: (
      <>
        <Landing looking={`The coverage map · ${z.label}`} prompt="Choose a ZONE and TAG IT: useful detail, ambience only, or unavailable — from what the drawing shows about distance, angle and what is in the way. Every zone gets a handoff." />
        <Card>
          <Point title={`${z.label.toUpperCase()} · ${COVERAGE_WORDS[tag].label.toUpperCase()}`}>{COVERAGE_WORDS[tag].blurb}</Point>
          <Point title="HANDOFF">{z.handoff}</Point>
          {touched.has(z.id) ? <Point title={z.ok.includes(tag) ? 'A FAIR CALL' : 'THINK AGAIN'}>{z.why}</Point> : null}
        </Card>
        {allFair ? <Note tone="ok">Every zone has a fair tag and a handoff. On a real day the tags come from listening — this map is the plan you test.</Note> : <Body>Start with a stable ambience source and one prioritized action zone; add a channel only when a tested gap justifies it.</Body>}
      </>
    ),
  };
}

/* ═════════ HEADROOM ═════════ */

export function useHeadroomStep({ onInteractive, done, prediction }: { onInteractive: (id: string) => void; done: boolean; prediction?: Prediction }): MikingStep {
  const [s, setS] = useState<ChainSettings>(START_SETTINGS);
  const [ev, setEv] = useState<EventId>('loud');
  const [predicted, setPredicted] = useState<string | null>(null);
  const [tried, setTried] = useState<ReadonlySet<EventId>>(() => new Set(['loud']));
  const good = chainGood(s);
  useEffect(() => {
    if (good && tried.size === EVENT_IDS.length && !done) onInteractive('headroomChain');
  }, [good, tried, done, onInteractive]);
  const r = readChain(s, ev);
  const D = HEADROOM_DEFAULTS;
  const words = chainWords(s, ev);
  const lane = (k: 'tx' | 'pre' | 'fader', label: string, blurb: string): DockParam => ({
    kind: 'fader',
    id: k,
    label,
    value: (s[k] - D[k].min) / (D[k].max - D[k].min),
    onChange: (v) => setS((prev) => ({ ...prev, [k]: Math.round(D[k].min + v * (D[k].max - D[k].min)) })),
    format: () => `${blurb} ${fmtDb(s[k])}`,
    formatShort: () => fmtDb(s[k]),
    level: true,
  });
  const firstOver = r.firstOver ? STAGES.find((q) => q.id === r.firstOver)! : null;
  return {
    key: 'headroom',
    title: 'Headroom, stage by stage',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <HeadroomDisplay w={w} h={h} s={s} ev={ev} a11y={`The signal chain, top to bottom. ${words}`} />,
      badge: 'An example chain, a simplified picture: each meter ends at that stage’s own limit · red = over · red hatch = clipped upstream · the event sizes are examples, not measurements',
      bezel: [
        { k: 'EVENT', v: EVENTS[ev].short, flex: 1 },
        { k: 'CONVERTER', v: fmtDbfs(r.adcDbfs), tint: r.adcDbfs > -6 ? RED : undefined, flex: 1.2 },
        { k: 'FIRST OVER', v: firstOver ? firstOver.short : 'NONE', tint: firstOver ? RED : GREEN, flex: 1.2 },
      ],
      params: [
        {
          kind: 'options',
          id: 'event',
          label: 'EVENT',
          valueLabel: EVENTS[ev].short,
          selectedId: ev,
          sticky: true,
          onSelect: (id) => {
            setEv(id as EventId);
            setTried((p) => (p.has(id as EventId) ? p : new Set([...p, id as EventId])));
          },
          options: EVENT_IDS.map((e) => ({ id: e, label: EVENTS[e].label, blurb: EVENTS[e].blurb })),
        },
        lane('tx', 'TX GAIN', 'transmitter input gain'),
        lane('pre', 'PREAMP', 'preamp gain'),
        lane('fader', 'FADER', 'output fader'),
      ],
      initialParam: 'tx',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`The chain · ${EVENTS[ev].label.toLowerCase()}`} prompt={`Find the first overloaded stage, then set the gains so the loudest safe rehearsal peak reads near ${TRIAL_DBFS} dBFS at the converter — and nothing is over for the real-event surprise either. Try every EVENT.`} />
        <NowLine text={words} />
        <Card>
          <Point title={firstOver ? `FIRST OVERLOADED · ${firstOver.label.toUpperCase()}` : 'NO STAGE IS OVER'}>{firstOver ? firstOver.blurb : `The converter reads ${fmtDbfs(r.adcDbfs)} for ${EVENTS[ev].label.toLowerCase()}.`}</Point>
        </Card>
        {s.fader !== START_SETTINGS.fader && r.firstOver && r.firstOver !== 'bus' ? <Note tone="warn">The output fader changed only the bus output. The clip happened upstream — a low output fader does not undo it, and a high-pass filter cannot repair it.</Note> : null}
        {good && tried.size === EVENT_IDS.length ? <Note tone="ok">{`The loudest safe rehearsal peak sits near ${TRIAL_DBFS} dBFS, and the surprise still has room. A suggested starting point, not a delivery standard: keep more margin when the real event is less predictable, and follow your own equipment’s manual.`}</Note> : <Body>{`Events tried: ${tried.size} of ${EVENT_IDS.length}.`}</Body>}
      </>
    ),
  };
}

/* ═════════ TWO MICS, ONE MOVING SOURCE ═════════ */

/** The comb's shape as an inset graph (20 Hz – 20 kHz, log), a simplified
 *  picture: one point source, straight paths, the two mics' 1/r levels. */
function combInset(dtMs: number, gA: number, gB: number, pol: 1 | -1): FieldInset {
  const N = 700;
  const W = 1000;
  const H = 520;
  const xOf = (f: number) => (Math.log10(f / 20) / 3) * W;
  const yOf = (db: number) => (Math.max(COMB_FLOOR_DB, Math.min(6, db)) / (6 - COMB_FLOOR_DB)) * H - (6 / (6 - COMB_FLOOR_DB)) * H;
  const path = Skia.Path.Make();
  for (let i = 0; i <= N; i++) {
    const f = 20 * Math.pow(1000, i / N);
    const y = yOf(combDb(f, dtMs, gA, gB, pol));
    if (i === 0) path.moveTo(xOf(f), y);
    else path.lineTo(xOf(f), y);
  }
  const grid = Skia.Path.Make();
  for (const f of [100, 1000, 10000]) {
    grid.moveTo(xOf(f), -H);
    grid.lineTo(xOf(f), 0);
  }
  grid.moveTo(0, yOf(0));
  grid.lineTo(W, yOf(0));
  return {
    view: 'top',
    box: { u0: -40, u1: W + 40, v0: -H - 140, v1: 120 },
    at: { x: 0.5, y: 0.02, w: 0.48, h: 0.34 },
    draw: (px) => (
      <Group>
        <Path path={grid} style="stroke" strokeWidth={1 * px} color="#5b5f69" opacity={0.7} />
        <Path path={path} style="stroke" strokeWidth={2 * px} color={AMBER} />
      </Group>
    ),
    labels: [
      { id: 'f1', text: '100 Hz', u: xOf(100), v: 70, align: 'center', tone: 'muted' },
      { id: 'f2', text: '1 kHz', u: xOf(1000), v: 70, align: 'center', tone: 'muted' },
      { id: 'f3', text: '10 kHz', u: xOf(10000), v: 70, align: 'center', tone: 'muted' },
      { id: 'tt', text: 'THE SUM', u: 20, v: -H - 90, align: 'left', tone: 'muted' },
    ],
  };
}

export function useOverlapStep({ scene, a, b, box, onInteractive, done, prediction, path, intro }: { scene: VenueScene; a: SportMic; b: SportMic; box?: PlanRect; onInteractive: (id: string) => void; done: boolean; prediction?: Prediction; path: readonly P2[]; intro: string }): MikingStep {
  const [t, setT] = useState(0);
  const [pol, setPol] = useState<1 | -1>(1);
  const [flipped, setFlipped] = useState({ a: false, b: false });
  const [walked, setWalked] = useState(false);
  const [predicted, setPredicted] = useState<string | null>(null);
  useEffect(() => {
    if (flipped.a && flipped.b && walked && !done) onInteractive('polarityVsDelay');
  }, [flipped, walked, done, onInteractive]);
  const segs = path.length - 1;
  const k = Math.max(0, Math.min(segs - 1e-9, t * segs));
  const i = Math.floor(k);
  const f = k - i;
  const src: P2 = { x: path[i].x + (path[i + 1].x - path[i].x) * f, y: path[i].y + (path[i + 1].y - path[i].y) * f };
  const hS = scene.targets[0]?.h ?? 1.5;
  const o = overlap(src, hS, a.at, a.h, b.at, b.h, pol);
  const gA = 1 / Math.max(0.5, o.dA);
  const gB = 1 / Math.max(0.5, o.dB);
  const lvl = rangeDb(o.dA, o.dB);
  const words = `The source ${fmtM1(o.dA)} from mic A and ${fmtM1(o.dB)} from mic B: B hears it ${Math.abs(o.dtMs).toFixed(1)} ms ${o.dtMs >= 0 ? 'later' : 'earlier'}; the first notch of the sum near ${o.notches[0] ? `${Math.round(o.notches[0])} Hz` : 'none'}; polarity ${pol === 1 ? 'normal' : 'flipped'}.`;
  return {
    key: 'overlap',
    title: 'Two mics, one moving source',
    kind: 'POLARITY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={scene} box={box} a11y={words} labels={[...venueLabels(scene, { marks: false }), { id: 'A', text: 'MIC A', u: planUV(a.at).u, v: planUV(a.at).v + 1300, align: 'center', tone: 'amber' }, { id: 'B', text: 'MIC B', u: planUV(b.at).u, v: planUV(b.at).v + 1300, align: 'center', tone: 'amber' }]} inset={combInset(o.dtMs, gA, gB, pol)} show={{ targets: true }}>
          {(px, g) => (
            <>
              <PlanPath a={src} b={a.at} px={px} width={2.2} />
              <PlanPath a={src} b={b.at} px={px} width={2.2} color={AMBER} />
              <MicOnPlan g={g} m={a} px={px} lobe={false} />
              <MicOnPlan g={g} m={b} px={px} lobe={false} />
              <TargetRing p={src} px={px} active />
            </>
          )}
        </PlanStage>
      ),
      badge: 'Blue = the path to mic A · amber = the path to mic B · the corner graph = their sum, a simplified picture (one point source, straight paths)',
      bezel: [
        { k: 'Δt', v: `${Math.abs(o.dtMs).toFixed(1)} ms`, flex: 1 },
        { k: '1ST NOTCH', v: o.notches[0] ? `${Math.round(o.notches[0])} Hz` : '—', flex: 1.1 },
        { k: 'B LEVEL', v: `${lvl > 0 ? '−' : '+'}${Math.abs(lvl).toFixed(1)} dB`, flex: 1 },
        { k: 'B POL', v: pol === 1 ? 'NORMAL' : 'FLIPPED', tint: pol === -1 ? AMBER : undefined, flex: 1 },
      ],
      params: [
        {
          kind: 'fader',
          id: 'walk',
          label: 'WALK',
          value: t,
          onChange: (v) => {
            setT(v);
            if (Math.abs(v - t) > 0.05 || v > 0.25) setWalked(true);
          },
          format: () => `the source ${fmtM1(o.dA)} from mic A`,
          formatShort: () => fmtM1(o.dA),
        },
        {
          kind: 'toggle',
          id: 'pol',
          label: 'B POLARITY',
          value: pol === -1,
          onToggle: () => {
            setPol((p0) => (p0 === 1 ? -1 : 1));
            setFlipped((fl) => (pol === 1 ? { ...fl, a: true } : { ...fl, b: true }));
          },
        },
      ],
      initialParam: 'walk',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking="Two mics on one source · from above" prompt={intro} />
        <NowLine text={words} />
        <Card>
          <Point title="THE DELAY">{`B hears the source ${Math.abs(o.dtMs).toFixed(1)} ms ${o.dtMs >= 0 ? 'after' : 'before'} A — from the drawing’s distances and the speed of sound. Walk the source: the delay changes, so a delay set for one point is wrong at the next.`}</Point>
          <Point title="POLARITY">{pol === 1 ? 'Normal. Flip B’s polarity and watch what changes: the notches move — the delay does not.' : 'Flipped: the notches moved, the delay stayed exactly the same. Polarity flips the sign, never the time.'}</Point>
        </Card>
        {flipped.a && flipped.b && walked ? <Note tone="ok">{`Polarity is not time alignment. With two open action mics, pick a dominant mic per zone or hand off smoothly — and check the sum in mono. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : <Body>Flip B’s polarity both ways AND walk the source.</Body>}
      </>
    ),
  };
}

/* ═════════ TRACKING AND HANDOFF ═════════ */

/** A tracked dish at its operator's place following a walking source; the
 *  dish turns only inside the arc — past it the operator stops and the mix
 *  hands off to a fixed mic (B12 L28, B13 L78–L80). */
export function useTrackStep({ scene, dish, arc, path, fixed, box, onInteractive, done }: { scene: VenueScene; dish: SportMic; arc: TurnArc; path: readonly P2[]; fixed: SportMic; box?: PlanRect; onInteractive: (id: string) => void; done: boolean }): MikingStep {
  const [t, setT] = useState(0);
  const [hand, setHand] = useState(false);
  const [seen, setSeen] = useState({ out: false, handedOut: false });
  const segs = path.length - 1;
  const k = Math.max(0, Math.min(segs - 1e-9, t * segs));
  const i = Math.floor(k);
  const f = k - i;
  const src: P2 = { x: path[i].x + (path[i + 1].x - path[i].x) * f, y: path[i].y + (path[i + 1].y - path[i].y) * f };
  const want = degOf({ x: src.x - dish.at.x, y: src.y - dish.at.y });
  const inArc = want >= arc.fromDeg - 1e-9 && want <= arc.toDeg + 1e-9;
  const aim = Math.max(arc.fromDeg, Math.min(arc.toDeg, want));
  const hS = scene.targets[0]?.h ?? 1.5;
  const range = slantRange(dish.at, dish.h, src, hS);
  const fixedRange = slantRange(fixed.at, fixed.h, src, hS);
  useEffect(() => {
    if (!inArc) setSeen((s) => ({ out: true, handedOut: s.handedOut || hand }));
  }, [inArc, hand]);
  useEffect(() => {
    if (seen.out && seen.handedOut && !done) onInteractive('handoff');
  }, [seen, done, onInteractive]);
  const onAir = hand ? 'FIXED' : 'DISH';
  const dishAt: SportMic = { ...dish, aimAt: { x: dish.at.x - Math.sin((aim * Math.PI) / 180) * 10, y: dish.at.y + Math.cos((aim * Math.PI) / 180) * 10 } };
  const fixedAt: SportMic = { ...fixed, aimAt: fixed.aimAt };
  const words = `The source ${fmtM1(range)} from the dish, ${aimWords(want)}. ${inArc ? 'Inside the turn arc: the dish follows it.' : 'Outside the turn arc: the operator stops at the edge.'} On air: the ${hand ? 'fixed mic' : 'dish'}.`;
  return {
    key: 'track',
    title: 'Track, then hand off',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanStage w={w} h={h} scene={scene} box={box} a11y={words} labels={[...venueLabels(scene, { marks: false }), { id: 'oa', text: `ON AIR · ${onAir}`, u: planUV(hand ? fixed.at : dish.at).u, v: planUV(hand ? fixed.at : dish.at).v + 1500, align: 'center', tone: 'amber' }]}>
          {(px, g) => (
            <>
              <ArcArt arc={arc} px={px} out={!inArc} />
              <PlanPath a={dish.at} b={src} px={px} width={hand ? 1.2 : 2.4} color={hand ? '#5b5f69' : BLUE} />
              {hand ? <PlanPath a={fixed.at} b={src} px={px} width={2.4} color={AMBER} /> : null}
              <MicOnPlan g={g} m={dishAt} px={px} lobe={false} />
              <MicOnPlan g={g} m={fixedAt} px={px} />
              <TargetRing p={src} px={px} active />
              {!inArc ? <Circle cx={planUV(dish.at).u} cy={planUV(dish.at).v} r={16 * px} style="stroke" strokeWidth={3 * px} color={RED} /> : null}
            </>
          )}
        </PlanStage>
      ),
      badge: 'Amber wedge = the approved turn arc · blue = the dish’s path · amber line = the fixed mic’s · calculated from the drawing',
      bezel: [
        { k: 'RANGE', v: fmtM1(hand ? fixedRange : range), flex: 1 },
        { k: 'TARGET', v: Math.round(want) === 0 ? '0°' : `${Math.abs(Math.round(want))}° ${want > 0 ? 'L' : 'R'}`, flex: 0.9 },
        { k: 'ARC', v: inArc ? 'INSIDE' : 'STOP', tint: inArc ? GREEN : RED, flex: 0.9 },
        { k: 'ON AIR', v: onAir, tint: AMBER, flex: 0.9 },
      ],
      params: [
        { kind: 'fader', id: 'walk', label: 'WALK', value: t, onChange: setT, format: () => `the source ${fmtM1(range)} from the dish, ${aimWords(want)}`, formatShort: () => fmtM1(range) },
        { kind: 'toggle', id: 'hand', label: 'HAND OFF', value: hand, onToggle: () => setHand((x) => !x) },
      ],
      initialParam: 'walk',
    },
    well: (
      <>
        <Landing looking="Tracking from the approved place · from above" prompt="WALK the source from A past C toward the near corner. The dish follows only inside the arc. When it cannot, HAND OFF to the fixed mic — the operator never steps out." />
        <NowLine text={words} />
        <Card>
          <Point title={inArc ? 'INSIDE THE ARC' : 'OUTSIDE THE ARC — STOP'}>{inArc ? 'Small, smooth turns, listening as well as looking: the dish follows the action while the operator stays in the box.' : 'The target has left the safe turn arc. Stop at the edge and hand off at the rehearsed cue — to a fixed mic or the ambience.'}</Point>
          <Point title="THE HANDOFF">{hand ? `The fixed mic is on air: ${fmtM1(fixedRange)} from the source. A smooth, modest crossfade — both open at once can double the attack.` : 'The dish is on air. Plan the handoff before the play needs it.'}</Point>
        </Card>
        {seen.out && seen.handedOut ? <Note tone="ok">You let the target go and handed off. A good angle never justifies moving into an unsafe or unapproved place — the plan, not the operator’s feet, covers the rest.</Note> : <Body>Walk the source out of the arc, and hand off there.</Body>}
      </>
    ),
  };
}

/* ═════════ small shared bits ═════════ */

export const offTarget = (m: SportMic, p: P2): number => offAxisDeg(m.at, micAimDeg(m), p);
export { footprintAt, DishPlanGlyph };

const styles = StyleSheet.create({
  role: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  title: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 20 },
  key: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});

export type { BezelItem };
