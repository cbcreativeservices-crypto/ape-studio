/**
 * M12 TONBAK — the look (charter §2 layer 3), drawn ONLY from geometry.ts's
 * anchors and model.ts's profile, in millimetres of each view's plane:
 *   side  u = x, v = y — seen from the player's right: the head nearly
 *         face-on (tilted up), the goblet behind it, the player in profile;
 *   top   u = x, v = z — seen from above: the goblet's whole profile lying
 *         across the lap, the head edge-on toward the player's right.
 * A wooden tonbak with a skin head (the museum's wooden example's size);
 * the wood colour, the carved rings and the posture are drawing choices.
 * The player is drawn as quiet line art (a bald head — the house style) so
 * the drum stays the subject. Nothing moves (D8); paths are built once.
 */
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { radiusAt, T_LEN, T_R } from './model.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { pt, type PlayerPose } from '../shared/players/playerPose.ts';
import { T_F, T_H0, T_N, alongAxis } from './geometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const WOOD = ['#d9a766', '#a86c34', '#6b3d1c', '#3c210e'];
const SKIN = ['#f4ead2', '#e2d1aa', '#c3ab7c'];
const COS_T = T_N.z; // cos of the tilt
const SIN_T = -T_N.y;
/** The axis projected into the top view: z falls by cos(tilt) per mm. */
const zOf = (s: number) => T_H0.z - s * COS_T;
const yOf = (s: number) => T_H0.y + s * SIN_T;

type Built = ReturnType<typeof buildTop> | ReturnType<typeof buildSide>;
const built: Partial<Record<ViewId, Built>> = {};

function buildTop() {
  // The goblet's outline from above: x = ±r(s) along the axis (v = z).
  const body = make();
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const s = (T_LEN * i) / N;
    const p = [radiusAt(s), zOf(s)] as const;
    if (i === 0) body.moveTo(p[0], p[1]);
    else body.lineTo(p[0], p[1]);
  }
  for (let i = N; i >= 0; i--) {
    const s = (T_LEN * i) / N;
    body.lineTo(-radiusAt(s), zOf(s));
  }
  body.close();
  // Carved rings (decorative grooves, drawing default) across the body.
  const grooves = make();
  for (const f of [0.38, 0.41, 0.82, 0.85]) {
    const s = f * T_LEN;
    const r = radiusAt(s);
    grooves.moveTo(-r + 3, zOf(s));
    grooves.quadTo(0, zOf(s) - 6, r - 3, zOf(s));
  }
  // The head, edge-on but tilted: a thin ellipse at the wide end.
  const head = make();
  head.addOval(Skia.XYWHRect(-T_R, T_H0.z - T_R * SIN_T, 2 * T_R, 2 * T_R * SIN_T + 0.01));
  const lip = make();
  lip.addOval(Skia.XYWHRect(-T_R - 4, T_H0.z - T_R * SIN_T - 3, 2 * T_R + 8, 2 * T_R * SIN_T + 6));
  // The lower opening at the foot (an ellipse seen from above).
  const rf = radiusAt(T_LEN);
  const opening = make();
  opening.addOval(Skia.XYWHRect(-rf + 8, zOf(T_LEN) - 10, 2 * rf - 16, 18));
  const shadow = make();
  shadow.addRRect(Skia.RRectXY(Skia.XYWHRect(-T_R + 30, zOf(T_LEN) - 10, 2 * T_R, T_LEN * COS_T + 30), 60, 60));
  // The player from above (quiet line art): shoulders, head, forearms to the drum.
  const shoulders = make();
  shoulders.addOval(Skia.XYWHRect(-640, -230, 300, 460));
  const headP = make();
  headP.addCircle(-470, 0, 96);
  const arms = make();
  arms.moveTo(-430, 200);
  arms.cubicTo(-300, 260, -130, 200, -40, 120);
  arms.moveTo(-430, -200);
  arms.cubicTo(-300, -240, -160, -120, -90, 40);
  const lap = make();
  lap.addRRect(Skia.RRectXY(Skia.XYWHRect(-380, -330, 560, 220), 90, 90));
  lap.addRRect(Skia.RRectXY(Skia.XYWHRect(-380, 70, 560, 220), 90, 90));
  return { kind: 'top' as const, body, grooves, head, lip, opening, shadow, shoulders, headP, arms, lap };
}

