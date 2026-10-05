/**
 * THE SHARED GUITAR BODY FAMILY — where things are (charter §2 layer 2).
 * Builds a lesson's InstrumentModel from one GuitarSpec per variant and a
 * playing posture, so the drawing, the hit areas, the collision solids, the
 * reference surfaces and the zones all come from the SAME numbers.
 *
 * FRAMES. Everything is built in frame G (guitarSpec.ts: origin at the saddle
 * on the top, +x to the nut, +y to the treble string, +z out of the top) and
 * mapped into the engine frame by the posture:
 *   • UPRIGHT (seated or standing): engine = G. The treble side faces the
 *     floor (+y down); the top faces the audience and the mic (+z). The
 *     engine's SIDE view (x, y) is then the FRONT of the instrument, its TOP
 *     view (x, z) the instrument seen from above, edge-on.
 *   • LAP (a square-neck resonator played face up): engine = (x, −z, y). The
 *     top faces the ceiling; the SIDE view is the edge, the TOP view the face.
 * A mic FACING the instrument points along −z (upright) — az = −90° — so the
 * model declares `aimHome` and the dock turns the mic about that.
 *
 * The player (head, torso, legs, both hands) is drawn and kept clear as
 * ILLUSTRATIVE envelopes: no source gives a guitarist's geometry (proposal §5:
 * every value a drawing default, `placeholder: true`). Collision with one of
 * them reads "move it", never a hard block (labs never block navigation).
 */
import type { Dim, DocumentedZone, Envelope, InstrumentModel, MicPose, Part, Provenance, ReferenceSurface, RefLine, Rim, Shape3, Variant, VariantId, Vec3, ViewBox, ViewId, ZoneDraw } from '../../../engine/model/types.ts';
import { dd, geomOf, type GuitarGeom, type GuitarSpec } from './guitarSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const PLAYER = ill('no source gives a player’s geometry (acoustic_guitar/GEOMETRY_PROPOSAL.md §5): a drawing default');

export type Posture = 'seated' | 'standing' | 'lap';
export type GVariant = { id: VariantId; label: string; blurb: string; phrase?: string; spec: GuitarSpec; posture: Posture };

type Box = { min: Vec3; max: Vec3 };
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** The posture's mapping from frame G into the engine frame. */
export type Orient = { posture: Posture; lap: boolean; P: (p: Vec3) => Vec3; box: (b: Box) => Box };
export function orientOf(posture: Posture): Orient {
  if (posture !== 'lap') return { posture, lap: false, P: (p) => p, box: (b) => b };
  const P = (p: Vec3): Vec3 => ({ x: p.x, y: -p.z, z: p.y });
  return {
    posture,
    lap: true,
    P,
    box: (b) => {
      const a = P(b.min);
      const c = P(b.max);
      return { min: v(Math.min(a.x, c.x), Math.min(a.y, c.y), Math.min(a.z, c.z)), max: v(Math.max(a.x, c.x), Math.max(a.y, c.y), Math.max(a.z, c.z)) };
    },
  };
}

/** Where the floor is (engine y) for a posture: drawing defaults. */
export const FLOOR_BY_POSTURE: Record<Posture, Dim> = {
  seated: dd(650, 'seated: the strings’ centre line above the floor'),
  standing: dd(1080, 'standing on a strap: the strings’ centre line above the floor'),
  lap: dd(650, 'lap style: the top above the floor'),
};

/** The player's envelopes in frame G (all drawing defaults, PLAYER). */
export type PlayerFit = {
  head: { c: Vec3; r: number };
  mouth: Vec3;
  torso: Box;
  legs: Box;
  feet: Box | null;
  /** The picking / strumming hand over the top. */
  pick: Box;
  /** The picking forearm, resting over the bass side of the lower bout. */
  arm: { a: Vec3; b: Vec3; r: number };
  /** The fretting hand along the neck, or the bar hand (lap style). */
  fret: Box;
};

