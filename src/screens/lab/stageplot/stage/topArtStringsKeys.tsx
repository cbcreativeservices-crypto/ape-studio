/**
 * topArtStringsKeys — top-view art for the strings, the keyboards and the
 * folk instruments added for more diverse music (owner 2026-11-13: "We also
 * need more symbols for more diverse music"). See topArtTypes.ts for the
 * contract: centered on 0,0, 32 floor units to the meter, the FRONT toward
 * the audience (+y), the PLAYER UPSTAGE (−y) facing the audience, so the
 * player's right hand is at −x (stage right) and the left hand at +x.
 *
 * What is drawn, part by part (sizes from a live-sound reviewer and from
 * makers' published dimensions; the lab's notes name them):
 *   • upright bass (a 3/4 bass, 1.8 m tall): it stands on its endpin and
 *     leans back toward its player, so from above its top is SHORTENED: the
 *     lower bout downstage, the upper bout and its deep ribs upstage, the
 *     fingerboard running up to the pegbox, its four machine keys and the
 *     scroll over the player's side; the bridge, standing off the top,
 *     shows toward the audience; the endpin reaches forward to the floor;
 *   • cello: the same family seated: an orchestra chair upstage, the cello
 *     in front of it leaning back between the player's knees, the scroll and
 *     its four pegs over the seat, the long endpin toward the audience;
 *   • violin or viola: held nearly level from the player's left shoulder,
 *     its scroll forward and to the player's left, so nearly the whole top
 *     shows: f-holes, bridge, tailpiece, the chinrest at the player's jaw;
 *   • harp (a concert pedal harp, 1.88 m tall): the crown over the column
 *     toward the audience, the neck running back to the top of the body over
 *     the player's right shoulder; the soundboard faces up toward the neck,
 *     so it shows on both sides of the neck, widening down to the base; the
 *     strings lie in the one upright plane under the neck, so from above
 *     they are a line; the pedals stick out of the base toward the player,
 *     three on the left and four on the right;
 *   • grand piano (a 5 ft 8 in grand) in concert placement: the keyboard
 *     and bench at stage right (−x), the straight spine upstage, the curved
 *     side and the lid, open on its stick, toward the audience. From above
 *     the raised lid covers the spine side; between its edge and the curved
 *     side show the gold plate, the treble strings and the dampers; the 88
 *     keys run across the stage with the bass upstage (the pianist's left);
 *   • Hammond organ (a B-3 or C-3 console, 1.24 × 0.74 m, and its bench):
 *     the closed top, the two manuals with their reverse-colored preset keys
 *     at the left end, the drawbars behind the upper manual, the pedalboard
 *     between the console and the bench, the swell pedal on it;
 *   • Leslie speaker (a 122: 0.74 × 0.52 m): the cabinet's wooden top, its
 *     molded edge, and its two leads (organ and mains) leaving the back;
 *   • electric piano (a 73-key stage model, 1.13 × 0.56 m): the black lid,
 *     the metal name rail, the 73 keys (E to E), the two knobs at the left
 *     end of the keys;
 *   • two-tier keyboard rig: an 88-key board nearest the player and a
 *     61-key synthesizer higher and set back, overlapping its rear, with its
 *     pitch and modulation wheels at the left end; the A-frame stand's feet;
 *   • accordion (a piano accordion on the player's chest): the treble case
 *     on the player's right with its keyboard's top edge, the pleated
 *     bellows with their metal corners and strap, the bass case on the left
 *     with its hand strap, the shoulder straps toward the player;
 *   • banjo and mandolin: laid face up, the neck upstage, as the acoustic
 *     instrument is drawn (from directly above a held instrument is only an
 *     edge). The banjo: resonator, tension hooks, frosted head, bridge,
 *     tailpiece, the fifth-string peg at the fifth fret; the mandolin: an
 *     A-style teardrop, oval sound hole, floating bridge, eight strings in
 *     pairs and four tuner buttons a side.
 *
 * Instruments are drawn at or slightly over life size where the footprint
 * allows, as the stage draws its other art. Pure drawings: no state, no
 * text, no image file.
 */
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { TopArtMap } from './topArtTypes';

/** How far each drawing reaches from its center, in floor units (the shadow
 *  aside). A test holds each inside its print symbol's footprint. */
export const TOP_ART_STRINGS_KEYS_EXTENT = {
  'upright-bass': { hw: 10.8, hh: 12.0 },
  cello: { hw: 7.65, hh: 16.0 },
  violin: { hw: 6.9, hh: 8.8 },
  harp: { hw: 9.45, hh: 19.7 },
  'grand-piano': { hw: 38.3, hh: 23.9 },
  organ: { hw: 19.8, hh: 21.1 },
  leslie: { hw: 11.8, hh: 9.45 },
  'electric-piano': { hw: 18.4, hh: 8.95 },
  'keyboard-rig': { hw: 21.35, hh: 11.2 },
  accordion: { hw: 7.95, hh: 4.75 },
  banjo: { hw: 5.95, hh: 14.9 },
  mandolin: { hw: 4.6, hh: 10.1 },
} as const;

/* ── materials (floorArt's, muted for a dark stage) ── */
const SHADOW = 'rgba(0,0,0,0.45)';
const SHADOW_AT = 'translate(0.8 1.2)';
const OUTLINE = '#0a0a0c';
const VARNISH = '#8f4f22'; // a violin-family top under its varnish
const VARNISH_LT = '#b8743a';
const VARNISH_DK = '#3a1c0a';
const RIBS = '#5e3214';
const EBONY = '#16171a';
const IVORY = '#e8e6dd';
const IVORY_EDGE = '#8d8a80';
const STEEL = '#c9c6bc';
const STEEL_DK = '#4a4a46';
const STRING = 'rgba(235,230,210,0.75)';
const SPRUCE = '#c9a86a';
const GOLD = '#b39b48';
const GOLD_DK = '#4a3f18';
const WALNUT = '#5a3a22';
const WALNUT_DK = '#2a180c';
const TOLEX = '#1d1f24';
const CASE_DK = '#26282d';

/** A closed outline symmetric about x = 0: the right half from a point on
 *  the axis, as cubic segments [c1x c1y c2x c2y x y], ending on the axis;
 *  the left half is its mirror, drawn back. */
function symmetricD(start: readonly [number, number], segs: readonly (readonly number[])[]): string {
  const f = (v: number) => +v.toFixed(3);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (const s of segs) d += ` C${f(s[0])} ${f(s[1])} ${f(s[2])} ${f(s[3])} ${f(s[4])} ${f(s[5])}`;
  const ends = [start, ...segs.map((s) => [s[4], s[5]] as const)];
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i]!;
    const p = ends[i]!;
    d += ` C${f(-s[2])} ${f(s[3])} ${f(-s[0])} ${f(s[1])} ${f(-p[0])} ${f(p[1])}`;
  }
  return `${d} Z`;
}

/** Piano-style keys across x from `x0` to `x1` (white keys `n`), front edge
 *  at `front`, back at `back`; black keys from `blackFront` to `back`. The
 *  LOWEST key is at +x (the player's left, the player being at −y), and
 *  `first` names it (a letter of CDEFGAB). Returns two path strings. */
function keyPaths(n: number, x0: number, x1: number, front: number, back: number, blackFront: number, first: string): { joints: string; blacks: string } {
  const w = (x1 - x0) / n;
  const joints: string[] = [];
  const blacks: string[] = [];
  const NOTES = 'CDEFGAB';
  const start = NOTES.indexOf(first);
  for (let i = 1; i < n; i++) joints.push(`M${(x1 - i * w).toFixed(3)} ${front} V${back}`);
  for (let i = 0; i < n - 1; i++) {
    const note = NOTES[(start + i) % 7]!;
    // a black key follows every white key but E and B
    if (note === 'E' || note === 'B') continue;
    blacks.push(`M${(x1 - (i + 1) * w).toFixed(3)} ${blackFront} V${back}`);
  }
  return { joints: joints.join(''), blacks: blacks.join('') };
}

