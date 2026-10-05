/**
 * COLLISION (blueprint §4.4). The model compiles once per variant into a flat
 * list of solids (plain data the worklets capture); the mic ASSEMBLY — body,
 * boom, stand — is a set of capsules sampled against every solid's SDF.
 *
 * HONESTY: no source gives a clearance number (plan line 29). Every clearance,
 * the boom routing and the stand are ILLUSTRATIVE (ruling §16.4) — the scene
 * badges them, and the owner approves the values on the phone.
 *
 * The mic's reference point `pose.p` is its FRONT (the grille front; the
 * element end of a boundary plate) — not its acoustic centre (lesson L39).
 *
 * BOOM ROUTING (illustrative): a stand mic whose tail is inside the drum is
 * held by a boom that leaves through the PORT (it runs from the tail through
 * the port centre and on past the head); outside, the boom runs straight back
 * behind the mic. The stand drops from the boom's far end to the floor. So an
 * intact head makes every stand-mounted inside position impossible — the boom
 * cannot get out — with no special case.
 */
import type { CompiledScene, InstrumentModel, Interior, MicBody, MicPose, Rim, Solid, Vec3, VariantId } from '../model/types.ts';
import { aimVec, add, clamp, len, norm, scale, sub } from './vec.ts';
import { cylCoords, sdf } from './sdf.ts';

/** Illustrative mount geometry (mm). */
export const BOOM_RADIUS = 8;
export const BOOM_OUTSIDE = 200;
export const BOOM_BEHIND = 250;
export const STAND_RADIUS = 10;
/** How far a rim clamp's arm reaches from the hoop to the mic's tail (mm).
 *  ILLUSTRATIVE: no source gives a clamp's reach. */
export const CLIP_REACH = 120;

export function compileScene(model: InstrumentModel, variant: VariantId): CompiledScene {
  const solids: Solid[] = [];
  for (const part of model.parts) {
    if (!part.solid) continue;
    if (part.variants && !part.variants.includes(variant)) continue;
    solids.push({ partId: part.id, label: part.label, shape: part.solid, clearance: part.clearance?.mm ?? 0 });
  }
  for (const e of model.envelopes) {
    if (e.variants && !e.variants.includes(variant)) continue;
    solids.push({ partId: e.id, label: e.label, shape: e.shape, clearance: e.clearance ?? 0 });
  }
  // A variant may stand the instrument at another height above the floor (a
  // violinist standing or seated): its own floor line (added 2026-10-05).
  const yFloor = model.yFloorByVariant?.[variant] ?? model.yFloor.mm;
  solids.push({ partId: 'floor', label: 'floor', shape: { kind: 'floor', y: yFloor }, clearance: 0 });
  return {
    variant,
    solids,
    port: model.ports[variant] ?? null,
    interior: model.interior,
    interiors: model.interiors ?? [],
    rims: (model.rims ?? []).filter((r) => !r.variants || r.variants.includes(variant)),
    yFloor,
    boom: { radius: BOOM_RADIUS, outside: BOOM_OUTSIDE, behind: BOOM_BEHIND },
    standRadius: STAND_RADIUS,
  };
}

/** Inside the instrument's interior (between the heads, inside the shell). */
function inInterior(it: Interior, p: Vec3): boolean {
  'worklet';
  const q = cylCoords(it.c, it.axis, p);
  return q.along > it.x0 && q.along < it.x1 && q.radial < it.rIn;
}

export function isInside(scene: CompiledScene, p: Vec3): boolean {
  'worklet';
  if (inInterior(scene.interior, p)) return true;
  const more = scene.interiors ?? [];
  for (let i = 0; i < more.length; i++) if (inInterior(more[i], p)) return true;
  return false;
}

/** The nearest point on a rim circle to p (the clamp's grip), and its distance. */
export function nearestRimPoint(rims: Rim[], p: Vec3): { q: Vec3; d: number; rim: Rim } | null {
  'worklet';
  let best: { q: Vec3; d: number; rim: Rim } | null = null;
  for (let i = 0; i < rims.length; i++) {
    const rim = rims[i];
    const a = rim.axis;
    const wx = p.x - rim.c.x;
    const wy = p.y - rim.c.y;
    const wz = p.z - rim.c.z;
    const t = wx * a.x + wy * a.y + wz * a.z;
    // The point's direction in the rim's plane (any, if it is on the axis).
    let rx = wx - a.x * t;
    let ry = wy - a.y * t;
    let rz = wz - a.z * t;
    let rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
    if (rl < 1e-9) {
      rx = Math.abs(a.x) < 0.9 ? 1 : 0;
      ry = 0;
      rz = Math.abs(a.x) < 0.9 ? 0 : 1;
      rl = 1;
    }
    const q = { x: rim.c.x + (rx / rl) * rim.r, y: rim.c.y + (ry / rl) * rim.r, z: rim.c.z + (rz / rl) * rim.r };
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    const dz = p.z - q.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!best || d < best.d) best = { q, d, rim };
  }
  return best;
}