export function playerFit(g: GuitarGeom, posture: Posture, floorY: number): PlayerFit {
  const D = g.depth;
  const lh = g.lowerH;
  const sh = g.spec.body.pot ? g.spec.body.pot.cx.mm : g.spec.body.xLower.mm;
  const hole = g.hole.x;
  // The picking hand over the top: short of the hole's neck side; over a
  // resonator's coverplate (x −60 … +120, resonator_dobro proposal); over a
  // banjo head up to the bridge's neck side.
  const pickX1 = g.spec.opening.kind === 'round' || g.spec.opening.kind === 'oval' ? hole - g.hole.r * 0.25 : g.spec.body.pot ? 60 : g.spec.opening.kind === 'coverplate' ? 120 : Math.min(160, g.edge - 100);
  const pick: Box = { min: v(-60, -(lh - 22), 0), max: v(pickX1, lh - 22, 130) };
  const fret: Box = { min: v(g.edge - 20, -70, -90), max: v(g.L + 20, 100, 110) };
  if (posture === 'lap') {
    // Face up in the lap; the player sits on the bass side (−y), leaning over.
    const head = { c: v(140, -lh - 230, 560), r: 110 };
    return {
      head,
      mouth: v(140, -lh - 150, 520),
      torso: { min: v(-300, -lh - 420, -D - 60), max: v(320, -lh - 70, 520) },
      legs: { min: v(-320, -lh - 300, -floorY), max: v(420, lh + 90, -D - 4) },
      feet: null,
      pick: { min: v(-60, -80, 0), max: v(120, 80, 110) },
      arm: { a: v(-40, -lh - 120, 200), b: v(30, -40, 70), r: 42 },
      fret: { min: v(g.edge, -60, g.h(g.edge)), max: v(g.L, 60, g.h(g.edge) + 90) },
    };
  }
  const head = { c: v(0.52 * g.edge, -(Math.max(lh, 100) + 267), -D - 113), r: 110 };
  const torso: Box = { min: v(head.c.x - 450, head.c.y - 80, -D - 330), max: v(head.c.x + 150, lh + 47, -D - 10) };
  const legs: Box =
    posture === 'seated'
      ? { min: v(sh - 150, lh + 10, -D - 380), max: v(g.edge + 130, floorY, 300) }
      : { min: v(head.c.x - 330, lh + 40, -D - 300), max: v(head.c.x + 70, floorY, -D - 20) };
  const feet: Box | null = posture === 'standing' ? { min: v(head.c.x - 360, floorY - 110, -D - 300), max: v(head.c.x + 100, floorY, 160) } : null;
  return {
    head,
    mouth: v(head.c.x, head.c.y + 60, head.c.z + 100),
    torso,
    legs,
    feet,
    pick,
    arm: { a: v(sh - 40, -lh - 60, 50), b: v(Math.min(pickX1, 60), -30, 60), r: 40 },
    fret,
  };
}

/** One variant's built pieces (frame G and engine frame). */
export type GuitarScene = {
  variant: GVariant;
  g: GuitarGeom;
  o: Orient;
  fit: PlayerFit;
  floorY: number;
  /** Named anchors (frame G). */
  at: {
    saddle: Vec3;
    bridge: Vec3;
    fret12: Vec3;
    joint: Vec3;
    nut: Vec3;
    hole: Vec3;
    upperTreble: Vec3;
    top: Vec3;
  };
};

export function sceneOf(variant: GVariant): GuitarScene {
  const g = geomOf(variant.spec);
  const o = orientOf(variant.posture);
  const floorY = FLOOR_BY_POSTURE[variant.posture].mm;
  const fit = playerFit(g, variant.posture, floorY);
  const bx = variant.spec.bridge.x.mm;
  return {
    variant,
    g,
    o,
    fit,
    floorY,
    at: {
      saddle: v(0, 0, 0),
      bridge: v(bx, 0, 10),
      fret12: v(g.fret12, 0, g.h(g.fret12)),
      joint: v(g.edge, 0, g.h(g.edge)),
      nut: v(g.L, 0, g.h(g.L)),
      hole: v(g.hole.x, 0, 0),
      upperTreble: v(variant.spec.body.xUpper.mm, 0.6 * g.halfW(variant.spec.body.xUpper.mm, 'treble'), 0),
      top: v(0, 0, 0),
    },
  };
}

/* ── parts (ids `<variant>.<part>`; a variant's parts exist only in it) ── */

/** The body as N box slices (collision), from the outline. */
function bodySlices(g: GuitarGeom, n: number): Box[] {
  const out: Box[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = g.tail + ((g.edge - g.tail) * i) / n;
    const x1 = g.tail + ((g.edge - g.tail) * (i + 1)) / n;
    let b = 0;
    let t = 0;
    for (let k = 0; k <= 4; k++) {
      const x = x0 + ((x1 - x0) * k) / 4;
      b = Math.max(b, g.halfW(x, 'bass'));
      t = Math.max(t, g.halfW(x, 'treble'));
    }
    if (b + t < 2) continue;
    out.push({ min: v(x0, -b, -g.depth), max: v(x1, t, 0) });
  }
  return out;
}

export type PartWords = Partial<Record<'top' | 'opening' | 'bridge' | 'saddle' | 'board' | 'neck' | 'head' | 'strings' | 'pickguard' | 'sides' | 'back' | 'cone' | 'ports' | 'resonator' | 'tailpiece' | 'fifth' | 'hooks' | 'rosette', { label: string; short: string; role: string }>>;

