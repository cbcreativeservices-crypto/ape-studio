/**
 * STAGE 8 — the ABOVE-CEILING cutaway, drawn as a trade-textbook building
 * SECTION (owner 2026-09-28: the previous pass was "too poor to be useful" —
 * grey outline boxes, thin lines, cables looping through space).
 *
 * viewBox 360 × 220 at m = 60 units per metre: a 6 m wide slice of a
 * suspended-ceiling cavity 2.5 m deep (a large-venue ceiling). Every system
 * is drawn as the object a technician recognises, at its size relative to
 * the others, with the section conventions of an architectural drawing:
 *   • concrete slab on corrugated metal deck, steel joists seen end-on
 *   • 12-gauge hanger wires from the deck to the T-bar mains, wrapped at
 *     both ends; the grid itself as inverted tees carrying the tiles
 *   • an insulated supply duct on trapeze hangers (rod + strut) with a
 *     flanged joint
 *   • a 2-inch sprinkler main on clevis hangers with drops to pendant heads
 *     through escutcheons at the tiles
 *   • EMT conduit on hangers, coupled
 *   • ladder cable tray on a trapeze, cables lying on its rungs
 *   • a recessed troffer sitting in the grid; a CMU wall with its sleeve
 * Labels sit on the drawing (≥ 9 pt inline) so the picture reads BEFORE the
 * exercise; a 1 m scale bar makes the proportions honest.
 *
 * The scene's geometry is anchored here: the tray end (x 180, y 128) and the
 * bushed sleeve (y 126) are where Exercise 2's run lives; the defect
 * positions in data/scenarios.ts sit ON the vignettes below.
 */
import { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Callout, CableTie, ConcreteCut, JacketPath, ScaleBar, useUid } from '../svgArt';

/** units per metre. */
export const CM = 60;
/** Tile top (the underside of the cavity). */
export const TILE_Y = 163;
/** Where cable lies in the tray / the level of the supported run. */
export const TRAY_CABLE_Y = 128;
/** Label size — 9.6 units ≈ 9.1 pt at the inline width (343 px). */
const LABEL = 9.6;
const LABEL_INK = '#b9bdc6';

/** A drawing label on a dark pill (never over an object's detail). */
function Tag({ x, y, text, anchor = 'middle' }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }) {
  return <Callout x={x} y={y} text={text} size={LABEL} color={LABEL_INK} anchor={anchor} bg="rgba(12,12,16,0.82)" />;
}

/** Threaded rod from the deck to `y`, with its deck anchor. */
function Rod({ x, y, top = 14 }: { x: number; y: number; top?: number }) {
  return (
    <G>
      <Rect x={x - 2.4} y={top} width={4.8} height={1.4} fill="#9aa0a8" />
      <Line x1={x} y1={top + 1} x2={x} y2={y} stroke="#9aa0a8" strokeWidth={0.8} />
    </G>
  );
}

/** A hanger wire: 12-gauge, wrapped three turns at the deck and at the tee. */
function HangerWire({ x }: { x: number }) {
  return (
    <G>
      <Line x1={x} y1={14} x2={x} y2={TILE_Y} stroke="#8a8f97" strokeWidth={0.45} />
      <Path d={`M${x} 15 q1.6 1 0 2 q-1.6 1 0 2 q1.6 1 0 2`} stroke="#8a8f97" strokeWidth={0.45} fill="none" />
      <Path d={`M${x} ${TILE_Y - 8} q1.6 1 0 2 q-1.6 1 0 2 q1.6 1 0 2`} stroke="#8a8f97" strokeWidth={0.45} fill="none" />
    </G>
  );
}

