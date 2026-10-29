/** Speech & Voice Lab — modules 6–10 + checks: pop filters, sibilance, distance, voices, problem simulator.
 *
 * Legibility pass (owner 2026-09-25): every drawing sits in an ExpandableFigure
 * (labels ≥ 9 pt, "⤢ FULL SCREEN" under it) and each page builds its picker
 * ONCE and hands the same element to the page AND to the figure's `controls`. */
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { HeadIconSvg } from '../../../features/lab/headIconsSvg';
import {
  DISTANCE_PRESETS, PROBLEMS, PROBLEM_TRACE_MS, SPEECH_CHECKS, VOICE_RANGES, distanceEffect, plosiveTrace, problemSpectrum, problemTrace, sibilanceSpectra, voiceSpectrum, type ProblemId,
} from '../../../features/speech/speechModel';
import type { PageCtx } from '../kit/PagedLab';
import { ExpandableFigure } from '../kit/ExpandableFigure';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { RangeBars, SpectrumBars, SpectrumSvg, Title, TraceChart, TraceSvg } from './speechViz';
import { Notice, SpeechCheckCard } from './speechPagesA';
import { PLOSIVE_DUR_MS } from '../../../features/speech/speechSignals';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAnimationsAllowed } from '../../../features/settings/a11y';
import { DistanceScene } from './distanceViz';
import { useLoopClock } from './speechMotion';

const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);
const ALine = Animated.createAnimatedComponent(Line);

const F = fonts.barlowMedium;

// NEW COPY: every Notice line in this file.

/* ── 6 pop filters ─────────────────────────────────────────────────────── */

/** Mouth → (pop filter) → capsule, as a slow-motion replay of one "P"
 *  (2026-10-14 redraw). Cyan: the SOUND — a pressure front from the burst,
 *  then the vowel's fronts — which crosses the mesh untouched. Orange: the AIR
 *  itself, a slow puff that the mesh breaks into scattered eddies, or that
 *  reaches the capsule and shoves its diaphragm. Reduced motion / Low-Light:
 *  one still moment of the same scene. Exported for the design harness. */
const POP_PERIOD = 3.4;
const POP_MX = 44, POP_MY = 62, POP_FX = 148, POP_CX = 236;
const SOUND_SPEED = 560; // units/s on screen (slow motion)
const SOUND_EMIT = [0, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45];
function popFront(t: number, e: number): { d: string; o: number } {
  'worklet';
  const r = 10 + (t - e) * SOUND_SPEED;
  if (t < e || r > 214) return { d: 'M0 0', o: 0 };
  const a = (40 * Math.PI) / 180;
  const x1 = POP_MX + r * Math.cos(-a), y1 = POP_MY + r * Math.sin(-a);
  const x2 = POP_MX + r * Math.cos(a), y2 = POP_MY + r * Math.sin(a);
  return { d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, o: (e === 0 ? 0.95 : 0.45) * (1 - r / 240) };
}
/** Puff centre x at time t (it slows as it spreads), and whether the mesh has caught it. */
function popPuff(t: number, withFilter: boolean): { x: number; caught: number } {
  'worklet';
  const k = Math.max(0, Math.min(1, (t - 0.08) / 1.9));
  const x = POP_MX + 6 + (POP_CX - 4 - POP_MX - 6) * (1 - (1 - k) * (1 - k));
  if (!withFilter || x < POP_FX - 7) return { x, caught: -1 };
  // time since it reached the mesh
  const kHit = 1 - Math.sqrt(1 - (POP_FX - 7 - POP_MX - 6) / (POP_CX - 4 - POP_MX - 6));
  const tHit = 0.08 + kHit * 1.9;
  return { x: POP_FX - 7, caught: Math.max(0, t - tHit) };
}

