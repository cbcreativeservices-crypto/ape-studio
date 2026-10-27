/**
 * STAGE 12 — Labeling, Serviceability & Documentation + service loops
 * (spec §19).
 *
 * The frustration→identity arc, in four phases:
 *  A  THE FRUSTRATION — an installed Rack → Patch panel → Wall sleeve → Stage
 *     box system: 3 identical unlabeled audio cables and 1 network cable. "No signal from Stage
 *     Input 12 — find its cable." Every tap reveals only "unlabeled cable"
 *     (frustrating BY DESIGN, kept short): after 3 taps the lesson lands —
 *     without identity, every fault is archaeology.
 *  B  ASSIGN IDENTITY — label the run to the TRAINING EXAMPLE scheme
 *     (CI_LABEL_SCHEME_NOTE): origin / destination / cable id from option
 *     sets with plausible distractors.
 *  C  TRACE TEST — same four cables, now flagged: find A-012 in seconds,
 *     then the DOCUMENTATION reveal — the cable schedule with A-012's row
 *     highlighted (records must match reality).
 *  D  SERVICE LOOPS — CI_SLACK_SCENARIO: DragSlider "STORED SLACK" over an
 *     honest rack-end loop (taut stub / dressed loop / pathway-blocking
 *     pile); land the good zone and confirm. Slack is intentional — never
 *     one universal length.
 *
 * Completion: A experienced + B labeled + C traced + D landed →
 * onComplete({ documentation, serviceability }) ONCE. Replay via `completed`
 * (pre-revealed). Accessibility: cables are labeled ≥44dp buttons (the SVG is
 * a described visualization), all verdicts announce.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { DragSlider } from '../../foundations/bits';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { Callout, Connector, JacketPath, shade, tint as lighten, SVG_A11Y } from '../svgArt';
import {
  AG,
  APath,
  ARect,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING,
  CI_SPRING_UI,
  Stagger,
  cancelAnimation,
  mapRange,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  useDrawIn,
  useSettle,
  useSharedValue,
  useVeil,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from '../motion';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { CI_CABLE_SCHEDULE, CI_LABEL_SCHEME_NOTE, CI_SLACK_SCENARIO, CI_TRACE_TARGET, type CiScheduleRow } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── fixed system facts ─────────────────────────────────────────────────── */
/** Physical cable order 1..4 → the flag each carries once labeled. */
const CABLE_FLAGS = ['A-010', 'A-011', 'A-012', 'N-004'] as const;
const TARGET_CABLE = CABLE_FLAGS.indexOf(CI_TRACE_TARGET as (typeof CABLE_FLAGS)[number]); // cable 3

/** Phase-B option sets (plausible distractors; correct never first). */
const B_FIELDS = [
  { key: 'origin', label: 'ORIGIN — STAGE END', options: ['R1-PP2-12', 'STG-A-IN12', 'STG-A-IN21'], correctIdx: 1 },
  { key: 'dest', label: 'DESTINATION — RACK END', options: ['R1-PP2-21', 'STG-A-IN12', 'R1-PP2-12'], correctIdx: 2 },
  { key: 'id', label: 'CABLE ID', options: ['A-021', 'A-012', 'N-012'], correctIdx: 1 },
] as const;

/* ── the installed system (training visualization; one SVG, two states) ──
 * Wiring grade R3-CI-01/02 (2026-10-21): every run now starts ON its own
 * rack-end port and ends ON its own stage-box jack, as the schedule says —
 * A-010…A-012 from patch panel PP2 ports 10–12 (XLR-M: the signal leaves the
 * rack end) to stage inputs 10–12 (XLR-F); N-004, the network run, from
 * switch SW1 port 4 in rack R1 to the stage box's etherCON "NET A", drawn in
 * the network colour. The wall plate became what it is on this route: a
 * pass-through SLEEVE the four runs go through (they used to cross the faces
 * of PP2 and a wall plate without landing on either). */
const NET_CABLE = 3; // N-004
const START_Y = [46, 60, 74, 112]; // each run's rack-end port y (PP2 10–12, SW1-04)
const PP2_X = 112; // PP2's port column for 10–12 (the column at 90 is 7–9)
const PP2_ROW_X = [90, PP2_X] as const;
const SW_PORT_X = [21, 29, 37, 45]; // SW1 ports 1–4, on the rack's bottom unit
const SW_Y = 112;
const START_X = [PP2_X, PP2_X, PP2_X, SW_PORT_X[3]];
const W_Y = [62, 70, 78, 86]; // sleeve lane y
const S_Y = [54, 70, 86, 102]; // stage-box jack y
// R7-CI-09: the crossings (the lesson) all happen BEFORE the sleeve — each
// run enters the sleeve already in its stage-jack order, so after the sleeve
// the four only fan out (no crossing) and each has a straight stretch long
// enough for a printed stage-end flag.
const PERM_B = [2, 0, 3, 1]; // cable i → sleeve lane (crossings by design, = PERM_C)
const PERM_C = [2, 0, 3, 1]; // cable i → stage jack (N-004 → row 2, the etherCON)
const STAGE_JACK_X = [272, 326] as const; // the box's two jack columns
const RUN_END_X = 268; // runs end inside the jack's flange, on the jack
const SLEEVE = { x: 206, w: 20, y: 56, h: 36, wallX: 210, wallW: 12 } as const;

/**
 * Each cable changes lane at its OWN x (owner 2026-10-10: cables shown
 * independently, like a line diagram). The crossings stay — they are the
 * lesson — but they are pairwise and steep, never a knot where all four run
 * through one point, so any one cable can still be followed end to end.
 * No lane change happens inside the sleeve, under a flag or under a badge.
 */
// R7-CI-09: run 3 drops out of 74 before run 1 lands on 78, so no two runs
// ever lie side by side 4 apart (they did with the new lanes)
const PW_X = [192, 186, 180, 198]; // start → sleeve lane change, per cable
const WS_X = [231, 231, 231, 231]; // sleeve → stage-jack fan-out (order kept: no crossing)
/** Label flags: on each run just past its rack-end port, and just short of
 *  each stage jack — never over a lane change, so a flag never hides a cable. */
