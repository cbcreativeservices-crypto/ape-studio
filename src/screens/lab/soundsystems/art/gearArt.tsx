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
 * Pure SVG rather than Skia so the drawings load everywhere, including the
 * web preview, with no gate and no fallback card. Gradient ids are prefixed
 * per instance: two glyphs in one <Svg> must never share an id.
 *
 * Generic hardware — no brand likeness, no trade dress.
 */
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
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
      <LinearGradient id={`${id}-panel`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={INK.panelHi} />
        <Stop offset="1" stopColor={INK.panelLo} />
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
        <Stop offset="0" stopColor="#b7bdc6" />
        <Stop offset="0.6" stopColor="#6d747d" />
        <Stop offset="1" stopColor="#2b2f35" />
      </RadialGradient>
      <LinearGradient id={`${id}-glow`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={INK.amber} stopOpacity="0.9" />
        <Stop offset="1" stopColor={INK.amber} stopOpacity="0.2" />
      </LinearGradient>
    </Defs>
  );
}

/** A small illuminated indicator with a soft halo. */
function Led({ x, y, color, on = true, r = 1.6 }: { x: number; y: number; color: string; on?: boolean; r?: number }) {
  return (
    <G>
      {on ? <Circle cx={x} cy={y} r={r * 2.2} fill={color} opacity={0.22} /> : null}
      <Circle cx={x} cy={y} r={r} fill={on ? color : '#2a2d33'} stroke="#000" strokeWidth={0.4} />
    </G>
  );
}

/** A woofer: surround, cone, dust cap — the shape that says "loudspeaker". */
function Woofer({ id, cx, cy, r }: { id: string; cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#0a0b0d" />
      <Circle cx={cx} cy={cy} r={r * 0.9} fill={`url(#${id}-cone)`} stroke="#000" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={r * 0.36} fill={`url(#${id}-dust)`} />
      <Path d={`M ${cx - r * 0.7} ${cy - r * 0.55} A ${r * 0.85} ${r * 0.85} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.86}`} stroke={INK.rim} strokeWidth={0.8} fill="none" />
    </G>
  );
}

/** A horn mouth (the high-frequency section above the woofer). */
function Horn({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={1.5} fill="#08090b" />
      <Rect x={x + 1.2} y={y + 1.2} width={w - 2.4} height={h - 2.4} rx={1} fill="none" stroke="#3a3f47" strokeWidth={0.6} />
      <Line x1={x + w / 2} y1={y + 1.5} x2={x + w / 2} y2={y + h - 1.5} stroke="#2a2e35" strokeWidth={0.6} />
    </G>
  );
}