const PART_DEFAULT: Required<PartWords> = {
  top: { label: 'top (soundboard)', short: 'top', role: 'The thin wooden plate the bridge stands on. Driven by the strings through the bridge, it moves the air: much of the instrument’s sound leaves from here.' },
  opening: { label: 'sound hole', short: 'sound hole', role: 'The opening in the top. The air inside the body breathes in and out through it — a big part of the low end.' },
  bridge: { label: 'bridge', short: 'bridge', role: 'Glued to the top. The strings pull on it, and it rocks with them, driving the top.' },
  saddle: { label: 'saddle', short: 'saddle', role: 'The strip on the bridge the strings cross: one end of the vibrating length.' },
  board: { label: 'fingerboard and frets', short: 'frets', role: 'The fretting hand presses the strings to a fret, which shortens the vibrating length and raises the pitch.' },
  neck: { label: 'neck and heel', short: 'neck', role: 'Joins the body at the neck joint; the fretting hand moves along it.' },
  head: { label: 'headstock and tuners', short: 'headstock', role: 'The tuners hold and tune the strings. The far end of the vibrating length is the nut, just before it.' },
  strings: { label: 'strings', short: 'strings', role: 'Plucked or strummed, they vibrate between the saddle and the nut (or a fret). On their own they move very little air.' },
  pickguard: { label: 'pickguard', short: 'pickguard', role: 'A thin plate protecting the top from the pick.' },
  sides: { label: 'sides and back', short: 'sides', role: 'The sides and back close the body around its air. The back rests against the player.' },
  back: { label: 'back', short: 'back', role: 'The back of the body, against the player.' },
  cone: { label: 'resonator cone', short: 'cone', role: 'A thin spun-metal cone under the coverplate. The bridge sits on it and drives it like a loudspeaker cone. Delicate — never pressed or adjusted for a mic.' },
  ports: { label: 'sound ports', short: 'ports', role: 'Screened openings in the upper body: the air inside also leaves here.' },
  resonator: { label: 'resonator back', short: 'resonator', role: 'A bowl behind the pot that reflects sound forward. Without it (open back) more sound leaves behind, into the player.' },
  tailpiece: { label: 'tailpiece', short: 'tailpiece', role: 'Anchors the strings at the tail end. A clip may grip it only if the clip is made for that.' },
  fifth: { label: 'fifth-string peg', short: '5th peg', role: 'The short fifth string starts at a peg partway up the neck.' },
  hooks: { label: 'hooks and tension hoop', short: 'hooks', role: 'The hooks pull a hoop down over the head to tension it. The player sets this — never a mic step.' },
  rosette: { label: 'rosette', short: 'rosette', role: 'The inlaid ring round the sound hole.' },
};

export type BuildOpts = {
  id: string;
  name: string;
  variants: GVariant[];
  defaultVariant: VariantId;
  partWords?: PartWords;
  /** Extra space round the instrument in each view (mm), for the mics. */
  room?: { front: number };
};

export type BuiltGuitarModel = {
  model: InstrumentModel;
  scenes: Record<VariantId, GuitarScene>;
};

const pid = (vid: string, part: string) => `${vid}.${part}`;