function PopFilterSvg({ withFilter, w, h }: { withFilter: boolean; w: number; h: number }) {
  const W = 340, H = 118;
  const mx = POP_MX, my = POP_MY, fx = POP_FX, cx = POP_CX;
  const puffId = `puff${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { t } = useLoopClock(POP_PERIOD, 1.25);
  const wf = useSharedValue(withFilter ? 1 : 0);
  useEffect(() => { wf.value = withFilter ? 1 : 0; }, [withFilter, wf]);
  const front = (e: number) => () => {
    'worklet';
    const f = popFront(t.value, e);
    return { d: f.d, opacity: f.o };
  };
  const f0 = useAnimatedProps(front(SOUND_EMIT[0])), f1 = useAnimatedProps(front(SOUND_EMIT[1])), f2 = useAnimatedProps(front(SOUND_EMIT[2]));
  const f3 = useAnimatedProps(front(SOUND_EMIT[3])), f4 = useAnimatedProps(front(SOUND_EMIT[4])), f5 = useAnimatedProps(front(SOUND_EMIT[5])), f6 = useAnimatedProps(front(SOUND_EMIT[6]));
  const fronts = [f0, f1, f2, f3, f4, f5, f6];
  const puff = (dy: number, r0: number) => () => {
    'worklet';
    const p = popPuff(t.value, wf.value > 0.5);
    const prog = (p.x - mx) / (cx - mx);
    const alive = t.value > 0.08 && t.value < 2.6;
    const fade = p.caught >= 0 ? Math.max(0, 1 - p.caught / 0.25) : 1;
    return { cx: p.x - Math.abs(dy) * 0.6, cy: my + dy * (1 + prog * 1.4), r: r0 + prog * 4, opacity: alive ? 0.9 * fade : 0 };
  };
  const p0 = useAnimatedProps(puff(0, 8)), p1 = useAnimatedProps(puff(-5, 6)), p2 = useAnimatedProps(puff(5, 6));
  // eddies behind the mesh: the jet's push broken into small, slow swirls that die out
  const eddy = (ang: number, sp: number) => () => {
    'worklet';
    const p = popPuff(t.value, wf.value > 0.5);
    if (p.caught < 0) return { cx: fx + 6, cy: my, opacity: 0 };
    const s = Math.min(1, p.caught / 0.9);
    return { cx: fx + 6 + Math.cos(ang) * sp * s, cy: my + Math.sin(ang) * sp * s, opacity: 0.7 * (1 - s) };
  };
  const e0 = useAnimatedProps(eddy(-0.9, 26)), e1 = useAnimatedProps(eddy(-0.35, 34)), e2 = useAnimatedProps(eddy(0.1, 30)), e3 = useAnimatedProps(eddy(0.55, 36)), e4 = useAnimatedProps(eddy(1.0, 24)), e5 = useAnimatedProps(eddy(-0.1, 18));
  const eddies = [e0, e1, e2, e3, e4, e5];
  // the diaphragm: a tiny tick when the sound arrives, a big shove from an unfiltered puff
  const tSound = (cx + 24 - mx - 10) / SOUND_SPEED;
  const tAir = 0.08 + 1.9; // the puff reaches the capsule (no filter)
  const dia = (which: 'sound' | 'air') => () => {
    'worklet';
    const tt = t.value;
    const ds = tt > tSound ? 0.9 * Math.exp(-(tt - tSound) / 0.06) : 0;
    const da = wf.value < 0.5 && tt > tAir - 0.05 ? 5 * Math.sin(Math.PI * Math.min(1, (tt - tAir + 0.05) / 0.6)) : 0;
    const dx = ds + Math.max(0, da);
    const air = da > 0.2;
    return { x1: cx + 24 + dx, x2: cx + 24 + dx, opacity: which === 'air' ? (air ? 1 : 0) : air ? 0 : 1 };
  };
  const dS = useAnimatedProps(dia('sound')), dA = useAnimatedProps(dia('air'));
  const jetEnd = withFilter ? fx - 6 : cx - 2;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <RadialGradient id={puffId} cx={0.5} cy={0.5} r={0.5}>
          <Stop offset={0} stopColor={colors.orange} stopOpacity={0.95} />
          <Stop offset={0.6} stopColor={colors.orange} stopOpacity={0.5} />
          <Stop offset={1} stopColor={colors.orange} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      {/* the talker — the owner's SIDE head icon facing the mic, the mouth
          open on the "P" (head fix 2026-10-08: a lone head uses the shared
          icon). The mouth sits on the jet's origin; the back of the skull
          crops off the left edge, as the head spec allows. */}
      <HeadIconSvg view="side" facing="right" speaking x={mx - 2} y={my} size={96} plate />
      <SvgText x={66} y={104} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>"P"</SvgText>
      {/* the jet's path, faint (where the air would go) */}
      {[-1, 0, 1].map((k) => {
        const y1 = my + k * 3, y2 = my + k * (withFilter ? 9 : 14);
        return <Path key={k} d={`M ${mx + 2} ${y1} C ${mx + 40} ${y1} ${jetEnd - 40} ${y2} ${jetEnd} ${y2}`} fill="none" stroke={colors.orange} strokeWidth={1} opacity={0.28} strokeDasharray="3,3" />;
      })}
      {/* sound fronts — pass the mesh either way */}
      {fronts.map((ap, i) => <APath key={`f${i}`} animatedProps={ap} d="M0 0" fill="none" stroke={colors.cyanBright} strokeWidth={i === 0 ? 1.6 : 1.1} opacity={0} />)}
      {/* the air puff */}
      {[p0, p1, p2].map((ap, i) => <ACircle key={`p${i}`} animatedProps={ap} cx={mx} cy={my} r={4} fill={`url(#${puffId})`} opacity={0} />)}
      {withFilter ? (
        <>
          {/* the mesh, seen edge-on */}
          <Rect x={fx - 3} y={12} width={7} height={86} rx={3.5} fill="#26262b" stroke={colors.textSecondary} strokeWidth={1} />
          {Array.from({ length: 15 }, (_, i) => <Line key={i} x1={fx - 1.5} y1={17 + i * 5.5} x2={fx + 1.5} y2={17 + i * 5.5} stroke={colors.textMuted} strokeWidth={0.8} />)}
          {eddies.map((ap, i) => <ACircle key={`e${i}`} animatedProps={ap} cx={fx + 6} cy={my} r={2.2} fill="none" stroke={colors.orange} strokeWidth={1} opacity={0} />)}
          <Rect x={fx - 25} y={101} width={50} height={13} rx={3} fill="#0a0a0c" opacity={0.9} />
          <SvgText x={fx} y={110} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>pop filter</SvgText>
        </>
      ) : null}
      {/* microphone (art pass 2026-10-10): a side-address large-diaphragm
          condenser seen from the side, ~1 viewBox unit per mm — headbasket
          Ø55 × 64 mm with its mesh, the 1-inch (Ø34 mm) capsule inside
          standing edge-on to the talker so its front diaphragm faces the
          mouth, the Ø50 body continuing below. */}
      <Path d={`M ${cx + 3} ${H} L ${cx + 3} 92 Q ${cx + 3} 88 ${cx + 7} 88 L ${cx + 49} 88 Q ${cx + 53} 88 ${cx + 53} 92 L ${cx + 53} ${H} Z`} fill="#1c1c22" stroke={colors.textMuted} strokeWidth={1} />
      <Rect x={cx + 4} y={84} width={48} height={5} rx={1.5} fill="#2c2c33" stroke="#3a3a42" strokeWidth={0.8} />
      <Rect x={cx} y={20} width={56} height={66} rx={26} fill="#121216" stroke={colors.textMuted} strokeWidth={1.2} />
      {[28, 36, 44, 52, 60, 68, 76].map((y) => {
        // mesh rows clipped to the basket's stadium outline (r 26, straight between y 46…60)
        const dy = y < 46 ? 46 - y : y > 60 ? y - 60 : 0;
        const hw = 2 + Math.sqrt(Math.max(0, 25 * 25 - dy * dy));
        return <Line key={`h${y}`} x1={cx + 28 - hw + 1} y1={y} x2={cx + 28 + hw - 1} y2={y} stroke="#2a2a32" strokeWidth={0.9} />;
      })}
      {[12, 20, 28, 36, 44].map((x) => {
        const dx = Math.abs(x - 28) - 2;
        const hh = 7 + Math.sqrt(Math.max(0, 25 * 25 - Math.max(0, dx) ** 2));
        return <Line key={`v${x}`} x1={cx + x} y1={53 - hh + 1} x2={cx + x} y2={53 + hh - 1} stroke="#2a2a32" strokeWidth={0.9} />;
      })}
      {/* the capsule edge-on: its ring, the backplate, the front diaphragm (moved by what arrives) */}
      <Rect x={cx + 24} y={36} width={8} height={34} rx={2} fill="#2e2e36" stroke="#4a4a54" strokeWidth={0.8} />
      <Line x1={cx + 28} y1={38} x2={cx + 28} y2={68} stroke="#5a5a64" strokeWidth={1} />
      <ALine animatedProps={dS} x1={cx + 24} y1={37} x2={cx + 24} y2={69} stroke={colors.cyanBright} strokeWidth={2.5} strokeLinecap="round" />
      <ALine animatedProps={dA} x1={cx + 24} y1={37} x2={cx + 24} y2={69} stroke={colors.orange} strokeWidth={2.5} strokeLinecap="round" opacity={0} />
      <Line x1={cx + 33} y1={53} x2={cx + 60} y2={53} stroke={colors.textMuted} strokeWidth={0.6} />
      <SvgText x={cx + 62} y={56} fontSize={9} fill={colors.textMuted} textAnchor="start" fontFamily={F}>capsule</SvgText>
      {/* legend — on a backing plate so the fronts never run through the
          words, and ending short of the pop-filter mesh (x 145) */}
      <Rect x={56} y={4} width={84} height={14} rx={3} fill="#0a0a0c" opacity={0.9} />
      <SvgText x={60} y={14} fontSize={9} fill={colors.orange} fontFamily={F}>● air</SvgText>
      <SvgText x={96} y={14} fontSize={9} fill={colors.cyanBright} fontFamily={F}>) sound</SvgText>
    </Svg>
  );
}

