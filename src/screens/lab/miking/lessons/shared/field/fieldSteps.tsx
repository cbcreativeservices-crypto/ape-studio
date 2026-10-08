/**
 * THE FIELD FAMILY'S STEPS (Lab 6 group 2): the interactive pages the field
 * lessons (F05–F08) compose into their own pages (LessonArt.pages), beside
 * the engine's shared ones. Every step is a Rack Unit step — the display
 * above, the well between, the controls docked below, FULL SCREEN zooms the
 * whole display (owner rule D35) — and FULLY SILENT: the learner moves
 * things with a finger; nothing plays or moves by itself (D8).
 *
 *   PlanCanvas       a plan drawn FRONT-UP (frame G: the scene at the top) or
 *                    ACTION-UP (frame F: the performer at the top), with its
 *                    labels at ≥ 9 pt (StaticLabels)
 *   useBalanceStep   move the listening point: the main bed against the
 *                    events, from inverse square between drawn distances
 *   useImageStep     a stereo pair and a source: level and time differences
 *                    and where the image tends to land (stereoImage.ts)
 *   usePathStep      scrub a moving source along its path: distance, angle,
 *                    level against the closest point, ideal Doppler (path.ts)
 *   useWindStep      a mic's wind protection at three kinds of site (wind.ts)
 *   useDishStep      a dish cut through its axis, the wavelength against its
 *                    diameter (dish.ts)
 *   useDishAimStep   aiming a dish: the beam per pitch band (illustrative)
 *
 * Numbers on screen come only from the models (the calculator's speed of
 * sound, inverse square, the textbook patterns); each display says once
 * that it is a simplified picture.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { DockParam } from '../../../../rack/rackTypes';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import type { MicPose, PatternId, Prediction, Vec3 } from '../../../engine/model/types.ts';
import type { ViewXform } from '../../../engine/geometry/frame.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { aimVec } from '../../../engine/geometry/vec.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard } from '../../../engine/kit';
import { gain } from '../../../engine/physics/polar.ts';
import { combDb } from '../../../engine/physics/twoMic.ts';
import { micType } from '../../../data/micTypes';
import { ArrayRig } from '../ensemble/ArrayArt';
import { ARRAYS, arrayCapsules, type ArrayParams, type ArrayPresetId } from '../ensemble/stereoArray.ts';
import { fmtMetres } from './frameG.ts';
import { closestApproach, pairDtMs, pointAt, readMic, stripOf, tangentAt, trackedPose, type PathDef, type PathMic } from './path.ts';
import { imageOf, imageShort, imageWords, monoWords } from './stereoImage.ts';
import { EXPOSURES, FILTER_LINE, WIND_LAYERS, windVerdict, type ExposureId, type WindLayerId } from './wind.ts';
import { WindScene } from './WindArt';
import { AIM_HELP_WORDS, aimHelp, BEAM_BANDS, beamHalfDeg, DISH_IDS, DISHES, fmtHelpHz, helpBelowHz, profileZ, wavelengthMm, type DishId } from './dish.ts';
import { DishSection, DishWaves } from './DishArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const DEG = Math.PI / 180;
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const WHITE = '#e8eaee';
const RED = '#ff6b5e';

/* ── the plan canvas ─────────────────────────────────────────────────── */


export type PlanBox = { x0: number; x1: number; z0: number; z1: number };
/** frontUp: frame G — +x (toward the scene) up, +z right. actionUp: frame F —
 *  −x (toward the performer) up, the listener's right (−z) on the right. */
export type PlanOrient = 'frontUp' | 'actionUp';

export function planXf(box: PlanBox, orient: PlanOrient, w: number, h: number, pad = 6): { xf: ViewXform; map: (p: { x: number; z: number }) => { u: number; v: number }; rot: number } {
  if (orient === 'frontUp') {
    const xf = fitXform('top', { u0: box.z0, u1: box.z1, v0: -box.x1, v1: -box.x0 }, w, h, pad);
    return { xf, map: (p) => ({ u: p.z, v: -p.x }), rot: -Math.PI / 2 };
  }
  const xf = fitXform('top', { u0: -box.z1, u1: -box.z0, v0: box.x0, v1: box.x1 }, w, h, pad);
  return { xf, map: (p) => ({ u: -p.z, v: p.x }), rot: Math.PI / 2 };
}

/** A labelled plan: `children` are drawn in plan mm (u = x, v = z) and turned. */
export function PlanCanvas({ w, h, box, orient, label, labels, children, under, overlay }: { w: number; h: number; box: PlanBox; orient: PlanOrient; label: string; labels: (map: (p: { x: number; z: number }) => { u: number; v: number }) => StaticLabel[]; children: (px: number) => ReactNode; under?: ReactNode; overlay?: ReactNode }) {
  const k = useStageTextScale();
  const P = useMemo(() => planXf(box, orient, w, h), [box, orient, w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: P.xf.ox }, { translateY: P.xf.oy }, { scale: P.xf.s }, { rotate: P.rot }]}>{children(1 / P.xf.s)}</Group>
        {under}
      </Canvas>
      <StaticLabels labels={labels(P.map)} xf={P.xf} scale={k} w={w} />
      {overlay}
    </View>
  );
}

/** A mic drawn in plan at its pose (the house drawing), at least `minPx` long on screen. */
export function PlanMic({ pose, typeId, px, minPx = 20 }: { pose: MicPose; typeId: string; px: number; minPx?: number }) {
  const t = micType(typeId);
  const len = t.body.length.mm + (t.body.fore?.mm ?? 0);
  const k = Math.max(1, (minPx * px) / Math.max(1, len));
  const a = aimVec(pose.az, pose.el);
  const ang = Math.atan2(-a.z, -a.x) - Math.PI / 2;
  const cross = t.address === 'side' ? (t.body.width?.mm ?? t.body.radius.mm * 2) : t.body.radius.mm * 2;
  return (
    <Group transform={[{ translateX: pose.p.x }, { translateY: pose.p.z }, { rotate: ang }, { scale: k }]}>
      <MikingMicArt art={t.art} r={t.body.radius.mm} len={t.body.length.mm} cross={cross} fore={t.body.fore?.mm ?? 0} />
    </Group>
  );
}