export function PlenumStructure() {
  const id = useUid();
  // corrugated metal deck under the slab (flutes every 0.15 m)
  const flutes: string[] = [];
  for (let x = 0; x < 360; x += 9) flutes.push(`M${x} 12 v2 h4.5 v-2`);
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}j`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5d636b" />
          <Stop offset="0.5" stopColor="#8d929a" />
          <Stop offset="1" stopColor="#4a4f56" />
        </LinearGradient>
      </Defs>
      <ConcreteCut x={0} y={0} w={360} h={12} />
      <Path d={flutes.join('')} stroke="#7b8088" strokeWidth={0.5} fill="none" />
      {/* steel joists seen end-on (W sections), 1.2 m apart */}
      {[40, 112, 184, 256, 328].map((x) => (
        <G key={x}>
          <Rect x={x - 5} y={14} width={10} height={1.8} fill={`url(#${id}j)`} stroke="#2c2f34" strokeWidth={0.3} />
          <Rect x={x - 0.9} y={15.8} width={1.8} height={10.4} fill="#6d737b" />
          <Rect x={x - 5} y={26.2} width={10} height={1.8} fill={`url(#${id}j)`} stroke="#2c2f34" strokeWidth={0.3} />
        </G>
      ))}
      {/* the far wall: concrete masonry, coursed */}
      <ConcreteCut x={336} y={12} w={18} h={152} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <Line key={i} x1={336} y1={24 + i * 12} x2={354} y2={24 + i * 12} stroke="#23252a" strokeWidth={0.5} />
      ))}
      {/* hanger wires to the T-bar mains (every 1.2 m, on a main runner) */}
      {[58, 174, 232, 290].map((x) => (
        <HangerWire key={x} x={x} />
      ))}
      <Tag x={62} y={23} text="DECK + JOISTS" anchor="start" />
    </G>
  );
}

/** Insulated supply duct on trapeze hangers, one flanged joint. */
function SupplyDuct() {
  const id = useUid();
  const x0 = 12;
  const x1 = 120;
  const y = 78;
  const h = 26;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#b3b8bf" />
          <Stop offset="0.5" stopColor="#868b93" />
          <Stop offset="1" stopColor="#585d64" />
        </LinearGradient>
      </Defs>
      {[30, 100].map((x) => (
        <G key={x}>
          <Rod x={x - 6} y={y + h + 2} />
          <Rod x={x + 6} y={y + h + 2} />
          <Rect x={x - 9} y={y + h + 1} width={18} height={2.2} fill="#7b8088" stroke="#2c2f34" strokeWidth={0.3} />
        </G>
      ))}
      {/* foil-faced insulation wrap, then the sheet-metal duct */}
      <Rect x={x0 - 1.5} y={y - 1.5} width={x1 - x0 + 3} height={h + 3} rx={1} fill="#d7d9dc" opacity={0.35} stroke="#c7cad0" strokeWidth={0.5} strokeDasharray="2 1.4" />
      <Rect x={x0} y={y} width={x1 - x0} height={h} fill={`url(#${id}d)`} stroke="#2c2f34" strokeWidth={0.5} />
      {/* flanged joint */}
      <Rect x={66} y={y - 1.2} width={2.4} height={h + 2.4} fill="#4a4f56" stroke="#2c2f34" strokeWidth={0.3} />
      <Tag x={40} y={94.5} text="SUPPLY DUCT" />
    </G>
  );
}

/** 2-inch sprinkler main on clevis hangers; drops to pendant heads through
 *  escutcheons at the tiles. */
export const SPRINKLER = { y: 82, h: 3.6, x0: 126, x1: 336, drops: [204, 258, 316] } as const;
function SprinklerMain() {
  const id = useUid();
  const { y, h } = SPRINKLER;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ff9484" />
          <Stop offset="0.45" stopColor="#c8372b" />
          <Stop offset="1" stopColor="#6c1a13" />
        </LinearGradient>
      </Defs>
      {[232, 300].map((x) => (
        <G key={x}>
          <Rod x={x} y={y - 1} />
          <Path d={`M${x - 3.4} ${y - 1} V${y + h + 0.6} Q${x - 3.4} ${y + h + 3} ${x} ${y + h + 3} Q${x + 3.4} ${y + h + 3} ${x + 3.4} ${y + h + 0.6} V${y - 1}`} fill="none" stroke="#9aa0a8" strokeWidth={0.8} />
        </G>
      ))}
      <Rect x={SPRINKLER.x0} y={y} width={SPRINKLER.x1 - SPRINKLER.x0} height={h} fill={`url(#${id}r)`} stroke="#4a130d" strokeWidth={0.3} />
      {SPRINKLER.drops.map((x) => (
        <G key={x}>
          {/* 1-inch drop with its tee at the main */}
          <Rect x={x - 2.2} y={y - 0.6} width={4.4} height={h + 1.2} rx={0.6} fill="#a52e23" stroke="#4a130d" strokeWidth={0.3} />
          <Rect x={x - 0.9} y={y + h} width={1.8} height={TILE_Y - y - h} fill={`url(#${id}r)`} />
          {/* escutcheon at the tile, head below it: frame arms + deflector */}
          <Rect x={x - 3.2} y={TILE_Y + 2.6} width={6.4} height={1.2} rx={0.4} fill="#e6e6e6" />
          <Rect x={x - 0.9} y={TILE_Y + 3.8} width={1.8} height={2} fill="#c9a13c" />
          <Path d={`M${x - 1.6} ${TILE_Y + 5.8} L${x - 2.4} ${TILE_Y + 9.4} M${x + 1.6} ${TILE_Y + 5.8} L${x + 2.4} ${TILE_Y + 9.4}`} stroke="#c9a13c" strokeWidth={0.55} />
          <Circle cx={x} cy={TILE_Y + 7.4} r={0.9} fill="#ff4a3a" />
          <Line x1={x - 3} y1={TILE_Y + 9.6} x2={x + 3} y2={TILE_Y + 9.6} stroke="#c9a13c" strokeWidth={0.9} strokeLinecap="round" />
        </G>
      ))}
      <Tag x={204} y={99} text="SPRINKLER MAIN" />
    </G>
  );
}

