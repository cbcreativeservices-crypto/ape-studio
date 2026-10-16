/**
 * A11 ACCORDION — the look (charter §2 layer 3), drawn ONLY from model.ts's
 * sizes, per bellows state, in millimetres of each view:
 *   side   u = x, v = y — from the player's RIGHT: the player in profile,
 *          the treble side's keyboard face-on with the right hand on it,
 *          the grille edge-on at the front, the bass side and bellows
 *          showing where they rise behind
 *   top    u = x, v = z — from above: the treble side and its keyboard, the
 *          bellows fanning out, the bass side; the player's head and arms
 *   front  u = −z, v = y — from the audience (the MEET page and the sound
 *          page): the grille, the keyboard's edge, the pleated bellows, the
 *          bass side and its strap, the player behind
 * Red pearl lacquer and chrome lit from the upper left with rim highlights;
 * the bellows dark cloth with metal corner guards; skin and clothes in the
 * shared player's palette. Nothing moves by itself (D8).
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { FrontArt } from '../shared/metal/metalPages';
import { armPath, PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import type { HandView, V3 } from '../shared/players/handModel.ts';
import { accLeftHand, accRightHand, bassFace, BASS_HAND, type PosedArm } from '../shared/freereed/freeReedHands.ts';
import type { PlayerPose } from '../shared/players/playerPose.ts';
import { Hand3Art, MassArt, ProfileBehind, ProfileFront, SHIRT, SHIRT_RIM, type ProfilePose, type Pt } from '../shared/freereed/PlayerProfile';
import { BODY, bassBoxAt, FLOOR_Y, GRILLE, KEYS, stateOf, TREBLE } from './model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const pt = (u: number, v: number): Pt => ({ u, v });
const HIGHLIGHT = '#ffc64d';
const LACQUER = ['#c2474c', '#8a252b', '#561519', '#2c0a0c'];
const CHROME = ['#ffffff', '#dfe4ec', '#9aa3b1', '#5d6572'];
const CLOTH = ['#2e3036', '#1b1c20', '#0f1012'];
const AIR = '#9fd4ff';
const MID_Y = (TREBLE.y0 + TREBLE.y1) / 2;
const MID_X = (TREBLE.x0 + TREBLE.x1) / 2;

function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}
function poly(pts: readonly (readonly [number, number])[]): SkPath {
  const p = make();
  p.moveTo(pts[0][0], pts[0][1]);
  for (const q of pts.slice(1)) p.lineTo(q[0], q[1]);
  p.close();
  return p;
}
function Lacquer({ path, box, hi = false }: { path: SkPath; box: { u0: number; v0: number; u1: number; v1: number }; hi?: boolean }): ReactElement {
  return (
    <Group>
      <Path path={path} color="#000" opacity={0.4} transform={[{ translateX: 6 }, { translateY: 9 }]}>
        <BlurMask blur={9} style="normal" />
      </Path>
      <Path path={path}>
        <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u1, box.v1)} colors={LACQUER} />
      </Path>
      <Group clip={path}>
        <Path path={path} style="stroke" strokeWidth={10} opacity={0.45}>
          <LinearGradient start={vec(box.u0, box.v0)} end={vec(box.u0 + (box.u1 - box.u0) * 0.5, box.v0 + (box.v1 - box.v0) * 0.5)} colors={['#ffd3d0', 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
      <Path path={path} style="stroke" strokeWidth={3} color="#e1e4ea" opacity={0.75} />
      {hi ? <Path path={path} style="stroke" strokeWidth={9} color={HIGHLIGHT} opacity={0.9} /> : null}
    </Group>
  );
}

/* ═══════════════ the front view (from the audience): u = −z ═══════════════ */

/** The bellows' pleats between the treble side's inner face and the bass side's. */
function Bellows({ top, bottom, view }: { top: number; bottom: number; view: 'front' | 'top' }): ReactElement {
  const b = bassBoxAt(top, bottom);
  // A full-size piano accordion's bellows: about 16 folds (real-world), each
  // fold's ridge capped by a steel corner guard at the top and bottom edges.
  const N = 16;
  const folds: { a: [number, number]; b: [number, number] }[] = [];
  // u = −z: the treble inner face at u = −TREBLE.z0, the bass inner face from it.top to it.bottom.
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const zt = TREBLE.z0 + (b.it.z - TREBLE.z0) * t;
    const zb = TREBLE.z0 + (b.ib.z - TREBLE.z0) * t;
    if (view === 'front') folds.push({ a: [-zt, TREBLE.y0 + 6], b: [-zb, TREBLE.y1 - 6] });
    else folds.push({ a: [TREBLE.x0 + 6, zt], b: [TREBLE.x1 - 6, zt] });
  }
  const body = view === 'front' ? poly([[-TREBLE.z0, TREBLE.y0 + 4], [-b.it.z, b.it.y + 4], [-b.ib.z, b.ib.y - 4], [-TREBLE.z0, TREBLE.y1 - 4]]) : poly([[TREBLE.x0 + 4, TREBLE.z0], [TREBLE.x1 - 4, TREBLE.z0], [TREBLE.x1 - 4, b.it.z], [TREBLE.x0 + 4, b.it.z]]);
  const lines = make();
  folds.forEach((f, i) => {
    if (i === 0 || i === N) return;
    lines.moveTo(f.a[0], f.a[1]);
    lines.lineTo(f.b[0], f.b[1]);
  });
  const guards = make();
  if (view === 'front') {
    // Steel corner protectors on every ridge, top and bottom (an L-shaped
    // corner seen square-on: a small plate with a turned edge).
    folds.forEach((f, i) => {
      if (i === 0 || i === N || i % 2 === 1) return;
      guards.addRRect(Skia.RRectXY(Skia.XYWHRect(f.a[0] - 6, f.a[1] - 5, 12, 16), 2, 2));
      guards.addRRect(Skia.RRectXY(Skia.XYWHRect(f.b[0] - 6, f.b[1] - 11, 12, 16), 2, 2));
    });
  }
  const bb = body.getBounds();
  // Each pleat is two facets folded toward and away from the viewer: the one
  // turned to the upper-left light lit, the other in shade, so the bellows
  // read as folded card and cloth, not a flat panel.
  // Fold lines alternate RIDGE (even, toward the viewer) and VALLEY (odd):
  // the facet running ridge -> valley faces the upper-left light, the next
  // one is in shade.
  const lit = make();
  const shade = make();
  for (let i = 0; i < N; i++) {
    const f0 = folds[i];
    const f1 = folds[i + 1];
    (i % 2 === 0 ? lit : shade).addPath(poly([f0.a, f1.a, f1.b, f0.b]));
  }
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(bb.x, bb.y)} end={vec(bb.x + bb.width, bb.y + bb.height)} colors={CLOTH} />
      </Path>
      <Group clip={body}>
        <Path path={lit} color="#6a6e7a" opacity={0.7} />
        <Path path={shade} color="#050506" opacity={0.7} />
      </Group>
      <Path path={lines} style="stroke" strokeWidth={2.2} color="#5c606a" opacity={0.85} />
      <Path path={lines} style="stroke" strokeWidth={0.9} color="#c9d0da" opacity={0.45} />
      {view === 'front' ? <Path path={guards} color="#c9d0da" opacity={0.9} /> : null}
      <Path path={body} style="stroke" strokeWidth={2} color="#0b0b0d" />
    </Group>
  );
}

