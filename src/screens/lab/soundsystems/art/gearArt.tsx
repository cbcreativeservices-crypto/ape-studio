/**
 * Sound Systems Lab — illustrated gear (pure react-native-svg).
 *
 * The standing visual rule (owner 2026-07-29): a physical object is never a
 * box or a circle standing in for it. Every piece of live-sound equipment the
 * lab shows is drawn as a recognisable illustration — layered shapes,
 * gradients for form, light from the upper left, a rim highlight — in a
 * 64 × 64 local box so the venue plot, the parts bin, the system diagram and
 * the fault bench all share ONE drawing per kind.
 *
 * DIMENSIONS (art pass 2026-10-10, owner: "be especially careful to FORM and
 * DIMENSIONS"). Each object is AUTHORED IN MILLIMETRES from the real product
 * class (the numbers sit in a comment above each drawing) and placed into the
 * 64-box with one uniform scale, so its proportions are the real ones by
 * construction. The glyphs are an icon set: each one is internally true;
 * relative size BETWEEN glyphs is not (a 1U processor and a wedge share the
 * same box). Box-shaped units are drawn in a cabinet-oblique view: the FRONT
 * face is true (a 1U panel really is 10.9 : 1), depth recedes up-right.
 *
 * Pure SVG rather than Skia so the drawings load everywhere, including the
 * web preview, with no gate and no fallback card. Gradient ids are prefixed
 * per instance: two glyphs in one <Svg> must never share an id.
 *
 * Generic hardware — no brand likeness, no trade dress.
 */
import { useRef, type ReactNode } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { HeadIconSvg } from '../../../../features/lab/headIconsSvg';
import { colors } from '../../../../theme/tokens';
import type { GearKind } from '../../../../features/soundsystems/types';

/* ── palette ─────────────────────────────────────────────────────────────── */

export const INK = {
  metalHi: '#a7aeb8',
  metalMid: '#5d646d',
  metalLo: '#23262c',
  panelHi: '#2b2f37',
  panelMid: '#1a1d24',
  panelLo: '#0d0f13',
  cabinetHi: '#34383f',
  cabinetLo: '#141619',
  grille: '#0b0c0f',
  coneHi: '#6f7680',
  coneLo: '#1e2126',
  rim: 'rgba(255,255,255,0.32)',
  shadow: 'rgba(0,0,0,0.5)',
  amber: colors.amber,
  blue: '#6fa8ff',
  green: colors.greenBright,
  red: colors.red,
  tape: '#d9d3c2',
} as const;

/* ── shared defs ─────────────────────────────────────────────────────────── */