const FLAG_P_X = 124;
const FLAG_S_X = 235.5;
/** R7-CI-09: the stage-end flag prints its ID too: FLAG_S_W wide, between the
 *  fan-out and the stage box's left edge (BOX_X). */
const FLAG_S_W = 28;
const BOX_X = 265;
/** The physical cable numbers, on each run past its rack-end flag. */
const BADGE_X = 168;
function cablePath(i: number): string {
  const r = START_Y[i];
  const wy = W_Y[PERM_B[i]];
  const s = S_Y[PERM_C[i]];
  const a = PW_X[i];
  const b = WS_X[i];
  return `M${START_X[i]} ${r} H${a - 4} C${a} ${r} ${a} ${wy} ${a + 4} ${wy} H${b - 3} C${b} ${wy} ${b} ${s} ${b + 3} ${s} H${RUN_END_X}`;
}
const cableTint = (i: number) => (i === NET_CABLE ? CI_CLASS_TINTS.network : CI_CLASS_TINTS.analog);
/** The trace's highlight: the lab's selection amber (the rack trace's tags
 *  and rings, the schedule's traced row) — never a cable-class tint; the old
 *  green read as the network class (R4-CI-04). */
const TRACE_TINT = colors.amber;

/** Over-estimated run length for the trace draw (over-estimating is safe). */
const CABLE_LEN = 280;

/* ── motion helpers (WhyScene idiom — primitive props only) ─────────────── */
/** A label flag FLIPS open (width springs) and its text settles in after. */
function LabelFlag({
  x,
  y,
  w,
  h,
  tint,
  delay,
  reduce,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tint: string;
  delay: number;
  reduce: boolean;
  children?: ReactNode;
}) {
  const k = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(k);
    if (reduce) {
      k.value = 1;
      return;
    }
    k.value = 0;
    k.value = withDelay(delay, withSpring(1, CI_SPRING_UI));
    return () => cancelAnimation(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, reduce]);
  const flag = useAnimatedProps(() => ({ width: Math.max(0.01, w * k.value), opacity: Math.min(1, k.value * 2.4) }));
  const text = useAnimatedProps(() => ({ opacity: Math.max(0, Math.min(1, (k.value - 0.55) / 0.4)) }));
  return (
    <>
      <ARect
        x={x}
        y={y}
        width={reduce ? w : 0.01}
        height={h}
        rx={1.2}
        fill="#eceae3"
        stroke={tint}
        strokeWidth={tint === TRACE_TINT ? 1.4 : 0.6}
        opacity={reduce ? 1 : 0}
        animatedProps={flag}
      />
      {children ? (
        <AG opacity={reduce ? 1 : 0} animatedProps={text}>
          {children}
        </AG>
      ) : null}
    </>
  );
}

/** THE TRACE: A-012 lights along its full run while a bright beam travels
 *  source → destination. One pass, then the run stays lit. */
function TraceBeam({ d }: { d: string }) {
  const m = useCiMotion();
  const draw = useDrawIn(CABLE_LEN, { run: true, duration: m.d(720) });
  const t = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(140, withTiming(1, { duration: 880, easing: CI_EASE.inOut }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.reduce]);
  const beam = useAnimatedProps(() => ({
    strokeDashoffset: 22 - t.value * (CABLE_LEN + 44),
    opacity: Math.max(0, Math.min(1, Math.min(t.value * 7, (1 - t.value) * 5))),
  }));
  return (
    <>
      <JacketPath d={d} color={TRACE_TINT} width={3.2} pv={draw.progress} len={CABLE_LEN} />
      <APath
        d={d}
        stroke="#fff6dc"
        strokeWidth={4.2}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="22 400"
        strokeDashoffset={22}
        opacity={0}
        animatedProps={beam}
      />
    </>
  );
}

/** A physical cable number, on its run just past its rack-end flag. */
function CableBadge({ i }: { i: number }) {
  return (
    <G>
      <Circle cx={BADGE_X} cy={START_Y[i]} r={6.5} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      <Callout x={BADGE_X} y={START_Y[i] + 3.6} text={String(i + 1)} size={10.5} color={colors.textSecondary} bg={null} />
    </G>
  );
}

/** A panel XLR (D-series flange) seen head-on: female = 3 sockets, male = 3 pins. */
function PanelXlr({ x, y, male = false }: { x: number; y: number; male?: boolean }) {
  return (
    <G>
      <Rect x={x - 5.4} y={y - 6} width={10.8} height={12} rx={1} fill="#1b1c20" stroke="#0a0a0c" strokeWidth={0.4} />
      <Circle cx={x} cy={y} r={4.2} fill="#050506" stroke="#7b7f86" strokeWidth={0.5} />
      {[
        [-1.4, 0.8],
        [1.4, 0.8],
        [0, -1.2],
      ].map(([dx, dy], k) => (
        <Circle key={k} cx={x + dx} cy={y + dy} r={male ? 0.5 : 0.6} fill={male ? '#d9c47a' : '#8d8a7e'} />
      ))}
    </G>
  );
}

/** An etherCON-type panel jack: the same D-series flange, an RJ45 opening. */
function PanelEthercon({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 5.4} y={y - 6} width={10.8} height={12} rx={1} fill="#1b1c20" stroke="#0a0a0c" strokeWidth={0.4} />
      <Circle cx={x} cy={y} r={4.2} fill="#141518" stroke="#7b7f86" strokeWidth={0.5} />
      <Rect x={x - 2.4} y={y - 1.9} width={4.8} height={3.6} rx={0.3} fill="#030304" stroke="#7b7f86" strokeWidth={0.25} />
      <Rect x={x - 0.9} y={y + 1.7} width={1.8} height={0.8} fill="#030304" />
    </G>
  );
}