/** The treble side from the front: lacquer, chrome trim, the grille, the
 *  register tabs along the top, the keyboard's edge on the viewer's left. */
function TrebleFront({ hi }: { hi: string | null }): ReactElement {
  const u0 = -TREBLE.z1;
  const u1 = -TREBLE.z0;
  const face = rr(u0, TREBLE.y0, u1, TREBLE.y1, 14);
  const grille = rr(-GRILLE.z1, GRILLE.y0, -GRILLE.z0, GRILLE.y1, 10);
  // The grille's fretwork: a pierced chrome plate, a lattice of diamond
  // openings in staggered rows (dark cloth behind), inside a plain border.
  const fret = make();
  let row = 0;
  for (let y = GRILLE.y0 + 20; y < GRILLE.y1 - 16; y += 15, row++) {
    for (let x = -GRILLE.z1 + 14 + (row % 2) * 7; x < -GRILLE.z0 - 12; x += 14) {
      fret.moveTo(x, y - 6);
      fret.lineTo(x + 4.5, y);
      fret.lineTo(x, y + 6);
      fret.lineTo(x - 4.5, y);
      fret.close();
    }
  }
  // The keyboard seen along its edge: a full-size piano accordion's 41 keys,
  // F to A over three and a half octaves (real-world: 24 white keys at about
  // 19 mm, each about 14 mm deep at its front edge, the 17 black keys
  // standing about 8 mm proud of them, lowest at the top). Each white key's
  // rounded front end in relief, a dark gap between keys; each black key a
  // raised block with its own lit top edge.
  const keyEdge = make();
  const keyLit = make();
  const blackEdge = make();
  const blackLit = make();
  const pitch = (KEYS.y1 - KEYS.y0) / 24;
  const WHITE = ['F', 'G', 'A', 'B', 'C', 'D', 'E'];
  for (let k = 0; k < 24; k++) {
    const y = KEYS.y0 + k * pitch;
    keyEdge.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 - 4, y + 1, 28, pitch - 2), 3.5, 3.5));
    keyLit.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 - 3, y + 1.8, 26, (pitch - 2) * 0.32), 2, 2));
    const n = WHITE[k % 7];
    // A black key after F, G, A, C and D (none after B or E), not after the top A.
    if (k < 23 && n !== 'B' && n !== 'E') {
      blackEdge.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 - 13, y + pitch - 5.5, 22, 11), 2.4, 2.4));
      blackLit.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 - 12, y + pitch - 4.6, 20, 3), 1.2, 1.2));
    }
  }
  const tabs = make();
  for (let k = 0; k < 7; k++) tabs.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 + 30 + k * 22, TREBLE.y0 - 14, 16, 18), 3, 3));
  return (
    <Group>
      <Lacquer path={face} box={{ u0, v0: TREBLE.y0, u1, v1: TREBLE.y1 }} hi={hi === 'ac.treble'} />
      <Path path={keyEdge}>
        <LinearGradient start={vec(u0 - 4, 0)} end={vec(u0 + 24, 0)} colors={['#ffffff', '#f3f1ea', '#cfcabc']} />
      </Path>
      <Path path={keyLit} color="#ffffff" opacity={0.7} />
      <Path path={keyEdge} style="stroke" strokeWidth={1.4} color="#2a2c31" />
      <Path path={blackEdge} color="#000000" opacity={0.45} transform={[{ translateX: 2 }, { translateY: 2 }]} />
      <Path path={blackEdge}>
        <LinearGradient start={vec(u0 - 13, 0)} end={vec(u0 + 9, 0)} colors={['#55575e', '#1c1d20', '#060607']} />
      </Path>
      <Path path={blackLit} color="#9aa0aa" opacity={0.8} />
      <Path path={grille}>
        <LinearGradient start={vec(-GRILLE.z1, GRILLE.y0)} end={vec(-GRILLE.z0, GRILLE.y1)} colors={CHROME} />
      </Path>
      <Path path={fret} color="#141519" />
      <Path path={fret} style="stroke" strokeWidth={0.8} color="#ffffff" opacity={0.35} />
      <Path path={grille} style="stroke" strokeWidth={2} color="#3a3d45" />
      <Path path={tabs}>
        <LinearGradient start={vec(u0, TREBLE.y0 - 14)} end={vec(u0, TREBLE.y0 + 4)} colors={['#ffffff', '#c9d0da', '#6a7280']} />
      </Path>
      {hi === 'ac.grille' ? <Path path={rr(-GRILLE.z1 - 10, GRILLE.y0 - 10, -GRILLE.z0 + 10, GRILLE.y1 + 10, 14)} style="stroke" strokeWidth={8} color={HIGHLIGHT} /> : null}
      {hi === 'ac.keys' ? <Path path={rr(u0 - 10, KEYS.y0 - 10, u0 + 30, KEYS.y1 + 10, 8)} style="stroke" strokeWidth={8} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** `part`: the box (drawn under the player) or the bass STRAP alone (drawn
 *  over the player: the left hand goes UNDER the strap). */
function BassFront({ top, bottom, hi, part = 'box' }: { top: number; bottom: number; hi: string | null; part?: 'box' | 'strap' }): ReactElement {
  const b = bassBoxAt(top, bottom);
  const P = (q: { z: number; y: number }) => [-q.z, q.y] as [number, number];
  const face = poly([P(b.it), P(b.ib), P(b.ob), P(b.ot)]);
  const fb = face.getBounds();
  // The bass box has real depth (real-world about 180 mm front to back, its
  // outer END face about 480 x 180). Swung out on a pull it turns a little
  // toward the audience, so a strip of that end face shows beyond the outer
  // edge: on it the left-hand BASS STRAP (leather about 40 mm wide, a buckle
  // at the top), the AIR BUTTON near the top front, and toward the player
  // the button board's field of bass buttons (about 120 in 6 rows of 20 at
  // about 15 mm, seen foreshortened).
  const du = -(b.ob.z - b.ot.z);
  const dv = b.ob.y - b.ot.y;
  const dl = Math.hypot(du, dv) || 1;
  const tu = du / dl;
  const tv = dv / dl;
  // The outward normal of the outer edge (toward +u, away from the bellows).
  const nu = tv >= 0 ? tv : -tv;
  const nv = tv >= 0 ? -tu : tu;
  const E = 88; // the end face's apparent width
  const A = P(b.ot);
  const B = P(b.ob);
  const at = (f: number, g: number): [number, number] => [A[0] + (B[0] - A[0]) * f + nu * E * g, A[1] + (B[1] - A[1]) * f + nv * E * g];
  const endFace = poly([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]);
  const eb = endFace.getBounds();
  // The button board toward the FRONT corner of the end (figure pass 3: the
  // left hand's fingers reach forward round toward the front corner to the
  // buttons, the strap across the back of the wrist behind them).
  const [g0, g1] = BASS_HAND.buttons;
  const board = poly([at(0.06, g0 - 0.03), at(0.94, g0 - 0.03), at(0.94, g1 + 0.04), at(0.06, g1 + 0.04)]);
  const buttons = make();
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 6; c++) {
      const q = at(0.1 + (r / 19) * 0.8, g0 + 0.02 + (c / 5) * (g1 - g0 - 0.04));
      buttons.addOval(Skia.XYWHRect(q[0] - 2.8, q[1] - 3.6, 5.6, 7.2));
    }
  }
  // The strap over the back part of the end face (across the back of the
  // left wrist), its stitching and buckle.
  const SG = BASS_HAND.strapG;
  const strap = make();
  const s0 = at(0.16, SG);
  const s1 = at(0.9, SG);
  strap.moveTo(s0[0], s0[1]);
  strap.lineTo(s1[0], s1[1]);
  const stitch = make();
  for (const g of [SG - 0.1, SG + 0.1]) {
    const q0 = at(0.17, g);
    const q1 = at(0.89, g);
    stitch.moveTo(q0[0], q0[1]);
    stitch.lineTo(q1[0], q1[1]);
  }
  const bk = at(0.13, SG);
  const buckle = rr(bk[0] - 13, bk[1] - 9, bk[0] + 13, bk[1] + 9, 3);
  const air = at(0.05, 0.3);
  if (part === 'strap') {
    return (
      <Group>
        <Path path={strap} style="stroke" strokeWidth={30} strokeCap="butt" color="#120c07" />
        <Path path={strap} style="stroke" strokeWidth={26} strokeCap="butt">
          <LinearGradient start={vec(s0[0], s0[1])} end={vec(s1[0], s1[1])} colors={['#7a5634', '#4a2f18', '#2c1b0d']} />
        </Path>
        <Path path={stitch} style="stroke" strokeWidth={1.2} color="#c9a36e" opacity={0.75}>
          <DashPathEffect intervals={[5, 4]} />
        </Path>
        <Path path={buckle} style="stroke" strokeWidth={3.2} color="#d9dde4" />
        {hi === 'ac.strap' ? <Path path={strap} style="stroke" strokeWidth={46} strokeCap="round" color={HIGHLIGHT} opacity={0.5} /> : null}
      </Group>
    );
  }
  return (
    <Group>
      <Path path={endFace}>
        <LinearGradient start={vec(eb.x, eb.y)} end={vec(eb.x + eb.width, eb.y + eb.height)} colors={['#7a1d23', '#561519', '#2c0a0c', '#1a0607']} />
      </Path>
      <Path path={board} color="#141416" />
      <Path path={buttons}>
        <LinearGradient start={vec(eb.x, eb.y)} end={vec(eb.x + eb.width, eb.y + eb.height)} colors={['#ffffff', '#d9dbe0', '#9aa0aa']} />
      </Path>
      <Path path={endFace} style="stroke" strokeWidth={2} color="#e1e4ea" opacity={0.55} />
      <Lacquer path={face} box={{ u0: fb.x, v0: fb.y, u1: fb.x + fb.width, v1: fb.y + fb.height }} hi={hi === 'ac.bassSide'} />
      <Circle cx={air[0]} cy={air[1]} r={8} color="#d9dde4" />
      <Circle cx={air[0] - 2} cy={air[1] - 2} r={4} color="#ffffff" opacity={0.8} />
    </Group>
  );
}

