/**
 * THE CYMBAL LESSONS (Lab 2: hi-hat, ride, crash, splash, China) — what they
 * share, pure (no React Native): the scene is the SHARED 5-PIECE KIT
 * (kitScene/kitSceneModel.ts — every drum, cymbal, stand and the drummer's
 * keep-outs, in the kit frame K) with the lesson's own cymbal in it; this
 * file adds the cymbal's reference surfaces, its edge line, the sticks'
 * sector over its drummer side, zone helpers, and the family's extra page
 * data (`cym`, read by CymbalSound.tsx).
 *
 * Frame K (kit/GEOMETRY_PROPOSAL.md §1): origin the kick's batter centre, +x
 * toward the audience, +y DOWN, +z the drummer's right; floor y = 290.4.
 * A cymbal's own frame (cymbalSpec.ts): n its top face's normal (up, tilted
 * toward the drummer), e1 in its plane toward the audience, e2 = +z;
 * P = c + r(cos θ e1 + sin θ e2) + h n.
 *
 * Every keep-out a cymbal adds is a DRAWING DEFAULT (no source gives a
 * swing, a stick path or a clearance): the swing ± 60 mm, the sticks' sector
 * (the drummer-facing side, 406.4 mm up — one common stick's length).
 */
import type { DocumentedZone, Envelope, InstrumentModel, Lesson, MicPose, Part, Provenance, RadiatingRegion, RefLine, ReferenceSurface, Rim, Shape3, Variant, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { LessonCopy } from '../../../engine/model/copy.ts';
import { KIT, KIT_FLOOR_Y } from '../kitPlanModel.ts';
import { kitModel } from '../kitScene/kitSceneModel.ts';
import { cymbalFrame, cymbalPoint, type CymbalFrame, type CymbalSpec } from './cymbalSpec.ts';
import type { FxPlaced } from './cymbalFx.ts';

const DEG = Math.PI / 180;
export const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });

/** One common stick's length (VF-5A "16”", TRIAL for any stick). */
export const STICK_LEN = 406.4;
/** The throne's centre in plan (the kit's): where the sticks come from. */
export const THRONE = { x: KIT.throne.c.u, z: KIT.throne.c.v } as const;

export const frameFor = (p: FxPlaced): CymbalFrame => cymbalFrame(p);
/** A point on/over the cymbal: radius r, plan angle θ (deg, from e1 toward
 *  e2), h along its normal n (+ above its top side, − below). */
export const at = (p: FxPlaced, r: number, thetaDeg: number, h: number): Vec3 => cymbalPoint(cymbalFrame(p), r, thetaDeg, h);

/** The cymbal-frame angle (deg) of a plan direction (dx, dz). */
export function thetaOf(p: FxPlaced, dx: number, dz: number): number {
  const f = cymbalFrame(p);
  return Math.atan2(dz, dx * f.e1.x) / DEG;
}
/** The plan direction from the cymbal toward the throne, and its angle. */
export function towardThrone(p: FxPlaced): { x: number; z: number; theta: number } {
  const dx = THRONE.x - p.c.x;
  const dz = THRONE.z - p.c.z;
  const l = Math.hypot(dx, dz);
  return { x: dx / l, z: dz / l, theta: thetaOf(p, dx, dz) };
}

/** A pose whose FRONT is at p, aimed at `target` (the engine's convention). */
export function poseToward(p: Vec3, target: Vec3): MicPose {
  const d = { x: target.x - p.x, y: target.y - p.y, z: target.z - p.z };
  const l = Math.hypot(d.x, d.y, d.z);
  const u = { x: d.x / l, y: d.y / l, z: d.z / l };
  const el = -Math.asin(Math.max(-1, Math.min(1, u.y))) / DEG;
  return { p, el, az: Math.abs(el) > 89.99 ? 0 : Math.atan2(u.z, -u.x) / DEG };
}

/** The cymbal's top side as a reference surface: distances ABOVE it, square
 *  to its plane (its edge plane). */
export function topSurface(id: string, partId: string, label: string, p: FxPlaced, variants?: string[]): ReferenceSurface {
  const f = cymbalFrame(p);
  return { id, partId, label, point: f.c, normal: f.n, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, ...(variants ? { variants } : {}) };
}
/** Its underside: distances BELOW a plane `drop` mm under the edge plane
 *  (the plate's lowest point, for a plate that hangs below its rim). */
