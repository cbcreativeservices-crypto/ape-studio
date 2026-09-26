/**
 * Sound Systems Lab — the teaching diagrams that put a page's text in
 * context (owner standard 2026-09-26: a visual should orient the learner
 * before the prose, and every control must change something visible).
 *
 *   ChannelStrip      · a channel drawn top-to-bottom like the real strip,
 *                       the pre and post tap points and where each send leaves
 *   FeedbackLoop      · a plan of performer, microphone, its polar pattern,
 *                       the wedge in or out of the null, and the loop
 *   PatchPanel        · the stagebox's output sockets and the bus on each
 *   StageboxStrip     · stagebox input LEDs over console channel meters —
 *                       the two readings a line check compares
 *   SplitDiagram      · analog split vs digital gain sharing, and what a
 *                       gain move at one console does to the other
 *   SubFeedRouter     · which channels reach the subwoofer under each feed
 *   ArrivalTimeline   · the mains' and the delays' arrivals at a back-row ear
 *
 * Pure react-native-svg. Tap targets carry accessibilityLabel (the one
 * accessibility prop rn-svg elements accept). Colours always pair with words.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { GearInSvg, INK } from './gearArt';
import { CABLE_COLORS } from './VenueView';

const W = 354;
/** Every word on a diagram, in diagram units. The diagrams are 354 wide and
 *  draw at ≥ 0.963 px per unit on a 375-wide phone (341 px of glass), so 9.6
 *  units is ≥ 9.2 pt — the floor the owner set on 2026-09-25. A diagram is
 *  sized so its height never makes the glass the limit instead. */
const FS = 9.6;

function Arrow({ x1, y1, x2, y2, color, dashed, width = 1.6 }: { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean; width?: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  const hx = x2 - ux * 4;
  const hy = y2 - uy * 4;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '3 3' : undefined} strokeLinecap="round" />
      <Polygon points={`${x2},${y2} ${hx - uy * 3},${hy + ux * 3} ${hx + uy * 3},${hy - ux * 3}`} fill={color} />
    </G>
  );
}

function Box({ x, y, w, h, label, on, tone = '#2b2f37', onPress, a11y, dashed }: { x: number; y: number; w: number; h: number; label: string; on?: boolean; tone?: string; onPress?: () => void; a11y?: string; dashed?: boolean }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={on ? '#0f1a22' : '#14161b'} stroke={on ? colors.cyanBright : tone} strokeWidth={on ? 1.4 : 0.9} strokeDasharray={dashed ? '3 2' : undefined} />
      <SvgText x={x + w / 2} y={y + h / 2 + FS * 0.36} fontSize={FS} fill={on ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>{label}</SvgText>
      {onPress ? <Rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} fill="transparent" onPress={onPress} accessibilityLabel={a11y ?? label} /> : null}
    </G>
  );
}

function Frame({ h, a11y, children }: { h: number; a11y: string; children: React.ReactNode }) {
  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" viewBox={`0 0 ${W} ${h}`} style={{ aspectRatio: W / h }}>
        <Rect x={0} y={0} width={W} height={h} rx={12} fill="#0e1015" stroke={colors.hairline} strokeWidth={0.8} />
        {children}
      </Svg>
    </View>
  );
}

/* ── 1 · the channel strip, top to bottom ────────────────────────────────── */

export type StripStation = 'input' | 'hpf' | 'eq' | 'insert' | 'fader' | 'sends' | 'assign' | 'direct';

export const STRIP_H = 246;

/** The strip is drawn as wide as the glass allows (354 × 246, aspect 1.44)
 *  so its words read at 9 pt on a phone. The explanatory sub-captions that
 *  used to sit under each block ("mic level → line level", "wedges — the
 *  fader cannot touch it"…) live in the selected station's card in the well
 *  (pagesRoute STATIONS), which already carries each of them. */