/** The listening point: a small tripod's feet and a ring a few pixels wide. */
export function ListenMark({ p, px, color = AMBER }: { p: { x: number; z: number }; px: number; color?: string }) {
  const legs = useMemo(() => {
    const q = make();
    for (const a of [90, 210, 330]) {
      q.moveTo(p.x, p.z);
      q.lineTo(p.x + Math.cos(a * DEG) * 380, p.z + Math.sin(a * DEG) * 380);
    }
    return q;
  }, [p.x, p.z]);
  return (
    <Group>
      <Path path={legs} style="stroke" strokeWidth={Math.max(30, 2 * px)} strokeCap="round" color="#c9ccd2" />
      <Circle cx={p.x} cy={p.z} r={11 * px} style="stroke" strokeWidth={2.4 * px} color={color} />
    </Group>
  );
}

/** A dashed sightline between two plan points. */
export function Sightline({ a, b, px, color, width = 2 }: { a: { x: number; z: number }; b: { x: number; z: number }; px: number; color: string; width?: number }) {
  const p = useMemo(() => {
    const q = make();
    q.moveTo(a.x, a.z);
    q.lineTo(b.x, b.z);
    return q;
  }, [a.x, a.z, b.x, b.z]);
  return (
    <Path path={p} style="stroke" strokeWidth={width * px} strokeCap="round" color={color} opacity={0.9}>
      <DashPathEffect intervals={[7 * px, 5 * px]} />
    </Path>
  );
}