/** Another trade's EMT on hangers, with couplings. */
function ForeignConduit() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e4e8ec" />
          <Stop offset="0.45" stopColor="#9ba1a8" />
          <Stop offset="1" stopColor="#4c5157" />
        </LinearGradient>
      </Defs>
      {[180, 262, 330].map((x) => (
        <G key={x}>
          <Rod x={x} y={42} />
          <Rect x={x - 2.6} y={41.4} width={5.2} height={1.2} fill="#80868f" />
        </G>
      ))}
      <Rect x={150} y={42.4} width={186} height={2.6} fill={`url(#${id}e)`} stroke="#3a3d43" strokeWidth={0.3} />
      {[206, 290].map((x) => (
        <Rect key={x} x={x - 2.5} y={41.8} width={5} height={3.8} rx={0.5} fill={`url(#${id}e)`} stroke="#3a3d43" strokeWidth={0.3} />
      ))}
      <Tag x={232} y={36} text="CONDUIT" />
    </G>
  );
}

/** Ladder cable tray on a trapeze, seen along its run, two runs lying on
 *  its rungs. */
export const TRAY = { x0: 58, x1: 180, top: 125, bottom: 133 } as const;
function TrayWithCables() {
  const id = useUid();
  const { x0, x1, top, bottom } = TRAY;
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}z`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d3d7dc" />
          <Stop offset="0.5" stopColor="#9ba1a8" />
          <Stop offset="1" stopColor="#5d636b" />
        </LinearGradient>
      </Defs>
      {[74, 166].map((x) => (
        <G key={x}>
          <Rod x={x - 7} y={bottom + 2} />
          <Rod x={x + 7} y={bottom + 2} />
          <Rect x={x - 10} y={bottom + 1} width={20} height={2.2} fill="#7b8088" stroke="#2c2f34" strokeWidth={0.3} />
        </G>
      ))}
      {/* far rail, rungs every 0.3 m, the cables on the rungs, the near rail */}
      <Rect x={x0} y={top} width={x1 - x0} height={bottom - top} fill="#3a3d43" opacity={0.6} />
      {[64, 82, 100, 118, 136, 154, 172].map((x) => (
        <Line key={x} x1={x} y1={top + 0.5} x2={x} y2={bottom - 0.5} stroke="#6d737b" strokeWidth={1.1} />
      ))}
      <JacketPath d={`M${x0 + 2} ${TRAY_CABLE_Y + 1.6} L${x1} ${TRAY_CABLE_Y + 1.6}`} color="#37d97b" width={2.2} shadow={false} />
      <Rect x={x0 - 1} y={top} width={x1 - x0 + 2} height={bottom - top} fill={`url(#${id}z)`} stroke="#3a3d43" strokeWidth={0.35} opacity={0.42} />
      <Line x1={x0 - 1} y1={top} x2={x1 + 1} y2={top} stroke="#dfe3e8" strokeWidth={0.6} />
      <Line x1={x0 - 1} y1={bottom} x2={x1 + 1} y2={bottom} stroke="#2c2f34" strokeWidth={0.6} />
      <Tag x={118} y={146} text="CABLE TRAY" />
    </G>
  );
}

