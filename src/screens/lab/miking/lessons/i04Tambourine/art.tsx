/**
 * I04 HEADLESS TAMBOURINE — the look (charter §2 layer 3), drawn ONLY from the
 * poses in model.ts, in millimetres of the view's (u, v): side u = x, v = y;
 * top u = x, v = z.
 *
 *   SIDE  the ring's plane contains z, so from the side it is seen EDGE-ON:
 *         the wooden band with its slots and the near half's jingle pairs
 *         (thin discs on pins) — and NO head: nothing spans the middle. The
 *         right hand grips the frame's player-side edge; struck, the other
 *         hand waits open in front of it; mounted, the ring lies flat on a
 *         stand clamp and the right hand holds a stick.
 *   TOP   the ring from above — open in the middle (the floor shows through)
 *         — or the crescent's arc, the jingles round it, the back of the hand
 *         over the grip.
 * Counts and sizes no source gives are drawing defaults (8 slots, Ø 50 mm
 * discs, a 45 mm frame). Nothing moves (D8).
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, FillType, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { arrow, INK, make, oval, rrect, seg, type SkPath } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFist, openHand, placeBetween, profileFist, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { PercStand, Stick } from '../shared/smallperc/objects';
import { JOUT, R, stateOf, TMB_DIMS, type TmbState } from './model.ts';

const DEPTH = TMB_DIMS.depth.mm;
const SLOTS = TMB_DIMS.slots.mm;
const JD = TMB_DIMS.jingleD.mm;
const CR = TMB_DIMS.crescentR.mm;
const WOOD = ['#d6a061', '#a96f36', '#784a1d', '#4a2a12'];
const JINGLE = ['#ffffff', '#e2e5ec', '#a3a9b4', '#5d616c'];
const FIST = profileFist(10);
const BACK = dorsalFist();
const OPEN = openHand(16);
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

/** Slot angles round the ring (one row). */
export function slotAngles(): number[] {
  return Array.from({ length: SLOTS }, (_, i) => ((i + 0.5) / SLOTS) * 2 * Math.PI);
}

/* ── edge-on: local u along e1 (u0…u1), w across the depth (−D/2 … D/2) ── */
function edgeGeo(u0: number, u1: number, arc: [number, number] | null): { band: SkPath; slots: SkPath; discs: SkPath; pins: SkPath; sheen: SkPath } {
  const band = rrect(make(), u0, -DEPTH / 2, u1, DEPTH / 2, 5);
  const slots = make();
  const discs = make();
  const pins = make();
  for (const a of slotAngles()) {
    const deg = (a * 180) / Math.PI;
    if (arc && (deg < arc[0] || deg > arc[1])) continue;
    const s = Math.sin(a);
    if (s <= 0.12) continue; // the near half only
    const r = arc ? CR : R;
    const u = r * Math.cos(a);
    const half = (JD / 2) * s + 4;
    rrect(slots, u - half - 3, -9, u + half + 3, 9, 3);
    rrect(discs, u - half, -4.6, u + half, -1.4, 1.3);
    rrect(discs, u - half, 1.4, u + half, 4.6, 1.3);
    seg(pins, u, -10, u, 10);
  }
  const sheen = seg(make(), u0 + 10, -DEPTH / 2 + 4, u1 - 10, -DEPTH / 2 + 4);
  return { band, slots, discs, pins, sheen };
}

export function EdgeOn({ s }: { s: TmbState }) {
  const p = s.pose;
  const g = useMemo(() => (s.crescent ? edgeGeo(-CR, CR * 0.17, [80, 280]) : edgeGeo(-R - JOUT, R + JOUT, null)), [s.crescent]);
  const ang = (Math.atan2(p.e1.y, p.e1.x) * 180) / Math.PI;
  return (
    <Group transform={[{ translateX: p.c.x }, { translateY: p.c.y }, { rotate: (ang * Math.PI) / 180 }]}>
      <Group transform={[{ translateX: 6 }, { translateY: 10 }]}>
        <Path path={g.band} color="#000" opacity={0.4}>
          <BlurMask blur={8} style="normal" />
        </Path>
      </Group>
      <Path path={g.band}>
        <LinearGradient start={vec(0, -DEPTH / 2)} end={vec(0, DEPTH / 2)} colors={WOOD} />
      </Path>
      <Path path={g.slots} color="#1a0f07" />
      <Path path={g.pins} style="stroke" strokeWidth={1.6} color="#3a3d45" />
      <Path path={g.discs}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={JINGLE} />
      </Path>
      <Path path={g.discs} style="stroke" strokeWidth={0.5} color={INK} opacity={0.7} />
      <Path path={g.band} style="stroke" strokeWidth={1.2} color="#3a2210" />
      <Path path={g.sheen} style="stroke" strokeWidth={2} strokeCap="round" color="#ffe2b8" opacity={0.45} />
    </Group>
  );
}

