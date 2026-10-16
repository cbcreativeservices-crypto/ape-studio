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
 *          plates, comb, holes) beside the player at the lips, true size, in
 *          a close-up window (PlayerClose); or the amp's front
 * Chrome covers and brass plates lit from the upper left with rim
 * highlights; the comb a dark wood; skin in the shared figure skin. Nothing moves by itself (D8).
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
import { armPath, FIGURE_SKIN, headProfile, PlayerBehind } from '../shared/players/PlayerFigure';
import type { HandView, V3 } from '../shared/players/handModel.ts';
import { hmHands, type PosedArm } from '../shared/freereed/freeReedHands.ts';
import type { PlayerPose } from '../shared/players/playerPose.ts';
import { Hand3Art, MassArt, ProfileBehind, ProfileFront, SHIRT, SHIRT_RIM, type Pt } from '../shared/freereed/PlayerProfile';
import { BULLET, HARMONICA } from '../shared/freereed/freeReedSpec.ts';
import { AMP, BODY, BREATH, FLOOR_Y, H0, HD, HH, HL, profilePose, type HandState } from './model.ts';

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

/** The forearm's picture angle (elbow → wrist) in a view. */
function angleIn(view: HandView, a: PosedArm): number {
  const e = view(a.E);
  const w = view(a.W);
  return Math.atan2(w.v - e.v, w.u - e.u);
}

/** Frame H round H0 seen from the player's right, placed at `at` (the
 *  harmonica's hole face): u = x, v = y, toward the viewer +z. */
const profileViews = new Map<string, HandView>();
function profileView(at: Pt): HandView {
  const k = `${at.u}:${at.v}`;
  let v = profileViews.get(k);
  if (!v) {
    v = (p: V3) => ({ u: at.u + p.x, v: at.v + p.y, d: p.z });
    profileViews.set(k, v);
  }
  return v;
}
/** The harmonica's middle plane (z = 0): the left hand's far side lies behind it. */
const MID_CUT = { p: { x: 0, y: 0, z: 0 }, n: { x: 0, y: 0, z: 1 } };

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

/**
 * The hands round the harmonica in profile, for a chamber state (figure pass
 * 3: the posed hands, freeReedHands.hmHands): the far (left) hand's far side
 * behind the harmonica — the thumb under it, the index's pad on its top, the
 * other fingers curved round its back — then the harmonica (and the harp
 * mic), then the left hand's near side and the right hand cupped over it.
 */
