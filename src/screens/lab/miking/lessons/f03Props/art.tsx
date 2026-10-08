/**
 * F03 PROPS AND OBJECT HANDLING — the look (charter §2 layer 3), drawn from
 * the model only (geometry.ts; the shared props, shared/foley/props.tsx):
 * side u = x, v = y (from the artist's right); top u = x, v = z. The prop's
 * sounding part sits at the origin in every variant.
 *
 *   KEYS   the artist holding the key ring at hand level.
 *   PAPER  the artist at a sturdy table, a sheet of paper lifting.
 *   DOOR   the door on its Foley stand, the artist's hand on the lever; in
 *          plan the swing arc and the two pinch points (amber, dashed).
 *   CHAIR  the artist behind a wooden chair, hands on its back rail.
 *   LIVE   the keys at a station, the station's rail and the PA.
 * The stage floor is plain boards. Static (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { poseCovers } from '../shared/foley/performer.ts';
import { BoothArt, PitSection, StageFloorPlan, TableArt } from '../shared/foley/StageArt';
import { liveBooth } from '../shared/foley/stage.ts';
import { Chair, FoleyDoor, KeyRing, PaperSheet } from '../shared/foley/props';
import { CHAIR, DOOR } from '../shared/foley/propGeom.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { F03_MODEL, floorOf, posesOf, TABLE } from './geometry.ts';
import { F03_ZONES } from './model.ts';

const TOP = F03_MODEL.views.top!;

export function PropsArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const P = posesOf(variant);
  const floor = floorOf(variant);
  const live = variant === 'live';
  const booth = liveBooth(floor);
  if (view === 'top') {
    return (
      <Group>
        <StageFloorPlan u0={TOP.u0 - 200} u1={TOP.u1 + 200} v0={TOP.v0 - 200} v1={TOP.v1 + 200} />
        {live ? <BoothArt view="top" rail={booth.rail} pa={{ x: booth.pa.p.x, y: booth.pa.p.y, z: booth.pa.p.z }} /> : null}
        {variant === 'paper' ? <TableArt view="top" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} topY={0} floorY={floor} /> : null}
        {variant === 'door' ? <FoleyDoor view="top" floorY={floor} /> : null}
        {variant === 'chair' ? <Chair view="top" /> : null}
        <PlayerBehind pose={P.top} />
        {variant === 'paper' ? <PaperSheet view="top" /> : null}
        {variant === 'keys' || live ? <KeyRing view="top" /> : null}
        <PlayerInFront pose={P.top} />
      </Group>
    );
  }
  const s = F03_MODEL.viewsByVariant?.[variant]?.side ?? F03_MODEL.views.side!;
  return (
    <Group>
      <PitSection surface="concrete" floorY={floor} u0={s.u0 - 200} u1={s.u1 + 200} pit={false} />
      {live ? <BoothArt view="side" floorY={floor} rail={booth.rail} pa={{ x: booth.pa.p.x, y: booth.pa.p.y, z: booth.pa.p.z }} /> : null}
      {variant === 'chair' ? <Chair view="side" /> : null}
      <PlayerBehind pose={P.side} />
      {variant === 'paper' ? <TableArt view="side" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} topY={0} floorY={floor} /> : null}
      {variant === 'paper' ? <PaperSheet view="side" /> : null}
      {variant === 'door' ? <FoleyDoor view="side" floorY={floor} /> : null}
      {variant === 'keys' || live ? <KeyRing view="side" /> : null}
      <PlayerInFront pose={P.side} />
    </Group>
  );
}

export function propsLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const floor = floorOf(variant);
  const out: ArtLabel[] = [];
  const live = variant === 'live';
  if (view === 'side') {
    if (variant === 'keys' || live) out.push({ id: 'keys', text: 'KEY RING', short: 'KEYS', u: 260, v: -260, align: 'left', at: { u: 0, v: 30 } });
    if (variant === 'paper') {
      out.push({ id: 'paper', text: 'PAPER · THE BEND', short: 'PAPER', u: 300, v: -300, align: 'left', at: { u: 60, v: -20 } });
      out.push({ id: 'table', text: 'PROP TABLE', short: 'TABLE', u: 360, v: 400, align: 'left', tone: 'muted', at: { u: TABLE.x1 - 40, v: 300 } });
    }
    if (variant === 'door') {
      out.push({ id: 'latch', text: 'HANDLE · LATCH', short: 'LATCH', u: 300, v: -250, align: 'left', at: { u: 60, v: 0 } });
      out.push({ id: 'leaf', text: 'DOOR (EDGE-ON)', short: 'DOOR', u: 280, v: -800, align: 'left', tone: 'muted', at: { u: 20, v: -700 } });
    }
    if (variant === 'chair') out.push({ id: 'legs', text: 'LEGS ON THE FLOOR', short: 'LEGS', u: 320, v: -250, align: 'left', at: { u: 0, v: -20 } });
    if (live) {
      const b = liveBooth(floor);
      out.push({ id: 'pa', text: 'PA', u: b.pa.p.x, v: b.pa.p.y - 420, align: 'center', at: { u: b.pa.p.x, v: b.pa.p.y - 330 } });
    }
    return out;
  }
  if (variant === 'door') {
    out.push({ id: 'swing', text: 'THE SWING', short: 'SWING', u: -620, v: 380, align: 'center', tone: 'muted', at: { u: -560, v: DOOR.W - 560 } });
    out.push({ id: 'pinch', text: 'PINCH POINT', short: 'PINCH', u: 260, v: DOOR.W + 160, align: 'left', tone: 'muted', at: { u: 60, v: DOOR.W } });
    out.push({ id: 'latch', text: 'LATCH', u: 280, v: -200, align: 'left', at: { u: 40, v: 40 } });
  }
  if (variant === 'chair') out.push({ id: 'chair', text: 'CHAIR', u: -CHAIR.S / 2, v: -CHAIR.S - 200, align: 'center', at: { u: -CHAIR.S / 2, v: -CHAIR.S / 2 } });
  if (variant === 'paper') out.push({ id: 'table', text: 'TABLE · PAPER', short: 'PAPER', u: 300, v: TABLE.z1 + 120, align: 'left', at: { u: 60, v: 80 } });
  if (variant === 'keys' || live) out.push({ id: 'keys', text: 'KEYS', u: 260, v: -260, align: 'left', at: { u: 0, v: 0 } });
  if (live) {
    const b = liveBooth(floor);
    out.push({ id: 'pa', text: 'PA', u: b.pa.p.x - 260, v: b.pa.p.z, align: 'right', at: { u: b.pa.p.x - 200, v: b.pa.p.z } });
  }
  return out;
}

export function propsHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const floor = floorOf(variant);
  const live = variant === 'live';
  const P = posesOf(variant);
  if (variant === 'keys' || live) {
    if (Math.hypot(u, v - (view === 'side' ? 40 : 0)) <= 60 + tol) return 'f03.keys';
  }
  if (variant === 'paper') {
    if (Math.abs(u) <= 160 + tol && Math.abs(v - (view === 'side' ? -20 : 0)) <= (view === 'side' ? 60 : 120) + tol) return 'f03.paper';
    if (u >= TABLE.x0 - tol && u <= TABLE.x1 + tol && (view === 'side' ? v >= -tol && v <= floor : v >= TABLE.z0 - tol && v <= TABLE.z1 + tol)) return 'f03.table';
  }
  if (variant === 'door') {
    if (Math.hypot(u, v - (view === 'side' ? 0 : DOOR.handleZ)) <= 80 + tol) return 'f03.handle';
    if (view === 'side' && Math.abs(u) <= 40 + tol && v >= floor - DOOR.H - tol && v <= floor) return 'f03.leaf';
    if (view === 'top' && Math.abs(u) <= 40 + tol && v >= -tol && v <= DOOR.W + tol) return v > DOOR.W - 80 ? 'f03.frame' : 'f03.leaf';
    if (view === 'side' && v >= floor - 80 && Math.abs(u) <= 430) return 'f03.frame';
  }
  if (variant === 'chair') {
    const inX = u >= -CHAIR.S - 20 - tol && u <= 40 + tol;
    if (inX && (view === 'side' ? v >= -CHAIR.back - tol && v <= tol : v >= -CHAIR.S - 20 - tol && v <= 40 + tol)) return 'f03.chair';
  }
  if (live) {
    const b = liveBooth(floor);
    if (view === 'side' && Math.abs(u - b.pa.p.x) <= 220 + tol && v >= b.pa.p.y - 340 - tol && v <= b.pa.p.y + 340 + tol) return 'f03.pa';
    if (view === 'top' && Math.abs(u - b.pa.p.x) <= 220 + tol && Math.abs(v - b.pa.p.z) <= 300 + tol) return 'f03.pa';
    if (u >= b.rail.x - tol && u <= b.rail.x + 60 + tol) return 'f03.booth';
  }
  if (poseCovers(view === 'side' ? P.side : P.top, u, v, tol)) return 'f03.artist';
  return null;
}

export const F03_ART: LessonArt = {
  Instrument: PropsArt,
  labels: propsLabels,
  hitTest: propsHitTest,
  figureAt: (view, variant, u, v, tol) => poseCovers(view === 'side' ? posesOf(variant).side : posesOf(variant).top, u, v, tol),
  labelObstacles: voiceLabelObstacles(F03_ZONES),
  labelsYieldToMic: true,
};