/* ── from above: the open ring (or the crescent's arc) at the pose's tilt ── */
function FromAbove({ s }: { s: TmbState }) {
  const p = s.pose;
  const kx = Math.abs(p.e1.x);
  const g = useMemo(() => {
    const r = s.crescent ? CR : R + JOUT;
    const ring = make();
    if (s.crescent) {
      // The arc band: outer and inner edges from 80° to 280° (about e1).
      const N = 24;
      const w = TMB_DIMS.crescentW.mm;
      for (let i = 0; i <= N; i++) {
        const a = ((80 + (200 * i) / N) * Math.PI) / 180;
        const x = Math.cos(a) * r * kx;
        const z = Math.sin(a) * r;
        if (i === 0) ring.moveTo(x, z);
        else ring.lineTo(x, z);
      }
      for (let i = N; i >= 0; i--) {
        const a = ((80 + (200 * i) / N) * Math.PI) / 180;
        ring.lineTo(Math.cos(a) * (r - w) * kx, Math.sin(a) * (r - w));
      }
      ring.close();
    } else {
      oval(ring, 0, 0, r * kx, r);
      oval(ring, 0, 0, (R - TMB_DIMS.frameT.mm) * kx, R - TMB_DIMS.frameT.mm);
      ring.setFillType(FillType.EvenOdd); // an open ring
    }
    const discs = make();
    for (const a of slotAngles()) {
      const deg = (a * 180) / Math.PI;
      if (s.crescent && (deg < 85 || deg > 275)) continue;
      const rr = s.crescent ? CR - TMB_DIMS.crescentW.mm / 2 : R + 2;
      oval(discs, rr * Math.cos(a) * kx, rr * Math.sin(a), (JD / 2) * Math.max(0.35, kx * Math.abs(Math.sin(a)) + 0.2), (JD / 2) * Math.max(0.35, Math.abs(Math.cos(a))));
    }
    return { ring, discs };
  }, [s.crescent, kx]);
  return (
    <Group transform={[{ translateX: p.c.x }, { translateY: p.c.z }]}>
      <Group transform={[{ translateX: 14 }, { translateY: 20 }]}>
        <Path path={g.ring} color="#000" opacity={0.45}>
          <BlurMask blur={12} style="normal" />
        </Path>
      </Group>
      <Path path={g.ring}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={WOOD} />
      </Path>
      <Path path={g.discs}>
        <RadialGradient c={vec(-R * 0.5, -R * 0.5)} r={R * 2.2} colors={JINGLE} />
      </Path>
      <Path path={g.discs} style="stroke" strokeWidth={0.6} color={INK} opacity={0.6} />
      <Path path={g.ring} style="stroke" strokeWidth={1.3} color="#3a2210" />
    </Group>
  );
}

function Shake({ s, view }: { s: TmbState; view: ViewId }) {
  const p = useMemo(() => {
    const q = make();
    const c = s.pose.c;
    if (view === 'top') {
      const x = c.x + R * 0.9;
      arrow(q, x, 0, x, -TMB_DIMS.shake.mm - 40, 16);
      arrow(q, x, 0, x, TMB_DIMS.shake.mm + 40, 16);
    } else {
      // The strike toward the other hand, along the ring's normal.
      const a = { x: c.x + s.pose.n.x * 60, y: c.y + s.pose.n.y * 60 };
      arrow(q, a.x, a.y, c.x + s.pose.n.x * 175, c.y + s.pose.n.y * 175, 16);
    }
    return q;
  }, [s, view]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

export function TambourineArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const a = s.arm;
  const mounted = s.id === 'mounted';
  const plSide = useMemo(() => placeBetween(mounted ? BACK : FIST, side(a.W), side(a.G)), [a, mounted]);
  const plTop = useMemo(() => placeBetween(BACK, top(a.W), top(a.G)), [a]);
  const off = s.off;
  const plFreeSide = useMemo(() => (off ? { at: side(off.W), angle: (Math.atan2(off.G.y - off.W.y, off.G.x - off.W.x) * 180) / Math.PI - 50, mirror: true } : null), [off]);
  const plFreeTop = useMemo(() => (off ? placeBetween(OPEN, top(off.W), top(off.G)) : null), [off]);
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        {mounted ? <PercStand x={-R - 30} top={0} to={[-R - 30, 0]} z /> : null}
        {s.id === 'shaken' || s.id === 'crescent' ? <Shake s={s} view="top" /> : null}
        {off && plFreeTop ? (
          <>
            <Arm2D s={top(off.S)} e={top(off.E)} w={top(off.W)} />
            <Hand geo={OPEN} pl={plFreeTop} />
          </>
        ) : null}
        <Arm2D s={top(a.S)} e={top(a.E)} w={top(a.W)} />
        {mounted ? (
          <Hand geo={BACK} pl={plTop} heldBehind held={<Stick a={top(s.stick!.a)} b={top(s.stick!.b)} w={13} />} />
        ) : (
          <Hand geo={BACK} pl={plTop} heldBehind held={<FromAbove s={s} />} />
        )}
        {mounted ? <FromAbove s={s} /> : null}
      </Group>
    );
  }
  return (
    <Group>
      {off && plFreeSide ? (
        <>
          <Arm2D s={side(off.S)} e={side(off.E)} w={side(off.W)} />
        </>
      ) : null}
      <PlayerSide />
      {mounted ? <PercStand x={-R - 30} top={s.pose.c.y + 20} to={[-R + 10, s.pose.c.y + 16]} /> : null}
      {s.id === 'struck' ? <Shake s={s} view="side" /> : null}
      <Arm2D s={side(a.S)} e={side(a.E)} w={side(a.W)} />
      {mounted ? (
        <>
          <EdgeOn s={s} />
          <Hand geo={BACK} pl={plSide} heldBehind held={<Stick a={side(s.stick!.a)} b={side(s.stick!.b)} w={13} />} />
        </>
      ) : (
        <Hand geo={FIST} pl={plSide} held={<EdgeOn s={s} />} />
      )}
      {off && plFreeSide ? <Hand geo={OPEN} pl={plFreeSide} /> : null}
    </Group>
  );
}