export function SystemArt({ w, labeled, found }: { w: number; labeled: boolean; found: boolean }) {
  const m = useCiMotion();
  const h = Math.round((w * 150) / 360);
  const veil = useVeil(found, 0.74);
  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 150"
      accessibilityLabel={
        labeled
          ? `Installed system, training visualization: rack R1 with switch SW1, patch panel PP2, a wall sleeve and the stage box. Three audio cables run from PP2 ports 10 to 12 to stage inputs 10 to 12, and one network cable runs from SW1 port 4 to the stage box's NET A jack. Every cable now carries a label flag at both ends: ${CABLE_FLAGS.join(', ')}.${found ? ' Cable A-012 is highlighted.' : ''} Interaction happens in the buttons below.`
          : 'Installed system, training visualization: rack R1 with switch SW1, patch panel PP2, a wall sleeve and the stage box. Three identical unlabeled audio cables run from PP2 to stage inputs, crossing each other on the way, and one unlabeled network cable runs from the switch to the stage box. Interaction happens in the buttons below.'
      }
    >
      <Rect x={2} y={4} width={356} height={144} rx={10} fill="#101014" />
      {/* rack R1: frame, rails, the kit with status LEDs; the bottom unit is
          switch SW1 with its four ports (N-004 leaves port 4) */}
      <Rect x={10} y={16} width={56} height={118} rx={1.4} fill="#23252a" stroke="#0a0a0c" strokeWidth={0.7} />
      <Rect x={14} y={20} width={48} height={110} fill="#0c0c0f" />
      {[24, 44, 64, 84, 104].map((y, i) => (
        <G key={y}>
          <Rect x={16} y={y} width={44} height={16} rx={0.8} fill="#2b2d33" stroke="#101114" strokeWidth={0.4} />
          {i < 4 ? (
            <>
              <Rect x={19} y={y + 3} width={16} height={2} fill="#1a1b1f" />
              <Circle cx={56} cy={y + 4} r={0.9} fill={i % 2 ? '#37d97b' : '#ffc64d'} />
            </>
          ) : (
            SW_PORT_X.map((x) => (
              <G key={x}>
                <Rect x={x - 3} y={SW_Y - 2.4} width={6} height={4.8} rx={0.4} fill="#6d737b" stroke="#2c2f34" strokeWidth={0.3} />
                <Rect x={x - 2.2} y={SW_Y - 1.7} width={4.4} height={3.2} rx={0.3} fill="#050506" />
              </G>
            ))
          )}
        </G>
      ))}
      {/* patch panel PP2: two columns of XLR-M (the rack end of the tie
          lines — the signal leaves here); ports 10–12 are the right column */}
      <Rect x={80} y={36} width={42} height={48} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.7} />
      {PP2_ROW_X.map((x) => (
        <G key={x}>
          {START_Y.slice(0, 3).map((y) => (
            <PanelXlr key={y} x={x} y={y} male />
          ))}
        </G>
      ))}
      {/* the wall, and the pass-through sleeve the runs go through (bushed
          both ends) — no termination here */}
      <Rect x={SLEEVE.wallX} y={24} width={SLEEVE.wallW} height={110} fill="#2a2a2e" />
      <Path d={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => `M${SLEEVE.wallX} ${30 + k * 10} l${SLEEVE.wallW} -6`).join('')} stroke="#3c3c42" strokeWidth={0.6} />
      <Rect x={SLEEVE.x} y={SLEEVE.y} width={SLEEVE.w} height={SLEEVE.h} rx={1.2} fill="#141518" stroke="#9a978e" strokeWidth={0.8} />
      <Rect x={SLEEVE.x - 1.6} y={SLEEVE.y - 2} width={3.2} height={SLEEVE.h + 4} rx={0.8} fill="#4a4c52" stroke="#0a0a0c" strokeWidth={0.4} />
      <Rect x={SLEEVE.x + SLEEVE.w - 1.6} y={SLEEVE.y - 2} width={3.2} height={SLEEVE.h + 4} rx={0.8} fill="#4a4c52" stroke="#0a0a0c" strokeWidth={0.4} />
      {/* stage box: steel box, two columns of XLR-female inputs; the left
          column's second row is the etherCON NET A, named beside it */}
      <Rect x={BOX_X} y={40} width={344 - BOX_X} height={68} rx={2.4} fill="#2b2d33" stroke="#0a0a0c" strokeWidth={0.8} />
      <Rect x={BOX_X + 2} y={42} width={340 - BOX_X} height={3} fill="rgba(255,255,255,0.08)" />
      {S_Y.map((y, row) =>
        STAGE_JACK_X.map((x, col) =>
          col === 0 && row === PERM_C[NET_CABLE] ? <PanelEthercon key={`${x}-${y}`} x={x} y={y} /> : <PanelXlr key={`${x}-${y}`} x={x} y={y} />,
        ),
      )}
      <Callout x={281} y={S_Y[PERM_C[NET_CABLE]] + 3.6} text="NET A" size={10} color="#c9ccd3" bg={null} anchor="start" />
      {/* the four runs: three identical audio lines (crossing on purpose) and
          the network run in the network colour */}
      {[0, 1, 2, 3].map((i) => (
        <JacketPath key={i} d={cablePath(i)} color={cableTint(i)} width={2.4} />
      ))}
      {/* physical cable numbers, on each run past its rack end */}
      {[0, 1, 2, 3].map((i) => (
        <CableBadge key={i} i={i} />
      ))}
      {/* label flags flip open at both ends once identity is assigned */}
      {labeled
        ? [0, 1, 2, 3].map((i) => {
            const p = START_Y[i];
            const s = S_Y[PERM_C[i]];
            const isTarget = found && i === TARGET_CABLE;
            const tint = isTarget ? TRACE_TINT : '#6f7378';
            return (
              <G key={i}>
                <LabelFlag x={FLAG_P_X} y={p - 13} w={36} h={12} tint={tint} delay={i * 80} reduce={m.reduce}>
                  <SvgText x={FLAG_P_X + 18} y={p - 3.6} fontSize={10} fontFamily={fonts.mono} fill="#17181b" textAnchor="middle">
                    {CABLE_FLAGS[i]}
                  </SvgText>
                </LabelFlag>
                <LabelFlag x={FLAG_S_X} y={s - 13} w={FLAG_S_W} h={12} tint={tint} delay={i * 80 + 45} reduce={m.reduce}>
                  <SvgText x={FLAG_S_X + FLAG_S_W / 2} y={s - 3.6} fontSize={10} fontFamily={fonts.oswaldMedium} fill="#17181b" textAnchor="middle">
                    {CABLE_FLAGS[i]}
                  </SvgText>
                </LabelFlag>
              </G>
            );
          })
        : null}
      {/* TRACE MODE — everything dims, then A-012 lights along its whole run */}
      {found ? <ARect x={2} y={4} width={356} height={144} rx={10} fill="#101014" opacity={0} animatedProps={veil.animatedProps} /> : null}
      {found ? (
        <>
          <TraceBeam d={cablePath(TARGET_CABLE)} />
          {/* the traced cable's number, drawn AFTER the beam so the beam
              never paints over badge 3 (R4-CI-04) */}
          <CableBadge i={TARGET_CABLE} />
          <LabelFlag x={FLAG_P_X} y={START_Y[TARGET_CABLE] - 13} w={36} h={12} tint={TRACE_TINT} delay={520} reduce={m.reduce}>
            <SvgText x={FLAG_P_X + 18} y={START_Y[TARGET_CABLE] - 3.6} fontSize={10} fontFamily={fonts.mono} fill="#17181b" textAnchor="middle">
              {CABLE_FLAGS[TARGET_CABLE]}
            </SvgText>
          </LabelFlag>
          <LabelFlag x={FLAG_S_X} y={S_Y[PERM_C[TARGET_CABLE]] - 13} w={FLAG_S_W} h={12} tint={TRACE_TINT} delay={560} reduce={m.reduce}>
            <SvgText x={FLAG_S_X + FLAG_S_W / 2} y={S_Y[PERM_C[TARGET_CABLE]] - 3.6} fontSize={10} fontFamily={fonts.oswaldMedium} fill="#17181b" textAnchor="middle">
              {CABLE_FLAGS[TARGET_CABLE]}
            </SvgText>
          </LabelFlag>
        </>
      ) : null}
      {/* node names */}
      <Callout x={38} y={146} text="RACK R1" size={10.5} color="#9ea3ad" bg={null} />
      <Callout x={101} y={146} text="PATCH PP2" size={10.5} color="#9ea3ad" bg={null} />
      <Callout x={216} y={146} text="WALL SLEEVE" size={10.5} color="#9ea3ad" bg={null} />
      <Callout x={303} y={146} text="STAGE BOX" size={10.5} color="#9ea3ad" bg={null} />
    </Svg>
  );
}