export function buildGuitarModel(opts: BuildOpts): BuiltGuitarModel {
  const W = { ...PART_DEFAULT, ...(opts.partWords ?? {}) };
  const parts: Part[] = [];
  const surfaces: ReferenceSurface[] = [];
  const lines: RefLine[] = [];
  const envelopes: Envelope[] = [];
  const rims: Rim[] = [];
  const regions: InstrumentModel['regions'] = [];
  const scenes: Record<VariantId, GuitarScene> = {};
  const viewsByVariant: NonNullable<InstrumentModel['viewsByVariant']> = {};
  const ports: InstrumentModel['ports'] = {};
  const front = opts.room?.front ?? 640;

  for (const gv of opts.variants) {
    const sc = sceneOf(gv);
    scenes[gv.id] = sc;
    const { g, o, fit, at } = sc;
    const sp = gv.spec;
    const id = gv.id;
    const only = [id];
    const P = o.P;
    const B = (b: Box): Shape3 => ({ kind: 'box', ...o.box(b) });
    const prov = sp.body.length.prov;
    const topClear = dd(8, 'top motion and finish');
    const stringClear = dd(10, 'string motion and the pick');
    // The body, as slices (collision only; one part to name).
    const slices = bodySlices(g, 14);
    slices.forEach((b, i) => {
      parts.push({ id: pid(id, `body${i}`), label: W.top.label, short: W.top.short, role: W.top.role, solid: B(b), clearance: topClear, moving: true, variants: only, listIn: [], prov });
    });
    const add = (part: string, w: { label: string; short: string; role: string }, solid: Shape3 | undefined, extra: Partial<Part> = {}) =>
      parts.push({ id: pid(id, part), label: w.label, short: w.short, role: w.role, ...(solid ? { solid } : {}), variants: only, prov, ...extra });
    // The named parts (the first carries no solid: the slices are the top).
    if (sp.opening.kind === 'head') {
      add('top', { label: 'head (the membrane)', short: 'head', role: 'A thin tensioned membrane stretched over the pot, like a drumhead. The bridge stands on it and drives it: most of the banjo’s sound leaves from here.' }, undefined, { moving: true, clearance: topClear });
    } else {
      add('top', W.top, undefined, { moving: true, clearance: topClear });
    }
    if (sp.opening.kind === 'round' || sp.opening.kind === 'oval') add('opening', W.opening, undefined);
    if (sp.opening.kind === 'fholes') add('opening', { label: 'f-holes', short: 'f-holes', role: 'Two f-shaped openings in the carved top. The air inside breathes through them.' }, undefined);
    if (sp.opening.kind === 'coverplate') {
      const cr = sp.opening.d.mm / 2;
      add('coverplate', { label: 'coverplate', short: 'coverplate', role: 'The perforated metal plate over the cone. Sound leaves through its holes. Never clamp to it, press on it or block it.' }, { kind: 'slab', c: P(v(sp.opening.x.mm, 0, 0)), axis: P(v(0, 0, 1)), r: cr, x0: 0, x1: 7 }, { clearance: dd(15, 'coverplate keep-off') });
      add('cone', W.cone, undefined);
      if (sp.opening.ports) add('ports', W.ports, undefined);
    }
    add('bridge', W.bridge, B({ min: v(sp.bridge.x.mm - sp.bridge.l.mm / 2, -sp.bridge.w.mm / 2, 0), max: v(sp.bridge.x.mm + sp.bridge.l.mm / 2, sp.bridge.w.mm / 2, sp.opening.kind === 'coverplate' ? 18 : 11) }), { clearance: dd(6, 'bridge keep-off') });
    // The strings over the top and the neck (moving).
    const spreadMax = sp.strings.spreadSaddle.mm / 2 + 3;
    add('strings', W.strings, B({ min: v(sp.bridge.x.mm + 4, -spreadMax, g.h(0) - 3), max: v(g.L, spreadMax, g.h(g.edge) + 3) }), { moving: true, clearance: stringClear });
    add('board', W.board, B({ min: v(g.boardEnd, -g.boardHalf(g.boardEnd), 0), max: v(g.L, g.boardHalf(g.boardEnd), g.h(g.edge) - 2) }));
    add('neck', W.neck, B({ min: v(g.edge, -g.boardHalf(g.edge), -26), max: v(g.L, g.boardHalf(g.edge), g.h(g.edge) - 6) }));
    const hl = sp.neck.headLen.mm;
    const headW = sp.neck.head === 'slotted' || sp.neck.head === 'banjo' ? 78 : sp.neck.head === 'paddle' ? 60 : sp.strings.perCourse === 2 && sp.strings.courses === 6 ? 96 : 86;
    add('head', W.head, B({ min: v(g.L, -headW / 2, -30), max: v(g.L + hl, headW / 2, 18) }));
    if (sp.pickguard) add('pickguard', W.pickguard, undefined);
    add('sides', W.sides, undefined);
    if (sp.fifth) add('fifth', W.fifth, B({ min: v(sp.fifth.mm - 12, -g.boardHalf(sp.fifth.mm) - 34, -14), max: v(sp.fifth.mm + 12, -g.boardHalf(sp.fifth.mm) + 2, 22) }));
    if (sp.hooks) add('hooks', W.hooks, undefined);
    if (sp.body.pot) {
      const tp = sp.body.pot.cx.mm - sp.body.pot.d.mm / 2;
      add('tailpiece', W.tailpiece, B({ min: v(tp - 8, -22, 0), max: v(tp + 46, 22, 14) }));
      if (sp.resonatorBack) {
        const rb = sp.resonatorBack;
        add('resonator', W.resonator, { kind: 'slab', c: P(v(sp.body.pot.cx.mm, 0, -g.depth)), axis: P(v(0, 0, 1)), r: rb.d.mm / 2, x0: -rb.depth.mm, x1: 0 });
      }
    }

    // The player (ILLUSTRATIVE envelopes; drawn as the player).
    const env = (eid: string, label: string, shape: Shape3, clearance = 0) => envelopes.push({ id: pid(id, eid), label, shape, prov: PLAYER, variants: only, clearance });
    env('pick', o.lap ? 'the picking hand' : 'the strumming hand', B(fit.pick));
    env('arm', 'the picking arm', { kind: 'capsule', a: P(fit.arm.a), b: P(fit.arm.b), r: fit.arm.r });
    env('fret', o.lap ? 'the bar hand' : 'the fretting hand', B(fit.fret));
    env('torso', 'the player', B(fit.torso));
    env('head', 'the player’s head', { kind: 'capsule', a: P(fit.head.c), b: P(fit.head.c), r: fit.head.r });
    env('legs', 'the player’s legs', B(fit.legs));
    if (fit.feet) env('feet', 'the player’s feet', B(fit.feet));

    // Reference surfaces (unit normals) and their lines (the dashed line each
    // radial readout is measured from).
    const N = P(v(0, 0, 1));
    const out = { words: 'out from', key: 'OUT FROM' };
    const behind = { words: 'behind', key: 'BEHIND' };
    const surf = (sid: string, partId: string, label: string, point: Vec3, lineLabel: string) => {
      surfaces.push({ id: pid(id, sid), partId: pid(id, partId), label, point: P(point), normal: N, plus: out, minus: behind, variants: only });
      lines.push({ id: pid(id, `${sid}Line`), label: lineLabel, point: P(point), dir: N, variants: only, surfaces: [pid(id, sid)] });
    };
    const holeLabel = sp.opening.kind === 'fholes' ? 'the f-holes' : sp.opening.kind === 'coverplate' ? 'the coverplate' : sp.opening.kind === 'head' ? 'the head' : 'the sound hole';
    if (sp.body.pot) {
      surf('joint', 'neck', 'the neck joint', at.joint, 'the neck-joint line');
      surf('hole', 'top', 'the head', v(sp.body.pot.cx.mm, 0, 0), 'the head’s centre line');
      surf('bridge', 'bridge', 'the bridge', at.bridge, 'the bridge line');
    } else {
      if (sp.jointFret && sp.jointFret.mm !== 12) surf('fret12', 'board', 'the 12th fret', at.fret12, 'the 12th-fret line');
      surf('joint', 'neck', 'the neck joint', at.joint, 'the neck-joint line');
      surf('hole', sp.opening.kind === 'coverplate' ? 'coverplate' : sp.opening.kind === 'fholes' ? 'opening' : 'opening', holeLabel, at.hole, `${holeLabel.replace(/^the /, 'the ')} line`);
      surf('bridge', 'bridge', 'the bridge', at.bridge, 'the bridge line');
      surf('upper', 'top', 'the upper bout', at.upperTreble, 'the upper-bout line');
    }
    surf('top', 'top', sp.opening.kind === 'head' ? 'the head' : 'the top', at.top, 'the top’s centre line');

    // Clip points: a clip grips the body's edge (the upper bout, both sides,
    // and the waist) — not the strumming side of the lower bout.
    const clipXs = sp.body.pot ? [sp.body.pot.cx.mm + 40, sp.body.pot.cx.mm + 90, sp.body.pot.cx.mm - 40] : [sp.body.xWaist.mm, (sp.body.xWaist.mm + sp.body.xUpper.mm) / 2, sp.body.xUpper.mm];
    // A banjo's clip may also grip its tailpiece (S-LIVE: "clipped to tailpiece").
    if (sp.body.pot) rims.push({ id: pid(id, 'tailpiece'), label: 'the tailpiece', c: P(v(sp.body.pot.cx.mm - sp.body.pot.d.mm / 2 + 20, 0, 12)), axis: N, r: 0.5, variants: only });
    for (const x of clipXs) {
      for (const side of ['bass', 'treble'] as const) {
        const y = (side === 'bass' ? -1 : 1) * g.halfW(x, side);
        if (Math.abs(y) < 5) continue;
        rims.push({ id: pid(id, `edge.${side}.${Math.round(x)}`), label: 'the body’s edge', c: P(v(x, y, 0)), axis: N, r: 0.5, variants: only });
      }
    }

    // Where sound leaves (page 2's overlays and the two-mic page's sources).
    const reg = (rid: string, partId: string, label: string, p: Vec3, note: string) => regions.push({ id: pid(id, rid), partId: pid(id, partId), label, anchor: P(p), prov: ill('a point chosen to stand for the region'), variants: only, note });
    if (sp.opening.kind === 'head') {
      reg('head', 'top', 'the head', v(sp.body.pot!.cx.mm, 0, 2), 'The head, driven by the bridge, radiates most of the sound — toward the listener and a mic in front.');
    } else {
      reg('top', 'top', 'the lower top', v(sp.body.xLower.mm, 0, 2), 'The top round the bridge moves the most: much of the sound leaves from here, toward the listener and a mic in front.');
      reg('hole', sp.opening.kind === 'coverplate' ? 'coverplate' : 'opening', holeLabel.replace(/^the /, ''), v(at.hole.x, 0, 2), sp.opening.kind === 'coverplate' ? 'The cone radiates through the coverplate’s holes: a strong, focused part of the sound.' : 'The air inside the body breathes through the opening: a big part of the low end leaves here.');
    }
    reg('strings', 'strings', 'the strings near the neck', v(at.fret12.x, 0, at.fret12.z + 2), 'The strings themselves, and the picking and fretting sounds, are heard most directly near the neck.');

    // Views: the face and the edge, each with room for the mics and the player.
    const headEnd = g.L + sp.neck.headLen.mm + 40;
    const u0 = Math.min(g.tail, fit.torso.min.x) - 60;
    const u1 = headEnd;
    // Cropped to the instrument and the player's upper body: the legs and
    // the floor run off the bottom (the stand is still drawn to the floor).
    const face: ViewBox = { u0, u1, v0: fit.head.c.y - fit.head.r - 20, v1: Math.min(sc.floorY + 30, g.lowerH + 210) };
    const edge: ViewBox = { u0, u1, v0: fit.torso.min.z - 20, v1: front };
    if (!o.lap) viewsByVariant[id] = { side: face, top: edge };
    else viewsByVariant[id] = { side: { u0, u1, v0: -front, v1: sc.floorY + 30 }, top: { u0, u1, v0: fit.torso.min.y - 40, v1: g.lowerH + 520 } };
    ports[id] = null;
  }

  const first = scenes[opts.defaultVariant];
  const variants: Variant[] = opts.variants.map((gv) => ({ id: gv.id, label: gv.label, blurb: gv.blurb, phrase: gv.phrase }));
  const model: InstrumentModel = {
    id: opts.id,
    name: opts.name,
    parts,
    regions,
    surfaces,
    lines,
    envelopes,
    variants,
    defaultVariant: opts.defaultVariant,
    views: viewsByVariant[opts.defaultVariant]!,
    viewsByVariant,
    // The floor per variant is folded into the floor solid of each scene by
    // its posture; the model's own floor is the default variant's.
    yFloor: FLOOR_BY_POSTURE[first.variant.posture],
    interior: { x0: 1, x1: first.g.depth, rIn: first.g.waistH, c: first.o.P(v(first.variant.spec.body.xWaist.mm, 0, 0)), axis: first.o.P(v(0, 0, -1)) },
    interiors: opts.variants.slice(1).map((gv) => {
      const sc = scenes[gv.id];
      return { x0: 1, x1: sc.g.depth, rIn: sc.g.waistH, c: sc.o.P(v(gv.spec.body.xWaist.mm, 0, 0)), axis: sc.o.P(v(0, 0, -1)) };
    }),
    rims,
    ports,
    aimHome: { az: -90, el: 0 },
  };
  return { model, scenes };
}