export function tambourineLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const p = s.pose;
  if (view === 'top') {
    const out: ArtLabel[] = [
      { id: 'jingles', text: 'JINGLE PAIRS', short: 'JINGLES', u: p.c.x + 30, v: (s.crescent ? CR : R) + 60, align: 'center' },
      { id: 'open', text: s.crescent ? 'CRESCENT · NO HEAD' : 'NO HEAD · OPEN RING', short: 'NO HEAD', u: p.c.x - 60, v: -158, align: 'right', tone: 'muted', at: { u: p.c.x, v: -18 } },
      { id: 'player', text: 'PLAYER', u: -380, v: 320, align: 'center', tone: 'muted' },
    ];
    if (s.id === 'shaken' || s.id === 'crescent') out.push({ id: 'shake', text: '↕ THE SHAKE', short: '↕', u: p.c.x + R + 40, v: -TMB_DIMS.shake.mm - 60, align: 'left', tone: 'illustrative' });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'jingles', text: 'JINGLE PAIRS', short: 'JINGLES', u: p.c.x + p.e1.x * (R + 40) + 30, v: p.c.y + p.e1.y * (R + 40) + 10, align: 'left' },
    { id: 'frame', text: s.crescent ? 'CRESCENT FRAME' : 'FRAME (NO HEAD)', short: 'FRAME', u: p.c.x + p.n.x * 70 + 10, v: p.c.y + p.n.y * 70 - 16, align: 'left' },
    { id: 'player', text: '← PLAYER', u: -380, v: -880, align: 'center', tone: 'muted', point: { u: -6000, v: -880 } },
  ];
  if (s.id === 'struck') out.push({ id: 'otherHand', text: 'OTHER HAND', u: p.c.x + p.n.x * 230, v: p.c.y + p.n.y * 230 - 20, align: 'left', tone: 'illustrative' });
  if (s.id === 'mounted') out.push({ id: 'mount', text: 'STAND CLAMP', u: -R - 60, v: -700, align: 'right', tone: 'illustrative' });
  return out;
}

export function tambourineHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const p = s.pose;
  const id = s.id;
  if (view === 'top') {
    const kx = Math.max(0.2, Math.abs(p.e1.x));
    const r = Math.hypot((u - p.c.x) / kx, v - p.c.z);
    const rr = s.crescent ? CR : R;
    if (r <= rr + JOUT + tol && r >= rr - 30) return Math.abs(r - rr) < 14 ? `tmb.jingles.${id}` : `tmb.frame.${id}`;
    if (id === 'mounted' && Math.hypot(u - (-R - 30), v) <= 24 + tol) return 'tmb.mount';
    return null;
  }
  const ang = Math.atan2(p.e1.y, p.e1.x);
  const dx = u - p.c.x;
  const dy = v - p.c.y;
  const lu = dx * Math.cos(ang) + dy * Math.sin(ang);
  const lw = -dx * Math.sin(ang) + dy * Math.cos(ang);
  const rr = s.crescent ? CR : R;
  if (Math.abs(lu) <= rr + JOUT + tol && Math.abs(lw) <= DEPTH / 2 + tol) return Math.abs(lw) < 10 ? `tmb.jingles.${id}` : `tmb.frame.${id}`;
  if (id === 'mounted') {
    if (Math.abs(u - (-R - 30)) <= 20 + tol && v > p.c.y) return 'tmb.mount';
    const st = s.stick!;
    const t = Math.max(0, Math.min(1, ((u - st.a.x) * (st.b.x - st.a.x) + (v - st.a.y) * (st.b.y - st.a.y)) / ((st.b.x - st.a.x) ** 2 + (st.b.y - st.a.y) ** 2)));
    if (Math.hypot(u - (st.a.x + t * (st.b.x - st.a.x)), v - (st.a.y + t * (st.b.y - st.a.y))) <= 12 + tol) return 'tmb.stick';
  }
  return null;
}

export const TMB_ART: LessonArt = { Instrument: TambourineArt, labels: tambourineLabels, hitTest: tambourineHitTest };