const fmtDbSigned = (d: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} dB`;

/* ── 1 · the listening point: the bed against the events ─────────────── */

export type BalanceSpec = {
  key?: string;
  words: { title: string; badge: string; looking: string; prompt: string; mainKey: string; otherKey: string; mainWord: string; otherWord: string; note: string; after: string };
  box: PlanBox;
  /** The listening point slides along x between these (mm), at z = 0. */
  x: { min: number; max: number; start: number };
  /** The mic's height (mm). */
  h: number;
  /** The nearest point of the main (continuous) source from a listening point. */
  main: (p: Vec3) => Vec3;
  /** The events' points (the nearest of them is read). */
  others: readonly Vec3[];
  Background: () => ReactNode;
  a11y: (x: number) => string;
  prediction?: Prediction;
  onMoved?: () => void;
};

export function useBalanceStep(spec: BalanceSpec): MikingStep {
  const [x, setX] = useState(spec.x.start);
  const [moved, setMoved] = useState<{ lo: boolean; hi: boolean }>({ lo: false, hi: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const at = (xx: number): Vec3 => ({ x: xx, y: -spec.h, z: 0 });
  const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const read = (xx: number) => {
    const p = at(xx);
    const m = spec.main(p);
    const rM = dist(p, m);
    const o = spec.others.reduce((best, q) => (dist(p, q) < dist(p, best) ? q : best), spec.others[0]);
    const rO = dist(p, o);
    return { p, m, rM, o, rO };
  };
  const r0 = read(spec.x.start);
  const r = read(x);
  // How the balance moved since the start: the main bed's change minus the events'.
  const shift = -20 * Math.log10(r.rM / r0.rM) + 20 * Math.log10(r.rO / r0.rO);
  const onMoved = spec.onMoved;
  const done = moved.lo && moved.hi;
  useEffect(() => {
    if (done) onMoved?.();
  }, [done, onMoved]);
  const span = spec.x.max - spec.x.min;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'point',
      label: 'LISTEN AT',
      value: (x - spec.x.min) / span,
      home: (spec.x.start - spec.x.min) / span,
      onChange: (v) => {
        const xx = Math.round((spec.x.min + v * span) / 100) * 100;
        setX(xx);
        setMoved((m) => ({ lo: m.lo || xx <= spec.x.start - 1500, hi: m.hi || xx >= spec.x.start + 1500 }));
      },
      format: () => `${fmtMetres(Math.abs(x - spec.x.start))} ${x >= spec.x.start ? 'toward' : 'back from'} the ${spec.words.mainWord} · ${spec.words.mainWord} ${fmtMetres(r.rM)}`,
      formatShort: () => fmtMetres(r.rM),
    },
  ];
  const shiftWord = Math.abs(shift) < 0.25 ? 'AS AT THE START' : `${fmtDbSigned(Math.abs(shift))} ${shift > 0 ? spec.words.mainKey : spec.words.otherKey}`;
  return {
    key: spec.key ?? 'balance',
    title: spec.words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <PlanCanvas
          w={w}
          h={h}
          box={spec.box}
          orient="frontUp"
          label={spec.a11y(x)}
          labels={(map) => [
            { id: 'lp', text: 'LISTENING POINT', short: 'YOU', ...map({ x: x - 1600, z: 0 }), align: 'center', tone: 'amber' },
            { id: 'm', text: `${spec.words.mainKey} ${fmtMetres(r.rM)}`, short: fmtMetres(r.rM), ...map({ x: (x + r.m.x) / 2, z: (r.m.z + 0) / 2 - 1500 }), align: 'right', tone: 'blue' },
            { id: 'o', text: `${spec.words.otherKey} ${fmtMetres(r.rO)}`, short: fmtMetres(r.rO), ...map({ x: (x + r.o.x) / 2, z: r.o.z / 2 + 1400 }), align: 'left', tone: 'amber' },
          ]}
        >
          {(px) => (
            <Group>
              <spec.Background />
              <Group>
                <Sightline a={{ x, z: 0 }} b={{ x: r.m.x, z: r.m.z }} px={px} color={BLUE} width={2.4} />
                <Sightline a={{ x, z: 0 }} b={{ x: r.o.x, z: r.o.z }} px={px} color={AMBER} width={2.2} />
                {x !== spec.x.start ? <Circle cx={spec.x.start} cy={0} r={6 * px} style="stroke" strokeWidth={1.6 * px} color={WHITE} opacity={0.6} /> : null}
                <ListenMark p={{ x, z: 0 }} px={px} />
              </Group>
              </Group>
            )}
        </PlanCanvas>
      ),
      badge: spec.words.badge,
      bezel: [
        { k: spec.words.mainKey, v: fmtMetres(r.rM), flex: 1 },
        { k: spec.words.otherKey, v: fmtMetres(r.rO), flex: 1 },
        { k: 'SINCE THE START', v: shiftWord, flex: 1.6 },
      ],
      params,
      initialParam: 'point',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Note>{spec.words.note}</Note>
        {done ? <Note tone="ok">{spec.words.after}</Note> : <Note>{`Move LISTEN AT ${moved.lo ? 'toward' : moved.hi ? 'back from' : 'toward and back from'} the ${spec.words.mainWord} and watch SINCE THE START.`}</Note>}
      </>
    ),
  };
}

/* ── 2 · a stereo pair and a source: the image ─────────────────────────── */

export type ImageSource = { kind: 'arc'; range: number; h: number; limit: number } | { kind: 'path'; path: PathDef; label: (s: number) => string };
export type ImageSpec = {
  key?: string;
  words: { title: string; badge: string; looking: string; prompt: string; after: string };
  arrays: readonly ArrayPresetId[];
  /** Where the pair sits (its centre) and which way it faces (deg, frame G/F bearing). */
  place: { c: Vec3; bearing: number };
  params?: Partial<Record<ArrayPresetId, ArrayParams>>;
  source: ImageSource;
  box: PlanBox;
  orient: PlanOrient;
  Background: () => ReactNode;
  /** The source drawn at its point (plan mm). */
  Token: (p: { x: number; z: number; heading: number }) => ReactNode;
  prediction?: Prediction;
  onTried?: () => void;
  /** How far the SOURCE label sits from the source, toward the top (plan mm; default 900). */
  labelDx?: number;
  /** A one-mic option (mono) beside the pairs, for comparison. */
  mono?: { label: string };
};

const ARRAY_BLURB: Readonly<Partial<Record<ArrayPresetId, string>>> = {
  xy: 'Two cardioids together, 90° apart: the image from level alone.',
  ortf: 'Two cardioids 17 cm apart, 110° between them: level and time.',
  ab: 'Two omnis side by side: the image mostly from time.',
  ms: 'A forward cardioid and a sideways figure-8, decoded to left and right.',
};

export function useImageStep(spec: ImageSpec): MikingStep {
  const [arr, setArr] = useState<ArrayPresetId | 'mono'>(spec.arrays[0]);
  const [pos, setPos] = useState(spec.source.kind === 'arc' ? 0.5 : 0.15);
  const [sideDb, setSideDb] = useState(0);
  const [tried, setTried] = useState<ReadonlySet<string>>(() => new Set([spec.arrays[0]]));
  const [swept, setSwept] = useState<{ lo: boolean; hi: boolean }>({ lo: false, hi: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const face = 90 + spec.place.bearing;
  const caps = useMemo(() => (arr === 'mono' ? arrayCapsules('one', {}, { c: spec.place.c, face }) : arrayCapsules(arr, { ...(spec.params?.[arr] ?? {}), ...(arr === 'ms' ? { sideDb } : {}) }, { c: spec.place.c, face })), [arr, sideDb, spec.place, spec.params, face]);
  const srcP: Vec3 = useMemo(() => {
    if (spec.source.kind === 'path') return pointAt(spec.source.path, pos);
    const b = spec.place.bearing + (pos - 0.5) * 2 * spec.source.limit;
    return { x: spec.place.c.x + spec.source.range * Math.cos(b * DEG), y: -spec.source.h, z: spec.place.c.z + spec.source.range * Math.sin(b * DEG) };
  }, [spec.source, spec.place, pos]);
  const heading = spec.source.kind === 'path' ? (() => {
    const t = tangentAt(spec.source.path, pos);
    return Math.atan2(t.z, t.x) / DEG;
  })() : 0;
  const img = arr === 'mono' ? { lDb: 0, rDb: 0, levelDiffDb: 0, dtMs: 0, pos: 0, monoNotchHz: null, kind: 'mono' as const } : imageOf(caps, srcP, { sideDb });
  const bearingNow = Math.atan2(srcP.z - spec.place.c.z, srcP.x - spec.place.c.x) / DEG - spec.place.bearing;
  const allTried = tried.size >= Math.min(2, spec.arrays.length) && swept.lo && swept.hi;
  const onTried = spec.onTried;
  useEffect(() => {
    if (allTried) onTried?.();
  }, [allTried, onTried]);
  const srcWord = spec.source.kind === 'path' ? spec.source.label(pos) : `${Math.round(Math.abs(bearingNow))}° ${bearingNow > 1 ? 'RIGHT' : bearingNow < -1 ? 'LEFT' : 'AHEAD'}`;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'src',
      label: spec.source.kind === 'path' ? 'SOURCE' : 'BEARING',
      value: pos,
      home: spec.source.kind === 'arc' ? 0.5 : undefined,
      onChange: (v) => {
        const q = Math.round(v * 100) / 100;
        setPos(q);
        setSwept((s) => ({ lo: s.lo || q <= 0.2, hi: s.hi || q >= 0.8 }));
      },
      format: () => `the source ${spec.source.kind === 'path' ? spec.source.label(pos).toLowerCase() : `${Math.round(Math.abs(bearingNow))}° ${bearingNow > 1 ? 'to the right' : bearingNow < -1 ? 'to the left' : 'ahead'}`}`,
      formatShort: () => (spec.source.kind === 'path' ? `${Math.round(pos * 100)}%` : `${Math.round(bearingNow)}°`),
    },
    {
      kind: 'options',
      id: 'array',
      label: 'PAIR',
      valueLabel: arr === 'mono' ? 'MONO' : ARRAYS[arr].short,
      selectedId: arr,
      sticky: true,
      onSelect: (id) => {
        setArr(id as ArrayPresetId | 'mono');
        setTried((s) => new Set(s).add(id));
      },
      options: [...spec.arrays.map((id) => ({ id, label: ARRAYS[id].name, blurb: ARRAY_BLURB[id] ?? ARRAYS[id].what })), ...(spec.mono ? [{ id: 'mono', label: spec.mono.label, blurb: 'One mic: no left or right at all — for comparison.' }] : [])],
    },
    ...(arr === 'ms'
      ? [{ kind: 'fader' as const, id: 'width', label: 'WIDTH', value: (sideDb + 12) / 18, home: 12 / 18, onChange: (v: number) => setSideDb(Math.round(v * 18 - 12)), format: () => `the Side ${sideDb >= 0 ? '+' : '−'}${Math.abs(sideDb)} dB against the Mid, set in the matrix`, formatShort: () => `${sideDb >= 0 ? '+' : '−'}${Math.abs(sideDb)} dB` }]
      : []),
  ];
  const a11y = `Plan of the pair and the source. ${arr === 'mono' ? 'One mic.' : ARRAYS[arr].name}. The source ${srcWord.toLowerCase()}. The left channel ${img.levelDiffDb >= 0 ? 'louder' : 'quieter'} by ${Math.abs(img.levelDiffDb).toFixed(1)} decibels; the image ${imageWords(img.pos)}.`;
  return {
    key: spec.key ?? 'image',
    title: spec.words.title,
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => {
        const barH = Math.max(46, Math.min(64, h * 0.17));
        return (
          <View style={{ width: w, height: h }}>
            <PlanCanvas
              w={w}
              h={h - barH}
              box={spec.box}
              orient={spec.orient}
              label={a11y}
              labels={(map) => [{ id: 'src', text: 'SOURCE', ...map({ x: srcP.x + (spec.orient === 'frontUp' ? 1 : -1) * (spec.labelDx ?? 900), z: srcP.z }), align: 'center', tone: 'amber' }]}
            >
              {(px) => (
                <Group>
                  <spec.Background />
                  <Group>
                    {spec.source.kind === 'path' ? <PathLine path={spec.source.path} px={px} /> : null}
                    <Sightline a={{ x: spec.place.c.x, z: spec.place.c.z }} b={{ x: srcP.x, z: srcP.z }} px={px} color={AMBER} width={1.6} />
                    <Group transform={[{ translateX: spec.place.c.x }, { translateY: spec.place.c.z }, { scale: Math.max(1, (36 * px) / 400) }, { translateX: -spec.place.c.x }, { translateY: -spec.place.c.z }]}>
                      <ArrayRig spec={{ id: arr === 'mono' ? 'one' : arr, params: arr === 'ms' ? { sideDb } : spec.params?.[arr as ArrayPresetId] ?? {}, place: { c: spec.place.c, face } }} view="plan" px={px / Math.max(1, (36 * px) / 400)} lobes aims aimLen={520} />
                    </Group>
                    {spec.Token({ x: srcP.x, z: srcP.z, heading })}
                  </Group>
                  </Group>
                )}
            </PlanCanvas>
            <ImageBar w={w} h={barH} pos={img.pos} mono={arr === 'mono'} />
          </View>
        );
      },
      badge: spec.words.badge,
      bezel: [
        { k: 'SOURCE', v: srcWord.toUpperCase(), flex: 1.2 },
        { k: 'LEVEL L–R', v: arr === 'mono' ? 'MONO' : fmtDbSigned(img.levelDiffDb), flex: 1 },
        { k: 'TIME', v: img.kind === 'levelTime' ? `${Math.abs(img.dtMs).toFixed(2)} ms` : 'NONE', sub: img.kind === 'levelTime' && Math.abs(img.dtMs) > 0.005 ? (img.dtMs > 0 ? 'right later' : 'left later') : undefined, flex: 1 },
        { k: 'IMAGE', v: arr === 'mono' ? 'MONO' : imageShort(img.pos), flex: 1.1 },
      ],
      params,
      initialParam: 'src',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${spec.words.looking} · ${arr === 'mono' ? spec.mono?.label ?? 'one mic' : ARRAYS[arr].name}`} prompt={spec.words.prompt} />
        <Card>
          <Point title="IN MONO">{monoWords(img)}</Point>
        </Card>
        {allTried ? <Note tone="ok">{spec.words.after}</Note> : <Note>{`Sweep the source from one side to the other${tried.size < 2 ? ', then choose another PAIR and sweep again' : ''}.`}</Note>}
      </>
    ),
  };
}

