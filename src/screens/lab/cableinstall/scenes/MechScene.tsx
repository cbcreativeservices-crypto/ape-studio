/**
 * STAGE 4 — Mechanical Cable Protection (spec §"mech" · registry m_mech).
 *
 * Three interactions, all against SCENARIO-SUPPLIED specifications (§29 —
 * "check the documentation" IS the skill; no universal numbers):
 *   A · BEND RADIUS — four cables (CI_BEND_EXERCISES), each with its own
 *       simulated spec card shown FIRST. A BEND TIGHTNESS DragSlider reshapes
 *       the drawn bend from generous arc to hard fold; tighter than THAT
 *       cable's minimum radius → the bend segment highlights + a strain glyph
 *       (qualitative failure visualization). CHECK BEND → RuleFeedback
 *       ('mech-bend-radius'). The four cables pass at different slider zones
 *       because their specs differ — that contrast is the lesson.
 *   B · PULLING — CI_PULL_SPEC spec card + a simplified tension meter
 *       (0..150, spec limit marked at 100). Four pull events as OptionChips;
 *       each sets the meter and yields RuleFeedback (ok → 'mech-pull-tension'
 *       good; bad → the event's own rule). Stated plainly as conceptual —
 *       NOT an engineering pull calculation.
 *   C · RESTRAINT — STRAP TENSION DragSlider over a bundle cross-section:
 *       loose = circles drift apart; secure = held round; excessive (past
 *       CI_RESTRAINT_ZONES.secureMax) = cables ovalize and the strap bites.
 *       Zone named in text at all times. Ties-aren't-banned taught via
 *       RuleFeedback info ('mech-ties-not-banned').
 *
 * ── MOTION (owner 2026-08-24: the lab shipped static; this stage is the most
 *    physical in it, so the motion has to TEACH the mechanics) ──────────────
 *   BEND     the drawn radius is a SPRING, not a number. Dragging pulls the
 *            cable with mass (it lags a hair); letting go relaxes a touch
 *            wider and settles — a bent cable stores energy and gives some
 *            back. Over-spec: the violating ARC flares and then breathes hot,
 *            and the strain glyph GROWS in on CI_EASE.physical with its sparks
 *            flying outward — the failure arrives, it doesn't just appear.
 *            The dashed spec-minimum ghost arc brightens while the learner is
 *            dragging (or while over spec) and rests back when it's settled.
 *   PULL     the tension bar SWEEPS on a spring. An over-limit event drives it
 *            PAST the value, then a low-damping spring shudders it back — the
 *            cable resisting. The SPEC LIMIT line flashes at the crossing and
 *            keeps a slow halo while the bar sits over it. The number counts.
 *   RESTRAIN the bundle has mass: circles drift apart, draw round, and OVALIZE
 *            on springs (rx/ry), with the strap ring closing on them and the
 *            bite marks fading up only in the excessive zone. Landing SECURE
 *            fires one green ring.
 *
 *   Every animated element carries its rest pose as a static prop, ONLY
 *   primitive SVG props are animated (see motion.tsx's hard-won rule — no
 *   transform/x/y/rotation anywhere), and `useCiMotion()` collapses all of it
 *   to identical end states under reduced motion. Each bend owns its own
 *   slider state, so a drag re-renders ONE card instead of the whole stage.
 *
 * Completion (once): all 4 bends checked good + all 4 pull events explored +
 * restraint landed in SECURE → onComplete({ protection, workmanship }).
 *
 * Accessibility: sliders have labeled EASE/TIGHTEN nudge buttons and zone
 * set-buttons as non-drag alternatives; every verdict is announced; state is
 * never color-only (words + glyphs everywhere); targets ≥44dp.
 */