/** Rack ears + screws — what makes a box read as rack gear. */
function RackEars({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const s = (sx: number, sy: number) => <Circle key={`${sx}-${sy}`} cx={sx} cy={sy} r={1.1} fill="#0b0c0f" stroke="#4a5058" strokeWidth={0.5} />;
  return (
    <G>
      {s(x + 2.5, y + 3)}
      {s(x + 2.5, y + h - 3)}
      {s(x + w - 2.5, y + 3)}
      {s(x + w - 2.5, y + h - 3)}
    </G>
  );
}

/* ── the drawings ────────────────────────────────────────────────────────── */

function VocalMic({ id }: { id: string }) {
  return (
    <G>
      {/* stand */}
      <Ellipse cx={32} cy={59} rx={13} ry={3} fill="#0d0f13" />
      <Ellipse cx={32} cy={58} rx={12} ry={2.4} fill={`url(#${id}-metal)`} />
      <Line x1={32} y1={58} x2={32} y2={30} stroke={INK.metalMid} strokeWidth={2.2} />
      <Line x1={31.2} y1={58} x2={31.2} y2={30} stroke={INK.rim} strokeWidth={0.6} />
      {/* clip + body, angled toward the performer */}
      <G transform="rotate(-22 32 26)">
        <Path d="M 27 44 L 30 22 L 34 22 L 37 44 Z" fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
        <Line x1={29.2} y1={40} x2={31} y2={24} stroke={INK.rim} strokeWidth={0.7} />
        <Rect x={28} y={36} width={8} height={2} fill="#0b0c0f" opacity={0.6} />
        {/* capsule grille */}
        <Ellipse cx={32} cy={17} rx={7.5} ry={8} fill={`url(#${id}-grille)`} stroke="#0b0c0f" strokeWidth={0.6} />
        {[-4, 0, 4].map((dy) => (
          <Line key={dy} x1={25.5} y1={17 + dy} x2={38.5} y2={17 + dy} stroke="#0b0c0f" strokeWidth={0.5} opacity={0.8} />
        ))}
        <Ellipse cx={29.5} cy={13} rx={2.2} ry={1.4} fill="#fff" opacity={0.28} />
      </G>
    </G>
  );
}

function InstrumentMic({ id }: { id: string }) {
  return (
    <G>
      <Ellipse cx={30} cy={59} rx={11} ry={2.6} fill={`url(#${id}-metal)`} />
      <Line x1={30} y1={58} x2={30} y2={40} stroke={INK.metalMid} strokeWidth={2} />
      <Path d="M 30 40 L 16 30" stroke={INK.metalMid} strokeWidth={2} strokeLinecap="round" />
      <G transform="rotate(-52 16 30)">
        <Rect x={12} y={20} width={8} height={20} rx={2.5} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
        <Line x1={13.5} y1={22} x2={13.5} y2={38} stroke={INK.rim} strokeWidth={0.6} />
        <Rect x={11} y={14} width={10} height={8} rx={3} fill={`url(#${id}-grille)`} stroke="#0b0c0f" strokeWidth={0.5} />
        <Line x1={12} y1={17} x2={20} y2={17} stroke="#0b0c0f" strokeWidth={0.5} />
        <Line x1={12} y1={19.5} x2={20} y2={19.5} stroke="#0b0c0f" strokeWidth={0.5} />
      </G>
      {/* the drum it points at, suggested by a rim */}
      <Ellipse cx={46} cy={44} rx={13} ry={5} fill="none" stroke="#3a3f47" strokeWidth={1.2} />
      <Ellipse cx={46} cy={44} rx={13} ry={5} fill="#1a1d24" opacity={0.5} />
    </G>
  );
}

function DiBox({ id }: { id: string }) {
  return (
    <G>
      <Rect x={14} y={22} width={38} height={26} rx={3} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={14} y={22} width={38} height={26} rx={3} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={14.5} y={22.5} width={37} height={3} rx={1.5} fill="#fff" opacity={0.08} />
      {/* ¼-inch input and thru */}
      <Circle cx={22} cy={36} r={3.4} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.9} />
      <Circle cx={22} cy={36} r={1.2} fill="#000" />
      <Circle cx={32} cy={36} r={3.4} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.9} />
      <Circle cx={32} cy={36} r={1.2} fill="#000" />
      {/* XLR out */}
      <Circle cx={44} cy={36} r={4.2} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.9} />
      <Circle cx={42.4} cy={35} r={0.8} fill={INK.metalHi} />
      <Circle cx={45.6} cy={35} r={0.8} fill={INK.metalHi} />
      <Circle cx={44} cy={38} r={0.8} fill={INK.metalHi} />
      {/* ground lift */}
      <Rect x={26} y={43} width={12} height={2.6} rx={1.3} fill="#0a0b0d" />
      <Rect x={27} y={42.6} width={4} height={3.4} rx={1} fill={INK.metalHi} />
      <SvgText x={33} y={30} fontSize={5} fill={INK.tape} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">DI</SvgText>
    </G>
  );
}