/** A recessed troffer sitting in the grid: housing above, lens flush. */
export const TROFFER = { x0: 88, x1: 132, top: 156 } as const;
function Troffer() {
  const { x0, x1, top } = TROFFER;
  return (
    <G>
      <Rect x={x0} y={top} width={x1 - x0} height={TILE_Y - top + 1} fill="#2a2c31" stroke="#0a0a0c" strokeWidth={0.5} />
      <Rect x={x0 + 4} y={top + 1.4} width={x1 - x0 - 8} height={2.4} rx={0.4} fill="#3a3c42" stroke="#0a0a0c" strokeWidth={0.3} />
      <Rect x={x0 - 1} y={top - 1.2} width={x1 - x0 + 2} height={1.4} fill="#4a4f56" />
      <Rect x={x0} y={TILE_Y + 0.6} width={x1 - x0} height={2.6} fill="#fff3c2" opacity={0.9} />
      <Path d={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `M${x0 + i * 4} ${TILE_Y + 0.6} v2.6`).join('')} stroke="#e0d49c" strokeWidth={0.4} />
    </G>
  );
}

export function OtherTrades() {
  return (
    <G>
      <SupplyDuct />
      <SprinklerMain />
      <ForeignConduit />
      <TrayWithCables />
      <Troffer />
    </G>
  );
}

/** The suspended grid — inverted-T mains at 1.2 m carrying the tiles — and
 *  the room below with the labels a section drawing carries. */
export function GridAndTiles() {
  const tees = [0, 58, 116, 174, 232, 290, 334];
  return (
    <G>
      {tees.map((x, i) => {
        const nx = tees[i + 1];
        if (nx == null) return null;
        if (x === 58 || x === 116) {
          // the troffer occupies the bay between 88 and 132
          return (
            <G key={x}>
              <Rect x={x + 1} y={TILE_Y} width={x === 58 ? 29 : 0} height={2.4} fill="#cfccc3" />
              {x === 116 ? <Rect x={132} y={TILE_Y} width={41} height={2.4} fill="#cfccc3" /> : null}
            </G>
          );
        }
        return <Rect key={x} x={x + 1} y={TILE_Y} width={nx - x - 2} height={2.4} fill="#cfccc3" />;
      })}
      {tees.map((x) => (
        <Path key={x} d={`M${x - 0.45} ${TILE_Y - 1.6} h0.9 V${TILE_Y + 2.2} h1 v1.1 h-2.9 v-1.1 h1 Z`} fill="#f2f2f0" />
      ))}
      <Line x1={0} y1={TILE_Y + 2.4} x2={336} y2={TILE_Y + 2.4} stroke="#8d8a80" strokeWidth={0.35} />
      {/* the room */}
      <Rect x={0} y={176} width={336} height={44} fill="#0d0d10" />
      <Tag x={110} y={186} text="LIGHT FIXTURE" />
      <Line x1={110} y1={177} x2={110} y2={168} stroke="#6f7378" strokeWidth={0.6} />
      <Tag x={214} y={186} text="T-BAR GRID · TILES" />
      <Line x1={232} y1={177} x2={232} y2={167.6} stroke="#6f7378" strokeWidth={0.6} />
      <Tag x={300} y={186} text="PENDANT HEAD" />
      <Line x1={316} y1={177} x2={316} y2={173.6} stroke="#6f7378" strokeWidth={0.6} />
      <ScaleBar x={14} y={207} m={CM} metres={1} color="#8d9199" />
    </G>
  );
}

