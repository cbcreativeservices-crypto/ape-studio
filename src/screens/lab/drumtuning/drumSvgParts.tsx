/**
 * Drum Tuning Lab — the shared DRUM PARTS the rack-glass stages are built
 * from (react-native-svg, the lab's existing renderer; Skia stays in the
 * Miking labs). Every part is drawn from real dimensions in MILLIMETRES and
 * placed with a scale `k` (design units per mm), so a stage that draws a
 * 12 in tom and its hardware keeps the hardware in true proportion.
 *
 * REAL DIMENSIONS (typical modern kit hardware; drawing reference only —
 * nothing here is shown to the learner):
 *   shells         12 × 8 in tom (304.8 × 203.2), 16 × 16 in floor tom,
 *                  14 × 5.5 in snare (355.6 × 139.7), 22 × 16 in bass drum
 *                  (558.8 × 406.4); 6-ply maple 5.6 mm, 8-ply kick 7 mm,
 *                  steel snare shell 1.0 mm with a centre bead
 *   bearing edge   45° inner cut, peak ≈ 30 % of the wall in from the outside,
 *                  small outer round-over
 *   head           film on the edge peak; collar ≈ 13 mm down the outside to
 *                  an aluminium flesh hoop ≈ 4 × 8 mm
 *   triple-flange  2.3 mm steel; wall ≈ 3 mm off the shell; top lip rolled
 *   hoop           outward ≈ 6 mm, ≈ 10 mm above the head; the wall stands on
 *                  the flesh hoop ≈ 13 mm below the head; bottom flange turned
 *                  outward into an ear at every rod (rod axis ≈ 15 mm off the
 *                  shell)
 *   tension rod    7/32 in thread (5.5 mm); 1/4 in square head (6.4 mm) on a
 *                  12 mm washer
 *   lug            two-piece casing ≈ 16 wide × 28 tall, standing ≈ 22 mm off
 *                  the shell on a gasket, one mounting screw through the shell
 *   kick hoop      wood, 25 mm wide × 8 mm thick; claw hooks + T-rods
 *   stick          16 in × 0.58 in hickory (406 × 14.7), taper over the last
 *                  ≈ 60 mm to an 8 mm tip bead
 *
 * Light from the upper left; gradients for form, a rim highlight, a stroke
 * hierarchy (cut faces 0.8, edges 0.6, detail 0.4 units). No brand marks.
 * Ids are prefixed `dt` so a page with several stages shares identical defs.
 */
