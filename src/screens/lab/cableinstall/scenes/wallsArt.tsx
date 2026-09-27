/**
 * STAGE 7 — the ROOM ELEVATION's fabric (owner 2026-09-26 art pass: the room
 * was outline boxes — a rectangle rack, a rectangle "door", a dashed-line
 * "stud").
 *
 * The elevation is drawn at ≈ 58 units per metre (a 2.07 m door leaf is 120
 * units, a 42U rack ≈ 1.93 m is 112): painted gypsum wall with its board seams
 * and a baseboard, a vinyl floor, a floor-standing rack seen from the front, a
 * double-gang wall plate with an XLR insert, a cased door with an undercut leaf
 * standing ajar, a ragged rough opening. X-RAY shows the framing a building
 * really has: 38 mm studs at 406 mm (16 in) centres on top and bottom plates,
 * king + jack studs and a header at the door. The wall plate is drawn a touch
 * larger than life so it stays findable (D39's only allowed exaggeration).
 */
import { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Callout, Screw, useUid } from '../svgArt';

/** units per metre in the elevation */
export const WALL_M = 58;
export const FLOOR_Y = 162;

/** Stud centres (16 in o.c.), skipping the door rough opening and the
 *  rated/unknown zones' own framing is shown the same way. */
export const STUD_XS: number[] = (() => {
  const out: number[] = [];
  for (let x = 8; x < 352; x += 0.406 * WALL_M) {
    if (x > 262 && x < 328) continue;
    out.push(Math.round(x * 10) / 10);
  }
  return out;
})();

export function WallSurface() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#23242a" />
          <Stop offset="1" stopColor="#1a1b20" />
        </LinearGradient>
        <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a2622" />
          <Stop offset="1" stopColor="#14120f" />
        </LinearGradient>
      </Defs>
      {/* ceiling line + the painted gypsum wall with its 1.2 m board seams */}
      <Rect x={2} y={6} width={356} height={8} rx={4} fill="#101014" />
      <Rect x={2} y={14} width={356} height={FLOOR_Y - 14} fill={`url(#${id}w)`} />
      {[72, 142, 212, 282].map((x) => (
        <Line key={x} x1={x} y1={14} x2={x} y2={FLOOR_Y - 6} stroke="#2b2c32" strokeWidth={0.6} />
      ))}
      {/* baseboard */}
      <Rect x={2} y={FLOOR_Y - 6} width={356} height={6} fill="#2e2f35" />
      <Line x1={2} y1={FLOOR_Y - 6} x2={358} y2={FLOOR_Y - 6} stroke="#46484f" strokeWidth={0.6} />
      {/* floor band (a vinyl plank floor seen edge-on) */}
      <Rect x={2} y={FLOOR_Y} width={356} height={30} fill={`url(#${id}f)`} />
      <Line x1={2} y1={FLOOR_Y + 0.4} x2={358} y2={FLOOR_Y + 0.4} stroke="#4a443c" strokeWidth={0.8} />
    </G>
  );
}

/** X-RAY framing: bottom + double top plate, studs at 16 in centres. */
export function StudFrame() {
  return (
    <G>
      <Rect x={4} y={14} width={352} height={3} fill="#8a6a42" />
      <Rect x={4} y={17} width={352} height={2.2} fill="#7a5c38" />
      <Rect x={4} y={FLOOR_Y - 2.2} width={352} height={2.2} fill="#7a5c38" />
      {/* door framing: king + jack studs, header */}
      <Rect x={264} y={19} width={2.2} height={FLOOR_Y - 21} fill="#8a6a42" />
      <Rect x={326} y={19} width={2.2} height={FLOOR_Y - 21} fill="#8a6a42" />
      <Rect x={266} y={40} width={60} height={2.4} fill="#8a6a42" />
      <Rect x={266} y={42.4} width={60} height={9} fill="#7a5c38" />
    </G>
  );
}

/** One stud (38 mm face), wood toned with a hint of grain. */
export function StudBody({ x }: { x: number }) {
  const w = 0.038 * WALL_M;
  return (
    <G>
      <Rect x={x - w / 2} y={19.2} width={w} height={FLOOR_Y - 21.4} fill="#8a6a42" />
      <Line x1={x - w * 0.15} y1={22} x2={x - w * 0.1} y2={FLOOR_Y - 5} stroke="#6f532f" strokeWidth={0.35} />
    </G>
  );
}

/** A floor-standing 42U rack seen from the front (≈ 0.6 m × 1.93 m). */
export function RackFront() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1e1f24" />
          <Stop offset="0.5" stopColor="#2a2c32" />
          <Stop offset="1" stopColor="#1a1b1f" />
        </LinearGradient>
      </Defs>
      <Rect x={16} y={58} width={54} height={FLOOR_Y - 58} rx={1.2} fill={`url(#${id}r)`} stroke="#0a0a0c" strokeWidth={0.7} />
      <Rect x={16} y={58} width={54} height={4} fill="#34363d" />
      <Rect x={22} y={63} width={42} height={FLOOR_Y - 68} fill="#0c0c0f" />
      {/* the kit: 1U / 2U faces with status LEDs */}
      {[
        [66, 3.4],
        [71, 3.4],
        [76, 7],
        [85, 7],
        [98, 3.4],
        [104, 11],
        [124, 7],
        [140, 3.4],
        [146, 5.2],
      ].map(([y, h], i) => (
        <G key={i}>
          <Rect x={22.6} y={y} width={40.8} height={h} rx={0.4} fill={i % 3 === 1 ? '#23252a' : '#2b2d33'} stroke="#101114" strokeWidth={0.3} />
          <Circle cx={60.6} cy={y + h / 2} r={0.55} fill={i % 2 ? '#37d97b' : '#ffc64d'} />
        </G>
      ))}
      <Rect x={16} y={FLOOR_Y - 3} width={54} height={3} fill="#101114" />
    </G>
  );
}

