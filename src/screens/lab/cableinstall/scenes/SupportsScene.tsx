/**
 * STAGE 5 — Cable Supports & Pathways (spec §"supports" · registry m_supports).
 *
 * Three parts:
 *   A · ROLES — SUPPORT / PATHWAY / PROTECTION / MANAGEMENT as four cards
 *       (rule 'sup-roles'): one component can do several jobs, but hardware is
 *       chosen by the job it must do.
 *   B · THE SORT — CI_SUPPORT_ITEMS one at a time (shuffled once per mount by
 *       a deterministic index-scramble — no Math.random), each drawn as an
 *       honest SVG pictogram with APPROVE / REJECT ("Would you hang cable on
 *       this?"). Immediate RuleFeedback from the item's rule; role chips shown
 *       for approved hardware; running score line. Pass at ≥ 80% correct.
 *   C · SPACING RITUAL — CI_SUPPORT_SPACING_SPEC SpecCard first (check the
 *       documentation), then a 12-unit span with 5 candidate positions (tap to
 *       place/remove; each position is an accessible toggle button). The given
 *       spec = supports every 4 grid units → correct = positions at 4 and 8.
 *       Sag draws live between anchors; spans past the limit draw strained.
 *       CHECK → RuleFeedback('sup-spacing-mfr').
 *
 * ── MOTION (owner 2026-08-24: the lab shipped static) ─────────────────────
 *   ROLES    the four cards deal in on a stagger.
 *   SORT     one card at a time, dealt: the outgoing item fades out (140ms)
 *            BEFORE the next arrives — sequencing, never a jump-cut — and the
 *            incoming pictogram rises in behind the card. The verdict Appears.
 *   SPACING  the money moment. The run is ONE cable sampled across the whole
 *            span, and every toggle springs it from its current shape to the
 *            new one: long spans drop deep, supported spans lift and — once
 *            the spacing finally meets the supplied spec — the whole run
 *            settles level on a bouncier spring. Strained spans carry a hot
 *            overlay glued to the same sampled cable, so it rides the settle
 *            and fades off it when the span is fixed. Placing a support draws
 *            the J-hook in over its dashed ghost; the MAX SAG guide brightens
 *            while the learner is working, then rests.
 *
 *   ONLY primitive SVG props are animated (d, opacity, strokeWidth, dashoffset,
 *   cx/cy/r) — no transform/x/y anywhere (motion.tsx's hard-won rule). Every
 *   animated element carries its rest pose statically, and `useCiMotion()`
 *   collapses everything to identical end states under reduced motion.
 *
 * Completion (once): sort ≥ 80% + spacing exercise passed →
 * onComplete({ routing, protection }).
 *
 * Accessibility: every interaction is a labeled button (no drag anywhere);
 * verdicts announced; state never color-only; targets ≥44dp.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { CI_SUPPORT_ITEMS, CI_SUPPORT_SPACING_SPEC } from '../data/scenarios';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { CI_SUPPORT_ART, CI_SUPPORT_ART_ASPECT } from '../data/supportArt';
import { LabPhoto } from '../../kit/LabPhoto';
import { ICON_ASPECT, SupportIcon } from './supportIcons';
import { ConcreteCut, shade, tint as lighten } from '../svgArt';
import type { SharedValue } from 'react-native-reanimated';
import { clamp100 } from '../engine/score';
import {
  ACircle,
  ALine,
  APath,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  usePulse,
  useSharedValue,
  useTween,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

const say = (s: string) => AccessibilityInfo.announceForAccessibility(s);

/* ── deterministic shuffle (stable per mount; no Math.random anywhere) ──── */
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

function scrambleOrder(n: number, salt: number): number[] {
  const step = [7, 11, 13, 5, 3, 2, 1].find((s) => gcd(s, n) === 1) ?? 1;
  const offset = (((salt * 5 + 3) % n) + n) % n;
  return Array.from({ length: n }, (_, i) => (offset + i * step) % n);
}

/* ── the sort + role illustrations live in supportIcons.tsx (real objects,
 *    neutral tones — never verdict-tinted) ─────────────────────────────── */
const IC = '#a7adb5'; // hardware stroke (J-hook in the span)

/* ── A · role cards ─────────────────────────────────────────────────────── */
const ROLE_CARDS: { key: string; title: string; body: string; icon: string; tint: string }[] = [
  { key: 'support', title: 'SUPPORT', body: 'Carries the cable’s weight — anchored to structure, rated for the load.', icon: 'jhook', tint: colors.amber },
  { key: 'pathway', title: 'PATHWAY', body: 'Defines the route the cable follows through the building.', icon: 'tray', tint: '#4fd0e0' },
  { key: 'protection', title: 'PROTECTION', body: 'Blocks physical damage — edges, crush, traffic.', icon: 'conduit', tint: colors.green },
  { key: 'management', title: 'MANAGEMENT', body: 'Organizes for service — trace it, swap it, no surgery.', icon: 'vmgr', tint: colors.purple },
];

