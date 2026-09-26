/**
 * STAGE 3 — Plan the Route (spec §10 + route evaluator §48) — flagship scene.
 *
 * Each CI_ROUTE_SCENARIOS installation is drawn as an honest building-section
 * SVG (stage / corridor / mechanical bay / ceiling tray / doors / rack — or
 * amp room / catwalk / duct / flown cluster) with the three candidate routes
 * as distinct colored paths labeled A/B/C. A FINISHED ⇄ X-RAY toggle reveals
 * the in-wall and above-ceiling portions (dashed while hidden, solid in
 * x-ray; the finished view shows the space without its concealed
 * infrastructure). Cables terminate for real: panel → rack, rack → cluster.
 *
 * The learner SELECTS a route from labeled cards below the drawing (the SVG
 * is never required for input). evaluateRoute/rankRoutes then reveal EVERY
 * option's verdict: six labeled dimension bars with visible numbers, each
 * flag's note, and RuleFeedback for the chosen route's governing rules — the
 * module lesson made structural: the shortest route is not always the best.
 *
 * Completion (honesty rule, §38): both scenarios decided → onComplete with
 * the average dims of the routes the learner actually CHOSE.
 *
 * MOTION (owner 2026-08-24, motion.tsx kit) — the stage exists for one moment:
 *   • the three candidates DRAW themselves onto the section on mount, so the
 *     drawing reads as three proposed pulls rather than printed decoration;
 *   • PICK is the signature move — the chosen cable INSTALLS ITSELF along its
 *     route, segment by segment, thicker and faster than the survey draw,
 *     while the routes not taken fade back;
 *   • FINISHED ⇄ X-RAY CROSS-DISSOLVES: concealed runs dissolve dashed→solid
 *     while the tray, hangers, riser, catwalk and duct fade up in a readable
 *     order — the building opens, it never cuts;
 *   • the verdict FILLS: six dimension bars grow from zero on a per-bar
 *     stagger and every number counts to its value, so the score is watched
 *     being earned;
 *   • one brief PulseRing marks where the learner's own route gets hurt, then
 *     rests to a quiet dot.
 * Every animated element carries its rest pose as a CONSTANT static prop and
 * only primitive props are animated (motion.tsx's hard-won rule).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { ClusterSection, RouteBadge, StageRackOverlay, StageRackSection } from './routeArt';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, ScoreBars, announceComplete } from '../bits';
import { OptionChip } from '../../cable/lessons/bits';
import {
  AG,
  APath,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  PulseRing,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  useCountUp,
  useDrawIn,
  useSharedValue,
  useTween,
  withDelay,
  withTiming,
} from '../motion';
import { cableTypeById } from '../data/cableTypes';
import { CI_ROUTE_SCENARIOS, type CiRouteScenario } from '../data/scenarios';
import { evaluateRoute, rankRoutes, type CiRouteOption, type CiRouteVerdict } from '../engine/routeEval';
import { mergeDims, type CiDim, type CiDimScores } from '../engine/score';
import type { CiModuleProps } from '../registry';

const ROUTE_COLORS = ['#ff8a1e', '#5bb0ff', '#c77dff'] as const;
const LETTERS = ['A', 'B', 'C'] as const;
const ROUTE_DIMS: CiDim[] = ['safety', 'protection', 'routing', 'signal', 'serviceability', 'workmanship'];
const DIM_LABELS: Record<CiDim, string> = {
  safety: 'Safety',
  protection: 'Protection',
  routing: 'Routing',
  signal: 'Signal',
  serviceability: 'Serviceability',
  documentation: 'Documentation',
  workmanship: 'Workmanship',
};

/* ── route geometry (drawing only — verdicts come from the data flags) ────
 * Segments marked `hidden` run in walls / above ceilings / inside the
 * mechanical space: dashed in FINISHED view, solid in X-RAY.
 * `len` is the segment's length in viewBox units — it drives the DRAW (dash
 * offset) and its duration, so a long pull genuinely takes longer to install
 * than a short stub. */
