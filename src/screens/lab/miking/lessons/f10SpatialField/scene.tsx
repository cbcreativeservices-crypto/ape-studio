/**
 * F10 SPATIAL FIELD PICKUP — the scene (charter §2 layer 3) in frame F10
 * (geometry.ts), in the engine's two views — side (from the listener's right:
 * u = x, v = y) and top (from above: u = x, v = z) — so the same drawing is
 * the engine's "instrument" and the lesson's own pages' site. Real places and
 * objects, lit from the upper left; people are the shared figure
 * (FigureHead). Static (D8).
 *
 *   SiteArt      the square (paving, the public footpath with its kerbs, a
 *                building's wall with windows, the street singer, the walker)
 *                or the event (the stage, the performer, two PA loudspeakers
 *                on poles), the listener's point and the scene-front arrow.
 *   RigArt       a spatial rig on its stand: the binaural head, the
 *                Ambisonic mic, the Double M/S cluster, or a spaced array's
 *                capsules (stereoArray presets, frame S turned by fromS) on
 *                their bars and stands — each capsule's aim (amber) and, where
 *                its pattern is modelled, its shape (white dashed: a shape,
 *                not a range).
 */
import { useMemo, type ReactElement } from 'react';
import { DashPathEffect, Group, LinearGradient, Paint, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, Vec3, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront, figureCovers } from '../shared/players/PlayerFigure';
import { pt, type PlayerPose } from '../shared/players/playerPose.ts';
import { SINGER_SIDE, SINGER_TOP, SINGER_NECK } from '../shared/voice/voicePose.ts';
import { ARRAYS, arrayCapsules, type Capsule } from '../shared/ensemble/stereoArray.ts';
import { gain } from '../../engine/physics/polar.ts';
import { MicAt, uvOf } from '../shared/field/FieldStage';
import { along } from '../shared/field/spatial.ts';
import { EVENT, LISTENER, PA_BOXES, PLAZA, WALKER_AT, fromS, toS } from './geometry.ts';
import type { SpatialRig } from './model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const AMBER = '#ffc64d';
const IDEAL = '#e8eaee';

/* ── people ── */

/** The voice family's standing figure turned to face −x with its lips at
 *  `mouth` (frame F10): profile mirrored (facing −1), plan turned by π. */
export function facingBack(mouth: Vec3): { side: PlayerPose; top: PlayerPose } {
  const m = (p: { u: number; v: number }) => pt(mouth.x - p.u, mouth.y + p.v);
  const S = SINGER_SIDE;
  const side: PlayerPose = {
    ...S,
    facing: -1,
    head: { c: m(S.head.c), r: S.head.r },
    neck: m(S.neck),
    shoulderR: m(S.shoulderR),
    shoulderL: m(S.shoulderL),
    elbowR: m(S.elbowR),
    elbowL: m(S.elbowL),
    handR: { ...S.handR, wrist: m(S.handR.wrist), dir: Math.PI - S.handR.dir },
    handL: { ...S.handL, wrist: m(S.handL.wrist), dir: Math.PI - S.handL.dir },
    hipR: m(S.hipR),
    hipL: m(S.hipL),
    kneeR: m(S.kneeR),
    kneeL: m(S.kneeL),
    footR: m(S.footR),
    footL: m(S.footL),
    floor: mouth.y + (S.floor ?? 0),
  };
  // From above: shift the authored pose so its neck lands behind the lips, and
  // turn it to face −x (aboveTurn turns about the neck by facing − π/2).
  const T = SINGER_TOP;
  const du = mouth.x - SINGER_NECK.x - T.neck.u;
  const dv = mouth.z - T.neck.v;
  const sh = (p: { u: number; v: number }) => pt(p.u + du, p.v + dv);
  const top: PlayerPose = {
    ...T,
    facing: Math.PI,
    head: { c: sh(T.head.c), r: T.head.r },
    neck: sh(T.neck),
    shoulderR: sh(T.shoulderR),
    shoulderL: sh(T.shoulderL),
    elbowR: sh(T.elbowR),
    elbowL: sh(T.elbowL),
    handR: { ...T.handR, wrist: sh(T.handR.wrist) },
    handL: { ...T.handL, wrist: sh(T.handL.wrist) },
    hipR: sh(T.hipR),
    hipL: sh(T.hipL),
    kneeR: sh(T.kneeR),
    kneeL: sh(T.kneeL),
    footR: sh(T.footR),
    footL: sh(T.footL),
  };
  return { side, top };
}