function buildSide() {
  // Seen from the player's right the drum is nearly end-on: the union of the
  // goblet's cross-sections (circles of r(s) round the axis, foreshortened by
  // the tilt) — the bowl, and the foot peeking out below it.
  const sil = make();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const s = (T_LEN * i) / N;
    const r = radiusAt(s);
    sil.addOval(Skia.XYWHRect(-r, yOf(s) - r * COS_T, 2 * r, 2 * r * COS_T));
  }
  // The overlapping cross-sections fill as one shape (non-zero winding); the
  // outline is a wide stroke drawn UNDER the fill, so only the outer edge
  // shows (no path ops: the web backend has no simplify).
  const silhouette = sil;
  const head = make();
  head.addOval(Skia.XYWHRect(-T_R, T_H0.y - T_R * COS_T, 2 * T_R, 2 * T_R * COS_T));
  const rim = make();
  rim.addOval(Skia.XYWHRect(-T_R + 10, T_H0.y - (T_R - 10) * COS_T, 2 * (T_R - 10), 2 * (T_R - 10) * COS_T));
  const floor = make();
  floor.addRect(Skia.XYWHRect(-3000, 0, 6000, 600));
  const floorEdge = make();
  floorEdge.moveTo(-3000, 0);
  floorEdge.lineTo(3000, 0);
  // The player in profile (quiet line art), seated, facing the audience (+x).
  const person = make();
  person.addCircle(-430, -1120, 92); // a bald head (house style)
  person.moveTo(-470, -1020);
  person.cubicTo(-520, -880, -520, -720, -480, -560); // back
  person.moveTo(-380, -1000);
  person.cubicTo(-330, -900, -300, -820, -280, -760); // chest
  person.moveTo(-480, -560);
  person.lineTo(60, -520); // thigh under the drum
  person.lineTo(160, -470);
  person.lineTo(150, -60); // shin
  person.lineTo(260, -20); // foot
  person.moveTo(-380, -900);
  person.cubicTo(-280, -820, -170, -760, -60, -700); // arm to the head
  const chair = make();
  chair.addRRect(Skia.RRectXY(Skia.XYWHRect(-640, -560, 380, 40), 10, 10));
  chair.moveTo(-620, -520);
  chair.lineTo(-620, 0);
  chair.moveTo(-290, -520);
  chair.lineTo(-290, 0);
  return { kind: 'side' as const, silhouette, head, rim, floor, floorEdge, person, chair };
}

function getBuilt(view: ViewId): Built {
  return (built[view] ??= view === 'top' ? buildTop() : buildSide());
}

/** The player as the shared figure (players/PlayerFigure, clarity pass
 *  2026-10-05), on a chair, the drum across the lap, facing the audience
 *  (+x): the same places as the line art it replaces. ILLUSTRATIVE. */
