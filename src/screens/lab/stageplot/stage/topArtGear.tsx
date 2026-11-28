/**
 * topArtGear — top-view art for the equipment and furniture the app had no
 * illustration for: a playback rig, in-ear monitor equipment, a drum fill, a
 * sidefill, an equipment rack, a power location, a chair, a music stand. See
 * topArtTypes.ts for the contract.
 *
 * Each piece is the real object as it looks from directly above, at its real
 * size (32 units = 1 m), centered on 0,0, its FRONT toward +y (the audience),
 * in the language of cableinstall/scenes/floorArt: a soft drop shadow first,
 * muted real material colors, thin dark outlines, a few true details.
 *
 * What each one is (and the real sizes it was drawn to):
 *   • playback: a 13 in laptop (304 × 212 mm deck), open, on a small table,
 *     with a compact USB audio interface beside it. The operator is UPSTAGE
 *     of it, facing the audience, like every player in this lab: the trackpad
 *     and the keyboard are toward -y, the hinge and the lid toward +y. The
 *     lid leans back away from the operator, so from above the lit screen is
 *     a narrow strip on the operator's side of the lid's top edge. The
 *     interface's knobs face the operator too.
 *   • iem: one half-rack in-ear transmitter (198 × 172 mm) on a 19 in rack
 *     shelf, the way a half-rack unit is racked: the shelf with its vent
 *     slots and rack ears, the transmitter's top cover, its front panel's top
 *     edge with the level knob, and at the rear its antenna on the BNC and
 *     its two input plugs. The cover is plain and dark where "IEM" is printed.
 *   • drum-fill: a wide subwoofer with a two-way top box standing on it. From
 *     above: the sub's top with its stacking recesses and side handles, the
 *     top box's tapered plan with the carry handle in its top, and both steel
 *     grilles bowing out along the front.
 *   • sidefill: a three-way trapezoid full-range cabinet (670 mm at the
 *     front, 419 mm at the rear, 749 mm deep) on its matching subwoofer. From
 *     above: the tapered top with its two flying tracks, the sub's rear
 *     corners showing behind the taper, the grille bowing out at the front.
 *   • rack: a shock-mount rack case with its lids on: laminate top inside
 *     aluminum edging, a ball corner at each corner, the two lid seams with
 *     their recessed butterfly latches.
 *   • power: a rubber stage quad box (two duplex outlets) on its cable, a
 *     loop of slack laid round the place the "AC" tag is printed, the cable
 *     running on past the edge. Nothing on it states a voltage or a rating.
 *   • chair: an orchestra chair: the padded seat, the curved backrest along
 *     the upstage edge, the four leg ends at the corners.
 *   • music-stand: a solid-desk stand (desk 500 × 318 mm with a 57 mm lip)
 *     on its tripod. The desk leans back, so from above it is a narrow band,
 *     the lip on the player's side (upstage); one leg points at the player.
 */
import { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { TopArtMap } from './topArtTypes';

/**
 * How far each drawing's shapes reach from its center, in floor units
 * (32 = 1 m): half its width (`hw`) and half its depth (`hh`), the shadow
 * aside. With the outline added (`TOP_ART_GEAR_OUTLINE`), each stays inside
 * the kind's print-symbol footprint (w·16 by h·16), which is what the stage
 * frames, names and touches. The components draw to these numbers.
 */
export const TOP_ART_GEAR_EXTENT = {
  playback: { hw: 7.6, hh: 6 },
  iem: { hw: 7.7, hh: 4.5 },
  'drum-fill': { hw: 12.4, hh: 9.2 },
  sidefill: { hw: 10.7, hh: 12.8 },
  rack: { hw: 8.9, hh: 9.2 },
  power: { hw: 6, hh: 6.1 },
  chair: { hw: 6.8, hh: 6.9 },
  'music-stand': { hw: 7.7, hh: 5.3 },
} as const;

/** Half the widest outline drawn round a shape (0.6 wide), in floor units. */
export const TOP_ART_GEAR_OUTLINE = 0.3;

const SHADOW = 'rgba(0,0,0,0.45)';
const EDGE = '#0a0a0c';

/** A playback rig: the open laptop and its audio interface on a small table.
 *  The operator is UPSTAGE of it, facing the audience, like every player. */
function PlaybackTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT.playback;
  const keys: string[] = [];
  for (let i = 1; i < 13; i++) keys.push(`M${-6.5 + i * 0.63} -1.6 v3.1`);
  for (let j = 1; j < 4; j++) keys.push(`M-6.5 ${-1.6 + j * 0.775} h8.2`);
  return (
    <G>
      {/* the table */}
      <Rect x={-hw + 0.8} y={-hh + 1.2} width={hw * 2} height={hh * 2} rx={0.8} fill={SHADOW} />
      <Rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={0.8} fill="#26282d" stroke={EDGE} strokeWidth={0.6} />
      <Rect x={-hw + 0.45} y={-hh + 0.45} width={hw * 2 - 0.9} height={hh * 2 - 0.9} rx={0.5} fill="none" stroke="#3a3d44" strokeWidth={0.3} />
      {/* the laptop: its shadow on the table; the lid leaning back, away from
          the operator (the lit screen seen at a steep angle on the operator's
          side of the lid's top edge, which is the edge nearest the audience);
          the deck with its trackpad nearest the operator, the keyboard, the
          hinge */}
      <Rect x={-6.8} y={-3.9} width={9.6} height={8.9} rx={0.5} fill="rgba(0,0,0,0.4)" />
      <Rect x={-7.2} y={2.2} width={9.6} height={2.2} rx={0.3} fill="#0b0c0f" stroke={EDGE} strokeWidth={0.4} />
      <Rect x={-6.8} y={2.5} width={8.8} height={1.45} fill="#46647e" />
      <Line x1={-7} y1={4.4} x2={2.2} y2={4.4} stroke="#c9c6bc" strokeWidth={0.4} />
      <Rect x={-7.2} y={-4.5} width={9.6} height={6.7} rx={0.5} fill="#a8a69d" stroke={EDGE} strokeWidth={0.4} />
      <Rect x={-6.6} y={1.95} width={8.4} height={0.5} rx={0.2} fill="#3a3c42" />
      <Rect x={-6.5} y={-1.6} width={8.2} height={3.1} rx={0.25} fill="#141518" />
      <Path d={keys.join('')} stroke="#3a3d44" strokeWidth={0.18} />
      <Rect x={-4.1} y={-4.1} width={3.4} height={1.95} rx={0.2} fill="#b6b4ab" stroke="#7d7b74" strokeWidth={0.25} />
      {/* the audio interface beside it: its top, the knobs standing out of
          its front panel toward the operator, the USB lead from its rear to
          the laptop's side */}
      <Path d="M4.2 1 C4.2 2.6 3.4 1.6 2.4 1.2" fill="none" stroke="#565a63" strokeWidth={0.3} strokeLinecap="round" />
      <Rect x={3.3} y={-1.8} width={4} height={3.2} rx={0.3} fill="rgba(0,0,0,0.4)" />
      <Rect x={3.4} y={-2.6} width={0.55} height={0.4} rx={0.1} fill="#9aa0a8" />
      <Rect x={4.35} y={-2.6} width={0.55} height={0.4} rx={0.1} fill="#9aa0a8" />
      <Rect x={5.5} y={-2.7} width={0.95} height={0.5} rx={0.15} fill="#c9c6bc" />
      <Rect x={2.9} y={-2.2} width={4} height={3.2} rx={0.3} fill="#34373e" stroke={EDGE} strokeWidth={0.4} />
      <Line x1={3.2} y1={-1.75} x2={6.6} y2={-1.75} stroke="#565a63" strokeWidth={0.25} />
    </G>
  );
}