function GearDefs({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={INK.metalHi} />
        <Stop offset="0.5" stopColor={INK.metalMid} />
        <Stop offset="1" stopColor={INK.metalLo} />
      </LinearGradient>
      {/* a round tube lit from the left: highlight, body, core shadow */}
      <LinearGradient id={`${id}-tube`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#3a3f47" />
        <Stop offset="0.28" stopColor={INK.metalHi} />
        <Stop offset="0.6" stopColor={INK.metalMid} />
        <Stop offset="1" stopColor={INK.metalLo} />
      </LinearGradient>
      <LinearGradient id={`${id}-panel`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={INK.panelHi} />
        <Stop offset="1" stopColor={INK.panelLo} />
      </LinearGradient>
      {/* the lid of a chassis seen from above: lit, brushed */}
      <LinearGradient id={`${id}-lid`} x1="0" y1="1" x2="1" y2="0">
        <Stop offset="0" stopColor="#3b4049" />
        <Stop offset="1" stopColor="#262a31" />
      </LinearGradient>
      <LinearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#15171b" />
        <Stop offset="1" stopColor="#0b0c0f" />
      </LinearGradient>
      <LinearGradient id={`${id}-cab`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={INK.cabinetHi} />
        <Stop offset="1" stopColor={INK.cabinetLo} />
      </LinearGradient>
      <RadialGradient id={`${id}-cone`} cx="0.4" cy="0.38" r="0.7">
        <Stop offset="0" stopColor={INK.coneHi} />
        <Stop offset="0.55" stopColor="#3a3f47" />
        <Stop offset="1" stopColor={INK.coneLo} />
      </RadialGradient>
      <RadialGradient id={`${id}-dust`} cx="0.45" cy="0.4" r="0.6">
        <Stop offset="0" stopColor="#8b929c" />
        <Stop offset="1" stopColor="#2a2e35" />
      </RadialGradient>
      <RadialGradient id={`${id}-grille`} cx="0.35" cy="0.3" r="0.8">
        <Stop offset="0" stopColor="#c4cad2" />
        <Stop offset="0.6" stopColor="#6d747d" />
        <Stop offset="1" stopColor="#2b2f35" />
      </RadialGradient>
      <LinearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={INK.amber} stopOpacity="0.9" />
        <Stop offset="1" stopColor={INK.amber} stopOpacity="0.2" />
      </LinearGradient>
      <LinearGradient id={`${id}-lcd`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#13314a" />
        <Stop offset="1" stopColor="#0a1a2a" />
      </LinearGradient>
    </Defs>
  );
}

/** A small illuminated indicator with a soft halo. */
function Led({ x, y, color, on = true, r = 1.6 }: { x: number; y: number; color: string; on?: boolean; r?: number }) {
  return (
    <G>
      {on ? <Circle cx={x} cy={y} r={r * 2.2} fill={color} opacity={0.22} /> : null}
      <Circle cx={x} cy={y} r={r} fill={on ? color : '#2a2d33'} stroke="#000" strokeWidth={r * 0.25} />
    </G>
  );
}

/** A cone loudspeaker seen face-on, AUTHORED IN MM: basket rim, roll
 *  surround, cone, dust cap. `d` is the nominal size (a 12-inch frame is
 *  ~310 mm across, an 18-inch ~460 mm). Proportions from the driver class:
 *  surround ≈ 8 % of d, dust cap ≈ 28 % of d. */
function DriverMm({ id, cx, cy, d }: { id: string; cx: number; cy: number; d: number }) {
  const r = d / 2;
  return (
    <G>
      {/* the basket's mounting rim (bolted to the baffle) */}
      <Circle cx={cx} cy={cy} r={r} fill="#0a0b0d" stroke="#2e3239" strokeWidth={d * 0.012} />
      {[45, 135, 225, 315].map((a) => (
        <Circle key={a} cx={cx + Math.cos((a * Math.PI) / 180) * r * 0.955} cy={cy + Math.sin((a * Math.PI) / 180) * r * 0.955} r={d * 0.012} fill="#3a3f47" />
      ))}
      {/* roll surround */}
      <Circle cx={cx} cy={cy} r={r * 0.9} fill="#1c1f24" stroke="#000" strokeWidth={d * 0.006} />
      <Circle cx={cx} cy={cy} r={r * 0.86} fill="none" stroke="#3a3f47" strokeWidth={d * 0.01} opacity={0.8} />
      {/* cone */}
      <Circle cx={cx} cy={cy} r={r * 0.8} fill={`url(#${id}-cone)`} stroke="#000" strokeWidth={d * 0.006} />
      {/* dust cap */}
      <Circle cx={cx} cy={cy} r={r * 0.28} fill={`url(#${id}-dust)`} stroke="#15171b" strokeWidth={d * 0.006} />
      <Path d={`M ${cx - r * 0.66} ${cy - r * 0.5} A ${r * 0.82} ${r * 0.82} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.8}`} stroke={INK.rim} strokeWidth={d * 0.014} fill="none" />
    </G>
  );
}

/* ── cabinet-oblique rack chassis ────────────────────────────────────────── */

/** Depth recedes up-right at 35°, drawn at 0.45 of its length (a cabinet
 *  oblique: the front face stays true, the depth reads as depth). */
const OBL_K = 0.45;
const OBL_A = (35 * Math.PI) / 180;

/** EIA-310 rack front panel: 482.6 mm wide, 1U = 44.45 mm; the chassis body
 *  behind it is ~430 mm, so each ear is ~26 mm of bare panel. */
const RACK_W = 482.6;
const RACK_U = 44.45;
const RACK_EAR = 26.3;

type Chassis = { s: number; x: number; y: number; w: number; h: number; ear: number; dx: number; dy: number };

/** Fit a chassis (front panel `wMm` × `hMm`, body `depthMm` deep, ears of
 *  `earMm`) into the 64-box: `maxW` units wide, centred on (32, cy). */
function chassisFit(wMm: number, hMm: number, depthMm: number, earMm: number, maxW = 60, cy = 32): Chassis {
  const dxMm = depthMm * OBL_K * Math.cos(OBL_A);
  const dyMm = depthMm * OBL_K * Math.sin(OBL_A);
  const s = maxW / (wMm - earMm + dxMm);
  const w = wMm * s;
  const h = hMm * s;
  const dx = dxMm * s;
  const dy = dyMm * s;
  const x = 32 - (w - earMm * s + dx) / 2;
  const y = cy - (h - dy) / 2;
  return { s, x, y, w, h, ear: earMm * s, dx, dy };
}

/** The chassis shell: contact shadow, right side, lid (with vent slots),
 *  then the front panel; `children` are the front-panel parts AUTHORED IN MM
 *  (origin = the panel's top-left corner). */
function ChassisShell({ id, c, vents = 0, children }: { id: string; c: Chassis; vents?: number; children?: ReactNode }) {
  const { x, y, w, h, ear, dx, dy } = c;
  const bl = x + ear;
  const br = x + w - ear;
  return (
    <G>
      {/* contact shadow on the surface it sits on */}
      <Polygon points={`${bl + 1},${y + h + 0.8} ${br + 1.5},${y + h + 0.8} ${br + dx + 1.5},${y + h - dy + 0.8} ${br + dx},${y + h - dy}`} fill="#000" opacity={0.35} />
      {/* right side */}
      <Polygon points={`${br},${y} ${br + dx},${y - dy} ${br + dx},${y - dy + h} ${br},${y + h}`} fill={`url(#${id}-side)`} stroke="#000" strokeWidth={0.3} />
      {/* lid */}
      <Polygon points={`${bl},${y} ${br},${y} ${br + dx},${y - dy} ${bl + dx},${y - dy}`} fill={`url(#${id}-lid)`} stroke="#000" strokeWidth={0.3} />
      <Line x1={bl + 0.4} y1={y - 0.15} x2={br - 0.4} y2={y - 0.15} stroke="#fff" strokeWidth={0.35} opacity={0.18} />
      {Array.from({ length: vents }, (_, i) => {
        const f = 0.25 + (i * 0.5) / Math.max(1, vents - 1);
        const vx = bl + (br - bl) * 0.55 + dx * f;
        const vy = y - dy * f;
        return <Line key={i} x1={vx} y1={vy} x2={vx + (br - bl) * 0.35} y2={vy} stroke="#14161a" strokeWidth={0.45} />;
      })}
      {/* front panel */}
      <Rect x={x} y={y} width={w} height={h} rx={Math.min(0.6, h * 0.12)} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.35} />
      <Line x1={x + 0.3} y1={y + 0.2} x2={x + w - 0.3} y2={y + 0.2} stroke="#fff" strokeWidth={0.3} opacity={0.16} />
      <G transform={`translate(${x}, ${y}) scale(${c.s})`}>{children}</G>
    </G>
  );
}

/** Rack-ear mounting slots (mm, panel coordinates): EIA holes sit 6.35 mm
 *  in from the top and bottom of each U; drawn as the usual oval slots. */
function EarSlotsMm({ units }: { units: number }) {
  const slots: ReactNode[] = [];
  for (let u = 0; u < units; u++) {
    for (const yy of [6.35, RACK_U - 6.35]) {
      for (const xx of [RACK_EAR / 2, RACK_W - RACK_EAR / 2]) {
        slots.push(<Rect key={`${u}-${yy}-${xx}`} x={xx - 5} y={u * RACK_U + yy - 2.6} width={10} height={5.2} rx={2.6} fill="#050607" stroke="#4a5058" strokeWidth={0.9} />);
      }
    }
  }
  return <G>{slots}</G>;
}

/** A panel-mount XLR face (mm): Ø22 insert in its 26 mm flange; female
 *  shows three sockets + the latch tab, male shows three pins. Pin layout as
 *  seen from the front, latch up: female 1 right-top... drawn as the usual
 *  two-up one-down triangle (numbers are not drawn at this size). */
function XlrMm({ cx, cy, male = false, ring = INK.metalHi }: { cx: number; cy: number; male?: boolean; ring?: string }) {
  return (
    <G>
      <Rect x={cx - 13} y={cy - 13} width={26} height={26} rx={4} fill="#121418" stroke="#30343b" strokeWidth={0.8} />
      <Circle cx={cx} cy={cy} r={10.5} fill="#08090b" stroke={ring} strokeWidth={1.6} />
      {!male ? <Rect x={cx - 2.4} y={cy - 13.5} width={4.8} height={4} rx={1} fill={INK.metalHi} /> : null}
      {[
        [-4.2, -1.8],
        [4.2, -1.8],
        [0, 4.4],
      ].map(([px, py], i) => (
        <Circle key={i} cx={cx + px} cy={cy + py} r={male ? 1.7 : 1.5} fill={male ? INK.metalHi : '#000'} stroke={male ? '#000' : '#3a3f47'} strokeWidth={0.5} />
      ))}
    </G>
  );
}

/* ── the drawings ────────────────────────────────────────────────────────── */

/**
 * Handheld vocal dynamic on a straight stand.
 * Mic (the SM58 class): head Ø51 mm ball grille ~50 mm tall, handle Ø38 at
 * the collar tapering to Ø24 at the XLR tail, overall 162 mm. Drawn at
 * 0.23 u/mm, tilted 50° above horizontal toward the singer, held at the
 * handle's middle by a clip on the stand's swivel. Stand: round cast base
 * Ø250 mm, tube Ø19 upper / Ø25 lower with the height clutch between them —
 * the stand is SHORTENED (icon), the mic is not.
 */
const VOCAL_MIC_S = 0.23;
function VocalMic({ id }: { id: string; lit?: boolean }) {
  const S = VOCAL_MIC_S;
  const head = 51 * S; // Ø
  const r = head / 2;
  const L = 162 * S;
  const collarY = 48 * S;
  const clipY = 92 * S;
  const topW = 38 * S;
  const tailW = 24 * S;
  // meridians + parallels of the mesh, in the mic's local frame (head centre at 0, r)
  const mesh: ReactNode[] = [];
  for (const k of [0.38, 0.75]) mesh.push(<Ellipse key={`m${k}`} cx={0} cy={r} rx={r * k} ry={r} fill="none" stroke="#14171b" strokeWidth={0.32} opacity={0.75} />);
  for (const t of [-0.55, -0.15, 0.25, 0.62]) {
    const hy = r + t * r;
    const hw = Math.sqrt(Math.max(0, r * r - (t * r) ** 2));
    mesh.push(<Line key={`p${t}`} x1={-hw} y1={hy} x2={hw} y2={hy} stroke="#14171b" strokeWidth={0.32} opacity={0.75} />);
  }
  return (
    <G>
      {/* base: cast round base, seen from a little above */}
      <Ellipse cx={30} cy={59.6} rx={12.5} ry={2.6} fill="#000" opacity={0.4} />
      <Ellipse cx={30} cy={58.2} rx={12} ry={2.5} fill="#16181c" />
      <Ellipse cx={30} cy={57.6} rx={11.4} ry={2.1} fill={`url(#${id}-metal)`} />
      <Ellipse cx={27} cy={57.1} rx={5} ry={0.7} fill="#fff" opacity={0.18} />
      {/* lower tube Ø25, clutch, upper tube Ø19 */}
      <Rect x={28.9} y={44} width={2.3} height={13.6} fill={`url(#${id}-tube)`} />
      <Rect x={28.3} y={42.2} width={3.5} height={2.6} rx={0.6} fill="#1b1e23" stroke="#000" strokeWidth={0.3} />
      <Rect x={31.8} y={42.8} width={1.6} height={1.2} rx={0.4} fill="#2b2f35" />
      <Rect x={29.2} y={30.8} width={1.75} height={11.6} fill={`url(#${id}-tube)`} />
      {/* XLR cable from the mic's tail, looping down to the floor */}
      <Path d="M 45.6 38.7 C 48.6 43.8 44.6 49 39.4 51.8 C 35.4 54 33.6 56.4 36.6 58.6" stroke="#0d0e10" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M 45.6 38.7 C 48.6 43.8 44.6 49 39.4 51.8" stroke="#3a3f47" strokeWidth={0.35} fill="none" opacity={0.7} />
      {/* swivel + the mic, rotated as one about the swivel; the clip's
          cradle hugs the handle's under side, its arm back to the swivel */}
      <G transform={`translate(30.1, 30.6) rotate(-40) translate(${topW / 2 + 2.6}, ${-clipY})`}>
        <Path d={`M ${-topW / 2 - 2.6} ${clipY - 1.1} L ${-topW / 2 - 0.4} ${clipY - 1.1} L ${-topW / 2 - 0.4} ${clipY - 4.2} L ${-topW / 2 + 1.4} ${clipY - 4.2} L ${-topW / 2 + 1.4} ${clipY + 4.2} L ${-topW / 2 - 0.4} ${clipY + 4.2} L ${-topW / 2 - 0.4} ${clipY + 1.1} L ${-topW / 2 - 2.6} ${clipY + 1.1} Z`} fill="#15171b" stroke="#000" strokeWidth={0.3} />
        {/* handle: tapered barrel, satin black */}
        <Path d={`M ${-topW / 2} ${collarY + 1} L ${topW / 2} ${collarY + 1} L ${tailW / 2} ${L - 0.6} Q 0 ${L + 0.4} ${-tailW / 2} ${L - 0.6} Z`} fill="#24272d" stroke="#000" strokeWidth={0.35} />
        <Path d={`M ${-topW / 2 + 0.7} ${collarY + 1.6} L ${-tailW / 2 + 0.5} ${L - 1.5}`} stroke="#fff" strokeWidth={0.45} opacity={0.22} />
        {/* XLR tail ring */}
        <Rect x={-tailW / 2 - 0.1} y={L - 3} width={tailW + 0.2} height={1.1} fill={INK.metalMid} />
        {/* the cradle's lip showing round the near side of the handle */}
        <Path d={`M ${-topW / 2 + 0.2} ${clipY - 3.6} Q ${-topW / 2 + 2.2} ${clipY} ${-topW / 2 + 0.2} ${clipY + 3.6}`} stroke="#15171b" strokeWidth={1.1} fill="none" />
        {/* collar band where the grille seats */}
        <Rect x={-r * 0.92} y={collarY - 0.5} width={r * 1.84} height={1.9} rx={0.5} fill={INK.metalMid} stroke="#000" strokeWidth={0.3} />
        {/* ball grille with its mesh */}
        <Circle cx={0} cy={r} r={r} fill={`url(#${id}-grille)`} stroke="#0b0c0f" strokeWidth={0.45} />
        {mesh}
        <Ellipse cx={-r * 0.38} cy={r * 0.55} rx={r * 0.3} ry={r * 0.2} fill="#fff" opacity={0.3} />
      </G>
      <Circle cx={30.1} cy={30.6} r={1.1} fill="#1b1e23" stroke={INK.metalHi} strokeWidth={0.35} />
    </G>
  );
}

/**
 * Instrument dynamic on a tripod boom stand.
 * Mic (the SM57 class): Ø32 mm, 157 mm long; the grille head ~45 mm,
 * slightly narrower toward its flat front. Drawn at 0.17 u/mm.
 * Stand: three-leg tripod, mast, boom clutch, boom arm with its
 * counterweight on the short end; the mic hangs from the boom tip in its
 * clip, capsule aimed down and forward at the source. Stand SHORTENED (icon).
 */
const INST_MIC_S = 0.17;
function InstrumentMic({ id }: { id: string; lit?: boolean }) {
  const S = INST_MIC_S;
  const L = 157 * S;
  const D = 32 * S;
  const grille = 45 * S;
  return (
    <G>
      {/* tripod: two legs in profile, the third toward the viewer */}
      <Ellipse cx={20} cy={59.4} rx={14} ry={1.4} fill="#000" opacity={0.35} />
      <Path d="M 20 47 L 7.5 58.6 M 20 47 L 32.5 58.6" stroke={INK.metalMid} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M 20 47 L 21.5 59.4" stroke={INK.metalLo} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 20 47 L 7.5 58.6" stroke={INK.rim} strokeWidth={0.35} />
      <Circle cx={7.5} cy={58.6} r={0.9} fill="#0d0e10" />
      <Circle cx={32.5} cy={58.6} r={0.9} fill="#0d0e10" />
      <Rect x={18.7} y={45.6} width={2.6} height={3} rx={0.6} fill="#1b1e23" stroke="#000" strokeWidth={0.3} />
      {/* mast */}
      <Rect x={19.1} y={31} width={1.8} height={15} fill={`url(#${id}-tube)`} />
      {/* boom: long arm over the source, short arm + counterweight behind */}
      <Line x1={9.5} y1={36.4} x2={50} y2={15.5} stroke={INK.metalMid} strokeWidth={1.25} strokeLinecap="round" />
      <Line x1={9.5} y1={35.9} x2={50} y2={15} stroke={INK.rim} strokeWidth={0.3} />
      <G transform="rotate(-27.3 10.5 35.9)">
        <Rect x={6.2} y={33.6} width={6.2} height={4.6} rx={1.2} fill="#1b1e23" stroke="#000" strokeWidth={0.35} />
        <Rect x={6.8} y={34.1} width={5} height={0.8} rx={0.4} fill="#fff" opacity={0.15} />
      </G>
      {/* boom clutch */}
      <Circle cx={20} cy={31} r={2.4} fill="#1b1e23" stroke="#000" strokeWidth={0.35} />
      <Circle cx={20} cy={31} r={1} fill={INK.metalHi} />
      {/* the mic in its clip at the boom tip, capsule pointing down-forward */}
      <G transform={`translate(50, 15.5) rotate(150) translate(0, ${-L * 0.8})`}>
        {/* body (tail toward the boom), tapering slightly to the XLR end */}
        <Path d={`M ${-D / 2} ${grille} L ${D / 2} ${grille} L ${D * 0.42} ${L - 0.4} L ${-D * 0.42} ${L - 0.4} Z`} fill="#24272d" stroke="#000" strokeWidth={0.3} />
        <Line x1={-D / 2 + 0.6} y1={grille + 0.8} x2={-D * 0.42 + 0.5} y2={L - 1.2} stroke="#fff" strokeWidth={0.4} opacity={0.2} />
        <Rect x={-D * 0.42} y={L - 2.2} width={D * 0.84} height={0.9} fill={INK.metalMid} />
        {/* clip */}
        <Rect x={-D / 2 - 0.7} y={L * 0.8 - 2.4} width={D + 1.4} height={4.8} rx={0.8} fill="#15171b" stroke="#000" strokeWidth={0.3} />
        {/* grille head: collar, then the mesh barrel with its flat front */}
        <Rect x={-D / 2 - 0.15} y={grille - 1.2} width={D + 0.3} height={1.3} fill={INK.metalMid} />
        <Path d={`M ${-D / 2} ${grille - 1.2} L ${-D * 0.44} 0.8 Q 0 -0.3 ${D * 0.44} 0.8 L ${D / 2} ${grille - 1.2} Z`} fill={`url(#${id}-grille)`} stroke="#0b0c0f" strokeWidth={0.35} />
        {[0.22, 0.42, 0.62, 0.82].map((f) => (
          <Line key={f} x1={-D * (0.44 + 0.06 * f)} y1={grille * f} x2={D * (0.44 + 0.06 * f)} y2={grille * f} stroke="#14171b" strokeWidth={0.3} opacity={0.7} />
        ))}
        <Line x1={0} y1={0.6} x2={0} y2={grille - 1.4} stroke="#14171b" strokeWidth={0.3} opacity={0.5} />
      </G>
      {/* cable down the boom */}
      <Path d="M 47.6 17.6 C 44 22 38 22 31 26.5 C 26 29.6 22 30 20.9 34" stroke="#0d0e10" strokeWidth={0.9} fill="none" />
    </G>
  );
}

/**
 * Passive DI box (steel, the common class): 120 L × 95 W × 50 H mm; the
 * end panel shown carries the ¼-inch INPUT + THRU jacks, the XLR (male)
 * output and the ground-lift slide. Drawn face-on at 0.36 u/mm with its lid
 * in oblique — 95 × 50 end panel true.
 */
function DiBox({ id, legends = true }: { id: string; lit?: boolean; legends?: boolean }) {
  const c = chassisFit(120, 50, 95, 0, 46, 34);
  return (
    <G>
      <ChassisShell id={id} c={c}>
        {/* ¼-inch jacks: threaded bushing + nut, Ø ~12 mm socket */}
        {[20, 46].map((jx) => (
          <G key={jx}>
            <Circle cx={jx} cy={27} r={8} fill="#2b2f35" stroke="#000" strokeWidth={0.6} />
            <Circle cx={jx} cy={27} r={6} fill={INK.metalHi} />
            <Circle cx={jx} cy={27} r={3.3} fill="#000" />
          </G>
        ))}
        {/* XLR male out */}
        <XlrMm cx={80} cy={25} male />
        {/* ground-lift slide switch */}
        <Rect x={98} y={36} width={15} height={7} rx={2} fill="#08090b" stroke="#30343b" strokeWidth={0.6} />
        <Rect x={99} y={37} width={6} height={5} rx={1.2} fill={INK.metalHi} />
      </ChassisShell>
      {/* the printed label plate on the lid (a mark, not text — owner: no drawn text under 9 pt) */}
      {legends ? <Polygon points={`${c.x + c.w * 0.3 + c.dx * 0.3},${c.y - c.dy * 0.3} ${c.x + c.w * 0.7 + c.dx * 0.3},${c.y - c.dy * 0.3} ${c.x + c.w * 0.7 + c.dx * 0.7},${c.y - c.dy * 0.7} ${c.x + c.w * 0.3 + c.dx * 0.7},${c.y - c.dy * 0.7}`} fill={INK.tape} opacity={0.5} /> : null}
    </G>
  );
}

function Playback({ id, lit }: { id: string; lit: boolean }) {
  return (
    <G>
      {/* a laptop (13-inch class, 304 × 212 mm, 16:10 screen): the playback
          session on the lid, keyboard deck, the interface LED */}
      <Path d="M 14 14 L 50 14 L 52 40 L 12 40 Z" fill={INK.shadow} transform="translate(2,3)" />
      <Path d="M 14 14 L 50 14 L 52 40 L 12 40 Z" fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Path d="M 16.5 16.5 L 47.5 16.5 L 49.2 37.5 L 14.8 37.5 Z" fill="#0a1a2a" stroke="#1f3a55" strokeWidth={0.6} />
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={18} y={20 + i * 5} width={28} height={3} rx={0.6} fill={i === 1 ? '#1f3a55' : '#173044'} />
      ))}
      <Rect x={20} y={20} width={12} height={3} rx={0.6} fill={INK.blue} opacity={0.8} />
      <Rect x={24} y={25} width={18} height={3} rx={0.6} fill={INK.green} opacity={0.7} />
      <Rect x={19} y={30} width={8} height={3} rx={0.6} fill={INK.amber} opacity={0.8} />
      <Line x1={30} y1={18} x2={30.6} y2={36} stroke="#fff" strokeWidth={0.7} opacity={0.8} />
      <Path d="M 6 40 L 58 40 L 60 48 L 4 48 Z" fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={12} y={42} width={40} height={4} rx={0.8} fill="#0f1114" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <Rect key={i} x={13 + i * 4} y={42.6} width={3} height={2.8} rx={0.4} fill="#2a2e35" />
      ))}
      <Led on={lit} x={55.5} y={44} color={INK.green} r={1} />
      <Ellipse cx={32} cy={51} rx={24} ry={1.4} fill="#000" opacity={0.35} />
    </G>
  );
}

