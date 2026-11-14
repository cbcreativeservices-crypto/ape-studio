/**
 * topArtWorld — top-view art for the percussion, the reeds and brass, the
 * electronic rigs and the choir added for more diverse music (owner
 * 2026-11-13: "We also need more symbols for more diverse music"). See
 * topArtTypes.ts for the contract: centered on 0,0, 32 floor units to the
 * meter, the FRONT toward the audience (+y), the PLAYER UPSTAGE (−y) facing
 * the audience, so the player's right hand is at −x and the left at +x.
 *
 * What is drawn, part by part (sizes from a live-sound reviewer and from
 * makers' published dimensions; the lab's notes name them):
 *   • choir on a riser: a three-step choral riser (1.85 × 1.4 m, the back
 *     step highest) with eleven singers in window spacing, the same figure
 *     from above that the stage draws for a performer;
 *   • electronic drum kit: the rack's black tubes and clamps round mesh-head
 *     pads, the kick tower with its pedal, the hi-hat pad over its
 *     controller pedal, rubber cymbal pads with their bells, the module on
 *     the rack beside the hi-hat, the throne upstage; right-handed, so the
 *     snare and hi-hat are on the drummer's left (+x), as on the drum kit;
 *   • cajón (drawn 1.25 × life): the plywood seat, the ply layers of the
 *     side and back panels at its edges, the darker front plate (tapa) along
 *     the audience's side. The sound port is in the back face: not seen;
 *   • djembe (1.2 × life): the goatskin head, the rope crown with its loops,
 *     the trimmed hair below the ring;
 *   • tabla on a floor rug: the small wooden dayan at the player's right
 *     hand and the metal bayan at the left, each head with its braided rim
 *     and black syahi (centered on the dayan, off center on the bayan, on
 *     the side away from the player), the straps and the dayan's tuning
 *     blocks; the rug the player sits on;
 *   • steel pan (a tenor, about 0.57 m across): the chrome rim and the
 *     dished face with its three rings of notes (12, 12 and 5) and the
 *     grooves between them; the stand's feet;
 *   • vibraphone (three octaves, 1.42 m long, 0.76 m deep at the low end):
 *     the tapered frame, the aluminum bars in two rows (naturals nearest the
 *     player, accidentals beyond, the low end at the player's LEFT, +x, as
 *     on a piano), the suspension cords through the bars, the resonators and
 *     the fan shafts showing between them;
 *   • saxophone (an alto, as it is held): the mouthpiece and neck at the
 *     player, the body sloping forward and to the player's right, the bell
 *     opening up and forward, a few key cups on the body;
 *   • trombone (a tenor, slide in first position): the slide reaching
 *     toward the audience with its brace and end crook, the bell beside it
 *     on the player's left facing the audience, the tuning slide back over
 *     the player's shoulder;
 *   • DJ table: a table with two media players either side of a four-channel
 *     mixer, a laptop and headphones. The DJ is upstage, so the jog wheels,
 *     the play and cue buttons and the faders are on the DJ's side, the
 *     screens beyond them.
 *
 * Pure drawings: no state, no text, no image file. The choir's singers are
 * the house figure (features/lab/figureAboveSvg), as on the stage.
 */
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { FigureAboveSvg } from '../../../../features/lab/figureAboveSvg';
import type { TopArtMap } from './topArtTypes';

/** How far each drawing reaches from its center, in floor units (the shadow
 *  aside). A test holds each inside its print symbol's footprint. */
export const TOP_ART_WORLD_EXTENT = {
  choir: { hw: 29.5, hh: 22.3 },
  'e-drums': { hw: 23.55, hh: 17.45 },
  cajon: { hw: 6.15, hh: 6.15 },
  djembe: { hw: 7.1, hh: 7.05 },
  tabla: { hw: 15.6, hh: 15.95 },
  'steel-pan': { hw: 9.8, hh: 10.4 },
  vibraphone: { hw: 22.6, hh: 12.0 },
  saxophone: { hw: 3.25, hh: 6.85 },
  trombone: { hw: 5.35, hh: 19.55 },
  dj: { hw: 28.75, hh: 11.95 },
} as const;

const SHADOW = 'rgba(0,0,0,0.45)';
const SHADOW_AT = 'translate(0.8 1.2)';
const OUTLINE = '#0a0a0c';
const STEEL = '#c9c6bc';
const STEEL_DK = '#4a4a46';
const CHROME = '#d4d6da';
const BRASS = '#b39b48';
const BRASS_DK = '#4a3f18';
const BRASS_LT = '#e2d08a';
const SKIN = '#dccfae';
const SKIN_EDGE = '#8d7f5c';
const WOOD = '#7a4c2c';
const WOOD_DK = '#2a180c';
const BIRCH = '#c9a86a';
const RUBBER = '#15161a';
const TUBE = '#2a2c31';
const IVORY = '#e8e6dd';

/** `n` angles (radians) evenly round a circle, the first at `startDeg`. */
const around = (n: number, startDeg = 0): number[] => Array.from({ length: n }, (_, i) => ((startDeg + (360 / n) * i) * Math.PI) / 180);

/* ── choir on a riser ── */

