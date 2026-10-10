/**
 * M03 RACK AND FLOOR TOMS — the look (charter §2 layer 3), drawn ONLY from
 * the shared drum family and kit (lessons/shared) and the anchors in
 * geometry.ts, in millimetres of the view's (u, v): side u = x, v = y; top
 * u = x, v = z (the kit frame).
 *
 *   RACK PAIR, side: the 12 in tom CUT OPEN at its centre plane, tilted toward
 *   the player on the holder that stands on the kick; the 10 in tom behind
 *   it; both crashes above (dimmed); a stick at the strike.
 *   RACK PAIR, top: both toms tilted toward the player, the holder, the kick
 *   below, the crashes above (translucent).
 *   FLOOR TOM, side: the 16 in floor tom cut open on its legs (its bottom
 *   head and hoop gone in the HEAD OFF setup), the ride above, the floor.
 *   FLOOR TOM, top: the floor tom, its legs, the ride above.
 *
 * Nothing moves (D8). Every drum sits where the shared kit puts it.
 */
import { Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { BoomStandSide, CymbalPlan, CymbalSide, DrumExterior, DrumPlan, DrumSection, FloorTomLegsSide, KickFromAbove, KickSideNeighbour, Stick, sideTransform, topTransform } from '../shared/drums/DrumArt';
import { makeUprightSound } from '../shared/drums/UprightSound';
import { FLOOR_16x16, KICK_22x18, TOM_12x8 } from '../shared/drums/drumSpec.ts';
import { KIT, KIT_CYMBALS, PLAN_HARDWARE } from '../shared/kitPlanModel.ts';
import { F2, FF, FLOOR, TOM1, TOM2 } from './model.ts';
import { FLOOR_LEGS, MOUNT } from './geometry.ts';

const isRack = (v: VariantId) => v !== 'floor' && v !== 'open';
const C1 = KIT_CYMBALS.crash1;
const C2 = KIT_CYMBALS.crash2;
const RIDE = KIT_CYMBALS.ride;
const FLOOR_Y = KIT.floorY;

function MountSide() {
  const p = useMemo(() => {
    const s = Skia.Path.Make();
    s.moveTo(MOUNT.base.x, MOUNT.base.y);
    s.lineTo(MOUNT.top.x, MOUNT.top.y);
    for (const a of MOUNT.arms) {
      s.moveTo(MOUNT.top.x, MOUNT.top.y);
      s.lineTo(a.x, a.y);
    }
    return s;
  }, []);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={22} strokeCap="round" strokeJoin="round" color="#16171b" />
      <Path path={p} style="stroke" strokeWidth={15} strokeCap="round" strokeJoin="round" color="#8a8f99" />
      <Path path={p} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" color="#e4e7ed" opacity={0.5} />
      <Circle cx={MOUNT.top.x} cy={MOUNT.top.y} r={20} color="#1b1c21" />
      <Circle cx={MOUNT.top.x} cy={MOUNT.top.y} r={20} style="stroke" strokeWidth={3} color="#b6bbc5" />
    </Group>
  );
}

function FloorLine({ u0, u1 }: { u0: number; u1: number }) {
  const p = useMemo(() => {
    const s = Skia.Path.Make();
    s.addRect(Skia.XYWHRect(u0, FLOOR_Y, u1 - u0, 400));
    return s;
  }, [u0, u1]);
  return (
    <Path path={p}>
      <LinearGradient start={vec(0, FLOOR_Y)} end={vec(0, FLOOR_Y + 60)} colors={['#202128', '#141519', '#0b0b0e']} />
    </Path>
  );
}

/** The sticks from above (the same strikes as the side views). */
const RACK_STICK_TOP = { from: { x: TOM2.c.x - 330, y: TOM2.c.z + 90 }, to: { x: TOM2.c.x - 14, y: TOM2.c.z - 4 } };
const FLOOR_STICK_TOP = { from: { x: FLOOR.c.x - 300, y: FLOOR.c.z - 120 }, to: { x: FLOOR.c.x - 14, y: FLOOR.c.z - 4 } };

