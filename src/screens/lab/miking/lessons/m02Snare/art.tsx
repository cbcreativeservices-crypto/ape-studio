/**
 * M02 SNARE DRUM — the look (charter §2 layer 3), drawn ONLY from the shared
 * drum family (lessons/shared/drums) and the anchors in geometry.ts, in
 * millimetres of the view's (u, v): side u = x, v = y; top u = x, v = z.
 *
 *   SIDE (a cutaway at the snare's centre plane): the snare cut open — the
 *   coated batter, the thin snare-side head and the wires under it, their
 *   cords over the bottom hoop to the strainer (player's side) and the butt
 *   plate — on its stand's basket; behind it the hi-hat and the crash, to
 *   its right the 10 in rack tom and, past it, the kick (dimmed: neighbours
 *   recede, charter §6); a drumstick at the strike (ILLUSTRATIVE).
 *   TOP (from above): the batter head on its chrome hoop with its rods and
 *   lugs, the strainer and butt; the rack tom and the kick beside it; the
 *   hi-hat and the crash ABOVE it, translucent.
 *
 * Nothing moves (D8). Every neighbour sits where the shared kit puts it.
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { BoomStandSide, CymbalPlan, CymbalSide, DrumPlan, DrumSection, HiHatSide, KickFromAbove, SnareStandSide, Stick, sideTransform, topTransform } from '../shared/drums/DrumArt';
import { makeUprightSound } from '../shared/drums/UprightSound';
import { KICK_22x18 } from '../shared/drums/drumSpec.ts';
import { PLAN_HARDWARE } from '../shared/kitPlanModel.ts';
import { DEPTH, H_UP, HOOP, NEIGHBOURS as NB, R, S0_KIT, SPEC, STAND } from './model.ts';
import { FLOOR_Y, SNARE_DRUM } from './geometry.ts';

const wiresOf = (v: VariantId): 'on' | 'off' => (v === 'off' ? 'off' : 'on');
/** The crash's boom stand foot, from the shared kit (lesson frame). */
const CRASH_FOOT = { x: PLAN_HARDWARE.booms.crash1.u - S0_KIT.x, z: PLAN_HARDWARE.booms.crash1.v - S0_KIT.z };
/** The stick at a playing angle (≈ 22° above the head), held from the
 *  player's side: a 16 in (406 mm) stick, its bead on the batter between the
 *  centre and the player's edge — clear of the hi-hat stand (u = −80), which
 *  stands behind the snare, nearer the centre. */
const STICK = { from: { x: -495, y: -156 }, to: { x: -125, y: -4 } };
const STICK_TOP = { from: { x: -490, y: 70 }, to: { x: -125, y: -10 } };

export function SnareArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  if (view === 'side') {
    return (
      <Group>
        {/* The cut removes what stands in front of it (the kick and the rack
            tom are nearer the viewer than the snare's centre plane); what is
            behind it stays: the hi-hat, and the crash's stand (the crash
            itself is above the frame). */}
        <BoomStandSide foot={CRASH_FOOT.x} top={NB.crash1.c.y + 120} cym={{ x: NB.crash1.c.x, y: NB.crash1.c.y }} floorY={FLOOR_Y} dim={0.4} />
        <CymbalSide cx={NB.crash1.c.x} cy={NB.crash1.c.y} d={NB.crash1.d} tiltDeg={NB.crash1.tiltDeg} dim={0.75} />
        <HiHatSide cx={NB.hihat.c.x} cy={NB.hihat.c.y} d={NB.hihat.d} floorY={FLOOR_Y} dim={0.85} />
        {/* the snare on its stand, cut open */}
        <SnareStandSide cx={0} basketY={DEPTH + H_UP} hoopR={HOOP.rIn} floorY={FLOOR_Y} armsDeg={STAND.armsDeg} />
        <Group transform={sideTransform(SNARE_DRUM)}>
          <DrumSection spec={SPEC} wires={wiresOf(variant)} />
        </Group>
        <Stick from={STICK.from} to={STICK.to} />
      </Group>
    );
  }
  return (
    <Group>
      <KickFromAbove spec={KICK_22x18} u0={NB.kick.c.x} z={NB.kick.c.z} dim={0.55} />
      <Group transform={topTransform(NB.tom1)}>
        <DrumPlan drum={NB.tom1} dim={0.7} />
      </Group>
      <Group transform={topTransform(SNARE_DRUM)}>
        <DrumPlan drum={SNARE_DRUM} />
      </Group>
      <Stick from={STICK_TOP.from} to={STICK_TOP.to} />
      {/* above the snare: the hi-hat and the crash, translucent */}
      <CymbalPlan cx={NB.hihat.c.x} cz={NB.hihat.c.z} d={NB.hihat.d} tiltDeg={0} dim={0.62} />
      <CymbalPlan cx={NB.crash1.c.x} cz={NB.crash1.c.z} d={NB.crash1.d} tiltDeg={NB.crash1.tiltDeg} dim={0.5} />
    </Group>
  );
}

