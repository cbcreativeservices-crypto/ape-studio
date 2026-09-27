/**
 * STAGE 5 — the SORT and ROLE illustrations (owner 2026-09-26 art pass: the
 * items were drawn as 3-px grey outline pictograms — a ring for a J-hook, a
 * box for a tray — which do not teach anyone what the hardware looks like).
 *
 * Each item is now a small technical illustration of the real object, drawn
 * in neutral tones (steel, nylon, grey jackets) so the drawing never gives
 * the answer away — the verdict colour arrives with the feedback, not the
 * picture. Views chosen per object so its defining feature shows:
 *   J-hook (side, bundle seated in the J, beam clamp on a flange) · cable
 *   tray on a trapeze (end section, fill below the rails) · ladder rack (plan,
 *   cables on the rungs) · wire basket (3/4, two U frames + longitudinal
 *   wires) · EMT with a set-screw coupling and one-hole strap into a box ·
 *   surface raceway with its cover seam, elbow fitting and device box ·
 *   underfloor duct + flush service fitting (section) · vertical and
 *   horizontal managers with their fingers, beside/over patch fields · a wide
 *   two-hole saddle · a three-channel floor protector (section, hinged lid) ·
 *   copper water pipe on a clevis hanger · another system's (red) conduit ·
 *   an acoustic tile in its grid · a main tee with its hanger wire · a
 *   sprinkler line with a pendant head · loose unrated junk hardware.
 * viewBox 96 × 72 (the sort card and the role cards share one geometry).
 */
import { type ReactNode } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Callout, SvgCable, cableGeo, useUid } from '../svgArt';

export const ICON_VB_W = 96;
export const ICON_VB_H = 72;
export const ICON_ASPECT = ICON_VB_W / ICON_VB_H;

const JACKETS = ['#3d4048', '#5b5f67', '#2c2f35', '#4a4d55', '#6a6e76', '#34373e', '#52565e'];

type Ids = { zv: string; zh: string; cu: string; red: string; yel: string; blk: string; pvc: string; jkt: string; ss: string };