/* ── the documentation reveal: simplified professional cable schedule ───── */
const DOC_COLS: { key: keyof CiScheduleRow; label: string; w: number }[] = [
  { key: 'cableId', label: 'ID', w: 56 },
  { key: 'source', label: 'SOURCE', w: 96 },
  { key: 'destination', label: 'DESTINATION', w: 96 },
  { key: 'type', label: 'TYPE', w: 128 },
  { key: 'pathway', label: 'PATHWAY', w: 108 },
  { key: 'note', label: 'NOTE', w: 168 },
];

/** The traced row settles into its highlight once the schedule has landed. */
function HotFill({ delay }: { delay: number }) {
  const m = useCiMotion();
  const k = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(k);
    if (m.reduce) {
      k.value = 1;
      return;
    }
    k.value = 0;
    k.value = withDelay(delay, withSpring(1, CI_SPRING_UI));
    return () => cancelAnimation(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, m.reduce]);
  const s = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, k.value)) }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.docRowHot, s]} />;
}

function DocTable({ highlight }: { highlight: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.docScroll}>
      <View>
        <View style={styles.docHeadRow}>
          {DOC_COLS.map((c) => (
            <Text key={c.key} style={[styles.docHead, { width: c.w }]}>
              {c.label}
            </Text>
          ))}
        </View>
        {CI_CABLE_SCHEDULE.map((r, ri) => {
          const hot = r.cableId === highlight;
          return (
            <Stagger key={r.cableId} index={ri}>
              <View accessible
                style={styles.docRow}
                accessibilityLabel={`${r.cableId}: ${r.source} to ${r.destination}, ${r.type}, pathway ${r.pathway}${r.note ? `, note: ${r.note}` : ''}${hot ? '. The traced cable.' : ''}`}
              >
                {hot ? <HotFill delay={CI_CABLE_SCHEDULE.length * CI_MOTION.stepDelay + 140} /> : null}
                {/* The row above is `accessible`, so it reads as ONE sentence
                    instead of six bare cells — reading the cable schedule IS
                    this exercise. RN <Text> is accessible by default, though,
                    so on Android the container and every cell would both take
                    focus and the row would be announced twice. Opting the cells
                    out is the other half of that fix (2026-09-18, pass 5). */}
                {DOC_COLS.map((c) => (
                  <Text
                    key={c.key}
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                    style={[styles.docCell, { width: c.w }, hot && c.key === 'cableId' && { color: colors.amber }]}
                  >
                    {r[c.key] ?? '—'}
                  </Text>
                ))}
              </View>
            </Stagger>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ── service-loop visualization (honest zones, ONE physical system) ─────── */
/**
 * The loop is not swapped between three pictures — it GROWS and SHRINKS on a
 * spring as stored slack changes: the run bows into a hanging bight, the neck
 * strap fades in once there's a dressed loop, the termination shows strain as
 * the run pulls taut, extra coils appear as the loop becomes an unmanaged
 * pile, and the pathway lights when the pile reaches it.
 * All animated props are primitive (`d`, `opacity`) — see motion.tsx's rule.
 */
function SlackArt({ w, v }: { w: number; v: number }) {
  const h = Math.round(w * 0.5);
  const zone = v <= CI_SLACK_SCENARIO.tooLittleMax ? 'little' : v <= CI_SLACK_SCENARIO.goodMax ? 'good' : 'much';
  /** Stored slack, with mass — it follows the slider, it never snaps. */
  const k = useSettle(v, { spring: CI_SPRING });

  /** The run itself: straight and taut at 0, a deep bight at 1. */
  const run = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 44 + a * 1.9;
    return { d: `M204 44 H150 C120 44 118 ${b} 136 ${b} C154 ${b} 152 44 122 44 H72` };
  });
  const runEdge = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 44 + a * 1.9;
    return { d: `M204 44 H150 C120 44 118 ${b} 136 ${b} C154 ${b} 152 44 122 44 H72` };
  });
  const runSheen = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 44 + a * 1.9;
    return { d: `M204 44 H150 C120 44 118 ${b} 136 ${b} C154 ${b} 152 44 122 44 H72` };
  });
  /** Two more coils spill out of the bight once the loop stops being managed. */
  const coilA = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 40 + a * 1.75;
    return {
      d: `M188 46 C118 46 112 ${b} 126 ${b} C142 ${b} 140 46 118 46`,
      opacity: 0.9 * mapRange(kv, CI_SLACK_SCENARIO.goodMax, 0.9, 0, 1),
    };
  });
  const coilB = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 48 + a * 1.85;
    return {
      d: `M196 42 C132 42 128 ${b} 148 ${b} C166 ${b} 162 42 130 42`,
      opacity: 0.9 * mapRange(kv, CI_SLACK_SCENARIO.goodMax + 0.08, 1, 0, 1),
    };
  });
  const coilAEdge = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 40 + a * 1.75;
    return {
      d: `M188 46 C118 46 112 ${b} 126 ${b} C142 ${b} 140 46 118 46`,
      opacity: 0.9 * mapRange(kv, CI_SLACK_SCENARIO.goodMax, 0.9, 0, 1),
    };
  });
  const coilBEdge = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const a = 2 + kv * 22;
    const b = 48 + a * 1.85;
    return {
      d: `M196 42 C132 42 128 ${b} 148 ${b} C166 ${b} 162 42 130 42`,
      opacity: 0.9 * mapRange(kv, CI_SLACK_SCENARIO.goodMax + 0.08, 1, 0, 1),
    };
  });
  /** Strain at the termination as the run is pulled taut. */
  const strain = useAnimatedProps(() => ({
    opacity: mapRange(Math.max(0, k.value), 0.03, CI_SLACK_SCENARIO.tooLittleMax, 1, 0),
  }));
  /** The neck strap exists only while there IS a dressed loop. */
  const strap = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    return { opacity: Math.min(mapRange(kv, 0.16, 0.3, 0, 1), mapRange(kv, CI_SLACK_SCENARIO.goodMax + 0.05, 0.92, 1, 0)) };
  });
  /** The pathway lights when the pile actually reaches it. */
  const spill = useAnimatedProps(() => {
    const kv = Math.max(0, Math.min(1, k.value));
    const b = 44 + (2 + kv * 22) * 1.9;
    return { opacity: mapRange(b, 78, 90, 0, 1) };
  });

  return (
    <Svg {...SVG_A11Y} width={w} height={h} viewBox="0 0 220 110" accessibilityLabel={`Rack-end service loop visualization. ${CI_SLACK_SCENARIO.notes[zone]}`}>
      <Rect x={2} y={2} width={216} height={106} rx={8} fill="#101014" />
      {/* rack + the termination the loop serves */}
      <Rect x={8} y={10} width={56} height={92} rx={1.4} fill="#23252a" stroke="#0a0a0c" strokeWidth={0.7} />
      <Rect x={11} y={13} width={50} height={86} fill="#0c0c0f" />
      {[18, 40, 62, 84].map((y, i) => (
        <G key={y}>
          <Rect x={13} y={y} width={42} height={14} rx={0.8} fill="#2b2d33" stroke="#101114" strokeWidth={0.4} />
          <Circle cx={51} cy={y + 3.4} r={0.8} fill={i % 2 ? '#37d97b' : '#ffc64d'} />
        </G>
      ))}
      <Connector kind="xlrM" x={79} y={44} k={0.26} angle={180} jacket="#4fd0e0" />
      {/* EMT stub with its bushing, feeding the run */}
      <Rect x={204} y={38.5} width={14} height={11} fill="#9ba1a8" stroke="#3a3d43" strokeWidth={0.4} />
      <Rect x={202.6} y={37} width={2.6} height={14} rx={0.8} fill="#1b1c20" />
      {/* the service walkway the excess must never reach */}
      <Rect x={76} y={88} width={140} height={16} rx={1} fill="#1a1b1f" />
      <Line x1={76} y1={88} x2={216} y2={88} stroke="#e3b73a" strokeWidth={1.2} />
      <Line x1={76} y1={88} x2={216} y2={88} stroke="#141518" strokeWidth={1.2} strokeDasharray="2.4 2.4" />
      <Callout x={146} y={99} text="SERVICE PATHWAY — KEEP CLEAR" size={7} color="#8d9199" bg={null} />
      <ARect
        x={96}
        y={88}
        width={110}
        height={16}
        rx={2}
        fill="#ff5a48"
        fillOpacity={0.12}
        stroke="#ff5a48"
        strokeOpacity={0.55}
        strokeWidth={1.2}
        strokeDasharray="4 3"
        opacity={0}
        animatedProps={spill}
      />
      {/* the unmanaged extra coils (behind the main run) */}
      <APath d="M188 46 H118" stroke={shade('#4fd0e0', 0.66)} strokeWidth={2.6} fill="none" opacity={0} animatedProps={coilAEdge} />
      <APath d="M188 46 H118" stroke={shade('#4fd0e0', 0.25)} strokeWidth={1.9} fill="none" opacity={0} animatedProps={coilA} />
      <APath d="M196 42 H130" stroke={shade('#4fd0e0', 0.66)} strokeWidth={2.6} fill="none" opacity={0} animatedProps={coilBEdge} />
      <APath d="M196 42 H130" stroke={shade('#4fd0e0', 0.25)} strokeWidth={1.9} fill="none" opacity={0} animatedProps={coilB} />
      {/* the run — one continuous cable, taut to bight, a shaded jacket */}
      <APath d="M204 44 H72" stroke={shade('#4fd0e0', 0.66)} strokeWidth={2.8} fill="none" strokeLinecap="round" animatedProps={runEdge} />
      <APath d="M204 44 H72" stroke={shade('#4fd0e0', 0.25)} strokeWidth={2.1} fill="none" strokeLinecap="round" animatedProps={run} />
      <G transform="translate(-0.4 -0.5)">
        <APath d="M204 44 H72" stroke={lighten(shade('#4fd0e0', 0.25), 0.5)} strokeWidth={0.6} fill="none" strokeLinecap="round" opacity={0.8} animatedProps={runSheen} />
      </G>
      {/* hook-and-loop neck strap on the dressed loop */}
      <ARect x={131} y={45} width={14} height={11} rx={2} fill="rgba(35,38,43,0.35)" stroke="#50545b" strokeWidth={2.2} opacity={0} animatedProps={strap} />
      {/* strain at the termination when the run has no give */}
      <APath d="M70 36 l-4 -6 M76 34 v-7 M82 36 l4 -6" stroke="#ff5a48" strokeWidth={1.4} fill="none" opacity={0} animatedProps={strain} />
    </Svg>
  );
}