import { memo, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { DragSlider } from '../../foundations/bits';
import { OptionChip } from '../../cable/lessons/bits';
import { CI_BEND_EXERCISES, CI_PULL_SPEC, CI_RESTRAINT_ZONES } from '../data/scenarios';
import { cableTypeById } from '../data/cableTypes';
import { clamp01, clamp100 } from '../engine/score';
import {
  ACircle,
  AEllipse,
  ALine,
  APath,
  ARect,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING,
  CI_SPRING_UI,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useCiMotion,
  useCountUp,
  usePulse,
  useSharedValue,
  useTween,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

/* ── bend geometry (sim units: 1 cable diameter = DIA_PX drawing px) ────── */
const R_MAX_DIA = 20; // slider fully eased → generous 20× arc
const R_MIN_DIA = 1; // slider fully tight → hard fold
const DIA_PX = 4;
const START_T = 0.95; // every cable starts over-bent — see the failure, then fix it

const radiusDia = (t: number) => R_MAX_DIA - t * (R_MAX_DIA - R_MIN_DIA);
const tForDia = (d: number) => clamp01((R_MAX_DIA - d) / (R_MAX_DIA - R_MIN_DIA));
const fmtDia = (d: number) => (d >= 10 ? String(Math.round(d)) : d.toFixed(1));

type PullEvent = (typeof CI_PULL_SPEC.events)[number];

const say = (s: string) => AccessibilityInfo.announceForAccessibility(s);

/** The cable follows the finger with mass — close, but not weightless. */
const BEND_DRAG_SPRING = { damping: 20, stiffness: 260, mass: 0.8 } as const;
/** Release: the bend relaxes a touch wider, then settles on its value. */
const BEND_RELEASE_SPRING = { damping: 11, stiffness: 175, mass: 1 } as const;
/** The bundle is heavier than the strap — it trails the drag, then arrives. */
const BUNDLE_DRAG_SPRING = { damping: 16, stiffness: 220, mass: 0.85 } as const;
/** Over-limit tension: the shudder back off the peak. */
const TENSION_SHUDDER = { damping: 6, stiffness: 300, mass: 0.9 } as const;

/* ── A — the corner: cable of `tint` bending around a structure edge ────── */
const CX = 150; // the elbow: horizontal run under the ceiling → drop down the wall face
const CY = 26;
const R_FLOOR_PX = 2.4; // spring overshoot must never invert the arc

/** The cable itself — memoised on stable props so a drag never re-renders it. */
const BendCable = memo(function BendCable({ tint, restDia, rSv }: { tint: string; restDia: number; rSv: SharedValue<number> }) {
  const animatedProps = useAnimatedProps(() => {
    const r = Math.max(R_FLOOR_PX, rSv.value * DIA_PX);
    return { d: `M 9 ${CY} H ${(CX - r).toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${CX} ${(CY + r).toFixed(2)} V 124` };
  });
  const rest = Math.max(R_FLOOR_PX, restDia * DIA_PX);
  return (
    <APath
      d={`M 9 ${CY} H ${CX - rest} A ${rest} ${rest} 0 0 1 ${CX} ${CY + rest} V 124`}
      stroke={tint}
      strokeWidth={DIA_PX}
      strokeLinecap="round"
      fill="none"
      animatedProps={animatedProps}
    />
  );
});

/** The documentation, drawn: the spec minimum as a dashed ghost arc. It steps
 *  forward while the learner is working the slider, then rests back. */
const BendGhostArc = memo(function BendGhostArc({ specDia, ghostSv }: { specDia: number; ghostSv: SharedValue<number> }) {
  const rs = specDia * DIA_PX;
  const animatedProps = useAnimatedProps(() => ({
    opacity: 0.26 + 0.64 * ghostSv.value,
    strokeWidth: 1.5 + 0.7 * ghostSv.value,
  }));
  return (
    <APath
      d={`M ${CX - rs} ${CY} A ${rs} ${rs} 0 0 1 ${CX} ${CY + rs}`}
      stroke="#37d97b"
      strokeWidth={1.5}
      strokeDasharray="5 4"
      opacity={0.26}
      fill="none"
      animatedProps={animatedProps}
    />
  );
});

/** The violating arc: flares on arrival, then breathes hot until it's fixed. */
function BendHotArc({ over, rSv, hotSv }: { over: boolean; rSv: SharedValue<number>; hotSv: SharedValue<number> }) {
  const m = useCiMotion();
  const pulse = usePulse({ run: over && m.loops, period: 1250 });
  const animatedProps = useAnimatedProps(() => {
    const r = Math.max(R_FLOOR_PX, rSv.value * DIA_PX);
    const hot = hotSv.value;
    return {
      d: `M ${(CX - r).toFixed(2)} ${CY} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${CX} ${(CY + r).toFixed(2)}`,
      // base stays high so reduced motion (no pulse) still reads as a failure
      opacity: Math.max(0, Math.min(1, hot)) * (0.8 + 0.2 * pulse.t.value),
      strokeWidth: DIA_PX * (0.95 + 0.32 * Math.min(1.35, hot) + 0.3 * pulse.t.value),
    };
  });
  return <APath d="M0 0" stroke="#ff9b8f" strokeWidth={DIA_PX} strokeLinecap="round" fill="none" opacity={0} animatedProps={animatedProps} />;
}

/** The strain glyph GROWS out of the arc's 45° apex on a physical ease, its
 *  two sparks flying outward — a failure that arrives instead of appearing. */
const BendStrainGlyph = memo(function BendStrainGlyph({ rSv, strainSv }: { rSv: SharedValue<number>; strainSv: SharedValue<number> }) {
  const bolt = useAnimatedProps(() => {
    const r = Math.max(R_FLOOR_PX, rSv.value * DIA_PX);
    const ax = CX - 0.293 * r;
    const ay = CY + 0.293 * r;
    const s = strainSv.value;
    const k = 0.45 + 0.55 * s;
    return {
      d:
        `M ${(ax - 10 * k).toFixed(2)} ${(ay + 10 * k).toFixed(2)}` +
        ` L ${(ax - 6 * k).toFixed(2)} ${(ay + 3 * k).toFixed(2)}` +
        ` L ${(ax - 9 * k).toFixed(2)} ${(ay + 3 * k).toFixed(2)}` +
        ` L ${(ax - 4 * k).toFixed(2)} ${(ay - 5 * k).toFixed(2)}`,
      opacity: Math.max(0, Math.min(1, s)),
      strokeWidth: 1.4 + 0.8 * Math.min(1, s),
    };
  });
  const sparkA = useAnimatedProps(() => {
    const r = Math.max(R_FLOOR_PX, rSv.value * DIA_PX);
    const ax = CX - 0.293 * r;
    const ay = CY + 0.293 * r;
    const k = 0.45 + 0.55 * strainSv.value;
    return { x1: ax - 4 * k, y1: ay + 4 * k, x2: ax - 1 * k, y2: ay - 1 * k, opacity: Math.max(0, Math.min(1, strainSv.value)) };
  });
  const sparkB = useAnimatedProps(() => {
    const r = Math.max(R_FLOOR_PX, rSv.value * DIA_PX);
    const ax = CX - 0.293 * r;
    const ay = CY + 0.293 * r;
    const k = 0.45 + 0.55 * strainSv.value;
    return { x1: ax - 14 * k, y1: ay + 4 * k, x2: ax - 11 * k, y2: ay + 7 * k, opacity: Math.max(0, Math.min(1, strainSv.value)) };
  });
  return (
    <>
      <APath d="M0 0" stroke="#ff9b8f" strokeWidth={2} strokeLinecap="round" fill="none" opacity={0} animatedProps={bolt} />
      <ALine x1={0} y1={0} x2={0} y2={0} stroke="#ff9b8f" strokeWidth={1.4} opacity={0} animatedProps={sparkA} />
      <ALine x1={0} y1={0} x2={0} y2={0} stroke="#ff9b8f" strokeWidth={1.4} opacity={0} animatedProps={sparkB} />
    </>
  );
});

const BendArt = memo(function BendArt({
  w,
  tint,
  specDia,
  restDia,
  over,
  rSv,
  ghostSv,
  hotSv,
  strainSv,
}: {
  w: number;
  tint: string;
  specDia: number;
  restDia: number;
  over: boolean;
  rSv: SharedValue<number>;
  ghostSv: SharedValue<number>;
  hotSv: SharedValue<number>;
  strainSv: SharedValue<number>;
}) {
  const h = Math.round((w * 132) / 200);
  return (
    <Svg width={w} height={h} viewBox="0 0 200 132">
      <Rect x={0} y={0} width={200} height={132} rx={8} fill="#101014" />
      {/* the corner being turned: ceiling above, wall at right. A tight bend
          hugs the junction; a generous bend stands off into the free space —
          which is why the arc sweeps down-left as the slider eases. */}
      <Rect x={0} y={0} width={200} height={20} fill="#17171c" />
      <Rect x={154} y={0} width={46} height={132} fill="#17171c" />
      <Path d="M0 20 H154 V132" stroke="#3a3c42" strokeWidth={1.6} fill="none" />
      {/* terminations — cable ends honestly at plates */}
      <Rect x={2} y={21} width={7} height={10} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      <Rect x={142} y={123} width={10} height={7} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      <BendGhostArc specDia={specDia} ghostSv={ghostSv} />
      <BendCable tint={tint} restDia={restDia} rSv={rSv} />
      <BendHotArc over={over} rSv={rSv} hotSv={hotSv} />
      <BendStrainGlyph rSv={rSv} strainSv={strainSv} />
    </Svg>
  );
});

/* ── A — one bend exercise (owns its slider so a drag re-renders one card) ─ */
function BendCard({
  ex,
  index,
  total,
  w,
  initialT,
  done,
  verdict,
  onCheck,
  openSources,
}: {
  ex: (typeof CI_BEND_EXERCISES)[number];
  index: number;
  total: number;
  w: number;
  initialT: number;
  done: boolean;
  verdict: 'good' | 'bad' | null;
  onCheck: (dia: number) => void;
  openSources: (ids: string[]) => void;
}) {
  const m = useCiMotion();
  const [t, setT] = useState(initialT);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(false);

  const dia = radiusDia(t);
  const over = dia + 1e-6 < ex.minRadiusDia; // tighter than THIS cable's spec
  const tint = cableTypeById(ex.cable).tint;

  const diaRef = useRef(dia);
  diaRef.current = dia;
  const restDiaRef = useRef(dia); // first-paint rest pose, never changes

  const rSv = useSharedValue(dia);
  const hotSv = useSharedValue(over ? 1 : 0);
  const strainSv = useSharedValue(over ? 1 : 0);
  // The documentation matters while you're working, and while you're wrong.
  const ghostSv = useTween(dragging || over ? 1 : 0, CI_MOTION.base);

  // The radius is a physical quantity: it springs, it never jumps.
  useEffect(() => {
    cancelAnimation(rSv);
    if (m.reduce) {
      rSv.value = dia;
      return;
    }
    rSv.value = withSpring(dia, dragRef.current ? BEND_DRAG_SPRING : CI_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia, m.reduce]);

  // Crossing the spec: the arc flares hot, the strain glyph grows in.
  useEffect(() => {
    cancelAnimation(hotSv);
    cancelAnimation(strainSv);
    if (m.reduce) {
      hotSv.value = over ? 1 : 0;
      strainSv.value = over ? 1 : 0;
      return;
    }
    if (over) {
      hotSv.value = withSequence(withTiming(1.35, { duration: 130, easing: CI_EASE.out }), withSpring(1, CI_SPRING_UI));
      strainSv.value = withTiming(1, { duration: CI_MOTION.settle, easing: CI_EASE.physical });
    } else {
      hotSv.value = withTiming(0, { duration: CI_MOTION.quick, easing: CI_EASE.out });
      strainSv.value = withTiming(0, { duration: CI_MOTION.quick, easing: CI_EASE.out });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, m.reduce]);

  const onDragActive = (active: boolean) => {
    dragRef.current = active;
    setDragging(active);
    if (active || m.reduce) return;
    // Let go and the bend breathes out a little, then lands on its value —
    // stored elastic energy, given back. The reported number never moves.
    const d = diaRef.current;
    cancelAnimation(rSv);
    rSv.value = withSequence(
      withTiming(d + Math.max(0.3, d * 0.06), { duration: 140, easing: CI_EASE.out }),
      withSpring(d, BEND_RELEASE_SPRING),
    );
  };

  const nudge = (delta: number) => setT((v) => clamp01(v + delta));

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <Text style={styles.cardHead}>
        {done ? '✓ ' : ''}BEND {index + 1} OF {total} — {ex.cableName.toUpperCase()}
      </Text>
      <SpecCard text={ex.specText} />
      {ex.note ? <Text style={styles.exNote}>{ex.note}</Text> : null}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${ex.cableName}: bend about ${fmtDia(dia)} times cable diameter; specification minimum ${ex.minRadiusDia} times. ${
          over ? 'Tighter than the specification — strained.' : 'Within the specification.'
        }`}
      >
        <BendArt
          w={w}
          tint={tint}
          specDia={ex.minRadiusDia}
          restDia={restDiaRef.current}
          over={over}
          rSv={rSv}
          ghostSv={ghostSv}
          hotSv={hotSv}
          strainSv={strainSv}
        />
      </View>
      <DragSlider
        value={t}
        onChange={(v) => setT(clamp01(v))}
        label="BEND TIGHTNESS"
        readout={`≈ ${fmtDia(dia)}× dia · spec ≥ ${ex.minRadiusDia}×`}
        tint={tint}
        onDragActive={onDragActive}
      />
      <View style={styles.nudgeRow}>
        <Pressable
          style={styles.nudgeBtn}
          onPress={() => nudge(-0.08)}
          accessibilityRole="button"
          accessibilityLabel={`${ex.cableName}: ease the bend — larger radius`}
        >
          <Text style={styles.nudgeText}>− EASE</Text>
        </Pressable>
        <Pressable
          style={styles.nudgeBtn}
          onPress={() => nudge(0.08)}
          accessibilityRole="button"
          accessibilityLabel={`${ex.cableName}: tighten the bend — smaller radius`}
        >
          <Text style={styles.nudgeText}>+ TIGHTEN</Text>
        </Pressable>
        <Pressable
          style={[styles.checkBtn, done && styles.checkBtnDone]}
          onPress={() => !done && onCheck(diaRef.current)}
          disabled={done}
          accessibilityRole="button"
          accessibilityState={{ disabled: done }}
          accessibilityLabel={done ? `${ex.cableName}: bend meets its specification` : `Check the ${ex.cableName} bend against its specification`}
        >
          <Text style={[styles.checkText, done && { color: '#0a1a0f' }]}>{done ? 'MEETS SPEC ✓' : 'CHECK BEND'}</Text>
        </Pressable>
      </View>
      {verdict ? (
        <Appear>
          <RuleFeedback
            ruleId="mech-bend-radius"
            verdict={verdict}
            short={
              verdict === 'good'
                ? `Meets the spec — ≈ ${fmtDia(dia)}× dia against this cable's ≥ ${ex.minRadiusDia}× requirement.`
                : `Too tight for THIS cable — ≈ ${fmtDia(dia)}× dia against its ≥ ${ex.minRadiusDia}× spec. Ease the bend and check again.`
            }
            openSources={openSources}
          />
        </Appear>
      ) : null}
    </View>
  );
}