/** A J-hook on its rod (side view): deck anchor, rod, the formed J. */
export function JHookDrop({ x, top = 14, cradleY, w = 4.5 }: { x: number; top?: number; cradleY: number; w?: number }) {
  const d = `M${x - w} ${cradleY - w - 3} V${cradleY - w * 0.5} A${w} ${w} 0 0 0 ${x + w} ${cradleY - w * 0.5} V${cradleY - w - 1}`;
  return (
    <G>
      <Rod x={x} y={cradleY - w - 3} top={top} />
      <Path d={d} stroke="#2c2f34" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d={d} stroke="#c3c8cf" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** A bundle of other tenants' runs through a hook — horizontal, stacked. */
const BUNDLE = ['#5d6068', '#2d5f9e', '#5d6068', '#c4692a', '#2d5f9e', '#5d6068'];

/** The previous contractor's work — every wrong detail, drawn as real cable
 *  at real positions (the markers in data/scenarios.ts sit on these). */
export function CeilingDefects() {
  const cyan = '#4fd0e0';
  const green = '#37d97b';
  return (
    <G>
      {/* a shared route through three hooks 1.07 m apart — the middle one
          (cd-6) carries far more than its saddle: the stack overflows both
          sides and two runs ride on top */}
      {[130, 194, 258].map((x) => (
        <JHookDrop key={x} x={x} cradleY={70} />
      ))}
      <Tag x={96} y={51} text="J-HOOKS" />
      <Line x1={118} y1={51} x2={127} y2={60} stroke="#6f7378" strokeWidth={0.6} />
      {BUNDLE.map((c, i) => (
        <JacketPath key={i} d={`M0 ${68 - i * 1.9} H262 C300 ${68 - i * 1.9} 326 84 334 104`} color={c} width={2} shadow={i === 0} />
      ))}
      {/* the overflow at the stuffed hook: extra cable spilling over the lip */}
      <JacketPath d="M186 60 Q194 52 202 60" color="#c4692a" width={2} shadow={false} />
      <JacketPath d="M187.5 57 Q194 50 200.5 57" color="#5d6068" width={2} shadow={false} />

      {/* cd-2 → cd-4 → cd-1: the cyan audio pair leaving the stuffed hook
          LEFT — draped over the sprinkler main, resting on the light fixture
          housing, ending across the tiles at a bare connector */}
      <JacketPath
        d={`M190 58 Q176 58 168 66 Q160 74 158 ${SPRINKLER.y - 1.2} Q150 96 140 112 Q126 136 116 ${TROFFER.top - 1} Q104 ${TROFFER.top - 1} 96 ${TROFFER.top + 4} Q86 ${TILE_Y - 1} 72 ${TILE_Y - 1} H30`}
        color={cyan}
        width={2.4}
      />
      <Rect x={20} y={TILE_Y - 3.6} width={10} height={5} rx={1} fill="#26282d" stroke="#8d9199" strokeWidth={0.5} />
      <Path d="M22 161.2 h6 M22 163 h6" stroke="#8d9199" strokeWidth={0.5} />

      {/* cd-5 → cd-7: the cyan pair leaving RIGHT on top of the bundle,
          folded hard at 90° down, then through a ragged, unsleeved hole */}
      <JacketPath d="M198 58 H274 V106 H334" color={cyan} width={2.4} />
      <Path d="M270.6 55.4 L277.4 55.4 L277.4 62.2" stroke="#f2f4f6" strokeWidth={0.7} fill="none" />
      <Path d="M334 99 L346 97.4 L347.6 112.6 L335 114 Z" fill="#070708" stroke="#6f6b62" strokeWidth={0.9} />

      {/* cd-3: the green pair leaves the tray with no support until a hook
          2 m away — it hangs in a deep sag just above the tiles */}
      <JHookDrop x={300} cradleY={132} />
      <JacketPath d={`M${TRAY.x1} ${TRAY_CABLE_Y + 1.6} Q240 174 300 ${TRAY_CABLE_Y + 2}`} color={green} width={2.4} />
      <JacketPath d={`M300 ${TRAY_CABLE_Y + 2} C318 ${TRAY_CABLE_Y + 2} 328 120 331 110 L334 106`} color={green} width={2.4} />

      {/* cd-8: the green pair's service loop, tied on top of the rigid duct
          against the deck — nobody will ever reach it */}
      <JacketPath d="M0 60 Q22 60 36 64" color={green} width={2.4} />
      <JacketPath d="M35 67 a9 7 0 1 0 18 0 a9 7 0 1 0 -18 0" color={green} width={2.4} />
      <JacketPath d="M38 67 a6 4.6 0 1 0 12 0 a6 4.6 0 1 0 -12 0" color={green} width={2.2} shadow={false} />
      <G transform="rotate(90 44 60.5)">
        <CableTie x={44} y={60.5} k={0.8} halfH={9} black />
      </G>
      <JacketPath d={`M52 71 Q60 96 60 ${TRAY_CABLE_Y + 1.6}`} color={green} width={2.4} />
    </G>
  );
}

/** The bushed sleeve through the far wall (the intended entry). */
export function WallSleeve() {
  return (
    <G>
      <Rect x={332} y={122} width={22} height={8} rx={1} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      <Rect x={331} y={120.8} width={2.6} height={10.4} rx={0.8} fill="#c5c9cf" stroke="#2c2f34" strokeWidth={0.4} />
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
