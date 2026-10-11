/**
 * STAGE 9 — Floor & Temporary Event Runs (spec §32).
 *
 * The live-sound stage: (A) STAGE CRAFT — a stage plan that starts as found
 * (webs across the performer lane, loose loops) and redraws itself the
 * professional way as three routing calls are made; (B)+(C) the two
 * CI_FLOOR_SCENARIOS route decisions (FOH run, backstage load-in) revealed
 * through the shared route evaluator — "a cable ramp does not automatically
 * make a crossing acceptable" must land; (D) OVER-UNDER coiling practice:
 * alternate OVER/UNDER loops, watch the coil draw and the twist meter react.
 *
 * Completion: A's three calls + B + C answered + D coiled correctly →
 * onComplete({ safety, protection, workmanship }) scored from the chosen
 * routes' evaluated dimensions plus stage-craft calls and coil quality.
 *
 * ── MOTION (owner 2026-08-24: the lab shipped static) ──────────────────────
 *   A  the deck installs itself on arrival, a performer crosses the webbed
 *      lane ONCE, and every correction is a TRANSFORM: the found run retracts
 *      toward the box, then the professional run draws in behind it. No cuts.
 *   B/C routes draw in staggered; the pick RE-INSTALLS itself while the others
 *      fade back; dimension bars fill and the picked card's numbers count up;
 *      one deliberate traffic pass crosses the hazardous route, flashing at
 *      the conflict point.
 *   D  THE HERO: each tap draws that loop in along its arc (~250ms) and springs
 *      to rest; the alternating lay is in the geometry; stored twist makes the
 *      whole coil tighten and writhe (radii, tilt and spacing all animate);
 *      the twist meter sweeps and cross-fades; a clean coil settles with one
 *      spring and the verdict appears.
 * Primitive props only (cx/cy/r/rx/ry/x1..y2/width/opacity/strokeWidth/
 * strokeDashoffset/d) — never a transform on <G>, per motion.tsx.
 *
 * Accessibility: every interaction is a labeled button ≥44dp (no drag);
 * verdicts render as glyph + words + color and are announced; the coil is
 * driven by two large buttons by design. Route/plan art is a qualitative
 * training visualization (stated in-scene); training tints only. Reduced
 * motion collapses every duration to 0 — identical end state, no loops.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip } from '../../cable/lessons/bits';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { Callout, Connector, JacketPath, shade, tint as lighten, SVG_A11Y } from '../svgArt';
import { ConsoleTop, DiBoxTop, DimLine, DistroTop, DockDoor, DrumKitTop, ForkliftTop, GtrAmpTop, HazardEdge, KeysTop, MicStandTop, PerformerTop, PLAN_LABEL, PlanLabel, RampTop, RigPointTop, RiserTop, RoadCaseTop, SeatRow, SnakeHeadTop, StageBoxTop, StageDeck, TapeStrip, WEDGE_JACK_DX, WEDGE_JACK_DY, WedgeTop } from './floorArt';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { CI_FLOOR_SCENARIOS, CI_OVERUNDER_STEPS, type CiRouteScenario } from '../data/scenarios';
import { evaluateRoute, rankRoutes, type CiRouteFlag } from '../engine/routeEval';
import { CI_DIMS, CI_DIM_META } from '../engine/score';
import {
  ACircle,
  AG,
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
  useCountUp,
  useSettle,
  useSharedValue,
  useTween,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

/* ── (A) stage-craft decisions ──────────────────────────────────────────── */
type CraftOption = { id: string; label: string; ok: boolean; short: string };
type CraftDecision = { id: 'route' | 'slack' | 'mon'; prompt: string; options: CraftOption[] };

const CRAFT_DECISIONS: CraftDecision[] = [
  {
    id: 'route',
    prompt: '① Mic lines from the snake head to the three vocal stands:',
    options: [
      { id: 'lane', label: 'STRAIGHT ACROSS THE PLAYING AREA', ok: false, short: 'That web sits exactly where performers move — feet find cable every time.' },
      { id: 'edge', label: 'UP THE SR EDGE, ALONG THE RISER FACE, TAPED', ok: true, short: 'Bundled up the edge and taped along the riser face — nothing crosses the playing area, and each line drops in beside its singer, not under their feet.' },
    ],
  },
  {
    id: 'slack',
    prompt: '② The spare mic-cable length:',
    options: [
      { id: 'loops', label: 'LEAVE LOOSE LOOPS ON DECK', ok: false, short: 'Loose loops migrate into lanes and snag feet, stands and wheels.' },
      { id: 'dressed', label: 'DRESS THE SLACK AT THE BOX', ok: true, short: 'Working slack lives coiled at the box — reachable, never underfoot.' },
    ],
  },
  {
    id: 'mon',
    prompt: '③ Monitor feeds from MON to the three wedges:',
    options: [
      { id: 'bare', label: 'RUN THEM BARE ACROSS THE DECK', ok: false, short: 'Bare lines where performers walk get stepped on all show — and fail at the downbeat.' },
      { id: 'dressed', label: 'DRESS THE LIP + PROTECT THE STAIR CROSSING', ok: true, short: 'Taped along the lip behind the wedges; where feet come up the stair, a low-profile cover and glow tape — never a hump at the head of a stair.' },
    ],
  },
];

const ROUTE_TINTS = ['#ffd35e', '#4fd0e0', '#c77dff'] as const;
const LETTERS = ['A', 'B', 'C'] as const;

/* ── motion primitives shared by the plans ──────────────────────────────── */
/** How long the found run takes to pull back before the correct one installs. */
const RETRACT_MS = 250;

/**
 * A run that either belongs to the found state ('bad') or the professional
 * state ('good'). One prop, `fixed`, drives the whole transform: the bad run
 * retracts toward its origin, then the good run draws in behind it — the plan
 * never cuts between two pictures.
 */
function SwapPath({
  d,
  len,
  tint,
  width,
  mode,
  fixed,
  delay = 0,
  intro = 0,
}: {
  d: string;
  len: number;
  tint: string;
  width: number;
  mode: 'bad' | 'good';
  fixed: boolean;
  delay?: number;
  /** Mount stagger — the deck installs itself when the scene arrives. */
  intro?: number;
}) {
  const m = useCiMotion();
  const target = mode === 'bad' ? (fixed ? 0 : 1) : fixed ? 1 : 0;
  const v = useSharedValue(mode === 'bad' && !fixed ? 0 : target);
  const first = useRef(true);
  const drawMs = Math.min(CI_MOTION.draw, 240 + len * 1.6);

  useEffect(() => {
    cancelAnimation(v);
    if (first.current) {
      first.current = false;
      if (m.reduce || target === 0) {
        v.value = target;
        return;
      }
      v.value = 0;
      v.value = withDelay(intro, withTiming(1, { duration: drawMs, easing: CI_EASE.out }));
      return;
    }
    if (m.reduce) {
      v.value = target;
      return;
    }
    v.value =
      mode === 'bad'
        ? withTiming(target, { duration: RETRACT_MS, easing: CI_EASE.inOut })
        : withDelay(RETRACT_MS + delay, withTiming(target, { duration: drawMs, easing: CI_EASE.out }));
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, mode, m.reduce]);

  // one clock, three tonal layers (edge / body / sheen) — each its own mapper
  const mk = () => {
    'worklet';
    // kill the round cap's leftover dot when the run is fully retracted
    return { strokeDashoffset: len * (1 - v.value), opacity: v.value < 0.015 ? 0 : 1 };
  };
  const pEdge = useAnimatedProps(mk);
  const pBody = useAnimatedProps(mk);
  const pSheen = useAnimatedProps(mk);
  const body = shade(tint, 0.22);
  const common = { d, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeDasharray: len, strokeDashoffset: len, opacity: 0 };
  return (
    <G>
      <APath {...common} stroke={shade(tint, 0.66)} strokeWidth={width} animatedProps={pEdge} />
      <APath {...common} stroke={body} strokeWidth={width * 0.74} animatedProps={pBody} />
      <G transform={`translate(${-width * 0.16} ${-width * 0.2})`}>
        <APath {...common} stroke={lighten(body, 0.5)} strokeWidth={width * 0.24} animatedProps={pSheen} />
      </G>
    </G>
  );
}

/** A loop of slack that shrinks away, or lands at the box with mass. */
function SwapCircle({
  cx,
  cy,
  r,
  tint,
  width,
  show,
  delay = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  tint: string;
  width: number;
  show: boolean;
  delay?: number;
}) {
  const m = useCiMotion();
  const v = useSharedValue(show ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    cancelAnimation(v);
    if (first.current) {
      first.current = false;
      v.value = show ? 1 : 0;
      return;
    }
    if (m.reduce) {
      v.value = show ? 1 : 0;
      return;
    }
    v.value = show
      ? withDelay(RETRACT_MS + delay, withSpring(1, CI_SPRING))
      : withTiming(0, { duration: RETRACT_MS, easing: CI_EASE.inOut });
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, m.reduce]);
  const mk = () => {
    'worklet';
    return { r: Math.max(0.01, r * v.value), opacity: Math.min(1, v.value * 1.8) };
  };
  const pEdge = useAnimatedProps(mk);
  const pBody = useAnimatedProps(mk);
  const common = { cx, cy, r: show ? r : 0.01, fill: 'none', opacity: show ? 1 : 0 };
  return (
    <>
      <ACircle {...common} stroke={shade(tint, 0.66)} strokeWidth={width} animatedProps={pEdge} />
      <ACircle {...common} stroke={shade(tint, 0.22)} strokeWidth={width * 0.7} animatedProps={pBody} />
    </>
  );
}

/** Fades a group of static furniture (risers, protectors) with the swap. */
function SwapGroup({ show, delay = 0, children }: { show: boolean; delay?: number; children: ReactNode }) {
  const m = useCiMotion();
  const v = useSharedValue(show ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    cancelAnimation(v);
    if (first.current) {
      first.current = false;
      v.value = show ? 1 : 0;
      return;
    }
    if (m.reduce) {
      v.value = show ? 1 : 0;
      return;
    }
    v.value = show
      ? withDelay(RETRACT_MS + delay, withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out }))
      : withTiming(0, { duration: CI_MOTION.quick, easing: CI_EASE.inOut });
    return () => cancelAnimation(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, m.reduce]);
  const animatedProps = useAnimatedProps(() => ({ opacity: v.value }));
  return (
    <AG opacity={show ? 1 : 0} animatedProps={animatedProps}>
      {children}
    </AG>
  );
}

/**
 * ONE deliberate pass of traffic across a run — a foot or a rolling case —
 * with a flash at the conflict point. Never loops: it makes the point once.
 */