/**
 * Half-rack, 1U wireless receiver: 212 W × 44 H × 180 D mm (no rack ears —
 * half-rack units ride a tray). Two λ/4 whips on rear BNCs, ~150 mm at UHF,
 * splayed. Front: the LCD (RF + AF bars), the push-encoder, power.
 */
function WirelessRx({ id, lit }: { id: string; lit: boolean }) {
  const c = chassisFit(212, RACK_U, 180, 0, 48, 42);
  const ant = 150 * c.s;
  const ax0 = c.x + c.dx + 1.2;
  const ax1 = c.x + c.w + c.dx - 1.6;
  const ay = c.y - c.dy + 0.6;
  return (
    <G>
      {/* antennas behind the chassis */}
      {[
        [ax0, -14],
        [ax1, 14],
      ].map(([axx, deg]) => (
        <G key={deg} transform={`rotate(${deg} ${axx} ${ay})`}>
          <Rect x={axx - 0.9} y={ay - 2.2} width={1.8} height={2.4} rx={0.4} fill={INK.metalMid} />
          <Line x1={axx} y1={ay - 2} x2={axx} y2={ay - ant} stroke="#1b1e23" strokeWidth={1.3} strokeLinecap="round" />
          <Line x1={axx - 0.3} y1={ay - 2.5} x2={axx - 0.3} y2={ay - ant + 0.6} stroke="#fff" strokeWidth={0.3} opacity={0.2} />
        </G>
      ))}
      <ChassisShell id={id} c={c} vents={3}>
        {/* LCD with RF (green) and AF (amber) bargraphs */}
        <Rect x={18} y={8} width={80} height={28} rx={2} fill={`url(#${id}-lcd)`} stroke="#1f3a55" strokeWidth={0.8} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={i} x={24 + i * 7} y={30 - (i + 1) * 3.6} width={5} height={(i + 1) * 3.6} fill={INK.green} opacity={lit ? 0.85 : 0.2} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <Rect key={i} x={62 + i * 7} y={30 - (i + 1) * 3.2} width={5} height={(i + 1) * 3.2} fill={INK.amber} opacity={lit && i < 3 ? 0.85 : 0.2} />
        ))}
        {/* push-encoder */}
        <Circle cx={132} cy={22} r={10} fill="#0b0c0f" />
        <Circle cx={132} cy={22} r={8} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.6} />
        {/* power + its LED */}
        <Circle cx={180} cy={22} r={6} fill="#15171b" stroke="#3a3f47" strokeWidth={0.8} />
      </ChassisShell>
      <Led on={lit} x={c.x + 160 * c.s} y={c.y + 22 * c.s} color={INK.blue} r={0.9} />
    </G>
  );
}