function Playback({ id }: { id: string }) {
  return (
    <G>
      <Rect x={12} y={20} width={40} height={26} rx={3} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={12} y={20} width={40} height={26} rx={3} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={15} y={23} width={22} height={13} rx={1.5} fill="#0a1a2a" stroke="#1f3a55" strokeWidth={0.6} />
      <Polygon points="22,25.5 22,33.5 29,29.5" fill={INK.blue} />
      <Rect x={16} y={37} width={20} height={1.4} rx={0.7} fill="#2a2e35" />
      <Rect x={16} y={37} width={11} height={1.4} rx={0.7} fill={INK.blue} />
      <Circle cx={44} cy={29} r={4.5} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
      <Line x1={44} y1={25.5} x2={44} y2={29} stroke={INK.amber} strokeWidth={1} />
      <Led x={44} y={39} color={INK.green} />
      <Ellipse cx={32} cy={49} rx={20} ry={1.4} fill="#000" opacity={0.35} />
    </G>
  );
}

function WirelessRx({ id }: { id: string }) {
  return (
    <G>
      <Line x1={18} y1={30} x2={10} y2={10} stroke={INK.metalHi} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={46} y1={30} x2={54} y2={10} stroke={INK.metalHi} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={10} cy={10} r={1.6} fill={INK.metalHi} />
      <Circle cx={54} cy={10} r={1.6} fill={INK.metalHi} />
      <Rect x={10} y={30} width={44} height={18} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={10} y={30} width={44} height={18} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <RackEars x={10} y={30} w={44} h={18} />
      <Rect x={17} y={34} width={18} height={9} rx={1} fill="#0b1f12" stroke="#1d4a2a" strokeWidth={0.6} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={19 + i * 3} y={41 - i * 1.3} width={2} height={1.3 * i + 1} fill={INK.green} opacity={0.5 + i * 0.1} />
      ))}
      <Circle cx={44} cy={39} r={3.6} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
      <Led x={38} y={35} color={INK.blue} />
    </G>
  );
}

function Snake({ id }: { id: string }) {
  return (
    <G>
      <Rect x={8} y={36} width={26} height={16} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={8} y={36} width={26} height={16} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Circle cx={13 + i * 5.6} cy={41} r={2} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.6} />
          <Circle cx={13 + i * 5.6} cy={47.5} r={2} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.6} />
        </G>
      ))}
      {/* the coiled multipair, drawn as a ribbon with tone */}
      <Path d="M 34 44 C 46 44 52 34 46 24 C 40 14 26 18 30 28 C 33 36 46 34 50 26" stroke="#1b2a36" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M 34 44 C 46 44 52 34 46 24 C 40 14 26 18 30 28 C 33 36 46 34 50 26" stroke="#2f7f9f" strokeWidth={4.6} fill="none" strokeLinecap="round" />
      <Path d="M 34 44 C 46 44 52 34 46 24 C 40 14 26 18 30 28 C 33 36 46 34 50 26" stroke="#7fc3df" strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.55} />
    </G>
  );
}

function Stagebox({ id }: { id: string }) {
  return (
    <G>
      <Rect x={12} y={12} width={40} height={40} rx={3} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={12} y={12} width={40} height={40} rx={3} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <RackEars x={12} y={12} w={40} h={40} />
      {/* two columns of XLR inputs with signal LEDs */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Circle cx={22} cy={18 + i * 8} r={2.8} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.7} />
          <Circle cx={31} cy={18 + i * 8} r={2.8} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.7} />
          <Led x={26.5} y={18 + i * 8} color={INK.green} on={i < 3} r={0.9} />
          <Led x={35.5} y={18 + i * 8} color={INK.green} on={i !== 2} r={0.9} />
        </G>
      ))}
      {/* line outputs */}
      <Circle cx={44} cy={20} r={2.6} fill="#0a0b0d" stroke={INK.amber} strokeWidth={0.7} />
      <Circle cx={44} cy={28} r={2.6} fill="#0a0b0d" stroke={INK.amber} strokeWidth={0.7} />
      {/* network port + link LED */}
      <Rect x={40.5} y={36} width={8} height={6} rx={1} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.6} />
      <Led x={44.5} y={46} color={INK.blue} r={1.3} />
    </G>
  );
}

