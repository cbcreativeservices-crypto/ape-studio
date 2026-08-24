/**
 * STAGE 6 — Rack Cable Dressing (spec §14) — THE FLAGSHIP SCENE.
 *
 * The professional-audio heart of the lab: four phases on one rear-view rack
 * visualization (SVG only; honest illustration — cables terminate, and the
 * good dressing keeps natural bends and per-loom offsets, spec §52):
 *   A · INSPECT  — condemn the bad rack: the 14 CI_RACK_ISSUES drawn as
 *                  visibly-wrong details at their zone heights; ≥10 finds to
 *                  pass (never all 14 required). Tap regions on the rack or
 *                  use the SUSPECT LIST — no precision tapping ever required.
 *   B · DRESS    — CI_RACK_PLAN_NOTE first (the PLAN is the point), then
 *                  route the 6 CI_RACK_GROUPS via select-cable → select-zone
 *                  (no drag); looms draw live down the chosen manager to
 *                  plausible gear; per-group ✓/✕ vs the plan reveals once all
 *                  six are placed, reassignable until satisfied.
 *   C · SERVICE  — “DSP INPUT 7 has failed”: on the dressed rack the one
 *                  cable traces source→path→destination (everything else
 *                  dims), confirm REPLACE; a BEFORE strip contrasts the same
 *                  job on the Phase-A rack. Dressing IS the 30 seconds.
 *   D · MAINTAIN — replace the network switch without disconnecting
 *                  unrelated equipment: one of four approaches respects the
 *                  dressing (slack + managers), the rest destroy it.
 * Close: the rack-principles card with AuthorityBadges. Completion: all four
 * phases → onComplete({serviceability, signal, protection, workmanship})
 * scored honestly from finds, miss-taps, assignment attempts and service
 * picks. `completed` prop = everything unlocked for replay (fires once only).
 *
 * Accessibility: every SVG target has a labeled-button alternative; hit
 * overlays expand to ≥44dp; verdicts are glyph+words+color; phase
 * completions use announceComplete (success haptic + announcement).
 *
 * ── MOTION (owner 2026-08-24: this is the most-watched stage in the lab) ────
 * Each phase carries its own motion thesis, all through the lab MOTION KIT
 * (../motion) and all on PRIMITIVE SVG PROPS ONLY — cx/cy, r, rx/ry, width,
 * height, opacity, strokeWidth, strokeDashoffset, d. Group movement, where it
 * happens, rides a plain RN Animated.View. NEVER an animated <G transform>:
 * react-native-svg extracts transforms at JS render time and the node silently
 * stays put (the documented Harmonograph failure, motion.tsx).
 *   A · INSPECT  the rack ASSEMBLES top-to-bottom (skeleton → gear, ~460ms),
 *                then the mess DRAWS ITSELF IN, chaotic and out of order.
 *                Undocumented defects breathe (PulseRing, staggered phase so
 *                they never pulse in unison); documenting one stops its loop,
 *                springs the marker in and draws a ✓ tick.
 *   B · DRESS    SIGNATURE MOVE — an assigned loom INSTALLS ITSELF down the
 *                chosen manager (dash reveal, source→gear). Reassigning
 *                RETRACTS the old loom back out of the manager first, then
 *                installs the new one. On reveal, correct looms take a brief
 *                FLOW pulse (signal just came alive); wrong ones breathe a
 *                dashed-red flag.
 *   C · SERVICE  SIGNATURE MOVE — the TRACE SWEEP: the veil dims the rack,
 *                then a beam runs the length of the one cable, source →
 *                destination, and the A-07 tags land at both ends.
 *   D · MAINTAIN cards stagger; the approved approach settles on a spring.
 * Ambient loops exist ONLY for undocumented defects and live state, and stop
 * the moment they are resolved. Everything honors useCiMotion() — under
 * reduced motion durations collapse to 0, loops never start, and every end
 * state is identical, so nothing is ever hidden behind an animation.
 */
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { AuthorityBadge, CiSection, FindProgress, RuleFeedback, SpecCard, announceComplete, ruleFor } from '../bits';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { mistakeById } from '../data/mistakes';
import { CI_RACK_GROUPS, CI_RACK_ISSUES, CI_RACK_PLAN_NOTE, CI_RACK_ZONES } from '../data/scenarios';
import type { CiDimScores } from '../engine/score';
import {
  ACircle,
  AEllipse,
  AG,
  APath,
  ARect,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING_UI,
  PulseRing,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  useCountUp,
  useDrawIn,
  useFlow,
  usePulse,
  useSharedValue,
  useTween,
  useVeil,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

/* ═══════════════════════ geometry (viewBox 340×420) ═══════════════════════ */

const VB_W = 340;
const VB_H = 420;
const REQUIRED_FINDS = 10;

/** Phase-A tap regions (disjoint; ≥46 viewBox units each way, and the render
 *  layer additionally expands every overlay to ≥44dp). `where` is the
 *  NEUTRAL location name used by overlays + the suspect list (no spoilers). */
const HIT: Record<string, { x: number; y: number; w: number; h: number; where: string }> = {
  'ri-9': { x: 118, y: 2, w: 120, h: 50, where: 'Top cable entry' },
  'ri-4': { x: 40, y: 54, w: 140, h: 46, where: 'Patch field — jack rows' },
  'ri-13': { x: 184, y: 54, w: 116, h: 46, where: 'Patch field — label strip' },
  'ri-8': { x: 0, y: 102, w: 52, h: 46, where: 'Left rail at the switch' },
  'ri-1': { x: 56, y: 102, w: 136, h: 46, where: 'Between patch field and switch' },
  'ri-12': { x: 0, y: 150, w: 100, h: 46, where: 'Left manager — interface lines' },
  'ri-2': { x: 196, y: 150, w: 118, h: 46, where: 'DSP rear — input jacks' },
  'ri-3': { x: 104, y: 158, w: 86, h: 48, where: 'Open bay — center of the rack' },
  'ri-11': { x: 0, y: 198, w: 100, h: 46, where: 'Left rail at the blank panel' },
  'ri-7': { x: 196, y: 198, w: 118, h: 46, where: 'Mid-rack bundle' },
  'ri-5': { x: 40, y: 250, w: 128, h: 64, where: 'Amplifier rear — connector field' },
  'ri-6': { x: 172, y: 250, w: 142, h: 64, where: 'Amplifier rear — vent grille' },
  'ri-10': { x: 40, y: 320, w: 128, h: 48, where: 'Power distro — inlet side' },
  'ri-14': { x: 172, y: 320, w: 142, h: 48, where: 'Below the power distro' },
};

const RAIL_HOLE_YS = [30, 52, 74, 96, 118, 140, 162, 184, 206, 228, 250, 272, 294, 316, 338, 360, 382];
const MANAGER_SLOT_YS = [50, 90, 130, 170, 210, 250, 290, 330, 370];
const PATCH_XS = [66, 84, 102, 120, 138, 156, 174, 192, 210, 228, 246, 264];
const HMGR_XS = [66, 82, 98, 114, 130, 146, 162, 178, 194, 210, 226, 242, 258, 274];
const SWITCH_XS = [62, 86, 110, 134, 158, 182, 206, 230];
const DSP_JACK_XS = [74, 102, 130, 158, 186, 214, 242, 270];
const IFACE_XS = [70, 92, 114, 136, 158, 180];
const AMP_VENT_XS = [180, 188, 196, 204, 212, 220, 228, 236, 244, 252, 260, 268];
const DISTRO_XS = [176, 195, 214, 233, 252];
const TIE_YS = [70, 128, 186, 244, 302, 348];

/* ── motion timing for this scene (see the header note) ──────────────────── */
/** Stagger between rack bands as the chassis assembles, top-to-bottom. */
const ASSEMBLE_STEP = 26;
const ASSEMBLE_DUR = 200;
/** The mess arrives after the rack has finished building itself. */
const CHAOS_AT = 420;
/** Undocumented defects start breathing only once the mess has landed — the
 *  learner's first read of this rack is the rack, not the markers. */
const HOTSPOT_AT = 1500;
/** After this the intro has fully landed; later mounts render at rest. */
const INTRO_END = 2200;
/** A loom pulls back out of its manager before it re-installs elsewhere. */
const RETRACT_MS = 260;
/** The trace beam waits for the veil, then runs the cable end to end. */
const TRACE_DELAY = 260;
const TRACE_DUR = 780;
/** "Signal just came alive" — a few marching cycles, then rest. */
const FLOW_MS = 2600;

/** Where each group's loom enters at the top slot (per group index). */
const ENTRY_XS = [156, 169, 182, 195, 208, 221];
/** Plausible terminating gear height per group. */
const DEST_Y: Record<string, number> = {
  'g-ac': 336,
  'g-analog': 164,
  'g-net': 120,
  'g-spk': 276,
  'g-ctl': 204,
  'g-fib': 131,
};

/** Honest loom paths — gentle bends, per-loom wobble, terminating at gear. */
function dLeft(ex: number, lane: number, ty: number, wob: number): string {
  return (
    `M${ex} 4 C${ex} 16 ${lane + 12} 16 ${lane + 4} 30 ` +
    `C${lane + (wob > 0 ? 1 : -1)} 38 ${lane} 48 ${lane} 60 ` +
    `L${lane} ${ty - 24} C${lane} ${ty - 10 + wob} ${lane + 6} ${ty} ${lane + 20} ${ty} L58 ${ty}`
  );
}
function dRight(ex: number, lane: number, ty: number, wob: number): string {
  return (
    `M${ex} 4 C${ex} 16 ${lane - 12} 16 ${lane - 4} 30 ` +
    `C${lane - (wob > 0 ? 1 : -1)} 38 ${lane} 48 ${lane} 60 ` +
    `L${lane} ${ty - 24} C${lane} ${ty - 10 + wob} ${lane - 6} ${ty} ${lane - 20} ${ty} L282 ${ty}`
  );
}

/** Approximate path length in viewBox units — the dash-reveal budget. Always
 *  OVER-estimated: a short estimate would leave a gap at the tail. */
const loomLen = (ex: number, lane: number, ty: number) => Math.round((Math.abs(ex - lane) + Math.abs(ty - 4) + 60) * 1.14);

/** Lanes are allocated by GROUP INDEX, never by assignment order, so
 *  reassigning one group can never shuffle another group's route (which would
 *  set five looms re-installing at once). */
const laneFor = (gi: number, left: boolean) => (left ? 12 + gi * 4 : 328 - gi * 4);
const hmgrY = (gi: number) => 97 + gi * 2;
const entryCx = (gi: number) => 188 + gi * 3;

/** Phase-C trace: patch port A-07 → left manager → DSP INPUT 7. */
const TRACE_D =
  'M175 74 C158 84 30 78 22 96 C20 100 20 104 20 112 L20 138 ' +
  'C20 148 28 148 40 148 L226 148 C236 148 242 151 242 156';
/** Over-estimated length of TRACE_D (see loomLen). */
const TRACE_LEN = 470;
/** Length of the travelling head that leads the beam down the cable. */
const BEAM_HEAD = 26;

/* ═════════════════ local motion primitives (kit-based, SVG-safe) ══════════ */

/**
 * ENTRANCE semantics: `enter` true = play the entrance; false = REST, which
 * for these helpers means fully present. That lets the scene drop the intro
 * flag once it has landed without anything popping back out.
 */
function SvgIn({ enter, delay = 0, dur = CI_MOTION.base, children }: { enter: boolean; delay?: number; dur?: number; children: ReactNode }) {
  const m = useCiMotion();
  const t = useSharedValue(enter && !m.reduce ? 0 : 1);
  useEffect(() => {
    cancelAnimation(t);
    if (!enter || m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: dur, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, delay, dur, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={enter && !m.reduce ? 0 : 1} animatedProps={p}>
      {children}
    </AG>
  );
}

/** STATE semantics: `show` false = hidden. For markers, flags and tags. */
function SvgToggle({ show, delay = 0, dur = CI_MOTION.base, children }: { show: boolean; delay?: number; dur?: number; children: ReactNode }) {
  const m = useCiMotion();
  const t = useSharedValue(show ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = show ? 1 : 0;
      return;
    }
    t.value = withDelay(show ? delay : 0, withTiming(show ? 1 : 0, { duration: dur, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, delay, dur, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={show ? 1 : 0} animatedProps={p}>
      {children}
    </AG>
  );
}

/**
 * A cable that installs itself along its route — useDrawIn's dash-reveal with
 * ENTRANCE rest semantics (not drawing ⇒ fully drawn, so a static rack, e.g.
 * the Phase-C BEFORE strip, renders complete on the first paint).
 */
function DrawPath({
  d,
  len,
  color,
  width,
  opacity = 1,
  enter,
  delay = 0,
  dur,
}: {
  d: string;
  len: number;
  color: string;
  width: number;
  opacity?: number;
  enter: boolean;
  delay?: number;
  dur?: number;
}) {
  const m = useCiMotion();
  const p = useSharedValue(enter && !m.reduce ? 0 : 1);
  useEffect(() => {
    cancelAnimation(p);
    if (!enter || m.reduce) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration: dur ?? Math.min(CI_MOTION.draw, 240 + len * 1.9), easing: CI_EASE.out }));
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, delay, dur, len, m.reduce]);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value) }));
  return (
    <APath
      d={d}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={len}
      strokeDashoffset={enter && !m.reduce ? len : 0}
      animatedProps={ap}
    />
  );
}