const ZONE_TINT = { little: '#ff8a6b', good: colors.green, much: '#ffb45e' } as const;
const ZONE_NAME = { little: 'TOO LITTLE', good: 'INTENTIONAL', much: 'EXCESSIVE' } as const;

/* ── lesson card (WhyScene idiom) ───────────────────────────────────────── */
/** The stage's thesis — a deliberate reveal, slower than a normal card. */
function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const m = useCiMotion();
  const t = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(m.d(delay), withTiming(1, { duration: CI_MOTION.reveal, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, m.reduce]);
  const s = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 16 }, { scale: 0.975 + 0.025 * t.value }],
  }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/**
 * A DEAD response: a short, flat shake and a dull flash. Deliberately
 * unsatisfying — the point of phase A is that nothing identifies the cable,
 * so tapping it must feel like nothing happened. No spring, no overshoot,
 * ~190ms total.
 */
function DeadShake({ tick, style, children }: { tick: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const m = useCiMotion();
  const x = useSharedValue(0);
  const o = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (m.reduce) return;
    cancelAnimation(x);
    cancelAnimation(o);
    x.value = withSequence(
      withTiming(-3, { duration: 42, easing: CI_EASE.linear }),
      withTiming(3, { duration: 52, easing: CI_EASE.linear }),
      withTiming(-2, { duration: 46, easing: CI_EASE.linear }),
      withTiming(0, { duration: 50, easing: CI_EASE.linear }),
    );
    o.value = withSequence(withTiming(0.5, { duration: 60, easing: CI_EASE.linear }), withTiming(1, { duration: 160, easing: CI_EASE.linear }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, m.reduce]);
  const s = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateX: x.value }] }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