/** Frame A seen from the audience: u = -z, v = y, toward the viewer +x. */
const FRONT_VIEW: HandView = (p) => ({ u: -p.z, v: p.y, d: p.x });
const SIDE_VIEW: HandView = (p) => ({ u: p.x, v: p.y, d: p.z });
const TOP_VIEW: HandView = (p) => ({ u: p.x, v: p.z, d: -p.y });
const fv = (p: V3): Pt => ({ u: -p.z, v: p.y });

/**
 * The bass end as the front view draws it (BassFront: the end face turned a
 * little toward the audience, a strip beyond the bass side's outer edge, its
 * front edge on that edge, its back END_E mm out): a point of frame A near
 * the end face, by its place down the face, front to back, and out from it.
 */
const END_E = 88;
const stripViews = new Map<string, HandView>();
function stripView(top: number, bottom: number): HandView {
  const k = `${Math.round(top)}:${Math.round(bottom)}`;
  let view = stripViews.get(k);
  if (!view) {
    const F = bassFace(top, bottom);
    const A = { u: -F.b.ot.z, v: F.b.ot.y };
    const B = { u: -F.b.ob.z, v: F.b.ob.y };
    const dl = Math.hypot(B.u - A.u, B.v - A.v) || 1;
    const tv = (B.v - A.v) / dl;
    const tu = (B.u - A.u) / dl;
    const nu = tv >= 0 ? tv : -tv;
    const nv = tv >= 0 ? -tu : tu;
    view = (p) => {
      const c = F.coords(p);
      const g = c.g + c.h * 0.0012;
      return { u: A.u + (B.u - A.u) * c.f + nu * END_E * g, v: A.v + (B.v - A.v) * c.f + nv * END_E * g, d: c.h };
    };
    stripViews.set(k, view);
  }
  return view;
}

