/**
 * THE VENUE PLAN BUILDER — frame P (Lab 7 part 2, group 2, branch lab7-g5;
 * docs/labs/miking/field_diamond/GEOMETRY_PROPOSAL.md §1). Built ONCE here and
 * imported by every Lab 7 sports lesson (B09–B17). Pure: no React, so the
 * tests reach it.
 *
 * It EXTENDS Lab 5's seating / stage-plot builder (lessons/shared/ensemble:
 * frameS for the engine's aim convention and the dual-unit lengths,
 * stagePlot for the free-field level rule) — nothing of it is copied: the
 * plan here is the same machinery at the scale of a field.
 *
 * FRAME P (metres; the lesson's own coordinates, kept as the lesson writes
 * them): the origin on the touchline / sideline / boundary at a mark the scene
 * names; +x ALONG the line; +y INTO the field (the playing side); heights h
 * up from the ground. Drawn as a plan the usual way up — the field above, the
 * crew strip below — so "left" and "right" read as an operator standing on
 * the line and facing into the field says them (a target at smaller x is to
 * the LEFT: the lesson's "B … 32 degrees left").
 *
 * The ENGINE frame (millimetres, +y down) maps as
 *   engine x = x · 1000,  engine y = −h · 1000,  engine z = −y · 1000,
 * so the engine's top view (u = x, v = z) draws the plan with +y up the
 * screen, and every Lab 6 / Lab 7 drawing helper (FieldStage, uvOf) works on
 * it unchanged.
 *
 * LAYERS (one meaning each — field_diamond/GEOMETRY_PROPOSAL.md §1): the
 * playing area (filled), keep-clear space (hatched: run-off, free zone,
 * perimeter, the practice offset), operational routes (dashed: medical,
 * officials, benches, crew lanes, exits), approved footprints (solid outline
 * boxes), camera positions and their frame cones, crowd and PA sectors, the
 * target points, mic marks with their aim and a pattern's shape, an operator's
 * turn arc.
 *
 * READOUTS (DERIVED, "calculated from the drawing" — never a performance
 * claim): plan range, slant range (with the source and capsule heights), the
 * aim relative to straight ahead (left / right), the angle off a mic's axis to
 * a PA or crowd sector, the arrival-time difference between two mics for one
 * source point and the comb notches it makes (engine/physics/twoMic — the
 * calculator's speed of sound), and the free-field level change between two
 * ranges (Lab 5's stagePlot.byDistanceDb).
 *
 * COVERAGE MAP MODE: each target zone tagged "useful detail", "ambience only"
 * or "unavailable", each with its handoff source (B13 L51).
 *
 * Clearance NUMBERS from a sport's rules are drawn only as "typical clear
 * zone — check your event's rules" (owner decision D7-1, default), never as a
 * mic position or a safe distance.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { deltaTms, notchesHz } from '../../../engine/physics/twoMic.ts';
import { aimOf, fmtStage } from '../ensemble/frameS.ts';
import { byDistanceDb } from '../ensemble/stagePlot.ts';

/* ── frame P ── */

/** A plan point in metres (frame P). */
export type P2 = { x: number; y: number };
/** A plan rectangle in metres (x0 < x1, y0 < y1). */
export type PlanRect = { x0: number; y0: number; x1: number; y1: number };

export const p2 = (x: number, y: number): P2 => ({ x, y });
export const MM = 1000;

/** A frame-P point at height h (m) as an engine point (mm). */
export function toEngine(p: P2, h = 0): Vec3 {
  return { x: p.x * MM, y: -h * MM, z: -p.y * MM };
}
/** An engine point (mm) as a frame-P plan point and height (m). */
export function fromEngine(e: Vec3): { p: P2; h: number } {
  return { p: { x: e.x / MM, y: -e.z / MM }, h: -e.y / MM };
}
/** The plan view's (u, v) in mm for a frame-P point — the engine's top view. */
export const planUV = (p: P2): { u: number; v: number } => ({ u: p.x * MM, v: -p.y * MM });
/** A plan rectangle as an engine top-view box (mm). */
export const rectUV = (r: PlanRect): { u0: number; u1: number; v0: number; v1: number } => ({ u0: r.x0 * MM, u1: r.x1 * MM, v0: -r.y1 * MM, v1: -r.y0 * MM });

export const DEG = Math.PI / 180;

/* ── readouts (DERIVED) ── */