type CiArtSeg = { d: string; len: number; hidden?: boolean };

const ROUTE_SEGS: Record<string, Record<string, CiArtSeg[]>> = {
  // Geometry in the 20 units = 1 m sections of routeArt.tsx.
  'stage-to-rack': {
    'mech-shortcut': [
      { d: 'M112.6 163 H114.2', len: 2 },
      { d: 'M114.2 163 V88 H340 V147', len: 363, hidden: true },
      { d: 'M340 147 V176 H332', len: 37 },
    ],
    'tray-route': [
      { d: 'M112.6 166 H113', len: 1 },
      { d: 'M113 166 V138 H322 V147', len: 237, hidden: true },
      { d: 'M322 147 V156', len: 9 },
    ],
    'floor-shortcut': [{ d: 'M110 170 V194 H318', len: 232 }],
  },
  'amp-to-cluster': {
    catwalk: [
      { d: 'M40 156 V148 H86 V84', len: 118 },
      { d: 'M86 84 V45 H250 V84', len: 242, hidden: true },
      { d: 'M250 84 V92', len: 8 },
    ],
    'over-grid': [
      { d: 'M44 156 V144 H70 V84', len: 98 },
      { d: 'M70 84 V82.5 Q94 85 118 82.5 Q142 85 166 82.5 Q190 85 214 82.5 Q232 85 244 83 V84', len: 182, hidden: true },
      { d: 'M244 84 V92', len: 8 },
    ],
    'duct-ride': [
      { d: 'M36 156 V140 H80 V84', len: 116 },
      { d: 'M80 84 V54.5 H242 V84', len: 221, hidden: true },
      { d: 'M242 84 V92', len: 8 },
    ],
  },
};

/** Where the picked route's worst condition actually bites, in viewBox units.
 *  Used for ONE brief attention pulse on the verdict (then it rests). */
const HAZARD_POINTS: Record<string, Record<string, [number, number]>> = {
  'stage-to-rack': {
    'mech-shortcut': [216, 88],
    'floor-shortcut': [188, 194],
  },
  'amp-to-cluster': {
    'over-grid': [142, 83],
    'duct-ride': [170, 54.5],
  },
};

/** A flag only earns a pulse if it is genuinely a hazard, not a footnote. */
const HAZARD_COST = 0.4;

/**
 * Install choreography for one route: segments draw IN ORDER, each overlapping
 * the previous slightly, so the run reads as one continuous pull rather than
 * three unrelated lines. `fast` is the learner's pick — confident and quick;
 * the un-picked survey draw is a touch slower and starts on its own beat.
 */
function installTiming(segs: CiArtSeg[], fast: boolean, base: number) {
  const out: { delay: number; duration: number }[] = [];
  let at = base;
  for (const s of segs) {
    const duration = fast ? Math.max(170, Math.min(500, s.len * 1.3)) : Math.max(220, Math.min(560, s.len * 1.5));
    out.push({ delay: at, duration });
    at += duration * 0.82;
  }
  return out;
}

/** Route badges sit ON their own line, in a stretch no other route shares. */
const ROUTE_LETTER_POS: Record<string, [number, number][]> = {
  'stage-to-rack': [
    [262, 88],
    [200, 138],
    [150, 194],
  ],
  'amp-to-cluster': [
    [168, 45],
    [158, 83],
    [206, 54.5],
  ],
};

const MAP_A11Y: Record<string, string> = {
  'stage-to-rack':
    'Building section: stage at left with the input panel, a mechanical bay above the corridor in the middle, and the control room with the rack at right. A cable tray runs above the corridor ceiling. Route A cuts through the mechanical bay, route B rides the ceiling tray, route C crosses the corridor floor through both doorways. Selection happens on the route cards below, not on this drawing.',
  'amp-to-cluster':
    'Building section: amp room at lower left with the rack, the hall at right with a flown loudspeaker cluster, and an attic above the tile ceiling holding a catwalk and an HVAC duct. Route A rides the catwalk on hooks, route B lies across the ceiling tiles, route C is tied along the duct. Selection happens on the route cards below, not on this drawing.',
};