/* ── the violin family ── */

/** Four strings from `y0` to `y1`, fanning from `w0` to `w1` apart. */
const strings4 = (y0: number, y1: number, w0: number, w1: number) =>
  [-1.5, -0.5, 0.5, 1.5].map((k) => `M${(k * w0).toFixed(3)} ${y0} L${(k * w1).toFixed(3)} ${y1}`).join('');

/** An f-hole, its upper eye at (x, y), drawn downward over `len`. `side` is
 *  −1 or +1 (the two f-holes mirror each other). */
function FHole({ x, y, len, side, w = 0.18 }: { x: number; y: number; len: number; side: number; w?: number }) {
  const s = side;
  return (
    <G>
      <Path d={`M${x} ${y} C${x + s * len * 0.12} ${y + len * 0.3} ${x - s * len * 0.12} ${y + len * 0.7} ${x} ${y + len}`} fill="none" stroke={VARNISH_DK} strokeWidth={w} strokeLinecap="round" />
      <Circle cx={x} cy={y} r={w * 0.9} fill={VARNISH_DK} />
      <Circle cx={x} cy={y + len} r={w * 0.9} fill={VARNISH_DK} />
    </G>
  );
}

/* upright bass: endpin tip at +11.3, body bottom +8.6, the shoulders at
   −2.3 (the 1.1 m body shortened to 0.34 m by its lean), the ribs behind
   them, the nut at −6.9, the scroll at −11.4 */
const UB_TOP = symmetricD(
  [0, 8.6],
  [
    [4, 8.7, 8.6, 8.1, 10.0, 6.8],
    [10.6, 6.2, 10.5, 5.2, 10.1, 4.6],
    [9.4, 3.7, 7.0, 3.4, 6.2, 2.8],
    [5.8, 2.4, 6.0, 1.8, 6.6, 1.4],
    [7.8, 1.0, 8.6, 0.6, 8.4, -0.2],
    [8.2, -1.0, 5.2, -2.0, 1.4, -2.3],
    [0.8, -2.35, 0.3, -2.4, 0, -2.4],
  ],
);
/** The back and the ribs behind the shoulders (seen because the bass leans back). */
const UB_RIBS = symmetricD(
  [0, 2],
  [
    [3, 2, 7.6, 1.6, 8.2, 0.4],
    [8.5, -0.6, 7.4, -2.6, 5.4, -4.4],
    [3.6, -6.0, 1.6, -7.0, 0, -7.2],
  ],
);

function UprightBassTop() {
  return (
    <G transform="translate(0 0.35)">
      <G transform={SHADOW_AT}>
        <Path d={UB_TOP} fill={SHADOW} />
        <Path d={UB_RIBS} fill={SHADOW} />
      </G>
      {/* the endpin, down to the floor in front of the bass, its rubber tip */}
      <Line x1={0} y1={8.4} x2={0} y2={10.8} stroke={STEEL} strokeWidth={0.5} strokeLinecap="round" />
      <Circle cx={0} cy={10.95} r={0.5} fill="#15161a" stroke={STEEL_DK} strokeWidth={0.2} />
      {/* the ribs and the back behind the shoulders, then the shortened top */}
      <Path d={UB_RIBS} fill={RIBS} stroke={OUTLINE} strokeWidth={0.4} />
      <Path d={UB_TOP} fill={VARNISH} stroke={OUTLINE} strokeWidth={0.45} strokeLinejoin="round" />
      {/* the purfling, just inside the edge, and light on the lower bout */}
      <Path d={UB_TOP} fill="none" stroke={VARNISH_DK} strokeWidth={0.18} transform="translate(0 3.1) scale(0.94) translate(0 -3.1)" />
      <Path d="M-8.2 5.8 C-6.4 7.6 -3 8.0 -0.6 8.0" fill="none" stroke={VARNISH_LT} strokeWidth={0.4} strokeLinecap="round" />
      {/* the f-holes beside the bridge */}
      <FHole x={-3.9} y={1.3} len={3.0} side={-1} w={0.22} />
      <FHole x={3.9} y={1.3} len={3.0} side={1} w={0.22} />
      {/* the tailpiece, hung from the endpin end */}
      <Path d="M-1.35 4.4 L1.35 4.4 L0.75 7.9 L-0.75 7.9 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.2} strokeLinejoin="round" />
      {/* the bridge stands off the top, so from above it reaches forward */}
      <Path d="M-2.7 2.7 L2.7 2.7 L2.0 4.3 L-2.0 4.3 Z" fill="#d9c08a" stroke="#6a5530" strokeWidth={0.2} strokeLinejoin="round" />
      {/* the neck rising from the shoulders, the fingerboard over it */}
      <Path d="M-1.6 -2.4 L-1.25 -8.6 L1.25 -8.6 L1.6 -2.4 Z" fill={RIBS} stroke={OUTLINE} strokeWidth={0.3} />
      <Path d="M-1.15 -7.0 L1.15 -7.0 L1.8 2.4 L-1.8 2.4 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.25} strokeLinejoin="round" />
      {/* the pegbox with its four machine keys, two a side, and the scroll */}
      <Rect x={-1.35} y={-10.2} width={2.7} height={3.4} rx={0.4} fill={RIBS} stroke={OUTLINE} strokeWidth={0.3} />
      <Rect x={-0.75} y={-9.8} width={1.5} height={2.8} rx={0.3} fill="#1a0e06" />
      {[-9.1, -7.7].map((y) => (
        <G key={y}>
          <Line x1={-1.3} y1={y} x2={-3.4} y2={y} stroke={GOLD} strokeWidth={0.35} />
          <Line x1={1.3} y1={y} x2={3.4} y2={y} stroke={GOLD} strokeWidth={0.35} />
          <Ellipse cx={-3.7} cy={y} rx={0.55} ry={0.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.15} />
          <Ellipse cx={3.7} cy={y} rx={0.55} ry={0.4} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.15} />
        </G>
      ))}
      <Ellipse cx={0} cy={-10.75} rx={0.95} ry={1.45} fill={RIBS} stroke={OUTLINE} strokeWidth={0.3} />
      <Line x1={0} y1={-11.7} x2={0} y2={-9.9} stroke={VARNISH_DK} strokeWidth={0.3} strokeLinecap="round" />
      {/* the four strings: nut, over the bridge, to the tailpiece */}
      <Path d={strings4(-7.0, 3.4, 0.45, 0.95) + strings4(3.4, 4.6, 0.95, 0.75)} stroke={STRING} strokeWidth={0.12} />
    </G>
  );
}

/* cello: the chair from −15.85 to −3.2, the body from −4.6 (the shoulders)
   to +6, the scroll at −10.9, the endpin to +15.3 */
const VC_TOP = symmetricD(
  [0, 6],
  [
    [3, 6.1, 6.4, 5.5, 7.0, 4.0],
    [7.4, 3.0, 6.6, 2.0, 4.6, 1.2],
    [3.9, 0.9, 3.8, 0.2, 4.4, -0.6],
    [5.4, -1.6, 5.6, -3.0, 4.6, -3.8],
    [3.4, -4.6, 1.4, -4.7, 0, -4.7],
  ],
);
const VC_RIBS = symmetricD(
  [0, -1],
  [
    [2.5, -1, 5.4, -1.6, 5.3, -3.0],
    [5.2, -4.4, 3.2, -6.6, 0, -7.0],
  ],
);