function TrafficPass({
  x1,
  y1,
  x2,
  y2,
  run,
  delay = 0,
  duration = 1700,
  tint = '#e8e8ea',
  cart = false,
  crossAt,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  run: boolean;
  delay?: number;
  duration?: number;
  tint?: string;
  /** Two wheels + axle instead of a single foot marker. */
  cart?: boolean;
  /** Fraction along the pass where it crosses the cable (flash point). */
  crossAt: number;
}) {
  const m = useCiMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (!run || m.reduce) {
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration, easing: CI_EASE.inOut }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, delay, duration, m.reduce]);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const nlen = Math.max(1, Math.hypot(dx, dy));
  // perpendicular offset for the cart's second wheel
  const px = (-dy / nlen) * 6;
  const py = (dx / nlen) * 6;
  const fx = x1 + dx * crossAt;
  const fy = y1 + dy * crossAt;

  const leadProps = useAnimatedProps(() => {
    const p = t.value;
    const vis = p <= 0 || p >= 1 ? 0 : Math.min(1, Math.min(p, 1 - p) * 7);
    return { cx: x1 + dx * p, cy: y1 + dy * p, opacity: vis * 0.92 };
  });
  const trailProps = useAnimatedProps(() => {
    const p = t.value;
    const vis = p <= 0 || p >= 1 ? 0 : Math.min(1, Math.min(p, 1 - p) * 7);
    return { cx: x1 + dx * p + px, cy: y1 + dy * p + py, opacity: vis * 0.92 };
  });
  const flashProps = useAnimatedProps(() => {
    const dd = t.value - crossAt;
    const g = t.value <= 0 ? 0 : Math.exp(-(dd * dd) / 0.0032);
    return { r: 4 + 11 * g, opacity: 0.8 * g };
  });

  return (
    <G>
      <ACircle cx={fx} cy={fy} r={4} fill="none" stroke="#ff9b8f" strokeWidth={1.8} opacity={0} animatedProps={flashProps} />
      <ACircle cx={x1} cy={y1} r={cart ? 3.4 : 4.2} fill={tint} opacity={0} animatedProps={leadProps} />
      {cart ? <ACircle cx={x1 + px} cy={y1 + py} r={3.4} fill={tint} opacity={0} animatedProps={trailProps} /> : null}
    </G>
  );
}

/* ── stage plan (A) — a real stage plot that redraws each aspect as its call
   is made. Top-down, audience at the bottom (downstage), SR on the left of
   the drawing, SL on the right; 10 × 5 m deck at 32 units per metre with the
   plot's 1 m grid and dimension line. Drum riser upstage centre (kit facing
   the house, drum sub-snake at its front corner, step on the SL end), keys
   SL with the player upstage of them and the DI at the stand end, guitar amp
   SR with its mic and player, three singers with boom stands just downstage
   of them and wedges further downstage aimed straight back at them, the
   snake head DSR (trunk off the SR wing to FOH, split upstage to monitor
   world in the SL wing), quad boxes fed from the wings, and the stair at the
   downstage lip. ────────────────────────────────────────────────────────── */
const PLOT = { x: 16, y: 22, w: 320, h: 160, m: 32 } as const;
const VOX_XS = [120, 200, 282] as const;
/** Singers stand at SINGER_Y facing the house; each stand's base sits just
 *  downstage of them with the boom reaching back to the mouth. */
const SINGER_Y = 104;
const VOX_Y = 120;
const WEDGE_Y = 162;
/** The downstage playing area the singers work in. */
const LANE = { x: 96, y: 130, w: 214, h: 22 } as const;
const SNAKE = { x: 24, y: 146 } as const;
const MON = { x: 340, y: 150 } as const;
const RISER = { x: 148, y: 30, w: 64, h: 52 } as const;
/** The deck lip. */
const LIP_Y = PLOT.y + PLOT.h;
const STAIR = { x: 230, w: 30 } as const;
/**
 * LINE-DIAGRAM LANES (owner 2026-10-10: "cables need to stay shown
 * independently like in a line diagram drawing"). Every cable is its own
 * stroke from its own jack to its own end; where cables share a route they
 * run as parallel lanes LANE_GAP apart (≈1.6–1.8× the stroke), keep their order
 * the whole way, turn corners concentrically and peel off from the side they
 * leave on, so no two lanes ever cross or lie on top of one another.
 *
 * The snake head's jacks (SnakeHeadTop): top row = inputs, x = SNAKE.x + 3 +
 * 3.6·i at y JACK_IN; bottom row = returns / sends at y JACK_OUT.
 */
const LANE_GAP = 3.6;
const JACK_X = [27, 30.6, 34.2, 37.8, 41.4, 45] as const;
const JACK_IN = SNAKE.y + 4.2;
const JACK_OUT = SNAKE.y + 9.8;
/** SR-edge lanes (x), outside → in: the split leaves the box's top-left
 *  corner, then keys, amp, drum multicore and the three vocal lines, each
 *  dropping straight onto its own input jack. The corner onto the riser face
 *  is concentric (the outermost lane turns highest), so the order along the
 *  face is drum, VOX 3, VOX 2, VOX 1 — VOX 1 is the lowest lane and peels
 *  down first, the drum is the top lane and peels up the riser side. */
const EDGE = { split: JACK_X[0] - LANE_GAP, keys: JACK_X[0], amp: JACK_X[1], drum: JACK_X[2], vox: [JACK_X[5], JACK_X[4], JACK_X[3]] } as const;
const DRUM_Y = 85;
/** Along the riser face, VOX 1 / 2 / 3 (VOX 1 lowest). */
const FACE_Y = [DRUM_Y + 3 * LANE_GAP, DRUM_Y + 2 * LANE_GAP, DRUM_Y + LANE_GAP] as const;
/** Along the upstage edge: the split outside, keys inside. */
const TOP_Y = { split: 23.6, keys: 23.6 + LANE_GAP } as const;
/**
 * MONITOR SENDS leave from the SR side (owner 2026-10-10: "connect monitor
 * connections same side as stage snake/box connections") — the monitor
 * mixes come back from monitor world down the split and out of the snake
 * head's bottom-row return jacks, one per wedge (VOX 1's wedge on the
 * right-most jack). Dressed, they drop out of the box and run as three lanes
 * along the lip behind the wedges; the top lane peels up to wedge 1 first.
 */
const SEND_X = [JACK_X[5], JACK_X[4], JACK_X[3]] as const;
const SEND_Y = [170.6, 170.6 + LANE_GAP, 170.6 + 2 * LANE_GAP] as const;
/** Each wedge's input jack, on its rear (downstage) input panel. */
const WEDGE_JACK = (x: number) => ({ x: x + WEDGE_JACK_DX, y: WEDGE_Y + WEDGE_JACK_DY });
/** The monitor returns (owner 2026-10-10, "add it"): one grey multicore from
 *  MON back to the snake head's return connector, its own lane OUTSIDE the
 *  split all the way — up the SL edge, along the upstage edge, down the SR
 *  edge — so the mixes visibly travel MON → split → snake → wedges. */
const RET = { x: EDGE.split - LANE_GAP, topY: TOP_Y.split - LANE_GAP, slX: 333.4 + LANE_GAP, monY: MON.y + 4, snakeY: SNAKE.y + 4.4 } as const;
const SPLIT_MON_Y = MON.y + 4 + LANE_GAP;
/** The spare line's dressed coil hangs off the left-most return jack. */
const COIL = { cx: JACK_X[0], cy: 168, r: [4.5, 7.5] } as const;

/** As found: the three vocal lines leave their input jacks and web
 *  straight across the playing area to the stands — loose, crossing, but
 *  each its own line from jack to stand. */
const AS_FOUND_VOX = [
  `M${JACK_X[5]} ${JACK_IN} H48 C56 156 84 158 98 150 C108 144 116 134 ${VOX_XS[0]} ${VOX_Y + 1}`,
  `M${JACK_X[4]} ${JACK_IN} V143 C41.4 138 50 137 58 141 C68 146 74 151 90 150 C120 148 170 146 186 136 C196 130 199 125 ${VOX_XS[1]} ${VOX_Y + 1}`,
  `M${JACK_X[3]} ${JACK_IN} V134 C37.8 122 50 116 64 116 C86 116 96 136 112 146 C150 168 250 160 272 140 C280 132 282 126 ${VOX_XS[2]} ${VOX_Y + 1}`,
] as const;
/** As found: one spare line lying in three loose loops on deck, both ends
 *  free — one continuous cable, every loop its own. */
const SPARE_LOOPS =
  'M52 153 C54 148 58 141 64 140 A6 6 0 0 1 64 152 A6 6 0 0 1 64 140 ' +
  'C68 138 72 136 77 136 A5 5 0 0 1 77 146 A5 5 0 0 1 77 136 ' +
  'C81 135 84 133 88 133 A4 4 0 0 1 88 141 A4 4 0 0 1 88 133 C92 133 95 135 96 138';
/** As found: the three monitor feeds lie bare and loose across the deck from
 *  their return jacks into each wedge's own rear input — VOX 2's over the
 *  deck between wedges 1 and 2, VOX 3's across the stair landing. */
const J_MON = VOX_XS.map((x) => WEDGE_JACK(x));
const AS_FOUND_MON = [
  `M${SEND_X[0]} ${JACK_OUT} V161 C45 170 70 173.5 92 173 C110 172.6 ${J_MON[0].x} 178 ${J_MON[0].x} ${J_MON[0].y}`,
  `M${SEND_X[1]} ${JACK_OUT} V165 C41.4 175 60 177 90 177 C120 177 136 176 146 164 C154 154 178 148 184 158 C188 166 186 176 196 176 C203 176 ${J_MON[1].x} 174 ${J_MON[1].x} ${J_MON[1].y}`,
  `M${SEND_X[2]} ${JACK_OUT} V168 C37.8 178 60 180.5 100 180.5 C170 180.5 200 179 220 172 C240 164 256 162 266 170 C272 175 ${J_MON[2].x} 179 ${J_MON[2].x} ${J_MON[2].y}`,
] as const;
const MON3_BADGE = { x: 160, y: 166 } as const;

/** A numbered hazard badge on the plot, matching the numbered call below —
 *  amber while the hazard stands, a green tick once it is dressed. */
function HazardBadge({ x, y, n, fixed }: { x: number; y: number; n: number; fixed: boolean }) {
  const tint = fixed ? colors.green : colors.amber;
  return (
    <G>
      <Circle cx={x} cy={y} r={6.4} fill="#16161a" stroke={tint} strokeWidth={1.3} />
      <Callout x={x} y={y + 3.4} text={fixed ? '✓' : String(n)} size={9.6} color={tint} bg={null} />
    </G>
  );
}

