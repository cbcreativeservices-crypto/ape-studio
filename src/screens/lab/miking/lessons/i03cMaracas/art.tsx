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
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFist, placeBetween, profileFist, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D, PlayerSide, PlayerTop } from '../shared/smallperc/Player';
import { Maraca, BELL_CHROME } from '../shared/smallperc/objects';
import { HANDLE, MAR_DIMS, stateOf, VOCAL, type Maraca as M } from './model.ts';

const HW = MAR_DIMS.headW.mm;
const HH = MAR_DIMS.headH.mm;
const HD = MAR_DIMS.handleD.mm;
const BACK = dorsalFist();
const FIST = profileFist(HD / 2);
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

function SideMaraca({ m }: { m: M }) {
  const a = m.arm;
  const pl = useMemo(() => placeBetween(BACK, side(a.W), side(a.G)), [a]);
  return (
    <Group>
      <Arm2D s={side(a.S)} e={side(a.E)} w={side(a.W)} />
      <Hand geo={BACK} pl={pl} heldBehind held={<Maraca c={side(m.head)} angle={90} headW={HW} headH={HH} handle={HANDLE} handleD={HD} />} />
    </Group>
  );
}

function TopMaraca({ m }: { m: M }) {
  const a = m.arm;
  const pl = useMemo(() => placeBetween(FIST, top(a.W), top(a.G), m.side === 'L'), [a, m.side]);
  return (
    <Group>
      <Arm2D s={top(a.S)} e={top(a.E)} w={top(a.W)} />
      <Hand geo={FIST} pl={pl} />
      <Maraca c={top(m.head)} angle={0} headW={HW} headH={HH} handle={HANDLE} handleD={HD} endOn />
    </Group>
  );
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