const HAZARD = '#ff9b8f';
const MAP_ASPECT = 360 / 220;

/* ── motion primitives for the section drawing ──────────────────────────── */

/** Opacity ramp with a delay in, and a single quick fade out — so X-RAY OPENS
 *  in a readable order and CLOSES as one movement. */
function useFade(on: boolean, delay: number, duration: number = CI_MOTION.base) {
  const m = useCiMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = on ? 1 : 0;
      return;
    }
    t.value = on
      ? withDelay(delay, withTiming(1, { duration, easing: CI_EASE.out }))
      : withTiming(0, { duration: CI_MOTION.quick, easing: CI_EASE.inOut });
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, delay, duration, m.reduce]);
  return useAnimatedProps(() => ({ opacity: t.value }));
}

/** Furniture that fades up once, on its own beat (route letters). */
function LateLayer({ delay, children }: { delay: number; children: ReactNode }) {
  const p = useFade(true, delay);
  return (
    <AG opacity={0} animatedProps={p}>
      {children}
    </AG>
  );
}

/**
 * One segment of a candidate route.
 *   • the run installs itself by walking strokeDashoffset to 0;
 *   • a concealed segment renders TWICE — a faint continuous body that rises
 *     to full in X-RAY, and a dash comb that materialises with the pull and
 *     dissolves away when the surfaces come off. That pair is the
 *     cross-dissolve: dashed → solid, never a cut.
 * Rest poses are captured ONCE (useRef): a static prop that changed on
 * re-render would fight the UI-thread animation and snap the path.
 */
function RouteSeg({
  seg,
  color,
  picked,
  xray,
  timing,
}: {
  seg: CiArtSeg;
  color: string;
  picked: boolean;
  xray: boolean;
  timing: { delay: number; duration: number };
}) {
  const { progress } = useDrawIn(seg.len, { duration: timing.duration, delay: timing.delay });
  const w = useTween(picked ? 2.6 : 1.7, CI_MOTION.base);
  const x = useTween(xray ? 1 : 0, CI_MOTION.base);
  const restW = useRef(picked ? 2.6 : 1.7).current;
  const restOp = useRef(seg.hidden ? (xray ? 1 : 0.3) : 1).current;

  const body = useAnimatedProps(() => ({
    strokeDashoffset: seg.len * (1 - progress.value),
    strokeWidth: w.value,
    opacity: seg.hidden ? 0.3 + 0.7 * x.value : 1,
  }));
  const comb = useAnimatedProps(() => ({
    strokeWidth: w.value,
    opacity: (1 - x.value) * Math.min(1, progress.value * 1.3),
  }));

  return (
    <>
      <APath
        d={seg.d}
        stroke={color}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={restW}
        opacity={restOp}
        strokeDasharray={seg.len}
        strokeDashoffset={seg.len}
        animatedProps={body}
      />
      {seg.hidden ? (
        <APath
          d={seg.d}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={restW}
          opacity={0}
          strokeDasharray="4 3"
          animatedProps={comb}
        />
      ) : null}
    </>
  );
}

/** The routes not taken fade back the moment a call is made. */
function RouteGroup({ dimmed, children }: { dimmed: boolean; children: ReactNode }) {
  const t = useTween(dimmed ? 0.3 : 1, CI_MOTION.base);
  const rest = useRef(dimmed ? 0.3 : 1).current;
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={rest} animatedProps={p}>
      {children}
    </AG>
  );
}

/** Attention, then rest: the hazard breathes for a few seconds when the
 *  verdict lands, then leaves a quiet permanent mark. Nothing loops forever. */
