/**
 * STAGE 8 — the ABOVE-CEILING cutaway, drawn as a trade-textbook building
 * SECTION (owner 2026-09-28: the previous pass was "too poor to be useful" —
 * grey outline boxes, thin lines, cables looping through space).
 *
 * viewBox 360 × 220 at m = 60 units per metre: a 6 m wide slice of a
 * suspended-ceiling cavity 2.5 m deep (a large-venue ceiling). Every system
 * is drawn as the object a technician recognises, at its size relative to
 * the others, with the section conventions of an architectural drawing:
 *   • concrete slab on corrugated metal deck, steel beams seen end-on
 *   • 12-gauge hanger wires from the deck to the grid at 1.22 m, wrapped at
 *     both ends; the grid itself as inverted tees on a 0.61 m module
 *     carrying the tiles, a wall angle at the wall
 *   • an insulated supply duct on trapeze hangers
 *   • a 2-inch sprinkler main on clevis hangers with drops to pendant heads
 *     centred in their tiles
 *   • EMT conduit on hangers, coupled, hung between the beams
 *   • ladder cable tray on a trapeze, cables lying on its rungs
 *   • a lay-in troffer filling one grid module, its two slack safety wires
 *     to structure; a CMU wall with its sleeve
 * Labels are halo text on the drawing (≥ 9 pt inline) so the picture reads
 * BEFORE the exercise; a 1 m scale bar keeps the proportions honest (cable
 * diameters are exaggerated for visibility — the tint note says so).
 *
 * The scene's geometry is anchored here: the tray end (x 180, y 128) and the
 * bushed sleeve (y 126) are where Exercise 2's run lives; the defect
 * positions in data/scenarios.ts sit ON the vignettes below.
 */
import { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../../../theme/tokens';
import { CableTie, ConcreteCut, JacketPath, ScaleBar, useUid } from '../svgArt';

/** units per metre. */
export const CM = 60;
/** Tile top (the underside of the cavity). */
export const TILE_Y = 163;
/** Tile thickness (16 mm lay-in tile). */
const TILE_T = 1.2;
/** Where cable lies in the tray / the level of the supported run. */
export const TRAY_CABLE_Y = 128;
/** The grid module: 0.61 m, tees placed so one module holds the troffer. */
const MODULE = 0.61 * CM;
const TEE_XS = Array.from({ length: 9 }, (_, i) => 14.6 + i * MODULE).filter((x) => x < 334);
/** Label size — 9.6 units ≈ 9.1 pt at the inline width (343 px). */
const LABEL = 9.6;
const LABEL_INK = '#b9bdc6';

/** A drawing label with a thin dark halo — the section-drawing convention: it
 *  stays legible over linework without a pill hiding what is behind it. */
function Tag({ x, y, text, anchor = 'middle', ink = LABEL_INK }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; ink?: string }) {
  const common = { x, y: y + 3.4, fontFamily: fonts.oswaldSemiBold, fontSize: LABEL, textAnchor: anchor, letterSpacing: LABEL * 0.06 } as const;
  return (
    <G>
      <SvgText {...common} fill="none" stroke="#111216" strokeWidth={2.8} strokeLinejoin="round">
        {text}
      </SvgText>
      <SvgText {...common} fill={ink}>
        {text}
      </SvgText>
    </G>
  );
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
      {/* steel beams seen end-on (W sections), 1.2 m apart */}
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
      {/* hanger wires to the grid, every 1.22 m */}
      {TEE_XS.filter((_, i) => i % 2 === 0).map((x) => (
        <HangerWire key={x} x={x} />
      ))}
      <Tag x={150} y={6} text="CONCRETE ON METAL DECK" />
      <Tag x={76} y={21} text="STEEL BEAMS" />
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
      <Rect x={40} y={y - 1.2} width={2.4} height={h + 2.4} fill="#4a4f56" stroke="#2c2f34" strokeWidth={0.3} />
      <SvgText x={86} y={y + h / 2 + 3.4} fontFamily={fonts.oswaldSemiBold} fontSize={LABEL} fill="#1b1c20" textAnchor="middle">
        SUPPLY DUCT
      </SvgText>
    </G>
  );
}

/** 2-inch sprinkler main on clevis hangers; drops to pendant heads centred
 *  in their tiles through escutcheons. */
