/**
 * gainGear — the Gain Staging Lab's stages drawn as the REAL gear they are
 * (art fix 2026-10-16, after the lab-art grading: "each stage is a generic
 * line icon … no preamp, console or interface is drawn").
 *
 * A console channel IS the chain this lab teaches, top to bottom: the input
 * section's GAIN knob, the EQ, the dynamics, the channel fader, the group
 * (bus) fader, the master fader — then the monitors. So every processing
 * stage is drawn as the matching SECTION of a channel strip, face-on, with
 * its control at the position the module has set:
 *
 *   SOURCE   the house vocal mic on its stand (soundsystems gearArt, drawn in
 *            millimetres — head Ø51, body 162 mm)
 *   PREAMP   input section: the XLR input socket, 48V + Ø buttons, the red
 *            GAIN knob, SIG / PEAK LEDs. The mic's own cable (MicCableRun)
 *            runs from its tail along the floor and plugs into that socket
 *            (wiring round 2, GN-R2-03, owner-approved art 2026-10-20)
 *   EQ       three gain knobs, HF / MID / LF; the MID carries the stage's boost
 *   COMP     gain-reduction LED ladder + THRESHOLD and OUTPUT knobs (the
 *            lab's COMPRESSOR OUTPUT, ±12 dB — bipolar, centre detent)
 *   FADER    the channel fader, cap on the console taper (faderDbToFrac)
 *   BUS      the group fader (blue cap) with its lit assign button
 *   OUTPUT   the red-capped master fader feeding a 2-way POWERED nearfield
 *            monitor (cabinet 1 : 1.6, the 180 × 290 mm class) by a line lead
 *            from the strip's output jack down and round behind the cabinet
 *            to its rear input (GN-R2-04). A stage whose range
 *            runs past +12 dB (no console fader does) is drawn as an OUTPUT
 *            LEVEL knob instead (audio review 2026-10-16).
 *
 * Every knob is a 270° pot (−135° … +135°, centre detent at 12 o'clock for
 * a ±dB control), so the drawn position is the module's real value. A
 * HIDDEN stage (the Troubleshoot challenge) is drawn dark and with no knob
 * pointer or fader cap: the challenge is to find the fault by measuring,
 * and a visible knob would hand over the answer. No text is drawn on the
 * gear (labels never on objects; the stage name sits under it).
 */
import { useRef } from 'react';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { GearInSvg } from '../soundsystems/art/gearArt';
import { faderDbToFrac } from '../kit/gear';
import { LOW_EDGE, type ChainNode } from './gainEngine';

/** The gear's drawing box (viewBox units). Drawn at GEAR_H × GEAR_ASPECT. */
export const GEAR_VB_W = 36;
export const GEAR_VB_H = 40;
export const GEAR_ASPECT = GEAR_VB_W / GEAR_VB_H;

const PANEL_EDGE = '#30343c';
const GROOVE = '#07080a';
const TICK = '#6c707a';

let seq = 0;

/** One knob: a 270° pot. `frac` 0..1 maps to −135°…+135° from 12 o'clock;
 *  null = no pointer (a hidden stage). */
function Knob({ id, cx, cy, r, frac, cap, detent }: { id: string; cx: number; cy: number; r: number; frac: number | null; cap: string; detent?: boolean }) {
  const ticks = [];
  for (let k = 0; k <= 10; k++) {
    const a = ((-135 + 27 * k) * Math.PI) / 180;
    const r1 = r + 1.1;
    const r2 = r + (k === 0 || k === 10 || (detent && k === 5) ? 2.6 : 1.9);
    ticks.push(<Line key={k} x1={cx + Math.sin(a) * r1} y1={cy - Math.cos(a) * r1} x2={cx + Math.sin(a) * r2} y2={cy - Math.cos(a) * r2} stroke={detent && k === 5 ? '#b8bcc6' : TICK} strokeWidth={0.55} />);
  }
  const a = frac == null ? 0 : ((-135 + 270 * Math.max(0, Math.min(1, frac))) * Math.PI) / 180;
  return (
    <G>
      {ticks}
      {/* skirt, body, coloured cap */}
      <Circle cx={cx} cy={cy + 0.5} r={r} fill="#000" opacity={0.45} />
      <Circle cx={cx} cy={cy} r={r} fill={`url(#${id}-knob)`} stroke="#050506" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={r * 0.55} fill={cap} opacity={0.92} />
      <Circle cx={cx - r * 0.18} cy={cy - r * 0.2} r={r * 0.22} fill="#fff" opacity={0.12} />
      {frac == null ? null : (
        <Line x1={cx + Math.sin(a) * r * 0.2} y1={cy - Math.cos(a) * r * 0.2} x2={cx + Math.sin(a) * r * 0.92} y2={cy - Math.cos(a) * r * 0.92} stroke="#f4f4f6" strokeWidth={Math.max(0.8, r * 0.16)} strokeLinecap="round" />
      )}
    </G>
  );
}