/** A walker crossing the view (walking toward +z): face-on from the side,
 *  from above walking down the plan. Mid-stride; a drawing default. */
export function walkerPoses(at: Vec3): { side: PlayerPose; top: PlayerPose } {
  const x = at.x;
  const g = 0; // the ground
  const headV = g - 1750 + 114;
  const side: PlayerPose = {
    view: 'front',
    posture: 'standing',
    head: { c: pt(x, headV), r: 114 },
    neck: pt(x, headV + 124),
    shoulderR: pt(x - 188, headV + 150),
    shoulderL: pt(x + 188, headV + 150),
    elbowR: pt(x - 228, headV + 430),
    elbowL: pt(x + 214, headV + 420),
    handR: { wrist: pt(x - 214, headV + 690), dir: Math.PI / 2 + 0.12, kind: 'rest' },
    handL: { wrist: pt(x + 200, headV + 680), dir: Math.PI / 2 - 0.12, kind: 'rest' },
    hipR: pt(x - 108, headV + 640),
    hipL: pt(x + 108, headV + 640),
    kneeR: pt(x - 118, headV + 1110),
    kneeL: pt(x + 104, headV + 1100),
    footR: pt(x - 128, g),
    footL: pt(x + 116, g),
    floor: g,
  };
  const n = pt(x, at.z);
  const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
  const top: PlayerPose = {
    view: 'above',
    posture: 'standing',
    facing: Math.PI / 2,
    head: { c: L(0, 18), r: 114 },
    neck: n,
    shoulderR: L(176, -6),
    shoulderL: L(-176, -6),
    elbowR: L(196, -60),
    elbowL: L(-196, 50),
    handR: { wrist: L(198, -120), dir: Math.PI / 2, kind: 'rest' },
    handL: { wrist: L(-198, 110), dir: Math.PI / 2, kind: 'rest' },
    hipR: L(106, -6),
    hipL: L(-106, -6),
    kneeR: L(110, 120),
    kneeL: L(-110, -110),
    footR: L(104, 260),
    footL: L(-104, -200),
    floor: null,
  };
  return { side, top };
}

export const SINGER_POSES = facingBack(PLAZA.singerMouth);
export const PERFORMER_POSES = facingBack(EVENT.perfMouth);

function Person({ view, poses, dim = 0.92 }: { view: ViewId; poses: { side: PlayerPose; top: PlayerPose }; dim?: number }) {
  const pose = view === 'side' ? poses.side : poses.top;
  // Faded as one layer, so no part shows through another (clash sweep 2026-10-10).
  return (
    <Group layer={<Paint opacity={dim} />}>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} hands={view === 'side'} />
    </Group>
  );
}

/* ── the places ── */

function buildPlaza(view: ViewId) {
  const ground = make();
  const path = make();
  const kerbs = make();
  const pavers = make();
  const wall = make();
  const windows = make();
  if (view === 'side') {
    ground.addRect(Skia.XYWHRect(-9000, 0, 20000, 260));
    wall.addRect(Skia.XYWHRect(PLAZA.wallX - 400, -6500, 400, 6500));
    for (let y = -6000; y < -900; y += 1500) windows.addRRect(Skia.RRectXY(Skia.XYWHRect(PLAZA.wallX - 380, y, 60, 900), 10, 10));
  } else {
    ground.addRect(Skia.XYWHRect(-9000, -9000, 20000, 18000));
    for (let x = -3400; x < 9000; x += 600) {
      pavers.moveTo(x, -9000);
      pavers.lineTo(x, 9000);
    }
    for (let z = -9000; z < 9000; z += 600) {
      pavers.moveTo(-3400, z);
      pavers.lineTo(9000, z);
    }
    path.addRect(Skia.XYWHRect(PLAZA.path.x0, -9000, PLAZA.path.x1 - PLAZA.path.x0, 18000));
    kerbs.moveTo(PLAZA.path.x0, -9000);
    kerbs.lineTo(PLAZA.path.x0, 9000);
    kerbs.moveTo(PLAZA.path.x1, -9000);
    kerbs.lineTo(PLAZA.path.x1, 9000);
    wall.addRect(Skia.XYWHRect(PLAZA.wallX - 400, -9000, 400, 18000));
  }
  return { ground, path, kerbs, pavers, wall, windows };
}