export function PopFilterDiagram({ withFilter, controls }: { withFilter: boolean; controls?: ReactNode }) {
  const W = 340, H = 118;
  const note = 'Slow motion, with the gap squeezed: in real life the sound travels about 100 times faster than the puff of air.';
  return (
    <View style={{ gap: 4 }}>
      <ExpandableFigure aspect={W / H} title="PLOSIVE" badge={note} controls={controls} render={(w, h) => (
        <View accessible accessibilityLabel={withFilter ? 'Slow-motion replay of a P with a pop filter: the sound front passes the mesh and reaches the capsule; the slower puff of air hits the mesh and breaks into small eddies that die out before the microphone.' : 'Slow-motion replay of a P with no filter: the sound front reaches the capsule first, then the slower puff of air arrives and shoves the diaphragm hard.'} style={{ width: w, height: h }}>
          <PopFilterSvg withFilter={withFilter} w={w} h={h} />
        </View>
      )} />
      <Text style={styles.foot}>{note}</Text>
    </View>
  );
}

export function PagePopFilter({ ctx }: { ctx: PageCtx }) {
  const [withFilter, setWithFilter] = useState(false);
  const wave = useMemo(() => plosiveTrace(withFilter), [withFilter]);
  const toggle = (
    <Row>
      <Btn label="NO FILTER" tone={!withFilter ? 'primary' : 'plain'} onPress={() => { setWithFilter(false); if (!ctx.isDone) ctx.markDone(); }} />
      <Btn label="WITH A POP FILTER" tone={withFilter ? 'primary' : 'plain'} onPress={() => { setWithFilter(true); if (!ctx.isDone) ctx.markDone(); }} />
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>A "P" is two things at once: a small sound, and a gust of air. The microphone hears both — the gust as a huge low thump.</Lead>
      {toggle}
      <PopFilterDiagram withFilter={withFilter} controls={toggle} />
      <TraceChart wave={wave} durMs={PLOSIVE_DUR_MS} title={withFilter ? '"PA" AT THE CAPSULE · WITH A POP FILTER' : '"PA" AT THE CAPSULE · NO FILTER'} a11y={withFilter ? 'Waveform of "pa", 200 milliseconds: silence while the lips are closed, a short click as they part, a breathy rush, then the vowel, with only a faint slow ripple where the air arrives.' : 'Waveform of "pa", 200 milliseconds: the same click as the lips part, then a huge slow swing — the air jet — reaching nearly full scale and swamping the breath and the start of the vowel.'} controls={toggle} />
      <Notice>The click when the lips part (at 20 ms) is identical in both traces. The filter all but removes the slow swing, not the consonant — and notice how close to full scale the bare swing gets.</Notice>
      <Card>
        <Eyebrow>WHY THE MESH WORKS</Eyebrow>
        <Body>Sound is a tiny pressure ripple that passes through a fine mesh almost untouched. The plosive gust is a stream of moving air; the mesh breaks the stream into turbulence and spreads it out, so the jet never arrives at the capsule as one push. The consonant stays, the thump mostly goes.</Body>
        <Body>Same idea, other tools: a foam windscreen, speaking slightly past the capsule instead of into it, or a mic placed above the mouth line.</Body>
      </Card>
    </View>
  );
}

