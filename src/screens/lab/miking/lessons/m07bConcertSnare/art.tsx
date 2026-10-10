/**
 * M07b CONCERT SNARE — the look (charter §2 layer 3), drawn ONLY from the
 * anchors in geometry.ts, in millimetres of the view's (u, v): side u = x,
 * v = y; top u = x, v = z. The drum is the shared family's (drums/DrumArt:
 * DrumSection cut open at its centre plane, DrumPlan from above) with the
 * concert spec (14 × 6½ in, 10 lugs, 14-strand cable snares); this file adds
 * the floor, the concert stand, the player's sticks and the labels.
 *
 * Rules kept (the kick's): nothing moves (D8); paths are built once; the
 * stand, the sticks and the player's space are drawing defaults and their
 * labels say so in the drawing's own muted tone; no brand mark.
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { DrumPlan, DrumSection, SnareStandSide } from '../shared/drums/DrumArt';
import { Mallet } from '../shared/concert/Mallets';
import { FLOOR, make, oval, rect, seg } from '../shared/concert/paths.ts';
import { DRUM, STAND, snaresY } from './geometry.ts';
import { D, FLOOR_Y, HOOP, R, RIM_Y, SPEC } from './model.ts';

const DEG = Math.PI / 180;

/** The sticks as drawn (illustrative: one about to strike, one raised).
 *  A 16 in (406 mm) stick: the striking one comes down at ≈ 56° (it lay at
 *  18°, across the throw-off's name: clash sweep 2026-10-10). */
export const STICKS = {
  side: [
    { grip: { x: -279, y: -349 }, head: { x: -52, y: -12 } },
    { grip: { x: -500, y: -250 }, head: { x: -170, y: -370 } },
  ],
  top: [
    { grip: { x: -480, y: -110 }, head: { x: -50, y: -18 } },
    { grip: { x: -480, y: 120 }, head: { x: -95, y: 46 } },
  ],
} as const;

function useFloor() {
  return useMemo(() => ({ floor: rect(make(), -3000, FLOOR_Y, 3000, FLOOR_Y + 600), edge: seg(make(), -3000, FLOOR_Y, 3000, FLOOR_Y), shadow: oval(make(), 0, FLOOR_Y + 2, STAND.legR + 60, 10) }), []);
}

function StandPlan() {
  const p = useMemo(() => {
    const legsP = make();
    for (const deg of STAND.legsDeg) seg(legsP, 0, 0, Math.cos(deg * DEG) * STAND.legR, Math.sin(deg * DEG) * STAND.legR);
    const feet = make();
    for (const deg of STAND.legsDeg) oval(feet, Math.cos(deg * DEG) * STAND.legR, Math.sin(deg * DEG) * STAND.legR, 13, 13);
    return { legsP, feet };
  }, []);
  return (
    <>
      <Path path={p.legsP} style="stroke" strokeWidth={13} strokeCap="round" color="#2a2c32" />
      <Path path={p.legsP} style="stroke" strokeWidth={8} strokeCap="round" color="#8a8f99" />
      <Path path={p.feet} color="#16171b" />
    </>
  );
}

export function ConcertSnareArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const fl = useFloor();
  const on = variant !== 'off';
  if (view === 'top') {
    return (
      <Group>
        <StandPlan />
        <DrumPlan drum={DRUM} />
        {STICKS.top.map((s, i) => (
          <Mallet key={i} kind="stick" grip={s.grip} head={s.head} />
        ))}
      </Group>
    );
  }
  return (
    <Group>
      <Path path={fl.floor}>
        <LinearGradient start={vec(0, FLOOR_Y)} end={vec(0, FLOOR_Y + 60)} colors={FLOOR} />
      </Path>
      <Path path={fl.shadow} color="#000" opacity={0.6}>
        <BlurMask blur={8} style="normal" />
      </Path>
      <Path path={fl.edge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
      <SnareStandSide cx={0} basketY={STAND.basketY} hoopR={HOOP.rOut} floorY={FLOOR_Y} armsDeg={STAND.armsDeg} />
      <DrumSection spec={SPEC} reso wires={on ? 'on' : 'off'} />
      {STICKS.side.map((s, i) => (
        <Mallet key={i} kind="stick" grip={s.grip} head={s.head} opacity={i === 1 ? 0.55 : 1} />
      ))}
    </Group>
  );
}

