/**
 * A10 HARMONICA — the look (charter §2 layer 3), drawn ONLY from model.ts's
 * sizes and geometry.ts's anchors, in millimetres of each view:
 *   side   u = x, v = y — the player in profile (from their right), the
 *          harmonica at the lips in cupped hands, the breath stream drawn
 *          faintly out of the back; the harp amp cut through its speaker
 *          (the speaker family's own section, unchanged)
 *   top    u = x, v = z — from above: the player's head and shoulders, the
 *          hands round the harmonica; the amp from above
 *   front  the MEET page's close-up: the harmonica taken apart (covers, reed
 *          plates, comb, holes) beside the hands round it; or the amp's front
 * Chrome covers and brass plates lit from the upper left with rim
 * highlights; the comb a dark wood; skin in the shared player's neutral
 * lay-figure grey. Nothing moves by itself (D8).
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
import { BRASS, STEEL } from '../shared/metal/metalArt';
import { ampExtras, ampLessonArt } from '../shared/speakers/ampArt';
import { CabFront } from '../shared/speakers/SpeakerArt';
import { cabFrontHit, frontBox } from '../shared/speakers/cabLabels.ts';
import { PlayerBehind } from '../shared/players/PlayerFigure';
import type { PlayerPose } from '../shared/players/playerPose.ts';
import { limb, MassArt, ProfileBehind, ProfileFront, SHIRT, SHIRT_RIM, SKIN, SKIN_EDGE, SKIN_RIM, type Pt } from '../shared/freereed/PlayerProfile';
import { BULLET, HARMONICA } from '../shared/freereed/freeReedSpec.ts';
import { AMP, BREATH, FLOOR_Y, H0, HD, HH, HL, profilePose, type HandState } from './model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const pt = (u: number, v: number): Pt => ({ u, v });
const HIGHLIGHT = '#ffc64d';
const CHROME = ['#ffffff', '#dfe4ec', '#9aa3b1', '#5d6572', '#c9d0da'];
const COMB = ['#6b4a2c', '#4a321c', '#2c1d10'];
const AIR = '#9fd4ff';
const AMP_ART = ampLessonArt('combo');

function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

/* ═══════════════ the harmonica ═══════════════ */

/** The harmonica in profile (end-on to the comb), its hole face at (u, v),
 *  the back toward +u: comb, two reed plates, two chrome covers open at the back. */
