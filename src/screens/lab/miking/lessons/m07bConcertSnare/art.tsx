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
import { CSN_STICKS, DRUM, STAND, snaresY } from './geometry.ts';
import { D, FLOOR_Y, HOOP, R, RIM_Y, SPEC } from './model.ts';

const DEG = Math.PI / 180;

/** The sticks as drawn, butt (`grip`, where Mallet starts the shaft) to bead
 *  (`head`): the two views of the SAME posed sticks (geometry.ts CSN_STICKS:
 *  matched grip, one at the stroke 12° to the head, one raised 30° about its
 *  hand). Owner 2026-11-22: "It should look like normal stick tech. usage" —
 *  the 56° plunge of 2026-10-10 (steepened so the stick missed the
 *  THROW-OFF's name) is gone; the labels below are laid out round the
 *  natural sticks instead. */
type Pt = { x: number; y: number };
export const STICKS: { side: readonly { grip: Pt; head: Pt }[]; top: readonly { grip: Pt; head: Pt }[] } = {
  side: CSN_STICKS.map((s) => ({ grip: { x: s.butt.x, y: s.butt.y }, head: { x: s.bead.x, y: s.bead.y } })),
  top: CSN_STICKS.map((s) => ({ grip: { x: s.butt.x, y: s.butt.z }, head: { x: s.bead.x, y: s.bead.z } })),
};

/** A point on stick `i` as drawn in `view`, `t` of the way from butt to bead
 *  (the STICKS name's leader lands there). */
export function stickPoint(view: ViewId, i: number, t: number): { u: number; v: number } {
  const s = (view === 'top' ? STICKS.top : STICKS.side)[i];
  return { u: s.grip.x + (s.head.x - s.grip.x) * t, v: s.grip.y + (s.head.y - s.grip.y) * t };
}

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
      { id: 'sticks', text: 'STICKS', u: -150, v: 330, align: 'center', tone: 'illustrative', at: stickPoint('top', 1, 0.6) },
    ];
  }
  return [
    // Each name in free space with a leader that lands on its part, laid out
    // so no leader crosses another (clash sweep 2026-10-10: the SNARES leader
    // ran down through the drum across the THROW-OFF's). Owner 2026-11-22
    // (the parts page at phone width: SNARE-SIDE HEAD printed over BATTER
    // HEAD, THROW-OFF pushed to the top right on a leader across the drum):
    // every name has its own clear side of the drum — BATTER HEAD above the
    // head right of the raised stick, STICKS above the sticks, THROW-OFF beside
    // its lever and SNARE-SIDE HEAD under the drum on the player's side, SNARES
    // and STAND on the audience side under the inset of the other view — no leader
    // runs through the drum, across a stick or across another leader
    // (test/stickTechniqueConcert_20261122.test.ts: glasses 356–390 pt wide,
    // 200–340 pt tall, with and without the inset). On a short glass THROW-OFF
    // drops under the drum's player side (its alts).
    { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: R * 0.35, v: RIM_Y - 70, align: 'center', at: { u: R * 0.35, v: 0 }, alts: [{ u: R * 0.2, v: RIM_Y - 40, align: 'center' }] },
    { id: 'throw', text: 'THROW-OFF', u: -R - 62, v: D * 0.6, align: 'right', tone: 'illustrative', at: { u: -R - 16, v: D * 0.75 }, alts: [{ u: -215, v: D + 60, align: 'right' }, { u: -48, v: D + 130, align: 'right' }] },
    { id: 'snareHead', text: 'SNARE-SIDE HEAD', short: 'SNARE HEAD', u: -48, v: D + 130, align: 'right', at: { u: -R + 5, v: D }, alts: [{ u: -48, v: D + 185, align: 'right' }] },
    { id: 'snares', text: variant === 'off' ? 'SNARES (OFF)' : 'SNARES (ON)', short: 'SNARES', u: R + 40, v: D + 40, align: 'left', at: { u: 165, v: snaresY(variant !== 'off') + 2 }, alts: [{ u: R + 40, v: D + 60, align: 'left' }] },
    { id: 'stand', text: 'STAND', u: 62, v: 330, align: 'left', tone: 'illustrative', at: { u: 0, v: 330 }, alts: [{ u: 62, v: 390, align: 'left' }, { u: -25, v: 380, align: 'right' }] },
    { id: 'sticks', text: 'STICKS', u: -300, v: -290, align: 'center', tone: 'illustrative', at: stickPoint('side', 1, 0.6), alts: [{ u: -380, v: -330, align: 'center' }] },
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
  if (standSideAt(u, v, tol)) return 'csn.stand';
  return null;
}

/** The stand as SnareStandSide draws it (side view): the basket arms, the
 *  post and its tilter, clutch and collars, the three legs and their feet.
 *  (It was the whole rectangle under the drum out to the feet, so no name
 *  could sit in the empty space beside the post — owner 2026-11-22, the
 *  parts page's labels at phone width.) */
function standSideAt(u: number, v: number, tol: number): boolean {
  const hub = STAND.hubY;
  const tilt = hub + 46;
  const collar = FLOOR_Y - 150;
  const clutch = (collar + tilt) / 2 + 30;
  const P = (x: number, y: number) => ({ x, y });
  const near = (a: { x: number; y: number }, b: { x: number; y: number }, r: number) => segDist(u, v, a, b) <= r + tol;
  const box = (u0: number, u1: number, v0: number, v1: number) => u >= u0 - tol && u <= u1 + tol && v >= v0 - tol && v <= v1 + tol;
  if (near(P(0, hub), P(0, FLOOR_Y - 60), 15)) return true;
  if (Math.hypot(u, v - tilt) <= 20 + tol || box(18, 58, tilt - 13, tilt + 13)) return true;
  if (box(-18, 18, hub + 8, hub + 26) || box(-20, 42, clutch - 8, clutch + 10) || box(-22, 22, collar - 13, collar + 11)) return true;
  for (const deg of STAND.armsDeg) {
    const x = Math.cos(deg * DEG) * HOOP.rOut;
    if (near(P(x * 0.12, hub), P(x * 0.96, STAND.basketY + 6), 7)) return true;
  }
  for (const deg of STAND.legsDeg) {
    const fx = Math.cos(deg * DEG) * STAND.legR;
    if (near(P(0, collar), P(fx, FLOOR_Y - 6), 11) || box(fx - 14, fx + 14, FLOOR_Y - 9, FLOOR_Y)) return true;
  }
  return false;
}