function OrchestraChair({ y0, y1, hw }: { y0: number; y1: number; hw: number }) {
  const back = `M${-hw} ${y0 + 1.6} Q0 ${y0 - 0.6} ${hw} ${y0 + 1.6} L${hw - 0.4} ${y0 + 2.8} Q0 ${y0 + 0.8} ${-hw + 0.4} ${y0 + 2.8} Z`;
  return (
    <G>
      {/* the four glides at the corners, the seat and its pad, the backrest */}
      {[
        [-hw + 0.4, y0 + 0.9],
        [hw - 0.4, y0 + 0.9],
        [-hw + 0.5, y1 - 0.5],
        [hw - 0.5, y1 - 0.5],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={0.5} fill="#15161a" stroke="#565a63" strokeWidth={0.2} />
      ))}
      <Rect x={-hw + 0.8} y={y0 + 2.2} width={hw * 2 - 1.6} height={y1 - y0 - 2.6} rx={1.6} fill="#2a2c31" stroke={OUTLINE} strokeWidth={0.45} />
      <Rect x={-hw + 1.7} y={y0 + 3.2} width={hw * 2 - 3.4} height={y1 - y0 - 4.6} rx={1.8} fill="#3a3d44" />
      <Path d={back} fill="#34373e" stroke={OUTLINE} strokeWidth={0.4} strokeLinejoin="round" />
    </G>
  );
}

function CelloTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Rect x={-7.2} y={-15.2} width={14.4} height={12} rx={1.6} fill={SHADOW} />
        <Path d={VC_TOP} fill={SHADOW} transform="rotate(10 0 4)" />
      </G>
      <OrchestraChair y0={-15.2} y1={-3.2} hw={7.2} />
      <G transform="rotate(10 0 4)">
      {/* the endpin, long and angled forward to the floor */}
      <Line x1={0} y1={5.8} x2={0} y2={15.0} stroke={STEEL} strokeWidth={0.38} strokeLinecap="round" />
      <Circle cx={0} cy={15.1} r={0.35} fill={STEEL_DK} />
      <Path d={VC_RIBS} fill={RIBS} stroke={OUTLINE} strokeWidth={0.35} />
      <Path d={VC_TOP} fill={VARNISH} stroke={OUTLINE} strokeWidth={0.4} strokeLinejoin="round" />
      <Path d={VC_TOP} fill="none" stroke={VARNISH_DK} strokeWidth={0.15} transform="translate(0 0.7) scale(0.93) translate(0 -0.7)" />
      <Path d="M-5.6 3.6 C-4.4 5.0 -2.2 5.4 -0.4 5.4" fill="none" stroke={VARNISH_LT} strokeWidth={0.3} strokeLinecap="round" />
      <FHole x={-2.5} y={0.4} len={2.4} side={-1} />
      <FHole x={2.5} y={0.4} len={2.4} side={1} />
      <Path d="M-0.95 3.0 L0.95 3.0 L0.5 5.4 L-0.5 5.4 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.15} />
      <Path d="M-1.8 1.6 L1.8 1.6 L1.35 2.8 L-1.35 2.8 Z" fill="#d9c08a" stroke="#6a5530" strokeWidth={0.15} />
      {/* neck, fingerboard, pegbox with four pegs, scroll */}
      <Path d="M-1.1 -4.7 L-0.85 -8.8 L0.85 -8.8 L1.1 -4.7 Z" fill={RIBS} stroke={OUTLINE} strokeWidth={0.25} />
      <Path d="M-0.8 -8.0 L0.8 -8.0 L1.25 1.4 L-1.25 1.4 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.2} strokeLinejoin="round" />
      <Rect x={-0.95} y={-10.3} width={1.9} height={2.6} rx={0.3} fill={RIBS} stroke={OUTLINE} strokeWidth={0.25} />
      {[-9.7, -8.6].map((y) => (
        <G key={y}>
          <Rect x={-2.6} y={y - 0.28} width={1.7} height={0.56} rx={0.25} fill={EBONY} />
          <Rect x={0.9} y={y - 0.28} width={1.7} height={0.56} rx={0.25} fill={EBONY} />
        </G>
      ))}
      <Circle cx={0} cy={-10.9} r={0.9} fill={RIBS} stroke={OUTLINE} strokeWidth={0.25} />
      <Path d={strings4(-8.0, 2.2, 0.3, 0.6) + strings4(2.2, 3.1, 0.6, 0.45)} stroke={STRING} strokeWidth={0.1} />
      </G>
    </G>
  );
}

/* violin: authored along its own axis (end button +9.45, scroll −9.45),
   then turned so the scroll points forward and to the player's left */
const VN_TOP = symmetricD(
  [0, 9.45],
  [
    [1.8, 9.45, 3.3, 8.6, 3.3, 6.6],
    [3.3, 5.0, 1.9, 4.2, 1.8, 3.0],
    [1.75, 1.8, 2.7, 1.4, 2.7, 0.2],
    [2.7, -1.2, 1.6, -2.0, 0, -2.0],
  ],
);

function ViolinTop() {
  return (
    <G transform="translate(0.9 0.3) rotate(145)">
      <G transform={SHADOW_AT}>
        <Path d={VN_TOP} fill={SHADOW} />
      </G>
      <Path d={VN_TOP} fill={VARNISH} stroke={OUTLINE} strokeWidth={0.3} strokeLinejoin="round" />
      <Path d={VN_TOP} fill="none" stroke={VARNISH_DK} strokeWidth={0.12} transform="translate(0 3.7) scale(0.92) translate(0 -3.7)" />
      <Path d="M2.4 7.6 C2 8.5 1 8.9 0 8.9" fill="none" stroke={VARNISH_LT} strokeWidth={0.25} strokeLinecap="round" />
      <FHole x={-1.25} y={2.2} len={1.9} side={-1} w={0.14} />
      <FHole x={1.25} y={2.2} len={1.9} side={1} w={0.14} />
      {/* the chinrest, on the left of the tailpiece (the player's jaw side) */}
      <Path d="M-0.2 9.3 C-0.4 7.6 -1.6 7.2 -2.6 7.6 C-3.0 8.4 -2.2 9.2 -0.9 9.4 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.15} />
      <Path d="M-0.75 5.0 L0.75 5.0 L0.4 8.6 L-0.4 8.6 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.15} />
      <Rect x={-1.1} y={3.2} width={2.2} height={0.5} rx={0.15} fill="#d9c08a" />
      {/* neck and fingerboard, the pegbox with four pegs, the scroll */}
      <Path d="M-0.55 -6.1 L0.55 -6.1 L0.85 2.4 L-0.85 2.4 Z" fill={EBONY} stroke={OUTLINE} strokeWidth={0.15} strokeLinejoin="round" />
      <Rect x={-0.6} y={-8.4} width={1.2} height={2.4} rx={0.2} fill={RIBS} stroke={OUTLINE} strokeWidth={0.15} />
      {[-7.8, -6.8].map((y) => (
        <G key={y}>
          <Rect x={-1.7} y={y - 0.18} width={1.1} height={0.36} rx={0.15} fill={EBONY} />
          <Rect x={0.6} y={y - 0.18} width={1.1} height={0.36} rx={0.15} fill={EBONY} />
        </G>
      ))}
      <Circle cx={0} cy={-8.85} r={0.62} fill={RIBS} stroke={OUTLINE} strokeWidth={0.15} />
      <Path d={strings4(-6.1, 3.4, 0.2, 0.42) + strings4(3.4, 5.0, 0.42, 0.3)} stroke={STRING} strokeWidth={0.07} />
    </G>
  );
}