const ROLE_TINTS: Record<string, string> = {
  support: colors.amber,
  pathway: '#4fd0e0',
  protection: colors.green,
  management: colors.purple,
};

/* ── C · the spacing exercise geometry ──────────────────────────────────── */
const POS_UNITS = [2, 4, 6, 8, 10] as const;
const CORRECT_POS = [1, 3] as const; // indices into POS_UNITS → units 4 and 8
const SPAN_UNITS = 12;
const SPEC_EVERY = 4; // grid units, from CI_SUPPORT_SPACING_SPEC
const SAG_LIMIT_UNITS = 0.5;

const X0 = 12;
const UNIT = 28;
const X1 = X0 + SPAN_UNITS * UNIT;
const CABLE_Y = 40;
const xOf = (u: number) => X0 + u * UNIT;

/** The run is sampled as ONE cable so that adding/removing a support morphs a
 *  single path instead of swapping a variable-length list of segments. */
const SAMPLES = 49;
const SAMPLE_U = SPAN_UNITS / (SAMPLES - 1); // 0.25 grid units per sample
const SAMPLE_X = Array.from({ length: SAMPLES }, (_, s) => X0 + s * SAMPLE_U * UNIT);
/** Once every span is inside the spec the whole run settles level — bouncier. */
const LEVEL_SPRING = { damping: 12, stiffness: 150, mass: 1 } as const;
const HOOK_LEN = 34; // approximate J-hook path length, for the draw-in

function anchorsFor(placed: Set<number>): number[] {
  const units = [...placed].sort((a, b) => a - b).map((i) => POS_UNITS[i] as number);
  return [0, ...units, SPAN_UNITS];
}

/** Sag depth per span is quadratic in span length — the same curve the scene
 *  drew statically before, now sampled so it can be interpolated. */
function sagProfile(anchors: number[]): number[] {
  const ys: number[] = [];
  for (let s = 0; s < SAMPLES; s++) {
    const u = s * SAMPLE_U;
    let a = anchors[0];
    let b = anchors[anchors.length - 1];
    for (let i = 1; i < anchors.length; i++) {
      if (u <= anchors[i] + 1e-9) {
        a = anchors[i - 1];
        b = anchors[i];
        break;
      }
    }
    const span = b - a;
    const depthPx = span > 0 ? Math.min(27, SAG_LIMIT_UNITS * Math.pow(span / SPEC_EVERY, 2) * UNIT) : 0;
    const f = span > 0 ? (u - a) / span : 0;
    ys.push(CABLE_Y + depthPx * 4 * f * (1 - f));
  }
  return ys;
}

/** Sample-index ranges of the spans that exceed the documented maximum. */
function hotRangesFor(anchors: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (b - a > SPEC_EVERY + 1e-6) out.push([Math.round(a / SAMPLE_U), Math.round(b / SAMPLE_U)]);
  }
  return out;
}

function polyline(ys: number[]): string {
  let d = '';
  for (let i = 0; i < SAMPLES; i++) d += `${i === 0 ? 'M' : 'L'}${SAMPLE_X[i].toFixed(1)} ${ys[i].toFixed(1)} `;
  return d;
}

function hotPolyline(ys: number[], ranges: [number, number][]): string {
  let d = '';
  for (let r = 0; r < ranges.length; r++) {
    const a = ranges[r][0];
    const b = ranges[r][1];
    for (let i = a; i <= b; i++) d += `${i === a ? 'M' : 'L'}${SAMPLE_X[i].toFixed(1)} ${ys[i].toFixed(1)} `;
  }
  return d;
}

/** One stroke of the J-hook, drawn in with the placement. */
function HookStroke({ d, p, color, width, opacity = 1, on }: { d: string; p: SharedValue<number>; color: string; width: number; opacity?: number; on: boolean }) {
  const ap = useAnimatedProps(() => ({
    strokeDashoffset: HOOK_LEN * (1 - p.value),
    opacity: opacity * Math.min(1, p.value * 1.5),
  }));
  return (
    <APath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={HOOK_LEN}
      strokeDashoffset={on ? 0 : HOOK_LEN}
      opacity={on ? opacity : 0}
      animatedProps={ap}
    />
  );
}

