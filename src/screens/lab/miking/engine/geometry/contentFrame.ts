/**
 * The CONTENT FRAME of a view (owner, Pixel 7 Pro, 2026-10-06: "many their
 * object size could be proportioned better — too small, there is more room
 * to easily occupy larger").
 *
 * A lesson's view box (`model.views`) was authored as a generous, fixed
 * frame: room for every mic the lesson could ever place, the player's whole
 * keep-out, a margin all round. Fitting THAT box to a 390–412 pt glass drew a
 * hand drum or a tambourine at a third of the glass. The frame now fitted is
 * the box of what is actually there:
 *
 *   • every part with a solid in this variant (the instrument, its stand,
 *     the player's modelled body), projected to the view;
 *   • every suggested starting point's mic (its front plus a mic's length
 *     behind it, so a placed mic is on the glass);
 *   • the floor line in a side view (the instrument stands on something);
 *   • a margin for labels and clearance (CONTENT_PAD of the larger side,
 *     at least CONTENT_MIN_PAD mm);
 *
 * — and never more than the authored box (it only ever crops empty space).
 * Placement bounds use the same frame, so a mic can never be dragged off the
 * drawing. Pure (no React Native), so tests reach it.
 */
import type { Envelope, InstrumentModel, Shape3, VariantId, Vec3, ViewBox, ViewId } from '../model/types.ts';
import { viewsOf } from '../model/types.ts';

/** Margin round the content, as a share of its larger side… */
export const CONTENT_PAD = 0.08;
/** …and never less than this (mm): a label row, a mic's clearance. */
export const CONTENT_MIN_PAD = 70;
/** A mic drawn at a zone start reaches this far behind its front (mm). */
const MIC_REACH = 220;

type AABB = { min: Vec3; max: Vec3 };
const box = (min: Vec3, max: Vec3): AABB => ({ min, max });

function segBox(a: Vec3, b: Vec3, r: number): AABB {
  return box({ x: Math.min(a.x, b.x) - r, y: Math.min(a.y, b.y) - r, z: Math.min(a.z, b.z) - r }, { x: Math.max(a.x, b.x) + r, y: Math.max(a.y, b.y) + r, z: Math.max(a.z, b.z) + r });
}
const along = (c: Vec3, axis: Vec3 | undefined, t: number): Vec3 => (axis ? { x: c.x + axis.x * t, y: c.y + axis.y * t, z: c.z + axis.z * t } : { x: t, y: c.y, z: c.z });

/** A conservative 3-D box round a solid (null: unbounded — the floor). */
export function shapeBox(s: Shape3): AABB | null {
  switch (s.kind) {
    case 'tube':
      return segBox(along(s.c, s.axis, s.x0), along(s.c, s.axis, s.x1), s.rOut);
    case 'slab':
      return segBox(along(s.c, s.axis, s.x0), along(s.c, s.axis, s.x1), s.r);
    case 'sector':
      return box({ x: s.c.x - s.r1, y: s.y0, z: s.c.z - s.r1 }, { x: s.c.x + s.r1, y: s.y1, z: s.c.z + s.r1 });
    case 'box':
      return box(s.min, s.max);
    case 'capsule':
      return segBox(s.a, s.b, s.r);
    case 'sweep':
      return box({ x: s.pivot.x - s.r1, y: s.pivot.y - s.r1, z: s.pivot.z - s.halfW }, { x: s.pivot.x + s.r1, y: s.pivot.y + s.r1, z: s.pivot.z + s.halfW });
    case 'floor':
      return null;
    case 'cyl':
      return segBox(s.a, s.b, s.r);
    case 'frustum':
      return segBox(s.a, s.b, Math.max(s.ra, s.rb));
    case 'fan': {
      const r = s.r + s.round + s.halfW;
      return box({ x: s.c.x - r, y: s.c.y - r, z: s.c.z - r }, { x: s.c.x + r, y: s.c.y + r, z: s.c.z + r });
    }
    case 'prism': {
      const xs = s.pts.map((p) => p[0]);
      const zs = s.pts.map((p) => p[1]);
      const z0 = Math.min(...zs);
      const z1 = Math.max(...zs);
      // A hinged lid lifts its far side by up to its depth (conservative).
      const lift = s.hinge ? Math.abs(Math.sin((s.hinge.deg * Math.PI) / 180)) * Math.max(Math.abs(z1 - s.hinge.z), Math.abs(z0 - s.hinge.z)) : 0;
      return box({ x: Math.min(...xs), y: s.y0 - lift, z: z0 }, { x: Math.max(...xs), y: s.y1, z: z1 });
    }
  }
  return null;
}

const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);

/** A keep-out that stands for the player's BODY (the figure the art draws),
 *  not a path through the air (a beater's travel, a stick's swing, an aisle). */
export function bodyEnvelope(e: { id: string; label: string }): boolean {
  const s = `${e.id} ${e.label}`;
  return /player|drummer|pianist|harpist|torso|body|\bhead\b|\barms?\b|forearm|hand|legs?\b|feet|foot|thigh|shin|seat|chair|throne/i.test(s) && !/travel|path|swing|stick|beater|mallet|\bway\b|aisle|moving space|motion|shake|follow|rising|drop|arc|dance|bellows/i.test(s);
}

/**
 * The content frame for a view: the content's box, padded, inside the
 * authored box. `zones`: the lesson's suggested starting points.
 */
