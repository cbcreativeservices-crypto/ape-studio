/**
 * THE STEREO-ARRAY DRAWINGS (stereoArray.ts) in frame S's three views:
 *
 *   <ArrayRig/>     an array as REAL equipment at true size, in a stage view:
 *                   its stand (a tripod base on the floor, the mast) or a
 *                   tall boom stand reaching over the podium; the stereo bar
 *                   or the tree's T-bar; every capsule as the house pencil
 *                   condenser (MikingMicArt) at its pose; outriggers on their
 *                   own stands. Optional: each capsule's pattern (white
 *                   dashed — a shape, not a range), its aim (amber dashed),
 *                   ORTF's 95° recording angle (a wedge, plan only).
 *   <ArrayDetail/>  the array head alone, at its own scale, with its EXACT
 *                   geometry labelled: spacing, angle, the recording angle,
 *                   the tree's width and forward offset and its 1.5 m rule —
 *                   the inset beside a stage-sized drawing, where a 17 cm
 *                   pair is a few pixels.
 *   rigPoints()     every point a rig occupies (for framing a view).
 *
 * Nothing floats: every capsule hangs from a bar on a stand whose base is on
 * the floor (a flown array is the venue's rigging, said in words — never
 * drawn). Static (D8).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { gain } from '../../../engine/physics/polar.ts';
import { angleBetween } from '../../../engine/geometry/vec.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { ViewXform } from '../../../engine/geometry/frame.ts';
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, DEG, mul, planDir, uv, uvDir, v3, type StageView } from './frameS.ts';
import { ARRAYS, arrayCapsules, arrayPoint, capsuleBody, includedAngle, pairSpacing, treeSpacings, type ArrayParams, type ArrayPlacement, type ArrayPresetId, type Capsule } from './stereoArray.ts';
import type { ArrayMount } from './ensembleData.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const IDEAL = '#e8eaee';
/** The drawn pencil: 104 mm long, Ø 21 (ensembleMics.ts). */
const MIC = { len: 104, r: 10.5 };
/** A side-address condenser's mount below its body centre (half its 255 mm
 *  upright length, voiceMics LDC_BODY; group 2). */
const LDC_MOUNT_DROP = 140;

/** How an array is held (ensembleData.ts): 'stand', a tall stand under the
 *  bar; 'boom', a tall stand `reach` mm BEHIND the bar (toward the hall), its
 *  boom reaching forward over the podium (the stand stays clear of the
 *  conductor). Drawing defaults. */
export type { ArrayMount };
export type RigSpec = { id: ArrayPresetId; params?: ArrayParams; place: ArrayPlacement; mount?: ArrayMount };

/** The rig's hardware points in frame S: the mast foot, the mast top, the
 *  bar's ends, and each outrigger's foot. */
export function rigHardware(spec: RigSpec, caps: readonly Capsule[]) {
  const c = spec.place.c;
  const f = planDir(spec.place.face ?? 0);
  const mount = spec.mount ?? { kind: 'stand' };
  const main = caps.filter((q) => q.id !== 'OL' && q.id !== 'OR');
  // The bar: across the main capsules' mounting points (just above them).
  const xs = main.map((q) => q.p);
  const barY = Math.min(...xs.map((p) => p.y)) - 40;
  const tree = ARRAYS[spec.id].family === 'tree';
  // group 2: a side-address large-diaphragm mic (one shared mic, or two back
  // to back) sits in a mount on top of its stand: the mast comes up under the
  // body, no bar, no clip.
  const ldc = ARRAYS[spec.id].art === 'ldc';
  if (ldc) {
    const centres = main.map((q) => add(q.p, mul(q.dir, -capsuleBody(spec.id, q.pattern).len / 2)));
    const mid = mul(centres.reduce((a, b) => add(a, b), v3(0, 0, 0)), 1 / Math.max(1, centres.length));
    const under = v3(mid.x, mid.y + LDC_MOUNT_DROP, mid.z);
    const foot = mount.kind === 'boom' ? v3(mid.x - f.x * mount.reach, 0, mid.z - f.z * mount.reach) : v3(mid.x, 0, mid.z);
    const mastTop = mount.kind === 'boom' ? v3(foot.x, under.y - 200, foot.z) : under;
    return { c, barY: under.y, centreOfBar: under, foot, mastTop, boom: mount.kind === 'boom', main, out: [], ldc: true, centres };
  }
  const centreOfBar = tree ? add(c, v3(0, barY - c.y, 0)) : v3(c.x, barY, c.z);
  const foot = mount.kind === 'boom' ? v3(c.x - f.x * mount.reach, 0, c.z - f.z * mount.reach) : v3(c.x, 0, c.z);
  const mastTop = mount.kind === 'boom' ? v3(foot.x, barY - 260, foot.z) : v3(c.x, barY + 60, c.z);
  return { c, barY, centreOfBar, foot, mastTop, boom: mount.kind === 'boom', main, out: caps.filter((q) => q.id === 'OL' || q.id === 'OR'), ldc: false, centres: [] as Vec3[] };
}

