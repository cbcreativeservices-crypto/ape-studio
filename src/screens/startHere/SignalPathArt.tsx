/**
 * SignalPathArt — the Start Here signal path, drawn once and used on four
 * pages (Lesson 2 "Follow a voice", Lesson 4 "Tap each part", the lab's
 * Step 3 "Follow the signal" and Lesson 6 "Match the words").
 *
 *   voice → microphone → cable → mixer → cable → powered speaker → listener
 *
 * The owner's plan: "keep the first version simple and avoid introducing
 * advanced gear or multiple routing options. The aim is to give a new learner
 * a mental map they can build on." So: ONE path, left to right, the same
 * picture every time it appears.
 *
 * REUSE: every object is the Sound Systems Lab's illustrated gear
 * (soundsystems/art/gearArt — GearInSvg: vocal mic, console, powered top,
 * the line-art listener head), never a box standing in for a device (visual
 * standards 2026-07-29). Pure react-native-svg, so it draws everywhere
 * including the web preview.
 *
 * LEGIBILITY: viewBox 360 × 150 (aspect 2.4). On a 390-wide phone the glass
 * draws it at ~0.96 px per unit, so the smallest text (10 units) renders at
 * ~9.6 pt — above the 9 pt floor — and FULL SCREEN zooms the same drawing.
 *
 * MOTION: signal "pulses" ride the cables and the air arcs breathe while the
 * path is live; everything after an unplugged cable goes dark (the Sound
 * Systems map's rule). Loops honour reduced motion and Low-Light Production
 * Mode (useLabLoops) by holding still.
 *
 * TAPS: transparent RN Pressables laid over the drawing in PERCENT of the
 * viewBox, so they line up at every size — on the glass and in full screen.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { fonts } from '../../theme/tokens';
import { GearInSvg } from '../lab/soundsystems/art/gearArt';
import { useLabLoops } from '../lab/soundsystems/art/motion';
import type { MatchTarget, StationId, Unplug } from '../../features/startHere/startHereContent';

export const PATH_VB_W = 360;
export const PATH_VB_H = 150;
export const PATH_ASPECT = PATH_VB_W / PATH_VB_H;

const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const GREEN = '#5bff85';
const RED = '#ff5a48';
const DIM = '#5a5d66';
const LABEL = '#c9ccd4';

const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);

/** Device centres (viewBox units). */
const X = { voice: 28, mic: 90, mixer: 180, speaker: 274, listener: 338 } as const;
const CY = 76;

/** Cable geometry: a drooping quadratic from one device's output to the next's input. */
const CABLES = {
  cableA: { x0: 108, x1: 154, y: 88, sag: 20 },
  cableB: { x0: 206, x1: 252, y: 88, sag: 20 },
} as const;

const cablePath = (c: { x0: number; x1: number; y: number; sag: number }) =>
  `M ${c.x0} ${c.y} Q ${(c.x0 + c.x1) / 2} ${c.y + c.sag * 2} ${c.x1} ${c.y}`;

/** Tap regions in viewBox units: [x0, y0, x1, y1]. */
const STATION_BOX: Record<StationId, [number, number, number, number]> = {
  voice: [4, 40, 54, 142],
  mic: [66, 40, 110, 142],
  cableA: [112, 86, 152, 142],
  mixer: [154, 40, 206, 142],
  cableB: [208, 86, 250, 142],
  speaker: [250, 40, 300, 142],
  listener: [314, 40, 358, 142],
};
/** Jack mode (IN / OUT prompts): the device HALVES that face a cable. */
const JACK_BOX: Partial<Record<MatchTarget, [number, number, number, number]>> = {
  'mic.out': [88, 40, 112, 142],
  'mixer.in': [154, 40, 180, 142],
  'mixer.out': [180, 40, 206, 142],
  'speaker.in': [250, 40, 274, 142],
};

const STATION_LABELS: { id: StationId; x: number; text: string }[] = [
  { id: 'voice', x: X.voice, text: 'VOICE' },
  { id: 'mic', x: X.mic, text: 'MIC' },
  { id: 'cableA', x: 131, text: 'CABLE' },
  { id: 'mixer', x: X.mixer, text: 'MIXER' },
  { id: 'cableB', x: 229, text: 'CABLE' },
  { id: 'speaker', x: X.speaker, text: 'SPEAKER' },
  { id: 'listener', x: X.listener, text: 'YOU' },
];

const JACKS: { id: MatchTarget; x: number; text: 'IN' | 'OUT' }[] = [
  { id: 'mic.out', x: 108, text: 'OUT' },
  { id: 'mixer.in', x: 154, text: 'IN' },
  { id: 'mixer.out', x: 206, text: 'OUT' },
  { id: 'speaker.in', x: 252, text: 'IN' },
];