const tonbakPoses: Partial<Record<ViewId, PlayerPose>> = {};
function tonbakPose(view: ViewId): PlayerPose {
  const hit = tonbakPoses[view];
  if (hit) return hit;
  let pose: PlayerPose;
  if (view === 'side') {
    const hip = pt(-470, -615);
    pose = {
      view: 'side',
      posture: 'seated',
      facing: 1,
      head: { c: pt(-430, -1120), r: 100 },
      neck: pt(-447, -962),
      shoulderR: pt(-442, -910),
      shoulderL: pt(-456, -920),
      elbowR: pt(-300, -680),
      elbowL: pt(-318, -700),
      handR: { wrist: pt(-150, -720), dir: 0.1, kind: 'rest' },
      handL: { wrist: pt(-170, -760), dir: 0.05, kind: 'rest' },
      hipR: hip,
      hipL: pt(hip.u - 10, hip.v - 4),
      kneeR: pt(40, -570),
      kneeL: pt(16, -580),
      footR: pt(170, 0),
      footL: pt(124, 0),
      floor: 0,
    };
  } else {
    // From above: authored chest toward +v round the neck, turned to face +x
    // (`facing` 0): (right, fwd) lands at world (neck + fwd, neck + right).
    const n = pt(-482, 0);
    const L = (right: number, fwd: number) => pt(n.u - right, n.v + fwd);
    pose = {
      view: 'above',
      posture: 'seated',
      facing: 0,
      head: { c: L(0, 12), r: 96 },
      neck: n,
      shoulderR: L(188, 4),
      shoulderL: L(-188, 4),
      elbowR: L(230, 150),
      elbowL: L(-200, 160),
      handR: { wrist: L(150, 300), dir: Math.PI / 2 - 0.4, kind: 'above' },
      handL: { wrist: L(-70, 280), dir: Math.PI / 2 + 0.2, kind: 'above' },
      hipR: L(106, -40),
      hipL: L(-106, -40),
      kneeR: L(210, 430),
      kneeL: L(-210, 430),
      footR: L(200, 500),
      footL: L(-200, 500),
      floor: null,
    };
  }
  tonbakPoses[view] = pose;
  return pose;
}