/** Same reveal, for the coils and service loops that are drawn as ellipses. */
function DrawEllipse({
  cx,
  cy,
  rx,
  ry,
  len,
  color,
  width,
  opacity = 1,
  enter,
  delay = 0,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  len: number;
  color: string;
  width: number;
  opacity?: number;
  enter: boolean;
  delay?: number;
}) {
  const m = useCiMotion();
  const p = useSharedValue(enter && !m.reduce ? 0 : 1);
  useEffect(() => {
    cancelAnimation(p);
    if (!enter || m.reduce) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration: Math.min(CI_MOTION.draw, 240 + len * 1.9), easing: CI_EASE.out }));
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, delay, len, m.reduce]);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value) }));
  return (
    <AEllipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      fill="none"
      strokeDasharray={len}
      strokeDashoffset={enter && !m.reduce ? len : 0}
      animatedProps={ap}
    />
  );
}

/** Spring a scalar to its target with the kit's UI spring (markers, ticks). */
function useSpringTo(target: number, initial = target) {
  const m = useCiMotion();
  const v = useSharedValue(initial);
  useEffect(() => {
    cancelAnimation(v);
    if (m.reduce) {
      v.value = target;
      return;
    }
    v.value = withSpring(target, CI_SPRING_UI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, m.reduce]);
  return v;
}

/** A settle-in pop for RN furniture — fires only on the RISING edge, so a
 *  chip that is already active at mount doesn't jump. */
function usePop(active: boolean, from = 0.94) {
  const m = useCiMotion();
  const s = useSharedValue(1);
  const was = useRef(active);
  useEffect(() => {
    const rising = active && !was.current;
    was.current = active;
    if (!rising || m.reduce) return;
    cancelAnimation(s);
    s.value = from;
    s.value = withSpring(1, CI_SPRING_UI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, from, m.reduce]);
  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}

/* ═══════════════════════════ SVG sub-layers ═══════════════════════════════ */

/** One rack band. On entry the rack assembles top-to-bottom: the skeleton
 *  first (index 0), then every piece of gear in the order it is racked. */
function Band({ index, enter, children }: { index: number; enter: boolean; children: ReactNode }) {
  return (
    <SvgIn enter={enter} delay={index * ASSEMBLE_STEP} dur={ASSEMBLE_DUR}>
      {children}
    </SvgIn>
  );
}

const Chassis = memo(function Chassis({ dress, enter }: { dress: boolean; enter: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={12} fill="#0d0d11" />
      <Band index={0} enter={enter}>
        {/* vertical cable managers, both sides */}
        <Rect x={6} y={20} width={34} height={386} rx={5} fill="#141419" stroke="#26262c" strokeWidth={1} />
        <Rect x={300} y={20} width={34} height={386} rx={5} fill="#141419" stroke="#26262c" strokeWidth={1} />
        {MANAGER_SLOT_YS.map((y) => (
          <G key={y}>
            <Line x1={6} y1={y} x2={14} y2={y} stroke="#26262c" strokeWidth={2} />
            <Line x1={32} y1={y} x2={40} y2={y} stroke="#26262c" strokeWidth={2} />
            <Line x1={300} y1={y} x2={308} y2={y} stroke="#26262c" strokeWidth={2} />
            <Line x1={326} y1={y} x2={334} y2={y} stroke="#26262c" strokeWidth={2} />
          </G>
        ))}
        {/* rails + mounting holes */}
        <Rect x={44} y={20} width={10} height={382} fill="#20202a" />
        <Rect x={286} y={20} width={10} height={382} fill="#20202a" />
        {RAIL_HOLE_YS.map((y) => (
          <G key={y}>
            <Circle cx={49} cy={y} r={1.7} fill="#0d0d11" />
            <Circle cx={291} cy={y} r={1.7} fill="#0d0d11" />
          </G>
        ))}
        <Rect x={44} y={402} width={252} height={9} rx={3} fill="#1a1a20" stroke="#2c2c33" strokeWidth={1} />
      </Band>

      <Band index={1} enter={enter}>
        {/* top panel + cable entry slot (dressed = finished grommet edge) */}
        <Rect x={44} y={6} width={252} height={14} rx={3} fill="#1a1a20" stroke="#2c2c33" strokeWidth={1} />
        <Rect x={150} y={9} width={80} height={8} rx={2.5} fill="#0a0a0e" />
        {dress ? <Rect x={149} y={8} width={82} height={10} rx={3.5} fill="none" stroke="#4a4a52" strokeWidth={1.4} /> : null}
      </Band>

      {/* ── patch panel (2U) ── */}
      <Band index={2} enter={enter}>
        <Rect x={54} y={46} width={232} height={40} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
        {PATCH_XS.map((cx) => (
          <G key={cx}>
            <Rect x={cx - 3.5} y={54} width={7} height={7} rx={1} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
            <Rect x={cx - 3.5} y={66} width={7} height={7} rx={1} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
          </G>
        ))}
        {dress
          ? PATCH_XS.map((cx) => (
              <Rect key={`lb${cx}`} x={cx - 5} y={78} width={10} height={5} rx={1} fill="#2a2416" stroke="#6b5a24" strokeWidth={0.7} />
            ))
          : null}
      </Band>

      {/* ── horizontal manager ── */}
      <Band index={3} enter={enter}>
        <Rect x={54} y={92} width={232} height={12} rx={2.5} fill="#1c1c22" stroke="#2c2c33" strokeWidth={1} />
        {HMGR_XS.map((x) => (
          <Line key={x} x1={x} y1={93} x2={x} y2={103} stroke="#101014" strokeWidth={3} />
        ))}
      </Band>

      {/* ── network switch ── */}
      <Band index={4} enter={enter}>
        <Rect x={54} y={110} width={232} height={28} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
        {SWITCH_XS.map((x, i) => (
          <G key={x}>
            <Rect x={x} y={119} width={11} height={9} rx={1} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
            <Circle cx={x + 5.5} cy={115} r={1.4} fill={i % 3 === 0 ? '#37d97b' : '#26332a'} />
          </G>
        ))}
        <Rect x={262} y={117} width={16} height={12} rx={1.5} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
      </Band>

      {/* ── DSP (numbered inputs only once the rack is dressed/labeled) ── */}
      <Band index={5} enter={enter}>
        <Rect x={54} y={144} width={232} height={40} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
        {DSP_JACK_XS.map((cx, i) => (
          <G key={cx}>
            <Circle cx={cx} cy={162} r={6} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
            <Circle cx={cx} cy={162} r={1.6} fill="#26262c" />
            {dress ? (
              <SvgText x={cx} y={180} fontSize={7} fill="#8a8a92" fontFamily={fonts.mono} textAnchor="middle">
                {String(i + 1)}
              </SvgText>
            ) : null}
          </G>
        ))}
      </Band>

      {/* ── audio interface ── */}
      <Band index={6} enter={enter}>
        <Rect x={54} y={190} width={232} height={28} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
        {IFACE_XS.map((cx) => (
          <Circle key={cx} cx={cx} cy={204} r={5} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
        ))}
        <Circle cx={244} cy={204} r={7} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
        <Circle cx={268} cy={204} r={7} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
      </Band>

      {/* ── blank 1U ── */}
      <Band index={7} enter={enter}>
        <Rect x={54} y={224} width={232} height={16} rx={2.5} fill="#15151a" stroke="#26262c" strokeWidth={1} />
        <Circle cx={62} cy={232} r={2} fill="#26262c" />
        <Circle cx={278} cy={232} r={2} fill="#26262c" />
      </Band>

      {/* ── amplifier (connector field left · vent grille right) ── */}
      <Band index={8} enter={enter}>
        <Rect x={54} y={248} width={232} height={68} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
        <Circle cx={78} cy={272} r={8.5} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
        <Line x1={78} y1={266} x2={78} y2={272} stroke="#3a3c42" strokeWidth={1.6} />
        <Circle cx={106} cy={272} r={8.5} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
        <Line x1={106} y1={266} x2={106} y2={272} stroke="#3a3c42" strokeWidth={1.6} />
        <Rect x={130} y={264} width={20} height={15} rx={2} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
        {AMP_VENT_XS.map((x) => (
          <Line key={x} x1={x} y1={258} x2={x} y2={306} stroke="#101014" strokeWidth={3.5} />
        ))}
        {dress ? (
          <>
            <Rect x={70} y={288} width={16} height={6} rx={1} fill="#2a2416" stroke="#6b5a24" strokeWidth={0.7} />
            <Rect x={98} y={288} width={16} height={6} rx={1} fill="#2a2416" stroke="#6b5a24" strokeWidth={0.7} />
          </>
        ) : null}
      </Band>

      {/* ── power distro (inlets straight only when dressed) ── */}
      <Band index={9} enter={enter}>
        <Rect x={54} y={326} width={232} height={30} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
        {DISTRO_XS.map((x) => (
          <Rect key={x} x={x} y={334} width={15} height={11} rx={1.5} fill="#101014" stroke="#3a3c42" strokeWidth={0.9} />
        ))}
        <Circle cx={273} cy={340} r={4} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
        {dress ? (
          <>
            <Rect x={64} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.1} />
            <Rect x={90} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.1} />
            <Rect x={116} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.1} />
          </>
        ) : null}
      </Band>

      {/* ── blank 2U ── */}
      <Band index={10} enter={enter}>
        <Rect x={54} y={362} width={232} height={24} rx={2.5} fill="#15151a" stroke="#26262c" strokeWidth={1} />
        <Circle cx={62} cy={374} r={2} fill="#26262c" />
        <Circle cx={278} cy={374} r={2} fill="#26262c" />
      </Band>
    </>
  );
});

