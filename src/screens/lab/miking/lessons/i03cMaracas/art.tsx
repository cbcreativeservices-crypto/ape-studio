/**
 * I03c MARACAS — the look (charter §2 layer 3), drawn ONLY from the states in
 * model.ts (each head, each arm), in millimetres of the view's (u, v): side
 * u = x, v = y; top u = x, v = z.
 *
 *   SIDE  the player from the right; each maraca upright, heads up, its
 *         handle in a fist seen from the back of the hand; the far (left)
 *         maraca behind the near one; for the singer, the vocal mic at the
 *         mouth on its boom.
 *   TOP   from above: the heads' round tops over the hands.
 * Each head's arc is drawn as a pale curved double arrow (WHERE it moves,
 * never how far). Nothing moves (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { INK, make, seg } from '../shared/concert/paths.ts';
import { gripCylinder, type Cylinder, type Grip } from '../shared/hand/anatomy/anatomy.ts';
import { HeldHand } from '../shared/smallperc/HeldHand';
import { PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { v3 } from '../shared/smallperc/geom.ts';
import { Maraca, BELL_CHROME } from '../shared/smallperc/objects';
import { HANDLE, MAR_DIMS, stateOf, VOCAL, type Maraca as M } from './model.ts';

const HW = MAR_DIMS.headW.mm;
const HH = MAR_DIMS.headH.mm;
const HD = MAR_DIMS.handleD.mm;
type Pt = readonly [number, number];
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];

/** The head's arc about the wrist (a pale curved double arrow). */
function Arc({ m }: { m: M }) {
  const p = useMemo(() => {
    const q = make();
    const cx = m.head.x;
    const cy = m.head.y + MAR_DIMS.pivot.mm;
    const r = MAR_DIMS.pivot.mm + 70;
    q.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), -90 - 32, 64);
    const end = (deg: number, dir: 1 | -1) => {
      const a = (deg * Math.PI) / 180;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      const tx = -Math.sin(a) * dir;
      const ty = Math.cos(a) * dir;
      q.moveTo(x - tx * 16 + ty * 9, y - ty * 16 - tx * 9);
      q.lineTo(x, y);
      q.lineTo(x - tx * 16 - ty * 9, y - ty * 16 + tx * 9);
    };
    end(-90 + 32, 1);
    end(-90 - 32, -1);
    return q;
  }, [m]);
  return (
    <Path path={p} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="#ffc64d" opacity={0.7}>
      <DashPathEffect intervals={[14, 9]} />
    </Path>
  );
}

/**
 * THE GRIP (hands redesign 2026-10-24): the shared Miking hand closed round
 * the handle in a hammer grip — the handle upright through the fist, the
 * thumb on its head side, the four fingers wrapped round it — the back of
 * each hand turned outward (the right hand's toward the viewer of the side
 * view), solved so its wrist meets the model's wrist.
 */
const cylOf = (m: M): Cylinder => ({ c: m.arm.G, axis: v3(0, -1, 0), r: HD / 2, slide: 12, tipward: true });
/** From the grip up to the top of the head (the end-on plane seen from above). */
const ABOVE = HH + 70;
const grips = new Map<M, Grip>();
export function maracaGrip(m: M): Grip {
  const hit = grips.get(m);
  if (hit) return hit;
  const s = m.side === 'R' ? 1 : -1;
  const g = gripCylinder(cylOf(m), { thumbSign: s, wrist: m.arm.W, elbow: m.arm.E, angle: [72, 90], back: v3(0, 0, s) });
  grips.set(m, g);
  return g;
}

function SideMaraca({ m }: { m: M }) {
  return <HeldHand view="side" S={m.arm.S} E={m.arm.E} sk={maracaGrip(m).sk} cyl={cylOf(m)} halfLength={ABOVE} held={<Maraca c={side(m.head)} angle={90} headW={HW} headH={HH} handle={HANDLE} handleD={HD} />} />;
}

function TopMaraca({ m }: { m: M }) {
  return <HeldHand view="top" S={m.arm.S} E={m.arm.E} sk={maracaGrip(m).sk} cyl={cylOf(m)} halfLength={ABOVE} held={<Maraca c={top(m.head)} angle={0} headW={HW} headH={HH} handle={HANDLE} handleD={HD} endOn />} />;
}