export type Seg = { a: Vec3; b: Vec3; r: number; piece: 'body' | 'boom' | 'stand' | 'arm' };

/** The capsules that make up a mic on its mount at `pose`. */
export function assembly(scene: CompiledScene, pose: MicPose, body: MicBody): Seg[] {
  'worklet';
  const p = pose.p;
  const L = body.length;
  const r = body.radius;
  if (body.mount === 'surface') {
    // A plate lying flat, element end at p, extending back along the floor
    // of the mount (the aim's horizontal part), its top face at p.
    const ax = aimVec(pose.az, 0);
    const back = norm({ x: -ax.x, y: 0, z: -ax.z });
    const a = { x: p.x + back.x * r, y: p.y + r, z: p.z + back.z * r };
    const b = { x: p.x + back.x * (L - r), y: p.y + r, z: p.z + back.z * (L - r) };
    return [{ a, b, r, piece: 'body' }];
  }
  const aim = aimVec(pose.az, pose.el);
  const a = sub(p, scale(aim, r));
  const b = sub(p, scale(aim, Math.max(r, L - r)));
  const tail = sub(p, scale(aim, L));
  const out: Seg[] = [{ a, b, r, piece: 'body' }];
  if (body.mount === 'clip') {
    // A rim clamp: the body, and an arm from its tail to the nearest hoop
    // point (no rims on the scene: the body alone).
    const g = nearestRimPoint(scene.rims ?? [], tail);
    if (g) out.push({ a: tail, b: g.q, r: 6, piece: 'arm' });
    return out;
  }
  let q: Vec3;
  if (scene.port && isInside(scene, tail)) {
    const toPort = sub(scene.port.c, tail);
    const d = len(toPort);
    q = add(tail, scale(norm(toPort), d + scene.boom.outside));
  } else {
    q = sub(tail, scale(aim, scene.boom.behind));
  }
  out.push({ a: tail, b: q, r: scene.boom.radius, piece: 'boom' });
  if (q.y < scene.yFloor) {
    out.push({ a: q, b: { x: q.x, y: scene.yFloor, z: q.z }, r: scene.standRadius, piece: 'stand' });
  }
  return out;
}

export type Blocked = { partId: string; label: string; piece: 'body' | 'boom' | 'stand' | 'arm' } | null;

/** The first solid the assembly enters, or null when it is clear. A clamp's
 *  arm is not tested against the hoop it grips; it may not be longer than
 *  the clamp's reach (CLIP_REACH). */
export function checkAssembly(scene: CompiledScene, pose: MicPose, body: MicBody): Blocked {
  'worklet';
  const segs = assembly(scene, pose, body);
  for (let si = 0; si < segs.length; si++) {
    const sg = segs[si];
    if (sg.piece === 'arm') {
      const ax = sg.b.x - sg.a.x;
      const ay = sg.b.y - sg.a.y;
      const az = sg.b.z - sg.a.z;
      if (Math.sqrt(ax * ax + ay * ay + az * az) > (body.reach ?? CLIP_REACH)) return { partId: 'clamp', label: 'the clamp’s reach', piece: 'arm' };
      continue;
    }
    const dx = sg.b.x - sg.a.x;
    const dy = sg.b.y - sg.a.y;
    const dz = sg.b.z - sg.a.z;
    const sl = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const step = Math.max(sg.r, 4);
    const n = Math.max(1, Math.ceil(sl / step));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const q = { x: sg.a.x + dx * t, y: sg.a.y + dy * t, z: sg.a.z + dz * t };
      for (let i = 0; i < scene.solids.length; i++) {
        const so = scene.solids[i];
        if (body.mount === 'surface' && so.partId === body.surfacePartId) continue;
        if (sg.piece === 'stand' && so.shape.kind === 'floor') continue; // a stand stands ON the floor
        if (sdf(so.shape, q) - sg.r - so.clearance < 0) return { partId: so.partId, label: so.label, piece: sg.piece };
      }
    }
  }
  return null;
}

