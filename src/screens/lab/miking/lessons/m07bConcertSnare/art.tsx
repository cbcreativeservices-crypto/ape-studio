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

/** The sticks as drawn (illustrative: one about to strike, one raised). */
export const STICKS = {
  side: [
    { grip: { x: -470, y: -150 }, head: { x: -52, y: -12 } },
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
      { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 0, v: -HOOP.rOut - 60, align: 'center' },
      { id: 'player', text: '← PLAYER', u: -560, v: -230, align: 'center', tone: 'muted' },
      { id: 'rods', text: '10 RODS PER HEAD', short: '10 RODS', u: R + 60, v: HOOP.rOut + 70, align: 'left', tone: 'illustrative' },
      { id: 'sticks', text: 'STICKS', u: -330, v: 170, align: 'center', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 40, v: RIM_Y - 40, align: 'left' },
    { id: 'snareHead', text: 'SNARE-SIDE HEAD', short: 'SNARE HEAD', u: R + 50, v: D + 4, align: 'left' },
    { id: 'snares', text: variant === 'off' ? 'SNARES (OFF)' : 'SNARES (ON)', short: 'SNARES', u: 0, v: snaresY(variant !== 'off') + 46, align: 'center' },
    { id: 'throw', text: 'THROW-OFF', u: -R - 50, v: D * 0.5, align: 'right', tone: 'illustrative' },
    { id: 'stand', text: 'STAND', u: 40, v: 380, align: 'left', tone: 'illustrative' },
    { id: 'sticks', text: 'STICKS', u: -400, v: -400, align: 'center', tone: 'illustrative' },
  ];
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