const RISER_HW = 29.35;
const STEPS = [-22.1, -7.4, 7.4, 22.1];
/** Window spacing: the middle row stands in the gaps of the back row. */
const SINGERS: [number, number][] = [
  ...[-21.1, -7.0, 7.0, 21.1].map((x) => [x, -14.6] as [number, number]),
  ...[-14.6, 0, 14.6].map((x) => [x, 0.2] as [number, number]),
  ...[-21.1, -7.0, 7.0, 21.1].map((x) => [x, 15.0] as [number, number]),
];

function ChoirTop() {
  return (
    <G>
      <Rect x={-RISER_HW + 0.8} y={STEPS[0]! + 1.2} width={RISER_HW * 2} height={STEPS[3]! - STEPS[0]!} rx={0.6} fill={SHADOW} />
      {/* three carpeted decks, the back one highest, each with its metal
          nosing, and the higher deck's shadow on the one in front */}
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Rect x={-RISER_HW} y={STEPS[i]!} width={RISER_HW * 2} height={STEPS[i + 1]! - STEPS[i]!} rx={0.5} fill={['#3d4048', '#33363d', '#2a2c32'][i]} stroke={OUTLINE} strokeWidth={0.4} />
          <Rect x={-RISER_HW + 0.3} y={STEPS[i + 1]! - 0.9} width={RISER_HW * 2 - 0.6} height={0.7} fill="#8d9199" />
          {i > 0 ? <Rect x={-RISER_HW + 0.3} y={STEPS[i]! + 0.1} width={RISER_HW * 2 - 0.6} height={1.2} fill="rgba(0,0,0,0.35)" /> : null}
        </G>
      ))}
      {SINGERS.map(([x, y]) => (
        <FigureAboveSvg key={`${x},${y}`} x={x} y={y} pxPerMm={0.032} facingDeg={0} halo="#c3cde2" />
      ))}
    </G>
  );
}

/* ── electronic drum kit ── */

/** A mesh-head pad: rubber rim, the mesh, its fine weave. */
function MeshPad({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={RUBBER} stroke={OUTLINE} strokeWidth={0.35} />
      <Circle cx={cx} cy={cy} r={r - 0.55} fill="#8d9199" />
      <Circle cx={cx} cy={cy} r={r - 0.55} fill="none" stroke="#a9adb5" strokeWidth={0.12} strokeDasharray="0.25 0.25" />
      <Circle cx={cx} cy={cy} r={(r - 0.55) * 0.55} fill="none" stroke="#7d8189" strokeWidth={0.1} />
    </G>
  );
}

/** A rubber cymbal pad: the edge, the playing area, the raised bell. */
function CymbalPad({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#3a3d44" stroke="#9aa0a8" strokeWidth={0.35} />
      <Circle cx={cx} cy={cy} r={r - 0.5} fill="none" stroke="#565a63" strokeWidth={0.3} />
      <Circle cx={cx} cy={cy} r={r * 0.24} fill="#2c2e33" stroke="#4a4e56" strokeWidth={0.2} />
      <Circle cx={cx} cy={cy} r={0.3} fill={CHROME} />
    </G>
  );
}

const ED = {
  throne: { cx: 0, cy: -16, r: 5.0 },
  snare: { cx: 7.6, cy: -2.4, r: 4.6 },
  hat: { cx: 15.8, cy: -1, r: 4.4 },
  tom1: { cx: -4.6, cy: 4.4, r: 3.4 },
  tom2: { cx: 4.8, cy: 4.4, r: 3.4 },
  floor: { cx: -13.4, cy: -4.4, r: 4.4 },
  crash: { cx: 12, cy: 8, r: 5.4 },
  ride: { cx: -16.5, cy: 4, r: 6.4 },
};
const RACK = 'M-18 -12.2 V9.2 H18 V-12.2';

