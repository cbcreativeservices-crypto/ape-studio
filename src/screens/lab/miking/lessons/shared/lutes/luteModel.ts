/**
 * THE SHARED LUTE FAMILY — where things are (charter §2 layer 2). Builds the
 * InstrumentModel of an oud, a sitar or a Saraswati veena from luteSpec.ts and
 * a playing POSTURE, so the drawing, the hit areas, the collision solids, the
 * reference surfaces and the zones all come from the SAME numbers.
 *
 * FRAMES. Each instrument is built in its own frame (origin at the main
 * bridge on the soundboard, +x along the strings toward the pegs, +y across
 * the board, +z out of the board) and mapped into the ENGINE frame (+x to the
 * player's left, +y down, +z toward the audience) by its posture:
 *   • OUD   — seated on a chair, the bowl on the right thigh, the face to the
 *             audience, the neck to the player's left: engine = instrument
 *             (the guitar family's upright frame G).
 *   • SITAR — seated on the floor, the gourd on the left foot's sole, the
 *             neck rising about 45° to the player's left, the board facing
 *             the audience: a rotation about z.
 *   • VEENA — seated cross-legged, the resonator on the floor at the
 *             player's right, the neck across the lap to the left resting on
 *             the left thigh by its gourd, the face angled up and partly
 *             toward the player: a tilt about x, then a small rise about z.
 * The engine's SIDE view (x, y) is then the FRONT of the scene as the
 * audience sees it; its TOP view (x, z) the scene from above.
 *
 * The player is drawn and kept clear as ILLUSTRATIVE envelopes (no source
 * gives a player's geometry; each proposal names the hand boxes as drawing
 * defaults). Pure: no React.
 */
import type { Dim, DocumentedZone, Envelope, InstrumentModel, MicPose, Part, Provenance, ReferenceSurface, RefLine, Shape3, Vec3, ViewBox, ViewId, ZoneDraw } from '../../../engine/model/types.ts';
import { dd, oudGeom, OUD, sitarGeom, SITAR, veenaGeom, VEENA, type OudGeom, type SitarGeom, type VeenaGeom } from './luteSpec.ts';
import { poseAimedAt } from '../guitars/guitarModel.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const PLAYER = ill('no source gives a player’s geometry (the proposals’ hand boxes are drawing defaults)');
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
type Box = { min: Vec3; max: Vec3 };

export type LuteKind = 'oud' | 'sitar' | 'veena';

/** The posture's mapping from the instrument frame into the engine frame. */
export type Posture = { P: (p: Vec3) => Vec3; D: (d: Vec3) => Vec3 };

export function postureOf(kind: LuteKind): Posture {
  if (kind === 'oud') return { P: (p) => p, D: (d) => d };
  if (kind === 'sitar') {
    const t = SITAR.neckDeg.mm * DEG;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const D = (d: Vec3): Vec3 => v(c * d.x + s * d.y, -s * d.x + c * d.y, d.z);
    return { P: D, D };
  }
  const a = VEENA.faceTiltDeg.mm * DEG;
  const f = VEENA.neckRiseDeg.mm * DEG;
  const D = (d: Vec3): Vec3 => {
    // Tilt: +y across toward the audience (rising a little), +z up and toward the player.
    const x = d.x;
    const y = -Math.sin(a) * d.y - Math.cos(a) * d.z;
    const z = Math.cos(a) * d.y - Math.sin(a) * d.z;
    // Rise: the neck end (+x) lifts.
    return v(x * Math.cos(f) + y * Math.sin(f), -x * Math.sin(f) + y * Math.cos(f), z);
  };
  return { P: D, D };
}

/** The player's figure and keep-outs, in the ENGINE frame. */
export type LuteFit = {
  seat: 'chair' | 'floor';
  head: { c: Vec3; r: number };
  mouth: Vec3;
  shoulderR: Vec3;
  shoulderL: Vec3;
  hipY: number;
  torso: Box;
  legs: Box;
  /** The plucking hand (risha, mizrab, fingers) and its keep-out. */
  pluckHand: Vec3;
  pluckBox: Box;
  elbowR: Vec3;
  /** The fretting / stopping hand along the neck and its keep-out. */
  fretHand: Vec3;
  fretBox: Box;
  elbowL: Vec3;
  /** Knees (the floor-seated postures) for the drawing. */
  kneeR: Vec3;
  kneeL: Vec3;
};