function StagePlan({ w, routeFixed, slackFixed, monFixed }: { w: number; routeFixed: boolean; slackFixed: boolean; monFixed: boolean }) {
  const h = Math.round(w * (205 / 360));
  const mic = CI_CLASS_TINTS.analog;
  const spk = CI_CLASS_TINTS.speaker;
  const pwr = CI_CLASS_TINTS.power;
  const grey = '#6b6e76';
  const edgeX = PLOT.x + PLOT.w;
  const drumCx = RISER.x + RISER.w / 2;
  const drumCy = RISER.y + 26;
  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 205"
      accessibilityLabel={`Stage plot, training visualization: a 10 by 5 metre deck, audience at the bottom. Drum riser upstage centre with a drum sub-snake, keys stage left, guitar amp and player stage right, three singers facing the audience, each with a boom stand just downstage of them and a wedge further downstage aimed back at them, the downstage playing area, a stair at the downstage lip, the snake head downstage right with its trunk to FOH and a split to monitor world in the stage-left wing. Numbered badges mark the three hazards. Mic lines ${routeFixed ? 'taped up the stage-right edge and along the riser face, clear of the playing area' : 'webbed straight across the playing area'}; spare mic cable ${slackFixed ? 'coiled at the snake head' : 'in loose loops on deck'}; monitor feeds ${monFixed ? 'taped along the downstage lip behind the wedges, with a low-profile cover and glow tape where the stair meets the deck' : 'bare across the deck'}.`}
    >
      <Rect x={0} y={0} width={360} height={205} rx={10} fill="#0c0c10" />
      <StageDeck x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} grid={PLOT.m} />
      {/* plot conventions: dimensions, stage directions, the audience */}
      <DimLine x1={PLOT.x} y1={12} x2={edgeX} y2={12} text="10 m × 5 m" />
      <PlanLabel x={238} y={41} text="UPSTAGE" size={9.6} />
      <PlanLabel x={51} y={112} text="SR" anchor="start" size={9.6} />
      <PlanLabel x={edgeX - 6} y={126} text="SL" anchor="end" size={9.6} />
      <Rect x={PLOT.x} y={LIP_Y} width={PLOT.w} height={3} fill="#3a3326" />
      <PlanLabel x={150} y={198} text="DOWNSTAGE · AUDIENCE" size={9.6} />
      {/* the stage stair with handrails: the one place performers step on and
          off the deck — feet cross the monitor feed right here */}
      <Rect x={STAIR.x} y={LIP_Y + 3} width={STAIR.w} height={12} rx={0.8} fill="#2a241d" stroke="#0d0b09" strokeWidth={0.6} />
      <Path d={`M${STAIR.x} ${LIP_Y + 7} h${STAIR.w} M${STAIR.x} ${LIP_Y + 11} h${STAIR.w}`} stroke="#171310" strokeWidth={0.6} />
      <Path d={`M${STAIR.x - 1} ${LIP_Y + 2} V${LIP_Y + 16} M${STAIR.x + STAIR.w + 1} ${LIP_Y + 2} V${LIP_Y + 16}`} stroke="#9aa0a8" strokeWidth={1.1} strokeLinecap="round" />
      <PlanLabel x={264} y={LIP_Y + 13} text="STAIR" anchor="start" size={9.6} />
      {/* the way performers come up the stair into the playing area */}
      <Path d={`M${STAIR.x + STAIR.w / 2} ${LIP_Y + 10} V${LANE.y + LANE.h + 2}`} stroke="#b9bdc6" strokeWidth={0.8} strokeDasharray="2 2.4" opacity={0.7} />
      <Path d={`M${STAIR.x + STAIR.w / 2 - 3} ${LANE.y + LANE.h + 6} l3 -4 l3 4`} stroke="#b9bdc6" strokeWidth={0.8} fill="none" opacity={0.7} />

      {/* upstage furniture: the riser (2.0 × 1.6 m, step on the SL end) with
          the kit facing the house and the drum sub-snake at its front
          corner; the keys with the player upstage of them; the amp */}
      <RiserTop x={RISER.x} y={RISER.y} w={RISER.w} h={RISER.h} step="right" />
      <G transform={`rotate(180 ${drumCx} ${drumCy})`}>
        <DrumKitTop x={drumCx} y={drumCy} />
      </G>
      <StageBoxTop x={RISER.x + 2} y={RISER.y + 4} />
      {/* Label on clear deck just right of the riser's step (clash sweep
          2026-10-10: it used to sit ON the kit — over the kick and floor toms). */}
      <PlanLabel x={RISER.x + RISER.w + 6} y={70} text="DRUMS" anchor="start" size={9.6} />
      <G transform={`rotate(180 290 52)`}>
        <KeysTop x={262} y={44} w={56} h={16} />
      </G>
      {/* Head centre ≈ 0.3 m upstage of the keyboard's player edge (y 44) —
          it used to overlap the instrument (clash sweep 2026-10-10). */}
      <PerformerTop x={290} y={35} m={PLOT.m} />
      <DiBoxTop x={323} y={56} />
      <PlanLabel x={290} y={72} text="KEYS · DI" size={9.6} />
      <GtrAmpTop x={40} y={30} />
      <MicStandTop x={51} y={50} boom={0} reach={5} />
      <PerformerTop x={86} y={60} m={PLOT.m} />
      <PlanLabel x={66} y={39} text="GTR AMP" anchor="start" size={9.6} />

      {/* power: quad boxes fed from the wings, crossing the audio at 90° */}
      <Path d={`M${PLOT.x} 72 H62`} stroke={pwr} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={62} y={69.2} width={7} height={5.6} rx={0.8} fill="#2a2c31" stroke={pwr} strokeWidth={0.6} />
      <Path d={`M${edgeX + 8} 80 H332`} stroke={pwr} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={325} y={77.2} width={7} height={5.6} rx={0.8} fill="#2a2c31" stroke={pwr} strokeWidth={0.6} />

      {/* snake head DSR: its trunk leaves off the SR side and runs down the
          wing to FOH — never over the downstage lip into the audience. Drawn
          under the cables so every line visibly lands on its own jack. */}
      <JacketPath d={`M${SNAKE.x} ${SNAKE.y + 10} H10 V200`} color="#5d6068" width={4.2} />
      <SnakeHeadTop x={SNAKE.x} y={SNAKE.y} />

      {/* already dressed before you arrived: the split to monitor world, the
          keys DI and the amp mic — up the SR edge and along the upstage edge
          (behind the riser), taped; the drum multicore off the riser face.
          One lane each, LANE_GAP apart, each onto its own input jack. */}
      <JacketPath d={`M${SNAKE.x + 1.6} ${SNAKE.y + 1.6} H${EDGE.split} V${TOP_Y.split} H333.4 V${SPLIT_MON_Y} H${MON.x + 1}`} color={grey} width={2.6} shadow={false} />
      {/* the monitor returns, MON → snake head, the outermost lane */}
      <JacketPath d={`M${MON.x + 1} ${RET.monY} H${RET.slX} V${RET.topY} H${RET.x} V${RET.snakeY} H${SNAKE.x + 1.6}`} color={grey} width={2.6} shadow={false} />
      {/* each lands on its own connector: split and returns at MON's input
          panel, returns on the snake head's left face */}
      {[RET.monY, SPLIT_MON_Y].map((y) => (
        <Rect key={`mc${y}`} x={MON.x - 0.4} y={y - 1.5} width={2.8} height={3} rx={0.5} fill="#0d0e11" stroke="#8d9199" strokeWidth={0.35} />
      ))}
      <Rect x={SNAKE.x - 1.2} y={RET.snakeY - 1.5} width={2.8} height={3} rx={0.5} fill="#0d0e11" stroke="#8d9199" strokeWidth={0.35} />
      {[96, 120, 140].map((y) => (
        <TapeStrip key={`slt${y}`} x={(333.4 + RET.slX) / 2} y={y} angle={0} len={8} />
      ))}
      <JacketPath d={`M323 53 V${TOP_Y.keys} H${EDGE.keys} V${JACK_IN}`} color={mic} width={2.2} shadow={false} />
      <JacketPath d={`M51 55 V58 H${EDGE.amp} V${JACK_IN}`} color={mic} width={2.2} shadow={false} />
      <JacketPath d={`M${RISER.x + 2} ${RISER.y + 10} H${RISER.x - 4} V${DRUM_Y} H${EDGE.drum} V${JACK_IN}`} color={grey} width={2.4} shadow={false} />
      {/* tape across the whole bundle, wherever its lanes run together */}
      {[60, 110, 160, 210, 260, 310].map((x) => (
        <TapeStrip key={`ut${x}`} x={x} y={(RET.topY + TOP_Y.keys) / 2} len={11.6} />
      ))}
      <TapeStrip x={(RET.x + EDGE.keys) / 2} y={40} angle={0} len={11.6} />
      <TapeStrip x={(RET.x + EDGE.amp) / 2} y={64} angle={0} len={15.1} />
      {[112, 136].map((y) => (
        <TapeStrip key={`st${y}`} x={(RET.x + EDGE.drum) / 2} y={y} angle={0} len={18.6} />
      ))}
      {[52, 92, 132].map((x) => (
        <TapeStrip key={`dt${x}`} x={x} y={DRUM_Y} len={5.5} />
      ))}

      {/* the vocal line: singers facing the house, boom stands just downstage
          of them (a leg under each boom), the playing area, the wedges */}
      <Rect x={LANE.x} y={LANE.y} width={LANE.w} height={LANE.h} fill="rgba(255,255,255,0.02)" stroke="#8d9199" strokeWidth={0.8} strokeDasharray="4 3" />
      <PlanLabel x={LANE.x + 4} y={LANE.y + 15} text="PLAYING AREA" anchor="start" size={9.6} />
      {VOX_XS.map((x, i) => (
        <G key={x}>
          <MicStandTop x={x} y={VOX_Y} boom={0} reach={7} />
          <PerformerTop x={x} y={SINGER_Y} m={PLOT.m} />
          <PlanLabel x={x - 11} y={SINGER_Y + 3.4} text={`VOX ${i + 1}`} anchor="end" size={9.6} />
        </G>
      ))}
      {VOX_XS.map((x) => (
        <WedgeTop key={`wg${x}`} x={x} y={WEDGE_Y} />
      ))}
      <PlanLabel x={296} y={WEDGE_Y + 4} text="WEDGES" anchor="start" size={9.6} />

      {/* label above the monitor-send lanes, clear of wedge 1 */}
      <PlanLabel x={50} y={166.5} text="SNAKE HEAD" anchor="start" size={9.6} />
      <PlanLabel x={14} y={201} text="TO FOH" anchor="start" size={9.6} />
      <ConsoleTop x={MON.x} y={MON.y} w={18} h={14} />
      <PlanLabel x={MON.x + 9} y={MON.y - 4} text="MON" size={9.6} />

      {/* ① MIC LINES — the web across the playing area retracts; the edge
          route installs: up the SR edge in the bundle, along the riser face,
          taped, and straight down BESIDE each singer (0.6 m clear), square
          onto the deck and in along the stand's leg. As
          found and dressed, each line is plugged into the same input jack. */}
      {AS_FOUND_VOX.map((d, i) => (
        <SwapPath key={`bv${i}`} d={d} len={[160, 270, 430][i]} tint={mic} width={2.2} mode="bad" fixed={routeFixed} intro={120 + i * 80} />
      ))}
      {VOX_XS.map((x, i) => (
        <SwapPath
          key={`gv${x}`}
          d={`M${EDGE.vox[i]} ${JACK_IN} V${FACE_Y[i]} H${x + 20} V${VOX_Y + 4} H${x + 6.9} L${x + 1.2} ${VOX_Y + 0.7}`}
          len={[240, 330, 420][i]}
          tint={mic}
          width={2.2}
          mode="good"
          fixed={routeFixed}
          delay={i * 90}
        />
      ))}
      <SwapGroup show={routeFixed} delay={260}>
        {/* tape across the vocal lanes on the SR edge and the riser face —
            only as wide as the lanes still running together at that point */}
        {[112, 136].map((y) => (
          <TapeStrip key={`sv${y}`} x={EDGE.vox[1]} y={y} angle={0} len={11} />
        ))}
        {[
          [52, 3],
          [92, 3],
          [132, 3],
          [172, 2],
          [212, 2],
          [252, 1],
          [292, 1],
        ].map(([x, n]) => (
          <TapeStrip key={`ft${x}`} x={x} y={(FACE_Y[3 - n] + FACE_Y[2]) / 2} len={n * LANE_GAP + 1.8} />
        ))}
        {VOX_XS.map((x) => (
          <TapeStrip key={`dt${x}`} x={x + 20} y={104} angle={0} len={7} />
        ))}
        {VOX_XS.map((x) => (
          <TapeStrip key={`bt${x}`} x={x + 13} y={VOX_Y + 4} len={6} />
        ))}
      </SwapGroup>

      {/* ② SLACK — one spare line lying in loose loops on deck (each loop
          is that one cable's own loop) pulls away; the spare length lands
          coiled at the snake head, its tail on its own return jack */}
      <SwapPath d={SPARE_LOOPS} len={180} tint={mic} width={2} mode="bad" fixed={slackFixed} intro={60} />
      <SwapCircle cx={COIL.cx} cy={COIL.cy} r={COIL.r[0]} tint={mic} width={2} show={slackFixed} />
      <SwapCircle cx={COIL.cx} cy={COIL.cy} r={COIL.r[1]} tint={mic} width={2} show={slackFixed} delay={80} />
      <SwapPath d={`M${COIL.cx} ${JACK_OUT} V${COIL.cy - COIL.r[1]}`} len={6} tint={mic} width={2} mode="good" fixed={slackFixed} delay={120} />

      {/* ③ MONITOR FEEDS — from the snake head's own return jacks (SR, the
          same side as the inputs). As found they lie bare and loose across
          the deck and the stair landing; dressed, they drop out of the box
          and run as three taped lanes along the lip behind the wedges, each
          peeling up onto its own wedge, the stair crossing under a
          low-profile cover with glow tape */}
      {AS_FOUND_MON.map((d, i) => (
        <SwapPath key={`bm${i}`} d={d} len={[140, 300, 360][i]} tint={spk} width={2.2} mode="bad" fixed={monFixed} intro={300 + i * 70} />
      ))}
      {VOX_XS.map((x, i) => {
        const j = WEDGE_JACK(x);
        return (
          <SwapPath
            key={`gm${x}`}
            d={`M${SEND_X[i]} ${JACK_OUT} V${SEND_Y[i]} H${j.x} V${j.y}`}
            len={[130, 220, 320][i]}
            tint={spk}
            width={2.2}
            mode="good"
            fixed={monFixed}
            delay={i * 80}
          />
        );
      })}
      <SwapGroup show={monFixed} delay={220}>
        {[
          [66, 3],
          [102, 3],
          [138, 2],
          [174, 2],
          [210, 1],
          [282, 1],
        ].map(([x, n]) => (
          <TapeStrip key={`mu${x}`} x={x} y={(SEND_Y[3 - n] + SEND_Y[2]) / 2} len={n * LANE_GAP + 1.8} />
        ))}
        {/* low-profile drop-over cover: flat, bevelled both edges, all on the
            deck — no hump at the head of a stair */}
        <Rect x={STAIR.x - 4} y={SEND_Y[2] - 4} width={STAIR.w + 8} height={8} rx={1} fill="#1b1c20" stroke="#050506" strokeWidth={0.5} />
        <Rect x={STAIR.x - 3} y={SEND_Y[2] - 2.4} width={STAIR.w + 6} height={4.8} rx={0.8} fill="#e3b73a" stroke="#6b5520" strokeWidth={0.4} />
        {/* glow tape on the lip and the stair nosing */}
        <Path d={`M${STAIR.x - 6} ${LIP_Y - 0.8} H${STAIR.x + STAIR.w + 6} M${STAIR.x} ${LIP_Y + 6.8} H${STAIR.x + STAIR.w}`} stroke="#d9f7c8" strokeWidth={1.1} strokeDasharray="3 2" />
      </SwapGroup>

      {/* the numbered hazards, matching the numbered calls below */}
      <HazardBadge x={150} y={128} n={1} fixed={routeFixed} />
      <HazardBadge x={70} y={127} n={2} fixed={slackFixed} />
      <HazardBadge x={MON3_BADGE.x} y={MON3_BADGE.y} n={3} fixed={monFixed} />

      {/* one performer crosses the web — the conflict, shown once */}
      <TrafficPass x1={300} y1={146} x2={100} y2={148} run={!routeFixed} delay={780} duration={1900} crossAt={0.36} />
    </Svg>
  );
}