/** A long-throw fader: groove, scale ticks (unity emphasised), and the cap
 *  at the console taper position. `capColor` follows console convention:
 *  grey = channel, blue = group, red = master. */
function Fader({ x, y0, y1, db, capColor, showCap }: { x: number; y0: number; y1: number; db: number; capColor: string; showCap: boolean }) {
  const len = y1 - y0;
  // Clamped: a value past the fader's +12 dB top is never drawn off the groove.
  const yAt = (d: number) => y1 - Math.max(0, Math.min(1, faderDbToFrac(d))) * len;
  const capY = yAt(db);
  return (
    <G>
      {[12, 0, -10, -20, -40].map((t) => (
        <Line key={t} x1={x - 5.2} y1={yAt(t)} x2={x - (t === 0 ? 2.2 : 3.2)} y2={yAt(t)} stroke={t === 0 ? '#b8bcc6' : TICK} strokeWidth={t === 0 ? 0.8 : 0.5} />
      ))}
      <Rect x={x - 1.1} y={y0} width={2.2} height={len} rx={1.1} fill={GROOVE} stroke="#1c1e23" strokeWidth={0.4} />
      {showCap ? (
        <G>
          <Rect x={x - 6} y={capY - 2.9 + 0.8} width={12} height={5.8} rx={1.1} fill="#000" opacity={0.5} />
          <Rect x={x - 6} y={capY - 2.9} width={12} height={5.8} rx={1.1} fill={capColor} stroke="#0b0b0d" strokeWidth={0.4} />
          <Rect x={x - 6} y={capY - 2.9} width={12} height={1.6} rx={0.8} fill="#fff" opacity={0.16} />
          <Line x1={x - 5} y1={capY} x2={x + 5} y2={capY} stroke="#f4f4f6" strokeWidth={0.7} />
        </G>
      ) : null}
    </G>
  );
}

/** An LED: lit colour or a dark lens. */
function Led({ cx, cy, on, color, r = 1.5 }: { cx: number; cy: number; on: boolean; color: string; r?: number }) {
  return (
    <G>
      {on ? <Circle cx={cx} cy={cy} r={r * 2.1} fill={color} opacity={0.22} /> : null}
      <Circle cx={cx} cy={cy} r={r} fill={on ? color : '#1d1f24'} stroke="#050506" strokeWidth={0.35} />
    </G>
  );
}

/** A square console button (48V, Ø, assign). */
function Button({ x, y, s = 4.2, lit }: { x: number; y: number; s?: number; lit?: string | null }) {
  return (
    <G>
      <Rect x={x} y={y} width={s} height={s} rx={0.7} fill={lit ?? '#2a2d34'} stroke="#060607" strokeWidth={0.35} opacity={lit ? 0.95 : 1} />
      <Rect x={x + 0.5} y={y + 0.4} width={s - 1} height={0.9} rx={0.4} fill="#fff" opacity={0.14} />
    </G>
  );
}

/** The channel-strip section a stage lives in: a brushed dark panel, face-on,
 *  with the section seams a real strip has between its blocks. */
function Section({ id, x = 4, w = 28 }: { id: string; x?: number; w?: number }) {
  return (
    <G>
      <Rect x={x} y={0.5} width={w} height={39} rx={2.2} fill={`url(#${id}-panel)`} stroke={PANEL_EDGE} strokeWidth={0.6} />
      <Line x1={x + 1.5} y1={1.6} x2={x + w - 1.5} y2={1.6} stroke="#fff" strokeWidth={0.4} opacity={0.08} />
    </G>
  );
}