export type LuteScene = {
  kind: LuteKind;
  posture: Posture;
  /** The face's outward normal, engine frame. */
  N: Vec3;
  floorY: number;
  fit: LuteFit;
  /** Named points, instrument frame. */
  at: Record<string, Vec3>;
  oud?: OudGeom;
  sitar?: SitarGeom;
  veena?: VeenaGeom;
};

/** Bounding box of engine points. */
function bbox(pts: Vec3[], pad = 0): Box {
  const min = v(Infinity, Infinity, Infinity);
  const max = v(-Infinity, -Infinity, -Infinity);
  for (const p of pts) {
    min.x = Math.min(min.x, p.x - pad);
    min.y = Math.min(min.y, p.y - pad);
    min.z = Math.min(min.z, p.z - pad);
    max.x = Math.max(max.x, p.x + pad);
    max.y = Math.max(max.y, p.y + pad);
    max.z = Math.max(max.z, p.z + pad);
  }
  return { min, max };
}
/** An instrument-frame box's corners, mapped, boxed (engine). */
function mappedBox(P: Posture['P'], b: Box, pad = 0): Box {
  const pts: Vec3[] = [];
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(P(v(x, y, z)));
  return bbox(pts, pad);
}

/** Points on a half-ellipsoid bowl (instrument frame) below z = 0, for the
 *  floor and the drawing's silhouettes. */
export function bowlPoints(cx: number, a: number, c: number, zc = 0, zTop = 0, n = 18): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const zz = zTop - ((zTop - (zc - c)) * i) / n;
    const r = a * Math.sqrt(Math.max(0, 1 - ((zz - zc) / c) ** 2));
    for (let k = 0; k < 24; k++) {
      const t = (k / 24) * Math.PI * 2;
      out.push(v(cx + r * Math.cos(t), r * Math.sin(t), zz));
    }
  }
  return out;
}

/* ════════════════════════════ scenes per instrument ════════════════════════════ */

export function oudScene(): LuteScene {
  const g = oudGeom();
  const posture = postureOf('oud');
  const floorY = dd(700, 'seated on a chair: the face’s centre line above the floor').mm;
  const hm = g.halfMax;
  const D = OUD.bowlDepth.mm;
  const head = { c: v(200, -(hm + 270), -D - 120), r: 110 };
  const fit: LuteFit = {
    seat: 'chair',
    head,
    mouth: v(head.c.x, head.c.y + 60, head.c.z + 100),
    shoulderR: v(head.c.x - 200, head.c.y + 170, head.c.z - 10),
    shoulderL: v(head.c.x + 200, head.c.y + 170, head.c.z - 10),
    hipY: hm + 30,
    torso: { min: v(head.c.x - 260, head.c.y + 80, -D - 330), max: v(head.c.x + 260, hm + 40, -D - 10) },
    legs: { min: v(-240, hm + 10, -D - 380), max: v(560, floorY, 300) },
    // The risha's arc (proposal env.oud.risha: x −60…+140, z 0…110).
    pluckHand: v(60, 20, 70),
    pluckBox: { min: v(-60, -120, 0), max: v(140, 120, 110) },
    elbowR: v(-70, -hm + 20, 30),
    fretHand: v(520, 40, 10),
    fretBox: { min: v(g.joint, -70, -90), max: v(g.nut + 20, 100, 110) },
    elbowL: v(g.joint + 70, hm - 20, -120),
    kneeR: v(-60, hm + 60, 260),
    kneeL: v(300, hm + 60, 260),
  };
  return {
    kind: 'oud',
    posture,
    N: v(0, 0, 1),
    floorY,
    fit,
    at: {
      bridge: v(0, 0, 0),
      face: v(175, 0, 0),
      rose: v(OUD.roseMainX.mm, 0, 0),
      upper: v((OUD.roseMainX.mm + OUD.roseMainD.mm / 2 + g.joint) / 2, 0, 0),
      joint: v(g.joint, 0, 0),
      nut: v(g.nut, 0, OUD.stringH.mm),
    },
    oud: g,
  };
}