/** Every point a rig occupies (frame S): to frame a view round it. */
export function rigPoints(spec: RigSpec): Vec3[] {
  const caps = arrayCapsules(spec.id, spec.params, spec.place);
  const h = rigHardware(spec, caps);
  const pts = [h.foot, h.mastTop, ...caps.map((q) => q.p), ...h.out.map((q) => v3(q.p.x, 0, q.p.z))];
  for (const q of caps) pts.push(add(q.p, mul(q.dir, -capsuleBody(spec.id, q.pattern).len)));
  return pts;
}

function tripod(p: SkPath, view: StageView, foot: Vec3, R = 380) {
  const o = uv(view, foot);
  if (view === 'plan') {
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
      p.moveTo(o.u, o.v);
      p.lineTo(o.u + Math.cos(a) * R, o.v + Math.sin(a) * R);
    }
  } else {
    p.moveTo(o.u, o.v - 320);
    p.lineTo(o.u - R, o.v);
    p.moveTo(o.u, o.v - 320);
    p.lineTo(o.u + R * 0.85, o.v);
    p.moveTo(o.u, o.v - 320);
    p.lineTo(o.u + R * 0.15, o.v);
  }
}

/** The mic art's transform for a capsule in a view (the placement scene's rule). */
function micXf(view: StageView, q: Capsule) {
  const o = uv(view, q.p);
  const d = uvDir(view, q.dir);
  const bx = -d.u;
  const by = -d.v;
  const fore = Math.max(0.12, Math.hypot(bx, by));
  const ang = Math.atan2(by, bx) - Math.PI / 2;
  return [{ translateX: o.u }, { translateY: o.v }, { rotate: ang }, { scaleY: fore }];
}

/** A capsule's pattern slice in a view (white dashed: the shape, not a range). */
function lobePath(view: StageView, q: Capsule, R: number): SkPath {
  const p = make();
  const o = uv(view, q.p);
  for (let i = 0; i <= 72; i++) {
    const phi = (i / 72) * Math.PI * 2;
    const d = view === 'plan' ? v3(Math.cos(phi), 0, Math.sin(phi)) : view === 'front' ? v3(Math.cos(phi), Math.sin(phi), 0) : v3(0, Math.sin(phi), -Math.cos(phi));
    const g = Math.abs(gain(q.pattern, angleBetween(q.dir, d))) * R;
    const s = uvDir(view, d);
    const u = o.u + g * s.u;
    const v = o.v + g * s.v;
    if (i === 0) p.moveTo(u, v);
    else p.lineTo(u, v);
  }
  p.close();
  return p;
}

/**
 * An array in a stage view. `px` = mm per screen pixel (1 / the view's
 * scale), so strokes and dashes stay a constant screen width.
 */