/* harp: crown +13.4, base +3.6…+15.3, the body's top over the player −15.6 */
const HARP_BODY = 'M-2.5 -15.5 L2.5 -15.5 L8.6 8.2 C9.0 9.8 8.0 10.9 6.6 10.9 L-6.6 10.9 C-8.0 10.9 -9.0 9.8 -8.6 8.2 Z';
const HARP_SOUNDBOARD = 'M-1.9 -14.8 L1.9 -14.8 L7.8 8.0 C8.1 9.3 7.4 10.1 6.3 10.1 L-6.3 10.1 C-7.4 10.1 -8.1 9.3 -7.8 8.0 Z';
/** The neck from the crown back to the body: the harmonic curve, seen from above as a beam. */
const HARP_NECK = 'M-1.0 13.2 C-1.2 6 -0.6 -4 -1.0 -15.2 L1.0 -15.2 C0.6 -4 1.2 6 1.0 13.2 Z';
/** Where a string meets the soundboard's center strip (47 strings, about
 *  every 2 cm along the board, shortened as the board leans). */
const HARP_EYELETS = Array.from({ length: 24 }, (_, i) => -13.6 + i * 0.98);

/** The harp leans back onto the player's RIGHT shoulder: the body's top
 *  over the stool, a little to stage right, the column toward the audience. */
const HARP_TURN = 'translate(-1.3 3.0) rotate(-10)';
/** The carved capital on the column: a ring of ten leaves round a boss. */
const HARP_CROWN = (() => {
  const cy = 13.4;
  const p = (r: number, deg: number) => `${(Math.cos((deg * Math.PI) / 180) * r).toFixed(2)} ${(cy + Math.sin((deg * Math.PI) / 180) * r).toFixed(2)}`;
  let d = `M${p(2.1, 0)}`;
  for (let i = 0; i < 10; i++) d += ` Q${p(3.3, i * 36 + 18)} ${p(2.1, (i + 1) * 36)}`;
  return `${d} Z`;
})();
/** The seven pedals, out of the base at floor level, toward the player:
 *  three on the player's left (+x), four on the right. */
const HARP_PEDALS = [
  ...[5.0, 6.6, 8.2].map((y) => `M6.6 ${y} l1.4 -0.9`),
  ...[4.4, 6.0, 7.6, 9.2].map((y) => `M-6.6 ${y} l-1.4 -0.9`),
].join(' ');

function HarpTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Rect x={-7} y={-19.5} width={14} height={10.5} rx={1.4} fill={SHADOW} />
        <G transform={HARP_TURN}>
          <Path d={HARP_BODY} fill={SHADOW} />
          <Rect x={-6.8} y={3.6} width={13.6} height={11.7} rx={1.2} fill={SHADOW} />
        </G>
      </G>
      {/* the harpist's stool, upstage */}
      <Rect x={-7} y={-19.5} width={14} height={10.5} rx={1.4} fill="#2a2c31" stroke={OUTLINE} strokeWidth={0.45} />
      <Rect x={-6.1} y={-18.6} width={12.2} height={8.7} rx={1.6} fill="#3a3d44" />
      <G transform={HARP_TURN}>
        {/* the pedals, then the base (wood, a thin gilt line) */}
        <Path d={HARP_PEDALS} stroke={GOLD_DK} strokeWidth={1.0} strokeLinecap="round" />
        <Path d={HARP_PEDALS} stroke={GOLD} strokeWidth={0.6} strokeLinecap="round" />
        <Rect x={-6.8} y={3.6} width={13.6} height={11.7} rx={1.2} fill={WALNUT} stroke={OUTLINE} strokeWidth={0.45} />
        <Rect x={-6.3} y={4.1} width={12.6} height={10.7} rx={0.9} fill="none" stroke="#7a6a32" strokeWidth={0.18} />
        {/* the body behind the soundboard; the soundboard faces up the
            strings; its center strip with the strings' eyelets */}
        <Path d={HARP_BODY} fill={WALNUT_DK} stroke={OUTLINE} strokeWidth={0.4} strokeLinejoin="round" />
        <Path d={HARP_SOUNDBOARD} fill={SPRUCE} stroke="#6a5530" strokeWidth={0.25} strokeLinejoin="round" />
        <Path d="M-1.3 9.8 L1.3 9.8 L0.5 -14.6 L-0.5 -14.6 Z" fill="#a8864a" />
        {HARP_EYELETS.map((y) => (
          <Circle key={y} cx={-1.45} cy={y} r={0.14} fill={GOLD_DK} />
        ))}
        {/* the strings, all in one upright plane: from above, one line */}
        <Line x1={0} y1={12} x2={0} y2={-14.6} stroke={STRING} strokeWidth={0.5} />
        {/* the neck: the tuning pins out of one side, the brass action plate
            along the other; it widens into the capital on the column */}
        <Path d={HARP_EYELETS.map((y) => `M-1.0 ${(y + 0.3).toFixed(2)} h-0.9`).join('')} stroke={STEEL} strokeWidth={0.22} />
        <Path d={HARP_NECK} fill={WALNUT} stroke={OUTLINE} strokeWidth={0.3} />
        <Path d="M-1.0 10.4 L-1.8 12.4 L1.8 12.4 L1.0 10.4 Z" fill={WALNUT} stroke={OUTLINE} strokeWidth={0.25} />
        <Path d="M1.0 12 C1.15 6 0.6 -4 0.95 -14.6" fill="none" stroke={GOLD} strokeWidth={0.45} />
        <Path d={HARP_CROWN} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.3} strokeLinejoin="round" />
        <Circle cx={0} cy={13.4} r={1.5} fill="none" stroke="#e2d08a" strokeWidth={0.3} />
        <Circle cx={0} cy={13.4} r={0.7} fill={GOLD_DK} />
      </G>
    </G>
  );
}

/* ── grand piano ── */

/** The case outline, the curved side as points (smoothed when drawn). */
const GP_BENT: [number, number][] = [
  [-17, 23.6],
  [-10, 23.6],
  [-3, 22.0],
  [5, 17.6],
  [13, 12.0],
  [21, 5.8],
  [28, -0.6],
  [33.6, -6.6],
  [37.2, -13],
  [38.0, -18],
  [37.0, -22.1],
  [33.8, -23.6],
];
const SPINE = -23.6;
/** The lid's tilt: its shadow on the case reaches cos(52°) of the way across. */
const LID = 0.62;