function Plaza({ view }: { view: ViewId }) {
  const p = useMemo(() => buildPlaza(view), [view]);
  return (
    <Group>
      <Path path={p.ground}>
        <LinearGradient start={vec(0, view === 'side' ? 0 : -9000)} end={vec(0, view === 'side' ? 260 : 9000)} colors={view === 'side' ? ['#4a4640', '#2a2724'] : ['#2b2a28', '#242321']} />
      </Path>
      {view === 'top' ? (
        <>
          <Path path={p.pavers} style="stroke" strokeWidth={10} color="#1a1917" opacity={0.6} />
          <Path path={p.path}>
            <LinearGradient start={vec(PLAZA.path.x0, 0)} end={vec(PLAZA.path.x1, 0)} colors={['#4b4943', '#3b3934']} />
          </Path>
          <Path path={p.kerbs} style="stroke" strokeWidth={60} color="#6b675f" />
          <Path path={p.kerbs} style="stroke" strokeWidth={14} color="#8f8a80" opacity={0.6} />
        </>
      ) : null}
      <Path path={p.wall}>
        <LinearGradient start={vec(PLAZA.wallX - 400, 0)} end={vec(PLAZA.wallX, 0)} colors={['#6e5a4a', '#584637', '#3c2f25']} />
      </Path>
      <Path path={p.windows} color="#1d2836" />
      <Path path={p.windows} style="stroke" strokeWidth={12} color="#8a7b6c" opacity={0.6} />
      <Path path={p.wall} style="stroke" strokeWidth={14} color="#1e1813" />
    </Group>
  );
}

function buildEvent(view: ViewId) {
  const ground = make();
  const stage = make();
  const skirt = make();
  const poles = make();
  const cabs = make();
  const faces = make();
  const { min, max } = EVENT.stage;
  if (view === 'side') {
    ground.addRect(Skia.XYWHRect(-9000, 0, 20000, 260));
    stage.addRect(Skia.XYWHRect(min.x, min.y, max.x - min.x, max.y - min.y));
    for (let x = min.x + 300; x < max.x; x += 600) {
      skirt.moveTo(x, min.y + 60);
      skirt.lineTo(x, 0);
    }
    const b = PA_BOXES[1];
    poles.moveTo((b.min.x + b.max.x) / 2, b.max.y);
    poles.lineTo((b.min.x + b.max.x) / 2, 0);
    cabs.addRRect(Skia.RRectXY(Skia.XYWHRect(b.min.x, b.min.y, b.max.x - b.min.x, b.max.y - b.min.y), 30, 30));
    faces.addRect(Skia.XYWHRect(b.min.x - 20, b.min.y + 40, 40, b.max.y - b.min.y - 80));
  } else {
    ground.addRect(Skia.XYWHRect(-9000, -9000, 20000, 18000));
    stage.addRect(Skia.XYWHRect(min.x, min.z, max.x - min.x, max.z - min.z));
    for (let z = min.z + 500; z < max.z; z += 500) {
      skirt.moveTo(min.x, z);
      skirt.lineTo(max.x, z);
    }
    for (const b of PA_BOXES) {
      cabs.addRRect(Skia.RRectXY(Skia.XYWHRect(b.min.x, b.min.z, b.max.x - b.min.x, b.max.z - b.min.z), 40, 40));
      faces.addRect(Skia.XYWHRect(b.min.x - 20, b.min.z + 40, 40, b.max.z - b.min.z - 80));
    }
  }
  return { ground, stage, skirt, poles, cabs, faces };
}

function Event({ view }: { view: ViewId }) {
  const p = useMemo(() => buildEvent(view), [view]);
  const { min, max } = EVENT.stage;
  return (
    <Group>
      <Path path={p.ground}>
        <LinearGradient start={vec(0, view === 'side' ? 0 : -9000)} end={vec(0, view === 'side' ? 260 : 9000)} colors={view === 'side' ? ['#3a4a32', '#22301e'] : ['#24301f', '#1d271a']} />
      </Path>
      <Path path={p.stage}>
        <LinearGradient start={vec(min.x, view === 'side' ? min.y : min.z)} end={vec(max.x, view === 'side' ? max.y : max.z)} colors={['#5a4a3c', '#3e3228', '#251d16']} />
      </Path>
      <Path path={p.skirt} style="stroke" strokeWidth={14} color="#140f0b" opacity={0.7} />
      <Path path={p.stage} style="stroke" strokeWidth={16} color="#0d0a07" />
      <Path path={p.poles} style="stroke" strokeWidth={60} strokeCap="round" color="#0b0c0f" />
      <Path path={p.poles} style="stroke" strokeWidth={40} strokeCap="round" color="#4d515b" />
      <Path path={p.cabs}>
        <LinearGradient start={vec(PA_BOXES[0].min.x, 0)} end={vec(PA_BOXES[0].max.x, 0)} colors={['#3a3d45', '#1d1e23', '#0b0c0e']} />
      </Path>
      <Path path={p.faces} color="#121317" />
      <Path path={p.faces} style="stroke" strokeWidth={10} color="#6c717b" opacity={0.6} />
      <Path path={p.cabs} style="stroke" strokeWidth={14} color="#050506" />
    </Group>
  );
}