/** The stick, from the player's side to the strike at a drum's centre. */
function stickTo(c: { x: number; y: number }) {
  return { from: { x: c.x - 360, y: c.y - 150 }, to: { x: c.x - 6, y: c.y - 9 } };
}

export function TomsArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  if (isRack(variant)) {
    if (view === 'side') {
      const st = stickTo(TOM2.c);
      return (
        <Group>
          {/* the far crash's own stand (it hung in the air: clash sweep
              2026-10-10), behind everything */}
          <BoomStandSide foot={PLAN_HARDWARE.booms.crash1.u} top={C1.c.y + 140} cym={{ x: C1.c.x, y: C1.c.y }} floorY={FLOOR_Y} dim={0.25} />
          <BoomStandSide foot={PLAN_HARDWARE.booms.crash2.u} top={C2.c.y + 140} cym={{ x: C2.c.x, y: C2.c.y }} floorY={FLOOR_Y} dim={0.35} />
          <CymbalSide cx={C1.c.x} cy={C1.c.y} d={C1.d} tiltDeg={C1.tiltDeg} dim={0.55} />
          <CymbalSide cx={C2.c.x} cy={C2.c.y} d={C2.d} tiltDeg={C2.tiltDeg} dim={0.8} />
          <KickSideNeighbour spec={KICK_22x18} x0={0} cy={0} dim={0.5} />
          <MountSide />
          <Group transform={sideTransform(TOM1)}>
            <DrumExterior spec={TOM1.spec} dim={0.55} />
          </Group>
          <Group transform={sideTransform(TOM2)}>
            <DrumSection spec={TOM_12x8} />
          </Group>
          <Stick from={st.from} to={st.to} />
        </Group>
      );
    }
    return (
      <Group>
        <KickFromAbove spec={KICK_22x18} u0={0} z={0} dim={0.55} />
        <Group transform={topTransform(TOM1)}>
          <DrumPlan drum={TOM1} />
        </Group>
        <Group transform={topTransform(TOM2)}>
          <DrumPlan drum={TOM2} />
        </Group>
        <Stick from={RACK_STICK_TOP.from} to={RACK_STICK_TOP.to} />
        <CymbalPlan cx={C1.c.x} cz={C1.c.z} d={C1.d} tiltDeg={C1.tiltDeg} dim={0.42} />
        <CymbalPlan cx={C2.c.x} cz={C2.c.z} d={C2.d} tiltDeg={C2.tiltDeg} dim={0.42} />
      </Group>
    );
  }
  const open = variant === 'open';
  if (view === 'side') {
    const st = stickTo(FLOOR.c);
    return (
      <Group>
        <FloorLine u0={-2000} u1={2000} />
        <BoomStandSide foot={PLAN_HARDWARE.booms.ride.u} top={RIDE.c.y + 140} cym={{ x: RIDE.c.x, y: RIDE.c.y }} floorY={FLOOR_Y} dim={0.35} />
        <CymbalSide cx={RIDE.c.x} cy={RIDE.c.y} d={RIDE.d} tiltDeg={RIDE.tiltDeg} dim={0.8} />
        <Group transform={sideTransform(FLOOR)}>
          <FloorTomLegsSide spec={FLOOR_16x16} floorS={FLOOR_Y - FLOOR.c.y} />
          <DrumSection spec={FLOOR_16x16} reso={!open} />
        </Group>
        <Stick from={st.from} to={st.to} />
      </Group>
    );
  }
  return (
    <Group>
      <Group transform={topTransform(FLOOR)}>
        <DrumPlan drum={FLOOR} />
      </Group>
      <Stick from={FLOOR_STICK_TOP.from} to={FLOOR_STICK_TOP.to} />
      <CymbalPlan cx={RIDE.c.x} cz={RIDE.c.z} d={RIDE.d} tiltDeg={RIDE.tiltDeg} dim={0.42} />
    </Group>
  );
}

