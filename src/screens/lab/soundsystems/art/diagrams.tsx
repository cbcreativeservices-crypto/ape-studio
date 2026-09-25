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

function Box({ x, y, w, h, label, sub, on, tone = '#2b2f37', onPress, a11y, dashed }: { x: number; y: number; w: number; h: number; label: string; sub?: string; on?: boolean; tone?: string; onPress?: () => void; a11y?: string; dashed?: boolean }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={on ? '#0f1a22' : '#14161b'} stroke={on ? colors.cyanBright : tone} strokeWidth={on ? 1.4 : 0.9} strokeDasharray={dashed ? '3 2' : undefined} />
      <SvgText x={x + w / 2} y={y + (sub ? h / 2 - 1 : h / 2 + 3)} fontSize={7} fill={on ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.8}>{label}</SvgText>
      {sub ? <SvgText x={x + w / 2} y={y + h / 2 + 8} fontSize={5.5} fill={colors.textMuted} fontFamily={fonts.barlowRegular} textAnchor="middle">{sub}</SvgText> : null}
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

const STRIP_H = 314;

export function ChannelStrip({ selected, onTap }: { selected: StripStation; onTap: (s: StripStation) => void }) {
  const X = 20;
  const BW = 128;
  const BH = 24;
  const cx = X + BW / 2;
  const rows: { id: StripStation; y: number; label: string; sub?: string }[] = [
    { id: 'input', y: 12, label: 'INPUT · PREAMP GAIN', sub: 'mic level → line level' },
    { id: 'hpf', y: 48, label: 'HIGH-PASS 80–120 Hz' },
    { id: 'eq', y: 84, label: 'CHANNEL EQ' },
    { id: 'insert', y: 120, label: 'INSERT · THROUGH', sub: 'compressor · gate' },
    { id: 'fader', y: 176, label: 'FADER · PAN · MUTE' },
    { id: 'assign', y: 232, label: 'ASSIGN' },
  ];
  const line = (y1: number, y2: number) => <Line x1={cx} y1={y1} x2={cx} y2={y2} stroke={CABLE_COLORS.line} strokeWidth={2} />;
  const sel = (id: StripStation) => selected === id;
  const preY = 162;
  const postY = 218;
  return (
    <Frame h={STRIP_H} a11y="A channel strip in signal order from the top: input and preamp gain, high-pass filter, channel EQ, insert, then the pre-fader tap point where monitor sends leave, the fader with pan and mute, the post-fader tap point where effects sends and the direct output leave, and the assignment to the main bus or a group. Tap a block to read about it.">
      {line(36, 48)}
      {line(72, 84)}
      {line(108, 120)}
      {line(144, 176)}
      {line(200, 232)}
      {line(256, 268)}
      {rows.map((r) => (
        <Box key={r.id} x={X} y={r.y} w={BW} h={BH} label={r.label} sub={r.sub} on={sel(r.id)} onPress={() => onTap(r.id)} a11y={`${r.label}${sel(r.id) ? ', selected' : ''}`} />
      ))}
      {/* the two tap points */}
      <Circle cx={cx} cy={preY} r={4} fill="#0e1015" stroke={sel('sends') ? colors.cyanBright : CABLE_COLORS.line} strokeWidth={1.4} />
      <SvgText x={cx - 8} y={preY + 2.5} fontSize={6} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={1}>PRE</SvgText>
      <Circle cx={cx} cy={postY} r={4} fill="#0e1015" stroke={sel('sends') || sel('direct') ? colors.cyanBright : CABLE_COLORS.line} strokeWidth={1.4} />
      <SvgText x={cx - 8} y={postY + 2.5} fontSize={6} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={1}>POST</SvgText>
      {/* sends leave as copies */}
      <Arrow x1={cx + 4} y1={preY} x2={200} y2={preY} color={sel('sends') ? colors.cyanBright : CABLE_COLORS.line} />
      <Box x={202} y={preY - 12} w={136} h={24} label="AUX 1–4 · PRE" sub="wedges — the fader cannot touch it" on={sel('sends')} onPress={() => onTap('sends')} a11y={`Pre-fader aux sends to the wedges${sel('sends') ? ', selected' : ''}`} />
      <Arrow x1={cx + 4} y1={postY} x2={200} y2={postY} color={sel('sends') ? colors.cyanBright : CABLE_COLORS.line} />
      <Box x={202} y={postY - 12} w={136} h={24} label="AUX 5 · POST" sub="reverb — follows the fader" on={sel('sends')} onPress={() => onTap('sends')} a11y={`Post-fader aux send to the reverb${sel('sends') ? ', selected' : ''}`} />
      <Path d={`M ${cx + 4} ${postY + 2} C ${cx + 90} ${postY + 2} ${cx + 80} ${postY + 40} ${200} ${postY + 40}`} stroke={sel('direct') ? colors.cyanBright : CABLE_COLORS.line} strokeWidth={1.6} fill="none" strokeDasharray="3 3" />
      <Box x={202} y={postY + 28} w={136} h={24} label="DIRECT OUT" sub="this channel alone → recorder" on={sel('direct')} onPress={() => onTap('direct')} a11y={`Direct output${sel('direct') ? ', selected' : ''}`} dashed />
      {/* controls with no audio in them */}
      <Box x={202} y={70} w={136} h={30} label="DCA · MUTE GROUP" sub="a hand on the fader — no audio here" on={false} tone="#3a3f4a" dashed />
      <Arrow x1={202} y1={90} x2={X + BW + 4} y2={186} color="#5a5f6a" dashed width={1.2} />
      {/* assignment outputs */}
      <Line x1={cx} y1={268} x2={X + 30} y2={268} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Line x1={cx} y1={268} x2={X + 98} y2={268} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Line x1={X + 30} y1={268} x2={X + 30} y2={274} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Line x1={X + 98} y1={268} x2={X + 98} y2={274} stroke={CABLE_COLORS.line} strokeWidth={2} />
      <Box x={X} y={274} w={60} h={22} label="L/R MAIN" on={sel('assign')} onPress={() => onTap('assign')} a11y="Assigned direct to the main bus" />
      <Box x={X + 68} y={274} w={60} h={22} label="GROUP" sub="→ then main" on={sel('assign')} onPress={() => onTap('assign')} a11y="Assigned to a subgroup, which then feeds main" />
      <SvgText x={W / 2} y={STRIP_H - 6} fontSize={5.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>L/R OR GROUP — ONE OR THE OTHER; BOTH IS THE DOUBLE-ROUTING FAULT</SvgText>
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
      <SvgText x={mic.x - R * 0.55} y={mic.y - R * 0.62} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>LIVE ANGLE</SvgText>
      <SvgText x={mic.x + 18 * S} y={mic.y - 9 * S} fontSize={5.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>NULL</SvgText>
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
      <SvgText x={wedgeAt.x} y={wedgeAt.y + 16} fontSize={5.5} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>WEDGE</SvgText>
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
      <SvgText x={con.x} y={H - 6} fontSize={6} fill={loopColor} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>{ringing ? 'LOOP GAIN OVER UNITY — RINGING' : `LOOP STABLE · SEND ${sendDb > 0 ? '+' : ''}${sendDb} dB`}</SvgText>
    </Frame>
  );
}

/* ── 3 · the output patch panel ──────────────────────────────────────────── */

export type PatchSocket = { id: string; name: string; short: string; bus: string | null; ok: boolean | null };

export function PatchPanel({ sockets, active, onTap }: { sockets: readonly PatchSocket[]; active: string | null; onTap: (id: string) => void }) {
  const H = 150;
  const n = sockets.length;
  const gap = (W - 40) / n;
  return (
    <Frame h={H} a11y={`The stagebox's output sockets. ${sockets.map((s) => `${s.name}: ${s.bus ? `${s.bus}${s.ok ? ', correct' : ', wrong'}` : 'unpatched'}`).join('. ')}. Tap a socket to patch it.`}>
      <Rect x={12} y={30} width={W - 24} height={52} rx={3} fill="#1a1d24" stroke="#000" strokeWidth={0.8} />
      <SvgText x={20} y={40} fontSize={5.5} fill={INK.tape} fontFamily={fonts.oswaldSemiBold} letterSpacing={1.2}>STAGEBOX · LINE OUTPUTS</SvgText>
      {sockets.map((s, i) => {
        const x = 20 + gap * (i + 0.5);
        const sel = active === s.id;
        const col = s.bus == null ? '#3a3f4a' : s.ok ? colors.greenBright : colors.red;
        return (
          <G key={s.id}>
            {/* the bus tape above the socket */}
            <Rect x={x - gap / 2 + 3} y={8} width={gap - 6} height={14} rx={2} fill={s.bus ? (s.ok ? '#0f2416' : '#241012') : '#101216'} stroke={sel ? colors.cyanBright : col} strokeWidth={sel ? 1.4 : 0.8} />
            <SvgText x={x} y={17.5} fontSize={5.5} fill={s.bus ? col : colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">{s.bus ?? '—'}</SvgText>
            {/* XLR out */}
            <Circle cx={x} cy={60} r={7} fill="#0a0b0d" stroke={sel ? colors.cyanBright : INK.amber} strokeWidth={sel ? 1.6 : 0.9} />
            <Circle cx={x - 2.6} cy={58.4} r={1.1} fill={INK.metalHi} />
            <Circle cx={x + 2.6} cy={58.4} r={1.1} fill={INK.metalHi} />
            <Circle cx={x} cy={63} r={1.1} fill={INK.metalHi} />
            <SvgText x={x} y={76} fontSize={5} fill={colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">{`OUT ${i + 1}`}</SvgText>
            {/* the cable down to its destination */}
            <Line x1={x} y1={82} x2={x} y2={102} stroke={s.bus ? CABLE_COLORS.line : '#2a2e38'} strokeWidth={s.bus ? 2 : 1} strokeDasharray={s.bus ? undefined : '2 3'} />
            <Rect x={x - gap / 2 + 3} y={104} width={gap - 6} height={30} rx={3} fill={sel ? '#0f1a22' : '#14161b'} stroke={sel ? colors.cyanBright : '#2b2f37'} strokeWidth={sel ? 1.4 : 0.8} />
            <SvgText x={x} y={116} fontSize={5.5} fill={sel ? colors.cyanBright : colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={0.6}>{s.short}</SvgText>
            <SvgText x={x} y={126} fontSize={5} fill={s.bus ? col : colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle">{s.bus == null ? 'UNPATCHED' : s.ok ? 'PLAYS ITS FEED' : 'WRONG FEED'}</SvgText>
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
      <Rect x={12} y={18} width={W - 24} height={34} rx={3} fill="#1a1d24" stroke="#000" strokeWidth={0.8} />
      <SvgText x={20} y={13} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>{title}</SvgText>
      <SvgText x={20} y={70} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>{lower}</SvgText>
      {inputs.map((r, i) => {
        const x = 20 + gap * (i + 0.5);
        const led = r.revealed ? r.led : false;
        const sel = selectedId === r.id;
        return (
          <G key={r.id}>
            {sel ? <Rect x={x - gap / 2 + 1} y={20} width={gap - 2} height={H - 24} rx={3} fill={colors.cyanBright} opacity={0.08} stroke={colors.cyanBright} strokeWidth={0.8} /> : null}
            <Circle cx={x} cy={38} r={6} fill="#0a0b0d" stroke={INK.metalHi} strokeWidth={0.8} />
            <Circle cx={x} cy={27} r={2.4} fill={led ? INK.green : '#2a2d33'} stroke="#000" strokeWidth={0.4} />
            {led ? <Circle cx={x} cy={27} r={5} fill={INK.green} opacity={0.25} /> : null}
            <SvgText x={x} y={49} fontSize={4.8} fill={INK.tape} fontFamily={fonts.mono} textAnchor="middle">{i + 1}</SvgText>
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
              <SvgText x={x} y={92} fontSize={7} fill="#3a3f4a" fontFamily={fonts.oswaldSemiBold} textAnchor="middle">?</SvgText>
            )}
            <SvgText x={x} y={112} fontSize={4.8} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle">{r.short}</SvgText>
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
          <SvgText x={mid.x} y={mid.y + 30} fontSize={5.5} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>ISOLATED SPLITTER</SvgText>
          <Line x1={mid.x + 28} y1={mid.y - 8} x2={foh.x - 22} y2={foh.y} stroke={CABLE_COLORS.mic} strokeWidth={1.6} />
          <Line x1={mid.x + 28} y1={mid.y + 8} x2={mon.x - 22} y2={mon.y} stroke={CABLE_COLORS.mic} strokeWidth={1.6} />
          <SvgText x={foh.x} y={foh.y - 24} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>OWN PREAMP</SvgText>
          <SvgText x={mon.x} y={mon.y - 24} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>OWN PREAMP{gainMove ? ` · +${gainDb} dB` : ''}</SvgText>
          {gainMove ? <SvgText x={foh.x} y={foh.y + 30} fontSize={6} fill={colors.greenBright} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>UNCHANGED</SvgText> : null}
        </>
      ) : (
        <>
          <GearInSvg kind="stagebox" id="sp-box" x={mid.x} y={mid.y} size={44} />
          <SvgText x={mid.x} y={mid.y + 32} fontSize={5.5} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>ONE PREAMP PER MIC</SvgText>
          <Line x1={mid.x + 22} y1={mid.y - 6} x2={foh.x - 22} y2={foh.y} stroke={CABLE_COLORS.digital} strokeWidth={1.6} strokeDasharray="3 3" />
          <Line x1={mid.x + 22} y1={mid.y + 6} x2={mon.x - 22} y2={mon.y} stroke={CABLE_COLORS.digital} strokeWidth={1.6} strokeDasharray="3 3" />
          <SvgText x={mon.x} y={mon.y - 24} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>OWNS THE GAIN{gainMove ? ` · +${gainDb} dB` : ''}</SvgText>
          <SvgText x={foh.x} y={foh.y - 24} fontSize={5.5} fill={gainMove ? colors.cyanBright : colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>{gainMove ? `GAIN COMP · TRIM −${gainDb} dB` : 'GAIN COMPENSATION ON'}</SvgText>
          {gainMove ? <SvgText x={foh.x} y={foh.y + 30} fontSize={6} fill={colors.greenBright} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>MIX UNCHANGED</SvgText> : null}
        </>
      )}
      <GearInSvg kind="console" id="sp-foh" x={foh.x} y={foh.y} size={40} />
      <SvgText x={foh.x} y={foh.y + 22} fontSize={5.5} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>FOH CONSOLE</SvgText>
      <GearInSvg kind="console" id="sp-mon" x={mon.x} y={mon.y} size={40} />
      <SvgText x={mon.x} y={mon.y + 22} fontSize={5.5} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>MONITOR CONSOLE</SvgText>
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
  const procX = 236;
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
            <SvgText x={14} y={y + 2.5} fontSize={6.5} fill={bad ? colors.orange : on ? colors.textPrimary : colors.textMuted} fontFamily={fonts.oswaldMedium}>{c.name.toUpperCase()}</SvgText>
            <Line x1={54} y1={y} x2={busX - 12} y2={topY} stroke={CABLE_COLORS.line} strokeWidth={1.2} opacity={0.6} />
            {mode === 'aux' && on ? <Line x1={54} y1={y} x2={busX - 12} y2={subY} stroke={bad ? colors.orange : subColor} strokeWidth={1.6} /> : null}
          </G>
        );
      })}
      {/* the buses */}
      <Box x={busX - 12} y={topY - 11} w={52} h={22} label="MAIN L/R" />
      {mode === 'aux' ? <Box x={busX - 12} y={subY - 11} w={52} h={22} label="AUX 6" sub="post-fader" on /> : null}
      {mode === 'matrix' ? <Box x={busX - 12} y={subY - 11} w={52} h={22} label="MATRIX 1" sub="from MAIN · own fader" on /> : null}
      {mode === 'matrix' ? <Arrow x1={busX + 14} y1={topY - 11} x2={busX + 14} y2={subY + 11} color={subColor} /> : null}
      {/* the processor: crossover or plain LOW input */}
      <Rect x={procX - 22} y={36} width={44} height={116} rx={4} fill="#14161b" stroke="#2b2f37" strokeWidth={0.9} />
      <SvgText x={procX} y={48} fontSize={5.5} fill={colors.textSecondary} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>PROCESSOR</SvgText>
      {mode === 'crossover' ? (
        <>
          <Arrow x1={busX + 40} y1={topY} x2={procX - 22} y2={96} color={CABLE_COLORS.line} />
          <Path d={`M ${procX - 14} 104 C ${procX - 6} 104 ${procX - 4} 84 ${procX + 4} 84 C ${procX + 12} 84 ${procX + 14} 104 ${procX + 16} 104`} stroke={INK.blue} strokeWidth={1} fill="none" />
          <SvgText x={procX} y={116} fontSize={5} fill={colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">XOVER 80–120 Hz</SvgText>
          <Arrow x1={procX + 22} y1={80} x2={300} y2={subY} color={subColor} />
          <SvgText x={procX + 30} y={66} fontSize={5} fill={subColor} fontFamily={fonts.oswaldMedium} letterSpacing={1}>LOW</SvgText>
          <Arrow x1={procX + 22} y1={112} x2={300} y2={topY} color={CABLE_COLORS.line} />
          <SvgText x={procX + 30} y={126} fontSize={5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={1}>HIGH</SvgText>
        </>
      ) : (
        <>
          <Arrow x1={busX + 40} y1={subY} x2={procX - 22} y2={subY} color={wrong ? colors.orange : subColor} />
          <SvgText x={procX} y={subY + 14} fontSize={5} fill={colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">LOW · LPF</SvgText>
          <Arrow x1={procX + 22} y1={subY} x2={300} y2={subY} color={wrong ? colors.orange : subColor} />
          <Arrow x1={busX + 40} y1={topY} x2={procX - 22} y2={topY} color={CABLE_COLORS.line} />
          <SvgText x={procX} y={topY + 14} fontSize={5} fill={colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">HIGH · HPF</SvgText>
          <Arrow x1={procX + 22} y1={topY} x2={300} y2={topY} color={CABLE_COLORS.line} />
        </>
      )}
      <GearInSvg kind="passiveSub" id="sfr-sub" x={324} y={subY} size={36} />
      <GearInSvg kind="passiveSpeaker" id="sfr-top" x={324} y={topY} size={34} />
      {wrong ? <SvgText x={324} y={subY + 26} fontSize={5.5} fill={colors.orange} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>△ VOCAL IN THE SUBS</SvgText> : null}
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