export function ChannelStrip({ selected, onTap }: { selected: StripStation; onTap: (s: StripStation) => void }) {
  const X = 16;
  const BW = 134;
  const BH = 20;
  const cx = X + BW / 2;
  const rows: { id: StripStation; y: number; label: string }[] = [
    { id: 'input', y: 6, label: 'INPUT · PREAMP GAIN' },
    { id: 'hpf', y: 34, label: 'HIGH-PASS 80–120 Hz' },
    { id: 'eq', y: 62, label: 'CHANNEL EQ' },
    { id: 'insert', y: 90, label: 'INSERT · THROUGH' },
    { id: 'fader', y: 138, label: 'FADER · PAN · MUTE' },
    { id: 'assign', y: 186, label: 'ASSIGN' },
  ];
  const line = (y1: number, y2: number) => <Line x1={cx} y1={y1} x2={cx} y2={y2} stroke={CABLE_COLORS.line} strokeWidth={2} />;
  const sel = (id: StripStation) => selected === id;
  const preY = 124;
  const postY = 172;
  const RX = 198;
  const RW = 140;
  return (
    <Frame h={STRIP_H} a11y="A channel strip in signal order from the top: input and preamp gain, high-pass filter, channel EQ, insert, then the pre-fader tap point where monitor sends leave, the fader with pan and mute, the post-fader tap point where effects sends and the direct output leave, and the assignment to the main bus or a group. Tap a block to read about it.">
      {line(26, 34)}
      {line(54, 62)}
      {line(82, 90)}
      {line(110, 138)}
      {line(158, 186)}
      {line(206, 212)}
      {rows.map((r) => (
        <Box key={r.id} x={X} y={r.y} w={BW} h={BH} label={r.label} on={sel(r.id)} onPress={() => onTap(r.id)} a11y={`${r.label}${sel(r.id) ? ', selected' : ''}`} />
      ))}
      {/* the two tap points */}
      <Circle cx={cx} cy={preY} r={4} fill="#0e1015" stroke={sel('sends') ? colors.cyanBright : CABLE_COLORS.line} strokeWidth={1.4} />
      <SvgText x={cx - 9} y={preY + 3.4} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={1}>PRE</SvgText>
      <Circle cx={cx} cy={postY} r={4} fill="#0e1015" stroke={sel('sends') || sel('direct') ? colors.cyanBright : CABLE_COLORS.line} strokeWidth={1.4} />
      <SvgText x={cx - 9} y={postY + 3.4} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={1}>POST</SvgText>
      {/* sends leave as copies */}
      <Arrow x1={cx + 4} y1={preY} x2={RX - 2} y2={preY} color={sel('sends') ? colors.cyanBright : CABLE_COLORS.line} />
      <Box x={RX} y={preY - 10} w={RW} h={BH} label="AUX 1–4 · PRE" on={sel('sends')} onPress={() => onTap('sends')} a11y={`Pre-fader aux sends to the wedges${sel('sends') ? ', selected' : ''}`} />
      <Arrow x1={cx + 4} y1={postY} x2={RX - 2} y2={postY} color={sel('sends') ? colors.cyanBright : CABLE_COLORS.line} />
      <Box x={RX} y={postY - 10} w={RW} h={BH} label="AUX 5 · POST" on={sel('sends')} onPress={() => onTap('sends')} a11y={`Post-fader aux send to the reverb${sel('sends') ? ', selected' : ''}`} />
      <Path d={`M ${cx + 4} ${postY + 2} C ${cx + 70} ${postY + 2} ${cx + 60} ${postY + 28} ${RX - 2} ${postY + 28}`} stroke={sel('direct') ? colors.cyanBright : CABLE_COLORS.line} strokeWidth={1.6} fill="none" strokeDasharray="3 3" />
      <Box x={RX} y={postY + 18} w={RW} h={BH} label="DIRECT OUT" on={sel('direct')} onPress={() => onTap('direct')} a11y={`Direct output${sel('direct') ? ', selected' : ''}`} dashed />
      {/* controls with no audio in them */}
      <Box x={RX} y={54} w={RW} h={BH + 4} label="DCA · MUTE GROUP" on={false} tone="#3a3f4a" dashed />
      <Arrow x1={RX} y1={72} x2={X + BW + 4} y2={146} color="#5a5f6a" dashed width={1.2} />
      {/* assignment outputs: one or the other */}
      <Line x1={X + 31} y1={212} x2={X + 103} y2={212} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Line x1={X + 31} y1={212} x2={X + 31} y2={218} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Line x1={X + 103} y1={212} x2={X + 103} y2={218} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Box x={X} y={218} w={62} h={BH} label="L/R MAIN" on={sel('assign')} onPress={() => onTap('assign')} a11y="Assigned direct to the main bus" />
      <Box x={X + 72} y={218} w={62} h={BH} label="GROUP" on={sel('assign')} onPress={() => onTap('assign')} a11y="Assigned to a subgroup, which then feeds main" />
    </Frame>
  );
}

/* ── 2 · the feedback loop, in plan ──────────────────────────────────────── */

const LOOP_H = 168;

/** Cardioid polar radius, 0..1, at `deg` off the front axis. */
const cardioid = (deg: number) => (1 + Math.cos((deg * Math.PI) / 180)) / 2;

