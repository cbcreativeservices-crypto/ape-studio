/**
 * THE METAL FAMILY'S HANDS — ONE REVIEW SHEET (DEV + WEB ONLY; owner 2026-11-25, "switch to batches by family").
 * `#labpreview/FigureStudy/sheet-metal` lists every hand of the suspended-metal lessons (I06a triangle, I06b finger
 * cymbals, I06c bar chimes, I12 gong) as a student first sees them, numbered 1..N, each marked NEW (an authored
 * drawing made in this batch) or KEPT, with what it does and where it is used. Each one: the drawing ALONE and
 * large (about 3 pt/mm; a kept hand that is posed in its figure is shown close inside it instead), and beside it
 * the same hand at the lesson's own size inside its figure and a closer look at it there.
 * One canvas per hand (a browser keeps only about 16 live canvases): `sheet-metal-N` shows hand N alone.
 */
import type { ReactNode } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { castFor, type RoleKey } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import type { ViewBox } from '../screens/lab/miking/engine/model/types';
import { MetalHand } from '../screens/lab/miking/lessons/shared/figureV2/metalHandPaint';
import { METAL_HANDS, metalPlan } from '../screens/lab/miking/lessons/shared/metal/MetalPlayerV2';
import type { MetalFig } from '../screens/lab/miking/lessons/shared/metal/metalFigureV2';
import { TriangleArt, TRI_FRONT } from '../screens/lab/miking/lessons/i06aTriangle/art';
import { triFig } from '../screens/lab/miking/lessons/i06aTriangle/playerV2';
import { FingerCymbalsArt, FC_FRONT } from '../screens/lab/miking/lessons/i06bFingerCymbals/art';
import { fcFig } from '../screens/lab/miking/lessons/i06bFingerCymbals/playerV2';
import { BarChimesArt, BC_FRONT, WRIST_MID } from '../screens/lab/miking/lessons/i06cBarChimes/art';
import { bcFig } from '../screens/lab/miking/lessons/i06cBarChimes/playerV2';
import { GongArt, GONG_FRONT } from '../screens/lab/miking/lessons/i12Gong/art';
import { gongFig } from '../screens/lab/miking/lessons/i12Gong/playerV2';

const BG = '#0d0f13';
const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';
const NEW_C = '#ffc64d';
const KEPT_C = '#8fd18f';

type Scene = { draw: ReactNode; box: ViewBox; fig: MetalFig; role: RoleKey; side: 'L' | 'R' };
type Item = { title: string; caption: string; status: 'NEW' | 'KEPT'; doubt?: string; kind?: string; scene: Scene };

const SIDE_TRI: ViewBox = { u0: -700, u1: 400, v0: -1800, v1: 40 };
const TOP_TRI: ViewBox = { u0: -700, u1: 400, v0: -500, v1: 500 };
const GONG_SIDE: ViewBox = { u0: -700, u1: 1200, v0: -2000, v1: 40 };

const side = (Art: (p: { view: 'side' | 'top'; variant: string }) => ReactNode, view: 'side' | 'top', variant: string, box: ViewBox, fig: MetalFig, role: RoleKey, s: 'L' | 'R'): Scene => ({ draw: <Art view={view} variant={variant} />, box, fig, role, side: s });
const front = (F: { box: (v: string) => ViewBox; Art: (p: { variant: string; highlight: string | null }) => ReactNode }, variant: string, fig: MetalFig, role: RoleKey, s: 'L' | 'R'): Scene => {
  const A = F.Art;
  return { draw: <A variant={variant} highlight={null} />, box: F.box(variant), fig, role, side: s };
};