export function underSurface(id: string, partId: string, label: string, p: FxPlaced, drop = 0, variants?: string[]): ReferenceSurface {
  const f = cymbalFrame(p);
  const n = { x: -f.n.x, y: -f.n.y, z: -f.n.z };
  return { id, partId, label, point: { x: f.c.x + n.x * drop, y: f.c.y + n.y * drop, z: f.c.z + n.z * drop }, normal: n, plus: { words: 'below', key: 'BELOW' }, minus: { words: 'above', key: 'ABOVE' }, ...(variants ? { variants } : {}) };
}
/** The cymbal's centre line with its radius as the offset: the radial
 *  readout says how far in from (or out past) the edge the mic is. */
export function edgeLine(id: string, label: string, p: FxPlaced, surfaces: string[], variants?: string[]): RefLine {
  const f = cymbalFrame(p);
  return { id, label, point: f.c, dir: f.n, offset: f.R, words: { plus: 'out past', minus: 'in from', keyPlus: 'OUT PAST EDGE', keyMinus: 'IN FROM EDGE' }, surfaces, ...(variants ? { variants } : {}) };
}

/**
 * The sticks over a cymbal (ILLUSTRATIVE): in plan, the drummer-facing side
 * (± `halfDeg` about the direction to the throne), out `past` mm beyond the
 * edge (the swing; a crash's glancing stroke follows through farther); from
 * `below` mm under the cymbal's centre to a stick's length above it. A mic in
 * the far half stays out of it.
 */
export function stickSector(p: FxPlaced, halfDeg = 80, below = 30, past = 60): Shape3 {
  const t = towardThrone(p);
  const dir = Math.atan2(t.z, t.x);
  return { kind: 'sector', c: p.c, r0: 0, r1: p.spec.d.mm / 2 + past, a0: dir - halfDeg * DEG, a1: dir + halfDeg * DEG, y0: p.c.y - STICK_LEN, y1: p.c.y + below };
}

/** A zone's region, sampled: r (mm), θ (deg), h (mm along n). */
export type Band = { r: readonly [number, number]; th: readonly [number, number]; h: readonly [number, number] };

/** The rectangles a band projects to in each view (sampled; both views), so
 *  a zone is DRAWN where it is TESTED. */
export function bandDrawn(p: FxPlaced, b: Band): NonNullable<DocumentedZone['drawn']> {
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  const N = 8;
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++)
      for (let k = 0; k <= 1; k++) {
        const q = at(p, b.r[0] + ((b.r[1] - b.r[0]) * i) / N, b.th[0] + ((b.th[1] - b.th[0]) * j) / N, b.h[k]);
        xs.push(q.x);
        ys.push(q.y);
        zs.push(q.z);
      }
  const u0 = Math.min(...xs);
  const u1 = Math.max(...xs);
  return {
    side: { u0, u1, v0: Math.min(...ys), v1: Math.max(...ys) },
    top: { u0, u1, v0: Math.min(...zs), v1: Math.max(...zs) },
  };
}
/** The middle of a band (for a start pose). */
export function bandMid(p: FxPlaced, b: Band, f: { r?: number; th?: number; h?: number } = {}): Vec3 {
  const mix = (q: readonly [number, number], t = 0.5) => q[0] + (q[1] - q[0]) * t;
  return at(p, mix(b.r, f.r), mix(b.th, f.th), mix(b.h, f.h));
}

export type CymbalModelOpts = {
  id: string;
  name: string;
  variants: Variant[];
  defaultVariant: string;
  views: Record<ViewId, ViewBox>;
  viewsByVariant?: InstrumentModel['viewsByVariant'];
  /** The kit's one-line roles, said for THIS cymbal's mics. */
  roles: Partial<Record<string, string>>;
  /** Kit parts named on the parts page (the rest stay solids, unnamed). */
  listed: readonly string[];
  /** Kit parts this lesson replaces (the China takes the 18 in crash's stand). */
  omit?: readonly string[];
  /** The lesson's own parts, first on the parts page. */
  own: Part[];
  surfaces: ReferenceSurface[];
  lines: RefLine[];
  envelopes: Envelope[];
  regions: RadiatingRegion[];
  rims?: Rim[];
  /** Where a stand mic's level boom runs when the mic points straight up or
   *  down (out of the kit, away from the drummer). */
  boomOut: Vec3;
  boomLength?: number;
};