function smooth(pts: readonly (readonly [number, number])[]): string {
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]!;
    const [nx, ny] = pts[i + 1]!;
    d += ` Q${x} ${y} ${((x + nx) / 2).toFixed(2)} ${((y + ny) / 2).toFixed(2)}`;
  }
  const last = pts[pts.length - 1]!;
  return `${d} L${last[0]} ${last[1]}`;
}
const GP_CASE = `${smooth(GP_BENT)} L-17 ${SPINE} Z`;
/** Where the curved side is, across the case, at a given x (the rim). */
function bentY(x: number): number {
  for (let i = 0; i + 1 < GP_BENT.length; i++) {
    const [x0, y0] = GP_BENT[i]!;
    const [x1, y1] = GP_BENT[i + 1]!;
    if (x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && y1 < y0 + 1e-9) return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return SPINE;
}
const lidY = (y: number) => SPINE + (y - SPINE) * LID;
/** The raised lid: from behind the music desk to the tail. */
const GP_LID = (() => {
  const pts = GP_BENT.filter(([x]) => x > -8).map(([x, y]) => [x, lidY(y)] as [number, number]);
  return `${smooth([[-8, lidY(bentY(-8))], ...pts])} L-8 ${SPINE + 0.6} Z`;
})();
/** The treble strings that show between the lid's edge and the curved side:
 *  from the dampers to the hitch pins along the rim. */
const GP_STRINGS = (() => {
  const d: string[] = [];
  for (let y = -2; y <= 21.4; y += 0.55) {
    // the rim at this y, found along the curve
    let end = -6;
    for (let x = -6; x <= 37; x += 0.25) if (bentY(x) >= y + 1.4) end = x;
    if (end > -4) d.push(`M-5.6 ${y.toFixed(2)} H${(end - 1.6).toFixed(2)}`);
  }
  return d.join('');
})();
const GP_KEYS = keyPaths(52, -19.6, 19.6, 0, 4.8, 1.9, 'A');

function GrandPianoTop() {
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Path d={GP_CASE} fill={SHADOW} />
        <Rect x={-38.0} y={-13.4} width={10.6} height={26.8} rx={0.8} fill={SHADOW} />
      </G>
      {/* the bench, its padded top */}
      <Rect x={-38.0} y={-13.4} width={10.6} height={26.8} rx={0.8} fill={EBONY} stroke={OUTLINE} strokeWidth={0.5} />
      <Rect x={-37.1} y={-12.5} width={8.8} height={25} rx={0.6} fill="#2c2e33" />
      {/* the case: the rim, the soundboard inside it, the gold plate */}
      <Path d={GP_CASE} fill={EBONY} stroke={OUTLINE} strokeWidth={0.6} strokeLinejoin="round" />
      <Path d={GP_CASE} fill={SPRUCE} transform="translate(10.5 0) scale(0.955) translate(-10.5 0)" />
      <Path d={GP_CASE} fill={GOLD} stroke={GOLD_DK} strokeWidth={0.3} transform="translate(10.5 0) scale(0.91) translate(-10.5 0)" />
      {/* holes in the plate over the soundboard */}
      <Ellipse cx={14} cy={8.6} rx={4.2} ry={1.6} fill={SPRUCE} transform="rotate(-36 14 8.6)" />
      <Ellipse cx={24.5} cy={0.6} rx={3.0} ry={1.3} fill={SPRUCE} transform="rotate(-42 24.5 0.6)" />
      {/* the treble strings, then the dampers on them near the keys */}
      <Path d={GP_STRINGS} stroke="#d9d6cc" strokeWidth={0.16} />
      <Rect x={-7.8} y={-19} width={1.8} height={30} fill="#2a2c31" />
      <Path d={Array.from({ length: 30 }, (_, i) => `M-7.8 ${(-19 + i + 0.5).toFixed(1)} h1.8`).join('')} stroke="#4a4e56" strokeWidth={0.18} />
      {/* the key bed: black from the keys to the music desk, the cheek blocks at the ends of the keys */}
      <Rect x={-16.6} y={-22.6} width={8.4} height={45.2} fill={EBONY} />
      <Rect x={-17.6} y={-22.4} width={5.2} height={2.6} rx={0.4} fill="#202227" stroke={OUTLINE} strokeWidth={0.25} />
      <Rect x={-17.6} y={19.8} width={5.2} height={2.6} rx={0.4} fill="#202227" stroke={OUTLINE} strokeWidth={0.25} />
      {/* the music desk, raised and leaning back */}
      <Rect x={-11.2} y={-19.5} width={3.0} height={39} rx={0.3} fill="#202227" stroke={OUTLINE} strokeWidth={0.3} />
      {/* the open fallboard, then the keys: 88, the bass upstage (the pianist's left) */}
      <Rect x={-12.6} y={-20.4} width={1.4} height={40.8} fill="#26282d" stroke={OUTLINE} strokeWidth={0.25} />
      <G transform="translate(-17.4 0) rotate(-90)">
        <Rect x={-19.6} y={0} width={39.2} height={4.8} fill={IVORY} />
        <Path d={GP_KEYS.joints} stroke="#7d7a70" strokeWidth={0.14} />
        <Path d={GP_KEYS.blacks} stroke="#121316" strokeWidth={0.44} />
      </G>
      <Rect x={-17.6} y={-21.6} width={0.7} height={43.2} fill={EBONY} />
      {/* the lid, raised on its stick: its own shadow on the strings, its
          folded front flap, the light along its edge, the prop stick */}
      <Path d={GP_LID} fill="rgba(0,0,0,0.4)" transform="translate(0.6 1.4)" />
      <Path d={GP_LID} fill="#121317" stroke={OUTLINE} strokeWidth={0.4} strokeLinejoin="round" />
      <Line x1={1} y1={SPINE + 0.6} x2={1} y2={lidY(bentY(1)) - 0.4} stroke="#2c2e33" strokeWidth={0.3} />
      <Path d={smooth([[-8, lidY(bentY(-8)) - 0.6], ...GP_BENT.slice(0, 8).filter(([x]) => x > -8).map(([x, y]) => [x, lidY(y) - 0.6] as [number, number])])} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={0.4} />
      <Line x1={9.6} y1={bentY(9.6) - 1.1} x2={9.6} y2={lidY(bentY(9.6)) + 0.2} stroke="#8a6a3c" strokeWidth={0.5} strokeLinecap="round" />
    </G>
  );
}

/* ── Hammond organ and its Leslie ── */

const DRAWBAR_SET = ['#6b4423', '#6b4423', IVORY, IVORY, '#15161a', IVORY, '#15161a', '#15161a', IVORY];

function OrganTop() {
  const preset = (y0: number, h: number) => (
    <G>
      {/* the reverse-colored preset keys at the left end (the player's left, +x) */}
      <Rect x={10.9} y={y0} width={5.4} height={h} fill="#15161a" />
      <Path d={Array.from({ length: 6 }, (_, i) => `M${(10.9 + (i + 1) * 0.77).toFixed(2)} ${y0} v${h}`).join('')} stroke="#4a4e56" strokeWidth={0.14} />
      <Path d={[1, 2, 4, 5, 6].map((k) => `M${(16.3 - k * 0.77).toFixed(2)} ${y0 + h * 0.45} v${h * 0.55}`).join('')} stroke={IVORY} strokeWidth={0.4} />
    </G>
  );
  const manual = (y0: number, h: number) => {
    // 61 keys, C to C, the low C beside the presets at the player's left
    const k = keyPaths(36, -16.3, 10.9, y0, y0 + h, y0 + h * 0.42, 'C');
    return (
      <G>
        <Rect x={-16.3} y={y0} width={27.2} height={h} fill={IVORY} />
        <Path d={k.joints} stroke="#7d7a70" strokeWidth={0.13} />
        <Path d={k.blacks} stroke="#121316" strokeWidth={0.44} />
        {preset(y0, h)}
      </G>
    );
  };
  // the drawbars behind the upper manual: two sets for each manual and the
  // two pedal drawbars between them
  const bars: { x: number; c: string }[] = [];
  let x = -14.2;
  for (const set of [0, 1, 'pedal', 2, 3] as const) {
    const colors = set === 'pedal' ? ['#6b4423', '#6b4423'] : DRAWBAR_SET;
    for (const c of colors) {
      bars.push({ x, c });
      x += 0.68;
    }
    x += 0.6;
  }
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Rect x={-19.5} y={-2.6} width={39} height={23.4} rx={0.8} fill={SHADOW} />
        <Rect x={-15} y={-20.8} width={30} height={12.9} rx={0.6} fill={SHADOW} />
      </G>
      {/* the bench, its hinged lid */}
      <Rect x={-15} y={-20.8} width={30} height={12.9} rx={0.6} fill={WALNUT} stroke={OUTLINE} strokeWidth={0.5} />
      <Rect x={-14.3} y={-20.1} width={28.6} height={11.5} rx={0.4} fill="none" stroke={WALNUT_DK} strokeWidth={0.3} />
      <Path d="M-9 -20.4 h3 M6 -20.4 h3" stroke={STEEL} strokeWidth={0.35} />
      {/* the pedalboard between bench and console: the natural pedals'
          ends, the sharps toward the console, the swell pedal on it */}
      <Rect x={-15.7} y={-8.0} width={31.4} height={5.6} fill="#2a1a10" stroke={OUTLINE} strokeWidth={0.35} />
      {Array.from({ length: 15 }, (_, i) => (
        <Rect key={i} x={-15.2 + i * 2.06} y={-7.6} width={1.6} height={5.2} rx={0.15} fill="#a8865a" stroke="#4a3220" strokeWidth={0.12} />
      ))}
      {[1, 2, 4, 5, 6, 8, 9, 11, 12, 13].map((i) => (
        <Rect key={`s${i}`} x={-15.2 + i * 2.06 - 0.65} y={-4.4} width={1.3} height={2.0} rx={0.15} fill="#15161a" />
      ))}
      <Path d="M-5.6 -7.2 L-1.6 -7.2 L-1.9 -2.6 L-5.3 -2.6 Z" fill="#15161a" stroke="#565a63" strokeWidth={0.2} />
      {/* the console: the closed top, the cheek blocks, the two manuals */}
      <Rect x={-19.5} y={-2.6} width={39} height={23.4} rx={0.8} fill={WALNUT} stroke={OUTLINE} strokeWidth={0.6} />
      <Rect x={-19.5} y={6.6} width={39} height={14.2} rx={0.8} fill="#6a4529" stroke={OUTLINE} strokeWidth={0.4} />
      <Path d="M-18.8 9 C-8 8.4 6 9.6 18.8 8.8 M-18.8 13 C-6 12.4 8 13.6 18.8 12.8 M-18.8 17 C-8 16.4 6 17.6 18.8 16.8" fill="none" stroke="rgba(30,14,4,0.22)" strokeWidth={0.18} />
      <Line x1={-19.0} y1={7.1} x2={19.0} y2={7.1} stroke="rgba(255,226,180,0.25)" strokeWidth={0.35} />
      <Rect x={-16.6} y={-2.6} width={33.2} height={9.2} fill="#1a1008" />
      {manual(-2.4, 3.6)}
      {manual(0.9, 3.4)}
      {/* the drawbars, pulled out toward the player */}
      <Rect x={-14.8} y={4.6} width={28.6} height={1.8} rx={0.2} fill="#0b0b0d" />
      {bars.map((b) => (
        <Rect key={b.x} x={b.x} y={4.75} width={0.5} height={1.5} rx={0.18} fill={b.c} />
      ))}
    </G>
  );
}