export function HarpProfile({ u, v, hi = false }: { u: number; v: number; hi?: boolean }): ReactElement {
  const t = HARMONICA.plateT.mm * 1.6;
  const ch = HARMONICA.combH.mm;
  const comb = rr(u, v - ch / 2, u + HD - 3, v + ch / 2, 1.5);
  const plateTop = rr(u + 1, v - ch / 2 - t, u + HD - 2, v - ch / 2, 0.6);
  const plateBot = rr(u + 1, v + ch / 2, u + HD - 2, v + ch / 2 + t, 0.6);
  // A cover: a folded sheet over a plate, its back edge turned in.
  const cover = (s: number): SkPath => {
    const p = make();
    const y0 = v + s * (ch / 2 + t);
    const y1 = v + s * (HH / 2);
    p.moveTo(u - 0.5, y0);
    p.lineTo(u - 0.5, y1);
    p.lineTo(u + HD - 6, y1);
    p.quadTo(u + HD + 1, y1, u + HD + 1, y1 - s * 4);
    p.lineTo(u + HD + 1, y0 - s * 0.5);
    p.lineTo(u + HD - 2, y0 - s * 0.5);
    p.lineTo(u + HD - 2, y1 - s * 2.5);
    p.lineTo(u + 2, y1 - s * 2.5);
    p.lineTo(u + 2, y0);
    p.close();
    return p;
  };
  return (
    <Group>
      <Path path={comb}>
        <LinearGradient start={vec(u, v - ch / 2)} end={vec(u + HD, v + ch / 2)} colors={COMB} />
      </Path>
      {[plateTop, plateBot].map((p, i) => (
        <Path key={i} path={p}>
          <LinearGradient start={vec(u, v - 8)} end={vec(u + HD, v + 8)} colors={[BRASS[0], BRASS[2], BRASS[3]]} />
        </Path>
      ))}
      {[-1, 1].map((s) => (
        <Group key={s}>
          <Path path={cover(s)}>
            <LinearGradient start={vec(u, v - HH / 2)} end={vec(u + HD, v + HH / 2)} colors={CHROME} />
          </Path>
          <Path path={cover(s)} style="stroke" strokeWidth={0.6} color="#3a3f48" />
        </Group>
      ))}
      {hi ? <Path path={rr(u - 6, v - HH / 2 - 6, u + HD + 7, v + HH / 2 + 6, 4)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** The harmonica from above, its hole face along u = x0 (holes toward −u). */
export function HarpTop({ u, z, hi = false }: { u: number; z: number; hi?: boolean }): ReactElement {
  const top = rr(u - 0.5, z - HL / 2, u + HD + 1, z + HL / 2, 3);
  const lip = rr(u - 0.5, z - HL / 2 + 1, u + 3, z + HL / 2 - 1, 1);
  const crease = make();
  crease.moveTo(u + HD - 7, z - HL / 2 + 4);
  crease.lineTo(u + HD - 7, z + HL / 2 - 4);
  return (
    <Group>
      <Path path={top} color="#000" opacity={0.4} transform={[{ translateX: 2 }, { translateY: 3 }]}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path path={top}>
        <LinearGradient start={vec(u, z - HL / 2)} end={vec(u + HD, z + HL / 2)} colors={CHROME} />
      </Path>
      <Path path={lip} color={COMB[1]} />
      <Path path={crease} style="stroke" strokeWidth={0.8} color="#6a7280" />
      <Path path={top} style="stroke" strokeWidth={0.7} color="#3a3f48" />
      {hi ? <Path path={rr(u - 6, z - HL / 2 - 6, u + HD + 7, z + HL / 2 + 6, 4)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/* ═══════════════ the hands (the hand chamber) ═══════════════ */

/** The near hand's line in profile, from the wrist round the back of the
 *  harmonica (offsets from H0, per chamber state). */
const NEAR_HAND: Record<HandState, Pt[]> = {
  open: [pt(14, 110), pt(48, 58), pt(80, -2), pt(112, -64)],
  half: [pt(14, 110), pt(56, 52), pt(86, -8), pt(82, -58), pt(54, -72)],
  cupped: [pt(14, 110), pt(60, 50), pt(90, -6), pt(84, -56), pt(52, -76), pt(20, -62)],
  mic: [pt(14, 110), pt(78, 62), pt(134, 4), pt(128, -56), pt(88, -84), pt(36, -70)],
};
const FAR_HAND: Pt[] = [pt(0, 104), pt(22, 44), pt(34, -22), pt(18, -52)];
const RADII = [30, 34, 26, 21, 17, 15];

function handPath(line: Pt[], at: Pt): SkPath {
  const pts = line.map((q) => pt(at.u + q.u, at.v + q.v));
  return limb(pts, RADII.slice(0, pts.length));
}

/** The finger divisions on a hand line's last stretch (three curved strokes). */
function fingerLines(line: Pt[], at: Pt): SkPath {
  const p = make();
  const n = line.length;
  for (let i = Math.max(1, n - 3); i < n; i++) {
    const a = line[i - 1];
    const b = line[i];
    const m = pt(at.u + (a.u + b.u) / 2, at.v + (a.v + b.v) / 2);
    const ang = Math.atan2(b.v - a.v, b.u - a.u) + Math.PI / 2;
    p.moveTo(m.u - Math.cos(ang) * 14, m.v - Math.sin(ang) * 14);
    p.quadTo(m.u + Math.cos(ang - Math.PI / 2) * 5, m.v + Math.sin(ang - Math.PI / 2) * 5, m.u + Math.cos(ang) * 14, m.v + Math.sin(ang) * 14);
  }
  return p;
}

/** The harp mic (a chrome bullet), its grille's nose at (u, v), pointing −u. */
export function Bullet({ u, v, scale = 1 }: { u: number; v: number; scale?: number }): ReactElement {
  const R = (BULLET.d.mm / 2) * scale;
  const L = BULLET.l.mm * scale;
  const body = make();
  body.moveTo(u + R * 0.7, v - R);
  body.quadTo(u - R * 0.2, v - R, u - R * 0.15, v);
  body.quadTo(u - R * 0.2, v + R, u + R * 0.7, v + R);
  body.lineTo(u + L - 12 * scale, v + R * 0.62);
  body.quadTo(u + L, v + R * 0.5, u + L, v);
  body.quadTo(u + L, v - R * 0.5, u + L - 12 * scale, v - R * 0.62);
  body.close();
  const grille = make();
  for (let k = 1; k < 6; k++) {
    const x = u + k * R * 0.14 - R * 0.15;
    grille.moveTo(x, v - R * (0.4 + k * 0.1));
    grille.lineTo(x, v + R * (0.4 + k * 0.1));
  }
  const cable = make();
  cable.moveTo(u + L, v);
  cable.quadTo(u + L + 40 * scale, v + 10 * scale, u + L + 60 * scale, v + 70 * scale);
  return (
    <Group>
      <Path path={cable} style="stroke" strokeWidth={8 * scale} strokeCap="round" color="#141519" />
      <Path path={body}>
        <LinearGradient start={vec(u, v - R)} end={vec(u + L * 0.6, v + R)} colors={[STEEL[0], STEEL[1], STEEL[3], STEEL[4]]} />
      </Path>
      <Path path={grille} style="stroke" strokeWidth={1.4 * scale} color="#2b3038" opacity={0.7} />
      <Path path={body} style="stroke" strokeWidth={1.2 * scale} color="#2b3038" />
      <Circle cx={u + L * 0.62} cy={v - R * 0.52} r={6 * scale} color="#1b1c20" />
    </Group>
  );
}

/** The hands round the harmonica in profile (the far hand behind, then the
 *  harmonica, then the near hand), for a chamber state. */
export function HandsProfile({ at, state, hi = false, showHarp = true }: { at: Pt; state: HandState; hi?: boolean; showHarp?: boolean }): ReactElement {
  const near = handPath(NEAR_HAND[state], at);
  const far = handPath(FAR_HAND, at);
  const lines = fingerLines(NEAR_HAND[state], at);
  const thumb = limb([pt(at.u + 30, at.v + 72), pt(at.u + 12, at.v + 30), pt(at.u + 4, at.v + 16)], [17, 14, 12]);
  return (
    <Group>
      <Group opacity={0.75}>
        <MassArt path={far} ramp={['#6e737c', '#52565e', '#3c3f45']} rim={SKIN_RIM} edge={SKIN_EDGE} />
      </Group>
      {state === 'mic' ? <Bullet u={at.u + HD + 2} v={at.v} /> : null}
      {showHarp ? <HarpProfile u={at.u} v={at.v} /> : null}
      <Path path={near} color="#000" opacity={0.3} transform={[{ translateX: 5 }, { translateY: 8 }]}>
        <BlurMask blur={8} style="normal" />
      </Path>
      <MassArt path={near} ramp={SKIN} rim={SKIN_RIM} edge={SKIN_EDGE} />
      <MassArt path={thumb} ramp={SKIN} rim={SKIN_RIM} edge={SKIN_EDGE} />
      <Path path={lines} style="stroke" strokeWidth={2} strokeCap="round" color={SKIN_EDGE} opacity={0.55} />
      {hi ? <Path path={rr(at.u - 30, at.v - 100, at.u + 150, at.v + 140, 30)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** The hands from above round the harmonica (both hands, mirrored about its centre). */
function HandsTop({ x, z, hi = false }: { x: number; z: number; hi?: boolean }): ReactElement {
  const side = (s: number) => limb([pt(x + 6, z + s * 118), pt(x + 46, z + s * 92), pt(x + 84, z + s * 58), pt(x + 96, z + s * 20)], [30, 36, 26, 18]);
  return (
    <Group>
      {[-1, 1].map((s) => (
        <Group key={s}>
          <Path path={side(s)} color="#000" opacity={0.3} transform={[{ translateX: 4 }, { translateY: 6 }]}>
            <BlurMask blur={7} style="normal" />
          </Path>
          <MassArt path={side(s)} ramp={SKIN} rim={SKIN_RIM} edge={SKIN_EDGE} />
        </Group>
      ))}
      {hi ? <Path path={rr(x - 20, z - 160, x + 140, z + 160, 30)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** The breath leaving the back of the harmonica (a faint cone). */
function BreathCone({ view }: { view: ViewId }): ReactElement {
  const v0 = view === 'side' ? H0.y : H0.z;
  const a = (BREATH.half * Math.PI) / 180;
  const u0 = H0.x + HD + 4;
  const p = make();
  p.moveTo(u0, v0);
  p.lineTo(u0 + BREATH.len, v0 - BREATH.len * Math.tan(a));
  p.lineTo(u0 + BREATH.len, v0 + BREATH.len * Math.tan(a));
  p.close();
  return (
    <Group>
      <Path path={p} opacity={0.2}>
        <LinearGradient start={vec(u0, v0)} end={vec(u0 + BREATH.len, v0)} colors={[AIR, 'rgba(159,212,255,0)']} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.5} color={AIR} opacity={0.35}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
    </Group>
  );
}

/* ═══════════════ the player ═══════════════ */
const PROFILE = profilePose();

/** The player from above (the shared player, turned to face +x). */
const ABOVE: PlayerPose = {
  view: 'above',
  posture: 'standing',
  head: { c: { u: 0, v: 0 }, r: 104 },
  neck: { u: 0, v: -24 },
  shoulderR: { u: -188, v: -40 },
  shoulderL: { u: 188, v: -40 },
  elbowR: { u: -214, v: 60 },
  elbowL: { u: 214, v: 60 },
  handR: { wrist: { u: -118, v: 96 }, dir: Math.PI / 2, kind: 'above' },
  handL: { wrist: { u: 118, v: 96 }, dir: Math.PI / 2, kind: 'above' },
  hipR: { u: -110, v: -10 },
  hipL: { u: 110, v: -10 },
  kneeR: { u: -110, v: 60 },
  kneeL: { u: 110, v: 60 },
  footR: { u: -100, v: 196 },
  footL: { u: 100, v: 196 },
  floor: null,
};
/** The near (right) arm from above, in the turned frame (world mm). */
const ARM_R_TOP = limb([pt(H0.x - 130, H0.z + 188), pt(H0.x - 30, H0.z + 214), pt(H0.x + 6, H0.z + 118)], [50, 41, 30]);

function PlayerTop(): ReactElement {
  return (
    <Group>
      <Group transform={[{ translateX: H0.x - 90 }, { translateY: H0.z }, { rotate: -Math.PI / 2 }]}>
        <PlayerBehind pose={ABOVE} />
      </Group>
      <MassArt path={ARM_R_TOP} ramp={SHIRT} rim={SHIRT_RIM} edge="#171a21" />
    </Group>
  );
}

/* ═══════════════ the placement scene ═══════════════ */

function Floor({ u0, u1 }: { u0: number; u1: number }): ReactElement {
  const p = rr(u0, FLOOR_Y, u1, FLOOR_Y + 60, 0);
  return (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(0, FLOOR_Y)} end={vec(0, FLOOR_Y + 60)} colors={['#2b2d33', '#16171b']} />
      </Path>
      <Path path={(() => { const q = make(); q.moveTo(u0, FLOOR_Y); q.lineTo(u1, FLOOR_Y); return q; })()} style="stroke" strokeWidth={3} color="#4a4d56" />
    </Group>
  );
}

const STATE_IN_SCENE: HandState = 'half';

function SceneSide({ hi }: { hi: string | null }): ReactElement {
  return (
    <Group>
      <Floor u0={AMP.box.x0 - 900} u1={H0.x + 3000} />
      {AMP_ART.Instrument({ view: 'side', variant: 'open' })}
      <ProfileBehind pose={PROFILE} />
      <BreathCone view="side" />
      <ProfileFront pose={PROFILE} />
      <HandsProfile at={{ u: H0.x, v: H0.y }} state={STATE_IN_SCENE} hi={hi === 'hm.hands'} />
      {hi === 'hm.harp' ? <Path path={rr(H0.x - 6, H0.y - HH / 2 - 6, H0.x + HD + 7, H0.y + HH / 2 + 6, 4)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

function SceneTop({ hi }: { hi: string | null }): ReactElement {
  return (
    <Group>
      {AMP_ART.Instrument({ view: 'top', variant: 'open' })}
      <PlayerTop />
      <BreathCone view="top" />
      <HarpTop u={H0.x} z={H0.z} hi={hi === 'hm.harp'} />
      <HandsTop x={H0.x} z={H0.z} hi={hi === 'hm.hands'} />
    </Group>
  );
}

function harmonicaLabels(view: ViewId): ArtLabel[] {
  const v0 = view === 'side' ? H0.y : H0.z;
  return view === 'side'
    ? [
        { id: 'harp', text: 'HARMONICA', short: 'HARP', u: H0.x + 60, v: v0 - 150, align: 'left', at: { u: H0.x + HD / 2, v: v0 - HH / 2 } },
        { id: 'hands', text: 'HANDS (THE CHAMBER)', short: 'HANDS', u: H0.x + 150, v: v0 + 120, align: 'left', at: { u: H0.x + 70, v: v0 + 40 } },
        { id: 'breath', text: 'BREATH STREAM', short: 'BREATH', u: H0.x + 250, v: v0 - 40, align: 'left', tone: 'illustrative', at: { u: H0.x + 180, v: v0 } },
      ]
    : [
        { id: 'harp', text: 'HARMONICA', short: 'HARP', u: H0.x + 90, v: v0 - 190, align: 'left', at: { u: H0.x + HD / 2, v: v0 - HL / 2 } },
        { id: 'hands', text: 'HANDS', u: H0.x + 150, v: v0 + 170, align: 'left', at: { u: H0.x + 80, v: v0 + 60 } },
        { id: 'player', text: 'PLAYER', u: H0.x - 300, v: v0 - 260, align: 'center', tone: 'muted' },
      ];
}

function inAcoustic(u: number): boolean {
  return u > (AMP.box.x1 + H0.x) / 2;
}

function harmonicaHit(view: ViewId, u: number, v: number, tol: number): string | null {
  const v0 = view === 'side' ? H0.y : H0.z;
  const halfV = view === 'side' ? HH / 2 : HL / 2;
  if (u >= H0.x - tol && u <= H0.x + HD + tol && Math.abs(v - v0) <= halfV + tol) return 'hm.harp';
  if (Math.hypot(u - (H0.x + 50), v - v0) <= 130 + tol) return 'hm.hands';
  if (view === 'side' && Math.hypot(u - (H0.x - 90), v - (H0.y - 41)) <= 120 + tol) return 'hm.head';
  if (u < H0.x && u > H0.x - 320 && (view === 'side' ? v > H0.y + 60 && v < FLOOR_Y : Math.abs(v - v0) < 260)) return 'hm.body';
  return null;
}

export const A10_ART: LessonArt = {
  Instrument: ({ view }: { view: ViewId; variant: VariantId }) => (view === 'side' ? <SceneSide hi={null} /> : <SceneTop hi={null} />),
  labels: (view, variant) => (variant === 'amp' ? AMP_ART.labels(view, 'open') : harmonicaLabels(view)),
  hitTest: (view, _variant, u, v, tol) => (inAcoustic(u) ? harmonicaHit(view, u, v, tol) : AMP_ART.hitTest(view, 'open', u, v, tol)),
  labelsYieldToMic: true,
};

/** The player's face in profile at the harmonica (house line-art: brow,
 *  nose, lips, chin — no eye), the lips on the hole face at `at`. */
function facePath(at: Pt): SkPath {
  const P = (u: number, v: number) => [at.u + u, at.v + v] as const;
  const f = make();
  f.moveTo(...P(-64, -160));
  f.cubicTo(...P(-40, -140), ...P(-30, -112), ...P(-30, -96));
  f.quadTo(...P(-24, -86), ...P(-20, -76));
  f.lineTo(...P(6, -44));
  f.quadTo(...P(4, -36), ...P(-14, -34));
  f.quadTo(...P(-2, -26), ...P(-3, -16));
  f.quadTo(...P(-12, -2), ...P(-3, 12));
  f.quadTo(...P(-6, 26), ...P(-20, 30));
  f.cubicTo(...P(-12, 52), ...P(-24, 70), ...P(-62, 76));
  f.lineTo(...P(-112, 82));
  return f;
}

/** The face as part of the figure (owner 2026-10-06: no separate line-art
 *  head on a lab figure): the profile above closed into the lower head and
 *  neck, painted as the same lit skin mass as the hands beside it. */
function faceMass(at: Pt): SkPath {
  const P = (u: number, v: number) => [at.u + u, at.v + v] as const;
  const f = facePath(at);
  f.lineTo(...P(-150, 92));
  f.quadTo(...P(-190, 0), ...P(-176, -96));
  f.quadTo(...P(-150, -168), ...P(-64, -160));
  f.close();
  return f;
}

/* ═══════════════ the MEET page's close-up ═══════════════ */

/* The harmonica taken apart, drawn oblique (a cabinet projection: depth up
 * and to the right), larger than life, beside the hands round it in profile. */
const OB = { dx: 0.5, dy: -0.36 };
const EX = { u: 30, top: 70, gap: 30 };
const LAYERS: { id: string; t: number; kind: 'cover' | 'plate' | 'comb' }[] = [
  { id: 'hm.cover', t: 5, kind: 'cover' },
  { id: 'hm.reeds', t: 3, kind: 'plate' },
  { id: 'hm.comb', t: 11, kind: 'comb' },
  { id: 'hm.reeds', t: 3, kind: 'plate' },
  { id: 'hm.cover', t: 5, kind: 'cover' },
];
const SCALE = 1.9;
function layerBox(i: number) {
  const L = HL * SCALE;
  const D = HD * SCALE;
  let y = EX.top;
  for (let k = 0; k < i; k++) y += LAYERS[k].t * SCALE + EX.gap;
  return { u0: EX.u, u1: EX.u + L, v0: y, v1: y + LAYERS[i].t * SCALE, dx: D * OB.dx, dy: D * OB.dy };
}

function Layer({ i, hi }: { i: number; hi: string | null }): ReactElement {
  const b = layerBox(i);
  const kind = LAYERS[i].kind;
  const pal = kind === 'cover' ? CHROME : kind === 'plate' ? [BRASS[0], BRASS[1], BRASS[3]] : COMB;
  const front = rr(b.u0, b.v0, b.u1, b.v1, 1.5);
  const topFace = make();
  topFace.moveTo(b.u0, b.v0);
  topFace.lineTo(b.u0 + b.dx, b.v0 + b.dy);
  topFace.lineTo(b.u1 + b.dx, b.v0 + b.dy);
  topFace.lineTo(b.u1, b.v0);
  topFace.close();
  const endFace = make();
  endFace.moveTo(b.u1, b.v0);
  endFace.lineTo(b.u1 + b.dx, b.v0 + b.dy);
  endFace.lineTo(b.u1 + b.dx, b.v1 + b.dy);
  endFace.lineTo(b.u1, b.v1);
  endFace.close();
  const L = b.u1 - b.u0;
  const pitch = L / 10;
  const marks = make();
  if (kind === 'comb') {
    // The ten holes on the mouth side.
    for (let k = 0; k < 10; k++) marks.addRRect(Skia.RRectXY(Skia.XYWHRect(b.u0 + k * pitch + pitch * 0.22, b.v0 + (b.v1 - b.v0) * 0.22, pitch * 0.56, (b.v1 - b.v0) * 0.56), 2, 2));
  }
  const reeds = make();
  if (kind === 'plate') {
    // Ten reed slots seen on the plate's top face, each with its tongue.
    for (let k = 0; k < 10; k++) {
      const s0 = 0.15 + k * 0.083;
      const ua = b.u0 + L * s0;
      const len = 0.72 - k * 0.028;
      reeds.moveTo(ua + b.dx * 0.15, b.v0 + b.dy * 0.15);
      reeds.lineTo(ua + b.dx * (0.15 + len), b.v0 + b.dy * (0.15 + len));
    }
  }
  const on = hi === LAYERS[i].id;
  return (
    <Group>
      <Path path={topFace}>
        <LinearGradient start={vec(b.u0, b.v0 + b.dy)} end={vec(b.u1 + b.dx, b.v0)} colors={[pal[0], pal[1]]} />
      </Path>
      <Path path={endFace} color={pal[pal.length > 3 ? 3 : 2]} />
      <Path path={front}>
        <LinearGradient start={vec(b.u0, b.v0)} end={vec(b.u0, b.v1)} colors={[pal[1], pal[2]]} />
      </Path>
      {kind === 'comb' ? <Path path={marks} color="#0b0805" /> : null}
      {kind === 'plate' ? <Path path={reeds} style="stroke" strokeWidth={2.4} strokeCap="round" color={BRASS[4]} /> : null}
      <Path path={topFace} style="stroke" strokeWidth={0.8} color="#2b2f36" opacity={0.7} />
      <Path path={front} style="stroke" strokeWidth={0.8} color="#2b2f36" opacity={0.8} />
      {on ? <Path path={rr(b.u0 - 8, b.v0 + b.dy - 8, b.u1 + b.dx + 8, b.v1 + 8, 6)} style="stroke" strokeWidth={3} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

const CLOSE = { u: 430, v: 170 };
const MEET_BOX = { u0: 0, u1: 610, v0: 10, v1: 330 };

function MeetHarmonica({ hi }: { hi: string | null }): ReactElement {
  // The lower face beside the hands, the same lit skin as the hands.
  const face = faceMass(CLOSE);
  return (
    <Group>
      {LAYERS.map((_, i) => (
        <Layer key={i} i={i} hi={hi} />
      ))}
      <MassArt path={face} ramp={SKIN} rim={SKIN_RIM} edge={SKIN_EDGE} />
      <HandsProfile at={CLOSE} state="half" hi={hi === 'hm.hands'} />
      {hi === 'hm.harp' ? <Path path={rr(CLOSE.u - 8, CLOSE.v - 22, CLOSE.u + HD + 9, CLOSE.v + 22, 5)} style="stroke" strokeWidth={3} color={HIGHLIGHT} /> : null}
      {hi === 'hm.holes' ? <Path path={rr(EX.u - 6, layerBox(2).v0 - 6, EX.u + HL * SCALE + 6, layerBox(2).v1 + 6, 4)} style="stroke" strokeWidth={3} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

function meetLabels(): ArtLabel[] {
  const b = (i: number) => layerBox(i);
  const r = EX.u + HL * SCALE + 30;
  return [
    { id: 'cover', text: 'COVER PLATES', short: 'COVERS', u: r, v: b(0).v0 - 2, align: 'left' },
    { id: 'reeds', text: 'REED PLATES', short: 'REEDS', u: r, v: b(1).v0 - 4, align: 'left' },
    { id: 'comb', text: 'COMB · HOLES 1–10', short: 'COMB', u: r, v: b(2).v0 - 2, align: 'left' },
    { id: 'apart', text: 'TAKEN APART · DRAWN LARGER', short: 'TAKEN APART', u: EX.u, v: 30, align: 'left', tone: 'muted' },
    { id: 'held', text: 'HELD AT THE LIPS', short: 'AT THE LIPS', u: CLOSE.u + 30, v: 30, align: 'center', tone: 'muted' },
    { id: 'hands', text: 'HANDS', u: CLOSE.u + 150, v: CLOSE.v + 120, align: 'left', at: { u: CLOSE.u + 80, v: CLOSE.v + 50 } },
  ];
}

function meetHit(u: number, v: number, tol: number): string | null {
  for (let i = 0; i < LAYERS.length; i++) {
    const b = layerBox(i);
    if (u >= b.u0 - tol && u <= b.u1 + b.dx + tol && v >= b.v0 + b.dy - tol && v <= b.v1 + tol) return LAYERS[i].kind === 'comb' ? (u < EX.u + 30 ? 'hm.comb' : 'hm.holes') : LAYERS[i].id;
  }
  if (u >= CLOSE.u - tol && u <= CLOSE.u + HD + tol && Math.abs(v - CLOSE.v) <= HH / 2 + tol) return 'hm.harp';
  if (Math.hypot(u - (CLOSE.u + 60), v - CLOSE.v) <= 140 + tol) return 'hm.hands';
  return null;
}

const AMP_EX = (hi: string | null) => ampExtras('combo', hi);

export const HARP_FRONT: FrontArt = {
  box: (v) => (v === 'amp' ? (() => { const b = frontBox('combo12'); return { ...b, v0: b.v0 - 40 }; })() : MEET_BOX),
  Art: ({ variant, highlight }) =>
    variant === 'amp' ? (
      <Group>
        <CabFront kind="combo12" mode="baffle" spot={null} />
        {AMP_EX(highlight).render?.('front') ?? null}
      </Group>
    ) : (
      <MeetHarmonica hi={highlight} />
    ),
  labels: (v) => (v === 'amp' ? [{ id: 'spk', text: 'THE SPEAKER, BEHIND THE CLOTH (DRAWN WITHOUT IT)', short: 'SPEAKER BEHIND THE CLOTH', u: (AMP.box.z0 + AMP.box.z1) / 2, v: AMP.box.y1 - 30, align: 'center', tone: 'muted' }] : meetLabels()),
  hitTest: (v, u, w, tol) => (v === 'amp' ? AMP_EX(null).hit?.('front', u, w, tol) ?? cabFrontHit('combo12', u, w, tol) : meetHit(u, w, tol)),
};

/* ═══════════════ HOW IT SOUNDS: the hand chamber ═══════════════ */

const CH_BOX = { u0: -190, u1: 300, v0: -150, v1: 170 };

export function HandChamber({ w, h, state, accessibilityLabel }: { w: number; h: number; state: HandState; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', CH_BOX, w, h, 6), [w, h]);
  const at = { u: 0, v: 0 };
  // The sound's way out: straight out (open), through the gap (partly),
  // round the closed chamber (cupped), into the mic (harp mic).
  const out = make();
  const arcs = make();
  if (state === 'open') {
    for (const dv of [-30, 0, 30]) {
      out.moveTo(HD + 6, dv * 0.3);
      out.lineTo(220, dv * 1.6);
    }
    for (let i = 0; i < 3; i++) arcs.addArc(Skia.XYWHRect(130 + i * 40 - 60, -60 - i * 20, 120, 120 + i * 40), -50, 100);
  } else if (state === 'half') {
    out.moveTo(HD + 6, 0);
    out.quadTo(90, 20, 150, -50);
    out.lineTo(220, -110);
    for (let i = 0; i < 2; i++) arcs.addArc(Skia.XYWHRect(150 + i * 36 - 50, -140 - i * 14, 100, 100 + i * 28), -80, 70);
  } else if (state === 'cupped') {
    out.moveTo(HD + 6, 0);
    out.quadTo(80, 30, 60, -30);
    out.quadTo(40, -50, 70, -60);
  } else {
    out.moveTo(HD + 6, 0);
    out.lineTo(HD + 26, 0);
  }
  const lips = faceMass({ u: 0, v: 0 });
  const st = state;
  const labels: StaticLabel[] = [
    { id: 'harp', text: 'HARMONICA', u: 40, v: -128, align: 'left', tone: 'muted' },
    st === 'mic'
      ? { id: 'mic', text: 'HARP MIC INSIDE THE CHAMBER', short: 'HARP MIC', u: 120, v: 140, align: 'center', tone: 'amber' }
      : { id: 'out', text: st === 'cupped' ? 'A CLOSED CHAMBER' : st === 'half' ? 'OUT THROUGH THE GAP' : 'STRAIGHT OUT', short: st === 'cupped' ? 'CLOSED' : 'OUT', u: 200, v: st === 'open' ? 120 : -130, align: 'center', tone: 'blue' },
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <MassArt path={lips} ramp={SKIN} rim={SKIN_RIM} edge={SKIN_EDGE} />
          <HandsProfile at={at} state={state} />
          <Path path={out} style="stroke" strokeWidth={3} strokeCap="round" color={AIR} opacity={0.8}>
            <DashPathEffect intervals={[10, 7]} />
          </Path>
          <Path path={arcs} style="stroke" strokeWidth={2} color="#ffc64d" opacity={0.7} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
export const HAND_CHAMBER_ASPECT = (CH_BOX.u1 - CH_BOX.u0) / (CH_BOX.v1 - CH_BOX.v0);