/** The listener's point: a dashed upright from the ground (side), a ring
 *  and the scene-front arrow (top). */
function ListenerMark({ view, h = -LISTENER.y }: { view: ViewId; h?: number }) {
  const p = useMemo(() => {
    const line = make();
    const arrow = make();
    if (view === 'side') {
      line.moveTo(0, 0);
      line.lineTo(0, -h);
    } else {
      line.addCircle(0, 0, 420);
      arrow.moveTo(500, 0);
      arrow.lineTo(1500, 0);
      arrow.moveTo(1360, -110);
      arrow.lineTo(1500, 0);
      arrow.lineTo(1360, 110);
    }
    return { line, arrow };
  }, [view, h]);
  return (
    <Group>
      <Path path={p.line} style="stroke" strokeWidth={22} color={AMBER} opacity={0.7}>
        <DashPathEffect intervals={[70, 50]} />
      </Path>
      {view === 'top' ? <Path path={p.arrow} style="stroke" strokeWidth={34} strokeCap="round" strokeJoin="round" color={AMBER} opacity={0.85} /> : null}
    </Group>
  );
}

/** The whole scene (behind the rigs). `walkerT`: the walker's place along
 *  the footpath (0 … 1). `listener`: draw the listener's mark. */
export function SiteArt({ view, variant, walkerT = WALKER_AT, listener = true }: { view: ViewId; variant: VariantId; walkerT?: number; listener?: boolean }): ReactElement {
  const w = along(PLAZA.walk.a, PLAZA.walk.b, walkerT);
  const walker = useMemo(() => walkerPoses(v3(w.x, 0, w.z)), [w.x, w.z]);
  return (
    <Group>
      {variant === 'event' ? <Event view={view} /> : <Plaza view={view} />}
      {listener ? <ListenerMark view={view} /> : null}
      {variant === 'event' ? <Person view={view} poses={PERFORMER_POSES} /> : <Person view={view} poses={SINGER_POSES} />}
      {variant === 'plaza' ? <Person view={view} poses={walker} dim={0.8} /> : null}
    </Group>
  );
}

/** The engine's instrument for F10 (the scene, no rig). */
export function SpatialInstrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  // From the side the engine draws the stand and the height itself.
  return <SiteArt view={view} variant={variant} listener={view === 'top'} />;
}

/* ── the rigs ── */

/** A rig's capsules in frame F10 (stereoArray's frame S turned by fromS). */
export function rigCapsules(r: SpatialRig): Capsule[] {
  const caps = arrayCapsules(r.id, r.params ?? {}, { c: toS(r.c), face: r.face ?? 0, tilt: 0 });
  return caps.map((q) => ({ ...q, p: fromS(q.p), dir: fromS(q.dir) }));
}

/** A capsule's pattern as a plan outline (a shape, not a range). */
function lobe(view: ViewId, q: Capsule, R: number): SkPath {
  const p = make();
  const o = uvOf(view, q.p);
  const d = uvOf(view, q.dir);
  const dl = Math.hypot(d.u, d.v);
  if (dl < 0.2) return p;
  for (let i = 0; i <= 72; i++) {
    const phi = (i / 72) * Math.PI * 2;
    const a = Math.acos(Math.max(-1, Math.min(1, (Math.cos(phi) * d.u + Math.sin(phi) * d.v) / dl))) * (180 / Math.PI);
    const g = Math.abs(gain(q.pattern, a)) * R;
    const u = o.u + g * Math.cos(phi);
    const v = o.v + g * Math.sin(phi);
    if (i === 0) p.moveTo(u, v);
    else p.lineTo(u, v);
  }
  p.close();
  return p;
}