/* ── 7 sibilance ───────────────────────────────────────────────────────── */

export function PageSibilance({ ctx }: { ctx: PageCtx }) {
  const { s: sib, ah } = sibilanceSpectra();
  const [show, setShow] = useState<'vowel' | 's'>('s');
  const sp = show === 's' ? sib : ah;
  const toggle = (
    <Row>
      <Btn label="VOWEL · AH" tone={show === 'vowel' ? 'primary' : 'plain'} onPress={() => { setShow('vowel'); if (!ctx.isDone) ctx.markDone(); }} />
      <Btn label={'"S"'} tone={show === 's' ? 'primary' : 'plain'} onPress={() => { setShow('s'); if (!ctx.isDone) ctx.markDone(); }} a11y="The S sound" />
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Say a long "sss". No pitch, just hiss — air squeezed through a narrow gap and broken up on the edge of the teeth. That turbulence is sibilance.</Lead>
      {toggle}
      <SpectrumBars hz={sp.hz} db={sp.db} ghostDb={show === 's' ? ah.db : undefined} band={[4000, 10000]} bandKind="excess" bandLabel="S LIVES HERE" title={show === 's' ? '"S" · ENERGY 4–10 kHz · VOWEL IN GRAY' : 'VOWEL "AH" · ENERGY MOSTLY BELOW 1.5 kHz'} a11y={show === 's' ? 'Spectrum of an S: almost nothing below 2 kilohertz, most energy between 4 and 10 kilohertz, far above the vowel.' : 'Spectrum of the vowel AH: harmonics of the voice with peaks near 700 hertz and 1.1 kilohertz; above 4 kilohertz it falls below the bottom of the scale.'} controls={toggle} />
      <Notice>Flip between the two: the vowel and the S barely overlap. That gap is what a de-esser exploits — and what a presence boost accidentally targets.</Notice>
      <Card>
        <Eyebrow>WHY IT EXISTS</Eyebrow>
        <Body>The tongue almost touches the ridge behind the upper teeth, leaving a channel a millimeter or two wide. Air forced through it goes turbulent and hits the lower front teeth — a noise source whose energy sits roughly between 4 and 10 kHz, a band the ear picks out easily.</Body>
        <Eyebrow>WHY IT GETS WORSE</Eyebrow>
        <Body>Bright condenser microphones and presence boosts lift exactly that band. Close placement puts the mic in the jet. Some voices and some dental shapes simply make more of it.</Body>
        <Eyebrow>WHAT TO DO</Eyebrow>
        <Body>Placement first: a few degrees off-axis, a little more distance. Then EQ gently. Then a de-esser — a compressor that listens only to the hiss band. The De-Esser lab shows how it decides.</Body>
      </Card>
    </View>
  );
}