/** A candidate position: a J-hook (drop rod from the slab + formed J saddle)
 *  draws itself in over the dashed ghost. */
function PosMark({ u, on }: { u: number; on: boolean }) {
  const p = useTween(on ? 1 : 0, on ? CI_MOTION.base : CI_MOTION.quick);
  const x = xOf(u);
  const ghost = useAnimatedProps(() => ({
    opacity: Math.max(0, 1 - p.value * 1.4),
    r: 7 - 1.6 * Math.min(1, p.value),
  }));
  const d = `M${x - 5.2} 22 V37.4 A5.2 5.2 0 0 0 ${x + 5.2} 37.4 V34`;
  return (
    <>
      <ACircle
        cx={x}
        cy={38}
        r={on ? 5.4 : 7}
        fill="none"
        stroke="#54565c"
        strokeWidth={1}
        strokeDasharray="2.4 2.4"
        opacity={on ? 0 : 1}
        animatedProps={ghost}
      />
      {/* the anchor at the soffit, then the formed J */}
      <HookStroke d={`M${x - 8.2} 22.8 H${x - 2.2}`} p={p} color="#80868f" width={1.8} on={on} />
      <HookStroke d={d} p={p} color="#23262b" width={2.6} on={on} />
      <HookStroke d={d} p={p} color="#b9bec5" width={1.7} on={on} />
      <HookStroke d={`M${x - 5.8} 23 V37`} p={p} color="#ffffff" width={0.45} opacity={0.6} on={on} />
    </>
  );
}

/** One tonal layer of the sampled run (shadow / edge / body / sheen), riding
 *  the same spring as every other layer. */
function SpanLayer({
  from,
  to,
  k,
  dx,
  dy,
  color,
  width,
  opacity = 1,
}: {
  from: number[];
  to: number[];
  k: SharedValue<number>;
  dx: number;
  dy: number;
  color: string;
  width: number;
  opacity?: number;
}) {
  const ap = useAnimatedProps(() => {
    const kv = k.value;
    let d = '';
    for (let i = 0; i < SAMPLES; i++) {
      const y = from[i] + (to[i] - from[i]) * kv + dy;
      d += `${i === 0 ? 'M' : 'L'}${(SAMPLE_X[i] + dx).toFixed(1)} ${y.toFixed(1)} `;
    }
    return { d };
  });
  let rest = '';
  for (let i = 0; i < SAMPLES; i++) rest += `${i === 0 ? 'M' : 'L'}${(SAMPLE_X[i] + dx).toFixed(1)} ${(to[i] + dy).toFixed(1)} `;
  return (
    <APath d={rest} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} animatedProps={ap} />
  );
}

type Morph = { from: number[]; to: number[] };