export function sitarScene(): LuteScene {
  const g = sitarGeom();
  const posture = postureOf('sitar');
  const P = posture.P;
  // The floor: under the gourd's lowest point, with the foot it rests on (DERIVED).
  const lowest = Math.max(...bowlPoints(g.gourd.cx, g.gourd.a, g.gourd.c, g.gourd.zc, 0, 10).map((p) => P(p).y));
  const floorY = lowest + SITAR.foot.mm;
  const head = { c: v(160, floorY - 790, -470), r: 105 };
  const pluck = P(v(140, 0, 50));
  const fitPluck = mappedBox(P, { min: v(20, -60, 0), max: v(260, 60, 100) });
  const fret0 = P(v(380, -60, -40));
  const fret1 = P(v(820, 60, 110));
  const fit: LuteFit = {
    seat: 'floor',
    head,
    mouth: v(head.c.x, head.c.y + 60, head.c.z + 100),
    shoulderR: v(head.c.x - 200, head.c.y + 175, head.c.z + 10),
    shoulderL: v(head.c.x + 200, head.c.y + 175, head.c.z + 10),
    hipY: floorY - 120,
    torso: { min: v(head.c.x - 250, head.c.y + 85, -640), max: v(head.c.x + 250, floorY - 110, -330) },
    legs: { min: v(-360, floorY - 170, -600), max: v(560, floorY, 170) },
    pluckHand: pluck,
    // The mizrab's arc (proposal env.st.mizrab: x +20…+260, z 0…100), boxed.
    pluckBox: fitPluck,
    elbowR: v(-170, -150, -60),
    fretHand: P(v(560, 0, 30)),
    fretBox: { min: v(Math.min(fret0.x, fret1.x), Math.min(fret0.y, fret1.y), -60), max: v(Math.max(fret0.x, fret1.x), Math.max(fret0.y, fret1.y), 110) },
    elbowL: v(560, -200, -300),
    kneeR: v(-200, floorY - 110, 100),
    kneeL: v(480, floorY - 110, 60),
  };
  return {
    kind: 'sitar',
    posture,
    N: v(0, 0, 1),
    floorY,
    fit,
    at: {
      bridge: v(0, 0, 0),
      jawari: v(0, 0, SITAR.jawariH.mm),
      lower: v(-90, 0, 0),
      board: v(g.gourd.cx, 0, 0),
      neck: v(300, 0, 0),
      nut: v(g.nut, 0, g.stringZ(g.nut)),
    },
    sitar: g,
  };
}

export function veenaScene(): LuteScene {
  const g = veenaGeom();
  const posture = postureOf('veena');
  const P = posture.P;
  // The resonator rests on the floor (DERIVED: its lowest point).
  const floorY = Math.max(...bowlPoints(g.bowl.cx, g.bowl.a, g.bowl.c, g.bowl.zc, 0).map((p) => P(p).y));
  const N = posture.D(v(0, 0, 1));
  const head = { c: v(330, floorY - 780, -400), r: 105 };
  const pluck = P(v(120, 0, 40));
  const fp0 = P(v(400, -50, -30));
  const fp1 = P(v(830, 50, 110));
  const fit: LuteFit = {
    seat: 'floor',
    head,
    mouth: v(head.c.x, head.c.y + 60, head.c.z + 100),
    shoulderR: v(head.c.x - 205, head.c.y + 175, head.c.z + 10),
    shoulderL: v(head.c.x + 205, head.c.y + 175, head.c.z + 10),
    hipY: floorY - 120,
    torso: { min: v(head.c.x - 255, head.c.y + 85, -560), max: v(head.c.x + 255, floorY - 110, -250) },
    legs: { min: v(-20, floorY - 160, -560), max: v(860, floorY, 110) },
    pluckHand: pluck,
    // The plucking hand's arc (proposal env.vn.pluck: x −20…+200, z 0…100), boxed.
    pluckBox: mappedBox(P, { min: v(-20, -55, 0), max: v(200, 55, 100) }),
    elbowR: v(-70, -130, -140),
    fretHand: P(v(600, 0, 30)),
    fretBox: { min: v(Math.min(fp0.x, fp1.x), Math.min(fp0.y, fp1.y), Math.min(fp0.z, fp1.z) - 30), max: v(Math.max(fp0.x, fp1.x), Math.max(fp0.y, fp1.y), Math.max(fp0.z, fp1.z) + 30) },
    elbowL: v(700, -150, -330),
    kneeR: v(60, floorY - 100, 40),
    kneeL: v(640, floorY - 100, 40),
  };
  return {
    kind: 'veena',
    posture,
    N,
    floorY,
    fit,
    at: {
      bridge: v(0, 0, 0),
      plate: v(-110, 0, 0),
      top: v(g.bowl.cx, 0, 0),
      neck: v(150, 0, 0),
      tala: v(40, g.neck.half + 18, 0),
      nut: v(g.nut, 0, g.stringZ(g.nut)),
    },
    veena: g,
  };
}