/* ── route drawing shared by the FOH + backstage plans ──────────────────── */
type RoutePhase = 'idle' | 'install' | 'dim';

/**
 * A route that installs itself. On arrival each route draws in on its stagger
 * beat; when the learner picks, the chosen route RE-INSTALLS at full weight
 * and the rejected ones fade back. Dashed routes (overhead, above the floor)
 * install as a solid run that dissolves into their dashed identity, so the
 * geometry never lies about where the cable lives.
 */
function RoutePath({
  d,
  len,
  tint,
  width,
  phase,
  index,
  dashed = false,
}: {
  d: string;
  len: number;
  tint: string;
  width: number;
  phase: RoutePhase;
  index: number;
  dashed?: boolean;
}) {
  const m = useCiMotion();
  const p = useSharedValue(0);
  const o = useSharedValue(1);
  const first = useRef(true);
  const drawMs = Math.min(CI_MOTION.draw, 260 + len * 1.5);

  useEffect(() => {
    cancelAnimation(p);
    cancelAnimation(o);
    if (m.reduce) {
      p.value = 1;
      o.value = phase === 'dim' ? 0.22 : 1;
      first.current = false;
      return;
    }
    if (first.current) {
      first.current = false;
      p.value = 0;
      p.value = withDelay(160 + index * 170, withTiming(1, { duration: drawMs, easing: CI_EASE.out }));
      o.value = 1;
      return;
    }
    if (phase === 'install') {
      p.value = 0;
      p.value = withTiming(1, { duration: drawMs, easing: CI_EASE.out });
    } else {
      p.value = withTiming(1, { duration: CI_MOTION.quick, easing: CI_EASE.out });
    }
    o.value = withTiming(phase === 'dim' ? 0.22 : 1, { duration: CI_MOTION.base, easing: CI_EASE.inOut });
    return () => {
      cancelAnimation(p);
      cancelAnimation(o);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, m.reduce]);

  const installer = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - p.value),
    strokeWidth: width * (phase === 'install' ? 1.22 : 1),
    opacity: dashed ? Math.max(0, 1 - Math.max(0, (p.value - 0.82) / 0.18)) * o.value : o.value,
  }));
  const settled = useAnimatedProps(() => ({
    opacity: Math.min(1, Math.max(0, (p.value - 0.78) / 0.22)) * o.value,
    strokeWidth: width * (phase === 'install' ? 1.22 : 1),
  }));

  const installerBody = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - p.value),
    strokeWidth: width * 0.74 * (phase === 'install' ? 1.22 : 1),
    opacity: dashed ? Math.max(0, 1 - Math.max(0, (p.value - 0.82) / 0.18)) * o.value : o.value,
  }));
  return (
    <G>
      <APath
        d={d}
        stroke={shade(tint, 0.66)}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len}
        opacity={0}
        animatedProps={installer}
      />
      <APath
        d={d}
        stroke={shade(tint, 0.15)}
        strokeWidth={width * 0.74}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len}
        opacity={0}
        animatedProps={installerBody}
      />
      {dashed ? (
        <APath d={d} stroke={tint} strokeWidth={width} fill="none" strokeDasharray="7,5" opacity={0} animatedProps={settled} />
      ) : null}
    </G>
  );
}

const phaseFor = (i: number, pick: number | null): RoutePhase => (pick == null ? 'idle' : pick === i ? 'install' : 'dim');