/**
 * Every visibly-wrong detail of the Phase-A rack (one vignette per issue,
 * localized to its HIT region so the drawing stays readable, not spaghetti).
 *
 * MOTION — once the rack has finished assembling, the mess ARRIVES: each run
 * draws itself in, deliberately out of order and overlapping, because that is
 * exactly how this cabling was installed. Sibling strokes that share a colour
 * and weight are merged into one multi-subpath `d` so a whole vignette costs
 * ONE animated node instead of four (the rack SVG is large — node count is the
 * budget here). Delays are hand-scattered: a clean 1-2-3 stagger would read as
 * a tidy install, which is the opposite of the point.
 */
const BadCables = memo(function BadCables({ enter }: { enter: boolean }) {
  const P = CI_CLASS_TINTS.power;
  const A = CI_CLASS_TINTS.analog;
  const N = CI_CLASS_TINTS.network;
  const S = CI_CLASS_TINTS.speaker;
  const C = CI_CLASS_TINTS.control;
  const flag = '#ff9b8f';
  const at = (rel: number) => CHAOS_AT + rel;
  return (
    <>
      {/* faint background disorder (kept low so each defect stays readable) */}
      <DrawPath d="M40 60 C120 140 60 240 150 330" len={380} color="#6f7378" width={2} opacity={0.2} enter={enter} delay={at(0)} />
      <DrawPath d="M300 80 C230 180 300 260 210 366" len={390} color="#6f7378" width={2} opacity={0.16} enter={enter} delay={at(40)} />

      {/* ri-9 — trunk dives over the raw top edge (hard corners, no grommet) */}
      <DrawPath d="M168 0 L168 16 L176 24 L176 46" len={58} color={A} width={4} enter={enter} delay={at(70)} />
      <DrawPath d="M188 0 L188 15 L195 24 L195 50" len={62} color={N} width={3.5} enter={enter} delay={at(140)} />
      <DrawPath d="M207 0 L207 17 L201 25 L201 44" len={56} color={P} width={4} enter={enter} delay={at(100)} />
      <SvgIn enter={enter} delay={at(420)}>
        <Line x1={152} y1={17} x2={228} y2={17} stroke={flag} strokeWidth={1} opacity={0.7} />
      </SvgIn>

      {/* ri-4 — the label strip is empty (dashed = where labels should be) */}
      <SvgIn enter={enter} delay={at(470)}>
        <Rect x={60} y={78} width={112} height={9} rx={1.5} fill="none" stroke="#4a4a52" strokeWidth={1} strokeDasharray="4 3" />
      </SvgIn>

      {/* ri-13 — the only two labels disagree (different marks, one crooked) */}
      <SvgIn enter={enter} delay={at(440)}>
        <Rect x={206} y={77} width={17} height={10} rx={1.5} fill="#26262c" stroke="#8a8a92" strokeWidth={0.9} />
        <Line x1={209} y1={82} x2={220} y2={82} stroke={colors.amberLabel} strokeWidth={1.2} />
        {/* static transform — evaluated at render time, never animated */}
        <G transform="rotate(9 244 82)">
          <Rect x={236} y={77} width={17} height={10} rx={1.5} fill="#26262c" stroke="#8a8a92" strokeWidth={0.9} />
          <Line x1={239} y1={82} x2={246} y2={82} stroke={colors.amberLabel} strokeWidth={1.2} />
        </G>
      </SvgIn>

      {/* ri-1 — power + mic looms twisted through each other */}
      <DrawPath d="M56 96 C86 114 118 92 148 110 C166 120 178 100 190 106" len={175} color={P} width={4} enter={enter} delay={at(30)} />
      <DrawPath d="M56 108 C86 92 118 114 148 94 C166 86 178 108 190 100" len={175} color={A} width={3.5} enter={enter} delay={at(110)} />
      <DrawPath d="M56 102 C90 108 120 98 152 112" len={115} color={A} width={2.5} opacity={0.8} enter={enter} delay={at(190)} />

      {/* ri-8 — Cat6 folded 180° over the left rail edge */}
      <DrawPath d="M74 116 L54 116 Q46 116 46 123 Q46 130 54 130 L74 130" len={72} color={N} width={4} enter={enter} delay={at(250)} />
      <SvgIn enter={enter} delay={at(400)}>
        <Path d="M43 119 l-4 -3 M43 127 l-4 3" stroke={flag} strokeWidth={1.4} fill="none" />
      </SvgIn>

      {/* ri-2 — XLR loom hanging its full weight on the DSP jacks */}
      <DrawPath
        d="M214 166 C214 184 226 190 238 188 M242 166 C242 182 248 187 254 186 M270 166 C270 180 268 186 262 186"
        len={88}
        color={A}
        width={3.5}
        enter={enter}
        delay={at(160)}
      />
      <DrawPath d="M238 188 C252 192 268 190 282 178 L296 172" len={72} color={A} width={5} enter={enter} delay={at(300)} />
      <SvgIn enter={enter} delay={at(460)}>
        <Path d="M210 170 q4 4 8 0 M238 170 q4 4 8 0 M266 170 q4 4 8 0" stroke={flag} strokeWidth={1.2} fill="none" />
      </SvgIn>

      {/* ri-12 — interface lines bowstring-tight (dead straight, twang marks) */}
      <DrawPath d="M24 130 L60 196" len={84} color={C} width={2.5} enter={enter} delay={at(60)} />
      <DrawPath d="M30 132 L66 198" len={84} color={A} width={2.5} enter={enter} delay={at(120)} />
      <SvgIn enter={enter} delay={at(320)}>
        <Line x1={40} y1={161} x2={47} y2={157} stroke={flag} strokeWidth={1.3} />
        <Line x1={46} y1={166} x2={53} y2={162} stroke={flag} strokeWidth={1.3} />
      </SvgIn>

      {/* ri-3 — a drum of excess Cat6 stuffed into the bay (winds itself in) */}
      <DrawEllipse cx={146} cy={178} rx={25} ry={15} len={140} color={N} width={3} enter={enter} delay={at(210)} />
      <DrawEllipse cx={146} cy={178} rx={18} ry={10} len={100} color={N} width={3} opacity={0.85} enter={enter} delay={at(240)} />
      <DrawEllipse cx={146} cy={178} rx={10} ry={5.5} len={58} color={N} width={3} opacity={0.7} enter={enter} delay={at(270)} />
      <DrawPath
        d="M121 174 C110 168 104 158 100 148 M170 182 C180 187 187 190 192 192"
        len={66}
        color={N}
        width={3}
        enter={enter}
        delay={at(330)}
      />

      {/* ri-11 — service loops zip-tied hard against the rail, unreachable */}
      <DrawEllipse cx={40} cy={226} rx={13} ry={11} len={86} color={A} width={2.5} enter={enter} delay={at(380)} />
      <DrawEllipse cx={42} cy={227} rx={8} ry={7} len={56} color={N} width={2.5} enter={enter} delay={at(410)} />
      <SvgIn enter={enter} delay={at(470)}>
        <Line x1={32} y1={214} x2={50} y2={238} stroke="#e8e8ea" strokeWidth={2} />
        <Line x1={50} y1={214} x2={32} y2={238} stroke="#e8e8ea" strokeWidth={2} />
      </SvgIn>

      {/* ri-7 — ties cinched until the snake is oval (hourglass pinches) */}
      <DrawPath
        d="M202 210 Q230 217 256 210 Q272 218 298 211 M202 216 L298 216 M202 222 Q230 215 256 222 Q272 214 298 221"
        len={320}
        color={A}
        width={3}
        enter={enter}
        delay={at(130)}
      />
      <SvgIn enter={enter} delay={at(300)}>
        <Rect x={228} y={207} width={3} height={17} fill="#e8e8ea" />
        <Rect x={270} y={207} width={3} height={17} fill="#e8e8ea" />
        <Ellipse cx={229.5} cy={216} rx={4.5} ry={8} stroke={flag} strokeWidth={1.3} fill="none" />
        <Ellipse cx={271.5} cy={216} rx={4.5} ry={8} stroke={flag} strokeWidth={1.3} fill="none" />
      </SvgIn>

      {/* ri-5 — amp rear blocked by a taut strapped bundle (dead straight) */}
      <DrawPath d="M48 262 L170 264" len={132} color={S} width={4.5} enter={enter} delay={at(350)} />
      <DrawPath d="M48 270 L170 271" len={132} color={A} width={3.5} enter={enter} delay={at(380)} />
      <DrawPath d="M48 277 L170 277" len={132} color={P} width={4} enter={enter} delay={at(410)} />
      <SvgIn enter={enter} delay={at(470)}>
        <Rect x={56} y={258} width={2.5} height={23} fill="#e8e8ea" />
        <Rect x={158} y={258} width={2.5} height={23} fill="#e8e8ea" />
      </SvgIn>

      {/* ri-6 — loom dressed straight across the amp's intake grille */}
      <DrawPath d="M172 288 C200 283 236 293 270 287 L296 285" len={145} color={S} width={6} enter={enter} delay={at(200)} />
      <DrawPath d="M172 296 C204 292 240 299 296 293" len={142} color={S} width={4} opacity={0.9} enter={enter} delay={at(260)} />

      {/* ri-10 — power connectors levered sideways by the bundle */}
      <DrawPath
        d="M78 341 C96 350 118 352 138 351 M104 342 C120 351 138 353 152 352 M130 341 C146 349 158 352 168 352"
        len={175}
        color={P}
        width={3.5}
        enter={enter}
        delay={at(440)}
      />
      <SvgIn enter={enter} delay={at(500)}>
        {/* static transforms — evaluated at render time, never animated */}
        <G transform="rotate(10 71 338)">
          <Rect x={64} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.2} />
        </G>
        <G transform="rotate(14 97 338)">
          <Rect x={90} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.2} />
        </G>
        <G transform="rotate(8 123 338)">
          <Rect x={116} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.2} />
        </G>
        <Path d="M78 332 l4 -4 M104 331 l4 -4" stroke={flag} strokeWidth={1.2} fill="none" />
      </SvgIn>

      {/* ri-14 — AC distro feeds woven through the analog loom */}
      <DrawPath d="M176 350 C200 342 220 360 244 350 C260 343 276 357 298 349" len={148} color={P} width={4} enter={enter} delay={at(90)} />
      <DrawPath d="M176 358 C200 364 222 346 246 357 C262 363 278 348 298 356" len={150} color={A} width={3} enter={enter} delay={at(170)} />
      <DrawPath d="M180 344 C206 352 228 340 252 351" len={92} color={A} width={2.5} opacity={0.8} enter={enter} delay={at(290)} />
    </>
  );
});