/* ── 8 distance ────────────────────────────────────────────────────────── */

/** Horizontal signed-dB bars with a labelled axis. Exported for the design
 *  harness; not used elsewhere. */
export function DbBars({ rows, a11y, controls }: { rows: { label: string; db: number; color: string }[]; a11y?: string; controls?: ReactNode }) {
  const W = 340, rowH = 26, H = rows.length * rowH + 26;
  const lo = -40, hi = 66;
  const x = (db: number) => 96 + ((Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * (W - 106);
  // A positive value's label sits just past the bar tip; when that would run
  // off the panel it flips INSIDE the bar (black on the bar colour) instead.
  const LABEL_W = 38;
  const inside = (db: number) => db >= 0 && x(db) + 4 + LABEL_W > W - 6;
  const labelX = (db: number) => (db < 0 ? x(db) - 4 : inside(db) ? x(db) - 4 : x(db) + 4);
  const ticks = [-40, -20, 0, 20, 40, 60];
  return (
    <ExpandableFigure aspect={W / H} title="DISTANCE" controls={controls} render={(w, h) => (
    <View accessible={!!a11y} accessibilityLabel={a11y} style={{ width: w, height: h }}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={x(t)} y1={4} x2={x(t)} y2={H - 18} stroke={t === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'} />
          <SvgText x={x(t)} y={H - 6} fontSize={9} fill={t === 0 ? colors.textSecondary : colors.textMuted} textAnchor="middle" fontFamily={F}>{t > 0 ? `+${t}` : t}{t === 0 ? ' dB' : ''}</SvgText>
        </G>
      ))}
      {rows.map((r, i) => {
        const y = 6 + i * rowH;
        const x0 = Math.min(x(0), x(r.db)), w = Math.abs(x(r.db) - x(0));
        const flipped = inside(r.db);
        return (
          <G key={r.label}>
            <SvgText x={90} y={y + 13} fontSize={9} fill={colors.textSecondary} textAnchor="end" fontFamily={F}>{r.label}</SvgText>
            <DbBarRect x0={x0} w={w} y={y + 3} color={r.color} opacity={flipped ? 0.9 : 0.75} />
            <SvgText x={labelX(r.db)} y={y + 13} fontSize={9} fill={flipped ? '#000' : r.color} textAnchor={r.db >= 0 && !flipped ? 'start' : 'end'} fontFamily={F}>{r.db > 0 ? '+' : ''}{r.db.toFixed(0)} dB</SvgText>
          </G>
        );
      })}
    </Svg>
    </View>
    )} />
  );
}