export function sceneOfKind(kind: LuteKind): LuteScene {
  return kind === 'oud' ? oudScene() : kind === 'sitar' ? sitarScene() : veenaScene();
}

/* ════════════════════════════ the model ════════════════════════════ */

export type PartWords = { label: string; short: string; role: string };

export type BuiltLute = { model: InstrumentModel; scene: LuteScene };

const pid = (k: LuteKind, part: string) => `${k}.${part}`;
export const partIdOfLute = pid;

/** Slabs stacked along an axis: a truncated ellipsoid (a gourd, a bowl). */
function bowlSlabs(sc: LuteScene, cx: number, a: number, c: number, zc: number, zTop: number, n: number): Shape3[] {
  const out: Shape3[] = [];
  const axis = sc.posture.D(v(0, 0, 1));
  const zBot = zc - c;
  for (let i = 0; i < n; i++) {
    const z0 = zTop - ((zTop - zBot) * i) / n;
    const z1 = zTop - ((zTop - zBot) * (i + 1)) / n;
    const zm = (z0 + z1) / 2;
    const r = a * Math.sqrt(Math.max(0, 1 - ((Math.max(z1, Math.min(z0, zc)) - zc) / c) ** 2));
    if (r < 4) continue;
    void zm;
    out.push({ kind: 'slab', c: sc.posture.P(v(cx, 0, 0)), axis, r, x0: z1, x1: z0 });
  }
  return out;
}