function Snake({ id }: { id: string; lit?: boolean }) {
  return (
    <G>
      {/* the stage end: a steel fan-out box — two rows of XLR inputs, two returns */}
      <Rect x={4} y={34} width={30} height={20} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={4} y={34} width={30} height={20} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      {[0, 1, 2, 3, 4].map((i) => (
        <G key={i}>
          <Circle cx={8.5 + i * 5.2} cy={39} r={1.9} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.6} />
          <Circle cx={8.5 + i * 5.2} cy={45} r={1.9} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.6} />
        </G>
      ))}
      <Circle cx={10} cy={50.5} r={1.9} fill="#0a0b0d" stroke={INK.amber} strokeWidth={0.6} />
      <Circle cx={16} cy={50.5} r={1.9} fill="#0a0b0d" stroke={INK.amber} strokeWidth={0.6} />
      {/* the multicore leaving the box for its drum */}
      <Path d="M 34 42 C 42 42 46 38 48 32" stroke="#1b2a36" strokeWidth={6.5} fill="none" strokeLinecap="round" />
      <Path d="M 34 42 C 42 42 46 38 48 32" stroke="#2f7f9f" strokeWidth={4.2} fill="none" strokeLinecap="round" />
      <Path d="M 34 42 C 42 42 46 38 48 32" stroke="#7fc3df" strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.5} />
      {/* the cable drum, seen from the side: flange, wound cable, hub */}
      <Line x1={40} y1={30} x2={37} y2={38} stroke={INK.metalMid} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={56} y1={30} x2={59} y2={38} stroke={INK.metalMid} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={48} cy={20} r={12.5} fill={INK.metalLo} stroke="#000" strokeWidth={0.6} />
      <Circle cx={48} cy={20} r={10} fill="#1b2a36" />
      <Circle cx={48} cy={20} r={9} fill="none" stroke="#2f7f9f" strokeWidth={1.3} strokeDasharray="2.2 1.4" />
      <Circle cx={48} cy={20} r={6.4} fill="none" stroke="#2f7f9f" strokeWidth={1.3} strokeDasharray="2.2 1.4" />
      <Circle cx={48} cy={20} r={3.8} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.5} />
      <Circle cx={48} cy={20} r={1.3} fill="#000" />
    </G>
  );
}

/**
 * Rack-mount digital stagebox, 3U: 482.6 × 133.4 × 280 mm. Two rows of eight
 * XLR-F mic inputs (55 mm pitch, signal LED over each), a row of six XLR-M
 * outputs, and the primary + redundant network ports.
 */
function Stagebox({ id, lit, legends = true }: { id: string; lit: boolean; legends?: boolean }) {
  const c = chassisFit(RACK_W, 3 * RACK_U, 280, RACK_EAR, 60, 33);
  const col = (i: number) => 66 + i * 49;
  return (
    <G>
      <ChassisShell id={id} c={c} vents={4}>
        <EarSlotsMm units={3} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <G key={i}>
            <XlrMm cx={col(i)} cy={30} />
            <XlrMm cx={col(i)} cy={72} />
          </G>
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <XlrMm key={i} cx={col(i)} cy={110} male ring={INK.amber} />
        ))}
        {/* network: primary + redundant (rugged RJ45 housings) */}
        {[col(6), col(7)].map((nx) => (
          <G key={nx}>
            <Rect x={nx - 13} y={97} width={26} height={26} rx={4} fill="#121418" stroke="#30343b" strokeWidth={0.8} />
            <Rect x={nx - 7} y={104} width={14} height={11} rx={1.2} fill="#050607" stroke={INK.metalHi} strokeWidth={1} />
          </G>
        ))}
      </ChassisShell>
      {/* signal LEDs over each input (drawn in glyph units so they read) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <G key={i}>
          <Led x={c.x + col(i) * c.s + 1.6} y={c.y + 14 * c.s} color={INK.green} on={lit && i !== 5} r={0.42} />
          <Led x={c.x + col(i) * c.s + 1.6} y={c.y + 56 * c.s} color={INK.green} on={lit && i < 3} r={0.42} />
        </G>
      ))}
      <Led on={lit} x={c.x + (col(6) + 15) * c.s} y={c.y + 125 * c.s} color={INK.blue} r={0.45} />
      {/* silk-screen brackets grouping the inputs (tape) and the outputs (amber) — marks, not text */}
      {legends ? <Line x1={c.x + 36 * c.s} y1={c.y + 16 * c.s} x2={c.x + 36 * c.s} y2={c.y + 86 * c.s} stroke={INK.tape} strokeWidth={0.4} opacity={0.7} /> : null}
      {legends ? <Line x1={c.x + 36 * c.s} y1={c.y + 97 * c.s} x2={c.x + 36 * c.s} y2={c.y + 123 * c.s} stroke={INK.amber} strokeWidth={0.4} opacity={0.7} /> : null}
    </G>
  );
}