export function PageDistance({ ctx }: { ctx: PageCtx }) {
  const [inches, setInches] = useState<number>(6);
  const d = distanceEffect(inches);
  const rows = [
    { label: 'Direct voice', db: d.directDb, color: colors.cyanBright },
    { label: 'Room (reflections)', db: d.roomDb, color: colors.textSecondary },
    { label: 'Plosive air', db: d.plosiveDb, color: colors.orange },
    { label: 'Proximity bass', db: d.proximityDb, color: colors.gold },
    { label: 'Voice over noise', db: d.snrDb, color: colors.green },
  ];
  // The live numbers, one line: on the drawing's bars and at the top of the
  // full-screen dock (parity pass 2026-09-26).
  const distRead = (
    <Text style={styles.readout} numberOfLines={2}>
      {inches}" · direct {d.directDb >= 0 ? '+' : ''}{d.directDb.toFixed(0)} dB · room {d.roomDb} dB · plosive {d.plosiveDb >= 0 ? '+' : ''}{d.plosiveDb.toFixed(0)} dB · bass {d.proximityDb >= 0 ? '+' : ''}{d.proximityDb.toFixed(0)} dB · voice over noise {d.snrDb >= 0 ? '+' : ''}{d.snrDb.toFixed(0)} dB
    </Text>
  );
  const picker = (
    <Row>
      {DISTANCE_PRESETS.map((p) => <Btn key={p} label={`${p}"`} tone={inches === p ? 'primary' : 'plain'} onPress={() => { setInches(p); if (!ctx.isDone) ctx.markDone(); }} a11y={`${p} inch${p === 1 ? '' : 'es'}`} />)}
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Distance is the biggest control you have and it costs nothing. Every bar is relative to the voice at 12 inches — except Voice over noise, which is how far the voice sits above the room's noise floor.</Lead>
      {picker}
      <DistanceScene inches={inches} a11y={`To scale: the talker and a microphone ${inches} inch${inches === 1 ? "" : "es"} from the lips. The direct sound fades as it spreads; the room reflections reach the mic from every direction at the same strength wherever it stands.`} />
      <DbBars rows={rows} controls={<View style={{ gap: 8 }}>{distRead}{picker}</View>} a11y={`At ${inches} inches: direct voice ${d.directDb.toFixed(0)} dB, room ${d.roomDb} dB, plosive air ${d.plosiveDb.toFixed(0)} dB, proximity bass ${d.proximityDb.toFixed(0)} dB, voice over noise ${d.snrDb.toFixed(0)} dB, all relative and illustrative.`} />
      <Text style={styles.foot}>Relative, illustrative values — inverse-square for the voice, a much steeper fall for the air jet, a typical cardioid proximity curve, a fixed room and noise floor.</Text>
      <Notice>Switch between 12", 6" and 1" and watch two bars: the room never moves, and the plosive bar moves far faster than the voice.</Notice>
      <Card>
        <Eyebrow>{inches}" · WHAT CHANGES</Eyebrow>
        <Body>{inches === 1
          ? 'Very close: the voice is loud and dry and the room disappears — but every plosive is a gust in the capsule, the bass lift is large, and moving an inch changes everything.'
          : inches === 6
            ? 'The working distance for most speech: strong direct sound, the room well below it, a modest warmth from proximity — and plosives starting to matter: on-axis at 6 inches a pop filter earns its place.'
            : 'About a foot away: natural and forgiving of movement, but the room is only about 14 dB down and the gain you add to compensate brings the noise up with it.'}</Body>
        <Body>Direct sound falls 6 dB per doubling of distance; the reverberant room sound stays nearly the same. That ratio — direct to room — is what "close" and "far" actually sound like.</Body>
      </Card>
      <SpeechCheckCard id="distance-6in" />
    </View>
  );
}