/** The singer's vocal mic on its boom (side view): body, boom, stand. */
function VocalMic() {
  const g = useMemo(() => ({ body: seg(make(), VOCAL.front.x, VOCAL.front.y, VOCAL.tail.x, VOCAL.tail.y), boom: seg(make(), VOCAL.tail.x, VOCAL.tail.y, VOCAL.boomEnd.x, VOCAL.boomEnd.y), stand: seg(make(), VOCAL.boomEnd.x, VOCAL.boomEnd.y, VOCAL.boomEnd.x, -10) }), []);
  return (
    <Group>
      <Path path={g.stand} style="stroke" strokeWidth={22} strokeCap="round" color={INK} />
      <Path path={g.stand} style="stroke" strokeWidth={15} strokeCap="round" color="#4d515b" />
      <Path path={g.boom} style="stroke" strokeWidth={14} strokeCap="round" color={INK} />
      <Path path={g.boom} style="stroke" strokeWidth={9} strokeCap="round" color="#6b707b" />
      <Path path={g.body} style="stroke" strokeWidth={50} strokeCap="round" color={INK} />
      <Path path={g.body} style="stroke" strokeWidth={46} strokeCap="round">
        <LinearGradient start={vec(VOCAL.front.x, VOCAL.front.y - 20)} end={vec(VOCAL.tail.x, VOCAL.tail.y + 20)} colors={BELL_CHROME} />
      </Path>
    </Group>
  );
}

export function MaracasArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const R = s.m.find((m) => m.side === 'R')!;
  const L = s.m.find((m) => m.side === 'L')!;
  if (view === 'top') {
    return (
      <Group>
        <PlayerTop />
        <TopMaraca m={L} />
        <TopMaraca m={R} />
      </Group>
    );
  }
  return (
    <Group>
      <SideMaraca m={L} />
      <PlayerSide />
      {s.id === 'singer' ? <VocalMic /> : null}
      <Arc m={R} />
      <SideMaraca m={R} />
    </Group>
  );
}

export function maracasLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const R = s.m[0];
  if (view === 'top') {
    return [
      { id: 'headR', text: 'RIGHT HEAD', short: 'HEAD', u: R.head.x + 60, v: R.head.z + 50, align: 'left' },
      { id: 'headL', text: 'LEFT HEAD', short: 'HEAD', u: s.m[1].head.x + 60, v: s.m[1].head.z - 50, align: 'left' },
      { id: 'player', text: 'PLAYER', u: -380, v: 330, align: 'center', tone: 'muted' },
    ];
  }
  const out: ArtLabel[] = [
    { id: 'head', text: 'HEADS (SEEDS INSIDE)', short: 'HEADS', u: R.head.x + 55, v: R.head.y - 20, align: 'left' },
    { id: 'handle', text: 'HANDLE', u: R.head.x + 40, v: R.head.y + HH / 2 + 130, align: 'left', tone: 'muted' },
    { id: 'arc', text: '↶ THE STROKE', short: '↶', u: R.head.x, v: R.head.y - 125, align: 'center', tone: 'illustrative' },
    { id: 'player', text: '← PLAYER', u: -380, v: -900, align: 'center', tone: 'muted', point: { u: -6000, v: -900 } },
  ];
  if (s.id === 'singer') out.push({ id: 'vocal', text: 'VOCAL MIC', u: VOCAL.front.x + 60, v: VOCAL.front.y - 60, align: 'left', tone: 'illustrative' });
  return out;
}

export function maracasHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  for (let i = 0; i < s.m.length; i++) {
    const m = s.m[i];
    const cu = m.head.x;
    const cv = view === 'side' ? m.head.y : m.head.z;
    const rv = view === 'side' ? HH / 2 : HW / 2;
    const k = ((u - cu) / (HW / 2 + tol)) ** 2 + ((v - cv) / (rv + tol)) ** 2;
    if (k <= 1) return Math.hypot(u - cu, v - cv) < HW * 0.22 ? `mar.seeds.${s.id}` : `mar.head${i}.${s.id}`;
    if (view === 'side' && Math.abs(u - cu) <= HD / 2 + tol && v > cv + HH / 2 && v < cv + HH / 2 + HANDLE) return `mar.handle${i}.${s.id}`;
  }
  if (s.id === 'singer' && view === 'side' && Math.hypot(u - VOCAL.front.x, v - VOCAL.front.y) < 60 + tol) return 'mar.vocal';
  return null;
}

export const MAR_ART: LessonArt = { Instrument: MaracasArt, labels: maracasLabels, hitTest: maracasHitTest };