/* ── B — the simplified tension meter (conceptual, 0..150) ──────────────── */
const MET_X0 = 12;
const MET_X1 = 308;
const metX = (v: number) => MET_X0 + ((MET_X1 - MET_X0) * v) / 150;

/** The bar sweeps on a spring; an over-limit event drives it PAST the value
 *  and a low-damping spring shudders it back. That is the cable resisting. */
const TensionMeter = memo(function TensionMeter({ w, target }: { w: number; target: number }) {
  const m = useCiMotion();
  const h = Math.round((w * 74) / 320);
  const overLimit = target > CI_PULL_SPEC.maxTension;
  const v = useSharedValue(target);
  const flash = useSharedValue(0);
  const shown = useCountUp(Math.round(target), CI_MOTION.reveal);
  const halo = usePulse({ run: overLimit && m.loops, period: 1150 });

  useEffect(() => {
    cancelAnimation(v);
    cancelAnimation(flash);
    if (m.reduce) {
      v.value = target;
      flash.value = 0;
      return;
    }
    if (overLimit) {
      v.value = withSequence(
        withTiming(Math.min(150, target + 12), { duration: 300, easing: CI_EASE.out }),
        withSpring(target, TENSION_SHUDDER),
      );
      // fires as the bar crosses the marked limit, not when it settles
      flash.value = withDelay(
        150,
        withSequence(withTiming(1, { duration: 90, easing: CI_EASE.out }), withTiming(0, { duration: 560, easing: CI_EASE.inOut })),
      );
    } else {
      v.value = withSpring(target, CI_SPRING);
      flash.value = withTiming(0, { duration: CI_MOTION.quick, easing: CI_EASE.out });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, overLimit, m.reduce]);

  const fill = useAnimatedProps(() => ({
    width: Math.max(0, ((MET_X1 - MET_X0) * Math.max(0, Math.min(150, v.value))) / 150),
  }));
  const limitLine = useAnimatedProps(() => ({
    strokeWidth: 2 + 2.4 * flash.value,
    opacity: 0.85 + 0.15 * flash.value,
  }));
  const limitHalo = useAnimatedProps(() => ({
    opacity: Math.max(flash.value * 0.7, (overLimit ? 0.3 : 0) + (overLimit ? 0.4 : 0) * halo.t.value),
    strokeWidth: 5 + 4 * halo.t.value,
  }));

  const restW = Math.max(0, ((MET_X1 - MET_X0) * Math.max(0, Math.min(150, target))) / 150);

  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 320 74"
      accessibilityLabel={`Tension meter: ${Math.round(target)} of 150 units. Specification limit ${CI_PULL_SPEC.maxTension}. ${
        overLimit ? 'Over the limit.' : 'Within the limit.'
      }`}
    >
      <Rect x={0} y={0} width={320} height={74} rx={8} fill="#101014" />
      <Rect x={MET_X0} y={30} width={MET_X1 - MET_X0} height={14} rx={7} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      <ARect
        x={MET_X0}
        y={30}
        width={restW}
        height={14}
        rx={7}
        fill={overLimit ? '#ff5a48' : '#37d97b'}
        opacity={0.9}
        animatedProps={fill}
      />
      {[0, 50, 150].map((tick) => (
        <Line key={tick} x1={metX(tick)} y1={26} x2={metX(tick)} y2={48} stroke="#3a3c42" strokeWidth={1} />
      ))}
      {/* the spec limit: haloed while the bar sits over it, flashed at the crossing */}
      <ALine x1={metX(100)} y1={24} x2={metX(100)} y2={50} stroke="#ff5a48" strokeWidth={5} opacity={0} animatedProps={limitHalo} />
      <ALine x1={metX(100)} y1={26} x2={metX(100)} y2={48} stroke="#ff9b8f" strokeWidth={2} opacity={0.85} animatedProps={limitLine} />
      {[0, 50, 100, 150].map((tick) => (
        <SvgText key={`t${tick}`} x={metX(tick)} y={62} textAnchor="middle" fontFamily={fonts.mono} fontSize={10.5} fill="#8a8b93">
          {String(tick)}
        </SvgText>
      ))}
      <SvgText x={metX(100)} y={18} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={9} letterSpacing={0.8} fill="#ff9b8f">
        SPEC LIMIT
      </SvgText>
      <SvgText x={MET_X1} y={18} textAnchor="end" fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>
        {`${shown} u`}
      </SvgText>
    </Svg>
  );
});