export function ArrayRig({ spec, view, px, lobes = false, aims = false, wedge = false, aimLen = 2500, lit = true }: { spec: RigSpec; view: StageView; px: number; lobes?: boolean; aims?: boolean; wedge?: boolean; aimLen?: number; lit?: boolean }) {
  const caps = useMemo(() => arrayCapsules(spec.id, spec.params, spec.place), [spec]);
  const g = useMemo(() => {
    const h = rigHardware(spec, caps);
    const metal = make();
    const legs = make();
    const bar = make();
    // The main stand: tripod on the floor, mast up; a boom to the bar.
    tripod(legs, view, h.foot);
    const f0 = uv(view, h.foot);
    const t0 = uv(view, h.mastTop);
    metal.moveTo(f0.u, f0.v - (view === 'plan' ? 0 : 300));
    metal.lineTo(t0.u, t0.v);
    const bc = uv(view, h.centreOfBar);
    if (h.boom) {
      metal.moveTo(t0.u, t0.v);
      metal.lineTo(bc.u, bc.v);
    }
    // group 2: a large-diaphragm mount — a short cradle under each body (two
    // back to back share one), no bar and no clips.
    if (h.ldc) {
      for (const cc of h.centres) {
        const a = uv(view, v3(cc.x, h.barY, cc.z));
        const b = uv(view, v3(cc.x, cc.y + 120, cc.z));
        bar.moveTo(bc.u, bc.v);
        bar.lineTo(a.u, a.v);
        bar.lineTo(b.u, b.v);
      }
    }
    // The bar: across the main capsules, and for a tree the arm to the centre.
    const ends = h.ldc ? [] : h.main.filter((q) => q.id !== 'C' && q.id !== 'S').map((q) => uv(view, v3(q.p.x, h.barY, q.p.z)));
    if (ends.length >= 2) {
      bar.moveTo(ends[0].u, ends[0].v);
      bar.lineTo(ends[1].u, ends[1].v);
    }
    const C = h.ldc ? undefined : h.main.find((q) => q.id === 'C');
    if (C) {
      const cc = uv(view, v3(C.p.x, h.barY, C.p.z));
      bar.moveTo(bc.u, bc.v);
      bar.lineTo(cc.u, cc.v);
    }
    // Each capsule's clip: a short drop from the bar to the mic's tail.
    for (const q of h.ldc ? [] : h.main) {
      const top = uv(view, v3(q.p.x, h.barY, q.p.z));
      const tail = uv(view, add(q.p, mul(q.dir, -MIC.len)));
      bar.moveTo(top.u, top.v);
      bar.lineTo(tail.u, tail.v);
    }
    // Outriggers: each on its own tall stand, a short boom to the mic.
    for (const q of h.out) {
      const foot = v3(q.p.x, 0, q.p.z);
      tripod(legs, view, foot);
      const a = uv(view, foot);
      const top = uv(view, v3(q.p.x, q.p.y - 120, q.p.z));
      metal.moveTo(a.u, a.v - (view === 'plan' ? 0 : 300));
      metal.lineTo(top.u, top.v);
      const tail = uv(view, add(q.p, mul(q.dir, -MIC.len)));
      metal.moveTo(top.u, top.v);
      metal.lineTo(tail.u, tail.v);
    }
    const lobesP = caps.map((q) => lobePath(view, q, q.pattern === 'omni' ? 260 : 340));
    const aimP = make();
    for (const q of caps) {
      const a = uv(view, q.p);
      const d = uvDir(view, q.dir);
      aimP.moveTo(a.u, a.v);
      aimP.lineTo(a.u + d.u * aimLen, a.v + d.v * aimLen);
    }
    let wedgeP: SkPath | null = null;
    const ra = ARRAYS[spec.id].recordingAngle;
    if (ra && view === 'plan') {
      wedgeP = make();
      const c = uv(view, spec.place.c);
      const R = aimLen * 1.4;
      const f = planDir(spec.place.face ?? 0);
      const base = Math.atan2(f.z, f.x);
      wedgeP.moveTo(c.u, c.v);
      for (let i = 0; i <= 24; i++) {
        const a = base - (ra / 2) * DEG + (i / 24) * ra * DEG;
        wedgeP.lineTo(c.u + Math.cos(a) * R, c.v + Math.sin(a) * R);
      }
      wedgeP.close();
    }
    return { metal, legs, bar, lobesP, aimP, wedgeP };
  }, [spec, caps, view, aimLen]);
  return (
    <Group opacity={lit ? 1 : 0.55}>
      {wedge && g.wedgeP ? (
        <>
          <Path path={g.wedgeP} color={AMBER} opacity={0.1} />
          <Path path={g.wedgeP} style="stroke" strokeWidth={1.4 * px} color={AMBER} opacity={0.75}>
            <DashPathEffect intervals={[7 * px, 5 * px]} />
          </Path>
        </>
      ) : null}
      {lobes
        ? g.lobesP.map((p, i) => (
            <Group key={`lobe${i}`}>
              <Path path={p} color={IDEAL} opacity={0.06} />
              <Path path={p} style="stroke" strokeWidth={1.2 * px} color={IDEAL} opacity={0.75}>
                <DashPathEffect intervals={[4 * px, 3 * px]} />
              </Path>
            </Group>
          ))
        : null}
      {aims ? (
        <Path path={g.aimP} style="stroke" strokeWidth={1.5 * px} color={AMBER} opacity={0.85}>
          <DashPathEffect intervals={[6 * px, 4 * px]} />
        </Path>
      ) : null}
      <Path path={g.legs} style="stroke" strokeWidth={Math.max(22, 3.2 * px)} strokeCap="round" color="#0b0c0f" />
      <Path path={g.legs} style="stroke" strokeWidth={Math.max(14, 2 * px)} strokeCap="round" color="#5b5f69" />
      <Path path={g.metal} style="stroke" strokeWidth={Math.max(26, 3.4 * px)} strokeCap="round" color="#0b0c0f" />
      <Path path={g.metal} style="stroke" strokeWidth={Math.max(16, 2.2 * px)} strokeCap="round">
        <LinearGradient start={vec(-1000, -4000)} end={vec(1000, 0)} colors={['#c8ccd4', '#7d828d', '#3a3d45']} />
      </Path>
      <Path path={g.bar} style="stroke" strokeWidth={Math.max(16, 2.4 * px)} strokeCap="round" color="#16171b" />
      <Path path={g.bar} style="stroke" strokeWidth={Math.max(9, 1.4 * px)} strokeCap="round" color="#9aa0ab" />
      {caps.map((q, i) => {
        const cb = capsuleBody(spec.id, q.pattern);
        return (
          <Group key={`cap${i}`} transform={micXf(view, q)}>
            <MikingMicArt art={cb.art} r={cb.cross / 2} len={cb.len} cross={cb.cross} />
          </Group>
        );
      })}
    </Group>
  );
}