/** In-ear monitor equipment: a half-rack transmitter on a rack shelf. */
function IemTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT.iem;
  const shelfHw = hw - 0.6; // the shelf between the rails; its ears reach hw
  const shelfRear = -hh + 0.2;
  const shelfFront = 3.8;
  const x0 = -3.1; // the transmitter: 198 mm wide, 172 mm of chassis
  const unitW = 6.2;
  const rear = -2.1;
  const front = 3.3;
  const slots: [number, number][] = [];
  for (const cx of [-5.8, -4.4, 4.4, 5.8]) for (let i = 0; i < 7; i++) slots.push([cx, -3.5 + i * 1]);
  return (
    <G>
      {/* the rack shelf: folded steel, vent slots, the ears at the front */}
      <Rect x={-shelfHw + 0.8} y={shelfRear + 1.2} width={shelfHw * 2} height={shelfFront - shelfRear + 0.4} rx={0.2} fill={SHADOW} />
      <Rect x={-shelfHw} y={shelfRear} width={shelfHw * 2} height={shelfFront - shelfRear} rx={0.2} fill="#31343a" stroke={EDGE} strokeWidth={0.5} />
      <Path d={`M${-shelfHw + 0.4} ${shelfRear + 0.3} V${shelfFront} M${shelfHw - 0.4} ${shelfRear + 0.3} V${shelfFront}`} stroke="#4a4e56" strokeWidth={0.3} />
      {slots.map(([cx, cy], i) => (
        <Rect key={i} x={cx - 0.5} y={cy} width={1} height={0.34} rx={0.17} fill="#0d0e11" />
      ))}
      <Rect x={-hw} y={shelfFront - 0.05} width={hw * 2} height={0.5} rx={0.1} fill="#565a63" stroke={EDGE} strokeWidth={0.25} />
      {/* at the transmitter's rear: the two input plugs with their leads,
          the antenna on its BNC, hinged up and leaning back */}
      <Path d={`M${x0 + 3.6} ${rear - 1.3} V${-hh} M${x0 + 4.8} ${rear - 1.3} V${-hh}`} stroke="#15161a" strokeWidth={0.4} />
      <Rect x={x0 + 3.3} y={rear - 1.4} width={0.6} height={1.4} rx={0.15} fill="#9aa0a8" stroke={EDGE} strokeWidth={0.2} />
      <Rect x={x0 + 4.5} y={rear - 1.4} width={0.6} height={1.4} rx={0.15} fill="#9aa0a8" stroke={EDGE} strokeWidth={0.2} />
      <Rect x={x0 + 0.85} y={rear - 0.6} width={0.7} height={0.6} fill="#c9c6bc" stroke={EDGE} strokeWidth={0.2} />
      <Line x1={x0 + 1.2} y1={rear - 0.6} x2={x0 + 0.7} y2={rear - 1.85} stroke="#15161a" strokeWidth={0.6} strokeLinecap="round" />
      {/* the transmitter: its shadow on the shelf, the plain painted cover */}
      <Rect x={x0 + 0.4} y={rear + 0.6} width={unitW} height={front - rear} rx={0.3} fill="rgba(0,0,0,0.4)" />
      <Rect x={x0} y={rear} width={unitW} height={front - rear} rx={0.3} fill="#1d1f24" stroke={EDGE} strokeWidth={0.5} />
      <Rect x={x0 + 0.45} y={rear + 0.45} width={unitW - 0.9} height={front - rear - 0.9} rx={0.2} fill="none" stroke="#31343a" strokeWidth={0.25} />
      {/* its front panel's top edge, and the level knob standing out of it */}
      <Rect x={x0 + 0.1} y={front - 0.1} width={unitW - 0.2} height={0.65} rx={0.1} fill="#6d7179" stroke={EDGE} strokeWidth={0.25} />
      <Rect x={x0 + 4.6} y={front + 0.55} width={0.8} height={0.45} rx={0.12} fill="#9aa0a8" stroke={EDGE} strokeWidth={0.15} />
    </G>
  );
}

