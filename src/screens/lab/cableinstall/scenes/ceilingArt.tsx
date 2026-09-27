/**
 * STAGE 8 — the ABOVE-CEILING cutaway, drawn (owner 2026-09-26 art pass: the
 * plenum was grey outline boxes and 1–3 px lines — a rectangle for a duct, a
 * red line for a sprinkler main).
 *
 * The cutaway keeps the scene's geometry (defects, hit markers and the span
 * are anchored to it) and draws each system as the object it is: a concrete
 * deck with steel joists, 12-gauge hanger wires, a flanged supply duct on
 * straps, a red sprinkler main on clevis hangers with pendant heads, EMT on
 * rods, a ladder tray on a trapeze carrying its cables, a 2×4 troffer in the
 * grid, and the suspended grid itself with its tiles. Bundles are drawn as
 * bundles (≈ 25 mm), pipes and ducts at their sizes.
 */
import { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { ConcreteCut, DuctSide, JacketPath, useUid } from '../svgArt';

export function PlenumStructure() {
  return (
    <G>
      <ConcreteCut x={0} y={4} w={360} h={10} />
      {/* steel joists seen end-on (I sections) */}
      {[20, 80, 140, 200, 260, 320].map((x) => (
        <G key={x}>
          <Rect x={x - 4} y={14} width={8} height={1.6} fill="#80868f" />
          <Rect x={x - 0.8} y={15.6} width={1.6} height={10.8} fill="#6d737b" />
          <Rect x={x - 4} y={26.4} width={8} height={1.6} fill="#80868f" />
        </G>
      ))}
      {/* the far wall the run is headed for */}
      <ConcreteCut x={336} y={14} w={18} h={150} />
      {/* ceiling hanger wires, each with its wrap at the joist */}
      {[50, 110, 170, 230, 290].map((x) => (
        <G key={x}>
          <Line x1={x} y1={28} x2={x} y2={162} stroke="#7b8088" strokeWidth={0.45} />
          <Path d={`M${x} 29 q1.4 1.2 0 2.4 q-1.4 1.2 0 2.4`} stroke="#7b8088" strokeWidth={0.45} fill="none" />
        </G>
      ))}
    </G>
  );
}

/** Red sprinkler main on clevis hangers, drops to pendant heads at the grid. */
function SprinklerMain() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ff8a78" />
          <Stop offset="0.45" stopColor="#c8372b" />
          <Stop offset="1" stopColor="#6c1a13" />
        </LinearGradient>
      </Defs>
      {[200, 310].map((x) => (
        <G key={x}>
          <Line x1={x} y1={28} x2={x} y2={80} stroke="#9aa0a8" strokeWidth={0.8} />
          <Path d={`M${x - 3.2} 80 V86 Q${x - 3.2} 88.4 ${x} 88.4 Q${x + 3.2} 88.4 ${x + 3.2} 86 V80 Z`} fill="none" stroke="#9aa0a8" strokeWidth={0.8} />
        </G>
      ))}
      <Rect x={126} y={82.2} width={210} height={3.6} fill={`url(#${id}r)`} stroke="#4a130d" strokeWidth={0.3} />
      {[204, 258, 316].map((x) => (
        <G key={x}>
          <Rect x={x - 0.9} y={85.8} width={1.8} height={77.4} fill={`url(#${id}r)`} />
          <Rect x={x - 1.8} y={162.6} width={3.6} height={1.8} fill="#c9a13c" />
          <Path d={`M${x - 1.2} 164.4 L${x - 2} 168 M${x + 1.2} 164.4 L${x + 2} 168`} stroke="#c9a13c" strokeWidth={0.6} />
          <Ellipse cx={x} cy={166.2} rx={0.6} ry={1.4} fill="#ff4a3a" />
          <Line x1={x - 3} y1={168.3} x2={x + 3} y2={168.3} stroke="#c9a13c" strokeWidth={0.8} strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

/** Another system's EMT on rods, with its couplings. */
function ForeignConduit() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#dfe3e8" />
          <Stop offset="0.45" stopColor="#9ba1a8" />
          <Stop offset="1" stopColor="#50555c" />
        </LinearGradient>
      </Defs>
      {[180, 260, 330].map((x) => (
        <G key={x}>
          <Line x1={x} y1={28} x2={x} y2={42} stroke="#9aa0a8" strokeWidth={0.7} />
          <Rect x={x - 2.4} y={41.2} width={4.8} height={1.2} fill="#80868f" />
        </G>
      ))}
      <Rect x={150} y={42.3} width={186} height={3.4} fill={`url(#${id}e)`} stroke="#3a3d43" strokeWidth={0.3} />
      {[196, 244, 292].map((x) => (
        <Rect key={x} x={x - 2.5} y={41.7} width={5} height={4.6} rx={0.5} fill={`url(#${id}e)`} stroke="#3a3d43" strokeWidth={0.3} />
      ))}
    </G>
  );
}

/** Ladder tray on a trapeze, seen from the side, carrying two bundles. */
function TrayWithCables() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}z`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d3d7dc" />
          <Stop offset="0.5" stopColor="#9ba1a8" />
          <Stop offset="1" stopColor="#5d636b" />
        </LinearGradient>
      </Defs>
      {[70, 170].map((x) => (
        <G key={x}>
          <Line x1={x} y1={28} x2={x} y2={134} stroke="#9aa0a8" strokeWidth={0.8} />
          <Rect x={x - 5} y={133} width={10} height={2.4} fill="#80868f" stroke="#3a3d43" strokeWidth={0.3} />
        </G>
      ))}
      {/* far rail, rungs, the cables on the rungs, then the near rail */}
      <Rect x={60} y={116} width={120} height={2.2} fill="#6d737b" />
      {[66, 78, 90, 102, 114, 126, 138, 150, 162, 174].map((x) => (
        <Line key={x} x1={x} y1={118} x2={x - 2} y2={130} stroke="#5d636b" strokeWidth={1} />
      ))}
      <JacketPath d="M64 124 L177 124" color="#4fd0e0" width={2.2} />
      <JacketPath d="M64 127 L177 127" color="#37d97b" width={2.2} />
      <Rect x={58} y={126} width={122} height={5.6} fill={`url(#${id}z)`} stroke="#3a3d43" strokeWidth={0.35} opacity={0.94} />
    </G>
  );
}