export const SPRINKLER = { y: 82, h: 3.6, x0: 126, x1: 336, drops: [TEE_XS[4] + MODULE / 2, TEE_XS[6] + MODULE / 2, TEE_XS[8] + (334 - TEE_XS[8]) / 2] } as const;
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
      {[224, 288].map((x) => (
        <G key={x}>
          <Rod x={x} y={y - 1} />
          <Path d={`M${x - 3.4} ${y - 1} V${y + h + 0.6} Q${x - 3.4} ${y + h + 3} ${x} ${y + h + 3} Q${x + 3.4} ${y + h + 3} ${x + 3.4} ${y + h + 0.6} V${y - 1}`} fill="none" stroke="#9aa0a8" strokeWidth={0.8} />
        </G>
      ))}
      <Rect x={SPRINKLER.x0} y={y} width={SPRINKLER.x1 - SPRINKLER.x0} height={h} fill={`url(#${id}r)`} stroke="#4a130d" strokeWidth={0.3} />
      {/* the main continues out of the section — a break line, not a dead end */}
      <Path d={`M${SPRINKLER.x0 + 1} ${y - 1.4} l-2 2.2 l2 1.4 l-2 2.2`} stroke="#d9d7d0" strokeWidth={0.6} fill="none" />
      {SPRINKLER.drops.map((x) => (
        <G key={x}>
          {/* 1-inch drop with its tee at the main */}
          <Rect x={x - 2.2} y={y - 0.6} width={4.4} height={h + 1.2} rx={0.6} fill="#a52e23" stroke="#4a130d" strokeWidth={0.3} />
          <Rect x={x - 0.9} y={y + h} width={1.8} height={TILE_Y - y - h} fill={`url(#${id}r)`} />
          {/* pendant head just below the tile: escutcheon, frame, deflector */}
          <Rect x={x - 3} y={TILE_Y + TILE_T} width={6} height={0.8} rx={0.3} fill="#e6e6e6" />
          <Path d={`M${x - 1.2} ${TILE_Y + TILE_T + 0.8} L${x - 1.8} ${TILE_Y + TILE_T + 3.4} M${x + 1.2} ${TILE_Y + TILE_T + 0.8} L${x + 1.8} ${TILE_Y + TILE_T + 3.4}`} stroke="#c9a13c" strokeWidth={0.55} />
          <Circle cx={x} cy={TILE_Y + TILE_T + 2} r={0.8} fill="#ff4a3a" />
          <Line x1={x - 2.6} y1={TILE_Y + TILE_T + 3.6} x2={x + 2.6} y2={TILE_Y + TILE_T + 3.6} stroke="#c9a13c" strokeWidth={0.9} strokeLinecap="round" />
        </G>
      ))}
      <Tag x={205} y={93} text="SPRINKLER" />
      <Tag x={205} y={104} text="MAIN" />
    </G>
  );
}

/** Another trade's EMT on hangers between the beams, with couplings; it
 *  continues out of the section at the left (break line). */
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
      {[168, 226, 296].map((x) => (
        <G key={x}>
          <Rod x={x} y={42} />
          <Rect x={x - 2.6} y={41.4} width={5.2} height={1.2} fill="#80868f" />
        </G>
      ))}
      <Rect x={150} y={42.4} width={186} height={2.6} fill={`url(#${id}e)`} stroke="#3a3d43" strokeWidth={0.3} />
      <Path d="M151 41.2 l-1.6 1.6 l1.6 1.2 l-1.6 1.6" stroke="#d9d7d0" strokeWidth={0.5} fill="none" />
      {[206, 270].map((x) => (
        <Rect key={x} x={x - 2.5} y={41.8} width={5} height={3.8} rx={0.5} fill={`url(#${id}e)`} stroke="#3a3d43" strokeWidth={0.3} />
      ))}
      <Tag x={242} y={34} text="CONDUIT" />
    </G>
  );
}

/** Ladder cable tray on a trapeze, seen along its run (it continues out of
 *  the section at the left), existing cable lying on its rungs. */
export const TRAY = { x0: 2, x1: 180, top: 125, bottom: 133 } as const;
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
      {Array.from({ length: 10 }, (_, i) => 10 + i * 18).map((x) => (
        <Line key={x} x1={x} y1={top + 0.5} x2={x} y2={bottom - 0.5} stroke="#6d737b" strokeWidth={1.1} />
      ))}
      <JacketPath d={`M${x0 + 2} ${TRAY_CABLE_Y + 1.6} L${x1} ${TRAY_CABLE_Y + 1.6}`} color="#37d97b" width={2.2} shadow={false} />
      <Rect x={x0 - 1} y={top} width={x1 - x0 + 2} height={bottom - top} fill={`url(#${id}z)`} stroke="#3a3d43" strokeWidth={0.35} opacity={0.42} />
      <Line x1={x0 - 1} y1={top} x2={x1 + 1} y2={top} stroke="#dfe3e8" strokeWidth={0.6} />
      <Line x1={x0 - 1} y1={bottom} x2={x1 + 1} y2={bottom} stroke="#2c2f34" strokeWidth={0.6} />
      <Tag x={96} y={117} text="CABLE TRAY" />
    </G>
  );
}