function Console({ id }: { id: string }) {
  const strips = [0, 1, 2, 3, 4, 5];
  return (
    <G>
      {/* surface, seen from above-front, with the armrest */}
      <Path d="M 6 24 L 58 24 L 60 50 L 4 50 Z" fill={INK.shadow} transform="translate(1,3)" />
      <Path d="M 6 24 L 58 24 L 60 50 L 4 50 Z" fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={4} y={50} width={56} height={4} rx={1} fill={INK.metalLo} />
      <Line x1={6.5} y1={24.5} x2={57.5} y2={24.5} stroke="#fff" strokeWidth={0.6} opacity={0.12} />
      {strips.map((i) => {
        const x = 10 + i * 6.4;
        const cap = 38 - (i % 3) * 3 - (i === 4 ? 4 : 0);
        return (
          <G key={i}>
            <Rect x={x + 1.9} y={29} width={1.4} height={16} rx={0.7} fill="#08090b" />
            <Rect x={x} y={cap} width={5.2} height={2.6} rx={0.6} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.3} />
            <Line x1={x + 0.6} y1={cap + 1.3} x2={x + 4.6} y2={cap + 1.3} stroke={INK.amber} strokeWidth={0.6} />
            <Circle cx={x + 2.6} cy={27} r={1.3} fill={`url(#${id}-metal)`} />
            <Rect x={x + 0.4} y={46.5} width={4.4} height={2} rx={0.4} fill={INK.tape} />
          </G>
        );
      })}
      {/* master section + screen */}
      <Rect x={49} y={27} width={8} height={7} rx={1} fill="#0a1a2a" stroke="#1f3a55" strokeWidth={0.5} />
      <Rect x={51.9} y={35} width={1.4} height={10} rx={0.7} fill="#08090b" />
      <Rect x={50} y={37} width={5.2} height={2.6} rx={0.6} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.3} />
      <Line x1={50.6} y1={38.3} x2={54.6} y2={38.3} stroke={INK.red} strokeWidth={0.6} />
      <Led x={53} y={47.5} color={INK.amber} r={1} />
    </G>
  );
}

function Processor({ id }: { id: string }) {
  return (
    <G>
      <Rect x={6} y={26} width={52} height={14} rx={1.5} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={6} y={26} width={52} height={14} rx={1.5} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <RackEars x={6} y={26} w={52} h={14} />
      <Rect x={13} y={29} width={20} height={8} rx={1} fill="#0b1520" stroke="#1f3a55" strokeWidth={0.5} />
      {/* a crossover curve on the display */}
      <Path d="M 14.5 35.5 C 19 35.5 20 30.5 23 30.5 C 26 30.5 27 35.5 31.5 35.5" stroke={INK.blue} strokeWidth={0.8} fill="none" />
      <Circle cx={39} cy={33} r={2.6} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
      <Line x1={39} y1={30.6} x2={39} y2={33} stroke={INK.amber} strokeWidth={0.8} />
      {[0, 1, 2, 3].map((i) => (
        <Led key={i} x={45 + i * 3} y={31} color={i === 3 ? INK.red : INK.green} on={i < 3} r={0.9} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Led key={i} x={45 + i * 3} y={35.5} color={INK.amber} on={i < 2} r={0.9} />
      ))}
    </G>
  );
}