export function snareLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (view === 'side') {
    // Every name sits in free space on the glass with a leader to its part,
    // laid out so no leader crosses another or runs through another name
    // (round 2 of the art pass, 2026-10-10). The player's keep-out fills the
    // left of the glass (u < −R − 70), so the names go right of the drum,
    // above the hi-hat and just above the drum.
    return [
      { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 255, v: -150, align: 'left', at: { u: 150, v: 0 } },
      { id: 'rim', text: 'RIM', u: 255, v: -80, align: 'left', at: { u: HOOP.rOut, v: -H_UP } },
      { id: 'reso', text: 'SNARE-SIDE HEAD', short: 'SNARE HEAD', u: 255, v: DEPTH - 45, align: 'left', at: { u: HOOP.rOut, v: DEPTH } },
      { id: 'wires', text: variant === 'off' ? 'WIRES (OFF)' : 'WIRES (ON)', short: 'WIRES', u: 255, v: DEPTH + 60, align: 'left', at: { u: 110, v: DEPTH + 8 } },
      { id: 'stand', text: 'STAND', u: 255, v: DEPTH + 150, align: 'left', tone: 'muted', at: { u: 22, v: DEPTH + 150 } },
      { id: 'hihat', text: 'HI-HAT', u: -95, v: -400, align: 'right', tone: 'muted', at: { u: -200, v: NB.hihat.c.y - 5 } },
      { id: 'stick', text: 'STICK', u: -45, v: -400, align: 'left', tone: 'illustrative', at: { u: -160, v: -20 } },
      { id: 'strainer', text: 'STRAINER', u: -14, v: -100, align: 'left', tone: 'muted', at: { u: -R - 22, v: DEPTH * 0.5 } },
    ];
  }
  return [
    { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 0, v: R * 0.45, align: 'center' },
    { id: 'rods', text: '10 RODS PER HEAD', short: '10 RODS', u: R + 40, v: 70, align: 'left', tone: 'illustrative' },
    { id: 'strainer', text: 'STRAINER', u: -R - 44, v: 30, align: 'right', tone: 'muted' },
    { id: 'hihat', text: 'HI-HAT (ABOVE)', short: 'HI-HAT', u: NB.hihat.c.x - 60, v: NB.hihat.c.z - NB.hihat.d / 2 + 20, align: 'center', tone: 'muted' },
    { id: 'crash', text: 'CRASH (ABOVE)', short: 'CRASH', u: NB.crash1.c.x + 120, v: NB.crash1.c.z - 150, align: 'center', tone: 'muted' },
    { id: 'tom', text: 'RACK TOM', short: 'TOM', u: NB.tom1.c.x, v: NB.tom1.c.z + 175, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: -330, v: 200, align: 'center', tone: 'muted', point: { u: -6000, v: 200 } },
  ];
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function snareHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const near = (cu: number, cv: number, r: number) => Math.hypot(u - cu, v - cv) <= r + tol;
  if (view === 'side') {
    if (Math.abs(v) <= tol + 3 && Math.abs(u) <= R) return 'snare.batter';
    if (Math.abs(v - DEPTH) <= tol + 3 && Math.abs(u) <= R) return 'snare.reso';
    if (v >= DEPTH + 1 && v <= DEPTH + 16 + tol && Math.abs(u) <= 170) return variant === 'off' ? 'snare.wiresOff' : 'snare.wiresOn';
    if (u <= -R && u >= -R - 34 - tol && v >= 0 && v <= DEPTH) return 'snare.strainer';
    if (u >= R && u <= R + 22 + tol && v >= DEPTH * 0.5 && v <= DEPTH) return 'snare.butt';
    if (Math.abs(Math.abs(u) - HOOP.rOut) <= 6 + tol && v >= -H_UP - tol && v <= 14) return 'snare.hoopTop';
    if (Math.abs(Math.abs(u) - HOOP.rOut) <= 6 + tol && v >= DEPTH - 14 && v <= DEPTH + H_UP + tol) return 'snare.hoopBottom';
    if (Math.abs(u) > R && Math.abs(u) <= R + 26 + tol && v >= 0 && v <= DEPTH) return 'snare.lugs';
    if (Math.abs(u) <= R && v >= 0 && v <= DEPTH) return 'snare.shell';
    if (v > DEPTH + 16 && Math.abs(u) < 120) return 'snare.stand';
    if (near(NB.hihat.c.x, NB.hihat.c.y, 60) || (Math.abs(u - NB.hihat.c.x) <= NB.hihat.d / 2 && Math.abs(v - NB.hihat.c.y) <= 30 + tol)) return 'hihat';
    if (Math.abs(u - NB.crash1.c.x) <= NB.crash1.d / 2 && Math.abs(v - NB.crash1.c.y) <= 50 + tol) return 'crash1';
    return null;
  }
  if (near(NB.crash1.c.x, NB.crash1.c.z, NB.crash1.d / 2) && Math.hypot(u, v) > R + 10) return 'crash1';
  if (near(NB.hihat.c.x, NB.hihat.c.z, NB.hihat.d / 2) && Math.hypot(u, v) > R - 20) return 'hihat';
  if (u <= -R && u >= -R - 34 - tol && Math.abs(v) <= 20 + tol) return 'snare.strainer';
  if (u >= R && u <= R + 24 + tol && Math.abs(v) <= 14 + tol) return 'snare.butt';
  const rr = Math.hypot(u, v);
  if (rr <= R - 6) return 'snare.batter';
  if (rr <= HOOP.rOut + 4 + tol) return 'snare.hoopTop';
  if (rr <= R + 30 + tol) return 'snare.lugs';
  if (near(NB.tom1.c.x, NB.tom1.c.z, NB.tom1.spec.d.mm / 2 + 20)) return 'tom1';
  return null;
}

