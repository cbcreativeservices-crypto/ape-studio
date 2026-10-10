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
import { HeadIconSvg } from '../../features/lab/headIconsSvg';
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
/** The singer's and the listener's heads: the owner's side icon, crown→chin
 *  (the whole drawing, crown → neck base, ≈ 42 units of this 400-wide art). */
const HEAD_PX = 34;
/** The heads' stroke: the gear glyphs' light metal, so they sit with the kit. */
export const HEAD_GLYPH_INK = '#a7aeb8';

const ACircle = Animated.createAnimatedComponent(Circle);
const APath = Animated.createAnimatedComponent(Path);

/** Device centres (viewBox units). */
const X = { voice: 28, mic: 90, mixer: 180, speaker: 274, listener: 338 } as const;
const CY = 76;

/**
 * Cable geometry (clash sweep 2026-10-10). Every cable now ENDS IN the gear it
 * connects — nothing floats beside a device:
 *  - cable A leaves the vocal mic's tail along the mic's own drawn cable loop
 *    (gearArt VocalMic: tail (45.6, 38.7) → floor (36.6, 58.6) in its 64-unit
 *    box, here ×0.75 at (66, 52)), lies on the floor and rises into the mixer's
 *    left side; its plug tucks BEHIND the desk (drawn before it).
 *  - cable B leaves from behind the mixer's right side, lies on the floor and
 *    rises into the speaker's (rear) input, plug tucked behind the cabinet.
 * Gear edges in this viewBox: mixer x 152.8–207.2, speaker x 258.6–306.
 * Floor ≈ y 97–101; the cables lie at ≈ 99.5, ABOVE the IN / OUT tags (y ≥ 104).
 * Each cable is a list of cubic segments [c1, c2, end] from `start`.
 */
type Pt = readonly [number, number];
type CableGeom = { start: Pt; segs: readonly (readonly [Pt, Pt, Pt])[] };
const CABLES: Record<'cableA' | 'cableB', { on: CableGeom; pulled: CableGeom; jack: Pt }> = {
  cableA: {
    on: {
      start: [100.2, 81],
      segs: [
        [[102.45, 84.85], [99.45, 88.75], [95.55, 90.85]],
        [[92.55, 92.5], [91.2, 94.3], [93.45, 95.95]],
        [[97, 98.6], [110, 99.6], [124, 99.3]],
        [[138, 99], [147.5, 95], [153, 88]],
      ],
    },
    // unplugged: the plug end lies on the floor, short of the mixer
    pulled: {
      start: [100.2, 81],
      segs: [
        [[102.45, 84.85], [99.45, 88.75], [95.55, 90.85]],
        [[92.55, 92.5], [91.2, 94.3], [93.45, 95.95]],
        [[97, 98.6], [110, 99.6], [124, 99.4]],
        [[131, 99.3], [136, 99.5], [140, 99.6]],
      ],
    },
    jack: [154.6, 88],
  },
  cableB: {
    on: {
      start: [207, 88],
      segs: [
        [[211, 95], [215, 99.5], [226, 99.6]],
        [[238, 99.7], [252.5, 98.5], [259.5, 88]],
      ],
    },
    pulled: {
      start: [207, 88],
      segs: [
        [[211, 95], [215, 99.5], [226, 99.6]],
        [[233, 99.7], [239, 99.6], [244, 99.6]],
      ],
    },
    jack: [260.4, 88],
  },
};

const cablePath = (g: CableGeom) =>
  `M ${g.start[0]} ${g.start[1]} ` + g.segs.map(([a, b, e]) => `C ${a[0]} ${a[1]} ${b[0]} ${b[1]} ${e[0]} ${e[1]}`).join(' ');
const cableEnd = (g: CableGeom): Pt => g.segs[g.segs.length - 1][2];