export function tomLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (isRack(variant)) {
    if (view === 'side') {
      return [
        // Round 2 (2026-10-10): each name in free space with a leader to its
        // part, laid out so no leader crosses another or runs through a name.
        { id: 'batter', text: '12 IN BATTER', short: 'BATTER', u: -150, v: -470, align: 'center', at: { u: 100, v: -575 } },
        { id: 'reso', text: 'BOTTOM HEAD', short: 'BOTTOM', u: 400, v: -470, align: 'left', at: { u: 300, v: -395 } },
        { id: 'crash', text: 'CRASH', u: 330, v: -790, align: 'left', tone: 'muted', at: { u: 300, v: C2.c.y + 12 } },
        { id: 'holder', text: 'HOLDER', u: 350, v: -330, align: 'left', tone: 'muted', at: { u: MOUNT.top.x + 2, v: MOUNT.top.y + 14 } },
        { id: 'kick', text: 'KICK', u: -60, v: -220, align: 'right', tone: 'muted', at: { u: 40, v: -220 } },
        { id: 'stick', text: 'STICK', u: -150, v: -600, align: 'center', tone: 'illustrative', at: { u: -100, v: -666 } },
      ];
    }
    return [
      // Each leader lands ON its part (clash sweep 2026-10-10: some pointed
      // at empty glass); the player cue is an arrow only.
      // (on the head above the stick: below centre it sat on the stick)
      { id: 'tom2', text: '12 IN', u: TOM2.c.x + 20, v: TOM2.c.z - 70, align: 'center', at: { u: TOM2.c.x + 20, v: TOM2.c.z - 70 } },
      { id: 'tom1', text: '10 IN', u: TOM1.c.x, v: TOM1.c.z + 30, align: 'center', at: { u: TOM1.c.x, v: TOM1.c.z + 30 } },
      { id: 'crash', text: 'CRASH (ABOVE)', short: 'CRASH', u: C2.c.x + 60, v: C2.c.z - 10, align: 'center', tone: 'muted', at: { u: C2.c.x + 60, v: C2.c.z + C2.d * 0.3 } },
      { id: 'crash1', text: 'CRASH (ABOVE)', short: 'CRASH', u: C1.c.x + 60, v: C1.c.z + 150, align: 'center', tone: 'muted', at: { u: C1.c.x + C1.d * 0.3, v: C1.c.z + C1.d * 0.15 } },
      { id: 'kick', text: 'KICK (BELOW)', short: 'KICK', u: 420, v: 240, align: 'center', tone: 'muted', at: { u: 420, v: 200 } },
      { id: 'player', text: '← PLAYER', u: -170, v: 300, align: 'center', tone: 'muted', point: { u: -1400, v: 300 } },
    ];
  }
  if (view === 'side') {
    return [
      { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: FLOOR.c.x + 20, v: FLOOR.c.y - 46, align: 'left' },
      variant === 'open'
        ? { id: 'open', text: 'BOTTOM HEAD OFF', short: 'OPEN', u: FLOOR.c.x, v: FLOOR.c.y + FF.depth + 40, align: 'center' }
        : { id: 'reso', text: 'BOTTOM HEAD', short: 'BOTTOM', u: FLOOR.c.x + FF.R + 34, v: FLOOR.c.y + FF.depth - 6, align: 'left' },
      { id: 'legs', text: 'LEGS', u: FLOOR.c.x + 40, v: FLOOR_Y - 120, align: 'left', tone: 'muted' },
      { id: 'ride', text: 'RIDE', u: RIDE.c.x - 60, v: RIDE.c.y + 70, align: 'center', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: FLOOR.c.x - 200, v: FLOOR.c.y - 50, align: 'center', tone: 'illustrative', at: { u: FLOOR.c.x - 160, v: FLOOR.c.y - 70 } },
    ];
  }
  return [
    { id: 'batter', text: 'FLOOR TOM', u: FLOOR.c.x, v: FLOOR.c.z + 40, align: 'center' },
    { id: 'ride', text: 'RIDE (ABOVE)', short: 'RIDE', u: RIDE.c.x + 100, v: RIDE.c.z + 140, align: 'center', tone: 'muted' },
    { id: 'rods', text: '8 RODS PER HEAD', short: '8 RODS', u: FLOOR.c.x + 50, v: FLOOR.c.z - FF.R - 50, align: 'center', tone: 'illustrative' },
    { id: 'leg', text: 'PLAYER’S LEG', short: 'LEG', u: -620, v: 330, align: 'center', tone: 'muted' },
  ];
}