export function contentFrame(
  model: InstrumentModel,
  zones: readonly { start: { p: Vec3 }; requires?: { variant?: VariantId; variants?: VariantId[] } }[],
  variant: VariantId,
  view: ViewId,
  /** 'parts': the instrument alone (no mic on the page — the parts, the
   *  sound, a figure): its keep-outs and the mics' starting points do not
   *  widen the frame. 'mics' (default): everything a placement page shows. */
  what: 'mics' | 'parts' = 'mics',
): ViewBox | null {
  const authored = viewsOf(model, variant)[view];
  if (!authored) return null;
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  const addPt = (u: number, v: number) => {
    u0 = Math.min(u0, u);
    u1 = Math.max(u1, u);
    v0 = Math.min(v0, v);
    v1 = Math.max(v1, v);
  };
  const addBox = (b: AABB) => {
    addPt(b.min.x, vOf(view, b.min));
    addPt(b.max.x, vOf(view, b.max));
  };
  for (const p of model.parts) {
    if (!p.solid || (p.variants && !p.variants.includes(variant))) continue;
    const b = shapeBox(p.solid);
    if (b) addBox(b);
  }
  for (const e of model.envelopes as Envelope[]) {
    if (e.variants && !e.variants.includes(variant)) continue;
    // With no mic on the drawing the keep-outs are not drawn: only the ones
    // that stand for the PLAYER's body (drawn as the figure) hold room.
    if (what === 'parts' && !bodyEnvelope(e)) continue;
    const b = shapeBox(e.shape);
    if (b) addBox(b);
  }
  for (const z of what === 'mics' ? zones : []) {
    const rq = z.requires;
    if (rq?.variant && rq.variant !== variant) continue;
    if (rq?.variants && !rq.variants.includes(variant)) continue;
    const p = z.start.p;
    addBox(segBox(p, p, MIC_REACH));
  }
  if (!Number.isFinite(u0)) return authored;
  if (view === 'side') {
    const yFloor = model.floorByVariant?.[variant] ?? model.yFloorByVariant?.[variant] ?? model.yFloor.mm;
    if (v1 >= yFloor - 60) v1 = Math.max(v1, yFloor + 30);
  }
  const pad = Math.max(CONTENT_MIN_PAD, CONTENT_PAD * Math.max(u1 - u0, v1 - v0));
  const f = { u0: Math.max(authored.u0, u0 - pad), u1: Math.min(authored.u1, u1 + pad), v0: Math.max(authored.v0, v0 - pad), v1: Math.min(authored.v1, v1 + pad) };
  // Degenerate (content wholly outside the authored box): keep the authored box.
  if (!(f.u1 - f.u0 > 50 && f.v1 - f.v0 > 50)) return authored;
  return f;
}

const frames = new WeakMap<object, Map<string, ViewBox>>();

/**
 * The box a SCENE fits (memoised per lesson): with no mic on the drawing (the
 * parts, a read-step figure) the instrument's content frame; with mics, the
 * authored box — a mic may be moved anywhere in it, and must stay on the
 * glass. A view the model marks `fitAuthored` keeps its authored box.
 */
export function sceneFrame(model: InstrumentModel, variant: VariantId, view: ViewId, withMics: boolean): ViewBox | undefined {
  const authored = viewsOf(model, variant)[view];
  if (!authored || withMics || model.fitAuthored?.[view]) return authored;
  let m = frames.get(model);
  if (!m) {
    m = new Map();
    frames.set(model, m);
  }
  const k = `${variant}|${view}`;
  let f = m.get(k);
  if (!f) {
    f = contentFrame(model, [], variant, view, 'parts') ?? authored;
    // Side and top share x (stacked views line up on one scale and origin):
    // both frames take the union of their u ranges.
    const otherView: ViewId = view === 'side' ? 'top' : 'side';
    const other = viewsOf(model, variant)[otherView] && !model.fitAuthored?.[otherView] ? contentFrame(model, [], variant, otherView, 'parts') : null;
    if (other) f = { ...f, u0: Math.max(authored.u0, Math.min(f.u0, other.u0)), u1: Math.min(authored.u1, Math.max(f.u1, other.u1)) };
    m.set(k, f);
  }
  return f;
}

/**
 * The box a STARTING SETUPS drawing fits (owner 2026-10-06, the piano under
 * its short-stick lid: "zoom out so the distance can be shown"): the
 * instrument's own content frame, grown to take in every point of the setup
 * — each mic's front and tail, its stand's foot, and the point its distance
 * is measured to — with a margin, so the mic, its aim and its dimension are
 * all on the glass. It only ever grows the instrument's frame.
 */
export function setupFrame(model: InstrumentModel, variant: VariantId, view: ViewId, points: readonly Vec3[]): ViewBox | undefined {
  const base = sceneFrame(model, variant, view, false);
  if (!base) return undefined;
  if (!points.length) return base;
  let { u0, u1, v0, v1 } = base;
  for (const p of points) {
    u0 = Math.min(u0, p.x);
    u1 = Math.max(u1, p.x);
    v0 = Math.min(v0, vOf(view, p));
    v1 = Math.max(v1, vOf(view, p));
  }
  const pad = Math.max(CONTENT_MIN_PAD, CONTENT_PAD * Math.max(u1 - u0, v1 - v0));
  return { u0: Math.min(base.u0, u0 - pad), u1: Math.max(base.u1, u1 + pad), v0: Math.min(base.v0, v0 - pad), v1: Math.max(base.v1, v1 + pad) };
}