/**
 * THE DRUM IN THE PATH (review M2c): the first of `partIds` that the straight
 * line from `a` to `b` passes through, or null. Page 4 uses it to say when the
 * shell or a head sits between a mic and a monitor — the free-field pattern
 * ignores that shielding, so the pickup readout must not pretend otherwise.
 */
export function solidOnPath(scene: CompiledScene, a: Vec3, b: Vec3, partIds: readonly string[]): { partId: string; label: string } | null {
  // 0.8 mm steps: a head is a 1 mm slab, so a coarser walk could step over it.
  const d = sub(b, a);
  const n = Math.max(1, Math.ceil(len(d) / 0.8));
  const solids = scene.solids.filter((so) => partIds.includes(so.partId));
  for (let k = 1; k < n; k++) {
    const q = add(a, scale(d, k / n));
    for (const so of solids) if (sdf(so.shape, q) < 0) return { partId: so.partId, label: so.label };
  }
  return null;
}

export type Bounds = { min: Vec3; max: Vec3 };

function clampP(p: Vec3, b: Bounds): Vec3 {
  'worklet';
  return { x: clamp(p.x, b.min.x, b.max.x), y: clamp(p.y, b.min.y, b.max.y), z: clamp(p.z, b.min.z, b.max.z) };
}

/** Max step per sub-move (mm, deg): small enough that no wall is tunnelled. */
export const SUBSTEP_MM = 4;
export const SUBSTEP_DEG = 3;

/**
 * Move from `from` toward `to`, never through a solid (blueprint §4.4):
 * walk in sub-steps of ≤ 4 mm / 3°; a blocked sub-step tries each axis on its
 * own (the mic SLIDES along the obstacle), else stops. `blocked` names the
 * obstacle the last attempted step ran into (null when the full move landed).
 */
export function constrainMove(scene: CompiledScene, body: MicBody, from: MicPose, to: MicPose, bounds: Bounds): { pose: MicPose; blocked: Blocked } {
  'worklet';
  const tp = clampP(to.p, bounds);
  const d = sub(tp, from.p);
  const dAng = Math.max(Math.abs(to.az - from.az), Math.abs(to.el - from.el));
  const n = Math.max(1, Math.ceil(Math.max(len(d) / SUBSTEP_MM, dAng / SUBSTEP_DEG)));
  const step = scale(d, 1 / n);
  const dAz = (to.az - from.az) / n;
  const dEl = (to.el - from.el) / n;
  let cur: MicPose = { p: from.p, az: from.az, el: from.el };
  let blocked: Blocked = null;
  for (let i = 0; i < n; i++) {
    const full: MicPose = { p: add(cur.p, step), az: cur.az + dAz, el: cur.el + dEl };
    const hit = checkAssembly(scene, full, body);
    if (!hit) {
      cur = full;
      blocked = null;
      continue;
    }
    blocked = hit;
    // Slide: each axis alone (largest component first), angles held.
    const comps: Vec3[] = [
      { x: step.x, y: 0, z: 0 },
      { x: 0, y: step.y, z: 0 },
      { x: 0, y: 0, z: step.z },
    ];
    comps.sort((u, v) => Math.abs(v.x + v.y + v.z) - Math.abs(u.x + u.y + u.z));
    let moved = false;
    for (let c = 0; c < 3; c++) {
      const cm = comps[c];
      if (Math.abs(cm.x) + Math.abs(cm.y) + Math.abs(cm.z) < 1e-9) continue;
      const cand: MicPose = { p: add(cur.p, cm), az: cur.az, el: cur.el };
      if (!checkAssembly(scene, cand, body)) {
        cur = cand;
        moved = true;
        break;
      }
    }
    if (!moved) break;
  }
  return { pose: cur, blocked };
}

/**
 * A SURFACE mount (a boundary plate on a pillow, blueprint §4.6): the pose is
 * pinned to the top face of the surface part's box. Only x (and z within the
 * face) move; the plate lies flat, element end toward −x (facing the batter
 * head, S-LIVE "with microphone element facing beater head").
 */
export function pinToSurface(pose: MicPose, top: { min: Vec3; max: Vec3 }, body: MicBody, halfWidth: number): MicPose {
  'worklet';
  const h = body.radius * 2;
  return {
    p: {
      x: clamp(pose.p.x, top.min.x, top.max.x - body.length),
      y: top.min.y - h,
      z: clamp(pose.p.z, top.min.z + halfWidth, top.max.z - halfWidth),
    },
    az: 0,
    el: 0,
  };
}