/* ── 9 voices ──────────────────────────────────────────────────────────── */

export function PageVoices({ ctx }: { ctx: PageCtx }) {
  const cols = [colors.blue, colors.gold, colors.green];
  return (
    <View style={{ gap: 12 }}>
      <Lead>Pitch comes from fold length, mass and tension; formant height comes from vocal-tract length. Both vary from person to person far more than the labels suggest.</Lead>
      <RangeBars
        ranges={VOICE_RANGES}
        colors={cols}
        a11y={`Typical speaking pitch and formant ranges, 60 hertz to 4 kilohertz: ${VOICE_RANGES.map((r) => `${r.name}, pitch ${r.f0LoHz} to ${r.f0HiHz} hertz, typical about ${r.f0TypicalHz}; formants F1 to F3 from ${r.fmLoHz} to ${r.fmHiHz} hertz`).join('. ')}. Typical, overlapping in real people, not fixed.`}
      />
      <Notice>The pitch pills nearly touch and real voices spill past their edges — the gaps between them are an artefact of averaging, not a rule.</Notice>
      <Notice>The thin ticks across each formant band are that voice's harmonics at its typical pitch: packed close for a low voice, far apart for a child. The mouth can only boost harmonics that are there.</Notice>
      <Card tone="note">
        <Eyebrow>TYPICAL, NOT FIXED</Eyebrow>
        {/* NEW COPY ("a tenor speaks above many women" replaced — true of singing range, not speaking pitch) */}
        <Body>These are population averages for speaking pitch. Real voices overlap freely: a low female voice sits inside the male band, a high male voice reaches into the female band, and a child's range depends on age. Treat the bands as starting points for gain and EQ, never as rules about the person.</Body>
      </Card>
      {VOICE_RANGES.map((r) => (
        <Card key={r.id}>
          <Eyebrow>{r.name.toUpperCase()} · ~{r.f0TypicalHz} Hz</Eyebrow>
          <Body>{r.note}</Body>
        </Card>
      ))}
      <Body>For the engineer: a lower fundamental puts more energy in the bottom octaves (mind the proximity effect and the high-pass filter); higher formants push the presence region up — sibilance sits a little higher too.</Body>
      {!ctx.isDone ? <Btn label="GOT IT ›" tone="primary" onPress={ctx.markDone} /> : null}
    </View>
  );
}

/* ── 10 problem simulator ─────────────────────────────────────────────── */

export function PageProblems({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState<ProblemId>('sibilance');
  const p = PROBLEMS.find((o) => o.id === id)!;
  const clean = voiceSpectrum(40);
  const sp = problemSpectrum(id, 40);
  const trace = useMemo(() => (p.visual === 'trace' ? problemTrace(id) : null), [id, p.visual]);
  const picker = (
    <Row>
      {PROBLEMS.map((o) => <Btn key={o.id} label={o.name.toUpperCase()} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} />)}
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Eight things that go wrong between a mouth and a microphone. Each has a cause you can see, and a fix that starts before any processing.</Lead>
      {picker}
      {/* ONE figure hosts both drawings (same 340 × 130 box), so full screen
          stays open when a chip swaps the spectrum for a waveform. */}
      <View style={{ gap: 4 }}>
        <Title>{p.visual === 'spectrum' ? `${p.name.toUpperCase()} · VS A CLEAN VOICE (GRAY)` : `${p.name.toUpperCase()} · WAVEFORM`}</Title>
        <ExpandableFigure aspect={340 / 130} title="PROBLEM" controls={picker} render={(w, h) => (
          p.visual === 'spectrum'
            ? <SpectrumSvg hz={sp.hz} mag={sp.mag} ghost={clean.mag} band={p.band ? [p.band.lo, p.band.hi] : undefined} bandKind={p.band?.kind} bandLabel={p.band?.label} a11y={`Spectrum with ${p.name} compared to a clean voice. ${p.see}`} w={w} h={h} />
            : <TraceSvg wave={trace ?? new Float64Array(1)} durMs={PROBLEM_TRACE_MS} height={130} a11y={`Waveform showing ${p.name}, ${PROBLEM_TRACE_MS} milliseconds. ${p.see}`} w={w} h={h} />
        )} />
      </View>
      <Notice>{p.see}</Notice>
      <Card>
        <Eyebrow>CAUSE</Eyebrow>
        <Body>{p.cause}</Body>
        <Eyebrow>WHAT YOU HEAR</Eyebrow>
        <Body>{p.hear}</Body>
        <Eyebrow>FIX</Eyebrow>
        <Body>{p.fix}</Body>
      </Card>
    </View>
  );
}