export function buildLute(kind: LuteKind, words: Record<string, PartWords>, name: string): BuiltLute {
  const sc = sceneOfKind(kind);
  const P = sc.posture.P;
  const parts: Part[] = [];
  const envelopes: Envelope[] = [];
  const surfaces: ReferenceSurface[] = [];
  const lines: RefLine[] = [];
  const regions: InstrumentModel['regions'] = [];
  const prov = ill('drawing defaults (luteSpec.ts)');
  const W = (key: string): PartWords => words[key] ?? { label: key, short: key, role: '' };
  const add = (key: string, solid?: Shape3, extra: Partial<Part> = {}) => parts.push({ id: pid(kind, key), ...W(key), ...(solid ? { solid } : {}), prov, ...extra });
  const hidden = (key: string, i: number, solid: Shape3, extra: Partial<Part> = {}) => parts.push({ id: pid(kind, `${key}${i}`), ...W(key), solid, listIn: [], prov, ...extra });
  const boxE = (b: Box): Shape3 => ({ kind: 'box', ...b });
  const cap = (a: Vec3, b: Vec3, r: number): Shape3 => ({ kind: 'capsule', a: P(a), b: P(b), r });
  const faceClear: Dim = dd(8, 'face motion and finish');
  const stringClear: Dim = dd(10, 'string motion and the plucking hand');

  if (kind === 'oud') {
    const g = sc.oud!;
    // The body: slices along x, face to bowl (collision only).
    const n = 14;
    for (let i = 0; i < n; i++) {
      const x0 = g.tail + ((g.joint - g.tail) * i) / n;
      const x1 = g.tail + ((g.joint - g.tail) * (i + 1)) / n;
      let h = 0;
      let d = 0;
      for (let k = 0; k <= 4; k++) {
        const x = x0 + ((x1 - x0) * k) / 4;
        h = Math.max(h, g.half(x));
        d = Math.max(d, g.depth(x));
      }
      if (h < 2) continue;
      hidden('face', i, boxE({ min: v(x0, -h, -d), max: v(x1, h, 0) }), { moving: true, clearance: faceClear });
    }
    add('face', undefined, { moving: true });
    add('roseMain');
    add('roseSmall');
    add('bridge', boxE({ min: v(-OUD.bridgeL.mm / 2, -OUD.bridgeW.mm / 2, 0), max: v(OUD.bridgeL.mm / 2, OUD.bridgeW.mm / 2, OUD.bridgeH.mm) }), { clearance: dd(6, 'bridge keep-off') });
    add('strings', boxE({ min: v(6, -OUD.spreadBridge.mm / 2 - 3, OUD.stringH.mm - 3), max: v(g.nut, OUD.spreadBridge.mm / 2 + 3, OUD.stringH.mm + 3) }), { moving: true, clearance: stringClear });
    add('board', boxE({ min: v(OUD.boardEnd.mm, -g.boardHalf(OUD.boardEnd.mm), 0), max: v(g.nut, g.boardHalf(OUD.boardEnd.mm), 8) }));
    add('neck', boxE({ min: v(g.joint, -g.boardHalf(g.joint), -34), max: v(g.nut, g.boardHalf(g.joint), 4) }));
    const pe = g.pegboxEnd;
    add('pegbox', { kind: 'capsule', a: v(g.nut + 10, 0, OUD.stringH.mm - 14), b: v(pe.x, 0, pe.z), r: 34 });
    add('bowl');
    const f = sc.fit;
    envelopes.push(
      { id: 'oud.env.risha', label: 'the risha hand', shape: boxE(f.pluckBox), prov: PLAYER },
      { id: 'oud.env.arm', label: 'the plucking arm', shape: { kind: 'capsule', a: f.elbowR, b: f.pluckHand, r: 42 }, prov: PLAYER },
      { id: 'oud.env.fret', label: 'the left hand on the neck', shape: boxE(f.fretBox), prov: PLAYER },
      { id: 'oud.env.pegbox', label: 'the pegbox’s swing', shape: { kind: 'capsule', a: sc.at.nut, b: sc.at.nut, r: 250 }, prov: ill('proposal: "pegbox travel arc r 250 around the nut" — a drawing default') },
      { id: 'oud.env.torso', label: 'the player', shape: boxE(f.torso), prov: PLAYER },
      { id: 'oud.env.head', label: 'the player’s head', shape: { kind: 'capsule', a: f.head.c, b: f.head.c, r: f.head.r }, prov: PLAYER },
      { id: 'oud.env.legs', label: 'the player’s legs', shape: boxE(f.legs), prov: PLAYER },
    );
    const reg = (id: string, partId: string, label: string, p: Vec3, note: string) => regions.push({ id: pid(kind, id), partId: pid(kind, partId), label, anchor: P(p), prov: ill('a point chosen to stand for the region'), note });
    reg('face', 'face', 'the face round the bridge', v(60, 0, 2), 'The thin face round the bridge moves the most: much of the oud’s sound leaves from here, toward the listener and a mic in front.');
    reg('roses', 'roseMain', 'the rosettes', v(OUD.roseMainX.mm, 0, 2), 'The air inside the bowl breathes through the three rosettes — a big part of the low, warm bloom. Close to the main rose, a mic hears more of it.');
    reg('strings', 'strings', 'the strings near the neck', v(g.joint, 0, OUD.stringH.mm + 2), 'The strings, the risha’s click and the left hand’s slides are heard most directly toward the neck.');
  }

  if (kind === 'sitar') {
    const g = sc.sitar!;
    // The gourd: a truncated ellipsoid behind the tabli, as slabs.
    bowlSlabs(sc, g.gourd.cx, g.gourd.a, g.gourd.c, g.gourd.zc, 0, 7).forEach((s, i) => hidden('gourd', i, s, { clearance: dd(10, 'the gourd’s keep-off') }));
    add('tabli', { kind: 'slab', c: P(v(g.gourd.cx, 0, 0)), axis: sc.posture.D(v(0, 0, 1)), r: g.tabliR, x0: -4, x1: 2 }, { moving: true, clearance: faceClear });
    add('gourd');
    add('jawari', cap(v(0, -SITAR.jawariW.mm / 2, 10), v(0, SITAR.jawariW.mm / 2, 10), 14), { clearance: dd(6, 'bridge keep-off') });
    add('tarafBridge', cap(v(SITAR.tarafBridgeX.mm, -30, 6), v(SITAR.tarafBridgeX.mm, 30, 6), 7));
    add('strings', cap(v(8, 0, 24), v(g.nut, 0, 28), 16), { moving: true, clearance: stringClear });
    add('sympathetic');
    add('frets', cap(v(g.frets[g.frets.length - 1], 0, 6), v(g.frets[0], 0, 6), 26));
    add('neck', cap(v(g.neck.x0, 0, -26), v(g.neck.x1, 0, -26), g.neck.half));
    add('pegs');
    add('upperGourd', { kind: 'capsule', a: P(v(g.upperGourd.x, 0, g.upperGourd.z)), b: P(v(g.upperGourd.x, 0, g.upperGourd.z)), r: g.upperGourd.r });
    const f = sc.fit;
    envelopes.push(
      { id: 'sitar.env.mizrab', label: 'the mizrab hand', shape: boxE(f.pluckBox), prov: PLAYER },
      { id: 'sitar.env.arm', label: 'the plucking arm', shape: { kind: 'capsule', a: f.elbowR, b: f.pluckHand, r: 42 }, prov: PLAYER },
      { id: 'sitar.env.fret', label: 'the left hand along the neck', shape: boxE(f.fretBox), prov: PLAYER },
      { id: 'sitar.env.torso', label: 'the player', shape: boxE(f.torso), prov: PLAYER },
      { id: 'sitar.env.head', label: 'the player’s head', shape: { kind: 'capsule', a: f.head.c, b: f.head.c, r: f.head.r }, prov: PLAYER },
      { id: 'sitar.env.legs', label: 'the player’s crossed legs', shape: boxE(f.legs), prov: PLAYER },
    );
    const reg = (id: string, partId: string, label: string, p: Vec3, note: string) => regions.push({ id: pid(kind, id), partId: pid(kind, partId), label, anchor: P(p), prov: ill('a point chosen to stand for the region'), note });
    reg('tabli', 'tabli', 'the soundboard (tabli)', v(-70, 0, 2), 'The thin soundboard on the gourd, driven through the broad bridge: much of the sitar’s sound leaves from here, toward a mic in front.');
    reg('jawari', 'jawari', 'the broad bridge', v(0, 0, 24), 'The strings graze the bridge’s broad, curved top as they swing — the bright, buzzing edge the player shapes. It is heard most directly close in.');
    reg('taraf', 'sympathetic', 'the sympathetic strings', v(420, 0, 8), 'Under the frets, the sympathetic strings ring on when a played note matches their tuning — a shimmer that keeps going after the note.');
  }

  if (kind === 'veena') {
    const g = sc.veena!;
    bowlSlabs(sc, g.bowl.cx, g.bowl.a, g.bowl.c, g.bowl.zc, 0, 7).forEach((s, i) => hidden('resonator', i, s, { clearance: dd(10, 'the resonator’s keep-off') }));
    add('plate', { kind: 'slab', c: P(v(g.bowl.cx, 0, 0)), axis: sc.posture.D(v(0, 0, 1)), r: g.plateR, x0: -4, x1: 2 }, { moving: true, clearance: faceClear });
    add('resonator');
    add('bridge', cap(v(0, -VEENA.bridgeW.mm / 2, 8), v(0, VEENA.bridgeW.mm / 2 + 30, 8), 13), { clearance: dd(6, 'bridge keep-off') });
    add('strings', cap(v(8, 0, 18), v(g.nut, 0, 20), 16), { moving: true, clearance: stringClear });
    add('frets', cap(v(g.frets[g.frets.length - 1], 0, 6), v(g.frets[0], 0, 6), g.neck.half));
    add('neck', cap(v(g.neck.x0, 0, -30), v(g.neck.x1, 0, -30), g.neck.half));
    add('tala');
    add('pegs');
    add('gourd', { kind: 'capsule', a: P(v(g.gourd.x, 0, g.gourd.z)), b: P(v(g.gourd.x, 0, g.gourd.z)), r: g.gourd.r });
    add('yali', cap(v(g.nut + 20, 0, -20), v(g.tip - 50, 0, -60), 50));
    const f = sc.fit;
    envelopes.push(
      { id: 'veena.env.pluck', label: 'the plucking hand', shape: boxE(f.pluckBox), prov: PLAYER },
      { id: 'veena.env.arm', label: 'the plucking arm', shape: { kind: 'capsule', a: f.elbowR, b: f.pluckHand, r: 42 }, prov: PLAYER },
      { id: 'veena.env.fret', label: 'the left hand along the neck', shape: boxE(f.fretBox), prov: PLAYER },
      { id: 'veena.env.torso', label: 'the player', shape: boxE(f.torso), prov: PLAYER },
      { id: 'veena.env.head', label: 'the player’s head', shape: { kind: 'capsule', a: f.head.c, b: f.head.c, r: f.head.r }, prov: PLAYER },
      { id: 'veena.env.legs', label: 'the player’s crossed legs', shape: boxE(f.legs), prov: PLAYER },
    );
    const reg = (id: string, partId: string, label: string, p: Vec3, note: string) => regions.push({ id: pid(kind, id), partId: pid(kind, partId), label, anchor: P(p), prov: ill('a point chosen to stand for the region'), note });
    reg('plate', 'plate', 'the top plate', v(-90, 0, 2), 'The top plate over the big resonator, driven through the bridge: in the measured radiation it mattered most, and the pattern changed with pitch, direction and distance.');
    reg('bridge', 'bridge', 'the flat bridge', v(0, 0, 18), 'The strings vibrate against the broad, flat bridge — the buzz the player intends. Close in, it is heard most directly.');
    reg('gourd', 'gourd', 'the neck-end gourd', v(g.gourd.x, 0, g.gourd.z), 'A support for the neck on the thigh — not a second main soundboard. Do not expect it to radiate like the top plate.');
  }

  // Reference surfaces (unit normals) and their lines (each surface's radial
  // readout is measured from the line through its point along the normal).
  const N = sc.N;
  const out = { words: 'out from', key: 'OUT FROM' };
  const behind = { words: 'behind', key: 'BEHIND' };
  const surf = (id: string, partKey: string, label: string, lineLabel: string) => {
    const point = P(sc.at[id]);
    surfaces.push({ id: pid(kind, id), partId: pid(kind, partKey), label, point, normal: N, plus: out, minus: behind });
    lines.push({ id: pid(kind, `${id}Line`), label: lineLabel, point, dir: N, surfaces: [pid(kind, id)] });
  };
  if (kind === 'oud') {
    surf('upper', 'face', 'the upper face, between the main rose and the neck', 'the upper-face line');
    surf('face', 'face', 'the face', 'the face’s line');
    surf('rose', 'roseMain', 'the main rose', 'the main rose’s line');
    surf('joint', 'neck', 'the neck joint', 'the neck-joint line');
    surf('bridge', 'bridge', 'the bridge', 'the bridge line');
  } else if (kind === 'sitar') {
    surf('lower', 'tabli', 'the lower soundboard, below the bridge', 'the lower-board line');
    surf('bridge', 'jawari', 'the main bridge', 'the bridge line');
    surf('neck', 'neck', 'the neck, above the gourd', 'the neck line');
    surf('board', 'tabli', 'the soundboard (tabli)', 'the board’s centre line');
  } else {
    surf('plate', 'plate', 'the top plate, between the bridge and the body', 'the top-plate line');
    surf('bridge', 'bridge', 'the main bridge', 'the bridge line');
    surf('top', 'plate', 'the top plate’s centre', 'the plate’s centre line');
  }

  const views = viewsFor(sc);
  const interior =
    kind === 'oud'
      ? { x0: 1, x1: OUD.bowlDepth.mm - 10, rIn: 120, c: v(sc.oud!.widest, 0, 0), axis: v(0, 0, -1) }
      : kind === 'sitar'
        ? { x0: 1, x1: SITAR.gourdDepth.mm - 20, rIn: sc.sitar!.tabliR - 10, c: P(v(sc.sitar!.gourd.cx, 0, 0)), axis: sc.posture.D(v(0, 0, -1)) }
        : { x0: 1, x1: VEENA.resonatorDepth.mm - 20, rIn: sc.veena!.plateR - 10, c: P(v(sc.veena!.bowl.cx, 0, 0)), axis: sc.posture.D(v(0, 0, -1)) };
  const model: InstrumentModel = {
    id: kind,
    name,
    parts,
    regions,
    surfaces,
    lines,
    envelopes,
    variants: [{ id: kind, label: kind.toUpperCase(), blurb: '' }],
    defaultVariant: kind,
    views,
    yFloor: dd(sc.floorY, 'the floor under the seated player (drawing default)'),
    interior,
    rims: [],
    ports: { [kind]: null },
    // A mic FACING the instrument: along −z (the oud and the sitar face the
    // audience); down and back onto the veena's upturned face.
    aimHome: kind === 'veena' ? { az: -90, el: -55 } : { az: -90, el: 0 },
  };
  return { model, scene: sc };
}

