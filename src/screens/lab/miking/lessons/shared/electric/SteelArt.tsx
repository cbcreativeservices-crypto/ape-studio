/**
 * PEDAL STEEL and LAP STEEL, drawn (Lab 4, C04 — ORIENT and THE SETTING).
 * The research names the pedal steel's parts (necks, pedal rods and pedals,
 * knee levers, pickups, pedal stops; pedal_steel/SOURCES.md SGF-MAP) but
 * gives no dimension: every size is a drawing default (electricSpec.ts
 * STEEL_FRAME, `placeholder: true`).
 *
 *   'side'  the pedal steel on its legs, seen from the player's seat (the
 *           player left out of the drawing): the body, the changer at the
 *           right-hand end, the keyhead at the left, the knee levers hanging
 *           under the body, the pedal rods down to the pedal rack, the volume
 *           pedal on the floor. y down; the floor at y = 0.
 *   'top'   from above: the strings from the keyhead over the nut and the
 *           fretboard markers to the changer, the pickup near the changer,
 *           the bar resting on the strings, and (dashed) the pedal rack and
 *           the player's seat on the near side.
 *   'lap'   a lap steel across the player's knees, from above.
 *
 * Light from the upper left, gradients, rim highlights. Static (D8).
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { LAP_STEEL, PEDAL_STEEL, STEEL_FRAME, fretU } from './electricSpec.ts';
import { EL } from './ElectricArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

export type SteelView = 'side' | 'top' | 'lap';

/* ── the layout (mm) ── */
const LEN = STEEL_FRAME.bodyLen.mm;
const TOP = -STEEL_FRAME.topY.mm;
const BH = STEEL_FRAME.bodyH.mm;
const DEPTH = STEEL_FRAME.bodyDepth.mm;
const L = PEDAL_STEEL.scale.mm;
/** The changer's fingers (the bridge end) and the nut, along u. */
export const STEEL = {
  changerU: LEN - 30,
  nutU: LEN - 30 - L,
  pickupU: LEN - 30 - PEDAL_STEEL.pickups[0].fromBridge,
  pedalsU: [370, 450, 530],
  kneeU: [280, 330, 590, 640],
  volumeU: [640, 780] as const,
  legsU: [70, LEN - 70],
  stringV: (i: number) => -63 + (i * 126) / (PEDAL_STEEL.strings - 1),
};

export function steelBox(view: SteelView) {
  if (view === 'side') return { u0: -90, u1: LEN + 90, v0: TOP - 90, v1: 50 };
  if (view === 'top') return { u0: -90, u1: LEN + 90, v0: -DEPTH / 2 - 60, v1: DEPTH / 2 + 620 };
  return { u0: -80, u1: LAP_STEEL.bodyLen + 60, v0: -260, v1: 330 };
}

/* ── side ──
 * A single-neck ten-string pedal steel seen from the player's seat (the
 * player left out). Sizes: the body STEEL_FRAME 900 long × 90 tall, its top
 * 700 above the floor (drawing defaults; real single-necks run ≈ 850–950 ×
 * 230–260 deep, strings ≈ 700–760 up). Hardware drawn at the class's typical
 * sizes: aluminium end plates 14 thick; four chrome legs Ø25 in leg sockets
 * at the body's corners, a Ø19 extension below a Ø32 clamp collar, rubber
 * tips Ø28 (the far pair hides behind the near pair in this view); the pedal
 * bar Ø25 across the front legs 90 above the floor with three pedals
 * (aluminium, 46 wide, ribbed rubber tread) on it, each pulling a Ø5 rod up
 * to its bellcrank under the body; four knee levers (LKL, LKR at the left
 * knee, RKL, RKR at the right) — each a Ø8 shaft hanging from a bearing block
 * under the body with a padded paddle Ø24 at its foot facing the knee, the
 * lever swinging sideways (along the body) when the knee pushes it; the
 * changer at the right-hand end — ten stacked fingers on one axle (only the
 * nearest is seen), the strings' ball ends behind them; the keyhead at the
 * left with its tuning keys sticking out of the end in two staggered rows;
 * the volume pedal (≈ 250 long × 90 tall treadle) on the floor at the right
 * foot, drawn in profile. */