/** One rig on its stand(s), its capsules' aims and (opt.) pattern shapes. */
export function RigArt({ view, rig, px, lobes = true }: { view: ViewId; rig: SpatialRig; px: number; lobes?: boolean }) {
  const caps = useMemo(() => rigCapsules(rig), [rig]);
  const def = ARRAYS[rig.id];
  const c = rig.c;
  const front = v3(Math.cos(((rig.face ?? 0) * Math.PI) / 180), 0, Math.sin(((rig.face ?? 0) * Math.PI) / 180));
  const hw = useMemo(() => {
    const stands = make();
    const bars = make();
    const own = def.family === 'surround' && rig.id === 'hamasaki';
    if (own) {
      // A wide square: four stands, one under each capsule.
      for (const q of caps) {
        const o = uvOf(view, q.p);
        if (view === 'side') {
          stands.moveTo(o.u, o.v + 30);
          stands.lineTo(o.u, 0);
        } else stands.addCircle(o.u, o.v, 26);
      }
    } else {
      const o = uvOf(view, c);
      if (view === 'side') {
        stands.moveTo(o.u, o.v + (def.family === 'binaural' ? 90 : 40));
        stands.lineTo(o.u, 0);
        // A tripod's feet.
        stands.moveTo(o.u, -300);
        stands.lineTo(o.u - 320, 0);
        stands.moveTo(o.u, -300);
        stands.lineTo(o.u + 280, 0);
      } else stands.addCircle(o.u, o.v, 22);
      // Arms from the centre to each spaced capsule (a star bar).
      if (def.family === 'surround' || rig.id === 'ortf') {
        for (const q of caps) {
          const a = uvOf(view, q.p);
          bars.moveTo(o.u, o.v);
          bars.lineTo(a.u, a.v);
        }
      }
    }
    return { stands, bars };
  }, [view, caps, c, def.family, rig.id]);
  const lobePaths = useMemo(() => (lobes && view === 'top' && def.family !== 'binaural' && def.family !== 'ambisonic' ? caps.map((q) => lobe(view, q, def.family === 'surround' ? 260 : 200)) : []), [lobes, view, caps, def.family]);
  const special = def.family === 'binaural' ? 'dummyHead' : def.family === 'ambisonic' ? 'ambiTetra' : rig.id === 'dms' ? 'dmsCluster' : null;
  return (
    <Group>
      <Path path={hw.stands} style="stroke" strokeWidth={view === 'side' ? 20 : 4 * px} strokeCap="round" color="#0b0c0f" />
      <Path path={hw.stands} style="stroke" strokeWidth={view === 'side' ? 13 : 2.4 * px} strokeCap="round" color="#5b5f69" />
      <Path path={hw.bars} style="stroke" strokeWidth={14} strokeCap="round" color="#0b0c0f" />
      <Path path={hw.bars} style="stroke" strokeWidth={8} strokeCap="round" color="#7c808a" />
      {lobePaths.map((lp, i) => (
        <Group key={`l${i}`}>
          <Path path={lp} color={IDEAL} opacity={0.05} />
          <Path path={lp} style="stroke" strokeWidth={1.6 * px} color={IDEAL} opacity={0.6}>
            <DashPathEffect intervals={[6 * px, 5 * px]} />
          </Path>
        </Group>
      ))}
      {special ? (
        <MicAt view={view} p={v3(c.x + front.x * (special === 'dummyHead' ? 95 : 25), c.y, c.z + front.z * (special === 'dummyHead' ? 95 : 25))} aim={front} art={special} r={special === 'dummyHead' ? 95 : 25} len={special === 'dummyHead' ? 95 : 25} cross={view === 'side' ? (special === 'dummyHead' ? 330 : special === 'ambiTetra' ? 260 : 220) : undefined} />
      ) : (
        caps.map((q) => (
          <MicAt key={q.id} view={view} p={q.p} aim={q.dir} art={q.pattern === 'figure8' ? 'sideLdc' : 'sdc'} r={q.pattern === 'figure8' ? 25 : 10.5} len={q.pattern === 'figure8' ? 50 : 104} cross={q.pattern === 'figure8' && view === 'side' ? 104 : undefined} />
        ))
      )}
      {/* Each capsule's aim (amber, short). */}
      {(special ? [{ p: v3(c.x, c.y, c.z), dir: front }] : caps).map((q, i) => {
        const a = uvOf(view, q.p);
        const d = uvOf(view, q.dir);
        const L = def.family === 'surround' ? 360 : 240;
        const path = Skia.Path.Make();
        path.moveTo(a.u, a.v);
        path.lineTo(a.u + d.u * L, a.v + d.v * L);
        return (
          <Path key={`a${i}`} path={path} style="stroke" strokeWidth={2 * px} color={AMBER} opacity={0.9}>
            <DashPathEffect intervals={[8 * px, 6 * px]} />
          </Path>
        );
      })}
    </Group>
  );
}