function LessonCard({ head, body }: { head: string; body: string }) {
  return (
    <Reveal style={styles.lessonCard}>
      <Text style={styles.lessonHead}>{head}</Text>
      <Text style={styles.lessonBody}>{body}</Text>
    </Reveal>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
/** Why STORED SLACK stops moving once confirmed (slider audit held item #18). */
const SLACK_LOCK_REASON = 'confirmed — the loop is dressed and sized to the project note.';

export function LabelScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  // A — the frustration
  const [aTapped, setATapped] = useState<Set<number>>(() => new Set(completed ? [0, 1, 2] : []));
  const aDone = aTapped.size >= 3;
  // B — assign identity
  const [bPicks, setBPicks] = useState<(number | null)[]>(() => (completed ? B_FIELDS.map((f) => f.correctIdx) : B_FIELDS.map(() => null)));
  const [bDone, setBDone] = useState(completed);
  const [bWrong, setBWrong] = useState(0);
  const [bShowMiss, setBShowMiss] = useState(false);
  // C — trace test
  const [cFound, setCFound] = useState(completed);
  const [cWrong, setCWrong] = useState(0);
  const [cLastWrong, setCLastWrong] = useState<number | null>(null);
  // D — service loops
  const [slack, setSlack] = useState(completed ? 0.45 : 0.06);
  const [dDone, setDDone] = useState(completed);
  const [dWrong, setDWrong] = useState(0);
  const [dMiss, setDMiss] = useState<'little' | 'much' | null>(null);
  const [fired, setFired] = useState(completed);
  /** Per-cable "nothing happened" shake counters (phases A and C). */
  const [shakes, setShakes] = useState<number[]>([0, 0, 0, 0]);
  const shake = (i: number) =>
    setShakes((s) => {
      const n = [...s];
      n[i] += 1;
      return n;
    });

  const zone: 'little' | 'good' | 'much' =
    slack <= CI_SLACK_SCENARIO.tooLittleMax ? 'little' : slack <= CI_SLACK_SCENARIO.goodMax ? 'good' : 'much';

  const tapCableA = (i: number) => {
    if (aDone || aTapped.has(i)) return;
    const next = new Set(aTapped);
    next.add(i);
    setATapped(next);
    shake(i); // nothing identifies it — the tap gives nothing back
    const what = i === NET_CABLE ? 'Unlabeled network cable — not audio, but it says nothing about where it goes.' : 'Unlabeled cable — identical to the other audio lines.';
    AccessibilityInfo.announceForAccessibility(
      next.size >= 3 ? `${what} Three inspected, nothing learned. Without identity, every fault is archaeology.` : what,
    );
  };

  const applyLabels = () => {
    if (bDone || bPicks.some((p) => p == null)) return;
    const right = B_FIELDS.every((f, i) => bPicks[i] === f.correctIdx);
    if (right) {
      setBDone(true);
      setBShowMiss(false);
    } else {
      setBWrong((n) => n + 1);
      setBShowMiss(true);
    }
  };

  const tapCableC = (i: number) => {
    if (cFound) return;
    if (i === TARGET_CABLE) {
      setCFound(true);
      setCLastWrong(null);
    } else {
      setCWrong((n) => n + 1);
      setCLastWrong(i);
      shake(i);
      AccessibilityInfo.announceForAccessibility(`That flag reads ${CABLE_FLAGS[i]} — you're looking for ${CI_TRACE_TARGET}.`);
    }
  };

  const confirmSlack = () => {
    if (dDone) return;
    if (zone === 'good') {
      setDDone(true);
      setDMiss(null);
      if (!fired) {
        setFired(true);
        announceComplete('Stage 12 complete.');
        onComplete({
          documentation: clamp100(100 - bWrong * 12 - cWrong * 10),
          serviceability: clamp100(100 - dWrong * 12),
        });
      }
    } else {
      setDWrong((n) => n + 1);
      setDMiss(zone);
    }
  };

  const bHint =
    bWrong <= 1
      ? 'Not yet — read each field against the note: the origin is where the run starts (Stage Input 12), the destination is where it lands (rack panel port), and the cable ID is the run’s own number.'
      : 'Read closely: Stage Input 12 = STG-A-IN12 · Rack 1, Patch Panel 2, Port 12 = R1-PP2-12 · the cable itself is A-012.';

  /* ── the controls that change the drawing — rendered on the page AND docked
     under the drawing in full screen (owner 2026-09-25: "the user must still be
     able to adjust and view their changes to controls"). State lives here; the
     elements are simply rendered twice. ──────────────────────────────────── */
  const slackDock = (
    <View style={{ gap: 8 }}>
      {/* LOCKED after CONFIRM (slider audit held item #18, owner 2026-10-14): the cap
          used to keep riding the finger after the answer was banked. Same
          idiom as the rack's `locked` fader — dimmed, never takes a touch,
          the reason printed under it as "LABEL — locked: reason". */}
      <View
        pointerEvents={dDone ? 'none' : 'auto'}
        style={dDone ? styles.slackLocked : null}
        accessibilityState={{ disabled: dDone }}
      >
        <DragSlider
          value={slack}
          onChange={(v) => {
            if (!dDone) setSlack(v);
          }}
          label="STORED SLACK"
          readout={ZONE_NAME[zone]}
          tint={ZONE_TINT[zone]}
        />
      </View>
      {dDone ? (
        <Text style={styles.lockedNote} accessibilityLiveRegion="polite">
          STORED SLACK — locked: {SLACK_LOCK_REASON}
        </Text>
      ) : null}
      <View style={{ gap: 3 }}>
        {(['little', 'good', 'much'] as const).map((z) => (
          <Text key={z} style={[styles.zoneNote, zone === z && { color: ZONE_TINT[z], fontFamily: fonts.barlowMedium }]}>
            {zone === z ? '▶ ' : '·  '}
            {CI_SLACK_SCENARIO.notes[z]}
          </Text>
        ))}
      </View>
      {!dDone ? (
        <Pressable style={styles.applyBtn} onPress={confirmSlack} accessibilityRole="button" accessibilityLabel="Confirm stored slack">
          <Text style={styles.applyText}>CONFIRM STORED SLACK</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      <ExpandableFigure
        width={width}
        aspect={360 / 150}
        title="SYSTEM"
        badge="Training visualization — simplified system; teaching colors, not field colors."
        render={(w) => <SystemArt w={w} labeled={bDone} found={cFound} />}
      />
      <Text style={styles.tintNote}>
        TRAINING VISUALIZATION — simplified system; the three identical audio cables ARE the point (teaching colors —
        field colors vary; green = the network run). Numbered markers = the four physical cables below.
      </Text>

      {/* ── A · THE FRUSTRATION ─────────────────────────────────────────── */}
      <CiSection title="A · SERVICE CALL — NO SIGNAL FROM STAGE INPUT 12">
        <Text style={styles.lead}>
          The system above is installed and completely unlabeled. Find Stage Input 12’s cable — tap cables to inspect
          them.
        </Text>
        <View style={styles.cableGrid}>
          {[0, 1, 2, 3].map((i) => {
            const tapped = aTapped.has(i);
            return (
              <DeadShake key={i} tick={shakes[i]} style={styles.cableBtnHalf}>
                <Pressable
                  style={[styles.cableBtn, tapped && styles.cableBtnTapped]}
                  onPress={() => tapCableA(i)}
                  disabled={aDone || tapped}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: aDone || tapped }}
                  aria-disabled={aDone || tapped}
                  accessibilityLabel={`Cable ${i + 1}${tapped ? (i === NET_CABLE ? '. Inspected: an unlabeled network cable' : '. Inspected: unlabeled, identical to the others') : aDone ? '. Unlabeled — no point inspecting further' : '. Tap to inspect'}`}
                >
                  <Text style={styles.cableBtnName}>CABLE {i + 1}</Text>
                  <Text style={[styles.cableBtnSub, tapped && { color: '#ff9b8f' }]}>
                    {tapped ? (i === NET_CABLE ? '❓ unlabeled network run — goes where?' : '❓ unlabeled — identical to the rest') : aDone ? 'unlabeled — no point continuing' : 'tap to inspect'}
                  </Text>
                </Pressable>
              </DeadShake>
            );
          })}
        </View>
        {aDone ? (
          <LessonCard
            head="WITHOUT IDENTITY, EVERY FAULT IS ARCHAEOLOGY"
            body="Three cables inspected, nothing learned — the fault is unchanged and the clock is running. Nothing distinguishes one run from another: not for you today, not for the technician in five years. Professionals give every cable identity at both ends — before the system ever needs service."
          />
        ) : null}
      </CiSection>

      {/* ── B · ASSIGN IDENTITY ─────────────────────────────────────────── */}
      {aDone ? (
        <Appear>
        <CiSection title="B · ASSIGN IDENTITY — LABEL THE RUN">
          <SpecCard text={CI_LABEL_SCHEME_NOTE} />
          <Text style={styles.lead}>
            Label Input 12’s run to the training scheme — origin, destination, and the cable’s own ID:
          </Text>
          <View style={{ gap: 10 }}>
            {B_FIELDS.map((f, fi) => (
              <View key={f.key} style={{ gap: 6 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.rowWrap}>
                  {f.options.map((opt, oi) => (
                    <OptionChip
                      key={opt}
                      label={opt}
                      active={bPicks[fi] === oi}
                      disabled={bDone}
                      onPress={() =>
                        setBPicks((prev) => {
                          const next = [...prev];
                          next[fi] = oi;
                          return next;
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
          {!bDone ? (
            <Pressable
              style={[styles.applyBtn, bPicks.some((p) => p == null) && { opacity: 0.45 }]}
              onPress={applyLabels}
              disabled={bPicks.some((p) => p == null)}
              accessibilityRole="button"
              accessibilityState={{ disabled: bPicks.some((p) => p == null) }}
              aria-disabled={bPicks.some((p) => p == null)}
              accessibilityLabel="Apply labels to both ends"
            >
              <Text style={styles.applyText}>APPLY LABELS — BOTH ENDS</Text>
            </Pressable>
          ) : null}
          {bDone ? (
            <Appear style={{ gap: 8 }}>
              <VerdictBanner
                verdict="correct"
                text="Both ends of the run now carry unique, readable, durable identity that matches the records: STG-A-IN12 → R1-PP2-12, cable A-012."
              />
              <RuleFeedback ruleId="label-both-ends" verdict="good" openSources={openSources} />
              <RuleFeedback ruleId="label-scheme-consistent" verdict="info" openSources={openSources} />
            </Appear>
          ) : bShowMiss ? (
            <VerdictBanner verdict="wrong" text={bHint} />
          ) : null}
        </CiSection>
        </Appear>
      ) : null}

      {/* ── C · TRACE TEST + THE DOCUMENTATION ──────────────────────────── */}
      {bDone ? (
        <Appear>
        <CiSection title="C · TRACE TEST — SAME FAULT, LABELED SYSTEM">
          <Text style={styles.lead}>
            The flags are on (see the system above — both ends). Same four cables: which physical cable is{' '}
            {CI_TRACE_TARGET}?
          </Text>
          <View style={{ gap: 8 }}>
            {[0, 1, 2, 3].map((i) => {
              const isTarget = i === TARGET_CABLE;
              const missed = cLastWrong === i;
              return (
                <Stagger key={i} index={i}>
                  <DeadShake tick={shakes[i]}>
                    <Pressable
                      style={[styles.cableBtn, cFound && isTarget && styles.cableBtnFound, missed && !cFound && styles.cableBtnMiss]}
                      onPress={() => tapCableC(i)}
                      disabled={cFound}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: cFound, selected: cFound && isTarget }}
                      aria-disabled={cFound}
                      aria-pressed={cFound && isTarget}
                      accessibilityLabel={`Cable ${i + 1}, flag reads ${CABLE_FLAGS[i]}${cFound && isTarget ? '. Traced — this is the one.' : ''}`}
                    >
                      <Text style={styles.cableBtnName}>CABLE {i + 1}</Text>
                      <Text style={[styles.cableBtnSub, cFound && isTarget && { color: colors.green }]}>
                        flag: {CABLE_FLAGS[i]}
                        {cFound && isTarget ? '  ✓ traced' : missed && !cFound ? '  ✕ not it' : ''}
                      </Text>
                    </Pressable>
                  </DeadShake>
                </Stagger>
              );
            })}
          </View>
          {cFound ? (
            <Appear style={{ gap: 8 }} delay={CI_MOTION.quick}>
              <VerdictBanner
                verdict="correct"
                text="Cable 3, in seconds — the flag says A-012, so it IS A-012. Yesterday this exact fault produced three guesses and nothing."
              />
              <Text style={styles.docEyebrow}>THE OTHER HALF OF IDENTITY — THE RECORDS</Text>
              <Text style={styles.docLead}>
                The label points into the documentation. The cable schedule (slide for all columns), {CI_TRACE_TARGET}{' '}
                highlighted:
              </Text>
              <DocTable highlight={CI_TRACE_TARGET} />
              <RuleFeedback ruleId="label-docs-match" verdict="good" openSources={openSources} />
            </Appear>
          ) : null}
        </CiSection>
        </Appear>
      ) : null}

      {/* ── D · SERVICE LOOPS ───────────────────────────────────────────── */}
      {cFound ? (
        <Appear delay={CI_MOTION.quick}>
        <CiSection title="D · SERVICE LOOPS — STORED SLACK">
          <SpecCard text={CI_SLACK_SCENARIO.brief} />
          <Text style={styles.lead}>
            Slack is intentional. How much is right depends on the cable, the location, the service plan, and
            project/manufacturer requirements — there is no universal service-loop length. Set this rack’s loop to the
            project note:
          </Text>
          <ExpandableFigure
            width={width}
            aspect={220 / 110}
            title="SERVICE LOOP"
            badge="Training visualization — teaching colors, not field colors."
            render={(w) => <SlackArt w={w} v={slack} />}
            controls={<View style={{ paddingHorizontal: 12 }}>{slackDock}</View>}
          />
          {slackDock}
          {dDone ? (
            <Appear style={{ gap: 8 }}>
              <VerdictBanner
                verdict="correct"
                text="Dressed, reachable, sized to the service need — one full re-termination stored without blocking the pathway. Slack is a design decision, not leftovers."
              />
              <RuleFeedback ruleId="slack-intentional" verdict="good" openSources={openSources} />
            </Appear>
          ) : dMiss ? (
            <VerdictBanner verdict="wrong" text={CI_SLACK_SCENARIO.notes[dMiss]} />
          ) : null}
        </CiSection>
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tintNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, lineHeight: 13, color: colors.textSub },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  cableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cableBtn: {
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  cableBtnHalf: { flexBasis: '47%', flexGrow: 1 },
  cableBtnTapped: { borderColor: 'rgba(255,155,143,.45)' },
  cableBtnFound: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0d1a11' },
  cableBtnMiss: { borderColor: 'rgba(255,155,143,.6)' },
  cableBtnName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  cableBtnSub: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  fieldLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.amberLabel },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  applyBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: 10, backgroundColor: colors.amber },
  applyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: '#1a1409' },
  docEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.5, color: colors.amber, marginTop: 2 },
  docLead: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSub },
  docScroll: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014' },
  docHeadRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#26262c' },
  docHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.amberLabel, paddingRight: 8 },
  docRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  docRowHot: { backgroundColor: 'rgba(255,198,77,.08)' },
  docCell: { fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 15, color: colors.textSecondary, paddingRight: 8 },
  zoneNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSub },
  // STORED SLACK after CONFIRM — the rack's locked-key look (RackUnit lockedNote).
  slackLocked: { opacity: 0.45 },
  lockedNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, textAlign: 'center', paddingHorizontal: 6 },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});