function LeslieTop() {
  const y0 = -7.7;
  const y1 = 8.9;
  return (
    <G>
      <Rect x={-11.55 + 0.8} y={y0 + 1.2} width={23.1} height={y1 - y0} rx={0.9} fill={SHADOW} />
      {/* the one lead from the organ (it carries the mains too), coming out
          from under the back of the cabinet at floor level */}
      <Path d={`M3.2 ${y0 + 0.4} C3.2 -8.6 4.4 -8.9 7.4 -9.0`} fill="none" stroke={OUTLINE} strokeWidth={0.9} />
      <Path d={`M3.2 ${y0 + 0.4} C3.2 -8.6 4.4 -8.9 7.4 -9.0`} fill="none" stroke="#3a3d44" strokeWidth={0.55} />
      {/* the cabinet's top: walnut veneer inside a molded edge */}
      <Rect x={-11.55} y={y0} width={23.1} height={y1 - y0} rx={0.9} fill={WALNUT_DK} stroke={OUTLINE} strokeWidth={0.6} />
      <Rect x={-10.85} y={y0 + 0.7} width={21.7} height={y1 - y0 - 1.4} rx={0.6} fill={WALNUT} />
      {['M-10.6 -5.2 C-5 -5.8 2 -4.6 10.6 -5.4', 'M-10.6 -2.4 C-4 -3.0 3 -1.8 10.6 -2.6', 'M-10.6 0.6 C-6 0 2 1.2 10.6 0.2', 'M-10.6 3.4 C-5 2.8 3 4.0 10.6 3.2', 'M-10.6 6.2 C-4 5.6 4 6.8 10.6 6.0'].map((d) => (
        <Path key={d} d={d} fill="none" stroke="rgba(30,14,4,0.22)" strokeWidth={0.18} />
      ))}
      {/* the top edge of the removable back panel */}
      <Rect x={-10.4} y={y0 + 0.1} width={20.8} height={0.5} fill="#3a2414" />
      <Line x1={-11.1} y1={y1 - 0.9} x2={11.1} y2={y1 - 0.9} stroke="rgba(255,226,180,0.22)" strokeWidth={0.35} />
      <Line x1={-11.1} y1={y0 + 0.75} x2={11.1} y2={y0 + 0.75} stroke="rgba(0,0,0,0.4)" strokeWidth={0.3} />
    </G>
  );
}

/* ── electric piano and the two-tier rig ── */

function ElectricPianoTop() {
  const keys = keyPaths(43, -16.2, 16.2, 0, 4.6, 2.0, 'E');
  return (
    <G>
      <Rect x={-18.1 + 0.8} y={-8.65 + 1.2} width={36.2} height={17.3} rx={1.4} fill={SHADOW} />
      {/* the case and its black lid with the aluminum trim */}
      <Rect x={-18.1} y={-8.65} width={36.2} height={17.3} rx={1.4} fill={TOLEX} stroke={OUTLINE} strokeWidth={0.6} />
      <Rect x={-17.4} y={-2.4} width={34.8} height={10.4} rx={1.0} fill="#15161a" stroke="#6d7179" strokeWidth={0.35} />
      <Path d="M-16.6 -1.6 H16.6" stroke="rgba(255,255,255,0.12)" strokeWidth={0.4} />
      {/* the case's metal corners, the front lip under the keys, the key cheeks */}
      {[
        [-18.1, -8.65],
        [16.6, -8.65],
        [-18.1, 7.15],
        [16.6, 7.15],
      ].map(([x, y]) => (
        <Rect key={`${x}${y}`} x={x} y={y} width={1.5} height={1.5} rx={0.5} fill="#9aa0a8" stroke={OUTLINE} strokeWidth={0.15} />
      ))}
      <Rect x={-16.6} y={-8.65} width={33.2} height={0.3} fill="#3a3d44" />
      <Rect x={-17.3} y={-8.35} width={1.0} height={4.6} rx={0.2} fill="#2a2c31" />
      <Rect x={16.3} y={-8.35} width={1.0} height={4.6} rx={0.2} fill="#2a2c31" />
      {/* the name rail behind the keys */}
      <Rect x={-16.6} y={-3.7} width={33.2} height={1.2} rx={0.2} fill="#9aa0a8" stroke={OUTLINE} strokeWidth={0.2} />
      {/* the 73 keys, the low E at the player's left (+x) */}
      <G transform="translate(0 -8.4)">
        <Rect x={-16.2} y={0} width={32.4} height={4.6} fill={IVORY} />
        <Path d={keys.joints} stroke="#7d7a70" strokeWidth={0.13} />
        <Path d={keys.blacks} stroke="#121316" strokeWidth={0.44} />
      </G>
      {/* the volume and bass knobs at the left end of the keys */}
      <Circle cx={17.15} cy={-7.2} r={0.55} fill="#2a2c31" stroke={STEEL} strokeWidth={0.2} />
      <Circle cx={17.15} cy={-5.4} r={0.55} fill="#2a2c31" stroke={STEEL} strokeWidth={0.2} />
    </G>
  );
}