export function FeedbackLoop({ wedge, ringing, sendDb, compact }: { wedge: 'null' | 'live'; ringing: boolean; sendDb: number; compact?: boolean }) {
  const H = compact ? 118 : LOOP_H;
  const S = compact ? 0.72 : 1;
  const mic = { x: 128 * S + (compact ? 10 : 0), y: 64 * S + 6 };
  const perf = { x: mic.x - 34 * S, y: mic.y };
  const R = 54 * S;
  // polar plot: front axis toward the performer (−x); θ measured from it
  const pts: string[] = [];
  for (let d = 0; d <= 360; d += 6) {
    const r = R * cardioid(d);
    const a = ((180 - d) * Math.PI) / 180; // θ = 0 → −x
    pts.push(`${mic.x + Math.cos(a) * r},${mic.y + Math.sin(a) * r}`);
  }
  const wedgeAt = wedge === 'null' ? { x: mic.x + 58 * S, y: mic.y, rot: -90 } : { x: mic.x + 24 * S, y: mic.y + 52 * S, rot: -150 };
  const loopColor = ringing ? colors.red : colors.textMuted;
  const con = { x: 286, y: compact ? 30 : 34 };
  const amp = { x: 286, y: compact ? 76 : 104 };
  return (
    <Frame h={H} a11y={`Plan view: the performer at the microphone, the microphone’s cardioid pattern drawn around it, the wedge ${wedge === 'null' ? 'directly behind the microphone in its null' : 'off to the side, inside the microphone’s live angle'}. The loop runs microphone to console to amplifier to wedge and through the air back to the microphone. ${ringing ? 'The loop is ringing.' : `Send at ${sendDb} dB; the loop is stable.`}`}>
      {/* polar pattern: live lobe amber, the null dark */}
      <Polygon points={pts.join(' ')} fill={colors.amber} opacity={0.12} stroke={colors.amber} strokeWidth={0.8} strokeOpacity={0.5} />
      <SvgText x={mic.x - R * 0.55} y={mic.y - R * 0.62} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>LIVE ANGLE</SvgText>
      <SvgText x={mic.x + 18 * S} y={mic.y + 16 * S} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>NULL</SvgText>
      {/* the performer: head + shoulders, from above */}
      <Circle cx={perf.x} cy={perf.y} r={6 * S} fill="none" stroke="#9aa3ad" strokeWidth={1.3} />
      <Path d={`M ${perf.x - 12 * S} ${perf.y + 12 * S} C ${perf.x - 12 * S} ${perf.y + 2 * S} ${perf.x + 12 * S} ${perf.y + 2 * S} ${perf.x + 12 * S} ${perf.y + 12 * S}`} fill="none" stroke="#9aa3ad" strokeWidth={1.3} />
      {/* the microphone, pointing at the performer */}
      <Line x1={mic.x + 14 * S} y1={mic.y} x2={mic.x - 4 * S} y2={mic.y} stroke={INK.metalHi} strokeWidth={3.2 * S} strokeLinecap="round" />
      <Circle cx={mic.x - 6 * S} cy={mic.y} r={4 * S} fill={INK.metalMid} stroke="#000" strokeWidth={0.5} />
      {/* the wedge */}
      <G transform={`translate(${wedgeAt.x} ${wedgeAt.y}) rotate(${wedgeAt.rot})`}>
        <Polygon points="-9,-7 9,-7 12,7 -12,7" fill="#2b2f37" stroke={ringing ? colors.red : '#000'} strokeWidth={0.9} />
        <Rect x={-11} y={4} width={22} height={3} fill="#0b0c0f" />
      </G>
      <SvgText x={wedgeAt.x} y={wedgeAt.y + 23} fontSize={FS} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>WEDGE</SvgText>
      {/* the loop: mic → console → amp → wedge → (air) → mic */}
      <Path d={`M ${mic.x + 14 * S} ${mic.y - 3} C ${mic.x + 60} ${mic.y - 40 * S} ${con.x - 60} ${con.y} ${con.x - 22} ${con.y}`} stroke={CABLE_COLORS.mic} strokeWidth={1.6} fill="none" />
      <GearInSvg kind="console" id="fl-con" x={con.x} y={con.y} size={compact ? 30 : 38} />
      <Line x1={con.x} y1={con.y + (compact ? 14 : 18)} x2={amp.x} y2={amp.y - (compact ? 12 : 16)} stroke={CABLE_COLORS.line} strokeWidth={1.6} />
      <GearInSvg kind="amp" id="fl-amp" x={amp.x} y={amp.y} size={compact ? 30 : 38} />
      <Path d={`M ${amp.x - 20} ${amp.y} C ${amp.x - 60} ${amp.y} ${wedgeAt.x + 40} ${wedgeAt.y + 10} ${wedgeAt.x + 12} ${wedgeAt.y + 4}`} stroke={CABLE_COLORS.speaker} strokeWidth={1.6} fill="none" />
      {/* the acoustic return: the part of the loop the room owns */}
      <Path d={`M ${wedgeAt.x - 10} ${wedgeAt.y - 4} C ${wedgeAt.x - 30} ${wedgeAt.y - 14 * S} ${mic.x + 20 * S} ${mic.y + 8 * S} ${mic.x + 4 * S} ${mic.y + 3}`} stroke={loopColor} strokeWidth={ringing ? 2 : 1.2} fill="none" strokeDasharray="2 3" />
      {ringing ? <Circle cx={mic.x - 6 * S} cy={mic.y} r={11 * S} fill="none" stroke={colors.red} strokeWidth={1.2} opacity={0.8} /> : null}
      {ringing ? <Circle cx={mic.x - 6 * S} cy={mic.y} r={18 * S} fill="none" stroke={colors.red} strokeWidth={0.8} opacity={0.45} /> : null}
      <SvgText x={W - 8} y={H - 6} fontSize={FS} fill={loopColor} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={0.6}>{ringing ? 'LOOP GAIN OVER UNITY — RINGING' : `LOOP STABLE · SEND ${sendDb > 0 ? '+' : ''}${sendDb} dB`}</SvgText>
    </Frame>
  );
}

