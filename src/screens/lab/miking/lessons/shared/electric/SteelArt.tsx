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
  if (view === 'top') return { u0: -90, u1: LEN + 90, v0: -DEPTH / 2 - 60, v1: DEPTH / 2 + 520 };
  return { u0: -80, u1: LAP_STEEL.bodyLen + 60, v0: -260, v1: 330 };
}

/* ── side ── */
function SteelSide({ hi }: { hi: string | null }) {
  const body = rr(0, TOP, LEN, TOP + BH, 10);
  const apron = rr(8, TOP + BH - 26, LEN - 8, TOP + BH, 6);
  const legs = STEEL.legsU.map((u) => rr(u - 13, TOP + BH, u + 13, -18, 6));
  const backLegs = STEEL.legsU.map((u) => rr(u + 18 - 11, TOP + BH, u + 18 + 11, -24, 5));
  const feet = STEEL.legsU.map((u) => rr(u - 20, -18, u + 20, 0, 4));
  const changer = rr(LEN - 60, TOP - 26, LEN + 24, TOP + BH - 10, 8);
  const fingers = make();
  for (let i = 0; i < 10; i++) fingers.addRect(Skia.XYWHRect(LEN - 52 + i * 7.6, TOP - 22, 4, 26));
  const keyhead = rr(-30, TOP - 18, 40, TOP + BH - 20, 8);
  const keys = Array.from({ length: 10 }, (_, i) => ({ u: -20 + i * 6.4, v: TOP - 30 }));
  const knee = STEEL.kneeU.map((u, i) => {
    const p = make();
    const s = i % 2 ? 1 : -1;
    p.moveTo(u, TOP + BH);
    p.lineTo(u, TOP + BH + STEEL_FRAME.kneeDrop.mm);
    p.lineTo(u + s * 34, TOP + BH + STEEL_FRAME.kneeDrop.mm + 6);
    return p;
  });
  const rack = rr(STEEL.pedalsU[0] - 70, -70, STEEL.pedalsU[2] + 70, -44, 6);
  const pedals = STEEL.pedalsU.map((u) => {
    const p = make();
    p.moveTo(u - 26, -46);
    p.lineTo(u + 26, -46);
    p.lineTo(u + 22, -82);
    p.lineTo(u - 22, -82);
    p.close();
    return p;
  });
  const rods = make();
  for (const u of STEEL.pedalsU) {
    rods.moveTo(u, -82);
    rods.lineTo(u + (u - 450) * 0.4, TOP + BH + 8);
  }
  const vol = make();
  vol.moveTo(STEEL.volumeU[0], 0);
  vol.lineTo(STEEL.volumeU[1], 0);
  vol.lineTo(STEEL.volumeU[1], -34);
  vol.lineTo(STEEL.volumeU[0], -66);
  vol.close();
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
  return (
    <Group>
      <Path path={floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={['#202128', '#141519', '#0b0b0e']} />
      </Path>
      <Line p1={vec(-400, 0)} p2={vec(LEN + 400, 0)} color="#4a4c58" strokeWidth={2.5} />
      <Path path={rr(-10, -8, LEN + 30, 10, 8)} color="#000" opacity={0.5}>
        <BlurMask blur={10} style="normal" />
      </Path>
      {backLegs.map((p, i) => (
        <Path key={`bl${i}`} path={p} color="#3b3e46" />
      ))}
      {legs.map((p, i) => (
        <Group key={`l${i}`}>
          <Path path={p}>
            <LinearGradient start={vec(STEEL.legsU[i] - 13, 0)} end={vec(STEEL.legsU[i] + 13, 0)} colors={[...EL.chrome]} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={0.8} color={EL.ink} />
        </Group>
      ))}
      {feet.map((p, i) => (
        <Path key={`f${i}`} path={p} color="#202226" />
      ))}
      {/* Pedal rods, the rack and its pedals, the volume pedal. */}
      <Path path={rods} style="stroke" strokeWidth={5} color="#2a2c32" />
      <Path path={rods} style="stroke" strokeWidth={1.6} color="#c8ccd4" opacity={0.75} />
      <Path path={rack}>
        <LinearGradient start={vec(0, -70)} end={vec(0, -44)} colors={[...EL.chrome]} />
      </Path>
      {pedals.map((p, i) => (
        <Group key={`p${i}`}>
          <Path path={p}>
            <LinearGradient start={vec(0, -82)} end={vec(0, -46)} colors={['#4b4e57', '#26282e', '#121316']} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={0.8} color="#7a7f8a" />
        </Group>
      ))}
      <Path path={vol}>
        <LinearGradient start={vec(STEEL.volumeU[0], -66)} end={vec(STEEL.volumeU[1], 0)} colors={['#3d4048', '#1d1e22', '#0f1012']} />
      </Path>
      <Path path={vol} style="stroke" strokeWidth={1} color="#7a7f8a" />
      {/* Knee levers hanging under the body. */}
      {knee.map((p, i) => (
        <Group key={`k${i}`}>
          <Path path={p} style="stroke" strokeWidth={7} strokeCap="round" strokeJoin="round" color="#2a2c32" />
          <Path path={p} style="stroke" strokeWidth={2.4} strokeCap="round" strokeJoin="round" color="#c8ccd4" />
        </Group>
      ))}
      {/* The body (lacquered wood), its apron, keyhead and changer. */}
      <Path path={body}>
        <LinearGradient start={vec(0, TOP)} end={vec(0, TOP + BH)} colors={['#c98b4a', '#8a5426', '#4a2a10']} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={2.2} color="#f2c9a0" opacity={0.25} />
      <Path path={body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      <Path path={apron} color="#2b1708" opacity={0.6} />
      <Path path={keyhead}>
        <LinearGradient start={vec(-30, TOP - 18)} end={vec(40, TOP + BH)} colors={[...EL.chrome]} />
      </Path>
      {keys.map((k, i) => (
        <Circle key={`kk${i}`} cx={k.u} cy={k.v} r={3.6} color="#d9dce3" />
      ))}
      <Path path={changer}>
        <LinearGradient start={vec(LEN - 60, TOP - 26)} end={vec(LEN + 24, TOP + BH)} colors={[...EL.chrome]} />
      </Path>
      <Path path={changer} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={fingers} color="#5d6068" />
      {hiPath ? <Path path={hiPath} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── top ── */
function SteelTop({ hi, barAt }: { hi: string | null; barAt: number | null }) {
  const body = rr(0, -DEPTH / 2, LEN, DEPTH / 2, 18);
  const board = rr(STEEL.nutU - 6, -78, STEEL.changerU - 30, 78, 6);
  const markers = make();
  for (let n = 1; n <= PEDAL_STEEL.frets; n++) {
    const u = STEEL.nutU + fretU(n, L);
    markers.moveTo(u, -76);
    markers.lineTo(u, 76);
  }
  const dots = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].map((n) => STEEL.nutU + (fretU(n - 1, L) + fretU(n, L)) / 2);
  const strings = make();
  for (let i = 0; i < PEDAL_STEEL.strings; i++) {
    const v = STEEL.stringV(i);
    strings.moveTo(20, v * 0.8);
    strings.lineTo(STEEL.nutU, v);
    strings.lineTo(STEEL.changerU, v);
  }
  const nut = rr(STEEL.nutU - 5, -72, STEEL.nutU + 3, 72, 2);
  const pickup = rr(STEEL.pickupU - 13, -82, STEEL.pickupU + 13, 82, 8);
  const changer = rr(LEN - 60, -96, LEN + 24, 96, 10);
  const keyhead = rr(-30, -92, 40, 92, 10);
  const keys = Array.from({ length: 10 }, (_, i) => ({ u: 4, v: -72 + i * 16 }));
  const bar = barAt == null ? null : rr(barAt - 11, -100, barAt + 11, 100, 11);
  // The near (player's) side: the pedal rack under, the seat, the legs zone.
  const rack = rr(STEEL.pedalsU[0] - 70, DEPTH / 2 + 60, STEEL.pedalsU[2] + 70, DEPTH / 2 + 60 + STEEL_FRAME.pedalRackDepth.mm, 10);
  const pedals = STEEL.pedalsU.map((u) => rr(u - 24, DEPTH / 2 + 80, u + 24, DEPTH / 2 + 240, 8));
  const seat = rr(380, DEPTH / 2 + 300, 600, DEPTH / 2 + 470, 30);
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
        <Path key={`pp${i}`} path={p} color="#2a2c32" opacity={0.9} />
      ))}
      <Path path={seat}>
        <RadialGradient c={vec(450, DEPTH / 2 + 360)} r={180} colors={['#4b3a2c', '#2a2018', '#15100c']} />
      </Path>
      <Path path={rr(10, -DEPTH / 2 + 14, LEN + 20, DEPTH / 2 + 18, 18)} color="#000" opacity={0.5}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={body}>
        <RadialGradient c={vec(LEN * 0.3, -DEPTH * 0.4)} r={LEN * 0.9} colors={['#c98b4a', '#8a5426', '#4a2a10']} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={2.4} color="#f2c9a0" opacity={0.22} />
      <Path path={body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      <Path path={board}>
        <LinearGradient start={vec(0, -78)} end={vec(0, 78)} colors={['#2a2b30', '#16171a', '#0b0b0d']} />
      </Path>
      <Path path={markers} style="stroke" strokeWidth={1.4} color="#d6d9df" opacity={0.75} />
      {dots.map((u, i) => (
        <Circle key={`d${i}`} cx={u} cy={0} r={4} color={EL.inlay} opacity={0.85} />
      ))}
      <Path path={keyhead}>
        <LinearGradient start={vec(-30, -92)} end={vec(40, 92)} colors={[...EL.chrome]} />
      </Path>
      {keys.map((k, i) => (
        <Circle key={`k${i}`} cx={k.u} cy={k.v} r={5} color="#e1e4ea" />
      ))}
      <Path path={nut} color="#efe8d6" />
      <Path path={pickup}>
        <LinearGradient start={vec(0, -82)} end={vec(0, 82)} colors={[...EL.pickup]} />
      </Path>
      <Path path={pickup} style="stroke" strokeWidth={1} color="#5d6068" />
      <Path path={changer}>
        <LinearGradient start={vec(LEN - 60, -96)} end={vec(LEN + 24, 96)} colors={[...EL.chrome]} />
      </Path>
      <Path path={changer} style="stroke" strokeWidth={1} color={EL.ink} />
      <Path path={strings} style="stroke" strokeWidth={1.3} color={EL.string} />
      {bar ? (
        <>
          <Path path={bar}>
            <LinearGradient start={vec((barAt ?? 0) - 11, 0)} end={vec((barAt ?? 0) + 11, 0)} colors={[...EL.chrome]} />
          </Path>
          <Path path={bar} style="stroke" strokeWidth={1} color={EL.ink} />
        </>
      ) : null}
      {hiPath ? <Path path={hiPath} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── lap steel ── */
function LapTop({ hi }: { hi: string | null }) {
  const s = LAP_STEEL;
  const len = s.bodyLen;
  const Ls = s.scale.mm;
  const nutU = 40;
  const brU = nutU + Ls;
  const body = make();
  body.moveTo(0, -55);
  body.cubicTo(len * 0.5, -60, len * 0.62, -s.bodyHalfW - 20, len - 120, -s.bodyHalfW - 20);
  body.cubicTo(len, -s.bodyHalfW - 20, len, s.bodyHalfW + 20, len - 120, s.bodyHalfW + 20);
  body.cubicTo(len * 0.62, s.bodyHalfW + 20, len * 0.5, 60, 0, 55);
  body.close();
  const markers = make();
  for (let n = 1; n <= s.frets; n++) {
    const u = nutU + fretU(n, Ls);
    markers.moveTo(u, -30);
    markers.lineTo(u, 30);
  }
  const strings = make();
  for (let i = 0; i < 6; i++) {
    const v = -24 + i * 9.6;
    strings.moveTo(10, v * 0.8);
    strings.lineTo(brU, v);
  }
  const pu = rr(brU - s.pickups[0].fromBridge - 12, -38, brU - s.pickups[0].fromBridge + 12, 38, 8);
  const bar = rr(nutU + fretU(7, Ls) - 10, -46, nutU + fretU(7, Ls) + 10, 46, 10);
  const knees = [rr(140, 60, 330, 300, 80), rr(380, 60, 570, 300, 80)];
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
      <Path path={body} color="#000" opacity={0.5}>
        <BlurMask blur={12} style="normal" />
      </Path>
      <Path path={body}>
        <RadialGradient c={vec(len * 0.3, -s.bodyHalfW)} r={len * 0.9} colors={[...EL.body]} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={2.4} color={EL.rim} opacity={0.22} />
      <Path path={body} style="stroke" strokeWidth={1.2} color={EL.ink} />
      <Path path={markers} style="stroke" strokeWidth={1.4} color="#d6d9df" opacity={0.7} />
      <Path path={pu}>
        <LinearGradient start={vec(0, -38)} end={vec(0, 38)} colors={[...EL.pickup]} />
      </Path>
      <Path path={rr(brU - 6, -36, brU + 20, 36, 4)}>
        <LinearGradient start={vec(brU, -36)} end={vec(brU + 20, 36)} colors={[...EL.chrome]} />
      </Path>
      {[0, 1].map((i) => (
        <Circle key={`kb${i}`} cx={len - 130 + i * 50} cy={s.bodyHalfW * 0.75} r={12}>
          <RadialGradient c={vec(len - 134 + i * 50, s.bodyHalfW * 0.7)} r={16} colors={['#fbf8f0', '#d8d0bf', '#8f8775']} />
        </Circle>
      ))}
      <Path path={strings} style="stroke" strokeWidth={1.3} color={EL.string} />
      <Path path={bar}>
        <LinearGradient start={vec(0, -46)} end={vec(0, 46)} colors={[...EL.chrome]} />
      </Path>
      {hi === 'ls.body' ? <Path path={body} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

export function SteelDrawing({ view, highlight, barAt = null }: { view: SteelView; highlight?: string | null; barAt?: number | null }) {
  if (view === 'side') return <SteelSide hi={highlight ?? null} />;
  if (view === 'top') return <SteelTop hi={highlight ?? null} barAt={barAt} />;
  return <LapTop hi={highlight ?? null} />;
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