function HazardPing({ x, y }: { x: number; y: number }) {
  const m = useCiMotion();
  const [live, setLive] = useState(true);
  useEffect(() => {
    if (!m.loops) {
      setLive(false);
      return;
    }
    const id = setTimeout(() => setLive(false), 4200);
    return () => clearTimeout(id);
  }, [m.loops]);
  return (
    <>
      {live ? <PulseRing cx={x} cy={y} r={7} color={HAZARD} /> : null}
      <Circle cx={x} cy={y} r={2.8} fill={HAZARD} opacity={0.9} />
    </>
  );
}

/* ── the section map: building + routes + letters ───────────────────────── */
function RouteMap({ scenario, xray, picked, w, h }: { scenario: CiRouteScenario; xray: boolean; picked: string | null; w: number; h: number }) {
  const tint = cableTypeById(scenario.cable).tint;
  const mine = picked ? scenario.options.find((o) => o.id === picked) : undefined;
  const hazard = picked ? HAZARD_POINTS[scenario.id]?.[picked] : undefined;
  const showHazard = !!hazard && !!mine && mine.flags.some((f) => !f.positive && f.cost >= HAZARD_COST);
  return (
    <View accessible
      accessibilityRole="image"
      accessibilityLabel={`${MAP_A11Y[scenario.id]}${
        showHazard ? ' The worst condition on your chosen route is marked on the drawing; the notes below name it.' : ''
      }`}
    >
      <Svg width={w} height={h} viewBox="0 0 360 220">
        {scenario.id === 'stage-to-rack' ? <StageRackSection xray={xray} tint={tint} /> : <ClusterSection xray={xray} tint={tint} />}
        {scenario.options.map((o, i) => {
          const segs = ROUTE_SEGS[scenario.id][o.id] ?? [];
          const isPicked = picked === o.id;
          /* THE SIGNATURE MOVE: re-keying the picked route's segments remounts
             them, so the cable installs itself again — fast, thick, confident
             — the instant the call is made. The others simply fade back. */
          const timing = installTiming(segs, isPicked, isPicked ? 0 : 140 + i * 120);
          return (
            <RouteGroup key={o.id} dimmed={picked != null && !isPicked}>
              {segs.map((sg, j) => (
                <RouteSeg
                  key={`${o.id}-${j}-${isPicked ? 'install' : 'survey'}`}
                  seg={sg}
                  color={ROUTE_COLORS[i]}
                  picked={isPicked}
                  xray={xray}
                  timing={timing[j]}
                />
              ))}
            </RouteGroup>
          );
        })}
        {scenario.id === 'stage-to-rack' ? <StageRackOverlay /> : null}
        {/* letters land once the candidates are on the page */}
        <LateLayer delay={CI_MOTION.draw}>
          {scenario.options.map((o, i) => {
            const pos = ROUTE_LETTER_POS[scenario.id][i];
            return <RouteBadge key={o.id} x={pos[0]} y={pos[1]} letter={LETTERS[i]} color={ROUTE_COLORS[i]} />;
          })}
        </LateLayer>
        {showHazard && hazard ? <HazardPing x={hazard[0]} y={hazard[1]} /> : null}
      </Svg>
    </View>
  );
}

/* ── six labeled dimension bars, numbers visible (spec §22) ─────────────── */
/** Per-bar stagger and count-up duration. Kept tight so the whole scorecard
 *  is legible inside about a second — and instant under reduced motion. */
const BAR_STEP = 55;
const CARD_STEP = 200;
const COUNT_MS = 460;

/** The bar GROWS to its value and the number COUNTS to it, so the score reads
 *  as earned rather than printed. The accessibility label always carries the
 *  FINAL value — a screen reader never hears a transient number. */
