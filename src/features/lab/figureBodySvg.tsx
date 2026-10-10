/**
 * A WHOLE FIGURE for react-native-svg scenes (figure polish 2026-10-10, owner:
 * "high-end drawings everywhere … a pro reference app" — the SVG labs drew
 * their people as stick figures: a stick torso on a stick chair, a line body
 * under a head). The same figure as the Miking PlayerFigure, without Skia:
 * an adult at TRUE size in millimetres, drawn as smooth body masses — a
 * long-sleeved shirt, trousers with a belt, shoes, hands with a thumb and
 * the finger divisions — each with the house form gradient (light from the
 * upper left), a darker contour, and the figure's own skin-silhouette head
 * (FigureHeadSvg, never the head icon, never a circle). Neutral and modest:
 * nothing at or in front of the groin; feet on the floor; arms from the
 * shoulders; head, torso, hips, knees and feet face the same way.
 *
 * Real adult dimensions used (mm): stature 1750; head crown→chin 228 (1 : 7.7);
 * shoulders 400 between the joints, ≈ 465 across the deltoids; waist ≈ 300;
 * hips ≈ 350; upper arm 300, forearm 265, hand 180; thigh (hip → knee) 440;
 * knee → ankle 430; shoe 290 × 100; seated: seat 450, hip joint 90 over the
 * seat, ear ≈ 1190 above the floor.
 *
 * Render inside the caller's <Svg>. `px` = the caller's units per mm.
 */
import { useId } from 'react';
import { Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { FigureHeadSvg } from './figureHeadSvg';
import { catmullInto, svgPathSink } from './headIconGeometry';

type XY = readonly [number, number];

/** The figure tones (PlayerFigure FIGURE_TONES, duplicated: SVG screens never load Skia). */
const TONE = {
  shirt: { ramp: ['#76839e', '#55617b', '#3a4357', '#262c3a'], edge: '#12151c' },
  trousers: { ramp: ['#585c66', '#3c3f47', '#272a30', '#17191d'], edge: '#0d0e11' },
  skin: { ramp: ['#c3ab98', '#a28977', '#7d6656', '#5a4639'], edge: '#2a201a' },
  shoe: { ramp: ['#5a4030', '#3a281c', '#22170f', '#120c08'], edge: '#070504' },
  seat: { ramp: ['#4a4c55', '#2e3036', '#1b1c21', '#0f1013'], edge: '#08080a' },
} as const;
type ToneId = keyof typeof TONE;

function smoothD(pts: readonly XY[], closed = true): string {
  const sink = svgPathSink();
  catmullInto(sink, pts, 1, closed, 0.5);
  return sink.d();
}

const mirrorX = (pts: readonly XY[]): XY[] => pts.map(([x, y]) => [-x, y] as XY);

/** A tapered tube along a polyline (half-widths per point), as one outline. */
function tube(path: readonly XY[], half: readonly number[]): XY[] {
  const L: XY[] = [];
  const R: XY[] = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    L.push([path[i][0] + nx * half[i], path[i][1] + ny * half[i]]);
    R.push([path[i][0] - nx * half[i], path[i][1] - ny * half[i]]);
  }
  return [...L, ...R.reverse()];
}

function bounds(pts: readonly XY[]) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** One body mass: the tone's form gradient (upper left lit), its contour. */
function Mass({ id, pts, tone, w, closed = true }: { id: string; pts: readonly XY[]; tone: ToneId; w: number; closed?: boolean }) {
  const t = TONE[tone];
  const b = bounds(pts);
  return (
    <>
      <Defs>
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={b.x0} y1={b.y0} x2={b.x1} y2={b.y1}>
          <Stop offset={0} stopColor={t.ramp[0]} />
          <Stop offset={0.38} stopColor={t.ramp[1]} />
          <Stop offset={0.72} stopColor={t.ramp[2]} />
          <Stop offset={1} stopColor={t.ramp[3]} />
        </LinearGradient>
      </Defs>
      <Path d={smoothD(pts, closed)} fill={`url(#${id})`} stroke={t.edge} strokeWidth={w} strokeLinejoin="round" />
    </>
  );
}