/* ── framing (art pass 2026-10-05) ── */

/** The stage's typical aspect (w ÷ h) at 390 pt: the glass in the rack. */
export const STAGE_ASPECT = 1.45;

type Rect = { u0: number; u1: number; v0: number; v1: number };
const unionR = (a: Rect, b: Rect): Rect => ({ u0: Math.min(a.u0, b.u0), u1: Math.max(a.u1, b.u1), v0: Math.min(a.v0, b.v0), v1: Math.max(a.v1, b.v1) });

/** A zone's drawn rectangle in a view (the guitars draw boxes, never wedges). */
function zoneRect(z: DocumentedZone, view: ViewId): Rect | null {
  const d = z.drawn?.[view];
  if (!d || !('u0' in d)) return null;
  return { u0: d.u0, u1: d.u1, v0: d.v0, v1: d.v1 };
}

/**
 * Grow `r` to the stage's aspect. Extra height goes toward the player
 * (−v), extra width to the tail side (−u, where the strumming arm and the
 * bridge mics are); a top edge that would cut through the player's head is
 * moved to just under the chin (a close-up crop: the hands and the
 * instrument, never half a face).
 */
function toAspect(r: Rect, aspect: number, head: { c: number; r: number } | null): Rect {
  const widen = (q: Rect): Rect => {
    const add = (q.v1 - q.v0) * aspect - (q.u1 - q.u0);
    return add > 0 ? { ...q, u0: q.u0 - add * 0.6, u1: q.u1 + add * 0.4 } : q;
  };
  const contentTop = r.v0;
  const w = r.u1 - r.u0;
  const h = r.v1 - r.v0;
  if (w / h < aspect) r = widen(r);
  else {
    const add = w / aspect - h;
    r = { ...r, v0: r.v0 - add * 0.8, v1: r.v1 + add * 0.2 };
  }
  if (head) {
    const top = head.c - head.r - 24;
    // Under the drawn chin (PlayerFigure: the chin at ≈ 0.98 r), with room for a glass a little taller than the box.
    const chin = head.c + head.r + 36;
    if (r.v0 < chin && r.v0 > top) {
      // The top edge would cut through the face. If the content itself sits
      // below the chin, crop there and give the height back below; if the
      // content reaches into the head (a mic above a lap player), take the
      // whole head and widen to keep the aspect.
      if (contentTop >= chin) {
        r = { ...r, v1: r.v1 + (chin - r.v0), v0: chin };
      } else {
        r = widen({ ...r, v0: top });
      }
    }
  }
  return r;
}