function Amp({ id }: { id: string }) {
  return (
    <G>
      <Rect x={6} y={20} width={52} height={26} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={6} y={20} width={52} height={26} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <RackEars x={6} y={20} w={52} h={26} />
      {/* handles */}
      <Rect x={9} y={24} width={3} height={18} rx={1.5} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.3} />
      <Rect x={52} y={24} width={3} height={18} rx={1.5} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.3} />
      {/* fan grille */}
      <Rect x={16} y={24} width={16} height={18} rx={1} fill="#08090b" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Line key={i} x1={17} y1={26 + i * 2.8} x2={31} y2={26 + i * 2.8} stroke="#2a2e35" strokeWidth={0.8} />
      ))}
      {/* two channel meters + attenuators */}
      {[0, 1].map((ch) => (
        <G key={ch}>
          {[0, 1, 2, 3].map((i) => (
            <Led key={i} x={38 + i * 2.8} y={27 + ch * 9} color={i === 3 ? INK.red : i === 2 ? INK.amber : INK.green} on={i < 3} r={0.9} />
          ))}
          <Circle cx={39.5} cy={33 + ch * 9} r={2.2} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
          <Line x1={39.5} y1={31} x2={39.5} y2={33 + ch * 9} stroke={INK.amber} strokeWidth={0.7} />
        </G>
      ))}
      <Led x={48} y={43} color={INK.blue} r={1.1} />
    </G>
  );
}

function TopCabinet({ id, powered }: { id: string; powered: boolean }) {
  return (
    <G>
      {/* trapezoid front-loaded cabinet, slightly wider at the bottom */}
      <Path d="M 18 8 L 46 8 L 50 58 L 14 58 Z" fill={INK.shadow} transform="translate(2,3)" />
      <Path d="M 18 8 L 46 8 L 50 58 L 14 58 Z" fill={`url(#${id}-cab)`} stroke="#000" strokeWidth={0.7} />
      <Path d="M 18.8 8.8 L 45.2 8.8" stroke="#fff" strokeWidth={0.7} opacity={0.14} />
      <Path d="M 18.8 9 L 15.4 57" stroke="#fff" strokeWidth={0.5} opacity={0.08} />
      {/* grille inset */}
      <Path d="M 21 12 L 43 12 L 46.5 54 L 17.5 54 Z" fill={INK.grille} />
      <Horn x={24} y={15} w={16} h={10} />
      <Woofer id={id} cx={32} cy={41} r={11} />
      {/* handle + pole cup hint */}
      <Rect x={12} y={30} width={2.2} height={9} rx={1} fill={INK.metalLo} />
      {powered ? <Led x={44.5} y={55.5} color={INK.blue} r={1} /> : null}
    </G>
  );
}

function SubCabinet({ id, powered }: { id: string; powered: boolean }) {
  return (
    <G>
      <Rect x={8} y={16} width={48} height={40} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={8} y={16} width={48} height={40} rx={2} fill={`url(#${id}-cab)`} stroke="#000" strokeWidth={0.7} />
      <Line x1={9} y1={16.8} x2={55} y2={16.8} stroke="#fff" strokeWidth={0.7} opacity={0.14} />
      <Rect x={11} y={19} width={42} height={34} rx={1} fill={INK.grille} />
      <Woofer id={id} cx={28} cy={36} r={13.5} />
      {/* port slot */}
      <Rect x={45} y={22} width={5} height={28} rx={2.5} fill="#000" />
      <Rect x={45.8} y={23} width={1.2} height={26} rx={0.6} fill="#2a2e35" opacity={0.6} />
      {/* corner protectors */}
      {[
        [8, 16],
        [52, 16],
        [8, 52],
        [52, 52],
      ].map(([x, y]) => (
        <Rect key={`${x}${y}`} x={x} y={y} width={4} height={4} rx={1} fill={INK.metalLo} />
      ))}
      {powered ? <Led x={52} y={44} color={INK.blue} r={1} /> : null}
    </G>
  );
}

function Wedge({ id, powered }: { id: string; powered: boolean }) {
  return (
    <G>
      {/* the angled face, seen from the performer's side */}
      <Path d="M 6 54 L 40 22 L 58 26 L 58 54 Z" fill={INK.shadow} transform="translate(2,3)" />
      <Path d="M 6 54 L 40 22 L 58 26 L 58 54 Z" fill={`url(#${id}-cab)`} stroke="#000" strokeWidth={0.7} />
      <Path d="M 40 22 L 58 26" stroke="#fff" strokeWidth={0.8} opacity={0.16} />
      <Path d="M 12 52 L 40 26 L 54 29 L 54 52 Z" fill={INK.grille} />
      <G transform="rotate(-40 33 41)">
        <Horn x={24} y={26} w={14} h={7} />
      </G>
      <Woofer id={id} cx={38} cy={41} r={9} />
      <Rect x={6} y={54} width={52} height={3} rx={1} fill={INK.metalLo} />
      {powered ? <Led x={54.5} y={50} color={INK.blue} r={1} /> : null}
    </G>
  );
}