/** The forearm's picture angle (elbow to wrist) in a view. */
function angleIn(view: HandView, a: PosedArm): number {
  const e = view(a.E);
  const w = view(a.W);
  return Math.atan2(w.v - e.v, w.u - e.u);
}

/** The player from the front (the shared player), round the accordion. */
function frontPose(top: number, bottom: number): PlayerPose {
  // The arms end at the posed hands' wrists (figure pass 3): the right hand
  // on the keyboard's edge, the left under the bass strap on the end.
  const R = accRightHand();
  const Lh = accLeftHand(top, bottom);
  // The forearm ends just inside the bass side's outer edge (behind it, out
  // of sight), level with the hand on the end strip.
  const F = bassFace(top, bottom);
  const c = F.coords(Lh.W);
  const wl = { u: -(F.b.ot.z + (F.b.ob.z - F.b.ot.z) * c.f) - 24, v: F.b.ot.y + (F.b.ob.y - F.b.ot.y) * c.f };
  return {
    view: 'front',
    posture: 'standing',
    head: { c: { u: 0, v: -470 }, r: 108 },
    neck: { u: 0, v: -350 },
    shoulderR: { u: -190, v: -320 },
    shoulderL: { u: 190, v: -320 },
    elbowR: fv(R.E),
    // The left hand lies on the bass box's END face, under the bass strap
    // (the forearm behind the bass side, out of sight).
    elbowL: fv(Lh.E),
    handR: { wrist: fv(R.W), dir: Math.PI / 2, kind: 'rest' },
    handL: { wrist: { u: wl.u, v: wl.v }, dir: Math.PI, kind: 'rest' },
    hipR: { u: -110, v: 160 },
    hipL: { u: 110, v: 160 },
    kneeR: { u: -110, v: 640 },
    kneeL: { u: 110, v: 640 },
    footR: { u: -120, v: FLOOR_Y },
    footL: { u: 120, v: FLOOR_Y },
    floor: FLOOR_Y,
    strapTo: { u: -TREBLE.z1 + 40, v: TREBLE.y0 + 10 },
  };
}

const POSES = new Map<string, PlayerPose>();
function poseFor(top: number, bottom: number): PlayerPose {
  const k = `${Math.round(top)}:${Math.round(bottom)}`;
  let p = POSES.get(k);
  if (!p) {
    p = frontPose(top, bottom);
    POSES.set(k, p);
  }
  return p;
}