/** A lay-in troffer filling one grid module: housing above, lens flush, its
 *  flange on the tees, and its two slack safety wires to structure — someone
 *  else's wires, never a cable support. */
export const TROFFER = { x0: TEE_XS[2], x1: TEE_XS[3], top: 156 } as const;
function Troffer() {
  const { x0, x1, top } = TROFFER;
  return (
    <G>
      {/* safety wires, deliberately slack, to the deck */}
      <Path d={`M${x0 + 4} ${top} C${x0 + 1} 120 ${x0 + 6} 60 ${x0 + 3} 14`} stroke="#8a8f97" strokeWidth={0.45} fill="none" />
      <Path d={`M${x1 - 4} ${top} C${x1 - 1} 124 ${x1 - 6} 64 ${x1 - 3} 14`} stroke="#8a8f97" strokeWidth={0.45} fill="none" />
      <Rect x={x0 + 1} y={top} width={x1 - x0 - 2} height={TILE_Y - top} fill="#2a2c31" stroke="#0a0a0c" strokeWidth={0.5} />
      <Rect x={x0 + 4} y={top + 1.4} width={x1 - x0 - 8} height={2.4} rx={0.4} fill="#3a3c42" stroke="#0a0a0c" strokeWidth={0.3} />
      {/* flange resting on the tee flanges, lens flush with the tiles */}
      <Rect x={x0 - 0.6} y={TILE_Y} width={x1 - x0 + 1.2} height={0.8} fill="#4a4f56" />
      <Rect x={x0 + 0.8} y={TILE_Y + 0.4} width={x1 - x0 - 1.6} height={TILE_T + 0.6} fill="#fff3c2" opacity={0.9} />
    </G>
  );
}

export function OtherTrades() {
  return (
    <G>
      {/* the tray first: its trapeze rods pass BEHIND the duct, as they are */}
      <TrayWithCables />
      <SupplyDuct />
      <SprinklerMain />
      <ForeignConduit />
      <Troffer />
    </G>
  );
}

/** The suspended grid — inverted tees on a 0.61 m module carrying the tiles,
 *  a wall angle at the wall — and the room below with its labels. */
export function GridAndTiles() {
  const edges = [0, ...TEE_XS, 336];
  return (
    <G>
      {edges.slice(0, -1).map((x, i) => {
        const nx = edges[i + 1];
        if (x === TROFFER.x0) return null; // the troffer fills this module
        return <Rect key={x} x={x + 0.8} y={TILE_Y} width={nx - x - 1.6} height={TILE_T} fill="#cfccc3" />;
      })}
      {TEE_XS.map((x) => (
        <Path key={x} d={`M${x - 0.35} ${TILE_Y - 2} h0.7 V${TILE_Y + TILE_T - 0.3} h0.4 v0.7 h-1.5 v-0.7 h0.4 Z`} fill="#f2f2f0" />
      ))}
      {/* wall angle */}
      <Path d={`M336 ${TILE_Y - 2} V${TILE_Y + TILE_T + 0.4} H332.6`} stroke="#f2f2f0" strokeWidth={0.8} fill="none" />
      <Line x1={0} y1={TILE_Y + TILE_T} x2={336} y2={TILE_Y + TILE_T} stroke="#8d8a80" strokeWidth={0.35} />
      {/* the room */}
      <Rect x={0} y={176} width={336} height={44} fill="#0d0d10" />
      <Tag x={106} y={186} text="LIGHT FIXTURE" />
      <Line x1={106} y1={180} x2={106} y2={166} stroke="#6f7378" strokeWidth={0.6} />
      <Tag x={214} y={186} text="T-BAR GRID · TILES" />
      <Line x1={214} y1={180} x2={214} y2={165} stroke="#6f7378" strokeWidth={0.6} />
      <Tag x={300} y={186} text="PENDANT HEAD" />
      <Line x1={SPRINKLER.drops[2]} y1={180} x2={SPRINKLER.drops[2]} y2={169.4} stroke="#6f7378" strokeWidth={0.6} />
      <ScaleBar x={14} y={207} m={CM} metres={1} color="#8d9199" />
    </G>
  );
}