function EDrumsTop() {
  return (
    <G transform="translate(0 3.9)">
      <G transform={SHADOW_AT}>
        <Path d={RACK} fill="none" stroke={SHADOW} strokeWidth={1.1} />
        {[ED.snare, ED.hat, ED.tom1, ED.tom2, ED.floor, ED.crash, ED.ride, ED.throne].map((p) => (
          <Circle key={`${p.cx}${p.cy}`} cx={p.cx} cy={p.cy} r={p.r} fill={SHADOW} />
        ))}
      </G>
      {/* the rack: three black tubes, its feet, the clamps */}
      <Path d={RACK} fill="none" stroke="#3a3d44" strokeWidth={1.0} strokeLinejoin="round" />
      <Path d={RACK} fill="none" stroke="#8d9199" strokeWidth={0.25} strokeLinejoin="round" />
      {[
        [-18, -12.2],
        [18, -12.2],
        [-18, 9.2],
        [18, 9.2],
      ].map(([x, y]) => (
        <Rect key={`${x}${y}`} x={x - 1} y={y - 1} width={2} height={2} rx={0.4} fill={STEEL} stroke={OUTLINE} strokeWidth={0.2} />
      ))}
      {/* the arms from the rack to the cymbals and toms */}
      <Path d="M18 6 L12 8 M-18 2 L-16.5 4 M-4 9.2 L-4.6 4.4 M4 9.2 L4.8 4.4" stroke="#6d7179" strokeWidth={0.55} />
      {/* the throne */}
      <Circle cx={ED.throne.cx} cy={ED.throne.cy} r={ED.throne.r} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.4} />
      <Circle cx={ED.throne.cx} cy={ED.throne.cy} r={ED.throne.r - 0.8} fill="#2c2e33" />
      {/* the kick pedal, its beater, the kick tower with its mesh head */}
      <Rect x={-1.2} y={-5.6} width={2.4} height={6.2} rx={0.4} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.2} />
      <Line x1={0} y1={0.6} x2={0} y2={1.8} stroke={STEEL_DK} strokeWidth={0.4} />
      <Rect x={-4} y={0.8} width={8} height={3.8} rx={0.5} fill={RUBBER} stroke="#6d7179" strokeWidth={0.35} />
      <Rect x={-3.3} y={1.0} width={6.6} height={1.0} rx={0.3} fill="#8d9199" />
      {/* the hi-hat controller pedal, under its pad */}
      <Rect x={14.4} y={-10.6} width={2.8} height={6.4} rx={0.4} fill={RUBBER} stroke="#6d7179" strokeWidth={0.2} />
      <MeshPad {...ED.floor} />
      <MeshPad {...ED.tom1} />
      <MeshPad {...ED.tom2} />
      <MeshPad {...ED.snare} />
      <CymbalPad {...ED.hat} />
      <CymbalPad {...ED.ride} />
      <CymbalPad {...ED.crash} />
      {/* the module on the rack beside the hi-hat: its screen and knobs */}
      <Rect x={17.6} y={-13.8} width={5.8} height={3.8} rx={0.4} fill="#26282d" stroke={OUTLINE} strokeWidth={0.3} />
      <Rect x={18.2} y={-13.2} width={2.6} height={1.4} rx={0.15} fill="#2c4a5e" />
      <Circle cx={21.8} cy={-12.5} r={0.6} fill="#3a3d44" stroke="#9aa0a8" strokeWidth={0.15} />
      <Path d="M18.3 -11 h0.7 M19.4 -11 h0.7 M20.5 -11 h0.7" stroke="#9aa0a8" strokeWidth={0.3} />
    </G>
  );
}

/* ── cajón (1.25 × life: a 30 cm seat) ── */

function CajonTop() {
  const h = 6.0;
  const ply = (x1: number, y1: number, x2: number, y2: number, k: number) => <Line key={`${x1}${y1}${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={k % 2 ? '#8a6a3c' : '#d9bd85'} strokeWidth={0.12} />;
  return (
    <G>
      <Rect x={-h + 0.8} y={-h + 1.2} width={h * 2} height={h * 2} rx={0.4} fill={SHADOW} />
      {/* the seat: birch plywood */}
      <Rect x={-h} y={-h} width={h * 2} height={h * 2} rx={0.4} fill={BIRCH} stroke={OUTLINE} strokeWidth={0.35} />
      <Path d="M-5.4 -3.6 C-2 -3.9 2 -3.3 5.4 -3.7 M-5.4 -0.8 C-1.5 -1.1 2.5 -0.5 5.4 -0.9 M-5.4 2.0 C-2 1.7 2 2.3 5.4 1.9" fill="none" stroke="rgba(90,60,30,0.3)" strokeWidth={0.14} />
      {/* the ply layers of the side and back panels along the edges */}
      <Rect x={-h + 0.15} y={-h + 0.15} width={0.9} height={h * 2 - 0.75} fill="#b89458" />
      <Rect x={h - 1.05} y={-h + 0.15} width={0.9} height={h * 2 - 0.75} fill="#b89458" />
      <Rect x={-h + 0.15} y={-h + 0.15} width={h * 2 - 0.3} height={0.9} fill="#b89458" />
      {[0, 1, 2, 3].map((k) => ply(-h + 0.25 + k * 0.2, -h + 0.3, -h + 0.25 + k * 0.2, h - 0.6, k))}
      {[0, 1, 2, 3].map((k) => ply(h - 0.25 - k * 0.2, -h + 0.3, h - 0.25 - k * 0.2, h - 0.6, k))}
      {[0, 1, 2, 3].map((k) => ply(-h + 0.3, -h + 0.25 + k * 0.2, h - 0.3, -h + 0.25 + k * 0.2, k))}
      {/* the front plate (tapa) along the audience's side, its edge catching the light */}
      <Rect x={-h} y={h - 0.6} width={h * 2} height={0.6} rx={0.15} fill="#4a2a14" stroke={OUTLINE} strokeWidth={0.2} />
      <Line x1={-h + 0.3} y1={h - 0.5} x2={h - 0.3} y2={h - 0.5} stroke="rgba(255,226,180,0.3)" strokeWidth={0.12} />
    </G>
  );
}

/* ── djembe (1.2 × life: a 33 cm head) ── */

function DjembeTop() {
  const loops = around(26, 4);
  const tufts = around(40, 0);
  return (
    <G>
      <Circle cx={0.8} cy={1.2} r={6.8} fill={SHADOW} />
      {/* the trimmed hair that shows below the ring */}
      {tufts.map((a, i) => (
        <Line key={i} x1={Math.cos(a) * 6.3} y1={Math.sin(a) * 6.3} x2={Math.cos(a) * (6.75 + (i % 3) * 0.1)} y2={Math.sin(a) * (6.75 + (i % 3) * 0.1)} stroke="#5a4028" strokeWidth={0.35} strokeLinecap="round" />
      ))}
      {/* the crown: the rope ring and the loops of the vertical ropes over it */}
      <Circle cx={0} cy={0} r={6.45} fill="#e6e1d4" stroke="#6a655a" strokeWidth={0.3} />
      {loops.map((a, i) => (
        <Ellipse key={i} cx={Math.cos(a) * 6.4} cy={Math.sin(a) * 6.4} rx={0.42} ry={0.62} fill="#f0ece2" stroke="#8a857a" strokeWidth={0.12} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 6.4} ${Math.sin(a) * 6.4})`} />
      ))}
      {/* the goatskin head, a little darker where it is played */}
      <Circle cx={0} cy={0} r={5.85} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={0.3} />
      <Circle cx={0} cy={0} r={5.3} fill="none" stroke="#c3b58d" strokeWidth={0.2} />
      <Ellipse cx={-0.3} cy={-1.6} rx={2.6} ry={1.8} fill="rgba(120,90,50,0.18)" />
      <Path d="M-3.2 2.4 C-2.2 2.0 -1.4 2.6 -0.6 2.2 M1.4 3.2 C2.0 2.9 2.6 3.3 3.2 3.0" fill="none" stroke="rgba(110,85,50,0.35)" strokeWidth={0.15} />
    </G>
  );
}