/** The whole front view for an opening (the MEET page, the sound page). */
export function AccordionFront({ top, bottom, hi = null, sound = 0 }: { top: number; bottom: number; hi?: string | null; sound?: 0 | 1 | 2 }): ReactElement {
  const pose = poseFor(top, bottom);
  const b = bassBoxAt(top, bottom);
  // Sound leaving the two sides: arcs off the grille (toward the viewer) and off the bass end.
  const arcs = make();
  if (sound) {
    for (let i = 0; i < 3; i++) arcs.addCircle(0, 0, 70 + i * 50);
  }
  const bassArcs = make();
  if (sound) for (let i = 0; i < 3; i++) bassArcs.addArc(Skia.XYWHRect(-b.outlets.z - 30 - i * 40, b.outlets.y - 70 - i * 40, 60 + i * 80, 140 + i * 80), -60, 120);
  return (
    <Group>
      <PlayerBehind pose={pose} />
      <Bellows top={top} bottom={bottom} view="front" />
      <BassFront top={top} bottom={bottom} hi={hi} />
      <TrebleFront hi={hi} />
      {hi === 'ac.bellows' ? <Path path={poly([[-TREBLE.z0, TREBLE.y0], [-b.it.z, b.it.y], [-b.ib.z, b.ib.y], [-TREBLE.z0, TREBLE.y1]])} style="stroke" strokeWidth={8} color={HIGHLIGHT} /> : null}
      <PlayerInFront pose={pose} hands={false} />
      <AccHandsFront top={top} bottom={bottom} />
      <BassFront top={top} bottom={bottom} hi={hi} part="strap" />
      {sound ? (
        <Group>
          <Path path={arcs} style="stroke" strokeWidth={4} color={AIR} opacity={0.55}>
            <DashPathEffect intervals={[16, 10]} />
          </Path>
          <Path path={bassArcs} style="stroke" strokeWidth={4} color="#ffc64d" opacity={0.6} />
        </Group>
      ) : null}
    </Group>
  );
}

/** The hands from the front (figure pass 3): the right hand on the keyboard's
 *  edge (the forearm reaching toward the viewer), the left on the bass end
 *  under the strap (drawn before the strap, which crosses the back of its wrist). */
function AccHandsFront({ top, bottom }: { top: number; bottom: number }): ReactElement {
  const R = accRightHand();
  const Lh = accLeftHand(top, bottom);
  const sv = stripView(top, bottom);
  return (
    <Group>
      <Hand3Art sk={Lh.sk} view={sv} fore={angleIn(sv, Lh)} />
      <Hand3Art sk={R.sk} view={FRONT_VIEW} fore={angleIn(FRONT_VIEW, R)} foreshortened />
    </Group>
  );
}

export function frontBoxFor(bottom: number) {
  const b = bassBoxAt(0, bottom);
  return { u0: -TREBLE.z1 - 330, u1: Math.max(-b.ob.z, -b.it.z) + 320, v0: -640, v1: 520 };
}

/* ═══════════════ the side view (from the player's right) ═══════════════ */

const PROFILE: ProfilePose = {
  head: { c: { u: BODY.headC.x, v: BODY.headC.y }, r: 108 },
  neck: { u: BODY.headC.x - 40, v: -340 },
  shoulder: { u: BODY.headC.x - 60, v: -280 },
  // Figure pass 2 (2026-10-15): true adult arm lengths — the upper arm
  // ≈ 305 mm hanging from the shoulder to an elbow at the side, a little
  // behind the chest; the forearm ≈ 220–250 mm seen (it turns out toward the
  // keyboard at the player's right, foreshortened) to the wrist at the
  // keyboard. The far (left) arm works the bellows behind the instrument.
  // Figure pass 3: the joints of the posed arms (freeReedHands.ts) - the
  // right forearm along the treble side to the hand on the keys, the left to
  // the bass strap (behind the instrument).
  elbowNear: { u: accRightHand().E.x, v: accRightHand().E.y },
  wristNear: { u: accRightHand().W.x, v: accRightHand().W.y },
  elbowFar: { u: accLeftHand(175, 350).E.x, v: accLeftHand(175, 350).E.y },
  wristFar: { u: accLeftHand(175, 350).W.x, v: accLeftHand(175, 350).W.y },
  hip: { u: BODY.headC.x - 70, v: 180 },
  kneeNear: { u: BODY.headC.x - 40, v: 650 },
  ankleNear: { u: BODY.headC.x - 60, v: FLOOR_Y - 72 },
  kneeFar: { u: BODY.headC.x - 90, v: 645 },
  ankleFar: { u: BODY.headC.x - 110, v: FLOOR_Y - 72 },
  floor: FLOOR_Y,
  strapTo: { u: TREBLE.x0 + 10, v: TREBLE.y0 + 20 },
};