/** Distance from (u, v) to the segment a–b (mm). */
function segDist(u: number, v: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((u - a.x) * dx + (v - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - (a.x + t * dx), v - (a.y + t * dy));
}

/** Drawn hardware the hit test does not name — the stick, the stands' tubes
 *  and legs, the crash boom — so the part labels keep off it too (label
 *  occupancy only; taps are unchanged). */
export function snareDrawnAt(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): boolean {
  if (view !== 'side') return segDist(u, v, STICK_TOP.from, STICK_TOP.to) <= 9 + tol;
  if (segDist(u, v, STICK.from, STICK.to) <= 9 + tol) return true;
  // the snare stand: centre tube, basket, legs
  if (Math.abs(u) <= 22 + tol && v >= DEPTH && v <= FLOOR_Y) return true;
  if (v >= DEPTH && v <= DEPTH + H_UP + 60 && Math.abs(u) <= HOOP.rOut + 10 + tol) return true;
  for (const fx of [-208, 0, 208]) if (segDist(u, v, { x: 0, y: FLOOR_Y - 150 }, { x: fx, y: FLOOR_Y }) <= 12 + tol) return true;
  // the hi-hat stand and pedal, the crash stand and its boom
  if (Math.abs(u - NB.hihat.c.x) <= 20 + tol && v >= NB.hihat.c.y - 140 && v <= FLOOR_Y) return true;
  if (Math.abs(u - CRASH_FOOT.x) <= 20 + tol && v >= NB.crash1.c.y + 110 && v <= FLOOR_Y) return true;
  if (segDist(u, v, { x: CRASH_FOOT.x, y: NB.crash1.c.y + 120 }, { x: NB.crash1.c.x, y: NB.crash1.c.y + 24 }) <= 14 + tol) return true;
  return false;
}

const SOUND = makeUprightSound((v) => ({ spec: SPEC, reso: true, wires: wiresOf(v) }), { batter: 'BATTER', reso: 'SNARE HEAD' });

export const SNARE_ART: LessonArt = {
  Instrument: SnareArt,
  labels: snareLabels,
  hitTest: snareHitTest,
  figureAt: snareDrawnAt,
  StrikeSequence: SOUND.StrikeSequence,
  CoupledHeads: SOUND.CoupledHeads,
  plan: { own: 'snare', offset: S0_KIT },
};