/* ═══════════════════ the ARRAY DETAIL inset ═══════════════════ */

/** The detail's words for an array (also the screen-reader summary). */
export function arrayDims(id: ArrayPresetId, params: ArrayParams = {}): string[] {
  const caps = arrayCapsules(id, params, { c: v3(0, 0, 0) });
  const d = ARRAYS[id];
  switch (d.family) {
    case 'tree': {
      const t = treeSpacings(caps);
      return [`L–R ${(t.LR / 1000).toFixed(2)} m`, `centre ${((id === 'tree' ? 1500 : 762) / 1000).toFixed(2)} m ahead`, `closest pair ${(t.min / 1000).toFixed(2)} m${t.ok ? ' (≥ 1.5 m)' : ' (under 1.5 m)'}`, 'centre fed to both sides, about 4–5 dB down'];
    }
    case 'spaced':
      return [`${Math.round(pairSpacing(caps) / 10)} cm apart (${(pairSpacing(caps) / 25.4).toFixed(1)} in)`, 'omnis, aimed at the ensemble'];
    case 'near':
      return [`${Math.round(pairSpacing(caps) / 10)} cm apart (${(pairSpacing(caps) / 25.4).toFixed(1)} in)`, `${Math.round(includedAngle(caps))}° between the axes`, ...(d.recordingAngle ? [`${d.recordingAngle}° recording angle`] : [])];
    case 'single':
      return [`one mic, ${d.pattern === 'figure8' ? 'figure-8' : d.pattern}`, 'at the singers’ mouth height'];
    default:
      return id === 'ms' ? ['Mid forward, Side across', 'L = M + S · R = M − S'] : id === 'b2b' ? ['two cardioids back to back', 'one facing each way'] : [`capsules together, ${Math.round(includedAngle(caps))}° apart`, 'one above the other'];
  }
}