/** Every hand of the family, numbered in this order. */
export function metalSheetItems(): Item[] {
  const TRI = 'metal.triangle' as const;
  const FC = 'metal.fingerCymbals' as const;
  const BC = 'metal.barChimes' as const;
  const GONG = 'metal.gong' as const;
  const Tri = TriangleArt as never;
  const Fc = FingerCymbalsArt as never;
  const Bc = BarChimesArt as never;
  const Gong = GongArt as never;
  const NOT_YET = 'Not redrawn in this batch: still the posed hand (the fingers as separate rounded pieces, no clear nails). It does not yet meet the hand rules.';
  const DANCE_SIDE: ViewBox = { u0: -700, u1: 500, v0: -1900, v1: 40 };
  const DANCE_TOP: ViewBox = { u0: -800, u1: 500, v0: -1600, v1: 1600 };
  return [
    /* ── I06a triangle ── */
    {
      title: 'triangle — the left hand holding the clip, from the player’s right',
      caption: 'Held "like a C": the palm behind the clip, the thumb’s pad on its player side, the index arching over its top, the middle finger curled round its audience side; the ring and little fingers relaxed below, free to damp. Used in I06a (held, side view).',
      status: 'NEW',
      kind: 'clipSide',
      scene: side(Tri, 'side', 'held', SIDE_TRI, triFig('side', 'held'), TRI, 'L'),
    },
    {
      title: 'triangle — the right hand on the beater, from the player’s right (the back of the hand)',
      caption: 'Held lightly near its end like a stick: the beater leaves between the thumb’s pad and the index’s bend, rising toward the triangle’s base; the fingers curled loosely under it (one row of bends). Used in I06a (held and mounted, side view).',
      status: 'NEW',
      kind: 'beaterBack',
      doubt: 'The fist reads as a fist from the back with the thumb on top; the four bends along its front edge are close to equal in size.',
      scene: side(Tri, 'side', 'held', SIDE_TRI, triFig('side', 'held'), TRI, 'R'),
    },
    {
      title: 'triangle — the left hand holding the clip, from the audience',
      caption: 'Used in I06a (held, from the audience: the Meet page).',
      status: 'KEPT',
      doubt: NOT_YET,
      scene: front(TRI_FRONT as never, 'held', triFig('front', 'held'), TRI, 'L'),
    },
    {
      title: 'triangle — the beater hand from the audience',
      caption: 'Used in I06a (held: the right hand; mounted: both hands, from the audience).',
      status: 'KEPT',
      doubt: `${NOT_YET} The approved mallet hands could not be reused: their shaft runs 15° below the forearm, the triangle beater rises from the hand.`,
      scene: front(TRI_FRONT as never, 'held', triFig('front', 'held'), TRI, 'R'),
    },
    {
      title: 'triangle — the clip hand and the beater hand from above',
      caption: 'Used in I06a (held, from above; mounted from above: the beater hand).',
      status: 'KEPT',
      doubt: NOT_YET,
      scene: side(Tri, 'top', 'held', TOP_TRI, triFig('top', 'held'), TRI, 'L'),
    },
    /* ── I06b finger cymbals ── */
    {
      title: 'finger cymbals (dance) — the dancer’s hand wearing zills, palm toward the audience',
      caption: 'Thumb and middle finger each wear a cymbal; the middle finger curls forward toward the thumb, ready to close; the other fingers relaxed. Left hand shown; the right is its mirror. Used in I06b (dance, from the audience, and the close-up circle).',
      status: 'NEW',
      kind: 'zillPalm',
      scene: front(FC_FRONT as never, 'dance', fcFig('front', 'dance'), FC, 'L'),
    },
    {
      title: 'finger cymbals (dance) — the same hand seen from the side, its little-finger edge toward you',
      caption: 'The palm toward the audience (right), the wrist bent back as the raised hand does; the thumb rising forward with its cymbal, the middle finger hooked forward under it with the other; the little finger nearest, the ring and index tips just showing. Used in I06b (dance, side view), both hands.',
      status: 'NEW',
      kind: 'zillEdge',
      doubt: 'Weakest of the new drawings (two rounds): the thumb still reads as a thin strip along the palm and the hooked middle finger leaves a loop of background inside its bend. The far (left) hand uses the same drawing: strictly it shows its thumb edge to this camera (it is mostly behind the near hand).',
      scene: side(Fc, 'side', 'dance', DANCE_SIDE, fcFig('side', 'dance'), FC, 'R'),
    },
    {
      title: 'finger cymbals (dance) — the hands from above',
      caption: 'Used in I06b (dance, from above). Very small at the lesson’s size.',
      status: 'KEPT',
      doubt: NOT_YET,
      scene: side(Fc, 'top', 'dance', DANCE_TOP, fcFig('top', 'dance'), FC, 'L'),
    },
    {
      title: 'finger cymbals (orchestral) — both hands pinching the straps, from the audience (the approved pinch hands)',
      caption: 'Each strap pinched between the thumb’s pad and the index finger’s pad just above the bell. Used in I06b (orchestral, from the audience). Approved earlier; FC_LEFT_PINCH_FROM_ABOVE unchanged.',
      status: 'KEPT',
      scene: front(FC_FRONT as never, 'orchestral', fcFig('front', 'orchestral'), FC, 'L'),
    },
    {
      title: 'finger cymbals (orchestral) — both hands pinching the straps, from the player’s right',
      caption: 'Used in I06b (orchestral, side view).',
      status: 'KEPT',
      doubt: NOT_YET,
      scene: side(Fc, 'side', 'orchestral', SIDE_TRI, fcFig('side', 'orchestral'), FC, 'L'),
    },
    {
      title: 'finger cymbals (orchestral) — both hands from above',
      caption: 'The backs of both hands over the cymbals, each pinching its strap. Used in I06b (orchestral, from above).',
      status: 'KEPT',
      doubt: 'Not redrawn in this batch (the posed hands read fairly well from above, but the two hands crowd the same spot).',
      scene: side(Fc, 'top', 'orchestral', TOP_TRI, fcFig('top', 'orchestral'), FC, 'L'),
    },
    /* ── I06c bar chimes ── */
    {
      title: 'bar chimes — the sweeping hand from the audience (the approved hand-drum hand)',
      caption: 'The back of the left hand, the fingers hanging down behind the bars, their backs brushing them. Used in I06c (from the audience, and the stroke pictures). Approved earlier (hand-drum hand); BC_SWEEP_FINGERS_DOWN unchanged.',
      status: 'KEPT',
      scene: front(BC_FRONT as never, 'single', bcFig('front', WRIST_MID), BC, 'L'),
    },
    {
      title: 'bar chimes — the sweeping hand from the player’s right',
      caption: 'The fingers hanging forward, their backs on the bars from the player’s side. Used in I06c (side view).',
      status: 'KEPT',
      doubt: NOT_YET,
      scene: side(Bc, 'side', 'single', SIDE_TRI, bcFig('side'), BC, 'L'),
    },
    {
      title: 'bar chimes — the sweeping hand from above (the arm corrected)',
      caption: 'The ARM is fixed in this batch (the review: "the arm wrong from above"): the elbow now low and a little out, so from above the arm runs forward from the shoulder to the long end. Used in I06c (from above).',
      status: 'KEPT',
      doubt: `The arm is new; the hand itself is ${NOT_YET.charAt(0).toLowerCase()}${NOT_YET.slice(1)}`,
      scene: side(Bc, 'top', 'single', TOP_TRI, bcFig('top'), BC, 'L'),
    },
    /* ── shared and I12 gong ── */
    {
      title: 'the hand hanging relaxed at the side',
      caption: 'The arm hanging, the fingers gently curled. Used in I12 (left hand), I06c (right hand), I06a (mounted, from above), the I06b dancers on the route. The same drawing as the gong player’s left hand, which passed the earlier review.',
      status: 'KEPT',
      scene: side(Bc, 'side', 'single', SIDE_TRI, bcFig('side'), BC, 'R'),
    },
    {
      title: 'gong — the right hand on the mallet handle, near its end',
      caption: 'A relaxed full grip near the end of the handle, the arm reaching. Used in I12 (side, from above, from the audience). Passed the earlier review.',
      status: 'KEPT',
      scene: side(Gong, 'side', 'tamtam', GONG_SIDE, gongFig('side', 'tamtam'), GONG, 'R'),
    },
  ];
}