/* ── STANDING, FRONT VIEW (origin: between the feet on the floor; y down) ── */

const TORSO_HALF: XY[] = [
  [54, -1478],
  [132, -1458],
  [198, -1432],
  [228, -1392],
  [232, -1336],
  [214, -1228],
  [178, -1118],
  [156, -1040],
  [162, -986],
];
const TORSO_FRONT: XY[] = [...TORSO_HALF, ...mirrorX(TORSO_HALF).reverse(), [0, -1442]];
const SLEEVE_FRONT: XY[] = [
  [198, -1434],
  [236, -1388],
  [247, -1270],
  [243, -1130],
  [238, -1000],
  [230, -884],
  [172, -884],
  [162, -1000],
  [166, -1130],
  [158, -1262],
  [170, -1356],
];
/** The hand hanging beside the thigh, seen from the front: its thumb side —
 *  the thumb's lobe forward of the palm, the fingers slightly curled. */
const HAND_FRONT: XY[] = [
  [180, -888],
  [226, -888],
  [235, -822],
  [231, -752],
  [217, -706],
  [199, -699],
  [185, -726],
  [179, -770],
  [166, -800],
  [164, -838],
  [172, -864],
];
const TROUSERS_FRONT: XY[] = [
  [-166, -994],
  [166, -994],
  [181, -900],
  [173, -700],
  [130, -500],
  [110, -92],
  [52, -92],
  [42, -500],
  [16, -790],
  [0, -812],
  [-16, -790],
  [-42, -500],
  [-52, -92],
  [-110, -92],
  [-130, -500],
  [-173, -700],
  [-181, -900],
];
const SHOE_FRONT: XY[] = [
  [40, 0],
  [130, 0],
  [136, -32],
  [124, -80],
  [56, -84],
  [38, -32],
];

/**
 * A standing adult, FRONT view, at true size: feet on the floor at
 * (`cx`, `floorY`), `px` caller units per mm (an adult is 1750 mm tall).
 * Arms hang at the sides, hands beside the thighs.
 */