function KeyboardRigTop() {
  const k88 = keyPaths(52, -19.6, 19.6, 0, 4.6, 2.0, 'A');
  const k61 = keyPaths(36, -13.6, 13.6, 0, 4.4, 1.9, 'C');
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Rect x={-21.1} y={-10.95} width={42.2} height={10.65} rx={0.8} fill={SHADOW} />
        <Rect x={-15.7} y={-2.2} width={31.4} height={9.6} rx={0.8} fill={SHADOW} />
      </G>
      {/* the A-frame stand's feet, showing past the upper board */}
      {[-18, 18].map((x) => (
        <G key={x}>
          <Line x1={x} y1={6} x2={x} y2={10.6} stroke="#565a63" strokeWidth={1.1} strokeLinecap="round" />
          <Rect x={x - 0.9} y={9.8} width={1.8} height={1.2} rx={0.4} fill="#15161a" />
        </G>
      ))}
      {/* the lower board, an 88-key stage piano: its panel, its keys */}
      <Rect x={-21.1} y={-10.95} width={42.2} height={10.65} rx={0.8} fill={CASE_DK} stroke={OUTLINE} strokeWidth={0.5} />
      <G transform="translate(0 -10.55)">
        <Rect x={-19.6} y={0} width={39.2} height={4.6} fill={IVORY} />
        <Path d={k88.joints} stroke="#7d7a70" strokeWidth={0.13} />
        <Path d={k88.blacks} stroke="#121316" strokeWidth={0.42} />
      </G>
      {[-14, -12.6, -11.2, 9, 10.4].map((x) => (
        <Rect key={x} x={x} y={-5.2} width={0.9} height={0.5} rx={0.1} fill="#6d7179" />
      ))}
      {/* the upper board, a 61-key synthesizer, higher and set back */}
      <Rect x={-15.7} y={-2.2} width={31.4} height={9.6} rx={0.8} fill="#1b1c20" stroke={OUTLINE} strokeWidth={0.5} />
      <G transform="translate(0 -1.9)">
        <Rect x={-13.6} y={0} width={27.2} height={4.4} fill={IVORY} />
        <Path d={k61.joints} stroke="#7d7a70" strokeWidth={0.13} />
        <Path d={k61.blacks} stroke="#121316" strokeWidth={0.42} />
      </G>
      {/* its pitch and modulation wheels at the left end, the screen and knobs */}
      <Rect x={13.9} y={-1.6} width={0.7} height={3.4} rx={0.3} fill="#3a3d44" />
      <Rect x={14.8} y={-1.6} width={0.7} height={3.4} rx={0.3} fill="#3a3d44" />
      <Rect x={-3} y={3.6} width={6} height={2.2} rx={0.2} fill="#2c4a5e" stroke="#6d7179" strokeWidth={0.2} />
      {[-11, -9.6, -8.2, -6.8, 6.8, 8.2, 9.6, 11].map((x) => (
        <Circle key={x} cx={x} cy={4.8} r={0.45} fill="#2a2c31" stroke="#9aa0a8" strokeWidth={0.15} />
      ))}
    </G>
  );
}

/* ── accordion ── */

function AccordionTop() {
  const folds = Array.from({ length: 9 }, (_, i) => -3.3 + i * 0.93);
  return (
    <G>
      <Rect x={-7.95 + 0.8} y={-3.5 + 1.2} width={15.9} height={7} rx={0.6} fill={SHADOW} />
      {/* the shoulder straps, from the back of the cases to the player */}
      <Path d="M-4.6 -3.4 L-5.1 -4.2 M4.4 -3.0 L4.9 -4.2" stroke="#4a3220" strokeWidth={1.1} strokeLinecap="round" />
      {/* the bellows: pleats, the metal corners at front and back, the strap */}
      <Rect x={-3.6} y={-3.2} width={7.6} height={6.4} fill="#1d1f24" stroke={OUTLINE} strokeWidth={0.35} />
      {folds.map((x, i) => (
        <Rect key={x} x={x} y={-3.2} width={0.6} height={6.4} fill={i % 2 ? '#121316' : '#3a3d44'} />
      ))}
      {folds.map((x) => (
        <G key={`c${x}`}>
          <Rect x={x + 0.05} y={-3.3} width={0.5} height={0.35} fill="#8d9199" />
          <Rect x={x + 0.05} y={2.95} width={0.5} height={0.35} fill="#8d9199" />
        </G>
      ))}
      <Rect x={-0.2} y={-3.4} width={1.0} height={6.8} rx={0.2} fill="#4a3220" />
      {/* the treble case on the player's right, the keyboard's top edge on its outer side */}
      <Rect x={-7.75} y={-3.5} width={4.2} height={7} rx={0.5} fill="#8a2a22" stroke={OUTLINE} strokeWidth={0.4} />
      <Rect x={-7.2} y={-2.9} width={3.1} height={5.8} rx={0.3} fill="#9e3a30" stroke="#5a1a14" strokeWidth={0.2} />
      <Rect x={-7.75} y={-3.2} width={1.1} height={6.4} fill={IVORY} stroke={IVORY_EDGE} strokeWidth={0.12} />
      <Rect x={-7.75} y={-3.2} width={0.55} height={3.0} fill="#121316" />
      {/* the bass case on the left, its hand strap along the outer side */}
      <Rect x={4} y={-3.3} width={3.55} height={6.6} rx={0.5} fill="#8a2a22" stroke={OUTLINE} strokeWidth={0.4} />
      <Rect x={4.45} y={-2.7} width={2.6} height={5.4} rx={0.3} fill="#9e3a30" stroke="#5a1a14" strokeWidth={0.2} />
      <Rect x={6.85} y={-3.0} width={0.85} height={6.0} rx={0.3} fill="#3a2414" stroke={OUTLINE} strokeWidth={0.15} />
      <Circle cx={5.85} cy={-2.2} r={0.4} fill={STEEL} />
    </G>
  );
}

/* ── banjo and mandolin, face up, the neck upstage ── */

/** The fret positions down from the nut along a scale (equal temperament). */
const fretAt = (nut: number, scale: number, n: number) => nut + scale * (1 - 2 ** (-n / 12));

/* banjo: head top −15.4, nut −11.6, a 26¼ in scale (21.3 units) to the bridge
   at +9.7, the pot (an 11 in head in its resonator) centered at +8.1 */
const BJ_NUT = -11.6;
const BJ_SCALE = 21.3;
const BJ_POT = { cy: 8.1, res: 5.75, hoop: 4.75, head: 4.45 };