export function HandsProfile({ at, state, hi = false, showHarp = true }: { at: Pt; state: HandState; hi?: boolean; showHarp?: boolean }): ReactElement {
  const h = hmHands(state);
  const view = profileView(at);
  return (
    <Group>
      <Hand3Art sk={h.L.sk} view={view} fore={angleIn(view, h.L)} cut={MID_CUT} part="behind" far />
      {state === 'mic' ? <Bullet u={at.u + HD + 2} v={at.v} /> : null}
      {showHarp ? <HarpProfile u={at.u} v={at.v} /> : null}
      <Hand3Art sk={h.L.sk} view={view} fore={angleIn(view, h.L)} cut={MID_CUT} part="front" far />
      <Hand3Art sk={h.R.sk} view={view} fore={angleIn(view, h.R)} />
      {hi ? <Path path={rr(at.u - 40, at.v - 110, at.u + 170, at.v + 150, 30)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** The hands from above round the harmonica (the posed hands; the left
 *  index's pad on its top, the right hand cupped in front). */
const TOP_HANDS: HandView = (p) => ({ u: H0.x + p.x, v: H0.z + p.z, d: -p.y });
function HandsTop({ hi = false }: { hi?: boolean }): ReactElement {
  const h = hmHands(STATE_IN_SCENE);
  return (
    <Group>
      <Hand3Art sk={h.L.sk} view={TOP_HANDS} fore={angleIn(TOP_HANDS, h.L)} />
      <Hand3Art sk={h.R.sk} view={TOP_HANDS} fore={angleIn(TOP_HANDS, h.R)} />
      {hi ? <Path path={rr(H0.x - 40, H0.z - 170, H0.x + 170, H0.z + 170, 30)} style="stroke" strokeWidth={4} color={HIGHLIGHT} /> : null}
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
  // Figure pass 3: the arms end at the posed hands' wrists (frame H round H0,
  // turned: u = −z, v = x + 90 — the group below turns it to face +x).
  elbowR: { u: -hmHands('half').R.E.z, v: hmHands('half').R.E.x + 90 },
  elbowL: { u: -hmHands('half').L.E.z, v: hmHands('half').L.E.x + 90 },
  handR: { wrist: { u: -hmHands('half').R.W.z, v: hmHands('half').R.W.x + 90 }, dir: Math.PI / 2, kind: 'above' },
  handL: { wrist: { u: -hmHands('half').L.W.z, v: hmHands('half').L.W.x + 90 }, dir: Math.PI / 2, kind: 'above' },
  hipR: { u: -110, v: -10 },
  hipL: { u: 110, v: -10 },
  kneeR: { u: -110, v: 60 },
  kneeL: { u: 110, v: 60 },
  footR: { u: -100, v: 196 },
  footL: { u: 100, v: 196 },
  floor: null,
};
/** The near (right) arm from above (world mm): the shared anatomical arm
 *  from the shoulder to the posed right hand's wrist (figure pass 3). */
const ARM_R_TOP = (() => {
  const R = hmHands('half').R;
  const P = (q: V3) => pt(H0.x + q.x, H0.z + q.z);
  return armPath(P(R.S), P(R.E), P(R.W));
})();

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
      <HandsTop hi={hi === 'hm.hands'} />
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
  if (view === 'side' && Math.hypot(u - BODY.headC.x, v - BODY.headC.y) <= 120 + tol) return 'hm.head';
  if (u < H0.x && u > H0.x - 320 && (view === 'side' ? v > H0.y + 60 && v < FLOOR_Y : Math.abs(v - v0) < 260)) return 'hm.body';
  return null;
}

export const A10_ART: LessonArt = {
  Instrument: ({ view }: { view: ViewId; variant: VariantId }) => (view === 'side' ? <SceneSide hi={null} /> : <SceneTop hi={null} />),
  labels: (view, variant) => (variant === 'amp' ? AMP_ART.labels(view, 'open') : harmonicaLabels(view)),
  hitTest: (view, _variant, u, v, tol) => (inAcoustic(u) ? harmonicaHit(view, u, v, tol) : AMP_ART.hitTest(view, 'open', u, v, tol)),
  labelsYieldToMic: true,
};

/**
 * THE PLAYER AT THE HARMONICA, CLOSE (fix pass 2026-10-16, the grading
 * report: a faceless head fragment and hands floating with no body): the
 * same player as the placement scene — the shared profile head (brow, nose,
 * lips, chin, the ear) on its neck into the collar, the shoulders, both arms
 * from the shoulders to the posed hands — round the harmonica whose hole face
 * is at `at`, cropped by the frame `crop` like a camera's close-up.
 */
export function PlayerClose({ at, state, crop, hi = null, showHarp = true }: { at: Pt; state: HandState; crop: SkPath; hi?: string | null; showHarp?: boolean }): ReactElement {
  const pose = profilePose(at, state);
  // Close up, the shared head's own line-art detail (the ear, the brow, the
  // jaw) over its skin mass, above the collar.
  const head = headProfile(pose.head.c, pose.head.r, pose.neck.v - 10, 1);
  const above = rr(pose.head.c.u - 200, pose.head.c.v - 200, pose.head.c.u + 200, pose.neck.v - 40, 0);
  return (
    <Group clip={crop}>
      <ProfileBehind pose={pose} />
      <Group clip={above}>
        <Path path={head.line} style="stroke" strokeWidth={2} strokeCap="round" color={FIGURE_SKIN.edge} opacity={0.55} />
      </Group>
      <ProfileFront pose={pose} />
      <HandsProfile at={at} state={state} hi={hi === 'hm.hands'} showHarp={showHarp} />
    </Group>
  );
}

/* ═══════════════ the MEET page's close-up ═══════════════ */

/* The harmonica taken apart, drawn oblique (a cabinet projection: depth up
 * and to the right), larger than life, beside the hands round it in profile. */
const OB = { dx: 0.5, dy: -0.36 };
/* Fix pass 2026-10-16: each part's name sits in the gap ABOVE its layer, so
 * no name runs onto the player's head (they ran right, onto the face). */
const EX = { u: 24, top: 78, gap: 48 };
const LAYERS: { id: string; t: number; kind: 'cover' | 'plate' | 'comb' }[] = [
  { id: 'hm.cover', t: 5, kind: 'cover' },
  { id: 'hm.reeds', t: 3, kind: 'plate' },
  { id: 'hm.comb', t: 11, kind: 'comb' },
  { id: 'hm.reeds', t: 3, kind: 'plate' },
  { id: 'hm.cover', t: 5, kind: 'cover' },
];
const SCALE = 1.5;
function layerBox(i: number) {
  const L = HL * SCALE;
  const D = HD * SCALE;
  let y = EX.top;
  for (let k = 0; k < i; k++) y += LAYERS[k].t * SCALE + EX.gap;
  return { u0: EX.u, u1: EX.u + L, v0: y, v1: y + LAYERS[i].t * SCALE, dx: D * OB.dx, dy: D * OB.dy };
}

/*
 * A 10-hole diatonic harmonica, real-world (drawn here 1.5x): 102 mm long,
 * 28 mm deep, about 26 mm tall. The comb about 10 mm thick, its ten
 * channels about 5.5 mm wide at a 7.3 mm pitch (holes 1-10 span about
 * 72 mm, a solid end of about 15 mm each side for the fixings); two brass
 * reed plates about 1.2 mm thick, ten slots each, the slots shortening
 * from hole 1 (about 16 mm) to hole 10 (about 8 mm), each reed tongue
 * riveted on one face and seen through its slot; two stamped steel covers,
 * their front edge rolled, held by a screw at each end. Generic, no maker.
 */
const HOLE0 = 0.14; // hole 1's left edge, as a fraction of the length
const HOLE_P = 0.072; // the hole pitch (7.3 mm of 102)
const HOLE_W = 0.054; // a hole's width (5.5 mm)
const FIX = [0.06, 0.94]; // the end fixings (screws), as length fractions

function Layer({ i, hi }: { i: number; hi: string | null }): ReactElement {
  const b = layerBox(i);
  const kind = LAYERS[i].kind;
  const L = b.u1 - b.u0;
  /** A point on the layer's TOP face: fu along the length, fd into the depth. */
  const P = (fu: number, fd: number): [number, number] => [b.u0 + L * fu + b.dx * fd, b.v0 + b.dy * fd];
  /** A quad on the top face from (fu0, fd0) to (fu1, fd1). */
  const quad = (fu0: number, fd0: number, fu1: number, fd1: number): SkPath => {
    const p = make();
    const a = P(fu0, fd0);
    p.moveTo(a[0], a[1]);
    for (const q of [P(fu1, fd0), P(fu1, fd1), P(fu0, fd1)]) p.lineTo(q[0], q[1]);
    p.close();
    return p;
  };
  /** A small ellipse on the top face (a screw head or a hole, foreshortened). */
  const dot = (fu: number, fd: number, r: number): SkPath => {
    const p = make();
    const c = P(fu, fd);
    p.addOval(Skia.XYWHRect(c[0] - r, c[1] - r * 0.62, r * 2, r * 1.24));
    return p;
  };
  const pal = kind === 'cover' ? CHROME : kind === 'plate' ? [BRASS[0], BRASS[1], BRASS[3]] : COMB;
  const front = rr(b.u0, b.v0, b.u1, b.v1, kind === 'cover' ? 2.4 : 1.2);
  const topFace = quad(0, 0, 1, 1);
  const endFace = make();
  endFace.moveTo(b.u1, b.v0);
  endFace.lineTo(b.u1 + b.dx, b.v0 + b.dy);
  endFace.lineTo(b.u1 + b.dx, b.v1 + b.dy);
  endFace.lineTo(b.u1, b.v1);
  endFace.close();
  const on = hi === LAYERS[i].id;
  const holeU = (k: number) => HOLE0 + k * HOLE_P + (HOLE_P - HOLE_W) / 2;
  const detail: ReactElement[] = [];
  if (kind === 'cover') {
    // The rolled front edge catches the light; a soft shade toward the open back.
    detail.push(<Path key="roll" path={quad(0, 0, 1, 0.13)} color="#ffffff" opacity={0.55} />);
    detail.push(<Path key="back" path={quad(0, 0.8, 1, 1)} color="#4a515c" opacity={0.28} />);
    detail.push(<Path key="rollLine" path={quad(0.004, 0.13, 0.996, 0.135)} color="#7d8592" opacity={0.6} />);
    for (const fu of FIX) {
      detail.push(<Path key={`s${fu}`} path={dot(fu, 0.5, 3.4)} color="#3a3f48" />);
      detail.push(<Path key={`h${fu}`} path={dot(fu - 0.004, 0.46, 2.1)} color="#e8ecf2" />);
      const slot = make();
      const a = P(fu - 0.012, 0.5);
      const c = P(fu + 0.012, 0.5);
      slot.moveTo(a[0], a[1]);
      slot.lineTo(c[0], c[1]);
      detail.push(<Path key={`k${fu}`} path={slot} style="stroke" strokeWidth={0.9} color="#3a3f48" />);
    }
  } else if (kind === 'plate') {
    // Ten slots, longest at hole 1; the reed tongue seen in each slot.
    for (let k = 0; k < 10; k++) {
      const u0 = holeU(k) + HOLE_W * 0.28;
      const u1 = holeU(k) + HOLE_W * 0.72;
      const len = 0.58 - k * 0.03;
      const d0 = 0.2;
      detail.push(<Path key={`sl${k}`} path={quad(u0, d0, u1, d0 + len)} color="#2a1c07" />);
      detail.push(<Path key={`rd${k}`} path={quad(u0 + 0.003, d0 + 0.04, u1 - 0.003, d0 + len - 0.03)} color={BRASS[2]} />);
      detail.push(<Path key={`rh${k}`} path={quad(u0 + 0.003, d0 + 0.04, u0 + 0.008, d0 + len - 0.03)} color={BRASS[0]} opacity={0.75} />);
    }
    for (const fu of FIX) detail.push(<Path key={`f${fu}`} path={dot(fu, 0.5, 2.6)} color="#2a1c07" />);
  } else {
    // The comb: wood grain along its length; ten channels open on its top
    // face (the reed plates close them), each running back from its hole.
    const grain = make();
    for (const fd of [0.12, 0.31, 0.47, 0.66, 0.88]) {
      const a = P(0.01, fd);
      const c = P(0.99, fd + 0.03);
      grain.moveTo(a[0], a[1]);
      grain.lineTo(c[0], c[1]);
    }
    detail.push(<Path key="grain" path={grain} style="stroke" strokeWidth={0.7} color="#a07a52" opacity={0.35} />);
    for (let k = 0; k < 10; k++) detail.push(<Path key={`ch${k}`} path={quad(holeU(k), 0, holeU(k) + HOLE_W, 0.86)} color="#140d07" />);
    const holes = make();
    const fh = b.v1 - b.v0;
    for (let k = 0; k < 10; k++) holes.addRRect(Skia.RRectXY(Skia.XYWHRect(b.u0 + L * holeU(k), b.v0 + fh * 0.16, L * HOLE_W, fh * 0.68), 1.4, 1.4));
    for (const fu of FIX) detail.push(<Path key={`f${fu}`} path={dot(fu, 0.5, 2.6)} color="#140d07" />);
    detail.push(<Path key="holesFront" path={holes} color="#0b0805" />);
  }
  return (
    <Group>
      <Path path={topFace}>
        <LinearGradient start={vec(b.u0, b.v0 + b.dy)} end={vec(b.u1 + b.dx, b.v0)} colors={[pal[0], pal[1]]} />
      </Path>
      <Path path={endFace} color={pal[pal.length > 3 ? 3 : 2]} />
      <Path path={front}>
        <LinearGradient start={vec(b.u0, b.v0)} end={vec(b.u0, b.v1)} colors={[pal[1], pal[2]]} />
      </Path>
      {detail}
      <Path path={topFace} style="stroke" strokeWidth={0.8} color="#2b2f36" opacity={0.7} />
      <Path path={front} style="stroke" strokeWidth={0.8} color="#2b2f36" opacity={0.8} />
      <Path path={endFace} style="stroke" strokeWidth={0.8} color="#2b2f36" opacity={0.6} />
      {on ? <Path path={rr(b.u0 - 8, b.v0 + b.dy - 8, b.u1 + b.dx + 8, b.v1 + 8, 6)} style="stroke" strokeWidth={3} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

/** The close-up: the hole face's place, and the frame that crops the player. */
const CLOSE = { u: 500, v: 212 };
const CROP = { u0: 284, u1: 690, v0: 34, v1: 412, r: 18 };
const MEET_BOX = { u0: 0, u1: 700, v0: 0, v1: 420 };
const CROP_PATH = rr(CROP.u0, CROP.v0, CROP.u1, CROP.v1, CROP.r);

function MeetHarmonica({ hi }: { hi: string | null }): ReactElement {
  return (
    <Group>
      {LAYERS.map((_, i) => (
        <Layer key={i} i={i} hi={hi} />
      ))}
      {/* The close-up's window, then the player at true size inside it. */}
      <Path path={CROP_PATH} color="#1d1f25" />
      <PlayerClose at={CLOSE} state="half" crop={CROP_PATH} hi={hi} />
      <Path path={CROP_PATH} style="stroke" strokeWidth={2} color="#3a3d47" />
      {hi === 'hm.harp' ? <Path path={rr(CLOSE.u - 8, CLOSE.v - 22, CLOSE.u + HD + 9, CLOSE.v + 22, 5)} style="stroke" strokeWidth={3} color={HIGHLIGHT} /> : null}
      {hi === 'hm.holes' ? <Path path={rr(EX.u - 6, layerBox(2).v0 + layerBox(2).dy - 6, EX.u + HL * SCALE + layerBox(2).dx + 6, layerBox(2).v1 + 6, 4)} style="stroke" strokeWidth={3} color={HIGHLIGHT} /> : null}
    </Group>
  );
}

function meetLabels(): ArtLabel[] {
  const b = (i: number) => layerBox(i);
  /** Above a layer: in the gap between it and the one over it. */
  const above = (i: number) => b(i).v0 + b(i).dy - 14;
  return [
    { id: 'cover', text: 'COVER PLATES', short: 'COVERS', u: EX.u, v: above(0), align: 'left' },
    { id: 'reeds', text: 'REED PLATES', short: 'REEDS', u: EX.u, v: above(1), align: 'left' },
    { id: 'comb', text: 'COMB · HOLES 1–10', short: 'COMB', u: EX.u, v: above(2), align: 'left' },
    { id: 'apart', text: 'TAKEN APART · DRAWN LARGER', short: 'TAKEN APART', u: EX.u, v: 16, align: 'left', tone: 'muted' },
    { id: 'held', text: 'HELD AT THE LIPS · TRUE SIZE', short: 'AT THE LIPS', u: (CROP.u0 + CROP.u1) / 2, v: 16, align: 'center', tone: 'muted' },
    { id: 'hands', text: 'HANDS', u: CROP.u1 - 14, v: CROP.v0 + 30, align: 'right', at: { u: CLOSE.u + 62, v: CLOSE.v - 52 } },
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

/** The sound page's close-up: the player's head, shoulders and hands (fix pass 2026-10-16: the whole player, cropped, not a face fragment). */
const CH_BOX = { u0: -230, u1: 300, v0: -180, v1: 240 };
const CH_CROP = rr(CH_BOX.u0, CH_BOX.v0, CH_BOX.u1, CH_BOX.v1, 0);

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
  const st = state;
  const labels: StaticLabel[] = [
    { id: 'harp', text: 'HARMONICA', u: 40, v: -128, align: 'left', tone: 'muted' },
    st === 'mic'
      ? { id: 'mic', text: 'HARP MIC INSIDE THE CHAMBER', short: 'HARP MIC', u: 112, v: 190, align: 'left', tone: 'amber' }
      : { id: 'out', text: st === 'cupped' ? 'A CLOSED CHAMBER' : st === 'half' ? 'OUT THROUGH THE GAP' : 'STRAIGHT OUT', short: st === 'cupped' ? 'CLOSED' : 'OUT', u: 200, v: st === 'open' ? 120 : -130, align: 'center', tone: 'blue' },
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <PlayerClose at={at} state={state} crop={CH_CROP} />
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