/**
 * A J-hook on its rod (side view), drawn as the hardware is: the rod lands on
 * the tall BACK arm, the arm drops into the rounded saddle, a short front lip
 * retains the cable. `cradleY` = the saddle bottom, where the lowest cable's
 * underside rests; `w` = saddle radius (hook size).
 */
export function JHookDrop({ x, top = 14, cradleY, w = 4.5, back = 8, lip = 2.6 }: { x: number; top?: number; cradleY: number; w?: number; back?: number; lip?: number }) {
  const armTop = cradleY - w - back;
  const d = `M${x - w} ${armTop} V${cradleY - w} A${w} ${w} 0 0 0 ${x + w} ${cradleY - w} V${cradleY - w - lip}`;
  return (
    <G>
      <Rod x={x - w} y={armTop} top={top} />
      <Path d={d} stroke="#2c2f34" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Path d={d} stroke="#c3c8cf" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </G>
  );
}

/** A bundle of other tenants' runs through a hook — horizontal, stacked. */
const BUNDLE = ['#5d6068', '#2d5f9e', '#5d6068', '#c4692a', '#2d5f9e', '#5d6068'];
/** The shared route's saddle (the bottom cable's underside). */
const BUNDLE_BASE = 69;

/** The previous contractor's work — every wrong detail, drawn as real cable
 *  at real positions (the markers in data/scenarios.ts sit on these). */
export function CeilingDefects() {
  const cyan = '#4fd0e0';
  const green = '#37d97b';
  return (
    <G>
      {/* a shared route on hooks ~1.1 m apart: the outer hooks are sized for
          the stack; the middle one (cd-6) is a small hook that holds only the
          bottom of it — the rest rides above its lip and two runs have
          spilled over the front */}
      <Tag x={100} y={46} text="J-HOOKS" />
      <Line x1={114} y1={50} x2={124} y2={57} stroke="#6f7378" strokeWidth={0.6} />
      {BUNDLE.map((c, i) => (
        <JacketPath key={i} d={`M0 ${BUNDLE_BASE - 1 - i * 1.9} H262 C300 ${BUNDLE_BASE - 1 - i * 1.9} 326 84 334 104`} color={c} width={2} shadow={i === 0} />
      ))}
      {/* the hooks drawn over the stack, so the saddle reads as carrying it */}
      <JHookDrop x={66} cradleY={BUNDLE_BASE + 0.4} w={6.6} lip={9} back={6} />
      <JHookDrop x={132} cradleY={BUNDLE_BASE + 0.4} w={6.6} lip={9} back={6} />
      <JHookDrop x={197} cradleY={BUNDLE_BASE + 0.4} w={3} lip={1.6} back={9} />
      <JHookDrop x={262} cradleY={BUNDLE_BASE + 0.4} w={6.6} lip={9} back={6} />
      {/* the spill at the undersized hook: two runs fallen over its front lip,
          hanging in a loop below it */}
      <JacketPath d="M188 58.5 C194 58.5 200 60 201 66 C202 74 196 78 193 74 C191 71 196 64 206 58.5" color="#c4692a" width={2} shadow={false} />
      <JacketPath d="M186 56.6 C193 56.6 203 58 204 67 C205 79 196 83 191 77 C188 72 196 62 208 56.6" color="#2d5f9e" width={2} shadow={false} />

      {/* cd-2 → cd-4 → cd-1: the cyan audio pair leaving the stuffed hook
          LEFT — draped over the sprinkler main, resting on the light fixture
          housing, ending across the tiles at a bare connector */}
      <JacketPath
        d={`M193 58 Q180 58 174 66 Q170 74 170 ${SPRINKLER.y - 1.4} L148 ${SPRINKLER.y - 1.4} Q142 96 138 112 Q126 136 116 ${TROFFER.top - 1} Q104 ${TROFFER.top - 1} 96 ${TROFFER.top + 4} Q86 ${TILE_Y - 1} 72 ${TILE_Y - 1} H30`}
        color={cyan}
        width={2.4}
      />
      <Rect x={20} y={TILE_Y - 3.6} width={10} height={5} rx={1} fill="#26282d" stroke="#8d9199" strokeWidth={0.5} />
      <Path d="M22 161.2 h6 M22 163 h6" stroke="#8d9199" strokeWidth={0.5} />

      {/* cd-5 → cd-7: the cyan pair leaving RIGHT on top of the bundle,
          folded hard at 90° down (the defect), swept at the bottom, then
          through a ragged, unsleeved hole in the wall */}
      <JacketPath d="M201 58 H274 V100 Q274 106 280 106 H334" color={cyan} width={2.4} />
      <Path d="M270.6 55.4 L277.4 55.4 L277.4 62.2" stroke="#f2f4f6" strokeWidth={0.7} fill="none" />
      <Path d="M334 99 L346 97.4 L347.6 112.6 L335 114 Z" fill="#070708" stroke="#6f6b62" strokeWidth={0.9} />

      {/* cd-3: the green pair leaves the tray with no support until a hook
          2 m away — it hangs in a deep sag just above the tiles */}
      <JHookDrop x={300} cradleY={140.4} />
      <JacketPath d={`M${TRAY.x1} ${TRAY_CABLE_Y + 1.6} Q240 180 300 139.2`} color={green} width={2.4} />
      <JacketPath d="M300 139.2 C314 139.2 326 124 330 112 L334 106" color={green} width={2.4} />

      {/* cd-8: the green pair's service loop, coiled and tied on TOP of the
          insulated duct — no tile below it gives access */}
      <JacketPath d="M0 64 Q22 64 34 70" color={green} width={2.4} />
      <JacketPath d="M33 72.4 a10 3.8 0 1 0 20 0 a10 3.8 0 1 0 -20 0" color={green} width={2.4} />
      <JacketPath d="M36 72.6 a7 2.6 0 1 0 14 0 a7 2.6 0 1 0 -14 0" color={green} width={2.2} shadow={false} />
      <CableTie x={43} y={72.5} k={0.8} halfH={5} black />
      <JacketPath d={`M53 73 C62 76 64 100 62 ${TRAY_CABLE_Y + 1.6}`} color={green} width={2.4} />
    </G>
  );
}