/* ── the engine's labels, hit test and figures ── */

export function spatialLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const out: ArtLabel[] = [];
  const lis = view === 'side' ? { u: 0, v: -1700 } : { u: 0, v: 0 };
  out.push({ id: 'sp.listener', text: 'LISTENER’S POINT', short: 'LISTENER', u: lis.u + 200, v: view === 'side' ? -2350 : -700, align: 'left', at: lis });
  if (view === 'top') out.push({ id: 'front', text: 'SCENE FRONT', short: 'FRONT', u: 1600, v: 260, align: 'left', tone: 'muted' });
  if (variant === 'plaza') {
    const s = PLAZA.singerMouth;
    out.push({ id: 'sp.singer', text: 'STREET SINGER', short: 'SINGER', u: s.x, v: view === 'side' ? -2300 : -700, align: 'center', at: { u: s.x + 60, v: view === 'side' ? s.y - 60 : 0 } });
    out.push({ id: 'sp.walker', text: 'WALKER', u: 2900, v: view === 'side' ? -2200 : -2700, align: 'center', at: { u: 2900, v: view === 'side' ? -1600 : -1750 } });
    if (view === 'top') out.push({ id: 'sp.path', text: 'PUBLIC FOOTPATH', short: 'PATH', u: 2900, v: 2700, align: 'center', tone: 'muted' });
    out.push({ id: 'sp.wall', text: 'WALL', u: PLAZA.wallX + 200, v: view === 'side' ? -2600 : 2700, align: 'left', tone: 'muted' });
  } else {
    const s = EVENT.perfMouth;
    out.push({ id: 'sp.performer', text: 'PERFORMER', u: s.x, v: view === 'side' ? -3000 : -700, align: 'center', at: { u: s.x + 60, v: view === 'side' ? s.y - 60 : 0 } });
    out.push({ id: 'sp.pa', text: 'PA', u: EVENT.pa[0].x - 500, v: view === 'side' ? -3300 : EVENT.pa[0].z, align: 'right', at: { u: EVENT.pa[0].x - 230, v: view === 'side' ? EVENT.pa[0].y : EVENT.pa[0].z } });
    out.push({ id: 'sp.stage', text: 'STAGE', u: 7800, v: view === 'side' ? -300 : 3000, align: 'center', tone: 'muted' });
  }
  return out;
}

export function spatialHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  if (Math.hypot(u - 0, v - (view === 'side' ? -1700 : 0)) <= 260 + tol) return 'sp.listener';
  if (variant === 'plaza') {
    if (figureCovers(view === 'side' ? SINGER_POSES.side : SINGER_POSES.top, u, v, tol)) return 'sp.singer';
    const w = along(PLAZA.walk.a, PLAZA.walk.b, WALKER_AT);
    if (figureCovers(view === 'side' ? walkerPoses(v3(w.x, 0, w.z)).side : walkerPoses(v3(w.x, 0, w.z)).top, u, v, tol)) return 'sp.walker';
    if (u <= PLAZA.wallX + tol && u >= PLAZA.wallX - 400 - tol) return 'sp.wall';
  } else {
    if (figureCovers(view === 'side' ? PERFORMER_POSES.side : PERFORMER_POSES.top, u, v, tol)) return 'sp.performer';
    for (const b of PA_BOXES) if (u >= b.min.x - tol && u <= b.max.x + tol && v >= (view === 'side' ? b.min.y : b.min.z) - tol && v <= (view === 'side' ? b.max.y : b.max.z) + tol) return 'sp.pa';
    if (u >= EVENT.stage.min.x - tol && u <= EVENT.stage.max.x + tol && (view === 'top' || v >= EVENT.stage.min.y - tol)) return 'sp.stage';
  }
  return null;
}

export function spatialFigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  const P = variant === 'event' ? PERFORMER_POSES : SINGER_POSES;
  return figureCovers(view === 'side' ? P.side : P.top, u, v, tol);
}