/** The image bar under the plan: two speakers and where the source tends to land. */
function ImageBar({ w, h, pos, mono }: { w: number; h: number; pos: number; mono: boolean }) {
  const k = useStageTextScale();
  const x0 = 34;
  const x1 = w - 34;
  const cy = h * 0.42;
  const x = x0 + ((pos + 1) / 2) * (x1 - x0);
  const spk = (cx: number) => {
    const p = make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 9, cy - 13, 18, 26), 3, 3));
    return p;
  };
  const labels: StaticLabel[] = [
    { id: 'l', text: 'L', u: x0, v: h - 9, align: 'center', tone: 'muted' },
    { id: 'c', text: mono ? 'MONO · ONE CHANNEL' : 'WHERE IT TENDS TO LAND', short: mono ? 'MONO' : 'THE IMAGE', u: w / 2, v: h - 9, align: 'center', tone: 'illustrative' },
    { id: 'r', text: 'R', u: x1, v: h - 9, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={mono ? 'One mic: a mono channel, no left or right.' : `Between the two speakers, the source tends to land ${imageWords(pos)} — a simplified picture.`}>
        <Path path={(() => { const p = make(); p.moveTo(x0, cy); p.lineTo(x1, cy); return p; })()} style="stroke" strokeWidth={2} color="#3a3d44" />
        {[x0, x1].map((cx) => (
          <Group key={cx}>
            <Path path={spk(cx)}>
              <LinearGradient start={vec(cx - 9, cy - 13)} end={vec(cx + 9, cy + 13)} colors={['#4d515b', '#1d1e22']} />
            </Path>
            <Circle cx={cx} cy={cy + 4} r={5} color="#0b0b0c" />
            <Circle cx={cx} cy={cy - 6} r={2.5} color="#0b0b0c" />
          </Group>
        ))}
        {mono ? <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(w / 2 - 20, cy - 6, 40, 12), 6, 6)); return p; })()} color={WHITE} opacity={0.6} /> : <Circle cx={x} cy={cy} r={8} color={AMBER} />}
      </Canvas>
      <StaticLabels labels={labels} xf={{ view: 'top', s: 1, ox: 0, oy: 0 }} scale={k} w={w} laidOut />
    </View>
  );
}

/** A moving source's path: the line, its envelope, the start and end. */
export function PathLine({ path, px, envelope = true }: { path: PathDef; px: number; envelope?: boolean }) {
  const g = useMemo(() => {
    const line = make();
    path.points.forEach((p, i) => (i === 0 ? line.moveTo(p.x, p.z) : line.lineTo(p.x, p.z)));
    return line;
  }, [path]);
  return (
    <Group>
      {envelope ? <Path path={g} style="stroke" strokeWidth={path.envelopeHalfWidth * 2} strokeCap="butt" color={RED} opacity={0.12} /> : null}
      <Path path={g} style="stroke" strokeWidth={2.2 * px} color={WHITE} opacity={0.75}>
        <DashPathEffect intervals={[10 * px, 6 * px]} />
      </Path>
    </Group>
  );
}

/* ── 3 · the moving source: the path tool ───────────────────────────── */

export type PathMicOption = PathMic & { label: string; short: string; blurb: string; typeId: string };
export type PathSpec = {
  key?: string;
  words: { title: string; badge: string; looking: string; prompt: string; after: string; start: string; end: string };
  path: PathDef;
  mics: readonly PathMicOption[];
  speeds?: readonly { id: string; label: string; short: string; ms: number; blurb: string }[];
  box: PlanBox;
  orient: PlanOrient;
  Background: () => ReactNode;
  Token: (p: { x: number; z: number; heading: number }) => ReactNode;
  prediction?: Prediction;
  onScrubbed?: () => void;
  /** false: no pitch strip or cell (a Foley action moves too slowly to matter). */
  showPitch?: boolean;
  /** How far (mm along x) the START / END words sit from the path's ends — off the path itself. */
  endLabelDx?: number;
  /** Two separate mics (a start mic and an end mic): their Δt and its comb, read as the source moves. */
  pair?: { a: string; b: string; note: string; key?: string };
};