const SpanArt = memo(function SpanArt({ w, placed }: { w: number; placed: Set<number> }) {
  const m = useCiMotion();
  const h = Math.round((w * 132) / 360);

  const anchors = useMemo(() => anchorsFor(placed), [placed]);
  const target = useMemo(() => sagProfile(anchors), [anchors]);
  const hotNow = useMemo(() => hotRangesFor(anchors), [anchors]);
  const hotOn = hotNow.length > 0;

  const k = useSharedValue(1); // 0 = previous shape, 1 = current shape
  const guide = useSharedValue(0); // MAX SAG guide attention
  const [morph, setMorph] = useState<Morph>(() => ({ from: target, to: target }));
  const morphRef = useRef(morph);
  morphRef.current = morph;
  const firstRef = useRef(true);

  // Keep the last non-empty strain geometry so it can fade OUT riding the
  // cable when the learner fixes the span, instead of vanishing.
  const [hotSpec, setHotSpec] = useState<[number, number][]>(hotNow);
  useEffect(() => {
    if (hotNow.length) setHotSpec(hotNow);
  }, [hotNow]);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const prev = morphRef.current;
    const kv = Math.max(0, Math.min(1, k.value));
    const cur = prev.to.map((tv, i) => prev.from[i] + (tv - prev.from[i]) * kv);
    setMorph({ from: cur, to: target });
    cancelAnimation(k);
    cancelAnimation(guide);
    if (m.reduce) {
      k.value = 1;
      guide.value = 0;
      return;
    }
    k.value = 0;
    k.value = withSpring(1, hotOn ? CI_SPRING : LEVEL_SPRING);
    guide.value = withSequence(
      withTiming(1, { duration: 140, easing: CI_EASE.out }),
      withDelay(1000, withTiming(0, { duration: 420, easing: CI_EASE.inOut })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, hotOn, m.reduce]);

  const from = morph.from;
  const to = morph.to;

  const cableProps = useAnimatedProps(() => {
    const kv = k.value;
    let d = '';
    for (let i = 0; i < SAMPLES; i++) {
      const y = from[i] + (to[i] - from[i]) * kv;
      d += `${i === 0 ? 'M' : 'L'}${SAMPLE_X[i].toFixed(1)} ${y.toFixed(1)} `;
    }
    return { d };
  });

  const pulse = usePulse({ run: hotOn && m.loops, period: 1300 });
  const hotFade = useTween(hotOn ? 1 : 0, hotOn ? CI_MOTION.quick : CI_MOTION.base);
  const hotProps = useAnimatedProps(() => {
    const kv = k.value;
    let d = '';
    for (let r = 0; r < hotSpec.length; r++) {
      const a = hotSpec[r][0];
      const b = hotSpec[r][1];
      for (let i = a; i <= b; i++) {
        const y = from[i] + (to[i] - from[i]) * kv;
        d += `${i === a ? 'M' : 'L'}${SAMPLE_X[i].toFixed(1)} ${y.toFixed(1)} `;
      }
    }
    // base stays high so reduced motion (no pulse) still reads as strained
    return { d: d === '' ? 'M0 0' : d, opacity: hotFade.value * (0.42 + 0.22 * pulse.t.value), strokeWidth: 7 + 2.4 * pulse.t.value };
  });

  const guideProps = useAnimatedProps(() => ({
    opacity: 0.3 + 0.6 * guide.value,
    strokeWidth: 1.2 + 0.7 * guide.value,
  }));

  const placedUnits = [...placed].sort((a, b) => a - b).map((i) => POS_UNITS[i]);
  const anyStrained = hotOn;
  const restD = polyline(to);
  const restHotD = hotPolyline(to, hotSpec) || 'M0 0';

  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 132"
      accessibilityLabel={`Twelve-unit span. Supports placed at ${placedUnits.length ? placedUnits.join(' and ') + ' units' : 'no positions'}. ${anyStrained ? 'At least one span sags past the limit.' : 'All spans are inside the sag limit.'}`}
    >
      <Rect x={0} y={0} width={360} height={132} rx={10} fill="#0f1014" />
      {/* structure the supports anchor to: a concrete soffit, a wall at each
          end — the run leaves one wall and enters the other through bushed
          openings (a cable never just stops in the air) */}
      <ConcreteCut x={0} y={8} w={360} h={14} />
      <ConcreteCut x={0} y={22} w={X0 - 2} h={70} />
      <ConcreteCut x={X1 + 2} y={22} w={360 - X1 - 2} h={70} />
      <Rect x={X0 - 3.4} y={CABLE_Y - 5} width={3.4} height={10} rx={0.8} fill="#1b1c20" stroke="#6d7179" strokeWidth={0.5} />
      <Rect x={X1} y={CABLE_Y - 5} width={3.4} height={10} rx={0.8} fill="#1b1c20" stroke="#6d7179" strokeWidth={0.5} />
      {/* max-sag guide from the spec (½ unit below the cable line) — it steps
          forward while the learner is placing hardware, then rests back */}
      <ALine
        x1={X0}
        y1={CABLE_Y + SAG_LIMIT_UNITS * UNIT}
        x2={X1}
        y2={CABLE_Y + SAG_LIMIT_UNITS * UNIT}
        stroke="#37d97b"
        strokeWidth={1.2}
        strokeDasharray="5 5"
        opacity={0.3}
        animatedProps={guideProps}
      />
      {/* the guide's label sits BELOW the sag limit, tied to it by a tick:
          above the line it collided with the hooks once it grew to 11 units
          (legibility pass 2026-09-25) */}
      <Line
        x1={X1 - 2}
        y1={CABLE_Y + SAG_LIMIT_UNITS * UNIT + 2}
        x2={X1 - 2}
        y2={CABLE_Y + SAG_LIMIT_UNITS * UNIT + 14}
        stroke="#37d97b"
        strokeWidth={1}
        opacity={0.5}
      />
      <SvgText
        x={X1 - 2}
        y={CABLE_Y + SAG_LIMIT_UNITS * UNIT + 24}
        textAnchor="end"
        fontFamily={fonts.oswaldSemiBold}
        fontSize={11}
        letterSpacing={0.8}
        fill="#37d97b"
        opacity={0.85}
      >
        MAX SAG ½ UNIT
      </SvgText>
      {/* strained spans: a hot halo UNDER the cable, glued to the same samples
          so it rides the settle — the jacket stays readable on top */}
      <APath
        d={restHotD}
        stroke="#ff9b8f"
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={hotOn ? 1 : 0}
        animatedProps={hotProps}
      />
      {/* the run itself: one sampled cable that springs between shapes —
          drawn as a shaded jacket (shadow, core edge, body, sheen) */}
      <SpanLayer from={from} to={to} k={k} dx={0.5} dy={1.5} color="rgba(0,0,0,0.5)" width={3.6} />
      <SpanLayer from={from} to={to} k={k} dx={0} dy={0} color={shade(CI_CLASS_TINTS.analog, 0.66)} width={3.5} />
      <SpanLayer from={from} to={to} k={k} dx={0} dy={0} color={shade(CI_CLASS_TINTS.analog, 0.28)} width={2.7} />
      <SpanLayer from={from} to={to} k={k} dx={0} dy={-0.6} color={lighten(shade(CI_CLASS_TINTS.analog, 0.28), 0.5)} width={0.9} opacity={0.8} />
      <APath d={restD} stroke="none" fill="none" animatedProps={cableProps} />
      {/* candidate positions: placed = J-hook, empty = dashed ghost */}
      {POS_UNITS.map((u, i) => (
        <PosMark key={u} u={u} on={placed.has(i)} />
      ))}
      {/* grid ruler, marked and numbered */}
      <Line x1={X0} y1={100} x2={X1} y2={100} stroke="#2c2c33" strokeWidth={1.5} />
      {Array.from({ length: SPAN_UNITS + 1 }, (_, u) => (
        <Line key={u} x1={xOf(u)} y1={u % 2 === 0 ? 94 : 96} x2={xOf(u)} y2={104} stroke="#3a3c42" strokeWidth={u % 2 === 0 ? 1.6 : 1} />
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((u) => (
        <SvgText key={`n${u}`} x={xOf(u)} y={118} textAnchor="middle" fontFamily={fonts.mono} fontSize={11} fill="#8a8b93">
          {String(u)}
        </SvgText>
      ))}
    </Svg>
  );
});

/* ── the scene ──────────────────────────────────────────────────────────── */
export function SupportsScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const m = useCiMotion();
  const N = CI_SUPPORT_ITEMS.length;
  const passNeeded = Math.ceil(N * 0.8);
  const artW = Math.max(160, width - 26);
  const picW = Math.min(300, artW);

  // B — the sort
  const [attempt, setAttempt] = useState(0);
  const order = useMemo(() => scrambleOrder(N, attempt), [N, attempt]);
  const [idx, setIdx] = useState(completed ? N : 0);
  const [correct, setCorrect] = useState(completed ? N : 0);
  const [pick, setPick] = useState<boolean | null>(null);
  const [finishedLive, setFinishedLive] = useState(false); // banner only after a live run
  const [sortPassed, setSortPassed] = useState(completed);
  const correctAtPassRef = useRef(completed ? N : 0);

  // C — spacing
  const [placed, setPlaced] = useState<Set<number>>(() => new Set(completed ? CORRECT_POS : []));
  const [spacingVerdict, setSpacingVerdict] = useState<'good' | 'bad' | null>(completed ? 'good' : null);
  const [spacingMsg, setSpacingMsg] = useState(
    completed ? 'Supports at 4 and 8 — the documented every-4-unit design, sag inside the limit.' : '',
  );
  const [spacingPassed, setSpacingPassed] = useState(completed);
  const [checkNonce, setCheckNonce] = useState(0);
  const wrongSpacingRef = useRef(0);

  const firedRef = useRef(completed);
  const [fired, setFired] = useState(completed);

  const tryFire = (sortOk: boolean, spacingOk: boolean) => {
    if (firedRef.current) return;
    if (sortOk && spacingOk) {
      firedRef.current = true;
      setFired(true);
      announceComplete('Stage 5 complete.');
      onComplete({
        routing: clamp100(Math.round((correctAtPassRef.current / N) * 100)),
        protection: clamp100(Math.max(70, 100 - 10 * wrongSpacingRef.current)),
      });
    }
  };

  /* — sort handlers — */
  const item = idx < N ? CI_SUPPORT_ITEMS[order[idx]] : null;
  const matched = item && pick != null ? pick === item.ok : null;
  // The reveal: the real thing, shown only once the learner has answered.
  const itemArt = item ? CI_SUPPORT_ART[item.id] : undefined;

  // The deck: the outgoing card fades before the next one is dealt.
  const cardFade = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardFade.value,
    transform: [{ translateY: (1 - cardFade.value) * 8 }],
  }));
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );

  const onPick = (saidOk: boolean) => {
    if (!item || pick != null) return;
    setPick(saidOk);
    const right = saidOk === item.ok;
    if (right) setCorrect((c) => c + 1);
    say(`${right ? 'Correct.' : 'Not quite.'} ${item.ok ? 'Approved hardware.' : 'Never hang cable on this.'} ${item.why}`);
  };

  // Held in a ref so the delayed hand-off always runs the freshest closure.
  const advanceRef = useRef(() => {});
  advanceRef.current = () => {
    const nIdx = idx + 1;
    setIdx(nIdx);
    setPick(null);
    if (nIdx >= N) {
      setFinishedLive(true);
      const pass = correct >= passNeeded;
      if (pass) {
        correctAtPassRef.current = Math.max(correctAtPassRef.current, correct);
        setSortPassed(true);
        tryFire(true, spacingPassed);
      }
    }
    if (!m.reduce) {
      cardFade.value = 0;
      cardFade.value = withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out });
    } else {
      cardFade.value = 1;
    }
  };

  const onNextItem = () => {
    if (!item || pick == null) return;
    if (m.reduce) {
      advanceRef.current();
      return;
    }
    cancelAnimation(cardFade);
    cardFade.value = withTiming(0, { duration: 140, easing: CI_EASE.inOut });
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => advanceRef.current(), 140);
  };

  const onRetrySort = () => {
    setAttempt((a) => a + 1); // new deterministic order per attempt
    setIdx(0);
    setCorrect(0);
    setPick(null);
    setFinishedLive(false);
    if (!m.reduce) {
      cardFade.value = 0;
      cardFade.value = withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out });
    }
  };

  /* — spacing handlers — */
  const togglePos = (i: number) => {
    const nx = new Set(placed);
    const on = !nx.has(i);
    if (on) nx.add(i);
    else nx.delete(i);
    setPlaced(nx);
    say(`Support ${on ? 'placed' : 'removed'} at ${POS_UNITS[i]} units.`);
  };

  const checkSpacing = () => {
    setCheckNonce((n) => n + 1);
    const exact = placed.size === CORRECT_POS.length && CORRECT_POS.every((i) => placed.has(i));
    if (exact) {
      setSpacingVerdict('good');
      const msg = 'Supports at 4 and 8 — the documented every-4-unit design, sag inside the limit.';
      setSpacingMsg(msg);
      setSpacingPassed(true);
      say(`Correct. ${msg}`);
      tryFire(sortPassed, true);
      return;
    }
    wrongSpacingRef.current += 1;
    const units = [...placed].sort((a, b) => a - b).map((i) => POS_UNITS[i] as number);
    const anchors = [0, ...units, SPAN_UNITS];
    const maxGap = Math.max(...anchors.slice(1).map((b, i) => b - anchors[i]));
    const msg =
      maxGap > SPEC_EVERY
        ? `A span of ${maxGap} units exceeds the documented 4-unit maximum — check the spec card again.`
        : 'That is more hardware than the documented design calls for — install to the system’s criteria, not more, not less.';
    setSpacingVerdict('bad');
    setSpacingMsg(msg);
    say(`Not to spec. ${msg}`);
  };

  const answered = idx + (pick != null ? 1 : 0);
  const finishedPass = correct >= passNeeded;

  /* ── the controls that change the drawing — rendered on the page AND docked
     under the drawing in full screen (owner 2026-09-25: "the user must still be
     able to adjust and view their changes to controls"). State lives here; the
     elements are simply rendered twice. ──────────────────────────────────── */
  const spanDock = (
    <View style={{ gap: 8 }}>
      <View style={styles.posRow}>
        {POS_UNITS.map((u, i) => {
          const on = placed.has(i);
          return (
            <Pressable
              key={u}
              style={[styles.posBtn, on && styles.posBtnOn]}
              onPress={() => togglePos(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              // Twin of accessibilityState (RNW 0.21 drops the object). aria-pressed
              // is the valid two-state attribute on role=button; the placed/empty
              // state is also spelled out in accessibilityLabel.
              aria-pressed={on}
              accessibilityLabel={`Position ${i + 1}, at ${u} units, ${on ? 'support placed' : 'empty'}`}
            >
              <Text style={[styles.posText, on && { color: colors.amber }]}>P{i + 1}</Text>
              <Text style={[styles.posSub, on && { color: colors.amber }]}>{u}u</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[styles.checkBtn, spacingPassed && styles.checkBtnDone]}
        onPress={checkSpacing}
        accessibilityRole="button"
        accessibilityLabel={spacingPassed ? 'Spacing meets the specification. Check again' : 'Check the support spacing against the specification'}
      >
        <Text style={[styles.checkText, spacingPassed && { color: '#0a1a0f' }]}>
          {spacingPassed ? 'MEETS SPEC ✓ — CHECK AGAIN' : 'CHECK SPACING'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      {/* ── A · ROLES ───────────────────────────────────────────────────── */}
      <CiSection title="A · FOUR JOBS — CHOOSE HARDWARE BY THE JOB">
        <View style={styles.roleGrid}>
          {ROLE_CARDS.map((rc, i) => (
            <Stagger key={rc.key} index={i} style={{ width: (width - 8) / 2 }}>
              <View style={[styles.roleCard, { borderColor: rc.tint + '55' }]}>
                <SupportIcon id={rc.icon} w={72} />
                <Text style={[styles.roleTitle, { color: rc.tint }]}>{rc.title}</Text>
                <Text style={styles.roleBody}>{rc.body}</Text>
              </View>
            </Stagger>
          ))}
        </View>
        <RuleFeedback ruleId="sup-roles" verdict="info" openSources={openSources} />
      </CiSection>

      {/* ── B · THE SORT ────────────────────────────────────────────────── */}
      <CiSection title="B · THE SORT — WOULD YOU HANG CABLE ON THIS?">
        <Text style={styles.lead}>
          One piece of hardware at a time. Approve only purpose-built, rated cable hardware — "it happens to be there"
          is not a support. Pass mark: {passNeeded} of {N}.
        </Text>
        <Text style={styles.progressLine} accessibilityLiveRegion="polite">
          {sortPassed ? '✓ ' : ''}
          {correct} correct · {Math.min(answered, N)} of {N} sorted
        </Text>
        {item ? (
          <Animated.View style={[styles.card, cardStyle]}>
            <Text style={styles.cardHead}>
              ITEM {idx + 1} OF {N}
            </Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Appear key={`pic-${idx}`} delay={70}>
              <ExpandableFigure
                width={picW}
                aspect={ICON_ASPECT}
                title="ITEM"
                render={(fw) => <SupportIcon id={item.id} w={fw} />}
                controls={
                  <View style={styles.pickRow}>
                    <Pressable
                      style={[styles.pickBtn, styles.pickApprove, pick === true && styles.pickChosen]}
                      onPress={() => onPick(true)}
                      disabled={pick != null}
                      accessibilityRole="button"
                      accessibilityLabel={`Approve — yes, hang cable on ${item.name}`}
                    >
                      <Text style={[styles.pickText, { color: colors.green }]}>APPROVE</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.pickBtn, styles.pickReject, pick === false && styles.pickChosen]}
                      onPress={() => onPick(false)}
                      disabled={pick != null}
                      accessibilityRole="button"
                      accessibilityLabel={`Reject — do not hang cable on ${item.name}`}
                    >
                      <Text style={[styles.pickText, { color: '#ff9b8f' }]}>REJECT</Text>
                    </Pressable>
                  </View>
                }
              />
            </Appear>
            <Text style={styles.question}>Would you hang cable on this?</Text>
            <View style={styles.pickRow}>
              <Pressable
                style={[styles.pickBtn, styles.pickApprove, pick === true && styles.pickChosen]}
                onPress={() => onPick(true)}
                disabled={pick != null}
                accessibilityRole="button"
                accessibilityState={{ selected: pick === true, disabled: pick != null }}
                aria-pressed={pick === true}
                aria-disabled={pick != null}
                accessibilityLabel={`Approve — yes, hang cable on ${item.name}`}
              >
                <Text style={[styles.pickText, { color: colors.green }]}>APPROVE</Text>
              </Pressable>
              <Pressable
                style={[styles.pickBtn, styles.pickReject, pick === false && styles.pickChosen]}
                onPress={() => onPick(false)}
                disabled={pick != null}
                accessibilityRole="button"
                accessibilityState={{ selected: pick === false, disabled: pick != null }}
                aria-pressed={pick === false}
                aria-disabled={pick != null}
                accessibilityLabel={`Reject — do not hang cable on ${item.name}`}
              >
                <Text style={[styles.pickText, { color: '#ff9b8f' }]}>REJECT</Text>
              </Pressable>
            </View>
            {pick != null ? (
              <Appear key={`v-${idx}`}>
                <View style={{ gap: 8 }}>
                  {/* REVEAL (owner 2026-09-25): the photograph of the real
                      hardware lands with the verdict — the pictogram asked
                      the question, the photo answers "what does it actually
                      look like on site". Absent until Computer C delivers. */}
                  {itemArt ? (
                    <LabPhoto
                      source={itemArt}
                      aspect={CI_SUPPORT_ART_ASPECT}
                      label={`${item.name}, as found on site`}
                      caption={item.ok ? 'THE REAL THING — APPROVED CABLE HARDWARE' : 'THE REAL THING — NEVER A CABLE SUPPORT'}
                    />
                  ) : null}
                  <RuleFeedback
                    ruleId={item.ruleId}
                    verdict={matched ? 'good' : 'bad'}
                    short={`${matched ? 'Correct — ' : 'Not quite — '}${item.ok ? 'this IS proper cable hardware. ' : 'never hang cable on this. '}${item.why}`}
                    openSources={openSources}
                  />
                  {item.ok && item.roles ? (
                    <View style={styles.roleChipRow}>
                      <Text style={styles.roleChipLabel}>ROLES:</Text>
                      {item.roles.map((r) => (
                        <View key={r} style={[styles.roleChip, { borderColor: (ROLE_TINTS[r] ?? IC) + '77' }]}>
                          <Text style={[styles.roleChipText, { color: ROLE_TINTS[r] ?? IC }]}>{r.toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <Pressable
                    style={styles.nextBtn}
                    onPress={onNextItem}
                    accessibilityRole="button"
                    accessibilityLabel={idx + 1 >= N ? 'Finish the sort' : 'Next item'}
                  >
                    <Text style={styles.nextText}>{idx + 1 >= N ? 'FINISH SORT ›' : 'NEXT ITEM ›'}</Text>
                  </Pressable>
                </View>
              </Appear>
            ) : null}
          </Animated.View>
        ) : (
          <View style={{ gap: 10 }}>
            {finishedLive ? (
              <VerdictBanner
                verdict={finishedPass ? 'correct' : 'wrong'}
                text={`${correct} of ${N} sorted correctly (${Math.round((correct / N) * 100)}%). ${
                  finishedPass ? 'Sort passed.' : `You need ${passNeeded} of ${N} (80%) — run it again.`
                }`}
              />
            ) : (
              <Appear>
                <Text style={styles.passedLine}>✓ Sort passed — {correctAtPassRef.current} of {N} on record.</Text>
              </Appear>
            )}
            <OptionChip label={sortPassed ? 'RUN THE SORT AGAIN' : 'RETRY THE SORT'} onPress={onRetrySort} action />
          </View>
        )}
      </CiSection>

      {/* ── C · SPACING RITUAL ──────────────────────────────────────────── */}
      <CiSection title="C · SUPPORT SPACING — INSTALL TO THE GIVEN SPEC">
        <SpecCard text={CI_SUPPORT_SPACING_SPEC} />
        <Text style={styles.lead}>
          A 12-unit span, five candidate positions. Place supports to the system's documented criteria — the cable sags
          live between whatever you give it.
        </Text>
        <ExpandableFigure
          width={artW}
          aspect={360 / 132}
          title="SPAN"
          badge="Cable drawn in a training tint — field colors vary."
          render={(w) => <SpanArt w={w} placed={placed} />}
          controls={<View style={{ paddingHorizontal: 12 }}>{spanDock}</View>}
        />
        <Text style={styles.tintNote}>Cable drawn in a training tint — field colors vary.</Text>
        {spanDock}
        {spacingVerdict ? (
          <Appear key={`sp-${checkNonce}`}>
            <RuleFeedback ruleId="sup-spacing-mfr" verdict={spacingVerdict} short={spacingMsg} openSources={openSources} />
          </Appear>
        ) : null}
      </CiSection>

      <Text style={[styles.progressLine, fired && { color: colors.green }]} accessibilityLiveRegion="polite">
        {fired
          ? '✓ Stage 5 complete — keep experimenting freely.'
          : `To complete: pass the sort at ${passNeeded}/${N} · place the span's supports to its documented spec.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: { gap: 6, borderRadius: 10, borderWidth: 1, backgroundColor: '#131316', padding: 10, alignItems: 'flex-start' },
  roleTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2 },
  roleBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  progressLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  passedLine: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.green },
  card: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  cardHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amberLabel },
  itemName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.textPrimary },
  question: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  pickRow: { flexDirection: 'row', gap: 10 },
  pickBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#17171c',
  },
  pickApprove: { borderColor: 'rgba(55,224,95,.45)' },
  pickReject: { borderColor: 'rgba(255,155,143,.45)' },
  pickChosen: { backgroundColor: '#1f1f26', borderWidth: 2 },
  pickText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.5 },
  roleChipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  roleChipLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  roleChip: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#101014' },
  roleChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  nextBtn: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    paddingHorizontal: 16,
  },
  nextText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  posRow: { flexDirection: 'row', gap: 6 },
  posBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
  },
  posBtnOn: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  posText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
  posSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  checkBtn: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#2a2a31',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
  },
  checkBtnDone: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
});