/** A drum fill: a wide subwoofer with a two-way top box standing on it. */
function DrumFillTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT['drum-fill'];
  const subFront = hh - 1.5; // the sub's baffle; its grille bows out to hh
  const boxFront = subFront - 2.2;
  const boxRear = boxFront - 11;
  const box = `-7,${boxFront} 7,${boxFront} 4.5,${boxRear} -4.5,${boxRear}`;
  return (
    <G>
      <Rect x={-hw + 0.8} y={-hh + 1.2} width={hw * 2} height={hh + subFront} rx={1} fill={SHADOW} />
      {/* the subwoofer: its grille bowing out of the front, its top panel,
          the handles let into both sides, the four stacking recesses */}
      <Path d={`M${-hw + 0.4} ${subFront - 0.2} Q0 ${subFront + 3.2} ${hw - 0.4} ${subFront - 0.2} Z`} fill="#4a4e56" stroke="#8d9199" strokeWidth={0.4} />
      <Path d={`M${-hw + 3} ${subFront + 0.35} Q0 ${subFront + 1.75} ${hw - 3} ${subFront + 0.35}`} fill="none" stroke="#23252a" strokeWidth={0.4} strokeDasharray="0.4 0.4" />
      <Rect x={-hw} y={-hh} width={hw * 2} height={hh + subFront} rx={1} fill="#1d1f24" stroke={EDGE} strokeWidth={0.6} />
      <Rect x={-hw + 0.6} y={-hh + 0.6} width={hw * 2 - 1.2} height={hh + subFront - 1.2} rx={0.7} fill="#26282d" />
      <Rect x={-hw - 0.1} y={-2.6} width={1} height={4} rx={0.4} fill="#050506" />
      <Rect x={hw - 0.9} y={-2.6} width={1} height={4} rx={0.4} fill="#050506" />
      {[
        [-hw + 2.4, -hh + 2.4],
        [hw - 2.4, -hh + 2.4],
        [-hw + 2.4, subFront - 2.4],
        [hw - 2.4, subFront - 2.4],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={0.85} fill="#131418" stroke="#3d4148" strokeWidth={0.3} />
      ))}
      {/* the top box: its shadow on the sub, its grille, its tapered top
          with the carry handle let into it */}
      <Polygon points={box} fill="rgba(0,0,0,0.45)" transform="translate(0.7 1)" />
      <Path d={`M-6.7 ${boxFront - 0.2} Q0 ${boxFront + 2.6} 6.7 ${boxFront - 0.2} Z`} fill="#4a4e56" stroke="#8d9199" strokeWidth={0.4} />
      <Path d={`M-4.6 ${boxFront + 0.3} Q0 ${boxFront + 1.3} 4.6 ${boxFront + 0.3}`} fill="none" stroke="#23252a" strokeWidth={0.35} strokeDasharray="0.4 0.4" />
      <Polygon points={box} fill="#2e3138" stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round" />
      <Line x1={-6.2} y1={boxFront - 0.5} x2={6.2} y2={boxFront - 0.5} stroke="#4a4e56" strokeWidth={0.4} />
      <Rect x={-2.5} y={boxRear + 2.2} width={5} height={1.5} rx={0.7} fill="#0b0b0d" stroke="#4d5159" strokeWidth={0.35} />
    </G>
  );
}