/** A recessed 2×4 troffer in the grid. */
function Troffer() {
  return (
    <G>
      <Path d="M88 164 L92 146 H128 L132 164 Z" fill="#26282d" stroke="#0a0a0c" strokeWidth={0.5} />
      <Rect x={96} y={148} width={28} height={3} fill="#3a3c42" />
      <Rect x={90} y={164} width={40} height={4} fill="#fff3c2" opacity={0.85} />
      <Path d={[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${92 + i * 5} 164 v4`).join('')} stroke="#e0d49c" strokeWidth={0.4} />
    </G>
  );
}

export function OtherTrades() {
  return (
    <G>
      {/* supply duct on straps */}
      <DuctSide x0={12} x1={120} y={78} h={26} m={60} hangTo={28} />
      <SprinklerMain />
      <ForeignConduit />
      <TrayWithCables />
      <Troffer />
    </G>
  );
}

/** The suspended grid + tiles, cut. */
export function GridAndTiles() {
  return (
    <G>
      {[2, 60, 118, 176, 234, 292].map((x) => (
        <Rect key={x} x={x} y={165.6} width={x === 292 ? 42 : 54} height={2.2} fill="#cfccc3" />
      ))}
      <Line x1={0} y1={167.8} x2={336} y2={167.8} stroke="#8d8a80" strokeWidth={0.4} />
      {[0, 58, 116, 174, 232, 290, 334].map((x) => (
        <Path key={x} d={`M${x - 0.5} 162.5 H${x + 0.5} V167.2 H${x + 2.4} V168.3 H${x - 2.4} V167.2 H${x - 0.5} Z`} fill="#f2f2f0" />
      ))}
      <Rect x={0} y={176} width={360} height={44} fill="#0d0d10" />
    </G>
  );
}

/** A J-hook on its drop rod (side view): anchor, rod, formed J. */
export function JHookDrop({ x, top, cradleY, w = 5 }: { x: number; top: number; cradleY: number; w?: number }) {
  return (
    <G>
      <Rect x={x - 2.4} y={top} width={4.8} height={1.2} fill="#80868f" />
      <Line x1={x} y1={top + 1} x2={x} y2={cradleY - w - 2} stroke="#9aa0a8" strokeWidth={0.7} />
      <Path d={`M${x - w} ${cradleY - w - 2} V${cradleY - w * 0.6} A${w} ${w} 0 0 0 ${x + w} ${cradleY - w * 0.6} V${cradleY - w - 0.5}`} stroke="#2c2f34" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d={`M${x - w} ${cradleY - w - 2} V${cradleY - w * 0.6} A${w} ${w} 0 0 0 ${x + w} ${cradleY - w * 0.6} V${cradleY - w - 0.5}`} stroke="#c3c8cf" strokeWidth={1.3} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** The previous contractor's work — every wrong detail, drawn as real cable. */
export function CeilingDefects() {
  return (
    <G>
      {/* cd-6 overstuffed J-hook: a bundle far wider than its saddle */}
      <JHookDrop x={194} top={28} cradleY={76} w={5.4} />
      <JacketPath d="M186 64 Q194 54 202 64 Q194 72 186 64" color="#4fd0e0" width={2.2} />
      <JacketPath d="M187 68 Q194 58 201 68 Q194 76 187 68" color="#37d97b" width={2.2} />
      <JacketPath d="M188 60 Q194 68 200 60" color="#c77dff" width={2} />
      <JacketPath d="M185 66 Q194 62 203 66" color="#ffd35e" width={2} />

      {/* the run leaving the crammed hook LEFT: drapes the sprinkler main
          (cd-2), lands on the light housing (cd-4), ends lying on the tiles
          (cd-1) — terminated at a connector */}
      <JacketPath
        d="M190 70 Q172 72 162 80 Q158 82 154 88 Q146 100 138 112 Q122 134 112 146 Q98 148 84 152 Q70 156 62 161 Q48 166 36 163 Q30 161 28 162"
        color="#4fd0e0"
        width={2.6}
      />
      <Rect x={20} y={159} width={9} height={5} rx={1} fill="#26282d" stroke="#6f7378" strokeWidth={0.6} />

      {/* the run leaving RIGHT: hard 90° fold (cd-5) into an unmarked,
          unsleeved wall penetration (cd-7) */}
      <JacketPath d="M198 72 Q224 84 248 94 Q264 98 274 97 L274 106 L334 106" color="#4fd0e0" width={2.6} />
      <Path d="M330 99 L344 97 L346 112 L332 114 Z" fill="#070708" stroke="#6f6b62" strokeWidth={0.9} />

      {/* cd-3: a lone bundle sagging deep between the tray end and a far hook */}
      <JHookDrop x={300} top={28} cradleY={124} w={4} />
      <JacketPath d="M180 120 Q240 148 297 120" color="#37d97b" width={2.6} />
      <JacketPath d="M297 120 L300 116 L300 40" color="#37d97b" width={2} />
      <Rect x={294} y={32} width={12} height={8} rx={1.5} fill="#26282d" stroke="#3a3c42" strokeWidth={0.8} />

      {/* cd-8: a service loop tied high above the rigid duct — unreachable */}
      <JacketPath d="M2 42 Q20 48 34 58" color="#37d97b" width={2.4} />
      <JacketPath d="M33 66 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0" color="#37d97b" width={2.4} />
      <JacketPath d="M36.5 66 a6.5 6.5 0 1 0 13 0 a6.5 6.5 0 1 0 -13 0" color="#37d97b" width={2} />
      <Rect x={41.8} y={53} width={2.4} height={6} rx={0.5} fill="#e9e5d8" stroke="#5f5c52" strokeWidth={0.3} />
      <JacketPath d="M52 72 Q60 92 60 116" color="#37d97b" width={2.4} />
    </G>
  );
}

/** The bushed sleeve through the far wall (the intended entry). */
export function WallSleeve() {
  return (
    <G>
      <Rect x={330} y={118} width={14} height={8} rx={1} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      <Rect x={329} y={117} width={2.4} height={10} rx={0.8} fill="#141518" />
      <Circle cx={331} cy={122} r={0.1} fill="none" />
    </G>
  );
}

/** FINISHED VIEW — the room from below: walls, floor, a clean tile ceiling. */
export function FinishedRoom() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1f2025" />
          <Stop offset="1" stopColor="#16171b" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={360} height={220} rx={10} fill="#0e0f12" />
      <Rect x={12} y={46} width={336} height={150} fill={`url(#${id}w)`} />
      <Rect x={12} y={190} width={336} height={6} fill="#2e2f35" />
      <Rect x={12} y={196} width={336} height={20} fill="#1a1714" />
      <Rect x={300} y={120} width={12} height={16} rx={1} fill="#d9d7d0" stroke="#8d8a80" strokeWidth={0.4} />
      <Circle cx={306} cy={126} r={2.6} fill="#1a1b1f" />
    </G>
  );
}