/* ── 3 · the output patch panel ──────────────────────────────────────────── */

export type PatchSocket = { id: string; name: string; short: string; bus: string | null; ok: boolean | null };

export const PATCH_H = 160;

/** The patch at a readable size: each column is 44.9 units wide, so every
 *  word in it is one short line — the bus on the tape, OUT n, the
 *  destination split onto two lines at its "·" (PROC 1 / L). Whether a
 *  patch is right is the tape's colour AND a ✓ / ✗ on the cable; the words
 *  for it (PLAYS ITS FEED, WRONG FEED, UNPATCHED) are the bezel's FED FROM,
 *  the SOCKET list and the verdict lines in the well. */
export function PatchPanel({ sockets, active, onTap }: { sockets: readonly PatchSocket[]; active: string | null; onTap: (id: string) => void }) {
  const H = PATCH_H;
  const n = sockets.length;
  const gap = (W - 40) / n;
  return (
    <Frame h={H} a11y={`The stagebox's output sockets. ${sockets.map((s) => `${s.name}: ${s.bus ? `${s.bus}${s.ok ? ', correct' : ', wrong'}` : 'unpatched'}`).join('. ')}. Tap a socket to patch it.`}>
      <Rect x={12} y={30} width={W - 24} height={62} rx={3} fill="#1a1d24" stroke="#000" strokeWidth={0.8} />
      <SvgText x={20} y={43} fontSize={FS} fill={INK.tape} fontFamily={fonts.oswaldSemiBold} letterSpacing={1}>STAGEBOX · LINE OUTPUTS</SvgText>
      {sockets.map((s, i) => {
        const x = 20 + gap * (i + 0.5);
        const sel = active === s.id;
        const col = s.bus == null ? '#3a3f4a' : s.ok ? colors.greenBright : colors.red;
        const [dest, role] = s.short.split(' · ');
        return (
          <G key={s.id}>
            {/* the bus tape above the socket */}
            <Rect x={x - gap / 2 + 2} y={6} width={gap - 4} height={18} rx={2} fill={s.bus ? (s.ok ? '#0f2416' : '#241012') : '#101216'} stroke={sel ? colors.cyanBright : col} strokeWidth={sel ? 1.4 : 0.8} />
            <SvgText x={x} y={18.5} fontSize={FS} fill={s.bus ? col : colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle">{s.bus ? s.bus.toUpperCase() : '—'}</SvgText>
            {/* XLR out */}
            <Circle cx={x} cy={62} r={7} fill="#0a0b0d" stroke={sel ? colors.cyanBright : INK.amber} strokeWidth={sel ? 1.6 : 0.9} />
            <Circle cx={x - 2.6} cy={60.4} r={1.1} fill={INK.metalHi} />
            <Circle cx={x + 2.6} cy={60.4} r={1.1} fill={INK.metalHi} />
            <Circle cx={x} cy={65} r={1.1} fill={INK.metalHi} />
            <SvgText x={x} y={86} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle">{`OUT ${i + 1}`}</SvgText>
            {/* the cable down to its destination, marked right or wrong */}
            <Line x1={x} y1={92} x2={x} y2={116} stroke={s.bus ? CABLE_COLORS.line : '#2a2e38'} strokeWidth={s.bus ? 2 : 1} strokeDasharray={s.bus ? undefined : '2 3'} />
            {s.bus ? (
              <>
                <Circle cx={x} cy={104} r={6.5} fill="#0e1015" stroke={col} strokeWidth={0.9} />
                <SvgText x={x} y={107.4} fontSize={FS} fill={col} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">{s.ok ? '✓' : '✗'}</SvgText>
              </>
            ) : null}
            <Rect x={x - gap / 2 + 2} y={116} width={gap - 4} height={38} rx={3} fill={sel ? '#0f1a22' : '#14161b'} stroke={sel ? colors.cyanBright : '#2b2f37'} strokeWidth={sel ? 1.4 : 0.8} />
            <SvgText x={x} y={role ? 131 : 138} fontSize={FS} fill={sel ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.3}>{dest}</SvgText>
            {role ? <SvgText x={x} y={145} fontSize={FS} fill={sel ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.3}>{role}</SvgText> : null}
            <Rect x={x - gap / 2 + 1} y={4} width={gap - 2} height={H - 8} fill="transparent" onPress={() => onTap(s.id)} accessibilityLabel={`${s.name}: ${s.bus ? `patched from ${s.bus}${s.ok ? ', correct' : ', wrong'}` : 'unpatched'}${sel ? ', selected' : ''} — tap to choose its bus`} />
          </G>
        );
      })}
    </Frame>
  );
}

/* ── 4 · stagebox LEDs over console meters (the line check) ──────────────── */

export type LineReading = { id: string; short: string; led: boolean; meter: boolean; revealed: boolean };

export function StageboxStrip({ inputs, title = 'STAGEBOX INPUT LEDs', lower = 'CONSOLE CHANNEL METERS', selectedId }: { inputs: readonly LineReading[]; title?: string; lower?: string; /** The line under the probe (the dock's LINE fader) — drawn with a cyan frame. */ selectedId?: string | null }) {
  const H = 118;
  const n = inputs.length;
  const gap = (W - 40) / n;
  return (
    <Frame h={H} a11y={`${title} over ${lower}. ${inputs.map((r) => `${r.short}: ${r.revealed ? `stagebox LED ${r.led ? 'lit' : 'dark'}, channel meter ${r.meter ? 'moving' : 'flat'}` : 'not checked yet'}`).join('. ')}`}>
      <Rect x={12} y={17} width={W - 24} height={40} rx={3} fill="#1a1d24" stroke="#000" strokeWidth={0.8} />
      <SvgText x={16} y={13} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={0.8}>{title}</SvgText>
      <SvgText x={16} y={69} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={0.8}>{lower}</SvgText>
      {inputs.map((r, i) => {
        const x = 20 + gap * (i + 0.5);
        const led = r.revealed ? r.led : false;
        const sel = selectedId === r.id;
        return (
          <G key={r.id}>
            {sel ? <Rect x={x - gap / 2 + 1} y={20} width={gap - 2} height={H - 24} rx={3} fill={colors.cyanBright} opacity={0.08} stroke={colors.cyanBright} strokeWidth={0.8} /> : null}
            <Circle cx={x} cy={34} r={6} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.8} />
            <Circle cx={x} cy={23.5} r={2.4} fill={led ? INK.green : '#2a2d33'} stroke="#000" strokeWidth={0.4} />
            {led ? <Circle cx={x} cy={23.5} r={4.6} fill={INK.green} opacity={0.25} /> : null}
            <SvgText x={x} y={53} fontSize={FS} fill={INK.tape} fontFamily={fonts.mono} textAnchor="middle">{i + 1}</SvgText>
            {/* the channel meter */}
            <Rect x={x - 5} y={74} width={10} height={30} rx={1.5} fill="#050609" stroke="#1f2229" strokeWidth={0.6} />
            {r.revealed && r.meter ? (
              <>
                <Rect x={x - 3.5} y={86} width={7} height={16.5} rx={1} fill={colors.greenBright} opacity={0.9} />
                <Rect x={x - 3.5} y={82} width={7} height={4} rx={1} fill={colors.gold} opacity={0.9} />
              </>
            ) : r.revealed ? (
              <Rect x={x - 3.5} y={101} width={7} height={1.5} fill="#3a3f4a" />
            ) : (
              <SvgText x={x} y={93} fontSize={FS} fill="#4a505c" fontFamily={fonts.oswaldSemiBold} textAnchor="middle">?</SvgText>
            )}
            <SvgText x={x} y={114} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.2}>{r.short}</SvgText>
          </G>
        );
      })}
    </Frame>
  );
}