/** How much of the glass's height the inset of the other view takes, at
 *  most (DualView: 0.34 h + its tag, from the bottom when `insetAt` is
 *  'bottom'). */
export const INSET_SHARE = 0.43;

/** How far the headstock and its tuner buttons reach either side of the
 *  strings' line, upright (the widest headstock's half-width + a button). */
export const HEAD_REACH = 46 + 26;

/**
 * Keep the headstock clear of the glass's inset of the other view. The
 * neck and headstock lie along v ≈ 0 out to the frame's right edge; the
 * inset takes a right-hand corner. The top-right is used when the frame
 * leaves `above` mm over v = 0 clear of it; else the bottom-right, the frame
 * grown downward until `below` mm under v = 0 is clear (keeping the aspect:
 * the instrument shrinks a little rather than hide its tuners).
 */
function placeInset(r: Rect, above: number, below: number): { r: Rect; at: 'top' | 'bottom' } {
  const h = r.v1 - r.v0;
  if (r.v0 + INSET_SHARE * h <= -above) return { r, at: 'top' };
  const need = below - (r.v1 - INSET_SHARE * h);
  if (need <= 0) return { r, at: 'bottom' };
  const d = need / (1 - INSET_SHARE);
  const add = d * ((r.u1 - r.u0) / h);
  return { r: { u0: r.u0 - add * 0.6, u1: r.u1 + add * 0.4, v0: r.v0, v1: r.v1 + d }, at: 'bottom' };
}

/**
 * PER-LESSON VIEW BOXES from the geometry (owner art pass 2026-10-05: "the
 * ukulele draws too small"). Each variant's views are framed on the
 * INSTRUMENT and its recommended starting points — not on the player — so a
 * soprano ukulele fills the stage the way a dreadnought does. True
 * proportions are kept (one scale for the instrument and the player; the
 * player is cropped, never shrunk). The mic's roam (useRig.boundsOf) follows
 * the boxes, so every zone and every start stays inside with room to move.
 * Pure: returns a NEW built model (the scenes are shared).
 */