/** The outgoing route, pulled back out of the manager. Dash offset GROWS, so
 *  the loom withdraws destination-first, back toward the entry. */
function Retract({ d, len, tint, width }: { d: string; len: number; tint: string; width: number }) {
  const p = useSharedValue(1);
  useEffect(() => {
    p.value = withTiming(0, { duration: RETRACT_MS, easing: CI_EASE.inOut });
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value), opacity: 0.2 + 0.65 * p.value }));
  return (
    <APath
      d={d}
      stroke={tint}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      opacity={0.85}
      strokeDasharray={len}
      strokeDashoffset={0}
      animatedProps={ap}
    />
  );
}

/**
 * ONE learner-assigned loom — THE PHASE-B SIGNATURE MOVE.
 *   assign     → the loom INSTALLS ITSELF down the chosen manager (useDrawIn),
 *                source → gear, and its termination lands when the draw lands.
 *   reassign   → the old route RETRACTS back out of the manager first, THEN
 *                the new one installs. A cable gets pulled and re-dressed; it
 *                never teleports.
 *   revealed   → correct looms take a brief FLOW pulse (signal just came
 *                alive); wrong ones breathe a dashed-red flag until fixed.
 * `install` false renders the finished route statically — Phase C is about the
 * trace, and the BEFORE strip must be complete on its first paint.
 */
function Loom({
  d,
  len,
  tint,
  width,
  install,
  wrong,
  wrongShape,
  flowRun,
  tail,
}: {
  d: string;
  len: number;
  tint: string;
  width: number;
  install: boolean;
  wrong: boolean;
  wrongShape: ReactNode;
  flowRun: boolean;
  tail?: ReactNode;
}) {
  const m = useCiMotion();
  const prev = useRef<{ d: string; len: number } | null>(null);
  const [leaving, setLeaving] = useState<{ d: string; len: number } | null>(null);
  const [landed, setLanded] = useState(!install);

  useEffect(() => {
    const was = prev.current;
    prev.current = { d, len };
    if (!was || was.d === d || !install || m.reduce) return;
    setLanded(false);
    setLeaving(was);
    const id = setTimeout(() => setLeaving(null), RETRACT_MS + 40);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, len, install, m.reduce]);

  const draw = useDrawIn(len, { run: install && !leaving, onDone: () => setLanded(true) });
  const { t: wrongT } = usePulse({ run: wrong, period: 1100 });
  const wrongProps = useAnimatedProps(() => ({ opacity: 0.4 + 0.6 * wrongT.value }));
  const flow = useFlow({ run: flowRun, speed: 900, dash: 7, gap: 13 });

  return (
    <G>
      {install ? (
        <APath
          d={d}
          stroke={tint}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          opacity={0.92}
          strokeDasharray={draw.dashArray}
          strokeDashoffset={draw.restOffset}
          animatedProps={draw.animatedProps}
        />
      ) : (
        <Path d={d} stroke={tint} strokeWidth={width} fill="none" strokeLinecap="round" opacity={0.92} />
      )}
      {leaving ? <Retract d={leaving.d} len={leaving.len} tint={tint} width={width} /> : null}
      {flowRun ? (
        <APath
          d={d}
          stroke="#f4fbff"
          strokeWidth={Math.max(1.4, width - 2.2)}
          fill="none"
          strokeLinecap="round"
          opacity={0.72}
          strokeDasharray={flow.dashArray}
          animatedProps={flow.animatedProps}
        />
      ) : null}
      {tail ? (
        <SvgToggle show={landed} dur={CI_MOTION.quick}>
          {tail}
        </SvgToggle>
      ) : null}
      {wrong ? (
        <AG opacity={0.9} animatedProps={wrongProps}>
          {wrongShape}
        </AG>
      ) : null}
    </G>
  );
}

/** Learner-assigned looms of the dressed rack (Phase B/C). Lanes are allocated
 *  by GROUP INDEX, never by assignment order, so reassigning one group can
 *  never shuffle another group's route. Wrong assignments render honestly
 *  (entry coil / hmgr dangle) and get a breathing dashed flag once revealed. */
function Looms({
  assigns,
  wrongIds,
  dim,
  install,
  flowOn,
}: {
  assigns: Record<string, string>;
  wrongIds?: readonly string[] | null;
  dim?: boolean;
  install: boolean;
  flowOn: boolean;
}) {
  const dimT = useTween(dim ? 0.16 : 1, CI_MOTION.base);
  const dimProps = useAnimatedProps(() => ({ opacity: dimT.value }));
  return (
    <AG opacity={dim ? 0.16 : 1} animatedProps={dimProps}>
      {/* patch-field leads organized through the horizontal manager */}
      {[102, 138, 174, 210].map((cx) => (
        <Path key={cx} d={`M${cx} 74 C${cx} 82 ${cx + 5} 87 ${cx + 7} 92`} stroke={CI_CLASS_TINTS.analog} strokeWidth={2} fill="none" opacity={0.8} />
      ))}
      {CI_RACK_GROUPS.map((g, gi) => {
        const zone = assigns[g.id];
        if (!zone) return null;
        const tint = CI_CLASS_TINTS[g.tintKey];
        const ex = ENTRY_XS[gi];
        const wrong = !!wrongIds && wrongIds.includes(g.id);
        const flowRun = flowOn && !!wrongIds && !wrongIds.includes(g.id);

        if (zone === 'z-left' || zone === 'z-right') {
          const isL = zone === 'z-left';
          const lane = laneFor(gi, isL);
          const ty = DEST_Y[g.id];
          const wob = ((gi % 3) - 1) * 3;
          const d = isL ? dLeft(ex, lane, ty, wob) : dRight(ex, lane, ty, wob);
          return (
            <Loom
              key={g.id}
              d={d}
              len={loomLen(ex, lane, ty)}
              tint={tint}
              width={4.2}
              install={install}
              wrong={wrong}
              flowRun={flowRun}
              tail={<Circle cx={isL ? 58 : 282} cy={ty} r={3.4} fill={tint} />}
              wrongShape={<Path d={d} stroke="#ff5a48" strokeWidth={1.6} fill="none" strokeDasharray="5 4" />}
            />
          );
        }

        if (zone === 'z-entry') {
          const cx = entryCx(gi);
          return (
            <Loom
              key={g.id}
              d={`M${ex} 4 C${ex} 10 ${ex - 4} 16 ${cx} 22`}
              len={48}
              tint={tint}
              width={4}
              install={install}
              wrong={wrong}
              flowRun={flowRun}
              tail={
                <>
                  <Ellipse cx={cx} cy={28} rx={17} ry={7} stroke={tint} strokeWidth={3.5} fill="none" />
                  <Ellipse cx={cx} cy={28} rx={11} ry={4.5} stroke={tint} strokeWidth={3} fill="none" opacity={0.85} />
                </>
              }
              wrongShape={<Ellipse cx={cx} cy={28} rx={21} ry={10} stroke="#ff5a48" strokeWidth={1.5} strokeDasharray="5 4" fill="none" />}
            />
          );
        }

        const yRun = hmgrY(gi);
        const dh =
          `M${ex} 4 C${ex} 34 ${Math.min(262, ex + 44)} 62 252 ${yRun - 7} ` +
          `C246 ${yRun} 236 ${yRun} 224 ${yRun} L86 ${yRun} Q76 ${yRun} 76 ${yRun + 9}`;
        return (
          <Loom
            key={g.id}
            d={dh}
            len={360}
            tint={tint}
            width={4}
            install={install}
            wrong={wrong}
            flowRun={flowRun}
            wrongShape={<Path d={dh} stroke="#ff5a48" strokeWidth={1.6} strokeDasharray="5 4" fill="none" />}
          />
        );
      })}
      {/* manager straps riding over the dressed looms */}
      {TIE_YS.map((y) => (
        <G key={y} opacity={0.8}>
          <Line x1={10} y1={y} x2={36} y2={y} stroke="#5a5a64" strokeWidth={2.4} strokeLinecap="round" />
          <Line x1={304} y1={y} x2={330} y2={y} stroke="#5a5a64" strokeWidth={2.4} strokeLinecap="round" />
        </G>
      ))}
    </AG>
  );
}

/**
 * THE PHASE-C SIGNATURE MOVE — the TRACE SWEEP.
 *   1. the veil drops over the rack (~280ms) and the looms dim underneath
 *   2. a BEAM runs the length of the one cable, patch field → DSP input: the
 *      core lights along the route behind a travelling head, so it reads as
 *      something moving down the cable, not a highlight switching on
 *   3. the A-07 tags land at both ends once the beam has arrived
 * One clock (useDrawIn's progress) drives the halo, the core and the head —
 * three mappers, one animation.
 */