/** The views: the instrument and the player's upper body, with room for the mics. */
export function viewsFor(sc: LuteScene): Partial<Record<ViewId, ViewBox>> {
  const f = sc.fit;
  if (sc.kind === 'oud') {
    const g = sc.oud!;
    return {
      side: { u0: f.torso.min.x - 80, u1: g.pegboxEnd.x + 160, v0: f.head.c.y - f.head.r - 30, v1: g.halfMax + 240 },
      top: { u0: f.torso.min.x - 80, u1: g.pegboxEnd.x + 160, v0: f.torso.min.z - 30, v1: 680 },
    };
  }
  if (sc.kind === 'sitar') {
    const top = sc.posture.P(v(sc.sitar!.top, 0, 0));
    return {
      side: { u0: -420, u1: top.x + 120, v0: Math.min(top.y, f.head.c.y - f.head.r) - 130, v1: sc.floorY + 30 },
      top: { u0: -420, u1: top.x + 120, v0: f.torso.min.z - 30, v1: 680 },
    };
  }
  const tip = sc.posture.P(v(sc.veena!.tip, 0, 0));
  return {
    side: { u0: -420, u1: tip.x + 120, v0: f.head.c.y - f.head.r - 60, v1: sc.floorY + 30 },
    top: { u0: -420, u1: tip.x + 120, v0: f.torso.min.z - 30, v1: 720 },
  };
}