export function frameGuitarViews(built: BuiltGuitarModel, zones: readonly DocumentedZone[]): BuiltGuitarModel {
  const viewsByVariant: NonNullable<InstrumentModel['viewsByVariant']> = {};
  const insetAt: Record<VariantId, 'top' | 'bottom'> = {};
  for (const [vid, sc] of Object.entries(built.scenes)) {
    const g = sc.g;
    const sp = sc.variant.spec;
    const mine = zones.filter((z) => z.requires?.variant === vid);
    const x0 = g.tail;
    const x1 = g.L + sp.neck.headLen.mm;
    const len = x1 - x0;
    const halfW = Math.max(g.lowerH, sp.body.pot ? sp.body.pot.d.mm / 2 : 0, sp.resonatorBack ? sp.resonatorBack.d.mm / 2 : 0);
    const mL = Math.max(120, 0.16 * len);
    const mR = 50;
    const P = sc.o.P;
    const faceView: ViewId = sc.o.lap ? 'top' : 'side';
    const edgeView: ViewId = sc.o.lap ? 'side' : 'top';
    // FACE: the instrument's outline, the zones, a margin.
    let face: Rect = { u0: x0 - mL, u1: x1 + mR, v0: -halfW - Math.max(45, 0.3 * halfW), v1: halfW + Math.max(45, 0.3 * halfW) };
    // EDGE: from behind the back (room for the player) to out past the zones.
    const D = g.depth + (sp.resonatorBack ? sp.resonatorBack.depth.mm : 0);
    let edge: Rect = sc.o.lap ? { u0: face.u0, u1: face.u1, v0: -0.6 * len, v1: D + 160 } : { u0: face.u0, u1: face.u1, v0: -D - 250, v1: 0.6 * len };
    for (const z of mine) {
      const f = zoneRect(z, faceView);
      const e = zoneRect(z, edgeView);
      // (A lap variant's edge view is the engine's side view: v = −zG.)
      if (f) face = unionR(face, { u0: f.u0 - 30, u1: f.u1 + 30, v0: f.v0 - 30, v1: f.v1 + 30 });
      if (e) edge = unionR(edge, sc.o.lap ? { u0: e.u0 - 30, u1: e.u1 + 30, v0: e.v0 - 120, v1: e.v1 + 30 } : { u0: e.u0 - 30, u1: e.u1 + 30, v0: e.v0 - 30, v1: e.v1 + 120 });
      const s = z.start.p;
      const fs = faceView === 'side' ? s.y : s.z;
      const es = edgeView === 'side' ? s.y : s.z;
      face = unionR(face, { u0: s.x - 60, u1: s.x + 60, v0: fs - 60, v1: fs + 60 });
      edge = unionR(edge, { u0: s.x - 60, u1: s.x + 60, v0: es - 100, v1: es + 100 });
    }
    // One x range for both views (the stacked pair shares x; boundsOf takes the overlap).
    const u0 = Math.min(face.u0, edge.u0);
    const u1 = Math.max(face.u1, edge.u1);
    face = { ...face, u0, u1 };
    edge = { ...edge, u0, u1 };
    // The player's head in the face view (engine frame), for the crop rule.
    // The MAIN view (the engine's side view: the face when upright, the edge
    // seen from the audience in the lap) takes the stage's aspect; the other
    // view keeps the same x range.
    const hc = P(sc.fit.head.c);
    if (sc.o.lap) {
      // Edge-on from the audience: the mics above the top, the player behind
      // and below; never past the floor.
      edge = { ...edge, v1: Math.min(sc.floorY + 30, Math.max(edge.v1, D + 160)) };
      const fitted = placeInset(toAspect(edge, STAGE_ASPECT, { c: hc.y, r: sc.fit.head.r }), 40, 60);
      insetAt[vid] = fitted.at;
      edge = fitted.r;
      face = { ...face, u0: edge.u0, u1: edge.u1 };
      viewsByVariant[vid] = { side: edge, top: face };
    } else {
      const fitted = placeInset(toAspect(face, STAGE_ASPECT, { c: hc.y, r: sc.fit.head.r }), HEAD_REACH, HEAD_REACH);
      insetAt[vid] = fitted.at;
      face = fitted.r;
      edge = { ...edge, u0: face.u0, u1: face.u1 };
      viewsByVariant[vid] = { side: face, top: edge };
    }
  }
  // The headstock fills the top-right of the frame: the glass's inset of the
  // other view goes bottom-right.
  // …and the headstock with its tuners is the rectangle the inset keeps off,
  // whatever the page does to the fit (a live strip's band moves it down).
  const insetKeepClear: NonNullable<InstrumentModel['insetKeepClear']> = {};
  for (const [vid, sc] of Object.entries(built.scenes)) {
    const u0 = sc.g.L - 30;
    const u1 = sc.g.L + sc.variant.spec.neck.headLen.mm + 10;
    const faceKeep = { u0, u1, v0: -HEAD_REACH, v1: HEAD_REACH };
    const edgeKeep = sc.o.lap ? { u0, u1, v0: -50, v1: 70 } : { u0, u1, v0: -70, v1: 40 };
    insetKeepClear[vid] = sc.o.lap ? { side: edgeKeep, top: faceKeep } : { side: faceKeep, top: edgeKeep };
  }
  const model: InstrumentModel = { ...built.model, viewsByVariant, views: viewsByVariant[built.model.defaultVariant]!, insetAt, insetKeepClear };
  return { model, scenes: built.scenes };
}