/**
 * The array head at its own scale, from above (the spacings and angles are
 * horizontal) — or, for a tree, from above too (its width and forward reach).
 * Exact geometry from stereoArray.ts, labelled.
 */
export function ArrayDetail({ w, h, id, params = {}, accessibilityLabel }: { w: number; h: number; id: ArrayPresetId; params?: ArrayParams; accessibilityLabel?: string }) {
  const textScale = useStageTextScale();
  const place: ArrayPlacement = { c: v3(0, 0, 0), face: 0, tilt: 0 };
  const caps = useMemo(() => arrayCapsules(id, params, place), [id, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const d = ARRAYS[id];
  // The box: the capsules with their bodies, the angle arcs, a margin.
  const box = useMemo(() => {
    const pts = caps.flatMap((q) => [q.p, add(q.p, mul(q.dir, -MIC.len - 30)), add(q.p, mul(q.dir, d.family === 'tree' ? 500 : 260))]);
    const us = pts.map((p) => p.x);
    const vs = pts.map((p) => p.z);
    const pad = d.family === 'tree' ? 420 : 120;
    let u0 = Math.min(...us) - pad;
    let u1 = Math.max(...us) + pad;
    let v0 = Math.min(...vs) - pad;
    let v1 = Math.max(...vs) + pad;
    const aspect = w / h;
    if ((u1 - u0) / (v1 - v0) < aspect) {
      const need = (v1 - v0) * aspect;
      u0 -= (need - (u1 - u0)) / 2;
      u1 = u0 + need;
    } else {
      const need = (u1 - u0) / aspect;
      v0 -= (need - (v1 - v0)) / 2;
      v1 = v0 + need;
    }
    return { u0, u1, v0, v1 };
  }, [caps, d.family, w, h]);
  const s = Math.min(w / (box.u1 - box.u0), h / (box.v1 - box.v0));
  const xf: ViewXform = { view: 'top', s, ox: -box.u0 * s, oy: -box.v0 * s };
  const px = 1 / s;
  const g = useMemo(() => {
    const dims = make();
    const arcs = make();
    const wedge = make();
    const L = caps.find((q) => q.id === 'L' || q.id === 'M');
    const R = caps.find((q) => q.id === 'R' || q.id === 'S');
    const C = caps.find((q) => q.id === 'C');
    if (L && R && d.family !== 'coincident') {
      // The spacing dimension, behind the capsules.
      const y = Math.max(L.p.z, R.p.z) + MIC.len + (d.family === 'tree' ? 200 : 50);
      dims.moveTo(L.p.x, y);
      dims.lineTo(R.p.x, y);
      for (const x of [L.p.x, R.p.x]) {
        dims.moveTo(x, y - 18 * px);
        dims.lineTo(x, y + 18 * px);
      }
    }
    if (C && L) {
      // The forward offset: from the L–R line to the centre capsule.
      const x = L.p.x + 160;
      dims.moveTo(x, L.p.z);
      dims.lineTo(x, C.p.z);
      for (const z of [L.p.z, C.p.z]) {
        dims.moveTo(x - 18 * px, z);
        dims.lineTo(x + 18 * px, z);
      }
    }
    if (L && R && (d.family === 'near' || id === 'xy')) {
      // The included angle: an arc between the two axes at the pair's centre.
      const c = v3(0, 0, 0);
      const r = id === 'xy' ? 150 : 200;
      const aL = Math.atan2(L.dir.z, L.dir.x);
      const aR = Math.atan2(R.dir.z, R.dir.x);
      arcs.addArc(Skia.XYWHRect(c.x - r, c.z - r, 2 * r, 2 * r), (Math.min(aL, aR) * 180) / Math.PI, (Math.abs(aL - aR) * 180) / Math.PI);
      for (const q of [L, R]) {
        arcs.moveTo(c.x, c.z);
        arcs.lineTo(c.x + q.dir.x * r * 1.2, c.z + q.dir.z * r * 1.2);
      }
    }
    if (d.recordingAngle) {
      const r = 520;
      const a0 = -Math.PI / 2 - (d.recordingAngle / 2) * DEG;
      wedge.moveTo(0, 0);
      for (let i = 0; i <= 20; i++) {
        const a = a0 + (i / 20) * d.recordingAngle * DEG;
        wedge.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      wedge.close();
    }
    // The bar the capsules hang from.
    const bar = make();
    const main = caps.filter((q) => q.id !== 'OL' && q.id !== 'OR');
    if (main.length >= 2 && d.family !== 'coincident') {
      // The bar runs under the mics' tails (each mic hangs from it by its clip).
      const lr = main.filter((q) => q.id === 'L' || q.id === 'R');
      const tz = (q: Capsule) => q.p.z - q.dir.z * MIC.len;
      bar.moveTo(lr[0].p.x - lr[0].dir.x * MIC.len, tz(lr[0]));
      bar.lineTo(lr[1].p.x - lr[1].dir.x * MIC.len, tz(lr[1]));
      if (C) {
        bar.moveTo(0, tz(lr[0]));
        bar.lineTo(C.p.x, tz(C));
      }
    }
    // A coincident pair is its patterns (the capsules share a point): each
    // capsule's pickup shape, so M/S reads as a cardioid and a figure-8.
    const lobes = d.family === 'coincident' || d.family === 'single' ? caps.map((q) => lobePath('plan', q, 230)) : [];
    return { dims, arcs, wedge, bar, lobes };
  }, [caps, d, id, px]);
  const labels: StaticLabel[] = useMemo(() => {
    const out: StaticLabel[] = [];
    const L = caps.find((q) => q.id === 'L' || q.id === 'M');
    const R = caps.find((q) => q.id === 'R' || q.id === 'S');
    const C = caps.find((q) => q.id === 'C');
    const words = arrayDims(id, params);
    if (L && R && d.family !== 'coincident') out.push({ id: 'sp', text: words[0].split(' (')[0].toUpperCase(), u: 0, v: Math.max(L.p.z, R.p.z) + MIC.len + (d.family === 'tree' ? 200 : 50) + 14 * px, align: 'center', tone: 'amber' });
    if (C && L) out.push({ id: 'fw', text: `${((C.p.z - L.p.z) / -1000).toFixed(2)} M`, u: L.p.x + 220, v: (L.p.z + C.p.z) / 2, align: 'left', tone: 'amber' });
    if (d.family === 'near' || id === 'xy') out.push({ id: 'ang', text: `${Math.round(includedAngle(caps))}°`, u: 0, v: -260, align: 'center', tone: 'amber' });
    if (d.recordingAngle) out.push({ id: 'ra', text: `${d.recordingAngle}° RECORDING ANGLE`, short: `${d.recordingAngle}° REC. ANGLE`, u: 0, v: -560, align: 'center', tone: 'muted' });
    for (const q of caps) {
      const lab = d.family === 'single' ? 'MIC' : id === 'b2b' ? q.label : q.id === 'C' ? 'C' : q.id === 'M' ? 'MID' : q.id === 'S' ? 'SIDE' : q.id === 'L' ? 'L' : q.id === 'R' ? 'R' : q.id;
      // Each capsule named just past the end of its aim (coincident capsules share a point).
      const reach = d.family === 'tree' ? 300 : 160;
      const lu = q.p.x + q.dir.x * reach;
      const lv = q.p.z + q.dir.z * reach;
      if (q.id === 'OL' || q.id === 'OR') {
        // An outrigger sits at the inset's edge: its name reads inward, beside it.
        const inward = q.p.x < 0 ? 1 : -1;
        out.push({ id: `c${q.id}`, text: lab, u: q.p.x + inward * 140, v: q.p.z + 60, align: inward > 0 ? 'left' : 'right', tone: 'muted' });
        continue;
      }
      const side = q.dir.x < -0.2 ? 'right' : q.dir.x > 0.2 ? 'left' : 'center';
      out.push({ id: `c${q.id}`, text: lab, u: lu, v: lv - (side === 'center' ? 40 : 0), align: side, tone: 'muted' });
    }
    if (id === 'tree' || id === 'treeCompact') {
      const t = treeSpacings(caps);
      const Lc = caps.find((q) => q.id === 'L')!;
      const Cc = caps.find((q) => q.id === 'C')!;
      out.push({ id: 'gap', text: `L–C ${(t.LC / 1000).toFixed(2)} M`, short: `${(t.LC / 1000).toFixed(2)} M`, u: (Lc.p.x + Cc.p.x) / 2 - 60, v: (Lc.p.z + Cc.p.z) / 2, align: 'right', tone: t.ok ? 'blue' : 'muted' });
    }
    return out;
  }, [caps, d, id, params, px, box.v1]);
  const a11y = accessibilityLabel ?? `${d.name}: ${arrayDims(id, params).join('; ')}.`;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: s }]}>
          {d.recordingAngle ? (
            <>
              <Path path={g.wedge} color={AMBER} opacity={0.08} />
              <Path path={g.wedge} style="stroke" strokeWidth={1.2 * px} color={AMBER} opacity={0.6}>
                <DashPathEffect intervals={[5 * px, 4 * px]} />
              </Path>
            </>
          ) : null}
          {g.lobes.map((lp, i) => (
            <Path key={`l${i}`} path={lp} style="stroke" strokeWidth={1.2 * px} color="#ffffff" opacity={0.7}>
              <DashPathEffect intervals={[4 * px, 3 * px]} />
            </Path>
          ))}
          <Path path={g.bar} style="stroke" strokeWidth={5 * px} strokeCap="round" color="#9aa0ab" opacity={0.8} />
          <Path path={g.arcs} style="stroke" strokeWidth={1.4 * px} color={AMBER} opacity={0.85}>
            <DashPathEffect intervals={[5 * px, 3 * px]} />
          </Path>
          <Path path={g.dims} style="stroke" strokeWidth={1.6 * px} color="#ffffff" opacity={0.9} />
          {caps.map((q, i) => (
            <Group key={`d${i}`} transform={micXf('plan', q)}>
              <MikingMicArt art={capsuleBody(id, q.pattern).art} r={capsuleBody(id, q.pattern).cross / 2} len={capsuleBody(id, q.pattern).len} cross={capsuleBody(id, q.pattern).cross} />
            </Group>
          ))}
          {caps.map((q, i) => (
            <Line key={`a${i}`} p1={vec(q.p.x, q.p.z)} p2={vec(q.p.x + q.dir.x * (d.family === 'tree' ? 420 : 200), q.p.z + q.dir.z * (d.family === 'tree' ? 420 : 200))} color={AMBER} strokeWidth={1.4 * px} opacity={0.8}>
              <DashPathEffect intervals={[5 * px, 4 * px]} />
            </Line>
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export { arrayPoint };