/** Plan (horizontal) range in metres. */
export function planRange(a: P2, b: P2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
/** Slant range in metres between a capsule at height ha and a source at hb. */
export function slantRange(a: P2, ha: number, b: P2, hb: number): number {
  return Math.hypot(planRange(a, b), hb - ha);
}
/** A plan direction as a unit vector, from an angle in degrees measured from
 *  +y (straight into the field) toward −x (the operator's LEFT) — so a
 *  positive angle is to the left, as the lesson says it. */
export function dirFromDeg(deg: number): P2 {
  return { x: -Math.sin(deg * DEG), y: Math.cos(deg * DEG) };
}
/** The angle of a plan direction, degrees from +y toward −x (+ = left). */
export function degOf(d: P2): number {
  return Math.atan2(-d.x, d.y) / DEG;
}
/** Wrap an angle to −180 … 180. */
export const wrap180 = (a: number): number => ((((a + 180) % 360) + 360) % 360) - 180;

/**
 * The aim from `from` to `to`, relative to `ahead` (a unit plan direction;
 * default straight into the field, +y): signed degrees, + = LEFT of straight
 * ahead, − = right. M (15, −6) → B (5, 10): 32.0° left (B13 L130).
 */
export function aimRel(from: P2, to: P2, ahead: P2 = { x: 0, y: 1 }): number {
  return wrap180(degOf({ x: to.x - from.x, y: to.y - from.y }) - degOf(ahead));
}
/** "32° left" / "0°" / "12° right" (whole degrees; "0°" within half a degree). */
export function aimWords(deg: number): string {
  const r = Math.round(deg);
  if (r === 0) return '0° (straight ahead)';
  return `${Math.abs(r)}° ${r > 0 ? 'left' : 'right'}`;
}
/** The plan angle between a mic's aim (degrees, as `dirFromDeg`) and the
 *  direction from the mic to a point — how far off the mic's axis the point
 *  lies (0 … 180). */
export function offAxisDeg(mic: P2, aimDeg: number, point: P2): number {
  if (planRange(mic, point) < 1e-9) return 0;
  return Math.abs(wrap180(degOf({ x: point.x - mic.x, y: point.y - mic.y }) - aimDeg));
}
/** The same in 3-D (with the capsule's and the point's heights): the angle
 *  between the mic's axis (aimed at `aimAt`, height `hAim`) and the point. */
export function offAxis3(mic: P2, hMic: number, aimAt: P2, hAim: number, point: P2, hPoint: number): number {
  const a = { x: aimAt.x - mic.x, y: aimAt.y - mic.y, z: hAim - hMic };
  const b = { x: point.x - mic.x, y: point.y - mic.y, z: hPoint - hMic };
  const la = Math.hypot(a.x, a.y, a.z);
  const lb = Math.hypot(b.x, b.y, b.z);
  if (la < 1e-9 || lb < 1e-9) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (la * lb)))) / DEG;
}
/** The engine's aim (az, el) for a mic at `mic` (height hMic) aimed at a
 *  point (height hTo) — Lab 5's aimOf, reused. */
export function engineAim(mic: P2, hMic: number, to: P2, hTo: number): { az: number; el: number } {
  const a = toEngine(mic, hMic);
  const b = toEngine(to, hTo);
  return aimOf({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z });
}

/** A source point heard by two mics: the arrival-time difference (ms; + = B
 *  hears it later) and the first notches of their equal-level sum (Hz) —
 *  engine/physics/twoMic with the calculator's speed of sound. Straight
 *  paths, one point source, no room: a simplified picture. */
export function overlap(src: P2, hSrc: number, a: P2, ha: number, b: P2, hb: number, polarity: 1 | -1 = 1, nMax = 4): { dA: number; dB: number; dtMs: number; notches: number[] } {
  const dA = slantRange(a, ha, src, hSrc);
  const dB = slantRange(b, hb, src, hSrc);
  const dtMs = deltaTms((dB - dA) * MM);
  return { dA, dB, dtMs, notches: notchesHz(dtMs, polarity, 20000, nMax) };
}

/** The free-field level change from range r1 to range r2 (dB; + = quieter at
 *  r2) — the inverse-square rule from Lab 5's stage plot. */
export function rangeDb(r1: number, r2: number): number {
  return byDistanceDb(r1 * MM, r2 * MM);
}

/** A length in the app's dual style ("10.0 m (32.8 ft)"), from metres. */
export const fmtRange = (m: number): string => fmtStage(m * MM);
/** A length in metres to one decimal ("18.9 m") — the lesson's own rounding. */
export const fmtM1 = (m: number): string => (Number.isFinite(m) && m >= 0 ? `${m.toFixed(1)} m` : '—');

/* ── the layers ── */

/** A keep-clear area (hatched). `rule`: drawn from a sport's rules (said as
 *  "typical clear zone — check your event's rules"); `lesson`: the lesson's
 *  own practice layout; `drawing`: a drawing default. */