/** The treble side's outer face, the keyboard face-on (side view). */
function TrebleSide({ hi }: { hi: string | null }): ReactElement {
  const face = rr(TREBLE.x0, TREBLE.y0, TREBLE.x1, TREBLE.y1, 12);
  const whites = make();
  const blacks = make();
  const n = 24;
  const kh = (KEYS.y1 - KEYS.y0) / n;
  for (let i = 0; i < n; i++) whites.addRRect(Skia.RRectXY(Skia.XYWHRect(KEYS.x0, KEYS.y0 + i * kh + 0.8, KEYS.x1 - KEYS.x0, kh - 1.6), 2, 2));
  // Black keys in the piano pattern (2, then 3), at the key ends toward the chest.
  const pattern = [1, 1, 0, 1, 1, 1, 0];
  for (let i = 0; i < n - 1; i++) if (pattern[i % 7]) blacks.addRRect(Skia.RRectXY(Skia.XYWHRect(KEYS.x0, KEYS.y0 + (i + 1) * kh - kh * 0.32, (KEYS.x1 - KEYS.x0) * 0.58, kh * 0.64), 2, 2));
  const grilleEdge = rr(TREBLE.x1 - 5, GRILLE.y0, TREBLE.x1 + 3, GRILLE.y1, 2);
  return (
    <Group>
      <Lacquer path={face} box={{ u0: TREBLE.x0, v0: TREBLE.y0, u1: TREBLE.x1, v1: TREBLE.y1 }} hi={hi === 'ac.treble'} />
      <Path path={whites}>
        <LinearGradient start={vec(KEYS.x0, 0)} end={vec(KEYS.x1, 0)} colors={['#d9d6cc', '#f6f4ee', '#ffffff']} />
      </Path>
      <Path path={whites} style="stroke" strokeWidth={0.8} color="#8a8d95" />
      <Path path={blacks}>
        <LinearGradient start={vec(KEYS.x0, 0)} end={vec(KEYS.x1, 0)} colors={['#0b0b0d', '#2a2b30', '#141519']} />
      </Path>
      <Path path={grilleEdge}>
        <LinearGradient start={vec(0, GRILLE.y0)} end={vec(0, GRILLE.y1)} colors={CHROME} />
      </Path>
      {hi === 'ac.keys' ? <Path path={rr(KEYS.x0 - 8, KEYS.y0 - 8, KEYS.x1 + 8, KEYS.y1 + 8, 8)} style="stroke" strokeWidth={6} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** What of the bass side and the bellows rises behind the treble side (side view). */
function BassBehindSide({ top, bottom }: { top: number; bottom: number }): ReactElement {
  const b = bassBoxAt(top, bottom);
  const silhouette = rr(TREBLE.x0 + 4, b.box.y0, TREBLE.x1 - 4, b.box.y1, 12);
  return (
    <Group opacity={0.85}>
      <Path path={silhouette}>
        <LinearGradient start={vec(TREBLE.x0, b.box.y0)} end={vec(TREBLE.x1, b.box.y1)} colors={['#6a1c21', '#3a0d10', '#200607']} />
      </Path>
      <Path path={rr(TREBLE.x0 + 10, TREBLE.y0 - 12, TREBLE.x1 - 10, TREBLE.y1 + 12, 8)} color="#1b1c20" />
    </Group>
  );
}

/** The right hand on the keyboard (figure pass 3): the posed hand, its back
 *  toward the viewer, the fingers curved down onto the keys of a chord. */
function HandOnKeys(): ReactElement {
  const R = accRightHand();
  return <Hand3Art sk={R.sk} view={SIDE_VIEW} fore={angleIn(SIDE_VIEW, R)} />;
}

function Floor({ u0, u1 }: { u0: number; u1: number }): ReactElement {
  return (
    <Group>
      <Path path={rr(u0, FLOOR_Y, u1, FLOOR_Y + 60, 0)}>
        <LinearGradient start={vec(0, FLOOR_Y)} end={vec(0, FLOOR_Y + 60)} colors={['#2b2d33', '#16171b']} />
      </Path>
    </Group>
  );
}

function SceneSide({ variant, hi }: { variant: VariantId; hi: string | null }): ReactElement {
  const s = stateOf(variant);
  return (
    <Group>
      <Floor u0={-2000} u1={3000} />
      <ProfileBehind pose={PROFILE} />
      <BassBehindSide top={s.top} bottom={s.bottom} />
      <TrebleSide hi={hi} />
      <ProfileFront pose={PROFILE} />
      <HandOnKeys />
    </Group>
  );
}

/* ═══════════════ from above ═══════════════ */

const ABOVE: PlayerPose = {
  view: 'above',
  posture: 'standing',
  head: { c: { u: 0, v: 0 }, r: 104 },
  neck: { u: 0, v: -24 },
  shoulderR: { u: -188, v: -40 },
  shoulderL: { u: 188, v: -40 },
  elbowR: { u: -250, v: 70 },
  elbowL: { u: 250, v: 70 },
  handR: { wrist: { u: -240, v: 120 }, dir: Math.PI / 2, kind: 'above' },
  handL: { wrist: { u: 240, v: 120 }, dir: Math.PI / 2, kind: 'above' },
  hipR: { u: -110, v: -10 },
  hipL: { u: 110, v: -10 },
  kneeR: { u: -110, v: 60 },
  kneeL: { u: 110, v: 60 },
  footR: { u: -100, v: 196 },
  footL: { u: 100, v: 196 },
  floor: null,
};

function SceneTop({ variant, hi }: { variant: VariantId; hi: string | null }): ReactElement {
  const s = stateOf(variant);
  const b = bassBoxAt(s.top, s.bottom);
  const treble = rr(TREBLE.x0, TREBLE.z0, TREBLE.x1, TREBLE.z1, 10);
  const keyStrip = rr(KEYS.x0, TREBLE.z1 - 26, KEYS.x1, TREBLE.z1 - 2, 4);
  const keyLines = make();
  for (let x = KEYS.x0 + 10; x < KEYS.x1; x += 22) {
    keyLines.moveTo(x, TREBLE.z1 - 26);
    keyLines.lineTo(x, TREBLE.z1 - 2);
  }
  // The bass side from above: its top face, and its slanted end face below it.
  const bassTop = poly([[TREBLE.x0, b.it.z], [TREBLE.x1, b.it.z], [TREBLE.x1, b.ot.z], [TREBLE.x0, b.ot.z]]);
  const bassEnd = poly([[TREBLE.x0, b.ot.z], [TREBLE.x1, b.ot.z], [TREBLE.x1, b.ob.z], [TREBLE.x0, b.ob.z]]);
  const lowFan = poly([[TREBLE.x0 + 8, b.it.z], [TREBLE.x1 - 8, b.it.z], [TREBLE.x1 - 8, b.ib.z], [TREBLE.x0 + 8, b.ib.z]]);
  // The arms and hands from above (figure pass 3): the posed arms
  // (freeReedHands.ts) - the shared anatomical arm to the posed hand.
  const PR = accRightHand();
  const PL = accLeftHand(s.top, s.bottom);
  const tp = (p: V3): Pt => pt(p.x, p.z);
  const armR = armPath(tp(PR.S), tp(PR.E), tp(PR.W));
  const armL = armPath(tp(PL.S), tp(PL.E), tp(PL.W));
  return (
    <Group>
      <Group transform={[{ translateX: BODY.headC.x }, { translateY: 0 }, { rotate: -Math.PI / 2 }]}>
        <PlayerBehind pose={ABOVE} />
      </Group>
      <Path path={lowFan} color="#0f1012" opacity={0.85} />
      <Bellows top={s.top} bottom={s.bottom} view="top" />
      <Lacquer path={bassEnd} box={{ u0: TREBLE.x0, v0: b.ot.z, u1: TREBLE.x1, v1: b.ob.z }} />
      <Lacquer path={bassTop} box={{ u0: TREBLE.x0, v0: b.ot.z, u1: TREBLE.x1, v1: b.it.z }} hi={hi === 'ac.bassSide'} />
      <Lacquer path={treble} box={{ u0: TREBLE.x0, v0: TREBLE.z0, u1: TREBLE.x1, v1: TREBLE.z1 }} hi={hi === 'ac.treble'} />
      <Path path={keyStrip} color="#f3f1ea" />
      <Path path={keyLines} style="stroke" strokeWidth={1.2} color="#5c606a" />
      <Path path={rr(TREBLE.x1 - 4, GRILLE.z0, TREBLE.x1 + 3, GRILLE.z1, 2)}>
        <LinearGradient start={vec(0, GRILLE.z0)} end={vec(0, GRILLE.z1)} colors={CHROME} />
      </Path>
      <MassArt path={armR} ramp={SHIRT} rim={SHIRT_RIM} edge="#171a21" />
      <MassArt path={armL} ramp={SHIRT} rim={SHIRT_RIM} edge="#171a21" />
      <Hand3Art sk={PL.sk} view={TOP_VIEW} fore={angleIn(TOP_VIEW, PL)} />
      <Hand3Art sk={PR.sk} view={TOP_VIEW} fore={angleIn(TOP_VIEW, PR)} />
    </Group>
  );
}

/* ═══════════════ the LessonArt ═══════════════ */

function labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const b = bassBoxAt(stateOf(variant).top, stateOf(variant).bottom);
  return view === 'side'
    ? [
        { id: 'keys', text: 'TREBLE KEYBOARD', short: 'KEYS', u: TREBLE.x1 + 60, v: TREBLE.y1 + 70, align: 'left', at: { u: (KEYS.x0 + KEYS.x1) / 2 + 30, v: KEYS.y1 - 30 } },
        { id: 'grille', text: 'GRILLE (EDGE-ON)', short: 'GRILLE', u: TREBLE.x1 + 60, v: GRILLE.y0 - 60, align: 'left', at: { u: TREBLE.x1, v: GRILLE.y0 + 20 } },
        { id: 'bass', text: 'BASS SIDE BEHIND', short: 'BASS', u: TREBLE.x0 - 40, v: Math.min(TREBLE.y0, b.box.y0) - 60, align: 'right', tone: 'muted' },
      ]
    : [
        { id: 'treble', text: 'TREBLE SIDE', short: 'TREBLE', u: TREBLE.x1 + 70, v: TREBLE.z1 + 30, align: 'left', at: { u: TREBLE.x1, v: (TREBLE.z0 + TREBLE.z1) / 2 } },
        { id: 'bellows', text: 'BELLOWS', u: TREBLE.x1 + 70, v: (TREBLE.z0 + b.it.z) / 2, align: 'left', at: { u: TREBLE.x1, v: (TREBLE.z0 + b.it.z) / 2 } },
        { id: 'bass', text: 'BASS SIDE (MOVES)', short: 'BASS', u: TREBLE.x1 + 70, v: (b.ot.z + b.ob.z) / 2 - 20, align: 'left', at: { u: TREBLE.x1, v: (b.ot.z + b.ob.z) / 2 } },
      ];
}

function hit(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const b = bassBoxAt(s.top, s.bottom);
  if (view === 'side') {
    if (u >= KEYS.x0 - tol && u <= KEYS.x1 + tol && v >= KEYS.y0 && v <= KEYS.y1) return 'ac.keys';
    if (u >= TREBLE.x0 - tol && u <= TREBLE.x1 + tol && v >= TREBLE.y0 - tol && v <= TREBLE.y1 + tol) return 'ac.treble';
    if (u >= TREBLE.x0 && u <= TREBLE.x1 && v >= b.box.y0 - tol && v < TREBLE.y0) return 'ac.bassSide';
    return u < TREBLE.x0 && u > TREBLE.x0 - 300 && v < FLOOR_Y ? 'ac.body' : null;
  }
  if (u < TREBLE.x0 - tol || u > TREBLE.x1 + tol) return u < TREBLE.x0 && u > TREBLE.x0 - 300 ? 'ac.body' : null;
  if (v >= TREBLE.z0 - tol && v <= TREBLE.z1 + tol) return v > TREBLE.z1 - 30 ? 'ac.keys' : 'ac.treble';
  if (v < TREBLE.z0 && v > b.it.z) return 'ac.bellows';
  if (v <= b.it.z && v >= b.ob.z - tol) return 'ac.bassSide';
  return null;
}

export const A11_ART: LessonArt = {
  Instrument: ({ view, variant }: { view: ViewId; variant: VariantId }) => (view === 'side' ? <SceneSide variant={variant} hi={null} /> : <SceneTop variant={variant} hi={null} />),
  labels,
  hitTest: hit,
  labelsYieldToMic: true,
};

/* ═══════════════ the MEET page ═══════════════ */

function meetLabels(v: VariantId): ArtLabel[] {
  const s = stateOf(v);
  const b = bassBoxAt(s.top, s.bottom);
  return [
    { id: 'grille', text: 'TREBLE GRILLE', short: 'GRILLE', u: -TREBLE.z1 - 40, v: TREBLE.y0 - 70, align: 'right', at: { u: -GRILLE.z1, v: GRILLE.y0 + 20 } },
    { id: 'keys', text: 'KEYBOARD EDGE', short: 'KEYS', u: -TREBLE.z1 - 40, v: TREBLE.y1 - 40, align: 'right', at: { u: -TREBLE.z1 + 10, v: TREBLE.y1 - 60 } },
    { id: 'bellows', text: 'BELLOWS', u: (-TREBLE.z0 - b.ib.z) / 2, v: TREBLE.y1 + 70, align: 'center', at: { u: (-TREBLE.z0 - b.ib.z) / 2, v: TREBLE.y1 - 10 } },
    { id: 'bass', text: 'BASS SIDE', short: 'BASS', u: -b.ob.z + 40, v: b.ob.y + 70, align: 'left', at: { u: -b.ob.z - 30, v: b.ob.y - 20 } },
  ];
}

function meetHit(v: VariantId, u: number, w: number, tol: number): string | null {
  const s = stateOf(v);
  const b = bassBoxAt(s.top, s.bottom);
  const z = -u;
  if (w >= GRILLE.y0 - tol && w <= GRILLE.y1 + tol && z >= GRILLE.z0 - tol && z <= GRILLE.z1 + tol) return 'ac.grille';
  if (z > TREBLE.z1 - 30 && z <= TREBLE.z1 + tol && w >= KEYS.y0 && w <= KEYS.y1) return 'ac.keys';
  if (z >= TREBLE.z0 && z <= TREBLE.z1 + tol && w >= TREBLE.y0 - tol && w <= TREBLE.y1 + tol) return 'ac.treble';
  if (z < TREBLE.z0 && z > b.it.z + ((w - TREBLE.y0) / (TREBLE.y1 - TREBLE.y0)) * (b.ib.z - b.it.z)) return 'ac.bellows';
  if (z <= b.it.z + 10 && z >= b.ob.z - tol && w >= b.box.y0 - tol && w <= b.box.y1 + tol) return 'ac.bassSide';
  if (Math.abs(u) < 260 && w < TREBLE.y0 && w > -560) return 'ac.strap';
  return null;
}

export const ACC_FRONT: FrontArt = {
  box: (v) => frontBoxFor(stateOf(v).bottom),
  Art: ({ variant, highlight }) => {
    const s = stateOf(variant);
    return <AccordionFront top={s.top} bottom={s.bottom} hi={highlight} />;
  },
  labels: meetLabels,
  hitTest: meetHit,
};

/* ═══════════════ HOW IT SOUNDS: the bellows and the two sides ═══════════════ */

const SOUND_BOX = { u0: -TREBLE.z1 - 330, u1: 1180, v0: -640, v1: 520 };

export function BellowsCycle({ w, h, t, push, mic, accessibilityLabel }: { w: number; h: number; t: number; push: boolean; mic: { u: number; v: number }; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', SOUND_BOX, w, h, 6), [w, h]);
  const top = 100 + (264 - 100) * t;
  const bottom = 100 + (600 - 100) * t;
  const b = bassBoxAt(top, bottom);
  // The air's way through the bellows (push: out of the bellows through the reeds; pull: in).
  const air = make();
  const mz = (TREBLE.z0 + b.ib.z) / 2;
  for (const dy of [-120, 40, 200]) {
    const y = MID_Y + dy;
    const zIn = mz;
    if (push) {
      air.moveTo(-zIn, y);
      air.lineTo(-(TREBLE.z0 + 20), y);
      air.moveTo(-zIn, y + 30);
      air.lineTo(-(b.it.z - 10 + (b.ib.z - b.it.z) * 0.5), y + 30);
    } else {
      air.moveTo(-(TREBLE.z0 + 20), y);
      air.lineTo(-zIn, y);
    }
  }
  const out = { u: -b.outlets.z, v: b.outlets.y };
  const line = make();
  line.moveTo(mic.u, mic.v);
  line.lineTo(out.u, out.v);
  const micGlyph = make();
  micGlyph.addCircle(mic.u, mic.v, 22);
  const labels: StaticLabel[] = [
    { id: 'dir', text: push ? 'PUSH · AIR OUT THROUGH THE REEDS' : 'PULL · AIR IN THROUGH THE REEDS', short: push ? 'PUSH' : 'PULL', u: (SOUND_BOX.u0 + SOUND_BOX.u1) / 2, v: -600, align: 'center', tone: 'blue' },
    { id: 'tr', text: 'TREBLE SOUND', short: 'TREBLE', u: -TREBLE.z1 - 40, v: 330, align: 'right', tone: 'blue' },
    { id: 'bs', text: 'BASS SOUND', short: 'BASS', u: out.u + 40, v: out.v + 180, align: 'left', tone: 'amber' },
    { id: 'mic', text: 'A MIC ON A STAND', short: 'MIC', u: mic.u, v: mic.v - 50, align: 'center', tone: 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <AccordionFront top={top} bottom={bottom} sound={2} />
          <Path path={air} style="stroke" strokeWidth={6} strokeCap="round" color={AIR} opacity={0.8} />
          <Path path={line} style="stroke" strokeWidth={3} color="#ffc64d" opacity={0.85}>
            <DashPathEffect intervals={[14, 10]} />
          </Path>
          <Path path={micGlyph}>
            <LinearGradient start={vec(mic.u - 22, mic.v - 22)} end={vec(mic.u + 22, mic.v + 22)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
          </Path>
          <Circle cx={mic.u} cy={mic.v} r={22} style="stroke" strokeWidth={2} color="#1b1c20" />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
export const BELLOWS_ASPECT = (SOUND_BOX.u1 - SOUND_BOX.u0) / (SOUND_BOX.v1 - SOUND_BOX.v0);
export { MID_X };