function BanjoTop() {
  const f = (n: number) => fretAt(BJ_NUT, BJ_SCALE, n);
  const frets = Array.from({ length: 22 }, (_, i) => `M-0.75 ${f(i + 1).toFixed(3)} H0.75`).join('');
  const hooks = Array.from({ length: 24 }, (_, i) => (i * 15 * Math.PI) / 180);
  // four long strings from the tailpiece to the nut; the fifth from the
  // bridge to its peg at the fifth fret, on the bass side (−x)
  const bridge = BJ_NUT + BJ_SCALE;
  const strings = [-0.36, -0.12, 0.12, 0.36].map((k) => `M${(k * 1.6).toFixed(2)} ${BJ_NUT} L${(k * 3.1).toFixed(2)} ${bridge} L${(k * 1.6).toFixed(2)} 12.4`).join('') + `M-0.62 ${f(5).toFixed(2)} L-1.45 ${bridge}`;
  return (
    <G transform="translate(0 0.6)">
      <G transform={SHADOW_AT}>
        <Circle cx={0} cy={BJ_POT.cy} r={BJ_POT.res} fill={SHADOW} />
        <Rect x={-1} y={-15.4} width={2} height={20} fill={SHADOW} />
      </G>
      {/* the resonator, its flange, the tension hooks round the hoop */}
      <Circle cx={0} cy={BJ_POT.cy} r={BJ_POT.res} fill="#5e3214" stroke={OUTLINE} strokeWidth={0.4} />
      <Circle cx={0} cy={BJ_POT.cy} r={BJ_POT.res - 0.45} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.2} />
      {hooks.map((a, i) => (
        <Line key={i} x1={Math.cos(a) * BJ_POT.hoop} y1={BJ_POT.cy + Math.sin(a) * BJ_POT.hoop} x2={Math.cos(a) * (BJ_POT.res - 0.3)} y2={BJ_POT.cy + Math.sin(a) * (BJ_POT.res - 0.3)} stroke={STEEL_DK} strokeWidth={0.28} />
      ))}
      <Circle cx={0} cy={BJ_POT.cy} r={BJ_POT.hoop} fill="#d9d6cc" stroke={STEEL_DK} strokeWidth={0.3} />
      <Circle cx={0} cy={BJ_POT.cy} r={BJ_POT.head} fill="#ebe8df" stroke="#b9b6ac" strokeWidth={0.2} />
      {/* the tailpiece over the hoop's lower edge, the bridge */}
      <Path d="M-1.0 10.6 L1.0 10.6 L0.55 12.6 L-0.55 12.6 Z" fill={STEEL} stroke={STEEL_DK} strokeWidth={0.2} />
      <Rect x={-1.6} y={bridge - 0.18} width={3.2} height={0.36} rx={0.1} fill="#d9c08a" stroke="#6a5530" strokeWidth={0.1} />
      {/* the neck, fingerboard and frets, the fifth-string peg on the bass side */}
      <Path d={`M-0.8 ${BJ_NUT} L0.8 ${BJ_NUT} L1.0 ${BJ_POT.cy - BJ_POT.hoop + 0.4} L-1.0 ${BJ_POT.cy - BJ_POT.hoop + 0.4} Z`} fill="#2e1f18" stroke={OUTLINE} strokeWidth={0.2} strokeLinejoin="round" />
      <Path d={frets} stroke="#b9b7ae" strokeWidth={0.12} />
      {[3, 5, 7, 10, 12].map((n) => (
        <Circle key={n} cx={0} cy={(f(n - 1) + f(n)) / 2} r={0.16} fill="#d8d2c0" />
      ))}
      <Rect x={-2.2} y={f(5) - 0.25} width={1.3} height={0.5} rx={0.2} fill={STEEL} stroke={STEEL_DK} strokeWidth={0.12} />
      <Circle cx={-2.4} cy={f(5)} r={0.42} fill={IVORY} stroke={IVORY_EDGE} strokeWidth={0.12} />
      {/* the headstock with its four string posts */}
      <Path d={`M-0.8 ${BJ_NUT} L-1.6 -13.4 L-1.2 -15.4 L1.2 -15.4 L1.6 -13.4 L0.8 ${BJ_NUT} Z`} fill="#221712" stroke={OUTLINE} strokeWidth={0.25} strokeLinejoin="round" />
      {[
        [-0.85, -12.6],
        [0.85, -12.6],
        [-0.75, -14.4],
        [0.75, -14.4],
      ].map(([x, y]) => (
        <Circle key={`${x}${y}`} cx={x} cy={y} r={0.22} fill={STEEL} />
      ))}
      <Line x1={-0.8} y1={BJ_NUT} x2={0.8} y2={BJ_NUT} stroke={IVORY} strokeWidth={0.25} />
      <Path d={strings} stroke={STRING} strokeWidth={0.07} fill="none" />
    </G>
  );
}

/* mandolin: head top −10.0, nut −6.5, a 14 in scale (11.2 units) to the
   bridge at +4.7, the body from −0.9 (the twelfth fret) to +9.9 */
const MD_NUT = -6.5;
const MD_SCALE = 11.2;
const MD_BODY = symmetricD(
  [0, -0.9],
  [
    [1.2, -0.9, 2.4, -0.2, 3.2, 1.6],
    [4.0, 3.4, 4.4, 5.4, 4.0, 7.2],
    [3.6, 8.9, 2.0, 9.9, 0, 9.9],
  ],
);

function MandolinTop() {
  const f = (n: number) => fretAt(MD_NUT, MD_SCALE, n);
  const frets = Array.from({ length: 20 }, (_, i) => `M-0.6 ${f(i + 1).toFixed(3)} H0.6`).join('');
  const bridge = MD_NUT + MD_SCALE;
  // eight strings in four pairs, nut to bridge to the tailpiece
  const strings = [-1.5, -0.5, 0.5, 1.5]
    .flatMap((k) => [k - 0.13, k + 0.13])
    .map((k) => `M${(k * 0.3).toFixed(3)} ${MD_NUT} L${(k * 0.55).toFixed(3)} ${bridge} L${(k * 0.4).toFixed(3)} 8.4`)
    .join('');
  return (
    <G>
      <G transform={SHADOW_AT}>
        <Path d={MD_BODY} fill={SHADOW} />
        <Rect x={-0.8} y={-10} width={1.6} height={9} fill={SHADOW} />
      </G>
      {/* the body: a spruce top in its binding, the oval sound hole, the raised pickguard */}
      <Path d={MD_BODY} fill="#b8935a" stroke="#33231a" strokeWidth={0.4} strokeLinejoin="round" />
      <Path d={MD_BODY} fill="none" stroke={IVORY} strokeWidth={0.12} transform="translate(0 4.5) scale(0.94) translate(0 -4.5)" />
      <Path d="M1.6 1.6 C2.8 2.2 3.4 3.4 3.3 4.8 L2.2 4.4 C2.2 3.4 1.9 2.6 1.3 2.2 Z" fill="#4a2a14" />
      <Ellipse cx={0} cy={2.6} rx={1.25} ry={1.6} fill="#0b0a09" stroke="#4a3320" strokeWidth={0.2} />
      {/* the floating bridge and the tailpiece cover at the end */}
      <Rect x={-1.5} y={bridge - 0.25} width={3.0} height={0.5} rx={0.15} fill="#2e1f18" stroke={OUTLINE} strokeWidth={0.1} />
      <Path d="M-0.9 7.6 L0.9 7.6 L1.1 9.5 L-1.1 9.5 Z" fill={STEEL} stroke={STEEL_DK} strokeWidth={0.15} />
      {/* the fingerboard over the neck and the top, its frets */}
      <Path d={`M-0.62 ${MD_NUT} L0.62 ${MD_NUT} L0.85 ${f(20).toFixed(2)} L-0.85 ${f(20).toFixed(2)} Z`} fill="#2e1f18" stroke={OUTLINE} strokeWidth={0.18} />
      <Path d={frets} stroke="#b9b7ae" strokeWidth={0.1} />
      {/* the paddle headstock, four tuner buttons a side */}
      {[-7.2, -7.95, -8.7, -9.45].map((y) => (
        <G key={y}>
          <Rect x={-1.95} y={y - 0.2} width={0.6} height={0.4} rx={0.15} fill={IVORY} />
          <Rect x={1.35} y={y - 0.2} width={0.6} height={0.4} rx={0.15} fill={IVORY} />
        </G>
      ))}
      <Path d={`M-0.62 ${MD_NUT} L-1.35 -7.0 L-1.35 -9.6 C-1.0 -10.0 1.0 -10.0 1.35 -9.6 L1.35 -7.0 L0.62 ${MD_NUT} Z`} fill="#221712" stroke={OUTLINE} strokeWidth={0.2} strokeLinejoin="round" />
      <Line x1={-0.62} y1={MD_NUT} x2={0.62} y2={MD_NUT} stroke={IVORY} strokeWidth={0.2} />
      <Path d={strings} stroke={STRING} strokeWidth={0.05} fill="none" />
    </G>
  );
}

export const TOP_ART_STRINGS_KEYS: TopArtMap = {
  'upright-bass': UprightBassTop,
  cello: CelloTop,
  violin: ViolinTop,
  harp: HarpTop,
  'grand-piano': GrandPianoTop,
  organ: OrganTop,
  leslie: LeslieTop,
  'electric-piano': ElectricPianoTop,
  'keyboard-rig': KeyboardRigTop,
  accordion: AccordionTop,
  banjo: BanjoTop,
  mandolin: MandolinTop,
};