export type KeepClear = { id: string; label: string; short: string; poly: readonly P2[]; basis: 'rule' | 'lesson' | 'drawing'; note: string };
/** An operational route (dashed). */
export type Route = { id: string; label: string; short: string; pts: readonly P2[]; kind: 'medical' | 'officials' | 'bench' | 'crew' | 'exit' | 'players' };
/** An approved footprint (a solid outline box): where a mic, a stand or an
 *  operator may be — named by who approved it in the scene's words. */
export type Footprint = { id: string; label: string; short: string; rect: PlanRect };
/** A camera: its place, the direction it faces (as `dirFromDeg`), its frame's
 *  half-angle and how far the cone is drawn (all drawing defaults). */
export type Camera = { id: string; label: string; p: P2; dirDeg: number; halfDeg: number; reach: number };
/** A crowd or PA sector: its centre (what a mic hears it from) and its outline. */
export type Sector = { id: string; label: string; short: string; kind: 'crowd' | 'pa'; c: P2; h: number; poly: readonly P2[] };
/** A target point (a sound to pick up), at its source height h (m). */
export type Target = { id: string; label: string; short: string; p: P2; h: number };
/** A mark: where a mic, an ambience pair or an operator starts. */
export type Mark = { id: string; label: string; short: string; p: P2; kind: 'mic' | 'ambience' | 'operator'; placeholder?: boolean };
/** A badge on a fixture: no attachments (goals, nets, flagposts), approval
 *  only (a net post, a basket), no hardware facing the play. */
export type Badge = { id: string; label: string; short: string; p: P2; kind: 'noAttach' | 'approvalOnly' | 'noHardware' | 'liveBall' };
/** A painted line or an outline that is part of the sport's marking (drawn
 *  white), open or closed. */
export type Marking = { pts: readonly P2[]; closed?: boolean; circle?: { c: P2; r: number } };

export type VenueScene = {
  id: string;
  label: string;
  /** One line: what the plan is. */
  blurb: string;
  /** The playing area (filled). */
  play: readonly P2[];
  /** The surface: grass, a diamond's dirt, a hard court, ice, a mock area. */
  surface: 'grass' | 'diamond' | 'court' | 'ice' | 'mock' | SurfaceG3;
  markings: readonly Marking[];
  keepClear: readonly KeepClear[];
  routes: readonly Route[];
  footprints: readonly Footprint[];
  cameras: readonly Camera[];
  sectors: readonly Sector[];
  targets: readonly Target[];
  marks: readonly Mark[];
  badges: readonly Badge[];
  /** A barrier between live play and crew (a backstop screen, boards and
   *  glass, a fence): drawn as a solid wall line. */
  barriers: readonly { id: string; label: string; pts: readonly P2[] }[];
  /** Plan silhouettes of horses and vehicles (Lab 7b group 3, owner decision D7-3). */
  tokens?: readonly Token[];
  /** The plan box that frames the whole scene (m). */
  frame: PlanRect;
  /** INTERNAL: which dimensions are drawing defaults (never shown). */
  defaults: readonly string[];
};

/* ── geometry tests on the layers (pure) ── */