/* ── 5 · FOH / monitor split ─────────────────────────────────────────────── */

export function SplitDiagram({ mode, gainMove, gainDb = 6 }: { mode: 'analog' | 'digital'; gainMove: boolean; /** The size of the monitor engineer's gain move, dB (the dock fader). */ gainDb?: number }) {
  const H = 160;
  const foh = { x: 292, y: 44 };
  const mon = { x: 292, y: 120 };
  const mid = { x: 168, y: 82 };
  return (
    <Frame h={H} a11y={mode === 'analog' ? `Analog split: three microphones into a transformer splitter, two outputs each to the front-of-house console and the monitor console, each with its own preamp. ${gainMove ? `The monitor engineer raises a preamp ${gainDb} dB: front of house is unaffected — it has its own preamp.` : ''}` : `Digital gain sharing: three microphones into one stagebox with one preamp each, one network to both consoles. The monitor console owns the gain. ${gainMove ? `The monitor engineer raises the preamp ${gainDb} dB: gain compensation applies a −${gainDb} dB trim at front of house so its mix does not move.` : ''}`}>
      {[30, 82, 134].map((y, i) => (
        <G key={y}>
          <GearInSvg kind={i === 1 ? 'di' : 'vocalMic'} id={`sp-src-${i}`} x={34} y={y} size={30} />
          <Line x1={52} y1={y} x2={mid.x - 30} y2={mid.y} stroke={CABLE_COLORS.mic} strokeWidth={1.6} />
        </G>
      ))}
      {mode === 'analog' ? (
        <>
          <Rect x={mid.x - 28} y={mid.y - 22} width={56} height={44} rx={4} fill="#1a1d24" stroke="#2b2f37" strokeWidth={0.9} />
          {/* transformer symbol */}
          <Path d="M 152 72 q 4 -5 8 0 q 4 5 8 0 q 4 -5 8 0" stroke={INK.metalHi} strokeWidth={1.2} fill="none" />
          <Line x1={150} y1={80} x2={186} y2={80} stroke={INK.metalHi} strokeWidth={0.8} />
          <Line x1={150} y1={83} x2={186} y2={83} stroke={INK.metalHi} strokeWidth={0.8} />
          <Path d="M 152 92 q 4 -5 8 0 q 4 5 8 0 q 4 -5 8 0" stroke={INK.metalHi} strokeWidth={1.2} fill="none" />
          <SvgText x={mid.x} y={mid.y + 30} fontSize={FS} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>ISOLATED SPLITTER</SvgText>
          <Line x1={mid.x + 28} y1={mid.y - 8} x2={foh.x - 22} y2={foh.y} stroke={CABLE_COLORS.mic} strokeWidth={1.6} />
          <Line x1={mid.x + 28} y1={mid.y + 8} x2={mon.x - 22} y2={mon.y} stroke={CABLE_COLORS.mic} strokeWidth={1.6} />
          <SvgText x={foh.x} y={foh.y - 24} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>OWN PREAMP</SvgText>
          <SvgText x={W - 8} y={mon.y - 24} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={0.6}>OWN PREAMP{gainMove ? ` · +${gainDb} dB` : ''}</SvgText>
          {gainMove ? <SvgText x={foh.x} y={foh.y + 34} fontSize={FS} fill={colors.greenBright} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>UNCHANGED</SvgText> : null}
        </>
      ) : (
        <>
          <GearInSvg kind="stagebox" id="sp-box" x={mid.x} y={mid.y} size={44} />
          <SvgText x={mid.x} y={mid.y + 32} fontSize={FS} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>ONE PREAMP PER MIC</SvgText>
          <Line x1={mid.x + 22} y1={mid.y - 6} x2={foh.x - 22} y2={foh.y} stroke={CABLE_COLORS.digital} strokeWidth={1.6} strokeDasharray="3 3" />
          <Line x1={mid.x + 22} y1={mid.y + 6} x2={mon.x - 22} y2={mon.y} stroke={CABLE_COLORS.digital} strokeWidth={1.6} strokeDasharray="3 3" />
          <SvgText x={W - 8} y={mon.y - 24} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={0.6}>OWNS THE GAIN{gainMove ? ` · +${gainDb} dB` : ''}</SvgText>
          <SvgText x={W - 8} y={foh.y - 24} fontSize={FS} fill={gainMove ? colors.cyanBright : colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={0.6}>{gainMove ? `GAIN COMP · TRIM −${gainDb} dB` : 'GAIN COMPENSATION ON'}</SvgText>
          {gainMove ? <SvgText x={foh.x} y={foh.y + 34} fontSize={FS} fill={colors.greenBright} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>MIX UNCHANGED</SvgText> : null}
        </>
      )}
      <GearInSvg kind="console" id="sp-foh" x={foh.x} y={foh.y} size={40} />
      <SvgText x={foh.x} y={foh.y + 22} fontSize={FS} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>FOH CONSOLE</SvgText>
      <GearInSvg kind="console" id="sp-mon" x={mon.x} y={mon.y} size={40} />
      <SvgText x={mon.x} y={mon.y + 22} fontSize={FS} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>MONITOR CONSOLE</SvgText>
    </Frame>
  );
}

/* ── 6 · the subwoofer feed router ───────────────────────────────────────── */

export type SubFeedMode = 'crossover' | 'aux' | 'matrix';

const SUB_CHANNELS: readonly { id: string; name: string; low: boolean }[] = [
  { id: 'kick', name: 'Kick', low: true },
  { id: 'bass', name: 'Bass', low: true },
  { id: 'keys', name: 'Keys', low: true },
  { id: 'gtr', name: 'Guitar', low: false },
  { id: 'vox', name: 'Vocal', low: false },
  { id: 'pb', name: 'Playback', low: false },
];

export function SubFeedRouter({ mode, vocalSend }: { mode: SubFeedMode; vocalSend: boolean }) {
  const H = 176;
  const chY = (i: number) => 22 + i * 24;
  const busX = 150;
  const procX = 240;
  /** Half the processor's width — wide enough for its name at FS. */
  const PW = 30;
  const subY = 60;
  const topY = 130;
  const reaches = (c: (typeof SUB_CHANNELS)[number]) => (mode === 'crossover' || mode === 'matrix' ? true : c.low || (c.id === 'vox' && vocalSend));
  const subColor = '#2f74ff';
  const wrong = mode === 'aux' && vocalSend;
  return (
    <Frame h={H} a11y={`Sub feed router, ${mode}-fed. ${SUB_CHANNELS.map((c) => `${c.name} ${reaches(c) ? 'reaches' : 'does not reach'} the subwoofer`).join('; ')}.${wrong ? ' The vocal reaches the subwoofer by mistake.' : ''}`}>
      {SUB_CHANNELS.map((c, i) => {
        const y = chY(i);
        const on = reaches(c);
        const bad = c.id === 'vox' && wrong;
        // every channel goes to MAIN; the aux path is a second copy
        return (
          <G key={c.id}>
            <SvgText x={12} y={y + 3.4} fontSize={FS} fill={bad ? colors.orange : on ? colors.textPrimary : colors.textMuted} fontFamily={fonts.oswaldMedium}>{c.name.toUpperCase()}</SvgText>
            <Line x1={66} y1={y} x2={busX - 12} y2={topY} stroke={CABLE_COLORS.line} strokeWidth={1.2} opacity={0.6} />
            {mode === 'aux' && on ? <Line x1={66} y1={y} x2={busX - 12} y2={subY} stroke={bad ? colors.orange : subColor} strokeWidth={1.6} /> : null}
          </G>
        );
      })}
      {/* the buses */}
      <Box x={busX - 12} y={topY - 11} w={56} h={22} label="MAIN L/R" />
      {mode === 'aux' ? <Box x={busX - 12} y={subY - 11} w={56} h={22} label="AUX 6" on /> : null}
      {mode === 'matrix' ? <Box x={busX - 12} y={subY - 11} w={56} h={22} label="MATRIX 1" on /> : null}
      {mode === 'matrix' ? <Arrow x1={busX + 14} y1={topY - 11} x2={busX + 14} y2={subY + 11} color={subColor} /> : null}
      {/* the processor: crossover or plain LOW input */}
      <Rect x={procX - PW} y={34} width={PW * 2} height={120} rx={4} fill="#14161b" stroke="#2b2f37" strokeWidth={0.9} />
      <SvgText x={procX} y={48} fontSize={FS} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>PROCESSOR</SvgText>
      {mode === 'crossover' ? (
        <>
          <Arrow x1={busX + 44} y1={topY} x2={procX - PW} y2={96} color={CABLE_COLORS.line} />
          <Path d={`M ${procX - 14} 84 C ${procX - 6} 84 ${procX - 4} 64 ${procX + 4} 64 C ${procX + 12} 64 ${procX + 14} 84 ${procX + 16} 84`} stroke={INK.blue} strokeWidth={1} fill="none" />
          <SvgText x={procX} y={104} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.4}>XOVER</SvgText>
          <SvgText x={procX} y={116} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.2}>80–120 Hz</SvgText>
          <Arrow x1={procX + PW} y1={80} x2={302} y2={subY} color={subColor} />
          <SvgText x={procX + PW + 6} y={60} fontSize={FS} fill={subColor} fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>LOW</SvgText>
          <Arrow x1={procX + PW} y1={112} x2={302} y2={topY} color={CABLE_COLORS.line} />
          <SvgText x={procX + PW + 6} y={139} fontSize={FS} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>HIGH</SvgText>
        </>
      ) : (
        <>
          <Arrow x1={busX + 44} y1={subY} x2={procX - PW} y2={subY} color={wrong ? colors.orange : subColor} />
          <SvgText x={procX} y={subY + 17} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.4}>LOW · LPF</SvgText>
          <Arrow x1={procX + PW} y1={subY} x2={302} y2={subY} color={wrong ? colors.orange : subColor} />
          <Arrow x1={busX + 44} y1={topY} x2={procX - PW} y2={topY} color={CABLE_COLORS.line} />
          <SvgText x={procX} y={topY + 17} fontSize={FS} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.4}>HIGH · HPF</SvgText>
          <Arrow x1={procX + PW} y1={topY} x2={302} y2={topY} color={CABLE_COLORS.line} />
        </>
      )}
      <GearInSvg kind="passiveSub" id="sfr-sub" x={324} y={subY} size={36} />
      <GearInSvg kind="passiveSpeaker" id="sfr-top" x={324} y={topY} size={34} />
      {wrong ? (
        <>
          <SvgText x={324} y={subY + 32} fontSize={FS} fill={colors.orange} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>△ VOCAL</SvgText>
          <SvgText x={324} y={subY + 44} fontSize={FS} fill={colors.orange} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>IN THE SUBS</SvgText>
        </>
      ) : null}
    </Frame>
  );
}

