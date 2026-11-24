/**
 * FIGURE STUDY — "METAL" (D78 roll-out, 2026-11-24): the suspended-metal
 * players — I06a triangle, I06b finger cymbals, I06c bar chimes, I12 gong —
 * OLD beside NEW at the lesson's size, the new one about three times larger,
 * and each hand close. DEV + WEB ONLY: `#labpreview/FigureStudy/metal` (all),
 * `#labpreview/FigureStudy/metal-<lesson>` (tri, fc, bc, gong) for one lesson.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { fitXform } from '../screens/lab/miking/engine/geometry/frame';
import type { VariantId, ViewBox, ViewId } from '../screens/lab/miking/engine/model/types';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import type { RoleKey } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { MetalOld, metalPlan } from '../screens/lab/miking/lessons/shared/metal/MetalPlayerV2';
import type { MetalFig } from '../screens/lab/miking/lessons/shared/metal/metalFigureV2';
import type { FrontArt } from '../screens/lab/miking/lessons/shared/metal/metalPages';
import { TriangleArt, TRI_FRONT } from '../screens/lab/miking/lessons/i06aTriangle/art';
import { triFig } from '../screens/lab/miking/lessons/i06aTriangle/playerV2';
import { FingerCymbalsArt, FC_FRONT } from '../screens/lab/miking/lessons/i06bFingerCymbals/art';
import { fcFig } from '../screens/lab/miking/lessons/i06bFingerCymbals/playerV2';
import { BarChimesArt, BarChimesStrike, BC_FRONT, WRIST_MID } from '../screens/lab/miking/lessons/i06cBarChimes/art';
import { bcFig } from '../screens/lab/miking/lessons/i06cBarChimes/playerV2';
import { GongArt, GONG_FRONT } from '../screens/lab/miking/lessons/i12Gong/art';
import { gongFig } from '../screens/lab/miking/lessons/i12Gong/playerV2';

const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

type Art = (p: { view: ViewId; variant: VariantId }) => ReactNode;
type Pic = { key: string; title: string; draw: ReactNode; box: ViewBox; fig: MetalFig; role: RoleKey };

const sideTop = (lesson: string, Inst: Art, fig: (v: 'side' | 'top', variant: string) => MetalFig, role: RoleKey, variant: string, sideBox: ViewBox, topBox: ViewBox): Pic[] => [
  { key: `${lesson}s${variant}`, title: `${lesson} · ${variant} · side`, draw: <Inst view="side" variant={variant} />, box: sideBox, fig: fig('side', variant), role },
  { key: `${lesson}t${variant}`, title: `${lesson} · ${variant} · from above`, draw: <Inst view="top" variant={variant} />, box: topBox, fig: fig('top', variant), role },
];
const front = (lesson: string, F: FrontArt, fig: MetalFig, role: RoleKey, variant: string): Pic => {
  const A = F.Art;
  return { key: `${lesson}f${variant}`, title: `${lesson} · ${variant} · from the audience (MEET)`, draw: <A variant={variant} highlight={null} />, box: F.box(variant), fig, role };
};

const SIDE_TRI: ViewBox = { u0: -700, u1: 400, v0: -1800, v1: 40 };
const TOP_TRI: ViewBox = { u0: -700, u1: 400, v0: -500, v1: 500 };

function lessonPics(id: string): Pic[] {
  switch (id) {
    case 'tri':
      return [
        ...sideTop('TRIANGLE', TriangleArt as Art, triFig, 'metal.triangle', 'held', SIDE_TRI, TOP_TRI),
        front('TRIANGLE', TRI_FRONT, triFig('front', 'held'), 'metal.triangle', 'held'),
        ...sideTop('TRIANGLE', TriangleArt as Art, triFig, 'metal.triangle', 'mounted', SIDE_TRI, TOP_TRI),
        front('TRIANGLE', TRI_FRONT, triFig('front', 'mounted'), 'metal.triangle', 'mounted'),
      ];
    case 'fc':
      return [
        ...sideTop('FINGER CYMBALS', FingerCymbalsArt as Art, (v, x) => fcFig(v, x), 'metal.fingerCymbals', 'orchestral', SIDE_TRI, TOP_TRI),
        ...sideTop('FINGER CYMBALS', FingerCymbalsArt as Art, (v, x) => fcFig(v, x), 'metal.fingerCymbals', 'dance', { u0: -700, u1: 500, v0: -1900, v1: 40 }, { u0: -800, u1: 500, v0: -1600, v1: 1600 }),
        front('FINGER CYMBALS', FC_FRONT, fcFig('front', 'dance'), 'metal.fingerCymbals', 'dance'),
      ];
    case 'bc':
      return [
        ...sideTop('BAR CHIMES', BarChimesArt as Art, (v) => bcFig(v), 'metal.barChimes', 'single', SIDE_TRI, TOP_TRI),
        front('BAR CHIMES', BC_FRONT, bcFig('front', WRIST_MID), 'metal.barChimes', 'single'),
      ];
    default:
      return [
        ...sideTop('GONG', GongArt as Art, gongFig, 'metal.gong', 'tamtam', { u0: -700, u1: 1200, v0: -2000, v1: 40 }, { u0: -700, u1: 1200, v0: -1500, v1: 700 }),
        front('GONG', GONG_FRONT, gongFig('front', 'tamtam'), 'metal.gong', 'tamtam'),
        ...sideTop('GONG', GongArt as Art, gongFig, 'metal.gong', 'bossed', { u0: -700, u1: 1200, v0: -2000, v1: 40 }, { u0: -700, u1: 1200, v0: -1500, v1: 700 }),
        front('GONG', GONG_FRONT, gongFig('front', 'bossed'), 'metal.gong', 'bossed'),
      ];
  }
}

/** A canvas showing `box` of a picture (`old`: the old figure in it). */
function Frame({ draw, box, w, h, old = false }: { draw: ReactNode; box: ViewBox; w: number; h: number; old?: boolean }) {
  const xf = fitXform('side', box, w, h, 0);
  return (
    <Canvas style={{ width: w, height: h }}>
      <Rect x={0} y={0} width={w} height={h} color={STAGE} />
      <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
        <FigureScale ptPerMm={xf.s}>
          <MetalOld value={old}>{draw}</MetalOld>
        </FigureScale>
      </Group>
    </Canvas>
  );
}