export function TonbakArt({ view }: { view: ViewId; variant: VariantId }) {
  const g = getBuilt(view);
  if (g.kind === 'top') {
    return (
      <Group>
        <PlayerBehind pose={tonbakPose('top')} dim={0.85} />
        <Path path={g.shadow} color="#000" opacity={0.5}>
          <BlurMask blur={26} style="normal" />
        </Path>
        <Path path={g.body}>
          <LinearGradient start={vec(-T_R, 0)} end={vec(T_R, 0)} colors={WOOD} positions={[0, 0.3, 0.7, 1]} />
        </Path>
        <Path path={g.body}>
          <RadialGradient c={vec(-T_R * 0.4, T_H0.z - 120)} r={260} colors={['rgba(255,228,180,0.28)', 'rgba(255,228,180,0)']} />
        </Path>
        <Path path={g.grooves} style="stroke" strokeWidth={4} color="#2b170a" opacity={0.8} />
        <Path path={g.grooves} style="stroke" strokeWidth={1.4} color="#f0c98c" opacity={0.4} />
        <Path path={g.body} style="stroke" strokeWidth={3} color="#1e1107" />
        <Path path={g.opening} color="#0b0705" />
        <Path path={g.lip}>
          <LinearGradient start={vec(-T_R, 0)} end={vec(T_R, 0)} colors={['#8a5426', '#c48f52', '#5c3417']} />
        </Path>
        <Path path={g.head}>
          <LinearGradient start={vec(-T_R, 0)} end={vec(T_R, 0)} colors={SKIN} />
        </Path>
        <PlayerInFront pose={tonbakPose('top')} dim={0.85} />
      </Group>
    );
  }
  return (
    <Group>
      <Path path={g.floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={['#202128', '#141519', '#0b0b0e']} />
      </Path>
      <Path path={g.floorEdge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
      <Path path={g.chair} style="stroke" strokeWidth={10} color="#3a3d45" opacity={0.7} />
      <PlayerBehind pose={tonbakPose('side')} dim={0.85} />
      <Group transform={[{ translateX: 8 }, { translateY: 12 }]}>
        <Path path={g.silhouette} color="#000" opacity={0.5}>
          <BlurMask blur={18} style="normal" />
        </Path>
      </Group>
      <Path path={g.silhouette} style="stroke" strokeWidth={6} color="#1e1107" />
      <Path path={g.silhouette}>
        <LinearGradient start={vec(-T_R, T_H0.y - T_R)} end={vec(T_R, T_H0.y + T_R + 120)} colors={WOOD} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      {/* The skin head, face-on: lit from the upper left, a darker edge where
          the edge strokes land. */}
      <Path path={g.head}>
        <RadialGradient c={vec(-T_R * 0.35, T_H0.y - T_R * 0.4)} r={T_R * 1.6} colors={SKIN} />
      </Path>
      <Path path={g.rim} style="stroke" strokeWidth={14} color="#9c7d4c" opacity={0.35} />
      <Path path={g.head} style="stroke" strokeWidth={3} color="#5c3417" />
      <Circle cx={-T_R * 0.4} cy={T_H0.y - T_R * 0.45} r={T_R * 0.25} color="#ffffff" opacity={0.12}>
        <BlurMask blur={T_R * 0.2} style="normal" />
      </Circle>
      <PlayerInFront pose={tonbakPose('side')} dim={0.85} />
    </Group>
  );
}

export function tonbakLabels(view: ViewId): ArtLabel[] {
  if (view === 'top') {
    const sb = 0.2 * T_LEN;
    return [
      { id: 'head', text: 'HEAD · FACING THE PLAYER’S RIGHT', short: 'HEAD', u: 0, v: T_H0.z + T_R * SIN_T + 34, align: 'center' },
      { id: 'bowl', text: 'BOWL', u: radiusAt(sb) + 20, v: zOf(sb), align: 'left', tone: 'muted' },
      { id: 'neck', text: 'NECK', u: radiusAt(0.62 * T_LEN) + 20, v: zOf(0.62 * T_LEN), align: 'left', tone: 'muted' },
      { id: 'foot', text: 'FOOT · OPENING', short: 'OPENING', u: radiusAt(T_LEN) + 20, v: zOf(T_LEN) + 4, align: 'left', tone: 'muted' },
      { id: 'player', text: 'PLAYER', u: -470, v: 160, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'head', text: 'HEAD (SKIN)', short: 'HEAD', u: 0, v: T_H0.y - T_R - 34, align: 'center' },
    { id: 'player', text: 'PLAYER', u: -430, v: -1250, align: 'center', tone: 'muted' },
    { id: 'floor', text: 'FLOOR', u: 1300, v: -22, align: 'right', tone: 'illustrative' },
  ];
}

export function tonbakHitTest(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): string | null {
  if (view === 'top') {
    if (Math.abs(v - T_H0.z) <= T_R * SIN_T + tol && Math.abs(u) <= T_R + tol) return 'tb.head';
    const s = (T_H0.z - v) / COS_T;
    if (s < -tol || s > T_LEN + tol) return null;
    if (Math.abs(u) > radiusAt(Math.max(0, Math.min(T_LEN, s))) + tol) return null;
    if (s >= T_LEN - 25) return 'tb.opening';
    return s < 0.4 * T_LEN ? 'tb.bowl' : s < 0.86 * T_LEN ? 'tb.neck' : 'tb.foot';
  }
  const du = u;
  const dv = (v - T_H0.y) / COS_T;
  const r = Math.hypot(du, dv);
  if (r <= T_R - 22) return 'tb.head';
  if (r <= T_R + tol * 0.5) return 'tb.rim';
  if (r <= T_R + 10 + tol) return 'tb.bowl';
  // The foot peeks out below the bowl.
  const ff = T_F;
  if (Math.abs(u - ff.x) <= radiusAt(T_LEN) + tol && v >= T_H0.y && v <= ff.y + radiusAt(T_LEN) + tol) return 'tb.foot';
  return null;
}

/** The ink for the sound page's overlay (the head's centre and edge). */
export const TONBAK_POINTS = { head: T_H0, normal: T_N, foot: T_F, mid: alongAxis(T_LEN / 2) };