/* ── 7 · arrival timeline at a back-row ear ──────────────────────────────── */

export function ArrivalTimeline({ needMs, setMs }: { needMs: number; setMs: number }) {
  const H = 96;
  const span = Math.max(needMs, setMs) + 40;
  const x0 = 60;
  const x1 = W - 16;
  const tx = (ms: number) => x0 + (ms / span) * (x1 - x0);
  const err = setMs - needMs;
  const fused = Math.abs(err) <= 2;
  const yBase = 64;
  const pulse = (ms: number, color: string, h: number) => `M ${tx(ms) - 5} ${yBase} L ${tx(ms) - 1.5} ${yBase - h} L ${tx(ms) + 1.5} ${yBase - h} L ${tx(ms) + 5} ${yBase} Z`;
  return (
    <Frame h={H} a11y={`Arrivals at a back-row listener: the mains' sound arrives ${needMs.toFixed(1)} milliseconds after the delay tower's would with no delay set; the delay tower is set to ${setMs} milliseconds. ${fused ? 'The two arrivals fuse into one event.' : `They are ${Math.abs(err).toFixed(1)} milliseconds apart — two events.`}`}>
      {/* the listener */}
      <Path d="M 26 26 C 33 26 38 32 38 39 C 38 45 34 49 31 51 L 31 55 L 21 55 L 21 51 C 18 49 14 45 14 39 C 14 32 19 26 26 26 Z" fill="none" stroke={INK.metalHi} strokeWidth={1.3} strokeLinejoin="round" />
      <SvgText x={26} y={68} fontSize={5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>BACK ROW</SvgText>
      {/* time axis */}
      <Line x1={x0} y1={yBase} x2={x1} y2={yBase} stroke="#3a3f4a" strokeWidth={0.8} />
      {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].filter((t) => t <= span).map((t) => (
        <G key={t}>
          <Line x1={tx(t)} y1={yBase} x2={tx(t)} y2={yBase + 3} stroke="#3a3f4a" strokeWidth={0.8} />
          <SvgText x={tx(t)} y={yBase + 11} fontSize={5} fill={colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">{t}</SvgText>
        </G>
      ))}
      <SvgText x={x1} y={yBase + 20} fontSize={5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={1}>ms AFTER THE DELAY TOWER FIRES (UNDELAYED)</SvgText>
      {fused ? (
        <>
          <Path d={pulse(needMs, colors.greenBright, 40)} fill={colors.greenBright} opacity={0.9} />
          <SvgText x={tx(needMs)} y={16} fontSize={6.5} fill={colors.greenBright} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>ONE EVENT — MAINS + DELAYS FUSED</SvgText>
        </>
      ) : (
        <>
          <Path d={pulse(needMs, colors.amber, 40)} fill={colors.amber} opacity={0.9} />
          <Path d={pulse(setMs, colors.cyanBright, 30)} fill={colors.cyanBright} opacity={0.9} />
          <SvgText x={tx(needMs)} y={16} fontSize={5.5} fill={colors.amber} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>MAINS ARRIVE</SvgText>
          <SvgText x={tx(setMs)} y={28} fontSize={5.5} fill={colors.cyanBright} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>DELAYS ARRIVE</SvgText>
          <Line x1={tx(Math.min(needMs, setMs))} y1={40} x2={tx(Math.max(needMs, setMs))} y2={40} stroke={colors.orange} strokeWidth={0.9} />
          <SvgText x={(tx(needMs) + tx(setMs)) / 2} y={47} fontSize={5.5} fill={colors.orange} fontFamily={fonts.mono} textAnchor="middle">{`${Math.abs(err).toFixed(1)} ms apart`}</SvgText>
        </>
      )}
    </Frame>
  );
}

/** The orientation line printed over a diagram or plot — what am I looking at. */
export function Orient({ children }: { children: string }) {
  return <Text style={styles.orient}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  orient: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
});