import type { ReactNode } from 'react';
import { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/* ── real hardware dimensions (mm) ── */
export const HW = {
  hoopGap: 3,
  hoopT: 2.3,
  hoopUp: 10.4,
  hoopLip: 9.4,
  hoopSeat: 13,
  flangeV: 10.7,
  earOut: 20,
  fleshIn: 0.4,
  fleshOut: 4.6,
  fleshH: 8,
  rodU: 15,
  rodD: 5.5,
  rodHead: 6.4,
  washerD: 12,
  lugOut: 22,
  lugW: 16,
  lugTop: 22,
  lugLen: 28,
  stickD: 14.7,
  beadD: 8,
} as const;

const CHROME_STOPS: [number, string][] = [[0, '#2f3238'], [0.16, '#9aa0ab'], [0.3, '#f4f6fa'], [0.5, '#b4b9c3'], [0.78, '#4a4e57'], [1, '#24262b']];
const WOOD_STOPS: [number, string][] = [[0, '#2b170a'], [0.1, '#6e4219'], [0.3, '#c48f52'], [0.4, '#e2b679'], [0.68, '#9c6631'], [1, '#2f1b0a']];

function stops(s: [number, string][]) {
  return s.map(([o, c]) => <Stop key={o} offset={String(o)} stopColor={c} />);
}

/** Every gradient the parts use; render ONCE inside each stage's <Svg>. */
export function DrumSvgDefs() {
  return (
    <Defs>
      <LinearGradient id="dtWood" x1="0" y1="0" x2="1" y2="0">{stops(WOOD_STOPS)}</LinearGradient>
      <LinearGradient id="dtWoodV" x1="0" y1="0" x2="0" y2="1">{stops(WOOD_STOPS)}</LinearGradient>
      <LinearGradient id="dtChrome" x1="0" y1="0" x2="1" y2="0">{stops(CHROME_STOPS)}</LinearGradient>
      <LinearGradient id="dtChromeV" x1="0" y1="0" x2="0" y2="1">{stops(CHROME_STOPS)}</LinearGradient>
      <LinearGradient id="dtSteel" x1="0" y1="0" x2="1" y2="0">
        {stops([[0, '#3a3d44'], [0.14, '#8d939e'], [0.3, '#e9ecf1'], [0.46, '#aab0ba'], [0.7, '#6d727c'], [1, '#2c2e33']])}
      </LinearGradient>
      <LinearGradient id="dtCavity" x1="0" y1="0" x2="0" y2="1">
        {stops([[0, '#070605'], [0.14, '#22170e'], [0.5, '#35261a'], [0.86, '#20150d'], [1, '#060504']])}
      </LinearGradient>
      <LinearGradient id="dtCavityX" x1="0" y1="0" x2="1" y2="0">
        {stops([[0, '#070605'], [0.12, '#22170e'], [0.5, '#35261a'], [0.88, '#20150d'], [1, '#060504']])}
      </LinearGradient>
      <LinearGradient id="dtCavitySteel" x1="0" y1="0" x2="1" y2="0">
        {stops([[0, '#08090b'], [0.14, '#2a2d33'], [0.5, '#4a4e57'], [0.86, '#2a2d33'], [1, '#08090b']])}
      </LinearGradient>
      <LinearGradient id="dtPly" x1="0" y1="0" x2="1" y2="0">
        {stops([[0, '#4a2a12'], [0.2, '#b98548'], [0.45, '#d9a766'], [0.7, '#9c6631'], [1, '#5c3417']])}
      </LinearGradient>
      <LinearGradient id="dtPlyV" x1="0" y1="0" x2="0" y2="1">
        {stops([[0, '#4a2a12'], [0.2, '#b98548'], [0.45, '#d9a766'], [0.7, '#9c6631'], [1, '#5c3417']])}
      </LinearGradient>
      <LinearGradient id="dtStick" x1="0" y1="0" x2="0" y2="1">
        {stops([[0, '#f6e2b8'], [0.35, '#dcb57a'], [0.75, '#a87b42'], [1, '#6e4a22']])}
      </LinearGradient>
      <LinearGradient id="dtFoot" x1="0" y1="0" x2="1" y2="1">
        {stops([[0, '#7c818c'], [0.5, '#3a3d45'], [1, '#1c1d22']])}
      </LinearGradient>
      <LinearGradient id="dtPillow" x1="0" y1="0" x2="0" y2="1">
        {stops([[0, '#f1ece0'], [0.55, '#d8d0bf'], [1, '#a9a08c']])}
      </LinearGradient>
      <RadialGradient id="dtFelt" cx="0.35" cy="0.3" r="0.8">
        {stops([[0, '#fbf8f0'], [0.6, '#ddd5c3'], [1, '#a59c87']])}
      </RadialGradient>
      <RadialGradient id="dtBead" cx="0.35" cy="0.3" r="0.8">
        {stops([[0, '#fff2d6'], [0.6, '#d9b277'], [1, '#8a5e2e']])}
      </RadialGradient>
    </Defs>
  );
}

/* ── a placement: shell's outer surface at xShell, a head plane at yHead ── */
export type Side = -1 | 1;
/** `side` −1 = the left silhouette (outward = −x), +1 = the right.
 *  `s` +1 = the TOP head (into the drum = +y), −1 = the BOTTOM head. */
type Place = { xShell: number; yHead: number; side: Side; s: 1 | -1; k: number };
const P = (pl: Place) => ({
  X: (u: number) => pl.xShell + pl.side * u * pl.k,
  Y: (v: number) => pl.yHead + pl.s * v * pl.k,
});
function poly(pl: Place, pts: [number, number][]): string {
  const { X, Y } = P(pl);
  return pts.map(([u, v], i) => `${i ? 'L' : 'M'}${X(u).toFixed(2)} ${Y(v).toFixed(2)}`).join(' ') + ' Z';
}

/** A triple-flange hoop CUT at one silhouette: the rolled top lip, the wall
 *  standing on the flesh hoop, the bottom flange turned out into an ear. */
export function HoopCut({ pl, ear = true, fill = '#c9cdd5', stroke = '#3c3f46' }: { pl: Place; ear?: boolean; fill?: string; stroke?: string }) {
  const a = HW.hoopGap;
  const b = a + HW.hoopT;
  const F = ear ? HW.earOut + 1 : b + 3.4;
  const d = poly(pl, [
    [a, HW.hoopSeat], [a, -HW.hoopUp + 1.2], [a + 0.6, -HW.hoopUp], [HW.hoopLip - 0.6, -HW.hoopUp], [HW.hoopLip, -HW.hoopUp + 0.6],
    [HW.hoopLip, -HW.hoopUp + 1.8], [HW.hoopLip - 0.6, -HW.hoopUp + 2.3], [b, -HW.hoopUp + 2.3], [b, HW.flangeV], [F, HW.flangeV],
    [F + 0.6, HW.flangeV + 0.6], [F + 0.6, HW.hoopSeat - 0.6], [F, HW.hoopSeat],
  ]);
  return <Path d={d} fill={fill} stroke={stroke} strokeWidth={0.5} strokeLinejoin="round" />;
}

/** The far half of a hoop seen edge-on above the head, across the drum. */
export function HoopFar({ x0, x1, yHead, s, k, fill = 'url(#dtChrome)' }: { x0: number; x1: number; yHead: number; s: 1 | -1; k: number; fill?: string }) {
  const yA = yHead - s * HW.hoopUp * k;
  const yB = yHead - s * 0.6 * k;
  return (
    <G opacity={0.55}>
      <Rect x={x0} y={Math.min(yA, yB)} width={x1 - x0} height={Math.abs(yB - yA)} fill={fill} />
      <Line x1={x0} y1={yA + s * 0.6 * k} x2={x1} y2={yA + s * 0.6 * k} stroke="#f4f6fa" strokeWidth={0.6} opacity={0.8} />
    </G>
  );
}

/** The head's collar and flesh hoop at one silhouette (film over the edge
 *  peak, down the outside of the shell into the aluminium flesh hoop). */
export function Collar({ pl, peakU, color }: { pl: Place; peakU: number; color: string }) {
  const { X, Y } = P(pl);
  const film = `M${X(peakU)} ${Y(0)} Q${X(HW.fleshIn + 0.6)} ${Y(0.2)} ${X(HW.fleshIn + 0.8)} ${Y(3)} L${X(HW.fleshIn + 0.8)} ${Y(HW.hoopSeat + 1)}`;
  const fx0 = Math.min(X(HW.fleshIn), X(HW.fleshOut));
  const fy0 = Math.min(Y(HW.hoopSeat), Y(HW.hoopSeat + HW.fleshH));
  return (
    <G>
      <Path d={film} stroke={color} strokeWidth={Math.max(0.9, 1.4 * pl.k)} fill="none" strokeLinecap="round" />
      <Rect x={fx0} y={fy0} width={Math.abs(X(HW.fleshOut) - X(HW.fleshIn))} height={Math.abs(Y(HW.hoopSeat + HW.fleshH) - Y(HW.hoopSeat))} rx={0.6} fill="#9aa0ab" stroke="#3c3f46" strokeWidth={0.4} />
    </G>
  );
}

/** A tension rod at one silhouette: washer and square head on the ear, the
 *  shaft down into the lug (vEnd: where it disappears into the casing). */
export function RodCut({ pl, vEnd, color }: { pl: Place; vEnd: number; color?: string }) {
  const { X, Y } = P(pl);
  const k = pl.k;
  const x = X(HW.rodU);
  const shaftW = HW.rodD * k;
  const yWasherA = Y(HW.flangeV - 1.2);
  const yHeadA = Y(HW.flangeV - 1.2 - HW.rodHead);
  return (
    <G>
      <Rect x={x - shaftW / 2} y={Math.min(Y(HW.hoopSeat), Y(vEnd))} width={shaftW} height={Math.abs(Y(vEnd) - Y(HW.hoopSeat))} fill={color ?? 'url(#dtChrome)'} stroke="#2a2c32" strokeWidth={0.35} />
      {/* thread hint */}
      <Line x1={x} y1={Y(HW.hoopSeat + 1)} x2={x} y2={Y(vEnd)} stroke="#2a2c32" strokeWidth={Math.max(0.3, shaftW * 0.35)} strokeDasharray={`${0.9 * k} ${0.9 * k}`} opacity={0.45} />
      <Rect x={x - (HW.washerD * k) / 2} y={Math.min(yWasherA, Y(HW.flangeV))} width={HW.washerD * k} height={1.2 * k} fill="#6f737c" />
      <Rect x={x - (HW.rodHead * k) / 2} y={Math.min(yHeadA, yWasherA)} width={HW.rodHead * k} height={HW.rodHead * k} rx={0.5 * k} fill={color ?? 'url(#dtChrome)'} stroke="#2a2c32" strokeWidth={0.4} />
    </G>
  );
}

/** A two-piece lug casing in profile on the shell (v0 → v0 + len from the
 *  head), its gasket, the swivel nut the rod enters and the screw through
 *  the shell (seen on the inner wall in a cutaway, `tShell` mm). */
export function LugCut({ pl, v0 = HW.lugTop, len = HW.lugLen, tShell, fill, stroke = '#2a2c32' }: { pl: Place; v0?: number; len?: number; tShell: number; fill?: string; stroke?: string }) {
  const { X, Y } = P(pl);
  const k = pl.k;
  const v1 = v0 + len;
  const o = HW.lugOut;
  // A cast casing: flat on the shell, a rounded nose outward, a slight waist.
  const d = [
    `M${X(1.1)} ${Y(v0 + 1)}`,
    `Q${X(1.1)} ${Y(v0)} ${X(4)} ${Y(v0)}`,
    `L${X(o - 6)} ${Y(v0)}`,
    `Q${X(o)} ${Y(v0)} ${X(o)} ${Y(v0 + 6)}`,
    `L${X(o - 1.2)} ${Y((v0 + v1) / 2)}`,
    `L${X(o)} ${Y(v1 - 6)}`,
    `Q${X(o)} ${Y(v1)} ${X(o - 6)} ${Y(v1)}`,
    `L${X(4)} ${Y(v1)}`,
    `Q${X(1.1)} ${Y(v1)} ${X(1.1)} ${Y(v1 - 1)} Z`,
  ].join(' ');
  const gx = Math.min(X(0), X(1.1));
  const gy = Math.min(Y(v0 + 2), Y(v1 - 2));
  const screwV = (v0 + v1) / 2;
  return (
    <G>
      <Rect x={gx} y={gy} width={1.1 * k} height={Math.abs(Y(v1 - 2) - Y(v0 + 2))} fill="#121316" />
      <Path d={d} fill={fill ?? 'url(#dtChrome)'} stroke={stroke} strokeWidth={0.5} />
      {/* rim light along the upper face */}
      <Line x1={X(4)} y1={Y(v0) + pl.s * 0.5} x2={X(o - 6)} y2={Y(v0) + pl.s * 0.5} stroke="#ffffff" strokeWidth={0.5} opacity={0.6} />
      {/* the swivel nut's slot where the rod enters */}
      <Rect x={Math.min(X(HW.rodU - 3), X(HW.rodU + 3))} y={Math.min(Y(v0 + 0.2), Y(v0 + 2))} width={6 * k} height={1.8 * k} fill="#1a1b1f" />
      {/* the mounting screw through the shell: its head on the inner wall */}
      <Rect x={Math.min(X(-tShell), X(-tShell - 2))} y={Y(screwV) - 3 * k} width={2 * k} height={6 * k} rx={0.6 * k} fill="#8a8f99" stroke="#1a1b1f" strokeWidth={0.3} />
    </G>
  );
}

/** The wall cut face at one silhouette (depth D mm): plies, the 45° bearing
 *  edges top and bottom (peak at peakU, measured outward: −0.3·t). */
export function WallCut({ pl, D, t, plies, fill = 'url(#dtPly)', ply = '#2b170a', stroke = '#140b05', edgeFill }: { pl: Place; D: number; t: number; plies: number; fill?: string; ply?: string; stroke?: string; edgeFill?: string }) {
  const { X, Y } = P(pl);
  const pk = -0.3 * t;
  const cut = 0.7 * t;
  const d = [
    `M${X(-t)} ${Y(cut)}`,
    `L${X(pk)} ${Y(0)}`,
    `Q${X(0)} ${Y(0)} ${X(0)} ${Y(0.9)}`,
    `L${X(0)} ${Y(D - 0.9)}`,
    `Q${X(0)} ${Y(D)} ${X(pk)} ${Y(D)}`,
    `L${X(-t)} ${Y(D - cut)} Z`,
  ].join(' ');
  const lines: ReactNode[] = [];
  for (let i = 1; i < plies; i++) {
    const u = -(t * i) / plies;
    lines.push(<Line key={i} x1={X(u)} y1={Y(cut + 0.2)} x2={X(u)} y2={Y(D - cut - 0.2)} stroke={ply} strokeWidth={0.35} opacity={0.7} />);
  }
  const edge = (v0: number, v1: number) => `M${X(-t)} ${Y(v0)} L${X(pk)} ${Y(v1)} Q${X(0)} ${Y(v1)} ${X(0)} ${Y(v1 + (v1 === 0 ? 0.9 : -0.9))}`;
  return (
    <G>
      <Path d={d} fill={fill} stroke={stroke} strokeWidth={0.6} />
      {lines}
      {edgeFill ? (
        <G>
          <Path d={edge(cut, 0)} stroke={edgeFill} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Path d={edge(D - cut, D)} stroke={edgeFill} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      ) : null}
    </G>
  );
}

/** A drumstick: tip bead at (x, y), the stick running out along `deg`
 *  (SVG degrees, 0 = +x) for `len` units; true 14.7 mm × k thickness. */
export function StickSvg({ x, y, deg, len, k }: { x: number; y: number; deg: number; len: number; k: number }) {
  const r = (HW.stickD * k) / 2;
  const bead = (HW.beadD * k) / 2;
  const taper = 60 * k;
  const d = `M${bead * 0.6} ${-bead * 0.55} Q${taper * 0.55} ${-bead * 0.7} ${taper} ${-r} L${len} ${-r} L${len} ${r} L${taper} ${r} Q${taper * 0.55} ${bead * 0.7} ${bead * 0.6} ${bead * 0.55} Z`;
  return (
    <G transform={`translate(${x},${y}) rotate(${deg})`}>
      <Path d={d} fill="url(#dtStick)" stroke="#3a240e" strokeWidth={0.4} />
      <Line x1={taper} y1={-r * 0.45} x2={len} y2={-r * 0.45} stroke="#fff4dc" strokeWidth={0.6} opacity={0.55} />
      <Circle cx={0} cy={0} r={bead} fill="url(#dtBead)" stroke="#5e3e12" strokeWidth={0.35} />
    </G>
  );
}

/**
 * An upright drum from the side, UNCUT (camera level with it): the lit
 * shell, both triple-flange hoops with their ears, and the near lugs and
 * rods at their true angles (`lugs` per head from `phaseDeg`, foreshortened).
 * `yHead` is the batter head plane; the resonant head is D mm below.
 */
export function ExteriorDrum({ cx, yHead, dIn, depthIn, k, lugs, phaseDeg, legs = 0, mount = null }: { cx: number; yHead: number; dIn: number; depthIn: number; k: number; lugs: number; phaseDeg: number; legs?: number; mount?: { from: [number, number]; to: [number, number] } | null }) {
  const R = (dIn * 25.4) / 2;
  const D = depthIn * 25.4;
  const X = (mm: number) => cx + mm * k;
  const Y = (mm: number) => yHead + mm * k;
  const hoopR = R + HW.hoopGap + HW.hoopT;
  const parts: ReactNode[] = [];
  // Near lugs, rods and ears (sin θ > 0 faces the camera), back to front.
  const angs = Array.from({ length: lugs }, (_, i) => phaseDeg + (i * 360) / lugs)
    .map((deg) => ({ deg, a: (deg * Math.PI) / 180 }))
    .filter((q) => Math.sin(q.a) > 0.05)
    .sort((p, q) => Math.sin(p.a) - Math.sin(q.a));
  for (const { deg, a } of angs) {
    const sx = Math.sin(a);
    const xr = X((R + HW.rodU) * Math.cos(a));
    const xl = X((R + HW.lugOut * 0.55) * Math.cos(a));
    const w = (HW.lugW * sx + HW.lugOut * Math.abs(Math.cos(a)) * 0.6) * k;
    for (const top of [true, false]) {
      const v0 = top ? HW.lugTop : D - HW.lugTop - HW.lugLen;
      const vEar = top ? HW.hoopSeat : D - HW.hoopSeat;
      const vLug = top ? v0 : v0 + HW.lugLen;
      parts.push(
        <G key={`${deg}${top}`}>
          <Rect x={xr - (HW.rodD * k) / 2} y={Math.min(Y(vEar), Y(vLug))} width={HW.rodD * k} height={Math.abs(Y(vLug) - Y(vEar))} fill="url(#dtChrome)" />
          <Rect x={xl - w / 2} y={Y(v0)} width={w} height={HW.lugLen * k} rx={Math.min(w / 2, 5 * k)} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.4} />
          <Rect x={xr - (HW.earOut * 0.55 * sx + 4) * k} y={top ? Y(HW.flangeV) : Y(D - HW.hoopSeat)} width={(HW.earOut * 1.1 * sx + 8) * k} height={(HW.hoopSeat - HW.flangeV) * k} rx={0.6 * k} fill="#b9bdc6" stroke="#2a2c32" strokeWidth={0.3} />
        </G>,
      );
    }
  }
  const legEls: ReactNode[] = [];
  if (legs > 0) {
    // Floor-tom legs: Ø 10.5 mm, from brackets ≈ 30 % down the shell, splayed
    // ≈ 90 mm past the shell to rubber feet ≈ 105 mm below the bottom head.
    const floorV = D + 105;
    for (let i = 0; i < legs; i++) {
      const a = ((30 + (i * 360) / legs) * Math.PI) / 180;
      const near = Math.sin(a) > -0.2;
      const xb = X(R * Math.cos(a) + Math.sign(Math.cos(a)) * 9);
      const xf = X((R + 90) * Math.cos(a));
      legEls.push(
        <G key={i} opacity={near ? 1 : 0.55}>
          <Line x1={xb} y1={Y(D * 0.3)} x2={xf} y2={Y(floorV - 6)} stroke="#2a2c32" strokeWidth={13 * k} strokeLinecap="round" />
          <Line x1={xb} y1={Y(D * 0.3)} x2={xf} y2={Y(floorV - 6)} stroke="#a3a8b2" strokeWidth={8 * k} strokeLinecap="round" />
          <Rect x={xf - 9 * k} y={Y(floorV - 14)} width={18 * k} height={14 * k} rx={4 * k} fill="#141518" />
          {near ? <Rect x={xb - 10 * k} y={Y(D * 0.24)} width={20 * k} height={D * 0.12 * k} rx={2 * k} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.4} /> : null}
        </G>,
      );
    }
  }
  return (
    <G>
      {legEls}
      {/* shell: a lit lacquered cylinder */}
      <Rect x={X(-R)} y={Y(0)} width={2 * R * k} height={D * k} fill="url(#dtWood)" stroke="#140b05" strokeWidth={0.6} />
      <Rect x={X(-R)} y={Y(0)} width={2 * R * k} height={D * k} fill="url(#dtCavity)" opacity={0.22} />
      {mount ? (
        <G>
          {/* the suspension bracket on the shell and the L-arm down to the holder (mm from the head centre) */}
          <Line x1={X(mount.from[0])} y1={Y(mount.from[1])} x2={X(mount.to[0])} y2={Y(mount.to[1])} stroke="#2a2c32" strokeWidth={16 * k} strokeLinecap="round" />
          <Line x1={X(mount.from[0])} y1={Y(mount.from[1])} x2={X(mount.to[0])} y2={Y(mount.to[1])} stroke="#a3a8b2" strokeWidth={10.5 * k} strokeLinecap="round" />
          <Rect x={X(mount.from[0] - 22)} y={Y(mount.from[1] - 22)} width={44 * k} height={44 * k} rx={6 * k} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.5} />
        </G>
      ) : null}
      {parts}
      {/* hoops: a band above and below each head, the rolled lip lit */}
      {[0, D].map((v) => {
        const top = v === 0;
        const y0 = top ? Y(-HW.hoopUp) : Y(D - HW.hoopSeat);
        return (
          <G key={v}>
            <Rect x={X(-hoopR)} y={y0} width={2 * hoopR * k} height={(HW.hoopUp + HW.hoopSeat) * k} rx={0.8 * k} fill="url(#dtChrome)" stroke="#2a2c32" strokeWidth={0.5} />
            <Rect x={X(-(R + HW.hoopLip))} y={top ? Y(-HW.hoopUp) : Y(D + HW.hoopUp - 2.3)} width={2 * (R + HW.hoopLip) * k} height={2.3 * k} rx={1.1 * k} fill="#e6e9ef" stroke="#2a2c32" strokeWidth={0.4} />
          </G>
        );
      })}
    </G>
  );
}