function Paints({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={`${id}zv`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#dfe3e8" />
        <Stop offset="0.45" stopColor="#a4aab2" />
        <Stop offset="1" stopColor="#5d636b" />
      </LinearGradient>
      <LinearGradient id={`${id}zh`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#5d636b" />
        <Stop offset="0.35" stopColor="#dfe3e8" />
        <Stop offset="1" stopColor="#6d737b" />
      </LinearGradient>
      <LinearGradient id={`${id}cu`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#f2b78a" />
        <Stop offset="0.45" stopColor="#c47a45" />
        <Stop offset="1" stopColor="#6e3d1d" />
      </LinearGradient>
      <LinearGradient id={`${id}red`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ff7a68" />
        <Stop offset="0.45" stopColor="#c8372b" />
        <Stop offset="1" stopColor="#6c1a13" />
      </LinearGradient>
      <LinearGradient id={`${id}yel`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#ffe27a" />
        <Stop offset="1" stopColor="#c99a1c" />
      </LinearGradient>
      <LinearGradient id={`${id}blk`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#4a4d54" />
        <Stop offset="1" stopColor="#15161a" />
      </LinearGradient>
      <LinearGradient id={`${id}pvc`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#f4f3ef" />
        <Stop offset="1" stopColor="#b9b7b0" />
      </LinearGradient>
      <RadialGradient id={`${id}jkt`} cx="36%" cy="32%" r="72%">
        <Stop offset="0" stopColor="#8a8e96" />
        <Stop offset="0.6" stopColor="#4a4d55" />
        <Stop offset="1" stopColor="#1e2025" />
      </RadialGradient>
      <LinearGradient id={`${id}ss`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#3a3c42" />
        <Stop offset="1" stopColor="#23252a" />
      </LinearGradient>
    </Defs>
  );
}

const u = (id: string): Ids => ({
  zv: `url(#${id}zv)`,
  zh: `url(#${id}zh)`,
  cu: `url(#${id}cu)`,
  red: `url(#${id}red)`,
  yel: `url(#${id}yel)`,
  blk: `url(#${id}blk)`,
  pvc: `url(#${id}pvc)`,
  jkt: `url(#${id}jkt)`,
  ss: `url(#${id}ss)`,
});

/** A cable seen end-on (cut or running into the page). */
function End({ x, y, r, p }: { x: number; y: number; r: number; p: Ids }) {
  return (
    <G>
      <Circle cx={x + r * 0.15} cy={y + r * 0.25} r={r} fill="rgba(0,0,0,0.45)" />
      <Circle cx={x} cy={y} r={r} fill={p.jkt} stroke="#111216" strokeWidth={0.35} />
      <Circle cx={x} cy={y} r={r * 0.55} fill="#141518" />
      <Circle cx={x - r * 0.22} cy={y} r={r * 0.2} fill="#d9d8d2" />
      <Circle cx={x + r * 0.22} cy={y} r={r * 0.2} fill="#8f949b" />
    </G>
  );
}

/** A cable running across the picture (side view). */
function Run({ pts, d = 3.2, i = 0 }: { pts: { x: number; y: number }[]; d?: number; i?: number }) {
  return <SvgCable geo={cableGeo(pts, d, 10)} d={d} jacket={JACKETS[i % JACKETS.length]} />;
}

function Screw({ x, y, r = 1.3 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#b9bec5" stroke="#3a3d43" strokeWidth={0.3} />
      <Line x1={x - r * 0.6} y1={y} x2={x + r * 0.6} y2={y} stroke="#3a3d43" strokeWidth={0.4} />
    </G>
  );
}

function Wall({ y0 = 0, y1 = ICON_VB_H }: { y0?: number; y1?: number }) {
  return <Rect x={0} y={y0} width={ICON_VB_W} height={y1 - y0} fill="#1c1d21" />;
}

function art(id: string, p: Ids): ReactNode {
  switch (id) {
    case 'jhook':
      return (
        <G>
          {/* I-beam bottom flange + web, a beam clamp on its edge */}
          <Rect x={30} y={0} width={5} height={6} fill="#5a5f67" />
          <Rect x={4} y={5} width={70} height={5} fill={p.zv} stroke="#23262b" strokeWidth={0.4} />
          <Path d="M40 3 H54 V15 H50 V10.4 H44 V15 H40 Z" fill={p.zv} stroke="#23262b" strokeWidth={0.4} />
          <Rect x={46} y={15} width={2} height={4} fill="#80868f" />
          {/* the J: formed steel strap with a wide, flared saddle */}
          <Path d="M47 19 V38 A14 14 0 0 0 75 38 V30" stroke="#2c2f34" strokeWidth={4.2} fill="none" strokeLinecap="round" />
          <Path d="M47 19 V38 A14 14 0 0 0 75 38 V30" stroke={p.zh} strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <Path d="M46.2 20 V38 A14.8 14.8 0 0 0 51 49" stroke="#ffffff" strokeWidth={0.5} fill="none" opacity={0.55} />
          {/* the bundle seated in the saddle — cables running into the page */}
          {[
            [55, 42.5],
            [61.5, 45.5],
            [68, 42.5],
            [58, 36.5],
            [64.8, 37.5],
            [61.5, 30.8],
          ].map(([x, y], i) => (
            <End key={i} x={x} y={y} r={3.3} p={p} />
          ))}
        </G>
      );
    case 'tray':
      return (
        <G>
          {/* trapeze: threaded rods to a strut channel */}
          {[12, 84].map((x) => (
            <G key={x}>
              <Line x1={x} y1={0} x2={x} y2={62} stroke="#9aa0a8" strokeWidth={1.4} />
              <Path d={[...Array(14)].map((_, k) => `M${x - 0.7} ${2 + k * 4} l1.4 1`).join('')} stroke="#5d636b" strokeWidth={0.4} />
              <Rect x={x - 2.2} y={62} width={4.4} height={2.2} fill="#80868f" />
            </G>
          ))}
          <Path d="M6 54 H90 V62 H6 Z M9 57 H87" fill={p.zv} stroke="#2c2f34" strokeWidth={0.5} />
          <Rect x={8} y={55} width={80} height={1.4} fill="#ffffff" opacity={0.35} />
          {/* the tray in section: floor + side rails + lips */}
          <Path d="M18 26 H21.5 V50.5 H74.5 V26 H78 V54 H18 Z" fill={p.zh} stroke="#2c2f34" strokeWidth={0.5} />
          <Path d="M18 26 H23.5 M72.5 26 H78" stroke="#c7ccd2" strokeWidth={1.4} />
          {/* fill below the rail tops */}
          {[25.5, 32.5, 39.5, 46.5, 53.5, 60.5, 67.5].map((x, i) => (
            <End key={x} x={x} y={47} r={3.3} p={p} />
          ))}
          {[29, 36, 43, 50, 57].map((x) => (
            <End key={`b${x}`} x={x} y={40.8} r={3.3} p={p} />
          ))}
        </G>
      );
    case 'ladder':
      return (
        <G>
          {/* plan view: two tube stringers, rungs every ~0.3 m, cable laid on */}
          {[10, 26, 42, 58, 74, 90].map((x) => (
            <Rect key={x} x={x - 1.8} y={17} width={3.6} height={38} fill={p.zh} stroke="#2c2f34" strokeWidth={0.35} />
          ))}
          <Rect x={2} y={12} width={92} height={6} rx={0.6} fill={p.zv} stroke="#2c2f34" strokeWidth={0.45} />
          <Rect x={2} y={54} width={92} height={6} rx={0.6} fill={p.zv} stroke="#2c2f34" strokeWidth={0.45} />
          {[26.5, 31, 35.5, 40, 44.5].map((y, i) => (
            <Run key={y} pts={[{ x: -2, y }, { x: 48, y: y + (i % 2 ? 0.4 : -0.3) }, { x: 98, y }]} d={4} i={i} />
          ))}
        </G>
      );
    case 'basket': {
      const front = 'M16 26 V50 Q16 54 20 54 H70 Q74 54 74 50 V26';
      const back = 'M26 18 V42 Q26 46 30 46 H80 Q84 46 84 42 V18';
      const longs: [number, number][] = [
        [16, 26],
        [16, 38],
        [16, 50],
        [24, 54],
        [34, 54],
        [45, 54],
        [56, 54],
        [66, 54],
        [74, 50],
        [74, 38],
        [74, 26],
      ];
      return (
        <G>
          <Path d={back} stroke="#9aa0a8" strokeWidth={1.1} fill="none" />
          {longs.map(([x, y]) => (
            <Line key={`${x}-${y}`} x1={x} y1={y} x2={x + 10} y2={y - 8} stroke="#b9bec5" strokeWidth={0.9} />
          ))}
          {/* cables inside the basket */}
          {[27, 34, 41, 48, 55, 62].map((x) => (
            <End key={x} x={x + 3} y={48} r={3.3} p={p} />
          ))}
          <Path d={front} stroke="#d9dde2" strokeWidth={1.3} fill="none" />
          {/* the safety-T ends of the wires */}
          {[
            [16, 26],
            [74, 26],
            [26, 18],
            [84, 18],
          ].map(([x, y]) => (
            <Line key={`t${x}`} x1={x - 1.8} y1={y} x2={x + 1.8} y2={y} stroke="#d9dde2" strokeWidth={1.3} strokeLinecap="round" />
          ))}
        </G>
      );
    }
    case 'conduit':
      return (
        <G>
          <Wall />
          {/* EMT into a box, set-screw coupling, one-hole strap */}
          <Rect x={70} y={16} width={22} height={40} rx={1} fill={p.zv} stroke="#2c2f34" strokeWidth={0.5} />
          <Rect x={72} y={18} width={18} height={36} rx={0.6} fill="none" stroke="#6d737b" strokeWidth={0.5} />
          <Rect x={65} y={29} width={5} height={14} rx={0.6} fill="#80868f" stroke="#2c2f34" strokeWidth={0.4} />
          <Rect x={0} y={31} width={66} height={10} fill={p.zv} stroke="#2c2f34" strokeWidth={0.45} />
          <Rect x={0} y={32.2} width={66} height={1.3} fill="#ffffff" opacity={0.5} />
          <Rect x={36} y={29.6} width={12} height={12.8} rx={0.8} fill={p.zv} stroke="#2c2f34" strokeWidth={0.45} />
          <Circle cx={42} cy={29.6} r={1.6} fill="#80868f" stroke="#2c2f34" strokeWidth={0.4} />
          {/* one-hole strap: a band over the pipe, its foot screwed to the wall */}
          <Rect x={12} y={29.2} width={6} height={13.6} rx={1.4} fill={p.zh} stroke="#2c2f34" strokeWidth={0.45} />
          <Rect x={11} y={42} width={8} height={8} rx={1} fill={p.zh} stroke="#2c2f34" strokeWidth={0.45} />
          <Screw x={15} y={46} r={1.6} />
        </G>
      );
    case 'raceway':
      return (
        <G>
          <Wall />
          {/* two-piece raceway (base + snap cover), a flat elbow fitting, a device box */}
          <Rect x={0} y={45} width={64} height={10} rx={1} fill={p.pvc} stroke="#8d8a80" strokeWidth={0.5} />
          <Line x1={0} y1={50} x2={64} y2={50} stroke="#a7a49a" strokeWidth={0.5} />
          <Rect x={64} y={16} width={10} height={28} rx={1} fill={p.pvc} stroke="#8d8a80" strokeWidth={0.5} />
          <Line x1={69} y1={16} x2={69} y2={44} stroke="#a7a49a" strokeWidth={0.5} />
          <Path d="M61 43 H77 V57 H61 Z" fill={p.pvc} stroke="#8d8a80" strokeWidth={0.5} />
          <Path d="M63 55 Q75 55 75 45" stroke="#a7a49a" strokeWidth={0.5} fill="none" />
          <Rect x={57} y={2} width={24} height={15} rx={1.6} fill={p.pvc} stroke="#8d8a80" strokeWidth={0.5} />
          <Rect x={64} y={5.5} width={10} height={8} rx={0.8} fill="#e9e7e0" stroke="#8d8a80" strokeWidth={0.4} />
          <Rect x={66.5} y={7.4} width={5} height={4} rx={0.4} fill="#1b1c20" />
        </G>
      );
    case 'underfloor':
      return (
        <G>
          {/* floor finish over a slab with an embedded duct + flush fitting */}
          <Rect x={0} y={28} width={96} height={44} fill="#3a3c42" />
          <Path d={[...Array(20)].map((_, k) => `M${k * 6 - 20} 72 L${k * 6 + 24} 28`).join('')} stroke="#4f525a" strokeWidth={0.5} />
          <Rect x={0} y={24} width={96} height={4} fill="#5a4a3a" />
          <Rect x={22} y={40} width={52} height={20} rx={1} fill={p.zv} stroke="#23262b" strokeWidth={0.5} />
          <Rect x={24} y={42} width={48} height={16} fill="#101114" />
          {[31, 39, 47, 55, 63].map((x) => (
            <End key={x} x={x} y={53.5} r={3.3} p={p} />
          ))}
          <Rect x={40} y={24} width={16} height={16} fill="#101114" />
          <Rect x={38} y={22.6} width={20} height={2.4} rx={0.6} fill="#c9a13c" stroke="#6b5520" strokeWidth={0.4} />
        </G>
      );
    case 'vmgr':
      return (
        <G>
          {/* rack rail at left, the manager channel with finger columns */}
          <Rect x={2} y={0} width={7} height={72} fill={p.zh} stroke="#23262b" strokeWidth={0.4} />
          {[4, 12, 20, 28, 36, 44, 52, 60, 68].map((y) => (
            <Rect key={y} x={4} y={y} width={3} height={3} fill="#0b0b0d" />
          ))}
          <Rect x={12} y={0} width={36} height={72} fill={p.ss} stroke="#0b0b0d" strokeWidth={0.4} />
          {[20, 25, 30].map((x, i) => (
            <Run key={x} pts={[{ x, y: -2 }, { x: x + 0.5, y: 36 }, { x, y: 74 }]} d={3.4} i={i} />
          ))}
          {/* patch cords entering between the fingers from the panel */}
          {[14, 30, 46].map((y, i) => (
            <Run key={`p${y}`} pts={[{ x: 70, y }, { x: 50, y }, { x: 38, y: y + 7 }, { x: 34, y: y + 16 }]} d={2.6} i={i + 3} />
          ))}
          {[...Array(12)].map((_, k) => (
            <G key={k}>
              <Rect x={12} y={k * 6 + 1} width={7} height={4} rx={1.8} fill="#2a2c31" stroke="#0b0b0d" strokeWidth={0.4} />
              <Rect x={41} y={k * 6 + 1} width={7} height={4} rx={1.8} fill="#2a2c31" stroke="#0b0b0d" strokeWidth={0.4} />
            </G>
          ))}
          <Rect x={50} y={4} width={46} height={52} fill="#202227" stroke="#0b0b0d" strokeWidth={0.4} />
          {[14, 30, 46].map((y) => (
            <Rect key={y} x={66} y={y - 3} width={6} height={6} rx={0.6} fill="#050506" stroke="#6d737b" strokeWidth={0.4} />
          ))}
        </G>
      );
    case 'hmgr':
      return (
        <G>
          {/* a 2U finger manager over a patch panel; cords rise between fingers */}
          <Rect x={0} y={6} width={6} height={60} fill={p.zh} />
          <Rect x={90} y={6} width={6} height={60} fill={p.zh} />
          <Rect x={6} y={16} width={84} height={14} fill={p.ss} stroke="#0b0b0d" strokeWidth={0.4} />
          <Rect x={6} y={40} width={84} height={16} fill="#1d1f24" stroke="#0b0b0d" strokeWidth={0.4} />
          {[14, 26, 38, 50, 62, 74].map((x, i) => (
            <G key={x}>
              <Rect x={x - 3} y={44} width={6} height={6} rx={0.6} fill="#050506" stroke="#6d737b" strokeWidth={0.4} />
              <Run pts={[{ x, y: 47 }, { x, y: 36 }, { x: x + 4, y: 24 }, { x: x + 12, y: 22 }]} d={2.4} i={i} />
            </G>
          ))}
          {[8, 20, 32, 44, 56, 68, 80].map((x) => (
            <Path key={x} d={`M${x} 30 V10 Q${x} 7 ${x + 3} 7 Q${x + 6} 7 ${x + 6} 10 V30 Z`} fill="#2a2c31" stroke="#0b0b0d" strokeWidth={0.45} />
          ))}
        </G>
      );
    case 'strap':
      return (
        <G>
          <Wall />
          {[33, 38, 43].map((y, i) => (
            <Run key={y} pts={[{ x: -2, y }, { x: 48, y }, { x: 98, y }]} d={4.4} i={i} />
          ))}
          {/* a wide two-hole saddle: big bearing surface, no pinch */}
          <Path d="M28 50 H36 V33 Q36 26 48 26 Q60 26 60 33 V50 H68 V53 H57 V34 Q57 29.5 48 29.5 Q39 29.5 39 34 V53 H28 Z" fill={p.blk} stroke="#0b0b0d" strokeWidth={0.4} />
          <Rect x={37} y={26.5} width={22} height={24} rx={3} fill={p.blk} opacity={0.92} />
          <Line x1={39} y1={28.5} x2={57} y2={28.5} stroke="#ffffff" strokeWidth={0.5} opacity={0.4} />
          <Screw x={31.5} y={51.5} r={1.6} />
          <Screw x={64.5} y={51.5} r={1.6} />
        </G>
      );
    case 'protector':
      return (
        <G>
          <Rect x={0} y={60} width={96} height={12} fill="#2a2b30" />
          {/* 3-channel protector in section: ramps, channels, hinged lid */}
          <Path d="M4 60 L20 44 H76 L92 60 Z" fill={p.blk} stroke="#0b0b0d" strokeWidth={0.5} />
          {[34, 48, 62].map((x) => (
            <Rect key={x} x={x - 5} y={48} width={10} height={12} rx={1} fill="#08080a" />
          ))}
          {[34, 48, 62].map((x) => (
            <End key={`c${x}`} x={x} y={55.5} r={4} p={p} />
          ))}
          <Path d="M20 44 H76 L72 40 H24 Z" fill={p.yel} stroke="#6b5520" strokeWidth={0.45} />
          <Circle cx={22} cy={43} r={1.4} fill="#6b5520" />
        </G>
      );
    case 'plumbing':
      return (
        <G>
          {/* copper water line on a clevis hanger, soldered elbow down */}
          <Line x1={40} y1={0} x2={40} y2={26} stroke="#9aa0a8" strokeWidth={1.4} />
          <Path d="M33 26 H47 V40 Q47 44 40 44 Q33 44 33 40 Z" fill="none" stroke="#80868f" strokeWidth={1.6} />
          <Rect x={0} y={29} width={76} height={11} fill={p.cu} stroke="#5a3016" strokeWidth={0.45} />
          <Path d="M76 27.5 H80 Q88 27.5 88 36 V40 H78 V40 Q78 40 76 40 Z" fill={p.cu} stroke="#5a3016" strokeWidth={0.45} />
          <Rect x={77} y={40} width={11} height={32} fill={p.cu} stroke="#5a3016" strokeWidth={0.45} />
          <Rect x={70} y={28} width={5} height={13} fill="#b56a34" stroke="#5a3016" strokeWidth={0.4} />
          <Rect x={0} y={30.5} width={76} height={1.6} fill="#ffffff" opacity={0.35} />
          <Path d="M58 44 c-2.4 4 -2.4 6.5 0 7.6 c2.4 -1.1 2.4 -3.6 0 -7.6" fill="#6cc7ff" opacity={0.85} />
        </G>
      );
    case 'foreign-conduit':
      return (
        <G>
          <Wall />
          {/* a different system's raceway: red-painted run into its own box */}
          <Rect x={0} y={24} width={60} height={10} fill={p.red} stroke="#4a130d" strokeWidth={0.45} />
          <Rect x={0} y={25.2} width={60} height={1.3} fill="#ffffff" opacity={0.35} />
          <Rect x={26} y={22.6} width={11} height={12.8} rx={0.8} fill={p.red} stroke="#4a130d" strokeWidth={0.45} />
          <Rect x={60} y={14} width={30} height={40} rx={1} fill={p.red} stroke="#4a130d" strokeWidth={0.5} />
          <Rect x={61} y={40} width={28} height={9} rx={0.6} fill="#f2f1ec" stroke="#8d8a80" strokeWidth={0.4} />
          <Callout x={75} y={46.4} text="FIRE ALARM" size={4.4} color="#8a1c12" bg={null} />
        </G>
      );
    case 'tile': {
      const fissures: string[] = [];
      for (let k = 0; k < 46; k++) {
        const x = 16 + ((k * 37) % 62);
        const y = 13 + ((k * 23) % 44);
        fissures.push(`M${x} ${y} q1.4 ${(k % 3) - 1} 3 ${(k % 2) * 1.2 - 0.6}`);
      }
      return (
        <G>
          {/* an acoustic tile seen from below, sitting in its grid */}
          <Rect x={0} y={0} width={96} height={72} fill="#e7e4dc" />
          <Rect x={12} y={9} width={72} height={54} fill="#d9d5cb" />
          <Path d={fissures.join('')} stroke="#9f9a8d" strokeWidth={0.6} fill="none" />
          <Rect x={10} y={0} width={2.4} height={72} fill="#f7f7f5" stroke="#b9b7b0" strokeWidth={0.3} />
          <Rect x={84} y={0} width={2.4} height={72} fill="#f7f7f5" stroke="#b9b7b0" strokeWidth={0.3} />
          <Rect x={0} y={7} width={96} height={2.4} fill="#f7f7f5" stroke="#b9b7b0" strokeWidth={0.3} />
          <Rect x={0} y={63} width={96} height={2.4} fill="#f7f7f5" stroke="#b9b7b0" strokeWidth={0.3} />
        </G>
      );
    }
    case 'grid':
      return (
        <G>
          {/* a main tee in section with its hanger wire twisted through */}
          <Rect x={0} y={0} width={96} height={6} fill="#3a3c42" />
          <Circle cx={48} cy={7.5} r={1.8} fill="none" stroke="#9aa0a8" strokeWidth={0.8} />
          <Path d="M48 9 V30 C46 32 50 33 48 35 C46 37 50 38 48 40" stroke="#9aa0a8" strokeWidth={0.9} fill="none" />
          <Rect x={46.2} y={36} width={3.6} height={4} rx={1.4} fill="none" stroke="#9aa0a8" strokeWidth={0.8} />
          <Path d="M45.5 38 H50.5 V52 H55 V54.2 H41 V52 H45.5 Z" fill="#f2f2f0" stroke="#8d8a80" strokeWidth={0.45} />
          {/* the tiles it carries, resting on the flanges */}
          <Rect x={4} y={51} width={37} height={3.4} fill="#d9d5cb" stroke="#9f9a8d" strokeWidth={0.4} />
          <Rect x={55} y={51} width={37} height={3.4} fill="#d9d5cb" stroke="#9f9a8d" strokeWidth={0.4} />
        </G>
      );
    case 'sprinkler':
      return (
        <G>
          {/* red sprinkler branch line, a drop and a pendant head */}
          <Line x1={20} y1={0} x2={20} y2={16} stroke="#9aa0a8" strokeWidth={1.2} />
          <Path d="M15 16 H25 V28 Q25 31 20 31 Q15 31 15 28 Z" fill="none" stroke="#80868f" strokeWidth={1.2} />
          <Rect x={0} y={18} width={96} height={10} fill={p.red} stroke="#4a130d" strokeWidth={0.45} />
          <Rect x={0} y={19.2} width={96} height={1.3} fill="#ffffff" opacity={0.35} />
          <Rect x={52} y={16.6} width={10} height={12.8} rx={0.8} fill={p.red} stroke="#4a130d" strokeWidth={0.4} />
          <Rect x={54.5} y={28} width={5} height={12} fill={p.red} stroke="#4a130d" strokeWidth={0.4} />
          {/* the head: frame arms, red glass bulb, deflector */}
          <Rect x={53.5} y={40} width={7} height={3} rx={0.6} fill="#c9a13c" stroke="#6b5520" strokeWidth={0.4} />
          <Path d="M54.5 43 L53 52 M59.5 43 L61 52" stroke="#c9a13c" strokeWidth={1.1} />
          <Ellipse cx={57} cy={47.5} rx={1.3} ry={3.4} fill="#ff4a3a" opacity={0.9} />
          <Line x1={50} y1={52.5} x2={64} y2={52.5} stroke="#c9a13c" strokeWidth={1.4} strokeLinecap="round" />
        </G>
      );
    case 'hanger':
      return (
        <G>
          <Wall y1={10} />
          {/* junk: a bent nail, an S-hook, a loop of tie wire — no rating, no anchor */}
          <Rect x={0} y={0} width={96} height={10} fill="#3a3c42" />
          <Path d="M36 10 V16 Q36 19 40 19" stroke="#8f8a80" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <Path d="M40 19 Q46 19 46 24 Q46 29 41 29 Q36 29 36 34 Q36 40 42 40 Q47 40 47 36" stroke="#a88b5e" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          <Path d="M62 10 V26 Q62 36 56 38 Q49 40 54 46 Q58 50 66 46" stroke="#9aa0a8" strokeWidth={0.8} fill="none" />
          <Path d="M62 10 q2 3 0 6 q-2 3 0 6" stroke="#9aa0a8" strokeWidth={0.8} fill="none" />
          <Circle cx={36} cy={9.5} r={1.4} fill="#6d6a60" />
        </G>
      );
    default:
      return (
        <G>
          <Rect x={24} y={20} width={48} height={32} rx={4} fill="#2a2c31" stroke="#6d737b" strokeWidth={0.8} />
        </G>
      );
  }
}

export function SupportIcon({ id, w }: { id: string; w: number }) {
  const uid = useUid();
  const h = Math.round(w / ICON_ASPECT);
  const p = u(uid);
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${ICON_VB_W} ${ICON_VB_H}`}>
      <Paints id={uid} />
      <Defs>
        <ClipPath id={`${uid}clip`}>
          <Rect x={0} y={0} width={ICON_VB_W} height={ICON_VB_H} rx={6} />
        </ClipPath>
      </Defs>
      <Rect x={0} y={0} width={ICON_VB_W} height={ICON_VB_H} rx={6} fill="#111216" />
      <G clipPath={`url(#${uid}clip)`}>{art(id, p)}</G>
      <Rect x={0.4} y={0.4} width={ICON_VB_W - 0.8} height={ICON_VB_H - 0.8} rx={6} fill="none" stroke="#2a2b31" strokeWidth={0.8} />
    </Svg>
  );
}