/* ── C — bundle cross-section under a strap, driven by strap tension ────── */
const BUNDLE_TINTS = ['#4fd0e0', '#37d97b', '#ffd35e', '#c77dff'];
const LOOSE_MAX = CI_RESTRAINT_ZONES.looseMax;
const SECURE_MAX = CI_RESTRAINT_ZONES.secureMax;
const B_CX = 100;
const B_CY = 66;
const B_R = 13;
const B_JIT: [number, number][] = [
  [-4, -2],
  [3, -4],
  [-3, 3],
  [4, 2],
];
const B_OFFS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

/** Shared derivation, worklet-side: one strap tension → spread + squish. */
function bundleShape(raw: number) {
  'worklet';
  const t = Math.max(-0.06, Math.min(1.06, raw));
  const spread = t < LOOSE_MAX ? (LOOSE_MAX - t) / LOOSE_MAX : 0;
  const squish = t > SECURE_MAX ? (t - SECURE_MAX) / (1 - SECURE_MAX) : 0;
  return {
    spread,
    squish,
    gap: 15 + spread * 14 - squish * 2,
    srx: 34 + spread * 18 - squish * 4.5,
    sry: 34 + spread * 14 - squish * 8,
  };
}

/** One cable in the loom: drifts apart when loose, draws round when secure,
 *  ovalizes (rx/ry, on a spring) when the strap goes past secure. */