/* ── zones ── */

const DEG = Math.PI / 180;
/** az / el for an aim vector (aimVec = (−cos az cos el, −sin el, sin az cos el)). */
export function azElOf(a: Vec3): { az: number; el: number } {
  const l = Math.hypot(a.x, a.y, a.z);
  const u = { x: a.x / l, y: a.y / l, z: a.z / l };
  const el = -Math.asin(Math.max(-1, Math.min(1, u.y))) / DEG;
  const az = Math.atan2(u.z, -u.x) / DEG;
  return { az, el };
}
/** A pose at `p` (engine frame) aimed at `target`. */
export function poseAimedAt(p: Vec3, target: Vec3): MicPose {
  return { p, ...azElOf({ x: target.x - p.x, y: target.y - p.y, z: target.z - p.z }) };
}

export type ZoneSpec = {
  id: string;
  label: string;
  band: string;
  kind: 'sourced' | 'trial';
  src: string;
  quote: string;
  bandProv?: Provenance;
  /** The surface id WITHOUT the variant prefix ('fret12', 'hole', …). */
  surface: string;
  /** Band along the surface normal (mm). */
  distance: { min: number; max: number };
  /** The radial band from the surface's own line (mm). */
  radial?: { max: number; prov: Provenance };
  /** Aimed at the surface point within r (mm) — or at another surface's
   *  (`surface`, a short id: a clip by the tailpiece aimed at the bridge). */
  aimAtR?: { r: number; prov: Provenance; surface?: string };
  /** Front axis within this many degrees of the surface's −normal. */
  aimMax?: { deg: number; prov: Provenance };
  micTypeIds: string[];
  /** Start: offset in G (x, y) from the surface point, and the distance along the normal. */
  start: { dx?: number; dy?: number; d: number; aimAt?: Vec3 };
  /** A box the front must lie in (frame G), e.g. "between the joint and the hole". */
  boxG?: { min: Vec3; max: Vec3; prov: Provenance };
  tendency: string;
  checks: string[];
};

/** A recommended starting point for one variant, from its scene. */
export function zoneFor(sc: GuitarScene, z: ZoneSpec): DocumentedZone {
  const vid = sc.variant.id;
  const P = sc.o.P;
  const surfP = surfacePointG(sc, z.surface);
  const N = P(v(0, 0, 1));
  const gStart = v(surfP.x + (z.start.dx ?? 0), surfP.y + (z.start.dy ?? 0), surfP.z + z.start.d);
  const target = z.start.aimAt ?? surfP;
  const start = poseAimedAt(P(gStart), P(target));
  // Drawn: the band as a box in G (± the radial band across, the distance
  // band out from the surface), projected into each view.
  const r = z.radial?.max ?? 60;
  const bxG = z.boxG ?? { min: v(surfP.x - r, surfP.y - r, surfP.z + z.distance.min), max: v(surfP.x + r, surfP.y + r, surfP.z + z.distance.max) };
  const eb = sc.o.box({ min: bxG.min, max: bxG.max });
  const drawn: Partial<Record<ViewId, ZoneDraw>> = {
    side: { u0: eb.min.x, u1: eb.max.x, v0: eb.min.y, v1: eb.max.y },
    top: { u0: eb.min.x, u1: eb.max.x, v0: eb.min.z, v1: eb.max.z },
  };
  return {
    id: `${z.id}.${vid}`,
    label: z.label,
    band: z.band,
    kind: z.kind,
    src: z.src,
    quote: z.quote,
    ...(z.bandProv ? { bandProv: z.bandProv } : {}),
    refSurface: pid(vid, z.surface),
    side: 'outside',
    distance: z.distance,
    ...(z.radial ? { radial: { line: pid(vid, `${z.surface}Line`), max: z.radial.max, prov: z.radial.prov } } : {}),
    requires: { variant: vid, micTypeIds: z.micTypeIds },
    ...(z.aimAtR ? { aimAt: { surface: pid(vid, z.aimAtR.surface ?? z.surface), r: z.aimAtR.r, prov: z.aimAtR.prov } } : {}),
    ...(z.aimMax ? { aim: { maxOffAxis: z.aimMax.deg, prov: z.aimMax.prov } } : {}),
    ...(z.boxG ? { box: { ...sc.o.box({ min: z.boxG.min, max: z.boxG.max }), prov: z.boxG.prov } } : {}),
    drawn,
    start,
    tendency: z.tendency,
    checks: z.checks,
  };
  void N;
}

/** A surface's point in frame G, by its short id. */
export function surfacePointG(sc: GuitarScene, sid: string): Vec3 {
  const sp = sc.variant.spec;
  switch (sid) {
    case 'fret12':
      return sc.at.fret12;
    case 'joint':
      return sc.at.joint;
    case 'hole':
      return sp.body.pot ? v(sp.body.pot.cx.mm, 0, 0) : sc.at.hole;
    case 'bridge':
      return sc.at.bridge;
    case 'upper':
      return sc.at.upperTreble;
    default:
      return sc.at.top;
  }
}

export const partIdOf = pid;