/**
 * Compact digital mixing console, seen from the mix position (35° above the
 * work surface): 560 W × 500 D mm surface, a 60 mm front lip / armrest and a
 * 150 mm touchscreen bridge raked back 20° at the rear. Eight channel strips
 * at 50 mm pitch (gain, two EQ, aux, pan, MUTE, SELECT, a 100 mm fader) and
 * the master section (meter, encoder, main fader). Authored in mm; depth
 * foreshortened by sin 35° = 0.574, the bridge by 0.96, the lip by cos 35°.
 */
const CON_S = 58 / 560;
const CON_FADERS = [392, 410, 372, 420, 360, 398, 384, 412];
function Console({ id, lit }: { id: string; lit: boolean }) {
  const s = CON_S;
  const x0 = 3;
  const yBridge = 7.2;
  const ySurf = yBridge + 144 * s;
  const yLip = ySurf + 500 * s * 0.574;
  return (
    <G>
      {/* contact shadow */}
      <Rect x={x0 + 1} y={yLip + 49 * s * 0.574} width={58} height={1.6} rx={0.8} fill="#000" opacity={0.4} />
      {/* rear bridge: the touchscreen in its housing */}
      <G transform={`translate(${x0}, ${yBridge}) scale(${s}, ${s * 0.96})`}>
        <Path d="M 14 0 L 546 0 L 560 150 L 0 150 Z" fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={4} />
        <Rect x={150} y={16} width={300} height={118} rx={6} fill={`url(#${id}-lcd)`} stroke="#1f3a55" strokeWidth={4} />
        {/* the screen's channel meters + a fader bank row */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <G key={i}>
            <Rect x={166 + i * 34} y={34} width={10} height={70} fill="#0b1520" />
            <Rect x={166 + i * 34} y={34 + 70 - (CON_FADERS[i] - 330) * 0.7} width={10} height={(CON_FADERS[i] - 330) * 0.7} fill={i === 3 ? INK.amber : INK.green} opacity={lit ? 0.85 : 0.2} />
          </G>
        ))}
        <Rect x={160} y={112} width={280} height={12} rx={2} fill="#1f3a55" />
        {/* master LED meters left of the screen */}
        {[0, 1].map((ch) => (
          <G key={ch}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
              <Rect key={k} x={60 + ch * 26} y={118 - k * 12} width={16} height={8} rx={1} fill={k >= 7 ? INK.red : k >= 5 ? INK.amber : INK.green} opacity={lit && k < 5 ? 0.9 : 0.18} />
            ))}
          </G>
        ))}
      </G>
      {/* work surface */}
      <G transform={`translate(${x0}, ${ySurf}) scale(${s}, ${s * 0.574})`}>
        <Rect x={0} y={0} width={560} height={500} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={4} />
        <Rect x={4} y={4} width={552} height={10} fill="#fff" opacity={0.06} />
        {CON_FADERS.map((cap, i) => {
          const cx = 45 + i * 50;
          return (
            <G key={i}>
              {[40, 88, 128, 170, 210].map((ky, k) => (
                <G key={ky}>
                  <Circle cx={cx} cy={ky} r={k === 0 ? 9 : 7.5} fill="#08090b" />
                  <Circle cx={cx} cy={ky - 2} r={k === 0 ? 8 : 6.5} fill={`url(#${id}-metal)`} />
                </G>
              ))}
              <Rect x={cx - 11} y={240} width={22} height={14} rx={2} fill={lit && i === 5 ? INK.red : '#2b2f35'} stroke="#000" strokeWidth={2} />
              <Rect x={cx - 11} y={266} width={22} height={14} rx={2} fill={lit && i === 2 ? INK.amber : '#2b2f35'} stroke="#000" strokeWidth={2} />
              {/* fader slot + cap */}
              <Rect x={cx - 2.5} y={310} width={5} height={150} rx={2.5} fill="#030304" />
              <Rect x={cx - 10} y={cap} width={20} height={28} rx={3} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={2} />
              <Rect x={cx - 9} y={cap + 12} width={18} height={4} fill="#e8e8ea" />
              <Rect x={cx - 18} y={474} width={36} height={18} rx={2} fill={INK.tape} opacity={0.9} />
            </G>
          );
        })}
        {/* master: big encoder, buttons, main fader (red line) */}
        <Circle cx={490} cy={80} r={22} fill="#08090b" />
        <Circle cx={490} cy={76} r={19} fill={`url(#${id}-metal)`} />
        {[0, 1, 2].map((k) => (
          <Rect key={k} x={448 + k * 30} y={150} width={22} height={16} rx={2} fill="#2b2f35" stroke="#000" strokeWidth={2} />
        ))}
        <Rect x={497.5} y={310} width={5} height={150} rx={2.5} fill="#030304" />
        <Rect x={488} y={350} width={24} height={30} rx={3} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={2} />
        <Rect x={489} y={363} width={22} height={4} fill={INK.red} />
      </G>
      {/* front lip / armrest */}
      <G transform={`translate(${x0}, ${yLip}) scale(${s}, ${s * 0.819})`}>
        <Rect x={0} y={0} width={560} height={60} rx={10} fill="#111215" stroke="#000" strokeWidth={4} />
        <Rect x={10} y={6} width={540} height={10} rx={5} fill="#fff" opacity={0.09} />
      </G>
      <Led on={lit} x={x0 + 530 * s} y={ySurf + 30 * s * 0.574} color={INK.amber} r={0.8} />
    </G>
  );
}

/**
 * 1U system processor (loudspeaker management): 482.6 × 44.45 × 300 mm.
 * Front: the LCD (a crossover on it), the edit encoder, input + output
 * meter LEDs, mutes, power.
 */
function Processor({ id, lit }: { id: string; lit: boolean }) {
  const c = chassisFit(RACK_W, RACK_U, 300, RACK_EAR, 60, 32);
  return (
    <G>
      <ChassisShell id={id} c={c} vents={4}>
        <EarSlotsMm units={1} />
        <Rect x={46} y={8} width={124} height={28} rx={2} fill={`url(#${id}-lcd)`} stroke="#1f3a55" strokeWidth={1.2} />
        <Path d="M 54 31 C 80 31 88 14 102 14 C 118 14 124 31 160 31" stroke={INK.blue} strokeWidth={2.4} fill="none" />
        <Circle cx={196} cy={22} r={12} fill="#08090b" />
        <Circle cx={196} cy={21} r={10} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.8} />
        {/* six mute keys under the output meters */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Rect key={i} x={300 + i * 22} y={27} width={14} height={9} rx={1.5} fill="#2b2f35" stroke="#000" strokeWidth={0.6} />
        ))}
        <Rect x={436} y={14} width={10} height={18} rx={2} fill="#0a0b0d" stroke="#3a3f47" strokeWidth={0.8} />
      </ChassisShell>
      {/* meter LEDs: inputs A/B, outputs 1–6 (signal + limit) */}
      {[0, 1].map((i) => (
        <Led key={`i${i}`} x={c.x + (252 + i * 18) * c.s} y={c.y + 15 * c.s} color={INK.green} on={lit} r={0.45} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Led key={`o${i}`} x={c.x + (307 + i * 22) * c.s} y={c.y + 15 * c.s} color={i === 5 ? INK.amber : INK.green} on={lit && i !== 5} r={0.45} />
      ))}
    </G>
  );
}

/**
 * 2U two-channel power amplifier: 482.6 × 88.9 × 400 mm. Front handles,
 * the fan intake grille, per-channel LED ladder (signal · −10 · limit · clip)
 * beside its detented attenuator, the power rocker and its lamp.
 */