function TraceBeam({ run }: { run: boolean }) {
  const A = CI_CLASS_TINTS.analog;
  const veil = useVeil(run, 0.62);
  const draw = useDrawIn(TRACE_LEN, { run, delay: TRACE_DELAY, duration: TRACE_DUR });
  const { progress } = draw;

  /** The cable brightens on the same clock the rack dims on. */
  const coreProps = useAnimatedProps(() => ({
    strokeDashoffset: TRACE_LEN * (1 - progress.value),
    opacity: veil.t.value,
  }));
  const haloProps = useAnimatedProps(() => ({
    strokeDashoffset: TRACE_LEN * (1 - progress.value),
    opacity: 0.3 * Math.min(1, progress.value * 4) * veil.t.value,
  }));
  /** The head sits just ahead of the lit section and fades out as it arrives. */
  const headProps = useAnimatedProps(() => ({
    strokeDashoffset: BEAM_HEAD - TRACE_LEN * progress.value,
    opacity: progress.value <= 0 ? 0 : (1 - Math.max(0, (progress.value - 0.82) / 0.18)) * veil.t.value,
  }));

  return (
    <>
      <ARect x={0} y={0} width={VB_W} height={VB_H} rx={12} fill="#0d0d11" opacity={0} animatedProps={veil.animatedProps} />
      <APath
        d={TRACE_D}
        stroke={A}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        opacity={0}
        strokeDasharray={TRACE_LEN}
        strokeDashoffset={TRACE_LEN}
        animatedProps={haloProps}
      />
      <APath
        d={TRACE_D}
        stroke={A}
        strokeWidth={4.2}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={TRACE_LEN}
        strokeDashoffset={TRACE_LEN}
        animatedProps={coreProps}
      />
      <APath
        d={TRACE_D}
        stroke="#f2fbff"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        opacity={0}
        strokeDasharray={`${BEAM_HEAD} ${TRACE_LEN}`}
        strokeDashoffset={BEAM_HEAD}
        animatedProps={headProps}
      />
      <SvgToggle show={run} delay={TRACE_DELAY + 120}>
        <Circle cx={175} cy={70} r={7.5} stroke={colors.amber} strokeWidth={2} fill="none" />
        <Rect x={142} y={80} width={30} height={11} rx={2} fill="#26262c" stroke={colors.amber} strokeWidth={0.8} />
        <SvgText x={157} y={88.5} fontSize={7} fill={colors.amber} fontFamily={fonts.mono} textAnchor="middle">
          A-07
        </SvgText>
      </SvgToggle>
      <SvgToggle show={run} delay={TRACE_DELAY + TRACE_DUR * 0.85}>
        <Circle cx={242} cy={162} r={10} stroke={colors.amber} strokeWidth={2.2} fill="none" />
        <Rect x={252} y={140} width={30} height={11} rx={2} fill="#26262c" stroke={colors.amber} strokeWidth={0.8} />
        <SvgText x={267} y={148.5} fontSize={7} fill={colors.amber} fontFamily={fonts.mono} textAnchor="middle">
          A-07
        </SvgText>
        <SvgText x={242} y={185} fontSize={6.5} fill="#e6e6e6" fontFamily={fonts.mono} textAnchor="middle">
          IN 7
        </SvgText>
      </SvgToggle>
    </>
  );
}

/** The wrong jack: a short red pulse on that jack — three beats, then rest.
 *  The veil never drops, because nothing was traced. */
function WrongJack({ jack, gen }: { jack: number; gen: number }) {
  const m = useCiMotion();
  const cx = DSP_JACK_XS[jack - 1];
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 260, easing: CI_EASE.inOut }), 5, true);
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jack, gen, m.reduce]);
  const p = useAnimatedProps(() => ({ r: 10 + 3.5 * t.value, opacity: 1 - 0.45 * t.value }));
  return <ACircle cx={cx} cy={162} r={10} stroke="#ff5a48" strokeWidth={2.2} fill="none" animatedProps={p} />;
}

/**
 * ONE defect marker.
 *   undocumented → a subtle breathing hotspot (PulseRing). Every marker's loop
 *     is STARTED on its own delay, so the phases are permanently offset and
 *     the field never pulses in unison — pulsing in unison is the 1994 tell.
 *     These say "inspect here"; what is wrong is still the learner's call, and
 *     the SUSPECT LIST already names all fourteen locations.
 *   documented → the loop STOPS, the amber marker springs in on the kit's UI
 *     spring, and a ✓ tick draws itself alongside.
 */
function DefectMarker({ id, found, hot, pulse, index }: { id: string; found: boolean; hot: boolean; pulse: boolean; index: number }) {
  const m = useCiMotion();
  const hit = HIT[id];
  const cx = hit.x + hit.w / 2;
  const cy = hit.y + hit.h / 2;
  const R = hot ? 13 : 11;

  // Each hotspot's loop STARTS on its own delay ⇒ permanently offset phases.
  const [breathing, setBreathing] = useState(false);
  useEffect(() => {
    if (!pulse || found) {
      setBreathing(false);
      return;
    }
    const wait = setTimeout(() => setBreathing(true), m.reduce ? 0 : index * 130);
    return () => clearTimeout(wait);
  }, [pulse, found, index, m.reduce]);

  const r = useSpringTo(found ? R : 0, 0);
  const t = useTween(found ? 1 : 0, CI_MOTION.base);
  const ringProps = useAnimatedProps(() => ({ r: Math.max(0.01, r.value), opacity: Math.min(1, r.value / R) }));
  const glyphProps = useAnimatedProps(() => ({ opacity: t.value }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: 13 * (1 - t.value), opacity: t.value }));

  return (
    <G>
      {!found && breathing ? (
        <>
          <Circle cx={cx} cy={cy} r={2.4} fill="rgba(255,198,77,0.34)" />
          <PulseRing cx={cx} cy={cy} r={6.5} color={colors.amberLabel} run strokeWidth={1.3} />
        </>
      ) : null}
      {/* The documented state only MOUNTS once found — the hooks above always
          run, so the spring and the tween are already at their start values and
          the first committed frame is the hidden one. Fourteen markers × three
          idle animated nodes is not a bill this rack needs to pay. */}
      {found ? (
        <>
          <ACircle
            cx={cx}
            cy={cy}
            r={0.01}
            fill="rgba(255,198,77,0.12)"
            stroke={colors.amber}
            strokeWidth={hot ? 2.4 : 1.8}
            animatedProps={ringProps}
          />
          <AG opacity={0} animatedProps={glyphProps}>
            <SvgText x={cx} y={cy + 4} fontSize={11} fill={colors.amber} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
              !
            </SvgText>
          </AG>
          <APath
            d={`M${cx + 8} ${cy - 9} l3 3.4 l5.5 -7`}
            stroke={colors.green}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0}
            strokeDasharray={13}
            strokeDashoffset={13}
            animatedProps={tickProps}
          />
        </>
      ) : null}
    </G>
  );
}

function DefectMarkers({ found, lastFound, pulse }: { found: ReadonlySet<string>; lastFound: string | null; pulse: boolean }) {
  return (
    <>
      {CI_RACK_ISSUES.map((i, idx) => (
        <DefectMarker key={i.id} id={i.id} index={idx} found={found.has(i.id)} hot={lastFound === i.id} pulse={pulse} />
      ))}
    </>
  );
}

type CSel = { jack: number; ok: boolean } | null;

/**
 * `enter` plays the Phase-A intro (assemble → the mess draws in); `install`
 * plays the Phase-B loom install. Both default OFF for secondary racks (the
 * Phase-C BEFORE strip), which must be complete on their first paint and must
 * never add animating nodes to a screen that already has a beam running.
 * No gradient or clip ids anywhere in this tree, so the two <Svg> roots on
 * screen at once cannot collide.
 */
function RackSvg({
  w,
  mode,
  enter = false,
  install = false,
  found,
  lastFound,
  pulse = false,
  assigns,
  wrongIds,
  flowOn = false,
  cSel,
  wrongGen = 0,
}: {
  w: number;
  mode: 'bad' | 'dress';
  enter?: boolean;
  install?: boolean;
  found?: ReadonlySet<string>;
  lastFound?: string | null;
  pulse?: boolean;
  assigns?: Record<string, string>;
  wrongIds?: readonly string[] | null;
  flowOn?: boolean;
  cSel?: CSel;
  wrongGen?: number;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  const dress = mode === 'dress';
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Chassis dress={dress} enter={enter} />
      {dress ? (
        <Looms assigns={assigns ?? {}} wrongIds={wrongIds} dim={!!cSel?.ok} install={install} flowOn={flowOn} />
      ) : (
        <BadCables enter={enter} />
      )}
      {!dress && found ? <DefectMarkers found={found} lastFound={lastFound ?? null} pulse={pulse} /> : null}
      {/* mounted for the whole of Phase C (cSel is passed, possibly null) so the
          veil and the beam have somewhere to animate FROM on the first trace */}
      {cSel !== undefined ? <TraceBeam run={!!cSel?.ok} /> : null}
      {cSel && !cSel.ok ? <WrongJack jack={cSel.jack} gen={wrongGen} /> : null}
    </Svg>
  );
}

/* ═══════════════════════════ phase D + close data ═════════════════════════ */

const D_OPTIONS: { title: string; body: string; verdict: string; ok: boolean }[] = [
  {
    title: 'STRIP THE RACK',
    body: 'Unplug every cable in the rack so nothing is in the way, swap the switch, reconnect everything from memory.',
    verdict: 'Every system in the rack just went down for one device — and reconnecting from memory is where mystery faults are born. The dressing made this unnecessary.',
    ok: false,
  },
  {
    title: 'CUT THE DRESSING',
    body: 'Cut every tie and strap so the looms fall free, dig the switch out, tidy it all up later.',
    verdict: 'One swap just destroyed the whole rack’s dressing — hours of rework, and every disturbed connection becomes a new suspect. Restraints come off selectively, never wholesale.',
    ok: false,
  },
  {
    title: 'USE THE DRESSING',
    body: 'Identify the switch’s own cables by their labels, unplug only those, take up their service slack from the managers, slide the switch out.',
    verdict: 'Labels identify its cables, the managers keep every other loom in place, and the intentional slack lets this one unit move. Unrelated equipment never notices.',
    ok: true,
  },
  {
    title: 'FORCE IT',
    body: 'Leave everything connected and muscle the switch out past the dressed looms — cable flexes, it will be fine.',
    verdict: 'Cable does not stretch — terminations and connectors tear, invisibly. Forcing gear past the dressing damages the exact cables that still work.',
    ok: false,
  },
];
const D_CORRECT = 2;