/** A sidefill: a three-way trapezoid cabinet on its subwoofer. */
function SidefillTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT.sidefill;
  const front = hh - 1.5; // the baffle; the grille bows out to hh
  const rear = front - 24; // 749 mm deep
  const rearHw = 6.7; // 419 mm at the rear, 670 mm at the front
  const box = `${-hw},${front} ${hw},${front} ${rearHw},${rear} ${-rearHw},${rear}`;
  // a point on the right side wall at depth y, moved in by `inset`
  const side = (y: number, inset: number) => hw - ((hw - rearHw) * (front - y)) / (front - rear) - inset;
  const trackA = front - 4.4;
  const trackB = front - 20;
  return (
    <G>
      <Rect x={-hw + 0.8} y={rear + 1.2} width={hw * 2} height={front - rear} rx={0.8} fill={SHADOW} />
      {/* the subwoofer under it: only its rear corners show past the taper */}
      <Rect x={-hw} y={rear} width={hw * 2} height={front - rear} rx={0.8} fill="#1d1f24" stroke={EDGE} strokeWidth={0.6} />
      <Polygon points={box} fill="rgba(0,0,0,0.5)" transform="translate(0.7 1)" />
      {/* the full-range cabinet: grille, tapered top, the two flying tracks
          let into the top along the side walls, the side handles */}
      <Path d={`M${-hw + 0.4} ${front - 0.2} Q0 ${front + 3.2} ${hw - 0.4} ${front - 0.2} Z`} fill="#4a4e56" stroke="#8d9199" strokeWidth={0.4} />
      <Path d={`M${-hw + 2.6} ${front + 0.35} Q0 ${front + 1.75} ${hw - 2.6} ${front + 0.35}`} fill="none" stroke="#23252a" strokeWidth={0.4} strokeDasharray="0.4 0.4" />
      <Polygon points={box} fill="#2a2c31" stroke={EDGE} strokeWidth={0.6} strokeLinejoin="round" />
      <Line x1={-hw + 0.9} y1={front - 0.55} x2={hw - 0.9} y2={front - 0.55} stroke="#4a4e56" strokeWidth={0.4} />
      {[1, -1].map((s) => (
        <G key={s}>
          <Line x1={s * side(trackA, 2.3)} y1={trackA} x2={s * side(trackB, 2.3)} y2={trackB} stroke="#9aa0a8" strokeWidth={1.1} />
          <Line x1={s * side(trackA, 2.3)} y1={trackA} x2={s * side(trackB, 2.3)} y2={trackB} stroke="#23252a" strokeWidth={0.4} strokeDasharray="0.5 0.33" />
          <Line x1={s * side(front - 10, 0.15)} y1={front - 10} x2={s * side(front - 13.6, 0.15)} y2={front - 13.6} stroke="#050506" strokeWidth={0.9} strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

/** An equipment rack in its road case, lids on. */
function RackTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT.rack;
  const seam = hh - 2.1; // each lid is 65 mm deep
  return (
    <G>
      <Rect x={-hw + 0.8} y={-hh + 1.2} width={hw * 2} height={hh * 2} rx={1} fill={SHADOW} />
      {/* laminate inside the aluminum edging */}
      <Rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} rx={1} fill="#1b1c20" stroke={EDGE} strokeWidth={0.6} />
      <Rect x={-hw + 0.55} y={-hh + 0.55} width={hw * 2 - 1.1} height={hh * 2 - 1.1} rx={0.6} fill="#23252a" stroke="#8d9199" strokeWidth={0.55} />
      {/* the two lid seams: aluminum tongue and groove, the joint between */}
      {[-seam, seam].map((y) => (
        <G key={y}>
          <Line x1={-hw + 0.5} y1={y} x2={hw - 0.5} y2={y} stroke="#8d9199" strokeWidth={0.8} />
          <Line x1={-hw + 0.5} y1={y} x2={hw - 0.5} y2={y} stroke={EDGE} strokeWidth={0.2} />
          {/* a recessed butterfly latch near each end of the seam */}
          {[-4.5, 4.5].map((x) => (
            <G key={x}>
              <Rect x={x - 1.3} y={y - (y < 0 ? 0.7 : 1.9)} width={2.6} height={2.6} rx={0.3} fill="#5a5f68" stroke={EDGE} strokeWidth={0.3} />
              <Path d={`M${x - 0.55} ${y + (y < 0 ? 0.6 : -0.6) - 0.95} h1.1 L${x} ${y + (y < 0 ? 0.6 : -0.6)} Z M${x - 0.55} ${y + (y < 0 ? 0.6 : -0.6) + 0.95} h1.1 L${x} ${y + (y < 0 ? 0.6 : -0.6)} Z`} fill="#c9c6bc" />
              <Circle cx={x} cy={y + (y < 0 ? 0.6 : -0.6)} r={0.32} fill="#8d9199" stroke={EDGE} strokeWidth={0.15} />
            </G>
          ))}
        </G>
      ))}
      {/* a ball corner on each corner */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy], i) => (
        <G key={i}>
          <Rect x={sx > 0 ? hw - 2.3 : -hw} y={sy > 0 ? hh - 2.3 : -hh} width={2.3} height={2.3} rx={0.7} fill="#9aa0a8" stroke={EDGE} strokeWidth={0.3} />
          <Circle cx={sx * (hw - 0.95)} cy={sy * (hh - 0.95)} r={0.8} fill="#c9c6bc" stroke="#5a5f68" strokeWidth={0.25} />
        </G>
      ))}
    </G>
  );
}