function DimRow({ dim, value, delay }: { dim: CiDim; value: number; delay: number }) {
  const m = useCiMotion();
  const [trackW, setTrackW] = useState(0);
  const [target, setTarget] = useState(0);
  const shown = useCountUp(target, COUNT_MS);
  const grow = useSharedValue(0);

  useEffect(() => {
    if (m.reduce) {
      setTarget(value);
      return;
    }
    const id = setTimeout(() => setTarget(value), delay);
    return () => clearTimeout(id);
  }, [value, delay, m.reduce]);

  useEffect(() => {
    cancelAnimation(grow);
    if (m.reduce) {
      grow.value = value;
      return;
    }
    grow.value = 0;
    grow.value = withDelay(delay, withTiming(value, { duration: CI_MOTION.reveal, easing: CI_EASE.out }));
    return () => cancelAnimation(grow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, m.reduce]);

  const fill = useAnimatedStyle(() => ({ width: (trackW * grow.value) / 100 }));
  const barTint = value >= 85 ? colors.green : value >= 55 ? colors.amber : '#ff8a6b';

  return (
    <View style={styles.dimRow} accessibilityLabel={`${DIM_LABELS[dim]}: ${value} out of 100`}>
      <Text style={styles.dimLabel} numberOfLines={1}>
        {DIM_LABELS[dim]}
      </Text>
      <View style={styles.dimTrack} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.dimFill, { backgroundColor: barTint }, fill]} />
      </View>
      <Text style={styles.dimNum}>{shown}</Text>
    </View>
  );
}

function DimBars({ dims, baseDelay = 0 }: { dims: CiDimScores; baseDelay?: number }) {
  return (
    <View style={{ gap: 4 }}>
      {ROUTE_DIMS.map((d, i) => (
        <DimRow key={d} dim={d} value={dims[d] ?? 0} delay={baseDelay + i * BAR_STEP} />
      ))}
    </View>
  );
}