function Defs2({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={`${id}-panel`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#23262d" />
        <Stop offset="1" stopColor="#131519" />
      </LinearGradient>
      <RadialGradient id={`${id}-knob`} cx="0.38" cy="0.32" r="0.75">
        <Stop offset="0" stopColor="#4a4e57" />
        <Stop offset="0.7" stopColor="#1e2026" />
        <Stop offset="1" stopColor="#0d0e11" />
      </RadialGradient>
      <LinearGradient id={`${id}-cab`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#30333a" />
        <Stop offset="1" stopColor="#15171b" />
      </LinearGradient>
      <RadialGradient id={`${id}-cone`} cx="0.42" cy="0.38" r="0.7">
        <Stop offset="0" stopColor="#3a3d44" />
        <Stop offset="1" stopColor="#0b0c0e" />
      </RadialGradient>
    </Defs>
  );
}

/** Where a gain setting sits on its control, 0..1 (null = no setting known). */
function gainFrac(node: ChainNode): number | null {
  if (node.gain == null || node.gainMin == null || node.gainMax == null || node.gainMax <= node.gainMin) return null;
  return (node.gain - node.gainMin) / (node.gainMax - node.gainMin);
}

/** A ±dB control's position with 0 dB at the 12 o'clock detent. */
function bipolarFrac(node: ChainNode): number | null {
  if (node.gain == null) return null;
  const span = Math.max(Math.abs(node.gainMin ?? -12), Math.abs(node.gainMax ?? 12), 1);
  return 0.5 + node.gain / (2 * span);
}

export function StageGear({ node, w, h, hidden }: { node: ChainNode; w: number; h: number; hidden?: boolean }) {
  const idRef = useRef<string | null>(null);
  if (idRef.current == null) idRef.current = `sg${(seq = (seq + 1) % 100000)}`;
  const id = idRef.current;
  const show = !hidden;
  let body: React.ReactNode = null;
  switch (node.kind) {
    case 'source':
      // The house vocal mic on its stand, true proportions (gearArt, mm).
      body = <GearInSvg kind="vocalMic" id={`${id}-mic`} x={18} y={20} size={40} dim={hidden} />;
      break;
    case 'preamp':
      body = (
        <G>
          <Section id={id} />
          {/* the XLR input socket, top left (the mic's plug seats in it —
              MicCableRun draws the plug and its cable) */}
          <XlrSocket cx={XLR_IN.x} cy={XLR_IN.y} dim={!show} />
          {/* 48V (off: a dynamic mic needs none) and Ø */}
          <Button x={16.4} y={4} />
          <Button x={23.3} y={4} />
          <Knob id={id} cx={18} cy={19.5} r={7.6} frac={show ? gainFrac(node) : null} cap="#c4372a" />
          <Led cx={13} cy={34} on={show && node.level > LOW_EDGE} color="#3fae52" />
          {/* PEAK lights a few dB BEFORE clip, as on a real input section */}
          <Led cx={23} cy={34} on={show && (node.stageClipped || node.level >= -3)} color="#ff3b2a" />
        </G>
      );
      break;
    case 'eq':
    case 'processor':
      body = (
        <G>
          <Section id={id} />
          <Knob id={id} cx={18} cy={8.5} r={4.4} frac={show ? 0.5 : null} cap="#6a7385" detent />
          <Knob id={id} cx={18} cy={20} r={4.4} frac={show ? bipolarFrac(node) : null} cap="#2f8f63" detent />
          <Knob id={id} cx={18} cy={31.5} r={4.4} frac={show ? 0.5 : null} cap="#6a7385" detent />
        </G>
      );
      break;
    case 'comp':
      body = (
        <G>
          <Section id={id} />
          {/* gain-reduction ladder: dark — this chain models level, not
              compression, so no gain reduction is ever happening here */}
          {[0, 1, 2, 3, 4].map((k) => (
            <Rect key={k} x={8} y={7 + k * 5.6} width={4.2} height={3.4} rx={0.6} fill="#2a2216" stroke="#060607" strokeWidth={0.3} />
          ))}
          <Knob id={id} cx={23.5} cy={11} r={4.6} frac={show ? 0.55 : null} cap="#7c6a3a" />
          <Knob id={id} cx={23.5} cy={28} r={4.6} frac={show ? bipolarFrac(node) : null} cap="#b8892b" detent />
        </G>
      );
      break;
    case 'fader':
      body = (
        <G>
          <Section id={id} />
          <Fader x={20} y0={4.5} y1={35.5} db={node.gain ?? 0} capColor="#8d9099" showCap={show} />
        </G>
      );
      break;
    case 'bus':
      body = (
        <G>
          <Section id={id} />
          {/* assign button lit: this group feeds the mix */}
          <Button x={16} y={3} s={4} lit={show ? '#e2a930' : null} />
          <Fader x={20} y0={10.5} y1={36} db={node.gain ?? 0} capColor="#3e6fb8" showCap={show} />
        </G>
      );
      break;
    case 'output':
      body = (
        <G>
          <Section id={id} x={1} w={15} />
          {(node.gainMax ?? 0) > 12 ? (
            <Knob id={id} cx={8.5} cy={20} r={5} frac={show ? gainFrac(node) : null} cap="#c4372a" />
          ) : (
            <Fader x={10} y0={4.5} y1={35.5} db={node.gain ?? 0} capColor="#c4372a" showCap={show} />
          )}
          {/* the line lead: a plug in the strip's output jack, down to the
              floor and round behind the cabinet to the monitor's rear input
              (drawn first, so the cabinet hides its far end) */}
          <G opacity={hidden ? 0.5 : 1}>
            <Path d="M 17.2 30.6 C 18.9 30.6 18.4 36.9 20.6 37.4 L 23.4 37.4 C 24.6 37.4 24.9 35.4 24.9 32" stroke="#3a3e46" strokeWidth={1.5} fill="none" strokeLinecap="round" />
            <Path d="M 17.2 30.6 C 18.9 30.6 18.4 36.9 20.6 37.4 L 23.4 37.4 C 24.6 37.4 24.9 35.4 24.9 32" stroke="#0d0e10" strokeWidth={0.9} fill="none" strokeLinecap="round" />
            <Rect x={15.6} y={29.8} width={1.9} height={1.6} rx={0.4} fill="#a7aeb8" stroke="#000" strokeWidth={0.25} />
          </G>
          {/* 2-way powered nearfield monitor, cabinet 1 : 1.6 (180 × 290 mm class) */}
          <G opacity={hidden ? 0.5 : 1}>
            <Rect x={19.6} y={9.5} width={14.2} height={22.7} rx={1.6} fill={`url(#${id}-cab)`} stroke="#060607" strokeWidth={0.5} />
            <Circle cx={26.7} cy={14.2} r={2.3} fill="#0b0c0e" stroke="#4a4e57" strokeWidth={0.5} />
            <Circle cx={26.7} cy={14.2} r={0.9} fill="#8b8f97" opacity={0.7} />
            <Circle cx={26.7} cy={24.6} r={5.4} fill="#0b0c0e" stroke="#4a4e57" strokeWidth={0.6} />
            <Circle cx={26.7} cy={24.6} r={4.3} fill={`url(#${id}-cone)`} />
            <Circle cx={26.7} cy={24.6} r={1.4} fill="#2a2d33" />
            <Path d="M 21.2 11 L 21.2 30.8" stroke="#fff" strokeWidth={0.4} opacity={0.08} />
          </G>
        </G>
      );
      break;
  }
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${GEAR_VB_W} ${GEAR_VB_H}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs2 id={id} />
      {/* A hidden stage is dimmed over an OPAQUE backing, so the signal-path
          line behind the gear never shows through it (review 2026-10-16). */}
      {hidden && node.kind !== 'source' ? <Rect x={node.kind === 'output' ? 1 : 4} y={0.5} width={node.kind === 'output' ? 33 : 28} height={39} rx={2.2} fill="#141519" /> : null}
      <G opacity={hidden && node.kind !== 'source' ? 0.5 : 1}>{body}</G>
    </Svg>
  );
}

/** The preamp's XLR input socket, face-on: a female panel socket (metal
 *  ring, latch tab above). */
function XlrSocket({ cx, cy, dim }: { cx: number; cy: number; dim?: boolean }) {
  return (
    <G opacity={dim ? 0.6 : 1}>
      <Rect x={cx - 0.9} y={cy - XLR_R - 1.3} width={1.8} height={1.2} rx={0.3} fill="#a7aeb8" />
      <Circle cx={cx} cy={cy} r={XLR_R} fill="#08090b" stroke="#a7aeb8" strokeWidth={0.6} />
    </G>
  );
}

/** Where the preamp's XLR input socket sits (gear viewBox units). */
export const XLR_IN = { x: 9.6, y: 6 };
const XLR_R = 2.9;
/** Where the vocal mic's own drawn cable (gearArt) reaches the floor, in the
 *  source gear's viewBox: the mic drawing's cable end (36.6, 58.6) through
 *  GearInSvg(x 18, y 20, size 40) = 0.625 × p − (2, 0). */
const MIC_CABLE_END = { x: 20.875, y: 36.625 };
const FLOOR_Y = 37.9;

/** The mic → preamp XLR cable as ONE lane (GN-R2-03, owner-approved art
 *  2026-10-20): it picks up where the mic drawing's cable meets the floor,
 *  runs along the floor past the link, climbs the preamp's left edge and
 *  ends in the plug seated in the input section's XLR socket. Drawn over
 *  both gear boxes by the caller (ChainStage), so `span` is the distance
 *  from the source gear's left edge to the preamp gear's left edge, in the
 *  same units as gearW/gearH; `chevronX` (same units, from the same edge)
 *  is the middle of the link between them, where the run's direction
 *  chevron sits on the floor run. */
export function MicCableRun({ gearW, gearH, span, chevronX, hot, dim }: { gearW: number; gearH: number; span: number; chevronX: number; hot: boolean; dim?: boolean }) {
  const k = gearH / GEAR_VB_H;
  const x1 = span / k;
  const px = x1 + XLR_IN.x;
  const py = XLR_IN.y;
  const cx = chevronX / k;
  const up = x1 + 2.1; // the climb, in the preamp box's free left margin
  const d =
    `M ${MIC_CABLE_END.x} ${MIC_CABLE_END.y} C ${MIC_CABLE_END.x + 1.3} ${FLOOR_Y - 0.4} ${MIC_CABLE_END.x + 2.4} ${FLOOR_Y} ${MIC_CABLE_END.x + 4} ${FLOOR_Y} ` +
    `L ${up - 1.6} ${FLOOR_Y} C ${up - 0.3} ${FLOOR_Y} ${up} ${FLOOR_Y - 1} ${up} ${FLOOR_Y - 2.6} ` +
    `L ${up} ${py + 3.4} C ${up} ${py + 1.2} ${px - 3.6} ${py} ${px - 1.8} ${py}`;
  const core = hot ? '#5a1810' : '#0d0e10';
  return (
    <Svg width={span + gearW} height={gearH} viewBox={`0 0 ${x1 + GEAR_VB_W} ${GEAR_VB_H}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <G opacity={dim ? 0.5 : 1}>
        <Path d={d} stroke="#3a3e46" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={d} stroke={core} strokeWidth={0.95} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* the XLR plug seated in the socket, seen end-on: boot + shell */}
        <Circle cx={px} cy={py} r={2.4} fill="#1b1d22" stroke="#000" strokeWidth={0.35} />
        <Circle cx={px} cy={py} r={1.2} fill="#2a2d33" />
      </G>
      <Path d={`M ${cx - 1.6} ${FLOOR_Y - 2.3} L ${cx + 1.6} ${FLOOR_Y} L ${cx - 1.6} ${FLOOR_Y + 2.3}`} stroke={hot ? '#ff5f4e' : '#ffc64d'} strokeWidth={1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The link between two stages, at the gear's centre line: inside the
 *  console the signal path is the strip's printed flow line with its
 *  direction chevron. The first hop (mic → preamp) is the real XLR cable,
 *  drawn as one lane by MicCableRun along the floor (with its chevron), so
 *  its link draws nothing. */
export function StageLink({ w, h, cable, hot }: { w: number; h: number; cable: boolean; hot: boolean }) {
  const y = h / 2;
  const tone = hot ? '#ff5f4e' : '#7a6630';
  if (cable) return <Svg width={w} height={h} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Line x1={0} y1={y} x2={w} y2={y} stroke={tone} strokeWidth={1.3} />
      <Path d={`M ${w / 2 - 2} ${y - 3} L ${w / 2 + 2} ${y} L ${w / 2 - 2} ${y + 3}`} stroke={hot ? '#ff5f4e' : '#ffc64d'} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