/** A double-gang wall plate with an XLR insert and a blank. */
export function WallPlate({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 6.5} y={y - 8} width={13} height={16} rx={1} fill="#d9d7d0" stroke="#8d8a80" strokeWidth={0.4} />
      <Circle cx={x} cy={y - 2.4} r={3} fill="#1a1b1f" stroke="#8d8a80" strokeWidth={0.4} />
      <Circle cx={x} cy={y - 2.4} r={2} fill="#050506" />
      <Rect x={x - 2.4} y={y + 2.6} width={4.8} height={3} rx={0.4} fill="#c4c1b8" />
      <Screw x={x} y={y - 6.4} r={0.6} />
      <Screw x={x} y={y + 6.8} r={0.6} />
    </G>
  );
}

/** Cased doorway with the leaf standing ajar and its undercut above the floor. */
export function DoorAssembly() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2c2a27" />
          <Stop offset="1" stopColor="#1f1d1b" />
        </LinearGradient>
      </Defs>
      {/* the opening + casing */}
      <Rect x={274} y={52} width={44} height={FLOOR_Y - 52} fill="#0b0b0d" />
      <Rect x={268} y={46} width={56} height={6} fill="#3a3b41" />
      <Rect x={268} y={52} width={6} height={FLOOR_Y - 52} fill="#3a3b41" />
      <Rect x={318} y={52} width={6} height={FLOOR_Y - 52} fill="#3a3b41" />
      <Line x1={268} y1={46.5} x2={324} y2={46.5} stroke="#56585f" strokeWidth={0.6} />
      {/* the leaf, ajar: foreshortened, two raised panels, a lever */}
      <Path d={`M276 52 L312 57 L312 ${FLOOR_Y - 5} L276 ${FLOOR_Y - 1} Z`} fill={`url(#${id}d)`} stroke="#0f0e0c" strokeWidth={0.6} />
      <Path d="M281 60 L307 63.6 L307 98 L281 97 Z" fill="none" stroke="#3a3632" strokeWidth={0.7} />
      <Path d={`M281 104 L307 105 L307 ${FLOOR_Y - 12} L281 ${FLOOR_Y - 9} Z`} fill="none" stroke="#3a3632" strokeWidth={0.7} />
      <Rect x={303} y={108} width={7} height={1.8} rx={0.9} fill="#b9bec5" />
      <Circle cx={305} cy={109} r={1.4} fill="#9ba1a8" />
    </G>
  );
}

/** A ragged rough opening in the gypsum with its raw, torn edge. */
export function RoughOpening() {
  return (
    <G>
      <Path d="M132 62 L140 59.5 L149 58 L152.5 61 L156 66 L154.6 71 L153 78 L145 80.4 L138 82 L133.5 77 L130 72 Z" fill="#070708" stroke="#6f6b62" strokeWidth={0.9} />
      <Path d="M140 59.5 l1.4 2.2 M152.5 61 l-2 1.2 M154.6 71 l-2.2 -0.4 M138 82 l0.8 -2.2 M130 72 l2.2 0.2" stroke="#8d897e" strokeWidth={0.6} />
    </G>
  );
}

/** Route A's hardware: a two-piece baseboard raceway, its end fitting at the
 *  rack and the device box + riser cover at the plate. */
export function BaseboardRaceway({ tone }: { tone: string }) {
  return (
    <G>
      <Rect x={70} y={151} width={144} height={10} rx={1.2} fill="#d9d7d0" stroke="#8d8a80" strokeWidth={0.5} />
      <Line x1={70} y1={155.6} x2={214} y2={155.6} stroke="#b0ada4" strokeWidth={0.45} />
      <Rect x={66} y={149} width={8} height={13} rx={1} fill="#e4e2db" stroke="#8d8a80" strokeWidth={0.5} />
      <Rect x={208} y={146.5} width={13} height={15} rx={1.2} fill="#e4e2db" stroke="#8d8a80" strokeWidth={0.5} />
      <Rect x={210.5} y={146.5} width={8} height={1.6} fill={tone} opacity={0.8} />
    </G>
  );
}

/** Two-part threshold protector profile (black ramps, yellow lid). */
export function thresholdPaths(dy: number) {
  'worklet';
  const y0 = (FLOOR_Y + 5 - dy).toFixed(2);
  const y1 = (FLOOR_Y - 2 - dy).toFixed(2);
  const yl = (FLOOR_Y - 3.6 - dy).toFixed(2);
  return {
    body: `M280 ${y0} L288 ${y1} L304 ${y1} L312 ${y0} Z`,
    lid: `M288.6 ${y1} L303.4 ${y1} L302 ${yl} L290 ${yl} Z`,
  };
}

/** The 1 m scale bar the elevation is drawn to. */
export function WallScale() {
  return (
    <G>
      <Line x1={10} y1={184} x2={10 + WALL_M} y2={184} stroke="#8d9199" strokeWidth={0.9} />
      <Path d={`M10 181.5 v5 M${10 + WALL_M} 181.5 v5`} stroke="#8d9199" strokeWidth={0.9} />
      <Callout x={14 + WALL_M} y={187.4} text="1 m" anchor="start" size={9.5} color="#8d9199" bg={null} />
    </G>
  );
}