/* ── FOH venue plan (B) ─────────────────────────────────────────────────── */
function FohPlan({ w, pick }: { w: number; pick: number | null }) {
  const h = Math.round(w * (210 / 360));
  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 210"
      accessibilityLabel="Venue plan, training visualization: stage at top, seated audience with a center aisle, perimeter walls with a service door (not an exit), FOH riser at the bottom, the main exits on the back wall clear of every route. Route A runs down the center aisle; route B follows the perimeter with one protected door crossing; route C hops overhead on rated rigging points."
    >
      <Rect x={0} y={0} width={360} height={210} rx={10} fill="#0c0c10" />
      <Rect x={6} y={6} width={348} height={198} rx={8} fill="#131417" stroke="#2c2c33" strokeWidth={1} />
      {/* stage + FOH riser with the desk */}
      <StageDeck x={60} y={12} w={240} h={36} />
      <PlanLabel x={180} y={34} text="STAGE" />
      <Rect x={150} y={168} width={60} height={30} rx={1.6} fill="#1c1d21" stroke="#3a3c42" strokeWidth={0.8} />
      <ConsoleTop x={158} y={172} w={44} h={12} />
      <PlanLabel x={180} y={196} text="FOH" size={9.5} />
      {/* seating rows either side of the center aisle */}
      {[66, 78, 90, 102, 114, 126, 138, 150].map((y) => (
        <G key={`row${y}`}>
          <SeatRow x0={62} x1={162} y={y} />
          <SeatRow x0={200} x1={300} y={y} />
        </G>
      ))}
      <PlanLabel x={174} y={60} text="AISLE" anchor="end" />
      <PlanLabel x={186} y={60} text="(EGRESS)" anchor="start" />
      {/* service door on the left wall */}
      <Rect x={3} y={108} width={6} height={22} fill="#3a3c42" />
      <PlanLabel x={44} y={98} text="SVC" />
      <PlanLabel x={44} y={110} text="DOOR" />
      {/* main doors (the exits) on the bottom wall, both clear of every
          route — no run crosses the rear cross-aisle to an exit */}
      <Rect x={222} y={200} width={26} height={5} fill="#3a3c42" />
      <Rect x={276} y={200} width={26} height={5} fill="#3a3c42" />
      {/* ROUTE A — center aisle under ramp (amber) */}
      <RoutePath d="M180 48 V170" len={130} tint={ROUTE_TINTS[0]} width={2.8} phase={phaseFor(0, pick)} index={0} />
      <RampTop x={172} y={60} w={16} h={106} vertical />
      {/* ROUTE B — perimeter with one protected door crossing (teal) */}
      <RoutePath d="M66 48 H26 V178 H150" len={300} tint={ROUTE_TINTS[1]} width={2.8} phase={phaseFor(1, pick)} index={1} />
      <RampTop x={20} y={104} w={12} h={30} vertical />
      {/* ROUTE C — overhead hop on rated points (purple, dashed = above the floor) */}
      <RoutePath d="M294 48 C334 72 338 132 214 174" len={200} tint={ROUTE_TINTS[2]} width={2.6} phase={phaseFor(2, pick)} index={2} dashed />
      <RigPointTop x={322} y={78} color={ROUTE_TINTS[2]} />
      <RigPointTop x={314} y={140} color={ROUTE_TINTS[2]} />
      <PlanLabel x={308} y={176} text="OVERHEAD" />
      <PlanLabel x={308} y={188} text="RATED POINTS" />
      {/* audience crosses the aisle run — once, when the verdicts land */}
      <TrafficPass x1={146} y1={120} x2={216} y2={120} run={pick != null} delay={820} duration={1700} crossAt={0.486} />
      {/* letters */}
      <RouteLetter x={162} y={88} i={0} />
      <RouteLetter x={40} y={64} i={1} />
      <RouteLetter x={300} y={64} i={2} />
    </Svg>
  );
}

/* ── backstage plan (C) ─────────────────────────────────────────────────── */
function BackstagePlan({ w, pick }: { w: number; pick: number | null }) {
  const h = Math.round(w * (210 / 360));
  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 210"
      accessibilityLabel="Backstage plan, training visualization: dock door at top, the load-in and forklift path running down to the stage, road cases along the right wall, a swinging door on the left wall, distro at left, monitor world at bottom right. Route A crosses the roll path under a mat; route B crosses once at a marked, vehicle-rated protector; route C takes the long perimeter behind the cases."
    >
      <Rect x={0} y={0} width={360} height={210} rx={10} fill="#0c0c10" />
      <Rect x={6} y={6} width={348} height={198} rx={8} fill="#1a1a1c" stroke="#2c2c33" strokeWidth={1} />
      {/* dock door + the load-in lane, hazard-striped at both edges */}
      <DockDoor x={46} w={56} />
      <Path d="M52 10 L100 10 L268 204 L200 204 z" fill="#202024" />
      <HazardEdge x1={52} y1={10} x2={200} y2={204} />
      <HazardEdge x1={100} y1={10} x2={268} y2={204} />
      <PlanLabel x={76} y={23} text="DOCK" />
      <PlanLabel x={160} y={96} text="LOAD-IN" />
      <PlanLabel x={160} y={109} text="FORKLIFT PATH" />
      <G transform="rotate(49 150 57)">
        <ForkliftTop x={136} y={51} />
      </G>
      {/* road cases, right wall */}
      {[36, 66, 96].map((y) => (
        <RoadCaseTop key={`case${y}`} x={304} y={y} w={42} h={26} />
      ))}
      <PlanLabel x={325} y={133} text="CASES" />
      {/* door swing on the left wall */}
      <Line x1={8} y1={150} x2={38} y2={174} stroke="#9aa0a8" strokeWidth={1.4} />
      <Path d="M8 188 A38 38 0 0 0 38 174" fill="none" stroke="#6d7179" strokeWidth={0.8} strokeDasharray="3 3" />
      <PlanLabel x={10} y={201} text="DOOR SWING" anchor="start" />
      {/* distro + monitor world */}
      <DistroTop x={10} y={86} />
      <PlanLabel x={26} y={82} text="DISTRO" size={9.5} />
      <ConsoleTop x={300} y={170} w={44} h={24} />
      <PlanLabel x={322} y={164} text="MON WORLD" size={9.5} />
      {/* Each route lands on its own point of the monitor-world desk's left
          face (C 174, A 179, B 184) so no two routes ever share a stroke
          (owner 2026-10-10: every run traceable on its own). */}
      {/* ROUTE A — straight across under a mat (amber) */}
      <RoutePath d="M48 100 L300 179" len={280} tint={ROUTE_TINTS[0]} width={2.8} phase={phaseFor(0, pick)} index={0} />
      {/* a rubber mat thrown over the run — not a protector */}
      <Rect x={172} y={134} width={30} height={12} rx={1} fill="#141518" stroke="#3a3c42" strokeWidth={0.6} />
      <Path d={[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `M${174 + i * 3.2} 136 l1.6 1.6 l-1.6 1.6 l1.6 1.6 l-1.6 1.6 l1.6 1.6`).join('')} stroke="#26282d" strokeWidth={0.5} fill="none" />
      <PlanLabel x={187} y={130} text="MAT" />
      {/* ROUTE B — one marked, vehicle-rated crossing (teal) */}
      <RoutePath d="M48 106 V184 H300" len={340} tint={ROUTE_TINTS[1]} width={2.8} phase={phaseFor(1, pick)} index={1} />
      {/* the protector spans the WHOLE roll lane (its edges cross route B (y 184) at
          x ≈ 185 and 251), high-vis marked both sides */}
      <RampTop x={174} y={170} w={78} h={16} />
      <Line x1={172} y1={168} x2={172} y2={190} stroke={CI_CLASS_TINTS.speaker} strokeWidth={1.4} strokeDasharray="3,3" />
      <Line x1={254} y1={168} x2={254} y2={190} stroke={CI_CLASS_TINTS.speaker} strokeWidth={1.4} strokeDasharray="3,3" />
      <PlanLabel x={224} y={201} text="RATED + MARKED" />
      {/* ROUTE C — long perimeter behind the cases (purple) */}
      <RoutePath d="M48 94 V30 H292 V174 H300" len={480} tint={ROUTE_TINTS[2]} width={2.6} phase={phaseFor(2, pick)} index={2} />
      {/* a case rolls the load-in path once — and finds the mat crossing */}
      <TrafficPass x1={76} y1={10} x2={234} y2={204} run={pick != null} delay={900} duration={2000} cart crossAt={0.684} />
      {/* letters */}
      <RouteLetter x={120} y={126} i={0} />
      <RouteLetter x={62} y={150} i={1} />
      <RouteLetter x={170} y={42} i={2} />
    </Svg>
  );
}

function RouteLetter({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={9} fill="#17171c" stroke={ROUTE_TINTS[i]} strokeWidth={1.6} />
      <Callout x={x} y={y + 3.6} text={LETTERS[i]} size={10.5} color={ROUTE_TINTS[i]} bg={null} />
    </G>
  );
}