/** The lesson's model: the shared kit + the cymbal's own parts and keep-outs. */
export function cymbalModel(o: CymbalModelOpts): InstrumentModel {
  const base = kitModel({ id: o.id, name: o.name, variants: o.variants, defaultVariant: o.defaultVariant, views: o.views, viewsByVariant: o.viewsByVariant, roles: o.roles });
  const kitParts = base.parts
    .filter((p) => !o.omit?.includes(p.id))
    .map((p) => (o.listed.includes(p.id) ? { ...p, listIn: undefined } : { ...p, listIn: [] as string[] }));
  return {
    ...base,
    parts: [...o.own, ...kitParts],
    regions: o.regions,
    surfaces: o.surfaces,
    lines: o.lines,
    envelopes: [...base.envelopes, ...o.envelopes],
    rims: o.rims ?? [],
    yFloor: base.yFloor,
    // ILLUSTRATIVE mount: a stand mic's boom runs level out of the kit.
    mountRule: { boom: 'level', fallback: o.boomOut, length: o.boomLength ?? 520 },
    viewTags: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
  };
}

/** A floor-standing stand mic's foot is on the kit's floor. */
export const FLOOR_Y = KIT_FLOOR_Y;

/* ── the family's own page data (CymbalSound.tsx reads `cym`) ── */

/** A playing area on the face: `r` in mm, or `rFrac` of the drawn plate's
 *  radius (a lesson whose plate changes size with the setup). */
export type CymbalArea = { id: string; label: string; blurb: string; r: number; rFrac?: number };
export type CymbalExtra = {
  /** The plate drawn on HOW IT SOUNDS (its face, its strike). */
  spec: CymbalSpec;
  /** …another plate in some setups (the 8 in splash on top of the crash). */
  specIn?: Readonly<Record<string, CymbalSpec>>;
  profile: 'bow' | 'china';
  /** Per variant: drawn inverted (a China cup down, a piggyback splash). */
  invertedIn?: readonly string[];
  /** The hi-hat: a second plate under the first, `gap` mm away per variant. */
  pair?: { gapIn: Readonly<Record<string, number>> };
  /** How freely the plate rings at ③, per variant (a closed pair is held). */
  ringIn?: Readonly<Record<string, number>>;
  strike: {
    title: string;
    badge: string;
    looking: string;
    prompt: string;
    /** The stick's spot, as a fraction of the radius, toward the player. */
    rFrac: number;
    /** …another spot in some setups (the China crashed on its edge, inverted). */
    rFracIn?: Readonly<Record<string, number>>;
    stages: readonly { title: string; text: string; byVariant?: Readonly<Record<string, string>> }[];
    cells: readonly { k: string; at: readonly string[]; flex?: number }[];
    /** Event labels on the drawing (1 … 4). */
    marks: readonly [string, string, string, string, string];
    reveal: string;
    after: string;
  };
  shapes: {
    title: string;
    badge: string;
    prompt: string;
    /** "A 10 in splash from above". */
    looking: string;
    notes: readonly string[];
    areas: readonly CymbalArea[];
    defaultArea: string;
  };
  arrivals: {
    title: string;
    badge: string;
    prompt: string;
    looking: string;
    note: string;
    arrived: string;
    pending: string;
    sources: readonly { id: string; label: string; p: Vec3; color: string }[];
    points: readonly { id: string; label: string; short?: string; p: Vec3 }[];
    box: Readonly<Record<ViewId, ViewBox>>;
    maxMs: number;
  };
  /** The read step's third point (where this cymbal's sound goes). */
  bodyTitle: string;
  bodyNote: string;
  /** Cross-links in words (the overheads, the complete kit). */
  links: readonly string[];
};

export type CymbalLessonCopy = Partial<LessonCopy>;

/** A cymbal lesson: the engine's Lesson plus the family's page data, riding
 *  on it as `cym` (so the learner-text test walks it with the rest). */
export type CymbalLesson = Lesson & { cym: CymbalExtra };

export function cymOf(lesson: Lesson): CymbalExtra {
  const c = (lesson as Partial<CymbalLesson>).cym;
  if (!c) throw new Error(`lesson ${lesson.id} is not a cymbal lesson`);
  return c;
}