/** How many hands one page of the sheet shows (a browser keeps only about 16 live canvases). */
export const SHEET_PAGE = 8;

/** The hand's own place on its page (an authored hand: its anchor; a posed one: the middle of its box). */
function focusOf(s: Scene): { u: number; v: number } {
  const d = s.fig.drawn[s.side];
  if (d) return d.at;
  const fp = metalPlan(s.fig, s.role);
  const a = fp.arms.find((x) => x.side === s.side) ?? fp.arms[0];
  return { u: (a.hand.box.u0 + a.hand.box.u1) / 2, v: (a.hand.box.v0 + a.hand.box.v1) / 2 };
}

/** A window of the scene: `mm` wide round `c`, drawn `w` × `h` pt at (x, y) inside the item's canvas. */
function Window({ s, c, mm, x, y, w, h }: { s: Scene; c: { u: number; v: number }; mm: number; x: number; y: number; w: number; h: number }) {
  const k = w / mm;
  return (
    <Group clip={Skia.XYWHRect(x, y, w, h)}>
      <Rect x={x} y={y} width={w} height={h} color={STAGE} />
      <Group transform={[{ translateX: x + w / 2 - c.u * k }, { translateY: y + h / 2 - c.v * k }, { scale: k }]}>
        <FigureScale ptPerMm={k}>{s.draw}</FigureScale>
      </Group>
    </Group>
  );
}

/** The phone's lesson width across the picture's box (pt). */
const PHONE = 360;