export function usePathStep(spec: PathSpec): MikingStep {
  const [s, setS] = useState(0.1);
  const [micId, setMicId] = useState(spec.mics[0].id);
  const [speedId, setSpeedId] = useState(spec.speeds?.[0]?.id ?? 'path');
  const [seen, setSeen] = useState<{ lo: boolean; hi: boolean }>({ lo: true, hi: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const speed = spec.speeds?.find((q) => q.id === speedId)?.ms ?? spec.path.speedMs;
  const path = useMemo(() => ({ ...spec.path, speedMs: speed }), [spec.path, speed]);
  const mic = spec.mics.find((m) => m.id === micId)!;
  const r = readMic(path, s, mic);
  const strip = useMemo(() => stripOf(path, mic, 72), [path, mic]);
  const pose = mic.tracked ? trackedPose(path, s, mic.pose.p) : mic.pose;
  const q = pointAt(path, s);
  const t = tangentAt(path, s);
  const heading = Math.atan2(t.z, t.x) / DEG;
  const sClosest = closestApproach(path, mic.pose.p).s;
  const done = seen.lo && seen.hi;
  const onScrubbed = spec.onScrubbed;
  useEffect(() => {
    if (done) onScrubbed?.();
  }, [done, onScrubbed]);
  const phase = Math.abs(s - sClosest) < 0.02 ? 'CLOSEST' : s < sClosest ? 'APPROACHING' : 'RECEDING';
  const pa = spec.pair ? spec.mics.find((m) => m.id === spec.pair!.a) : undefined;
  const pb = spec.pair ? spec.mics.find((m) => m.id === spec.pair!.b) : undefined;
  const dt = pa && pb ? pairDtMs(path, s, pa.pose.p, pb.pose.p) : null;
  const notch = dt != null && Math.abs(dt) > 0.01 ? 1000 / (2 * Math.abs(dt)) : null;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 's',
      label: 'SOURCE',
      value: s,
      onChange: (v) => {
        const x = Math.round(v * 200) / 200;
        setS(x);
        setSeen((m) => ({ lo: m.lo || x <= 0.15, hi: m.hi || x >= 0.85 }));
      },
      format: () => `${phase.toLowerCase()} · ${fmtMetres(r.r)} from the mic`,
      formatShort: () => fmtMetres(r.r),
    },
    {
      kind: 'options',
      id: 'mic',
      label: 'MIC',
      valueLabel: mic.short,
      selectedId: micId,
      sticky: true,
      onSelect: (id) => setMicId(id),
      options: spec.mics.map((m) => ({ id: m.id, label: m.label, blurb: m.blurb })),
    },
    ...(spec.speeds && spec.speeds.length > 1
      ? [{ kind: 'options' as const, id: 'speed', label: 'SPEED', valueLabel: spec.speeds.find((x) => x.id === speedId)?.short ?? '', selectedId: speedId, sticky: true, onSelect: (id: string) => setSpeedId(id), options: spec.speeds.map((x) => ({ id: x.id, label: x.label, blurb: x.blurb })) }]
      : []),
  ];
  const cents = r.cents;
  const a11y = `Plan of the path and the mic. The source is ${phase.toLowerCase()}, ${fmtMetres(r.r)} away, ${Math.round(r.thetaDeg)} degrees off the mic's axis${mic.tracked ? ' (the mic follows it)' : ''}. Level ${r.totalDb.toFixed(1)} decibels against the closest point; pitch ${cents >= 0 ? 'up' : 'down'} ${Math.abs(cents).toFixed(1)} cents in the ideal model.`;
  return {
    key: spec.key ?? 'path',
    title: spec.words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => {
        const stripH = spec.showPitch === false ? Math.max(58, Math.min(84, h * 0.2)) : Math.max(92, Math.min(150, h * 0.36));
        return (
          <View style={{ width: w, height: h }}>
            <PlanCanvas
              w={w}
              h={h - stripH}
              box={spec.box}
              orient={spec.orient}
              label={a11y}
              labels={(map) => [
                { id: 'a', text: spec.words.start, short: 'START', ...map({ x: spec.path.points[0].x + (spec.endLabelDx ?? -1400), z: spec.path.points[0].z }), align: 'left', tone: 'muted' },
                { id: 'b', text: spec.words.end, short: 'END', ...map({ x: spec.path.points[spec.path.points.length - 1].x + (spec.endLabelDx ?? -1400), z: spec.path.points[spec.path.points.length - 1].z }), align: 'right', tone: 'muted' },
              ]}
            >
              {(px) => (
                <Group>
                  <spec.Background />
                  <Group>
                    <PathLine path={path} px={px} />
                    <Sightline a={{ x: pose.p.x, z: pose.p.z }} b={{ x: q.x, z: q.z }} px={px} color={AMBER} width={1.6} />
                    {pa && pb ? [pa, pb].filter((m) => m.id !== mic.id).map((m) => <PlanMic key={m.id} pose={m.pose} typeId={m.typeId} px={px} minPx={24} />) : null}
                    <PlanMic pose={pose} typeId={mic.typeId} px={px} minPx={24} />
                    {spec.Token({ x: q.x, z: q.z, heading })}
                  </Group>
                  </Group>
                )}
            </PlanCanvas>
            <Strips w={w} h={stripH} strip={strip} s={s} sClosest={sClosest} pitch={spec.showPitch !== false} />
          </View>
        );
      },
      badge: spec.words.badge,
      bezel: [
        { k: 'DISTANCE', v: fmtMetres(r.r), flex: 1 },
        ...(dt != null ? [{ k: spec.pair?.key ?? 'Δt START–END', v: `${Math.abs(dt).toFixed(1)} ms`, flex: 1.1 }] : []),
        ...(dt == null || spec.showPitch === false ? [{ k: 'OFF AXIS', v: mic.tracked ? 'FOLLOWED' : mic.pattern === 'omni' ? 'ANY' : `${Math.round(r.thetaDeg)}°`, flex: 1 }] : []),
        { k: 'LEVEL', v: r.totalDb > -0.05 ? 'CLOSEST' : fmtDbSigned(r.totalDb), flex: 1 },
        ...(spec.showPitch === false ? [] : [{ k: 'PITCH', v: `${cents >= 0 ? '+' : '−'}${Math.abs(cents).toFixed(1)} ct`, sub: phase === 'CLOSEST' ? 'passing' : phase.toLowerCase(), flex: 1 }]),
      ],
      params,
      initialParam: 's',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${spec.words.looking} · ${mic.label}`} prompt={spec.words.prompt} />
        <Card>
          <Point title={mic.label.toUpperCase()}>{mic.blurb}</Point>
          <Body>{`Now: the source is ${phase.toLowerCase()}, ${fmtMetres(r.r)} away. Against its closest point (${fmtMetres(r.rMin)}) the level is ${fmtDbSigned(r.levelDb)} from distance${mic.pattern !== 'omni' && !mic.tracked ? ` and ${fmtDbSigned(r.patternDb)} from the pattern` : ''}.${spec.showPitch === false ? '' : ` A steady tone would arrive ${Math.abs(cents) < 0.05 ? 'at its own pitch' : `${Math.abs(cents).toFixed(1)} cents ${cents > 0 ? 'higher' : 'lower'}`}.`}`}</Body>
        </Card>
        {dt != null && spec.pair ? <Note>{`${spec.pair.note} Right now the two mics hear it ${Math.abs(dt).toFixed(1)} ms apart: summed, the first notch would sit near ${notch == null ? '—' : notch >= 1000 ? `${(notch / 1000).toFixed(1)} kHz` : `${Math.round(notch)} Hz`} — and it moves as the source moves.`}</Note> : null}
        {done ? <Note tone="ok">{spec.words.after}</Note> : <Note>Drag SOURCE the whole way, from the start to the end of the path.</Note>}
      </>
    ),
  };
}

/** The level and pitch strips under the path's plan. */
function Strips({ w, h, strip, s, sClosest, pitch = true }: { w: number; h: number; strip: { s: number; totalDb: number; cents: number }[]; s: number; sClosest: number; pitch?: boolean }) {
  const k = useStageTextScale();
  const pad = { l: 44, r: 10 };
  const rowH = (h - 8) / (pitch ? 2 : 1);
  const X = (q: number) => pad.l + q * (w - pad.l - pad.r);
  const dbMin = -30;
  const cMax = Math.max(10, Math.ceil(Math.max(...strip.map((p) => Math.abs(p.cents))) * 1.25));
  const level = make();
  const pitchP = make();
  strip.forEach((p, i) => {
    const y1 = 4 + rowH * (Math.max(dbMin, p.totalDb) / dbMin) * 0.86 + rowH * 0.07;
    const y2 = 4 + rowH + rowH / 2 - (p.cents / cMax) * rowH * 0.42;
    if (i === 0) {
      level.moveTo(X(p.s), y1);
      pitchP.moveTo(X(p.s), y2);
    } else {
      level.lineTo(X(p.s), y1);
      pitchP.lineTo(X(p.s), y2);
    }
  });
  const frame = make();
  frame.addRRect(Skia.RRectXY(Skia.XYWHRect(pad.l, 4, w - pad.l - pad.r, rowH - 3), 4, 4));
  if (pitch) frame.addRRect(Skia.RRectXY(Skia.XYWHRect(pad.l, 4 + rowH, w - pad.l - pad.r, rowH - 3), 4, 4));
  const zero = make();
  zero.moveTo(pad.l, 4 + rowH * 1.5);
  zero.lineTo(w - pad.r, 4 + rowH * 1.5);
  const now = make();
  now.moveTo(X(s), 4);
  now.lineTo(X(s), h - 4);
  const closest = make();
  closest.moveTo(X(sClosest), 4);
  closest.lineTo(X(sClosest), h - 4);
  const labels: StaticLabel[] = [
    { id: 'lv', text: 'LEVEL', u: 6, v: 4 + rowH * 0.5 + 4, align: 'left', tone: 'blue' },
    ...(pitch
      ? [
          { id: 'pt', text: 'PITCH', u: 6, v: 4 + rowH * 1.5 + 4, align: 'left' as const, tone: 'amber' as const },
          { id: 'cm', text: `±${cMax} ct`, u: w - pad.r - 4, v: 4 + rowH + 12, align: 'right' as const, tone: 'muted' as const },
        ]
      : []),
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={pitch ? `Two strips along the path: the level rises to its closest point and falls again; the pitch of a steady tone sits above its own while the source approaches and below once it recedes, up to ${cMax} cents on this scale.` : 'A strip along the path: the level rises to its closest point and falls again.'}>
        <Path path={frame} color="#101114" />
        <Path path={frame} style="stroke" strokeWidth={1} color="#2c2f36" />
        {pitch ? <Path path={zero} style="stroke" strokeWidth={1} color="#4a4e57" /> : null}
        <Path path={closest} style="stroke" strokeWidth={1} color={WHITE} opacity={0.35}>
          <DashPathEffect intervals={[4, 4]} />
        </Path>
        <Path path={level} style="stroke" strokeWidth={2.2} strokeJoin="round" color={BLUE} />
        {pitch ? <Path path={pitchP} style="stroke" strokeWidth={2.2} strokeJoin="round" color={AMBER} /> : null}
        <Path path={now} style="stroke" strokeWidth={1.6} color={WHITE} />
      </Canvas>
      <StaticLabels labels={labels} xf={{ view: 'top', s: 1, ox: 0, oy: 0 }} scale={k} w={w} laidOut />
    </View>
  );
}

/* ── 4 · wind protection ─────────────────────────────────────────────── */

export function useWindStep(spec: { key?: string; exposures?: readonly ExposureId[]; start?: ExposureId; words: { title: string; badge: string; looking: string; prompt: string; after: string; extra?: string }; onTried?: () => void; prediction?: Prediction }): MikingStep {
  const exps = spec.exposures ?? (['forest', 'open', 'plaza'] as const);
  const [exposure, setExposure] = useState<ExposureId>(spec.start ?? exps[0]);
  const [layer, setLayer] = useState<WindLayerId>('none');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const v = windVerdict(exposure, layer);
  const E = EXPOSURES.find((e) => e.id === exposure)!;
  const L = WIND_LAYERS.find((l) => l.id === layer)!;
  const done = exps.every((e) => seen.has(`${e}:enough`)) || seen.size >= 5;
  const onTried = spec.onTried;
  useEffect(() => {
    if (done) onTried?.();
  }, [done, onTried]);
  const mark = (e: ExposureId, l: WindLayerId) => setSeen((s) => new Set(s).add(`${e}:${l}`).add(windVerdict(e, l).enough ? `${e}:enough` : `${e}:try`));
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'layer',
      label: 'COVER',
      valueLabel: L.short,
      selectedId: layer,
      sticky: true,
      onSelect: (id) => {
        setLayer(id as WindLayerId);
        mark(exposure, id as WindLayerId);
      },
      options: WIND_LAYERS.map((l) => ({ id: l.id, label: l.label, blurb: l.what })),
    },
    {
      kind: 'options',
      id: 'site',
      label: 'SITE',
      valueLabel: E.short,
      selectedId: exposure,
      sticky: true,
      onSelect: (id) => {
        setExposure(id as ExposureId);
        mark(id as ExposureId, layer);
      },
      options: EXPOSURES.filter((e) => exps.includes(e.id)).map((e) => ({ id: e.id, label: e.label, blurb: e.what })),
    },
  ];
  return {
    key: spec.key ?? 'wind',
    title: spec.words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <WindScene w={w} h={h} layer={layer} exposure={exposure} accessibilityLabel={`A short shotgun, ${L.label.toLowerCase()}, ${E.label.toLowerCase()}. ${v.words}`} />,
      badge: spec.words.badge,
      bezel: [
        { k: 'SITE', v: E.short, flex: 1 },
        { k: 'COVER', v: L.short, flex: 1.2 },
        { k: 'AT THE CAPSULE', v: v.marks === 0 ? 'STILL' : v.marks === 1 ? 'SOME WIND' : 'BUFFETING', flex: 1.3 },
      ],
      params,
      initialParam: 'layer',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${spec.words.looking} · ${E.label}`} prompt={spec.words.prompt} />
        <Card>
          <Point title={L.label.toUpperCase()}>{L.what}</Point>
          <Body>{v.words}</Body>
        </Card>
        <Note>{FILTER_LINE}</Note>
        {spec.words.extra ? <Note>{spec.words.extra}</Note> : null}
        {done ? <Note tone="ok">{spec.words.after}</Note> : <Note>Add the layers one at a time with COVER, then change SITE and see what each place needs.</Note>}
      </>
    ),
  };
}