function IemTx({ id }: { id: string }) {
  return (
    <G>
      <Line x1={48} y1={30} x2={56} y2={10} stroke={INK.metalHi} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={56} cy={10} r={1.6} fill={INK.metalHi} />
      {/* radio waves */}
      <Path d="M 50 14 A 8 8 0 0 1 58 22" stroke={INK.blue} strokeWidth={0.8} fill="none" opacity={0.7} />
      <Path d="M 47 11 A 12 12 0 0 1 60 24" stroke={INK.blue} strokeWidth={0.8} fill="none" opacity={0.4} />
      <Rect x={10} y={30} width={44} height={18} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={10} y={30} width={44} height={18} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <RackEars x={10} y={30} w={44} h={18} />
      <Rect x={17} y={34} width={18} height={9} rx={1} fill="#0b1520" stroke="#1f3a55" strokeWidth={0.6} />
      <SvgText x={26} y={40.5} fontSize={4.5} fill={INK.blue} fontFamily={fonts.mono} textAnchor="middle">TX · ST</SvgText>
      <Circle cx={44} cy={39} r={3.6} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
      <Led x={38} y={35} color={INK.red} />
    </G>
  );
}

function IemPack({ id }: { id: string }) {
  return (
    <G>
      {/* earphones cable and buds */}
      <Path d="M 34 14 C 34 22 40 26 40 32" stroke="#2a2e35" strokeWidth={1.4} fill="none" />
      <Path d="M 34 14 C 34 22 28 26 28 32" stroke="#2a2e35" strokeWidth={1.4} fill="none" />
      <Ellipse cx={34} cy={12} rx={4} ry={3} fill={`url(#${id}-metal)`} />
      <Ellipse cx={42} cy={12} rx={4} ry={3} fill={`url(#${id}-metal)`} />
      <Path d="M 38 15 C 38 22 40 26 40 32" stroke="#2a2e35" strokeWidth={1.4} fill="none" />
      {/* the pack, belt clip */}
      <Rect x={22} y={30} width={22} height={28} rx={3} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={22} y={30} width={22} height={28} rx={3} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={22.5} y={30.5} width={21} height={3} rx={1.5} fill="#fff" opacity={0.08} />
      <Rect x={26} y={35} width={14} height={8} rx={1} fill="#0b1520" stroke="#1f3a55" strokeWidth={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x={27.5 + i * 3} y={41 - i} width={2} height={1 + i} fill={INK.green} opacity={0.8} />
      ))}
      <Circle cx={33} cy={50} r={3.2} fill={`url(#${id}-metal)`} stroke="#000" strokeWidth={0.4} />
      <Line x1={33} y1={47.2} x2={33} y2={50} stroke={INK.amber} strokeWidth={0.8} />
      <Line x1={46} y1={34} x2={46} y2={52} stroke={INK.metalMid} strokeWidth={2} strokeLinecap="round" />
    </G>
  );
}

function Distro({ id }: { id: string }) {
  return (
    <G>
      <Rect x={10} y={18} width={44} height={30} rx={2} fill={INK.shadow} transform="translate(2,3)" />
      <Rect x={10} y={18} width={44} height={30} rx={2} fill={`url(#${id}-panel)`} stroke="#000" strokeWidth={0.6} />
      <Rect x={10.5} y={18.5} width={43} height={3} rx={1.5} fill="#fff" opacity={0.08} />
      {/* breakers */}
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Rect x={15 + i * 8} y={22} width={5} height={9} rx={1} fill="#0a0b0d" stroke="#3a3f47" strokeWidth={0.5} />
          <Rect x={16 + i * 8} y={23} width={3} height={4} rx={0.6} fill={i === 2 ? INK.red : INK.metalHi} />
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
      <Led x={46} y={26} color={INK.green} r={1.2} />
      <Led x={50} y={26} color={INK.amber} r={1.2} />
    </G>
  );
}