/** A power location: a rubber quad box on its cable. */
function PowerTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT.power;
  // the cable: out of the box's cord grip, once round the place the tag is
  // printed (a loop of slack, the strand crossing itself), and away past
  // the edge
  const cable = `M1.3 4.4 C0.5 4.4 0.3 3.7 -0.6 3.7 A4.5 4.5 0 0 1 -0.6 -5.3 A4.2 4.2 0 0 1 -0.6 3.1 C-2.4 3.1 -4 4.3 ${-hw} 4.6`;
  const bx = hw - 3.8; // the box: 120 × 107 mm
  const by = hh - 3.4;
  const outlet = (cx: number, cy: number) => `M${cx - 0.2} ${cy - 0.42} v0.34 M${cx + 0.2} ${cy - 0.42} v0.34`;
  return (
    <G>
      <Path d={cable} fill="none" stroke={SHADOW} strokeWidth={1} transform="translate(0.5 0.7)" />
      <Path d={cable} fill="none" stroke={EDGE} strokeWidth={1} />
      <Path d={cable} fill="none" stroke="#565a63" strokeWidth={0.55} />
      {/* the box: molded rubber, the cord grip at its end */}
      <Rect x={bx + 0.4} y={by + 0.6} width={3.8} height={3.4} rx={0.6} fill={SHADOW} />
      <Rect x={bx - 1} y={by + 1.2} width={1.1} height={1} rx={0.3} fill="#15161a" stroke={EDGE} strokeWidth={0.3} />
      <Rect x={bx} y={by} width={3.8} height={3.4} rx={0.6} fill="#23252a" stroke={EDGE} strokeWidth={0.5} />
      <Rect x={bx + 0.3} y={by + 0.3} width={3.2} height={2.8} rx={0.4} fill="none" stroke="#4a4e56" strokeWidth={0.25} />
      {/* its two duplex outlets, side by side */}
      {[bx + 1.08, bx + 2.72].map((cx) => (
        <G key={cx}>
          <Rect x={cx - 0.55} y={by + 0.6} width={1.1} height={2.2} rx={0.25} fill="#9aa0a8" stroke={EDGE} strokeWidth={0.2} />
          <Path d={outlet(cx, by + 1.25) + outlet(cx, by + 2.3)} stroke="#15161a" strokeWidth={0.14} />
          <Circle cx={cx} cy={by + 1.42} r={0.11} fill="#15161a" />
          <Circle cx={cx} cy={by + 2.47} r={0.11} fill="#15161a" />
        </G>
      ))}
    </G>
  );
}

/** An orchestra chair: the sitter faces the audience. */
function ChairTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT.chair;
  const seat = 'M-4 -3.9 H4 Q5.5 -3.9 5.55 -2.4 L5.95 4.2 Q6 5.9 4.3 5.9 H-4.3 Q-6 5.9 -5.95 4.2 L-5.55 -2.4 Q-5.5 -3.9 -4 -3.9 Z';
  const back = 'M-6.3 -4.9 Q0 -7.7 6.3 -4.9 L5.9 -3.7 Q0 -6.3 -5.9 -3.7 Z';
  const feet: [number, number][] = [
    [-hw + 0.6, hh - 0.6],
    [hw - 0.6, hh - 0.6],
    [-hw + 0.5, -hh + 0.5],
    [hw - 0.5, -hh + 0.5],
  ];
  return (
    <G>
      <Path d={seat} fill={SHADOW} transform="translate(0.8 1.2)" />
      <Path d={back} fill={SHADOW} transform="translate(0.8 1.2)" />
      {/* the four legs running out from under the seat to their glides */}
      {feet.map(([fx, fy], i) => (
        <G key={i}>
          <Line x1={fx * 0.78} y1={fy > 0 ? 4.8 : -3.2} x2={fx} y2={fy} stroke="#8d9199" strokeWidth={0.8} strokeLinecap="round" />
          <Circle cx={fx} cy={fy} r={0.5} fill="#15161a" stroke="#565a63" strokeWidth={0.2} />
        </G>
      ))}
      {/* the seat and its pad */}
      <Path d={seat} fill="#2a2c31" stroke={EDGE} strokeWidth={0.5} strokeLinejoin="round" />
      <Rect x={-4.5} y={-2.7} width={9} height={7.4} rx={2.2} fill="#3a3d44" />
      <Path d="M-4.2 5.2 H4.2" stroke="#4a4e56" strokeWidth={0.3} strokeLinecap="round" />
      {/* the backrest, curved round the sitter's back */}
      <Path d={back} fill="#34373e" stroke={EDGE} strokeWidth={0.45} strokeLinejoin="round" />
      <Path d="M-5.6 -4.75 Q0 -7.2 5.6 -4.75" fill="none" stroke="#565a63" strokeWidth={0.3} strokeLinecap="round" />
    </G>
  );
}