/** The part under a model point (u, v); `tol` in mm. */
export function tomHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const near = (cu: number, cv: number, r: number) => Math.hypot(u - cu, v - cv) <= r + tol;
  if (isRack(variant)) {
    if (view === 'side') {
      // Into the 12 in tom's own (untilted) frame.
      const t = (TOM2.tiltDeg * Math.PI) / 180;
      const dx = u - TOM2.c.x;
      const dy = v - TOM2.c.y;
      const lx = dx * Math.cos(t) - dy * Math.sin(t);
      const ly = dx * Math.sin(t) + dy * Math.cos(t);
      const R = F2.R;
      const Dp = F2.depth;
      if (Math.abs(ly) <= 4 + tol && Math.abs(lx) <= R) return 'tom2.batter';
      if (Math.abs(ly - Dp) <= 4 + tol && Math.abs(lx) <= R) return 'tom2.reso';
      if (Math.abs(lx) > R && Math.abs(lx) <= R + 8 + tol && ly >= -12 && ly <= 16) return 'tom2.hoop';
      if (Math.abs(lx) > R && Math.abs(lx) <= R + 28 + tol && ly >= 0 && ly <= Dp) return 'tom2.lugs';
      if (Math.abs(lx) <= R && ly >= 0 && ly <= Dp) return 'tom2.shell';
      if (Math.abs(u - MOUNT.top.x) <= 30 + tol && v >= MOUNT.top.y - 20 && v <= MOUNT.base.y) return 'mount';
      if (Math.abs(u - C2.c.x) <= C2.d / 2 && Math.abs(v - C2.c.y) <= 50 + tol) return 'crash2';
      if (Math.abs(u - C1.c.x) <= C1.d / 2 && Math.abs(v - C1.c.y) <= 50 + tol) return 'crash1';
      if (v > -300 && u >= -20 && u <= 480) return 'kick';
      return null;
    }
    if (near(TOM2.c.x, TOM2.c.z, F2.R)) return 'tom2.batter';
    if (near(TOM1.c.x, TOM1.c.z, TOM1.spec.d.mm / 2)) return 'tom1.batter';
    if (near(C2.c.x, C2.c.z, C2.d / 2)) return 'crash2';
    if (near(C1.c.x, C1.c.z, C1.d / 2)) return 'crash1';
    if (near(PLAN_HARDWARE.tomPost.u, PLAN_HARDWARE.tomPost.v, 30)) return 'mount';
    if (u >= KIT.kick.hoop.u0 && u <= KIT.kick.hoop.u1 && Math.abs(v) <= KIT.kick.hoop.halfW) return 'kick';
    return null;
  }
  if (view === 'side') {
    const R = FF.R;
    const dx = u - FLOOR.c.x;
    const dy = v - FLOOR.c.y;
    if (Math.abs(dy) <= 4 + tol && Math.abs(dx) <= R) return 'floor.batter';
    if (variant !== 'open' && Math.abs(dy - FF.depth) <= 4 + tol && Math.abs(dx) <= R) return 'floor.reso';
    if (Math.abs(dx) > R && Math.abs(dx) <= R + 8 + tol && dy >= -12 && dy <= 16) return 'floor.hoop';
    if (Math.abs(dx) > R && Math.abs(dx) <= R + 28 + tol && dy >= 0 && dy <= FF.depth) return 'floor.lugs';
    if (Math.abs(dx) <= R && dy >= 0 && dy <= FF.depth) return 'floor.shell';
    if (v > FLOOR.c.y + FF.depth && FLOOR_LEGS.some((l) => Math.abs(u - (l.top.x + l.foot.x) / 2) <= 140)) return 'floor.leg0';
    if (Math.abs(u - RIDE.c.x) <= RIDE.d / 2 && Math.abs(v - RIDE.c.y) <= 50 + tol) return 'ride';
    return null;
  }
  if (near(FLOOR.c.x, FLOOR.c.z, FF.R)) return 'floor.batter';
  if (near(RIDE.c.x, RIDE.c.z, RIDE.d / 2)) return 'ride';
  if (near(FLOOR.c.x, FLOOR.c.z, FF.R + 140)) return 'floor.leg0';
  return null;
}