/* ── tabla on its rug ── */

/** A tabla head: its braided rim (gajra), the outer ring (kinar), the main
 *  skin, and the black syahi at `sx, sy`. */
function TablaHead({ cx, cy, r, sx, sy, sr }: { cx: number; cy: number; r: number; sx: number; sy: number; sr: number }) {
  const braid = around(20, 0);
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r + 0.5} fill="#5a3a22" stroke={OUTLINE} strokeWidth={0.25} />
      {braid.map((a, i) => (
        <Line key={i} x1={cx + Math.cos(a) * (r + 0.05)} y1={cy + Math.sin(a) * (r + 0.05)} x2={cx + Math.cos(a + 0.12) * (r + 0.45)} y2={cy + Math.sin(a + 0.12) * (r + 0.45)} stroke="#2a180c" strokeWidth={0.12} />
      ))}
      <Circle cx={cx} cy={cy} r={r} fill="#d6c7a0" stroke="#8d7f5c" strokeWidth={0.15} />
      <Circle cx={cx} cy={cy} r={r * 0.82} fill={SKIN} />
      <Circle cx={sx} cy={sy} r={sr} fill="#141414" stroke="#2a2a2a" strokeWidth={0.12} />
      <Circle cx={sx - sr * 0.25} cy={sy - sr * 0.25} r={sr * 0.35} fill="rgba(255,255,255,0.08)" />
    </G>
  );
}

const DAYAN = { cx: -5.0, cy: 5.2, r: 2.8 };
const BAYAN = { cx: 5.4, cy: 5.4, r: 4.5 };

function TablaTop() {
  const fringe = Array.from({ length: 30 }, (_, i) => -14.2 + i * 0.98);
  return (
    <G>
      <Rect x={-15.4 + 0.6} y={-15.4 + 0.8} width={30.8} height={30.8} rx={0.3} fill={SHADOW} />
      {/* the rug: its fringe at both ends, the border, the field */}
      <Path d={fringe.map((x) => `M${x.toFixed(2)} -15.4 v-0.45 M${x.toFixed(2)} 15.4 v0.45`).join('')} stroke="#c9b48a" strokeWidth={0.2} />
      <Rect x={-15.4} y={-15.4} width={30.8} height={30.8} rx={0.3} fill="#5a1e1e" stroke={OUTLINE} strokeWidth={0.35} />
      <Rect x={-14.0} y={-14.0} width={28} height={28} fill="none" stroke="#8a6a3c" strokeWidth={0.9} />
      <Rect x={-12.6} y={-12.6} width={25.2} height={25.2} fill="#4a1818" stroke="#6a2a22" strokeWidth={0.3} />
      {/* the dayan (wood): the shell's straps and its eight tuning blocks */}
      <G transform={`translate(${DAYAN.cx + 0.4} ${DAYAN.cy + 0.6})`}>
        <Circle cx={0} cy={0} r={4.0} fill={SHADOW} />
      </G>
      <Circle cx={DAYAN.cx} cy={DAYAN.cy} r={3.9} fill={WOOD} stroke={OUTLINE} strokeWidth={0.3} />
      {around(16, 0).map((a, i) => (
        <Line key={i} x1={DAYAN.cx + Math.cos(a) * 3.2} y1={DAYAN.cy + Math.sin(a) * 3.2} x2={DAYAN.cx + Math.cos(a) * 3.85} y2={DAYAN.cy + Math.sin(a) * 3.85} stroke="#c9b48a" strokeWidth={0.18} />
      ))}
      {around(8, 11).map((a, i) => (
        <Rect key={`g${i}`} x={-0.32} y={-0.55} width={0.64} height={1.1} rx={0.2} fill="#8a5a32" stroke={WOOD_DK} strokeWidth={0.12} transform={`translate(${DAYAN.cx + Math.cos(a) * 3.55} ${DAYAN.cy + Math.sin(a) * 3.55}) rotate(${(a * 180) / Math.PI + 90})`} />
      ))}
      <TablaHead {...DAYAN} sx={DAYAN.cx} sy={DAYAN.cy} sr={1.15} />
      {/* the bayan (metal): the bowl, wider than its head, and its straps */}
      <Circle cx={BAYAN.cx + 0.5} cy={BAYAN.cy + 0.7} r={6.2} fill={SHADOW} />
      <Circle cx={BAYAN.cx} cy={BAYAN.cy} r={6.1} fill="#a8683a" stroke={OUTLINE} strokeWidth={0.3} />
      <Circle cx={BAYAN.cx - 1.2} cy={BAYAN.cy - 1.4} r={3.4} fill="rgba(255,220,180,0.14)" />
      {around(16, 6).map((a, i) => (
        <Line key={i} x1={BAYAN.cx + Math.cos(a) * 5.0} y1={BAYAN.cy + Math.sin(a) * 5.0} x2={BAYAN.cx + Math.cos(a) * 6.0} y2={BAYAN.cy + Math.sin(a) * 6.0} stroke="#c9b48a" strokeWidth={0.18} />
      ))}
      <TablaHead {...BAYAN} sx={BAYAN.cx - 0.5} sy={BAYAN.cy + 1.5} sr={1.6} />
    </G>
  );
}