function Amp({ id, lit, legends = true }: { id: string; lit: boolean; legends?: boolean }) {
  const c = chassisFit(RACK_W, 2 * RACK_U, 400, RACK_EAR, 60, 33);
  const chX = (ch: number) => 250 + ch * 92;
  return (
    <G>
      <ChassisShell id={id} c={c} vents={5}>
        <EarSlotsMm units={2} />
        {/* handles */}
        {[38, 432].map((hx) => (
          <G key={hx}>
            <Rect x={hx} y={10} width={12} height={69} rx={6} fill={`url(#${id}-tube)`} stroke="#000" strokeWidth={0.8} />
            <Rect x={hx - 2} y={8} width={16} height={8} rx={2} fill="#15171b" />
            <Rect x={hx - 2} y={73} width={16} height={8} rx={2} fill="#15171b" />
          </G>
        ))}
        {/* fan intake grille */}
        <Rect x={70} y={12} width={130} height={65} rx={4} fill="#08090b" stroke="#2a2e35" strokeWidth={0.8} />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Line key={i} x1={76} y1={18 + i * 6.6} x2={194} y2={18 + i * 6.6} stroke="#2a2e35" strokeWidth={2.4} />
        ))}
        {/* attenuators */}
        {[0, 1].map((ch) => (
          <G key={ch}>
            <Circle cx={chX(ch) + 40} cy={36} r={15} fill="#08090b" />
            <Circle cx={chX(ch) + 40} cy={35} r={12.5} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.8} />
            <Line x1={chX(ch) + 40} y1={24} x2={chX(ch) + 40} y2={33} stroke={INK.amber} strokeWidth={2.4} />
          </G>
        ))}
        {/* power rocker */}
        <Rect x={404} y={22} width={16} height={36} rx={3} fill="#0a0b0d" stroke="#3a3f47" strokeWidth={0.8} />
        <Rect x={406} y={lit ? 24 : 40} width={12} height={16} rx={2} fill={lit ? INK.green : INK.metalHi} />
      </ChassisShell>
      {[0, 1].map((ch) =>
        [0, 1, 2, 3].map((i) => (
          <Led key={`${ch}-${i}`} x={c.x + (chX(ch) + 6) * c.s} y={c.y + (70 - i * 15) * c.s} color={i === 3 ? INK.red : i === 2 ? INK.amber : INK.green} on={lit && i < 3} r={0.45} />
        )),
      )}
      <Led on={lit} x={c.x + 412 * c.s} y={c.y + 72 * c.s} color={INK.blue} r={0.55} />
      {legends
        ? [0, 1].map((ch) => (
            <Rect key={ch} x={c.x + (chX(ch) + 28) * c.s} y={c.y + 62 * c.s} width={24 * c.s} height={9 * c.s} rx={0.2} fill={INK.tape} opacity={0.55} />
          ))
        : null}
    </G>
  );
}

/**
 * Two-way full-range "top": 12-inch woofer + 1-inch-exit compression driver
 * on a 90° × 50° constant-directivity horn. Cabinet 380 W × 620 H mm (front
 * shown, grille off so the drivers read). Horn mouth 270 × 150 mm at the
 * top, the 12-inch frame Ø310 below it, a slot port under the woofer.
 */
const TOP_S = 52 / 620;
function TopCabinet({ id, lit, powered }: { id: string; lit: boolean; powered: boolean }) {
  const s = TOP_S;
  const x0 = 32 - (380 * s) / 2;
  const y0 = 6;
  return (
    <G>
      <Rect x={x0 + 1.6} y={y0 + 2.4} width={380 * s} height={620 * s} rx={1.6} fill={INK.shadow} />
      <G transform={`translate(${x0}, ${y0}) scale(${s})`}>
        <Rect x={0} y={0} width={380} height={620} rx={18} fill={`url(#${id}-cab)`} stroke="#000" strokeWidth={8} />
        <Line x1={14} y1={8} x2={366} y2={8} stroke="#fff" strokeWidth={7} opacity={0.14} />
        {/* the baffle, inset 18 mm (the grille frame's edge) */}
        <Rect x={18} y={18} width={344} height={584} rx={6} fill={INK.grille} />
        {/* horn: mouth, flared walls to the throat, the driver's exit */}
        <Rect x={55} y={34} width={270} height={150} rx={10} fill="#08090b" stroke="#3a3f47" strokeWidth={6} />
        <Path d="M 58 37 L 160 96 L 160 122 L 58 181 Z" fill="#121418" />
        <Path d="M 322 37 L 220 96 L 220 122 L 322 181 Z" fill="#0e1013" />
        <Path d="M 58 37 L 322 37 L 220 96 L 160 96 Z" fill="#17191d" />
        <Path d="M 58 181 L 322 181 L 220 122 L 160 122 Z" fill="#0b0c0f" />
        <Rect x={160} y={96} width={60} height={26} rx={4} fill="#000" />
        {/* woofer */}
        <DriverMm id={id} cx={190} cy={378} d={310} />
        {/* slot port */}
        <Rect x={50} y={556} width={280} height={30} rx={15} fill="#000" stroke="#2a2e35" strokeWidth={3} />
        {/* corner protectors */}
        {[
          [0, 0],
          [340, 0],
          [0, 580],
          [340, 580],
        ].map(([cx, cy]) => (
          <Rect key={`${cx}-${cy}`} x={cx} y={cy} width={40} height={40} rx={10} fill={INK.metalLo} stroke="#000" strokeWidth={3} />
        ))}
      </G>
      {/* side handle pocket (just showing past the left edge) */}
      <Rect x={x0 - 1.4} y={y0 + 270 * s} width={1.6} height={90 * s} rx={0.6} fill={INK.metalLo} />
      {powered ? <Led on={lit} x={x0 + 330 * s} y={y0 + 570 * s} color={INK.blue} r={0.9} /> : null}
    </G>
  );
}

/**
 * Single-18 vented subwoofer, front-loaded: 540 W × 700 H mm (front shown).
 * The 18-inch frame (Ø460) nearly fills the width — that is what a sub
 * looks like — with the full-width slot port below it.
 */
const SUB_S = 52 / 700;
function SubCabinet({ id, lit, powered }: { id: string; lit: boolean; powered: boolean }) {
  const s = SUB_S;
  const x0 = 32 - (540 * s) / 2;
  const y0 = 6;
  return (
    <G>
      <Rect x={x0 + 1.6} y={y0 + 2.4} width={540 * s} height={700 * s} rx={1.6} fill={INK.shadow} />
      <G transform={`translate(${x0}, ${y0}) scale(${s})`}>
        <Rect x={0} y={0} width={540} height={700} rx={18} fill={`url(#${id}-cab)`} stroke="#000" strokeWidth={8} />
        <Line x1={14} y1={8} x2={526} y2={8} stroke="#fff" strokeWidth={7} opacity={0.14} />
        <Rect x={18} y={18} width={504} height={664} rx={6} fill={INK.grille} />
        <DriverMm id={id} cx={270} cy={272} d={460} />
        {/* full-width slot port */}
        <Rect x={38} y={548} width={464} height={88} rx={10} fill="#000" stroke="#2a2e35" strokeWidth={4} />
        <Rect x={46} y={556} width={448} height={12} rx={6} fill="#2a2e35" opacity={0.6} />
        {[
          [0, 0],
          [500, 0],
          [0, 660],
          [500, 660],
        ].map(([cx, cy]) => (
          <Rect key={`${cx}-${cy}`} x={cx} y={cy} width={40} height={40} rx={10} fill={INK.metalLo} stroke="#000" strokeWidth={3} />
        ))}
      </G>
      {powered ? <Led on={lit} x={x0 + 480 * s} y={y0 + 660 * s} color={INK.blue} r={0.9} /> : null}
    </G>
  );
}

/**
 * Floor wedge (12-inch + compression driver, side by side on the baffle):
 * 560 W × 380 D × 350 H mm; the profile rises from a 90 mm lip on the
 * performer's side to 350 mm at the back, so the baffle (460 mm along its
 * slope) looks up at ~34°. Drawn as the side profile in true shape with the
 * width receding up-left (cabinet oblique), the baffle mapped by an affine
 * matrix so the round woofer foreshortens correctly.
 */