/** Minimal line-art bald head (owner head-icon spec) — the listener. */
function Listener() {
  return (
    <G>
      <Path d="M 32 12 C 40 12 46 19 46 28 C 46 35 42 40 38 43 L 38 48 L 26 48 L 26 43 C 22 40 18 35 18 28 C 18 19 24 12 32 12 Z" fill="none" stroke={INK.metalHi} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M 18 28 C 15 27 14 32 17 34" fill="none" stroke={INK.metalHi} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M 46 28 C 49 27 50 32 47 34" fill="none" stroke={INK.metalHi} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M 22 50 C 22 52 42 52 42 50 L 44 58 L 20 58 Z" fill="none" stroke={INK.metalHi} strokeWidth={1.4} strokeLinejoin="round" />
    </G>
  );
}

/* ── the one entry point ─────────────────────────────────────────────────── */

export type GlyphKind = GearKind | 'listener';

function Drawing({ kind, id }: { kind: GlyphKind; id: string }) {
  switch (kind) {
    case 'vocalMic':
      return <VocalMic id={id} />;
    case 'instrumentMic':
      return <InstrumentMic id={id} />;
    case 'di':
      return <DiBox id={id} />;
    case 'playback':
      return <Playback id={id} />;
    case 'wirelessRx':
      return <WirelessRx id={id} />;
    case 'snake':
      return <Snake id={id} />;
    case 'stagebox':
      return <Stagebox id={id} />;
    case 'console':
      return <Console id={id} />;
    case 'processor':
      return <Processor id={id} />;
    case 'amp':
      return <Amp id={id} />;
    case 'poweredSpeaker':
      return <TopCabinet id={id} powered />;
    case 'passiveSpeaker':
      return <TopCabinet id={id} powered={false} />;
    case 'poweredSub':
      return <SubCabinet id={id} powered />;
    case 'passiveSub':
      return <SubCabinet id={id} powered={false} />;
    case 'wedge':
      return <Wedge id={id} powered={false} />;
    case 'poweredWedge':
      return <Wedge id={id} powered />;
    case 'iemTx':
      return <IemTx id={id} />;
    case 'iemPack':
      return <IemPack id={id} />;
    case 'powerDistro':
      return <Distro id={id} />;
    case 'listener':
      return <Listener />;
  }
}

let seq = 0;

/** Standalone glyph in its own <Svg>. `size` is the rendered square. */
export function GearGlyph({ kind, size = 56, dim, label }: { kind: GlyphKind; size?: number; dim?: boolean; label?: string }) {
  const id = `g${(seq = (seq + 1) % 100000)}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={dim ? 0.38 : 1} {...(label ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label } : {})}>
      <GearDefs id={id} />
      <Drawing kind={kind} id={id} />
    </Svg>
  );
}

/** The same drawing placed INSIDE a larger <Svg> (the venue plot, the
 *  system diagram). The caller owns the <Svg>; `id` must be unique in it. */
export function GearInSvg({ kind, id, x, y, size = 40, dim, highlight }: { kind: GlyphKind; id: string; x: number; y: number; size?: number; dim?: boolean; highlight?: string }) {
  const s = size / 64;
  return (
    <G>
      <GearDefs id={id} />
      {highlight ? <Circle cx={x} cy={y} r={size * 0.62} fill={highlight} opacity={0.16} /> : null}
      {highlight ? <Circle cx={x} cy={y} r={size * 0.62} fill="none" stroke={highlight} strokeWidth={1.2} opacity={0.8} /> : null}
      <G transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`} opacity={dim ? 0.4 : 1}>
        <Drawing kind={kind} id={id} />
      </G>
    </G>
  );
}