/** The bushed sleeve through the far wall (the intended entry). */
export function WallSleeve({ label = true }: { label?: boolean }) {
  return (
    <G>
      <Rect x={332} y={122} width={22} height={8} rx={1} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      <Rect x={331} y={120.8} width={2.6} height={10.4} rx={0.8} fill="#c5c9cf" stroke="#2c2f34" strokeWidth={0.4} />
      {label ? (
        <>
          <Tag x={298} y={157} text="BUSHED SLEEVE" />
          <Line x1={330} y1={153} x2={333} y2={131} stroke="#6f7378" strokeWidth={0.6} />
        </>
      ) : null}
    </G>
  );
}

/**
 * FINISHED VIEW — the SAME section, same scale and framing, after the work is
 * done right (owner 2026-09-28: the old finished view framed the ceiling from
 * a different viewpoint; above ↔ finished must read as a true before/after of
 * one space). Every as-found defect, corrected:
 *   cd-6  the undersized middle hook replaced — all four hooks sized for the
 *         stack, nothing spilling
 *   cd-1/2/4  the cyan audio pair no longer drapes over the sprinkler main,
 *         rests on the troffer or lies on the tiles — it rides the shared
 *         hook route out of the section
 *   cd-5/7  no hard fold: the right-hand cyan pair stays in the bundle, which
 *         runs level into a sleeved, bushed opening (the ragged hole is gone)
 *   cd-3/8  the green pair is drawn by the scene with the new run (it shares
 *         its hooks); its service loop lies in the tray, not on the duct
 */
export function CorrectedExisting() {
  const cyan = '#4fd0e0';
  /** the shared route, now carrying both audio pairs on top of the stack */
  const stack = [...BUNDLE, cyan, cyan];
  const topY = BUNDLE_BASE - 1 - (stack.length - 1) * 1.9;
  return (
    <G>
      <Tag x={100} y={46} text="J-HOOKS" />
      <Line x1={114} y1={50} x2={124} y2={57} stroke="#6f7378" strokeWidth={0.6} />
      {/* the wall entry at the route's own elevation — a sleeve through the
          masonry, bushed — so the bundle runs level straight into it, clear
          of the sprinkler main below (as found it dived past the main into
          a ragged hole) */}
      <Rect x={332} y={topY - 2.6} width={22} height={BUNDLE_BASE - topY + 3.6} rx={1} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      {stack.map((c, i) => {
        const y = BUNDLE_BASE - 1 - i * 1.9;
        return <JacketPath key={i} d={`M0 ${y} H344`} color={c} width={2} shadow={i === 0} />;
      })}
      <Rect x={331} y={topY - 4} width={2.6} height={BUNDLE_BASE - topY + 6.4} rx={0.8} fill="#c5c9cf" stroke="#2c2f34" strokeWidth={0.4} />
      {/* every hook sized for the stack it carries */}
      {[66, 132, 197, 262].map((x) => (
        <JHookDrop key={x} x={x} cradleY={BUNDLE_BASE + 0.4} w={7} lip={11} back={5} />
      ))}
    </G>
  );
}