/* ── steel pan (a tenor) ── */

function SteelPanTop() {
  const outer = around(12, -90);
  const middle = around(12, -75);
  const inner = around(5, -90);
  const note = (a: number, r: number, rx: number, ry: number, k: string) => {
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    return <Ellipse key={k} cx={x} cy={y} rx={rx} ry={ry} fill="#d8dadf" stroke="#7d8189" strokeWidth={0.15} transform={`rotate(${(a * 180) / Math.PI} ${x} ${y})`} />;
  };
  return (
    <G>
      <Circle cx={0.8} cy={1.2} r={9.6} fill={SHADOW} />
      {/* the stand's three feet, past the rim */}
      {around(3, 90).map((a, i) => (
        <Line key={i} x1={Math.cos(a) * 7} y1={Math.sin(a) * 7} x2={Math.cos(a) * 10.1} y2={Math.sin(a) * 10.1} stroke="#565a63" strokeWidth={0.6} strokeLinecap="round" />
      ))}
      {/* the chrome rim, then the dished face with its grooves and notes */}
      <Circle cx={0} cy={0} r={9.6} fill={CHROME} stroke={OUTLINE} strokeWidth={0.35} />
      <Circle cx={0} cy={0} r={9.0} fill="#a9adb5" stroke="#6d7179" strokeWidth={0.2} />
      <Circle cx={0} cy={0} r={5.6} fill="#9a9ea6" stroke="#5d6068" strokeWidth={0.25} />
      <Circle cx={0} cy={0} r={3.0} fill="#8e929a" stroke="#5d6068" strokeWidth={0.25} />
      {outer.map((a, i) => note(a, 7.25, 1.45, 1.6, `o${i}`))}
      {middle.map((a, i) => note(a, 4.3, 1.05, 0.95, `m${i}`))}
      {inner.map((a, i) => note(a, 1.65, 0.75, 0.72, `i${i}`))}
      {/* light across the chrome */}
      <Path d="M-7.4 -5.4 C-5.9 -7.3 -3.9 -8.6 -1.6 -9.0" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.35} strokeLinecap="round" />
    </G>
  );
}

/* ── vibraphone ── */

/** The bar at natural position `n` (0 = low F at +x, 21 = high F at −x). */
const VB_STEP = 40.6 / 21;
const vbX = (n: number) => 20.3 - n * VB_STEP;
const vbT = (x: number) => Math.min(1, Math.max(0, (x + 20.3) / 40.6)); // 1 at the low end
const vbLen = (t: number) => 5.6 + 4.5 * t;
const vbW = (t: number) => 1.25 + 0.55 * t;
const VB_NAT = Array.from({ length: 22 }, (_, n) => vbX(n));
const VB_ACC = Array.from({ length: 21 }, (_, n) => n)
  .filter((n) => !'BE'.includes('FGABCDE'[n % 7]!))
  .map((n) => vbX(n + 0.5));
const vbNear = (x: number) => -(0.8 + vbLen(vbT(x)) + 0.9);
const vbFar = (x: number) => 0.8 + vbLen(vbT(x)) - 0.5 + 0.9;
const VB_FRAME = `M-22.4 ${vbNear(-22.4).toFixed(2)} L22.4 ${vbNear(22.4).toFixed(2)} L22.4 ${vbFar(22.4).toFixed(2)} L-22.4 ${vbFar(-22.4).toFixed(2)} Z`;