const crop = (c: { u: number; v: number }, mmW: number, mmH: number): ViewBox => ({ u0: c.u - mmW / 2, u1: c.u + mmW / 2, v0: c.v - mmH / 2, v1: c.v + mmH / 2 });

function PicStudy({ p, width }: { p: Pic; width: number }) {
  const lw = Math.min(360, (width - 36) / 2);
  const lh = lw * ((p.box.v1 - p.box.v0) / (p.box.u1 - p.box.u0));
  const fp = metalPlan(p.fig, p.role);
  // the person's own box on the page (its hands and its head)
  const pts = fp.arms.map((a) => ({ u: (a.hand.box.u0 + a.hand.box.u1) / 2, v: (a.hand.box.v0 + a.hand.box.v1) / 2 }));
  const s0 = lw / (p.box.u1 - p.box.u0);
  const big = Math.min(width - 24, 720);
  const bodyC = { u: (pts[0].u + pts[1].u) / 2, v: (pts[0].v + pts[1].v) / 2 - 150 };
  const mmBig = big / (s0 * 3);
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>{p.title}</Text>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <View>
          <Text style={{ color: DIM, fontSize: 11 }}>OLD · lesson size</Text>
          <Frame draw={p.draw} box={p.box} w={lw} h={lh} old />
        </View>
        <View>
          <Text style={{ color: DIM, fontSize: 11 }}>NEW · lesson size</Text>
          <Frame draw={p.draw} box={p.box} w={lw} h={lh} />
        </View>
      </View>
      <Text style={{ color: DIM, fontSize: 11, marginTop: 8 }}>NEW · about 3×</Text>
      <Frame draw={p.draw} box={crop(bodyC, mmBig, mmBig * 0.8)} w={big} h={big * 0.8} />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        {pts.map((c, i) => (
          <View key={i}>
            <Text style={{ color: DIM, fontSize: 11 }}>{`${fp.arms[i].side === 'L' ? 'LEFT' : 'RIGHT'} HAND · close`}</Text>
            <Frame draw={p.draw} box={crop(c, 170, 170)} w={Math.min(380, (width - 36) / 2)} h={Math.min(380, (width - 36) / 2)} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function MetalStudy({ width, only }: { width: number; only: string }) {
  // (one picture at a time: a browser keeps only ≈ 16 live canvases — `metal-<lesson>-<n>`)
  const [, sel = 'tri', nStr = '0'] = only.split('-');
  const pics = lessonPics(sel);
  const n = Math.max(0, Math.min(pics.length - 1, Number(nStr) || 0));
  const w = Math.min(width, 760);
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Metal — triangle, finger cymbals, bar chimes, gong</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 6 }}>Old beside new at the lesson's size; the new figure about 3× larger; each hand close. Instruments, marks and labels are the lessons' own (unchanged).</Text>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 14 }}>{`Pictures here (#labpreview/FigureStudy/metal-${sel}-N): ${pics.map((p, i) => `${i} ${p.title}`).join(' · ')}. Lessons: tri, fc, bc, gong; bc-sweep for the stroke pictures.`}</Text>
      {nStr === 'sweep' ? null : <PicStudy key={pics[n].key} p={pics[n]} width={w} />}
      {sel === 'bc' && nStr === 'sweep' ? (
        <View style={{ marginBottom: 28 }}>
          <Text style={{ color: INK, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>BAR CHIMES · the sweep, stroke to sound (NEW)</Text>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((s) => (
              <BarChimesStrike key={s} w={Math.min(340, (w - 36) / 2)} h={Math.min(340, (w - 36) / 2) * 0.9} variant="single" shown={s} accessibilityLabel="sweep" />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
