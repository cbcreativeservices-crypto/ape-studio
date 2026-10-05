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
const STICK = { from: { x: -R - 230, y: -150 }, to: { x: -6, y: -9 } };

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
      <Stick from={{ x: -375, y: 85 }} to={{ x: -14, y: -8 }} />
      {/* above the snare: the hi-hat and the crash, translucent */}
      <CymbalPlan cx={NB.hihat.c.x} cz={NB.hihat.c.z} d={NB.hihat.d} tiltDeg={0} dim={0.62} />
      <CymbalPlan cx={NB.crash1.c.x} cz={NB.crash1.c.z} d={NB.crash1.d} tiltDeg={NB.crash1.tiltDeg} dim={0.5} />
    </Group>
  );
}

export function snareLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (view === 'side') {
    return [
      { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: R * 0.12, v: -36, align: 'left' },
      { id: 'reso', text: 'SNARE-SIDE HEAD', short: 'SNARE HEAD', u: R + 34, v: DEPTH - 4, align: 'left' },
      { id: 'wires', text: variant === 'off' ? 'WIRES (OFF)' : 'WIRES (ON)', short: 'WIRES', u: -R * 0.55, v: DEPTH + 34, align: 'center' },
      { id: 'rim', text: 'RIM', u: R + 26, v: -H_UP - 16, align: 'left' },
      { id: 'strainer', text: 'STRAINER', short: 'STRAINER', u: -R - 44, v: DEPTH * 0.5, align: 'right', tone: 'muted' },
      { id: 'hihat', text: 'HI-HAT', u: NB.hihat.c.x, v: NB.hihat.c.y - 52, align: 'center', tone: 'muted' },
      { id: 'stick', text: 'STICK', u: STICK.from.x + 60, v: STICK.from.y - 26, align: 'center', tone: 'illustrative' },
      { id: 'stand', text: 'STAND', u: 40, v: DEPTH + 120, align: 'left', tone: 'muted' },
    ];
  }
  return [
    { id: 'batter', text: 'BATTER HEAD', short: 'BATTER', u: 0, v: R * 0.45, align: 'center' },
    { id: 'rods', text: '10 RODS PER HEAD', short: '10 RODS', u: R + 40, v: 70, align: 'left', tone: 'illustrative' },
    { id: 'strainer', text: 'STRAINER', u: -R - 44, v: 30, align: 'right', tone: 'muted' },
    { id: 'hihat', text: 'HI-HAT (ABOVE)', short: 'HI-HAT', u: NB.hihat.c.x - 60, v: NB.hihat.c.z - NB.hihat.d / 2 + 20, align: 'center', tone: 'muted' },
    { id: 'crash', text: 'CRASH (ABOVE)', short: 'CRASH', u: NB.crash1.c.x + 120, v: NB.crash1.c.z - 150, align: 'center', tone: 'muted' },
    { id: 'tom', text: 'RACK TOM', short: 'TOM', u: NB.tom1.c.x, v: NB.tom1.c.z + 175, align: 'center', tone: 'muted' },
    { id: 'player', text: '← PLAYER', u: -330, v: 200, align: 'center', tone: 'muted' },
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

const SOUND = makeUprightSound((v) => ({ spec: SPEC, reso: true, wires: wiresOf(v) }), { batter: 'BATTER', reso: 'SNARE HEAD' });

export const SNARE_ART: LessonArt = {
  Instrument: SnareArt,
  labels: snareLabels,
  hitTest: snareHitTest,
  StrikeSequence: SOUND.StrikeSequence,
  CoupledHeads: SOUND.CoupledHeads,
  plan: { own: 'snare', offset: S0_KIT },
};