const WEDGE = (() => {
  const W = 560;
  const D = 380;
  const lip = 90;
  const back = 350;
  const k = 0.5;
  const ang = (30 * Math.PI) / 180;
  const rx = -W * k * Math.cos(ang); // width recedes up-LEFT
  const ry = -W * k * Math.sin(ang);
  const s = 58 / (D - rx);
  const ox = 3 - rx * s; // the near side panel's left edge
  const oy = 56;
  const P = (z: number, y: number, far: boolean) => [ox + z * s + (far ? rx * s : 0), oy - y * s + (far ? ry * s : 0)] as const;
  const pts = (list: (readonly [number, number])[]) => list.map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`).join(' ');
  const A = P(0, lip, false);
  const B = P(D, back, false);
  const C = P(D, back, true);
  const Dd = P(0, lip, true);
  const slope = Math.hypot(D, back - lip);
  // baffle-local mm (u along the slope from the lip, v across from the near side) → glyph
  const m = [(B[0] - A[0]) / slope, (B[1] - A[1]) / slope, (Dd[0] - A[0]) / W, (Dd[1] - A[1]) / W, A[0], A[1]];
  return {
    side: pts([P(0, 0, false), P(D, 0, false), B, A]),
    baffle: pts([A, B, C, Dd]),
    back: pts([B, P(D, 0, false), P(D, 0, true), C]),
    floorFar: P(0, 0, true),
    matrix: m.map((v) => v.toFixed(5)).join(' '),
    slope,
    W,
    feet: [P(40, 0, false), P(D - 40, 0, false)],
    handle: [P(D * 0.62, back * 0.62, false), P(D * 0.86, back * 0.62, false)],
    led: P(D * 0.5, 30, false),
    lipPt: A,
    topPt: B,
  };
})();
function Wedge({ id, lit, powered }: { id: string; lit: boolean; powered: boolean }) {
  return (
    <G>
      <Polygon points={`${WEDGE.side.split(' ')[0]} ${WEDGE.side.split(' ')[1]} ${WEDGE.back.split(' ')[2]} ${WEDGE.floorFar[0]},${WEDGE.floorFar[1]}`} fill="#000" opacity={0.35} transform="translate(0.8, 1)" />
      {/* the rear panel's edge (far side hidden) */}
      <Polygon points={WEDGE.back} fill="#0d0e11" stroke="#000" strokeWidth={0.4} />
      {/* baffle: grille frame, then the drivers in baffle-local mm */}
      <Polygon points={WEDGE.baffle} fill={`url(#${id}-cab)`} stroke="#000" strokeWidth={0.5} />
      <G transform={`matrix(${WEDGE.matrix})`}>
        <Rect x={16} y={16} width={WEDGE.slope - 32} height={WEDGE.W - 32} rx={6} fill={INK.grille} />
        <DriverMm id={id} cx={WEDGE.slope / 2} cy={190} d={310} />
        {/* horn, mouth ~240 × 140 mm, beside the woofer */}
        <Rect x={WEDGE.slope / 2 - 70} y={370} width={140} height={160} rx={8} fill="#08090b" stroke="#3a3f47" strokeWidth={5} />
        <Path d={`M ${WEDGE.slope / 2 - 66} 374 L ${WEDGE.slope / 2 - 12} 440 L ${WEDGE.slope / 2 - 12} 460 L ${WEDGE.slope / 2 - 66} 526 Z`} fill="#121418" />
        <Rect x={WEDGE.slope / 2 - 12} y={440} width={24} height={20} rx={3} fill="#000" />
      </G>
      {/* near side panel: the wedge profile, true shape */}
      <Polygon points={WEDGE.side} fill={`url(#${id}-side)`} stroke="#000" strokeWidth={0.5} />
      <Line x1={WEDGE.handle[0][0]} y1={WEDGE.handle[0][1]} x2={WEDGE.handle[1][0]} y2={WEDGE.handle[1][1]} stroke="#000" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={WEDGE.handle[0][0]} y1={WEDGE.handle[0][1] + 0.7} x2={WEDGE.handle[1][0]} y2={WEDGE.handle[1][1] + 0.7} stroke="#3a3f47" strokeWidth={0.4} strokeLinecap="round" />
      <Line x1={WEDGE.lipPt[0]} y1={WEDGE.lipPt[1]} x2={WEDGE.topPt[0]} y2={WEDGE.topPt[1]} stroke="#fff" strokeWidth={0.5} opacity={0.2} />
      {/* rubber feet */}
      {WEDGE.feet.map(([fx, fy]) => (
        <Rect key={fx} x={fx - 2} y={fy} width={4} height={1.2} rx={0.5} fill="#000" />
      ))}
      {powered ? <Led on={lit} x={WEDGE.led[0]} y={WEDGE.led[1]} color={INK.blue} r={0.9} /> : null}
    </G>
  );
}

/**
 * Half-rack, 1U stereo in-ear transmitter: 212 × 44 × 180 mm, one λ/4 whip on
 * the rear BNC. Front: LCD (TX · ST), headphone monitor jack + level, power.
 */
function IemTx({ id, lit, legends = true }: { id: string; lit: boolean; legends?: boolean }) {
  const c = chassisFit(212, RACK_U, 180, 0, 48, 42);
  const ant = 150 * c.s;
  const ax = c.x + c.w + c.dx - 1.6;
  const ay = c.y - c.dy + 0.6;
  return (
    <G>
      <G transform={`rotate(12 ${ax} ${ay})`}>
        <Rect x={ax - 0.9} y={ay - 2.2} width={1.8} height={2.4} rx={0.4} fill={INK.metalMid} />
        <Line x1={ax} y1={ay - 2} x2={ax} y2={ay - ant} stroke="#1b1e23" strokeWidth={1.3} strokeLinecap="round" />
        <Line x1={ax - 0.3} y1={ay - 2.5} x2={ax - 0.3} y2={ay - ant + 0.6} stroke="#fff" strokeWidth={0.3} opacity={0.2} />
      </G>
      {/* radio: two arcs off the whip */}
      <Path d={`M ${ax - 2.5} ${ay - ant + 4} A 6 6 0 0 0 ${ax - 5} ${ay - ant + 11}`} stroke={INK.blue} strokeWidth={0.7} fill="none" opacity={0.7} />
      <Path d={`M ${ax - 4.5} ${ay - ant + 1.5} A 10 10 0 0 0 ${ax - 8.5} ${ay - ant + 13}`} stroke={INK.blue} strokeWidth={0.7} fill="none" opacity={0.4} />
      <ChassisShell id={id} c={c} vents={3}>
        <Rect x={18} y={8} width={80} height={28} rx={2} fill={`url(#${id}-lcd)`} stroke="#1f3a55" strokeWidth={0.8} />
        {/* ¼-inch monitor jack + its level knob */}
        <Circle cx={118} cy={22} r={7} fill="#2b2f35" stroke="#000" strokeWidth={0.6} />
        <Circle cx={118} cy={22} r={3.4} fill="#000" />
        <Circle cx={146} cy={22} r={10} fill="#0b0c0f" />
        <Circle cx={146} cy={22} r={8} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.6} />
        <Circle cx={186} cy={22} r={6} fill="#15171b" stroke="#3a3f47" strokeWidth={0.8} />
      </ChassisShell>
      <Led on={lit} x={c.x + 170 * c.s} y={c.y + 22 * c.s} color={INK.red} r={0.9} />
      {/* the LCD's L / R level bars (the old "TX · ST" legend was sub-9 text) */}
      {[0, 1].map((ch) => (
        <Rect key={ch} x={c.x + 26 * c.s} y={c.y + (14 + ch * 10) * c.s} width={(legends ? 52 : 44) * c.s * (lit ? 1 : 0.3)} height={5 * c.s} fill={INK.blue} opacity={0.85} />
      ))}
    </G>
  );
}

/**
 * In-ear bodypack receiver + universal-fit earphones.
 * Pack: 64 W × 90 H × 22 D mm, belt clip on the back, the flexible whip
 * (~70 mm) and the volume knob + 3.5 mm earphone jack on the top panel.
 * Earphones: two universal shells (~20 × 14 mm) with nozzles, over-ear cable
 * to a Y-split and the 3.5 mm plug. Drawn at 0.3 u/mm.
 */
const PACK_S = 0.3;
function IemPack({ id, lit }: { id: string; lit: boolean }) {
  const s = PACK_S;
  const x0 = 29;
  const y0 = 30;
  const W = 64 * s;
  const H = 90 * s;
  const jackX = x0 + 14 * s;
  const knobX = x0 + 32 * s;
  const antX = x0 + 52 * s;
  return (
    <G>
      {/* earphones: two shells, the cable from each joins at the Y-split */}
      <Path d={`M ${jackX} ${y0 - 4.6} C ${jackX} ${y0 - 9} ${jackX - 3} ${y0 - 11} ${jackX - 6} ${y0 - 12.5}`} stroke="#0d0e10" strokeWidth={0.9} fill="none" />
      <Path d={`M ${jackX - 6} ${y0 - 12.5} C ${jackX - 9} ${y0 - 14} ${jackX - 13} ${y0 - 15} ${jackX - 16.5} ${y0 - 19}`} stroke="#0d0e10" strokeWidth={0.7} fill="none" />
      <Path d={`M ${jackX - 6} ${y0 - 12.5} C ${jackX - 5} ${y0 - 16} ${jackX - 4} ${y0 - 19} ${jackX - 4.5} ${y0 - 23}`} stroke="#0d0e10" strokeWidth={0.7} fill="none" />
      <Rect x={jackX - 6.8} y={y0 - 13.2} width={1.6} height={1.4} rx={0.4} fill="#2b2f35" />
      {[
        [jackX - 18.5, y0 - 22.5, -20],
        [jackX - 6.5, y0 - 27, 15],
      ].map(([ex, ey, rot]) => (
        <G key={ex} transform={`rotate(${rot} ${ex} ${ey})`}>
          {/* shell (~20 × 14 mm) + nozzle */}
          <Path d={`M ${ex - 3} ${ey} C ${ex - 3} ${ey - 3} ${ex + 3} ${ey - 3.2} ${ex + 3.2} ${ey} C ${ex + 3.4} ${ey + 2.6} ${ex - 1} ${ey + 3} ${ex - 3} ${ey}`} fill="#1b1e23" stroke="#000" strokeWidth={0.3} />
          <Path d={`M ${ex - 2.2} ${ey - 1.2} C ${ex - 1} ${ey - 2.2} ${ex + 1.4} ${ey - 2.3} ${ex + 2.2} ${ey - 1.3}`} stroke="#fff" strokeWidth={0.35} fill="none" opacity={0.25} />
          <Rect x={ex + 2.6} y={ey + 0.2} width={2.2} height={1.5} rx={0.6} fill={INK.metalMid} />
          <Rect x={ex + 4.5} y={ey + 0.15} width={1.2} height={1.6} rx={0.7} fill="#8a6a3a" />
        </G>
      ))}
      {/* the 3.5 mm plug in the jack */}
      <Rect x={jackX - 1} y={y0 - 4.8} width={2} height={4.8} rx={0.6} fill="#24272d" stroke="#000" strokeWidth={0.25} />
      {/* whip antenna, rubber tip */}
      <Line x1={antX} y1={y0} x2={antX} y2={y0 - 70 * s} stroke="#1b1e23" strokeWidth={1.1} strokeLinecap="round" />
      <Circle cx={antX} cy={y0 - 70 * s} r={0.75} fill="#1b1e23" />
      {/* volume knob on the top panel */}
      <Rect x={knobX - 2} y={y0 - 2.2} width={4} height={2.4} rx={0.8} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.25} />
      {/* belt clip, seen past the right edge */}
      <Path d={`M ${x0 + W - 0.4} ${y0 + 2} L ${x0 + W + 1.2} ${y0 + 2.5} L ${x0 + W + 1.2} ${y0 + H - 4} L ${x0 + W - 0.4} ${y0 + H - 2}`} fill={INK.metalMid} stroke="#000" strokeWidth={0.3} />
      {/* the pack */}
      <Rect x={x0 + 1} y={y0 + 1.5} width={W} height={H} rx={2.2} fill={INK.shadow} />
      <Rect x={x0} y={y0} width={W} height={H} rx={2.2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.5} />
      <Rect x={x0 + 0.5} y={y0 + 0.5} width={W - 1} height={1.6} rx={0.8} fill="#fff" opacity={0.1} />
      {/* LCD + RF bars, keys, battery door seam */}
      <Rect x={x0 + 9 * s} y={y0 + 12 * s} width={46 * s} height={26 * s} rx={0.6} fill={`url(#${id}-lcd)`} stroke="#1f3a55" strokeWidth={0.4} />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={x0 + (14 + i * 8) * s} y={y0 + (32 - i * 4) * s} width={5 * s} height={(4 + i * 4) * s} fill={INK.green} opacity={lit ? 0.85 : 0.2} />
      ))}
      {[0, 1].map((i) => (
        <Rect key={i} x={x0 + (16 + i * 20) * s} y={y0 + 46 * s} width={12 * s} height={6 * s} rx={0.4} fill="#2b2f35" stroke="#000" strokeWidth={0.2} />
      ))}
      <Line x1={x0 + 2} y1={y0 + 62 * s} x2={x0 + W - 2} y2={y0 + 62 * s} stroke="#000" strokeWidth={0.4} />
      <Led on={lit} x={x0 + 52 * s} y={y0 + 49 * s} color={INK.green} r={0.6} />
    </G>
  );
}