const ORDER: StationId[] = ['voice', 'mic', 'cableA', 'mixer', 'cableB', 'speaker', 'listener'];

/** Which stations still carry the signal after an unplug. */
export function stationLive(id: StationId, unplug: Unplug): boolean {
  if (unplug === 'none') return true;
  const i = ORDER.indexOf(id);
  const brk = ORDER.indexOf(unplug);
  return i < brk;
}

export type PathMark = 'right' | 'wrong';

export function SignalPathArt({
  highlight = null,
  reached = null,
  showIO = false,
  showForms = true,
  activeForm = null,
  unplug = 'none',
  running = true,
  jackMode = false,
  marks,
  onTap,
  tapLabel,
}: {
  /** The selected part: drawn with a ring (a station) or a lit jack. */
  highlight?: MatchTarget | null;
  /** Lesson 2: how far the voice has travelled — later stops are dimmed. */
  reached?: StationId | null;
  /** Print IN / OUT at every jack. */
  showIO?: boolean;
  /** The SOUND / AUDIO SIGNAL / SOUND band across the top. */
  showForms?: boolean;
  /** Light one segment of the band (the others dim) — Lesson 2's "where is
   *  the voice now, and in what form?". */
  activeForm?: 'soundIn' | 'signal' | 'soundOut' | null;
  unplug?: Unplug;
  running?: boolean;
  /** Taps resolve to jacks on the devices' cable-facing halves. */
  jackMode?: boolean;
  /** Match-game feedback rings. */
  marks?: Partial<Record<MatchTarget, PathMark>>;
  onTap?: (t: MatchTarget) => void;
  /** Screen-reader name for a tap target. */
  tapLabel?: (t: MatchTarget) => string;
}) {
  const loops = useLabLoops();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!running || !loops) {
      cancelAnimation(t);
      t.value = 0.35;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [running, loops, t]);

  const reachedIdx = reached ? ORDER.indexOf(reached) : ORDER.length - 1;
  const visible = (id: StationId) => ORDER.indexOf(id) <= reachedIdx;
  const live = (id: StationId) => stationLive(id, unplug) && visible(id);

  // A pulse riding each cable (quadratic Bézier evaluated on the UI thread).
  const pulseProps = (c: { x0: number; x1: number; y: number; sag: number }, phase: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => {
      const u = (t.value + phase) % 1;
      const cx = (c.x0 + c.x1) / 2;
      const cy = c.y + c.sag * 2;
      const x = (1 - u) * (1 - u) * c.x0 + 2 * (1 - u) * u * cx + u * u * c.x1;
      const y = (1 - u) * (1 - u) * c.y + 2 * (1 - u) * u * cy + u * u * c.y;
      return { cx: x, cy: y, opacity: 0.35 + 0.65 * Math.sin(Math.PI * u) };
    });
  const pA0 = pulseProps(CABLES.cableA, 0);
  const pA1 = pulseProps(CABLES.cableA, 0.5);
  const pB0 = pulseProps(CABLES.cableB, 0);
  const pB1 = pulseProps(CABLES.cableB, 0.5);
  // Air arcs breathe outward: each arc's opacity peaks in turn.
  const arcProps = (k: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => {
      const u = (t.value * 2 + 1 - k / 3) % 1;
      return { opacity: 0.25 + 0.75 * Math.max(0, Math.sin(Math.PI * u)) };
    });
  const arc0 = arcProps(0);
  const arc1 = arcProps(1);
  const arc2 = arcProps(2);
  const arcAnims = [arc0, arc1, arc2];

  const airArcs = (x0: number, on: boolean, key: string) => (
    <G key={key}>
      {[0, 1, 2].map((k) => {
        const x = x0 + k * 7;
        const r = 7 + k * 5;
        const d = `M ${x} ${CY - r} Q ${x + r * 0.55} ${CY} ${x} ${CY + r}`;
        return on ? (
          <APath key={k} d={d} stroke={AMBER} strokeWidth={2} fill="none" strokeLinecap="round" animatedProps={arcAnims[k]} />
        ) : (
          <Path key={k} d={d} stroke={DIM} strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.35} />
        );
      })}
    </G>
  );

  const cable = (id: 'cableA' | 'cableB') => {
    const c = CABLES[id];
    const pulled = unplug === id;
    const on = live(id);
    const hl = highlight === id;
    const mark = marks?.[id];
    const d = pulled
      ? // Unplugged: the far end hangs loose and short of the jack.
        `M ${c.x0} ${c.y} Q ${(c.x0 + c.x1) / 2 - 4} ${c.y + c.sag * 2.2} ${c.x1 - 12} ${c.y + 22}`
      : cablePath(c);
    return (
      <G key={id} opacity={visible(id) ? 1 : 0.3}>
        {hl || mark ? (
          <Path d={d} stroke={mark === 'wrong' ? RED : mark === 'right' ? GREEN : AMBER} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.28} />
        ) : null}
        {/* the jacket, then a highlight line for a round-cable look */}
        <Path d={d} stroke="#07080a" strokeWidth={5.2} strokeLinecap="round" fill="none" />
        <Path d={d} stroke={on ? '#2b3a52' : '#26282e'} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <Path d={d} stroke="#fff" strokeWidth={0.8} strokeLinecap="round" fill="none" opacity={0.18} transform="translate(0,-0.8)" />
        {/* plug bodies at both ends (the loose one hangs free) */}
        <Rect x={c.x0 - 3} y={c.y - 4} width={6} height={8} rx={1.4} fill="#8d939c" stroke="#000" strokeWidth={0.5} />
        {pulled ? (
          <G>
            <Rect x={c.x1 - 15} y={c.y + 18} width={6} height={8} rx={1.4} fill="#8d939c" stroke="#000" strokeWidth={0.5} />
            <Circle cx={c.x1} cy={c.y} r={2.2} fill="#07080a" stroke={RED} strokeWidth={1} />
          </G>
        ) : (
          <Rect x={c.x1 - 3} y={c.y - 4} width={6} height={8} rx={1.4} fill="#8d939c" stroke="#000" strokeWidth={0.5} />
        )}
        {on && !pulled ? (
          <>
            <ACircle r={2.6} fill={BLUE} animatedProps={id === 'cableA' ? pA0 : pB0} />
            <ACircle r={2.6} fill={BLUE} animatedProps={id === 'cableA' ? pA1 : pB1} />
          </>
        ) : null}
      </G>
    );
  };

  const ring = (id: StationId, x: number, r: number) => {
    const mark = marks?.[id];
    const hl = highlight === id;
    if (!hl && !mark) return null;
    const col = mark === 'wrong' ? RED : mark === 'right' ? GREEN : AMBER;
    return (
      <G key={`ring-${id}`}>
        <Circle cx={x} cy={CY} r={r} fill={col} opacity={0.12} />
        <Circle cx={x} cy={CY} r={r} fill="none" stroke={col} strokeWidth={1.6} opacity={0.9} />
      </G>
    );
  };

  const soundLeftOn = live('voice');
  const soundRightOn = live('speaker') && live('listener');

  return (
    <View style={{ width: '100%', aspectRatio: PATH_ASPECT }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${PATH_VB_W} ${PATH_VB_H}`}>
        {/* ── the form band: SOUND · AUDIO SIGNAL · SOUND ── */}
        {showForms ? (
          <G>
            {/* dim the segments the voice is not in (Lesson 2) */}
            <G opacity={activeForm && activeForm !== 'soundIn' ? 0.3 : 1}>
            <Line x1={6} y1={24} x2={70} y2={24} stroke={AMBER} strokeWidth={1.4} opacity={0.7} />
            <SvgText x={38} y={17} fill={AMBER} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1}>
              SOUND
            </SvgText>
            </G>
            <G opacity={activeForm && activeForm !== 'signal' ? 0.3 : 1}>
            <Line x1={78} y1={24} x2={262} y2={24} stroke={BLUE} strokeWidth={1.4} opacity={0.8} />
            <SvgText x={170} y={17} fill={BLUE} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1}>
              AUDIO SIGNAL · ELECTRICAL
            </SvgText>
            </G>
            <G opacity={activeForm && activeForm !== 'soundOut' ? 0.3 : 1}>
            <Line x1={270} y1={24} x2={354} y2={24} stroke={AMBER} strokeWidth={1.4} opacity={0.7} />
            <SvgText x={312} y={17} fill={AMBER} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1}>
              SOUND
            </SvgText>
            </G>
          </G>
        ) : null}

        {/* ── rings under the gear ── */}
        {ring('voice', X.voice, 24)}
        {ring('mic', X.mic, 22)}
        {ring('mixer', X.mixer, 28)}
        {ring('speaker', X.speaker, 27)}
        {ring('listener', X.listener, 22)}

        {/* ── the chain ── */}
        <G opacity={visible('voice') ? 1 : 0.3}>
          <GearInSvg kind="listener" id="sh-voice" x={X.voice} y={CY} size={50} />
          {/* a singer: the mouth open toward the mic */}
          <Path d={`M ${X.voice + 3} ${CY + 1} q 3 2 6 0`} stroke={LABEL} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        </G>
        <G opacity={visible('mic') ? 1 : 0.3}>{airArcs(52, soundLeftOn && visible('mic'), 'airA')}</G>
        <GearInSvg kind="vocalMic" id="sh-mic" x={X.mic} y={CY} size={48} dim={!visible('mic')} />
        {cable('cableA')}
        <GearInSvg kind="console" id="sh-mixer" x={X.mixer} y={CY} size={60} dim={!visible('mixer')} />
        {cable('cableB')}
        <GearInSvg kind="poweredSpeaker" id="sh-spk" x={X.speaker} y={CY} size={62} dim={!visible('speaker')} />
        <G opacity={visible('listener') ? 1 : 0.3}>{airArcs(298, soundRightOn, 'airB')}</G>
        <G opacity={visible('listener') ? (soundRightOn ? 1 : 0.55) : 0.3}>
          <GearInSvg kind="listener" id="sh-you" x={X.listener} y={CY} size={46} />
        </G>

        {/* ── SIGNAL-present lights on the two devices that have them. A pulled
            cable darkens only these: the gear stays POWERED (no signal ≠ no
            power — audio-expert review 2026-09-29), and a dynamic vocal mic
            has no light at all. ── */}
        {(['mixer', 'speaker'] as const).map((id) => {
          const x = id === 'mixer' ? X.mixer + 22 : X.speaker + 16;
          const y = id === 'mixer' ? CY - 20 : CY - 26;
          const on = live(id);
          return (
            <G key={`led-${id}`} opacity={visible(id) ? 1 : 0.3}>
              {on ? <Circle cx={x} cy={y} r={5.5} fill={GREEN} opacity={0.22} /> : null}
              <Circle cx={x} cy={y} r={2.8} fill={on ? GREEN : '#1b1d22'} stroke="#000" strokeWidth={0.6} />
            </G>
          );
        })}

        {/* ── IN / OUT at the jacks ── */}
        {showIO || jackMode
          ? JACKS.map((j) => {
              const mark = marks?.[j.id];
              const hl = highlight === j.id;
              const col = mark === 'wrong' ? RED : mark === 'right' ? GREEN : hl ? AMBER : j.text === 'IN' ? '#9fd0ff' : '#ffd98a';
              return (
                <G key={j.id}>
                  <Rect x={j.x - 12} y={100} width={24} height={14} rx={3} fill="#0b0c10" stroke={col} strokeWidth={hl || mark ? 1.6 : 1} opacity={0.95} />
                  <SvgText x={j.x} y={110.5} fill={col} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={0.6}>
                    {j.text}
                  </SvgText>
                </G>
              );
            })
          : null}

        {/* ── names ── */}
        {STATION_LABELS.map((l) => {
          const hl = highlight === l.id || marks?.[l.id] != null;
          return (
            <SvgText
              key={`lbl-${l.id}`}
              x={l.x}
              y={136}
              fill={hl ? AMBER : visible(l.id) ? LABEL : DIM}
              fontSize={10}
              fontFamily={fonts.oswaldSemiBold}
              textAnchor="middle"
              letterSpacing={0.8}
            >
              {l.text}
            </SvgText>
          );
        })}
      </Svg>

      {/* ── tap targets, in percent of the viewBox ── */}
      {onTap ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {(Object.entries(STATION_BOX) as [StationId, [number, number, number, number]][])
            .filter(([id]) => !(jackMode && (id === 'mic' || id === 'mixer' || id === 'speaker')))
            .map(([id, b]) => (
              <Target key={id} id={id} box={b} onTap={onTap} label={tapLabel?.(id) ?? id} />
            ))}
          {jackMode
            ? (Object.entries(JACK_BOX) as [MatchTarget, [number, number, number, number]][]).map(([id, b]) => (
                <Target key={id} id={id} box={b} onTap={onTap} label={tapLabel?.(id) ?? id} />
              ))
            : null}
          {jackMode ? (
            // The mic's left half (its grille) is still "the microphone".
            <Target id="mic" box={[66, 40, 88, 142]} onTap={onTap} label={tapLabel?.('mic') ?? 'mic'} />
          ) : null}
          {jackMode ? <Target id="speaker" box={[274, 40, 300, 142]} onTap={onTap} label={tapLabel?.('speaker') ?? 'speaker'} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function Target({ id, box, onTap, label }: { id: MatchTarget; box: [number, number, number, number]; onTap: (t: MatchTarget) => void; label: string }) {
  const [x0, y0, x1, y1] = box;
  return (
    <Pressable
      onPress={() => onTap(id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        position: 'absolute',
        left: `${(x0 / PATH_VB_W) * 100}%`,
        top: `${(y0 / PATH_VB_H) * 100}%`,
        width: `${((x1 - x0) / PATH_VB_W) * 100}%`,
        height: `${((y1 - y0) / PATH_VB_H) * 100}%`,
      }}
    />
  );
}