const BundleCable = memo(function BundleCable({ i, tSv, restT }: { i: number; tSv: SharedValue<number>; restT: number }) {
  const wide = i === 0 || i === 3; // alternate squash axes → pinched look
  const animatedProps = useAnimatedProps(() => {
    const s = bundleShape(tSv.value);
    return {
      cx: B_CX + B_OFFS[i][0] * s.gap + B_JIT[i][0] * s.spread * 2,
      cy: B_CY + B_OFFS[i][1] * s.gap + B_JIT[i][1] * s.spread * 2,
      rx: B_R * (1 + (wide ? 0.4 : -0.32) * s.squish),
      ry: B_R * (1 + (wide ? -0.32 : 0.4) * s.squish),
    };
  });
  const r = bundleShape(restT);
  return (
    <AEllipse
      cx={B_CX + B_OFFS[i][0] * r.gap + B_JIT[i][0] * r.spread * 2}
      cy={B_CY + B_OFFS[i][1] * r.gap + B_JIT[i][1] * r.spread * 2}
      rx={B_R * (1 + (wide ? 0.4 : -0.32) * r.squish)}
      ry={B_R * (1 + (wide ? -0.32 : 0.4) * r.squish)}
      fill={BUNDLE_TINTS[i]}
      opacity={0.85}
      stroke="#0c0c0c"
      strokeWidth={1.5}
      animatedProps={animatedProps}
    />
  );
});

