/**
 * THE LOW / COILED BRASS FAMILY — the collision model and the starting-point
 * helpers (charter §2 layer 2), built from the scene (lowBrassScene.ts) so
 * the solids sit exactly where the drawing puts the instrument and the
 * player.
 *
 *   parts      the bell, the coil or body, the valves, the leadpipe and
 *              mouthpiece, the slides; the player (torso listed; head, arms,
 *              legs and the chair as unlisted solids) — and the horn's right
 *              hand in the bell;
 *   envelopes  the keep-outs, drawn only as a mic APPROACHES them (the
 *              engine's on-approach envelopes, for every lesson): the bell's opening (no mic lowered into a
 *              bell), the hands' working space, the horn's "bells up" lift,
 *              the tuba's sway, the euphonium player's path to stand;
 *   surfaces   the bell (a TARGET point: the rim's centre, its normal the
 *              bell's axis) per orientation, and the instrument's centre for
 *              a view from farther in front.
 * Every clearance is the lab's (ILLUSTRATIVE): no source gives one.
 */
import type { DocumentedZone, Envelope, InstrumentModel, MicPose, Part, Provenance, ReferenceSurface, RefLine, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { add, scale, sub } from '../../../engine/geometry/vec.ts';
import { aimTo } from '../handGeom.ts';
import { conePolys } from '../metal/metalGeom.ts';
import type { LowBrassSpec, Orient } from './lowBrassSpec.ts';
import { basis, brassScene, v, type BrassScene } from './lowBrassScene.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DRAW = ill('a drawing default (the lesson’s GEOMETRY_PROPOSAL.md); no source gives it');
const CLEAR = (mm: number) => ({ mm, prov: ill('the lab’s margin round a moving player or instrument (no source gives one)') });

/** The words a lesson gives its parts. */
export type PartWords = {
  bell: string;
  body: { label: string; short: string; role: string };
  valves: string;
  leadpipe: string;
  slides: string;
  player: string;
  hand?: string;
};

/** Surface ids per orientation. */
export const BELL_SURFACE: Record<Orient, string> = { back: 'bell', up: 'bellUp', front: 'bellFront' };

/** The player's body and the chair, as solids (listed: the torso only). */
function playerParts(s: BrassScene, words: PartWords, variants?: string[]): Part[] {
  const J = s.J;
  const hide = { listIn: [] as string[] };
  const cap = (id: string, label: string, a: Vec3, b: Vec3, r: number, listed = false): Part => ({
    id,
    label,
    short: label,
    role: words.player,
    solid: { kind: 'capsule', a, b, r },
    clearance: CLEAR(20),
    moving: true,
    prov: DRAW,
    ...(variants ? { variants } : {}),
    ...(listed ? {} : hide),
  });
  return [
    cap('pl.body', 'the player', J.pelvis, J.neck, 165, true),
    cap('pl.head', 'the player’s head', J.head, J.head, J.headR + 20),
    cap('pl.thighR', 'the player’s right leg', J.hipR, J.kneeR, 85),
    cap('pl.thighL', 'the player’s left leg', J.hipL, J.kneeL, 85),
    cap('pl.shinR', 'the player’s right leg', J.kneeR, J.ankleR, 65),
    cap('pl.shinL', 'the player’s left leg', J.kneeL, J.ankleL, 65),
    cap('pl.footR', 'the player’s right foot', J.ankleR, J.toeR, 50),
    cap('pl.footL', 'the player’s left foot', J.ankleL, J.toeL, 50),
    cap('pl.upperR', 'the player’s right arm', J.shoulderR, J.elbowR, 55),
    cap('pl.foreR', 'the player’s right arm', J.elbowR, J.wristR, 48),
    cap('pl.upperL', 'the player’s left arm', J.shoulderL, J.elbowL, 55),
    cap('pl.foreL', 'the player’s left arm', J.elbowL, J.wristL, 48),
    cap('pl.handL', 'the player’s left hand', J.wristL, J.handL, 45),
    { id: 'pl.chair', label: 'the chair', short: 'chair', role: 'The player’s chair. Stand bases and cables stay clear of its legs and the player’s feet.', solid: { kind: 'box', min: s.chair.seat.min, max: s.chair.seat.max }, prov: DRAW, ...(variants ? { variants } : {}), ...hide },
    { id: 'pl.chairBack', label: 'the chair', short: 'chair', role: 'The chair’s back.', solid: { kind: 'box', min: s.chair.back.min, max: s.chair.back.max }, prov: DRAW, ...(variants ? { variants } : {}), ...hide },
  ];
}

/** The instrument's own parts for one orientation. */
function instrumentParts(s: BrassScene, words: PartWords, suffix: string, variants?: string[]): Part[] {
  const b = s.bell;
  const vs = variants ? { variants } : {};
  const id = (x: string) => `${x}${suffix}`;
  const vmin = s.valves.reduce((m, q) => ({ x: Math.min(m.x, q.c.x - q.r - 8), y: Math.min(m.y, q.c.y - q.h / 2 - 25), z: Math.min(m.z, q.c.z - q.r - 8) }), { x: Infinity, y: Infinity, z: Infinity });
  const vmax = s.valves.reduce((m, q) => ({ x: Math.max(m.x, q.c.x + q.r + 8), y: Math.max(m.y, q.c.y + q.h / 2 + 10), z: Math.max(m.z, q.c.z + q.r + 8) }), { x: -Infinity, y: -Infinity, z: -Infinity });
  const lead = s.tubes.find((t) => t.id === 'leadpipe')!;
  const mp = s.tubes.find((t) => t.id === 'mouthpiece')!;
  const slide = s.tubes.find((t) => t.id === 'slide1')!;
  const parts: Part[] = [
    {
      id: id('lb.bell'),
      label: 'bell',
      short: 'bell',
      role: words.bell,
      solid: { kind: 'frustum', a: b.throat, b: add(b.rim, scale(b.axis, 6)), ra: b.rT + 4, rb: b.R + 6 },
      clearance: CLEAR(25),
      moving: true,
      prov: s.spec.bell.prov,
      ...vs,
    },
    { id: id('lb.valves'), label: s.spec.valves.kind === 'rotary' ? 'rotary valves' : 'valves', short: 'valves', role: words.valves, solid: { kind: 'box', min: vmin, max: vmax }, clearance: CLEAR(20), moving: true, prov: s.spec.valves.prov, ...vs },
    { id: id('lb.lead'), label: 'mouthpiece and leadpipe', short: 'mouthpiece', role: words.leadpipe, solid: { kind: 'capsule', a: mp.pts[0], b: lead.pts[lead.pts.length - 1], r: 30 }, clearance: CLEAR(15), moving: true, prov: DRAW, ...vs },
    { id: id('lb.slides'), label: 'tuning slides', short: 'slides', role: words.slides, solid: { kind: 'capsule', a: slide.pts[0], b: slide.pts[Math.floor(slide.pts.length / 2)], r: s.spec.id === 'horn' ? 26 : 36 }, clearance: CLEAR(15), moving: true, prov: DRAW, ...vs },
  ];
  if (s.spec.id === 'horn') {
    const coil = s.tubes.filter((t) => t.id.startsWith('coil'));
    const n = norm3(v(0, 0, 0), coil[0].pts);
    parts.push({
      id: id('lb.body'),
      label: words.body.label,
      short: words.body.short,
      role: words.body.role,
      solid: { kind: 'cyl', a: add(s.centre, scale(n, -45)), b: add(s.centre, scale(n, 45)), r: 140 },
      clearance: CLEAR(20),
      moving: true,
      prov: DRAW,
      ...vs,
    });
  } else {
    const bow = s.tubes.find((t) => t.id === 'bottomBow')!;
    const branch = s.tubes.find((t) => t.id === 'bellBranch')!;
    const back = s.tubes.find((t) => t.id === 'backBranch')!;
    const lo = mid(bow.pts[0], branch.pts[0]);
    const hi = mid(branch.pts[branch.pts.length - 1], back.pts[Math.floor(back.pts.length * 0.45)]);
    parts.push({
      id: id('lb.body'),
      label: words.body.label,
      short: words.body.short,
      role: words.body.role,
      solid: { kind: 'frustum', a: sub(lo, v(0, -bow.r, 0)), b: hi, ra: 70 + bow.r, rb: 55 + branch.r },
      clearance: CLEAR(20),
      moving: true,
      prov: DRAW,
      ...vs,
    });
  }
  if (s.bellHand && words.hand) {
    parts.push({ id: id('lb.hand'), label: 'right hand in the bell', short: 'hand in bell', role: words.hand, solid: { kind: 'capsule', a: s.J.elbowR, b: s.bellHand.tip, r: 50 }, clearance: CLEAR(20), moving: true, prov: { kind: 'sourced', src: 'Y-HRN-PLAY', quote: 'Hand-stopping entails controlling the pitch by inserting the right hand into the bell in varying degrees.' }, ...vs });
  } else {
    parts.push({ id: id('lb.handR'), label: 'the player’s right hand', short: 'right hand', role: words.player, solid: { kind: 'capsule', a: s.J.wristR, b: s.J.handR, r: 48 }, clearance: CLEAR(20), moving: true, prov: DRAW, listIn: [], ...vs });
  }
  return parts;
}

const mid = (a: Vec3, b: Vec3): Vec3 => scale(add(a, b), 0.5);
/** A unit vector (or the normal of a ring of points, when `a` is tiny). */
function norm3(a: Vec3, ringPts: Vec3[]): Vec3 {
  const l = Math.hypot(a.x, a.y, a.z);
  if (l > 1) return scale(a, 1 / l);
  // The ring's normal from three of its points.
  const p0 = ringPts[0];
  const p1 = ringPts[Math.floor(ringPts.length / 4)];
  const p2 = ringPts[Math.floor(ringPts.length / 2)];
  const u = sub(p1, p0);
  const w = sub(p2, p0);
  const n = v(u.y * w.z - u.z * w.y, u.z * w.x - u.x * w.z, u.x * w.y - u.y * w.x);
  const ln = Math.hypot(n.x, n.y, n.z) || 1;
  return scale(n, 1 / ln);
}

/** The keep-outs for one orientation (shown on approach). */
function envelopes(s: BrassScene, variants?: string[]): Envelope[] {
  const b = s.bell;
  const vs = variants ? { variants } : {};
  const out: Envelope[] = [
    { id: `env.bell.${s.orient}`, label: 'the bell’s opening', shape: { kind: 'cyl', a: b.rim, b: add(b.rim, scale(b.axis, 110)), r: b.R }, prov: ill('“no mic lowered into the bell”: the opening and 11 cm beyond it are the lab’s keep-out'), ...vs },
  ];
  if (s.bellHand) {
    out.push({ id: 'env.hand', label: 'the right hand’s way into the bell', shape: { kind: 'capsule', a: s.J.elbowR, b: b.rim, r: 85 }, prov: ill('the right hand and forearm at the bell, plus a margin: a drawing default'), ...vs });
  } else {
    out.push({ id: `env.valveHand.${s.orient}`, label: 'the valve hand', shape: { kind: 'capsule', a: s.J.elbowR, b: s.J.handR, r: 75 }, prov: ill('the right hand on the valves and its forearm, plus a margin: a drawing default'), ...vs });
  }
  if (s.bellsUp) {
    out.push({ id: 'env.bellsUp', label: 'the bell rising in a “bells up” passage', shape: { kind: 'capsule', a: b.rim, b: s.bellsUp, r: b.R + 25 }, prov: ill('the bell lifted about 40° about the lips: a drawing default (french_horn/GEOMETRY_PROPOSAL.md §3 env.hn.bellsUp)'), ...vs });
  }
  if (s.spec.id !== 'horn') {
    // The body sways and the bell tilts as the player breathes and moves.
    const tilt = s.orient === 'up' ? v(-70, 30, 90) : v(-40, -60, 90);
    out.push({ id: `env.sway.${s.orient}`, label: 'the bell as the player sways', shape: { kind: 'capsule', a: b.rim, b: add(b.rim, tilt), r: b.R + 30 }, prov: ill('a few centimetres of sway and tilt round the rim: a drawing default'), ...vs });
  }
  return out;
}

/** The bell as a reference surface (a TARGET point), and its axis line. */
export function bellSurface(s: BrassScene, variants?: string[], partSuffix = ''): { surface: ReferenceSurface; line: RefLine } {
  const id = BELL_SURFACE[s.orient];
  return {
    surface: { id, partId: `lb.bell${partSuffix}`, label: 'the bell', point: s.bell.rim, normal: s.bell.axis, target: true, ...(variants ? { variants } : {}) },
    line: { id: `axis.${s.orient}`, label: 'the bell’s axis', point: s.bell.rim, dir: s.bell.axis, surfaces: [id], ...(variants ? { variants } : {}) },
  };
}

/** One lesson's model: one or two orientations of the same instrument (the
 *  first orientation keeps the plain part ids; another adds `.<orient>`). */
export function lowBrassModel(spec: LowBrassSpec, opts: { id: string; name: string; words: PartWords; views: Partial<Record<string, { side: ViewBox; top: ViewBox }>>; variantWords: Record<string, { label: string; blurb: string; phrase?: string }>; extraEnvelopes?: Envelope[]; centreLabel: string }): InstrumentModel {
  const orients = spec.orients;
  const multi = orients.length > 1;
  const parts: Part[] = [];
  const envs: Envelope[] = [];
  const surfaces: ReferenceSurface[] = [];
  const lines: RefLine[] = [];
  orients.forEach((o, i) => {
    const s = brassScene(spec, o);
    const vs = multi ? [o] : undefined;
    const suffix = i === 0 ? '' : `.${o}`;
    if (i === 0) parts.push(...playerParts(s, opts.words));
    parts.push(...instrumentParts(s, opts.words, suffix, vs));
    envs.push(...envelopes(s, vs));
    const bs = bellSurface(s, vs, suffix);
    surfaces.push(bs.surface);
    lines.push(bs.line);
  });
  const s0 = brassScene(spec, orients[0]);
  surfaces.push({ id: 'centre', partId: 'lb.body', label: opts.centreLabel, point: s0.centre, normal: v(1, 0, 0), target: true });
  const views = opts.views[orients[0]]!;
  const regions = orients.flatMap((o, i) => {
    const s = brassScene(spec, o);
    const sfx = i === 0 ? '' : `.${o}`;
    const vs = multi ? { variants: [o] } : {};
    return [
      { id: `r.bell${sfx}`, partId: `lb.bell${sfx}`, label: 'the bell', anchor: s.bell.rim, prov: { kind: 'sourced', src: 'PL-2010', quote: 'the brass instruments radiate constantly in the direction of the bell' } as Provenance, note: 'Nearly all of the sound leaves here, from the bell’s opening — the high overtones mostly along its axis; the low notes spread all round.', ...vs },
      { id: `r.body${sfx}`, partId: `lb.body${sfx}`, label: 'the tubing', anchor: s.centre, prov: ill('the tubing walls radiate very little (standard brass acoustics)'), note: 'The air vibrates INSIDE the tube; the metal walls themselves give off very little sound.', ...vs },
    ];
  });
  return {
    id: opts.id,
    name: opts.name,
    parts,
    regions,
    surfaces,
    lines,
    envelopes: [...envs, ...(opts.extraEnvelopes ?? [])],
    variants: orients.map((o) => ({ id: o, ...opts.variantWords[o] })),
    defaultVariant: orients[0],
    views: { side: views.side, top: views.top },
    viewsByVariant: Object.fromEntries(orients.map((o) => [o, { side: opts.views[o]!.side, top: opts.views[o]!.top }])),
    viewTags: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'FROM ABOVE' },
    aimAzLimit: 180,
    yFloor: { mm: 0, prov: ill('frame H: the floor is y = 0') },
    interior: { x0: 0, x1: 0, rIn: 0, c: v(0, 0, 0) },
    ports: Object.fromEntries(orients.map((o) => [o, null])),
    // A stand's boom runs level, away from the mic's tail — or toward the
    // audience side for a mic aimed nearly straight down at an upright bell.
    mountRule: { boom: 'level', fallback: v(1, 0, 0.3), length: 420 },
    // Framed with the seated player, a bell-up tuba sits near 0.1 mm→px on a
    // phone: its labels (short forms, leaders) still print down to 0.085.
    labelMinScale: 0.085,
  };
}

/* ── starting points ── */

/** A pose `d` mm from `c` along the direction `dir`, aimed at `aimAt`. */
export function poseAt(c: Vec3, dir: Vec3, d: number, aimAt: Vec3 = c): MicPose {
  const l = Math.hypot(dir.x, dir.y, dir.z) || 1;
  const p = add(c, scale(dir, d / l));
  return { p, ...aimTo(p, aimAt) };
}

/** The rim point nearest the audience (the "edge" an above-mic aims at). */
export function frontEdge(s: BrassScene): Vec3 {
  const [e1] = basis(s.bell.axis, v(1, 0, 0));
  return add(s.bell.rim, scale(e1, s.bell.R * 0.9));
}

/** The drawn outline of a cone zone (`toward` = the side it opens to). */
export function coneDraw(c: Vec3, n: Vec3, toward: Vec3 | null, dMin: number, dMax: number, aMin: number, aMax: number): DocumentedZone['draw'] {
  return conePolys(c, n, toward, dMin, dMax, aMin, aMax);
}