/* ── one scored route in the reveal ─────────────────────────────────────── */
function VerdictCard({
  option,
  verdict,
  overall,
  letter,
  color,
  mine,
  best,
  safetyReject,
  index,
}: {
  option: CiRouteOption;
  verdict: CiRouteVerdict;
  overall: number;
  letter: string;
  color: string;
  mine: boolean;
  best: boolean;
  safetyReject: boolean;
  index: number;
}) {
  const base = index * CARD_STEP;
  const score = useCountUp(overall, CI_MOTION.reveal);
  return (
    <Appear delay={index * 90} style={[styles.verdictCard, mine && { borderColor: color + '99' }]}>
      <View style={styles.verdictHead}>
        <Text style={[styles.verdictLetter, { color }]}>{letter}</Text>
        <Text style={styles.verdictName} numberOfLines={2}>
          {option.name}
        </Text>
        <Text style={styles.verdictOverall} accessibilityLabel={`Overall score ${overall} out of 100`}>
          {score}
          <Text style={styles.verdictOutOf}> /100</Text>
        </Text>
      </View>
      {best || mine || safetyReject ? (
        <Appear delay={base + CI_MOTION.base}>
          <View style={styles.tagRow}>
            {best ? <Text style={styles.tagBest}>✓ BEST CALL</Text> : null}
            {/* A verdict, not a score: a route that violates a safety rule is
                not "75/100", it is rejected (owner review — new tag copy). */}
            {safetyReject ? <Text style={styles.tagReject}>✕ REJECTED — SAFETY</Text> : null}
            {mine ? <Text style={styles.tagMine}>YOUR PICK</Text> : null}
          </View>
        </Appear>
      ) : null}
      <DimBars dims={verdict.dims} baseDelay={base} />
      <View style={{ gap: 3 }}>
        {option.flags.map((f, fi) => (
          <Stagger key={`${f.ruleId}-${fi}`} index={2 + fi * 0.8} from={6}>
            <Text style={[styles.flagGlyph, { color: f.positive ? colors.green : '#ff9b8f' }]}>
              {f.positive ? '+' : '−'}  <Text style={styles.flagNote}>{f.note}</Text>
            </Text>
          </Stagger>
        ))}
        {verdict.overallNotes.slice(option.flags.length).map((n, ni) => (
          <Stagger key={n} index={2 + (option.flags.length + ni) * 0.8} from={6}>
            <Text style={styles.flagGlyph}>
              ·  <Text style={styles.flagNote}>{n}</Text>
            </Text>
          </Stagger>
        ))}
      </View>
    </Appear>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function RouteScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [xrays, setXrays] = useState<Record<string, boolean>>({});
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [fired, setFired] = useState(completed);
  const mapW = Math.max(280, width);

  const ranked = useMemo(() => {
    const m: Record<string, ReturnType<typeof rankRoutes>> = {};
    for (const s of CI_ROUTE_SCENARIOS) m[s.id] = rankRoutes(s.options);
    return m;
  }, []);

  const setXray = (sid: string, v: boolean) => {
    setXrays((prev) => ({ ...prev, [sid]: v }));
    AccessibilityInfo.announceForAccessibility(
      v ? 'X-ray view: in-wall and above-ceiling runs shown solid.' : 'Finished view: concealed runs dashed.',
    );
  };

  const select = (sid: string, oid: string) => {
    if (picks[sid]) return;
    const next = { ...picks, [sid]: oid };
    setPicks(next);
    const sc = CI_ROUTE_SCENARIOS.find((x) => x.id === sid);
    const rk = ranked[sid];
    if (sc && rk) {
      const mine = rk.find((r) => r.option.id === oid);
      const oi = sc.options.findIndex((o) => o.id === oid);
      if (mine) {
        AccessibilityInfo.announceForAccessibility(
          `Route ${LETTERS[oi]} selected — it scored ${mine.overall} of 100. Best route: ${rk[0].option.name}, ${rk[0].overall}.`,
        );
      }
    }
    if (!fired && CI_ROUTE_SCENARIOS.every((x) => next[x.id] != null)) {
      setFired(true);
      let dims: CiDimScores = {};
      for (const x of CI_ROUTE_SCENARIOS) {
        const chosen = x.options.find((op) => op.id === next[x.id]);
        if (chosen) dims = mergeDims(dims, evaluateRoute(chosen).dims);
      }
      announceComplete('Stage 3 complete. The shortest route is not always the best route.');
      onComplete(dims);
    }
  };

  /** Average dims of the routes actually chosen (for the completion card). */
  const chosenDims = useMemo(() => {
    if (!CI_ROUTE_SCENARIOS.every((s) => picks[s.id] != null)) return null;
    let dims: CiDimScores = {};
    for (const s of CI_ROUTE_SCENARIOS) {
      const chosen = s.options.find((o) => o.id === picks[s.id]);
      if (chosen) dims = mergeDims(dims, evaluateRoute(chosen).dims);
    }
    return dims;
  }, [picks]);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.lead}>
        {'Judge each candidate on the whole life of the cable, not the pull day. Pick the route you would install — every option is then scored on six dimensions.'}
      </Text>

      {CI_ROUTE_SCENARIOS.map((s, si) => {
        const xray = !!xrays[s.id];
        const picked = picks[s.id] ?? null;
        const rk = ranked[s.id];
        const type = cableTypeById(s.cable);
        const mineOpt = picked ? s.options.find((o) => o.id === picked) : null;
        const seenRules = new Set<string>();
        const fbFlags = mineOpt
          ? mineOpt.flags.filter((f) => (seenRules.has(f.ruleId) ? false : (seenRules.add(f.ruleId), true))).slice(0, 3)
          : [];
        const shortest = s.options.reduce((m, o) => (o.relLength < m.relLength ? o : m), s.options[0]);
        const shortIdx = rk.findIndex((r) => r.option.id === shortest.id);
        const shortRank = shortIdx + 1;
        const shortOverall = shortIdx >= 0 ? rk[shortIdx].overall : 0;

        return (
          <CiSection key={s.id} title={`INSTALLATION ${si + 1} OF ${CI_ROUTE_SCENARIOS.length} — ${s.title.toUpperCase()}`}>
            <Text style={styles.brief}>{s.brief}</Text>
            <View style={styles.cableRow}>
              <View style={[styles.cableSwatch, { backgroundColor: type.tint }]} />
              <Text style={styles.cableName}>CABLE: {type.name}</Text>
            </View>
            {si === 0 ? (
              <Text style={styles.tintNote}>Training visualization colors — actual field cable colors vary.</Text>
            ) : null}

            <View style={styles.chipRow}>
              <OptionChip label="FINISHED" active={!xray} onPress={() => setXray(s.id, false)} />
              <OptionChip label="X-RAY" active={xray} onPress={() => setXray(s.id, true)} />
            </View>
            <ExpandableFigure
              width={mapW}
              aspect={MAP_ASPECT}
              title="SECTION"
              badge="Scale: 20 units = 1 m · person 1.75 m"
              render={(fw, fh) => <RouteMap scenario={s} xray={xray} picked={picked} w={fw} h={fh} />}
              controls={
                <View style={{ gap: 7 }}>
                  <View style={styles.chipRow}>
                    <OptionChip label="FINISHED" active={!xray} onPress={() => setXray(s.id, false)} />
                    <OptionChip label="X-RAY" active={xray} onPress={() => setXray(s.id, true)} />
                  </View>
                  <View style={styles.chipRow}>
                    {s.options.map((o, i) => (
                      <OptionChip
                        key={o.id}
                        label={`PULL ${LETTERS[i]}`}
                        active={picked === o.id}
                        disabled={picked != null && picked !== o.id}
                        onPress={() => select(s.id, o.id)}
                      />
                    ))}
                  </View>
                </View>
              }
            />
            <Text style={styles.legendLine}>
              {xray
                ? 'X-RAY — surfaces stripped: in-wall and above-ceiling runs solid.'
                : 'FINISHED — the space as occupants see it: concealed runs dashed.'}
            </Text>
            <View style={styles.legendRow}>
              {s.options.map((o, i) => (
                <View key={o.id} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: ROUTE_COLORS[i] }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {LETTERS[i]} · {o.name}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.q}>WHICH ROUTE DO YOU PULL?</Text>
            <View style={{ gap: 9 }}>
              {s.options.map((o, i) => {
                const isPicked = picked === o.id;
                return (
                  <Stagger key={o.id} index={i}>
                  <Pressable
                    style={[styles.routeCard, isPicked && { borderColor: ROUTE_COLORS[i] + 'AA' }]}
                    disabled={picked != null}
                    onPress={() => select(s.id, o.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isPicked, disabled: picked != null }}
                    aria-pressed={isPicked}
                    aria-disabled={picked != null}
                    accessibilityLabel={`Route ${LETTERS[i]}: ${o.name}. ${o.path} Relative length ${o.relLength.toFixed(1)} times the shortest.`}
                  >
                    <View style={styles.routeHead}>
                      <View style={[styles.letterDot, { borderColor: ROUTE_COLORS[i] }]}>
                        <Text style={[styles.letterText, { color: ROUTE_COLORS[i] }]}>{LETTERS[i]}</Text>
                      </View>
                      <Text style={styles.routeName}>{o.name}</Text>
                    </View>
                    <Text style={styles.routePath}>{o.path}</Text>
                    <Text style={styles.routeLen}>Relative length ×{o.relLength.toFixed(1)} (shortest = ×1.0)</Text>
                  </Pressable>
                  </Stagger>
                );
              })}
            </View>

            {picked && mineOpt ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.revealEyebrow}>THE VERDICT — ALL THREE ROUTES, SCORED</Text>
                {rk.map(({ option, verdict, overall, safetyReject }, ri) => {
                  const oi = s.options.findIndex((o) => o.id === option.id);
                  return (
                    <VerdictCard
                      safetyReject={safetyReject}
                      key={option.id}
                      option={option}
                      verdict={verdict}
                      overall={overall}
                      letter={LETTERS[oi]}
                      color={ROUTE_COLORS[oi]}
                      mine={option.id === picked}
                      best={ri === 0}
                      index={ri}
                    />
                  );
                })}

                <Text style={styles.revealEyebrow}>WHY YOUR ROUTE SCORED THAT WAY</Text>
                {fbFlags.map((f, fi) => (
                  <Stagger key={f.ruleId} index={fi}>
                    <RuleFeedback ruleId={f.ruleId} verdict={f.positive ? 'good' : 'bad'} short={f.note} openSources={openSources} />
                  </Stagger>
                ))}

                <Appear delay={CI_MOTION.quick} style={styles.lessonCard}>
                  <Text style={styles.lessonHead}>THE SHORTEST ROUTE IS NOT ALWAYS THE BEST ROUTE</Text>
                  <Text style={styles.lessonBody}>
                    {shortRank === 1
                      ? `${shortest.name} is the shortest pull here and still held up — that is a coincidence to verify every time, not a rule.`
                      : `${shortest.name} is the shortest pull here — and it finished ${
                          shortRank === rk.length ? `LAST at ${shortOverall}/100` : `#${shortRank} of ${rk.length} at ${shortOverall}/100`
                        }, ${rk[0].overall - shortOverall} points behind ${rk[0].option.name}. Length is one input; safety, protection, pathway quality and the next technician are the rest.`}
                  </Text>
                  <RuleFeedback ruleId="plan-shortest-not-best" verdict="info" openSources={openSources} />
                </Appear>
              </View>
            ) : null}
          </CiSection>
        );
      })}

      {chosenDims ? (
        <Appear style={styles.doneCard}>
          <Text style={styles.doneHead}>✓ STAGE 3 COMPLETE — YOUR DECISIONS, SCORED</Text>
          <ScoreBars dims={chosenDims} />
          <Text style={styles.doneSub}>
            {'The average of the two routes you chose. Replay and choose differently — the profile follows your calls.'}
          </Text>
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  brief: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  cableRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cableSwatch: { width: 13, height: 13, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' },
  cableName: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  chipRow: { flexDirection: 'row', gap: 7 },
  mapFrame: { borderRadius: 12, borderWidth: 1, borderColor: '#232329', backgroundColor: '#0e0e12', padding: 5, alignSelf: 'flex-start' },
  legendLine: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12.5, color: colors.textSecondary },
  q: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary, marginTop: 2 },
  routeCard: { gap: 5, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  routeHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  letterDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101014' },
  letterText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13 },
  routeName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  routePath: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  routeLen: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  revealEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amberLabel, marginTop: 2 },
  verdictCard: { gap: 8, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#111115', padding: 12 },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  verdictLetter: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, width: 18 },
  verdictName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textPrimary },
  verdictOverall: { fontFamily: fonts.mono, fontSize: 17, color: colors.amberLabel },
  verdictOutOf: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  tagRow: { flexDirection: 'row', gap: 10 },
  tagBest: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.green },
  tagMine: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  tagReject: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: '#ff8d80', borderWidth: 1, borderColor: 'rgba(255,110,95,.55)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden' },
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimLabel: { width: 92, fontFamily: fonts.barlowCondensedMedium, fontSize: 12, color: colors.textSecondary },
  dimTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#222228', overflow: 'hidden' },
  dimFill: { height: 8, borderRadius: 4 },
  dimNum: { width: 28, textAlign: 'right', fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  flagGlyph: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5 },
  flagNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary },
  lessonCard: { gap: 8, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  doneCard: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(55,224,95,.45)', backgroundColor: '#0c1a10', padding: 13 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.green },
  doneSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