export function concertSnareLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (view === 'top') {
    return [
      // Leaders land on their parts; the player cue is an arrow only (clash
      // sweep 2026-10-10: leaders pointed at empty glass).
      { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 0, v: -HOOP.rOut - 60, align: 'center', at: { u: 40, v: -R * 0.6 } },
      { id: 'player', text: '← PLAYER', u: -560, v: -230, align: 'center', tone: 'muted', point: { u: -6000, v: -230 } },
      { id: 'rods', text: '10 RODS PER HEAD', short: '10 RODS', u: R + 60, v: HOOP.rOut + 70, align: 'left', tone: 'illustrative' },
      { id: 'sticks', text: 'STICKS', u: -330, v: 170, align: 'center', tone: 'illustrative', at: { u: (STICKS.top[1].grip.x + STICKS.top[1].head.x) / 2, v: (STICKS.top[1].grip.y + STICKS.top[1].head.y) / 2 } },
    ];
  }
  return [
    // Each name in free space with a leader that lands on its part, laid out
    // so no leader crosses another (clash sweep 2026-10-10: the SNARES leader
    // ran down through the drum across the THROW-OFF's).
    { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 40, v: RIM_Y - 40, align: 'left', at: { u: R * 0.55, v: 0 } },
    { id: 'snareHead', text: 'SNARE-SIDE HEAD', short: 'SNARE HEAD', u: R + 50, v: D + 4, align: 'left', at: { u: R - 10, v: D }, alts: [{ u: R * 0.35, v: D + 150, align: 'left' }] },
    { id: 'snares', text: variant === 'off' ? 'SNARES (OFF)' : 'SNARES (ON)', short: 'SNARES', u: R + 50, v: D + 70, align: 'left', at: { u: R * 0.6, v: snaresY(variant !== 'off') + 2 }, alts: [{ u: R * 0.35, v: D + 230, align: 'left' }] },
    { id: 'throw', text: 'THROW-OFF', u: -R - 90, v: D * 0.55, align: 'right', tone: 'illustrative', at: { u: -R - 16, v: D * 0.6 }, alts: [{ u: -R - 40, v: D + 95, align: 'right' }] },
    { id: 'stand', text: 'STAND', u: 40, v: 380, align: 'left', tone: 'illustrative', at: { u: 0, v: 380 } },
    { id: 'sticks', text: 'STICKS', u: -400, v: -400, align: 'center', tone: 'illustrative', at: { u: (STICKS.side[1].grip.x + STICKS.side[1].head.x) / 2, v: (STICKS.side[1].grip.y + STICKS.side[1].head.y) / 2 } },
  ];
}

/** Distance from (u, v) to the segment a–b (mm). */
function segDist(u: number, v: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((u - a.x) * dx + (v - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - (a.x + t * dx), v - (a.y + t * dy));
}

/** The sticks, which the hit test does not name, so the part labels keep off
 *  them (label occupancy only; taps unchanged — clash sweep 2026-10-10: the
 *  THROW-OFF name sat on a stick). */
export function concertSnareDrawnAt(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): boolean {
  const list = view === 'top' ? STICKS.top : STICKS.side;
  return list.some((s) => segDist(u, v, s.grip, s.head) <= 10 + tol);
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function concertSnareHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const off = variant === 'off';
  if (view === 'top') {
    if (u <= -R && u >= -R - 40 - tol && Math.abs(v) <= 20 + tol) return 'csn.strainer';
    if (u >= R && u <= R + 30 + tol && Math.abs(v) <= 15 + tol) return 'csn.butt';
    const r = Math.hypot(u, v);
    if (r <= R) return 'csn.batter';
    if (r <= HOOP.rOut + tol) return 'csn.hoop';
    if (r <= R + SPEC.lug.out.mm + 20 + tol) return 'csn.lugs';
    if (r <= STAND.legR + tol) return 'csn.stand';
    return null;
  }
  if (Math.abs(u) <= R + tol && Math.abs(v) <= tol) return 'csn.batter';
  if (Math.abs(u) <= 170 + tol && Math.abs(v - (snaresY(!off) + 1.7)) <= 6 + tol) return off ? 'csn.snaresOff' : 'csn.snaresOn';
  if (Math.abs(u) <= R + tol && Math.abs(v - D) <= tol) return 'csn.snareHead';
  if (u <= -R && u >= -R - 40 - tol && v >= D * 0.15 && v <= D * 0.85) return 'csn.strainer';
  if (u >= R && u <= R + 30 + tol && v >= D * 0.45 && v <= D * 0.95) return 'csn.butt';
  if (Math.abs(u) >= R - 4 && Math.abs(u) <= HOOP.rOut + 8 + tol && v >= RIM_Y - tol && v <= 16) return 'csn.hoop';
  if (Math.abs(u) >= R - 4 && Math.abs(u) <= HOOP.rOut + 8 + tol && v >= D - 16 && v <= D + 12 + tol) return 'csn.hoopB';
  if (Math.abs(u) >= R && Math.abs(u) <= R + SPEC.lug.out.mm + tol && v > 0 && v < D) return 'csn.lugs';
  if (Math.abs(u) <= R && v > 0 && v < D) return 'csn.shell';
  if (Math.abs(u) <= STAND.legR + tol && v >= STAND.hubY - tol && v <= FLOOR_Y + tol) return 'csn.stand';
  return null;
}