/* ── 5 · the dish and the wavelength ─────────────────────────────────── */

const PITCHES = [150, 300, 450, 600, 800, 1200, 2000, 3000, 5000, 8000] as const;

export function useDishStep(spec: { key?: string; words: { title: string; badge: string; looking: string; prompt: string; after: string }; onTried?: () => void; prediction?: Prediction }): MikingStep {
  const [dishId, setDishId] = useState<DishId>('typical');
  const [pi, setPi] = useState(6);
  const [seen, setSeen] = useState<{ lo: boolean; hi: boolean }>({ lo: false, hi: true });
  const [predicted, setPredicted] = useState<string | null>(null);
  const dish = DISHES[dishId];
  const f = PITCHES[pi];
  const lam = wavelengthMm(f);
  const below = helpBelowHz(dish.D);
  const helps = f >= below;
  const done = seen.lo && seen.hi;
  const onTried = spec.onTried;
  useEffect(() => {
    if (done) onTried?.();
  }, [done, onTried]);
  const BOX = { u0: -150, u1: 1250, v0: -470, v1: 470 };
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pitch',
      label: 'PITCH',
      value: pi / (PITCHES.length - 1),
      onChange: (v) => {
        const i = Math.round(v * (PITCHES.length - 1));
        setPi(i);
        setSeen((m) => ({ lo: m.lo || PITCHES[i] < below, hi: m.hi || PITCHES[i] >= below }));
      },
      format: () => `${f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`} · wavelength ${fmtMetres(lam)}`,
      formatShort: () => (f >= 1000 ? `${f / 1000}k` : `${f}`),
    },
    {
      kind: 'options',
      id: 'dish',
      label: 'DISH',
      valueLabel: dish.short,
      selectedId: dishId,
      sticky: true,
      onSelect: (id) => setDishId(id as DishId),
      options: DISH_IDS.map((id) => ({ id, label: DISHES[id].label, blurb: DISHES[id].note })),
    },
  ];
  const labels: StaticLabel[] = [
    { id: 'focus', text: 'FOCUS · THE CAPSULE FACES THE DISH', short: 'FOCUS', u: dish.f + 70, v: 330, align: 'left', tone: 'amber', at: { u: dish.f, v: 40 } },
    { id: 'from', text: 'FROM THE TARGET →', short: 'FROM THE TARGET', u: 1240, v: -440, align: 'right', tone: 'blue' },
    { id: 'lam', text: `WAVEFRONTS ${fmtMetres(lam).toUpperCase()} APART`, short: fmtMetres(lam).toUpperCase(), u: 1240, v: 440, align: 'right', tone: 'blue' },
    { id: 'dia', text: `DISH ${Math.round(dish.D / 10)} CM ACROSS`, short: `${Math.round(dish.D / 10)} CM`, u: -140, v: 440, align: 'left', tone: 'muted' },
  ];
  return {
    key: spec.key ?? 'dish',
    title: spec.words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <DishCanvas w={w} h={h} box={BOX} dishId={dishId} fHz={f} labels={labels} label={`A ${Math.round(dish.D / 10)} centimetre dish cut through its axis, the capsule at the focus facing the dish. Sound at ${f} hertz, its wavefronts ${Math.round(lam)} millimetres apart: ${helps ? 'shorter than the dish, so the bowl sends it to the focus' : 'longer than the dish, so it gets little help from the bowl'}.`} />,
      badge: spec.words.badge,
      bezel: [
        { k: 'DISH', v: `${Math.round(dish.D / 10)} cm`, sub: `focus ${Math.round(dish.f / 10)} cm`, flex: 1 },
        { k: 'WAVE', v: fmtMetres(lam), flex: 1 },
        { k: 'HELPS ABOVE', v: fmtHelpHz(below).replace('about ', '≈ '), flex: 1.1 },
        { k: 'THE DISH', v: helps ? 'CONCENTRATES' : 'LITTLE HELP', flex: 1.2 },
      ],
      params,
      initialParam: 'pitch',
    },
    well: (
      <>
        {spec.prediction ? <PredictCard p={spec.prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${spec.words.looking} · ${dish.label}`} prompt={spec.words.prompt} />
        <Card>
          <Point title={helps ? 'SHORTER THAN THE DISH' : 'LONGER THAN THE DISH'}>{helps ? `At ${f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`} the wavefronts are ${fmtMetres(lam)} apart — shorter than this ${Math.round(dish.D / 10)} cm dish — so the bowl gathers them to the focus: the dish concentrates the sound there. That is acoustic gain at the focus, not electrical gain.` : `At ${f} Hz the wavefronts are ${fmtMetres(lam)} apart — longer than the ${Math.round(dish.D / 10)} cm dish. The bowl gives little help: the capsule still hears the sound directly, it is just not concentrated.`}</Point>
          <Body>{`For this dish: little help below ${fmtHelpHz(below)} — the pitch whose wavelength matches its width. A bigger dish lowers that line; a smaller one raises it. It belongs to this dish, not to every dish.`}</Body>
        </Card>
        {done ? <Note tone="ok">{spec.words.after}</Note> : <Note>Move PITCH below and above the dish’s line, and watch the rays to the focus appear and go.</Note>}
      </>
    ),
  };
}

function DishCanvas({ w, h, box, dishId, fHz, labels, label }: { w: number; h: number; box: { u0: number; u1: number; v0: number; v1: number }; dishId: DishId; fHz: number; labels: StaticLabel[]; label: string }) {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 8), [box, w, h]);
  const dish = DISHES[dishId];
  const clip = useMemo(() => {
    const p = make();
    p.addRect(Skia.XYWHRect(box.u0, box.v0, box.u1 - box.u0, box.v1 - box.v0));
    return p;
  }, [box]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Group clip={clip}>
            <DishWaves dish={dish} fHz={fHz} reach={box.u1} px={1 / xf.s} />
          </Group>
          <DishSection dish={dish} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}

/* ── 6 · aiming the dish: the beam per pitch ─────────────────────────── */

export function useDishAimStep(spec: { key?: string; words: { title: string; badge: string; looking: string; prompt: string; after: string; target: string }; onTried?: () => void }): MikingStep {
  const [aim, setAim] = useState(14);
  const [seen, setSeen] = useState<{ on: boolean; off: boolean }>({ on: false, off: true });
  const dish = DISHES.typical;
  const helps = BEAM_BANDS.map((b) => ({ ...b, help: aimHelp(aim, b.hz, dish.D), half: beamHalfDeg(b.hz, dish.D) }));
  const done = seen.on && seen.off;
  const onTried = spec.onTried;
  useEffect(() => {
    if (done) onTried?.();
  }, [done, onTried]);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (aim + 30) / 60,
      home: 0.5,
      onChange: (v) => {
        const a = Math.round(v * 60 - 30);
        setAim(a);
        setSeen((m) => ({ on: m.on || Math.abs(a) <= 2, off: m.off || Math.abs(a) >= 12 }));
      },
      format: () => (aim === 0 ? `on the ${spec.words.target}` : `${Math.abs(aim)}° to the ${aim > 0 ? 'right' : 'left'} of the ${spec.words.target}`),
      formatShort: () => `${aim}°`,
    },
  ];
  const short = (h: string) => (h === 'strong' ? 'STRONG' : h === 'some' ? 'SOME' : 'LITTLE');
  return {
    key: spec.key ?? 'aim',
    title: spec.words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <BeamCanvas w={w} h={h} aimDeg={aim} label={`The dish aimed ${Math.abs(aim)} degrees ${aim >= 0 ? 'right' : 'left'} of the ${spec.words.target}. ${helps.map((b) => `${b.label.split(' · ')[0]}: ${AIM_HELP_WORDS[b.help]}`).join('. ')}.`} target={spec.words.target} />,
      badge: spec.words.badge,
      bezel: [
        { k: 'AIM', v: aim === 0 ? 'ON TARGET' : `${Math.abs(aim)}° OFF`, flex: 1.2 },
        ...helps.map((b) => ({ k: b.id.toUpperCase(), v: short(b.help), flex: 1 })),
      ],
      params,
      initialParam: 'aim',
    },
    well: (
      <>
        <Landing looking={spec.words.looking} prompt={spec.words.prompt} />
        <Card>
          {helps.map((b) => (
            <Point key={b.id} title={b.label.toUpperCase()}>
              {AIM_HELP_WORDS[b.help]}.
            </Point>
          ))}
        </Card>
        {done ? <Note tone="ok">{spec.words.after}</Note> : <Note>Bring AIM onto the target, then swing it off and watch the high band go first.</Note>}
      </>
    ),
  };
}

function BeamCanvas({ w, h, aimDeg, label, target }: { w: number; h: number; aimDeg: number; label: string; target: string }) {
  const k = useStageTextScale();
  // A schematic plan (not to scale): the dish at the bottom, the target ahead.
  const BOX = { u0: -1300, u1: 1300, v0: -2150, v1: 260 };
  const xf = useMemo(() => fitXform('top', BOX, w, h, 8), [w, h]);
  const dish = DISHES.typical;
  const wedges = BEAM_BANDS.map((b, i) => {
    const half = beamHalfDeg(b.hz, dish.D);
    const R = 1900 - i * 120;
    const p = make();
    const a0 = (-90 + aimDeg - half) * DEG;
    const a1 = (-90 + aimDeg + half) * DEG;
    p.moveTo(0, 0);
    p.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
    p.arcToOval(Skia.XYWHRect(-R, -R, 2 * R, 2 * R), (-90 + aimDeg - half), 2 * half, false);
    p.close();
    return { p, id: b.id };
  });
  const tColors = { low: '#6fa8ff', mid: '#7fe0c0', high: AMBER } as const;
  const labels: StaticLabel[] = [
    { id: 't', text: target.toUpperCase(), u: 0, v: -2050, align: 'center', tone: 'amber' },
    { id: 'lo', text: 'LOW', u: -1250, v: 200, align: 'left', tone: 'blue' },
    { id: 'mi', text: 'MIDDLE', u: 0, v: 200, align: 'center', tone: 'muted' },
    { id: 'hi', text: 'HIGH', u: 1250, v: 200, align: 'right', tone: 'amber' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {wedges.map((wg) => (
            <Group key={wg.id}>
              <Path path={wg.p} color={tColors[wg.id]} opacity={0.12} />
              <Path path={wg.p} style="stroke" strokeWidth={2 / xf.s} color={tColors[wg.id]} opacity={0.8}>
                <DashPathEffect intervals={[8 / xf.s, 6 / xf.s]} />
              </Path>
            </Group>
          ))}
          <Group transform={[{ translateY: -1800 }]}>
            <Circle cx={0} cy={0} r={95} color={AMBER} opacity={0.18} />
            <Circle cx={0} cy={0} r={95} style="stroke" strokeWidth={2 / xf.s} color={AMBER} />
          </Group>
          <Group transform={[{ rotate: ((aimDeg - 90) * Math.PI) / 180 }, { scale: 0.9 }]}>
            <DishSection dish={dish} windscreen={false} />
          </Group>
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}

/* ── the spaced pair in mono: the comb ─────────────────────────────── */

/** The ideal mono sum of two equal omnis for a time difference (dB at f). */
export function monoSumDb(fHz: number, dtMs: number): number {
  return combDb(fHz, dtMs, 1, 1, 1);
}

export { gain as patternGain, profileZ as dishProfile };
export type { PatternId };