function ItemCard({ n, it, width }: { n: number; it: Item; width: number }) {
  const art = it.kind ? (METAL_HANDS as Record<string, (typeof METAL_HANDS)[keyof typeof METAL_HANDS] | undefined>)[it.kind] : undefined;
  const f = focusOf(it.scene);
  const full = Math.min(width - 24, 720);
  // the drawing alone: 3 pt/mm on a 260 × 240 mm field round its own middle (or as much as the page allows)
  const s3 = Math.min(3, full / 260);
  const aloneW = 260 * s3;
  const aloneH = 250 * s3;
  const lessonK = PHONE / (it.scene.box.u1 - it.scene.box.u0);
  const cellW = Math.min(340, (full - 12) / 2);
  const cellH = cellW;
  const topH = art ? aloneH + 12 : 0;
  const d = it.scene.fig.drawn[it.scene.side];
  const who = castFor(it.scene.role);
  // (the alone drawing's middle: half-way from its anchor to its wrist)
  const mid = art ? { u: (art.anchor.u + art.cuff.u) / 2, v: (art.anchor.v + art.cuff.v) / 2 - 10 } : null;
  return (
    <View style={{ marginBottom: 30 }}>
      <Text style={{ color: INK, fontSize: 15, fontWeight: '700' }}>
        {`${n} — ${it.title}  `}
        <Text style={{ color: it.status === 'NEW' ? NEW_C : KEPT_C }}>{it.status}</Text>
      </Text>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 2, marginBottom: 6 }}>{it.caption}</Text>
      {it.doubt ? <Text style={{ color: NEW_C, fontSize: 12, marginBottom: 6 }}>{`Doubt: ${it.doubt}`}</Text> : null}
      <Canvas style={{ width: full, height: topH + cellH + 18 }}>
        <Rect x={0} y={0} width={full} height={topH + cellH + 18} color={BG} />
        {art && mid ? (
          <Group clip={Skia.XYWHRect(0, 0, aloneW, aloneH)}>
            <Rect x={0} y={0} width={aloneW} height={aloneH} color={STAGE} />
            <MetalHand art={art} who={who} x={aloneW / 2 - (mid.u - art.anchor.u) * s3 * (d?.mirror ? -1 : 1)} y={aloneH / 2 - (mid.v - art.anchor.v) * s3} s={s3} ownScale />
          </Group>
        ) : null}
        <Window s={it.scene} c={f} mm={cellW / lessonK} x={0} y={topH} w={cellW} h={cellH} />
        <Window s={it.scene} c={f} mm={art ? 300 : 220} x={cellW + 12} y={topH} w={cellW} h={cellH} />
      </Canvas>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Text style={{ color: DIM, fontSize: 11, width: cellW }}>{`in the lesson, at the lesson's size (${lessonK.toFixed(2)} pt/mm)`}</Text>
        <Text style={{ color: DIM, fontSize: 11, width: cellW }}>in the lesson, closer</Text>
      </View>
    </View>
  );
}

export function MetalSheetStudy({ only }: { only: string }) {
  const { width } = useWindowDimensions();
  const items = metalSheetItems();
  const pick = /^sheet-metal-(\d+)$/.exec(only);
  const n = pick ? Number(pick[1]) : 0;
  const all = items.map((it, i) => [i + 1, it] as const);
  // (one hand: sheet-metal-N; the sheet itself in pages of SHEET_PAGE: sheet-metal, sheet-metal-p2, …)
  const page = /^sheet-metal-p(\d+)$/.exec(only);
  const p = page ? Math.max(1, Number(page[1])) : 1;
  const pages = Math.ceil(items.length / SHEET_PAGE);
  const shown = n >= 1 && n <= items.length ? [all[n - 1]] : all.slice((p - 1) * SHEET_PAGE, p * SHEET_PAGE);
  const nNew = items.filter((x) => x.status === 'NEW').length;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Metal family — every hand, one sheet</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 6 }}>
        {`Triangle, finger cymbals, bar chimes, gong: ${items.length} hands as a student first sees them (side view, from above, from the audience), ${nNew} NEW (drawn in this batch), the rest KEPT. Each new one alone and large, then in its lesson at the lesson's size and closer; a kept one in its lesson. Mark each number pass or fail.`}
      </Text>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 14 }}>
        {`Page ${p} of ${pages}: #labpreview/FigureStudy/sheet-metal${pages > 1 ? ', sheet-metal-p2' : ''}. One hand only: sheet-metal-N. ${items.map((it, i) => `${i + 1} ${it.status}`).join(' · ')}`}
      </Text>
      {shown.map(([k, it]) => (
        <ItemCard key={k} n={k} it={it} width={width} />
      ))}
    </ScrollView>
  );
}