function SteelSide({ hi }: { hi: string | null }) {
  const BOT = TOP + BH;
  const body = rr(14, TOP, LEN - 14, BOT, 6);
  const top = rr(14, TOP, LEN - 14, TOP + 12, 3);
  const apronLine = make();
  apronLine.moveTo(20, BOT - 30);
  apronLine.lineTo(LEN - 20, BOT - 30);
  const fretboard = rr(STEEL.nutU, TOP - 6, STEEL.changerU - 20, TOP, 1.5);
  const strings = make();
  strings.moveTo(30, TOP - 14);
  strings.lineTo(STEEL.nutU - 7, TOP - 14);
  strings.moveTo(STEEL.nutU - 7, TOP - 9);
  strings.lineTo(STEEL.changerU + 4, TOP - 9);
  // End plates: the keyhead casting (left) and the changer housing (right).
  const keyhead = rr(-30, TOP - 18, 40, BOT - 20, 6);
  const nutRoller = rr(STEEL.nutU - 14, TOP - 18, STEEL.nutU, TOP - 4, 7);
  const keys: SkPath[] = [];
  for (const [v, d] of [[TOP + 4, 0], [TOP + 24, 10], [TOP + 44, 0]] as const) keys.push(rr(-52 - d, v - 6, -30, v + 6, 5));
  const keyShafts = make();
  for (const [v] of [[TOP + 4], [TOP + 24], [TOP + 44]] as const) {
    keyShafts.moveTo(-40, v);
    keyShafts.lineTo(-30, v);
  }
  const changer = rr(LEN - 60, TOP - 26, LEN + 24, BOT - 10, 8);
  // The nearest changer finger in profile: a cam on the axle with two arms
  // (raise and lower), the string riding over its top.
  const cx = STEEL.changerU;
  const cyA = TOP - 6;
  const finger = make();
  finger.moveTo(cx - 14, cyA - 4);
  finger.quadTo(cx - 14, cyA - 18, cx, cyA - 18);
  finger.quadTo(cx + 13, cyA - 18, cx + 14, cyA - 6);
  finger.lineTo(cx + 10, cyA + 34);
  finger.quadTo(cx + 2, cyA + 40, cx - 4, cyA + 34);
  finger.lineTo(cx - 6, cyA + 12);
  finger.lineTo(cx - 20, cyA + 26);
  finger.quadTo(cx - 26, cyA + 22, cx - 22, cyA + 16);
  finger.close();
  const axle = { x: cx, y: cyA };
  const ballEnds = rr(cx + 16, TOP - 18, cx + 26, TOP - 8, 5);
  // Legs (near pair), sockets, collars, extensions and rubber tips.
  const sockets = STEEL.legsU.map((u) => rr(u - 20, BOT - 4, u + 20, BOT + 22, 4));
  const upper = STEEL.legsU.map((u) => rr(u - 12.5, BOT + 22, u + 12.5, -228, 3));
  const collars = STEEL.legsU.map((u) => rr(u - 16, -234, u + 16, -218, 4));
  const lower = STEEL.legsU.map((u) => rr(u - 9.5, -218, u + 9.5, -16, 3));
  const tips = STEEL.legsU.map((u) => rr(u - 14, -18, u + 14, 0, 5));
  // The pedal bar across the front legs, its pedals and the pull rods.
  const bar = rr(STEEL.legsU[0], -100, STEEL.legsU[1], -80, 9);
  const barClamps = STEEL.legsU.map((u) => rr(u - 16, -106, u + 16, -74, 4));
  const pedals = STEEL.pedalsU.map((u) => rr(u - 23, -80, u + 23, -22, 7));
  const treads = make();
  for (const u of STEEL.pedalsU)
    for (let v = -70; v < -28; v += 8) {
      treads.moveTo(u - 17, v);
      treads.lineTo(u + 17, v);
    }
  const hinges = STEEL.pedalsU.map((u) => rr(u - 8, -98, u + 8, -78, 3));
  const rods = make();
  const cranks = make();
  for (const u of STEEL.pedalsU) {
    const ut = u + (u - 450) * 0.08;
    rods.moveTo(u, -96);
    rods.lineTo(ut, BOT + 26);
    cranks.addRRect(Skia.RRectXY(Skia.XYWHRect(ut - 9, BOT + 2, 18, 26), 3, 3));
  }
  // Knee levers: bearing block, shaft, padded paddle facing the knee.
  const KD = STEEL_FRAME.kneeDrop.mm;
  const kBlocks = STEEL.kneeU.map((u) => rr(u - 11, BOT - 2, u + 11, BOT + 16, 3));
  const kShafts = STEEL.kneeU.map((u) => rr(u - 4, BOT + 14, u + 4, BOT + KD - 18, 2));
  const kPads = STEEL.kneeU.map((u) => rr(u - 12, BOT + KD - 30, u + 12, BOT + KD + 4, 8));
  // The volume pedal on the floor, in profile: base, hinged treadle, jack.
  const [v0, v1] = STEEL.volumeU;
  const volBase = rr(v0, -18, v1, 0, 4);
  const volTread = make();
  volTread.moveTo(v0 + 4, -20);
  volTread.lineTo(v0 + 10, -76);
  volTread.quadTo(v0 + 12, -84, v0 + 22, -82);
  volTread.lineTo(v1 - 4, -40);
  volTread.lineTo(v1 - 4, -20);
  volTread.close();
  const volGrip = make();
  for (let i = 0; i < 6; i++) {
    const t = 0.15 + i * 0.13;
    volGrip.moveTo(v0 + 14 + (v1 - v0 - 20) * t, -80 + 40 * t);
    volGrip.lineTo(v0 + 14 + (v1 - v0 - 20) * t + 6, -80 + 40 * t + 3);
  }
  const volJack = rr(v1, -14, v1 + 14, -6, 2);
  const floor = rr(-400, 0, LEN + 400, 60, 0);
  const hiPath = (() => {
    if (!hi) return null;
    switch (hi) {
      case 'ps.changer':
        return rr(LEN - 70, TOP - 36, LEN + 34, TOP + BH, 10);
      case 'ps.keyhead':
        return rr(-40, TOP - 44, 50, TOP + BH - 10, 10);
      case 'ps.knee':
        return rr(STEEL.kneeU[0] - 50, TOP + BH - 4, STEEL.kneeU[3] + 50, TOP + BH + STEEL_FRAME.kneeDrop.mm + 20, 10);
      case 'ps.pedals':
        return rr(STEEL.pedalsU[0] - 80, TOP + BH, STEEL.pedalsU[2] + 80, -36, 10);
      case 'ps.volume':
        return rr(STEEL.volumeU[0] - 12, -80, STEEL.volumeU[1] + 12, 8, 10);
      case 'ps.legs':
        return rr(STEEL.legsU[0] - 26, TOP + BH, STEEL.legsU[1] + 44, 6, 10);
      case 'ps.neck':
        return rr(-6, TOP - 10, LEN + 6, TOP + BH + 8, 10);
      default:
        return null;
    }
  })();
  const chromeV = (u: number, r: number) => <LinearGradient start={vec(u - r, 0)} end={vec(u + r, 0)} colors={['#4a4e57', '#f2f4f8', '#9aa0ab', '#3a3d45']} positions={[0, 0.3, 0.65, 1]} />;
  return (
    <Group>
      <Path path={floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={['#202128', '#141519', '#0b0b0e']} />
      </Path>
      <Line p1={vec(-400, 0)} p2={vec(LEN + 400, 0)} color="#4a4c58" strokeWidth={2.5} />
      <Path path={rr(-10, -8, LEN + 30, 10, 8)} color="#000" opacity={0.5}>
        <BlurMask blur={10} style="normal" />
      </Path>
      {/* Legs: socket, upper tube, clamp collar, extension, rubber tip. */}
      {STEEL.legsU.map((u, i) => (
        <Group key={`l${i}`}>
          <Path path={lower[i]}>{chromeV(u, 9.5)}</Path>
          <Path path={upper[i]}>{chromeV(u, 12.5)}</Path>
          <Path path={upper[i]} style="stroke" strokeWidth={0.8} color={EL.ink} />
          <Path path={lower[i]} style="stroke" strokeWidth={0.8} color={EL.ink} />
          <Path path={collars[i]}>{chromeV(u, 16)}</Path>
          <Path path={collars[i]} style="stroke" strokeWidth={0.8} color={EL.ink} />
          <Path path={tips[i]} color="#141518" />
          <Path path={sockets[i]}>{chromeV(u, 20)}</Path>
          <Path path={sockets[i]} style="stroke" strokeWidth={0.8} color={EL.ink} />
        </Group>
      ))}
      {/* Pull rods and bellcranks; the pedal bar, its clamps and pedals. */}
      <Path path={rods} style="stroke" strokeWidth={6} color="#2a2c32" />
      <Path path={rods} style="stroke" strokeWidth={3} color="#c8ccd4" opacity={0.85} />
      <Path path={cranks} color="#5d616c" />
      <Path path={bar}>
        <LinearGradient start={vec(0, -100)} end={vec(0, -80)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={bar} style="stroke" strokeWidth={0.8} color={EL.ink} />
      {barClamps.map((p, i) => (
        <Path key={`bc${i}`} path={p} color="#2a2c32" />
      ))}
      {hinges.map((p, i) => (
        <Path key={`h${i}`} path={p} color="#5d616c" />
      ))}
      {pedals.map((p, i) => (
        <Group key={`p${i}`}>
          <Path path={p}>
            <LinearGradient start={vec(0, -80)} end={vec(0, -22)} colors={['#c8ccd4', '#7c818c', '#3a3d45']} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={0.8} color={EL.ink} />
        </Group>
      ))}
      <Path path={treads} style="stroke" strokeWidth={3} strokeCap="round" color="#141518" opacity={0.85} />
      {/* The volume pedal. */}
      <Path path={volBase} color="#1d1e22" />
      <Path path={volTread}>
        <LinearGradient start={vec(v0, -84)} end={vec(v1, 0)} colors={['#4a4e57', '#24262c', '#101114']} />
      </Path>
      <Path path={volTread} style="stroke" strokeWidth={1} color="#7a7f8a" />
      <Path path={volGrip} style="stroke" strokeWidth={2.4} strokeCap="round" color="#08080a" />
      <Path path={volJack} color="#9aa0ab" />
      {/* Knee levers. */}
      {STEEL.kneeU.map((u, i) => (
        <Group key={`k${i}`}>
          <Path path={kShafts[i]}>{chromeV(u, 4)}</Path>
          <Path path={kBlocks[i]} color="#2a2c32" />
          <Path path={kPads[i]}>
            <RadialGradient c={vec(u - 4, BOT + KD - 22)} r={26} colors={['#5a5d66', '#26282e', '#0b0b0d']} />
          </Path>
          <Path path={kPads[i]} style="stroke" strokeWidth={1.4} color="#c8ccd4" opacity={0.7} />
        </Group>
      ))}
      {/* The body (lacquered), its top edge and apron line; fretboard and strings. */}
      <Path path={body}>
        <LinearGradient start={vec(0, TOP)} end={vec(0, BOT)} colors={['#c98b4a', '#8a5426', '#4a2a10']} />
      </Path>
      <Path path={top}>
        <LinearGradient start={vec(0, TOP)} end={vec(0, TOP + 12)} colors={['#e2b679', '#c98b4a']} />
      </Path>
      <Path path={apronLine} style="stroke" strokeWidth={1.2} color="#2b1708" opacity={0.45} />
      <Path path={body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      <Path path={fretboard} color="#16171a" />
      <Path path={fretboard} style="stroke" strokeWidth={0.6} color="#9aa0ab" opacity={0.6} />
      {/* Keyhead (left): the casting, nut roller and the tuning keys out of its end. */}
      <Path path={keyShafts} style="stroke" strokeWidth={4} color="#9aa0ab" />
      {keys.map((p, i) => (
        <Group key={`kk${i}`}>
          <Path path={p}>
            <LinearGradient start={vec(0, TOP - 4)} end={vec(0, TOP + 52)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={0.8} color={EL.ink} />
        </Group>
      ))}
      <Path path={keyhead}>
        <LinearGradient start={vec(-30, TOP - 18)} end={vec(40, TOP + BH)} colors={[...EL.chrome]} />
      </Path>
      <Path path={keyhead} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={nutRoller}>
        <LinearGradient start={vec(0, TOP - 18)} end={vec(0, TOP - 4)} colors={['#f2f4f8', '#7c818c']} />
      </Path>
      {/* Changer (right): the housing, the nearest finger on its axle. */}
      <Path path={changer}>
        <LinearGradient start={vec(LEN - 60, TOP - 26)} end={vec(LEN + 24, TOP + BH)} colors={[...EL.chrome]} />
      </Path>
      <Path path={changer} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={finger}>
        <LinearGradient start={vec(cx - 20, cyA - 18)} end={vec(cx + 14, cyA + 40)} colors={['#e3e6ec', '#8a8f99', '#4a4e57']} />
      </Path>
      <Path path={finger} style="stroke" strokeWidth={0.9} color={EL.ink} />
      <Circle cx={axle.x} cy={axle.y} r={5} color="#2a2c32" />
      <Circle cx={axle.x} cy={axle.y} r={5} style="stroke" strokeWidth={1} color="#c8ccd4" />
      <Path path={ballEnds} color="#b9a98a" />
      <Path path={strings} style="stroke" strokeWidth={1.6} color={EL.string} />
      {hiPath ? <Path path={hiPath} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── top ──
 * From above: the fretboard plate (fret lines at their true places on the
 * 24 in scale, position markers), ten strings from the changer fingers over
 * the nut roller to the keyhead's string posts, the tuning keys out of the
 * keyhead's end, the pickup (a ten-pole single coil) near the changer, the
 * tone bar (Ø22 × 90 chrome) resting across the strings. The near side:
 * the pedal bar and pedals (dashed: under the body's edge), and the player's
 * seat (a steel player's seat case ≈ 440 × 300). */
/** The pedal steel itself from above (no seat or pedals): also drawn in the
 *  backline plan. Local frame as SteelTop. */
/** A 180° turn (owner 2026-10-10: a face-on necked instrument reads body
 *  left, head right, as the audience sees it) also turns the light: these
 *  put the lit end of a gradient and the drop shadow back where the light
 *  comes from on SCREEN (upper left) when the drawing sits inside the turn. */
const lin = (turned: boolean, a: ReturnType<typeof vec>, b: ReturnType<typeof vec>) => (turned ? { start: b, end: a } : { start: a, end: b });
const about = (turned: boolean, c: { u: number; v: number }, mid: { u: number; v: number }) => (turned ? vec(2 * mid.u - c.u, 2 * mid.v - c.v) : vec(c.u, c.v));

export function SteelBodyTop({ barAt = null, turned = false }: { barAt?: number | null; turned?: boolean }) {
  const body = rr(0, -DEPTH / 2, LEN, DEPTH / 2, 14);
  const board = rr(STEEL.nutU - 6, -78, STEEL.changerU - 30, 78, 4);
  const markers = make();
  for (let n = 1; n <= PEDAL_STEEL.frets; n++) {
    const u = STEEL.nutU + fretU(n, L);
    markers.moveTo(u, -76);
    markers.lineTo(u, 76);
  }
  const dots = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].map((n) => ({ u: STEEL.nutU + (fretU(n - 1, L) + fretU(n, L)) / 2, dbl: n === 12 || n === 24 }));
  const posts = Array.from({ length: PEDAL_STEEL.strings }, (_, i) => ({ u: -6 + (i % 2) * 18, v: STEEL.stringV(i) * 0.8 }));
  const strings = make();
  for (let i = 0; i < PEDAL_STEEL.strings; i++) {
    const v = STEEL.stringV(i);
    strings.moveTo(posts[i].u, posts[i].v);
    strings.lineTo(STEEL.nutU, v);
    strings.lineTo(STEEL.changerU, v);
  }
  const nut = rr(STEEL.nutU - 7, -74, STEEL.nutU + 3, 74, 5);
  const pickup = rr(STEEL.pickupU - 13, -82, STEEL.pickupU + 13, 82, 6);
  const poles = Array.from({ length: PEDAL_STEEL.strings }, (_, i) => STEEL.stringV(i));
  const changer = rr(LEN - 60, -96, LEN + 24, 96, 10);
  const fingers = make();
  for (let i = 0; i < PEDAL_STEEL.strings; i++) fingers.addRRect(Skia.RRectXY(Skia.XYWHRect(STEEL.changerU - 12, STEEL.stringV(i) - 4.5, 24, 9), 3, 3));
  const keyhead = rr(-30, -92, 40, 92, 10);
  const keys = Array.from({ length: PEDAL_STEEL.strings }, (_, i) => ({ u: -44 - (i % 2) * 12, v: -76 + i * 17 }));
  const bar = barAt == null ? null : rr(barAt - 11, -100, barAt + 11, 100, 11);
  // The near (player's) side: the pedal bar and pedals under, the seat, the legs zone.
  return (
    <Group>
      <Path path={turned ? rr(-20, -DEPTH / 2 - 18, LEN - 10, DEPTH / 2 - 14, 18) : rr(10, -DEPTH / 2 + 14, LEN + 20, DEPTH / 2 + 18, 18)} color="#000" opacity={0.5}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={body}>
        <RadialGradient c={about(turned, { u: LEN * 0.3, v: -DEPTH * 0.4 }, { u: LEN / 2, v: 0 })} r={LEN * 0.9} colors={['#c98b4a', '#8a5426', '#4a2a10']} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={2.4} color="#f2c9a0" opacity={0.18} />
      <Path path={body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      <Path path={board}>
        <LinearGradient {...lin(turned, vec(0, -78), vec(0, 78))} colors={['#2a2b30', '#16171a', '#0b0b0d']} />
      </Path>
      <Path path={markers} style="stroke" strokeWidth={1.4} color="#d6d9df" opacity={0.75} />
      {dots.map((d, i) =>
        d.dbl ? (
          <Group key={`d${i}`}>
            <Circle cx={d.u} cy={-22} r={4} color={EL.inlay} opacity={0.85} />
            <Circle cx={d.u} cy={22} r={4} color={EL.inlay} opacity={0.85} />
          </Group>
        ) : (
          <Circle key={`d${i}`} cx={d.u} cy={0} r={4} color={EL.inlay} opacity={0.85} />
        ),
      )}
      {/* Keyhead: the casting, its string posts, the keys out of its end. */}
      {keys.map((k, i) => (
        <Group key={`k${i}`}>
          <Line p1={vec(k.u + 6, k.v)} p2={vec(-30, k.v)} color="#9aa0ab" strokeWidth={3} />
          <Path path={rr(k.u - 8, k.v - 6, k.u + 6, k.v + 6, 4)}>
            <LinearGradient {...lin(turned, vec(k.u - 8, k.v - 6), vec(k.u + 6, k.v + 6))} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
          </Path>
        </Group>
      ))}
      <Path path={keyhead}>
        <LinearGradient {...lin(turned, vec(-30, -92), vec(40, 92))} colors={[...EL.chrome]} />
      </Path>
      <Path path={keyhead} style="stroke" strokeWidth={1} color={EL.ink} />
      {posts.map((p, i) => (
        <Circle key={`po${i}`} cx={p.u} cy={p.v} r={4} color="#2a2c32" />
      ))}
      <Path path={nut}>
        <LinearGradient {...lin(turned, vec(0, -74), vec(0, 74))} colors={['#f2f4f8', '#9aa0ab', '#5d616c']} />
      </Path>
      <Path path={pickup}>
        <LinearGradient {...lin(turned, vec(0, -82), vec(0, 82))} colors={[...EL.pickup]} />
      </Path>
      <Path path={pickup} style="stroke" strokeWidth={1} color="#5d616c" />
      {poles.map((v, i) => (
        <Circle key={`pl${i}`} cx={STEEL.pickupU} cy={v} r={2.6} color="#9aa0ab" />
      ))}
      <Path path={changer}>
        <LinearGradient {...lin(turned, vec(LEN - 60, -96), vec(LEN + 24, 96))} colors={[...EL.chrome]} />
      </Path>
      <Path path={changer} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={fingers} color="#5d616c" />
      <Path path={fingers} style="stroke" strokeWidth={0.6} color={EL.ink} />
      <Path path={strings} style="stroke" strokeWidth={1.3} color={EL.string} />
      {bar ? (
        <>
          <Path path={turned ? rr((barAt ?? 0) - 15, -104, (barAt ?? 0) + 9, 96, 12) : rr((barAt ?? 0) - 9, -96, (barAt ?? 0) + 15, 104, 12)} color="#000" opacity={0.35}>
            <BlurMask blur={5} style="normal" />
          </Path>
          <Path path={bar}>
            <LinearGradient {...lin(turned, vec((barAt ?? 0) - 11, 0), vec((barAt ?? 0) + 11, 0))} colors={['#4a4e57', '#f2f4f8', '#9aa0ab', '#3a3d45']} positions={[0, 0.3, 0.65, 1]} />
          </Path>
          <Path path={bar} style="stroke" strokeWidth={1} color={EL.ink} />
        </>
      ) : null}
    </Group>
  );
}

function SteelTop({ hi, barAt, turned = false }: { hi: string | null; barAt: number | null; turned?: boolean }) {
  const rack = rr(STEEL.legsU[0], DEPTH / 2 + 60, STEEL.legsU[1], DEPTH / 2 + 84, 12);
  const pedals = STEEL.pedalsU.map((u) => rr(u - 23, DEPTH / 2 + 84, u + 23, DEPTH / 2 + 240, 8));
  const seat = rr(270, DEPTH / 2 + 300, 710, DEPTH / 2 + 600, 40);
  const seatSeam = rr(290, DEPTH / 2 + 320, 690, DEPTH / 2 + 580, 30);
  const zone = rr(450 - STEEL_FRAME.legsZone.w.mm / 2, DEPTH / 2, 450 + STEEL_FRAME.legsZone.w.mm / 2, DEPTH / 2 + STEEL_FRAME.legsZone.d.mm - 120, 30);
  const hiPath = (() => {
    switch (hi) {
      case 'ps.neck':
        return rr(STEEL.nutU - 14, -88, STEEL.changerU - 20, 88, 10);
      case 'ps.changer':
        return rr(LEN - 70, -106, LEN + 34, 106, 12);
      case 'ps.keyhead':
        return rr(-40, -102, 50, 102, 12);
      case 'ps.pickup':
        return rr(STEEL.pickupU - 22, -92, STEEL.pickupU + 22, 92, 10);
      case 'ps.bar':
        return barAt == null ? null : rr(barAt - 22, -112, barAt + 22, 112, 14);
      case 'ps.pedals':
        return rr(STEEL.pedalsU[0] - 80, DEPTH / 2 + 50, STEEL.pedalsU[2] + 80, DEPTH / 2 + 270, 12);
      default:
        return null;
    }
  })();
  return (
    <Group>
      <Path path={zone} color={GREY} opacity={0.08} />
      <Path path={zone} style="stroke" strokeWidth={3} color={GREY} opacity={0.6}>
        <DashPathEffect intervals={[18, 12]} />
      </Path>
      <Path path={rack} style="stroke" strokeWidth={2} color="#9aa0ab" opacity={0.6}>
        <DashPathEffect intervals={[10, 8]} />
      </Path>
      {pedals.map((p, i) => (
        <Group key={`pp${i}`}>
          <Path path={p} color="#3a3d45" opacity={0.9} />
          <Path path={p} style="stroke" strokeWidth={1.4} color="#9aa0ab" opacity={0.5} />
        </Group>
      ))}
      <Path path={seat}>
        <RadialGradient c={about(turned, { u: 420, v: DEPTH / 2 + 380 }, { u: 490, v: DEPTH / 2 + 450 })} r={320} colors={['#4b3a2c', '#2a2018', '#15100c']} />
      </Path>
      <Path path={seatSeam} style="stroke" strokeWidth={2} color="#6b5440" opacity={0.6}>
        <DashPathEffect intervals={[8, 6]} />
      </Path>
      <SteelBodyTop barAt={barAt} turned={turned} />
      {hiPath ? <Path path={hiPath} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── lap steel ──
 * A six-string lap steel across the player's knees, from above: LAP_STEEL
 * body 700 × 150, 22.5 in scale (drawing defaults; the class runs ≈ 700–800
 * long). A solid body with a narrower head end: 3 + 3 tuners (keys out to
 * the sides), a bone nut, a fretboard plate with fret lines and markers, a
 * single-coil pickup with six poles, a through-body bridge/tailpiece, volume
 * and tone knobs Ø24 on the near side, the bar resting at the 7th fret. */
function LapTop({ hi, turned = false }: { hi: string | null; turned?: boolean }) {
  const s = LAP_STEEL;
  const len = s.bodyLen;
  const Ls = s.scale.mm;
  const W = s.bodyHalfW;
  const nutU = 40;
  const brU = nutU + Ls;
  const body = make();
  body.moveTo(-30, -48);
  body.lineTo(nutU - 6, -48);
  body.cubicTo(nutU + 30, -48, nutU + 50, -W, nutU + 110, -W);
  body.lineTo(len - 40, -W);
  body.quadTo(len, -W, len, -W + 40);
  body.lineTo(len, W - 40);
  body.quadTo(len, W, len - 40, W);
  body.lineTo(nutU + 110, W);
  body.cubicTo(nutU + 50, W, nutU + 30, 48, nutU - 6, 48);
  body.lineTo(-30, 48);
  body.quadTo(-44, 48, -44, 34);
  body.lineTo(-44, -34);
  body.quadTo(-44, -48, -30, -48);
  body.close();
  const board = rr(nutU, -34, brU - 70, 34, 3);
  const markers = make();
  for (let n = 1; n <= s.frets; n++) {
    const u = nutU + fretU(n, Ls);
    if (u > brU - 72) break;
    markers.moveTo(u, -32);
    markers.lineTo(u, 32);
  }
  const dots = [3, 5, 7, 9, 12, 15, 17].map((n) => nutU + (fretU(n - 1, Ls) + fretU(n, Ls)) / 2).filter((u) => u < brU - 72);
  const tuners = [0, 1, 2].flatMap((i) => [
    { u: -26 + i * 22, v: -48, side: -1 },
    { u: -26 + i * 22, v: 48, side: 1 },
  ]);
  const strings = make();
  for (let i = 0; i < 6; i++) {
    const v = -22 + i * 8.8;
    const t = tuners[i < 3 ? i * 2 : (i - 3) * 2 + 1];
    strings.moveTo(t.u, t.side * 30);
    strings.lineTo(nutU, v);
    strings.lineTo(brU + 18, v);
  }
  const nut = rr(nutU - 5, -30, nutU + 2, 30, 2);
  const puU = brU - s.pickups[0].fromBridge;
  const pu = rr(puU - 14, -38, puU + 14, 38, 8);
  const bridge = rr(brU - 6, -34, brU + 24, 34, 4);
  const knobs = [{ u: len - 100, v: W * 0.75 }, { u: len - 42, v: W * 0.75 }];
  const bar = rr(nutU + fretU(7, Ls) - 11, -46, nutU + fretU(7, Ls) + 11, 46, 11);
  // The thighs run under the instrument from the player (+v) to the knees
  // beyond it (−v): it lies ACROSS them.
  const knees = [rr(140, -150, 320, 300, 85), rr(390, -150, 570, 300, 85)];
  return (
    <Group>
      {knees.map((k, i) => (
        <Path key={`kn${i}`} path={k} color={GREY} opacity={0.12} />
      ))}
      {knees.map((k, i) => (
        <Path key={`ko${i}`} path={k} style="stroke" strokeWidth={2.5} color={GREY} opacity={0.55}>
          <DashPathEffect intervals={[14, 10]} />
        </Path>
      ))}
      <Group transform={[{ translateX: turned ? -10 : 10 }, { translateY: turned ? -14 : 14 }]}>
        <Path path={body} color="#000" opacity={0.5}>
          <BlurMask blur={12} style="normal" />
        </Path>
      </Group>
      {/* Tuners: the keys stand out to the sides of the head. */}
      {tuners.map((t, i) => (
        <Group key={`t${i}`}>
          <Line p1={vec(t.u, t.v)} p2={vec(t.u, t.v + t.side * 16)} color="#9aa0ab" strokeWidth={3} />
          <Path path={rr(t.u - 7, t.v + t.side * 14 - 6, t.u + 7, t.v + t.side * 14 + 8, 4)}>
            <LinearGradient {...lin(turned, vec(t.u - 7, 0), vec(t.u + 7, 0))} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
          </Path>
        </Group>
      ))}
      <Path path={body}>
        <RadialGradient c={about(turned, { u: len * 0.3, v: -W }, { u: (len - 44) / 2, v: 0 })} r={len * 0.9} colors={[...EL.body]} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={2.4} color={EL.rim} opacity={0.22} />
      <Path path={body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      {tuners.map((t, i) => (
        <Circle key={`tp${i}`} cx={t.u} cy={t.side * 30} r={4.5} color="#c8ccd4" />
      ))}
      <Path path={board}>
        <LinearGradient {...lin(turned, vec(0, -34), vec(0, 34))} colors={['#2a2b30', '#16171a', '#0b0b0d']} />
      </Path>
      <Path path={markers} style="stroke" strokeWidth={1.4} color="#d6d9df" opacity={0.7} />
      {dots.map((u, i) => (
        <Circle key={`d${i}`} cx={u} cy={0} r={3.4} color={EL.inlay} opacity={0.85} />
      ))}
      <Path path={nut} color="#efe8d6" />
      <Path path={pu}>
        <LinearGradient {...lin(turned, vec(0, -38), vec(0, 38))} colors={[...EL.pickup]} />
      </Path>
      {Array.from({ length: 6 }, (_, i) => (
        <Circle key={`pp${i}`} cx={puU} cy={-22 + i * 8.8} r={2.4} color="#9aa0ab" />
      ))}
      <Path path={bridge}>
        <LinearGradient {...lin(turned, vec(brU, -34), vec(brU + 24, 34))} colors={[...EL.chrome]} />
      </Path>
      <Path path={bridge} style="stroke" strokeWidth={0.8} color={EL.ink} />
      {knobs.map((k, i) => (
        <Group key={`kb${i}`}>
          <Circle cx={k.u + (turned ? -2 : 2)} cy={k.v + (turned ? -3 : 3)} r={12} color="#000" opacity={0.35} />
          <Circle cx={k.u} cy={k.v} r={12}>
            <RadialGradient c={about(turned, { u: k.u - 4, v: k.v - 5 }, k)} r={16} colors={['#fbf8f0', '#d8d0bf', '#8f8775']} />
          </Circle>
          <Line p1={vec(k.u, k.v)} p2={vec(k.u - 4, k.v - 9)} color="#2a2420" strokeWidth={1.6} />
        </Group>
      ))}
      <Path path={strings} style="stroke" strokeWidth={1.3} color={EL.string} />
      <Path path={turned ? rr(nutU + fretU(7, Ls) - 15, -50, nutU + fretU(7, Ls) + 9, 42, 12) : rr(nutU + fretU(7, Ls) - 9, -42, nutU + fretU(7, Ls) + 15, 50, 12)} color="#000" opacity={0.35}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={bar}>
        <LinearGradient {...lin(turned, vec(nutU + fretU(7, Ls) - 11, 0), vec(nutU + fretU(7, Ls) + 11, 0))} colors={['#4a4e57', '#f2f4f8', '#9aa0ab', '#3a3d45']} positions={[0, 0.3, 0.65, 1]} />
      </Path>
      <Path path={bar} style="stroke" strokeWidth={0.8} color={EL.ink} />
      {hi === 'ls.body' ? <Path path={body} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/** `turned`: drawn inside a 180° turn (the face views, body left, head
 *  right — ElectricExplorer); the light still falls from the upper left. */
export function SteelDrawing({ view, highlight, barAt = null, turned = false }: { view: SteelView; highlight?: string | null; barAt?: number | null; turned?: boolean }) {
  if (view === 'side') return <SteelSide hi={highlight ?? null} />;
  if (view === 'top') return <SteelTop hi={highlight ?? null} barAt={barAt} turned={turned} />;
  return <LapTop hi={highlight ?? null} turned={turned} />;
}

/** The part under (u, v) in a view, tol in mm. */
export function steelHit(view: SteelView, u: number, v: number, tol: number): string | null {
  if (view === 'lap') return u >= -20 && u <= LAP_STEEL.bodyLen && Math.abs(v) <= LAP_STEEL.bodyHalfW + 30 ? 'ls.body' : null;
  if (view === 'side') {
    if (u >= LEN - 70 - tol && u <= LEN + 34 && v >= TOP - 40 && v <= TOP + BH) return 'ps.changer';
    if (u >= -40 - tol && u <= 50 && v >= TOP - 44 && v <= TOP + BH) return 'ps.keyhead';
    if (v >= TOP && v <= TOP + BH + 4) return 'ps.neck';
    if (v > TOP + BH && v <= TOP + BH + STEEL_FRAME.kneeDrop.mm + 30 && u >= STEEL.kneeU[0] - 60 && u <= STEEL.kneeU[3] + 60) return 'ps.knee';
    if (u >= STEEL.volumeU[0] - tol && u <= STEEL.volumeU[1] + tol && v >= -80) return 'ps.volume';
    if (u >= STEEL.pedalsU[0] - 80 && u <= STEEL.pedalsU[2] + 80 && v > TOP + BH) return 'ps.pedals';
    if (STEEL.legsU.some((x) => Math.abs(u - x) <= 30 + tol)) return 'ps.legs';
    return null;
  }
  if (Math.abs(u - STEEL.pickupU) <= 18 + tol * 0.4 && Math.abs(v) <= 90) return 'ps.pickup';
  if (u >= LEN - 70 && u <= LEN + 34 && Math.abs(v) <= 106) return 'ps.changer';
  if (u >= -40 && u <= 50 && Math.abs(v) <= 102) return 'ps.keyhead';
  if (v > DEPTH / 2 + 40 && u >= STEEL.pedalsU[0] - 80 && u <= STEEL.pedalsU[2] + 80 && v <= DEPTH / 2 + 280) return 'ps.pedals';
  if (Math.abs(u - (STEEL.nutU + 260)) <= 16 + tol * 0.4 && Math.abs(v) <= 100) return 'ps.bar';
  if (Math.abs(v) <= 90 && u >= STEEL.nutU - 10 && u <= STEEL.changerU) return 'ps.neck';
  return null;
}