/** The strap: dashed and roomy when slack, solid and closing as it takes up. */
const BundleStrap = memo(function BundleStrap({ tSv, restT }: { tSv: SharedValue<number>; restT: number }) {
  const solid = useAnimatedProps(() => {
    const s = bundleShape(tSv.value);
    return { rx: s.srx, ry: s.sry, opacity: 1 - Math.max(0, Math.min(1, s.spread / 0.18)) };
  });
  const dash = useAnimatedProps(() => {
    const s = bundleShape(tSv.value);
    return { rx: s.srx, ry: s.sry, opacity: Math.max(0, Math.min(1, s.spread / 0.18)) };
  });
  const tab = useAnimatedProps(() => {
    const s = bundleShape(tSv.value);
    const y = B_CY - s.sry - 5;
    return { d: `M ${B_CX - 5} ${y} h10 a2 2 0 0 1 2 2 v5 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 v-5 a2 2 0 0 1 2 -2 z` };
  });
  const r = bundleShape(restT);
  const restSlack = Math.max(0, Math.min(1, r.spread / 0.18));
  const restY = B_CY - r.sry - 5;
  return (
    <>
      <AEllipse cx={B_CX} cy={B_CY} rx={r.srx} ry={r.sry} fill="none" stroke="#d8d8dc" strokeWidth={3} opacity={1 - restSlack} animatedProps={solid} />
      <AEllipse
        cx={B_CX}
        cy={B_CY}
        rx={r.srx}
        ry={r.sry}
        fill="none"
        stroke="#d8d8dc"
        strokeWidth={3}
        strokeDasharray="7 6"
        opacity={restSlack}
        animatedProps={dash}
      />
      <APath
        d={`M ${B_CX - 5} ${restY} h10 a2 2 0 0 1 2 2 v5 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 v-5 a2 2 0 0 1 2 -2 z`}
        fill="#26262c"
        stroke="#6f7378"
        strokeWidth={1}
        animatedProps={tab}
      />
    </>
  );
});

/** Where the strap bites: only in the excessive zone, riding the strap. */
const BundleBite = memo(function BundleBite({ dx, dy, tSv, restT }: { dx: number; dy: number; tSv: SharedValue<number>; restT: number }) {
  const animatedProps = useAnimatedProps(() => {
    const s = bundleShape(tSv.value);
    const k = Math.max(0, Math.min(1, s.squish));
    return { cx: B_CX + dx * s.srx, cy: B_CY + dy * s.sry, r: 3 + 1.6 * k, opacity: k };
  });
  const r = bundleShape(restT);
  return (
    <ACircle
      cx={B_CX + dx * r.srx}
      cy={B_CY + dy * r.sry}
      r={3 + 1.6 * Math.max(0, Math.min(1, r.squish))}
      fill="#ff9b8f"
      opacity={Math.max(0, Math.min(1, r.squish))}
      animatedProps={animatedProps}
    />
  );
});

/** One ring, once, when the restraint lands SECURE. Never loops. */
function BundleLandPulse({ landed }: { landed: boolean }) {
  const m = useCiMotion();
  const p = useSharedValue(0);
  const wasRef = useRef(landed);
  useEffect(() => {
    if (landed && !wasRef.current && !m.reduce) {
      cancelAnimation(p);
      p.value = 0;
      p.value = withSequence(withTiming(1, { duration: 540, easing: CI_EASE.out }), withTiming(0, { duration: 0 }));
    }
    wasRef.current = landed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landed, m.reduce]);
  const animatedProps = useAnimatedProps(() => ({
    r: 30 + 36 * p.value,
    opacity: p.value > 0 ? 0.6 * (1 - p.value) : 0,
    strokeWidth: 2.4 - 1.2 * p.value,
  }));
  return <ACircle cx={B_CX} cy={B_CY} r={30} fill="none" stroke="#37d97b" strokeWidth={2.4} opacity={0} animatedProps={animatedProps} />;
}

const BundleArt = memo(function BundleArt({ w, tSv, restT, landed }: { w: number; tSv: SharedValue<number>; restT: number; landed: boolean }) {
  const h = Math.round((w * 132) / 200);
  return (
    <Svg width={w} height={h} viewBox="0 0 200 132">
      <Rect x={0} y={0} width={200} height={132} rx={8} fill="#101014" />
      <BundleStrap tSv={tSv} restT={restT} />
      {[0, 1, 2, 3].map((i) => (
        <BundleCable key={i} i={i} tSv={tSv} restT={restT} />
      ))}
      <BundleBite dx={-1} dy={0} tSv={tSv} restT={restT} />
      <BundleBite dx={1} dy={0} tSv={tSv} restT={restT} />
      <BundleBite dx={0} dy={-1} tSv={tSv} restT={restT} />
      <BundleBite dx={0} dy={1} tSv={tSv} restT={restT} />
      <BundleLandPulse landed={landed} />
    </Svg>
  );
});