/* ── checks ────────────────────────────────────────────────────────────── */

const FINAL_CHECKS = SPEECH_CHECKS.filter((c) => c.where === 'final');
const PASS_MARK = 5;

export function PageSpeechChecks({ ctx }: { ctx: PageCtx }) {
  const [n, setN] = useState(0);
  const bump = () => setN((c) => c + 1);
  // Marked from an effect, not inside the updater (bug hunt 2026-09-30 day):
  // an updater can run during render, where the host's setState is a React
  // error ("cannot update a component while rendering a different one").
  const { isDone, markDone } = ctx;
  useEffect(() => {
    if (n >= PASS_MARK && !isDone) markDone();
  }, [n, isDone, markDone]);

  // W16 (2026-09-18): Android-only live region; on iOS the score never reached
  // a screen reader on a page that GATES on it. One answer at a time.
  useEffect(() => {
    if (Platform.OS !== 'ios' || n === 0) return;
    AccessibilityInfo.announceForAccessibility(`${n} of ${FINAL_CHECKS.length} correct`);
  }, [n]);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Seven checks, one per idea, in a fresh order each visit. Wrong picks explain themselves — read the note, then try again.</Lead>
      {/* The count is THIS visit's (the cards reshuffle and start fresh each
          visit); the page mark is saved. So a page completed earlier reads
          "0 of 7 correct this visit · page complete" — practice, nothing lost. */}
      <Text style={styles.foot} accessibilityLiveRegion="polite">{n} of {FINAL_CHECKS.length} correct this visit{ctx.isDone ? ' · page complete' : ` · ${PASS_MARK} completes the page`}</Text>
      {FINAL_CHECKS.map((c) => <SpeechCheckCard key={c.id} id={c.id} onCorrect={bump} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
  readout: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, paddingHorizontal: 2 },
});

/** A dB bar that glides to its new length (a Path, so it animates natively —
 *  x/width on <Rect> do not ride Reanimated's prop path reliably). */
function barD(x: number, y: number, w: number): string {
  'worklet';
  const ww = Math.max(1.5, w), r = Math.min(3, ww / 2);
  return `M ${(x + r).toFixed(1)} ${y} H ${(x + ww - r).toFixed(1)} Q ${(x + ww).toFixed(1)} ${y} ${(x + ww).toFixed(1)} ${y + r} V ${y + 14 - r} Q ${(x + ww).toFixed(1)} ${y + 14} ${(x + ww - r).toFixed(1)} ${y + 14} H ${(x + r).toFixed(1)} Q ${x.toFixed(1)} ${y + 14} ${x.toFixed(1)} ${y + 14 - r} V ${y + r} Q ${x.toFixed(1)} ${y} ${(x + r).toFixed(1)} ${y} Z`;
}
function DbBarRect({ x0, w, y, color, opacity }: { x0: number; w: number; y: number; color: string; opacity: number }) {
  const motionOk = useAnimationsAllowed();
  const sx = useSharedValue(x0), sw = useSharedValue(w);
  useEffect(() => {
    const to = (v: number) => (motionOk ? withTiming(v, { duration: 520, easing: Easing.inOut(Easing.cubic) }) : v);
    sx.value = to(x0);
    sw.value = to(w);
  }, [x0, w, motionOk, sx, sw]);
  const ap = useAnimatedProps(() => ({ d: barD(sx.value, y, sw.value) }));
  return <APath animatedProps={ap} d={barD(x0, y, w)} fill={color} opacity={opacity} />;
}