function VibraphoneTop() {
  const bar = (x: number, y0: number, len: number, w: number, key: string) => (
    <G key={key}>
      <Rect x={x - w / 2} y={y0} width={w} height={len} rx={0.25} fill="#b9bcc2" stroke="#5d6068" strokeWidth={0.15} />
      <Line x1={x - w / 2 + 0.2} y1={y0 + 0.3} x2={x - w / 2 + 0.2} y2={y0 + len - 0.3} stroke="rgba(255,255,255,0.5)" strokeWidth={0.12} />
    </G>
  );
  // the suspension cords run through each row's bars at the nodes
  const cords = (sign: number, shorten: number) =>
    [0.224, 0.776]
      .map((f) =>
        [21.2, -21.2]
          .map((x, i) => {
            const len = vbLen(vbT(x)) - shorten;
            const y = sign * (0.8 + len * f);
            return `${i ? 'L' : 'M'}${x} ${y.toFixed(2)}`;
          })
          .join(' '),
      )
      .join(' ');
  return (
    <G>
      <Path d={VB_FRAME} fill={SHADOW} transform={SHADOW_AT} />
      {/* the frame, the resonators under each row, the fan shafts */}
      <Path d={VB_FRAME} fill="#1d1f24" stroke={OUTLINE} strokeWidth={0.4} strokeLinejoin="round" />
      <Path d={`M-21.2 ${(vbNear(-21.2) + 0.9).toFixed(2)} L21.2 ${(vbNear(21.2) + 0.9).toFixed(2)} L21.2 -0.6 L-21.2 -0.6 Z`} fill="#8a7a3a" />
      <Path d={`M-21.2 0.6 L21.2 0.6 L21.2 ${(vbFar(21.2) - 0.9).toFixed(2)} L-21.2 ${(vbFar(-21.2) - 0.9).toFixed(2)} Z`} fill="#8a7a3a" />
      <Path d={`M-21.2 ${(vbNear(-21.2) / 2).toFixed(2)} L21.2 ${(vbNear(21.2) / 2).toFixed(2)} M-21.2 ${(vbFar(-21.2) / 2).toFixed(2)} L21.2 ${(vbFar(21.2) / 2).toFixed(2)}`} stroke="#4a3f18" strokeWidth={0.3} />
      <Path d={cords(-1, 0) + cords(1, 0.5)} stroke="#e6e1d4" strokeWidth={0.14} />
      {/* the bars: naturals nearest the player, accidentals beyond */}
      {VB_NAT.map((x, i) => bar(x, -(0.8 + vbLen(vbT(x))), vbLen(vbT(x)), vbW(vbT(x)), `n${i}`))}
      {VB_ACC.map((x, i) => bar(x, 0.8, vbLen(vbT(x)) - 0.5, vbW(vbT(x)), `a${i}`))}
      {/* the end frames */}
      <Rect x={-22.4} y={vbNear(-22.4)} width={1.1} height={vbFar(-22.4) - vbNear(-22.4)} rx={0.3} fill="#9aa0a8" stroke={OUTLINE} strokeWidth={0.2} />
      <Rect x={21.3} y={vbNear(22.4)} width={1.1} height={vbFar(22.4) - vbNear(22.4)} rx={0.3} fill="#9aa0a8" stroke={OUTLINE} strokeWidth={0.2} />
    </G>
  );
}

/* ── saxophone (an alto, 1.1 × life) ── */

const SAX_BODY = 'M2.0 -2.4 L3.0 -2.3 L0.6 3.4 C0.2 4.2 -1.4 4.3 -1.8 3.4 Z';
const SAX_NECK = 'M2.6 -5.0 C2.6 -3.8 2.5 -3.0 2.4 -2.3';

function SaxophoneTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Path d={SAX_BODY} fill={SHADOW} />
        <Ellipse cx={-0.8} cy={4.3} rx={2.3} ry={1.9} fill={SHADOW} />
      </G>
      {/* the bell: its rim toward the ceiling and the audience, the dark throat */}
      <Ellipse cx={-0.8} cy={4.3} rx={2.3} ry={1.9} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.3} />
      <Ellipse cx={-0.8} cy={4.3} rx={1.8} ry={1.45} fill="#2a2412" />
      <Ellipse cx={-0.95} cy={4.0} rx={1.1} ry={0.8} fill="#1a160a" />
      <Path d="M-2.9 3.6 C-2.4 2.8 -0.6 2.4 0.6 2.7" fill="none" stroke={BRASS_LT} strokeWidth={0.22} strokeLinecap="round" />
      {/* the body, sloping forward and to the player's right, its key cups */}
      <Path d={SAX_BODY} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.28} strokeLinejoin="round" />
      <Line x1={2.4} y1={-1.8} x2={0.0} y2={3.4} stroke={BRASS_LT} strokeWidth={0.2} strokeLinecap="round" />
      {[
        [2.2, -1.2, 0.42],
        [1.7, 0.0, 0.48],
        [1.2, 1.2, 0.5],
        [0.6, 2.4, 0.55],
      ].map(([x, y, r]) => (
        <G key={`${x}`}>
          <Circle cx={x} cy={y} r={r} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.15} />
          <Circle cx={x} cy={y} r={r * 0.5} fill={BRASS_LT} />
        </G>
      ))}
      {/* the neck with its octave key, the mouthpiece and ligature */}
      <Path d={SAX_NECK} fill="none" stroke={BRASS_DK} strokeWidth={0.75} strokeLinecap="round" />
      <Path d={SAX_NECK} fill="none" stroke={BRASS} strokeWidth={0.5} strokeLinecap="round" />
      <Line x1={2.85} y1={-4.4} x2={2.75} y2={-2.8} stroke={STEEL_DK} strokeWidth={0.18} />
      <Path d="M2.25 -5.0 L2.95 -5.0 L2.85 -6.75 L2.35 -6.75 Z" fill="#15161a" stroke={OUTLINE} strokeWidth={0.12} />
      <Rect x={2.15} y={-5.9} width={0.9} height={0.5} rx={0.1} fill={STEEL} />
    </G>
  );
}

/* ── trombone (a tenor, slide closed) ── */