/* ════════════════════════════ zones ════════════════════════════ */

export type LuteZoneSpec = {
  id: string;
  label: string;
  band: string;
  kind: 'sourced' | 'trial';
  src: string;
  quote: string;
  bandProv?: Provenance;
  /** The surface's short id ('upper', 'bridge', …). */
  surface: string;
  distance: { min: number; max: number };
  radial?: { max: number; prov: Provenance };
  aimAt?: { surface: string; r: number; prov: Provenance };
  aim?: { maxOffAxis: number; minOffAxis?: number; prov: Provenance };
  box?: { min: Vec3; max: Vec3; prov: Provenance };
  micTypeIds: string[];
  /** Start: a point and a target, INSTRUMENT frame. */
  start: { p: Vec3; aimAt: Vec3 };
  /** The drawn band's half-size across the face (mm, default 90). */
  drawHalf?: number;
  tendency: string;
  checks: string[];
};

export function luteZone(sc: LuteScene, z: LuteZoneSpec): DocumentedZone {
  const P = sc.posture.P;
  const D = sc.posture.D;
  const sp = sc.at[z.surface];
  const r = z.drawHalf ?? z.radial?.max ?? 90;
  // Drawn: the band as a box in the instrument frame (± r across the face,
  // the distance band out from it), mapped and boxed per view.
  const corners: Vec3[] = [];
  for (const dx of [-r, r]) for (const dy of [-r, r]) for (const dz of [z.distance.min, z.distance.max]) corners.push(P(v(sp.x + dx, sp.y + dy, sp.z + dz)));
  const b = bbox(corners);
  const drawn: Partial<Record<ViewId, ZoneDraw>> = {
    side: { u0: b.min.x, u1: b.max.x, v0: b.min.y, v1: b.max.y },
    top: { u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z },
  };
  void D;
  const start: MicPose = poseAimedAt(P(z.start.p), P(z.start.aimAt));
  return {
    id: z.id,
    label: z.label,
    band: z.band,
    kind: z.kind,
    src: z.src,
    quote: z.quote,
    ...(z.bandProv ? { bandProv: z.bandProv } : {}),
    refSurface: pid(sc.kind, z.surface),
    side: 'outside',
    distance: z.distance,
    ...(z.radial ? { radial: { line: pid(sc.kind, `${z.surface}Line`), max: z.radial.max, prov: z.radial.prov } } : {}),
    requires: { variant: sc.kind, micTypeIds: z.micTypeIds },
    ...(z.aimAt ? { aimAt: { surface: pid(sc.kind, z.aimAt.surface), r: z.aimAt.r, prov: z.aimAt.prov } } : {}),
    ...(z.aim ? { aim: z.aim } : {}),
    ...(z.box ? { box: z.box } : {}),
    drawn,
    start,
    tendency: z.tendency,
    checks: z.checks,
  };
}