/** The connected cable sampled by arc length, so a signal pulse can ride it. */
function sampleCable(g: CableGeom, perSeg = 16): { xs: number[]; ys: number[]; ls: number[] } {
  const xs = [g.start[0]];
  const ys = [g.start[1]];
  const ls = [0];
  let p0: Pt = g.start;
  for (const [a, b, e] of g.segs) {
    for (let k = 1; k <= perSeg; k++) {
      const u = k / perSeg;
      const v = 1 - u;
      const x = v * v * v * p0[0] + 3 * v * v * u * a[0] + 3 * v * u * u * b[0] + u * u * u * e[0];
      const y = v * v * v * p0[1] + 3 * v * v * u * a[1] + 3 * v * u * u * b[1] + u * u * u * e[1];
      ls.push(ls[ls.length - 1] + Math.hypot(x - xs[xs.length - 1], y - ys[ys.length - 1]));
      xs.push(x);
      ys.push(y);
    }
    p0 = e;
  }
  return { xs, ys, ls };
}
const SAMPLES = { cableA: sampleCable(CABLES.cableA.on), cableB: sampleCable(CABLES.cableB.on) };

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
  { id: 'mic.out', x: 104, text: 'OUT' },
  { id: 'mixer.in', x: 153, text: 'IN' },
  { id: 'mixer.out', x: 207, text: 'OUT' },
  { id: 'speaker.in', x: 259, text: 'IN' },
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
  const pulseProps = (smp: { xs: number[]; ys: number[]; ls: number[] }, phase: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => {
      const u = (t.value + phase) % 1;
      const total = smp.ls[smp.ls.length - 1];
      const target = u * total;
      let i = 1;
      while (i < smp.ls.length - 1 && smp.ls[i] < target) i++;
      const seg = smp.ls[i] - smp.ls[i - 1];
      const f = seg > 0 ? (target - smp.ls[i - 1]) / seg : 0;
      const x = smp.xs[i - 1] + (smp.xs[i] - smp.xs[i - 1]) * f;
      const y = smp.ys[i - 1] + (smp.ys[i] - smp.ys[i - 1]) * f;
      return { cx: x, cy: y, opacity: 0.35 + 0.65 * Math.sin(Math.PI * u) };
    });
  const pA0 = pulseProps(SAMPLES.cableA, 0);
  const pA1 = pulseProps(SAMPLES.cableA, 0.5);
  const pB0 = pulseProps(SAMPLES.cableB, 0);
  const pB1 = pulseProps(SAMPLES.cableB, 0.5);
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
    const g = pulled ? c.pulled : c.on;
    const d = cablePath(g);
    const [ex, ey] = cableEnd(g);
    // Cable A starts AT the mic's tail (no plug body there: the mic's own
    // connector is the tail); cable B starts with its plug tucked behind the
    // mixer's right side. Drawn BEFORE the gear they enter, so each plug goes
    // in behind the device's edge instead of floating in front of / beside it.
    return (
      <G key={id} opacity={visible(id) ? 1 : 0.3}>
        {hl || mark ? (
          <Path d={d} stroke={mark === 'wrong' ? RED : mark === 'right' ? GREEN : AMBER} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.28} />
        ) : null}
        {/* the jacket, then a highlight line for a round-cable look */}
        <Path d={d} stroke="#07080a" strokeWidth={3.6} strokeLinecap="butt" fill="none" />
        <Path d={d} stroke={on ? '#2b3a52' : '#26282e'} strokeWidth={2.3} strokeLinecap="butt" fill="none" />
        <Path d={d} stroke="#fff" strokeWidth={0.6} strokeLinecap="butt" fill="none" opacity={0.18} transform="translate(0,-0.6)" />
        {/* plug bodies: cable B's source plug (behind the mixer) and the far
            end — in its jack, or lying loose on the floor when unplugged */}
        {id === 'cableB' ? (
          <Rect x={g.start[0] - 3} y={g.start[1] - 3.5} width={6} height={7} rx={1.4} fill="#8d939c" stroke="#000" strokeWidth={0.5} />
        ) : null}
        {pulled ? (
          <Rect x={ex} y={ey - 2.3} width={8} height={4.6} rx={1.4} fill="#8d939c" stroke="#000" strokeWidth={0.5} />
        ) : (
          <Rect x={ex - 3} y={ey - 3.5} width={6} height={7} rx={1.4} fill="#8d939c" stroke="#000" strokeWidth={0.5} />
        )}
        {on && !pulled ? (
          <>
            <ACircle r={2.1} fill={BLUE} animatedProps={id === 'cableA' ? pA0 : pB0} />
            <ACircle r={2.1} fill={BLUE} animatedProps={id === 'cableA' ? pA1 : pB1} />
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
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" height="100%" viewBox={`0 0 ${PATH_VB_W} ${PATH_VB_H}`}>
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
          {/* a singer: the owner's SIDE head icon, the mouth open toward the
              mic (head fix 2026-10-08 — a lone head uses the shared icon). */}
          <HeadIconSvg view="side" facing="right" speaking anchor="center" x={X.voice} y={CY} size={HEAD_PX} color={HEAD_GLYPH_INK} minStroke={1.4} />
        </G>
        <G opacity={visible('mic') ? 1 : 0.3}>{airArcs(52, soundLeftOn && visible('mic'), 'airA')}</G>
        <GearInSvg kind="vocalMic" id="sh-mic" x={X.mic} y={CY} size={48} dim={!visible('mic')} />
        {/* cables before the mixer and the speaker: their plugs go in BEHIND
            the gear's side (rear-panel jacks), never in front of it */}
        {cable('cableA')}
        {cable('cableB')}
        <GearInSvg kind="console" id="sh-mixer" x={X.mixer} y={CY} size={60} dim={!visible('mixer')} />
        <GearInSvg kind="poweredSpeaker" id="sh-spk" x={X.speaker} y={CY} size={62} dim={!visible('speaker')} />
        {/* an unplugged cable leaves an EMPTY jack, marked on the device edge */}
        {(['cableA', 'cableB'] as const).map((cid) =>
          unplug === cid ? (
            <Circle key={`open-${cid}`} cx={CABLES[cid].jack[0]} cy={CABLES[cid].jack[1]} r={2.2} fill="#07080a" stroke={RED} strokeWidth={1} opacity={visible(cid) ? 1 : 0.3} />
          ) : null,
        )}
        <G opacity={visible('listener') ? 1 : 0.3}>{airArcs(298, soundRightOn, 'airB')}</G>
        <G opacity={visible('listener') ? (soundRightOn ? 1 : 0.55) : 0.3}>
          <HeadIconSvg view="side" facing="left" anchor="center" x={X.listener} y={CY} size={HEAD_PX} color={HEAD_GLYPH_INK} minStroke={1.4} />
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
                  <Rect x={j.x - 12} y={104} width={24} height={14} rx={3} fill="#0b0c10" stroke={col} strokeWidth={hl || mark ? 1.6 : 1} opacity={0.95} />
                  <SvgText x={j.x} y={114.5} fill={col} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={0.6}>
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