const TB_MP = -4.0; // the slide tube that takes the mouthpiece
const TB_IN = -1.8; // the slide tube that leads to the bell section
const TB_BELL = 1.8;
const TB_RIM = 5.0;
const TB_FLARE = `M${TB_BELL - 0.35} -1.4 C${TB_BELL - 0.6} 1.8 ${TB_BELL - 1.6} 3.8 ${TB_BELL - 3.4} ${TB_RIM} L${TB_BELL + 3.4} ${TB_RIM} C${TB_BELL + 1.6} 3.8 ${TB_BELL + 0.6} 1.8 ${TB_BELL + 0.35} -1.4 Z`;
const TB_SLIDE = `M${TB_MP} -7.6 V18.0 C${TB_MP} 18.7 ${TB_IN} 18.7 ${TB_IN} 18.0 V-7.6`;
/** The bell section: from the slide, the gooseneck, the tuning slide back
 *  over the shoulder, and the bell tube forward to the flare. */
const TB_BELLSECTION = `M${TB_IN} -9.6 C${TB_IN} -10.4 -0.3 -10.2 -0.3 -11.0 V-18.4 C-0.3 -19.2 ${TB_BELL} -19.2 ${TB_BELL} -18.4 V-1.4`;

function TromboneTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Path d={TB_SLIDE} fill="none" stroke={SHADOW} strokeWidth={0.6} />
        <Path d={TB_BELLSECTION} fill="none" stroke={SHADOW} strokeWidth={0.6} />
        <Path d={TB_FLARE} fill={SHADOW} />
      </G>
      {/* the bell section: tuning slide, bell tube, the brace to the slide */}
      <Path d={TB_BELLSECTION} fill="none" stroke={BRASS_DK} strokeWidth={0.7} strokeLinecap="round" />
      <Path d={TB_BELLSECTION} fill="none" stroke={BRASS} strokeWidth={0.46} strokeLinecap="round" />
      <Line x1={-0.3} y1={-15} x2={TB_BELL} y2={-15} stroke={BRASS_DK} strokeWidth={0.3} />
      <Line x1={TB_IN} y1={-8.6} x2={TB_BELL} y2={-8.6} stroke={BRASS_DK} strokeWidth={0.35} />
      <Circle cx={TB_IN} cy={-8.9} r={0.55} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.15} />
      {/* the bell, its rim toward the audience */}
      <Path d={TB_FLARE} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.3} strokeLinejoin="round" />
      <Path d={`M${TB_BELL} -0.6 C${TB_BELL - 0.1} 2.0 ${TB_BELL - 0.6} 3.8 ${TB_BELL - 1.4} ${TB_RIM - 0.4}`} fill="none" stroke={BRASS_LT} strokeWidth={0.22} strokeLinecap="round" />
      <Line x1={TB_BELL - 3.3} y1={TB_RIM - 0.15} x2={TB_BELL + 3.3} y2={TB_RIM - 0.15} stroke={BRASS_LT} strokeWidth={0.25} />
      {/* the slide: the inner tubes from the mouthpiece end, the outer slide
          with its brace and end crook, its rubber bumper */}
      <Path d={`M${TB_MP} -10.6 V-7.6 M${TB_IN} -9.6 V-7.6`} stroke={STEEL} strokeWidth={0.36} />
      <Path d={TB_SLIDE} fill="none" stroke={BRASS_DK} strokeWidth={0.62} strokeLinecap="round" />
      <Path d={TB_SLIDE} fill="none" stroke={BRASS} strokeWidth={0.42} strokeLinecap="round" />
      <Line x1={TB_MP} y1={-6.4} x2={TB_IN} y2={-6.4} stroke={BRASS_DK} strokeWidth={0.4} />
      <Rect x={TB_MP - 0.2} y={-6.9} width={TB_IN - TB_MP + 0.4} height={1.0} rx={0.3} fill={BRASS} stroke={BRASS_DK} strokeWidth={0.12} />
      <Ellipse cx={(TB_MP + TB_IN) / 2} cy={18.85} rx={0.7} ry={0.25} fill={RUBBER} />
      {/* the mouthpiece */}
      <Path d={`M${TB_MP - 0.25} -10.6 L${TB_MP + 0.25} -10.6 L${TB_MP + 0.2} -11.6 C${TB_MP + 0.5} -11.8 ${TB_MP + 0.5} -12.2 ${TB_MP + 0.45} -12.2 L${TB_MP - 0.45} -12.2 C${TB_MP - 0.5} -12.2 ${TB_MP - 0.5} -11.8 ${TB_MP - 0.2} -11.6 Z`} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.12} />
    </G>
  );
}

/* ── DJ table ── */

/** A media player: the DJ is at −y, so the jog wheel, PLAY and CUE are on
 *  the DJ's side and the screen beyond; the tempo fader on the DJ's right (−x). */