/* ── the scene ──────────────────────────────────────────────────────────── */
export function MechScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const m = useCiMotion();
  const artW = Math.max(160, width - 26);

  // A — bends (each card owns its own slider value; only verdicts live here)
  const [bendVerdict, setBendVerdict] = useState<('good' | 'bad' | null)[]>(() => CI_BEND_EXERCISES.map(() => (completed ? 'good' : null)));
  const [bendDone, setBendDone] = useState<boolean[]>(() => CI_BEND_EXERCISES.map(() => completed));
  const badBendRef = useRef(0);

  // B — pulls
  const [pullId, setPullId] = useState<PullEvent['id'] | null>(null);
  const [pullSeen, setPullSeen] = useState<Set<string>>(() => new Set(completed ? CI_PULL_SPEC.events.map((e) => e.id) : []));
  const targetTension = pullId ? CI_PULL_SPEC.events.find((e) => e.id === pullId)!.tension : 0;

  // C — restraint
  const [restT, setRestT] = useState(completed ? 0.5 : 0.12);
  const restRef = useRef(restT);
  restRef.current = restT;
  const restDragRef = useRef(false);
  const restSv = useSharedValue(restT);
  const restRestRef = useRef(restT); // first-paint rest pose
  const [landed, setLanded] = useState(completed);

  // The bundle has mass — it trails a drag, then arrives with overshoot.
  useEffect(() => {
    cancelAnimation(restSv);
    if (m.reduce) {
      restSv.value = restT;
      return;
    }
    restSv.value = withSpring(restT, restDragRef.current ? BUNDLE_DRAG_SPRING : CI_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restT, m.reduce]);

  const firedRef = useRef(completed);
  const [fired, setFired] = useState(completed);

  const tryFire = (nextBendDone: boolean[], nextSeen: Set<string>, nextLanded: boolean) => {
    if (firedRef.current) return;
    if (nextBendDone.every(Boolean) && nextSeen.size >= CI_PULL_SPEC.events.length && nextLanded) {
      firedRef.current = true;
      setFired(true);
      const bad = badBendRef.current;
      announceComplete('Stage 4 complete.');
      onComplete({
        protection: clamp100(Math.max(60, 100 - 8 * bad)),
        workmanship: clamp100(Math.max(70, 100 - 4 * bad)),
      });
    }
  };

  const checkBend = (i: number, dia: number) => {
    const ex = CI_BEND_EXERCISES[i];
    const ok = dia + 1e-6 >= ex.minRadiusDia;
    if (!ok) badBendRef.current += 1;
    const nextDone = bendDone.map((v, j) => (j === i ? v || ok : v));
    setBendDone(nextDone);
    setBendVerdict((arr) => arr.map((v, j) => (j === i ? (ok ? 'good' : 'bad') : v)));
    say(
      ok
        ? `Meets the specification: about ${fmtDia(dia)} times diameter against a minimum of ${ex.minRadiusDia}.`
        : `Too tight: about ${fmtDia(dia)} times diameter against a minimum of ${ex.minRadiusDia}. Ease the bend.`,
    );
    tryFire(nextDone, pullSeen, landed);
  };

  const pickPull = (ev: PullEvent) => {
    setPullId(ev.id);
    const nx = new Set(pullSeen).add(ev.id);
    setPullSeen(nx);
    say(`${ev.label}. Tension ${ev.tension} of ${CI_PULL_SPEC.maxTension} allowed. ${ev.note}`);
    tryFire(bendDone, nx, landed);
  };

  const land = () => {
    if (landed) return;
    setLanded(true);
    say('Restraint landed secure — held without deformation.');
    tryFire(bendDone, pullSeen, true);
  };

  const zone = restT <= CI_RESTRAINT_ZONES.looseMax ? 'LOOSE' : restT <= CI_RESTRAINT_ZONES.secureMax ? 'SECURE' : 'EXCESSIVE';
  const zoneNote =
    zone === 'LOOSE' ? CI_RESTRAINT_ZONES.notes.loose : zone === 'SECURE' ? CI_RESTRAINT_ZONES.notes.secure : CI_RESTRAINT_ZONES.notes.excessive;
  const zoneTint = zone === 'SECURE' ? colors.green : zone === 'LOOSE' ? colors.amberLabel : '#ff9b8f';

  const bendsDone = bendDone.filter(Boolean).length;
  const activePull = pullId ? CI_PULL_SPEC.events.find((e) => e.id === pullId)! : null;

  return (
    <View style={{ gap: 16 }}>
      {/* ── A · BEND RADIUS ─────────────────────────────────────────────── */}
      <CiSection title="A · BEND RADIUS — MEET EACH CABLE'S SPEC">
        <Text style={styles.lead}>
          Same corner, four cables. For each one: read its documentation, then set BEND TIGHTNESS until the drawn bend
          meets THAT cable's minimum radius (the dashed arc is the spec minimum). Tighter than spec = the bend strains.
        </Text>
        <Text style={styles.tintNote}>Cable colors here are training tints — field colors vary.</Text>
        {CI_BEND_EXERCISES.map((ex, i) => (
          <Stagger key={ex.id} index={i}>
            <BendCard
              ex={ex}
              index={i}
              total={CI_BEND_EXERCISES.length}
              w={artW}
              initialT={completed ? tForDia(Math.min(R_MAX_DIA, ex.minRadiusDia + 2)) : START_T}
              done={bendDone[i]}
              verdict={bendVerdict[i]}
              onCheck={(dia) => checkBend(i, dia)}
              openSources={openSources}
            />
          </Stagger>
        ))}
        <Text style={styles.progressLine} accessibilityLiveRegion="polite">
          {bendsDone >= CI_BEND_EXERCISES.length ? '✓ ' : ''}
          {bendsDone} of {CI_BEND_EXERCISES.length} bends meet their spec
        </Text>
        {bendsDone >= CI_BEND_EXERCISES.length ? (
          <Appear>
            <View style={styles.lessonCard}>
              <Text style={styles.lessonHead}>FOUR CABLES, FOUR ANSWERS</Text>
              <Text style={styles.lessonBody}>
                The corner never changed — the specification did. Bend limits belong to the specific cable, which is why
                checking its documentation is the first move every time.
              </Text>
            </View>
          </Appear>
        ) : null}
      </CiSection>

      {/* ── B · PULLING ─────────────────────────────────────────────────── */}
      <CiSection title="B · PULLING — STAY INSIDE RATED TENSION">
        <SpecCard text={CI_PULL_SPEC.specText} />
        <TensionMeter w={artW} target={targetTension} />
        <Text style={styles.conceptNote}>
          Conceptual meter for judgment training — not an engineering pull calculation. Real pulls are planned from the
          cable's documentation.
        </Text>
        <Text style={styles.lead}>Try all four pull events and watch what each does to tension:</Text>
        <View style={styles.chipWrap}>
          {CI_PULL_SPEC.events.map((ev) => (
            <OptionChip
              key={ev.id}
              label={`${pullSeen.has(ev.id) ? '✓ ' : ''}${ev.label}`}
              active={pullId === ev.id}
              onPress={() => pickPull(ev)}
            />
          ))}
        </View>
        <Text style={styles.progressLine} accessibilityLiveRegion="polite">
          {pullSeen.size >= CI_PULL_SPEC.events.length ? '✓ ' : ''}
          {pullSeen.size} of {CI_PULL_SPEC.events.length} pull events explored
        </Text>
        {activePull ? (
          <Appear key={activePull.id}>
            <RuleFeedback
              ruleId={'ruleId' in activePull ? activePull.ruleId : 'mech-pull-tension'}
              verdict={activePull.ok ? 'good' : 'bad'}
              short={activePull.note}
              openSources={openSources}
            />
          </Appear>
        ) : null}
      </CiSection>

      {/* ── C · RESTRAINT ───────────────────────────────────────────────── */}
      <CiSection title="C · RESTRAINT — HOLD, NEVER CRUSH">
        <Text style={styles.lead}>
          A restraint supports and organizes the bundle. Find the tension that holds the four cables round — loose does
          nothing, and past secure the strap starts doing damage.
        </Text>
        <View accessible accessibilityRole="image" accessibilityLabel={`Bundle cross-section, strap tension ${zone}. ${zoneNote}`}>
          <BundleArt w={artW} tSv={restSv} restT={restRestRef.current} landed={landed} />
        </View>
        <Text style={styles.zoneLine} accessibilityLiveRegion="polite">
          <Text style={[styles.zoneWord, { color: zoneTint }]}>{zone}</Text>
          {'  —  '}
          {zoneNote}
        </Text>
        <DragSlider
          value={restT}
          onChange={setRestT}
          label="STRAP TENSION"
          readout={zone}
          tint={zoneTint}
          onDragActive={(active) => {
            restDragRef.current = active;
            if (active) return;
            // release: the loom settles into the strap with overshoot
            if (!m.reduce) {
              cancelAnimation(restSv);
              restSv.value = withSpring(restRef.current, CI_SPRING);
            }
            if (restRef.current > CI_RESTRAINT_ZONES.looseMax && restRef.current <= CI_RESTRAINT_ZONES.secureMax) land();
          }}
        />
        <View style={styles.chipWrap}>
          <OptionChip label="SET LOOSE" active={zone === 'LOOSE'} onPress={() => setRestT(0.15)} />
          <OptionChip
            label="SET SECURE"
            active={zone === 'SECURE'}
            onPress={() => {
              setRestT(0.5);
              land();
            }}
          />
          <OptionChip label="SET EXCESSIVE" active={zone === 'EXCESSIVE'} onPress={() => setRestT(0.85)} />
        </View>
        {landed ? (
          <Appear>
            <Text style={styles.landedLine} accessibilityLiveRegion="polite">
              ✓ LANDED SECURE — held without deformation. That is the whole job of a restraint.
            </Text>
          </Appear>
        ) : null}
        <RuleFeedback ruleId="mech-ties-not-banned" verdict="info" openSources={openSources} />
      </CiSection>

      <Text style={[styles.progressLine, fired && { color: colors.green }]} accessibilityLiveRegion="polite">
        {fired
          ? '✓ Stage 4 complete — keep experimenting freely.'
          : 'To complete: meet all 4 bend specs · explore all 4 pull events · land the restraint in SECURE.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  card: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  cardDone: { borderColor: 'rgba(55,224,95,.4)' },
  cardHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amberLabel },
  exNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  nudgeRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  nudgeBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingHorizontal: 12,
  },
  nudgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  checkBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#2a2a31',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
  },
  checkBtnDone: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  progressLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  conceptNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: colors.textSub, fontStyle: 'italic' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  zoneLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  zoneWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2 },
  landedLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.green },
});