/* ── per-dimension mini bars for a route verdict ────────────────────────── */
/** One dimension: the bar FILLS to its value; the picked card's number ticks. */
function DimRow({ dim, v, shown, tint }: { dim: (typeof CI_DIMS)[number]; v: number; shown: number; tint: string }) {
  const m = useCiMotion();
  const t = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withTiming(1, { duration: CI_MOTION.reveal, easing: CI_EASE.out });
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, m.reduce]);
  const fill = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, v * t.value))}%` }));
  return (
    <View style={s.miniRow} accessibilityLabel={`${CI_DIM_META[dim].label}: ${v} out of 100`}>
      <Text style={s.miniLabel} numberOfLines={1}>{CI_DIM_META[dim].label}</Text>
      <View style={s.miniTrack}>
        <Animated.View style={[s.miniFill, { backgroundColor: tint }, fill]} />
      </View>
      <Text style={s.miniVal}>{shown}</Text>
    </View>
  );
}

function CountingDimRow(props: { dim: (typeof CI_DIMS)[number]; v: number; tint: string }) {
  const shown = useCountUp(props.v, CI_MOTION.reveal);
  return <DimRow {...props} shown={shown} />;
}

function DimMiniBars({ dims, count }: { dims: Partial<Record<(typeof CI_DIMS)[number], number>>; count?: boolean }) {
  return (
    <View style={{ gap: 4 }}>
      {CI_DIMS.map((d, i) => {
        const v = dims[d];
        if (v == null) return null;
        const tint = v >= 80 ? colors.green : v >= 55 ? colors.amber : '#ff9b8f';
        return (
          <Stagger key={d} index={i} from={6}>
            {count ? <CountingDimRow dim={d} v={v} tint={tint} /> : <DimRow dim={d} v={v} shown={v} tint={tint} />}
          </Stagger>
        );
      })}
    </View>
  );
}

/** Dedupe a route's flags to one feedback block per rule. */
function dedupeFlags(flags: CiRouteFlag[]): CiRouteFlag[] {
  const seen = new Set<string>();
  const out: CiRouteFlag[] = [];
  for (const f of flags) {
    if (seen.has(f.ruleId)) continue;
    seen.add(f.ruleId);
    out.push(f);
  }
  return out;
}

/* ── route scenario block (used by B and C) ─────────────────────────────── */
function RouteBlock({
  scenario,
  width,
  title,
  plan,
  pick,
  onPick,
  openSources,
  keyPoint,
}: {
  scenario: CiRouteScenario;
  width: number;
  /** Full-screen bar title (owner 2026-09-25 legibility pass). */
  title: string;
  plan: (w: number, pickIdx: number | null) => ReactNode;
  pick: string | null;
  onPick: (id: string) => void;
  openSources: (ids: string[]) => void;
  keyPoint?: { head: string; body: string };
}) {
  const ranked = useMemo(() => rankRoutes(scenario.options), [scenario]);
  const chosen = pick ? scenario.options.find((o) => o.id === pick) ?? null : null;
  const revealed = pick != null;
  const letterOf = (id: string) => LETTERS[scenario.options.findIndex((o) => o.id === id)] ?? '?';
  const tintOf = (id: string) => ROUTE_TINTS[scenario.options.findIndex((o) => o.id === id)] ?? '#6f7378';
  const pickIdx = pick ? scenario.options.findIndex((o) => o.id === pick) : -1;
  /* The route pickers are THE control for this drawing: the same cards dock
     under the plan in full screen so the pick can be made while enlarged
     (owner 2026-09-25). Once picked there is nothing left to operate. */
  const pickers = !revealed ? (
    <View style={{ gap: 8 }}>
      {scenario.options.map((o, i) => (
        <Stagger key={o.id} index={i}>
          <Pressable
            style={s.routeCard}
            onPress={() => onPick(o.id)}
            accessibilityRole="button"
            accessibilityLabel={`Route ${LETTERS[i]}: ${o.name}. ${o.path}`}
          >
            <View style={[s.swatch, { backgroundColor: ROUTE_TINTS[i] }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.routeName}>{`ROUTE ${LETTERS[i]} — ${o.name.toUpperCase()}`}</Text>
              <Text style={s.routePath}>{o.path}</Text>
            </View>
          </Pressable>
        </Stagger>
      ))}
    </View>
  ) : null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.lead}>{scenario.brief}</Text>
      <ExpandableFigure
        width={width}
        aspect={360 / 210}
        title={title}
        badge="Training visualization — route colors identify the options, not cable classes."
        render={(w) => plan(w, pickIdx >= 0 ? pickIdx : null)}
        controls={pickers ? <View style={{ paddingHorizontal: 12 }}>{pickers}</View> : undefined}
      />
      <Text style={s.caption}>Route colors identify the options — not cable classes.</Text>
      {!revealed ? (
        pickers
      ) : (
        <View style={{ gap: 10 }}>
          {ranked.map(({ option, verdict, overall, safetyReject }, i) => {
            const isPick = option.id === pick;
            return (
              <Appear key={option.id} delay={i * 90}>
                <View style={[s.verdictCard, isPick && s.verdictCardPicked]}>
                  <View style={s.verdictHead}>
                    <View style={[s.swatch, { backgroundColor: tintOf(option.id) }]} />
                    <Text style={s.routeName} numberOfLines={2}>{`${letterOf(option.id)} — ${option.name.toUpperCase()}`}</Text>
                    <View style={{ flex: 1 }} />
                    {i === 0 && !safetyReject ? <Text style={s.badgeBest}>BEST CALL</Text> : null}
                    {isPick ? <Text style={s.badgePick}>YOUR PICK</Text> : null}
                  </View>
                  {/* A VERDICT, NOT A SCORE. `rankRoutes` has always returned
                      `safetyReject` and RouteScene has always rendered it — this
                      scene destructured it away, so a route down the aisle the
                      drawing itself labels AISLE (EGRESS) printed only
                      "OVERALL 75", which reads as a pass, one stage after the
                      learner watched a comparable route get a red reject chip.
                      routeEval's own docstring documents this exact bug as
                      already fixed. */}
                  {safetyReject ? <Text style={s.badgeReject}>{'✕ REJECTED — SAFETY'}</Text> : null}
                  <Text style={s.overallLine}>{`OVERALL ${overall}`}</Text>
                  <DimMiniBars dims={verdict.dims} count={isPick} />
                  <View style={{ gap: 3 }}>
                    {verdict.overallNotes.map((n) => (
                      <Text key={n} style={s.noteLine}>{`• ${n}`}</Text>
                    ))}
                  </View>
                </View>
              </Appear>
            );
          })}
          {chosen
            ? dedupeFlags(chosen.flags).map((f, i) => (
                <Appear key={f.ruleId} delay={320 + i * 90}>
                  <RuleFeedback ruleId={f.ruleId} verdict={f.positive ? 'good' : 'bad'} short={f.note} openSources={openSources} />
                </Appear>
              ))
            : null}
          {keyPoint ? (
            <Appear delay={480}>
              <View style={s.keyCard}>
                <Text style={s.keyHead}>{keyPoint.head}</Text>
                <Text style={s.keyBody}>{keyPoint.body}</Text>
              </View>
            </Appear>
          ) : null}
        </View>
      )}
    </View>
  );
}

/* ── (D) over-under coil art ────────────────────────────────────────────── */
const COIL_CY = 76;
const COIL_RX = 30;
const COIL_RY = 42;
const COIL_STEP = 17;
const COIL_X0 = 120;
const COIL_CENTER = COIL_X0 + 2.5 * COIL_STEP;
/** Over-estimate of a loop's arc length (Ramanujan ≈ 228 at rest). */
const COIL_DASH = 262;

function rx2(cx: number, x: number, y: number, c: number, sn: number) {
  'worklet';
  return cx + x * c - y * sn;
}
function ry2(cy: number, x: number, y: number, c: number, sn: number) {
  'worklet';
  return cy + x * sn + y * c;
}

/** A tilted ellipse as four cubic arcs — so the lay angle can actually move. */
function loopD(cx: number, cy: number, rx: number, ry: number, rot: number) {
  'worklet';
  const K = 0.5522847498307936;
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const ox = rx * K;
  const oy = ry * K;
  return (
    `M${rx2(cx, rx, 0, c, sn)} ${ry2(cy, rx, 0, c, sn)}` +
    ` C${rx2(cx, rx, oy, c, sn)} ${ry2(cy, rx, oy, c, sn)} ${rx2(cx, ox, ry, c, sn)} ${ry2(cy, ox, ry, c, sn)} ${rx2(cx, 0, ry, c, sn)} ${ry2(cy, 0, ry, c, sn)}` +
    ` C${rx2(cx, -ox, ry, c, sn)} ${ry2(cy, -ox, ry, c, sn)} ${rx2(cx, -rx, oy, c, sn)} ${ry2(cy, -rx, oy, c, sn)} ${rx2(cx, -rx, 0, c, sn)} ${ry2(cy, -rx, 0, c, sn)}` +
    ` C${rx2(cx, -rx, -oy, c, sn)} ${ry2(cy, -rx, -oy, c, sn)} ${rx2(cx, -ox, -ry, c, sn)} ${ry2(cy, -ox, -ry, c, sn)} ${rx2(cx, 0, -ry, c, sn)} ${ry2(cy, 0, -ry, c, sn)}` +
    ` C${rx2(cx, ox, -ry, c, sn)} ${ry2(cy, ox, -ry, c, sn)} ${rx2(cx, rx, -oy, c, sn)} ${ry2(cy, rx, -oy, c, sn)} ${rx2(cx, rx, 0, c, sn)} ${ry2(cy, rx, 0, c, sn)}`
  );
}

/** The lay marker that rides with its loop — over arcs above, under below. */
function layD(cx: number, cy: number, ry: number, rot: number, over: boolean) {
  'worklet';
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const y0 = over ? -(ry + 3) : ry + 3;
  const y1 = over ? y0 - 7 : y0 + 7;
  return (
    `M${rx2(cx, -8, y0, c, sn)} ${ry2(cy, -8, y0, c, sn)}` +
    ` Q${rx2(cx, 0, y1, c, sn)} ${ry2(cy, 0, y1, c, sn)} ${rx2(cx, 8, y0, c, sn)} ${ry2(cy, 8, y0, c, sn)}`
  );
}

/**
 * One loop of the coil. It draws in along its own arc (hands working), springs
 * to rest, and then answers the coil's stored twist: radii tighten, the lay
 * angle steepens and the loops crowd together as twist accumulates.
 */
function CoilLoop({ i, sign, writhe, settle, newest }: { i: number; sign: number; writhe: SharedValue<number>; settle: SharedValue<number>; newest: boolean }) {
  const m = useCiMotion();
  const p = useSharedValue(0);
  const e = useSharedValue(0.84);
  const over = sign > 0;
  const cxBase = COIL_X0 + i * COIL_STEP;
  const lean = over ? 1 : -1;

  useEffect(() => {
    cancelAnimation(p);
    cancelAnimation(e);
    if (m.reduce) {
      p.value = 1;
      e.value = 1;
      return;
    }
    p.value = 0;
    e.value = 0.84;
    p.value = withTiming(1, { duration: 250, easing: CI_EASE.out });
    e.value = withSpring(1, CI_SPRING);
    return () => {
      cancelAnimation(p);
      cancelAnimation(e);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.reduce]);

  const loopProps = useAnimatedProps(() => {
    const k = writhe.value;
    const g = e.value * settle.value;
    const rx = COIL_RX * (1 - 0.22 * k) * g;
    const ry = COIL_RY * (1 + 0.13 * k) * g;
    const cx = cxBase - (cxBase - COIL_CENTER) * 0.2 * k;
    const rot = (lean * (10 + 16 * k) * Math.PI) / 180;
    return { d: loopD(cx, COIL_CY, rx, ry, rot), strokeDashoffset: COIL_DASH * (1 - p.value) };
  });

  const markProps = useAnimatedProps(() => {
    const k = writhe.value;
    const g = e.value * settle.value;
    const ry = COIL_RY * (1 + 0.13 * k) * g;
    const cx = cxBase - (cxBase - COIL_CENTER) * 0.2 * k;
    const rot = (lean * (10 + 16 * k) * Math.PI) / 180;
    return { d: layD(cx, COIL_CY, ry, rot, over), opacity: Math.max(0, Math.min(1, (p.value - 0.55) / 0.45)) };
  });

  const loopEdge = useAnimatedProps(() => {
    const k = writhe.value;
    const g = e.value * settle.value;
    const rx = COIL_RX * (1 - 0.22 * k) * g;
    const ry = COIL_RY * (1 + 0.13 * k) * g;
    const cx = cxBase - (cxBase - COIL_CENTER) * 0.2 * k;
    const rot = (lean * (10 + 16 * k) * Math.PI) / 180;
    return { d: loopD(cx, COIL_CY, rx, ry, rot), strokeDashoffset: COIL_DASH * (1 - p.value) };
  });
  const loopSheen = useAnimatedProps(() => {
    const k = writhe.value;
    const g = e.value * settle.value;
    const rx = COIL_RX * (1 - 0.22 * k) * g;
    const ry = COIL_RY * (1 + 0.13 * k) * g;
    const cx = cxBase - (cxBase - COIL_CENTER) * 0.2 * k;
    const rot = (lean * (10 + 16 * k) * Math.PI) / 180;
    return { d: loopD(cx - 0.6, COIL_CY - 0.7, rx, ry, rot), strokeDashoffset: COIL_DASH * (1 - p.value) };
  });

  const restRot = (lean * 10 * Math.PI) / 180;
  const jb = shade(CI_CLASS_TINTS.analog, 0.3);
  const loopCommon = {
    fill: 'none',
    strokeLinecap: 'round' as const,
    opacity: newest ? 1 : 0.82,
    strokeDasharray: COIL_DASH,
    strokeDashoffset: m.reduce ? 0 : COIL_DASH,
  };
  return (
    <G>
      <APath d={loopD(cxBase, COIL_CY, COIL_RX, COIL_RY, restRot)} stroke={shade(CI_CLASS_TINTS.analog, 0.7)} strokeWidth={3.6} {...loopCommon} animatedProps={loopEdge} />
      <APath d={loopD(cxBase, COIL_CY, COIL_RX, COIL_RY, restRot)} stroke={jb} strokeWidth={2.7} {...loopCommon} animatedProps={loopProps} />
      <APath d={loopD(cxBase, COIL_CY, COIL_RX, COIL_RY, restRot)} stroke={lighten(jb, 0.5)} strokeWidth={0.8} {...loopCommon} animatedProps={loopSheen} />
      <APath
        d={layD(cxBase, COIL_CY, COIL_RY, restRot, over)}
        stroke="#9be8f2"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        opacity={m.reduce ? 1 : 0}
        animatedProps={markProps}
      />
    </G>
  );
}

function CoilArt({ w, signs, done }: { w: number; signs: number[]; done: boolean }) {
  const h = Math.round(w * (150 / 360));
  const tint = CI_CLASS_TINTS.analog;
  const m = useCiMotion();
  const twist = Math.abs(signs.reduce((a, b) => a + b, 0));
  // stored twist → how hard the coil fights: barely at all when it cancels
  const writhe = useSettle(Math.max(0, Math.min(1, (twist - 0.5) / 3)), { spring: CI_SPRING });
  const settle = useSharedValue(1);
  const wasDone = useRef(done);

  useEffect(() => {
    if (done && !wasDone.current && !m.reduce) {
      cancelAnimation(settle);
      settle.value = withSequence(
        withTiming(1.07, { duration: 150, easing: CI_EASE.out }),
        withSpring(1, CI_SPRING),
      );
    }
    wasDone.current = done;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, m.reduce]);

  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 150"
      accessibilityLabel={`Coil, training visualization: ${signs.length} of 6 loops made. Over loops lean one way, under loops mirror.`}
    >
      <Rect x={0} y={0} width={360} height={150} rx={10} fill="#0c0c10" />
      {/* cable lead-in from the connector */}
      {/* the lead from its XLR: a real plug, a jacketed tail */}
      <JacketPath d="M24 116 C48 116 66 100 88 92" color={tint} width={3.6} />
      <Connector kind="xlrM" x={26} y={116} k={0.34} angle={180} jacket={shade(tint, 0.3)} />
      {signs.length === 0 ? (
        <Ellipse cx={120} cy={76} rx={30} ry={42} fill="none" stroke="#3a3c42" strokeWidth={1.6} strokeDasharray="6,5" />
      ) : null}
      {signs.map((sign, i) => (
        <CoilLoop key={i} i={i} sign={sign} writhe={writhe} settle={settle} newest={i === signs.length - 1} />
      ))}
      <Callout x={180} y={143} text="OVER LOOPS LEAN ONE WAY — UNDER LOOPS MIRROR" size={10.5} color={PLAN_LABEL} bg={null} />
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function FloorScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const foh = CI_FLOOR_SCENARIOS.find((sc) => sc.id === 'foh-run')!;
  const back = CI_FLOOR_SCENARIOS.find((sc) => sc.id === 'backstage')!;

  const [craft, setCraft] = useState<Record<string, string>>({});
  const [fohPick, setFohPick] = useState<string | null>(null);
  const [backPick, setBackPick] = useState<string | null>(null);
  const [signs, setSigns] = useState<number[]>([]);
  const [coilMistakes, setCoilMistakes] = useState(0);
  // Synchronous mirror (bug hunt 2026-09-29): addLoop read the render-time
  // `signs`, so a same-frame double tap counted one wrong loop as two
  // coilMistakes (and restartCoil could charge the shake-out twice).
  const signsRef = useRef<number[]>([]);
  const firedRef = useRef(completed);

  const artW = Math.max(160, width);

  /* A state */
  const craftAnswered = (id: string) => craft[id] != null;
  const craftOk = (d: CraftDecision) => d.options.find((o) => o.id === craft[d.id])?.ok === true;
  /** Was the decision with this id answered CORRECTLY? (by id, not position) */
  const craftOkById = (id: string) => {
    const d = CRAFT_DECISIONS.find((x) => x.id === id);
    return d ? craftOk(d) : false;
  };
  const craftDone = CRAFT_DECISIONS.every((d) => craftAnswered(d.id));
  /** After a wrong call the learner can still SEE the professional way (a
   *  worked example) — the score keeps the wrong answer. */
  const [shownFix, setShownFix] = useState<Record<string, boolean>>({});
  const drawnFixed = (id: string) => craftOkById(id) || shownFix[id] === true;
  const showFix = (id: string) => {
    setShownFix((f) => ({ ...f, [id]: true }));
    AccessibilityInfo.announceForAccessibility('The plot now shows the professional way.');
  };
  const craftCorrect = CRAFT_DECISIONS.filter((d) => craftOk(d)).length;

  /* D state */
  const expectedSign = (i: number) => (i % 2 === 0 ? 1 : -1);
  const coilDone = signs.length === 6 && signs.every((v, i) => v === expectedSign(i));
  const coilFullWrong = signs.length === 6 && !coilDone;
  const twist = Math.abs(signs.reduce((a, b) => a + b, 0));
  const twistInfo =
    twist === 0
      ? { label: 'NONE — loops cancel', tint: colors.green, frac: 0.06 }
      : twist === 1
        ? { label: 'LOW', tint: colors.green, frac: 0.3 }
        : twist === 2
          ? { label: 'BUILDING', tint: colors.amber, frac: 0.6 }
          : { label: 'HIGH — will fight deployment', tint: '#ff9b8f', frac: Math.min(1, 0.55 + twist * 0.14) };
  const lastWrong =
    signs.length > 0 && signs.length < 6 && signs[signs.length - 1] !== expectedSign(signs.length - 1);
  const stepIdx = signs.length === 0 ? 0 : signs.length === 1 ? 1 : signs.length < 6 ? 2 : 3;

  /* the twist meter SWEEPS and cross-fades — it never jumps */
  const twistBand = twist <= 1 ? 0 : twist === 2 ? 1 : 2;
  const twistSweep = useSettle(twistInfo.frac, { spring: CI_SPRING });
  // the colour cross-fade is a TWEEN, not a spring: a spring would overshoot
  // the band index and flash a colour the twist never actually reached
  const bandT = useTween(twistBand, CI_MOTION.base);
  const twistFillStyle = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, twistSweep.value * 100))}%` }));
  const greenStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(bandT.value - 0)) }));
  const amberStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(bandT.value - 1)) }));
  const redStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(bandT.value - 2)) }));

  const addLoop = (sign: 1 | -1) => {
    const cur = signsRef.current;
    if (coilDone || cur.length >= 6) return;
    const i = cur.length;
    if (sign !== expectedSign(i)) setCoilMistakes((m) => m + 1);
    const nextSigns = [...cur, sign];
    signsRef.current = nextSigns;
    setSigns(nextSigns);
    const t = Math.abs(nextSigns.reduce((a, b) => a + b, 0));
    AccessibilityInfo.announceForAccessibility(
      `Loop ${i + 1} of 6: ${sign > 0 ? 'over' : 'under'}. Twist ${t === 0 ? 'cancelled' : t >= 3 ? 'high' : t === 2 ? 'building' : 'low'}.`,
    );
  };
  const restartCoil = () => {
    if (signsRef.current.length === 0) return;
    signsRef.current = [];
    setSigns([]);
    setCoilMistakes((m) => m + 1);
    AccessibilityInfo.announceForAccessibility('Coil shaken out — start again with a natural over loop.');
  };

  const pickCraft = (d: CraftDecision, o: CraftOption) => {
    if (craftAnswered(d.id)) return;
    // keep-first (bug hunt 2026-09-29): a same-frame second tap must not
    // replace the locked call
    setCraft((c) => (c[d.id] != null ? c : { ...c, [d.id]: o.id }));
    AccessibilityInfo.announceForAccessibility(o.ok ? 'Good call.' : 'Not the professional call.');
  };

  const pickRoute = (which: 'foh' | 'back', id: string) => {
    if (which === 'foh') {
      if (fohPick != null) return;
      setFohPick((p) => p ?? id);
    } else {
      if (backPick != null) return;
      setBackPick((p) => p ?? id);
    }
    AccessibilityInfo.announceForAccessibility('Route selected — all three verdicts revealed below.');
  };

  /* completion */
  const allDone = craftDone && fohPick != null && backPick != null && coilDone;
  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    const fohDims = evaluateRoute(foh.options.find((o) => o.id === fohPick)!).dims;
    const backDims = evaluateRoute(back.options.find((o) => o.id === backPick)!).dims;
    const safety = Math.round(((fohDims.safety ?? 100) + (backDims.safety ?? 100)) / 2);
    const protection = Math.round(((fohDims.protection ?? 100) + (backDims.protection ?? 100)) / 2);
    const coilQuality = Math.max(0.5, 1 - 0.1 * coilMistakes);
    const workmanship = Math.round((craftCorrect / 3) * 50 + coilQuality * 50);
    announceComplete('Stage 9 complete.');
    onComplete({ safety, protection, workmanship });
  }, [allDone, fohPick, backPick, coilMistakes, craftCorrect, foh, back, onComplete]);

  /* ── the controls that change each drawing — rendered on the page AND
     docked under the drawing in full screen (owner 2026-09-25: "the user must
     still be able to adjust and view their changes to controls"). State lives
     here; the elements are simply rendered twice. ─────────────────────── */
  const craftDock = (
    <View style={{ gap: 10, paddingHorizontal: 12 }}>
      {CRAFT_DECISIONS.map((d) => {
        const answered = craftAnswered(d.id);
        const chosen = d.options.find((o) => o.id === craft[d.id]);
        return (
          <View key={d.id} style={{ gap: 6 }}>
            <Text style={s.prompt}>{d.prompt}</Text>
            <View style={s.chipWrap}>
              {d.options.map((o) => (
                <OptionChip
                  key={o.id}
                  label={o.label}
                  active={craft[d.id] === o.id}
                  disabled={answered && craft[d.id] !== o.id}
                  onPress={() => pickCraft(d, o)}
                />
              ))}
            </View>
            {chosen ? (
              <Text style={[s.dockVerdict, { color: chosen.ok ? colors.green : '#ff9b8f' }]}>
                {chosen.ok ? '✓ ' : '✕ '}
                {chosen.short}
              </Text>
            ) : null}
            {chosen && !chosen.ok && !shownFix[d.id] ? (
              <OptionChip action label="SHOW THE PROFESSIONAL WAY" onPress={() => showFix(d.id)} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
  const coilDock = (
    <View style={{ gap: 8 }}>
      <Text style={s.loopCount} accessibilityLiveRegion="polite">{`LOOP ${signs.length} / 6`}</Text>
      <View
        style={s.twistRow}
        accessibilityLabel={`Twist stored in the cable: ${twistInfo.label}`}
        accessibilityLiveRegion="polite"
      >
        <Text style={s.twistLabel}>TWIST</Text>
        <View style={s.twistTrack}>
          <Animated.View style={[s.twistFill, { backgroundColor: colors.green }, twistFillStyle, greenStyle]} />
          <Animated.View style={[s.twistFill, { backgroundColor: colors.amber }, twistFillStyle, amberStyle]} />
          <Animated.View style={[s.twistFill, { backgroundColor: '#ff9b8f' }, twistFillStyle, redStyle]} />
        </View>
        <Text style={[s.twistReadout, { color: twistInfo.tint }]} numberOfLines={1}>
          {twistInfo.label}
        </Text>
      </View>
      {lastWrong ? (
        <Appear>
          <Text style={s.warnLine}>⚠ Twist is building — the next loop should be the reverse lay.</Text>
        </Appear>
      ) : null}
      <View style={s.loopBtnRow}>
        <Pressable
          style={[s.loopBtn, (coilDone || signs.length >= 6) && s.loopBtnOff]}
          disabled={coilDone || signs.length >= 6}
          onPress={() => addLoop(1)}
          accessibilityRole="button"
          accessibilityLabel="Over loop — natural lay"
        >
          <Text style={s.loopBtnText}>OVER LOOP</Text>
          <Text style={s.loopBtnSub}>natural lay — palm over</Text>
        </Pressable>
        <Pressable
          style={[s.loopBtn, (coilDone || signs.length >= 6) && s.loopBtnOff]}
          disabled={coilDone || signs.length >= 6}
          onPress={() => addLoop(-1)}
          accessibilityRole="button"
          accessibilityLabel="Under loop — reverse, roll the wrist"
        >
          <Text style={s.loopBtnText}>UNDER LOOP</Text>
          <Text style={s.loopBtnSub}>reverse — roll the wrist</Text>
        </Pressable>
      </View>
    </View>
  );

  const checkParts = [
    { label: 'STAGE CRAFT', done: craftDone },
    { label: 'FOH RUN', done: fohPick != null },
    { label: 'BACKSTAGE', done: backPick != null },
    { label: 'COIL', done: coilDone },
  ];

  return (
    <View style={{ gap: 16 }}>
      {completed ? <Text style={s.replayNote}>✓ Stage already recorded complete — replay freely.</Text> : null}

      {/* (A) STAGE CRAFT */}
      <CiSection title="STAGE CRAFT — CLEAN UP THE DECK">
        <Text style={s.lead}>
          Soundcheck in an hour. The deck is as found — the numbered badges mark three hazards: ① mic lines webbed
          across the playing area, ② spare cable in loose loops, ③ monitor feeds bare across the deck. Make three calls —
          the plot redraws each part the professional way as you get it right.
        </Text>
        {/* The plan may only redraw a part "the professional way" once the call
            was actually CORRECT (fix 2026-08-28). This was keyed on
            `craftAnswered`, so picking the wrong option still redrew the fix —
            the art (and its accessibility label, which asserts "edge-routed
            clear of the performer lane") rewarded a wrong answer while the
            feedback directly beneath it said "bad". */}
        <ExpandableFigure
          width={artW}
          aspect={360 / 205}
          title="STAGE PLAN"
          badge="Training visualization — stage plot to scale (1 m grid); teaching colors, field cable colors vary."
          render={(w) => (
            <StagePlan w={w} routeFixed={drawnFixed('route')} slackFixed={drawnFixed('slack')} monFixed={drawnFixed('mon')} />
          )}
          controls={craftDock}
        />
        <Text style={s.caption}>
          Training visualization — stage plot to scale (faint grid = 1 m), in the lab’s teaching colors (field cable
          colors vary): cyan = mic lines · yellow = monitor (loudspeaker) feeds · grey = multicores (trunk to FOH, split to
          MON, drum sub-snake) · red = AC power to quad boxes · grey strips = gaffer tape · yellow-lidded ramp = low-profile cover at the stair ·
          dashed = the way performers come up the stair. The amp, keys and split lines were already dressed right.
        </Text>
        <View style={{ gap: 12 }}>
          {CRAFT_DECISIONS.map((d, di) => {
            const answered = craftAnswered(d.id);
            const chosen = d.options.find((o) => o.id === craft[d.id]);
            return (
              <Stagger key={d.id} index={di} style={{ gap: 7 }}>
                <Text style={s.prompt}>{d.prompt}</Text>
                <View style={s.chipWrap}>
                  {d.options.map((o) => (
                    <OptionChip
                      key={o.id}
                      label={o.label}
                      active={craft[d.id] === o.id}
                      disabled={answered && craft[d.id] !== o.id}
                      onPress={() => pickCraft(d, o)}
                    />
                  ))}
                </View>
                {chosen ? (
                  <Appear delay={RETRACT_MS}>
                    <RuleFeedback ruleId="floor-stage-craft" verdict={chosen.ok ? 'good' : 'bad'} short={chosen.short} openSources={openSources} />
                    {!chosen.ok && !shownFix[d.id] ? (
                      <View style={{ marginTop: 7 }}>
                        <OptionChip action label="SHOW THE PROFESSIONAL WAY ON THE PLOT" onPress={() => showFix(d.id)} />
                      </View>
                    ) : null}
                  </Appear>
                ) : null}
              </Stagger>
            );
          })}
        </View>
      </CiSection>

      {/* (B) FOH RUN */}
      <CiSection title="THE FOH RUN — PICK A ROUTE, THEN SEE ALL THREE JUDGED">
        <RouteBlock
          scenario={foh}
          width={artW}
          title="FOH RUN"
          plan={(w, p) => <FohPlan w={w} pick={p} />}
          pick={fohPick}
          onPick={(id) => pickRoute('foh', id)}
          openSources={openSources}
          keyPoint={{
            head: 'RAMP ≠ PERMISSION',
            body:
              'A cable ramp does not automatically make a crossing acceptable. The protector must suit the actual loads and traffic — and egress and accessibility requirements still apply to the route it sits in.',
          }}
        />
      </CiSection>

      {/* (C) BACKSTAGE */}
      <CiSection title="BACKSTAGE — CROSS THE LOAD-IN PATH">
        <RouteBlock
          scenario={back}
          width={artW}
          title="BACKSTAGE"
          plan={(w, p) => <BackstagePlan w={w} pick={p} />}
          pick={backPick}
          onPick={(id) => pickRoute('back', id)}
          openSources={openSources}
          keyPoint={{
            head: 'PROTECTION MATCHES THE TRAFFIC',
            body:
              'A mat is not load-rated protection. Where cases and forklifts roll, the crossing needs a vehicle-rated protector — deliberate, marked, and clear of the door swing.',
          }}
        />
      </CiSection>

      {/* (D) OVER-UNDER COILING */}
      <CiSection title="STRIKE — COIL THE SNAKE OVER-UNDER">
        <Text style={s.lead}>
          Coil the snake so it deploys straight tomorrow: alternate a natural OVER loop with a reversed UNDER loop, six
          loops total. Watch the coil — and the twist you are storing in the cable.
        </Text>
        <ExpandableFigure
          width={artW}
          aspect={360 / 150}
          title="COIL"
          badge="Training visualization — training tint; field cable colors vary."
          render={(w) => <CoilArt w={w} signs={signs} done={coilDone} />}
          controls={<View style={{ paddingHorizontal: 12 }}>{coilDock}</View>}
        />
        {!coilDone && !coilFullWrong ? <Text style={s.coach}>{CI_OVERUNDER_STEPS[stepIdx]}</Text> : null}
        {coilDock}
        {coilFullWrong ? (
          <Appear>
            <View style={s.coilFailCard}>
              <Text style={s.coilFailText}>
                ✕ This coil is storing twist — it will deploy in loops and kinks. Shake it out and start again, alternating
                from a natural OVER loop.
              </Text>
              <Pressable style={s.restartBtn} onPress={restartCoil} accessibilityRole="button" accessibilityLabel="Restart the coil">
                <Text style={s.restartText}>RESTART THE COIL</Text>
              </Pressable>
            </View>
          </Appear>
        ) : null}
        {!coilDone && !coilFullWrong && signs.length > 0 ? (
          <Pressable onPress={restartCoil} hitSlop={10} accessibilityRole="button" accessibilityLabel="Restart the coil">
            <Text style={s.restartLink}>↺ RESTART THE COIL</Text>
          </Pressable>
        ) : null}
        {coilDone ? (
          <Appear delay={220}>
            <View style={{ gap: 8 }}>
              <Text style={s.doneLine}>✓ Over, under, over, under — this coil pays out straight.</Text>
              <RuleFeedback
                ruleId="floor-overunder"
                verdict="info"
                short="Over-under cancels the twist each loop adds — the coil deploys straight and the cable keeps its behavior. Specialized fiber, hybrid and large feeder cable follow the manufacturer's procedure instead."
                openSources={openSources}
              />
            </View>
          </Appear>
        ) : null}
      </CiSection>

      <Text style={[s.checkLine, allDone && { color: colors.green }]} accessibilityLiveRegion="polite">
        {checkParts.map((p) => `${p.done ? '✓' : '○'} ${p.label}`).join('   ')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  replayNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.green },
  prompt: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textPrimary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    minHeight: 56,
  },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  routeName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary, flexShrink: 1 },
  routePath: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  verdictCard: { gap: 8, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  verdictCardPicked: { borderColor: 'rgba(255,198,77,.6)' },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeBest: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.green },
  badgePick: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.amber },
  overallLine: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.amberLabel },
  /** Matches RouteScene's `tagReject` so the two scenes speak one language. */
  badgeReject: {
    alignSelf: 'flex-start',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: '#ff8d80',
    borderWidth: 1,
    borderColor: 'rgba(255,110,95,.55)',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLabel: { width: 118, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.3, color: colors.textSub },
  miniTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#26262c', overflow: 'hidden' },
  miniFill: { height: 6, borderRadius: 3 },
  miniVal: { width: 26, textAlign: 'right', fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSecondary },
  noteLine: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSub },
  keyCard: { gap: 5, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  keyHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  keyBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  coach: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.amberLabel, fontStyle: 'italic' },
  dockVerdict: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  loopCount: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  twistRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  twistTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#26262c', overflow: 'hidden' },
  twistFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5 },
  twistLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSecondary },
  twistReadout: { maxWidth: 150, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.4 },
  warnLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: '#ff9b8f' },
  loopBtnRow: { flexDirection: 'row', gap: 10 },
  loopBtn: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(79,208,224,.5)',
    backgroundColor: '#0f1a1d',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  loopBtnOff: { opacity: 0.45 },
  loopBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: '#9be8f2' },
  loopBtnSub: { fontFamily: fonts.barlowRegular, fontSize: 11, color: colors.textSub },
  coilFailCard: { gap: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#ff9b8f', backgroundColor: '#1a1210', padding: 12 },
  coilFailText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: '#ff9b8f' },
  restartBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingHorizontal: 16,
  },
  restartText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.textPrimary },
  restartLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub, paddingVertical: 6 },
  doneLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.green },
  checkLine: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6, color: colors.amberLabel },
});