const PRINCIPLES: { text: string; ruleId?: string }[] = [
  { text: 'Strain is relieved before it reaches any termination', ruleId: 'mech-strain-relief' },
  { text: 'Connectors carry signal — never cable weight' },
  { text: 'Any one cable or device comes out without disturbing its neighbors' },
  { text: 'Power and signal routes follow the project’s plan' },
  { text: 'Airflow beats aesthetics — intakes and exhausts stay clear', ruleId: 'rack-airflow' },
  { text: 'Labels are readable where the technician actually stands' },
  { text: 'Excess is intentional slack in managers — never a stuffed drum', ruleId: 'rack-excess' },
  { text: 'Dressing is not maximum tightness — real cable needs natural bends', ruleId: 'rack-not-max-tight' },
];

type Phase = 'a' | 'b' | 'c' | 'd';

const PHASES: { id: Phase; tag: string; name: string }[] = [
  { id: 'a', tag: 'A', name: 'INSPECT' },
  { id: 'b', tag: 'B', name: 'DRESS' },
  { id: 'c', tag: 'C', name: 'SERVICE' },
  { id: 'd', tag: 'D', name: 'MAINTAIN' },
];

const zoneById = (id: string) => CI_RACK_ZONES.find((z) => z.id === id);
const ZONE_SHORT: Record<string, string> = { 'z-left': 'LEFT MGR', 'z-right': 'RIGHT MGR', 'z-entry': 'ENTRY', 'z-hmgr': 'HORIZ MGR' };

/** The counter ticks to its value. Isolated in its own leaf so the count-up's
 *  per-frame re-render can never reach the (large) rack SVG. Because useCountUp
 *  animates FROM the last shown value, a +1 find passes through at most two
 *  integers — the polite live region gets a tick, not a flood. */
function FoundCounter({ found, required, total }: { found: number; required: number; total: number }) {
  const shown = useCountUp(found, CI_MOTION.reveal);
  return <FindProgress found={shown} required={required} total={total} />;
}

/** A phase chip that animates its own state change: the active wash fades in,
 *  and a newly completed phase ticks in on a spring. */
function PhaseChip({
  tag,
  name,
  active,
  done,
  open,
  onPress,
}: {
  tag: string;
  name: string;
  active: boolean;
  done: boolean;
  open: boolean;
  onPress: () => void;
}) {
  const glow = useTween(active ? 1 : 0, CI_MOTION.quick);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const pop = usePop(done || active, 0.9);
  return (
    <Pressable
      style={[styles.phaseChip, done && styles.phaseChipDone, active && styles.phaseChipActive, !open && styles.phaseChipLocked]}
      disabled={!open}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !open }}
      accessibilityLabel={`Phase ${tag}: ${name}${done ? ', complete' : open ? '' : ', locked'}`}
    >
      <Animated.View pointerEvents="none" style={[styles.phaseChipWash, glowStyle]} />
      <Animated.View style={[styles.phaseChipInner, pop]}>
        <Text style={[styles.phaseChipTag, done && { color: colors.green }, active && !done && { color: colors.amber }]}>
          {done ? '✓' : tag}
        </Text>
        <Text style={[styles.phaseChipName, active && { color: colors.textPrimary }]}>{name}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** A Phase-D approach. The approved one SETTLES on the kit's UI spring — the
 *  only card in the set that is given any mass. */