/** A music stand: the desk leaning back over its tripod. */
function MusicStandTop() {
  const { hw, hh } = TOP_ART_GEAR_EXTENT['music-stand'];
  const pole: [number, number] = [0, 1];
  const feet: [number, number][] = [
    [0, -hh + 0.5],
    [-5.1, 3.9],
    [5.1, 3.9],
  ];
  const lipTop = -3.3; // the lip's edge, on the player's side
  const lipBottom = -1.6; // where the lip meets the desk
  const deskTop = 1.9; // the desk's top edge, toward the audience
  return (
    <G>
      {/* the tripod: three legs from the pole to their rubber feet */}
      {feet.map(([fx, fy], i) => (
        <Line key={`s${i}`} x1={pole[0] + 0.5} y1={pole[1] + 0.7} x2={fx + 0.5} y2={fy + 0.7} stroke={SHADOW} strokeWidth={1} strokeLinecap="round" />
      ))}
      {feet.map(([fx, fy], i) => (
        <G key={i}>
          <Line x1={pole[0]} y1={pole[1]} x2={fx} y2={fy} stroke="#7b808a" strokeWidth={0.85} strokeLinecap="round" />
          <Circle cx={fx} cy={fy} r={0.5} fill="#15161a" stroke="#565a63" strokeWidth={0.2} />
        </G>
      ))}
      <Circle cx={pole[0]} cy={pole[1]} r={1.1} fill="#2a2c31" stroke="#9aa0a8" strokeWidth={0.4} />
      {/* the desk, seen from above as a band: the lip (a shelf, catching the
          light) on the player's side, the leaning desk face behind it */}
      <Rect x={-hw + 0.8} y={lipTop + 1.2} width={hw * 2} height={deskTop - lipTop} rx={0.3} fill={SHADOW} />
      <Rect x={-hw} y={lipBottom - 0.2} width={hw * 2} height={deskTop - lipBottom + 0.2} rx={0.3} fill="#2a2c31" stroke={EDGE} strokeWidth={0.5} />
      <Line x1={-hw + 0.5} y1={deskTop - 0.4} x2={hw - 0.5} y2={deskTop - 0.4} stroke="#565a63" strokeWidth={0.3} />
      <Rect x={-hw} y={lipTop} width={hw * 2} height={lipBottom - lipTop} rx={0.3} fill="#454850" stroke={EDGE} strokeWidth={0.5} />
      <Line x1={-hw + 0.5} y1={lipTop + 0.4} x2={hw - 0.5} y2={lipTop + 0.4} stroke="#7b808a" strokeWidth={0.3} />
    </G>
  );
}

export const TOP_ART_GEAR: TopArtMap = {
  playback: PlaybackTop,
  iem: IemTop,
  'drum-fill': DrumFillTop,
  sidefill: SidefillTop,
  rack: RackTop,
  power: PowerTop,
  chair: ChairTop,
  'music-stand': MusicStandTop,
};