/** Distance from (u, v) to the segment a–b (mm). */
function segDist(u: number, v: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((u - a.x) * dx + (v - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - (a.x + t * dx), v - (a.y + t * dy));
}

/** Drawn hardware the hit test does not name — the stick, the boom stands,
 *  the floor tom's legs — so the part labels keep off it too (label
 *  occupancy only; taps are unchanged). */
export function tomsDrawnAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  // From above: the stick (a name sat on it, clash sweep 2026-10-10).
  if (view !== 'side') {
    const st = isRack(variant) ? RACK_STICK_TOP : FLOOR_STICK_TOP;
    return segDist(u, v, st.from, st.to) <= 9 + tol;
  }
  if (isRack(variant)) {
    const st = stickTo(TOM2.c);
    if (segDist(u, v, st.from, st.to) <= 9 + tol) return true;
    const foot1 = PLAN_HARDWARE.booms.crash1.u;
    if (Math.abs(u - foot1) <= 20 + tol && v >= C1.c.y + 130) return true;
    if (segDist(u, v, { x: foot1, y: C1.c.y + 140 }, { x: C1.c.x, y: C1.c.y + 24 }) <= 14 + tol) return true;
    const foot = PLAN_HARDWARE.booms.crash2.u;
    if (Math.abs(u - foot) <= 20 + tol && v >= C2.c.y + 130) return true;
    return segDist(u, v, { x: foot, y: C2.c.y + 140 }, { x: C2.c.x, y: C2.c.y + 24 }) <= 14 + tol;
  }
  const st = stickTo(FLOOR.c);
  if (segDist(u, v, st.from, st.to) <= 9 + tol) return true;
  const foot = PLAN_HARDWARE.booms.ride.u;
  if (Math.abs(u - foot) <= 20 + tol && v >= RIDE.c.y + 130) return true;
  return segDist(u, v, { x: foot, y: RIDE.c.y + 140 }, { x: RIDE.c.x, y: RIDE.c.y + 24 }) <= 14 + tol;
}

const SOUND = makeUprightSound((v) => (isRack(v) ? { spec: TOM_12x8, reso: true, wires: null } : { spec: FLOOR_16x16, reso: v !== 'open', wires: null }), { batter: 'BATTER', reso: 'BOTTOM HEAD' });

export const TOMS_ART: LessonArt = {
  Instrument: TomsArt,
  labels: tomLabels,
  hitTest: tomHitTest,
  figureAt: tomsDrawnAt,
  StrikeSequence: SOUND.StrikeSequence,
  CoupledHeads: SOUND.CoupledHeads,
  plan: { own: ['tom1', 'tom2', 'floor'] },
};