export function FigureStandingFrontSvg({ cx, floorY, px, minContour = 0.8 }: { cx: number; floorY: number; px: number; minContour?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const w = Math.max(minContour / px, 2.2);
  const fine = w * 0.7;
  return (
    <G transform={`translate(${cx} ${floorY}) scale(${px})`}>
      <Mass id={`fbS0${uid}`} pts={SHOE_FRONT} tone="shoe" w={w} />
      <Mass id={`fbS1${uid}`} pts={mirrorX(SHOE_FRONT)} tone="shoe" w={w} />
      <Mass id={`fbT${uid}`} pts={TROUSERS_FRONT} tone="trousers" w={w} />
      {/* the trouser creases down each leg */}
      <Path d="M88 -900 L82 -110 M-88 -900 L-82 -110" stroke={TONE.trousers.edge} strokeWidth={fine} opacity={0.45} />
      <Mass id={`fbB${uid}`} pts={TORSO_FRONT} tone="shirt" w={w} />
      {/* the belt over the waistband, the shirt tucked in */}
      <Path d="M-163 -1004 L163 -1004 L166 -976 L-166 -976 Z" fill="#2a1d15" stroke="#0b0806" strokeWidth={fine} />
      {/* the placket and its buttons */}
      <Line x1={0} y1={-1440} x2={0} y2={-1006} stroke={TONE.shirt.edge} strokeWidth={fine} opacity={0.7} />
      <Mass id={`fbA0${uid}`} pts={SLEEVE_FRONT} tone="shirt" w={w} />
      <Mass id={`fbA1${uid}`} pts={mirrorX(SLEEVE_FRONT)} tone="shirt" w={w} />
      {/* the cuffs */}
      <Path d="M170 -924 L232 -924 M-170 -924 L-232 -924" stroke={TONE.shirt.edge} strokeWidth={fine} opacity={0.6} />
      <Mass id={`fbH0${uid}`} pts={HAND_FRONT} tone="skin" w={w} />
      <Mass id={`fbH1${uid}`} pts={mirrorX(HAND_FRONT)} tone="skin" w={w} />
      {/* the fingers' divisions */}
      <Path d="M203 -760 L206 -708 M216 -764 L221 -716 M-203 -760 L-206 -708 M-216 -764 L-221 -716" stroke={TONE.skin.edge} strokeWidth={fine} opacity={0.55} />
      {/* the head: crown at 1750, chin at 1522, the neck into the collar */}
      <FigureHeadSvg view="front" cx={0} cy={-1631} h={228} neckTo={-1452} minContour={w} />
      {/* the collar over the neck */}
      <Path d="M-56 -1474 Q-30 -1440 0 -1426 Q30 -1440 56 -1474" fill="none" stroke={TONE.shirt.edge} strokeWidth={fine} />
    </G>
  );
}

/* ── SEATED, PROFILE (facing +x; origin: the floor under the hip; y down) ── */

/** The ear of the seated figure, relative to the hip joint (mm). */
const EAR_FROM_HIP: XY = [6, -649];
/** Hip joint over the seat (mm). */
const HIP_OVER_SEAT = 90;

/** The seat height (mm) that puts a seated adult's ear at `earMm` over the floor. */
export const seatForEar = (earMm: number) => Math.max(200, Math.min(900, earMm + EAR_FROM_HIP[1] - HIP_OVER_SEAT));

/**
 * A seated adult in PROFILE on a chair, at true size, placed by the EAR:
 * the ear at (`earX`, `earY`) caller units, the floor at `floorY`; `px`
 * caller units per mm; `facing` −1 = the face toward −x. The seat height
 * follows from the ear height (an adult's ear ≈ 739 mm over the seat), so a
 * listener whose ear is set higher sits on a taller chair, feet on the floor
 * or (above a 450 mm seat) on the chair's footrest. The forearm rests along
 * the thigh, the hand on the knee.
 */
export function FigureSeatedSideSvg({ earX, earY, floorY, px, facing = 1, minContour = 0.8 }: { earX: number; earY: number; floorY: number; px: number; facing?: 1 | -1; minContour?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const earMm = (floorY - earY) / px;
  const S = seatForEar(earMm);
  const hipY = -(S + HIP_OVER_SEAT);
  const H = (x: number, y: number): XY => [x, hipY + y];
  const w = Math.max(minContour / px, 2.2);
  const fine = w * 0.7;
  // The lower leg: knee → ankle 430 mm; the ankle 90 mm over the floor (or
  // the footrest when the seat is high), the shin sloping forward if low.
  const knee = H(440, 20);
  const drop = Math.min(430, S - 20);
  const ankle: XY = [knee[0] + 20 + Math.sqrt(Math.max(0, 430 * 430 - drop * drop)) * 0.9, knee[1] + drop];
  const soleY = ankle[1] + 90;
  const footrest = soleY < -4;
  // Chair: seat 460 wide, 30 thick; the backrest behind the back; two legs.
  const seatTop = -S;
  const chair = (
    <>
      <Path d={`M-200 ${seatTop + 30} L-200 0 M200 ${seatTop + 30} L200 0`} stroke="#1b1c21" strokeWidth={26} strokeLinecap="round" />
      <Path d={`M-200 ${seatTop + 30} L-200 0 M200 ${seatTop + 30} L200 0`} stroke="#4a4c55" strokeWidth={10} strokeLinecap="round" opacity={0.5} />
      {footrest ? <Path d={`M-200 ${soleY + 14} L${ankle[0] + 120} ${soleY + 14}`} stroke="#2e3036" strokeWidth={22} strokeLinecap="round" /> : null}
      <Mass id={`fsBk${uid}`} pts={[[-262, seatTop - 430], [-226, seatTop - 440], [-214, seatTop + 6], [-250, seatTop + 10]]} tone="seat" w={w} />
      <Mass id={`fsSt${uid}`} pts={[[-236, seatTop], [236, seatTop - 4], [240, seatTop + 30], [-236, seatTop + 32]]} tone="seat" w={w} />
    </>
  );
  const trousers: XY[] = [
    H(64, -112),
    H(150, -72),
    H(300, -62),
    [knee[0], knee[1] - 72],
    [knee[0] + 62, knee[1] - 20],
    [knee[0] + 66, knee[1] + 60],
    [ankle[0] + 34, ankle[1] - 10],
    [ankle[0] - 34, ankle[1] - 10],
    [knee[0] - 20, knee[1] + 120],
    [knee[0] - 44, knee[1] + 58],
    H(100, 86),
    H(-120, 84),
    H(-166, 12),
    H(-146, -112),
  ];
  const shoe: XY[] = [
    [ankle[0] - 64, soleY],
    [ankle[0] - 60, soleY - 58],
    [ankle[0] - 8, soleY - 104],
    [ankle[0] + 70, soleY - 74],
    [ankle[0] + 200, soleY - 40],
    [ankle[0] + 226, soleY],
  ];
  const shirt: XY[] = [H(76, -112), H(96, -232), H(116, -382), H(92, -472), H(42, -526), H(-34, -532), H(-110, -472), H(-136, -382), H(-128, -232), H(-142, -112)];
  // The near arm: shoulder → elbow at the side → the forearm along the thigh.
  const wrist = H(236, -96);
  const sleeve = tube([H(-14, -470), H(-18, -334), H(-22, -206), H(104, -140), wrist], [54, 48, 40, 38, 31]);
  const hand: XY[] = [
    [wrist[0] - 10, wrist[1] - 28],
    [wrist[0] + 70, wrist[1] - 24],
    [wrist[0] + 150, wrist[1] - 6],
    [wrist[0] + 176, wrist[1] + 12],
    [wrist[0] + 166, wrist[1] + 28],
    [wrist[0] + 70, wrist[1] + 30],
    [wrist[0] - 10, wrist[1] + 28],
  ];
  const head = H(40, -660);
  return (
    <G transform={`translate(${earX} ${earY}) scale(${px * facing} ${px}) translate(${-EAR_FROM_HIP[0]} ${-(hipY + EAR_FROM_HIP[1])})`}>
      {chair}
      <Mass id={`fsSh${uid}`} pts={shoe} tone="shoe" w={w} />
      <Mass id={`fsTr${uid}`} pts={trousers} tone="trousers" w={w} />
      <Mass id={`fsSi${uid}`} pts={shirt} tone="shirt" w={w} />
      {/* the belt, the shirt tucked in */}
      <Path d={`M${-144} ${hipY - 126} L80 ${hipY - 126} L78 ${hipY - 100} L-146 ${hipY - 100} Z`} fill="#2a1d15" stroke="#0b0806" strokeWidth={fine} />
      <Mass id={`fsAr${uid}`} pts={sleeve} tone="shirt" w={w} />
      <Mass id={`fsHa${uid}`} pts={hand} tone="skin" w={w} />
      <Path d={`M${wrist[0] + 110} ${wrist[1] - 4} L${wrist[0] + 160} ${wrist[1] + 10} M${wrist[0] + 104} ${wrist[1] + 10} L${wrist[0] + 150} ${wrist[1] + 22}`} stroke={TONE.skin.edge} strokeWidth={fine} opacity={0.55} />
      {/* the elbow's crease */}
      <Path d={`M${-50} ${hipY - 214} Q${-20} ${hipY - 196} ${8} ${hipY - 214}`} fill="none" stroke={TONE.shirt.edge} strokeWidth={fine} opacity={0.6} />
      <FigureHeadSvg view="side" facing={1} cx={head[0]} cy={head[1]} h={228} neckTo={hipY - 500} minContour={w} />
    </G>
  );
}