/** Is a point inside a polygon (even-odd)? */
export function inPoly(p: P2, poly: readonly P2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
/** A rectangle as a polygon. */
export const rectPoly = (r: PlanRect): P2[] => [p2(r.x0, r.y0), p2(r.x1, r.y0), p2(r.x1, r.y1), p2(r.x0, r.y1)];
/** A band of width w round the OUTSIDE of a rectangle, as four polygons
 *  (the run-off / free zone / perimeter), each as a closed ring. */
export function bandAround(r: PlanRect, w: number): P2[][] {
  const o = { x0: r.x0 - w, y0: r.y0 - w, x1: r.x1 + w, y1: r.y1 + w };
  return [
    [p2(o.x0, o.y0), p2(o.x1, o.y0), p2(o.x1, r.y0), p2(o.x0, r.y0)],
    [p2(o.x0, r.y1), p2(o.x1, r.y1), p2(o.x1, o.y1), p2(o.x0, o.y1)],
    [p2(o.x0, r.y0), p2(r.x0, r.y0), p2(r.x0, r.y1), p2(o.x0, r.y1)],
    [p2(r.x1, r.y0), p2(o.x1, r.y0), p2(o.x1, r.y1), p2(r.x1, r.y1)],
  ];
}
export const inRect = (p: P2, r: PlanRect): boolean => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

/** The keep-clear area a point is in, if any (a mic or an operator there is
 *  refused: "never into play, run-off or a route"). */
export function keepClearAt(scene: VenueScene, p: P2): KeepClear | null {
  return scene.keepClear.find((k) => inPoly(p, k.poly)) ?? null;
}
/** Is a point in the playing area? */
export const inPlay = (scene: VenueScene, p: P2): boolean => inPoly(p, scene.play);
/** Distance from a point to a polyline (m). */
export function distToPolyline(p: P2, pts: readonly P2[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}
/** The route a point stands in (within `halfW` m of its line), if any. */
export function routeAt(scene: VenueScene, p: P2, halfW = 0.6): Route | null {
  return scene.routes.find((r) => distToPolyline(p, r.pts) <= halfW) ?? null;
}
/** The approved footprint a point is in, if any. */
export function footprintAt(scene: VenueScene, p: P2): Footprint | null {
  return scene.footprints.find((f) => inRect(p, f.rect)) ?? null;
}
/** Why a mic or an operator may NOT stand at p (null = it may): play,
 *  keep-clear space, a route, or simply not on an approved footprint. */
export function refusedAt(scene: VenueScene, p: P2): { kind: 'play' | 'keepClear' | 'route' | 'unapproved'; label: string } | null {
  if (inPlay(scene, p)) return { kind: 'play', label: 'the playing area' };
  const k = keepClearAt(scene, p);
  if (k) return { kind: 'keepClear', label: k.label };
  const r = routeAt(scene, p);
  if (r) return { kind: 'route', label: r.label };
  if (!footprintAt(scene, p)) return { kind: 'unapproved', label: 'a place nobody has approved' };
  return null;
}

/* ── the operator's turn arc ── */

/** An operator's turn arc at `at`: from `fromDeg` to `toDeg` (as dirFromDeg,
 *  + = left; fromDeg < toDeg), drawn out to `reach` m. */
export type TurnArc = { at: P2; fromDeg: number; toDeg: number; reach: number };
/** Is the aim (degrees) inside the arc? */
export const inArc = (arc: TurnArc, deg: number): boolean => deg >= arc.fromDeg - 1e-9 && deg <= arc.toDeg + 1e-9;
/** Can the operator at the arc's place turn to face a point without leaving it? */
export const reachable = (arc: TurnArc, p: P2): boolean => inArc(arc, degOf({ x: p.x - arc.at.x, y: p.y - arc.at.y }));

/* ── coverage map mode (B13 L51) ── */

export type CoverageTag = 'detail' | 'ambience' | 'unavailable';
export const COVERAGE_WORDS: Readonly<Record<CoverageTag, { label: string; short: string; blurb: string }>> = {
  detail: { label: 'Useful detail', short: 'DETAIL', blurb: 'An action mic gives usable detail here, after listening.' },
  ambience: { label: 'Ambience only', short: 'AMBIENCE', blurb: 'Only the ambience bed carries this zone: no action mic reaches it well.' },
  unavailable: { label: 'Unavailable', short: 'NONE', blurb: 'Nothing covers it from an approved place: say so, and plan the handoff.' },
};
export type CoverageZone = { id: string; label: string; short: string; c: P2; r: number; tag: CoverageTag; handoff: string };
/** The next tag when a zone is tapped (detail → ambience → unavailable → detail). */
export const nextTag = (t: CoverageTag): CoverageTag => (t === 'detail' ? 'ambience' : t === 'ambience' ? 'unavailable' : 'detail');

/* ── clearance words (owner decision D7-1, default) ── */

/** The one way a sport's clearance NUMBER is said on screen. */
export const CLEAR_ZONE_WORDS = 'typical clear zone — check your event’s rules';
/** A badge's words (one meaning each). */
export const BADGE_WORDS: Readonly<Record<Badge['kind'], string>> = {
  noAttach: 'No mic, camera or anything else attached here.',
  approvalOnly: 'Only with express approval and a reviewed fixture.',
  noHardware: 'No hardware facing the play.',
  liveBall: 'May be live-ball territory: a ball can arrive here.',
};

/* ── Lab 7b group 3 (lab7-g6): more surfaces and the plan silhouettes ── */

/** A synthetic running track, a gymnastics or wrestling mat, a ring's
 *  canvas, an arena's sand footing, pool water, a circuit's asphalt. */
export type SurfaceG3 = 'track' | 'mat' | 'canvas' | 'sand' | 'water' | 'asphalt';
/** A horse or a vehicle seen from above (owner decision D7-3, default: plan
 *  silhouettes only, no detailed figure): its place, the way it faces (as
 *  dirFromDeg) and what it is. Drawn to scale by ArenaArt.tsx. */
export type Token = { id: string; kind: 'horse' | 'car'; p: P2; dirDeg: number; label: string };