function MediaPlayer({ cx }: { cx: number }) {
  return (
    <G>
      <Rect x={cx - 5.1} y={-7.4} width={10.2} height={13.1} rx={0.5} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.4} />
      <Rect x={cx - 3.5} y={2.0} width={7.0} height={2.8} rx={0.2} fill="#2c4a5e" stroke="#4a4e56" strokeWidth={0.15} />
      <Circle cx={cx} cy={-2.1} r={3.6} fill="#2a2c31" stroke="#6d7179" strokeWidth={0.3} />
      <Circle cx={cx} cy={-2.1} r={3.1} fill="none" stroke="#3a3d44" strokeWidth={0.25} strokeDasharray="0.2 0.2" />
      <Circle cx={cx} cy={-2.1} r={1.3} fill="#3d5a6e" stroke="#15161a" strokeWidth={0.15} />
      {/* PLAY and CUE, at the DJ's left (+x), nearest the DJ */}
      <Circle cx={cx + 3.9} cy={-6.1} r={0.75} fill="#3a3d44" stroke="#7fbf6a" strokeWidth={0.2} />
      <Circle cx={cx + 3.9} cy={-4.2} r={0.75} fill="#3a3d44" stroke="#e0a040" strokeWidth={0.2} />
      {/* the tempo fader at the DJ's right (−x) */}
      <Rect x={cx - 4.55} y={-6.6} width={0.45} height={6.0} rx={0.2} fill="#0b0b0d" />
      <Rect x={cx - 4.85} y={-4.1} width={1.05} height={0.6} rx={0.15} fill="#9aa0a8" />
      <Path d={`M${cx - 4.2} 1.2 h1.2 M${cx - 2.6} 1.2 h1.2 M${cx + 1.4} 1.2 h1.2 M${cx + 3.0} 1.2 h1.2`} stroke="#6d7179" strokeWidth={0.45} />
    </G>
  );
}

function DjTop() {
  const ch = [-3.3, -1.1, 1.1, 3.3];
  return (
    <G>
      <Rect x={-28.5 + 0.8} y={-11.7 + 1.2} width={57} height={23.4} rx={0.5} fill={SHADOW} />
      {/* the table */}
      <Rect x={-28.5} y={-11.7} width={57} height={23.4} rx={0.5} fill="#1d1f24" stroke={OUTLINE} strokeWidth={0.5} />
      <Line x1={-28.2} y1={11.3} x2={28.2} y2={11.3} stroke="rgba(255,255,255,0.1)" strokeWidth={0.4} />
      {/* the shadows of the units on the table */}
      {[-12.8, 0, 12.8].map((cx) => (
        <Rect key={cx} x={cx - 5.1 + 0.5} y={-7.4 + 0.7} width={10.2} height={13.1} rx={0.5} fill="rgba(0,0,0,0.4)" />
      ))}
      <MediaPlayer cx={-12.8} />
      <MediaPlayer cx={12.8} />
      {/* the mixer: crossfader nearest the DJ, the channel faders, EQ knobs above */}
      <Rect x={-5.1} y={-7.4} width={10.2} height={13.1} rx={0.5} fill="#26282d" stroke={OUTLINE} strokeWidth={0.4} />
      <Rect x={-2} y={-7.0} width={4} height={0.4} rx={0.15} fill="#0b0b0d" />
      <Rect x={-0.4} y={-7.2} width={0.8} height={0.8} rx={0.15} fill="#9aa0a8" />
      {ch.map((x) => (
        <G key={x}>
          <Rect x={x - 0.2} y={-5.9} width={0.4} height={3.0} rx={0.15} fill="#0b0b0d" />
          <Rect x={x - 0.5} y={-4.6} width={1.0} height={0.6} rx={0.15} fill="#c9c6bc" />
          {[-1.8, -0.5, 0.8, 2.3].map((y) => (
            <Circle key={y} cx={x} cy={y} r={0.42} fill="#3a3d44" stroke="#9aa0a8" strokeWidth={0.12} />
          ))}
        </G>
      ))}
      <Path d="M-4.4 3.8 h8.8" stroke="#3e8a4a" strokeWidth={0.35} strokeDasharray="0.3 0.15" />
      {/* a laptop on the DJ's right, its keyboard toward the DJ */}
      <Rect x={-28.3} y={-6.8} width={9.4} height={6.4} rx={0.4} fill="#a8a69d" stroke={OUTLINE} strokeWidth={0.35} />
      <Rect x={-27.7} y={-4.4} width={8.2} height={3.0} rx={0.2} fill="#141518" />
      <Rect x={-25.3} y={-6.4} width={3.4} height={1.5} rx={0.2} fill="#b6b4ab" />
      <Rect x={-28.3} y={-0.4} width={9.4} height={2.0} rx={0.3} fill="#0b0c0f" stroke={OUTLINE} strokeWidth={0.3} />
      <Rect x={-27.9} y={-0.1} width={8.6} height={1.3} fill="#46647e" />
      {/* headphones on the DJ's left */}
      <Path d="M21.2 -3.8 C21.2 -8.4 26.6 -8.4 26.6 -3.8" fill="none" stroke="#3a3d44" strokeWidth={0.8} strokeLinecap="round" />
      <Ellipse cx={21.2} cy={-3.0} rx={1.5} ry={1.9} fill="#15161a" stroke="#4a4e56" strokeWidth={0.25} />
      <Ellipse cx={26.6} cy={-3.0} rx={1.5} ry={1.9} fill="#15161a" stroke="#4a4e56" strokeWidth={0.25} />
    </G>
  );
}

export const TOP_ART_WORLD: TopArtMap = {
  choir: ChoirTop,
  'e-drums': EDrumsTop,
  cajon: CajonTop,
  djembe: DjembeTop,
  tabla: TablaTop,
  'steel-pan': SteelPanTop,
  vibraphone: VibraphoneTop,
  saxophone: SaxophoneTop,
  trombone: TromboneTop,
  dj: DjTop,
};