function Distro({ id, lit }: { id: string; lit: boolean }) {
  return (
    <G>
      <Rect x={10} y={18} width={44} height={30} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={10} y={18} width={44} height={30} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={10.5} y={18.5} width={43} height={3} rx={1.5} fill="#fff" opacity={0.08} />
      {/* three breakers, all on — one colour, one state */}
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Rect x={15 + i * 8} y={22} width={5} height={9} rx={1} fill="#0a0b0d" stroke="#3a3f47" strokeWidth={0.5} />
          <Rect x={16 + i * 8} y={lit ? 23 : 27} width={3} height={4} rx={0.6} fill={INK.metalHi} />
        </G>
      ))}
      {/* outlets */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Rect x={14 + i * 9.5} y={35} width={7} height={8} rx={1.2} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.5} />
          <Rect x={16 + i * 9.5} y={37} width={1.2} height={3} fill="#3a3f47" />
          <Rect x={18.8 + i * 9.5} y={37} width={1.2} height={3} fill="#3a3f47" />
        </G>
      ))}
      {/* mains present + ground OK */}
      <Led on={lit} x={44} y={26} color={INK.green} r={1.2} />
      <Led on={lit} x={49} y={26} color={INK.green} r={1.2} />
    </G>
  );
}

/** The listener — the owner's line-art head icon (head fix 2026-10-08: one
 *  shared drawing app-wide, features/lab/headIconGeometry). The face-on
 *  ABOVE icon, a lone head (no shoulders): it reads face-on in a diagram and
 *  is the right view for a plan from above (Mastering's RoomDiagram). Scenes
 *  drawn side-on use the SIDE icon directly (Start Here). */
function Listener() {
  return <HeadIconSvg view="above" x={32} y={32.5} size={46} color={INK.metalHi} minStroke={1.5} />;
}

/* ── the one entry point ─────────────────────────────────────────────────── */

export type GlyphKind = GearKind | 'listener';

function Drawing({ kind, id, lit, legends = true }: { kind: GlyphKind; id: string; lit: boolean; legends?: boolean }) {
  switch (kind) {
    case 'vocalMic':
      return <VocalMic id={id} lit={lit} />;
    case 'instrumentMic':
      return <InstrumentMic id={id} lit={lit} />;
    case 'di':
      return <DiBox id={id} lit={lit} legends={legends} />;
    case 'playback':
      return <Playback id={id} lit={lit} />;
    case 'wirelessRx':
      return <WirelessRx id={id} lit={lit} />;
    case 'snake':
      return <Snake id={id} lit={lit} />;
    case 'stagebox':
      return <Stagebox id={id} lit={lit} legends={legends} />;
    case 'console':
      return <Console id={id} lit={lit} />;
    case 'processor':
      return <Processor id={id} lit={lit} />;
    case 'amp':
      return <Amp id={id} lit={lit} legends={legends} />;
    case 'poweredSpeaker':
      return <TopCabinet id={id} lit={lit} powered />;
    case 'passiveSpeaker':
      return <TopCabinet id={id} lit={lit} powered={false} />;
    case 'poweredSub':
      return <SubCabinet id={id} lit={lit} powered />;
    case 'passiveSub':
      return <SubCabinet id={id} lit={lit} powered={false} />;
    case 'wedge':
      return <Wedge id={id} lit={lit} powered={false} />;
    case 'poweredWedge':
      return <Wedge id={id} lit={lit} powered />;
    case 'iemTx':
      return <IemTx id={id} lit={lit} legends={legends} />;
    case 'iemPack':
      return <IemPack id={id} lit={lit} />;
    case 'powerDistro':
      return <Distro id={id} lit={lit} />;
    case 'listener':
      return <Listener />;
  }
}

let seq = 0;

/** Standalone glyph in its own <Svg>. `size` is the rendered square. */
/** `power: 'off'` draws every indicator dark — a device before power-up, or
 *  one nothing has reached yet. Default is lit. */
export type GearPower = 'on' | 'off';

/** `legends` draws the panel's silk-screen MARKINGS (the DI label plate, the
 *  stagebox IN / OUT brackets, the amp's channel scribble strips) as marks,
 *  never as text: lettering a few units tall in the 64-box is illegible at
 *  any size a glyph is drawn (owner 2026-09-25 — no text under 9 pt; art pass
 *  2026-10-10 replaced the last tiny lettering with marks). A DISPLAY passes
 *  `legends={false}`; cards and the hub keep the marks as texture. */
export function GearGlyph({ kind, size = 56, dim, label, power = 'on', legends = true }: { kind: GlyphKind; size?: number; dim?: boolean; label?: string; power?: GearPower; legends?: boolean }) {
  // One id per INSTANCE, minted once at mount. Minting one per RENDER (as
  // this did until 2026-09-25) gave every gradient a new id and every
  // url(#…) fill a new target on each parent re-render, so a row of eight
  // glyphs was rewritten in the DOM on every lane step of the gain-chain
  // pages — ~170 `id` attribute writes a step, measured in the web harness.
  const idRef = useRef<string | null>(null);
  if (idRef.current == null) idRef.current = `g${(seq = (seq + 1) % 100000)}`;
  const id = idRef.current;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={dim ? 0.38 : 1} accessible={!!label} accessibilityLabel={label} accessibilityElementsHidden={!label} importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}>
      <GearDefs id={id} />
      <Drawing kind={kind} id={id} lit={power !== 'off'} legends={legends} />
    </Svg>
  );
}

/** The same drawing placed INSIDE a larger <Svg> (the venue plot, the
 *  system diagram). The caller owns the <Svg>; `id` must be unique in it.
 *  Always on a display, so the panel legends are never drawn (see GearGlyph). */
export function GearInSvg({ kind, id, x, y, size = 40, dim, highlight, power = 'on' }: { kind: GlyphKind; id: string; x: number; y: number; size?: number; dim?: boolean; highlight?: string; power?: GearPower }) {
  const s = size / 64;
  return (
    <G>
      <GearDefs id={id} />
      {highlight ? <Circle cx={x} cy={y} r={size * 0.62} fill={highlight} opacity={0.16} /> : null}
      {highlight ? <Circle cx={x} cy={y} r={size * 0.62} fill="none" stroke={highlight} strokeWidth={1.2} opacity={0.8} /> : null}
      <G transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`} opacity={dim ? 0.4 : 1}>
        <Drawing kind={kind} id={id} lit={power !== 'off'} legends={false} />
      </G>
    </G>
  );
}