function ApproachCard({
  title,
  body,
  picked,
  ok,
  disabled,
  onPress,
}: {
  title: string;
  body: string;
  picked: boolean;
  ok: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const settle = usePop(picked && ok, 0.965);
  return (
    <Animated.View style={settle}>
      <Pressable
        style={[styles.optCard, picked && (ok ? styles.optCardRight : styles.optCardWrong)]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: picked, disabled }}
        accessibilityLabel={`${title}. ${body}`}
      >
        <Text style={[styles.optTitle, picked && { color: ok ? colors.green : '#ff9b8f' }]}>
          {picked ? (ok ? '✓ ' : '✕ ') : ''}
          {title}
        </Text>
        <Text style={styles.optBody}>{body}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ═══════════════════════════════ the scene ════════════════════════════════ */

export function RackScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [phase, setPhase] = useState<Phase>('a');
  const [aDone, setADone] = useState(completed);
  const [bDone, setBDone] = useState(completed);
  const [cDone, setCDone] = useState(completed);
  const [dDone, setDDone] = useState(completed);
  const [fired, setFired] = useState(completed);

  /* Phase A */
  const [found, setFound] = useState<Set<string>>(new Set());
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [missNote, setMissNote] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const missTaps = useRef(0);

  /* Phase B */
  const [assigns, setAssigns] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const wrongAssignTotal = useRef(0);

  /* Phase C */
  const [cSel, setCSel] = useState<CSel>(null);
  const [replaced, setReplaced] = useState(false);
  const wrongJacks = useRef(0);
  /** Bumped on every wrong jack so tapping the SAME wrong jack twice re-pulses. */
  const [wrongGen, setWrongGen] = useState(0);

  /* Phase D */
  const [dPick, setDPick] = useState<number | null>(null);
  const wrongPicks = useRef(0);

  /* ── motion state ──────────────────────────────────────────────────────
   * `intro` drives the Phase-A entrance (assemble → the mess draws itself in)
   * and is dropped once it has landed, so switching phases later never
   * replays it. `hotspots` holds the undocumented-defect breathing back until
   * the mess has arrived — the learner's first read is the rack, not markers.
   * Nothing here gates interaction: every tap target is live from frame one. */
  const m = useCiMotion();
  const [intro, setIntro] = useState(true);
  const [hotspots, setHotspots] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setHotspots(true), m.d(HOTSPOT_AT));
    const b = setTimeout(() => setIntro(false), m.d(INTRO_END));
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [m]);

  const scale = width / VB_W;
  const svgH = Math.round((width * VB_H) / VB_W);

  const planAssigns = useMemo(() => {
    const m: Record<string, string> = {};
    for (const g of CI_RACK_GROUPS) m[g.id] = g.zoneId;
    return m;
  }, []);

  /* ── honest completion scoring ── */
  const computeDims = (): CiDimScores => {
    const clampTo = (v: number, lo: number) => Math.max(lo, Math.min(100, Math.round(v)));
    return {
      serviceability: clampTo(100 - wrongJacks.current * 8 - wrongPicks.current * 15, 40),
      signal: clampTo(100 - wrongAssignTotal.current * 12, 40),
      protection: clampTo((found.size / CI_RACK_ISSUES.length) * 100 - missTaps.current * 2, 45),
      workmanship: clampTo(100 - missTaps.current * 3 - wrongAssignTotal.current * 5 - wrongPicks.current * 5, 40),
    };
  };

  /* ── Phase A handlers ── */
  const findIssue = (id: string) => {
    setMissNote(false);
    setLastFound(id);
    if (found.has(id)) return;
    const issue = CI_RACK_ISSUES.find((i) => i.id === id);
    if (!issue) return;
    const nx = new Set(found);
    nx.add(id);
    setFound(nx);
    AccessibilityInfo.announceForAccessibility(`Found ${nx.size} of ${CI_RACK_ISSUES.length}: ${issue.label}.`);
    if (nx.size >= REQUIRED_FINDS && !aDone) {
      setADone(true);
      announceComplete('Phase A complete — the rack is condemned. Dressing unlocked.');
    }
  };
  const onMissTap = () => {
    missTaps.current += 1;
    setLastFound(null);
    setMissNote(true);
  };

  /* ── Phase B handlers ── */
  const assignZone = (zoneId: string) => {
    if (!activeGroup) return;
    const gDef = CI_RACK_GROUPS.find((g) => g.id === activeGroup);
    if (!gDef) return;
    if (zoneId !== gDef.zoneId) wrongAssignTotal.current += 1;
    const nx = { ...assigns, [activeGroup]: zoneId };
    setAssigns(nx);
    setActiveGroup(null);
    if (CI_RACK_GROUPS.every((g) => nx[g.id])) {
      const wrong = CI_RACK_GROUPS.filter((g) => nx[g.id] !== g.zoneId);
      if (wrong.length === 0) {
        if (!bDone) {
          setBDone(true);
          announceComplete('Phase B complete — the rack is dressed to the plan.');
        } else {
          AccessibilityInfo.announceForAccessibility('Plan satisfied.');
        }
      } else {
        AccessibilityInfo.announceForAccessibility(
          `${wrong.length} ${wrong.length === 1 ? 'group is' : 'groups are'} off the plan — reassign until it matches.`,
        );
      }
    }
  };
  const allAssigned = CI_RACK_GROUPS.every((g) => assigns[g.id]);
  const wrongB = allAssigned ? CI_RACK_GROUPS.filter((g) => assigns[g.id] !== g.zoneId).map((g) => g.id) : null;

  /** The moment the plan is revealed, the looms that match it run a few
   *  marching cycles — signal just came alive — then go quiet again. Gated on
   *  the reveal so it can never leak which single assignment was correct. */
  const [flowOn, setFlowOn] = useState(false);
  useEffect(() => {
    if (!allAssigned || !m.loops) {
      setFlowOn(false);
      return;
    }
    setFlowOn(true);
    const id = setTimeout(() => setFlowOn(false), FLOW_MS);
    return () => clearTimeout(id);
  }, [allAssigned, assigns, m.loops]);

  const wrongZoneNote = (gId: string): string => {
    const g = CI_RACK_GROUPS.find((x) => x.id === gId);
    if (!g) return '';
    const z = assigns[g.id];
    if (z === 'z-entry') return `${g.name}: every loom passes the entry — its dressing home is a vertical manager.`;
    if (z === 'z-hmgr') return `${g.name}: the horizontal manager organizes the patch-field row, not trunk groups.`;
    return `${g.name}: this project’s plan dresses it down the ${g.zoneId === 'z-left' ? 'LEFT (signal-class)' : 'RIGHT (power / high-current)'} manager.`;
  };

  /* ── Phase C handlers ── */
  const pickJack = (n: number) => {
    if (replaced) return;
    if (n === 7) {
      setCSel({ jack: 7, ok: true });
      AccessibilityInfo.announceForAccessibility('Input 7 selected. One cable highlights end to end: label A-07 at the patch field, down the left manager, to label A-07 at DSP input 7. Everything else dims.');
    } else {
      wrongJacks.current += 1;
      setWrongGen((g) => g + 1);
      setCSel({ jack: n, ok: false });
    }
  };
  const confirmReplace = () => {
    if (replaced) return;
    setReplaced(true);
    if (!cDone) {
      setCDone(true);
      announceComplete('Phase C complete — a thirty-second swap with zero collateral.');
    }
  };

  /* ── Phase D handlers ── */
  const dSolved = dPick != null && D_OPTIONS[dPick].ok;
  const pickApproach = (i: number) => {
    if (dSolved) return;
    setDPick(i);
    if (!D_OPTIONS[i].ok) {
      wrongPicks.current += 1;
      return;
    }
    if (!dDone) {
      setDDone(true);
      announceComplete('Stage 6 complete.');
      if (!fired) {
        setFired(true);
        onComplete(computeDims());
      }
    }
  };

  const phaseDone: Record<Phase, boolean> = { a: aDone, b: bDone, c: cDone, d: dDone };
  const phaseOpen: Record<Phase, boolean> = { a: true, b: aDone, c: bDone, d: cDone };

  const lastIssue = lastFound ? (CI_RACK_ISSUES.find((i) => i.id === lastFound) ?? null) : null;
  const lastMistake = lastIssue ? (mistakeById(lastIssue.mistakeId) ?? null) : null;
  const activeGroupDef = activeGroup ? (CI_RACK_GROUPS.find((g) => g.id === activeGroup) ?? null) : null;
  const beforeW = Math.max(96, Math.min(130, Math.round(width * 0.34)));

  return (
    <View style={{ gap: 14 }}>
      {/* ── phase chips ── */}
      <View style={styles.phaseRow}>
        {PHASES.map((p) => (
          <PhaseChip
            key={p.id}
            tag={p.tag}
            name={p.name}
            active={phase === p.id}
            done={phaseDone[p.id]}
            open={phaseOpen[p.id]}
            onPress={() => setPhase(p.id)}
          />
        ))}
      </View>
      <Text style={styles.tintNote}>
        {'Training visualization — the cable-class colors are a teaching language only; field cable colors vary.'}
      </Text>

      {/* ═══════════ PHASE A — inspect the bad rack ═══════════ */}
      {phase === 'a' ? (
        <CiSection title="PHASE A — INSPECT: CONDEMN THIS RACK">
          <Text style={styles.lead}>
            {'A contractor calls this rack "finished." Rear view. Document at least '}
            {REQUIRED_FINDS}
            {' problems before you sign anything — tap what’s wrong, or open the suspect list and inspect location by location.'}
          </Text>
          <View style={{ width, height: svgH }}>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel="Rear view of a badly dressed equipment rack: patch field, horizontal manager, network switch, DSP, audio interface, amplifier, power distribution, and vertical cable managers on both sides. Cabling is tangled, taut, unlabeled and blocking vents."
            >
              <RackSvg
                w={width}
                mode="bad"
                enter={intro}
                found={found}
                lastFound={lastFound}
                /* every remaining loop stops the moment the inspection is
                   satisfied — an ambient loop with nothing left to say is
                   exactly the tell we are removing from this scene */
                pulse={hotspots && found.size < REQUIRED_FINDS}
              />
            </View>
            <Pressable
              accessible={false}
              importantForAccessibility="no"
              onPress={onMissTap}
              style={{ position: 'absolute', left: 0, top: 0, width, height: svgH }}
            />
            {CI_RACK_ISSUES.map((iss) => {
              const hit = HIT[iss.id];
              const rw = Math.max(44, hit.w * scale);
              const rh = Math.max(44, hit.h * scale);
              const left = (hit.x + hit.w / 2) * scale - rw / 2;
              const top = (hit.y + hit.h / 2) * scale - rh / 2;
              const isFound = found.has(iss.id);
              return (
                <Pressable
                  key={iss.id}
                  onPress={() => findIssue(iss.id)}
                  style={{ position: 'absolute', left, top, width: rw, height: rh }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: lastFound === iss.id }}
                  accessibilityLabel={`${hit.where}${isFound ? `. Flagged: ${iss.label}` : ''}`}
                />
              );
            })}
          </View>
          <FoundCounter found={found.size} required={REQUIRED_FINDS} total={CI_RACK_ISSUES.length} />
          <OptionChip
            label={listOpen ? '▾ SUSPECT LIST' : '▸ SUSPECT LIST'}
            active={listOpen}
            onPress={() => setListOpen((o) => !o)}
            action
          />
          {listOpen ? (
            <View style={{ gap: 6 }}>
              {CI_RACK_ISSUES.map((iss, si) => {
                const isFound = found.has(iss.id);
                return (
                  <Stagger key={iss.id} index={si}>
                    <Pressable
                      style={[styles.suspectBtn, isFound && styles.suspectBtnFound]}
                      onPress={() => findIssue(iss.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${HIT[iss.id].where}${isFound ? `. Flagged: ${iss.label}` : ', not inspected yet'}`}
                    >
                      <Text style={[styles.suspectWhere, isFound && { color: colors.green }]}>
                        {isFound ? '✓  ' : '·  '}
                        {HIT[iss.id].where}
                      </Text>
                      {isFound ? <Text style={styles.suspectWhat}>{iss.label}</Text> : null}
                    </Pressable>
                  </Stagger>
                );
              })}
            </View>
          ) : null}
          {missNote ? (
            <Appear>
              <Text style={styles.missNote}>
                {'Nothing documented right there — inspect where cable meets gear: jacks, rails, vents, entries and label points.'}
              </Text>
            </Appear>
          ) : null}
          {lastIssue && lastMistake ? (
            <Appear key={lastIssue.id} style={{ gap: 6 }}>
              <Text style={styles.foundLabel}>⚑ {lastIssue.label}</Text>
              <RuleFeedback ruleId={lastMistake.ruleId} verdict="bad" short={lastMistake.shortFeedback} openSources={openSources} />
              <Text style={styles.fixLine}>FIX  {lastMistake.correction}</Text>
            </Appear>
          ) : null}
          {aDone ? (
            <Appear delay={CI_MOTION.quick}>
              <Pressable
                style={styles.phaseNextBtn}
                onPress={() => setPhase('b')}
                accessibilityRole="button"
                accessibilityLabel="Continue to phase B, dress the rack"
              >
                <Text style={styles.phaseNextText}>RACK CONDEMNED — NOW DRESS IT RIGHT ›</Text>
              </Pressable>
            </Appear>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE B — dress the rack ═══════════ */}
      {phase === 'b' ? (
        <CiSection title="PHASE B — DRESS: ROUTE EVERY GROUP TO THE PLAN">
          <SpecCard text={CI_RACK_PLAN_NOTE} />
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Rear view of the emptied rack. ${
              Object.keys(assigns).length === 0
                ? 'No cable groups dressed yet.'
                : CI_RACK_GROUPS.filter((g) => assigns[g.id])
                    .map((g) => `${g.name} dressed to ${zoneById(assigns[g.id])?.name ?? assigns[g.id]}`)
                    .join('; ') + '.'
            }`}
          >
            <RackSvg w={width} mode="dress" install assigns={assigns} wrongIds={wrongB} flowOn={flowOn} />
          </View>
          <Text style={styles.lead}>
            {'Six cable groups arrive at the top entry. Pick a group, then pick where it dresses. Looms draw as you assign — reassign freely until the plan is satisfied.'}
          </Text>
          <View style={styles.chipWrap}>
            {CI_RACK_GROUPS.map((g, gi) => {
              const tint = CI_CLASS_TINTS[g.tintKey];
              const zone = assigns[g.id];
              const active = activeGroup === g.id;
              const verdict = wrongB == null ? null : wrongB.includes(g.id) ? 'bad' : 'good';
              return (
                <Stagger key={g.id} index={gi} from={6}>
                  <Pressable
                    style={[styles.groupChip, active && styles.groupChipActive]}
                    onPress={() => setActiveGroup(active ? null : g.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${g.name}${zone ? `, dressed to ${zoneById(zone)?.name ?? zone}` : ', not yet assigned'}${
                      verdict ? (verdict === 'good' ? ', matches the plan' : ', off the plan') : ''
                    }`}
                  >
                    <View style={[styles.groupDot, { backgroundColor: tint }]} />
                    <Text style={styles.groupName}>{g.name.toUpperCase()}</Text>
                    <Text
                      style={[
                        styles.groupZone,
                        verdict === 'bad' && { color: '#ff9b8f' },
                        verdict === 'good' && { color: colors.green },
                      ]}
                    >
                      {verdict === 'good' ? '✓ ' : verdict === 'bad' ? '✕ ' : ''}
                      {zone ? ZONE_SHORT[zone] : '—'}
                    </Text>
                  </Pressable>
                </Stagger>
              );
            })}
          </View>
          {activeGroupDef ? (
            <Appear key={activeGroupDef.id} style={styles.zoneCard}>
              <Text style={styles.zoneHead}>DRESS {activeGroupDef.name.toUpperCase()} INTO…</Text>
              {CI_RACK_ZONES.map((z, zi) => (
                <Stagger key={z.id} index={zi} from={6}>
                  <Pressable
                    style={styles.zoneBtn}
                    onPress={() => assignZone(z.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${z.name}. ${z.note}`}
                  >
                    <Text style={styles.zoneBtnName}>{z.name.toUpperCase()}</Text>
                    <Text style={styles.zoneBtnNote}>{z.note}</Text>
                  </Pressable>
                </Stagger>
              ))}
            </Appear>
          ) : null}
          {wrongB != null ? (
            wrongB.length === 0 ? (
              <Appear delay={CI_MOTION.quick}>
                <RuleFeedback
                  ruleId="rack-power-signal-plan"
                  verdict="good"
                  short="Plan satisfied — every class has a deliberate, separated route down a manager. This rack can be serviced."
                  openSources={openSources}
                />
              </Appear>
            ) : (
              <Appear style={{ gap: 8 }}>
                {wrongB.map((id) => (
                  <Text key={id} style={styles.wrongNote}>
                    ✕ {wrongZoneNote(id)}
                  </Text>
                ))}
                <RuleFeedback
                  ruleId="rack-power-signal-plan"
                  verdict="bad"
                  short={`${wrongB.length} group${wrongB.length === 1 ? '' : 's'} off the plan — tap the flagged group and reassign it.`}
                  openSources={openSources}
                />
              </Appear>
            )
          ) : null}
          {bDone ? (
            <Appear delay={CI_MOTION.base}>
              <Pressable
                style={styles.phaseNextBtn}
                onPress={() => setPhase('c')}
                accessibilityRole="button"
                accessibilityLabel="Continue to phase C, the serviceability test"
              >
                <Text style={styles.phaseNextText}>DRESSED TO PLAN — RUN THE SERVICE CALL ›</Text>
              </Pressable>
            </Appear>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE C — serviceability test ═══════════ */}
      {phase === 'c' ? (
        <CiSection title="PHASE C — SERVICE: THE 30-SECOND SWAP">
          <SpecCard text="WORK ORDER — DSP INPUT 7 reads dead at the console. Identify that one cable end-to-end and replace it. Nothing else may be disturbed: the system is live." />
          <View style={{ width, height: svgH }}>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={
                cSel?.ok
                  ? 'Dressed rack in trace mode: one cable highlighted from patch label A-07 down the left manager to DSP input 7; every other loom dimmed.'
                  : 'Rear view of the dressed rack. The DSP row has eight numbered inputs.'
              }
            >
              <RackSvg w={width} mode="dress" assigns={planAssigns} cSel={cSel} wrongGen={wrongGen} />
            </View>
            {DSP_JACK_XS.map((cx, i) => (
              <Pressable
                key={cx}
                accessible={false}
                importantForAccessibility="no"
                onPress={() => pickJack(i + 1)}
                hitSlop={3}
                style={{ position: 'absolute', left: (cx - 14) * scale, top: 146 * scale, width: 28 * scale, height: 34 * scale }}
              />
            ))}
          </View>
          <Text style={styles.lead}>{'Tap DSP INPUT 7 on the rack — or use the input list.'}</Text>
          <View style={styles.jackRow}>
            {DSP_JACK_XS.map((_, i) => {
              const n = i + 1;
              const sel = cSel?.jack === n;
              return (
                <Stagger key={n} index={i} from={6}>
                  <Pressable
                    style={[styles.jackBtn, sel && (cSel?.ok ? styles.jackBtnRight : styles.jackBtnWrong)]}
                    onPress={() => pickJack(n)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`DSP input ${n}`}
                  >
                    <Text style={[styles.jackBtnText, sel && { color: colors.textPrimary }]}>{n}</Text>
                  </Pressable>
                </Stagger>
              );
            })}
          </View>
          {cSel && !cSel.ok ? (
            <Appear key={`wrong-${wrongGen}`}>
              <VerdictBanner
                verdict="wrong"
                text={`That’s INPUT ${cSel.jack} — it works. The work order says INPUT 7; the numbering just stopped you from pulling a live line.`}
              />
            </Appear>
          ) : null}
          {cSel?.ok ? (
            <View style={{ gap: 8 }}>
              {/* the card lands WITH the beam, not before it — and not so late
                  that the learner is left waiting on an animation to finish */}
              <Appear delay={TRACE_DELAY + TRACE_DUR * 0.45}>
                <View style={styles.traceCard}>
                  <Text style={styles.traceHead}>TRACED — ONE CABLE, END TO END</Text>
                  <Text style={styles.traceBody}>
                    {'Label A-07 at the patch field → left manager lane → label A-07 at DSP INPUT 7. Everything else stays exactly where the plan put it.'}
                  </Text>
                </View>
              </Appear>
              {!replaced ? (
                <Appear delay={TRACE_DELAY + TRACE_DUR * 0.62}>
                  <Pressable
                    style={styles.phaseNextBtn}
                    onPress={confirmReplace}
                    accessibilityRole="button"
                    accessibilityLabel="Replace this cable"
                  >
                    <Text style={styles.phaseNextText}>REPLACE THIS CABLE ✓</Text>
                  </Pressable>
                </Appear>
              ) : (
                <View style={{ gap: 10 }}>
                  <Appear>
                    <VerdictBanner
                      verdict="correct"
                      text="Cable identified, slack taken from the manager, replaced, records updated. Elapsed: about thirty seconds — with the rest of the system live."
                    />
                  </Appear>
                  <Appear delay={CI_MOTION.quick}>
                    <RuleFeedback
                      ruleId="label-both-ends"
                      verdict="good"
                      short="Labels at both ends plus a planned path made the trace instant — identification is what the dressing bought you."
                      openSources={openSources}
                    />
                  </Appear>
                  {/* the BEFORE rack cross-fades in underneath as the contrast
                      lands; it renders STATIC — no second animating rack */}
                  <Appear delay={CI_MOTION.base} style={styles.beforeRow}>
                    <RackSvg w={beforeW} mode="bad" />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.beforeHead}>THE SAME JOB, BEFORE</Text>
                      <Text style={styles.beforeBody}>
                        {'Unlabeled identical cables, classes interleaved, zero slack: you’d be tugging lines and guessing — on a live system. The dressing IS what made this thirty seconds.'}
                      </Text>
                    </View>
                  </Appear>
                  {cDone ? (
                    <Appear delay={CI_MOTION.reveal}>
                      <Pressable
                        style={styles.phaseNextBtn}
                        onPress={() => setPhase('d')}
                        accessibilityRole="button"
                        accessibilityLabel="Continue to phase D, the maintenance test"
                      >
                        <Text style={styles.phaseNextText}>ONE MORE TEST — SWAP THE SWITCH ›</Text>
                      </Pressable>
                    </Appear>
                  ) : null}
                </View>
              )}
            </View>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE D — maintenance test ═══════════ */}
      {phase === 'd' ? (
        <CiSection title="PHASE D — MAINTAIN: SWAP THE SWITCH">
          <SpecCard text="WORK ORDER — the network switch is being replaced with an identical unit tonight. Unrelated equipment must stay connected and running throughout." />
          <Text style={styles.lead}>{'Four crews, four approaches. Approve the one that respects the installation.'}</Text>
          <View style={{ gap: 10 }}>
            {D_OPTIONS.map((o, i) => (
              <Stagger key={o.title} index={i}>
                <ApproachCard
                  title={o.title}
                  body={o.body}
                  picked={dPick === i}
                  ok={o.ok}
                  disabled={dSolved}
                  onPress={() => pickApproach(i)}
                />
              </Stagger>
            ))}
          </View>
          {dPick != null ? (
            <Appear key={`d-${dPick}`} style={{ gap: 8 }}>
              <VerdictBanner verdict={D_OPTIONS[dPick].ok ? 'correct' : 'wrong'} text={D_OPTIONS[dPick].verdict} />
              {D_OPTIONS[dPick].ok ? (
                <RuleFeedback
                  ruleId="rack-service-access"
                  verdict="good"
                  short="Dress for the service call: labels identify, managers hold, intentional slack moves — one device out, nothing else touched."
                  openSources={openSources}
                />
              ) : null}
            </Appear>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ close: principles + completion ═══════════ */}
      {dDone ? (
        <View style={{ gap: 10 }}>
          <Appear>
            <View style={styles.doneBanner}>
              <Text style={styles.doneText}>✓ STAGE COMPLETE — CONDEMNED IT, DRESSED IT, PROVED IT.</Text>
            </View>
          </Appear>
          <Appear delay={CI_MOTION.quick}>
            <View style={styles.prinCard}>
              <Text style={styles.prinHead}>WHAT A DRESSED RACK HOLDS TRUE</Text>
              {PRINCIPLES.map((p, pi) => {
                const rule = p.ruleId ? ruleFor(p.ruleId) : null;
                return (
                  <Stagger key={p.text} index={pi} from={6}>
                    <View style={styles.prinRow}>
                      <Text style={styles.prinBullet}>▪</Text>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.prinText}>{p.text}</Text>
                        {rule ? (
                          <AuthorityBadge
                            authority={rule.authorityClass}
                            jurisdiction={rule.jurisdiction}
                            onPress={() => openSources(rule.sourceRefs)}
                          />
                        ) : null}
                      </View>
                    </View>
                  </Stagger>
                );
              })}
            </View>
          </Appear>
        </View>
      ) : null}
    </View>
  );
}

/* ═══════════════════════════════ styles ═══════════════════════════════════ */

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15.5, color: colors.textSub, fontStyle: 'italic' },
  phaseRow: { flexDirection: 'row', gap: 6 },
  phaseChip: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  phaseChipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#17140c' },
  phaseChipDone: { borderColor: 'rgba(55,224,95,.4)' },
  phaseChipLocked: { opacity: 0.45 },
  /** the animated half of the active state — fades rather than snapping */
  phaseChipWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 9,
    backgroundColor: 'rgba(255,198,77,.10)',
  },
  phaseChipInner: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  phaseChipTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: colors.textSecondary },
  phaseChipName: { fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },
  missNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, fontStyle: 'italic' },
  foundLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.6, color: colors.amberLabel },
  fixLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5, color: colors.green },
  suspectBtn: {
    minHeight: 44,
    justifyContent: 'center',
    gap: 2,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  suspectBtnFound: { borderColor: 'rgba(55,224,95,.35)' },
  suspectWhere: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6, color: colors.textSecondary },
  suspectWhat: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  phaseNextBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0c1a10',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  phaseNextText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.green },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  groupChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  groupChipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#17140c' },
  groupDot: { width: 9, height: 9, borderRadius: 4.5 },
  groupName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary },
  groupZone: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSub },
  zoneCard: {
    gap: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#131316',
    padding: 11,
  },
  zoneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.3, color: colors.amber },
  zoneBtn: {
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  zoneBtnName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.9, color: colors.textPrimary },
  zoneBtnNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  wrongNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5, color: '#ff9b8f' },
  jackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  jackBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
  },
  jackBtnRight: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0d1a11' },
  jackBtnWrong: { borderColor: 'rgba(255,90,72,.7)', backgroundColor: '#1a0f0d' },
  jackBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSecondary },
  traceCard: {
    gap: 4,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: CI_CLASS_TINTS.analog,
    backgroundColor: '#0f1416',
    padding: 11,
  },
  traceHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: CI_CLASS_TINTS.analog },
  traceBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  beforeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101014',
    padding: 10,
  },
  beforeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amberLabel },
  beforeBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary },
  optCard: {
    gap: 5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  optCardRight: { borderColor: 'rgba(55,224,95,.55)' },
  optCardWrong: { borderColor: 'rgba(255,90,72,.55)' },
  optTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  optBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  doneBanner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0c1a10',
    padding: 11,
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.green },
  prinCard: {
    gap: 10,
    borderRadius: 11,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: '#151310',
    padding: 12,
  },
  prinHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5, color: colors.amber },
  prinRow: { flexDirection: 'row', gap: 8 },
  prinBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel, lineHeight: 18 },
  prinText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
});
